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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV0Esa0NBVUM7QUFLRCxvQ0FFQztBQUtELGtDQU9DO0FBeENEOztHQUVHO0FBQ0gsNkNBQTZDO0FBQzdDLGtFQUFnRDtBQUNoRCw0REFBMkM7QUFDM0Msa0VBQXlDO0FBRXpDOztHQUVHO0FBQ0ksS0FBSyxVQUFVLFdBQVc7SUFDN0IsK0RBQStEO0lBQy9ELFVBQVUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3hCLE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyx3REFBYSwyQ0FBMkMsR0FBQyxDQUFDO0lBQ25GLE1BQU0sWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzFCLE1BQU0sc0JBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN6QixvQkFBVSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDbEQsTUFBTSxlQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUIsTUFBTSxrQkFBYyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzVCLG9CQUFVLENBQUMsY0FBYyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUVEOztHQUVHO0FBQ0ksS0FBSyxVQUFVLFlBQVk7SUFDOUIsTUFBTSxrQkFBYyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2pDLENBQUM7QUFFRDs7R0FFRztBQUNJLEtBQUssVUFBVSxXQUFXO0lBQzdCLEtBQUssTUFBTSxJQUFJLElBQUksa0JBQWMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMzQyxNQUFNLEVBQUUsR0FBRyxrQkFBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ0wsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEIsQ0FBQztJQUNMLENBQUM7QUFDTCxDQUFDO0FBRUQseUNBQTBEO0FBQWpELHNIQUFBLE9BQU8sT0FBZ0I7QUFDaEMsK0NBQStEO0FBQXRELDJIQUFBLE9BQU8sT0FBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOi1hOa6kOWvvOWFpeOAgeaehOW7uueahOWvueWkluiwg+W6pu+8jOWQjue7reWPr+iDveenu+mZpFxuICovXG5pbXBvcnQgeyBuZXdDb25zb2xlIH0gZnJvbSAnLi4vYmFzZS9jb25zb2xlJztcbmltcG9ydCBhc3NldERCTWFuYWdlciBmcm9tICcuL21hbmFnZXIvYXNzZXQtZGInO1xuaW1wb3J0IGFzc2V0TWFuYWdlciBmcm9tICcuL21hbmFnZXIvYXNzZXQnO1xuaW1wb3J0IGFzc2V0Q29uZmlnIGZyb20gJy4vYXNzZXQtY29uZmlnJztcblxuLyoqXG4gKiDliJ3lp4vljJbotYTmupDmlbDmja7lupPnm7jlhbPphY3nva7kuI7nrqHnkIblmahcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXRBc3NldERCKCkge1xuICAgIC8vIEB0cy1pZ25vcmUgSEFDSyDnm67liY3lvJXmk47mnInlnKjkuIDkupvotYTmupDluo/liJfljJbkvJrosIPnlKjnmoTmjqXlj6Pph4zkvb/nlKjov5nkuKrlj5jph4/vvIzmsqHmnInlkIjnkIbnmoTkvKDlj4LkuYvliY3pnIDopoHkuLTml7borr7nva7lhbzlrrlcbiAgICBnbG9iYWxUaGlzLkJ1aWxkID0gdHJ1ZTtcbiAgICBjb25zdCB7IHNjcmlwdENvbmZpZyB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zY3JpcHRpbmcvc2hhcmVkL3F1ZXJ5LXNoYXJlZC1zZXR0aW5ncycpO1xuICAgIGF3YWl0IHNjcmlwdENvbmZpZy5pbml0KCk7XG4gICAgYXdhaXQgYXNzZXRDb25maWcuaW5pdCgpO1xuICAgIG5ld0NvbnNvbGUudHJhY2tNZW1vcnlTdGFydCgnYXNzZXRzOndvcmtlci1pbml0Jyk7XG4gICAgYXdhaXQgYXNzZXRNYW5hZ2VyLmluaXQoKTtcbiAgICBhd2FpdCBhc3NldERCTWFuYWdlci5pbml0KCk7XG4gICAgbmV3Q29uc29sZS50cmFja01lbW9yeUVuZCgnYXNzZXQtZGI6d29ya2VyLWluaXQnKTtcbn1cblxuLyoqXG4gKiDlkK/liqjotYTmupDmlbDmja7lupPvvIzlvIDlp4vmiavmj4/lkozlr7zlhaXotYTmupBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0QXNzZXREQigpIHtcbiAgICBhd2FpdCBhc3NldERCTWFuYWdlci5zdGFydCgpO1xufVxuXG4vKipcbiAqIOWBnOatoui1hOa6kOaVsOaNruW6k1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcEFzc2V0REIoKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIGluIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXApIHtcbiAgICAgICAgY29uc3QgZGIgPSBhc3NldERCTWFuYWdlci5hc3NldERCTWFwW25hbWVdO1xuICAgICAgICBpZiAoZGIpIHtcbiAgICAgICAgICAgIGF3YWl0IGRiLnN0b3AoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBhc3NldE1hbmFnZXIgfSBmcm9tICcuL21hbmFnZXIvYXNzZXQnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBhc3NldERCTWFuYWdlciB9IGZyb20gJy4vbWFuYWdlci9hc3NldC1kYic7XG4iXX0=