'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderAssetCache = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const index_1 = require("../utils/index");
const asset_library_1 = require("./asset-library");
const cconb_1 = require("../utils/cconb");
const asset_1 = __importDefault(require("../../../../assets/manager/asset"));
const builder_config_1 = __importDefault(require("../../../share/builder-config"));
/**
 * 资源管理器，主要负责资源的缓存查询缓存等
 * 所有 __ 开头的属性方法都不对外公开
 */
class BuilderAssetCache {
    // 场景资源信息
    scenes = [];
    // 脚本资源信息缓存
    scriptUuids = [];
    // 其他资源信息缓存，不包含场景和脚本
    assetUuids = [];
    // 资源反序列化之后的结果
    instanceMap = {};
    _task;
    constructor(task) {
        this._task = task;
    }
    /**
     * 初始化
     */
    async init() {
        await asset_library_1.buildAssetLibrary.init();
    }
    /**
     * 查询某个 uuid 是否存在
     * @param uuid
     * @returns
     */
    async hasAsset(uuid) {
        return !!(this.assetUuids.includes(uuid) || this.scriptUuids.includes(uuid) || this.scenes.find(item => item.uuid === uuid));
    }
    /**
     * 添加一个资源到缓存
     * @param asset
     */
    addAsset(asset, type) {
        // @ts-ignore
        if (asset.invalid || asset.url.startsWith('db://internal/default_file_content')) {
            return;
        }
        // HACK 3.9.0 此接口入参接收参数格式有变动，暂时先兼容
        if (!asset._assetDB) {
            console.warn('The addAsset method no longer supports the AssetInfo type, so please pass parameters that conform to the IAsset interface definition.');
            asset = asset_library_1.buildAssetLibrary.getAsset(asset.uuid);
        }
        // FBX/GLTF 的根资源本身没有 library .json；可预览的 Prefab、Material、Mesh
        // 都是其 VirtualAsset 子资源。Creator 的资源检查器会直接传这些子资源 UUID 给
        // scene preview，所以预览构建也必须把整棵资源树加入 cache。此前仅缓存根节点，
        // 导致 scene-editor bundle 漏掉这些子资源，最终预览请求到不存在的根 UUID .json。
        const visit = (current, currentType) => {
            this.addSingleAsset(current, currentType);
            for (const subAsset of Object.values(current.subAssets || {})) {
                visit(subAsset);
            }
        };
        visit(asset, type);
    }
    addSingleAsset(asset, type) {
        const ccType = type || asset_1.default.queryAssetProperty(asset, 'type');
        switch (ccType) {
            case 'cc.SceneAsset':
                if (!this.scenes.some((scene) => scene.uuid === asset.uuid)) {
                    this.scenes.push({
                        uuid: asset.uuid,
                        url: asset.url,
                    });
                }
                break;
            case 'cc.Script':
                // hack 过滤特殊的声明文件，过滤资源模板内的脚本
                if (!asset.url.toLowerCase().endsWith('.d.ts') && !this.scriptUuids.includes(asset.uuid)) {
                    this.scriptUuids.push(asset.uuid);
                }
                break;
            default:
                if ((asset.meta.files.includes('.json') || (0, cconb_1.hasCCONFormatAssetInLibrary)(asset))
                    && !this.assetUuids.includes(asset.uuid)) {
                    this.assetUuids.push(asset.uuid);
                }
        }
    }
    /**
     * 删除一个资源的缓存
     */
    removeAsset(uuid, type) {
        const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
        if (!asset) {
            return;
        }
        const assetType = type || asset_1.default.queryAssetProperty(asset, 'type');
        switch (assetType) {
            case 'cc.SceneAsset':
                for (let i = 0; i < this.scenes.length; i++) {
                    if (this.scenes[i].uuid === uuid) {
                        this.scenes.splice(i, 1);
                        return;
                    }
                }
                break;
            case 'cc.Script':
                for (let i = 0; i < this.scriptUuids.length; i++) {
                    if (this.scriptUuids[i] === uuid) {
                        this.scriptUuids.splice(i, 1);
                        return;
                    }
                }
                break;
            default:
                (0, index_1.recursively)(asset, (asset) => {
                    if (asset.meta.files.includes('.json') || (0, cconb_1.hasCCONFormatAssetInLibrary)(asset)) {
                        for (let i = 0; i < this.assetUuids.length; i++) {
                            if (this.assetUuids[i] === asset.uuid) {
                                this.assetUuids.splice(i, 1);
                                return;
                            }
                        }
                    }
                });
        }
    }
    /**
     * 查询指定 uuid 的资源信息
     * @param uuid
     */
    getAssetInfo(uuid) {
        return asset_library_1.buildAssetLibrary.getAssetInfo(uuid);
    }
    /**
     * 添加或修改一个实例化对象到缓存
     * @param instance
     */
    addInstance(instance) {
        if (!instance || !instance._uuid) {
            return;
        }
        this.instanceMap[instance._uuid] = instance;
    }
    /**
     * 删除一个资源的缓存
     * @param uuid
     */
    clearAsset(uuid) {
        this.scenes.length = 0;
        this.scriptUuids.length = 0;
        this.assetUuids.length = 0;
        delete this.instanceMap[uuid];
    }
    /**
     * 查询一个资源的 meta 数据
     * @param uuid
     */
    getMeta(uuid) {
        return asset_library_1.buildAssetLibrary.getMeta(uuid);
    }
    async addMeta(uuid, meta) {
        asset_library_1.buildAssetLibrary.addMeta(uuid, meta);
    }
    /**
     * 获取指定 uuid 资源的依赖资源 uuid 列表
     * @param uuid
     */
    async getDependUuids(uuid) {
        return await asset_library_1.buildAssetLibrary.getDependUuids(uuid);
    }
    /**
     * 深度获取指定 uuid 资源的依赖资源 uuid 列表
     * @param uuid
     */
    async getDependUuidsDeep(uuid) {
        return await asset_library_1.buildAssetLibrary.getDependUuidsDeep(uuid);
    }
    /**
     *
     * 获取指定 uuid 资源在 library 内的序列化 JSON 内容
     * @param uuid
     */
    async getLibraryJSON(uuid) {
        const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
        if (!asset || !asset.meta.files.includes('.json')) {
            return null;
        }
        // 不需要缓存 json 数据
        return await (0, fs_extra_1.readJSON)(asset.library + '.json');
    }
    /**
     * 获取指定 uuid 资源的重新序列化后的 JSON 内容（最终输出）
     * @param uuid
     * @param options
     */
    async getSerializedJSON(uuid, options) {
        const instance = this.instanceMap[uuid];
        let jsonObject;
        // 优先使用 cache 中的缓存数据生成序列化文件
        if (instance) {
            jsonObject = asset_library_1.buildAssetLibrary.serialize(instance, options);
        }
        else {
            jsonObject = await asset_library_1.buildAssetLibrary.getSerializedJSON(uuid, options);
        }
        return jsonObject ? jsonObject : null;
    }
    /**
     * 直接输出某个资源序列化 JSON 到指定包内
     * @param uuid
     * @param destDir
     * @param options
     */
    async outputAssetJson(uuid, destDir, options) {
        const asset = asset_library_1.buildAssetLibrary.getAsset(uuid);
        const instance = this.instanceMap[uuid];
        if (!instance && !asset) {
            return;
        }
        if (!instance) {
            const dest = (0, path_1.join)(destDir, uuid.substr(0, 2), uuid + '.json');
            await asset_library_1.buildAssetLibrary.outputAssets(uuid, dest, options.debug);
        }
        else {
            // 正常资源的输出路径需要以 library 内的输出路径为准，不可直接拼接，比如 ttf 字体类的生成路径
            const dest = (0, path_1.join)(destDir, asset.library.replace((0, path_1.join)(builder_config_1.default.projectRoot, 'library'), '') + '.json');
            const jsonObject = asset_library_1.buildAssetLibrary.serialize(instance, {
                debug: options.debug,
            });
            await (0, fs_extra_1.outputJSON)(dest, jsonObject);
        }
    }
    /**
     * 循环一种数据
     * @param type
     * @param handle
     */
    async forEach(type, handle) {
        // @ts-ignore
        if (!this[type]) {
            return;
        }
        // @ts-ignore
        const uuids = Object.keys(this[type]);
        if (!uuids) {
            return;
        }
        for (let i = 0; i < uuids.length; i++) {
            const uuid = uuids[i];
            handle && (await handle(uuid, i));
        }
    }
    /**
     * 查询一个资源反序列化后的实例
     * @param uuid
     */
    async getInstance(uuid) {
        if (this.instanceMap[uuid]) {
            return this.instanceMap[uuid];
        }
        const asset = await asset_library_1.buildAssetLibrary.getAsset(uuid);
        return asset_library_1.buildAssetLibrary.getInstance(asset);
    }
}
exports.BuilderAssetCache = BuilderAssetCache;
