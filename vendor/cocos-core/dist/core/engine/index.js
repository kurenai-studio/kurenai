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
exports.Engine = void 0;
exports.initEngine = initEngine;
const fs_extra_1 = __importDefault(require("fs-extra"));
const fs_1 = require("fs");
const path_1 = require("path");
const lodash_1 = require("lodash");
const configuration_1 = require("../configuration");
const assets_1 = require("../assets");
const dynamic_metadata_1 = require("./dynamic-metadata");
const metadata_1 = require("./metadata");
const i18n_1 = __importDefault(require("../base/i18n"));
const graphics_config_1 = require("./graphics-config");
const joint_texture_layout_1 = require("./joint-texture-layout");
const layerMask = [];
for (let i = 0; i <= 19; i++) {
    layerMask[i] = 1 << i;
}
const Backends = {
    'physics-cannon': 'cannon.js',
    'physics-ammo': 'bullet',
    'physics-builtin': 'builtin',
    'physics-physx': 'physx',
};
const Backends2D = {
    'physics-2d-box2d': 'box2d',
    'physics-2d-box2d-wasm': 'box2d-wasm',
    'physics-2d-builtin': 'builtin',
};
// TODO issue 记录： https://github.com/cocos/3d-tasks/issues/18489 后续完善
// 后处理管线模块的开关，在图像设置那边处理 (说是 3.9 会彻底删除)
// 所以界面上的 勾选动作 和 状态判断 都要忽略这个列表的数据，从 3.8.6 开始我将这个 ignoreKeys 改成 ignoreModules 从 视图层移到主进程
// 直接在数据源上过滤掉，减少 视图层的判断
const ignoreModules = ['custom-pipeline-post-process'];
function extractMacros(expression) {
    // envCondition uses a small "$MACRO || $MACRO" grammar shared with the engine compiler.
    return expression.split('||').map(match => match.trim().substring(1));
}
class EngineManager {
    _init = false;
    _info = {
        version: '3.8.8',
        tmpDir: '',
        typescript: {
            path: '',
            type: 'builtin',
            builtin: '',
        },
        native: {
            path: '',
            type: 'builtin',
            builtin: '',
        }
    };
    _defaultConfig = this.createFallbackDefaultConfig();
    _config = (0, lodash_1.cloneDeep)(this._defaultConfig);
    _configInstance;
    get defaultConfig() {
        return (0, lodash_1.cloneDeep)(this._defaultConfig);
    }
    /**
     * 加载引擎包的 i18n 文件（.js CommonJS 模块）
     * 将 packages/engine/editor/i18n/{lang}/*.js 注册到 ENGINE.* 命名空间
     * 递归处理子目录（如 modules/physics.js → ENGINE.physics.*）
     */
    _loadEngineI18n(enginePath) {
        const i18nDir = (0, path_1.join)(enginePath, 'editor', 'i18n');
        if (!(0, fs_1.existsSync)(i18nDir)) {
            return;
        }
        const loadDir = (dir, lang, prefix) => {
            (0, fs_1.readdirSync)(dir).forEach((entry) => {
                const fullPath = (0, path_1.join)(dir, entry);
                if (entry.endsWith('.js')) {
                    try {
                        const resolved = require.resolve(fullPath);
                        const data = require(resolved);
                        i18n_1.default.registerLanguagePatch(lang, prefix, data);
                    }
                    catch (error) {
                        console.warn(`[i18n] Failed to load engine i18n: ${fullPath}`, error);
                    }
                }
                else if ((0, fs_1.statSync)(fullPath).isDirectory()) {
                    loadDir(fullPath, lang, prefix);
                }
            });
        };
        for (const lang of ['zh', 'en']) {
            const langDir = (0, path_1.join)(i18nDir, lang);
            if (!(0, fs_1.existsSync)(langDir)) {
                continue;
            }
            loadDir(langDir, lang, 'ENGINE');
        }
    }
    createFallbackDefaultConfig() {
        const includeModules = [
            '2d',
            '3d',
            'debug-renderer',
            'affine-transform',
            'animation',
            'audio',
            'base',
            'custom-pipeline',
            'dragon-bones',
            'gfx-webgl',
            'graphics',
            'intersection-2d',
            'light-probe',
            'marionette',
            'mask',
            'particle',
            'particle-2d',
            'physics-2d-box2d',
            'physics-ammo',
            'primitive',
            'profiler',
            'rich-text',
            'skeletal-animation',
            'spine-3.8',
            'terrain',
            'tiled-map',
            'tween',
            'ui',
            'ui-skew',
            'video',
            'websocket',
            'webview'
        ];
        return {
            includeModules,
            flags: {
                LOAD_BULLET_MANUALLY: false,
                LOAD_SPINE_MANUALLY: false
            },
            physicsConfig: {
                gravity: { x: 0, y: -10, z: 0 },
                allowSleep: true,
                sleepThreshold: 0.1,
                autoSimulation: true,
                fixedTimeStep: 1 / 60,
                maxSubSteps: 1,
                defaultMaterial: '',
                useNodeChains: true,
                collisionMatrix: { 0: 1 },
                physicsEngine: '',
                physX: {
                    notPackPhysXLibs: false,
                    multiThread: false,
                    subThreadCount: 0,
                    epsilon: 0.0001,
                },
            },
            highQuality: false,
            customLayers: [],
            sortingLayers: [],
            macroCustom: [],
            // TODO 从 engine 内初始化
            macroConfig: {
                ENABLE_TILEDMAP_CULLING: true,
                TOUCH_TIMEOUT: 5000,
                ENABLE_TRANSPARENT_CANVAS: false,
                ENABLE_WEBGL_ANTIALIAS: true,
                ENABLE_FLOAT_OUTPUT: false,
                CLEANUP_IMAGE_CACHE: false,
                ENABLE_MULTI_TOUCH: true,
                MAX_LABEL_CANVAS_POOL_SIZE: 20,
                ENABLE_WEBGL_HIGHP_STRUCT_VALUES: false,
                BATCHER2D_MEM_INCREMENT: 144,
                [graphics_config_1.CUSTOM_PIPELINE_NAME_KEY]: graphics_config_1.DEFAULT_CUSTOM_PIPELINE_NAME,
            },
            graphics: (0, graphics_config_1.deriveGraphicsConfigFromModules)(includeModules),
            customJointTextureLayouts: [],
            splashScreen: {
                displayRatio: 1,
                totalTime: 2000,
                logo: {
                    type: 'default',
                    image: ''
                },
                background: {
                    type: 'default',
                    color: {
                        x: 0.0156862745098039,
                        y: 0.0352941176470588,
                        z: 0.0392156862745098,
                        w: 1
                    },
                    image: ''
                },
                watermarkLocation: 'default',
                autoFit: true
            },
            designResolution: {
                width: 1280,
                height: 720,
                fitWidth: true,
                fitHeight: false
            },
            downloadMaxConcurrency: 15,
            renderPipeline: 'fd8ec536-a354-4a17-9c74-4f3883c378c8',
            customPipeline: false,
        };
    }
    resolveDefaultConfig(engineRoot) {
        const fallbackConfig = this.createFallbackDefaultConfig();
        const contribution = (0, dynamic_metadata_1.getEngineDynamicConfigContribution)({
            engineRoot,
            fallbackConfig: {
                includeModules: fallbackConfig.includeModules,
                flags: fallbackConfig.flags,
                macroConfig: fallbackConfig.macroConfig,
            },
        });
        const includeModules = contribution.defaults.includeModules;
        return {
            ...fallbackConfig,
            includeModules,
            flags: contribution.defaults.flags,
            macroConfig: (0, graphics_config_1.ensureCustomPipelineMacroConfig)(contribution.defaults.macroConfig),
            graphics: (0, graphics_config_1.deriveGraphicsConfigFromModules)(includeModules),
        };
    }
    getSelectedModuleProjectConfig(projectConfig) {
        if (!projectConfig.configs || Object.keys(projectConfig.configs).length === 0) {
            return undefined;
        }
        const globalConfigKey = projectConfig.globalConfigKey || Object.keys(projectConfig.configs)[0];
        return projectConfig.configs[globalConfigKey];
    }
    createModuleConfigCache() {
        return {
            moduleDependMap: {},
            moduleDependedMap: {},
            nativeCodeModules: [],
            moduleCmakeConfig: {},
            features: {},
            moduleTreeDump: {
                default: {},
                categories: {},
            },
            ignoreModules,
            envLimitModule: {},
        };
    }
    initModuleConfigCache(engineRoot) {
        try {
            this.initRenderConfig2ModuleConfigCache((0, dynamic_metadata_1.getEngineRenderConfig)(engineRoot));
        }
        catch (error) {
            // A missing or malformed custom-engine config must not leave a partially derived cache behind.
            this.moduleConfigCache = this.createModuleConfigCache();
            console.warn('[Engine] Failed to initialize engine module configuration from engine source.', error);
        }
    }
    initRenderConfig2ModuleConfigCache(modulesInfo) {
        // Build into a fresh object and publish it only when complete, avoiding stale or partial engine data.
        const moduleConfigCache = this.createModuleConfigCache();
        const moduleTreeDumpCategories = {};
        Object.entries(modulesInfo.categories).forEach(([key, category]) => {
            // render-config categories contain metadata only; `modules` belongs to the derived display tree.
            moduleTreeDumpCategories[key] = {
                ...(0, lodash_1.cloneDeep)(category),
                modules: {},
            };
        });
        const addModule = (key, moduleItem) => {
            moduleConfigCache.features[key] = moduleItem;
            if (moduleItem.cmakeConfig) {
                moduleConfigCache.moduleCmakeConfig[key] = {
                    native: moduleItem.cmakeConfig,
                };
            }
            if (moduleItem.isNativeModule) {
                moduleConfigCache.nativeCodeModules.push(key);
            }
            if (moduleItem.envCondition) {
                moduleConfigCache.envLimitModule[key] = {
                    envList: extractMacros(moduleItem.envCondition),
                    fallback: moduleItem.fallback,
                };
            }
            if (moduleItem.dependencies) {
                moduleConfigCache.moduleDependMap[key] = moduleItem.dependencies;
                moduleItem.dependencies.forEach((module) => {
                    moduleConfigCache.moduleDependedMap[module] = moduleConfigCache.moduleDependedMap[module] || [];
                    moduleConfigCache.moduleDependedMap[module].push(key);
                });
            }
        };
        const addModuleOrGroup = (key, moduleItem) => {
            // Keep groups for the settings UI, while flattening their options for build-time lookups.
            moduleConfigCache.features[key] = moduleItem;
            if ('options' in moduleItem) {
                Object.entries(moduleItem.options).forEach(([moduleId, module]) => {
                    addModule(moduleId, module);
                });
            }
            else {
                addModule(key, moduleItem);
            }
        };
        Object.entries(modulesInfo.features).forEach(([key, moduleItem]) => {
            addModuleOrGroup(key, moduleItem);
            if (!ignoreModules.includes(key)) {
                if (moduleItem.category && moduleTreeDumpCategories[moduleItem.category]) {
                    moduleTreeDumpCategories[moduleItem.category].modules[key] = moduleItem;
                }
                else {
                    moduleConfigCache.moduleTreeDump.default[key] = moduleItem;
                }
            }
        });
        moduleConfigCache.moduleTreeDump.categories = moduleTreeDumpCategories;
        this.moduleConfigCache = moduleConfigCache;
    }
    moduleConfigCache = this.createModuleConfigCache();
    get type() {
        return this._config.includeModules.includes('3d') ? '3d' : '2d';
    }
    getInfo() {
        if (!this._init) {
            throw new Error('Engine not init');
        }
        return this._info;
    }
    getConfig(useDefault) {
        if (useDefault) {
            return this.defaultConfig;
        }
        if (!this._init) {
            throw new Error('Engine not init');
        }
        return this._config;
    }
    // TODO 对外开发一些 compile 已写好的接口
    /**
     * TODO 初始化配置等
     */
    async init(enginePath) {
        if (this._init) {
            return this;
        }
        this._info.typescript.builtin = this._info.typescript.path = enginePath;
        this._info.native.builtin = this._info.native.path = (0, path_1.join)(enginePath, 'native');
        this._info.version = await Promise.resolve(`${(0, path_1.join)(enginePath, 'package.json')}`).then(s => __importStar(require(s))).then((pkg) => pkg.version);
        this._info.tmpDir = (0, path_1.join)(enginePath, '.temp');
        this._loadEngineI18n(enginePath);
        this.initModuleConfigCache(this._info.typescript.path);
        this._defaultConfig = this.resolveDefaultConfig(this._info.typescript.path);
        const configInstance = await configuration_1.configurationRegistry.register('engine', {
            defaults: this.defaultConfig,
            nodes: () => (0, metadata_1.createEngineMetadataNodes)({
                defaultConfig: this.defaultConfig,
                engineRoot: this._info.typescript.path,
            }),
        });
        this._configInstance = configInstance;
        const syncConfig = () => {
            const projectConfig = configInstance.getAll() || {};
            const mergedConfig = (0, lodash_1.merge)((0, lodash_1.cloneDeep)(configInstance.getDefaultConfig() || {}), projectConfig);
            const moduleConfig = this.getSelectedModuleProjectConfig(mergedConfig);
            if (moduleConfig) {
                if (!Object.prototype.hasOwnProperty.call(projectConfig, 'includeModules')) {
                    mergedConfig.includeModules = moduleConfig.includeModules;
                }
                if (!Object.prototype.hasOwnProperty.call(projectConfig, 'flags')) {
                    mergedConfig.flags = moduleConfig.flags;
                }
                if (!Object.prototype.hasOwnProperty.call(projectConfig, 'noDeprecatedFeatures')) {
                    mergedConfig.noDeprecatedFeatures = moduleConfig.noDeprecatedFeatures;
                }
            }
            mergedConfig.macroConfig = (0, graphics_config_1.ensureCustomPipelineMacroConfig)(mergedConfig.macroConfig);
            if ((0, graphics_config_1.hasOwnConfigKey)(projectConfig, 'graphics')) {
                mergedConfig.graphics = (0, graphics_config_1.mergeGraphicsConfigWithModules)(mergedConfig.includeModules, projectConfig.graphics);
                mergedConfig.includeModules = (0, graphics_config_1.normalizeIncludeModulesWithGraphics)(mergedConfig.includeModules, mergedConfig.graphics);
            }
            else if ((0, graphics_config_1.hasOwnConfigKey)(projectConfig, 'customPipeline')) {
                mergedConfig.graphics = (0, graphics_config_1.deriveGraphicsConfigFromCustomPipeline)(mergedConfig.customPipeline, mergedConfig.includeModules);
                mergedConfig.includeModules = (0, graphics_config_1.normalizeIncludeModulesWithGraphics)(mergedConfig.includeModules, mergedConfig.graphics);
            }
            else {
                mergedConfig.graphics = (0, graphics_config_1.deriveGraphicsConfigFromModules)(mergedConfig.includeModules);
            }
            const graphics = mergedConfig.graphics ?? (0, graphics_config_1.deriveGraphicsConfigFromModules)(mergedConfig.includeModules);
            mergedConfig.graphics = graphics;
            mergedConfig.customPipeline = graphics.pipeline === graphics_config_1.CUSTOM_PIPELINE_MODULE;
            this._config = mergedConfig;
        };
        syncConfig();
        configInstance.on('configuration:save', syncConfig);
        this._init = true;
        return this;
    }
    async importEditorExtensions() {
        // @ts-ignore
        globalThis.EditorExtends = await Promise.resolve().then(() => __importStar(require('./editor-extends')));
        // 注意：目前 utils 用的是 UUID，EditorExtends 用的是 Uuid 
        // @ts-ignore
        globalThis.EditorExtends.UuidUtils.compressUuid = globalThis.EditorExtends.UuidUtils.compressUUID;
    }
    async initEditorExtensions() {
        // @ts-ignore
        await globalThis.EditorExtends.init();
    }
    /**
     * 加载以及初始化引擎环境
     * @param info 初始化引擎数据
     * @param onBeforeGameInit - 在初始化之前需要做的工作
     * @param onAfterGameInit - 在初始化之后需要做的工作
     */
    async initEngine(info, onBeforeGameInit, onAfterGameInit) {
        const { default: preload } = await Promise.resolve().then(() => __importStar(require('cc/preload')));
        await this.importEditorExtensions();
        await preload({
            engineRoot: this._info.typescript.path,
            engineDev: (0, path_1.join)(this._info.typescript.path, 'bin', '.cache', 'dev-cli'),
            writablePath: info.writablePath,
            requiredModules: [
                'cc',
                'cc/editor/populate-internal-constants',
                'cc/editor/serialization',
                'cc/editor/new-gen-anim',
                'cc/editor/embedded-player',
                'cc/editor/reflection-probe',
                'cc/editor/lod-group-utils',
                'cc/editor/material',
                'cc/editor/2d-misc',
                'cc/editor/offline-mappings',
                'cc/editor/custom-pipeline',
                'cc/editor/animation-clip-migration',
                'cc/editor/exotic-animation',
                'cc/editor/color-utils',
            ]
        });
        await this.initEditorExtensions();
        const modules = this.getConfig().includeModules || [];
        const { physicsConfig, macroConfig, customLayers, sortingLayers, highQuality, renderPipeline, customPipeline, customJointTextureLayouts } = this.getConfig();
        const enableCustomPipeline = info.enableCustomPipeline ?? customPipeline;
        const bundles = assets_1.assetManager.queryAssets({ isBundle: true }).map((item) => item.meta?.userData?.bundleName ?? item.name);
        const builtinAssets = info.serverURL && await this.queryInternalAssetList(this.getInfo().typescript.path);
        const resolvedCustomJointTextureLayouts = await (0, joint_texture_layout_1.resolveCustomJointTextureLayouts)(customJointTextureLayouts);
        const defaultConfig = {
            debugMode: cc.debug.DebugMode.WARN,
            overrideSettings: {
                engine: {
                    builtinAssets: builtinAssets || [],
                    macros: macroConfig,
                    sortingLayers,
                    customLayers: customLayers.map((layer) => {
                        const index = layerMask.findIndex((num) => { return layer.value === num; });
                        return {
                            name: layer.name,
                            bit: index,
                        };
                    }),
                },
                profiling: {
                    showFPS: false,
                },
                screen: {
                    frameRate: 30,
                    exactFitScreen: true,
                },
                rendering: {
                    renderMode: 3,
                    renderPipeline,
                    customPipeline: enableCustomPipeline,
                    highQualityMode: highQuality,
                    ...(enableCustomPipeline && info.serverURL ? { effectSettingsPath: `${info.serverURL}/scripting/engine/effect-settings` } : {}),
                },
                animation: {
                    customJointTextureLayouts: resolvedCustomJointTextureLayouts,
                },
                physics: {
                    ...physicsConfig,
                    // 物理引擎如果没有明确设置，默认是开启的，因此需要明确定义为false
                    enabled: info.serverURL ? true : false,
                },
                assets: {
                    importBase: info.importBase,
                    nativeBase: info.nativeBase,
                    remoteBundles: ['internal', 'main'].concat(bundles),
                    server: info.serverURL,
                }
            },
            exactFitScreen: true,
        };
        cc.physics.selector.runInEditor = true;
        if (onBeforeGameInit) {
            await onBeforeGameInit();
        }
        await cc.game.init(defaultConfig);
        if (onAfterGameInit) {
            await onAfterGameInit();
        }
        let backend = 'builtin';
        let backend2d = 'builtin';
        modules.forEach((module) => {
            if (module in Backends) {
                // @ts-ignore
                backend = Backends[module];
            }
            else if (module in Backends2D) {
                // @ts-ignore
                backend2d = Backends2D[module];
            }
        });
        // 切换物理引擎
        cc.physics.selector.switchTo(backend);
        // 禁用计算，避免刚体在tick的时候生效
        // cc.physics.PhysicsSystem.instance.enable = false;
        // @ts-ignore
        // window.cc.internal.physics2d.selector.switchTo(backend2d);
        return this;
    }
    async getGameConfig(serverURL, importBase, nativeBase, isPreview) {
        const { physicsConfig, macroConfig, customLayers, sortingLayers, highQuality, renderPipeline, customPipeline, customJointTextureLayouts } = this.getConfig();
        const bundles = assets_1.assetManager.queryAssets({ isBundle: true }).map((item) => item.meta?.userData?.bundleName ?? item.name);
        const builtinAssets = serverURL && await this.queryInternalAssetList(this.getInfo().typescript.path);
        const resolvedCustomJointTextureLayouts = await (0, joint_texture_layout_1.resolveCustomJointTextureLayouts)(customJointTextureLayouts);
        return {
            debugMode: cc.debug.DebugMode.WARN,
            overrideSettings: {
                engine: {
                    builtinAssets: builtinAssets || [],
                    macros: macroConfig,
                    sortingLayers,
                    customLayers: customLayers.map((layer) => {
                        const index = layerMask.findIndex((num) => { return layer.value === num; });
                        return {
                            name: layer.name,
                            bit: index,
                        };
                    }),
                },
                profiling: {
                    showFPS: isPreview ? true : false,
                },
                screen: {
                    frameRate: 30,
                    exactFitScreen: true,
                    designResolution: this.getConfig().designResolution,
                },
                rendering: {
                    renderMode: 2,
                    renderPipeline,
                    customPipeline,
                    highQualityMode: highQuality,
                    ...(customPipeline ? { effectSettingsPath: `${serverURL}/scripting/engine/effect-settings` } : {}),
                },
                animation: {
                    customJointTextureLayouts: resolvedCustomJointTextureLayouts,
                },
                physics: {
                    ...physicsConfig,
                    // 物理引擎如果没有明确设置，默认是开启的，因此需要明确定义为false
                    enabled: serverURL ? true : false,
                },
                assets: {
                    importBase: importBase,
                    nativeBase: nativeBase,
                    remoteBundles: ['internal', 'main'].concat(bundles),
                    server: serverURL,
                }
            },
            exactFitScreen: true,
        };
    }
    getModules() {
        return this.getConfig().includeModules || [];
    }
    async queryInternalAssetList(enginePath) {
        // 添加引擎依赖的预加载内置资源到主包内
        const ccConfigJson = await fs_extra_1.default.readJSON((0, path_1.join)(enginePath, 'cc.config.json'));
        const internalAssets = [];
        for (const featureName in ccConfigJson.features) {
            if (ccConfigJson.features[featureName].dependentAssets) {
                internalAssets.push(...ccConfigJson.features[featureName].dependentAssets);
            }
        }
        return Array.from(new Set(internalAssets));
    }
    /**
     * TODO
     * @returns
     */
    queryModuleConfig() {
        return this.moduleConfigCache;
    }
    queryRenderConfig() {
        if (!this._init) {
            throw new Error('Engine not init');
        }
        return (0, dynamic_metadata_1.getEngineRenderConfig)(this._info.typescript.path);
    }
    queryLocalizedRenderConfig() {
        if (!this._init) {
            throw new Error('Engine not init');
        }
        return (0, dynamic_metadata_1.getLocalizedEngineRenderConfig)(this._info.typescript.path);
    }
    async queryJointTextureLayoutPreview() {
        const { customJointTextureLayouts } = this.getConfig();
        return (0, joint_texture_layout_1.queryJointTextureLayoutPreview)(customJointTextureLayouts);
    }
    async queryLayerBuiltin() {
        const { Layers } = await Promise.resolve().then(() => __importStar(require('cc')));
        const LAYER_NONE = 0;
        const LAYER_ALL = 0xffffffff;
        const entries = Object.entries(Layers.Enum);
        return entries
            .filter(([, value]) => value !== LAYER_NONE && value !== LAYER_ALL)
            .map(([name, value]) => ({ name, value }));
    }
    async querySortingLayerBuiltin() {
        const { SortingLayers } = await Promise.resolve().then(() => __importStar(require('cc')));
        return SortingLayers.getBuiltinLayers();
    }
}
const Engine = new EngineManager();
exports.Engine = Engine;
/**
 * 初始化 engine
 * @param enginePath
 * @param projectPath
 * @param serverURL
 */
async function initEngine(enginePath, projectPath, serverURL) {
    await Engine.init(enginePath);
    // 这里 importBase 与 nativeBase 用服务器是为了让服务器转换资源真实存放的路径
    await Engine.initEngine({
        serverURL: serverURL,
        importBase: serverURL ?? (0, path_1.join)(projectPath, 'library'),
        nativeBase: serverURL ?? (0, path_1.join)(projectPath, 'library'),
        writablePath: (0, path_1.join)(projectPath, 'temp'),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9lbmdpbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbXNCQSxnQ0FTQztBQTVzQkQsd0RBQTJCO0FBQzNCLDJCQUF1RDtBQUl2RCwrQkFBNEI7QUFDNUIsbUNBQTBDO0FBQzFDLG9EQUE2RTtBQUM3RSxzQ0FBeUM7QUFDekMseURBQStIO0FBQy9ILHlDQUF1RDtBQUN2RCx3REFBZ0M7QUFDaEMsdURBVTJCO0FBQzNCLGlFQUdnQztBQWtCaEMsTUFBTSxTQUFTLEdBQWEsRUFBRSxDQUFDO0FBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUMzQixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBRUQsTUFBTSxRQUFRLEdBQUc7SUFDYixnQkFBZ0IsRUFBRSxXQUFXO0lBQzdCLGNBQWMsRUFBRSxRQUFRO0lBQ3hCLGlCQUFpQixFQUFFLFNBQVM7SUFDNUIsZUFBZSxFQUFFLE9BQU87Q0FDM0IsQ0FBQztBQUVGLE1BQU0sVUFBVSxHQUFHO0lBQ2Ysa0JBQWtCLEVBQUUsT0FBTztJQUMzQix1QkFBdUIsRUFBRSxZQUFZO0lBQ3JDLG9CQUFvQixFQUFFLFNBQVM7Q0FDbEMsQ0FBQztBQUVGLHFFQUFxRTtBQUNyRSxzQ0FBc0M7QUFDdEMsdUZBQXVGO0FBQ3ZGLHVCQUF1QjtBQUN2QixNQUFNLGFBQWEsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUM7QUFFdkQsU0FBUyxhQUFhLENBQUMsVUFBa0I7SUFDckMsd0ZBQXdGO0lBQ3hGLE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFD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QUFDLEtBQUssS0FBSyxVQUFVLElBQUksS0FBSyxLQUFLLFNBQVMsQ0FBQzthQUNsRSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELEtBQUssQ0FBQyx3QkFBd0I7UUFDMUIsTUFBTSxFQUFFLGFBQWEsRUFBRSxHQUFHLHdEQUFhLElBQUksR0FBQyxDQUFDO1FBRTdDLE9BQU8sYUFBYSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUMsQ0FBQztDQUNKO0FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQztBQUUxQix3QkFBTTtBQUVmOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLFVBQVUsQ0FBQyxVQUFrQixFQUFFLFdBQW1CLEVBQUUsU0FBa0I7SUFDeEYsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzlCLG9EQUFvRDtJQUNwRCxNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDcEIsU0FBUyxFQUFFLFNBQVM7UUFDcEIsVUFBVSxFQUFFLFNBQVMsSUFBSSxJQUFBLFdBQUksRUFBQyxXQUFXLEVBQUUsU0FBUyxDQUFDO1FBQ3JELFVBQVUsRUFBRSxTQUFTLElBQUksSUFBQSxXQUFJLEVBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQztRQUNyRCxZQUFZLEVBQUUsSUFBQSxXQUFJLEVBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQztLQUMxQyxDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzZSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkZGlyU3luYywgc3RhdFN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBFbmdpbmVJbmZvIH0gZnJvbSAnLi9AdHlwZXMvcHVibGljJztcbmltcG9ydCB0eXBlIHsgSUVuZ2luZUNvbmZpZywgSUVuZ2luZVByb2plY3RDb25maWcsIElJbml0RW5naW5lSW5mbywgSUpvaW50VGV4dHVyZUxheW91dFByZXZpZXdSZXN1bHQgfSBmcm9tICcuL0B0eXBlcy9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBDYXRlZ29yeURldGFpbCwgSUZlYXR1cmVJdGVtLCBJTW9kdWxlQ29uZmlnLCBJTW9kdWxlSXRlbSwgTW9kdWxlUmVuZGVyQ29uZmlnIH0gZnJvbSAnLi9AdHlwZXMvbW9kdWxlcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjbG9uZURlZXAsIG1lcmdlIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IGNvbmZpZ3VyYXRpb25SZWdpc3RyeSwgSUJhc2VDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vY29uZmlndXJhdGlvbic7XG5pbXBvcnQgeyBhc3NldE1hbmFnZXIgfSBmcm9tICcuLi9hc3NldHMnO1xuaW1wb3J0IHsgZ2V0RW5naW5lRHluYW1pY0NvbmZpZ0NvbnRyaWJ1dGlvbiwgZ2V0RW5naW5lUmVuZGVyQ29uZmlnLCBnZXRMb2NhbGl6ZWRFbmdpbmVSZW5kZXJDb25maWcgfSBmcm9tICcuL2R5bmFtaWMtbWV0YWRhdGEnO1xuaW1wb3J0IHsgY3JlYXRlRW5naW5lTWV0YWRhdGFOb2RlcyB9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IGkxOG4gZnJvbSAnLi4vYmFzZS9pMThuJztcbmltcG9ydCB7XG4gICAgQ1VTVE9NX1BJUEVMSU5FX01PRFVMRSxcbiAgICBDVVNUT01fUElQRUxJTkVfTkFNRV9LRVksXG4gICAgREVGQVVMVF9DVVNUT01fUElQRUxJTkVfTkFNRSxcbiAgICBkZXJpdmVHcmFwaGljc0NvbmZpZ0Zyb21DdXN0b21QaXBlbGluZSxcbiAgICBkZXJpdmVHcmFwaGljc0NvbmZpZ0Zyb21Nb2R1bGVzLFxuICAgIGVuc3VyZUN1c3RvbVBpcGVsaW5lTWFjcm9Db25maWcsXG4gICAgaGFzT3duQ29uZmlnS2V5LFxuICAgIG1lcmdlR3JhcGhpY3NDb25maWdXaXRoTW9kdWxlcyxcbiAgICBub3JtYWxpemVJbmNsdWRlTW9kdWxlc1dpdGhHcmFwaGljcyxcbn0gZnJvbSAnLi9ncmFwaGljcy1jb25maWcnO1xuaW1wb3J0IHtcbiAgICBxdWVyeUpvaW50VGV4dHVyZUxheW91dFByZXZpZXcgYXMgY3JlYXRlSm9pbnRUZXh0dXJlTGF5b3V0UHJldmlldyxcbiAgICByZXNvbHZlQ3VzdG9tSm9pbnRUZXh0dXJlTGF5b3V0cyxcbn0gZnJvbSAnLi9qb2ludC10ZXh0dXJlLWxheW91dCc7XG5cbi8qKlxuICog5pW05ZCIIGVuZ2luZSDnmoTkuIDkupvnvJbor5HjgIHphY3nva7or7vlj5bnrYnlip/og71cbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIElFbmdpbmUge1xuICAgIGdldEluZm8oKTogRW5naW5lSW5mbztcbiAgICBnZXRDb25maWcoKTogSUVuZ2luZUNvbmZpZztcbiAgICBpbml0KGVuZ2luZVBhdGg6IHN0cmluZyk6IFByb21pc2U8dGhpcz47XG4gICAgaW5pdEVuZ2luZShpbmZvOiBJSW5pdEVuZ2luZUluZm8pOiBQcm9taXNlPHRoaXM+O1xuICAgIHF1ZXJ5UmVuZGVyQ29uZmlnKCk6IE1vZHVsZVJlbmRlckNvbmZpZztcbiAgICBxdWVyeUxvY2FsaXplZFJlbmRlckNvbmZpZygpOiBNb2R1bGVSZW5kZXJDb25maWc7XG4gICAgcXVlcnlKb2ludFRleHR1cmVMYXlvdXRQcmV2aWV3KCk6IFByb21pc2U8SUpvaW50VGV4dHVyZUxheW91dFByZXZpZXdSZXN1bHQ+O1xuICAgIHF1ZXJ5TGF5ZXJCdWlsdGluKCk6IFByb21pc2U8eyBuYW1lOiBzdHJpbmc7IHZhbHVlOiBudW1iZXIgfVtdPjtcbiAgICBxdWVyeVNvcnRpbmdMYXllckJ1aWx0aW4oKTogUHJvbWlzZTxSZWFkb25seUFycmF5PHsgaWQ6IG51bWJlcjsgbmFtZTogc3RyaW5nOyB2YWx1ZTogbnVtYmVyIH0+Pjtcbn1cblxuY29uc3QgbGF5ZXJNYXNrOiBudW1iZXJbXSA9IFtdO1xuZm9yIChsZXQgaSA9IDA7IGkgPD0gMTk7IGkrKykge1xuICAgIGxheWVyTWFza1tpXSA9IDEgPDwgaTtcbn1cblxuY29uc3QgQmFja2VuZHMgPSB7XG4gICAgJ3BoeXNpY3MtY2Fubm9uJzogJ2Nhbm5vbi5qcycsXG4gICAgJ3BoeXNpY3MtYW1tbyc6ICdidWxsZXQnLFxuICAgICdwaHlzaWNzLWJ1aWx0aW4nOiAnYnVpbHRpbicsXG4gICAgJ3BoeXNpY3MtcGh5c3gnOiAncGh5c3gnLFxufTtcblxuY29uc3QgQmFja2VuZHMyRCA9IHtcbiAgICAncGh5c2ljcy0yZC1ib3gyZCc6ICdib3gyZCcsXG4gICAgJ3BoeXNpY3MtMmQtYm94MmQtd2FzbSc6ICdib3gyZC13YXNtJyxcbiAgICAncGh5c2ljcy0yZC1idWlsdGluJzogJ2J1aWx0aW4nLFxufTtcblxuLy8gVE9ETyBpc3N1ZSDorrDlvZXvvJogaHR0cHM6Ly9naXRodWIuY29tL2NvY29zLzNkLXRhc2tzL2lzc3Vlcy8xODQ4OSDlkI7nu63lrozlloRcbi8vIOWQjuWkhOeQhueuoee6v+aooeWdl+eahOW8gOWFs++8jOWcqOWbvuWDj+iuvue9rumCo+i+ueWkhOeQhiAo6K+05pivIDMuOSDkvJrlvbvlupXliKDpmaQpXG4vLyDmiYDku6XnlYzpnaLkuIrnmoQg5Yu+6YCJ5Yqo5L2cIOWSjCDnirbmgIHliKTmlq0g6YO96KaB5b+955Wl6L+Z5Liq5YiX6KGo55qE5pWw5o2u77yM5LuOIDMuOC42IOW8gOWni+aIkeWwhui/meS4qiBpZ25vcmVLZXlzIOaUueaIkCBpZ25vcmVNb2R1bGVzIOS7jiDop4blm77lsYLnp7vliLDkuLvov5vnqItcbi8vIOebtOaOpeWcqOaVsOaNrua6kOS4iui/h+a7pOaOie+8jOWHj+WwkSDop4blm77lsYLnmoTliKTmlq1cbmNvbnN0IGlnbm9yZU1vZHVsZXMgPSBbJ2N1c3RvbS1waXBlbGluZS1wb3N0LXByb2Nlc3MnXTtcblxuZnVuY3Rpb24gZXh0cmFjdE1hY3JvcyhleHByZXNzaW9uOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgLy8gZW52Q29uZGl0aW9uIHVzZXMgYSBzbWFsbCBcIiRNQUNSTyB8fCAkTUFDUk9cIiBncmFtbWFyIHNoYXJlZCB3aXRoIHRoZSBlbmdpbmUgY29tcGlsZXIuXG4gICAgcmV0dXJuIGV4cHJlc3Npb24uc3BsaXQoJ3x8JykubWFwKG1hdGNoID0+IG1hdGNoLnRyaW0oKS5zdWJzdHJpbmcoMSkpO1xufVxuXG5jbGFzcyBFbmdpbmVNYW5hZ2VyIGltcGxlbWVudHMgSUVuZ2luZSB7XG4gICAgcHJpdmF0ZSBfaW5pdDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2luZm86IEVuZ2luZUluZm8gPSB7XG4gICAgICAgIHZlcnNpb246ICczLjguOCcsXG4gICAgICAgIHRtcERpcjogJycsXG4gICAgICAgIHR5cGVzY3JpcHQ6IHtcbiAgICAgICAgICAgIHBhdGg6ICcnLFxuICAgICAgICAgICAgdHlwZTogJ2J1aWx0aW4nLFxuICAgICAgICAgICAgYnVpbHRpbjogJycsXG4gICAgICAgIH0sXG4gICAgICAgIG5hdGl2ZToge1xuICAgICAgICAgICAgcGF0aDogJycsXG4gICAgICAgICAgICB0eXBlOiAnYnVpbHRpbicsXG4gICAgICAgICAgICBidWlsdGluOiAnJyxcbiAgICAgICAgfVxuICAgIH07XG4gICAgcHJpdmF0ZSBfZGVmYXVsdENvbmZpZzogSUVuZ2luZUNvbmZpZyA9IHRoaXMuY3JlYXRlRmFsbGJhY2tEZWZhdWx0Q29uZmlnKCk7XG4gICAgcHJpdmF0ZSBfY29uZmlnOiBJRW5naW5lQ29uZmlnID0gY2xvbmVEZWVwKHRoaXMuX2RlZmF1bHRDb25maWcpO1xuICAgIHByaXZhdGUgX2NvbmZpZ0luc3RhbmNlITogSUJhc2VDb25maWd1cmF0aW9uO1xuXG4gICAgcHJpdmF0ZSBnZXQgZGVmYXVsdENvbmZpZygpOiBJRW5naW5lQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNsb25lRGVlcCh0aGlzLl9kZWZhdWx0Q29uZmlnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliqDovb3lvJXmk47ljIXnmoQgaTE4biDmlofku7bvvIguanMgQ29tbW9uSlMg5qih5Z2X77yJXG4gICAgICog5bCGIHBhY2thZ2VzL2VuZ2luZS9lZGl0b3IvaTE4bi97bGFuZ30vKi5qcyDms6jlhozliLAgRU5HSU5FLiog5ZG95ZCN56m66Ze0XG4gICAgICog6YCS5b2S5aSE55CG5a2Q55uu5b2V77yI5aaCIG1vZHVsZXMvcGh5c2ljcy5qcyDihpIgRU5HSU5FLnBoeXNpY3MuKu+8iVxuICAgICAqL1xuICAgIHByaXZhdGUgX2xvYWRFbmdpbmVJMThuKGVuZ2luZVBhdGg6IHN0cmluZykge1xuICAgICAgICBjb25zdCBpMThuRGlyID0gam9pbihlbmdpbmVQYXRoLCAnZWRpdG9yJywgJ2kxOG4nKTtcbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKGkxOG5EaXIpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2FkRGlyID0gKGRpcjogc3RyaW5nLCBsYW5nOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICByZWFkZGlyU3luYyhkaXIpLmZvckVhY2goKGVudHJ5KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBqb2luKGRpciwgZW50cnkpO1xuICAgICAgICAgICAgICAgIGlmIChlbnRyeS5lbmRzV2l0aCgnLmpzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gcmVxdWlyZS5yZXNvbHZlKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSByZXF1aXJlKHJlc29sdmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkxOG4ucmVnaXN0ZXJMYW5ndWFnZVBhdGNoKGxhbmcsIHByZWZpeCwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtpMThuXSBGYWlsZWQgdG8gbG9hZCBlbmdpbmUgaTE4bjogJHtmdWxsUGF0aH1gLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRTeW5jKGZ1bGxQYXRoKS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWREaXIoZnVsbFBhdGgsIGxhbmcsIHByZWZpeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yIChjb25zdCBsYW5nIG9mIFsnemgnLCAnZW4nXSkge1xuICAgICAgICAgICAgY29uc3QgbGFuZ0RpciA9IGpvaW4oaTE4bkRpciwgbGFuZyk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0c1N5bmMobGFuZ0RpcikpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvYWREaXIobGFuZ0RpciwgbGFuZywgJ0VOR0lORScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVGYWxsYmFja0RlZmF1bHRDb25maWcoKTogSUVuZ2luZUNvbmZpZyB7XG4gICAgICAgIGNvbnN0IGluY2x1ZGVNb2R1bGVzID0gW1xuICAgICAgICAgICAgJzJkJyxcbiAgICAgICAgICAgICczZCcsXG4gICAgICAgICAgICAnZGVidWctcmVuZGVyZXInLFxuICAgICAgICAgICAgJ2FmZmluZS10cmFuc2Zvcm0nLFxuICAgICAgICAgICAgJ2FuaW1hdGlvbicsXG4gICAgICAgICAgICAnYXVkaW8nLFxuICAgICAgICAgICAgJ2Jhc2UnLFxuICAgICAgICAgICAgJ2N1c3RvbS1waXBlbGluZScsXG4gICAgICAgICAgICAnZHJhZ29uLWJvbmVzJyxcbiAgICAgICAgICAgICdnZngtd2ViZ2wnLFxuICAgICAgICAgICAgJ2dyYXBoaWNzJyxcbiAgICAgICAgICAgICdpbnRlcnNlY3Rpb24tMmQnLFxuICAgICAgICAgICAgJ2xpZ2h0LXByb2JlJyxcbiAgICAgICAgICAgICdtYXJpb25ldHRlJyxcbiAgICAgICAgICAgICdtYXNrJyxcbiAgICAgICAgICAgICdwYXJ0aWNsZScsXG4gICAgICAgICAgICAncGFydGljbGUtMmQnLFxuICAgICAgICAgICAgJ3BoeXNpY3MtMmQtYm94MmQnLFxuICAgICAgICAgICAgJ3BoeXNpY3MtYW1tbycsXG4gICAgICAgICAgICAncHJpbWl0aXZlJyxcbiAgICAgICAgICAgICdwcm9maWxlcicsXG4gICAgICAgICAgICAncmljaC10ZXh0JyxcbiAgICAgICAgICAgICdza2VsZXRhbC1hbmltYXRpb24nLFxuICAgICAgICAgICAgJ3NwaW5lLTMuOCcsXG4gICAgICAgICAgICAndGVycmFpbicsXG4gICAgICAgICAgICAndGlsZWQtbWFwJyxcbiAgICAgICAgICAgICd0d2VlbicsXG4gICAgICAgICAgICAndWknLFxuICAgICAgICAgICAgJ3VpLXNrZXcnLFxuICAgICAgICAgICAgJ3ZpZGVvJyxcbiAgICAgICAgICAgICd3ZWJzb2NrZXQnLFxuICAgICAgICAgICAgJ3dlYnZpZXcnXG4gICAgICAgIF07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluY2x1ZGVNb2R1bGVzLFxuICAgICAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgICAgICBMT0FEX0JVTExFVF9NQU5VQUxMWTogZmFsc2UsXG4gICAgICAgICAgICAgICAgTE9BRF9TUElORV9NQU5VQUxMWTogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwaHlzaWNzQ29uZmlnOiB7XG4gICAgICAgICAgICAgICAgZ3Jhdml0eTogeyB4OiAwLCB5OiAtMTAsIHo6IDAgfSxcbiAgICAgICAgICAgICAgICBhbGxvd1NsZWVwOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNsZWVwVGhyZXNob2xkOiAwLjEsXG4gICAgICAgICAgICAgICAgYXV0b1NpbXVsYXRpb246IHRydWUsXG4gICAgICAgICAgICAgICAgZml4ZWRUaW1lU3RlcDogMSAvIDYwLFxuICAgICAgICAgICAgICAgIG1heFN1YlN0ZXBzOiAxLFxuICAgICAgICAgICAgICAgIGRlZmF1bHRNYXRlcmlhbDogJycsXG4gICAgICAgICAgICAgICAgdXNlTm9kZUNoYWluczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb2xsaXNpb25NYXRyaXg6IHsgMDogMSB9LFxuICAgICAgICAgICAgICAgIHBoeXNpY3NFbmdpbmU6ICcnLFxuICAgICAgICAgICAgICAgIHBoeXNYOiB7XG4gICAgICAgICAgICAgICAgICAgIG5vdFBhY2tQaHlzWExpYnM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtdWx0aVRocmVhZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHN1YlRocmVhZENvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICBlcHNpbG9uOiAwLjAwMDEsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoaWdoUXVhbGl0eTogZmFsc2UsXG4gICAgICAgICAgICBjdXN0b21MYXllcnM6IFtdLFxuICAgICAgICAgICAgc29ydGluZ0xheWVyczogW10sXG4gICAgICAgICAgICBtYWNyb0N1c3RvbTogW10sXG4gICAgICAgICAgICAvLyBUT0RPIOS7jiBlbmdpbmUg5YaF5Yid5aeL5YyWXG4gICAgICAgICAgICBtYWNyb0NvbmZpZzoge1xuICAgICAgICAgICAgICAgIEVOQUJMRV9USUxFRE1BUF9DVUxMSU5HOiB0cnVlLFxuICAgICAgICAgICAgICAgIFRPVUNIX1RJTUVPVVQ6IDUwMDAsXG4gICAgICAgICAgICAgICAgRU5BQkxFX1RSQU5TUEFSRU5UX0NBTlZBUzogZmFsc2UsXG4gICAgICAgICAgICAgICAgRU5BQkxFX1dFQkdMX0FOVElBTElBUzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBFTkFCTEVfRkxPQVRfT1VUUFVUOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBDTEVBTlVQX0lNQUdFX0NBQ0hFOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBFTkFCTEVfTVVMVElfVE9VQ0g6IHRydWUsXG4gICAgICAgICAgICAgICAgTUFYX0xBQkVMX0NBTlZBU19QT09MX1NJWkU6IDIwLFxuICAgICAgICAgICAgICAgIEVOQUJMRV9XRUJHTF9ISUdIUF9TVFJVQ1RfVkFMVUVTOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBCQVRDSEVSMkRfTUVNX0lOQ1JFTUVOVDogMTQ0LFxuICAgICAgICAgICAgICAgIFtDVVNUT01fUElQRUxJTkVfTkFNRV9LRVldOiBERUZBVUxUX0NVU1RPTV9QSVBFTElORV9OQU1FLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdyYXBoaWNzOiBkZXJpdmVHcmFwaGljc0NvbmZpZ0Zyb21Nb2R1bGVzKGluY2x1ZGVNb2R1bGVzKSxcbiAgICAgICAgICAgIGN1c3RvbUpvaW50VGV4dHVyZUxheW91dHM6IFtdLFxuICAgICAgICAgICAgc3BsYXNoU2NyZWVuOiB7XG4gICAgICAgICAgICAgICAgZGlzcGxheVJhdGlvOiAxLFxuICAgICAgICAgICAgICAgIHRvdGFsVGltZTogMjAwMCxcbiAgICAgICAgICAgICAgICBsb2dvOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkZWZhdWx0JyxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2U6ICcnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkZWZhdWx0JyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IDAuMDE1Njg2Mjc0NTA5ODAzOSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IDAuMDM1Mjk0MTE3NjQ3MDU4OCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IDAuMDM5MjE1Njg2Mjc0NTA5OCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHc6IDFcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2U6ICcnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3YXRlcm1hcmtMb2NhdGlvbjogJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgIGF1dG9GaXQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXNpZ25SZXNvbHV0aW9uOiB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDEyODAsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiA3MjAsXG4gICAgICAgICAgICAgICAgZml0V2lkdGg6IHRydWUsXG4gICAgICAgICAgICAgICAgZml0SGVpZ2h0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRvd25sb2FkTWF4Q29uY3VycmVuY3k6IDE1LFxuICAgICAgICAgICAgcmVuZGVyUGlwZWxpbmU6ICdmZDhlYzUzNi1hMzU0LTRhMTctOWM3NC00ZjM4ODNjMzc4YzgnLFxuICAgICAgICAgICAgY3VzdG9tUGlwZWxpbmU6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVzb2x2ZURlZmF1bHRDb25maWcoZW5naW5lUm9vdDogc3RyaW5nKTogSUVuZ2luZUNvbmZpZyB7XG4gICAgICAgIGNvbnN0IGZhbGxiYWNrQ29uZmlnID0gdGhpcy5jcmVhdGVGYWxsYmFja0RlZmF1bHRDb25maWcoKTtcbiAgICAgICAgY29uc3QgY29udHJpYnV0aW9uID0gZ2V0RW5naW5lRHluYW1pY0NvbmZpZ0NvbnRyaWJ1dGlvbih7XG4gICAgICAgICAgICBlbmdpbmVSb290LFxuICAgICAgICAgICAgZmFsbGJhY2tDb25maWc6IHtcbiAgICAgICAgICAgICAgICBpbmNsdWRlTW9kdWxlczogZmFsbGJhY2tDb25maWcuaW5jbHVkZU1vZHVsZXMsXG4gICAgICAgICAgICAgICAgZmxhZ3M6IGZhbGxiYWNrQ29uZmlnLmZsYWdzLFxuICAgICAgICAgICAgICAgIG1hY3JvQ29uZmlnOiBmYWxsYmFja0NvbmZpZy5tYWNyb0NvbmZpZyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBpbmNsdWRlTW9kdWxlcyA9IGNvbnRyaWJ1dGlvbi5kZWZhdWx0cy5pbmNsdWRlTW9kdWxlcztcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZmFsbGJhY2tDb25maWcsXG4gICAgICAgICAgICBpbmNsdWRlTW9kdWxlcyxcbiAgICAgICAgICAgIGZsYWdzOiBjb250cmlidXRpb24uZGVmYXVsdHMuZmxhZ3MsXG4gICAgICAgICAgICBtYWNyb0NvbmZpZzogZW5zdXJlQ3VzdG9tUGlwZWxpbmVNYWNyb0NvbmZpZyhjb250cmlidXRpb24uZGVmYXVsdHMubWFjcm9Db25maWcpLFxuICAgICAgICAgICAgZ3JhcGhpY3M6IGRlcml2ZUdyYXBoaWNzQ29uZmlnRnJvbU1vZHVsZXMoaW5jbHVkZU1vZHVsZXMpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0U2VsZWN0ZWRNb2R1bGVQcm9qZWN0Q29uZmlnKHByb2plY3RDb25maWc6IElFbmdpbmVQcm9qZWN0Q29uZmlnKSB7XG4gICAgICAgIGlmICghcHJvamVjdENvbmZpZy5jb25maWdzIHx8IE9iamVjdC5rZXlzKHByb2plY3RDb25maWcuY29uZmlncykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGdsb2JhbENvbmZpZ0tleSA9IHByb2plY3RDb25maWcuZ2xvYmFsQ29uZmlnS2V5IHx8IE9iamVjdC5rZXlzKHByb2plY3RDb25maWcuY29uZmlncylbMF07XG4gICAgICAgIHJldHVybiBwcm9qZWN0Q29uZmlnLmNvbmZpZ3NbZ2xvYmFsQ29uZmlnS2V5XTtcbiAgICB9XG4gICAgcHJpdmF0ZSBjcmVhdGVNb2R1bGVDb25maWdDYWNoZSgpOiBJTW9kdWxlQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1vZHVsZURlcGVuZE1hcDoge30sXG4gICAgICAgICAgICBtb2R1bGVEZXBlbmRlZE1hcDoge30sXG4gICAgICAgICAgICBuYXRpdmVDb2RlTW9kdWxlczogW10sXG4gICAgICAgICAgICBtb2R1bGVDbWFrZUNvbmZpZzoge30sXG4gICAgICAgICAgICBmZWF0dXJlczoge30sXG4gICAgICAgICAgICBtb2R1bGVUcmVlRHVtcDoge1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHt9LFxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IHt9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlnbm9yZU1vZHVsZXMsXG4gICAgICAgICAgICBlbnZMaW1pdE1vZHVsZToge30sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0TW9kdWxlQ29uZmlnQ2FjaGUoZW5naW5lUm9vdDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmluaXRSZW5kZXJDb25maWcyTW9kdWxlQ29uZmlnQ2FjaGUoZ2V0RW5naW5lUmVuZGVyQ29uZmlnKGVuZ2luZVJvb3QpKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIEEgbWlzc2luZyBvciBtYWxmb3JtZWQgY3VzdG9tLWVuZ2luZSBjb25maWcgbXVzdCBub3QgbGVhdmUgYSBwYXJ0aWFsbHkgZGVyaXZlZCBjYWNoZSBiZWhpbmQuXG4gICAgICAgICAgICB0aGlzLm1vZHVsZUNvbmZpZ0NhY2hlID0gdGhpcy5jcmVhdGVNb2R1bGVDb25maWdDYWNoZSgpO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbRW5naW5lXSBGYWlsZWQgdG8gaW5pdGlhbGl6ZSBlbmdpbmUgbW9kdWxlIGNvbmZpZ3VyYXRpb24gZnJvbSBlbmdpbmUgc291cmNlLicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdFJlbmRlckNvbmZpZzJNb2R1bGVDb25maWdDYWNoZShtb2R1bGVzSW5mbzogTW9kdWxlUmVuZGVyQ29uZmlnKSB7XG4gICAgICAgIC8vIEJ1aWxkIGludG8gYSBmcmVzaCBvYmplY3QgYW5kIHB1Ymxpc2ggaXQgb25seSB3aGVuIGNvbXBsZXRlLCBhdm9pZGluZyBzdGFsZSBvciBwYXJ0aWFsIGVuZ2luZSBkYXRhLlxuICAgICAgICBjb25zdCBtb2R1bGVDb25maWdDYWNoZSA9IHRoaXMuY3JlYXRlTW9kdWxlQ29uZmlnQ2FjaGUoKTtcbiAgICAgICAgY29uc3QgbW9kdWxlVHJlZUR1bXBDYXRlZ29yaWVzOiBSZWNvcmQ8c3RyaW5nLCBDYXRlZ29yeURldGFpbD4gPSB7fTtcbiAgICAgICAgT2JqZWN0LmVudHJpZXMobW9kdWxlc0luZm8uY2F0ZWdvcmllcykuZm9yRWFjaCgoW2tleSwgY2F0ZWdvcnldKSA9PiB7XG4gICAgICAgICAgICAvLyByZW5kZXItY29uZmlnIGNhdGVnb3JpZXMgY29udGFpbiBtZXRhZGF0YSBvbmx5OyBgbW9kdWxlc2AgYmVsb25ncyB0byB0aGUgZGVyaXZlZCBkaXNwbGF5IHRyZWUuXG4gICAgICAgICAgICBtb2R1bGVUcmVlRHVtcENhdGVnb3JpZXNba2V5XSA9IHtcbiAgICAgICAgICAgICAgICAuLi5jbG9uZURlZXAoY2F0ZWdvcnkpLFxuICAgICAgICAgICAgICAgIG1vZHVsZXM6IHt9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYWRkTW9kdWxlID0gKGtleTogc3RyaW5nLCBtb2R1bGVJdGVtOiBJRmVhdHVyZUl0ZW0pID0+IHtcbiAgICAgICAgICAgIG1vZHVsZUNvbmZpZ0NhY2hlLmZlYXR1cmVzW2tleV0gPSBtb2R1bGVJdGVtO1xuXG4gICAgICAgICAgICBpZiAobW9kdWxlSXRlbS5jbWFrZUNvbmZpZykge1xuICAgICAgICAgICAgICAgIG1vZHVsZUNvbmZpZ0NhY2hlLm1vZHVsZUNtYWtlQ29uZmlnW2tleV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hdGl2ZTogbW9kdWxlSXRlbS5jbWFrZUNvbmZpZyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1vZHVsZUl0ZW0uaXNOYXRpdmVNb2R1bGUpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVDb25maWdDYWNoZS5uYXRpdmVDb2RlTW9kdWxlcy5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobW9kdWxlSXRlbS5lbnZDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVDb25maWdDYWNoZS5lbnZMaW1pdE1vZHVsZVtrZXldID0ge1xuICAgICAgICAgICAgICAgICAgICBlbnZMaXN0OiBleHRyYWN0TWFjcm9zKG1vZHVsZUl0ZW0uZW52Q29uZGl0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgZmFsbGJhY2s6IG1vZHVsZUl0ZW0uZmFsbGJhY2ssXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtb2R1bGVJdGVtLmRlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgICAgIG1vZHVsZUNvbmZpZ0NhY2hlLm1vZHVsZURlcGVuZE1hcFtrZXldID0gbW9kdWxlSXRlbS5kZXBlbmRlbmNpZXM7XG4gICAgICAgICAgICAgICAgbW9kdWxlSXRlbS5kZXBlbmRlbmNpZXMuZm9yRWFjaCgobW9kdWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZUNvbmZpZ0NhY2hlLm1vZHVsZURlcGVuZGVkTWFwW21vZHVsZV0gPSBtb2R1bGVDb25maWdDYWNoZS5tb2R1bGVEZXBlbmRlZE1hcFttb2R1bGVdIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVDb25maWdDYWNoZS5tb2R1bGVEZXBlbmRlZE1hcFttb2R1bGVdLnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYWRkTW9kdWxlT3JHcm91cCA9IChrZXk6IHN0cmluZywgbW9kdWxlSXRlbTogSU1vZHVsZUl0ZW0pID0+IHtcbiAgICAgICAgICAgIC8vIEtlZXAgZ3JvdXBzIGZvciB0aGUgc2V0dGluZ3MgVUksIHdoaWxlIGZsYXR0ZW5pbmcgdGhlaXIgb3B0aW9ucyBmb3IgYnVpbGQtdGltZSBsb29rdXBzLlxuICAgICAgICAgICAgbW9kdWxlQ29uZmlnQ2FjaGUuZmVhdHVyZXNba2V5XSA9IG1vZHVsZUl0ZW07XG4gICAgICAgICAgICBpZiAoJ29wdGlvbnMnIGluIG1vZHVsZUl0ZW0pIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZW50cmllcyhtb2R1bGVJdGVtLm9wdGlvbnMpLmZvckVhY2goKFttb2R1bGVJZCwgbW9kdWxlXSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhZGRNb2R1bGUobW9kdWxlSWQsIG1vZHVsZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZE1vZHVsZShrZXksIG1vZHVsZUl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKG1vZHVsZXNJbmZvLmZlYXR1cmVzKS5mb3JFYWNoKChba2V5LCBtb2R1bGVJdGVtXSkgPT4ge1xuICAgICAgICAgICAgYWRkTW9kdWxlT3JHcm91cChrZXksIG1vZHVsZUl0ZW0pO1xuICAgICAgICAgICAgaWYgKCFpZ25vcmVNb2R1bGVzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpZiAobW9kdWxlSXRlbS5jYXRlZ29yeSAmJiBtb2R1bGVUcmVlRHVtcENhdGVnb3JpZXNbbW9kdWxlSXRlbS5jYXRlZ29yeV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVHJlZUR1bXBDYXRlZ29yaWVzW21vZHVsZUl0ZW0uY2F0ZWdvcnldLm1vZHVsZXNba2V5XSA9IG1vZHVsZUl0ZW07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlQ29uZmlnQ2FjaGUubW9kdWxlVHJlZUR1bXAuZGVmYXVsdFtrZXldID0gbW9kdWxlSXRlbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBtb2R1bGVDb25maWdDYWNoZS5tb2R1bGVUcmVlRHVtcC5jYXRlZ29yaWVzID0gbW9kdWxlVHJlZUR1bXBDYXRlZ29yaWVzO1xuICAgICAgICB0aGlzLm1vZHVsZUNvbmZpZ0NhY2hlID0gbW9kdWxlQ29uZmlnQ2FjaGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBtb2R1bGVDb25maWdDYWNoZTogSU1vZHVsZUNvbmZpZyA9IHRoaXMuY3JlYXRlTW9kdWxlQ29uZmlnQ2FjaGUoKTtcblxuICAgIGdldCB0eXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnLmluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCczZCcpID8gJzNkJyA6ICcyZCc7XG4gICAgfVxuXG4gICAgZ2V0SW5mbygpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VuZ2luZSBub3QgaW5pdCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9pbmZvO1xuICAgIH1cblxuICAgIGdldENvbmZpZyh1c2VEZWZhdWx0PzogYm9vbGVhbik6IElFbmdpbmVDb25maWcge1xuICAgICAgICBpZiAodXNlRGVmYXVsdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVmYXVsdENvbmZpZztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRW5naW5lIG5vdCBpbml0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZztcbiAgICB9XG5cbiAgICAvLyBUT0RPIOWvueWkluW8gOWPkeS4gOS6myBjb21waWxlIOW3suWGmeWlveeahOaOpeWPo1xuXG4gICAgLyoqXG4gICAgICogVE9ETyDliJ3lp4vljJbphY3nva7nrYlcbiAgICAgKi9cbiAgICBhc3luYyBpbml0KGVuZ2luZVBhdGg6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5faW5pdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5mby50eXBlc2NyaXB0LmJ1aWx0aW4gPSB0aGlzLl9pbmZvLnR5cGVzY3JpcHQucGF0aCA9IGVuZ2luZVBhdGg7XG4gICAgICAgIHRoaXMuX2luZm8ubmF0aXZlLmJ1aWx0aW4gPSB0aGlzLl9pbmZvLm5hdGl2ZS5wYXRoID0gam9pbihlbmdpbmVQYXRoLCAnbmF0aXZlJyk7XG4gICAgICAgIHRoaXMuX2luZm8udmVyc2lvbiA9IGF3YWl0IGltcG9ydChqb2luKGVuZ2luZVBhdGgsICdwYWNrYWdlLmpzb24nKSkudGhlbigocGtnKSA9PiBwa2cudmVyc2lvbik7XG4gICAgICAgIHRoaXMuX2luZm8udG1wRGlyID0gam9pbihlbmdpbmVQYXRoLCAnLnRlbXAnKTtcbiAgICAgICAgdGhpcy5fbG9hZEVuZ2luZUkxOG4oZW5naW5lUGF0aCk7XG4gICAgICAgIHRoaXMuaW5pdE1vZHVsZUNvbmZpZ0NhY2hlKHRoaXMuX2luZm8udHlwZXNjcmlwdC5wYXRoKTtcbiAgICAgICAgdGhpcy5fZGVmYXVsdENvbmZpZyA9IHRoaXMucmVzb2x2ZURlZmF1bHRDb25maWcodGhpcy5faW5mby50eXBlc2NyaXB0LnBhdGgpO1xuICAgICAgICBjb25zdCBjb25maWdJbnN0YW5jZSA9IGF3YWl0IGNvbmZpZ3VyYXRpb25SZWdpc3RyeS5yZWdpc3RlcignZW5naW5lJywge1xuICAgICAgICAgICAgZGVmYXVsdHM6IHRoaXMuZGVmYXVsdENvbmZpZyxcbiAgICAgICAgICAgIG5vZGVzOiAoKSA9PiBjcmVhdGVFbmdpbmVNZXRhZGF0YU5vZGVzKHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0Q29uZmlnOiB0aGlzLmRlZmF1bHRDb25maWcsXG4gICAgICAgICAgICAgICAgZW5naW5lUm9vdDogdGhpcy5faW5mby50eXBlc2NyaXB0LnBhdGgsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2NvbmZpZ0luc3RhbmNlID0gY29uZmlnSW5zdGFuY2U7XG4gICAgICAgIGNvbnN0IHN5bmNDb25maWcgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0Q29uZmlnID0gY29uZmlnSW5zdGFuY2UuZ2V0QWxsKCkgfHwge307XG4gICAgICAgICAgICBjb25zdCBtZXJnZWRDb25maWcgPSBtZXJnZShcbiAgICAgICAgICAgICAgICBjbG9uZURlZXAoY29uZmlnSW5zdGFuY2UuZ2V0RGVmYXVsdENvbmZpZygpIHx8IHt9KSxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Q29uZmlnLFxuICAgICAgICAgICAgKSBhcyBJRW5naW5lQ29uZmlnICYgSUVuZ2luZVByb2plY3RDb25maWc7XG4gICAgICAgICAgICBjb25zdCBtb2R1bGVDb25maWcgPSB0aGlzLmdldFNlbGVjdGVkTW9kdWxlUHJvamVjdENvbmZpZyhtZXJnZWRDb25maWcpO1xuXG4gICAgICAgICAgICBpZiAobW9kdWxlQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocHJvamVjdENvbmZpZywgJ2luY2x1ZGVNb2R1bGVzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VkQ29uZmlnLmluY2x1ZGVNb2R1bGVzID0gbW9kdWxlQ29uZmlnLmluY2x1ZGVNb2R1bGVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwcm9qZWN0Q29uZmlnLCAnZmxhZ3MnKSkge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZWRDb25maWcuZmxhZ3MgPSBtb2R1bGVDb25maWcuZmxhZ3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHByb2plY3RDb25maWcsICdub0RlcHJlY2F0ZWRGZWF0dXJlcycpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlZENvbmZpZy5ub0RlcHJlY2F0ZWRGZWF0dXJlcyA9IG1vZHVsZUNvbmZpZy5ub0RlcHJlY2F0ZWRGZWF0dXJlcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXJnZWRDb25maWcubWFjcm9Db25maWcgPSBlbnN1cmVDdXN0b21QaXBlbGluZU1hY3JvQ29uZmlnKG1lcmdlZENvbmZpZy5tYWNyb0NvbmZpZyk7XG5cbiAgICAgICAgICAgIGlmIChoYXNPd25Db25maWdLZXkocHJvamVjdENvbmZpZywgJ2dyYXBoaWNzJykpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRDb25maWcuZ3JhcGhpY3MgPSBtZXJnZUdyYXBoaWNzQ29uZmlnV2l0aE1vZHVsZXMobWVyZ2VkQ29uZmlnLmluY2x1ZGVNb2R1bGVzLCBwcm9qZWN0Q29uZmlnLmdyYXBoaWNzKTtcbiAgICAgICAgICAgICAgICBtZXJnZWRDb25maWcuaW5jbHVkZU1vZHVsZXMgPSBub3JtYWxpemVJbmNsdWRlTW9kdWxlc1dpdGhHcmFwaGljcyhtZXJnZWRDb25maWcuaW5jbHVkZU1vZHVsZXMsIG1lcmdlZENvbmZpZy5ncmFwaGljcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhhc093bkNvbmZpZ0tleShwcm9qZWN0Q29uZmlnLCAnY3VzdG9tUGlwZWxpbmUnKSkge1xuICAgICAgICAgICAgICAgIG1lcmdlZENvbmZpZy5ncmFwaGljcyA9IGRlcml2ZUdyYXBoaWNzQ29uZmlnRnJvbUN1c3RvbVBpcGVsaW5lKG1lcmdlZENvbmZpZy5jdXN0b21QaXBlbGluZSwgbWVyZ2VkQ29uZmlnLmluY2x1ZGVNb2R1bGVzKTtcbiAgICAgICAgICAgICAgICBtZXJnZWRDb25maWcuaW5jbHVkZU1vZHVsZXMgPSBub3JtYWxpemVJbmNsdWRlTW9kdWxlc1dpdGhHcmFwaGljcyhtZXJnZWRDb25maWcuaW5jbHVkZU1vZHVsZXMsIG1lcmdlZENvbmZpZy5ncmFwaGljcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1lcmdlZENvbmZpZy5ncmFwaGljcyA9IGRlcml2ZUdyYXBoaWNzQ29uZmlnRnJvbU1vZHVsZXMobWVyZ2VkQ29uZmlnLmluY2x1ZGVNb2R1bGVzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZ3JhcGhpY3MgPSBtZXJnZWRDb25maWcuZ3JhcGhpY3MgPz8gZGVyaXZlR3JhcGhpY3NDb25maWdGcm9tTW9kdWxlcyhtZXJnZWRDb25maWcuaW5jbHVkZU1vZHVsZXMpO1xuICAgICAgICAgICAgbWVyZ2VkQ29uZmlnLmdyYXBoaWNzID0gZ3JhcGhpY3M7XG4gICAgICAgICAgICBtZXJnZWRDb25maWcuY3VzdG9tUGlwZWxpbmUgPSBncmFwaGljcy5waXBlbGluZSA9PT0gQ1VTVE9NX1BJUEVMSU5FX01PRFVMRTtcbiAgICAgICAgICAgIHRoaXMuX2NvbmZpZyA9IG1lcmdlZENvbmZpZztcbiAgICAgICAgfTtcbiAgICAgICAgc3luY0NvbmZpZygpO1xuICAgICAgICBjb25maWdJbnN0YW5jZS5vbignY29uZmlndXJhdGlvbjpzYXZlJywgc3luY0NvbmZpZyk7XG4gICAgICAgIHRoaXMuX2luaXQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhc3luYyBpbXBvcnRFZGl0b3JFeHRlbnNpb25zKCkge1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZ2xvYmFsVGhpcy5FZGl0b3JFeHRlbmRzID0gYXdhaXQgaW1wb3J0KCcuL2VkaXRvci1leHRlbmRzJyk7XG4gICAgICAgIC8vIOazqOaEj++8muebruWJjSB1dGlscyDnlKjnmoTmmK8gVVVJRO+8jEVkaXRvckV4dGVuZHMg55So55qE5pivIFV1aWQgXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZ2xvYmFsVGhpcy5FZGl0b3JFeHRlbmRzLlV1aWRVdGlscy5jb21wcmVzc1V1aWQgPSBnbG9iYWxUaGlzLkVkaXRvckV4dGVuZHMuVXVpZFV0aWxzLmNvbXByZXNzVVVJRDtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0RWRpdG9yRXh0ZW5zaW9ucygpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBhd2FpdCBnbG9iYWxUaGlzLkVkaXRvckV4dGVuZHMuaW5pdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWKoOi9veS7peWPiuWIneWni+WMluW8leaTjueOr+Wig1xuICAgICAqIEBwYXJhbSBpbmZvIOWIneWni+WMluW8leaTjuaVsOaNrlxuICAgICAqIEBwYXJhbSBvbkJlZm9yZUdhbWVJbml0IC0g5Zyo5Yid5aeL5YyW5LmL5YmN6ZyA6KaB5YGa55qE5bel5L2cXG4gICAgICogQHBhcmFtIG9uQWZ0ZXJHYW1lSW5pdCAtIOWcqOWIneWni+WMluS5i+WQjumcgOimgeWBmueahOW3peS9nFxuICAgICAqL1xuICAgIGFzeW5jIGluaXRFbmdpbmUoaW5mbzogSUluaXRFbmdpbmVJbmZvLCBvbkJlZm9yZUdhbWVJbml0PzogKCkgPT4gUHJvbWlzZTx2b2lkPiwgb25BZnRlckdhbWVJbml0PzogKCkgPT4gUHJvbWlzZTx2b2lkPikge1xuICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHByZWxvYWQgfSA9IGF3YWl0IGltcG9ydCgnY2MvcHJlbG9hZCcpO1xuICAgICAgICBhd2FpdCB0aGlzLmltcG9ydEVkaXRvckV4dGVuc2lvbnMoKTtcbiAgICAgICAgYXdhaXQgcHJlbG9hZCh7XG4gICAgICAgICAgICBlbmdpbmVSb290OiB0aGlzLl9pbmZvLnR5cGVzY3JpcHQucGF0aCxcbiAgICAgICAgICAgIGVuZ2luZURldjogam9pbih0aGlzLl9pbmZvLnR5cGVzY3JpcHQucGF0aCwgJ2JpbicsICcuY2FjaGUnLCAnZGV2LWNsaScpLFxuICAgICAgICAgICAgd3JpdGFibGVQYXRoOiBpbmZvLndyaXRhYmxlUGF0aCxcbiAgICAgICAgICAgIHJlcXVpcmVkTW9kdWxlczogW1xuICAgICAgICAgICAgICAgICdjYycsXG4gICAgICAgICAgICAgICAgJ2NjL2VkaXRvci9wb3B1bGF0ZS1pbnRlcm5hbC1jb25zdGFudHMnLFxuICAgICAgICAgICAgICAgICdjYy9lZGl0b3Ivc2VyaWFsaXphdGlvbicsXG4gICAgICAgICAgICAgICAgJ2NjL2VkaXRvci9uZXctZ2VuLWFuaW0nLFxuICAgICAgICAgICAgICAgICdjYy9lZGl0b3IvZW1iZWRkZWQtcGxheWVyJyxcbiAgICAgICAgICAgICAgICAnY2MvZWRpdG9yL3JlZmxlY3Rpb24tcHJvYmUnLFxuICAgICAgICAgICAgICAgICdjYy9lZGl0b3IvbG9kLWdyb3VwLXV0aWxzJyxcbiAgICAgICAgICAgICAgICAnY2MvZWRpdG9yL21hdGVyaWFsJyxcbiAgICAgICAgICAgICAgICAnY2MvZWRpdG9yLzJkLW1pc2MnLFxuICAgICAgICAgICAgICAgICdjYy9lZGl0b3Ivb2ZmbGluZS1tYXBwaW5ncycsXG4gICAgICAgICAgICAgICAgJ2NjL2VkaXRvci9jdXN0b20tcGlwZWxpbmUnLFxuICAgICAgICAgICAgICAgICdjYy9lZGl0b3IvYW5pbWF0aW9uLWNsaXAtbWlncmF0aW9uJyxcbiAgICAgICAgICAgICAgICAnY2MvZWRpdG9yL2V4b3RpYy1hbmltYXRpb24nLFxuICAgICAgICAgICAgICAgICdjYy9lZGl0b3IvY29sb3ItdXRpbHMnLFxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0RWRpdG9yRXh0ZW5zaW9ucygpO1xuXG4gICAgICAgIGNvbnN0IG1vZHVsZXMgPSB0aGlzLmdldENvbmZpZygpLmluY2x1ZGVNb2R1bGVzIHx8IFtdO1xuICAgICAgICBjb25zdCB7IHBoeXNpY3NDb25maWcsIG1hY3JvQ29uZmlnLCBjdXN0b21MYXllcnMsIHNvcnRpbmdMYXllcnMsIGhpZ2hRdWFsaXR5LCByZW5kZXJQaXBlbGluZSwgY3VzdG9tUGlwZWxpbmUsIGN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMgfSA9IHRoaXMuZ2V0Q29uZmlnKCk7XG4gICAgICAgIGNvbnN0IGVuYWJsZUN1c3RvbVBpcGVsaW5lID0gaW5mby5lbmFibGVDdXN0b21QaXBlbGluZSA/PyBjdXN0b21QaXBlbGluZTtcbiAgICAgICAgY29uc3QgYnVuZGxlcyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0cyh7IGlzQnVuZGxlOiB0cnVlIH0pLm1hcCgoaXRlbTogYW55KSA9PiBpdGVtLm1ldGE/LnVzZXJEYXRhPy5idW5kbGVOYW1lID8/IGl0ZW0ubmFtZSk7XG4gICAgICAgIGNvbnN0IGJ1aWx0aW5Bc3NldHMgPSBpbmZvLnNlcnZlclVSTCAmJiBhd2FpdCB0aGlzLnF1ZXJ5SW50ZXJuYWxBc3NldExpc3QodGhpcy5nZXRJbmZvKCkudHlwZXNjcmlwdC5wYXRoKTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRDdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzID0gYXdhaXQgcmVzb2x2ZUN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMoY3VzdG9tSm9pbnRUZXh0dXJlTGF5b3V0cyk7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSB7XG4gICAgICAgICAgICBkZWJ1Z01vZGU6IGNjLmRlYnVnLkRlYnVnTW9kZS5XQVJOLFxuICAgICAgICAgICAgb3ZlcnJpZGVTZXR0aW5nczoge1xuICAgICAgICAgICAgICAgIGVuZ2luZToge1xuICAgICAgICAgICAgICAgICAgICBidWlsdGluQXNzZXRzOiBidWlsdGluQXNzZXRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICBtYWNyb3M6IG1hY3JvQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzb3J0aW5nTGF5ZXJzLFxuICAgICAgICAgICAgICAgICAgICBjdXN0b21MYXllcnM6IGN1c3RvbUxheWVycy5tYXAoKGxheWVyOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gbGF5ZXJNYXNrLmZpbmRJbmRleCgobnVtKSA9PiB7IHJldHVybiBsYXllci52YWx1ZSA9PT0gbnVtOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbGF5ZXIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXQ6IGluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwcm9maWxpbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0ZQUzogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzY3JlZW46IHtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVSYXRlOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgZXhhY3RGaXRTY3JlZW46IHRydWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZW5kZXJpbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyTW9kZTogMyxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGlwZWxpbmUsXG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVBpcGVsaW5lOiBlbmFibGVDdXN0b21QaXBlbGluZSxcbiAgICAgICAgICAgICAgICAgICAgaGlnaFF1YWxpdHlNb2RlOiBoaWdoUXVhbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgLi4uKGVuYWJsZUN1c3RvbVBpcGVsaW5lICYmIGluZm8uc2VydmVyVVJMID8geyBlZmZlY3RTZXR0aW5nc1BhdGg6IGAke2luZm8uc2VydmVyVVJMfS9zY3JpcHRpbmcvZW5naW5lL2VmZmVjdC1zZXR0aW5nc2AgfSA6IHt9KSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzOiByZXNvbHZlZEN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwaHlzaWNzOiB7XG4gICAgICAgICAgICAgICAgICAgIC4uLnBoeXNpY3NDb25maWcsXG4gICAgICAgICAgICAgICAgICAgIC8vIOeJqeeQhuW8leaTjuWmguaenOayoeacieaYjuehruiuvue9ru+8jOm7mOiupOaYr+W8gOWQr+eahO+8jOWboOatpOmcgOimgeaYjuehruWumuS5ieS4umZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGluZm8uc2VydmVyVVJMID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXNzZXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEJhc2U6IGluZm8uaW1wb3J0QmFzZSxcbiAgICAgICAgICAgICAgICAgICAgbmF0aXZlQmFzZTogaW5mby5uYXRpdmVCYXNlLFxuICAgICAgICAgICAgICAgICAgICByZW1vdGVCdW5kbGVzOiBbJ2ludGVybmFsJywgJ21haW4nXS5jb25jYXQoYnVuZGxlcyksXG4gICAgICAgICAgICAgICAgICAgIHNlcnZlcjogaW5mby5zZXJ2ZXJVUkwsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4YWN0Rml0U2NyZWVuOiB0cnVlLFxuICAgICAgICB9O1xuICAgICAgICBjYy5waHlzaWNzLnNlbGVjdG9yLnJ1bkluRWRpdG9yID0gdHJ1ZTtcbiAgICAgICAgaWYgKG9uQmVmb3JlR2FtZUluaXQpIHtcbiAgICAgICAgICAgIGF3YWl0IG9uQmVmb3JlR2FtZUluaXQoKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBjYy5nYW1lLmluaXQoZGVmYXVsdENvbmZpZyk7XG4gICAgICAgIGlmIChvbkFmdGVyR2FtZUluaXQpIHtcbiAgICAgICAgICAgIGF3YWl0IG9uQWZ0ZXJHYW1lSW5pdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGJhY2tlbmQgPSAnYnVpbHRpbic7XG4gICAgICAgIGxldCBiYWNrZW5kMmQgPSAnYnVpbHRpbic7XG4gICAgICAgIG1vZHVsZXMuZm9yRWFjaCgobW9kdWxlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChtb2R1bGUgaW4gQmFja2VuZHMpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgYmFja2VuZCA9IEJhY2tlbmRzW21vZHVsZV07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1vZHVsZSBpbiBCYWNrZW5kczJEKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGJhY2tlbmQyZCA9IEJhY2tlbmRzMkRbbW9kdWxlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5YiH5o2i54mp55CG5byV5pOOXG4gICAgICAgIGNjLnBoeXNpY3Muc2VsZWN0b3Iuc3dpdGNoVG8oYmFja2VuZCk7XG4gICAgICAgIC8vIOemgeeUqOiuoeeul++8jOmBv+WFjeWImuS9k+WcqHRpY2vnmoTml7blgJnnlJ/mlYhcbiAgICAgICAgLy8gY2MucGh5c2ljcy5QaHlzaWNzU3lzdGVtLmluc3RhbmNlLmVuYWJsZSA9IGZhbHNlO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgLy8gd2luZG93LmNjLmludGVybmFsLnBoeXNpY3MyZC5zZWxlY3Rvci5zd2l0Y2hUbyhiYWNrZW5kMmQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhc3luYyBnZXRHYW1lQ29uZmlnKHNlcnZlclVSTDogc3RyaW5nLCBpbXBvcnRCYXNlOiBzdHJpbmcsIG5hdGl2ZUJhc2U6IHN0cmluZywgaXNQcmV2aWV3PzogYm9vbGVhbikge1xuICAgICAgICBjb25zdCB7IHBoeXNpY3NDb25maWcsIG1hY3JvQ29uZmlnLCBjdXN0b21MYXllcnMsIHNvcnRpbmdMYXllcnMsIGhpZ2hRdWFsaXR5LCByZW5kZXJQaXBlbGluZSwgY3VzdG9tUGlwZWxpbmUsIGN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMgfSA9IHRoaXMuZ2V0Q29uZmlnKCk7XG4gICAgICAgIGNvbnN0IGJ1bmRsZXMgPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldHMoeyBpc0J1bmRsZTogdHJ1ZSB9KS5tYXAoKGl0ZW06IGFueSkgPT4gaXRlbS5tZXRhPy51c2VyRGF0YT8uYnVuZGxlTmFtZSA/PyBpdGVtLm5hbWUpO1xuICAgICAgICBjb25zdCBidWlsdGluQXNzZXRzID0gc2VydmVyVVJMICYmIGF3YWl0IHRoaXMucXVlcnlJbnRlcm5hbEFzc2V0TGlzdCh0aGlzLmdldEluZm8oKS50eXBlc2NyaXB0LnBhdGgpO1xuICAgICAgICBjb25zdCByZXNvbHZlZEN1c3RvbUpvaW50VGV4dHVyZUxheW91dHMgPSBhd2FpdCByZXNvbHZlQ3VzdG9tSm9pbnRUZXh0dXJlTGF5b3V0cyhjdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRlYnVnTW9kZTogY2MuZGVidWcuRGVidWdNb2RlLldBUk4sXG4gICAgICAgICAgICBvdmVycmlkZVNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgZW5naW5lOiB7XG4gICAgICAgICAgICAgICAgICAgIGJ1aWx0aW5Bc3NldHM6IGJ1aWx0aW5Bc3NldHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIG1hY3JvczogbWFjcm9Db25maWcsXG4gICAgICAgICAgICAgICAgICAgIHNvcnRpbmdMYXllcnMsXG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUxheWVyczogY3VzdG9tTGF5ZXJzLm1hcCgobGF5ZXI6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBsYXllck1hc2suZmluZEluZGV4KChudW0pID0+IHsgcmV0dXJuIGxheWVyLnZhbHVlID09PSBudW07IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBsYXllci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdDogaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHByb2ZpbGluZzoge1xuICAgICAgICAgICAgICAgICAgICBzaG93RlBTOiBpc1ByZXZpZXcgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzY3JlZW46IHtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVSYXRlOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgZXhhY3RGaXRTY3JlZW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRlc2lnblJlc29sdXRpb246IHRoaXMuZ2V0Q29uZmlnKCkuZGVzaWduUmVzb2x1dGlvbixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlbmRlcmluZzoge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJNb2RlOiAyLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQaXBlbGluZSxcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tUGlwZWxpbmUsXG4gICAgICAgICAgICAgICAgICAgIGhpZ2hRdWFsaXR5TW9kZTogaGlnaFF1YWxpdHksXG4gICAgICAgICAgICAgICAgICAgIC4uLihjdXN0b21QaXBlbGluZSA/IHsgZWZmZWN0U2V0dGluZ3NQYXRoOiBgJHtzZXJ2ZXJVUkx9L3NjcmlwdGluZy9lbmdpbmUvZWZmZWN0LXNldHRpbmdzYCB9IDoge30pLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUpvaW50VGV4dHVyZUxheW91dHM6IHJlc29sdmVkQ3VzdG9tSm9pbnRUZXh0dXJlTGF5b3V0cyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHBoeXNpY3M6IHtcbiAgICAgICAgICAgICAgICAgICAgLi4ucGh5c2ljc0NvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgLy8g54mp55CG5byV5pOO5aaC5p6c5rKh5pyJ5piO56Gu6K6+572u77yM6buY6K6k5piv5byA5ZCv55qE77yM5Zug5q2k6ZyA6KaB5piO56Gu5a6a5LmJ5Li6ZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogc2VydmVyVVJMID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXNzZXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEJhc2U6IGltcG9ydEJhc2UsXG4gICAgICAgICAgICAgICAgICAgIG5hdGl2ZUJhc2U6IG5hdGl2ZUJhc2UsXG4gICAgICAgICAgICAgICAgICAgIHJlbW90ZUJ1bmRsZXM6IFsnaW50ZXJuYWwnLCAnbWFpbiddLmNvbmNhdChidW5kbGVzKSxcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyOiBzZXJ2ZXJVUkwsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4YWN0Rml0U2NyZWVuOiB0cnVlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGdldE1vZHVsZXMoKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb25maWcoKS5pbmNsdWRlTW9kdWxlcyB8fCBbXTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeUludGVybmFsQXNzZXRMaXN0KGVuZ2luZVBhdGg6IHN0cmluZykge1xuICAgICAgICAvLyDmt7vliqDlvJXmk47kvp3otZbnmoTpooTliqDovb3lhoXnva7otYTmupDliLDkuLvljIXlhoVcbiAgICAgICAgY29uc3QgY2NDb25maWdKc29uID0gYXdhaXQgZnNlLnJlYWRKU09OKGpvaW4oZW5naW5lUGF0aCwgJ2NjLmNvbmZpZy5qc29uJykpO1xuICAgICAgICBjb25zdCBpbnRlcm5hbEFzc2V0czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBmZWF0dXJlTmFtZSBpbiBjY0NvbmZpZ0pzb24uZmVhdHVyZXMpIHtcbiAgICAgICAgICAgIGlmIChjY0NvbmZpZ0pzb24uZmVhdHVyZXNbZmVhdHVyZU5hbWVdLmRlcGVuZGVudEFzc2V0cykge1xuICAgICAgICAgICAgICAgIGludGVybmFsQXNzZXRzLnB1c2goLi4uY2NDb25maWdKc29uLmZlYXR1cmVzW2ZlYXR1cmVOYW1lXS5kZXBlbmRlbnRBc3NldHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKG5ldyBTZXQoaW50ZXJuYWxBc3NldHMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUT0RPXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcXVlcnlNb2R1bGVDb25maWcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZUNvbmZpZ0NhY2hlO1xuICAgIH1cblxuICAgIHF1ZXJ5UmVuZGVyQ29uZmlnKCk6IE1vZHVsZVJlbmRlckNvbmZpZyB7XG4gICAgICAgIGlmICghdGhpcy5faW5pdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbmdpbmUgbm90IGluaXQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2V0RW5naW5lUmVuZGVyQ29uZmlnKHRoaXMuX2luZm8udHlwZXNjcmlwdC5wYXRoKTtcbiAgICB9XG5cbiAgICBxdWVyeUxvY2FsaXplZFJlbmRlckNvbmZpZygpOiBNb2R1bGVSZW5kZXJDb25maWcge1xuICAgICAgICBpZiAoIXRoaXMuX2luaXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRW5naW5lIG5vdCBpbml0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdldExvY2FsaXplZEVuZ2luZVJlbmRlckNvbmZpZyh0aGlzLl9pbmZvLnR5cGVzY3JpcHQucGF0aCk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlKb2ludFRleHR1cmVMYXlvdXRQcmV2aWV3KCk6IFByb21pc2U8SUpvaW50VGV4dHVyZUxheW91dFByZXZpZXdSZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgeyBjdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzIH0gPSB0aGlzLmdldENvbmZpZygpO1xuICAgICAgICByZXR1cm4gY3JlYXRlSm9pbnRUZXh0dXJlTGF5b3V0UHJldmlldyhjdXN0b21Kb2ludFRleHR1cmVMYXlvdXRzKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeUxheWVyQnVpbHRpbigpIHtcbiAgICAgICAgY29uc3QgeyBMYXllcnMgfSA9IGF3YWl0IGltcG9ydCgnY2MnKTtcblxuICAgICAgICBjb25zdCBMQVlFUl9OT05FID0gMDtcbiAgICAgICAgY29uc3QgTEFZRVJfQUxMID0gMHhmZmZmZmZmZjtcbiAgICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKExheWVycy5FbnVtKSBhcyBbc3RyaW5nLCBudW1iZXJdW107XG5cbiAgICAgICAgcmV0dXJuIGVudHJpZXNcbiAgICAgICAgICAgIC5maWx0ZXIoKFssIHZhbHVlXSkgPT4gdmFsdWUgIT09IExBWUVSX05PTkUgJiYgdmFsdWUgIT09IExBWUVSX0FMTClcbiAgICAgICAgICAgIC5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+ICh7IG5hbWUsIHZhbHVlIH0pKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeVNvcnRpbmdMYXllckJ1aWx0aW4oKSB7XG4gICAgICAgIGNvbnN0IHsgU29ydGluZ0xheWVycyB9ID0gYXdhaXQgaW1wb3J0KCdjYycpO1xuXG4gICAgICAgIHJldHVybiBTb3J0aW5nTGF5ZXJzLmdldEJ1aWx0aW5MYXllcnMoKTtcbiAgICB9XG59XG5cbmNvbnN0IEVuZ2luZSA9IG5ldyBFbmdpbmVNYW5hZ2VyKCk7XG5cbmV4cG9ydCB7IEVuZ2luZSB9O1xuXG4vKipcbiAqIOWIneWni+WMliBlbmdpbmVcbiAqIEBwYXJhbSBlbmdpbmVQYXRoXG4gKiBAcGFyYW0gcHJvamVjdFBhdGhcbiAqIEBwYXJhbSBzZXJ2ZXJVUkxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXRFbmdpbmUoZW5naW5lUGF0aDogc3RyaW5nLCBwcm9qZWN0UGF0aDogc3RyaW5nLCBzZXJ2ZXJVUkw/OiBzdHJpbmcpIHtcbiAgICBhd2FpdCBFbmdpbmUuaW5pdChlbmdpbmVQYXRoKTtcbiAgICAvLyDov5nph4wgaW1wb3J0QmFzZSDkuI4gbmF0aXZlQmFzZSDnlKjmnI3liqHlmajmmK/kuLrkuoborqnmnI3liqHlmajovazmjaLotYTmupDnnJ/lrp7lrZjmlL7nmoTot6/lvoRcbiAgICBhd2FpdCBFbmdpbmUuaW5pdEVuZ2luZSh7XG4gICAgICAgIHNlcnZlclVSTDogc2VydmVyVVJMLFxuICAgICAgICBpbXBvcnRCYXNlOiBzZXJ2ZXJVUkwgPz8gam9pbihwcm9qZWN0UGF0aCwgJ2xpYnJhcnknKSxcbiAgICAgICAgbmF0aXZlQmFzZTogc2VydmVyVVJMID8/IGpvaW4ocHJvamVjdFBhdGgsICdsaWJyYXJ5JyksXG4gICAgICAgIHdyaXRhYmxlUGF0aDogam9pbihwcm9qZWN0UGF0aCwgJ3RlbXAnKSxcbiAgICB9KTtcbn1cbiJdfQ==