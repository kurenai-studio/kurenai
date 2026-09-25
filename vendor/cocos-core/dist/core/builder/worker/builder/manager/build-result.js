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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtcmVzdWx0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci93b3JrZXIvYnVpbGRlci9tYW5hZ2VyL2J1aWxkLXJlc3VsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBNEI7QUFDNUIsbURBQW9EO0FBQ3BELDJFQUE2RDtBQUM3RCxvREFBa0M7QUFDbEMsb0NBQXdDO0FBR3hDLG1GQUEwRDtBQUMxRCxpRUFBeUM7QUFDekMsa0RBQXdEO0FBRXhELE1BQU0sS0FBSztJQUNQLEdBQUcsQ0FBUztJQUNILE1BQU0sQ0FBUztJQUN4QixLQUFLLEdBQTJCLEVBQUUsQ0FBQztJQUNuQyxhQUFhLENBQVM7SUFFdEIsU0FBUyxHQUFZLEVBQUUsQ0FBQztJQUN4QixVQUFVLEdBQUcsRUFBRSxDQUFDO0lBRWhCLFNBQVMsR0FBMkIsRUFBRSxDQUFDO0lBRXZDLE9BQU8sR0FBMkIsRUFBRSxDQUFDO0lBQ3JDLE9BQU8sQ0FBUztJQUNoQixXQUFXLENBQVM7SUFDcEIsWUFBWSxHQUFXLEVBQUUsUUFBZ0I7UUFDckMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUEsV0FBSSxFQUFDLEdBQUcsRUFBRSx3QkFBZSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDckUsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLFdBQUksRUFBQyx3QkFBYSxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyx3QkFBYSxDQUFDLFdBQVcsQ0FBQztJQUNqRCxDQUFDO0lBRUQsSUFBSSxRQUFRO1FBQ1IsT0FB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LG1CQUFtQixDQUFDLElBQVk7UUFDbkMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbEIsT0FBTyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDOUIsTUFBTSxNQUFNLEdBQXlCO2dCQUNqQyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUk7YUFDMUIsQ0FBQztZQUNGLElBQUksTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMzQixNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDUixPQUFPLEVBQUUsQ0FBQztnQkFDZCxDQUFDO2dCQUNELE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FFSjtBQXhIRCxrQ0F3SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBidWlsZEFzc2V0TGlicmFyeSB9IGZyb20gJy4vYXNzZXQtbGlicmFyeSc7XG5pbXBvcnQgKiBhcyBCdW5kbGVVdGlscyBmcm9tICcuLi9hc3NldC1oYW5kbGVyL2J1bmRsZS91dGlscyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBnZXRCdWlsZFBhdGggfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBJQnVpbGRQYXRocywgSVNldHRpbmdzLCBJQnVpbGRPcHRpb25CYXNlLCBJQnVpbGRSZXN1bHQsIElSYXdBc3NldFBhdGhJbmZvLCBJQXNzZXRQYXRoSW5mbywgSUltcG9ydEFzc2V0UGF0aEluZm8gfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMnO1xuaW1wb3J0IHsgSUNvbXByZXNzSW1hZ2VSZXN1bHQsIEltcG9ydE1hcFdpdGhJbXBvcnRzLCBJQnVpbGRlciwgSUJ1aWxkU2VwYXJhdGVFbmdpbmVSZXN1bHQsIEludGVybmFsQnVpbGRSZXN1bHQgYXMgSUludGVybmFsQnVpbGRSZXN1bHQgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBidWlsZGVyQ29uZmlnIGZyb20gJy4uLy4uLy4uL3NoYXJlL2J1aWxkZXItY29uZmlnJztcbmltcG9ydCBpMThuIGZyb20gJy4uLy4uLy4uLy4uL2Jhc2UvaTE4bic7XG5pbXBvcnQgeyBCdWlsZEdsb2JhbEluZm8gfSBmcm9tICcuLi8uLi8uLi9zaGFyZS9nbG9iYWwnO1xuXG5jbGFzcyBQYXRocyBpbXBsZW1lbnRzIElCdWlsZFBhdGhzIHtcbiAgICBkaXI6IHN0cmluZztcbiAgICByZWFkb25seSBvdXRwdXQ6IHN0cmluZztcbiAgICBjYWNoZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGNvbXBpbGVDb25maWc6IHN0cmluZztcblxuICAgIGVmZmVjdEJpbj86IHN0cmluZyA9ICcnO1xuICAgIGVuZ2luZU1ldGEgPSAnJztcblxuICAgIGhhc2hlZE1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gICAgcGx1Z2luczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIHRlbXBEaXI6IHN0cmluZztcbiAgICBwcm9qZWN0Um9vdDogc3RyaW5nO1xuICAgIGNvbnN0cnVjdG9yKGRpcjogc3RyaW5nLCBwbGF0Zm9ybTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuZGlyID0gZGlyIHx8ICcnO1xuICAgICAgICB0aGlzLm91dHB1dCA9IHRoaXMuZGlyO1xuICAgICAgICB0aGlzLmNvbXBpbGVDb25maWcgPSBqb2luKGRpciwgQnVpbGRHbG9iYWxJbmZvLmJ1aWxkT3B0aW9uc0ZpbGVOYW1lKTtcbiAgICAgICAgdGhpcy50ZW1wRGlyID0gam9pbihidWlsZGVyQ29uZmlnLnByb2plY3RUZW1wRGlyLCAnYnVpbGRlcicsIHBsYXRmb3JtKTtcbiAgICAgICAgdGhpcy5wcm9qZWN0Um9vdCA9IGJ1aWxkZXJDb25maWcucHJvamVjdFJvb3Q7XG4gICAgfVxuXG4gICAgZ2V0IHNldHRpbmdzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZS5zZXR0aW5ncyB8fCBqb2luKHRoaXMuZGlyLCAnc3JjJywgJ3NldHRpbmdzLmpzb24nKTtcbiAgICB9XG5cbiAgICBzZXQgc2V0dGluZ3ModmFsOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jYWNoZS5zZXR0aW5ncyA9IHZhbDtcbiAgICB9XG5cbiAgICBnZXQgc3VicGFja2FnZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLnN1YnBhY2thZ2VzIHx8IGpvaW4odGhpcy5kaXIsIEJ1aWxkR2xvYmFsSW5mby5TVUJQQUNLQUdFU19IRUFERVIpO1xuICAgIH1cblxuICAgIHNldCBzdWJwYWNrYWdlcyh2YWw6IHN0cmluZykge1xuICAgICAgICB0aGlzLmNhY2hlLnN1YnBhY2thZ2VzID0gdmFsO1xuICAgIH1cblxuICAgIGdldCBhc3NldHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLmFzc2V0cyB8fCBqb2luKHRoaXMuZGlyLCBCdWlsZEdsb2JhbEluZm8uQVNTRVRTX0hFQURFUik7XG4gICAgfVxuXG4gICAgc2V0IGFzc2V0cyh2YWw6IHN0cmluZykge1xuICAgICAgICB0aGlzLmNhY2hlLmFzc2V0cyA9IHZhbDtcbiAgICB9XG5cbiAgICBnZXQgcmVtb3RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZS5yZW1vdGUgfHwgam9pbih0aGlzLmRpciwgQnVpbGRHbG9iYWxJbmZvLlJFTU9URV9IRUFERVIpO1xuICAgIH1cblxuICAgIHNldCByZW1vdGUodmFsOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jYWNoZS5yZW1vdGUgPSB2YWw7XG4gICAgfVxuXG4gICAgZ2V0IGFwcGxpY2F0aW9uSlMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLmFwcGxpY2F0aW9uSlMgfHwgam9pbih0aGlzLmRpciwgJ2FwcGxpY2F0aW9uLmpzJyk7XG4gICAgfVxuXG4gICAgc2V0IGFwcGxpY2F0aW9uSlModmFsOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jYWNoZS5hcHBsaWNhdGlvbkpTID0gdmFsO1xuICAgIH1cblxuICAgIGdldCBpbXBvcnRNYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLmltcG9ydE1hcCB8fCBqb2luKHRoaXMuZGlyLCAnaW1wb3J0LW1hcC5qcycpO1xuICAgIH1cblxuICAgIHNldCBpbXBvcnRNYXAodmFsOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jYWNoZS5pbXBvcnRNYXAgPSB2YWw7XG4gICAgfVxuXG4gICAgZ2V0IGJ1bmRsZVNjcmlwdHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLmJ1bmRsZVNjcmlwdHMgfHwgam9pbih0aGlzLmRpciwgJ3NyYycsIEJ1aWxkR2xvYmFsSW5mby5CVU5ETEVfU0NSSVBUU19IRUFERVIpO1xuICAgIH1cblxuICAgIHNldCBidW5kbGVTY3JpcHRzKHZhbDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuY2FjaGUuYnVuZGxlU2NyaXB0cyA9IHZhbDtcbiAgICB9XG59XG5cbi8vIOaehOW7uui/h+eoi+WkhOeQhueahOe8k+WtmOWvueixoVxuZXhwb3J0IGNsYXNzIEludGVybmFsQnVpbGRSZXN1bHQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIgaW1wbGVtZW50cyBJSW50ZXJuYWxCdWlsZFJlc3VsdCB7XG4gICAgcHVibGljIHNldHRpbmdzOiBJU2V0dGluZ3MgPSB7XG4gICAgICAgIENvY29zRW5naW5lOiAnMC4wLjAnLFxuICAgICAgICBlbmdpbmU6IHtcbiAgICAgICAgICAgIGRlYnVnOiB0cnVlLFxuICAgICAgICAgICAgcGxhdGZvcm06ICd3ZWItZGVza3RvcCcsXG4gICAgICAgICAgICBjdXN0b21MYXllcnM6IFtdLFxuICAgICAgICAgICAgc29ydGluZ0xheWVyczogW10sXG4gICAgICAgICAgICBtYWNyb3M6IHt9LFxuICAgICAgICAgICAgYnVpbHRpbkFzc2V0czogW10sXG4gICAgICAgIH0sXG4gICAgICAgIGFuaW1hdGlvbjoge1xuICAgICAgICAgICAgY3VzdG9tSm9pbnRUZXh0dXJlTGF5b3V0czogW10sXG4gICAgICAgIH0sXG4gICAgICAgIGFzc2V0czoge1xuICAgICAgICAgICAgc2VydmVyOiAnJyxcbiAgICAgICAgICAgIHJlbW90ZUJ1bmRsZXM6IFtdLFxuICAgICAgICAgICAgc3VicGFja2FnZXM6IFtdLFxuICAgICAgICAgICAgcHJlbG9hZEJ1bmRsZXM6IFtdLFxuICAgICAgICAgICAgYnVuZGxlVmVyczoge30sXG4gICAgICAgICAgICBwcmVsb2FkQXNzZXRzOiBbXSxcbiAgICAgICAgICAgIHByb2plY3RCdW5kbGVzOiBbXSxcbiAgICAgICAgfSxcbiAgICAgICAgcGx1Z2luczoge1xuICAgICAgICAgICAganNMaXN0OiBbXSxcbiAgICAgICAgfSxcbiAgICAgICAgc2NyaXB0aW5nOiB7fSxcbiAgICAgICAgbGF1bmNoOiB7XG4gICAgICAgICAgICBsYXVuY2hTY2VuZTogJycsXG4gICAgICAgIH0sXG4gICAgICAgIHNjcmVlbjoge1xuICAgICAgICAgICAgZXhhY3RGaXRTY3JlZW46IHRydWUsXG4gICAgICAgICAgICBkZXNpZ25SZXNvbHV0aW9uOiB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDk2MCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IDY0MCxcbiAgICAgICAgICAgICAgICBwb2xpY3k6IDAsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZW5kZXJpbmc6IHtcbiAgICAgICAgICAgIHJlbmRlclBpcGVsaW5lOiAnJyxcbiAgICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy8g6ISa5pys6LWE5rqQ5YyF5YiG57uE77yI5a2Q5YyFL+WIhuWMhe+8iVxuICAgIHB1YmxpYyBzY3JpcHRQYWNrYWdlczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIOaPkuS7tueJiOacrFxuICAgIHB1YmxpYyBwbHVnaW5WZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgICAvLyDnurnnkIbljovnvKnnu5PmnpzlrZjlgqhcbiAgICBwdWJsaWMgY29tcHJlc3NJbWFnZVJlc3VsdDogSUNvbXByZXNzSW1hZ2VSZXN1bHQgPSB7fTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBuYW1lXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiDlr7zlhaXmmKDlsIRcbiAgICAgKi9cbiAgICBwdWJsaWMgaW1wb3J0TWFwOiBJbXBvcnRNYXBXaXRoSW1wb3J0cyA9IHsgaW1wb3J0czoge30gfTtcblxuICAgIHB1YmxpYyByYXdPcHRpb25zOiBJQnVpbGRPcHRpb25CYXNlO1xuXG4gICAgcHVibGljIHBhdGhzOiBJQnVpbGRQYXRocztcblxuICAgIHB1YmxpYyBjb21waWxlT3B0aW9uczogYW55ID0gbnVsbDsgLy8g5YWB6K646Ieq5a6a5LmJ57yW6K+R6YCJ6aG577yM5aaC5p6c5pyq5oyH5a6a5bCG5Lya5L2/55So5p6E5bu6IG9wdGlvbnMg5a2Y5YKoXG5cbiAgICBwcml2YXRlIF9fdGFzazogSUJ1aWxkZXI7XG5cbiAgICBwdWJsaWMgcGx1Z2luU2NyaXB0czogQXJyYXk8e1xuICAgICAgICB1dWlkOiBzdHJpbmc7XG4gICAgICAgIHVybDogc3RyaW5nO1xuICAgICAgICBmaWxlOiBzdHJpbmc7XG4gICAgfT4gPSBbXTtcblxuICAgIHB1YmxpYyBzZXBhcmF0ZUVuZ2luZVJlc3VsdD86IElCdWlsZFNlcGFyYXRlRW5naW5lUmVzdWx0O1xuXG4gICAgcHVibGljIGdldCBkZXN0KCkge1xuICAgICAgICAvLyBUT0RPIOWFvOWuuSBhZHNlbnNlIOaPkuS7tuS7juWklumDqOaPkuS7tui9rOS4uuWGhemDqOaPkuS7tu+8jOWFvOWuueiHsyAzLjlcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aHMuZGlyO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHRhc2s6IElCdWlsZGVyLCBwcmV2aWV3OiBib29sZWFuKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucmF3T3B0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGFzay5vcHRpb25zKSk7XG4gICAgICAgIC8vIOiZmuaLn+i3r+W+hFxuICAgICAgICBsZXQgZGVzdCA9IGpvaW4oYnVpbGRlckNvbmZpZy5wcm9qZWN0Um9vdCwgJ2J1aWxkJywgJ3ByZXZpZXcnKTtcbiAgICAgICAgaWYgKCFwcmV2aWV3KSB7XG4gICAgICAgICAgICBkZXN0ID0gZ2V0QnVpbGRQYXRoKHRhc2sub3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wYXRocyA9IG5ldyBQYXRocyhkZXN0LCB0YXNrLm9wdGlvbnMucGxhdGZvcm0pO1xuICAgICAgICB0aGlzLl9fdGFzayA9IHRhc2s7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBCdWlsZFJlc3VsdCBpbXBsZW1lbnRzIElCdWlsZFJlc3VsdCB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfX3Rhc2s6IElCdWlsZGVyO1xuXG4gICAgcHVibGljIHNldHRpbmdzPzogSVNldHRpbmdzO1xuICAgIHB1YmxpYyBkZXN0OiBzdHJpbmc7XG5cbiAgICBwdWJsaWMgZ2V0IHBhdGhzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3Rhc2sucmVzdWx0LnBhdGhzO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHRhc2s6IElCdWlsZGVyKSB7XG4gICAgICAgIHRoaXMuX190YXNrID0gdGFzaztcbiAgICAgICAgdGhpcy5kZXN0ID0gZ2V0QnVpbGRQYXRoKHRhc2sub3B0aW9ucyk7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSB0YXNrLnJlc3VsdC5zZXR0aW5ncztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmjIflrprnmoQgdXVpZCDotYTmupDmmK/lkKbljIXlkKvlnKjmnoTlu7rotYTmupDkuK1cbiAgICAgKi9cbiAgICBwdWJsaWMgY29udGFpbnNBc3NldCh1dWlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5fX3Rhc2suYnVuZGxlTWFuYWdlci5idW5kbGVzLmZpbmQoKGJ1bmRsZSkgPT4gYnVuZGxlLmNvbnRhaW5zQXNzZXQodXVpZCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluaMh+WumiB1dWlkIOWOn+Wni+i1hOa6kOeahOWtmOaUvui3r+W+hO+8iOS4jeWMheaLrOW6j+WIl+WMliBqc29u77yJXG4gICAgICog6Ieq5Yqo5Zu+6ZuG55qE5bCP5Zu+IHV1aWQg5ZKM6Ieq5Yqo5Zu+6ZuG55qEIHV1aWQg6YO95bCG5Lya5p+l6K+i5Yiw5ZCI5Zu+5aSn5Zu+55qE55Sf5oiQ6Lev5b6EXG4gICAgICog5a6e6ZmF6L+U5Zue5aSa5Liq6Lev5b6E55qE5oOF5Ya177ya5p+l6K+iIHV1aWQg5Li66Ieq5Yqo5Zu+6ZuG6LWE5rqQ77yM5LiU5a+55bqU5Zu+6ZuG55Sf5oiQ5aSa5byg5aSn5Zu+77yM57q555CG5Y6L57yp5Lya5pyJ5aSa5Liq5Zu+54mH5qC85byP6Lev5b6EXG4gICAgICovXG4gICAgcHVibGljIGdldFJhd0Fzc2V0UGF0aHModXVpZDogc3RyaW5nKTogSVJhd0Fzc2V0UGF0aEluZm9bXSB7XG4gICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGJ1aWxkQXNzZXRMaWJyYXJ5LmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJ1bmRsZXMgPSB0aGlzLl9fdGFzay5idW5kbGVNYW5hZ2VyLmJ1bmRsZXMuZmlsdGVyKChidW5kbGUpID0+IGJ1bmRsZS5jb250YWluc0Fzc2V0KHV1aWQsIHRydWUpKTtcbiAgICAgICAgaWYgKCFidW5kbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBidW5kbGVzLmZsYXRNYXAoKGJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzOiBJUmF3QXNzZXRQYXRoSW5mbyA9IHtcbiAgICAgICAgICAgICAgICBidW5kbGVOYW1lOiBidW5kbGUubmFtZSxcbiAgICAgICAgICAgICAgICByYXc6IFtdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChidW5kbGUuZ2V0UmVkaXJlY3QodXVpZCkpIHtcbiAgICAgICAgICAgICAgICByZXMucmVkaXJlY3QgPSBidW5kbGUuZ2V0UmVkaXJlY3QodXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcy5yYXcgPSBCdW5kbGVVdGlscy5nZXRSYXdBc3NldFBhdGhzKHV1aWQsIGJ1bmRsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXJlcy5yYXcubGVuZ3RoICYmICFyZXMucmVkaXJlY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmjIflrpogdXVpZCDotYTmupDnmoTot6/lvoTnm7jlhbPkv6Hmga9cbiAgICAgKiBAcmV0dXJuIEFycmF5PHtyYXc/OiBzdHJpbmcgfCBzdHJpbmdbXTsgaW1wb3J0Pzogc3RyaW5nOyBncm91cEluZGV4PzogbnVtYmVyO30+XG4gICAgICogQHJldHVybi5yYXc6IOivpei1hOa6kOa6kOaWh+S7tueahOWunumZheWtmOWCqOS9jee9ru+8jOWtmOWcqOWkmuS4quS4uuaVsOe7hO+8jOS4jeWtmOWcqOWImeS4uuepulxuICAgICAqIEByZXR1cm4uaW1wb3J0OiDor6XotYTmupDluo/liJfljJbmlbDmja7nmoTlrp7pmYXlrZjlgqjkvY3nva7vvIzkuI3lrZjlnKjkuLrnqbrvvIzlj6/og73mmK8gLmJpbiDmiJbogIUgLmpzb24g5qC85byPXG4gICAgICogQHJldHVybi5ncm91cEluZGV4OiDoi6Xor6XotYTmupDnmoTluo/liJfljJbmlbDmja7lnKjmn5DkuKrliIbnu4TlhoXvvIzov5nph4zmoIfor4blnKjliIbnu4TlhoXnmoQgaW5kZXjvvIzkuI3lrZjlnKjkuLrnqbpcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0QXNzZXRQYXRoSW5mbyh1dWlkOiBzdHJpbmcpOiBJQXNzZXRQYXRoSW5mb1tdIHtcbiAgICAgICAgY29uc3QgYnVuZGxlcyA9IHRoaXMuX190YXNrLmJ1bmRsZU1hbmFnZXIuYnVuZGxlcy5maWx0ZXIoKGJ1bmRsZSkgPT4gYnVuZGxlLmNvbnRhaW5zQXNzZXQodXVpZCwgdHJ1ZSkpO1xuICAgICAgICBpZiAoIWJ1bmRsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJ1bmRsZXMuZmxhdE1hcCgoYnVuZGxlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQ6IElBc3NldFBhdGhJbmZvID0ge1xuICAgICAgICAgICAgICAgIGJ1bmRsZU5hbWU6IGJ1bmRsZS5uYW1lLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChidW5kbGUuZ2V0UmVkaXJlY3QodXVpZCkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucmVkaXJlY3QgPSBidW5kbGUuZ2V0UmVkaXJlY3QodXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24ocmVzdWx0LCBCdW5kbGVVdGlscy5nZXRBc3NldFBhdGhJbmZvKHV1aWQsIGJ1bmRsZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFyZXN1bHQucmF3ICYmICFyZXN1bHQucmVkaXJlY3QgJiYgIXJlc3VsdC5pbXBvcnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBwbGVhc2UgdXNlIGdldEltcG9ydEFzc2V0UGF0aHMgaW5zdGVhZFxuICAgICAqIEBwYXJhbSB1dWlkIFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRKc29uUGF0aEluZm8odXVpZDogc3RyaW5nKTogSUltcG9ydEFzc2V0UGF0aEluZm9bXSB7XG4gICAgICAgIGNvbnNvbGUud2FybihpMThuLnQoJ2J1aWxkZXIud2Fybi5kZXByZWNhdGVkX3RpcCcsIHtcbiAgICAgICAgICAgIG9sZE5hbWU6ICdyZXN1bHQuZ2V0SnNvblBhdGhJbmZvJyxcbiAgICAgICAgICAgIG5ld05hbWU6ICdyZXN1bHQuZ2V0SW1wb3J0QXNzZXRQYXRocycsXG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SW1wb3J0QXNzZXRQYXRocyh1dWlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmjIflrpogdXVpZCDotYTmupDnmoTluo/liJfljJbkv6Hmga/lnKjmnoTlu7rlkI7nmoTkv6Hmga9cbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRJbXBvcnRBc3NldFBhdGhzKHV1aWQ6IHN0cmluZyk6IElJbXBvcnRBc3NldFBhdGhJbmZvW10ge1xuICAgICAgICBjb25zdCBidW5kbGVzID0gdGhpcy5fX3Rhc2suYnVuZGxlTWFuYWdlci5idW5kbGVzLmZpbHRlcigoYnVuZGxlKSA9PiBidW5kbGUuY29udGFpbnNBc3NldCh1dWlkKSk7XG4gICAgICAgIGlmICghYnVuZGxlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYnVuZGxlcy5mbGF0TWFwKChidW5kbGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogSUltcG9ydEFzc2V0UGF0aEluZm8gPSB7XG4gICAgICAgICAgICAgICAgYnVuZGxlTmFtZTogYnVuZGxlLm5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGJ1bmRsZS5nZXRSZWRpcmVjdCh1dWlkKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5yZWRpcmVjdCA9IGJ1bmRsZS5nZXRSZWRpcmVjdCh1dWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IEJ1bmRsZVV0aWxzLmdldEltcG9ydFBhdGhJbmZvKHV1aWQsIGJ1bmRsZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59Il19