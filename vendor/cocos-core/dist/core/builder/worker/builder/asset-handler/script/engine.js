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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci93b3JrZXIvYnVpbGRlci9hc3NldC1oYW5kbGVyL3NjcmlwdC9lbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdEYixvQ0FjQztBQXVKRCw0Q0FRQztBQWlHRCxvREFrQ0M7QUF0V0QsbUNBQW9DO0FBQ3BDLCtCQUErQztBQUMvQyx1Q0FNa0I7QUFDbEIsd0RBQTBDO0FBQzFDLHdEQUEwQjtBQUMxQixnREFBc0I7QUFDdEIsbUZBQTBFO0FBQzFFLDBEQUEyQjtBQUUzQixpRUFBMkQ7QUFDM0QsbUVBQThEO0FBRzlELHNFQUE4QztBQUM5Qyx1Q0FBMEM7QUFDMUMsc0ZBQTZEO0FBRzdELGNBQWM7QUFDZCxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUM7QUFFdkM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUM7QUFFcEM7Ozs7R0FJRztBQUNJLEtBQUssVUFBVSxZQUFZLENBQzlCLE9BQTBCLEVBQzFCLGNBQXlELEVBQ3pELE9BQWdCO0lBRWhCLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUVqRixNQUFNLElBQUEsbUJBQVEsRUFBQyxPQUFPLENBQUMsTUFBTyxDQUFDLENBQUM7SUFFaEMsTUFBTSxJQUFBLGVBQUksRUFBQyxHQUFHLE1BQU0sRUFBRSxFQUFFLE9BQU8sQ0FBQyxNQUFPLEVBQUU7UUFDckMsU0FBUyxFQUFFLElBQUk7S0FDbEIsQ0FBQyxDQUFDO0lBRUgsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFVRCxNQUFNLFlBQVks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Q0FBQyxVQUFVLENBQUMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1FBQ3hFLHVEQUF1RDtRQUN2RCxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCB7IGJhc2VuYW1lLCBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQge1xuICAgIG91dHB1dEpTT04sXG4gICAgcGF0aEV4aXN0cyxcbiAgICByZWFkSnNvbixcbiAgICBlbXB0eURpcixcbiAgICBjb3B5LFxufSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBjY0J1aWxkIGZyb20gJ0Bjb2Nvcy9jY2J1aWxkJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgcHMgZnJvbSAncGF0aCc7XG5pbXBvcnQgeyB3b3JrZXJNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vLi4vd29ya2VyLXBvb2xzL3N1Yi1wcm9jZXNzLW1hbmFnZXInO1xuaW1wb3J0IGZnIGZyb20gJ2Zhc3QtZ2xvYic7XG5cbmltcG9ydCB7IHBhcnNlTWFuZ2xlQ29uZmlnIH0gZnJvbSAnLi9tYW5nbGUtY29uZmlnLXBhcnNlcic7XG5pbXBvcnQgeyBkZWZhdWx0TWFuZ2xlQ29uZmlnIH0gZnJvbSAnLi9kZWZhdWx0LW1hbmdsZS1jb25maWcnO1xuaW1wb3J0IHsgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9jY2J1aWxkJztcbmltcG9ydCB7IElCdWlsZEVuZ2luZVBhcmFtLCBJSW50ZXJuYWxCdWlsZE9wdGlvbnMsIElCdWlsZFNlcGFyYXRlRW5naW5lT3B0aW9ucywgSUJ1aWxkU2VwYXJhdGVFbmdpbmVSZXN1bHQgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB1dGlscyBmcm9tICcuLi8uLi8uLi8uLi8uLi9iYXNlL3V0aWxzJztcbmltcG9ydCB7IHJlbGF0aXZlVXJsIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IGJ1aWxkZXJDb25maWcgZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvYnVpbGRlci1jb25maWcnO1xuaW1wb3J0IHsgYnVpbGRFbmdpbmVPcHRpb25zIH0gZnJvbSAnLi9idWlsZC1lbmdpbmUnO1xuXG4vLyDlrZjlgqjlvJXmk47lpI3nlKjlj4LmlbDnmoTmlofku7ZcbmNvbnN0IEVuZ2luZUNhY2hlTmFtZSA9ICdlbmdpbmUtY2FjaGUnO1xuXG4vKipcbiAqIOinge+8mmh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy1jcmVhdG9yL2VuZ2luZS9wdWxsLzY3MzUg5LitIGJ1aWxkLWVuZ2luZSDmjqXlj6Pov5Tlm57nmoTms6jph4pcbiAqXG4gKiDooaXlhYXkuIDkuIvvvJpcbiAqIC0g6L+Z5Liq5paH5Lu25pys5p2l5piv5Li65aSa5qih5Z2X6K6+6K6h55qE77yM6YeM6Z2i6K6w5b2V5LqG57G75Ly86L+Z5qC355qE5pig5bCE77yaXG4gKiBgYGBqc1xuICoge1xuICogICAvLyDmmrTpnLLnu5nnlKjmiLfnmoTmqKHlnZflkI3lkozlrp7pmYXmqKHlnZfmlofku7ZcbiAqICAgXCJjYy5jb3JlXCI6IFwiLi9jYy5jb3JlLmpzXCIsXG4gKiAgIFwiY2MuYXVkaW9cIjogXCIuL2NjLmF1ZGlvLmpzXCIsXG4gKiB9XG4gKiBgYGBcbiAqIC0g5aaC5p6c5YiG5Ymy5LqG5byV5pOO77yM6YeM6Z2i5bCx5piv6K6w5b2V5LqG5aaC5LiK55qE5pig5bCE77ybXG4gKiAtIOeOsOWcqOWPquacieWcqOW+ruS/oeS4i+mdouWIhuWJsuS6huW8leaTjuOAguWFtuWug+mHjOmdouayoeacieWIhuWJsuaJgOS7pei/meS4quaWh+S7tuWPquiusOW9leS6huaooeWdlyBgY2NgIOeahOaYoOWwhO+8mlxuICogYGBganNcbiAqIHtcbiAqICAgXCJjY1wiOiBcIi4vY2MuanNcIixcbiAqIH1cbiAqIGBgYFxuICovXG5jb25zdCBleHBvcnRzTWV0YUZpbGUgPSAnbWV0YS5qc29uJztcblxuLyoqXG4gKiDlvJXmk47mnoTlu7pcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAcGFyYW0gc2V0dGluZ3NcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkRW5naW5lWChcbiAgICBvcHRpb25zOiBJQnVpbGRFbmdpbmVQYXJhbSxcbiAgICBjY0VudkNvbnN0YW50czogU3RhdHNRdWVyeS5Db25zdGFudE1hbmFnZXIuQ0NFbnZDb25zdGFudHMsXG4gICAgbG9nRGVzdD86IHN0cmluZyxcbikge1xuICAgIGNvbnN0IHsgb3V0cHV0LCBtZXRhRmlsZSB9ID0gYXdhaXQgYnVpbGRFbmdpbmUob3B0aW9ucywgY2NFbnZDb25zdGFudHMsIGxvZ0Rlc3QpO1xuXG4gICAgYXdhaXQgZW1wdHlEaXIob3B0aW9ucy5vdXRwdXQhKTtcblxuICAgIGF3YWl0IGNvcHkoYCR7b3V0cHV0fWAsIG9wdGlvbnMub3V0cHV0ISwge1xuICAgICAgICByZWN1cnNpdmU6IHRydWUsXG4gICAgfSk7XG5cbiAgICByZXR1cm4geyBtZXRhRmlsZSB9O1xufVxuXG4vKipcbiAqIOi/meS6m+mAiemhueaYr+adpeiHquS6juiuvue9rueahO+8jOS5n+WKoOWFpee8k+WtmOajgOa1i+OAglxuICovXG5pbnRlcmZhY2UgUHJvZmlsZU9wdGlvbnMge1xuICAgIG5vRGVwcmVjYXRlZEZlYXR1cmVzOiBzdHJpbmcgfCBib29sZWFuIHwgdW5kZWZpbmVkO1xuICAgIGxvb3NlOiBib29sZWFuO1xufVxuXG5jb25zdCBmaXhlZE1kNUtleXM6IHJlYWRvbmx5IChrZXlvZiBJSW50ZXJuYWxCdWlsZE9wdGlvbnNbJ2J1aWxkRW5naW5lUGFyYW0nXSB8IGtleW9mIFByb2ZpbGVPcHRpb25zKVtdID0gW1xuICAgICdkZWJ1ZycsXG4gICAgJ3NvdXJjZU1hcHMnLFxuICAgICdpbmNsdWRlTW9kdWxlcycsXG4gICAgJ2VuZ2luZVZlcnNpb24nLFxuICAgICdwbGF0Zm9ybVR5cGUnLFxuICAgICdzcGxpdCcsXG4gICAgJ25hdGl2ZUNvZGVCdW5kbGVNb2RlJyxcbiAgICAndGFyZ2V0cycsXG4gICAgJ2VudHJ5JyxcbiAgICAnbm9EZXByZWNhdGVkRmVhdHVyZXMnLFxuICAgICdsb29zZScsXG4gICAgJ2Fzc2V0VVJMRm9ybWF0JyxcbiAgICAnZmxhZ3MnLFxuICAgICdwcmVzZXJ2ZVR5cGUnLFxuICAgICd3YXNtQ29tcHJlc3Npb25Nb2RlJyxcbiAgICAnZW5hYmxlTmFtZWRSZWdpc3RlckZvclN5c3RlbUpTTW9kdWxlRm9ybWF0JyxcbiAgICAnbWFuZ2xlUHJvcGVydGllcycsXG4gICAgJ2lubGluZUVudW0nLFxuXTtcblxuYXN5bmMgZnVuY3Rpb24gYnVpbGRFbmdpbmUob3B0aW9uczogSUJ1aWxkRW5naW5lUGFyYW0sIGNjRW52Q29uc3RhbnRzOiBTdGF0c1F1ZXJ5LkNvbnN0YW50TWFuYWdlci5DQ0VudkNvbnN0YW50cywgbG9nRGVzdD86IHN0cmluZykge1xuICAgIC8vIFRPRE9cbiAgICBjb25zdCBub0RlcHJlY2F0ZWRGZWF0dXJlc0NvbmZpZzogeyB2YWx1ZTogYm9vbGVhbiwgdmVyc2lvbjogc3RyaW5nIH0gPSB7IHZhbHVlOiBmYWxzZSwgdmVyc2lvbjogJycgfTtcbiAgICBjb25zdCBsb29zZTogYm9vbGVhbiA9IG9wdGlvbnMubG9vc2UgfHwgZmFsc2U7XG5cbiAgICBjb25zdCBub0RlcHJlY2F0ZWRGZWF0dXJlcyA9IG5vRGVwcmVjYXRlZEZlYXR1cmVzQ29uZmlnLnZhbHVlID9cbiAgICAgICAgKCFub0RlcHJlY2F0ZWRGZWF0dXJlc0NvbmZpZy52ZXJzaW9uID8gdHJ1ZSA6IG5vRGVwcmVjYXRlZEZlYXR1cmVzQ29uZmlnLnZlcnNpb24pIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgcHJvZmlsZU9wdGlvbnM6IFByb2ZpbGVPcHRpb25zID0ge1xuICAgICAgICBub0RlcHJlY2F0ZWRGZWF0dXJlcyxcbiAgICAgICAgbG9vc2UsXG4gICAgfTtcblxuICAgIGNvbnN0IG1hbmdsZUNvbmZpZ0pzb25QYXRoID0gam9pbihidWlsZGVyQ29uZmlnLnByb2plY3RSb290LCAnZW5naW5lLW1hbmdsZS1jb25maWcuanNvbicpO1xuICAgIGlmIChvcHRpb25zLm1hbmdsZVByb3BlcnRpZXMgJiYgIWF3YWl0IGZzLnBhdGhFeGlzdHMobWFuZ2xlQ29uZmlnSnNvblBhdGgpKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYG1hbmdsZVByb3BlcnRpZXMgaXMgZW5hYmxlZCwgYnV0IGVuZ2luZS1tYW5nbGUtY29uZmlnLmpzb24gbm90IGZvdW5kLCBjcmVhdGUgZGVmYXVsdCBtYW5nbGUgY29uZmlndXJhdGlvbmApO1xuICAgICAgICBkZWZhdWx0TWFuZ2xlQ29uZmlnLl9fZG9jX3VybF9fID0gdXRpbHMuVXJsLmdldERvY1VybCgnYWR2YW5jZWQtdG9waWNzL21hbmdsZS1wcm9wZXJ0aWVzLmh0bWwnKTtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVKc29uKG1hbmdsZUNvbmZpZ0pzb25QYXRoLCBkZWZhdWx0TWFuZ2xlQ29uZmlnLCB7IHNwYWNlczogMiB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBtYW5nbGVQcm9wZXJ0aWVzIGlzIGVuYWJsZWQsIGZvdW5kIGVuZ2luZS1tYW5nbGUtY29uZmlnLmpzb24sIHVzZSBpdGApO1xuICAgIH1cblxuICAgIC8vIOiuoeeul+e8k+WtmOWQjeWtl++8jOW5tuajgOafpeeKtuaAgVxuICAgIGNvbnN0IG1kNUtleXMgPSBvcHRpb25zLm1kNU1hcC5sZW5ndGggPT09IDAgP1xuICAgICAgICBmaXhlZE1kNUtleXMgOiBvcHRpb25zLm1kNU1hcC5jb25jYXQoZml4ZWRNZDVLZXlzKTtcbiAgICBsZXQgbWQ1U3RyaW5nID0gY2FsY01kNVN0cmluZyhPYmplY3QuYXNzaWduKHByb2ZpbGVPcHRpb25zLCBvcHRpb25zKSwgbWQ1S2V5cyk7XG5cbiAgICBpZiAob3B0aW9ucy5tYW5nbGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIG1kNVN0cmluZyArPSBgcHJvamVjdFBhdGg9JHtidWlsZGVyQ29uZmlnLnByb2plY3RSb290fSxgO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBGb3VuZCBtYW5nbGUgY29uZmlnLCBhcHBlbmQgcHJvamVjdFBhdGggdG8gbWQ1U3RyaW5nOiAke21kNVN0cmluZy5zcGxpdCgnLCcpLmpvaW4oJyxcXG4nKX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBtZDUgPSBjcmVhdGVIYXNoKCdtZDUnKTtcbiAgICBjb25zdCBuYW1lID0gbWQ1LnVwZGF0ZShtZDVTdHJpbmcpLmRpZ2VzdCgnaGV4Jyk7XG4gICAgLy8gVE9ETyDnvJPlrZjlvJXmk47nm67lvZXnoa7orqRcbiAgICBjb25zdCBvdXRwdXQgPSBqb2luKG9wdGlvbnMuZW50cnksICdiaW4vdGVtcCcsIG5hbWUpO1xuICAgIGNvbnN0IG1ldGFEaXIgPSBqb2luKGRpcm5hbWUob3V0cHV0KSwgYCR7bmFtZX0ubWV0YWApO1xuICAgIGNvbnN0IHdhdGNoRmlsZXNSZWNvcmRGaWxlID0gYCR7b3V0cHV0fS53YXRjaC1maWxlcy5qc29uYDtcbiAgICBjb25zdCBtZXRhRmlsZSA9IGpvaW4obWV0YURpciwgZXhwb3J0c01ldGFGaWxlKTtcblxuICAgIGlmIChvcHRpb25zLnVzZUNhY2hlICYmIGF3YWl0IHZhbGlkYXRlQ2FjaGUob3V0cHV0LCB3YXRjaEZpbGVzUmVjb3JkRmlsZSkgJiYgYXdhaXQgaXNWYWxpZE1ldGEobWV0YUZpbGUpKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFVzZSBjYWNoZSBlbmdpbmU6IHtsaW5rKCR7b3V0cHV0fSl9YCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFVzZSBjYWNoZSwgbWQ1U3RyaW5nOiAke21kNVN0cmluZy5zcGxpdCgnLCcpLmpvaW4oJyxcXG4nKX1gKTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgVXNlIGNhY2hlLCBvcHRpb25zOiBgICsgSlNPTi5zdHJpbmdpZnkob3B0aW9ucywgbnVsbCwgMikpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3V0cHV0LFxuICAgICAgICAgICAgbWV0YUZpbGUsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgbGV0IG1hbmdsZUNvbmZpZ0pzb25NdGltZSA9IDA7XG4gICAgbGV0IG1hbmdsZVByb3BlcnRpZXM6IGJ1aWxkRW5naW5lT3B0aW9uc1snbWFuZ2xlUHJvcGVydGllcyddID0gZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMubWFuZ2xlUHJvcGVydGllcykge1xuICAgICAgICBpZiAoY2NFbnZDb25zdGFudHMuTkFUSVZFKSB7XG4gICAgICAgICAgICAvLyDljp/nlJ/lubPlj7DnlLHkuo7mn5Dkupvnsbvkvb/nlKggLmpzYi50cyDmm7/ku6MgLnRz77yM5q+U5aaCIG5vZGUuanNiLnRzIOabv+S7oyBub2RlLnRz77yM5pqC5pe25peg5rOV5pSv5oyB5bGe5oCn5Y6L57yp5Yqf6IO9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEN1cnJlbnRseSwgbWFuZ2xpbmcgaW50ZXJuYWwgcHJvcGVydGllcyBpcyBub3Qgc3VwcG9ydGVkIG9uIG5hdGl2ZSBwbGF0Zm9ybXMsIGN1cnJlbnQgcGxhdGZvcm06ICR7b3B0aW9ucy5wbGF0Zm9ybVR5cGV9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYW5nbGVQcm9wZXJ0aWVzID0gcGFyc2VNYW5nbGVDb25maWcobWFuZ2xlQ29uZmlnSnNvblBhdGgsIG9wdGlvbnMucGxhdGZvcm1UeXBlKTtcbiAgICAgICAgICAgIGlmIChtYW5nbGVQcm9wZXJ0aWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBlbmdpbmUtbWFuZ2xlLWNvbmZpZy5qc29uIG5vdCBmb3VuZCwgYnV0IG1hbmdsZVByb3BlcnRpZXMgaXMgZW5hYmxlZCwgc28gZW5hYmxlIG1hbmdsZVByb3BlcnRpZXMgd2l0aCBkZWZhdWx0IG1hbmdsZSBjb25maWd1cmF0aW9uYCk7XG4gICAgICAgICAgICAgICAgbWFuZ2xlUHJvcGVydGllcyA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hbmdsZUNvbmZpZ0pzb25NdGltZSA9IChhd2FpdCBmcy5zdGF0KG1hbmdsZUNvbmZpZ0pzb25QYXRoKSkubXRpbWVNcztcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBtYW5nbGVQcm9wZXJ0aWVzOiAke0pTT04uc3RyaW5naWZ5KG1hbmdsZVByb3BlcnRpZXMsIG51bGwsIDIpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgbWFuZ2xlUHJvcGVydGllcyBpcyBkaXNhYmxlZCwgcGxhdGZvcm06ICR7b3B0aW9ucy5wbGF0Zm9ybVR5cGV9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRPcHRpb25zOiBidWlsZEVuZ2luZU9wdGlvbnMgPSB7XG4gICAgICAgIGluY3JlbWVudGFsOiB3YXRjaEZpbGVzUmVjb3JkRmlsZSxcbiAgICAgICAgZW5naW5lOiBvcHRpb25zLmVudHJ5LFxuICAgICAgICBvdXQ6IG91dHB1dCxcbiAgICAgICAgbW9kdWxlRm9ybWF0OiAnc3lzdGVtJyxcbiAgICAgICAgY29tcHJlc3M6ICFvcHRpb25zLmRlYnVnLFxuICAgICAgICBuYXRpdmVDb2RlQnVuZGxlTW9kZTogb3B0aW9ucy5uYXRpdmVDb2RlQnVuZGxlTW9kZSxcbiAgICAgICAgYXNzZXRVUkxGb3JtYXQ6IG9wdGlvbnMuYXNzZXRVUkxGb3JtYXQsXG4gICAgICAgIG5vRGVwcmVjYXRlZEZlYXR1cmVzLFxuICAgICAgICBzb3VyY2VNYXA6IG9wdGlvbnMuc291cmNlTWFwcyxcbiAgICAgICAgdGFyZ2V0czogb3B0aW9ucy50YXJnZXRzLFxuICAgICAgICBsb29zZSxcbiAgICAgICAgZmVhdHVyZXM6IG9wdGlvbnMuaW5jbHVkZU1vZHVsZXMsXG4gICAgICAgIHBsYXRmb3JtOiBvcHRpb25zLnBsYXRmb3JtVHlwZSxcbiAgICAgICAgZmxhZ3M6IG9wdGlvbnMuZmxhZ3MsXG4gICAgICAgIG1vZGU6ICdCVUlMRCcsXG4gICAgICAgIG1ldGFGaWxlLFxuICAgICAgICBwcmVzZXJ2ZVR5cGU6IG9wdGlvbnMucHJlc2VydmVUeXBlLFxuICAgICAgICB3YXNtQ29tcHJlc3Npb25Nb2RlOiBvcHRpb25zLndhc21Db21wcmVzc2lvbk1vZGUsXG4gICAgICAgIGVuYWJsZU5hbWVkUmVnaXN0ZXJGb3JTeXN0ZW1KU01vZHVsZUZvcm1hdDogb3B0aW9ucy5lbmFibGVOYW1lZFJlZ2lzdGVyRm9yU3lzdGVtSlNNb2R1bGVGb3JtYXQsXG4gICAgICAgIGlubGluZUVudW06IG9wdGlvbnMuaW5saW5lRW51bSxcbiAgICAgICAgbWFuZ2xlUHJvcGVydGllcyxcbiAgICAgICAgbWFuZ2xlQ29uZmlnSnNvbk10aW1lLFxuICAgIH07XG5cbiAgICAvLyDlvJXmk47nvJbor5Hnm67liY3nvJbor5HlhoXlrZjljaDnlKjovoPlpKfvvIzpnIDopoHni6znq4vov5vnqIvnrqHnkIZcbiAgICBhd2FpdCB3b3JrZXJNYW5hZ2VyLnJlZ2lzdGVyVGFzayh7XG4gICAgICAgIG5hbWU6ICdidWlsZC1lbmdpbmUnLFxuICAgICAgICBwYXRoOiBqb2luKF9fZGlybmFtZSwgJy4vYnVpbGQtZW5naW5lJyksXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGN3ZDogb3B0aW9ucy5lbnRyeSxcbiAgICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zb2xlLmRlYnVnKGBDYWNoZSBpcyBpbnZhbGlkLCBzdGFydCBidWlsZCBlbmdpbmUgd2l0aCBvcHRpb25zOiAke0pTT04uc3RyaW5naWZ5KGJ1aWxkT3B0aW9ucywgbnVsbCwgMil9YCk7XG4gICAgY29uc29sZS5kZWJ1ZyhgbWQ1U3RyaW5nOiAke21kNVN0cmluZy5zcGxpdCgnLCcpLmpvaW4oJyxcXG4nKX1gKTtcbiAgICBhd2FpdCB3b3JrZXJNYW5hZ2VyLnJ1blRhc2soJ2J1aWxkLWVuZ2luZScsICdidWlsZEVuZ2luZUNvbW1hbmQnLCBbYnVpbGRPcHRpb25zXSwgbG9nRGVzdCk7XG4gICAgLy8gYXdhaXQgYnVpbGRFbmdpbmVDb21tYW5kKGJ1aWxkT3B0aW9ucyk7XG5cbiAgICBhd2FpdCBvdXRwdXRDYWNoZUpzb24ob3B0aW9ucywgb3V0cHV0KTtcbiAgICB3b3JrZXJNYW5hZ2VyLmtpbGwoJ2J1aWxkLWVuZ2luZScpO1xuXG4gICAgY29uc29sZS5kZWJ1ZyhgYnVpbGQgZW5naW5lIGRvbmU6IG91dHB1dDogJHtvdXRwdXR9YCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBvdXRwdXQsXG4gICAgICAgIG1ldGFGaWxlLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZFNwbGl0RW5naW5lKG9wdGlvbnM6IElCdWlsZFNlcGFyYXRlRW5naW5lT3B0aW9ucywgbG9nRGVzdD86IHN0cmluZyk6IFByb21pc2U8SUJ1aWxkU2VwYXJhdGVFbmdpbmVSZXN1bHQ+IHtcbiAgICAvLyDlvJXmk47nvJbor5Hnm67liY3nvJbor5HlhoXlrZjljaDnlKjovoPlpKfvvIzpnIDopoHni6znq4vov5vnqIvnrqHnkIZcbiAgICBhd2FpdCB3b3JrZXJNYW5hZ2VyLnJlZ2lzdGVyVGFzayh7XG4gICAgICAgIG5hbWU6ICdidWlsZC1lbmdpbmUnLFxuICAgICAgICBwYXRoOiBqb2luKF9fZGlybmFtZSwgJy4vYnVpbGQtZW5naW5lJyksXG4gICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IHdvcmtlck1hbmFnZXIucnVuVGFzaygnYnVpbGQtZW5naW5lJywgJ2J1aWxkU2VwYXJhdGVFbmdpbmUnLCBbb3B0aW9uc10sIGxvZ0Rlc3QpO1xuICAgIC8vIHJldHVybiBhd2FpdCBidWlsZFNlcGFyYXRlRW5naW5lKG9wdGlvbnMpO1xufVxuLyoqXG4gKiDpqozor4HnvJPlrZjlvJXmk47nmoTmnInmlYjmgKfjgIJcbiAqIEBwYXJhbSBjYWNoZSDlvJXmk47nvJPlrZjot6/lvoTjgIJcbiAqIEBwYXJhbSBpbmNyZW1lbnRhbEZpbGUg5aKe6YeP5paH5Lu244CCXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlQ2FjaGUoY2FjaGU6IHN0cmluZywgaW5jcmVtZW50YWxGaWxlOiBzdHJpbmcpIHtcbiAgICBpZiAoIWF3YWl0IGZzLnBhdGhFeGlzdHMoY2FjaGUpKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYEVuZ2luZSBjYWNoZSAoJHtjYWNoZX0pIGRvZXMgbm90IGV4aXN0LmApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHplcm9DaGVjayA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZmcoJyoqLyouanMnLCB7XG4gICAgICAgICAgICBjd2Q6IGNhY2hlLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbGVzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgemVyb0NoZWNrID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggeyB9XG5cbiAgICBpZiAoIXplcm9DaGVjaykge1xuICAgICAgICBjb25zb2xlLndhcm4oYEVuZ2luZSBjYWNoZSBkaXJlY3Rvcnkoe2xpbmsoJHtjYWNoZX0pfSkgZXhpc3RzIGJ1dCBoYXMgZW1wdHkgY29udGVudC4gSXQncyBhYm5vcm1hbC5gKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChhd2FpdCBjY0J1aWxkLmJ1aWxkRW5naW5lLmlzU291cmNlQ2hhbmdlZChpbmNyZW1lbnRhbEZpbGUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaXNWYWxpZE1ldGEobWV0YUZpbGU6IHN0cmluZykge1xuICAgIGlmICghYXdhaXQgcGF0aEV4aXN0cyhtZXRhRmlsZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBleHBvcnRNZXRhOiB1bmtub3duO1xuICAgIHRyeSB7XG4gICAgICAgIGV4cG9ydE1ldGEgPSBhd2FpdCBmcy5yZWFkSnNvbihtZXRhRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGV4cG9ydE1ldGEgIT09ICdvYmplY3QnIHx8IGV4cG9ydE1ldGEgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cG9ydHMgPSAoZXhwb3J0TWV0YSBhcyB7IGV4cG9ydHM/OiB1bmtub3duIH0pLmV4cG9ydHM7XG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbWFuZ2xlQ29uZmlnSnNvblBhdGggPSBqb2luKGJ1aWxkZXJDb25maWcucHJvamVjdFJvb3QsICdlbmdpbmUtbWFuZ2xlLWNvbmZpZy5qc29uJyk7XG4gICAgaWYgKGF3YWl0IGZzLnBhdGhFeGlzdHMobWFuZ2xlQ29uZmlnSnNvblBhdGgpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRNYW5nbGVDb25maWdKc29uTXRpbWUgPSAoYXdhaXQgZnMuc3RhdChtYW5nbGVDb25maWdKc29uUGF0aCkpLm10aW1lTXM7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRNYW5nbGVDb25maWdKc29uUmVhZGFibGVUaW1lID0gbmV3IERhdGUoY3VycmVudE1hbmdsZUNvbmZpZ0pzb25NdGltZSkudG9Mb2NhbGVTdHJpbmcoKTtcbiAgICAgICAgY29uc3Qgb2xkTWFuZ2xlQ29uZmlnSnNvbk10aW1lID0gKGV4cG9ydE1ldGEgYXMgeyBtYW5nbGVDb25maWdKc29uTXRpbWU/OiBudW1iZXIgfSkubWFuZ2xlQ29uZmlnSnNvbk10aW1lO1xuICAgICAgICBjb25zdCBvbGRNYW5nbGVDb25maWdKc29uUmVhZGFibGVUaW1lID0gb2xkTWFuZ2xlQ29uZmlnSnNvbk10aW1lICE9PSB1bmRlZmluZWQgPyBuZXcgRGF0ZShvbGRNYW5nbGVDb25maWdKc29uTXRpbWUpLnRvTG9jYWxlU3RyaW5nKCkgOiAwO1xuICAgICAgICBpZiAoY3VycmVudE1hbmdsZUNvbmZpZ0pzb25NdGltZSAhPT0gb2xkTWFuZ2xlQ29uZmlnSnNvbk10aW1lKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBlbmdpbmUtbWFuZ2xlLWNvbmZpZy5qc29uIG10aW1lIGNoYW5nZWQ6IG5vdzogJHtjdXJyZW50TWFuZ2xlQ29uZmlnSnNvblJlYWRhYmxlVGltZX0gIT09IG9sZDogJHtvbGRNYW5nbGVDb25maWdKc29uUmVhZGFibGVUaW1lfWApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgZW5naW5lLW1hbmdsZS1jb25maWcuanNvbiBtdGltZSBpc24ndCBjaGFuZ2VkOiBub3c6ICR7Y3VycmVudE1hbmdsZUNvbmZpZ0pzb25SZWFkYWJsZVRpbWV9ID09PSBvbGQ6ICR7b2xkTWFuZ2xlQ29uZmlnSnNvblJlYWRhYmxlVGltZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjYWxjTWQ1U3RyaW5nKGNvbmZpZzogSUJ1aWxkRW5naW5lUGFyYW0sIGtleXM6IHJlYWRvbmx5IHN0cmluZ1tdKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMgYXMgKGtleW9mIElCdWlsZEVuZ2luZVBhcmFtKVtdKSB7XG4gICAgICAgIHN0ciArPSBgJHtrZXl9PSR7SlNPTi5zdHJpbmdpZnkoY29uZmlnW2tleV0pfSxgO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuXG4vKipcbiAqIOeUn+aIkOW8leaTjuaWh+S7tuWSjOWvueW6lOeahCBtYXAg5paH5Lu2XG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQHBhcmFtIG91dHB1dFxuICovXG5hc3luYyBmdW5jdGlvbiBvdXRwdXRDYWNoZUpzb24ob3B0aW9uczogSUJ1aWxkRW5naW5lUGFyYW0sIG91dHB1dDogc3RyaW5nKSB7XG4gICAgY29uc3QgZGVzdCA9IGpvaW4oZGlybmFtZShvdXRwdXQpLCBgJHtFbmdpbmVDYWNoZU5hbWV9Lmpzb25gKTtcbiAgICBsZXQgZGF0YTogYW55ID0ge307XG4gICAgaWYgKGF3YWl0IHBhdGhFeGlzdHMoZGVzdCkpIHtcbiAgICAgICAgZGF0YSA9IGF3YWl0IHJlYWRKc29uKGRlc3QpO1xuICAgIH1cbiAgICBkYXRhID0gZGF0YSB8fCB7fTtcbiAgICBjb25zdCBoYXNoTmFtZSA9IGJhc2VuYW1lKG91dHB1dCk7XG4gICAgZGF0YVtoYXNoTmFtZV0gPSBvcHRpb25zO1xuICAgIGF3YWl0IG91dHB1dEpTT04oZGVzdCwgZGF0YSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUVuZ2luZUltcG9ydE1hcChcbiAgICBtZXRhUGF0aDogc3RyaW5nLCBlbmdpbmVQYXRoOiBzdHJpbmcsXG4gICAgaW1wb3J0TWFwRGlyOiBzdHJpbmcsXG4gICAgYmFzZVVybD86IHN0cmluZykge1xuICAgIGxldCBleHBvcnRNZXRhOiBjY0J1aWxkLmJ1aWxkRW5naW5lLlJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgICBleHBvcnRNZXRhID0gYXdhaXQgZnMucmVhZEpzb24obWV0YVBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byByZWFkIGVuZ2luZSBleHBvcnQgbWV0YSwgZW5naW5lIG1pZ2h0IG5vdCBoYXZlIGJlZW4gYnVpbGQgY29ycmVjdGx5OiAke2Vycn1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlVXJsT2JqID0gYmFzZVVybCA/IG5ldyBVUkwoYmFzZVVybCkgOiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBnZXRJbXBvcnRVUkwgPSAobW9kdWxlRmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGxldCBpbXBvcnRVcmw6IHN0cmluZztcbiAgICAgICAgaWYgKGJhc2VVcmxPYmopIHtcbiAgICAgICAgICAgIGltcG9ydFVybCA9IG5ldyBVUkwobW9kdWxlRmlsZSwgYmFzZVVybE9iaikuaHJlZjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGltcG9ydFVybCA9IGAuLyR7cmVsYXRpdmVVcmwoaW1wb3J0TWFwRGlyLCBwcy5qb2luKGVuZ2luZVBhdGgsIG1vZHVsZUZpbGUpKX1gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbXBvcnRVcmw7XG4gICAgfTtcblxuICAgIGNvbnN0IGltcG9ydE1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGZvciAoY29uc3QgW21vZHVsZU5hbWUsIG1vZHVsZUZpbGVdIG9mIE9iamVjdC5lbnRyaWVzKGV4cG9ydE1ldGEuZXhwb3J0cykpIHtcbiAgICAgICAgLy8gaW1wb3J0TWFwLmltcG9ydHNbbW9kdWxlTmFtZV0gPSBnZXRJbXBvcnRVUkwobW9kdWxlRmlsZSk7XG4gICAgICAgIGltcG9ydE1hcFttb2R1bGVOYW1lXSA9IGdldEltcG9ydFVSTChtb2R1bGVGaWxlKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFthbGlhcywgbW9kdWxlRmlsZV0gb2YgT2JqZWN0LmVudHJpZXMoZXhwb3J0TWV0YS5jaHVua0FsaWFzZXMpKSB7XG4gICAgICAgIC8vIGltcG9ydE1hcC5pbXBvcnRzW2FsaWFzXSA9IGdldEltcG9ydFVSTChtb2R1bGVGaWxlKTtcbiAgICAgICAgaW1wb3J0TWFwW2FsaWFzXSA9IGdldEltcG9ydFVSTChtb2R1bGVGaWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIGltcG9ydE1hcDtcbn1cbiJdfQ==