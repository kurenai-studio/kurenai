'use strict';
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
exports.quickSpawn = exports.getBuildPath = void 0;
exports.compareOptions = compareOptions;
exports.pickDifferentOptions = pickDifferentOptions;
exports.copyPaths = copyPaths;
exports.recursively = recursively;
exports.removeDbHeader = removeDbHeader;
exports.dbUrlToRawPath = dbUrlToRawPath;
exports.relativeUrl = relativeUrl;
exports.isInstallNodeJs = isInstallNodeJs;
exports.getFileSizeDeep = getFileSizeDeep;
exports.copyDirSync = copyDirSync;
exports.compressUuid = compressUuid;
exports.decompressUuid = decompressUuid;
exports.getUuidFromPath = getUuidFromPath;
exports.nameToSubId = nameToSubId;
exports.getResImportPath = getResImportPath;
exports.getResRawAssetsPath = getResRawAssetsPath;
exports.toBabelModules = toBabelModules;
exports.transformCode = transformCode;
exports.compileJS = compileJS;
exports.createBundle = createBundle;
exports.appendMd5ToPaths = appendMd5ToPaths;
exports.calcMd5 = calcMd5;
exports.patchMd5ToPath = patchMd5ToPath;
exports.getLibraryDir = getLibraryDir;
exports.queryImageAssetFromSubAssetByUuid = queryImageAssetFromSubAssetByUuid;
const path_1 = require("path");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const babel = __importStar(require("@babel/core"));
const preset_env_1 = __importDefault(require("@babel/preset-env"));
const sub_process_manager_1 = require("../../worker-pools/sub-process-manager");
const utils_1 = __importDefault(require("../../../../base/utils"));
const builder_config_1 = __importDefault(require("../../../share/builder-config"));
const global_1 = require("../../../share/global");
var utils_2 = require("../../../share/utils");
Object.defineProperty(exports, "getBuildPath", { enumerable: true, get: function () { return utils_2.getBuildPath; } });
// 当前文件对外暴露的接口是直接对用户公开的，对内使用的工具接口请在其他文件夹内放置
/**
 * 比对两个 options 选项是否一致，不一致的数据需要打印出来
 * @param oldOptions 旧选项
 * @param newOptions 新选项
 * @returns 如果两个选项一致返回 true，否则返回 false
 */
function compareOptions(oldOptions, newOptions) {
    const res = pickDifferentOptions(oldOptions, newOptions);
    if (res.isEqual) {
        return true;
    }
    console.log(`different options: ${Object.keys(res.diff).map((key) => `${key}: ${res.diff[key].old} -> ${res.diff[key].new}`)}`);
    return false;
}
function pickDifferentOptions(oldOptions, newOptions, path = '', diff = {}) {
    let isEqual = true;
    // Helper function to log differences
    const collectDifference = (key, oldValue, newValue) => {
        diff[path ? `${path}.${key}` : key] = {
            new: newValue,
            old: oldValue,
        };
        isEqual = false;
    };
    // Check if both inputs are objects
    if (typeof oldOptions !== 'object' || typeof newOptions !== 'object') {
        if (oldOptions !== newOptions) {
            collectDifference('', oldOptions, newOptions);
        }
        return {
            diff,
            isEqual,
        };
    }
    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(oldOptions), ...Object.keys(newOptions)]);
    for (const key of allKeys) {
        const oldValue = oldOptions[key];
        const newValue = newOptions[key];
        // If both values are objects, recursively compare them
        if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
            if (!pickDifferentOptions(oldValue, newValue, path ? `${path}.${key}` : key, diff).isEqual) {
                isEqual = false;
            }
        }
        else if (oldValue !== newValue) {
            collectDifference(key, oldValue, newValue);
        }
    }
    return {
        diff,
        isEqual,
    };
}
function copyPaths(paths) {
    return Promise.all(paths.map((path) => (0, fs_extra_1.copy)(path.src, path.dest)));
}
/**
 * 递归遍历这个资源上的所有子资源
 * @param asset
 * @param handle
 */
function recursively(asset, handle) {
    if (!asset.subAssets) {
        return;
    }
    handle && handle(asset);
    Object.keys(asset.subAssets).forEach((name) => {
        const subAsset = asset.subAssets[name];
        recursively(subAsset, handle);
    });
}
const DB_PROTOCOL_HEADER = 'db://';
// 去除 db:// 的路径
function removeDbHeader(path) {
    if (!path) {
        return '';
    }
    if (!path.startsWith(DB_PROTOCOL_HEADER)) {
        console.error('unknown path to build: ' + path);
        return path;
    }
    // 获取剔除 db:// 后的文件目录
    const mountPoint = path.slice(DB_PROTOCOL_HEADER.length);
    return mountPoint;
}
/**
 * 将 db 开头的 url 转为项目里的实际 url
 * @param url db://
 */
function dbUrlToRawPath(url) {
    return (0, path_1.join)(builder_config_1.default.projectRoot, removeDbHeader(url));
}
/**
 * 获取相对路径，并且路径分隔符做转换处理
 * @param from
 * @param to
 */
function relativeUrl(from, to) {
    return (0, path_1.relative)(from, to).replace(/\\/g, '/');
}
/**
 * 检查是否安装了 node.js
 */
function isInstallNodeJs() {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)('node -v', {
            env: process.env,
        }, (error) => {
            if (!error) {
                // 检查成功
                resolve(true);
                return;
            }
            console.error(error);
            resolve(false);
        });
    });
}
/**
 * 获取文件夹或者文件大小
 */
function getFileSizeDeep(path) {
    if (!(0, fs_1.existsSync)(path)) {
        return 0;
    }
    const stat = (0, fs_1.statSync)(path);
    if (!stat.isDirectory()) {
        return stat.size;
    }
    let result = 0;
    // 文件夹
    const files = (0, fs_1.readdirSync)(path);
    files.forEach((fileName) => {
        result += getFileSizeDeep((0, path_1.join)(path, fileName));
    });
    return result;
}
/**
 * 拷贝文件夹
 * @param path
 * @param dest
 */
function copyDirSync(path, dest) {
    if (!(0, fs_1.existsSync)(path)) {
        return 0;
    }
    const stat = (0, fs_1.statSync)(path);
    if (!stat.isDirectory()) {
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
        return (0, fs_1.copyFileSync)(path, dest);
    }
    // 文件夹
    const files = (0, fs_1.readdirSync)(path);
    (0, fs_extra_1.ensureDirSync)(dest);
    files.forEach((fileName) => {
        const file = (0, path_1.join)(path, fileName);
        const fileDest = (0, path_1.join)(dest, fileName);
        copyDirSync(file, fileDest);
    });
}
// 注意：目前 utils 用的是 UUID，EditorExtends 用的是 Uuid 
function compressUuid(uuid, min = true) {
    return utils_1.default.UUID.compressUUID(uuid, min);
}
function decompressUuid(uuid) {
    return utils_1.default.UUID.decompressUUID(uuid);
}
/**
 * 从 library 路径获取 uuid
 * @param path
 */
function getUuidFromPath(path) {
    return utils_1.default.UUID.getUuidFromLibPath(path);
}
/**
 * 获取某个名字对应的短 uuid
 * @param name
 * @returns
 */
function nameToSubId(name) {
    return utils_1.default.UUID.nameToSubId(name);
}
/**
 * 拼接成 import 路径
 * @param dest
 * @param uuid
 * @param extName 指定 import 的文件格式，默认 .json
 */
function getResImportPath(dest, uuid, extName = '.json') {
    return (0, path_1.join)(dest, global_1.BuildGlobalInfo.IMPORT_HEADER, uuid.substr(0, 2), uuid + extName);
}
/**
 * 拼接成 raw-assets 路径
 * @param dest
 * @param uuid
 * @param extName 路径后缀
 */
function getResRawAssetsPath(dest, uuid, extName) {
    return (0, path_1.join)(dest, global_1.BuildGlobalInfo.NATIVE_HEADER, uuid.substr(0, 2), uuid + extName);
}
function toBabelModules(modules) {
    return modules === 'esm' ? false : modules;
}
/**
 * 脚本编译
 * TODO 此类编译脚本相关逻辑，后续需要迁移到进程管理器内调用
 * @param code
 * @param options
 */
async function transformCode(code, options) {
    const { loose, importMapFormat } = options;
    const babelFileResult = await babel.transformAsync(code, {
        presets: [[preset_env_1.default, {
                    modules: importMapFormat ? toBabelModules(importMapFormat) : undefined,
                    loose: loose !== null && loose !== void 0 ? loose : true,
                }]],
    });
    if (!babelFileResult || !babelFileResult.code) {
        throw new Error('Failed to transform!');
    }
    return babelFileResult.code;
}
/**
 * 编译脚本
 * @param contents
 * @param path
 */
function compileJS(contents, path) {
    let result;
    try {
        const Babel = require('@babel/core');
        result = Babel.transform(contents, {
            ast: false,
            highlightCode: false,
            sourceMaps: false,
            compact: false,
            filename: path, // search path for babelrc
            presets: [
                require('@babel/preset-env'),
            ],
            plugins: [
                // make sure that transform-decorators-legacy comes before transform-class-properties.
                [
                    require('@babel/plugin-proposal-decorators'),
                    { legacy: true },
                ],
                [
                    require('@babel/plugin-proposal-class-properties'),
                    { loose: true },
                ],
                [
                    require('babel-plugin-add-module-exports'),
                ],
                [
                    require('@babel/plugin-proposal-export-default-from'),
                ],
            ],
        });
    }
    catch (err) {
        err.stack = `Compile ${path} error: ${err.stack}`;
        throw err;
    }
    return result.code;
}
async function createBundle(src, dest, options) {
    return new Promise((resolve, reject) => {
        const babelify = require('babelify');
        const browserify = require('browserify');
        const bundler = browserify(src);
        if (options && options.excludes) {
            options.excludes.forEach(function (path) {
                bundler.exclude(path);
            });
        }
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
        bundler.transform(babelify, {
            presets: [require('@babel/preset-env')],
            plugins: [require('@babel/plugin-proposal-class-properties')],
        })
            .bundle((err, buffer) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            (0, fs_1.writeFileSync)(dest, new Uint8Array(buffer), 'utf8');
            resolve();
        });
    });
}
const HASH_LEN = 5;
/**
 * 给某些路径文件添加 md5 后缀
 * @param paths
 */
async function appendMd5ToPaths(paths) {
    if (!Array.isArray(paths)) {
        return null;
    }
    // 参与 md5 计算的数据需要排序，且不能并发否则会影响数据计算
    paths = paths.sort();
    const dataArr = [];
    for (const path of paths) {
        let data;
        try {
            data = await (0, fs_extra_1.readFile)(path);
            dataArr.push(data);
        }
        catch (error) {
            console.error(error);
            console.error(`readFile {link(${path})}`);
            continue;
        }
    }
    const hash = calcMd5(dataArr);
    const resultPaths = [];
    await Promise.all(paths.map((path, i) => {
        // 非资源类替换名字
        resultPaths[i] = patchMd5ToPath(path, hash);
        // 计算完 hash 值之后进行改名
        return (0, fs_extra_1.rename)(path, resultPaths[i]);
    }));
    return {
        paths: resultPaths,
        hash,
    };
}
/**
 * 计算某个数据的 md5 值
 * @param data
 */
function calcMd5(data) {
    data = Array.isArray(data) ? data : [data];
    const { createHash } = require('crypto');
    const cryptoHash = createHash('md5');
    data.forEach((dataItem) => {
        cryptoHash.update(dataItem);
    });
    return cryptoHash.digest('hex').slice(0, HASH_LEN);
}
/**
 * 将某个 hash 值添加到某个路径上
 * @param targetPath
 * @param hash
 * @returns
 */
function patchMd5ToPath(targetPath, hash) {
    const parseObj = (0, path_1.parse)(targetPath);
    parseObj.base = '';
    parseObj.name += `.${hash}`;
    return (0, path_1.format)(parseObj);
}
/**
 * 获取一个资源 library 地址里的 library 文件夹绝对路径
 * @param libraryPath
 * @returns
 */
function getLibraryDir(libraryPath) {
    // library 地址可能在项目内也可能在其他任何位置
    // 此处参考了 uuid 模块的 getUuidFromLibPath 所用正则来获取 library 以及之前的路径
    const matchInfo = libraryPath.match(/(.*)[/\\][0-9a-fA-F]{2}[/\\][0-9a-fA-F-]{8,}((@[0-9a-fA-F]{5,})+)?.*/);
    return matchInfo[1];
}
// 此工具方法走 workerManager 管理，方便对开启的进程做中断
exports.quickSpawn = sub_process_manager_1.workerManager.quickSpawn.bind(sub_process_manager_1.workerManager);
function queryImageAssetFromSubAssetByUuid(subAssetUuid) {
    return subAssetUuid.split('@')[0];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL3V0aWxzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJiLHdDQU9DO0FBRUQsb0RBOENDO0FBRUQsOEJBRUM7QUFPRCxrQ0FTQztBQUlELHdDQVdDO0FBTUQsd0NBRUM7QUFPRCxrQ0FFQztBQUtELDBDQWtCQztBQUtELDBDQWVDO0FBT0Qsa0NBaUJDO0FBR0Qsb0NBRUM7QUFFRCx3Q0FFQztBQU1ELDBDQUVDO0FBT0Qsa0NBRUM7QUFRRCw0Q0FFQztBQVFELGtEQUVDO0FBRUQsd0NBRUM7QUFRRCxzQ0FZQztBQU9ELDhCQW9DQztBQXFCRCxvQ0F5QkM7QUFXRCw0Q0FrQ0M7QUFNRCwwQkFRQztBQVFELHdDQUtDO0FBT0Qsc0NBS0M7QUFLRCw4RUFFQztBQS9iRCwrQkFBOEQ7QUFDOUQsaURBQXFDO0FBQ3JDLDJCQUFvRjtBQUNwRix1Q0FBaUU7QUFDakUsbURBQXFDO0FBQ3JDLG1FQUErQztBQUMvQyxnRkFBdUU7QUFFdkUsbUVBQTJDO0FBQzNDLG1GQUEwRDtBQUUxRCxrREFBd0Q7QUFFeEQsOENBQW9EO0FBQTNDLHFHQUFBLFlBQVksT0FBQTtBQUVyQiwyQ0FBMkM7QUFFM0M7Ozs7O0dBS0c7QUFDSCxTQUFnQixjQUFjLENBQUMsVUFBK0IsRUFBRSxVQUErQjtJQUMzRixNQUFNLEdBQUcsR0FBRyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDekQsSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENB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Ozs7OztHQUtHO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLFVBQWtCLEVBQUUsSUFBWTtJQUMzRCxNQUFNLFFBQVEsR0FBRyxJQUFBLFlBQUssRUFBQyxVQUFVLENBQUMsQ0FBQztJQUNuQyxRQUFRLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNuQixRQUFRLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFLENBQUM7SUFDNUIsT0FBTyxJQUFBLGFBQU0sRUFBQyxRQUFRLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLGFBQWEsQ0FBQyxXQUFtQjtJQUM3Qyw2QkFBNkI7SUFDN0IsNERBQTREO0lBQzVELE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsc0VBQXNFLENBQUMsQ0FBQztJQUM1RyxPQUFPLFNBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QixDQUFDO0FBRUQsc0NBQXNDO0FBQ3pCLFFBQUEsVUFBVSxHQUFHLG1DQUFhLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxtQ0FBYSxDQUFDLENBQUM7QUFFdkUsU0FBZ0IsaUNBQWlDLENBQUMsWUFBb0I7SUFDbEUsT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGpvaW4sIHJlbGF0aXZlLCBkaXJuYW1lLCBmb3JtYXQsIHBhcnNlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBzdGF0U3luYywgcmVhZGRpclN5bmMsIGV4aXN0c1N5bmMsIGNvcHlGaWxlU3luYywgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGNvcHksIGVuc3VyZURpclN5bmMsIHJlYWRGaWxlLCByZW5hbWUgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSc7XG5pbXBvcnQgYmFiZWxQcmVzZXRFbnYgZnJvbSAnQGJhYmVsL3ByZXNldC1lbnYnO1xuaW1wb3J0IHsgd29ya2VyTWFuYWdlciB9IGZyb20gJy4uLy4uL3dvcmtlci1wb29scy9zdWItcHJvY2Vzcy1tYW5hZ2VyJztcbmltcG9ydCB7IElBc3NldCB9IGZyb20gJy4uLy4uLy4uLy4uL2Fzc2V0cy9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB1dGlscyBmcm9tICcuLi8uLi8uLi8uLi9iYXNlL3V0aWxzJztcbmltcG9ydCBidWlsZGVyQ29uZmlnIGZyb20gJy4uLy4uLy4uL3NoYXJlL2J1aWxkZXItY29uZmlnJztcbmltcG9ydCB7IElNb2R1bGVzLCBJVHJhbnNmb3JtT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgQnVpbGRHbG9iYWxJbmZvIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmUvZ2xvYmFsJztcblxuZXhwb3J0IHsgZ2V0QnVpbGRQYXRoIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmUvdXRpbHMnO1xuXG4vLyDlvZPliY3mlofku7blr7nlpJbmmrTpnLLnmoTmjqXlj6PmmK/nm7TmjqXlr7nnlKjmiLflhazlvIDnmoTvvIzlr7nlhoXkvb/nlKjnmoTlt6XlhbfmjqXlj6Por7flnKjlhbbku5bmlofku7blpLnlhoXmlL7nva5cblxuLyoqXG4gKiDmr5Tlr7nkuKTkuKogb3B0aW9ucyDpgInpobnmmK/lkKbkuIDoh7TvvIzkuI3kuIDoh7TnmoTmlbDmja7pnIDopoHmiZPljbDlh7rmnaVcbiAqIEBwYXJhbSBvbGRPcHRpb25zIOaXp+mAiemhuVxuICogQHBhcmFtIG5ld09wdGlvbnMg5paw6YCJ6aG5XG4gKiBAcmV0dXJucyDlpoLmnpzkuKTkuKrpgInpobnkuIDoh7Tov5Tlm54gdHJ1Ze+8jOWQpuWImei/lOWbniBmYWxzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZU9wdGlvbnMob2xkT3B0aW9uczogUmVjb3JkPHN0cmluZywgYW55PiwgbmV3T3B0aW9uczogUmVjb3JkPHN0cmluZywgYW55Pik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlcyA9IHBpY2tEaWZmZXJlbnRPcHRpb25zKG9sZE9wdGlvbnMsIG5ld09wdGlvbnMpO1xuICAgIGlmIChyZXMuaXNFcXVhbCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coYGRpZmZlcmVudCBvcHRpb25zOiAke09iamVjdC5rZXlzKHJlcy5kaWZmKS5tYXAoKGtleSkgPT4gYCR7a2V5fTogJHtyZXMuZGlmZltrZXldLm9sZH0gLT4gJHtyZXMuZGlmZltrZXldLm5ld31gKX1gKTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwaWNrRGlmZmVyZW50T3B0aW9ucyhvbGRPcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCBuZXdPcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCBwYXRoID0gJycsIGRpZmY6IFJlY29yZDxzdHJpbmcsIHsgbmV3OiBhbnksIG9sZDogYW55IH0+ID0ge30pOiB7XG4gICAgaXNFcXVhbDogYm9vbGVhbjtcbiAgICBkaWZmOiBSZWNvcmQ8c3RyaW5nLCB7IG5ldzogYW55LCBvbGQ6IGFueSB9Pixcbn0ge1xuICAgIGxldCBpc0VxdWFsID0gdHJ1ZTtcbiAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gbG9nIGRpZmZlcmVuY2VzXG4gICAgY29uc3QgY29sbGVjdERpZmZlcmVuY2UgPSAoa2V5OiBzdHJpbmcsIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgZGlmZltwYXRoID8gYCR7cGF0aH0uJHtrZXl9YCA6IGtleV0gPSB7XG4gICAgICAgICAgICBuZXc6IG5ld1ZhbHVlLFxuICAgICAgICAgICAgb2xkOiBvbGRWYWx1ZSxcbiAgICAgICAgfTtcbiAgICAgICAgaXNFcXVhbCA9IGZhbHNlO1xuICAgIH07XG5cbiAgICAvLyBDaGVjayBpZiBib3RoIGlucHV0cyBhcmUgb2JqZWN0c1xuICAgIGlmICh0eXBlb2Ygb2xkT3B0aW9ucyAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIG5ld09wdGlvbnMgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChvbGRPcHRpb25zICE9PSBuZXdPcHRpb25zKSB7XG4gICAgICAgICAgICBjb2xsZWN0RGlmZmVyZW5jZSgnJywgb2xkT3B0aW9ucywgbmV3T3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRpZmYsXG4gICAgICAgICAgICBpc0VxdWFsLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEdldCBhbGwga2V5cyBmcm9tIGJvdGggb2JqZWN0c1xuICAgIGNvbnN0IGFsbEtleXMgPSBuZXcgU2V0KFsuLi5PYmplY3Qua2V5cyhvbGRPcHRpb25zKSwgLi4uT2JqZWN0LmtleXMobmV3T3B0aW9ucyldKTtcblxuICAgIGZvciAoY29uc3Qga2V5IG9mIGFsbEtleXMpIHtcbiAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSBvbGRPcHRpb25zW2tleV07XG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gbmV3T3B0aW9uc1trZXldO1xuXG4gICAgICAgIC8vIElmIGJvdGggdmFsdWVzIGFyZSBvYmplY3RzLCByZWN1cnNpdmVseSBjb21wYXJlIHRoZW1cbiAgICAgICAgaWYgKHR5cGVvZiBvbGRWYWx1ZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG5ld1ZhbHVlID09PSAnb2JqZWN0JyAmJiBvbGRWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKCFwaWNrRGlmZmVyZW50T3B0aW9ucyhvbGRWYWx1ZSwgbmV3VmFsdWUsIHBhdGggPyBgJHtwYXRofS4ke2tleX1gIDoga2V5LCBkaWZmKS5pc0VxdWFsKSB7XG4gICAgICAgICAgICAgICAgaXNFcXVhbCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgY29sbGVjdERpZmZlcmVuY2Uoa2V5LCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGlmZixcbiAgICAgICAgaXNFcXVhbCxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29weVBhdGhzKHBhdGhzOiB7IHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcgfVtdKSB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHBhdGhzLm1hcCgocGF0aCkgPT4gY29weShwYXRoLnNyYywgcGF0aC5kZXN0KSkpO1xufVxuXG4vKipcbiAqIOmAkuW9kumBjeWOhui/meS4qui1hOa6kOS4iueahOaJgOacieWtkOi1hOa6kFxuICogQHBhcmFtIGFzc2V0XG4gKiBAcGFyYW0gaGFuZGxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWN1cnNpdmVseShhc3NldDogSUFzc2V0LCBoYW5kbGU6IEZ1bmN0aW9uKSB7XG4gICAgaWYgKCFhc3NldC5zdWJBc3NldHMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYW5kbGUgJiYgaGFuZGxlKGFzc2V0KTtcbiAgICBPYmplY3Qua2V5cyhhc3NldC5zdWJBc3NldHMpLmZvckVhY2goKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBzdWJBc3NldCA9IGFzc2V0LnN1YkFzc2V0c1tuYW1lXTtcbiAgICAgICAgcmVjdXJzaXZlbHkoc3ViQXNzZXQsIGhhbmRsZSk7XG4gICAgfSk7XG59XG5cbmNvbnN0IERCX1BST1RPQ09MX0hFQURFUiA9ICdkYjovLyc7XG4vLyDljrvpmaQgZGI6Ly8g55qE6Lev5b6EXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRGJIZWFkZXIocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAoIXBhdGguc3RhcnRzV2l0aChEQl9QUk9UT0NPTF9IRUFERVIpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ3Vua25vd24gcGF0aCB0byBidWlsZDogJyArIHBhdGgpO1xuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG4gICAgLy8g6I635Y+W5YmU6ZmkIGRiOi8vIOWQjueahOaWh+S7tuebruW9lVxuICAgIGNvbnN0IG1vdW50UG9pbnQgPSBwYXRoLnNsaWNlKERCX1BST1RPQ09MX0hFQURFUi5sZW5ndGgpO1xuICAgIHJldHVybiBtb3VudFBvaW50O1xufVxuXG4vKipcbiAqIOWwhiBkYiDlvIDlpLTnmoQgdXJsIOi9rOS4uumhueebrumHjOeahOWunumZhSB1cmxcbiAqIEBwYXJhbSB1cmwgZGI6Ly9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRiVXJsVG9SYXdQYXRoKHVybDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGpvaW4oYnVpbGRlckNvbmZpZy5wcm9qZWN0Um9vdCwgcmVtb3ZlRGJIZWFkZXIodXJsKSk7XG59XG5cbi8qKlxuICog6I635Y+W55u45a+56Lev5b6E77yM5bm25LiU6Lev5b6E5YiG6ZqU56ym5YGa6L2s5o2i5aSE55CGXG4gKiBAcGFyYW0gZnJvbVxuICogQHBhcmFtIHRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWxhdGl2ZVVybChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gcmVsYXRpdmUoZnJvbSwgdG8pLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbn1cblxuLyoqXG4gKiDmo4Dmn6XmmK/lkKblronoo4XkuoYgbm9kZS5qc1xuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbnN0YWxsTm9kZUpzKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGV4ZWMoXG4gICAgICAgICAgICAnbm9kZSAtdicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZW52OiBwcm9jZXNzLmVudixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5qOA5p+l5oiQ5YqfXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIOiOt+WPluaWh+S7tuWkueaIluiAheaWh+S7tuWkp+Wwj1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmlsZVNpemVEZWVwKHBhdGg6IHN0cmluZykge1xuICAgIGlmICghZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3Qgc3RhdCA9IHN0YXRTeW5jKHBhdGgpO1xuICAgIGlmICghc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIHJldHVybiBzdGF0LnNpemU7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSAwO1xuICAgIC8vIOaWh+S7tuWkuVxuICAgIGNvbnN0IGZpbGVzID0gcmVhZGRpclN5bmMocGF0aCk7XG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZU5hbWUpID0+IHtcbiAgICAgICAgcmVzdWx0ICs9IGdldEZpbGVTaXplRGVlcChqb2luKHBhdGgsIGZpbGVOYW1lKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiDmi7fotJ3mlofku7blpLlcbiAqIEBwYXJhbSBwYXRoXG4gKiBAcGFyYW0gZGVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29weURpclN5bmMocGF0aDogc3RyaW5nLCBkZXN0OiBzdHJpbmcpIHtcbiAgICBpZiAoIWV4aXN0c1N5bmMocGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IHN0YXQgPSBzdGF0U3luYyhwYXRoKTtcbiAgICBpZiAoIXN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoZGVzdCkpO1xuICAgICAgICByZXR1cm4gY29weUZpbGVTeW5jKHBhdGgsIGRlc3QpO1xuICAgIH1cbiAgICAvLyDmlofku7blpLlcbiAgICBjb25zdCBmaWxlcyA9IHJlYWRkaXJTeW5jKHBhdGgpO1xuICAgIGVuc3VyZURpclN5bmMoZGVzdCk7XG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZU5hbWUpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGpvaW4ocGF0aCwgZmlsZU5hbWUpO1xuICAgICAgICBjb25zdCBmaWxlRGVzdCA9IGpvaW4oZGVzdCwgZmlsZU5hbWUpO1xuICAgICAgICBjb3B5RGlyU3luYyhmaWxlLCBmaWxlRGVzdCk7XG4gICAgfSk7XG59XG5cbi8vIOazqOaEj++8muebruWJjSB1dGlscyDnlKjnmoTmmK8gVVVJRO+8jEVkaXRvckV4dGVuZHMg55So55qE5pivIFV1aWQgXG5leHBvcnQgZnVuY3Rpb24gY29tcHJlc3NVdWlkKHV1aWQ6IHN0cmluZywgbWluID0gdHJ1ZSkge1xuICAgIHJldHVybiB1dGlscy5VVUlELmNvbXByZXNzVVVJRCh1dWlkLCBtaW4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjb21wcmVzc1V1aWQodXVpZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHV0aWxzLlVVSUQuZGVjb21wcmVzc1VVSUQodXVpZCk7XG59XG5cbi8qKlxuICog5LuOIGxpYnJhcnkg6Lev5b6E6I635Y+WIHV1aWRcbiAqIEBwYXJhbSBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRVdWlkRnJvbVBhdGgocGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHV0aWxzLlVVSUQuZ2V0VXVpZEZyb21MaWJQYXRoKHBhdGgpO1xufVxuXG4vKipcbiAqIOiOt+WPluafkOS4quWQjeWtl+WvueW6lOeahOefrSB1dWlkXG4gKiBAcGFyYW0gbmFtZSBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZnVuY3Rpb24gbmFtZVRvU3ViSWQobmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHV0aWxzLlVVSUQubmFtZVRvU3ViSWQobmFtZSk7XG59XG5cbi8qKlxuICog5ou85o6l5oiQIGltcG9ydCDot6/lvoRcbiAqIEBwYXJhbSBkZXN0XG4gKiBAcGFyYW0gdXVpZFxuICogQHBhcmFtIGV4dE5hbWUg5oyH5a6aIGltcG9ydCDnmoTmlofku7bmoLzlvI/vvIzpu5jorqQgLmpzb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc0ltcG9ydFBhdGgoZGVzdDogc3RyaW5nLCB1dWlkOiBzdHJpbmcsIGV4dE5hbWUgPSAnLmpzb24nKSB7XG4gICAgcmV0dXJuIGpvaW4oZGVzdCwgQnVpbGRHbG9iYWxJbmZvLklNUE9SVF9IRUFERVIsIHV1aWQuc3Vic3RyKDAsIDIpLCB1dWlkICsgZXh0TmFtZSk7XG59XG5cbi8qKlxuICog5ou85o6l5oiQIHJhdy1hc3NldHMg6Lev5b6EXG4gKiBAcGFyYW0gZGVzdFxuICogQHBhcmFtIHV1aWRcbiAqIEBwYXJhbSBleHROYW1lIOi3r+W+hOWQjue8gFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzUmF3QXNzZXRzUGF0aChkZXN0OiBzdHJpbmcsIHV1aWQ6IHN0cmluZywgZXh0TmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGpvaW4oZGVzdCwgQnVpbGRHbG9iYWxJbmZvLk5BVElWRV9IRUFERVIsIHV1aWQuc3Vic3RyKDAsIDIpLCB1dWlkICsgZXh0TmFtZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JhYmVsTW9kdWxlcyhtb2R1bGVzOiBJTW9kdWxlcyk6IHN0cmluZyB8IGZhbHNlIHtcbiAgICByZXR1cm4gbW9kdWxlcyA9PT0gJ2VzbScgPyBmYWxzZSA6IG1vZHVsZXM7XG59XG5cbi8qKlxuICog6ISa5pys57yW6K+RXG4gKiBUT0RPIOatpOexu+e8luivkeiEmuacrOebuOWFs+mAu+i+ke+8jOWQjue7remcgOimgei/geenu+WIsOi/m+eoi+euoeeQhuWZqOWGheiwg+eUqFxuICogQHBhcmFtIGNvZGVcbiAqIEBwYXJhbSBvcHRpb25zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1Db2RlKGNvZGU6IHN0cmluZywgb3B0aW9uczogSVRyYW5zZm9ybU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHsgbG9vc2UsIGltcG9ydE1hcEZvcm1hdCB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBiYWJlbEZpbGVSZXN1bHQgPSBhd2FpdCBiYWJlbC50cmFuc2Zvcm1Bc3luYyhjb2RlLCB7XG4gICAgICAgIHByZXNldHM6IFtbYmFiZWxQcmVzZXRFbnYsIHtcbiAgICAgICAgICAgIG1vZHVsZXM6IGltcG9ydE1hcEZvcm1hdCA/IHRvQmFiZWxNb2R1bGVzKGltcG9ydE1hcEZvcm1hdCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBsb29zZTogbG9vc2UgIT09IG51bGwgJiYgbG9vc2UgIT09IHZvaWQgMCA/IGxvb3NlIDogdHJ1ZSxcbiAgICAgICAgfV1dLFxuICAgIH0pO1xuICAgIGlmICghYmFiZWxGaWxlUmVzdWx0IHx8ICFiYWJlbEZpbGVSZXN1bHQuY29kZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byB0cmFuc2Zvcm0hJyk7XG4gICAgfVxuICAgIHJldHVybiBiYWJlbEZpbGVSZXN1bHQuY29kZTtcbn1cblxuLyoqXG4gKiDnvJbor5HohJrmnKxcbiAqIEBwYXJhbSBjb250ZW50c1xuICogQHBhcmFtIHBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVKUyhjb250ZW50czogQnVmZmVyLCBwYXRoOiBzdHJpbmcpIHtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IEJhYmVsID0gcmVxdWlyZSgnQGJhYmVsL2NvcmUnKTtcbiAgICAgICAgcmVzdWx0ID0gQmFiZWwudHJhbnNmb3JtKGNvbnRlbnRzLCB7XG4gICAgICAgICAgICBhc3Q6IGZhbHNlLFxuICAgICAgICAgICAgaGlnaGxpZ2h0Q29kZTogZmFsc2UsXG4gICAgICAgICAgICBzb3VyY2VNYXBzOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbXBhY3Q6IGZhbHNlLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHBhdGgsIC8vIHNlYXJjaCBwYXRoIGZvciBiYWJlbHJjXG4gICAgICAgICAgICBwcmVzZXRzOiBbXG4gICAgICAgICAgICAgICAgcmVxdWlyZSgnQGJhYmVsL3ByZXNldC1lbnYnKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgdHJhbnNmb3JtLWRlY29yYXRvcnMtbGVnYWN5IGNvbWVzIGJlZm9yZSB0cmFuc2Zvcm0tY2xhc3MtcHJvcGVydGllcy5cbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmUoJ0BiYWJlbC9wbHVnaW4tcHJvcG9zYWwtZGVjb3JhdG9ycycpLFxuICAgICAgICAgICAgICAgICAgICB7IGxlZ2FjeTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICByZXF1aXJlKCdAYmFiZWwvcGx1Z2luLXByb3Bvc2FsLWNsYXNzLXByb3BlcnRpZXMnKSxcbiAgICAgICAgICAgICAgICAgICAgeyBsb29zZTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICByZXF1aXJlKCdiYWJlbC1wbHVnaW4tYWRkLW1vZHVsZS1leHBvcnRzJyksXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmUoJ0BiYWJlbC9wbHVnaW4tcHJvcG9zYWwtZXhwb3J0LWRlZmF1bHQtZnJvbScpLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBlcnIuc3RhY2sgPSBgQ29tcGlsZSAke3BhdGh9IGVycm9yOiAke2Vyci5zdGFja31gO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuY29kZTtcbn1cblxuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZHVsZUZpbGVzKHJlc3VsdDogSW50ZXJuYWxCdWlsZFJlc3VsdCkge1xuLy8gICAgIGNvbnN0IGdsb2JieU9wdGlvbnM6IEdsb2JieU9wdGlvbnMgPSB7IC8qIG5vZGlyOiB0cnVlKi8gfTtcbi8vICAgICByZXR1cm4gKFtdIGFzIHN0cmluZ1tdKS5jb25jYXQoLi4uYXdhaXQgUHJvbWlzZS5hbGwoW1xuLy8gICAgICAgICAvLyBFbmdpbmUgbW9kdWxlIGZpbGVzXG4vLyAgICAgICAgIHJlc3VsdC5wYXRocy5lbmdpbmVEaXIgPyBnbG9iYnkoam9pbihyZXN1bHQucGF0aHMuZW5naW5lRGlyLCAnKiovKi5qcycpLCBnbG9iYnlPcHRpb25zKSA6IFtdLFxuLy8gICAgICAgICAvLyBhcHBsaWNhdGlvbi5qc1xuLy8gICAgICAgICByZXN1bHQucGF0aHMuYXBwbGljYXRpb25KUyxcbi8vICAgICAgICAgLy8gUHJvamVjdCBzaGFyZWQgbW9kdWxlIGZpbGVzXG4vLyAgICAgICAgIGdsb2JieShqb2luKHJlc3VsdC5wYXRocy5kaXIsICdzcmMvY2h1bmtzLyoqLyouanMnKSwgZ2xvYmJ5T3B0aW9ucyksXG4vLyAgICAgICAgIC8vIFNjcmlwdCBtb2R1bGVzIGluIGJ1bmRsZVxuLy8gICAgICAgICByZXN1bHQuYnVuZGxlTWFuYWdlci5idW5kbGVzLm1hcCgoYnVuZGxlKSA9PiBidW5kbGUuc2NyaXB0RGVzdCksXG4vLyAgICAgXSkpO1xuLy8gfVxuXG5pbnRlcmZhY2UgSUNyZWF0ZUJ1bmRsZU9wdGlvbnMge1xuICAgIGV4Y2x1ZGVzPzogc3RyaW5nW107XG4gICAgZGVidWc/OiBib29sZWFuO1xuICAgIHNvdXJjZU1hcD86IGJvb2xlYW47XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQnVuZGxlKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcsIG9wdGlvbnM/OiBJQ3JlYXRlQnVuZGxlT3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IGJhYmVsaWZ5ID0gcmVxdWlyZSgnYmFiZWxpZnknKTtcbiAgICAgICAgY29uc3QgYnJvd3NlcmlmeSA9IHJlcXVpcmUoJ2Jyb3dzZXJpZnknKTtcbiAgICAgICAgY29uc3QgYnVuZGxlciA9IGJyb3dzZXJpZnkoc3JjKTtcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5leGNsdWRlcykge1xuICAgICAgICAgICAgb3B0aW9ucy5leGNsdWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgYnVuZGxlci5leGNsdWRlKHBhdGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGRlc3QpKTtcbiAgICAgICAgYnVuZGxlci50cmFuc2Zvcm0oYmFiZWxpZnksIHtcbiAgICAgICAgICAgIHByZXNldHM6IFtyZXF1aXJlKCdAYmFiZWwvcHJlc2V0LWVudicpXSxcbiAgICAgICAgICAgIHBsdWdpbnM6IFtyZXF1aXJlKCdAYmFiZWwvcGx1Z2luLXByb3Bvc2FsLWNsYXNzLXByb3BlcnRpZXMnKV0sXG4gICAgICAgIH0pXG4gICAgICAgICAgICAuYnVuZGxlKChlcnI6IEVycm9yLCBidWZmZXI6IEJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3cml0ZUZpbGVTeW5jKGRlc3QsIG5ldyBVaW50OEFycmF5KGJ1ZmZlciksICd1dGY4Jyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmNvbnN0IEhBU0hfTEVOID0gNTtcbmludGVyZmFjZSBJQXBwZW5kUmVzIHtcbiAgICBoYXNoOiBzdHJpbmc7XG4gICAgcGF0aHM6IHN0cmluZ1tdO1xufVxuLyoqXG4gKiDnu5nmn5Dkupvot6/lvoTmlofku7bmt7vliqAgbWQ1IOWQjue8gFxuICogQHBhcmFtIHBhdGhzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhcHBlbmRNZDVUb1BhdGhzKHBhdGhzOiBzdHJpbmdbXSk6IFByb21pc2U8SUFwcGVuZFJlcyB8IG51bGw+IHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocGF0aHMpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvLyDlj4LkuI4gbWQ1IOiuoeeul+eahOaVsOaNrumcgOimgeaOkuW6j++8jOS4lOS4jeiDveW5tuWPkeWQpuWImeS8muW9seWTjeaVsOaNruiuoeeul1xuICAgIHBhdGhzID0gcGF0aHMuc29ydCgpO1xuICAgIGNvbnN0IGRhdGFBcnIgPSBbXTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgcGF0aHMpIHtcbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkYXRhID0gYXdhaXQgcmVhZEZpbGUocGF0aCk7XG4gICAgICAgICAgICBkYXRhQXJyLnB1c2goZGF0YSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJlYWRGaWxlIHtsaW5rKCR7cGF0aH0pfWApO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBoYXNoID0gY2FsY01kNShkYXRhQXJyKTtcbiAgICBjb25zdCByZXN1bHRQYXRoczogc3RyaW5nW10gPSBbXTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgcGF0aHMubWFwKChwYXRoLCBpKSA9PiB7XG4gICAgICAgICAgICAvLyDpnZ7otYTmupDnsbvmm7/mjaLlkI3lrZdcbiAgICAgICAgICAgIHJlc3VsdFBhdGhzW2ldID0gcGF0Y2hNZDVUb1BhdGgocGF0aCwgaGFzaCk7XG4gICAgICAgICAgICAvLyDorqHnrpflrowgaGFzaCDlgLzkuYvlkI7ov5vooYzmlLnlkI1cbiAgICAgICAgICAgIHJldHVybiByZW5hbWUocGF0aCwgcmVzdWx0UGF0aHNbaV0pO1xuICAgICAgICB9KSxcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGF0aHM6IHJlc3VsdFBhdGhzLFxuICAgICAgICBoYXNoLFxuICAgIH07XG59XG5cbi8qKlxuICog6K6h566X5p+Q5Liq5pWw5o2u55qEIG1kNSDlgLxcbiAqIEBwYXJhbSBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjTWQ1KGRhdGE6IChCdWZmZXIgfCBzdHJpbmcpIHwgQXJyYXk8QnVmZmVyIHwgc3RyaW5nPik6IHN0cmluZyB7XG4gICAgZGF0YSA9IEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogW2RhdGFdO1xuICAgIGNvbnN0IHsgY3JlYXRlSGFzaCB9ID0gcmVxdWlyZSgnY3J5cHRvJyk7XG4gICAgY29uc3QgY3J5cHRvSGFzaCA9IGNyZWF0ZUhhc2goJ21kNScpO1xuICAgIGRhdGEuZm9yRWFjaCgoZGF0YUl0ZW0pID0+IHtcbiAgICAgICAgY3J5cHRvSGFzaC51cGRhdGUoZGF0YUl0ZW0pO1xuICAgIH0pO1xuICAgIHJldHVybiBjcnlwdG9IYXNoLmRpZ2VzdCgnaGV4Jykuc2xpY2UoMCwgSEFTSF9MRU4pO1xufVxuXG4vKipcbiAqIOWwhuafkOS4qiBoYXNoIOWAvOa3u+WKoOWIsOafkOS4qui3r+W+hOS4ilxuICogQHBhcmFtIHRhcmdldFBhdGggXG4gKiBAcGFyYW0gaGFzaCBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hNZDVUb1BhdGgodGFyZ2V0UGF0aDogc3RyaW5nLCBoYXNoOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwYXJzZU9iaiA9IHBhcnNlKHRhcmdldFBhdGgpO1xuICAgIHBhcnNlT2JqLmJhc2UgPSAnJztcbiAgICBwYXJzZU9iai5uYW1lICs9IGAuJHtoYXNofWA7XG4gICAgcmV0dXJuIGZvcm1hdChwYXJzZU9iaik7XG59XG5cbi8qKlxuICog6I635Y+W5LiA5Liq6LWE5rqQIGxpYnJhcnkg5Zyw5Z2A6YeM55qEIGxpYnJhcnkg5paH5Lu25aS557ud5a+56Lev5b6EXG4gKiBAcGFyYW0gbGlicmFyeVBhdGggXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExpYnJhcnlEaXIobGlicmFyeVBhdGg6IHN0cmluZykge1xuICAgIC8vIGxpYnJhcnkg5Zyw5Z2A5Y+v6IO95Zyo6aG555uu5YaF5Lmf5Y+v6IO95Zyo5YW25LuW5Lu75L2V5L2N572uXG4gICAgLy8g5q2k5aSE5Y+C6ICD5LqGIHV1aWQg5qih5Z2X55qEIGdldFV1aWRGcm9tTGliUGF0aCDmiYDnlKjmraPliJnmnaXojrflj5YgbGlicmFyeSDku6Xlj4rkuYvliY3nmoTot6/lvoRcbiAgICBjb25zdCBtYXRjaEluZm8gPSBsaWJyYXJ5UGF0aC5tYXRjaCgvKC4qKVsvXFxcXF1bMC05YS1mQS1GXXsyfVsvXFxcXF1bMC05YS1mQS1GLV17OCx9KChAWzAtOWEtZkEtRl17NSx9KSspPy4qLyk7XG4gICAgcmV0dXJuIG1hdGNoSW5mbyFbMV07XG59XG5cbi8vIOatpOW3peWFt+aWueazlei1sCB3b3JrZXJNYW5hZ2VyIOeuoeeQhu+8jOaWueS+v+WvueW8gOWQr+eahOi/m+eoi+WBmuS4reaWrVxuZXhwb3J0IGNvbnN0IHF1aWNrU3Bhd24gPSB3b3JrZXJNYW5hZ2VyLnF1aWNrU3Bhd24uYmluZCh3b3JrZXJNYW5hZ2VyKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5SW1hZ2VBc3NldEZyb21TdWJBc3NldEJ5VXVpZChzdWJBc3NldFV1aWQ6IHN0cmluZykge1xuICAgIHJldHVybiBzdWJBc3NldFV1aWQuc3BsaXQoJ0AnKVswXTtcbn1cbiJdfQ==