"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturePacker = void 0;
exports.packAutoAtlas = packAutoAtlas;
exports.queryAutoAtlasFileCache = queryAutoAtlasFileCache;
exports.querySpriteToAutoAtlas = querySpriteToAutoAtlas;
const fs_extra_1 = require("fs-extra");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = require("path");
const asset_library_1 = require("../../manager/asset-library");
const config_1 = require("./config");
const pac_info_1 = require("./pac-info");
const packer_1 = require("./packer");
const utils_1 = require("../../utils");
// 管理自动图集缓存，提供对外接口
class TexturePacker {
    pacInfos = [];
    /**
     * 是否使用缓存
     */
    static useCache = true;
    static getCacheDirWithUuid(packUuid, mode = 'build') {
        return (0, path_1.join)(asset_library_1.buildAssetLibrary.getAssetTempDirByUuid(packUuid), 'texture-packer' + mode);
    }
    static async packSingle(pacAsset, option) {
        const pacInfo = await new pac_info_1.PacInfo(pacAsset, option).initSpriteFramesWithRange();
        return TexturePacker.internalPack(pacInfo);
    }
    static queryPacStoredPath(pacInfo) {
        const cacheTempDir = TexturePacker.getCacheDirWithUuid(pacInfo.uuid, pacInfo.packOptions.mode);
        return (0, path_1.join)(cacheTempDir, 'pac-info.json');
    }
    async init(pacAssets, assetsRange) {
        const pacInfos = [];
        await Promise.all(pacAssets.map(async (pacAsset) => {
            if (pacAsset.url.startsWith('db://internal/default_file_content')) {
                return;
            }
            const pacInfo = await new pac_info_1.PacInfo(pacAsset).initSpriteFramesWithRange(assetsRange);
            if (pacInfo.spriteFrameInfos.length === 0) {
                return;
            }
            pacInfos.push(pacInfo);
        }));
        this.pacInfos = pacInfos;
        return this;
    }
    async pack() {
        return await Promise.all(this.pacInfos.map((pacInfo) => {
            return TexturePacker.internalPack(pacInfo);
        }));
    }
    static async internalPack(pacInfo) {
        let storedPacInfo = null;
        const storedPacInfoPath = TexturePacker.queryPacStoredPath(pacInfo);
        if (TexturePacker.useCache) {
            const res = TexturePacker.getPacResFromCache(pacInfo, storedPacInfoPath);
            if (res.result) {
                pacInfo.result = res.result;
                pacInfo.dirty = false;
                return pacInfo;
            }
            storedPacInfo = res;
            pacInfo.dirty = true;
        }
        const destDir = this.getCacheDirWithUuid(pacInfo.uuid, pacInfo.packOptions.mode);
        (0, fs_extra_1.emptyDirSync)(destDir);
        if (pacInfo.spriteFrameInfos && pacInfo.spriteFrameInfos.length) {
            // TODO 开启子进程打包图集
            const result = await (0, packer_1.packer)(pacInfo.spriteFrameInfos, {
                ...pacInfo.packOptions,
                destDir,
                name: pacInfo.name,
            });
            pacInfo.result = result;
            if (TexturePacker.useCache) {
                storedPacInfo = storedPacInfo || TexturePacker.genNewStoredInfo(pacInfo);
                storedPacInfo.result = result;
                try {
                    (0, fs_extra_1.outputJSONSync)(storedPacInfoPath, storedPacInfo, { spaces: 2 });
                }
                catch (error) {
                    console.debug('write pac info cache failed');
                    console.error(error);
                }
            }
        }
        return pacInfo;
    }
    static getStoredPacInfo(pacInfo, storedPacInfoPath) {
        storedPacInfoPath = storedPacInfoPath || TexturePacker.queryPacStoredPath(pacInfo);
        const res = {
            newStoredPacInfo: TexturePacker.genNewStoredInfo(pacInfo),
            storedPacInfo: null,
        };
        if (!(0, fs_extra_1.existsSync)(storedPacInfoPath)) {
            return res;
        }
        try {
            res.storedPacInfo = (0, fs_extra_1.readJSONSync)(storedPacInfoPath);
        }
        catch (error) {
            console.debug(error);
        }
        return res;
    }
    static genNewStoredInfo(pacInfo) {
        const newStoredPacInfo = {
            md5: '',
            versionDev: config_1.versionDev,
            sharpMd5: (0, utils_1.calcMd5)(JSON.stringify(require('sharp').versions)),
        };
        // 对图片进行排序，确保每次重新计算 md5 一致
        pacInfo.storeInfo.sprites = lodash_1.default.sortBy(pacInfo.storeInfo.sprites, 'uuid');
        // TODO 字符串计算 md5 可能导致计算结果不稳定
        newStoredPacInfo.md5 = (0, utils_1.calcMd5)(JSON.stringify({
            packStoreInfo: pacInfo.storeInfo,
            versionDev: config_1.versionDev,
            sharpMd5: newStoredPacInfo.sharpMd5,
        }));
        return newStoredPacInfo;
    }
    static getPacResFromCache(pacInfo, storedPacInfoPath) {
        const { storedPacInfo, newStoredPacInfo } = TexturePacker.getStoredPacInfo(pacInfo, storedPacInfoPath);
        let dirty = (!storedPacInfo || newStoredPacInfo.md5 !== storedPacInfo.md5);
        if (dirty) {
            return newStoredPacInfo;
        }
        try {
            for (const atlas of storedPacInfo.result.atlases) {
                // 需要检查所有缓存的图集资源是否依旧正常存在
                if (!(0, fs_extra_1.existsSync)(atlas.imagePath)) {
                    dirty = true;
                    break;
                }
            }
            newStoredPacInfo.result = storedPacInfo.result;
        }
        catch (error) {
            console.warn(`Get Cache info of pac failed {asset(${pacInfo.uuid})}`);
            console.warn(error);
        }
        console.debug(`Get Cache info of pac success {asset(${pacInfo.uuid})}`);
        return newStoredPacInfo;
    }
    static async queryPacCache(pacUuid) {
        const pacInfo = new pac_info_1.PacInfo(asset_library_1.buildAssetLibrary.getAsset(pacUuid));
        // 将会决定获取的缓存位置
        pacInfo.packOptions.mode = 'preview';
        // 由于此接口还要获取最新的图集信息对比缓存是否失效，因而此处虽不需要生成预览图但需要初始化
        await pacInfo.initSpriteFramesWithRange();
        const cacheInfo = TexturePacker.getStoredPacInfo(pacInfo);
        if (!cacheInfo || !cacheInfo.storedPacInfo || !cacheInfo.storedPacInfo.result || cacheInfo.storedPacInfo.md5 !== cacheInfo.newStoredPacInfo.md5) {
            return null;
        }
        const pacRes = cacheInfo.storedPacInfo.result;
        return {
            unpackedImages: pacRes.unpackedImages,
            dirty: false,
            atlasImagePaths: cacheInfo.storedPacInfo.result.atlases.map((info) => info.imagePath),
            atlases: cacheInfo.storedPacInfo.result.atlases,
            storeInfo: pacInfo.storeInfo,
        };
    }
}
exports.TexturePacker = TexturePacker;
async function packAutoAtlas(pacUuid, option) {
    if (!option) {
        option = {};
    }
    option.mode = 'preview';
    try {
        const pacInfo = await TexturePacker.packSingle(asset_library_1.buildAssetLibrary.getAsset(pacUuid), option);
        if (!pacInfo.spriteFrames.length) {
            console.warn(`No invalid SpriteFrame found in folder [{link(${(0, path_1.dirname)(pacInfo.path)})}]. Please check the AutoAtlas [{link(${pacInfo.path})}].`);
        }
        if (!pacInfo.result) {
            return null;
        }
        const atlasImagePaths = pacInfo.result.atlases.map((info) => info.imagePath);
        return {
            atlasImagePaths,
            unpackedImages: pacInfo.result.unpackedImages,
            dirty: pacInfo.dirty,
            storeInfo: pacInfo.storeInfo,
            atlases: pacInfo.result.atlases,
        };
    }
    catch (error) {
        console.error(error);
    }
    return null;
}
/**
 * 查询某个图集的预览缓存
 * @param pacUuid
 */
function queryAutoAtlasFileCache(pacUuid) {
    return TexturePacker.queryPacCache(pacUuid);
}
async function querySpriteToAutoAtlas(spriteUuid) {
    const info = asset_library_1.buildAssetLibrary.getAsset(spriteUuid);
    if (info.url.startsWith('db://internal')) {
        return null;
    }
    // 找到小图所在 db 所有的图集信息
    const allPacs = asset_library_1.buildAssetLibrary.queryAssetsByOptions({
        pattern: `db://${info._assetDB.options.name}/**/*.pac`,
    });
    if (!allPacs.length) {
        return null;
    }
    const packer = new TexturePacker();
    await packer.init(allPacs);
    const targetPackInfo = packer.pacInfos.find((pacInfo) => !!pacInfo.spriteFrameInfos.find((spriteInfo) => spriteInfo.uuid === spriteUuid));
    if (!targetPackInfo) {
        return null;
    }
    return {
        url: targetPackInfo.path,
        uuid: targetPackInfo.uuid,
    };
}
