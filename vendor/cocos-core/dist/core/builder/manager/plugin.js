"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = exports.PluginManager = void 0;
const events_1 = __importDefault(require("events"));
const path_1 = require("path");
const common_options_validator_1 = require("../share/common-options-validator");
const platforms_options_1 = require("../share/platforms-options");
const validator_manager_1 = require("../share/validator-manager");
const utils_1 = require("../share/utils");
const utils_2 = __importDefault(require("../../base/utils"));
const i18n_1 = __importDefault(require("../../base/i18n"));
const lodash_1 = __importDefault(require("lodash"));
const texture_compress_1 = require("../share/texture-compress");
const bundle_utils_1 = require("../share/bundle-utils");
const console_1 = require("../../base/console");
const builder_config_1 = __importDefault(require("../share/builder-config"));
const metadata_1 = require("../share/metadata");
const configuration_1 = require("../../configuration");
const global_1 = require("../../../global");
const fs_1 = require("fs");
const utils_3 = __importDefault(require("../../base/utils"));
const fs_extra_1 = require("fs-extra");
// 对外支持的对外公开的资源处理方法汇总
const CustomAssetHandlerTypes = ['compressTextures'];
const SUPPORT_PLATFORM_PARENT_OPTION_MAPPINGS = [{
        childKey: 'appid',
        parentKeys: ['appid'],
    }, {
        childKey: 'versionName',
        parentKeys: ['versionName'],
    }, {
        childKey: 'uploadEnv',
        parentKeys: ['uploadEnv'],
    }, {
        childKey: 'accessToken',
        parentKeys: ['accessToken'],
    }, {
        childKey: 'codeVersion',
        parentKeys: ['codeVersion'],
    }];
function translateDisplayValue(value) {
    if (typeof value !== 'string') {
        return value;
    }
    return i18n_1.default.transI18nName(value) || value;
}
function materializeDisplayI18nKey(target, key) {
    if (!target) {
        return;
    }
    const keyField = `${key}I18nKey`;
    const rawValue = typeof target[keyField] === 'string' ? target[keyField] : target[key];
    if (typeof rawValue !== 'string') {
        return;
    }
    if (rawValue.startsWith('i18n:')) {
        target[keyField] = rawValue;
    }
    target[key] = translateDisplayValue(rawValue);
}
const pluginRoots = [
    (0, path_1.join)(__dirname, '../platforms'),
    (0, path_1.join)(global_1.GlobalPaths.workspace, 'packages/platforms'),
];
function getRegisterInfo(root, dirName) {
    const packageJSONPath = (0, path_1.join)(root, 'package.json');
    if ((0, fs_1.existsSync)(packageJSONPath)) {
        const packageJSON = require(packageJSONPath);
        const builder = packageJSON.contributes.builder;
        if (!builder.register) {
            return null;
        }
        return {
            platform: builder.platform,
            hooks: builder.hooks ? (0, path_1.join)(root, builder.hooks) : undefined,
            config: require((0, path_1.join)(root, builder.config)).default,
            path: root,
            conifgPath: (0, path_1.join)(root, builder.config),
            type: 'register',
        };
    }
    if (utils_3.default.Path.contains(global_1.GlobalPaths.workspace, root)) {
        if (platforms_options_1.PLATFORMS.includes(dirName)) {
            return {
                platform: (0, path_1.basename)(root),
                path: root,
                config: require((0, path_1.join)(root, 'config')).default,
                hooks: (0, path_1.join)(root, 'hooks'),
                conifgPath: (0, path_1.join)(root, 'config'),
                type: 'register',
            };
        }
        return null;
    }
    throw new Error(`Can not find package.json in root: ${root}`);
}
async function scanPluginRoot(root) {
    const dirNames = (0, fs_1.readdirSync)(root);
    const res = [];
    for (const dirName of dirNames) {
        try {
            const registerInfo = await getRegisterInfo((0, path_1.join)(root, dirName), dirName);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            registerInfo && res.push(registerInfo);
        }
        catch (error) {
            console.error(error);
            console.error(`Register platform package failed in root: ${root}`);
        }
    }
    return res;
}
class PluginManager extends events_1.default {
    // 平台选项信息
    bundleConfigs = {};
    commonOptionConfig = {};
    pkgOptionConfigs = {};
    platformConfig = {};
    buildTemplateConfigMap = {};
    configMap; // 存储注入进来的 config
    // 存储注册进来的，带有 hooks 的插件路径，[pkgName][platform]: hooks
    builderPathsMap = {};
    customBuildStagesMap = {};
    customBuildStages;
    // 存储注册进来的，带有 assetHandlers 配置的一些方法 [ICustomAssetHandlerType][pkgName]: Function
    assetHandlers = {};
    // 存储插件优先级（TODO 目前优先级记录在 config 内，针对不同平台可能有不同的优先级）
    pkgPriorities = {};
    // 记录已注册的插件名称
    packageRegisterInfo = new Map();
    platformRegisterInfoPool = new Map();
    constructor() {
        super();
        const compsMap = {};
        this.pkgOptionConfigs = compsMap;
        this.configMap = JSON.parse(JSON.stringify(compsMap));
        this.customBuildStages = JSON.parse(JSON.stringify(compsMap));
        CustomAssetHandlerTypes.forEach((handlerName) => {
            this.assetHandlers[handlerName] = {};
        });
    }
    async init() {
        for (const root of pluginRoots) {
            if (!(0, fs_1.existsSync)(root)) {
                continue;
            }
            const infos = await scanPluginRoot(root);
            for (const info of infos) {
                this._registerI18n(info);
                this.translateConfigDisplayFields(info.config);
                this.platformRegisterInfoPool.set(info.platform, info);
            }
        }
        this.translateConfigItemsDisplayFields(builder_config_1.default.commonOptionConfigs);
    }
    async registerAllPlatform() {
        for (const platform of this.platformRegisterInfoPool.keys()) {
            try {
                await this.register(platform);
            }
            catch (error) {
                console.error(error);
                console.error(`register platform ${platform} failed!`);
            }
        }
    }
    async register(platform) {
        if (this.platformConfig[platform]) {
            console.debug(`platform ${platform} has register already!`);
            return;
        }
        const info = this.platformRegisterInfoPool.get(platform);
        if (!info) {
            throw new Error(`Can not find platform register info for ${platform}`);
        }
        await this.registerPlatform(info);
        await this.internalRegister(info);
        console.log(`register platform ${platform} success!`);
    }
    checkPlatform(platform) {
        try {
            return !!platform && !!this.platformConfig[platform].platformType;
        }
        catch (error) {
            return false;
        }
    }
    async registerPlatform(registerInfo) {
        const { platform, config } = registerInfo;
        if (this.platformConfig[platform]) {
            console.error(`platform ${platform} has register already!`);
            return;
        }
        this.configMap[platform] = {};
        this.platformConfig[platform] = {};
        if (config.assetBundleConfig) {
            this.bundleConfigs[platform] = Object.assign(this.bundleConfigs[platform] || {}, {
                platformType: config.assetBundleConfig.platformType,
                supportOptions: {
                    compressionType: config.assetBundleConfig.supportedCompressionTypes,
                },
            });
        }
        // 注册压缩纹理配置，需要在平台剔除之前
        if (typeof config.textureCompressConfig === 'object') {
            const configGroupsInfo = texture_compress_1.configGroups[config.textureCompressConfig.platformType];
            if (!configGroupsInfo) {
                console.error(`Invalid platformType ${config.textureCompressConfig.platformType}`);
            }
            else {
                configGroupsInfo.support.rgb = lodash_1.default.union(configGroupsInfo.support.rgb, config.textureCompressConfig.support.rgb);
                configGroupsInfo.support.rgba = lodash_1.default.union(configGroupsInfo.support.rgba, config.textureCompressConfig.support.rgba);
                if (configGroupsInfo.defaultSupport) {
                    config.textureCompressConfig.support.rgb = lodash_1.default.union(config.textureCompressConfig.support.rgb, configGroupsInfo.defaultSupport.rgb);
                    config.textureCompressConfig.support.rgba = lodash_1.default.union(config.textureCompressConfig.support.rgba, configGroupsInfo.defaultSupport.rgba);
                }
            }
            this.platformConfig[platform].texture = config.textureCompressConfig;
        }
        const configWithDisplayKeys = config;
        this.platformConfig[platform].name = config.displayName;
        this.platformConfig[platform].nameI18nKey = configWithDisplayKeys.displayNameI18nKey;
        if (config.doc && !config.doc.startsWith('http')) {
            config.doc = utils_2.default.Url.getDocUrl(config.doc);
        }
        this.platformConfig[platform].doc = config.doc;
        this.platformConfig[platform].pluginPath = registerInfo.path;
        this.platformConfig[platform].platformType = config.platformType;
        if (config.buildTemplateConfig && config.buildTemplateConfig.templates.length) {
            const label = config.displayName || platform;
            config.buildTemplateConfig.pkgName = platform;
            this.platformConfig[platform].createTemplateLabel = label;
            this.platformConfig[platform].createTemplateLabelI18nKey = configWithDisplayKeys.displayNameI18nKey;
            this.buildTemplateConfigMap[label] = config.buildTemplateConfig;
        }
        if (this.bundleConfigs[platform]) {
            this.platformConfig[platform].type = this.bundleConfigs[platform].platformType;
        }
    }
    async internalRegister(registerInfo) {
        const { platform, config, path } = registerInfo;
        if (!this.platformConfig[platform] || !this.platformConfig[platform].name) {
            throw new Error(`platform ${platform} has been registered!`);
        }
        const pkgName = registerInfo.pkgName || platform;
        this.pkgPriorities[pkgName] = config.priority || (path.includes(global_1.GlobalPaths.workspace) ? 1 : 0);
        // 注册校验方法
        if (typeof config.verifyRuleMap === 'object') {
            for (const [ruleName, item] of Object.entries(config.verifyRuleMap)) {
                // 添加以 平台 + 插件 作为 key 的校验规则
                validator_manager_1.validatorManager.addRule(ruleName, item, platform + pkgName);
            }
        }
        if (typeof config.options === 'object') {
            lodash_1.default.set(this.pkgOptionConfigs, `${registerInfo.platform}.${pkgName}`, config.options);
            Object.keys(config.options).forEach((key) => {
                (0, utils_1.checkConfigDefault)(config.options[key]);
            });
            await builder_config_1.default.setProject(`platforms.${platform}.packages.${platform}`, (0, utils_1.getOptionsDefault)(config.options), 'default');
        }
        // 整理通用构建选项的校验规则
        if (config.commonOptions) {
            // 此机制依赖了插件的启动顺序来写入配置
            if (!this.commonOptionConfig[platform]) {
                // 使用默认通用配置和首个插件自定义的通用配置进行融合
                this.commonOptionConfig[platform] = Object.assign({}, lodash_1.default.defaultsDeep({}, config.commonOptions, JSON.parse(JSON.stringify(builder_config_1.default.commonOptionConfigs))));
            }
            else {
                this.commonOptionConfig[platform] = (0, utils_1.defaultMerge)({}, this.commonOptionConfig[platform], config.commonOptions || {});
            }
            const commonOptions = config.commonOptions;
            for (const key in commonOptions) {
                if (commonOptions[key].verifyRules) {
                    this.commonOptionConfig[platform][key] = Object.assign({}, this.commonOptionConfig[platform][key], {
                        verifyKey: platform + pkgName,
                    });
                }
            }
        }
        if (config.customBuildStages) {
            // 注册构建阶段性任务
            lodash_1.default.set(this.customBuildStages, `${platform}.${pkgName}`, config.customBuildStages);
            lodash_1.default.set(this.customBuildStagesMap, `${pkgName}.${platform}`, config.customBuildStages);
            await builder_config_1.default.setProject(`platforms.${platform}.generateCompileConfig`, this.shouldGenerateOptions(platform), 'default');
        }
        this.pkgPriorities[pkgName] = config.priority || 0;
        this.configMap[platform][pkgName] = config;
        await configuration_1.configurationRegistry.register('builder', {
            nodes: () => (0, metadata_1.createBuilderPlatformMetadataNodes)(platform, {
                commonOptionConfigs: builder_config_1.default.commonOptionConfigs,
                useCacheDefaults: {},
                commonOptionConfig: this.commonOptionConfig,
                configMap: {
                    [platform]: this.configMap[platform],
                },
                platformTitles: {
                    [platform]: this.platformConfig[platform]?.name || platform,
                },
            }),
        });
        // 注册 hooks 路径
        if (registerInfo.hooks) {
            config.hooks = registerInfo.hooks;
            lodash_1.default.set(this.builderPathsMap, `${pkgName}.${platform}`, config.hooks);
        }
        // 注册构建模板菜单项
        console.debug(`[Build] internalRegister pkg(${pkgName}) in ${platform} platform success!`);
    }
    _registerI18n(registerInfo) {
        const { platform, path } = registerInfo;
        const i18nPath = (0, path_1.join)(path, 'i18n');
        if ((0, fs_1.existsSync)(i18nPath)) {
            try {
                const patchPath = registerInfo.pkgName || platform;
                (0, fs_1.readdirSync)(i18nPath).forEach((file) => {
                    const filePath = (0, path_1.join)(i18nPath, file);
                    if (file.endsWith('.json')) {
                        const lang = (0, path_1.basename)(file, '.json');
                        i18n_1.default.registerLanguagePatch(lang, patchPath, (0, fs_extra_1.readJSONSync)(filePath));
                    }
                    else if (file.endsWith('.js')) {
                        const lang = (0, path_1.basename)(file, '.js');
                        const resolved = require.resolve(filePath);
                        const data = require(resolved);
                        i18n_1.default.registerLanguagePatch(lang, patchPath, data);
                    }
                });
            }
            catch (error) {
                if (registerInfo.type === 'register') {
                    throw error;
                }
                console.error(error);
            }
        }
    }
    translateConfigItemDisplayFields(config) {
        if (!config || typeof config !== 'object') {
            return;
        }
        const item = config;
        materializeDisplayI18nKey(item, 'label');
        materializeDisplayI18nKey(item, 'description');
        if (item.properties && typeof item.properties === 'object') {
            Object.values(item.properties).forEach((property) => {
                this.translateConfigItemDisplayFields(property);
            });
        }
        if (Array.isArray(item.items)) {
            item.items.forEach((child) => {
                if (child && typeof child === 'object') {
                    this.translateConfigItemDisplayFields(child);
                }
            });
        }
        else if (item.items && typeof item.items === 'object') {
            this.translateConfigItemDisplayFields(item.items);
        }
    }
    translateConfigItemsDisplayFields(configs) {
        if (!configs || typeof configs !== 'object') {
            return;
        }
        Object.values(configs).forEach((option) => {
            this.translateConfigItemDisplayFields(option);
        });
    }
    translateConfigDisplayFields(config) {
        const configWithDisplayKeys = config;
        materializeDisplayI18nKey(configWithDisplayKeys, 'displayName');
        this.translateConfigItemsDisplayFields(config.options);
        this.translateConfigItemsDisplayFields(config.commonOptions);
        if (Array.isArray(config.customBuildStages)) {
            config.customBuildStages.forEach((stage) => {
                const stageWithDisplayKeys = stage;
                materializeDisplayI18nKey(stageWithDisplayKeys, 'displayName');
                materializeDisplayI18nKey(stageWithDisplayKeys, 'description');
            });
        }
        const buildTemplateConfig = config.buildTemplateConfig;
        if (buildTemplateConfig) {
            materializeDisplayI18nKey(buildTemplateConfig, 'displayName');
        }
    }
    refreshDisplayI18nFields() {
        this.translateConfigItemsDisplayFields(builder_config_1.default.commonOptionConfigs);
        for (const info of this.platformRegisterInfoPool.values()) {
            this.translateConfigDisplayFields(info.config);
        }
        for (const platformConfigs of Object.values(this.configMap)) {
            for (const config of Object.values(platformConfigs)) {
                this.translateConfigDisplayFields(config);
            }
        }
        for (const commonOptions of Object.values(this.commonOptionConfig)) {
            this.translateConfigItemsDisplayFields(commonOptions);
        }
        for (const platformStages of Object.values(this.customBuildStages)) {
            for (const stages of Object.values(platformStages)) {
                stages.forEach((stage) => {
                    const stageWithDisplayKeys = stage;
                    materializeDisplayI18nKey(stageWithDisplayKeys, 'displayName');
                    materializeDisplayI18nKey(stageWithDisplayKeys, 'description');
                });
            }
        }
        for (const template of Object.values(this.buildTemplateConfigMap)) {
            materializeDisplayI18nKey(template, 'displayName');
        }
        for (const [platform, registerInfo] of this.platformRegisterInfoPool.entries()) {
            const platformConfig = this.platformConfig[platform];
            if (!platformConfig) {
                continue;
            }
            const { config } = registerInfo;
            const configWithDisplayKeys = config;
            platformConfig.name = config.displayName;
            platformConfig.nameI18nKey = configWithDisplayKeys.displayNameI18nKey;
            if (config.buildTemplateConfig && config.buildTemplateConfig.templates.length) {
                const label = config.displayName || platform;
                platformConfig.createTemplateLabel = label;
                platformConfig.createTemplateLabelI18nKey = configWithDisplayKeys.displayNameI18nKey;
                this.buildTemplateConfigMap[label] = config.buildTemplateConfig;
            }
        }
    }
    getCommonOptionConfigs(platform) {
        return this.commonOptionConfig[platform];
    }
    getCommonOptionConfigByKey(key, options) {
        const config = this.commonOptionConfig[options.platform] && this.commonOptionConfig[options.platform][key] || {};
        if (builder_config_1.default.commonOptionConfigs[key]) {
            const defaultConfig = JSON.parse(JSON.stringify(builder_config_1.default.commonOptionConfigs[key]));
            lodash_1.default.defaultsDeep(config, defaultConfig);
        }
        if (!config || !config.verifyRules) {
            return null;
        }
        return config;
    }
    getPackageOptionConfigByKey(key, pkgName, options) {
        if (!key || !pkgName) {
            return null;
        }
        const configs = this.pkgOptionConfigs[options.platform][pkgName];
        if (!configs) {
            return null;
        }
        return lodash_1.default.get(configs, key);
    }
    getOptionConfigByKey(key, options) {
        if (!key) {
            return null;
        }
        const keyMatch = key && (key).match(/^options.packages.(([^.]*).*)$/);
        if (!keyMatch || !keyMatch[2]) {
            return this.getCommonOptionConfigByKey(key, options);
        }
        const [, path, pkgName] = keyMatch;
        return this.getPackageOptionConfigByKey(path, pkgName, options);
    }
    hasFixedValue(result) {
        return Object.prototype.hasOwnProperty.call(result, 'fixedValue');
    }
    getFixedValue(result, value) {
        return this.hasFixedValue(result) ? result.fixedValue : value;
    }
    /**
     * 完整校验构建参数（校验平台插件相关的参数校验）
     * @param options
     */
    async checkOptions(options) {
        // 对参数做数据验证
        let checkRes = true;
        if (this.bundleConfigs[options.platform]) {
            const supportedCompressionTypes = this.bundleConfigs[options.platform].supportOptions.compressionType;
            const compressionTypeResult = await (0, common_options_validator_1.checkBundleCompressionSetting)(options.mainBundleCompressionType, supportedCompressionTypes);
            const fixedCompressionType = this.getFixedValue(compressionTypeResult, options.mainBundleCompressionType);
            const isValid = validator_manager_1.validator.checkWithInternalRule('valid', fixedCompressionType);
            if (isValid) {
                lodash_1.default.set(options, 'mainBundleCompressionType', fixedCompressionType);
            }
            // 有报错信息，也有修复值，只发报错不中断，使用新值
            if (!compressionTypeResult.valid && isValid) {
                console.warn(i18n_1.default.t('builder.warn.check_failed_with_new_value', {
                    key: 'mainBundleCompressionType',
                    value: options.mainBundleCompressionType,
                    error: compressionTypeResult.message || '',
                    newValue: JSON.stringify(fixedCompressionType),
                }));
            }
        }
        else {
            console.debug(`Can not find bundle config with platform ${options.platform}`);
        }
        // (校验处已经做了错误数据使用默认值的处理)检验数据通过后做一次数据融合
        const defaultOptions = await this.getOptionsByPlatform(options.platform);
        // lodash 的 defaultsDeep 会对数组也进行深度合并，不符合我们的使用预期，需要自己编写该函数
        const rightOptions = (0, utils_1.defaultsDeep)(JSON.parse(JSON.stringify(options)), defaultOptions);
        // 传递了 buildStageGroup 的选项，不需要做默认值合并
        if ('buildStageGroup' in options) {
            rightOptions.buildStageGroup = options.buildStageGroup;
        }
        await this.completeSupportPlatformOptions(rightOptions);
        // 通用参数的构建校验, 需要使用默认值补全所有的 key
        for (const key of Object.keys(rightOptions)) {
            if (key === 'packages') {
                continue;
            }
            const res = await this.checkCommonOptionByKey(key, rightOptions[key], rightOptions);
            const fixedValue = this.getFixedValue(res, rightOptions[key]);
            if (res && !res.valid && (res.level || 'error') === 'error') {
                const errMsg = res.message || '';
                if (!validator_manager_1.validator.checkWithInternalRule('valid', fixedValue)) {
                    checkRes = false;
                    console.error(i18n_1.default.t('builder.error.check_failed', {
                        key,
                        value: JSON.stringify(rightOptions[key]),
                        error: errMsg,
                    }));
                    // 出现检查错误，直接中断构建
                    return;
                }
                else {
                    // 常规构建如果新的值可用，不中断，只警告
                    console.warn(i18n_1.default.t('builder.warn.check_failed_with_new_value', {
                        key,
                        value: JSON.stringify(rightOptions[key]),
                        error: errMsg,
                        newValue: JSON.stringify(fixedValue),
                    }));
                }
            }
            rightOptions[key] = fixedValue;
        }
        const result = await this.checkPluginOptions(rightOptions);
        if (!result) {
            checkRes = false;
        }
        if (checkRes) {
            return rightOptions;
        }
    }
    getPlatformBuildPluginConfig(platform) {
        return (this.configMap[platform]?.[platform] || this.platformRegisterInfoPool.get(platform)?.config);
    }
    async ensurePlatformRegistered(platform) {
        if (this.checkPlatform(platform)) {
            return;
        }
        if (!this.platformRegisterInfoPool.has(platform)) {
            throw new Error(`Support platform ${platform} is not registered`);
        }
        await this.register(platform);
    }
    /**
     * Complete child platform build options for platforms that support combined builds.
     *
     * When the parent platform enables `supportPlatforms`, this method:
     * - registers and enables configured child platforms;
     * - merges each child platform's own default package options;
     * - synchronizes parent OpenPaaS upload identity fields into child packages
     *   so web upload stages use the same app/version/environment/session.
     */
    async completeSupportPlatformOptions(options) {
        const platform = String(options.platform);
        const config = this.getPlatformBuildPluginConfig(platform);
        const supportPlatforms = config?.supportPlatforms;
        if (!supportPlatforms?.platforms?.length) {
            delete options.subTaskPlatforms;
            delete options.subTaskBuildOutputs;
            delete options.childTaskIds;
            return;
        }
        const enabled = !!lodash_1.default.get(options, ['packages', platform, supportPlatforms.controlledBy]);
        if (!enabled) {
            delete options.subTaskPlatforms;
            delete options.subTaskBuildOutputs;
            delete options.childTaskIds;
            return;
        }
        options.packages = options.packages || {};
        const parentPackageOptions = options.packages[platform] || {};
        options.subTaskPlatforms = [];
        delete options.subTaskBuildOutputs;
        delete options.childTaskIds;
        for (const childPlatform of supportPlatforms.platforms) {
            await this.ensurePlatformRegistered(childPlatform);
            const childDefaultOptions = await this.getOptionsByPlatform(childPlatform);
            const childPackageDefaults = lodash_1.default.get(childDefaultOptions, ['packages', childPlatform], {});
            const childPackageOptions = (0, utils_1.defaultsDeep)((0, utils_1.cloneConfigValue)(options.packages[childPlatform] || {}), (0, utils_1.cloneConfigValue)(childPackageDefaults));
            this.syncParentOptionsToSupportPlatformPackage(parentPackageOptions, childPackageOptions);
            options.packages[childPlatform] = childPackageOptions;
            options.subTaskPlatforms.push(childPlatform);
        }
    }
    /**
     * Copy parent OpenPaaS upload fields to a support-platform package.
     *
     * OpenPaaS and web packages both consume `appid`. `app_id` is accepted as a
     * legacy parent key for compatibility. The remaining fields share the same
     * key names and must stay aligned across parent and child builds for web
     * package upload.
     */
    syncParentOptionsToSupportPlatformPackage(parentPackageOptions, childPackageOptions) {
        for (const { childKey, parentKeys } of SUPPORT_PLATFORM_PARENT_OPTION_MAPPINGS) {
            for (const parentKey of parentKeys) {
                if (Object.prototype.hasOwnProperty.call(parentPackageOptions, parentKey) && parentPackageOptions[parentKey] !== undefined) {
                    childPackageOptions[childKey] = (0, utils_1.cloneConfigValue)(parentPackageOptions[parentKey]);
                    break;
                }
            }
        }
    }
    async checkCommonOptions(options) {
        const checkRes = {};
        for (const key of Object.keys(options)) {
            if (key === 'packages') {
                continue;
            }
            // @ts-ignore
            checkRes[key] = await this.checkCommonOptionByKey(key, options[key], options);
        }
        return checkRes;
    }
    async checkCommonOptionByKey(key, value, options) {
        // 优先使用自定义的校验函数
        const res = await (0, common_options_validator_1.checkBuildCommonOptionsByKey)(key, value, options);
        if (res) {
            return res;
        }
        const config = this.getCommonOptionConfigByKey(key, options);
        if (!config) {
            return {
                valid: true,
            };
        }
        const error = await validator_manager_1.validatorManager.check(value, config.verifyRules, options, this.commonOptionConfig[options.platform] && this.commonOptionConfig[options.platform][key]?.verifyKey || (options.platform + options.platform));
        if (!error) {
            return {
                valid: true,
            };
        }
        const result = {
            valid: false,
            level: config.verifyLevel === 'warn' ? 'warn' : 'error',
            message: translateDisplayValue(error) || error,
        };
        if (!lodash_1.default.isEqual(config.default, value)) {
            result.fixedValue = config.default;
        }
        return result;
    }
    /**
     * 校验构建插件注册的构建参数
     * @param options
     */
    createVerifyOptions(platform, key, value, options) {
        const nextOptions = lodash_1.default.cloneDeep(options || {});
        nextOptions.platform = platform;
        if (!nextOptions.outputName) {
            nextOptions.outputName = platform;
        }
        if (!nextOptions.packages) {
            nextOptions.packages = {};
        }
        if (!nextOptions.packages[platform]) {
            nextOptions.packages[platform] = {};
        }
        const platformOptions = this.configMap[platform]?.[platform]?.options || this.platformRegisterInfoPool.get(platform)?.config?.options;
        if (platformOptions?.[key]) {
            nextOptions.packages[platform][key] = value;
        }
        else {
            nextOptions[key] = value;
        }
        return nextOptions;
    }
    async checkPlatformOptionByKey(platform, key, value, options) {
        const pkgName = platform;
        const buildConfig = this.configMap[platform]?.[pkgName] || this.platformRegisterInfoPool.get(platform)?.config;
        const config = buildConfig?.options?.[key];
        const rules = config?.verifyRules;
        if (!config || !rules) {
            return {
                valid: true,
            };
        }
        const error = await validator_manager_1.validatorManager.check(value, rules, options, platform + pkgName);
        if (!error) {
            return {
                valid: true,
            };
        }
        const result = {
            valid: false,
            level: config.verifyLevel === 'warn' ? 'warn' : 'error',
            message: translateDisplayValue(error) || error,
        };
        if (!lodash_1.default.isEqual(config.default, value)) {
            result.fixedValue = config.default;
        }
        return result;
    }
    async checkBuildOption(platform, key, value, options) {
        const verifyOptions = this.createVerifyOptions(platform, key, value, options);
        const commonOptions = this.commonOptionConfig[platform] || {};
        if (key === 'mainBundleCompressionType') {
            const supportedCompressionTypes = this.bundleConfigs[platform]?.supportOptions?.compressionType;
            if (supportedCompressionTypes) {
                const compressionTypeResult = (0, common_options_validator_1.checkBundleCompressionSetting)(value, supportedCompressionTypes);
                if (!compressionTypeResult.valid) {
                    return compressionTypeResult;
                }
            }
        }
        if (builder_config_1.default.commonOptionConfigs[key] || commonOptions[key]) {
            return this.checkCommonOptionByKey(key, value, verifyOptions);
        }
        return this.checkPlatformOptionByKey(platform, key, value, verifyOptions);
    }
    async checkBuildOptions(platform, options) {
        const result = {};
        const schema = this.collectPlatformConfigItems(platform);
        const verifyOptions = lodash_1.default.cloneDeep(options || {});
        verifyOptions.platform = platform;
        for (const key of Object.keys(schema.common)) {
            result[key] = await this.checkBuildOption(platform, key, verifyOptions[key], verifyOptions);
        }
        for (const key of Object.keys(schema.platformOptions)) {
            result[key] = await this.checkBuildOption(platform, key, lodash_1.default.get(verifyOptions, ['packages', platform, key]), verifyOptions);
        }
        return result;
    }
    async checkPluginOptions(options) {
        if (typeof options.packages !== 'object') {
            return false;
        }
        let checkRes = true;
        for (const pkgName of Object.keys(options.packages)) {
            const packageOptions = options.packages[pkgName];
            if (!packageOptions) {
                continue;
            }
            const buildConfig = exports.pluginManager.configMap[options.platform][pkgName];
            if (!buildConfig || !buildConfig.options) {
                continue;
            }
            for (const key of Object.keys(packageOptions)) {
                if (!buildConfig.options[key] || !buildConfig.options[key].verifyRules) {
                    continue;
                }
                // @ts-ignore
                const value = packageOptions[key];
                const error = await validator_manager_1.validatorManager.check(value, buildConfig.options[key].verifyRules, options, exports.pluginManager.commonOptionConfig[options.platform]?.[key]?.verifyKey || (options.platform + pkgName));
                if (!error) {
                    continue;
                }
                let useDefault = validator_manager_1.validator.checkWithInternalRule('valid', buildConfig.options[key].default);
                // 有默认值也需要再走一遍校验
                if (useDefault) {
                    useDefault = !(await validator_manager_1.validatorManager.check(buildConfig.options[key].default, buildConfig.options[key].verifyRules, options, exports.pluginManager.commonOptionConfig[options.platform]?.[key]?.verifyKey || (options.platform + pkgName)));
                }
                const verifyLevel = buildConfig.options[key].verifyLevel || 'error';
                const errMsg = (typeof error === 'string' && i18n_1.default.transI18nName(error)) || error;
                if (!useDefault && verifyLevel === 'error') {
                    console.error(i18n_1.default.t('builder.error.check_failed', {
                        key: `options.packages.${pkgName}.${key}`,
                        value: JSON.stringify(value),
                        error: errMsg,
                    }));
                    checkRes = false;
                    continue;
                }
                else {
                    const consoleType = (verifyLevel !== 'error' && console_1.newConsole[verifyLevel]) ? verifyLevel : 'warn';
                    // 有报错信息，但有默认值，报错后填充默认值
                    console_1.newConsole[consoleType](i18n_1.default.t('builder.warn.check_failed_with_new_value', {
                        key: `options.packages.${pkgName}.${key}`,
                        value: JSON.stringify(value),
                        error: errMsg,
                        newValue: JSON.stringify(buildConfig.options[key].default),
                    }));
                    lodash_1.default.set(packageOptions, key, buildConfig.options[key].default);
                }
            }
        }
        return checkRes;
    }
    shouldGenerateOptions(platform) {
        const customBuildStageMap = this.customBuildStages[platform];
        return !!Object.values(customBuildStageMap).find((stages) => stages.find((stageItem => stageItem.requiredBuildOptions !== false)));
    }
    /**
     * 获取平台默认值
     * @param platform
     */
    async getOptionsByPlatform(platform) {
        const options = (0, utils_1.cloneConfigValue)(await builder_config_1.default.getProject(`platforms.${platform}`));
        const commonOptions = (0, utils_1.cloneConfigValue)(await builder_config_1.default.getProject(`common`));
        commonOptions.platform = platform;
        commonOptions.outputName = platform;
        return Object.assign({}, commonOptions, options);
    }
    getTexturePlatformConfigs() {
        const result = {};
        Object.keys(this.platformConfig).forEach((platform) => {
            result[platform] = {
                name: translateDisplayValue(this.platformConfig[platform].name || platform) || platform,
                textureCompressConfig: this.platformConfig[platform].texture,
            };
        });
        return result;
    }
    cloneDisplayOptions(options) {
        return lodash_1.default.cloneDeep(options || {});
    }
    cloneConfigItem(config) {
        const item = lodash_1.default.cloneDeep(config);
        delete item.verifyKey;
        return item;
    }
    applySupportedCompressionTypes(platform, common) {
        const supportedCompressionTypes = this.bundleConfigs[platform]?.supportOptions?.compressionType;
        if (!supportedCompressionTypes || !common.mainBundleCompressionType) {
            return;
        }
        Object.assign(common.mainBundleCompressionType, {
            type: 'enum',
            items: supportedCompressionTypes.map((value) => ({
                label: translateDisplayValue(bundle_utils_1.BundlecompressionTypeMap[value]) || value,
                labelI18nKey: bundle_utils_1.BundlecompressionTypeMap[value],
                value,
            })),
        });
    }
    /**
     * 装配某平台的原始配置项(IBuilderConfigItem):
     *   common = CLI 内置 common 项 + 该平台 commonOptions 覆盖(已应用支持的压缩类型);
     *   platformOptions = 平台 config.options。
     * key 顺序即显示顺序。供构建面板 schema(getPlatformBuildSchema)与配置校验(checkBuildOptions)共用。
     */
    collectPlatformConfigItems(platform) {
        const common = {};
        const platformCommonOptions = this.commonOptionConfig[platform] || {};
        for (const key of Object.keys(builder_config_1.default.commonOptionConfigs)) {
            common[key] = this.cloneConfigItem(platformCommonOptions[key] || builder_config_1.default.commonOptionConfigs[key]);
        }
        for (const key of Object.keys(platformCommonOptions)) {
            if (!common[key]) {
                common[key] = this.cloneConfigItem(platformCommonOptions[key]);
            }
        }
        // 应用支持的压缩类型
        this.applySupportedCompressionTypes(platform, common);
        const config = (this.configMap[platform]?.[platform] || this.platformRegisterInfoPool.get(platform)?.config);
        return {
            common,
            platformOptions: this.cloneDisplayOptions(config?.options),
            supportPlatforms: lodash_1.default.cloneDeep(config?.supportPlatforms),
        };
    }
    getPlatformBuildSchema(platform) {
        if (!this.platformConfig[platform]) {
            throw new Error(`Can not find platform config for ${platform}`);
        }
        const { common, platformOptions, supportPlatforms } = this.collectPlatformConfigItems(platform);
        return {
            common: (0, metadata_1.createBuilderRenderSchema)(common, String(platform)),
            platformOptions: (0, metadata_1.createBuilderRenderSchema)(platformOptions, String(platform)),
            supportPlatforms,
        };
    }
    queryPlatformConfig() {
        // HACK(临时): fb-instant-games / google-play 暂不对外,在平台查询的总出口处过滤掉。
        //   PinK 构建面板(走 pluginManager.queryPlatformConfig)、core/lib 接口等所有消费方都经此方法,
        //   统一隐藏。待平台就绪后移除此过滤。
        // const HIDDEN_PLATFORMS = new Set(['fb-instant-games', 'google-play']);
        return Object.entries(this.platformConfig)
            // .filter(([platform]) => !HIDDEN_PLATFORMS.has(platform))
            .map(([platform, config]) => {
            const customStages = this.customBuildStages[platform];
            const stageConfigs = customStages
                ? this.sortPkgNameWidthPriority(Object.keys(customStages))
                    .flatMap((pkgName) => customStages[pkgName] || [])
                    .map((stage) => lodash_1.default.cloneDeep(stage))
                : undefined;
            return {
                platform,
                displayName: translateDisplayValue(config.name || platform) || platform,
                platformType: config.platformType,
                isNative: platforms_options_1.NATIVE_PLATFORM.includes(platform),
                doc: config.doc,
                // 打包平台路径
                pluginPath: config.pluginPath || this.platformRegisterInfoPool.get(platform)?.path || '',
                createTemplateLabel: config.createTemplateLabel && translateDisplayValue(config.createTemplateLabel),
                supportTextureCompress: !!config.texture,
                customBuildStages: stageConfigs?.length ? stageConfigs : undefined,
            };
        });
    }
    getRegisteredPlatforms() {
        return Object.keys(this.platformConfig);
    }
    /**
     * 查询所有平台的 Bundle 配置，按平台类型分组
     */
    queryBundleConfig() {
        const result = {};
        for (const [platform, bundleConfig] of Object.entries(this.bundleConfigs)) {
            const platformType = bundleConfig.platformType;
            if (!result[platformType]) {
                const typeInfo = bundle_utils_1.BundlePlatformTypes[platformType];
                result[platformType] = {
                    displayName: typeInfo ? i18n_1.default.transI18nName(typeInfo.displayName) : platformType,
                    platformConfigs: {},
                };
            }
            const platformConfig = this.platformConfig[platform];
            const platformName = translateDisplayValue(platformConfig?.name || platform) || platform;
            result[platformType].platformConfigs[platform] = {
                platformName,
                platformType: bundleConfig.platformType,
                supportOptions: bundleConfig.supportOptions,
            };
        }
        return result;
    }
    /**
     * 查询所有平台的纹理压缩配置，按纹理压缩平台类型分组
     */
    queryTextureCompressConfig() {
        const platformRenderConfigs = {};
        for (const [platform, config] of Object.entries(this.platformConfig)) {
            if (!config.texture) {
                continue;
            }
            const platformType = config.texture.platformType;
            if (!platformRenderConfigs[platformType]) {
                const groupInfo = texture_compress_1.configGroups[platformType];
                platformRenderConfigs[platformType] = {
                    displayName: groupInfo ? translateDisplayValue(groupInfo.displayName) || groupInfo.displayName : platformType,
                    platformConfigs: {},
                };
            }
            const platformName = translateDisplayValue(config.name || platform) || platform;
            platformRenderConfigs[platformType].platformConfigs[platform] = {
                platformName,
                platformType: config.texture.platformType,
                support: config.texture.support,
            };
        }
        return {
            configGroups: texture_compress_1.configGroups,
            textureFormatConfigs: texture_compress_1.textureFormatConfigs,
            formatsInfo: texture_compress_1.formatsInfo,
            defaultSupport: texture_compress_1.defaultSupport,
            platformRenderConfigs,
        };
    }
    /**
     * 获取带有钩子函数的构建阶段任务
     * @param platform
     * @returns
     */
    getBuildStageWithHookTasks(platform, taskName) {
        const customStages = this.customBuildStages[platform];
        if (!customStages) {
            return null;
        }
        const pkgNameOrder = this.sortPkgNameWidthPriority(Object.keys(customStages));
        for (const pkgName of pkgNameOrder) {
            const stage = customStages[pkgName].find((item) => item.hook === taskName);
            if (stage) {
                return stage;
            }
        }
        return null;
    }
    /**
     * 查询某个平台的阶段性任务按钮配置信息
     * @param platform
     */
    getBuildStageConfigByPlatform(platform) {
        if (!this.customBuildStages[platform]) {
            return null;
        }
        const result = {};
        if (this.customBuildStages[platform]) {
            result.buttons = [];
            const pkgNames = Object.keys(this.customBuildStages[platform]);
            if (pkgNames.length) {
                pkgNames.sort((a, b) => this.pkgPriorities[b] - this.pkgPriorities[a]);
                pkgNames.forEach((pkgName) => {
                    const buttons = this.customBuildStages[platform][pkgName]
                        .filter((config) => !config.hidden)
                        .map((config) => lodash_1.default.cloneDeep(config));
                    result.buttons.push(...buttons);
                });
            }
        }
        return result;
    }
    /**
     * 根据插件权重传参的插件数组
     * @param pkgNames
     * @returns
     */
    sortPkgNameWidthPriority(pkgNames) {
        return pkgNames.sort((a, b) => {
            // 平台构建插件的顺序始终在外部注册的任意插件之上
            if (!platforms_options_1.PLATFORMS.includes(a) && platforms_options_1.PLATFORMS.includes(b)) {
                return 1;
            }
            else if (platforms_options_1.PLATFORMS.includes(a) && !platforms_options_1.PLATFORMS.includes(b)) {
                return -1;
            }
            return this.pkgPriorities[b] - this.pkgPriorities[a];
        });
    }
    /**
     * 获取平台插件的构建路径信息
     * @param platform
     */
    getHooksInfo(platform) {
        // 为了保障插件的先后注册顺序，采用了数组的方式传递
        const result = {
            pkgNameOrder: [],
            infos: {},
        };
        Object.keys(this.builderPathsMap[platform]).forEach((pkgName) => {
            result.infos[pkgName] = {
                path: this.builderPathsMap[platform][pkgName],
                internal: pkgName === platform,
            };
        });
        result.pkgNameOrder = this.sortPkgNameWidthPriority(Object.keys(result.infos));
        return result;
    }
    getBuildTemplateConfig(platform) {
        const config = this.buildTemplateConfigMap[this.platformConfig[platform].createTemplateLabel];
        if (!config) {
            return config;
        }
        return lodash_1.default.cloneDeep(config);
    }
    /**
     * 根据类型获取对应的执行方法
     * @param type
     * @returns
     */
    async createBuildTemplate(nameOrPlatform) {
        const platformConfig = this.platformConfig[nameOrPlatform];
        if (platformConfig) {
            const createTemplateLabel = platformConfig.createTemplateLabel;
            if (!createTemplateLabel) {
                throw new Error(`no build template for ${nameOrPlatform}`);
            }
            nameOrPlatform = createTemplateLabel;
        }
        const templateConfig = this.buildTemplateConfigMap[nameOrPlatform];
        if (!templateConfig) {
            throw new Error(`no build template for ${nameOrPlatform}`);
        }
        const buildTemplateDir = builder_config_1.default.buildTemplateDir;
        const versionKey = templateConfig.pkgName || nameOrPlatform;
        const target = (0, path_1.join)(buildTemplateDir, templateConfig.dirname || versionKey);
        await Promise.all(templateConfig.templates.map(async (info) => (0, fs_extra_1.copy)(info.path, (0, path_1.join)(target, info.destUrl))));
        const templateVersionPath = (0, path_1.join)(buildTemplateDir, 'templates-version.json');
        let contents = {
            [versionKey]: templateConfig.version,
        };
        if ((0, fs_1.existsSync)(templateVersionPath)) {
            const versions = await (0, fs_extra_1.readJSON)(templateVersionPath);
            if (versions[versionKey] === templateConfig.version) {
                console.log(`${versionKey} ${i18n_1.default.t('builder.tips.create_template_success')}({link(${target})})`);
                return;
            }
            contents = Object.assign({}, versions, contents);
        }
        await (0, fs_extra_1.outputJSON)(templateVersionPath, contents, {
            spaces: 4,
        });
        console.log(`${versionKey} ${i18n_1.default.t('builder.tips.create_template_success')}({link(${target})})`);
    }
    getAssetHandlers(type) {
        const pkgNames = Object.keys(this.assetHandlers[type]);
        return {
            pkgNameOrder: this.sortPkgNameWidthPriority(pkgNames),
            handles: this.assetHandlers[type],
        };
    }
}
exports.PluginManager = PluginManager;
exports.pluginManager = new PluginManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci9tYW5hZ2VyL3BsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBa0M7QUFDbEMsK0JBQXNDO0FBQ3RDLGdGQUFnSDtBQUNoSCxrRUFBd0U7QUFDeEUsa0VBQXlFO0FBQ3pFLDBDQUFtSTtBQUduSSw2REFBcUM7QUFDckMsMkRBQW1DO0FBQ25DLG9EQUE0QjtBQUM1QixnRUFBNEc7QUFDNUcsd0RBQXNGO0FBQ3RGLGdEQUFnRDtBQUNoRCw2RUFBb0Q7QUFDcEQsZ0RBQWtHO0FBQ2xHLHVEQUE0RDtBQUU1RCw0Q0FBOEM7QUFDOUMsMkJBQTZDO0FBQzdDLDZEQUFxQztBQUNyQyx1Q0FBb0U7QUFhcEUscUJBQXFCO0FBQ3JCLE1BQU0sdUJBQXVCLEdBQThCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNoRixNQUFNLHVDQUF1QyxHQUFHLENBQUM7UUFDN0MsUUFBUSxFQUFFLE9BQU87UUFDakIsVUFBVSxFQUFFLENBQUMsT0FBTyxDQUFDO0tBQ3hCLEVBQUU7UUFDQyxRQUFRLEVBQUUsYUFBYTtRQUN2QixVQUFVLEVBQUUsQ0FBQyxhQUFhLENBQUM7S0FDOUIsRUFBRTtRQUNDLFFBQVEsRUFBRSxXQUFXO1FBQ3JCLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztLQUM1QixFQUFFO1FBQ0MsUUFBUSxFQUFFLGFBQWE7UUFDdkIsVUFBVSxFQUFFLENBQUMsYUFBYSxDQUFDO0tBQzlCLEVBQUU7UUFDQyxRQUFRLEVBQUUsYUFBYTtRQUN2QixVQUFVLEVBQUUsQ0FBQyxhQUFhLENBQUM7S0FDOUIsQ0FBQyxDQUFDO0FBS0gsU0FBUyxxQkFBcUIsQ0FBQyxLQUFjO0lBQ3pDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDNUIsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUNELE9BQU8sY0FB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S0FBSyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxVQUFVLElBQUksY0FBSSxDQUFDLENBQUMsQ0FBQyxzQ0FBc0MsQ0FBQyxVQUFVLE1BQU0sS0FBSyxDQUFDLENBQUM7Z0JBQ2xHLE9BQU87WUFDWCxDQUFDO1lBQ0QsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRUQsTUFBTSxJQUFBLHFCQUFVLEVBQUMsbUJBQW1CLEVBQUUsUUFBUSxFQUFFO1lBQzVDLE1BQU0sRUFBRSxDQUFDO1NBQ1osQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsSUFBSSxjQUFJLENBQUMsQ0FBQyxDQUFDLHNDQUFzQyxDQUFDLFVBQVUsTUFBTSxLQUFLLENBQUMsQ0FBQztJQUN0RyxDQUFDO0lBRU0sZ0JBQWdCLENBQUMsSUFBNkI7UUFDakQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdkQsT0FBTztZQUNILFlBQVksRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDO1lBQ3JELE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQztTQUNwQyxDQUFDO0lBQ04sQ0FBQztDQUNKO0FBMWxDRCxzQ0EwbENDO0FBRVksUUFBQSxhQUFhLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IGJhc2VuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjaGVja0J1aWxkQ29tbW9uT3B0aW9uc0J5S2V5LCBjaGVja0J1bmRsZUNvbXByZXNzaW9uU2V0dGluZyB9IGZyb20gJy4uL3NoYXJlL2NvbW1vbi1vcHRpb25zLXZhbGlkYXRvcic7XG5pbXBvcnQgeyBOQVRJVkVfUExBVEZPUk0sIFBMQVRGT1JNUyB9IGZyb20gJy4uL3NoYXJlL3BsYXRmb3Jtcy1vcHRpb25zJztcbmltcG9ydCB7IHZhbGlkYXRvciwgdmFsaWRhdG9yTWFuYWdlciB9IGZyb20gJy4uL3NoYXJlL3ZhbGlkYXRvci1tYW5hZ2VyJztcbmltcG9ydCB7IGNoZWNrQ29uZmlnRGVmYXVsdCwgY2xvbmVDb25maWdWYWx1ZSwgZGVmYXVsdE1lcmdlLCBkZWZhdWx0c0RlZXAsIGdldE9wdGlvbnNEZWZhdWx0LCByZXNvbHZlVG9SYXcgfSBmcm9tICcuLi9zaGFyZS91dGlscyc7XG5pbXBvcnQgeyBQbGF0Zm9ybSwgSURpc3BsYXlPcHRpb25zLCBJQnVpbGRUYXNrT3B0aW9uLCBJQ29uc29sZVR5cGUsIFRleHR1cmVDb21wcmVzc1JlbmRlckNvbmZpZywgVGV4dHVyZUNvbXByZXNzRnVsbFJlbmRlckNvbmZpZyB9IGZyb20gJy4uL0B0eXBlcyc7XG5pbXBvcnQgeyBJSW50ZXJuYWxCdWlsZFBsdWdpbkNvbmZpZywgSVBsYXRmb3JtQnVpbGRQbHVnaW5Db25maWcsIFBsYXRmb3JtQnVuZGxlQ29uZmlnLCBCdW5kbGVRdWVyeUNvbmZpZywgSUJ1aWxkU3RhZ2VJdGVtLCBCdWlsZENoZWNrUmVzdWx0LCBCdWlsZFRlbXBsYXRlQ29uZmlnLCBJQ29uZmlnR3JvdXBzSW5mbywgSVBsYXRmb3JtQ29uZmlnLCBJVGV4dHVyZUNvbXByZXNzQ29uZmlnLCBJQnVpbGRIb29rc0luZm8sIElCdWlsZENvbW1hbmRPcHRpb24sIE1ha2VSZXF1aXJlZCwgSUJ1aWxkZXJDb25maWdJdGVtLCBJUGxhdGZvcm1SZWdpc3RlckluZm8sIElQbHVnaW5SZWdpc3RlckluZm8sIElQYWNrYWdlUmVnaXN0ZXJJbmZvLCBJQnVpbGRlclJlZ2lzdGVySW5mbywgUGxhdGZvcm1CdWlsZFNjaGVtYSwgUGxhdGZvcm1Db25maWdJdGVtIH0gZnJvbSAnLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vYmFzZS91dGlscyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IGxvZGFzaCBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgY29uZmlnR3JvdXBzLCB0ZXh0dXJlRm9ybWF0Q29uZmlncywgZm9ybWF0c0luZm8sIGRlZmF1bHRTdXBwb3J0IH0gZnJvbSAnLi4vc2hhcmUvdGV4dHVyZS1jb21wcmVzcyc7XG5pbXBvcnQgeyBCdW5kbGVjb21wcmVzc2lvblR5cGVNYXAsIEJ1bmRsZVBsYXRmb3JtVHlwZXMgfSBmcm9tICcuLi9zaGFyZS9idW5kbGUtdXRpbHMnO1xuaW1wb3J0IHsgbmV3Q29uc29sZSB9IGZyb20gJy4uLy4uL2Jhc2UvY29uc29sZSc7XG5pbXBvcnQgYnVpbGRlckNvbmZpZyBmcm9tICcuLi9zaGFyZS9idWlsZGVyLWNvbmZpZyc7XG5pbXBvcnQgeyBjcmVhdGVCdWlsZGVyUGxhdGZvcm1NZXRhZGF0YU5vZGVzLCBjcmVhdGVCdWlsZGVyUmVuZGVyU2NoZW1hIH0gZnJvbSAnLi4vc2hhcmUvbWV0YWRhdGEnO1xuaW1wb3J0IHsgY29uZmlndXJhdGlvblJlZ2lzdHJ5IH0gZnJvbSAnLi4vLi4vY29uZmlndXJhdGlvbic7XG5pbXBvcnQgdHlwZSB7IElDb2Nvc0NvbmZpZ3VyYXRpb25Qcm9wZXJ0eVNjaGVtYSB9IGZyb20gJy4uLy4uL2NvbmZpZ3VyYXRpb24vc2NyaXB0L21ldGFkYXRhJztcbmltcG9ydCB7IEdsb2JhbFBhdGhzIH0gZnJvbSAnLi4vLi4vLi4vZ2xvYmFsJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRkaXJTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHV0aWxzIGZyb20gJy4uLy4uL2Jhc2UvdXRpbHMnO1xuaW1wb3J0IHsgY29weSwgb3V0cHV0SlNPTiwgcmVhZEpTT04sIHJlYWRKU09OU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbFBhY2thZ2VJbmZvIHtcbiAgICBuYW1lOiBzdHJpbmc7IC8vIOaPkuS7tuWQjVxuICAgIHBhdGg6IHN0cmluZzsgLy8g5o+S5Lu26Lev5b6EXG4gICAgYnVpbGRQYXRoOiBzdHJpbmc7IC8vIOazqOWGjOWIsOaehOW7uueahOWFpeWPo1xuICAgIGRvYz86IHN0cmluZzsgLy8g5o+S5Lu25rOo5YaM5Yiw5p6E5bu66Z2i5p2/5LiK77yM5pi+56S655qE5paH5qGj5YWl5Y+jXG4gICAgZGlzcGxheU5hbWU/OiBzdHJpbmc7IC8vIOaPkuS7tueahOaYvuekuuWQjeensFxuICAgIHZlcnNpb246IHN0cmluZzsgLy8g54mI5pys5Y+3XG59XG5cbnR5cGUgSUN1c3RvbUFzc2V0SGFuZGxlclR5cGUgPSAnY29tcHJlc3NUZXh0dXJlcyc7XG50eXBlIElBc3NldEhhbmRsZXJzID0gUmVjb3JkPElDdXN0b21Bc3NldEhhbmRsZXJUeXBlLCBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3duPj47XG4vLyDlr7nlpJbmlK/mjIHnmoTlr7nlpJblhazlvIDnmoTotYTmupDlpITnkIbmlrnms5XmsYfmgLtcbmNvbnN0IEN1c3RvbUFzc2V0SGFuZGxlclR5cGVzOiBJQ3VzdG9tQXNzZXRIYW5kbGVyVHlwZVtdID0gWydjb21wcmVzc1RleHR1cmVzJ107XG5jb25zdCBTVVBQT1JUX1BMQVRGT1JNX1BBUkVOVF9PUFRJT05fTUFQUElOR1MgPSBbe1xuICAgIGNoaWxkS2V5OiAnYXBwaWQnLFxuICAgIHBhcmVudEtleXM6IFsnYXBwaWQnXSxcbn0sIHtcbiAgICBjaGlsZEtleTogJ3ZlcnNpb25OYW1lJyxcbiAgICBwYXJlbnRLZXlzOiBbJ3ZlcnNpb25OYW1lJ10sXG59LCB7XG4gICAgY2hpbGRLZXk6ICd1cGxvYWRFbnYnLFxuICAgIHBhcmVudEtleXM6IFsndXBsb2FkRW52J10sXG59LCB7XG4gICAgY2hpbGRLZXk6ICdhY2Nlc3NUb2tlbicsXG4gICAgcGFyZW50S2V5czogWydhY2Nlc3NUb2tlbiddLFxufSwge1xuICAgIGNoaWxkS2V5OiAnY29kZVZlcnNpb24nLFxuICAgIHBhcmVudEtleXM6IFsnY29kZVZlcnNpb24nXSxcbn1dO1xuXG50eXBlIERpc3BsYXlWYWx1ZUZpZWxkID0gJ2Rpc3BsYXlOYW1lJyB8ICdsYWJlbCcgfCAnZGVzY3JpcHRpb24nO1xudHlwZSBJMThuRGlzcGxheVJlY29yZCA9IFJlY29yZDxzdHJpbmcsIGFueT47XG5cbmZ1bmN0aW9uIHRyYW5zbGF0ZURpc3BsYXlWYWx1ZSh2YWx1ZT86IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gaTE4bi50cmFuc0kxOG5OYW1lKHZhbHVlKSB8fCB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gbWF0ZXJpYWxpemVEaXNwbGF5STE4bktleSh0YXJnZXQ6IEkxOG5EaXNwbGF5UmVjb3JkIHwgdW5kZWZpbmVkLCBrZXk6IERpc3BsYXlWYWx1ZUZpZWxkKSB7XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBrZXlGaWVsZCA9IGAke2tleX1JMThuS2V5YDtcbiAgICBjb25zdCByYXdWYWx1ZSA9IHR5cGVvZiB0YXJnZXRba2V5RmllbGRdID09PSAnc3RyaW5nJyA/IHRhcmdldFtrZXlGaWVsZF0gOiB0YXJnZXRba2V5XTtcbiAgICBpZiAodHlwZW9mIHJhd1ZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyYXdWYWx1ZS5zdGFydHNXaXRoKCdpMThuOicpKSB7XG4gICAgICAgIHRhcmdldFtrZXlGaWVsZF0gPSByYXdWYWx1ZTtcbiAgICB9XG4gICAgdGFyZ2V0W2tleV0gPSB0cmFuc2xhdGVEaXNwbGF5VmFsdWUocmF3VmFsdWUpO1xufVxuXG5jb25zdCBwbHVnaW5Sb290cyA9IFtcbiAgICBqb2luKF9fZGlybmFtZSwgJy4uL3BsYXRmb3JtcycpLFxuICAgIGpvaW4oR2xvYmFsUGF0aHMud29ya3NwYWNlLCAncGFja2FnZXMvcGxhdGZvcm1zJyksXG5dO1xuXG5mdW5jdGlvbiBnZXRSZWdpc3RlckluZm8ocm9vdDogc3RyaW5nLCBkaXJOYW1lOiBzdHJpbmcpIDogSVBsYXRmb3JtUmVnaXN0ZXJJbmZvIHwgbnVsbCB7XG4gICAgY29uc3QgcGFja2FnZUpTT05QYXRoID0gam9pbihyb290LCAncGFja2FnZS5qc29uJyk7XG4gICAgaWYgKGV4aXN0c1N5bmMocGFja2FnZUpTT05QYXRoKSkge1xuICAgICAgICBjb25zdCBwYWNrYWdlSlNPTiA9IHJlcXVpcmUocGFja2FnZUpTT05QYXRoKTtcbiAgICAgICAgY29uc3QgYnVpbGRlcjogSVBhY2thZ2VSZWdpc3RlckluZm8gPSBwYWNrYWdlSlNPTi5jb250cmlidXRlcy5idWlsZGVyO1xuICAgICAgICBpZiAoIWJ1aWxkZXIucmVnaXN0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwbGF0Zm9ybTogYnVpbGRlci5wbGF0Zm9ybSxcbiAgICAgICAgICAgIGhvb2tzOiBidWlsZGVyLmhvb2tzID8gam9pbihyb290LCBidWlsZGVyLmhvb2tzKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGNvbmZpZzogcmVxdWlyZShqb2luKHJvb3QsIGJ1aWxkZXIuY29uZmlnKSkuZGVmYXVsdCxcbiAgICAgICAgICAgIHBhdGg6IHJvb3QsXG4gICAgICAgICAgICBjb25pZmdQYXRoOiBqb2luKHJvb3QsIGJ1aWxkZXIuY29uZmlnKSxcbiAgICAgICAgICAgIHR5cGU6ICdyZWdpc3RlcicsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHV0aWxzLlBhdGguY29udGFpbnMoR2xvYmFsUGF0aHMud29ya3NwYWNlLCByb290KSkge1xuICAgICAgICBpZiAoUExBVEZPUk1TLmluY2x1ZGVzKGRpck5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtOiBiYXNlbmFtZShyb290KSxcbiAgICAgICAgICAgICAgICBwYXRoOiByb290LFxuICAgICAgICAgICAgICAgIGNvbmZpZzogcmVxdWlyZShqb2luKHJvb3QsICdjb25maWcnKSkuZGVmYXVsdCxcbiAgICAgICAgICAgICAgICBob29rczogam9pbihyb290LCAnaG9va3MnKSxcbiAgICAgICAgICAgICAgICBjb25pZmdQYXRoOiBqb2luKHJvb3QsICdjb25maWcnKSxcbiAgICAgICAgICAgICAgICB0eXBlOiAncmVnaXN0ZXInLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbiBub3QgZmluZCBwYWNrYWdlLmpzb24gaW4gcm9vdDogJHtyb290fWApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzY2FuUGx1Z2luUm9vdChyb290OiBzdHJpbmcpOiBQcm9taXNlPElQbGF0Zm9ybVJlZ2lzdGVySW5mb1tdPntcbiAgICBjb25zdCBkaXJOYW1lcyA9IHJlYWRkaXJTeW5jKHJvb3QpO1xuICAgIGNvbnN0IHJlczogSVBsYXRmb3JtUmVnaXN0ZXJJbmZvW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGRpck5hbWUgb2YgZGlyTmFtZXMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlZ2lzdGVySW5mbyA9IGF3YWl0IGdldFJlZ2lzdGVySW5mbyhqb2luKHJvb3QsIGRpck5hbWUpLCBkaXJOYW1lKTtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLWV4cHJlc3Npb25zXG4gICAgICAgICAgICByZWdpc3RlckluZm8gJiYgcmVzLnB1c2gocmVnaXN0ZXJJbmZvKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgUmVnaXN0ZXIgcGxhdGZvcm0gcGFja2FnZSBmYWlsZWQgaW4gcm9vdDogJHtyb290fWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5NYW5hZ2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICAvLyDlubPlj7DpgInpobnkv6Hmga9cbiAgICBwdWJsaWMgYnVuZGxlQ29uZmlnczogUmVjb3JkPHN0cmluZywgUGxhdGZvcm1CdW5kbGVDb25maWc+ID0ge307XG4gICAgcHVibGljIGNvbW1vbk9wdGlvbkNvbmZpZzogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgSUJ1aWxkZXJDb25maWdJdGVtICAmIHsgdmVyaWZ5S2V5OiBzdHJpbmcgfT4+ID0ge307XG4gICAgcHVibGljIHBrZ09wdGlvbkNvbmZpZ3M6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIElEaXNwbGF5T3B0aW9ucz4+ID0ge307XG4gICAgcHVibGljIHBsYXRmb3JtQ29uZmlnOiBSZWNvcmQ8c3RyaW5nLCBJUGxhdGZvcm1Db25maWc+ID0ge307XG4gICAgcHVibGljIGJ1aWxkVGVtcGxhdGVDb25maWdNYXA6IFJlY29yZDxzdHJpbmcsIEJ1aWxkVGVtcGxhdGVDb25maWc+ID0ge307XG4gICAgcHVibGljIGNvbmZpZ01hcDogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgSUludGVybmFsQnVpbGRQbHVnaW5Db25maWc+PjsgLy8g5a2Y5YKo5rOo5YWl6L+b5p2l55qEIGNvbmZpZ1xuICAgIC8vIOWtmOWCqOazqOWGjOi/m+adpeeahO+8jOW4puaciSBob29rcyDnmoTmj5Lku7bot6/lvoTvvIxbcGtnTmFtZV1bcGxhdGZvcm1dOiBob29rc1xuICAgIHByaXZhdGUgYnVpbGRlclBhdGhzTWFwOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PiA9IHt9O1xuICAgIHByaXZhdGUgY3VzdG9tQnVpbGRTdGFnZXNNYXA6IHtcbiAgICAgICAgW3BrZ05hbWU6IHN0cmluZ106IHtcbiAgICAgICAgICAgIFtwbGF0Zm9ybTogc3RyaW5nXTogSUJ1aWxkU3RhZ2VJdGVtW107XG4gICAgICAgIH07XG4gICAgfSA9IHt9O1xuICAgIHByb3RlY3RlZCBjdXN0b21CdWlsZFN0YWdlczogUmVjb3JkPHN0cmluZywge1xuICAgICAgICBbcGtnTmFtZTogc3RyaW5nXTogSUJ1aWxkU3RhZ2VJdGVtW107XG4gICAgfT47XG5cbiAgICAvLyDlrZjlgqjms6jlhozov5vmnaXnmoTvvIzluKbmnIkgYXNzZXRIYW5kbGVycyDphY3nva7nmoTkuIDkupvmlrnms5UgW0lDdXN0b21Bc3NldEhhbmRsZXJUeXBlXVtwa2dOYW1lXTogRnVuY3Rpb25cbiAgICBwcml2YXRlIGFzc2V0SGFuZGxlcnMgPSB7fSBhcyBJQXNzZXRIYW5kbGVycztcbiAgICAvLyDlrZjlgqjmj5Lku7bkvJjlhYjnuqfvvIhUT0RPIOebruWJjeS8mOWFiOe6p+iusOW9leWcqCBjb25maWcg5YaF77yM6ZKI5a+55LiN5ZCM5bmz5Y+w5Y+v6IO95pyJ5LiN5ZCM55qE5LyY5YWI57qn77yJXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IHBrZ1ByaW9yaXRpZXM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcblxuICAgIC8vIOiusOW9leW3suazqOWGjOeahOaPkuS7tuWQjeensFxuICAgIHB1YmxpYyBwYWNrYWdlUmVnaXN0ZXJJbmZvOiBNYXA8c3RyaW5nLCBJbnRlcm5hbFBhY2thZ2VJbmZvPiA9IG5ldyBNYXAoKTtcblxuICAgIHByaXZhdGUgcGxhdGZvcm1SZWdpc3RlckluZm9Qb29sOiBNYXA8c3RyaW5nLCBJUGxhdGZvcm1SZWdpc3RlckluZm8+ID0gbmV3IE1hcCgpO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGNvbnN0IGNvbXBzTWFwOiBhbnkgPSB7fTtcbiAgICAgICAgdGhpcy5wa2dPcHRpb25Db25maWdzID0gY29tcHNNYXA7XG4gICAgICAgIHRoaXMuY29uZmlnTWFwID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb21wc01hcCkpO1xuICAgICAgICB0aGlzLmN1c3RvbUJ1aWxkU3RhZ2VzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb21wc01hcCkpO1xuICAgICAgICBDdXN0b21Bc3NldEhhbmRsZXJUeXBlcy5mb3JFYWNoKChoYW5kbGVyTmFtZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hc3NldEhhbmRsZXJzW2hhbmRsZXJOYW1lXSA9IHt9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBmb3IgKGNvbnN0IHJvb3Qgb2YgcGx1Z2luUm9vdHMpIHtcbiAgICAgICAgICAgIGlmICghZXhpc3RzU3luYyhyb290KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaW5mb3MgPSBhd2FpdCBzY2FuUGx1Z2luUm9vdChyb290KTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaW5mbyBvZiBpbmZvcykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVySTE4bihpbmZvKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYW5zbGF0ZUNvbmZpZ0Rpc3BsYXlGaWVsZHMoaW5mby5jb25maWcpO1xuICAgICAgICAgICAgICAgIHRoaXMucGxhdGZvcm1SZWdpc3RlckluZm9Qb29sLnNldChpbmZvLnBsYXRmb3JtLCBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyYW5zbGF0ZUNvbmZpZ0l0ZW1zRGlzcGxheUZpZWxkcyhidWlsZGVyQ29uZmlnLmNvbW1vbk9wdGlvbkNvbmZpZ3MpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyByZWdpc3RlckFsbFBsYXRmb3JtKCkge1xuICAgICAgICBmb3IgKGNvbnN0IHBsYXRmb3JtIG9mIHRoaXMucGxhdGZvcm1SZWdpc3RlckluZm9Qb29sLmtleXMoKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlZ2lzdGVyKHBsYXRmb3JtKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVnaXN0ZXIgcGxhdGZvcm0gJHtwbGF0Zm9ybX0gZmFpbGVkIWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHJlZ2lzdGVyKHBsYXRmb3JtOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBwbGF0Zm9ybSAke3BsYXRmb3JtfSBoYXMgcmVnaXN0ZXIgYWxyZWFkeSFgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5wbGF0Zm9ybVJlZ2lzdGVySW5mb1Bvb2wuZ2V0KHBsYXRmb3JtKTtcbiAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbiBub3QgZmluZCBwbGF0Zm9ybSByZWdpc3RlciBpbmZvIGZvciAke3BsYXRmb3JtfWApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMucmVnaXN0ZXJQbGF0Zm9ybShpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnRlcm5hbFJlZ2lzdGVyKGluZm8pO1xuICAgICAgICBjb25zb2xlLmxvZyhgcmVnaXN0ZXIgcGxhdGZvcm0gJHtwbGF0Zm9ybX0gc3VjY2VzcyFgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2hlY2tQbGF0Zm9ybShwbGF0Zm9ybTogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gISFwbGF0Zm9ybSAmJiAhIXRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLnBsYXRmb3JtVHlwZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVnaXN0ZXJQbGF0Zm9ybShyZWdpc3RlckluZm86IElQbGF0Zm9ybVJlZ2lzdGVySW5mbykge1xuICAgICAgICBjb25zdCB7IHBsYXRmb3JtLCBjb25maWcgfSA9IHJlZ2lzdGVySW5mbztcbiAgICAgICAgaWYgKHRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwbGF0Zm9ybSAke3BsYXRmb3JtfSBoYXMgcmVnaXN0ZXIgYWxyZWFkeSFgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbmZpZ01hcFtwbGF0Zm9ybV0gPSB7fTtcbiAgICAgICAgdGhpcy5wbGF0Zm9ybUNvbmZpZ1twbGF0Zm9ybV0gPSB7fSBhcyBJUGxhdGZvcm1Db25maWc7XG4gICAgICAgIGlmIChjb25maWcuYXNzZXRCdW5kbGVDb25maWcpIHtcbiAgICAgICAgICAgIHRoaXMuYnVuZGxlQ29uZmlnc1twbGF0Zm9ybV0gPSBPYmplY3QuYXNzaWduKHRoaXMuYnVuZGxlQ29uZmlnc1twbGF0Zm9ybV0gfHwge30sIHtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybVR5cGU6IGNvbmZpZy5hc3NldEJ1bmRsZUNvbmZpZy5wbGF0Zm9ybVR5cGUsXG4gICAgICAgICAgICAgICAgc3VwcG9ydE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgY29tcHJlc3Npb25UeXBlOiBjb25maWcuYXNzZXRCdW5kbGVDb25maWcuc3VwcG9ydGVkQ29tcHJlc3Npb25UeXBlcyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5rOo5YaM5Y6L57yp57q555CG6YWN572u77yM6ZyA6KaB5Zyo5bmz5Y+w5YmU6Zmk5LmL5YmNXG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnLnRleHR1cmVDb21wcmVzc0NvbmZpZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0dyb3Vwc0luZm86IElDb25maWdHcm91cHNJbmZvID0gY29uZmlnR3JvdXBzW2NvbmZpZy50ZXh0dXJlQ29tcHJlc3NDb25maWcucGxhdGZvcm1UeXBlXTtcbiAgICAgICAgICAgIGlmICghY29uZmlnR3JvdXBzSW5mbykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEludmFsaWQgcGxhdGZvcm1UeXBlICR7Y29uZmlnLnRleHR1cmVDb21wcmVzc0NvbmZpZy5wbGF0Zm9ybVR5cGV9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZ0dyb3Vwc0luZm8uc3VwcG9ydC5yZ2IgPSBsb2Rhc2gudW5pb24oY29uZmlnR3JvdXBzSW5mby5zdXBwb3J0LnJnYiwgY29uZmlnLnRleHR1cmVDb21wcmVzc0NvbmZpZy5zdXBwb3J0LnJnYik7XG4gICAgICAgICAgICAgICAgY29uZmlnR3JvdXBzSW5mby5zdXBwb3J0LnJnYmEgPSBsb2Rhc2gudW5pb24oY29uZmlnR3JvdXBzSW5mby5zdXBwb3J0LnJnYmEsIGNvbmZpZy50ZXh0dXJlQ29tcHJlc3NDb25maWcuc3VwcG9ydC5yZ2JhKTtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnR3JvdXBzSW5mby5kZWZhdWx0U3VwcG9ydCkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcudGV4dHVyZUNvbXByZXNzQ29uZmlnLnN1cHBvcnQucmdiID0gbG9kYXNoLnVuaW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnRleHR1cmVDb21wcmVzc0NvbmZpZy5zdXBwb3J0LnJnYixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ0dyb3Vwc0luZm8uZGVmYXVsdFN1cHBvcnQucmdiLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBjb25maWcudGV4dHVyZUNvbXByZXNzQ29uZmlnLnN1cHBvcnQucmdiYSA9IGxvZGFzaC51bmlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy50ZXh0dXJlQ29tcHJlc3NDb25maWcuc3VwcG9ydC5yZ2JhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnR3JvdXBzSW5mby5kZWZhdWx0U3VwcG9ydC5yZ2JhLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLnRleHR1cmUgPSBjb25maWcudGV4dHVyZUNvbXByZXNzQ29uZmlnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmZpZ1dpdGhEaXNwbGF5S2V5cyA9IGNvbmZpZyBhcyBJMThuRGlzcGxheVJlY29yZDtcbiAgICAgICAgdGhpcy5wbGF0Zm9ybUNvbmZpZ1twbGF0Zm9ybV0ubmFtZSA9IGNvbmZpZy5kaXNwbGF5TmFtZTtcbiAgICAgICAgdGhpcy5wbGF0Zm9ybUNvbmZpZ1twbGF0Zm9ybV0ubmFtZUkxOG5LZXkgPSBjb25maWdXaXRoRGlzcGxheUtleXMuZGlzcGxheU5hbWVJMThuS2V5O1xuICAgICAgICBpZiAoY29uZmlnLmRvYyAmJiAhY29uZmlnLmRvYy5zdGFydHNXaXRoKCdodHRwJykpIHtcbiAgICAgICAgICAgIGNvbmZpZy5kb2MgPSBVdGlscy5VcmwuZ2V0RG9jVXJsKGNvbmZpZy5kb2MpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLmRvYyA9IGNvbmZpZy5kb2M7XG4gICAgICAgIHRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLnBsdWdpblBhdGggPSByZWdpc3RlckluZm8ucGF0aDtcbiAgICAgICAgdGhpcy5wbGF0Zm9ybUNvbmZpZ1twbGF0Zm9ybV0ucGxhdGZvcm1UeXBlID0gKGNvbmZpZyBhcyBJUGxhdGZvcm1CdWlsZFBsdWdpbkNvbmZpZykucGxhdGZvcm1UeXBlO1xuXG4gICAgICAgIGlmIChjb25maWcuYnVpbGRUZW1wbGF0ZUNvbmZpZyAmJiBjb25maWcuYnVpbGRUZW1wbGF0ZUNvbmZpZy50ZW1wbGF0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBsYWJlbCA9IGNvbmZpZy5kaXNwbGF5TmFtZSB8fCBwbGF0Zm9ybTtcbiAgICAgICAgICAgIGNvbmZpZy5idWlsZFRlbXBsYXRlQ29uZmlnLnBrZ05hbWUgPSBwbGF0Zm9ybTtcbiAgICAgICAgICAgIHRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLmNyZWF0ZVRlbXBsYXRlTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgICAgIHRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLmNyZWF0ZVRlbXBsYXRlTGFiZWxJMThuS2V5ID0gY29uZmlnV2l0aERpc3BsYXlLZXlzLmRpc3BsYXlOYW1lSTE4bktleTtcbiAgICAgICAgICAgIHRoaXMuYnVpbGRUZW1wbGF0ZUNvbmZpZ01hcFtsYWJlbF0gPSBjb25maWcuYnVpbGRUZW1wbGF0ZUNvbmZpZztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5idW5kbGVDb25maWdzW3BsYXRmb3JtXSkge1xuICAgICAgICAgICAgdGhpcy5wbGF0Zm9ybUNvbmZpZ1twbGF0Zm9ybV0udHlwZSA9IHRoaXMuYnVuZGxlQ29uZmlnc1twbGF0Zm9ybV0ucGxhdGZvcm1UeXBlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBpbnRlcm5hbFJlZ2lzdGVyKHJlZ2lzdGVySW5mbzogSUJ1aWxkZXJSZWdpc3RlckluZm8pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgeyBwbGF0Zm9ybSwgY29uZmlnLCBwYXRoIH0gPSByZWdpc3RlckluZm87XG4gICAgICAgIGlmICghdGhpcy5wbGF0Zm9ybUNvbmZpZ1twbGF0Zm9ybV0gfHwgIXRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcGxhdGZvcm0gJHtwbGF0Zm9ybX0gaGFzIGJlZW4gcmVnaXN0ZXJlZCFgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBrZ05hbWUgPSByZWdpc3RlckluZm8ucGtnTmFtZSB8fCBwbGF0Zm9ybTtcbiAgICAgICAgdGhpcy5wa2dQcmlvcml0aWVzW3BrZ05hbWVdID0gY29uZmlnLnByaW9yaXR5IHx8IChwYXRoLmluY2x1ZGVzKEdsb2JhbFBhdGhzLndvcmtzcGFjZSkgPyAxIDogMCk7XG4gICAgICAgIC8vIOazqOWGjOagoemqjOaWueazlVxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy52ZXJpZnlSdWxlTWFwID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbcnVsZU5hbWUsIGl0ZW1dIG9mIE9iamVjdC5lbnRyaWVzKGNvbmZpZy52ZXJpZnlSdWxlTWFwKSkge1xuICAgICAgICAgICAgICAgIC8vIOa3u+WKoOS7pSDlubPlj7AgKyDmj5Lku7Yg5L2c5Li6IGtleSDnmoTmoKHpqozop4TliJlcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JNYW5hZ2VyLmFkZFJ1bGUocnVsZU5hbWUsIGl0ZW0sIHBsYXRmb3JtICsgcGtnTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5vcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgbG9kYXNoLnNldCh0aGlzLnBrZ09wdGlvbkNvbmZpZ3MsIGAke3JlZ2lzdGVySW5mby5wbGF0Zm9ybX0uJHtwa2dOYW1lfWAsIGNvbmZpZy5vcHRpb25zKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbmZpZy5vcHRpb25zKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBjaGVja0NvbmZpZ0RlZmF1bHQoY29uZmlnLm9wdGlvbnMhW2tleV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhd2FpdCBidWlsZGVyQ29uZmlnLnNldFByb2plY3QoYHBsYXRmb3Jtcy4ke3BsYXRmb3JtfS5wYWNrYWdlcy4ke3BsYXRmb3JtfWAsIGdldE9wdGlvbnNEZWZhdWx0KGNvbmZpZy5vcHRpb25zKSwgJ2RlZmF1bHQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaVtOeQhumAmueUqOaehOW7uumAiemhueeahOagoemqjOinhOWImVxuICAgICAgICBpZiAoY29uZmlnLmNvbW1vbk9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIOatpOacuuWItuS+nei1luS6huaPkuS7tueahOWQr+WKqOmhuuW6j+adpeWGmeWFpemFjee9rlxuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ1twbGF0Zm9ybV0pIHtcbiAgICAgICAgICAgICAgICAvLyDkvb/nlKjpu5jorqTpgJrnlKjphY3nva7lkozpppbkuKrmj5Lku7boh6rlrprkuYnnmoTpgJrnlKjphY3nva7ov5vooYzono3lkIhcbiAgICAgICAgICAgICAgICB0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ1twbGF0Zm9ybV0gPSBPYmplY3QuYXNzaWduKHt9LCBsb2Rhc2guZGVmYXVsdHNEZWVwKHt9LCBjb25maWcuY29tbW9uT3B0aW9ucywgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShidWlsZGVyQ29uZmlnLmNvbW1vbk9wdGlvbkNvbmZpZ3MpKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ1twbGF0Zm9ybV0gPSBkZWZhdWx0TWVyZ2Uoe30sIHRoaXMuY29tbW9uT3B0aW9uQ29uZmlnW3BsYXRmb3JtXSwgY29uZmlnLmNvbW1vbk9wdGlvbnMgfHwge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29tbW9uT3B0aW9ucyA9IGNvbmZpZy5jb21tb25PcHRpb25zO1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29tbW9uT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChjb21tb25PcHRpb25zW2tleV0udmVyaWZ5UnVsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21tb25PcHRpb25Db25maWdbcGxhdGZvcm1dW2tleV0gPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ1twbGF0Zm9ybV1ba2V5XSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZ5S2V5OiBwbGF0Zm9ybSArIHBrZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uZmlnLmN1c3RvbUJ1aWxkU3RhZ2VzKSB7XG4gICAgICAgICAgICAvLyDms6jlhozmnoTlu7rpmLbmrrXmgKfku7vliqFcbiAgICAgICAgICAgIGxvZGFzaC5zZXQodGhpcy5jdXN0b21CdWlsZFN0YWdlcywgYCR7cGxhdGZvcm19LiR7cGtnTmFtZX1gLCBjb25maWcuY3VzdG9tQnVpbGRTdGFnZXMpO1xuICAgICAgICAgICAgbG9kYXNoLnNldCh0aGlzLmN1c3RvbUJ1aWxkU3RhZ2VzTWFwLCBgJHtwa2dOYW1lfS4ke3BsYXRmb3JtfWAsIGNvbmZpZy5jdXN0b21CdWlsZFN0YWdlcyk7XG4gICAgICAgICAgICBhd2FpdCBidWlsZGVyQ29uZmlnLnNldFByb2plY3QoYHBsYXRmb3Jtcy4ke3BsYXRmb3JtfS5nZW5lcmF0ZUNvbXBpbGVDb25maWdgLCB0aGlzLnNob3VsZEdlbmVyYXRlT3B0aW9ucyhwbGF0Zm9ybSksICdkZWZhdWx0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBrZ1ByaW9yaXRpZXNbcGtnTmFtZV0gPSBjb25maWcucHJpb3JpdHkgfHwgMDtcbiAgICAgICAgdGhpcy5jb25maWdNYXBbcGxhdGZvcm1dW3BrZ05hbWVdID0gY29uZmlnO1xuICAgICAgICBhd2FpdCBjb25maWd1cmF0aW9uUmVnaXN0cnkucmVnaXN0ZXIoJ2J1aWxkZXInLCB7XG4gICAgICAgICAgICBub2RlczogKCkgPT4gY3JlYXRlQnVpbGRlclBsYXRmb3JtTWV0YWRhdGFOb2RlcyhwbGF0Zm9ybSwge1xuICAgICAgICAgICAgICAgIGNvbW1vbk9wdGlvbkNvbmZpZ3M6IGJ1aWxkZXJDb25maWcuY29tbW9uT3B0aW9uQ29uZmlncyBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIElDb2Nvc0NvbmZpZ3VyYXRpb25Qcm9wZXJ0eVNjaGVtYT4sXG4gICAgICAgICAgICAgICAgdXNlQ2FjaGVEZWZhdWx0czoge30sXG4gICAgICAgICAgICAgICAgY29tbW9uT3B0aW9uQ29uZmlnOiB0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZyBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIElDb2Nvc0NvbmZpZ3VyYXRpb25Qcm9wZXJ0eVNjaGVtYT4+LFxuICAgICAgICAgICAgICAgIGNvbmZpZ01hcDoge1xuICAgICAgICAgICAgICAgICAgICBbcGxhdGZvcm1dOiB0aGlzLmNvbmZpZ01hcFtwbGF0Zm9ybV0sXG4gICAgICAgICAgICAgICAgfSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU/OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCBJQ29jb3NDb25maWd1cmF0aW9uUHJvcGVydHlTY2hlbWE+O1xuICAgICAgICAgICAgICAgIH0+PixcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybVRpdGxlczoge1xuICAgICAgICAgICAgICAgICAgICBbcGxhdGZvcm1dOiB0aGlzLnBsYXRmb3JtQ29uZmlnW3BsYXRmb3JtXT8ubmFtZSB8fCBwbGF0Zm9ybSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgIH0pO1xuICAgICAgICAvLyDms6jlhowgaG9va3Mg6Lev5b6EXG4gICAgICAgIGlmIChyZWdpc3RlckluZm8uaG9va3MpIHtcbiAgICAgICAgICAgIGNvbmZpZy5ob29rcyA9IHJlZ2lzdGVySW5mby5ob29rcztcbiAgICAgICAgICAgIGxvZGFzaC5zZXQodGhpcy5idWlsZGVyUGF0aHNNYXAsIGAke3BrZ05hbWV9LiR7cGxhdGZvcm19YCwgY29uZmlnLmhvb2tzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDms6jlhozmnoTlu7rmqKHmnb/oj5zljZXpoblcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgW0J1aWxkXSBpbnRlcm5hbFJlZ2lzdGVyIHBrZygke3BrZ05hbWV9KSBpbiAke3BsYXRmb3JtfSBwbGF0Zm9ybSBzdWNjZXNzIWApO1xuICAgIH1cblxuICAgIF9yZWdpc3RlckkxOG4ocmVnaXN0ZXJJbmZvOiBJQnVpbGRlclJlZ2lzdGVySW5mbykge1xuICAgICAgICBjb25zdCB7IHBsYXRmb3JtLCBwYXRoIH0gPSByZWdpc3RlckluZm87XG4gICAgICAgIGNvbnN0IGkxOG5QYXRoID0gam9pbihwYXRoLCAnaTE4bicpO1xuICAgICAgICBpZiAoZXhpc3RzU3luYyhpMThuUGF0aCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0Y2hQYXRoID0gcmVnaXN0ZXJJbmZvLnBrZ05hbWUgfHwgcGxhdGZvcm07XG4gICAgICAgICAgICAgICAgcmVhZGRpclN5bmMoaTE4blBhdGgpLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBqb2luKGkxOG5QYXRoLCBmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUuZW5kc1dpdGgoJy5qc29uJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxhbmcgPSBiYXNlbmFtZShmaWxlLCAnLmpzb24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkxOG4ucmVnaXN0ZXJMYW5ndWFnZVBhdGNoKGxhbmcsIHBhdGNoUGF0aCwgcmVhZEpTT05TeW5jKGZpbGVQYXRoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZS5lbmRzV2l0aCgnLmpzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxhbmcgPSBiYXNlbmFtZShmaWxlLCAnLmpzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IHJlcXVpcmUucmVzb2x2ZShmaWxlUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gcmVxdWlyZShyZXNvbHZlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpMThuLnJlZ2lzdGVyTGFuZ3VhZ2VQYXRjaChsYW5nLCBwYXRjaFBhdGgsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmIChyZWdpc3RlckluZm8udHlwZSA9PT0gJ3JlZ2lzdGVyJykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHRyYW5zbGF0ZUNvbmZpZ0l0ZW1EaXNwbGF5RmllbGRzKGNvbmZpZz86IFBhcnRpYWw8SUJ1aWxkZXJDb25maWdJdGVtPikge1xuICAgICAgICBpZiAoIWNvbmZpZyB8fCB0eXBlb2YgY29uZmlnICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBjb25maWcgYXMgSTE4bkRpc3BsYXlSZWNvcmQ7XG4gICAgICAgIG1hdGVyaWFsaXplRGlzcGxheUkxOG5LZXkoaXRlbSwgJ2xhYmVsJyk7XG4gICAgICAgIG1hdGVyaWFsaXplRGlzcGxheUkxOG5LZXkoaXRlbSwgJ2Rlc2NyaXB0aW9uJyk7XG5cbiAgICAgICAgaWYgKGl0ZW0ucHJvcGVydGllcyAmJiB0eXBlb2YgaXRlbS5wcm9wZXJ0aWVzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgT2JqZWN0LnZhbHVlcyhpdGVtLnByb3BlcnRpZXMpLmZvckVhY2goKHByb3BlcnR5KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmFuc2xhdGVDb25maWdJdGVtRGlzcGxheUZpZWxkcyhwcm9wZXJ0eSBhcyBQYXJ0aWFsPElCdWlsZGVyQ29uZmlnSXRlbT4pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtLml0ZW1zKSkge1xuICAgICAgICAgICAgaXRlbS5pdGVtcy5mb3JFYWNoKChjaGlsZDogdW5rbm93bikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZCAmJiB0eXBlb2YgY2hpbGQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNsYXRlQ29uZmlnSXRlbURpc3BsYXlGaWVsZHMoY2hpbGQgYXMgUGFydGlhbDxJQnVpbGRlckNvbmZpZ0l0ZW0+KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLml0ZW1zICYmIHR5cGVvZiBpdGVtLml0ZW1zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGVDb25maWdJdGVtRGlzcGxheUZpZWxkcyhpdGVtLml0ZW1zIGFzIFBhcnRpYWw8SUJ1aWxkZXJDb25maWdJdGVtPik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHRyYW5zbGF0ZUNvbmZpZ0l0ZW1zRGlzcGxheUZpZWxkcyhjb25maWdzPzogUmVjb3JkPHN0cmluZywgUGFydGlhbDxJQnVpbGRlckNvbmZpZ0l0ZW0+Pikge1xuICAgICAgICBpZiAoIWNvbmZpZ3MgfHwgdHlwZW9mIGNvbmZpZ3MgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LnZhbHVlcyhjb25maWdzKS5mb3JFYWNoKChvcHRpb24pID0+IHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNsYXRlQ29uZmlnSXRlbURpc3BsYXlGaWVsZHMob3B0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0cmFuc2xhdGVDb25maWdEaXNwbGF5RmllbGRzKGNvbmZpZzogSUludGVybmFsQnVpbGRQbHVnaW5Db25maWcgfCBJUGxhdGZvcm1CdWlsZFBsdWdpbkNvbmZpZykge1xuICAgICAgICBjb25zdCBjb25maWdXaXRoRGlzcGxheUtleXMgPSBjb25maWcgYXMgSTE4bkRpc3BsYXlSZWNvcmQ7XG4gICAgICAgIG1hdGVyaWFsaXplRGlzcGxheUkxOG5LZXkoY29uZmlnV2l0aERpc3BsYXlLZXlzLCAnZGlzcGxheU5hbWUnKTtcblxuICAgICAgICB0aGlzLnRyYW5zbGF0ZUNvbmZpZ0l0ZW1zRGlzcGxheUZpZWxkcyhjb25maWcub3B0aW9ucyk7XG4gICAgICAgIHRoaXMudHJhbnNsYXRlQ29uZmlnSXRlbXNEaXNwbGF5RmllbGRzKGNvbmZpZy5jb21tb25PcHRpb25zKTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb25maWcuY3VzdG9tQnVpbGRTdGFnZXMpKSB7XG4gICAgICAgICAgICBjb25maWcuY3VzdG9tQnVpbGRTdGFnZXMuZm9yRWFjaCgoc3RhZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFnZVdpdGhEaXNwbGF5S2V5cyA9IHN0YWdlIGFzIEkxOG5EaXNwbGF5UmVjb3JkO1xuICAgICAgICAgICAgICAgIG1hdGVyaWFsaXplRGlzcGxheUkxOG5LZXkoc3RhZ2VXaXRoRGlzcGxheUtleXMsICdkaXNwbGF5TmFtZScpO1xuICAgICAgICAgICAgICAgIG1hdGVyaWFsaXplRGlzcGxheUkxOG5LZXkoc3RhZ2VXaXRoRGlzcGxheUtleXMsICdkZXNjcmlwdGlvbicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBidWlsZFRlbXBsYXRlQ29uZmlnID0gKGNvbmZpZyBhcyBJUGxhdGZvcm1CdWlsZFBsdWdpbkNvbmZpZykuYnVpbGRUZW1wbGF0ZUNvbmZpZyBhcyBJMThuRGlzcGxheVJlY29yZCB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGJ1aWxkVGVtcGxhdGVDb25maWcpIHtcbiAgICAgICAgICAgIG1hdGVyaWFsaXplRGlzcGxheUkxOG5LZXkoYnVpbGRUZW1wbGF0ZUNvbmZpZywgJ2Rpc3BsYXlOYW1lJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVmcmVzaERpc3BsYXlJMThuRmllbGRzKCkge1xuICAgICAgICB0aGlzLnRyYW5zbGF0ZUNvbmZpZ0l0ZW1zRGlzcGxheUZpZWxkcyhidWlsZGVyQ29uZmlnLmNvbW1vbk9wdGlvbkNvbmZpZ3MpO1xuXG4gICAgICAgIGZvciAoY29uc3QgaW5mbyBvZiB0aGlzLnBsYXRmb3JtUmVnaXN0ZXJJbmZvUG9vbC52YWx1ZXMoKSkge1xuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGVDb25maWdEaXNwbGF5RmllbGRzKGluZm8uY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgcGxhdGZvcm1Db25maWdzIG9mIE9iamVjdC52YWx1ZXModGhpcy5jb25maWdNYXApKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbmZpZyBvZiBPYmplY3QudmFsdWVzKHBsYXRmb3JtQ29uZmlncykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYW5zbGF0ZUNvbmZpZ0Rpc3BsYXlGaWVsZHMoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgY29tbW9uT3B0aW9ucyBvZiBPYmplY3QudmFsdWVzKHRoaXMuY29tbW9uT3B0aW9uQ29uZmlnKSkge1xuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGVDb25maWdJdGVtc0Rpc3BsYXlGaWVsZHMoY29tbW9uT3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IHBsYXRmb3JtU3RhZ2VzIG9mIE9iamVjdC52YWx1ZXModGhpcy5jdXN0b21CdWlsZFN0YWdlcykpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc3RhZ2VzIG9mIE9iamVjdC52YWx1ZXMocGxhdGZvcm1TdGFnZXMpKSB7XG4gICAgICAgICAgICAgICAgc3RhZ2VzLmZvckVhY2goKHN0YWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdlV2l0aERpc3BsYXlLZXlzID0gc3RhZ2UgYXMgSTE4bkRpc3BsYXlSZWNvcmQ7XG4gICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsaXplRGlzcGxheUkxOG5LZXkoc3RhZ2VXaXRoRGlzcGxheUtleXMsICdkaXNwbGF5TmFtZScpO1xuICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbGl6ZURpc3BsYXlJMThuS2V5KHN0YWdlV2l0aERpc3BsYXlLZXlzLCAnZGVzY3JpcHRpb24nKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgdGVtcGxhdGUgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLmJ1aWxkVGVtcGxhdGVDb25maWdNYXApKSB7XG4gICAgICAgICAgICBtYXRlcmlhbGl6ZURpc3BsYXlJMThuS2V5KHRlbXBsYXRlIGFzIEkxOG5EaXNwbGF5UmVjb3JkLCAnZGlzcGxheU5hbWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgW3BsYXRmb3JtLCByZWdpc3RlckluZm9dIG9mIHRoaXMucGxhdGZvcm1SZWdpc3RlckluZm9Qb29sLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgY29uc3QgcGxhdGZvcm1Db25maWcgPSB0aGlzLnBsYXRmb3JtQ29uZmlnW3BsYXRmb3JtXTtcbiAgICAgICAgICAgIGlmICghcGxhdGZvcm1Db25maWcpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSByZWdpc3RlckluZm87XG4gICAgICAgICAgICBjb25zdCBjb25maWdXaXRoRGlzcGxheUtleXMgPSBjb25maWcgYXMgSTE4bkRpc3BsYXlSZWNvcmQ7XG4gICAgICAgICAgICBwbGF0Zm9ybUNvbmZpZy5uYW1lID0gY29uZmlnLmRpc3BsYXlOYW1lO1xuICAgICAgICAgICAgcGxhdGZvcm1Db25maWcubmFtZUkxOG5LZXkgPSBjb25maWdXaXRoRGlzcGxheUtleXMuZGlzcGxheU5hbWVJMThuS2V5O1xuXG4gICAgICAgICAgICBpZiAoY29uZmlnLmJ1aWxkVGVtcGxhdGVDb25maWcgJiYgY29uZmlnLmJ1aWxkVGVtcGxhdGVDb25maWcudGVtcGxhdGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gY29uZmlnLmRpc3BsYXlOYW1lIHx8IHBsYXRmb3JtO1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtQ29uZmlnLmNyZWF0ZVRlbXBsYXRlTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybUNvbmZpZy5jcmVhdGVUZW1wbGF0ZUxhYmVsSTE4bktleSA9IGNvbmZpZ1dpdGhEaXNwbGF5S2V5cy5kaXNwbGF5TmFtZUkxOG5LZXk7XG4gICAgICAgICAgICAgICAgdGhpcy5idWlsZFRlbXBsYXRlQ29uZmlnTWFwW2xhYmVsXSA9IGNvbmZpZy5idWlsZFRlbXBsYXRlQ29uZmlnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGdldENvbW1vbk9wdGlvbkNvbmZpZ3MocGxhdGZvcm06IFBsYXRmb3JtKTogUmVjb3JkPHN0cmluZywgSUJ1aWxkZXJDb25maWdJdGVtPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ1twbGF0Zm9ybV07XG4gICAgfVxuXG4gICAgcHVibGljIGdldENvbW1vbk9wdGlvbkNvbmZpZ0J5S2V5KGtleToga2V5b2YgSUJ1aWxkVGFza09wdGlvbiwgb3B0aW9uczogSUJ1aWxkVGFza09wdGlvbik6IElCdWlsZGVyQ29uZmlnSXRlbSB8IG51bGwge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ1tvcHRpb25zLnBsYXRmb3JtIGFzIFBsYXRmb3JtXSAmJiB0aGlzLmNvbW1vbk9wdGlvbkNvbmZpZ1tvcHRpb25zLnBsYXRmb3JtIGFzIFBsYXRmb3JtXVtrZXldIHx8IHt9O1xuICAgICAgICBpZiAoYnVpbGRlckNvbmZpZy5jb21tb25PcHRpb25Db25maWdzW2tleV0pIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGJ1aWxkZXJDb25maWcuY29tbW9uT3B0aW9uQ29uZmlnc1trZXldKSk7XG4gICAgICAgICAgICBsb2Rhc2guZGVmYXVsdHNEZWVwKGNvbmZpZywgZGVmYXVsdENvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjb25maWcgfHwgIWNvbmZpZy52ZXJpZnlSdWxlcykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UGFja2FnZU9wdGlvbkNvbmZpZ0J5S2V5KGtleTogc3RyaW5nLCBwa2dOYW1lOiBzdHJpbmcsIG9wdGlvbnM6IElCdWlsZFRhc2tPcHRpb24pOiBJQnVpbGRlckNvbmZpZ0l0ZW0gfCBudWxsIHtcbiAgICAgICAgaWYgKCFrZXkgfHwgIXBrZ05hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmZpZ3MgPSB0aGlzLnBrZ09wdGlvbkNvbmZpZ3Nbb3B0aW9ucy5wbGF0Zm9ybSBhcyBQbGF0Zm9ybV1bcGtnTmFtZV07XG4gICAgICAgIGlmICghY29uZmlncykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxvZGFzaC5nZXQoY29uZmlncywga2V5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0T3B0aW9uQ29uZmlnQnlLZXkoa2V5OiBrZXlvZiBJQnVpbGRUYXNrT3B0aW9uLCBvcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uKTogSUJ1aWxkZXJDb25maWdJdGVtIHwgbnVsbCB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXlNYXRjaCA9IGtleSAmJiAoa2V5KS5tYXRjaCgvXm9wdGlvbnMucGFja2FnZXMuKChbXi5dKikuKikkLyk7XG4gICAgICAgIGlmICgha2V5TWF0Y2ggfHwgIWtleU1hdGNoWzJdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21tb25PcHRpb25Db25maWdCeUtleShrZXksIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgWywgcGF0aCwgcGtnTmFtZV0gPSBrZXlNYXRjaDtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UGFja2FnZU9wdGlvbkNvbmZpZ0J5S2V5KHBhdGgsIHBrZ05hbWUsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaGFzRml4ZWRWYWx1ZShyZXN1bHQ6IEJ1aWxkQ2hlY2tSZXN1bHQpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChyZXN1bHQsICdmaXhlZFZhbHVlJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRGaXhlZFZhbHVlPFQ+KHJlc3VsdDogQnVpbGRDaGVja1Jlc3VsdCwgdmFsdWU6IFQpOiBUIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFzRml4ZWRWYWx1ZShyZXN1bHQpID8gcmVzdWx0LmZpeGVkVmFsdWUgYXMgVCA6IHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWujOaVtOagoemqjOaehOW7uuWPguaVsO+8iOagoemqjOW5s+WPsOaPkuS7tuebuOWFs+eahOWPguaVsOagoemqjO+8iVxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGNoZWNrT3B0aW9ucyhvcHRpb25zOiBNYWtlUmVxdWlyZWQ8SUJ1aWxkQ29tbWFuZE9wdGlvbiwgJ3BsYXRmb3JtJyB8ICdtYWluQnVuZGxlQ29tcHJlc3Npb25UeXBlJz4pOiBQcm9taXNlPHVuZGVmaW5lZCB8IElCdWlsZFRhc2tPcHRpb24+IHtcbiAgICAgICAgLy8g5a+55Y+C5pWw5YGa5pWw5o2u6aqM6K+BXG4gICAgICAgIGxldCBjaGVja1JlcyA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmJ1bmRsZUNvbmZpZ3Nbb3B0aW9ucy5wbGF0Zm9ybSBhcyBQbGF0Zm9ybV0pIHtcbiAgICAgICAgICAgIGNvbnN0IHN1cHBvcnRlZENvbXByZXNzaW9uVHlwZXMgPSB0aGlzLmJ1bmRsZUNvbmZpZ3Nbb3B0aW9ucy5wbGF0Zm9ybSBhcyBQbGF0Zm9ybV0uc3VwcG9ydE9wdGlvbnMuY29tcHJlc3Npb25UeXBlO1xuICAgICAgICAgICAgY29uc3QgY29tcHJlc3Npb25UeXBlUmVzdWx0ID0gYXdhaXQgY2hlY2tCdW5kbGVDb21wcmVzc2lvblNldHRpbmcob3B0aW9ucy5tYWluQnVuZGxlQ29tcHJlc3Npb25UeXBlLCBzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzKTtcbiAgICAgICAgICAgIGNvbnN0IGZpeGVkQ29tcHJlc3Npb25UeXBlID0gdGhpcy5nZXRGaXhlZFZhbHVlKGNvbXByZXNzaW9uVHlwZVJlc3VsdCwgb3B0aW9ucy5tYWluQnVuZGxlQ29tcHJlc3Npb25UeXBlKTtcbiAgICAgICAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0b3IuY2hlY2tXaXRoSW50ZXJuYWxSdWxlKCd2YWxpZCcsIGZpeGVkQ29tcHJlc3Npb25UeXBlKTtcbiAgICAgICAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgbG9kYXNoLnNldChvcHRpb25zLCAnbWFpbkJ1bmRsZUNvbXByZXNzaW9uVHlwZScsIGZpeGVkQ29tcHJlc3Npb25UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOacieaKpemUmeS/oeaBr++8jOS5n+acieS/ruWkjeWAvO+8jOWPquWPkeaKpemUmeS4jeS4reaWre+8jOS9v+eUqOaWsOWAvFxuICAgICAgICAgICAgaWYgKCFjb21wcmVzc2lvblR5cGVSZXN1bHQudmFsaWQgJiYgaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihpMThuLnQoJ2J1aWxkZXIud2Fybi5jaGVja19mYWlsZWRfd2l0aF9uZXdfdmFsdWUnLCB7XG4gICAgICAgICAgICAgICAgICAgIGtleTogJ21haW5CdW5kbGVDb21wcmVzc2lvblR5cGUnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogb3B0aW9ucy5tYWluQnVuZGxlQ29tcHJlc3Npb25UeXBlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogY29tcHJlc3Npb25UeXBlUmVzdWx0Lm1lc3NhZ2UgfHwgJycsXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBKU09OLnN0cmluZ2lmeShmaXhlZENvbXByZXNzaW9uVHlwZSksXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgQ2FuIG5vdCBmaW5kIGJ1bmRsZSBjb25maWcgd2l0aCBwbGF0Zm9ybSAke29wdGlvbnMucGxhdGZvcm19YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAo5qCh6aqM5aSE5bey57uP5YGa5LqG6ZSZ6K+v5pWw5o2u5L2/55So6buY6K6k5YC855qE5aSE55CGKeajgOmqjOaVsOaNrumAmui/h+WQjuWBmuS4gOasoeaVsOaNruiejeWQiFxuICAgICAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IGF3YWl0IHRoaXMuZ2V0T3B0aW9uc0J5UGxhdGZvcm0ob3B0aW9ucy5wbGF0Zm9ybSk7XG4gICAgICAgIC8vIGxvZGFzaCDnmoQgZGVmYXVsdHNEZWVwIOS8muWvueaVsOe7hOS5n+i/m+ihjOa3seW6puWQiOW5tu+8jOS4jeespuWQiOaIkeS7rOeahOS9v+eUqOmihOacn++8jOmcgOimgeiHquW3see8luWGmeivpeWHveaVsFxuICAgICAgICBjb25zdCByaWdodE9wdGlvbnMgPSBkZWZhdWx0c0RlZXAoSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvcHRpb25zKSksIGRlZmF1bHRPcHRpb25zKTtcbiAgICAgICAgLy8g5Lyg6YCS5LqGIGJ1aWxkU3RhZ2VHcm91cCDnmoTpgInpobnvvIzkuI3pnIDopoHlgZrpu5jorqTlgLzlkIjlubZcbiAgICAgICAgaWYgKCdidWlsZFN0YWdlR3JvdXAnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJpZ2h0T3B0aW9ucy5idWlsZFN0YWdlR3JvdXAgPSBvcHRpb25zLmJ1aWxkU3RhZ2VHcm91cDtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBsZXRlU3VwcG9ydFBsYXRmb3JtT3B0aW9ucyhyaWdodE9wdGlvbnMpO1xuICAgICAgICAvLyDpgJrnlKjlj4LmlbDnmoTmnoTlu7rmoKHpqowsIOmcgOimgeS9v+eUqOm7mOiupOWAvOihpeWFqOaJgOacieeahCBrZXlcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMocmlnaHRPcHRpb25zKSkge1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3BhY2thZ2VzJykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5jaGVja0NvbW1vbk9wdGlvbkJ5S2V5KGtleSBhcyBrZXlvZiBJQnVpbGRUYXNrT3B0aW9uLCByaWdodE9wdGlvbnNba2V5XSwgcmlnaHRPcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGZpeGVkVmFsdWUgPSB0aGlzLmdldEZpeGVkVmFsdWUocmVzLCByaWdodE9wdGlvbnNba2V5XSk7XG4gICAgICAgICAgICBpZiAocmVzICYmICFyZXMudmFsaWQgJiYgKHJlcy5sZXZlbCB8fCAnZXJyb3InKSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyck1zZyA9IHJlcy5tZXNzYWdlIHx8ICcnO1xuICAgICAgICAgICAgICAgIGlmICghdmFsaWRhdG9yLmNoZWNrV2l0aEludGVybmFsUnVsZSgndmFsaWQnLCBmaXhlZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBjaGVja1JlcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGkxOG4udCgnYnVpbGRlci5lcnJvci5jaGVja19mYWlsZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkocmlnaHRPcHRpb25zW2tleV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyck1zZyxcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAvLyDlh7rnjrDmo4Dmn6XplJnor6/vvIznm7TmjqXkuK3mlq3mnoTlu7pcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOW4uOinhOaehOW7uuWmguaenOaWsOeahOWAvOWPr+eUqO+8jOS4jeS4reaWre+8jOWPquitpuWRilxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oaTE4bi50KCdidWlsZGVyLndhcm4uY2hlY2tfZmFpbGVkX3dpdGhfbmV3X3ZhbHVlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IEpTT04uc3RyaW5naWZ5KHJpZ2h0T3B0aW9uc1trZXldKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJNc2csXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZTogSlNPTi5zdHJpbmdpZnkoZml4ZWRWYWx1ZSksXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByaWdodE9wdGlvbnNba2V5XSA9IGZpeGVkVmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jaGVja1BsdWdpbk9wdGlvbnMocmlnaHRPcHRpb25zKTtcbiAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgIGNoZWNrUmVzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoZWNrUmVzKSB7XG4gICAgICAgICAgICByZXR1cm4gcmlnaHRPcHRpb25zO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRQbGF0Zm9ybUJ1aWxkUGx1Z2luQ29uZmlnKHBsYXRmb3JtOiBQbGF0Zm9ybSB8IHN0cmluZyk6IElQbGF0Zm9ybUJ1aWxkUGx1Z2luQ29uZmlnIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmNvbmZpZ01hcFtwbGF0Zm9ybV0/LltwbGF0Zm9ybV0gfHwgdGhpcy5wbGF0Zm9ybVJlZ2lzdGVySW5mb1Bvb2wuZ2V0KHBsYXRmb3JtKT8uY29uZmlnKSBhcyBJUGxhdGZvcm1CdWlsZFBsdWdpbkNvbmZpZyB8IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGVuc3VyZVBsYXRmb3JtUmVnaXN0ZXJlZChwbGF0Zm9ybTogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmNoZWNrUGxhdGZvcm0ocGxhdGZvcm0pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnBsYXRmb3JtUmVnaXN0ZXJJbmZvUG9vbC5oYXMocGxhdGZvcm0pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFN1cHBvcnQgcGxhdGZvcm0gJHtwbGF0Zm9ybX0gaXMgbm90IHJlZ2lzdGVyZWRgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLnJlZ2lzdGVyKHBsYXRmb3JtKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb21wbGV0ZSBjaGlsZCBwbGF0Zm9ybSBidWlsZCBvcHRpb25zIGZvciBwbGF0Zm9ybXMgdGhhdCBzdXBwb3J0IGNvbWJpbmVkIGJ1aWxkcy5cbiAgICAgKlxuICAgICAqIFdoZW4gdGhlIHBhcmVudCBwbGF0Zm9ybSBlbmFibGVzIGBzdXBwb3J0UGxhdGZvcm1zYCwgdGhpcyBtZXRob2Q6XG4gICAgICogLSByZWdpc3RlcnMgYW5kIGVuYWJsZXMgY29uZmlndXJlZCBjaGlsZCBwbGF0Zm9ybXM7XG4gICAgICogLSBtZXJnZXMgZWFjaCBjaGlsZCBwbGF0Zm9ybSdzIG93biBkZWZhdWx0IHBhY2thZ2Ugb3B0aW9ucztcbiAgICAgKiAtIHN5bmNocm9uaXplcyBwYXJlbnQgT3BlblBhYVMgdXBsb2FkIGlkZW50aXR5IGZpZWxkcyBpbnRvIGNoaWxkIHBhY2thZ2VzXG4gICAgICogICBzbyB3ZWIgdXBsb2FkIHN0YWdlcyB1c2UgdGhlIHNhbWUgYXBwL3ZlcnNpb24vZW52aXJvbm1lbnQvc2Vzc2lvbi5cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGNvbXBsZXRlU3VwcG9ydFBsYXRmb3JtT3B0aW9ucyhvcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uKSB7XG4gICAgICAgIGNvbnN0IHBsYXRmb3JtID0gU3RyaW5nKG9wdGlvbnMucGxhdGZvcm0pO1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFBsYXRmb3JtQnVpbGRQbHVnaW5Db25maWcocGxhdGZvcm0pO1xuICAgICAgICBjb25zdCBzdXBwb3J0UGxhdGZvcm1zID0gY29uZmlnPy5zdXBwb3J0UGxhdGZvcm1zO1xuICAgICAgICBpZiAoIXN1cHBvcnRQbGF0Zm9ybXM/LnBsYXRmb3Jtcz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICBkZWxldGUgb3B0aW9ucy5zdWJUYXNrUGxhdGZvcm1zO1xuICAgICAgICAgICAgZGVsZXRlIG9wdGlvbnMuc3ViVGFza0J1aWxkT3V0cHV0cztcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLmNoaWxkVGFza0lkcztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVuYWJsZWQgPSAhIWxvZGFzaC5nZXQob3B0aW9ucywgWydwYWNrYWdlcycsIHBsYXRmb3JtLCBzdXBwb3J0UGxhdGZvcm1zLmNvbnRyb2xsZWRCeV0pO1xuICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLnN1YlRhc2tQbGF0Zm9ybXM7XG4gICAgICAgICAgICBkZWxldGUgb3B0aW9ucy5zdWJUYXNrQnVpbGRPdXRwdXRzO1xuICAgICAgICAgICAgZGVsZXRlIG9wdGlvbnMuY2hpbGRUYXNrSWRzO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy5wYWNrYWdlcyA9IG9wdGlvbnMucGFja2FnZXMgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmVudFBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlc1twbGF0Zm9ybV0gfHwge307XG4gICAgICAgIG9wdGlvbnMuc3ViVGFza1BsYXRmb3JtcyA9IFtdO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5zdWJUYXNrQnVpbGRPdXRwdXRzO1xuICAgICAgICBkZWxldGUgb3B0aW9ucy5jaGlsZFRhc2tJZHM7XG5cbiAgICAgICAgZm9yIChjb25zdCBjaGlsZFBsYXRmb3JtIG9mIHN1cHBvcnRQbGF0Zm9ybXMucGxhdGZvcm1zKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuc3VyZVBsYXRmb3JtUmVnaXN0ZXJlZChjaGlsZFBsYXRmb3JtKTtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkRGVmYXVsdE9wdGlvbnMgPSBhd2FpdCB0aGlzLmdldE9wdGlvbnNCeVBsYXRmb3JtKGNoaWxkUGxhdGZvcm0pO1xuICAgICAgICAgICAgY29uc3QgY2hpbGRQYWNrYWdlRGVmYXVsdHMgPSBsb2Rhc2guZ2V0KGNoaWxkRGVmYXVsdE9wdGlvbnMsIFsncGFja2FnZXMnLCBjaGlsZFBsYXRmb3JtXSwge30pO1xuICAgICAgICAgICAgY29uc3QgY2hpbGRQYWNrYWdlT3B0aW9ucyA9IGRlZmF1bHRzRGVlcChcbiAgICAgICAgICAgICAgICBjbG9uZUNvbmZpZ1ZhbHVlKG9wdGlvbnMucGFja2FnZXNbY2hpbGRQbGF0Zm9ybV0gfHwge30pLFxuICAgICAgICAgICAgICAgIGNsb25lQ29uZmlnVmFsdWUoY2hpbGRQYWNrYWdlRGVmYXVsdHMpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuc3luY1BhcmVudE9wdGlvbnNUb1N1cHBvcnRQbGF0Zm9ybVBhY2thZ2UocGFyZW50UGFja2FnZU9wdGlvbnMsIGNoaWxkUGFja2FnZU9wdGlvbnMpO1xuICAgICAgICAgICAgb3B0aW9ucy5wYWNrYWdlc1tjaGlsZFBsYXRmb3JtXSA9IGNoaWxkUGFja2FnZU9wdGlvbnM7XG4gICAgICAgICAgICBvcHRpb25zLnN1YlRhc2tQbGF0Zm9ybXMucHVzaChjaGlsZFBsYXRmb3JtKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvcHkgcGFyZW50IE9wZW5QYWFTIHVwbG9hZCBmaWVsZHMgdG8gYSBzdXBwb3J0LXBsYXRmb3JtIHBhY2thZ2UuXG4gICAgICpcbiAgICAgKiBPcGVuUGFhUyBhbmQgd2ViIHBhY2thZ2VzIGJvdGggY29uc3VtZSBgYXBwaWRgLiBgYXBwX2lkYCBpcyBhY2NlcHRlZCBhcyBhXG4gICAgICogbGVnYWN5IHBhcmVudCBrZXkgZm9yIGNvbXBhdGliaWxpdHkuIFRoZSByZW1haW5pbmcgZmllbGRzIHNoYXJlIHRoZSBzYW1lXG4gICAgICoga2V5IG5hbWVzIGFuZCBtdXN0IHN0YXkgYWxpZ25lZCBhY3Jvc3MgcGFyZW50IGFuZCBjaGlsZCBidWlsZHMgZm9yIHdlYlxuICAgICAqIHBhY2thZ2UgdXBsb2FkLlxuICAgICAqL1xuICAgIHByaXZhdGUgc3luY1BhcmVudE9wdGlvbnNUb1N1cHBvcnRQbGF0Zm9ybVBhY2thZ2UocGFyZW50UGFja2FnZU9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIGFueT4sIGNoaWxkUGFja2FnZU9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgICAgICAgZm9yIChjb25zdCB7IGNoaWxkS2V5LCBwYXJlbnRLZXlzIH0gb2YgU1VQUE9SVF9QTEFURk9STV9QQVJFTlRfT1BUSU9OX01BUFBJTkdTKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhcmVudEtleSBvZiBwYXJlbnRLZXlzKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnRQYWNrYWdlT3B0aW9ucywgcGFyZW50S2V5KSAmJiBwYXJlbnRQYWNrYWdlT3B0aW9uc1twYXJlbnRLZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRQYWNrYWdlT3B0aW9uc1tjaGlsZEtleV0gPSBjbG9uZUNvbmZpZ1ZhbHVlKHBhcmVudFBhY2thZ2VPcHRpb25zW3BhcmVudEtleV0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2hlY2tDb21tb25PcHRpb25zKG9wdGlvbnM6IElCdWlsZFRhc2tPcHRpb24pIHtcbiAgICAgICAgY29uc3QgY2hlY2tSZXM6IFJlY29yZDxzdHJpbmcsIEJ1aWxkQ2hlY2tSZXN1bHQ+ID0ge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSAncGFja2FnZXMnKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjaGVja1Jlc1trZXldID0gYXdhaXQgdGhpcy5jaGVja0NvbW1vbk9wdGlvbkJ5S2V5KGtleSBhcyBrZXlvZiBJQnVpbGRUYXNrT3B0aW9uLCBvcHRpb25zW2tleV0sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGVja1JlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2hlY2tDb21tb25PcHRpb25CeUtleShrZXk6IGtleW9mIElCdWlsZFRhc2tPcHRpb24sIHZhbHVlOiBhbnksIG9wdGlvbnM6IElCdWlsZFRhc2tPcHRpb24pOiBQcm9taXNlPEJ1aWxkQ2hlY2tSZXN1bHQ+IHtcbiAgICAgICAgLy8g5LyY5YWI5L2/55So6Ieq5a6a5LmJ55qE5qCh6aqM5Ye95pWwXG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNoZWNrQnVpbGRDb21tb25PcHRpb25zQnlLZXkoa2V5LCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRDb21tb25PcHRpb25Db25maWdCeUtleShrZXksIG9wdGlvbnMpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2YWxpZDogdHJ1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlcnJvciA9IGF3YWl0IHZhbGlkYXRvck1hbmFnZXIuY2hlY2soXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGNvbmZpZy52ZXJpZnlSdWxlcyEsXG4gICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgdGhpcy5jb21tb25PcHRpb25Db25maWdbb3B0aW9ucy5wbGF0Zm9ybSBhcyBQbGF0Zm9ybV0gJiYgdGhpcy5jb21tb25PcHRpb25Db25maWdbb3B0aW9ucy5wbGF0Zm9ybSBhcyBQbGF0Zm9ybV1ba2V5XT8udmVyaWZ5S2V5IHx8IChvcHRpb25zLnBsYXRmb3JtICsgb3B0aW9ucy5wbGF0Zm9ybSksXG4gICAgICAgICk7XG4gICAgICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0OiBCdWlsZENoZWNrUmVzdWx0ID0ge1xuICAgICAgICAgICAgdmFsaWQ6IGZhbHNlLFxuICAgICAgICAgICAgbGV2ZWw6IGNvbmZpZy52ZXJpZnlMZXZlbCA9PT0gJ3dhcm4nID8gJ3dhcm4nIDogJ2Vycm9yJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHRyYW5zbGF0ZURpc3BsYXlWYWx1ZShlcnJvcikgfHwgZXJyb3IsXG4gICAgICAgIH07XG4gICAgICAgIGlmICghbG9kYXNoLmlzRXF1YWwoY29uZmlnLmRlZmF1bHQsIHZhbHVlKSkge1xuICAgICAgICAgICAgcmVzdWx0LmZpeGVkVmFsdWUgPSBjb25maWcuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagoemqjOaehOW7uuaPkuS7tuazqOWGjOeahOaehOW7uuWPguaVsFxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVWZXJpZnlPcHRpb25zKHBsYXRmb3JtOiBzdHJpbmcsIGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93biwgb3B0aW9uczogSUJ1aWxkVGFza09wdGlvbik6IElCdWlsZFRhc2tPcHRpb24ge1xuICAgICAgICBjb25zdCBuZXh0T3B0aW9ucyA9IGxvZGFzaC5jbG9uZURlZXAob3B0aW9ucyB8fCB7fSkgYXMgSUJ1aWxkVGFza09wdGlvbjtcbiAgICAgICAgbmV4dE9wdGlvbnMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICAgICAgaWYgKCFuZXh0T3B0aW9ucy5vdXRwdXROYW1lKSB7XG4gICAgICAgICAgICBuZXh0T3B0aW9ucy5vdXRwdXROYW1lID0gcGxhdGZvcm07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFuZXh0T3B0aW9ucy5wYWNrYWdlcykge1xuICAgICAgICAgICAgbmV4dE9wdGlvbnMucGFja2FnZXMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5leHRPcHRpb25zLnBhY2thZ2VzW3BsYXRmb3JtXSkge1xuICAgICAgICAgICAgbmV4dE9wdGlvbnMucGFja2FnZXNbcGxhdGZvcm1dID0ge307XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGxhdGZvcm1PcHRpb25zID0gdGhpcy5jb25maWdNYXBbcGxhdGZvcm1dPy5bcGxhdGZvcm1dPy5vcHRpb25zIHx8IHRoaXMucGxhdGZvcm1SZWdpc3RlckluZm9Qb29sLmdldChwbGF0Zm9ybSk/LmNvbmZpZz8ub3B0aW9ucztcbiAgICAgICAgaWYgKHBsYXRmb3JtT3B0aW9ucz8uW2tleV0pIHtcbiAgICAgICAgICAgIG5leHRPcHRpb25zLnBhY2thZ2VzW3BsYXRmb3JtXVtrZXldID0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAobmV4dE9wdGlvbnMgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXh0T3B0aW9ucztcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNoZWNrUGxhdGZvcm1PcHRpb25CeUtleShwbGF0Zm9ybTogc3RyaW5nLCBrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24sIG9wdGlvbnM6IElCdWlsZFRhc2tPcHRpb24pOiBQcm9taXNlPEJ1aWxkQ2hlY2tSZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgcGtnTmFtZSA9IHBsYXRmb3JtO1xuICAgICAgICBjb25zdCBidWlsZENvbmZpZyA9IHRoaXMuY29uZmlnTWFwW3BsYXRmb3JtXT8uW3BrZ05hbWVdIHx8IHRoaXMucGxhdGZvcm1SZWdpc3RlckluZm9Qb29sLmdldChwbGF0Zm9ybSk/LmNvbmZpZztcbiAgICAgICAgY29uc3QgY29uZmlnID0gYnVpbGRDb25maWc/Lm9wdGlvbnM/LltrZXldO1xuICAgICAgICBjb25zdCBydWxlcyA9IGNvbmZpZz8udmVyaWZ5UnVsZXM7XG4gICAgICAgIGlmICghY29uZmlnIHx8ICFydWxlcykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2YWxpZDogdHJ1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXJyb3IgPSBhd2FpdCB2YWxpZGF0b3JNYW5hZ2VyLmNoZWNrKFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBydWxlcyxcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICBwbGF0Zm9ybSArIHBrZ05hbWUsXG4gICAgICAgICk7XG4gICAgICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0OiBCdWlsZENoZWNrUmVzdWx0ID0ge1xuICAgICAgICAgICAgdmFsaWQ6IGZhbHNlLFxuICAgICAgICAgICAgbGV2ZWw6IGNvbmZpZy52ZXJpZnlMZXZlbCA9PT0gJ3dhcm4nID8gJ3dhcm4nIDogJ2Vycm9yJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHRyYW5zbGF0ZURpc3BsYXlWYWx1ZShlcnJvcikgfHwgZXJyb3IsXG4gICAgICAgIH07XG4gICAgICAgIGlmICghbG9kYXNoLmlzRXF1YWwoY29uZmlnLmRlZmF1bHQsIHZhbHVlKSkge1xuICAgICAgICAgICAgcmVzdWx0LmZpeGVkVmFsdWUgPSBjb25maWcuZGVmYXVsdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBjaGVja0J1aWxkT3B0aW9uKHBsYXRmb3JtOiBzdHJpbmcsIGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93biwgb3B0aW9uczogSUJ1aWxkVGFza09wdGlvbik6IFByb21pc2U8QnVpbGRDaGVja1Jlc3VsdD4ge1xuICAgICAgICBjb25zdCB2ZXJpZnlPcHRpb25zID0gdGhpcy5jcmVhdGVWZXJpZnlPcHRpb25zKHBsYXRmb3JtLCBrZXksIHZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgY29uc3QgY29tbW9uT3B0aW9ucyA9IHRoaXMuY29tbW9uT3B0aW9uQ29uZmlnW3BsYXRmb3JtXSB8fCB7fTtcbiAgICAgICAgaWYgKGtleSA9PT0gJ21haW5CdW5kbGVDb21wcmVzc2lvblR5cGUnKSB7XG4gICAgICAgICAgICBjb25zdCBzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzID0gdGhpcy5idW5kbGVDb25maWdzW3BsYXRmb3JtXT8uc3VwcG9ydE9wdGlvbnM/LmNvbXByZXNzaW9uVHlwZTtcbiAgICAgICAgICAgIGlmIChzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcHJlc3Npb25UeXBlUmVzdWx0ID0gY2hlY2tCdW5kbGVDb21wcmVzc2lvblNldHRpbmcodmFsdWUgYXMgYW55LCBzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzKTtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXByZXNzaW9uVHlwZVJlc3VsdC52YWxpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcHJlc3Npb25UeXBlUmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChidWlsZGVyQ29uZmlnLmNvbW1vbk9wdGlvbkNvbmZpZ3Nba2V5XSB8fCBjb21tb25PcHRpb25zW2tleV0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZWNrQ29tbW9uT3B0aW9uQnlLZXkoa2V5IGFzIGtleW9mIElCdWlsZFRhc2tPcHRpb24sIHZhbHVlLCB2ZXJpZnlPcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNoZWNrUGxhdGZvcm1PcHRpb25CeUtleShwbGF0Zm9ybSwga2V5LCB2YWx1ZSwgdmVyaWZ5T3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNoZWNrQnVpbGRPcHRpb25zKHBsYXRmb3JtOiBzdHJpbmcsIG9wdGlvbnM6IElCdWlsZFRhc2tPcHRpb24pOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIEJ1aWxkQ2hlY2tSZXN1bHQ+PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgQnVpbGRDaGVja1Jlc3VsdD4gPSB7fTtcbiAgICAgICAgY29uc3Qgc2NoZW1hID0gdGhpcy5jb2xsZWN0UGxhdGZvcm1Db25maWdJdGVtcyhwbGF0Zm9ybSk7XG4gICAgICAgIGNvbnN0IHZlcmlmeU9wdGlvbnMgPSBsb2Rhc2guY2xvbmVEZWVwKG9wdGlvbnMgfHwge30pIGFzIElCdWlsZFRhc2tPcHRpb247XG4gICAgICAgIHZlcmlmeU9wdGlvbnMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhzY2hlbWEuY29tbW9uKSkge1xuICAgICAgICAgICAgcmVzdWx0W2tleV0gPSBhd2FpdCB0aGlzLmNoZWNrQnVpbGRPcHRpb24ocGxhdGZvcm0sIGtleSwgKHZlcmlmeU9wdGlvbnMgYXMgYW55KVtrZXldLCB2ZXJpZnlPcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHNjaGVtYS5wbGF0Zm9ybU9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IGF3YWl0IHRoaXMuY2hlY2tCdWlsZE9wdGlvbihwbGF0Zm9ybSwga2V5LCBsb2Rhc2guZ2V0KHZlcmlmeU9wdGlvbnMsIFsncGFja2FnZXMnLCBwbGF0Zm9ybSwga2V5XSksIHZlcmlmeU9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNoZWNrUGx1Z2luT3B0aW9ucyhvcHRpb25zOiBJQnVpbGRUYXNrT3B0aW9uKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wYWNrYWdlcyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY2hlY2tSZXMgPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IHBrZ05hbWUgb2YgT2JqZWN0LmtleXMob3B0aW9ucy5wYWNrYWdlcykpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2thZ2VPcHRpb25zID0gb3B0aW9ucy5wYWNrYWdlc1twa2dOYW1lIGFzIFBsYXRmb3JtXTtcbiAgICAgICAgICAgIGlmICghcGFja2FnZU9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYnVpbGRDb25maWcgPSBwbHVnaW5NYW5hZ2VyLmNvbmZpZ01hcFtvcHRpb25zLnBsYXRmb3JtIGFzIFBsYXRmb3JtXVtwa2dOYW1lXTtcbiAgICAgICAgICAgIGlmICghYnVpbGRDb25maWcgfHwgIWJ1aWxkQ29uZmlnLm9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHBhY2thZ2VPcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIGlmICghYnVpbGRDb25maWcub3B0aW9uc1trZXldIHx8ICFidWlsZENvbmZpZy5vcHRpb25zW2tleV0udmVyaWZ5UnVsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZTogYW55ID0gcGFja2FnZU9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IGF3YWl0IHZhbGlkYXRvck1hbmFnZXIuY2hlY2soXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBidWlsZENvbmZpZy5vcHRpb25zW2tleV0udmVyaWZ5UnVsZXMhLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBwbHVnaW5NYW5hZ2VyLmNvbW1vbk9wdGlvbkNvbmZpZ1tvcHRpb25zLnBsYXRmb3JtIGFzIFBsYXRmb3JtXT8uW2tleV0/LnZlcmlmeUtleSB8fCAob3B0aW9ucy5wbGF0Zm9ybSArIHBrZ05hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKCFlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IHVzZURlZmF1bHQgPSB2YWxpZGF0b3IuY2hlY2tXaXRoSW50ZXJuYWxSdWxlKCd2YWxpZCcsIGJ1aWxkQ29uZmlnLm9wdGlvbnNba2V5XS5kZWZhdWx0KTtcbiAgICAgICAgICAgICAgICAvLyDmnInpu5jorqTlgLzkuZ/pnIDopoHlho3otbDkuIDpgY3moKHpqoxcbiAgICAgICAgICAgICAgICBpZiAodXNlRGVmYXVsdCkge1xuICAgICAgICAgICAgICAgICAgICB1c2VEZWZhdWx0ID0gIShhd2FpdCB2YWxpZGF0b3JNYW5hZ2VyLmNoZWNrKFxuICAgICAgICAgICAgICAgICAgICAgICAgYnVpbGRDb25maWcub3B0aW9uc1trZXldLmRlZmF1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBidWlsZENvbmZpZy5vcHRpb25zW2tleV0udmVyaWZ5UnVsZXMhLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbk1hbmFnZXIuY29tbW9uT3B0aW9uQ29uZmlnW29wdGlvbnMucGxhdGZvcm0gYXMgUGxhdGZvcm1dPy5ba2V5XT8udmVyaWZ5S2V5IHx8IChvcHRpb25zLnBsYXRmb3JtICsgcGtnTmFtZSksXG4gICAgICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJpZnlMZXZlbDogSUNvbnNvbGVUeXBlID0gYnVpbGRDb25maWcub3B0aW9uc1trZXldLnZlcmlmeUxldmVsIHx8ICdlcnJvcic7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyTXNnID0gKHR5cGVvZiBlcnJvciA9PT0gJ3N0cmluZycgJiYgaTE4bi50cmFuc0kxOG5OYW1lKGVycm9yKSkgfHwgZXJyb3I7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXVzZURlZmF1bHQgJiYgdmVyaWZ5TGV2ZWwgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIuZXJyb3IuY2hlY2tfZmFpbGVkJywge1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBgb3B0aW9ucy5wYWNrYWdlcy4ke3BrZ05hbWV9LiR7a2V5fWAsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkodmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyck1zZyxcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICBjaGVja1JlcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb25zb2xlVHlwZSA9ICh2ZXJpZnlMZXZlbCAhPT0gJ2Vycm9yJyAmJiBuZXdDb25zb2xlW3ZlcmlmeUxldmVsXSkgPyB2ZXJpZnlMZXZlbCA6ICd3YXJuJztcbiAgICAgICAgICAgICAgICAgICAgLy8g5pyJ5oql6ZSZ5L+h5oGv77yM5L2G5pyJ6buY6K6k5YC877yM5oql6ZSZ5ZCO5aGr5YWF6buY6K6k5YC8XG4gICAgICAgICAgICAgICAgICAgIG5ld0NvbnNvbGVbY29uc29sZVR5cGVdKGkxOG4udCgnYnVpbGRlci53YXJuLmNoZWNrX2ZhaWxlZF93aXRoX25ld192YWx1ZScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogYG9wdGlvbnMucGFja2FnZXMuJHtwa2dOYW1lfS4ke2tleX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IEpTT04uc3RyaW5naWZ5KHZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJNc2csXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZTogSlNPTi5zdHJpbmdpZnkoYnVpbGRDb25maWcub3B0aW9uc1trZXldLmRlZmF1bHQpLFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIGxvZGFzaC5zZXQocGFja2FnZU9wdGlvbnMsIGtleSwgYnVpbGRDb25maWcub3B0aW9uc1trZXldLmRlZmF1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGVja1JlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2hvdWxkR2VuZXJhdGVPcHRpb25zKHBsYXRmb3JtOiBQbGF0Zm9ybSB8IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBjdXN0b21CdWlsZFN0YWdlTWFwID0gdGhpcy5jdXN0b21CdWlsZFN0YWdlc1twbGF0Zm9ybV07XG4gICAgICAgIHJldHVybiAhIU9iamVjdC52YWx1ZXMoY3VzdG9tQnVpbGRTdGFnZU1hcCkuZmluZCgoc3RhZ2VzKSA9PiBzdGFnZXMuZmluZCgoc3RhZ2VJdGVtID0+IHN0YWdlSXRlbS5yZXF1aXJlZEJ1aWxkT3B0aW9ucyAhPT0gZmFsc2UpKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5bmz5Y+w6buY6K6k5YC8XG4gICAgICogQHBhcmFtIHBsYXRmb3JtXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGdldE9wdGlvbnNCeVBsYXRmb3JtPFAgZXh0ZW5kcyBQbGF0Zm9ybSB8IHN0cmluZz4ocGxhdGZvcm06IFApOiBQcm9taXNlPElCdWlsZFRhc2tPcHRpb24+IHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGNsb25lQ29uZmlnVmFsdWUoYXdhaXQgYnVpbGRlckNvbmZpZy5nZXRQcm9qZWN0PElCdWlsZFRhc2tPcHRpb24+KGBwbGF0Zm9ybXMuJHtwbGF0Zm9ybX1gKSk7XG4gICAgICAgIGNvbnN0IGNvbW1vbk9wdGlvbnMgPSBjbG9uZUNvbmZpZ1ZhbHVlKGF3YWl0IGJ1aWxkZXJDb25maWcuZ2V0UHJvamVjdDxJQnVpbGRDb21tYW5kT3B0aW9uPihgY29tbW9uYCkpO1xuICAgICAgICBjb21tb25PcHRpb25zLnBsYXRmb3JtID0gcGxhdGZvcm07XG4gICAgICAgIGNvbW1vbk9wdGlvbnMub3V0cHV0TmFtZSA9IHBsYXRmb3JtO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgY29tbW9uT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFRleHR1cmVQbGF0Zm9ybUNvbmZpZ3MoKTogUmVjb3JkPHN0cmluZywgSVRleHR1cmVDb21wcmVzc0NvbmZpZz4ge1xuICAgICAgICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIElUZXh0dXJlQ29tcHJlc3NDb25maWc+ID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMucGxhdGZvcm1Db25maWcpLmZvckVhY2goKHBsYXRmb3JtKSA9PiB7XG4gICAgICAgICAgICByZXN1bHRbcGxhdGZvcm1dID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IHRyYW5zbGF0ZURpc3BsYXlWYWx1ZSh0aGlzLnBsYXRmb3JtQ29uZmlnW3BsYXRmb3JtXS5uYW1lIHx8IHBsYXRmb3JtKSB8fCBwbGF0Zm9ybSxcbiAgICAgICAgICAgICAgICB0ZXh0dXJlQ29tcHJlc3NDb25maWc6IHRoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLnRleHR1cmUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNsb25lRGlzcGxheU9wdGlvbnMob3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIElCdWlsZGVyQ29uZmlnSXRlbT4pOiBSZWNvcmQ8c3RyaW5nLCBJQnVpbGRlckNvbmZpZ0l0ZW0+IHtcbiAgICAgICAgcmV0dXJuIGxvZGFzaC5jbG9uZURlZXAob3B0aW9ucyB8fCB7fSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbG9uZUNvbmZpZ0l0ZW0oY29uZmlnOiBJQnVpbGRlckNvbmZpZ0l0ZW0gJiB7IHZlcmlmeUtleT86IHN0cmluZyB9KTogSUJ1aWxkZXJDb25maWdJdGVtIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IGxvZGFzaC5jbG9uZURlZXAoY29uZmlnKSBhcyBJQnVpbGRlckNvbmZpZ0l0ZW0gJiB7IHZlcmlmeUtleT86IHN0cmluZyB9O1xuICAgICAgICBkZWxldGUgaXRlbS52ZXJpZnlLZXk7XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXBwbHlTdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzKHBsYXRmb3JtOiBzdHJpbmcsIGNvbW1vbjogUmVjb3JkPHN0cmluZywgSUJ1aWxkZXJDb25maWdJdGVtPikge1xuICAgICAgICBjb25zdCBzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzID0gdGhpcy5idW5kbGVDb25maWdzW3BsYXRmb3JtXT8uc3VwcG9ydE9wdGlvbnM/LmNvbXByZXNzaW9uVHlwZTtcbiAgICAgICAgaWYgKCFzdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzIHx8ICFjb21tb24ubWFpbkJ1bmRsZUNvbXByZXNzaW9uVHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihjb21tb24ubWFpbkJ1bmRsZUNvbXByZXNzaW9uVHlwZSwge1xuICAgICAgICAgICAgdHlwZTogJ2VudW0nLFxuICAgICAgICAgICAgaXRlbXM6IHN1cHBvcnRlZENvbXByZXNzaW9uVHlwZXMubWFwKCh2YWx1ZSkgPT4gKHtcbiAgICAgICAgICAgICAgICBsYWJlbDogdHJhbnNsYXRlRGlzcGxheVZhbHVlKEJ1bmRsZWNvbXByZXNzaW9uVHlwZU1hcFt2YWx1ZSBhcyBrZXlvZiB0eXBlb2YgQnVuZGxlY29tcHJlc3Npb25UeXBlTWFwXSkgfHwgdmFsdWUsXG4gICAgICAgICAgICAgICAgbGFiZWxJMThuS2V5OiBCdW5kbGVjb21wcmVzc2lvblR5cGVNYXBbdmFsdWUgYXMga2V5b2YgdHlwZW9mIEJ1bmRsZWNvbXByZXNzaW9uVHlwZU1hcF0sXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICB9KSksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOijhemFjeafkOW5s+WPsOeahOWOn+Wni+mFjee9rumhuShJQnVpbGRlckNvbmZpZ0l0ZW0pOlxuICAgICAqICAgY29tbW9uID0gQ0xJIOWGhee9riBjb21tb24g6aG5ICsg6K+l5bmz5Y+wIGNvbW1vbk9wdGlvbnMg6KaG55uWKOW3suW6lOeUqOaUr+aMgeeahOWOi+e8qeexu+Weiyk7XG4gICAgICogICBwbGF0Zm9ybU9wdGlvbnMgPSDlubPlj7AgY29uZmlnLm9wdGlvbnPjgIJcbiAgICAgKiBrZXkg6aG65bqP5Y2z5pi+56S66aG65bqP44CC5L6b5p6E5bu66Z2i5p2/IHNjaGVtYShnZXRQbGF0Zm9ybUJ1aWxkU2NoZW1hKeS4jumFjee9ruagoemqjChjaGVja0J1aWxkT3B0aW9ucynlhbHnlKjjgIJcbiAgICAgKi9cbiAgICBwcml2YXRlIGNvbGxlY3RQbGF0Zm9ybUNvbmZpZ0l0ZW1zKHBsYXRmb3JtOiBQbGF0Zm9ybSB8IHN0cmluZyk6IHtcbiAgICAgICAgY29tbW9uOiBSZWNvcmQ8c3RyaW5nLCBJQnVpbGRlckNvbmZpZ0l0ZW0+O1xuICAgICAgICBwbGF0Zm9ybU9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIElCdWlsZGVyQ29uZmlnSXRlbT47XG4gICAgICAgIHN1cHBvcnRQbGF0Zm9ybXM/OiBJUGxhdGZvcm1CdWlsZFBsdWdpbkNvbmZpZ1snc3VwcG9ydFBsYXRmb3JtcyddO1xuICAgIH0ge1xuICAgICAgICBjb25zdCBjb21tb246IFJlY29yZDxzdHJpbmcsIElCdWlsZGVyQ29uZmlnSXRlbT4gPSB7fTtcbiAgICAgICAgY29uc3QgcGxhdGZvcm1Db21tb25PcHRpb25zID0gdGhpcy5jb21tb25PcHRpb25Db25maWdbcGxhdGZvcm1dIHx8IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhidWlsZGVyQ29uZmlnLmNvbW1vbk9wdGlvbkNvbmZpZ3MpKSB7XG4gICAgICAgICAgICBjb21tb25ba2V5XSA9IHRoaXMuY2xvbmVDb25maWdJdGVtKHBsYXRmb3JtQ29tbW9uT3B0aW9uc1trZXldIHx8IGJ1aWxkZXJDb25maWcuY29tbW9uT3B0aW9uQ29uZmlnc1trZXldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhwbGF0Zm9ybUNvbW1vbk9wdGlvbnMpKSB7XG4gICAgICAgICAgICBpZiAoIWNvbW1vbltrZXldKSB7XG4gICAgICAgICAgICAgICAgY29tbW9uW2tleV0gPSB0aGlzLmNsb25lQ29uZmlnSXRlbShwbGF0Zm9ybUNvbW1vbk9wdGlvbnNba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g5bqU55So5pSv5oyB55qE5Y6L57yp57G75Z6LXG4gICAgICAgIHRoaXMuYXBwbHlTdXBwb3J0ZWRDb21wcmVzc2lvblR5cGVzKHBsYXRmb3JtLCBjb21tb24pO1xuXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9ICh0aGlzLmNvbmZpZ01hcFtwbGF0Zm9ybV0/LltwbGF0Zm9ybV0gfHwgdGhpcy5wbGF0Zm9ybVJlZ2lzdGVySW5mb1Bvb2wuZ2V0KHBsYXRmb3JtKT8uY29uZmlnKSBhcyBJUGxhdGZvcm1CdWlsZFBsdWdpbkNvbmZpZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbW1vbixcbiAgICAgICAgICAgIHBsYXRmb3JtT3B0aW9uczogdGhpcy5jbG9uZURpc3BsYXlPcHRpb25zKGNvbmZpZz8ub3B0aW9ucyksXG4gICAgICAgICAgICBzdXBwb3J0UGxhdGZvcm1zOiBsb2Rhc2guY2xvbmVEZWVwKGNvbmZpZz8uc3VwcG9ydFBsYXRmb3JtcyksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGdldFBsYXRmb3JtQnVpbGRTY2hlbWEocGxhdGZvcm06IFBsYXRmb3JtIHwgc3RyaW5nKTogUGxhdGZvcm1CdWlsZFNjaGVtYSB7XG4gICAgICAgIGlmICghdGhpcy5wbGF0Zm9ybUNvbmZpZ1twbGF0Zm9ybV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2FuIG5vdCBmaW5kIHBsYXRmb3JtIGNvbmZpZyBmb3IgJHtwbGF0Zm9ybX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgY29tbW9uLCBwbGF0Zm9ybU9wdGlvbnMsIHN1cHBvcnRQbGF0Zm9ybXMgfSA9IHRoaXMuY29sbGVjdFBsYXRmb3JtQ29uZmlnSXRlbXMocGxhdGZvcm0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tbW9uOiBjcmVhdGVCdWlsZGVyUmVuZGVyU2NoZW1hKGNvbW1vbiwgU3RyaW5nKHBsYXRmb3JtKSksXG4gICAgICAgICAgICBwbGF0Zm9ybU9wdGlvbnM6IGNyZWF0ZUJ1aWxkZXJSZW5kZXJTY2hlbWEocGxhdGZvcm1PcHRpb25zLCBTdHJpbmcocGxhdGZvcm0pKSxcbiAgICAgICAgICAgIHN1cHBvcnRQbGF0Zm9ybXMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIHF1ZXJ5UGxhdGZvcm1Db25maWcoKTogUGxhdGZvcm1Db25maWdJdGVtW10ge1xuICAgICAgICAvLyBIQUNLKOS4tOaXtik6IGZiLWluc3RhbnQtZ2FtZXMgLyBnb29nbGUtcGxheSDmmoLkuI3lr7nlpJYs5Zyo5bmz5Y+w5p+l6K+i55qE5oC75Ye65Y+j5aSE6L+H5ruk5o6J44CCXG4gICAgICAgIC8vICAgUGluSyDmnoTlu7rpnaLmnb8o6LWwIHBsdWdpbk1hbmFnZXIucXVlcnlQbGF0Zm9ybUNvbmZpZynjgIFjb3JlL2xpYiDmjqXlj6PnrYnmiYDmnInmtojotLnmlrnpg73nu4/mraTmlrnms5UsXG4gICAgICAgIC8vICAg57uf5LiA6ZqQ6JeP44CC5b6F5bmz5Y+w5bCx57uq5ZCO56e76Zmk5q2k6L+H5ruk44CCXG4gICAgICAgIC8vIGNvbnN0IEhJRERFTl9QTEFURk9STVMgPSBuZXcgU2V0KFsnZmItaW5zdGFudC1nYW1lcycsICdnb29nbGUtcGxheSddKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHRoaXMucGxhdGZvcm1Db25maWcpXG4gICAgICAgICAgICAvLyAuZmlsdGVyKChbcGxhdGZvcm1dKSA9PiAhSElEREVOX1BMQVRGT1JNUy5oYXMocGxhdGZvcm0pKVxuICAgICAgICAgICAgLm1hcCgoW3BsYXRmb3JtLCBjb25maWddKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXN0b21TdGFnZXMgPSB0aGlzLmN1c3RvbUJ1aWxkU3RhZ2VzW3BsYXRmb3JtXTtcbiAgICAgICAgICAgIGNvbnN0IHN0YWdlQ29uZmlncyA9IGN1c3RvbVN0YWdlc1xuICAgICAgICAgICAgICAgID8gdGhpcy5zb3J0UGtnTmFtZVdpZHRoUHJpb3JpdHkoT2JqZWN0LmtleXMoY3VzdG9tU3RhZ2VzKSlcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoKHBrZ05hbWUpID0+IGN1c3RvbVN0YWdlc1twa2dOYW1lXSB8fCBbXSlcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoc3RhZ2UpID0+IGxvZGFzaC5jbG9uZURlZXAoc3RhZ2UpKVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiB0cmFuc2xhdGVEaXNwbGF5VmFsdWUoY29uZmlnLm5hbWUgfHwgcGxhdGZvcm0pIHx8IHBsYXRmb3JtLFxuICAgICAgICAgICAgICAgIHBsYXRmb3JtVHlwZTogY29uZmlnLnBsYXRmb3JtVHlwZSxcbiAgICAgICAgICAgICAgICBpc05hdGl2ZTogTkFUSVZFX1BMQVRGT1JNLmluY2x1ZGVzKHBsYXRmb3JtIGFzIFBsYXRmb3JtKSxcbiAgICAgICAgICAgICAgICBkb2M6IGNvbmZpZy5kb2MsXG4gICAgICAgICAgICAgICAgLy8g5omT5YyF5bmz5Y+w6Lev5b6EXG4gICAgICAgICAgICAgICAgcGx1Z2luUGF0aDogY29uZmlnLnBsdWdpblBhdGggfHwgdGhpcy5wbGF0Zm9ybVJlZ2lzdGVySW5mb1Bvb2wuZ2V0KHBsYXRmb3JtKT8ucGF0aCB8fCAnJyxcbiAgICAgICAgICAgICAgICBjcmVhdGVUZW1wbGF0ZUxhYmVsOiBjb25maWcuY3JlYXRlVGVtcGxhdGVMYWJlbCAmJiB0cmFuc2xhdGVEaXNwbGF5VmFsdWUoY29uZmlnLmNyZWF0ZVRlbXBsYXRlTGFiZWwpLFxuICAgICAgICAgICAgICAgIHN1cHBvcnRUZXh0dXJlQ29tcHJlc3M6ICEhY29uZmlnLnRleHR1cmUsXG4gICAgICAgICAgICAgICAgY3VzdG9tQnVpbGRTdGFnZXM6IHN0YWdlQ29uZmlncz8ubGVuZ3RoID8gc3RhZ2VDb25maWdzIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFJlZ2lzdGVyZWRQbGF0Zm9ybXMoKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5wbGF0Zm9ybUNvbmZpZyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+i5omA5pyJ5bmz5Y+w55qEIEJ1bmRsZSDphY3nva7vvIzmjInlubPlj7DnsbvlnovliIbnu4RcbiAgICAgKi9cbiAgICBwdWJsaWMgcXVlcnlCdW5kbGVDb25maWcoKTogUmVjb3JkPHN0cmluZywgQnVuZGxlUXVlcnlDb25maWc+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBCdW5kbGVRdWVyeUNvbmZpZz4gPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IFtwbGF0Zm9ybSwgYnVuZGxlQ29uZmlnXSBvZiBPYmplY3QuZW50cmllcyh0aGlzLmJ1bmRsZUNvbmZpZ3MpKSB7XG4gICAgICAgICAgICBjb25zdCBwbGF0Zm9ybVR5cGUgPSBidW5kbGVDb25maWcucGxhdGZvcm1UeXBlO1xuICAgICAgICAgICAgaWYgKCFyZXN1bHRbcGxhdGZvcm1UeXBlXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVJbmZvID0gQnVuZGxlUGxhdGZvcm1UeXBlc1twbGF0Zm9ybVR5cGUgYXMga2V5b2YgdHlwZW9mIEJ1bmRsZVBsYXRmb3JtVHlwZXNdO1xuICAgICAgICAgICAgICAgIHJlc3VsdFtwbGF0Zm9ybVR5cGVdID0ge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogdHlwZUluZm8gPyBpMThuLnRyYW5zSTE4bk5hbWUodHlwZUluZm8uZGlzcGxheU5hbWUpIDogcGxhdGZvcm1UeXBlLFxuICAgICAgICAgICAgICAgICAgICBwbGF0Zm9ybUNvbmZpZ3M6IHt9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBsYXRmb3JtQ29uZmlnID0gdGhpcy5wbGF0Zm9ybUNvbmZpZ1twbGF0Zm9ybV07XG4gICAgICAgICAgICBjb25zdCBwbGF0Zm9ybU5hbWUgPSB0cmFuc2xhdGVEaXNwbGF5VmFsdWUocGxhdGZvcm1Db25maWc/Lm5hbWUgfHwgcGxhdGZvcm0pIHx8IHBsYXRmb3JtO1xuICAgICAgICAgICAgcmVzdWx0W3BsYXRmb3JtVHlwZV0ucGxhdGZvcm1Db25maWdzW3BsYXRmb3JtXSA9IHtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybU5hbWUsXG4gICAgICAgICAgICAgICAgcGxhdGZvcm1UeXBlOiBidW5kbGVDb25maWcucGxhdGZvcm1UeXBlLFxuICAgICAgICAgICAgICAgIHN1cHBvcnRPcHRpb25zOiBidW5kbGVDb25maWcuc3VwcG9ydE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LmiYDmnInlubPlj7DnmoTnurnnkIbljovnvKnphY3nva7vvIzmjInnurnnkIbljovnvKnlubPlj7DnsbvlnovliIbnu4RcbiAgICAgKi9cbiAgICBwdWJsaWMgcXVlcnlUZXh0dXJlQ29tcHJlc3NDb25maWcoKTogVGV4dHVyZUNvbXByZXNzRnVsbFJlbmRlckNvbmZpZyB7XG4gICAgICAgIGNvbnN0IHBsYXRmb3JtUmVuZGVyQ29uZmlnczogUmVjb3JkPHN0cmluZywgVGV4dHVyZUNvbXByZXNzUmVuZGVyQ29uZmlnPiA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgW3BsYXRmb3JtLCBjb25maWddIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMucGxhdGZvcm1Db25maWcpKSB7XG4gICAgICAgICAgICBpZiAoIWNvbmZpZy50ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwbGF0Zm9ybVR5cGUgPSBjb25maWcudGV4dHVyZS5wbGF0Zm9ybVR5cGU7XG4gICAgICAgICAgICBpZiAoIXBsYXRmb3JtUmVuZGVyQ29uZmlnc1twbGF0Zm9ybVR5cGVdKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBJbmZvID0gY29uZmlnR3JvdXBzW3BsYXRmb3JtVHlwZV07XG4gICAgICAgICAgICAgICAgcGxhdGZvcm1SZW5kZXJDb25maWdzW3BsYXRmb3JtVHlwZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBncm91cEluZm8gPyB0cmFuc2xhdGVEaXNwbGF5VmFsdWUoZ3JvdXBJbmZvLmRpc3BsYXlOYW1lKSB8fCBncm91cEluZm8uZGlzcGxheU5hbWUgOiBwbGF0Zm9ybVR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHBsYXRmb3JtQ29uZmlnczoge30sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGxhdGZvcm1OYW1lID0gdHJhbnNsYXRlRGlzcGxheVZhbHVlKGNvbmZpZy5uYW1lIHx8IHBsYXRmb3JtKSB8fCBwbGF0Zm9ybTtcbiAgICAgICAgICAgIHBsYXRmb3JtUmVuZGVyQ29uZmlnc1twbGF0Zm9ybVR5cGVdLnBsYXRmb3JtQ29uZmlnc1twbGF0Zm9ybV0gPSB7XG4gICAgICAgICAgICAgICAgcGxhdGZvcm1OYW1lLFxuICAgICAgICAgICAgICAgIHBsYXRmb3JtVHlwZTogY29uZmlnLnRleHR1cmUucGxhdGZvcm1UeXBlLFxuICAgICAgICAgICAgICAgIHN1cHBvcnQ6IGNvbmZpZy50ZXh0dXJlLnN1cHBvcnQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbmZpZ0dyb3VwcyxcbiAgICAgICAgICAgIHRleHR1cmVGb3JtYXRDb25maWdzLFxuICAgICAgICAgICAgZm9ybWF0c0luZm8sXG4gICAgICAgICAgICBkZWZhdWx0U3VwcG9ydCxcbiAgICAgICAgICAgIHBsYXRmb3JtUmVuZGVyQ29uZmlncyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bluKbmnInpkqnlrZDlh73mlbDnmoTmnoTlu7rpmLbmrrXku7vliqFcbiAgICAgKiBAcGFyYW0gcGxhdGZvcm0gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHVibGljIGdldEJ1aWxkU3RhZ2VXaXRoSG9va1Rhc2tzKHBsYXRmb3JtOiBQbGF0Zm9ybSB8IHN0cmluZywgdGFza05hbWU6IHN0cmluZyk6IElCdWlsZFN0YWdlSXRlbSB8IG51bGwge1xuICAgICAgICBjb25zdCBjdXN0b21TdGFnZXMgPSB0aGlzLmN1c3RvbUJ1aWxkU3RhZ2VzW3BsYXRmb3JtXTtcbiAgICAgICAgaWYgKCFjdXN0b21TdGFnZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBrZ05hbWVPcmRlciA9IHRoaXMuc29ydFBrZ05hbWVXaWR0aFByaW9yaXR5KE9iamVjdC5rZXlzKGN1c3RvbVN0YWdlcykpO1xuICAgICAgICBmb3IgKGNvbnN0IHBrZ05hbWUgb2YgcGtnTmFtZU9yZGVyKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFnZSA9IGN1c3RvbVN0YWdlc1twa2dOYW1lXS5maW5kKChpdGVtOiBJQnVpbGRTdGFnZUl0ZW0pID0+IGl0ZW0uaG9vayA9PT0gdGFza05hbWUpO1xuICAgICAgICAgICAgaWYgKHN0YWdlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouafkOS4quW5s+WPsOeahOmYtuauteaAp+S7u+WKoeaMiemSrumFjee9ruS/oeaBr1xuICAgICAqIEBwYXJhbSBwbGF0Zm9ybVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRCdWlsZFN0YWdlQ29uZmlnQnlQbGF0Zm9ybShwbGF0Zm9ybTogUGxhdGZvcm0pIHtcbiAgICAgICAgaWYgKCF0aGlzLmN1c3RvbUJ1aWxkU3RhZ2VzW3BsYXRmb3JtXSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgICAgIGlmICh0aGlzLmN1c3RvbUJ1aWxkU3RhZ2VzW3BsYXRmb3JtXSkge1xuICAgICAgICAgICAgcmVzdWx0LmJ1dHRvbnMgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHBrZ05hbWVzID0gT2JqZWN0LmtleXModGhpcy5jdXN0b21CdWlsZFN0YWdlc1twbGF0Zm9ybV0pO1xuICAgICAgICAgICAgaWYgKHBrZ05hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHBrZ05hbWVzLnNvcnQoKGEsIGIpID0+IHRoaXMucGtnUHJpb3JpdGllc1tiXSAtIHRoaXMucGtnUHJpb3JpdGllc1thXSk7XG4gICAgICAgICAgICAgICAgcGtnTmFtZXMuZm9yRWFjaCgocGtnTmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBidXR0b25zID0gdGhpcy5jdXN0b21CdWlsZFN0YWdlc1twbGF0Zm9ybV1bcGtnTmFtZV1cbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGNvbmZpZykgPT4gIWNvbmZpZy5oaWRkZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKChjb25maWcpID0+IGxvZGFzaC5jbG9uZURlZXAoY29uZmlnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5idXR0b25zLnB1c2goLi4uYnV0dG9ucyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICog5qC55o2u5o+S5Lu25p2D6YeN5Lyg5Y+C55qE5o+S5Lu25pWw57uEXG4gICAgICogQHBhcmFtIHBrZ05hbWVzIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByaXZhdGUgc29ydFBrZ05hbWVXaWR0aFByaW9yaXR5KHBrZ05hbWVzOiBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4gcGtnTmFtZXMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgLy8g5bmz5Y+w5p6E5bu65o+S5Lu255qE6aG65bqP5aeL57uI5Zyo5aSW6YOo5rOo5YaM55qE5Lu75oSP5o+S5Lu25LmL5LiKXG4gICAgICAgICAgICBpZiAoIVBMQVRGT1JNUy5pbmNsdWRlcyhhKSAmJiBQTEFURk9STVMuaW5jbHVkZXMoYikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoUExBVEZPUk1TLmluY2x1ZGVzKGEpICYmICFQTEFURk9STVMuaW5jbHVkZXMoYikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wa2dQcmlvcml0aWVzW2JdIC0gdGhpcy5wa2dQcmlvcml0aWVzW2FdO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5blubPlj7Dmj5Lku7bnmoTmnoTlu7rot6/lvoTkv6Hmga9cbiAgICAgKiBAcGFyYW0gcGxhdGZvcm1cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0SG9va3NJbmZvKHBsYXRmb3JtOiBQbGF0Zm9ybSB8IHN0cmluZyk6IElCdWlsZEhvb2tzSW5mbyB7XG4gICAgICAgIC8vIOS4uuS6huS/nemanOaPkuS7tueahOWFiOWQjuazqOWGjOmhuuW6j++8jOmHh+eUqOS6huaVsOe7hOeahOaWueW8j+S8oOmAklxuICAgICAgICBjb25zdCByZXN1bHQ6IElCdWlsZEhvb2tzSW5mbyA9IHtcbiAgICAgICAgICAgIHBrZ05hbWVPcmRlcjogW10sXG4gICAgICAgICAgICBpbmZvczoge30sXG4gICAgICAgIH07XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuYnVpbGRlclBhdGhzTWFwW3BsYXRmb3JtXSkuZm9yRWFjaCgocGtnTmFtZSkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0LmluZm9zW3BrZ05hbWVdID0ge1xuICAgICAgICAgICAgICAgIHBhdGg6IHRoaXMuYnVpbGRlclBhdGhzTWFwW3BsYXRmb3JtXVtwa2dOYW1lXSxcbiAgICAgICAgICAgICAgICBpbnRlcm5hbDogcGtnTmFtZSA9PT0gcGxhdGZvcm0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0LnBrZ05hbWVPcmRlciA9IHRoaXMuc29ydFBrZ05hbWVXaWR0aFByaW9yaXR5KE9iamVjdC5rZXlzKHJlc3VsdC5pbmZvcykpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRCdWlsZFRlbXBsYXRlQ29uZmlnKHBsYXRmb3JtOiBzdHJpbmcpOiBCdWlsZFRlbXBsYXRlQ29uZmlnIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5idWlsZFRlbXBsYXRlQ29uZmlnTWFwW3RoaXMucGxhdGZvcm1Db25maWdbcGxhdGZvcm1dLmNyZWF0ZVRlbXBsYXRlTGFiZWxdO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbG9kYXNoLmNsb25lRGVlcChjb25maWcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagueaNruexu+Wei+iOt+WPluWvueW6lOeahOaJp+ihjOaWueazlVxuICAgICAqIEBwYXJhbSB0eXBlIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBjcmVhdGVCdWlsZFRlbXBsYXRlKG5hbWVPclBsYXRmb3JtOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgcGxhdGZvcm1Db25maWcgPSB0aGlzLnBsYXRmb3JtQ29uZmlnW25hbWVPclBsYXRmb3JtXTtcbiAgICAgICAgaWYgKHBsYXRmb3JtQ29uZmlnKSB7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVUZW1wbGF0ZUxhYmVsID0gcGxhdGZvcm1Db25maWcuY3JlYXRlVGVtcGxhdGVMYWJlbDtcbiAgICAgICAgICAgIGlmICghY3JlYXRlVGVtcGxhdGVMYWJlbCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgbm8gYnVpbGQgdGVtcGxhdGUgZm9yICR7bmFtZU9yUGxhdGZvcm19YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuYW1lT3JQbGF0Zm9ybSA9IGNyZWF0ZVRlbXBsYXRlTGFiZWw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0ZW1wbGF0ZUNvbmZpZyA9IHRoaXMuYnVpbGRUZW1wbGF0ZUNvbmZpZ01hcFtuYW1lT3JQbGF0Zm9ybV07XG4gICAgICAgIGlmICghdGVtcGxhdGVDb25maWcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgbm8gYnVpbGQgdGVtcGxhdGUgZm9yICR7bmFtZU9yUGxhdGZvcm19YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBidWlsZFRlbXBsYXRlRGlyID0gYnVpbGRlckNvbmZpZy5idWlsZFRlbXBsYXRlRGlyO1xuICAgICAgICBjb25zdCB2ZXJzaW9uS2V5ID0gdGVtcGxhdGVDb25maWcucGtnTmFtZSB8fCBuYW1lT3JQbGF0Zm9ybTtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gam9pbihidWlsZFRlbXBsYXRlRGlyLCB0ZW1wbGF0ZUNvbmZpZy5kaXJuYW1lIHx8IHZlcnNpb25LZXkpO1xuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRlbXBsYXRlQ29uZmlnLnRlbXBsYXRlcy5tYXAoYXN5bmMgKGluZm8pID0+IGNvcHkoaW5mby5wYXRoLCBqb2luKHRhcmdldCwgaW5mby5kZXN0VXJsKSkpKTtcblxuICAgICAgICBjb25zdCB0ZW1wbGF0ZVZlcnNpb25QYXRoID0gam9pbihidWlsZFRlbXBsYXRlRGlyLCAndGVtcGxhdGVzLXZlcnNpb24uanNvbicpO1xuICAgICAgICBsZXQgY29udGVudHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgICAgICBbdmVyc2lvbktleV06IHRlbXBsYXRlQ29uZmlnLnZlcnNpb24sXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmModGVtcGxhdGVWZXJzaW9uUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHZlcnNpb25zID0gYXdhaXQgcmVhZEpTT04odGVtcGxhdGVWZXJzaW9uUGF0aCk7XG4gICAgICAgICAgICBpZiAodmVyc2lvbnNbdmVyc2lvbktleV0gPT09IHRlbXBsYXRlQ29uZmlnLnZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJHt2ZXJzaW9uS2V5fSAke2kxOG4udCgnYnVpbGRlci50aXBzLmNyZWF0ZV90ZW1wbGF0ZV9zdWNjZXNzJyl9KHtsaW5rKCR7dGFyZ2V0fSl9KWApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnRzID0gT2JqZWN0LmFzc2lnbih7fSwgdmVyc2lvbnMsIGNvbnRlbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IG91dHB1dEpTT04odGVtcGxhdGVWZXJzaW9uUGF0aCwgY29udGVudHMsIHtcbiAgICAgICAgICAgIHNwYWNlczogNCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYCR7dmVyc2lvbktleX0gJHtpMThuLnQoJ2J1aWxkZXIudGlwcy5jcmVhdGVfdGVtcGxhdGVfc3VjY2VzcycpfSh7bGluaygke3RhcmdldH0pfSlgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QXNzZXRIYW5kbGVycyh0eXBlOiBJQ3VzdG9tQXNzZXRIYW5kbGVyVHlwZSkge1xuICAgICAgICBjb25zdCBwa2dOYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuYXNzZXRIYW5kbGVyc1t0eXBlXSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwa2dOYW1lT3JkZXI6IHRoaXMuc29ydFBrZ05hbWVXaWR0aFByaW9yaXR5KHBrZ05hbWVzKSxcbiAgICAgICAgICAgIGhhbmRsZXM6IHRoaXMuYXNzZXRIYW5kbGVyc1t0eXBlXSxcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBwbHVnaW5NYW5hZ2VyID0gbmV3IFBsdWdpbk1hbmFnZXIoKTtcbiJdfQ==