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
Object.defineProperty(exports, "__esModule", { value: true });
exports.material = exports.serializedData = exports.animationMask = exports.animationGraphVariant = void 0;
exports.init = init;
exports.setFileSystemProvider = setFileSystemProvider;
exports.start = start;
exports.onReady = onReady;
exports.onDBReady = onDBReady;
exports.onProgress = onProgress;
exports.deleteAsset = deleteAsset;
exports.refresh = refresh;
exports.queryAssetInfo = queryAssetInfo;
exports.queryAssetMeta = queryAssetMeta;
exports.queryCreateMap = queryCreateMap;
exports.queryAssetInfos = queryAssetInfos;
exports.queryAssetDBInfos = queryAssetDBInfos;
exports.createAssetByType = createAssetByType;
exports.createAsset = createAsset;
exports.importAsset = importAsset;
exports.copyAsset = copyAsset;
exports.reimportAsset = reimportAsset;
exports.saveAsset = saveAsset;
exports.querySerializedData = querySerializedData;
exports.saveSerializedData = saveSerializedData;
exports.queryMaterialAllEffects = queryMaterialAllEffects;
exports.queryMaterialEffect = queryMaterialEffect;
exports.queryMaterial = queryMaterial;
exports.saveMaterial = saveMaterial;
exports.queryUUID = queryUUID;
exports.queryPath = queryPath;
exports.queryUrl = queryUrl;
exports.queryAssetDependencies = queryAssetDependencies;
exports.queryAssetUsers = queryAssetUsers;
exports.querySortedPlugins = querySortedPlugins;
exports.renameAsset = renameAsset;
exports.moveAsset = moveAsset;
exports.updateDefaultUserData = updateDefaultUserData;
exports.queryAssetUserDataConfig = queryAssetUserDataConfig;
exports.updateAssetUserData = updateAssetUserData;
exports.updateAssetUserDataByPath = updateAssetUserDataByPath;
exports.queryAssetConfigMap = queryAssetConfigMap;
exports.queryPropertySchema = queryPropertySchema;
exports.queryThumbnailHandlers = queryThumbnailHandlers;
exports.generateThumbnail = generateThumbnail;
exports.onAssetAdded = onAssetAdded;
exports.onAssetChanged = onAssetChanged;
exports.onAssetRemoved = onAssetRemoved;
const assets_1 = require("../../core/assets");
async function init() {
    // 初始化资源数据库
    const { initAssetDB } = await Promise.resolve().then(() => __importStar(require('../../core/assets')));
    await initAssetDB();
}
/**
 * Register asset filesystem provider before initializing the asset database.
 */
function setFileSystemProvider(provider) {
    assets_1.assetDBManager.setFileSystemProvider(provider);
}
/**
 * Start Asset DB // 启动资源数据库，开始扫描和导入资源
 */
async function start() {
    const { startAssetDB } = await Promise.resolve().then(() => __importStar(require('../../core/assets')));
    await startAssetDB();
}
/**
 * Register listener for when all asset databases are fully initialized.
 *
 * 注册数据库初始化完全完成后的事件监听。
 *
 * **注意事项 (Notice)**:
 * - 触发此事件代表**所有**注册的资源数据库都已经完全导入并初始化完成（启动阶段结束）。
 * - 收到此事件后，表示所有的资源查询、操作 API 都可以安全调用。
 * - 第一次 ready 后，将不再有 progress 进度消息。
 *
 * @param listener 回调函数
 * @returns 移除监听的函数
 */
function onReady(listener) {
    return assets_1.assetManager.onReady(listener);
}
/**
 * Register listener for when a specific database finishes starting.
 *
 * 注册单个数据库启动完成后的事件监听。
 *
 * **注意事项 (Notice)**:
 * - 这个事件可能会被触发多次（如果项目存在多个子数据库，如 `assets`, `internal`）。
 * - 主要用于需要做更精细化并行控制的上层逻辑，通常情况下普通的业务逻辑不需要关心此事件，直接监听 `onReady` 即可。
 *
 * @param listener 回调函数，接收启动完成的 dbInfo
 * @returns 移除监听的函数
 */
function onDBReady(listener) {
    return assets_1.assetManager.onDBReady(listener);
}
/**
 * Register listener for initialization progress.
 *
 * 注册初始化过程中的进度监听。
 *
 * **注意事项 (Notice)**:
 * - **仅在启动阶段有效**。一旦触发过一次 `ready` 事件（即启动阶段结束），将不再会有新的进度消息。
 * - 启动时的资源冷导入会抛出密集的进度信息，建议在 UI 层面进行适当的节流（throttle）渲染。
 *
 * @param listener 回调函数，包含当前进度、总数、当前处理的资源 url 和导入状态
 * @returns 移除监听的函数
 */
function onProgress(listener) {
    return assets_1.assetManager.onProgress(listener);
}
/**
 * Delete Asset // 删除资源
 */
async function deleteAsset(dbPath, options) {
    return await assets_1.assetManager.removeAsset(dbPath, options);
}
/**
 * Refresh Asset Directory // 刷新资源目录
 */
async function refresh(dir) {
    return await assets_1.assetManager.refreshAsset(dir);
}
/**
 * Query Asset Info // 查询资源信息
 */
async function queryAssetInfo(urlOrUUIDOrPath, dataKeys) {
    const info = await assets_1.assetManager.queryAssetInfo(urlOrUUIDOrPath, dataKeys);
    // This module is exposed through the Electron MessagePort RPC bridge. Some
    // asset-db implementations attach helper functions to otherwise plain asset
    // data; those functions cannot be structured-cloned and made Asset Preview's
    // queryAssetInfo() fail before it can resolve FBX Prefab sub-assets.
    return info ? JSON.parse(JSON.stringify(info)) : null;
}
/**
 * Query Asset Metadata // 查询资源元数据
 */
async function queryAssetMeta(urlOrUUIDOrPath) {
    return await assets_1.assetManager.queryAssetMeta(urlOrUUIDOrPath);
}
/**
 * Query Creatable Asset Map // 查询可创建资源映射表
 */
async function queryCreateMap() {
    return await assets_1.assetManager.getCreateMap();
}
/**
 * Batch Query Asset Info // 批量查询资源信息
 */
async function queryAssetInfos(options, dataKeys) {
    return await assets_1.assetManager.queryAssetInfos(options, dataKeys);
}
/**
 * Query All Asset Database Info // 查询所有资源数据库信息
 */
async function queryAssetDBInfos() {
    return assets_1.assetDBManager.assetDBInfo;
}
/**
 * Create Asset By Type // 按类型创建资源
 */
async function createAssetByType(ccType, dirOrUrl, baseName, options) {
    return await assets_1.assetManager.createAssetByType(ccType, dirOrUrl, baseName, options);
}
/**
 * Create Asset // 创建资源
 */
async function createAsset(options) {
    return await assets_1.assetManager.createAsset(options);
}
/**
 * Import Asset // 导入资源
 */
async function importAsset(source, target, options) {
    return await assets_1.assetManager.importAsset(source, target, options);
}
/**
 * Copy Asset // 复制资源及其完整元数据
 */
async function copyAsset(source, target, options) {
    return await assets_1.assetManager.copyAsset(source, target, options);
}
/**
 * Reimport Asset // 重新导入资源
 */
async function reimportAsset(pathOrUrlOrUUID) {
    return await assets_1.assetManager.reimportAsset(pathOrUrlOrUUID);
}
/**
 * Save Asset // 保存资源
 */
async function saveAsset(pathOrUrlOrUUID, data) {
    return await assets_1.assetManager.saveAsset(pathOrUrlOrUUID, data);
}
exports.animationGraphVariant = {
    query(uuid) {
        return assets_1.assetManager.queryAnimationGraphVariant(uuid);
    },
    change(uuid, dump) {
        return assets_1.assetManager.changeAnimationGraphVariant(uuid, dump);
    },
    save(uuid) {
        return assets_1.assetManager.saveAnimationGraphVariant(uuid);
    },
};
exports.animationMask = {
    async query(uuid) {
        const { queryAnimationMask } = await Promise.resolve().then(() => __importStar(require('../../core/assets/animation-mask')));
        return queryAnimationMask(uuid);
    },
    async importSkeleton(uuid, skeletonSourceUuid) {
        const { importAnimationMaskSkeleton } = await Promise.resolve().then(() => __importStar(require('../../core/assets/animation-mask')));
        return importAnimationMaskSkeleton(uuid, skeletonSourceUuid);
    },
    async clearNodes(uuid) {
        const { clearAnimationMaskNodes } = await Promise.resolve().then(() => __importStar(require('../../core/assets/animation-mask')));
        return clearAnimationMaskNodes(uuid);
    },
    async changeDump(uuid, changes) {
        const { changeAnimationMaskDump } = await Promise.resolve().then(() => __importStar(require('../../core/assets/animation-mask')));
        return changeAnimationMaskDump(uuid, changes);
    },
    async save(uuid) {
        const { saveAnimationMask } = await Promise.resolve().then(() => __importStar(require('../../core/assets/animation-mask')));
        return saveAnimationMask(uuid);
    },
};
/**
 * Query serialized asset dump data.
 */
async function querySerializedData(uuidOrUrlOrPath) {
    return await assets_1.assetManager.querySerializedData(uuidOrUrlOrPath);
}
/**
 * Save serialized asset dump data.
 */
async function saveSerializedData(uuidOrUrlOrPath, patch) {
    return await assets_1.assetManager.saveSerializedData(uuidOrUrlOrPath, patch);
}
exports.serializedData = {
    query: querySerializedData,
    save: saveSerializedData,
};
/**
 * Query all available material effects.
 */
async function queryMaterialAllEffects() {
    return await assets_1.assetManager.queryMaterialAllEffects();
}
/**
 * Query one material effect dump by UUID or effect name.
 */
async function queryMaterialEffect(effectNameOrUuid) {
    return await assets_1.assetManager.queryMaterialEffect(effectNameOrUuid);
}
/**
 * Query material dump data.
 */
async function queryMaterial(uuidOrUrlOrPath) {
    return await assets_1.assetManager.queryMaterial(uuidOrUrlOrPath);
}
/**
 * Save material dump data.
 */
async function saveMaterial(uuidOrUrlOrPath, dump) {
    return await assets_1.assetManager.saveMaterial(uuidOrUrlOrPath, dump);
}
exports.material = {
    query: queryMaterial,
    queryEffect: queryMaterialEffect,
    queryAllEffects: queryMaterialAllEffects,
    save: saveMaterial,
};
/**
 * Query Asset UUID // 查询资源 UUID
 */
async function queryUUID(urlOrPath) {
    return assets_1.assetManager.queryUUID(urlOrPath);
}
/**
 * Query Asset Path // 查询资源路径
 */
async function queryPath(urlOrUuid) {
    return assets_1.assetManager.queryPath(urlOrUuid);
}
/**
 * Query Asset URL // 查询资源 URL
 */
async function queryUrl(uuidOrPath) {
    return assets_1.assetManager.queryUrl(uuidOrPath);
}
/**
 * Query Asset Dependencies // 查询资源依赖
 */
async function queryAssetDependencies(uuidOrUrl, type = 'asset') {
    return await assets_1.assetManager.queryAssetDependencies(uuidOrUrl, type);
}
/**
 * Query Asset Users // 查询资源使用者
 */
async function queryAssetUsers(uuidOrUrl, type = 'asset') {
    return await assets_1.assetManager.queryAssetUsers(uuidOrUrl, type);
}
/**
 * Query Sorted Plugin Scripts // 查询排序后的插件脚本
 */
async function querySortedPlugins(filterOptions = {}) {
    return assets_1.assetManager.querySortedPlugins(filterOptions);
}
/**
 * Rename Asset // 重命名资源
 */
async function renameAsset(source, newName, options = {}) {
    return await assets_1.assetManager.renameAsset(source, newName, options);
}
/**
 * Move Asset // 移动资源
 */
async function moveAsset(source, target, options = {}) {
    return await assets_1.assetManager.moveAsset(source, target, options);
}
/**
 * Update Default User Data // 更新默认用户数据
 */
async function updateDefaultUserData(handler, path, value) {
    return await assets_1.assetManager.updateDefaultUserData(handler, path, value);
}
/**
 * Query Asset User Data Config // 查询资源用户数据配置
 */
async function queryAssetUserDataConfig(urlOrUuidOrPath) {
    const asset = assets_1.assetManager.queryAsset(urlOrUuidOrPath);
    if (asset) {
        return await assets_1.assetManager.queryAssetUserDataConfig(asset);
    }
    else {
        return false;
    }
}
/**
 * Update Asset User Data // 更新资源用户数据
 */
async function updateAssetUserData(urlOrUuidOrPath, userData) {
    return await assets_1.assetManager.updateUserData(urlOrUuidOrPath, userData);
}
/**
 * Update Asset User Data By Path // 按路径更新资源用户数据
 */
async function updateAssetUserDataByPath(urlOrUuidOrPath, path, value) {
    return await assets_1.assetManager.updateUserDataByPath(urlOrUuidOrPath, path, value);
}
/**
 * Query Asset Config Map // 查询资源配置映射表
 */
async function queryAssetConfigMap() {
    return await assets_1.assetManager.queryAssetConfigMap();
}
/**
 * Query Asset Property Schema // 查询资源导入属性 schema
 */
async function queryPropertySchema(importer) {
    return await assets_1.assetManager.queryPropertySchema(importer);
}
/**
 * Query Thumbnail Handlers // 查询支持缩略图生成的资源处理器列表
 */
function queryThumbnailHandlers() {
    return assets_1.assetManager.queryThumbnailHandlers();
}
/**
 * Generate Thumbnail // 生成资源缩略图
 */
async function generateThumbnail(urlOrUUIDOrPath, size) {
    return assets_1.assetManager.generateThumbnail(urlOrUUIDOrPath, size);
}
/**
 * Listen to Asset Added Event // 监听资源添加事件
 * @param listener Callback function that receives asset information
 * @returns Function to remove the listener
 *
 * 推荐用法：
 * ```typescript
 * const removeListener = onAssetAdded((info) => {
 *     console.log(`资源已添加: ${info.name}`);
 *     console.log(`  逻辑路径: ${info.url}`);
 *     console.log(`  物理路径: ${info.file}`);
 * });
 * // 稍后移除监听
 * removeListener();
 * ```
 */
function onAssetAdded(listener) {
    return assets_1.assetManager.onAssetAdded(listener);
}
/**
 * Listen to Asset Changed Event // 监听资源变更事件
 * @param listener Callback function that receives asset information
 * @returns Function to remove the listener
 *
 * 推荐用法：
 * ```typescript
 * const removeListener = onAssetChanged((info) => {
 *     console.log(`资源已变更: ${info.name}`);
 * });
 * // 稍后移除监听
 * removeListener();
 * ```
 */
function onAssetChanged(listener) {
    return assets_1.assetManager.onAssetChanged(listener);
}
/**
 * Listen to Asset Removed Event // 监听资源删除事件
 * @param listener Callback function that receives asset information
 * @returns Function to remove the listener
 *
 * 推荐用法：
 * ```typescript
 * const removeListener = onAssetRemoved((info) => {
 *     console.log(`资源已删除: ${info.name}`);
 * });
 * // 稍后移除监听
 * removeListener();
 * ```
 */
function onAssetRemoved(listener) {
    return assets_1.assetManager.onAssetRemoved(listener);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9hc3NldHMvYXNzZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVdBLG9CQUlDO0FBS0Qsc0RBRUM7QUFLRCxzQkFHQztBQWVELDBCQUVDO0FBY0QsOEJBRUM7QUFjRCxnQ0FFQztBQUtELGtDQUVDO0FBS0QsMEJBRUM7QUFLRCx3Q0FVQztBQUtELHdDQUVDO0FBS0Qsd0NBRUM7QUFLRCwwQ0FFQztBQUtELDhDQUVDO0FBS0QsOENBT0M7QUFLRCxrQ0FJQztBQUtELGtDQU1DO0FBS0QsOEJBTUM7QUFLRCxzQ0FFQztBQUtELDhCQUtDO0FBOENELGtEQUVDO0FBS0QsZ0RBS0M7QUFVRCwwREFFQztBQUtELGtEQUVDO0FBS0Qsc0NBRUM7QUFLRCxvQ0FFQztBQVlELDhCQUVDO0FBS0QsOEJBRUM7QUFLRCw0QkFFQztBQUtELHdEQUtDO0FBS0QsMENBS0M7QUFLRCxnREFJQztBQUtELGtDQU1DO0FBS0QsOEJBTUM7QUFLRCxzREFNQztBQUtELDREQVNDO0FBS0Qsa0RBS0M7QUFLRCw4REFNQztBQUtELGtEQUVDO0FBS0Qsa0RBRUM7QUFLRCx3REFFQztBQUtELDhDQUlDO0FBa0JELG9DQUVDO0FBZ0JELHdDQUVDO0FBZ0JELHdDQUVDO0FBL2VELDhDQUFpRTtBQVExRCxLQUFLLFVBQVUsSUFBSTtJQUN0QixXQUFXO0lBQ1gsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLHdEQUFhLG1CQUFtQixHQUFDLENBQUM7SUFDMUQsTUFBTSxXQUFXLEVBQUUsQ0FBQztBQUN4QixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixxQkFBcUIsQ0FBQyxRQUFrQztJQUNwRSx1QkFBYyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFFRDs7R0FFRztBQUNJLEtBQUssVUFBVSxL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USxDQUFDLENBQUM7QUFDakQsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxTQUFnQixjQUFjLENBQUMsUUFBb0M7SUFDL0QsT0FBTyxxQkFBWSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBbmltYXRpb25NYXNrQ2hhbmdlLCBBbmltYXRpb25NYXNrRHVtcCwgQXNzZXRPcGVyYXRpb25PcHRpb24sIEFzc2V0UHJvcGVydHlTY2hlbWFNYXAsIENyZWF0ZUFzc2V0QnlUeXBlT3B0aW9ucywgRGVsZXRlQXNzZXRPcHRpb25zLCBJQXNzZXRGaWxlU3lzdGVtUHJvdmlkZXIsIElBc3NldEluZm8sIElBc3NldE1ldGEsIElTdXBwb3J0Q3JlYXRlVHlwZSwgTWF0ZXJpYWxEdW1wLCBNYXRlcmlhbEVmZmVjdEluZm8sIE1hdGVyaWFsVGVjaG5pcXVlRHVtcCwgUXVlcnlBc3NldHNPcHRpb24sIFNlcmlhbGl6ZWRBc3NldFBhdGNoLCBTZXJpYWxpemVkQXNzZXRRdWVyeVJlc3VsdCB9IGZyb20gJy4uLy4uL2NvcmUvYXNzZXRzL0B0eXBlcy9wdWJsaWMnO1xuaW1wb3J0IHR5cGUgeyBDcmVhdGVBc3NldE9wdGlvbnMsIElBc3NldENvbmZpZywgSUFzc2V0REJJbmZvLCBJQ3JlYXRlTWVudUluZm8sIElVZXJEYXRhQ29uZmlnSXRlbSwgUXVlcnlBc3NldFR5cGUsIFRodW1ibmFpbEluZm8sIFRodW1ibmFpbFNpemUgfSBmcm9tICcuLi8uLi9jb3JlL2Fzc2V0cy9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB0eXBlIHsgRmlsdGVyUGx1Z2luT3B0aW9ucywgSVBsdWdpblNjcmlwdEluZm8gfSBmcm9tICcuLi8uLi9jb3JlL3NjcmlwdGluZy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgYXNzZXREQk1hbmFnZXIsIGFzc2V0TWFuYWdlciB9IGZyb20gJy4uLy4uL2NvcmUvYXNzZXRzJztcbmltcG9ydCB0eXBlIHsgQW5pbUdyYXBoVmFyaWFudER1bXAgfSBmcm9tICcuLi8uLi9jb3JlL2Fzc2V0cy9hbmltYXRpb24tZ3JhcGgtdmFyaWFudCc7XG5cbmV4cG9ydCB0eXBlICogZnJvbSAnLi4vLi4vY29yZS9hc3NldHMvQHR5cGVzL3B1YmxpYyc7XG5leHBvcnQgdHlwZSB7IENyZWF0ZUFzc2V0T3B0aW9ucywgSUFzc2V0Q29uZmlnLCBJQXNzZXREQkluZm8sIElDcmVhdGVNZW51SW5mbywgSVVlckRhdGFDb25maWdJdGVtLCBRdWVyeUFzc2V0VHlwZSB9IGZyb20gJy4uLy4uL2NvcmUvYXNzZXRzL0B0eXBlcy9wcm90ZWN0ZWQnO1xuZXhwb3J0IHR5cGUgeyBGaWx0ZXJQbHVnaW5PcHRpb25zLCBJUGx1Z2luU2NyaXB0SW5mbyB9IGZyb20gJy4uLy4uL2NvcmUvc2NyaXB0aW5nL2ludGVyZmFjZSc7XG5leHBvcnQgdHlwZSB7IEFuaW1HcmFwaFZhcmlhbnREdW1wIH0gZnJvbSAnLi4vLi4vY29yZS9hc3NldHMvYW5pbWF0aW9uLWdyYXBoLXZhcmlhbnQnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyDliJ3lp4vljJbotYTmupDmlbDmja7lupNcbiAgICBjb25zdCB7IGluaXRBc3NldERCIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYXNzZXRzJyk7XG4gICAgYXdhaXQgaW5pdEFzc2V0REIoKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhc3NldCBmaWxlc3lzdGVtIHByb3ZpZGVyIGJlZm9yZSBpbml0aWFsaXppbmcgdGhlIGFzc2V0IGRhdGFiYXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0RmlsZVN5c3RlbVByb3ZpZGVyKHByb3ZpZGVyOiBJQXNzZXRGaWxlU3lzdGVtUHJvdmlkZXIpOiB2b2lkIHtcbiAgICBhc3NldERCTWFuYWdlci5zZXRGaWxlU3lzdGVtUHJvdmlkZXIocHJvdmlkZXIpO1xufVxuXG4vKipcbiAqIFN0YXJ0IEFzc2V0IERCIC8vIOWQr+WKqOi1hOa6kOaVsOaNruW6k++8jOW8gOWni+aJq+aPj+WSjOWvvOWFpei1hOa6kFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBzdGFydEFzc2V0REIgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9hc3NldHMnKTtcbiAgICBhd2FpdCBzdGFydEFzc2V0REIoKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBsaXN0ZW5lciBmb3Igd2hlbiBhbGwgYXNzZXQgZGF0YWJhc2VzIGFyZSBmdWxseSBpbml0aWFsaXplZC5cbiAqIFxuICog5rOo5YaM5pWw5o2u5bqT5Yid5aeL5YyW5a6M5YWo5a6M5oiQ5ZCO55qE5LqL5Lu255uR5ZCs44CCXG4gKiBcbiAqICoq5rOo5oSP5LqL6aG5IChOb3RpY2UpKio6XG4gKiAtIOinpuWPkeatpOS6i+S7tuS7o+ihqCoq5omA5pyJKirms6jlhoznmoTotYTmupDmlbDmja7lupPpg73lt7Lnu4/lrozlhajlr7zlhaXlubbliJ3lp4vljJblrozmiJDvvIjlkK/liqjpmLbmrrXnu5PmnZ/vvInjgIJcbiAqIC0g5pS25Yiw5q2k5LqL5Lu25ZCO77yM6KGo56S65omA5pyJ55qE6LWE5rqQ5p+l6K+i44CB5pON5L2cIEFQSSDpg73lj6/ku6XlronlhajosIPnlKjjgIJcbiAqIC0g56ys5LiA5qyhIHJlYWR5IOWQju+8jOWwhuS4jeWGjeaciSBwcm9ncmVzcyDov5vluqbmtojmga/jgIJcbiAqIFxuICogQHBhcmFtIGxpc3RlbmVyIOWbnuiwg+WHveaVsFxuICogQHJldHVybnMg56e76Zmk55uR5ZCs55qE5Ye95pWwXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvblJlYWR5KGxpc3RlbmVyOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgcmV0dXJuIGFzc2V0TWFuYWdlci5vblJlYWR5KGxpc3RlbmVyKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBsaXN0ZW5lciBmb3Igd2hlbiBhIHNwZWNpZmljIGRhdGFiYXNlIGZpbmlzaGVzIHN0YXJ0aW5nLlxuICogXG4gKiDms6jlhozljZXkuKrmlbDmja7lupPlkK/liqjlrozmiJDlkI7nmoTkuovku7bnm5HlkKzjgIJcbiAqIFxuICogKirms6jmhI/kuovpobkgKE5vdGljZSkqKjpcbiAqIC0g6L+Z5Liq5LqL5Lu25Y+v6IO95Lya6KKr6Kem5Y+R5aSa5qyh77yI5aaC5p6c6aG555uu5a2Y5Zyo5aSa5Liq5a2Q5pWw5o2u5bqT77yM5aaCIGBhc3NldHNgLCBgaW50ZXJuYWxg77yJ44CCXG4gKiAtIOS4u+imgeeUqOS6jumcgOimgeWBmuabtOeyvue7huWMluW5tuihjOaOp+WItueahOS4iuWxgumAu+i+ke+8jOmAmuW4uOaDheWGteS4i+aZrumAmueahOS4muWKoemAu+i+keS4jemcgOimgeWFs+W/g+atpOS6i+S7tu+8jOebtOaOpeebkeWQrCBgb25SZWFkeWAg5Y2z5Y+v44CCXG4gKiBcbiAqIEBwYXJhbSBsaXN0ZW5lciDlm57osIPlh73mlbDvvIzmjqXmlLblkK/liqjlrozmiJDnmoQgZGJJbmZvXG4gKiBAcmV0dXJucyDnp7vpmaTnm5HlkKznmoTlh73mlbBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uREJSZWFkeShsaXN0ZW5lcjogKGRiSW5mbzogSUFzc2V0REJJbmZvKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgcmV0dXJuIGFzc2V0TWFuYWdlci5vbkRCUmVhZHkobGlzdGVuZXIpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGxpc3RlbmVyIGZvciBpbml0aWFsaXphdGlvbiBwcm9ncmVzcy5cbiAqIFxuICog5rOo5YaM5Yid5aeL5YyW6L+H56iL5Lit55qE6L+b5bqm55uR5ZCs44CCXG4gKiBcbiAqICoq5rOo5oSP5LqL6aG5IChOb3RpY2UpKio6XG4gKiAtICoq5LuF5Zyo5ZCv5Yqo6Zi25q615pyJ5pWIKirjgILkuIDml6bop6blj5Hov4fkuIDmrKEgYHJlYWR5YCDkuovku7bvvIjljbPlkK/liqjpmLbmrrXnu5PmnZ/vvInvvIzlsIbkuI3lho3kvJrmnInmlrDnmoTov5vluqbmtojmga/jgIJcbiAqIC0g5ZCv5Yqo5pe255qE6LWE5rqQ5Ya35a+85YWl5Lya5oqb5Ye65a+G6ZuG55qE6L+b5bqm5L+h5oGv77yM5bu66K6u5ZyoIFVJIOWxgumdoui/m+ihjOmAguW9k+eahOiKgua1ge+8iHRocm90dGxl77yJ5riy5p+T44CCXG4gKiBcbiAqIEBwYXJhbSBsaXN0ZW5lciDlm57osIPlh73mlbDvvIzljIXlkKvlvZPliY3ov5vluqbjgIHmgLvmlbDjgIHlvZPliY3lpITnkIbnmoTotYTmupAgdXJsIOWSjOWvvOWFpeeKtuaAgVxuICogQHJldHVybnMg56e76Zmk55uR5ZCs55qE5Ye95pWwXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvblByb2dyZXNzKGxpc3RlbmVyOiAoY3VycmVudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCB1cmw6IHN0cmluZywgc3RhdGU6ICdwcm9jZXNzaW5nJyB8ICdzdWNjZXNzJyB8ICdmYWlsZWQnKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgcmV0dXJuIGFzc2V0TWFuYWdlci5vblByb2dyZXNzKGxpc3RlbmVyKTtcbn1cblxuLyoqXG4gKiBEZWxldGUgQXNzZXQgLy8g5Yig6Zmk6LWE5rqQXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVBc3NldChkYlBhdGg6IHN0cmluZywgb3B0aW9ucz86IERlbGV0ZUFzc2V0T3B0aW9ucyk6IFByb21pc2U8SUFzc2V0SW5mbyB8IG51bGw+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnJlbW92ZUFzc2V0KGRiUGF0aCwgb3B0aW9ucyk7XG59XG5cbi8qKlxuICogUmVmcmVzaCBBc3NldCBEaXJlY3RvcnkgLy8g5Yi35paw6LWE5rqQ55uu5b2VXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWZyZXNoKGRpcjogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnJlZnJlc2hBc3NldChkaXIpO1xufVxuXG4vKipcbiAqIFF1ZXJ5IEFzc2V0IEluZm8gLy8g5p+l6K+i6LWE5rqQ5L+h5oGvXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFzc2V0SW5mbyhcbiAgICB1cmxPclVVSURPclBhdGg6IHN0cmluZyxcbiAgICBkYXRhS2V5cz86IHN0cmluZ1tdIHwgdW5kZWZpbmVkXG4pOiBQcm9taXNlPElBc3NldEluZm8gfCBudWxsPiB7XG4gICAgY29uc3QgaW5mbyA9IGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1cmxPclVVSURPclBhdGgsIGRhdGFLZXlzIGFzIChrZXlvZiBJQXNzZXRJbmZvKVtdIHwgdW5kZWZpbmVkKTtcbiAgICAvLyBUaGlzIG1vZHVsZSBpcyBleHBvc2VkIHRocm91Z2ggdGhlIEVsZWN0cm9uIE1lc3NhZ2VQb3J0IFJQQyBicmlkZ2UuIFNvbWVcbiAgICAvLyBhc3NldC1kYiBpbXBsZW1lbnRhdGlvbnMgYXR0YWNoIGhlbHBlciBmdW5jdGlvbnMgdG8gb3RoZXJ3aXNlIHBsYWluIGFzc2V0XG4gICAgLy8gZGF0YTsgdGhvc2UgZnVuY3Rpb25zIGNhbm5vdCBiZSBzdHJ1Y3R1cmVkLWNsb25lZCBhbmQgbWFkZSBBc3NldCBQcmV2aWV3J3NcbiAgICAvLyBxdWVyeUFzc2V0SW5mbygpIGZhaWwgYmVmb3JlIGl0IGNhbiByZXNvbHZlIEZCWCBQcmVmYWIgc3ViLWFzc2V0cy5cbiAgICByZXR1cm4gaW5mbyA/IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoaW5mbykpIGFzIElBc3NldEluZm8gOiBudWxsO1xufVxuXG4vKipcbiAqIFF1ZXJ5IEFzc2V0IE1ldGFkYXRhIC8vIOafpeivoui1hOa6kOWFg+aVsOaNrlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlBc3NldE1ldGEodXJsT3JVVUlET3JQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElBc3NldE1ldGE8J3Vua25vd24nPiB8IG51bGw+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRNZXRhKHVybE9yVVVJRE9yUGF0aCk7XG59XG5cbi8qKlxuICogUXVlcnkgQ3JlYXRhYmxlIEFzc2V0IE1hcCAvLyDmn6Xor6Llj6/liJvlu7rotYTmupDmmKDlsITooahcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5Q3JlYXRlTWFwKCk6IFByb21pc2U8SUNyZWF0ZU1lbnVJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLmdldENyZWF0ZU1hcCgpO1xufVxuXG4vKipcbiAqIEJhdGNoIFF1ZXJ5IEFzc2V0IEluZm8gLy8g5om56YeP5p+l6K+i6LWE5rqQ5L+h5oGvXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFzc2V0SW5mb3Mob3B0aW9ucz86IFF1ZXJ5QXNzZXRzT3B0aW9uLCBkYXRhS2V5cz86IChrZXlvZiBJQXNzZXRJbmZvKVtdKTogUHJvbWlzZTxJQXNzZXRJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRJbmZvcyhvcHRpb25zLCBkYXRhS2V5cyk7XG59XG5cbi8qKlxuICogUXVlcnkgQWxsIEFzc2V0IERhdGFiYXNlIEluZm8gLy8g5p+l6K+i5omA5pyJ6LWE5rqQ5pWw5o2u5bqT5L+h5oGvXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFzc2V0REJJbmZvcygpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIElBc3NldERCSW5mbz4+IHtcbiAgICByZXR1cm4gYXNzZXREQk1hbmFnZXIuYXNzZXREQkluZm87XG59XG5cbi8qKlxuICogQ3JlYXRlIEFzc2V0IEJ5IFR5cGUgLy8g5oyJ57G75Z6L5Yib5bu66LWE5rqQXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVBc3NldEJ5VHlwZShcbiAgICBjY1R5cGU6IElTdXBwb3J0Q3JlYXRlVHlwZSxcbiAgICBkaXJPclVybDogc3RyaW5nLFxuICAgIGJhc2VOYW1lOiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IENyZWF0ZUFzc2V0QnlUeXBlT3B0aW9uc1xuKTogUHJvbWlzZTxJQXNzZXRJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IGFzc2V0TWFuYWdlci5jcmVhdGVBc3NldEJ5VHlwZShjY1R5cGUsIGRpck9yVXJsLCBiYXNlTmFtZSwgb3B0aW9ucyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIEFzc2V0IC8vIOWIm+W7uui1hOa6kFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQXNzZXQoXG4gICAgb3B0aW9uczogQ3JlYXRlQXNzZXRPcHRpb25zXG4pOiBQcm9taXNlPElBc3NldEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLmNyZWF0ZUFzc2V0KG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEltcG9ydCBBc3NldCAvLyDlr7zlhaXotYTmupBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydEFzc2V0KFxuICAgIHNvdXJjZTogc3RyaW5nLFxuICAgIHRhcmdldDogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBBc3NldE9wZXJhdGlvbk9wdGlvblxuKTogUHJvbWlzZTxJQXNzZXRJbmZvW10+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLmltcG9ydEFzc2V0KHNvdXJjZSwgdGFyZ2V0LCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBDb3B5IEFzc2V0IC8vIOWkjeWItui1hOa6kOWPiuWFtuWujOaVtOWFg+aVsOaNrlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29weUFzc2V0KFxuICAgIHNvdXJjZTogc3RyaW5nLFxuICAgIHRhcmdldDogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBBc3NldE9wZXJhdGlvbk9wdGlvblxuKTogUHJvbWlzZTxJQXNzZXRJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IGFzc2V0TWFuYWdlci5jb3B5QXNzZXQoc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIFJlaW1wb3J0IEFzc2V0IC8vIOmHjeaWsOWvvOWFpei1hOa6kFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVpbXBvcnRBc3NldChwYXRoT3JVcmxPclVVSUQ6IHN0cmluZyk6IFByb21pc2U8SUFzc2V0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCBhc3NldE1hbmFnZXIucmVpbXBvcnRBc3NldChwYXRoT3JVcmxPclVVSUQpO1xufVxuXG4vKipcbiAqIFNhdmUgQXNzZXQgLy8g5L+d5a2Y6LWE5rqQXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYXZlQXNzZXQoXG4gICAgcGF0aE9yVXJsT3JVVUlEOiBzdHJpbmcsXG4gICAgZGF0YTogc3RyaW5nIHwgQnVmZmVyXG4pOiBQcm9taXNlPElBc3NldEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnNhdmVBc3NldChwYXRoT3JVcmxPclVVSUQsIGRhdGEpO1xufVxuXG5leHBvcnQgY29uc3QgYW5pbWF0aW9uR3JhcGhWYXJpYW50ID0ge1xuICAgIHF1ZXJ5KHV1aWQ6IHN0cmluZyk6IFByb21pc2U8QW5pbUdyYXBoVmFyaWFudER1bXA+IHtcbiAgICAgICAgcmV0dXJuIGFzc2V0TWFuYWdlci5xdWVyeUFuaW1hdGlvbkdyYXBoVmFyaWFudCh1dWlkKTtcbiAgICB9LFxuXG4gICAgY2hhbmdlKHV1aWQ6IHN0cmluZywgZHVtcDogQW5pbUdyYXBoVmFyaWFudER1bXApOiBQcm9taXNlPEFuaW1HcmFwaFZhcmlhbnREdW1wPiB7XG4gICAgICAgIHJldHVybiBhc3NldE1hbmFnZXIuY2hhbmdlQW5pbWF0aW9uR3JhcGhWYXJpYW50KHV1aWQsIGR1bXApO1xuICAgIH0sXG5cbiAgICBzYXZlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gYXNzZXRNYW5hZ2VyLnNhdmVBbmltYXRpb25HcmFwaFZhcmlhbnQodXVpZCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBhbmltYXRpb25NYXNrID0ge1xuICAgIGFzeW5jIHF1ZXJ5KHV1aWQ6IHN0cmluZyk6IFByb21pc2U8QW5pbWF0aW9uTWFza0R1bXA+IHtcbiAgICAgICAgY29uc3QgeyBxdWVyeUFuaW1hdGlvbk1hc2sgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9hc3NldHMvYW5pbWF0aW9uLW1hc2snKTtcbiAgICAgICAgcmV0dXJuIHF1ZXJ5QW5pbWF0aW9uTWFzayh1dWlkKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgaW1wb3J0U2tlbGV0b24odXVpZDogc3RyaW5nLCBza2VsZXRvblNvdXJjZVV1aWQ6IHN0cmluZyk6IFByb21pc2U8QW5pbWF0aW9uTWFza0R1bXA+IHtcbiAgICAgICAgY29uc3QgeyBpbXBvcnRBbmltYXRpb25NYXNrU2tlbGV0b24gfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9hc3NldHMvYW5pbWF0aW9uLW1hc2snKTtcbiAgICAgICAgcmV0dXJuIGltcG9ydEFuaW1hdGlvbk1hc2tTa2VsZXRvbih1dWlkLCBza2VsZXRvblNvdXJjZVV1aWQpO1xuICAgIH0sXG5cbiAgICBhc3luYyBjbGVhck5vZGVzKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8QW5pbWF0aW9uTWFza0R1bXA+IHtcbiAgICAgICAgY29uc3QgeyBjbGVhckFuaW1hdGlvbk1hc2tOb2RlcyB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL2Fzc2V0cy9hbmltYXRpb24tbWFzaycpO1xuICAgICAgICByZXR1cm4gY2xlYXJBbmltYXRpb25NYXNrTm9kZXModXVpZCk7XG4gICAgfSxcblxuICAgIGFzeW5jIGNoYW5nZUR1bXAodXVpZDogc3RyaW5nLCBjaGFuZ2VzOiBBbmltYXRpb25NYXNrQ2hhbmdlW10pOiBQcm9taXNlPEFuaW1hdGlvbk1hc2tEdW1wPiB7XG4gICAgICAgIGNvbnN0IHsgY2hhbmdlQW5pbWF0aW9uTWFza0R1bXAgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9hc3NldHMvYW5pbWF0aW9uLW1hc2snKTtcbiAgICAgICAgcmV0dXJuIGNoYW5nZUFuaW1hdGlvbk1hc2tEdW1wKHV1aWQsIGNoYW5nZXMpO1xuICAgIH0sXG5cbiAgICBhc3luYyBzYXZlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7IHNhdmVBbmltYXRpb25NYXNrIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvYXNzZXRzL2FuaW1hdGlvbi1tYXNrJyk7XG4gICAgICAgIHJldHVybiBzYXZlQW5pbWF0aW9uTWFzayh1dWlkKTtcbiAgICB9LFxufTtcblxuLyoqXG4gKiBRdWVyeSBzZXJpYWxpemVkIGFzc2V0IGR1bXAgZGF0YS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5U2VyaWFsaXplZERhdGEodXVpZE9yVXJsT3JQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFNlcmlhbGl6ZWRBc3NldFF1ZXJ5UmVzdWx0PiB7XG4gICAgcmV0dXJuIGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeVNlcmlhbGl6ZWREYXRhKHV1aWRPclVybE9yUGF0aCk7XG59XG5cbi8qKlxuICogU2F2ZSBzZXJpYWxpemVkIGFzc2V0IGR1bXAgZGF0YS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmVTZXJpYWxpemVkRGF0YShcbiAgICB1dWlkT3JVcmxPclBhdGg6IHN0cmluZyxcbiAgICBwYXRjaDogU2VyaWFsaXplZEFzc2V0UGF0Y2hcbik6IFByb21pc2U8U2VyaWFsaXplZEFzc2V0UXVlcnlSZXN1bHQ+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnNhdmVTZXJpYWxpemVkRGF0YSh1dWlkT3JVcmxPclBhdGgsIHBhdGNoKTtcbn1cblxuZXhwb3J0IGNvbnN0IHNlcmlhbGl6ZWREYXRhID0ge1xuICAgIHF1ZXJ5OiBxdWVyeVNlcmlhbGl6ZWREYXRhLFxuICAgIHNhdmU6IHNhdmVTZXJpYWxpemVkRGF0YSxcbn07XG5cbi8qKlxuICogUXVlcnkgYWxsIGF2YWlsYWJsZSBtYXRlcmlhbCBlZmZlY3RzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlNYXRlcmlhbEFsbEVmZmVjdHMoKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBNYXRlcmlhbEVmZmVjdEluZm8+PiB7XG4gICAgcmV0dXJuIGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeU1hdGVyaWFsQWxsRWZmZWN0cygpO1xufVxuXG4vKipcbiAqIFF1ZXJ5IG9uZSBtYXRlcmlhbCBlZmZlY3QgZHVtcCBieSBVVUlEIG9yIGVmZmVjdCBuYW1lLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlNYXRlcmlhbEVmZmVjdChlZmZlY3ROYW1lT3JVdWlkOiBzdHJpbmcpOiBQcm9taXNlPE1hdGVyaWFsVGVjaG5pcXVlRHVtcFtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeU1hdGVyaWFsRWZmZWN0KGVmZmVjdE5hbWVPclV1aWQpO1xufVxuXG4vKipcbiAqIFF1ZXJ5IG1hdGVyaWFsIGR1bXAgZGF0YS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5TWF0ZXJpYWwodXVpZE9yVXJsT3JQYXRoOiBzdHJpbmcpOiBQcm9taXNlPE1hdGVyaWFsRHVtcD4ge1xuICAgIHJldHVybiBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlNYXRlcmlhbCh1dWlkT3JVcmxPclBhdGgpO1xufVxuXG4vKipcbiAqIFNhdmUgbWF0ZXJpYWwgZHVtcCBkYXRhLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZU1hdGVyaWFsKHV1aWRPclVybE9yUGF0aDogc3RyaW5nLCBkdW1wOiBNYXRlcmlhbER1bXApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnNhdmVNYXRlcmlhbCh1dWlkT3JVcmxPclBhdGgsIGR1bXApO1xufVxuXG5leHBvcnQgY29uc3QgbWF0ZXJpYWwgPSB7XG4gICAgcXVlcnk6IHF1ZXJ5TWF0ZXJpYWwsXG4gICAgcXVlcnlFZmZlY3Q6IHF1ZXJ5TWF0ZXJpYWxFZmZlY3QsXG4gICAgcXVlcnlBbGxFZmZlY3RzOiBxdWVyeU1hdGVyaWFsQWxsRWZmZWN0cyxcbiAgICBzYXZlOiBzYXZlTWF0ZXJpYWwsXG59O1xuXG4vKipcbiAqIFF1ZXJ5IEFzc2V0IFVVSUQgLy8g5p+l6K+i6LWE5rqQIFVVSURcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5VVVJRCh1cmxPclBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBhc3NldE1hbmFnZXIucXVlcnlVVUlEKHVybE9yUGF0aCk7XG59XG5cbi8qKlxuICogUXVlcnkgQXNzZXQgUGF0aCAvLyDmn6Xor6LotYTmupDot6/lvoRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5UGF0aCh1cmxPclV1aWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGFzc2V0TWFuYWdlci5xdWVyeVBhdGgodXJsT3JVdWlkKTtcbn1cblxuLyoqXG4gKiBRdWVyeSBBc3NldCBVUkwgLy8g5p+l6K+i6LWE5rqQIFVSTFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlVcmwodXVpZE9yUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYXNzZXRNYW5hZ2VyLnF1ZXJ5VXJsKHV1aWRPclBhdGgpO1xufVxuXG4vKipcbiAqIFF1ZXJ5IEFzc2V0IERlcGVuZGVuY2llcyAvLyDmn6Xor6LotYTmupDkvp3otZZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5QXNzZXREZXBlbmRlbmNpZXMoXG4gICAgdXVpZE9yVXJsOiBzdHJpbmcsXG4gICAgdHlwZTogUXVlcnlBc3NldFR5cGUgPSAnYXNzZXQnXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0RGVwZW5kZW5jaWVzKHV1aWRPclVybCwgdHlwZSk7XG59XG5cbi8qKlxuICogUXVlcnkgQXNzZXQgVXNlcnMgLy8g5p+l6K+i6LWE5rqQ5L2/55So6ICFXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFzc2V0VXNlcnMoXG4gICAgdXVpZE9yVXJsOiBzdHJpbmcsXG4gICAgdHlwZTogUXVlcnlBc3NldFR5cGUgPSAnYXNzZXQnXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0VXNlcnModXVpZE9yVXJsLCB0eXBlKTtcbn1cblxuLyoqXG4gKiBRdWVyeSBTb3J0ZWQgUGx1Z2luIFNjcmlwdHMgLy8g5p+l6K+i5o6S5bqP5ZCO55qE5o+S5Lu26ISa5pysXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeVNvcnRlZFBsdWdpbnMoXG4gICAgZmlsdGVyT3B0aW9uczogRmlsdGVyUGx1Z2luT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPElQbHVnaW5TY3JpcHRJbmZvW10+IHtcbiAgICByZXR1cm4gYXNzZXRNYW5hZ2VyLnF1ZXJ5U29ydGVkUGx1Z2lucyhmaWx0ZXJPcHRpb25zKTtcbn1cblxuLyoqXG4gKiBSZW5hbWUgQXNzZXQgLy8g6YeN5ZG95ZCN6LWE5rqQXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5hbWVBc3NldChcbiAgICBzb3VyY2U6IHN0cmluZyxcbiAgICBuZXdOYW1lOiBzdHJpbmcsXG4gICAgb3B0aW9uczogQXNzZXRPcGVyYXRpb25PcHRpb24gPSB7fVxuKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnJlbmFtZUFzc2V0KHNvdXJjZSwgbmV3TmFtZSwgb3B0aW9ucyk7XG59XG5cbi8qKlxuICogTW92ZSBBc3NldCAvLyDnp7vliqjotYTmupBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1vdmVBc3NldChcbiAgICBzb3VyY2U6IHN0cmluZyxcbiAgICB0YXJnZXQ6IHN0cmluZyxcbiAgICBvcHRpb25zOiBBc3NldE9wZXJhdGlvbk9wdGlvbiA9IHt9XG4pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBhd2FpdCBhc3NldE1hbmFnZXIubW92ZUFzc2V0KHNvdXJjZSwgdGFyZ2V0LCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgRGVmYXVsdCBVc2VyIERhdGEgLy8g5pu05paw6buY6K6k55So5oi35pWw5o2uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVEZWZhdWx0VXNlckRhdGEoXG4gICAgaGFuZGxlcjogc3RyaW5nLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICB2YWx1ZTogYW55XG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnVwZGF0ZURlZmF1bHRVc2VyRGF0YShoYW5kbGVyLCBwYXRoLCB2YWx1ZSk7XG59XG5cbi8qKlxuICogUXVlcnkgQXNzZXQgVXNlciBEYXRhIENvbmZpZyAvLyDmn6Xor6LotYTmupDnlKjmiLfmlbDmja7phY3nva5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5QXNzZXRVc2VyRGF0YUNvbmZpZyhcbiAgICB1cmxPclV1aWRPclBhdGg6IHN0cmluZ1xuKTogUHJvbWlzZTxmYWxzZSB8IFJlY29yZDxzdHJpbmcsIElVZXJEYXRhQ29uZmlnSXRlbT4gfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBhc3NldCA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0KHVybE9yVXVpZE9yUGF0aCk7XG4gICAgaWYgKGFzc2V0KSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlBc3NldFVzZXJEYXRhQ29uZmlnKGFzc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBBc3NldCBVc2VyIERhdGEgLy8g5pu05paw6LWE5rqQ55So5oi35pWw5o2uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVBc3NldFVzZXJEYXRhKFxuICAgIHVybE9yVXVpZE9yUGF0aDogc3RyaW5nLFxuICAgIHVzZXJEYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBhd2FpdCBhc3NldE1hbmFnZXIudXBkYXRlVXNlckRhdGEodXJsT3JVdWlkT3JQYXRoLCB1c2VyRGF0YSk7XG59XG5cbi8qKlxuICogVXBkYXRlIEFzc2V0IFVzZXIgRGF0YSBCeSBQYXRoIC8vIOaMiei3r+W+hOabtOaWsOi1hOa6kOeUqOaIt+aVsOaNrlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlQXNzZXRVc2VyRGF0YUJ5UGF0aChcbiAgICB1cmxPclV1aWRPclBhdGg6IHN0cmluZyxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgdmFsdWU6IGFueVxuKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnVwZGF0ZVVzZXJEYXRhQnlQYXRoKHVybE9yVXVpZE9yUGF0aCwgcGF0aCwgdmFsdWUpO1xufVxuXG4vKipcbiAqIFF1ZXJ5IEFzc2V0IENvbmZpZyBNYXAgLy8g5p+l6K+i6LWE5rqQ6YWN572u5pig5bCE6KGoXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUFzc2V0Q29uZmlnTWFwKCk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgSUFzc2V0Q29uZmlnPj4ge1xuICAgIHJldHVybiBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlBc3NldENvbmZpZ01hcCgpO1xufVxuXG4vKipcbiAqIFF1ZXJ5IEFzc2V0IFByb3BlcnR5IFNjaGVtYSAvLyDmn6Xor6LotYTmupDlr7zlhaXlsZ7mgKcgc2NoZW1hXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeVByb3BlcnR5U2NoZW1hKGltcG9ydGVyOiBzdHJpbmcpOiBQcm9taXNlPEFzc2V0UHJvcGVydHlTY2hlbWFNYXA+IHtcbiAgICByZXR1cm4gYXdhaXQgYXNzZXRNYW5hZ2VyLnF1ZXJ5UHJvcGVydHlTY2hlbWEoaW1wb3J0ZXIpO1xufVxuXG4vKipcbiAqIFF1ZXJ5IFRodW1ibmFpbCBIYW5kbGVycyAvLyDmn6Xor6LmlK/mjIHnvKnnlaXlm77nlJ/miJDnmoTotYTmupDlpITnkIblmajliJfooahcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5VGh1bWJuYWlsSGFuZGxlcnMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBhc3NldE1hbmFnZXIucXVlcnlUaHVtYm5haWxIYW5kbGVycygpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIFRodW1ibmFpbCAvLyDnlJ/miJDotYTmupDnvKnnlaXlm75cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlVGh1bWJuYWlsKFxuICAgIHVybE9yVVVJRE9yUGF0aDogc3RyaW5nLCBzaXplPzogVGh1bWJuYWlsU2l6ZVxuKTogUHJvbWlzZTxUaHVtYm5haWxJbmZvIHwgbnVsbD4ge1xuICAgIHJldHVybiBhc3NldE1hbmFnZXIuZ2VuZXJhdGVUaHVtYm5haWwodXJsT3JVVUlET3JQYXRoLCBzaXplKTtcbn1cblxuLyoqXG4gKiBMaXN0ZW4gdG8gQXNzZXQgQWRkZWQgRXZlbnQgLy8g55uR5ZCs6LWE5rqQ5re75Yqg5LqL5Lu2XG4gKiBAcGFyYW0gbGlzdGVuZXIgQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhc3NldCBpbmZvcm1hdGlvblxuICogQHJldHVybnMgRnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lclxuICogXG4gKiDmjqjojZDnlKjms5XvvJpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHJlbW92ZUxpc3RlbmVyID0gb25Bc3NldEFkZGVkKChpbmZvKSA9PiB7XG4gKiAgICAgY29uc29sZS5sb2coYOi1hOa6kOW3sua3u+WKoDogJHtpbmZvLm5hbWV9YCk7XG4gKiAgICAgY29uc29sZS5sb2coYCAg6YC76L6R6Lev5b6EOiAke2luZm8udXJsfWApO1xuICogICAgIGNvbnNvbGUubG9nKGAgIOeJqeeQhui3r+W+hDogJHtpbmZvLmZpbGV9YCk7XG4gKiB9KTtcbiAqIC8vIOeojeWQjuenu+mZpOebkeWQrFxuICogcmVtb3ZlTGlzdGVuZXIoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gb25Bc3NldEFkZGVkKGxpc3RlbmVyOiAoaW5mbzogSUFzc2V0SW5mbykgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICAgIHJldHVybiBhc3NldE1hbmFnZXIub25Bc3NldEFkZGVkKGxpc3RlbmVyKTtcbn1cblxuLyoqXG4gKiBMaXN0ZW4gdG8gQXNzZXQgQ2hhbmdlZCBFdmVudCAvLyDnm5HlkKzotYTmupDlj5jmm7Tkuovku7ZcbiAqIEBwYXJhbSBsaXN0ZW5lciBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGFzc2V0IGluZm9ybWF0aW9uXG4gKiBAcmV0dXJucyBGdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyXG4gKiBcbiAqIOaOqOiNkOeUqOazle+8mlxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgcmVtb3ZlTGlzdGVuZXIgPSBvbkFzc2V0Q2hhbmdlZCgoaW5mbykgPT4ge1xuICogICAgIGNvbnNvbGUubG9nKGDotYTmupDlt7Llj5jmm7Q6ICR7aW5mby5uYW1lfWApO1xuICogfSk7XG4gKiAvLyDnqI3lkI7np7vpmaTnm5HlkKxcbiAqIHJlbW92ZUxpc3RlbmVyKCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uQXNzZXRDaGFuZ2VkKGxpc3RlbmVyOiAoaW5mbzogSUFzc2V0SW5mbykgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICAgIHJldHVybiBhc3NldE1hbmFnZXIub25Bc3NldENoYW5nZWQobGlzdGVuZXIpO1xufVxuXG4vKipcbiAqIExpc3RlbiB0byBBc3NldCBSZW1vdmVkIEV2ZW50IC8vIOebkeWQrOi1hOa6kOWIoOmZpOS6i+S7tlxuICogQHBhcmFtIGxpc3RlbmVyIENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYXNzZXQgaW5mb3JtYXRpb25cbiAqIEByZXR1cm5zIEZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJcbiAqIFxuICog5o6o6I2Q55So5rOV77yaXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCByZW1vdmVMaXN0ZW5lciA9IG9uQXNzZXRSZW1vdmVkKChpbmZvKSA9PiB7XG4gKiAgICAgY29uc29sZS5sb2coYOi1hOa6kOW3suWIoOmZpDogJHtpbmZvLm5hbWV9YCk7XG4gKiB9KTtcbiAqIC8vIOeojeWQjuenu+mZpOebkeWQrFxuICogcmVtb3ZlTGlzdGVuZXIoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gb25Bc3NldFJlbW92ZWQobGlzdGVuZXI6IChpbmZvOiBJQXNzZXRJbmZvKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgcmV0dXJuIGFzc2V0TWFuYWdlci5vbkFzc2V0UmVtb3ZlZChsaXN0ZW5lcik7XG59XG5cbiJdfQ==