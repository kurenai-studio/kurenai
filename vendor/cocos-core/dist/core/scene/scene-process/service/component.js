"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentService = void 0;
const cc_1 = require("cc");
const rpc_1 = require("../rpc");
const core_1 = require("./core");
const common_1 = require("../../common");
const dump_1 = __importDefault(require("./dump"));
const index_1 = __importDefault(require("./component/index"));
const utils_1 = __importDefault(require("./component/utils"));
const get_component_function_of_node_1 = __importDefault(require("./component/get-component-function-of-node"));
const node_utils_1 = require("./node/node-utils");
const node_utils_2 = require("./node/node-utils");
const node_create_1 = require("./node/node-create");
const prefab_1 = __importDefault(require("./prefab"));
const snapshot_command_1 = require("./undo/commands/snapshot-command");
const add_component_command_1 = require("./undo/commands/add-component-command");
const remove_component_command_1 = require("./undo/commands/remove-component-command");
const command_utils_shared_1 = require("./undo/commands/command-utils-shared");
const applying_state_1 = require("./undo/applying-state");
const property_commit_event_1 = require("./animation/property-commit-event");
const path_utils_1 = require("../../../engine/editor-extends/manager/path-utils");
const lod_group_1 = require("./component/lod-group");
const polygon_collider_2d_1 = require("./component/polygon-collider-2d");
const NodeMgr = EditorExtends.Node;
function resolveNodeByPath(nodePath) {
    // '/' 指当前编辑器的根：prefab 模式下是 prefab 根节点（可以挂组件），而不是承载它的虚拟场景
    if ((0, path_utils_1.isRootNodePath)(nodePath)) {
        return core_1.Service.Editor.getRootNode();
    }
    return NodeMgr.getNodeByPath(nodePath);
}
var SceneModeType;
(function (SceneModeType) {
    SceneModeType["General"] = "general";
    SceneModeType["Prefab"] = "prefab";
    SceneModeType["Animation"] = "animation";
    SceneModeType["Preview"] = "preview";
    SceneModeType["Unset"] = "";
})(SceneModeType || (SceneModeType = {}));
/**
 * 子进程节点处理器
 * 在子进程中处理所有节点相关操作
 */
let ComponentService = class ComponentService extends core_1.BaseService {
    modeName = SceneModeType.General;
    // private _stagingCameraInfo: any;
    _sceneEventListener = [];
    /**
     * 查询当前正在编辑的模式名字
     */
    queryMode() {
        return this.modeName;
    }
    onAddComponent(comp, opts = {}) {
        opts.modeName = this.modeName;
        // TODO(qgh): 发送消息
        //this.dispatchEvents('onAddComponent', comp, opts);
    }
    onRemoveComponent(comp, opts = {}) {
        opts.modeName = this.modeName;
        // TODO(qgh): 发送消息
        //this.dispatchEvents('onRemoveComponent', comp, opts);
        // 编辑器中的this._sceneProxy.getRootNode()实现返回的是null
        prefab_1.default.onRemoveComponentInGeneralMode(comp, null);
        //this._prefabMgr.onRemoveComponentInGeneralMode(comp, this._sceneProxy.getRootNode());
    }
    onComponentAdded(comp, opts = {}) {
        opts.modeName = this.modeName;
        // TODO(qgh): 发送消息
        //this.dispatchEvents('onComponentAdded', comp, opts);
        index_1.default.addRecycleComponent(comp.uuid);
    }
    onComponentRemoved(comp, opts = {}) {
        opts.modeName = this.modeName;
        // TODO(qgh): 发送消息
        // this.dispatchEvents('onComponentRemoved', comp);
        // 编辑器中的this._sceneProxy.getRootNode()实现返回的是null
        prefab_1.default.onComponentRemovedInGeneralMode(comp, null);
        index_1.default.removeRecycleComponent(comp.uuid, comp);
    }
    dispatchEvents(eventName, ...args) {
        this._sceneEventListener.forEach((listener) => {
            if (listener && listener[eventName]) {
                // @ts-ignore
                listener[eventName].apply(listener, args);
            }
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    requireComponentList = [];
    async resolveComponentCtor(component) {
        if (component === 'MissingScript' || component === 'cc.MissingScript') {
            throw new Error('MissingScript does not exist');
        }
        const isURL = component.startsWith('db://');
        const isUuid = utils_1.default.isUUID(component);
        let resolvedName = component;
        let uuid;
        if (isUuid) {
            uuid = component;
        }
        else if (isURL) {
            uuid = await rpc_1.Rpc.getInstance().request('assetManager', 'queryUUID', [component]);
        }
        let ctor = null;
        if (uuid) {
            const cid = await core_1.Service.Script.queryScriptCid(uuid);
            if (cid && cid !== 'MissingScript' && cid !== 'cc.MissingScript') {
                resolvedName = cid;
                ctor = cc.js.getClassById(cid) || cc.js.getClassByName(cid);
                if (!ctor) {
                    throw new Error(`Component script(${cid}) name exists but constructor does not exist.`);
                }
            }
            else {
                const assetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [uuid]);
                if (assetInfo?.file && assetInfo?.file.length > 0) {
                    throw new Error(`Check if the script(${uuid}) contains any errors.`);
                }
            }
        }
        else {
            ctor = cc.js.getClassById(resolvedName) || cc.js.getClassByName(resolvedName);
        }
        if (!ctor) {
            const isStartWithUppercase = resolvedName.charAt(0) === resolvedName.charAt(0).toUpperCase();
            if (!isStartWithUppercase) {
                ctor = cc.js.getClassByName(resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1));
            }
            if (!ctor && !isUuid && !isURL) {
                if (!resolvedName.startsWith('cc.')) {
                    ctor = cc.js.getClassByName('cc.' + resolvedName);
                    if (!ctor && !isStartWithUppercase) {
                        ctor = cc.js.getClassByName('cc.' + resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1));
                    }
                }
                else if (resolvedName.length > 3 && resolvedName.charAt(3) !== resolvedName.charAt(3).toUpperCase()) {
                    ctor = cc.js.getClassByName(resolvedName.slice(0, 3) + resolvedName.charAt(3).toUpperCase() + resolvedName.slice(4));
                }
            }
        }
        if (!ctor) {
            if (isUuid) {
                throw new Error(`Target Component('${resolvedName}') Not Found. Hint: Please use the correct component uuid`);
            }
            else if (isURL) {
                throw new Error(`Target Component('${resolvedName}') Not Found. Hint: Please use the correct component url`);
            }
            else {
                throw new Error(`Target Component('${resolvedName}') Not Found. Hint: Please use the correct component name`);
            }
        }
        if (!cc.js.isChildClassOf(ctor, cc_1.Component)) {
            throw new Error(`Constructor has been found, but it is not component-based.`);
        }
        return ctor;
    }
    async add(params) {
        try {
            await core_1.Service.Editor.lock();
            if (Array.isArray(params.component)) {
                let lastDump = null;
                for (const id of params.component) {
                    lastDump = await this.add({ nodePath: params.nodePath, component: id });
                }
                return lastDump;
            }
            const node = resolveNodeByPath(params.nodePath);
            if (!node) {
                throw new Error(`create component failed: ${params.nodePath} does not exist`);
            }
            if (node instanceof cc_1.Scene) {
                throw new Error(`create component failed: cannot attach a component to the scene root (${params.nodePath})`);
            }
            if (!params.component || params.component.length <= 0) {
                throw new Error(`create component failed: component name cannot be empty`);
            }
            const ctor = await this.resolveComponentCtor(params.component);
            this.emit('node:before-change', node);
            this.emit('component:before-add-component', params.component, node);
            // 处理 requireComponent 依赖链
            let iterateObj = ctor;
            if (iterateObj._requireComponent) {
                while (iterateObj._requireComponent) {
                    this.requireComponentList.push(iterateObj._requireComponent);
                    iterateObj = iterateObj._requireComponent;
                }
            }
            const componentUuidsBeforeAdd = new Set(node.components.map(component => component.uuid));
            const comp = node.addComponent(ctor);
            this.requireComponentList = [];
            const addedComponents = node.components.filter(component => !componentUuidsBeforeAdd.has(component.uuid));
            // prefab 模式下的 Canvas 创建
            const mode = this.queryMode();
            if (mode === 'prefab') {
                const rootNode = core_1.Service.Editor.getRootNode();
                if (rootNode && (0, node_utils_1.hasOneKindOfComponent)(node, cc_1.UITransform) && !(0, node_utils_1.hasOneKindOfComponent)(rootNode, cc_1.Canvas)) {
                    (0, node_create_1.createShouldHideInHierarchyCanvasNode)(cc_1.director.getScene()).then((target) => {
                        rootNode.parent = target;
                    });
                }
            }
            this.checkComponentsCollision(node);
            this.checkDynamicBodyShape(node);
            index_1.default.onComponentAddedFromEditor(comp);
            if (comp instanceof cc_1.PolygonCollider2D) {
                await (0, polygon_collider_2d_1.initializePolygonCollider2DPoints)(comp);
            }
            this.emit('node:change', node, { type: common_1.NodeEventType.CREATE_COMPONENT });
            const dump = dump_1.default.dumpComponent(comp);
            if (this._shouldRecordComponentCommand()) {
                const command = add_component_command_1.AddComponentCommand.captureMany(addedComponents);
                if (command) {
                    core_1.Service.Undo?.push(command);
                }
            }
            return dump;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async checkComponentsCollision(node) {
        if ((0, node_utils_1.hasOneKindOfComponent)(node, cc_1.animation.AnimationController) && (0, node_utils_1.hasOneKindOfComponent)(node, cc_1.Animation)) {
            console.warn('scene.contributions.messages.description.animationComponentCollision');
        }
    }
    checkDynamicBodyShape(ndoe) {
        if ((0, node_utils_1.hasOneKindOfComponent)(ndoe, cc_1.RigidBody) && (0, node_utils_1.hasOneKindOfComponent)(ndoe, cc_1.Collider)) {
            // get the rigid body component
            const body = ndoe.getComponent(cc_1.RigidBody);
            if (!body) {
                return;
            }
            // get the collider
            const collider = ndoe.getComponent(cc_1.Collider);
            if (body.type === cc_1.ERigidBodyType.DYNAMIC) {
                switch (collider?.type) {
                    case cc_1.EColliderType.PLANE:
                    case cc_1.EColliderType.TERRAIN:
                        console.warn('scene.contributions.messages.description.physicsDynamicBodyShape');
                        break;
                    case cc_1.EColliderType.MESH:
                        if (!collider.convex) {
                            console.warn('scene.contributions.messages.description.physicsDynamicBodyShape');
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }
    /**
     * 通过 path 查找组件实例，支持路径、UUID 或 URL
     */
    async findComponent(path) {
        const isUuid = utils_1.default.isUUID(path);
        const isURL = path.startsWith('db://');
        if (isUuid) {
            return index_1.default.query(path);
        }
        else if (isURL) {
            const uuid = await rpc_1.Rpc.getInstance().request('assetManager', 'queryUUID', [path]);
            if (uuid) {
                return index_1.default.query(uuid);
            }
            return null;
        }
        else {
            return index_1.default.queryFromPath(path);
        }
    }
    async remove(params) {
        try {
            await core_1.Service.Editor.lock();
            const comp = await this.findComponent(params.path);
            if (!comp) {
                throw new Error(`Remove component failed: ${params.path} does not exist`);
            }
            const command = this._shouldRecordComponentCommand()
                ? remove_component_command_1.RemoveComponentCommand.capture(comp)
                : null;
            const result = index_1.default.removeComponent(comp);
            if (result && command) {
                core_1.Service.Undo?.push(command);
            }
            return result;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async queryImpl(params) {
        const comp = await this.findComponent(params.path);
        if (!comp) {
            console.warn(`Query component failed: ${params.path} does not exist`);
            return null;
        }
        return dump_1.default.dumpComponent(comp);
    }
    async query(params) {
        if (typeof params === 'string') {
            return this.queryImpl({ path: params });
        }
        else {
            return this.queryImpl(params);
        }
    }
    async regeneratePolygon2DPoints(options) {
        const path = options.path;
        try {
            await core_1.Service.Editor.lock();
            const component = await this.findComponent(path);
            const collider = (0, polygon_collider_2d_1.requirePolygonCollider2D)(component, path);
            const generated = await (0, polygon_collider_2d_1.generatePolygonPoints)(collider);
            (0, polygon_collider_2d_1.validatePolygonPoints)(generated.points);
            if ((0, polygon_collider_2d_1.arePolygonPointsEqual)(collider.points, generated.points)) {
                return {
                    path,
                    changed: false,
                    pointCount: generated.points.length,
                    source: generated.source,
                };
            }
            const componentIndex = collider.node.components.indexOf(collider);
            if (componentIndex < 0) {
                throw new Error('PolygonCollider2D is no longer attached to its node.');
            }
            const componentDump = dump_1.default.dumpComponent(collider);
            const pointsDump = (0, polygon_collider_2d_1.createPolygonPointsPropertyDump)(componentDump.value?.points, generated.points);
            if (!pointsDump) {
                throw new Error('Unable to encode PolygonCollider2D.points from the component dump.');
            }
            const nodePath = NodeMgr.getNodePath(collider.node)
                || (collider.node === core_1.Service.Editor.getRootNode() ? '/' : '');
            if (!nodePath) {
                throw new Error('Unable to resolve the PolygonCollider2D node path.');
            }
            const committed = await this.setProperty({
                nodePath,
                path: `__comps__.${componentIndex}.points`,
                dump: pointsDump,
                record: options.record,
            });
            if (!committed) {
                throw new Error('Failed to commit PolygonCollider2D.points through ComponentService.setProperty().');
            }
            return {
                path,
                changed: true,
                pointCount: generated.points.length,
                source: generated.source,
            };
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async setProperty(options) {
        // 多个节点更新值
        if (Array.isArray(options.nodePath)) {
            // 仅当需要记录 undo 且当前没有更外层 group 时，用 group 包裹，
            // 使多节点的修改成为一次可整体撤销的复合命令
            const useGroup = options.record !== false &&
                !core_1.Service.Undo?.isApplying?.() &&
                !core_1.Service.Undo?.isGroupActive?.();
            const groupId = useGroup ? core_1.Service.Undo?.beginGroup?.({ label: `Set ${options.path}` }) : undefined;
            try {
                for (let i = 0; i < options.nodePath.length; i++) {
                    await this.setProperty({ nodePath: options.nodePath[i], path: options.path, dump: options.dump, record: options?.record });
                }
                if (groupId) {
                    core_1.Service.Undo?.endGroup?.(groupId);
                }
                return true;
            }
            catch (e) {
                console.error(e);
                if (groupId) {
                    core_1.Service.Undo?.cancelGroup?.(groupId);
                }
                return false;
            }
        }
        const node = resolveNodeByPath(options.nodePath);
        if (!node) {
            console.warn(`Set property failed: ${options.nodePath} does not exist`);
            return false;
        }
        const result = await this._recordComponentPropertySnapshot(node, {
            label: `Set ${options.path}`,
            type: 'component:set-property',
            nodePath: options.nodePath,
            path: options.path,
            record: options.record,
        }, async () => {
            // 触发修改前的事件
            this.emit('node:before-change', node);
            if (options.path === 'parent' && node.parent) {
                // 发送节点修改消息
                this.emit('node:before-change', node.parent);
            }
            // 恢复数据
            try {
                await dump_1.default.restoreProperty(node, options.path, options.dump);
            }
            catch (e) {
                console.error(e);
                return false;
            }
            // 触发修改后的事件
            this.emit('node:change', node, { type: common_1.NodeEventType.SET_PROPERTY, propPath: options.path, record: options.record });
            // 如果是数组的话，需要依次 emit change，路径定位到数组的下标位置
            if (options.dump.isArray && Array.isArray(options.dump.value)) {
                options.dump.value.forEach((item, i) => {
                    this.emit('node:change', node, { type: common_1.NodeEventType.SET_PROPERTY, propPath: `${options.path}.${i}`, record: options.record });
                });
            }
            // 改变父子关系
            if (options.path === 'parent' && node.parent) {
                // 发送节点修改消息
                this.emit('node:change', node.parent, { type: common_1.NodeEventType.SET_PROPERTY, propPath: 'children', record: options.record });
            }
            return true;
        });
        if (result && options.record !== false && !(0, applying_state_1.isUndoApplying)()) {
            (0, property_commit_event_1.broadcastAnimationPropertyCommitted)({
                nodePath: options.nodePath,
                propPath: options.path,
                source: 'editor',
            });
        }
        return result;
    }
    _shouldRecordComponentCommand() {
        return !core_1.Service.Undo?.isApplying?.();
    }
    async _recordComponentSnapshot(component, options, mutate) {
        if (options.record === false ||
            core_1.Service.Undo?.isApplying?.() ||
            core_1.Service.Undo?.hasActiveRecording?.(component.node.uuid) ||
            core_1.Service.Undo?.hasActiveRecording?.(component.uuid)) {
            return mutate();
        }
        const snapshotPath = options.path ?? options.type;
        const before = this._captureComponentSnapshot(component, snapshotPath);
        const result = await mutate();
        if (!result) {
            return result;
        }
        const beforeSnapshot = [...before.values()][0];
        if (!beforeSnapshot) {
            return result;
        }
        const latestComponent = this._findSnapshotComponent(beforeSnapshot);
        if (!latestComponent) {
            return result;
        }
        const after = this._captureComponentSnapshot(latestComponent, snapshotPath);
        if (this._snapshotMapsEqual(before, after)) {
            return result;
        }
        core_1.Service.Undo?.push(new snapshot_command_1.SnapshotCommand({
            id: this._createUndoSnapshotId(options.type),
            label: options.label,
            type: options.type,
            scope: { editorType: 'scene' },
            timestamp: Date.now(),
        }, before, after, this._createComponentPropertySnapshotAdapter()));
        return result;
    }
    async _recordComponentPropertySnapshot(node, options, mutate) {
        if (options.record === false || core_1.Service.Undo?.isApplying?.()) {
            return mutate();
        }
        const target = this._resolveComponentPropertyTarget(node, options.path);
        if (core_1.Service.Undo?.hasActiveRecording?.(node.uuid) ||
            (target && core_1.Service.Undo?.hasActiveRecording?.(target.component.uuid))) {
            return mutate();
        }
        const before = this._captureComponentPropertySnapshot(node, options.path);
        const result = await mutate();
        if (!result) {
            return result;
        }
        const latestNode = NodeMgr.getNode(node.uuid);
        if (!latestNode) {
            return result;
        }
        const after = this._captureComponentPropertySnapshot(latestNode, options.path);
        if (this._snapshotMapsEqual(before, after)) {
            return result;
        }
        core_1.Service.Undo?.push(new snapshot_command_1.SnapshotCommand({
            id: this._createUndoSnapshotId(options.type),
            label: options.label,
            type: options.type,
            scope: {
                editorType: 'scene',
                nodePath: options.nodePath,
                propPath: this._createComponentAnimationPropPath(node, options.path),
            },
            timestamp: Date.now(),
        }, before, after, this._createComponentPropertySnapshotAdapter()));
        return result;
    }
    _captureComponentSnapshot(component, path) {
        const snapshots = new Map();
        if (!component?.isValid || !component.node?.isValid) {
            return snapshots;
        }
        snapshots.set(component.uuid, {
            nodeUuid: component.node.uuid,
            nodePath: NodeMgr.getNodePath(component.node) ?? '',
            componentUuid: component.uuid,
            componentPath: index_1.default.getPathFromUuid(component.uuid) ?? '',
            componentIndex: component.node.components.indexOf(component),
            componentType: this._getComponentType(component),
            path,
            dump: this._cloneSnapshotDump(dump_1.default.dumpComponent(component)),
        });
        return snapshots;
    }
    _captureComponentPropertySnapshot(node, path) {
        const snapshots = new Map();
        if (!node?.isValid) {
            return snapshots;
        }
        try {
            const target = this._resolveComponentPropertyTarget(node, path);
            if (!target) {
                return snapshots;
            }
            snapshots.set(`${target.component.uuid}:${path}`, {
                nodeUuid: node.uuid,
                nodePath: NodeMgr.getNodePath(node) ?? '',
                componentUuid: target.component.uuid,
                componentPath: index_1.default.getPathFromUuid(target.component.uuid) ?? '',
                componentIndex: target.index,
                componentType: this._getComponentType(target.component),
                path,
                dump: this._cloneSnapshotDump(dump_1.default.dumpComponent(target.component)),
            });
        }
        catch (error) {
            // 捕获失败则该次修改不会进 undo 栈：记录 warn 以便排查（fail loud）
            console.warn(`[Undo] capture component property snapshot failed for "${path}":`, error);
        }
        return snapshots;
    }
    _createComponentPropertySnapshotAdapter() {
        return {
            capture: async () => new Map(),
            apply: async (data) => this._applyComponentPropertySnapshots(data),
            equals: (before, after) => this._snapshotMapsEqual(before, after),
        };
    }
    async _applyComponentPropertySnapshots(data) {
        try {
            for (const snapshot of data.values()) {
                const component = this._findSnapshotComponent(snapshot);
                if (!component) {
                    return { success: false, reason: `Component not found: ${snapshot.componentPath || snapshot.componentUuid}` };
                }
                await this._restoreComponentSnapshotDump(component, snapshot.dump);
                this.emit('node:change', component.node, {
                    type: common_1.NodeEventType.SET_PROPERTY,
                    propPath: snapshot.path,
                    source: 'undo',
                });
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, reason: error instanceof Error ? error.message : String(error) };
        }
    }
    _resolveComponentPropertyTarget(node, path) {
        const match = /^__comps__\.(\d+)(?:\.|$)/.exec(path);
        if (!match) {
            return null;
        }
        const index = Number(match[1]);
        const component = node.components[index];
        if (!component?.isValid) {
            return null;
        }
        return { component, index };
    }
    _createComponentAnimationPropPath(node, path) {
        const target = this._resolveComponentPropertyTarget(node, path);
        const propName = path.replace(/^__comps__\.\d+\.?/, '');
        const componentType = target ? this._getComponentType(target.component) : '';
        if (!target || !propName || !componentType) {
            return path;
        }
        return `${componentType}.${propName}`;
    }
    _findSnapshotComponent(snapshot) {
        const byUuid = index_1.default.query(snapshot.componentUuid);
        if (byUuid?.isValid && byUuid.node?.isValid) {
            return byUuid;
        }
        if (snapshot.componentPath) {
            try {
                const byPath = index_1.default.queryFromPath(snapshot.componentPath);
                if (byPath?.isValid && byPath.node?.isValid) {
                    return byPath;
                }
            }
            catch (_error) {
                // Fall back to the captured node/index below.
            }
        }
        const node = this._findSnapshotNode(snapshot);
        const byIndex = node?.components[snapshot.componentIndex];
        if (byIndex?.isValid && this._getComponentType(byIndex) === snapshot.componentType) {
            return byIndex;
        }
        return null;
    }
    _findSnapshotNode(snapshot) {
        const byUuid = NodeMgr.getNode(snapshot.nodeUuid);
        if (byUuid?.isValid) {
            return byUuid;
        }
        if (!snapshot.nodePath) {
            return null;
        }
        try {
            const byPath = NodeMgr.getNodeByPath(snapshot.nodePath);
            return byPath?.isValid ? byPath : null;
        }
        catch (_error) {
            return null;
        }
    }
    _snapshotMapsEqual(before, after) {
        return (0, command_utils_shared_1.snapshotMapsEqual)(before, after);
    }
    _cloneSnapshotDump(dump) {
        return JSON.parse(JSON.stringify(dump));
    }
    async _restoreComponentSnapshotDump(component, dump) {
        await (0, command_utils_shared_1.restoreComponentSnapshotDump)(component, dump);
    }
    _getComponentType(component) {
        return cc.js?.getClassName?.(component.constructor) || component.constructor?.name || '';
    }
    _createUndoSnapshotId(type) {
        return (0, command_utils_shared_1.createUndoId)(type);
    }
    /**
     * 查询一个节点的实例
     * @param {*} uuid
     * @return {cc.Node}
     */
    queryNode(uuid) {
        if (typeof uuid === 'undefined') {
            return null;
        }
        // TODO(qgh): nodeMgr应该添加queryRecycleNode
        // return NodeMgr.getNode(uuid) ?? NodeMgr.queryRecycleNode(uuid);
        return NodeMgr.getNode(uuid);
    }
    async queryAll() {
        const keys = Object.keys(cc.js._registeredClassNames);
        const components = [];
        keys.forEach((key) => {
            try {
                const cclass = new cc.js._registeredClassNames[key];
                if (cclass instanceof cc.Component) {
                    components.push(cc.js.getClassName(cclass));
                }
            }
            catch (e) { }
        });
        return components;
    }
    async hasScript(name) {
        const classes = await this.queryClasses();
        return classes.some((cls) => cls.name === name);
    }
    async queryClasses(options) {
        const classes = [];
        for (const name in cc.js._registeredClassNames) {
            if (options) {
                if (typeof options.extends === 'string') {
                    options.extends = [options.extends];
                }
                const subClass = cc.js._registeredClassNames[name];
                if (Array.isArray(options.extends) &&
                    options.extends.some((extend) => {
                        const superClass = cc.js.getClassByName(extend);
                        const isChildOrSelf = cc.js.isChildClassOf(subClass, superClass);
                        if (options.excludeSelf) {
                            return isChildOrSelf && superClass !== subClass;
                        }
                        return isChildOrSelf;
                    })) {
                    classes.push({ name });
                }
            }
            else {
                classes.push({ name });
            }
        }
        return classes;
    }
    async queryFunctionOfNode(path) {
        const node = resolveNodeByPath(path);
        if (!node) {
            return {};
        }
        return (0, get_component_function_of_node_1.default)(node);
    }
    async queryComponents() {
        // TODO: 需要根据 settings/cocos.config.json 的 include modules 是否包含 3d 做过滤
        // 参考 app/builtin/scene/source/script/3d/manager/scene/scene-manager.ts
        const menus = EditorExtends.Component.getMenus();
        if (menus.length > 0) {
            return menus.map((item) => ({
                name: cc.js.getClassName(item.component),
                cid: cc.js.getClassId(item.component),
                path: item.menuPath,
            }));
        }
        // TODO: 这个是兜底的，等 EditorExtends.Component.getMenus() 完全实现了之后就可以删除了
        const classes = await this.queryClasses({ extends: 'cc.Component', excludeSelf: true });
        return classes.map(cls => ({
            name: cls.name,
            cid: '',
            path: cls.name,
        }));
    }
    init() {
        this.registerCompMgrEvents();
    }
    CompMgrEventHandlers = {
        ['add']: 'onCompAdd',
        ['remove']: 'onCompRemove',
    };
    compMgrEventHandlers = new Map();
    /**
     * 注册引擎 Node 管理相关事件的监听
     */
    registerCompMgrEvents() {
        this.unregisterCompMgrEvents();
        Object.entries(this.CompMgrEventHandlers).forEach(([eventType, handlerName]) => {
            const handler = this[handlerName].bind(this);
            EditorExtends.Component.on(eventType, handler);
            this.compMgrEventHandlers.set(eventType, handler);
        });
    }
    unregisterCompMgrEvents() {
        Object.keys(this.CompMgrEventHandlers).forEach(eventType => {
            const handler = this.compMgrEventHandlers.get(eventType);
            if (handler) {
                EditorExtends.Component.off(eventType, handler);
                this.compMgrEventHandlers.delete(eventType);
            }
        });
    }
    /**
     * 添加到组件缓存
     * @param {String} uuid
     * @param {cc.Component} component
     */
    onCompAdd(uuid, component) {
        if ((0, node_utils_2.isEditorNode)(component.node)) {
            return;
        }
        this.emit('component:added', component);
    }
    /**
     * 移除组件缓存
     * @param {String} uuid
     * @param {cc.Component} component
     */
    onCompRemove(uuid, component) {
        if ((0, node_utils_2.isEditorNode)(component.node)) {
            return;
        }
        this.emit('component:removed', component);
    }
    /**
     * 重置组件
     * @param uuid component 的 uuid
     */
    async reset(params) {
        try {
            const comp = await this.findComponent(params.path);
            if (!comp) {
                console.warn(`Reset Component failed: ${params.path} does not exist`);
                return false;
            }
            return this._recordComponentSnapshot(comp, {
                label: 'Reset Component',
                type: 'component:reset',
            }, async () => {
                this.emit('node:before-change', comp.node);
                const result = await index_1.default.resetComponent(comp);
                this.emit('node:change', comp.node, { type: common_1.NodeEventType.RESET_COMPONENT });
                return result;
            });
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }
    async recalculateLODGroupBounds(options) {
        const comp = (0, lod_group_1.requireLODGroup)(await this.findComponent(options.path), options.path);
        const componentIndex = comp.node.components.indexOf(comp);
        await this._recordComponentSnapshot(comp, {
            label: 'Recalculate LODGroup Bounds',
            type: 'component:recalculate-lod-group-bounds',
            path: componentIndex >= 0 ? `__comps__.${componentIndex}` : undefined,
            record: options.record,
        }, async () => {
            comp.recalculateBounds();
            return true;
        });
        return (0, lod_group_1.serializeLODGroupBounds)(comp);
    }
    async insertLOD(options) {
        const comp = (0, lod_group_1.requireLODGroup)(await this.findComponent(options.path), options.path);
        (0, lod_group_1.validateLODInsert)(comp, options.index, options.screenUsagePercentage);
        const componentIndex = comp.node.components.indexOf(comp);
        await this._recordComponentSnapshot(comp, {
            label: 'Insert LOD',
            type: 'component:insert-lod',
            path: componentIndex >= 0 ? `__comps__.${componentIndex}` : undefined,
            record: options.record,
        }, async () => {
            comp.insertLOD(options.index, options.screenUsagePercentage);
            return true;
        });
        return (0, lod_group_1.serializeLODGroupLevels)(comp);
    }
    async eraseLOD(options) {
        const comp = (0, lod_group_1.requireLODGroup)(await this.findComponent(options.path), options.path);
        (0, lod_group_1.validateLODErase)(comp, options.index);
        const componentIndex = comp.node.components.indexOf(comp);
        await this._recordComponentSnapshot(comp, {
            label: 'Erase LOD',
            type: 'component:erase-lod',
            path: componentIndex >= 0 ? `__comps__.${componentIndex}` : undefined,
            record: options.record,
        }, async () => {
            comp.eraseLOD(options.index);
            return true;
        });
        return (0, lod_group_1.serializeLODGroupLevels)(comp);
    }
    async queryLODGroupRelativeHeight(options) {
        const comp = (0, lod_group_1.requireLODGroup)(await this.findComponent(options.path), options.path);
        // ICameraService 仅声明公开能力；场景进程实现额外提供编辑器 Camera 组件。
        const editorCamera = core_1.Service.Camera.getCamera?.();
        const renderCamera = editorCamera?.camera;
        if (!renderCamera) {
            throw new Error('Editor camera is not ready');
        }
        try {
            return (0, lod_group_1.queryLODGroupRelativeHeight)(comp, renderCamera);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`${error.message}: ${options.path}`);
            }
            throw error;
        }
    }
    async executeMethod(options) {
        const comp = index_1.default.queryFromPath(options.path);
        if (!comp) {
            return null;
        }
        return await index_1.default.executeComponentMethod(comp.uuid, options.name, options.args);
    }
    getPathByUuid(uuid) {
        return index_1.default.getPathFromUuid(uuid);
    }
};
exports.ComponentService = ComponentService;
exports.ComponentService = ComponentService = __decorate([
    (0, core_1.register)('Component')
], ComponentService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2NvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQkFBbU07QUFDbk0sZ0NBQTZCO0FBQzdCLGlDQUF3RDtBQUN4RCx5Q0FvQnNCO0FBQ3RCLGtEQUE4QjtBQUM5Qiw4REFBd0M7QUFDeEMsOERBQStDO0FBQy9DLGdIQUFvRjtBQUNwRixrREFBMEQ7QUFDMUQsa0RBQWlEO0FBQ2pELG9EQUEyRTtBQUMzRSxzREFBcUM7QUFDckMsdUVBQTBGO0FBQzFGLGlGQUE0RTtBQUM1RSx1RkFBa0Y7QUFDbEYsK0VBQXFIO0FBQ3JILDBEQUF1RDtBQUN2RCw2RUFBd0Y7QUFDeEYsa0ZBQW1GO0FBQ25GLHFEQU8rQjtBQUMvQix5RUFPeUM7QUFFekMsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQztBQUVuQyxTQUFTLGlCQUFpQixDQUFDLFFBQWdCO0lBQ3ZDLHlEQUF5RDtJQUN6RCxJQUFJLElBQUEsMkJBQWMsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQzNCLE9BQU8sY0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQWlCLENBQUM7SUFDdkQsQ0FBQztJQUNELE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQWdCLENBQUM7QUFDMUQsQ0FBQztBQWtCRCxJQUFLLGFBTUo7QUFORCxXQUFLLGFBQWE7SUFDZCxvQ0FBbUIsQ0FBQTtJQUNuQixrQ0FBaUIsQ0FBQTtJQUNqQix3Q0FBdUIsQ0FBQTtJQUN2QixvQ0FBbUIsQ0FBQTtJQUNuQiwyQkFBVSxDQUFBO0FBQ2QsQ0FBQyxFQU5JLGFBQWEsS0FBYixhQUFhLFFBTWpCO0FBaUJEOzs7R0FHRztBQUVJLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsa0JBQTZCO0lB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QUNELE9BQU8sTUFBTSxlQUFPLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRU0sYUFBYSxDQUFDLElBQVk7UUFDN0IsT0FBTyxlQUFPLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pDLENBQUM7Q0FDSixDQUFBO0FBdjhCWSw0Q0FBZ0I7MkJBQWhCLGdCQUFnQjtJQUQ1QixJQUFBLGVBQVEsRUFBQyxXQUFXLENBQUM7R0FDVCxnQkFBZ0IsQ0F1OEI1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgQ29uc3RydWN0b3IsIGFuaW1hdGlvbiwgQW5pbWF0aW9uLCBOb2RlLCBSaWdpZEJvZHksIENvbGxpZGVyLCBFUmlnaWRCb2R5VHlwZSwgRUNvbGxpZGVyVHlwZSwgTWVzaENvbGxpZGVyLCBVSVRyYW5zZm9ybSwgZGlyZWN0b3IsIENhbnZhcywgU2NlbmUsIFBvbHlnb25Db2xsaWRlcjJEIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgUnBjIH0gZnJvbSAnLi4vcnBjJztcbmltcG9ydCB7IHJlZ2lzdGVyLCBTZXJ2aWNlLCBCYXNlU2VydmljZSB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQge1xuICAgIElDb21wb25lbnRFdmVudHMsXG4gICAgSUFkZENvbXBvbmVudE9wdGlvbnMsXG4gICAgSUNvbXBvbmVudFNlcnZpY2UsXG4gICAgSVF1ZXJ5Q29tcG9uZW50T3B0aW9ucyxcbiAgICBJUmVtb3ZlQ29tcG9uZW50T3B0aW9ucyxcbiAgICBOb2RlRXZlbnRUeXBlLFxuICAgIElFeGVjdXRlQ29tcG9uZW50TWV0aG9kT3B0aW9ucyxcbiAgICBJQ29tcG9uZW50LFxuICAgIElRdWVyeUNsYXNzZXNPcHRpb25zLFxuICAgIElTZXRQcm9wZXJ0eU9wdGlvbnMsXG4gICAgSVVuZG9SZWRvUmVzdWx0LFxuICAgIElSZWNhbGN1bGF0ZUxPREdyb3VwQm91bmRzT3B0aW9ucyxcbiAgICBJTE9ER3JvdXBCb3VuZHNSZXN1bHQsXG4gICAgSUluc2VydExPRE9wdGlvbnMsXG4gICAgSUVyYXNlTE9ET3B0aW9ucyxcbiAgICBJUXVlcnlMT0RHcm91cFJlbGF0aXZlSGVpZ2h0T3B0aW9ucyxcbiAgICBJTE9ER3JvdXBMZXZlbHNSZXN1bHQsXG4gICAgSVJlZ2VuZXJhdGVQb2x5Z29uMkRQb2ludHNPcHRpb25zLFxuICAgIElSZWdlbmVyYXRlUG9seWdvbjJEUG9pbnRzUmVzdWx0LFxufSBmcm9tICcuLi8uLi9jb21tb24nO1xuaW1wb3J0IGR1bXBVdGlsIGZyb20gJy4vZHVtcCc7XG5pbXBvcnQgY29tcE1nciBmcm9tICcuL2NvbXBvbmVudC9pbmRleCc7XG5pbXBvcnQgY29tcG9uZW50VXRpbHMgZnJvbSAnLi9jb21wb25lbnQvdXRpbHMnO1xuaW1wb3J0IGdldENvbXBvbmVudEZ1bmN0aW9uT2ZOb2RlIGZyb20gJy4vY29tcG9uZW50L2dldC1jb21wb25lbnQtZnVuY3Rpb24tb2Ytbm9kZSc7XG5pbXBvcnQgeyBoYXNPbmVLaW5kT2ZDb21wb25lbnQgfSBmcm9tICcuL25vZGUvbm9kZS11dGlscyc7XG5pbXBvcnQgeyBpc0VkaXRvck5vZGUgfSBmcm9tICcuL25vZGUvbm9kZS11dGlscyc7XG5pbXBvcnQgeyBjcmVhdGVTaG91bGRIaWRlSW5IaWVyYXJjaHlDYW52YXNOb2RlIH0gZnJvbSAnLi9ub2RlL25vZGUtY3JlYXRlJztcbmltcG9ydCBQcmVmYWJTZXJ2aWNlIGZyb20gJy4vcHJlZmFiJztcbmltcG9ydCB7IFNuYXBzaG90Q29tbWFuZCwgdHlwZSBJU25hcHNob3RBZGFwdGVyIH0gZnJvbSAnLi91bmRvL2NvbW1hbmRzL3NuYXBzaG90LWNvbW1hbmQnO1xuaW1wb3J0IHsgQWRkQ29tcG9uZW50Q29tbWFuZCB9IGZyb20gJy4vdW5kby9jb21tYW5kcy9hZGQtY29tcG9uZW50LWNvbW1hbmQnO1xuaW1wb3J0IHsgUmVtb3ZlQ29tcG9uZW50Q29tbWFuZCB9IGZyb20gJy4vdW5kby9jb21tYW5kcy9yZW1vdmUtY29tcG9uZW50LWNvbW1hbmQnO1xuaW1wb3J0IHsgY3JlYXRlVW5kb0lkLCByZXN0b3JlQ29tcG9uZW50U25hcHNob3REdW1wLCBzbmFwc2hvdE1hcHNFcXVhbCB9IGZyb20gJy4vdW5kby9jb21tYW5kcy9jb21tYW5kLXV0aWxzLXNoYXJlZCc7XG5pbXBvcnQgeyBpc1VuZG9BcHBseWluZyB9IGZyb20gJy4vdW5kby9hcHBseWluZy1zdGF0ZSc7XG5pbXBvcnQgeyBicm9hZGNhc3RBbmltYXRpb25Qcm9wZXJ0eUNvbW1pdHRlZCB9IGZyb20gJy4vYW5pbWF0aW9uL3Byb3BlcnR5LWNvbW1pdC1ldmVudCc7XG5pbXBvcnQgeyBpc1Jvb3ROb2RlUGF0aCB9IGZyb20gJy4uLy4uLy4uL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy9tYW5hZ2VyL3BhdGgtdXRpbHMnO1xuaW1wb3J0IHtcbiAgICByZXF1aXJlTE9ER3JvdXAsXG4gICAgcXVlcnlMT0RHcm91cFJlbGF0aXZlSGVpZ2h0LFxuICAgIHNlcmlhbGl6ZUxPREdyb3VwQm91bmRzLFxuICAgIHNlcmlhbGl6ZUxPREdyb3VwTGV2ZWxzLFxuICAgIHZhbGlkYXRlTE9ERXJhc2UsXG4gICAgdmFsaWRhdGVMT0RJbnNlcnQsXG59IGZyb20gJy4vY29tcG9uZW50L2xvZC1ncm91cCc7XG5pbXBvcnQge1xuICAgIGFyZVBvbHlnb25Qb2ludHNFcXVhbCxcbiAgICBjcmVhdGVQb2x5Z29uUG9pbnRzUHJvcGVydHlEdW1wLFxuICAgIGdlbmVyYXRlUG9seWdvblBvaW50cyxcbiAgICBpbml0aWFsaXplUG9seWdvbkNvbGxpZGVyMkRQb2ludHMsXG4gICAgcmVxdWlyZVBvbHlnb25Db2xsaWRlcjJELFxuICAgIHZhbGlkYXRlUG9seWdvblBvaW50cyxcbn0gZnJvbSAnLi9jb21wb25lbnQvcG9seWdvbi1jb2xsaWRlci0yZCc7XG5cbmNvbnN0IE5vZGVNZ3IgPSBFZGl0b3JFeHRlbmRzLk5vZGU7XG5cbmZ1bmN0aW9uIHJlc29sdmVOb2RlQnlQYXRoKG5vZGVQYXRoOiBzdHJpbmcpOiBOb2RlIHwgbnVsbCB7XG4gICAgLy8gJy8nIOaMh+W9k+WJjee8lui+keWZqOeahOague+8mnByZWZhYiDmqKHlvI/kuIvmmK8gcHJlZmFiIOagueiKgueCue+8iOWPr+S7peaMgue7hOS7tu+8ie+8jOiAjOS4jeaYr+aJv+i9veWug+eahOiZmuaLn+WcuuaZr1xuICAgIGlmIChpc1Jvb3ROb2RlUGF0aChub2RlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCkgYXMgTm9kZSB8IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBOb2RlTWdyLmdldE5vZGVCeVBhdGgobm9kZVBhdGgpIGFzIE5vZGUgfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgSUNvbXBvbmVudFByb3BlcnR5U25hcHNob3Qge1xuICAgIG5vZGVVdWlkOiBzdHJpbmc7XG4gICAgbm9kZVBhdGg6IHN0cmluZztcbiAgICBjb21wb25lbnRVdWlkOiBzdHJpbmc7XG4gICAgY29tcG9uZW50UGF0aDogc3RyaW5nO1xuICAgIGNvbXBvbmVudEluZGV4OiBudW1iZXI7XG4gICAgY29tcG9uZW50VHlwZTogc3RyaW5nO1xuICAgIHBhdGg6IHN0cmluZztcbiAgICBkdW1wOiBhbnk7XG59XG5cbmludGVyZmFjZSBJQ29tcG9uZW50UHJvcGVydHlUYXJnZXQge1xuICAgIGNvbXBvbmVudDogQ29tcG9uZW50O1xuICAgIGluZGV4OiBudW1iZXI7XG59XG5cbmVudW0gU2NlbmVNb2RlVHlwZSB7XG4gICAgR2VuZXJhbCA9ICdnZW5lcmFsJyxcbiAgICBQcmVmYWIgPSAncHJlZmFiJyxcbiAgICBBbmltYXRpb24gPSAnYW5pbWF0aW9uJyxcbiAgICBQcmV2aWV3ID0gJ3ByZXZpZXcnLFxuICAgIFVuc2V0ID0gJycsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbkJhc2Uge1xuICAgIG1vZGVOYW1lPzogc3RyaW5nOyAvLyDlvZPliY3miYDlpITnmoTmqKHlvI9cbn1cblxuaW50ZXJmYWNlIElTY2VuZUV2ZW50cyB7XG5cbiAgICAvLyBDb21wb25lbnQgZXZlbnRzXG4gICAgb25BZGRDb21wb25lbnQ/KGNvbXA6IENvbXBvbmVudCk6IHZvaWQ7XG4gICAgb25SZW1vdmVDb21wb25lbnQ/KGNvbXA6IENvbXBvbmVudCk6IHZvaWQ7XG4gICAgb25Db21wb25lbnRBZGRlZD8oY29tcDogQ29tcG9uZW50LCBvcHRzPzogSU9wdGlvbkJhc2UpOiB2b2lkO1xuICAgIG9uQ29tcG9uZW50UmVtb3ZlZD8oY29tcDogQ29tcG9uZW50LCBvcHRzPzogSU9wdGlvbkJhc2UpOiB2b2lkO1xufVxuXG5leHBvcnQgeyBJU2NlbmVFdmVudHMgfTtcblxuLyoqXG4gKiDlrZDov5vnqIvoioLngrnlpITnkIblmahcbiAqIOWcqOWtkOi/m+eoi+S4reWkhOeQhuaJgOacieiKgueCueebuOWFs+aTjeS9nFxuICovXG5AcmVnaXN0ZXIoJ0NvbXBvbmVudCcpXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50U2VydmljZSBleHRlbmRzIEJhc2VTZXJ2aWNlPElDb21wb25lbnRFdmVudHM+IGltcGxlbWVudHMgSUNvbXBvbmVudFNlcnZpY2Uge1xuICAgIHB1YmxpYyBtb2RlTmFtZTogU2NlbmVNb2RlVHlwZSA9IFNjZW5lTW9kZVR5cGUuR2VuZXJhbDtcbiAgICAvLyBwcml2YXRlIF9zdGFnaW5nQ2FtZXJhSW5mbzogYW55O1xuICAgIHByb3RlY3RlZCBfc2NlbmVFdmVudExpc3RlbmVyOiBJU2NlbmVFdmVudHNbXSA9IFtdO1xuXG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LlvZPliY3mraPlnKjnvJbovpHnmoTmqKHlvI/lkI3lrZdcbiAgICAgKi9cbiAgICBwdWJsaWMgcXVlcnlNb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlTmFtZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25BZGRDb21wb25lbnQoY29tcDogQ29tcG9uZW50LCBvcHRzOiBJT3B0aW9uQmFzZSA9IHt9KSB7XG4gICAgICAgIG9wdHMubW9kZU5hbWUgPSB0aGlzLm1vZGVOYW1lO1xuICAgICAgICAvLyBUT0RPKHFnaCk6IOWPkemAgea2iOaBr1xuICAgICAgICAvL3RoaXMuZGlzcGF0Y2hFdmVudHMoJ29uQWRkQ29tcG9uZW50JywgY29tcCwgb3B0cyk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uUmVtb3ZlQ29tcG9uZW50KGNvbXA6IENvbXBvbmVudCwgb3B0czogSU9wdGlvbkJhc2UgPSB7fSkge1xuICAgICAgICBvcHRzLm1vZGVOYW1lID0gdGhpcy5tb2RlTmFtZTtcbiAgICAgICAgLy8gVE9ETyhxZ2gpOiDlj5HpgIHmtojmga9cbiAgICAgICAgLy90aGlzLmRpc3BhdGNoRXZlbnRzKCdvblJlbW92ZUNvbXBvbmVudCcsIGNvbXAsIG9wdHMpO1xuICAgICAgICAvLyDnvJbovpHlmajkuK3nmoR0aGlzLl9zY2VuZVByb3h5LmdldFJvb3ROb2RlKCnlrp7njrDov5Tlm57nmoTmmK9udWxsXG4gICAgICAgIFByZWZhYlNlcnZpY2Uub25SZW1vdmVDb21wb25lbnRJbkdlbmVyYWxNb2RlKGNvbXAsIG51bGwpO1xuICAgICAgICAvL3RoaXMuX3ByZWZhYk1nci5vblJlbW92ZUNvbXBvbmVudEluR2VuZXJhbE1vZGUoY29tcCwgdGhpcy5fc2NlbmVQcm94eS5nZXRSb290Tm9kZSgpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Db21wb25lbnRBZGRlZChjb21wOiBDb21wb25lbnQsIG9wdHM6IElPcHRpb25CYXNlID0ge30pIHtcbiAgICAgICAgb3B0cy5tb2RlTmFtZSA9IHRoaXMubW9kZU5hbWU7XG4gICAgICAgIC8vIFRPRE8ocWdoKTog5Y+R6YCB5raI5oGvXG4gICAgICAgIC8vdGhpcy5kaXNwYXRjaEV2ZW50cygnb25Db21wb25lbnRBZGRlZCcsIGNvbXAsIG9wdHMpO1xuICAgICAgICBjb21wTWdyLmFkZFJlY3ljbGVDb21wb25lbnQoY29tcC51dWlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Db21wb25lbnRSZW1vdmVkKGNvbXA6IENvbXBvbmVudCwgb3B0czogSU9wdGlvbkJhc2UgPSB7fSkge1xuICAgICAgICBvcHRzLm1vZGVOYW1lID0gdGhpcy5tb2RlTmFtZTtcbiAgICAgICAgLy8gVE9ETyhxZ2gpOiDlj5HpgIHmtojmga9cbiAgICAgICAgLy8gdGhpcy5kaXNwYXRjaEV2ZW50cygnb25Db21wb25lbnRSZW1vdmVkJywgY29tcCk7XG4gICAgICAgIC8vIOe8lui+keWZqOS4reeahHRoaXMuX3NjZW5lUHJveHkuZ2V0Um9vdE5vZGUoKeWunueOsOi/lOWbnueahOaYr251bGxcbiAgICAgICAgUHJlZmFiU2VydmljZS5vbkNvbXBvbmVudFJlbW92ZWRJbkdlbmVyYWxNb2RlKGNvbXAsIG51bGwpO1xuICAgICAgICBjb21wTWdyLnJlbW92ZVJlY3ljbGVDb21wb25lbnQoY29tcC51dWlkLCBjb21wKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcGF0Y2hFdmVudHMoZXZlbnROYW1lOiBrZXlvZiBJU2NlbmVFdmVudHMsIC4uLmFyZ3M6IGFueVthbnldKSB7XG4gICAgICAgIHRoaXMuX3NjZW5lRXZlbnRMaXN0ZW5lci5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyICYmIGxpc3RlbmVyW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJbZXZlbnROYW1lXSEuYXBwbHkobGlzdGVuZXIsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVuc2FmZS1mdW5jdGlvbi10eXBlXG4gICAgcHJpdmF0ZSByZXF1aXJlQ29tcG9uZW50TGlzdDogRnVuY3Rpb25bXSA9IFtdO1xuXG4gICAgcHJpdmF0ZSBhc3luYyByZXNvbHZlQ29tcG9uZW50Q3Rvcihjb21wb25lbnQ6IHN0cmluZyk6IFByb21pc2U8Q29uc3RydWN0b3I8Q29tcG9uZW50Pj4ge1xuICAgICAgICBpZiAoY29tcG9uZW50ID09PSAnTWlzc2luZ1NjcmlwdCcgfHwgY29tcG9uZW50ID09PSAnY2MuTWlzc2luZ1NjcmlwdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZ1NjcmlwdCBkb2VzIG5vdCBleGlzdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNVUkwgPSBjb21wb25lbnQuc3RhcnRzV2l0aCgnZGI6Ly8nKTtcbiAgICAgICAgY29uc3QgaXNVdWlkID0gY29tcG9uZW50VXRpbHMuaXNVVUlEKGNvbXBvbmVudCk7XG4gICAgICAgIGxldCByZXNvbHZlZE5hbWUgPSBjb21wb25lbnQ7XG4gICAgICAgIGxldCB1dWlkO1xuICAgICAgICBpZiAoaXNVdWlkKSB7XG4gICAgICAgICAgICB1dWlkID0gY29tcG9uZW50O1xuICAgICAgICB9IGVsc2UgaWYgKGlzVVJMKSB7XG4gICAgICAgICAgICB1dWlkID0gYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ3F1ZXJ5VVVJRCcsIFtjb21wb25lbnRdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjdG9yID0gbnVsbDtcbiAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNpZCA9IGF3YWl0IFNlcnZpY2UuU2NyaXB0LnF1ZXJ5U2NyaXB0Q2lkKHV1aWQpO1xuICAgICAgICAgICAgaWYgKGNpZCAmJiBjaWQgIT09ICdNaXNzaW5nU2NyaXB0JyAmJiBjaWQgIT09ICdjYy5NaXNzaW5nU2NyaXB0Jykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVkTmFtZSA9IGNpZDtcbiAgICAgICAgICAgICAgICBjdG9yID0gY2MuanMuZ2V0Q2xhc3NCeUlkKGNpZCkgfHwgY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY2lkKTtcbiAgICAgICAgICAgICAgICBpZiAoIWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb21wb25lbnQgc2NyaXB0KCR7Y2lkfSkgbmFtZSBleGlzdHMgYnV0IGNvbnN0cnVjdG9yIGRvZXMgbm90IGV4aXN0LmApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ3F1ZXJ5QXNzZXRJbmZvJywgW3V1aWRdKTtcbiAgICAgICAgICAgICAgICBpZiAoYXNzZXRJbmZvPy5maWxlICYmIGFzc2V0SW5mbz8uZmlsZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2hlY2sgaWYgdGhlIHNjcmlwdCgke3V1aWR9KSBjb250YWlucyBhbnkgZXJyb3JzLmApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN0b3IgPSBjYy5qcy5nZXRDbGFzc0J5SWQocmVzb2x2ZWROYW1lKSB8fCBjYy5qcy5nZXRDbGFzc0J5TmFtZShyZXNvbHZlZE5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBpc1N0YXJ0V2l0aFVwcGVyY2FzZSA9IHJlc29sdmVkTmFtZS5jaGFyQXQoMCkgPT09IHJlc29sdmVkTmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIGlmICghaXNTdGFydFdpdGhVcHBlcmNhc2UpIHtcbiAgICAgICAgICAgICAgICBjdG9yID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUocmVzb2x2ZWROYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcmVzb2x2ZWROYW1lLnNsaWNlKDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghY3RvciAmJiAhaXNVdWlkICYmICFpc1VSTCkge1xuICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWROYW1lLnN0YXJ0c1dpdGgoJ2NjLicpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0b3IgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZSgnY2MuJyArIHJlc29sdmVkTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3RvciAmJiAhaXNTdGFydFdpdGhVcHBlcmNhc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0b3IgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZSgnY2MuJyArIHJlc29sdmVkTmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHJlc29sdmVkTmFtZS5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc29sdmVkTmFtZS5sZW5ndGggPiAzICYmIHJlc29sdmVkTmFtZS5jaGFyQXQoMykgIT09IHJlc29sdmVkTmFtZS5jaGFyQXQoMykudG9VcHBlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgICAgICBjdG9yID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUocmVzb2x2ZWROYW1lLnNsaWNlKDAsIDMpICsgcmVzb2x2ZWROYW1lLmNoYXJBdCgzKS50b1VwcGVyQ2FzZSgpICsgcmVzb2x2ZWROYW1lLnNsaWNlKDQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWN0b3IpIHtcbiAgICAgICAgICAgIGlmIChpc1V1aWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRhcmdldCBDb21wb25lbnQoJyR7cmVzb2x2ZWROYW1lfScpIE5vdCBGb3VuZC4gSGludDogUGxlYXNlIHVzZSB0aGUgY29ycmVjdCBjb21wb25lbnQgdXVpZGApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1VSTCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGFyZ2V0IENvbXBvbmVudCgnJHtyZXNvbHZlZE5hbWV9JykgTm90IEZvdW5kLiBIaW50OiBQbGVhc2UgdXNlIHRoZSBjb3JyZWN0IGNvbXBvbmVudCB1cmxgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUYXJnZXQgQ29tcG9uZW50KCcke3Jlc29sdmVkTmFtZX0nKSBOb3QgRm91bmQuIEhpbnQ6IFBsZWFzZSB1c2UgdGhlIGNvcnJlY3QgY29tcG9uZW50IG5hbWVgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNjLmpzLmlzQ2hpbGRDbGFzc09mKGN0b3IsIENvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29uc3RydWN0b3IgaGFzIGJlZW4gZm91bmQsIGJ1dCBpdCBpcyBub3QgY29tcG9uZW50LWJhc2VkLmApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdG9yIGFzIENvbnN0cnVjdG9yPENvbXBvbmVudD47XG4gICAgfVxuXG4gICAgYXN5bmMgYWRkKHBhcmFtczogSUFkZENvbXBvbmVudE9wdGlvbnMpOiBQcm9taXNlPElDb21wb25lbnQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmxvY2soKTtcblxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFyYW1zLmNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgICAgICBsZXQgbGFzdER1bXA6IElDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGlkIG9mIHBhcmFtcy5jb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdER1bXAgPSBhd2FpdCB0aGlzLmFkZCh7IG5vZGVQYXRoOiBwYXJhbXMubm9kZVBhdGgsIGNvbXBvbmVudDogaWQgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0RHVtcCE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSByZXNvbHZlTm9kZUJ5UGF0aChwYXJhbXMubm9kZVBhdGgpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjcmVhdGUgY29tcG9uZW50IGZhaWxlZDogJHtwYXJhbXMubm9kZVBhdGh9IGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFNjZW5lKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjcmVhdGUgY29tcG9uZW50IGZhaWxlZDogY2Fubm90IGF0dGFjaCBhIGNvbXBvbmVudCB0byB0aGUgc2NlbmUgcm9vdCAoJHtwYXJhbXMubm9kZVBhdGh9KWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwYXJhbXMuY29tcG9uZW50IHx8IHBhcmFtcy5jb21wb25lbnQubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNyZWF0ZSBjb21wb25lbnQgZmFpbGVkOiBjb21wb25lbnQgbmFtZSBjYW5ub3QgYmUgZW1wdHlgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY3RvciA9IGF3YWl0IHRoaXMucmVzb2x2ZUNvbXBvbmVudEN0b3IocGFyYW1zLmNvbXBvbmVudCk7XG5cbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgbm9kZSk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2NvbXBvbmVudDpiZWZvcmUtYWRkLWNvbXBvbmVudCcsIHBhcmFtcy5jb21wb25lbnQsIG5vZGUpO1xuXG4gICAgICAgICAgICAvLyDlpITnkIYgcmVxdWlyZUNvbXBvbmVudCDkvp3otZbpk75cbiAgICAgICAgICAgIGxldCBpdGVyYXRlT2JqID0gY3RvciBhcyBhbnk7XG4gICAgICAgICAgICBpZiAoaXRlcmF0ZU9iai5fcmVxdWlyZUNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChpdGVyYXRlT2JqLl9yZXF1aXJlQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWlyZUNvbXBvbmVudExpc3QucHVzaChpdGVyYXRlT2JqLl9yZXF1aXJlQ29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZU9iaiA9IGl0ZXJhdGVPYmouX3JlcXVpcmVDb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRVdWlkc0JlZm9yZUFkZCA9IG5ldyBTZXQobm9kZS5jb21wb25lbnRzLm1hcChjb21wb25lbnQgPT4gY29tcG9uZW50LnV1aWQpKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBub2RlLmFkZENvbXBvbmVudChjdG9yKTtcbiAgICAgICAgICAgIHRoaXMucmVxdWlyZUNvbXBvbmVudExpc3QgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGFkZGVkQ29tcG9uZW50cyA9IG5vZGUuY29tcG9uZW50cy5maWx0ZXIoY29tcG9uZW50ID0+ICFjb21wb25lbnRVdWlkc0JlZm9yZUFkZC5oYXMoY29tcG9uZW50LnV1aWQpKTtcblxuICAgICAgICAgICAgLy8gcHJlZmFiIOaooeW8j+S4i+eahCBDYW52YXMg5Yib5bu6XG4gICAgICAgICAgICBjb25zdCBtb2RlID0gdGhpcy5xdWVyeU1vZGUoKTtcbiAgICAgICAgICAgIGlmIChtb2RlID09PSAncHJlZmFiJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlID0gU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKTtcbiAgICAgICAgICAgICAgICBpZiAocm9vdE5vZGUgJiYgaGFzT25lS2luZE9mQ29tcG9uZW50KG5vZGUsIFVJVHJhbnNmb3JtKSAmJiAhaGFzT25lS2luZE9mQ29tcG9uZW50KHJvb3ROb2RlLCBDYW52YXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZVNob3VsZEhpZGVJbkhpZXJhcmNoeUNhbnZhc05vZGUoZGlyZWN0b3IuZ2V0U2NlbmUoKSEpLnRoZW4oKHRhcmdldCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdE5vZGUucGFyZW50ID0gdGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2hlY2tDb21wb25lbnRzQ29sbGlzaW9uKG5vZGUpO1xuICAgICAgICAgICAgdGhpcy5jaGVja0R5bmFtaWNCb2R5U2hhcGUobm9kZSk7XG5cbiAgICAgICAgICAgIGNvbXBNZ3Iub25Db21wb25lbnRBZGRlZEZyb21FZGl0b3IoY29tcCk7XG4gICAgICAgICAgICBpZiAoY29tcCBpbnN0YW5jZW9mIFBvbHlnb25Db2xsaWRlcjJEKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgaW5pdGlhbGl6ZVBvbHlnb25Db2xsaWRlcjJEUG9pbnRzKGNvbXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIHsgdHlwZTogTm9kZUV2ZW50VHlwZS5DUkVBVEVfQ09NUE9ORU5UIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBkdW1wID0gZHVtcFV0aWwuZHVtcENvbXBvbmVudChjb21wIGFzIENvbXBvbmVudCkgYXMgSUNvbXBvbmVudDtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zaG91bGRSZWNvcmRDb21wb25lbnRDb21tYW5kKCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kID0gQWRkQ29tcG9uZW50Q29tbWFuZC5jYXB0dXJlTWFueShhZGRlZENvbXBvbmVudHMpO1xuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChjb21tYW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZHVtcDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBTZXJ2aWNlLkVkaXRvci51bmxvY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgYXN5bmMgY2hlY2tDb21wb25lbnRzQ29sbGlzaW9uKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKGhhc09uZUtpbmRPZkNvbXBvbmVudChub2RlLCBhbmltYXRpb24uQW5pbWF0aW9uQ29udHJvbGxlcikgJiYgaGFzT25lS2luZE9mQ29tcG9uZW50KG5vZGUsIEFuaW1hdGlvbikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybignc2NlbmUuY29udHJpYnV0aW9ucy5tZXNzYWdlcy5kZXNjcmlwdGlvbi5hbmltYXRpb25Db21wb25lbnRDb2xsaXNpb24nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoZWNrRHluYW1pY0JvZHlTaGFwZShuZG9lOiBOb2RlKSB7XG4gICAgICAgIGlmIChoYXNPbmVLaW5kT2ZDb21wb25lbnQobmRvZSwgUmlnaWRCb2R5KSAmJiBoYXNPbmVLaW5kT2ZDb21wb25lbnQobmRvZSwgQ29sbGlkZXIpKSB7XG4gICAgICAgICAgICAvLyBnZXQgdGhlIHJpZ2lkIGJvZHkgY29tcG9uZW50XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gbmRvZS5nZXRDb21wb25lbnQoUmlnaWRCb2R5KTtcblxuICAgICAgICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBnZXQgdGhlIGNvbGxpZGVyXG4gICAgICAgICAgICBjb25zdCBjb2xsaWRlciA9IG5kb2UuZ2V0Q29tcG9uZW50KENvbGxpZGVyKTtcblxuICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gRVJpZ2lkQm9keVR5cGUuRFlOQU1JQykge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29sbGlkZXI/LnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBFQ29sbGlkZXJUeXBlLlBMQU5FOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIEVDb2xsaWRlclR5cGUuVEVSUkFJTjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybignc2NlbmUuY29udHJpYnV0aW9ucy5tZXNzYWdlcy5kZXNjcmlwdGlvbi5waHlzaWNzRHluYW1pY0JvZHlTaGFwZScpOyBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICBjYXNlIEVDb2xsaWRlclR5cGUuTUVTSDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGNvbGxpZGVyIGFzIE1lc2hDb2xsaWRlcikuY29udmV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdzY2VuZS5jb250cmlidXRpb25zLm1lc3NhZ2VzLmRlc2NyaXB0aW9uLnBoeXNpY3NEeW5hbWljQm9keVNoYXBlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6YCa6L+HIHBhdGgg5p+l5om+57uE5Lu25a6e5L6L77yM5pSv5oyB6Lev5b6E44CBVVVJRCDmiJYgVVJMXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBmaW5kQ29tcG9uZW50KHBhdGg6IHN0cmluZyk6IFByb21pc2U8Q29tcG9uZW50IHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBpc1V1aWQgPSBjb21wb25lbnRVdGlscy5pc1VVSUQocGF0aCk7XG4gICAgICAgIGNvbnN0IGlzVVJMID0gcGF0aC5zdGFydHNXaXRoKCdkYjovLycpO1xuXG4gICAgICAgIGlmIChpc1V1aWQpIHtcbiAgICAgICAgICAgIHJldHVybiBjb21wTWdyLnF1ZXJ5KHBhdGgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVVJMKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ3F1ZXJ5VVVJRCcsIFtwYXRoXSk7XG4gICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb21wTWdyLnF1ZXJ5KHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcE1nci5xdWVyeUZyb21QYXRoKHBhdGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcmVtb3ZlKHBhcmFtczogSVJlbW92ZUNvbXBvbmVudE9wdGlvbnMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmxvY2soKTtcblxuICAgICAgICAgICAgY29uc3QgY29tcCA9IGF3YWl0IHRoaXMuZmluZENvbXBvbmVudChwYXJhbXMucGF0aCk7XG4gICAgICAgICAgICBpZiAoIWNvbXApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbW92ZSBjb21wb25lbnQgZmFpbGVkOiAke3BhcmFtcy5wYXRofSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5fc2hvdWxkUmVjb3JkQ29tcG9uZW50Q29tbWFuZCgpXG4gICAgICAgICAgICAgICAgPyBSZW1vdmVDb21wb25lbnRDb21tYW5kLmNhcHR1cmUoY29tcClcbiAgICAgICAgICAgICAgICA6IG51bGw7XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbXBNZ3IucmVtb3ZlQ29tcG9uZW50KGNvbXApO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiBjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgU2VydmljZS5VbmRvPy5wdXNoKGNvbW1hbmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRWRpdG9yLnVubG9jaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlJbXBsKHBhcmFtczogSVF1ZXJ5Q29tcG9uZW50T3B0aW9ucyk6IFByb21pc2U8SUNvbXBvbmVudCB8IG51bGw+IHtcbiAgICAgICAgY29uc3QgY29tcCA9IGF3YWl0IHRoaXMuZmluZENvbXBvbmVudChwYXJhbXMucGF0aCk7XG4gICAgICAgIGlmICghY29tcCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBRdWVyeSBjb21wb25lbnQgZmFpbGVkOiAke3BhcmFtcy5wYXRofSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGR1bXBVdGlsLmR1bXBDb21wb25lbnQoY29tcCBhcyBDb21wb25lbnQpIGFzIElDb21wb25lbnQ7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkocGFyYW1zOiBJUXVlcnlDb21wb25lbnRPcHRpb25zIHwgc3RyaW5nKTogUHJvbWlzZTxJQ29tcG9uZW50IHwgbnVsbD4ge1xuICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5SW1wbCh7IHBhdGg6IHBhcmFtcyB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5SW1wbChwYXJhbXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcmVnZW5lcmF0ZVBvbHlnb24yRFBvaW50cyhcbiAgICAgICAgb3B0aW9uczogSVJlZ2VuZXJhdGVQb2x5Z29uMkRQb2ludHNPcHRpb25zLFxuICAgICk6IFByb21pc2U8SVJlZ2VuZXJhdGVQb2x5Z29uMkRQb2ludHNSZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgcGF0aCA9IG9wdGlvbnMucGF0aDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgU2VydmljZS5FZGl0b3IubG9jaygpO1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBhd2FpdCB0aGlzLmZpbmRDb21wb25lbnQocGF0aCk7XG4gICAgICAgICAgICBjb25zdCBjb2xsaWRlciA9IHJlcXVpcmVQb2x5Z29uQ29sbGlkZXIyRChjb21wb25lbnQsIHBhdGgpO1xuICAgICAgICAgICAgY29uc3QgZ2VuZXJhdGVkID0gYXdhaXQgZ2VuZXJhdGVQb2x5Z29uUG9pbnRzKGNvbGxpZGVyKTtcbiAgICAgICAgICAgIHZhbGlkYXRlUG9seWdvblBvaW50cyhnZW5lcmF0ZWQucG9pbnRzKTtcblxuICAgICAgICAgICAgaWYgKGFyZVBvbHlnb25Qb2ludHNFcXVhbChjb2xsaWRlci5wb2ludHMsIGdlbmVyYXRlZC5wb2ludHMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHBvaW50Q291bnQ6IGdlbmVyYXRlZC5wb2ludHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGdlbmVyYXRlZC5zb3VyY2UsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50SW5kZXggPSBjb2xsaWRlci5ub2RlLmNvbXBvbmVudHMuaW5kZXhPZihjb2xsaWRlcik7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50SW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQb2x5Z29uQ29sbGlkZXIyRCBpcyBubyBsb25nZXIgYXR0YWNoZWQgdG8gaXRzIG5vZGUuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudER1bXAgPSBkdW1wVXRpbC5kdW1wQ29tcG9uZW50KGNvbGxpZGVyKSBhcyBJQ29tcG9uZW50O1xuICAgICAgICAgICAgY29uc3QgcG9pbnRzRHVtcCA9IGNyZWF0ZVBvbHlnb25Qb2ludHNQcm9wZXJ0eUR1bXAoXG4gICAgICAgICAgICAgICAgY29tcG9uZW50RHVtcC52YWx1ZT8ucG9pbnRzLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlZC5wb2ludHMsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKCFwb2ludHNEdW1wKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZW5jb2RlIFBvbHlnb25Db2xsaWRlcjJELnBvaW50cyBmcm9tIHRoZSBjb21wb25lbnQgZHVtcC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZVBhdGggPSBOb2RlTWdyLmdldE5vZGVQYXRoKGNvbGxpZGVyLm5vZGUpXG4gICAgICAgICAgICAgICAgfHwgKGNvbGxpZGVyLm5vZGUgPT09IFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCkgPyAnLycgOiAnJyk7XG4gICAgICAgICAgICBpZiAoIW5vZGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gcmVzb2x2ZSB0aGUgUG9seWdvbkNvbGxpZGVyMkQgbm9kZSBwYXRoLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb21taXR0ZWQgPSBhd2FpdCB0aGlzLnNldFByb3BlcnR5KHtcbiAgICAgICAgICAgICAgICBub2RlUGF0aCxcbiAgICAgICAgICAgICAgICBwYXRoOiBgX19jb21wc19fLiR7Y29tcG9uZW50SW5kZXh9LnBvaW50c2AsXG4gICAgICAgICAgICAgICAgZHVtcDogcG9pbnRzRHVtcCxcbiAgICAgICAgICAgICAgICByZWNvcmQ6IG9wdGlvbnMucmVjb3JkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIWNvbW1pdHRlZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNvbW1pdCBQb2x5Z29uQ29sbGlkZXIyRC5wb2ludHMgdGhyb3VnaCBDb21wb25lbnRTZXJ2aWNlLnNldFByb3BlcnR5KCkuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICBjaGFuZ2VkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBvaW50Q291bnQ6IGdlbmVyYXRlZC5wb2ludHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHNvdXJjZTogZ2VuZXJhdGVkLnNvdXJjZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBTZXJ2aWNlLkVkaXRvci51bmxvY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHNldFByb3BlcnR5KG9wdGlvbnM6IElTZXRQcm9wZXJ0eU9wdGlvbnMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgLy8g5aSa5Liq6IqC54K55pu05paw5YC8XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMubm9kZVBhdGgpKSB7XG4gICAgICAgICAgICAvLyDku4XlvZPpnIDopoHorrDlvZUgdW5kbyDkuJTlvZPliY3msqHmnInmm7TlpJblsYIgZ3JvdXAg5pe277yM55SoIGdyb3VwIOWMheijue+8jFxuICAgICAgICAgICAgLy8g5L2/5aSa6IqC54K555qE5L+u5pS55oiQ5Li65LiA5qyh5Y+v5pW05L2T5pKk6ZSA55qE5aSN5ZCI5ZG95LukXG4gICAgICAgICAgICBjb25zdCB1c2VHcm91cCA9XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5yZWNvcmQgIT09IGZhbHNlICYmXG4gICAgICAgICAgICAgICAgIVNlcnZpY2UuVW5kbz8uaXNBcHBseWluZz8uKCkgJiZcbiAgICAgICAgICAgICAgICAhU2VydmljZS5VbmRvPy5pc0dyb3VwQWN0aXZlPy4oKTtcbiAgICAgICAgICAgIGNvbnN0IGdyb3VwSWQgPSB1c2VHcm91cCA/IFNlcnZpY2UuVW5kbz8uYmVnaW5Hcm91cD8uKHsgbGFiZWw6IGBTZXQgJHtvcHRpb25zLnBhdGh9YCB9KSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHRpb25zLm5vZGVQYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0UHJvcGVydHkoeyBub2RlUGF0aDogb3B0aW9ucy5ub2RlUGF0aFtpXSwgcGF0aDogb3B0aW9ucy5wYXRoLCBkdW1wOiBvcHRpb25zLmR1bXAsIHJlY29yZDogb3B0aW9ucz8ucmVjb3JkIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZ3JvdXBJZCkge1xuICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlLlVuZG8/LmVuZEdyb3VwPy4oZ3JvdXBJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgaWYgKGdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgU2VydmljZS5VbmRvPy5jYW5jZWxHcm91cD8uKGdyb3VwSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZSA9IHJlc29sdmVOb2RlQnlQYXRoKG9wdGlvbnMubm9kZVBhdGgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgU2V0IHByb3BlcnR5IGZhaWxlZDogJHtvcHRpb25zLm5vZGVQYXRofSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5fcmVjb3JkQ29tcG9uZW50UHJvcGVydHlTbmFwc2hvdChub2RlLCB7XG4gICAgICAgICAgICBsYWJlbDogYFNldCAke29wdGlvbnMucGF0aH1gLFxuICAgICAgICAgICAgdHlwZTogJ2NvbXBvbmVudDpzZXQtcHJvcGVydHknLFxuICAgICAgICAgICAgbm9kZVBhdGg6IG9wdGlvbnMubm9kZVBhdGgsXG4gICAgICAgICAgICBwYXRoOiBvcHRpb25zLnBhdGgsXG4gICAgICAgICAgICByZWNvcmQ6IG9wdGlvbnMucmVjb3JkLFxuICAgICAgICB9LCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAvLyDop6blj5Hkv67mlLnliY3nmoTkuovku7ZcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgbm9kZSk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5wYXRoID09PSAncGFyZW50JyAmJiBub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIC8vIOWPkemAgeiKgueCueS/ruaUuea2iOaBr1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgbm9kZS5wYXJlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDmgaLlpI3mlbDmja5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZHVtcFV0aWwucmVzdG9yZVByb3BlcnR5KG5vZGUsIG9wdGlvbnMucGF0aCwgb3B0aW9ucy5kdW1wKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6Kem5Y+R5L+u5pS55ZCO55qE5LqL5Lu2XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgbm9kZSwgeyB0eXBlOiBOb2RlRXZlbnRUeXBlLlNFVF9QUk9QRVJUWSwgcHJvcFBhdGg6IG9wdGlvbnMucGF0aCwgcmVjb3JkOiBvcHRpb25zLnJlY29yZCB9KTtcbiAgICAgICAgICAgIC8vIOWmguaenOaYr+aVsOe7hOeahOivne+8jOmcgOimgeS+neasoSBlbWl0IGNoYW5nZe+8jOi3r+W+hOWumuS9jeWIsOaVsOe7hOeahOS4i+agh+S9jee9rlxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZHVtcC5pc0FycmF5ICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucy5kdW1wLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZHVtcC52YWx1ZS5mb3JFYWNoKChpdGVtLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCB7IHR5cGU6IE5vZGVFdmVudFR5cGUuU0VUX1BST1BFUlRZLCBwcm9wUGF0aDogYCR7b3B0aW9ucy5wYXRofS4ke2l9YCwgcmVjb3JkOiBvcHRpb25zLnJlY29yZCB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOaUueWPmOeItuWtkOWFs+ezu1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGF0aCA9PT0gJ3BhcmVudCcgJiYgbm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAvLyDlj5HpgIHoioLngrnkv67mlLnmtojmga9cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgbm9kZS5wYXJlbnQsIHsgdHlwZTogTm9kZUV2ZW50VHlwZS5TRVRfUFJPUEVSVFksIHByb3BQYXRoOiAnY2hpbGRyZW4nLCByZWNvcmQ6IG9wdGlvbnMucmVjb3JkIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAocmVzdWx0ICYmIG9wdGlvbnMucmVjb3JkICE9PSBmYWxzZSAmJiAhaXNVbmRvQXBwbHlpbmcoKSkge1xuICAgICAgICAgICAgYnJvYWRjYXN0QW5pbWF0aW9uUHJvcGVydHlDb21taXR0ZWQoe1xuICAgICAgICAgICAgICAgIG5vZGVQYXRoOiBvcHRpb25zLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgIHByb3BQYXRoOiBvcHRpb25zLnBhdGgsXG4gICAgICAgICAgICAgICAgc291cmNlOiAnZWRpdG9yJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2hvdWxkUmVjb3JkQ29tcG9uZW50Q29tbWFuZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuICFTZXJ2aWNlLlVuZG8/LmlzQXBwbHlpbmc/LigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3JlY29yZENvbXBvbmVudFNuYXBzaG90KFxuICAgICAgICBjb21wb25lbnQ6IENvbXBvbmVudCxcbiAgICAgICAgb3B0aW9uczogeyBsYWJlbDogc3RyaW5nOyB0eXBlOiBzdHJpbmc7IHBhdGg/OiBzdHJpbmc7IHJlY29yZD86IGJvb2xlYW4gfSxcbiAgICAgICAgbXV0YXRlOiAoKSA9PiBQcm9taXNlPGJvb2xlYW4+LFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBvcHRpb25zLnJlY29yZCA9PT0gZmFsc2UgfHxcbiAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8uaXNBcHBseWluZz8uKCkgfHxcbiAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8uaGFzQWN0aXZlUmVjb3JkaW5nPy4oY29tcG9uZW50Lm5vZGUudXVpZCkgfHxcbiAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8uaGFzQWN0aXZlUmVjb3JkaW5nPy4oY29tcG9uZW50LnV1aWQpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIG11dGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc25hcHNob3RQYXRoID0gb3B0aW9ucy5wYXRoID8/IG9wdGlvbnMudHlwZTtcbiAgICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5fY2FwdHVyZUNvbXBvbmVudFNuYXBzaG90KGNvbXBvbmVudCwgc25hcHNob3RQYXRoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbXV0YXRlKCk7XG4gICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmVmb3JlU25hcHNob3QgPSBbLi4uYmVmb3JlLnZhbHVlcygpXVswXTtcbiAgICAgICAgaWYgKCFiZWZvcmVTbmFwc2hvdCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxhdGVzdENvbXBvbmVudCA9IHRoaXMuX2ZpbmRTbmFwc2hvdENvbXBvbmVudChiZWZvcmVTbmFwc2hvdCk7XG4gICAgICAgIGlmICghbGF0ZXN0Q29tcG9uZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWZ0ZXIgPSB0aGlzLl9jYXB0dXJlQ29tcG9uZW50U25hcHNob3QobGF0ZXN0Q29tcG9uZW50LCBzbmFwc2hvdFBhdGgpO1xuICAgICAgICBpZiAodGhpcy5fc25hcHNob3RNYXBzRXF1YWwoYmVmb3JlLCBhZnRlcikpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBTZXJ2aWNlLlVuZG8/LnB1c2gobmV3IFNuYXBzaG90Q29tbWFuZCh7XG4gICAgICAgICAgICBpZDogdGhpcy5fY3JlYXRlVW5kb1NuYXBzaG90SWQob3B0aW9ucy50eXBlKSxcbiAgICAgICAgICAgIGxhYmVsOiBvcHRpb25zLmxhYmVsLFxuICAgICAgICAgICAgdHlwZTogb3B0aW9ucy50eXBlLFxuICAgICAgICAgICAgc2NvcGU6IHsgZWRpdG9yVHlwZTogJ3NjZW5lJyB9LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICB9LCBiZWZvcmUsIGFmdGVyLCB0aGlzLl9jcmVhdGVDb21wb25lbnRQcm9wZXJ0eVNuYXBzaG90QWRhcHRlcigpKSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVjb3JkQ29tcG9uZW50UHJvcGVydHlTbmFwc2hvdChcbiAgICAgICAgbm9kZTogTm9kZSxcbiAgICAgICAgb3B0aW9uczogeyBsYWJlbDogc3RyaW5nOyB0eXBlOiBzdHJpbmc7IG5vZGVQYXRoOiBzdHJpbmc7IHBhdGg6IHN0cmluZzsgcmVjb3JkPzogYm9vbGVhbiB9LFxuICAgICAgICBtdXRhdGU6ICgpID0+IFByb21pc2U8Ym9vbGVhbj4sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGlmIChvcHRpb25zLnJlY29yZCA9PT0gZmFsc2UgfHwgU2VydmljZS5VbmRvPy5pc0FwcGx5aW5nPy4oKSkge1xuICAgICAgICAgICAgcmV0dXJuIG11dGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5fcmVzb2x2ZUNvbXBvbmVudFByb3BlcnR5VGFyZ2V0KG5vZGUsIG9wdGlvbnMucGF0aCk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8uaGFzQWN0aXZlUmVjb3JkaW5nPy4obm9kZS51dWlkKSB8fFxuICAgICAgICAgICAgKHRhcmdldCAmJiBTZXJ2aWNlLlVuZG8/Lmhhc0FjdGl2ZVJlY29yZGluZz8uKHRhcmdldC5jb21wb25lbnQudXVpZCkpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIG11dGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5fY2FwdHVyZUNvbXBvbmVudFByb3BlcnR5U25hcHNob3Qobm9kZSwgb3B0aW9ucy5wYXRoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbXV0YXRlKCk7XG4gICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGF0ZXN0Tm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZShub2RlLnV1aWQpIGFzIE5vZGUgfCBudWxsO1xuICAgICAgICBpZiAoIWxhdGVzdE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhZnRlciA9IHRoaXMuX2NhcHR1cmVDb21wb25lbnRQcm9wZXJ0eVNuYXBzaG90KGxhdGVzdE5vZGUsIG9wdGlvbnMucGF0aCk7XG4gICAgICAgIGlmICh0aGlzLl9zbmFwc2hvdE1hcHNFcXVhbChiZWZvcmUsIGFmdGVyKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChuZXcgU25hcHNob3RDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9jcmVhdGVVbmRvU25hcHNob3RJZChvcHRpb25zLnR5cGUpLFxuICAgICAgICAgICAgbGFiZWw6IG9wdGlvbnMubGFiZWwsXG4gICAgICAgICAgICB0eXBlOiBvcHRpb25zLnR5cGUsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGVkaXRvclR5cGU6ICdzY2VuZScsXG4gICAgICAgICAgICAgICAgbm9kZVBhdGg6IG9wdGlvbnMubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgcHJvcFBhdGg6IHRoaXMuX2NyZWF0ZUNvbXBvbmVudEFuaW1hdGlvblByb3BQYXRoKG5vZGUsIG9wdGlvbnMucGF0aCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICB9LCBiZWZvcmUsIGFmdGVyLCB0aGlzLl9jcmVhdGVDb21wb25lbnRQcm9wZXJ0eVNuYXBzaG90QWRhcHRlcigpKSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FwdHVyZUNvbXBvbmVudFNuYXBzaG90KGNvbXBvbmVudDogQ29tcG9uZW50LCBwYXRoOiBzdHJpbmcpOiBNYXA8c3RyaW5nLCBJQ29tcG9uZW50UHJvcGVydHlTbmFwc2hvdD4ge1xuICAgICAgICBjb25zdCBzbmFwc2hvdHMgPSBuZXcgTWFwPHN0cmluZywgSUNvbXBvbmVudFByb3BlcnR5U25hcHNob3Q+KCk7XG4gICAgICAgIGlmICghY29tcG9uZW50Py5pc1ZhbGlkIHx8ICFjb21wb25lbnQubm9kZT8uaXNWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHNuYXBzaG90cztcbiAgICAgICAgfVxuXG4gICAgICAgIHNuYXBzaG90cy5zZXQoY29tcG9uZW50LnV1aWQsIHtcbiAgICAgICAgICAgIG5vZGVVdWlkOiBjb21wb25lbnQubm9kZS51dWlkLFxuICAgICAgICAgICAgbm9kZVBhdGg6IE5vZGVNZ3IuZ2V0Tm9kZVBhdGgoY29tcG9uZW50Lm5vZGUpID8/ICcnLFxuICAgICAgICAgICAgY29tcG9uZW50VXVpZDogY29tcG9uZW50LnV1aWQsXG4gICAgICAgICAgICBjb21wb25lbnRQYXRoOiBjb21wTWdyLmdldFBhdGhGcm9tVXVpZChjb21wb25lbnQudXVpZCkgPz8gJycsXG4gICAgICAgICAgICBjb21wb25lbnRJbmRleDogY29tcG9uZW50Lm5vZGUuY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudCksXG4gICAgICAgICAgICBjb21wb25lbnRUeXBlOiB0aGlzLl9nZXRDb21wb25lbnRUeXBlKGNvbXBvbmVudCksXG4gICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgZHVtcDogdGhpcy5fY2xvbmVTbmFwc2hvdER1bXAoZHVtcFV0aWwuZHVtcENvbXBvbmVudChjb21wb25lbnQpKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzbmFwc2hvdHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FwdHVyZUNvbXBvbmVudFByb3BlcnR5U25hcHNob3Qobm9kZTogTm9kZSwgcGF0aDogc3RyaW5nKTogTWFwPHN0cmluZywgSUNvbXBvbmVudFByb3BlcnR5U25hcHNob3Q+IHtcbiAgICAgICAgY29uc3Qgc25hcHNob3RzID0gbmV3IE1hcDxzdHJpbmcsIElDb21wb25lbnRQcm9wZXJ0eVNuYXBzaG90PigpO1xuICAgICAgICBpZiAoIW5vZGU/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzbmFwc2hvdHM7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5fcmVzb2x2ZUNvbXBvbmVudFByb3BlcnR5VGFyZ2V0KG5vZGUsIHBhdGgpO1xuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc25hcHNob3RzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzbmFwc2hvdHMuc2V0KGAke3RhcmdldC5jb21wb25lbnQudXVpZH06JHtwYXRofWAsIHtcbiAgICAgICAgICAgICAgICBub2RlVXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgIG5vZGVQYXRoOiBOb2RlTWdyLmdldE5vZGVQYXRoKG5vZGUpID8/ICcnLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudFV1aWQ6IHRhcmdldC5jb21wb25lbnQudXVpZCxcbiAgICAgICAgICAgICAgICBjb21wb25lbnRQYXRoOiBjb21wTWdyLmdldFBhdGhGcm9tVXVpZCh0YXJnZXQuY29tcG9uZW50LnV1aWQpID8/ICcnLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudEluZGV4OiB0YXJnZXQuaW5kZXgsXG4gICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZTogdGhpcy5fZ2V0Q29tcG9uZW50VHlwZSh0YXJnZXQuY29tcG9uZW50KSxcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgIGR1bXA6IHRoaXMuX2Nsb25lU25hcHNob3REdW1wKGR1bXBVdGlsLmR1bXBDb21wb25lbnQodGFyZ2V0LmNvbXBvbmVudCkpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyDmjZXojrflpLHotKXliJnor6XmrKHkv67mlLnkuI3kvJrov5sgdW5kbyDmoIjvvJrorrDlvZUgd2FybiDku6Xkvr/mjpLmn6XvvIhmYWlsIGxvdWTvvIlcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1VuZG9dIGNhcHR1cmUgY29tcG9uZW50IHByb3BlcnR5IHNuYXBzaG90IGZhaWxlZCBmb3IgXCIke3BhdGh9XCI6YCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzbmFwc2hvdHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY3JlYXRlQ29tcG9uZW50UHJvcGVydHlTbmFwc2hvdEFkYXB0ZXIoKTogSVNuYXBzaG90QWRhcHRlciB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYXB0dXJlOiBhc3luYyAoKSA9PiBuZXcgTWFwKCksXG4gICAgICAgICAgICBhcHBseTogYXN5bmMgKGRhdGE6IE1hcDxzdHJpbmcsIElDb21wb25lbnRQcm9wZXJ0eVNuYXBzaG90PikgPT4gdGhpcy5fYXBwbHlDb21wb25lbnRQcm9wZXJ0eVNuYXBzaG90cyhkYXRhKSxcbiAgICAgICAgICAgIGVxdWFsczogKGJlZm9yZTogTWFwPHN0cmluZywgSUNvbXBvbmVudFByb3BlcnR5U25hcHNob3Q+LCBhZnRlcjogTWFwPHN0cmluZywgSUNvbXBvbmVudFByb3BlcnR5U25hcHNob3Q+KSA9PiB0aGlzLl9zbmFwc2hvdE1hcHNFcXVhbChiZWZvcmUsIGFmdGVyKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9hcHBseUNvbXBvbmVudFByb3BlcnR5U25hcHNob3RzKGRhdGE6IE1hcDxzdHJpbmcsIElDb21wb25lbnRQcm9wZXJ0eVNuYXBzaG90Pik6IFByb21pc2U8SVVuZG9SZWRvUmVzdWx0PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHNuYXBzaG90IG9mIGRhdGEudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLl9maW5kU25hcHNob3RDb21wb25lbnQoc25hcHNob3QpO1xuICAgICAgICAgICAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IGBDb21wb25lbnQgbm90IGZvdW5kOiAke3NuYXBzaG90LmNvbXBvbmVudFBhdGggfHwgc25hcHNob3QuY29tcG9uZW50VXVpZH1gIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVzdG9yZUNvbXBvbmVudFNuYXBzaG90RHVtcChjb21wb25lbnQsIHNuYXBzaG90LmR1bXApO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBjb21wb25lbnQubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlRXZlbnRUeXBlLlNFVF9QUk9QRVJUWSxcbiAgICAgICAgICAgICAgICAgICAgcHJvcFBhdGg6IHNuYXBzaG90LnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ3VuZG8nLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZXNvbHZlQ29tcG9uZW50UHJvcGVydHlUYXJnZXQobm9kZTogTm9kZSwgcGF0aDogc3RyaW5nKTogSUNvbXBvbmVudFByb3BlcnR5VGFyZ2V0IHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gL15fX2NvbXBzX19cXC4oXFxkKykoPzpcXC58JCkvLmV4ZWMocGF0aCk7XG4gICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSBOdW1iZXIobWF0Y2hbMV0pO1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSBub2RlLmNvbXBvbmVudHNbaW5kZXhdIGFzIENvbXBvbmVudCB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKCFjb21wb25lbnQ/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgY29tcG9uZW50LCBpbmRleCB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZUNvbXBvbmVudEFuaW1hdGlvblByb3BQYXRoKG5vZGU6IE5vZGUsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuX3Jlc29sdmVDb21wb25lbnRQcm9wZXJ0eVRhcmdldChub2RlLCBwYXRoKTtcbiAgICAgICAgY29uc3QgcHJvcE5hbWUgPSBwYXRoLnJlcGxhY2UoL15fX2NvbXBzX19cXC5cXGQrXFwuPy8sICcnKTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50VHlwZSA9IHRhcmdldCA/IHRoaXMuX2dldENvbXBvbmVudFR5cGUodGFyZ2V0LmNvbXBvbmVudCkgOiAnJztcbiAgICAgICAgaWYgKCF0YXJnZXQgfHwgIXByb3BOYW1lIHx8ICFjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7Y29tcG9uZW50VHlwZX0uJHtwcm9wTmFtZX1gO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbmRTbmFwc2hvdENvbXBvbmVudChzbmFwc2hvdDogSUNvbXBvbmVudFByb3BlcnR5U25hcHNob3QpOiBDb21wb25lbnQgfCBudWxsIHtcbiAgICAgICAgY29uc3QgYnlVdWlkID0gY29tcE1nci5xdWVyeShzbmFwc2hvdC5jb21wb25lbnRVdWlkKSBhcyBDb21wb25lbnQgfCBudWxsO1xuICAgICAgICBpZiAoYnlVdWlkPy5pc1ZhbGlkICYmIGJ5VXVpZC5ub2RlPy5pc1ZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gYnlVdWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNuYXBzaG90LmNvbXBvbmVudFBhdGgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnlQYXRoID0gY29tcE1nci5xdWVyeUZyb21QYXRoKHNuYXBzaG90LmNvbXBvbmVudFBhdGgpIGFzIENvbXBvbmVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGJ5UGF0aD8uaXNWYWxpZCAmJiBieVBhdGgubm9kZT8uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYnlQYXRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIEZhbGwgYmFjayB0byB0aGUgY2FwdHVyZWQgbm9kZS9pbmRleCBiZWxvdy5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9maW5kU25hcHNob3ROb2RlKHNuYXBzaG90KTtcbiAgICAgICAgY29uc3QgYnlJbmRleCA9IG5vZGU/LmNvbXBvbmVudHNbc25hcHNob3QuY29tcG9uZW50SW5kZXhdIGFzIENvbXBvbmVudCB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGJ5SW5kZXg/LmlzVmFsaWQgJiYgdGhpcy5fZ2V0Q29tcG9uZW50VHlwZShieUluZGV4KSA9PT0gc25hcHNob3QuY29tcG9uZW50VHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIGJ5SW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9maW5kU25hcHNob3ROb2RlKHNuYXBzaG90OiBJQ29tcG9uZW50UHJvcGVydHlTbmFwc2hvdCk6IE5vZGUgfCBudWxsIHtcbiAgICAgICAgY29uc3QgYnlVdWlkID0gTm9kZU1nci5nZXROb2RlKHNuYXBzaG90Lm5vZGVVdWlkKSBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgaWYgKGJ5VXVpZD8uaXNWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJ5VXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc25hcHNob3Qubm9kZVBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGJ5UGF0aCA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChzbmFwc2hvdC5ub2RlUGF0aCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gYnlQYXRoPy5pc1ZhbGlkID8gYnlQYXRoIDogbnVsbDtcbiAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3NuYXBzaG90TWFwc0VxdWFsKGJlZm9yZTogTWFwPHN0cmluZywgYW55PiwgYWZ0ZXI6IE1hcDxzdHJpbmcsIGFueT4pOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHNuYXBzaG90TWFwc0VxdWFsKGJlZm9yZSwgYWZ0ZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Nsb25lU25hcHNob3REdW1wPFQ+KGR1bXA6IFQpOiBUIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZHVtcCkpIGFzIFQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVzdG9yZUNvbXBvbmVudFNuYXBzaG90RHVtcChjb21wb25lbnQ6IENvbXBvbmVudCwgZHVtcDogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHJlc3RvcmVDb21wb25lbnRTbmFwc2hvdER1bXAoY29tcG9uZW50LCBkdW1wKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRDb21wb25lbnRUeXBlKGNvbXBvbmVudDogQ29tcG9uZW50KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIChjYyBhcyBhbnkpLmpzPy5nZXRDbGFzc05hbWU/Lihjb21wb25lbnQuY29uc3RydWN0b3IpIHx8IGNvbXBvbmVudC5jb25zdHJ1Y3Rvcj8ubmFtZSB8fCAnJztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVVbmRvU25hcHNob3RJZCh0eXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gY3JlYXRlVW5kb0lkKHR5cGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouS4gOS4quiKgueCueeahOWunuS+i1xuICAgICAqIEBwYXJhbSB7Kn0gdXVpZFxuICAgICAqIEByZXR1cm4ge2NjLk5vZGV9XG4gICAgICovXG4gICAgcXVlcnlOb2RlKHV1aWQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IE5vZGUgfCBudWxsIHtcbiAgICAgICAgaWYgKHR5cGVvZiB1dWlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETyhxZ2gpOiBub2RlTWdy5bqU6K+l5re75YqgcXVlcnlSZWN5Y2xlTm9kZVxuICAgICAgICAvLyByZXR1cm4gTm9kZU1nci5nZXROb2RlKHV1aWQpID8/IE5vZGVNZ3IucXVlcnlSZWN5Y2xlTm9kZSh1dWlkKTtcbiAgICAgICAgcmV0dXJuIE5vZGVNZ3IuZ2V0Tm9kZSh1dWlkKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeUFsbCgpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhjYy5qcy5fcmVnaXN0ZXJlZENsYXNzTmFtZXMpO1xuICAgICAgICBjb25zdCBjb21wb25lbnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjY2xhc3MgPSBuZXcgY2MuanMuX3JlZ2lzdGVyZWRDbGFzc05hbWVzW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKGNjbGFzcyBpbnN0YW5jZW9mIGNjLkNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzLnB1c2goY2MuanMuZ2V0Q2xhc3NOYW1lKGNjbGFzcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudHM7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFzU2NyaXB0KG5hbWU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBjbGFzc2VzID0gYXdhaXQgdGhpcy5xdWVyeUNsYXNzZXMoKTtcbiAgICAgICAgcmV0dXJuIGNsYXNzZXMuc29tZSgoY2xzKSA9PiBjbHMubmFtZSA9PT0gbmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlDbGFzc2VzKG9wdGlvbnM/OiBJUXVlcnlDbGFzc2VzT3B0aW9ucyk6IFByb21pc2U8eyBuYW1lOiBzdHJpbmcgfVtdPiB7XG4gICAgICAgIGNvbnN0IGNsYXNzZXMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIGNjLmpzLl9yZWdpc3RlcmVkQ2xhc3NOYW1lcykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuZXh0ZW5kcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5leHRlbmRzID0gW29wdGlvbnMuZXh0ZW5kc107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN1YkNsYXNzID0gY2MuanMuX3JlZ2lzdGVyZWRDbGFzc05hbWVzW25hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgQXJyYXkuaXNBcnJheShvcHRpb25zLmV4dGVuZHMpICYmXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXh0ZW5kcy5zb21lKChleHRlbmQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VwZXJDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGV4dGVuZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0NoaWxkT3JTZWxmID0gY2MuanMuaXNDaGlsZENsYXNzT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5leGNsdWRlU2VsZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpc0NoaWxkT3JTZWxmICYmIHN1cGVyQ2xhc3MgIT09IHN1YkNsYXNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNDaGlsZE9yU2VsZjtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKHsgbmFtZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCh7IG5hbWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2xhc3NlcztcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeUZ1bmN0aW9uT2ZOb2RlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSByZXNvbHZlTm9kZUJ5UGF0aChwYXRoKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdldENvbXBvbmVudEZ1bmN0aW9uT2ZOb2RlKG5vZGUpO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5Q29tcG9uZW50cygpOiBQcm9taXNlPEFycmF5PHsgbmFtZTogc3RyaW5nOyBjaWQ6IHN0cmluZzsgcGF0aDogc3RyaW5nIH0+PiB7XG4gICAgICAgIC8vIFRPRE86IOmcgOimgeagueaNriBzZXR0aW5ncy9jb2Nvcy5jb25maWcuanNvbiDnmoQgaW5jbHVkZSBtb2R1bGVzIOaYr+WQpuWMheWQqyAzZCDlgZrov4fmu6RcbiAgICAgICAgLy8g5Y+C6ICDIGFwcC9idWlsdGluL3NjZW5lL3NvdXJjZS9zY3JpcHQvM2QvbWFuYWdlci9zY2VuZS9zY2VuZS1tYW5hZ2VyLnRzXG4gICAgICAgIGNvbnN0IG1lbnVzID0gRWRpdG9yRXh0ZW5kcy5Db21wb25lbnQuZ2V0TWVudXMoKTtcbiAgICAgICAgaWYgKG1lbnVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBtZW51cy5tYXAoKGl0ZW06IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBjYy5qcy5nZXRDbGFzc05hbWUoaXRlbS5jb21wb25lbnQpLFxuICAgICAgICAgICAgICAgIGNpZDogY2MuanMuZ2V0Q2xhc3NJZChpdGVtLmNvbXBvbmVudCksXG4gICAgICAgICAgICAgICAgcGF0aDogaXRlbS5tZW51UGF0aCxcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiDov5nkuKrmmK/lhZzlupXnmoTvvIznrYkgRWRpdG9yRXh0ZW5kcy5Db21wb25lbnQuZ2V0TWVudXMoKSDlrozlhajlrp7njrDkuobkuYvlkI7lsLHlj6/ku6XliKDpmaTkuoZcbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IGF3YWl0IHRoaXMucXVlcnlDbGFzc2VzKHsgZXh0ZW5kczogJ2NjLkNvbXBvbmVudCcsIGV4Y2x1ZGVTZWxmOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gY2xhc3Nlcy5tYXAoY2xzID0+ICh7XG4gICAgICAgICAgICBuYW1lOiBjbHMubmFtZSxcbiAgICAgICAgICAgIGNpZDogJycsXG4gICAgICAgICAgICBwYXRoOiBjbHMubmFtZSxcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbml0KCkge1xuICAgICAgICB0aGlzLnJlZ2lzdGVyQ29tcE1nckV2ZW50cygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVhZG9ubHkgQ29tcE1nckV2ZW50SGFuZGxlcnMgPSB7XG4gICAgICAgIFsnYWRkJ106ICdvbkNvbXBBZGQnLFxuICAgICAgICBbJ3JlbW92ZSddOiAnb25Db21wUmVtb3ZlJyxcbiAgICB9IGFzIGNvbnN0O1xuICAgIHByaXZhdGUgY29tcE1nckV2ZW50SGFuZGxlcnMgPSBuZXcgTWFwPHN0cmluZywgKC4uLmFyZ3M6IFtdKSA9PiB2b2lkPigpO1xuICAgIC8qKlxuICAgICAqIOazqOWGjOW8leaTjiBOb2RlIOeuoeeQhuebuOWFs+S6i+S7tueahOebkeWQrFxuICAgICAqL1xuICAgIHJlZ2lzdGVyQ29tcE1nckV2ZW50cygpIHtcbiAgICAgICAgdGhpcy51bnJlZ2lzdGVyQ29tcE1nckV2ZW50cygpO1xuICAgICAgICBPYmplY3QuZW50cmllcyh0aGlzLkNvbXBNZ3JFdmVudEhhbmRsZXJzKS5mb3JFYWNoKChbZXZlbnRUeXBlLCBoYW5kbGVyTmFtZV0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSAodGhpcyBhcyBhbnkpW2hhbmRsZXJOYW1lXS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgRWRpdG9yRXh0ZW5kcy5Db21wb25lbnQub24oZXZlbnRUeXBlLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIHRoaXMuY29tcE1nckV2ZW50SGFuZGxlcnMuc2V0KGV2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVucmVnaXN0ZXJDb21wTWdyRXZlbnRzKCkge1xuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLkNvbXBNZ3JFdmVudEhhbmRsZXJzKS5mb3JFYWNoKGV2ZW50VHlwZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5jb21wTWdyRXZlbnRIYW5kbGVycy5nZXQoZXZlbnRUeXBlKTtcbiAgICAgICAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yRXh0ZW5kcy5Db21wb25lbnQub2ZmKGV2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wTWdyRXZlbnRIYW5kbGVycy5kZWxldGUoZXZlbnRUeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5re75Yqg5Yiw57uE5Lu257yT5a2YXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHV1aWRcbiAgICAgKiBAcGFyYW0ge2NjLkNvbXBvbmVudH0gY29tcG9uZW50XG4gICAgICovXG4gICAgb25Db21wQWRkKHV1aWQ6IHN0cmluZywgY29tcG9uZW50OiBDb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGlzRWRpdG9yTm9kZShjb21wb25lbnQubm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVtaXQoJ2NvbXBvbmVudDphZGRlZCcsIGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog56e76Zmk57uE5Lu257yT5a2YXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHV1aWRcbiAgICAgKiBAcGFyYW0ge2NjLkNvbXBvbmVudH0gY29tcG9uZW50XG4gICAgICovXG4gICAgb25Db21wUmVtb3ZlKHV1aWQ6IHN0cmluZywgY29tcG9uZW50OiBDb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGlzRWRpdG9yTm9kZShjb21wb25lbnQubm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVtaXQoJ2NvbXBvbmVudDpyZW1vdmVkJywgY29tcG9uZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDph43nva7nu4Tku7ZcbiAgICAgKiBAcGFyYW0gdXVpZCBjb21wb25lbnQg55qEIHV1aWRcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVzZXQocGFyYW1zOiBJUXVlcnlDb21wb25lbnRPcHRpb25zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb21wID0gYXdhaXQgdGhpcy5maW5kQ29tcG9uZW50KHBhcmFtcy5wYXRoKTtcbiAgICAgICAgICAgIGlmICghY29tcCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgUmVzZXQgQ29tcG9uZW50IGZhaWxlZDogJHtwYXJhbXMucGF0aH0gZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb3JkQ29tcG9uZW50U25hcHNob3QoY29tcCwge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnUmVzZXQgQ29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50OnJlc2V0JyxcbiAgICAgICAgICAgIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIGNvbXAubm9kZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY29tcE1nci5yZXNldENvbXBvbmVudChjb21wKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgY29tcC5ub2RlLCB7IHR5cGU6IE5vZGVFdmVudFR5cGUuUkVTRVRfQ09NUE9ORU5UIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGUpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHJlY2FsY3VsYXRlTE9ER3JvdXBCb3VuZHMoXG4gICAgICAgIG9wdGlvbnM6IElSZWNhbGN1bGF0ZUxPREdyb3VwQm91bmRzT3B0aW9ucyxcbiAgICApOiBQcm9taXNlPElMT0RHcm91cEJvdW5kc1Jlc3VsdD4ge1xuICAgICAgICBjb25zdCBjb21wID0gcmVxdWlyZUxPREdyb3VwKGF3YWl0IHRoaXMuZmluZENvbXBvbmVudChvcHRpb25zLnBhdGgpLCBvcHRpb25zLnBhdGgpO1xuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gY29tcC5ub2RlLmNvbXBvbmVudHMuaW5kZXhPZihjb21wKTtcbiAgICAgICAgYXdhaXQgdGhpcy5fcmVjb3JkQ29tcG9uZW50U25hcHNob3QoY29tcCwge1xuICAgICAgICAgICAgbGFiZWw6ICdSZWNhbGN1bGF0ZSBMT0RHcm91cCBCb3VuZHMnLFxuICAgICAgICAgICAgdHlwZTogJ2NvbXBvbmVudDpyZWNhbGN1bGF0ZS1sb2QtZ3JvdXAtYm91bmRzJyxcbiAgICAgICAgICAgIHBhdGg6IGNvbXBvbmVudEluZGV4ID49IDAgPyBgX19jb21wc19fLiR7Y29tcG9uZW50SW5kZXh9YCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJlY29yZDogb3B0aW9ucy5yZWNvcmQsXG4gICAgICAgIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbXAucmVjYWxjdWxhdGVCb3VuZHMoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2VyaWFsaXplTE9ER3JvdXBCb3VuZHMoY29tcCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGluc2VydExPRChvcHRpb25zOiBJSW5zZXJ0TE9ET3B0aW9ucyk6IFByb21pc2U8SUxPREdyb3VwTGV2ZWxzUmVzdWx0PiB7XG4gICAgICAgIGNvbnN0IGNvbXAgPSByZXF1aXJlTE9ER3JvdXAoYXdhaXQgdGhpcy5maW5kQ29tcG9uZW50KG9wdGlvbnMucGF0aCksIG9wdGlvbnMucGF0aCk7XG4gICAgICAgIHZhbGlkYXRlTE9ESW5zZXJ0KGNvbXAsIG9wdGlvbnMuaW5kZXgsIG9wdGlvbnMuc2NyZWVuVXNhZ2VQZXJjZW50YWdlKTtcblxuICAgICAgICBjb25zdCBjb21wb25lbnRJbmRleCA9IGNvbXAubm9kZS5jb21wb25lbnRzLmluZGV4T2YoY29tcCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3JlY29yZENvbXBvbmVudFNuYXBzaG90KGNvbXAsIHtcbiAgICAgICAgICAgIGxhYmVsOiAnSW5zZXJ0IExPRCcsXG4gICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50Omluc2VydC1sb2QnLFxuICAgICAgICAgICAgcGF0aDogY29tcG9uZW50SW5kZXggPj0gMCA/IGBfX2NvbXBzX18uJHtjb21wb25lbnRJbmRleH1gIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVjb3JkOiBvcHRpb25zLnJlY29yZCxcbiAgICAgICAgfSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29tcC5pbnNlcnRMT0Qob3B0aW9ucy5pbmRleCwgb3B0aW9ucy5zY3JlZW5Vc2FnZVBlcmNlbnRhZ2UpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZXJpYWxpemVMT0RHcm91cExldmVscyhjb21wKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZXJhc2VMT0Qob3B0aW9uczogSUVyYXNlTE9ET3B0aW9ucyk6IFByb21pc2U8SUxPREdyb3VwTGV2ZWxzUmVzdWx0PiB7XG4gICAgICAgIGNvbnN0IGNvbXAgPSByZXF1aXJlTE9ER3JvdXAoYXdhaXQgdGhpcy5maW5kQ29tcG9uZW50KG9wdGlvbnMucGF0aCksIG9wdGlvbnMucGF0aCk7XG4gICAgICAgIHZhbGlkYXRlTE9ERXJhc2UoY29tcCwgb3B0aW9ucy5pbmRleCk7XG5cbiAgICAgICAgY29uc3QgY29tcG9uZW50SW5kZXggPSBjb21wLm5vZGUuY29tcG9uZW50cy5pbmRleE9mKGNvbXApO1xuICAgICAgICBhd2FpdCB0aGlzLl9yZWNvcmRDb21wb25lbnRTbmFwc2hvdChjb21wLCB7XG4gICAgICAgICAgICBsYWJlbDogJ0VyYXNlIExPRCcsXG4gICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50OmVyYXNlLWxvZCcsXG4gICAgICAgICAgICBwYXRoOiBjb21wb25lbnRJbmRleCA+PSAwID8gYF9fY29tcHNfXy4ke2NvbXBvbmVudEluZGV4fWAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICByZWNvcmQ6IG9wdGlvbnMucmVjb3JkLFxuICAgICAgICB9LCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb21wLmVyYXNlTE9EKG9wdGlvbnMuaW5kZXgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZXJpYWxpemVMT0RHcm91cExldmVscyhjb21wKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcXVlcnlMT0RHcm91cFJlbGF0aXZlSGVpZ2h0KFxuICAgICAgICBvcHRpb25zOiBJUXVlcnlMT0RHcm91cFJlbGF0aXZlSGVpZ2h0T3B0aW9ucyxcbiAgICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICBjb25zdCBjb21wID0gcmVxdWlyZUxPREdyb3VwKGF3YWl0IHRoaXMuZmluZENvbXBvbmVudChvcHRpb25zLnBhdGgpLCBvcHRpb25zLnBhdGgpO1xuICAgICAgICAvLyBJQ2FtZXJhU2VydmljZSDku4Xlo7DmmI7lhazlvIDog73lipvvvJvlnLrmma/ov5vnqIvlrp7njrDpop3lpJbmj5DkvpvnvJbovpHlmaggQ2FtZXJhIOe7hOS7tuOAglxuICAgICAgICBjb25zdCBlZGl0b3JDYW1lcmEgPSAoU2VydmljZS5DYW1lcmEgYXMgYW55KS5nZXRDYW1lcmE/LigpO1xuICAgICAgICBjb25zdCByZW5kZXJDYW1lcmEgPSBlZGl0b3JDYW1lcmE/LmNhbWVyYTtcbiAgICAgICAgaWYgKCFyZW5kZXJDYW1lcmEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRWRpdG9yIGNhbWVyYSBpcyBub3QgcmVhZHknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gcXVlcnlMT0RHcm91cFJlbGF0aXZlSGVpZ2h0KGNvbXAsIHJlbmRlckNhbWVyYSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtlcnJvci5tZXNzYWdlfTogJHtvcHRpb25zLnBhdGh9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBleGVjdXRlTWV0aG9kKG9wdGlvbnM6IElFeGVjdXRlQ29tcG9uZW50TWV0aG9kT3B0aW9ucyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGNvbXAgPSBjb21wTWdyLnF1ZXJ5RnJvbVBhdGgob3B0aW9ucy5wYXRoKTtcbiAgICAgICAgaWYgKCFjb21wKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgY29tcE1nci5leGVjdXRlQ29tcG9uZW50TWV0aG9kKGNvbXAudXVpZCwgb3B0aW9ucy5uYW1lLCBvcHRpb25zLmFyZ3MpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQYXRoQnlVdWlkKHV1aWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBjb21wTWdyLmdldFBhdGhGcm9tVXVpZCh1dWlkKTtcbiAgICB9XG59XG4iXX0=