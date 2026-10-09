'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = exports.title = void 0;
exports.handle = handle;
const path_1 = require("path");
const script_1 = require("../../asset-handler/script");
const crypto_1 = require("crypto");
const fs_extra_1 = require("fs-extra");
const md5_cache_handler_1 = require("./md5-cache-handler");
const asset_1 = __importDefault(require("../../../../../assets/manager/asset"));
const utils_1 = require("../../utils");
exports.title = 'i18n:builder.tasks.build_suffix';
exports.name = 'build-task/suffix';
/**
 * 根据分组信息内的 json 数据，合并后打包到指定位置
 * @param options
 * @param settings
 */
async function handle(options, result, cache) {
    if (!options.md5Cache) {
        return;
    }
    // 自动替换主要为了替换构建模板内的文件引用，如不存在模板文件无需额外扫描处理
    if (options.md5CacheOptions.handleTemplateMd5Link && this.buildTemplate.isEnable) {
        // 自动给其他根目录以及 src 目录下的第一层文件添加 hash 值，并替换其他未被处理文件内的路径引用
        options.md5CacheOptions.includes.push('*', 'src/*');
    }
    const md5Cache = new md5_cache_handler_1.md5CacheHandler(result.paths.dir, options.md5CacheOptions);
    // 给插件脚本加上 md5，并更新数据
    for (let i = 0; i < result.settings.plugins.jsList.length; i++) {
        const pluginUrl = result.settings.plugins.jsList[i];
        const pluginUuid = asset_1.default.url2uuid('db://' + pluginUrl);
        const pluginPath = result.paths.plugins[pluginUuid];
        const newPath = await md5Cache.addMd5ToPath(pluginPath);
        result.settings.plugins.jsList[i] = pluginUrl.replace((0, path_1.basename)(pluginPath), (0, path_1.basename)(newPath));
    }
    // 给引擎脚本加上 md5
    for (const key of Object.keys(result.importMap.imports)) {
        const dirName = (0, path_1.dirname)(result.paths.importMap);
        const value = result.importMap.imports[key];
        // import map 可能映射到另一个虚拟模块，而不是相对路径
        if (!value.startsWith('.')) {
            continue;
        }
        const dest = (0, path_1.join)(dirName, value);
        const newPath = await md5Cache.addMd5ToPath(dest);
        result.importMap.imports[key] = `./${(0, utils_1.relativeUrl)(dirName, newPath)}`;
    }
    // 存在 md5 需要重新生成 import-map 数据
    await script_1.ScriptBuilder.outputImportMap(result.importMap, {
        dest: result.paths.importMap,
        importMapFormat: options.buildScriptParam.importMapFormat,
        debug: options.debug,
    });
    result.paths.importMap = await md5Cache.addMd5ToPath(result.paths.importMap);
    // 给一些独立脚本加上 md5
    if (result.paths.polyfillsJs) {
        result.paths.polyfillsJs = await md5Cache.addMd5ToPath(result.paths.polyfillsJs);
    }
    if (result.paths.systemJs) {
        result.paths.systemJs = await md5Cache.addMd5ToPath(result.paths.systemJs);
    }
    // 给 scriptPackages 里的脚本加上 md5，未记录到 import-map 内的处理需要加到
    for (let i = 0; i < result.scriptPackages.length; i++) {
        const dest = result.scriptPackages[i];
        const newPath = await md5Cache.addMd5ToPath(dest);
        result.scriptPackages[i] = newPath;
        // 更新 settings 内记录的数据
        result.settings.scripting.scriptPackages[i] = result.settings.scripting.scriptPackages[i].replace((0, path_1.basename)(dest), (0, path_1.basename)(newPath));
    }
    // 给 settings.json 加上 md5
    const settings = result.settings;
    const bundles = this.bundleManager.bundles.filter((bundle) => bundle.output).sort((a, b) => a.name.localeCompare(b.name));
    for (const bundle of bundles) {
        settings.assets.bundleVers[bundle.name] = bundle.version;
    }
    const cryptoHash = (0, crypto_1.createHash)('md5');
    cryptoHash.update(JSON.stringify(result.settings));
    md5Cache.hashedPathMap[result.paths.settings] = (0, path_1.join)((0, path_1.dirname)(result.paths.settings), `settings.${cryptoHash.digest('hex').slice(0, 5)}.json`);
    await (0, fs_extra_1.remove)(result.paths.settings);
    result.paths.settings = md5Cache.hashedPathMap[result.paths.settings];
    (0, fs_extra_1.outputFileSync)(result.paths.settings, JSON.stringify(settings, null, options.debug ? 4 : 0));
    await md5Cache.run();
    result.paths.hashedMap = md5Cache.hashedPathMap;
    // 更新一些必要的路径信息
    result.paths.applicationJS = md5Cache.hashedPathMap[result.paths.applicationJS];
    console.debug(`add suffix to assets(${Object.keys(md5Cache.hashedPathMap).length}) success!`);
}
