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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineCompiler = void 0;
const quick_compiler_1 = require("@cocos/quick-compiler");
const ccbuild_1 = require("@cocos/ccbuild");
const utils_1 = require("@cocos/lib-programming/dist/utils");
const ps = __importStar(require("path"));
const fsExtra = __importStar(require("fs-extra"));
const VERSION = '3';
const TEMP_ENGINE_CONFIG = { configs: { defaultConfig: { name: '默认配置', cache: { base: { _value: true }, 'gfx-webgl': { _value: true }, 'gfx-webgl2': { _value: false }, 'gfx-webgpu': { _value: false }, animation: { _value: true }, 'skeletal-animation': { _value: true }, '3d': { _value: true }, meshopt: { _value: false }, '2d': { _value: true }, 'sorting-2d': { _value: false }, 'rich-text': { _value: true }, mask: { _value: true }, graphics: { _value: true }, 'ui-skew': { _value: true }, 'affine-transform': { _value: true }, ui: { _value: true }, particle: { _value: true }, physics: { _value: true, _option: 'physics-physx' }, 'physics-ammo': { _value: true, _flags: { LOAD_BULLET_MANUALLY: false } }, 'physics-cannon': { _value: false }, 'physics-physx': { _value: false, _flags: { LOAD_PHYSX_MANUALLY: false } }, 'physics-builtin': { _value: false }, 'physics-2d': { _value: true, _option: 'physics-2d-box2d' }, 'physics-2d-box2d': { _value: true }, 'physics-2d-box2d-wasm': { _value: false, _flags: { LOAD_BOX2D_MANUALLY: false } }, 'physics-2d-builtin': { _value: false }, 'physics-2d-box2d-jsb': { _value: false }, 'intersection-2d': { _value: true }, primitive: { _value: true }, profiler: { _value: true }, 'occlusion-query': { _value: false }, 'geometry-renderer': { _value: false }, 'debug-renderer': { _value: false }, 'particle-2d': { _value: true }, audio: { _value: true }, video: { _value: true }, webview: { _value: true }, tween: { _value: true }, websocket: { _value: true }, 'websocket-server': { _value: false }, terrain: { _value: true }, 'light-probe': { _value: true }, 'tiled-map': { _value: true }, 'vendor-google': { _value: false }, spine: { _value: true, _option: 'spine-3.8' }, 'spine-3.8': { _value: true, _flags: { LOAD_SPINE_MANUALLY: false } }, 'spine-4.2': { _value: false, _flags: { LOAD_SPINE_MANUALLY: false } }, 'dragon-bones': { _value: true }, marionette: { _value: true }, 'procedural-animation': { _value: true }, 'custom-pipeline-post-process': { _value: false }, 'render-pipeline': { _value: true, _option: 'custom-pipeline' }, 'custom-pipeline': { _value: true }, 'legacy-pipeline': { _value: false }, xr: { _value: false } }, flags: { LOAD_BULLET_MANUALLY: false, LOAD_SPINE_MANUALLY: false, LOAD_PHYSX_MANUALLY: false }, includeModules: ['2d', '3d', 'affine-transform', 'animation', 'audio', 'base', 'custom-pipeline', 'dragon-bones', 'gfx-webgl', 'graphics', 'intersection-2d', 'light-probe', 'marionette', 'mask', 'particle', 'particle-2d', 'physics-2d-box2d', 'physics-physx', 'primitive', 'procedural-animation', 'profiler', 'rich-text', 'skeletal-animation', 'spine-3.8', 'terrain', 'tiled-map', 'tween', 'ui', 'ui-skew', 'video', 'websocket', 'webview'], noDeprecatedFeatures: { value: false, version: '' } } }, globalConfigKey: 'defaultConfig', graphics: { pipeline: 'custom-pipeline', 'custom-pipeline-post-process': false } };
class EngineCompiler {
    enginePath;
    busy = false;
    compiler = null;
    editorFeaturesCache = [];
    outDir = '';
    statsQuery = null;
    isWeb;
    constructor(enginePath, isWeb = false) {
        this.enginePath = enginePath;
        this.outDir = ps.join(enginePath, 'bin', '.cache', 'dev-cli');
        this.isWeb = isWeb;
    }
    getOutDir() {
        return this.outDir;
    }
    static create(path, isWeb) {
        return new EngineCompiler(path, isWeb);
    }
    async compile(force = false) {
        // 发布之后不需要编译内置引擎
        // 开始第一次编译引擎
        const versionFile = ps.join(this.outDir, 'VERSION');
        let needClear = false;
        try {
            const version = await fsExtra.readFile(versionFile, 'utf8');
            if (version !== VERSION) {
                needClear = true;
            }
        }
        catch {
            needClear = true;
        }
        this.compiler = await this.generateCompiler({ isWebview: this.isWeb });
        const isNativeScene = false;
        const debugNative = false;
        if (needClear) {
            console.debug('[EditorQuickCompiler]Version information lost.');
            await this.clear();
        }
        else {
            console.debug('[EditorQuickCompiler]Version information looks good.');
        }
        if ((needClear || force) && !process.argv.includes('--no-quick-compile')) {
            await this.rebuild({ isNativeScene, debugNative });
        }
        else {
            console.debug('Note, quick compiler does not get launched.');
        }
        this.statsQuery = this.statsQuery || await ccbuild_1.StatsQuery.create(this.enginePath);
    }
    async generateCompiler(options) {
        const logFile = ps.join(this.enginePath, 'bin', '.cache', 'logs', 'log.txt');
        if (logFile) {
            await fsExtra.ensureDir(ps.dirname(logFile));
        }
        this.statsQuery = this.statsQuery || await ccbuild_1.StatsQuery.create(this.enginePath);
        let allFeatures = this.statsQuery.getFeatures();
        // Spine Hack Begin
        // 先移除 spine 所有版本
        allFeatures = allFeatures.filter((f) => !f.startsWith('spine-'));
        // dev-cli 预览 / 场景编辑器引擎：同时编入 spine-3.8 与 spine-4.2，配合 cc.config.json 的
        // moduleOverrides（SPINE_3_8 && SPINE_4_2 → spine-*-dynamic.ts）实现运行时按 cocos.config.json
        // 选定 spine 版本（改配置 + 硬刷新即生效，无需重编引擎）。两份 spine WASM/asm external 都会被编入。
        // 注意：这里是 dev-cli 引擎编译器，与项目构建引擎（src/core/builder/.../separate-engine.ts）是
        // 两条独立管线；项目构建仍按 includeModules 编译期单版本，产物包体不受影响。
        allFeatures.push('spine-3.8');
        allFeatures.push('spine-4.2');
        // Spine Hack End
        const env = {
            platform: 'NODEJS',
            mode: 'EDITOR',
            flags: {
                DEBUG: true,
            },
        };
        if (options?.isWebview) {
            env.platform = 'HTML5'; // Webview targeting HTML5 platform
        }
        const featureUnitPrefix = 'cce:/internal/x/cc-fu/'; // cc-fu -> cc feature unit
        if (options?.isNative) {
            env.platform = 'NATIVE';
            if (process.platform === 'win32') {
                env.platform = 'WINDOWS';
            }
            else if (process.platform === 'darwin') {
                env.platform = 'MAC';
            }
            else {
                console.error(`Unsupported platform: ${process.platform}`);
            }
            const editorFeatures = await this.filterEngineModules(env, allFeatures);
            this.editorFeaturesCache.push(...editorFeatures);
            const nativeOutDir = ps.join(this.enginePath, 'bin/.editor');
            return new quick_compiler_1.QuickCompiler({
                rootDir: this.enginePath,
                outDir: nativeOutDir,
                platform: env.platform,
                targets: [{
                        featureUnitPrefix,
                        dir: nativeOutDir,
                        format: 'systemjs',
                        targets: 'node 10',
                        loose: true,
                        includeEditorExports: true,
                        includeIndex: {
                            features: editorFeatures,
                        },
                        loader: true,
                    }],
                logFile,
            });
        }
        else {
            const editorFeatures = await this.filterEngineModules(env, allFeatures);
            this.editorFeaturesCache.push(...editorFeatures);
            const outputDir = options?.isWebview ? ps.join(this.outDir, 'web') : ps.join(this.outDir, 'editor');
            return new quick_compiler_1.QuickCompiler({
                rootDir: this.enginePath,
                outDir: outputDir,
                platform: env.platform,
                targets: [
                    {
                        featureUnitPrefix,
                        dir: outputDir,
                        format: 'systemjs',
                        // inlineSourceMap: true,
                        // 使用 indexed source map 加快编译速度：
                        // 见 https://github.com/cocos-creator/3d-tasks/issues/4720
                        // indexedSourceMap: true,
                        usedInElectron509: true,
                        targets: utils_1.editorBrowserslistQuery,
                        includeIndex: {
                            features: editorFeatures,
                        },
                        loader: true, // 编辑器里没有 SystemJS，所以需要生成 loader
                        loose: true, // TODO(cjh): 当前 ccbuild 构建强制使用了 loose 模式且后面一个 preview target 也是强制开启，先把当前 editor target 也开启 loose 模式，临时修复 Though the "loose" option was set to "false" in your @babel/preset-env config ... 问题。后续需要考虑使用项目设置中的「宽松模式」设置选项。
                    },
                ],
                logFile,
            });
        }
    }
    // TODO 目前引擎分离、engine 插件内部都需要这个过滤功能，需要统一复用
    async filterEngineModules(envOptions, features) {
        const engineStatsQuery = await ccbuild_1.StatsQuery.create(this.enginePath);
        const ccEnvConstants = engineStatsQuery.constantManager.genCCEnvConstants(envOptions);
        const envLimitModule = this.queryEnvLimitModule();
        const moduleToFallBack = {};
        Object.keys(envLimitModule).forEach((moduleId) => {
            if (!features.includes(moduleId)) {
                return;
            }
            const { envList, fallback } = envLimitModule[moduleId];
            const enable = envList.some((env) => ccEnvConstants[env]);
            if (enable) {
                return;
            }
            moduleToFallBack[moduleId] = fallback || '';
            if (fallback) {
                features.splice(features.indexOf(moduleId), 1, fallback);
            }
            else {
                features.splice(features.indexOf(moduleId), 1);
            }
        });
        return features;
    }
    async rebuild(options) {
        if (options?.isNativeScene === undefined) {
            options ??= {};
            options.isNativeScene = await this.getIsSceneNative();
            if (options.isNativeScene) {
                options.debugNative = await this.getIsDebugNative();
            }
        }
        if (!this.compiler || (options?.isNativeScene)) {
            await this.compileEngine(this.enginePath, true);
            return;
        }
        if (this.busy) {
            console.error('Compile engine fails: The compilation is in progress');
            return;
        }
        this.busy = true;
        console.log('Start Quick Compile');
        const time = Date.now();
        if (!this.compiler) {
            this.busy = false;
            console.error('Compile engine fails: The compiler does not exist.');
            return;
        }
        try {
            // if (options.isNativeScene) {
            //     await this.rebuildNativeImportMap();
            //     await this.generateEngineAddon(options);
            //     await this.updateAdapter();
            // }
            await this.updateAdapter();
            await this.compiler.build();
            await this.rebuildImportMaps();
            const versionFile = ps.join(this.outDir, 'VERSION');
            await fsExtra.outputFile(versionFile, VERSION, { encoding: 'utf8' });
            // eslint-disable-next-line no-useless-catch
        }
        catch (error) {
            throw error;
        }
        finally {
            console.log('Quick Compile: ' + (Date.now() - time) + 'ms');
            this.busy = false;
        }
    }
    async clear() {
        try {
            const clearPath = ps.join(this.outDir, this.isWeb ? 'web' : 'editor');
            await fsExtra.remove(clearPath);
        }
        catch (error) { }
    }
    async compileEngine(directory, force, options) {
        this.enginePath = directory;
        // this.outDir = join(directory, 'bin', '.cache', 'dev-cli'); // Removed to avoid overriding constructor-init outDir
        // 开始第一次编译引擎
        const versionFile = ps.join(this.outDir, 'VERSION');
        let needClear = false;
        try {
            const version = await fsExtra.readFile(versionFile, 'utf8');
            if (version !== VERSION) {
                needClear = true;
            }
        }
        catch {
            needClear = true;
        }
        this.compiler = await this.generateCompiler({ isWebview: this.isWeb });
        const isNativeScene = options && options.isNativeScene && await this.getIsSceneNative();
        const debugNative = false;
        if (needClear) {
            console.debug('[EditorQuickCompiler] Version information lost.');
            await this.clear();
        }
        else {
            console.debug('[EditorQuickCompiler] Version information looks good.');
        }
        if ((needClear || debugNative || force) && !process.argv.includes('--no-quick-compile')) {
            await this.rebuild({ isNativeScene, debugNative });
        }
        else {
            console.debug('Note, quick compiler does not get launched.');
        }
        this.statsQuery = this.statsQuery || await ccbuild_1.StatsQuery.create(this.enginePath);
    }
    async getIsSceneNative() {
        return false;
    }
    async getIsDebugNative() {
        return false;
    }
    queryEnvLimitModule() {
        const modulesInfo = fsExtra.readJSONSync(ps.join(this.enginePath, 'editor', 'engine-features', 'render-config.json'));
        const envLimitModule = {};
        const stepModule = (moduleKey, moduleItem) => {
            if (moduleItem.envCondition) {
                envLimitModule[moduleKey] = {
                    envList: this.extractMacros(moduleItem.envCondition),
                    fallback: moduleItem.fallback,
                };
            }
        };
        function addModuleOrGroup(moduleKey, moduleItem) {
            if ('options' in moduleItem) {
                Object.entries(moduleItem.options).forEach(([optionKey, optionItem]) => {
                    stepModule(optionKey, optionItem);
                });
            }
            else {
                stepModule(moduleKey, moduleItem);
            }
        }
        Object.entries(modulesInfo.features).forEach(([moduleKey, moduleItem]) => {
            addModuleOrGroup(moduleKey, moduleItem);
        });
        return envLimitModule;
    }
    async updateAdapter() {
        try {
            let isSuccess = true;
            const nativeOutDir = ps.join(this.enginePath, 'bin/.editor');
            const webAdapter = ps.join(this.enginePath, 'bin/adapter/nodejs/web-adapter.js');
            if (!fsExtra.existsSync(nativeOutDir)) {
                fsExtra.mkdirSync(nativeOutDir);
            }
            if (fsExtra.existsSync(webAdapter)) {
                const output = ps.join(nativeOutDir, 'web-adapter.js');
                fsExtra.copyFileSync(webAdapter, output);
            }
            else {
                isSuccess = false;
                console.error(`${webAdapter} not exist, please build engine first`);
            }
            const engineAdapter = ps.join(this.enginePath, 'bin/adapter/nodejs/engine-adapter.js');
            if (fsExtra.existsSync(engineAdapter)) {
                fsExtra.copyFileSync(engineAdapter, ps.join(nativeOutDir, 'engine-adapter.js'));
            }
            else {
                isSuccess = false;
                console.error(`${engineAdapter} not exist, please build engine first`);
            }
            if (isSuccess) {
                console.log('update adapter success');
            }
            else {
                console.error('update adapter failed');
            }
            return Promise.resolve();
        }
        catch (error) {
            console.error(error);
            return Promise.reject(error);
        }
    }
    async rebuildImportMaps() {
        if (!this.compiler) {
            return;
        }
        const editorShippedFeatures = this.editorFeaturesCache;
        await this.rebuildTargetImportMap(this.compiler, 0, editorShippedFeatures);
        // const previewShippedFeatures = await this.getPreviewShippedFeatures();
        // await this.rebuildTargetImportMap(
        //     this.compiler,
        //     1,
        //     previewShippedFeatures,
        // );
    }
    async rebuildTargetImportMap(compiler, targetIndex, features, platform, mode, out) {
        const configurableFlags = await this.getConfigurableFlagsOfFeatures(features);
        await compiler.buildImportMap(targetIndex, features, {
            mode,
            platform,
            out,
            features,
            configurableFlags,
        });
    }
    async getConfigurableFlagsOfFeatures(features) {
        const flags = {};
        const EngineModulesConfig = TEMP_ENGINE_CONFIG;
        const featureFlagsQuery = EngineModulesConfig.configs[EngineModulesConfig.globalConfigKey].flags;
        if (featureFlagsQuery) {
            for (const [feature, configurableFeatureFlags] of Object.entries(featureFlagsQuery)) {
                if (features.includes(feature)) {
                    Object.assign(flags, configurableFeatureFlags);
                }
            }
        }
        return flags;
    }
    async getPreviewShippedFeatures() {
        const EngineModulesConfig = TEMP_ENGINE_CONFIG;
        const engineModules = EngineModulesConfig.configs[EngineModulesConfig.globalConfigKey].includeModules;
        return engineModules || [];
    }
    extractMacros(expression) {
        return expression.split('||').map(match => match.trim().substring(1));
    }
}
exports.EngineCompiler = EngineCompiler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29yZS9jb21waWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwREFBc0Q7QUFDdEQsNENBQTRDO0FBQzVDLDZEQUE0RTtBQUM1RSx5Q0FBMkI7QUFDM0Isa0RBQW9DO0FBR3BDLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNwQixNQUFNLGtCQUFrQixHQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsV0FBVyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLG9CQUFvQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsRUFBRSxjQUFjLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLG9CQUFvQixFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsc0JBQXNCLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVB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RUQsS0FBSyxDQUFDLDhCQUE4QixDQUFDLFFBQWtCO1FBQ25ELE1BQU0sS0FBSyxHQUE0QixFQUFFLENBQUM7UUFDMUMsTUFBTSxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQztRQUMvQyxNQUFNLGlCQUFpQixHQUFHLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDakcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLEtBQUssTUFBTSxDQUFDLE9BQU8sRUFBRSx3QkFBd0IsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO2dCQUNsRixJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDN0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELEtBQUssQ0FBQyx5QkFBeUI7UUFDM0IsTUFBTSxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQztRQUMvQyxNQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsY0FBYyxDQUFDO1FBQ3RHLE9BQU8sYUFBYSxJQUFJLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsYUFBYSxDQUFDLFVBQWtCO1FBQzVCLE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUUsQ0FBQztDQUNKO0FBeFlELHdDQXdZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFF1aWNrQ29tcGlsZXIgfSBmcm9tICdAY29jb3MvcXVpY2stY29tcGlsZXInO1xuaW1wb3J0IHsgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9jY2J1aWxkJztcbmltcG9ydCB7IGVkaXRvckJyb3dzZXJzbGlzdFF1ZXJ5IH0gZnJvbSAnQGNvY29zL2xpYi1wcm9ncmFtbWluZy9kaXN0L3V0aWxzJztcbmltcG9ydCAqIGFzIHBzIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnNFeHRyYSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBJRmVhdHVyZUl0ZW0sIElNb2R1bGVJdGVtLCBNb2R1bGVSZW5kZXJDb25maWcgfSBmcm9tICcuL21vZHVsZXMnO1xuXG5jb25zdCBWRVJTSU9OID0gJzMnO1xuY29uc3QgVEVNUF9FTkdJTkVfQ09ORklHOiBhbnkgPSB7IGNvbmZpZ3M6IHsgZGVmYXVsdENvbmZpZzogeyBuYW1lOiAn6buY6K6k6YWN572uJywgY2FjaGU6IHsgYmFzZTogeyBfdmFsdWU6IHRydWUgfSwgJ2dmeC13ZWJnbCc6IHsgX3ZhbHVlOiB0cnVlIH0sICdnZngtd2ViZ2wyJzogeyBfdmFsdWU6IGZhbHNlIH0sICdnZngtd2ViZ3B1JzogeyBfdmFsdWU6IGZhbHNlIH0sIGFuaW1hdGlvbjogeyBfdmFsdWU6IHRydWUgfSwgJ3NrZWxldGFsLWFuaW1hdGlvbic6IHsgX3ZhbHVlOiB0cnVlIH0sICczZCc6IHsgX3ZhbHVlOiB0cnVlIH0sIG1lc2hvcHQ6IHsgX3ZhbHVlOiBmYWxzZSB9LCAnMmQnOiB7IF92YWx1ZTogdHJ1ZSB9LCAnc29ydGluZy0yZCc6IHsgX3ZhbHVlOiBmYWxzZSB9LCAncmljaC10ZXh0JzogeyBfdmFsdWU6IHRydWUgfSwgbWFzazogeyBfdmFsdWU6IHRydWUgfSwgZ3JhcGhpY3M6IHsgX3ZhbHVlOiB0cnVlIH0sICd1aS1za2V3JzogeyBfdmFsdWU6IHRydWUgfSwgJ2FmZmluZS10cmFuc2Zvcm0nOiB7IF92YWx1ZTogdHJ1ZSB9LCB1aTogeyBfdmFsdWU6IHRydWUgfSwgcGFydGljbGU6IHsgX3ZhbHVlOiB0cnVlIH0sIHBoeXNpY3M6IHsgX3ZhbHVlOiB0cnVlLCBfb3B0aW9uOiAncGh5c2ljcy1waHlzeCcgfSwgJ3BoeXNpY3MtYW1tbyc6IHsgX3ZhbHVlOiB0cnVlLCBfZmxhZ3M6IHsgTE9BRF9CVUxMRVRfTUFOVUFMTFk6IGZhbHNlIH0gfSwgJ3BoeXNpY3MtY2Fubm9uJzogeyBfdmFsdWU6IGZhbHNlIH0sICdwaHlzaWNzLXBoeXN4JzogeyBfdmFsdWU6IGZhbHNlLCBfZmxhZ3M6IHsgTE9BRF9QSFlTWF9NQU5VQUxMWTogZmFsc2UgfSB9LCAncGh5c2ljcy1idWlsdGluJzogeyBfdmFsdWU6IGZhbHNlIH0sICdwaHlzaWNzLTJkJzogeyBfdmFsdWU6IHRydWUsIF9vcHRpb246ICdwaHlzaWNzLTJkLWJveDJkJyB9LCAncGh5c2ljcy0yZC1ib3gyZCc6IHsgX3ZhbHVlOiB0cnVlIH0sICdwaHlzaWNzLTJkLWJveDJkLXdhc20nOiB7IF92YWx1ZTogZmFsc2UsIF9mbGFnczogeyBMT0FEX0JPWDJEX01BTlVBTExZOiBmYWxzZSB9IH0sICdwaHlzaWNzLTJkLWJ1aWx0aW4nOiB7IF92YWx1ZTogZmFsc2UgfSwgJ3BoeXNpY3MtMmQtYm94MmQtanNiJzogeyBfdmFsdWU6IGZhbHNlIH0sICdpbnRlcnNlY3Rpb24tMmQnOiB7IF92YWx1ZTogdHJ1ZSB9LCBwcmltaXRpdmU6IHsgX3ZhbHVlOiB0cnVlIH0sIHByb2ZpbGVyOiB7IF92YWx1ZTogdHJ1ZSB9LCAnb2NjbHVzaW9uLXF1ZXJ5JzogeyBfdmFsdWU6IGZhbHNlIH0sICdnZW9tZXRyeS1yZW5kZXJlcic6IHsgX3ZhbHVlOiBmYWxzZSB9LCAnZGVidWctcmVuZGVyZXInOiB7IF92YWx1ZTogZmFsc2UgfSwgJ3BhcnRpY2xlLTJkJzogeyBfdmFsdWU6IHRydWUgfSwgYXVkaW86IHsgX3ZhbHVlOiB0cnVlIH0sIHZpZGVvOiB7IF92YWx1ZTogdHJ1ZSB9LCB3ZWJ2aWV3OiB7IF92YWx1ZTogdHJ1ZSB9LCB0d2VlbjogeyBfdmFsdWU6IHRydWUgfSwgd2Vic29ja2V0OiB7IF92YWx1ZTogdHJ1ZSB9LCAnd2Vic29ja2V0LXNlcnZlcic6IHsgX3ZhbHVlOiBmYWxzZSB9LCB0ZXJyYWluOiB7IF92YWx1ZTogdHJ1ZSB9LCAnbGlnaHQtcHJvYmUnOiB7IF92YWx1ZTogdHJ1ZSB9LCAndGlsZWQtbWFwJzogeyBfdmFsdWU6IHRydWUgfSwgJ3ZlbmRvci1nb29nbGUnOiB7IF92YWx1ZTogZmFsc2UgfSwgc3BpbmU6IHsgX3ZhbHVlOiB0cnVlLCBfb3B0aW9uOiAnc3BpbmUtMy44JyB9LCAnc3BpbmUtMy44JzogeyBfdmFsdWU6IHRydWUsIF9mbGFnczogeyBMT0FEX1NQSU5FX01BTlVBTExZOiBmYWxzZSB9IH0sICdzcGluZS00LjInOiB7IF92YWx1ZTogZmFsc2UsIF9mbGFnczogeyBMT0FEX1NQSU5FX01BTlVBTExZOiBmYWxzZSB9IH0sICdkcmFnb24tYm9uZXMnOiB7IF92YWx1ZTogdHJ1ZSB9LCBtYXJpb25ldHRlOiB7IF92YWx1ZTogdHJ1ZSB9LCAncHJvY2VkdXJhbC1hbmltYXRpb24nOiB7IF92YWx1ZTogdHJ1ZSB9LCAnY3VzdG9tLXBpcGVsaW5lLXBvc3QtcHJvY2Vzcyc6IHsgX3ZhbHVlOiBmYWxzZSB9LCAncmVuZGVyLXBpcGVsaW5lJzogeyBfdmFsdWU6IHRydWUsIF9vcHRpb246ICdjdXN0b20tcGlwZWxpbmUnIH0sICdjdXN0b20tcGlwZWxpbmUnOiB7IF92YWx1ZTogdHJ1ZSB9LCAnbGVnYWN5LXBpcGVsaW5lJzogeyBfdmFsdWU6IGZhbHNlIH0sIHhyOiB7IF92YWx1ZTogZmFsc2UgfSB9LCBmbGFnczogeyBMT0FEX0JVTExFVF9NQU5VQUxMWTogZmFsc2UsIExPQURfU1BJTkVfTUFOVUFMTFk6IGZhbHNlLCBMT0FEX1BIWVNYX01BTlVBTExZOiBmYWxzZSB9LCBpbmNsdWRlTW9kdWxlczogWycyZCcsICczZCcsICdhZmZpbmUtdHJhbnNmb3JtJywgJ2FuaW1hdGlvbicsICdhdWRpbycsICdiYXNlJywgJ2N1c3RvbS1waXBlbGluZScsICdkcmFnb24tYm9uZXMnLCAnZ2Z4LXdlYmdsJywgJ2dyYXBoaWNzJywgJ2ludGVyc2VjdGlvbi0yZCcsICdsaWdodC1wcm9iZScsICdtYXJpb25ldHRlJywgJ21hc2snLCAncGFydGljbGUnLCAncGFydGljbGUtMmQnLCAncGh5c2ljcy0yZC1ib3gyZCcsICdwaHlzaWNzLXBoeXN4JywgJ3ByaW1pdGl2ZScsICdwcm9jZWR1cmFsLWFuaW1hdGlvbicsICdwcm9maWxlcicsICdyaWNoLXRleHQnLCAnc2tlbGV0YWwtYW5pbWF0aW9uJywgJ3NwaW5lLTMuOCcsICd0ZXJyYWluJywgJ3RpbGVkLW1hcCcsICd0d2VlbicsICd1aScsICd1aS1za2V3JywgJ3ZpZGVvJywgJ3dlYnNvY2tldCcsICd3ZWJ2aWV3J10sIG5vRGVwcmVjYXRlZEZlYXR1cmVzOiB7IHZhbHVlOiBmYWxzZSwgdmVyc2lvbjogJycgfSB9IH0sIGdsb2JhbENvbmZpZ0tleTogJ2RlZmF1bHRDb25maWcnLCBncmFwaGljczogeyBwaXBlbGluZTogJ2N1c3RvbS1waXBlbGluZScsICdjdXN0b20tcGlwZWxpbmUtcG9zdC1wcm9jZXNzJzogZmFsc2UgfSB9O1xuaW50ZXJmYWNlIElSZWJ1aWxkT3B0aW9ucyB7XG4gICAgZGVidWdOYXRpdmU/OiBib29sZWFuO1xuICAgIGlzTmF0aXZlU2NlbmU/OiBib29sZWFuO1xufVxuXG50eXBlIElFbnZMaW1pdE1vZHVsZSA9IFJlY29yZDxzdHJpbmcsIHtcbiAgICBlbnZMaXN0OiBzdHJpbmdbXTtcbiAgICBmYWxsYmFjaz86IHN0cmluZztcbn0+XG5cbmV4cG9ydCBjbGFzcyBFbmdpbmVDb21waWxlciB7XG4gICAgcHJpdmF0ZSBidXN5OiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBjb21waWxlcjogUXVpY2tDb21waWxlciB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgZWRpdG9yRmVhdHVyZXNDYWNoZTogc3RyaW5nW10gPSBbXTtcbiAgICBwcml2YXRlIG91dERpcjogc3RyaW5nID0gJyc7XG4gICAgcHJpdmF0ZSBzdGF0c1F1ZXJ5OiBTdGF0c1F1ZXJ5IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBpc1dlYjogYm9vbGVhbjtcblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgZW5naW5lUGF0aDogc3RyaW5nLFxuICAgICAgICBpc1dlYjogYm9vbGVhbiA9IGZhbHNlLFxuICAgICkge1xuICAgICAgICB0aGlzLm91dERpciA9IHBzLmpvaW4oZW5naW5lUGF0aCwgJ2JpbicsICcuY2FjaGUnLCAnZGV2LWNsaScpO1xuICAgICAgICB0aGlzLmlzV2ViID0gaXNXZWI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldE91dERpcigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXREaXI7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZShwYXRoOiBzdHJpbmcsIGlzV2ViPzogYm9vbGVhbikge1xuICAgICAgICByZXR1cm4gbmV3IEVuZ2luZUNvbXBpbGVyKHBhdGgsIGlzV2ViKTtcbiAgICB9XG5cbiAgICBhc3luYyBjb21waWxlKGZvcmNlOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgLy8g5Y+R5biD5LmL5ZCO5LiN6ZyA6KaB57yW6K+R5YaF572u5byV5pOOXG4gICAgICAgIC8vIOW8gOWni+esrOS4gOasoee8luivkeW8leaTjlxuICAgICAgICBjb25zdCB2ZXJzaW9uRmlsZSA9IHBzLmpvaW4odGhpcy5vdXREaXIsICdWRVJTSU9OJyk7XG5cbiAgICAgICAgbGV0IG5lZWRDbGVhciA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdmVyc2lvbiA9IGF3YWl0IGZzRXh0cmEucmVhZEZpbGUodmVyc2lvbkZpbGUsICd1dGY4Jyk7XG4gICAgICAgICAgICBpZiAodmVyc2lvbiAhPT0gVkVSU0lPTikge1xuICAgICAgICAgICAgICAgIG5lZWRDbGVhciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgbmVlZENsZWFyID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbXBpbGVyID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGVyKHsgaXNXZWJ2aWV3OiB0aGlzLmlzV2ViIH0pO1xuICAgICAgICBjb25zdCBpc05hdGl2ZVNjZW5lID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3QgZGVidWdOYXRpdmUgPSBmYWxzZTtcblxuICAgICAgICBpZiAobmVlZENsZWFyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbRWRpdG9yUXVpY2tDb21waWxlcl1WZXJzaW9uIGluZm9ybWF0aW9uIGxvc3QuJyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbRWRpdG9yUXVpY2tDb21waWxlcl1WZXJzaW9uIGluZm9ybWF0aW9uIGxvb2tzIGdvb2QuJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChuZWVkQ2xlYXIgfHwgZm9yY2UpICYmICFwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoJy0tbm8tcXVpY2stY29tcGlsZScpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlYnVpbGQoeyBpc05hdGl2ZVNjZW5lLCBkZWJ1Z05hdGl2ZSB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ05vdGUsIHF1aWNrIGNvbXBpbGVyIGRvZXMgbm90IGdldCBsYXVuY2hlZC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhdHNRdWVyeSA9IHRoaXMuc3RhdHNRdWVyeSB8fCBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZSh0aGlzLmVuZ2luZVBhdGgpO1xuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlQ29tcGlsZXIob3B0aW9ucz86IHsgaXNOYXRpdmU/OiBib29sZWFuLCBpc1dlYnZpZXc/OiBib29sZWFuIH0pOiBQcm9taXNlPFF1aWNrQ29tcGlsZXI+IHtcbiAgICAgICAgY29uc3QgbG9nRmlsZSA9IHBzLmpvaW4odGhpcy5lbmdpbmVQYXRoLCAnYmluJywgJy5jYWNoZScsICdsb2dzJywgJ2xvZy50eHQnKTtcbiAgICAgICAgaWYgKGxvZ0ZpbGUpIHtcbiAgICAgICAgICAgIGF3YWl0IGZzRXh0cmEuZW5zdXJlRGlyKHBzLmRpcm5hbWUobG9nRmlsZSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdHNRdWVyeSA9IHRoaXMuc3RhdHNRdWVyeSB8fCBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZSh0aGlzLmVuZ2luZVBhdGgpO1xuICAgICAgICBsZXQgYWxsRmVhdHVyZXMgPSB0aGlzLnN0YXRzUXVlcnkuZ2V0RmVhdHVyZXMoKTtcbiAgICAgICAgLy8gU3BpbmUgSGFjayBCZWdpblxuICAgICAgICAvLyDlhYjnp7vpmaQgc3BpbmUg5omA5pyJ54mI5pysXG4gICAgICAgIGFsbEZlYXR1cmVzID0gYWxsRmVhdHVyZXMuZmlsdGVyKChmKSA9PiAhZi5zdGFydHNXaXRoKCdzcGluZS0nKSk7XG4gICAgICAgIC8vIGRldi1jbGkg6aKE6KeIIC8g5Zy65pmv57yW6L6R5Zmo5byV5pOO77ya5ZCM5pe257yW5YWlIHNwaW5lLTMuOCDkuI4gc3BpbmUtNC4y77yM6YWN5ZCIIGNjLmNvbmZpZy5qc29uIOeahFxuICAgICAgICAvLyBtb2R1bGVPdmVycmlkZXPvvIhTUElORV8zXzggJiYgU1BJTkVfNF8yIOKGkiBzcGluZS0qLWR5bmFtaWMudHPvvInlrp7njrDov5DooYzml7bmjIkgY29jb3MuY29uZmlnLmpzb25cbiAgICAgICAgLy8g6YCJ5a6aIHNwaW5lIOeJiOacrO+8iOaUuemFjee9riArIOehrOWIt+aWsOWNs+eUn+aViO+8jOaXoOmcgOmHjee8luW8leaTju+8ieOAguS4pOS7vSBzcGluZSBXQVNNL2FzbSBleHRlcm5hbCDpg73kvJrooqvnvJblhaXjgIJcbiAgICAgICAgLy8g5rOo5oSP77ya6L+Z6YeM5pivIGRldi1jbGkg5byV5pOO57yW6K+R5Zmo77yM5LiO6aG555uu5p6E5bu65byV5pOO77yIc3JjL2NvcmUvYnVpbGRlci8uLi4vc2VwYXJhdGUtZW5naW5lLnRz77yJ5pivXG4gICAgICAgIC8vIOS4pOadoeeLrOeri+euoee6v++8m+mhueebruaehOW7uuS7jeaMiSBpbmNsdWRlTW9kdWxlcyDnvJbor5HmnJ/ljZXniYjmnKzvvIzkuqfnianljIXkvZPkuI3lj5flvbHlk43jgIJcbiAgICAgICAgYWxsRmVhdHVyZXMucHVzaCgnc3BpbmUtMy44Jyk7XG4gICAgICAgIGFsbEZlYXR1cmVzLnB1c2goJ3NwaW5lLTQuMicpO1xuICAgICAgICAvLyBTcGluZSBIYWNrIEVuZFxuICAgICAgICBjb25zdCBlbnY6IFN0YXRzUXVlcnkuQ29uc3RhbnRNYW5hZ2VyLkNvbnN0YW50T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHBsYXRmb3JtOiAnTk9ERUpTJyxcbiAgICAgICAgICAgIG1vZGU6ICdFRElUT1InLFxuICAgICAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgICAgICBERUJVRzogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIGlmIChvcHRpb25zPy5pc1dlYnZpZXcpIHtcbiAgICAgICAgICAgIGVudi5wbGF0Zm9ybSA9ICdIVE1MNSc7IC8vIFdlYnZpZXcgdGFyZ2V0aW5nIEhUTUw1IHBsYXRmb3JtXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmZWF0dXJlVW5pdFByZWZpeCA9ICdjY2U6L2ludGVybmFsL3gvY2MtZnUvJzsgLy8gY2MtZnUgLT4gY2MgZmVhdHVyZSB1bml0XG4gICAgICAgIGlmIChvcHRpb25zPy5pc05hdGl2ZSkge1xuICAgICAgICAgICAgZW52LnBsYXRmb3JtID0gJ05BVElWRSc7XG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICAgICAgICAgIGVudi5wbGF0Zm9ybSA9ICdXSU5ET1dTJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICBlbnYucGxhdGZvcm0gPSAnTUFDJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5zdXBwb3J0ZWQgcGxhdGZvcm06ICR7cHJvY2Vzcy5wbGF0Zm9ybX1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZWRpdG9yRmVhdHVyZXMgPSBhd2FpdCB0aGlzLmZpbHRlckVuZ2luZU1vZHVsZXMoZW52LCBhbGxGZWF0dXJlcyk7XG4gICAgICAgICAgICB0aGlzLmVkaXRvckZlYXR1cmVzQ2FjaGUucHVzaCguLi5lZGl0b3JGZWF0dXJlcyk7XG4gICAgICAgICAgICBjb25zdCBuYXRpdmVPdXREaXIgPSBwcy5qb2luKHRoaXMuZW5naW5lUGF0aCwgJ2Jpbi8uZWRpdG9yJyk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFF1aWNrQ29tcGlsZXIoe1xuICAgICAgICAgICAgICAgIHJvb3REaXI6IHRoaXMuZW5naW5lUGF0aCxcbiAgICAgICAgICAgICAgICBvdXREaXI6IG5hdGl2ZU91dERpcixcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybTogZW52LnBsYXRmb3JtLFxuICAgICAgICAgICAgICAgIHRhcmdldHM6IFt7XG4gICAgICAgICAgICAgICAgICAgIGZlYXR1cmVVbml0UHJlZml4LFxuICAgICAgICAgICAgICAgICAgICBkaXI6IG5hdGl2ZU91dERpcixcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiAnc3lzdGVtanMnLFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRzOiAnbm9kZSAxMCcsXG4gICAgICAgICAgICAgICAgICAgIGxvb3NlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlRWRpdG9yRXhwb3J0czogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUluZGV4OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmZWF0dXJlczogZWRpdG9yRmVhdHVyZXMsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGxvYWRlcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICBsb2dGaWxlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JGZWF0dXJlcyA9IGF3YWl0IHRoaXMuZmlsdGVyRW5naW5lTW9kdWxlcyhlbnYsIGFsbEZlYXR1cmVzKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yRmVhdHVyZXNDYWNoZS5wdXNoKC4uLmVkaXRvckZlYXR1cmVzKTtcbiAgICAgICAgICAgIGNvbnN0IG91dHB1dERpciA9IG9wdGlvbnM/LmlzV2VidmlldyA/IHBzLmpvaW4odGhpcy5vdXREaXIsICd3ZWInKSA6IHBzLmpvaW4odGhpcy5vdXREaXIsICdlZGl0b3InKTtcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBRdWlja0NvbXBpbGVyKHtcbiAgICAgICAgICAgICAgICByb290RGlyOiB0aGlzLmVuZ2luZVBhdGgsXG4gICAgICAgICAgICAgICAgb3V0RGlyOiBvdXRwdXREaXIsXG4gICAgICAgICAgICAgICAgcGxhdGZvcm06IGVudi5wbGF0Zm9ybSxcbiAgICAgICAgICAgICAgICB0YXJnZXRzOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVVbml0UHJlZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyOiBvdXRwdXREaXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6ICdzeXN0ZW1qcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmxpbmVTb3VyY2VNYXA6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDkvb/nlKggaW5kZXhlZCBzb3VyY2UgbWFwIOWKoOW/q+e8luivkemAn+W6pu+8mlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6KeBIGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy1jcmVhdG9yLzNkLXRhc2tzL2lzc3Vlcy80NzIwXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmRleGVkU291cmNlTWFwOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlZEluRWxlY3Ryb241MDk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRzOiBlZGl0b3JCcm93c2Vyc2xpc3RRdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVJbmRleDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzOiBlZGl0b3JGZWF0dXJlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkZXI6IHRydWUsIC8vIOe8lui+keWZqOmHjOayoeaciSBTeXN0ZW1KU++8jOaJgOS7pemcgOimgeeUn+aIkCBsb2FkZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvb3NlOiB0cnVlLCAvLyBUT0RPKGNqaCk6IOW9k+WJjSBjY2J1aWxkIOaehOW7uuW8uuWItuS9v+eUqOS6hiBsb29zZSDmqKHlvI/kuJTlkI7pnaLkuIDkuKogcHJldmlldyB0YXJnZXQg5Lmf5piv5by65Yi25byA5ZCv77yM5YWI5oqK5b2T5YmNIGVkaXRvciB0YXJnZXQg5Lmf5byA5ZCvIGxvb3NlIOaooeW8j++8jOS4tOaXtuS/ruWkjSBUaG91Z2ggdGhlIFwibG9vc2VcIiBvcHRpb24gd2FzIHNldCB0byBcImZhbHNlXCIgaW4geW91ciBAYmFiZWwvcHJlc2V0LWVudiBjb25maWcgLi4uIOmXrumimOOAguWQjue7remcgOimgeiAg+iZkeS9v+eUqOmhueebruiuvue9ruS4reeahOOAjOWuveadvuaooeW8j+OAjeiuvue9rumAiemhueOAglxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgbG9nRmlsZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFRPRE8g55uu5YmN5byV5pOO5YiG56a744CBZW5naW5lIOaPkuS7tuWGhemDqOmDvemcgOimgei/meS4qui/h+a7pOWKn+iDve+8jOmcgOimgee7n+S4gOWkjeeUqFxuICAgIGFzeW5jIGZpbHRlckVuZ2luZU1vZHVsZXMoZW52T3B0aW9uczogU3RhdHNRdWVyeS5Db25zdGFudE1hbmFnZXIuQ29uc3RhbnRPcHRpb25zLCBmZWF0dXJlczogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3QgZW5naW5lU3RhdHNRdWVyeSA9IGF3YWl0IFN0YXRzUXVlcnkuY3JlYXRlKHRoaXMuZW5naW5lUGF0aCk7XG4gICAgICAgIGNvbnN0IGNjRW52Q29uc3RhbnRzID0gZW5naW5lU3RhdHNRdWVyeS5jb25zdGFudE1hbmFnZXIuZ2VuQ0NFbnZDb25zdGFudHMoZW52T3B0aW9ucyk7XG4gICAgICAgIGNvbnN0IGVudkxpbWl0TW9kdWxlID0gdGhpcy5xdWVyeUVudkxpbWl0TW9kdWxlKCk7XG4gICAgICAgIGNvbnN0IG1vZHVsZVRvRmFsbEJhY2s6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMoZW52TGltaXRNb2R1bGUpLmZvckVhY2goKG1vZHVsZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghZmVhdHVyZXMuaW5jbHVkZXMobW9kdWxlSWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBlbnZMaXN0LCBmYWxsYmFjayB9ID0gZW52TGltaXRNb2R1bGVbbW9kdWxlSWRdO1xuICAgICAgICAgICAgY29uc3QgZW5hYmxlID0gZW52TGlzdC5zb21lKChlbnYpID0+IGNjRW52Q29uc3RhbnRzW2VudiBhcyBrZXlvZiBTdGF0c1F1ZXJ5LkNvbnN0YW50TWFuYWdlci5DQ0VudkNvbnN0YW50c10pO1xuICAgICAgICAgICAgaWYgKGVuYWJsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1vZHVsZVRvRmFsbEJhY2tbbW9kdWxlSWRdID0gZmFsbGJhY2sgfHwgJyc7XG4gICAgICAgICAgICBpZiAoZmFsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcy5zcGxpY2UoZmVhdHVyZXMuaW5kZXhPZihtb2R1bGVJZCksIDEsIGZhbGxiYWNrKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMuc3BsaWNlKGZlYXR1cmVzLmluZGV4T2YobW9kdWxlSWQpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmZWF0dXJlcztcbiAgICB9XG5cbiAgICBhc3luYyByZWJ1aWxkKG9wdGlvbnM/OiBJUmVidWlsZE9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnM/LmlzTmF0aXZlU2NlbmUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3B0aW9ucyA/Pz0ge307XG4gICAgICAgICAgICBvcHRpb25zLmlzTmF0aXZlU2NlbmUgPSBhd2FpdCB0aGlzLmdldElzU2NlbmVOYXRpdmUoKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmlzTmF0aXZlU2NlbmUpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmRlYnVnTmF0aXZlID0gYXdhaXQgdGhpcy5nZXRJc0RlYnVnTmF0aXZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuY29tcGlsZXIgfHwgKG9wdGlvbnM/LmlzTmF0aXZlU2NlbmUpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVFbmdpbmUodGhpcy5lbmdpbmVQYXRoLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5idXN5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb21waWxlIGVuZ2luZSBmYWlsczogVGhlIGNvbXBpbGF0aW9uIGlzIGluIHByb2dyZXNzJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5idXN5ID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5sb2coJ1N0YXJ0IFF1aWNrIENvbXBpbGUnKTtcbiAgICAgICAgY29uc3QgdGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIGlmICghdGhpcy5jb21waWxlcikge1xuICAgICAgICAgICAgdGhpcy5idXN5ID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb21waWxlIGVuZ2luZSBmYWlsczogVGhlIGNvbXBpbGVyIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBpZiAob3B0aW9ucy5pc05hdGl2ZVNjZW5lKSB7XG4gICAgICAgICAgICAvLyAgICAgYXdhaXQgdGhpcy5yZWJ1aWxkTmF0aXZlSW1wb3J0TWFwKCk7XG4gICAgICAgICAgICAvLyAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUVuZ2luZUFkZG9uKG9wdGlvbnMpO1xuICAgICAgICAgICAgLy8gICAgIGF3YWl0IHRoaXMudXBkYXRlQWRhcHRlcigpO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVBZGFwdGVyKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmJ1aWxkKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlYnVpbGRJbXBvcnRNYXBzKCk7XG4gICAgICAgICAgICBjb25zdCB2ZXJzaW9uRmlsZSA9IHBzLmpvaW4odGhpcy5vdXREaXIsICdWRVJTSU9OJyk7XG4gICAgICAgICAgICBhd2FpdCBmc0V4dHJhLm91dHB1dEZpbGUodmVyc2lvbkZpbGUsIFZFUlNJT04sIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZWxlc3MtY2F0Y2hcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuXG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUXVpY2sgQ29tcGlsZTogJyArIChEYXRlLm5vdygpIC0gdGltZSkgKyAnbXMnKTtcbiAgICAgICAgICAgIHRoaXMuYnVzeSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgY2xlYXIoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjbGVhclBhdGggPSBwcy5qb2luKHRoaXMub3V0RGlyLCB0aGlzLmlzV2ViID8gJ3dlYicgOiAnZWRpdG9yJyk7XG4gICAgICAgICAgICBhd2FpdCBmc0V4dHJhLnJlbW92ZShjbGVhclBhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikgeyB9XG4gICAgfVxuXG4gICAgYXN5bmMgY29tcGlsZUVuZ2luZShkaXJlY3Rvcnk6IHN0cmluZywgZm9yY2U/OiBib29sZWFuLCBvcHRpb25zPzogSVJlYnVpbGRPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuZW5naW5lUGF0aCA9IGRpcmVjdG9yeTtcbiAgICAgICAgLy8gdGhpcy5vdXREaXIgPSBqb2luKGRpcmVjdG9yeSwgJ2JpbicsICcuY2FjaGUnLCAnZGV2LWNsaScpOyAvLyBSZW1vdmVkIHRvIGF2b2lkIG92ZXJyaWRpbmcgY29uc3RydWN0b3ItaW5pdCBvdXREaXJcbiAgICAgICAgLy8g5byA5aeL56ys5LiA5qyh57yW6K+R5byV5pOOXG4gICAgICAgIGNvbnN0IHZlcnNpb25GaWxlID0gcHMuam9pbih0aGlzLm91dERpciwgJ1ZFUlNJT04nKTtcblxuICAgICAgICBsZXQgbmVlZENsZWFyID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB2ZXJzaW9uID0gYXdhaXQgZnNFeHRyYS5yZWFkRmlsZSh2ZXJzaW9uRmlsZSwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIGlmICh2ZXJzaW9uICE9PSBWRVJTSU9OKSB7XG4gICAgICAgICAgICAgICAgbmVlZENsZWFyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICBuZWVkQ2xlYXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsZXIoeyBpc1dlYnZpZXc6IHRoaXMuaXNXZWIgfSk7XG4gICAgICAgIGNvbnN0IGlzTmF0aXZlU2NlbmUgPSBvcHRpb25zICYmIG9wdGlvbnMuaXNOYXRpdmVTY2VuZSAmJiBhd2FpdCB0aGlzLmdldElzU2NlbmVOYXRpdmUoKTtcblxuICAgICAgICBjb25zdCBkZWJ1Z05hdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChuZWVkQ2xlYXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tFZGl0b3JRdWlja0NvbXBpbGVyXSBWZXJzaW9uIGluZm9ybWF0aW9uIGxvc3QuJyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbRWRpdG9yUXVpY2tDb21waWxlcl0gVmVyc2lvbiBpbmZvcm1hdGlvbiBsb29rcyBnb29kLicpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgobmVlZENsZWFyIHx8IGRlYnVnTmF0aXZlIHx8IGZvcmNlKSAmJiAhcHJvY2Vzcy5hcmd2LmluY2x1ZGVzKCctLW5vLXF1aWNrLWNvbXBpbGUnKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWJ1aWxkKHsgaXNOYXRpdmVTY2VuZSwgZGVidWdOYXRpdmUgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdOb3RlLCBxdWljayBjb21waWxlciBkb2VzIG5vdCBnZXQgbGF1bmNoZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXRzUXVlcnkgPSB0aGlzLnN0YXRzUXVlcnkgfHwgYXdhaXQgU3RhdHNRdWVyeS5jcmVhdGUodGhpcy5lbmdpbmVQYXRoKTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRJc1NjZW5lTmF0aXZlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SXNEZWJ1Z05hdGl2ZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHF1ZXJ5RW52TGltaXRNb2R1bGUoKSB7XG4gICAgICAgIGNvbnN0IG1vZHVsZXNJbmZvOiBNb2R1bGVSZW5kZXJDb25maWcgPSBmc0V4dHJhLnJlYWRKU09OU3luYyhwcy5qb2luKHRoaXMuZW5naW5lUGF0aCwgJ2VkaXRvcicsICdlbmdpbmUtZmVhdHVyZXMnLCAncmVuZGVyLWNvbmZpZy5qc29uJykpO1xuXG4gICAgICAgIGNvbnN0IGVudkxpbWl0TW9kdWxlOiBJRW52TGltaXRNb2R1bGUgPSB7fTtcbiAgICAgICAgY29uc3Qgc3RlcE1vZHVsZSA9IChtb2R1bGVLZXk6IHN0cmluZywgbW9kdWxlSXRlbTogSUZlYXR1cmVJdGVtKSA9PiB7XG4gICAgICAgICAgICBpZiAobW9kdWxlSXRlbS5lbnZDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBlbnZMaW1pdE1vZHVsZVttb2R1bGVLZXldID0ge1xuICAgICAgICAgICAgICAgICAgICBlbnZMaXN0OiB0aGlzLmV4dHJhY3RNYWNyb3MobW9kdWxlSXRlbS5lbnZDb25kaXRpb24pLFxuICAgICAgICAgICAgICAgICAgICBmYWxsYmFjazogbW9kdWxlSXRlbS5mYWxsYmFjayxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBhZGRNb2R1bGVPckdyb3VwKG1vZHVsZUtleTogc3RyaW5nLCBtb2R1bGVJdGVtOiBJTW9kdWxlSXRlbSkge1xuICAgICAgICAgICAgaWYgKCdvcHRpb25zJyBpbiBtb2R1bGVJdGVtKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMobW9kdWxlSXRlbS5vcHRpb25zKS5mb3JFYWNoKChbb3B0aW9uS2V5LCBvcHRpb25JdGVtXSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdGVwTW9kdWxlKG9wdGlvbktleSwgb3B0aW9uSXRlbSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0ZXBNb2R1bGUobW9kdWxlS2V5LCBtb2R1bGVJdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBPYmplY3QuZW50cmllcyhtb2R1bGVzSW5mby5mZWF0dXJlcykuZm9yRWFjaCgoW21vZHVsZUtleSwgbW9kdWxlSXRlbV0pID0+IHtcbiAgICAgICAgICAgIGFkZE1vZHVsZU9yR3JvdXAobW9kdWxlS2V5LCBtb2R1bGVJdGVtKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGVudkxpbWl0TW9kdWxlO1xuICAgIH1cblxuICAgIGFzeW5jIHVwZGF0ZUFkYXB0ZXIoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgaXNTdWNjZXNzID0gdHJ1ZTtcblxuICAgICAgICAgICAgY29uc3QgbmF0aXZlT3V0RGlyID0gcHMuam9pbih0aGlzLmVuZ2luZVBhdGgsICdiaW4vLmVkaXRvcicpO1xuICAgICAgICAgICAgY29uc3Qgd2ViQWRhcHRlciA9IHBzLmpvaW4odGhpcy5lbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbm9kZWpzL3dlYi1hZGFwdGVyLmpzJyk7XG4gICAgICAgICAgICBpZiAoIWZzRXh0cmEuZXhpc3RzU3luYyhuYXRpdmVPdXREaXIpKSB7XG4gICAgICAgICAgICAgICAgZnNFeHRyYS5ta2RpclN5bmMobmF0aXZlT3V0RGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmc0V4dHJhLmV4aXN0c1N5bmMod2ViQWRhcHRlcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRwdXQgPSBwcy5qb2luKG5hdGl2ZU91dERpciwgJ3dlYi1hZGFwdGVyLmpzJyk7XG4gICAgICAgICAgICAgICAgZnNFeHRyYS5jb3B5RmlsZVN5bmMod2ViQWRhcHRlciwgb3V0cHV0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaXNTdWNjZXNzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHt3ZWJBZGFwdGVyfSBub3QgZXhpc3QsIHBsZWFzZSBidWlsZCBlbmdpbmUgZmlyc3RgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGVuZ2luZUFkYXB0ZXIgPSBwcy5qb2luKHRoaXMuZW5naW5lUGF0aCwgJ2Jpbi9hZGFwdGVyL25vZGVqcy9lbmdpbmUtYWRhcHRlci5qcycpO1xuICAgICAgICAgICAgaWYgKGZzRXh0cmEuZXhpc3RzU3luYyhlbmdpbmVBZGFwdGVyKSkge1xuICAgICAgICAgICAgICAgIGZzRXh0cmEuY29weUZpbGVTeW5jKGVuZ2luZUFkYXB0ZXIsIHBzLmpvaW4obmF0aXZlT3V0RGlyLCAnZW5naW5lLWFkYXB0ZXIuanMnKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlzU3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7ZW5naW5lQWRhcHRlcn0gbm90IGV4aXN0LCBwbGVhc2UgYnVpbGQgZW5naW5lIGZpcnN0YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3VwZGF0ZSBhZGFwdGVyIHN1Y2Nlc3MnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcigndXBkYXRlIGFkYXB0ZXIgZmFpbGVkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgYXN5bmMgcmVidWlsZEltcG9ydE1hcHMoKSB7XG4gICAgICAgIGlmICghdGhpcy5jb21waWxlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZWRpdG9yU2hpcHBlZEZlYXR1cmVzID0gdGhpcy5lZGl0b3JGZWF0dXJlc0NhY2hlO1xuICAgICAgICBhd2FpdCB0aGlzLnJlYnVpbGRUYXJnZXRJbXBvcnRNYXAoXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVyLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIGVkaXRvclNoaXBwZWRGZWF0dXJlcyxcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBjb25zdCBwcmV2aWV3U2hpcHBlZEZlYXR1cmVzID0gYXdhaXQgdGhpcy5nZXRQcmV2aWV3U2hpcHBlZEZlYXR1cmVzKCk7XG4gICAgICAgIC8vIGF3YWl0IHRoaXMucmVidWlsZFRhcmdldEltcG9ydE1hcChcbiAgICAgICAgLy8gICAgIHRoaXMuY29tcGlsZXIsXG4gICAgICAgIC8vICAgICAxLFxuICAgICAgICAvLyAgICAgcHJldmlld1NoaXBwZWRGZWF0dXJlcyxcbiAgICAgICAgLy8gKTtcbiAgICB9XG4gICAgYXN5bmMgcmVidWlsZFRhcmdldEltcG9ydE1hcChjb21waWxlcjogUXVpY2tDb21waWxlciwgdGFyZ2V0SW5kZXg6IG51bWJlciwgZmVhdHVyZXM6IHN0cmluZ1tdLCBwbGF0Zm9ybT86IHN0cmluZywgbW9kZT86IHN0cmluZywgb3V0Pzogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYWJsZUZsYWdzID0gYXdhaXQgdGhpcy5nZXRDb25maWd1cmFibGVGbGFnc09mRmVhdHVyZXMoZmVhdHVyZXMpO1xuICAgICAgICBhd2FpdCBjb21waWxlci5idWlsZEltcG9ydE1hcChcbiAgICAgICAgICAgIHRhcmdldEluZGV4LCBmZWF0dXJlcywge1xuICAgICAgICAgICAgbW9kZSxcbiAgICAgICAgICAgIHBsYXRmb3JtLFxuICAgICAgICAgICAgb3V0LFxuICAgICAgICAgICAgZmVhdHVyZXMsXG4gICAgICAgICAgICBjb25maWd1cmFibGVGbGFncyxcbiAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRDb25maWd1cmFibGVGbGFnc09mRmVhdHVyZXMoZmVhdHVyZXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGNvbnN0IGZsYWdzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICAgICAgICBjb25zdCBFbmdpbmVNb2R1bGVzQ29uZmlnID0gVEVNUF9FTkdJTkVfQ09ORklHO1xuICAgICAgICBjb25zdCBmZWF0dXJlRmxhZ3NRdWVyeSA9IEVuZ2luZU1vZHVsZXNDb25maWcuY29uZmlnc1tFbmdpbmVNb2R1bGVzQ29uZmlnLmdsb2JhbENvbmZpZ0tleV0uZmxhZ3M7XG4gICAgICAgIGlmIChmZWF0dXJlRmxhZ3NRdWVyeSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbZmVhdHVyZSwgY29uZmlndXJhYmxlRmVhdHVyZUZsYWdzXSBvZiBPYmplY3QuZW50cmllcyhmZWF0dXJlRmxhZ3NRdWVyeSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmVhdHVyZXMuaW5jbHVkZXMoZmVhdHVyZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihmbGFncywgY29uZmlndXJhYmxlRmVhdHVyZUZsYWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZsYWdzO1xuICAgIH1cblxuICAgIGFzeW5jIGdldFByZXZpZXdTaGlwcGVkRmVhdHVyZXMoKSB7XG4gICAgICAgIGNvbnN0IEVuZ2luZU1vZHVsZXNDb25maWcgPSBURU1QX0VOR0lORV9DT05GSUc7XG4gICAgICAgIGNvbnN0IGVuZ2luZU1vZHVsZXMgPSBFbmdpbmVNb2R1bGVzQ29uZmlnLmNvbmZpZ3NbRW5naW5lTW9kdWxlc0NvbmZpZy5nbG9iYWxDb25maWdLZXldLmluY2x1ZGVNb2R1bGVzO1xuICAgICAgICByZXR1cm4gZW5naW5lTW9kdWxlcyB8fCBbXTtcbiAgICB9XG5cbiAgICBleHRyYWN0TWFjcm9zKGV4cHJlc3Npb246IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIGV4cHJlc3Npb24uc3BsaXQoJ3x8JykubWFwKG1hdGNoID0+IG1hdGNoLnRyaW0oKS5zdWJzdHJpbmcoMSkpO1xuICAgIH1cbn0iXX0=