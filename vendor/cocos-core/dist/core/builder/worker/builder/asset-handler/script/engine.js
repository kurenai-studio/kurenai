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
exports.buildEngineX = buildEngineX;
exports.buildSplitEngine = buildSplitEngine;
exports.queryEngineImportMap = queryEngineImportMap;
const crypto_1 = require("crypto");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const ccBuild = __importStar(require("@cocos/ccbuild"));
const fs_extra_2 = __importDefault(require("fs-extra"));
const path_2 = __importDefault(require("path"));
const sub_process_manager_1 = require("../../../worker-pools/sub-process-manager");
const fast_glob_1 = __importDefault(require("fast-glob"));
const mangle_config_parser_1 = require("./mangle-config-parser");
const default_mangle_config_1 = require("./default-mangle-config");
const utils_1 = __importDefault(require("../../../../../base/utils"));
const utils_2 = require("../../utils");
const builder_config_1 = __importDefault(require("../../../../share/builder-config"));
// 存储引擎复用参数的文件
const EngineCacheName = 'engine-cache';
/**
 * 见：https://github.com/cocos-creator/engine/pull/6735 中 build-engine 接口返回的注释
 *
 * 补充一下：
 * - 这个文件本来是为多模块设计的，里面记录了类似这样的映射：
 * ```js
 * {
 *   // 暴露给用户的模块名和实际模块文件
 *   "cc.core": "./cc.core.js",
 *   "cc.audio": "./cc.audio.js",
 * }
 * ```
 * - 如果分割了引擎，里面就是记录了如上的映射；
 * - 现在只有在微信下面分割了引擎。其它里面没有分割所以这个文件只记录了模块 `cc` 的映射：
 * ```js
 * {
 *   "cc": "./cc.js",
 * }
 * ```
 */
const exportsMetaFile = 'meta.json';
/**
 * 引擎构建
 * @param options
 * @param settings
 */
async function buildEngineX(options, ccEnvConstants, logDest) {
    const { output, metaFile } = await buildEngine(options, ccEnvConstants, logDest);
    await (0, fs_extra_1.emptyDir)(options.output);
    await (0, fs_extra_1.copy)(`${output}`, options.output, {
        recursive: true,
    });
    return { metaFile };
}
const fixedMd5Keys = [
    'debug',
    'sourceMaps',
    'includeModules',
    'engineVersion',
    'platformType',
    'split',
    'nativeCodeBundleMode',
    'targets',
    'entry',
    'noDeprecatedFeatures',
    'loose',
    'assetURLFormat',
    'flags',
    'preserveType',
    'wasmCompressionMode',
    'enableNamedRegisterForSystemJSModuleFormat',
    'mangleProperties',
    'inlineEnum',
];
async function buildEngine(options, ccEnvConstants, logDest) {
    // TODO
    const noDeprecatedFeaturesConfig = { value: false, version: '' };
    const loose = options.loose || false;
    const noDeprecatedFeatures = noDeprecatedFeaturesConfig.value ?
        (!noDeprecatedFeaturesConfig.version ? true : noDeprecatedFeaturesConfig.version) :
        undefined;
    const profileOptions = {
        noDeprecatedFeatures,
        loose,
    };
    const mangleConfigJsonPath = (0, path_1.join)(builder_config_1.default.projectRoot, 'engine-mangle-config.json');
    if (options.mangleProperties && !await fs_extra_2.default.pathExists(mangleConfigJsonPath)) {
        console.debug(`mangleProperties is enabled, but engine-mangle-config.json not found, create default mangle configuration`);
        default_mangle_config_1.defaultMangleConfig.__doc_url__ = utils_1.default.Url.getDocUrl('advanced-topics/mangle-properties.html');
        await fs_extra_2.default.writeJson(mangleConfigJsonPath, default_mangle_config_1.defaultMangleConfig, { spaces: 2 });
    }
    else {
        console.debug(`mangleProperties is enabled, found engine-mangle-config.json, use it`);
    }
    // 计算缓存名字，并检查状态
    const md5Keys = options.md5Map.length === 0 ?
        fixedMd5Keys : options.md5Map.concat(fixedMd5Keys);
    let md5String = calcMd5String(Object.assign(profileOptions, options), md5Keys);
    if (options.mangleProperties) {
        md5String += `projectPath=${builder_config_1.default.projectRoot},`;
        console.debug(`Found mangle config, append projectPath to md5String: ${md5String.split(',').join(',\n')}`);
    }
    const md5 = (0, crypto_1.createHash)('md5');
    const name = md5.update(md5String).digest('hex');
    // TODO 缓存引擎目录确认
    const output = (0, path_1.join)(options.entry, 'bin/temp', name);
    const metaDir = (0, path_1.join)((0, path_1.dirname)(output), `${name}.meta`);
    const watchFilesRecordFile = `${output}.watch-files.json`;
    const metaFile = (0, path_1.join)(metaDir, exportsMetaFile);
    if (options.useCache && await validateCache(output, watchFilesRecordFile) && await isValidMeta(metaFile)) {
        console.debug(`Use cache engine: {link(${output})}`);
        console.debug(`Use cache, md5String: ${md5String.split(',').join(',\n')}`);
        console.debug(`Use cache, options: ` + JSON.stringify(options, null, 2));
        return {
            output,
            metaFile,
        };
    }
    let mangleConfigJsonMtime = 0;
    let mangleProperties = false;
    if (options.mangleProperties) {
        if (ccEnvConstants.NATIVE) {
            // 原生平台由于某些类使用 .jsb.ts 替代 .ts，比如 node.jsb.ts 替代 node.ts，暂时无法支持属性压缩功能
            console.warn(`Currently, mangling internal properties is not supported on native platforms, current platform: ${options.platformType}`);
        }
        else {
            mangleProperties = (0, mangle_config_parser_1.parseMangleConfig)(mangleConfigJsonPath, options.platformType);
            if (mangleProperties === undefined) {
                console.debug(`engine-mangle-config.json not found, but mangleProperties is enabled, so enable mangleProperties with default mangle configuration`);
                mangleProperties = true;
            }
            else {
                mangleConfigJsonMtime = (await fs_extra_2.default.stat(mangleConfigJsonPath)).mtimeMs;
                console.debug(`mangleProperties: ${JSON.stringify(mangleProperties, null, 2)}`);
            }
        }
    }
    else {
        console.debug(`mangleProperties is disabled, platform: ${options.platformType}`);
    }
    const buildOptions = {
        incremental: watchFilesRecordFile,
        engine: options.entry,
        out: output,
        moduleFormat: 'system',
        compress: !options.debug,
        nativeCodeBundleMode: options.nativeCodeBundleMode,
        assetURLFormat: options.assetURLFormat,
        noDeprecatedFeatures,
        sourceMap: options.sourceMaps,
        targets: options.targets,
        loose,
        features: options.includeModules,
        platform: options.platformType,
        flags: options.flags,
        mode: 'BUILD',
        metaFile,
        preserveType: options.preserveType,
        wasmCompressionMode: options.wasmCompressionMode,
        enableNamedRegisterForSystemJSModuleFormat: options.enableNamedRegisterForSystemJSModuleFormat,
        inlineEnum: options.inlineEnum,
        mangleProperties,
        mangleConfigJsonMtime,
    };
    // 引擎编译目前编译内存占用较大，需要独立进程管理
    await sub_process_manager_1.workerManager.registerTask({
        name: 'build-engine',
        path: (0, path_1.join)(__dirname, './build-engine'),
        options: {
            cwd: options.entry,
        },
    });
    console.debug(`Cache is invalid, start build engine with options: ${JSON.stringify(buildOptions, null, 2)}`);
    console.debug(`md5String: ${md5String.split(',').join(',\n')}`);
    await sub_process_manager_1.workerManager.runTask('build-engine', 'buildEngineCommand', [buildOptions], logDest);
    // await buildEngineCommand(buildOptions);
    await outputCacheJson(options, output);
    sub_process_manager_1.workerManager.kill('build-engine');
    console.debug(`build engine done: output: ${output}`);
    return {
        output,
        metaFile,
    };
}
async function buildSplitEngine(options, logDest) {
    // 引擎编译目前编译内存占用较大，需要独立进程管理
    await sub_process_manager_1.workerManager.registerTask({
        name: 'build-engine',
        path: (0, path_1.join)(__dirname, './build-engine'),
    });
    return await sub_process_manager_1.workerManager.runTask('build-engine', 'buildSeparateEngine', [options], logDest);
    // return await buildSeparateEngine(options);
}
/**
 * 验证缓存引擎的有效性。
 * @param cache 引擎缓存路径。
 * @param incrementalFile 增量文件。
 */
async function validateCache(cache, incrementalFile) {
    if (!await fs_extra_2.default.pathExists(cache)) {
        console.debug(`Engine cache (${cache}) does not exist.`);
        return false;
    }
    let zeroCheck = false;
    try {
        const files = await (0, fast_glob_1.default)('**/*.js', {
            cwd: cache,
        });
        if (files.length !== 0) {
            zeroCheck = true;
        }
    }
    catch { }
    if (!zeroCheck) {
        console.warn(`Engine cache directory({link(${cache})}) exists but has empty content. It's abnormal.`);
        return false;
    }
    if (await ccBuild.buildEngine.isSourceChanged(incrementalFile)) {
        return false;
    }
    return true;
}
async function isValidMeta(metaFile) {
    if (!await (0, fs_extra_1.pathExists)(metaFile)) {
        return false;
    }
    let exportMeta;
    try {
        exportMeta = await fs_extra_2.default.readJson(metaFile);
    }
    catch (err) {
        return false;
    }
    if (typeof exportMeta !== 'object' || exportMeta === null) {
        return false;
    }
    const exports = exportMeta.exports;
    if (typeof exports !== 'object') {
        return false;
    }
    const mangleConfigJsonPath = (0, path_1.join)(builder_config_1.default.projectRoot, 'engine-mangle-config.json');
    if (await fs_extra_2.default.pathExists(mangleConfigJsonPath)) {
        const currentMangleConfigJsonMtime = (await fs_extra_2.default.stat(mangleConfigJsonPath)).mtimeMs;
        const currentMangleConfigJsonReadableTime = new Date(currentMangleConfigJsonMtime).toLocaleString();
        const oldMangleConfigJsonMtime = exportMeta.mangleConfigJsonMtime;
        const oldMangleConfigJsonReadableTime = oldMangleConfigJsonMtime !== undefined ? new Date(oldMangleConfigJsonMtime).toLocaleString() : 0;
        if (currentMangleConfigJsonMtime !== oldMangleConfigJsonMtime) {
            console.debug(`engine-mangle-config.json mtime changed: now: ${currentMangleConfigJsonReadableTime} !== old: ${oldMangleConfigJsonReadableTime}`);
            return false;
        }
        else {
            console.debug(`engine-mangle-config.json mtime isn't changed: now: ${currentMangleConfigJsonReadableTime} === old: ${oldMangleConfigJsonReadableTime}`);
        }
    }
    return true;
}
function calcMd5String(config, keys) {
    let str = '';
    for (const key of keys) {
        str += `${key}=${JSON.stringify(config[key])},`;
    }
    return str;
}
/**
 * 生成引擎文件和对应的 map 文件
 * @param options
 * @param output
 */
async function outputCacheJson(options, output) {
    const dest = (0, path_1.join)((0, path_1.dirname)(output), `${EngineCacheName}.json`);
    let data = {};
    if (await (0, fs_extra_1.pathExists)(dest)) {
        data = await (0, fs_extra_1.readJson)(dest);
    }
    data = data || {};
    const hashName = (0, path_1.basename)(output);
    data[hashName] = options;
    await (0, fs_extra_1.outputJSON)(dest, data);
}
async function queryEngineImportMap(metaPath, enginePath, importMapDir, baseUrl) {
    let exportMeta;
    try {
        exportMeta = await fs_extra_2.default.readJson(metaPath);
    }
    catch (err) {
        throw new Error(`Failed to read engine export meta, engine might not have been build correctly: ${err}`);
    }
    const baseUrlObj = baseUrl ? new URL(baseUrl) : undefined;
    const getImportURL = (moduleFile) => {
        let importUrl;
        if (baseUrlObj) {
            importUrl = new URL(moduleFile, baseUrlObj).href;
        }
        else {
            importUrl = `./${(0, utils_2.relativeUrl)(importMapDir, path_2.default.join(enginePath, moduleFile))}`;
        }
        return importUrl;
    };
    const importMap = {};
    for (const [moduleName, moduleFile] of Object.entries(exportMeta.exports)) {
        // importMap.imports[moduleName] = getImportURL(moduleFile);
        importMap[moduleName] = getImportURL(moduleFile);
    }
    for (const [alias, moduleFile] of Object.entries(exportMeta.chunkAliases)) {
        // importMap.imports[alias] = getImportURL(moduleFile);
        importMap[alias] = getImportURL(moduleFile);
    }
    return importMap;
}
