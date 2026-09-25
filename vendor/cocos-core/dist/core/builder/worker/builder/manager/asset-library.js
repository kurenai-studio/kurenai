'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAssetLibrary = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const serialization_1 = require("cc/editor/serialization");
const cconb_utils_1 = require("./cconb-utils");
const cc_1 = require("cc");
const utils_1 = require("../utils");
const assert_1 = __importDefault(require("assert"));
const cconb_1 = require("../utils/cconb");
const asset_1 = __importDefault(require("../../../../assets/manager/asset"));
const asset_db_1 = __importDefault(require("../../../../assets/manager/asset-db"));
const i18n_1 = __importDefault(require("../../../../base/i18n"));
const bundle_1 = require("../utils/bundle");
const utils_2 = require("../asset-handler/bundle/utils");
// 版本号记录
const CACHE_VERSION = '1.0.1';
/**
 * 资源管理器，主要负责资源的缓存更新
 * TODO 需要迁移到 asset-db 里面
 */
class BuildAssetLibrary {
    // 资源索引缓存，只记录引用，不需要担心缓存数据内存，需要注意 reset 避免内存泄漏
    assetMap = {};
    get assets() {
        const assets = Object.values(this.assetMap);
        if (!assets.length) {
            this.queryAllAssets();
            return Object.values(this.assetMap);
        }
        return assets;
    }
    // 资源依赖关系缓存, { uuid: 此资源依赖的资源 uuid 数组}
    depend = {};
    // 资源的被依赖关系缓存，{ uuid: 依赖此资源的资源 uuid 数组}
    dependedMap = {};
    meta = {};
    // 是否使用缓存开关
    useCache = true;
    // 收集反序列化过程出现异常的资源 map （不缓存）
    hasMissingClassUuids = new Set();
    hasMissingAssetsUuids = new Set();
    // 存储 asset path 与 uuid 索引关系
    pathToUuid = {};
    // 默认的序列化选项
    defaultSerializedOptions = {
        compressUuid: true, // 是否是作为正式打包导出的序列化操作
        stringify: false, // 序列化出来的以 json 字符串形式还是 json 对象显示,这个要写死统一，否则对 json 做处理的时候都需要做类型判断
        dontStripDefault: false,
        useCCON: false,
        keepNodeUuid: false, // 序列化后是否保留节点组件的 uuid 数据
    };
    /**
     * 资源管理器初始化
     */
    async init() {
        this.queryAllAssets();
        // TODO 允许外部修改
        this.defaultSerializedOptions.keepNodeUuid = false;
        this.useCache = true;
        console.debug(`init custom config: keepNodeUuid: ${this.defaultSerializedOptions.keepNodeUuid}, useCache: ${this.useCache}`);
    }
    /**
     * 查询全部资源，包括子资源
     * @returns
     */
    queryAllAssets() {
        const assetMap = {};
        const assetDBMap = asset_db_1.default.assetDBMap;
        // 循环每一个已经启动的 database
        for (const name in assetDBMap) {
            const database = assetDBMap[name];
            for (const asset of database.uuid2asset.values()) {
                (0, utils_1.recursively)(asset, (asset) => {
                    assetMap[asset.uuid] = asset;
                });
            }
        }
        this.assetMap = assetMap;
        return this.assets;
    }
    /**
     * 获取资源的缓存目录
     * @param uuid
     */
    getAssetTempDirByUuid(uuid) {
        const asset = this.getAsset(uuid);
        return (0, path_1.join)(asset._assetDB.options.temp, uuid.substr(0, 2), uuid, 'build' + CACHE_VERSION);
    }
    /**
     * 删除一个资源的缓存
     * @param uuid
     */
    clearAsset(uuid) {
        // 移除缓存的序列化信息
        const cacheFile = this.getAssetTempDirByUuid(uuid);
        if (cacheFile && (0, fs_extra_1.existsSync)(cacheFile)) {
            (0, fs_extra_1.removeSync)(cacheFile);
        }
        delete this.depend[uuid];
        // 移除 depend 里面的引用的相关 uuid 数据
        Object.keys(this.depend).forEach((uuid) => {
            const uuids = this.depend[uuid];
            uuids.includes(uuid) && uuids.splice(0, uuids.indexOf(uuid));
        });
    }
    /**
     * 查询一个资源的 meta 数据
     * @param uuid
     */
    getMeta(uuid) {
        if (this.meta[uuid] !== undefined) {
            return this.meta[uuid];
        }
        return this.meta[uuid] = asset_1.default.queryAssetMeta(uuid);
    }
    addMeta(uuid, meta) {
        meta && (this.meta[uuid] = meta);
    }
    getAsset(uuid) {
        return this.assetMap[uuid] || asset_1.default.queryAsset(uuid);
    }
    queryAssetsByOptions(options) {
        return asset_1.default.queryAssets(options);
    }
    /**
     * 查询指定 Bundle 文件夹中实际会被打包的资源列表
     * @param uuid Bundle 文件夹的 uuid
     * @param bundleFilterConfig 可选的过滤配置，不传则使用 Bundle 自身的过滤配置
     * @returns 符合条件的资源 URL 列表
     */
    queryAssetsInBundle(uuid, bundleFilterConfig) {
        const bundleAsset = this.getAsset(uuid);
        if (!bundleAsset) {
            console.warn(`Can not find bundle asset(${uuid})`);
            return [];
        }
        bundleFilterConfig = bundleFilterConfig || bundleAsset.meta.userData.bundleFilterConfig;
        const allAssets = this.queryAssetsByOptions({ pattern: bundleAsset.url + '/**/*' });
        const allAssetInfos = [];
        for (const asset of allAssets) {
            (0, utils_1.recursively)(asset, (a) => {
                allAssetInfos.push(this.getAssetInfo(a.uuid));
            });
        }
        if (!bundleFilterConfig || !bundleFilterConfig.length) {
            return allAssetInfos.map((info) => info.url);
        }
        const configs = (0, utils_2.initBundleConfig)(bundleFilterConfig);
        return (0, bundle_1.filterAssetWithBundleConfig)(allAssetInfos, configs).map((info) => info.url);
    }
    async queryAssetUsers(uuid) {
        if (this.dependedMap[uuid]) {
            return this.dependedMap[uuid];
        }
        this.dependedMap[uuid] = await asset_1.default.queryAssetUsers(uuid) || [];
        return this.dependedMap[uuid];
    }
    /**
 * 获取一个资源的 asset info 数据
 * @param uuid
 */
    getAssetInfo(uuid, dataKeys = ['subAssets', 'mtime', 'meta', 'depends']) {
        return asset_1.default.queryAssetInfo(uuid, dataKeys);
    }
    /**
     * 查询一个资源依赖的其他资源的方法
     * @param uuid
     */
    async getDependUuids(uuid) {
        if (this.depend[uuid]) {
            return this.depend[uuid];
        }
        const asset = this.getAsset(uuid);
        if (!asset) {
            return [];
        }
        // cc.SceneAsset cc.Prefab 类型不可使用 db 缓存的依赖信息，因为存储了脚本信息，相关的更新机制目前有问题，获取的数据会有冗余
        if (!['cc.SceneAsset', 'cc.Prefab'].includes(asset_1.default.queryAssetProperty(asset, 'type'))) {
            this.depend[uuid] = await asset_1.default.queryAssetDependencies(uuid) || [];
            return this.depend[uuid];
        }
        await this.getRawInstance(asset);
        return this.depend[uuid] || [];
    }
    /**
     * 深度获取指定 uuid 资源的依赖资源 uuid 列表
     * @param uuid
     */
    async getDependUuidsDeep(uuid) {
        let result = [];
        let temp = [];
        const depends = await this.getDependUuids(uuid);
        if (!depends) {
            return [];
        }
        temp = [...depends];
        result = [...depends];
        do {
            const res = [];
            for (const subUuid of temp) {
                const depend = await this.getDependUuids(subUuid);
                res.push(...depend);
            }
            // 剔除已存在的资源避免循环依赖时的死循环
            temp = res.filter((uuid) => !result.includes(uuid));
            result.push(...temp);
        } while (temp.length > 0);
        return Array.from(new Set(result));
    }
    /**
     * 获取某个资源的反序列化对象
     * @param uuid
     */
    async getInstance(asset) {
        if (!asset) {
            return null;
        }
        const instanceResult = await this.getRawInstance(asset);
        return instanceResult.asset;
    }
    /**
     * 获取重新序列化后的即将输出的 JSON 数据
     * @param uuid
     * @param options
     * @returns
     */
    async getSerializedJSON(uuid, options) {
        const asset = this.getAsset(uuid);
        if (!asset || !asset.meta.files.includes('.json')) {
            return null;
        }
        // 构建缓存的文件夹
        const cacheFile = (0, path_1.join)(this.getAssetTempDirByUuid(uuid), `${options.debug ? 'debug' : 'release'}.json`);
        if (this.checkUseCache(asset) && (0, fs_extra_1.existsSync)(cacheFile)) {
            try {
                return await (0, fs_extra_1.readJSON)(cacheFile);
            }
            catch (error) {
                unExpectException(error);
            }
        }
        const result = await this.getRawInstance(asset);
        if (!result.asset) {
            console.error(i18n_1.default.t('builder.error.get_asset_json_failed', {
                url: asset.url,
                type: asset_1.default.queryAssetProperty(asset, 'type'),
            }));
            return null;
        }
        const jsonObject = this.serialize(result.asset, options);
        try {
            // 如果上一步读取缓存有失败，后续不再保存缓存
            if (this.checkCanSaveCache(asset.uuid)) {
                await (0, fs_extra_1.outputJSON)(cacheFile, jsonObject, {
                    spaces: 4,
                });
            }
        }
        catch (error) {
            unExpectException(error);
        }
        return jsonObject;
    }
    /**
     * 直接生成某个资源的构建后数据
     * @param uuid
     * @param debug
     */
    async outputAssets(uuid, dest, debug) {
        const cacheFile = (0, path_1.join)(this.getAssetTempDirByUuid(uuid), `${debug ? 'debug' : 'release'}.json`);
        try {
            if (this.checkCanSaveCache(uuid)) {
                await (0, fs_extra_1.copy)(cacheFile, dest);
                return;
            }
        }
        catch (error) {
            unExpectException(error);
        }
        const jsonObject = await this.getSerializedJSON(uuid, {
            debug,
        });
        if (!jsonObject) {
            return;
        }
        try {
            await (0, fs_extra_1.outputJSON)(cacheFile, jsonObject);
            await (0, fs_extra_1.copy)(cacheFile, dest);
        }
        catch (error) {
            unExpectException(error);
            await (0, fs_extra_1.outputJSON)(dest, jsonObject);
        }
    }
    async outputCCONAsset(uuid, dest, options) {
        const instanceRes = await this.getRawInstance(this.getAsset(uuid));
        if (!instanceRes || !instanceRes.asset) {
            console.error(`get instance (${uuid}) failed!`);
            return;
        }
        // 目前所有 CCON 资产在资产库里面的后缀都是 .bin
        // 后面如果调整了这里要对应调整。
        // 断言一下，确保没问题。
        const originalDest = dest;
        const originalExtname = (0, path_1.extname)(originalDest);
        (0, assert_1.default)(originalExtname === '.bin');
        const baseName = (0, path_1.basename)(originalDest, originalExtname);
        const fullBaseName = (0, path_1.join)((0, path_1.dirname)(originalDest), baseName);
        const ccon = exports.buildAssetLibrary.serialize(instanceRes.asset, {
            debug: options.debug,
            useCCONB: true,
            dontStripDefault: false,
            _exporting: true,
        });
        (0, assert_1.default)(ccon instanceof serialization_1.CCON);
        try {
            await (0, cconb_1.outputCCONFormat)(ccon, fullBaseName);
        }
        catch (error) {
            console.error(error);
            console.error(`outputCCONFormat with asset:(${uuid}) failed!`);
        }
    }
    /**
     * 获取某个资源的构建后序列化数据
     * @param uuid
     */
    serialize(instance, options) {
        if (!instance) {
            return null;
        }
        // 调用 effect 编译器来做 effect 多余数据剔除，不走数据缓存，每次重新剔除生成
        if (instance instanceof cc_1.EffectAsset) {
            const { stripEditorSupport } = require((0, path_1.join)(__dirname, '../../../../assets/effect-compiler/utils.js'));
            instance = stripEditorSupport(instance, options['cc.EffectAsset']);
        }
        // TODO: 引擎 https://github.com/cocos/cocos-engine/issues/14613 该 issue 正式修复关闭后，这段代码可以移除
        // HACK 剔除勾选了 light.staticSettings.editorOnly 的灯光组件
        if (instance instanceof cc_1.SceneAsset) {
            const nodes = instance.scene?.children || [];
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const comps = node.getComponentsInChildren(cc_1.LightComponent);
                comps.forEach((comp) => {
                    if (comp.staticSettings?.editorOnly) {
                        comp._destroyImmediate();
                    }
                });
            }
        }
        // 重新反序列化并保存
        return (options.useCCONB ? EditorExtends.serialize : EditorExtends.serializeCompiled)(instance, Object.assign(this.defaultSerializedOptions, {
            compressUuid: !options.debug,
            useCCON: options.useCCONB,
            noNativeDep: !instance._native, // 表明该资源是否存在原生依赖，这个字段在运行时会影响 preload 相关接口的表现
        }));
    }
    /**
     * 获取反序列化后的原始对象
     * @param uuid
     */
    async getRawInstance(asset) {
        const result = {
            asset: null,
            detail: null,
        };
        if (asset.invalid) {
            console.error(i18n_1.default.t('builder.error.asset_import_failed', {
                url: `{asset(${asset.url})}`,
                type: asset_1.default.queryAssetProperty(asset, 'type'),
            }));
            return result;
        }
        const jsonSrc = asset.meta.files.includes('.json') ? asset.library + '.json' : '';
        const cconbSrc = (0, cconb_1.getCCONFormatAssetInLibrary)(asset);
        if (!jsonSrc && !cconbSrc) {
            // TODO 由于目前无法确认，.json 不存在是由于资源本身如此还是因为导入器 bug，只能先 debug 打印
            console.debug(i18n_1.default.t('builder.warn.no_serialized_json', {
                url: `{asset(${asset.url})}`,
                type: asset_1.default.queryAssetProperty(asset, 'type'),
            }));
            return result;
        }
        const data = jsonSrc ? await (0, fs_extra_1.readJSON)(jsonSrc) : await (0, cconb_utils_1.transformCCON)(cconbSrc);
        return this.getRawInstanceFromData(data, asset);
    }
    getRawInstanceFromData(data, asset) {
        const result = {
            asset: null,
            detail: null,
        };
        const deserializeDetails = new cc.deserialize.Details();
        // detail 里面的数组分别一一对应，并且指向 asset 依赖资源的对象，不可随意更改 / 排序
        deserializeDetails.reset();
        const MissingClass = EditorExtends.MissingReporter.classInstance;
        MissingClass.hasMissingClass = false;
        const deserializedAsset = (0, cc_1.deserialize)(data, deserializeDetails, {
            createAssetRefs: true,
            ignoreEditorOnly: true,
            classFinder: MissingClass.classFinder,
        });
        if (!deserializedAsset) {
            console.error(i18n_1.default.t('builder.error.deserialize_failed', {
                url: `{asset(${asset.url})}`,
            }));
            return result;
        }
        // reportMissingClass 会根据 _uuid 来做判断，需要在调用 reportMissingClass 之前赋值
        deserializedAsset._uuid = asset.uuid;
        if (MissingClass.hasMissingClass && !this.hasMissingClassUuids.has(asset.uuid)) {
            MissingClass.reportMissingClass(deserializedAsset);
            this.hasMissingClassUuids.add(asset.uuid);
        }
        // 清空缓存，防止内存泄漏
        MissingClass.reset();
        // 预览时只需找出依赖的资源，无需缓存 asset
        // 检查以及查找对应资源，并返回给对应 asset 数据
        // const missingAssets: string[] = [];
        // 根据这个方法分配假的资源对象, 确保序列化时资源能被重新序列化成 uuid
        const test = this;
        let missingAssetReporter = null;
        deserializeDetails.assignAssetsBy(function (uuid, options) {
            const asset = test.getAsset(uuid);
            if (asset) {
                return EditorExtends.serialize.asAsset(uuid);
            }
            else {
                // if (!missingAssets.includes(uuid)) {
                //     missingAssets.push(uuid);
                test.hasMissingAssetsUuids.add(uuid);
                if (options && options.owner) {
                    missingAssetReporter = missingAssetReporter || new EditorExtends.MissingReporter.object(deserializedAsset);
                    missingAssetReporter.outputLevel = 'warn';
                    missingAssetReporter.stashByOwner(options.owner, options.prop, EditorExtends.serialize.asAsset(uuid, options.type));
                }
                // }
                // remove deleted asset reference
                return null;
            }
        });
        if (missingAssetReporter) {
            missingAssetReporter.reportByOwner();
        }
        // if (missingAssets.length > 0) {
        //     console.warn(
        //         i18n.t('builder.error.required_asset_missing', {
        //             url: `{asset(${asset.url})}`,
        //             uuid: missingAssets.join('\n '),
        //         }),
        //     );
        // }
        // https://github.com/cocos-creator/3d-tasks/issues/6042 处理 prefab 与 scene 名称同步问题
        if (['cc.SceneAsset', 'cc.Prefab'].includes(asset_1.default.queryAssetProperty(asset, 'type'))) {
            deserializedAsset.name = (0, path_1.basename)(asset.source, (0, path_1.extname)(asset.source));
        }
        result.asset = deserializedAsset;
        result.detail = deserializeDetails;
        this.depend[asset.uuid] = [...new Set(deserializeDetails.uuidList)];
        return result;
    }
    /**
     * 重置
     */
    reset() {
        this.assetMap = {};
        this.meta = {};
        this.depend = {};
        this.dependedMap = {};
        this.hasMissingClassUuids.clear();
        this.hasMissingAssetsUuids.clear();
    }
    checkUseCache(asset) {
        // 场景、prefab 资源的缓存，在发生脚本变化后就需要失效, effect 目前有构建剔除机制暂时不缓存结果
        if (!this.useCache || (['cc.SceneAsset', 'cc.Prefab', 'cc.EffectAsset'].includes(asset_1.default.queryAssetProperty(asset, 'type')))) {
            return false;
        }
        return true;
    }
    checkCanSaveCache(uuid) {
        // 场景、prefab 资源的缓存，在发生脚本变化后就需要失效
        if (this.hasMissingClassUuids.has(uuid) || this.hasMissingClassUuids.has(uuid)) {
            return false;
        }
        return true;
    }
    getAssetProperty = asset_1.default.queryAssetProperty;
    url2uuid = asset_1.default.url2uuid;
}
exports.buildAssetLibrary = new BuildAssetLibrary();
function unExpectException(error) {
    console.debug(error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtbGlicmFyeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2J1aWxkZXIvd29ya2VyL2J1aWxkZXIvbWFuYWdlci9hc3NldC1saWJyYXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsdUNBQThFO0FBQzlFLCtCQUF3RDtBQUN4RCwyREFBK0M7QUFDL0MsK0NBQThDO0FBQzlDLDJCQUFrRztBQUNsRyxvQ0FBdUM7QUFDdkMsb0RBQTRCO0FBQzVCLDBDQUErRTtBQUcvRSw2RUFBNEQ7QUFFNUQsbUZBQWlFO0FBQ2pFLGlFQUF5QztBQUN6Qyw0Q0FBOEQ7QUFDOUQseURBQWlFO0FBRWpFLFFBQVE7QUFDUixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUM7QUFFOUI7OztHQUdHO0FBQ0gsTUFBTSxpQkFBaUI7SUFDbkIsNkNBQTZDO0lBQ3JDLFFBQVEsR0FBMkIsRUFBRSxDQUFDO0lBRTlDLElBQVcsTUFBTTtRQUNiLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxzQ0FBc0M7SUFDOUIsTUFBTSxHQUFtQixFQUFFLENBQUM7SUFDcEMsdUNBQXVDO0lBQy9CLFdBQVcsR0FBbUIsRUFBRSxDQUFDO0lBRWpDLElBQUksR0FBYSxFQUFFLENBQUM7SUFFNUIsV0FBVztJQUNKLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFFdkIsNEJBQTRCO0lBQ3BCLG9CQUFvQixHQUFHLElBQUksR0FBRyxF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S0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU8saUJBQWlCLENBQUMsSUFBWTtRQUNsQyxnQ0FBZ0M7UUFDaEMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUM3RSxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLGdCQUFnQixHQUFHLGVBQVksQ0FBQyxrQkFBa0IsQ0FBQztJQUNuRCxRQUFRLEdBQUcsZUFBWSxDQUFDLFFBQVEsQ0FBQztDQUMzQztBQUNZLFFBQUEsaUJBQWlCLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO0FBRXpELFNBQVMsaUJBQWlCLENBQUMsS0FBVTtJQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IHJlYWRKU09OLCBleGlzdHNTeW5jLCBvdXRwdXRKU09OLCByZW1vdmVTeW5jLCBjb3B5IH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIGV4dG5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IENDT04gfSBmcm9tICdjYy9lZGl0b3Ivc2VyaWFsaXphdGlvbic7XG5pbXBvcnQgeyB0cmFuc2Zvcm1DQ09OIH0gZnJvbSAnLi9jY29uYi11dGlscyc7XG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgRWZmZWN0QXNzZXQsIEFzc2V0IGFzIENDQXNzZXQsIFNjZW5lQXNzZXQsIExpZ2h0Q29tcG9uZW50LCBOb2RlIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgcmVjdXJzaXZlbHkgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgeyBnZXRDQ09ORm9ybWF0QXNzZXRJbkxpYnJhcnksIG91dHB1dENDT05Gb3JtYXQgfSBmcm9tICcuLi91dGlscy9jY29uYic7XG5pbXBvcnQgeyBJQXNzZXRJbmZvLCBJTWV0YU1hcCwgSVNlcmlhbGl6ZWRPcHRpb25zLCBJVXVpZERlcGVuZE1hcCwgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IEJ1bmRsZUZpbHRlckNvbmZpZyB9IGZyb20gJy4uLy4uLy4uL0B0eXBlcyc7XG5pbXBvcnQgYXNzZXRNYW5hZ2VyIGZyb20gJy4uLy4uLy4uLy4uL2Fzc2V0cy9tYW5hZ2VyL2Fzc2V0JztcbmltcG9ydCB7IElBc3NldCwgUXVlcnlBc3NldHNPcHRpb24sIElBc3NldEluZm8gYXMgSUFzc2V0SW5mb0Zyb21EQiB9IGZyb20gJy4uLy4uLy4uLy4uL2Fzc2V0cy9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBhc3NldERCTWFuYWdlciBmcm9tICcuLi8uLi8uLi8uLi9hc3NldHMvbWFuYWdlci9hc3NldC1kYic7XG5pbXBvcnQgaTE4biBmcm9tICcuLi8uLi8uLi8uLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgZmlsdGVyQXNzZXRXaXRoQnVuZGxlQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMvYnVuZGxlJztcbmltcG9ydCB7IGluaXRCdW5kbGVDb25maWcgfSBmcm9tICcuLi9hc3NldC1oYW5kbGVyL2J1bmRsZS91dGlscyc7XG5cbi8vIOeJiOacrOWPt+iusOW9lVxuY29uc3QgQ0FDSEVfVkVSU0lPTiA9ICcxLjAuMSc7XG5cbi8qKlxuICog6LWE5rqQ566h55CG5Zmo77yM5Li76KaB6LSf6LSj6LWE5rqQ55qE57yT5a2Y5pu05pawXG4gKiBUT0RPIOmcgOimgei/geenu+WIsCBhc3NldC1kYiDph4zpnaJcbiAqL1xuY2xhc3MgQnVpbGRBc3NldExpYnJhcnkge1xuICAgIC8vIOi1hOa6kOe0ouW8lee8k+WtmO+8jOWPquiusOW9leW8leeUqO+8jOS4jemcgOimgeaLheW/g+e8k+WtmOaVsOaNruWGheWtmO+8jOmcgOimgeazqOaEjyByZXNldCDpgb/lhY3lhoXlrZjms4TmvI9cbiAgICBwcml2YXRlIGFzc2V0TWFwOiBSZWNvcmQ8c3RyaW5nLCBJQXNzZXQ+ID0ge307XG5cbiAgICBwdWJsaWMgZ2V0IGFzc2V0cygpIHtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gT2JqZWN0LnZhbHVlcyh0aGlzLmFzc2V0TWFwKTtcbiAgICAgICAgaWYgKCFhc3NldHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5QWxsQXNzZXRzKCk7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyh0aGlzLmFzc2V0TWFwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXNzZXRzO1xuICAgIH1cblxuICAgIC8vIOi1hOa6kOS+nei1luWFs+ezu+e8k+WtmCwgeyB1dWlkOiDmraTotYTmupDkvp3otZbnmoTotYTmupAgdXVpZCDmlbDnu4R9XG4gICAgcHJpdmF0ZSBkZXBlbmQ6IElVdWlkRGVwZW5kTWFwID0ge307XG4gICAgLy8g6LWE5rqQ55qE6KKr5L6d6LWW5YWz57O757yT5a2Y77yMeyB1dWlkOiDkvp3otZbmraTotYTmupDnmoTotYTmupAgdXVpZCDmlbDnu4R9XG4gICAgcHJpdmF0ZSBkZXBlbmRlZE1hcDogSVV1aWREZXBlbmRNYXAgPSB7fTtcblxuICAgIHByaXZhdGUgbWV0YTogSU1ldGFNYXAgPSB7fTtcblxuICAgIC8vIOaYr+WQpuS9v+eUqOe8k+WtmOW8gOWFs1xuICAgIHB1YmxpYyB1c2VDYWNoZSA9IHRydWU7XG5cbiAgICAvLyDmlLbpm4blj43luo/liJfljJbov4fnqIvlh7rnjrDlvILluLjnmoTotYTmupAgbWFwIO+8iOS4jee8k+WtmO+8iVxuICAgIHByaXZhdGUgaGFzTWlzc2luZ0NsYXNzVXVpZHMgPSBuZXcgU2V0KCk7XG4gICAgcHJpdmF0ZSBoYXNNaXNzaW5nQXNzZXRzVXVpZHMgPSBuZXcgU2V0KCk7XG4gICAgLy8g5a2Y5YKoIGFzc2V0IHBhdGgg5LiOIHV1aWQg57Si5byV5YWz57O7XG4gICAgcHVibGljIHBhdGhUb1V1aWQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICAgIC8vIOm7mOiupOeahOW6j+WIl+WMlumAiemhuVxuICAgIHByaXZhdGUgZGVmYXVsdFNlcmlhbGl6ZWRPcHRpb25zID0ge1xuICAgICAgICBjb21wcmVzc1V1aWQ6IHRydWUsIC8vIOaYr+WQpuaYr+S9nOS4uuato+W8j+aJk+WMheWvvOWHuueahOW6j+WIl+WMluaTjeS9nFxuICAgICAgICBzdHJpbmdpZnk6IGZhbHNlLCAvLyDluo/liJfljJblh7rmnaXnmoTku6UganNvbiDlrZfnrKbkuLLlvaLlvI/ov5jmmK8ganNvbiDlr7nosaHmmL7npLos6L+Z5Liq6KaB5YaZ5q2757uf5LiA77yM5ZCm5YiZ5a+5IGpzb24g5YGa5aSE55CG55qE5pe25YCZ6YO96ZyA6KaB5YGa57G75Z6L5Yik5patXG4gICAgICAgIGRvbnRTdHJpcERlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB1c2VDQ09OOiBmYWxzZSxcbiAgICAgICAga2VlcE5vZGVVdWlkOiBmYWxzZSwgLy8g5bqP5YiX5YyW5ZCO5piv5ZCm5L+d55WZ6IqC54K557uE5Lu255qEIHV1aWQg5pWw5o2uXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOi1hOa6kOeuoeeQhuWZqOWIneWni+WMllxuICAgICAqL1xuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIHRoaXMucXVlcnlBbGxBc3NldHMoKTtcbiAgICAgICAgLy8gVE9ETyDlhYHorrjlpJbpg6jkv67mlLlcbiAgICAgICAgdGhpcy5kZWZhdWx0U2VyaWFsaXplZE9wdGlvbnMua2VlcE5vZGVVdWlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudXNlQ2FjaGUgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBpbml0IGN1c3RvbSBjb25maWc6IGtlZXBOb2RlVXVpZDogJHt0aGlzLmRlZmF1bHRTZXJpYWxpemVkT3B0aW9ucy5rZWVwTm9kZVV1aWR9LCB1c2VDYWNoZTogJHt0aGlzLnVzZUNhY2hlfWApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouWFqOmDqOi1hOa6kO+8jOWMheaLrOWtkOi1hOa6kFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHF1ZXJ5QWxsQXNzZXRzKCkge1xuICAgICAgICBjb25zdCBhc3NldE1hcDogUmVjb3JkPHN0cmluZywgSUFzc2V0PiA9IHt9O1xuICAgICAgICBjb25zdCBhc3NldERCTWFwID0gYXNzZXREQk1hbmFnZXIuYXNzZXREQk1hcDtcbiAgICAgICAgLy8g5b6q546v5q+P5LiA5Liq5bey57uP5ZCv5Yqo55qEIGRhdGFiYXNlXG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBhc3NldERCTWFwKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhYmFzZSA9IGFzc2V0REJNYXBbbmFtZV07XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGFzc2V0IG9mIGRhdGFiYXNlLnV1aWQyYXNzZXQudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICByZWN1cnNpdmVseShhc3NldCwgKGFzc2V0OiBJQXNzZXQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRNYXBbYXNzZXQudXVpZF0gPSBhc3NldDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFzc2V0TWFwID0gYXNzZXRNYXA7XG4gICAgICAgIHJldHVybiB0aGlzLmFzc2V0cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5botYTmupDnmoTnvJPlrZjnm67lvZVcbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRBc3NldFRlbXBEaXJCeVV1aWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgcmV0dXJuIGpvaW4oYXNzZXQuX2Fzc2V0REIub3B0aW9ucy50ZW1wLCB1dWlkLnN1YnN0cigwLCAyKSwgdXVpZCwgJ2J1aWxkJyArIENBQ0hFX1ZFUlNJT04pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIoOmZpOS4gOS4qui1hOa6kOeahOe8k+WtmFxuICAgICAqIEBwYXJhbSB1dWlkXG4gICAgICovXG4gICAgcHVibGljIGNsZWFyQXNzZXQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIC8vIOenu+mZpOe8k+WtmOeahOW6j+WIl+WMluS/oeaBr1xuICAgICAgICBjb25zdCBjYWNoZUZpbGUgPSB0aGlzLmdldEFzc2V0VGVtcERpckJ5VXVpZCh1dWlkKTtcbiAgICAgICAgaWYgKGNhY2hlRmlsZSAmJiBleGlzdHNTeW5jKGNhY2hlRmlsZSkpIHtcbiAgICAgICAgICAgIHJlbW92ZVN5bmMoY2FjaGVGaWxlKTtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgdGhpcy5kZXBlbmRbdXVpZF07XG4gICAgICAgIC8vIOenu+mZpCBkZXBlbmQg6YeM6Z2i55qE5byV55So55qE55u45YWzIHV1aWQg5pWw5o2uXG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuZGVwZW5kKS5mb3JFYWNoKCh1dWlkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1dWlkcyA9IHRoaXMuZGVwZW5kW3V1aWRdO1xuICAgICAgICAgICAgdXVpZHMuaW5jbHVkZXModXVpZCkgJiYgdXVpZHMuc3BsaWNlKDAsIHV1aWRzLmluZGV4T2YodXVpZCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LkuIDkuKrotYTmupDnmoQgbWV0YSDmlbDmja5cbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRNZXRhKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5tZXRhW3V1aWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1ldGFbdXVpZF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5tZXRhW3V1aWRdID0gYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRNZXRhKHV1aWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRNZXRhKHV1aWQ6IHN0cmluZywgbWV0YTogYW55KSB7XG4gICAgICAgIG1ldGEgJiYgKHRoaXMubWV0YVt1dWlkXSA9IG1ldGEpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBc3NldCh1dWlkOiBzdHJpbmcpOiBJQXNzZXQge1xuICAgICAgICByZXR1cm4gdGhpcy5hc3NldE1hcFt1dWlkXSB8fCBhc3NldE1hbmFnZXIucXVlcnlBc3NldCh1dWlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnlBc3NldHNCeU9wdGlvbnMob3B0aW9uczogUXVlcnlBc3NldHNPcHRpb24pOiBJQXNzZXRbXSB7XG4gICAgICAgIHJldHVybiBhc3NldE1hbmFnZXIucXVlcnlBc3NldHMob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+i5oyH5a6aIEJ1bmRsZSDmlofku7blpLnkuK3lrp7pmYXkvJrooqvmiZPljIXnmoTotYTmupDliJfooahcbiAgICAgKiBAcGFyYW0gdXVpZCBCdW5kbGUg5paH5Lu25aS555qEIHV1aWRcbiAgICAgKiBAcGFyYW0gYnVuZGxlRmlsdGVyQ29uZmlnIOWPr+mAieeahOi/h+a7pOmFjee9ru+8jOS4jeS8oOWImeS9v+eUqCBCdW5kbGUg6Ieq6Lqr55qE6L+H5ruk6YWN572uXG4gICAgICogQHJldHVybnMg56ym5ZCI5p2h5Lu255qE6LWE5rqQIFVSTCDliJfooahcbiAgICAgKi9cbiAgICBwdWJsaWMgcXVlcnlBc3NldHNJbkJ1bmRsZSh1dWlkOiBzdHJpbmcsIGJ1bmRsZUZpbHRlckNvbmZpZz86IEJ1bmRsZUZpbHRlckNvbmZpZ1tdKTogc3RyaW5nW10ge1xuICAgICAgICBjb25zdCBidW5kbGVBc3NldCA9IHRoaXMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgIGlmICghYnVuZGxlQXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ2FuIG5vdCBmaW5kIGJ1bmRsZSBhc3NldCgke3V1aWR9KWApO1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIGJ1bmRsZUZpbHRlckNvbmZpZyA9IGJ1bmRsZUZpbHRlckNvbmZpZyB8fCBidW5kbGVBc3NldC5tZXRhLnVzZXJEYXRhLmJ1bmRsZUZpbHRlckNvbmZpZztcbiAgICAgICAgY29uc3QgYWxsQXNzZXRzID0gdGhpcy5xdWVyeUFzc2V0c0J5T3B0aW9ucyh7IHBhdHRlcm46IGJ1bmRsZUFzc2V0LnVybCArICcvKiovKicgfSk7XG4gICAgICAgIGNvbnN0IGFsbEFzc2V0SW5mb3M6IElBc3NldEluZm9Gcm9tREJbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGFzc2V0IG9mIGFsbEFzc2V0cykge1xuICAgICAgICAgICAgcmVjdXJzaXZlbHkoYXNzZXQsIChhOiBJQXNzZXQpID0+IHtcbiAgICAgICAgICAgICAgICBhbGxBc3NldEluZm9zLnB1c2godGhpcy5nZXRBc3NldEluZm8oYS51dWlkKSBhcyB1bmtub3duIGFzIElBc3NldEluZm9Gcm9tREIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFidW5kbGVGaWx0ZXJDb25maWcgfHwgIWJ1bmRsZUZpbHRlckNvbmZpZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbGxBc3NldEluZm9zLm1hcCgoaW5mbykgPT4gaW5mby51cmwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmZpZ3MgPSBpbml0QnVuZGxlQ29uZmlnKGJ1bmRsZUZpbHRlckNvbmZpZyk7XG4gICAgICAgIHJldHVybiBmaWx0ZXJBc3NldFdpdGhCdW5kbGVDb25maWcoYWxsQXNzZXRJbmZvcywgY29uZmlncykubWFwKChpbmZvKSA9PiBpbmZvLnVybCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHF1ZXJ5QXNzZXRVc2Vycyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIGlmICh0aGlzLmRlcGVuZGVkTWFwW3V1aWRdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXBlbmRlZE1hcFt1dWlkXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRlcGVuZGVkTWFwW3V1aWRdID0gYXdhaXQgYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRVc2Vycyh1dWlkKSB8fCBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVwZW5kZWRNYXBbdXVpZF07XG4gICAgfVxuXG4gICAgLyoqXG4gKiDojrflj5bkuIDkuKrotYTmupDnmoQgYXNzZXQgaW5mbyDmlbDmja5cbiAqIEBwYXJhbSB1dWlkXG4gKi9cbiAgICBwdWJsaWMgZ2V0QXNzZXRJbmZvKHV1aWQ6IHN0cmluZywgZGF0YUtleXM6IChrZXlvZiBJQXNzZXRJbmZvRnJvbURCKVtdID0gWydzdWJBc3NldHMnLCAnbXRpbWUnLCAnbWV0YScsICdkZXBlbmRzJ10pIHtcbiAgICAgICAgcmV0dXJuIGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1dWlkLCBkYXRhS2V5cykgYXMgdW5rbm93biBhcyBJQXNzZXRJbmZvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouS4gOS4qui1hOa6kOS+nei1lueahOWFtuS7lui1hOa6kOeahOaWueazlVxuICAgICAqIEBwYXJhbSB1dWlkXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGdldERlcGVuZFV1aWRzKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVwZW5kW3V1aWRdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXBlbmRbdXVpZF07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXNzZXQgPSB0aGlzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgLy8gY2MuU2NlbmVBc3NldCBjYy5QcmVmYWIg57G75Z6L5LiN5Y+v5L2/55SoIGRiIOe8k+WtmOeahOS+nei1luS/oeaBr++8jOWboOS4uuWtmOWCqOS6huiEmuacrOS/oeaBr++8jOebuOWFs+eahOabtOaWsOacuuWItuebruWJjeaciemXrumimO+8jOiOt+WPlueahOaVsOaNruS8muacieWGl+S9mVxuICAgICAgICBpZiAoIVsnY2MuU2NlbmVBc3NldCcsICdjYy5QcmVmYWInXS5pbmNsdWRlcyhhc3NldE1hbmFnZXIucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAndHlwZScpKSkge1xuICAgICAgICAgICAgdGhpcy5kZXBlbmRbdXVpZF0gPSBhd2FpdCBhc3NldE1hbmFnZXIucXVlcnlBc3NldERlcGVuZGVuY2llcyh1dWlkKSB8fCBbXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlcGVuZFt1dWlkXTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmdldFJhd0luc3RhbmNlKGFzc2V0KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5kZXBlbmRbdXVpZF0gfHwgW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5rex5bqm6I635Y+W5oyH5a6aIHV1aWQg6LWE5rqQ55qE5L6d6LWW6LWE5rqQIHV1aWQg5YiX6KGoXG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgZ2V0RGVwZW5kVXVpZHNEZWVwKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgbGV0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgbGV0IHRlbXA6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGRlcGVuZHMgPSBhd2FpdCB0aGlzLmdldERlcGVuZFV1aWRzKHV1aWQpO1xuICAgICAgICBpZiAoIWRlcGVuZHMpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wID0gWy4uLmRlcGVuZHNdO1xuICAgICAgICByZXN1bHQgPSBbLi4uZGVwZW5kc107XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBzdWJVdWlkIG9mIHRlbXApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZXBlbmQgPSBhd2FpdCB0aGlzLmdldERlcGVuZFV1aWRzKHN1YlV1aWQpO1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKC4uLmRlcGVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDliZTpmaTlt7LlrZjlnKjnmoTotYTmupDpgb/lhY3lvqrnjq/kvp3otZbml7bnmoTmrbvlvqrnjq9cbiAgICAgICAgICAgIHRlbXAgPSByZXMuZmlsdGVyKCh1dWlkKSA9PiAhcmVzdWx0LmluY2x1ZGVzKHV1aWQpKTtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKC4uLnRlbXApO1xuICAgICAgICB9IHdoaWxlICh0ZW1wLmxlbmd0aCA+IDApO1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KHJlc3VsdCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluafkOS4qui1hOa6kOeahOWPjeW6j+WIl+WMluWvueixoVxuICAgICAqIEBwYXJhbSB1dWlkXG4gICAgICovXG4gICAgYXN5bmMgZ2V0SW5zdGFuY2UoYXNzZXQ6IElBc3NldCkge1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnN0YW5jZVJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0UmF3SW5zdGFuY2UoYXNzZXQpO1xuICAgICAgICByZXR1cm4gaW5zdGFuY2VSZXN1bHQuYXNzZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W6YeN5paw5bqP5YiX5YyW5ZCO55qE5Y2z5bCG6L6T5Ye655qEIEpTT04g5pWw5o2uXG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGdldFNlcmlhbGl6ZWRKU09OKHV1aWQ6IHN0cmluZywgb3B0aW9uczogSVNlcmlhbGl6ZWRPcHRpb25zKTogUHJvbWlzZTxhbnkgfCBudWxsPiB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgaWYgKCFhc3NldCB8fCAhYXNzZXQubWV0YS5maWxlcy5pbmNsdWRlcygnLmpzb24nKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5p6E5bu657yT5a2Y55qE5paH5Lu25aS5XG4gICAgICAgIGNvbnN0IGNhY2hlRmlsZSA9IGpvaW4odGhpcy5nZXRBc3NldFRlbXBEaXJCeVV1aWQodXVpZCkhLCBgJHtvcHRpb25zLmRlYnVnID8gJ2RlYnVnJyA6ICdyZWxlYXNlJ30uanNvbmApO1xuICAgICAgICBpZiAodGhpcy5jaGVja1VzZUNhY2hlKGFzc2V0KSAmJiBleGlzdHNTeW5jKGNhY2hlRmlsZSkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHJlYWRKU09OKGNhY2hlRmlsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHVuRXhwZWN0RXhjZXB0aW9uKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgdGhpcy5nZXRSYXdJbnN0YW5jZShhc3NldCk7XG4gICAgICAgIGlmICghcmVzdWx0LmFzc2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGkxOG4udCgnYnVpbGRlci5lcnJvci5nZXRfYXNzZXRfanNvbl9mYWlsZWQnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgdHlwZTogYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ3R5cGUnKSxcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QganNvbk9iamVjdCA9IHRoaXMuc2VyaWFsaXplKHJlc3VsdC5hc3NldCwgb3B0aW9ucyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzkuIrkuIDmraXor7vlj5bnvJPlrZjmnInlpLHotKXvvIzlkI7nu63kuI3lho3kv53lrZjnvJPlrZhcbiAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrQ2FuU2F2ZUNhY2hlKGFzc2V0LnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgb3V0cHV0SlNPTihjYWNoZUZpbGUsIGpzb25PYmplY3QsIHtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VzOiA0LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdW5FeHBlY3RFeGNlcHRpb24oZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBqc29uT2JqZWN0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOebtOaOpeeUn+aIkOafkOS4qui1hOa6kOeahOaehOW7uuWQjuaVsOaNrlxuICAgICAqIEBwYXJhbSB1dWlkXG4gICAgICogQHBhcmFtIGRlYnVnXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG91dHB1dEFzc2V0cyh1dWlkOiBzdHJpbmcsIGRlc3Q6IHN0cmluZywgZGVidWc6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3QgY2FjaGVGaWxlID0gam9pbih0aGlzLmdldEFzc2V0VGVtcERpckJ5VXVpZCh1dWlkKSEsIGAke2RlYnVnID8gJ2RlYnVnJyA6ICdyZWxlYXNlJ30uanNvbmApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2hlY2tDYW5TYXZlQ2FjaGUodXVpZCkpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb3B5KGNhY2hlRmlsZSwgZGVzdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdW5FeHBlY3RFeGNlcHRpb24oZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpzb25PYmplY3QgPSBhd2FpdCB0aGlzLmdldFNlcmlhbGl6ZWRKU09OKHV1aWQsIHtcbiAgICAgICAgICAgIGRlYnVnLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFqc29uT2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IG91dHB1dEpTT04oY2FjaGVGaWxlLCBqc29uT2JqZWN0KTtcbiAgICAgICAgICAgIGF3YWl0IGNvcHkoY2FjaGVGaWxlLCBkZXN0KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHVuRXhwZWN0RXhjZXB0aW9uKGVycm9yKTtcbiAgICAgICAgICAgIGF3YWl0IG91dHB1dEpTT04oZGVzdCwganNvbk9iamVjdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgb3V0cHV0Q0NPTkFzc2V0KFxuICAgICAgICB1dWlkOiBzdHJpbmcsXG4gICAgICAgIGRlc3Q6IHN0cmluZyxcbiAgICAgICAgb3B0aW9uczogSVNlcmlhbGl6ZWRPcHRpb25zLFxuICAgICkge1xuICAgICAgICBjb25zdCBpbnN0YW5jZVJlcyA9IGF3YWl0IHRoaXMuZ2V0UmF3SW5zdGFuY2UodGhpcy5nZXRBc3NldCh1dWlkKSk7XG4gICAgICAgIGlmICghaW5zdGFuY2VSZXMgfHwgIWluc3RhbmNlUmVzLmFzc2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBnZXQgaW5zdGFuY2UgKCR7dXVpZH0pIGZhaWxlZCFgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOebruWJjeaJgOaciSBDQ09OIOi1hOS6p+WcqOi1hOS6p+W6k+mHjOmdoueahOWQjue8gOmDveaYryAuYmluXG4gICAgICAgIC8vIOWQjumdouWmguaenOiwg+aVtOS6hui/memHjOimgeWvueW6lOiwg+aVtOOAglxuICAgICAgICAvLyDmlq3oqIDkuIDkuIvvvIznoa7kv53msqHpl67popjjgIJcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxEZXN0ID0gZGVzdDtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxFeHRuYW1lID0gZXh0bmFtZShvcmlnaW5hbERlc3QpO1xuICAgICAgICBhc3NlcnQob3JpZ2luYWxFeHRuYW1lID09PSAnLmJpbicpO1xuICAgICAgICBjb25zdCBiYXNlTmFtZSA9IGJhc2VuYW1lKG9yaWdpbmFsRGVzdCwgb3JpZ2luYWxFeHRuYW1lKTtcbiAgICAgICAgY29uc3QgZnVsbEJhc2VOYW1lID0gam9pbihkaXJuYW1lKG9yaWdpbmFsRGVzdCksIGJhc2VOYW1lKTtcblxuICAgICAgICBjb25zdCBjY29uOiBDQ09OID0gYnVpbGRBc3NldExpYnJhcnkuc2VyaWFsaXplKGluc3RhbmNlUmVzLmFzc2V0LCB7XG4gICAgICAgICAgICBkZWJ1Zzogb3B0aW9ucy5kZWJ1ZyxcbiAgICAgICAgICAgIHVzZUNDT05COiB0cnVlLFxuICAgICAgICAgICAgZG9udFN0cmlwRGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICBfZXhwb3J0aW5nOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgYXNzZXJ0KGNjb24gaW5zdGFuY2VvZiBDQ09OKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IG91dHB1dENDT05Gb3JtYXQoY2NvbiwgZnVsbEJhc2VOYW1lKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgb3V0cHV0Q0NPTkZvcm1hdCB3aXRoIGFzc2V0Oigke3V1aWR9KSBmYWlsZWQhYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmn5DkuKrotYTmupDnmoTmnoTlu7rlkI7luo/liJfljJbmlbDmja5cbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBzZXJpYWxpemUoaW5zdGFuY2U6IGFueSwgb3B0aW9uczogSVNlcmlhbGl6ZWRPcHRpb25zKSB7XG4gICAgICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6LCD55SoIGVmZmVjdCDnvJbor5HlmajmnaXlgZogZWZmZWN0IOWkmuS9meaVsOaNruWJlOmZpO+8jOS4jei1sOaVsOaNrue8k+WtmO+8jOavj+asoemHjeaWsOWJlOmZpOeUn+aIkFxuICAgICAgICBpZiAoaW5zdGFuY2UgaW5zdGFuY2VvZiBFZmZlY3RBc3NldCkge1xuICAgICAgICAgICAgY29uc3QgeyBzdHJpcEVkaXRvclN1cHBvcnQgfSA9IHJlcXVpcmUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi8uLi9hc3NldHMvZWZmZWN0LWNvbXBpbGVyL3V0aWxzLmpzJykpO1xuICAgICAgICAgICAgaW5zdGFuY2UgPSBzdHJpcEVkaXRvclN1cHBvcnQoaW5zdGFuY2UsIG9wdGlvbnNbJ2NjLkVmZmVjdEFzc2V0J10pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzog5byV5pOOIGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy9jb2Nvcy1lbmdpbmUvaXNzdWVzLzE0NjEzIOivpSBpc3N1ZSDmraPlvI/kv67lpI3lhbPpl63lkI7vvIzov5nmrrXku6PnoIHlj6/ku6Xnp7vpmaRcbiAgICAgICAgLy8gSEFDSyDliZTpmaTli77pgInkuoYgbGlnaHQuc3RhdGljU2V0dGluZ3MuZWRpdG9yT25seSDnmoTnga/lhYnnu4Tku7ZcbiAgICAgICAgaWYgKGluc3RhbmNlIGluc3RhbmNlb2YgU2NlbmVBc3NldCkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBpbnN0YW5jZS5zY2VuZT8uY2hpbGRyZW4gfHwgW107XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZTogTm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBzID0gbm9kZS5nZXRDb21wb25lbnRzSW5DaGlsZHJlbihMaWdodENvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgY29tcHMuZm9yRWFjaCgoY29tcDogTGlnaHRDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXAuc3RhdGljU2V0dGluZ3M/LmVkaXRvck9ubHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAuX2Rlc3Ryb3lJbW1lZGlhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YeN5paw5Y+N5bqP5YiX5YyW5bm25L+d5a2YXG4gICAgICAgIHJldHVybiAob3B0aW9ucy51c2VDQ09OQiA/IEVkaXRvckV4dGVuZHMuc2VyaWFsaXplIDogRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemVDb21waWxlZCkoXG4gICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5kZWZhdWx0U2VyaWFsaXplZE9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICBjb21wcmVzc1V1aWQ6ICFvcHRpb25zLmRlYnVnLFxuICAgICAgICAgICAgICAgIHVzZUNDT046IG9wdGlvbnMudXNlQ0NPTkIsXG4gICAgICAgICAgICAgICAgbm9OYXRpdmVEZXA6ICFpbnN0YW5jZS5fbmF0aXZlLCAvLyDooajmmI7or6XotYTmupDmmK/lkKblrZjlnKjljp/nlJ/kvp3otZbvvIzov5nkuKrlrZfmrrXlnKjov5DooYzml7bkvJrlvbHlk40gcHJlbG9hZCDnm7jlhbPmjqXlj6PnmoTooajnjrBcbiAgICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluWPjeW6j+WIl+WMluWQjueahOWOn+Wni+WvueixoVxuICAgICAqIEBwYXJhbSB1dWlkXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRSYXdJbnN0YW5jZShhc3NldDogSUFzc2V0KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgICAgICAgIGFzc2V0OiBudWxsLFxuICAgICAgICAgICAgZGV0YWlsOiBudWxsLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoYXNzZXQuaW52YWxpZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICBpMThuLnQoJ2J1aWxkZXIuZXJyb3IuYXNzZXRfaW1wb3J0X2ZhaWxlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBge2Fzc2V0KCR7YXNzZXQudXJsfSl9YCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ3R5cGUnKSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QganNvblNyYyA9IGFzc2V0Lm1ldGEuZmlsZXMuaW5jbHVkZXMoJy5qc29uJykgPyBhc3NldC5saWJyYXJ5ICsgJy5qc29uJyA6ICcnO1xuICAgICAgICBjb25zdCBjY29uYlNyYyA9IGdldENDT05Gb3JtYXRBc3NldEluTGlicmFyeShhc3NldCk7XG4gICAgICAgIGlmICghanNvblNyYyAmJiAhY2NvbmJTcmMpIHtcbiAgICAgICAgICAgIC8vIFRPRE8g55Sx5LqO55uu5YmN5peg5rOV56Gu6K6k77yMLmpzb24g5LiN5a2Y5Zyo5piv55Sx5LqO6LWE5rqQ5pys6Lqr5aaC5q2k6L+Y5piv5Zug5Li65a+85YWl5ZmoIGJ1Z++8jOWPquiDveWFiCBkZWJ1ZyDmiZPljbBcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgICAgICAgICAgaTE4bi50KCdidWlsZGVyLndhcm4ubm9fc2VyaWFsaXplZF9qc29uJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IGB7YXNzZXQoJHthc3NldC51cmx9KX1gLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldE1hbmFnZXIucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAndHlwZScpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhID0ganNvblNyYyA/IGF3YWl0IHJlYWRKU09OKGpzb25TcmMpIDogYXdhaXQgdHJhbnNmb3JtQ0NPTihjY29uYlNyYyk7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFJhd0luc3RhbmNlRnJvbURhdGEoZGF0YSwgYXNzZXQpO1xuICAgIH1cblxuICAgIGdldFJhd0luc3RhbmNlRnJvbURhdGEoZGF0YTogQ0NPTiB8IG9iamVjdCwgYXNzZXQ6IElBc3NldCkge1xuICAgICAgICBjb25zdCByZXN1bHQ6IHtcbiAgICAgICAgICAgIGFzc2V0OiBDQ0Fzc2V0IHwgbnVsbDtcbiAgICAgICAgICAgIGRldGFpbDogc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgfSA9IHtcbiAgICAgICAgICAgIGFzc2V0OiBudWxsLFxuICAgICAgICAgICAgZGV0YWlsOiBudWxsLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBkZXNlcmlhbGl6ZURldGFpbHMgPSBuZXcgY2MuZGVzZXJpYWxpemUuRGV0YWlscygpO1xuICAgICAgICAvLyBkZXRhaWwg6YeM6Z2i55qE5pWw57uE5YiG5Yir5LiA5LiA5a+55bqU77yM5bm25LiU5oyH5ZCRIGFzc2V0IOS+nei1lui1hOa6kOeahOWvueixoe+8jOS4jeWPr+maj+aEj+abtOaUuSAvIOaOkuW6j1xuICAgICAgICBkZXNlcmlhbGl6ZURldGFpbHMucmVzZXQoKTtcbiAgICAgICAgY29uc3QgTWlzc2luZ0NsYXNzID0gRWRpdG9yRXh0ZW5kcy5NaXNzaW5nUmVwb3J0ZXIuY2xhc3NJbnN0YW5jZTtcbiAgICAgICAgTWlzc2luZ0NsYXNzLmhhc01pc3NpbmdDbGFzcyA9IGZhbHNlO1xuICAgICAgICBjb25zdCBkZXNlcmlhbGl6ZWRBc3NldCA9IGRlc2VyaWFsaXplKGRhdGEsIGRlc2VyaWFsaXplRGV0YWlscywge1xuICAgICAgICAgICAgY3JlYXRlQXNzZXRSZWZzOiB0cnVlLFxuICAgICAgICAgICAgaWdub3JlRWRpdG9yT25seTogdHJ1ZSxcbiAgICAgICAgICAgIGNsYXNzRmluZGVyOiBNaXNzaW5nQ2xhc3MuY2xhc3NGaW5kZXIsXG4gICAgICAgIH0pIGFzIENDQXNzZXQ7XG4gICAgICAgIGlmICghZGVzZXJpYWxpemVkQXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgaTE4bi50KCdidWlsZGVyLmVycm9yLmRlc2VyaWFsaXplX2ZhaWxlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBge2Fzc2V0KCR7YXNzZXQudXJsfSl9YCxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlcG9ydE1pc3NpbmdDbGFzcyDkvJrmoLnmja4gX3V1aWQg5p2l5YGa5Yik5pat77yM6ZyA6KaB5Zyo6LCD55SoIHJlcG9ydE1pc3NpbmdDbGFzcyDkuYvliY3otYvlgLxcbiAgICAgICAgZGVzZXJpYWxpemVkQXNzZXQuX3V1aWQgPSBhc3NldC51dWlkO1xuXG4gICAgICAgIGlmIChNaXNzaW5nQ2xhc3MuaGFzTWlzc2luZ0NsYXNzICYmICF0aGlzLmhhc01pc3NpbmdDbGFzc1V1aWRzLmhhcyhhc3NldC51dWlkKSkge1xuICAgICAgICAgICAgTWlzc2luZ0NsYXNzLnJlcG9ydE1pc3NpbmdDbGFzcyhkZXNlcmlhbGl6ZWRBc3NldCk7XG4gICAgICAgICAgICB0aGlzLmhhc01pc3NpbmdDbGFzc1V1aWRzLmFkZChhc3NldC51dWlkKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDmuIXnqbrnvJPlrZjvvIzpmLLmraLlhoXlrZjms4TmvI9cbiAgICAgICAgTWlzc2luZ0NsYXNzLnJlc2V0KCk7XG4gICAgICAgIC8vIOmihOiniOaXtuWPqumcgOaJvuWHuuS+nei1lueahOi1hOa6kO+8jOaXoOmcgOe8k+WtmCBhc3NldFxuICAgICAgICAvLyDmo4Dmn6Xku6Xlj4rmn6Xmib7lr7nlupTotYTmupDvvIzlubbov5Tlm57nu5nlr7nlupQgYXNzZXQg5pWw5o2uXG4gICAgICAgIC8vIGNvbnN0IG1pc3NpbmdBc3NldHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIC8vIOagueaNrui/meS4quaWueazleWIhumFjeWBh+eahOi1hOa6kOWvueixoSwg56Gu5L+d5bqP5YiX5YyW5pe26LWE5rqQ6IO96KKr6YeN5paw5bqP5YiX5YyW5oiQIHV1aWRcbiAgICAgICAgY29uc3QgdGVzdCA9IHRoaXM7XG4gICAgICAgIGxldCBtaXNzaW5nQXNzZXRSZXBvcnRlcjogYW55ID0gbnVsbDtcbiAgICAgICAgZGVzZXJpYWxpemVEZXRhaWxzLmFzc2lnbkFzc2V0c0J5KGZ1bmN0aW9uICh1dWlkOiBzdHJpbmcsIG9wdGlvbnM6IHsgb3duZXI6IG9iamVjdDsgcHJvcDogc3RyaW5nOyB0eXBlOiBGdW5jdGlvbiB9KSB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHRlc3QuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUuYXNBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgKCFtaXNzaW5nQXNzZXRzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIG1pc3NpbmdBc3NldHMucHVzaCh1dWlkKTtcbiAgICAgICAgICAgICAgICB0ZXN0Lmhhc01pc3NpbmdBc3NldHNVdWlkcy5hZGQodXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5vd25lcikge1xuICAgICAgICAgICAgICAgICAgICBtaXNzaW5nQXNzZXRSZXBvcnRlciA9IG1pc3NpbmdBc3NldFJlcG9ydGVyIHx8IG5ldyBFZGl0b3JFeHRlbmRzLk1pc3NpbmdSZXBvcnRlci5vYmplY3QoZGVzZXJpYWxpemVkQXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICBtaXNzaW5nQXNzZXRSZXBvcnRlci5vdXRwdXRMZXZlbCA9ICd3YXJuJztcbiAgICAgICAgICAgICAgICAgICAgbWlzc2luZ0Fzc2V0UmVwb3J0ZXIuc3Rhc2hCeU93bmVyKG9wdGlvbnMub3duZXIsIG9wdGlvbnMucHJvcCwgRWRpdG9yRXh0ZW5kcy5zZXJpYWxpemUuYXNBc3NldCh1dWlkLCBvcHRpb25zLnR5cGUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBkZWxldGVkIGFzc2V0IHJlZmVyZW5jZVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG1pc3NpbmdBc3NldFJlcG9ydGVyKSB7XG4gICAgICAgICAgICBtaXNzaW5nQXNzZXRSZXBvcnRlci5yZXBvcnRCeU93bmVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgKG1pc3NpbmdBc3NldHMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAvLyAgICAgICAgIGkxOG4udCgnYnVpbGRlci5lcnJvci5yZXF1aXJlZF9hc3NldF9taXNzaW5nJywge1xuICAgICAgICAvLyAgICAgICAgICAgICB1cmw6IGB7YXNzZXQoJHthc3NldC51cmx9KX1gLFxuICAgICAgICAvLyAgICAgICAgICAgICB1dWlkOiBtaXNzaW5nQXNzZXRzLmpvaW4oJ1xcbiAnKSxcbiAgICAgICAgLy8gICAgICAgICB9KSxcbiAgICAgICAgLy8gICAgICk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vY29jb3MtY3JlYXRvci8zZC10YXNrcy9pc3N1ZXMvNjA0MiDlpITnkIYgcHJlZmFiIOS4jiBzY2VuZSDlkI3np7DlkIzmraXpl67pophcbiAgICAgICAgaWYgKFsnY2MuU2NlbmVBc3NldCcsICdjYy5QcmVmYWInXS5pbmNsdWRlcyhhc3NldE1hbmFnZXIucXVlcnlBc3NldFByb3BlcnR5KGFzc2V0LCAndHlwZScpKSkge1xuICAgICAgICAgICAgZGVzZXJpYWxpemVkQXNzZXQubmFtZSA9IGJhc2VuYW1lKGFzc2V0LnNvdXJjZSwgZXh0bmFtZShhc3NldC5zb3VyY2UpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdC5hc3NldCA9IGRlc2VyaWFsaXplZEFzc2V0O1xuICAgICAgICByZXN1bHQuZGV0YWlsID0gZGVzZXJpYWxpemVEZXRhaWxzO1xuICAgICAgICB0aGlzLmRlcGVuZFthc3NldC51dWlkXSA9IFsuLi5uZXcgU2V0KGRlc2VyaWFsaXplRGV0YWlscy51dWlkTGlzdCldIGFzIHN0cmluZ1tdO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmHjee9rlxuICAgICAqL1xuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmFzc2V0TWFwID0ge307XG4gICAgICAgIHRoaXMubWV0YSA9IHt9O1xuICAgICAgICB0aGlzLmRlcGVuZCA9IHt9O1xuICAgICAgICB0aGlzLmRlcGVuZGVkTWFwID0ge307XG4gICAgICAgIHRoaXMuaGFzTWlzc2luZ0NsYXNzVXVpZHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5oYXNNaXNzaW5nQXNzZXRzVXVpZHMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNoZWNrVXNlQ2FjaGUoYXNzZXQ6IElBc3NldCk6IGJvb2xlYW4ge1xuICAgICAgICAvLyDlnLrmma/jgIFwcmVmYWIg6LWE5rqQ55qE57yT5a2Y77yM5Zyo5Y+R55Sf6ISa5pys5Y+Y5YyW5ZCO5bCx6ZyA6KaB5aSx5pWILCBlZmZlY3Qg55uu5YmN5pyJ5p6E5bu65YmU6Zmk5py65Yi25pqC5pe25LiN57yT5a2Y57uT5p6cXG4gICAgICAgIGlmICghdGhpcy51c2VDYWNoZSB8fCAoWydjYy5TY2VuZUFzc2V0JywgJ2NjLlByZWZhYicsICdjYy5FZmZlY3RBc3NldCddLmluY2x1ZGVzKGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0UHJvcGVydHkoYXNzZXQsICd0eXBlJykpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgY2hlY2tDYW5TYXZlQ2FjaGUodXVpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIC8vIOWcuuaZr+OAgXByZWZhYiDotYTmupDnmoTnvJPlrZjvvIzlnKjlj5HnlJ/ohJrmnKzlj5jljJblkI7lsLHpnIDopoHlpLHmlYhcbiAgICAgICAgaWYgKHRoaXMuaGFzTWlzc2luZ0NsYXNzVXVpZHMuaGFzKHV1aWQpIHx8IHRoaXMuaGFzTWlzc2luZ0NsYXNzVXVpZHMuaGFzKHV1aWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEFzc2V0UHJvcGVydHkgPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldFByb3BlcnR5O1xuICAgIHB1YmxpYyB1cmwydXVpZCA9IGFzc2V0TWFuYWdlci51cmwydXVpZDtcbn1cbmV4cG9ydCBjb25zdCBidWlsZEFzc2V0TGlicmFyeSA9IG5ldyBCdWlsZEFzc2V0TGlicmFyeSgpO1xuXG5mdW5jdGlvbiB1bkV4cGVjdEV4Y2VwdGlvbihlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5kZWJ1ZyhlcnJvcik7XG59XG4iXX0=