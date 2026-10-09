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
exports.compareNumeric = compareNumeric;
exports.compareUUID = compareNumeric;
exports.cloneConfigValue = cloneConfigValue;
exports.getOptionsDefault = getOptionsDefault;
exports.checkCompressOptions = checkCompressOptions;
exports.warnModuleFallBack = warnModuleFallBack;
exports.transTimeToNumber = transTimeToNumber;
exports.getTaskLogDest = getTaskLogDest;
exports.getCurrentTime = getCurrentTime;
exports.changeToLocalTime = changeToLocalTime;
exports.checkHasError = checkHasError;
exports.getParamsFromCommand = getParamsFromCommand;
exports.checkConfigDefault = checkConfigDefault;
exports.defaultsDeep = defaultsDeep;
exports.defaultMerge = defaultMerge;
exports.getBuildPath = getBuildPath;
exports.requestModule = requestModule;
exports.formatMSTime = formatMSTime;
exports.resolveToRaw = resolveToRaw;
const path_1 = require("path");
const textureCompressConfig = __importStar(require("../share/texture-compress"));
const i18n_1 = __importDefault(require("../../base/i18n"));
const utils_1 = __importDefault(require("../../base/utils"));
const builder_config_1 = __importDefault(require("./builder-config"));
function compareNumeric(lhs, rhs) {
    return lhs.localeCompare(rhs, 'en', { numeric: true });
}
function cloneConfigValue(value) {
    return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value));
}
/**
 * 解析配置 options 内的默认值
 * @param options
 */
function getOptionsDefault(options) {
    const result = {};
    Object.keys(options).forEach((key) => {
        result[key] = options[key].default;
    });
    return result;
}
function checkCompressOptions(configs) {
    if (!configs || typeof configs !== 'object' || Array.isArray(configs)) {
        console.error(i18n_1.default.t('builder.project.texture_compress.tips.require_object'));
        return false;
    }
    const platforms = Object.keys(textureCompressConfig.configGroups);
    for (const key of Object.keys(configs)) {
        const item = configs[key];
        if (!item || typeof item !== 'object') {
            console.error(i18n_1.default.t('builder.project.texture_compress.tips.xx_require_object', {
                name: `${key}(${item})`,
            }));
            return false;
        }
        if (!item.name) {
            console.error(i18n_1.default.t('builder.project.texture_compress.tips.require_name'));
            return false;
        }
        if (!item.options || typeof item.options !== 'object' || Array.isArray(item)) {
            console.error(i18n_1.default.t('builder.project.texture_compress.tips.xx_require_object', {
                name: 'options',
            }));
            return false;
        }
        for (const configPlatform of Object.keys(item.options)) {
            if (!platforms.includes(configPlatform)) {
                console.error(i18n_1.default.t('builder.project.texture_compress.tips.platform_err', {
                    name: 'options',
                    supportPlatforms: platforms.toString(),
                }));
                return false;
            }
            const compressOptions = item.options[configPlatform];
            for (const textureCompressType of Object.keys(compressOptions)) {
                // const config = textureCompressConfig.formatsInfo[textureCompressType];
                // if (!config) {
                //     console.error(i18n.t('builder.project.texture_compress.tips.texture_type_err', {
                //         format: textureCompressType,
                //         supportFormats: Object.keys(textureCompressConfig.formatsInfo).toString(),
                //     }));
                //     return false;
                // }
                // // @ts-ignore
                // const qualityOptions = textureCompressConfig.textureFormatConfigs[config.formatType];
                // const value = compressOptions[textureCompressType];
                // if (config.formatType !== 'number') {
                //     if (!Object.keys(qualityOptions.options).includes(value)) {
                //         console.error(i18n.t('builder.project.texture_compress.tips.options_quality_type_err', {
                //             userformatType: value,
                //             formatType: config.formatType,
                //             formatTypeOptions: Object.keys(qualityOptions.options).toString(),
                //         }));
                //         return false;
                //     }
                // } else {
                //     if (typeof value !== 'number' || value < qualityOptions.min || value > qualityOptions.max) {
                //         console.error(i18n.t('builder.project.texture_compress.tips.options_quality_type_err', {
                //             userformatType: value,
                //             min: qualityOptions.min,
                //             max: qualityOptions.max,
                //         }));
                //         return false;
                //     }
                // }
            }
        }
    }
    return true;
}
async function warnModuleFallBack(moduleToFallBack, platform) {
    if (!Object.keys(moduleToFallBack).length) {
        return;
    }
    const fallbackMsg = Object.keys(moduleToFallBack).reduce((prev, curr, index) => {
        if (index === 1) {
            return changeFallbackStr(prev) + `, ${changeFallbackStr(curr, moduleToFallBack[curr])}`;
        }
        return prev + `, ${changeFallbackStr(curr, moduleToFallBack[curr])}`;
    });
    return console.warn(i18n_1.default.t('builder.warn.engine_modules_fall_back_tip', {
        platform,
        fallbackMsg,
    }));
}
function changeFallbackStr(module, fallback) {
    return fallback ? `${module} -> ${fallback}` : `${module}×`;
}
/**
 * 将路径名称的时间转为时间戳
 * @param time
 * @returns
 */
function transTimeToNumber(time) {
    time = (0, path_1.basename)(time, '.log');
    const info = time.match(/-(\d+)$/);
    if (info) {
        const timeStr = Array.from(time);
        timeStr[info.index] = ':';
        return new Date(timeStr.join('')).getTime();
    }
    return new Date().getTime();
}
/**
 * 获取一个可作为构建任务日志的路径(project://temp/builder/log/xxx2019-3-20 16-00.log)
 * @param taskName
 * @param time
 * @returns
 */
function getTaskLogDest(taskName, time) {
    return utils_1.default.Path.resolveToUrl((0, path_1.join)(builder_config_1.default.projectTempDir, 'builder', 'log', taskName + changeToLocalTime(time, 5).replace(/:/g, '-') + '.log'), 'project');
}
/**
 * 获取可阅读的最新时间信息（2023-4-24 17:31:54）
 */
function getCurrentTime() {
    return changeToLocalTime(Date.now());
}
/**
 * 将时间戳转为可阅读的时间信息（2023-4-24 17:31:54）
 * @param t
 */
function changeToLocalTime(t, len = 8) {
    const time = new Date(Number(t));
    return time.toLocaleDateString().replace(/\//g, '-') + ' ' + time.toTimeString().slice(0, len);
}
/**
 * 检查传递的 errorMap 内是否包含错误字符串信息
 * @param errorMap
 * @returns boolean true：存在错误
 */
function checkHasError(errorMap) {
    if (!errorMap) {
        return false;
    }
    if (typeof errorMap === 'object' && !Array.isArray(errorMap)) {
        for (const key of Object.keys(errorMap)) {
            const res = checkHasError(errorMap[key]);
            if (res) {
                return true;
            }
        }
    }
    else if (typeof errorMap === 'string') {
        return true;
    }
    return false;
}
/**
 * 从命令中提取参数
 * @param command
 * @returns
 */
function getParamsFromCommand(command) {
    if (!command) {
        return [];
    }
    const matchInfo = command.match(/\$\{([^${}]*)}/g);
    if (!matchInfo) {
        return [];
    }
    return matchInfo.map((str) => str.replace('${', '').replace('}', ''));
}
function checkConfigDefault(config) {
    if (!config) {
        return null;
    }
    if (config.default !== undefined && config.default !== null) {
        return config.default;
    }
    if (config.type === 'array' && config.items) {
        config.default = [];
        // array items can be a single config or an array of configs
        const items = Array.isArray(config.items) ? config.items : [config.items];
        items.forEach((item, index) => {
            config.default[index] = checkConfigDefault(item);
        });
    }
    if (config.type === 'object' && config.properties) {
        config.default = {};
        Object.keys(config.properties).forEach((itemKey) => {
            config.default[itemKey] = checkConfigDefault(config.properties[itemKey]);
        });
    }
    return config.default;
}
function defaultsDeep(data, defaultData) {
    if (data === undefined || data === null) {
        return data;
    }
    if (Array.isArray(data)) {
        return data;
    }
    Object.keys(defaultData).forEach((key) => {
        const value = defaultData[key];
        if (typeof value === 'object' && !Array.isArray(value) && value) {
            if (!data[key]) {
                data[key] = {};
            }
            defaultsDeep(data[key], value);
            return;
        }
        if (data[key] === undefined || data[key] === null) {
            data[key] = value;
        }
    });
    return data;
}
function defaultMerge(target, ...sources) {
    // 遍历 sources 数组中的每一个源对象
    for (const source of sources) {
        // 如果源对象为空或不是一个对象，跳过
        if (!source || typeof source !== 'object') {
            continue;
        }
        // 遍历源对象的所有可枚举属性
        for (const key in source) {
            // 如果目标对象没有该属性，直接复制
            if (!(key in target)) {
                target[key] = source[key];
            }
            else {
                // 如果目标对象已经有该属性，且该属性的值是对象类型，递归合并
                if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    // 如果自定义合并函数存在，则调用自定义合并函数，否则递归调用 mergeWith() 方法合并
                    target[key] = defaultMerge(target[key], source[key]);
                }
                else {
                    // 否则直接使用源对象的属性覆盖目标对象的属性
                    target[key] = source[key];
                }
            }
        }
    }
    // 返回合并后的目标对象
    return target;
}
function getBuildPath(options) {
    return (0, path_1.join)(utils_1.default.Path.resolveToRaw(options.buildPath), options.outputName || options.platform);
}
/**
 * 执行某个模块的方法或者获取某个模块的属性值
 * @param module
 * @param key
 * @param args
 */
async function requestModule(module, key, ...args) {
    try {
        if (typeof module === 'function') {
            return await module[key](...args);
        }
        return module[key];
    }
    catch (error) {
        console.debug(error);
        return null;
    }
}
/**
 * 将毫秒时间转换为时分秒
 * @param msTime
 */
function formatMSTime(msTime) {
    const time = msTime / 1000;
    let res = '';
    const hour = Math.floor(time / 60 / 60);
    if (hour) {
        res = `${hour} h`;
    }
    const minute = (Math.floor(time / 60) % 60);
    if (minute) {
        res += ` ${minute} min`;
    }
    const second = (Math.floor(time) % 60);
    if (second) {
        res += ` ${second} s`;
    }
    const ms = msTime - (hour * 60 * 60 + minute * 60 + second) * 1000;
    // 产品需求：不足秒时才显示毫秒
    if (ms && !res) {
        res += ` ${ms} ms`;
    }
    return res.trimStart();
}
function resolveToRaw(urlOrPath, root) {
    if ((0, path_1.isAbsolute)(urlOrPath)) {
        return urlOrPath;
    }
    else {
        return (0, path_1.join)(root, urlOrPath);
    }
}
