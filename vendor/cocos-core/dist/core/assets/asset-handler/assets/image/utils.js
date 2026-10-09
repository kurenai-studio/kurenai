"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultIconConfig = void 0;
exports.makeDefaultTextureCubeAssetUserData = makeDefaultTextureCubeAssetUserData;
exports.makeDefaultTexture2DAssetUserData = makeDefaultTexture2DAssetUserData;
exports.makeDefaultTexture2DAssetUserDataFromImagePath = makeDefaultTexture2DAssetUserDataFromImagePath;
exports.makeDefaultTexture2DAssetUserDataFromImageUuid = makeDefaultTexture2DAssetUserDataFromImageUuid;
exports.makeDefaultSpriteFrameAssetUserData = makeDefaultSpriteFrameAssetUserData;
exports.makeDefaultSpriteFrameAssetUserDataFromImageUuid = makeDefaultSpriteFrameAssetUserDataFromImageUuid;
exports.saveImageAsset = saveImageAsset;
exports.isCapableToFixAlphaTransparencyArtifacts = isCapableToFixAlphaTransparencyArtifacts;
exports.handleImageUserData = handleImageUserData;
exports.importWithType = importWithType;
exports.converImage = converImage;
exports.openImageAsset = openImageAsset;
const cc_1 = require("cc");
const fs_extra_1 = require("fs-extra");
const sharp_1 = __importDefault(require("sharp"));
const utils_1 = require("../../utils");
const bleeding_1 = require("../utils/algorithm/bleeding");
const texture_base_1 = require("../texture-base");
const RGBChannels = 3;
const RGBAChannels = 4;
function makeDefaultTextureCubeAssetUserData() {
    const userData = (0, texture_base_1.makeDefaultTextureBaseAssetUserData)();
    userData.isRGBE = false;
    userData.mipfilter = 'linear';
    return userData;
}
function makeDefaultTexture2DAssetUserData() {
    return (0, texture_base_1.makeDefaultTextureBaseAssetUserData)();
}
function makeDefaultTexture2DAssetUserDataFromImagePath(path) {
    return Object.assign((0, texture_base_1.makeDefaultTextureBaseAssetUserData)(), {
        isUuid: false,
        imageUuidOrDatabaseUri: path,
    });
}
function makeDefaultTexture2DAssetUserDataFromImageUuid(uuid, extName) {
    const defaultUserData = (0, texture_base_1.makeDefaultTextureBaseAssetUserData)();
    if (extName && ['.exr', '.hdr', '.znt'].includes(extName)) {
        defaultUserData.mipfilter = 'none';
        defaultUserData.minfilter = 'nearest';
        defaultUserData.magfilter = 'nearest';
    }
    return Object.assign(defaultUserData, {
        isUuid: true,
        imageUuidOrDatabaseUri: uuid,
    });
}
function makeDefaultSpriteFrameAssetUserData() {
    return (0, texture_base_1.makeDefaultSpriteFrameBaseAssetUserData)();
}
function makeDefaultSpriteFrameAssetUserDataFromImageUuid(uuid, atlas) {
    return Object.assign((0, texture_base_1.makeDefaultSpriteFrameBaseAssetUserData)(), {
        isUuid: true,
        imageUuidOrDatabaseUri: uuid,
        atlasUuid: atlas,
    });
}
async function saveImageAsset(asset, imageDataBufferOrimagePath, extName, displayName) {
    // Save the image data into library.
    if (typeof imageDataBufferOrimagePath === 'string') {
        await asset.copyToLibrary(extName, imageDataBufferOrimagePath);
    }
    else {
        await asset.saveToLibrary(extName, imageDataBufferOrimagePath);
    }
    // Create the image asset.
    const image = new cc_1.ImageAsset();
    image.name = displayName;
    image._setRawAsset(extName);
    const serializeJSON = EditorExtends.serialize(image);
    await asset.saveToLibrary('.json', serializeJSON);
    const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
    asset.setData('depends', depends);
}
exports.defaultIconConfig = {
    type: 'icon',
    value: 'image',
};
/** 返回一个资源是否可以被消除阴影 */
function isCapableToFixAlphaTransparencyArtifacts(asset, type, extName) {
    const disableTypes = ['normal map', 'texture cube', 'sprite-frame', 'texture'];
    if (disableTypes.includes(type)) {
        return false;
    }
    const formatName = extName.toLocaleLowerCase().replace('.', '');
    const userData = asset.userData;
    const bannedFormatList = ['hdr', 'exr'];
    return !bannedFormatList.includes(formatName) && !userData.isRGBE;
}
async function handleImageUserData(asset, imageDataBufferOrimagePath, rawExtName) {
    if (typeof imageDataBufferOrimagePath === 'string') {
        imageDataBufferOrimagePath = await (0, fs_extra_1.readFile)(imageDataBufferOrimagePath);
    }
    const userData = asset.userData;
    const sharpResult = (0, sharp_1.default)(imageDataBufferOrimagePath);
    const metaData = await sharpResult.metadata();
    userData.hasAlpha = metaData.hasAlpha;
    userData.type ||= 'texture';
    // Do flip if needed.
    const flipVertical = !!userData.flipVertical;
    if (flipVertical) {
        imageDataBufferOrimagePath = await sharpResult.flip().toBuffer();
    }
    if (userData.fixAlphaTransparencyArtifacts && metaData.hasAlpha) {
        userData.fixAlphaTransparencyArtifacts = true;
        let imgObject = await (0, sharp_1.default)(imageDataBufferOrimagePath);
        const meta = await imgObject.metadata();
        // 强制 pipeline 使用 sRGB，避免线性转换 + sRGB 转换导致 16 bit 的图片在转换成 8 bit 的时候出现颜色偏差
        if (meta.depth === 'ushort') {
            imgObject = imgObject.pipelineColourspace('srgb').toColourspace('srgb');
        }
        const img = await imgObject.raw().toBuffer();
        /**
         * sharp 库获取含 alpha 通道的 png 图片的原始 buffer 的时候,会将图片展成四个通道。
         * 部分情况下会是有透明度的使用灰度通道的 Png ,这个时候通道数量为 2 所以不能够使用原图的通道数，
         * 因此将通道数强制设置为 4
         */
        let hasPurelyTransparentPixel = false;
        for (let index = 0; index < img.length; index += RGBAChannels) {
            const alpha = img[index + 3 /* Color.Alpha */];
            if (alpha === 0) {
                hasPurelyTransparentPixel = true;
                break;
            }
        }
        if (hasPurelyTransparentPixel) {
            const newBuffer = Buffer.from(img);
            //   offset
            //   . . .
            //   . o .
            //   . . .
            const sampleXOffsets = [-1, 0, 1, -1, 1, -1, 0, 1];
            const sampleYOffsets = [-1, -1, -1, 0, 0, 1, 1, 1];
            const bufIdxOffsets = [];
            const ditch = metaData.width * RGBAChannels;
            for (let j = 0; j < sampleXOffsets.length; j++) {
                bufIdxOffsets[j] = sampleXOffsets[j] * RGBAChannels + sampleYOffsets[j] * ditch;
            }
            (0, bleeding_1.applyContourBleed)(newBuffer, img, metaData.width, new cc_1.Rect(0, 0, metaData.width, metaData.height), sampleXOffsets, sampleYOffsets, bufIdxOffsets);
            imageDataBufferOrimagePath = await (0, sharp_1.default)(newBuffer, {
                raw: {
                    channels: RGBAChannels,
                    height: metaData.height,
                    width: metaData.width,
                },
            })
                .toFormat('png')
                .toBuffer();
        }
    }
    // flip green channel
    if (userData.flipGreenChannel) {
        const sharpResult = await (0, sharp_1.default)(imageDataBufferOrimagePath);
        const { width, height } = await sharpResult.metadata();
        const buffer = await sharpResult.raw().toBuffer();
        const channels = (buffer.length / width / height);
        const startIndex = 1 /* Color.Green */;
        for (let index = startIndex; index < buffer.length; index = channels + index) {
            buffer[index] = 255 - buffer[index];
        }
        const opts = { raw: { width: width, height: height, channels: channels } };
        imageDataBufferOrimagePath = await (0, sharp_1.default)(buffer, opts).toFormat('png').toBuffer();
    }
    return imageDataBufferOrimagePath;
}
async function importWithType(asset, type, displayName, extName) {
    const userData = asset.userData;
    switch (type) {
        case 'texture':
            {
                const texture2DSubAsset = await asset.createSubAsset('texture', 'texture', {
                    displayName,
                });
                userData.redirect = texture2DSubAsset.uuid;
                texture2DSubAsset.assignUserData(makeDefaultTexture2DAssetUserDataFromImageUuid(asset.uuid, extName));
                texture2DSubAsset.userData.imageUuidOrDatabaseUri = asset.uuid;
                texture2DSubAsset.userData.visible = false;
            }
            break;
        case 'normal map':
            {
                const normal2DSubAsset = await asset.createSubAsset('normalMap', 'texture', {
                    displayName,
                });
                normal2DSubAsset.assignUserData(makeDefaultTexture2DAssetUserDataFromImageUuid(asset.uuid));
            }
            break;
        case 'texture cube':
            {
                const textureCubeSubAsset = await asset.createSubAsset('textureCube', 'erp-texture-cube', {
                    displayName,
                });
                textureCubeSubAsset.assignUserData(makeDefaultTextureCubeAssetUserData());
                textureCubeSubAsset.userData.imageDatabaseUri = asset.uuid;
                textureCubeSubAsset.userData.isRGBE = !!userData.isRGBE;
            }
            break;
        case 'sprite-frame':
            {
                // const sprite2DSubAsset = await asset.createSubAsset(asset.basename, 'texture');
                const texture2DSubAssetWithSprite = await asset.createSubAsset('texture', 'texture', {
                    displayName,
                });
                texture2DSubAssetWithSprite.userData.wrapModeS = texture2DSubAssetWithSprite.userData.wrapModeS || 'clamp-to-edge';
                texture2DSubAssetWithSprite.userData.wrapModeT = texture2DSubAssetWithSprite.userData.wrapModeT || 'clamp-to-edge';
                userData.redirect = texture2DSubAssetWithSprite.uuid;
                texture2DSubAssetWithSprite.userData.imageUuidOrDatabaseUri = asset.uuid;
                texture2DSubAssetWithSprite.userData.isUuid = true;
                texture2DSubAssetWithSprite.userData.visible = false;
                const textureSpriteFrameSubAsset = await asset.createSubAsset('spriteFrame', 'sprite-frame', {
                    displayName,
                });
                textureSpriteFrameSubAsset.assignUserData(makeDefaultSpriteFrameAssetUserDataFromImageUuid(texture2DSubAssetWithSprite.uuid, ''));
                textureSpriteFrameSubAsset.userData.imageUuidOrDatabaseUri = texture2DSubAssetWithSprite.uuid;
            }
            break;
    }
}
async function converImage() { }
async function openImageAsset(asset) {
    // TODO: 实现打开图片资产
    return false;
}
