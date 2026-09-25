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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3dvcmtlci9idWlsZGVyL21hbmFnZXIvYXNzZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7QUFFYix1Q0FBZ0Q7QUFDaEQsK0JBQTRCO0FBQzVCLDBDQUE2QztBQUM3QyxtREFBb0Q7QUFDcEQsMENBQTZEO0FBSTdELDZFQUE0RDtBQUM1RCxtRkFBMEQ7QUFFMUQ7OztHQUdHO0FBQ0gsTUFBYSxpQkFBaUI7SUFFMUIsU0FBUztJQUNPLE1BQU0sR0FBMkIsRUFBRSxDQUFDO0lBRXBELFdBQVc7SUFDSyxXQUFXLEdBQWtCLEVBQUUsQ0FBQztJQUVoRCxvQkFBb0I7SUFDYixVQUFVLEdBQWtCLEVBQUUsQ0FBQztJQUV0QyxjQUFjO0lBQ0csV0FBVyxHQUFpQixFQUFFLENBQUM7SUFFL0IsS0FBSyxDQUFZO0lBRWxDLFlBQVksSUFBZTtRQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUN0QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsSUFBSTtRQUNOLE1BQU0saUNBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLElBQVk7UUFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNqSSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksUUFBUSxDQUFDLEtBQWEsRUFBRSxJQUFh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O1FBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2QsT0FBTztRQUNYLENBQUM7UUFDRCxhQUFhO1FBQ2IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDVCxPQUFPO1FBQ1gsQ0FBQztRQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDcEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sSUFBSSxDQUFDLE1BQU0sTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDTCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFZO1FBQ2pDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxpQ0FBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsT0FBTyxpQ0FBaUIsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQztDQUNKO0FBdFJELDhDQXNSQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgb3V0cHV0SlNPTiwgcmVhZEpTT04gfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWN1cnNpdmVseSB9IGZyb20gJy4uL3V0aWxzL2luZGV4JztcbmltcG9ydCB7IGJ1aWxkQXNzZXRMaWJyYXJ5IH0gZnJvbSAnLi9hc3NldC1saWJyYXJ5JztcbmltcG9ydCB7IGhhc0NDT05Gb3JtYXRBc3NldEluTGlicmFyeSB9IGZyb20gJy4uL3V0aWxzL2Njb25iJztcbmltcG9ydCB7IElBc3NldCB9IGZyb20gJy4uLy4uLy4uLy4uL2Fzc2V0cy9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IElCdWlsZFNjZW5lSXRlbSB9IGZyb20gJy4uLy4uLy4uL0B0eXBlcyc7XG5pbXBvcnQgeyBJSW5zdGFuY2VNYXAsIElCdWlsZGVyLCBJU2VyaWFsaXplZE9wdGlvbnMsIElJbnRlcm5hbEJ1aWxkT3B0aW9ucywgQnVpbGRlckNhY2hlIGFzIElCdWlsZGVyQ2FjaGUgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCBhc3NldE1hbmFnZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXNzZXRzL21hbmFnZXIvYXNzZXQnO1xuaW1wb3J0IGJ1aWxkZXJDb25maWcgZnJvbSAnLi4vLi4vLi4vc2hhcmUvYnVpbGRlci1jb25maWcnO1xuXG4vKipcbiAqIOi1hOa6kOeuoeeQhuWZqO+8jOS4u+imgei0n+i0o+i1hOa6kOeahOe8k+WtmOafpeivoue8k+WtmOetiVxuICog5omA5pyJIF9fIOW8gOWktOeahOWxnuaAp+aWueazlemDveS4jeWvueWkluWFrOW8gFxuICovXG5leHBvcnQgY2xhc3MgQnVpbGRlckFzc2V0Q2FjaGUgaW1wbGVtZW50cyBJQnVpbGRlckNhY2hlIHtcblxuICAgIC8vIOWcuuaZr+i1hOa6kOS/oeaBr1xuICAgIHB1YmxpYyByZWFkb25seSBzY2VuZXM6IEFycmF5PElCdWlsZFNjZW5lSXRlbT4gPSBbXTtcblxuICAgIC8vIOiEmuacrOi1hOa6kOS/oeaBr+e8k+WtmFxuICAgIHB1YmxpYyByZWFkb25seSBzY3JpcHRVdWlkczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuXG4gICAgLy8g5YW25LuW6LWE5rqQ5L+h5oGv57yT5a2Y77yM5LiN5YyF5ZCr5Zy65pmv5ZKM6ISa5pysXG4gICAgcHVibGljIGFzc2V0VXVpZHM6IEFycmF5PHN0cmluZz4gPSBbXTtcblxuICAgIC8vIOi1hOa6kOWPjeW6j+WIl+WMluS5i+WQjueahOe7k+aenFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5zdGFuY2VNYXA6IElJbnN0YW5jZU1hcCA9IHt9O1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBfdGFzaz86IElCdWlsZGVyO1xuXG4gICAgY29uc3RydWN0b3IodGFzaz86IElCdWlsZGVyKSB7XG4gICAgICAgIHRoaXMuX3Rhc2sgPSB0YXNrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIneWni+WMllxuICAgICAqL1xuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGF3YWl0IGJ1aWxkQXNzZXRMaWJyYXJ5LmluaXQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6Lmn5DkuKogdXVpZCDmmK/lkKblrZjlnKhcbiAgICAgKiBAcGFyYW0gdXVpZCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBoYXNBc3NldCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuICEhKHRoaXMuYXNzZXRVdWlkcy5pbmNsdWRlcyh1dWlkKSB8fCB0aGlzLnNjcmlwdFV1aWRzLmluY2x1ZGVzKHV1aWQpIHx8IHRoaXMuc2NlbmVzLmZpbmQoaXRlbSA9PiBpdGVtLnV1aWQgPT09IHV1aWQpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmt7vliqDkuIDkuKrotYTmupDliLDnvJPlrZhcbiAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkQXNzZXQoYXNzZXQ6IElBc3NldCwgdHlwZT86IHN0cmluZykge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChhc3NldC5pbnZhbGlkIHx8IGFzc2V0LnVybC5zdGFydHNXaXRoKCdkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50JykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBIQUNLIDMuOS4wIOatpOaOpeWPo+WFpeWPguaOpeaUtuWPguaVsOagvOW8j+acieWPmOWKqO+8jOaaguaXtuWFiOWFvOWuuVxuICAgICAgICBpZiAoIWFzc2V0Ll9hc3NldERCKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1RoZSBhZGRBc3NldCBtZXRob2Qgbm8gbG9uZ2VyIHN1cHBvcnRzIHRoZSBBc3NldEluZm8gdHlwZSwgc28gcGxlYXNlIHBhc3MgcGFyYW1ldGVycyB0aGF0IGNvbmZvcm0gdG8gdGhlIElBc3NldCBpbnRlcmZhY2UgZGVmaW5pdGlvbi4nKTtcbiAgICAgICAgICAgIGFzc2V0ID0gYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXQoYXNzZXQudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGQlgvR0xURiDnmoTmoLnotYTmupDmnKzouqvmsqHmnIkgbGlicmFyeSAuanNvbu+8m+WPr+mihOiniOeahCBQcmVmYWLjgIFNYXRlcmlhbOOAgU1lc2hcbiAgICAgICAgLy8g6YO95piv5YW2IFZpcnR1YWxBc3NldCDlrZDotYTmupDjgIJDcmVhdG9yIOeahOi1hOa6kOajgOafpeWZqOS8muebtOaOpeS8oOi/meS6m+WtkOi1hOa6kCBVVUlEIOe7mVxuICAgICAgICAvLyBzY2VuZSBwcmV2aWV377yM5omA5Lul6aKE6KeI5p6E5bu65Lmf5b+F6aG75oqK5pW05qO16LWE5rqQ5qCR5Yqg5YWlIGNhY2hl44CC5q2k5YmN5LuF57yT5a2Y5qC56IqC54K577yMXG4gICAgICAgIC8vIOWvvOiHtCBzY2VuZS1lZGl0b3IgYnVuZGxlIOa8j+aOiei/meS6m+WtkOi1hOa6kO+8jOacgOe7iOmihOiniOivt+axguWIsOS4jeWtmOWcqOeahOaguSBVVUlEIC5qc29u44CCXG4gICAgICAgIGNvbnN0IHZpc2l0ID0gKGN1cnJlbnQ6IElBc3NldCwgY3VycmVudFR5cGU/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYWRkU2luZ2xlQXNzZXQoY3VycmVudCwgY3VycmVudFR5cGUpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBzdWJBc3NldCBvZiBPYmplY3QudmFsdWVzKGN1cnJlbnQuc3ViQXNzZXRzIHx8IHt9KSkge1xuICAgICAgICAgICAgICAgIHZpc2l0KHN1YkFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmlzaXQoYXNzZXQsIHR5cGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkU2luZ2xlQXNzZXQoYXNzZXQ6IElBc3NldCwgdHlwZT86IHN0cmluZykge1xuICAgICAgICBjb25zdCBjY1R5cGUgPSB0eXBlIHx8IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0UHJvcGVydHkoYXNzZXQsICd0eXBlJyk7XG4gICAgICAgIHN3aXRjaCAoY2NUeXBlKSB7XG4gICAgICAgICAgICBjYXNlICdjYy5TY2VuZUFzc2V0JzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuc2NlbmVzLnNvbWUoKHNjZW5lKSA9PiBzY2VuZS51dWlkID09PSBhc3NldC51dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjZW5lcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGFzc2V0LnVybCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2MuU2NyaXB0JzpcbiAgICAgICAgICAgICAgICAvLyBoYWNrIOi/h+a7pOeJueauiueahOWjsOaYjuaWh+S7tu+8jOi/h+a7pOi1hOa6kOaooeadv+WGheeahOiEmuacrFxuICAgICAgICAgICAgICAgIGlmICghYXNzZXQudXJsLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoJy5kLnRzJykgJiYgIXRoaXMuc2NyaXB0VXVpZHMuaW5jbHVkZXMoYXNzZXQudXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JpcHRVdWlkcy5wdXNoKGFzc2V0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoYXNzZXQubWV0YS5maWxlcy5pbmNsdWRlcygnLmpzb24nKSB8fCBoYXNDQ09ORm9ybWF0QXNzZXRJbkxpYnJhcnkoYXNzZXQpKVxuICAgICAgICAgICAgICAgICAgICAmJiAhdGhpcy5hc3NldFV1aWRzLmluY2x1ZGVzKGFzc2V0LnV1aWQpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXNzZXRVdWlkcy5wdXNoKGFzc2V0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIoOmZpOS4gOS4qui1hOa6kOeahOe8k+WtmFxuICAgICAqL1xuICAgIHB1YmxpYyByZW1vdmVBc3NldCh1dWlkOiBzdHJpbmcsIHR5cGU/OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFzc2V0VHlwZSA9IHR5cGUgfHwgYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRQcm9wZXJ0eShhc3NldCwgJ3R5cGUnKTtcbiAgICAgICAgc3dpdGNoIChhc3NldFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NjLlNjZW5lQXNzZXQnOlxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zY2VuZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2NlbmVzW2ldLnV1aWQgPT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2NlbmVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NjLlNjcmlwdCc6XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNjcmlwdFV1aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjcmlwdFV1aWRzW2ldID09PSB1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcmlwdFV1aWRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlbHkoYXNzZXQsIChhc3NldDogSUFzc2V0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldC5tZXRhLmZpbGVzLmluY2x1ZGVzKCcuanNvbicpIHx8IGhhc0NDT05Gb3JtYXRBc3NldEluTGlicmFyeShhc3NldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hc3NldFV1aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuYXNzZXRVdWlkc1tpXSA9PT0gYXNzZXQudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFzc2V0VXVpZHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LmjIflrpogdXVpZCDnmoTotYTmupDkv6Hmga9cbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRBc3NldEluZm8odXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldEluZm8odXVpZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5re75Yqg5oiW5L+u5pS55LiA5Liq5a6e5L6L5YyW5a+56LGh5Yiw57yT5a2YXG4gICAgICogQHBhcmFtIGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIGFkZEluc3RhbmNlKGluc3RhbmNlOiBhbnkpIHtcbiAgICAgICAgaWYgKCFpbnN0YW5jZSB8fCAhaW5zdGFuY2UuX3V1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluc3RhbmNlTWFwW2luc3RhbmNlLl91dWlkXSA9IGluc3RhbmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIoOmZpOS4gOS4qui1hOa6kOeahOe8k+WtmFxuICAgICAqIEBwYXJhbSB1dWlkXG4gICAgICovXG4gICAgcHVibGljIGNsZWFyQXNzZXQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuc2NlbmVzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuc2NyaXB0VXVpZHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5hc3NldFV1aWRzLmxlbmd0aCA9IDA7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmluc3RhbmNlTWFwW3V1aWRdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouS4gOS4qui1hOa6kOeahCBtZXRhIOaVsOaNrlxuICAgICAqIEBwYXJhbSB1dWlkXG4gICAgICovXG4gICAgcHVibGljIGdldE1ldGEodXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkQXNzZXRMaWJyYXJ5LmdldE1ldGEodXVpZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZE1ldGEodXVpZDogc3RyaW5nLCBtZXRhOiBhbnkpIHtcbiAgICAgICAgYnVpbGRBc3NldExpYnJhcnkuYWRkTWV0YSh1dWlkLCBtZXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmjIflrpogdXVpZCDotYTmupDnmoTkvp3otZbotYTmupAgdXVpZCDliJfooahcbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBnZXREZXBlbmRVdWlkcyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPHJlYWRvbmx5IHN0cmluZ1tdPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCBidWlsZEFzc2V0TGlicmFyeS5nZXREZXBlbmRVdWlkcyh1dWlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmt7Hluqbojrflj5bmjIflrpogdXVpZCDotYTmupDnmoTkvp3otZbotYTmupAgdXVpZCDliJfooahcbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBnZXREZXBlbmRVdWlkc0RlZXAodXVpZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgYnVpbGRBc3NldExpYnJhcnkuZ2V0RGVwZW5kVXVpZHNEZWVwKHV1aWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICog6I635Y+W5oyH5a6aIHV1aWQg6LWE5rqQ5ZyoIGxpYnJhcnkg5YaF55qE5bqP5YiX5YyWIEpTT04g5YaF5a65XG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgZ2V0TGlicmFyeUpTT04odXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSBidWlsZEFzc2V0TGlicmFyeS5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgaWYgKCFhc3NldCB8fCAhYXNzZXQubWV0YS5maWxlcy5pbmNsdWRlcygnLmpzb24nKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5LiN6ZyA6KaB57yT5a2YIGpzb24g5pWw5o2uXG4gICAgICAgIHJldHVybiBhd2FpdCByZWFkSlNPTihhc3NldC5saWJyYXJ5ICsgJy5qc29uJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5oyH5a6aIHV1aWQg6LWE5rqQ55qE6YeN5paw5bqP5YiX5YyW5ZCO55qEIEpTT04g5YaF5a6577yI5pyA57uI6L6T5Ye677yJXG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBnZXRTZXJpYWxpemVkSlNPTih1dWlkOiBzdHJpbmcsIG9wdGlvbnM6IElTZXJpYWxpemVkT3B0aW9ucyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5pbnN0YW5jZU1hcFt1dWlkXTtcbiAgICAgICAgbGV0IGpzb25PYmplY3Q7XG4gICAgICAgIC8vIOS8mOWFiOS9v+eUqCBjYWNoZSDkuK3nmoTnvJPlrZjmlbDmja7nlJ/miJDluo/liJfljJbmlofku7ZcbiAgICAgICAgaWYgKGluc3RhbmNlKSB7XG4gICAgICAgICAgICBqc29uT2JqZWN0ID0gYnVpbGRBc3NldExpYnJhcnkuc2VyaWFsaXplKGluc3RhbmNlLCBvcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGpzb25PYmplY3QgPSBhd2FpdCBidWlsZEFzc2V0TGlicmFyeS5nZXRTZXJpYWxpemVkSlNPTih1dWlkLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ganNvbk9iamVjdCA/IGpzb25PYmplY3QgOiBudWxsO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog55u05o6l6L6T5Ye65p+Q5Liq6LWE5rqQ5bqP5YiX5YyWIEpTT04g5Yiw5oyH5a6a5YyF5YaFXG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKiBAcGFyYW0gZGVzdERpclxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG91dHB1dEFzc2V0SnNvbih1dWlkOiBzdHJpbmcsIGRlc3REaXI6IHN0cmluZywgb3B0aW9uczogSUludGVybmFsQnVpbGRPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5pbnN0YW5jZU1hcFt1dWlkXTtcbiAgICAgICAgaWYgKCFpbnN0YW5jZSAmJiAhYXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWluc3RhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBkZXN0ID0gam9pbihkZXN0RGlyLCB1dWlkLnN1YnN0cigwLCAyKSwgdXVpZCArICcuanNvbicpO1xuICAgICAgICAgICAgYXdhaXQgYnVpbGRBc3NldExpYnJhcnkub3V0cHV0QXNzZXRzKHV1aWQsIGRlc3QsIG9wdGlvbnMuZGVidWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5q2j5bi46LWE5rqQ55qE6L6T5Ye66Lev5b6E6ZyA6KaB5LulIGxpYnJhcnkg5YaF55qE6L6T5Ye66Lev5b6E5Li65YeG77yM5LiN5Y+v55u05o6l5ou85o6l77yM5q+U5aaCIHR0ZiDlrZfkvZPnsbvnmoTnlJ/miJDot6/lvoRcbiAgICAgICAgICAgIGNvbnN0IGRlc3QgPSBqb2luKGRlc3REaXIsIGFzc2V0LmxpYnJhcnkucmVwbGFjZShqb2luKGJ1aWxkZXJDb25maWcucHJvamVjdFJvb3QsICdsaWJyYXJ5JyksICcnKSArICcuanNvbicpO1xuICAgICAgICAgICAgY29uc3QganNvbk9iamVjdCA9IGJ1aWxkQXNzZXRMaWJyYXJ5LnNlcmlhbGl6ZShpbnN0YW5jZSwge1xuICAgICAgICAgICAgICAgIGRlYnVnOiBvcHRpb25zLmRlYnVnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhd2FpdCBvdXRwdXRKU09OKGRlc3QsIGpzb25PYmplY3QpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5b6q546v5LiA56eN5pWw5o2uXG4gICAgICogQHBhcmFtIHR5cGVcbiAgICAgKiBAcGFyYW0gaGFuZGxlXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGZvckVhY2godHlwZTogc3RyaW5nLCBoYW5kbGU6IEZ1bmN0aW9uKTogUHJvbWlzZTx1bmRlZmluZWQ+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoIXRoaXNbdHlwZV0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHV1aWRzID0gT2JqZWN0LmtleXModGhpc1t0eXBlXSk7XG4gICAgICAgIGlmICghdXVpZHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHV1aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdXVpZHNbaV07XG4gICAgICAgICAgICBoYW5kbGUgJiYgKGF3YWl0IGhhbmRsZSh1dWlkLCBpKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LkuIDkuKrotYTmupDlj43luo/liJfljJblkI7nmoTlrp7kvotcbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBnZXRJbnN0YW5jZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5zdGFuY2VNYXBbdXVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlTWFwW3V1aWRdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgYnVpbGRBc3NldExpYnJhcnkuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgIHJldHVybiBidWlsZEFzc2V0TGlicmFyeS5nZXRJbnN0YW5jZShhc3NldCk7XG4gICAgfVxufVxuIl19