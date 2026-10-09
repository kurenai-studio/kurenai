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
exports.BuildResult = exports.InternalBuildResult = void 0;
const path_1 = require("path");
const asset_library_1 = require("./asset-library");
const BundleUtils = __importStar(require("../asset-handler/bundle/utils"));
const events_1 = __importDefault(require("events"));
const utils_1 = require("../utils");
const builder_config_1 = __importDefault(require("../../../share/builder-config"));
const i18n_1 = __importDefault(require("../../../../base/i18n"));
const global_1 = require("../../../share/global");
class Paths {
    dir;
    output;
    cache = {};
    compileConfig;
    effectBin = '';
    engineMeta = '';
    hashedMap = {};
    plugins = {};
    tempDir;
    projectRoot;
    constructor(dir, platform) {
        this.dir = dir || '';
        this.output = this.dir;
        this.compileConfig = (0, path_1.join)(dir, global_1.BuildGlobalInfo.buildOptionsFileName);
        this.tempDir = (0, path_1.join)(builder_config_1.default.projectTempDir, 'builder', platform);
        this.projectRoot = builder_config_1.default.projectRoot;
    }
    get settings() {
        return this.cache.settings || (0, path_1.join)(this.dir, 'src', 'settings.json');
    }
    set settings(val) {
        this.cache.settings = val;
    }
    get subpackages() {
        return this.cache.subpackages || (0, path_1.join)(this.dir, global_1.BuildGlobalInfo.SUBPACKAGES_HEADER);
    }
    set subpackages(val) {
        this.cache.subpackages = val;
    }
    get assets() {
        return this.cache.assets || (0, path_1.join)(this.dir, global_1.BuildGlobalInfo.ASSETS_HEADER);
    }
    set assets(val) {
        this.cache.assets = val;
    }
    get remote() {
        return this.cache.remote || (0, path_1.join)(this.dir, global_1.BuildGlobalInfo.REMOTE_HEADER);
    }
    set remote(val) {
        this.cache.remote = val;
    }
    get applicationJS() {
        return this.cache.applicationJS || (0, path_1.join)(this.dir, 'application.js');
    }
    set applicationJS(val) {
        this.cache.applicationJS = val;
    }
    get importMap() {
        return this.cache.importMap || (0, path_1.join)(this.dir, 'import-map.js');
    }
    set importMap(val) {
        this.cache.importMap = val;
    }
    get bundleScripts() {
        return this.cache.bundleScripts || (0, path_1.join)(this.dir, 'src', global_1.BuildGlobalInfo.BUNDLE_SCRIPTS_HEADER);
    }
    set bundleScripts(val) {
        this.cache.bundleScripts = val;
    }
}
// 构建过程处理的缓存对象
class InternalBuildResult extends events_1.default {
    settings = {
        CocosEngine: '0.0.0',
        engine: {
            debug: true,
            platform: 'web-desktop',
            customLayers: [],
            sortingLayers: [],
            macros: {},
            builtinAssets: [],
        },
        animation: {
            customJointTextureLayouts: [],
        },
        assets: {
            server: '',
            remoteBundles: [],
            subpackages: [],
            preloadBundles: [],
            bundleVers: {},
            preloadAssets: [],
            projectBundles: [],
        },
        plugins: {
            jsList: [],
        },
        scripting: {},
        launch: {
            launchScene: '',
        },
        screen: {
            exactFitScreen: true,
            designResolution: {
                width: 960,
                height: 640,
                policy: 0,
            },
        },
        rendering: {
            renderPipeline: '',
        },
    };
    // 脚本资源包分组（子包/分包）
    scriptPackages = [];
    // 插件版本
    pluginVers = {};
    // 纹理压缩结果存储
    compressImageResult = {};
    /**
     * @param name
     * @param options
     * 导入映射
     */
    importMap = { imports: {} };
    rawOptions;
    paths;
    compileOptions = null; // 允许自定义编译选项，如果未指定将会使用构建 options 存储
    __task;
    pluginScripts = [];
    separateEngineResult;
    get dest() {
        // TODO 兼容 adsense 插件从外部插件转为内部插件，兼容至 3.9
        return this.paths.dir;
    }
    constructor(task, preview) {
        super();
        this.rawOptions = JSON.parse(JSON.stringify(task.options));
        // 虚拟路径
        let dest = (0, path_1.join)(builder_config_1.default.projectRoot, 'build', 'preview');
        if (!preview) {
            dest = (0, utils_1.getBuildPath)(task.options);
        }
        this.paths = new Paths(dest, task.options.platform);
        this.__task = task;
    }
}
exports.InternalBuildResult = InternalBuildResult;
class BuildResult {
    __task;
    settings;
    dest;
    get paths() {
        return this.__task.result.paths;
    }
    constructor(task) {
        this.__task = task;
        this.dest = (0, utils_1.getBuildPath)(task.options);
        this.settings = task.result.settings;
    }
    /**
     * 指定的 uuid 资源是否包含在构建资源中
     */
    containsAsset(uuid) {
        return !!this.__task.bundleManager.bundles.find((bundle) => bundle.containsAsset(uuid));
    }
    /**
     * 获取指定 uuid 原始资源的存放路径（不包括序列化 json）
     * 自动图集的小图 uuid 和自动图集的 uuid 都将会查询到合图大图的生成路径
     * 实际返回多个路径的情况：查询 uuid 为自动图集资源，且对应图集生成多张大图，纹理压缩会有多个图片格式路径
     */
    getRawAssetPaths(uuid) {
        const assetInfo = asset_library_1.buildAssetLibrary.getAsset(uuid);
        if (!assetInfo) {
            return [];
        }
        const bundles = this.__task.bundleManager.bundles.filter((bundle) => bundle.containsAsset(uuid, true));
        if (!bundles.length) {
            return [];
        }
        return bundles.flatMap((bundle) => {
            const res = {
                bundleName: bundle.name,
                raw: [],
            };
            if (bundle.getRedirect(uuid)) {
                res.redirect = bundle.getRedirect(uuid);
            }
            else {
                res.raw = BundleUtils.getRawAssetPaths(uuid, bundle);
            }
            if (!res.raw.length && !res.redirect) {
                return [];
            }
            return res;
        });
    }
    /**
     * 获取指定 uuid 资源的路径相关信息
     * @return Array<{raw?: string | string[]; import?: string; groupIndex?: number;}>
     * @return.raw: 该资源源文件的实际存储位置，存在多个为数组，不存在则为空
     * @return.import: 该资源序列化数据的实际存储位置，不存在为空，可能是 .bin 或者 .json 格式
     * @return.groupIndex: 若该资源的序列化数据在某个分组内，这里标识在分组内的 index，不存在为空
     */
    getAssetPathInfo(uuid) {
        const bundles = this.__task.bundleManager.bundles.filter((bundle) => bundle.containsAsset(uuid, true));
        if (!bundles.length) {
            return [];
        }
        return bundles.flatMap((bundle) => {
            const result = {
                bundleName: bundle.name,
            };
            if (bundle.getRedirect(uuid)) {
                result.redirect = bundle.getRedirect(uuid);
            }
            else {
                Object.assign(result, BundleUtils.getAssetPathInfo(uuid, bundle));
            }
            if (!result.raw && !result.redirect && !result.import) {
                return [];
            }
            return result;
        });
    }
    /**
     * @deprecated please use getImportAssetPaths instead
     * @param uuid
     */
    getJsonPathInfo(uuid) {
        console.warn(i18n_1.default.t('builder.warn.deprecated_tip', {
            oldName: 'result.getJsonPathInfo',
            newName: 'result.getImportAssetPaths',
        }));
        return this.getImportAssetPaths(uuid);
    }
    /**
     * 指定 uuid 资源的序列化信息在构建后的信息
     * @param uuid
     */
    getImportAssetPaths(uuid) {
        const bundles = this.__task.bundleManager.bundles.filter((bundle) => bundle.containsAsset(uuid));
        if (!bundles.length) {
            return [];
        }
        return bundles.flatMap((bundle) => {
            const result = {
                bundleName: bundle.name,
            };
            if (bundle.getRedirect(uuid)) {
                result.redirect = bundle.getRedirect(uuid);
            }
            else {
                const info = BundleUtils.getImportPathInfo(uuid, bundle);
                if (!info) {
                    return [];
                }
                Object.assign(result, info);
            }
            return result;
        });
    }
}
exports.BuildResult = BuildResult;
