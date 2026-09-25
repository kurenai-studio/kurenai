"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabService = void 0;
const core_1 = require("./core");
const cc_1 = require("cc");
const component_1 = require("./prefab/component");
const node_1 = require("./prefab/node");
const utils_1 = require("./prefab/utils");
const validate_params_1 = require("./prefab/validate-params");
const utils_2 = require("./scene/utils");
const rpc_1 = require("../rpc");
const prefab_undo_1 = require("./prefab/prefab-undo");
const soft_reload_1 = require("./prefab/soft-reload");
function getCurrentEditorSession() {
    return (0, core_1.queryRegisteredService)('Editor')?.getEditorSession() ?? { uuid: null, generation: 0 };
}
let PrefabService = class PrefabService extends core_1.BaseService {
    _softReload = new soft_reload_1.PrefabSoftReloadScheduler((params, session) => {
        const editor = (0, core_1.queryRegisteredService)('Editor');
        if (session && editor) {
            return editor.reloadForSession(params, session);
        }
        return core_1.Service.Editor.reload(params);
    }, (uuid) => core_1.ServiceEvents.emit('prefab:asset-reload', uuid), getCurrentEditorSession);
    _undo = new prefab_undo_1.PrefabUndoHelper();
    _utils = utils_1.prefabUtils;
    init() { }
    /**
     * 将节点转换为预制体资源
     */
    async createPrefabFromNode(params) {
        try {
            await this._softReload.waitForIdle();
            (0, validate_params_1.validateCreatePrefabParams)(params);
            const nodeUuid = EditorExtends.Node.getNodeUuidByPathOrThrow(params.nodePath);
            const assetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [params.dbURL]);
            if (!params.overwrite && assetInfo && assetInfo.type === 'cc.Prefab') {
                throw new Error(`已有同名 ${assetInfo.url} 预制体。操作冲突，禁止重试相同命令。请尝试重命名或检查目录。`);
            }
            const sourceNode = EditorExtends.Node.getNode(nodeUuid);
            const before = this._undo.captureSnapshot(sourceNode);
            const node = await this.createPrefabAssetFromNode(nodeUuid, params.dbURL, {
                overwrite: !!params.overwrite,
            });
            if (!node) {
                throw new Error('创建预制体资源失败，返回结果为 null');
            }
            const after = this._undo.captureSnapshot(node);
            this._undo.pushNodeStructureCommand('prefab:create', 'Create Prefab', before, after);
            return await utils_2.sceneUtils.generateNodeDump(node);
        }
        catch (e) {
            console.error(`创建预制体失败: 节点路径: ${params.nodePath} 资源 URL: ${params.dbURL} 错误信息:`, e);
            throw e;
        }
    }
    /**
     * 将节点的修改应用回预制体资源
     */
    async applyPrefabChanges(params) {
        try {
            await this._softReload.waitForIdle();
            (0, validate_params_1.validateNodePathParams)(params);
            const node = EditorExtends.Node.getNodeByPathOrThrow(params.nodePath);
            const prefabInfo = utils_1.prefabUtils.getPrefab(node);
            if (!prefabInfo) {
                throw new Error(`该节点 '${params.nodePath}' 不是预制体`);
            }
            const before = this._undo.captureSnapshot(node);
            const prefabAssetUuid = prefabInfo.asset?._uuid;
            const shouldWaitForReload = !!prefabAssetUuid
                && node_1.nodeOperation.assetToNodesMap.has(prefabAssetUuid)
                && await core_1.Service.Editor.hasOpen();
            const reloadWaiter = prefabAssetUuid && shouldWaitForReload
                ? this._softReload.waitForAssetReload(prefabAssetUuid)
                : null;
            if (prefabAssetUuid) {
                this._undo.preserveUndoHistoryForPrefabReload(prefabAssetUuid, getCurrentEditorSession());
            }
            try {
                const applyInfo = await node_1.nodeOperation.applyPrefab(node.uuid);
                if (!applyInfo) {
                    reloadWaiter?.cancel();
                    if (prefabAssetUuid) {
                        this._undo.cancelPreserveUndoHistoryForPrefabReload(prefabAssetUuid);
                    }
                    return false;
                }
                await reloadWaiter?.promise;
                const afterNode = this._undo.findNode(params.nodePath, node.uuid);
                const after = this._undo.captureSnapshot(afterNode);
                this._undo.pushApplyCommand('prefab:apply', 'Apply Prefab Changes', before, after, applyInfo.assetUuid, applyInfo.assetSource, applyInfo.oldPrefabContent, applyInfo.newPrefabContent);
                return true;
            }
            catch (error) {
                reloadWaiter?.cancel();
                if (prefabAssetUuid) {
                    this._undo.cancelPreserveUndoHistoryForPrefabReload(prefabAssetUuid);
                }
                throw error;
            }
        }
        catch (e) {
            console.error(`应用回预制体资源失败: 节点路径: ${params.nodePath} 错误信息:`, e);
            throw e;
        }
    }
    /**
     * 重置节点到预制体原始状态
     */
    async revertToPrefab(params) {
        try {
            await this._softReload.waitForIdle();
            (0, validate_params_1.validateNodePathParams)(params);
            const node = EditorExtends.Node.getNodeByPathOrThrow(params.nodePath);
            const before = this._undo.captureSnapshot(node);
            const result = await this.revertPrefab(node);
            const afterNode = this._undo.findNode(params.nodePath, node.uuid);
            const after = this._undo.captureSnapshot(afterNode);
            this._undo.pushNodeStructureCommand('prefab:revert', 'Revert Prefab', before, after);
            return result;
        }
        catch (e) {
            console.error(`重置节点到预制体原始状态失败：节点路径 ${params.nodePath} 错误信息:`, e);
            throw e;
        }
    }
    /**
     * 解耦预制体实例，使其成为普通节点
     */
    async unpackPrefabInstance(params) {
        try {
            await this._softReload.waitForIdle();
            (0, validate_params_1.validateNodePathParams)(params);
            const node = EditorExtends.Node.getNodeByPathOrThrow(params.nodePath);
            if (!utils_1.prefabUtils.getPrefab(node)?.instance) {
                throw new Error(`${params.nodePath} 是普通节点`);
            }
            const before = this._undo.captureSnapshot(node);
            this.unWrapPrefabInstance(node.uuid, !!params.recursive);
            const afterNode = this._undo.findNode(params.nodePath, node.uuid);
            const after = this._undo.captureSnapshot(afterNode);
            this._undo.pushUnwrapCommand('prefab:unpack', 'Unpack Prefab Instance', before, after, !!params.recursive);
            return await utils_2.sceneUtils.generateNodeDump(node);
        }
        catch (e) {
            console.error(`解耦为普通节点失败：节点路径 ${params.nodePath} 是否递归: ${params.recursive} 错误信息:`, e);
            throw e;
        }
    }
    /**
     * 检查节点是否为预制体实例
     */
    async isPrefabInstance(params) {
        try {
            const node = EditorExtends.Node.getNodeByPathOrThrow(params.nodePath);
            return !!utils_1.prefabUtils.getPrefab(node)?.instance;
        }
        catch (e) {
            console.error(`检查节点是否预制体实例失败：节点路径 ${params.nodePath} 错误信息:`, e);
            throw e;
        }
    }
    /**
     * 解绑预制体实例，使其成为普通节点
     */
    async unlinkPrefab(params) {
        try {
            await this._softReload.waitForIdle();
            (0, validate_params_1.validateNodePathParams)(params);
            const node = EditorExtends.Node.getNodeByPathOrThrow(params.nodePath);
            const before = this._undo.captureSnapshot(node);
            this.unWrapPrefabInstance(node.uuid, !!params.removeNested);
            const afterNode = this._undo.findNode(params.nodePath, node.uuid);
            const after = this._undo.captureSnapshot(afterNode);
            this._undo.pushUnwrapCommand('prefab:unlink', 'Unlink Prefab', before, after, !!params.removeNested);
            return true;
        }
        catch (e) {
            console.error(`解绑预制体失败：节点路径 ${params.nodePath} 是否递归: ${params.removeNested} 错误信息:`, e);
            throw e;
        }
    }
    /**
     * 获取节点的预制体信息
     */
    async getPrefabInfo(params) {
        try {
            const node = EditorExtends.Node.getNodeByPathOrThrow(params.nodePath);
            const prefabInfo = utils_1.prefabUtils.getPrefab(node);
            if (!prefabInfo) {
                return null;
            }
            return utils_2.sceneUtils.generatePrefabDump(node);
        }
        catch (e) {
            console.error(`获取节点的预制体信息失败：节点路径 ${params.nodePath} 错误信息:`, e);
            throw e;
        }
    }
    /////////////////////////
    // node operation
    ////////////////////////
    onEditorOpened() {
        node_1.nodeOperation.onEditorOpened();
    }
    onEditorDisposed() {
        this._softReload.invalidate();
    }
    onNodeRemoved(node) {
        node_1.nodeOperation.onNodeRemoved(node);
    }
    onNodeChangedInGeneralMode(node, opts, root) {
        node_1.nodeOperation.onNodeChangedInGeneralMode(node, opts, root);
    }
    onAddNode(node) {
        node_1.nodeOperation.onAddNode(node);
    }
    onNodeAdded(node) {
        node_1.nodeOperation.onNodeAdded(node);
    }
    onNodeChanged(node, opts = {}) {
        this.onNodeChangedInGeneralMode(node, opts, core_1.Service.Editor.getRootNode());
    }
    onSetPropertyComponent(comp, opts = {}) {
        this.onNodeChangedInGeneralMode(comp.node, opts, core_1.Service.Editor.getRootNode());
    }
    removePrefabInfoFromNode(node, removeNested) {
        node_1.nodeOperation.removePrefabInfoFromNode(node, removeNested);
    }
    checkToRemoveTargetOverride(source, root) {
        utils_1.prefabUtils.checkToRemoveTargetOverride(source, root);
    }
    /**
     * 从一个节点生成一个PrefabAsset
     * @param nodeUUID
     * @param url
     * @param options
     */
    async createPrefabAssetFromNode(nodeUUID, url, options = { overwrite: true }) {
        return await node_1.nodeOperation.createPrefabAssetFromNode(nodeUUID, url, options);
    }
    /**
     * 将一个 node 与一个 prefab 关联到一起
     * @param nodeUUID
     * @param {*} assetUuid 关联的资源
     */
    async linkNodeWithPrefabAsset(nodeUUID, assetUuid) {
        await node_1.nodeOperation.linkNodeWithPrefabAsset(nodeUUID, assetUuid);
    }
    /**
     * 从一个节点生成 prefab数据
     * 返回序列化数据
     * @param {*} nodeUUID
     */
    generatePrefabDataFromNode(nodeUUID) {
        return utils_1.prefabUtils.generatePrefabDataFromNode(nodeUUID);
    }
    /**
     * 还原一个PrefabInstance的数据为它所关联的PrefabAsset
     * @param nodeUUID node
     */
    async revertPrefab(nodeUUID) {
        return node_1.nodeOperation.revertPrefab(nodeUUID);
    }
    // 获取unlinkPrefab会影响到的uuid
    getUnlinkNodeUuids(uuid, removeNested) {
        const uuids = [];
        const node = EditorExtends.Node.getNode(uuid);
        function collectUuids(node) {
            const prefabInfo = utils_1.prefabUtils.getPrefab(node);
            if (removeNested) {
                uuids.push(node.uuid);
                node.children.forEach((child) => {
                    collectUuids(child);
                });
            }
            else if (prefabInfo) {
                if (!prefabInfo.instance) {
                    uuids.push(node.uuid);
                    node.children.forEach((child) => {
                        collectUuids(child);
                    });
                }
            }
        }
        if (node) {
            uuids.push(uuid);
            node.children.forEach((child) => {
                collectUuids(child);
            });
        }
        return uuids;
    }
    /**
     * 解除PrefabInstance对PrefabAsset的关联
     * @param nodeUUID 节点或节点的UUID
     * @param removeNested 是否递归的解除子节点PrefabInstance
     */
    unWrapPrefabInstance(nodeUUID, removeNested) {
        return node_1.nodeOperation.unWrapPrefabInstance(nodeUUID, removeNested);
    }
    // 在Prefab编辑模式下不能移除prefabInfo，只需要移除instance
    unWrapPrefabInstanceInPrefabMode(nodeUUID, removeNested) {
        return node_1.nodeOperation.unWrapPrefabInstanceInPrefabMode(nodeUUID, removeNested);
    }
    /**
     * 将一个PrefabInstance的数据应用到对应的Asset资源上
     * @param nodeUUID uuid
     */
    async applyPrefab(nodeUUID) {
        return !!(await node_1.nodeOperation.applyPrefab(nodeUUID));
    }
    preserveUndoHistoryForPrefabReload(assetUuid, editorUuid = null) {
        const session = getCurrentEditorSession();
        this._undo.preserveUndoHistoryForPrefabReload(assetUuid, {
            uuid: editorUuid ?? session.uuid,
            generation: session.generation,
        });
    }
    cancelPreserveUndoHistoryForPrefabReload(assetUuid) {
        this._undo.cancelPreserveUndoHistoryForPrefabReload(assetUuid);
    }
    /// /////////////////////
    // components operation
    ////////////////////////
    onAddComponent(comp) {
        component_1.componentOperation.onAddComponent(comp);
    }
    onComponentAdded(comp) {
        component_1.componentOperation.onComponentAdded(comp);
    }
    // 编辑器主动删除Component时调用
    onRemoveComponentInGeneralMode(comp, rootNode) {
        component_1.componentOperation.onRemoveComponentInGeneralMode(comp, rootNode);
    }
    // Component被删除时调用，当根节点删除时，所有子节点的Component删除事件也会触发到这里
    onComponentRemovedInGeneralMode(comp, rootNode) {
        component_1.componentOperation.onComponentRemovedInGeneralMode(comp, rootNode);
    }
    async revertRemovedComponent(nodeUUID, fileID) {
        const node = EditorExtends.Node.getNode(nodeUUID);
        const before = this._undo.captureSnapshot(node);
        await component_1.componentOperation.revertRemovedComponent(nodeUUID, fileID);
        const after = this._undo.captureSnapshot(EditorExtends.Node.getNode(nodeUUID));
        this._undo.pushNodeStructureCommand('prefab:revert-removed-component', 'Revert Removed Component', before, after);
    }
    async applyRemovedComponent(nodeUUID, fileID) {
        const node = EditorExtends.Node.getNode(nodeUUID);
        const before = this._undo.captureSnapshot(node);
        await component_1.componentOperation.applyRemovedComponent(nodeUUID, fileID);
        const after = this._undo.captureSnapshot(EditorExtends.Node.getNode(nodeUUID));
        this._undo.pushNodeStructureCommand('prefab:apply-removed-component', 'Apply Removed Component', before, after);
    }
    async onAssetChanged(uuid) {
        const reloadState = this._undo.consumePreserveUndoHistoryForPrefabReload(uuid);
        const session = getCurrentEditorSession();
        // prefab 资源的变动，softReload场景
        if (node_1.nodeOperation.assetToNodesMap.has(uuid) && await core_1.Service.Editor.hasOpen()) {
            this._softReload.schedule({
                changedUuid: uuid,
                preserveUndoHistory: reloadState.preserveUndoHistory || !!core_1.Service.Undo?.isDirty?.(),
                editorSession: reloadState.editorSession ?? { uuid: session.uuid, generation: session.generation },
            });
        }
    }
    async onAssetDeleted(uuid) {
        this._undo.consumePreserveUndoHistoryForPrefabReload(uuid);
        const session = getCurrentEditorSession();
        if (node_1.nodeOperation.assetToNodesMap.has(uuid) && await core_1.Service.Editor.hasOpen()) {
            this._softReload.schedule({
                deletedUuid: uuid,
                editorSession: session,
            });
        }
    }
    /**
     * 将一个节点恢复到关联的 prefab 的状态
     * @param {*} nodeUuid
     */
    revert(nodeUuid) { }
    /**
     * 将一个节点的修改，应用到关联的 prefab 上
     * @param {*} nodeUuid
     */
    sync(nodeUuid) { }
    createNodeFromPrefabAsset(asset) {
        const node = (0, cc_1.instantiate)(asset);
        // @ts-ignore
        const prefabInfo = node['_prefab'];
        if (!prefabInfo) {
            console.error('Not a Prefab Asset:', asset.uuid);
            return null;
        }
        if (!prefabInfo.instance) {
            prefabInfo.instance = utils_1.prefabUtils.createPrefabInstance();
        }
        return node;
    }
    // TODO: apply单个属性的override到prefabAsset
    filterChildOfAssetOfPrefabInstance(uuids, operationTips) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        const filterUUIDs = [];
        for (const uuid of uuids) {
            const node = EditorExtends.Node.getNode(uuid);
            // 增加容错
            if (!node) {
                continue;
            }
            // 是当前环境下的mountedChildren，就不算是资源里的
            if (utils_1.prefabUtils.isOutmostPrefabInstanceMountedChildren(node)) {
                filterUUIDs.push(uuid);
                continue;
            }
            if (!utils_1.prefabUtils.isPrefabInstanceRoot(node) && utils_1.prefabUtils.isPartOfAssetInPrefabInstance(node)) {
                console.warn(`Node [${node.name}] is a prefab child of prefabInstance [${node['_prefab']?.root?.name}], ${operationTips}`);
                // 消除其它面板的等待操作，例如hierarchy操作节点时会先进入等待状态，如果没有node的change消息，就会一直处于等待状态。
                core_1.ServiceEvents.emit('node:change', node);
                continue;
            }
            filterUUIDs.push(uuid);
        }
        return filterUUIDs;
    }
    filterPartOfPrefabAsset(uuids, operationTips) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        const filterUUIDs = [];
        for (const uuid of uuids) {
            const node = EditorExtends.Node.getNode(uuid);
            // 增加容错
            if (!node) {
                continue;
            }
            if (utils_1.prefabUtils.isPartOfAssetInPrefabInstance(node)) {
                console.warn(`Node [${node.name}] is part of prefabInstance [${node['_prefab']?.root?.name}], ${operationTips}`);
                // 消除其它面板的等待操作，例如hierarchy操作节点时会先进入等待状态，如果没有node的change消息，就会一直处于等待状态。
                core_1.ServiceEvents.emit('node:change', node);
                continue;
            }
            filterUUIDs.push(uuid);
        }
        return filterUUIDs;
    }
    // PrefabInstance的Prefab子节点不能删除
    filterChildOfPrefabAssetWhenRemoveNode(uuids) {
        return this.filterChildOfAssetOfPrefabInstance(uuids, 'it\'s not allowed to delete in current context, you can delete it in it\'s prefabAsset or \
        do it after unlink prefab from root node');
    }
    filterChildOfPrefabAssetWhenSetParent(uuids) {
        return this.filterChildOfAssetOfPrefabInstance(uuids, 'it\'s not allowed to change parent in current context, you can modify it in it\'s prefabAsset or \
        do it after unlink prefab from root node');
    }
    canModifySibling(uuid, target, offset) {
        // 不需要移动
        if (offset === 0) {
            return false;
        }
        // 传入的是一个父节点ID
        const node = EditorExtends.Node.getNode(uuid);
        // 增加容错
        if (!node) {
            return false;
        }
        // 保处理在PrefabInstance下的属于PrefabAsset中的节点
        if (node['_prefab'] && utils_1.prefabUtils.isPartOfPrefabAsset(node) && node['_prefab']?.root?.['_prefab']?.instance && node.children) {
            // 过滤在hierarchy隐藏的节点
            const filterHiddenChildren = node.children.filter((child) => !(child.objFlags & cc.Object.Flags.HideInHierarchy));
            const child = node.children[target];
            if (!child) {
                return false;
            }
            let isAddedChild = true;
            if (child['_prefab']) {
                const prefabState = utils_1.prefabUtils.getPrefabStateInfo(child);
                isAddedChild = prefabState.isAddedChild;
                // 如果要移动的节点是一个Prefab的子节点
                if (!isAddedChild) {
                    console.warn(`Node [${child.name}] is a prefab child of prefabInstance [${child['_prefab'].root?.name}], \
                    it's not allowed to modify hierarchy in current context, you can modify it in it's prefabAsset or do it after unlink prefab from root node`);
                    // 消除其它面板的等待操作，例如hierarchy操作节点时会先进入等待状态，如果没有node的change消息，就会一直处于等待状态。
                    core_1.ServiceEvents.emit('node:change', child);
                    return false;
                }
            }
            // 找出要移动的节点在没有过滤掉隐藏节点的场景中的位置
            const targetChild = filterHiddenChildren[target + offset];
            if (isAddedChild && targetChild['_prefab']) {
                console.warn(`Node [${targetChild.name}] is a prefab child of prefabInstance [${targetChild['_prefab'].root?.name}], \
                it's not allowed to modify hierarchy in current context, you can modify it in it's prefabAsset or do it after unlink prefab from root node`);
                // 消除其它面板的等待操作，例如hierarchy操作节点时会先进入等待状态，如果没有node的change消息，就会一直处于等待状态。
                core_1.ServiceEvents.broadcast('scene:change-node', EditorExtends.Node.getNodePath(child));
                return false;
            }
        }
        return true;
    }
    filterPartOfPrefabAssetWhenCreateComponent(uuids) {
        return this.filterPartOfPrefabAsset(uuids, 'it\'s not allow to add component in current context currently, you can add component in it\'s prefabAsset or \
        do it after unlink prefab from root node');
    }
    filterPartOfPrefabAssetWhenRemoveComponent(uuids) {
        return this.filterPartOfPrefabAsset(uuids, 'it\'s not allow to remove component in current context currently, you can remove component in it\'s prefabAsset or \
        do it after unlink prefab from root node');
    }
    /**
     * 暴力遍历root所有属性，找到rule返回true的路径
     * 比如找Scene节点的路径，rule = (obj)=> return obj.globals
     * @param root 根节点
     * @param rule 判断函数
     * @returns
     */
    findPathWithRule(root, rule) {
        const path = [];
        const cache = new Map();
        const walk = function (obj, prekey) {
            const keys = Object.keys(obj);
            keys.forEach(key => {
                if (typeof (obj[key]) === 'object' && obj[key]) {
                    // @ts-ignore
                    if (!cache.get(obj[key])) {
                        cache.set(obj[key], true);
                        if (rule(obj[key])) {
                            console.log('找到了', prekey + '|' + key);
                            path.push(prekey + '|' + key);
                        }
                        else {
                            walk(obj[key], prekey + '|' + key);
                        }
                    }
                }
            });
        };
        walk(root, '');
        return path;
    }
};
exports.PrefabService = PrefabService;
exports.PrefabService = PrefabService = __decorate([
    (0, core_1.register)('Prefab')
], PrefabService);
exports.default = new PrefabService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL3ByZWZhYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxpQ0FBK0Y7QUFDL0YsMkJBQXlEO0FBQ3pELGtEQUF3RDtBQUN4RCx3Q0FBOEM7QUFDOUMsMENBQTZDO0FBZTdDLDhEQUE4RjtBQUM5Rix5Q0FBMkM7QUFDM0MsZ0NBQTZCO0FBQzdCLHNEQUF3RDtBQUN4RCxzREFBaUU7QUFHakUsU0FBUyx1QkFBdUI7SUFDNUIsT0FBTyxJQUFBLDZCQUFzQixFQUF3QixRQUFRLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDeEgsQ0FBQztBQUdNLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxrQkFBMEI7SUFFakQsV0FBVyxHQUFHLElBQUksdUNBQXlCLENBQy9DLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUEsNkJBQXNCLEVBQXdCLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksT0FBTyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ3BCLE9BQU8sTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBQ0QsT0FBTyxjQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QyxDQUFDLEVBQ0QsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLG9CQUFhLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxFQUN6RCx1QkFBdUIsQ0FDMUIsQ0FBQztJQUNNLEtBQUssR0FBRyxJQUFJLDhCQUFnQixFQUFFLENBQUM7SUFDL0IsTUFB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QUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUMxQixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDOzRCQUN2QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7d0JBQ2xDLENBQUM7NkJBQU0sQ0FBQzs0QkFDSixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7d0JBQ3ZDLENBQUM7b0JBQ0wsQ0FBQztnQkFDTCxDQUFDO1lBRUwsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2YsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKLENBQUE7QUE5bEJZLHNDQUFhO3dCQUFiLGFBQWE7SUFEekIsSUFBQSxlQUFRLEVBQUMsUUFBUSxDQUFDO0dBQ04sYUFBYSxDQThsQnpCO0FBRUQsa0JBQWUsSUFBSSxhQUFhLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VTZXJ2aWNlLCBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlLCByZWdpc3RlciwgU2VydmljZSwgU2VydmljZUV2ZW50cyB9IGZyb20gJy4vY29yZSc7XG5pbXBvcnQgeyBDb21wb25lbnQsIGluc3RhbnRpYXRlLCBOb2RlLCBTY2VuZSB9IGZyb20gJ2NjJztcbmltcG9ydCB7IGNvbXBvbmVudE9wZXJhdGlvbiB9IGZyb20gJy4vcHJlZmFiL2NvbXBvbmVudCc7XG5pbXBvcnQgeyBub2RlT3BlcmF0aW9uIH0gZnJvbSAnLi9wcmVmYWIvbm9kZSc7XG5pbXBvcnQgeyBwcmVmYWJVdGlscyB9IGZyb20gJy4vcHJlZmFiL3V0aWxzJztcbmltcG9ydCB0eXBlIHtcbiAgICBJQXBwbHlQcmVmYWJDaGFuZ2VzUGFyYW1zLFxuICAgIElDaGFuZ2VOb2RlT3B0aW9ucyxcbiAgICBJQ3JlYXRlUHJlZmFiRnJvbU5vZGVQYXJhbXMsXG4gICAgSUdldFByZWZhYkluZm9QYXJhbXMsXG4gICAgSUlzUHJlZmFiSW5zdGFuY2VQYXJhbXMsXG4gICAgSU5vZGUsXG4gICAgSVByZWZhYixcbiAgICBJUHJlZmFiRXZlbnRzLFxuICAgIElQcmVmYWJTZXJ2aWNlLFxuICAgIElSZXZlcnRUb1ByZWZhYlBhcmFtcyxcbiAgICBJVW5saW5rUHJlZmFiUGFyYW1zLFxuICAgIElVbnBhY2tQcmVmYWJJbnN0YW5jZVBhcmFtcyxcbn0gZnJvbSAnLi4vLi4vY29tbW9uJztcbmltcG9ydCB7IHZhbGlkYXRlQ3JlYXRlUHJlZmFiUGFyYW1zLCB2YWxpZGF0ZU5vZGVQYXRoUGFyYW1zIH0gZnJvbSAnLi9wcmVmYWIvdmFsaWRhdGUtcGFyYW1zJztcbmltcG9ydCB7IHNjZW5lVXRpbHMgfSBmcm9tICcuL3NjZW5lL3V0aWxzJztcbmltcG9ydCB7IFJwYyB9IGZyb20gJy4uL3JwYyc7XG5pbXBvcnQgeyBQcmVmYWJVbmRvSGVscGVyIH0gZnJvbSAnLi9wcmVmYWIvcHJlZmFiLXVuZG8nO1xuaW1wb3J0IHsgUHJlZmFiU29mdFJlbG9hZFNjaGVkdWxlciB9IGZyb20gJy4vcHJlZmFiL3NvZnQtcmVsb2FkJztcbmltcG9ydCB0eXBlIHsgSUVkaXRvclNlc3Npb25TZXJ2aWNlLCBJRWRpdG9yU2Vzc2lvblNuYXBzaG90IH0gZnJvbSAnLi9jb3JlL2VkaXRvci1zZXNzaW9uJztcblxuZnVuY3Rpb24gZ2V0Q3VycmVudEVkaXRvclNlc3Npb24oKTogSUVkaXRvclNlc3Npb25TbmFwc2hvdCB7XG4gICAgcmV0dXJuIHF1ZXJ5UmVnaXN0ZXJlZFNlcnZpY2U8SUVkaXRvclNlc3Npb25TZXJ2aWNlPignRWRpdG9yJyk/LmdldEVkaXRvclNlc3Npb24oKSA/PyB7IHV1aWQ6IG51bGwsIGdlbmVyYXRpb246IDAgfTtcbn1cblxuQHJlZ2lzdGVyKCdQcmVmYWInKVxuZXhwb3J0IGNsYXNzIFByZWZhYlNlcnZpY2UgZXh0ZW5kcyBCYXNlU2VydmljZTxJUHJlZmFiRXZlbnRzPiBpbXBsZW1lbnRzIElQcmVmYWJTZXJ2aWNlIHtcblxuICAgIHByaXZhdGUgX3NvZnRSZWxvYWQgPSBuZXcgUHJlZmFiU29mdFJlbG9hZFNjaGVkdWxlcihcbiAgICAgICAgKHBhcmFtcywgc2Vzc2lvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gcXVlcnlSZWdpc3RlcmVkU2VydmljZTxJRWRpdG9yU2Vzc2lvblNlcnZpY2U+KCdFZGl0b3InKTtcbiAgICAgICAgICAgIGlmIChzZXNzaW9uICYmIGVkaXRvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBlZGl0b3IucmVsb2FkRm9yU2Vzc2lvbihwYXJhbXMsIHNlc3Npb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFNlcnZpY2UuRWRpdG9yLnJlbG9hZChwYXJhbXMpO1xuICAgICAgICB9LFxuICAgICAgICAodXVpZCkgPT4gU2VydmljZUV2ZW50cy5lbWl0KCdwcmVmYWI6YXNzZXQtcmVsb2FkJywgdXVpZCksXG4gICAgICAgIGdldEN1cnJlbnRFZGl0b3JTZXNzaW9uLFxuICAgICk7XG4gICAgcHJpdmF0ZSBfdW5kbyA9IG5ldyBQcmVmYWJVbmRvSGVscGVyKCk7XG4gICAgcHJpdmF0ZSBfdXRpbHMgPSBwcmVmYWJVdGlscztcblxuICAgIHB1YmxpYyBpbml0KCkgeyB9XG5cbiAgICAvKipcbiAgICAgKiDlsIboioLngrnovazmjaLkuLrpooTliLbkvZPotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyBjcmVhdGVQcmVmYWJGcm9tTm9kZShwYXJhbXM6IElDcmVhdGVQcmVmYWJGcm9tTm9kZVBhcmFtcyk6IFByb21pc2U8SU5vZGU+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3NvZnRSZWxvYWQud2FpdEZvcklkbGUoKTtcblxuICAgICAgICAgICAgdmFsaWRhdGVDcmVhdGVQcmVmYWJQYXJhbXMocGFyYW1zKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZVV1aWRCeVBhdGhPclRocm93KHBhcmFtcy5ub2RlUGF0aCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ2Fzc2V0TWFuYWdlcicsICdxdWVyeUFzc2V0SW5mbycsIFtwYXJhbXMuZGJVUkxdKTtcbiAgICAgICAgICAgIGlmICghcGFyYW1zLm92ZXJ3cml0ZSAmJiBhc3NldEluZm8gJiYgYXNzZXRJbmZvLnR5cGUgPT09ICdjYy5QcmVmYWInKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlt7LmnInlkIzlkI0gJHthc3NldEluZm8udXJsfSDpooTliLbkvZPjgILmk43kvZzlhrLnqoHvvIznpoHmraLph43or5Xnm7jlkIzlkb3ku6TjgILor7flsJ3or5Xph43lkb3lkI3miJbmo4Dmn6Xnm67lvZXjgIJgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc291cmNlTm9kZSA9IEVkaXRvckV4dGVuZHMuTm9kZS5nZXROb2RlKG5vZGVVdWlkKSBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX3VuZG8uY2FwdHVyZVNuYXBzaG90KHNvdXJjZU5vZGUpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZTogTm9kZSB8IG51bGwgPSBhd2FpdCB0aGlzLmNyZWF0ZVByZWZhYkFzc2V0RnJvbU5vZGUobm9kZVV1aWQsIHBhcmFtcy5kYlVSTCwge1xuICAgICAgICAgICAgICAgIG92ZXJ3cml0ZTogISFwYXJhbXMub3ZlcndyaXRlLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Yib5bu66aKE5Yi25L2T6LWE5rqQ5aSx6LSl77yM6L+U5Zue57uT5p6c5Li6IG51bGwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFmdGVyID0gdGhpcy5fdW5kby5jYXB0dXJlU25hcHNob3Qobm9kZSk7XG4gICAgICAgICAgICB0aGlzLl91bmRvLnB1c2hOb2RlU3RydWN0dXJlQ29tbWFuZCgncHJlZmFiOmNyZWF0ZScsICdDcmVhdGUgUHJlZmFiJywgYmVmb3JlLCBhZnRlcik7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgc2NlbmVVdGlscy5nZW5lcmF0ZU5vZGVEdW1wKG5vZGUpIGFzIElOb2RlO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGDliJvlu7rpooTliLbkvZPlpLHotKU6IOiKgueCuei3r+W+hDogJHtwYXJhbXMubm9kZVBhdGh9IOi1hOa6kCBVUkw6ICR7cGFyYW1zLmRiVVJMfSDplJnor6/kv6Hmga86YCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5bCG6IqC54K555qE5L+u5pS55bqU55So5Zue6aKE5Yi25L2T6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgYXBwbHlQcmVmYWJDaGFuZ2VzKHBhcmFtczogSUFwcGx5UHJlZmFiQ2hhbmdlc1BhcmFtcyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc29mdFJlbG9hZC53YWl0Rm9ySWRsZSgpO1xuICAgICAgICAgICAgdmFsaWRhdGVOb2RlUGF0aFBhcmFtcyhwYXJhbXMpO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gRWRpdG9yRXh0ZW5kcy5Ob2RlLmdldE5vZGVCeVBhdGhPclRocm93KHBhcmFtcy5ub2RlUGF0aCk7XG4gICAgICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiKG5vZGUpO1xuICAgICAgICAgICAgaWYgKCFwcmVmYWJJbmZvKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDor6XoioLngrkgJyR7cGFyYW1zLm5vZGVQYXRofScg5LiN5piv6aKE5Yi25L2TYCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX3VuZG8uY2FwdHVyZVNuYXBzaG90KG5vZGUpO1xuICAgICAgICAgICAgY29uc3QgcHJlZmFiQXNzZXRVdWlkID0gcHJlZmFiSW5mby5hc3NldD8uX3V1aWQ7XG4gICAgICAgICAgICBjb25zdCBzaG91bGRXYWl0Rm9yUmVsb2FkID0gISFwcmVmYWJBc3NldFV1aWRcbiAgICAgICAgICAgICAgICAmJiBub2RlT3BlcmF0aW9uLmFzc2V0VG9Ob2Rlc01hcC5oYXMocHJlZmFiQXNzZXRVdWlkKVxuICAgICAgICAgICAgICAgICYmIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmhhc09wZW4oKTtcbiAgICAgICAgICAgIGNvbnN0IHJlbG9hZFdhaXRlciA9IHByZWZhYkFzc2V0VXVpZCAmJiBzaG91bGRXYWl0Rm9yUmVsb2FkXG4gICAgICAgICAgICAgICAgPyB0aGlzLl9zb2Z0UmVsb2FkLndhaXRGb3JBc3NldFJlbG9hZChwcmVmYWJBc3NldFV1aWQpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHByZWZhYkFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3VuZG8ucHJlc2VydmVVbmRvSGlzdG9yeUZvclByZWZhYlJlbG9hZChwcmVmYWJBc3NldFV1aWQsIGdldEN1cnJlbnRFZGl0b3JTZXNzaW9uKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhcHBseUluZm8gPSBhd2FpdCBub2RlT3BlcmF0aW9uLmFwcGx5UHJlZmFiKG5vZGUudXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFhcHBseUluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVsb2FkV2FpdGVyPy5jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZWZhYkFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdW5kby5jYW5jZWxQcmVzZXJ2ZVVuZG9IaXN0b3J5Rm9yUHJlZmFiUmVsb2FkKHByZWZhYkFzc2V0VXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGF3YWl0IHJlbG9hZFdhaXRlcj8ucHJvbWlzZTtcbiAgICAgICAgICAgICAgICBjb25zdCBhZnRlck5vZGUgPSB0aGlzLl91bmRvLmZpbmROb2RlKHBhcmFtcy5ub2RlUGF0aCwgbm9kZS51dWlkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhZnRlciA9IHRoaXMuX3VuZG8uY2FwdHVyZVNuYXBzaG90KGFmdGVyTm9kZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kby5wdXNoQXBwbHlDb21tYW5kKFxuICAgICAgICAgICAgICAgICAgICAncHJlZmFiOmFwcGx5JyxcbiAgICAgICAgICAgICAgICAgICAgJ0FwcGx5IFByZWZhYiBDaGFuZ2VzJyxcbiAgICAgICAgICAgICAgICAgICAgYmVmb3JlLFxuICAgICAgICAgICAgICAgICAgICBhZnRlcixcbiAgICAgICAgICAgICAgICAgICAgYXBwbHlJbmZvLmFzc2V0VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgYXBwbHlJbmZvLmFzc2V0U291cmNlLFxuICAgICAgICAgICAgICAgICAgICBhcHBseUluZm8ub2xkUHJlZmFiQ29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgYXBwbHlJbmZvLm5ld1ByZWZhYkNvbnRlbnQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVsb2FkV2FpdGVyPy5jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICBpZiAocHJlZmFiQXNzZXRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VuZG8uY2FuY2VsUHJlc2VydmVVbmRvSGlzdG9yeUZvclByZWZhYlJlbG9hZChwcmVmYWJBc3NldFV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihg5bqU55So5Zue6aKE5Yi25L2T6LWE5rqQ5aSx6LSlOiDoioLngrnot6/lvoQ6ICR7cGFyYW1zLm5vZGVQYXRofSDplJnor6/kv6Hmga86YCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6YeN572u6IqC54K55Yiw6aKE5Yi25L2T5Y6f5aeL54q25oCBXG4gICAgICovXG4gICAgYXN5bmMgcmV2ZXJ0VG9QcmVmYWIocGFyYW1zOiBJUmV2ZXJ0VG9QcmVmYWJQYXJhbXMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3NvZnRSZWxvYWQud2FpdEZvcklkbGUoKTtcbiAgICAgICAgICAgIHZhbGlkYXRlTm9kZVBhdGhQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZUJ5UGF0aE9yVGhyb3cocGFyYW1zLm5vZGVQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX3VuZG8uY2FwdHVyZVNuYXBzaG90KG5vZGUpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5yZXZlcnRQcmVmYWIobm9kZSk7XG4gICAgICAgICAgICBjb25zdCBhZnRlck5vZGUgPSB0aGlzLl91bmRvLmZpbmROb2RlKHBhcmFtcy5ub2RlUGF0aCwgbm9kZS51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGFmdGVyID0gdGhpcy5fdW5kby5jYXB0dXJlU25hcHNob3QoYWZ0ZXJOb2RlKTtcbiAgICAgICAgICAgIHRoaXMuX3VuZG8ucHVzaE5vZGVTdHJ1Y3R1cmVDb21tYW5kKCdwcmVmYWI6cmV2ZXJ0JywgJ1JldmVydCBQcmVmYWInLCBiZWZvcmUsIGFmdGVyKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOmHjee9ruiKgueCueWIsOmihOWItuS9k+WOn+Wni+eKtuaAgeWksei0pe+8muiKgueCuei3r+W+hCAke3BhcmFtcy5ub2RlUGF0aH0g6ZSZ6K+v5L+h5oGvOmAsIGUpO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOino+iApumihOWItuS9k+WunuS+i++8jOS9v+WFtuaIkOS4uuaZrumAmuiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIHVucGFja1ByZWZhYkluc3RhbmNlKHBhcmFtczogSVVucGFja1ByZWZhYkluc3RhbmNlUGFyYW1zKTogUHJvbWlzZTxJTm9kZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc29mdFJlbG9hZC53YWl0Rm9ySWRsZSgpO1xuICAgICAgICAgICAgdmFsaWRhdGVOb2RlUGF0aFBhcmFtcyhwYXJhbXMpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IEVkaXRvckV4dGVuZHMuTm9kZS5nZXROb2RlQnlQYXRoT3JUaHJvdyhwYXJhbXMubm9kZVBhdGgpO1xuXG4gICAgICAgICAgICBpZiAoIXByZWZhYlV0aWxzLmdldFByZWZhYihub2RlKT8uaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7cGFyYW1zLm5vZGVQYXRofSDmmK/mma7pgJroioLngrlgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5fdW5kby5jYXB0dXJlU25hcHNob3Qobm9kZSk7XG4gICAgICAgICAgICB0aGlzLnVuV3JhcFByZWZhYkluc3RhbmNlKG5vZGUudXVpZCwgISFwYXJhbXMucmVjdXJzaXZlKTtcbiAgICAgICAgICAgIGNvbnN0IGFmdGVyTm9kZSA9IHRoaXMuX3VuZG8uZmluZE5vZGUocGFyYW1zLm5vZGVQYXRoLCBub2RlLnV1aWQpO1xuICAgICAgICAgICAgY29uc3QgYWZ0ZXIgPSB0aGlzLl91bmRvLmNhcHR1cmVTbmFwc2hvdChhZnRlck5vZGUpO1xuICAgICAgICAgICAgdGhpcy5fdW5kby5wdXNoVW53cmFwQ29tbWFuZCgncHJlZmFiOnVucGFjaycsICdVbnBhY2sgUHJlZmFiIEluc3RhbmNlJywgYmVmb3JlLCBhZnRlciwgISFwYXJhbXMucmVjdXJzaXZlKTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBzY2VuZVV0aWxzLmdlbmVyYXRlTm9kZUR1bXAobm9kZSkgYXMgSU5vZGU7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOino+iApuS4uuaZrumAmuiKgueCueWksei0pe+8muiKgueCuei3r+W+hCAke3BhcmFtcy5ub2RlUGF0aH0g5piv5ZCm6YCS5b2SOiAke3BhcmFtcy5yZWN1cnNpdmV9IOmUmeivr+S/oeaBrzpgLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6XoioLngrnmmK/lkKbkuLrpooTliLbkvZPlrp7kvotcbiAgICAgKi9cbiAgICBhc3luYyBpc1ByZWZhYkluc3RhbmNlKHBhcmFtczogSUlzUHJlZmFiSW5zdGFuY2VQYXJhbXMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZUJ5UGF0aE9yVGhyb3cocGFyYW1zLm5vZGVQYXRoKTtcbiAgICAgICAgICAgIHJldHVybiAhIXByZWZhYlV0aWxzLmdldFByZWZhYihub2RlKT8uaW5zdGFuY2U7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOajgOafpeiKgueCueaYr+WQpumihOWItuS9k+WunuS+i+Wksei0pe+8muiKgueCuei3r+W+hCAke3BhcmFtcy5ub2RlUGF0aH0g6ZSZ6K+v5L+h5oGvOmAsIGUpO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOino+e7kemihOWItuS9k+WunuS+i++8jOS9v+WFtuaIkOS4uuaZrumAmuiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIHVubGlua1ByZWZhYihwYXJhbXM6IElVbmxpbmtQcmVmYWJQYXJhbXMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3NvZnRSZWxvYWQud2FpdEZvcklkbGUoKTtcbiAgICAgICAgICAgIHZhbGlkYXRlTm9kZVBhdGhQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZUJ5UGF0aE9yVGhyb3cocGFyYW1zLm5vZGVQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX3VuZG8uY2FwdHVyZVNuYXBzaG90KG5vZGUpO1xuICAgICAgICAgICAgdGhpcy51bldyYXBQcmVmYWJJbnN0YW5jZShub2RlLnV1aWQsICEhcGFyYW1zLnJlbW92ZU5lc3RlZCk7XG4gICAgICAgICAgICBjb25zdCBhZnRlck5vZGUgPSB0aGlzLl91bmRvLmZpbmROb2RlKHBhcmFtcy5ub2RlUGF0aCwgbm9kZS51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGFmdGVyID0gdGhpcy5fdW5kby5jYXB0dXJlU25hcHNob3QoYWZ0ZXJOb2RlKTtcbiAgICAgICAgICAgIHRoaXMuX3VuZG8ucHVzaFVud3JhcENvbW1hbmQoJ3ByZWZhYjp1bmxpbmsnLCAnVW5saW5rIFByZWZhYicsIGJlZm9yZSwgYWZ0ZXIsICEhcGFyYW1zLnJlbW92ZU5lc3RlZCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihg6Kej57uR6aKE5Yi25L2T5aSx6LSl77ya6IqC54K56Lev5b6EICR7cGFyYW1zLm5vZGVQYXRofSDmmK/lkKbpgJLlvZI6ICR7cGFyYW1zLnJlbW92ZU5lc3RlZH0g6ZSZ6K+v5L+h5oGvOmAsIGUpO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluiKgueCueeahOmihOWItuS9k+S/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGdldFByZWZhYkluZm8ocGFyYW1zOiBJR2V0UHJlZmFiSW5mb1BhcmFtcyk6IFByb21pc2U8SVByZWZhYiB8IG51bGw+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZUJ5UGF0aE9yVGhyb3cocGFyYW1zLm5vZGVQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBwcmVmYWJVdGlscy5nZXRQcmVmYWIobm9kZSk7XG4gICAgICAgICAgICBpZiAoIXByZWZhYkluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzY2VuZVV0aWxzLmdlbmVyYXRlUHJlZmFiRHVtcChub2RlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihg6I635Y+W6IqC54K555qE6aKE5Yi25L2T5L+h5oGv5aSx6LSl77ya6IqC54K56Lev5b6EICR7cGFyYW1zLm5vZGVQYXRofSDplJnor6/kv6Hmga86YCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIG5vZGUgb3BlcmF0aW9uXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgcHVibGljIG9uRWRpdG9yT3BlbmVkKCkge1xuICAgICAgICBub2RlT3BlcmF0aW9uLm9uRWRpdG9yT3BlbmVkKCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRWRpdG9yRGlzcG9zZWQoKSB7XG4gICAgICAgIHRoaXMuX3NvZnRSZWxvYWQuaW52YWxpZGF0ZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbk5vZGVSZW1vdmVkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgbm9kZU9wZXJhdGlvbi5vbk5vZGVSZW1vdmVkKG5vZGUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbk5vZGVDaGFuZ2VkSW5HZW5lcmFsTW9kZShub2RlOiBOb2RlLCBvcHRzOiBJQ2hhbmdlTm9kZU9wdGlvbnMsIHJvb3Q6IE5vZGUgfCBTY2VuZSB8IG51bGwpIHtcbiAgICAgICAgbm9kZU9wZXJhdGlvbi5vbk5vZGVDaGFuZ2VkSW5HZW5lcmFsTW9kZShub2RlLCBvcHRzLCByb290KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25BZGROb2RlKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgbm9kZU9wZXJhdGlvbi5vbkFkZE5vZGUobm9kZSk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uTm9kZUFkZGVkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgbm9kZU9wZXJhdGlvbi5vbk5vZGVBZGRlZChub2RlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Ob2RlQ2hhbmdlZChub2RlOiBOb2RlLCBvcHRzOiBJQ2hhbmdlTm9kZU9wdGlvbnMgPSB7fSkge1xuICAgICAgICB0aGlzLm9uTm9kZUNoYW5nZWRJbkdlbmVyYWxNb2RlKG5vZGUsIG9wdHMsIFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvblNldFByb3BlcnR5Q29tcG9uZW50KGNvbXA6IENvbXBvbmVudCwgb3B0czogSUNoYW5nZU5vZGVPcHRpb25zID0ge30pIHtcbiAgICAgICAgdGhpcy5vbk5vZGVDaGFuZ2VkSW5HZW5lcmFsTW9kZShjb21wLm5vZGUsIG9wdHMsIFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCkpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVQcmVmYWJJbmZvRnJvbU5vZGUobm9kZTogTm9kZSwgcmVtb3ZlTmVzdGVkPzogYm9vbGVhbikge1xuICAgICAgICBub2RlT3BlcmF0aW9uLnJlbW92ZVByZWZhYkluZm9Gcm9tTm9kZShub2RlLCByZW1vdmVOZXN0ZWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjaGVja1RvUmVtb3ZlVGFyZ2V0T3ZlcnJpZGUoc291cmNlOiBOb2RlIHwgQ29tcG9uZW50LCByb290OiBOb2RlIHwgU2NlbmUgfCBudWxsKSB7XG4gICAgICAgIHByZWZhYlV0aWxzLmNoZWNrVG9SZW1vdmVUYXJnZXRPdmVycmlkZShzb3VyY2UsIHJvb3QpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS7juS4gOS4quiKgueCueeUn+aIkOS4gOS4qlByZWZhYkFzc2V0XG4gICAgICogQHBhcmFtIG5vZGVVVUlEXG4gICAgICogQHBhcmFtIHVybFxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGNyZWF0ZVByZWZhYkFzc2V0RnJvbU5vZGUobm9kZVVVSUQ6IHN0cmluZywgdXJsOiBzdHJpbmcsIG9wdGlvbnMgPSB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTogUHJvbWlzZTxOb2RlIHwgbnVsbD4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgbm9kZU9wZXJhdGlvbi5jcmVhdGVQcmVmYWJBc3NldEZyb21Ob2RlKG5vZGVVVUlELCB1cmwsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwhuS4gOS4qiBub2RlIOS4juS4gOS4qiBwcmVmYWIg5YWz6IGU5Yiw5LiA6LW3XG4gICAgICogQHBhcmFtIG5vZGVVVUlEXG4gICAgICogQHBhcmFtIHsqfSBhc3NldFV1aWQg5YWz6IGU55qE6LWE5rqQXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGxpbmtOb2RlV2l0aFByZWZhYkFzc2V0KG5vZGVVVUlEOiBzdHJpbmcgfCBOb2RlLCBhc3NldFV1aWQ6IHN0cmluZyB8IGFueSkge1xuICAgICAgICBhd2FpdCBub2RlT3BlcmF0aW9uLmxpbmtOb2RlV2l0aFByZWZhYkFzc2V0KG5vZGVVVUlELCBhc3NldFV1aWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS7juS4gOS4quiKgueCueeUn+aIkCBwcmVmYWLmlbDmja5cbiAgICAgKiDov5Tlm57luo/liJfljJbmlbDmja5cbiAgICAgKiBAcGFyYW0geyp9IG5vZGVVVUlEXG4gICAgICovXG4gICAgcHVibGljIGdlbmVyYXRlUHJlZmFiRGF0YUZyb21Ob2RlKG5vZGVVVUlEOiBzdHJpbmcgfCBOb2RlKSB7XG4gICAgICAgIHJldHVybiBwcmVmYWJVdGlscy5nZW5lcmF0ZVByZWZhYkRhdGFGcm9tTm9kZShub2RlVVVJRCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6L+Y5Y6f5LiA5LiqUHJlZmFiSW5zdGFuY2XnmoTmlbDmja7kuLrlroPmiYDlhbPogZTnmoRQcmVmYWJBc3NldFxuICAgICAqIEBwYXJhbSBub2RlVVVJRCBub2RlXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIHJldmVydFByZWZhYihub2RlVVVJRDogTm9kZSB8IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbm9kZU9wZXJhdGlvbi5yZXZlcnRQcmVmYWIobm9kZVVVSUQpO1xuICAgIH1cblxuICAgIC8vIOiOt+WPlnVubGlua1ByZWZhYuS8muW9seWTjeWIsOeahHV1aWRcbiAgICBwdWJsaWMgZ2V0VW5saW5rTm9kZVV1aWRzKHV1aWQ6IHN0cmluZywgcmVtb3ZlTmVzdGVkPzogYm9vbGVhbik6IHN0cmluZ1tdIHtcbiAgICAgICAgY29uc3QgdXVpZHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgZnVuY3Rpb24gY29sbGVjdFV1aWRzKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBwcmVmYWJVdGlscy5nZXRQcmVmYWIobm9kZSk7XG4gICAgICAgICAgICBpZiAocmVtb3ZlTmVzdGVkKSB7XG4gICAgICAgICAgICAgICAgdXVpZHMucHVzaChub2RlLnV1aWQpO1xuICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdFV1aWRzKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJlZmFiSW5mbykge1xuICAgICAgICAgICAgICAgIGlmICghcHJlZmFiSW5mby5pbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICB1dWlkcy5wdXNoKG5vZGUudXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RVdWlkcyhjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgdXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0VXVpZHMoY2hpbGQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHV1aWRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOino+mZpFByZWZhYkluc3RhbmNl5a+5UHJlZmFiQXNzZXTnmoTlhbPogZRcbiAgICAgKiBAcGFyYW0gbm9kZVVVSUQg6IqC54K55oiW6IqC54K555qEVVVJRFxuICAgICAqIEBwYXJhbSByZW1vdmVOZXN0ZWQg5piv5ZCm6YCS5b2S55qE6Kej6Zmk5a2Q6IqC54K5UHJlZmFiSW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgdW5XcmFwUHJlZmFiSW5zdGFuY2Uobm9kZVVVSUQ6IHN0cmluZywgcmVtb3ZlTmVzdGVkPzogYm9vbGVhbikge1xuICAgICAgICByZXR1cm4gbm9kZU9wZXJhdGlvbi51bldyYXBQcmVmYWJJbnN0YW5jZShub2RlVVVJRCwgcmVtb3ZlTmVzdGVkKTtcbiAgICB9XG5cbiAgICAvLyDlnKhQcmVmYWLnvJbovpHmqKHlvI/kuIvkuI3og73np7vpmaRwcmVmYWJJbmZv77yM5Y+q6ZyA6KaB56e76ZmkaW5zdGFuY2VcbiAgICBwdWJsaWMgdW5XcmFwUHJlZmFiSW5zdGFuY2VJblByZWZhYk1vZGUobm9kZVVVSUQ6IHN0cmluZyB8IE5vZGUsIHJlbW92ZU5lc3RlZD86IGJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIG5vZGVPcGVyYXRpb24udW5XcmFwUHJlZmFiSW5zdGFuY2VJblByZWZhYk1vZGUobm9kZVVVSUQsIHJlbW92ZU5lc3RlZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5bCG5LiA5LiqUHJlZmFiSW5zdGFuY2XnmoTmlbDmja7lupTnlKjliLDlr7nlupTnmoRBc3NldOi1hOa6kOS4ilxuICAgICAqIEBwYXJhbSBub2RlVVVJRCB1dWlkXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGFwcGx5UHJlZmFiKG5vZGVVVUlEOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuICEhKGF3YWl0IG5vZGVPcGVyYXRpb24uYXBwbHlQcmVmYWIobm9kZVVVSUQpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJlc2VydmVVbmRvSGlzdG9yeUZvclByZWZhYlJlbG9hZChhc3NldFV1aWQ6IHN0cmluZywgZWRpdG9yVXVpZDogc3RyaW5nIHwgbnVsbCA9IG51bGwpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IGdldEN1cnJlbnRFZGl0b3JTZXNzaW9uKCk7XG4gICAgICAgIHRoaXMuX3VuZG8ucHJlc2VydmVVbmRvSGlzdG9yeUZvclByZWZhYlJlbG9hZChhc3NldFV1aWQsIHtcbiAgICAgICAgICAgIHV1aWQ6IGVkaXRvclV1aWQgPz8gc2Vzc2lvbi51dWlkLFxuICAgICAgICAgICAgZ2VuZXJhdGlvbjogc2Vzc2lvbi5nZW5lcmF0aW9uLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FuY2VsUHJlc2VydmVVbmRvSGlzdG9yeUZvclByZWZhYlJlbG9hZChhc3NldFV1aWQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLl91bmRvLmNhbmNlbFByZXNlcnZlVW5kb0hpc3RvcnlGb3JQcmVmYWJSZWxvYWQoYXNzZXRVdWlkKTtcbiAgICB9XG5cbiAgICAvLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gY29tcG9uZW50cyBvcGVyYXRpb25cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBwdWJsaWMgb25BZGRDb21wb25lbnQoY29tcDogQ29tcG9uZW50KSB7XG4gICAgICAgIGNvbXBvbmVudE9wZXJhdGlvbi5vbkFkZENvbXBvbmVudChjb21wKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Db21wb25lbnRBZGRlZChjb21wOiBDb21wb25lbnQpIHtcbiAgICAgICAgY29tcG9uZW50T3BlcmF0aW9uLm9uQ29tcG9uZW50QWRkZWQoY29tcCk7XG4gICAgfVxuXG4gICAgLy8g57yW6L6R5Zmo5Li75Yqo5Yig6ZmkQ29tcG9uZW505pe26LCD55SoXG4gICAgcHVibGljIG9uUmVtb3ZlQ29tcG9uZW50SW5HZW5lcmFsTW9kZShjb21wOiBDb21wb25lbnQsIHJvb3ROb2RlOiBOb2RlIHwgU2NlbmUgfCBudWxsKSB7XG4gICAgICAgIGNvbXBvbmVudE9wZXJhdGlvbi5vblJlbW92ZUNvbXBvbmVudEluR2VuZXJhbE1vZGUoY29tcCwgcm9vdE5vZGUpO1xuICAgIH1cblxuICAgIC8vIENvbXBvbmVudOiiq+WIoOmZpOaXtuiwg+eUqO+8jOW9k+agueiKgueCueWIoOmZpOaXtu+8jOaJgOacieWtkOiKgueCueeahENvbXBvbmVudOWIoOmZpOS6i+S7tuS5n+S8muinpuWPkeWIsOi/memHjFxuICAgIHB1YmxpYyBvbkNvbXBvbmVudFJlbW92ZWRJbkdlbmVyYWxNb2RlKGNvbXA6IENvbXBvbmVudCwgcm9vdE5vZGU6IE5vZGUgfCBTY2VuZSB8IG51bGwpIHtcbiAgICAgICAgY29tcG9uZW50T3BlcmF0aW9uLm9uQ29tcG9uZW50UmVtb3ZlZEluR2VuZXJhbE1vZGUoY29tcCwgcm9vdE5vZGUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyByZXZlcnRSZW1vdmVkQ29tcG9uZW50KG5vZGVVVUlEOiBzdHJpbmcsIGZpbGVJRDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZShub2RlVVVJRCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX3VuZG8uY2FwdHVyZVNuYXBzaG90KG5vZGUpO1xuICAgICAgICBhd2FpdCBjb21wb25lbnRPcGVyYXRpb24ucmV2ZXJ0UmVtb3ZlZENvbXBvbmVudChub2RlVVVJRCwgZmlsZUlEKTtcbiAgICAgICAgY29uc3QgYWZ0ZXIgPSB0aGlzLl91bmRvLmNhcHR1cmVTbmFwc2hvdChFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZShub2RlVVVJRCkgYXMgTm9kZSB8IG51bGwpO1xuICAgICAgICB0aGlzLl91bmRvLnB1c2hOb2RlU3RydWN0dXJlQ29tbWFuZCgncHJlZmFiOnJldmVydC1yZW1vdmVkLWNvbXBvbmVudCcsICdSZXZlcnQgUmVtb3ZlZCBDb21wb25lbnQnLCBiZWZvcmUsIGFmdGVyKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgYXBwbHlSZW1vdmVkQ29tcG9uZW50KG5vZGVVVUlEOiBzdHJpbmcsIGZpbGVJRDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZShub2RlVVVJRCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX3VuZG8uY2FwdHVyZVNuYXBzaG90KG5vZGUpO1xuICAgICAgICBhd2FpdCBjb21wb25lbnRPcGVyYXRpb24uYXBwbHlSZW1vdmVkQ29tcG9uZW50KG5vZGVVVUlELCBmaWxlSUQpO1xuICAgICAgICBjb25zdCBhZnRlciA9IHRoaXMuX3VuZG8uY2FwdHVyZVNuYXBzaG90KEVkaXRvckV4dGVuZHMuTm9kZS5nZXROb2RlKG5vZGVVVUlEKSBhcyBOb2RlIHwgbnVsbCk7XG4gICAgICAgIHRoaXMuX3VuZG8ucHVzaE5vZGVTdHJ1Y3R1cmVDb21tYW5kKCdwcmVmYWI6YXBwbHktcmVtb3ZlZC1jb21wb25lbnQnLCAnQXBwbHkgUmVtb3ZlZCBDb21wb25lbnQnLCBiZWZvcmUsIGFmdGVyKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgb25Bc3NldENoYW5nZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHJlbG9hZFN0YXRlID0gdGhpcy5fdW5kby5jb25zdW1lUHJlc2VydmVVbmRvSGlzdG9yeUZvclByZWZhYlJlbG9hZCh1dWlkKTtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IGdldEN1cnJlbnRFZGl0b3JTZXNzaW9uKCk7XG4gICAgICAgIC8vIHByZWZhYiDotYTmupDnmoTlj5jliqjvvIxzb2Z0UmVsb2Fk5Zy65pmvXG4gICAgICAgIGlmIChub2RlT3BlcmF0aW9uLmFzc2V0VG9Ob2Rlc01hcC5oYXModXVpZCkgJiYgYXdhaXQgU2VydmljZS5FZGl0b3IuaGFzT3BlbigpKSB7XG4gICAgICAgICAgICB0aGlzLl9zb2Z0UmVsb2FkLnNjaGVkdWxlKHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VkVXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICBwcmVzZXJ2ZVVuZG9IaXN0b3J5OiByZWxvYWRTdGF0ZS5wcmVzZXJ2ZVVuZG9IaXN0b3J5IHx8ICEhU2VydmljZS5VbmRvPy5pc0RpcnR5Py4oKSxcbiAgICAgICAgICAgICAgICBlZGl0b3JTZXNzaW9uOiByZWxvYWRTdGF0ZS5lZGl0b3JTZXNzaW9uID8/IHsgdXVpZDogc2Vzc2lvbi51dWlkLCBnZW5lcmF0aW9uOiBzZXNzaW9uLmdlbmVyYXRpb24gfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIG9uQXNzZXREZWxldGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLl91bmRvLmNvbnN1bWVQcmVzZXJ2ZVVuZG9IaXN0b3J5Rm9yUHJlZmFiUmVsb2FkKHV1aWQpO1xuICAgICAgICBjb25zdCBzZXNzaW9uID0gZ2V0Q3VycmVudEVkaXRvclNlc3Npb24oKTtcbiAgICAgICAgaWYgKG5vZGVPcGVyYXRpb24uYXNzZXRUb05vZGVzTWFwLmhhcyh1dWlkKSAmJiBhd2FpdCBTZXJ2aWNlLkVkaXRvci5oYXNPcGVuKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvZnRSZWxvYWQuc2NoZWR1bGUoe1xuICAgICAgICAgICAgICAgIGRlbGV0ZWRVdWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgIGVkaXRvclNlc3Npb246IHNlc3Npb24sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwhuS4gOS4quiKgueCueaBouWkjeWIsOWFs+iBlOeahCBwcmVmYWIg55qE54q25oCBXG4gICAgICogQHBhcmFtIHsqfSBub2RlVXVpZFxuICAgICAqL1xuICAgIHB1YmxpYyByZXZlcnQobm9kZVV1aWQ6IHN0cmluZykgeyB9XG5cbiAgICAvKipcbiAgICAgKiDlsIbkuIDkuKroioLngrnnmoTkv67mlLnvvIzlupTnlKjliLDlhbPogZTnmoQgcHJlZmFiIOS4ilxuICAgICAqIEBwYXJhbSB7Kn0gbm9kZVV1aWRcbiAgICAgKi9cbiAgICBwdWJsaWMgc3luYyhub2RlVXVpZDogc3RyaW5nKSB7IH1cblxuICAgIHB1YmxpYyBjcmVhdGVOb2RlRnJvbVByZWZhYkFzc2V0KGFzc2V0OiBhbnkpIHtcbiAgICAgICAgY29uc3Qgbm9kZTogTm9kZSA9IGluc3RhbnRpYXRlKGFzc2V0KTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBwcmVmYWJJbmZvID0gbm9kZVsnX3ByZWZhYiddO1xuXG4gICAgICAgIGlmICghcHJlZmFiSW5mbykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm90IGEgUHJlZmFiIEFzc2V0OicsIGFzc2V0LnV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXByZWZhYkluZm8uaW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UgPSBwcmVmYWJVdGlscy5jcmVhdGVQcmVmYWJJbnN0YW5jZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogYXBwbHnljZXkuKrlsZ7mgKfnmoRvdmVycmlkZeWIsHByZWZhYkFzc2V0XG5cbiAgICBwdWJsaWMgZmlsdGVyQ2hpbGRPZkFzc2V0T2ZQcmVmYWJJbnN0YW5jZSh1dWlkczogc3RyaW5nIHwgc3RyaW5nW10sIG9wZXJhdGlvblRpcHM6IHN0cmluZykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWx0ZXJVVUlEcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgdXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZSh1dWlkKTtcblxuICAgICAgICAgICAgLy8g5aKe5Yqg5a656ZSZXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5piv5b2T5YmN546v5aKD5LiL55qEbW91bnRlZENoaWxkcmVu77yM5bCx5LiN566X5piv6LWE5rqQ6YeM55qEXG4gICAgICAgICAgICBpZiAocHJlZmFiVXRpbHMuaXNPdXRtb3N0UHJlZmFiSW5zdGFuY2VNb3VudGVkQ2hpbGRyZW4obm9kZSkpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJVVUlEcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXByZWZhYlV0aWxzLmlzUHJlZmFiSW5zdGFuY2VSb290KG5vZGUpICYmIHByZWZhYlV0aWxzLmlzUGFydE9mQXNzZXRJblByZWZhYkluc3RhbmNlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBOb2RlIFske25vZGUubmFtZX1dIGlzIGEgcHJlZmFiIGNoaWxkIG9mIHByZWZhYkluc3RhbmNlIFske25vZGVbJ19wcmVmYWInXT8ucm9vdD8ubmFtZX1dLCAke29wZXJhdGlvblRpcHN9YCk7XG4gICAgICAgICAgICAgICAgLy8g5raI6Zmk5YW25a6D6Z2i5p2/55qE562J5b6F5pON5L2c77yM5L6L5aaCaGllcmFyY2h55pON5L2c6IqC54K55pe25Lya5YWI6L+b5YWl562J5b6F54q25oCB77yM5aaC5p6c5rKh5pyJbm9kZeeahGNoYW5nZea2iOaBr++8jOWwseS8muS4gOebtOWkhOS6juetieW+heeKtuaAgeOAglxuICAgICAgICAgICAgICAgIFNlcnZpY2VFdmVudHMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsdGVyVVVJRHMucHVzaCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXJVVUlEcztcbiAgICB9XG5cbiAgICBwdWJsaWMgZmlsdGVyUGFydE9mUHJlZmFiQXNzZXQodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdLCBvcGVyYXRpb25UaXBzOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHV1aWRzKSkge1xuICAgICAgICAgICAgdXVpZHMgPSBbdXVpZHNdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsdGVyVVVJRHMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIHV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gRWRpdG9yRXh0ZW5kcy5Ob2RlLmdldE5vZGUodXVpZCk7XG5cbiAgICAgICAgICAgIC8vIOWinuWKoOWuuemUmVxuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcmVmYWJVdGlscy5pc1BhcnRPZkFzc2V0SW5QcmVmYWJJbnN0YW5jZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgTm9kZSBbJHtub2RlLm5hbWV9XSBpcyBwYXJ0IG9mIHByZWZhYkluc3RhbmNlIFske25vZGVbJ19wcmVmYWInXT8ucm9vdD8ubmFtZX1dLCAke29wZXJhdGlvblRpcHN9YCk7XG4gICAgICAgICAgICAgICAgLy8g5raI6Zmk5YW25a6D6Z2i5p2/55qE562J5b6F5pON5L2c77yM5L6L5aaCaGllcmFyY2h55pON5L2c6IqC54K55pe25Lya5YWI6L+b5YWl562J5b6F54q25oCB77yM5aaC5p6c5rKh5pyJbm9kZeeahGNoYW5nZea2iOaBr++8jOWwseS8muS4gOebtOWkhOS6juetieW+heeKtuaAgeOAglxuICAgICAgICAgICAgICAgIFNlcnZpY2VFdmVudHMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsdGVyVVVJRHMucHVzaCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWx0ZXJVVUlEcztcbiAgICB9XG5cbiAgICAvLyBQcmVmYWJJbnN0YW5jZeeahFByZWZhYuWtkOiKgueCueS4jeiDveWIoOmZpFxuICAgIHB1YmxpYyBmaWx0ZXJDaGlsZE9mUHJlZmFiQXNzZXRXaGVuUmVtb3ZlTm9kZSh1dWlkczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyQ2hpbGRPZkFzc2V0T2ZQcmVmYWJJbnN0YW5jZSh1dWlkcywgJ2l0XFwncyBub3QgYWxsb3dlZCB0byBkZWxldGUgaW4gY3VycmVudCBjb250ZXh0LCB5b3UgY2FuIGRlbGV0ZSBpdCBpbiBpdFxcJ3MgcHJlZmFiQXNzZXQgb3IgXFxcbiAgICAgICAgZG8gaXQgYWZ0ZXIgdW5saW5rIHByZWZhYiBmcm9tIHJvb3Qgbm9kZScpO1xuICAgIH1cblxuICAgIHB1YmxpYyBmaWx0ZXJDaGlsZE9mUHJlZmFiQXNzZXRXaGVuU2V0UGFyZW50KHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJDaGlsZE9mQXNzZXRPZlByZWZhYkluc3RhbmNlKHV1aWRzLCAnaXRcXCdzIG5vdCBhbGxvd2VkIHRvIGNoYW5nZSBwYXJlbnQgaW4gY3VycmVudCBjb250ZXh0LCB5b3UgY2FuIG1vZGlmeSBpdCBpbiBpdFxcJ3MgcHJlZmFiQXNzZXQgb3IgXFxcbiAgICAgICAgZG8gaXQgYWZ0ZXIgdW5saW5rIHByZWZhYiBmcm9tIHJvb3Qgbm9kZScpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjYW5Nb2RpZnlTaWJsaW5nKHV1aWQ6IHN0cmluZywgdGFyZ2V0OiBudW1iZXIsIG9mZnNldDogbnVtYmVyKSB7XG4gICAgICAgIC8vIOS4jemcgOimgeenu+WKqFxuICAgICAgICBpZiAob2Zmc2V0ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvKDlhaXnmoTmmK/kuIDkuKrniLboioLngrlJRFxuICAgICAgICBjb25zdCBub2RlID0gRWRpdG9yRXh0ZW5kcy5Ob2RlLmdldE5vZGUodXVpZCk7XG5cbiAgICAgICAgLy8g5aKe5Yqg5a656ZSZXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5L+d5aSE55CG5ZyoUHJlZmFiSW5zdGFuY2XkuIvnmoTlsZ7kuo5QcmVmYWJBc3NldOS4reeahOiKgueCuVxuICAgICAgICBpZiAobm9kZVsnX3ByZWZhYiddICYmIHByZWZhYlV0aWxzLmlzUGFydE9mUHJlZmFiQXNzZXQobm9kZSkgJiYgbm9kZVsnX3ByZWZhYiddPy5yb290Py5bJ19wcmVmYWInXT8uaW5zdGFuY2UgJiYgbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgLy8g6L+H5ruk5ZyoaGllcmFyY2h56ZqQ6JeP55qE6IqC54K5XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJIaWRkZW5DaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKChjaGlsZDogTm9kZSkgPT4gIShjaGlsZC5vYmpGbGFncyAmIGNjLk9iamVjdC5GbGFncy5IaWRlSW5IaWVyYXJjaHkpKTtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gbm9kZS5jaGlsZHJlblt0YXJnZXRdO1xuICAgICAgICAgICAgaWYgKCFjaGlsZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGlzQWRkZWRDaGlsZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoY2hpbGRbJ19wcmVmYWInXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYlN0YXRlID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiU3RhdGVJbmZvKGNoaWxkKTtcbiAgICAgICAgICAgICAgICBpc0FkZGVkQ2hpbGQgPSBwcmVmYWJTdGF0ZS5pc0FkZGVkQ2hpbGQ7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c6KaB56e75Yqo55qE6IqC54K55piv5LiA5LiqUHJlZmFi55qE5a2Q6IqC54K5XG4gICAgICAgICAgICAgICAgaWYgKCFpc0FkZGVkQ2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBOb2RlIFske2NoaWxkLm5hbWV9XSBpcyBhIHByZWZhYiBjaGlsZCBvZiBwcmVmYWJJbnN0YW5jZSBbJHtjaGlsZFsnX3ByZWZhYiddLnJvb3Q/Lm5hbWV9XSwgXFxcbiAgICAgICAgICAgICAgICAgICAgaXQncyBub3QgYWxsb3dlZCB0byBtb2RpZnkgaGllcmFyY2h5IGluIGN1cnJlbnQgY29udGV4dCwgeW91IGNhbiBtb2RpZnkgaXQgaW4gaXQncyBwcmVmYWJBc3NldCBvciBkbyBpdCBhZnRlciB1bmxpbmsgcHJlZmFiIGZyb20gcm9vdCBub2RlYCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOa2iOmZpOWFtuWug+mdouadv+eahOetieW+heaTjeS9nO+8jOS+i+WmgmhpZXJhcmNoeeaTjeS9nOiKgueCueaXtuS8muWFiOi/m+WFpeetieW+heeKtuaAge+8jOWmguaenOayoeaciW5vZGXnmoRjaGFuZ2Xmtojmga/vvIzlsLHkvJrkuIDnm7TlpITkuo7nrYnlvoXnirbmgIHjgIJcbiAgICAgICAgICAgICAgICAgICAgU2VydmljZUV2ZW50cy5lbWl0KCdub2RlOmNoYW5nZScsIGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5om+5Ye66KaB56e75Yqo55qE6IqC54K55Zyo5rKh5pyJ6L+H5ruk5o6J6ZqQ6JeP6IqC54K555qE5Zy65pmv5Lit55qE5L2N572uXG4gICAgICAgICAgICBjb25zdCB0YXJnZXRDaGlsZCA9IGZpbHRlckhpZGRlbkNoaWxkcmVuW3RhcmdldCArIG9mZnNldF07XG4gICAgICAgICAgICBpZiAoaXNBZGRlZENoaWxkICYmIHRhcmdldENoaWxkWydfcHJlZmFiJ10pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYE5vZGUgWyR7dGFyZ2V0Q2hpbGQubmFtZX1dIGlzIGEgcHJlZmFiIGNoaWxkIG9mIHByZWZhYkluc3RhbmNlIFske3RhcmdldENoaWxkWydfcHJlZmFiJ10ucm9vdD8ubmFtZX1dLCBcXFxuICAgICAgICAgICAgICAgIGl0J3Mgbm90IGFsbG93ZWQgdG8gbW9kaWZ5IGhpZXJhcmNoeSBpbiBjdXJyZW50IGNvbnRleHQsIHlvdSBjYW4gbW9kaWZ5IGl0IGluIGl0J3MgcHJlZmFiQXNzZXQgb3IgZG8gaXQgYWZ0ZXIgdW5saW5rIHByZWZhYiBmcm9tIHJvb3Qgbm9kZWApO1xuICAgICAgICAgICAgICAgIC8vIOa2iOmZpOWFtuWug+mdouadv+eahOetieW+heaTjeS9nO+8jOS+i+WmgmhpZXJhcmNoeeaTjeS9nOiKgueCueaXtuS8muWFiOi/m+WFpeetieW+heeKtuaAge+8jOWmguaenOayoeaciW5vZGXnmoRjaGFuZ2Xmtojmga/vvIzlsLHkvJrkuIDnm7TlpITkuo7nrYnlvoXnirbmgIHjgIJcbiAgICAgICAgICAgICAgICBTZXJ2aWNlRXZlbnRzLmJyb2FkY2FzdCgnc2NlbmU6Y2hhbmdlLW5vZGUnLCBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZVBhdGgoY2hpbGQpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZmlsdGVyUGFydE9mUHJlZmFiQXNzZXRXaGVuQ3JlYXRlQ29tcG9uZW50KHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJQYXJ0T2ZQcmVmYWJBc3NldCh1dWlkcywgJ2l0XFwncyBub3QgYWxsb3cgdG8gYWRkIGNvbXBvbmVudCBpbiBjdXJyZW50IGNvbnRleHQgY3VycmVudGx5LCB5b3UgY2FuIGFkZCBjb21wb25lbnQgaW4gaXRcXCdzIHByZWZhYkFzc2V0IG9yIFxcXG4gICAgICAgIGRvIGl0IGFmdGVyIHVubGluayBwcmVmYWIgZnJvbSByb290IG5vZGUnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZmlsdGVyUGFydE9mUHJlZmFiQXNzZXRXaGVuUmVtb3ZlQ29tcG9uZW50KHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJQYXJ0T2ZQcmVmYWJBc3NldCh1dWlkcywgJ2l0XFwncyBub3QgYWxsb3cgdG8gcmVtb3ZlIGNvbXBvbmVudCBpbiBjdXJyZW50IGNvbnRleHQgY3VycmVudGx5LCB5b3UgY2FuIHJlbW92ZSBjb21wb25lbnQgaW4gaXRcXCdzIHByZWZhYkFzc2V0IG9yIFxcXG4gICAgICAgIGRvIGl0IGFmdGVyIHVubGluayBwcmVmYWIgZnJvbSByb290IG5vZGUnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmmrTlipvpgY3ljoZyb2905omA5pyJ5bGe5oCn77yM5om+5YiwcnVsZei/lOWbnnRydWXnmoTot6/lvoRcbiAgICAgKiDmr5TlpoLmib5TY2VuZeiKgueCueeahOi3r+W+hO+8jHJ1bGUgPSAob2JqKT0+IHJldHVybiBvYmouZ2xvYmFsc1xuICAgICAqIEBwYXJhbSByb290IOagueiKgueCuVxuICAgICAqIEBwYXJhbSBydWxlIOWIpOaWreWHveaVsFxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHVibGljIGZpbmRQYXRoV2l0aFJ1bGUocm9vdDogTm9kZSwgcnVsZTogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcGF0aDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgY2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIGNvbnN0IHdhbGsgPSBmdW5jdGlvbiAob2JqOiBhbnksIHByZWtleTogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICAgICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKG9ialtrZXldKSA9PT0gJ29iamVjdCcgJiYgb2JqW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNhY2hlLmdldChvYmpba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChvYmpba2V5XSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVsZShvYmpba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5om+5Yiw5LqGJywgcHJla2V5ICsgJ3wnICsga2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLnB1c2gocHJla2V5ICsgJ3wnICsga2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FsayhvYmpba2V5XSwgcHJla2V5ICsgJ3wnICsga2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHdhbGsocm9vdCwgJycpO1xuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBQcmVmYWJTZXJ2aWNlKCk7XG4iXX0=