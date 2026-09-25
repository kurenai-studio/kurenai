"use strict";
'use stirct';
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFileSystemProvider = exports.resetFileSystemProvider = exports.getFileSystemProvider = exports.refresh = exports.reimport = exports.queryUUID = exports.queryPath = exports.queryUrl = exports.queryMissingInfo = exports.queryAsset = exports.get = exports.Utils = exports.nameToId = exports.isSubPath = exports.AssetDB = exports.VirtualAsset = exports.AssetActionEnum = exports.Asset = exports.Importer = exports.setDefaultUserData = exports.forEach = exports.create = void 0;
const asset_db_1 = require("./libs/asset-db");
const filesystem_1 = require("./libs/filesystem");
Object.defineProperty(exports, "getFileSystemProvider", { enumerable: true, get: function () { return filesystem_1.getFileSystemProvider; } });
Object.defineProperty(exports, "resetFileSystemProvider", { enumerable: true, get: function () { return filesystem_1.resetFileSystemProvider; } });
Object.defineProperty(exports, "setFileSystemProvider", { enumerable: true, get: function () { return filesystem_1.setFileSystemProvider; } });
const utils_1 = require("./libs/utils");
/**
 * 创建一个新的资源数据库
 * @param options
 */
function create(options) {
    const database = new asset_db_1.AssetDB(options);
    return database;
}
exports.create = create;
/**
 * 循环每一个数据库
 * @param handler
 */
function forEach(handler) {
    Object.keys(asset_db_1.map).forEach((name) => {
        handler(asset_db_1.map[name]);
    });
}
exports.forEach = forEach;
var default_meta_1 = require("./libs/default-meta");
Object.defineProperty(exports, "setDefaultUserData", { enumerable: true, get: function () { return default_meta_1.setDefaultUserData; } });
var importer_1 = require("./libs/importer");
Object.defineProperty(exports, "Importer", { enumerable: true, get: function () { return importer_1.Importer; } });
var asset_1 = require("./libs/asset");
Object.defineProperty(exports, "Asset", { enumerable: true, get: function () { return asset_1.Asset; } });
Object.defineProperty(exports, "AssetActionEnum", { enumerable: true, get: function () { return asset_1.AssetActionEnum; } });
Object.defineProperty(exports, "VirtualAsset", { enumerable: true, get: function () { return asset_1.VirtualAsset; } });
var asset_db_2 = require("./libs/asset-db");
Object.defineProperty(exports, "AssetDB", { enumerable: true, get: function () { return asset_db_2.AssetDB; } });
var utils_2 = require("./libs/utils");
Object.defineProperty(exports, "isSubPath", { enumerable: true, get: function () { return utils_2.isSubPath; } });
Object.defineProperty(exports, "nameToId", { enumerable: true, get: function () { return utils_2.nameToId; } });
exports.Utils = {
    nameToId: utils_1.nameToId,
    isSubPath: utils_1.isSubPath,
};
var manager_1 = require("./libs/manager");
Object.defineProperty(exports, "get", { enumerable: true, get: function () { return manager_1.get; } });
Object.defineProperty(exports, "queryAsset", { enumerable: true, get: function () { return manager_1.queryAsset; } });
Object.defineProperty(exports, "queryMissingInfo", { enumerable: true, get: function () { return manager_1.queryMissingInfo; } });
Object.defineProperty(exports, "queryUrl", { enumerable: true, get: function () { return manager_1.queryUrl; } });
Object.defineProperty(exports, "queryPath", { enumerable: true, get: function () { return manager_1.queryPath; } });
Object.defineProperty(exports, "queryUUID", { enumerable: true, get: function () { return manager_1.queryUUID; } });
Object.defineProperty(exports, "reimport", { enumerable: true, get: function () { return manager_1.reimport; } });
Object.defineProperty(exports, "refresh", { enumerable: true, get: function () { return manager_1.refresh; } });
let version = '';
try {
    version = require('./package.json').version;
}
catch (error) {
    version = require('../package.json').version;
}
if (!global.AssetDB) {
    global.AssetDB = module.exports;
    global.AssetDB.version = version;
}
else if (global.AssetDB.version !== version) {
    console.log(`Two different versions of AssetDB have been loaded, please check it.`);
    module.exports = global.AssetDB;
}
else {
    module.exports = global.AssetDB;
}
