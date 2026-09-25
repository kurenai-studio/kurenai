'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeMountedRoot = decodeMountedRoot;
exports.decodeScene = decodeScene;
exports.decodeNode = decodeNode;
exports.decodePatch = decodePatch;
exports.resetProperty = resetProperty;
exports.updatePropertyFromNull = updatePropertyFromNull;
exports.decodeTargetOverrides = decodeTargetOverrides;
const utils_1 = require("./utils");
const get_1 = __importDefault(require("lodash/get"));
const set_1 = __importDefault(require("lodash/set"));
const dump_defines_1 = require("./dump-defines");
const service_access_1 = require("./service-access");
const cc_1 = require("cc");
const util_1 = require("util");
const TargetOverrideInfo = cc_1.Prefab._utils.TargetOverrideInfo;
const TargetInfo = cc_1.Prefab._utils.TargetInfo;
const PrefabInfo = cc_1.Prefab._utils.PrefabInfo;
function decodeChildren(children, node) {
    const nodeAccess = (0, service_access_1.getDumpNodeAccess)();
    const dumpChildrenUuids = children.map((child) => child.value.uuid);
    const nodeChildrenUuids = node.children.map((child) => child.uuid);
    /**
     * 出于性能考虑，不去移动两个数组共有的节点
     * 移除在 node 中且不在 dump 中的 uuid
     * 添加在 dump 中且不在 node 中的 uuid
     * 按照 dump 中的顺序重新排列
     */
    nodeChildrenUuids.forEach((uuid) => {
        // 删除不存在的节点
        if (!dumpChildrenUuids.includes(uuid)) {
            const child = nodeAccess.query(uuid);
            // 重要：过滤隐藏节点 或 无效节点
            if (!child || child.objFlags & cc.Object.Flags.HideInHierarchy) {
                return;
            }
            child.parent = null;
        }
    });
    dumpChildrenUuids.forEach((uuid, i) => {
        const child = nodeAccess.query(uuid);
        // 重要：过滤无效节点
        if (!child) {
            return;
        }
        // 重置对象状态位,后续应该提供还原的方法
        child.walk((node) => {
            node._objFlags &= cc.Object.Flags.PersistentMask;
            node._objFlags &= (~cc.Object.Flags.Destroyed);
        });
        // 节点挂靠父级
        if (!nodeChildrenUuids.includes(uuid)) {
            child.parent = node;
        }
        // 按新的顺序排列
        child.setSiblingIndex(i);
    });
}
// 还原mountedRoot
function decodeMountedRoot(compOrNode, mountedRoot) {
    if (!compOrNode) {
        return;
    }
    if (typeof mountedRoot === 'undefined') {
        return null;
    }
    const mountedRootNode = (0, service_access_1.getDumpNodeAccess)().query(mountedRoot);
    if (mountedRootNode) {
        if (!compOrNode[cc_1.editorExtrasTag]) {
            compOrNode[cc_1.editorExtrasTag] = {};
        }
        compOrNode[cc_1.editorExtrasTag].mountedRoot = mountedRootNode;
    }
    else {
        if (compOrNode[cc_1.editorExtrasTag]) {
            compOrNode[cc_1.editorExtrasTag].mountedRoot = undefined;
        }
    }
}
// 差异还原节点上的组件
async function decodeComponents(dumpComps, node, excludeComps) {
    if (!dumpComps) {
        // 容错处理
        return;
    }
    const componentAccess = (0, service_access_1.getDumpComponentAccess)();
    const nodeAccess = (0, service_access_1.getDumpNodeAccess)();
    // 用于判断 prefabNode 下的 component 复用
    const prefabFileIdToDumpComp = {};
    const dumpCompsUuids = dumpComps
        .map((comp) => {
        if (comp.value.uuid) {
            if (comp.value.__prefab && comp.value.__prefab.value && comp.value.__prefab.value.fileId.value) {
                prefabFileIdToDumpComp[comp.value.__prefab.value.fileId.value] = comp;
            }
            return comp.value.uuid.value;
        }
        return '';
    })
        .filter(Boolean);
    const componentsUuids = node.components
        .map((component) => {
        if (excludeComps) {
            // 需要 exclude 的 component，假装不在 node 上
            const compType = (0, utils_1.getTypeName)(component.constructor);
            if (excludeComps.includes(compType)) {
                return '';
            }
        }
        // 将 dumpComp 转为现有相同 fileId component 的配置，后面执行值覆盖
        if (component.__prefab && component.__prefab.fileId) {
            const dumpComp = prefabFileIdToDumpComp[component.__prefab.fileId];
            if (dumpComp) {
                const existIndex = dumpCompsUuids.indexOf(dumpComp.value.uuid.value);
                if (existIndex !== -1) {
                    dumpCompsUuids.splice(existIndex, 1, component.uuid);
                    dumpComp.value.uuid.value = component.uuid;
                }
            }
        }
        return component.uuid;
    })
        .filter(Boolean);
    /**
     * 删除现有在 node._compoennts 中但不在 dumpComps 中的 component
     * 2次方: 次数限制的作用：
     * 既能再次删除被依赖而不能被先删除的组件，
     * 又能避免死循环
     */
    let maxLoopTimes = componentsUuids.length ** 2;
    let i = componentsUuids.length - 1;
    do {
        const compUuid = componentsUuids[i];
        if (compUuid && !dumpCompsUuids.includes(compUuid)) {
            const comp = componentAccess.query(compUuid);
            // 删除失败会返回 false, 可能是组件被依赖，会下次再删
            if (!comp || componentAccess.removeComponent(comp)) {
                componentsUuids.splice(i, 1);
            }
            else {
                i--;
            }
        }
        else {
            i--;
        }
        maxLoopTimes--;
    } while (componentsUuids.length !== 0 && maxLoopTimes);
    // 重要：当前帧执行删除，保障下面的排序逻辑和上面的删除处于同一帧
    cc.Object._deferredDestroy();
    // 挂载上新的组件及调整组件的位置
    const components = node.components.slice(); // 下一步会清空，先缓存一份，以用于比较
    node['_components'].length = 0; // 先清空节点上的组件
    for (let i = 0; i < dumpComps.length; i++) {
        const dumpComp = dumpComps[i];
        if (!dumpComp.value || !dumpComp.value.uuid) {
            continue;
        }
        let component = components[i];
        const compUuid = dumpComp.value.uuid.value;
        let cacheComp = componentAccess.query(compUuid);
        // 在用，查询没有
        if (!cacheComp) {
            // 从 回收站 再查出来
            cacheComp = componentAccess.queryRecycle(compUuid);
        }
        if (cacheComp) {
            // 有缓存
            if (component !== cacheComp) {
                /**
                 * 新增场景：组件是从别的节点移过来的，
                 * 例如 prefab 从资源还原时，会先实例化一个临时节点，里面的组件会被移植过来
                 */
                if (cacheComp.node !== node) {
                    _removeDependComponent(cacheComp);
                }
                // 组件已被删除
                if (cacheComp.objFlags & cc.Object.Flags.Destroying || cacheComp.objFlags & cc.Object.Flags.Destroyed) {
                    // 57349 , 5 不会等于 128
                    // 重置 component.objFlags 的状态是为了重新走组件的生命周期
                    cacheComp.objFlags &= cc.Object.Flags.PersistentMask;
                    cacheComp.objFlags &= ~cc.Object.Flags.Destroyed;
                    // 回收站的缓存机制是编辑器的，这里需要将组件从回收站还原
                    // cce.Component.recycle(compUuid);
                }
                component = cacheComp;
            }
            nodeAccess.addComponentAt(node, component, i); // 插入新位置
        }
        // 编辑器预览时，undo时会设置clips导致动画停止播放 #15236
        // 记录上次播放的动画（因为可能不是默认clip）,还原后再播放
        const playAnim = [];
        // TODO(qgh):判断是否为预览进程
        // if (isPreviewProcess && dumpComp.type === 'cc.Animation') {
        //     const anim = component as Animation;
        //     anim.clips.map((clip) => anim.getState(clip?.name ?? ''))
        //         .filter((state: AnimationState) => state?.isPlaying)
        //         .forEach((state: AnimationState) => { playAnim.push(state.name); });
        // }
        // 对于原先还在的组件，还原内部的值
        for (const key in dumpComp.value) {
            await decodePatch(key, dumpComp.value[key], component);
        }
        if (playAnim.length > 0) {
            const anim = component;
            playAnim.forEach((name) => {
                anim.play(name);
            });
        }
        // 还原mountedRoot
        decodeMountedRoot(component, dumpComp.mountedRoot);
        // TODO: 不知道为啥这个方法是个protected的,应该改成public的
        // @ts-ignore 
        if (component && component.onRestore) {
            // @ts-ignore 
            component.onRestore();
        }
    }
    // 按依赖关系的顺序删除组件
    function _removeDependComponent(component) {
        // 组件已被删除
        if (component.objFlags & cc.Object.Flags.Destroying || component.objFlags & cc.Object.Flags.Destroyed) {
            // 57349 , 5 不会等于 128
            return;
        }
        // 关系是 dependComponent 依赖 component
        const dependComponent = component.node._getDependComponent(component);
        dependComponent.forEach((dep) => {
            _removeDependComponent(dep);
        });
        /**
         * 需要立即执行 cc.Object._deferredDestroy() 动作
         */
        componentAccess.removeComponent(component);
        cc.Object._deferredDestroy();
    }
}
async function decodePrefab(dumpPrefab, node) {
    // 不需要处理
    if (!dumpPrefab && !node['_prefab']) {
        return;
    }
    // 删除
    if (!dumpPrefab && node['_prefab']) {
        node['_prefab'] = null;
        return;
    }
    // 新增
    const info = new PrefabInfo();
    const root = (0, service_access_1.getDumpNodeAccess)().query(dumpPrefab.rootUuid);
    info.root = root ? root : node;
    if (dumpPrefab.uuid) {
        try {
            info.asset = await (0, util_1.promisify)(cc_1.assetManager.loadAny)(dumpPrefab.uuid);
        }
        catch (e) {
            console.error(e);
            info.asset = new cc_1.Prefab();
            info.asset.initDefault(dumpPrefab.uuid);
        }
    }
    info.fileId = dumpPrefab.fileId || node.uuid;
    if (dumpPrefab.instance) {
        await decodePatch('instance', dumpPrefab.instance, info);
    }
    else {
        info.instance = undefined;
    }
    if (dumpPrefab.targetOverrides) {
        info.targetOverrides = decodeTargetOverrides(dumpPrefab.targetOverrides);
    }
    else {
        info.targetOverrides = undefined;
    }
    node['_prefab'] = info;
}
/**
 * 解码一个场景 dump 数据
 * @param dump
 * @param scene
 */
async function decodeScene(dump, scene) {
    if (!dump) {
        return;
    }
    scene = scene || new cc.Scene();
    scene.name = dump.name.value;
    scene.active = dump.active.value;
    if (dump.children) {
        decodeChildren(dump.children, scene);
    }
    for (const key of Object.keys(dump._globals)) {
        await decodePatch(`_globals.${key}`, dump._globals[key], scene);
    }
    if (dump.targetOverrides) {
        if (!scene['_prefab']) {
            scene['_prefab'] = new cc._PrefabInfo();
        }
        scene['_prefab'].targetOverrides = decodeTargetOverrides(dump.targetOverrides);
    }
    else {
        scene['_prefab'] = undefined;
    }
}
/**
 * 解码一个 dump 数据
 * @param dump
 * @param node
 */
async function decodeNode(dump, node, excludeComps) {
    if (!dump) {
        return null;
    }
    node = node || new cc.Node();
    if (!node) {
        return null;
    }
    // 先还原prefab的相关信息，因为下面的属性设置会触发prefab的override
    await decodePrefab(dump.__prefab__, node);
    node.name = dump.name.value;
    node.active = dump.active.value;
    node.layer = dump.layer.value;
    node.mobility = dump.mobility.value;
    node.setPosition(dump.position.value);
    const quat = new cc_1.Quat();
    const vec3 = dump.rotation.value;
    cc_1.Quat.fromEuler(quat, vec3.x, vec3.y, vec3.z);
    node.setRotation(quat);
    node.setScale(dump.scale.value);
    decodeMountedRoot(node, dump.mountedRoot);
    if (dump.parent && dump.parent.value && dump.parent.value.uuid) {
        node.parent = (0, service_access_1.getDumpNodeAccess)().query(dump.parent.value.uuid);
    }
    else {
        node.parent = null;
    }
    if (dump.children) {
        decodeChildren(dump.children, node);
    }
    await decodeComponents(dump.__comps__, node, excludeComps);
    return node;
}
async function _decodeByType(type, node, info, dump, opts) {
    const dumpType = dump_defines_1.DumpDefines[type];
    if (dumpType) {
        await dumpType.decode(node, info, dump, opts);
        return true;
    }
    return false;
}
/**
 * 解码一个 dump 补丁到指定的 node 上
 * @param path
 * @param dump
 * @param node
 */
async function decodePatch(path, dump, node) {
    // 将 dump path 转成实际的 node search path
    const info = (0, utils_1.parsingPath)(path, node);
    const parentInfo = (0, utils_1.parsingPath)(info.search, node);
    const forbidUserChanges = [
        cc_1.editorExtrasTag,
        '__scriptAsset',
        'node',
        'uuid',
    ];
    // 获取需要修改的数据
    const data = info.search ? (0, get_1.default)(node, info.search) : node;
    if (!data) {
        return;
    }
    if (data instanceof cc_1.Component && forbidUserChanges.includes(info.key)) {
        return;
    }
    if (Object.prototype.toString.call(data) === '[object Object]') {
        // 只对 json 格式处理，array 等其他数据放行
        // 判断属性是否为 readonly,是则跳过还原步骤
        let propertyConfig = Object.getOwnPropertyDescriptor(data, info.key);
        // TODO(qgh): 暂时不支持原生场景
        // 原生场景下时取不到对象的属性情况时，需要尝试获取取对象的__proto__才能获取到jsb中定义的属性情况
        // if (window.isSceneNative && propertyConfig === undefined) {
        //     propertyConfig = Object.getOwnPropertyDescriptor(data.__proto__, info.key);
        // }
        if (propertyConfig === undefined) {
            // 原型链上的判断
            propertyConfig = cc.Class.attr(data, info.key);
            if (!propertyConfig || !propertyConfig.hasSetter) {
                // 如果是一个没有经过修饰器的数据，就会进这里
                // 经过 2020/08/25 引擎修饰情整理后，getter 都不会带修饰器，所以需要直接赋值
                // 例如 enabled
                // 如果 propertyConfig.hasGetter 为 true，说明是一个只读的 ccclass 属性
                if (info.key in data && (!propertyConfig || propertyConfig.hasGetter !== true)) {
                    data[info.key] = dump.value;
                }
                return;
            }
        }
        else if (!propertyConfig.writable && !propertyConfig.set) {
            return;
        }
    }
    const parentData = parentInfo.search ? (0, get_1.default)(node, parentInfo.search) : node;
    // 如果 dump.value 为 null，则需要自动填充默认数据
    if (!('value' in dump) || dump.type === 'Unknown') {
        let attr = cc.Class.attr(data, info.key);
        if (Array.isArray(parentData) && parentInfo.search !== '_components') {
            const grandInfo = (0, utils_1.parsingPath)(parentInfo.search, node);
            const grandData = grandInfo.search ? (0, get_1.default)(node, grandInfo.search) : node;
            attr = cc.Class.attr(grandData, grandInfo.key);
            attr = cc.Class.attr(attr.ctor, info.key);
        }
        const value = getDefaultAttrData(attr);
        data[info.key] = value;
        return value;
    }
    // 获取数据的类型
    const ccType = cc.js.getClassByName(dump.type);
    const ccExtends = ccType ? (0, utils_1.getTypeInheritanceChain)(ccType) : [];
    const sceneType = 'cc.Scene';
    const nodeType = 'cc.Node';
    const componentType = 'cc.Component';
    const assetType = 'cc.Asset';
    const valueType = 'cc.ValueType';
    // 实际修改数据
    if (dump.isArray) {
        // 需要对数组内部填充准确的默认值，新值可能是一个 ccClass 类
        if (Array.isArray(dump.value)) {
            const arrayValue = [];
            const attr = cc.Class.attr(data.constructor, info.key);
            for (let i = 0; i < dump.value.length; i++) {
                /**
                 * 这个是历史遗留赋值一个初始值，可能没有需要，
                 * 观察一段时间
                 * 如果后续发现真的有一些场景需要请修改本条注释
                 */
                arrayValue[i] = (0, utils_1.ccClassAttrPropertyDefaultValue)(attr);
                await decodePatch(`${i}`, dump.value[i], arrayValue);
            }
            data[info.key] = arrayValue;
        }
        else {
            data[info.key] = [];
        }
    }
    else {
        const opts = {};
        opts.ccType = ccType;
        // TODO(qgh):对于Editor，传入空的资产uuid，不会报错，但是cli需要报错。对于cli的报错需要实现
        opts.suppressError = true;
        // 特殊属性
        if (info.key in nodeSpecialPropertyDefaultValue) {
            setNodeSpecialProperty(node, info.key, dump.value);
        }
        else if (await _decodeByType(dump.type, data, info, dump, opts)) {
            // empty
        }
        else if (sceneType === dump.type) {
            _decodeByType(nodeType, data, info, dump, opts);
        }
        else if (ArrayBuffer.isView(dump.value)) {
            _decodeByType('TypedArray', data, info, dump, opts);
        }
        else if (ccExtends.includes(nodeType) || nodeType === dump.type) {
            _decodeByType(nodeType, data, info, dump, opts);
        }
        else if (ccExtends.includes(assetType) || assetType === dump.type) {
            await _decodeByType(assetType, data, info, dump, opts);
        }
        else if (ccExtends.includes(componentType) || componentType === dump.type) {
            _decodeByType(componentType, data, info, dump, opts);
        }
        else if (ccExtends.includes(valueType)) {
            _decodeByType(valueType, data, info, dump, opts);
        }
        else if (info.key === 'length' && dump.type === 'Array') {
            // 更改数组长度时造的数据
            while (data.length > dump.value) {
                data.pop();
            }
            const parentData = (0, get_1.default)(node, parentInfo.search);
            const attr = cc.Class.attr(parentData, parentInfo.key);
            for (let i = data.length; i < dump.value; i++) {
                data[i] = (0, utils_1.ccClassAttrPropertyDefaultValue)(attr);
            }
            (0, set_1.default)(node, info.search, data);
        }
        else {
            if (ccType && !data[info.key] && dump.value !== null) {
                data[info.key] = new ccType();
                for (let i = 0; i < ccType.__props__.length; i++) {
                    const key = ccType.__props__[i];
                    const item = dump.value[key];
                    if (item) {
                        await decodePatch(`${path}.${key}`, item, node);
                    }
                }
            }
            else if (dump.value === null) {
                // 下一行的 typeof null === 'object' , 这行增加容错
                data[info.key] = dump.value;
            }
            else if (typeof dump.value === 'object') {
                for (const key in dump.value) {
                    if (dump.value[key] === undefined) {
                        continue;
                    }
                    await decodePatch(key, dump.value[key], data[info.key]);
                }
            }
            else {
                data[info.key] = dump.value;
            }
        }
    }
    if (info.search) {
        (0, set_1.default)(node, info.search, data);
    }
    if (parentInfo && parentInfo.search) {
        const data = (0, get_1.default)(node, parentInfo.search);
        // 对组件下的自定义类型进行还原时，可能存在没有setter的情况
        if (data instanceof Object && cc.Class.attr(data, info.key)?.hasSetter) {
            // eslint-disable-next-line no-self-assign
            data[parentInfo.key] = data[parentInfo.key];
        }
    }
}
// 节点特殊属性需要另外用 method 设置
const nodeSpecialPropertyDefaultValue = {
    _lpos() {
        return new cc_1.Vec3(0, 0, 0);
    },
    eulerAngles() {
        return new cc_1.Vec3(0, 0, 0);
    },
    _lscale() {
        return new cc_1.Vec3(1, 1, 1);
    },
    mobility() {
        return cc_1.MobilityMode.Static;
    },
};
function setNodeSpecialProperty(node, key, value) {
    if (node instanceof cc.Node) {
        switch (key) {
            case '_lpos':
                node.position = value;
                break;
            case 'eulerAngles':
                node.eulerAngles = value;
                break;
            case '_lscale':
                node.scale = value;
                break;
            case 'mobility':
                node.mobility = value;
                break;
        }
    }
}
function getDefaultAttrData(attr) {
    let value = (0, utils_1.getDefault)(attr);
    if (typeof value === 'object' && value) {
        if (typeof value.clone === 'function') {
            value = value.clone();
        }
        else if (Array.isArray(value)) {
            value = [];
        }
    }
    return value;
}
function resetProperty(node, path) {
    // 将 dump path 转成实际的 node search path
    const info = (0, utils_1.parsingPath)(path, node);
    // 获取需要修改的数据
    const data = info.search ? (0, get_1.default)(node, info.search) : node;
    if (!data) {
        return;
    }
    if (info.key in nodeSpecialPropertyDefaultValue) {
        const value = nodeSpecialPropertyDefaultValue[info.key]();
        setNodeSpecialProperty(data, info.key, value);
    }
    else {
        const attr = cc.Class.attr(data.constructor, info.key);
        data[info.key] = getDefaultAttrData(attr);
    }
}
// 将一个属性其现存值与定义类型值不匹配，或者为 null 默认值，改为一个可编辑的值
function updatePropertyFromNull(node, path) {
    // 将 dump path 转成实际的 node search path
    const info = (0, utils_1.parsingPath)(path, node);
    // 获取需要修改的数据
    const data = info.search ? (0, get_1.default)(node, info.search) : node;
    if (!data) {
        return;
    }
    const attr = cc.Class.attr(data.constructor, info.key);
    data[info.key] = getDefaultAttrData(attr);
    if ((data[info.key] === null || data[info.key] === undefined) && attr.ctor) {
        data[info.key] = new attr.ctor();
    }
}
function decodeTargetOverrides(dumpedTargetOverrides) {
    const nodeAccess = (0, service_access_1.getDumpNodeAccess)();
    const targetOverrides = [];
    dumpedTargetOverrides.forEach((itr) => {
        const targetOverride = new TargetOverrideInfo();
        targetOverride.source = nodeAccess.query(itr.source);
        if (itr.sourceInfo) {
            const sourceInfo = new TargetInfo();
            sourceInfo.localID = itr.sourceInfo;
            targetOverride.sourceInfo = sourceInfo;
        }
        targetOverride.propertyPath = itr.propertyPath;
        targetOverride.target = nodeAccess.query(itr.target);
        if (itr.targetInfo) {
            const targetInfo = new TargetInfo();
            targetInfo.localID = itr.targetInfo;
            targetOverride.targetInfo = targetInfo;
        }
        targetOverrides.push(targetOverride);
    });
    return targetOverrides;
}
exports.default = {
    decodeScene,
    decodeNode,
    decodePatch,
    resetProperty,
    updatePropertyFromNull,
    decodeMountedRoot,
    decodeTargetOverrides,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2R1bXAvZGVjb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFzRWIsOENBa0JDO0FBd09ELGtDQXVCQztBQU9ELGdDQXVDQztBQW1CRCxrQ0F5S0M7QUF3REQsc0NBaUJDO0FBR0Qsd0RBZ0JDO0FBRUQsc0RBeUJDO0FBcHJCRCxtQ0FBeUg7QUFFekgscURBQTZCO0FBQzdCLHFEQUE2QjtBQUM3QixpREFBNkM7QUFDN0MscURBQTZFO0FBQzdFLDJCQUFpSDtBQUNqSCwrQkFBaUM7QUFLakMsTUFBTSxrQkFBa0IsR0FBRyxXQUFNLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDO0FBRTVELE1BQU0sVUFBVSxHQUFHLFdBQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0FBRTVDLE1BQU0sVUFBVSxHQUFHLFdBQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0FBRTVDLFNBQVMsY0FBYyxDQUFDLFFBQWUsRUFBRSxJQUFTO0lBQzlDLE1BQU0sVUFBVSxHQUFHLElBQUEsa0NBQWlCLEdBQUUsQ0FBQztJQUN2QyxNQUFNLGlCQUFpQixHQUFhLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkYsTUFBTSxpQkFBaUIsR0FBYSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQVksRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXBGOzs7OztPQUtHO0lBQ0gsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBWSxFQUFFLEVBQUU7UUFDdkMsV0FBVztRQUNYLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFR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UUFDM0MsQ0FBQztRQUVELGVBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLGVBQWUsQ0FBQztBQUMzQixDQUFDO0FBRUQsa0JBQWU7SUFDWCxXQUFXO0lBQ1gsVUFBVTtJQUNWLFdBQVc7SUFDWCxhQUFhO0lBQ2Isc0JBQXNCO0lBQ3RCLGlCQUFpQjtJQUNqQixxQkFBcUI7Q0FDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuZGVjbGFyZSBjb25zdCBjYzogYW55O1xuXG5pbXBvcnQgeyBjY0NsYXNzQXR0clByb3BlcnR5RGVmYXVsdFZhbHVlLCBnZXREZWZhdWx0LCBnZXRUeXBlSW5oZXJpdGFuY2VDaGFpbiwgZ2V0VHlwZU5hbWUsIHBhcnNpbmdQYXRoIH0gZnJvbSAnLi91dGlscyc7XG5cbmltcG9ydCBnZXQgZnJvbSAnbG9kYXNoL2dldCc7XG5pbXBvcnQgc2V0IGZyb20gJ2xvZGFzaC9zZXQnO1xuaW1wb3J0IHsgRHVtcERlZmluZXMgfSBmcm9tICcuL2R1bXAtZGVmaW5lcyc7XG5pbXBvcnQgeyBnZXREdW1wQ29tcG9uZW50QWNjZXNzLCBnZXREdW1wTm9kZUFjY2VzcyB9IGZyb20gJy4vc2VydmljZS1hY2Nlc3MnO1xuaW1wb3J0IHsgQ29tcG9uZW50LCBlZGl0b3JFeHRyYXNUYWcsIE5vZGUsIFZlYzMsIE1vYmlsaXR5TW9kZSwgUHJlZmFiLCBRdWF0LCBhc3NldE1hbmFnZXIsIEFuaW1hdGlvbiB9IGZyb20gJ2NjJztcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gJ3V0aWwnO1xuaW1wb3J0IHsgSUNvbXBvbmVudCwgSU5vZGUsIElTY2VuZSwgSVRhcmdldE92ZXJyaWRlSW5mbyB9IGZyb20gJy4uLy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBJUHJvcGVydHkgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHVibGljJztcblxudHlwZSBUYXJnZXRPdmVycmlkZUluZm8gPSBQcmVmYWIuX3V0aWxzLlRhcmdldE92ZXJyaWRlSW5mbztcbmNvbnN0IFRhcmdldE92ZXJyaWRlSW5mbyA9IFByZWZhYi5fdXRpbHMuVGFyZ2V0T3ZlcnJpZGVJbmZvO1xudHlwZSBUYXJnZXRJbmZvID0gUHJlZmFiLl91dGlscy5UYXJnZXRJbmZvO1xuY29uc3QgVGFyZ2V0SW5mbyA9IFByZWZhYi5fdXRpbHMuVGFyZ2V0SW5mbztcbnR5cGUgUHJlZmFiSW5mbyA9IFByZWZhYi5fdXRpbHMuUHJlZmFiSW5mbztcbmNvbnN0IFByZWZhYkluZm8gPSBQcmVmYWIuX3V0aWxzLlByZWZhYkluZm87XG5cbmZ1bmN0aW9uIGRlY29kZUNoaWxkcmVuKGNoaWxkcmVuOiBhbnlbXSwgbm9kZTogYW55KSB7XG4gICAgY29uc3Qgbm9kZUFjY2VzcyA9IGdldER1bXBOb2RlQWNjZXNzKCk7XG4gICAgY29uc3QgZHVtcENoaWxkcmVuVXVpZHM6IHN0cmluZ1tdID0gY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBjaGlsZC52YWx1ZS51dWlkKTtcbiAgICBjb25zdCBub2RlQ2hpbGRyZW5VdWlkczogc3RyaW5nW10gPSBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IElOb2RlKSA9PiBjaGlsZC51dWlkKTtcblxuICAgIC8qKlxuICAgICAqIOWHuuS6juaAp+iDveiAg+iZke+8jOS4jeWOu+enu+WKqOS4pOS4quaVsOe7hOWFseacieeahOiKgueCuVxuICAgICAqIOenu+mZpOWcqCBub2RlIOS4reS4lOS4jeWcqCBkdW1wIOS4reeahCB1dWlkXG4gICAgICog5re75Yqg5ZyoIGR1bXAg5Lit5LiU5LiN5ZyoIG5vZGUg5Lit55qEIHV1aWRcbiAgICAgKiDmjInnhacgZHVtcCDkuK3nmoTpobrluo/ph43mlrDmjpLliJdcbiAgICAgKi9cbiAgICBub2RlQ2hpbGRyZW5VdWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgLy8g5Yig6Zmk5LiN5a2Y5Zyo55qE6IqC54K5XG4gICAgICAgIGlmICghZHVtcENoaWxkcmVuVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gbm9kZUFjY2Vzcy5xdWVyeSh1dWlkKTtcbiAgICAgICAgICAgIC8vIOmHjeimge+8mui/h+a7pOmakOiXj+iKgueCuSDmiJYg5peg5pWI6IqC54K5XG4gICAgICAgICAgICBpZiAoIWNoaWxkIHx8IGNoaWxkLm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLkhpZGVJbkhpZXJhcmNoeSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkLnBhcmVudCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGR1bXBDaGlsZHJlblV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZywgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gbm9kZUFjY2Vzcy5xdWVyeSh1dWlkKTtcbiAgICAgICAgLy8g6YeN6KaB77ya6L+H5ruk5peg5pWI6IqC54K5XG4gICAgICAgIGlmICghY2hpbGQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmHjee9ruWvueixoeeKtuaAgeS9jSzlkI7nu63lupTor6Xmj5Dkvpvov5jljp/nmoTmlrnms5VcbiAgICAgICAgY2hpbGQud2Fsaygobm9kZTogTm9kZSkgPT4ge1xuICAgICAgICAgICAgbm9kZS5fb2JqRmxhZ3MgJj0gY2MuT2JqZWN0LkZsYWdzLlBlcnNpc3RlbnRNYXNrO1xuICAgICAgICAgICAgbm9kZS5fb2JqRmxhZ3MgJj0gKH5jYy5PYmplY3QuRmxhZ3MuRGVzdHJveWVkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g6IqC54K55oyC6Z2g54i257qnXG4gICAgICAgIGlmICghbm9kZUNoaWxkcmVuVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIGNoaWxkLnBhcmVudCA9IG5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmjInmlrDnmoTpobrluo/mjpLliJdcbiAgICAgICAgY2hpbGQuc2V0U2libGluZ0luZGV4KGkpO1xuICAgIH0pO1xufVxuXG5cbi8vIOi/mOWOn21vdW50ZWRSb290XG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlTW91bnRlZFJvb3QoY29tcE9yTm9kZTogTm9kZSB8IENvbXBvbmVudCwgbW91bnRlZFJvb3Q/OiBzdHJpbmcpIHtcbiAgICBpZiAoIWNvbXBPck5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG1vdW50ZWRSb290ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbW91bnRlZFJvb3ROb2RlID0gZ2V0RHVtcE5vZGVBY2Nlc3MoKS5xdWVyeShtb3VudGVkUm9vdCk7XG4gICAgaWYgKG1vdW50ZWRSb290Tm9kZSkge1xuICAgICAgICBpZiAoIWNvbXBPck5vZGVbZWRpdG9yRXh0cmFzVGFnXSkge1xuICAgICAgICAgICAgY29tcE9yTm9kZVtlZGl0b3JFeHRyYXNUYWddID0ge307XG4gICAgICAgIH1cbiAgICAgICAgY29tcE9yTm9kZVtlZGl0b3JFeHRyYXNUYWddLm1vdW50ZWRSb290ID0gbW91bnRlZFJvb3ROb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjb21wT3JOb2RlW2VkaXRvckV4dHJhc1RhZ10pIHtcbiAgICAgICAgICAgIGNvbXBPck5vZGVbZWRpdG9yRXh0cmFzVGFnXS5tb3VudGVkUm9vdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8g5beu5byC6L+Y5Y6f6IqC54K55LiK55qE57uE5Lu2XG5hc3luYyBmdW5jdGlvbiBkZWNvZGVDb21wb25lbnRzKGR1bXBDb21wczogYW55LCBub2RlOiBOb2RlLCBleGNsdWRlQ29tcHM/OiBhbnkpIHtcbiAgICBpZiAoIWR1bXBDb21wcykge1xuICAgICAgICAvLyDlrrnplJnlpITnkIZcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjb21wb25lbnRBY2Nlc3MgPSBnZXREdW1wQ29tcG9uZW50QWNjZXNzKCk7XG4gICAgY29uc3Qgbm9kZUFjY2VzcyA9IGdldER1bXBOb2RlQWNjZXNzKCk7XG5cbiAgICAvLyDnlKjkuo7liKTmlq0gcHJlZmFiTm9kZSDkuIvnmoQgY29tcG9uZW50IOWkjeeUqFxuICAgIGNvbnN0IHByZWZhYkZpbGVJZFRvRHVtcENvbXA6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fTtcbiAgICBjb25zdCBkdW1wQ29tcHNVdWlkcyA9IGR1bXBDb21wc1xuICAgICAgICAubWFwKChjb21wOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmIChjb21wLnZhbHVlLnV1aWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcC52YWx1ZS5fX3ByZWZhYiAmJiBjb21wLnZhbHVlLl9fcHJlZmFiLnZhbHVlICYmIGNvbXAudmFsdWUuX19wcmVmYWIudmFsdWUuZmlsZUlkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWZhYkZpbGVJZFRvRHVtcENvbXBbY29tcC52YWx1ZS5fX3ByZWZhYi52YWx1ZS5maWxlSWQudmFsdWVdID0gY29tcDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcC52YWx1ZS51dWlkLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9KVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgY29uc3QgY29tcG9uZW50c1V1aWRzID0gbm9kZS5jb21wb25lbnRzXG4gICAgICAgIC5tYXAoKGNvbXBvbmVudDogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXhjbHVkZUNvbXBzKSB7XG4gICAgICAgICAgICAgICAgLy8g6ZyA6KaBIGV4Y2x1ZGUg55qEIGNvbXBvbmVudO+8jOWBh+ijheS4jeWcqCBub2RlIOS4ilxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBUeXBlID0gZ2V0VHlwZU5hbWUoY29tcG9uZW50LmNvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZUNvbXBzLmluY2x1ZGVzKGNvbXBUeXBlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlsIYgZHVtcENvbXAg6L2s5Li6546w5pyJ55u45ZCMIGZpbGVJZCBjb21wb25lbnQg55qE6YWN572u77yM5ZCO6Z2i5omn6KGM5YC86KaG55uWXG4gICAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fcHJlZmFiICYmIGNvbXBvbmVudC5fX3ByZWZhYi5maWxlSWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkdW1wQ29tcCA9IHByZWZhYkZpbGVJZFRvRHVtcENvbXBbY29tcG9uZW50Ll9fcHJlZmFiLmZpbGVJZF07XG4gICAgICAgICAgICAgICAgaWYgKGR1bXBDb21wKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0SW5kZXggPSBkdW1wQ29tcHNVdWlkcy5pbmRleE9mKGR1bXBDb21wLnZhbHVlLnV1aWQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1bXBDb21wc1V1aWRzLnNwbGljZShleGlzdEluZGV4LCAxLCBjb21wb25lbnQudXVpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdW1wQ29tcC52YWx1ZS51dWlkLnZhbHVlID0gY29tcG9uZW50LnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb21wb25lbnQudXVpZDtcbiAgICAgICAgfSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIC8qKlxuICAgICAqIOWIoOmZpOeOsOacieWcqCBub2RlLl9jb21wb2VubnRzIOS4reS9huS4jeWcqCBkdW1wQ29tcHMg5Lit55qEIGNvbXBvbmVudFxuICAgICAqIDLmrKHmlrk6IOasoeaVsOmZkOWItueahOS9nOeUqO+8mlxuICAgICAqIOaXouiDveWGjeasoeWIoOmZpOiiq+S+nei1luiAjOS4jeiDveiiq+WFiOWIoOmZpOeahOe7hOS7tu+8jFxuICAgICAqIOWPiOiDvemBv+WFjeatu+W+queOr1xuICAgICAqL1xuICAgIGxldCBtYXhMb29wVGltZXMgPSBjb21wb25lbnRzVXVpZHMubGVuZ3RoICoqIDI7XG4gICAgbGV0IGkgPSBjb21wb25lbnRzVXVpZHMubGVuZ3RoIC0gMTtcblxuICAgIGRvIHtcbiAgICAgICAgY29uc3QgY29tcFV1aWQgPSBjb21wb25lbnRzVXVpZHNbaV07XG5cbiAgICAgICAgaWYgKGNvbXBVdWlkICYmICFkdW1wQ29tcHNVdWlkcy5pbmNsdWRlcyhjb21wVXVpZCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBjb21wb25lbnRBY2Nlc3MucXVlcnkoY29tcFV1aWQpO1xuICAgICAgICAgICAgLy8g5Yig6Zmk5aSx6LSl5Lya6L+U5ZueIGZhbHNlLCDlj6/og73mmK/nu4Tku7booqvkvp3otZbvvIzkvJrkuIvmrKHlho3liKBcbiAgICAgICAgICAgIGlmICghY29tcCB8fCBjb21wb25lbnRBY2Nlc3MucmVtb3ZlQ29tcG9uZW50KGNvbXApKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50c1V1aWRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaS0tO1xuICAgICAgICB9XG5cbiAgICAgICAgbWF4TG9vcFRpbWVzLS07XG4gICAgfSB3aGlsZSAoY29tcG9uZW50c1V1aWRzLmxlbmd0aCAhPT0gMCAmJiBtYXhMb29wVGltZXMpO1xuXG4gICAgLy8g6YeN6KaB77ya5b2T5YmN5bin5omn6KGM5Yig6Zmk77yM5L+d6Zqc5LiL6Z2i55qE5o6S5bqP6YC76L6R5ZKM5LiK6Z2i55qE5Yig6Zmk5aSE5LqO5ZCM5LiA5binXG4gICAgY2MuT2JqZWN0Ll9kZWZlcnJlZERlc3Ryb3koKTtcblxuICAgIC8vIOaMgui9veS4iuaWsOeahOe7hOS7tuWPiuiwg+aVtOe7hOS7tueahOS9jee9rlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSBub2RlLmNvbXBvbmVudHMuc2xpY2UoKTsgLy8g5LiL5LiA5q2l5Lya5riF56m677yM5YWI57yT5a2Y5LiA5Lu977yM5Lul55So5LqO5q+U6L6DXG4gICAgbm9kZVsnX2NvbXBvbmVudHMnXS5sZW5ndGggPSAwOyAvLyDlhYjmuIXnqbroioLngrnkuIrnmoTnu4Tku7ZcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZHVtcENvbXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGR1bXBDb21wOiBJQ29tcG9uZW50ID0gZHVtcENvbXBzW2ldO1xuXG4gICAgICAgIGlmICghZHVtcENvbXAudmFsdWUgfHwgIWR1bXBDb21wLnZhbHVlLnV1aWQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvbXBvbmVudCA9IGNvbXBvbmVudHNbaV07XG5cbiAgICAgICAgY29uc3QgY29tcFV1aWQgPSAoZHVtcENvbXAudmFsdWUudXVpZCBhcyBJUHJvcGVydHkpLnZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgbGV0IGNhY2hlQ29tcCA9IGNvbXBvbmVudEFjY2Vzcy5xdWVyeShjb21wVXVpZCk7XG5cbiAgICAgICAgLy8g5Zyo55So77yM5p+l6K+i5rKh5pyJXG4gICAgICAgIGlmICghY2FjaGVDb21wKSB7XG4gICAgICAgICAgICAvLyDku44g5Zue5pS256uZIOWGjeafpeWHuuadpVxuICAgICAgICAgICAgY2FjaGVDb21wID0gY29tcG9uZW50QWNjZXNzLnF1ZXJ5UmVjeWNsZShjb21wVXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2FjaGVDb21wKSB7XG4gICAgICAgICAgICAvLyDmnInnvJPlrZhcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQgIT09IGNhY2hlQ29tcCkge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIOaWsOWinuWcuuaZr++8mue7hOS7tuaYr+S7juWIq+eahOiKgueCueenu+i/h+adpeeahO+8jFxuICAgICAgICAgICAgICAgICAqIOS+i+WmgiBwcmVmYWIg5LuO6LWE5rqQ6L+Y5Y6f5pe277yM5Lya5YWI5a6e5L6L5YyW5LiA5Liq5Li05pe26IqC54K577yM6YeM6Z2i55qE57uE5Lu25Lya6KKr56e75qSN6L+H5p2lXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgaWYgKGNhY2hlQ29tcC5ub2RlICE9PSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIF9yZW1vdmVEZXBlbmRDb21wb25lbnQoY2FjaGVDb21wKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDnu4Tku7blt7LooqvliKDpmaRcbiAgICAgICAgICAgICAgICBpZiAoY2FjaGVDb21wLm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLkRlc3Ryb3lpbmcgfHwgY2FjaGVDb21wLm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLkRlc3Ryb3llZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyA1NzM0OSAsIDUg5LiN5Lya562J5LqOIDEyOFxuICAgICAgICAgICAgICAgICAgICAvLyDph43nva4gY29tcG9uZW50Lm9iakZsYWdzIOeahOeKtuaAgeaYr+S4uuS6humHjeaWsOi1sOe7hOS7tueahOeUn+WRveWRqOacn1xuICAgICAgICAgICAgICAgICAgICBjYWNoZUNvbXAub2JqRmxhZ3MgJj0gY2MuT2JqZWN0LkZsYWdzLlBlcnNpc3RlbnRNYXNrO1xuICAgICAgICAgICAgICAgICAgICBjYWNoZUNvbXAub2JqRmxhZ3MgJj0gfmNjLk9iamVjdC5GbGFncy5EZXN0cm95ZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5Zue5pS256uZ55qE57yT5a2Y5py65Yi25piv57yW6L6R5Zmo55qE77yM6L+Z6YeM6ZyA6KaB5bCG57uE5Lu25LuO5Zue5pS256uZ6L+Y5Y6fXG4gICAgICAgICAgICAgICAgICAgIC8vIGNjZS5Db21wb25lbnQucmVjeWNsZShjb21wVXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbXBvbmVudCA9IGNhY2hlQ29tcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGVBY2Nlc3MuYWRkQ29tcG9uZW50QXQobm9kZSwgY29tcG9uZW50LCBpKTsgLy8g5o+S5YWl5paw5L2N572uXG4gICAgICAgIH1cblxuICAgICAgICAvLyDnvJbovpHlmajpooTop4jml7bvvIx1bmRv5pe25Lya6K6+572uY2xpcHPlr7zoh7TliqjnlLvlgZzmraLmkq3mlL4gIzE1MjM2XG4gICAgICAgIC8vIOiusOW9leS4iuasoeaSreaUvueahOWKqOeUu++8iOWboOS4uuWPr+iDveS4jeaYr+m7mOiupGNsaXDvvIks6L+Y5Y6f5ZCO5YaN5pKt5pS+XG4gICAgICAgIGNvbnN0IHBsYXlBbmltOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAvLyBUT0RPKHFnaCk65Yik5pat5piv5ZCm5Li66aKE6KeI6L+b56iLXG4gICAgICAgIC8vIGlmIChpc1ByZXZpZXdQcm9jZXNzICYmIGR1bXBDb21wLnR5cGUgPT09ICdjYy5BbmltYXRpb24nKSB7XG4gICAgICAgIC8vICAgICBjb25zdCBhbmltID0gY29tcG9uZW50IGFzIEFuaW1hdGlvbjtcbiAgICAgICAgLy8gICAgIGFuaW0uY2xpcHMubWFwKChjbGlwKSA9PiBhbmltLmdldFN0YXRlKGNsaXA/Lm5hbWUgPz8gJycpKVxuICAgICAgICAvLyAgICAgICAgIC5maWx0ZXIoKHN0YXRlOiBBbmltYXRpb25TdGF0ZSkgPT4gc3RhdGU/LmlzUGxheWluZylcbiAgICAgICAgLy8gICAgICAgICAuZm9yRWFjaCgoc3RhdGU6IEFuaW1hdGlvblN0YXRlKSA9PiB7IHBsYXlBbmltLnB1c2goc3RhdGUubmFtZSk7IH0pO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIOWvueS6juWOn+WFiOi/mOWcqOeahOe7hOS7tu+8jOi/mOWOn+WGhemDqOeahOWAvFxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBkdW1wQ29tcC52YWx1ZSkge1xuICAgICAgICAgICAgYXdhaXQgZGVjb2RlUGF0Y2goa2V5LCBkdW1wQ29tcC52YWx1ZVtrZXldLCBjb21wb25lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBsYXlBbmltLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGFuaW0gPSBjb21wb25lbnQgYXMgQW5pbWF0aW9uO1xuICAgICAgICAgICAgcGxheUFuaW0uZm9yRWFjaCgobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgYW5pbS5wbGF5KG5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov5jljp9tb3VudGVkUm9vdFxuICAgICAgICBkZWNvZGVNb3VudGVkUm9vdChjb21wb25lbnQsIGR1bXBDb21wLm1vdW50ZWRSb290KTtcblxuICAgICAgICAvLyBUT0RPOiDkuI3nn6XpgZPkuLrllaXov5nkuKrmlrnms5XmmK/kuKpwcm90ZWN0ZWTnmoQs5bqU6K+l5pS55oiQcHVibGlj55qEXG4gICAgICAgIC8vIEB0cy1pZ25vcmUgXG4gICAgICAgIGlmIChjb21wb25lbnQgJiYgY29tcG9uZW50Lm9uUmVzdG9yZSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBcbiAgICAgICAgICAgIGNvbXBvbmVudC5vblJlc3RvcmUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOaMieS+nei1luWFs+ezu+eahOmhuuW6j+WIoOmZpOe7hOS7tlxuICAgIGZ1bmN0aW9uIF9yZW1vdmVEZXBlbmRDb21wb25lbnQoY29tcG9uZW50OiBhbnkpIHtcbiAgICAgICAgLy8g57uE5Lu25bey6KKr5Yig6ZmkXG4gICAgICAgIGlmIChjb21wb25lbnQub2JqRmxhZ3MgJiBjYy5PYmplY3QuRmxhZ3MuRGVzdHJveWluZyB8fCBjb21wb25lbnQub2JqRmxhZ3MgJiBjYy5PYmplY3QuRmxhZ3MuRGVzdHJveWVkKSB7XG4gICAgICAgICAgICAvLyA1NzM0OSAsIDUg5LiN5Lya562J5LqOIDEyOFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YWz57O75pivIGRlcGVuZENvbXBvbmVudCDkvp3otZYgY29tcG9uZW50XG4gICAgICAgIGNvbnN0IGRlcGVuZENvbXBvbmVudCA9IGNvbXBvbmVudC5ub2RlLl9nZXREZXBlbmRDb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgZGVwZW5kQ29tcG9uZW50LmZvckVhY2goKGRlcDogYW55KSA9PiB7XG4gICAgICAgICAgICBfcmVtb3ZlRGVwZW5kQ29tcG9uZW50KGRlcCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDpnIDopoHnq4vljbPmiafooYwgY2MuT2JqZWN0Ll9kZWZlcnJlZERlc3Ryb3koKSDliqjkvZxcbiAgICAgICAgICovXG4gICAgICAgIGNvbXBvbmVudEFjY2Vzcy5yZW1vdmVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgY2MuT2JqZWN0Ll9kZWZlcnJlZERlc3Ryb3koKTtcbiAgICB9XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gZGVjb2RlUHJlZmFiKGR1bXBQcmVmYWI6IGFueSwgbm9kZTogYW55KSB7XG4gICAgLy8g5LiN6ZyA6KaB5aSE55CGXG4gICAgaWYgKCFkdW1wUHJlZmFiICYmICFub2RlWydfcHJlZmFiJ10pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIOWIoOmZpFxuICAgIGlmICghZHVtcFByZWZhYiAmJiBub2RlWydfcHJlZmFiJ10pIHtcbiAgICAgICAgbm9kZVsnX3ByZWZhYiddID0gbnVsbDtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIOaWsOWinlxuICAgIGNvbnN0IGluZm8gPSBuZXcgUHJlZmFiSW5mbygpO1xuICAgIGNvbnN0IHJvb3QgPSBnZXREdW1wTm9kZUFjY2VzcygpLnF1ZXJ5KGR1bXBQcmVmYWIucm9vdFV1aWQpO1xuICAgIGluZm8ucm9vdCA9IHJvb3QgPyByb290IDogbm9kZTtcbiAgICBpZiAoZHVtcFByZWZhYi51dWlkKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpbmZvLmFzc2V0ID0gYXdhaXQgcHJvbWlzaWZ5KGFzc2V0TWFuYWdlci5sb2FkQW55KShkdW1wUHJlZmFiLnV1aWQpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgaW5mby5hc3NldCA9IG5ldyBQcmVmYWIoKTtcbiAgICAgICAgICAgIGluZm8uYXNzZXQuaW5pdERlZmF1bHQoZHVtcFByZWZhYi51dWlkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpbmZvLmZpbGVJZCA9IGR1bXBQcmVmYWIuZmlsZUlkIHx8IG5vZGUudXVpZDtcbiAgICBpZiAoZHVtcFByZWZhYi5pbnN0YW5jZSkge1xuICAgICAgICBhd2FpdCBkZWNvZGVQYXRjaCgnaW5zdGFuY2UnLCBkdW1wUHJlZmFiLmluc3RhbmNlLCBpbmZvKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbmZvLmluc3RhbmNlID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmIChkdW1wUHJlZmFiLnRhcmdldE92ZXJyaWRlcykge1xuICAgICAgICBpbmZvLnRhcmdldE92ZXJyaWRlcyA9IGRlY29kZVRhcmdldE92ZXJyaWRlcyhkdW1wUHJlZmFiLnRhcmdldE92ZXJyaWRlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW5mby50YXJnZXRPdmVycmlkZXMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbm9kZVsnX3ByZWZhYiddID0gaW5mbztcbn1cblxuLyoqXG4gKiDop6PnoIHkuIDkuKrlnLrmma8gZHVtcCDmlbDmja5cbiAqIEBwYXJhbSBkdW1wXG4gKiBAcGFyYW0gc2NlbmVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlY29kZVNjZW5lKGR1bXA6IElTY2VuZSwgc2NlbmU/OiBhbnkpIHtcbiAgICBpZiAoIWR1bXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzY2VuZSA9IHNjZW5lIHx8IG5ldyBjYy5TY2VuZSgpO1xuICAgIHNjZW5lLm5hbWUgPSBkdW1wLm5hbWUudmFsdWU7XG4gICAgc2NlbmUuYWN0aXZlID0gZHVtcC5hY3RpdmUudmFsdWU7XG4gICAgaWYgKGR1bXAuY2hpbGRyZW4pIHtcbiAgICAgICAgZGVjb2RlQ2hpbGRyZW4oZHVtcC5jaGlsZHJlbiwgc2NlbmUpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGR1bXAuX2dsb2JhbHMpKSB7XG4gICAgICAgIGF3YWl0IGRlY29kZVBhdGNoKGBfZ2xvYmFscy4ke2tleX1gLCBkdW1wLl9nbG9iYWxzW2tleV0sIHNjZW5lKTtcbiAgICB9XG5cbiAgICBpZiAoZHVtcC50YXJnZXRPdmVycmlkZXMpIHtcbiAgICAgICAgaWYgKCFzY2VuZVsnX3ByZWZhYiddKSB7XG4gICAgICAgICAgICBzY2VuZVsnX3ByZWZhYiddID0gbmV3IGNjLl9QcmVmYWJJbmZvKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2NlbmVbJ19wcmVmYWInXS50YXJnZXRPdmVycmlkZXMgPSBkZWNvZGVUYXJnZXRPdmVycmlkZXMoZHVtcC50YXJnZXRPdmVycmlkZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNjZW5lWydfcHJlZmFiJ10gPSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG4vKipcbiAqIOino+eggeS4gOS4qiBkdW1wIOaVsOaNrlxuICogQHBhcmFtIGR1bXBcbiAqIEBwYXJhbSBub2RlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWNvZGVOb2RlKGR1bXA6IElOb2RlLCBub2RlPzogTm9kZSwgZXhjbHVkZUNvbXBzPzogYW55KSB7XG4gICAgaWYgKCFkdW1wKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIG5vZGUgPSBub2RlIHx8IG5ldyBjYy5Ob2RlKCk7XG5cbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8g5YWI6L+Y5Y6fcHJlZmFi55qE55u45YWz5L+h5oGv77yM5Zug5Li65LiL6Z2i55qE5bGe5oCn6K6+572u5Lya6Kem5Y+RcHJlZmFi55qEb3ZlcnJpZGVcbiAgICBhd2FpdCBkZWNvZGVQcmVmYWIoZHVtcC5fX3ByZWZhYl9fLCBub2RlKTtcblxuICAgIG5vZGUubmFtZSA9IGR1bXAubmFtZS52YWx1ZSBhcyBzdHJpbmc7XG4gICAgbm9kZS5hY3RpdmUgPSBkdW1wLmFjdGl2ZS52YWx1ZSBhcyBib29sZWFuO1xuICAgIG5vZGUubGF5ZXIgPSBkdW1wLmxheWVyLnZhbHVlIGFzIG51bWJlcjtcbiAgICBub2RlLm1vYmlsaXR5ID0gZHVtcC5tb2JpbGl0eS52YWx1ZSBhcyBudW1iZXI7XG4gICAgbm9kZS5zZXRQb3NpdGlvbihkdW1wLnBvc2l0aW9uLnZhbHVlIGFzIFZlYzMpO1xuICAgIGNvbnN0IHF1YXQgPSBuZXcgUXVhdCgpO1xuICAgIGNvbnN0IHZlYzMgPSBkdW1wLnJvdGF0aW9uLnZhbHVlIGFzIFZlYzM7XG4gICAgUXVhdC5mcm9tRXVsZXIocXVhdCwgdmVjMy54LCB2ZWMzLnksIHZlYzMueik7XG4gICAgbm9kZS5zZXRSb3RhdGlvbihxdWF0KTtcbiAgICBub2RlLnNldFNjYWxlKGR1bXAuc2NhbGUudmFsdWUgYXMgVmVjMyk7XG5cbiAgICBkZWNvZGVNb3VudGVkUm9vdChub2RlLCBkdW1wLm1vdW50ZWRSb290KTtcblxuICAgIGlmIChkdW1wLnBhcmVudCAmJiBkdW1wLnBhcmVudC52YWx1ZSAmJiBkdW1wLnBhcmVudC52YWx1ZS51dWlkKSB7XG4gICAgICAgIG5vZGUucGFyZW50ID0gZ2V0RHVtcE5vZGVBY2Nlc3MoKS5xdWVyeShkdW1wLnBhcmVudC52YWx1ZS51dWlkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBub2RlLnBhcmVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChkdW1wLmNoaWxkcmVuKSB7XG4gICAgICAgIGRlY29kZUNoaWxkcmVuKGR1bXAuY2hpbGRyZW4sIG5vZGUpO1xuICAgIH1cblxuICAgIGF3YWl0IGRlY29kZUNvbXBvbmVudHMoZHVtcC5fX2NvbXBzX18sIG5vZGUsIGV4Y2x1ZGVDb21wcyk7XG5cbiAgICByZXR1cm4gbm9kZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX2RlY29kZUJ5VHlwZSh0eXBlOiBzdHJpbmcsIG5vZGU6IGFueSwgaW5mbzogYW55LCBkdW1wOiBhbnksIG9wdHM/OiBhbnkpIHtcbiAgICBjb25zdCBkdW1wVHlwZSA9IER1bXBEZWZpbmVzW3R5cGVdO1xuXG4gICAgaWYgKGR1bXBUeXBlKSB7XG4gICAgICAgIGF3YWl0IGR1bXBUeXBlLmRlY29kZShub2RlLCBpbmZvLCBkdW1wLCBvcHRzKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIOino+eggeS4gOS4qiBkdW1wIOihpeS4geWIsOaMh+WumueahCBub2RlIOS4ilxuICogQHBhcmFtIHBhdGhcbiAqIEBwYXJhbSBkdW1wXG4gKiBAcGFyYW0gbm9kZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVjb2RlUGF0Y2gocGF0aDogc3RyaW5nLCBkdW1wOiBhbnksIG5vZGU6IGFueSkge1xuICAgIC8vIOWwhiBkdW1wIHBhdGgg6L2s5oiQ5a6e6ZmF55qEIG5vZGUgc2VhcmNoIHBhdGhcbiAgICBjb25zdCBpbmZvID0gcGFyc2luZ1BhdGgocGF0aCwgbm9kZSk7XG4gICAgY29uc3QgcGFyZW50SW5mbyA9IHBhcnNpbmdQYXRoKGluZm8uc2VhcmNoLCBub2RlKTtcblxuICAgIGNvbnN0IGZvcmJpZFVzZXJDaGFuZ2VzID0gW1xuICAgICAgICBlZGl0b3JFeHRyYXNUYWcsXG4gICAgICAgICdfX3NjcmlwdEFzc2V0JyxcbiAgICAgICAgJ25vZGUnLFxuICAgICAgICAndXVpZCcsXG4gICAgXTtcblxuICAgIC8vIOiOt+WPlumcgOimgeS/ruaUueeahOaVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBpbmZvLnNlYXJjaCA/IGdldChub2RlLCBpbmZvLnNlYXJjaCkgOiBub2RlO1xuXG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIENvbXBvbmVudCAmJiBmb3JiaWRVc2VyQ2hhbmdlcy5pbmNsdWRlcyhpbmZvLmtleSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSkgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgIC8vIOWPquWvuSBqc29uIOagvOW8j+WkhOeQhu+8jGFycmF5IOetieWFtuS7luaVsOaNruaUvuihjFxuICAgICAgICAvLyDliKTmlq3lsZ7mgKfmmK/lkKbkuLogcmVhZG9ubHks5piv5YiZ6Lez6L+H6L+Y5Y6f5q2l6aqkXG4gICAgICAgIGxldCBwcm9wZXJ0eUNvbmZpZzogYW55ID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihkYXRhLCBpbmZvLmtleSk7XG4gICAgICAgIC8vIFRPRE8ocWdoKTog5pqC5pe25LiN5pSv5oyB5Y6f55Sf5Zy65pmvXG4gICAgICAgIC8vIOWOn+eUn+WcuuaZr+S4i+aXtuWPluS4jeWIsOWvueixoeeahOWxnuaAp+aDheWGteaXtu+8jOmcgOimgeWwneivleiOt+WPluWPluWvueixoeeahF9fcHJvdG9fX+aJjeiDveiOt+WPluWIsGpzYuS4reWumuS5ieeahOWxnuaAp+aDheWGtVxuICAgICAgICAvLyBpZiAod2luZG93LmlzU2NlbmVOYXRpdmUgJiYgcHJvcGVydHlDb25maWcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyAgICAgcHJvcGVydHlDb25maWcgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGRhdGEuX19wcm90b19fLCBpbmZvLmtleSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHByb3BlcnR5Q29uZmlnID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIOWOn+Wei+mTvuS4iueahOWIpOaWrVxuICAgICAgICAgICAgcHJvcGVydHlDb25maWcgPSBjYy5DbGFzcy5hdHRyKGRhdGEsIGluZm8ua2V5KTtcbiAgICAgICAgICAgIGlmICghcHJvcGVydHlDb25maWcgfHwgIXByb3BlcnR5Q29uZmlnLmhhc1NldHRlcikge1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOaYr+S4gOS4quayoeaciee7j+i/h+S/rumlsOWZqOeahOaVsOaNru+8jOWwseS8mui/m+i/memHjFxuICAgICAgICAgICAgICAgIC8vIOe7j+i/hyAyMDIwLzA4LzI1IOW8leaTjuS/rumlsOaDheaVtOeQhuWQju+8jGdldHRlciDpg73kuI3kvJrluKbkv67ppbDlmajvvIzmiYDku6XpnIDopoHnm7TmjqXotYvlgLxcbiAgICAgICAgICAgICAgICAvLyDkvovlpoIgZW5hYmxlZFxuICAgICAgICAgICAgICAgIC8vIOWmguaenCBwcm9wZXJ0eUNvbmZpZy5oYXNHZXR0ZXIg5Li6IHRydWXvvIzor7TmmI7mmK/kuIDkuKrlj6ror7vnmoQgY2NjbGFzcyDlsZ7mgKdcbiAgICAgICAgICAgICAgICBpZiAoaW5mby5rZXkgaW4gZGF0YSAmJiAoIXByb3BlcnR5Q29uZmlnIHx8IHByb3BlcnR5Q29uZmlnLmhhc0dldHRlciAhPT0gdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtpbmZvLmtleV0gPSBkdW1wLnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXByb3BlcnR5Q29uZmlnLndyaXRhYmxlICYmICFwcm9wZXJ0eUNvbmZpZy5zZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBhcmVudERhdGEgPSBwYXJlbnRJbmZvLnNlYXJjaCA/IGdldChub2RlLCBwYXJlbnRJbmZvLnNlYXJjaCkgOiBub2RlO1xuXG4gICAgLy8g5aaC5p6cIGR1bXAudmFsdWUg5Li6IG51bGzvvIzliJnpnIDopoHoh6rliqjloavlhYXpu5jorqTmlbDmja5cbiAgICBpZiAoISgndmFsdWUnIGluIGR1bXApIHx8IGR1bXAudHlwZSA9PT0gJ1Vua25vd24nKSB7XG4gICAgICAgIGxldCBhdHRyID0gY2MuQ2xhc3MuYXR0cihkYXRhLCBpbmZvLmtleSk7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmVudERhdGEpICYmIHBhcmVudEluZm8uc2VhcmNoICE9PSAnX2NvbXBvbmVudHMnKSB7XG4gICAgICAgICAgICBjb25zdCBncmFuZEluZm8gPSBwYXJzaW5nUGF0aChwYXJlbnRJbmZvLnNlYXJjaCwgbm9kZSk7XG4gICAgICAgICAgICBjb25zdCBncmFuZERhdGEgPSBncmFuZEluZm8uc2VhcmNoID8gZ2V0KG5vZGUsIGdyYW5kSW5mby5zZWFyY2gpIDogbm9kZTtcbiAgICAgICAgICAgIGF0dHIgPSBjYy5DbGFzcy5hdHRyKGdyYW5kRGF0YSwgZ3JhbmRJbmZvLmtleSk7XG4gICAgICAgICAgICBhdHRyID0gY2MuQ2xhc3MuYXR0cihhdHRyLmN0b3IsIGluZm8ua2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0RGVmYXVsdEF0dHJEYXRhKGF0dHIpO1xuICAgICAgICBkYXRhW2luZm8ua2V5XSA9IHZhbHVlO1xuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyDojrflj5bmlbDmja7nmoTnsbvlnotcbiAgICBjb25zdCBjY1R5cGUgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShkdW1wLnR5cGUpO1xuICAgIGNvbnN0IGNjRXh0ZW5kcyA9IGNjVHlwZSA/IGdldFR5cGVJbmhlcml0YW5jZUNoYWluKGNjVHlwZSkgOiBbXTtcbiAgICBjb25zdCBzY2VuZVR5cGUgPSAnY2MuU2NlbmUnO1xuICAgIGNvbnN0IG5vZGVUeXBlID0gJ2NjLk5vZGUnO1xuICAgIGNvbnN0IGNvbXBvbmVudFR5cGUgPSAnY2MuQ29tcG9uZW50JztcbiAgICBjb25zdCBhc3NldFR5cGUgPSAnY2MuQXNzZXQnO1xuICAgIGNvbnN0IHZhbHVlVHlwZSA9ICdjYy5WYWx1ZVR5cGUnO1xuXG4gICAgLy8g5a6e6ZmF5L+u5pS55pWw5o2uXG4gICAgaWYgKGR1bXAuaXNBcnJheSkge1xuICAgICAgICAvLyDpnIDopoHlr7nmlbDnu4TlhoXpg6jloavlhYXlh4bnoa7nmoTpu5jorqTlgLzvvIzmlrDlgLzlj6/og73mmK/kuIDkuKogY2NDbGFzcyDnsbtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZHVtcC52YWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGFycmF5VmFsdWU6IGFueSA9IFtdO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRyID0gY2MuQ2xhc3MuYXR0cihkYXRhLmNvbnN0cnVjdG9yLCBpbmZvLmtleSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGR1bXAudmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiDov5nkuKrmmK/ljoblj7LpgZfnlZnotYvlgLzkuIDkuKrliJ3lp4vlgLzvvIzlj6/og73msqHmnInpnIDopoHvvIxcbiAgICAgICAgICAgICAgICAgKiDop4Llr5/kuIDmrrXml7bpl7RcbiAgICAgICAgICAgICAgICAgKiDlpoLmnpzlkI7nu63lj5HnjrDnnJ/nmoTmnInkuIDkupvlnLrmma/pnIDopoHor7fkv67mlLnmnKzmnaHms6jph4pcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBhcnJheVZhbHVlW2ldID0gY2NDbGFzc0F0dHJQcm9wZXJ0eURlZmF1bHRWYWx1ZShhdHRyKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBkZWNvZGVQYXRjaChgJHtpfWAsIGR1bXAudmFsdWVbaV0sIGFycmF5VmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRhW2luZm8ua2V5XSA9IGFycmF5VmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhW2luZm8ua2V5XSA9IFtdO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgb3B0czogYW55ID0ge307XG4gICAgICAgIG9wdHMuY2NUeXBlID0gY2NUeXBlO1xuICAgICAgICAvLyBUT0RPKHFnaCk65a+55LqORWRpdG9y77yM5Lyg5YWl56m655qE6LWE5LqndXVpZO+8jOS4jeS8muaKpemUme+8jOS9huaYr2NsaemcgOimgeaKpemUmeOAguWvueS6jmNsaeeahOaKpemUmemcgOimgeWunueOsFxuICAgICAgICBvcHRzLnN1cHByZXNzRXJyb3IgPSB0cnVlO1xuICAgICAgICAvLyDnibnmrorlsZ7mgKdcbiAgICAgICAgaWYgKGluZm8ua2V5IGluIG5vZGVTcGVjaWFsUHJvcGVydHlEZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgICAgIHNldE5vZGVTcGVjaWFsUHJvcGVydHkobm9kZSwgaW5mby5rZXksIGR1bXAudmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGF3YWl0IF9kZWNvZGVCeVR5cGUoZHVtcC50eXBlLCBkYXRhLCBpbmZvLCBkdW1wLCBvcHRzKSkge1xuICAgICAgICAgICAgLy8gZW1wdHlcbiAgICAgICAgfSBlbHNlIGlmIChzY2VuZVR5cGUgPT09IGR1bXAudHlwZSkge1xuICAgICAgICAgICAgX2RlY29kZUJ5VHlwZShub2RlVHlwZSwgZGF0YSwgaW5mbywgZHVtcCwgb3B0cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGR1bXAudmFsdWUpKSB7XG4gICAgICAgICAgICBfZGVjb2RlQnlUeXBlKCdUeXBlZEFycmF5JywgZGF0YSwgaW5mbywgZHVtcCwgb3B0cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2NFeHRlbmRzLmluY2x1ZGVzKG5vZGVUeXBlKSB8fCBub2RlVHlwZSA9PT0gZHVtcC50eXBlKSB7XG4gICAgICAgICAgICBfZGVjb2RlQnlUeXBlKG5vZGVUeXBlLCBkYXRhLCBpbmZvLCBkdW1wLCBvcHRzKTtcbiAgICAgICAgfSBlbHNlIGlmIChjY0V4dGVuZHMuaW5jbHVkZXMoYXNzZXRUeXBlKSB8fCBhc3NldFR5cGUgPT09IGR1bXAudHlwZSkge1xuICAgICAgICAgICAgYXdhaXQgX2RlY29kZUJ5VHlwZShhc3NldFR5cGUsIGRhdGEsIGluZm8sIGR1bXAsIG9wdHMpO1xuICAgICAgICB9IGVsc2UgaWYgKGNjRXh0ZW5kcy5pbmNsdWRlcyhjb21wb25lbnRUeXBlKSB8fCBjb21wb25lbnRUeXBlID09PSBkdW1wLnR5cGUpIHtcbiAgICAgICAgICAgIF9kZWNvZGVCeVR5cGUoY29tcG9uZW50VHlwZSwgZGF0YSwgaW5mbywgZHVtcCwgb3B0cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2NFeHRlbmRzLmluY2x1ZGVzKHZhbHVlVHlwZSkpIHtcbiAgICAgICAgICAgIF9kZWNvZGVCeVR5cGUodmFsdWVUeXBlLCBkYXRhLCBpbmZvLCBkdW1wLCBvcHRzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmtleSA9PT0gJ2xlbmd0aCcgJiYgZHVtcC50eXBlID09PSAnQXJyYXknKSB7XG4gICAgICAgICAgICAvLyDmm7TmlLnmlbDnu4Tplb/luqbml7bpgKDnmoTmlbDmja5cbiAgICAgICAgICAgIHdoaWxlIChkYXRhLmxlbmd0aCA+IGR1bXAudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnBvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcGFyZW50RGF0YSA9IGdldChub2RlLCBwYXJlbnRJbmZvLnNlYXJjaCk7XG4gICAgICAgICAgICBjb25zdCBhdHRyID0gY2MuQ2xhc3MuYXR0cihwYXJlbnREYXRhLCBwYXJlbnRJbmZvLmtleSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gZGF0YS5sZW5ndGg7IGkgPCBkdW1wLnZhbHVlOyBpKyspIHtcbiAgICAgICAgICAgICAgICBkYXRhW2ldID0gY2NDbGFzc0F0dHJQcm9wZXJ0eURlZmF1bHRWYWx1ZShhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldChub2RlLCBpbmZvLnNlYXJjaCwgZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY2NUeXBlICYmICFkYXRhW2luZm8ua2V5XSAmJiBkdW1wLnZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGF0YVtpbmZvLmtleV0gPSBuZXcgY2NUeXBlKCk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjY1R5cGUuX19wcm9wc19fLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IGNjVHlwZS5fX3Byb3BzX19baV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBkdW1wLnZhbHVlW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBkZWNvZGVQYXRjaChgJHtwYXRofS4ke2tleX1gLCBpdGVtLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZHVtcC52YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIOS4i+S4gOihjOeahCB0eXBlb2YgbnVsbCA9PT0gJ29iamVjdCcgLCDov5nooYzlop7liqDlrrnplJlcbiAgICAgICAgICAgICAgICBkYXRhW2luZm8ua2V5XSA9IGR1bXAudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkdW1wLnZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGR1bXAudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGR1bXAudmFsdWVba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGRlY29kZVBhdGNoKGtleSwgZHVtcC52YWx1ZVtrZXldLCBkYXRhW2luZm8ua2V5XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkYXRhW2luZm8ua2V5XSA9IGR1bXAudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5mby5zZWFyY2gpIHtcbiAgICAgICAgc2V0KG5vZGUsIGluZm8uc2VhcmNoLCBkYXRhKTtcbiAgICB9XG4gICAgaWYgKHBhcmVudEluZm8gJiYgcGFyZW50SW5mby5zZWFyY2gpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGdldChub2RlLCBwYXJlbnRJbmZvLnNlYXJjaCk7XG4gICAgICAgIC8vIOWvuee7hOS7tuS4i+eahOiHquWumuS5ieexu+Wei+i/m+ihjOi/mOWOn+aXtu+8jOWPr+iDveWtmOWcqOayoeaciXNldHRlcueahOaDheWGtVxuICAgICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIE9iamVjdCAmJiBjYy5DbGFzcy5hdHRyKGRhdGEsIGluZm8ua2V5KT8uaGFzU2V0dGVyKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2VsZi1hc3NpZ25cbiAgICAgICAgICAgIGRhdGFbcGFyZW50SW5mby5rZXldID0gZGF0YVtwYXJlbnRJbmZvLmtleV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnR5cGUgTm9kZVNwZWNpYWxQcm9wZXJ0eSA9IHtcbiAgICBfbHBvczogKCkgPT4gVmVjMztcbiAgICBldWxlckFuZ2xlczogKCkgPT4gVmVjMztcbiAgICBfbHNjYWxlOiAoKSA9PiBWZWMzO1xuICAgIG1vYmlsaXR5OiAoKSA9PiBudW1iZXI7XG59O1xuXG4vLyDoioLngrnnibnmrorlsZ7mgKfpnIDopoHlj6blpJbnlKggbWV0aG9kIOiuvue9rlxuY29uc3Qgbm9kZVNwZWNpYWxQcm9wZXJ0eURlZmF1bHRWYWx1ZTogTm9kZVNwZWNpYWxQcm9wZXJ0eSA9IHtcbiAgICBfbHBvcygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWMzKDAsIDAsIDApO1xuICAgIH0sXG4gICAgZXVsZXJBbmdsZXMoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjMygwLCAwLCAwKTtcbiAgICB9LFxuICAgIF9sc2NhbGUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmVjMygxLCAxLCAxKTtcbiAgICB9LFxuICAgIG1vYmlsaXR5KCkge1xuICAgICAgICByZXR1cm4gTW9iaWxpdHlNb2RlLlN0YXRpYztcbiAgICB9LFxufTtcblxuZnVuY3Rpb24gc2V0Tm9kZVNwZWNpYWxQcm9wZXJ0eShub2RlOiBhbnksIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBjYy5Ob2RlKSB7XG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICBjYXNlICdfbHBvcyc6XG4gICAgICAgICAgICAgICAgbm9kZS5wb3NpdGlvbiA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZXVsZXJBbmdsZXMnOlxuICAgICAgICAgICAgICAgIG5vZGUuZXVsZXJBbmdsZXMgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ19sc2NhbGUnOlxuICAgICAgICAgICAgICAgIG5vZGUuc2NhbGUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ21vYmlsaXR5JzpcbiAgICAgICAgICAgICAgICBub2RlLm1vYmlsaXR5ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRBdHRyRGF0YShhdHRyOiBhbnkpIHtcbiAgICBsZXQgdmFsdWUgPSBnZXREZWZhdWx0KGF0dHIpO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUuY2xvbmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuY2xvbmUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldFByb3BlcnR5KG5vZGU6IGFueSwgcGF0aDogc3RyaW5nKSB7XG4gICAgLy8g5bCGIGR1bXAgcGF0aCDovazmiJDlrp7pmYXnmoQgbm9kZSBzZWFyY2ggcGF0aFxuICAgIGNvbnN0IGluZm8gPSBwYXJzaW5nUGF0aChwYXRoLCBub2RlKTtcbiAgICAvLyDojrflj5bpnIDopoHkv67mlLnnmoTmlbDmja5cbiAgICBjb25zdCBkYXRhID0gaW5mby5zZWFyY2ggPyBnZXQobm9kZSwgaW5mby5zZWFyY2gpIDogbm9kZTtcblxuICAgIGlmICghZGF0YSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGluZm8ua2V5IGluIG5vZGVTcGVjaWFsUHJvcGVydHlEZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBub2RlU3BlY2lhbFByb3BlcnR5RGVmYXVsdFZhbHVlW2luZm8ua2V5IGFzIGtleW9mIE5vZGVTcGVjaWFsUHJvcGVydHldKCk7XG4gICAgICAgIHNldE5vZGVTcGVjaWFsUHJvcGVydHkoZGF0YSwgaW5mby5rZXksIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBhdHRyID0gY2MuQ2xhc3MuYXR0cihkYXRhLmNvbnN0cnVjdG9yLCBpbmZvLmtleSk7XG4gICAgICAgIGRhdGFbaW5mby5rZXldID0gZ2V0RGVmYXVsdEF0dHJEYXRhKGF0dHIpO1xuICAgIH1cbn1cblxuLy8g5bCG5LiA5Liq5bGe5oCn5YW2546w5a2Y5YC85LiO5a6a5LmJ57G75Z6L5YC85LiN5Yy56YWN77yM5oiW6ICF5Li6IG51bGwg6buY6K6k5YC877yM5pS55Li65LiA5Liq5Y+v57yW6L6R55qE5YC8XG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlUHJvcGVydHlGcm9tTnVsbChub2RlOiBhbnksIHBhdGg6IHN0cmluZykge1xuICAgIC8vIOWwhiBkdW1wIHBhdGgg6L2s5oiQ5a6e6ZmF55qEIG5vZGUgc2VhcmNoIHBhdGhcbiAgICBjb25zdCBpbmZvID0gcGFyc2luZ1BhdGgocGF0aCwgbm9kZSk7XG4gICAgLy8g6I635Y+W6ZyA6KaB5L+u5pS555qE5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGluZm8uc2VhcmNoID8gZ2V0KG5vZGUsIGluZm8uc2VhcmNoKSA6IG5vZGU7XG5cbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGF0dHIgPSBjYy5DbGFzcy5hdHRyKGRhdGEuY29uc3RydWN0b3IsIGluZm8ua2V5KTtcbiAgICBkYXRhW2luZm8ua2V5XSA9IGdldERlZmF1bHRBdHRyRGF0YShhdHRyKTtcblxuICAgIGlmICgoZGF0YVtpbmZvLmtleV0gPT09IG51bGwgfHwgZGF0YVtpbmZvLmtleV0gPT09IHVuZGVmaW5lZCkgJiYgYXR0ci5jdG9yKSB7XG4gICAgICAgIGRhdGFbaW5mby5rZXldID0gbmV3IGF0dHIuY3RvcigpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVRhcmdldE92ZXJyaWRlcyhkdW1wZWRUYXJnZXRPdmVycmlkZXM6IElUYXJnZXRPdmVycmlkZUluZm9bXSkge1xuICAgIGNvbnN0IG5vZGVBY2Nlc3MgPSBnZXREdW1wTm9kZUFjY2VzcygpO1xuICAgIGNvbnN0IHRhcmdldE92ZXJyaWRlczogVGFyZ2V0T3ZlcnJpZGVJbmZvW10gPSBbXTtcbiAgICBkdW1wZWRUYXJnZXRPdmVycmlkZXMuZm9yRWFjaCgoaXRyOiBJVGFyZ2V0T3ZlcnJpZGVJbmZvKSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldE92ZXJyaWRlID0gbmV3IFRhcmdldE92ZXJyaWRlSW5mbygpO1xuICAgICAgICB0YXJnZXRPdmVycmlkZS5zb3VyY2UgPSBub2RlQWNjZXNzLnF1ZXJ5KGl0ci5zb3VyY2UpO1xuICAgICAgICBpZiAoaXRyLnNvdXJjZUluZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZUluZm8gPSBuZXcgVGFyZ2V0SW5mbygpO1xuICAgICAgICAgICAgc291cmNlSW5mby5sb2NhbElEID0gaXRyLnNvdXJjZUluZm87XG4gICAgICAgICAgICB0YXJnZXRPdmVycmlkZS5zb3VyY2VJbmZvID0gc291cmNlSW5mbztcbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldE92ZXJyaWRlLnByb3BlcnR5UGF0aCA9IGl0ci5wcm9wZXJ0eVBhdGg7XG5cbiAgICAgICAgdGFyZ2V0T3ZlcnJpZGUudGFyZ2V0ID0gbm9kZUFjY2Vzcy5xdWVyeShpdHIudGFyZ2V0KTtcbiAgICAgICAgaWYgKGl0ci50YXJnZXRJbmZvKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRJbmZvID0gbmV3IFRhcmdldEluZm8oKTtcbiAgICAgICAgICAgIHRhcmdldEluZm8ubG9jYWxJRCA9IGl0ci50YXJnZXRJbmZvO1xuICAgICAgICAgICAgdGFyZ2V0T3ZlcnJpZGUudGFyZ2V0SW5mbyA9IHRhcmdldEluZm87XG4gICAgICAgIH1cblxuICAgICAgICB0YXJnZXRPdmVycmlkZXMucHVzaCh0YXJnZXRPdmVycmlkZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0T3ZlcnJpZGVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZGVjb2RlU2NlbmUsXG4gICAgZGVjb2RlTm9kZSxcbiAgICBkZWNvZGVQYXRjaCxcbiAgICByZXNldFByb3BlcnR5LFxuICAgIHVwZGF0ZVByb3BlcnR5RnJvbU51bGwsXG4gICAgZGVjb2RlTW91bnRlZFJvb3QsXG4gICAgZGVjb2RlVGFyZ2V0T3ZlcnJpZGVzLFxufTtcbiJdfQ==