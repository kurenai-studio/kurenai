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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLW9wdGlvbnMtdmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci9zaGFyZS9jb21tb24tb3B0aW9ucy12YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7Ozs7QUF3Q0gsa0NBaUJDO0FBTUQsMENBV0M7QUFPRCxrREFPQztBQWlCRCxzQ0FTQztBQUdELHNEQWVDO0FBT0QsMERBbUJDO0FBeUNELDRDQWFDO0FBRUQsb0RBSUM7QUE0QkQsb0VBMkZDO0FBTUQsMERBU0M7QUFFRCxzRUFLQztBQVFELHdFQTZCQztBQStCRCxrRkFNQztBQUVELGtEQW1FQztBQXBmRCwrQkFBa0Q7QUFDbEQsaURBQXdEO0FBQ3hELDJEQUFzRDtBQUl0RCwyREFBbUM7QUFDbkMsNkRBQXFDO0FBQ3JDLHVFQUFzRDtBQUN0RCx5Q0FBc0M7QUFDdEMsc0VBQTZDO0FBQzdDLG1DQUEyQztBQUMzQywyREFBdUQ7QUFNMUMsUUFBQSxxQkFBcUIsR0FBaUM7SUFDL0QsT0FBTyxFQUFFO1FBQ0wsS0FBSyxFQUFFLENBQUMsR0FBVyxFQUFFLEVBQUU7WUFDbkIsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBQ0QsT0FBTyxFQUFFLHlCQUF5QjtLQUNyQztJQUNELFlBQVksRUFBRTtRQUNWLEtBQUssRUFBRSxDQUFDLEdBQVcsRUFBRSxFQUFFO1lBQ25CLE9BQU8sR0FBRyxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQ0QsT0FBTyxFQUFFLHlCQUF5QjtLQUNyQztDQUNKLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsU0FBZ0IsV0FBVyxDQUFDLE1BQXlCO0lBQ2pELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1B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QUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1FBQ3JELE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELFVBQVU7SUFDVixPQUFPLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUV0RyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2pCLE9BQU8sQ0FBQyxLQUFLLEdBQUc7WUFDWixvQkFBb0IsRUFBRSxLQUFLO1lBQzNCLG1CQUFtQixFQUFFLEtBQUs7U0FDN0IsQ0FBQztJQUNOLENBQUM7SUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3hCLE9BQU8sQ0FBQyxZQUFZLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDdkUsQ0FBQztBQUVMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOagoemqjOaehOW7uumAmueUqOmFjee9ruWPguaVsFxuICovXG5cbmltcG9ydCB7IGJhc2VuYW1lLCBpc0Fic29sdXRlLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBCdW5kbGVDb21wcmVzc2lvblR5cGVzIH0gZnJvbSAnLi9idW5kbGUtdXRpbHMnO1xuaW1wb3J0IHsgTkFUSVZFX1BMQVRGT1JNIH0gZnJvbSAnLi9wbGF0Zm9ybXMtb3B0aW9ucyc7XG5pbXBvcnQgeyBJQnVpbGRTY2VuZUl0ZW0sIElCdWlsZFRhc2tJdGVtSlNPTiwgSUJ1aWxkVGFza09wdGlvbiB9IGZyb20gJy4uL0B0eXBlcyc7XG5pbXBvcnQgeyBJSW50ZXJuYWxCdWlsZFNjZW5lSXRlbSB9IGZyb20gJy4uL0B0eXBlcy9vcHRpb25zJztcbmltcG9ydCB7IEJ1aWxkQ2hlY2tSZXN1bHQsIEJ1bmRsZUNvbXByZXNzaW9uVHlwZSwgSUludGVybmFsQnVpbGRPcHRpb25zLCBJSW50ZXJuYWxCdW5kbGVCdWlsZE9wdGlvbnMgfSBmcm9tICcuLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBpMThuIGZyb20gJy4uLy4uL2Jhc2UvaTE4bic7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vYmFzZS91dGlscyc7XG5pbXBvcnQgYXNzZXRNYW5hZ2VyIGZyb20gJy4uLy4uL2Fzc2V0cy9tYW5hZ2VyL2Fzc2V0JztcbmltcG9ydCB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL2VuZ2luZSc7XG5pbXBvcnQgYnVpbGRlckNvbmZpZyBmcm9tICcuL2J1aWxkZXItY29uZmlnJztcbmltcG9ydCB7IGNsb25lQ29uZmlnVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IHZhbGlkYXRvck1hbmFnZXIgfSBmcm9tICcuL3ZhbGlkYXRvci1tYW5hZ2VyJztcbmludGVyZmFjZSBNb2R1bGVDb25maWcge1xuICAgIG1hdGNoOiAobW9kdWxlOiBzdHJpbmcpID0+IGJvb2xlYW47XG4gICAgZGVmYXVsdDogc3RyaW5nIHwgYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IG92ZXJ3cml0ZU1vZHVsZUNvbmZpZzogUmVjb3JkPHN0cmluZywgTW9kdWxlQ29uZmlnPiA9IHtcbiAgICBwaHlzaWNzOiB7XG4gICAgICAgIG1hdGNoOiAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBrZXkuc3RhcnRzV2l0aCgncGh5c2ljcy0nKSAmJiAha2V5LnN0YXJ0c1dpdGgoJ3BoeXNpY3MtMmQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVmYXVsdDogJ2luaGVyaXQtcHJvamVjdC1zZXR0aW5nJyxcbiAgICB9LFxuICAgICdwaHlzaWNzLTJkJzoge1xuICAgICAgICBtYXRjaDogKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ga2V5LnN0YXJ0c1dpdGgoJ3BoeXNpY3MtMmQtJyk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlZmF1bHQ6ICdpbmhlcml0LXByb2plY3Qtc2V0dGluZycsXG4gICAgfSxcbn07XG5cbi8qKlxuICog5qCh6aqM5Zy65pmv5pWw5o2uXG4gKiBAcmV0dXJucyDmoKHpqoznu5PmnpxcbiAqIEBwYXJhbSBzY2VuZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU2NlbmVzKHNjZW5lczogSUJ1aWxkU2NlbmVJdGVtW10pOiBib29sZWFuIHwgRXJyb3Ige1xuICAgIGlmICghQXJyYXkuaXNBcnJheShzY2VuZXMpIHx8ICFzY2VuZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ1NjZW5lcyBpcyBlbXB0eScpO1xuICAgIH1cbiAgICBjb25zdCB2YWxpZFNjZW5lcyA9IHNjZW5lcy5maWx0ZXIoKHNjZW5lKSA9PiBzY2VuZSAmJiBzY2VuZS51dWlkKTtcbiAgICBpZiAodmFsaWRTY2VuZXMubGVuZ3RoICE9PSBzY2VuZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoaTE4bi50KCdidWlsZGVyLmVycm9yLm1pc3Npbmdfc2NlbmVzJykpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlcyA9IHZhbGlkU2NlbmVzLm1hcCgoc2NlbmUpID0+IGFzc2V0TWFuYWdlci5xdWVyeVVybChzY2VuZS51dWlkKSk7XG4gICAgY29uc3QgaW52YWxpZEluZGV4ID0gcmVzLmZpbmRJbmRleCgodXJsKSA9PiAhdXJsKTtcbiAgICBpZiAoaW52YWxpZEluZGV4ICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGkxOG4udCgnYnVpbGRlci5lcnJvci5taXNzaW5nX3NjZW5lcycsIHtcbiAgICAgICAgICAgIHVybDogdmFsaWRTY2VuZXNbaW52YWxpZEluZGV4XS51cmwsXG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICAqIOehruiupOWIneWni+WcuuaZr+WvuemUmVxuICAqIEBwYXJhbSB1dWlkT3JVcmwgXG4gICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tTdGFydFNjZW5lKHV1aWRPclVybDogc3RyaW5nKTogYm9vbGVhbiB8IEVycm9yIHtcbiAgICBjb25zdCBhc3NldCA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0KHV1aWRPclVybCk7XG4gICAgaWYgKCFhc3NldCkge1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGBjYW4gbm90IGZpbmQgYXNzZXQgYnkgdXVpZCBvciB1cmwgJHt1dWlkT3JVcmx9YCk7XG4gICAgfVxuICAgIGNvbnN0IGJ1bmRsZURpckluZm9zID0gYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRzKHsgaXNCdW5kbGU6IHRydWUgfSk7XG4gICAgaWYgKGJ1bmRsZURpckluZm9zLmZpbmQoKGluZm8pID0+IGFzc2V0LnVybC5zdGFydHNXaXRoKGluZm8udXJsICsgJy8nKSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgYXNzZXQgJHt1dWlkT3JVcmx9IGlzIGluIGJ1bmRsZSwgY2FuIG5vdCBiZSBzZXQgYXMgc3RhcnQgc2NlbmVgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gICog5qC55o2u6L6T5YWl55qE5paH5Lu25aS55ZKM55uu5qCH5ZCN56ew6K6h566X5LiN5ZKM5pys5Zyw5Yay56qB55qE5paH5Lu25Zyw5Z2AXG4gICogQHBhcmFtIHJvb3RcbiAgKiBAcGFyYW0gZGlyTmFtZVxuICAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGNWYWxpZE91dHB1dE5hbWUocm9vdDogc3RyaW5nLCBkaXJOYW1lOiBzdHJpbmcsIHBsYXRmb3JtOiBzdHJpbmcsIGlkPzogc3RyaW5nKSB7XG4gICAgaWYgKCFyb290IHx8ICFkaXJOYW1lKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgbGV0IGRlc3QgPSBqb2luKFV0aWxzLlBhdGgucmVzb2x2ZVRvUmF3KHJvb3QpLCBkaXJOYW1lKTtcbiAgICBkZXN0ID0gVXRpbHMuRmlsZS5nZXROYW1lKGRlc3QpO1xuICAgIHJldHVybiBiYXNlbmFtZShkZXN0KTtcbn1cblxuLy8g5Yib5bu6IHRhc2tNYXAg5LitIGJ1aWxkUGF0aCDlrZflhbhcbmZ1bmN0aW9uIGNyZWF0ZUJ1aWxkUGF0aERpY3QodGFza01hcDogUmVjb3JkPHN0cmluZywgSUJ1aWxkVGFza0l0ZW1KU09OPikge1xuICAgIGNvbnN0IGJ1aWxkUGF0aERpY3Q6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIHRhc2tNYXApIHtcbiAgICAgICAgY29uc3QgdGFzazogSUJ1aWxkVGFza0l0ZW1KU09OID0gdGFza01hcFtrZXldO1xuICAgICAgICBjb25zdCB0YXNrQnVpbGRQYXRoID0gVXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcodGFzay5vcHRpb25zLmJ1aWxkUGF0aCk7XG4gICAgICAgIGlmICghYnVpbGRQYXRoRGljdFt0YXNrQnVpbGRQYXRoXSkge1xuICAgICAgICAgICAgYnVpbGRQYXRoRGljdFt0YXNrQnVpbGRQYXRoXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGJ1aWxkUGF0aERpY3RbdGFza0J1aWxkUGF0aF0ucHVzaCh0YXNrLm9wdGlvbnMub3V0cHV0TmFtZSk7XG4gICAgfVxuICAgIHJldHVybiBidWlsZFBhdGhEaWN0O1xufVxuXG4vLyDliKTmlq3ovpPlh7rot6/lvoTmmK/lkKbkuI4gdGFza01hcCDkuK3nmoTot6/lvoTlhrLnqoFcbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbmZsaWN0KGJ1aWxkUGF0aDogc3RyaW5nLCBvdXRwdXROYW1lOiBzdHJpbmcsIGJ1aWxkUGF0aERpY3Q6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPikge1xuICAgIC8vIOWQjCBidWlsZFBhdGgg5LiLIG91dHB1dE5hbWUg5piv5ZCm6YeN5aSNXG4gICAgY29uc3Qgb3V0cHV0TmFtZXMgPSBidWlsZFBhdGhEaWN0W2J1aWxkUGF0aF0gfHwgW107XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIG91dHB1dE5hbWVzKSB7XG4gICAgICAgIGlmIChvdXRwdXROYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIOeUn+aIkOaWsOeahOi+k+WHuuebruW9leWQjeensFxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlTmV3T3V0cHV0TmFtZShidWlsZFBhdGg6IHN0cmluZywgcGxhdGZvcm06IHN0cmluZywgYnVpbGRQYXRoRGljdDogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+KSB7XG4gICAgLy8g6I635Y+W5ZCMIGJ1aWxkUGF0aCDkuIsgcGxhdGZvcm0g6L6T5Ye655uu5b2V55qE5pyA6auY5bqP5Y+3XG4gICAgY29uc3Qgb3V0cHV0TmFtZXMgPSBidWlsZFBhdGhEaWN0W2J1aWxkUGF0aF0gfHwgW107XG4gICAgbGV0IG1heEluZGV4ID0gMDtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2Ygb3V0cHV0TmFtZXMpIHtcbiAgICAgICAgaWYgKG5hbWUuc3RhcnRzV2l0aChwbGF0Zm9ybSArICctJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gcGFyc2VJbnQobmFtZS5zdWJzdHJpbmcocGxhdGZvcm0ubGVuZ3RoICsgMSksIDEwKTtcbiAgICAgICAgICAgIGlmICghaXNOYU4oaW5kZXgpICYmIGluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBtYXhJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIOeUn+aIkOaWsOeahOi+k+WHuuebruW9leWQjVxuICAgIGNvbnN0IG5ld0luZGV4ID0gKG1heEluZGV4ICsgMSkudG9TdHJpbmcoKS5wYWRTdGFydCgzLCAnMCcpO1xuICAgIHJldHVybiBgJHtwbGF0Zm9ybX0tJHtuZXdJbmRleH1gO1xufVxuXG4vKipcbiAqIOajgOafpei3r+W+hOaYr+WQpuaXoOaViFxuICogQHBhcmFtIHBhdGggXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQnVpbGRQYXRoSXNJbnZhbGlkKHBhdGg6IHN0cmluZykge1xuICAgIGlmICghcGF0aCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhdGguc3RhcnRzV2l0aCgncHJvamVjdDovLycpKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoSW5mbyA9IHBhdGgubWF0Y2goL14oW2EtekEtel0qKTpcXC9cXC8oLiopJC8pO1xuICAgICAgICBpZiAobWF0Y2hJbmZvKSB7XG4gICAgICAgICAgICBjb25zdCByZWxQYXRoID0gbWF0Y2hJbmZvWzJdLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgICAgIC8vIOi2heWHuumhueebruWklueahOebuOWvuei3r+W+hOS7peWPiiBwcm9qZWN0Oi8vIOS4i+S4uue7neWvuei3r+W+hOeahOWcsOWdgOaXoOaViFxuICAgICAgICAgICAgaWYgKGlzQWJzb2x1dGUocmVsUGF0aCkgfHwgcmVsUGF0aC5pbmNsdWRlcygnLi4vJykgfHwgcmVsUGF0aC5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghaXNBYnNvbHV0ZShwYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAgKiDmoKHpqozkvKDlhaXnmoTlvJXmk47mqKHlnZfkv6Hmga9cbiAgKiBAcGFyYW0gdmFsdWVbXVxuICAqIEByZXR1cm5zIOagoemqjOe7k+aenFxuICAqL1xuZnVuY3Rpb24gY2hlY2tJbmNsdWRlTW9kdWxlcyhtb2R1bGVzOiBzdHJpbmdbXSk6IGJvb2xlYW4gfCBzdHJpbmcge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShtb2R1bGVzKSkge1xuICAgICAgICByZXR1cm4gYCBpbmNsdWRlTW9kdWxlcygke21vZHVsZXN9KSBzaG91bGQgYmUgYW4gYXJyYXkhYDtcbiAgICB9XG4gICAgLy8gVE9ETyDmoKHpqozmmK/lkKbljIXlkKvkuIDkupvlvJXmk47nmoTlv4XpobvmqKHlnZdcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvbW1vbk9wdGlvbnMocGxhdGZvcm06IFBsYXRmb3JtLCB1c2VEZWZhdWx0ID0gZmFsc2UpIHtcbi8vICAgICBjb25zdCBjb21tb25Db25maWcgPSBhd2FpdCBidWlsZGVyQ29uZmlnLmdldFByb2plY3Q8SUJ1aWxkQ29tbW9uT3B0aW9ucz4oJ2NvbW1vbicsIHVzZURlZmF1bHQgPyAnZGVmYXVsdCcgOiAncHJvamVjdCcpO1xuLy8gICAgIGNvbnN0IHJlc3VsdDogSUJ1aWxkVGFza09wdGlvbjxQbGF0Zm9ybT4gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNvbW1vbkNvbmZpZykpO1xuLy8gICAgIGlmICghdXNlRGVmYXVsdCkge1xuLy8gICAgICAgICBjb25zdCBwbGF0Zm9ybUN1c3RvbUNvbW1vbk9wdGlvbnMgPSBhd2FpdCBidWlsZGVyQ29uZmlnLmdldFByb2plY3Q8SUJ1aWxkQ29tbW9uT3B0aW9ucz4oYHBsYXRmb3Jtcy4ke3BsYXRmb3JtfWApO1xuLy8gICAgICAgICBpZiAocGxhdGZvcm1DdXN0b21Db21tb25PcHRpb25zKSB7XG4vLyAgICAgICAgICAgICBPYmplY3Qua2V5cyhwbGF0Zm9ybUN1c3RvbUNvbW1vbk9wdGlvbnMpLmZvckVhY2goKGtleSkgPT4ge1xuLy8gICAgICAgICAgICAgICAgIGlmIChwbGF0Zm9ybUN1c3RvbUNvbW1vbk9wdGlvbnNba2V5IGFzIGtleW9mIElCdWlsZENvbW1vbk9wdGlvbnNdICE9PSB1bmRlZmluZWQpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuLy8gICAgICAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHBsYXRmb3JtQ3VzdG9tQ29tbW9uT3B0aW9uc1trZXkgYXMga2V5b2YgSUJ1aWxkQ29tbW9uT3B0aW9uc107XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgfSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgLy8g5Zy65pmv5L+h5oGv5LiN5L2/55So55So5oi35L+u5pS56L+H55qE5pWw5o2u77yM6L+Z6YOo5YiG5L+h5oGv5ZKM6LWE5rqQ55u45YWz6IGU5pWw5o2u57uP5bi45Lya5Y+Y5YyW77yM5LiN5a2Y5YKo5L2/55SoXG4vLyAgICAgcmVzdWx0LnNjZW5lcyA9IGF3YWl0IGdldERlZmF1bHRTY2VuZXMoKTtcbi8vICAgICBpZiAoIShhd2FpdCBjaGVja1N0YXJ0U2NlbmUocmVzdWx0LnN0YXJ0U2NlbmUpKSkge1xuLy8gICAgICAgICByZXN1bHQuc3RhcnRTY2VuZSA9IGF3YWl0IGdldERlZmF1bHRTdGFydFNjZW5lKCk7XG4vLyAgICAgfVxuLy8gICAgIGlmICghcmVzdWx0LnN0YXJ0U2NlbmUpIHtcbi8vICAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIuZXJyb3IuaW52YWxpZFN0YXJ0U2NlbmUnKSk7XG4vLyAgICAgfVxuLy8gICAgIHJlc3VsdC5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuLy8gICAgIHJldHVybiByZXN1bHQ7XG4vLyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0U2NlbmVzKCk6IElJbnRlcm5hbEJ1aWxkU2NlbmVJdGVtW10ge1xuICAgIGNvbnN0IHNjZW5lcyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0cyh7IGNjVHlwZTogJ2NjLlNjZW5lQXNzZXQnLCBwYXR0ZXJuOiAnIWRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvKiovKicgfSk7XG4gICAgaWYgKCFzY2VuZXMpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBkaXJlY3RvcnkgPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldHMoeyBpc0J1bmRsZTogdHJ1ZSB9KTtcbiAgICByZXR1cm4gc2NlbmVzLm1hcCgoYXNzZXQpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVybDogYXNzZXQudXJsLFxuICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgIGJ1bmRsZTogZGlyZWN0b3J5LmZpbmQoKGRpcikgPT4gYXNzZXQudXJsLnN0YXJ0c1dpdGgoZGlyLnVybCArICcvJykpPy51cmwgfHwgJycsXG4gICAgICAgIH07XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0U3RhcnRTY2VuZSgpIHtcbiAgICBjb25zdCBzY2VuZXMgPSBnZXREZWZhdWx0U2NlbmVzKCk7XG4gICAgY29uc3QgcmVhbFNjZW5lcyA9IHNjZW5lcy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gIWl0ZW0uYnVuZGxlKTtcbiAgICByZXR1cm4gcmVhbFNjZW5lc1swXSAmJiByZWFsU2NlbmVzWzBdLnV1aWQ7XG59XG5cbmZ1bmN0aW9uIHRyYW5zbGF0ZUNoZWNrTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBpMThuLnRyYW5zSTE4bk5hbWUobWVzc2FnZSkgfHwgbWVzc2FnZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmFsaWRDaGVja1Jlc3VsdChmaXhlZFZhbHVlPzogdW5rbm93bik6IEJ1aWxkQ2hlY2tSZXN1bHQge1xuICAgIGNvbnN0IHJlc3VsdDogQnVpbGRDaGVja1Jlc3VsdCA9IHtcbiAgICAgICAgdmFsaWQ6IHRydWUsXG4gICAgfTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzdWx0LmZpeGVkVmFsdWUgPSBmaXhlZFZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVJbnZhbGlkQ2hlY2tSZXN1bHQobWVzc2FnZTogc3RyaW5nLCBmaXhlZFZhbHVlPzogdW5rbm93biwgbGV2ZWw6IEJ1aWxkQ2hlY2tSZXN1bHRbJ2xldmVsJ10gPSAnZXJyb3InKTogQnVpbGRDaGVja1Jlc3VsdCB7XG4gICAgY29uc3QgcmVzdWx0OiBCdWlsZENoZWNrUmVzdWx0ID0ge1xuICAgICAgICB2YWxpZDogZmFsc2UsXG4gICAgICAgIGxldmVsLFxuICAgICAgICBtZXNzYWdlOiB0cmFuc2xhdGVDaGVja01lc3NhZ2UobWVzc2FnZSksXG4gICAgfTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcmVzdWx0LmZpeGVkVmFsdWUgPSBmaXhlZFZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tCdWlsZENvbW1vbk9wdGlvbnNCeUtleShrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgb3B0aW9uczogSUJ1aWxkVGFza09wdGlvbik6IFByb21pc2U8QnVpbGRDaGVja1Jlc3VsdCB8IG51bGw+IHtcbiAgICBsZXQgcmVzID0gY3JlYXRlVmFsaWRDaGVja1Jlc3VsdCgpO1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgIGNhc2UgJ3NjZW5lcyc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBjaGVja1NjZW5lcyh2YWx1ZSkgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gY3JlYXRlSW52YWxpZENoZWNrUmVzdWx0KGVycm9yLm1lc3NhZ2UsIGdldERlZmF1bHRTY2VuZXMoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3N0YXJ0U2NlbmUnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gY2hlY2tTdGFydFNjZW5lKHZhbHVlKSB8fCBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZXMgPSBjcmVhdGVJbnZhbGlkQ2hlY2tSZXN1bHQoZXJyb3IubWVzc2FnZSwgZ2V0RGVmYXVsdFN0YXJ0U2NlbmUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIGNhc2UgJ21haW5CdW5kbGVJc1JlbW90ZSc6XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgb3B0aW9ucy5tYWluQnVuZGxlQ29tcHJlc3Npb25UeXBlID09PSBCdW5kbGVDb21wcmVzc2lvblR5cGVzLlNVQlBBQ0tBR0UpIHtcbiAgICAgICAgICAgICAgICByZXMgPSBjcmVhdGVJbnZhbGlkQ2hlY2tSZXN1bHQoJyBidW5kbGUgY2FuIG5vdCBiZSByZW1vdGUgd2hlbiBjb21wcmVzc2lvbiB0eXBlIGlzIHN1YnBhY2thZ2UhJywgZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghdmFsdWUgJiYgb3B0aW9ucy5tYWluQnVuZGxlQ29tcHJlc3Npb25UeXBlID09PSBCdW5kbGVDb21wcmVzc2lvblR5cGVzLlpJUCkge1xuICAgICAgICAgICAgICAgIHJlcyA9IGNyZWF0ZUludmFsaWRDaGVja1Jlc3VsdCgnIGJ1bmRsZSBtdXN0IGJlIHJlbW90ZSB3aGVuIGNvbXByZXNzaW9uIHR5cGUgaXMgemlwIScsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgY2FzZSAnb3V0cHV0TmFtZSc6XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmVzID0gY3JlYXRlSW52YWxpZENoZWNrUmVzdWx0KCcgb3V0cHV0TmFtZSBjYW4gbm90IGJlIGVtcHR5JywgYXdhaXQgY2FsY1ZhbGlkT3V0cHV0TmFtZShvcHRpb25zLmJ1aWxkUGF0aCwgb3B0aW9ucy5wbGF0Zm9ybSwgb3B0aW9ucy5wbGF0Zm9ybSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBIQUNLIOWOn+eUn+W5s+WPsOS4jeaUr+aMgeS4reaWh+WSjOeJueauiuespuWPt1xuICAgICAgICAgICAgICAgIGlmIChOQVRJVkVfUExBVEZPUk0uaW5jbHVkZXMob3B0aW9ucy5wbGF0Zm9ybSkgJiYgY2hlY2tJbmNsdWRlQ2hpbmVzZUFuZFN5bWJvbCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gY3JlYXRlSW52YWxpZENoZWNrUmVzdWx0KCdpMThuOmJ1aWxkZXIuZXJyb3IuYnVpbGRQYXRoQ29udGFpbnNDaGluZXNlQW5kU3ltYm9sJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3Rhc2tOYW1lJzpcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXMgPSBjcmVhdGVJbnZhbGlkQ2hlY2tSZXN1bHQoJyB0YXNrTmFtZSBjYW4gbm90IGJlIGVtcHR5Jywgb3B0aW9ucy5vdXRwdXROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdidWlsZFBhdGgnOlxuICAgICAgICAgICAgaWYgKCF2YWx1ZSB8fCB2YWx1ZSA9PT0gJ3Byb2plY3Q6Ly8nKSB7XG4gICAgICAgICAgICAgICAgcmVzID0gY3JlYXRlSW52YWxpZENoZWNrUmVzdWx0KCcgYnVpbGRQYXRoIGNhbiBub3QgYmUgZW1wdHknLCAncHJvamVjdDovL2J1aWxkJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoZWNrQnVpbGRQYXRoSXNJbnZhbGlkKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJlcyA9IGNyZWF0ZUludmFsaWRDaGVja1Jlc3VsdCgnYnVpbGRQYXRoIGlzIGludmFsaWQhJywgJ3Byb2plY3Q6Ly9idWlsZCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmt7vliqDlr7nml6fniYjmnKznm7jlr7not6/lvoTnmoTovazmjaLmlK/mjIFcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZS5zdGFydHNXaXRoKCcuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAncHJvamVjdDovLycgKyB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSB8fCAhaXNBYnNvbHV0ZShVdGlscy5QYXRoLnJlc29sdmVUb1Jhdyh2YWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IGNyZWF0ZUludmFsaWRDaGVja1Jlc3VsdChgYnVpbGRQYXRoKCR7dmFsdWV9KSBpcyBpbnZhbGlkIWAsICdwcm9qZWN0Oi8vYnVpbGQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gaGFjayDljp/nlJ/lubPlj7DkuI3mlK/mjIHkuK3mloflkoznibnmrornrKblj7dcbiAgICAgICAgICAgICAgICBpZiAoTkFUSVZFX1BMQVRGT1JNLmluY2x1ZGVzKG9wdGlvbnMucGxhdGZvcm0pICYmIGNoZWNrSW5jbHVkZUNoaW5lc2VBbmRTeW1ib2wodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChyZXMsICdmaXhlZFZhbHVlJylcbiAgICAgICAgICAgICAgICAgICAgICAgID8gY3JlYXRlSW52YWxpZENoZWNrUmVzdWx0KCdpMThuOmJ1aWxkZXIuZXJyb3IuYnVpbGRQYXRoQ29udGFpbnNDaGluZXNlQW5kU3ltYm9sJywgcmVzLmZpeGVkVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGNyZWF0ZUludmFsaWRDaGVja1Jlc3VsdCgnaTE4bjpidWlsZGVyLmVycm9yLmJ1aWxkUGF0aENvbnRhaW5zQ2hpbmVzZUFuZFN5bWJvbCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtZDVDYWNoZSc6XG4gICAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgY2FzZSAndXNlU3BsYXNoU2NyZWVuJzpcbiAgICAgICAgY2FzZSAnbWVyZ2VTdGFydFNjZW5lJzpcbiAgICAgICAgY2FzZSAnZXhwZXJpbWVudGFsRXJhc2VNb2R1bGVzJzpcbiAgICAgICAgY2FzZSAnc291cmNlTWFwcyc6XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgICAgIHJlcyA9IGNyZWF0ZVZhbGlkQ2hlY2tSZXN1bHQodHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICAgICAgcmVzID0gY3JlYXRlVmFsaWRDaGVja1Jlc3VsdChmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc2VydmVyJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgdmFsaWRhdG9yTWFuYWdlci5jaGVjayhcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGJ1aWxkZXJDb25maWcuY29tbW9uT3B0aW9uQ29uZmlncy5zZXJ2ZXIudmVyaWZ5UnVsZXMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGxhdGZvcm0gKyBvcHRpb25zLnBsYXRmb3JtLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gY3JlYXRlSW52YWxpZENoZWNrUmVzdWx0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGNoZWNrSW5jbHVkZUNoaW5lc2VBbmRTeW1ib2wodmFsdWU6IHN0cmluZykge1xuICAgIHJldHVybiAvW2B+ISMkJV4mKis9PD4/J3t9fCw7J8K3fu+8gSPvv6Ul4oCm4oCmJirvvIjvvIkrPXt9fOOAiuOAi++8n++8muKAnOKAneOAkOOAkeOAge+8m+KAmCfvvIzjgILjgIFAXFx1NGUwMC1cXHU5ZmE1XS9pbS50ZXN0KHZhbHVlKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrQnVpbGRDb21tb25PcHRpb25zKG9wdGlvbnM6IGFueSkge1xuICAgIGNvbnN0IGNvbW1vbk9wdGlvbnMgPSBidWlsZGVyQ29uZmlnLmdldEJ1aWxkQ29tbW9uT3B0aW9ucygpO1xuICAgIGNvbnN0IGNoZWNrUmVzTWFwOiBSZWNvcmQ8c3RyaW5nLCBCdWlsZENoZWNrUmVzdWx0PiA9IHt9O1xuICAgIC8vIGNvbnN0IGNoZWNrS2V5cyA9IEFycmF5LmZyb20obmV3IFNldChPYmplY3Qua2V5cyhjb21tb25PcHRpb25zKS5jb25jYXQoT2JqZWN0LmtleXMob3B0aW9ucykpKSlcbiAgICAvLyDmraPluLjmnaXor7TlupTor6Xmo4Dmn6Xpu5jorqTlgLzlkowgb3B0aW9ucyDmlbTlkIjnmoQga2V5XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoY29tbW9uT3B0aW9ucykpIHtcbiAgICAgICAgY2hlY2tSZXNNYXBba2V5XSA9IGF3YWl0IGNoZWNrQnVpbGRDb21tb25PcHRpb25zQnlLZXkoa2V5LCBvcHRpb25zW2tleV0sIG9wdGlvbnMpIHx8IGNyZWF0ZVZhbGlkQ2hlY2tSZXN1bHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrUmVzTWFwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tCdW5kbGVDb21wcmVzc2lvblNldHRpbmcodmFsdWU6IEJ1bmRsZUNvbXByZXNzaW9uVHlwZSwgc3VwcG9ydGVkQ29tcHJlc3Npb25UeXBlczogQnVuZGxlQ29tcHJlc3Npb25UeXBlW10pOiBCdWlsZENoZWNrUmVzdWx0IHtcbiAgICBpZiAoc3VwcG9ydGVkQ29tcHJlc3Npb25UeXBlcyAmJiAtMSA9PT0gc3VwcG9ydGVkQ29tcHJlc3Npb25UeXBlcy5pbmRleE9mKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlSW52YWxpZENoZWNrUmVzdWx0KGAgY29tcHJlc3Npb24gdHlwZSgke3ZhbHVlfSkgaXMgaW52YWxpZCBmb3IgdGhpcyBwbGF0Zm9ybSFgLCBCdW5kbGVDb21wcmVzc2lvblR5cGVzLk1FUkdFX0RFUCk7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVWYWxpZENoZWNrUmVzdWx0KCk7XG59XG4vKipcbiAqIOaVtOWQiOaehOW7uumFjee9rueahOW8leaTjuaooeWdl+mFjee9rlxuICog6KeE5YiZ77yaXG4gKiAgIOWtl+auteWAvOS4uuW4g+WwlOWAvO+8jOWImeW9k+WJjeWAvOS9nOS4uuatpOaooeWdl+eahOW8gOWFs1xuICogICDlrZfmrrXlgLzkuLrlrZfnrKbkuLLvvIzliJnmoLnmja4gb3ZlcndyaXRlTW9kdWxlQ29uZmlnIOmFjee9ruWAvOi/m+ihjOWJlOmZpOabv+aNolxuICogQHBhcmFtIG9wdGlvbnMgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVPdmVyd3JpdGVQcm9qZWN0U2V0dGluZ3Mob3B0aW9uczogSUJ1aWxkVGFza09wdGlvbikge1xuICAgIGNvbnN0IG92ZXJ3cml0ZU1vZHVsZXMgPSBvcHRpb25zLm92ZXJ3cml0ZVByb2plY3RTZXR0aW5ncz8uaW5jbHVkZU1vZHVsZXM7XG4gICAgbGV0IGluY2x1ZGVNb2R1bGVzID0gb3B0aW9ucy5pbmNsdWRlTW9kdWxlcyA/IFsuLi5vcHRpb25zLmluY2x1ZGVNb2R1bGVzXSA6IG9wdGlvbnMuaW5jbHVkZU1vZHVsZXM7XG4gICAgaWYgKGluY2x1ZGVNb2R1bGVzICYmIG92ZXJ3cml0ZU1vZHVsZXMgJiYgaW5jbHVkZU1vZHVsZXMubGVuZ3RoKSB7XG4gICAgICAgIGZvciAoY29uc3QgbW9kdWxlIGluIG92ZXJ3cml0ZU1vZHVsZXMpIHtcbiAgICAgICAgICAgIGlmIChvdmVyd3JpdGVNb2R1bGVzW21vZHVsZV0gIT09ICdpbmhlcml0LXByb2plY3Qtc2V0dGluZycpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG92ZXJ3cml0ZU1vZHVsZXNbbW9kdWxlXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdvbic6XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlTW9kdWxlcy5wdXNoKG1vZHVsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnb2ZmJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVNb2R1bGVzID0gaW5jbHVkZU1vZHVsZXMuZmlsdGVyKChlbmdpbmVNb2R1bGUpID0+IGVuZ2luZU1vZHVsZSAhPT0gbW9kdWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG92ZXJ3cml0ZU1vZHVsZUNvbmZpZ1ttb2R1bGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3ZlcndyaXRlTW9kdWxlSW5kZXggPSBpbmNsdWRlTW9kdWxlcy5maW5kSW5kZXgob3ZlcndyaXRlTW9kdWxlQ29uZmlnW21vZHVsZV0ubWF0Y2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdmVyd3JpdGVNb2R1bGVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pyq5byA5ZCv5qih5Z2X5pe277yM5pu/5o2i5peg5pWIXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZU1vZHVsZXMuc3BsaWNlKG92ZXJ3cml0ZU1vZHVsZUluZGV4LCAxLCBvdmVyd3JpdGVNb2R1bGVzW21vZHVsZV0gYXMgc3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIG92ZXJ3cml0ZSBjb25maWcgb2YgZW5naW5lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMuaW5jbHVkZU1vZHVsZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoaW5jbHVkZU1vZHVsZXMpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVJbmNsdWRlTW9kdWxlc0Zyb21FbmdpbmVDb25maWcoXG4gICAgZW5naW5lQ29uZmlnOiBSZXR1cm5UeXBlPHR5cGVvZiBFbmdpbmUuZ2V0Q29uZmlnPiAmIHtcbiAgICAgICAgY29uZmlncz86IFJlY29yZDxzdHJpbmcsIHsgaW5jbHVkZU1vZHVsZXM/OiBzdHJpbmdbXSB9PjtcbiAgICAgICAgZ2xvYmFsQ29uZmlnS2V5Pzogc3RyaW5nO1xuICAgIH0sXG4gICAgZW5naW5lTW9kdWxlc0NvbmZpZ0tleT86IHN0cmluZyxcbikge1xuICAgIGlmIChlbmdpbmVNb2R1bGVzQ29uZmlnS2V5KSB7XG4gICAgICAgIGNvbnN0IGluY2x1ZGVNb2R1bGVzID0gZW5naW5lQ29uZmlnLmNvbmZpZ3M/LltlbmdpbmVNb2R1bGVzQ29uZmlnS2V5XT8uaW5jbHVkZU1vZHVsZXM7XG4gICAgICAgIGlmICghaW5jbHVkZU1vZHVsZXM/Lmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVuZ2luZU1vZHVsZXNDb25maWdLZXk6ICR7ZW5naW5lTW9kdWxlc0NvbmZpZ0tleX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gWy4uLmluY2x1ZGVNb2R1bGVzXTtcbiAgICB9XG5cbiAgICBpZiAoZW5naW5lQ29uZmlnLmluY2x1ZGVNb2R1bGVzPy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIFsuLi5lbmdpbmVDb25maWcuaW5jbHVkZU1vZHVsZXNdO1xuICAgIH1cblxuICAgIGNvbnN0IHNlbGVjdGVkQ29uZmlnS2V5ID0gZW5naW5lQ29uZmlnLmdsb2JhbENvbmZpZ0tleSB8fCBPYmplY3Qua2V5cyhlbmdpbmVDb25maWcuY29uZmlncyB8fCB7fSlbMF07XG4gICAgY29uc3QgaW5jbHVkZU1vZHVsZXMgPSBzZWxlY3RlZENvbmZpZ0tleSA/IGVuZ2luZUNvbmZpZy5jb25maWdzPy5bc2VsZWN0ZWRDb25maWdLZXldPy5pbmNsdWRlTW9kdWxlcyA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gaW5jbHVkZU1vZHVsZXM/Lmxlbmd0aCA/IFsuLi5pbmNsdWRlTW9kdWxlc10gOiBbXTtcbn1cblxuLyoqXG4gKiBGaWxsIGBvcHRpb25zLmluY2x1ZGVNb2R1bGVzYCBmcm9tIHRoZSBwcm9qZWN0IGVuZ2luZSBjb25maWcgKHNldHRpbmdzL2NvY29zLmNvbmZpZy5qc29uKSB3aGVuIGl0IGlzIGVtcHR5LFxuICogc28gdGhlIHByZXZpZXcgcGF0aCBwcm9kdWNlcyB0aGUgc2FtZSBgaW5jbHVkZU1vZHVsZXNgIGFzIGEgZm9ybWFsIGJ1aWxkIChjaGVja1Byb2plY3RTZXR0aW5nKS5cbiAqIERvZXMgbm90IG92ZXJyaWRlIGFuIGFscmVhZHkgbm9uLWVtcHR5IGBpbmNsdWRlTW9kdWxlc2AuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaWxsSW5jbHVkZU1vZHVsZXNGcm9tUHJvamVjdENvbmZpZyhcbiAgICBvcHRpb25zOiB7IGluY2x1ZGVNb2R1bGVzPzogc3RyaW5nW107IGVuZ2luZU1vZHVsZXNDb25maWdLZXk/OiBzdHJpbmcgfSxcbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghb3B0aW9ucy5pbmNsdWRlTW9kdWxlcyB8fCAhb3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5sZW5ndGgpIHtcbiAgICAgICAgb3B0aW9ucy5pbmNsdWRlTW9kdWxlcyA9IHJlc29sdmVJbmNsdWRlTW9kdWxlc0Zyb21FbmdpbmVDb25maWcoRW5naW5lLmdldENvbmZpZygpLCBvcHRpb25zLmVuZ2luZU1vZHVsZXNDb25maWdLZXkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrUHJvamVjdFNldHRpbmcob3B0aW9uczogSUludGVybmFsQnVpbGRPcHRpb25zIHwgSUludGVybmFsQnVuZGxlQnVpbGRPcHRpb25zKSB7XG4gICAgb3B0aW9ucy5lbmdpbmVJbmZvID0gb3B0aW9ucy5lbmdpbmVJbmZvIHx8IGNsb25lQ29uZmlnVmFsdWUoRW5naW5lLmdldEluZm8oKSk7XG5cbiAgICBjb25zdCBlbmdpbmVDb25maWcgPSBFbmdpbmUuZ2V0Q29uZmlnKCk7XG4gICAgY29uc3QgeyBkZXNpZ25SZXNvbHV0aW9uLCByZW5kZXJQaXBlbGluZSwgcGh5c2ljc0NvbmZpZywgY3VzdG9tTGF5ZXJzLCBzb3J0aW5nTGF5ZXJzLCBtYWNyb0NvbmZpZyB9ID0gZW5naW5lQ29uZmlnO1xuICAgIC8vIOm7mOiupCBDYW52YXMg6K6+572uXG4gICAgaWYgKCFvcHRpb25zLmRlc2lnblJlc29sdXRpb24pIHtcbiAgICAgICAgb3B0aW9ucy5kZXNpZ25SZXNvbHV0aW9uID0gY2xvbmVDb25maWdWYWx1ZShkZXNpZ25SZXNvbHV0aW9uKTtcbiAgICB9XG5cbiAgICAvLyByZW5kZXJQaXBlbGluZVxuICAgIGlmICghb3B0aW9ucy5yZW5kZXJQaXBlbGluZSkge1xuICAgICAgICBpZiAocmVuZGVyUGlwZWxpbmUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyUGlwZWxpbmUgPSBjbG9uZUNvbmZpZ1ZhbHVlKHJlbmRlclBpcGVsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHBoeXNpY3NDb25maWdcbiAgICBpZiAoIW9wdGlvbnMucGh5c2ljc0NvbmZpZykge1xuICAgICAgICBvcHRpb25zLnBoeXNpY3NDb25maWcgPSBjbG9uZUNvbmZpZ1ZhbHVlKHBoeXNpY3NDb25maWcpO1xuICAgICAgICBpZiAoIW9wdGlvbnMucGh5c2ljc0NvbmZpZy5kZWZhdWx0TWF0ZXJpYWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMucGh5c2ljc0NvbmZpZy5kZWZhdWx0TWF0ZXJpYWwgPSAnYmEyMTQ3NmYtMjg2Ni00ZjgxLTljNGQtNmUzNTkzMTZlNDQ4JztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGN1c3RvbUxheWVyc1xuICAgIGlmICghb3B0aW9ucy5jdXN0b21MYXllcnMpIHtcbiAgICAgICAgb3B0aW9ucy5jdXN0b21MYXllcnMgPSBjbG9uZUNvbmZpZ1ZhbHVlKGN1c3RvbUxheWVycyk7XG4gICAgfVxuXG4gICAgLy8gc29ydGluZ0xheWVyc1xuICAgIGlmICghb3B0aW9ucy5zb3J0aW5nTGF5ZXJzKSB7XG4gICAgICAgIGlmIChzb3J0aW5nTGF5ZXJzKSB7XG4gICAgICAgICAgICBvcHRpb25zLnNvcnRpbmdMYXllcnMgPSBjbG9uZUNvbmZpZ1ZhbHVlKHNvcnRpbmdMYXllcnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbWFjcm8g6YWN572uXG4gICAgaWYgKCFvcHRpb25zLm1hY3JvQ29uZmlnKSB7XG4gICAgICAgIGlmIChtYWNyb0NvbmZpZykge1xuICAgICAgICAgICAgb3B0aW9ucy5tYWNyb0NvbmZpZyA9IGNsb25lQ29uZmlnVmFsdWUobWFjcm9Db25maWcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLmluY2x1ZGVNb2R1bGVzIHx8ICFvcHRpb25zLmluY2x1ZGVNb2R1bGVzLmxlbmd0aCkge1xuICAgICAgICBvcHRpb25zLmluY2x1ZGVNb2R1bGVzID0gcmVzb2x2ZUluY2x1ZGVNb2R1bGVzRnJvbUVuZ2luZUNvbmZpZyhlbmdpbmVDb25maWcsIG9wdGlvbnMuZW5naW5lTW9kdWxlc0NvbmZpZ0tleSk7XG4gICAgfVxuXG4gICAgLy8g56Gu5L+dIGluY2x1ZGVNb2R1bGVzIOS4reWMheWQqyAnZGVidWctcmVuZGVyZXInXG4gICAgaWYgKCFvcHRpb25zLmluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdkZWJ1Zy1yZW5kZXJlcicpKSB7XG4gICAgICAgIG9wdGlvbnMuaW5jbHVkZU1vZHVsZXMucHVzaCgnZGVidWctcmVuZGVyZXInKTtcbiAgICB9XG5cbiAgICAvLyDoh6rlrprkuYnnrqHnur/phY3nva5cbiAgICBvcHRpb25zLmN1c3RvbVBpcGVsaW5lID0gb3B0aW9ucy5jdXN0b21QaXBlbGluZSB8fCBvcHRpb25zLmluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdjdXN0b20tcGlwZWxpbmUnKTtcblxuICAgIGlmICghb3B0aW9ucy5mbGFncykge1xuICAgICAgICBvcHRpb25zLmZsYWdzID0ge1xuICAgICAgICAgICAgTE9BRF9CVUxMRVRfTUFOVUFMTFk6IGZhbHNlLFxuICAgICAgICAgICAgTE9BRF9TUElORV9NQU5VQUxMWTogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLnNwbGFzaFNjcmVlbikge1xuICAgICAgICBvcHRpb25zLnNwbGFzaFNjcmVlbiA9IGNsb25lQ29uZmlnVmFsdWUoZW5naW5lQ29uZmlnLnNwbGFzaFNjcmVlbik7XG4gICAgfVxuXG59XG5cbiJdfQ==