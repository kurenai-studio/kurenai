'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSeparateEngine = buildSeparateEngine;
exports.buildCocos = buildCocos;
/**
 * 此文件需要在独立 node 进程里可调用，不可使用 Editor/Electron 接口
 * 引擎分离编译后，默认会生成一份包含全部引擎散文件的目录结构，默认名称为 all
 * 如果指定了 pluginFeatures 则会为其 pick 出一份插件目录
 */
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const crypto_1 = require("crypto");
const ccbuild_1 = require("@cocos/ccbuild");
const utils_1 = require("../../utils");
class EngineCachePaths {
    dir;
    all;
    plugin;
    meta;
    signatureJSON;
    pluginJSON;
    constructor(dir, pluginName) {
        this.dir = dir;
        this.all = (0, path_1.join)(dir, 'all');
        this.plugin = (0, path_1.join)(dir, pluginName);
        this.meta = (0, path_1.join)(dir, 'meta.json');
        this.signatureJSON = (0, path_1.join)(this.plugin, 'signature.json');
        this.pluginJSON = (0, path_1.join)(this.plugin, 'plugin.json');
    }
    toJSON() {
        return {
            dir: this.dir,
            all: this.all,
            plugin: this.plugin,
            meta: this.meta,
            signatureJSON: this.signatureJSON,
            pluginJSON: this.pluginJSON,
        };
    }
}
function extractMacros(expression) {
    return expression.split('||').map(match => match.trim().substring(1));
}
function intiEngineFeatures(engineDir) {
    const modulesInfo = require((0, path_1.join)(engineDir, 'editor', 'engine-features', 'render-config.json'));
    const pluginFeatures = [];
    const envLimitModule = {};
    const stepModule = (moduleKey, moduleItem) => {
        if (moduleItem.envCondition) {
            envLimitModule[moduleKey] = {
                envList: extractMacros(moduleItem.envCondition),
                fallback: moduleItem.fallback,
            };
        }
        if (moduleItem.enginePlugin) {
            pluginFeatures.push(moduleKey);
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
    return {
        envLimitModule,
        pluginFeatures,
    };
}
class EngineFeatureQuery {
    all = [];
    allUnit = [];
    plugin = [];
    pluginUnit = [];
    engineStatsQuery;
    envLimitModule = {};
    _defaultPlugins;
    // 分离引擎插件目前只支持选中一个 Spine 版本，兼容性考虑，排除掉 spine-4.2
    _excludeFeatures = ['spine-4.2'];
    env;
    /**
     * please use EngineFeatureQuery.create instead
     * @param options
     */
    constructor(options) {
        this.env = {
            mode: 'BUILD',
            platform: options.platformType,
            flags: {
                SERVER_MODE: false,
                DEBUG: false,
                WASM_SUBPACKAGE: false,
            },
        };
        const res = intiEngineFeatures(options.engine);
        this.envLimitModule = res.envLimitModule;
        this._defaultPlugins = res.pluginFeatures;
    }
    static async create(options) {
        const engineFeatureQuery = new EngineFeatureQuery(options);
        await engineFeatureQuery._init(options);
        return engineFeatureQuery;
    }
    async _init(options) {
        this.engineStatsQuery = await ccbuild_1.StatsQuery.create(options.engine);
        const features = this.filterEngineModules(this.engineStatsQuery.getFeatures());
        this.all = features.filter((feature) => !this._excludeFeatures.includes(feature));
        this.allUnit = this.engineStatsQuery.getUnitsOfFeatures(this.all);
        switch (options.pluginFeatures) {
            case 'default':
                this.plugin = this.filterEngineModules(this._defaultPlugins);
                this.pluginUnit = this.engineStatsQuery.getUnitsOfFeatures(this.plugin);
                break;
            case 'all':
            default:
                this.plugin = this.all;
                this.pluginUnit = this.allUnit;
                break;
        }
    }
    /**
     * 过滤模块
     * @param includeModules 原始模块列表
     * @returns 返回对象，包含需要回退的模块映射和过滤后的包含模块列表
     */
    filterEngineModules(features) {
        const ccEnvConstants = this.engineStatsQuery.constantManager.genCCEnvConstants(this.env);
        const moduleToFallBack = {};
        Object.keys(this.envLimitModule).forEach((moduleId) => {
            if (!features.includes(moduleId)) {
                return;
            }
            const { envList, fallback } = this.envLimitModule[moduleId];
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
    getUnitsOfFeatures(features) {
        return this.engineStatsQuery.getUnitsOfFeatures(features);
    }
}
// 引擎插件模块生成器
class EngineFeatureUnitGenerator {
    metaInfo;
    importMap = {};
    engineCachePaths;
    engineFeatureQuery;
    options;
    constructor(options, metaInfo, engineCachePaths, engineFeatureQuery) {
        this.metaInfo = metaInfo;
        this.engineCachePaths = engineCachePaths;
        this.engineFeatureQuery = engineFeatureQuery;
        this.options = options;
    }
    static async create(options) {
        // 1. 获取引擎插件模块列表
        const engineFeatureQuery = await EngineFeatureQuery.create({
            platformType: options.platformType,
            engine: options.engine,
            pluginFeatures: options.pluginFeatures,
        });
        // 2. 传递参数以及计算过的 pluginFeatures 用于生成引擎插件缓存
        const engineCachePaths = await buildCocos({
            ...options,
            engineFeatureQuery,
        });
        const metaInfo = (0, fs_extra_1.readJSONSync)(engineCachePaths.meta);
        return new EngineFeatureUnitGenerator(options, metaInfo, engineCachePaths, engineFeatureQuery);
    }
    isAliasedChunk(chunk) {
        return chunk in this.metaInfo.chunkAliases;
    }
    getFileName(file) {
        return this.metaInfo.chunkAliases[file] ?? file;
    }
    addChunkToPlugin = (chunk) => {
        const fileName = this.getFileName(chunk);
        const chunkSpecifier = this.isAliasedChunk(chunk)
            ? chunk
            : `../${(0, path_1.basename)(this.options.output)}/${fileName}`;
        const importURL = `plugin:${this.options.pluginName}/${fileName}`;
        this.importMap[chunkSpecifier] = importURL;
    };
    addToLocal(file) {
        const fileName = this.getFileName(file);
        const target = (0, path_1.join)(this.options.output, fileName);
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(target));
        (0, fs_extra_1.copyFileSync)((0, path_1.join)(this.engineCachePaths.all, fileName), target);
        if (this.isAliasedChunk(file)) {
            this.importMap[file] = `../${(0, path_1.basename)(this.options.output)}/${fileName}`;
        }
    }
    async run() {
        const { options, engineFeatureQuery, engineCachePaths } = this;
        // 3. 计算 cc.js 需要存放的模块索引信息，includeModules 并非代表所有用户选择的模块信息需要使用 getUnitsOfFeatures 计算
        const includeModules = options.includeModules;
        const allUnits = engineFeatureQuery.getUnitsOfFeatures(includeModules);
        const localFeatureUnits = allUnits.filter((item) => !engineFeatureQuery.pluginUnit.includes(item));
        const metaInfo = (0, fs_extra_1.readJSONSync)(engineCachePaths.meta);
        const localPluginFeatureUnits = allUnits.filter((item) => engineFeatureQuery.pluginUnit.includes(item));
        const ccModuleFile = (0, path_1.join)(options.output, 'cc.js');
        const featureUnitNameMapper = (featureUnit) => {
            // 优先使用引擎插件的模块，减小本地包体
            if (this.engineFeatureQuery.pluginUnit.includes(featureUnit)) {
                return `plugin:${this.options.pluginName}/${featureUnit}.js`;
            }
            return `./${featureUnit}.js`;
        };
        const ccModuleSource = await ccbuild_1.buildEngine.transform(engineFeatureQuery.engineStatsQuery.evaluateIndexModuleSource(allUnits, featureUnitNameMapper), 'system');
        await (0, fs_extra_1.outputFile)(ccModuleFile, ccModuleSource.code, 'utf8');
        const localChunks = ccbuild_1.buildEngine.enumerateDependentChunks(metaInfo, localFeatureUnits);
        const pluginChunks = ccbuild_1.buildEngine.enumerateDependentChunks(metaInfo, engineFeatureQuery.pluginUnit);
        // NOTE：游戏包内有使用到的插件模块和本地模块依赖的 asset，都要放到本地包内
        const assets = ccbuild_1.buildEngine.enumerateDependentAssets(metaInfo, localFeatureUnits).concat(ccbuild_1.buildEngine.enumerateDependentAssets(metaInfo, localPluginFeatureUnits));
        localChunks.forEach((chunk) => {
            if (pluginChunks.includes(chunk)) {
                this.addChunkToPlugin(chunk);
            }
            else {
                this.addToLocal(chunk);
            }
        });
        assets.forEach((asset) => {
            this.addToLocal(asset);
        });
        this.importMap['cc'] = `./${relativeUrl((0, path_1.dirname)(options.importMapOutFile), options.output)}/cc.js`;
        if (options.outputLocalPlugin) {
            const localPluginChunks = ccbuild_1.buildEngine.enumerateDependentChunks(metaInfo, localPluginFeatureUnits);
            // 生成本地需要的插件文件夹到输出目录
            await this.generateLocalPlugin(localPluginChunks);
        }
    }
    async generateLocalPlugin(featureFiles) {
        const cocosDest = (0, path_1.join)((0, path_1.dirname)(this.options.output), this.options.pluginName);
        return EngineFeatureUnitGenerator.generatePlugins(this.engineCachePaths, featureFiles, cocosDest, this.options.signatureProvider);
    }
    static async generatePlugins(enginePaths, featureFiles, dist, signatureProvider) {
        if (!featureFiles.length) {
            return [];
        }
        const metaInfo = (0, fs_extra_1.readJSONSync)(enginePaths.meta);
        (0, fs_extra_1.ensureDirSync)(dist);
        let updateMeta = false;
        const signature = [];
        await Promise.all(featureFiles.map(async (file, i) => {
            const src = (0, path_1.join)(enginePaths.all, file);
            const dest = (0, path_1.join)(dist, file);
            if (!metaInfo.md5Map[file]) {
                console.debug(`patch md5 for ${file}`);
                metaInfo.md5Map[file] = await calcCodeMd5(src);
                updateMeta = true;
            }
            signature.push({
                md5: metaInfo.md5Map[file],
                path: file,
            });
            (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
            // 注意，单独拷贝文件可以，如果是从安装包内拷贝文件夹会有权限问题
            (0, fs_extra_1.copyFileSync)(src, dest);
        }));
        signatureProvider && await (0, fs_extra_1.outputJSON)((0, path_1.join)(dist, (0, path_1.basename)(enginePaths.signatureJSON)), {
            provider: signatureProvider,
            signature,
        });
        await (0, fs_extra_1.outputJSON)((0, path_1.join)(dist, (0, path_1.basename)(enginePaths.pluginJSON)), {
            main: 'base.js',
        });
        // 更新 metaInfo 数据
        updateMeta && await (0, fs_extra_1.writeJSONSync)(enginePaths.meta, metaInfo, { spaces: 2 });
        return signature;
    }
}
/**
 * 根据选项编译分离引擎，并返回 importMap 信息
 * @param options
 */
async function buildSeparateEngine(options) {
    const engineFeatureGenerator = await EngineFeatureUnitGenerator.create(options);
    await engineFeatureGenerator.run();
    return {
        importMap: engineFeatureGenerator.importMap,
        paths: engineFeatureGenerator.engineCachePaths,
    };
}
/**
 * 编译引擎分离插件到缓存目录下(命令行会调用)
 */
async function buildCocos(options) {
    const outDir = (0, path_1.join)(options.engine, `bin/.cache/editor-cache/${options.platform}`);
    const enginePaths = new EngineCachePaths(outDir, options.pluginName);
    if (options.useCacheForce && (0, fs_extra_1.existsSync)(enginePaths.plugin)) {
        // 目前暂未检查完整的缓存是否有效
        return enginePaths;
    }
    options.engineFeatureQuery = options.engineFeatureQuery || await EngineFeatureQuery.create({
        platformType: options.platformType,
        engine: options.engine,
        pluginFeatures: options.pluginFeatures,
    });
    const { engineFeatureQuery } = options;
    // @ts-ignore 目前编译引擎接口里的 flags 定义无法互相使用，实际上是同一份数据
    const buildOptions = {
        engine: options.engine,
        out: enginePaths.all,
        moduleFormat: 'system',
        compress: true,
        split: true,
        nativeCodeBundleMode: options.nativeCodeBundleMode,
        features: engineFeatureQuery.all,
        inlineEnum: false, // 分离引擎插件先不开启内联枚举功能，等 v3.8.5 后续版本验证稳定后再考虑开启
        ...engineFeatureQuery.env,
        // platform: engineFeatureQuery.env.platform,
        // mode: engineFeatureQuery.env.mode,
        // flags: engineFeatureQuery.env.flags,
    };
    const cacheOptionsPath = (0, path_1.join)(outDir, 'options.json');
    if ((0, fs_extra_1.existsSync)(cacheOptionsPath)) {
        const cacheOptions = (0, fs_extra_1.readJSONSync)(cacheOptionsPath);
        if ((0, utils_1.compareOptions)(cacheOptions, buildOptions)) {
            console.log(`use cache engine in ${enginePaths.dir}`);
            return enginePaths;
        }
    }
    else {
        console.log(`Can not find options cache in ${cacheOptionsPath}`);
    }
    (0, fs_extra_1.emptyDirSync)(outDir);
    // 立马缓存构建选项，否则可能会被后续流程修改
    const buildOptionsCache = JSON.parse(JSON.stringify(buildOptions));
    const buildResult = await (0, ccbuild_1.buildEngine)(buildOptions);
    const md5Map = {};
    // 计算引擎 md5 值
    await Promise.all(Object.keys(buildResult.exports).map(async (key) => {
        const dest = (0, path_1.join)(enginePaths.all, buildResult.exports[key]);
        const md5 = calcCodeMd5(dest);
        md5Map[buildResult.exports[key]] = md5;
    }));
    // 缓存一下引擎提供的模块映射
    await (0, fs_extra_1.writeJSONSync)(enginePaths.meta, Object.assign(buildResult, { md5Map }), { spaces: 2 });
    // 整理出可供上传的引擎插件内容
    if (engineFeatureQuery.plugin.length) {
        const featureUnits = engineFeatureQuery.getUnitsOfFeatures(engineFeatureQuery.plugin);
        // NOTE: 插件里只能放 chunks，不能放 assets
        const featureFiles = ccbuild_1.buildEngine.enumerateDependentChunks(buildResult, featureUnits);
        await generatePlugins(enginePaths, featureFiles, enginePaths.plugin, options.signatureProvider);
    }
    // 最后再生成选项缓存文件，避免引擎文件生成时中断后文件不完整导致后续步骤无法运行
    await (0, fs_extra_1.outputJSON)(cacheOptionsPath, buildOptionsCache, { spaces: 4 });
    return enginePaths;
}
function relativeUrl(from, to) {
    return (0, path_1.relative)(from, to).replace(/\\/g, '/');
}
/**
 * 摘选生成引擎插件包
 * @param enginePaths
 * @param featureFiles
 * @param dist
 * @returns
 */
async function generatePlugins(enginePaths, featureFiles, dist, signatureProvider) {
    if (!featureFiles.length) {
        return [];
    }
    const metaInfo = (0, fs_extra_1.readJSONSync)(enginePaths.meta);
    (0, fs_extra_1.ensureDirSync)(dist);
    let updateMeta = false;
    const signature = [];
    await Promise.all(featureFiles.map(async (file, i) => {
        const src = (0, path_1.join)(enginePaths.all, file);
        const dest = (0, path_1.join)(dist, file);
        if (!metaInfo.md5Map[file]) {
            console.debug(`patch md5 for ${file}`);
            metaInfo.md5Map[file] = await calcCodeMd5(src);
            updateMeta = true;
        }
        signature.push({
            md5: metaInfo.md5Map[file],
            path: file,
        });
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(dest));
        // 注意，单独拷贝文件可以，如果是从安装包内拷贝文件夹会有权限问题
        (0, fs_extra_1.copyFileSync)(src, dest);
    }));
    signatureProvider && await (0, fs_extra_1.outputJSON)(enginePaths.signatureJSON, {
        provider: signatureProvider,
        signature,
    });
    await (0, fs_extra_1.outputJSON)(enginePaths.pluginJSON, {
        main: 'base.js',
    });
    // 更新 metaInfo 数据
    updateMeta && await (0, fs_extra_1.writeJSONSync)(enginePaths.meta, metaInfo, { spaces: 2 });
    return signature;
}
function calcCodeMd5(file) {
    return (0, crypto_1.createHash)('md5').update((0, fs_extra_1.readFileSync)(file)).digest('hex');
}
