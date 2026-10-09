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
