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
