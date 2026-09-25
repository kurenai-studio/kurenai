import { TDbDirResult, TDirOrDbPath, TUrlOrUUIDOrPath, TSaveAssetPath, TDataKeys, TQueryAssetsOption, TSupportCreateType, TAssetOperationOption, TAssetData, TSerializedAssetPatch, TSerializedAssetResult, TMaterialEffectNameOrUuid, TMaterialDump, TMaterialEffectsResult, TMaterialEffectResult, TMaterialResult, TAssetInfoResult, TAssetMetaResult, TCreateMapResult, TAssetInfosResult, TAssetDBInfosResult, TCreatedAssetResult, TImportedAssetResult, TReimportResult, TSaveAssetResult, TRefreshDirResult, TBaseName, TAssetNewName, TCreateAssetByTypeOptions, TCreateAssetOptions, TUUIDResult, TPathResult, TUrlResult, TQueryAssetType, TFilterPluginOptions, TPluginScriptInfo, TAssetMoveOptions, TAssetRenameOptions, TUserDataHandler, TUpdateAssetUserData, TUpdateAssetUserDataPath, TUpdateAssetUserDataValue, TUpdateAssetUserDataResult, TAssetConfigMapResult, TAssetPropertySchemaResult, TUUIDOrPath, TUrlOrUUID, TUrlOrPath, TAnimationGraphVariantDump, TAnimationGraphVariantResult, TAnimationGraphVariantSaveResult, TAnimationMaskDump, TAnimationMaskChanges, TVoidResult } from './schema';
import { CommonResultType } from '../base/schema-base';
export declare class AssetsApi {
    /**
     * Delete Asset // 删除资源
     */
    deleteAsset(dbPath: TDirOrDbPath): Promise<CommonResultType<TDbDirResult>>;
    /**
     * Refresh Asset Directory // 刷新资源目录
     */
    refresh(dir: TDirOrDbPath): Promise<CommonResultType<TRefreshDirResult>>;
    /**
     * Query Asset Info // 查询资源信息
     */
    queryAssetInfo(urlOrUUIDOrPath: TUrlOrUUIDOrPath, dataKeys?: TDataKeys): Promise<CommonResultType<TAssetInfoResult>>;
    /**
     * Query Asset Metadata // 查询资源元数据
     */
    queryAssetMeta(urlOrUUIDOrPath: TUrlOrUUIDOrPath): Promise<CommonResultType<TAssetMetaResult>>;
    /**
     * Query Creatable Asset Map // 查询可创建资源映射表
     */
    queryCreateMap(): Promise<CommonResultType<TCreateMapResult>>;
    /**
     * Batch Query Asset Info // 批量查询资源信息
     */
    queryAssetInfos(options?: TQueryAssetsOption): Promise<CommonResultType<TAssetInfosResult>>;
    /**
     * Query All Asset Database Info // 查询所有资源数据库信息
     */
    queryAssetDBInfos(): Promise<CommonResultType<TAssetDBInfosResult>>;
    /**
     * Create Asset By Type // 按类型创建资源
     */
    createAssetByType(ccType: TSupportCreateType, dirOrUrl: TDirOrDbPath, baseName: TBaseName, options?: TCreateAssetByTypeOptions): Promise<CommonResultType<TCreatedAssetResult>>;
    createAsset(options: TCreateAssetOptions): Promise<CommonResultType<TCreatedAssetResult>>;
    /**
     * Import Asset // 导入资源
     */
    importAsset(source: TDirOrDbPath, target: TDirOrDbPath, options?: TAssetOperationOption): Promise<CommonResultType<TImportedAssetResult>>;
    /**
     * Copy Asset // 复制资源
     */
    copyAsset(source: TUrlOrUUIDOrPath, target: TDirOrDbPath, options?: TAssetOperationOption): Promise<CommonResultType<TAssetInfoResult>>;
    /**
     * Reimport Asset // 重新导入资源
     */
    reimportAsset(pathOrUrlOrUUID: TUrlOrUUIDOrPath): Promise<CommonResultType<TReimportResult>>;
    /**
     * Save Asset // 保存资源
     */
    saveAsset(pathOrUrlOrUUID: TSaveAssetPath, data: TAssetData): Promise<CommonResultType<TSaveAssetResult>>;
    queryAnimationMask(uuid: TUrlOrUUIDOrPath): Promise<CommonResultType<TAnimationMaskDump | null>>;
    importAnimationMaskSkeleton(uuid: TUrlOrUUIDOrPath, skeletonSourceUuid: TUrlOrUUIDOrPath): Promise<CommonResultType<TAnimationMaskDump | null>>;
    clearAnimationMaskNodes(uuid: TUrlOrUUIDOrPath): Promise<CommonResultType<TAnimationMaskDump | null>>;
    changeAnimationMaskDump(uuid: TUrlOrUUIDOrPath, changes: TAnimationMaskChanges): Promise<CommonResultType<TAnimationMaskDump | null>>;
    saveAnimationMask(uuid: TUrlOrUUIDOrPath): Promise<CommonResultType<TVoidResult>>;
    /**
     * Query All Material Effects // 查询所有材质 Effect
     */
    queryMaterialAllEffects(): Promise<CommonResultType<TMaterialEffectsResult>>;
    /**
     * Query Material Effect // 查询单个材质 Effect
     */
    queryMaterialEffect(effectNameOrUuid: TMaterialEffectNameOrUuid): Promise<CommonResultType<TMaterialEffectResult>>;
    /**
     * Query Material // 查询材质
     */
    queryMaterial(uuidOrUrlOrPath: TUrlOrUUIDOrPath): Promise<CommonResultType<TMaterialResult | null>>;
    /**
     * Save Material // 保存材质
     */
    saveMaterial(uuidOrUrlOrPath: TUrlOrUUIDOrPath, dump: TMaterialDump): Promise<CommonResultType<TVoidResult>>;
    /**
     * Query Serialized Asset Data // 查询序列化资源属性数据
     */
    querySerializedData(uuidOrUrlOrPath: TUrlOrUUIDOrPath): Promise<CommonResultType<TSerializedAssetResult>>;
    /**
     * Save Serialized Asset Data // 保存序列化资源属性数据
     */
    saveSerializedData(uuidOrUrlOrPath: TUrlOrUUIDOrPath, patch: TSerializedAssetPatch): Promise<CommonResultType<TSerializedAssetResult>>;
    /**
     * Animation Graph Variant
     */
    queryAnimationGraphVariant(uuid: TUrlOrUUID): Promise<CommonResultType<TAnimationGraphVariantResult>>;
    changeAnimationGraphVariant(uuid: TUrlOrUUID, dump: TAnimationGraphVariantDump): Promise<CommonResultType<TAnimationGraphVariantResult>>;
    saveAnimationGraphVariant(uuid: TUrlOrUUID): Promise<CommonResultType<TAnimationGraphVariantSaveResult>>;
    /**
     * Query Asset UUID // 查询资源 UUID
     */
    queryUUID(urlOrPath: TUrlOrPath): Promise<CommonResultType<TUUIDResult>>;
    /**
     * Query Asset Path // 查询资源路径
     */
    queryPath(urlOrUuid: TUrlOrUUIDOrPath): Promise<CommonResultType<TPathResult>>;
    /**
     * Query Asset URL // 查询资源 URL
     */
    queryUrl(uuidOrPath: TUUIDOrPath): Promise<CommonResultType<TUrlResult>>;
    /**
     * Query Asset Dependencies // 查询资源依赖
     */
    queryAssetDependencies(uuidOrUrl: TUrlOrUUID, type?: TQueryAssetType): Promise<CommonResultType<string[]>>;
    /**
     * Query Asset Users // 查询资源使用者
     */
    queryAssetUsers(uuidOrUrl: TUrlOrUUID, type?: TQueryAssetType): Promise<CommonResultType<string[]>>;
    /**
     * Query Sorted Plugin Scripts // 查询排序后的插件脚本
     */
    querySortedPlugins(filterOptions?: TFilterPluginOptions): Promise<CommonResultType<TPluginScriptInfo[]>>;
    /**
     * Rename Asset // 重命名资源
     */
    renameAsset(source: TUrlOrUUIDOrPath, newName: TAssetNewName, options?: TAssetRenameOptions): Promise<CommonResultType<TAssetInfoResult>>;
    /**
     * Move Asset // 移动资源
     */
    moveAsset(source: TDirOrDbPath, target: TDirOrDbPath, options?: TAssetMoveOptions): Promise<CommonResultType<TAssetInfoResult>>;
    /**
     * Update Default User Data // 更新默认用户数据
     */
    updateDefaultUserData(handler: TUserDataHandler, path: TUpdateAssetUserDataPath, value: TUpdateAssetUserDataValue): Promise<CommonResultType<null>>;
    /**
     * Query Asset User Data Config // 查询资源用户数据配置
     */
    queryAssetUserDataConfig(urlOrUuidOrPath: TUrlOrUUIDOrPath): Promise<CommonResultType<any>>;
    /**
     * Update Asset User Data // 更新资源用户数据
     */
    updateAssetUserData(urlOrUuidOrPath: TUrlOrUUIDOrPath, userData: TUpdateAssetUserData): Promise<CommonResultType<TUpdateAssetUserDataResult>>;
    /**
     * Update Asset User Data By Path // 按路径更新资源用户数据
     */
    updateAssetUserDataByPath(urlOrUuidOrPath: TUrlOrUUIDOrPath, path: TUpdateAssetUserDataPath, value: TUpdateAssetUserDataValue): Promise<CommonResultType<TUpdateAssetUserDataResult>>;
    /**
     * Query Asset Config Map // 查询资源配置映射表
     */
    queryAssetConfigMap(): Promise<CommonResultType<TAssetConfigMapResult>>;
    /**
     * Query Asset Property Schema // 查询资源导入属性 schema
     */
    queryPropertySchema(importer: TUserDataHandler): Promise<CommonResultType<TAssetPropertySchemaResult>>;
}
