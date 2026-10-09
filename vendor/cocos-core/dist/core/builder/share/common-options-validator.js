"use strict";
/**
 * 校验构建通用配置参数
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.overwriteModuleConfig = void 0;
exports.checkScenes = checkScenes;
exports.checkStartScene = checkStartScene;
exports.calcValidOutputName = calcValidOutputName;
exports.checkConflict = checkConflict;
exports.generateNewOutputName = generateNewOutputName;
exports.checkBuildPathIsInvalid = checkBuildPathIsInvalid;
exports.getDefaultScenes = getDefaultScenes;
exports.getDefaultStartScene = getDefaultStartScene;
exports.checkBuildCommonOptionsByKey = checkBuildCommonOptionsByKey;
exports.checkBuildCommonOptions = checkBuildCommonOptions;
exports.checkBundleCompressionSetting = checkBundleCompressionSetting;
exports.handleOverwriteProjectSettings = handleOverwriteProjectSettings;
exports.fillIncludeModulesFromProjectConfig = fillIncludeModulesFromProjectConfig;
exports.checkProjectSetting = checkProjectSetting;
const path_1 = require("path");
const bundle_utils_1 = require("./bundle-utils");
const platforms_options_1 = require("./platforms-options");
const i18n_1 = __importDefault(require("../../base/i18n"));
const utils_1 = __importDefault(require("../../base/utils"));
const asset_1 = __importDefault(require("../../assets/manager/asset"));
const engine_1 = require("../../engine");
const builder_config_1 = __importDefault(require("./builder-config"));
const utils_2 = require("./utils");
const validator_manager_1 = require("./validator-manager");
exports.overwriteModuleConfig = {
    physics: {
        match: (key) => {
            return key.startsWith('physics-') && !key.startsWith('physics-2d');
        },
        default: 'inherit-project-setting',
    },
    'physics-2d': {
        match: (key) => {
            return key.startsWith('physics-2d-');
        },
        default: 'inherit-project-setting',
    },
};
/**
 * 校验场景数据
 * @returns 校验结果
 * @param scenes
 */
function checkScenes(scenes) {
    if (!Array.isArray(scenes) || !scenes.length) {
        return new Error('Scenes is empty');
    }
    const validScenes = scenes.filter((scene) => scene && scene.uuid);
    if (validScenes.length !== scenes.length) {
        return new Error(i18n_1.default.t('builder.error.missing_scenes'));
    }
    const res = validScenes.map((scene) => asset_1.default.queryUrl(scene.uuid));
    const invalidIndex = res.findIndex((url) => !url);
    if (invalidIndex !== -1) {
        return new Error(i18n_1.default.t('builder.error.missing_scenes', {
            url: validScenes[invalidIndex].url,
        }));
    }
    return true;
}
/**
  * 确认初始场景对错
  * @param uuidOrUrl
  */
function checkStartScene(uuidOrUrl) {
    const asset = asset_1.default.queryAsset(uuidOrUrl);
    if (!asset) {
        return new Error(`can not find asset by uuid or url ${uuidOrUrl}`);
    }
    const bundleDirInfos = asset_1.default.queryAssets({ isBundle: true });
    if (bundleDirInfos.find((info) => asset.url.startsWith(info.url + '/'))) {
        return new Error(`asset ${uuidOrUrl} is in bundle, can not be set as start scene`);
    }
    return true;
}
/**
  * 根据输入的文件夹和目标名称计算不和本地冲突的文件地址
  * @param root
  * @param dirName
  */
async function calcValidOutputName(root, dirName, platform, id) {
    if (!root || !dirName) {
        return '';
    }
    let dest = (0, path_1.join)(utils_1.default.Path.resolveToRaw(root), dirName);
    dest = utils_1.default.File.getName(dest);
    return (0, path_1.basename)(dest);
}
// 创建 taskMap 中 buildPath 字典
function createBuildPathDict(taskMap) {
    const buildPathDict = {};
    for (const key in taskMap) {
        const task = taskMap[key];
        const taskBuildPath = utils_1.default.Path.resolveToRaw(task.options.buildPath);
        if (!buildPathDict[taskBuildPath]) {
            buildPathDict[taskBuildPath] = [];
        }
        buildPathDict[taskBuildPath].push(task.options.outputName);
    }
    return buildPathDict;
}
// 判断输出路径是否与 taskMap 中的路径冲突
function checkConflict(buildPath, outputName, buildPathDict) {
    // 同 buildPath 下 outputName 是否重复
    const outputNames = buildPathDict[buildPath] || [];
    for (const name of outputNames) {
        if (outputName === name) {
            return true;
        }
    }
    return false;
}
// 生成新的输出目录名称
function generateNewOutputName(buildPath, platform, buildPathDict) {
    // 获取同 buildPath 下 platform 输出目录的最高序号
    const outputNames = buildPathDict[buildPath] || [];
    let maxIndex = 0;
    for (const name of outputNames) {
        if (name.startsWith(platform + '-')) {
            const index = parseInt(name.substring(platform.length + 1), 10);
            if (!isNaN(index) && index > maxIndex) {
                maxIndex = index;
            }
        }
    }
    // 生成新的输出目录名
    const newIndex = (maxIndex + 1).toString().padStart(3, '0');
    return `${platform}-${newIndex}`;
}
/**
 * 检查路径是否无效
 * @param path
 * @returns
 */
function checkBuildPathIsInvalid(path) {
    if (!path) {
        return true;
    }
    if (path.startsWith('project://')) {
        const matchInfo = path.match(/^([a-zA-z]*):\/\/(.*)$/);
        if (matchInfo) {
            const relPath = matchInfo[2].replace(/\\/g, '/');
            // 超出项目外的相对路径以及 project:// 下为绝对路径的地址无效
            if ((0, path_1.isAbsolute)(relPath) || relPath.includes('../') || relPath.startsWith('/')) {
                return true;
            }
        }
    }
    else {
        if (!(0, path_1.isAbsolute)(path)) {
            return true;
        }
    }
    return false;
}
/**
  * 校验传入的引擎模块信息
  * @param value[]
  * @returns 校验结果
  */
function checkIncludeModules(modules) {
    if (!Array.isArray(modules)) {
        return ` includeModules(${modules}) should be an array!`;
    }
    // TODO 校验是否包含一些引擎的必须模块
    return true;
}
// export async function getCommonOptions(platform: Platform, useDefault = false) {
//     const commonConfig = await builderConfig.getProject<IBuildCommonOptions>('common', useDefault ? 'default' : 'project');
//     const result: IBuildTaskOption<Platform> = JSON.parse(JSON.stringify(commonConfig));
//     if (!useDefault) {
//         const platformCustomCommonOptions = await builderConfig.getProject<IBuildCommonOptions>(`platforms.${platform}`);
//         if (platformCustomCommonOptions) {
//             Object.keys(platformCustomCommonOptions).forEach((key) => {
//                 if (platformCustomCommonOptions[key as keyof IBuildCommonOptions] !== undefined) {
//                     // @ts-ignore
//                     result[key] = platformCustomCommonOptions[key as keyof IBuildCommonOptions];
//                 }
//             });
//         }
//     }
//     // 场景信息不使用用户修改过的数据，这部分信息和资源相关联数据经常会变化，不存储使用
//     result.scenes = await getDefaultScenes();
//     if (!(await checkStartScene(result.startScene))) {
//         result.startScene = await getDefaultStartScene();
//     }
//     if (!result.startScene) {
//         console.error(i18n.t('builder.error.invalidStartScene'));
//     }
//     result.platform = platform;
//     return result;
// }
function getDefaultScenes() {
    const scenes = asset_1.default.queryAssets({ ccType: 'cc.SceneAsset', pattern: '!db://internal/default_file_content/**/*' });
    if (!scenes) {
        return [];
    }
    const directory = asset_1.default.queryAssets({ isBundle: true });
    return scenes.map((asset) => {
        return {
            url: asset.url,
            uuid: asset.uuid,
            bundle: directory.find((dir) => asset.url.startsWith(dir.url + '/'))?.url || '',
        };
    });
}
function getDefaultStartScene() {
    const scenes = getDefaultScenes();
    const realScenes = scenes.filter((item) => !item.bundle);
    return realScenes[0] && realScenes[0].uuid;
}
function translateCheckMessage(message) {
    return i18n_1.default.transI18nName(message) || message;
}
function createValidCheckResult(fixedValue) {
    const result = {
        valid: true,
    };
    if (arguments.length > 0) {
        result.fixedValue = fixedValue;
    }
    return result;
}
function createInvalidCheckResult(message, fixedValue, level = 'error') {
    const result = {
        valid: false,
        level,
        message: translateCheckMessage(message),
    };
    if (arguments.length > 1) {
        result.fixedValue = fixedValue;
    }
    return result;
}
async function checkBuildCommonOptionsByKey(key, value, options) {
    let res = createValidCheckResult();
    switch (key) {
        case 'scenes':
            {
                const error = checkScenes(value) || false;
                if (error instanceof Error) {
                    res = createInvalidCheckResult(error.message, getDefaultScenes());
                }
                return res;
            }
        case 'startScene':
            {
                const error = checkStartScene(value) || false;
                if (error instanceof Error) {
                    res = createInvalidCheckResult(error.message, getDefaultStartScene());
                }
                return res;
            }
        case 'mainBundleIsRemote':
            if (value && options.mainBundleCompressionType === bundle_utils_1.BundleCompressionTypes.SUBPACKAGE) {
                res = createInvalidCheckResult(' bundle can not be remote when compression type is subpackage!', false);
            }
            else if (!value && options.mainBundleCompressionType === bundle_utils_1.BundleCompressionTypes.ZIP) {
                res = createInvalidCheckResult(' bundle must be remote when compression type is zip!', true);
            }
            return res;
        case 'outputName':
            if (!value) {
                res = createInvalidCheckResult(' outputName can not be empty', await calcValidOutputName(options.buildPath, options.platform, options.platform));
            }
            else {
                // HACK 原生平台不支持中文和特殊符号
                if (platforms_options_1.NATIVE_PLATFORM.includes(options.platform) && checkIncludeChineseAndSymbol(value)) {
                    res = createInvalidCheckResult('i18n:builder.error.buildPathContainsChineseAndSymbol');
                }
            }
            break;
        case 'taskName':
            if (!value) {
                res = createInvalidCheckResult(' taskName can not be empty', options.outputName);
            }
            break;
        case 'buildPath':
            if (!value || value === 'project://') {
                res = createInvalidCheckResult(' buildPath can not be empty', 'project://build');
            }
            else if (checkBuildPathIsInvalid(value)) {
                res = createInvalidCheckResult('buildPath is invalid!', 'project://build');
            }
            else {
                // 添加对旧版本相对路径的转换支持
                if (typeof value === 'string' && value.startsWith('.')) {
                    value = 'project://' + value;
                }
                if (!value || !(0, path_1.isAbsolute)(utils_1.default.Path.resolveToRaw(value))) {
                    res = createInvalidCheckResult(`buildPath(${value}) is invalid!`, 'project://build');
                }
                // hack 原生平台不支持中文和特殊符号
                if (platforms_options_1.NATIVE_PLATFORM.includes(options.platform) && checkIncludeChineseAndSymbol(value)) {
                    res = Object.prototype.hasOwnProperty.call(res, 'fixedValue')
                        ? createInvalidCheckResult('i18n:builder.error.buildPathContainsChineseAndSymbol', res.fixedValue)
                        : createInvalidCheckResult('i18n:builder.error.buildPathContainsChineseAndSymbol');
                }
            }
            break;
        case 'md5Cache':
        case 'debug':
        case 'useSplashScreen':
        case 'mergeStartScene':
        case 'experimentalEraseModules':
        case 'sourceMaps':
            if (value === 'true') {
                res = createValidCheckResult(true);
            }
            else if (value === 'false') {
                res = createValidCheckResult(false);
            }
            break;
        case 'server':
            {
                const message = await validator_manager_1.validatorManager.check(value, builder_config_1.default.commonOptionConfigs.server.verifyRules || [], options, options.platform + options.platform);
                if (message) {
                    res = createInvalidCheckResult(message);
                }
            }
            break;
        default:
            return null;
    }
    return res;
}
function checkIncludeChineseAndSymbol(value) {
    return /[`~!#$%^&*+=<>?'{}|,;'·~！#￥%……&*（）+={}|《》？：“”【】、；‘'，。、@\u4e00-\u9fa5]/im.test(value);
}
async function checkBuildCommonOptions(options) {
    const commonOptions = builder_config_1.default.getBuildCommonOptions();
    const checkResMap = {};
    // const checkKeys = Array.from(new Set(Object.keys(commonOptions).concat(Object.keys(options))))
    // 正常来说应该检查默认值和 options 整合的 key
    for (const key of Object.keys(commonOptions)) {
        checkResMap[key] = await checkBuildCommonOptionsByKey(key, options[key], options) || createValidCheckResult();
    }
    return checkResMap;
}
function checkBundleCompressionSetting(value, supportedCompressionTypes) {
    if (supportedCompressionTypes && -1 === supportedCompressionTypes.indexOf(value)) {
        return createInvalidCheckResult(` compression type(${value}) is invalid for this platform!`, bundle_utils_1.BundleCompressionTypes.MERGE_DEP);
    }
    return createValidCheckResult();
}
/**
 * 整合构建配置的引擎模块配置
 * 规则：
 *   字段值为布尔值，则当前值作为此模块的开关
 *   字段值为字符串，则根据 overwriteModuleConfig 配置值进行剔除替换
 * @param options
 */
function handleOverwriteProjectSettings(options) {
    const overwriteModules = options.overwriteProjectSettings?.includeModules;
    let includeModules = options.includeModules ? [...options.includeModules] : options.includeModules;
    if (includeModules && overwriteModules && includeModules.length) {
        for (const module in overwriteModules) {
            if (overwriteModules[module] !== 'inherit-project-setting') {
                switch (overwriteModules[module]) {
                    case 'on':
                        includeModules.push(module);
                        break;
                    case 'off':
                        includeModules = includeModules.filter((engineModule) => engineModule !== module);
                        break;
                    default:
                        if (exports.overwriteModuleConfig[module]) {
                            const overwriteModuleIndex = includeModules.findIndex(exports.overwriteModuleConfig[module].match);
                            if (overwriteModuleIndex === -1) {
                                // 未开启模块时，替换无效
                                return;
                            }
                            includeModules.splice(overwriteModuleIndex, 1, overwriteModules[module]);
                        }
                        else {
                            console.warn('Invalid overwrite config of engine');
                        }
                }
            }
        }
        options.includeModules = Array.from(new Set(includeModules));
    }
}
function resolveIncludeModulesFromEngineConfig(engineConfig, engineModulesConfigKey) {
    if (engineModulesConfigKey) {
        const includeModules = engineConfig.configs?.[engineModulesConfigKey]?.includeModules;
        if (!includeModules?.length) {
            throw new Error(`Invalid engineModulesConfigKey: ${engineModulesConfigKey}`);
        }
        return [...includeModules];
    }
    if (engineConfig.includeModules?.length) {
        return [...engineConfig.includeModules];
    }
    const selectedConfigKey = engineConfig.globalConfigKey || Object.keys(engineConfig.configs || {})[0];
    const includeModules = selectedConfigKey ? engineConfig.configs?.[selectedConfigKey]?.includeModules : undefined;
    return includeModules?.length ? [...includeModules] : [];
}
/**
 * Fill `options.includeModules` from the project engine config (settings/cocos.config.json) when it is empty,
 * so the preview path produces the same `includeModules` as a formal build (checkProjectSetting).
 * Does not override an already non-empty `includeModules`.
 */
async function fillIncludeModulesFromProjectConfig(options) {
    if (!options.includeModules || !options.includeModules.length) {
        options.includeModules = resolveIncludeModulesFromEngineConfig(engine_1.Engine.getConfig(), options.engineModulesConfigKey);
    }
}
async function checkProjectSetting(options) {
    options.engineInfo = options.engineInfo || (0, utils_2.cloneConfigValue)(engine_1.Engine.getInfo());
    const engineConfig = engine_1.Engine.getConfig();
    const { designResolution, renderPipeline, physicsConfig, customLayers, sortingLayers, macroConfig } = engineConfig;
    // 默认 Canvas 设置
    if (!options.designResolution) {
        options.designResolution = (0, utils_2.cloneConfigValue)(designResolution);
    }
    // renderPipeline
    if (!options.renderPipeline) {
        if (renderPipeline) {
            options.renderPipeline = (0, utils_2.cloneConfigValue)(renderPipeline);
        }
    }
    // physicsConfig
    if (!options.physicsConfig) {
        options.physicsConfig = (0, utils_2.cloneConfigValue)(physicsConfig);
        if (!options.physicsConfig.defaultMaterial) {
            options.physicsConfig.defaultMaterial = 'ba21476f-2866-4f81-9c4d-6e359316e448';
        }
    }
    // customLayers
    if (!options.customLayers) {
        options.customLayers = (0, utils_2.cloneConfigValue)(customLayers);
    }
    // sortingLayers
    if (!options.sortingLayers) {
        if (sortingLayers) {
            options.sortingLayers = (0, utils_2.cloneConfigValue)(sortingLayers);
        }
    }
    // macro 配置
    if (!options.macroConfig) {
        if (macroConfig) {
            options.macroConfig = (0, utils_2.cloneConfigValue)(macroConfig);
        }
    }
    if (!options.includeModules || !options.includeModules.length) {
        options.includeModules = resolveIncludeModulesFromEngineConfig(engineConfig, options.engineModulesConfigKey);
    }
    // 确保 includeModules 中包含 'debug-renderer'
    if (!options.includeModules.includes('debug-renderer')) {
        options.includeModules.push('debug-renderer');
    }
    // 自定义管线配置
    options.customPipeline = options.customPipeline || options.includeModules.includes('custom-pipeline');
    if (!options.flags) {
        options.flags = {
            LOAD_BULLET_MANUALLY: false,
            LOAD_SPINE_MANUALLY: false,
        };
    }
    if (!options.splashScreen) {
        options.splashScreen = (0, utils_2.cloneConfigValue)(engineConfig.splashScreen);
    }
}
