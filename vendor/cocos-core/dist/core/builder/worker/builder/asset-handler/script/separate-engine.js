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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VwYXJhdGUtZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci93b3JrZXIvYnVpbGRlci9hc3NldC1oYW5kbGVyL3NjcmlwdC9zZXBhcmF0ZS1lbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQStVYixrREFRQztBQUtELGdDQW1FQztBQTlaRDs7OztHQUlHO0FBQ0gsdUNBQW1NO0FBQ25NLCtCQUF5RDtBQUN6RCxtQ0FBb0M7QUFDcEMsNENBQXlEO0FBQ3pELHVDQUE2QztBQUk3QyxNQUFNLGdCQUFnQjtJQUNsQixHQUFHLENBQVM7SUFDWixHQUFHLENBQVM7SUFDWixNQUFNLENBQVM7SUFDZixJQUFJLENBQVM7SUFDYixhQUFhLENBQVM7SUFDdEIsVUFBVSxDQUFTO0lBQ25CLFlBQVksR0FBVyxFQUFFLFVBQWtCO1FBQ3ZDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFBLFdBQUksRUFBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLFdBQUksRUFBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFBLFdBQUksRUFBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxNQUFNO1FBQ0YsT0FBTztZQUNILEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztZQUNiLEdBQUcs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Q2xCLENBQUMsQ0FBQztJQUNILGlCQUFpQjtJQUNqQixVQUFVLElBQUksTUFBTSxJQUFBLHdCQUFhLEVBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3RSxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsSUFBWTtJQUM3QixPQUFPLElBQUEsbUJBQVUsRUFBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBQSx1QkFBWSxFQUFDLElBQUksQ0FBZSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG4vKipcbiAqIOatpOaWh+S7tumcgOimgeWcqOeLrOeriyBub2RlIOi/m+eoi+mHjOWPr+iwg+eUqO+8jOS4jeWPr+S9v+eUqCBFZGl0b3IvRWxlY3Ryb24g5o6l5Y+jXG4gKiDlvJXmk47liIbnprvnvJbor5HlkI7vvIzpu5jorqTkvJrnlJ/miJDkuIDku73ljIXlkKvlhajpg6jlvJXmk47mlaPmlofku7bnmoTnm67lvZXnu5PmnoTvvIzpu5jorqTlkI3np7DkuLogYWxsXG4gKiDlpoLmnpzmjIflrprkuoYgcGx1Z2luRmVhdHVyZXMg5YiZ5Lya5Li65YW2IHBpY2sg5Ye65LiA5Lu95o+S5Lu255uu5b2VXG4gKi9cbmltcG9ydCB7IHdyaXRlSlNPTlN5bmMsIGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luYywgcmVhZEpTT05TeW5jLCBlbXB0eURpclN5bmMsIGVuc3VyZURpclN5bmMsIGNvcHlGaWxlU3luYywgb3V0cHV0SlNPTlN5bmMsIGNvcHlTeW5jLCBvdXRwdXRKU09OLCBjb3B5LCBvdXRwdXRGaWxlIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUsIGRpcm5hbWUsIHJlbGF0aXZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCB7IGJ1aWxkRW5naW5lLCBTdGF0c1F1ZXJ5IH0gZnJvbSAnQGNvY29zL2NjYnVpbGQnO1xuaW1wb3J0IHsgY29tcGFyZU9wdGlvbnMgfSBmcm9tICcuLi8uLi91dGlscyc7XG5pbXBvcnQgeyBJQnVpbGRTZXBhcmF0ZUVuZ2luZUNhY2hlT3B0aW9ucywgSUJ1aWxkU2VwYXJhdGVFbmdpbmVPcHRpb25zLCBJQnVpbGRTZXBhcmF0ZUVuZ2luZVJlc3VsdCwgSUVuZ2luZUNhY2hlUGF0aHMsIElFbnZMaW1pdE1vZHVsZSwgSVNpZ25hdHVyZUNvbmZpZyB9IGZyb20gJy4uLy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcbmltcG9ydCB7IE1vZHVsZVJlbmRlckNvbmZpZywgSUZlYXR1cmVJdGVtLCBJTW9kdWxlSXRlbSB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2VuZ2luZS9AdHlwZXMvbW9kdWxlcyc7XG5cbmNsYXNzIEVuZ2luZUNhY2hlUGF0aHMgaW1wbGVtZW50cyBJRW5naW5lQ2FjaGVQYXRocyB7XG4gICAgZGlyOiBzdHJpbmc7XG4gICAgYWxsOiBzdHJpbmc7XG4gICAgcGx1Z2luOiBzdHJpbmc7XG4gICAgbWV0YTogc3RyaW5nO1xuICAgIHNpZ25hdHVyZUpTT046IHN0cmluZztcbiAgICBwbHVnaW5KU09OOiBzdHJpbmc7XG4gICAgY29uc3RydWN0b3IoZGlyOiBzdHJpbmcsIHBsdWdpbk5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLmRpciA9IGRpcjtcbiAgICAgICAgdGhpcy5hbGwgPSBqb2luKGRpciwgJ2FsbCcpO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IGpvaW4oZGlyLCBwbHVnaW5OYW1lKTtcbiAgICAgICAgdGhpcy5tZXRhID0gam9pbihkaXIsICdtZXRhLmpzb24nKTtcbiAgICAgICAgdGhpcy5zaWduYXR1cmVKU09OID0gam9pbih0aGlzLnBsdWdpbiwgJ3NpZ25hdHVyZS5qc29uJyk7XG4gICAgICAgIHRoaXMucGx1Z2luSlNPTiA9IGpvaW4odGhpcy5wbHVnaW4sICdwbHVnaW4uanNvbicpO1xuICAgIH1cblxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRpcjogdGhpcy5kaXIsXG4gICAgICAgICAgICBhbGw6IHRoaXMuYWxsLFxuICAgICAgICAgICAgcGx1Z2luOiB0aGlzLnBsdWdpbixcbiAgICAgICAgICAgIG1ldGE6IHRoaXMubWV0YSxcbiAgICAgICAgICAgIHNpZ25hdHVyZUpTT046IHRoaXMuc2lnbmF0dXJlSlNPTixcbiAgICAgICAgICAgIHBsdWdpbkpTT046IHRoaXMucGx1Z2luSlNPTixcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmludGVyZmFjZSBJRW5naW5lRmVhdHVyZVF1ZXJ5T3B0aW9ucyB7XG4gICAgcGxhdGZvcm1UeXBlOiBTdGF0c1F1ZXJ5LkNvbnN0YW50TWFuYWdlci5QbGF0Zm9ybVR5cGU7XG4gICAgZW5naW5lOiBzdHJpbmc7XG4gICAgcGx1Z2luRmVhdHVyZXM/OiBzdHJpbmdbXSB8ICdhbGwnIHwgJ2RlZmF1bHQnO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0TWFjcm9zKGV4cHJlc3Npb246IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gZXhwcmVzc2lvbi5zcGxpdCgnfHwnKS5tYXAobWF0Y2ggPT4gbWF0Y2gudHJpbSgpLnN1YnN0cmluZygxKSk7XG59XG5cbmZ1bmN0aW9uIGludGlFbmdpbmVGZWF0dXJlcyhlbmdpbmVEaXI6IHN0cmluZykge1xuICAgIGNvbnN0IG1vZHVsZXNJbmZvOiBNb2R1bGVSZW5kZXJDb25maWcgPSByZXF1aXJlKGpvaW4oZW5naW5lRGlyLCAnZWRpdG9yJywgJ2VuZ2luZS1mZWF0dXJlcycsICdyZW5kZXItY29uZmlnLmpzb24nKSk7XG5cbiAgICBjb25zdCBwbHVnaW5GZWF0dXJlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBlbnZMaW1pdE1vZHVsZTogSUVudkxpbWl0TW9kdWxlID0ge307XG4gICAgY29uc3Qgc3RlcE1vZHVsZSA9IChtb2R1bGVLZXk6IHN0cmluZywgbW9kdWxlSXRlbTogSUZlYXR1cmVJdGVtKSA9PiB7XG4gICAgICAgIGlmIChtb2R1bGVJdGVtLmVudkNvbmRpdGlvbikge1xuICAgICAgICAgICAgZW52TGltaXRNb2R1bGVbbW9kdWxlS2V5XSA9IHtcbiAgICAgICAgICAgICAgICBlbnZMaXN0OiBleHRyYWN0TWFjcm9zKG1vZHVsZUl0ZW0uZW52Q29uZGl0aW9uKSxcbiAgICAgICAgICAgICAgICBmYWxsYmFjazogbW9kdWxlSXRlbS5mYWxsYmFjayxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9kdWxlSXRlbS5lbmdpbmVQbHVnaW4pIHtcbiAgICAgICAgICAgIHBsdWdpbkZlYXR1cmVzLnB1c2gobW9kdWxlS2V5KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gYWRkTW9kdWxlT3JHcm91cChtb2R1bGVLZXk6IHN0cmluZywgbW9kdWxlSXRlbTogSU1vZHVsZUl0ZW0pIHtcbiAgICAgICAgaWYgKCdvcHRpb25zJyBpbiBtb2R1bGVJdGVtKSB7XG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhtb2R1bGVJdGVtLm9wdGlvbnMpLmZvckVhY2goKFtvcHRpb25LZXksIG9wdGlvbkl0ZW1dKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RlcE1vZHVsZShvcHRpb25LZXksIG9wdGlvbkl0ZW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGVwTW9kdWxlKG1vZHVsZUtleSwgbW9kdWxlSXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmVudHJpZXMobW9kdWxlc0luZm8uZmVhdHVyZXMpLmZvckVhY2goKFttb2R1bGVLZXksIG1vZHVsZUl0ZW1dKSA9PiB7XG4gICAgICAgIGFkZE1vZHVsZU9yR3JvdXAobW9kdWxlS2V5LCBtb2R1bGVJdGVtKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGVudkxpbWl0TW9kdWxlLFxuICAgICAgICBwbHVnaW5GZWF0dXJlcyxcbiAgICB9O1xufVxuXG5jbGFzcyBFbmdpbmVGZWF0dXJlUXVlcnkge1xuXG4gICAgYWxsOiBzdHJpbmdbXSA9IFtdO1xuICAgIGFsbFVuaXQ6IHN0cmluZ1tdID0gW107XG4gICAgcGx1Z2luOiBzdHJpbmdbXSA9IFtdO1xuICAgIHBsdWdpblVuaXQ6IHN0cmluZ1tdID0gW107XG5cbiAgICBlbmdpbmVTdGF0c1F1ZXJ5ITogU3RhdHNRdWVyeTtcbiAgICBlbnZMaW1pdE1vZHVsZTogSUVudkxpbWl0TW9kdWxlID0ge307XG5cbiAgICBfZGVmYXVsdFBsdWdpbnM6IHN0cmluZ1tdO1xuXG4gICAgLy8g5YiG56a75byV5pOO5o+S5Lu255uu5YmN5Y+q5pSv5oyB6YCJ5Lit5LiA5LiqIFNwaW5lIOeJiOacrO+8jOWFvOWuueaAp+iAg+iZke+8jOaOkumZpOaOiSBzcGluZS00LjJcbiAgICBfZXhjbHVkZUZlYXR1cmVzID0gWydzcGluZS00LjInXTtcblxuICAgIGVudjogU3RhdHNRdWVyeS5Db25zdGFudE1hbmFnZXIuQ29uc3RhbnRPcHRpb25zO1xuXG4gICAgLyoqXG4gICAgICogcGxlYXNlIHVzZSBFbmdpbmVGZWF0dXJlUXVlcnkuY3JlYXRlIGluc3RlYWRcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBcbiAgICAgKi9cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKG9wdGlvbnM6IElFbmdpbmVGZWF0dXJlUXVlcnlPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuZW52ID0ge1xuICAgICAgICAgICAgbW9kZTogJ0JVSUxEJyxcbiAgICAgICAgICAgIHBsYXRmb3JtOiBvcHRpb25zLnBsYXRmb3JtVHlwZSxcbiAgICAgICAgICAgIGZsYWdzOiB7XG4gICAgICAgICAgICAgICAgU0VSVkVSX01PREU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIERFQlVHOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBXQVNNX1NVQlBBQ0tBR0U6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVzID0gaW50aUVuZ2luZUZlYXR1cmVzKG9wdGlvbnMuZW5naW5lKTtcbiAgICAgICAgdGhpcy5lbnZMaW1pdE1vZHVsZSA9IHJlcy5lbnZMaW1pdE1vZHVsZTtcbiAgICAgICAgdGhpcy5fZGVmYXVsdFBsdWdpbnMgPSByZXMucGx1Z2luRmVhdHVyZXM7XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIGNyZWF0ZShvcHRpb25zOiBJRW5naW5lRmVhdHVyZVF1ZXJ5T3B0aW9ucykge1xuICAgICAgICBjb25zdCBlbmdpbmVGZWF0dXJlUXVlcnkgPSBuZXcgRW5naW5lRmVhdHVyZVF1ZXJ5KG9wdGlvbnMpO1xuICAgICAgICBhd2FpdCBlbmdpbmVGZWF0dXJlUXVlcnkuX2luaXQob3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBlbmdpbmVGZWF0dXJlUXVlcnk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfaW5pdChvcHRpb25zOiBJRW5naW5lRmVhdHVyZVF1ZXJ5T3B0aW9ucykge1xuICAgICAgICB0aGlzLmVuZ2luZVN0YXRzUXVlcnkgPSBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZShvcHRpb25zLmVuZ2luZSk7XG5cbiAgICAgICAgY29uc3QgZmVhdHVyZXMgPSB0aGlzLmZpbHRlckVuZ2luZU1vZHVsZXModGhpcy5lbmdpbmVTdGF0c1F1ZXJ5LmdldEZlYXR1cmVzKCkpO1xuICAgICAgICB0aGlzLmFsbCA9IGZlYXR1cmVzLmZpbHRlcigoZmVhdHVyZSkgPT4gIXRoaXMuX2V4Y2x1ZGVGZWF0dXJlcy5pbmNsdWRlcyhmZWF0dXJlKSk7XG4gICAgICAgIHRoaXMuYWxsVW5pdCA9IHRoaXMuZW5naW5lU3RhdHNRdWVyeS5nZXRVbml0c09mRmVhdHVyZXModGhpcy5hbGwpO1xuXG4gICAgICAgIHN3aXRjaCAob3B0aW9ucy5wbHVnaW5GZWF0dXJlcykge1xuICAgICAgICAgICAgY2FzZSAnZGVmYXVsdCc6XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4gPSB0aGlzLmZpbHRlckVuZ2luZU1vZHVsZXModGhpcy5fZGVmYXVsdFBsdWdpbnMpO1xuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luVW5pdCA9IHRoaXMuZW5naW5lU3RhdHNRdWVyeS5nZXRVbml0c09mRmVhdHVyZXModGhpcy5wbHVnaW4pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYWxsJzpcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4gPSB0aGlzLmFsbDtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpblVuaXQgPSB0aGlzLmFsbFVuaXQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi/h+a7pOaooeWdl1xuICAgICAqIEBwYXJhbSBpbmNsdWRlTW9kdWxlcyDljp/lp4vmqKHlnZfliJfooahcbiAgICAgKiBAcmV0dXJucyDov5Tlm57lr7nosaHvvIzljIXlkKvpnIDopoHlm57pgIDnmoTmqKHlnZfmmKDlsITlkozov4fmu6TlkI7nmoTljIXlkKvmqKHlnZfliJfooahcbiAgICAgKi9cbiAgICBmaWx0ZXJFbmdpbmVNb2R1bGVzKGZlYXR1cmVzOiBzdHJpbmdbXSkge1xuICAgICAgICBjb25zdCBjY0VudkNvbnN0YW50cyA9IHRoaXMuZW5naW5lU3RhdHNRdWVyeS5jb25zdGFudE1hbmFnZXIuZ2VuQ0NFbnZDb25zdGFudHModGhpcy5lbnYpO1xuICAgICAgICBjb25zdCBtb2R1bGVUb0ZhbGxCYWNrOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuZW52TGltaXRNb2R1bGUpLmZvckVhY2goKG1vZHVsZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghZmVhdHVyZXMuaW5jbHVkZXMobW9kdWxlSWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBlbnZMaXN0LCBmYWxsYmFjayB9ID0gdGhpcy5lbnZMaW1pdE1vZHVsZVttb2R1bGVJZF07XG4gICAgICAgICAgICBjb25zdCBlbmFibGUgPSBlbnZMaXN0LnNvbWUoKGVudikgPT4gY2NFbnZDb25zdGFudHNbZW52IGFzIGtleW9mIFN0YXRzUXVlcnkuQ29uc3RhbnRNYW5hZ2VyLkNDRW52Q29uc3RhbnRzXSk7XG4gICAgICAgICAgICBpZiAoZW5hYmxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbW9kdWxlVG9GYWxsQmFja1ttb2R1bGVJZF0gPSBmYWxsYmFjayB8fCAnJztcbiAgICAgICAgICAgIGlmIChmYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGZlYXR1cmVzLnNwbGljZShmZWF0dXJlcy5pbmRleE9mKG1vZHVsZUlkKSwgMSwgZmFsbGJhY2spO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcy5zcGxpY2UoZmVhdHVyZXMuaW5kZXhPZihtb2R1bGVJZCksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZlYXR1cmVzO1xuICAgIH1cblxuICAgIGdldFVuaXRzT2ZGZWF0dXJlcyhmZWF0dXJlczogc3RyaW5nW10pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW5naW5lU3RhdHNRdWVyeS5nZXRVbml0c09mRmVhdHVyZXMoZmVhdHVyZXMpO1xuICAgIH1cbn1cblxuLy8g5byV5pOO5o+S5Lu25qih5Z2X55Sf5oiQ5ZmoXG5jbGFzcyBFbmdpbmVGZWF0dXJlVW5pdEdlbmVyYXRvciB7XG4gICAgbWV0YUluZm86IGJ1aWxkRW5naW5lLlJlc3VsdDtcbiAgICBpbXBvcnRNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBlbmdpbmVDYWNoZVBhdGhzOiBFbmdpbmVDYWNoZVBhdGhzO1xuICAgIGVuZ2luZUZlYXR1cmVRdWVyeTogRW5naW5lRmVhdHVyZVF1ZXJ5O1xuICAgIG9wdGlvbnM6IElCdWlsZFNlcGFyYXRlRW5naW5lT3B0aW9ucztcbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKG9wdGlvbnM6IElCdWlsZFNlcGFyYXRlRW5naW5lT3B0aW9ucywgbWV0YUluZm86IGJ1aWxkRW5naW5lLlJlc3VsdCwgZW5naW5lQ2FjaGVQYXRoczogRW5naW5lQ2FjaGVQYXRocywgZW5naW5lRmVhdHVyZVF1ZXJ5OiBFbmdpbmVGZWF0dXJlUXVlcnkpIHtcbiAgICAgICAgdGhpcy5tZXRhSW5mbyA9IG1ldGFJbmZvO1xuICAgICAgICB0aGlzLmVuZ2luZUNhY2hlUGF0aHMgPSBlbmdpbmVDYWNoZVBhdGhzO1xuICAgICAgICB0aGlzLmVuZ2luZUZlYXR1cmVRdWVyeSA9IGVuZ2luZUZlYXR1cmVRdWVyeTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB9XG5cbiAgICBzdGF0aWMgYXN5bmMgY3JlYXRlKG9wdGlvbnM6IElCdWlsZFNlcGFyYXRlRW5naW5lT3B0aW9ucykge1xuICAgICAgICAvLyAxLiDojrflj5blvJXmk47mj5Lku7bmqKHlnZfliJfooahcbiAgICAgICAgY29uc3QgZW5naW5lRmVhdHVyZVF1ZXJ5ID0gYXdhaXQgRW5naW5lRmVhdHVyZVF1ZXJ5LmNyZWF0ZSh7XG4gICAgICAgICAgICBwbGF0Zm9ybVR5cGU6IG9wdGlvbnMucGxhdGZvcm1UeXBlLFxuICAgICAgICAgICAgZW5naW5lOiBvcHRpb25zLmVuZ2luZSxcbiAgICAgICAgICAgIHBsdWdpbkZlYXR1cmVzOiBvcHRpb25zLnBsdWdpbkZlYXR1cmVzLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyAyLiDkvKDpgJLlj4LmlbDku6Xlj4rorqHnrpfov4fnmoQgcGx1Z2luRmVhdHVyZXMg55So5LqO55Sf5oiQ5byV5pOO5o+S5Lu257yT5a2YXG4gICAgICAgIGNvbnN0IGVuZ2luZUNhY2hlUGF0aHMgPSBhd2FpdCBidWlsZENvY29zKHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICBlbmdpbmVGZWF0dXJlUXVlcnksXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBtZXRhSW5mbzogYnVpbGRFbmdpbmUuUmVzdWx0ID0gcmVhZEpTT05TeW5jKGVuZ2luZUNhY2hlUGF0aHMubWV0YSk7XG4gICAgICAgIHJldHVybiBuZXcgRW5naW5lRmVhdHVyZVVuaXRHZW5lcmF0b3Iob3B0aW9ucywgbWV0YUluZm8sIGVuZ2luZUNhY2hlUGF0aHMsIGVuZ2luZUZlYXR1cmVRdWVyeSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc0FsaWFzZWRDaHVuayhjaHVuazogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBjaHVuayBpbiB0aGlzLm1ldGFJbmZvLmNodW5rQWxpYXNlcztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZpbGVOYW1lKGZpbGU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXRhSW5mby5jaHVua0FsaWFzZXNbZmlsZV0gPz8gZmlsZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZENodW5rVG9QbHVnaW4gPSAoY2h1bms6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHRoaXMuZ2V0RmlsZU5hbWUoY2h1bmspO1xuICAgICAgICBjb25zdCBjaHVua1NwZWNpZmllciA9IHRoaXMuaXNBbGlhc2VkQ2h1bmsoY2h1bmspXG4gICAgICAgICAgICA/IGNodW5rXG4gICAgICAgICAgICA6IGAuLi8ke2Jhc2VuYW1lKHRoaXMub3B0aW9ucy5vdXRwdXQpfS8ke2ZpbGVOYW1lfWA7XG4gICAgICAgIGNvbnN0IGltcG9ydFVSTCA9IGBwbHVnaW46JHt0aGlzLm9wdGlvbnMucGx1Z2luTmFtZX0vJHtmaWxlTmFtZX1gO1xuICAgICAgICB0aGlzLmltcG9ydE1hcFtjaHVua1NwZWNpZmllcl0gPSBpbXBvcnRVUkw7XG4gICAgfTtcblxuICAgIHByaXZhdGUgYWRkVG9Mb2NhbChmaWxlOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSB0aGlzLmdldEZpbGVOYW1lKGZpbGUpO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBqb2luKHRoaXMub3B0aW9ucy5vdXRwdXQsIGZpbGVOYW1lKTtcbiAgICAgICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKHRhcmdldCkpO1xuICAgICAgICBjb3B5RmlsZVN5bmMoam9pbih0aGlzLmVuZ2luZUNhY2hlUGF0aHMuYWxsLCBmaWxlTmFtZSksIHRhcmdldCk7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNBbGlhc2VkQ2h1bmsoZmlsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0TWFwW2ZpbGVdID0gYC4uLyR7YmFzZW5hbWUodGhpcy5vcHRpb25zLm91dHB1dCl9LyR7ZmlsZU5hbWV9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHJ1bigpIHtcbiAgICAgICAgY29uc3QgeyBvcHRpb25zLCBlbmdpbmVGZWF0dXJlUXVlcnksIGVuZ2luZUNhY2hlUGF0aHMgfSA9IHRoaXM7XG4gICAgICAgIC8vIDMuIOiuoeeulyBjYy5qcyDpnIDopoHlrZjmlL7nmoTmqKHlnZfntKLlvJXkv6Hmga/vvIxpbmNsdWRlTW9kdWxlcyDlubbpnZ7ku6PooajmiYDmnInnlKjmiLfpgInmi6nnmoTmqKHlnZfkv6Hmga/pnIDopoHkvb/nlKggZ2V0VW5pdHNPZkZlYXR1cmVzIOiuoeeul1xuICAgICAgICBjb25zdCBpbmNsdWRlTW9kdWxlcyA9IG9wdGlvbnMuaW5jbHVkZU1vZHVsZXM7XG4gICAgICAgIGNvbnN0IGFsbFVuaXRzID0gZW5naW5lRmVhdHVyZVF1ZXJ5LmdldFVuaXRzT2ZGZWF0dXJlcyhpbmNsdWRlTW9kdWxlcyk7XG4gICAgICAgIGNvbnN0IGxvY2FsRmVhdHVyZVVuaXRzID0gYWxsVW5pdHMuZmlsdGVyKChpdGVtKSA9PiAhZW5naW5lRmVhdHVyZVF1ZXJ5LnBsdWdpblVuaXQuaW5jbHVkZXMoaXRlbSkpO1xuICAgICAgICBjb25zdCBtZXRhSW5mbzogYnVpbGRFbmdpbmUuUmVzdWx0ID0gcmVhZEpTT05TeW5jKGVuZ2luZUNhY2hlUGF0aHMubWV0YSk7XG4gICAgICAgIGNvbnN0IGxvY2FsUGx1Z2luRmVhdHVyZVVuaXRzID0gYWxsVW5pdHMuZmlsdGVyKChpdGVtKSA9PiBlbmdpbmVGZWF0dXJlUXVlcnkucGx1Z2luVW5pdC5pbmNsdWRlcyhpdGVtKSk7XG4gICAgICAgIGNvbnN0IGNjTW9kdWxlRmlsZSA9IGpvaW4ob3B0aW9ucy5vdXRwdXQsICdjYy5qcycpO1xuICAgICAgICBjb25zdCBmZWF0dXJlVW5pdE5hbWVNYXBwZXIgPSAoZmVhdHVyZVVuaXQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgLy8g5LyY5YWI5L2/55So5byV5pOO5o+S5Lu255qE5qih5Z2X77yM5YeP5bCP5pys5Zyw5YyF5L2TXG4gICAgICAgICAgICBpZiAodGhpcy5lbmdpbmVGZWF0dXJlUXVlcnkucGx1Z2luVW5pdC5pbmNsdWRlcyhmZWF0dXJlVW5pdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYHBsdWdpbjoke3RoaXMub3B0aW9ucy5wbHVnaW5OYW1lfS8ke2ZlYXR1cmVVbml0fS5qc2A7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYC4vJHtmZWF0dXJlVW5pdH0uanNgO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBjY01vZHVsZVNvdXJjZSA9IGF3YWl0IGJ1aWxkRW5naW5lLnRyYW5zZm9ybShcbiAgICAgICAgICAgIGVuZ2luZUZlYXR1cmVRdWVyeS5lbmdpbmVTdGF0c1F1ZXJ5LmV2YWx1YXRlSW5kZXhNb2R1bGVTb3VyY2UoYWxsVW5pdHMsIGZlYXR1cmVVbml0TmFtZU1hcHBlciksXG4gICAgICAgICAgICAnc3lzdGVtJyxcbiAgICAgICAgKTtcbiAgICAgICAgYXdhaXQgb3V0cHV0RmlsZShjY01vZHVsZUZpbGUsIGNjTW9kdWxlU291cmNlLmNvZGUsICd1dGY4Jyk7XG4gICAgICAgIGNvbnN0IGxvY2FsQ2h1bmtzOiBzdHJpbmdbXSA9IGJ1aWxkRW5naW5lLmVudW1lcmF0ZURlcGVuZGVudENodW5rcyhtZXRhSW5mbywgbG9jYWxGZWF0dXJlVW5pdHMpO1xuICAgICAgICBjb25zdCBwbHVnaW5DaHVua3M6IHN0cmluZ1tdID0gYnVpbGRFbmdpbmUuZW51bWVyYXRlRGVwZW5kZW50Q2h1bmtzKG1ldGFJbmZvLCBlbmdpbmVGZWF0dXJlUXVlcnkucGx1Z2luVW5pdCk7XG4gICAgICAgIC8vIE5PVEXvvJrmuLjmiI/ljIXlhoXmnInkvb/nlKjliLDnmoTmj5Lku7bmqKHlnZflkozmnKzlnLDmqKHlnZfkvp3otZbnmoQgYXNzZXTvvIzpg73opoHmlL7liLDmnKzlnLDljIXlhoVcbiAgICAgICAgY29uc3QgYXNzZXRzID0gYnVpbGRFbmdpbmUuZW51bWVyYXRlRGVwZW5kZW50QXNzZXRzKG1ldGFJbmZvLCBsb2NhbEZlYXR1cmVVbml0cykuY29uY2F0KGJ1aWxkRW5naW5lLmVudW1lcmF0ZURlcGVuZGVudEFzc2V0cyhtZXRhSW5mbywgbG9jYWxQbHVnaW5GZWF0dXJlVW5pdHMpKTtcblxuICAgICAgICBsb2NhbENodW5rcy5mb3JFYWNoKChjaHVuaykgPT4ge1xuICAgICAgICAgICAgaWYgKHBsdWdpbkNodW5rcy5pbmNsdWRlcyhjaHVuaykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZENodW5rVG9QbHVnaW4oY2h1bmspO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFRvTG9jYWwoY2h1bmspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYXNzZXRzLmZvckVhY2goKGFzc2V0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFkZFRvTG9jYWwoYXNzZXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbXBvcnRNYXBbJ2NjJ10gPSBgLi8ke3JlbGF0aXZlVXJsKGRpcm5hbWUob3B0aW9ucy5pbXBvcnRNYXBPdXRGaWxlKSwgb3B0aW9ucy5vdXRwdXQpfS9jYy5qc2A7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMub3V0cHV0TG9jYWxQbHVnaW4pIHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsUGx1Z2luQ2h1bmtzID0gYnVpbGRFbmdpbmUuZW51bWVyYXRlRGVwZW5kZW50Q2h1bmtzKG1ldGFJbmZvLCBsb2NhbFBsdWdpbkZlYXR1cmVVbml0cyk7XG4gICAgICAgICAgICAvLyDnlJ/miJDmnKzlnLDpnIDopoHnmoTmj5Lku7bmlofku7blpLnliLDovpPlh7rnm67lvZVcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVMb2NhbFBsdWdpbihsb2NhbFBsdWdpbkNodW5rcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZUxvY2FsUGx1Z2luKGZlYXR1cmVGaWxlczogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3QgY29jb3NEZXN0ID0gam9pbihkaXJuYW1lKHRoaXMub3B0aW9ucy5vdXRwdXQpLCB0aGlzLm9wdGlvbnMucGx1Z2luTmFtZSk7XG4gICAgICAgIHJldHVybiBFbmdpbmVGZWF0dXJlVW5pdEdlbmVyYXRvci5nZW5lcmF0ZVBsdWdpbnModGhpcy5lbmdpbmVDYWNoZVBhdGhzLCBmZWF0dXJlRmlsZXMsIGNvY29zRGVzdCwgdGhpcy5vcHRpb25zLnNpZ25hdHVyZVByb3ZpZGVyKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXN5bmMgZ2VuZXJhdGVQbHVnaW5zKGVuZ2luZVBhdGhzOiBFbmdpbmVDYWNoZVBhdGhzLCBmZWF0dXJlRmlsZXM6IHN0cmluZ1tdLCBkaXN0OiBzdHJpbmcsIHNpZ25hdHVyZVByb3ZpZGVyPzogc3RyaW5nKSB7XG4gICAgICAgIGlmICghZmVhdHVyZUZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1ldGFJbmZvID0gcmVhZEpTT05TeW5jKGVuZ2luZVBhdGhzLm1ldGEpO1xuICAgICAgICBlbnN1cmVEaXJTeW5jKGRpc3QpO1xuICAgICAgICBsZXQgdXBkYXRlTWV0YSA9IGZhbHNlO1xuICAgICAgICBjb25zdCBzaWduYXR1cmU6IElTaWduYXR1cmVDb25maWdbXSA9IFtdO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgIGZlYXR1cmVGaWxlcy5tYXAoYXN5bmMgKGZpbGUsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzcmMgPSBqb2luKGVuZ2luZVBhdGhzLmFsbCwgZmlsZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVzdCA9IGpvaW4oZGlzdCwgZmlsZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFtZXRhSW5mby5tZDVNYXBbZmlsZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgcGF0Y2ggbWQ1IGZvciAke2ZpbGV9YCk7XG4gICAgICAgICAgICAgICAgICAgIG1ldGFJbmZvLm1kNU1hcFtmaWxlXSA9IGF3YWl0IGNhbGNDb2RlTWQ1KHNyYyk7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZU1ldGEgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzaWduYXR1cmUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG1kNTogbWV0YUluZm8ubWQ1TWFwW2ZpbGVdLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBmaWxlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShkZXN0KSk7XG4gICAgICAgICAgICAgICAgLy8g5rOo5oSP77yM5Y2V54us5ou36LSd5paH5Lu25Y+v5Lul77yM5aaC5p6c5piv5LuO5a6J6KOF5YyF5YaF5ou36LSd5paH5Lu25aS55Lya5pyJ5p2D6ZmQ6Zeu6aKYXG4gICAgICAgICAgICAgICAgY29weUZpbGVTeW5jKHNyYywgZGVzdCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgICAgc2lnbmF0dXJlUHJvdmlkZXIgJiYgYXdhaXQgb3V0cHV0SlNPTihqb2luKGRpc3QsIGJhc2VuYW1lKGVuZ2luZVBhdGhzLnNpZ25hdHVyZUpTT04pKSwge1xuICAgICAgICAgICAgcHJvdmlkZXI6IHNpZ25hdHVyZVByb3ZpZGVyLFxuICAgICAgICAgICAgc2lnbmF0dXJlLFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgb3V0cHV0SlNPTihqb2luKGRpc3QsIGJhc2VuYW1lKGVuZ2luZVBhdGhzLnBsdWdpbkpTT04pKSwge1xuICAgICAgICAgICAgbWFpbjogJ2Jhc2UuanMnLFxuICAgICAgICB9KTtcbiAgICAgICAgLy8g5pu05pawIG1ldGFJbmZvIOaVsOaNrlxuICAgICAgICB1cGRhdGVNZXRhICYmIGF3YWl0IHdyaXRlSlNPTlN5bmMoZW5naW5lUGF0aHMubWV0YSwgbWV0YUluZm8sIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICByZXR1cm4gc2lnbmF0dXJlO1xuICAgIH1cbn1cblxuLyoqXG4gKiDmoLnmja7pgInpobnnvJbor5HliIbnprvlvJXmk47vvIzlubbov5Tlm54gaW1wb3J0TWFwIOS/oeaBr1xuICogQHBhcmFtIG9wdGlvbnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZFNlcGFyYXRlRW5naW5lKG9wdGlvbnM6IElCdWlsZFNlcGFyYXRlRW5naW5lT3B0aW9ucyk6IFByb21pc2U8SUJ1aWxkU2VwYXJhdGVFbmdpbmVSZXN1bHQ+IHtcblxuICAgIGNvbnN0IGVuZ2luZUZlYXR1cmVHZW5lcmF0b3IgPSBhd2FpdCBFbmdpbmVGZWF0dXJlVW5pdEdlbmVyYXRvci5jcmVhdGUob3B0aW9ucyk7XG4gICAgYXdhaXQgZW5naW5lRmVhdHVyZUdlbmVyYXRvci5ydW4oKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpbXBvcnRNYXA6IGVuZ2luZUZlYXR1cmVHZW5lcmF0b3IuaW1wb3J0TWFwLFxuICAgICAgICBwYXRoczogZW5naW5lRmVhdHVyZUdlbmVyYXRvci5lbmdpbmVDYWNoZVBhdGhzLFxuICAgIH07XG59XG5cbi8qKlxuICog57yW6K+R5byV5pOO5YiG56a75o+S5Lu25Yiw57yT5a2Y55uu5b2V5LiLKOWRveS7pOihjOS8muiwg+eUqClcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkQ29jb3Mob3B0aW9uczogSUJ1aWxkU2VwYXJhdGVFbmdpbmVDYWNoZU9wdGlvbnMpOiBQcm9taXNlPEVuZ2luZUNhY2hlUGF0aHM+IHtcbiAgICBjb25zdCBvdXREaXIgPSBqb2luKG9wdGlvbnMuZW5naW5lLCBgYmluLy5jYWNoZS9lZGl0b3ItY2FjaGUvJHtvcHRpb25zLnBsYXRmb3JtfWApO1xuICAgIGNvbnN0IGVuZ2luZVBhdGhzID0gbmV3IEVuZ2luZUNhY2hlUGF0aHMob3V0RGlyLCBvcHRpb25zLnBsdWdpbk5hbWUpO1xuICAgIGlmIChvcHRpb25zLnVzZUNhY2hlRm9yY2UgJiYgZXhpc3RzU3luYyhlbmdpbmVQYXRocy5wbHVnaW4pKSB7XG4gICAgICAgIC8vIOebruWJjeaaguacquajgOafpeWujOaVtOeahOe8k+WtmOaYr+WQpuacieaViFxuICAgICAgICByZXR1cm4gZW5naW5lUGF0aHM7XG4gICAgfVxuICAgIG9wdGlvbnMuZW5naW5lRmVhdHVyZVF1ZXJ5ID0gb3B0aW9ucy5lbmdpbmVGZWF0dXJlUXVlcnkgfHwgYXdhaXQgRW5naW5lRmVhdHVyZVF1ZXJ5LmNyZWF0ZSh7XG4gICAgICAgIHBsYXRmb3JtVHlwZTogb3B0aW9ucy5wbGF0Zm9ybVR5cGUsXG4gICAgICAgIGVuZ2luZTogb3B0aW9ucy5lbmdpbmUsXG4gICAgICAgIHBsdWdpbkZlYXR1cmVzOiBvcHRpb25zLnBsdWdpbkZlYXR1cmVzLFxuICAgIH0pO1xuICAgIGNvbnN0IHsgZW5naW5lRmVhdHVyZVF1ZXJ5IH0gPSBvcHRpb25zO1xuXG4gICAgLy8gQHRzLWlnbm9yZSDnm67liY3nvJbor5HlvJXmk47mjqXlj6Pph4znmoQgZmxhZ3Mg5a6a5LmJ5peg5rOV5LqS55u45L2/55So77yM5a6e6ZmF5LiK5piv5ZCM5LiA5Lu95pWw5o2uXG4gICAgY29uc3QgYnVpbGRPcHRpb25zOiBidWlsZEVuZ2luZS5PcHRpb25zID0ge1xuICAgICAgICBlbmdpbmU6IG9wdGlvbnMuZW5naW5lLFxuICAgICAgICBvdXQ6IGVuZ2luZVBhdGhzLmFsbCxcbiAgICAgICAgbW9kdWxlRm9ybWF0OiAnc3lzdGVtJyxcbiAgICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICAgIHNwbGl0OiB0cnVlLFxuICAgICAgICBuYXRpdmVDb2RlQnVuZGxlTW9kZTogb3B0aW9ucy5uYXRpdmVDb2RlQnVuZGxlTW9kZSxcbiAgICAgICAgZmVhdHVyZXM6IGVuZ2luZUZlYXR1cmVRdWVyeS5hbGwsXG4gICAgICAgIGlubGluZUVudW06IGZhbHNlLCAvLyDliIbnprvlvJXmk47mj5Lku7blhYjkuI3lvIDlkK/lhoXogZTmnprkuL7lip/og73vvIznrYkgdjMuOC41IOWQjue7reeJiOacrOmqjOivgeeos+WumuWQjuWGjeiAg+iZkeW8gOWQr1xuICAgICAgICAuLi5lbmdpbmVGZWF0dXJlUXVlcnkuZW52LFxuICAgICAgICAvLyBwbGF0Zm9ybTogZW5naW5lRmVhdHVyZVF1ZXJ5LmVudi5wbGF0Zm9ybSxcbiAgICAgICAgLy8gbW9kZTogZW5naW5lRmVhdHVyZVF1ZXJ5LmVudi5tb2RlLFxuICAgICAgICAvLyBmbGFnczogZW5naW5lRmVhdHVyZVF1ZXJ5LmVudi5mbGFncyxcbiAgICB9O1xuXG4gICAgY29uc3QgY2FjaGVPcHRpb25zUGF0aCA9IGpvaW4ob3V0RGlyLCAnb3B0aW9ucy5qc29uJyk7XG4gICAgaWYgKGV4aXN0c1N5bmMoY2FjaGVPcHRpb25zUGF0aCkpIHtcbiAgICAgICAgY29uc3QgY2FjaGVPcHRpb25zID0gcmVhZEpTT05TeW5jKGNhY2hlT3B0aW9uc1BhdGgpO1xuICAgICAgICBpZiAoY29tcGFyZU9wdGlvbnMoY2FjaGVPcHRpb25zLCBidWlsZE9wdGlvbnMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgdXNlIGNhY2hlIGVuZ2luZSBpbiAke2VuZ2luZVBhdGhzLmRpcn1gKTtcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmVQYXRocztcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBDYW4gbm90IGZpbmQgb3B0aW9ucyBjYWNoZSBpbiAke2NhY2hlT3B0aW9uc1BhdGh9YCk7XG4gICAgfVxuICAgIGVtcHR5RGlyU3luYyhvdXREaXIpO1xuICAgIC8vIOeri+mprOe8k+WtmOaehOW7uumAiemhue+8jOWQpuWImeWPr+iDveS8muiiq+WQjue7rea1geeoi+S/ruaUuVxuICAgIGNvbnN0IGJ1aWxkT3B0aW9uc0NhY2hlID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShidWlsZE9wdGlvbnMpKTtcblxuICAgIGNvbnN0IGJ1aWxkUmVzdWx0ID0gYXdhaXQgYnVpbGRFbmdpbmUoYnVpbGRPcHRpb25zKTtcbiAgICBjb25zdCBtZDVNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAvLyDorqHnrpflvJXmk44gbWQ1IOWAvFxuICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICBPYmplY3Qua2V5cyhidWlsZFJlc3VsdC5leHBvcnRzKS5tYXAoYXN5bmMgKGtleSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGVzdCA9IGpvaW4oZW5naW5lUGF0aHMuYWxsLCBidWlsZFJlc3VsdC5leHBvcnRzW2tleV0pO1xuICAgICAgICAgICAgY29uc3QgbWQ1ID0gY2FsY0NvZGVNZDUoZGVzdCk7XG4gICAgICAgICAgICBtZDVNYXBbYnVpbGRSZXN1bHQuZXhwb3J0c1trZXldXSA9IG1kNTtcbiAgICAgICAgfSksXG4gICAgKTtcbiAgICAvLyDnvJPlrZjkuIDkuIvlvJXmk47mj5DkvpvnmoTmqKHlnZfmmKDlsIRcbiAgICBhd2FpdCB3cml0ZUpTT05TeW5jKGVuZ2luZVBhdGhzLm1ldGEsIE9iamVjdC5hc3NpZ24oYnVpbGRSZXN1bHQsIHsgbWQ1TWFwIH0pLCB7IHNwYWNlczogMiB9KTtcblxuICAgIC8vIOaVtOeQhuWHuuWPr+S+m+S4iuS8oOeahOW8leaTjuaPkuS7tuWGheWuuVxuICAgIGlmIChlbmdpbmVGZWF0dXJlUXVlcnkucGx1Z2luLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBmZWF0dXJlVW5pdHMgPSBlbmdpbmVGZWF0dXJlUXVlcnkuZ2V0VW5pdHNPZkZlYXR1cmVzKGVuZ2luZUZlYXR1cmVRdWVyeS5wbHVnaW4pO1xuICAgICAgICAvLyBOT1RFOiDmj5Lku7bph4zlj6rog73mlL4gY2h1bmtz77yM5LiN6IO95pS+IGFzc2V0c1xuICAgICAgICBjb25zdCBmZWF0dXJlRmlsZXMgPSBidWlsZEVuZ2luZS5lbnVtZXJhdGVEZXBlbmRlbnRDaHVua3MoYnVpbGRSZXN1bHQsIGZlYXR1cmVVbml0cyk7XG4gICAgICAgIGF3YWl0IGdlbmVyYXRlUGx1Z2lucyhlbmdpbmVQYXRocywgZmVhdHVyZUZpbGVzLCBlbmdpbmVQYXRocy5wbHVnaW4sIG9wdGlvbnMuc2lnbmF0dXJlUHJvdmlkZXIpO1xuICAgIH1cbiAgICAvLyDmnIDlkI7lho3nlJ/miJDpgInpobnnvJPlrZjmlofku7bvvIzpgb/lhY3lvJXmk47mlofku7bnlJ/miJDml7bkuK3mlq3lkI7mlofku7bkuI3lrozmlbTlr7zoh7TlkI7nu63mraXpqqTml6Dms5Xov5DooYxcbiAgICBhd2FpdCBvdXRwdXRKU09OKGNhY2hlT3B0aW9uc1BhdGgsIGJ1aWxkT3B0aW9uc0NhY2hlLCB7IHNwYWNlczogNCB9KTtcbiAgICByZXR1cm4gZW5naW5lUGF0aHM7XG59XG5cbmZ1bmN0aW9uIHJlbGF0aXZlVXJsKGZyb206IHN0cmluZywgdG86IHN0cmluZykge1xuICAgIHJldHVybiByZWxhdGl2ZShmcm9tLCB0bykucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xufVxuXG4vKipcbiAqIOaRmOmAieeUn+aIkOW8leaTjuaPkuS7tuWMhVxuICogQHBhcmFtIGVuZ2luZVBhdGhzIFxuICogQHBhcmFtIGZlYXR1cmVGaWxlcyBcbiAqIEBwYXJhbSBkaXN0IFxuICogQHJldHVybnMgXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUGx1Z2lucyhlbmdpbmVQYXRoczogRW5naW5lQ2FjaGVQYXRocywgZmVhdHVyZUZpbGVzOiBzdHJpbmdbXSwgZGlzdDogc3RyaW5nLCBzaWduYXR1cmVQcm92aWRlcj86IHN0cmluZyk6IFByb21pc2U8SVNpZ25hdHVyZUNvbmZpZ1tdPiB7XG4gICAgaWYgKCFmZWF0dXJlRmlsZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgbWV0YUluZm8gPSByZWFkSlNPTlN5bmMoZW5naW5lUGF0aHMubWV0YSk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXN0KTtcbiAgICBsZXQgdXBkYXRlTWV0YSA9IGZhbHNlO1xuICAgIGNvbnN0IHNpZ25hdHVyZTogSVNpZ25hdHVyZUNvbmZpZ1tdID0gW107XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIGZlYXR1cmVGaWxlcy5tYXAoYXN5bmMgKGZpbGUsIGkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNyYyA9IGpvaW4oZW5naW5lUGF0aHMuYWxsLCBmaWxlKTtcbiAgICAgICAgICAgIGNvbnN0IGRlc3QgPSBqb2luKGRpc3QsIGZpbGUpO1xuICAgICAgICAgICAgaWYgKCFtZXRhSW5mby5tZDVNYXBbZmlsZV0pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBwYXRjaCBtZDUgZm9yICR7ZmlsZX1gKTtcbiAgICAgICAgICAgICAgICBtZXRhSW5mby5tZDVNYXBbZmlsZV0gPSBhd2FpdCBjYWxjQ29kZU1kNShzcmMpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZU1ldGEgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2lnbmF0dXJlLnB1c2goe1xuICAgICAgICAgICAgICAgIG1kNTogbWV0YUluZm8ubWQ1TWFwW2ZpbGVdLFxuICAgICAgICAgICAgICAgIHBhdGg6IGZpbGUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShkZXN0KSk7XG4gICAgICAgICAgICAvLyDms6jmhI/vvIzljZXni6zmi7fotJ3mlofku7blj6/ku6XvvIzlpoLmnpzmmK/ku47lronoo4XljIXlhoXmi7fotJ3mlofku7blpLnkvJrmnInmnYPpmZDpl67pophcbiAgICAgICAgICAgIGNvcHlGaWxlU3luYyhzcmMsIGRlc3QpO1xuICAgICAgICB9KSxcbiAgICApO1xuICAgIHNpZ25hdHVyZVByb3ZpZGVyICYmIGF3YWl0IG91dHB1dEpTT04oZW5naW5lUGF0aHMuc2lnbmF0dXJlSlNPTiwge1xuICAgICAgICBwcm92aWRlcjogc2lnbmF0dXJlUHJvdmlkZXIsXG4gICAgICAgIHNpZ25hdHVyZSxcbiAgICB9KTtcbiAgICBhd2FpdCBvdXRwdXRKU09OKGVuZ2luZVBhdGhzLnBsdWdpbkpTT04sIHtcbiAgICAgICAgbWFpbjogJ2Jhc2UuanMnLFxuICAgIH0pO1xuICAgIC8vIOabtOaWsCBtZXRhSW5mbyDmlbDmja5cbiAgICB1cGRhdGVNZXRhICYmIGF3YWl0IHdyaXRlSlNPTlN5bmMoZW5naW5lUGF0aHMubWV0YSwgbWV0YUluZm8sIHsgc3BhY2VzOiAyIH0pO1xuICAgIHJldHVybiBzaWduYXR1cmU7XG59XG5cbmZ1bmN0aW9uIGNhbGNDb2RlTWQ1KGZpbGU6IHN0cmluZykge1xuICAgIHJldHVybiBjcmVhdGVIYXNoKCdtZDUnKS51cGRhdGUocmVhZEZpbGVTeW5jKGZpbGUpIGFzIFVpbnQ4QXJyYXkpLmRpZ2VzdCgnaGV4Jyk7XG59XG4iXX0=