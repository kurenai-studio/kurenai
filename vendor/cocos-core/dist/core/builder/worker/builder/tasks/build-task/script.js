'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.title = void 0;
exports.handle = handle;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const script_1 = require("../../asset-handler/script");
const engine_1 = require("../../asset-handler/script/engine");
const utils_1 = require("../../utils");
const console_1 = require("../../../../../base/console");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
exports.title = 'i18n:builder.tasks.build_script';
const scriptWorkerLogDestKey = '__cocosBuildLogDest';
async function handle(options, result, cache) {
    console_1.newConsole.trackTimeStart('builder:build-script-total');
    const polyfills = {
        ...(options.polyfills || {}),
        [scriptWorkerLogDestKey]: options.logDest,
    };
    const hasPolyFill = await script_1.ScriptBuilder.buildPolyfills(polyfills, result.paths.polyfillsJs);
    if (!hasPolyFill) {
        delete result.paths.polyfillsJs;
    }
    this.updateProcess('Generate systemJs...');
    await script_1.ScriptBuilder.buildSystemJs({
        dest: result.paths.systemJs,
        sourceMaps: options.sourceMaps,
        debug: options.debug,
        platform: options.platform,
        hotModuleReload: options.buildScriptParam.hotModuleReload,
        [scriptWorkerLogDestKey]: options.logDest,
    });
    // 编译 bundle 项目脚本
    const buildProjectScriptRes = await this.bundleManager.buildScript();
    if (buildProjectScriptRes) {
        if (buildProjectScriptRes.scriptPackages) {
            result.scriptPackages.push(...buildProjectScriptRes.scriptPackages);
        }
        // TODO Bundle 的脚本构建不应该依赖 importmap
        if (buildProjectScriptRes.importMappings) {
            Object.assign(result.importMap.imports, buildProjectScriptRes.importMappings);
        }
    }
    if (!options.buildEngineParam.skip) {
        options.buildEngineParam.targets = options.buildScriptParam.targets;
        options.buildEngineParam.flags = options.buildScriptParam.flags;
        // 兼容旧版本
        if (options.buildEngineParam.platform && !options.buildEngineParam.platformType) {
            options.buildEngineParam.platformType = options.buildEngineParam.platform;
        }
        // 编译引擎
        this.updateProcess(`${i18n_1.default.t('builder.tasks.build_engine')} start...`);
        const { separateEngineOptions } = options.buildEngineParam;
        let useSeparateEngine = !!separateEngineOptions;
        console_1.newConsole.trackTimeStart('builder:build-engine');
        if (useSeparateEngine && separateEngineOptions) {
            const res = await (0, engine_1.buildSplitEngine)({
                ...options.buildEngineParam,
                ...separateEngineOptions,
                platform: options.platform,
                engine: options.buildEngineParam.entry,
                importMapOutFile: result.paths.importMap,
                useCacheForce: true,
            }, options.logDest);
            result.paths.engineMeta = res.paths.meta;
            Object.assign(result.importMap.imports, res.importMap);
            result.separateEngineResult = res;
        }
        else {
            const { metaFile } = await (0, engine_1.buildEngineX)(options.buildEngineParam, script_1.ScriptBuilder.projectOptions.ccEnvConstants, options.logDest);
            result.paths.engineMeta = metaFile;
            const importMaps = await (0, engine_1.queryEngineImportMap)(metaFile, options.buildEngineParam.output, (0, path_1.dirname)(result.paths.importMap));
            Object.assign(result.importMap.imports, importMaps);
        }
        const buildEngineTime = await console_1.newConsole.trackTimeEnd('builder:build-engine');
        this.updateProcess(`${i18n_1.default.t('builder.tasks.build_engine')} in (${buildEngineTime} ms) √`);
    }
    this.updateProcess(`Copy plugin script ...`);
    // ---- 拷贝插件脚本 ----
    for (const pluginInfo of result.pluginScripts) {
        const url = (0, utils_1.removeDbHeader)(pluginInfo.url);
        const output = (0, path_1.join)(result.paths.dir, 'src', url);
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(output));
        (0, fs_extra_1.copyFileSync)(pluginInfo.file, output);
        result.paths.plugins[pluginInfo.uuid] = output;
    }
    // 生成 import-map
    this.updateProcess('Generate import-map...');
    await script_1.ScriptBuilder.outputImportMap(result.importMap, {
        dest: result.paths.importMap,
        importMapFormat: options.buildScriptParam.importMapFormat,
        debug: options.debug,
    });
}
