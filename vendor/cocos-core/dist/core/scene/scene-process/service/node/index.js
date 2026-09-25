'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeManager = void 0;
/**
 * 节点管理器
 * 负责管理当前打开场景的 uuid 与节点对应关系
 */
const NodeMgr = EditorExtends.Node;
const get_1 = __importDefault(require("lodash/get"));
const set_1 = __importDefault(require("lodash/set"));
const findLast_1 = __importDefault(require("lodash/findLast"));
const node_utils_1 = require("./node-utils");
const utils_1 = require("../prefab/utils");
const global_events_1 = require("../core/global-events");
// const { promisify } = require('util');
// const { basename, extname } = require('path');
// import nodeUtil from '../../../utils/node';
const dump_1 = __importDefault(require("../dump"));
const service_access_1 = require("../dump/service-access");
const decorator_1 = require("../core/decorator");
// import getComponentFunctionOfNode from '../component/get-component-function-of-node';
const cc_1 = require("cc");
const event_enum_1 = require("../public/event-enum");
const node_create_1 = require("./node-create");
const index_1 = __importDefault(require("../component/index"));
const rpc_1 = require("../../rpc");
const creatableAssetTypes = [
    'cc.AnimationClip',
    'cc.AudioClip',
    'cc.BitmapFont',
    'cc.LabelAtlas',
    'cc.Mesh',
    'cc.ParticleAsset',
    'cc.Prefab',
    'cc.Script',
    'cc.SpriteFrame',
    'cc.TTFFont',
    'cc.TerrainAsset',
    'cc.TiledMapAsset',
    'cc.VideoClip',
    'dragonBones.DragonBonesAsset',
    'dragonBones.DragonBonesAtlasAsset',
    'sp.SkeletonData',
];
// 用于复制粘贴操作，暂存被复制节点的 clone 对象
let stashInstants = null;
/**
 * 节点管理器
 *
 * Events:
 *   node.on('before-change', (node) => {});
 *   node.on('before-add', (node) => {});
 *   node.on('before-remove', (node) => {});
 *   node.on('change', (node) => {});
 *   node.on('add', (node) => {});
 *   node.on('remove', (node) => {});
 */
class NodeManager {
    emit(event, ...args) {
        global_events_1.ServiceEvents.emit(event, ...args);
    }
    _previewPropertysCache = new Map();
    get creatableAssetTypes() {
        return creatableAssetTypes;
    }
    init() { }
    /**
     * 传入一个场景，将内部的节点全部缓存
     * @param {*} scene
     */
    initWithScene(scene) {
        if (!scene) {
            return;
        }
        // 场景载入后要将现有节点监听所需事件
        this.registerEventListenersForCurrentSceneNodes();
        this.registerNodeMgrEvents();
        // 组件事件转发由 ComponentService 统一负责。NodeManager 只使用 compMgr
        // 做组件查询和缓存清理；这里注册会导致编辑器打开/重载后重复触发
        // component:added/component:removed。
        // 缓存预览设置的属性，用于还原预览前的设置
        this._previewPropertysCache = new Map();
        this.emit('node:inited', this.queryUuids(), scene);
    }
    registerEventListenersForCurrentSceneNodes() {
        const nodeMap = NodeMgr.getNodesInScene();
        Object.keys(nodeMap).forEach((key) => {
            this.registerEventListeners(nodeMap[key]);
        });
    }
    onEditorOpened() {
        this.initWithScene(decorator_1.Service.Editor.getRootNode() ?? cc_1.director.getScene());
    }
    onEditorClosed() {
        this.unregisterNodeMgrEvents();
        this.clear();
        stashInstants = null;
    }
    NodeMgrEventHandlers = {
        ['add']: 'add',
        ['change']: 'change',
        ['remove']: 'remove',
    };
    nodeMgrEventHandlers = new Map();
    /**
     * 注册引擎 Node 管理相关事件的监听
     */
    registerNodeMgrEvents() {
        this.unregisterNodeMgrEvents();
        Object.entries(this.NodeMgrEventHandlers).forEach(([eventType, handlerName]) => {
            const handler = this[handlerName].bind(this);
            NodeMgr.on(eventType, handler);
            this.nodeMgrEventHandlers.set(eventType, handler);
            // console.log(`NodeMgr on ${eventType}`);
        });
    }
    unregisterNodeMgrEvents() {
        for (const eventType of this.nodeMgrEventHandlers.keys()) {
            const handler = this.nodeMgrEventHandlers.get(eventType);
            if (handler) {
                NodeMgr.off(eventType, handler);
                this.nodeMgrEventHandlers.delete(eventType);
                // console.log(`NodeMgr off ${eventType}`);
            }
        }
    }
    NodeHandlers = {
        [cc_1.Node.EventType.TRANSFORM_CHANGED]: 'onNodeTransformChanged',
        [cc_1.Node.EventType.SIZE_CHANGED]: 'onNodeSizeChanged',
        [cc_1.Node.EventType.ANCHOR_CHANGED]: 'onNodeAnchorChanged',
        [cc_1.Node.EventType.CHILD_ADDED]: 'onNodeParentChanged',
        [cc_1.Node.EventType.CHILD_REMOVED]: 'onNodeParentChanged',
        [cc_1.Node.EventType.LIGHT_PROBE_CHANGED]: 'onLightProbeChanged',
        [cc_1.Node.EventType.LIGHT_PROBE_BAKING_CHANGED]: 'onLightProbeBakingChanged',
    };
    nodeHandlers = new Map();
    /**
     * 监听引擎发出的 node 事件
     * @param {*} node
     */
    registerEventListeners(node) {
        if (!node || !node.isValid || (0, node_utils_1.isEditorNode)(node)) {
            return;
        }
        // 遍历事件映射表，统一注册事件
        Object.entries(this.NodeHandlers).forEach(([eventType, handlerName]) => {
            const boundHandler = this[handlerName].bind(this, node);
            const key = `${eventType}_${node.uuid}`;
            if (this.nodeHandlers.has(key)) {
                return;
            }
            node.on(eventType, boundHandler, this);
            this.nodeHandlers.set(key, boundHandler);
        });
    }
    /**
     * 取消监听引擎发出的node事件
     * @param {*} node
     */
    unregisterEventListeners(node) {
        if (!node || !node.isValid || (0, node_utils_1.isEditorNode)(node)) {
            return;
        }
        // 遍历事件映射表，统一取消事件
        Object.keys(this.NodeHandlers).forEach(eventType => {
            const key = `${eventType}_${node.uuid}`;
            const handler = this.nodeHandlers.get(key);
            if (handler) {
                node.off(eventType, handler);
                this.nodeHandlers.delete(key);
            }
        });
    }
    onNodeTransformChanged(node, transformBit) {
        const changeOpts = { type: event_enum_1.NodeEventType.TRANSFORM_CHANGED, source: event_enum_1.EventSourceType.ENGINE };
        switch (transformBit) {
            case cc_1.Node.TransformBit.POSITION:
                changeOpts.propPath = 'position';
                break;
            case cc_1.Node.TransformBit.ROTATION:
                changeOpts.propPath = 'rotation';
                break;
            case cc_1.Node.TransformBit.SCALE:
                changeOpts.propPath = 'scale';
                break;
        }
        this.emit('node:change', node, changeOpts);
    }
    onNodeSizeChanged(node) {
        const changeOpts = { type: event_enum_1.NodeEventType.SIZE_CHANGED, source: event_enum_1.EventSourceType.ENGINE };
        const uiTransform = node.getComponent(cc_1.UITransform);
        if (uiTransform) {
            const index = node.components.indexOf(uiTransform);
            changeOpts.propPath = `_components.${index}.contentSize`;
        }
        this.emit('node:change', node, changeOpts);
    }
    onNodeAnchorChanged(node) {
        const changeOpts = { type: event_enum_1.NodeEventType.ANCHOR_CHANGED, source: event_enum_1.EventSourceType.ENGINE };
        const uiTransform = node.getComponent(cc_1.UITransform);
        if (uiTransform) {
            const index = node.components.indexOf(uiTransform);
            changeOpts.propPath = `_components.${index}.anchorPoint`;
        }
        this.emit('node:change', node, changeOpts);
    }
    /**
     * 监听引擎中节点 node.setParent(parent) 所发出来的事件
     * @param {*} parent
     * @param {*} child
     */
    onNodeParentChanged(parent, child) {
        if ((0, node_utils_1.isEditorNode)(child)) {
            return;
        }
        const childAdded = child.parent === parent;
        if (childAdded) {
            NodeMgr.updateNodeParent(child.uuid, parent.uuid);
        }
        this.emit('node:change', parent, { type: event_enum_1.NodeEventType.CHILD_CHANGED });
        // 只有挂入新父节点后，子节点路径索引才稳定；移出旧父节点时只通知旧父节点 children 变化。
        if (childAdded) {
            this.emit('node:change', child, { type: event_enum_1.NodeEventType.PARENT_CHANGED });
        }
    }
    /**
     * 监听light-probe changed事件
     */
    onLightProbeChanged(node) {
        const changeOpts = { type: event_enum_1.NodeEventType.LIGHT_PROBE_CHANGED, source: event_enum_1.EventSourceType.ENGINE };
        this.emit('node:change', node, changeOpts);
    }
    onLightProbeBakingChanged(node) {
        const changeOpts = { type: event_enum_1.NodeEventType.LIGHT_PROBE_BAKING_CHANGED, source: event_enum_1.EventSourceType.ENGINE };
        this.emit('node:change', node, changeOpts);
    }
    /**
     * 清空当前管理的节点
     */
    clear() {
        const nodeMap = NodeMgr.getNodes();
        Object.keys(nodeMap).forEach((key) => {
            this.unregisterEventListeners(nodeMap[key]);
        });
        NodeMgr.clear();
        index_1.default.clear();
    }
    /**
     * 添加一个节点到管理器内
     * @param {*} node
     */
    add(uuid, node) {
        this.registerEventListeners(node);
        if (!(0, node_utils_1.isEditorNode)(node)) {
            this.emit('node:added', node);
        }
    }
    /**
     * 一个节点被修改,由EditorExtends.Node.emit('change')触发
     * @param uuid
     * @param node
     */
    change(uuid, node) {
        if (!(0, node_utils_1.isEditorNode)(node)) {
            // 这里是因为 LOD 组件在挂到场景的时候，修改了自己的数据，但编辑器暂时无法知道修改了哪些数据
            // 所以针对 LOD 部分，增加了 propPath, prefab 才能正常修改
            let path = '';
            const lodGroup = node.getComponent(cc_1.LODGroup);
            if (lodGroup) {
                const index = node.components.indexOf(lodGroup);
                path = `__comps__.${index}`;
            }
            this.emit('node:change', node, { type: event_enum_1.NodeOperationType.SET_PROPERTY, propPath: path });
        }
    }
    /**
     * 从管理器内移除一个指定的节点
     * @param {*} node
     */
    remove(uuid, node) {
        this.unregisterEventListeners(node);
        if (!(0, node_utils_1.isEditorNode)(node)) {
            this.emit('node:removed', node, { source: event_enum_1.EventSourceType.ENGINE });
        }
    }
    /**
     * 查询一个节点的实例
     * @param {*} uuid
     * @return {cc.Node}
     */
    query(uuid) {
        if (typeof uuid === 'undefined') {
            return null;
        }
        return NodeMgr.getNode(uuid);
    }
    getPathByUuid(uuid) {
        const node = NodeMgr.getNode(uuid);
        if (!node)
            return '';
        return NodeMgr.getNodePath(node) ?? '';
    }
    /**
     * 查询受管理的所有节点的 uuid 数组
     */
    queryUuids() {
        const nodeMap = NodeMgr.getNodes();
        return Object.keys(nodeMap);
    }
    /**
     * 查询一个节点，并返回该节点的 dump 数据
     * 如果节点已被删除 parent = null，则返回 null
     * @param {String} uuid
     */
    async queryDump(uuid) {
        // 只查现有场景里的节点，不需要再查回收站里的节点
        const node = NodeMgr.getNodesInScene()[uuid];
        if (!node) {
            return null;
        }
        return dump_1.default.dumpNode(node);
    }
    /**
     * 查询一个节点，并返回该节点的 dump 数据
     * 不论节点是否被删除
     * @param {String} uuid
     */
    async queryDumpAtAll(uuid) {
        const node = this.query(uuid);
        if (!node) {
            return null;
        }
        return dump_1.default.dumpNode(node);
    }
    /**
     * 查询当前场景的节点树信息
     * @param uuid asset uuid
     */
    queryNodesByAssetUuid(uuid) {
        if (!uuid) {
            return [];
        }
        return NodeMgr.getNodesByAsset(uuid);
    }
    /**
     * 获取丢失资源的节点
     * @returns uuids[] 节点数组
     */
    async queryNodesMissAsset() {
        const scene = cc_1.director.getScene();
        if (!scene?.children?.length)
            return [];
        const nodesUuid = new Set();
        const missScripts = [];
        EditorExtends.walkProperties(scene.children, (obj, key, value, parsedObjects) => {
            // 处理资源丢失
            if (value?._uuid) {
                const compressed = EditorExtends.UuidUtils.compressUUID(value._uuid, true);
                const assetExists = cc.assetManager.assets.get(value._uuid) ||
                    cc.assetManager.assets.get(compressed);
                if (!assetExists) {
                    const node = (0, findLast_1.default)(parsedObjects, (item) => item instanceof cc.Node);
                    if (node)
                        nodesUuid.add(node.uuid);
                }
            }
            // 处理 MissingScript
            if (value instanceof cc_1.MissingScript) {
                // @ts-ignore __type__: 存储编译不通过或丢失的脚本 id
                const scriptId = value._$erialized?.__type__;
                if (scriptId) {
                    missScripts.push({
                        nodeUuid: value.node.uuid,
                        scriptUuid: EditorExtends.UuidUtils.decompressUUID(scriptId),
                    });
                }
            }
        }, { dontSkipNull: false, ignoreSubPrefabHelper: true });
        // 批量查询并添加真正丢失的脚本节点
        if (missScripts.length) {
            const existingScripts = new Set((await Promise.all(missScripts.map(({ scriptUuid }) => rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [scriptUuid]))))
                .map((info) => info?.uuid)
                .filter(Boolean));
            for (const { nodeUuid, scriptUuid } of missScripts) {
                if (!existingScripts.has(scriptUuid)) {
                    nodesUuid.add(nodeUuid);
                }
            }
        }
        return Array.from(nodesUuid);
    }
    /**
     * 预览设置属性后的效果，不进入undo堆栈
     * @param uuid
     * @param path
     * @param dump
     * @returns
     */
    async previewSetNodeProperty(uuid, path, dump) {
        const node = NodeMgr.getNode(uuid);
        const info = dump_1.default.parsingPath(path, node);
        if (!node) {
            console.warn('previewSetNodeProperty failed：node not found', uuid);
            return false;
        }
        if (!info.search) {
            console.warn('previewSetNodeProperty failed：property path error', path);
            return false;
        }
        // 需要自己记录设置前的属性，在取消时还原效果;
        let target = (0, get_1.default)(node, info.search) ? (0, get_1.default)(node, info.search)[info.key] : undefined;
        if (!target) {
            // 属性为空时使用默认值
            target = dump_1.default.getDefaultValue(dump.type);
        }
        const data = dump_1.default.encodeObject(target, {
            type: dump.type,
            ctor: target.constructor,
        }, target);
        // @ts-ignore
        const cache = this._previewPropertysCache.has(uuid) ? this._previewPropertysCache.get(uuid) : new Map();
        // 只有第一次预览时的数据，是节点原本的数据
        if (!cache?.has(path)) {
            cache?.set(path, data);
        }
        this._previewPropertysCache.set(uuid, cache);
        // 修改属性，false会避免记录undo操作;
        return await this.setProperty(uuid, path, dump, false);
    }
    async cancelPreviewSetNodeProperty(uuid, path) {
        // 拿到记录的数据，还原回数据
        const node = this.query(uuid);
        const info = dump_1.default.parsingPath(path, node);
        if (!node) {
            console.warn('cancelPreviewSetNodeProperty failed:node not found', uuid);
            return false;
        }
        if (!info.search) {
            console.warn('cancelPreviewSetNodeProperty failed:property path error', path);
            return false;
        }
        const cache = this._previewPropertysCache.get(uuid);
        if (!cache) {
            return false;
        }
        const dump = cache?.get(path);
        if (!dump) {
            return false;
        }
        // 清理掉原来的数据
        cache?.delete(path);
        return await this.setProperty(uuid, path, dump, false);
    }
    /**
     * 设置一个节点的属性
     * @param {*} uuid
     * @param {*} path
     * @param {*} key
     * @param {*} record 是否记录到undo堆栈上
     * @param {*} dump
     */
    async setProperty(uuid, path, dump, record = true) {
        // 多个节点更新值
        if (Array.isArray(uuid)) {
            try {
                for (let i = 0; i < uuid.length; i++) {
                    await this.setProperty(uuid[i], path, dump);
                }
                return true;
            }
            catch (e) {
                console.error(e);
                return false;
            }
        }
        const node = this.query(uuid);
        if (!node) {
            console.warn(`Set property failed: ${uuid} does not exist`);
            return false;
        }
        // 触发修改前的事件
        this.emit('node:before-change', node);
        if (path === 'parent' && node.parent) {
            // 发送节点修改消息
            this.emit('node:before-change', node.parent);
        }
        // 恢复数据
        await dump_1.default.restoreProperty(node, path, dump);
        // 触发修改后的事件
        this.emit('node:change', node, { type: event_enum_1.NodeOperationType.SET_PROPERTY, propPath: path, record: record });
        // 如果是数组的话，需要依次 emit change，路径定位到数组的下标位置
        if (dump.isArray && Array.isArray(dump.value)) {
            dump.value.forEach((item, i) => {
                this.emit('node:change', node, { type: event_enum_1.NodeOperationType.SET_PROPERTY, propPath: `${path}.${i}`, record: record });
            });
        }
        // 改变父子关系
        if (path === 'parent' && node.parent) {
            // 发送节点修改消息
            this.emit('node:change', node.parent, { type: event_enum_1.NodeOperationType.SET_PROPERTY, propPath: 'children', record: record });
        }
        return true;
    }
    /**
     * 设置属性的默认值
     * @param {*} uuid
     * @param {*} path
     * @param {*} type
     */
    async resetProperty(uuid, path) {
        // 多个节点更新值
        if (Array.isArray(uuid)) {
            uuid.forEach((id) => {
                this.resetProperty(id, path);
            });
            return true;
        }
        const node = this.query(uuid);
        if (!node) {
            console.warn(`Set default value failed: ${uuid} does not exist`);
            return false;
        }
        // 触发修改前的事件
        this.emit('node:before-change', node);
        // 恢复数据
        await dump_1.default.resetProperty(node, path);
        // 触发修改后的事件
        this.emit('node:change', node, { type: event_enum_1.NodeOperationType.SET_PROPERTY, propPath: path });
        return true;
    }
    /**
     * 将一个属性其现存值与定义类型值不匹配，或者为 null 默认值，改为一个可编辑的值
     * @param {*} uuid
     * @param {*} path
     */
    async updatePropertyFromNull(uuid, path) {
        // 多个节点更新值
        if (Array.isArray(uuid)) {
            uuid.forEach((id) => {
                this.updatePropertyFromNull(id, path);
            });
            return true;
        }
        const node = this.query(uuid);
        if (!node) {
            console.warn(`Set default value failed: ${uuid} does not exist`);
            return false;
        }
        // 触发修改前的事件
        this.emit('node:before-change', node);
        // 恢复数据
        await dump_1.default.updatePropertyFromNull(node, path);
        // 触发修改后的事件
        this.emit('node:change', node, { type: event_enum_1.NodeOperationType.SET_PROPERTY, propPath: path });
        return true;
    }
    /**
     * 重置节点属性 position rotation scale
     * @param {*} uuid
     */
    async resetNode(uuid) {
        // 多个节点更新值
        if (Array.isArray(uuid)) {
            uuid.forEach((id) => {
                this.resetNode(id);
            });
            return true;
        }
        const node = this.query(uuid);
        if (!node) {
            console.warn(`Set default value failed: ${uuid} does not exist`);
            return false;
        }
        // 触发修改前的事件
        this.emit('node:before-change', node);
        // 恢复数据
        const properties = ['position', 'rotation', 'scale', 'mobility'];
        for (const path of properties) {
            await dump_1.default.resetProperty(node, path);
            // 触发修改后的事件
            this.emit('node:change', node, { type: event_enum_1.NodeOperationType.SET_PROPERTY, propPath: path });
        }
        return true;
    }
    /**
     * 设置某个节点连同它的子集的 layer 属性值
     * @param {*} uuid
     * @param {*} dump
     */
    async setNodeAndChildrenLayer(uuid, dump) {
        await this.setProperty(uuid, 'layer', dump);
        const node = this.query(uuid);
        if (node && node.children && node.children.length > 0) {
            node.children.forEach((child) => {
                this.setNodeAndChildrenLayer(child.uuid, dump);
            });
        }
    }
    /**
     * 调整一个数组类型的数据内某个 item 的位置
     * @param uuid 要被移动的节点或组件
     * @param path 数组的搜索路径
     * @param target 现在的索引位置
     * @param offset 偏移量
     */
    moveArrayElement(uuid, path, target, offset) {
        // TODO: deprecated 这一段 isArray 应该没有用到了，建议一段时间后可以删掉
        if (Array.isArray(uuid)) {
            uuid.forEach((id) => {
                this.moveArrayElement(id, path, target, offset);
            });
            return false;
        }
        const node = this.query(uuid);
        if (!node) {
            console.warn(`Move property failed: ${uuid} does not exist`);
            return false;
        }
        // 因为 path 内的 __comps__ 实际指向的是 _components
        path = path.replace('__comps__', '_components');
        // 找到指定的 data 数据
        const data = path ? (0, get_1.default)(node, path) : node;
        if (!data) {
            console.warn(`Move property failed: ${uuid} does not exist`);
            return false;
        }
        if (!Array.isArray(data)) {
            console.warn(`Move property failed: ${uuid} - ${path} isn't an array`);
            return false;
        }
        // 发送节点修改消息
        this.emit('node:before-change', node);
        // 移动顺序
        if (path === 'children') {
            // 过滤掉类似 Foreground Background 的节点
            const children = data.filter((child) => !(child.objFlags & cc.Object.Flags.HideInHierarchy));
            const child = children[target];
            // 容错处理：新增的节点在引擎中还未创建，就指令其移动，setSiblingIndex 会报错
            if (!child) {
                return false;
            }
            // 找出要移动的节点在没有过滤掉隐藏节点的场景中的位置
            const index = data.indexOf(children[target + offset]);
            child.setSiblingIndex(index);
        }
        else {
            const temp = data.splice(target, 1);
            data.splice(target + offset, 0, temp[0]);
            (0, set_1.default)(node, path, data); // 自身 = 自身（副本），为了兼顾材质需要整体赋值副本的情况
        }
        // 发送节点修改消息
        this.emit('node:change', node, { type: event_enum_1.NodeOperationType.MOVE_ARRAY_ELEMENT, propPath: path });
        return true;
    }
    /**
     * 删除一个数组元素
     * @param uuid 节点的 uuid
     * @param path 元素所在数组的搜索路径
     * @param index 目标 item 原来的索引
     */
    removeArrayElement(uuid, path, index) {
        if (Array.isArray(uuid)) {
            uuid.forEach((id) => {
                this.removeArrayElement(id, path, index);
            });
            return true;
        }
        const node = this.query(uuid);
        const key = (path || '').split('.').pop();
        if (key === 'children') {
            console.warn('Unable to change `children` of the parent, Please change the `parent` of the child');
            return false;
        }
        if (!node) {
            console.warn(`Move property failed: ${uuid} does not exist`);
            return false;
        }
        // 因为 path 内的 __comps__ 实际指向的是 _components
        path = path.replace('__comps__', '_components');
        // 找到指定的 data 数据
        const data = path ? (0, get_1.default)(node, path) : node;
        if (!data) {
            console.warn(`Move property failed: ${uuid} does not exist`);
            return false;
        }
        if (!Array.isArray(data)) {
            console.warn(`Move property failed: ${uuid} - ${path}.${key} isn't an array`);
            return false;
        }
        // 发送节点修改消息
        this.emit('node:before-change', node);
        // 删除components中的元素要通过调用removeComponent方法
        if (path === '_components') {
            const comp = data[index];
            // https://github.com/cocos-creator/3d-tasks/issues/1116
            index_1.default.removeComponent(comp);
        }
        else {
            // 删除某个 item
            data.splice(index, 1);
            (0, set_1.default)(node, path, data); // 自身 = 自身（副本），为了兼顾材质需要整体赋值副本的情况
        }
        // 发送节点修改消息
        this.emit('node:change', node, { type: event_enum_1.NodeOperationType.REMOVE_ARRAY_ELEMENT, propPath: path, index });
        return true;
    }
    /**
     * 复制节点的动作，给下一步粘贴（创建）节点准备数据
     * @param {*} uuids 单个 string 或 array
     */
    copy(uuids) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        uuids = this.canRemoveOrCopy(uuids);
        stashInstants = {};
        function changeFileId(node) {
            const prefabInfo = node['_prefab'];
            if (prefabInfo) {
                if (prefabInfo.instance) {
                    return;
                }
                else {
                    // 非prefabInstance节点，就变为普通节点来复制
                    node['_prefab'] = null;
                    for (let i = 0; i < node.components.length; i++) {
                        const comp = node.components[i];
                        comp.__prefab = null;
                    }
                }
            }
            if (node.children.length > 0) {
                let index = node.children.length;
                // .children 是只读属性，需要用 splice
                while (index--) {
                    const child = node.children[index];
                    // 需要剔除不需要保存的私有节点
                    const isPrivateNode = child.objFlags & cc.Object.Flags.HideInHierarchy;
                    const canDelete = child.objFlags & cc.Object.Flags.DontSave;
                    if (isPrivateNode && canDelete) {
                        node.removeChild(child);
                        // node.children.splice(index, 1);
                    }
                    else {
                        changeFileId(child);
                    }
                }
            }
        }
        for (const uuid of uuids) {
            const node = this.query(uuid);
            if (!node) {
                continue;
            }
            const instant = cc.instantiate(node);
            // Hack 目前 cc.instantiate 没有变动 fileId，这里变动一下，使它不重复
            changeFileId(instant);
            stashInstants[uuid] = {
                instant,
            };
        }
        return uuids;
    }
    getCopiedUuids() {
        return stashInstants ? Object.keys(stashInstants) : [];
    }
    duplicate(uuids) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        const newUuids = [];
        const oldStashInstants = stashInstants;
        uuids = this.copy(uuids);
        for (const uuid of uuids) {
            const node = this.query(uuid);
            if (!node) {
                continue;
            }
            const newUuid = this.createNodeFromStash(node.parent?.uuid, null, uuid, false, true);
            if (newUuid) {
                newUuids.push(newUuid);
            }
        }
        stashInstants = oldStashInstants;
        return newUuids.filter(Boolean);
    }
    paste(target, uuids, keepWorldTransform = false) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        const newUuids = [];
        for (const uuid of uuids) {
            const newUuid = this.createNodeFromStash(target, null, uuid, keepWorldTransform, true);
            if (newUuid) {
                newUuids.push(newUuid);
                if (!target) {
                    const node = this.query(newUuid);
                    if (node) {
                        target = node.parent?.uuid;
                    }
                }
            }
        }
        return newUuids.filter(Boolean);
    }
    /**
     * 挂载节点，如拖入和剪切
     * @param parent
     * @param uuids
     * @param keepWorldTransform
     */
    setParent(parent, uuids, keepWorldTransform = false) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        let parentNode;
        if (parent) {
            parentNode = this.query(parent);
        }
        parentNode ||= cc_1.director.getScene();
        if (!parentNode) {
            return [];
        }
        const movedUuids = [];
        for (const uuid of uuids) {
            const node = this.query(uuid);
            if (!node || !node.parent) {
                continue;
            }
            const oldParent = node.parent;
            const parentChanged = oldParent !== parentNode;
            if (parentNode === node || parentNode.isChildOf(node)) {
                throw new Error('Cannot set parent: target parent is the node itself or its descendant.');
            }
            if (oldParent) {
                this.emit('node:before-change', oldParent);
            }
            if (parentChanged) {
                this.emit('node:before-change', parentNode);
            }
            this.emit('node:before-change', node);
            node.setParent(parentNode, keepWorldTransform);
            movedUuids.push(uuid);
        }
        return movedUuids;
    }
    /**
     * 实时获取新节点在一个父节点下的有效名称
     * 规则是 Node 同名时为 Node-001
     * @param name 名称
     * @param parentUuid 父节点 uuid
     */
    generateAvailableName(name, parentUuid) {
        if (!name) {
            name = 'Node';
        }
        let parent = cc_1.director.getScene();
        if (parentUuid) {
            const node = this.query(parentUuid);
            parent = node ? node : parent;
        }
        return (0, node_utils_1.getNodeName)(name, parent);
    }
    createNodeFromStash(parentUuid, name, stashUuid, keepWorldTransform = false, keepLayer = false) {
        if (!cc.director.getScene()) {
            return;
        }
        if (keepWorldTransform === null) {
            keepWorldTransform = true;
        }
        let parent = null;
        if (parentUuid) {
            parent = this.query(parentUuid);
        }
        if (!parent) {
            parent = cc_1.director.getScene();
        }
        if (!parent) {
            return;
        }
        let node = null;
        if (stashUuid) {
            if (stashInstants?.[stashUuid]) {
                const { instant } = stashInstants[stashUuid];
                if (instant) {
                    node = cc.instantiate(instant);
                    if (node) {
                        const visitNode = (n, fn) => {
                            if (fn(n))
                                return;
                            for (const child of n.children) {
                                visitNode(child, fn);
                            }
                        };
                        visitNode(node, (target) => {
                            // @ts-ignore
                            const prefabInfo = target['_prefab'];
                            if (prefabInfo?.instance) {
                                prefabInfo.instance = utils_1.prefabUtils.cloneInstanceWithNewFileId(prefabInfo.instance);
                                return true;
                            }
                        });
                        name = (0, node_utils_1.getNodeName)(node.name, parent);
                    }
                }
            }
        }
        if (!node) {
            node = new cc.Node();
        }
        if (!node) {
            return;
        }
        if (name) {
            node.name = name;
        }
        if (parent.layer && parent !== cc_1.director.getScene() && !keepLayer) {
            (0, node_utils_1.setLayer)(node, parent.layer, true);
        }
        this.emit('node:before-add', node);
        this.emit('node:before-change', parent);
        node.setParent(parent, keepWorldTransform);
        if (!stashUuid) {
            this.ensureUITransformComponent(node);
        }
        this.emit('node:add', node);
        return node.uuid;
    }
    /**
     * 确保节点有 UITransform 组件
     * 目前只需保障在创建空节点的时候检查任意上级是否为 canvas
     */
    ensureUITransformComponent(node) {
        if (node instanceof cc.Node && node.children.length === 0) {
            // 空节点
            let inside = false;
            let parent = node.parent;
            while (parent) {
                const components = parent.components.map((comp) => cc.js.getClassName(comp.constructor));
                if (components.includes('cc.Canvas')) {
                    inside = true;
                    break;
                }
                parent = parent.parent;
            }
            if (inside) {
                try {
                    node.addComponent('cc.UITransform');
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    }
    async restorePrefab(uuid, assetUuid) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;
        if (!cc_1.director.getScene()) {
            return false;
        }
        // 先取消选中，暂存选中的节点 uuid
        // const selectedUuids = cce.Selection.query();
        // cce.Selection.clear();
        const query = this.query;
        const prefabRoot = query(uuid);
        // 根据 fileId 缓存旧节点，以用于一些引用节点的还原
        const oldNodes = {};
        /**
         * 缓存 fileId 对应的旧节点
         * @param node 节点
         */
        function collectOldNodes(node) {
            if (!node || !node['_prefab']) {
                return;
            }
            oldNodes[node['_prefab'].fileId] = node;
            if (Array.isArray(node.children)) {
                node.children.forEach((child) => {
                    collectOldNodes(child);
                });
            }
        }
        // 根据 fileId 缓存子集列表 uuids
        const childrenUuid = {};
        function collectChildrenUuid(node) {
            const rt = {};
            if (node) {
                if (childrenUuid[node.uuid]) {
                    return childrenUuid[node.uuid];
                }
                if (Array.isArray(node.children)) {
                    node.children.forEach((child) => {
                        // @ts-ignore
                        if (child && child['_prefab']) {
                            // @ts-ignore
                            rt[child['_prefab'].fileId] = child.uuid;
                        }
                    });
                    childrenUuid[node.uuid] = rt;
                }
            }
            return rt;
        }
        // 根据 fileId 缓存子集列表的正确索引
        const childrenIndex = {};
        function collectChildrenIndex(node) {
            const rt = {};
            if (node) {
                if (childrenIndex[node.uuid]) {
                    return childrenIndex[node.uuid];
                }
                if (Array.isArray(node.children)) {
                    node.children.forEach((child, i) => {
                        // @ts-ignore
                        if (child && child['_prefab']) {
                            // @ts-ignore
                            rt[child['_prefab'].fileId] = i;
                        }
                    });
                    childrenIndex[node.uuid] = rt;
                }
            }
            return rt;
        }
        /**
         * 检查 dump 中的引用节点是否可用
         * 旧节点还存在的时候，新数据是不可用的，新数据里需要替换为旧节点的 uuid
         * 旧节点不存在的时候，新数据便是可用的，因为新节点一定会替换上去。
         * @param dumpComps 组件
         */
        function redirectSceneRefs(dumpComps) {
            dumpComps.forEach((comps) => {
                if (!comps.value || typeof comps.value !== 'object') {
                    return;
                }
                const keys = Object.keys(comps.value);
                for (const key of keys) {
                    if (['node'].includes(key)) {
                        continue;
                    }
                    const comp = comps.value[key];
                    // 递归到里层
                    if (comp.isArray && Array.isArray(comp.value)) {
                        redirectSceneRefs(comp.value);
                        continue;
                    }
                    if (comp.type === 'cc.Node') {
                        const newNode = query(comp.value.uuid);
                        // 数据错误
                        if (!newNode || !newNode?.['_prefab']?.fileId) {
                            continue;
                        }
                        const oldNode = oldNodes[newNode['_prefab'].fileId];
                        if (oldNode) {
                            comp.value.uuid = oldNode.uuid; // 换为旧节点的 uuid
                        }
                    }
                }
            });
        }
        /**
         * 还原现有节点的 dump ，删除多余节点，添加新节点
         * @param newNode 新节点
         * @param parentNode 新节点的父节点
         * @param prefabParent 新节点通过 fileId 指向现有节点的父节点
         */
        async function restore(newNode, parentNode, prefabParent) {
            // 私有节点不还原
            if (newNode.objFlags & cc.Object.Flags.HideInHierarchy) {
                return false;
            }
            const fileId2Index = collectChildrenIndex(parentNode); // 对应新数据上的子集排列
            const fileId2Uuid = collectChildrenUuid(prefabParent); // 对应新数据上的 uuid
            const dump = dump_1.default.dumpNode(newNode);
            const fileId = dump.__prefab__.fileId;
            // 现有 prefab 节点
            const prefab = prefabParent ? query(fileId2Uuid[fileId]) : prefabRoot;
            if (prefab) {
                // 如果现有的节点存在，只需还原 dump data
                that.emit('node:before-change', prefab);
                // 删除掉不在新数据上的子节点
                if (Array.isArray(prefab.children)) {
                    const childrenFileId2Index = collectChildrenIndex(newNode);
                    let index = 0;
                    let child = prefab.children[index];
                    while (child && index < prefab.children.length) {
                        // @ts-ignore
                        if (child['_prefab'] && childrenFileId2Index[child['_prefab'].fileId] === undefined) {
                            that.removeNode(child.uuid);
                        }
                        else {
                            index++;
                        }
                        child = prefab.children[index];
                    }
                }
                const prefabDump = dump_1.default.dumpNode(prefab);
                // 删除不必要的字段
                // Prefab 里的 dump 为什么需要删除 uuid
                // @ts-ignore
                delete dump.uuid;
                // @ts-ignore
                delete dump.children;
                // 不是根节点
                if (prefabParent) {
                    dump.parent.value.uuid = prefabParent.uuid;
                }
                else {
                    // 如果是 prefab 根节点，有些属性不能还原
                    dump.active.value = prefabDump.active.value;
                    dump.name.value = prefabDump.name.value;
                    dump.position.value = prefabDump.position.value;
                    dump.rotation.value = prefabDump.rotation.value;
                }
                // 使用原来的数据
                dump.__prefab__ = JSON.parse(JSON.stringify(prefabDump.__prefab__));
                // 检查一些属性上的值，其节点引用是否正确
                if (Array.isArray(dump.__comps__)) {
                    redirectSceneRefs(dump.__comps__);
                }
                // prefab 为现有的 prefab 节点，用新数据 dump 还原内部属性和组件的值
                await dump_1.default.restoreNode(prefab, dump);
                // 确保位置准确
                if (fileId2Index[fileId] !== undefined) {
                    prefab.setSiblingIndex(fileId2Index[fileId]);
                }
                // 逐层移动到目标节点上
                let index = 0;
                let childNode = newNode.children[index];
                while (childNode && index < newNode.children.length) {
                    const isMoved = await restore(childNode, newNode, prefab);
                    if (!isMoved) {
                        index++;
                    }
                    childNode = newNode.children[index];
                }
                that.emit('node:change', prefab);
                // 没有移动
                return false;
            }
            // 现有节点不存在，则将临时的 prefab 中 fileId 一致的节点移动过来替换
            const newPrefab = newNode['_prefab'];
            if (newPrefab && prefabParent) {
                that.emit('node:before-add', newNode);
                that.emit('node:before-change', prefabParent);
                const fileID = newPrefab.fileId;
                const index = fileId2Index[fileID];
                prefabParent.insertChild(newNode, index);
                newPrefab.root = prefabParent['_prefab']?.root;
                that.emit('node:add', newNode);
                that.emit('node:change', prefabParent);
            }
            // 有移动
            return true;
        }
        try {
            collectOldNodes(prefabRoot);
            const asset = await (0, node_create_1.loadAny)(assetUuid);
            const newNode = cc.instantiate(asset);
            prefabRoot.parent?.addChild(newNode);
            await restore(newNode); // 逐层还原 prefab
            newNode.parent = null; // 删除临时节点
            this.emit('node:change', prefabRoot);
        }
        catch (error) {
            console.warn('The prefab asset no longer exist.');
            console.error(error);
            return false;
        }
        // 重新选中，恢复 gizmos 状态
        // setTimeout(() => {
        //     selectedUuids.forEach((selectedUuid: string) => {
        //         cce.Selection.select(selectedUuid);
        //     });
        // });
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    _walkNode(node, func) {
        if (node && node.children) {
            node.children.forEach((child) => {
                func(child);
                this._walkNode(child, func);
            });
        }
    }
    baseRemoveNode(node, keepWorldTransform) {
        // 增加容错
        if (!node) {
            return;
        }
        const parent = node.parent;
        // 发送节点修改消息
        this.emit('node:before-remove', node);
        if (parent) {
            this.emit('node:before-change', parent);
        }
        //console.time('NodeMgr::removeNode');
        node.setParent(null, keepWorldTransform);
        node._objFlags |= cc_1.CCObject.Flags.Destroyed;
        // 3.6.1 特殊 hack，请在后续版本移除
        // 相关修复 pr: https://github.com/cocos/cocos-editor/pull/890
        try {
            this._walkNode(node, (child) => {
                child._objFlags |= cc_1.CCObject.Flags.Destroyed;
            });
        }
        catch (error) {
            console.warn(error);
        }
        //console.timeEnd('NodeMgr::removeNode');
        // 被删除节点里的根节点
        this.emit('node:remove', node, { source: event_enum_1.EventSourceType.EDITOR });
    }
    /**
     * 删除节点
     * @param {*} uuids
     * @param {*} keepWorldTransform
     */
    removeNode(uuids, keepWorldTransform) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        uuids = this.canRemoveOrCopy(uuids);
        for (const uuid of uuids) {
            const node = this.query(uuid);
            if (!node) {
                continue;
            }
            this.baseRemoveNode(node, keepWorldTransform);
        }
    }
    /**
     * 锁定一个节点不让其在场景中被选中
     * @param uuids 节点uuid
     * @param locked true | false
     * @param loop true | false 是否循环子孙级节点设置
     */
    changeNodeLock(uuids, locked, loop) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        for (const uuid of uuids) {
            const node = this.query(uuid);
            // 增加容错
            if (!node) {
                continue;
            }
            this.emit('node:before-change', node);
            try {
                if (locked) {
                    node.objFlags |= cc.Object.Flags.LockedInEditor;
                }
                else {
                    node.objFlags &= ~cc.Object.Flags.LockedInEditor;
                }
            }
            catch (error) {
                console.error(error);
            }
            this.emit('node:change', node, { type: event_enum_1.NodeOperationType.SET_PROPERTY, propPath: 'locked' });
            // 处理内循环的情况
            if (loop === true && node.children && node.children.length > 0) {
                node.children.forEach((child) => {
                    this.changeNodeLock(child.uuid, locked, loop);
                });
            }
        }
    }
    /**
     * 过滤根节点
     * 过滤子父包含的关系，只留下彼此独立的父节点 uuid
     * @param uuids
     */
    canRemoveOrCopy(uuids) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const t = this;
        const rt = [];
        // 剔除根节点或其他不可删除的节点
        const nodeUuids = [];
        for (const uuid of uuids) {
            const node = t.query(uuid);
            if (!node || !node.parent || node.objFlags & cc.Object.Flags.DontDestroy) {
                continue;
            }
            nodeUuids.push(uuid);
        }
        // 剔除已在列表中其他节点的子节点
        for (const uuid of nodeUuids) {
            const node = t.query(uuid);
            if (!isChild(node)) {
                rt.push(uuid);
            }
        }
        /**
         * 是否是已在的列表中其他节点的子节点
         * @param node
         */
        function isChild(node) {
            if (!node.parent) {
                return false;
            }
            if (nodeUuids.includes(node.parent.uuid)) {
                return true;
            }
            else {
                return isChild(node.parent);
            }
        }
        return rt;
    }
    // /**
    //  * 获取创建节点时所在的父节点
    //  * @param uuid 父节点
    //  */
    // getNewNodeParent(uuid: string | null | undefined): Node {
    //     let parent;
    //     if (uuid) {
    //         parent = this.query(uuid);
    //     } else {
    //         /**
    //          * 如果有选中的节点，默认挂在第一个选中节点里
    //          * 如果没有，挂在场景根节点里
    //          */
    //         const selects = cce.Selection.query();
    //         if (Array.isArray(selects) && selects[0]) {
    //             parent = this.query(selects[0]);
    //         } else {
    //             parent = director.getScene();
    //         }
    //     }
    //     if (!parent) {
    //         parent = director.getScene();
    //     }
    //     // 不应该是Node里的逻辑
    //     const mode = cce.SceneFacadeManager.queryMode();
    //     if (mode === 'prefab') {
    //         const prefabProxy = cce.SceneFacadeManager['_facadeFSM'].prefabSceneFacade['_sceneProxy'];
    //         const prefabRoot = prefabProxy.getRootNode();
    //         // prefab 的场景节点是临时的根节点，需转为 prefab root node
    //         if (parent === cc.director.getScene()) {
    //             parent = prefabRoot;
    //         }
    //     }
    //     return parent as Node;
    // }
    // changeNodeUUID(oldUUID: string | undefined, newUUID: string | undefined) {
    //     if (!oldUUID || !newUUID) {
    //         return;
    //     }
    //     NodeMgr.changeNodeUUID(oldUUID, newUUID);
    // }
    addComponentAt(node, comp, index) {
        if (!node || !comp || index < 0) {
            return false;
        }
        if (comp instanceof cc_1.MissingScript && !comp._$erialized) {
            return false;
        }
        // @ts-ignore
        node._addComponentAt(comp, index);
        index_1.default.emit('component:add', comp);
        return true;
    }
}
exports.NodeManager = NodeManager;
const nodeManager = new NodeManager();
(0, service_access_1.registerDumpNodeAccess)({
    query: nodeManager.query.bind(nodeManager),
    addComponentAt: nodeManager.addComponentAt.bind(nodeManager),
});
exports.default = nodeManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2Uvbm9kZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUliOzs7R0FHRztBQUVILE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7QUFFbkMscURBQTZCO0FBQzdCLHFEQUE2QjtBQUM3QiwrREFBdUM7QUFDdkMsNkNBQW1FO0FBQ25FLDJDQUE4QztBQUM5Qyx5REFBc0Q7QUFFdEQseUNBQXlDO0FBQ3pDLGlEQUFpRDtBQUNqRCw4Q0FBOEM7QUFDOUMsbURBQStCO0FBQy9CLDJEQUFnRTtBQUNoRSxpREFBNEM7QUFFNUMsd0ZBQXdGO0FBQ3hGLDJCQVNZO0FBRVoscURBQXlGO0FBU3pGLCtDQUF3QztBQUN4QywrREFBeUM7QUFDekMsbUNBQWdDO0FBRWhDLE1BQU0sbUJBQW1CLEdBQUc7SUFDeEIsa0JBQWtCO0lBQ2xCLGNBQWM7SUFDZCxlQUFlO0lBQ2YsZUFBZTtJQUNmLFNBQVM7SUFDVCxrQkFBa0I7SUFDbEIsV0FBVztJQUNYLFdBQVc7SUFDWCxnQkFBZ0I7SUFDaEIsWUFBWTtJQUNaLGlCQUFpQjtJQUNqQixrQkFBa0I7SUFDbEIsY0FBYztJQUNkLDhCQUE4QjtJQUM5QixtQ0FBbUM7SUFDbkMsaUJBQWlCO0NBQ3BCLENBQUM7QUFFRiw2QkFBNkI7QUFDN0IsSUFBSSxhQUFhLEdBQVEsSUFBSSxDQUFDO0FBRTlCOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFhLFdBQVc7SUFHcEIsSUFBSSxDQUFDLEtBQWEsRUFBRSxHQUFHLElBQVc7UUFDOUIsNkJBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVPLHNCQUFzQixHQUFrQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQzFF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LGtDQUFrQztJQUNsQyxrQkFBa0I7SUFDbEIsUUFBUTtJQUVSLGdEQUFnRDtJQUNoRCxJQUFJO0lBRUosY0FBYyxDQUFDLElBQVUsRUFBRSxJQUFlLEVBQUUsS0FBYTtRQUNyRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM5QixPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsSUFBSSxJQUFJLFlBQVksa0JBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyRCxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsYUFBYTtRQUNiLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLGVBQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXBDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Q0FDSjtBQTEvQ0Qsa0NBMC9DQztBQUVELE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFFdEMsSUFBQSx1Q0FBc0IsRUFBQztJQUNuQixLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFDLGNBQWMsRUFBRSxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7Q0FDL0QsQ0FBQyxDQUFDO0FBRUgsa0JBQWUsV0FBVyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBJUHJvcGVydHkgfSBmcm9tICcuLi8uLi8uLi9AdHlwZXMvcHVibGljJztcblxuLyoqXG4gKiDoioLngrnnrqHnkIblmahcbiAqIOi0n+i0o+euoeeQhuW9k+WJjeaJk+W8gOWcuuaZr+eahCB1dWlkIOS4juiKgueCueWvueW6lOWFs+ezu1xuICovXG5cbmNvbnN0IE5vZGVNZ3IgPSBFZGl0b3JFeHRlbmRzLk5vZGU7XG5cbmltcG9ydCBnZXQgZnJvbSAnbG9kYXNoL2dldCc7XG5pbXBvcnQgc2V0IGZyb20gJ2xvZGFzaC9zZXQnO1xuaW1wb3J0IGZpbmRMYXN0IGZyb20gJ2xvZGFzaC9maW5kTGFzdCc7XG5pbXBvcnQgeyBpc0VkaXRvck5vZGUsIGdldE5vZGVOYW1lLCBzZXRMYXllciB9IGZyb20gJy4vbm9kZS11dGlscyc7XG5pbXBvcnQgeyBwcmVmYWJVdGlscyB9IGZyb20gJy4uL3ByZWZhYi91dGlscyc7XG5pbXBvcnQgeyBTZXJ2aWNlRXZlbnRzIH0gZnJvbSAnLi4vY29yZS9nbG9iYWwtZXZlbnRzJztcblxuLy8gY29uc3QgeyBwcm9taXNpZnkgfSA9IHJlcXVpcmUoJ3V0aWwnKTtcbi8vIGNvbnN0IHsgYmFzZW5hbWUsIGV4dG5hbWUgfSA9IHJlcXVpcmUoJ3BhdGgnKTtcbi8vIGltcG9ydCBub2RlVXRpbCBmcm9tICcuLi8uLi8uLi91dGlscy9ub2RlJztcbmltcG9ydCBkdW1wVXRpbCBmcm9tICcuLi9kdW1wJztcbmltcG9ydCB7IHJlZ2lzdGVyRHVtcE5vZGVBY2Nlc3MgfSBmcm9tICcuLi9kdW1wL3NlcnZpY2UtYWNjZXNzJztcbmltcG9ydCB7IFNlcnZpY2UgfSBmcm9tICcuLi9jb3JlL2RlY29yYXRvcic7XG5cbi8vIGltcG9ydCBnZXRDb21wb25lbnRGdW5jdGlvbk9mTm9kZSBmcm9tICcuLi9jb21wb25lbnQvZ2V0LWNvbXBvbmVudC1mdW5jdGlvbi1vZi1ub2RlJztcbmltcG9ydCB7XG4gICAgTm9kZSxcbiAgICBkaXJlY3RvcixcbiAgICBDb21wb25lbnQsXG4gICAgVUlUcmFuc2Zvcm0sXG4gICAgQ0NPYmplY3QsXG4gICAgTWlzc2luZ1NjcmlwdCxcbiAgICBMT0RHcm91cCxcbiAgICBQcmVmYWIsXG59IGZyb20gJ2NjJztcblxuaW1wb3J0IHsgRXZlbnRTb3VyY2VUeXBlLCBOb2RlRXZlbnRUeXBlLCBOb2RlT3BlcmF0aW9uVHlwZSB9IGZyb20gJy4uL3B1YmxpYy9ldmVudC1lbnVtJztcbmltcG9ydCB7XG4gICAgdHlwZSBJTm9kZUV2ZW50cyxcbiAgICB0eXBlIElOb2RlLFxuICAgIElDaGFuZ2VOb2RlT3B0aW9ucyxcbn0gZnJvbSAnLi4vLi4vLi4vY29tbW9uJztcbmltcG9ydCB7IHR5cGUgSVNjZW5lIH0gZnJvbSAnLi4vLi4vLi4vY29tbW9uL2VkaXRvci9zY2VuZSc7XG5cblxuaW1wb3J0IHsgbG9hZEFueSB9IGZyb20gJy4vbm9kZS1jcmVhdGUnO1xuaW1wb3J0IGNvbXBNZ3IgZnJvbSAnLi4vY29tcG9uZW50L2luZGV4JztcbmltcG9ydCB7IFJwYyB9IGZyb20gJy4uLy4uL3JwYyc7XG5cbmNvbnN0IGNyZWF0YWJsZUFzc2V0VHlwZXMgPSBbXG4gICAgJ2NjLkFuaW1hdGlvbkNsaXAnLFxuICAgICdjYy5BdWRpb0NsaXAnLFxuICAgICdjYy5CaXRtYXBGb250JyxcbiAgICAnY2MuTGFiZWxBdGxhcycsXG4gICAgJ2NjLk1lc2gnLFxuICAgICdjYy5QYXJ0aWNsZUFzc2V0JyxcbiAgICAnY2MuUHJlZmFiJyxcbiAgICAnY2MuU2NyaXB0JyxcbiAgICAnY2MuU3ByaXRlRnJhbWUnLFxuICAgICdjYy5UVEZGb250JyxcbiAgICAnY2MuVGVycmFpbkFzc2V0JyxcbiAgICAnY2MuVGlsZWRNYXBBc3NldCcsXG4gICAgJ2NjLlZpZGVvQ2xpcCcsXG4gICAgJ2RyYWdvbkJvbmVzLkRyYWdvbkJvbmVzQXNzZXQnLFxuICAgICdkcmFnb25Cb25lcy5EcmFnb25Cb25lc0F0bGFzQXNzZXQnLFxuICAgICdzcC5Ta2VsZXRvbkRhdGEnLFxuXTtcblxuLy8g55So5LqO5aSN5Yi257KY6LS05pON5L2c77yM5pqC5a2Y6KKr5aSN5Yi26IqC54K555qEIGNsb25lIOWvueixoVxubGV0IHN0YXNoSW5zdGFudHM6IGFueSA9IG51bGw7XG5cbi8qKlxuICog6IqC54K5566h55CG5ZmoXG4gKlxuICogRXZlbnRzOlxuICogICBub2RlLm9uKCdiZWZvcmUtY2hhbmdlJywgKG5vZGUpID0+IHt9KTtcbiAqICAgbm9kZS5vbignYmVmb3JlLWFkZCcsIChub2RlKSA9PiB7fSk7XG4gKiAgIG5vZGUub24oJ2JlZm9yZS1yZW1vdmUnLCAobm9kZSkgPT4ge30pO1xuICogICBub2RlLm9uKCdjaGFuZ2UnLCAobm9kZSkgPT4ge30pO1xuICogICBub2RlLm9uKCdhZGQnLCAobm9kZSkgPT4ge30pO1xuICogICBub2RlLm9uKCdyZW1vdmUnLCAobm9kZSkgPT4ge30pO1xuICovXG5leHBvcnQgY2xhc3MgTm9kZU1hbmFnZXIge1xuICAgIGVtaXQ8SyBleHRlbmRzIGtleW9mIElOb2RlRXZlbnRzPihldmVudDogSywgLi4uYXJnczogSU5vZGVFdmVudHNbS10pOiB2b2lkO1xuICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgLi4uYXJnczogYW55W10pOiB2b2lkO1xuICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgU2VydmljZUV2ZW50cy5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9wcmV2aWV3UHJvcGVydHlzQ2FjaGU6IE1hcDxzdHJpbmcsIE1hcDxzdHJpbmcsIGFueT4+ID0gbmV3IE1hcCgpO1xuICAgIGdldCBjcmVhdGFibGVBc3NldFR5cGVzKCkge1xuICAgICAgICByZXR1cm4gY3JlYXRhYmxlQXNzZXRUeXBlcztcbiAgICB9XG5cbiAgICBpbml0KCkgeyB9XG5cbiAgICAvKipcbiAgICAgKiDkvKDlhaXkuIDkuKrlnLrmma/vvIzlsIblhoXpg6jnmoToioLngrnlhajpg6jnvJPlrZhcbiAgICAgKiBAcGFyYW0geyp9IHNjZW5lXG4gICAgICovXG4gICAgaW5pdFdpdGhTY2VuZShzY2VuZTogYW55KSB7XG4gICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWcuuaZr+i9veWFpeWQjuimgeWwhueOsOacieiKgueCueebkeWQrOaJgOmcgOS6i+S7tlxuICAgICAgICB0aGlzLnJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnNGb3JDdXJyZW50U2NlbmVOb2RlcygpO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJOb2RlTWdyRXZlbnRzKCk7XG4gICAgICAgIC8vIOe7hOS7tuS6i+S7tui9rOWPkeeUsSBDb21wb25lbnRTZXJ2aWNlIOe7n+S4gOi0n+i0o+OAgk5vZGVNYW5hZ2VyIOWPquS9v+eUqCBjb21wTWdyXG4gICAgICAgIC8vIOWBmue7hOS7tuafpeivouWSjOe8k+WtmOa4heeQhu+8m+i/memHjOazqOWGjOS8muWvvOiHtOe8lui+keWZqOaJk+W8gC/ph43ovb3lkI7ph43lpI3op6blj5FcbiAgICAgICAgLy8gY29tcG9uZW50OmFkZGVkL2NvbXBvbmVudDpyZW1vdmVk44CCXG5cbiAgICAgICAgLy8g57yT5a2Y6aKE6KeI6K6+572u55qE5bGe5oCn77yM55So5LqO6L+Y5Y6f6aKE6KeI5YmN55qE6K6+572uXG4gICAgICAgIHRoaXMuX3ByZXZpZXdQcm9wZXJ0eXNDYWNoZSA9IG5ldyBNYXAoKTtcblxuICAgICAgICB0aGlzLmVtaXQoJ25vZGU6aW5pdGVkJywgdGhpcy5xdWVyeVV1aWRzKCksIHNjZW5lKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnNGb3JDdXJyZW50U2NlbmVOb2RlcygpIHtcbiAgICAgICAgY29uc3Qgbm9kZU1hcCA9IE5vZGVNZ3IuZ2V0Tm9kZXNJblNjZW5lKCk7XG4gICAgICAgIE9iamVjdC5rZXlzKG5vZGVNYXApLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZWdpc3RlckV2ZW50TGlzdGVuZXJzKG5vZGVNYXBba2V5XSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkVkaXRvck9wZW5lZCgpIHtcbiAgICAgICAgdGhpcy5pbml0V2l0aFNjZW5lKFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCkgPz8gZGlyZWN0b3IuZ2V0U2NlbmUoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRWRpdG9yQ2xvc2VkKCkge1xuICAgICAgICB0aGlzLnVucmVnaXN0ZXJOb2RlTWdyRXZlbnRzKCk7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgc3Rhc2hJbnN0YW50cyA9IG51bGw7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IE5vZGVNZ3JFdmVudEhhbmRsZXJzID0ge1xuICAgICAgICBbJ2FkZCddOiAnYWRkJyxcbiAgICAgICAgWydjaGFuZ2UnXTogJ2NoYW5nZScsXG4gICAgICAgIFsncmVtb3ZlJ106ICdyZW1vdmUnLFxuICAgIH0gYXMgY29uc3Q7XG4gICAgcHJpdmF0ZSBub2RlTWdyRXZlbnRIYW5kbGVycyA9IG5ldyBNYXA8c3RyaW5nLCAoLi4uYXJnczogW10pID0+IHZvaWQ+KCk7XG4gICAgLyoqXG4gICAgICog5rOo5YaM5byV5pOOIE5vZGUg566h55CG55u45YWz5LqL5Lu255qE55uR5ZCsXG4gICAgICovXG4gICAgcmVnaXN0ZXJOb2RlTWdyRXZlbnRzKCkge1xuICAgICAgICB0aGlzLnVucmVnaXN0ZXJOb2RlTWdyRXZlbnRzKCk7XG4gICAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuTm9kZU1nckV2ZW50SGFuZGxlcnMpLmZvckVhY2goKFtldmVudFR5cGUsIGhhbmRsZXJOYW1lXSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9ICh0aGlzIGFzIGFueSlbaGFuZGxlck5hbWVdLmJpbmQodGhpcyk7XG4gICAgICAgICAgICBOb2RlTWdyLm9uKGV2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICAgICAgICB0aGlzLm5vZGVNZ3JFdmVudEhhbmRsZXJzLnNldChldmVudFR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE5vZGVNZ3Igb24gJHtldmVudFR5cGV9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVucmVnaXN0ZXJOb2RlTWdyRXZlbnRzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGV2ZW50VHlwZSBvZiB0aGlzLm5vZGVNZ3JFdmVudEhhbmRsZXJzLmtleXMoKSkge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IHRoaXMubm9kZU1nckV2ZW50SGFuZGxlcnMuZ2V0KGV2ZW50VHlwZSk7XG4gICAgICAgICAgICBpZiAoaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIE5vZGVNZ3Iub2ZmKGV2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlTWdyRXZlbnRIYW5kbGVycy5kZWxldGUoZXZlbnRUeXBlKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgTm9kZU1nciBvZmYgJHtldmVudFR5cGV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IE5vZGVIYW5kbGVycyA9IHtcbiAgICAgICAgW05vZGUuRXZlbnRUeXBlLlRSQU5TRk9STV9DSEFOR0VEXTogJ29uTm9kZVRyYW5zZm9ybUNoYW5nZWQnLFxuICAgICAgICBbTm9kZS5FdmVudFR5cGUuU0laRV9DSEFOR0VEXTogJ29uTm9kZVNpemVDaGFuZ2VkJyxcbiAgICAgICAgW05vZGUuRXZlbnRUeXBlLkFOQ0hPUl9DSEFOR0VEXTogJ29uTm9kZUFuY2hvckNoYW5nZWQnLFxuICAgICAgICBbTm9kZS5FdmVudFR5cGUuQ0hJTERfQURERURdOiAnb25Ob2RlUGFyZW50Q2hhbmdlZCcsXG4gICAgICAgIFtOb2RlLkV2ZW50VHlwZS5DSElMRF9SRU1PVkVEXTogJ29uTm9kZVBhcmVudENoYW5nZWQnLFxuICAgICAgICBbTm9kZS5FdmVudFR5cGUuTElHSFRfUFJPQkVfQ0hBTkdFRF06ICdvbkxpZ2h0UHJvYmVDaGFuZ2VkJyxcbiAgICAgICAgW05vZGUuRXZlbnRUeXBlLkxJR0hUX1BST0JFX0JBS0lOR19DSEFOR0VEXTogJ29uTGlnaHRQcm9iZUJha2luZ0NoYW5nZWQnLFxuICAgIH0gYXMgY29uc3Q7XG4gICAgcHJpdmF0ZSBub2RlSGFuZGxlcnMgPSBuZXcgTWFwPHN0cmluZywgRnVuY3Rpb24+KCk7XG5cbiAgICAvKipcbiAgICAgKiDnm5HlkKzlvJXmk47lj5Hlh7rnmoQgbm9kZSDkuovku7ZcbiAgICAgKiBAcGFyYW0geyp9IG5vZGVcbiAgICAgKi9cbiAgICByZWdpc3RlckV2ZW50TGlzdGVuZXJzKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlIHx8ICFub2RlLmlzVmFsaWQgfHwgaXNFZGl0b3JOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDpgY3ljobkuovku7bmmKDlsITooajvvIznu5/kuIDms6jlhozkuovku7ZcbiAgICAgICAgT2JqZWN0LmVudHJpZXModGhpcy5Ob2RlSGFuZGxlcnMpLmZvckVhY2goKFtldmVudFR5cGUsIGhhbmRsZXJOYW1lXSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm91bmRIYW5kbGVyID0gKHRoaXMgYXMgYW55KVtoYW5kbGVyTmFtZV0uYmluZCh0aGlzLCBub2RlKTtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IGAke2V2ZW50VHlwZX1fJHtub2RlLnV1aWR9YDtcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGVIYW5kbGVycy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUub24oZXZlbnRUeXBlLCBib3VuZEhhbmRsZXIsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5ub2RlSGFuZGxlcnMuc2V0KGtleSwgYm91bmRIYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Y+W5raI55uR5ZCs5byV5pOO5Y+R5Ye655qEbm9kZeS6i+S7tlxuICAgICAqIEBwYXJhbSB7Kn0gbm9kZVxuICAgICAqL1xuICAgIHVucmVnaXN0ZXJFdmVudExpc3RlbmVycyhub2RlOiBOb2RlKSB7XG4gICAgICAgIGlmICghbm9kZSB8fCAhbm9kZS5pc1ZhbGlkIHx8IGlzRWRpdG9yTm9kZShub2RlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YGN5Y6G5LqL5Lu25pig5bCE6KGo77yM57uf5LiA5Y+W5raI5LqL5Lu2XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuTm9kZUhhbmRsZXJzKS5mb3JFYWNoKGV2ZW50VHlwZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBgJHtldmVudFR5cGV9XyR7bm9kZS51dWlkfWA7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5ub2RlSGFuZGxlcnMuZ2V0KGtleSk7XG4gICAgICAgICAgICBpZiAoaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIG5vZGUub2ZmKGV2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlSGFuZGxlcnMuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uTm9kZVRyYW5zZm9ybUNoYW5nZWQobm9kZTogTm9kZSwgdHJhbnNmb3JtQml0OiBhbnkpIHtcbiAgICAgICAgY29uc3QgY2hhbmdlT3B0czogSUNoYW5nZU5vZGVPcHRpb25zID0geyB0eXBlOiBOb2RlRXZlbnRUeXBlLlRSQU5TRk9STV9DSEFOR0VELCBzb3VyY2U6IEV2ZW50U291cmNlVHlwZS5FTkdJTkUgfTtcblxuICAgICAgICBzd2l0Y2ggKHRyYW5zZm9ybUJpdCkge1xuICAgICAgICAgICAgY2FzZSBOb2RlLlRyYW5zZm9ybUJpdC5QT1NJVElPTjpcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcHRzLnByb3BQYXRoID0gJ3Bvc2l0aW9uJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTm9kZS5UcmFuc2Zvcm1CaXQuUk9UQVRJT046XG4gICAgICAgICAgICAgICAgY2hhbmdlT3B0cy5wcm9wUGF0aCA9ICdyb3RhdGlvbic7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE5vZGUuVHJhbnNmb3JtQml0LlNDQUxFOlxuICAgICAgICAgICAgICAgIGNoYW5nZU9wdHMucHJvcFBhdGggPSAnc2NhbGUnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIGNoYW5nZU9wdHMpO1xuICAgIH1cblxuICAgIG9uTm9kZVNpemVDaGFuZ2VkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgY2hhbmdlT3B0czogSUNoYW5nZU5vZGVPcHRpb25zID0geyB0eXBlOiBOb2RlRXZlbnRUeXBlLlNJWkVfQ0hBTkdFRCwgc291cmNlOiBFdmVudFNvdXJjZVR5cGUuRU5HSU5FIH07XG4gICAgICAgIGNvbnN0IHVpVHJhbnNmb3JtID0gbm9kZS5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pO1xuICAgICAgICBpZiAodWlUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gbm9kZS5jb21wb25lbnRzLmluZGV4T2YodWlUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgY2hhbmdlT3B0cy5wcm9wUGF0aCA9IGBfY29tcG9uZW50cy4ke2luZGV4fS5jb250ZW50U2l6ZWA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIGNoYW5nZU9wdHMpO1xuICAgIH1cblxuICAgIG9uTm9kZUFuY2hvckNoYW5nZWQobm9kZTogTm9kZSkge1xuICAgICAgICBjb25zdCBjaGFuZ2VPcHRzOiBJQ2hhbmdlTm9kZU9wdGlvbnMgPSB7IHR5cGU6IE5vZGVFdmVudFR5cGUuQU5DSE9SX0NIQU5HRUQsIHNvdXJjZTogRXZlbnRTb3VyY2VUeXBlLkVOR0lORSB9O1xuICAgICAgICBjb25zdCB1aVRyYW5zZm9ybSA9IG5vZGUuZ2V0Q29tcG9uZW50KFVJVHJhbnNmb3JtKTtcbiAgICAgICAgaWYgKHVpVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IG5vZGUuY29tcG9uZW50cy5pbmRleE9mKHVpVHJhbnNmb3JtKTtcbiAgICAgICAgICAgIGNoYW5nZU9wdHMucHJvcFBhdGggPSBgX2NvbXBvbmVudHMuJHtpbmRleH0uYW5jaG9yUG9pbnRgO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCBjaGFuZ2VPcHRzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnm5HlkKzlvJXmk47kuK3oioLngrkgbm9kZS5zZXRQYXJlbnQocGFyZW50KSDmiYDlj5Hlh7rmnaXnmoTkuovku7ZcbiAgICAgKiBAcGFyYW0geyp9IHBhcmVudFxuICAgICAqIEBwYXJhbSB7Kn0gY2hpbGRcbiAgICAgKi9cbiAgICBvbk5vZGVQYXJlbnRDaGFuZ2VkKHBhcmVudDogTm9kZSwgY2hpbGQ6IE5vZGUpIHtcbiAgICAgICAgaWYgKGlzRWRpdG9yTm9kZShjaGlsZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoaWxkQWRkZWQgPSBjaGlsZC5wYXJlbnQgPT09IHBhcmVudDtcbiAgICAgICAgaWYgKGNoaWxkQWRkZWQpIHtcbiAgICAgICAgICAgIE5vZGVNZ3IudXBkYXRlTm9kZVBhcmVudChjaGlsZC51dWlkLCBwYXJlbnQudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgcGFyZW50LCB7IHR5cGU6IE5vZGVFdmVudFR5cGUuQ0hJTERfQ0hBTkdFRCB9KTtcblxuICAgICAgICAvLyDlj6rmnInmjILlhaXmlrDniLboioLngrnlkI7vvIzlrZDoioLngrnot6/lvoTntKLlvJXmiY3nqLPlrprvvJvnp7vlh7rml6fniLboioLngrnml7blj6rpgJrnn6Xml6fniLboioLngrkgY2hpbGRyZW4g5Y+Y5YyW44CCXG4gICAgICAgIGlmIChjaGlsZEFkZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgY2hpbGQsIHsgdHlwZTogTm9kZUV2ZW50VHlwZS5QQVJFTlRfQ0hBTkdFRCB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOebkeWQrGxpZ2h0LXByb2JlIGNoYW5nZWTkuovku7ZcbiAgICAgKi9cbiAgICBvbkxpZ2h0UHJvYmVDaGFuZ2VkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgY29uc3QgY2hhbmdlT3B0czogSUNoYW5nZU5vZGVPcHRpb25zID0geyB0eXBlOiBOb2RlRXZlbnRUeXBlLkxJR0hUX1BST0JFX0NIQU5HRUQsIHNvdXJjZTogRXZlbnRTb3VyY2VUeXBlLkVOR0lORSB9O1xuICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgbm9kZSwgY2hhbmdlT3B0cyk7XG4gICAgfVxuXG4gICAgb25MaWdodFByb2JlQmFraW5nQ2hhbmdlZChub2RlOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IGNoYW5nZU9wdHM6IElDaGFuZ2VOb2RlT3B0aW9ucyA9IHsgdHlwZTogTm9kZUV2ZW50VHlwZS5MSUdIVF9QUk9CRV9CQUtJTkdfQ0hBTkdFRCwgc291cmNlOiBFdmVudFNvdXJjZVR5cGUuRU5HSU5FIH07XG4gICAgICAgIHRoaXMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCBjaGFuZ2VPcHRzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmuIXnqbrlvZPliY3nrqHnkIbnmoToioLngrlcbiAgICAgKi9cbiAgICBjbGVhcigpIHtcbiAgICAgICAgY29uc3Qgbm9kZU1hcCA9IE5vZGVNZ3IuZ2V0Tm9kZXMoKTtcbiAgICAgICAgT2JqZWN0LmtleXMobm9kZU1hcCkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVucmVnaXN0ZXJFdmVudExpc3RlbmVycyhub2RlTWFwW2tleV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBOb2RlTWdyLmNsZWFyKCk7XG4gICAgICAgIGNvbXBNZ3IuY2xlYXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmt7vliqDkuIDkuKroioLngrnliLDnrqHnkIblmajlhoVcbiAgICAgKiBAcGFyYW0geyp9IG5vZGVcbiAgICAgKi9cbiAgICBhZGQodXVpZDogc3RyaW5nLCBub2RlOiBOb2RlKSB7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJFdmVudExpc3RlbmVycyhub2RlKTtcblxuICAgICAgICBpZiAoIWlzRWRpdG9yTm9kZShub2RlKSkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmFkZGVkJywgbm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkuIDkuKroioLngrnooqvkv67mlLks55SxRWRpdG9yRXh0ZW5kcy5Ob2RlLmVtaXQoJ2NoYW5nZScp6Kem5Y+RXG4gICAgICogQHBhcmFtIHV1aWRcbiAgICAgKiBAcGFyYW0gbm9kZVxuICAgICAqL1xuICAgIGNoYW5nZSh1dWlkOiBzdHJpbmcsIG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKCFpc0VkaXRvck5vZGUobm9kZSkpIHtcbiAgICAgICAgICAgIC8vIOi/memHjOaYr+WboOS4uiBMT0Qg57uE5Lu25Zyo5oyC5Yiw5Zy65pmv55qE5pe25YCZ77yM5L+u5pS55LqG6Ieq5bex55qE5pWw5o2u77yM5L2G57yW6L6R5Zmo5pqC5pe25peg5rOV55+l6YGT5L+u5pS55LqG5ZOq5Lqb5pWw5o2uXG4gICAgICAgICAgICAvLyDmiYDku6Xpkojlr7kgTE9EIOmDqOWIhu+8jOWinuWKoOS6hiBwcm9wUGF0aCwgcHJlZmFiIOaJjeiDveato+W4uOS/ruaUuVxuICAgICAgICAgICAgbGV0IHBhdGggPSAnJztcbiAgICAgICAgICAgIGNvbnN0IGxvZEdyb3VwID0gbm9kZS5nZXRDb21wb25lbnQoTE9ER3JvdXApO1xuICAgICAgICAgICAgaWYgKGxvZEdyb3VwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBub2RlLmNvbXBvbmVudHMuaW5kZXhPZihsb2RHcm91cCk7XG4gICAgICAgICAgICAgICAgcGF0aCA9IGBfX2NvbXBzX18uJHtpbmRleH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIHsgdHlwZTogTm9kZU9wZXJhdGlvblR5cGUuU0VUX1BST1BFUlRZLCBwcm9wUGF0aDogcGF0aCB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS7jueuoeeQhuWZqOWGheenu+mZpOS4gOS4quaMh+WumueahOiKgueCuVxuICAgICAqIEBwYXJhbSB7Kn0gbm9kZVxuICAgICAqL1xuICAgIHJlbW92ZSh1dWlkOiBzdHJpbmcsIG5vZGU6IE5vZGUpIHtcbiAgICAgICAgdGhpcy51bnJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnMobm9kZSk7XG4gICAgICAgIGlmICghaXNFZGl0b3JOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6cmVtb3ZlZCcsIG5vZGUsIHsgc291cmNlOiBFdmVudFNvdXJjZVR5cGUuRU5HSU5FIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+i5LiA5Liq6IqC54K555qE5a6e5L6LXG4gICAgICogQHBhcmFtIHsqfSB1dWlkXG4gICAgICogQHJldHVybiB7Y2MuTm9kZX1cbiAgICAgKi9cbiAgICBxdWVyeSh1dWlkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBOb2RlIHwgbnVsbCB7XG4gICAgICAgIGlmICh0eXBlb2YgdXVpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBOb2RlTWdyLmdldE5vZGUodXVpZCk7XG4gICAgfVxuXG4gICAgZ2V0UGF0aEJ5VXVpZCh1dWlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlKHV1aWQpO1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybiAnJztcbiAgICAgICAgcmV0dXJuIE5vZGVNZ3IuZ2V0Tm9kZVBhdGgobm9kZSkgPz8gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+i5Y+X566h55CG55qE5omA5pyJ6IqC54K555qEIHV1aWQg5pWw57uEXG4gICAgICovXG4gICAgcXVlcnlVdWlkcygpIHtcbiAgICAgICAgY29uc3Qgbm9kZU1hcCA9IE5vZGVNZ3IuZ2V0Tm9kZXMoKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG5vZGVNYXApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouS4gOS4quiKgueCue+8jOW5tui/lOWbnuivpeiKgueCueeahCBkdW1wIOaVsOaNrlxuICAgICAqIOWmguaenOiKgueCueW3suiiq+WIoOmZpCBwYXJlbnQgPSBudWxs77yM5YiZ6L+U5ZueIG51bGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXVpZFxuICAgICAqL1xuICAgIGFzeW5jIHF1ZXJ5RHVtcCh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPElOb2RlIHwgSVNjZW5lIHwgbnVsbD4ge1xuICAgICAgICAvLyDlj6rmn6XnjrDmnInlnLrmma/ph4znmoToioLngrnvvIzkuI3pnIDopoHlho3mn6Xlm57mlLbnq5nph4znmoToioLngrlcbiAgICAgICAgY29uc3Qgbm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZXNJblNjZW5lKClbdXVpZF07XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGR1bXBVdGlsLmR1bXBOb2RlKG5vZGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouS4gOS4quiKgueCue+8jOW5tui/lOWbnuivpeiKgueCueeahCBkdW1wIOaVsOaNrlxuICAgICAqIOS4jeiuuuiKgueCueaYr+WQpuiiq+WIoOmZpFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1dWlkXG4gICAgICovXG4gICAgYXN5bmMgcXVlcnlEdW1wQXRBbGwodXVpZDogc3RyaW5nKTogUHJvbWlzZTxJTm9kZSB8IElTY2VuZSB8IG51bGw+IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMucXVlcnkodXVpZCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGR1bXBVdGlsLmR1bXBOb2RlKG5vZGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouW9k+WJjeWcuuaZr+eahOiKgueCueagkeS/oeaBr1xuICAgICAqIEBwYXJhbSB1dWlkIGFzc2V0IHV1aWRcbiAgICAgKi9cbiAgICBxdWVyeU5vZGVzQnlBc3NldFV1aWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE5vZGVNZ3IuZ2V0Tm9kZXNCeUFzc2V0KHV1aWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluS4ouWksei1hOa6kOeahOiKgueCuVxuICAgICAqIEByZXR1cm5zIHV1aWRzW10g6IqC54K55pWw57uEXG4gICAgICovXG4gICAgYXN5bmMgcXVlcnlOb2Rlc01pc3NBc3NldCgpIHtcbiAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICBpZiAoIXNjZW5lPy5jaGlsZHJlbj8ubGVuZ3RoKSByZXR1cm4gW107XG5cbiAgICAgICAgY29uc3Qgbm9kZXNVdWlkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IG1pc3NTY3JpcHRzOiB7IG5vZGVVdWlkOiBzdHJpbmcsIHNjcmlwdFV1aWQ6IHN0cmluZyB9W10gPSBbXTtcblxuICAgICAgICBFZGl0b3JFeHRlbmRzLndhbGtQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgc2NlbmUuY2hpbGRyZW4sXG4gICAgICAgICAgICAob2JqOiBhbnksIGtleTogYW55LCB2YWx1ZTogYW55LCBwYXJzZWRPYmplY3RzOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDlpITnkIbotYTmupDkuKLlpLFcbiAgICAgICAgICAgICAgICBpZiAodmFsdWU/Ll91dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXByZXNzZWQgPSBFZGl0b3JFeHRlbmRzLlV1aWRVdGlscy5jb21wcmVzc1VVSUQodmFsdWUuX3V1aWQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldEV4aXN0cyA9IGNjLmFzc2V0TWFuYWdlci5hc3NldHMuZ2V0KHZhbHVlLl91dWlkKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MuYXNzZXRNYW5hZ2VyLmFzc2V0cy5nZXQoY29tcHJlc3NlZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYXNzZXRFeGlzdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTGFzdChwYXJzZWRPYmplY3RzLCAoaXRlbTogYW55KSA9PiBpdGVtIGluc3RhbmNlb2YgY2MuTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZSkgbm9kZXNVdWlkLmFkZChub2RlLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5aSE55CGIE1pc3NpbmdTY3JpcHRcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBNaXNzaW5nU2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgX190eXBlX186IOWtmOWCqOe8luivkeS4jemAmui/h+aIluS4ouWkseeahOiEmuacrCBpZFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRJZCA9IHZhbHVlLl8kZXJpYWxpemVkPy5fX3R5cGVfXztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjcmlwdElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXNzU2NyaXB0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdmFsdWUubm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdFV1aWQ6IEVkaXRvckV4dGVuZHMuVXVpZFV0aWxzLmRlY29tcHJlc3NVVUlEKHNjcmlwdElkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHsgZG9udFNraXBOdWxsOiBmYWxzZSwgaWdub3JlU3ViUHJlZmFiSGVscGVyOiB0cnVlIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyDmibnph4/mn6Xor6Llubbmt7vliqDnnJ/mraPkuKLlpLHnmoTohJrmnKzoioLngrlcbiAgICAgICAgaWYgKG1pc3NTY3JpcHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdTY3JpcHRzID0gbmV3IFNldChcbiAgICAgICAgICAgICAgICAoYXdhaXQgUHJvbWlzZS5hbGwobWlzc1NjcmlwdHMubWFwKCh7IHNjcmlwdFV1aWQgfSkgPT5cbiAgICAgICAgICAgICAgICAgICAgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ3F1ZXJ5QXNzZXRJbmZvJywgW3NjcmlwdFV1aWRdKVxuICAgICAgICAgICAgICAgICkpKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChpbmZvOiBhbnkgfCBudWxsKSA9PiBpbmZvPy51dWlkKVxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHsgbm9kZVV1aWQsIHNjcmlwdFV1aWQgfSBvZiBtaXNzU2NyaXB0cykge1xuICAgICAgICAgICAgICAgIGlmICghZXhpc3RpbmdTY3JpcHRzLmhhcyhzY3JpcHRVdWlkKSkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1V1aWQuYWRkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShub2Rlc1V1aWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmihOiniOiuvue9ruWxnuaAp+WQjueahOaViOaenO+8jOS4jei/m+WFpXVuZG/loIbmoIhcbiAgICAgKiBAcGFyYW0gdXVpZFxuICAgICAqIEBwYXJhbSBwYXRoXG4gICAgICogQHBhcmFtIGR1bXBcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGFzeW5jIHByZXZpZXdTZXROb2RlUHJvcGVydHkodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGR1bXA6IElQcm9wZXJ0eSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlKHV1aWQpO1xuICAgICAgICBjb25zdCBpbmZvID0gZHVtcFV0aWwucGFyc2luZ1BhdGgocGF0aCwgbm9kZSk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdwcmV2aWV3U2V0Tm9kZVByb3BlcnR5IGZhaWxlZO+8mm5vZGUgbm90IGZvdW5kJywgdXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpbmZvLnNlYXJjaCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdwcmV2aWV3U2V0Tm9kZVByb3BlcnR5IGZhaWxlZO+8mnByb3BlcnR5IHBhdGggZXJyb3InLCBwYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyDpnIDopoHoh6rlt7HorrDlvZXorr7nva7liY3nmoTlsZ7mgKfvvIzlnKjlj5bmtojml7bov5jljp/mlYjmnpw7XG4gICAgICAgIGxldCB0YXJnZXQgPSBnZXQobm9kZSwgaW5mby5zZWFyY2gpID8gZ2V0KG5vZGUsIGluZm8uc2VhcmNoKVtpbmZvLmtleV0gOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICAvLyDlsZ7mgKfkuLrnqbrml7bkvb/nlKjpu5jorqTlgLxcbiAgICAgICAgICAgIHRhcmdldCA9IGR1bXBVdGlsLmdldERlZmF1bHRWYWx1ZShkdW1wLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGEgPSBkdW1wVXRpbC5lbmNvZGVPYmplY3QodGFyZ2V0LCB7XG4gICAgICAgICAgICB0eXBlOiBkdW1wLnR5cGUsXG4gICAgICAgICAgICBjdG9yOiB0YXJnZXQuY29uc3RydWN0b3IsXG4gICAgICAgIH0sIHRhcmdldCk7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBjYWNoZTogTWFwPHN0cmluZywgYW55PiA9IHRoaXMuX3ByZXZpZXdQcm9wZXJ0eXNDYWNoZS5oYXModXVpZCkgPyB0aGlzLl9wcmV2aWV3UHJvcGVydHlzQ2FjaGUuZ2V0KHV1aWQpIDogbmV3IE1hcCgpO1xuICAgICAgICAvLyDlj6rmnInnrKzkuIDmrKHpooTop4jml7bnmoTmlbDmja7vvIzmmK/oioLngrnljp/mnKznmoTmlbDmja5cbiAgICAgICAgaWYgKCFjYWNoZT8uaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICBjYWNoZT8uc2V0KHBhdGgsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3ByZXZpZXdQcm9wZXJ0eXNDYWNoZS5zZXQodXVpZCwgY2FjaGUpO1xuICAgICAgICAvLyDkv67mlLnlsZ7mgKfvvIxmYWxzZeS8mumBv+WFjeiusOW9lXVuZG/mk43kvZw7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNldFByb3BlcnR5KHV1aWQsIHBhdGgsIGR1bXAsIGZhbHNlKTtcbiAgICB9XG5cbiAgICBhc3luYyBjYW5jZWxQcmV2aWV3U2V0Tm9kZVByb3BlcnR5KHV1aWQ6IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIC8vIOaLv+WIsOiusOW9leeahOaVsOaNru+8jOi/mOWOn+WbnuaVsOaNrlxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5xdWVyeSh1dWlkKTtcbiAgICAgICAgY29uc3QgaW5mbyA9IGR1bXBVdGlsLnBhcnNpbmdQYXRoKHBhdGgsIG5vZGUpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignY2FuY2VsUHJldmlld1NldE5vZGVQcm9wZXJ0eSBmYWlsZWQ6bm9kZSBub3QgZm91bmQnLCB1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWluZm8uc2VhcmNoKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ2NhbmNlbFByZXZpZXdTZXROb2RlUHJvcGVydHkgZmFpbGVkOnByb3BlcnR5IHBhdGggZXJyb3InLCBwYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjYWNoZSA9IHRoaXMuX3ByZXZpZXdQcm9wZXJ0eXNDYWNoZS5nZXQodXVpZCk7XG4gICAgICAgIGlmICghY2FjaGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkdW1wID0gY2FjaGU/LmdldChwYXRoKTtcbiAgICAgICAgaWYgKCFkdW1wKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5riF55CG5o6J5Y6f5p2l55qE5pWw5o2uXG4gICAgICAgIGNhY2hlPy5kZWxldGUocGF0aCk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNldFByb3BlcnR5KHV1aWQsIHBhdGgsIGR1bXAsIGZhbHNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDorr7nva7kuIDkuKroioLngrnnmoTlsZ7mgKdcbiAgICAgKiBAcGFyYW0geyp9IHV1aWRcbiAgICAgKiBAcGFyYW0geyp9IHBhdGhcbiAgICAgKiBAcGFyYW0geyp9IGtleVxuICAgICAqIEBwYXJhbSB7Kn0gcmVjb3JkIOaYr+WQpuiusOW9leWIsHVuZG/loIbmoIjkuIpcbiAgICAgKiBAcGFyYW0geyp9IGR1bXBcbiAgICAgKi9cbiAgICBhc3luYyBzZXRQcm9wZXJ0eSh1dWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgZHVtcDogSVByb3BlcnR5LCByZWNvcmQgPSB0cnVlKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIC8vIOWkmuS4quiKgueCueabtOaWsOWAvFxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHV1aWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRQcm9wZXJ0eSh1dWlkW2ldLCBwYXRoLCBkdW1wKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMucXVlcnkodXVpZCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBTZXQgcHJvcGVydHkgZmFpbGVkOiAke3V1aWR9IGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDop6blj5Hkv67mlLnliY3nmoTkuovku7ZcbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBub2RlKTtcbiAgICAgICAgaWYgKHBhdGggPT09ICdwYXJlbnQnICYmIG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAvLyDlj5HpgIHoioLngrnkv67mlLnmtojmga9cbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgbm9kZS5wYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5oGi5aSN5pWw5o2uXG4gICAgICAgIGF3YWl0IGR1bXBVdGlsLnJlc3RvcmVQcm9wZXJ0eShub2RlLCBwYXRoLCBkdW1wKTtcblxuICAgICAgICAvLyDop6blj5Hkv67mlLnlkI7nmoTkuovku7ZcbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIHsgdHlwZTogTm9kZU9wZXJhdGlvblR5cGUuU0VUX1BST1BFUlRZLCBwcm9wUGF0aDogcGF0aCwgcmVjb3JkOiByZWNvcmQgfSk7XG4gICAgICAgIC8vIOWmguaenOaYr+aVsOe7hOeahOivne+8jOmcgOimgeS+neasoSBlbWl0IGNoYW5nZe+8jOi3r+W+hOWumuS9jeWIsOaVsOe7hOeahOS4i+agh+S9jee9rlxuICAgICAgICBpZiAoZHVtcC5pc0FycmF5ICYmIEFycmF5LmlzQXJyYXkoZHVtcC52YWx1ZSkpIHtcbiAgICAgICAgICAgIGR1bXAudmFsdWUuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCB7IHR5cGU6IE5vZGVPcGVyYXRpb25UeXBlLlNFVF9QUk9QRVJUWSwgcHJvcFBhdGg6IGAke3BhdGh9LiR7aX1gLCByZWNvcmQ6IHJlY29yZCB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIOaUueWPmOeItuWtkOWFs+ezu1xuICAgICAgICBpZiAocGF0aCA9PT0gJ3BhcmVudCcgJiYgbm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIC8vIOWPkemAgeiKgueCueS/ruaUuea2iOaBr1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUucGFyZW50LCB7IHR5cGU6IE5vZGVPcGVyYXRpb25UeXBlLlNFVF9QUk9QRVJUWSwgcHJvcFBhdGg6ICdjaGlsZHJlbicsIHJlY29yZDogcmVjb3JkIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruWxnuaAp+eahOm7mOiupOWAvFxuICAgICAqIEBwYXJhbSB7Kn0gdXVpZFxuICAgICAqIEBwYXJhbSB7Kn0gcGF0aFxuICAgICAqIEBwYXJhbSB7Kn0gdHlwZVxuICAgICAqL1xuICAgIGFzeW5jIHJlc2V0UHJvcGVydHkodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgLy8g5aSa5Liq6IqC54K55pu05paw5YC8XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICB1dWlkLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldFByb3BlcnR5KGlkLCBwYXRoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMucXVlcnkodXVpZCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBTZXQgZGVmYXVsdCB2YWx1ZSBmYWlsZWQ6ICR7dXVpZH0gZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOinpuWPkeS/ruaUueWJjeeahOS6i+S7tlxuICAgICAgICB0aGlzLmVtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIG5vZGUpO1xuXG4gICAgICAgIC8vIOaBouWkjeaVsOaNrlxuICAgICAgICBhd2FpdCBkdW1wVXRpbC5yZXNldFByb3BlcnR5KG5vZGUsIHBhdGgpO1xuXG4gICAgICAgIC8vIOinpuWPkeS/ruaUueWQjueahOS6i+S7tlxuICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgbm9kZSwgeyB0eXBlOiBOb2RlT3BlcmF0aW9uVHlwZS5TRVRfUFJPUEVSVFksIHByb3BQYXRoOiBwYXRoIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsIbkuIDkuKrlsZ7mgKflhbbnjrDlrZjlgLzkuI7lrprkuYnnsbvlnovlgLzkuI3ljLnphY3vvIzmiJbogIXkuLogbnVsbCDpu5jorqTlgLzvvIzmlLnkuLrkuIDkuKrlj6/nvJbovpHnmoTlgLxcbiAgICAgKiBAcGFyYW0geyp9IHV1aWRcbiAgICAgKiBAcGFyYW0geyp9IHBhdGhcbiAgICAgKi9cbiAgICBhc3luYyB1cGRhdGVQcm9wZXJ0eUZyb21OdWxsKHV1aWQ6IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIC8vIOWkmuS4quiKgueCueabtOaWsOWAvFxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgdXVpZC5mb3JFYWNoKChpZCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUHJvcGVydHlGcm9tTnVsbChpZCwgcGF0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnF1ZXJ5KHV1aWQpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgU2V0IGRlZmF1bHQgdmFsdWUgZmFpbGVkOiAke3V1aWR9IGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDop6blj5Hkv67mlLnliY3nmoTkuovku7ZcbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBub2RlKTtcblxuICAgICAgICAvLyDmgaLlpI3mlbDmja5cbiAgICAgICAgYXdhaXQgZHVtcFV0aWwudXBkYXRlUHJvcGVydHlGcm9tTnVsbChub2RlLCBwYXRoKTtcblxuICAgICAgICAvLyDop6blj5Hkv67mlLnlkI7nmoTkuovku7ZcbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIHsgdHlwZTogTm9kZU9wZXJhdGlvblR5cGUuU0VUX1BST1BFUlRZLCBwcm9wUGF0aDogcGF0aCB9KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6YeN572u6IqC54K55bGe5oCnIHBvc2l0aW9uIHJvdGF0aW9uIHNjYWxlXG4gICAgICogQHBhcmFtIHsqfSB1dWlkXG4gICAgICovXG4gICAgYXN5bmMgcmVzZXROb2RlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICAvLyDlpJrkuKroioLngrnmm7TmlrDlgLxcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIHV1aWQuZm9yRWFjaCgoaWQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0Tm9kZShpZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnF1ZXJ5KHV1aWQpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgU2V0IGRlZmF1bHQgdmFsdWUgZmFpbGVkOiAke3V1aWR9IGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDop6blj5Hkv67mlLnliY3nmoTkuovku7ZcbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBub2RlKTtcblxuICAgICAgICAvLyDmgaLlpI3mlbDmja5cbiAgICAgICAgY29uc3QgcHJvcGVydGllcyA9IFsncG9zaXRpb24nLCAncm90YXRpb24nLCAnc2NhbGUnLCAnbW9iaWxpdHknXTtcbiAgICAgICAgZm9yIChjb25zdCBwYXRoIG9mIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGF3YWl0IGR1bXBVdGlsLnJlc2V0UHJvcGVydHkobm9kZSwgcGF0aCk7XG5cbiAgICAgICAgICAgIC8vIOinpuWPkeS/ruaUueWQjueahOS6i+S7tlxuICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIHsgdHlwZTogTm9kZU9wZXJhdGlvblR5cGUuU0VUX1BST1BFUlRZLCBwcm9wUGF0aDogcGF0aCB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDorr7nva7mn5DkuKroioLngrnov57lkIzlroPnmoTlrZDpm4bnmoQgbGF5ZXIg5bGe5oCn5YC8XG4gICAgICogQHBhcmFtIHsqfSB1dWlkXG4gICAgICogQHBhcmFtIHsqfSBkdW1wXG4gICAgICovXG4gICAgYXN5bmMgc2V0Tm9kZUFuZENoaWxkcmVuTGF5ZXIodXVpZDogc3RyaW5nLCBkdW1wOiBhbnkpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5zZXRQcm9wZXJ0eSh1dWlkLCAnbGF5ZXInLCBkdW1wKTtcblxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5xdWVyeSh1dWlkKTtcblxuICAgICAgICBpZiAobm9kZSAmJiBub2RlLmNoaWxkcmVuICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXROb2RlQW5kQ2hpbGRyZW5MYXllcihjaGlsZC51dWlkLCBkdW1wKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6LCD5pW05LiA5Liq5pWw57uE57G75Z6L55qE5pWw5o2u5YaF5p+Q5LiqIGl0ZW0g55qE5L2N572uXG4gICAgICogQHBhcmFtIHV1aWQg6KaB6KKr56e75Yqo55qE6IqC54K55oiW57uE5Lu2XG4gICAgICogQHBhcmFtIHBhdGgg5pWw57uE55qE5pCc57Si6Lev5b6EXG4gICAgICogQHBhcmFtIHRhcmdldCDnjrDlnKjnmoTntKLlvJXkvY3nva5cbiAgICAgKiBAcGFyYW0gb2Zmc2V0IOWBj+enu+mHj1xuICAgICAqL1xuICAgIG1vdmVBcnJheUVsZW1lbnQodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHRhcmdldDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICAvLyBUT0RPOiBkZXByZWNhdGVkIOi/meS4gOautSBpc0FycmF5IOW6lOivpeayoeacieeUqOWIsOS6hu+8jOW7uuiuruS4gOauteaXtumXtOWQjuWPr+S7peWIoOaOiVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgdXVpZC5mb3JFYWNoKChpZCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZUFycmF5RWxlbWVudChpZCwgcGF0aCwgdGFyZ2V0LCBvZmZzZXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5xdWVyeSh1dWlkKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYE1vdmUgcHJvcGVydHkgZmFpbGVkOiAke3V1aWR9IGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlm6DkuLogcGF0aCDlhoXnmoQgX19jb21wc19fIOWunumZheaMh+WQkeeahOaYryBfY29tcG9uZW50c1xuICAgICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKCdfX2NvbXBzX18nLCAnX2NvbXBvbmVudHMnKTtcblxuICAgICAgICAvLyDmib7liLDmjIflrprnmoQgZGF0YSDmlbDmja5cbiAgICAgICAgY29uc3QgZGF0YSA9IHBhdGggPyBnZXQobm9kZSwgcGF0aCkgOiBub2RlO1xuICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgTW92ZSBwcm9wZXJ0eSBmYWlsZWQ6ICR7dXVpZH0gZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBNb3ZlIHByb3BlcnR5IGZhaWxlZDogJHt1dWlkfSAtICR7cGF0aH0gaXNuJ3QgYW4gYXJyYXlgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWPkemAgeiKgueCueS/ruaUuea2iOaBr1xuICAgICAgICB0aGlzLmVtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIG5vZGUpO1xuXG4gICAgICAgIC8vIOenu+WKqOmhuuW6j1xuICAgICAgICBpZiAocGF0aCA9PT0gJ2NoaWxkcmVuJykge1xuICAgICAgICAgICAgLy8g6L+H5ruk5o6J57G75Ly8IEZvcmVncm91bmQgQmFja2dyb3VuZCDnmoToioLngrlcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gZGF0YS5maWx0ZXIoKGNoaWxkKSA9PiAhKGNoaWxkLm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLkhpZGVJbkhpZXJhcmNoeSkpO1xuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlblt0YXJnZXRdO1xuXG4gICAgICAgICAgICAvLyDlrrnplJnlpITnkIbvvJrmlrDlop7nmoToioLngrnlnKjlvJXmk47kuK3ov5jmnKrliJvlu7rvvIzlsLHmjIfku6Tlhbbnp7vliqjvvIxzZXRTaWJsaW5nSW5kZXgg5Lya5oql6ZSZXG4gICAgICAgICAgICBpZiAoIWNoaWxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDmib7lh7ropoHnp7vliqjnmoToioLngrnlnKjmsqHmnInov4fmu6TmjonpmpDol4/oioLngrnnmoTlnLrmma/kuK3nmoTkvY3nva5cbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gZGF0YS5pbmRleE9mKGNoaWxkcmVuW3RhcmdldCArIG9mZnNldF0pO1xuXG4gICAgICAgICAgICBjaGlsZC5zZXRTaWJsaW5nSW5kZXgoaW5kZXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IGRhdGEuc3BsaWNlKHRhcmdldCwgMSk7XG4gICAgICAgICAgICBkYXRhLnNwbGljZSh0YXJnZXQgKyBvZmZzZXQsIDAsIHRlbXBbMF0pO1xuXG4gICAgICAgICAgICBzZXQobm9kZSwgcGF0aCwgZGF0YSk7IC8vIOiHqui6qyA9IOiHqui6q++8iOWJr+acrO+8ie+8jOS4uuS6huWFvOmhvuadkOi0qOmcgOimgeaVtOS9k+i1i+WAvOWJr+acrOeahOaDheWGtVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Y+R6YCB6IqC54K55L+u5pS55raI5oGvXG4gICAgICAgIHRoaXMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCB7IHR5cGU6IE5vZGVPcGVyYXRpb25UeXBlLk1PVkVfQVJSQVlfRUxFTUVOVCwgcHJvcFBhdGg6IHBhdGggfSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yig6Zmk5LiA5Liq5pWw57uE5YWD57SgXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K555qEIHV1aWRcbiAgICAgKiBAcGFyYW0gcGF0aCDlhYPntKDmiYDlnKjmlbDnu4TnmoTmkJzntKLot6/lvoRcbiAgICAgKiBAcGFyYW0gaW5kZXgg55uu5qCHIGl0ZW0g5Y6f5p2l55qE57Si5byVXG4gICAgICovXG4gICAgcmVtb3ZlQXJyYXlFbGVtZW50KHV1aWQ6IHN0cmluZywgcGF0aDogc3RyaW5nLCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICB1dWlkLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVBcnJheUVsZW1lbnQoaWQsIHBhdGgsIGluZGV4KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMucXVlcnkodXVpZCk7XG4gICAgICAgIGNvbnN0IGtleSA9IChwYXRoIHx8ICcnKS5zcGxpdCgnLicpLnBvcCgpO1xuXG4gICAgICAgIGlmIChrZXkgPT09ICdjaGlsZHJlbicpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVW5hYmxlIHRvIGNoYW5nZSBgY2hpbGRyZW5gIG9mIHRoZSBwYXJlbnQsIFBsZWFzZSBjaGFuZ2UgdGhlIGBwYXJlbnRgIG9mIHRoZSBjaGlsZCcpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYE1vdmUgcHJvcGVydHkgZmFpbGVkOiAke3V1aWR9IGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlm6DkuLogcGF0aCDlhoXnmoQgX19jb21wc19fIOWunumZheaMh+WQkeeahOaYryBfY29tcG9uZW50c1xuICAgICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKCdfX2NvbXBzX18nLCAnX2NvbXBvbmVudHMnKTtcblxuICAgICAgICAvLyDmib7liLDmjIflrprnmoQgZGF0YSDmlbDmja5cbiAgICAgICAgY29uc3QgZGF0YSA9IHBhdGggPyBnZXQobm9kZSwgcGF0aCkgOiBub2RlO1xuICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgTW92ZSBwcm9wZXJ0eSBmYWlsZWQ6ICR7dXVpZH0gZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBNb3ZlIHByb3BlcnR5IGZhaWxlZDogJHt1dWlkfSAtICR7cGF0aH0uJHtrZXl9IGlzbid0IGFuIGFycmF5YCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlj5HpgIHoioLngrnkv67mlLnmtojmga9cbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBub2RlKTtcblxuICAgICAgICAvLyDliKDpmaRjb21wb25lbnRz5Lit55qE5YWD57Sg6KaB6YCa6L+H6LCD55SocmVtb3ZlQ29tcG9uZW505pa55rOVXG4gICAgICAgIGlmIChwYXRoID09PSAnX2NvbXBvbmVudHMnKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wID0gZGF0YVtpbmRleF07XG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vY29jb3MtY3JlYXRvci8zZC10YXNrcy9pc3N1ZXMvMTExNlxuICAgICAgICAgICAgY29tcE1nci5yZW1vdmVDb21wb25lbnQoY29tcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDliKDpmaTmn5DkuKogaXRlbVxuICAgICAgICAgICAgZGF0YS5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICBzZXQobm9kZSwgcGF0aCwgZGF0YSk7IC8vIOiHqui6qyA9IOiHqui6q++8iOWJr+acrO+8ie+8jOS4uuS6huWFvOmhvuadkOi0qOmcgOimgeaVtOS9k+i1i+WAvOWJr+acrOeahOaDheWGtVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Y+R6YCB6IqC54K55L+u5pS55raI5oGvXG4gICAgICAgIHRoaXMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCB7IHR5cGU6IE5vZGVPcGVyYXRpb25UeXBlLlJFTU9WRV9BUlJBWV9FTEVNRU5ULCBwcm9wUGF0aDogcGF0aCwgaW5kZXggfSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5aSN5Yi26IqC54K555qE5Yqo5L2c77yM57uZ5LiL5LiA5q2l57KY6LS077yI5Yib5bu677yJ6IqC54K55YeG5aSH5pWw5o2uXG4gICAgICogQHBhcmFtIHsqfSB1dWlkcyDljZXkuKogc3RyaW5nIOaIliBhcnJheVxuICAgICAqL1xuICAgIGNvcHkodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh1dWlkcykpIHtcbiAgICAgICAgICAgIHV1aWRzID0gW3V1aWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV1aWRzID0gdGhpcy5jYW5SZW1vdmVPckNvcHkodXVpZHMpO1xuXG4gICAgICAgIHN0YXNoSW5zdGFudHMgPSB7fTtcblxuICAgICAgICBmdW5jdGlvbiBjaGFuZ2VGaWxlSWQobm9kZTogTm9kZSkge1xuICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IG5vZGVbJ19wcmVmYWInXTtcblxuICAgICAgICAgICAgaWYgKHByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICBpZiAocHJlZmFiSW5mby5pbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6Z2ecHJlZmFiSW5zdGFuY2XoioLngrnvvIzlsLHlj5jkuLrmma7pgJroioLngrnmnaXlpI3liLZcbiAgICAgICAgICAgICAgICAgICAgbm9kZVsnX3ByZWZhYiddID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBub2RlLmNvbXBvbmVudHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLl9fcHJlZmFiID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IG5vZGUuY2hpbGRyZW4ubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgLy8gLmNoaWxkcmVuIOaYr+WPquivu+WxnuaAp++8jOmcgOimgeeUqCBzcGxpY2VcbiAgICAgICAgICAgICAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAvLyDpnIDopoHliZTpmaTkuI3pnIDopoHkv53lrZjnmoTnp4HmnInoioLngrlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNQcml2YXRlTm9kZSA9IGNoaWxkLm9iakZsYWdzICYgY2MuT2JqZWN0LkZsYWdzLkhpZGVJbkhpZXJhcmNoeTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FuRGVsZXRlID0gY2hpbGQub2JqRmxhZ3MgJiBjYy5PYmplY3QuRmxhZ3MuRG9udFNhdmU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ByaXZhdGVOb2RlICYmIGNhbkRlbGV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub2RlLmNoaWxkcmVuLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VGaWxlSWQoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIHV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5xdWVyeSh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpbnN0YW50ID0gY2MuaW5zdGFudGlhdGUobm9kZSk7XG5cbiAgICAgICAgICAgIC8vIEhhY2sg55uu5YmNIGNjLmluc3RhbnRpYXRlIOayoeacieWPmOWKqCBmaWxlSWTvvIzov5nph4zlj5jliqjkuIDkuIvvvIzkvb/lroPkuI3ph43lpI1cbiAgICAgICAgICAgIGNoYW5nZUZpbGVJZChpbnN0YW50KTtcblxuICAgICAgICAgICAgc3Rhc2hJbnN0YW50c1t1dWlkXSA9IHtcbiAgICAgICAgICAgICAgICBpbnN0YW50LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1dWlkcztcbiAgICB9XG5cbiAgICBnZXRDb3BpZWRVdWlkcygpOiBzdHJpbmdbXSB7XG4gICAgICAgIHJldHVybiBzdGFzaEluc3RhbnRzID8gT2JqZWN0LmtleXMoc3Rhc2hJbnN0YW50cykgOiBbXTtcbiAgICB9XG5cbiAgICBkdXBsaWNhdGUodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh1dWlkcykpIHtcbiAgICAgICAgICAgIHV1aWRzID0gW3V1aWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5ld1V1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBvbGRTdGFzaEluc3RhbnRzID0gc3Rhc2hJbnN0YW50cztcbiAgICAgICAgdXVpZHMgPSB0aGlzLmNvcHkodXVpZHMpO1xuXG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiB1dWlkcykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMucXVlcnkodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBuZXdVdWlkID0gdGhpcy5jcmVhdGVOb2RlRnJvbVN0YXNoKG5vZGUucGFyZW50Py51dWlkLCBudWxsLCB1dWlkLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAobmV3VXVpZCkge1xuICAgICAgICAgICAgICAgIG5ld1V1aWRzLnB1c2gobmV3VXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdGFzaEluc3RhbnRzID0gb2xkU3Rhc2hJbnN0YW50cztcblxuICAgICAgICByZXR1cm4gbmV3VXVpZHMuZmlsdGVyKEJvb2xlYW4pO1xuICAgIH1cblxuICAgIHBhc3RlKHRhcmdldDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCwgdXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdLCBrZWVwV29ybGRUcmFuc2Zvcm0gPSBmYWxzZSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXdVdWlkczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgdXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1V1aWQgPSB0aGlzLmNyZWF0ZU5vZGVGcm9tU3Rhc2godGFyZ2V0LCBudWxsLCB1dWlkLCBrZWVwV29ybGRUcmFuc2Zvcm0sIHRydWUpO1xuICAgICAgICAgICAgaWYgKG5ld1V1aWQpIHtcbiAgICAgICAgICAgICAgICBuZXdVdWlkcy5wdXNoKG5ld1V1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnF1ZXJ5KG5ld1V1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gbm9kZS5wYXJlbnQ/LnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3VXVpZHMuZmlsdGVyKEJvb2xlYW4pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaMgui9veiKgueCue+8jOWmguaLluWFpeWSjOWJquWIh1xuICAgICAqIEBwYXJhbSBwYXJlbnRcbiAgICAgKiBAcGFyYW0gdXVpZHNcbiAgICAgKiBAcGFyYW0ga2VlcFdvcmxkVHJhbnNmb3JtXG4gICAgICovXG4gICAgc2V0UGFyZW50KHBhcmVudDogc3RyaW5nLCB1dWlkczogc3RyaW5nIHwgc3RyaW5nW10sIGtlZXBXb3JsZFRyYW5zZm9ybSA9IGZhbHNlKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh1dWlkcykpIHtcbiAgICAgICAgICAgIHV1aWRzID0gW3V1aWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnROb2RlOiBOb2RlIHwgbnVsbDtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZSA9IHRoaXMucXVlcnkocGFyZW50KTtcbiAgICAgICAgfVxuICAgICAgICBwYXJlbnROb2RlIHx8PSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuXG4gICAgICAgIGlmICghcGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbW92ZWRVdWlkczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIHV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5xdWVyeSh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSB8fCAhbm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgb2xkUGFyZW50ID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnRDaGFuZ2VkID0gb2xkUGFyZW50ICE9PSBwYXJlbnROb2RlO1xuXG4gICAgICAgICAgICBpZiAocGFyZW50Tm9kZSA9PT0gbm9kZSB8fCBwYXJlbnROb2RlLmlzQ2hpbGRPZihub2RlKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHNldCBwYXJlbnQ6IHRhcmdldCBwYXJlbnQgaXMgdGhlIG5vZGUgaXRzZWxmIG9yIGl0cyBkZXNjZW5kYW50LicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2xkUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBvbGRQYXJlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhcmVudENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIHBhcmVudE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBub2RlKTtcblxuICAgICAgICAgICAgbm9kZS5zZXRQYXJlbnQocGFyZW50Tm9kZSwga2VlcFdvcmxkVHJhbnNmb3JtKTtcblxuICAgICAgICAgICAgbW92ZWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1vdmVkVXVpZHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5a6e5pe26I635Y+W5paw6IqC54K55Zyo5LiA5Liq54i26IqC54K55LiL55qE5pyJ5pWI5ZCN56ewXG4gICAgICog6KeE5YiZ5pivIE5vZGUg5ZCM5ZCN5pe25Li6IE5vZGUtMDAxXG4gICAgICogQHBhcmFtIG5hbWUg5ZCN56ewXG4gICAgICogQHBhcmFtIHBhcmVudFV1aWQg54i26IqC54K5IHV1aWRcbiAgICAgKi9cbiAgICBnZW5lcmF0ZUF2YWlsYWJsZU5hbWUobmFtZTogc3RyaW5nLCBwYXJlbnRVdWlkPzogc3RyaW5nKSB7XG4gICAgICAgIGlmICghbmFtZSkge1xuICAgICAgICAgICAgbmFtZSA9ICdOb2RlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnQgPSBkaXJlY3Rvci5nZXRTY2VuZSgpIGFzIE5vZGU7XG5cbiAgICAgICAgaWYgKHBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnF1ZXJ5KHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgcGFyZW50ID0gbm9kZSA/IG5vZGUgOiBwYXJlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0Tm9kZU5hbWUobmFtZSwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBjcmVhdGVOb2RlRnJvbVN0YXNoKHBhcmVudFV1aWQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQsIG5hbWU6IGFueSwgc3Rhc2hVdWlkOiBzdHJpbmcgfCBudWxsLCBrZWVwV29ybGRUcmFuc2Zvcm0gPSBmYWxzZSwga2VlcExheWVyID0gZmFsc2UpOiB1bmRlZmluZWQgfCBzdHJpbmcge1xuICAgICAgICBpZiAoIWNjLmRpcmVjdG9yLmdldFNjZW5lKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZWVwV29ybGRUcmFuc2Zvcm0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50OiBOb2RlIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGlmIChwYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICBwYXJlbnQgPSB0aGlzLnF1ZXJ5KHBhcmVudFV1aWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICBwYXJlbnQgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGlmIChzdGFzaFV1aWQpIHtcbiAgICAgICAgICAgIGlmIChzdGFzaEluc3RhbnRzPy5bc3Rhc2hVdWlkXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgaW5zdGFudCB9ID0gc3Rhc2hJbnN0YW50c1tzdGFzaFV1aWRdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluc3RhbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IGNjLmluc3RhbnRpYXRlKGluc3RhbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlzaXROb2RlID0gKG46IE5vZGUsIGZuOiAodDogTm9kZSkgPT4gYm9vbGVhbiB8IHZvaWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm4obikpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG4uY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaXROb2RlKGNoaWxkLCBmbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc2l0Tm9kZShub2RlLCAodGFyZ2V0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSB0YXJnZXRbJ19wcmVmYWInXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlZmFiSW5mbz8uaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IHByZWZhYlV0aWxzLmNsb25lSW5zdGFuY2VXaXRoTmV3RmlsZUlkKHByZWZhYkluZm8uaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGdldE5vZGVOYW1lKG5vZGUubmFtZSwgcGFyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBjYy5Ob2RlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICBub2RlLm5hbWUgPSBuYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcmVudC5sYXllciAmJiBwYXJlbnQgIT09IGRpcmVjdG9yLmdldFNjZW5lKCkgJiYgIWtlZXBMYXllcikge1xuICAgICAgICAgICAgc2V0TGF5ZXIobm9kZSwgcGFyZW50LmxheWVyLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW1pdCgnbm9kZTpiZWZvcmUtYWRkJywgbm9kZSk7XG4gICAgICAgIHRoaXMuZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgcGFyZW50KTtcblxuICAgICAgICBub2RlLnNldFBhcmVudChwYXJlbnQsIGtlZXBXb3JsZFRyYW5zZm9ybSk7XG5cbiAgICAgICAgaWYgKCFzdGFzaFV1aWQpIHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlVUlUcmFuc2Zvcm1Db21wb25lbnQobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVtaXQoJ25vZGU6YWRkJywgbm9kZSk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGUudXVpZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnoa7kv53oioLngrnmnIkgVUlUcmFuc2Zvcm0g57uE5Lu2XG4gICAgICog55uu5YmN5Y+q6ZyA5L+d6Zqc5Zyo5Yib5bu656m66IqC54K555qE5pe25YCZ5qOA5p+l5Lu75oSP5LiK57qn5piv5ZCm5Li6IGNhbnZhc1xuICAgICAqL1xuICAgIGVuc3VyZVVJVHJhbnNmb3JtQ29tcG9uZW50KG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBjYy5Ob2RlICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAvLyDnqbroioLngrlcbiAgICAgICAgICAgIGxldCBpbnNpZGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCBwYXJlbnQgPSBub2RlLnBhcmVudDtcblxuICAgICAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBwYXJlbnQuY29tcG9uZW50cy5tYXAoKGNvbXApID0+IGNjLmpzLmdldENsYXNzTmFtZShjb21wLmNvbnN0cnVjdG9yKSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMuaW5jbHVkZXMoJ2NjLkNhbnZhcycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc2lkZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaW5zaWRlKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5hZGRDb21wb25lbnQoJ2NjLlVJVHJhbnNmb3JtJyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcmVzdG9yZVByZWZhYih1dWlkOiBzdHJpbmcsIGFzc2V0VXVpZDogc3RyaW5nKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdGhpcy1hbGlhc1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcztcblxuICAgICAgICBpZiAoIWRpcmVjdG9yLmdldFNjZW5lKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWFiOWPlua2iOmAieS4re+8jOaaguWtmOmAieS4reeahOiKgueCuSB1dWlkXG4gICAgICAgIC8vIGNvbnN0IHNlbGVjdGVkVXVpZHMgPSBjY2UuU2VsZWN0aW9uLnF1ZXJ5KCk7XG4gICAgICAgIC8vIGNjZS5TZWxlY3Rpb24uY2xlYXIoKTtcblxuICAgICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcnk7XG4gICAgICAgIGNvbnN0IHByZWZhYlJvb3QgPSBxdWVyeSh1dWlkKSBhcyBOb2RlO1xuXG4gICAgICAgIC8vIOagueaNriBmaWxlSWQg57yT5a2Y5pen6IqC54K577yM5Lul55So5LqO5LiA5Lqb5byV55So6IqC54K555qE6L+Y5Y6fXG4gICAgICAgIGNvbnN0IG9sZE5vZGVzOiBSZWNvcmQ8c3RyaW5nLCBOb2RlPiA9IHt9O1xuICAgICAgICAvKipcbiAgICAgICAgICog57yT5a2YIGZpbGVJZCDlr7nlupTnmoTml6foioLngrlcbiAgICAgICAgICogQHBhcmFtIG5vZGUg6IqC54K5XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjb2xsZWN0T2xkTm9kZXMobm9kZTogTm9kZSkge1xuICAgICAgICAgICAgaWYgKCFub2RlIHx8ICFub2RlWydfcHJlZmFiJ10pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9sZE5vZGVzW25vZGVbJ19wcmVmYWInXS5maWxlSWRdID0gbm9kZTtcblxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZS5jaGlsZHJlbikpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3RPbGROb2RlcyhjaGlsZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmoLnmja4gZmlsZUlkIOe8k+WtmOWtkOmbhuWIl+ihqCB1dWlkc1xuICAgICAgICBjb25zdCBjaGlsZHJlblV1aWQ6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+ID0ge307XG4gICAgICAgIGZ1bmN0aW9uIGNvbGxlY3RDaGlsZHJlblV1aWQobm9kZT86IE5vZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHJ0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkcmVuVXVpZFtub2RlLnV1aWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlblV1aWRbbm9kZS51dWlkXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlLmNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCAmJiBjaGlsZFsnX3ByZWZhYiddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ0W2NoaWxkWydfcHJlZmFiJ10uZmlsZUlkXSA9IGNoaWxkLnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlblV1aWRbbm9kZS51dWlkXSA9IHJ0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOagueaNriBmaWxlSWQg57yT5a2Y5a2Q6ZuG5YiX6KGo55qE5q2j56Gu57Si5byVXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuSW5kZXg6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIG51bWJlcj4+ID0ge307XG4gICAgICAgIGZ1bmN0aW9uIGNvbGxlY3RDaGlsZHJlbkluZGV4KG5vZGU6IE5vZGUgfCB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJ0OiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkcmVuSW5kZXhbbm9kZS51dWlkXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5JbmRleFtub2RlLnV1aWRdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCAmJiBjaGlsZFsnX3ByZWZhYiddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ0W2NoaWxkWydfcHJlZmFiJ10uZmlsZUlkXSA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbkluZGV4W25vZGUudXVpZF0gPSBydDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5qOA5p+lIGR1bXAg5Lit55qE5byV55So6IqC54K55piv5ZCm5Y+v55SoXG4gICAgICAgICAqIOaXp+iKgueCuei/mOWtmOWcqOeahOaXtuWAme+8jOaWsOaVsOaNruaYr+S4jeWPr+eUqOeahO+8jOaWsOaVsOaNrumHjOmcgOimgeabv+aNouS4uuaXp+iKgueCueeahCB1dWlkXG4gICAgICAgICAqIOaXp+iKgueCueS4jeWtmOWcqOeahOaXtuWAme+8jOaWsOaVsOaNruS+v+aYr+WPr+eUqOeahO+8jOWboOS4uuaWsOiKgueCueS4gOWumuS8muabv+aNouS4iuWOu+OAglxuICAgICAgICAgKiBAcGFyYW0gZHVtcENvbXBzIOe7hOS7tlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gcmVkaXJlY3RTY2VuZVJlZnMoZHVtcENvbXBzOiBhbnkpIHtcbiAgICAgICAgICAgIGR1bXBDb21wcy5mb3JFYWNoKChjb21wczogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb21wcy52YWx1ZSB8fCB0eXBlb2YgY29tcHMudmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoY29tcHMudmFsdWUpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFsnbm9kZSddLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcCA9IGNvbXBzLnZhbHVlW2tleV07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g6YCS5b2S5Yiw6YeM5bGCXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wLmlzQXJyYXkgJiYgQXJyYXkuaXNBcnJheShjb21wLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RTY2VuZVJlZnMoY29tcC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wLnR5cGUgPT09ICdjYy5Ob2RlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Tm9kZSA9IHF1ZXJ5KGNvbXAudmFsdWUudXVpZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaVsOaNrumUmeivr1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdOb2RlIHx8ICFuZXdOb2RlPy5bJ19wcmVmYWInXT8uZmlsZUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGROb2RlID0gb2xkTm9kZXNbbmV3Tm9kZVsnX3ByZWZhYiddLmZpbGVJZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudmFsdWUudXVpZCA9IG9sZE5vZGUudXVpZDsgLy8g5o2i5Li65pen6IqC54K555qEIHV1aWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOi/mOWOn+eOsOacieiKgueCueeahCBkdW1wIO+8jOWIoOmZpOWkmuS9meiKgueCue+8jOa3u+WKoOaWsOiKgueCuVxuICAgICAgICAgKiBAcGFyYW0gbmV3Tm9kZSDmlrDoioLngrlcbiAgICAgICAgICogQHBhcmFtIHBhcmVudE5vZGUg5paw6IqC54K555qE54i26IqC54K5XG4gICAgICAgICAqIEBwYXJhbSBwcmVmYWJQYXJlbnQg5paw6IqC54K56YCa6L+HIGZpbGVJZCDmjIflkJHnjrDmnInoioLngrnnmoTniLboioLngrlcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmUobmV3Tm9kZTogTm9kZSwgcGFyZW50Tm9kZT86IE5vZGUsIHByZWZhYlBhcmVudD86IE5vZGUpIHtcbiAgICAgICAgICAgIC8vIOengeacieiKgueCueS4jei/mOWOn1xuICAgICAgICAgICAgaWYgKG5ld05vZGUub2JqRmxhZ3MgJiBjYy5PYmplY3QuRmxhZ3MuSGlkZUluSGllcmFyY2h5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmaWxlSWQySW5kZXggPSBjb2xsZWN0Q2hpbGRyZW5JbmRleChwYXJlbnROb2RlKTsgLy8g5a+55bqU5paw5pWw5o2u5LiK55qE5a2Q6ZuG5o6S5YiXXG4gICAgICAgICAgICBjb25zdCBmaWxlSWQyVXVpZCA9IGNvbGxlY3RDaGlsZHJlblV1aWQocHJlZmFiUGFyZW50KTsgLy8g5a+55bqU5paw5pWw5o2u5LiK55qEIHV1aWRcblxuICAgICAgICAgICAgY29uc3QgZHVtcCA9IGR1bXBVdGlsLmR1bXBOb2RlKG5ld05vZGUpIGFzIElOb2RlO1xuICAgICAgICAgICAgY29uc3QgZmlsZUlkID0gZHVtcC5fX3ByZWZhYl9fIS5maWxlSWQ7XG4gICAgICAgICAgICAvLyDnjrDmnIkgcHJlZmFiIOiKgueCuVxuICAgICAgICAgICAgY29uc3QgcHJlZmFiID0gcHJlZmFiUGFyZW50ID8gcXVlcnkoZmlsZUlkMlV1aWRbZmlsZUlkXSkgOiBwcmVmYWJSb290O1xuXG4gICAgICAgICAgICBpZiAocHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c546w5pyJ55qE6IqC54K55a2Y5Zyo77yM5Y+q6ZyA6L+Y5Y6fIGR1bXAgZGF0YVxuICAgICAgICAgICAgICAgIHRoYXQuZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgcHJlZmFiKTtcblxuICAgICAgICAgICAgICAgIC8vIOWIoOmZpOaOieS4jeWcqOaWsOaVsOaNruS4iueahOWtkOiKgueCuVxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHByZWZhYi5jaGlsZHJlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRyZW5GaWxlSWQySW5kZXggPSBjb2xsZWN0Q2hpbGRyZW5JbmRleChuZXdOb2RlKTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBwcmVmYWIuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY2hpbGQgJiYgaW5kZXggPCBwcmVmYWIuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGRbJ19wcmVmYWInXSAmJiBjaGlsZHJlbkZpbGVJZDJJbmRleFtjaGlsZFsnX3ByZWZhYiddLmZpbGVJZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlTm9kZShjaGlsZC51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gcHJlZmFiLmNoaWxkcmVuW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkR1bXAgPSBkdW1wVXRpbC5kdW1wTm9kZShwcmVmYWIpIGFzIElOb2RlO1xuXG4gICAgICAgICAgICAgICAgLy8g5Yig6Zmk5LiN5b+F6KaB55qE5a2X5q61XG4gICAgICAgICAgICAgICAgLy8gUHJlZmFiIOmHjOeahCBkdW1wIOS4uuS7gOS5iOmcgOimgeWIoOmZpCB1dWlkXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBkdW1wLnV1aWQ7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBkdW1wLmNoaWxkcmVuO1xuXG4gICAgICAgICAgICAgICAgLy8g5LiN5piv5qC56IqC54K5XG4gICAgICAgICAgICAgICAgaWYgKHByZWZhYlBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBkdW1wLnBhcmVudC52YWx1ZS51dWlkID0gcHJlZmFiUGFyZW50LnV1aWQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5pivIHByZWZhYiDmoLnoioLngrnvvIzmnInkupvlsZ7mgKfkuI3og73ov5jljp9cbiAgICAgICAgICAgICAgICAgICAgZHVtcC5hY3RpdmUudmFsdWUgPSBwcmVmYWJEdW1wLmFjdGl2ZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgZHVtcC5uYW1lLnZhbHVlID0gcHJlZmFiRHVtcC5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBkdW1wLnBvc2l0aW9uLnZhbHVlID0gcHJlZmFiRHVtcC5wb3NpdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgZHVtcC5yb3RhdGlvbi52YWx1ZSA9IHByZWZhYkR1bXAucm90YXRpb24udmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5L2/55So5Y6f5p2l55qE5pWw5o2uXG4gICAgICAgICAgICAgICAgZHVtcC5fX3ByZWZhYl9fID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwcmVmYWJEdW1wLl9fcHJlZmFiX18pKTtcblxuICAgICAgICAgICAgICAgIC8vIOajgOafpeS4gOS6m+WxnuaAp+S4iueahOWAvO+8jOWFtuiKgueCueW8leeUqOaYr+WQpuato+ehrlxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGR1bXAuX19jb21wc19fKSkge1xuICAgICAgICAgICAgICAgICAgICByZWRpcmVjdFNjZW5lUmVmcyhkdW1wLl9fY29tcHNfXyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcHJlZmFiIOS4uueOsOacieeahCBwcmVmYWIg6IqC54K577yM55So5paw5pWw5o2uIGR1bXAg6L+Y5Y6f5YaF6YOo5bGe5oCn5ZKM57uE5Lu255qE5YC8XG4gICAgICAgICAgICAgICAgYXdhaXQgZHVtcFV0aWwucmVzdG9yZU5vZGUocHJlZmFiLCBkdW1wKTtcblxuICAgICAgICAgICAgICAgIC8vIOehruS/neS9jee9ruWHhuehrlxuICAgICAgICAgICAgICAgIGlmIChmaWxlSWQySW5kZXhbZmlsZUlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWZhYi5zZXRTaWJsaW5nSW5kZXgoZmlsZUlkMkluZGV4W2ZpbGVJZF0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOmAkOWxguenu+WKqOWIsOebruagh+iKgueCueS4ilxuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkTm9kZSA9IG5ld05vZGUuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgICAgICAgICAgIHdoaWxlIChjaGlsZE5vZGUgJiYgaW5kZXggPCBuZXdOb2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc01vdmVkID0gYXdhaXQgcmVzdG9yZShjaGlsZE5vZGUsIG5ld05vZGUsIHByZWZhYik7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNNb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGUgPSBuZXdOb2RlLmNoaWxkcmVuW2luZGV4XTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ25vZGU6Y2hhbmdlJywgcHJlZmFiKTtcblxuICAgICAgICAgICAgICAgIC8vIOayoeacieenu+WKqFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOeOsOacieiKgueCueS4jeWtmOWcqO+8jOWImeWwhuS4tOaXtueahCBwcmVmYWIg5LitIGZpbGVJZCDkuIDoh7TnmoToioLngrnnp7vliqjov4fmnaXmm7/mjaJcbiAgICAgICAgICAgIGNvbnN0IG5ld1ByZWZhYiA9IG5ld05vZGVbJ19wcmVmYWInXTtcbiAgICAgICAgICAgIGlmIChuZXdQcmVmYWIgJiYgcHJlZmFiUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdub2RlOmJlZm9yZS1hZGQnLCBuZXdOb2RlKTtcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIHByZWZhYlBhcmVudCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZUlEID0gbmV3UHJlZmFiLmZpbGVJZDtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGZpbGVJZDJJbmRleFtmaWxlSURdO1xuICAgICAgICAgICAgICAgIHByZWZhYlBhcmVudC5pbnNlcnRDaGlsZChuZXdOb2RlLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgbmV3UHJlZmFiLnJvb3QgPSBwcmVmYWJQYXJlbnRbJ19wcmVmYWInXT8ucm9vdDtcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ25vZGU6YWRkJywgbmV3Tm9kZSk7XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdub2RlOmNoYW5nZScsIHByZWZhYlBhcmVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOacieenu+WKqFxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29sbGVjdE9sZE5vZGVzKHByZWZhYlJvb3QpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBsb2FkQW55PFByZWZhYj4oYXNzZXRVdWlkKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGUgPSBjYy5pbnN0YW50aWF0ZShhc3NldCk7XG4gICAgICAgICAgICBwcmVmYWJSb290LnBhcmVudD8uYWRkQ2hpbGQobmV3Tm9kZSk7XG4gICAgICAgICAgICBhd2FpdCByZXN0b3JlKG5ld05vZGUpOyAvLyDpgJDlsYLov5jljp8gcHJlZmFiXG4gICAgICAgICAgICBuZXdOb2RlLnBhcmVudCA9IG51bGw7IC8vIOWIoOmZpOS4tOaXtuiKgueCuVxuXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgcHJlZmFiUm9vdCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1RoZSBwcmVmYWIgYXNzZXQgbm8gbG9uZ2VyIGV4aXN0LicpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDph43mlrDpgInkuK3vvIzmgaLlpI0gZ2l6bW9zIOeKtuaAgVxuICAgICAgICAvLyBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgLy8gICAgIHNlbGVjdGVkVXVpZHMuZm9yRWFjaCgoc2VsZWN0ZWRVdWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgLy8gICAgICAgICBjY2UuU2VsZWN0aW9uLnNlbGVjdChzZWxlY3RlZFV1aWQpO1xuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWZ1bmN0aW9uLXR5cGVcbiAgICBwcml2YXRlIF93YWxrTm9kZShub2RlOiBOb2RlLCBmdW5jOiBGdW5jdGlvbikge1xuICAgICAgICBpZiAobm9kZSAmJiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgZnVuYyhjaGlsZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Fsa05vZGUoY2hpbGQsIGZ1bmMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYmFzZVJlbW92ZU5vZGUobm9kZTogTm9kZSwga2VlcFdvcmxkVHJhbnNmb3JtPzogYm9vbGVhbikge1xuICAgICAgICAvLyDlop7liqDlrrnplJlcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudDtcblxuICAgICAgICAvLyDlj5HpgIHoioLngrnkv67mlLnmtojmga9cbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1yZW1vdmUnLCBub2RlKTtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jb25zb2xlLnRpbWUoJ05vZGVNZ3I6OnJlbW92ZU5vZGUnKTtcbiAgICAgICAgbm9kZS5zZXRQYXJlbnQobnVsbCwga2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgbm9kZS5fb2JqRmxhZ3MgfD0gQ0NPYmplY3QuRmxhZ3MuRGVzdHJveWVkO1xuICAgICAgICAvLyAzLjYuMSDnibnmroogaGFja++8jOivt+WcqOWQjue7reeJiOacrOenu+mZpFxuICAgICAgICAvLyDnm7jlhbPkv67lpI0gcHI6IGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy9jb2Nvcy1lZGl0b3IvcHVsbC84OTBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuX3dhbGtOb2RlKG5vZGUsIChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY2hpbGQuX29iakZsYWdzIHw9IENDT2JqZWN0LkZsYWdzLkRlc3Ryb3llZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vY29uc29sZS50aW1lRW5kKCdOb2RlTWdyOjpyZW1vdmVOb2RlJyk7XG5cbiAgICAgICAgLy8g6KKr5Yig6Zmk6IqC54K56YeM55qE5qC56IqC54K5XG4gICAgICAgIHRoaXMuZW1pdCgnbm9kZTpyZW1vdmUnLCBub2RlLCB7IHNvdXJjZTogRXZlbnRTb3VyY2VUeXBlLkVESVRPUiB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliKDpmaToioLngrlcbiAgICAgKiBAcGFyYW0geyp9IHV1aWRzXG4gICAgICogQHBhcmFtIHsqfSBrZWVwV29ybGRUcmFuc2Zvcm1cbiAgICAgKi9cbiAgICByZW1vdmVOb2RlKHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSwga2VlcFdvcmxkVHJhbnNmb3JtPzogYm9vbGVhbikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICB1dWlkcyA9IHRoaXMuY2FuUmVtb3ZlT3JDb3B5KHV1aWRzKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgdXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGU6IE5vZGUgfCBudWxsID0gdGhpcy5xdWVyeSh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5iYXNlUmVtb3ZlTm9kZShub2RlLCBrZWVwV29ybGRUcmFuc2Zvcm0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6ZSB5a6a5LiA5Liq6IqC54K55LiN6K6p5YW25Zyo5Zy65pmv5Lit6KKr6YCJ5LitXG4gICAgICogQHBhcmFtIHV1aWRzIOiKgueCuXV1aWRcbiAgICAgKiBAcGFyYW0gbG9ja2VkIHRydWUgfCBmYWxzZVxuICAgICAqIEBwYXJhbSBsb29wIHRydWUgfCBmYWxzZSDmmK/lkKblvqrnjq/lrZDlrZnnuqfoioLngrnorr7nva5cbiAgICAgKi9cbiAgICBjaGFuZ2VOb2RlTG9jayh1dWlkczogc3RyaW5nIHwgc3RyaW5nW10sIGxvY2tlZDogYm9vbGVhbiwgbG9vcDogYm9vbGVhbikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgdXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnF1ZXJ5KHV1aWQpO1xuXG4gICAgICAgICAgICAvLyDlop7liqDlrrnplJlcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIG5vZGUpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChsb2NrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5vYmpGbGFncyB8PSBjYy5PYmplY3QuRmxhZ3MuTG9ja2VkSW5FZGl0b3I7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5vYmpGbGFncyAmPSB+Y2MuT2JqZWN0LkZsYWdzLkxvY2tlZEluRWRpdG9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCB7IHR5cGU6IE5vZGVPcGVyYXRpb25UeXBlLlNFVF9QUk9QRVJUWSwgcHJvcFBhdGg6ICdsb2NrZWQnIH0pO1xuXG4gICAgICAgICAgICAvLyDlpITnkIblhoXlvqrnjq/nmoTmg4XlhrVcbiAgICAgICAgICAgIGlmIChsb29wID09PSB0cnVlICYmIG5vZGUuY2hpbGRyZW4gJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTm9kZUxvY2soY2hpbGQudXVpZCwgbG9ja2VkLCBsb29wKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi/h+a7pOagueiKgueCuVxuICAgICAqIOi/h+a7pOWtkOeItuWMheWQq+eahOWFs+ezu++8jOWPqueVmeS4i+W9vOatpOeLrOeri+eahOeItuiKgueCuSB1dWlkXG4gICAgICogQHBhcmFtIHV1aWRzXG4gICAgICovXG4gICAgY2FuUmVtb3ZlT3JDb3B5KHV1aWRzOiBzdHJpbmdbXSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXRoaXMtYWxpYXNcbiAgICAgICAgY29uc3QgdDogYW55ID0gdGhpcztcblxuICAgICAgICBjb25zdCBydDogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAvLyDliZTpmaTmoLnoioLngrnmiJblhbbku5bkuI3lj6/liKDpmaTnmoToioLngrlcbiAgICAgICAgY29uc3Qgbm9kZVV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgdXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0LnF1ZXJ5KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIW5vZGUgfHwgIW5vZGUucGFyZW50IHx8IG5vZGUub2JqRmxhZ3MgJiBjYy5PYmplY3QuRmxhZ3MuRG9udERlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZVV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDliZTpmaTlt7LlnKjliJfooajkuK3lhbbku5boioLngrnnmoTlrZDoioLngrlcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIG5vZGVVdWlkcykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHQucXVlcnkodXVpZCk7XG4gICAgICAgICAgICBpZiAoIWlzQ2hpbGQobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBydC5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaYr+WQpuaYr+W3suWcqOeahOWIl+ihqOS4reWFtuS7luiKgueCueeahOWtkOiKgueCuVxuICAgICAgICAgKiBAcGFyYW0gbm9kZVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaXNDaGlsZChub2RlOiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgICAgIGlmICghbm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChub2RlVXVpZHMuaW5jbHVkZXMobm9kZS5wYXJlbnQudXVpZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzQ2hpbGQobm9kZS5wYXJlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJ0O1xuICAgIH1cblxuICAgIC8vIC8qKlxuICAgIC8vICAqIOiOt+WPluWIm+W7uuiKgueCueaXtuaJgOWcqOeahOeItuiKgueCuVxuICAgIC8vICAqIEBwYXJhbSB1dWlkIOeItuiKgueCuVxuICAgIC8vICAqL1xuICAgIC8vIGdldE5ld05vZGVQYXJlbnQodXVpZDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IE5vZGUge1xuICAgIC8vICAgICBsZXQgcGFyZW50O1xuXG4gICAgLy8gICAgIGlmICh1dWlkKSB7XG4gICAgLy8gICAgICAgICBwYXJlbnQgPSB0aGlzLnF1ZXJ5KHV1aWQpO1xuICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgLyoqXG4gICAgLy8gICAgICAgICAgKiDlpoLmnpzmnInpgInkuK3nmoToioLngrnvvIzpu5jorqTmjILlnKjnrKzkuIDkuKrpgInkuK3oioLngrnph4xcbiAgICAvLyAgICAgICAgICAqIOWmguaenOayoeacie+8jOaMguWcqOWcuuaZr+agueiKgueCuemHjFxuICAgIC8vICAgICAgICAgICovXG4gICAgLy8gICAgICAgICBjb25zdCBzZWxlY3RzID0gY2NlLlNlbGVjdGlvbi5xdWVyeSgpO1xuICAgIC8vICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZWN0cykgJiYgc2VsZWN0c1swXSkge1xuICAgIC8vICAgICAgICAgICAgIHBhcmVudCA9IHRoaXMucXVlcnkoc2VsZWN0c1swXSk7XG4gICAgLy8gICAgICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgICAgIHBhcmVudCA9IGRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBpZiAoIXBhcmVudCkge1xuICAgIC8vICAgICAgICAgcGFyZW50ID0gZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIC8vIOS4jeW6lOivpeaYr05vZGXph4znmoTpgLvovpFcbiAgICAvLyAgICAgY29uc3QgbW9kZSA9IGNjZS5TY2VuZUZhY2FkZU1hbmFnZXIucXVlcnlNb2RlKCk7XG4gICAgLy8gICAgIGlmIChtb2RlID09PSAncHJlZmFiJykge1xuICAgIC8vICAgICAgICAgY29uc3QgcHJlZmFiUHJveHkgPSBjY2UuU2NlbmVGYWNhZGVNYW5hZ2VyWydfZmFjYWRlRlNNJ10ucHJlZmFiU2NlbmVGYWNhZGVbJ19zY2VuZVByb3h5J107XG4gICAgLy8gICAgICAgICBjb25zdCBwcmVmYWJSb290ID0gcHJlZmFiUHJveHkuZ2V0Um9vdE5vZGUoKTtcblxuICAgIC8vICAgICAgICAgLy8gcHJlZmFiIOeahOWcuuaZr+iKgueCueaYr+S4tOaXtueahOagueiKgueCue+8jOmcgOi9rOS4uiBwcmVmYWIgcm9vdCBub2RlXG4gICAgLy8gICAgICAgICBpZiAocGFyZW50ID09PSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpKSB7XG4gICAgLy8gICAgICAgICAgICAgcGFyZW50ID0gcHJlZmFiUm9vdDtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vICAgICByZXR1cm4gcGFyZW50IGFzIE5vZGU7XG4gICAgLy8gfVxuXG4gICAgLy8gY2hhbmdlTm9kZVVVSUQob2xkVVVJRDogc3RyaW5nIHwgdW5kZWZpbmVkLCBuZXdVVUlEOiBzdHJpbmcgfCB1bmRlZmluZWQpIHtcbiAgICAvLyAgICAgaWYgKCFvbGRVVUlEIHx8ICFuZXdVVUlEKSB7XG4gICAgLy8gICAgICAgICByZXR1cm47XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBOb2RlTWdyLmNoYW5nZU5vZGVVVUlEKG9sZFVVSUQsIG5ld1VVSUQpO1xuICAgIC8vIH1cblxuICAgIGFkZENvbXBvbmVudEF0KG5vZGU6IE5vZGUsIGNvbXA6IENvbXBvbmVudCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoIW5vZGUgfHwgIWNvbXAgfHwgaW5kZXggPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcCBpbnN0YW5jZW9mIE1pc3NpbmdTY3JpcHQgJiYgIWNvbXAuXyRlcmlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgbm9kZS5fYWRkQ29tcG9uZW50QXQoY29tcCwgaW5kZXgpO1xuICAgICAgICBjb21wTWdyLmVtaXQoJ2NvbXBvbmVudDphZGQnLCBjb21wKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5cbmNvbnN0IG5vZGVNYW5hZ2VyID0gbmV3IE5vZGVNYW5hZ2VyKCk7XG5cbnJlZ2lzdGVyRHVtcE5vZGVBY2Nlc3Moe1xuICAgIHF1ZXJ5OiBub2RlTWFuYWdlci5xdWVyeS5iaW5kKG5vZGVNYW5hZ2VyKSxcbiAgICBhZGRDb21wb25lbnRBdDogbm9kZU1hbmFnZXIuYWRkQ29tcG9uZW50QXQuYmluZChub2RlTWFuYWdlciksXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgbm9kZU1hbmFnZXI7XG4iXX0=