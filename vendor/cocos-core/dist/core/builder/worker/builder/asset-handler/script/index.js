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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvc2NyaXB0L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRWIsK0JBQXFDO0FBQ3JDLGlFQUEyRTtBQUUzRSx1Q0FBNEQ7QUFDNUQsbUZBQTBFO0FBQzFFLCtEQUFnRTtBQUNoRSxtREFBcUM7QUFDckMsbUVBQStDO0FBSy9DLGtEQUF1RDtBQUN2RCx5RUFBOEM7QUFDOUMsa0RBQStDO0FBRS9DLHVDQUEyQztBQUMzQyxxRUFBNkM7QUFDN0MsaUVBQStEO0FBZ0IvRCxNQUFNLHVCQUF1QixHQUFHLElBQUksT0FBTyxFQUE4QixDQUFDO0FBQzFFLE1BQU0sc0JBQXNCLEdBQUcscUJBQXFCLENBQUM7QUFFckQsU0FBUyxzQkFBc0IsQ0FBQyxPQUFnQjtJQUM1QyxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzFDLE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFDRCxPQUFRLE9BQThDLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUNuRixDQUFDO0FBRUQsTUFBYSxhQUFhO0lBRXRCLGNBQWMsQ0FBa0I7SUFDaEMsaUJBQWlCLENBQW9CO0lBRXJDLGlCQUFpQjtJQUNWLGNBQWMsR0FBYSxFQUFFLENBQUM7SUFFckMsTUFBTSxDQUFDLGNBQWMsQ0FBdUI7SUFFNUMsZUFBZSxDQUFDLE9BQTREO1FBQ3hFLG9CQUFvQjtRQUNwQixNQUFNLGdCQUFnQixHQUFxQixFQUFFLENBQUM7UUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLENBQUM7WUFDdEQsQ0FBQyxnQkFBZ0Is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LENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxlQUFlO3FCQUMvRDtpQkFDSixDQUFDO1NBQ0wsQ0FBQyxDQUFDLEVBQUUsSUFBSyxDQUFDO0lBQ2YsQ0FBQztJQUNELE9BQU87UUFDSCxTQUFTO1FBQ1QsT0FBTztLQUNWLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBDQ0VudkNvbnN0YW50cywgZ2V0Q0NFbnZDb25zdGFudHMgfSBmcm9tICcuL2J1aWxkLXRpbWUtY29uc3RhbnRzJztcbmltcG9ydCB7IGJ1aWxkU2NyaXB0Q29tbWFuZCwgYnVpbGRTeXN0ZW1Kc0NvbW1hbmQsIElCdWlsZFNjcmlwdEZ1bmN0aW9uT3B0aW9uLCBUcmFuc2Zvcm1PcHRpb25zIH0gZnJvbSAnLi9idWlsZC1zY3JpcHQnO1xuaW1wb3J0IHsgZW5zdXJlRGlyLCBwYXRoRXhpc3RzLCB3cml0ZUZpbGUgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyB3b3JrZXJNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vLi4vd29ya2VyLXBvb2xzL3N1Yi1wcm9jZXNzLW1hbmFnZXInO1xuaW1wb3J0IHsgYnVpbGRBc3NldExpYnJhcnkgfSBmcm9tICcuLi8uLi9tYW5hZ2VyL2Fzc2V0LWxpYnJhcnknO1xuaW1wb3J0ICogYXMgYmFiZWwgZnJvbSAnQGJhYmVsL2NvcmUnO1xuaW1wb3J0IGJhYmVsUHJlc2V0RW52IGZyb20gJ0BiYWJlbC9wcmVzZXQtZW52JztcbmltcG9ydCB7IFN0YXRzUXVlcnkgfSBmcm9tICdAY29jb3MvY2NidWlsZCc7XG5pbXBvcnQgeyBTaGFyZWRTZXR0aW5ncyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL3NjcmlwdGluZy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgSVBvbHlGaWxscywgSUJ1aWxkU3lzdGVtSnNPcHRpb24gfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMnO1xuaW1wb3J0IHsgSW1wb3J0TWFwV2l0aEltcG9ydHMsIElTY3JpcHRPcHRpb25zLCBJSW50ZXJuYWxCdWlsZE9wdGlvbnMsIElJbnRlcm5hbEJ1bmRsZUJ1aWxkT3B0aW9ucywgTW9kdWxlUHJlc2VydmF0aW9uLCBJQnVuZGxlLCBJQXNzZXRJbmZvLCBJbXBvcnRNYXAsIElJbXBvcnRNYXBPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBhc3NldERCTWFuYWdlciB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2Fzc2V0cyc7XG5pbXBvcnQgc2NyaXB0IGZyb20gJy4uLy4uLy4uLy4uLy4uL3NjcmlwdGluZyc7XG5pbXBvcnQgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9lbmdpbmUnO1xuaW1wb3J0IHsgTWFjcm9JdGVtIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vZW5naW5lL0B0eXBlcy9jb25maWcnO1xuaW1wb3J0IHsgY29tcHJlc3NVdWlkIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHByb2plY3QgZnJvbSAnLi4vLi4vLi4vLi4vLi4vcHJvamVjdCc7XG5pbXBvcnQgeyBydW5TdGF0aWNDb21waWxlQ2hlY2sgfSBmcm9tICcuL3N0YXRpYy1jb21waWxlLWNoZWNrJztcbmltcG9ydCB7IEJ1aWxkRXhpdENvZGUgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbnR5cGUgUGxhdGZvcm1UeXBlID0gU3RhdHNRdWVyeS5Db25zdGFudE1hbmFnZXIuUGxhdGZvcm1UeXBlO1xuXG5pbnRlcmZhY2UgSVNjcmlwdFByb2plY3RPcHRpb24gZXh0ZW5kcyBTaGFyZWRTZXR0aW5ncyB7XG4gICAgY2NFbnZDb25zdGFudHM6IENDRW52Q29uc3RhbnRzO1xuICAgIGRiSW5mb3M6IHsgZGJJRDogc3RyaW5nOyB0YXJnZXQ6IHN0cmluZyB9W107XG4gICAgY3VzdG9tTWFjcm9MaXN0OiBNYWNyb0l0ZW1bXTtcbn1cblxuaW50ZXJmYWNlIEltcG9ydE1hcE9wdGlvbnMge1xuICAgIGRhdGE6IEltcG9ydE1hcFdpdGhJbXBvcnRzO1xuICAgIGZvcm1hdD86ICdjb21tb25qcycgfCAnZXNtJztcbiAgICBvdXRwdXQ6IHN0cmluZztcbn1cblxuY29uc3Qgc2NyaXB0QnVpbGRlckxvZ0Rlc3RNYXAgPSBuZXcgV2Vha01hcDxvYmplY3QsIHN0cmluZyB8IHVuZGVmaW5lZD4oKTtcbmNvbnN0IHNjcmlwdFdvcmtlckxvZ0Rlc3RLZXkgPSAnX19jb2Nvc0J1aWxkTG9nRGVzdCc7XG5cbmZ1bmN0aW9uIGdldFNjcmlwdFdvcmtlckxvZ0Rlc3Qob3B0aW9uczogdW5rbm93bikge1xuICAgIGlmICghb3B0aW9ucyB8fCB0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIChvcHRpb25zIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD4pW3NjcmlwdFdvcmtlckxvZ0Rlc3RLZXldO1xufVxuXG5leHBvcnQgY2xhc3MgU2NyaXB0QnVpbGRlciB7XG5cbiAgICBfc2NyaXB0T3B0aW9ucyE6IElTY3JpcHRPcHRpb25zO1xuICAgIF9pbXBvcnRNYXBPcHRpb25zITogSW1wb3J0TWFwT3B0aW9ucztcblxuICAgIC8vIOiEmuacrOi1hOa6kOWMheWIhue7hO+8iOWtkOWMhS/liIbljIXvvIlcbiAgICBwdWJsaWMgc2NyaXB0UGFja2FnZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBzdGF0aWMgcHJvamVjdE9wdGlvbnM6IElTY3JpcHRQcm9qZWN0T3B0aW9uO1xuXG4gICAgaW5pdFRhc2tPcHRpb25zKG9wdGlvbnM6IElJbnRlcm5hbEJ1aWxkT3B0aW9ucyB8IElJbnRlcm5hbEJ1bmRsZUJ1aWxkT3B0aW9ucykge1xuICAgICAgICAvLyBUT0RPIOatpOWkhOmFjee9ruW6lOivpeWcqOWklumDqOaVtOWQiOWlvVxuICAgICAgICBjb25zdCB0cmFuc2Zvcm1PcHRpb25zOiBUcmFuc2Zvcm1PcHRpb25zID0ge307XG4gICAgICAgIGlmICghb3B0aW9ucy5idWlsZFNjcmlwdFBhcmFtLnBvbHlmaWxscz8uYXN5bmNGdW5jdGlvbnMpIHtcbiAgICAgICAgICAgICh0cmFuc2Zvcm1PcHRpb25zLmV4Y2x1ZGVzID8/ICh0cmFuc2Zvcm1PcHRpb25zLmV4Y2x1ZGVzID0gW10pKS5wdXNoKCd0cmFuc2Zvcm0tcmVnZW5lcmF0b3InKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5idWlsZFNjcmlwdFBhcmFtLnRhcmdldHMpIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybU9wdGlvbnMudGFyZ2V0cyA9IG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS50YXJnZXRzO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1vZHVsZVByZXNlcnZhdGlvbjogTW9kdWxlUHJlc2VydmF0aW9uID0gJ2ZhY2FkZSc7XG4gICAgICAgIGlmIChvcHRpb25zLmJ1aWxkU2NyaXB0UGFyYW0uZXhwZXJpbWVudGFsRXJhc2VNb2R1bGVzKSB7XG4gICAgICAgICAgICBtb2R1bGVQcmVzZXJ2YXRpb24gPSAnZXJhc2UnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhvdE1vZHVsZVJlbG9hZCA9IG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5ob3RNb2R1bGVSZWxvYWQgPz8gZmFsc2U7XG4gICAgICAgIGlmIChob3RNb2R1bGVSZWxvYWQpIHtcbiAgICAgICAgICAgIG1vZHVsZVByZXNlcnZhdGlvbiA9ICdwcmVzZXJ2ZSc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JpcHRPcHRpb25zOiBJU2NyaXB0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIG1vZHVsZVByZXNlcnZhdGlvbixcbiAgICAgICAgICAgIGRlYnVnOiBvcHRpb25zLmRlYnVnLFxuICAgICAgICAgICAgc291cmNlTWFwczogb3B0aW9ucy5zb3VyY2VNYXBzLFxuICAgICAgICAgICAgaG90TW9kdWxlUmVsb2FkLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm1PcHRpb25zLFxuICAgICAgICAgICAgbW9kdWxlRm9ybWF0OiAnc3lzdGVtJyxcbiAgICAgICAgICAgIGNvbW1vbkRpcjogb3B0aW9ucy5idWlsZFNjcmlwdFBhcmFtLmNvbW1vbkRpciB8fCAnJywgLy8gVE9ETyDpnIDopoHmlrDnmoTlj4LmlbBcbiAgICAgICAgICAgIGJ1bmRsZUNvbW1vbkNodW5rOiBvcHRpb25zLmJ1aWxkU2NyaXB0UGFyYW0uYnVuZGxlQ29tbW9uQ2h1bmsgPz8gZmFsc2UsXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjcmlwdE9wdGlvbnMsXG4gICAgICAgICAgICBpbXBvcnRNYXBPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiBvcHRpb25zLmJ1aWxkU2NyaXB0UGFyYW0uaW1wb3J0TWFwRm9ybWF0LFxuICAgICAgICAgICAgICAgIGRhdGE6IHsgaW1wb3J0czoge30gfSxcbiAgICAgICAgICAgICAgICBvdXRwdXQ6ICcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0UHJvamVjdE9wdGlvbnMob3B0aW9uczogSUludGVybmFsQnVpbGRPcHRpb25zIHwgSUludGVybmFsQnVuZGxlQnVpbGRPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IHsgc2NyaXB0T3B0aW9ucywgaW1wb3J0TWFwT3B0aW9ucyB9ID0gdGhpcy5pbml0VGFza09wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3NjcmlwdE9wdGlvbnMgPSBzY3JpcHRPcHRpb25zO1xuICAgICAgICB0aGlzLl9pbXBvcnRNYXBPcHRpb25zID0gaW1wb3J0TWFwT3B0aW9ucztcbiAgICAgICAgc2NyaXB0QnVpbGRlckxvZ0Rlc3RNYXAuc2V0KHRoaXMsIG9wdGlvbnMubG9nRGVzdCk7XG4gICAgICAgIGNvbnN0IGNjRW52Q29uc3RhbnRzID0gYXdhaXQgZ2V0Q0NFbnZDb25zdGFudHMoe1xuICAgICAgICAgICAgcGxhdGZvcm06IG9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5wbGF0Zm9ybSxcbiAgICAgICAgICAgIGZsYWdzOiBvcHRpb25zLmJ1aWxkU2NyaXB0UGFyYW0uZmxhZ3MsXG4gICAgICAgIH0sIG9wdGlvbnMuZW5naW5lSW5mby50eXBlc2NyaXB0LnBhdGgpO1xuICAgICAgICBjb25zdCBzaGFyZWRTZXR0aW5ncyA9IGF3YWl0IHNjcmlwdC5xdWVyeVNoYXJlZFNldHRpbmdzKCk7XG4gICAgICAgIC8vIFRPRE8g5LuOIGRiIOafpeivoueahOmDveimgeWwgeijheWcqCBhc3NldC1saWJyYXJ5IOaooeWdl+WGhVxuICAgICAgICBjb25zdCBkYkluZm9zID0gT2JqZWN0LnZhbHVlcyhhc3NldERCTWFuYWdlci5hc3NldERCTWFwKS5tYXAoKGluZm8pID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZGJJRDogaW5mby5vcHRpb25zLm5hbWUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBpbmZvLm9wdGlvbnMudGFyZ2V0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGN1c3RvbU1hY3JvTGlzdCA9IEVuZ2luZS5nZXRDb25maWcoKS5tYWNyb0N1c3RvbTtcbiAgICAgICAgU2NyaXB0QnVpbGRlci5wcm9qZWN0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGN1c3RvbU1hY3JvTGlzdCxcbiAgICAgICAgICAgIGRiSW5mb3MsXG4gICAgICAgICAgICBjY0VudkNvbnN0YW50cyxcbiAgICAgICAgICAgIC4uLnNoYXJlZFNldHRpbmdzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGJ1aWxkQnVuZGxlU2NyaXB0KGJ1bmRsZXM6IElCdW5kbGVbXSkge1xuICAgICAgICBjb25zdCBzY3JpcHRCdW5kbGVzOiBBcnJheTx7IGlkOiBzdHJpbmcsIHNjcmlwdHM6IElBc3NldEluZm9bXSwgb3V0RmlsZTogc3RyaW5nIH0+ID0gW107XG4gICAgICAgIGNvbnN0IHV1aWRDb21wcmVzc01hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgICBidW5kbGVzLmZvckVhY2goKGJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFidW5kbGUub3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnVuZGxlLmNvbmZpZy5oYXNQcmVsb2FkU2NyaXB0ID0gIXRoaXMuX3NjcmlwdE9wdGlvbnMuaG90TW9kdWxlUmVsb2FkO1xuICAgICAgICAgICAgc2NyaXB0QnVuZGxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBpZDogYnVuZGxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc2NyaXB0czogYnVuZGxlLnNjcmlwdHMubWFwKCh1dWlkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWRDb21wcmVzc01hcFt1dWlkXSA9IGNvbXByZXNzVXVpZCh1dWlkLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldEluZm8odXVpZCk7XG4gICAgICAgICAgICAgICAgfSkuc29ydCgoYSwgYikgPT4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSksXG4gICAgICAgICAgICAgICAgb3V0RmlsZTogYnVuZGxlLnNjcmlwdERlc3QsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFzY3JpcHRCdW5kbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW3NjcmlwdF0gbm8gc2NyaXB0IHRvIGJ1aWxkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmiafooYzpnZnmgIHnvJbor5Hmo4Dmn6VcbiAgICAgICAgLy8g5rOo5oSP77ya5aaC5p6c5ZyoIEJ1aWxkQ29tbWFuZCDkuK3lt7Lnu4/miafooYzov4fvvIzov5nph4zkvJrph43lpI3miafooYzjgIJcbiAgICAgICAgLy8g5L2G5Li65LqG56Gu5L+d6ISa5pys57yW6K+R55qE5a6J5YWo5oCn77yM6L+Z6YeM5by65Yi25qOA5p+l44CCXG4gICAgICAgIC8vIOS8oOWFpSB0ZW1wL3RzY29uZmlnLmNvY29zLmpzb27vvIzpgb/lhY3kvb/nlKjmoLnnm67lvZUgdHNjb25maWcg5a+86Ie06YeN5aSN5YyF5ZCrIGQudHNcbiAgICAgICAgY29uc3QgdHNjb25maWdQYXRoID0gam9pbihwcm9qZWN0LnBhdGgsICd0ZW1wJywgJ3RzY29uZmlnLmNvY29zLmpzb24nKTtcbiAgICAgICAgY29uc3QgY2hlY2tSZXN1bHQgPSBhd2FpdCBydW5TdGF0aWNDb21waWxlQ2hlY2socHJvamVjdC5wYXRoLCB0cnVlLCB0c2NvbmZpZ1BhdGgpO1xuICAgICAgICBpZiAoIWNoZWNrUmVzdWx0LnBhc3NlZCkge1xuICAgICAgICAgICAgLy8g5p6E5bu65aSx6LSl77yM5oqb5Ye66ZSZ6K+v77yM6ZSZ6K+v56CB5Li6IDUwMFxuICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gY2hlY2tSZXN1bHQuZXJyb3JNZXNzYWdlIHx8ICdGb3VuZCBhc3NldHMtcmVsYXRlZCBUeXBlU2NyaXB0IGVycm9ycyc7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgICAgICAgKGVycm9yIGFzIGFueSkuY29kZSA9IEJ1aWxkRXhpdENvZGUuU1RBVElDX0NPTVBJTEVfRVJST1I7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgY2NlTW9kdWxlTWFwID0gc2NyaXB0LnF1ZXJ5Q0NFTW9kdWxlTWFwKCk7XG4gICAgICAgIGNvbnN0IGJ1aWxkU2NyaXB0T3B0aW9uczogSUJ1aWxkU2NyaXB0RnVuY3Rpb25PcHRpb24gJiBTaGFyZWRTZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIC4uLnRoaXMuX3NjcmlwdE9wdGlvbnMsXG4gICAgICAgICAgICAuLi5TY3JpcHRCdWlsZGVyLnByb2plY3RPcHRpb25zLFxuICAgICAgICAgICAgYnVuZGxlczogc2NyaXB0QnVuZGxlcyxcbiAgICAgICAgICAgIHV1aWRDb21wcmVzc01hcCxcbiAgICAgICAgICAgIGFwcGxpY2F0aW9uSlM6ICcnLFxuICAgICAgICAgICAgY2NlTW9kdWxlTWFwLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOmhueebruiEmuacrOe8luivkeebruWJjee8luivkeWGheWtmOWNoOeUqOi+g+Wkp++8jOmcgOimgeeLrOeri+i/m+eoi+euoeeQhlxuICAgICAgICBhd2FpdCB3b3JrZXJNYW5hZ2VyLnJlZ2lzdGVyVGFzayh7XG4gICAgICAgICAgICBuYW1lOiAnYnVpbGQtc2NyaXB0JyxcbiAgICAgICAgICAgIHBhdGg6IGpvaW4oX19kaXJuYW1lLCAnLi9idWlsZC1zY3JpcHQnKSxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBjd2Q6IHByb2plY3QucGF0aCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHdvcmtlck1hbmFnZXIucnVuVGFzaygnYnVpbGQtc2NyaXB0JywgJ2J1aWxkU2NyaXB0Q29tbWFuZCcsIFtidWlsZFNjcmlwdE9wdGlvbnNdLCBzY3JpcHRCdWlsZGVyTG9nRGVzdE1hcC5nZXQodGhpcykpO1xuICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICBpZiAocmVzLnNjcmlwdFBhY2thZ2VzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JpcHRQYWNrYWdlcy5wdXNoKC4uLnJlcy5zY3JpcHRQYWNrYWdlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzLmltcG9ydE1hcHBpbmdzKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLl9pbXBvcnRNYXBPcHRpb25zLmRhdGEuaW1wb3J0cywgcmVzLmltcG9ydE1hcHBpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHdvcmtlck1hbmFnZXIua2lsbCgnYnVpbGQtc2NyaXB0Jyk7XG5cbiAgICAgICAgY29uc29sZS5kZWJ1ZygnQ29weSBleHRlcm5hbFNjcmlwdHMgc3VjY2VzcyEnKTtcblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIHN0YXRpYyBhc3luYyBidWlsZFBvbHlmaWxscyhvcHRpb25zOiBJUG9seUZpbGxzID0ge30sIGRlc3Q6IHN0cmluZykge1xuICAgICAgICBhd2FpdCB3b3JrZXJNYW5hZ2VyLnJlZ2lzdGVyVGFzayh7XG4gICAgICAgICAgICBuYW1lOiAnYnVpbGQtc2NyaXB0JyxcbiAgICAgICAgICAgIHBhdGg6IGpvaW4oX19kaXJuYW1lLCAnLi9idWlsZC1zY3JpcHQnKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhd2FpdCB3b3JrZXJNYW5hZ2VyLnJ1blRhc2soJ2J1aWxkLXNjcmlwdCcsICdidWlsZFBvbHlmaWxsc0NvbW1hbmQnLCBbb3B0aW9ucywgZGVzdF0sIGdldFNjcmlwdFdvcmtlckxvZ0Rlc3Qob3B0aW9ucykpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhc3luYyBidWlsZFN5c3RlbUpzKG9wdGlvbnM6IElCdWlsZFN5c3RlbUpzT3B0aW9uKSB7XG4gICAgICAgIGF3YWl0IHdvcmtlck1hbmFnZXIucmVnaXN0ZXJUYXNrKHtcbiAgICAgICAgICAgIG5hbWU6ICdidWlsZC1zY3JpcHQnLFxuICAgICAgICAgICAgcGF0aDogam9pbihfX2Rpcm5hbWUsICcuL2J1aWxkLXNjcmlwdCcpLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHdvcmtlck1hbmFnZXIucnVuVGFzaygnYnVpbGQtc2NyaXB0JywgJ2J1aWxkU3lzdGVtSnNDb21tYW5kJywgW29wdGlvbnNdLCBnZXRTY3JpcHRXb3JrZXJMb2dEZXN0KG9wdGlvbnMpKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXN5bmMgb3V0cHV0SW1wb3J0TWFwKGltcG9ydE1hcDogSW1wb3J0TWFwLCBvcHRpb25zOiBJSW1wb3J0TWFwT3B0aW9ucykge1xuICAgICAgICBjb25zdCB7IGNvbnRlbnQgfSA9IGF3YWl0IHRyYW5zZm9ybUltcG9ydE1hcChpbXBvcnRNYXAsIG9wdGlvbnMpO1xuICAgICAgICBhd2FpdCBlbnN1cmVEaXIoZGlybmFtZShvcHRpb25zLmRlc3QpKTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKG9wdGlvbnMuZGVzdCwgY29udGVudCwge1xuICAgICAgICAgICAgZW5jb2Rpbmc6ICd1dGY4JyxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1JbXBvcnRNYXAoaW1wb3J0TWFwOiBJbXBvcnRNYXAsIG9wdGlvbnM6IElJbXBvcnRNYXBPcHRpb25zKSB7XG4gICAgY29uc3QgeyBpbXBvcnRNYXBGb3JtYXQgfSA9IG9wdGlvbnM7XG4gICAgbGV0IGV4dGVuc2lvbjogc3RyaW5nO1xuICAgIGxldCBjb250ZW50ID0gSlNPTi5zdHJpbmdpZnkoaW1wb3J0TWFwLCB1bmRlZmluZWQsIG9wdGlvbnMuZGVidWcgPyAyIDogMCk7XG4gICAgaWYgKGltcG9ydE1hcEZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGV4dGVuc2lvbiA9ICcuanNvbic7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZXh0ZW5zaW9uID0gJy5qcyc7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBgZXhwb3J0IGRlZmF1bHQgJHtjb250ZW50fWA7XG4gICAgICAgIGNvbnRlbnQgPSAoYXdhaXQgYmFiZWwudHJhbnNmb3JtQXN5bmMoY29kZSwge1xuICAgICAgICAgICAgcHJlc2V0czogW1tcbiAgICAgICAgICAgICAgICBiYWJlbFByZXNldEVudiwge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVzOiBpbXBvcnRNYXBGb3JtYXQgPT09ICdlc20nID8gZmFsc2UgOiBpbXBvcnRNYXBGb3JtYXQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF1dLFxuICAgICAgICB9KSk/LmNvZGUhO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBleHRlbnNpb24sXG4gICAgICAgIGNvbnRlbnQsXG4gICAgfTtcbn1cbiJdfQ==