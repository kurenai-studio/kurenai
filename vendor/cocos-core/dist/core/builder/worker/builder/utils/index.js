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
