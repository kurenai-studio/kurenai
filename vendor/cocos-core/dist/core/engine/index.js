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
            // kurenai: arrays replace instead of merging by index, or a shorter project
            // includeModules gets the default list's tail appended back.
            const mergedConfig = (0, lodash_1.mergeWith)((0, lodash_1.cloneDeep)(configInstance.getDefaultConfig() || {}), projectConfig, (_dst, src) => (Array.isArray(src) ? [...src] : undefined));
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
