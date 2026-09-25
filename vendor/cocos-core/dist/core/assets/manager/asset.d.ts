import { AssetDB } from '@cocos/asset-db';
import EventEmitter from 'events';
import { AssetManagerEvents, IAsset, IAssetInfo, IAssetDBInfo } from '../@types/private';
import type { ThumbnailInfo, ThumbnailSize } from '../@types/protected/asset-handler';
import assetQuery from './query';
import assetOperation from './operation';
import assetHandlerManager from './asset-handler';
import animationGraphVariant from '../animation-graph-variant';
import * as serializedData from '../serialized-data';
import * as materialService from '../material-service';
import { type IExtractedImagePixels, type IImagePixelExtractionOptions } from '../image-processing';
/**
 * 对外暴露一系列的资源查询、操作接口等
 * 对外暴露资源的一些变动广播消息、事件消息
 */
declare class AssetManager extends EventEmitter {
    queryAssets: (options?: import("../@types/public").QueryAssetsOption) => IAsset[];
    queryAssetDependencies: (uuidOrURL: string, type?: import("../@types/private").QueryAssetType) => Promise<string[]>;
    queryAssetUsers: (uuidOrURL: string, type?: import("../@types/private").QueryAssetType) => Promise<string[]>;
    queryAsset: (uuidOrURLOrPath: string) => IAsset | null;
    queryAssetInfo: (urlOrUUIDOrPath: string, dataKeys?: readonly (keyof IAssetInfo)[]) => IAssetInfo | null;
    queryAssetInfoByUUID: (uuid: string, dataKeys?: readonly (keyof IAssetInfo)[]) => IAssetInfo | null;
    queryAssetInfos: (options?: import("../@types/public").QueryAssetsOption, dataKeys?: readonly (keyof IAssetInfo)[]) => IAssetInfo[];
    querySortedPlugins: (filterOptions?: import("../../scripting/interface").FilterPluginOptions) => import("../../scripting").IPluginScriptInfo[];
    queryUUID: (urlOrPath: string) => string | null;
    queryPath: (urlOrUuid: string) => string;
    queryUrl: (uuidOrPath: string) => string;
    generateAvailableURL: (url: string) => string;
    queryDBAssetInfo: (name: string) => IAssetInfo | null;
    encodeAsset: (asset: IAsset, dataKeys?: readonly (keyof IAssetInfo)[], invalid?: boolean) => IAssetInfo;
    queryAssetProperty: (asset: IAsset, property: (keyof IAssetInfo | "depends" | "dependScripts" | "dependedScripts")) => any;
    queryAssetMeta: (uuidOrURLOrPath: string) => import("../@types/public").IAssetMeta | null;
    querySubAssetName: (mainUuid: string, subId: string) => string | null;
    queryAssetMtime: (uuid: string) => number | null;
    importAsset: (source: string, target: string, options?: import("../@types/public").AssetOperationOption) => Promise<IAssetInfo[]>;
    copyAsset: (source: string, target: string, options?: import("../@types/public").AssetOperationOption) => Promise<IAssetInfo>;
    saveAssetMeta: (uuid: string, meta: import("../@types/public").IAssetMeta, asset?: IAsset) => Promise<void>;
    saveAsset: (uuidOrURLOrPath: string, content: string | Buffer) => Promise<IAssetInfo>;
    createAsset: (options: import("../@types/private").CreateAssetOptions) => Promise<IAssetInfo>;
    refreshAsset: (pathOrUrlOrUUID: string) => Promise<number>;
    reimportAsset: (pathOrUrlOrUUID: string) => Promise<IAssetInfo>;
    renameAsset: (source: string, newName: string, option?: import("../@types/public").AssetOperationOption) => Promise<any>;
    removeAsset: (uuidOrURLOrPath: string, options?: import("../@types/public").DeleteAssetOptions) => Promise<IAssetInfo | null>;
    moveAsset: (source: string, target: string, option?: import("../@types/public").AssetOperationOption) => Promise<any>;
    generateExportData: (asset: import("@cocos/asset-db").Asset, options?: import("../@types/private").IExportOptions) => Promise<import("../@types/private").IExportData | null>;
    outputExportData: (handler: string, src: import("../@types/private").IExportData, dest: import("../@types/private").IExportData) => Promise<void>;
    createAssetByType: (type: import("../@types/asset-types").ISupportCreateType, dirOrUrl: string, baseName: string, options?: import("../@types/public").CreateAssetByTypeOptions) => Promise<IAssetInfo>;
    updateUserData: <T extends keyof import("../@types/asset-types").AssetUserDataMap = "unknown">(uuidOrURLOrPath: string, userData: import("../@types/asset-types").AssetUserDataMap[T]) => Promise<import("../@types/asset-types").AssetUserDataMap[T] | undefined>;
    updateUserDataByPath: <T extends keyof import("../@types/asset-types").AssetUserDataMap = "unknown">(uuidOrURLOrPath: string, path: string, value: any) => Promise<import("../@types/asset-types").AssetUserDataMap[T] | undefined>;
    querySerializedData: typeof serializedData.querySerializedData;
    saveSerializedData: typeof serializedData.saveSerializedData;
    queryMaterial: typeof materialService.queryMaterial;
    queryMaterialEffect: typeof materialService.queryEffect;
    queryMaterialAllEffects: typeof materialService.queryAllEffects;
    saveMaterial: typeof materialService.saveMaterial;
    queryAnimationGraphVariant: (uuid: string) => Promise<import("../animation-graph-variant").AnimGraphVariantDump>;
    changeAnimationGraphVariant: (uuid: string, dump: import("../animation-graph-variant").AnimGraphVariantDump) => Promise<import("../animation-graph-variant").AnimGraphVariantDump>;
    saveAnimationGraphVariant: (uuid: string) => Promise<void>;
    queryAssetConfigMap: () => Promise<Record<string, import("../@types/private").IAssetConfig>>;
    queryPropertySchema: (importer: string) => Promise<import("../@types/public").AssetPropertySchemaMap>;
    updateDefaultUserData: (handler: string, key: string, value: any) => Promise<void>;
    getCreateMap: () => Promise<import("../@types/private").ICreateMenuInfo[]>;
    queryAssetUserDataConfig: (asset: IAsset) => Promise<false | Record<string, import("../@types/private").IUerDataConfigItem> | undefined>;
    queryThumbnailHandlers: () => string[];
    generateThumbnail(urlOrUUIDOrPath: string, size?: ThumbnailSize): Promise<ThumbnailInfo | null>;
    extractImagePixels(urlOrUUIDOrPath: string, options: IImagePixelExtractionOptions): Promise<IExtractedImagePixels | null>;
    getEffectBinPath(): Promise<string>;
    url2uuid(url: string): string;
    url2path(url: string): string;
    path2url(url: string, dbName?: string): string;
    /**
     * 监听资源添加事件
     * @param listener 回调函数
     * @returns 移除监听的函数
     */
    onAssetAdded(listener: (info: IAssetInfo) => void): () => void;
    /**
     * 监听资源变更事件
     * @param listener 回调函数
     * @returns 移除监听的函数
     */
    onAssetChanged(listener: (info: IAssetInfo) => void): () => void;
    /**
     * 监听资源删除事件
     * @param listener 回调函数
     * @returns 移除监听的函数
     */
    onAssetRemoved(listener: (info: IAssetInfo) => void): () => void;
    init(): Promise<void>;
    destroyed(): void;
    /**
     * 从资源对象提取变更信息
     * @param asset 资源对象
     * @returns 资源变更信息
     */
    private _extractAssetChangeInfo;
    private _snapshotAssetChangeInfo;
    _onAssetDBCreated(db: AssetDB): void;
    _onAssetDBRemoved(db: AssetDB): void;
    /**
     * 移除所有数据库的启动阶段进度追踪监听器
     * 在 ready 后调用，清理不再需要的监听器
     */
    private _removeProgressListeners;
    private _getImportState;
    private _emitProgress;
    _onAssetAdd: (asset: IAsset) => Promise<void>;
    _onAssetChange: (asset: IAsset) => Promise<void>;
    _onAssetDelete: (asset: IAsset) => Promise<void>;
    _onAssetAdded: (asset: IAsset) => Promise<void>;
    _onAssetChanged: (asset: IAsset) => Promise<void>;
    _onAssetDeleted: (asset: IAsset) => Promise<void>;
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
    onReady(listener: () => void): () => void;
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
    onDBReady(listener: (dbInfo: IAssetDBInfo) => void): () => void;
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
    onProgress(listener: (current: number, total: number, url: string, state: 'processing' | 'success' | 'failed') => void): () => void;
}
declare const assetManager: AssetManager;
export interface TypedAssetManager extends EventEmitter {
    on<K extends keyof AssetManagerEvents>(event: K, listener: AssetManagerEvents[K]): this;
    once<K extends keyof AssetManagerEvents>(event: K, listener: AssetManagerEvents[K]): this;
    emit<K extends keyof AssetManagerEvents>(event: K, ...args: Parameters<AssetManagerEvents[K]>): boolean;
    removeListener<K extends keyof AssetManagerEvents>(event: K, listener: AssetManagerEvents[K]): this;
    removeAllListeners<K extends keyof AssetManagerEvents>(event?: K): this;
    listeners<K extends keyof AssetManagerEvents>(event: K): Function[];
    listenerCount<K extends keyof AssetManagerEvents>(event: K): number;
    onAssetAdded(listener: (info: IAssetInfo) => void): () => void;
    onAssetChanged(listener: (info: IAssetInfo) => void): () => void;
    onAssetRemoved(listener: (info: IAssetInfo) => void): () => void;
    queryAssets: typeof assetQuery.queryAssets;
    queryAssetDependencies: typeof assetQuery.queryAssetDependencies;
    queryAssetUsers: typeof assetQuery.queryAssetUsers;
    queryAsset: typeof assetQuery.queryAsset;
    queryAssetInfo: typeof assetQuery.queryAssetInfo;
    queryAssetInfoByUUID: typeof assetQuery.queryAssetInfoByUUID;
    queryAssetInfos: typeof assetQuery.queryAssetInfos;
    querySortedPlugins: typeof assetQuery.querySortedPlugins;
    queryUUID: typeof assetQuery.queryUUID;
    queryPath: typeof assetQuery.queryPath;
    queryUrl: typeof assetQuery.queryUrl;
    generateAvailableURL: typeof assetQuery.generateAvailableURL;
    queryDBAssetInfo: typeof assetQuery.queryDBAssetInfo;
    encodeAsset: typeof assetQuery.encodeAsset;
    queryAssetProperty: typeof assetQuery.queryAssetProperty;
    queryAssetMeta: typeof assetQuery.queryAssetMeta;
    querySubAssetName: typeof assetQuery.querySubAssetName;
    queryAssetMtime: typeof assetQuery.queryAssetMtime;
    importAsset: typeof assetOperation.importAsset;
    copyAsset: typeof assetOperation.copyAsset;
    saveAssetMeta: typeof assetOperation.saveAssetMeta;
    saveAsset: typeof assetOperation.saveAsset;
    createAsset: typeof assetOperation.createAsset;
    refreshAsset: typeof assetOperation.refreshAsset;
    reimportAsset: typeof assetOperation.reimportAsset;
    renameAsset: typeof assetOperation.renameAsset;
    removeAsset: typeof assetOperation.removeAsset;
    moveAsset: typeof assetOperation.moveAsset;
    generateExportData: typeof assetOperation.generateExportData;
    outputExportData: typeof assetOperation.outputExportData;
    createAssetByType: typeof assetOperation.createAssetByType;
    updateUserData: typeof assetOperation.updateUserData;
    updateUserDataByPath: typeof assetOperation.updateUserDataByPath;
    querySerializedData: typeof serializedData.querySerializedData;
    saveSerializedData: typeof serializedData.saveSerializedData;
    queryMaterial: typeof materialService.queryMaterial;
    queryMaterialEffect: typeof materialService.queryEffect;
    queryMaterialAllEffects: typeof materialService.queryAllEffects;
    saveMaterial: typeof materialService.saveMaterial;
    queryAnimationGraphVariant: typeof animationGraphVariant.query;
    changeAnimationGraphVariant: typeof animationGraphVariant.change;
    saveAnimationGraphVariant: typeof animationGraphVariant.save;
    queryAssetConfigMap: typeof assetHandlerManager.queryAssetConfigMap;
    queryPropertySchema: typeof assetHandlerManager.queryPropertySchema;
    updateDefaultUserData: typeof assetHandlerManager.updateDefaultUserData;
    getCreateMap: typeof assetHandlerManager.getCreateMap;
    queryAssetUserDataConfig: typeof assetHandlerManager.queryUserDataConfig;
    queryThumbnailHandlers: typeof assetHandlerManager.queryThumbnailHandlers;
    getEffectBinPath: typeof assetHandlerManager.getEffectBinPath;
    generateThumbnail(urlOrUUIDOrPath: string, size?: ThumbnailSize): Promise<ThumbnailInfo | null>;
    extractImagePixels(urlOrUUIDOrPath: string, options: IImagePixelExtractionOptions): Promise<IExtractedImagePixels | null>;
    onReady: typeof assetManager.onReady;
    onDBReady: typeof assetManager.onDBReady;
    onProgress: typeof assetManager.onProgress;
    url2uuid(url: string): string;
    url2path(url: string): string;
    path2url(url: string, dbName?: string): string;
    init(): Promise<void>;
    destroyed(): void;
}
declare const typedAssetManager: TypedAssetManager;
export default typedAssetManager;
