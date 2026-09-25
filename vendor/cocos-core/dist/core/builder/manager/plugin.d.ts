import EventEmitter from 'events';
import { Platform, IDisplayOptions, IBuildTaskOption, TextureCompressFullRenderConfig } from '../@types';
import { IInternalBuildPluginConfig, PlatformBundleConfig, BundleQueryConfig, IBuildStageItem, BuildCheckResult, BuildTemplateConfig, IPlatformConfig, ITextureCompressConfig, IBuildHooksInfo, IBuildCommandOption, MakeRequired, IBuilderConfigItem, IBuilderRegisterInfo, PlatformBuildSchema, PlatformConfigItem } from '../@types/protected';
export interface InternalPackageInfo {
    name: string;
    path: string;
    buildPath: string;
    doc?: string;
    displayName?: string;
    version: string;
}
type ICustomAssetHandlerType = 'compressTextures';
export declare class PluginManager extends EventEmitter {
    bundleConfigs: Record<string, PlatformBundleConfig>;
    commonOptionConfig: Record<string, Record<string, IBuilderConfigItem & {
        verifyKey: string;
    }>>;
    pkgOptionConfigs: Record<string, Record<string, IDisplayOptions>>;
    platformConfig: Record<string, IPlatformConfig>;
    buildTemplateConfigMap: Record<string, BuildTemplateConfig>;
    configMap: Record<string, Record<string, IInternalBuildPluginConfig>>;
    private builderPathsMap;
    private customBuildStagesMap;
    protected customBuildStages: Record<string, {
        [pkgName: string]: IBuildStageItem[];
    }>;
    private assetHandlers;
    protected readonly pkgPriorities: Record<string, number>;
    packageRegisterInfo: Map<string, InternalPackageInfo>;
    private platformRegisterInfoPool;
    constructor();
    init(): Promise<void>;
    registerAllPlatform(): Promise<void>;
    register(platform: string): Promise<void>;
    checkPlatform(platform: string): boolean;
    private registerPlatform;
    private internalRegister;
    _registerI18n(registerInfo: IBuilderRegisterInfo): void;
    private translateConfigItemDisplayFields;
    private translateConfigItemsDisplayFields;
    private translateConfigDisplayFields;
    refreshDisplayI18nFields(): void;
    getCommonOptionConfigs(platform: Platform): Record<string, IBuilderConfigItem>;
    getCommonOptionConfigByKey(key: keyof IBuildTaskOption, options: IBuildTaskOption): IBuilderConfigItem | null;
    getPackageOptionConfigByKey(key: string, pkgName: string, options: IBuildTaskOption): IBuilderConfigItem | null;
    getOptionConfigByKey(key: keyof IBuildTaskOption, options: IBuildTaskOption): IBuilderConfigItem | null;
    private hasFixedValue;
    private getFixedValue;
    /**
     * 完整校验构建参数（校验平台插件相关的参数校验）
     * @param options
     */
    checkOptions(options: MakeRequired<IBuildCommandOption, 'platform' | 'mainBundleCompressionType'>): Promise<undefined | IBuildTaskOption>;
    private getPlatformBuildPluginConfig;
    private ensurePlatformRegistered;
    /**
     * Complete child platform build options for platforms that support combined builds.
     *
     * When the parent platform enables `supportPlatforms`, this method:
     * - registers and enables configured child platforms;
     * - merges each child platform's own default package options;
     * - synchronizes parent OpenPaaS upload identity fields into child packages
     *   so web upload stages use the same app/version/environment/session.
     */
    private completeSupportPlatformOptions;
    /**
     * Copy parent OpenPaaS upload fields to a support-platform package.
     *
     * OpenPaaS and web packages both consume `appid`. `app_id` is accepted as a
     * legacy parent key for compatibility. The remaining fields share the same
     * key names and must stay aligned across parent and child builds for web
     * package upload.
     */
    private syncParentOptionsToSupportPlatformPackage;
    checkCommonOptions(options: IBuildTaskOption): Promise<Record<string, BuildCheckResult>>;
    checkCommonOptionByKey(key: keyof IBuildTaskOption, value: any, options: IBuildTaskOption): Promise<BuildCheckResult>;
    /**
     * 校验构建插件注册的构建参数
     * @param options
     */
    private createVerifyOptions;
    private checkPlatformOptionByKey;
    checkBuildOption(platform: string, key: string, value: unknown, options: IBuildTaskOption): Promise<BuildCheckResult>;
    checkBuildOptions(platform: string, options: IBuildTaskOption): Promise<Record<string, BuildCheckResult>>;
    private checkPluginOptions;
    shouldGenerateOptions(platform: Platform | string): boolean;
    /**
     * 获取平台默认值
     * @param platform
     */
    getOptionsByPlatform<P extends Platform | string>(platform: P): Promise<IBuildTaskOption>;
    getTexturePlatformConfigs(): Record<string, ITextureCompressConfig>;
    private cloneDisplayOptions;
    private cloneConfigItem;
    private applySupportedCompressionTypes;
    /**
     * 装配某平台的原始配置项(IBuilderConfigItem):
     *   common = CLI 内置 common 项 + 该平台 commonOptions 覆盖(已应用支持的压缩类型);
     *   platformOptions = 平台 config.options。
     * key 顺序即显示顺序。供构建面板 schema(getPlatformBuildSchema)与配置校验(checkBuildOptions)共用。
     */
    private collectPlatformConfigItems;
    getPlatformBuildSchema(platform: Platform | string): PlatformBuildSchema;
    queryPlatformConfig(): PlatformConfigItem[];
    getRegisteredPlatforms(): string[];
    /**
     * 查询所有平台的 Bundle 配置，按平台类型分组
     */
    queryBundleConfig(): Record<string, BundleQueryConfig>;
    /**
     * 查询所有平台的纹理压缩配置，按纹理压缩平台类型分组
     */
    queryTextureCompressConfig(): TextureCompressFullRenderConfig;
    /**
     * 获取带有钩子函数的构建阶段任务
     * @param platform
     * @returns
     */
    getBuildStageWithHookTasks(platform: Platform | string, taskName: string): IBuildStageItem | null;
    /**
     * 查询某个平台的阶段性任务按钮配置信息
     * @param platform
     */
    getBuildStageConfigByPlatform(platform: Platform): Record<string, any> | null;
    /**
     * 根据插件权重传参的插件数组
     * @param pkgNames
     * @returns
     */
    private sortPkgNameWidthPriority;
    /**
     * 获取平台插件的构建路径信息
     * @param platform
     */
    getHooksInfo(platform: Platform | string): IBuildHooksInfo;
    getBuildTemplateConfig(platform: string): BuildTemplateConfig;
    /**
     * 根据类型获取对应的执行方法
     * @param type
     * @returns
     */
    createBuildTemplate(nameOrPlatform: string): Promise<void>;
    getAssetHandlers(type: ICustomAssetHandlerType): {
        pkgNameOrder: string[];
        handles: Record<string, (...args: unknown[]) => unknown>;
    };
}
export declare const pluginManager: PluginManager;
export {};
