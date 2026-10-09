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
exports.scriptConfig = void 0;
exports.getDefaultSharedSettings = getDefaultSharedSettings;
exports.querySharedSettings = querySharedSettings;
const fs_extra_1 = __importDefault(require("fs-extra"));
const url_1 = require("url");
const fs_1 = require("fs");
const configuration_1 = require("../../configuration");
const utils_1 = __importDefault(require("../../base/utils"));
const metadata_1 = require("./metadata");
function getDefaultSharedSettings() {
    return {
        useDefineForClassFields: true,
        allowDeclareFields: true,
        loose: false,
        guessCommonJsExports: false,
        exportsConditions: [],
        sortingPlugin: [],
        preserveSymlinks: false,
        importMap: '',
        previewBrowserslistConfigFile: '',
        updateAutoUpdateImportConfig: false,
    };
}
class ScriptConfig {
    _config = getDefaultSharedSettings();
    /**
     * 持有的可双向绑定的配置管理实例
     * TODO 目前没有防护没有 init 的情况
     */
    _configInstance;
    _init = false;
    async init() {
        if (this._init) {
            return;
        }
        this._configInstance = await configuration_1.configurationRegistry.register('script', {
            defaults: getDefaultSharedSettings(),
            nodes: () => (0, metadata_1.createScriptMetadataNodes)(),
        });
        this._init = true;
    }
    getProject(path, scope) {
        return this._configInstance.get(path, scope);
    }
    async setProject(path, value, scope) {
        const result = await this._configInstance.set(path, value, scope);
        if (path === 'sortingPlugin') {
            const { default: assetConfig } = await Promise.resolve().then(() => __importStar(require('../../assets/asset-config')));
            assetConfig.setSortingPlugin(value);
        }
        return result;
    }
}
exports.scriptConfig = new ScriptConfig();
async function querySharedSettings(logger) {
    const { useDefineForClassFields, allowDeclareFields, loose, guessCommonJsExports, exportsConditions, importMap: importMapFile, preserveSymlinks, } = await exports.scriptConfig.getProject();
    let importMap;
    // ui-file 可能因为清空产生 project:// 这样的数据，应视为空字符串一样的处理逻辑
    if (importMapFile && importMapFile !== 'project://') {
        const importMapFilePath = utils_1.default.Path.resolveToRaw(importMapFile);
        if (importMapFilePath && (0, fs_1.existsSync)(importMapFilePath)) {
            try {
                const importMapJson = await fs_extra_1.default.readJson(importMapFilePath, { encoding: 'utf8' });
                if (!verifyImportMapJson(importMapJson)) {
                    logger.error('Ill-formed import map.');
                }
                else {
                    importMap = {
                        json: importMapJson,
                        url: (0, url_1.pathToFileURL)(importMapFilePath).href,
                    };
                }
            }
            catch (err) {
                logger.error(`Failed to load import map at ${importMapFile}: ${err}`);
            }
        }
        else {
            logger.warn(`Import map file not found in: ${importMapFilePath || importMapFile}`);
        }
    }
    return {
        useDefineForClassFields: useDefineForClassFields ?? true,
        allowDeclareFields: allowDeclareFields ?? true,
        loose: loose ?? false,
        exportsConditions: exportsConditions ?? [],
        guessCommonJsExports: guessCommonJsExports ?? false,
        importMap,
        preserveSymlinks: preserveSymlinks ?? false,
    };
}
/**
 * Verify the unknown input value is allowed shape of an import map.
 * This is not parse.
 * @param input
 * @param logger
 * @returns
 */
function verifyImportMapJson(input) {
    if (typeof input !== 'object' || !input) {
        return false;
    }
    const verifySpecifierMap = (specifierMapInput) => {
        if (typeof specifierMapInput !== 'object' || !specifierMapInput) {
            return false;
        }
        for (const value of Object.values(specifierMapInput)) {
            if (typeof value !== 'string') {
                return false;
            }
        }
        return true;
    };
    if ('imports' in input) {
        if (!verifySpecifierMap(input.imports)) {
            return false;
        }
    }
    if ('scopes' in input) {
        for (const value of Object.values(input)) {
            if (!verifySpecifierMap(value)) {
                return false;
            }
        }
    }
    return true;
}
