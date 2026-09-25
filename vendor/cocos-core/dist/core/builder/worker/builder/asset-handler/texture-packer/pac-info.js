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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFjLWluZm8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvdGV4dHVyZS1wYWNrZXIvcGFjLWluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMlRBLGtEQVFDO0FBRUQsZ0VBOEJDO0FBRUQsd0RBMkJDO0FBRUQsc0VBaUNDO0FBRUQsa0RBa0JDO0FBdmJEOztHQUVHO0FBQ0gsMkJBQStGO0FBQy9GLCtCQUE2RTtBQUM3RSwrREFBZ0U7QUFDaEUsZ0VBQWtEO0FBR2xELHNFQUE4QztBQUM5QyxvREFBNEI7QUFDNUIsc0ZBQTZEO0FBRWhELFFBQUEsaUJBQWlCLEdBQWlCO0lBQzNDLFFBQVEsRUFBRSxJQUFJO0lBQ2QsU0FBUyxFQUFFLElBQUk7SUFFZixvQkFBb0I7SUFDcEIsT0FBTyxFQUFFLENBQUM7SUFFVixhQUFhLEVBQUUsSUFBSTtJQUNuQixZQUFZLEVBQUUsS0FBSztJQUNuQixVQUFVLEVBQUUsS0FBSztJQUNqQixTQUFTLEVBQUUsVUFBVTtJQUNyQixNQUFNLEVBQUUsS0FBSztJQUNiLE9BQU8sRUFBRSxFQUFFO0lBQ1gsWUFBWSxFQUFFLElBQUk7SUFDbEIsWUFBWSxFQUFFLElBQUk7SUFDbEIsWUFBWSxFQUFFLElBQUk7SUFDbEIscUJBQXFCLEVBQUUsSUFBSTtJQUMzQixtQkFBbUIsRUFBRSxJQUFJO0lBQ3pCLHlCQUF5QixFQUFFLElBQUk7SUFDL0IsZ0JBQWdCLEVBQUUsRUFBRTtJQUNwQixLQUFLLEVBQUUsQ0FBQztJQUNSLElBQUksRUFBRSxPQUFPO0NBQ2hCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQWEsT0FBTztJQUNULGdCQUFnQixHQUFzQixFQUFFLENBQUM7SUFDekMsWUFBWSxHQUFrQixFQUFFLENBQUM7SUFDakMsWUFB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QVcsQ0FBQyxTQUFTLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQztJQUVqRCxXQUFXLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUM7SUFDeEMsT0FBTyxXQUFXLENBQUM7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5q2k5paH5Lu25L6d6LWW5LqG6K645aSa5byV5pOO5o6l5Y+j77yM5rOo5oSP54mI5pys5Y2H57qn5b2x5ZONXG4gKi9cbmltcG9ydCB7IEltYWdlQXNzZXQsIFJlY3QsIFNpemUsIFNwcml0ZUF0bGFzLCBTcHJpdGVGcmFtZSwgVGV4dHVyZTJELCBhc3NldE1hbmFnZXIgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgZGlybmFtZSwgZXh0bmFtZSwgam9pbiwgbm9ybWFsaXplLCByZWxhdGl2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYnVpbGRBc3NldExpYnJhcnkgfSBmcm9tICcuLi8uLi9tYW5hZ2VyL2Fzc2V0LWxpYnJhcnknO1xuaW1wb3J0ICogYXMgSGFzaFV1aWQgZnJvbSAnLi4vLi4vdXRpbHMvaGFzaC11dWlkJztcbmltcG9ydCB7IElBc3NldCB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2Fzc2V0cy9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IElQYWNrT3B0aW9ucywgSVBhY0luZm8sIFBhY1N0b3JlSW5mbywgSVBhY2tSZXN1bHQsIENvbXByZXNzZWRJbmZvLCBJQXRsYXNJbmZvLCBJU3ByaXRlRnJhbWVJbmZvIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vYmFzZS91dGlscyc7XG5pbXBvcnQgbG9kYXNoIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgYnVpbGRlckNvbmZpZyBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZS9idWlsZGVyLWNvbmZpZyc7XG5cbmV4cG9ydCBjb25zdCBEZWZhdWx0UGFja09wdGlvbjogSVBhY2tPcHRpb25zID0ge1xuICAgIG1heFdpZHRoOiAxMDI0LFxuICAgIG1heEhlaWdodDogMTAyNCxcblxuICAgIC8vIHBhZGRpbmcgb2YgaW1hZ2UuXG4gICAgcGFkZGluZzogMixcblxuICAgIGFsbG93Um90YXRpb246IHRydWUsXG4gICAgZm9yY2VTcXVhcmVkOiBmYWxzZSxcbiAgICBwb3dlck9mVHdvOiBmYWxzZSxcbiAgICBhbGdvcml0aG06ICdNYXhSZWN0cycsXG4gICAgZm9ybWF0OiAncG5nJyxcbiAgICBxdWFsaXR5OiA4MCxcbiAgICBjb250b3VyQmxlZWQ6IHRydWUsXG4gICAgcGFkZGluZ0JsZWVkOiB0cnVlLFxuICAgIGZpbHRlclVudXNlZDogdHJ1ZSxcbiAgICByZW1vdmVUZXh0dXJlSW5CdW5kbGU6IHRydWUsXG4gICAgcmVtb3ZlSW1hZ2VJbkJ1bmRsZTogdHJ1ZSxcbiAgICByZW1vdmVTcHJpdGVBdGxhc0luQnVuZGxlOiB0cnVlLFxuICAgIGNvbXByZXNzU2V0dGluZ3M6IHt9LFxuICAgIGJsZWVkOiAwLFxuICAgIG1vZGU6ICdidWlsZCcsXG59O1xuXG4vKipcbiAqIOS4gOS4quWbvumbhuS/oeaBr1xuICovXG5leHBvcnQgY2xhc3MgUGFjSW5mbyBpbXBsZW1lbnRzIElQYWNJbmZvIHtcbiAgICBwdWJsaWMgc3ByaXRlRnJhbWVJbmZvczogU3ByaXRlRnJhbWVJbmZvW10gPSBbXTtcbiAgICBwdWJsaWMgc3ByaXRlRnJhbWVzOiBTcHJpdGVGcmFtZVtdID0gW107XG4gICAgcHVibGljIHJlbGF0aXZlUGF0aCA9ICcnO1xuICAgIHB1YmxpYyByZWxhdGl2ZURpciA9ICcnO1xuICAgIHB1YmxpYyBwYXRoID0gJyc7XG4gICAgcHVibGljIHV1aWQgPSAnJztcbiAgICBwdWJsaWMgaW1hZ2VQYXRoID0gJyc7XG4gICAgcHVibGljIGltYWdlVXVpZCA9ICcnO1xuICAgIHB1YmxpYyB0ZXh0dXJlVXVpZCA9ICcnOyAvLyBUZXh0dXJlMkRcbiAgICBwdWJsaWMgbmFtZSA9ICdhdXRvYXRsYXMnO1xuICAgIHB1YmxpYyB3aWR0aCA9IDEwMjQ7XG4gICAgcHVibGljIGhlaWdodCA9IDEwMjQ7XG4gICAgcHVibGljIGRpcnR5ID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgcGFja09wdGlvbnM6IElQYWNrT3B0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoRGVmYXVsdFBhY2tPcHRpb24pKTtcblxuICAgIHB1YmxpYyBzdG9yZUluZm86IFBhY1N0b3JlSW5mbztcbiAgICBwdWJsaWMgcmVzdWx0PzogSVBhY2tSZXN1bHQ7XG5cbiAgICBjb25zdHJ1Y3RvcihwYWNBc3NldDogSUFzc2V0LCBvcHRpb25zPzogUGFydGlhbDxJUGFja09wdGlvbnM+KSB7XG4gICAgICAgIHRoaXMudXVpZCA9IHBhY0Fzc2V0LnV1aWQ7XG4gICAgICAgIC8vIOWcqCBkYiDov5vnqIvlhoXlj5blvpflvpcgbWV0YSDmlbDmja7pnIDopoHmt7Hmi7fotJ3pgb/lhY3lvbHlk43ljp/mlbDmja5cbiAgICAgICAgbGV0IHVzZXJEYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwYWNBc3NldC5tZXRhLnVzZXJEYXRhKSk7XG4gICAgICAgIHVzZXJEYXRhID0gb3B0aW9ucyA/IE9iamVjdC5hc3NpZ24odXNlckRhdGEsIG9wdGlvbnMpIDogdXNlckRhdGE7XG4gICAgICAgIC8vIFRPRE8g5Y+v6IO95Lya5pyJ6Z2e5rOV5pWw5o2u6KKrIGFzc2lnblxuICAgICAgICB0aGlzLnBhY2tPcHRpb25zID0gT2JqZWN0LmFzc2lnbih0aGlzLnBhY2tPcHRpb25zLCB1c2VyRGF0YSk7XG4gICAgICAgIHRoaXMucGFja09wdGlvbnMuYmxlZWQgPSB0aGlzLnBhY2tPcHRpb25zLnBhZGRpbmdCbGVlZCA/IDEgOiAwO1xuICAgICAgICB0aGlzLnBhdGggPSBwYWNBc3NldC51cmw7XG4gICAgICAgIC8vIOWPguS4jue8k+WtmOiuoeeul+eahOaVsOaNrlxuICAgICAgICB0aGlzLnN0b3JlSW5mbyA9IHtcbiAgICAgICAgICAgIHBhYzoge1xuICAgICAgICAgICAgICAgIHV1aWQ6IHBhY0Fzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgbXRpbWU6IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0UHJvcGVydHkocGFjQXNzZXQsICdtdGltZScpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwcml0ZXM6IFtdLFxuICAgICAgICAgICAgb3B0aW9uczogdGhpcy5wYWNrT3B0aW9ucyxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYXNzZXRzUGF0aCA9IGpvaW4oYnVpbGRlckNvbmZpZy5wcm9qZWN0Um9vdCwgJ2Fzc2V0cycpO1xuICAgICAgICB0aGlzLnJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGFzc2V0c1BhdGgsIHBhY0Fzc2V0LnNvdXJjZSk7XG4gICAgICAgIHRoaXMucmVsYXRpdmVEaXIgPSByZWxhdGl2ZShhc3NldHNQYXRoLCBkaXJuYW1lKHBhY0Fzc2V0LnNvdXJjZSkpO1xuICAgICAgICB0aGlzLm5hbWUgPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldFByb3BlcnR5KHBhY0Fzc2V0LCAnbmFtZScpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBpbml0U3ByaXRlRnJhbWVzV2l0aFJhbmdlKGluY2x1ZGVBc3NldHM/OiBzdHJpbmdbXSkge1xuICAgICAgICBjb25zdCBzcHJpdGVGcmFtZUFzc2V0cyA9IGF3YWl0IHRoaXMucXVlcnlJbnZhbGlkU3ByaXRlQXNzZXRzKGluY2x1ZGVBc3NldHMpO1xuICAgICAgICBpZiAoIXNwcml0ZUZyYW1lQXNzZXRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5pbml0U3ByaXRlRnJhbWVzKHNwcml0ZUZyYW1lQXNzZXRzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhY0Fzc2V0SW5mbyDku44gZGIg5Lit6I635Y+W5Ye65p2l55qEIHBhYyDkv6Hmga9cbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgaW5pdFNwcml0ZUZyYW1lcyhzcHJpdGVGcmFtZUFzc2V0czogKElBc3NldClbXSkge1xuICAgICAgICBsZXQgc3ByaXRlRnJhbWVJbmZvcyA9IGF3YWl0IFByb21pc2UuYWxsKHNwcml0ZUZyYW1lQXNzZXRzLm1hcChhc3luYyAoYXNzZXQ6IElBc3NldCkgPT4ge1xuICAgICAgICAgICAgaWYgKGFzc2V0TWFuYWdlci5hc3NldHMuaGFzKGFzc2V0LnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgYXNzZXRNYW5hZ2VyLnJlbGVhc2VBc3NldChhc3NldE1hbmFnZXIuYXNzZXRzLmdldChhc3NldC51dWlkKSEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBhc3NldE1hbmFnZXIubG9hZEFueShhc3NldC51dWlkLCAoZXJyLCBzcHJpdGVGcmFtZTogU3ByaXRlRnJhbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5q2k5aSE55qE6ZSZ6K+v5aSE55CG6YO95LiNIHJlamVjdCDvvIzlhajpg6jmiafooYzlrozlkI7nu63kvJrov4fmu6TpnZ7ms5XmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyciB8fCAhc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHNwcml0ZSBmcmFtZSBjYW4ndCBiZSBsb2FkOiR7YXNzZXQudXVpZH0sIHdpbGwgcmVtb3ZlIGl0IGZyb20gYXRsYXMuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgJiYgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3ByaXRlRnJhbWVJbmZvID0gbmV3IFNwcml0ZUZyYW1lSW5mbyhzcHJpdGVGcmFtZSwgYXNzZXQsIHRoaXMucGFja09wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlRnJhbWVJbmZvLl9wYWNVdWlkID0gdGhpcy51dWlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zcHJpdGVGcmFtZXMucHVzaChzcHJpdGVGcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNwcml0ZUZyYW1lSW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYWNrZXI6IGxvYWQgc3ByaXRlIGZyYW1lIGZhaWxlZDoke2Fzc2V0LnV1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgLy8g56e76ZmkIOaXoOaViOeahCBzcHJpdGUgZnJhbWVcbiAgICAgICAgc3ByaXRlRnJhbWVJbmZvcyA9IHNwcml0ZUZyYW1lSW5mb3MuZmlsdGVyKChpbmZvKSA9PiBpbmZvICE9IG51bGwpO1xuXG4gICAgICAgIC8vIOWvuSDlm77niYcg6L+b6KGM5o6S5bqP77yM56Gu5L+d5q+P5qyh6YeN5paw6K6h566X5ZCI5Zu+5ZCO55qE57uT5p6c5piv56iz5a6a55qE44CCXG4gICAgICAgIC8vIOivpeaOkuW6j+WPquW9seWTjeWQiOWbvuino+aekOeijuWbvueahOmhuuW6j++8jOacgOe7iOWbvumbhuS4reeahOaOkuW6j+S4juWQiOWbvueul+azleacieWFs++8jOWPquacieW9k+WbvumbhuS4reacieebuOWQjOWwuuWvuOeahOeijuWbvuaXtuivpeaOkuW6j+aJjeS8muS6p+eUn+S9nOeUqOOAglxuICAgICAgICBzcHJpdGVGcmFtZUluZm9zID0gbG9kYXNoLnNvcnRCeShzcHJpdGVGcmFtZUluZm9zLCAndXVpZCcpO1xuICAgICAgICB0aGlzLnNwcml0ZUZyYW1lSW5mb3MgPSBzcHJpdGVGcmFtZUluZm9zIGFzIFNwcml0ZUZyYW1lSW5mb1tdO1xuICAgICAgICB0aGlzLnN0b3JlSW5mby5zcHJpdGVzID0gdGhpcy5zcHJpdGVGcmFtZUluZm9zLm1hcCgoaW5mbykgPT4gaW5mby50b0pTT04oKSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeUludmFsaWRTcHJpdGVBc3NldHMoX2luY2x1ZGVBc3NldHM/OiBzdHJpbmdbXSk6IFByb21pc2U8QXJyYXk8SUFzc2V0Pj4ge1xuXG4gICAgICAgIC8vIOWOuyBkYiDmn6Xor6LnkIborrrkuIrkvJrmr5TlnKjlkIzov5vnqIsgY2FjaGUg6YeM5p+l6K+i55qE5oWiIFRPRE9cbiAgICAgICAgY29uc3QgYXNzZXRzID0gYXdhaXQgYnVpbGRBc3NldExpYnJhcnkucXVlcnlBc3NldHNCeU9wdGlvbnMoe1xuICAgICAgICAgICAgcGF0dGVybjogZGlybmFtZSh0aGlzLnBhdGgpICsgJy8qKi8qJyxcbiAgICAgICAgICAgIGltcG9ydGVyOiAnc3ByaXRlLWZyYW1lJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBzcHJpdGVGcmFtZUFzc2V0czogQXJyYXk8SUFzc2V0PiA9IFtdO1xuICAgICAgICAvLyDov4fmu6TphY3nva7kuobkuI3lj4LkuI7oh6rliqjlm77pm4bmiJbogIXkuI3lnKjmjIflrprotYTmupDojIPlm7TlhoXnmoQgc3ByaXRlXG4gICAgICAgIGZvciAoY29uc3QgYXNzZXQgb2YgYXNzZXRzKSB7XG4gICAgICAgICAgICBpZiAoIWFzc2V0Lm1ldGEudXNlckRhdGEucGFja2FibGUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5wYWNrT3B0aW9ucy5maWx0ZXJVbnVzZWQpIHtcbiAgICAgICAgICAgICAgICBzcHJpdGVGcmFtZUFzc2V0cy5wdXNoKGFzc2V0KTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5wYWNrT3B0aW9ucy5maWx0ZXJVbnVzZWQgJiYgKCFfaW5jbHVkZUFzc2V0cyB8fCBfaW5jbHVkZUFzc2V0cy5pbmNsdWRlcyhhc3NldC51dWlkKSkpIHtcbiAgICAgICAgICAgICAgICBzcHJpdGVGcmFtZUFzc2V0cy5wdXNoKGFzc2V0KTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXNwcml0ZUZyYW1lQXNzZXRzIHx8IHNwcml0ZUZyYW1lQXNzZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIC8vIOafpeaJvuWtkOebruW9leS4i+eahOaJgOaciSBwYWMg5paH5Lu2XG4gICAgICAgIGNvbnN0IHN1YlBhY0Fzc2V0czogYW55ID0gYXdhaXQgYnVpbGRBc3NldExpYnJhcnkucXVlcnlBc3NldHNCeU9wdGlvbnMoe1xuICAgICAgICAgICAgcGF0dGVybjogZGlybmFtZSh0aGlzLnBhdGgpICsgJy8qLyoqLyoucGFjJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHN1YlBhY0RpcnMgPSBzdWJQYWNBc3NldHMubWFwKChzdWJQYWM6IElBc3NldCkgPT4gZGlybmFtZShzdWJQYWMuc291cmNlKSk7XG4gICAgICAgIC8vLyDmn6Xmib7lrZDmlofku7blpLnkuK3nmoQgLnBhYyDmlofku7bvvIzlpoLmnpzmnInliJnmjpLpmaTlrZDmlofku7blpLnkuIvnmoQgc3ByaXRlIGZyYW1lXG4gICAgICAgIGlmIChzdWJQYWNBc3NldHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAvLyDmjpLpmaTlkKvmnIkgLnBhYyDmlofku7bnmoTlrZDmlofku7blpLnkuIvnmoQgc3ByaXRlIGZyYW1lXG4gICAgICAgICAgICBzcHJpdGVGcmFtZUFzc2V0cyA9IHNwcml0ZUZyYW1lQXNzZXRzLmZpbHRlcigoaW5mbzogSUFzc2V0KSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzdWJQYWNEaXIgb2Ygc3ViUGFjRGlycykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXRpbHMuUGF0aC5jb250YWlucyhzdWJQYWNEaXIsIGluZm8uc291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3ByaXRlRnJhbWVBc3NldHM7XG4gICAgfVxuXG4gICAgcHVibGljIHRvSlNPTigpIHtcbiAgICAgICAgY29uc3QganNvbiA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbGV0ZSBqc29uLnNwcml0ZUZyYW1lcztcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUganNvbi5zdG9yZUluZm87XG4gICAgfVxufVxuXG4vKipcbiAqIOavj+W8oOWbvumbhuWPr+iDveeUn+aIkOWkmuW8oOWkp+Wbvu+8jOavj+S4gOW8oOWkp+WbvuacieWvueW6lOeahCBBdGxhc0luZm9cbiAqL1xuZXhwb3J0IGNsYXNzIEF0bGFzSW5mbyB7XG4gICAgcHVibGljIGltYWdlUGF0aDogc3RyaW5nO1xuICAgIHB1YmxpYyBpbWFnZVV1aWQgPSAnJztcbiAgICBwdWJsaWMgdGV4dHVyZVV1aWQgPSAnJzsgLy8gVGV4dHVyZTJEXG4gICAgcHVibGljIG5hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgc3ByaXRlRnJhbWVJbmZvczogU3ByaXRlRnJhbWVJbmZvW107XG4gICAgcHVibGljIHdpZHRoOiBudW1iZXI7XG4gICAgcHVibGljIGhlaWdodDogbnVtYmVyO1xuICAgIHB1YmxpYyBjb21wcmVzc2VkOiBDb21wcmVzc2VkSW5mbyA9IHtcbiAgICAgICAgaW1hZ2VQYXRoTm9FeHQ6ICcnLFxuICAgICAgICBzdWZmaXhzOiBbXSxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3Ioc3ByaXRlRnJhbWVJbmZvczogU3ByaXRlRnJhbWVJbmZvW10sIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGltYWdlUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIC8vIOi/memHjOS9v+eUqOeijuWbviB1dWlkIOadpeiuoeeul+Wkp+WbvueahCB1dWlkXG4gICAgICAgIGNvbnN0IHV1aWRzID0gc3ByaXRlRnJhbWVJbmZvcy5tYXAoKHNwcml0ZUZyYW1lSW5mbykgPT4gc3ByaXRlRnJhbWVJbmZvLnV1aWQpO1xuICAgICAgICB0aGlzLmltYWdlVXVpZCA9IEhhc2hVdWlkLmNhbGN1bGF0ZShbdXVpZHNdLCBIYXNoVXVpZC5CdWlsdGluSGFzaFR5cGUuQXV0b0F0bGFzSW1hZ2UpWzBdO1xuICAgICAgICB0aGlzLnRleHR1cmVVdWlkID0gdGhpcy5pbWFnZVV1aWQgKyAnQCcgKyByZXF1aXJlKCdAY29jb3MvYXNzZXQtZGInKS5uYW1lVG9JZCgndGV4dHVyZScpO1xuICAgICAgICB0aGlzLnNwcml0ZUZyYW1lSW5mb3MgPSBzcHJpdGVGcmFtZUluZm9zO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAvLyDmmoLml7YgaGFjayDnm7TmjqXmm7/mjaLmnInpo47pmanvvIzpnIDopoHph43mlrDnu4Tnu4fov5nlnZfpgLvovpFcbiAgICAgICAgLy8g5ZCI5Zu+55qE5Li05pe257yT5a2Y5Zyw5Z2A5Lmf6ZyA6KaB5L2/55So6K6h566X5aW955qEIGltYWdlVXVpZCDvvIzlm6DkuLogZXRjIOeahOe6ueeQhuWOi+e8qeW3peWFt+WPquaUr+aMgeaMh+Wumui+k+WHuuaWh+S7tuWkue+8jOaWh+S7tuWQjeWwhuS8mueUqCBzcmMg55qEXG4gICAgICAgIHRoaXMuaW1hZ2VQYXRoID0gaW1hZ2VQYXRoLnJlcGxhY2UobmFtZSwgdGhpcy5pbWFnZVV1aWQpO1xuICAgICAgICB0aGlzLmNvbXByZXNzZWQuc3VmZml4cy5wdXNoKGV4dG5hbWUoaW1hZ2VQYXRoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNwcml0ZUZyYW1lSW5mb3M6IHRoaXMuc3ByaXRlRnJhbWVJbmZvcy5tYXAoKGluZm8pID0+IGluZm8udG9KU09OKCkpLFxuICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgaW1hZ2VQYXRoOiB0aGlzLmltYWdlUGF0aCxcbiAgICAgICAgICAgIGltYWdlVXVpZDogdGhpcy5pbWFnZVV1aWQsXG4gICAgICAgICAgICB0ZXh0dXJlVXVpZDogdGhpcy50ZXh0dXJlVXVpZCxcbiAgICAgICAgICAgIGNvbXByZXNzZWQ6IHRoaXMuY29tcHJlc3NlZCxcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbi8vIOiHquWumuS5ieeahCBzcHJpdGVGcmFtZSDmlbDmja7moLzlvI/kv6Hmga/vvIzlsIbkvJrluo/liJfljJbliLDnvJPlrZjlhoXkuozmrKHkvb/nlKhcbmV4cG9ydCBjbGFzcyBTcHJpdGVGcmFtZUluZm8ge1xuICAgIHB1YmxpYyBuYW1lID0gJyc7XG4gICAgcHVibGljIHV1aWQgPSAnJztcbiAgICBwdWJsaWMgaW1hZ2VVdWlkID0gJyc7XG4gICAgcHVibGljIHRleHR1cmVVdWlkID0gJyc7XG4gICAgcHVibGljIHNwcml0ZUZyYW1lOiBTcHJpdGVGcmFtZTtcblxuICAgIHB1YmxpYyB0cmltID0ge1xuICAgICAgICB3aWR0aDogMCxcbiAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICByb3RhdGVkV2lkdGg6IDAsXG4gICAgICAgIHJvdGF0ZWRIZWlnaHQ6IDAsXG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgfTtcbiAgICBwdWJsaWMgcmF3V2lkdGggPSAwO1xuICAgIHB1YmxpYyByYXdIZWlnaHQgPSAwO1xuICAgIHB1YmxpYyB3aWR0aCA9IDA7XG4gICAgcHVibGljIGhlaWdodCA9IDA7XG4gICAgcHVibGljIG9yaWdpbmFsUGF0aCA9ICcnO1xuICAgIHB1YmxpYyByb3RhdGVkID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgX2ZpbGUgPSAnJztcbiAgICBwdWJsaWMgX2xpYnJhcnlQYXRoID0gJyc7XG4gICAgcHVibGljIF9wYWNVdWlkID0gJyc7XG5cbiAgICBwcml2YXRlIF9tdGltZSA9IDA7XG5cbiAgICBjb25zdHJ1Y3RvcihzcHJpdGVGcmFtZTogU3ByaXRlRnJhbWUsIGFzc2V0SW5mbzogSUFzc2V0LCBvcHRpb25zOiBJUGFja09wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgdHJpbSA9IHNwcml0ZUZyYW1lLnJlY3Q7XG4gICAgICAgIHRoaXMuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgY29uc3Qgcm90YXRlZFdpZHRoID0gc3ByaXRlRnJhbWUucm90YXRlZCA/IHRyaW0uaGVpZ2h0IDogdHJpbS53aWR0aDtcbiAgICAgICAgY29uc3Qgcm90YXRlZEhlaWdodCA9IHNwcml0ZUZyYW1lLnJvdGF0ZWQgPyB0cmltLndpZHRoIDogdHJpbS5oZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5uYW1lID0gYXNzZXRJbmZvLmRpc3BsYXlOYW1lIHx8ICcnO1xuICAgICAgICAvLyDlt7Lnu4/oh6rliqjlkIjlm77nmoTmg4XlhrXkuIvvvIzkuI3lho3liqjmgIHlkIjlm75cbiAgICAgICAgc3ByaXRlRnJhbWUucGFja2FibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yb3RhdGVkID0gc3ByaXRlRnJhbWUucm90YXRlZDtcbiAgICAgICAgdGhpcy51dWlkID0gYXNzZXRJbmZvLnV1aWQ7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVE9ETyDnm67liY3lj6rmnInnp4HmnInmjqXlj6Plj6/nlKhcbiAgICAgICAgdGhpcy5pbWFnZVV1aWQgPSBzcHJpdGVGcmFtZS50ZXh0dXJlLl9taXBtYXBzIVswXS5fdXVpZDtcbiAgICAgICAgdGhpcy50ZXh0dXJlVXVpZCA9IHNwcml0ZUZyYW1lLnRleHR1cmUuX3V1aWQ7XG4gICAgICAgIC8vIFRPRE8g5a2Q6LWE5rqQ5bWM5aWX5pe277yM5Y+W54i26LWE5rqQ5Y+v6IO95L6d5pen5peg5rOV5ou/5Yiw5a6e6ZmF5Zu+54mH5Zyw5Z2AXG4gICAgICAgIC8vIOebruWJjSBzcHJpdGVGcmFtZSDnmoTniLbotYTmupDpg73mmK/lm77niYfvvIzmmoLml7bmsqHpl67pophcbiAgICAgICAgdGhpcy5fZmlsZSA9IGFzc2V0SW5mby5wYXJlbnQhLnNvdXJjZTsgLy8gaW1hZ2Ug55qE5Y6f5aeL5Zyw5Z2AXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy5fbGlicmFyeVBhdGggPSBub3JtYWxpemUoc3ByaXRlRnJhbWUudGV4dHVyZS5fbWlwbWFwcyFbMF0udXJsKTtcbiAgICAgICAgdGhpcy50cmltID0ge1xuICAgICAgICAgICAgcm90YXRlZFdpZHRoOiByb3RhdGVkV2lkdGgsXG4gICAgICAgICAgICByb3RhdGVkSGVpZ2h0OiByb3RhdGVkSGVpZ2h0LFxuICAgICAgICAgICAgeDogdHJpbS54LFxuICAgICAgICAgICAgeTogdHJpbS55LFxuICAgICAgICAgICAgd2lkdGg6IHRyaW0ud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRyaW0uaGVpZ2h0LFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnJhd1dpZHRoID0gc3ByaXRlRnJhbWUub3JpZ2luYWxTaXplLndpZHRoO1xuICAgICAgICB0aGlzLnJhd0hlaWdodCA9IHNwcml0ZUZyYW1lLm9yaWdpbmFsU2l6ZS5oZWlnaHQ7XG4gICAgICAgIHRoaXMud2lkdGggPSB0cmltLndpZHRoICsgKG9wdGlvbnMucGFkZGluZyArIG9wdGlvbnMuYmxlZWQpICogMjtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSB0cmltLmhlaWdodCArIChvcHRpb25zLnBhZGRpbmcgKyBvcHRpb25zLmJsZWVkKSAqIDI7XG4gICAgICAgIHRoaXMuX210aW1lID0gYXNzZXRJbmZvLl9hc3NldERCLmluZm9NYW5hZ2VyLmdldChhc3NldEluZm8ucGFyZW50IS5zb3VyY2UpLnRpbWU7XG4gICAgfVxuXG4gICAgcHVibGljIHRvSlNPTigpIHtcbiAgICAgICAgY29uc3QganNvbjogYW55ID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcyk7XG4gICAgICAgIC8vIFRPRE8g56e76Zmk5omA5pyJ55qE56eB5pyJ5bGe5oCn77yI5Li05pe25bGe5oCn77yJXG4gICAgICAgIGRlbGV0ZSBqc29uLl9saWJyYXJ5UGF0aDtcbiAgICAgICAgZGVsZXRlIGpzb24uX2ZpbGU7XG4gICAgICAgIGRlbGV0ZSBqc29uLl9wYWNVdWlkO1xuICAgICAgICBkZWxldGUganNvbi5zcHJpdGVGcmFtZTtcbiAgICAgICAgcmV0dXJuIGpzb247XG4gICAgfVxuXG4gICAgLy8gcHVibGljIGNsb25lKCkge1xuICAgIC8vICAgICBjb25zdCBvYmogPSBuZXcgU3ByaXRlRnJhbWVJbmZvKCk7XG4gICAgLy8gICAgIE9iamVjdC5hc3NpZ24ob2JqLCB0aGlzKTtcbiAgICAvLyAgICAgcmV0dXJuIG9iajtcbiAgICAvLyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBc3NldEluc3RhbmNlKGF0bGFzZXM6IElBdGxhc0luZm9bXSwgcGFjSW5mbzogSUFzc2V0LCBzcHJpdGVGcmFtZXM6IFNwcml0ZUZyYW1lW10pIHtcbiAgICBjb25zdCByZXMgPSBjcmVhdGVBcHJpdGVBdGxhc0Zyb21BdGxhcyhhdGxhc2VzLCBwYWNJbmZvLCBzcHJpdGVGcmFtZXMpO1xuICAgIHJldHVybiBbXG4gICAgICAgIHJlcy5zcHJpdGVBdGxhcyxcbiAgICAgICAgLi4ucmVzLmltYWdlcyxcbiAgICAgICAgLi4ucmVzLnNwcml0ZUZyYW1lcyxcbiAgICAgICAgLi4ucmVzLnRleHR1cmVzLFxuICAgIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBcHJpdGVBdGxhc0Zyb21BdGxhcyhhdGxhc2VzOiBJQXRsYXNJbmZvW10sIHBhY0luZm86IElBc3NldCwgYWxsU3ByaXRlRnJhbWVzOiBTcHJpdGVGcmFtZVtdKSB7XG4gICAgY29uc3Qgc3ByaXRlQXRsYXMgPSBuZXcgU3ByaXRlQXRsYXMoKTtcbiAgICBzcHJpdGVBdGxhcy5fdXVpZCA9IHBhY0luZm8udXVpZDtcbiAgICAvLyBUT0RPIG5hbWUg6I635Y+W5pyJ6K+vXG4gICAgc3ByaXRlQXRsYXMubmFtZSA9IGJhc2VuYW1lKHBhY0luZm8uc291cmNlLCBleHRuYW1lKHBhY0luZm8uc291cmNlKSk7XG5cbiAgICBjb25zdCBpbWFnZXM6IEltYWdlQXNzZXRbXSA9IFtdO1xuICAgIGNvbnN0IHRleHR1cmVzOiBUZXh0dXJlMkRbXSA9IFtdO1xuICAgIGNvbnN0IHNwcml0ZUZyYW1lczogU3ByaXRlRnJhbWVbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgYXRsYXMgb2YgYXRsYXNlcykge1xuICAgICAgICBjb25zdCB7IGltYWdlLCB0ZXh0dXJlIH0gPSBjcmVhdGVUZXh0dXJlRnJvbUF0bGFzKGF0bGFzLCBwYWNJbmZvKTtcbiAgICAgICAgaW1hZ2VzLnB1c2goaW1hZ2UpO1xuICAgICAgICB0ZXh0dXJlcy5wdXNoKHRleHR1cmUpO1xuICAgICAgICBpZiAoYXRsYXMuc3ByaXRlRnJhbWVJbmZvcykge1xuICAgICAgICAgICAgYXRsYXMuc3ByaXRlRnJhbWVJbmZvcy5mb3JFYWNoKChzcHJpdGVGcmFtZUluZm8pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgc3ByaXRlRnJhbWUgPSBhbGxTcHJpdGVGcmFtZXMuZmluZCgoZnJhbWUpID0+IGZyYW1lLl91dWlkID09PSBzcHJpdGVGcmFtZUluZm8udXVpZCk7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyDmmK/lkKblj6/ku6XpgJrov4fnm7TmjqXmm7TmlLnnjrDmnInlr7nosaHnmoTmn5DkuKrlsZ7mgKflrp7njrBcbiAgICAgICAgICAgICAgICBzcHJpdGVGcmFtZSA9IGdlbmVyYXRlU3ByaXRlRnJhbWUoc3ByaXRlRnJhbWVJbmZvLCBzcHJpdGVGcmFtZSEsIHRleHR1cmUpO1xuICAgICAgICAgICAgICAgIHNwcml0ZUZyYW1lcy5wdXNoKHNwcml0ZUZyYW1lKTtcbiAgICAgICAgICAgICAgICBzcHJpdGVBdGxhcy5zcHJpdGVGcmFtZXNbc3ByaXRlRnJhbWVJbmZvLm5hbWVdID0gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUuYXNBc3NldChzcHJpdGVGcmFtZUluZm8udXVpZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHNwcml0ZUF0bGFzLFxuICAgICAgICB0ZXh0dXJlcyxcbiAgICAgICAgaW1hZ2VzLFxuICAgICAgICBzcHJpdGVGcmFtZXMsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHR1cmVGcm9tQXRsYXMoYXRsYXM6IElBdGxhc0luZm8sIHBhY0luZm86IElBc3NldCkge1xuICAgIGNvbnN0IGltYWdlVXVpZCA9IGF0bGFzLmltYWdlVXVpZDtcbiAgICBjb25zdCB0ZXh0dXJlVXVpZCA9IGF0bGFzLnRleHR1cmVVdWlkO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBpZiAoYXRsYXMuY29tcHJlc3NkKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgYXRsYXMuY29tcHJlc3NlZCA9IGF0bGFzLmNvbXByZXNzZDtcbiAgICB9XG4gICAgaWYgKCFhdGxhcy5jb21wcmVzc2VkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuXFwndCBmaW5kIGF0bGFzLmNvbXByZXNzZWQuJyk7XG4gICAgfVxuICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlQXNzZXQoKTtcbiAgICBpbWFnZS5fc2V0UmF3QXNzZXQoJy5wbmcnKTtcbiAgICBpbWFnZS5fdXVpZCA9IGltYWdlVXVpZDtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaW1hZ2UuX3dpZHRoID0gaW1hZ2UuX25hdGl2ZUFzc2V0LndpZHRoID0gYXRsYXMud2lkdGg7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGltYWdlLl9oZWlnaHQgPSBpbWFnZS5fbmF0aXZlQXNzZXQuaGVpZ2h0ID0gYXRsYXMuaGVpZ2h0O1xuXG4gICAgY29uc3QgdGV4dHVyZSA9IG5ldyBUZXh0dXJlMkQoKTtcbiAgICBpZiAoIXBhY0luZm8ubWV0YS51c2VyRGF0YS50ZXh0dXJlU2V0dGluZykge1xuICAgICAgICBjb25zb2xlLndhcm4oYG1ldGEudXNlckRhdGEudGV4dHVyZVNldHRpbmcgaW4gYXNzZXQoJHtwYWNJbmZvLnV1aWR9KSBpcyBtaXNzaW5nLmApO1xuICAgIH1cbiAgICBhcHBseVRleHR1cmVCYXNlQXNzZXRVc2VyRGF0YShwYWNJbmZvLm1ldGEudXNlckRhdGEudGV4dHVyZVNldHRpbmcsIHRleHR1cmUpO1xuICAgIHRleHR1cmUuX21pcG1hcHMgPSBbaW1hZ2VdO1xuICAgIHRleHR1cmUuX3V1aWQgPSB0ZXh0dXJlVXVpZDtcbiAgICByZXR1cm4geyB0ZXh0dXJlLCBpbWFnZSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlUZXh0dXJlQmFzZUFzc2V0VXNlckRhdGEodXNlckRhdGE6IGFueSwgdGV4dHVyZTogVGV4dHVyZTJEKSB7XG4gICAgdXNlckRhdGEgPSB1c2VyRGF0YSB8fCB7XG4gICAgICAgIHdyYXBNb2RlUzogJ3JlcGVhdCcsXG4gICAgICAgIHdyYXBNb2RlVDogJ3JlcGVhdCcsXG4gICAgICAgIG1pbmZpbHRlcjogJ25lYXJlc3QnLFxuICAgICAgICBtYWdmaWx0ZXI6ICdsaW5lYXInLFxuICAgICAgICBtaXBmaWx0ZXI6ICdub25lJyxcbiAgICAgICAgYW5pc290cm9weTogMSxcbiAgICB9O1xuICAgIGNvbnN0IGdldFdyYXBNb2RlID0gKHdyYXBNb2RlOiAnY2xhbXAtdG8tZWRnZScgfCAncmVwZWF0JyB8ICdtaXJyb3JlZC1yZXBlYXQnKSA9PiB7XG4gICAgICAgIHN3aXRjaCAod3JhcE1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NsYW1wLXRvLWVkZ2UnOlxuICAgICAgICAgICAgICAgIHJldHVybiBUZXh0dXJlMkQuV3JhcE1vZGUuQ0xBTVBfVE9fRURHRTtcbiAgICAgICAgICAgIGNhc2UgJ3JlcGVhdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRleHR1cmUyRC5XcmFwTW9kZS5SRVBFQVQ7XG4gICAgICAgICAgICBjYXNlICdtaXJyb3JlZC1yZXBlYXQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBUZXh0dXJlMkQuV3JhcE1vZGUuTUlSUk9SRURfUkVQRUFUO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBnZXRGaWx0ZXIgPSAoZmlsdGVyOiAnbmVhcmVzdCcgfCAnbGluZWFyJyB8ICdub25lJykgPT4ge1xuICAgICAgICBzd2l0Y2ggKGZpbHRlcikge1xuICAgICAgICAgICAgY2FzZSAnbmVhcmVzdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRleHR1cmUyRC5GaWx0ZXIuTkVBUkVTVDtcbiAgICAgICAgICAgIGNhc2UgJ2xpbmVhcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRleHR1cmUyRC5GaWx0ZXIuTElORUFSO1xuICAgICAgICAgICAgY2FzZSAnbm9uZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRleHR1cmUyRC5GaWx0ZXIuTk9ORTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGV4dHVyZS5zZXRXcmFwTW9kZShnZXRXcmFwTW9kZSh1c2VyRGF0YS53cmFwTW9kZVMpLCBnZXRXcmFwTW9kZSh1c2VyRGF0YS53cmFwTW9kZVQpKTtcbiAgICB0ZXh0dXJlLnNldEZpbHRlcnMoZ2V0RmlsdGVyKHVzZXJEYXRhLm1pbmZpbHRlciksIGdldEZpbHRlcih1c2VyRGF0YS5tYWdmaWx0ZXIpKTtcbiAgICB0ZXh0dXJlLnNldE1pcEZpbHRlcihnZXRGaWx0ZXIodXNlckRhdGEubWlwZmlsdGVyKSk7XG4gICAgdGV4dHVyZS5zZXRBbmlzb3Ryb3B5KHVzZXJEYXRhLmFuaXNvdHJvcHkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVTcHJpdGVGcmFtZShpdGVtOiBJU3ByaXRlRnJhbWVJbmZvLCBvbGRTcHJpdGVGcmFtZTogU3ByaXRlRnJhbWUsIHRleHR1cmU6IFRleHR1cmUyRCk6IFNwcml0ZUZyYW1lIHtcbiAgICBjb25zdCBzcHJpdGVGcmFtZSA9IG5ldyBTcHJpdGVGcmFtZSgpO1xuICAgIC8vIHRleHR1cmUg6ZyA6KaB5YWI6K6+572u77yM5Zyo5byV5pOO55qE5o6l5Y+j5a6e546w6YeM5ZCO57ut55qEIHJlY3TjgIFvcmlnaW5hbFNpemXjgIFvZmZzZXQg5Lya5qC55o2uIHRleHR1cmUg6K6h566XXG4gICAgc3ByaXRlRnJhbWUudGV4dHVyZSA9IHRleHR1cmU7XG5cbiAgICBzcHJpdGVGcmFtZS5yZWN0ID0gbmV3IFJlY3QoaXRlbS50cmltLngsIGl0ZW0udHJpbS55LCBpdGVtLnRyaW0ud2lkdGgsIGl0ZW0udHJpbS5oZWlnaHQpO1xuICAgIHNwcml0ZUZyYW1lLm9yaWdpbmFsU2l6ZSA9IG5ldyBTaXplKGl0ZW0ucmF3V2lkdGgsIGl0ZW0ucmF3SGVpZ2h0KTtcbiAgICBzcHJpdGVGcmFtZS5vZmZzZXQgPSBvbGRTcHJpdGVGcmFtZS5vZmZzZXQ7XG4gICAgc3ByaXRlRnJhbWUubmFtZSA9IGl0ZW0ubmFtZTtcbiAgICBzcHJpdGVGcmFtZS5yb3RhdGVkID0gaXRlbS5yb3RhdGVkO1xuXG4gICAgc3ByaXRlRnJhbWUuaW5zZXRCb3R0b20gPSBvbGRTcHJpdGVGcmFtZS5pbnNldEJvdHRvbTtcbiAgICBzcHJpdGVGcmFtZS5pbnNldFRvcCA9IG9sZFNwcml0ZUZyYW1lLmluc2V0VG9wO1xuICAgIHNwcml0ZUZyYW1lLmluc2V0UmlnaHQgPSBvbGRTcHJpdGVGcmFtZS5pbnNldFJpZ2h0O1xuICAgIHNwcml0ZUZyYW1lLmluc2V0TGVmdCA9IG9sZFNwcml0ZUZyYW1lLmluc2V0TGVmdDtcblxuICAgIHNwcml0ZUZyYW1lLl91dWlkID0gb2xkU3ByaXRlRnJhbWUudXVpZDtcbiAgICByZXR1cm4gc3ByaXRlRnJhbWU7XG59Il19