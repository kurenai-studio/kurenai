'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturePackerHandler = void 0;
exports._parseFloat2 = _parseFloat2;
exports._parseRect = _parseRect;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const cc_1 = require("cc");
const utils_1 = require("../utils");
const utils_2 = require("./image/utils");
const plist = require('plist');
exports.TexturePackerHandler = {
    name: 'sprite-atlas',
    // 引擎内对应的类型
    assetType: 'cc.SpriteAtlas',
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '1.0.8',
        async import(asset) {
            // await asset.copyToLibrary(ext, asset.source);
            // atlas 最外层 userData 包含大图的 size，图片名 atlasTextureName，以及图片的 uuid textureUuid
            // 图集贴图都放置在 submeta 下
            // 数据 atlas 填充
            const userData = asset.userData;
            const file = await (0, fs_extra_1.readFile)(asset.source, 'utf8');
            // @ts-ignore
            const data = plist.parse(file);
            const metadata = data.metadata;
            // @ts-ignore
            userData.atlasTextureName = metadata.realTextureFileName || metadata.textureFileName;
            // @ts-ignore
            userData.format = metadata.format;
            userData.uuid = asset.uuid;
            // 标记依赖资源
            if (asset._assetDB) {
                const textureBaseName = (0, path_1.basename)(userData.atlasTextureName);
                const texturePath = (0, path_1.join)((0, path_1.dirname)(asset.source), textureBaseName);
                if (!(0, fs_extra_1.existsSync)(texturePath)) {
                    console.warn('Parse Error: Unable to find file Texture, the path: ' + texturePath);
                }
                asset.depend(texturePath);
                const uuid = asset._assetDB.pathToUuid(texturePath);
                if (!uuid) {
                    return false;
                }
                userData.textureUuid = uuid + '@' + require('@cocos/asset-db').nameToId('texture');
            }
            // 如果依赖的资源已经导入完成了，则生成对应的数据
            if (asset.userData.textureUuid && asset._assetDB) {
                const ext_replacer = /\.[^.]+$/;
                let keyNoExt = '';
                // @ts-ignore
                const keys = Object.keys(data.frames);
                // @ts-ignore
                const spriteAtlas = new cc_1.SpriteAtlas();
                spriteAtlas.name = asset.basename || '';
                for (const key of keys) {
                    keyNoExt = key.replace(ext_replacer, '');
                    // 数据 atlas 内 spriteFrame 填充
                    // @ts-ignore
                    const f = data.frames[key];
                    const atlasSubAsset = await asset.createSubAsset(keyNoExt, 'sprite-frame');
                    const frameData = fillFrameData(f, userData);
                    frameData.borderBottom = frameData.borderBottom | atlasSubAsset.userData.borderBottom;
                    frameData.borderTop = frameData.borderTop | atlasSubAsset.userData.borderTop;
                    frameData.borderLeft = frameData.borderLeft | atlasSubAsset.userData.borderLeft;
                    frameData.borderRight = frameData.borderRight | atlasSubAsset.userData.borderRight;
                    // asset.userData.redirect = atlasSubAsset.uuid;
                    // packable 如果有值，就使用 userData 里的值，不需要覆盖
                    if ('packable' in atlasSubAsset.userData) {
                        frameData['packable'] = atlasSubAsset.userData['packable'];
                    }
                    atlasSubAsset.assignUserData(frameData, true);
                    atlasSubAsset.userData.imageUuidOrDatabaseUri = frameData.imageUuidOrDatabaseUri;
                    // @ts-ignore
                    spriteAtlas.spriteFrames[keyNoExt] = EditorExtends.serialize.asAsset(atlasSubAsset.uuid, cc_1.SpriteFrame);
                }
                const serializeJSON = EditorExtends.serialize(spriteAtlas);
                await asset.saveToLibrary('.json', serializeJSON);
                const depends = (0, utils_1.getDependUUIDList)(serializeJSON);
                asset.setData('depends', depends);
            }
            return true;
        },
    },
    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset) {
        try {
            const data = plist.parse(await (0, fs_extra_1.readFile)(asset.source, 'utf8'));
            return typeof data.frames !== 'undefined' && typeof data.metadata !== 'undefined';
        }
        catch (e) {
            return false;
        }
    },
};
exports.default = exports.TexturePackerHandler;
function fillFrameData(frameData, userData) {
    const format = userData.format;
    const data = (0, utils_2.makeDefaultSpriteFrameAssetUserDataFromImageUuid)(userData.textureUuid, userData.uuid);
    let rotated = false;
    let sourceSize = '';
    let offsetStr = '';
    let textureRect = '';
    if (format === 1 || format === 2) {
        rotated = frameData.rotated;
        sourceSize = frameData.sourceSize;
        offsetStr = frameData.offset;
        textureRect = frameData.frame;
    }
    else if (format === 3) {
        rotated = frameData.textureRotated;
        sourceSize = frameData.spriteSourceSize;
        offsetStr = frameData.spriteOffset;
        textureRect = frameData.textureRect;
    }
    data.rotated = rotated;
    const originSize = _parseFloat2(sourceSize, cc_1.Size);
    data.rawWidth = originSize.width;
    data.rawHeight = originSize.height;
    const rect = _parseRect(textureRect);
    data.trimX = rect.x;
    data.trimY = rect.y;
    data.width = rect.width;
    data.height = rect.height;
    const offset = _parseFloat2(offsetStr, cc_1.Vec2);
    data.offsetX = offset.x;
    data.offsetY = offset.y;
    return data;
}
const BRACE_REGEX = /[\{\}]/g; // eslint-disable-line no-useless-escape
function _parseFloat2(data, Ctor) {
    const arr = data.slice(1, -1).split(',');
    return new Ctor(parseFloat(arr[0]), parseFloat(arr[1]));
}
function _parseRect(rectStr) {
    rectStr = rectStr.replace(BRACE_REGEX, '');
    const arr = rectStr.split(',');
    return new cc_1.Rect(parseFloat(arr[0] || '0'), parseFloat(arr[1] || '0'), parseFloat(arr[2] || '0'), parseFloat(arr[3] || '0'));
}
