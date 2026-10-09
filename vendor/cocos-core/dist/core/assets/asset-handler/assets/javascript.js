"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavascriptHandler = void 0;
const asset_db_1 = require("@cocos/asset-db");
const fs_extra_1 = require("fs-extra");
const script_compiler_1 = require("./utils/script-compiler");
const plugin_script_globals_1 = require("./utils/plugin-script-globals");
const utils_1 = require("../utils");
const scripting_1 = __importDefault(require("../../../scripting"));
const asset_db_2 = require("@cocos/asset-db");
exports.JavascriptHandler = {
    // Handler 的名字，用于指定 Handler as 等
    name: 'javascript',
    // 引擎内对应的类型
    assetType: 'cc.Script',
    open: utils_1.openCode,
    importer: {
        // 版本号如果变更，则会强制重新导入
        version: '4.0.24',
        /**
         * 实际导入流程
         * 需要自己控制是否生成、拷贝文件
         *
         * 返回是否导入成功的标记
         * 如果返回 false，则 imported 标记不会变成 true
         * 后续的一系列操作都不会执行
         * @param asset
         */
        async import(asset) {
            if (!(asset instanceof asset_db_1.Asset)) {
                console.error('Expect non-virtual asset');
                return false;
            }
            const userData = asset.userData;
            try {
                if (userData.isPlugin) {
                    return await _importPluginScript(asset);
                }
                else {
                    await scripting_1.default.compileScripts([{
                            type: asset.action,
                            uuid: asset.uuid,
                            filePath: asset.source,
                            importer: asset.meta.importer,
                            userData: asset.meta.userData,
                        }]);
                    return true;
                }
            }
            catch (error) {
                console.error(`Failed to import script ${asset.source}`);
                throw error;
            }
        },
    },
    async destroy(asset) {
        scripting_1.default.dispatchAssetChange({
            type: asset_db_2.AssetActionEnum.delete,
            uuid: asset.uuid,
            filePath: asset.source,
            importer: asset.meta.importer,
            userData: asset.meta.userData,
        });
        try {
            await scripting_1.default.compileScripts();
        }
        catch {
            //
        }
    },
};
exports.default = exports.JavascriptHandler;
async function _importPluginScript(asset) {
    // https://mathiasbynens.be/notes/globalthis
    const code = await (0, fs_extra_1.readFile)(asset.source, 'utf-8');
    // 填写默认的插件导入选项
    const { executionScope = 'enclosed', experimentalHideCommonJs, experimentalHideAmd, simulateGlobals, } = asset.userData;
    const defaultUserData = {
        isPlugin: true,
        loadPluginInEditor: false,
        loadPluginInWeb: true,
        loadPluginInMiniGame: true,
        loadPluginInNative: true,
    };
    asset.assignUserData(defaultUserData, false);
    if (executionScope === 'global') {
        await asset.saveToLibrary('.js', code);
        return true;
    }
    const simulateGlobalNames = (0, plugin_script_globals_1.resolveSimulatedGlobals)(simulateGlobals);
    const transformed = await (0, script_compiler_1.transformPluginScript)(code, {
        simulateGlobals: simulateGlobalNames,
        hideCommonJs: experimentalHideCommonJs ?? true,
        hideAmd: experimentalHideAmd ?? true,
    });
    await asset.saveToLibrary('.js', transformed.code);
    return true;
}
