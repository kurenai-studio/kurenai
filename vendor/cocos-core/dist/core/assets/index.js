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
exports.assetDBManager = exports.assetManager = void 0;
exports.initAssetDB = initAssetDB;
exports.startAssetDB = startAssetDB;
exports.stopAssetDB = stopAssetDB;
/**
 * 资源导入、构建的对外调度，后续可能移除
 */
const console_1 = require("../base/console");
const asset_db_1 = __importDefault(require("./manager/asset-db"));
const asset_1 = __importDefault(require("./manager/asset"));
const asset_config_1 = __importDefault(require("./asset-config"));
/**
 * 初始化资源数据库相关配置与管理器
 */
async function initAssetDB() {
    // @ts-ignore HACK 目前引擎有在一些资源序列化会调用的接口里使用这个变量，没有合理的传参之前需要临时设置兼容
    globalThis.Build = true;
    const { scriptConfig } = await Promise.resolve().then(() => __importStar(require('../scripting/shared/query-shared-settings')));
    await scriptConfig.init();
    await asset_config_1.default.init();
    console_1.newConsole.trackMemoryStart('assets:worker-init');
    await asset_1.default.init();
    await asset_db_1.default.init();
    console_1.newConsole.trackMemoryEnd('asset-db:worker-init');
}
/**
 * 启动资源数据库，开始扫描和导入资源
 */
async function startAssetDB() {
    await asset_db_1.default.start();
}
/**
 * 停止资源数据库
 */
async function stopAssetDB() {
    for (const name in asset_db_1.default.assetDBMap) {
        const db = asset_db_1.default.assetDBMap[name];
        if (db) {
            await db.stop();
        }
    }
}
var asset_2 = require("./manager/asset");
Object.defineProperty(exports, "assetManager", { enumerable: true, get: function () { return __importDefault(asset_2).default; } });
var asset_db_2 = require("./manager/asset-db");
Object.defineProperty(exports, "assetDBManager", { enumerable: true, get: function () { return __importDefault(asset_db_2).default; } });
