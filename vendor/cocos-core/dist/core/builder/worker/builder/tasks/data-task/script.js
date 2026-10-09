'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = exports.title = void 0;
exports.handle = handle;
const path_1 = require("path");
const plugin_1 = require("../../../../manager/plugin");
const asset_1 = __importDefault(require("../../../../../assets/manager/asset"));
exports.title = 'i18n:builder.tasks.sort_asset_bundle';
exports.name = 'data-task/asset_script';
async function handle(options, result, cache) {
    let queryPluginOptions = {};
    try {
        const platformType = plugin_1.pluginManager.platformConfig[options.platform].type;
        if (platformType) {
            queryPluginOptions = {
                [`loadPluginIn${platformType[0].toUpperCase() + platformType.slice(1)}`]: true,
            };
        }
    }
    catch (error) {
        console.error(error);
        console.warn(`Can not find platform type for ${options.platform}`);
    }
    result.pluginScripts = asset_1.default.querySortedPlugins(queryPluginOptions);
    // 初始化一些脚本编译选项，路径等等，方便后续流程的修改
    if (options.preview) {
        return;
    }
    result.paths.polyfillsJs = (0, path_1.join)(result.paths.dir, 'src', 'polyfills.bundle.js');
    result.paths.systemJs = (0, path_1.join)(result.paths.dir, 'src', 'system.bundle.js');
    result.paths.engineDir = options.buildEngineParam.output;
    const { importMapFormat } = options.buildScriptParam;
    let extension;
    const importMapDir = (0, path_1.join)(result.paths.dir, 'src');
    if (importMapFormat === undefined) {
        extension = '.json';
    }
    else {
        extension = '.js';
    }
    const importMapOutFile = (0, path_1.join)(importMapDir, `import-map${extension}`);
    result.paths.importMap = importMapOutFile;
    options.buildScriptParam.commonDir = (0, path_1.join)(result.paths.dir, 'src', 'chunks');
}
