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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3NoYXJlL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBT0Esd0NBRUM7QUFFMEIscUNBQVc7QUFFdEMsNENBRUM7QUFNRCw4Q0FNQztBQUVELG9EQXdFQztBQUVELGdEQWNDO0FBV0QsOENBU0M7QUFRRCx3Q0FFQztBQUtELHdDQUVDO0FBTUQsOENBR0M7QUFPRCxzQ0FlQztBQU9ELG9EQVNDO0FBRUQsZ0RBc0JDO0FBRUQsb0NBcUJDO0FBRUQsb0NBMEJDO0FBRUQsb0NBRUM7QUFRRCxzQ0FVQztBQU1ELG9DQXFCQztBQUVELG9DQU1DO0FBN1VELCtCQUF1RTtBQUN2RSxpRkFBbUU7QUFDbkUsMkRBQW1DO0FBQ25DLDZEQUFxQztBQUVyQyxzRUFBNkM7QUFFN0MsU0FBZ0IsY0FBYyxDQUFDLEdBQVcsRUFBRSxHQUFXO0lBQ25ELE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUlELFNBQWdCLGdCQUFnQixDQUFJLEtBQVE7SUFDeEMsT0FBTyxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLE9BQXdCO0lBQ3RELE1BQU0sTUFBTSxHQUF3QixFQUFFLENBQUM7SUFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFFRCxTQUFnQixvQkFBb0IsQ0FBQyxPQUFZO0lBQzdDLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNwRSxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxDQUFDLENBQUMsc0RBQXNELENBQUMsQ0FBQyxDQUFDO1FBQzlFLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRWxFLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLENBQUMsQ0FBQyx5REFBeUQsRUFBRTtnQkFDNUUsSUFBSSxFQUFFLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRzthQUMxQixDQUFDLENBQUMsQ0FBQztZQUNKLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsQ0FBQyxDQUFDLG9EQUFvRCxDQUFDLENBQUMsQ0FBQztZQUM1RSxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDM0UsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsQ0FBQyxDQUFDLHlEQUF5RCxFQUFFO2dCQUM1RSxJQUFJLEVBQUUsU0FBUzthQUNsQixDQUFDLENBQUMsQ0FBQztZQUNKLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFDRCxLQUFLLE1BQU0sY0FBYyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDckQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsQ0FBQyxDQUFDLG9EQUFvRCxFQUFFO29CQUN2RSxJQUFJLEVBQUUsU0FBUztvQkFDZixnQkFBZ0IsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFO2lCQUN6QyxDQUFDLENBQUMsQ0FBQztnQkFDSixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNyRCxLQUFLLE1BQU0sbUJBQW1CLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO2dCQUM3RCx5RUFBeUU7Z0JBQ3pFLGlCQUFpQjtnQkFDakIsdUZBQXVGO2dCQUN2Rix1Q0FBdUM7Z0JBQ3ZDLHFGQUFxRjtnQkFDckYsV0FBVztnQkFDWCxvQkFBb0I7Z0JBQ3BCLElBQUk7Z0JBQ0osZ0JBQWdCO2dCQUNoQix3RkFBd0Y7Z0JBQ3hGLHNEQUFzRDtnQkFDdEQsd0NBQXdDO2dCQUN4QyxrRUFBa0U7Z0JBQ2xFLG1HQUFtRztnQkFDbkcscUNBQXFDO2dCQUNyQyw2Q0FBNkM7Z0JBQzdDLGlGQUFpRjtnQkFDakYsZUFBZTtnQkFDZix3QkFBd0I7Z0JBQ3hCLFFBQVE7Z0JBQ1IsV0FBVztnQkFDWCxtR0FBbUc7Z0JBQ25HLG1HQUFtRztnQkFDbkcscUNBQXFDO2dCQUNyQyx1Q0FBdUM7Z0JBQ3ZDLHVDQUF1QztnQkFDdkMsZUFBZTtnQkFDZix3QkFBd0I7Z0JBQ3hCLFFBQVE7Z0JBQ1IsSUFBSTtZQUNSLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFTSxLQUFLLFVBQVUsa0JBQWtCLENBQUMsZ0JBQXdDLEVBQUUsUUFBZ0I7SUFDL0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN4QyxPQUFPO0lBQ1gsQ0FBQztJQUNELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQzNFLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2QsT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLGlCQUFpQixDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDNUYsQ0FBQztRQUNELE9BQU8sSUFBSSxHQUFHLEtBQUssaUJBQWlCLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUN6RSxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsQ0FBQyxDQUFDLDJDQUEyQyxFQUFFO1FBQ3BFLFFBQVE7UUFDUixXQUFXO0tBQ2QsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxNQUFjLEVBQUUsUUFBaUI7SUFDeEQsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxPQUFPLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDO0FBQ2hFLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWTtJQUMxQyxJQUFJLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbkMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNQLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFNLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDM0IsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDaEQsQ0FBQztJQUNELE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQyxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixjQUFjLENBQUMsUUFBZ0IsRUFBRSxJQUFxQjtJQUNsRSxPQUFPLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUEsV0FBSSxFQUFDLHdCQUFhLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsUUFBUSxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZLLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLGNBQWM7SUFDMUIsT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsQ0FBa0IsRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUN6RCxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ25HLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLFFBQThCO0lBQ3hELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNaLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUMzRCxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUN0QyxNQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekMsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDTixPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7U0FBTSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ3RDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLG9CQUFvQixDQUFDLE9BQWU7SUFDaEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0lBQ0QsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ25ELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNiLE9BQU8sRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxNQUEwQjtJQUN6RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDVixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLFNBQVMsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQzFELE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQztJQUMxQixDQUFDO0lBQ0QsSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDcEIsNERBQTREO1FBQzVELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzFCLE1BQU0sQ0FBQyxPQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsSUFBMEIsQ0FBQyxDQUFDO1FBQzVFLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNELElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hELE1BQU0sQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQy9DLE1BQU0sQ0FBQyxPQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQXVCLENBQUMsQ0FBQztRQUNwRyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDMUIsQ0FBQztBQUVELFNBQWdCLFlBQVksQ0FBQyxJQUFTLEVBQUUsV0FBZ0I7SUFDcEQsSUFBSSxJQUFJLEtBQUssU0FBUyxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUN0QyxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDdEIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDckMsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMvQixPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDaEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUN0QixDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLE1BQTJCLEVBQUUsR0FBRyxPQUE4QjtJQUN2Rix3QkFBd0I7SUFDeEIsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUMzQixvQkFBb0I7UUFDcEIsSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUN4QyxTQUFTO1FBQ2IsQ0FBQztRQUNELGdCQUFnQjtRQUNoQixLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ3ZCLG1CQUFtQjtZQUNuQixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ0osZ0NBQWdDO2dCQUNoQyxJQUFJLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDakUsaURBQWlEO29CQUNqRCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDekQsQ0FBQztxQkFBTSxDQUFDO29CQUNKLHdCQUF3QjtvQkFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUNELGFBQWE7SUFDYixPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLE9BQXlCO0lBQ2xELE9BQU8sSUFBQSxXQUFJLEVBQUMsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxVQUFVLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BHLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxhQUFhLENBQUMsTUFBVyxFQUFFLEdBQVcsRUFBRSxHQUFHLElBQVc7SUFDeEUsSUFBSSxDQUFDO1FBQ0QsSUFBSSxPQUFPLE1BQU0sS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUMvQixPQUFPLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFlBQVksQ0FBQyxNQUFjO0lBQ3ZDLE1BQU0sSUFBSSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDM0IsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLElBQUksSUFBSSxFQUFFLENBQUM7UUFDUCxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQztJQUN0QixDQUFDO0lBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUM1QyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1QsR0FBRyxJQUFJLElBQUksTUFBTSxNQUFNLENBQUM7SUFDNUIsQ0FBQztJQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUN2QyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1QsR0FBRyxJQUFJLElBQUksTUFBTSxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQUNELE1BQU0sRUFBRSxHQUFHLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ25FLGlCQUFpQjtJQUNqQixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2IsR0FBRyxJQUFJLElBQUksRUFBRSxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzNCLENBQUM7QUFFRCxTQUFnQixZQUFZLENBQUMsU0FBaUIsRUFBRSxJQUFZO0lBQ3hELElBQUksSUFBQSxpQkFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFDeEIsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLElBQUEsV0FBSSxFQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNqQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJhc2VuYW1lLCBpc0Fic29sdXRlLCBqb2luLCBub3JtYWxpemUsIHJlbGF0aXZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0ZXh0dXJlQ29tcHJlc3NDb25maWcgZnJvbSAnLi4vc2hhcmUvdGV4dHVyZS1jb21wcmVzcyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uL2Jhc2UvdXRpbHMnO1xuaW1wb3J0IHsgSUJ1aWxkT3B0aW9uQmFzZSwgSUJ1aWxkVGFza09wdGlvbiwgSURpc3BsYXlPcHRpb25zIH0gZnJvbSAnLi4vQHR5cGVzJztcbmltcG9ydCBidWlsZGVyQ29uZmlnIGZyb20gJy4vYnVpbGRlci1jb25maWcnO1xuaW1wb3J0IHsgSUJ1aWxkZXJDb25maWdJdGVtIH0gZnJvbSAnLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZU51bWVyaWMobGhzOiBzdHJpbmcsIHJoczogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbGhzLmxvY2FsZUNvbXBhcmUocmhzLCAnZW4nLCB7IG51bWVyaWM6IHRydWUgfSk7XG59XG5cbmV4cG9ydCB7IGNvbXBhcmVOdW1lcmljIGFzIGNvbXBhcmVVVUlEIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZUNvbmZpZ1ZhbHVlPFQ+KHZhbHVlOiBUKTogVCB7XG4gICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgPyB2YWx1ZSA6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcbn1cblxuLyoqXG4gKiDop6PmnpDphY3nva4gb3B0aW9ucyDlhoXnmoTpu5jorqTlgLxcbiAqIEBwYXJhbSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcHRpb25zRGVmYXVsdChvcHRpb25zOiBJRGlzcGxheU9wdGlvbnMpIHtcbiAgICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBPYmplY3Qua2V5cyhvcHRpb25zKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBvcHRpb25zW2tleV0uZGVmYXVsdDtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tDb21wcmVzc09wdGlvbnMoY29uZmlnczogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKCFjb25maWdzIHx8IHR5cGVvZiBjb25maWdzICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGNvbmZpZ3MpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoaTE4bi50KCdidWlsZGVyLnByb2plY3QudGV4dHVyZV9jb21wcmVzcy50aXBzLnJlcXVpcmVfb2JqZWN0JykpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgcGxhdGZvcm1zID0gT2JqZWN0LmtleXModGV4dHVyZUNvbXByZXNzQ29uZmlnLmNvbmZpZ0dyb3Vwcyk7XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhjb25maWdzKSkge1xuICAgICAgICBjb25zdCBpdGVtID0gY29uZmlnc1trZXldO1xuICAgICAgICBpZiAoIWl0ZW0gfHwgdHlwZW9mIGl0ZW0gIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGkxOG4udCgnYnVpbGRlci5wcm9qZWN0LnRleHR1cmVfY29tcHJlc3MudGlwcy54eF9yZXF1aXJlX29iamVjdCcsIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBgJHtrZXl9KCR7aXRlbX0pYCxcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWl0ZW0ubmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIucHJvamVjdC50ZXh0dXJlX2NvbXByZXNzLnRpcHMucmVxdWlyZV9uYW1lJykpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpdGVtLm9wdGlvbnMgfHwgdHlwZW9mIGl0ZW0ub3B0aW9ucyAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIucHJvamVjdC50ZXh0dXJlX2NvbXByZXNzLnRpcHMueHhfcmVxdWlyZV9vYmplY3QnLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ29wdGlvbnMnLFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgY29uZmlnUGxhdGZvcm0gb2YgT2JqZWN0LmtleXMoaXRlbS5vcHRpb25zKSkge1xuICAgICAgICAgICAgaWYgKCFwbGF0Zm9ybXMuaW5jbHVkZXMoY29uZmlnUGxhdGZvcm0pKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIucHJvamVjdC50ZXh0dXJlX2NvbXByZXNzLnRpcHMucGxhdGZvcm1fZXJyJywge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnb3B0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIHN1cHBvcnRQbGF0Zm9ybXM6IHBsYXRmb3Jtcy50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXByZXNzT3B0aW9ucyA9IGl0ZW0ub3B0aW9uc1tjb25maWdQbGF0Zm9ybV07XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRleHR1cmVDb21wcmVzc1R5cGUgb2YgT2JqZWN0LmtleXMoY29tcHJlc3NPcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnN0IGNvbmZpZyA9IHRleHR1cmVDb21wcmVzc0NvbmZpZy5mb3JtYXRzSW5mb1t0ZXh0dXJlQ29tcHJlc3NUeXBlXTtcbiAgICAgICAgICAgICAgICAvLyBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKGkxOG4udCgnYnVpbGRlci5wcm9qZWN0LnRleHR1cmVfY29tcHJlc3MudGlwcy50ZXh0dXJlX3R5cGVfZXJyJywge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgZm9ybWF0OiB0ZXh0dXJlQ29tcHJlc3NUeXBlLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgc3VwcG9ydEZvcm1hdHM6IE9iamVjdC5rZXlzKHRleHR1cmVDb21wcmVzc0NvbmZpZy5mb3JtYXRzSW5mbykudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAvLyAgICAgfSkpO1xuICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIC8vIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBxdWFsaXR5T3B0aW9ucyA9IHRleHR1cmVDb21wcmVzc0NvbmZpZy50ZXh0dXJlRm9ybWF0Q29uZmlnc1tjb25maWcuZm9ybWF0VHlwZV07XG4gICAgICAgICAgICAgICAgLy8gY29uc3QgdmFsdWUgPSBjb21wcmVzc09wdGlvbnNbdGV4dHVyZUNvbXByZXNzVHlwZV07XG4gICAgICAgICAgICAgICAgLy8gaWYgKGNvbmZpZy5mb3JtYXRUeXBlICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIC8vICAgICBpZiAoIU9iamVjdC5rZXlzKHF1YWxpdHlPcHRpb25zLm9wdGlvbnMpLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIucHJvamVjdC50ZXh0dXJlX2NvbXByZXNzLnRpcHMub3B0aW9uc19xdWFsaXR5X3R5cGVfZXJyJywge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIHVzZXJmb3JtYXRUeXBlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICBmb3JtYXRUeXBlOiBjb25maWcuZm9ybWF0VHlwZSxcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICBmb3JtYXRUeXBlT3B0aW9uczogT2JqZWN0LmtleXMocXVhbGl0eU9wdGlvbnMub3B0aW9ucykudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInIHx8IHZhbHVlIDwgcXVhbGl0eU9wdGlvbnMubWluIHx8IHZhbHVlID4gcXVhbGl0eU9wdGlvbnMubWF4KSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBjb25zb2xlLmVycm9yKGkxOG4udCgnYnVpbGRlci5wcm9qZWN0LnRleHR1cmVfY29tcHJlc3MudGlwcy5vcHRpb25zX3F1YWxpdHlfdHlwZV9lcnInLCB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgdXNlcmZvcm1hdFR5cGU6IHZhbHVlLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIG1pbjogcXVhbGl0eU9wdGlvbnMubWluLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIG1heDogcXVhbGl0eU9wdGlvbnMubWF4LFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fybk1vZHVsZUZhbGxCYWNrKG1vZHVsZVRvRmFsbEJhY2s6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sIHBsYXRmb3JtOiBzdHJpbmcpIHtcbiAgICBpZiAoIU9iamVjdC5rZXlzKG1vZHVsZVRvRmFsbEJhY2spLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGZhbGxiYWNrTXNnID0gT2JqZWN0LmtleXMobW9kdWxlVG9GYWxsQmFjaykucmVkdWNlKChwcmV2LCBjdXJyLCBpbmRleCkgPT4ge1xuICAgICAgICBpZiAoaW5kZXggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VGYWxsYmFja1N0cihwcmV2KSArIGAsICR7Y2hhbmdlRmFsbGJhY2tTdHIoY3VyciwgbW9kdWxlVG9GYWxsQmFja1tjdXJyXSl9YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJldiArIGAsICR7Y2hhbmdlRmFsbGJhY2tTdHIoY3VyciwgbW9kdWxlVG9GYWxsQmFja1tjdXJyXSl9YDtcbiAgICB9KTtcbiAgICByZXR1cm4gY29uc29sZS53YXJuKGkxOG4udCgnYnVpbGRlci53YXJuLmVuZ2luZV9tb2R1bGVzX2ZhbGxfYmFja190aXAnLCB7XG4gICAgICAgIHBsYXRmb3JtLFxuICAgICAgICBmYWxsYmFja01zZyxcbiAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIGNoYW5nZUZhbGxiYWNrU3RyKG1vZHVsZTogc3RyaW5nLCBmYWxsYmFjaz86IHN0cmluZykge1xuICAgIHJldHVybiBmYWxsYmFjayA/IGAke21vZHVsZX0gLT4gJHtmYWxsYmFja31gIDogYCR7bW9kdWxlfcOXYDtcbn1cblxuLyoqXG4gKiDlsIbot6/lvoTlkI3np7DnmoTml7bpl7TovazkuLrml7bpl7TmiLNcbiAqIEBwYXJhbSB0aW1lIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc1RpbWVUb051bWJlcih0aW1lOiBzdHJpbmcpIHtcbiAgICB0aW1lID0gYmFzZW5hbWUodGltZSwgJy5sb2cnKTtcbiAgICBjb25zdCBpbmZvID0gdGltZS5tYXRjaCgvLShcXGQrKSQvKTtcbiAgICBpZiAoaW5mbykge1xuICAgICAgICBjb25zdCB0aW1lU3RyID0gQXJyYXkuZnJvbSh0aW1lKTtcbiAgICAgICAgdGltZVN0cltpbmZvLmluZGV4IV0gPSAnOic7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZSh0aW1lU3RyLmpvaW4oJycpKS5nZXRUaW1lKCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn1cblxuLyoqXG4gKiDojrflj5bkuIDkuKrlj6/kvZzkuLrmnoTlu7rku7vliqHml6Xlv5fnmoTot6/lvoQocHJvamVjdDovL3RlbXAvYnVpbGRlci9sb2cveHh4MjAxOS0zLTIwIDE2LTAwLmxvZylcbiAqIEBwYXJhbSB0YXNrTmFtZSBcbiAqIEBwYXJhbSB0aW1lIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXNrTG9nRGVzdCh0YXNrTmFtZTogc3RyaW5nLCB0aW1lOiBudW1iZXIgfCBzdHJpbmcpIHtcbiAgICByZXR1cm4gVXRpbHMuUGF0aC5yZXNvbHZlVG9Vcmwoam9pbihidWlsZGVyQ29uZmlnLnByb2plY3RUZW1wRGlyLCAnYnVpbGRlcicsICdsb2cnLCB0YXNrTmFtZSArIGNoYW5nZVRvTG9jYWxUaW1lKHRpbWUsIDUpLnJlcGxhY2UoLzovZywgJy0nKSArICcubG9nJyksICdwcm9qZWN0Jyk7XG59XG5cbi8qKlxuICog6I635Y+W5Y+v6ZiF6K+755qE5pyA5paw5pe26Ze05L+h5oGv77yIMjAyMy00LTI0IDE3OjMxOjU077yJXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VGltZSgpIHtcbiAgICByZXR1cm4gY2hhbmdlVG9Mb2NhbFRpbWUoRGF0ZS5ub3coKSk7XG59XG5cbi8qKlxuICog5bCG5pe26Ze05oiz6L2s5Li65Y+v6ZiF6K+755qE5pe26Ze05L+h5oGv77yIMjAyMy00LTI0IDE3OjMxOjU077yJXG4gKiBAcGFyYW0gdCBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZVRvTG9jYWxUaW1lKHQ6IG51bWJlciB8IHN0cmluZywgbGVuID0gOCkge1xuICAgIGNvbnN0IHRpbWUgPSBuZXcgRGF0ZShOdW1iZXIodCkpO1xuICAgIHJldHVybiB0aW1lLnRvTG9jYWxlRGF0ZVN0cmluZygpLnJlcGxhY2UoL1xcLy9nLCAnLScpICsgJyAnICsgdGltZS50b1RpbWVTdHJpbmcoKS5zbGljZSgwLCBsZW4pO1xufVxuXG4vKipcbiAqIOajgOafpeS8oOmAkueahCBlcnJvck1hcCDlhoXmmK/lkKbljIXlkKvplJnor6/lrZfnrKbkuLLkv6Hmga9cbiAqIEBwYXJhbSBlcnJvck1hcCBcbiAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1Ze+8muWtmOWcqOmUmeivr1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tIYXNFcnJvcihlcnJvck1hcD86IFJlY29yZDxzdHJpbmcsIGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAoIWVycm9yTWFwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlcnJvck1hcCA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoZXJyb3JNYXApKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGVycm9yTWFwKSkge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gY2hlY2tIYXNFcnJvcihlcnJvck1hcFtrZXldKTtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVycm9yTWFwID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIOS7juWRveS7pOS4reaPkOWPluWPguaVsFxuICogQHBhcmFtIGNvbW1hbmQgXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmFtc0Zyb21Db21tYW5kKGNvbW1hbmQ6IHN0cmluZykge1xuICAgIGlmICghY29tbWFuZCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IG1hdGNoSW5mbyA9IGNvbW1hbmQubWF0Y2goL1xcJFxceyhbXiR7fV0qKX0vZyk7XG4gICAgaWYgKCFtYXRjaEluZm8pIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hJbmZvLm1hcCgoc3RyKSA9PiBzdHIucmVwbGFjZSgnJHsnLCAnJykucmVwbGFjZSgnfScsICcnKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbmZpZ0RlZmF1bHQoY29uZmlnOiBJQnVpbGRlckNvbmZpZ0l0ZW0pOiBhbnkge1xuICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLmRlZmF1bHQgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZGVmYXVsdCAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmRlZmF1bHQ7XG4gICAgfVxuICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2FycmF5JyAmJiBjb25maWcuaXRlbXMpIHtcbiAgICAgICAgY29uZmlnLmRlZmF1bHQgPSBbXTtcbiAgICAgICAgLy8gYXJyYXkgaXRlbXMgY2FuIGJlIGEgc2luZ2xlIGNvbmZpZyBvciBhbiBhcnJheSBvZiBjb25maWdzXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gQXJyYXkuaXNBcnJheShjb25maWcuaXRlbXMpID8gY29uZmlnLml0ZW1zIDogW2NvbmZpZy5pdGVtc107XG4gICAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25maWcuZGVmYXVsdCFbaW5kZXhdID0gY2hlY2tDb25maWdEZWZhdWx0KGl0ZW0gYXMgSUJ1aWxkZXJDb25maWdJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChjb25maWcudHlwZSA9PT0gJ29iamVjdCcgJiYgY29uZmlnLnByb3BlcnRpZXMpIHtcbiAgICAgICAgY29uZmlnLmRlZmF1bHQgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMoY29uZmlnLnByb3BlcnRpZXMpLmZvckVhY2goKGl0ZW1LZXkpID0+IHtcbiAgICAgICAgICAgIGNvbmZpZy5kZWZhdWx0IVtpdGVtS2V5XSA9IGNoZWNrQ29uZmlnRGVmYXVsdChjb25maWcucHJvcGVydGllc1tpdGVtS2V5XSBhcyBJQnVpbGRlckNvbmZpZ0l0ZW0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbmZpZy5kZWZhdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdHNEZWVwKGRhdGE6IGFueSwgZGVmYXVsdERhdGE6IGFueSkge1xuICAgIGlmIChkYXRhID09PSB1bmRlZmluZWQgfHwgZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIE9iamVjdC5rZXlzKGRlZmF1bHREYXRhKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkZWZhdWx0RGF0YVtrZXldO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIGlmICghZGF0YVtrZXldKSB7XG4gICAgICAgICAgICAgICAgZGF0YVtrZXldID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0c0RlZXAoZGF0YVtrZXldLCB2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGFba2V5XSA9PT0gdW5kZWZpbmVkIHx8IGRhdGFba2V5XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGF0YVtrZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGF0YTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRNZXJnZSh0YXJnZXQ6IFJlY29yZDxzdHJpbmcsIGFueT4sIC4uLnNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIGFueT5bXSkge1xuICAgIC8vIOmBjeWOhiBzb3VyY2VzIOaVsOe7hOS4reeahOavj+S4gOS4qua6kOWvueixoVxuICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICAgICAgLy8g5aaC5p6c5rqQ5a+56LGh5Li656m65oiW5LiN5piv5LiA5Liq5a+56LGh77yM6Lez6L+HXG4gICAgICAgIGlmICghc291cmNlIHx8IHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyDpgY3ljobmupDlr7nosaHnmoTmiYDmnInlj6/mnprkuL7lsZ7mgKdcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAvLyDlpoLmnpznm67moIflr7nosaHmsqHmnInor6XlsZ7mgKfvvIznm7TmjqXlpI3liLZcbiAgICAgICAgICAgIGlmICghKGtleSBpbiB0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c55uu5qCH5a+56LGh5bey57uP5pyJ6K+l5bGe5oCn77yM5LiU6K+l5bGe5oCn55qE5YC85piv5a+56LGh57G75Z6L77yM6YCS5b2S5ZCI5bm2XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2Vba2V5XSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoc291cmNlW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOiHquWumuS5ieWQiOW5tuWHveaVsOWtmOWcqO+8jOWImeiwg+eUqOiHquWumuS5ieWQiOW5tuWHveaVsO+8jOWQpuWImemAkuW9kuiwg+eUqCBtZXJnZVdpdGgoKSDmlrnms5XlkIjlubZcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBkZWZhdWx0TWVyZ2UodGFyZ2V0W2tleV0sIHNvdXJjZVtrZXldKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDlkKbliJnnm7TmjqXkvb/nlKjmupDlr7nosaHnmoTlsZ7mgKfopobnm5bnm67moIflr7nosaHnmoTlsZ7mgKdcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8g6L+U5Zue5ZCI5bm25ZCO55qE55uu5qCH5a+56LGhXG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJ1aWxkUGF0aChvcHRpb25zOiBJQnVpbGRPcHRpb25CYXNlKSB7XG4gICAgcmV0dXJuIGpvaW4oVXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcob3B0aW9ucy5idWlsZFBhdGgpLCBvcHRpb25zLm91dHB1dE5hbWUgfHwgb3B0aW9ucy5wbGF0Zm9ybSk7XG59XG5cbi8qKlxuICog5omn6KGM5p+Q5Liq5qih5Z2X55qE5pa55rOV5oiW6ICF6I635Y+W5p+Q5Liq5qih5Z2X55qE5bGe5oCn5YC8XG4gKiBAcGFyYW0gbW9kdWxlIFxuICogQHBhcmFtIGtleSBcbiAqIEBwYXJhbSBhcmdzIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWVzdE1vZHVsZShtb2R1bGU6IGFueSwga2V5OiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBtb2R1bGVba2V5XSguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbW9kdWxlW2tleV07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhlcnJvcik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cblxuLyoqXG4gKiDlsIbmr6vnp5Lml7bpl7TovazmjaLkuLrml7bliIbnp5JcbiAqIEBwYXJhbSBtc1RpbWUgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRNU1RpbWUobXNUaW1lOiBudW1iZXIpIHtcbiAgICBjb25zdCB0aW1lID0gbXNUaW1lIC8gMTAwMDtcbiAgICBsZXQgcmVzID0gJyc7XG4gICAgY29uc3QgaG91ciA9IE1hdGguZmxvb3IodGltZSAvIDYwIC8gNjApO1xuICAgIGlmIChob3VyKSB7XG4gICAgICAgIHJlcyA9IGAke2hvdXJ9IGhgO1xuICAgIH1cbiAgICBjb25zdCBtaW51dGUgPSAoTWF0aC5mbG9vcih0aW1lIC8gNjApICUgNjApO1xuICAgIGlmIChtaW51dGUpIHtcbiAgICAgICAgcmVzICs9IGAgJHttaW51dGV9IG1pbmA7XG4gICAgfVxuICAgIGNvbnN0IHNlY29uZCA9IChNYXRoLmZsb29yKHRpbWUpICUgNjApO1xuICAgIGlmIChzZWNvbmQpIHtcbiAgICAgICAgcmVzICs9IGAgJHtzZWNvbmR9IHNgO1xuICAgIH1cbiAgICBjb25zdCBtcyA9IG1zVGltZSAtIChob3VyICogNjAgKiA2MCArIG1pbnV0ZSAqIDYwICsgc2Vjb25kKSAqIDEwMDA7XG4gICAgLy8g5Lqn5ZOB6ZyA5rGC77ya5LiN6Laz56eS5pe25omN5pi+56S65q+r56eSXG4gICAgaWYgKG1zICYmICFyZXMpIHtcbiAgICAgICAgcmVzICs9IGAgJHttc30gbXNgO1xuICAgIH1cbiAgICByZXR1cm4gcmVzLnRyaW1TdGFydCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVRvUmF3KHVybE9yUGF0aDogc3RyaW5nLCByb290OiBzdHJpbmcpIHtcbiAgICBpZiAoaXNBYnNvbHV0ZSh1cmxPclBhdGgpKSB7XG4gICAgICAgIHJldHVybiB1cmxPclBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGpvaW4ocm9vdCwgdXJsT3JQYXRoKTtcbiAgICB9XG59XG4iXX0=