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
const asset_db_1 = __importDefault(require("./asset-db"));
const utils_1 = require("../utils");
const events_1 = __importDefault(require("events"));
const query_1 = __importStar(require("./query"));
const operation_1 = __importDefault(require("./operation"));
const asset_handler_1 = __importDefault(require("./asset-handler"));
const animation_graph_variant_1 = __importDefault(require("../animation-graph-variant"));
const serializedData = __importStar(require("../serialized-data"));
const materialService = __importStar(require("../material-service"));
const image_processing_1 = require("../image-processing");
/**
 * 对外暴露一系列的资源查询、操作接口等
 * 对外暴露资源的一些变动广播消息、事件消息
 */
class AssetManager extends events_1.default {
    // --------- query ---------
    queryAssets = query_1.default.queryAssets.bind(query_1.default);
    queryAssetDependencies = query_1.default.queryAssetDependencies.bind(query_1.default);
    queryAssetUsers = query_1.default.queryAssetUsers.bind(query_1.default);
    queryAsset = query_1.default.queryAsset.bind(query_1.default);
    queryAssetInfo = query_1.default.queryAssetInfo.bind(query_1.default);
    queryAssetInfoByUUID = query_1.default.queryAssetInfoByUUID.bind(query_1.default);
    queryAssetInfos = query_1.default.queryAssetInfos.bind(query_1.default);
    querySortedPlugins = query_1.default.querySortedPlugins.bind(query_1.default);
    queryUUID = query_1.default.queryUUID.bind(query_1.default);
    queryPath = query_1.default.queryPath.bind(query_1.default);
    queryUrl = query_1.default.queryUrl.bind(query_1.default);
    generateAvailableURL = query_1.default.generateAvailableURL.bind(query_1.default);
    queryDBAssetInfo = query_1.default.queryDBAssetInfo.bind(query_1.default);
    encodeAsset = query_1.default.encodeAsset.bind(query_1.default);
    queryAssetProperty = query_1.default.queryAssetProperty.bind(query_1.default);
    queryAssetMeta = query_1.default.queryAssetMeta.bind(query_1.default);
    querySubAssetName = query_1.default.querySubAssetName.bind(query_1.default);
    queryAssetMtime = query_1.default.queryAssetMtime.bind(query_1.default);
    // ---------- operation ---------
    importAsset = operation_1.default.importAsset.bind(operation_1.default);
    copyAsset = operation_1.default.copyAsset.bind(operation_1.default);
    saveAssetMeta = operation_1.default.saveAssetMeta.bind(operation_1.default);
    saveAsset = operation_1.default.saveAsset.bind(operation_1.default);
    createAsset = operation_1.default.createAsset.bind(operation_1.default);
    refreshAsset = operation_1.default.refreshAsset.bind(operation_1.default);
    reimportAsset = operation_1.default.reimportAsset.bind(operation_1.default);
    renameAsset = operation_1.default.renameAsset.bind(operation_1.default);
    removeAsset = operation_1.default.removeAsset.bind(operation_1.default);
    moveAsset = operation_1.default.moveAsset.bind(operation_1.default);
    generateExportData = operation_1.default.generateExportData.bind(operation_1.default);
    outputExportData = operation_1.default.outputExportData.bind(operation_1.default);
    createAssetByType = operation_1.default.createAssetByType.bind(operation_1.default);
    updateUserData = operation_1.default.updateUserData.bind(operation_1.default);
    updateUserDataByPath = operation_1.default.updateUserDataByPath.bind(operation_1.default);
    querySerializedData = serializedData.querySerializedData;
    saveSerializedData = serializedData.saveSerializedData;
    queryMaterial = materialService.queryMaterial;
    queryMaterialEffect = materialService.queryEffect;
    queryMaterialAllEffects = materialService.queryAllEffects;
    saveMaterial = materialService.saveMaterial;
    // ---------- animation graph variant ---------
    queryAnimationGraphVariant = animation_graph_variant_1.default.query.bind(animation_graph_variant_1.default);
    changeAnimationGraphVariant = animation_graph_variant_1.default.change.bind(animation_graph_variant_1.default);
    saveAnimationGraphVariant = animation_graph_variant_1.default.save.bind(animation_graph_variant_1.default);
    // ----------- assetHandlerManager ------------
    queryAssetConfigMap = asset_handler_1.default.queryAssetConfigMap.bind(asset_handler_1.default);
    queryPropertySchema = asset_handler_1.default.queryPropertySchema.bind(asset_handler_1.default);
    updateDefaultUserData = asset_handler_1.default.updateDefaultUserData.bind(asset_handler_1.default);
    getCreateMap = asset_handler_1.default.getCreateMap.bind(asset_handler_1.default);
    queryAssetUserDataConfig = asset_handler_1.default.queryUserDataConfig.bind(asset_handler_1.default);
    queryThumbnailHandlers = asset_handler_1.default.queryThumbnailHandlers.bind(asset_handler_1.default);
    async generateThumbnail(urlOrUUIDOrPath, size) {
        const asset = this.queryAsset(urlOrUUIDOrPath);
        if (!asset) {
            return null;
        }
        return asset_handler_1.default.generateThumbnail(asset, size);
    }
    async extractImagePixels(urlOrUUIDOrPath, options) {
        const assetInfo = this.queryAssetInfo(urlOrUUIDOrPath);
        if (!assetInfo?.file) {
            return null;
        }
        return (0, image_processing_1.extractImagePixelsFromFile)(assetInfo.file, options);
    }
    getEffectBinPath() {
        return asset_handler_1.default.getEffectBinPath();
    }
    ;
    url2uuid(url) {
        return (0, utils_1.url2uuid)(url);
    }
    url2path(url) {
        return (0, utils_1.url2path)(url);
    }
    path2url(url, dbName) {
        return asset_db_1.default.path2url(url, dbName);
    }
    // ------------- 监听方法 ------------
    /**
     * 监听资源添加事件
     * @param listener 回调函数
     * @returns 移除监听的函数
     */
    onAssetAdded(listener) {
        this.on('onAssetAdded', listener);
        return () => {
            this.removeListener('onAssetAdded', listener);
        };
    }
    /**
     * 监听资源变更事件
     * @param listener 回调函数
     * @returns 移除监听的函数
     */
    onAssetChanged(listener) {
        this.on('onAssetChanged', listener);
        return () => {
            this.removeListener('onAssetChanged', listener);
        };
    }
    /**
     * 监听资源删除事件
     * @param listener 回调函数
     * @returns 移除监听的函数
     */
    onAssetRemoved(listener) {
        this.on('onAssetRemoved', listener);
        return () => {
            this.removeListener('onAssetRemoved', listener);
        };
    }
    // ------------- 实例化方法 ------------
    async init() {
        asset_db_1.default.on('db-created', this._onAssetDBCreated);
        asset_db_1.default.on('db-removed', this._onAssetDBRemoved);
        // 当所有数据库 ready 后，移除启动阶段的进度追踪监听器
        asset_db_1.default.once('assets:ready', () => {
            this._removeProgressListeners();
        });
    }
    destroyed() {
        asset_db_1.default.removeListener('db-created', this._onAssetDBCreated);
        asset_db_1.default.removeListener('db-removed', this._onAssetDBRemoved);
    }
    /**
     * 从资源对象提取变更信息
     * @param asset 资源对象
     * @returns 资源变更信息
     */
    _extractAssetChangeInfo(asset) {
        if (!asset || !asset.uuid) {
            return null;
        }
        return assetManager.queryAssetInfo(asset.uuid, query_1.ASSET_TREE_INFO_DATA_KEYS);
    }
    _snapshotAssetChangeInfo(asset) {
        if (!asset || !asset.uuid) {
            return null;
        }
        return query_1.default.encodeAsset(asset, ['subAssets', 'displayName'], true);
    }
    _onAssetDBCreated(db) {
        db.on('unresponsive', onUnResponsive);
        // 启动阶段的进度追踪监听器（只有在 ready 前创建的 db 才需要，且 ready 后会被统一移除）
        if (!asset_db_1.default.ready) {
            db.on('add', assetManager._onAssetAdd);
            db.on('change', assetManager._onAssetChange);
            db.on('delete', assetManager._onAssetDelete);
        }
        // 正常运行时的事件监听器（一直保留）
        db.on('added', assetManager._onAssetAdded);
        db.on('changed', assetManager._onAssetChanged);
        db.on('deleted', assetManager._onAssetDeleted);
    }
    _onAssetDBRemoved(db) {
        db.removeListener('unresponsive', onUnResponsive);
        // 移除启动阶段的进度追踪监听器
        db.removeListener('add', assetManager._onAssetAdd);
        db.removeListener('change', assetManager._onAssetChange);
        db.removeListener('delete', assetManager._onAssetDelete);
        // 移除正常运行时的事件监听器
        db.removeListener('added', assetManager._onAssetAdded);
        db.removeListener('changed', assetManager._onAssetChanged);
        db.removeListener('deleted', assetManager._onAssetDeleted);
    }
    /**
     * 移除所有数据库的启动阶段进度追踪监听器
     * 在 ready 后调用，清理不再需要的监听器
     */
    _removeProgressListeners() {
        for (const name in asset_db_1.default.assetDBMap) {
            const db = asset_db_1.default.assetDBMap[name];
            if (db) {
                db.removeListener('add', assetManager._onAssetAdd);
                db.removeListener('change', assetManager._onAssetChange);
                db.removeListener('delete', assetManager._onAssetDelete);
            }
        }
    }
    _getImportState(asset, defaultState) {
        if (asset.invalid || asset.importError) {
            return 'failed';
        }
        return defaultState;
    }
    _emitProgress(asset, state) {
        let globalCurrent = 0;
        let globalTotal = 0;
        // 汇总所有数据库的进度
        for (const name in asset_db_1.default.assetDBMap) {
            const db = asset_db_1.default.assetDBMap[name];
            if (db && db.assetProgressInfo) {
                globalCurrent += db.assetProgressInfo.current || 0;
                globalTotal += db.assetProgressInfo.total || 0;
            }
        }
        this.emit('progress', globalCurrent, globalTotal, asset.url, this._getImportState(asset, state));
    }
    _onAssetAdd = async (asset) => {
        this._emitProgress(asset, 'processing');
    };
    _onAssetChange = async (asset) => {
        this._emitProgress(asset, 'processing');
    };
    _onAssetDelete = async (asset) => {
        this._emitProgress(asset, 'processing');
    };
    _onAssetAdded = async (asset) => {
        if (asset_db_1.default.ready) {
            this.emit('asset-add', asset);
            this.emit('onAssetAdded', this._extractAssetChangeInfo(asset));
            console.log(`asset-add ${asset.url}`);
            return;
        }
        this._emitProgress(asset, 'success');
    };
    _onAssetChanged = async (asset) => {
        if (asset_db_1.default.ready) {
            this.emit('asset-change', asset);
            this.emit('onAssetChanged', this._extractAssetChangeInfo(asset));
            console.log(`asset-change ${asset.url}`);
            return;
        }
        this._emitProgress(asset, 'success');
    };
    _onAssetDeleted = async (asset) => {
        if (asset_db_1.default.ready) {
            const removedInfo = this._snapshotAssetChangeInfo(asset);
            await asset_handler_1.default.destroyAsset(asset);
            this.emit('asset-delete', asset);
            this.emit('onAssetRemoved', removedInfo);
            console.log(`asset-delete ${asset.url}`);
            return;
        }
        this._emitProgress(asset, 'success');
    };
    /**
     * 注册数据库初始化完全完成后的事件监听。
     *
     * **注意事项 (Notice)**:
     * - 触发此事件代表**所有**注册的资源数据库都已经完全导入并初始化完成（启动阶段结束）。
     * - 第一次 ready 后，将不再有 progress 进度消息。
     * - ready 后会自动移除启动阶段的进度追踪监听器（add/change/delete），这些监听器仅在启动阶段用于进度追踪。
     *
     * @param listener 回调函数
     * @returns 移除监听的函数
     */
    onReady(listener) {
        asset_db_1.default.on('assets:ready', listener);
        return () => {
            asset_db_1.default.removeListener('assets:ready', listener);
        };
    }
    /**
     * 注册单个数据库启动完成后的事件监听。
     *
     * **注意事项 (Notice)**:
     * - 这个事件可能会被触发多次（如果项目存在多个子数据库，如 `assets`, `internal`）。
     * - 主要用于需要做更精细化并行控制的上层逻辑，通常情况下普通的业务逻辑不需要关心此事件，直接监听 `onReady` 即可。
     *
     * @param listener 回调函数，接收启动完成的 dbInfo
     * @returns 移除监听的函数
     */
    onDBReady(listener) {
        asset_db_1.default.on('assets:db-ready', listener);
        return () => {
            asset_db_1.default.removeListener('assets:db-ready', listener);
        };
    }
    /**
     * 注册初始化过程中的进度监听。
     *
     * **注意事项 (Notice)**:
     * - **仅在启动阶段有效**。一旦触发过一次 `ready` 事件（即启动阶段结束），将不再会有新的进度消息。
     * - 启动时的资源冷导入会抛出密集的进度信息，建议在 UI 层面进行适当的节流（throttle）渲染。
     *
     * @param listener 回调函数，包含当前进度、总数、当前处理的资源 url 以及导入状态
     * @returns 移除监听的函数
     */
    onProgress(listener) {
        this.on('progress', listener);
        return () => {
            this.removeListener('progress', listener);
        };
    }
}
const assetManager = new AssetManager();
// 类型断言，将实例转换为带类型约束的接口
const typedAssetManager = assetManager;
exports.default = typedAssetManager;
globalThis.assetManager = typedAssetManager;
// --------------- event handler -------------------
async function onUnResponsive(asset) {
    if (asset_db_1.default.ready) {
        // 当打开项目后，导入超时的时候，弹出弹窗
        console.error(`Resource import Timeout.\n  uuid: ${asset.uuid}\n  url: ${asset.url}`);
    }
    else {
        console.debug('import asset unresponsive');
        // 正在打开项目的时候，超时了，需要在窗口上显示超时
        // const current = asset._taskManager._execID - asset._taskManager._execThread;
        // Task.updateSyncTask(
        //     'import-asset',
        //     i18n.translation('asset-db.mask.loading'),
        //     `${queryUrl(asset.source)}\n(${current}/${asset._taskManager.total()})`
        // );
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvbWFuYWdlci9hc3NldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDBEQUF3QztBQUN4QyxvQ0FBOEM7QUFDOUMsb0RBQWtDO0FBR2xDLGlEQUFnRTtBQUNoRSw0REFBeUM7QUFDekMsb0VBQWtEO0FBQ2xELHlGQUErRDtBQUMvRCxtRUFBcUQ7QUFDckQscUVBQXVEO0FBQ3ZELDBEQUk2QjtBQUU3Qjs7O0dBR0c7QUFDSCxNQUFNLFlBQWEsU0FBUSxnQkFBWTtJQUNuQyw0QkFBNEI7SUFDNUIsV0FBVyxHQUFHLGVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGVBQVUsQ0FBQyxDQUFDO0lBQ3RELHNCQUFzQixHQUFHLGVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsZUFBVSxDQUFDLENBQUM7SUFDNUUsZUFBZSxHQUFHLGVBQVUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGVBQVUsQ0FBQyxDQUFDO0lBQzlELFVBQVUsR0FBRyxlQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxlQUFVLENBQUMsQ0FBQztJQUNwRCxjQUFjLEdBQUcsZUFBVSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBVSxDQUFDLENBQUM7SUFDNUQsb0JBQW9CLEdBQUcsZUFBVSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxlQUFVLENBQUMsQ0FBQztJQUN4RSxlQUFlLEdBQUcsZUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsZUFBVSxDQUFDLENBQUM7SUFDOUQsa0JBQWtCLEdBQUcsZUFBVSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxlQUFVLENBQUMsQ0FBQztJQUNwRSxTQUFTLEdBQUcsZUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBVSxD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QXFDLEtBQUssQ0FBQyxJQUFJLFlBQVksS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDMUYsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDM0MsMkJBQTJCO1FBQzNCLCtFQUErRTtRQUMvRSx1QkFBdUI7UUFDdkIsc0JBQXNCO1FBQ3RCLGlEQUFpRDtRQUNqRCw4RUFBOEU7UUFDOUUsS0FBSztJQUNULENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXREQiwgVmlydHVhbEFzc2V0IH0gZnJvbSAnQGNvY29zL2Fzc2V0LWRiJztcbmltcG9ydCBhc3NldERCTWFuYWdlciBmcm9tICcuL2Fzc2V0LWRiJztcbmltcG9ydCB7IHVybDJwYXRoLCB1cmwydXVpZCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IEFzc2V0TWFuYWdlckV2ZW50cywgSUFzc2V0LCBJQXNzZXRJbmZvLCBJQXNzZXREQkluZm8gfSBmcm9tICcuLi9AdHlwZXMvcHJpdmF0ZSc7XG5pbXBvcnQgdHlwZSB7IFRodW1ibmFpbEluZm8sIFRodW1ibmFpbFNpemUgfSBmcm9tICcuLi9AdHlwZXMvcHJvdGVjdGVkL2Fzc2V0LWhhbmRsZXInO1xuaW1wb3J0IGFzc2V0UXVlcnksIHsgQVNTRVRfVFJFRV9JTkZPX0RBVEFfS0VZUyB9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IGFzc2V0T3BlcmF0aW9uIGZyb20gJy4vb3BlcmF0aW9uJztcbmltcG9ydCBhc3NldEhhbmRsZXJNYW5hZ2VyIGZyb20gJy4vYXNzZXQtaGFuZGxlcic7XG5pbXBvcnQgYW5pbWF0aW9uR3JhcGhWYXJpYW50IGZyb20gJy4uL2FuaW1hdGlvbi1ncmFwaC12YXJpYW50JztcbmltcG9ydCAqIGFzIHNlcmlhbGl6ZWREYXRhIGZyb20gJy4uL3NlcmlhbGl6ZWQtZGF0YSc7XG5pbXBvcnQgKiBhcyBtYXRlcmlhbFNlcnZpY2UgZnJvbSAnLi4vbWF0ZXJpYWwtc2VydmljZSc7XG5pbXBvcnQge1xuICAgIGV4dHJhY3RJbWFnZVBpeGVsc0Zyb21GaWxlLFxuICAgIHR5cGUgSUV4dHJhY3RlZEltYWdlUGl4ZWxzLFxuICAgIHR5cGUgSUltYWdlUGl4ZWxFeHRyYWN0aW9uT3B0aW9ucyxcbn0gZnJvbSAnLi4vaW1hZ2UtcHJvY2Vzc2luZyc7XG5cbi8qKlxuICog5a+55aSW5pq06Zyy5LiA57O75YiX55qE6LWE5rqQ5p+l6K+i44CB5pON5L2c5o6l5Y+j562JXG4gKiDlr7nlpJbmmrTpnLLotYTmupDnmoTkuIDkupvlj5jliqjlub/mkq3mtojmga/jgIHkuovku7bmtojmga9cbiAqL1xuY2xhc3MgQXNzZXRNYW5hZ2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICAvLyAtLS0tLS0tLS0gcXVlcnkgLS0tLS0tLS0tXG4gICAgcXVlcnlBc3NldHMgPSBhc3NldFF1ZXJ5LnF1ZXJ5QXNzZXRzLmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgcXVlcnlBc3NldERlcGVuZGVuY2llcyA9IGFzc2V0UXVlcnkucXVlcnlBc3NldERlcGVuZGVuY2llcy5iaW5kKGFzc2V0UXVlcnkpO1xuICAgIHF1ZXJ5QXNzZXRVc2VycyA9IGFzc2V0UXVlcnkucXVlcnlBc3NldFVzZXJzLmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgcXVlcnlBc3NldCA9IGFzc2V0UXVlcnkucXVlcnlBc3NldC5iaW5kKGFzc2V0UXVlcnkpO1xuICAgIHF1ZXJ5QXNzZXRJbmZvID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0SW5mby5iaW5kKGFzc2V0UXVlcnkpO1xuICAgIHF1ZXJ5QXNzZXRJbmZvQnlVVUlEID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0SW5mb0J5VVVJRC5iaW5kKGFzc2V0UXVlcnkpO1xuICAgIHF1ZXJ5QXNzZXRJbmZvcyA9IGFzc2V0UXVlcnkucXVlcnlBc3NldEluZm9zLmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgcXVlcnlTb3J0ZWRQbHVnaW5zID0gYXNzZXRRdWVyeS5xdWVyeVNvcnRlZFBsdWdpbnMuYmluZChhc3NldFF1ZXJ5KTtcbiAgICBxdWVyeVVVSUQgPSBhc3NldFF1ZXJ5LnF1ZXJ5VVVJRC5iaW5kKGFzc2V0UXVlcnkpO1xuICAgIHF1ZXJ5UGF0aCA9IGFzc2V0UXVlcnkucXVlcnlQYXRoLmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgcXVlcnlVcmwgPSBhc3NldFF1ZXJ5LnF1ZXJ5VXJsLmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgZ2VuZXJhdGVBdmFpbGFibGVVUkwgPSBhc3NldFF1ZXJ5LmdlbmVyYXRlQXZhaWxhYmxlVVJMLmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgcXVlcnlEQkFzc2V0SW5mbyA9IGFzc2V0UXVlcnkucXVlcnlEQkFzc2V0SW5mby5iaW5kKGFzc2V0UXVlcnkpO1xuICAgIGVuY29kZUFzc2V0ID0gYXNzZXRRdWVyeS5lbmNvZGVBc3NldC5iaW5kKGFzc2V0UXVlcnkpO1xuICAgIHF1ZXJ5QXNzZXRQcm9wZXJ0eSA9IGFzc2V0UXVlcnkucXVlcnlBc3NldFByb3BlcnR5LmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgcXVlcnlBc3NldE1ldGEgPSBhc3NldFF1ZXJ5LnF1ZXJ5QXNzZXRNZXRhLmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgcXVlcnlTdWJBc3NldE5hbWUgPSBhc3NldFF1ZXJ5LnF1ZXJ5U3ViQXNzZXROYW1lLmJpbmQoYXNzZXRRdWVyeSk7XG4gICAgcXVlcnlBc3NldE10aW1lID0gYXNzZXRRdWVyeS5xdWVyeUFzc2V0TXRpbWUuYmluZChhc3NldFF1ZXJ5KTtcbiAgICAvLyAtLS0tLS0tLS0tIG9wZXJhdGlvbiAtLS0tLS0tLS1cbiAgICBpbXBvcnRBc3NldCA9IGFzc2V0T3BlcmF0aW9uLmltcG9ydEFzc2V0LmJpbmQoYXNzZXRPcGVyYXRpb24pO1xuICAgIGNvcHlBc3NldCA9IGFzc2V0T3BlcmF0aW9uLmNvcHlBc3NldC5iaW5kKGFzc2V0T3BlcmF0aW9uKTtcbiAgICBzYXZlQXNzZXRNZXRhID0gYXNzZXRPcGVyYXRpb24uc2F2ZUFzc2V0TWV0YS5iaW5kKGFzc2V0T3BlcmF0aW9uKTtcbiAgICBzYXZlQXNzZXQgPSBhc3NldE9wZXJhdGlvbi5zYXZlQXNzZXQuYmluZChhc3NldE9wZXJhdGlvbik7XG4gICAgY3JlYXRlQXNzZXQgPSBhc3NldE9wZXJhdGlvbi5jcmVhdGVBc3NldC5iaW5kKGFzc2V0T3BlcmF0aW9uKTtcbiAgICByZWZyZXNoQXNzZXQgPSBhc3NldE9wZXJhdGlvbi5yZWZyZXNoQXNzZXQuYmluZChhc3NldE9wZXJhdGlvbik7XG4gICAgcmVpbXBvcnRBc3NldCA9IGFzc2V0T3BlcmF0aW9uLnJlaW1wb3J0QXNzZXQuYmluZChhc3NldE9wZXJhdGlvbik7XG4gICAgcmVuYW1lQXNzZXQgPSBhc3NldE9wZXJhdGlvbi5yZW5hbWVBc3NldC5iaW5kKGFzc2V0T3BlcmF0aW9uKTtcbiAgICByZW1vdmVBc3NldCA9IGFzc2V0T3BlcmF0aW9uLnJlbW92ZUFzc2V0LmJpbmQoYXNzZXRPcGVyYXRpb24pO1xuICAgIG1vdmVBc3NldCA9IGFzc2V0T3BlcmF0aW9uLm1vdmVBc3NldC5iaW5kKGFzc2V0T3BlcmF0aW9uKTtcbiAgICBnZW5lcmF0ZUV4cG9ydERhdGEgPSBhc3NldE9wZXJhdGlvbi5nZW5lcmF0ZUV4cG9ydERhdGEuYmluZChhc3NldE9wZXJhdGlvbik7XG4gICAgb3V0cHV0RXhwb3J0RGF0YSA9IGFzc2V0T3BlcmF0aW9uLm91dHB1dEV4cG9ydERhdGEuYmluZChhc3NldE9wZXJhdGlvbik7XG4gICAgY3JlYXRlQXNzZXRCeVR5cGUgPSBhc3NldE9wZXJhdGlvbi5jcmVhdGVBc3NldEJ5VHlwZS5iaW5kKGFzc2V0T3BlcmF0aW9uKTtcbiAgICB1cGRhdGVVc2VyRGF0YSA9IGFzc2V0T3BlcmF0aW9uLnVwZGF0ZVVzZXJEYXRhLmJpbmQoYXNzZXRPcGVyYXRpb24pO1xuICAgIHVwZGF0ZVVzZXJEYXRhQnlQYXRoID0gYXNzZXRPcGVyYXRpb24udXBkYXRlVXNlckRhdGFCeVBhdGguYmluZChhc3NldE9wZXJhdGlvbik7XG4gICAgcXVlcnlTZXJpYWxpemVkRGF0YSA9IHNlcmlhbGl6ZWREYXRhLnF1ZXJ5U2VyaWFsaXplZERhdGE7XG4gICAgc2F2ZVNlcmlhbGl6ZWREYXRhID0gc2VyaWFsaXplZERhdGEuc2F2ZVNlcmlhbGl6ZWREYXRhO1xuICAgIHF1ZXJ5TWF0ZXJpYWwgPSBtYXRlcmlhbFNlcnZpY2UucXVlcnlNYXRlcmlhbDtcbiAgICBxdWVyeU1hdGVyaWFsRWZmZWN0ID0gbWF0ZXJpYWxTZXJ2aWNlLnF1ZXJ5RWZmZWN0O1xuICAgIHF1ZXJ5TWF0ZXJpYWxBbGxFZmZlY3RzID0gbWF0ZXJpYWxTZXJ2aWNlLnF1ZXJ5QWxsRWZmZWN0cztcbiAgICBzYXZlTWF0ZXJpYWwgPSBtYXRlcmlhbFNlcnZpY2Uuc2F2ZU1hdGVyaWFsO1xuXG4gICAgLy8gLS0tLS0tLS0tLSBhbmltYXRpb24gZ3JhcGggdmFyaWFudCAtLS0tLS0tLS1cbiAgICBxdWVyeUFuaW1hdGlvbkdyYXBoVmFyaWFudCA9IGFuaW1hdGlvbkdyYXBoVmFyaWFudC5xdWVyeS5iaW5kKGFuaW1hdGlvbkdyYXBoVmFyaWFudCk7XG4gICAgY2hhbmdlQW5pbWF0aW9uR3JhcGhWYXJpYW50ID0gYW5pbWF0aW9uR3JhcGhWYXJpYW50LmNoYW5nZS5iaW5kKGFuaW1hdGlvbkdyYXBoVmFyaWFudCk7XG4gICAgc2F2ZUFuaW1hdGlvbkdyYXBoVmFyaWFudCA9IGFuaW1hdGlvbkdyYXBoVmFyaWFudC5zYXZlLmJpbmQoYW5pbWF0aW9uR3JhcGhWYXJpYW50KTtcblxuICAgIC8vIC0tLS0tLS0tLS0tIGFzc2V0SGFuZGxlck1hbmFnZXIgLS0tLS0tLS0tLS0tXG4gICAgcXVlcnlBc3NldENvbmZpZ01hcCA9IGFzc2V0SGFuZGxlck1hbmFnZXIucXVlcnlBc3NldENvbmZpZ01hcC5iaW5kKGFzc2V0SGFuZGxlck1hbmFnZXIpO1xuICAgIHF1ZXJ5UHJvcGVydHlTY2hlbWEgPSBhc3NldEhhbmRsZXJNYW5hZ2VyLnF1ZXJ5UHJvcGVydHlTY2hlbWEuYmluZChhc3NldEhhbmRsZXJNYW5hZ2VyKTtcbiAgICB1cGRhdGVEZWZhdWx0VXNlckRhdGEgPSBhc3NldEhhbmRsZXJNYW5hZ2VyLnVwZGF0ZURlZmF1bHRVc2VyRGF0YS5iaW5kKGFzc2V0SGFuZGxlck1hbmFnZXIpO1xuICAgIGdldENyZWF0ZU1hcCA9IGFzc2V0SGFuZGxlck1hbmFnZXIuZ2V0Q3JlYXRlTWFwLmJpbmQoYXNzZXRIYW5kbGVyTWFuYWdlcik7XG4gICAgcXVlcnlBc3NldFVzZXJEYXRhQ29uZmlnID0gYXNzZXRIYW5kbGVyTWFuYWdlci5xdWVyeVVzZXJEYXRhQ29uZmlnLmJpbmQoYXNzZXRIYW5kbGVyTWFuYWdlcik7XG4gICAgcXVlcnlUaHVtYm5haWxIYW5kbGVycyA9IGFzc2V0SGFuZGxlck1hbmFnZXIucXVlcnlUaHVtYm5haWxIYW5kbGVycy5iaW5kKGFzc2V0SGFuZGxlck1hbmFnZXIpO1xuXG4gICAgYXN5bmMgZ2VuZXJhdGVUaHVtYm5haWwodXJsT3JVVUlET3JQYXRoOiBzdHJpbmcsIHNpemU/OiBUaHVtYm5haWxTaXplKTogUHJvbWlzZTxUaHVtYm5haWxJbmZvIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBhc3NldCA9IHRoaXMucXVlcnlBc3NldCh1cmxPclVVSURPclBhdGgpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7IHJldHVybiBudWxsOyB9XG4gICAgICAgIHJldHVybiBhc3NldEhhbmRsZXJNYW5hZ2VyLmdlbmVyYXRlVGh1bWJuYWlsKGFzc2V0LCBzaXplKTtcbiAgICB9XG5cbiAgICBhc3luYyBleHRyYWN0SW1hZ2VQaXhlbHMoXG4gICAgICAgIHVybE9yVVVJRE9yUGF0aDogc3RyaW5nLFxuICAgICAgICBvcHRpb25zOiBJSW1hZ2VQaXhlbEV4dHJhY3Rpb25PcHRpb25zLFxuICAgICk6IFByb21pc2U8SUV4dHJhY3RlZEltYWdlUGl4ZWxzIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBhc3NldEluZm8gPSB0aGlzLnF1ZXJ5QXNzZXRJbmZvKHVybE9yVVVJRE9yUGF0aCk7XG4gICAgICAgIGlmICghYXNzZXRJbmZvPy5maWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXh0cmFjdEltYWdlUGl4ZWxzRnJvbUZpbGUoYXNzZXRJbmZvLmZpbGUsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGdldEVmZmVjdEJpblBhdGgoKSB7XG4gICAgICAgIHJldHVybiBhc3NldEhhbmRsZXJNYW5hZ2VyLmdldEVmZmVjdEJpblBhdGgoKTtcbiAgICB9O1xuXG4gICAgdXJsMnV1aWQodXJsOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHVybDJ1dWlkKHVybCk7XG4gICAgfVxuICAgIHVybDJwYXRoKHVybDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1cmwycGF0aCh1cmwpO1xuICAgIH1cbiAgICBwYXRoMnVybCh1cmw6IHN0cmluZywgZGJOYW1lPzogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBhc3NldERCTWFuYWdlci5wYXRoMnVybCh1cmwsIGRiTmFtZSk7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLSDnm5HlkKzmlrnms5UgLS0tLS0tLS0tLS0tXG4gICAgLyoqXG4gICAgICog55uR5ZCs6LWE5rqQ5re75Yqg5LqL5Lu2XG4gICAgICogQHBhcmFtIGxpc3RlbmVyIOWbnuiwg+WHveaVsFxuICAgICAqIEByZXR1cm5zIOenu+mZpOebkeWQrOeahOWHveaVsFxuICAgICAqL1xuICAgIG9uQXNzZXRBZGRlZChsaXN0ZW5lcjogKGluZm86IElBc3NldEluZm8pID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICAgICAgdGhpcy5vbignb25Bc3NldEFkZGVkJywgbGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcignb25Bc3NldEFkZGVkJywgbGlzdGVuZXIpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOebkeWQrOi1hOa6kOWPmOabtOS6i+S7tlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lciDlm57osIPlh73mlbBcbiAgICAgKiBAcmV0dXJucyDnp7vpmaTnm5HlkKznmoTlh73mlbBcbiAgICAgKi9cbiAgICBvbkFzc2V0Q2hhbmdlZChsaXN0ZW5lcjogKGluZm86IElBc3NldEluZm8pID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICAgICAgdGhpcy5vbignb25Bc3NldENoYW5nZWQnLCBsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCdvbkFzc2V0Q2hhbmdlZCcsIGxpc3RlbmVyKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnm5HlkKzotYTmupDliKDpmaTkuovku7ZcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXIg5Zue6LCD5Ye95pWwXG4gICAgICogQHJldHVybnMg56e76Zmk55uR5ZCs55qE5Ye95pWwXG4gICAgICovXG4gICAgb25Bc3NldFJlbW92ZWQobGlzdGVuZXI6IChpbmZvOiBJQXNzZXRJbmZvKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gICAgICAgIHRoaXMub24oJ29uQXNzZXRSZW1vdmVkJywgbGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcignb25Bc3NldFJlbW92ZWQnLCBsaXN0ZW5lcik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLSDlrp7kvovljJbmlrnms5UgLS0tLS0tLS0tLS0tXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgYXNzZXREQk1hbmFnZXIub24oJ2RiLWNyZWF0ZWQnLCB0aGlzLl9vbkFzc2V0REJDcmVhdGVkKTtcbiAgICAgICAgYXNzZXREQk1hbmFnZXIub24oJ2RiLXJlbW92ZWQnLCB0aGlzLl9vbkFzc2V0REJSZW1vdmVkKTtcbiAgICAgICAgLy8g5b2T5omA5pyJ5pWw5o2u5bqTIHJlYWR5IOWQju+8jOenu+mZpOWQr+WKqOmYtuauteeahOi/m+W6pui/vei4quebkeWQrOWZqFxuICAgICAgICBhc3NldERCTWFuYWdlci5vbmNlKCdhc3NldHM6cmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVQcm9ncmVzc0xpc3RlbmVycygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkZXN0cm95ZWQoKSB7XG4gICAgICAgIGFzc2V0REJNYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKCdkYi1jcmVhdGVkJywgdGhpcy5fb25Bc3NldERCQ3JlYXRlZCk7XG4gICAgICAgIGFzc2V0REJNYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKCdkYi1yZW1vdmVkJywgdGhpcy5fb25Bc3NldERCUmVtb3ZlZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5LuO6LWE5rqQ5a+56LGh5o+Q5Y+W5Y+Y5pu05L+h5oGvXG4gICAgICogQHBhcmFtIGFzc2V0IOi1hOa6kOWvueixoVxuICAgICAqIEByZXR1cm5zIOi1hOa6kOWPmOabtOS/oeaBr1xuICAgICAqL1xuICAgIHByaXZhdGUgX2V4dHJhY3RBc3NldENoYW5nZUluZm8oYXNzZXQ6IElBc3NldCk6IElBc3NldEluZm8gfCBudWxsIHtcbiAgICAgICAgaWYgKCFhc3NldCB8fCAhYXNzZXQudXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyhhc3NldC51dWlkLCBBU1NFVF9UUkVFX0lORk9fREFUQV9LRVlTKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zbmFwc2hvdEFzc2V0Q2hhbmdlSW5mbyhhc3NldDogSUFzc2V0KTogSUFzc2V0SW5mbyB8IG51bGwge1xuICAgICAgICBpZiAoIWFzc2V0IHx8ICFhc3NldC51dWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXNzZXRRdWVyeS5lbmNvZGVBc3NldChhc3NldCwgWydzdWJBc3NldHMnLCAnZGlzcGxheU5hbWUnXSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgX29uQXNzZXREQkNyZWF0ZWQoZGI6IEFzc2V0REIpIHtcbiAgICAgICAgZGIub24oJ3VucmVzcG9uc2l2ZScsIG9uVW5SZXNwb25zaXZlKTtcbiAgICAgICAgLy8g5ZCv5Yqo6Zi25q6155qE6L+b5bqm6L+96Liq55uR5ZCs5Zmo77yI5Y+q5pyJ5ZyoIHJlYWR5IOWJjeWIm+W7uueahCBkYiDmiY3pnIDopoHvvIzkuJQgcmVhZHkg5ZCO5Lya6KKr57uf5LiA56e76Zmk77yJXG4gICAgICAgIGlmICghYXNzZXREQk1hbmFnZXIucmVhZHkpIHtcbiAgICAgICAgICAgIGRiLm9uKCdhZGQnLCBhc3NldE1hbmFnZXIuX29uQXNzZXRBZGQpO1xuICAgICAgICAgICAgZGIub24oJ2NoYW5nZScsIGFzc2V0TWFuYWdlci5fb25Bc3NldENoYW5nZSk7XG4gICAgICAgICAgICBkYi5vbignZGVsZXRlJywgYXNzZXRNYW5hZ2VyLl9vbkFzc2V0RGVsZXRlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDmraPluLjov5DooYzml7bnmoTkuovku7bnm5HlkKzlmajvvIjkuIDnm7Tkv53nlZnvvIlcbiAgICAgICAgZGIub24oJ2FkZGVkJywgYXNzZXRNYW5hZ2VyLl9vbkFzc2V0QWRkZWQpO1xuICAgICAgICBkYi5vbignY2hhbmdlZCcsIGFzc2V0TWFuYWdlci5fb25Bc3NldENoYW5nZWQpO1xuICAgICAgICBkYi5vbignZGVsZXRlZCcsIGFzc2V0TWFuYWdlci5fb25Bc3NldERlbGV0ZWQpO1xuICAgIH1cblxuICAgIF9vbkFzc2V0REJSZW1vdmVkKGRiOiBBc3NldERCKSB7XG4gICAgICAgIGRiLnJlbW92ZUxpc3RlbmVyKCd1bnJlc3BvbnNpdmUnLCBvblVuUmVzcG9uc2l2ZSk7XG4gICAgICAgIC8vIOenu+mZpOWQr+WKqOmYtuauteeahOi/m+W6pui/vei4quebkeWQrOWZqFxuICAgICAgICBkYi5yZW1vdmVMaXN0ZW5lcignYWRkJywgYXNzZXRNYW5hZ2VyLl9vbkFzc2V0QWRkKTtcbiAgICAgICAgZGIucmVtb3ZlTGlzdGVuZXIoJ2NoYW5nZScsIGFzc2V0TWFuYWdlci5fb25Bc3NldENoYW5nZSk7XG4gICAgICAgIGRiLnJlbW92ZUxpc3RlbmVyKCdkZWxldGUnLCBhc3NldE1hbmFnZXIuX29uQXNzZXREZWxldGUpO1xuICAgICAgICAvLyDnp7vpmaTmraPluLjov5DooYzml7bnmoTkuovku7bnm5HlkKzlmahcbiAgICAgICAgZGIucmVtb3ZlTGlzdGVuZXIoJ2FkZGVkJywgYXNzZXRNYW5hZ2VyLl9vbkFzc2V0QWRkZWQpO1xuICAgICAgICBkYi5yZW1vdmVMaXN0ZW5lcignY2hhbmdlZCcsIGFzc2V0TWFuYWdlci5fb25Bc3NldENoYW5nZWQpO1xuICAgICAgICBkYi5yZW1vdmVMaXN0ZW5lcignZGVsZXRlZCcsIGFzc2V0TWFuYWdlci5fb25Bc3NldERlbGV0ZWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOenu+mZpOaJgOacieaVsOaNruW6k+eahOWQr+WKqOmYtuautei/m+W6pui/vei4quebkeWQrOWZqFxuICAgICAqIOWcqCByZWFkeSDlkI7osIPnlKjvvIzmuIXnkIbkuI3lho3pnIDopoHnmoTnm5HlkKzlmahcbiAgICAgKi9cbiAgICBwcml2YXRlIF9yZW1vdmVQcm9ncmVzc0xpc3RlbmVycygpIHtcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXApIHtcbiAgICAgICAgICAgIGNvbnN0IGRiID0gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXTtcbiAgICAgICAgICAgIGlmIChkYikge1xuICAgICAgICAgICAgICAgIGRiLnJlbW92ZUxpc3RlbmVyKCdhZGQnLCBhc3NldE1hbmFnZXIuX29uQXNzZXRBZGQpO1xuICAgICAgICAgICAgICAgIGRiLnJlbW92ZUxpc3RlbmVyKCdjaGFuZ2UnLCBhc3NldE1hbmFnZXIuX29uQXNzZXRDaGFuZ2UpO1xuICAgICAgICAgICAgICAgIGRiLnJlbW92ZUxpc3RlbmVyKCdkZWxldGUnLCBhc3NldE1hbmFnZXIuX29uQXNzZXREZWxldGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0SW1wb3J0U3RhdGUoYXNzZXQ6IElBc3NldCwgZGVmYXVsdFN0YXRlOiAncHJvY2Vzc2luZycgfCAnc3VjY2VzcycgfCAnZmFpbGVkJykge1xuICAgICAgICBpZiAoYXNzZXQuaW52YWxpZCB8fCBhc3NldC5pbXBvcnRFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuICdmYWlsZWQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZhdWx0U3RhdGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZW1pdFByb2dyZXNzKGFzc2V0OiBJQXNzZXQsIHN0YXRlOiAncHJvY2Vzc2luZycgfCAnc3VjY2VzcycgfCAnZmFpbGVkJykge1xuICAgICAgICBsZXQgZ2xvYmFsQ3VycmVudCA9IDA7XG4gICAgICAgIGxldCBnbG9iYWxUb3RhbCA9IDA7XG4gICAgICAgIFxuICAgICAgICAvLyDmsYfmgLvmiYDmnInmlbDmja7lupPnmoTov5vluqZcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIGFzc2V0REJNYW5hZ2VyLmFzc2V0REJNYXApIHtcbiAgICAgICAgICAgIGNvbnN0IGRiID0gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcFtuYW1lXTtcbiAgICAgICAgICAgIGlmIChkYiAmJiBkYi5hc3NldFByb2dyZXNzSW5mbykge1xuICAgICAgICAgICAgICAgIGdsb2JhbEN1cnJlbnQgKz0gZGIuYXNzZXRQcm9ncmVzc0luZm8uY3VycmVudCB8fCAwO1xuICAgICAgICAgICAgICAgIGdsb2JhbFRvdGFsICs9IGRiLmFzc2V0UHJvZ3Jlc3NJbmZvLnRvdGFsIHx8IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW1pdCgncHJvZ3Jlc3MnLCBnbG9iYWxDdXJyZW50LCBnbG9iYWxUb3RhbCwgYXNzZXQudXJsLCB0aGlzLl9nZXRJbXBvcnRTdGF0ZShhc3NldCwgc3RhdGUpKTtcbiAgICB9XG5cbiAgICBfb25Bc3NldEFkZCA9IGFzeW5jIChhc3NldDogSUFzc2V0KSA9PiB7XG4gICAgICAgIHRoaXMuX2VtaXRQcm9ncmVzcyhhc3NldCwgJ3Byb2Nlc3NpbmcnKTtcbiAgICB9O1xuICAgIF9vbkFzc2V0Q2hhbmdlID0gYXN5bmMgKGFzc2V0OiBJQXNzZXQpID0+IHtcbiAgICAgICAgdGhpcy5fZW1pdFByb2dyZXNzKGFzc2V0LCAncHJvY2Vzc2luZycpO1xuICAgIH07XG4gICAgX29uQXNzZXREZWxldGUgPSBhc3luYyAoYXNzZXQ6IElBc3NldCkgPT4ge1xuICAgICAgICB0aGlzLl9lbWl0UHJvZ3Jlc3MoYXNzZXQsICdwcm9jZXNzaW5nJyk7XG4gICAgfTtcblxuICAgIF9vbkFzc2V0QWRkZWQgPSBhc3luYyAoYXNzZXQ6IElBc3NldCkgPT4ge1xuICAgICAgICBpZiAoYXNzZXREQk1hbmFnZXIucmVhZHkpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYXNzZXQtYWRkJywgYXNzZXQpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdvbkFzc2V0QWRkZWQnLCB0aGlzLl9leHRyYWN0QXNzZXRDaGFuZ2VJbmZvKGFzc2V0KSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgYXNzZXQtYWRkICR7YXNzZXQudXJsfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2VtaXRQcm9ncmVzcyhhc3NldCwgJ3N1Y2Nlc3MnKTtcbiAgICB9O1xuICAgIF9vbkFzc2V0Q2hhbmdlZCA9IGFzeW5jIChhc3NldDogSUFzc2V0KSA9PiB7XG4gICAgICAgIGlmIChhc3NldERCTWFuYWdlci5yZWFkeSkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdhc3NldC1jaGFuZ2UnLCBhc3NldCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ29uQXNzZXRDaGFuZ2VkJywgdGhpcy5fZXh0cmFjdEFzc2V0Q2hhbmdlSW5mbyhhc3NldCkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGFzc2V0LWNoYW5nZSAke2Fzc2V0LnVybH1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9lbWl0UHJvZ3Jlc3MoYXNzZXQsICdzdWNjZXNzJyk7XG4gICAgfTtcbiAgICBfb25Bc3NldERlbGV0ZWQgPSBhc3luYyAoYXNzZXQ6IElBc3NldCkgPT4ge1xuICAgICAgICBpZiAoYXNzZXREQk1hbmFnZXIucmVhZHkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZWRJbmZvID0gdGhpcy5fc25hcHNob3RBc3NldENoYW5nZUluZm8oYXNzZXQpO1xuICAgICAgICAgICAgYXdhaXQgYXNzZXRIYW5kbGVyTWFuYWdlci5kZXN0cm95QXNzZXQoYXNzZXQpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdhc3NldC1kZWxldGUnLCBhc3NldCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ29uQXNzZXRSZW1vdmVkJywgcmVtb3ZlZEluZm8pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGFzc2V0LWRlbGV0ZSAke2Fzc2V0LnVybH1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9lbWl0UHJvZ3Jlc3MoYXNzZXQsICdzdWNjZXNzJyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOazqOWGjOaVsOaNruW6k+WIneWni+WMluWujOWFqOWujOaIkOWQjueahOS6i+S7tuebkeWQrOOAglxuICAgICAqIFxuICAgICAqICoq5rOo5oSP5LqL6aG5IChOb3RpY2UpKio6XG4gICAgICogLSDop6blj5HmraTkuovku7bku6PooagqKuaJgOaciSoq5rOo5YaM55qE6LWE5rqQ5pWw5o2u5bqT6YO95bey57uP5a6M5YWo5a+85YWl5bm25Yid5aeL5YyW5a6M5oiQ77yI5ZCv5Yqo6Zi25q6157uT5p2f77yJ44CCXG4gICAgICogLSDnrKzkuIDmrKEgcmVhZHkg5ZCO77yM5bCG5LiN5YaN5pyJIHByb2dyZXNzIOi/m+W6pua2iOaBr+OAglxuICAgICAqIC0gcmVhZHkg5ZCO5Lya6Ieq5Yqo56e76Zmk5ZCv5Yqo6Zi25q6155qE6L+b5bqm6L+96Liq55uR5ZCs5Zmo77yIYWRkL2NoYW5nZS9kZWxldGXvvInvvIzov5nkupvnm5HlkKzlmajku4XlnKjlkK/liqjpmLbmrrXnlKjkuo7ov5vluqbov73ouKrjgIJcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXIg5Zue6LCD5Ye95pWwXG4gICAgICogQHJldHVybnMg56e76Zmk55uR5ZCs55qE5Ye95pWwXG4gICAgICovXG4gICAgb25SZWFkeShsaXN0ZW5lcjogKCkgPT4gdm9pZCkge1xuICAgICAgICBhc3NldERCTWFuYWdlci5vbignYXNzZXRzOnJlYWR5JywgbGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgYXNzZXREQk1hbmFnZXIucmVtb3ZlTGlzdGVuZXIoJ2Fzc2V0czpyZWFkeScsIGxpc3RlbmVyKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhozljZXkuKrmlbDmja7lupPlkK/liqjlrozmiJDlkI7nmoTkuovku7bnm5HlkKzjgIJcbiAgICAgKiBcbiAgICAgKiAqKuazqOaEj+S6i+mhuSAoTm90aWNlKSoqOlxuICAgICAqIC0g6L+Z5Liq5LqL5Lu25Y+v6IO95Lya6KKr6Kem5Y+R5aSa5qyh77yI5aaC5p6c6aG555uu5a2Y5Zyo5aSa5Liq5a2Q5pWw5o2u5bqT77yM5aaCIGBhc3NldHNgLCBgaW50ZXJuYWxg77yJ44CCXG4gICAgICogLSDkuLvopoHnlKjkuo7pnIDopoHlgZrmm7Tnsr7nu4bljJblubbooYzmjqfliLbnmoTkuIrlsYLpgLvovpHvvIzpgJrluLjmg4XlhrXkuIvmma7pgJrnmoTkuJrliqHpgLvovpHkuI3pnIDopoHlhbPlv4PmraTkuovku7bvvIznm7TmjqXnm5HlkKwgYG9uUmVhZHlgIOWNs+WPr+OAglxuICAgICAqIFxuICAgICAqIEBwYXJhbSBsaXN0ZW5lciDlm57osIPlh73mlbDvvIzmjqXmlLblkK/liqjlrozmiJDnmoQgZGJJbmZvXG4gICAgICogQHJldHVybnMg56e76Zmk55uR5ZCs55qE5Ye95pWwXG4gICAgICovXG4gICAgb25EQlJlYWR5KGxpc3RlbmVyOiAoZGJJbmZvOiBJQXNzZXREQkluZm8pID0+IHZvaWQpIHtcbiAgICAgICAgYXNzZXREQk1hbmFnZXIub24oJ2Fzc2V0czpkYi1yZWFkeScsIGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGFzc2V0REJNYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKCdhc3NldHM6ZGItcmVhZHknLCBsaXN0ZW5lcik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5rOo5YaM5Yid5aeL5YyW6L+H56iL5Lit55qE6L+b5bqm55uR5ZCs44CCXG4gICAgICogXG4gICAgICogKirms6jmhI/kuovpobkgKE5vdGljZSkqKjpcbiAgICAgKiAtICoq5LuF5Zyo5ZCv5Yqo6Zi25q615pyJ5pWIKirjgILkuIDml6bop6blj5Hov4fkuIDmrKEgYHJlYWR5YCDkuovku7bvvIjljbPlkK/liqjpmLbmrrXnu5PmnZ/vvInvvIzlsIbkuI3lho3kvJrmnInmlrDnmoTov5vluqbmtojmga/jgIJcbiAgICAgKiAtIOWQr+WKqOaXtueahOi1hOa6kOWGt+WvvOWFpeS8muaKm+WHuuWvhumbhueahOi/m+W6puS/oeaBr++8jOW7uuiuruWcqCBVSSDlsYLpnaLov5vooYzpgILlvZPnmoToioLmtYHvvIh0aHJvdHRsZe+8iea4suafk+OAglxuICAgICAqIFxuICAgICAqIEBwYXJhbSBsaXN0ZW5lciDlm57osIPlh73mlbDvvIzljIXlkKvlvZPliY3ov5vluqbjgIHmgLvmlbDjgIHlvZPliY3lpITnkIbnmoTotYTmupAgdXJsIOS7peWPiuWvvOWFpeeKtuaAgVxuICAgICAqIEByZXR1cm5zIOenu+mZpOebkeWQrOeahOWHveaVsFxuICAgICAqL1xuICAgIG9uUHJvZ3Jlc3MobGlzdGVuZXI6IChjdXJyZW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIsIHVybDogc3RyaW5nLCBzdGF0ZTogJ3Byb2Nlc3NpbmcnIHwgJ3N1Y2Nlc3MnIHwgJ2ZhaWxlZCcpID0+IHZvaWQpIHtcbiAgICAgICAgdGhpcy5vbigncHJvZ3Jlc3MnLCBsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCdwcm9ncmVzcycsIGxpc3RlbmVyKTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmNvbnN0IGFzc2V0TWFuYWdlciA9IG5ldyBBc3NldE1hbmFnZXIoKTtcblxuLy8g5Yib5bu65bim5pyJ5LqL5Lu257G75Z6L57qm5p2f55qEIEFzc2V0TWFuYWdlciDnsbvlnotcbmV4cG9ydCBpbnRlcmZhY2UgVHlwZWRBc3NldE1hbmFnZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIC8vIOS6i+S7tuebkeWQrOaWueazle+8iOW4puexu+Wei+e6puadn++8iVxuICAgIG9uPEsgZXh0ZW5kcyBrZXlvZiBBc3NldE1hbmFnZXJFdmVudHM+KGV2ZW50OiBLLCBsaXN0ZW5lcjogQXNzZXRNYW5hZ2VyRXZlbnRzW0tdKTogdGhpcztcbiAgICBvbmNlPEsgZXh0ZW5kcyBrZXlvZiBBc3NldE1hbmFnZXJFdmVudHM+KGV2ZW50OiBLLCBsaXN0ZW5lcjogQXNzZXRNYW5hZ2VyRXZlbnRzW0tdKTogdGhpcztcbiAgICBlbWl0PEsgZXh0ZW5kcyBrZXlvZiBBc3NldE1hbmFnZXJFdmVudHM+KGV2ZW50OiBLLCAuLi5hcmdzOiBQYXJhbWV0ZXJzPEFzc2V0TWFuYWdlckV2ZW50c1tLXT4pOiBib29sZWFuO1xuICAgIHJlbW92ZUxpc3RlbmVyPEsgZXh0ZW5kcyBrZXlvZiBBc3NldE1hbmFnZXJFdmVudHM+KGV2ZW50OiBLLCBsaXN0ZW5lcjogQXNzZXRNYW5hZ2VyRXZlbnRzW0tdKTogdGhpcztcbiAgICByZW1vdmVBbGxMaXN0ZW5lcnM8SyBleHRlbmRzIGtleW9mIEFzc2V0TWFuYWdlckV2ZW50cz4oZXZlbnQ/OiBLKTogdGhpcztcbiAgICBsaXN0ZW5lcnM8SyBleHRlbmRzIGtleW9mIEFzc2V0TWFuYWdlckV2ZW50cz4oZXZlbnQ6IEspOiBGdW5jdGlvbltdO1xuICAgIGxpc3RlbmVyQ291bnQ8SyBleHRlbmRzIGtleW9mIEFzc2V0TWFuYWdlckV2ZW50cz4oZXZlbnQ6IEspOiBudW1iZXI7XG5cbiAgICAvLyDkuJPpl6jnmoTnm5HlkKzmlrnms5VcbiAgICBvbkFzc2V0QWRkZWQobGlzdGVuZXI6IChpbmZvOiBJQXNzZXRJbmZvKSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcbiAgICBvbkFzc2V0Q2hhbmdlZChsaXN0ZW5lcjogKGluZm86IElBc3NldEluZm8pID0+IHZvaWQpOiAoKSA9PiB2b2lkO1xuICAgIG9uQXNzZXRSZW1vdmVkKGxpc3RlbmVyOiAoaW5mbzogSUFzc2V0SW5mbykgPT4gdm9pZCk6ICgpID0+IHZvaWQ7XG5cbiAgICAvLyDljp/mnInnmoTmlrnms5VcbiAgICBxdWVyeUFzc2V0czogdHlwZW9mIGFzc2V0UXVlcnkucXVlcnlBc3NldHM7XG4gICAgcXVlcnlBc3NldERlcGVuZGVuY2llczogdHlwZW9mIGFzc2V0UXVlcnkucXVlcnlBc3NldERlcGVuZGVuY2llcztcbiAgICBxdWVyeUFzc2V0VXNlcnM6IHR5cGVvZiBhc3NldFF1ZXJ5LnF1ZXJ5QXNzZXRVc2VycztcbiAgICBxdWVyeUFzc2V0OiB0eXBlb2YgYXNzZXRRdWVyeS5xdWVyeUFzc2V0O1xuICAgIHF1ZXJ5QXNzZXRJbmZvOiB0eXBlb2YgYXNzZXRRdWVyeS5xdWVyeUFzc2V0SW5mbztcbiAgICBxdWVyeUFzc2V0SW5mb0J5VVVJRDogdHlwZW9mIGFzc2V0UXVlcnkucXVlcnlBc3NldEluZm9CeVVVSUQ7XG4gICAgcXVlcnlBc3NldEluZm9zOiB0eXBlb2YgYXNzZXRRdWVyeS5xdWVyeUFzc2V0SW5mb3M7XG4gICAgcXVlcnlTb3J0ZWRQbHVnaW5zOiB0eXBlb2YgYXNzZXRRdWVyeS5xdWVyeVNvcnRlZFBsdWdpbnM7XG4gICAgcXVlcnlVVUlEOiB0eXBlb2YgYXNzZXRRdWVyeS5xdWVyeVVVSUQ7XG4gICAgcXVlcnlQYXRoOiB0eXBlb2YgYXNzZXRRdWVyeS5xdWVyeVBhdGg7XG4gICAgcXVlcnlVcmw6IHR5cGVvZiBhc3NldFF1ZXJ5LnF1ZXJ5VXJsO1xuICAgIGdlbmVyYXRlQXZhaWxhYmxlVVJMOiB0eXBlb2YgYXNzZXRRdWVyeS5nZW5lcmF0ZUF2YWlsYWJsZVVSTDtcbiAgICBxdWVyeURCQXNzZXRJbmZvOiB0eXBlb2YgYXNzZXRRdWVyeS5xdWVyeURCQXNzZXRJbmZvO1xuICAgIGVuY29kZUFzc2V0OiB0eXBlb2YgYXNzZXRRdWVyeS5lbmNvZGVBc3NldDtcbiAgICBxdWVyeUFzc2V0UHJvcGVydHk6IHR5cGVvZiBhc3NldFF1ZXJ5LnF1ZXJ5QXNzZXRQcm9wZXJ0eTtcbiAgICBxdWVyeUFzc2V0TWV0YTogdHlwZW9mIGFzc2V0UXVlcnkucXVlcnlBc3NldE1ldGE7XG4gICAgcXVlcnlTdWJBc3NldE5hbWU6IHR5cGVvZiBhc3NldFF1ZXJ5LnF1ZXJ5U3ViQXNzZXROYW1lO1xuICAgIHF1ZXJ5QXNzZXRNdGltZTogdHlwZW9mIGFzc2V0UXVlcnkucXVlcnlBc3NldE10aW1lO1xuXG4gICAgaW1wb3J0QXNzZXQ6IHR5cGVvZiBhc3NldE9wZXJhdGlvbi5pbXBvcnRBc3NldDtcbiAgICBjb3B5QXNzZXQ6IHR5cGVvZiBhc3NldE9wZXJhdGlvbi5jb3B5QXNzZXQ7XG4gICAgc2F2ZUFzc2V0TWV0YTogdHlwZW9mIGFzc2V0T3BlcmF0aW9uLnNhdmVBc3NldE1ldGE7XG4gICAgc2F2ZUFzc2V0OiB0eXBlb2YgYXNzZXRPcGVyYXRpb24uc2F2ZUFzc2V0O1xuICAgIGNyZWF0ZUFzc2V0OiB0eXBlb2YgYXNzZXRPcGVyYXRpb24uY3JlYXRlQXNzZXQ7XG4gICAgcmVmcmVzaEFzc2V0OiB0eXBlb2YgYXNzZXRPcGVyYXRpb24ucmVmcmVzaEFzc2V0O1xuICAgIHJlaW1wb3J0QXNzZXQ6IHR5cGVvZiBhc3NldE9wZXJhdGlvbi5yZWltcG9ydEFzc2V0O1xuICAgIHJlbmFtZUFzc2V0OiB0eXBlb2YgYXNzZXRPcGVyYXRpb24ucmVuYW1lQXNzZXQ7XG4gICAgcmVtb3ZlQXNzZXQ6IHR5cGVvZiBhc3NldE9wZXJhdGlvbi5yZW1vdmVBc3NldDtcbiAgICBtb3ZlQXNzZXQ6IHR5cGVvZiBhc3NldE9wZXJhdGlvbi5tb3ZlQXNzZXQ7XG4gICAgZ2VuZXJhdGVFeHBvcnREYXRhOiB0eXBlb2YgYXNzZXRPcGVyYXRpb24uZ2VuZXJhdGVFeHBvcnREYXRhO1xuICAgIG91dHB1dEV4cG9ydERhdGE6IHR5cGVvZiBhc3NldE9wZXJhdGlvbi5vdXRwdXRFeHBvcnREYXRhO1xuICAgIGNyZWF0ZUFzc2V0QnlUeXBlOiB0eXBlb2YgYXNzZXRPcGVyYXRpb24uY3JlYXRlQXNzZXRCeVR5cGU7XG4gICAgdXBkYXRlVXNlckRhdGE6IHR5cGVvZiBhc3NldE9wZXJhdGlvbi51cGRhdGVVc2VyRGF0YTtcbiAgICB1cGRhdGVVc2VyRGF0YUJ5UGF0aDogdHlwZW9mIGFzc2V0T3BlcmF0aW9uLnVwZGF0ZVVzZXJEYXRhQnlQYXRoO1xuICAgIHF1ZXJ5U2VyaWFsaXplZERhdGE6IHR5cGVvZiBzZXJpYWxpemVkRGF0YS5xdWVyeVNlcmlhbGl6ZWREYXRhO1xuICAgIHNhdmVTZXJpYWxpemVkRGF0YTogdHlwZW9mIHNlcmlhbGl6ZWREYXRhLnNhdmVTZXJpYWxpemVkRGF0YTtcbiAgICBxdWVyeU1hdGVyaWFsOiB0eXBlb2YgbWF0ZXJpYWxTZXJ2aWNlLnF1ZXJ5TWF0ZXJpYWw7XG4gICAgcXVlcnlNYXRlcmlhbEVmZmVjdDogdHlwZW9mIG1hdGVyaWFsU2VydmljZS5xdWVyeUVmZmVjdDtcbiAgICBxdWVyeU1hdGVyaWFsQWxsRWZmZWN0czogdHlwZW9mIG1hdGVyaWFsU2VydmljZS5xdWVyeUFsbEVmZmVjdHM7XG4gICAgc2F2ZU1hdGVyaWFsOiB0eXBlb2YgbWF0ZXJpYWxTZXJ2aWNlLnNhdmVNYXRlcmlhbDtcblxuICAgIHF1ZXJ5QW5pbWF0aW9uR3JhcGhWYXJpYW50OiB0eXBlb2YgYW5pbWF0aW9uR3JhcGhWYXJpYW50LnF1ZXJ5O1xuICAgIGNoYW5nZUFuaW1hdGlvbkdyYXBoVmFyaWFudDogdHlwZW9mIGFuaW1hdGlvbkdyYXBoVmFyaWFudC5jaGFuZ2U7XG4gICAgc2F2ZUFuaW1hdGlvbkdyYXBoVmFyaWFudDogdHlwZW9mIGFuaW1hdGlvbkdyYXBoVmFyaWFudC5zYXZlO1xuXG4gICAgcXVlcnlBc3NldENvbmZpZ01hcDogdHlwZW9mIGFzc2V0SGFuZGxlck1hbmFnZXIucXVlcnlBc3NldENvbmZpZ01hcDtcbiAgICBxdWVyeVByb3BlcnR5U2NoZW1hOiB0eXBlb2YgYXNzZXRIYW5kbGVyTWFuYWdlci5xdWVyeVByb3BlcnR5U2NoZW1hO1xuICAgIHVwZGF0ZURlZmF1bHRVc2VyRGF0YTogdHlwZW9mIGFzc2V0SGFuZGxlck1hbmFnZXIudXBkYXRlRGVmYXVsdFVzZXJEYXRhO1xuICAgIGdldENyZWF0ZU1hcDogdHlwZW9mIGFzc2V0SGFuZGxlck1hbmFnZXIuZ2V0Q3JlYXRlTWFwO1xuICAgIHF1ZXJ5QXNzZXRVc2VyRGF0YUNvbmZpZzogdHlwZW9mIGFzc2V0SGFuZGxlck1hbmFnZXIucXVlcnlVc2VyRGF0YUNvbmZpZztcbiAgICBxdWVyeVRodW1ibmFpbEhhbmRsZXJzOiB0eXBlb2YgYXNzZXRIYW5kbGVyTWFuYWdlci5xdWVyeVRodW1ibmFpbEhhbmRsZXJzO1xuICAgIGdldEVmZmVjdEJpblBhdGg6IHR5cGVvZiBhc3NldEhhbmRsZXJNYW5hZ2VyLmdldEVmZmVjdEJpblBhdGg7XG5cbiAgICBnZW5lcmF0ZVRodW1ibmFpbCh1cmxPclVVSURPclBhdGg6IHN0cmluZywgc2l6ZT86IFRodW1ibmFpbFNpemUpOiBQcm9taXNlPFRodW1ibmFpbEluZm8gfCBudWxsPjtcbiAgICBleHRyYWN0SW1hZ2VQaXhlbHMoXG4gICAgICAgIHVybE9yVVVJRE9yUGF0aDogc3RyaW5nLFxuICAgICAgICBvcHRpb25zOiBJSW1hZ2VQaXhlbEV4dHJhY3Rpb25PcHRpb25zLFxuICAgICk6IFByb21pc2U8SUV4dHJhY3RlZEltYWdlUGl4ZWxzIHwgbnVsbD47XG5cbiAgICBvblJlYWR5OiB0eXBlb2YgYXNzZXRNYW5hZ2VyLm9uUmVhZHk7XG4gICAgb25EQlJlYWR5OiB0eXBlb2YgYXNzZXRNYW5hZ2VyLm9uREJSZWFkeTtcbiAgICBvblByb2dyZXNzOiB0eXBlb2YgYXNzZXRNYW5hZ2VyLm9uUHJvZ3Jlc3M7XG5cbiAgICB1cmwydXVpZCh1cmw6IHN0cmluZyk6IHN0cmluZztcbiAgICB1cmwycGF0aCh1cmw6IHN0cmluZyk6IHN0cmluZztcbiAgICBwYXRoMnVybCh1cmw6IHN0cmluZywgZGJOYW1lPzogc3RyaW5nKTogc3RyaW5nO1xuXG4gICAgaW5pdCgpOiBQcm9taXNlPHZvaWQ+O1xuICAgIGRlc3Ryb3llZCgpOiB2b2lkO1xufVxuXG4vLyDnsbvlnovmlq3oqIDvvIzlsIblrp7kvovovazmjaLkuLrluKbnsbvlnovnuqbmnZ/nmoTmjqXlj6NcbmNvbnN0IHR5cGVkQXNzZXRNYW5hZ2VyID0gYXNzZXRNYW5hZ2VyIGFzIFR5cGVkQXNzZXRNYW5hZ2VyO1xuXG5leHBvcnQgZGVmYXVsdCB0eXBlZEFzc2V0TWFuYWdlcjtcbihnbG9iYWxUaGlzIGFzIGFueSkuYXNzZXRNYW5hZ2VyID0gdHlwZWRBc3NldE1hbmFnZXI7XG4vLyAtLS0tLS0tLS0tLS0tLS0gZXZlbnQgaGFuZGxlciAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmFzeW5jIGZ1bmN0aW9uIG9uVW5SZXNwb25zaXZlKGFzc2V0OiBWaXJ0dWFsQXNzZXQpIHtcbiAgICBpZiAoYXNzZXREQk1hbmFnZXIucmVhZHkpIHtcbiAgICAgICAgLy8g5b2T5omT5byA6aG555uu5ZCO77yM5a+85YWl6LaF5pe255qE5pe25YCZ77yM5by55Ye65by556qXXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFJlc291cmNlIGltcG9ydCBUaW1lb3V0LlxcbiAgdXVpZDogJHthc3NldC51dWlkfVxcbiAgdXJsOiAke2Fzc2V0LnVybH1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdpbXBvcnQgYXNzZXQgdW5yZXNwb25zaXZlJyk7XG4gICAgICAgIC8vIOato+WcqOaJk+W8gOmhueebrueahOaXtuWAme+8jOi2heaXtuS6hu+8jOmcgOimgeWcqOeql+WPo+S4iuaYvuekuui2heaXtlxuICAgICAgICAvLyBjb25zdCBjdXJyZW50ID0gYXNzZXQuX3Rhc2tNYW5hZ2VyLl9leGVjSUQgLSBhc3NldC5fdGFza01hbmFnZXIuX2V4ZWNUaHJlYWQ7XG4gICAgICAgIC8vIFRhc2sudXBkYXRlU3luY1Rhc2soXG4gICAgICAgIC8vICAgICAnaW1wb3J0LWFzc2V0JyxcbiAgICAgICAgLy8gICAgIGkxOG4udHJhbnNsYXRpb24oJ2Fzc2V0LWRiLm1hc2subG9hZGluZycpLFxuICAgICAgICAvLyAgICAgYCR7cXVlcnlVcmwoYXNzZXQuc291cmNlKX1cXG4oJHtjdXJyZW50fS8ke2Fzc2V0Ll90YXNrTWFuYWdlci50b3RhbCgpfSlgXG4gICAgICAgIC8vICk7XG4gICAgfVxufVxuIl19