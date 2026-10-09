'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.title = void 0;
exports.handle = handle;
const path_1 = require("path");
const utils_1 = require("../../utils");
exports.title = 'i18n:builder.tasks.settings.script';
/**
 * 填充脚本数据
 * @param options
 * @param settings
 */
async function handle(options, result, cache) {
    const settings = result.settings;
    settings.scripting.scriptPackages = result.scriptPackages.map((path) => (0, utils_1.relativeUrl)(result.paths.engineDir, path));
    settings.plugins.jsList = result.pluginScripts.map((script) => {
        let fileDbUrlNoProtocolHeader = (0, utils_1.removeDbHeader)(script.url);
        if (options.md5Cache && result.paths.plugins[script.uuid]) {
            fileDbUrlNoProtocolHeader = fileDbUrlNoProtocolHeader.replace(/[^\/]*$/, () => (0, path_1.basename)(result.paths.plugins[script.uuid]));
        }
        return fileDbUrlNoProtocolHeader;
    });
}
