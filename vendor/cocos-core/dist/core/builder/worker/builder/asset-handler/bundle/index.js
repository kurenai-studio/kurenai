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
exports.BundleManager = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const bundle_1 = require("./bundle");
const texture_compress_1 = require("./texture-compress");
const pac_1 = require("./pac");
const cconb_1 = require("../../utils/cconb");
const script_1 = require("../script");
const bundle_utils_1 = require("../../../../share/bundle-utils");
const asset_library_1 = require("../../manager/asset-library");
const asset_1 = require("../../manager/asset");
const utils_1 = require("../../utils");
const json_group_1 = require("./json-group");
const utils_2 = require("../../../../share/utils");
const task_base_1 = require("../../manager/task-base");
const utils_3 = require("../../../../share/utils");
const bin_group_1 = require("./bin-group");
const console_1 = require("../../../../../base/console");
const i18n_1 = __importDefault(require("../../../../../base/i18n"));
const plugin_1 = require("../../../../manager/plugin");
const utils_4 = __importDefault(require("../../../../../base/utils"));
const scripting_1 = __importDefault(require("../../../../../scripting"));
const builder_config_1 = __importDefault(require("../../../../share/builder-config"));
const query_1 = __importDefault(require("../../../../../assets/manager/query"));
const global_1 = require("../../../../share/global");
const { MAIN, START_SCENE, INTERNAL, RESOURCES } = bundle_utils_1.BuiltinBundleName;
// 只 Bundle 构建时，可走此类的生成执行函数
class BundleManager extends task_base_1.BuildTaskBase {
    static BuiltinBundleName = bundle_utils_1.BuiltinBundleName;
    static BundleConfigs = {};
    _task;
    options;
    destDir;
    hooksInfo;
    bundleMap = {};
    bundles = [];
    _pacAssets = [];
    // 按照优先级排序过的 bundle 数组
    _bundleGroupInPriority;
    // 纹理压缩管理器
    imageCompressManager;
    scriptBuilder;
    packResults = [];
    cache;
    hookMap = {
        onBeforeBundleInit: 'onBeforeBundleInit',
        onAfterBundleInit: 'onAfterBundleInit',
        onBeforeBundleDataTask: 'onBeforeBundleDataTask',
        onAfterBundleDataTask: 'onAfterBundleDataTask',
        onBeforeBundleBuildTask: 'onBeforeBundleBuildTask',
        onAfterBundleBuildTask: 'onAfterBundleBuildTask',
    };
    // 执行整个构建流程的顺序流程
    pipeline = [
        this.initOptions,
        this.hookMap.onBeforeBundleInit,
        this.initBundle,
        this.hookMap.onAfterBundleInit,
        this.hookMap.onBeforeBundleDataTask,
        this.initAsset,
        this.bundleDataTask,
        this.hookMap.onAfterBundleDataTask,
        this.hookMap.onBeforeBundleBuildTask,
        this.clearBundleDest,
        this.buildScript,
        this.buildAsset,
        this.hookMap.onAfterBundleBuildTask,
        this.outputBundle,
    ];
    get bundleGroupInPriority() {
        if (this._bundleGroupInPriority) {
            return this._bundleGroupInPriority;
        }
        // bundle 按优先级分组
        let bundleGroupInPriority = new Array(21);
        this.bundles.forEach((bundle) => {
            if (!bundleGroupInPriority[bundle.priority - 1]) {
                bundleGroupInPriority[bundle.priority - 1] = [];
            }
            bundleGroupInPriority[bundle.priority - 1].push(bundle);
        });
        bundleGroupInPriority = bundleGroupInPriority.filter((group) => group).reverse();
        this._bundleGroupInPriority = bundleGroupInPriority;
        return bundleGroupInPriority;
    }
    static internalBundlePriority = {
        [MAIN]: 7,
        [START_SCENE]: 20,
        [INTERNAL]: 21,
        [RESOURCES]: 8,
    };
    constructor(options, imageCompressManager, task) {
        super(options.taskId, 'Bundle Task');
        // @ts-ignore TODO 补全 options 为 IInternalBundleBuildOptions
        this.options = options;
        if (imageCompressManager) {
            this.imageCompressManager = imageCompressManager;
            imageCompressManager.on('update-progress', (message) => {
                this.updateProcess(message);
            });
        }
        this._task = task;
        this.destDir = this.options.dest && utils_4.default.Path.resolveToRaw(this.options.dest) || (0, path_1.join)(builder_config_1.default.projectRoot, 'build', 'assetBundle');
        this.scriptBuilder = new script_1.ScriptBuilder();
        // @ts-ignore
        this.cache = task ? task.cache : new asset_1.BuilderAssetCache();
        this.hooksInfo = task ? task.hooksInfo : plugin_1.pluginManager.getHooksInfo(this.options.platform);
    }
    static async create(options, task) {
        if (!options.skipCompressTexture) {
            const { TextureCompress } = await Promise.resolve().then(() => __importStar(require('../texture-compress')));
            const imageCompressManager = new TextureCompress(options.platform, options.useCacheConfig?.textureCompress);
            return new BundleManager(options, imageCompressManager, task);
        }
        return new BundleManager(options, null, task);
    }
    async loadScript(scriptUuids, pluginScripts) {
        if (this.options.preview) {
            return;
        }
        await scripting_1.default.loadScript(scriptUuids, pluginScripts);
    }
    /**
     * 初始化项目设置的一些 bundle 配置信息
     */
    static async initStaticBundleConfig() {
        const bundleConfig = (await builder_config_1.default.getProject('bundleConfig.custom')) || {};
        const platformConfigs = plugin_1.pluginManager.queryBundleConfig();
        if (!bundleConfig.default) {
            bundleConfig.default = bundle_utils_1.DefaultBundleConfig;
        }
        const res = {};
        Object.keys(bundleConfig).forEach((ID) => {
            const configs = bundleConfig[ID].configs;
            res[ID] = {};
            Object.keys(configs).forEach((platformType) => {
                if (!platformConfigs[platformType]) {
                    // 平台可能被关闭，这里需要容错
                    return;
                }
                const platformOption = (0, bundle_utils_1.transformPlatformSettings)(configs[platformType], platformConfigs[platformType].platformConfigs);
                Object.assign(res[ID], platformOption);
            });
        });
        BundleManager.BundleConfigs = res;
    }
    getUserConfig(ID = 'default') {
        const configMap = BundleManager.BundleConfigs[ID];
        if (!configMap) {
            return null;
        }
        return configMap[this.options.platform];
    }
    /**
     * 对 options 上的数据做补全处理
     */
    async initOptions() {
        this.options.platformType = plugin_1.pluginManager.platformConfig[this.options.platform].platformType;
        this.options.buildScriptParam = {
            experimentalEraseModules: this.options.experimentalEraseModules,
            outputName: 'project',
            flags: {
                DEBUG: !!this.options.debug,
                ...this.options.flags,
            },
            polyfills: this.options.polyfills,
            hotModuleReload: false,
            platform: this.options.platformType || 'INVALID_PLATFORM', // v3.8.6 开始 ccbuild 支持 'INVALID_PLATFORM' 表示无效平台，防止之前初始化为 'HTML5' 后，平台插件忘记覆盖 platform 参数导致走 'HTML5' 的引擎打包流程导致的较难排查的问题
            commonDir: '',
            bundleCommonChunk: this.options.bundleCommonChunk ?? false,
        };
        this.options.assetSerializeOptions = {
            'cc.EffectAsset': {
                glsl1: this.options.includeModules.includes('gfx-webgl'),
                glsl3: this.options.includeModules.includes('gfx-webgl2'),
                glsl4: false,
            },
        };
    }
    clearBundleDest() {
        this.bundles.forEach((bundle) => {
            if (bundle.output) {
                (0, fs_extra_1.emptyDirSync)(bundle.dest);
            }
        });
    }
    /**
     * 初始化整理资源列表
     */
    async initAsset() {
        await this.initBundleRootAssets();
        // 需要在 this.cache 初始化后之后执行
        await this.loadScript(this.cache.scriptUuids, query_1.default.querySortedPlugins());
        await this.initBundleShareAssets();
        await this.initBundleConfig();
    }
    async initBundleConfig() {
        for (const bundle of this.bundles) {
            // TODO 废弃 bundle 的 config 结构，输出 config 时即时整理即可
            // 此处的整理实际上仅为预览服务
            bundle.initConfig();
            if (this.options.preview) {
                await bundle.initAssetPaths();
            }
        }
    }
    async buildAsset() {
        // 先自动图集再纹理压缩
        await this.packImage();
        await this.compressImage();
        await this.outputAssets();
    }
    /**
     * 独立构建 Bundle 时调用
     * @returns
     */
    async run() {
        try {
            // 独立构建 Bundle 时，不能抽取公共脚本到 src
            this.options.bundleCommonChunk = true;
            await this.runAllTask();
            return true;
        }
        finally {
            this.stopProgressHeartbeat();
        }
    }
    async outputBundle() {
        this.updateProcess('Output asset in bundles start');
        await Promise.all(this.bundles.map(async (bundle) => {
            if (!bundle.output) {
                return;
            }
            await bundle.build();
        }));
        this.updateProcess('Output asset in bundles success');
    }
    addBundle(options) {
        if (this.bundleMap[options.name]) {
            const newName = options.name + Date.now();
            // Bundle 重名会导致脚本内动态加载出错，需要及时提示
            console.error(i18n_1.default.t('builder.asset_bundle.duplicate_name_messaged_auto_rename', {
                name: options.name,
                newName,
                url: this.bundleMap[options.name].root,
                newUrl: options.root,
            }));
            options.name = newName;
        }
        this.bundleMap[options.name] = new bundle_1.Bundle(options);
    }
    getDefaultBundleConfig(name) {
        const dest = (0, path_1.join)(this.destDir, name);
        const defaultPriority = BundleManager.internalBundlePriority[name];
        return {
            name,
            dest,
            root: '',
            scriptDest: (0, path_1.join)(dest, global_1.BuildGlobalInfo.SCRIPT_NAME),
            priority: defaultPriority || 1,
            compressionType: bundle_utils_1.BundleCompressionTypes.MERGE_DEP,
            isRemote: false,
            md5Cache: this.options.md5Cache,
            debug: this.options.debug,
        };
    }
    /**
     * 根据参数初始化一些信息配置，整理所有的 bundle 分组信息
     */
    async initBundle() {
        await BundleManager.initStaticBundleConfig();
        const options = this.options;
        const cocosBundles = [MAIN, START_SCENE, INTERNAL];
        const internalBundleConfigMap = {};
        this.updateProcess('Init all bundles start...');
        const bundleAssets = await asset_library_1.buildAssetLibrary.queryAssetsByOptions({ isBundle: true });
        options.bundleConfigs = options.bundleConfigs || [];
        // 整理所有的 bundle 信息
        if (options.bundleConfigs.length) {
            options.bundleConfigs.forEach((customConfig) => {
                if (cocosBundles.includes(customConfig.name)) {
                    internalBundleConfigMap[customConfig.name] = customConfig;
                    return;
                }
                const config = this.patchProjectBundleConfig(customConfig);
                if (!config) {
                    console.warn('Invalid bundle config: ', customConfig);
                    return;
                }
                this.addBundle(config);
            });
        }
        const otherBundleOutput = options.bundleConfigs.length ? false : (this._task ? true : false);
        if (!options.buildBundleOnly) {
            // 非只 Bundle 构建模式下，需要补全其他项目内存在的 bundle 信息
            bundleAssets.forEach((assetInfo) => {
                const config = this.patchProjectBundleConfig({
                    root: assetInfo.url,
                    name: '',
                });
                if (!config || this.bundleMap[config.name]) {
                    return;
                }
                config.output = otherBundleOutput;
                this.addBundle(config);
            });
        }
        // 正常构建模式，或者仅构建 Bundle 模式有内置 Bundle 的自定义配置才自动补全
        if (!options.buildBundleOnly || Object.keys(internalBundleConfigMap).length) {
            // 检查填充编辑器内置 Bundle
            this.initInternalBundleConfigs(internalBundleConfigMap);
        }
        this.bundles = Object.values(this.bundleMap).sort((bundleA, bundleB) => {
            return (bundleB.priority - bundleA.priority) || (0, utils_3.compareUUID)(bundleA.name, bundleB.name);
        });
        // 存在 bundleConfigs 时，如果循环完没有获取到任何 bundle 则代表配置有误，需要报错中断
        if (!this.bundles.length) {
            throw new Error('Invalid bundle config, please check your bundle config');
        }
        this.updateProcess(`Num of bundles: ${this.bundles.length}...`);
    }
    /**
     * 初始化内置 Bundle（由于一些历史的 bundle 行为配置，内置 Bundle 的配置需要单独处理）
     */
    initInternalBundleConfigs(internalBundleConfigMap) {
        // 注意顺序，START_SCENE, INTERNAL 的默认配置会取自 MAIN 的配置
        const cocosBundles = [MAIN, START_SCENE, INTERNAL];
        const output = this.options.buildBundleOnly ? false : true;
        cocosBundles.forEach((name) => {
            if (name === START_SCENE && !this.options.startSceneAssetBundle && !internalBundleConfigMap[name]) {
                return;
            }
            if (this.options.buildBundleOnly && !internalBundleConfigMap[name]) {
                return;
            }
            let config = this.getDefaultBundleConfig(name);
            const customConfig = internalBundleConfigMap[name] || { name };
            config = (0, utils_2.defaultsDeep)(Object.assign({}, customConfig), config);
            // 整理后的数据，其他内置 Bundle 可能会再次使用，需要存到 internalBundleConfigMap
            internalBundleConfigMap[name] = config;
            config.output = customConfig.output ?? output;
            if (customConfig.name === MAIN) {
                const isRemote = this.options.mainBundleIsRemote;
                // 如未配置远程服务器地址，取消主包的远程包配置，需要导出的 bundle 才警告
                if (customConfig.output && isRemote && !this.options.server && !this.options.preview) {
                    console.warn(i18n_1.default.t('builder.warn.asset_bundle_is_remote_invalid', {
                        directoryName: 'main',
                    }));
                }
                config.isRemote = customConfig.isRemote || isRemote;
                config.compressionType = customConfig.compressionType || this.options.mainBundleCompressionType;
            }
            else {
                // START_SCENE, INTERNAL 的默认配置是根据实际的项目经验设定的一套规则
                config.isRemote = !!(customConfig.isRemote ?? (this.options.startSceneAssetBundle ? false : internalBundleConfigMap[MAIN].isRemote));
                if (!customConfig.compressionType) {
                    config.compressionType = (this.options.startSceneAssetBundle || internalBundleConfigMap[MAIN].compressionType === bundle_utils_1.BundleCompressionTypes.MERGE_DEP) ?
                        bundle_utils_1.BundleCompressionTypes.MERGE_ALL_JSON : internalBundleConfigMap[MAIN].compressionType;
                }
            }
            // TODO 提取以及单元测试，后续此配置还会调整，临时处理
            if (!customConfig.dest && config.compressionType === 'subpackage') {
                config.dest = (0, path_1.join)((0, path_1.dirname)(this.destDir), global_1.BuildGlobalInfo.SUBPACKAGES_HEADER, config.name);
                config.scriptDest = (0, path_1.join)(config.dest, global_1.BuildGlobalInfo.SCRIPT_NAME);
            }
            else if (!customConfig.dest) {
                config.dest = config.isRemote ? (0, path_1.join)((0, path_1.dirname)(this.destDir), global_1.BuildGlobalInfo.REMOTE_HEADER, config.name) : (0, path_1.join)(this.destDir, config.name);
                config.scriptDest = (0, path_1.join)(config.dest, global_1.BuildGlobalInfo.SCRIPT_NAME);
            }
            if ((this.options.moveRemoteBundleScript && config.isRemote) && !customConfig.scriptDest) {
                config.scriptDest = this._task ? (0, path_1.join)(this._task.result.paths.bundleScripts, config.name, global_1.BuildGlobalInfo.SCRIPT_NAME) : (0, path_1.join)(config.dest, global_1.BuildGlobalInfo.SCRIPT_NAME);
            }
            this.addBundle(config);
        });
    }
    /**
     * 填充成完整可用的项目 Bundle 配置（传入自定义配置 > Bundle 文件夹配置 > 默认配置）
     * @param customConfig
     * @returns IBundleInitOptions | null
     */
    patchProjectBundleConfig(customConfig) {
        // 非内置 Bundle 的配置必须填写 root 选项
        if (!customConfig.root) {
            console.debug(`Invalid Bundle config with bundle root:${customConfig.root}`);
            return null;
        }
        const uuid = asset_library_1.buildAssetLibrary.url2uuid(customConfig.root);
        if (!uuid) {
            console.debug(`Invalid Bundle config with bundle ${customConfig.root}`);
            return null;
        }
        const assetInfo = asset_library_1.buildAssetLibrary.getAsset(uuid);
        if (!assetInfo) {
            console.debug(`Invalid Bundle config with bundle ${customConfig.root}`);
            return null;
        }
        const { bundleFilterConfig, priority, bundleConfigID, bundleName } = assetInfo.meta.userData;
        const name = customConfig.name || bundleName || (0, bundle_utils_1.getBundleDefaultName)(assetInfo);
        const userBundleConfig = this.getUserConfig(bundleConfigID);
        let config = this.getDefaultBundleConfig(name);
        const validCustomConfig = (0, utils_2.defaultsDeep)({
            compressionType: userBundleConfig && userBundleConfig.compressionType,
            isRemote: userBundleConfig && userBundleConfig.isRemote,
            priority,
            bundleFilterConfig,
            name,
        }, customConfig);
        config = (0, utils_2.defaultsDeep)(validCustomConfig, config);
        if (!userBundleConfig) {
            console.warn(`Invalid Bundle config ID ${bundleConfigID} in bundle ${customConfig.root}, the bundle config will use the default config ${JSON.stringify(config)}`);
        }
        // 未配置远程服务器地址，给用户警告提示
        if (config.isRemote && !this.options.server && !this.options.preview) {
            console.warn(i18n_1.default.t('builder.warn.asset_bundle_is_remote_invalid', {
                directoryName: name,
            }));
        }
        // TODO 提取以及单元测试，后续此配置还会调整，临时处理
        if (!customConfig.dest && config.compressionType === 'subpackage' && !this.options.buildBundleOnly) {
            config.dest = (0, path_1.join)((0, path_1.dirname)(this.destDir), global_1.BuildGlobalInfo.SUBPACKAGES_HEADER, config.name);
            config.scriptDest = (0, path_1.join)(config.dest, global_1.BuildGlobalInfo.SCRIPT_NAME);
        }
        else if (!customConfig.dest && config.isRemote && !this.options.buildBundleOnly) {
            config.dest = (0, path_1.join)((0, path_1.dirname)(this.destDir), global_1.BuildGlobalInfo.REMOTE_HEADER, config.name);
            config.scriptDest = (0, path_1.join)(config.dest, global_1.BuildGlobalInfo.SCRIPT_NAME);
        }
        if ((this.options.moveRemoteBundleScript && config.isRemote) && !customConfig.scriptDest) {
            config.scriptDest = this._task ? (0, path_1.join)(this._task.result.paths.bundleScripts, config.name, global_1.BuildGlobalInfo.SCRIPT_NAME) : (0, path_1.join)(config.dest, global_1.BuildGlobalInfo.SCRIPT_NAME);
        }
        return config;
    }
    /**
     * 初始化 bundle 分组内的根资源信息
     * 初始化 bundle 内的各项不同的处理任务
     */
    async initBundleRootAssets() {
        this.updateProcess('Init bundle root assets start...');
        if (this.bundleMap[INTERNAL]) {
            const enginePath = this.options.engineInfo.typescript.path;
            // 预览用完整引擎，会初始化所有子系统（例如即便项目只用 2D 物理，3D PhysicsSystem 仍会构造并
            // 加载其默认材质 default-physics-material）。因此预览下内置资源不按 includeModules 裁剪，
            // 取「全部」feature 的 dependentAssets，与场景编辑器 Engine.queryInternalAssetList / 编辑器内置包
            // 行为一致；否则会漏掉未选模块的内置资源，运行时报 "Failed to load builtinMaterial"。
            const internalAssets = this.options.preview
                ? await queryAllPreloadAssetList(enginePath)
                : await queryPreloadAssetList(this.options.includeModules, enginePath);
            // 添加引擎依赖的预加载内置资源/脚本到 internal 包内
            console.debug(`Query preload assets/scripts from cc.config.json`);
            internalAssets.forEach((uuid) => {
                this.bundleMap[INTERNAL].addRootAsset(asset_library_1.buildAssetLibrary.getAsset(uuid));
            });
        }
        const launchBundle = this.bundleMap[START_SCENE] || this.bundleMap[MAIN];
        const assets = asset_library_1.buildAssetLibrary.assets;
        for (let i = 0; i < assets.length; i++) {
            const assetInfo = assets[i];
            if (assetInfo.isDirectory()) {
                continue;
            }
            const assetType = asset_library_1.buildAssetLibrary.getAssetProperty(assetInfo, 'type');
            this.cache.addAsset(assetInfo, assetType);
            let bundleWithAsset = this.bundles.find((bundle) => assetInfo.url.startsWith(bundle.root + '/'));
            // 不在 Bundle 内的脚本默认加到启动 bundle 内
            if (assetType === 'cc.Script') {
                if (assetInfo.url.startsWith('db://internal')) {
                    // internal db 下的脚本，不全量构建，以 dependentScripts 为准
                    continue;
                }
                bundleWithAsset = bundleWithAsset || launchBundle;
                if (bundleWithAsset) {
                    bundleWithAsset.addScript(assetInfo);
                }
                continue;
            }
            // 场景作为特殊资源管理: 只要包含在 bundle 内默认参与构建 > 没有指定 scenes 的情况下默认参与 > 指定 scenes 按照此名单
            if (assetType === 'cc.SceneAsset' && (bundleWithAsset || !this.options.scenes || this.options.scenes.find(item => item.uuid === assetInfo.uuid))) {
                // 初始场景加入到初始场景 bundle 内
                if (launchBundle && this.options.startScene === assetInfo.uuid) {
                    launchBundle.addRootAsset(assetInfo);
                    continue;
                }
                if (bundleWithAsset) {
                    bundleWithAsset.addRootAsset(assetInfo);
                }
                else {
                    // 不在 bundle 内的其他场景，放入主包，由于支持 bundle 剔除，main bundle 可能不存在
                    this.bundleMap[MAIN] && this.bundleMap[MAIN].addRootAsset(assetInfo);
                }
                continue;
            }
            if (assetInfo.source.endsWith('.pac')) {
                this._pacAssets.push(assetInfo.uuid);
            }
            if (bundleWithAsset && assetType !== 'cc.SceneAsset') {
                bundleWithAsset.addRootAsset(assetInfo);
                continue;
            }
        }
        if (launchBundle) {
            if (this.options.preview && this.options.sceneEditor) {
                this.addSceneEditorAssets(launchBundle);
            }
            // 加入项目设置中的 renderPipeline 资源
            if (this.options.renderPipeline) {
                launchBundle.addRootAsset(asset_library_1.buildAssetLibrary.getAsset(this.options.renderPipeline));
            }
            // 加入项目设置中的物理材质
            if (this.options.physicsConfig.defaultMaterial) {
                const asset = asset_library_1.buildAssetLibrary.getAsset(this.options.physicsConfig.defaultMaterial);
                launchBundle.addRootAsset(asset);
            }
        }
        console.debug(`  Number of all scenes: ${this.cache.scenes.length}`);
        console.debug(`  Number of all scripts: ${this.cache.scriptUuids.length}`);
        console.debug(`  Number of other assets: ${this.cache.assetUuids.length}`);
        this.updateProcess('Init bundle root assets success...');
    }
    addSceneEditorAssets(bundle) {
        for (const uuid of this.cache.assetUuids) {
            const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
            // 引擎内置资源已经由 internal bundle 统一收集。Scene Editor 预览若再把它们
            // 加入启动 bundle，会让同一资源进入两个 bundle；例如 default_skybox 的 HDR
            // 与 PNG 会在主 bundle 中得到相同的动态加载 URL。
            if (asset && !asset.url.startsWith('db://internal/')) {
                bundle.addRootAsset(asset);
            }
        }
    }
    /**
     * 按照 Bundle 优先级整理 Bundle 的资源列表
     */
    async initBundleShareAssets() {
        // 预览无需根据优先级分析共享资源，预览本身就是按需加载的，不需要提前整理完整的 bundle 资源列表
        if (this.options.preview) {
            return;
        }
        this.updateProcess('Init bundle share assets start...');
        // 处理共享资源
        const sharedAssets = {};
        const manager = this;
        async function walkDepend(uuid, bundle, checked, fatherUuid) {
            if (checked.has(uuid)) {
                return;
            }
            const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
            if (!asset) {
                if (fatherUuid) {
                    // const fatherAsset = buildAssetLibrary.getAsset(fatherUuid);
                    // console.warn(i18n.t('builder.error.required_asset_missing', {
                    //     uuid: `{asset(${uuid})}`,
                    //     fatherUrl: `{asset(${fatherAsset.url})}`,
                    // }));
                }
                else {
                    console.warn(i18n_1.default.t('builder.error.missing_asset', {
                        uuid: `{asset(${uuid})}`,
                    }));
                }
                return;
            }
            checked.add(uuid);
            bundle.addAsset(asset);
            if ((0, cconb_1.hasCCONFormatAssetInLibrary)(asset)) {
                // TODO 需要优化流程，后续可能被 removeAsset
                const cconExtension = (0, cconb_1.getDesiredCCONExtensionMap)(manager.options.assetSerializeOptions);
                (bundle.config.extensionMap[cconExtension] ??= []).push(asset.uuid);
            }
            if (sharedAssets[uuid]) {
                bundle.addRedirect(uuid, sharedAssets[uuid]);
                return;
            }
            const depends = await asset_library_1.buildAssetLibrary.getDependUuids(uuid);
            await Promise.all(depends.map(async (dependUuid) => {
                return await walkDepend(dependUuid, bundle, checked, uuid);
            }));
        }
        const bundleGroupInPriority = this.bundleGroupInPriority;
        // 递归处理所有 bundle 中场景与根资源
        for (const bundleGroup of bundleGroupInPriority) {
            await Promise.all(bundleGroup.map(async (bundle) => {
                const checked = new Set();
                return await Promise.all(bundle.rootAssets.map(async (uuid) => await walkDepend(uuid, bundle, checked)));
            }));
            // 每循环一组，将该组包含的 uuid 增加到 sharedAssets 中，供下一组 bundle 复用
            bundleGroup.forEach((bundle) => {
                bundle.assetsWithoutRedirect.forEach((uuid) => {
                    if (!sharedAssets[uuid]) {
                        sharedAssets[uuid] = bundle.name;
                    }
                });
            });
        }
        this.updateProcess('Init bundle share assets success...');
    }
    /**
     * 根据不同的选项做不同的 bundle 任务注册
     */
    async bundleDataTask() {
        const imageCompressManager = this.imageCompressManager;
        imageCompressManager && (await imageCompressManager.init());
        await Promise.all(this.bundles.map(async (bundle) => {
            if (!bundle.output) {
                return;
            }
            await (0, json_group_1.handleJsonGroup)(bundle);
            await (0, bin_group_1.handleBinGroup)(bundle, this.options.binGroupConfig);
            imageCompressManager && await (0, texture_compress_1.bundleDataTask)(bundle, imageCompressManager);
        }));
    }
    /**
     * 纹理压缩处理
     * @returns
     */
    async compressImage() {
        if (!this.imageCompressManager) {
            return;
        }
        this.updateProcess('Compress image start...');
        await this.imageCompressManager.run();
        this.updateProcess('Compress image success...');
    }
    /**
     * 执行自动图集任务
     */
    async packImage() {
        this.updateProcess('Pack Images start');
        console_1.newConsole.trackTimeStart('builder:pack-auto-atlas-image');
        // 确认实际参与构建的图集资源列表
        let pacAssets = [];
        if (this.options.buildBundleOnly) {
            this._pacAssets.reduce((pacAssets, pacUuid) => {
                const pacInfo = asset_library_1.buildAssetLibrary.getAsset(pacUuid);
                const inBundle = this.bundles.some((bundle) => {
                    if (!bundle.output) {
                        return false;
                    }
                    if (utils_4.default.Path.contains(pacInfo.url, bundle.root) || utils_4.default.Path.contains(bundle.root, pacInfo.url)) {
                        return true;
                    }
                });
                if (inBundle) {
                    pacAssets.push(pacInfo);
                }
                return pacAssets;
            }, pacAssets);
        }
        else {
            // 非独立构建 Bundle 模式下，所有的图集都需要参与构建，TODO 需要优化
            pacAssets = this._pacAssets.map((pacUuid) => asset_library_1.buildAssetLibrary.getAsset(pacUuid));
        }
        if (!pacAssets.length) {
            console.debug('No pac assets');
            return;
        }
        console.debug(`Number of pac assets: ${pacAssets.length}`);
        const includeAssets = new Set();
        this.bundles.forEach((bundle => bundle.assets.forEach((asset) => includeAssets.add(asset))));
        const { TexturePacker } = await Promise.resolve().then(() => __importStar(require('../texture-packer/index')));
        this.packResults = await (await new TexturePacker().init(pacAssets, Array.from(includeAssets))).pack();
        if (!this.packResults.length) {
            console.debug('No pack results');
            return;
        }
        const imageCompressManager = this.imageCompressManager;
        const dependedAssets = {};
        console.debug(`Number of pack results: ${this.packResults.length}`);
        await Promise.all(this.packResults.map(async (pacRes) => {
            if (!pacRes.result) {
                console.debug('No pack result in pac', pacRes.uuid);
                return;
            }
            const atlases = pacRes.result.atlases;
            const assetInfo = asset_library_1.buildAssetLibrary.getAsset(pacRes.uuid);
            const { createAssetInstance } = await Promise.resolve().then(() => __importStar(require('../texture-packer/pac-info')));
            // atlases 是可被序列化的缓存信息，不包含 spriteFrames
            const pacInstances = createAssetInstance(atlases, assetInfo, pacRes.spriteFrames);
            pacInstances.forEach((instance) => {
                this.cache.addInstance(instance);
            });
            console.debug('start collect depend assets in pac', pacRes.uuid);
            // includeAssets 是 Bundle 根据依赖关系整理的配置，包含了所有有被依赖的构建资源
            await collectDependAssets(pacRes.uuid, includeAssets, dependedAssets);
            for (const spriteFrameInfo of pacRes.spriteFrameInfos) {
                await collectDependAssets(spriteFrameInfo.uuid, includeAssets, dependedAssets);
                await collectDependAssets(spriteFrameInfo.textureUuid, includeAssets, dependedAssets);
                if (dependedAssets[spriteFrameInfo.textureUuid]) {
                    // 由于图集小图内部之间会存在互相依赖，属于伪依赖，不作为真实项目依赖考虑
                    dependedAssets[spriteFrameInfo.textureUuid] = dependedAssets[spriteFrameInfo.textureUuid].filter((uuid) => uuid !== spriteFrameInfo.uuid);
                    if (!dependedAssets[spriteFrameInfo.textureUuid].length) {
                        delete dependedAssets[spriteFrameInfo.textureUuid];
                    }
                }
                await collectDependAssets(spriteFrameInfo.imageUuid, includeAssets, dependedAssets);
                if (dependedAssets[spriteFrameInfo.imageUuid]) {
                    dependedAssets[spriteFrameInfo.imageUuid] = dependedAssets[spriteFrameInfo.imageUuid].filter((uuid) => uuid !== spriteFrameInfo.textureUuid);
                    if (!dependedAssets[spriteFrameInfo.imageUuid].length) {
                        delete dependedAssets[spriteFrameInfo.imageUuid];
                    }
                    imageCompressManager && imageCompressManager.removeTask((0, utils_1.queryImageAssetFromSubAssetByUuid)(spriteFrameInfo.uuid));
                }
            }
            console.debug('start sort bundle in pac', pacRes.uuid);
            await Promise.all((atlases).map(async (atlas) => {
                await (0, pac_1.sortBundleInPac)(this.bundles, atlas, pacRes, dependedAssets, imageCompressManager);
            }));
            console.debug('end sort bundle in pac', pacRes.uuid);
        }));
        await console_1.newConsole.trackTimeEnd('builder:pack-auto-atlas-image', { output: true });
        this.updateProcess('Pack Images success');
    }
    /**
     * 编译项目脚本
     */
    async buildScript() {
        this.updateProcess(`${i18n_1.default.t('builder.tasks.build_project_script')} start...`);
        console_1.newConsole.trackTimeStart('builder:build-project-script');
        if (this.options.buildScriptParam && !this.options.buildScriptParam.commonDir) {
            this.options.buildScriptParam.commonDir = (0, path_1.join)(this.destDir, 'src', 'chunks');
        }
        await this.scriptBuilder.initProjectOptions(this.options);
        const res = await this.scriptBuilder.buildBundleScript(this.bundles);
        const buildProjectTime = await console_1.newConsole.trackTimeEnd('builder:build-project-script');
        this.updateProcess(`${i18n_1.default.t('builder.tasks.build_project_script')} in (${buildProjectTime} ms) √`);
        return res;
    }
    /**
     * 输出所有的 bundle 资源，包含脚本、json、普通资源、纹理压缩、图集等
     */
    async outputAssets() {
        this.updateProcess('Output asset in bundles start');
        const hasCheckedAsset = new Set();
        await Promise.all(this.bundles.map(async (bundle) => {
            if (!bundle.output) {
                return;
            }
            if (this.imageCompressManager) {
                await (0, texture_compress_1.bundleOutputTask)(bundle, this.cache);
            }
            // 输出 json 分组
            await (0, json_group_1.outputJsonGroup)(bundle, this);
            await (0, bin_group_1.outputBinGroup)(bundle, this.options.binGroupConfig);
            // 循环分组内的资源
            await Promise.all(bundle.assetsWithoutRedirect.map(async (uuid) => {
                if (uuid.length <= 15 || bundle.compressTask[uuid]) {
                    // 合图资源、已参与纹理压缩的资源无需拷贝原图
                    return Promise.resolve();
                }
                // 将资源复制到指定位置
                const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
                if (!asset) {
                    console.error(`Can not get asset info with uuid(${uuid})`);
                    return;
                }
                if (!hasCheckedAsset.has(uuid)) {
                    hasCheckedAsset.add(uuid);
                    // 校验 effect 是否需要 mipmap
                    await checkEffectTextureMipmap(asset, uuid);
                }
                try {
                    await copyAssetFile(asset, bundle, this.options);
                }
                catch (error) {
                    console.error(error);
                    console.error(`output asset file error with uuid(${uuid})`);
                    return Promise.resolve();
                }
            }));
        }));
        this.updateProcess('Output asset in bundles success');
    }
    async handleHook(func, internal, ...args) {
        if (internal) {
            await func.call(this, this.options, this.bundles, this.cache);
        }
        else {
            await func();
        }
    }
    async runAllTask() {
        const weight = 1 / this.pipeline.length;
        for (const task of this.pipeline) {
            if (typeof task === 'string') {
                await this.runPluginTask(task, weight);
            }
            else if (typeof task === 'function') {
                await this.runBuildTask(task, weight);
            }
        }
    }
    async runBuildTask(handle, increment) {
        if (this.error) {
            await this.onError(this.error);
            return;
        }
        try {
            this.startProgressStep(`run bundle task ${handle.name} start!`, increment);
            await handle.bind(this)();
            this.updateProcess(`run bundle task ${handle.name} success!`, increment);
        }
        catch (error) {
            this.updateProcess(`run bundle task failed!`, increment);
            await this.onError(error);
        }
    }
}
exports.BundleManager = BundleManager;
async function collectDependAssets(uuid, allAssets, dependedAssets) {
    if (allAssets.has(uuid)) {
        const res = await asset_library_1.buildAssetLibrary.queryAssetUsers(uuid);
        res && res.length && (dependedAssets[uuid] = res);
    }
}
const featuresWithDependencies = [];
const preloadAssets = []; // 预加载资源 uuid 数组（包含脚本）
/**
 * 将资源复制到指定位置
 * @param rawAssetDir 输出文件夹路径
 * @param asset
 */
function copyAssetFile(asset, bundle, options) {
    const cconFormatSource = (0, cconb_1.getCCONFormatAssetInLibrary)(asset);
    if (cconFormatSource) {
        const isCconHandledInGroup = !!bundle.groups.find(group => group.type == 'BIN' && group.uuids.includes(asset.uuid));
        if (isCconHandledInGroup) {
            return Promise.resolve();
        }
        const rawAssetDir = (0, path_1.join)(bundle.dest, bundle.importBase);
        const source = cconFormatSource;
        const relativeName = (0, path_1.relative)((0, utils_1.getLibraryDir)(source), source);
        const dest = (0, path_1.join)((0, path_1.join)(rawAssetDir, relativeName));
        return asset_library_1.buildAssetLibrary.outputCCONAsset(asset.uuid, dest, options);
    }
    const excludeExtName = ['.json'];
    return Promise.all(asset.meta.files.map((extname) => {
        if (excludeExtName.includes(extname)) {
            return Promise.resolve();
        }
        // 规则：构建不打包 __ 开头的资源数据
        if (extname.startsWith('__')) {
            return Promise.resolve();
        }
        const rawAssetDir = (0, path_1.join)(bundle.dest, bundle.nativeBase);
        const source = extname.startsWith('.') ? asset.library + extname : (0, path_1.join)(asset.library, extname);
        // 利用相对路径来获取资源相对地址，避免耦合一些特殊资源的路径拼写规则，比如 font 
        const relativeName = (0, path_1.relative)((0, utils_1.getLibraryDir)(source), source);
        if (!(0, fs_extra_1.existsSync)(source)) {
            console.error(i18n_1.default.t('builder.error.missing_import_files', {
                path: `{link(${source})}`,
                url: `{asset(${asset.url})}`,
            }));
            return Promise.resolve();
        }
        const dest = (0, path_1.join)(rawAssetDir, relativeName);
        // 其他流程可能生成同类型后缀资源，比如压缩纹理，不能将其覆盖
        if ((0, fs_extra_1.existsSync)(dest)) {
            return Promise.resolve();
        }
        return (0, fs_extra_1.copy)(source, dest);
    }));
}
function traversalDependencies(features, featuresInJson) {
    features.forEach((featureName) => {
        if (featuresInJson[featureName]) {
            if (!featuresWithDependencies.includes(featureName)) {
                featuresWithDependencies.push(featureName);
                if (featuresInJson[featureName].dependentAssets) {
                    preloadAssets.push(...featuresInJson[featureName].dependentAssets);
                }
                if (featuresInJson[featureName].dependentScripts) {
                    preloadAssets.push(...featuresInJson[featureName].dependentScripts);
                }
                if (featuresInJson[featureName].dependentModules) {
                    const dependentModules = featuresInJson[featureName].dependentModules;
                    traversalDependencies(dependentModules, featuresInJson);
                }
            }
        }
    });
}
/**
 * 根据模块信息，查找需要预加载的资源列表（包含普通资源与脚本）
 * @param features
 * @returns
 */
async function queryPreloadAssetList(features, enginePath) {
    const ccConfigJson = await (0, fs_extra_1.readJSON)((0, path_1.join)(enginePath, 'cc.config.json'));
    const featuresInJson = ccConfigJson.features;
    featuresWithDependencies.length = 0;
    preloadAssets.length = 0;
    traversalDependencies(features, featuresInJson);
    return Array.from(new Set(preloadAssets));
}
/**
 * 查询「全部」内置预加载资源（不按 includeModules 裁剪）。
 * 预览使用完整引擎，任何子系统都可能初始化并加载其内置资源，需保证全部可用，
 * 与场景编辑器 Engine.queryInternalAssetList 行为一致。
 */
async function queryAllPreloadAssetList(enginePath) {
    const ccConfigJson = await (0, fs_extra_1.readJSON)((0, path_1.join)(enginePath, 'cc.config.json'));
    const featureNames = Object.keys(ccConfigJson.features || {});
    return queryPreloadAssetList(featureNames, enginePath);
}
/**
 * effect 设置了 requireMipmaps，对材质进行校验，若发现关联的纹理没有开启 mipmap 则输出警告
 */
async function checkEffectTextureMipmap(asset, uuid) {
    try {
        if (asset_library_1.buildAssetLibrary.getAssetProperty(asset, 'type') === 'cc.Material') {
            const mtl = (await asset_library_1.buildAssetLibrary.getInstance(asset_library_1.buildAssetLibrary.getAsset(uuid)));
            if (mtl.effectAsset && mtl.effectAsset._uuid) {
                const effect = (await asset_library_1.buildAssetLibrary.getInstance(asset_library_1.buildAssetLibrary.getAsset(mtl.effectAsset._uuid)));
                // 遍历 effect.techniques[mtl._techIdx] 下的所有 pass
                // @ts-ignore
                effect.techniques[mtl._techIdx].passes.forEach(async (pass, index) => {
                    if (pass.properties && pass.properties.mainTexture && pass.properties.mainTexture.requireMipmaps) {
                        // 引擎接口报错
                        // const mainTexture = mtl.getProperty('mainTexture', index);
                        // 获取 mainTexture 的 uuid
                        // @ts-ignore
                        const prop = mtl._props && mtl._props[index];
                        // @ts-ignore
                        if (prop.mainTexture && prop.mainTexture._uuid) {
                            // requireMipmaps === ture 的 mainTexture 校验是否开启了 mipmap
                            // @ts-ignore
                            const meta = await asset_library_1.buildAssetLibrary.getMeta(prop.mainTexture._uuid);
                            if (!['nearest', 'linear'].includes(meta.userData.mipfilter)) {
                                console.warn(i18n_1.default.t('builder.warn.require_mipmaps', {
                                    effectUUID: effect._uuid,
                                    // @ts-ignore
                                    textureUUID: prop.mainTexture._uuid,
                                }));
                            }
                        }
                    }
                });
            }
        }
    }
    catch (error) {
        console.debug(error);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL2Fzc2V0LWhhbmRsZXIvYnVuZGxlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVDQUFvRTtBQUNwRSwrQkFBK0M7QUFHL0MscUNBQWtDO0FBQ2xDLHlEQUFzRTtBQUV0RSwrQkFBd0M7QUFDeEMsNkNBQXlIO0FBQ3pILHNDQUEwQztBQUMxQyxpRUFBaUs7QUFDakssK0RBQWdFO0FBQ2hFLCtDQUF3RDtBQUN4RCx1Q0FBK0U7QUFDL0UsNkNBQWdFO0FBQ2hFLG1EQUF1RDtBQUV2RCx1REFBd0Q7QUFDeEQsbURBQXNEO0FBQ3RELDJDQUE2RDtBQUM3RCx5REFBeUQ7QUFDekQsb0VBQTRDO0FBSTVDLHVEQUEyRDtBQUMzRCxzRUFBOEM7QUFDOUMseUVBQThDO0FBQzlDLHNGQUE2RDtBQUU3RCxnRkFBNkQ7QUFDN0QscURBQTJEO0FBRTNELE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsR0FBRyxnQ0FBaUIsQ0FBQztBQUNyRSwyQkFBMkI7QUFDM0IsTUFBYSxhQUFjLFNBQVEseUJBQWE7SUFDNUMsTUFBTSxDQUFDLGlCQUFpQixHQUFHLGdDQUFpQixDQUFDO0lBQzdDLE1BQU0sQ0FBQyxhQUFhLEdBQW1HLEVBQUUsQ0FBQztJQUVsSCxLQUFLLENBQVk7SUFDekIsT0FBTyxDQUE4QjtJQUNyQyxPQUFPLENBQVM7SUFDVCxTQUFTLENBQWtCO0lBRWxDLFNBQVMsR0FBNEIsRUFBRSxDQUFDO0lBQ3hDLE9BQU8sR0FBYyxFQUFFLENBQUM7SUFFeEIsVUFBVSxHQUFhLEVBQUUsQ0FBQztJQUUxQixzQkFBc0I7SUFDdEIsc0JBQXNCLENBQW9CO0lBRTFDLFVBQVU7SUFDVixv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Q0FDeEIsYUFBYTtvQ0FDYixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLO2lDQUN0QyxDQUFDLENBQUMsQ0FBQzs0QkFDUixDQUFDO3dCQUNMLENBQUM7b0JBQ0wsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEpTT04sIGV4aXN0c1N5bmMsIGNvcHksIGVtcHR5RGlyU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGRpcm5hbWUsIGpvaW4sIHJlbGF0aXZlIH0gZnJvbSAncGF0aCc7XG5cbmltcG9ydCB0eXBlIHsgVGV4dHVyZUNvbXByZXNzIH0gZnJvbSAnLi4vdGV4dHVyZS1jb21wcmVzcyc7XG5pbXBvcnQgeyBCdW5kbGUgfSBmcm9tICcuL2J1bmRsZSc7XG5pbXBvcnQgeyBidW5kbGVEYXRhVGFzaywgYnVuZGxlT3V0cHV0VGFzayB9IGZyb20gJy4vdGV4dHVyZS1jb21wcmVzcyc7XG5pbXBvcnQgdHlwZSB7IFBhY0luZm8gfSBmcm9tICcuLi90ZXh0dXJlLXBhY2tlci9wYWMtaW5mbyc7XG5pbXBvcnQgeyBzb3J0QnVuZGxlSW5QYWMgfSBmcm9tICcuL3BhYyc7XG5pbXBvcnQgeyBnZXRDQ09ORm9ybWF0QXNzZXRJbkxpYnJhcnksIGdldERlc2lyZWRDQ09ORXh0ZW5zaW9uTWFwLCBoYXNDQ09ORm9ybWF0QXNzZXRJbkxpYnJhcnkgfSBmcm9tICcuLi8uLi91dGlscy9jY29uYic7XG5pbXBvcnQgeyBTY3JpcHRCdWlsZGVyIH0gZnJvbSAnLi4vc2NyaXB0JztcbmltcG9ydCB7IEJ1aWx0aW5CdW5kbGVOYW1lLCBCdW5kbGVDb21wcmVzc2lvblR5cGVzLCBEZWZhdWx0QnVuZGxlQ29uZmlnLCBnZXRCdW5kbGVEZWZhdWx0TmFtZSwgdHJhbnNmb3JtUGxhdGZvcm1TZXR0aW5ncyB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlL2J1bmRsZS11dGlscyc7XG5pbXBvcnQgeyBidWlsZEFzc2V0TGlicmFyeSB9IGZyb20gJy4uLy4uL21hbmFnZXIvYXNzZXQtbGlicmFyeSc7XG5pbXBvcnQgeyBCdWlsZGVyQXNzZXRDYWNoZSB9IGZyb20gJy4uLy4uL21hbmFnZXIvYXNzZXQnO1xuaW1wb3J0IHsgZ2V0TGlicmFyeURpciwgcXVlcnlJbWFnZUFzc2V0RnJvbVN1YkFzc2V0QnlVdWlkIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgaGFuZGxlSnNvbkdyb3VwLCBvdXRwdXRKc29uR3JvdXAgfSBmcm9tICcuL2pzb24tZ3JvdXAnO1xuaW1wb3J0IHsgZGVmYXVsdHNEZWVwIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvdXRpbHMnO1xuaW1wb3J0IHsgRWZmZWN0QXNzZXQsIE1hdGVyaWFsIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgQnVpbGRUYXNrQmFzZSB9IGZyb20gJy4uLy4uL21hbmFnZXIvdGFzay1iYXNlJztcbmltcG9ydCB7IGNvbXBhcmVVVUlEIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvdXRpbHMnO1xuaW1wb3J0IHsgaGFuZGxlQmluR3JvdXAsIG91dHB1dEJpbkdyb3VwIH0gZnJvbSAnLi9iaW4tZ3JvdXAnO1xuaW1wb3J0IHsgbmV3Q29uc29sZSB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2Jhc2UvY29uc29sZSc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi8uLi8uLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgSUFzc2V0IH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXNzZXRzL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgSUJ1bmRsZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMnO1xuaW1wb3J0IHsgSUJ1bmRsZU1hbmFnZXIsIElCdWlsZGVyLCBJSW50ZXJuYWxCdW5kbGVCdWlsZE9wdGlvbnMsIElCdWlsZEhvb2tzSW5mbywgSUJ1bmRsZSwgQ3VzdG9tQnVuZGxlQ29uZmlnLCBCdW5kbGVSZW5kZXJDb25maWcsIEJ1bmRsZVBsYXRmb3JtVHlwZSwgSUJ1bmRsZUluaXRPcHRpb25zLCBJQnVuZGxlQnVpbGRPcHRpb25zLCBJQnVpbGRPcHRpb25CYXNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBwbHVnaW5NYW5hZ2VyIH0gZnJvbSAnLi4vLi4vLi4vLi4vbWFuYWdlci9wbHVnaW4nO1xuaW1wb3J0IHV0aWxzIGZyb20gJy4uLy4uLy4uLy4uLy4uL2Jhc2UvdXRpbHMnO1xuaW1wb3J0IHNjcmlwdCBmcm9tICcuLi8uLi8uLi8uLi8uLi9zY3JpcHRpbmcnO1xuaW1wb3J0IGJ1aWxkZXJDb25maWcgZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmUvYnVpbGRlci1jb25maWcnO1xuaW1wb3J0IHsgSVBsdWdpblNjcmlwdEluZm8gfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zY3JpcHRpbmcvaW50ZXJmYWNlJztcbmltcG9ydCBhc3NldFF1ZXJ5IGZyb20gJy4uLy4uLy4uLy4uLy4uL2Fzc2V0cy9tYW5hZ2VyL3F1ZXJ5JztcbmltcG9ydCB7IEJ1aWxkR2xvYmFsSW5mbyB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlL2dsb2JhbCc7XG5cbmNvbnN0IHsgTUFJTiwgU1RBUlRfU0NFTkUsIElOVEVSTkFMLCBSRVNPVVJDRVMgfSA9IEJ1aWx0aW5CdW5kbGVOYW1lO1xuLy8g5Y+qIEJ1bmRsZSDmnoTlu7rml7bvvIzlj6/otbDmraTnsbvnmoTnlJ/miJDmiafooYzlh73mlbBcbmV4cG9ydCBjbGFzcyBCdW5kbGVNYW5hZ2VyIGV4dGVuZHMgQnVpbGRUYXNrQmFzZSBpbXBsZW1lbnRzIElCdW5kbGVNYW5hZ2VyIHtcbiAgICBzdGF0aWMgQnVpbHRpbkJ1bmRsZU5hbWUgPSBCdWlsdGluQnVuZGxlTmFtZTtcbiAgICBzdGF0aWMgQnVuZGxlQ29uZmlnczogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgeyBpc1JlbW90ZTogYm9vbGVhbiwgY29tcHJlc3Npb25UeXBlOiBCdW5kbGVDb21wcmVzc2lvblR5cGVzIH0+PiA9IHt9O1xuXG4gICAgcHJpdmF0ZSBfdGFzaz86IElCdWlsZGVyO1xuICAgIG9wdGlvbnM6IElJbnRlcm5hbEJ1bmRsZUJ1aWxkT3B0aW9ucztcbiAgICBkZXN0RGlyOiBzdHJpbmc7XG4gICAgcHVibGljIGhvb2tzSW5mbzogSUJ1aWxkSG9va3NJbmZvO1xuXG4gICAgYnVuZGxlTWFwOiBSZWNvcmQ8c3RyaW5nLCBJQnVuZGxlPiA9IHt9O1xuICAgIGJ1bmRsZXM6IElCdW5kbGVbXSA9IFtdO1xuXG4gICAgX3BhY0Fzc2V0czogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIOaMieeFp+S8mOWFiOe6p+aOkuW6j+i/h+eahCBidW5kbGUg5pWw57uEXG4gICAgX2J1bmRsZUdyb3VwSW5Qcmlvcml0eT86IEFycmF5PElCdW5kbGVbXT47XG5cbiAgICAvLyDnurnnkIbljovnvKnnrqHnkIblmahcbiAgICBpbWFnZUNvbXByZXNzTWFuYWdlcj86IFRleHR1cmVDb21wcmVzcztcbiAgICBzY3JpcHRCdWlsZGVyOiBTY3JpcHRCdWlsZGVyO1xuICAgIHBhY2tSZXN1bHRzOiBQYWNJbmZvW10gPSBbXTtcbiAgICBjYWNoZTogQnVpbGRlckFzc2V0Q2FjaGU7XG5cbiAgICBwdWJsaWMgaG9va01hcCA9IHtcbiAgICAgICAgb25CZWZvcmVCdW5kbGVJbml0OiAnb25CZWZvcmVCdW5kbGVJbml0JyxcbiAgICAgICAgb25BZnRlckJ1bmRsZUluaXQ6ICdvbkFmdGVyQnVuZGxlSW5pdCcsXG4gICAgICAgIG9uQmVmb3JlQnVuZGxlRGF0YVRhc2s6ICdvbkJlZm9yZUJ1bmRsZURhdGFUYXNrJyxcbiAgICAgICAgb25BZnRlckJ1bmRsZURhdGFUYXNrOiAnb25BZnRlckJ1bmRsZURhdGFUYXNrJyxcbiAgICAgICAgb25CZWZvcmVCdW5kbGVCdWlsZFRhc2s6ICdvbkJlZm9yZUJ1bmRsZUJ1aWxkVGFzaycsXG4gICAgICAgIG9uQWZ0ZXJCdW5kbGVCdWlsZFRhc2s6ICdvbkFmdGVyQnVuZGxlQnVpbGRUYXNrJyxcbiAgICB9O1xuXG4gICAgLy8g5omn6KGM5pW05Liq5p6E5bu65rWB56iL55qE6aG65bqP5rWB56iLXG4gICAgcHVibGljIHBpcGVsaW5lOiAoc3RyaW5nIHwgRnVuY3Rpb24pW10gPSBbXG4gICAgICAgIHRoaXMuaW5pdE9wdGlvbnMsXG4gICAgICAgIHRoaXMuaG9va01hcC5vbkJlZm9yZUJ1bmRsZUluaXQsXG4gICAgICAgIHRoaXMuaW5pdEJ1bmRsZSxcbiAgICAgICAgdGhpcy5ob29rTWFwLm9uQWZ0ZXJCdW5kbGVJbml0LFxuICAgICAgICB0aGlzLmhvb2tNYXAub25CZWZvcmVCdW5kbGVEYXRhVGFzayxcbiAgICAgICAgdGhpcy5pbml0QXNzZXQsXG4gICAgICAgIHRoaXMuYnVuZGxlRGF0YVRhc2ssXG4gICAgICAgIHRoaXMuaG9va01hcC5vbkFmdGVyQnVuZGxlRGF0YVRhc2ssXG4gICAgICAgIHRoaXMuaG9va01hcC5vbkJlZm9yZUJ1bmRsZUJ1aWxkVGFzayxcbiAgICAgICAgdGhpcy5jbGVhckJ1bmRsZURlc3QsXG4gICAgICAgIHRoaXMuYnVpbGRTY3JpcHQsXG4gICAgICAgIHRoaXMuYnVpbGRBc3NldCxcbiAgICAgICAgdGhpcy5ob29rTWFwLm9uQWZ0ZXJCdW5kbGVCdWlsZFRhc2ssXG4gICAgICAgIHRoaXMub3V0cHV0QnVuZGxlLFxuICAgIF07XG5cbiAgICBnZXQgYnVuZGxlR3JvdXBJblByaW9yaXR5KCkge1xuICAgICAgICBpZiAodGhpcy5fYnVuZGxlR3JvdXBJblByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYnVuZGxlR3JvdXBJblByaW9yaXR5O1xuICAgICAgICB9XG4gICAgICAgIC8vIGJ1bmRsZSDmjInkvJjlhYjnuqfliIbnu4RcbiAgICAgICAgbGV0IGJ1bmRsZUdyb3VwSW5Qcmlvcml0eSA9IG5ldyBBcnJheTxJQnVuZGxlW10+KDIxKTtcbiAgICAgICAgdGhpcy5idW5kbGVzLmZvckVhY2goKGJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFidW5kbGVHcm91cEluUHJpb3JpdHlbYnVuZGxlLnByaW9yaXR5IC0gMV0pIHtcbiAgICAgICAgICAgICAgICBidW5kbGVHcm91cEluUHJpb3JpdHlbYnVuZGxlLnByaW9yaXR5IC0gMV0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1bmRsZUdyb3VwSW5Qcmlvcml0eVtidW5kbGUucHJpb3JpdHkgLSAxXS5wdXNoKGJ1bmRsZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBidW5kbGVHcm91cEluUHJpb3JpdHkgPSBidW5kbGVHcm91cEluUHJpb3JpdHkuZmlsdGVyKChncm91cCkgPT4gZ3JvdXApLnJldmVyc2UoKTtcbiAgICAgICAgdGhpcy5fYnVuZGxlR3JvdXBJblByaW9yaXR5ID0gYnVuZGxlR3JvdXBJblByaW9yaXR5O1xuICAgICAgICByZXR1cm4gYnVuZGxlR3JvdXBJblByaW9yaXR5O1xuXG4gICAgfVxuXG4gICAgc3RhdGljIGludGVybmFsQnVuZGxlUHJpb3JpdHk6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7XG4gICAgICAgIFtNQUlOXTogNyxcbiAgICAgICAgW1NUQVJUX1NDRU5FXTogMjAsXG4gICAgICAgIFtJTlRFUk5BTF06IDIxLFxuICAgICAgICBbUkVTT1VSQ0VTXTogOCxcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihvcHRpb25zOiBJQnVpbGRPcHRpb25CYXNlLCBpbWFnZUNvbXByZXNzTWFuYWdlcjogVGV4dHVyZUNvbXByZXNzIHwgbnVsbCwgdGFzaz86IElCdWlsZGVyKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMudGFza0lkISwgJ0J1bmRsZSBUYXNrJyk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgVE9ETyDooaXlhaggb3B0aW9ucyDkuLogSUludGVybmFsQnVuZGxlQnVpbGRPcHRpb25zXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgYXMgSUludGVybmFsQnVuZGxlQnVpbGRPcHRpb25zO1xuICAgICAgICBpZiAoaW1hZ2VDb21wcmVzc01hbmFnZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaW1hZ2VDb21wcmVzc01hbmFnZXIgPSBpbWFnZUNvbXByZXNzTWFuYWdlcjtcbiAgICAgICAgICAgIGltYWdlQ29tcHJlc3NNYW5hZ2VyLm9uKCd1cGRhdGUtcHJvZ3Jlc3MnLCAobWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvY2VzcyhtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Rhc2sgPSB0YXNrO1xuICAgICAgICB0aGlzLmRlc3REaXIgPSB0aGlzLm9wdGlvbnMuZGVzdCAmJiB1dGlscy5QYXRoLnJlc29sdmVUb1Jhdyh0aGlzLm9wdGlvbnMuZGVzdCkgfHwgam9pbihidWlsZGVyQ29uZmlnLnByb2plY3RSb290LCAnYnVpbGQnLCAnYXNzZXRCdW5kbGUnKTtcbiAgICAgICAgdGhpcy5zY3JpcHRCdWlsZGVyID0gbmV3IFNjcmlwdEJ1aWxkZXIoKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmNhY2hlID0gdGFzayA/IHRhc2suY2FjaGUgOiBuZXcgQnVpbGRlckFzc2V0Q2FjaGUoKTtcbiAgICAgICAgdGhpcy5ob29rc0luZm8gPSB0YXNrID8gdGFzay5ob29rc0luZm8gOiBwbHVnaW5NYW5hZ2VyLmdldEhvb2tzSW5mbyh0aGlzLm9wdGlvbnMucGxhdGZvcm0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBhc3luYyBjcmVhdGUob3B0aW9uczogSUJ1aWxkT3B0aW9uQmFzZSwgdGFzaz86IElCdWlsZGVyKSB7XG4gICAgICAgIGlmICghb3B0aW9ucy5za2lwQ29tcHJlc3NUZXh0dXJlKSB7XG4gICAgICAgICAgICBjb25zdCB7IFRleHR1cmVDb21wcmVzcyB9ID0gYXdhaXQgaW1wb3J0KCcuLi90ZXh0dXJlLWNvbXByZXNzJyk7XG4gICAgICAgICAgICBjb25zdCBpbWFnZUNvbXByZXNzTWFuYWdlciA9IG5ldyBUZXh0dXJlQ29tcHJlc3Mob3B0aW9ucy5wbGF0Zm9ybSwgb3B0aW9ucy51c2VDYWNoZUNvbmZpZz8udGV4dHVyZUNvbXByZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVuZGxlTWFuYWdlcihvcHRpb25zLCBpbWFnZUNvbXByZXNzTWFuYWdlciwgdGFzayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBCdW5kbGVNYW5hZ2VyKG9wdGlvbnMsIG51bGwsIHRhc2spO1xuICAgIH1cblxuICAgIGFzeW5jIGxvYWRTY3JpcHQoc2NyaXB0VXVpZHM6IHN0cmluZ1tdLCBwbHVnaW5TY3JpcHRzOiBJUGx1Z2luU2NyaXB0SW5mb1tdKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucHJldmlldykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHNjcmlwdC5sb2FkU2NyaXB0KHNjcmlwdFV1aWRzLCBwbHVnaW5TY3JpcHRzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliJ3lp4vljJbpobnnm67orr7nva7nmoTkuIDkupsgYnVuZGxlIOmFjee9ruS/oeaBr1xuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBpbml0U3RhdGljQnVuZGxlQ29uZmlnKCkge1xuICAgICAgICBjb25zdCBidW5kbGVDb25maWc6IFJlY29yZDxzdHJpbmcsIEN1c3RvbUJ1bmRsZUNvbmZpZz4gPSAoYXdhaXQgYnVpbGRlckNvbmZpZy5nZXRQcm9qZWN0KCdidW5kbGVDb25maWcuY3VzdG9tJykpIHx8IHt9O1xuICAgICAgICBjb25zdCBwbGF0Zm9ybUNvbmZpZ3MgPSBwbHVnaW5NYW5hZ2VyLnF1ZXJ5QnVuZGxlQ29uZmlnKCk7XG4gICAgICAgIGlmICghYnVuZGxlQ29uZmlnLmRlZmF1bHQpIHtcbiAgICAgICAgICAgIGJ1bmRsZUNvbmZpZy5kZWZhdWx0ID0gRGVmYXVsdEJ1bmRsZUNvbmZpZztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMoYnVuZGxlQ29uZmlnKS5mb3JFYWNoKChJRCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29uZmlncyA9IGJ1bmRsZUNvbmZpZ1tJRF0uY29uZmlncztcbiAgICAgICAgICAgIHJlc1tJRF0gPSB7fTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbmZpZ3MpLmZvckVhY2goKHBsYXRmb3JtVHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcGxhdGZvcm1Db25maWdzW3BsYXRmb3JtVHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bmz5Y+w5Y+v6IO96KKr5YWz6Zet77yM6L+Z6YeM6ZyA6KaB5a656ZSZXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcGxhdGZvcm1PcHRpb24gPSB0cmFuc2Zvcm1QbGF0Zm9ybVNldHRpbmdzKGNvbmZpZ3NbcGxhdGZvcm1UeXBlIGFzIEJ1bmRsZVBsYXRmb3JtVHlwZV0sIHBsYXRmb3JtQ29uZmlnc1twbGF0Zm9ybVR5cGVdLnBsYXRmb3JtQ29uZmlncyk7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihyZXNbSURdLCBwbGF0Zm9ybU9wdGlvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIEJ1bmRsZU1hbmFnZXIuQnVuZGxlQ29uZmlncyA9IHJlcztcbiAgICB9XG5cbiAgICBnZXRVc2VyQ29uZmlnKElEID0gJ2RlZmF1bHQnKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ01hcCA9IEJ1bmRsZU1hbmFnZXIuQnVuZGxlQ29uZmlnc1tJRF07XG4gICAgICAgIGlmICghY29uZmlnTWFwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb25maWdNYXBbdGhpcy5vcHRpb25zLnBsYXRmb3JtXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlr7kgb3B0aW9ucyDkuIrnmoTmlbDmja7lgZrooaXlhajlpITnkIZcbiAgICAgKi9cbiAgICBhc3luYyBpbml0T3B0aW9ucygpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnBsYXRmb3JtVHlwZSA9IHBsdWdpbk1hbmFnZXIucGxhdGZvcm1Db25maWdbdGhpcy5vcHRpb25zLnBsYXRmb3JtXS5wbGF0Zm9ybVR5cGU7XG4gICAgICAgIHRoaXMub3B0aW9ucy5idWlsZFNjcmlwdFBhcmFtID0ge1xuICAgICAgICAgICAgZXhwZXJpbWVudGFsRXJhc2VNb2R1bGVzOiB0aGlzLm9wdGlvbnMuZXhwZXJpbWVudGFsRXJhc2VNb2R1bGVzLFxuICAgICAgICAgICAgb3V0cHV0TmFtZTogJ3Byb2plY3QnLFxuICAgICAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgICAgICBERUJVRzogISF0aGlzLm9wdGlvbnMuZGVidWcsXG4gICAgICAgICAgICAgICAgLi4udGhpcy5vcHRpb25zLmZsYWdzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvbHlmaWxsczogdGhpcy5vcHRpb25zLnBvbHlmaWxscyxcbiAgICAgICAgICAgIGhvdE1vZHVsZVJlbG9hZDogZmFsc2UsXG4gICAgICAgICAgICBwbGF0Zm9ybTogdGhpcy5vcHRpb25zLnBsYXRmb3JtVHlwZSB8fCAnSU5WQUxJRF9QTEFURk9STScsIC8vIHYzLjguNiDlvIDlp4sgY2NidWlsZCDmlK/mjIEgJ0lOVkFMSURfUExBVEZPUk0nIOihqOekuuaXoOaViOW5s+WPsO+8jOmYsuatouS5i+WJjeWIneWni+WMluS4uiAnSFRNTDUnIOWQju+8jOW5s+WPsOaPkuS7tuW/mOiusOimhuebliBwbGF0Zm9ybSDlj4LmlbDlr7zoh7TotbAgJ0hUTUw1JyDnmoTlvJXmk47miZPljIXmtYHnqIvlr7zoh7TnmoTovoPpmr7mjpLmn6XnmoTpl67pophcbiAgICAgICAgICAgIGNvbW1vbkRpcjogJycsXG4gICAgICAgICAgICBidW5kbGVDb21tb25DaHVuazogdGhpcy5vcHRpb25zLmJ1bmRsZUNvbW1vbkNodW5rID8/IGZhbHNlLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub3B0aW9ucy5hc3NldFNlcmlhbGl6ZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICAnY2MuRWZmZWN0QXNzZXQnOiB7XG4gICAgICAgICAgICAgICAgZ2xzbDE6IHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygnZ2Z4LXdlYmdsJyksXG4gICAgICAgICAgICAgICAgZ2xzbDM6IHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygnZ2Z4LXdlYmdsMicpLFxuICAgICAgICAgICAgICAgIGdsc2w0OiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY2xlYXJCdW5kbGVEZXN0KCkge1xuICAgICAgICB0aGlzLmJ1bmRsZXMuZm9yRWFjaCgoYnVuZGxlKSA9PiB7XG4gICAgICAgICAgICBpZiAoYnVuZGxlLm91dHB1dCkge1xuICAgICAgICAgICAgICAgIGVtcHR5RGlyU3luYyhidW5kbGUuZGVzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIneWni+WMluaVtOeQhui1hOa6kOWIl+ihqFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBpbml0QXNzZXQoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5pdEJ1bmRsZVJvb3RBc3NldHMoKTtcbiAgICAgICAgLy8g6ZyA6KaB5ZyoIHRoaXMuY2FjaGUg5Yid5aeL5YyW5ZCO5LmL5ZCO5omn6KGMXG4gICAgICAgIGF3YWl0IHRoaXMubG9hZFNjcmlwdCh0aGlzLmNhY2hlLnNjcmlwdFV1aWRzLCBhc3NldFF1ZXJ5LnF1ZXJ5U29ydGVkUGx1Z2lucygpKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0QnVuZGxlU2hhcmVBc3NldHMoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0QnVuZGxlQ29uZmlnKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGluaXRCdW5kbGVDb25maWcoKSB7XG4gICAgICAgIGZvciAoY29uc3QgYnVuZGxlIG9mIHRoaXMuYnVuZGxlcykge1xuICAgICAgICAgICAgLy8gVE9ETyDlup/lvIMgYnVuZGxlIOeahCBjb25maWcg57uT5p6E77yM6L6T5Ye6IGNvbmZpZyDml7bljbPml7bmlbTnkIbljbPlj69cbiAgICAgICAgICAgIC8vIOatpOWkhOeahOaVtOeQhuWunumZheS4iuS7heS4uumihOiniOacjeWKoVxuICAgICAgICAgICAgYnVuZGxlLmluaXRDb25maWcoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucHJldmlldykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGJ1bmRsZS5pbml0QXNzZXRQYXRocygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGJ1aWxkQXNzZXQoKSB7XG4gICAgICAgIC8vIOWFiOiHquWKqOWbvumbhuWGjee6ueeQhuWOi+e8qVxuICAgICAgICBhd2FpdCB0aGlzLnBhY2tJbWFnZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbXByZXNzSW1hZ2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5vdXRwdXRBc3NldHMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDni6znq4vmnoTlu7ogQnVuZGxlIOaXtuiwg+eUqFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBydW4oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDni6znq4vmnoTlu7ogQnVuZGxlIOaXtu+8jOS4jeiDveaKveWPluWFrOWFseiEmuacrOWIsCBzcmNcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5idW5kbGVDb21tb25DaHVuayA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bkFsbFRhc2soKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5zdG9wUHJvZ3Jlc3NIZWFydGJlYXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBvdXRwdXRCdW5kbGUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlUHJvY2VzcygnT3V0cHV0IGFzc2V0IGluIGJ1bmRsZXMgc3RhcnQnKTtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5idW5kbGVzLm1hcChhc3luYyAoYnVuZGxlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWJ1bmRsZS5vdXRwdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBidW5kbGUuYnVpbGQoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoJ091dHB1dCBhc3NldCBpbiBidW5kbGVzIHN1Y2Nlc3MnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZEJ1bmRsZShvcHRpb25zOiBJQnVuZGxlSW5pdE9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHRoaXMuYnVuZGxlTWFwW29wdGlvbnMubmFtZV0pIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld05hbWUgPSBvcHRpb25zLm5hbWUgKyBEYXRlLm5vdygpO1xuICAgICAgICAgICAgLy8gQnVuZGxlIOmHjeWQjeS8muWvvOiHtOiEmuacrOWGheWKqOaAgeWKoOi9veWHuumUme+8jOmcgOimgeWPiuaXtuaPkOekulxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihpMThuLnQoJ2J1aWxkZXIuYXNzZXRfYnVuZGxlLmR1cGxpY2F0ZV9uYW1lX21lc3NhZ2VkX2F1dG9fcmVuYW1lJywge1xuICAgICAgICAgICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgICAgICAgICAgICBuZXdOYW1lLFxuICAgICAgICAgICAgICAgIHVybDogdGhpcy5idW5kbGVNYXBbb3B0aW9ucy5uYW1lXS5yb290LFxuICAgICAgICAgICAgICAgIG5ld1VybDogb3B0aW9ucy5yb290LFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgb3B0aW9ucy5uYW1lID0gbmV3TmFtZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJ1bmRsZU1hcFtvcHRpb25zLm5hbWVdID0gbmV3IEJ1bmRsZShvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldERlZmF1bHRCdW5kbGVDb25maWcobmFtZTogc3RyaW5nKTogSUJ1bmRsZUluaXRPcHRpb25zIHtcbiAgICAgICAgY29uc3QgZGVzdCA9IGpvaW4odGhpcy5kZXN0RGlyLCBuYW1lKTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFByaW9yaXR5OiBudW1iZXIgPSBCdW5kbGVNYW5hZ2VyLmludGVybmFsQnVuZGxlUHJpb3JpdHlbbmFtZV07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgZGVzdCxcbiAgICAgICAgICAgIHJvb3Q6ICcnLFxuICAgICAgICAgICAgc2NyaXB0RGVzdDogam9pbihkZXN0LCBCdWlsZEdsb2JhbEluZm8uU0NSSVBUX05BTUUpLFxuICAgICAgICAgICAgcHJpb3JpdHk6IGRlZmF1bHRQcmlvcml0eSB8fCAxLFxuICAgICAgICAgICAgY29tcHJlc3Npb25UeXBlOiBCdW5kbGVDb21wcmVzc2lvblR5cGVzLk1FUkdFX0RFUCxcbiAgICAgICAgICAgIGlzUmVtb3RlOiBmYWxzZSxcbiAgICAgICAgICAgIG1kNUNhY2hlOiB0aGlzLm9wdGlvbnMubWQ1Q2FjaGUsXG4gICAgICAgICAgICBkZWJ1ZzogdGhpcy5vcHRpb25zLmRlYnVnLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagueaNruWPguaVsOWIneWni+WMluS4gOS6m+S/oeaBr+mFjee9ru+8jOaVtOeQhuaJgOacieeahCBidW5kbGUg5YiG57uE5L+h5oGvXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGluaXRCdW5kbGUoKSB7XG4gICAgICAgIGF3YWl0IEJ1bmRsZU1hbmFnZXIuaW5pdFN0YXRpY0J1bmRsZUNvbmZpZygpO1xuICAgICAgICBjb25zdCBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICBjb25zdCBjb2Nvc0J1bmRsZXM6IHN0cmluZ1tdID0gW01BSU4sIFNUQVJUX1NDRU5FLCBJTlRFUk5BTF07XG4gICAgICAgIGNvbnN0IGludGVybmFsQnVuZGxlQ29uZmlnTWFwOiBSZWNvcmQ8c3RyaW5nLCBJQnVuZGxlT3B0aW9ucz4gPSB7fTtcbiAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKCdJbml0IGFsbCBidW5kbGVzIHN0YXJ0Li4uJyk7XG4gICAgICAgIGNvbnN0IGJ1bmRsZUFzc2V0cyA9IGF3YWl0IGJ1aWxkQXNzZXRMaWJyYXJ5LnF1ZXJ5QXNzZXRzQnlPcHRpb25zKHsgaXNCdW5kbGU6IHRydWUgfSk7XG4gICAgICAgIG9wdGlvbnMuYnVuZGxlQ29uZmlncyA9IG9wdGlvbnMuYnVuZGxlQ29uZmlncyB8fCBbXTtcbiAgICAgICAgLy8g5pW055CG5omA5pyJ55qEIGJ1bmRsZSDkv6Hmga9cbiAgICAgICAgaWYgKG9wdGlvbnMuYnVuZGxlQ29uZmlncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuYnVuZGxlQ29uZmlncy5mb3JFYWNoKChjdXN0b21Db25maWcpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY29jb3NCdW5kbGVzLmluY2x1ZGVzKGN1c3RvbUNvbmZpZy5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBpbnRlcm5hbEJ1bmRsZUNvbmZpZ01hcFtjdXN0b21Db25maWcubmFtZV0gPSBjdXN0b21Db25maWc7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5wYXRjaFByb2plY3RCdW5kbGVDb25maWcoY3VzdG9tQ29uZmlnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgYnVuZGxlIGNvbmZpZzogJywgY3VzdG9tQ29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmFkZEJ1bmRsZShjb25maWcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3RoZXJCdW5kbGVPdXRwdXQgPSBvcHRpb25zLmJ1bmRsZUNvbmZpZ3MubGVuZ3RoID8gZmFsc2UgOiAodGhpcy5fdGFzayA/IHRydWUgOiBmYWxzZSk7XG4gICAgICAgIGlmICghb3B0aW9ucy5idWlsZEJ1bmRsZU9ubHkpIHtcbiAgICAgICAgICAgIC8vIOmdnuWPqiBCdW5kbGUg5p6E5bu65qih5byP5LiL77yM6ZyA6KaB6KGl5YWo5YW25LuW6aG555uu5YaF5a2Y5Zyo55qEIGJ1bmRsZSDkv6Hmga9cbiAgICAgICAgICAgIGJ1bmRsZUFzc2V0cy5mb3JFYWNoKChhc3NldEluZm8pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLnBhdGNoUHJvamVjdEJ1bmRsZUNvbmZpZyh7XG4gICAgICAgICAgICAgICAgICAgIHJvb3Q6IGFzc2V0SW5mby51cmwsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmICghY29uZmlnIHx8IHRoaXMuYnVuZGxlTWFwW2NvbmZpZy5uYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbmZpZy5vdXRwdXQgPSBvdGhlckJ1bmRsZU91dHB1dDtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEJ1bmRsZShjb25maWcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5q2j5bi45p6E5bu65qih5byP77yM5oiW6ICF5LuF5p6E5bu6IEJ1bmRsZSDmqKHlvI/mnInlhoXnva4gQnVuZGxlIOeahOiHquWumuS5iemFjee9ruaJjeiHquWKqOihpeWFqFxuICAgICAgICBpZiAoIW9wdGlvbnMuYnVpbGRCdW5kbGVPbmx5IHx8IE9iamVjdC5rZXlzKGludGVybmFsQnVuZGxlQ29uZmlnTWFwKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIOajgOafpeWhq+WFhee8lui+keWZqOWGhee9riBCdW5kbGVcbiAgICAgICAgICAgIHRoaXMuaW5pdEludGVybmFsQnVuZGxlQ29uZmlncyhpbnRlcm5hbEJ1bmRsZUNvbmZpZ01hcCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5idW5kbGVzID0gT2JqZWN0LnZhbHVlcyh0aGlzLmJ1bmRsZU1hcCkuc29ydCgoYnVuZGxlQSwgYnVuZGxlQikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChidW5kbGVCLnByaW9yaXR5IC0gYnVuZGxlQS5wcmlvcml0eSkgfHwgY29tcGFyZVVVSUQoYnVuZGxlQS5uYW1lLCBidW5kbGVCLm5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8g5a2Y5ZyoIGJ1bmRsZUNvbmZpZ3Mg5pe277yM5aaC5p6c5b6q546v5a6M5rKh5pyJ6I635Y+W5Yiw5Lu75L2VIGJ1bmRsZSDliJnku6PooajphY3nva7mnInor6/vvIzpnIDopoHmiqXplJnkuK3mlq1cbiAgICAgICAgaWYgKCF0aGlzLmJ1bmRsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYnVuZGxlIGNvbmZpZywgcGxlYXNlIGNoZWNrIHlvdXIgYnVuZGxlIGNvbmZpZycpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlUHJvY2VzcyhgTnVtIG9mIGJ1bmRsZXM6ICR7dGhpcy5idW5kbGVzLmxlbmd0aH0uLi5gKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliJ3lp4vljJblhoXnva4gQnVuZGxl77yI55Sx5LqO5LiA5Lqb5Y6G5Y+y55qEIGJ1bmRsZSDooYzkuLrphY3nva7vvIzlhoXnva4gQnVuZGxlIOeahOmFjee9rumcgOimgeWNleeLrOWkhOeQhu+8iVxuICAgICAqL1xuICAgIHByaXZhdGUgaW5pdEludGVybmFsQnVuZGxlQ29uZmlncyhpbnRlcm5hbEJ1bmRsZUNvbmZpZ01hcDogUmVjb3JkPHN0cmluZywgSUJ1bmRsZU9wdGlvbnM+KSB7XG4gICAgICAgIC8vIOazqOaEj+mhuuW6j++8jFNUQVJUX1NDRU5FLCBJTlRFUk5BTCDnmoTpu5jorqTphY3nva7kvJrlj5boh6ogTUFJTiDnmoTphY3nva5cbiAgICAgICAgY29uc3QgY29jb3NCdW5kbGVzOiBzdHJpbmdbXSA9IFtNQUlOLCBTVEFSVF9TQ0VORSwgSU5URVJOQUxdO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLm9wdGlvbnMuYnVpbGRCdW5kbGVPbmx5ID8gZmFsc2UgOiB0cnVlO1xuXG4gICAgICAgIGNvY29zQnVuZGxlcy5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gU1RBUlRfU0NFTkUgJiYgIXRoaXMub3B0aW9ucy5zdGFydFNjZW5lQXNzZXRCdW5kbGUgJiYgIWludGVybmFsQnVuZGxlQ29uZmlnTWFwW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5idWlsZEJ1bmRsZU9ubHkgJiYgIWludGVybmFsQnVuZGxlQ29uZmlnTWFwW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGNvbmZpZzogSUJ1bmRsZUluaXRPcHRpb25zID0gdGhpcy5nZXREZWZhdWx0QnVuZGxlQ29uZmlnKG5hbWUpO1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tQ29uZmlnOiBJQnVuZGxlT3B0aW9ucyA9IGludGVybmFsQnVuZGxlQ29uZmlnTWFwW25hbWVdIHx8IHsgbmFtZSB9O1xuICAgICAgICAgICAgY29uZmlnID0gZGVmYXVsdHNEZWVwKE9iamVjdC5hc3NpZ24oe30sIGN1c3RvbUNvbmZpZyksIGNvbmZpZyk7XG4gICAgICAgICAgICAvLyDmlbTnkIblkI7nmoTmlbDmja7vvIzlhbbku5blhoXnva4gQnVuZGxlIOWPr+iDveS8muWGjeasoeS9v+eUqO+8jOmcgOimgeWtmOWIsCBpbnRlcm5hbEJ1bmRsZUNvbmZpZ01hcFxuICAgICAgICAgICAgaW50ZXJuYWxCdW5kbGVDb25maWdNYXBbbmFtZV0gPSBjb25maWc7XG4gICAgICAgICAgICBjb25maWcub3V0cHV0ID0gY3VzdG9tQ29uZmlnLm91dHB1dCA/PyBvdXRwdXQ7XG4gICAgICAgICAgICBpZiAoY3VzdG9tQ29uZmlnLm5hbWUgPT09IE1BSU4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1JlbW90ZSA9IHRoaXMub3B0aW9ucy5tYWluQnVuZGxlSXNSZW1vdGU7XG4gICAgICAgICAgICAgICAgLy8g5aaC5pyq6YWN572u6L+c56iL5pyN5Yqh5Zmo5Zyw5Z2A77yM5Y+W5raI5Li75YyF55qE6L+c56iL5YyF6YWN572u77yM6ZyA6KaB5a+85Ye655qEIGJ1bmRsZSDmiY3orablkYpcbiAgICAgICAgICAgICAgICBpZiAoY3VzdG9tQ29uZmlnLm91dHB1dCAmJiBpc1JlbW90ZSAmJiAhdGhpcy5vcHRpb25zLnNlcnZlciAmJiAhdGhpcy5vcHRpb25zLnByZXZpZXcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGkxOG4udCgnYnVpbGRlci53YXJuLmFzc2V0X2J1bmRsZV9pc19yZW1vdGVfaW52YWxpZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeU5hbWU6ICdtYWluJyxcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25maWcuaXNSZW1vdGUgPSBjdXN0b21Db25maWcuaXNSZW1vdGUgfHwgaXNSZW1vdGU7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNvbXByZXNzaW9uVHlwZSA9IGN1c3RvbUNvbmZpZy5jb21wcmVzc2lvblR5cGUgfHwgdGhpcy5vcHRpb25zLm1haW5CdW5kbGVDb21wcmVzc2lvblR5cGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFNUQVJUX1NDRU5FLCBJTlRFUk5BTCDnmoTpu5jorqTphY3nva7mmK/moLnmja7lrp7pmYXnmoTpobnnm67nu4/pqozorr7lrprnmoTkuIDlpZfop4TliJlcbiAgICAgICAgICAgICAgICBjb25maWcuaXNSZW1vdGUgPSAhIShjdXN0b21Db25maWcuaXNSZW1vdGUgPz8gKHRoaXMub3B0aW9ucy5zdGFydFNjZW5lQXNzZXRCdW5kbGUgPyBmYWxzZSA6IGludGVybmFsQnVuZGxlQ29uZmlnTWFwW01BSU5dLmlzUmVtb3RlKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFjdXN0b21Db25maWcuY29tcHJlc3Npb25UeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5jb21wcmVzc2lvblR5cGUgPSAodGhpcy5vcHRpb25zLnN0YXJ0U2NlbmVBc3NldEJ1bmRsZSB8fCBpbnRlcm5hbEJ1bmRsZUNvbmZpZ01hcFtNQUlOXS5jb21wcmVzc2lvblR5cGUgPT09IEJ1bmRsZUNvbXByZXNzaW9uVHlwZXMuTUVSR0VfREVQKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICBCdW5kbGVDb21wcmVzc2lvblR5cGVzLk1FUkdFX0FMTF9KU09OIDogaW50ZXJuYWxCdW5kbGVDb25maWdNYXBbTUFJTl0uY29tcHJlc3Npb25UeXBlITtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPIOaPkOWPluS7peWPiuWNleWFg+a1i+ivle+8jOWQjue7reatpOmFjee9rui/mOS8muiwg+aVtO+8jOS4tOaXtuWkhOeQhlxuICAgICAgICAgICAgaWYgKCFjdXN0b21Db25maWcuZGVzdCAmJiBjb25maWcuY29tcHJlc3Npb25UeXBlID09PSAnc3VicGFja2FnZScpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuZGVzdCA9IGpvaW4oZGlybmFtZSh0aGlzLmRlc3REaXIpLCBCdWlsZEdsb2JhbEluZm8uU1VCUEFDS0FHRVNfSEVBREVSLCBjb25maWcubmFtZSk7XG4gICAgICAgICAgICAgICAgY29uZmlnLnNjcmlwdERlc3QgPSBqb2luKGNvbmZpZy5kZXN0LCBCdWlsZEdsb2JhbEluZm8uU0NSSVBUX05BTUUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghY3VzdG9tQ29uZmlnLmRlc3QpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuZGVzdCA9IGNvbmZpZy5pc1JlbW90ZSA/IGpvaW4oZGlybmFtZSh0aGlzLmRlc3REaXIpLCBCdWlsZEdsb2JhbEluZm8uUkVNT1RFX0hFQURFUiwgY29uZmlnLm5hbWUpIDogam9pbih0aGlzLmRlc3REaXIsIGNvbmZpZy5uYW1lKTtcbiAgICAgICAgICAgICAgICBjb25maWcuc2NyaXB0RGVzdCA9IGpvaW4oY29uZmlnLmRlc3QsIEJ1aWxkR2xvYmFsSW5mby5TQ1JJUFRfTkFNRSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKHRoaXMub3B0aW9ucy5tb3ZlUmVtb3RlQnVuZGxlU2NyaXB0ICYmIGNvbmZpZy5pc1JlbW90ZSkgJiYgIWN1c3RvbUNvbmZpZy5zY3JpcHREZXN0KSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnNjcmlwdERlc3QgPSB0aGlzLl90YXNrID8gam9pbih0aGlzLl90YXNrLnJlc3VsdC5wYXRocy5idW5kbGVTY3JpcHRzLCBjb25maWcubmFtZSwgQnVpbGRHbG9iYWxJbmZvLlNDUklQVF9OQU1FKSA6IGpvaW4oY29uZmlnLmRlc3QsIEJ1aWxkR2xvYmFsSW5mby5TQ1JJUFRfTkFNRSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYWRkQnVuZGxlKGNvbmZpZyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWhq+WFheaIkOWujOaVtOWPr+eUqOeahOmhueebriBCdW5kbGUg6YWN572u77yI5Lyg5YWl6Ieq5a6a5LmJ6YWN572uID4gQnVuZGxlIOaWh+S7tuWkuemFjee9riA+IOm7mOiupOmFjee9ru+8iVxuICAgICAqIEBwYXJhbSBjdXN0b21Db25maWcgXG4gICAgICogQHJldHVybnMgSUJ1bmRsZUluaXRPcHRpb25zIHwgbnVsbFxuICAgICAqL1xuICAgIHByaXZhdGUgcGF0Y2hQcm9qZWN0QnVuZGxlQ29uZmlnKGN1c3RvbUNvbmZpZzogUGFydGlhbDxJQnVuZGxlT3B0aW9ucz4pOiBJQnVuZGxlSW5pdE9wdGlvbnMgfCBudWxsIHtcbiAgICAgICAgLy8g6Z2e5YaF572uIEJ1bmRsZSDnmoTphY3nva7lv4Xpobvloavlhpkgcm9vdCDpgInpoblcbiAgICAgICAgaWYgKCFjdXN0b21Db25maWcucm9vdCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgSW52YWxpZCBCdW5kbGUgY29uZmlnIHdpdGggYnVuZGxlIHJvb3Q6JHtjdXN0b21Db25maWcucm9vdH1gKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHV1aWQgPSBidWlsZEFzc2V0TGlicmFyeS51cmwydXVpZChjdXN0b21Db25maWcucm9vdCk7XG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgSW52YWxpZCBCdW5kbGUgY29uZmlnIHdpdGggYnVuZGxlICR7Y3VzdG9tQ29uZmlnLnJvb3R9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgSW52YWxpZCBCdW5kbGUgY29uZmlnIHdpdGggYnVuZGxlICR7Y3VzdG9tQ29uZmlnLnJvb3R9YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgYnVuZGxlRmlsdGVyQ29uZmlnLCBwcmlvcml0eSwgYnVuZGxlQ29uZmlnSUQsIGJ1bmRsZU5hbWUgfSA9IGFzc2V0SW5mby5tZXRhLnVzZXJEYXRhO1xuICAgICAgICBjb25zdCBuYW1lID0gY3VzdG9tQ29uZmlnLm5hbWUgfHwgYnVuZGxlTmFtZSB8fCBnZXRCdW5kbGVEZWZhdWx0TmFtZShhc3NldEluZm8pO1xuICAgICAgICBjb25zdCB1c2VyQnVuZGxlQ29uZmlnID0gdGhpcy5nZXRVc2VyQ29uZmlnKGJ1bmRsZUNvbmZpZ0lEKTtcbiAgICAgICAgbGV0IGNvbmZpZyA9IHRoaXMuZ2V0RGVmYXVsdEJ1bmRsZUNvbmZpZyhuYW1lKTtcbiAgICAgICAgY29uc3QgdmFsaWRDdXN0b21Db25maWcgPSBkZWZhdWx0c0RlZXAoe1xuICAgICAgICAgICAgY29tcHJlc3Npb25UeXBlOiB1c2VyQnVuZGxlQ29uZmlnICYmIHVzZXJCdW5kbGVDb25maWcuY29tcHJlc3Npb25UeXBlLFxuICAgICAgICAgICAgaXNSZW1vdGU6IHVzZXJCdW5kbGVDb25maWcgJiYgdXNlckJ1bmRsZUNvbmZpZy5pc1JlbW90ZSxcbiAgICAgICAgICAgIHByaW9yaXR5LFxuICAgICAgICAgICAgYnVuZGxlRmlsdGVyQ29uZmlnLFxuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgfSwgY3VzdG9tQ29uZmlnKTtcbiAgICAgICAgY29uZmlnID0gZGVmYXVsdHNEZWVwKHZhbGlkQ3VzdG9tQ29uZmlnLCBjb25maWcpO1xuICAgICAgICBpZiAoIXVzZXJCdW5kbGVDb25maWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBCdW5kbGUgY29uZmlnIElEICR7YnVuZGxlQ29uZmlnSUR9IGluIGJ1bmRsZSAke2N1c3RvbUNvbmZpZy5yb290fSwgdGhlIGJ1bmRsZSBjb25maWcgd2lsbCB1c2UgdGhlIGRlZmF1bHQgY29uZmlnICR7SlNPTi5zdHJpbmdpZnkoY29uZmlnKX1gKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDmnKrphY3nva7ov5znqIvmnI3liqHlmajlnLDlnYDvvIznu5nnlKjmiLforablkYrmj5DnpLpcbiAgICAgICAgaWYgKGNvbmZpZy5pc1JlbW90ZSAmJiAhdGhpcy5vcHRpb25zLnNlcnZlciAmJiAhdGhpcy5vcHRpb25zLnByZXZpZXcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihpMThuLnQoJ2J1aWxkZXIud2Fybi5hc3NldF9idW5kbGVfaXNfcmVtb3RlX2ludmFsaWQnLCB7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5TmFtZTogbmFtZSxcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE8g5o+Q5Y+W5Lul5Y+K5Y2V5YWD5rWL6K+V77yM5ZCO57ut5q2k6YWN572u6L+Y5Lya6LCD5pW077yM5Li05pe25aSE55CGXG4gICAgICAgIGlmICghY3VzdG9tQ29uZmlnLmRlc3QgJiYgY29uZmlnLmNvbXByZXNzaW9uVHlwZSA9PT0gJ3N1YnBhY2thZ2UnICYmICF0aGlzLm9wdGlvbnMuYnVpbGRCdW5kbGVPbmx5KSB7XG4gICAgICAgICAgICBjb25maWcuZGVzdCA9IGpvaW4oZGlybmFtZSh0aGlzLmRlc3REaXIpLCBCdWlsZEdsb2JhbEluZm8uU1VCUEFDS0FHRVNfSEVBREVSLCBjb25maWcubmFtZSk7XG4gICAgICAgICAgICBjb25maWcuc2NyaXB0RGVzdCA9IGpvaW4oY29uZmlnLmRlc3QsIEJ1aWxkR2xvYmFsSW5mby5TQ1JJUFRfTkFNRSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIWN1c3RvbUNvbmZpZy5kZXN0ICYmIGNvbmZpZy5pc1JlbW90ZSAmJiAhdGhpcy5vcHRpb25zLmJ1aWxkQnVuZGxlT25seSkge1xuICAgICAgICAgICAgY29uZmlnLmRlc3QgPSBqb2luKGRpcm5hbWUodGhpcy5kZXN0RGlyKSwgQnVpbGRHbG9iYWxJbmZvLlJFTU9URV9IRUFERVIsIGNvbmZpZy5uYW1lKTtcbiAgICAgICAgICAgIGNvbmZpZy5zY3JpcHREZXN0ID0gam9pbihjb25maWcuZGVzdCwgQnVpbGRHbG9iYWxJbmZvLlNDUklQVF9OQU1FKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgodGhpcy5vcHRpb25zLm1vdmVSZW1vdGVCdW5kbGVTY3JpcHQgJiYgY29uZmlnLmlzUmVtb3RlKSAmJiAhY3VzdG9tQ29uZmlnLnNjcmlwdERlc3QpIHtcbiAgICAgICAgICAgIGNvbmZpZy5zY3JpcHREZXN0ID0gdGhpcy5fdGFzayA/IGpvaW4odGhpcy5fdGFzay5yZXN1bHQucGF0aHMuYnVuZGxlU2NyaXB0cywgY29uZmlnLm5hbWUsIEJ1aWxkR2xvYmFsSW5mby5TQ1JJUFRfTkFNRSkgOiBqb2luKGNvbmZpZy5kZXN0LCBCdWlsZEdsb2JhbEluZm8uU0NSSVBUX05BTUUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yid5aeL5YyWIGJ1bmRsZSDliIbnu4TlhoXnmoTmoLnotYTmupDkv6Hmga9cbiAgICAgKiDliJ3lp4vljJYgYnVuZGxlIOWGheeahOWQhOmhueS4jeWQjOeahOWkhOeQhuS7u+WKoVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgaW5pdEJ1bmRsZVJvb3RBc3NldHMoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlUHJvY2VzcygnSW5pdCBidW5kbGUgcm9vdCBhc3NldHMgc3RhcnQuLi4nKTtcbiAgICAgICAgaWYgKHRoaXMuYnVuZGxlTWFwW0lOVEVSTkFMXSkge1xuICAgICAgICAgICAgY29uc3QgZW5naW5lUGF0aCA9IHRoaXMub3B0aW9ucy5lbmdpbmVJbmZvLnR5cGVzY3JpcHQucGF0aDtcbiAgICAgICAgICAgIC8vIOmihOiniOeUqOWujOaVtOW8leaTju+8jOS8muWIneWni+WMluaJgOacieWtkOezu+e7n++8iOS+i+WmguWNs+S+v+mhueebruWPqueUqCAyRCDniannkIbvvIwzRCBQaHlzaWNzU3lzdGVtIOS7jeS8muaehOmAoOW5tlxuICAgICAgICAgICAgLy8g5Yqg6L295YW26buY6K6k5p2Q6LSoIGRlZmF1bHQtcGh5c2ljcy1tYXRlcmlhbO+8ieOAguWboOatpOmihOiniOS4i+WGhee9rui1hOa6kOS4jeaMiSBpbmNsdWRlTW9kdWxlcyDoo4HliarvvIxcbiAgICAgICAgICAgIC8vIOWPluOAjOWFqOmDqOOAjWZlYXR1cmUg55qEIGRlcGVuZGVudEFzc2V0c++8jOS4juWcuuaZr+e8lui+keWZqCBFbmdpbmUucXVlcnlJbnRlcm5hbEFzc2V0TGlzdCAvIOe8lui+keWZqOWGhee9ruWMhVxuICAgICAgICAgICAgLy8g6KGM5Li65LiA6Ie077yb5ZCm5YiZ5Lya5ryP5o6J5pyq6YCJ5qih5Z2X55qE5YaF572u6LWE5rqQ77yM6L+Q6KGM5pe25oqlIFwiRmFpbGVkIHRvIGxvYWQgYnVpbHRpbk1hdGVyaWFsXCLjgIJcbiAgICAgICAgICAgIGNvbnN0IGludGVybmFsQXNzZXRzID0gdGhpcy5vcHRpb25zLnByZXZpZXdcbiAgICAgICAgICAgICAgICA/IGF3YWl0IHF1ZXJ5QWxsUHJlbG9hZEFzc2V0TGlzdChlbmdpbmVQYXRoKVxuICAgICAgICAgICAgICAgIDogYXdhaXQgcXVlcnlQcmVsb2FkQXNzZXRMaXN0KHRoaXMub3B0aW9ucy5pbmNsdWRlTW9kdWxlcywgZW5naW5lUGF0aCk7XG4gICAgICAgICAgICAvLyDmt7vliqDlvJXmk47kvp3otZbnmoTpooTliqDovb3lhoXnva7otYTmupAv6ISa5pys5YiwIGludGVybmFsIOWMheWGhVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgUXVlcnkgcHJlbG9hZCBhc3NldHMvc2NyaXB0cyBmcm9tIGNjLmNvbmZpZy5qc29uYCk7XG4gICAgICAgICAgICBpbnRlcm5hbEFzc2V0cy5mb3JFYWNoKCh1dWlkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5idW5kbGVNYXBbSU5URVJOQUxdLmFkZFJvb3RBc3NldChidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldCh1dWlkKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXVuY2hCdW5kbGUgPSB0aGlzLmJ1bmRsZU1hcFtTVEFSVF9TQ0VORV0gfHwgdGhpcy5idW5kbGVNYXBbTUFJTl07XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmFzc2V0cztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3NldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGFzc2V0c1tpXTtcbiAgICAgICAgICAgIGlmIChhc3NldEluZm8uaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYXNzZXRUeXBlID0gYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXRQcm9wZXJ0eShhc3NldEluZm8sICd0eXBlJyk7XG4gICAgICAgICAgICB0aGlzLmNhY2hlLmFkZEFzc2V0KGFzc2V0SW5mbywgYXNzZXRUeXBlKTtcbiAgICAgICAgICAgIGxldCBidW5kbGVXaXRoQXNzZXQgPSB0aGlzLmJ1bmRsZXMuZmluZCgoYnVuZGxlKSA9PiBhc3NldEluZm8udXJsLnN0YXJ0c1dpdGgoYnVuZGxlLnJvb3QgKyAnLycpKTtcbiAgICAgICAgICAgIC8vIOS4jeWcqCBCdW5kbGUg5YaF55qE6ISa5pys6buY6K6k5Yqg5Yiw5ZCv5YqoIGJ1bmRsZSDlhoVcbiAgICAgICAgICAgIGlmIChhc3NldFR5cGUgPT09ICdjYy5TY3JpcHQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0SW5mby51cmwuc3RhcnRzV2l0aCgnZGI6Ly9pbnRlcm5hbCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGludGVybmFsIGRiIOS4i+eahOiEmuacrO+8jOS4jeWFqOmHj+aehOW7uu+8jOS7pSBkZXBlbmRlbnRTY3JpcHRzIOS4uuWHhlxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnVuZGxlV2l0aEFzc2V0ID0gYnVuZGxlV2l0aEFzc2V0IHx8IGxhdW5jaEJ1bmRsZTtcbiAgICAgICAgICAgICAgICBpZiAoYnVuZGxlV2l0aEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1bmRsZVdpdGhBc3NldC5hZGRTY3JpcHQoYXNzZXRJbmZvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWcuuaZr+S9nOS4uueJueauiui1hOa6kOeuoeeQhjog5Y+q6KaB5YyF5ZCr5ZyoIGJ1bmRsZSDlhoXpu5jorqTlj4LkuI7mnoTlu7ogPiDmsqHmnInmjIflrpogc2NlbmVzIOeahOaDheWGteS4i+m7mOiupOWPguS4jiA+IOaMh+WumiBzY2VuZXMg5oyJ54Wn5q2k5ZCN5Y2VXG4gICAgICAgICAgICBpZiAoYXNzZXRUeXBlID09PSAnY2MuU2NlbmVBc3NldCcgJiYgKGJ1bmRsZVdpdGhBc3NldCB8fCAhdGhpcy5vcHRpb25zLnNjZW5lcyB8fCB0aGlzLm9wdGlvbnMuc2NlbmVzLmZpbmQoaXRlbSA9PiBpdGVtLnV1aWQgPT09IGFzc2V0SW5mby51dWlkKSkpIHtcbiAgICAgICAgICAgICAgICAvLyDliJ3lp4vlnLrmma/liqDlhaXliLDliJ3lp4vlnLrmma8gYnVuZGxlIOWGhVxuICAgICAgICAgICAgICAgIGlmIChsYXVuY2hCdW5kbGUgJiYgdGhpcy5vcHRpb25zLnN0YXJ0U2NlbmUgPT09IGFzc2V0SW5mby51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhdW5jaEJ1bmRsZS5hZGRSb290QXNzZXQoYXNzZXRJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGJ1bmRsZVdpdGhBc3NldCkge1xuICAgICAgICAgICAgICAgICAgICBidW5kbGVXaXRoQXNzZXQuYWRkUm9vdEFzc2V0KGFzc2V0SW5mbyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5LiN5ZyoIGJ1bmRsZSDlhoXnmoTlhbbku5blnLrmma/vvIzmlL7lhaXkuLvljIXvvIznlLHkuo7mlK/mjIEgYnVuZGxlIOWJlOmZpO+8jG1haW4gYnVuZGxlIOWPr+iDveS4jeWtmOWcqFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJ1bmRsZU1hcFtNQUlOXSAmJiB0aGlzLmJ1bmRsZU1hcFtNQUlOXS5hZGRSb290QXNzZXQoYXNzZXRJbmZvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhc3NldEluZm8uc291cmNlLmVuZHNXaXRoKCcucGFjJykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYWNBc3NldHMucHVzaChhc3NldEluZm8udXVpZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChidW5kbGVXaXRoQXNzZXQgJiYgYXNzZXRUeXBlICE9PSAnY2MuU2NlbmVBc3NldCcpIHtcbiAgICAgICAgICAgICAgICBidW5kbGVXaXRoQXNzZXQuYWRkUm9vdEFzc2V0KGFzc2V0SW5mbyk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsYXVuY2hCdW5kbGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucHJldmlldyAmJiAodGhpcy5vcHRpb25zIGFzIGFueSkuc2NlbmVFZGl0b3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFNjZW5lRWRpdG9yQXNzZXRzKGxhdW5jaEJ1bmRsZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWKoOWFpemhueebruiuvue9ruS4reeahCByZW5kZXJQaXBlbGluZSDotYTmupBcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVuZGVyUGlwZWxpbmUpIHtcbiAgICAgICAgICAgICAgICBsYXVuY2hCdW5kbGUuYWRkUm9vdEFzc2V0KGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KHRoaXMub3B0aW9ucy5yZW5kZXJQaXBlbGluZSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDliqDlhaXpobnnm67orr7nva7kuK3nmoTniannkIbmnZDotKhcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGh5c2ljc0NvbmZpZy5kZWZhdWx0TWF0ZXJpYWwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KHRoaXMub3B0aW9ucy5waHlzaWNzQ29uZmlnLmRlZmF1bHRNYXRlcmlhbCk7XG4gICAgICAgICAgICAgICAgbGF1bmNoQnVuZGxlLmFkZFJvb3RBc3NldChhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgICBOdW1iZXIgb2YgYWxsIHNjZW5lczogJHt0aGlzLmNhY2hlLnNjZW5lcy5sZW5ndGh9YCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYCAgTnVtYmVyIG9mIGFsbCBzY3JpcHRzOiAke3RoaXMuY2FjaGUuc2NyaXB0VXVpZHMubGVuZ3RofWApO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGAgIE51bWJlciBvZiBvdGhlciBhc3NldHM6ICR7dGhpcy5jYWNoZS5hc3NldFV1aWRzLmxlbmd0aH1gKTtcbiAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKCdJbml0IGJ1bmRsZSByb290IGFzc2V0cyBzdWNjZXNzLi4uJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRTY2VuZUVkaXRvckFzc2V0cyhidW5kbGU6IElCdW5kbGUpIHtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIHRoaXMuY2FjaGUuYXNzZXRVdWlkcykge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIC8vIOW8leaTjuWGhee9rui1hOa6kOW3sue7j+eUsSBpbnRlcm5hbCBidW5kbGUg57uf5LiA5pS26ZuG44CCU2NlbmUgRWRpdG9yIOmihOiniOiLpeWGjeaKiuWug+S7rFxuICAgICAgICAgICAgLy8g5Yqg5YWl5ZCv5YqoIGJ1bmRsZe+8jOS8muiuqeWQjOS4gOi1hOa6kOi/m+WFpeS4pOS4qiBidW5kbGXvvJvkvovlpoIgZGVmYXVsdF9za3lib3gg55qEIEhEUlxuICAgICAgICAgICAgLy8g5LiOIFBORyDkvJrlnKjkuLsgYnVuZGxlIOS4reW+l+WIsOebuOWQjOeahOWKqOaAgeWKoOi9vSBVUkzjgIJcbiAgICAgICAgICAgIGlmIChhc3NldCAmJiAhYXNzZXQudXJsLnN0YXJ0c1dpdGgoJ2RiOi8vaW50ZXJuYWwvJykpIHtcbiAgICAgICAgICAgICAgICBidW5kbGUuYWRkUm9vdEFzc2V0KGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaMieeFpyBCdW5kbGUg5LyY5YWI57qn5pW055CGIEJ1bmRsZSDnmoTotYTmupDliJfooahcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGluaXRCdW5kbGVTaGFyZUFzc2V0cygpIHtcbiAgICAgICAgLy8g6aKE6KeI5peg6ZyA5qC55o2u5LyY5YWI57qn5YiG5p6Q5YWx5Lqr6LWE5rqQ77yM6aKE6KeI5pys6Lqr5bCx5piv5oyJ6ZyA5Yqg6L2955qE77yM5LiN6ZyA6KaB5o+Q5YmN5pW055CG5a6M5pW055qEIGJ1bmRsZSDotYTmupDliJfooahcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcmV2aWV3KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKCdJbml0IGJ1bmRsZSBzaGFyZSBhc3NldHMgc3RhcnQuLi4nKTtcbiAgICAgICAgLy8g5aSE55CG5YWx5Lqr6LWE5rqQXG4gICAgICAgIGNvbnN0IHNoYXJlZEFzc2V0czogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgICBjb25zdCBtYW5hZ2VyID0gdGhpcztcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gd2Fsa0RlcGVuZCh1dWlkOiBzdHJpbmcsIGJ1bmRsZTogSUJ1bmRsZSwgY2hlY2tlZDogU2V0PHN0cmluZz4sIGZhdGhlclV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChjaGVja2VkLmhhcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGZhdGhlclV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgZmF0aGVyQXNzZXQgPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldChmYXRoZXJVdWlkKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGkxOG4udCgnYnVpbGRlci5lcnJvci5yZXF1aXJlZF9hc3NldF9taXNzaW5nJywge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgdXVpZDogYHthc3NldCgke3V1aWR9KX1gLFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgZmF0aGVyVXJsOiBge2Fzc2V0KCR7ZmF0aGVyQXNzZXQudXJsfSl9YCxcbiAgICAgICAgICAgICAgICAgICAgLy8gfSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihpMThuLnQoJ2J1aWxkZXIuZXJyb3IubWlzc2luZ19hc3NldCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGB7YXNzZXQoJHt1dWlkfSl9YCxcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGVja2VkLmFkZCh1dWlkKTtcbiAgICAgICAgICAgIGJ1bmRsZS5hZGRBc3NldChhc3NldCk7XG5cbiAgICAgICAgICAgIGlmIChoYXNDQ09ORm9ybWF0QXNzZXRJbkxpYnJhcnkoYXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyDpnIDopoHkvJjljJbmtYHnqIvvvIzlkI7nu63lj6/og73ooqsgcmVtb3ZlQXNzZXRcbiAgICAgICAgICAgICAgICBjb25zdCBjY29uRXh0ZW5zaW9uID0gZ2V0RGVzaXJlZENDT05FeHRlbnNpb25NYXAobWFuYWdlci5vcHRpb25zLmFzc2V0U2VyaWFsaXplT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgKGJ1bmRsZS5jb25maWcuZXh0ZW5zaW9uTWFwW2Njb25FeHRlbnNpb25dID8/PSBbXSkucHVzaChhc3NldC51dWlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNoYXJlZEFzc2V0c1t1dWlkXSkge1xuICAgICAgICAgICAgICAgIGJ1bmRsZS5hZGRSZWRpcmVjdCh1dWlkLCBzaGFyZWRBc3NldHNbdXVpZF0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZHMgPSBhd2FpdCBidWlsZEFzc2V0TGlicmFyeS5nZXREZXBlbmRVdWlkcyh1dWlkKTtcbiAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgIGRlcGVuZHMubWFwKGFzeW5jIChkZXBlbmRVdWlkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB3YWxrRGVwZW5kKGRlcGVuZFV1aWQsIGJ1bmRsZSwgY2hlY2tlZCwgdXVpZCk7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnVuZGxlR3JvdXBJblByaW9yaXR5ID0gdGhpcy5idW5kbGVHcm91cEluUHJpb3JpdHk7XG4gICAgICAgIC8vIOmAkuW9kuWkhOeQhuaJgOaciSBidW5kbGUg5Lit5Zy65pmv5LiO5qC56LWE5rqQXG4gICAgICAgIGZvciAoY29uc3QgYnVuZGxlR3JvdXAgb2YgYnVuZGxlR3JvdXBJblByaW9yaXR5KSB7XG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChidW5kbGVHcm91cC5tYXAoYXN5bmMgKGJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwoYnVuZGxlLnJvb3RBc3NldHMubWFwKGFzeW5jICh1dWlkKSA9PiBhd2FpdCB3YWxrRGVwZW5kKHV1aWQsIGJ1bmRsZSwgY2hlY2tlZCkpKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgLy8g5q+P5b6q546v5LiA57uE77yM5bCG6K+l57uE5YyF5ZCr55qEIHV1aWQg5aKe5Yqg5YiwIHNoYXJlZEFzc2V0cyDkuK3vvIzkvpvkuIvkuIDnu4QgYnVuZGxlIOWkjeeUqFxuICAgICAgICAgICAgYnVuZGxlR3JvdXAuZm9yRWFjaCgoYnVuZGxlKSA9PiB7XG4gICAgICAgICAgICAgICAgYnVuZGxlLmFzc2V0c1dpdGhvdXRSZWRpcmVjdC5mb3JFYWNoKCh1dWlkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2hhcmVkQXNzZXRzW3V1aWRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFyZWRBc3NldHNbdXVpZF0gPSBidW5kbGUubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKCdJbml0IGJ1bmRsZSBzaGFyZSBhc3NldHMgc3VjY2Vzcy4uLicpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagueaNruS4jeWQjOeahOmAiemhueWBmuS4jeWQjOeahCBidW5kbGUg5Lu75Yqh5rOo5YaMXG4gICAgICovXG4gICAgYXN5bmMgYnVuZGxlRGF0YVRhc2soKSB7XG4gICAgICAgIGNvbnN0IGltYWdlQ29tcHJlc3NNYW5hZ2VyID0gdGhpcy5pbWFnZUNvbXByZXNzTWFuYWdlcjtcbiAgICAgICAgaW1hZ2VDb21wcmVzc01hbmFnZXIgJiYgKGF3YWl0IGltYWdlQ29tcHJlc3NNYW5hZ2VyLmluaXQoKSk7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuYnVuZGxlcy5tYXAoYXN5bmMgKGJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFidW5kbGUub3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgaGFuZGxlSnNvbkdyb3VwKGJ1bmRsZSk7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVCaW5Hcm91cChidW5kbGUsIHRoaXMub3B0aW9ucy5iaW5Hcm91cENvbmZpZyk7XG4gICAgICAgICAgICBpbWFnZUNvbXByZXNzTWFuYWdlciAmJiBhd2FpdCBidW5kbGVEYXRhVGFzayhidW5kbGUsIGltYWdlQ29tcHJlc3NNYW5hZ2VyKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOe6ueeQhuWOi+e8qeWkhOeQhlxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY29tcHJlc3NJbWFnZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmltYWdlQ29tcHJlc3NNYW5hZ2VyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKCdDb21wcmVzcyBpbWFnZSBzdGFydC4uLicpO1xuICAgICAgICBhd2FpdCB0aGlzLmltYWdlQ29tcHJlc3NNYW5hZ2VyLnJ1bigpO1xuICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoJ0NvbXByZXNzIGltYWdlIHN1Y2Nlc3MuLi4nKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmiafooYzoh6rliqjlm77pm4bku7vliqFcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHBhY2tJbWFnZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKCdQYWNrIEltYWdlcyBzdGFydCcpO1xuICAgICAgICBuZXdDb25zb2xlLnRyYWNrVGltZVN0YXJ0KCdidWlsZGVyOnBhY2stYXV0by1hdGxhcy1pbWFnZScpO1xuICAgICAgICAvLyDnoa7orqTlrp7pmYXlj4LkuI7mnoTlu7rnmoTlm77pm4botYTmupDliJfooahcbiAgICAgICAgbGV0IHBhY0Fzc2V0czogKElBc3NldClbXSA9IFtdO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJ1aWxkQnVuZGxlT25seSkge1xuICAgICAgICAgICAgdGhpcy5fcGFjQXNzZXRzLnJlZHVjZSgocGFjQXNzZXRzLCBwYWNVdWlkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFjSW5mbyA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KHBhY1V1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluQnVuZGxlID0gdGhpcy5idW5kbGVzLnNvbWUoKGJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJ1bmRsZS5vdXRwdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodXRpbHMuUGF0aC5jb250YWlucyhwYWNJbmZvLnVybCwgYnVuZGxlLnJvb3QpIHx8IHV0aWxzLlBhdGguY29udGFpbnMoYnVuZGxlLnJvb3QsIHBhY0luZm8udXJsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoaW5CdW5kbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFjQXNzZXRzLnB1c2gocGFjSW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwYWNBc3NldHM7XG4gICAgICAgICAgICB9LCBwYWNBc3NldHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g6Z2e54us56uL5p6E5bu6IEJ1bmRsZSDmqKHlvI/kuIvvvIzmiYDmnInnmoTlm77pm4bpg73pnIDopoHlj4LkuI7mnoTlu7rvvIxUT0RPIOmcgOimgeS8mOWMllxuICAgICAgICAgICAgcGFjQXNzZXRzID0gdGhpcy5fcGFjQXNzZXRzLm1hcCgocGFjVXVpZCkgPT4gYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXQocGFjVXVpZCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGFjQXNzZXRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnTm8gcGFjIGFzc2V0cycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYE51bWJlciBvZiBwYWMgYXNzZXRzOiAke3BhY0Fzc2V0cy5sZW5ndGh9YCk7XG4gICAgICAgIGNvbnN0IGluY2x1ZGVBc3NldHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdGhpcy5idW5kbGVzLmZvckVhY2goKGJ1bmRsZSA9PiBidW5kbGUuYXNzZXRzLmZvckVhY2goKGFzc2V0KSA9PiBpbmNsdWRlQXNzZXRzLmFkZChhc3NldCkpKSk7XG4gICAgICAgIGNvbnN0IHsgVGV4dHVyZVBhY2tlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi90ZXh0dXJlLXBhY2tlci9pbmRleCcpO1xuICAgICAgICB0aGlzLnBhY2tSZXN1bHRzID0gYXdhaXQgKGF3YWl0IG5ldyBUZXh0dXJlUGFja2VyKCkuaW5pdChwYWNBc3NldHMsIEFycmF5LmZyb20oaW5jbHVkZUFzc2V0cykpKS5wYWNrKCk7XG4gICAgICAgIGlmICghdGhpcy5wYWNrUmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ05vIHBhY2sgcmVzdWx0cycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGltYWdlQ29tcHJlc3NNYW5hZ2VyID0gdGhpcy5pbWFnZUNvbXByZXNzTWFuYWdlcjtcbiAgICAgICAgY29uc3QgZGVwZW5kZWRBc3NldHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHt9O1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBOdW1iZXIgb2YgcGFjayByZXN1bHRzOiAke3RoaXMucGFja1Jlc3VsdHMubGVuZ3RofWApO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnBhY2tSZXN1bHRzLm1hcChhc3luYyAocGFjUmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBhY1Jlcy5yZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdObyBwYWNrIHJlc3VsdCBpbiBwYWMnLCBwYWNSZXMudXVpZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYXRsYXNlcyA9IHBhY1Jlcy5yZXN1bHQuYXRsYXNlcztcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KHBhY1Jlcy51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IHsgY3JlYXRlQXNzZXRJbnN0YW5jZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi90ZXh0dXJlLXBhY2tlci9wYWMtaW5mbycpO1xuICAgICAgICAgICAgLy8gYXRsYXNlcyDmmK/lj6/ooqvluo/liJfljJbnmoTnvJPlrZjkv6Hmga/vvIzkuI3ljIXlkKsgc3ByaXRlRnJhbWVzXG4gICAgICAgICAgICBjb25zdCBwYWNJbnN0YW5jZXMgPSBjcmVhdGVBc3NldEluc3RhbmNlKGF0bGFzZXMsIGFzc2V0SW5mbywgcGFjUmVzLnNwcml0ZUZyYW1lcyk7XG4gICAgICAgICAgICBwYWNJbnN0YW5jZXMuZm9yRWFjaCgoaW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlLmFkZEluc3RhbmNlKGluc3RhbmNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdzdGFydCBjb2xsZWN0IGRlcGVuZCBhc3NldHMgaW4gcGFjJywgcGFjUmVzLnV1aWQpO1xuICAgICAgICAgICAgLy8gaW5jbHVkZUFzc2V0cyDmmK8gQnVuZGxlIOagueaNruS+nei1luWFs+ezu+aVtOeQhueahOmFjee9ru+8jOWMheWQq+S6huaJgOacieacieiiq+S+nei1lueahOaehOW7uui1hOa6kFxuICAgICAgICAgICAgYXdhaXQgY29sbGVjdERlcGVuZEFzc2V0cyhwYWNSZXMudXVpZCwgaW5jbHVkZUFzc2V0cywgZGVwZW5kZWRBc3NldHMpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBzcHJpdGVGcmFtZUluZm8gb2YgcGFjUmVzLnNwcml0ZUZyYW1lSW5mb3MpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb2xsZWN0RGVwZW5kQXNzZXRzKHNwcml0ZUZyYW1lSW5mby51dWlkLCBpbmNsdWRlQXNzZXRzLCBkZXBlbmRlZEFzc2V0cyk7XG5cbiAgICAgICAgICAgICAgICBhd2FpdCBjb2xsZWN0RGVwZW5kQXNzZXRzKHNwcml0ZUZyYW1lSW5mby50ZXh0dXJlVXVpZCwgaW5jbHVkZUFzc2V0cywgZGVwZW5kZWRBc3NldHMpO1xuICAgICAgICAgICAgICAgIGlmIChkZXBlbmRlZEFzc2V0c1tzcHJpdGVGcmFtZUluZm8udGV4dHVyZVV1aWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOeUseS6juWbvumbhuWwj+WbvuWGhemDqOS5i+mXtOS8muWtmOWcqOS6kuebuOS+nei1lu+8jOWxnuS6juS8quS+nei1lu+8jOS4jeS9nOS4uuecn+WunumhueebruS+nei1luiAg+iZkVxuICAgICAgICAgICAgICAgICAgICBkZXBlbmRlZEFzc2V0c1tzcHJpdGVGcmFtZUluZm8udGV4dHVyZVV1aWRdID0gZGVwZW5kZWRBc3NldHNbc3ByaXRlRnJhbWVJbmZvLnRleHR1cmVVdWlkXS5maWx0ZXIoKHV1aWQpID0+IHV1aWQgIT09IHNwcml0ZUZyYW1lSW5mby51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkZXBlbmRlZEFzc2V0c1tzcHJpdGVGcmFtZUluZm8udGV4dHVyZVV1aWRdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGRlcGVuZGVkQXNzZXRzW3Nwcml0ZUZyYW1lSW5mby50ZXh0dXJlVXVpZF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhd2FpdCBjb2xsZWN0RGVwZW5kQXNzZXRzKHNwcml0ZUZyYW1lSW5mby5pbWFnZVV1aWQsIGluY2x1ZGVBc3NldHMsIGRlcGVuZGVkQXNzZXRzKTtcbiAgICAgICAgICAgICAgICBpZiAoZGVwZW5kZWRBc3NldHNbc3ByaXRlRnJhbWVJbmZvLmltYWdlVXVpZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kZWRBc3NldHNbc3ByaXRlRnJhbWVJbmZvLmltYWdlVXVpZF0gPSBkZXBlbmRlZEFzc2V0c1tzcHJpdGVGcmFtZUluZm8uaW1hZ2VVdWlkXS5maWx0ZXIoKHV1aWQpID0+IHV1aWQgIT09IHNwcml0ZUZyYW1lSW5mby50ZXh0dXJlVXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZGVwZW5kZWRBc3NldHNbc3ByaXRlRnJhbWVJbmZvLmltYWdlVXVpZF0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZGVwZW5kZWRBc3NldHNbc3ByaXRlRnJhbWVJbmZvLmltYWdlVXVpZF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VDb21wcmVzc01hbmFnZXIgJiYgaW1hZ2VDb21wcmVzc01hbmFnZXIucmVtb3ZlVGFzayhxdWVyeUltYWdlQXNzZXRGcm9tU3ViQXNzZXRCeVV1aWQoc3ByaXRlRnJhbWVJbmZvLnV1aWQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdzdGFydCBzb3J0IGJ1bmRsZSBpbiBwYWMnLCBwYWNSZXMudXVpZCk7XG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCgoYXRsYXNlcykubWFwKGFzeW5jIChhdGxhcykgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNvcnRCdW5kbGVJblBhYyh0aGlzLmJ1bmRsZXMsIGF0bGFzLCBwYWNSZXMsIGRlcGVuZGVkQXNzZXRzLCBpbWFnZUNvbXByZXNzTWFuYWdlcik7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdlbmQgc29ydCBidW5kbGUgaW4gcGFjJywgcGFjUmVzLnV1aWQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGF3YWl0IG5ld0NvbnNvbGUudHJhY2tUaW1lRW5kKCdidWlsZGVyOnBhY2stYXV0by1hdGxhcy1pbWFnZScsIHsgb3V0cHV0OiB0cnVlIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoJ1BhY2sgSW1hZ2VzIHN1Y2Nlc3MnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnvJbor5Hpobnnm67ohJrmnKxcbiAgICAgKi9cbiAgICBhc3luYyBidWlsZFNjcmlwdCgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKGAke2kxOG4udCgnYnVpbGRlci50YXNrcy5idWlsZF9wcm9qZWN0X3NjcmlwdCcpfSBzdGFydC4uLmApO1xuICAgICAgICBuZXdDb25zb2xlLnRyYWNrVGltZVN0YXJ0KCdidWlsZGVyOmJ1aWxkLXByb2plY3Qtc2NyaXB0Jyk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbSAmJiAhdGhpcy5vcHRpb25zLmJ1aWxkU2NyaXB0UGFyYW0uY29tbW9uRGlyKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYnVpbGRTY3JpcHRQYXJhbS5jb21tb25EaXIgPSBqb2luKHRoaXMuZGVzdERpciwgJ3NyYycsICdjaHVua3MnKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLnNjcmlwdEJ1aWxkZXIuaW5pdFByb2plY3RPcHRpb25zKHRoaXMub3B0aW9ucyk7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuc2NyaXB0QnVpbGRlci5idWlsZEJ1bmRsZVNjcmlwdCh0aGlzLmJ1bmRsZXMpO1xuICAgICAgICBjb25zdCBidWlsZFByb2plY3RUaW1lID0gYXdhaXQgbmV3Q29uc29sZS50cmFja1RpbWVFbmQoJ2J1aWxkZXI6YnVpbGQtcHJvamVjdC1zY3JpcHQnKTtcbiAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKGAke2kxOG4udCgnYnVpbGRlci50YXNrcy5idWlsZF9wcm9qZWN0X3NjcmlwdCcpfSBpbiAoJHtidWlsZFByb2plY3RUaW1lfSBtcykg4oiaYCk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6L6T5Ye65omA5pyJ55qEIGJ1bmRsZSDotYTmupDvvIzljIXlkKvohJrmnKzjgIFqc29u44CB5pmu6YCa6LWE5rqQ44CB57q555CG5Y6L57yp44CB5Zu+6ZuG562JXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBvdXRwdXRBc3NldHMoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlUHJvY2VzcygnT3V0cHV0IGFzc2V0IGluIGJ1bmRsZXMgc3RhcnQnKTtcbiAgICAgICAgY29uc3QgaGFzQ2hlY2tlZEFzc2V0ID0gbmV3IFNldCgpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLmJ1bmRsZXMubWFwKGFzeW5jIChidW5kbGUpID0+IHtcbiAgICAgICAgICAgIGlmICghYnVuZGxlLm91dHB1dCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmltYWdlQ29tcHJlc3NNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgYnVuZGxlT3V0cHV0VGFzayhidW5kbGUsIHRoaXMuY2FjaGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDovpPlh7oganNvbiDliIbnu4RcbiAgICAgICAgICAgIGF3YWl0IG91dHB1dEpzb25Hcm91cChidW5kbGUsIHRoaXMpO1xuICAgICAgICAgICAgYXdhaXQgb3V0cHV0QmluR3JvdXAoYnVuZGxlLCB0aGlzLm9wdGlvbnMuYmluR3JvdXBDb25maWcpO1xuICAgICAgICAgICAgLy8g5b6q546v5YiG57uE5YaF55qE6LWE5rqQXG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChidW5kbGUuYXNzZXRzV2l0aG91dFJlZGlyZWN0Lm1hcChhc3luYyAodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHV1aWQubGVuZ3RoIDw9IDE1IHx8IGJ1bmRsZS5jb21wcmVzc1Rhc2tbdXVpZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5ZCI5Zu+6LWE5rqQ44CB5bey5Y+C5LiO57q555CG5Y6L57yp55qE6LWE5rqQ5peg6ZyA5ou36LSd5Y6f5Zu+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5bCG6LWE5rqQ5aSN5Yi25Yiw5oyH5a6a5L2N572uXG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYENhbiBub3QgZ2V0IGFzc2V0IGluZm8gd2l0aCB1dWlkKCR7dXVpZH0pYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWhhc0NoZWNrZWRBc3NldC5oYXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzQ2hlY2tlZEFzc2V0LmFkZCh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5qCh6aqMIGVmZmVjdCDmmK/lkKbpnIDopoEgbWlwbWFwXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNoZWNrRWZmZWN0VGV4dHVyZU1pcG1hcChhc3NldCwgdXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY29weUFzc2V0RmlsZShhc3NldCwgYnVuZGxlLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBvdXRwdXQgYXNzZXQgZmlsZSBlcnJvciB3aXRoIHV1aWQoJHt1dWlkfSlgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoJ091dHB1dCBhc3NldCBpbiBidW5kbGVzIHN1Y2Nlc3MnKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVIb29rKGZ1bmM6IEZ1bmN0aW9uLCBpbnRlcm5hbDogYm9vbGVhbiwgLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgaWYgKGludGVybmFsKSB7XG4gICAgICAgICAgICBhd2FpdCBmdW5jLmNhbGwodGhpcywgdGhpcy5vcHRpb25zLCB0aGlzLmJ1bmRsZXMsIHRoaXMuY2FjaGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgZnVuYygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcnVuQWxsVGFzaygpIHtcbiAgICAgICAgY29uc3Qgd2VpZ2h0ID0gMSAvIHRoaXMucGlwZWxpbmUubGVuZ3RoO1xuICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGhpcy5waXBlbGluZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXNrID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuUGx1Z2luVGFzayh0YXNrLCB3ZWlnaHQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGFzayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuQnVpbGRUYXNrKHRhc2ssIHdlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBydW5CdWlsZFRhc2soaGFuZGxlOiBGdW5jdGlvbiwgaW5jcmVtZW50OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuZXJyb3IpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMub25FcnJvcih0aGlzLmVycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5zdGFydFByb2dyZXNzU3RlcChgcnVuIGJ1bmRsZSB0YXNrICR7aGFuZGxlLm5hbWV9IHN0YXJ0IWAsIGluY3JlbWVudCk7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGUuYmluZCh0aGlzKSgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVQcm9jZXNzKGBydW4gYnVuZGxlIHRhc2sgJHtoYW5kbGUubmFtZX0gc3VjY2VzcyFgLCBpbmNyZW1lbnQpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2Nlc3MoYHJ1biBidW5kbGUgdGFzayBmYWlsZWQhYCwgaW5jcmVtZW50KTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbGxlY3REZXBlbmRBc3NldHModXVpZDogc3RyaW5nLCBhbGxBc3NldHM6IFNldDxzdHJpbmc+LCBkZXBlbmRlZEFzc2V0czogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+KSB7XG4gICAgaWYgKGFsbEFzc2V0cy5oYXModXVpZCkpIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgYnVpbGRBc3NldExpYnJhcnkucXVlcnlBc3NldFVzZXJzKHV1aWQpO1xuICAgICAgICByZXMgJiYgcmVzLmxlbmd0aCAmJiAoZGVwZW5kZWRBc3NldHNbdXVpZF0gPSByZXMpO1xuICAgIH1cbn1cblxuY29uc3QgZmVhdHVyZXNXaXRoRGVwZW5kZW5jaWVzOiBzdHJpbmdbXSA9IFtdO1xuY29uc3QgcHJlbG9hZEFzc2V0czogc3RyaW5nW10gPSBbXTsgLy8g6aKE5Yqg6L296LWE5rqQIHV1aWQg5pWw57uE77yI5YyF5ZCr6ISa5pys77yJXG5cbi8qKlxuICog5bCG6LWE5rqQ5aSN5Yi25Yiw5oyH5a6a5L2N572uXG4gKiBAcGFyYW0gcmF3QXNzZXREaXIg6L6T5Ye65paH5Lu25aS56Lev5b6EXG4gKiBAcGFyYW0gYXNzZXRcbiAqL1xuZnVuY3Rpb24gY29weUFzc2V0RmlsZShhc3NldDogSUFzc2V0LCBidW5kbGU6IElCdW5kbGUsIG9wdGlvbnM6IElJbnRlcm5hbEJ1bmRsZUJ1aWxkT3B0aW9ucyk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgY2NvbkZvcm1hdFNvdXJjZSA9IGdldENDT05Gb3JtYXRBc3NldEluTGlicmFyeShhc3NldCk7XG5cbiAgICBpZiAoY2NvbkZvcm1hdFNvdXJjZSkge1xuICAgICAgICBjb25zdCBpc0Njb25IYW5kbGVkSW5Hcm91cCA9ICEhYnVuZGxlLmdyb3Vwcy5maW5kKGdyb3VwID0+IGdyb3VwLnR5cGUgPT0gJ0JJTicgJiYgZ3JvdXAudXVpZHMuaW5jbHVkZXMoYXNzZXQudXVpZCkpO1xuICAgICAgICBpZiAoaXNDY29uSGFuZGxlZEluR3JvdXApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByYXdBc3NldERpciA9IGpvaW4oYnVuZGxlLmRlc3QsIGJ1bmRsZS5pbXBvcnRCYXNlKTtcbiAgICAgICAgY29uc3Qgc291cmNlID0gY2NvbkZvcm1hdFNvdXJjZTtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVOYW1lID0gcmVsYXRpdmUoZ2V0TGlicmFyeURpcihzb3VyY2UpLCBzb3VyY2UpO1xuICAgICAgICBjb25zdCBkZXN0ID0gam9pbihqb2luKHJhd0Fzc2V0RGlyLCByZWxhdGl2ZU5hbWUpKTtcbiAgICAgICAgcmV0dXJuIGJ1aWxkQXNzZXRMaWJyYXJ5Lm91dHB1dENDT05Bc3NldChcbiAgICAgICAgICAgIGFzc2V0LnV1aWQsXG4gICAgICAgICAgICBkZXN0LFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBleGNsdWRlRXh0TmFtZSA9IFsnLmpzb24nXTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgICAgIGFzc2V0Lm1ldGEuZmlsZXMubWFwKChleHRuYW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXhjbHVkZUV4dE5hbWUuaW5jbHVkZXMoZXh0bmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDop4TliJnvvJrmnoTlu7rkuI3miZPljIUgX18g5byA5aS055qE6LWE5rqQ5pWw5o2uXG4gICAgICAgICAgICBpZiAoZXh0bmFtZS5zdGFydHNXaXRoKCdfXycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByYXdBc3NldERpciA9IGpvaW4oYnVuZGxlLmRlc3QsIGJ1bmRsZS5uYXRpdmVCYXNlKTtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IGV4dG5hbWUuc3RhcnRzV2l0aCgnLicpID8gYXNzZXQubGlicmFyeSArIGV4dG5hbWUgOiBqb2luKGFzc2V0LmxpYnJhcnksIGV4dG5hbWUpO1xuICAgICAgICAgICAgLy8g5Yip55So55u45a+56Lev5b6E5p2l6I635Y+W6LWE5rqQ55u45a+55Zyw5Z2A77yM6YG/5YWN6ICm5ZCI5LiA5Lqb54m55q6K6LWE5rqQ55qE6Lev5b6E5ou85YaZ6KeE5YiZ77yM5q+U5aaCIGZvbnQgXG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZU5hbWUgPSByZWxhdGl2ZShnZXRMaWJyYXJ5RGlyKHNvdXJjZSksIHNvdXJjZSk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0c1N5bmMoc291cmNlKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGkxOG4udCgnYnVpbGRlci5lcnJvci5taXNzaW5nX2ltcG9ydF9maWxlcycsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGB7bGluaygke3NvdXJjZX0pfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGB7YXNzZXQoJHthc3NldC51cmx9KX1gLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlc3QgPSBqb2luKHJhd0Fzc2V0RGlyLCByZWxhdGl2ZU5hbWUpO1xuICAgICAgICAgICAgLy8g5YW25LuW5rWB56iL5Y+v6IO955Sf5oiQ5ZCM57G75Z6L5ZCO57yA6LWE5rqQ77yM5q+U5aaC5Y6L57yp57q555CG77yM5LiN6IO95bCG5YW26KaG55uWXG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkZXN0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb3B5KHNvdXJjZSwgZGVzdCk7XG4gICAgICAgIH0pLFxuICAgICk7XG59XG5cbmZ1bmN0aW9uIHRyYXZlcnNhbERlcGVuZGVuY2llcyhmZWF0dXJlczogc3RyaW5nW10sIGZlYXR1cmVzSW5Kc29uOiBhbnkpOiB2b2lkIHtcbiAgICBmZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlTmFtZSkgPT4ge1xuICAgICAgICBpZiAoZmVhdHVyZXNJbkpzb25bZmVhdHVyZU5hbWVdKSB7XG4gICAgICAgICAgICBpZiAoIWZlYXR1cmVzV2l0aERlcGVuZGVuY2llcy5pbmNsdWRlcyhmZWF0dXJlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlc1dpdGhEZXBlbmRlbmNpZXMucHVzaChmZWF0dXJlTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGZlYXR1cmVzSW5Kc29uW2ZlYXR1cmVOYW1lXS5kZXBlbmRlbnRBc3NldHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlbG9hZEFzc2V0cy5wdXNoKC4uLmZlYXR1cmVzSW5Kc29uW2ZlYXR1cmVOYW1lXS5kZXBlbmRlbnRBc3NldHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZmVhdHVyZXNJbkpzb25bZmVhdHVyZU5hbWVdLmRlcGVuZGVudFNjcmlwdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlbG9hZEFzc2V0cy5wdXNoKC4uLmZlYXR1cmVzSW5Kc29uW2ZlYXR1cmVOYW1lXS5kZXBlbmRlbnRTY3JpcHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZlYXR1cmVzSW5Kc29uW2ZlYXR1cmVOYW1lXS5kZXBlbmRlbnRNb2R1bGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVudE1vZHVsZXM6IHN0cmluZ1tdID0gZmVhdHVyZXNJbkpzb25bZmVhdHVyZU5hbWVdLmRlcGVuZGVudE1vZHVsZXM7XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlcnNhbERlcGVuZGVuY2llcyhkZXBlbmRlbnRNb2R1bGVzLCBmZWF0dXJlc0luSnNvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICog5qC55o2u5qih5Z2X5L+h5oGv77yM5p+l5om+6ZyA6KaB6aKE5Yqg6L2955qE6LWE5rqQ5YiX6KGo77yI5YyF5ZCr5pmu6YCa6LWE5rqQ5LiO6ISa5pys77yJXG4gKiBAcGFyYW0gZmVhdHVyZXMgXG4gKiBAcmV0dXJucyBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcXVlcnlQcmVsb2FkQXNzZXRMaXN0KGZlYXR1cmVzOiBzdHJpbmdbXSwgZW5naW5lUGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2NDb25maWdKc29uID0gYXdhaXQgcmVhZEpTT04oam9pbihlbmdpbmVQYXRoLCAnY2MuY29uZmlnLmpzb24nKSk7XG4gICAgY29uc3QgZmVhdHVyZXNJbkpzb24gPSBjY0NvbmZpZ0pzb24uZmVhdHVyZXM7XG4gICAgZmVhdHVyZXNXaXRoRGVwZW5kZW5jaWVzLmxlbmd0aCA9IDA7XG4gICAgcHJlbG9hZEFzc2V0cy5sZW5ndGggPSAwO1xuICAgIHRyYXZlcnNhbERlcGVuZGVuY2llcyhmZWF0dXJlcywgZmVhdHVyZXNJbkpzb24pO1xuICAgIHJldHVybiBBcnJheS5mcm9tKG5ldyBTZXQocHJlbG9hZEFzc2V0cykpO1xufVxuXG4vKipcbiAqIOafpeivouOAjOWFqOmDqOOAjeWGhee9rumihOWKoOi9vei1hOa6kO+8iOS4jeaMiSBpbmNsdWRlTW9kdWxlcyDoo4HliarvvInjgIJcbiAqIOmihOiniOS9v+eUqOWujOaVtOW8leaTju+8jOS7u+S9leWtkOezu+e7n+mDveWPr+iDveWIneWni+WMluW5tuWKoOi9veWFtuWGhee9rui1hOa6kO+8jOmcgOS/neivgeWFqOmDqOWPr+eUqO+8jFxuICog5LiO5Zy65pmv57yW6L6R5ZmoIEVuZ2luZS5xdWVyeUludGVybmFsQXNzZXRMaXN0IOihjOS4uuS4gOiHtOOAglxuICovXG5hc3luYyBmdW5jdGlvbiBxdWVyeUFsbFByZWxvYWRBc3NldExpc3QoZW5naW5lUGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2NDb25maWdKc29uID0gYXdhaXQgcmVhZEpTT04oam9pbihlbmdpbmVQYXRoLCAnY2MuY29uZmlnLmpzb24nKSk7XG4gICAgY29uc3QgZmVhdHVyZU5hbWVzID0gT2JqZWN0LmtleXMoY2NDb25maWdKc29uLmZlYXR1cmVzIHx8IHt9KTtcbiAgICByZXR1cm4gcXVlcnlQcmVsb2FkQXNzZXRMaXN0KGZlYXR1cmVOYW1lcywgZW5naW5lUGF0aCk7XG59XG5cbi8qKlxuICogZWZmZWN0IOiuvue9ruS6hiByZXF1aXJlTWlwbWFwc++8jOWvueadkOi0qOi/m+ihjOagoemqjO+8jOiLpeWPkeeOsOWFs+iBlOeahOe6ueeQhuayoeacieW8gOWQryBtaXBtYXAg5YiZ6L6T5Ye66K2m5ZGKXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrRWZmZWN0VGV4dHVyZU1pcG1hcChhc3NldDogSUFzc2V0LCB1dWlkOiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAoYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXRQcm9wZXJ0eShhc3NldCwgJ3R5cGUnKSA9PT0gJ2NjLk1hdGVyaWFsJykge1xuICAgICAgICAgICAgY29uc3QgbXRsID0gKGF3YWl0IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEluc3RhbmNlKGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KHV1aWQpKSkgYXMgTWF0ZXJpYWw7XG4gICAgICAgICAgICBpZiAobXRsLmVmZmVjdEFzc2V0ICYmIG10bC5lZmZlY3RBc3NldC5fdXVpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVmZmVjdCA9IChhd2FpdCBidWlsZEFzc2V0TGlicmFyeS5nZXRJbnN0YW5jZShidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldChtdGwuZWZmZWN0QXNzZXQuX3V1aWQpKSkgYXMgRWZmZWN0QXNzZXQ7XG4gICAgICAgICAgICAgICAgLy8g6YGN5Y6GIGVmZmVjdC50ZWNobmlxdWVzW210bC5fdGVjaElkeF0g5LiL55qE5omA5pyJIHBhc3NcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgZWZmZWN0LnRlY2huaXF1ZXNbbXRsLl90ZWNoSWR4XS5wYXNzZXMuZm9yRWFjaChhc3luYyAocGFzczogYW55LCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXNzLnByb3BlcnRpZXMgJiYgcGFzcy5wcm9wZXJ0aWVzLm1haW5UZXh0dXJlICYmIHBhc3MucHJvcGVydGllcy5tYWluVGV4dHVyZS5yZXF1aXJlTWlwbWFwcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5byV5pOO5o6l5Y+j5oql6ZSZXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCBtYWluVGV4dHVyZSA9IG10bC5nZXRQcm9wZXJ0eSgnbWFpblRleHR1cmUnLCBpbmRleCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiOt+WPliBtYWluVGV4dHVyZSDnmoQgdXVpZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IG10bC5fcHJvcHMgJiYgbXRsLl9wcm9wc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcC5tYWluVGV4dHVyZSAmJiBwcm9wLm1haW5UZXh0dXJlLl91dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVxdWlyZU1pcG1hcHMgPT09IHR1cmUg55qEIG1haW5UZXh0dXJlIOagoemqjOaYr+WQpuW8gOWQr+S6hiBtaXBtYXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IGF3YWl0IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldE1ldGEocHJvcC5tYWluVGV4dHVyZS5fdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFbJ25lYXJlc3QnLCAnbGluZWFyJ10uaW5jbHVkZXMobWV0YS51c2VyRGF0YS5taXBmaWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihpMThuLnQoJ2J1aWxkZXIud2Fybi5yZXF1aXJlX21pcG1hcHMnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZmZlY3RVVUlEOiBlZmZlY3QuX3V1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlVVVJRDogcHJvcC5tYWluVGV4dHVyZS5fdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhlcnJvcik7XG4gICAgfVxufVxuIl19