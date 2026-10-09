"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetCache = void 0;
exports.calcMd5 = calcMd5;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const HASH_LEN = 5;
/**
 * 计算某个数据的 md5 值
 * @param data
 */
function calcMd5(data) {
    data = Array.isArray(data) ? data : [data];
    const { createHash } = require('crypto');
    const cryptoHash = createHash('md5');
    data.forEach((dataItem) => {
        cryptoHash.update(dataItem);
    });
    return cryptoHash.digest('hex').slice(0, HASH_LEN);
}
class AssetCache {
    _cacheMap = {};
    _tmpDir;
    constructor(tmp) {
        this._tmpDir = tmp;
    }
    _getCacheFilePath(asset, md5Key) {
        return (0, path_1.join)(this._tmpDir, 'asset-db', asset.uuid.slice(0, 2), asset.uuid, md5Key);
    }
    async add(asset, options, path) {
        const md5Key = calcMd5(JSON.stringify(options));
        const cachePath = this._getCacheFilePath(asset, md5Key + (0, path_1.extname)(path));
        try {
            await (0, fs_extra_1.copy)(path, cachePath);
            this._cacheMap[asset.uuid] = {
                path,
                md5Key,
            };
        }
        catch (error) {
            console.warn(error);
            return false;
        }
        return true;
    }
    query(uuid, options) {
        const md5Key = JSON.stringify(options);
        const cacheInfo = this._cacheMap[uuid];
        if (cacheInfo.md5Key === md5Key) {
            return cacheInfo.path;
        }
        return null;
    }
}
exports.AssetCache = AssetCache;
