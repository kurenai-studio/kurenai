import type { AnimationMaskChange, AnimationMaskDump, AssetOperationOption, AssetPropertySchemaMap, CreateAssetByTypeOptions, DeleteAssetOptions, IAssetFileSystemProvider, IAssetInfo, IAssetMeta, ISupportCreateType, MaterialDump, MaterialEffectInfo, MaterialTechniqueDump, QueryAssetsOption, SerializedAssetPatch, SerializedAssetQueryResult } from '../../core/assets/@types/public';
import type { CreateAssetOptions, IAssetConfig, IAssetDBInfo, ICreateMenuInfo, IUerDataConfigItem, QueryAssetType, ThumbnailInfo, ThumbnailSize } from '../../core/assets/@types/protected';
import type { FilterPluginOptions, IPluginScriptInfo } from '../../core/scripting/interface';
import type { AnimGraphVariantDump } from '../../core/assets/animation-graph-variant';
export type * from '../../core/assets/@types/public';
export type { CreateAssetOptions, IAssetConfig, IAssetDBInfo, ICreateMenuInfo, IUerDataConfigItem, QueryAssetType } from '../../core/assets/@types/protected';
export type { FilterPluginOptions, IPluginScriptInfo } from '../../core/scripting/interface';
export type { AnimGraphVariantDump } from '../../core/assets/animation-graph-variant';
export declare function init(): Promise<void>;
/**
 * Register asset filesystem provider before initializing the asset database.
 */
export declare function setFileSystemProvider(provider: IAssetFileSystemProvider): void;
/**
 * Start Asset DB // 启动资源数据库，开始扫描和导入资源
 */
export declare function start(): Promise<void>;
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
export declare function onReady(listener: () => void): () => void;
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
export declare function onDBReady(listener: (dbInfo: IAssetDBInfo) => void): () => void;
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
export declare function onProgress(listener: (current: number, total: number, url: string, state: 'processing' | 'success' | 'failed') => void): () => void;
/**
 * Delete Asset // 删除资源
 */
export declare function deleteAsset(dbPath: string, options?: DeleteAssetOptions): Promise<IAssetInfo | null>;
/**
 * Refresh Asset Directory // 刷新资源目录
 */
export declare function refresh(dir: string): Promise<number>;
/**
 * Query Asset Info // 查询资源信息
 */
export declare function queryAssetInfo(urlOrUUIDOrPath: string, dataKeys?: string[] | undefined): Promise<IAssetInfo | null>;
/**
 * Query Asset Metadata // 查询资源元数据
 */
export declare function queryAssetMeta(urlOrUUIDOrPath: string): Promise<IAssetMeta<'unknown'> | null>;
/**
 * Query Creatable Asset Map // 查询可创建资源映射表
 */
export declare function queryCreateMap(): Promise<ICreateMenuInfo[]>;
/**
 * Batch Query Asset Info // 批量查询资源信息
 */
export declare function queryAssetInfos(options?: QueryAssetsOption, dataKeys?: (keyof IAssetInfo)[]): Promise<IAssetInfo[]>;
/**
 * Query All Asset Database Info // 查询所有资源数据库信息
 */
export declare function queryAssetDBInfos(): Promise<Record<string, IAssetDBInfo>>;
/**
 * Create Asset By Type // 按类型创建资源
 */
export declare function createAssetByType(ccType: ISupportCreateType, dirOrUrl: string, baseName: string, options?: CreateAssetByTypeOptions): Promise<IAssetInfo>;
/**
 * Create Asset // 创建资源
 */
export declare function createAsset(options: CreateAssetOptions): Promise<IAssetInfo>;
/**
 * Import Asset // 导入资源
 */
export declare function importAsset(source: string, target: string, options?: AssetOperationOption): Promise<IAssetInfo[]>;
/**
 * Copy Asset // 复制资源及其完整元数据
 */
export declare function copyAsset(source: string, target: string, options?: AssetOperationOption): Promise<IAssetInfo>;
/**
 * Reimport Asset // 重新导入资源
 */
export declare function reimportAsset(pathOrUrlOrUUID: string): Promise<IAssetInfo>;
/**
 * Save Asset // 保存资源
 */
export declare function saveAsset(pathOrUrlOrUUID: string, data: string | Buffer): Promise<IAssetInfo>;
export declare const animationGraphVariant: {
    query(uuid: string): Promise<AnimGraphVariantDump>;
    change(uuid: string, dump: AnimGraphVariantDump): Promise<AnimGraphVariantDump>;
    save(uuid: string): Promise<void>;
};
export declare const animationMask: {
    query(uuid: string): Promise<AnimationMaskDump>;
    importSkeleton(uuid: string, skeletonSourceUuid: string): Promise<AnimationMaskDump>;
    clearNodes(uuid: string): Promise<AnimationMaskDump>;
    changeDump(uuid: string, changes: AnimationMaskChange[]): Promise<AnimationMaskDump>;
    save(uuid: string): Promise<void>;
};
/**
 * Query serialized asset dump data.
 */
export declare function querySerializedData(uuidOrUrlOrPath: string): Promise<SerializedAssetQueryResult>;
/**
 * Save serialized asset dump data.
 */
export declare function saveSerializedData(uuidOrUrlOrPath: string, patch: SerializedAssetPatch): Promise<SerializedAssetQueryResult>;
export declare const serializedData: {
    query: typeof querySerializedData;
    save: typeof saveSerializedData;
};
/**
 * Query all available material effects.
 */
export declare function queryMaterialAllEffects(): Promise<Record<string, MaterialEffectInfo>>;
/**
 * Query one material effect dump by UUID or effect name.
 */
export declare function queryMaterialEffect(effectNameOrUuid: string): Promise<MaterialTechniqueDump[]>;
/**
 * Query material dump data.
 */
export declare function queryMaterial(uuidOrUrlOrPath: string): Promise<MaterialDump>;
/**
 * Save material dump data.
 */
export declare function saveMaterial(uuidOrUrlOrPath: string, dump: MaterialDump): Promise<void>;
export declare const material: {
    query: typeof queryMaterial;
    queryEffect: typeof queryMaterialEffect;
    queryAllEffects: typeof queryMaterialAllEffects;
    save: typeof saveMaterial;
};
/**
 * Query Asset UUID // 查询资源 UUID
 */
export declare function queryUUID(urlOrPath: string): Promise<string | null>;
/**
 * Query Asset Path // 查询资源路径
 */
export declare function queryPath(urlOrUuid: string): Promise<string>;
/**
 * Query Asset URL // 查询资源 URL
 */
export declare function queryUrl(uuidOrPath: string): Promise<string>;
/**
 * Query Asset Dependencies // 查询资源依赖
 */
export declare function queryAssetDependencies(uuidOrUrl: string, type?: QueryAssetType): Promise<string[]>;
/**
 * Query Asset Users // 查询资源使用者
 */
export declare function queryAssetUsers(uuidOrUrl: string, type?: QueryAssetType): Promise<string[]>;
/**
 * Query Sorted Plugin Scripts // 查询排序后的插件脚本
 */
export declare function querySortedPlugins(filterOptions?: FilterPluginOptions): Promise<IPluginScriptInfo[]>;
/**
 * Rename Asset // 重命名资源
 */
export declare function renameAsset(source: string, newName: string, options?: AssetOperationOption): Promise<any>;
/**
 * Move Asset // 移动资源
 */
export declare function moveAsset(source: string, target: string, options?: AssetOperationOption): Promise<any>;
/**
 * Update Default User Data // 更新默认用户数据
 */
export declare function updateDefaultUserData(handler: string, path: string, value: any): Promise<void>;
/**
 * Query Asset User Data Config // 查询资源用户数据配置
 */
export declare function queryAssetUserDataConfig(urlOrUuidOrPath: string): Promise<false | Record<string, IUerDataConfigItem> | undefined>;
/**
 * Update Asset User Data // 更新资源用户数据
 */
export declare function updateAssetUserData(urlOrUuidOrPath: string, userData: Record<string, any>): Promise<any>;
/**
 * Update Asset User Data By Path // 按路径更新资源用户数据
 */
export declare function updateAssetUserDataByPath(urlOrUuidOrPath: string, path: string, value: any): Promise<any>;
/**
 * Query Asset Config Map // 查询资源配置映射表
 */
export declare function queryAssetConfigMap(): Promise<Record<string, IAssetConfig>>;
/**
 * Query Asset Property Schema // 查询资源导入属性 schema
 */
export declare function queryPropertySchema(importer: string): Promise<AssetPropertySchemaMap>;
/**
 * Query Thumbnail Handlers // 查询支持缩略图生成的资源处理器列表
 */
export declare function queryThumbnailHandlers(): string[];
/**
 * Generate Thumbnail // 生成资源缩略图
 */
export declare function generateThumbnail(urlOrUUIDOrPath: string, size?: ThumbnailSize): Promise<ThumbnailInfo | null>;
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
export declare function onAssetAdded(listener: (info: IAssetInfo) => void): () => void;
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
export declare function onAssetChanged(listener: (info: IAssetInfo) => void): () => void;
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
export declare function onAssetRemoved(listener: (info: IAssetInfo) => void): () => void;
