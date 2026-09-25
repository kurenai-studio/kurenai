"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetWatcherManager = void 0;
const cc_1 = require("cc");
const callbacks_invoker_1 = require("./callbacks-invoker");
const core_1 = require("../core");
const rpc_1 = require("../../rpc");
const ASSET_PROPS = 'A$$ETprops';
const DELIMETER = cc_1.CCClass.Attr.DELIMETER;
const ASSET_PROPS_KEY = ASSET_PROPS + DELIMETER + ASSET_PROPS;
const ASSET_LOAD_TIMEOUT = 10_000;
// the asset changed listener
// 这里的回调需要完全由使用者自己维护，AssetLibrary只负责调用。
const assetListener = (cc_1.assetManager.assetListener = new callbacks_invoker_1.CallbacksInvoker());
function removeCaches(uuid) {
    if (cc_1.assetManager.assets.has(uuid)) {
        cc_1.assetManager.releaseAsset(cc_1.assetManager.assets.get(uuid));
    }
}
function getPropertyDescriptorAndOwner(obj, name) {
    while (obj) {
        const pd = Object.getOwnPropertyDescriptor(obj, name);
        if (pd) {
            return { owner: obj, pd };
        }
        obj = Object.getPrototypeOf(obj);
    }
    return null;
}
/**
 * 替换资源属性的setter，加入事件监听
 * @param ctor 构造函数
 * @param name 属性名
 */
function forceSetterNotify(ctor, name) {
    const data = getPropertyDescriptorAndOwner(ctor.prototype, name);
    if (!data) {
        console.warn('Failed to get property descriptor of %s.%s', cc_1.js.getClassName(ctor), name);
        return;
    }
    if (data.owner._modifiedSetters && data.owner._modifiedSetters.includes(name)) {
        return;
    }
    const pd = data.pd;
    if (pd.configurable === false) {
        console.warn('Failed to register notifier for %s.%s', cc_1.js.getClassName(ctor), name);
        return;
    }
    if ('value' in pd) {
        console.warn('Cannot watch instance variable of %s.%s', cc_1.js.getClassName(ctor), name);
        return;
    }
    const setter = pd.set;
    pd.set = function (value, forceRefresh) {
        // forceRefresh 如果为 true，那么哪怕资源的引用不变，也应该强制更新资源
        // @ts-ignore
        setter.call(this, value, forceRefresh);
        // this指向当前调用set的component
        // @ts-ignore
        if (this._watcherHandle) {
            // 实际保存后的值（鬼知道 setter 里面会做什么）
            // @ts-ignore
            const realUsedValue = this[name];
            const uuids = getUuidsOfPropValue(realUsedValue);
            // @ts-ignore
            this._watcherHandle.changeWatchAsset(name, uuids);
        }
    };
    Object.defineProperty(data.owner, name, pd);
    // 修改过setter后打个标记，防止重复修改setter造成多层嵌套
    if (data.owner._modifiedSetters) {
        data.owner._modifiedSetters.push(name);
    }
    else {
        data.owner._modifiedSetters = [name];
    }
}
function invokeAssetSetter(obj, propName, assetOrUrl) {
    obj = obj.deref();
    if (!obj)
        return;
    const pd = cc_1.js.getPropertyDescriptor(obj, propName);
    let newData = assetOrUrl;
    if (pd && pd.get) {
        const data = pd.get.call(obj);
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                if (data[i] && assetOrUrl && data[i]._uuid === assetOrUrl._uuid) {
                    data[i] = assetOrUrl;
                }
            }
            newData = data;
        }
        if (pd.set) {
            const forceRefresh = true;
            try {
                // 如果是数组，需要清空该数组，防止数组内判断资源是否修改的判断阻止更新
                if (Array.isArray(data)) {
                    // @ts-ignore
                    pd.set.call(obj, new Array(newData.length).fill(null), 
                    // @ts-ignore
                    forceRefresh);
                }
            }
            catch (e) {
                console.error(e);
            }
            // @ts-ignore
            pd.set.call(obj, newData, forceRefresh);
            // 发出 asset-refresh的消息
            if (assetOrUrl._uuid) {
                core_1.ServiceEvents.emit('asset-refresh', assetOrUrl._uuid);
            }
        }
    }
    else {
        // animation graph 问题先绕过
        if (obj && obj.constructor && obj.constructor.name === 'AnimationController' && propName === 'graph') {
            obj[propName] = newData;
        }
    }
}
function getUuidsOfPropValue(val) {
    const uuids = [];
    if (Array.isArray(val)) {
        for (const data of val) {
            if (data instanceof cc_1.Asset && data._uuid) {
                uuids.push(data._uuid);
            }
        }
    }
    else if (val instanceof cc_1.Asset && val._uuid) {
        uuids.push(val._uuid);
    }
    return uuids;
}
class AssetWatcher {
    owner = null;
    active = false;
    watchingInfos = Object.create(null);
    constructor(owner) {
        this.owner = owner;
    }
    start() {
        this.active = true;
        const owner = this.owner;
        const ctor = owner.constructor;
        const assetPropsData = cc_1.CCClass.Attr.getClassAttrs(ctor)[ASSET_PROPS_KEY];
        for (const propPath of assetPropsData.assetProps) {
            const propName = propPath[0];
            forceSetterNotify(ctor, propName);
            const val = owner[propName];
            const uuids = getUuidsOfPropValue(val);
            this.registerListener(uuids, owner, propName);
        }
    }
    stop() {
        this.active = false;
        for (const name in this.watchingInfos) {
            if (!(name in this.watchingInfos)) {
                continue;
            }
            const info = this.watchingInfos[name];
            if (info) {
                for (const uuid of info.uuids) {
                    assetListener.off(uuid, info.callback);
                }
            }
        }
        this.watchingInfos = Object.create(null);
    }
    changeWatchAsset(propName, newUuids) {
        if (!this.active) {
            return;
        }
        // unRegister old
        this.unRegisterListener(propName);
        // register new
        if (newUuids.length > 0) {
            this.registerListener(newUuids, this.owner, propName);
        }
    }
    registerListener(uuids, owner, propName) {
        this.unRegisterListener(propName);
        const onDirty = invokeAssetSetter.bind(null, new WeakRef(owner), propName);
        for (const uuid of uuids) {
            assetListener.on(uuid, onDirty);
        }
        this.watchingInfos[propName] = {
            uuids,
            callback: onDirty,
        };
    }
    unRegisterListener(propName) {
        const info = this.watchingInfos[propName];
        if (info) {
            for (const uuid of info.uuids) {
                // @ts-ignore
                assetListener.off(uuid, info.callback);
            }
            this.watchingInfos[propName] = undefined;
        }
    }
}
/**
 * 递归遍历一个ccClass，找出所有可编辑的cc.Asset属性路径
 * @param ctor ccClass的构造函数
 * @param propPath 属性路径数组
 * @param parentTypes 已经遍历过的类型，防止循环引用
 */
function parseAssetProps(ctor, propPath, parentTypes) {
    let assetProps = null;
    // const ctor = obj.constructor;
    // 防止循环引用
    const type = cc_1.js.getClassName(ctor);
    if (parentTypes.includes(type)) {
        return null;
    }
    // TODO：目前数组的元素如果是一个自定义的ccClass，此处会为空
    if (!ctor.__props__) {
        return null;
    }
    const attrs = cc_1.CCClass.Attr.getClassAttrs(ctor);
    parentTypes = parentTypes.concat(type);
    for (let i = 0, props = ctor.__props__; i < props.length; i++) {
        const propName = props[i];
        const attrKey = propName + DELIMETER;
        // 需要筛选出是引擎内可编辑的属性
        if ((attrs[attrKey + 'hasSetter'] && attrs[attrKey + 'hasGetter']) ||
            // animation graph 问题先绕过
            (ctor.name === 'AnimationController' && propName === 'graph')) {
            const propCtor = attrs[attrKey + 'ctor'];
            const isAssetType = /*propValue instanceof Asset || */ cc_1.js.isChildClassOf(propCtor, cc_1.Asset);
            const fullPath = propPath.concat(propName);
            if (isAssetType) {
                if (assetProps) {
                    assetProps.push(fullPath);
                }
                else {
                    assetProps = [fullPath];
                }
            }
            else if (cc_1.CCClass._isCCClass(propCtor)) {
                // 递归处理非asset的ccClass
                const props = parseAssetProps(propCtor, fullPath, parentTypes);
                if (props) {
                    if (assetProps) {
                        assetProps = assetProps.concat(props);
                    }
                    else {
                        assetProps = props;
                    }
                }
            }
        }
    }
    return assetProps;
}
function getAssetPropsData(obj) {
    let assetPropsData = cc_1.CCClass.Attr.getClassAttrs(obj.constructor)[ASSET_PROPS_KEY];
    if (assetPropsData === undefined) {
        const assetProps = parseAssetProps(obj.constructor, [], []);
        assetPropsData = {};
        if (assetProps) {
            for (const propPath of assetProps) {
                if (propPath.length > 1) {
                    if (assetPropsData.nestedAssetProps) {
                        assetPropsData.nestedAssetProps.push(propPath);
                    }
                    else {
                        assetPropsData.nestedAssetProps = [propPath];
                    }
                }
                else if (propPath.length === 1) {
                    if (assetPropsData.assetProps) {
                        assetPropsData.assetProps.push(propPath);
                    }
                    else {
                        assetPropsData.assetProps = [propPath];
                    }
                }
            }
        }
        cc_1.CCClass.Attr.setClassAttr(obj.constructor, ASSET_PROPS, ASSET_PROPS, assetPropsData);
    }
    return assetPropsData;
}
/**
 * 根据一个path数组，获得一个属性的值
 * @param obj 对象
 * @param propPath 路径数组
 */
function getPropObj(obj, propPath) {
    let propObj = obj;
    for (let i = 0; i < propPath.length; i++) {
        const path = propPath[i];
        if (propObj) {
            propObj = propObj[path];
        }
        if (!propObj) {
            return null;
        }
    }
    return propObj;
}
/**
 * 遍历第二级的CCAsset
 * @param obj 对象
 * @param callback 回调
 */
function walkNestedAssetProp(obj, callback) {
    const assetPropsData = getAssetPropsData(obj);
    if (assetPropsData && assetPropsData.nestedAssetProps) {
        for (const propPath of assetPropsData.nestedAssetProps) {
            const pathKeys = propPath.concat();
            const propName = pathKeys.pop();
            let owner = obj;
            if (pathKeys.length > 0) {
                owner = getPropObj(owner, pathKeys);
                if (owner) {
                    callback(owner);
                }
            }
        }
    }
}
/**
 * 更新所有引用该资源的资源
 * @param uuid
 * @param asset
 * @param processedAssets 保存处理过的资源，防止循环引用
 */
function updateAsset(uuid, asset, processedAssets = []) {
    if (cc_1.assetManager.references.has(uuid)) {
        const references = cc_1.assetManager.references.get(uuid);
        for (let i = 0, l = references.length; i < l; i++) {
            const reference = references[i];
            const owner_asset = reference[0].deref();
            const owner = reference[1].deref();
            const prop = reference[2];
            if (!owner || !owner_asset) {
                continue;
            }
            if (processedAssets.includes(owner_asset)) {
                continue;
            }
            if (!(0, cc_1.isValid)(owner_asset, true)) {
                continue;
            }
            if (owner_asset instanceof cc_1.Material && (asset instanceof cc_1.Texture2D || asset instanceof cc_1.TextureCube)) {
                owner_asset.setProperty(prop, asset);
            }
            else {
                owner[prop] = asset;
                owner_asset.onLoaded && owner_asset.onLoaded();
            }
            assetListener.emit(owner_asset._uuid, owner_asset, asset?.uuid);
            processedAssets.push(owner_asset);
            // 引用的资源修改了，需要递归调用
            updateAsset(owner_asset._uuid, owner_asset, processedAssets);
        }
    }
}
class AssetUpdater {
    lockNum = 0;
    timer = null;
    flushPromise = null;
    resolveFlush = null;
    lock() {
        if (this.lockNum === 0 && !this.flushPromise) {
            this.flushPromise = new Promise((resolve) => {
                this.resolveFlush = resolve;
            });
        }
        this.lockNum++;
        clearTimeout(this.timer);
    }
    unlock() {
        this.lockNum--;
        if (this.lockNum === 0) {
            this.timer = setTimeout(() => {
                try {
                    this.update();
                }
                finally {
                    this.resolveFlush?.();
                    this.resolveFlush = null;
                    this.flushPromise = null;
                }
            }, 400);
        }
    }
    waitForFlush() {
        return this.flushPromise ?? Promise.resolve();
    }
    update() {
        this.queue.forEach((asset, uuid) => {
            // console.log(`更新资源 ${uuid}`);
            if (asset) {
                assetListener.emit(uuid, asset);
            }
            else {
                assetListener.emit(uuid, null);
                assetListener.off(uuid);
            }
            updateAsset(uuid, asset);
        });
        this.queue.clear();
    }
    queue = new Map();
    add(uuid, asset) {
        this.queue.set(uuid, asset);
    }
    remove(uuid) {
        this.queue.delete(uuid);
    }
    clearQueue() {
        this.queue.clear();
    }
}
class AssetWatcherManager {
    updater = new AssetUpdater();
    generation = 0;
    watchers = new Set();
    invalidate() {
        this.generation++;
        this.watchers.forEach((watcher) => watcher.stop());
        this.watchers.clear();
        assetListener.removeAllListeners();
        this.updater.clearQueue();
    }
    initHandle(obj) {
        const assetPropsData = getAssetPropsData(obj);
        obj._watcherHandle = assetPropsData && assetPropsData.assetProps ? new AssetWatcher(obj) : undefined;
        walkNestedAssetProp(obj, (owner) => {
            this.initHandle(owner);
        });
    }
    startWatch(obj) {
        if (!obj._watcherHandle) {
            this.initHandle(obj);
        }
        if (obj._watcherHandle) {
            this.watchers.add(obj._watcherHandle);
            obj._watcherHandle.start();
        }
        walkNestedAssetProp(obj, (owner) => {
            this.startWatch(owner);
        });
    }
    stopWatch(obj) {
        if (obj._watcherHandle) {
            obj._watcherHandle.stop();
        }
        walkNestedAssetProp(obj, (owner) => {
            this.stopWatch(owner);
        });
    }
    isTextureCubeSubImageAsset(uuid) {
        return uuid.endsWith('@74afd')
            || uuid.endsWith('@8fd34')
            || uuid.endsWith('@bb97f')
            || uuid.endsWith('@7d38f')
            || uuid.endsWith('@e9a6d')
            || uuid.endsWith('@40c10');
    }
    async onAssetChanged(uuid) {
        const generation = this.generation;
        const info = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [uuid]);
        if (!info || generation !== this.generation) {
            return;
        }
        // 如果是 texture，则 release 掉所依赖的 ImageAsset
        // TODO: 目前这是个 Hack 方式， 在此issue讨论：https://github.com/cocos-creator/3d-tasks/issues/4503
        if (uuid.endsWith('@6c48a')) {
            const end = uuid.indexOf('@');
            const imageAssetUuid = uuid.substring(0, end);
            removeCaches(imageAssetUuid);
        }
        // 清除textureCube依赖的imageAsset缓存，临时解决方案，相关issue：https://github.com/cocos/3d-tasks/issues/12569
        if (!assetListener.hasEventListener(uuid) && !cc_1.assetManager.references.has(uuid) && !this.isTextureCubeSubImageAsset(uuid)) {
            return;
        }
        const oldAsset = cc_1.assetManager.assets.get(uuid);
        removeCaches(uuid);
        this.updater.lock();
        try {
            const asset = await this.loadAsset(uuid);
            if (generation !== this.generation) {
                this.discardCachedAsset(uuid, asset);
                return;
            }
            if (oldAsset && asset && oldAsset.constructor.name !== asset.constructor.name) {
                this.updater.add(uuid, null);
                // tslint:disable-next-line: max-line-length
                console.warn('The asset type has been modified, and emptied the original reference in the scene.');
            }
            else {
                this.updater.add(uuid, asset);
            }
        }
        catch (error) {
            console.error(error);
        }
        finally {
            this.updater.unlock();
        }
        await this.updater.waitForFlush();
    }
    discardCachedAsset(uuid, asset) {
        if (cc_1.assetManager.assets.get(uuid) === asset) {
            cc_1.assetManager.releaseAsset(asset);
        }
    }
    loadAsset(uuid) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const finish = (callback) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timer);
                callback();
            };
            const timer = setTimeout(() => {
                finish(() => reject(new Error(`Asset load timeout: ${uuid}`)));
            }, ASSET_LOAD_TIMEOUT);
            cc_1.assetManager.loadAny(uuid, (err, asset) => {
                if (settled) {
                    if (!err && asset) {
                        this.discardCachedAsset(uuid, asset);
                    }
                    return;
                }
                if (err) {
                    finish(() => reject(err));
                    return;
                }
                finish(() => resolve(asset));
            });
        });
    }
    onAssetDeleted(uuid) {
        const oldAsset = cc_1.assetManager.assets.get(uuid);
        if (oldAsset) {
            const placeHolder = new oldAsset.constructor();
            placeHolder.initDefault(uuid);
            assetListener.emit(uuid, placeHolder);
        }
        removeCaches(uuid);
    }
}
const assetWatcherManager = new AssetWatcherManager();
exports.assetWatcherManager = assetWatcherManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtd2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9hc3NldC9hc3NldC13YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJCQUE4RztBQUM5RywyREFBdUQ7QUFDdkQsa0NBQXdDO0FBRXhDLG1DQUFnQztBQUVoQyxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7QUFDakMsTUFBTSxTQUFTLEdBQUcsWUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDekMsTUFBTSxlQUFlLEdBQUcsV0FBVyxHQUFHLFNBQVMsR0FBRyxXQUFXLENBQUM7QUFDOUQsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLENBQUM7QUFZbEMsNkJBQTZCO0FBQzdCLHVDQUF1QztBQUN2QyxNQUFNLGFBQWEsR0FBRyxDQUFDLGlCQUFZLENBQUMsYUFBYSxHQUFHLElBQUksb0NBQWdCLEVBQUUsQ0FBQyxDQUFDO0FBRTVFLFNBQVMsWUFBWSxDQUFDLElBQVk7SUFDOUIsSUFBSSxpQkFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNoQyxpQkFBWSxDQUFDLFlBQVksQ0FBQyxpQkFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQztJQUM5RCxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsNkJBQTZCLENBQUMsR0FBUSxFQUFFLElBQVM7SUFDdEQsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNULE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEQsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFDRCxH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Q0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7Q0FDSjtBQUVELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO0FBRTdDLGtEQUFtQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0LCBhc3NldE1hbmFnZXIsIENDQ2xhc3MsIENvbnN0cnVjdG9yLCBpc1ZhbGlkLCBqcywgTWF0ZXJpYWwsIFRleHR1cmUyRCwgVGV4dHVyZUN1YmUgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBDYWxsYmFja3NJbnZva2VyIH0gZnJvbSAnLi9jYWxsYmFja3MtaW52b2tlcic7XG5pbXBvcnQgeyBTZXJ2aWNlRXZlbnRzIH0gZnJvbSAnLi4vY29yZSc7XG5pbXBvcnQgeyBJQXNzZXRFdmVudHMgfSBmcm9tICcuLi8uLi8uLi9jb21tb24nO1xuaW1wb3J0IHsgUnBjIH0gZnJvbSAnLi4vLi4vcnBjJztcblxuY29uc3QgQVNTRVRfUFJPUFMgPSAnQSQkRVRwcm9wcyc7XG5jb25zdCBERUxJTUVURVIgPSBDQ0NsYXNzLkF0dHIuREVMSU1FVEVSO1xuY29uc3QgQVNTRVRfUFJPUFNfS0VZID0gQVNTRVRfUFJPUFMgKyBERUxJTUVURVIgKyBBU1NFVF9QUk9QUztcbmNvbnN0IEFTU0VUX0xPQURfVElNRU9VVCA9IDEwXzAwMDtcblxuZGVjbGFyZSBjbGFzcyBXZWFrUmVmIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqOiBhbnkpO1xufVxuXG5kZWNsYXJlIG1vZHVsZSAnY2MnIHtcbiAgICBleHBvcnQgaW50ZXJmYWNlIEFzc2V0TWFuYWdlciB7XG4gICAgICAgIGFzc2V0TGlzdGVuZXI6IENhbGxiYWNrc0ludm9rZXI7XG4gICAgfVxufVxuXG4vLyB0aGUgYXNzZXQgY2hhbmdlZCBsaXN0ZW5lclxuLy8g6L+Z6YeM55qE5Zue6LCD6ZyA6KaB5a6M5YWo55Sx5L2/55So6ICF6Ieq5bex57u05oqk77yMQXNzZXRMaWJyYXJ55Y+q6LSf6LSj6LCD55So44CCXG5jb25zdCBhc3NldExpc3RlbmVyID0gKGFzc2V0TWFuYWdlci5hc3NldExpc3RlbmVyID0gbmV3IENhbGxiYWNrc0ludm9rZXIoKSk7XG5cbmZ1bmN0aW9uIHJlbW92ZUNhY2hlcyh1dWlkOiBzdHJpbmcpIHtcbiAgICBpZiAoYXNzZXRNYW5hZ2VyLmFzc2V0cy5oYXModXVpZCkpIHtcbiAgICAgICAgYXNzZXRNYW5hZ2VyLnJlbGVhc2VBc3NldChhc3NldE1hbmFnZXIuYXNzZXRzLmdldCh1dWlkKSEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0UHJvcGVydHlEZXNjcmlwdG9yQW5kT3duZXIob2JqOiBhbnksIG5hbWU6IGFueSkge1xuICAgIHdoaWxlIChvYmopIHtcbiAgICAgICAgY29uc3QgcGQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwgbmFtZSk7XG4gICAgICAgIGlmIChwZCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgb3duZXI6IG9iaiwgcGQgfTtcbiAgICAgICAgfVxuICAgICAgICBvYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICog5pu/5o2i6LWE5rqQ5bGe5oCn55qEc2V0dGVy77yM5Yqg5YWl5LqL5Lu255uR5ZCsXG4gKiBAcGFyYW0gY3RvciDmnoTpgKDlh73mlbBcbiAqIEBwYXJhbSBuYW1lIOWxnuaAp+WQjVxuICovXG5mdW5jdGlvbiBmb3JjZVNldHRlck5vdGlmeShjdG9yOiBGdW5jdGlvbiwgbmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZGF0YSA9IGdldFByb3BlcnR5RGVzY3JpcHRvckFuZE93bmVyKGN0b3IucHJvdG90eXBlLCBuYW1lKTtcbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gZ2V0IHByb3BlcnR5IGRlc2NyaXB0b3Igb2YgJXMuJXMnLCBqcy5nZXRDbGFzc05hbWUoY3RvciksIG5hbWUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGRhdGEub3duZXIuX21vZGlmaWVkU2V0dGVycyAmJiBkYXRhLm93bmVyLl9tb2RpZmllZFNldHRlcnMuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwZCA9IGRhdGEucGQ7XG4gICAgaWYgKHBkLmNvbmZpZ3VyYWJsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gcmVnaXN0ZXIgbm90aWZpZXIgZm9yICVzLiVzJywganMuZ2V0Q2xhc3NOYW1lKGN0b3IpLCBuYW1lKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoJ3ZhbHVlJyBpbiBwZCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0Nhbm5vdCB3YXRjaCBpbnN0YW5jZSB2YXJpYWJsZSBvZiAlcy4lcycsIGpzLmdldENsYXNzTmFtZShjdG9yKSwgbmFtZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZXR0ZXIgPSBwZC5zZXQ7XG4gICAgcGQuc2V0ID0gZnVuY3Rpb24odmFsdWU6IGFueSwgZm9yY2VSZWZyZXNoPzogYm9vbGVhbikge1xuICAgICAgICAvLyBmb3JjZVJlZnJlc2gg5aaC5p6c5Li6IHRydWXvvIzpgqPkuYjlk6rmgJXotYTmupDnmoTlvJXnlKjkuI3lj5jvvIzkuZ/lupTor6XlvLrliLbmm7TmlrDotYTmupBcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBzZXR0ZXIuY2FsbCh0aGlzLCB2YWx1ZSwgZm9yY2VSZWZyZXNoKTtcblxuICAgICAgICAvLyB0aGlz5oyH5ZCR5b2T5YmN6LCD55Soc2V055qEY29tcG9uZW50XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKHRoaXMuX3dhdGNoZXJIYW5kbGUpIHtcbiAgICAgICAgICAgIC8vIOWunumZheS/neWtmOWQjueahOWAvO+8iOmsvOefpemBkyBzZXR0ZXIg6YeM6Z2i5Lya5YGa5LuA5LmI77yJXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCByZWFsVXNlZFZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICAgICAgICAgIGNvbnN0IHV1aWRzID0gZ2V0VXVpZHNPZlByb3BWYWx1ZShyZWFsVXNlZFZhbHVlKTtcblxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGhpcy5fd2F0Y2hlckhhbmRsZS5jaGFuZ2VXYXRjaEFzc2V0KG5hbWUsIHV1aWRzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRhdGEub3duZXIsIG5hbWUsIHBkKTtcblxuICAgIC8vIOS/ruaUuei/h3NldHRlcuWQjuaJk+S4quagh+iusO+8jOmYsuatoumHjeWkjeS/ruaUuXNldHRlcumAoOaIkOWkmuWxguW1jOWll1xuICAgIGlmIChkYXRhLm93bmVyLl9tb2RpZmllZFNldHRlcnMpIHtcbiAgICAgICAgZGF0YS5vd25lci5fbW9kaWZpZWRTZXR0ZXJzLnB1c2gobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGF0YS5vd25lci5fbW9kaWZpZWRTZXR0ZXJzID0gW25hbWVdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQXNzZXRTZXR0ZXIob2JqOiBhbnksIHByb3BOYW1lOiBzdHJpbmcsIGFzc2V0T3JVcmw6IGFueSkge1xuICAgIG9iaiA9IG9iai5kZXJlZigpO1xuICAgIGlmICghb2JqKSByZXR1cm47XG4gICAgY29uc3QgcGQgPSBqcy5nZXRQcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBwcm9wTmFtZSk7XG4gICAgbGV0IG5ld0RhdGEgPSBhc3NldE9yVXJsO1xuXG4gICAgaWYgKHBkICYmIHBkLmdldCkge1xuICAgICAgICBjb25zdCBkYXRhID0gcGQuZ2V0LmNhbGwob2JqKTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhW2ldICYmIGFzc2V0T3JVcmwgJiYgZGF0YVtpXS5fdXVpZCA9PT0gYXNzZXRPclVybC5fdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldID0gYXNzZXRPclVybDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ld0RhdGEgPSBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBkLnNldCkge1xuICAgICAgICAgICAgY29uc3QgZm9yY2VSZWZyZXNoID0gdHJ1ZTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmmK/mlbDnu4TvvIzpnIDopoHmuIXnqbror6XmlbDnu4TvvIzpmLLmraLmlbDnu4TlhoXliKTmlq3otYTmupDmmK/lkKbkv67mlLnnmoTliKTmlq3pmLvmraLmm7TmlrBcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIHBkLnNldC5jYWxsKFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEFycmF5KG5ld0RhdGEubGVuZ3RoKS5maWxsKG51bGwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VSZWZyZXNoLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgcGQuc2V0LmNhbGwob2JqLCBuZXdEYXRhLCBmb3JjZVJlZnJlc2gpO1xuXG4gICAgICAgICAgICAvLyDlj5Hlh7ogYXNzZXQtcmVmcmVzaOeahOa2iOaBr1xuICAgICAgICAgICAgaWYgKGFzc2V0T3JVcmwuX3V1aWQpIHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlRXZlbnRzLmVtaXQ8SUFzc2V0RXZlbnRzPignYXNzZXQtcmVmcmVzaCcsIGFzc2V0T3JVcmwuX3V1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYW5pbWF0aW9uIGdyYXBoIOmXrumimOWFiOe7lei/h1xuICAgICAgICBpZiAob2JqICYmIG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ0FuaW1hdGlvbkNvbnRyb2xsZXInICYmIHByb3BOYW1lID09PSAnZ3JhcGgnKSB7XG4gICAgICAgICAgICBvYmpbcHJvcE5hbWVdID0gbmV3RGF0YTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0VXVpZHNPZlByb3BWYWx1ZSh2YWw6IGFueSk6IGFueVtdIHtcbiAgICBjb25zdCB1dWlkczogYW55W10gPSBbXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGF0YSBvZiB2YWwpIHtcbiAgICAgICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXNzZXQgJiYgZGF0YS5fdXVpZCkge1xuICAgICAgICAgICAgICAgIHV1aWRzLnB1c2goZGF0YS5fdXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIEFzc2V0ICYmIHZhbC5fdXVpZCkge1xuICAgICAgICB1dWlkcy5wdXNoKHZhbC5fdXVpZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHV1aWRzO1xufVxuXG5jbGFzcyBBc3NldFdhdGNoZXIge1xuICAgIHB1YmxpYyBvd25lcjogYW55ID0gbnVsbDtcbiAgICBwcml2YXRlIGFjdGl2ZSA9IGZhbHNlO1xuICAgIHB1YmxpYyB3YXRjaGluZ0luZm9zOiB7IFtpbmRleDogc3RyaW5nXTogYW55IH0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgY29uc3RydWN0b3Iob3duZXI6IGFueSkge1xuICAgICAgICB0aGlzLm93bmVyID0gb3duZXI7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0KCkge1xuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIGNvbnN0IG93bmVyID0gdGhpcy5vd25lcjtcbiAgICAgICAgY29uc3QgY3RvciA9IG93bmVyLmNvbnN0cnVjdG9yO1xuICAgICAgICBjb25zdCBhc3NldFByb3BzRGF0YSA9IENDQ2xhc3MuQXR0ci5nZXRDbGFzc0F0dHJzKGN0b3IpW0FTU0VUX1BST1BTX0tFWV07XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wUGF0aCBvZiBhc3NldFByb3BzRGF0YS5hc3NldFByb3BzKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHByb3BQYXRoWzBdO1xuXG4gICAgICAgICAgICBmb3JjZVNldHRlck5vdGlmeShjdG9yLCBwcm9wTmFtZSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IG93bmVyW3Byb3BOYW1lXTtcbiAgICAgICAgICAgIGNvbnN0IHV1aWRzID0gZ2V0VXVpZHNPZlByb3BWYWx1ZSh2YWwpO1xuICAgICAgICAgICAgdGhpcy5yZWdpc3Rlckxpc3RlbmVyKHV1aWRzLCBvd25lciwgcHJvcE5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiB0aGlzLndhdGNoaW5nSW5mb3MpIHtcbiAgICAgICAgICAgIGlmICghKG5hbWUgaW4gdGhpcy53YXRjaGluZ0luZm9zKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMud2F0Y2hpbmdJbmZvc1tuYW1lXTtcbiAgICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIGluZm8udXVpZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRMaXN0ZW5lci5vZmYodXVpZCwgaW5mby5jYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMud2F0Y2hpbmdJbmZvcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNoYW5nZVdhdGNoQXNzZXQocHJvcE5hbWU6IHN0cmluZywgbmV3VXVpZHM6IFtdKSB7XG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVuUmVnaXN0ZXIgb2xkXG4gICAgICAgIHRoaXMudW5SZWdpc3Rlckxpc3RlbmVyKHByb3BOYW1lKTtcblxuICAgICAgICAvLyByZWdpc3RlciBuZXdcbiAgICAgICAgaWYgKG5ld1V1aWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJMaXN0ZW5lcihuZXdVdWlkcywgdGhpcy5vd25lciwgcHJvcE5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWdpc3Rlckxpc3RlbmVyKHV1aWRzOiBhbnlbXSwgb3duZXI6IGFueSwgcHJvcE5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLnVuUmVnaXN0ZXJMaXN0ZW5lcihwcm9wTmFtZSk7XG5cbiAgICAgICAgY29uc3Qgb25EaXJ0eSA9IGludm9rZUFzc2V0U2V0dGVyLmJpbmQobnVsbCwgbmV3IFdlYWtSZWYob3duZXIpLCBwcm9wTmFtZSk7XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiB1dWlkcykge1xuICAgICAgICAgICAgYXNzZXRMaXN0ZW5lci5vbih1dWlkLCBvbkRpcnR5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMud2F0Y2hpbmdJbmZvc1twcm9wTmFtZV0gPSB7XG4gICAgICAgICAgICB1dWlkcyxcbiAgICAgICAgICAgIGNhbGxiYWNrOiBvbkRpcnR5LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgdW5SZWdpc3Rlckxpc3RlbmVyKHByb3BOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMud2F0Y2hpbmdJbmZvc1twcm9wTmFtZV07XG5cbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBpbmZvLnV1aWRzKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGFzc2V0TGlzdGVuZXIub2ZmKHV1aWQsIGluZm8uY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLndhdGNoaW5nSW5mb3NbcHJvcE5hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIOmAkuW9kumBjeWOhuS4gOS4qmNjQ2xhc3PvvIzmib7lh7rmiYDmnInlj6/nvJbovpHnmoRjYy5Bc3NldOWxnuaAp+i3r+W+hFxuICogQHBhcmFtIGN0b3IgY2NDbGFzc+eahOaehOmAoOWHveaVsFxuICogQHBhcmFtIHByb3BQYXRoIOWxnuaAp+i3r+W+hOaVsOe7hFxuICogQHBhcmFtIHBhcmVudFR5cGVzIOW3sue7j+mBjeWOhui/h+eahOexu+Wei++8jOmYsuatouW+queOr+W8leeUqFxuICovXG5mdW5jdGlvbiBwYXJzZUFzc2V0UHJvcHMoY3RvcjogYW55LCBwcm9wUGF0aDogc3RyaW5nW10sIHBhcmVudFR5cGVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdW10gfCBudWxsIHtcbiAgICBsZXQgYXNzZXRQcm9wczogc3RyaW5nW11bXSB8IG51bGwgPSBudWxsO1xuICAgIC8vIGNvbnN0IGN0b3IgPSBvYmouY29uc3RydWN0b3I7XG4gICAgLy8g6Ziy5q2i5b6q546v5byV55SoXG4gICAgY29uc3QgdHlwZSA9IGpzLmdldENsYXNzTmFtZShjdG9yKTtcbiAgICBpZiAocGFyZW50VHlwZXMuaW5jbHVkZXModHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gVE9ET++8muebruWJjeaVsOe7hOeahOWFg+e0oOWmguaenOaYr+S4gOS4quiHquWumuS5ieeahGNjQ2xhc3PvvIzmraTlpITkvJrkuLrnqbpcbiAgICBpZiAoIWN0b3IuX19wcm9wc19fKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGF0dHJzID0gQ0NDbGFzcy5BdHRyLmdldENsYXNzQXR0cnMoY3Rvcik7XG4gICAgcGFyZW50VHlwZXMgPSBwYXJlbnRUeXBlcy5jb25jYXQodHlwZSk7XG4gICAgZm9yIChsZXQgaSA9IDAsIHByb3BzID0gY3Rvci5fX3Byb3BzX187IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHByb3BzW2ldO1xuICAgICAgICBjb25zdCBhdHRyS2V5ID0gcHJvcE5hbWUgKyBERUxJTUVURVI7XG5cbiAgICAgICAgLy8g6ZyA6KaB562b6YCJ5Ye65piv5byV5pOO5YaF5Y+v57yW6L6R55qE5bGe5oCnXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIChhdHRyc1thdHRyS2V5ICsgJ2hhc1NldHRlciddICYmIGF0dHJzW2F0dHJLZXkgKyAnaGFzR2V0dGVyJ10pIHx8XG4gICAgICAgICAgICAvLyBhbmltYXRpb24gZ3JhcGgg6Zeu6aKY5YWI57uV6L+HXG4gICAgICAgICAgICAoY3Rvci5uYW1lID09PSAnQW5pbWF0aW9uQ29udHJvbGxlcicgJiYgcHJvcE5hbWUgPT09ICdncmFwaCcpXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgcHJvcEN0b3IgPSBhdHRyc1thdHRyS2V5ICsgJ2N0b3InXTtcbiAgICAgICAgICAgIGNvbnN0IGlzQXNzZXRUeXBlID0gLypwcm9wVmFsdWUgaW5zdGFuY2VvZiBBc3NldCB8fCAqL2pzLmlzQ2hpbGRDbGFzc09mKHByb3BDdG9yLCBBc3NldCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcHJvcFBhdGguY29uY2F0KHByb3BOYW1lKTtcbiAgICAgICAgICAgIGlmIChpc0Fzc2V0VHlwZSkge1xuICAgICAgICAgICAgICAgIGlmIChhc3NldFByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0UHJvcHMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRQcm9wcyA9IFtmdWxsUGF0aF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChDQ0NsYXNzLl9pc0NDQ2xhc3MocHJvcEN0b3IpKSB7XG4gICAgICAgICAgICAgICAgLy8g6YCS5b2S5aSE55CG6Z2eYXNzZXTnmoRjY0NsYXNzXG5cbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IHBhcnNlQXNzZXRQcm9wcyhwcm9wQ3RvciwgZnVsbFBhdGgsIHBhcmVudFR5cGVzKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0UHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0UHJvcHMgPSBhc3NldFByb3BzLmNvbmNhdChwcm9wcyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFByb3BzID0gcHJvcHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXNzZXRQcm9wcztcbn1cblxuaW50ZXJmYWNlIElBc3NldFByb3BzRGF0YSB7XG4gICAgYXNzZXRQcm9wcz86IHN0cmluZ1tdW107IC8vIOW9k+WJjU9iamVjdOS4reeahOi1hOa6kFxuICAgIG5lc3RlZEFzc2V0UHJvcHM/OiBzdHJpbmdbXVtdOyAvLyDltYzlpZflnKjlsZ7mgKfkuK3nmoTotYTmupBcbn1cblxuZnVuY3Rpb24gZ2V0QXNzZXRQcm9wc0RhdGEob2JqOiBhbnkpIHtcbiAgICBsZXQgYXNzZXRQcm9wc0RhdGE6IElBc3NldFByb3BzRGF0YSA9IENDQ2xhc3MuQXR0ci5nZXRDbGFzc0F0dHJzKG9iai5jb25zdHJ1Y3RvcilbQVNTRVRfUFJPUFNfS0VZXTtcbiAgICBpZiAoYXNzZXRQcm9wc0RhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBhc3NldFByb3BzID0gcGFyc2VBc3NldFByb3BzKG9iai5jb25zdHJ1Y3RvciwgW10sIFtdKTtcbiAgICAgICAgYXNzZXRQcm9wc0RhdGEgPSB7fTtcbiAgICAgICAgaWYgKGFzc2V0UHJvcHMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcFBhdGggb2YgYXNzZXRQcm9wcykge1xuICAgICAgICAgICAgICAgIGlmIChwcm9wUGF0aC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldFByb3BzRGF0YS5uZXN0ZWRBc3NldFByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFByb3BzRGF0YS5uZXN0ZWRBc3NldFByb3BzLnB1c2gocHJvcFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRQcm9wc0RhdGEubmVzdGVkQXNzZXRQcm9wcyA9IFtwcm9wUGF0aF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BQYXRoLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXRQcm9wc0RhdGEuYXNzZXRQcm9wcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRQcm9wc0RhdGEuYXNzZXRQcm9wcy5wdXNoKHByb3BQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0UHJvcHNEYXRhLmFzc2V0UHJvcHMgPSBbcHJvcFBhdGhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgQ0NDbGFzcy5BdHRyLnNldENsYXNzQXR0cihvYmouY29uc3RydWN0b3IsIEFTU0VUX1BST1BTLCBBU1NFVF9QUk9QUywgYXNzZXRQcm9wc0RhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBhc3NldFByb3BzRGF0YTtcbn1cblxuLyoqXG4gKiDmoLnmja7kuIDkuKpwYXRo5pWw57uE77yM6I635b6X5LiA5Liq5bGe5oCn55qE5YC8XG4gKiBAcGFyYW0gb2JqIOWvueixoVxuICogQHBhcmFtIHByb3BQYXRoIOi3r+W+hOaVsOe7hFxuICovXG5mdW5jdGlvbiBnZXRQcm9wT2JqKG9iajogYW55LCBwcm9wUGF0aDogc3RyaW5nW10pIHtcbiAgICBsZXQgcHJvcE9iaiA9IG9iajtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BQYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBwcm9wUGF0aFtpXTtcbiAgICAgICAgaWYgKHByb3BPYmopIHtcbiAgICAgICAgICAgIHByb3BPYmogPSBwcm9wT2JqW3BhdGhdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcm9wT2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwcm9wT2JqO1xufVxuXG4vKipcbiAqIOmBjeWOhuesrOS6jOe6p+eahENDQXNzZXRcbiAqIEBwYXJhbSBvYmog5a+56LGhXG4gKiBAcGFyYW0gY2FsbGJhY2sg5Zue6LCDXG4gKi9cbmZ1bmN0aW9uIHdhbGtOZXN0ZWRBc3NldFByb3Aob2JqOiBhbnksIGNhbGxiYWNrOiBGdW5jdGlvbikge1xuICAgIGNvbnN0IGFzc2V0UHJvcHNEYXRhID0gZ2V0QXNzZXRQcm9wc0RhdGEob2JqKTtcbiAgICBpZiAoYXNzZXRQcm9wc0RhdGEgJiYgYXNzZXRQcm9wc0RhdGEubmVzdGVkQXNzZXRQcm9wcykge1xuICAgICAgICBmb3IgKGNvbnN0IHByb3BQYXRoIG9mIGFzc2V0UHJvcHNEYXRhLm5lc3RlZEFzc2V0UHJvcHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGhLZXlzID0gcHJvcFBhdGguY29uY2F0KCk7XG4gICAgICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHBhdGhLZXlzLnBvcCgpO1xuICAgICAgICAgICAgbGV0IG93bmVyID0gb2JqO1xuICAgICAgICAgICAgaWYgKHBhdGhLZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBvd25lciA9IGdldFByb3BPYmoob3duZXIsIHBhdGhLZXlzKTtcbiAgICAgICAgICAgICAgICBpZiAob3duZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sob3duZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiDmm7TmlrDmiYDmnInlvJXnlKjor6XotYTmupDnmoTotYTmupBcbiAqIEBwYXJhbSB1dWlkIFxuICogQHBhcmFtIGFzc2V0IFxuICogQHBhcmFtIHByb2Nlc3NlZEFzc2V0cyDkv53lrZjlpITnkIbov4fnmoTotYTmupDvvIzpmLLmraLlvqrnjq/lvJXnlKhcbiAqL1xuZnVuY3Rpb24gdXBkYXRlQXNzZXQodXVpZDogc3RyaW5nLCBhc3NldDogQXNzZXQgfCBudWxsLCBwcm9jZXNzZWRBc3NldHM6IEFzc2V0W10gPSBbXSkge1xuICAgIGlmIChhc3NldE1hbmFnZXIucmVmZXJlbmNlcyEuaGFzKHV1aWQpKSB7XG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZXMgPSBhc3NldE1hbmFnZXIucmVmZXJlbmNlcyEuZ2V0KHV1aWQpITtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSByZWZlcmVuY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlID0gcmVmZXJlbmNlc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IG93bmVyX2Fzc2V0ID0gcmVmZXJlbmNlWzBdLmRlcmVmKCk7XG4gICAgICAgICAgICBjb25zdCBvd25lciA9IHJlZmVyZW5jZVsxXS5kZXJlZigpO1xuICAgICAgICAgICAgY29uc3QgcHJvcCA9IHJlZmVyZW5jZVsyXTtcbiAgICAgICAgICAgIGlmICghb3duZXIgfHwgIW93bmVyX2Fzc2V0KSB7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICBpZiAocHJvY2Vzc2VkQXNzZXRzLmluY2x1ZGVzKG93bmVyX2Fzc2V0KSkgeyBjb250aW51ZTsgfVxuICAgICAgICAgICAgaWYgKCFpc1ZhbGlkKG93bmVyX2Fzc2V0LCB0cnVlKSkgeyBjb250aW51ZTsgfVxuICAgICAgICAgICAgaWYgKG93bmVyX2Fzc2V0IGluc3RhbmNlb2YgTWF0ZXJpYWwgJiYgKGFzc2V0IGluc3RhbmNlb2YgVGV4dHVyZTJEIHx8IGFzc2V0IGluc3RhbmNlb2YgVGV4dHVyZUN1YmUpKSB7XG4gICAgICAgICAgICAgICAgb3duZXJfYXNzZXQuc2V0UHJvcGVydHkocHJvcCwgYXNzZXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvd25lcltwcm9wXSA9IGFzc2V0O1xuICAgICAgICAgICAgICAgIG93bmVyX2Fzc2V0Lm9uTG9hZGVkICYmIG93bmVyX2Fzc2V0Lm9uTG9hZGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhc3NldExpc3RlbmVyLmVtaXQob3duZXJfYXNzZXQuX3V1aWQsIG93bmVyX2Fzc2V0LCBhc3NldD8udXVpZCk7XG4gICAgICAgICAgICBwcm9jZXNzZWRBc3NldHMucHVzaChvd25lcl9hc3NldCk7XG4gICAgICAgICAgICAvLyDlvJXnlKjnmoTotYTmupDkv67mlLnkuobvvIzpnIDopoHpgJLlvZLosIPnlKhcbiAgICAgICAgICAgIHVwZGF0ZUFzc2V0KG93bmVyX2Fzc2V0Ll91dWlkLCBvd25lcl9hc3NldCwgcHJvY2Vzc2VkQXNzZXRzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgQXNzZXRVcGRhdGVyIHtcblxuICAgIGxvY2tOdW0gPSAwO1xuICAgIHRpbWVyOiBhbnkgPSBudWxsO1xuICAgIHByaXZhdGUgZmx1c2hQcm9taXNlOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSByZXNvbHZlRmx1c2g6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gICAgbG9jaygpIHtcbiAgICAgICAgaWYgKHRoaXMubG9ja051bSA9PT0gMCAmJiAhdGhpcy5mbHVzaFByb21pc2UpIHtcbiAgICAgICAgICAgIHRoaXMuZmx1c2hQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc29sdmVGbHVzaCA9IHJlc29sdmU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvY2tOdW0rKztcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xuICAgIH1cbiAgICB1bmxvY2soKSB7XG4gICAgICAgIHRoaXMubG9ja051bS0tO1xuICAgICAgICBpZiAodGhpcy5sb2NrTnVtID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc29sdmVGbHVzaD8uKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzb2x2ZUZsdXNoID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mbHVzaFByb21pc2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB3YWl0Rm9yRmx1c2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZsdXNoUHJvbWlzZSA/PyBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5xdWV1ZS5mb3JFYWNoKChhc3NldCwgdXVpZCkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYOabtOaWsOi1hOa6kCAke3V1aWR9YCk7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBhc3NldExpc3RlbmVyLmVtaXQodXVpZCwgYXNzZXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhc3NldExpc3RlbmVyLmVtaXQodXVpZCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgYXNzZXRMaXN0ZW5lci5vZmYodXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1cGRhdGVBc3NldCh1dWlkLCBhc3NldCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnF1ZXVlLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgcXVldWU6IE1hcDxzdHJpbmcsIEFzc2V0IHwgbnVsbD4gPSBuZXcgTWFwKCk7XG5cbiAgICBhZGQodXVpZDogc3RyaW5nLCBhc3NldDogQXNzZXQgfCBudWxsKSB7XG4gICAgICAgIHRoaXMucXVldWUuc2V0KHV1aWQsIGFzc2V0KTtcbiAgICB9XG4gICAgcmVtb3ZlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLnF1ZXVlLmRlbGV0ZSh1dWlkKTtcbiAgICB9XG5cbiAgICBjbGVhclF1ZXVlKCkge1xuICAgICAgICB0aGlzLnF1ZXVlLmNsZWFyKCk7XG4gICAgfVxuXG59XG5cbmNsYXNzIEFzc2V0V2F0Y2hlck1hbmFnZXIge1xuICAgIHVwZGF0ZXI6IEFzc2V0VXBkYXRlciA9IG5ldyBBc3NldFVwZGF0ZXIoKTtcbiAgICBwcml2YXRlIGdlbmVyYXRpb24gPSAwO1xuICAgIHByaXZhdGUgd2F0Y2hlcnMgPSBuZXcgU2V0PEFzc2V0V2F0Y2hlcj4oKTtcblxuICAgIHB1YmxpYyBpbnZhbGlkYXRlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmdlbmVyYXRpb24rKztcbiAgICAgICAgdGhpcy53YXRjaGVycy5mb3JFYWNoKCh3YXRjaGVyKSA9PiB3YXRjaGVyLnN0b3AoKSk7XG4gICAgICAgIHRoaXMud2F0Y2hlcnMuY2xlYXIoKTtcbiAgICAgICAgYXNzZXRMaXN0ZW5lci5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy51cGRhdGVyLmNsZWFyUXVldWUoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5pdEhhbmRsZShvYmo6IGFueSkge1xuICAgICAgICBjb25zdCBhc3NldFByb3BzRGF0YSA9IGdldEFzc2V0UHJvcHNEYXRhKG9iaik7XG5cbiAgICAgICAgb2JqLl93YXRjaGVySGFuZGxlID0gYXNzZXRQcm9wc0RhdGEgJiYgYXNzZXRQcm9wc0RhdGEuYXNzZXRQcm9wcyA/IG5ldyBBc3NldFdhdGNoZXIob2JqKSA6IHVuZGVmaW5lZDtcblxuICAgICAgICB3YWxrTmVzdGVkQXNzZXRQcm9wKG9iaiwgKG93bmVyOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhhbmRsZShvd25lcik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGFydFdhdGNoKG9iajogYW55KSB7XG4gICAgICAgIGlmICghb2JqLl93YXRjaGVySGFuZGxlKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRIYW5kbGUob2JqKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvYmouX3dhdGNoZXJIYW5kbGUpIHtcbiAgICAgICAgICAgIHRoaXMud2F0Y2hlcnMuYWRkKG9iai5fd2F0Y2hlckhhbmRsZSk7XG4gICAgICAgICAgICBvYmouX3dhdGNoZXJIYW5kbGUuc3RhcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdhbGtOZXN0ZWRBc3NldFByb3Aob2JqLCAob3duZXI6IGFueSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGFydFdhdGNoKG93bmVyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0b3BXYXRjaChvYmo6IGFueSkge1xuICAgICAgICBpZiAob2JqLl93YXRjaGVySGFuZGxlKSB7XG4gICAgICAgICAgICBvYmouX3dhdGNoZXJIYW5kbGUuc3RvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgd2Fsa05lc3RlZEFzc2V0UHJvcChvYmosIChvd25lcjogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0b3BXYXRjaChvd25lcik7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgaXNUZXh0dXJlQ3ViZVN1YkltYWdlQXNzZXQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1dWlkLmVuZHNXaXRoKCdANzRhZmQnKVxuICAgICAgICAgICAgfHwgdXVpZC5lbmRzV2l0aCgnQDhmZDM0JylcbiAgICAgICAgICAgIHx8IHV1aWQuZW5kc1dpdGgoJ0BiYjk3ZicpXG4gICAgICAgICAgICB8fCB1dWlkLmVuZHNXaXRoKCdAN2QzOGYnKVxuICAgICAgICAgICAgfHwgdXVpZC5lbmRzV2l0aCgnQGU5YTZkJylcbiAgICAgICAgICAgIHx8IHV1aWQuZW5kc1dpdGgoJ0A0MGMxMCcpO1xuICAgIH1cbiAgICBwdWJsaWMgYXN5bmMgb25Bc3NldENoYW5nZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGdlbmVyYXRpb24gPSB0aGlzLmdlbmVyYXRpb247XG4gICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAncXVlcnlBc3NldEluZm8nLCBbdXVpZF0pO1xuICAgICAgICBpZiAoIWluZm8gfHwgZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzmmK8gdGV4dHVyZe+8jOWImSByZWxlYXNlIOaOieaJgOS+nei1lueahCBJbWFnZUFzc2V0XG4gICAgICAgIC8vIFRPRE86IOebruWJjei/meaYr+S4qiBIYWNrIOaWueW8j++8jCDlnKjmraRpc3N1ZeiuqOiuuu+8mmh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy1jcmVhdG9yLzNkLXRhc2tzL2lzc3Vlcy80NTAzXG4gICAgICAgIGlmICh1dWlkLmVuZHNXaXRoKCdANmM0OGEnKSkge1xuICAgICAgICAgICAgY29uc3QgZW5kID0gdXVpZC5pbmRleE9mKCdAJyk7XG4gICAgICAgICAgICBjb25zdCBpbWFnZUFzc2V0VXVpZCA9IHV1aWQuc3Vic3RyaW5nKDAsIGVuZCk7XG4gICAgICAgICAgICByZW1vdmVDYWNoZXMoaW1hZ2VBc3NldFV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5riF6ZmkdGV4dHVyZUN1YmXkvp3otZbnmoRpbWFnZUFzc2V057yT5a2Y77yM5Li05pe26Kej5Yaz5pa55qGI77yM55u45YWzaXNzdWXvvJpodHRwczovL2dpdGh1Yi5jb20vY29jb3MvM2QtdGFza3MvaXNzdWVzLzEyNTY5XG5cbiAgICAgICAgaWYgKCFhc3NldExpc3RlbmVyLmhhc0V2ZW50TGlzdGVuZXIodXVpZCkgJiYgIWFzc2V0TWFuYWdlci5yZWZlcmVuY2VzIS5oYXModXVpZCkgJiYgIXRoaXMuaXNUZXh0dXJlQ3ViZVN1YkltYWdlQXNzZXQodXVpZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9sZEFzc2V0ID0gYXNzZXRNYW5hZ2VyLmFzc2V0cy5nZXQodXVpZCk7XG4gICAgICAgIHJlbW92ZUNhY2hlcyh1dWlkKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZXIubG9jaygpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCB0aGlzLmxvYWRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2NhcmRDYWNoZWRBc3NldCh1dWlkLCBhc3NldCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9sZEFzc2V0ICYmIGFzc2V0ICYmIG9sZEFzc2V0LmNvbnN0cnVjdG9yLm5hbWUgIT09IGFzc2V0LmNvbnN0cnVjdG9yLm5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZXIuYWRkKHV1aWQsIG51bGwpO1xuICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWF4LWxpbmUtbGVuZ3RoXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdUaGUgYXNzZXQgdHlwZSBoYXMgYmVlbiBtb2RpZmllZCwgYW5kIGVtcHRpZWQgdGhlIG9yaWdpbmFsIHJlZmVyZW5jZSBpbiB0aGUgc2NlbmUuJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlci5hZGQodXVpZCwgYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZXIudW5sb2NrKCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVyLndhaXRGb3JGbHVzaCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZGlzY2FyZENhY2hlZEFzc2V0KHV1aWQ6IHN0cmluZywgYXNzZXQ6IEFzc2V0KTogdm9pZCB7XG4gICAgICAgIGlmIChhc3NldE1hbmFnZXIuYXNzZXRzLmdldCh1dWlkKSA9PT0gYXNzZXQpIHtcbiAgICAgICAgICAgIGFzc2V0TWFuYWdlci5yZWxlYXNlQXNzZXQoYXNzZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsb2FkQXNzZXQodXVpZDogc3RyaW5nKTogUHJvbWlzZTxBc3NldD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHNldHRsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGZpbmlzaCA9IChjYWxsYmFjazogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZmluaXNoKCgpID0+IHJlamVjdChuZXcgRXJyb3IoYEFzc2V0IGxvYWQgdGltZW91dDogJHt1dWlkfWApKSk7XG4gICAgICAgICAgICB9LCBBU1NFVF9MT0FEX1RJTUVPVVQpO1xuXG4gICAgICAgICAgICBhc3NldE1hbmFnZXIubG9hZEFueSh1dWlkLCAoZXJyOiBFcnJvciB8IG51bGwsIGFzc2V0OiBBc3NldCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZXJyICYmIGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc2NhcmRDYWNoZWRBc3NldCh1dWlkLCBhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbmlzaCgoKSA9PiByZWplY3QoZXJyKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmluaXNoKCgpID0+IHJlc29sdmUoYXNzZXQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Bc3NldERlbGV0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG9sZEFzc2V0ID0gYXNzZXRNYW5hZ2VyLmFzc2V0cy5nZXQodXVpZCk7XG4gICAgICAgIGlmIChvbGRBc3NldCkge1xuICAgICAgICAgICAgY29uc3QgcGxhY2VIb2xkZXIgPSBuZXcgKG9sZEFzc2V0LmNvbnN0cnVjdG9yIGFzIENvbnN0cnVjdG9yPEFzc2V0PikoKTtcbiAgICAgICAgICAgIHBsYWNlSG9sZGVyLmluaXREZWZhdWx0KHV1aWQpO1xuICAgICAgICAgICAgYXNzZXRMaXN0ZW5lci5lbWl0KHV1aWQsIHBsYWNlSG9sZGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZW1vdmVDYWNoZXModXVpZCk7XG4gICAgfVxufVxuXG5jb25zdCBhc3NldFdhdGNoZXJNYW5hZ2VyID0gbmV3IEFzc2V0V2F0Y2hlck1hbmFnZXIoKTtcblxuZXhwb3J0IHsgYXNzZXRXYXRjaGVyTWFuYWdlciB9O1xuIl19