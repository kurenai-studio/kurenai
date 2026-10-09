"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBChangeType = exports.AssetDbInterop = void 0;
const url_1 = require("url");
const db_module_url_1 = require("../utils/db-module-url");
const cache_1 = require("../shared/cache");
const path_1 = require("../utils/path");
const path_2 = require("path");
const asset_db_1 = require("@cocos/asset-db");
class AssetDbInterop {
    _tsScriptInfoCache = cache_1.tsScriptAssetCache;
    removeTsScriptInfoCache(dbTarget) {
        const scriptInfos = [];
        this._tsScriptInfoCache.forEach(item => {
            if ((0, path_2.normalize)(item.filePath).startsWith(dbTarget)) {
                scriptInfos.push(item);
                this._tsScriptInfoCache.delete(item.filePath);
            }
        });
        return scriptInfos;
    }
    async destroyed() {
        this._tsScriptInfoCache.clear();
    }
    async queryAssetDomains(dbInfos) {
        const assetDatabaseDomains = [];
        for (const dbInfo of dbInfos) {
            const dbURL = (0, db_module_url_1.getDatabaseModuleRootURL)(dbInfo.dbID);
            const assetDatabaseDomain = {
                root: new URL(dbURL),
                physical: dbInfo.target,
            };
            if (isPackageDomain(dbInfo.dbID)) {
                assetDatabaseDomain.jail = dbInfo.target;
            }
            assetDatabaseDomains.push(assetDatabaseDomain);
        }
        return assetDatabaseDomains;
    }
    /**
     * 因为时间累计而缓存的资源更改。
     */
    _changeQueue = [];
    /**
     * 当收到资源更改消息后触发。我们会更新资源更改计时器。
     */
    onAssetChange(changeInfo) {
        const filePath = (0, path_1.resolveFileName)(changeInfo.filePath);
        const uuid = changeInfo.uuid;
        const assetChange = {
            url: (0, url_1.pathToFileURL)(filePath),
            importer: changeInfo.importer,
            uuid: uuid,
            filePath: filePath,
            type: changeInfo.type === asset_db_1.AssetActionEnum.none ? asset_db_1.AssetActionEnum.change : changeInfo.type,
            isPluginScript: isPluginScript(changeInfo.userData),
        };
        const importer = changeInfo.importer;
        if (!(importer === 'javascript' || importer === 'typescript')) {
            return;
        }
        let info = null;
        if (importer === 'typescript') {
            info = mapperForTypeScriptAssetInfoCache(changeInfo);
        }
        if (!info) {
            this._changeQueue.push(assetChange);
            return;
        }
        if (changeInfo.type === asset_db_1.AssetActionEnum.change) {
            if (!this._tsScriptInfoCache.has(filePath)) {
                for (const iterator of this._tsScriptInfoCache.values()) {
                    if (iterator.uuid === uuid) {
                        this._tsScriptInfoCache.delete(iterator.filePath);
                        this._tsScriptInfoCache.set(info.filePath, info);
                        assetChange.oldFilePath = iterator.filePath;
                        assetChange.newFilePath = info.filePath;
                        break;
                    }
                }
            }
        }
        if (changeInfo.type === asset_db_1.AssetActionEnum.add) {
            if (importer === 'typescript') {
                const deletedItemIndex = this._changeQueue.findIndex(item => item.type === asset_db_1.AssetActionEnum.delete && item.uuid === uuid);
                if (deletedItemIndex !== -1) {
                    assetChange.type = asset_db_1.AssetActionEnum.change;
                    assetChange.oldFilePath = (0, path_1.resolveFileName)(this._changeQueue[deletedItemIndex].filePath);
                    assetChange.newFilePath = info.filePath;
                    this._changeQueue.splice(deletedItemIndex, 1);
                }
                if (importer === 'typescript') {
                    this._tsScriptInfoCache.set(info.filePath, info);
                }
            }
        }
        if (changeInfo.type === asset_db_1.AssetActionEnum.delete) {
            this._tsScriptInfoCache.delete(filePath);
        }
        this._changeQueue.push(assetChange);
    }
    getAssetChangeQueue() {
        return this._changeQueue;
    }
    resetAssetChangeQueue() {
        this._changeQueue = [];
    }
}
exports.AssetDbInterop = AssetDbInterop;
var DBChangeType;
(function (DBChangeType) {
    DBChangeType[DBChangeType["add"] = 0] = "add";
    DBChangeType[DBChangeType["remove"] = 1] = "remove";
})(DBChangeType || (exports.DBChangeType = DBChangeType = {}));
function mapperForTypeScriptAssetInfoCache(changeInfo) {
    const filePath = (0, path_1.resolveFileName)(changeInfo.filePath);
    return {
        uuid: changeInfo.uuid,
        filePath: filePath,
        url: (0, url_1.pathToFileURL)(filePath),
        isPluginScript: isPluginScript(changeInfo.userData),
    };
}
function isPluginScript(userData) {
    if (userData?.isPlugin) {
        return true;
    }
    else {
        return false;
    }
}
function isPackageDomain(databaseID) {
    return !['assets', 'internal'].includes(databaseID);
}
