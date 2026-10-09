"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpriteFrameInfo = exports.AtlasInfo = exports.PacInfo = exports.DefaultPackOption = void 0;
exports.createAssetInstance = createAssetInstance;
exports.createApriteAtlasFromAtlas = createApriteAtlasFromAtlas;
exports.createTextureFromAtlas = createTextureFromAtlas;
exports.applyTextureBaseAssetUserData = applyTextureBaseAssetUserData;
exports.generateSpriteFrame = generateSpriteFrame;
/**
 * 此文件依赖了许多引擎接口，注意版本升级影响
 */
const cc_1 = require("cc");
const path_1 = require("path");
const asset_library_1 = require("../../manager/asset-library");
const HashUuid = __importStar(require("../../utils/hash-uuid"));
const utils_1 = __importDefault(require("../../../../../base/utils"));
const lodash_1 = __importDefault(require("lodash"));
const builder_config_1 = __importDefault(require("../../../../share/builder-config"));
exports.DefaultPackOption = {
    maxWidth: 1024,
    maxHeight: 1024,
    // padding of image.
    padding: 2,
    allowRotation: true,
    forceSquared: false,
    powerOfTwo: false,
    algorithm: 'MaxRects',
    format: 'png',
    quality: 80,
    contourBleed: true,
    paddingBleed: true,
    filterUnused: true,
    removeTextureInBundle: true,
    removeImageInBundle: true,
    removeSpriteAtlasInBundle: true,
    compressSettings: {},
    bleed: 0,
    mode: 'build',
};
/**
 * 一个图集信息
 */
class PacInfo {
    spriteFrameInfos = [];
    spriteFrames = [];
    relativePath = '';
    relativeDir = '';
    path = '';
    uuid = '';
    imagePath = '';
    imageUuid = '';
    textureUuid = ''; // Texture2D
    name = 'autoatlas';
    width = 1024;
    height = 1024;
    dirty = false;
    packOptions = JSON.parse(JSON.stringify(exports.DefaultPackOption));
    storeInfo;
    result;
    constructor(pacAsset, options) {
        this.uuid = pacAsset.uuid;
        // 在 db 进程内取得得 meta 数据需要深拷贝避免影响原数据
        let userData = JSON.parse(JSON.stringify(pacAsset.meta.userData));
        userData = options ? Object.assign(userData, options) : userData;
        // TODO 可能会有非法数据被 assign
        this.packOptions = Object.assign(this.packOptions, userData);
        this.packOptions.bleed = this.packOptions.paddingBleed ? 1 : 0;
        this.path = pacAsset.url;
        // 参与缓存计算的数据
        this.storeInfo = {
            pac: {
                uuid: pacAsset.uuid,
                mtime: asset_library_1.buildAssetLibrary.getAssetProperty(pacAsset, 'mtime'),
            },
            sprites: [],
            options: this.packOptions,
        };
        const assetsPath = (0, path_1.join)(builder_config_1.default.projectRoot, 'assets');
        this.relativePath = (0, path_1.relative)(assetsPath, pacAsset.source);
        this.relativeDir = (0, path_1.relative)(assetsPath, (0, path_1.dirname)(pacAsset.source));
        this.name = asset_library_1.buildAssetLibrary.getAssetProperty(pacAsset, 'name');
    }
    async initSpriteFramesWithRange(includeAssets) {
        const spriteFrameAssets = await this.queryInvalidSpriteAssets(includeAssets);
        if (!spriteFrameAssets.length) {
            return this;
        }
        await this.initSpriteFrames(spriteFrameAssets);
        return this;
    }
    /**
     * @param {Object} pacAssetInfo 从 db 中获取出来的 pac 信息
     */
    async initSpriteFrames(spriteFrameAssets) {
        let spriteFrameInfos = await Promise.all(spriteFrameAssets.map(async (asset) => {
            if (cc_1.assetManager.assets.has(asset.uuid)) {
                cc_1.assetManager.releaseAsset(cc_1.assetManager.assets.get(asset.uuid));
            }
            return new Promise((resolve, reject) => {
                cc_1.assetManager.loadAny(asset.uuid, (err, spriteFrame) => {
                    // 此处的错误处理都不 reject ，全部执行完后续会过滤非法数据
                    if (err || !spriteFrame) {
                        console.error(`sprite frame can't be load:${asset.uuid}, will remove it from atlas.`);
                        err && console.error(err);
                        resolve(null);
                        return;
                    }
                    try {
                        const spriteFrameInfo = new SpriteFrameInfo(spriteFrame, asset, this.packOptions);
                        spriteFrameInfo._pacUuid = this.uuid;
                        this.spriteFrames.push(spriteFrame);
                        resolve(spriteFrameInfo);
                    }
                    catch (error) {
                        console.error(`packer: load sprite frame failed:${asset.uuid}`);
                        console.error(error);
                        resolve(null);
                    }
                });
            });
        }));
        // 移除 无效的 sprite frame
        spriteFrameInfos = spriteFrameInfos.filter((info) => info != null);
        // 对 图片 进行排序，确保每次重新计算合图后的结果是稳定的。
        // 该排序只影响合图解析碎图的顺序，最终图集中的排序与合图算法有关，只有当图集中有相同尺寸的碎图时该排序才会产生作用。
        spriteFrameInfos = lodash_1.default.sortBy(spriteFrameInfos, 'uuid');
        this.spriteFrameInfos = spriteFrameInfos;
        this.storeInfo.sprites = this.spriteFrameInfos.map((info) => info.toJSON());
        return this;
    }
    async queryInvalidSpriteAssets(_includeAssets) {
        // 去 db 查询理论上会比在同进程 cache 里查询的慢 TODO
        const assets = await asset_library_1.buildAssetLibrary.queryAssetsByOptions({
            pattern: (0, path_1.dirname)(this.path) + '/**/*',
            importer: 'sprite-frame',
        });
        let spriteFrameAssets = [];
        // 过滤配置了不参与自动图集或者不在指定资源范围内的 sprite
        for (const asset of assets) {
            if (!asset.meta.userData.packable) {
                continue;
            }
            if (!this.packOptions.filterUnused) {
                spriteFrameAssets.push(asset);
                continue;
            }
            else if (this.packOptions.filterUnused && (!_includeAssets || _includeAssets.includes(asset.uuid))) {
                spriteFrameAssets.push(asset);
                continue;
            }
        }
        if (!spriteFrameAssets || spriteFrameAssets.length === 0) {
            return [];
        }
        // 查找子目录下的所有 pac 文件
        const subPacAssets = await asset_library_1.buildAssetLibrary.queryAssetsByOptions({
            pattern: (0, path_1.dirname)(this.path) + '/*/**/*.pac',
        });
        const subPacDirs = subPacAssets.map((subPac) => (0, path_1.dirname)(subPac.source));
        /// 查找子文件夹中的 .pac 文件，如果有则排除子文件夹下的 sprite frame
        if (subPacAssets.length !== 0) {
            // 排除含有 .pac 文件的子文件夹下的 sprite frame
            spriteFrameAssets = spriteFrameAssets.filter((info) => {
                for (const subPacDir of subPacDirs) {
                    if (utils_1.default.Path.contains(subPacDir, info.source)) {
                        return false;
                    }
                }
                return true;
            });
        }
        return spriteFrameAssets;
    }
    toJSON() {
        const json = Object.assign({}, this);
        // @ts-ignore
        delete json.spriteFrames;
        // @ts-ignore
        delete json.storeInfo;
    }
}
exports.PacInfo = PacInfo;
/**
 * 每张图集可能生成多张大图，每一张大图有对应的 AtlasInfo
 */
class AtlasInfo {
    imagePath;
    imageUuid = '';
    textureUuid = ''; // Texture2D
    name;
    spriteFrameInfos;
    width;
    height;
    compressed = {
        imagePathNoExt: '',
        suffixs: [],
    };
    constructor(spriteFrameInfos, width, height, name, imagePath) {
        // 这里使用碎图 uuid 来计算大图的 uuid
        const uuids = spriteFrameInfos.map((spriteFrameInfo) => spriteFrameInfo.uuid);
        this.imageUuid = HashUuid.calculate([uuids], HashUuid.BuiltinHashType.AutoAtlasImage)[0];
        this.textureUuid = this.imageUuid + '@' + require('@cocos/asset-db').nameToId('texture');
        this.spriteFrameInfos = spriteFrameInfos;
        this.width = width;
        this.height = height;
        this.name = name;
        // 暂时 hack 直接替换有风险，需要重新组织这块逻辑
        // 合图的临时缓存地址也需要使用计算好的 imageUuid ，因为 etc 的纹理压缩工具只支持指定输出文件夹，文件名将会用 src 的
        this.imagePath = imagePath.replace(name, this.imageUuid);
        this.compressed.suffixs.push((0, path_1.extname)(imagePath));
    }
    toJSON() {
        return {
            spriteFrameInfos: this.spriteFrameInfos.map((info) => info.toJSON()),
            width: this.width,
            height: this.height,
            name: this.name,
            imagePath: this.imagePath,
            imageUuid: this.imageUuid,
            textureUuid: this.textureUuid,
            compressed: this.compressed,
        };
    }
}
exports.AtlasInfo = AtlasInfo;
// 自定义的 spriteFrame 数据格式信息，将会序列化到缓存内二次使用
class SpriteFrameInfo {
    name = '';
    uuid = '';
    imageUuid = '';
    textureUuid = '';
    spriteFrame;
    trim = {
        width: 0,
        height: 0,
        rotatedWidth: 0,
        rotatedHeight: 0,
        x: 0,
        y: 0,
    };
    rawWidth = 0;
    rawHeight = 0;
    width = 0;
    height = 0;
    originalPath = '';
    rotated = false;
    _file = '';
    _libraryPath = '';
    _pacUuid = '';
    _mtime = 0;
    constructor(spriteFrame, assetInfo, options) {
        const trim = spriteFrame.rect;
        this.spriteFrame = spriteFrame;
        const rotatedWidth = spriteFrame.rotated ? trim.height : trim.width;
        const rotatedHeight = spriteFrame.rotated ? trim.width : trim.height;
        this.name = assetInfo.displayName || '';
        // 已经自动合图的情况下，不再动态合图
        spriteFrame.packable = false;
        this.rotated = spriteFrame.rotated;
        this.uuid = assetInfo.uuid;
        // @ts-ignore TODO 目前只有私有接口可用
        this.imageUuid = spriteFrame.texture._mipmaps[0]._uuid;
        this.textureUuid = spriteFrame.texture._uuid;
        // TODO 子资源嵌套时，取父资源可能依旧无法拿到实际图片地址
        // 目前 spriteFrame 的父资源都是图片，暂时没问题
        this._file = assetInfo.parent.source; // image 的原始地址
        // @ts-ignore
        this._libraryPath = (0, path_1.normalize)(spriteFrame.texture._mipmaps[0].url);
        this.trim = {
            rotatedWidth: rotatedWidth,
            rotatedHeight: rotatedHeight,
            x: trim.x,
            y: trim.y,
            width: trim.width,
            height: trim.height,
        };
        this.rawWidth = spriteFrame.originalSize.width;
        this.rawHeight = spriteFrame.originalSize.height;
        this.width = trim.width + (options.padding + options.bleed) * 2;
        this.height = trim.height + (options.padding + options.bleed) * 2;
        this._mtime = assetInfo._assetDB.infoManager.get(assetInfo.parent.source).time;
    }
    toJSON() {
        const json = Object.assign({}, this);
        // TODO 移除所有的私有属性（临时属性）
        delete json._libraryPath;
        delete json._file;
        delete json._pacUuid;
        delete json.spriteFrame;
        return json;
    }
}
exports.SpriteFrameInfo = SpriteFrameInfo;
function createAssetInstance(atlases, pacInfo, spriteFrames) {
    const res = createApriteAtlasFromAtlas(atlases, pacInfo, spriteFrames);
    return [
        res.spriteAtlas,
        ...res.images,
        ...res.spriteFrames,
        ...res.textures,
    ];
}
function createApriteAtlasFromAtlas(atlases, pacInfo, allSpriteFrames) {
    const spriteAtlas = new cc_1.SpriteAtlas();
    spriteAtlas._uuid = pacInfo.uuid;
    // TODO name 获取有误
    spriteAtlas.name = (0, path_1.basename)(pacInfo.source, (0, path_1.extname)(pacInfo.source));
    const images = [];
    const textures = [];
    const spriteFrames = [];
    for (const atlas of atlases) {
        const { image, texture } = createTextureFromAtlas(atlas, pacInfo);
        images.push(image);
        textures.push(texture);
        if (atlas.spriteFrameInfos) {
            atlas.spriteFrameInfos.forEach((spriteFrameInfo) => {
                let spriteFrame = allSpriteFrames.find((frame) => frame._uuid === spriteFrameInfo.uuid);
                // TODO 是否可以通过直接更改现有对象的某个属性实现
                spriteFrame = generateSpriteFrame(spriteFrameInfo, spriteFrame, texture);
                spriteFrames.push(spriteFrame);
                spriteAtlas.spriteFrames[spriteFrameInfo.name] = EditorExtends.serialize.asAsset(spriteFrameInfo.uuid);
            });
        }
    }
    return {
        spriteAtlas,
        textures,
        images,
        spriteFrames,
    };
}
function createTextureFromAtlas(atlas, pacInfo) {
    const imageUuid = atlas.imageUuid;
    const textureUuid = atlas.textureUuid;
    // @ts-ignore
    if (atlas.compressd) {
        // @ts-ignore
        atlas.compressed = atlas.compressd;
    }
    if (!atlas.compressed) {
        throw new Error('Can\'t find atlas.compressed.');
    }
    const image = new cc_1.ImageAsset();
    image._setRawAsset('.png');
    image._uuid = imageUuid;
    // @ts-ignore
    image._width = image._nativeAsset.width = atlas.width;
    // @ts-ignore
    image._height = image._nativeAsset.height = atlas.height;
    const texture = new cc_1.Texture2D();
    if (!pacInfo.meta.userData.textureSetting) {
        console.warn(`meta.userData.textureSetting in asset(${pacInfo.uuid}) is missing.`);
    }
    applyTextureBaseAssetUserData(pacInfo.meta.userData.textureSetting, texture);
    texture._mipmaps = [image];
    texture._uuid = textureUuid;
    return { texture, image };
}
function applyTextureBaseAssetUserData(userData, texture) {
    userData = userData || {
        wrapModeS: 'repeat',
        wrapModeT: 'repeat',
        minfilter: 'nearest',
        magfilter: 'linear',
        mipfilter: 'none',
        anisotropy: 1,
    };
    const getWrapMode = (wrapMode) => {
        switch (wrapMode) {
            case 'clamp-to-edge':
                return cc_1.Texture2D.WrapMode.CLAMP_TO_EDGE;
            case 'repeat':
                return cc_1.Texture2D.WrapMode.REPEAT;
            case 'mirrored-repeat':
                return cc_1.Texture2D.WrapMode.MIRRORED_REPEAT;
        }
    };
    const getFilter = (filter) => {
        switch (filter) {
            case 'nearest':
                return cc_1.Texture2D.Filter.NEAREST;
            case 'linear':
                return cc_1.Texture2D.Filter.LINEAR;
            case 'none':
                return cc_1.Texture2D.Filter.NONE;
        }
    };
    texture.setWrapMode(getWrapMode(userData.wrapModeS), getWrapMode(userData.wrapModeT));
    texture.setFilters(getFilter(userData.minfilter), getFilter(userData.magfilter));
    texture.setMipFilter(getFilter(userData.mipfilter));
    texture.setAnisotropy(userData.anisotropy);
}
function generateSpriteFrame(item, oldSpriteFrame, texture) {
    const spriteFrame = new cc_1.SpriteFrame();
    // texture 需要先设置，在引擎的接口实现里后续的 rect、originalSize、offset 会根据 texture 计算
    spriteFrame.texture = texture;
    spriteFrame.rect = new cc_1.Rect(item.trim.x, item.trim.y, item.trim.width, item.trim.height);
    spriteFrame.originalSize = new cc_1.Size(item.rawWidth, item.rawHeight);
    spriteFrame.offset = oldSpriteFrame.offset;
    spriteFrame.name = item.name;
    spriteFrame.rotated = item.rotated;
    spriteFrame.insetBottom = oldSpriteFrame.insetBottom;
    spriteFrame.insetTop = oldSpriteFrame.insetTop;
    spriteFrame.insetRight = oldSpriteFrame.insetRight;
    spriteFrame.insetLeft = oldSpriteFrame.insetLeft;
    spriteFrame._uuid = oldSpriteFrame.uuid;
    return spriteFrame;
}
