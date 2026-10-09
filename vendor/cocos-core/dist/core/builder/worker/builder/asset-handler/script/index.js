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
exports.ScriptBuilder = void 0;
const path_1 = require("path");
const build_time_constants_1 = require("./build-time-constants");
const fs_extra_1 = require("fs-extra");
const sub_process_manager_1 = require("../../../worker-pools/sub-process-manager");
const asset_library_1 = require("../../manager/asset-library");
const babel = __importStar(require("@babel/core"));
const preset_env_1 = __importDefault(require("@babel/preset-env"));
const assets_1 = require("../../../../../assets");
const scripting_1 = __importDefault(require("../../../../../scripting"));
const engine_1 = require("../../../../../engine");
const utils_1 = require("../../utils");
const project_1 = __importDefault(require("../../../../../project"));
const static_compile_check_1 = require("./static-compile-check");
const scriptBuilderLogDestMap = new WeakMap();
const scriptWorkerLogDestKey = '__cocosBuildLogDest';
function getScriptWorkerLogDest(options) {
    if (!options || typeof options !== 'object') {
        return undefined;
    }
    return options[scriptWorkerLogDestKey];
}
class ScriptBuilder {
    _scriptOptions;
    _importMapOptions;
    // 脚本资源包分组（子包/分包）
    scriptPackages = [];
    static projectOptions;
    initTaskOptions(options) {
        // TODO 此处配置应该在外部整合好
        const transformOptions = {};
        if (!options.buildScriptParam.polyfills?.asyncFunctions) {
            (transformOptions.excludes ?? (transformOptions.excludes = [])).push('transform-regenerator');
        }
        if (options.buildScriptParam.targets) {
            transformOptions.targets = options.buildScriptParam.targets;
        }
        let modulePreservation = 'facade';
        if (options.buildScriptParam.experimentalEraseModules) {
            modulePreservation = 'erase';
        }
        const hotModuleReload = options.buildScriptParam.hotModuleReload ?? false;
        if (hotModuleReload) {
            modulePreservation = 'preserve';
        }
        const scriptOptions = {
            modulePreservation,
            debug: options.debug,
            sourceMaps: options.sourceMaps,
            hotModuleReload,
            transform: transformOptions,
            moduleFormat: 'system',
            commonDir: options.buildScriptParam.commonDir || '', // TODO 需要新的参数
            bundleCommonChunk: options.buildScriptParam.bundleCommonChunk ?? false,
        };
        return {
            scriptOptions,
            importMapOptions: {
                format: options.buildScriptParam.importMapFormat,
                data: { imports: {} },
                output: '',
            },
        };
    }
    async initProjectOptions(options) {
        const { scriptOptions, importMapOptions } = this.initTaskOptions(options);
        this._scriptOptions = scriptOptions;
        this._importMapOptions = importMapOptions;
        scriptBuilderLogDestMap.set(this, options.logDest);
        const ccEnvConstants = await (0, build_time_constants_1.getCCEnvConstants)({
            platform: options.buildScriptParam.platform,
            flags: options.buildScriptParam.flags,
        }, options.engineInfo.typescript.path);
        const sharedSettings = await scripting_1.default.querySharedSettings();
        // TODO 从 db 查询的都要封装在 asset-library 模块内
        const dbInfos = Object.values(assets_1.assetDBManager.assetDBMap).map((info) => {
            return {
                dbID: info.options.name,
                target: info.options.target,
            };
        });
        const customMacroList = engine_1.Engine.getConfig().macroCustom;
        ScriptBuilder.projectOptions = {
            customMacroList,
            dbInfos,
            ccEnvConstants,
            ...sharedSettings,
        };
    }
    async buildBundleScript(bundles) {
        const scriptBundles = [];
        const uuidCompressMap = {};
        bundles.forEach((bundle) => {
            if (!bundle.output) {
                return;
            }
            bundle.config.hasPreloadScript = !this._scriptOptions.hotModuleReload;
            scriptBundles.push({
                id: bundle.name,
                scripts: bundle.scripts.map((uuid) => {
                    uuidCompressMap[uuid] = (0, utils_1.compressUuid)(uuid, false);
                    return asset_library_1.buildAssetLibrary.getAssetInfo(uuid);
                }).sort((a, b) => a.name.localeCompare(b.name)),
                outFile: bundle.scriptDest,
            });
        });
        if (!scriptBundles.length) {
            console.debug('[script] no script to build');
            return;
        }
        // 执行静态编译检查
        // 注意：如果在 BuildCommand 中已经执行过，这里会重复执行。
        // 但为了确保脚本编译的安全性，这里强制检查。
        // 传入 temp/tsconfig.cocos.json，避免使用根目录 tsconfig 导致重复包含 d.ts
        const tsconfigPath = (0, path_1.join)(project_1.default.path, 'temp', 'tsconfig.cocos.json');
        const checkResult = await (0, static_compile_check_1.runStaticCompileCheck)(project_1.default.path, true, tsconfigPath);
        if (!checkResult.passed) {
            // 构建失败，抛出错误，错误码为 500
            const errorMessage = checkResult.errorMessage || 'Found assets-related TypeScript errors';
            const error = new Error(errorMessage);
            error.code = 38 /* BuildExitCode.STATIC_COMPILE_ERROR */;
            throw error;
        }
        const cceModuleMap = scripting_1.default.queryCCEModuleMap();
        const buildScriptOptions = {
            ...this._scriptOptions,
            ...ScriptBuilder.projectOptions,
            bundles: scriptBundles,
            uuidCompressMap,
            applicationJS: '',
            cceModuleMap,
        };
        // 项目脚本编译目前编译内存占用较大，需要独立进程管理
        await sub_process_manager_1.workerManager.registerTask({
            name: 'build-script',
            path: (0, path_1.join)(__dirname, './build-script'),
            options: {
                cwd: project_1.default.path,
            }
        });
        const res = await sub_process_manager_1.workerManager.runTask('build-script', 'buildScriptCommand', [buildScriptOptions], scriptBuilderLogDestMap.get(this));
        if (res) {
            if (res.scriptPackages) {
                this.scriptPackages.push(...res.scriptPackages);
            }
            if (res.importMappings) {
                Object.assign(this._importMapOptions.data.imports, res.importMappings);
            }
        }
        sub_process_manager_1.workerManager.kill('build-script');
        console.debug('Copy externalScripts success!');
        return res;
    }
    static async buildPolyfills(options = {}, dest) {
        await sub_process_manager_1.workerManager.registerTask({
            name: 'build-script',
            path: (0, path_1.join)(__dirname, './build-script'),
        });
        return await sub_process_manager_1.workerManager.runTask('build-script', 'buildPolyfillsCommand', [options, dest], getScriptWorkerLogDest(options));
    }
    static async buildSystemJs(options) {
        await sub_process_manager_1.workerManager.registerTask({
            name: 'build-script',
            path: (0, path_1.join)(__dirname, './build-script'),
        });
        return await sub_process_manager_1.workerManager.runTask('build-script', 'buildSystemJsCommand', [options], getScriptWorkerLogDest(options));
    }
    static async outputImportMap(importMap, options) {
        const { content } = await transformImportMap(importMap, options);
        await (0, fs_extra_1.ensureDir)((0, path_1.dirname)(options.dest));
        await (0, fs_extra_1.writeFile)(options.dest, content, {
            encoding: 'utf8',
        });
    }
}
exports.ScriptBuilder = ScriptBuilder;
async function transformImportMap(importMap, options) {
    const { importMapFormat } = options;
    let extension;
    let content = JSON.stringify(importMap, undefined, options.debug ? 2 : 0);
    if (importMapFormat === undefined) {
        extension = '.json';
    }
    else {
        extension = '.js';
        const code = `export default ${content}`;
        content = (await babel.transformAsync(code, {
            presets: [[
                    preset_env_1.default, {
                        modules: importMapFormat === 'esm' ? false : importMapFormat,
                    },
                ]],
        }))?.code;
    }
    return {
        extension,
        content,
    };
}
