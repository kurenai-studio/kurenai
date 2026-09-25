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
exports.NodeService = void 0;
const core_1 = require("./core");
const common_1 = require("../../common");
const rpc_1 = require("../rpc");
const cc_1 = require("cc");
const node_create_1 = require("./node/node-create");
const node_utils_1 = require("./node/node-utils");
const node_undo_1 = require("./node/node-undo");
const applying_state_1 = require("./undo/applying-state");
const utils_1 = require("./prefab/utils");
const utils_2 = require("./scene/utils");
const index_1 = __importDefault(require("./node/index"));
const node_type_config_1 = __importDefault(require("./node/node-type-config"));
const remove_node_command_1 = require("./undo/commands/remove-node-command");
const remove_component_command_1 = require("./undo/commands/remove-component-command");
const prefab_preview_canvas_command_1 = require("./undo/commands/prefab-preview-canvas-command");
const property_commit_event_1 = require("./animation/property-commit-event");
const path_utils_1 = require("../../../engine/editor-extends/manager/path-utils");
const NodeMgr = EditorExtends.Node;
/**
 * 子进程节点处理器
 * 在子进程中处理所有节点相关操作
 */
let NodeService = class NodeService extends core_1.BaseService {
    _undo = new node_undo_1.NodeUndoHelper((event, ...args) => this.emit(event, ...args));
    _prefabCanvasUndoRecords = null;
    _prefabCanvasUndoBeforeNodeUuids = null;
    _preflightTokens = new Map();
    _preflightTokenSequence = 0;
    async createByType(params) {
        this._validateCreateParams(params);
        try {
            await core_1.Service.Editor.lock();
            const beforeNodeUuids = this._collectSceneNodeUuidsForUndo();
            const createRootPath = this._getCreateRootPathForUndo(beforeNodeUuids, params.path);
            const { assetUuid, canvasRequired: canvasNeeded } = this._resolveTypeCreateOptions(params);
            this._validatePreflightToken(params);
            const prefabCanvasUndoRecords = this._beginPrefabCanvasUndoCapture(beforeNodeUuids);
            let result;
            try {
                result = await this._createNode(assetUuid, canvasNeeded, params.nodeType == common_1.NodeType.EMPTY, params);
            }
            finally {
                this._endPrefabCanvasUndoCapture();
            }
            this._recordCreateNodeCommand(beforeNodeUuids, [createRootPath, result?.path].filter(Boolean), prefabCanvasUndoRecords);
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
    async createByAsset(params) {
        this._validateCreateParams(params);
        try {
            await core_1.Service.Editor.lock();
            const beforeNodeUuids = this._collectSceneNodeUuidsForUndo();
            const createRootPath = this._getCreateRootPathForUndo(beforeNodeUuids, params.path);
            const assetUuid = await rpc_1.Rpc.getInstance().request('assetManager', 'queryUUID', [params.dbURL]);
            if (!assetUuid) {
                throw new Error(`Asset not found for dbURL: ${params.dbURL}`);
            }
            // 阻止添加自己到当前的Prefab中，防止Prefab的循环引用
            if (core_1.Service.Editor.getCurrentEditorType() === 'prefab') {
                const rootNode = core_1.Service.Editor.getRootNode();
                const rootNodePrefabInfo = rootNode?.['_prefab'];
                if (rootNodePrefabInfo && rootNodePrefabInfo.asset && rootNodePrefabInfo.asset._uuid === assetUuid) {
                    throw new Error('The prefab you are trying to add is the same with the prefab in editing, this is not allowed.');
                }
            }
            const assetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [assetUuid]);
            const canvasNeeded = params.canvasRequired || false;
            this._validatePreflightToken(params);
            const prefabCanvasUndoRecords = this._beginPrefabCanvasUndoCapture(beforeNodeUuids);
            let result;
            try {
                result = await this._createNode(assetUuid, canvasNeeded, false, params, assetInfo?.type);
            }
            finally {
                this._endPrefabCanvasUndoCapture();
            }
            this._recordCreateNodeCommand(beforeNodeUuids, [createRootPath, result?.path].filter(Boolean), prefabCanvasUndoRecords);
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
    async preflightCreate(params) {
        try {
            await core_1.Service.Editor.lock();
            const currentScene = core_1.Service.Editor.getRootNode();
            if (!currentScene) {
                throw new Error('Failed to preflight node creation: the scene is not opened.');
            }
            let canvasRequired;
            if ('nodeType' in params) {
                canvasRequired = this._resolveTypeCreateOptions(params).canvasRequired;
            }
            else {
                const assetUuid = await rpc_1.Rpc.getInstance().request('assetManager', 'queryUUID', [params.dbURL]);
                if (!assetUuid) {
                    throw new Error(`Asset not found for dbURL: ${params.dbURL}`);
                }
                const assetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [assetUuid]);
                const assetCanvasRequired = await (0, node_create_1.queryCanvasRequiredByAsset)({
                    uuid: assetUuid,
                    type: assetInfo?.type,
                    workMode: params.workMode || '2d',
                });
                canvasRequired = Boolean(params.canvasRequired || assetCanvasRequired);
            }
            const result = this._resolveCreatePreflight(params, canvasRequired, currentScene);
            return {
                ...result,
                preflightToken: this._createPreflightToken(params, result),
            };
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    _resolveTypeCreateOptions(params) {
        const explicitCanvasRequired = Boolean(params.canvasRequired);
        const nodeType = params.nodeType;
        const paramsArray = node_type_config_1.default[nodeType];
        if (!paramsArray || paramsArray.length === 0) {
            throw new Error(`Node type '${nodeType}' is not implemented`);
        }
        let config = paramsArray[0];
        const projectType = config['project-type'];
        if (projectType && params.workMode && projectType !== params.workMode.toLowerCase() && paramsArray.length > 1) {
            config = paramsArray[1];
        }
        return {
            assetUuid: config.assetUuid || null,
            canvasRequired: explicitCanvasRequired || Boolean(config.canvasRequired),
        };
    }
    _getCreatePathPreflight(path, currentScene) {
        if (path && !(0, path_utils_1.isRootNodePath)(path)) {
            try {
                const existingParent = NodeMgr.getNodeByPath(path);
                if (existingParent) {
                    return { parent: existingParent, materializesUITransform: false, canvasRequired: false };
                }
            }
            catch (error) {
                console.error(error);
            }
        }
        const pathParts = path?.split('/').filter(part => part.trim() !== '') ?? [];
        let parent = currentScene;
        for (const pathPart of pathParts) {
            const child = parent.getChildByName(pathPart);
            if (child) {
                parent = child;
                continue;
            }
            if (pathPart === 'Canvas') {
                return { parent, materializesUITransform: false, canvasRequired: true };
            }
            // _ensurePathExists() adds UITransform to the first missing ordinary path segment.
            return { parent, materializesUITransform: true, canvasRequired: false };
        }
        return { parent, materializesUITransform: false, canvasRequired: false };
    }
    _getCanvasContext(parent) {
        const isPrefabMode = core_1.Service.Editor.getCurrentEditorType() === 'prefab';
        const canvasContextNode = (0, node_utils_1.getUICanvasNode)(parent, !isPrefabMode);
        const uiTransformNode = (0, node_utils_1.getUITransformParentNode)(parent);
        return {
            hasCanvasContext: Boolean(canvasContextNode),
            canvasNode: canvasContextNode,
            uiTransformNode,
        };
    }
    _resolveCreatePreflight(params, canvasRequired, currentScene) {
        const pathPlan = this._getCreatePathPreflight(params.path, currentScene);
        if (pathPlan.materializesUITransform) {
            return {
                action: 'create',
                canvasRequired,
                canvasPath: null,
                uiTransformPath: null,
            };
        }
        const effectiveCanvasRequired = canvasRequired || pathPlan.canvasRequired;
        const context = this._getCanvasContext(pathPlan.parent);
        const requiresPrefabCanvasHandling = effectiveCanvasRequired
            && core_1.Service.Editor.getCurrentEditorType() === 'prefab'
            && !context.hasCanvasContext
            && !context.uiTransformNode;
        return {
            action: requiresPrefabCanvasHandling ? 'choose-prefab-canvas-handling' : 'create',
            canvasRequired: effectiveCanvasRequired,
            canvasPath: context.canvasNode ? NodeMgr.getNodePath(context.canvasNode) ?? null : null,
            uiTransformPath: context.uiTransformNode ? NodeMgr.getNodePath(context.uiTransformNode) ?? null : null,
        };
    }
    _createPreflightToken(params, result) {
        const token = `node-create-${Date.now().toString(36)}-${(++this._preflightTokenSequence).toString(36)}`;
        if (this._preflightTokens.size >= 128) {
            const oldestToken = this._preflightTokens.keys().next().value;
            if (oldestToken) {
                this._preflightTokens.delete(oldestToken);
            }
        }
        this._preflightTokens.set(token, {
            requestKey: this._getPreflightRequestKey(params),
            action: result.action,
            canvasRequired: result.canvasRequired,
        });
        return token;
    }
    _validatePreflightToken(params) {
        if (!params.preflightToken) {
            return;
        }
        const record = this._preflightTokens.get(params.preflightToken);
        this._preflightTokens.delete(params.preflightToken);
        if (!record || record.requestKey !== this._getPreflightRequestKey(params)) {
            throw new Error('The node creation preflight token is invalid or does not match the request. Run preflightCreate again.');
        }
        if (record.action !== 'create') {
            return;
        }
        const currentScene = core_1.Service.Editor.getRootNode();
        if (!currentScene) {
            throw new Error('Failed to create node: the scene is not opened.');
        }
        const currentResult = this._resolveCreatePreflight(params, record.canvasRequired, currentScene);
        if (currentResult.action !== 'create') {
            throw new Error('Canvas context changed after preflight. Run preflightCreate again before creating the node.');
        }
    }
    _getPreflightRequestKey(params) {
        return JSON.stringify('nodeType' in params ? {
            kind: 'type',
            path: params.path,
            nodeType: params.nodeType,
            workMode: params.workMode ?? '2d',
            canvasRequired: Boolean(params.canvasRequired),
        } : {
            kind: 'asset',
            path: params.path,
            dbURL: params.dbURL,
            workMode: params.workMode ?? '2d',
            canvasRequired: Boolean(params.canvasRequired),
        });
    }
    async _createNode(assetUuid, canvasNeeded, checkUITransform, params, assetType) {
        const currentScene = core_1.Service.Editor.getRootNode();
        if (!currentScene) {
            throw new Error('Failed to create node: the scene is not opened.');
        }
        const workMode = params.workMode || '2d';
        // 使用增强的路径处理方法
        let parent = await this._getOrCreateNodeByPath(params.path, currentScene, params.prefabCanvasHandling);
        if (!parent) {
            parent = currentScene;
        }
        let resultNode;
        let canvasRequired = canvasNeeded;
        if (assetUuid) {
            const createResult = await (0, node_create_1.createNodeByAsset)({
                uuid: assetUuid,
                canvasRequired: canvasNeeded,
                type: assetType,
                workMode: workMode,
            });
            resultNode = createResult.node;
            canvasRequired = Boolean(canvasNeeded || createResult.canvasRequired);
        }
        if (!resultNode) {
            resultNode = new cc.Node();
        }
        if (!resultNode) {
            return null;
        }
        if (checkUITransform) {
            index_1.default.ensureUITransformComponent(resultNode);
        }
        parent = await this.checkCanvasRequired(workMode.toLowerCase(), Boolean(canvasRequired), parent, params.position, params.prefabCanvasHandling);
        /**
         * 默认创建节点是从 prefab 模板，所以初始是 prefab 节点
         * 是否要 unlink 为普通节点
         * 有 nodeType 说明是内置资源创建的，需要移除 prefab info
         * createByAsset 时，如果 assetType 不是 cc.Prefab 或者 unlinkPrefab 为 true，也需要移除
         */
        const shouldUnlinkPrefab = 'nodeType' in params || assetType !== 'cc.Prefab' || params.unlinkPrefab;
        if (shouldUnlinkPrefab) {
            core_1.Service.Prefab.removePrefabInfoFromNode(resultNode, true);
        }
        if (params.name) {
            resultNode.name = params.name;
        }
        this.emit('node:before-add', resultNode);
        if (parent) {
            this.emit('node:before-change', parent);
        }
        /**
         * 新节点的 layer 跟随父级节点，但父级节点为场景根节点除外
         * parent.layer 可能为 0 （界面下拉框为 None），此情况下新节点不跟随
         */
        if (parent && parent.layer && parent !== currentScene) {
            (0, node_utils_1.setLayer)(resultNode, parent.layer, true);
        }
        // Compared to the editor, the position is set via API, so local coordinates are used here.
        if (params.position) {
            resultNode.setPosition(params.position);
        }
        resultNode.setParent(parent, params.keepWorldTransform);
        // 挂到 prefab instance 下时，setParent 相关流程可能重新补回模板 prefab 信息。
        // 但在 prefab asset 编辑器中，新节点需要保留 setParent 补齐的 prefab 元数据。
        if (shouldUnlinkPrefab && core_1.Service.Editor.getCurrentEditorType() !== 'prefab') {
            core_1.Service.Prefab.removePrefabInfoFromNode(resultNode, true);
        }
        // 发送添加节点事件，添加节点中的根节点
        this.emit('node:add', resultNode);
        return utils_2.sceneUtils.generateNodeDump(resultNode);
    }
    /**
     * 获取或创建路径节点
     */
    async _getOrCreateNodeByPath(path, currentScene, prefabCanvasHandling) {
        // '/' 指当前编辑器的根：prefab 模式下是 prefab 根节点，而不是承载它的虚拟场景。
        // 交回 null 让上层 fallback 到 currentScene（= Service.Editor.getRootNode()）。
        if (!path || (0, path_utils_1.isRootNodePath)(path)) {
            return null;
        }
        // 先尝试获取现有节点
        try {
            const parent = NodeMgr.getNodeByPath(path);
            if (parent) {
                return parent;
            }
        }
        catch (error) {
            console.error(error);
        }
        // 如果不存在，则创建路径
        return await this._ensurePathExists(path, currentScene, prefabCanvasHandling);
    }
    _validateCreateParams(params) {
        this._validateRequestedNodeName(params.name);
        this._validateRequestedNodePath(params.path);
    }
    _validateRequestedNodeName(name) {
        if (name === undefined) {
            return;
        }
        const error = (0, path_utils_1.validateNodeName)(name);
        if (error) {
            throw new Error(error);
        }
    }
    _validateRequestedNodePath(path) {
        for (const segment of path.split('/').filter((part) => part.trim() !== '')) {
            this._validateRequestedNodeName(segment);
        }
    }
    /**
     * 确保路径存在，如果不存在则创建空节点
     */
    async _ensurePathExists(path, currentScene, prefabCanvasHandling) {
        if (!path) {
            return null;
        }
        if (!currentScene) {
            return null;
        }
        // 分割路径
        const pathParts = path.split('/').filter(part => part.trim() !== '');
        if (pathParts.length === 0) {
            return null;
        }
        let currentParent = currentScene;
        // 逐级检查并创建路径
        for (let i = 0; i < pathParts.length; i++) {
            const pathPart = pathParts[i];
            const parentPrefix = (0, path_utils_1.stripLeadingSlashes)(NodeMgr.getNodePath(currentParent));
            const candidatePath = parentPrefix ? `${parentPrefix}/${pathPart}` : pathPart;
            let nextNode = NodeMgr.getNodeByPath(candidatePath);
            if (!nextNode) {
                if (pathPart === 'Canvas') {
                    nextNode = await this.checkCanvasRequired('2d', true, currentParent, undefined, prefabCanvasHandling);
                }
                else {
                    // 创建空节点
                    nextNode = new cc_1.Node(pathPart);
                    // 设置父级
                    nextNode.setParent(currentParent);
                    // 确保新创建的节点有必要的组件
                    index_1.default.ensureUITransformComponent(nextNode);
                    // 发送节点创建事件
                    this.emit('node:add', nextNode);
                }
            }
            if (!nextNode) {
                throw new Error(`Failed to create node: the path ${path} is not valid.`);
            }
            currentParent = nextNode;
        }
        return currentParent;
    }
    async delete(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to delete node: the scene is not opened.');
            }
            const path = params.path;
            const node = NodeMgr.getNodeByPath(path);
            if (!node) {
                return null;
            }
            const uuids = core_1.Service.Prefab.filterChildOfPrefabAssetWhenRemoveNode(node.uuid);
            if (!uuids.length) {
                return null;
            }
            let command = null;
            if (this._undo.shouldRecordStructureCommand()) {
                command = remove_node_command_1.RemoveNodeCommand.capture(node, params.keepWorldTransform);
            }
            index_1.default.baseRemoveNode(node, params.keepWorldTransform);
            if (command) {
                core_1.Service.Undo?.push(command);
            }
            return {
                path: path,
            };
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async query(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to query node: the scene is not opened.');
            }
            const path = params?.path;
            let node = root;
            // '/' 指当前编辑器的根：场景模式下是场景，prefab 模式下是 prefab 根，而非承载它的虚拟场景
            if (path && !(0, path_utils_1.isRootNodePath)(path)) {
                node = NodeMgr.getNodeByPath(path);
            }
            if (!node)
                return null;
            return utils_2.sceneUtils.generateNodeDump(node, params);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async queryNodeTree(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to query node tree: the scene is not opened.');
            }
            const step = (node) => {
                if (node.objFlags & cc_1.CCObject.Flags.HideInHierarchy) {
                    return null;
                }
                const children = node.children.map(step).filter(Boolean);
                const prefabStateInfo = utils_1.prefabUtils.getPrefabStateInfo(node);
                const isScene = node.constructor.name === 'Scene';
                let name = node.name;
                if (!name && isScene) {
                    name = 'Scene';
                }
                let path = NodeMgr.getNodePath(node);
                if (isScene) {
                    path = '/';
                }
                return {
                    name,
                    active: node.active,
                    locked: Boolean(node.objFlags & cc_1.CCObject.Flags.LockedInEditor),
                    type: 'cc.' + node.constructor.name,
                    uuid: node.uuid,
                    children,
                    prefab: prefabStateInfo,
                    parent: (node.parent && node.parent.uuid) || '',
                    path,
                    isScene,
                    readonly: false,
                    components: node.components.map((comp) => {
                        const className = cc.js.getClassName(comp.constructor);
                        return {
                            isCustom: core_1.Service.Script.isCustomComponent(comp.constructor),
                            type: className,
                            value: comp.uuid,
                            extends: cc_1.CCClass.getInheritanceChain(comp.constructor)
                                .map((itemCtor) => cc.js.getClassName(itemCtor))
                                .filter(Boolean),
                        };
                    }),
                };
            };
            let node = root;
            if (params.path) {
                node = NodeMgr.getNodeByPath(params.path);
            }
            if (!node) {
                return null;
            }
            return step(node);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    queryNodesByAssetUuid(uuid) {
        return index_1.default.queryNodesByAssetUuid(uuid);
    }
    async queryNodesMissAsset() {
        return await index_1.default.queryNodesMissAsset();
    }
    /**
     * 检查并根据需要创建 canvas节点或为父级添加UITransform组件，返回父级节点，如果需要canvas节点，则父级节点会是canvas节点
     * @param workMode
     * @param canvasRequiredParam
     * @param parent
     * @param position
     * @returns
     */
    async checkCanvasRequired(workMode, canvasRequiredParam, parent, position, prefabCanvasHandling) {
        if (canvasRequiredParam && parent?.isValid) {
            let canvasNode;
            const isPrefabMode = core_1.Service.Editor.getCurrentEditorType() === 'prefab';
            if (isPrefabMode) {
                const rootNode = core_1.Service.Editor.getRootNode();
                if (parent === cc_1.director.getScene() && rootNode) {
                    parent = rootNode;
                }
                canvasNode = (0, node_utils_1.getUICanvasNode)(parent, false);
                const uiTransformParentNode = (0, node_utils_1.getUITransformParentNode)(parent);
                if (!canvasNode) {
                    if (uiTransformParentNode) {
                        canvasNode = uiTransformParentNode;
                    }
                    else if (prefabCanvasHandling === 'add-root-ui-transform') {
                        canvasNode = await this.ensurePrefabRootUITransform(workMode);
                    }
                    else if (!prefabCanvasHandling) {
                        canvasNode = new cc_1.Node();
                    }
                }
                else if (canvasNode.parent !== cc_1.director.getScene()) {
                    parent = canvasNode;
                }
            }
            else {
                canvasNode = (0, node_utils_1.getUICanvasNode)(parent);
                if (canvasNode) {
                    parent = canvasNode;
                }
            }
            // 自动创建一个 canvas 节点
            if (!canvasNode) {
                let canvasAssetUuid = 'f773db21-62b8-4540-956a-29bacf5ddbf5';
                if (workMode === '2d') {
                    canvasAssetUuid = '4c33600e-9ca9-483b-b734-946008261697';
                }
                const canvasAsset = await (0, node_create_1.loadAny)(canvasAssetUuid);
                canvasNode = cc.instantiate(canvasAsset);
                core_1.Service.Prefab.removePrefabInfoFromNode(canvasNode);
                if (parent) {
                    parent.addChild(canvasNode);
                }
                parent = canvasNode;
            }
            // 目前 canvas 默认 z 为 1，而拖放到 Canvas 的控件因为检测的是 z 为 0 的平面，所以这边先强制把 z 设置为和 canvas 的一样
            if (position) {
                position.z = canvasNode.position.z;
            }
        }
        return parent;
    }
    async ensurePrefabRootUITransform(workMode) {
        const rootNode = core_1.Service.Editor.getRootNode();
        if (!rootNode?.isValid) {
            return null;
        }
        const undoRecord = this._createPrefabCanvasUndoRecord(rootNode, workMode);
        if (!(0, node_utils_1.hasOneKindOfComponent)(rootNode, cc_1.UITransform)) {
            undoRecord.addedUITransform = rootNode.addComponent('cc.UITransform');
        }
        if (rootNode.parent && !(0, node_utils_1.hasOneKindOfComponent)(rootNode.parent, cc_1.Canvas)) {
            const canvasNode = await (0, node_create_1.createShouldHideInHierarchyCanvasNode)(cc_1.director.getScene(), workMode);
            undoRecord.previewCanvasNode = canvasNode;
            undoRecord.previewCanvasCreated = !this._prefabCanvasUndoBeforeNodeUuids?.has(canvasNode.uuid);
            rootNode.parent = canvasNode;
            this._pushPrefabCanvasUndoRecord(undoRecord);
            return canvasNode;
        }
        this._pushPrefabCanvasUndoRecord(undoRecord);
        return rootNode;
    }
    _createPrefabCanvasUndoRecord(rootNode, workMode) {
        const rootParent = rootNode.parent;
        return {
            rootNode,
            rootParentUuid: rootParent?.uuid ?? null,
            rootParentPath: rootParent ? (NodeMgr.getNodePath(rootParent) ?? '/') : '/',
            rootSiblingIndex: rootNode.getSiblingIndex(),
            addedUITransform: null,
            previewCanvasNode: null,
            previewCanvasCreated: false,
            workMode,
        };
    }
    _pushPrefabCanvasUndoRecord(record) {
        if (!this._prefabCanvasUndoRecords) {
            return;
        }
        if (!record.addedUITransform && !record.previewCanvasNode) {
            return;
        }
        this._prefabCanvasUndoRecords.push(record);
    }
    onEditorOpened() {
        index_1.default.onEditorOpened();
        // 节点缓存刷新完成后，再注册组件事件转发。
        core_1.Service.Component.init();
    }
    onEditorClosed() {
        // nodeMgr 清理 EditorExtends.Component 缓存前，先停止组件事件转发。
        core_1.Service.Component.unregisterCompMgrEvents();
        index_1.default.onEditorClosed();
        this._cutUuids = [];
    }
    async previewSetProperty(options) {
        const node = NodeMgr.getNodeByPath(options.nodePath);
        if (!node) {
            return false;
        }
        return await index_1.default.previewSetNodeProperty(node.uuid, options.path, options.dump);
    }
    async cancelPreviewSetProperty(options) {
        const node = NodeMgr.getNodeByPath(options.nodePath);
        if (!node) {
            return false;
        }
        return await index_1.default.cancelPreviewSetNodeProperty(node.uuid, options.path);
    }
    async setProperty(options) {
        const node = NodeMgr.getNodeByPath(options.nodePath);
        if (!node) {
            return false;
        }
        const result = await this._undo.recordNodeSnapshot(node, {
            label: `Set ${options.path}`,
            type: 'node:set-property',
            record: options.record,
            scope: {
                editorType: 'scene',
                nodePath: options.nodePath,
                propPath: options.path,
            },
        }, async () => {
            if (options.path === 'name' && options.dump.value !== node.name) {
                // Reject new illegal input at the API boundary; the lower-level manager accepts it only for legacy undo/redo restoration.
                const nameError = (0, path_utils_1.validateNodeName)(options.dump.value);
                if (nameError) {
                    throw new Error(nameError);
                }
                this.emit('node:before-change', node);
                NodeMgr.updateNodeName(node.uuid, options.dump.value);
                this.emit('node:change', node, { type: common_1.NodeEventType.SET_PROPERTY, propPath: 'name' });
                return true;
            }
            return await index_1.default.setProperty(node.uuid, options.path, options.dump, options.record);
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
    async reset(path) {
        const node = NodeMgr.getNodeByPath(path);
        if (!node) {
            return false;
        }
        return this._undo.recordNodeSnapshot(node, {
            label: 'Reset Node',
            type: 'node:reset',
        }, async () => await index_1.default.resetNode(node.uuid));
    }
    async resetProperty(options) {
        const node = NodeMgr.getNodeByPath(options.nodePath);
        if (!node) {
            return false;
        }
        return this._undo.recordNodeSnapshot(node, {
            label: `Reset ${options.path}`,
            type: 'node:reset-property',
            record: options.record,
        }, async () => await index_1.default.resetProperty(node.uuid, options.path));
    }
    _collectSceneNodeUuidsForUndo() {
        if (!this._undo.shouldRecordStructureCommand()) {
            return null;
        }
        return this._undo.collectSceneNodeUuids();
    }
    _getCreateRootPathForUndo(beforeNodeUuids, path) {
        if (!beforeNodeUuids) {
            return null;
        }
        return this._undo.getCreateRootPath(path);
    }
    _beginPrefabCanvasUndoCapture(beforeNodeUuids) {
        if (!beforeNodeUuids) {
            return null;
        }
        const records = [];
        this._prefabCanvasUndoRecords = records;
        this._prefabCanvasUndoBeforeNodeUuids = beforeNodeUuids;
        return records;
    }
    _endPrefabCanvasUndoCapture() {
        this._prefabCanvasUndoRecords = null;
        this._prefabCanvasUndoBeforeNodeUuids = null;
    }
    _recordCreateNodeCommand(beforeNodeUuids, preferredRootPaths, prefabCanvasUndoRecords) {
        if (!prefabCanvasUndoRecords?.length) {
            this._undo.recordCreateNodeCommand(beforeNodeUuids, preferredRootPaths);
            return;
        }
        const ownsGroup = !core_1.Service.Undo?.isGroupActive?.();
        const groupId = ownsGroup ? core_1.Service.Undo?.beginGroup?.({ label: 'Create Node' }) : null;
        try {
            this._recordPrefabCanvasUndoCommands(prefabCanvasUndoRecords);
            this._undo.recordCreateNodeCommand(beforeNodeUuids, preferredRootPaths);
            if (groupId) {
                core_1.Service.Undo?.endGroup?.(groupId);
            }
        }
        catch (error) {
            if (groupId) {
                core_1.Service.Undo?.cancelGroup?.(groupId);
            }
            throw error;
        }
    }
    _recordPrefabCanvasUndoCommands(records) {
        for (const record of records) {
            if (record.addedUITransform?.isValid) {
                const command = this._captureAddComponentCommand(record.addedUITransform);
                if (command) {
                    core_1.Service.Undo?.push(command);
                }
            }
            if (record.previewCanvasNode?.isValid) {
                core_1.Service.Undo?.push(new prefab_preview_canvas_command_1.PrefabPreviewCanvasCommand({
                    rootUuid: record.rootNode.uuid,
                    rootPath: NodeMgr.getNodePath(record.rootNode) ?? '',
                    rootParentUuid: record.rootParentUuid,
                    rootParentPath: record.rootParentPath,
                    rootSiblingIndex: record.rootSiblingIndex,
                    previewCanvasUuid: record.previewCanvasNode.uuid,
                    previewCanvasPath: NodeMgr.getNodePath(record.previewCanvasNode) ?? '',
                    removePreviewCanvasOnUndo: record.previewCanvasCreated,
                    workMode: record.workMode,
                }));
            }
        }
    }
    _captureAddComponentCommand(component) {
        const { AddComponentCommand } = require('./undo/commands/add-component-command');
        return AddComponentCommand.capture(component);
    }
    _captureReparentSnapshotsForUndo(nodes) {
        if (core_1.Service.Undo?.isApplying?.()) {
            return null;
        }
        if (this._undo.hasActiveRecordingForNodes(nodes)) {
            return null;
        }
        return this._undo.captureReparentSnapshots(nodes);
    }
    _captureNodeSnapshotsForUndo(nodes) {
        if (core_1.Service.Undo?.isApplying?.()) {
            return null;
        }
        if (this._undo.hasActiveRecordingForNodes(nodes)) {
            return null;
        }
        return this._undo.captureNodeSnapshots(nodes);
    }
    _getNodePathByUuid(uuid) {
        const node = index_1.default.query(uuid);
        if (!node) {
            return '';
        }
        return NodeMgr.getNodePath(node) || '';
    }
    async updatePropertyFromNull(options) {
        const node = NodeMgr.getNodeByPath(options.nodePath);
        if (!node) {
            return false;
        }
        return this._undo.recordNodeSnapshot(node, {
            label: `Update ${options.path}`,
            type: 'node:update-property-from-null',
            record: options.record,
        }, async () => await index_1.default.updatePropertyFromNull(node.uuid, options.path));
    }
    async setNodeAndChildrenLayer(options) {
        const node = NodeMgr.getNodeByPath(options.nodePath);
        if (!node) {
            return;
        }
        const nodes = this._undo.collectNodeTree(node);
        if (options.record === false ||
            core_1.Service.Undo?.isApplying?.() ||
            this._undo.hasActiveRecordingForNodes(nodes)) {
            return await index_1.default.setNodeAndChildrenLayer(node.uuid, options.dump);
        }
        const before = this._undo.captureNodeSnapshots(nodes);
        await index_1.default.setNodeAndChildrenLayer(node.uuid, options.dump);
        const afterNodes = this._undo.findSnapshotNodes(before);
        const after = this._undo.captureNodeSnapshots(afterNodes);
        this._undo.pushNodeSnapshotCommand('node:set-node-and-children-layer', 'Set Node And Children Layer', before, after);
    }
    getPathByUuid(uuid) {
        return index_1.default.getPathByUuid(uuid);
    }
    async setParent(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to set parent: the scene is not opened.');
            }
            const uuids = params.paths.map(p => {
                const node = NodeMgr.getNodeByPath(p);
                if (!node)
                    throw new Error(`Node not found at path: ${p}`);
                return node.uuid;
            });
            const parentNode = NodeMgr.getNodeByPath(params.parentPath);
            if (!parentNode) {
                throw new Error(`Parent node not found at path: ${params.parentPath}`);
            }
            const nodes = uuids
                .map(uuid => NodeMgr.getNode(uuid))
                .filter((node) => !!node?.isValid);
            const before = this._captureReparentSnapshotsForUndo(nodes);
            const movedUuids = index_1.default.setParent(parentNode.uuid, uuids, params.keepWorldTransform);
            this._undo.recordReparentSnapshots('node:set-parent', 'Set Parent', before, movedUuids);
            return movedUuids.map(uuid => this._getNodePathByUuid(uuid)).filter(Boolean);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async reorder(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to reorder: the scene is not opened.');
            }
            const parentNode = NodeMgr.getNodeByPath(params.path);
            if (!parentNode) {
                throw new Error(`Parent node not found at path: ${params.path}`);
            }
            return await this._undo.moveChildArrayElementByUuid(parentNode.uuid, 'children', params.target, params.offset);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    _cutUuids = [];
    async copy(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to copy node: the scene is not opened.');
            }
            const uuids = params.paths.map(p => {
                const node = NodeMgr.getNodeByPath(p);
                if (!node)
                    throw new Error(`Node not found at path: ${p}`);
                return node.uuid;
            });
            // copy 覆盖之前的 cut 标记
            this._cutUuids = [];
            const copiedUuids = index_1.default.copy(uuids);
            return copiedUuids.map(uuid => this._getNodePathByUuid(uuid)).filter(Boolean);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async paste(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to paste node: the scene is not opened.');
            }
            let parentUuid = null;
            if (params.parentPath) {
                const parentNode = NodeMgr.getNodeByPath(params.parentPath);
                if (!parentNode) {
                    throw new Error(`Parent node not found at path: ${params.parentPath}`);
                }
                parentUuid = parentNode.uuid;
            }
            // 剪切粘贴：移动节点而非创建副本
            if (this._cutUuids.length > 0) {
                const cutUuids = this._cutUuids;
                this._cutUuids = [];
                const nodes = cutUuids
                    .map(uuid => NodeMgr.getNode(uuid))
                    .filter((node) => !!node?.isValid);
                const before = this._captureReparentSnapshotsForUndo(nodes);
                const movedUuids = index_1.default.setParent(parentUuid || root.uuid, cutUuids, !!params.keepWorldTransform);
                this._undo.recordReparentSnapshots('node:paste-cut', 'Paste Cut Nodes', before, movedUuids);
                return movedUuids.map(uuid => this._getNodePathByUuid(uuid)).filter(Boolean);
            }
            // 普通粘贴：创建副本
            const copiedUuids = index_1.default.getCopiedUuids();
            if (copiedUuids.length === 0) {
                throw new Error('No nodes have been copied.');
            }
            const beforeNodeUuids = this._collectSceneNodeUuidsForUndo();
            const newUuids = index_1.default.paste(parentUuid || root.uuid, copiedUuids, params.keepWorldTransform);
            const newPaths = newUuids.map(uuid => this._getNodePathByUuid(uuid)).filter(Boolean);
            this._undo.recordCreateNodeCommand(beforeNodeUuids, newPaths);
            return newPaths;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async duplicate(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to duplicate node: the scene is not opened.');
            }
            const uuids = params.paths.map(p => {
                const node = NodeMgr.getNodeByPath(p);
                if (!node)
                    throw new Error(`Node not found at path: ${p}`);
                return node.uuid;
            });
            const beforeNodeUuids = this._collectSceneNodeUuidsForUndo();
            const newUuids = index_1.default.duplicate(uuids);
            const newPaths = newUuids.map(uuid => this._getNodePathByUuid(uuid)).filter(Boolean);
            this._undo.recordCreateNodeCommand(beforeNodeUuids, newPaths);
            return newPaths;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async cut(params) {
        try {
            await core_1.Service.Editor.lock();
            const root = core_1.Service.Editor.getRootNode();
            if (!root) {
                throw new Error('Failed to cut node: the scene is not opened.');
            }
            const uuids = params.paths.map(p => {
                const node = NodeMgr.getNodeByPath(p);
                if (!node)
                    throw new Error(`Node not found at path: ${p}`);
                return node.uuid;
            });
            // 只标记为剪切，不立即删除；paste 时通过 setParent 移动节点
            this._cutUuids = uuids;
            return params.paths;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async queryClipboardState() {
        if (this._cutUuids.length > 0) {
            const paths = this._cutUuids.map(uuid => this._getNodePathByUuid(uuid)).filter(Boolean);
            return { type: 'cut', paths };
        }
        const copiedUuids = index_1.default.getCopiedUuids();
        if (copiedUuids.length > 0) {
            const paths = copiedUuids.map(uuid => this._getNodePathByUuid(uuid)).filter(Boolean);
            return { type: 'copy', paths };
        }
        return { type: 'none', paths: [] };
    }
    async moveArrayElement(params) {
        try {
            await core_1.Service.Editor.lock();
            const node = NodeMgr.getNodeByPath(params.nodePath);
            if (!node) {
                throw new Error(`Node not found at path: ${params.nodePath}`);
            }
            return await this._undo.moveArrayElementByUuid(node.uuid, params.path, params.target, params.offset);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
    async removeArrayElement(params) {
        try {
            await core_1.Service.Editor.lock();
            const node = NodeMgr.getNodeByPath(params.nodePath);
            if (!node) {
                throw new Error(`Node not found at path: ${params.nodePath}`);
            }
            const normalizedPath = params.path.replace('__comps__', '_components');
            let component;
            if (normalizedPath === '_components') {
                component = node.components[params.index];
            }
            const shouldRecord = !core_1.Service.Undo?.isApplying?.() && !core_1.Service.Undo?.hasActiveRecording?.(node.uuid);
            let command = null;
            if (shouldRecord && component) {
                command = remove_component_command_1.RemoveComponentCommand.capture(component);
            }
            let before = null;
            if (shouldRecord && !command) {
                before = this._undo.captureNodeSnapshots([node]);
            }
            const result = index_1.default.removeArrayElement(node.uuid, params.path, params.index);
            if (!result) {
                return result;
            }
            if (command) {
                core_1.Service.Undo?.push(command);
            }
            else if (before) {
                const latestNode = NodeMgr.getNode(node.uuid);
                if (latestNode?.isValid) {
                    const after = this._undo.captureNodeSnapshots([latestNode]);
                    this._undo.pushNodeSnapshotCommand('node:remove-array-element', 'Remove Array Element', before, after);
                }
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
    async changeNodeLock(params) {
        try {
            await core_1.Service.Editor.lock();
            const uuids = params.paths.map(p => {
                const node = NodeMgr.getNodeByPath(p);
                if (!node)
                    throw new Error(`Node not found at path: ${p}`);
                return node.uuid;
            });
            const rootNodes = uuids
                .map(uuid => NodeMgr.getNode(uuid))
                .filter((node) => !!node?.isValid);
            let nodes = rootNodes;
            if (params.loop) {
                nodes = rootNodes.flatMap(node => this._undo.collectNodeTree(node));
            }
            nodes = this._undo.dedupeNodes(nodes);
            const before = this._captureNodeSnapshotsForUndo(nodes);
            index_1.default.changeNodeLock(uuids, params.locked, params.loop ?? false);
            if (before) {
                const afterNodes = this._undo.findSnapshotNodes(before);
                const after = this._undo.captureNodeSnapshots(afterNodes);
                this._undo.pushNodeSnapshotCommand('node:change-lock', 'Change Node Lock', before, after);
            }
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        finally {
            core_1.Service.Editor.unlock();
        }
    }
};
exports.NodeService = NodeService;
exports.NodeService = NodeService = __decorate([
    (0, core_1.register)('Node')
], NodeService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLGlDQUF3RDtBQUN4RCx5Q0EwQnNCO0FBRXRCLGdDQUE2QjtBQUM3QiwyQkFBMkc7QUFDM0csb0RBQW1JO0FBQ25JLGtEQUErRztBQUMvRyxnREFBa0Q7QUFDbEQsMERBQXVEO0FBQ3ZELDBDQUE2QztBQUM3Qyx5Q0FBMkM7QUFDM0MseURBQW1DO0FBQ25DLCtFQUFpRDtBQUNqRCw2RUFBd0U7QUFDeEUsdUZBQWtGO0FBQ2xGLGlHQUEyRjtBQUMzRiw2RUFBd0Y7QUFDeEYsa0ZBQTBIO0FBRTFILE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7QUFtQm5DOzs7R0FHRztBQUVJLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSxrQkFBd0I7SUFDcEMsS0FBSyxHQUFHLElBQUksMEJBQWMsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFGLHdCQUF3QixHQUFxQyxJQUFJLENBQUM7SUFDbEUsZ0NBQWdDLEdBQXVCLElBQUksQ0FBQztJQUNuRCxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBaUMsQ0FBQztJQUNyRSx1QkFBdUIsR0FBRyxDQUFDLENBQUM7SUFFcEMsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUErQjtRQUM5QyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDO1lBQ0QsTUFBTSxjQUFPLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzVCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyw2QkFBNkIs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O0NBQ0osQ0FBQTtBQTd0Q1ksa0NBQVc7c0JBQVgsV0FBVztJQUR2QixJQUFBLGVBQVEsRUFBQyxNQUFNLENBQUM7R0FDSixXQUFXLENBNnRDdkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWdpc3RlciwgQmFzZVNlcnZpY2UsIFNlcnZpY2UgfSBmcm9tICcuL2NvcmUnO1xuaW1wb3J0IHtcbiAgICB0eXBlIElDcmVhdGVCeUFzc2V0UGFyYW1zLFxuICAgIHR5cGUgSUNyZWF0ZUJ5Tm9kZVR5cGVQYXJhbXMsXG4gICAgdHlwZSBJQ3JlYXRlTm9kZVByZWZsaWdodFJlc3VsdCxcbiAgICB0eXBlIElEZWxldGVOb2RlUGFyYW1zLFxuICAgIHR5cGUgSURlbGV0ZU5vZGVSZXN1bHQsXG4gICAgdHlwZSBJTm9kZSxcbiAgICB0eXBlIElOb2RlU2VydmljZSxcbiAgICB0eXBlIElRdWVyeU5vZGVQYXJhbXMsXG4gICAgdHlwZSBJUXVlcnlOb2RlVHJlZVBhcmFtcyxcbiAgICB0eXBlIElOb2RlVHJlZUl0ZW0sXG4gICAgdHlwZSBJTm9kZUV2ZW50cyxcbiAgICB0eXBlIElTZXRQYXJlbnRQYXJhbXMsXG4gICAgdHlwZSBJUmVvcmRlclBhcmFtcyxcbiAgICB0eXBlIElDb3B5UGFyYW1zLFxuICAgIHR5cGUgSVBhc3RlUGFyYW1zLFxuICAgIHR5cGUgSUR1cGxpY2F0ZVBhcmFtcyxcbiAgICB0eXBlIElDdXRQYXJhbXMsXG4gICAgdHlwZSBJQ2xpcGJvYXJkU3RhdGUsXG4gICAgdHlwZSBJTW92ZUFycmF5RWxlbWVudFBhcmFtcyxcbiAgICB0eXBlIElSZW1vdmVBcnJheUVsZW1lbnRQYXJhbXMsXG4gICAgdHlwZSBJQ2hhbmdlTm9kZUxvY2tQYXJhbXMsXG4gICAgdHlwZSBQcmVmYWJDYW52YXNIYW5kbGluZyxcbiAgICBOb2RlVHlwZSxcbiAgICBOb2RlRXZlbnRUeXBlLFxuICAgIElTZXRQcm9wZXJ0eU9wdGlvbnMsXG59IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyB0eXBlIElTY2VuZSB9IGZyb20gJy4uLy4uL2NvbW1vbi9lZGl0b3Ivc2NlbmUnO1xuaW1wb3J0IHsgUnBjIH0gZnJvbSAnLi4vcnBjJztcbmltcG9ydCB7IENhbnZhcywgQ0NDbGFzcywgQ0NPYmplY3QsIENvbXBvbmVudCwgZGlyZWN0b3IsIE5vZGUsIFByZWZhYiwgUXVhdCwgVUlUcmFuc2Zvcm0sIFZlYzMgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBjcmVhdGVOb2RlQnlBc3NldCwgY3JlYXRlU2hvdWxkSGlkZUluSGllcmFyY2h5Q2FudmFzTm9kZSwgbG9hZEFueSwgcXVlcnlDYW52YXNSZXF1aXJlZEJ5QXNzZXQgfSBmcm9tICcuL25vZGUvbm9kZS1jcmVhdGUnO1xuaW1wb3J0IHsgZ2V0VUlDYW52YXNOb2RlLCBnZXRVSVRyYW5zZm9ybVBhcmVudE5vZGUsIGhhc09uZUtpbmRPZkNvbXBvbmVudCwgc2V0TGF5ZXIgfSBmcm9tICcuL25vZGUvbm9kZS11dGlscyc7XG5pbXBvcnQgeyBOb2RlVW5kb0hlbHBlciB9IGZyb20gJy4vbm9kZS9ub2RlLXVuZG8nO1xuaW1wb3J0IHsgaXNVbmRvQXBwbHlpbmcgfSBmcm9tICcuL3VuZG8vYXBwbHlpbmctc3RhdGUnO1xuaW1wb3J0IHsgcHJlZmFiVXRpbHMgfSBmcm9tICcuL3ByZWZhYi91dGlscyc7XG5pbXBvcnQgeyBzY2VuZVV0aWxzIH0gZnJvbSAnLi9zY2VuZS91dGlscyc7XG5pbXBvcnQgbm9kZU1nciBmcm9tICcuL25vZGUvaW5kZXgnO1xuaW1wb3J0IE5vZGVDb25maWcgZnJvbSAnLi9ub2RlL25vZGUtdHlwZS1jb25maWcnO1xuaW1wb3J0IHsgUmVtb3ZlTm9kZUNvbW1hbmQgfSBmcm9tICcuL3VuZG8vY29tbWFuZHMvcmVtb3ZlLW5vZGUtY29tbWFuZCc7XG5pbXBvcnQgeyBSZW1vdmVDb21wb25lbnRDb21tYW5kIH0gZnJvbSAnLi91bmRvL2NvbW1hbmRzL3JlbW92ZS1jb21wb25lbnQtY29tbWFuZCc7XG5pbXBvcnQgeyBQcmVmYWJQcmV2aWV3Q2FudmFzQ29tbWFuZCB9IGZyb20gJy4vdW5kby9jb21tYW5kcy9wcmVmYWItcHJldmlldy1jYW52YXMtY29tbWFuZCc7XG5pbXBvcnQgeyBicm9hZGNhc3RBbmltYXRpb25Qcm9wZXJ0eUNvbW1pdHRlZCB9IGZyb20gJy4vYW5pbWF0aW9uL3Byb3BlcnR5LWNvbW1pdC1ldmVudCc7XG5pbXBvcnQgeyBpc1Jvb3ROb2RlUGF0aCwgc3RyaXBMZWFkaW5nU2xhc2hlcywgdmFsaWRhdGVOb2RlTmFtZSB9IGZyb20gJy4uLy4uLy4uL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy9tYW5hZ2VyL3BhdGgtdXRpbHMnO1xuXG5jb25zdCBOb2RlTWdyID0gRWRpdG9yRXh0ZW5kcy5Ob2RlO1xuXG5pbnRlcmZhY2UgSVByZWZhYkNhbnZhc1VuZG9SZWNvcmQge1xuICAgIHJvb3ROb2RlOiBOb2RlO1xuICAgIHJvb3RQYXJlbnRVdWlkOiBzdHJpbmcgfCBudWxsO1xuICAgIHJvb3RQYXJlbnRQYXRoOiBzdHJpbmc7XG4gICAgcm9vdFNpYmxpbmdJbmRleDogbnVtYmVyO1xuICAgIGFkZGVkVUlUcmFuc2Zvcm06IENvbXBvbmVudCB8IG51bGw7XG4gICAgcHJldmlld0NhbnZhc05vZGU6IE5vZGUgfCBudWxsO1xuICAgIHByZXZpZXdDYW52YXNDcmVhdGVkOiBib29sZWFuO1xuICAgIHdvcmtNb2RlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJQ3JlYXRlUHJlZmxpZ2h0VG9rZW4ge1xuICAgIHJlcXVlc3RLZXk6IHN0cmluZztcbiAgICBhY3Rpb246IElDcmVhdGVOb2RlUHJlZmxpZ2h0UmVzdWx0WydhY3Rpb24nXTtcbiAgICBjYW52YXNSZXF1aXJlZDogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiDlrZDov5vnqIvoioLngrnlpITnkIblmahcbiAqIOWcqOWtkOi/m+eoi+S4reWkhOeQhuaJgOacieiKgueCueebuOWFs+aTjeS9nFxuICovXG5AcmVnaXN0ZXIoJ05vZGUnKVxuZXhwb3J0IGNsYXNzIE5vZGVTZXJ2aWNlIGV4dGVuZHMgQmFzZVNlcnZpY2U8SU5vZGVFdmVudHM+IGltcGxlbWVudHMgSU5vZGVTZXJ2aWNlIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF91bmRvID0gbmV3IE5vZGVVbmRvSGVscGVyKChldmVudCwgLi4uYXJncykgPT4gdGhpcy5lbWl0KGV2ZW50IGFzIGFueSwgLi4uYXJncykpO1xuICAgIHByaXZhdGUgX3ByZWZhYkNhbnZhc1VuZG9SZWNvcmRzOiBJUHJlZmFiQ2FudmFzVW5kb1JlY29yZFtdIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfcHJlZmFiQ2FudmFzVW5kb0JlZm9yZU5vZGVVdWlkczogU2V0PHN0cmluZz4gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9wcmVmbGlnaHRUb2tlbnMgPSBuZXcgTWFwPHN0cmluZywgSUNyZWF0ZVByZWZsaWdodFRva2VuPigpO1xuICAgIHByaXZhdGUgX3ByZWZsaWdodFRva2VuU2VxdWVuY2UgPSAwO1xuXG4gICAgYXN5bmMgY3JlYXRlQnlUeXBlKHBhcmFtczogSUNyZWF0ZUJ5Tm9kZVR5cGVQYXJhbXMpOiBQcm9taXNlPElOb2RlIHwgbnVsbD4ge1xuICAgICAgICB0aGlzLl92YWxpZGF0ZUNyZWF0ZVBhcmFtcyhwYXJhbXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgU2VydmljZS5FZGl0b3IubG9jaygpO1xuICAgICAgICAgICAgY29uc3QgYmVmb3JlTm9kZVV1aWRzID0gdGhpcy5fY29sbGVjdFNjZW5lTm9kZVV1aWRzRm9yVW5kbygpO1xuICAgICAgICAgICAgY29uc3QgY3JlYXRlUm9vdFBhdGggPSB0aGlzLl9nZXRDcmVhdGVSb290UGF0aEZvclVuZG8oYmVmb3JlTm9kZVV1aWRzLCBwYXJhbXMucGF0aCk7XG4gICAgICAgICAgICBjb25zdCB7IGFzc2V0VXVpZCwgY2FudmFzUmVxdWlyZWQ6IGNhbnZhc05lZWRlZCB9ID0gdGhpcy5fcmVzb2x2ZVR5cGVDcmVhdGVPcHRpb25zKHBhcmFtcyk7XG4gICAgICAgICAgICB0aGlzLl92YWxpZGF0ZVByZWZsaWdodFRva2VuKHBhcmFtcyk7XG4gICAgICAgICAgICBjb25zdCBwcmVmYWJDYW52YXNVbmRvUmVjb3JkcyA9IHRoaXMuX2JlZ2luUHJlZmFiQ2FudmFzVW5kb0NhcHR1cmUoYmVmb3JlTm9kZVV1aWRzKTtcbiAgICAgICAgICAgIGxldCByZXN1bHQ6IElOb2RlIHwgbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5fY3JlYXRlTm9kZShhc3NldFV1aWQsIGNhbnZhc05lZWRlZCwgcGFyYW1zLm5vZGVUeXBlID09IE5vZGVUeXBlLkVNUFRZLCBwYXJhbXMpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbmRQcmVmYWJDYW52YXNVbmRvQ2FwdHVyZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcmVjb3JkQ3JlYXRlTm9kZUNvbW1hbmQoYmVmb3JlTm9kZVV1aWRzLCBbY3JlYXRlUm9vdFBhdGgsIHJlc3VsdD8ucGF0aF0uZmlsdGVyKEJvb2xlYW4pIGFzIHN0cmluZ1tdLCBwcmVmYWJDYW52YXNVbmRvUmVjb3Jkcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRWRpdG9yLnVubG9jaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgY3JlYXRlQnlBc3NldChwYXJhbXM6IElDcmVhdGVCeUFzc2V0UGFyYW1zKTogUHJvbWlzZTxJTm9kZSB8IG51bGw+IHtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVDcmVhdGVQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmxvY2soKTtcbiAgICAgICAgICAgIGNvbnN0IGJlZm9yZU5vZGVVdWlkcyA9IHRoaXMuX2NvbGxlY3RTY2VuZU5vZGVVdWlkc0ZvclVuZG8oKTtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZVJvb3RQYXRoID0gdGhpcy5fZ2V0Q3JlYXRlUm9vdFBhdGhGb3JVbmRvKGJlZm9yZU5vZGVVdWlkcywgcGFyYW1zLnBhdGgpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRVdWlkID0gYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ3F1ZXJ5VVVJRCcsIFtwYXJhbXMuZGJVUkxdKTtcbiAgICAgICAgICAgIGlmICghYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NldCBub3QgZm91bmQgZm9yIGRiVVJMOiAke3BhcmFtcy5kYlVSTH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOmYu+atoua3u+WKoOiHquW3seWIsOW9k+WJjeeahFByZWZhYuS4re+8jOmYsuatolByZWZhYueahOW+queOr+W8leeUqFxuICAgICAgICAgICAgaWYgKFNlcnZpY2UuRWRpdG9yLmdldEN1cnJlbnRFZGl0b3JUeXBlKCkgPT09ICdwcmVmYWInKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlUHJlZmFiSW5mbyA9IHJvb3ROb2RlPy5bJ19wcmVmYWInXTtcbiAgICAgICAgICAgICAgICBpZiAocm9vdE5vZGVQcmVmYWJJbmZvICYmIHJvb3ROb2RlUHJlZmFiSW5mby5hc3NldCAmJiByb290Tm9kZVByZWZhYkluZm8uYXNzZXQuX3V1aWQgPT09IGFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcmVmYWIgeW91IGFyZSB0cnlpbmcgdG8gYWRkIGlzIHRoZSBzYW1lIHdpdGggdGhlIHByZWZhYiBpbiBlZGl0aW5nLCB0aGlzIGlzIG5vdCBhbGxvd2VkLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ2Fzc2V0TWFuYWdlcicsICdxdWVyeUFzc2V0SW5mbycsIFthc3NldFV1aWRdKTtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc05lZWRlZCA9IHBhcmFtcy5jYW52YXNSZXF1aXJlZCB8fCBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX3ZhbGlkYXRlUHJlZmxpZ2h0VG9rZW4ocGFyYW1zKTtcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkNhbnZhc1VuZG9SZWNvcmRzID0gdGhpcy5fYmVnaW5QcmVmYWJDYW52YXNVbmRvQ2FwdHVyZShiZWZvcmVOb2RlVXVpZHMpO1xuICAgICAgICAgICAgbGV0IHJlc3VsdDogSU5vZGUgfCBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9jcmVhdGVOb2RlKGFzc2V0VXVpZCwgY2FudmFzTmVlZGVkLCBmYWxzZSwgcGFyYW1zLCBhc3NldEluZm8/LnR5cGUpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbmRQcmVmYWJDYW52YXNVbmRvQ2FwdHVyZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcmVjb3JkQ3JlYXRlTm9kZUNvbW1hbmQoYmVmb3JlTm9kZVV1aWRzLCBbY3JlYXRlUm9vdFBhdGgsIHJlc3VsdD8ucGF0aF0uZmlsdGVyKEJvb2xlYW4pIGFzIHN0cmluZ1tdLCBwcmVmYWJDYW52YXNVbmRvUmVjb3Jkcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRWRpdG9yLnVubG9jaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcHJlZmxpZ2h0Q3JlYXRlKHBhcmFtczogSUNyZWF0ZUJ5Tm9kZVR5cGVQYXJhbXMgfCBJQ3JlYXRlQnlBc3NldFBhcmFtcyk6IFByb21pc2U8SUNyZWF0ZU5vZGVQcmVmbGlnaHRSZXN1bHQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmxvY2soKTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTY2VuZSA9IFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCk7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRTY2VuZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHByZWZsaWdodCBub2RlIGNyZWF0aW9uOiB0aGUgc2NlbmUgaXMgbm90IG9wZW5lZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGNhbnZhc1JlcXVpcmVkOiBib29sZWFuO1xuICAgICAgICAgICAgaWYgKCdub2RlVHlwZScgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQgPSB0aGlzLl9yZXNvbHZlVHlwZUNyZWF0ZU9wdGlvbnMocGFyYW1zKS5jYW52YXNSZXF1aXJlZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRVdWlkID0gYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ3F1ZXJ5VVVJRCcsIFtwYXJhbXMuZGJVUkxdKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFzc2V0IG5vdCBmb3VuZCBmb3IgZGJVUkw6ICR7cGFyYW1zLmRiVVJMfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAncXVlcnlBc3NldEluZm8nLCBbYXNzZXRVdWlkXSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRDYW52YXNSZXF1aXJlZCA9IGF3YWl0IHF1ZXJ5Q2FudmFzUmVxdWlyZWRCeUFzc2V0KHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldEluZm8/LnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHdvcmtNb2RlOiBwYXJhbXMud29ya01vZGUgfHwgJzJkJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjYW52YXNSZXF1aXJlZCA9IEJvb2xlYW4ocGFyYW1zLmNhbnZhc1JlcXVpcmVkIHx8IGFzc2V0Q2FudmFzUmVxdWlyZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9yZXNvbHZlQ3JlYXRlUHJlZmxpZ2h0KHBhcmFtcywgY2FudmFzUmVxdWlyZWQsIGN1cnJlbnRTY2VuZSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLnJlc3VsdCxcbiAgICAgICAgICAgICAgICBwcmVmbGlnaHRUb2tlbjogdGhpcy5fY3JlYXRlUHJlZmxpZ2h0VG9rZW4ocGFyYW1zLCByZXN1bHQpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBTZXJ2aWNlLkVkaXRvci51bmxvY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3Jlc29sdmVUeXBlQ3JlYXRlT3B0aW9ucyhwYXJhbXM6IElDcmVhdGVCeU5vZGVUeXBlUGFyYW1zKTogeyBhc3NldFV1aWQ6IHN0cmluZyB8IG51bGw7IGNhbnZhc1JlcXVpcmVkOiBib29sZWFuIH0ge1xuICAgICAgICBjb25zdCBleHBsaWNpdENhbnZhc1JlcXVpcmVkID0gQm9vbGVhbihwYXJhbXMuY2FudmFzUmVxdWlyZWQpO1xuICAgICAgICBjb25zdCBub2RlVHlwZSA9IHBhcmFtcy5ub2RlVHlwZSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IHBhcmFtc0FycmF5ID0gTm9kZUNvbmZpZ1tub2RlVHlwZV07XG4gICAgICAgIGlmICghcGFyYW1zQXJyYXkgfHwgcGFyYW1zQXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGUgdHlwZSAnJHtub2RlVHlwZX0nIGlzIG5vdCBpbXBsZW1lbnRlZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvbmZpZyA9IHBhcmFtc0FycmF5WzBdO1xuICAgICAgICBjb25zdCBwcm9qZWN0VHlwZSA9IGNvbmZpZ1sncHJvamVjdC10eXBlJ107XG4gICAgICAgIGlmIChwcm9qZWN0VHlwZSAmJiBwYXJhbXMud29ya01vZGUgJiYgcHJvamVjdFR5cGUgIT09IHBhcmFtcy53b3JrTW9kZS50b0xvd2VyQ2FzZSgpICYmIHBhcmFtc0FycmF5Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNvbmZpZyA9IHBhcmFtc0FycmF5WzFdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFzc2V0VXVpZDogY29uZmlnLmFzc2V0VXVpZCB8fCBudWxsLFxuICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IGV4cGxpY2l0Q2FudmFzUmVxdWlyZWQgfHwgQm9vbGVhbihjb25maWcuY2FudmFzUmVxdWlyZWQpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldENyZWF0ZVBhdGhQcmVmbGlnaHQocGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkLCBjdXJyZW50U2NlbmU6IE5vZGUpOiB7XG4gICAgICAgIHBhcmVudDogTm9kZTtcbiAgICAgICAgbWF0ZXJpYWxpemVzVUlUcmFuc2Zvcm06IGJvb2xlYW47XG4gICAgICAgIGNhbnZhc1JlcXVpcmVkOiBib29sZWFuO1xuICAgIH0ge1xuICAgICAgICBpZiAocGF0aCAmJiAhaXNSb290Tm9kZVBhdGgocGF0aCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdQYXJlbnQgPSBOb2RlTWdyLmdldE5vZGVCeVBhdGgocGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhcmVudDogZXhpc3RpbmdQYXJlbnQsIG1hdGVyaWFsaXplc1VJVHJhbnNmb3JtOiBmYWxzZSwgY2FudmFzUmVxdWlyZWQ6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhdGhQYXJ0cyA9IHBhdGg/LnNwbGl0KCcvJykuZmlsdGVyKHBhcnQgPT4gcGFydC50cmltKCkgIT09ICcnKSA/PyBbXTtcbiAgICAgICAgbGV0IHBhcmVudCA9IGN1cnJlbnRTY2VuZTtcblxuICAgICAgICBmb3IgKGNvbnN0IHBhdGhQYXJ0IG9mIHBhdGhQYXJ0cykge1xuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBwYXJlbnQuZ2V0Q2hpbGRCeU5hbWUocGF0aFBhcnQpO1xuICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwYXRoUGFydCA9PT0gJ0NhbnZhcycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBwYXJlbnQsIG1hdGVyaWFsaXplc1VJVHJhbnNmb3JtOiBmYWxzZSwgY2FudmFzUmVxdWlyZWQ6IHRydWUgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gX2Vuc3VyZVBhdGhFeGlzdHMoKSBhZGRzIFVJVHJhbnNmb3JtIHRvIHRoZSBmaXJzdCBtaXNzaW5nIG9yZGluYXJ5IHBhdGggc2VnbWVudC5cbiAgICAgICAgICAgIHJldHVybiB7IHBhcmVudCwgbWF0ZXJpYWxpemVzVUlUcmFuc2Zvcm06IHRydWUsIGNhbnZhc1JlcXVpcmVkOiBmYWxzZSB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgcGFyZW50LCBtYXRlcmlhbGl6ZXNVSVRyYW5zZm9ybTogZmFsc2UsIGNhbnZhc1JlcXVpcmVkOiBmYWxzZSB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldENhbnZhc0NvbnRleHQocGFyZW50OiBOb2RlKToge1xuICAgICAgICBoYXNDYW52YXNDb250ZXh0OiBib29sZWFuO1xuICAgICAgICBjYW52YXNOb2RlOiBOb2RlIHwgbnVsbDtcbiAgICAgICAgdWlUcmFuc2Zvcm1Ob2RlOiBOb2RlIHwgbnVsbDtcbiAgICB9IHtcbiAgICAgICAgY29uc3QgaXNQcmVmYWJNb2RlID0gU2VydmljZS5FZGl0b3IuZ2V0Q3VycmVudEVkaXRvclR5cGUoKSA9PT0gJ3ByZWZhYic7XG4gICAgICAgIGNvbnN0IGNhbnZhc0NvbnRleHROb2RlID0gZ2V0VUlDYW52YXNOb2RlKHBhcmVudCwgIWlzUHJlZmFiTW9kZSk7XG4gICAgICAgIGNvbnN0IHVpVHJhbnNmb3JtTm9kZSA9IGdldFVJVHJhbnNmb3JtUGFyZW50Tm9kZShwYXJlbnQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaGFzQ2FudmFzQ29udGV4dDogQm9vbGVhbihjYW52YXNDb250ZXh0Tm9kZSksXG4gICAgICAgICAgICBjYW52YXNOb2RlOiBjYW52YXNDb250ZXh0Tm9kZSxcbiAgICAgICAgICAgIHVpVHJhbnNmb3JtTm9kZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZXNvbHZlQ3JlYXRlUHJlZmxpZ2h0KFxuICAgICAgICBwYXJhbXM6IElDcmVhdGVCeU5vZGVUeXBlUGFyYW1zIHwgSUNyZWF0ZUJ5QXNzZXRQYXJhbXMsXG4gICAgICAgIGNhbnZhc1JlcXVpcmVkOiBib29sZWFuLFxuICAgICAgICBjdXJyZW50U2NlbmU6IE5vZGUsXG4gICAgKTogT21pdDxJQ3JlYXRlTm9kZVByZWZsaWdodFJlc3VsdCwgJ3ByZWZsaWdodFRva2VuJz4ge1xuICAgICAgICBjb25zdCBwYXRoUGxhbiA9IHRoaXMuX2dldENyZWF0ZVBhdGhQcmVmbGlnaHQocGFyYW1zLnBhdGgsIGN1cnJlbnRTY2VuZSk7XG4gICAgICAgIGlmIChwYXRoUGxhbi5tYXRlcmlhbGl6ZXNVSVRyYW5zZm9ybSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdjcmVhdGUnLFxuICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkLFxuICAgICAgICAgICAgICAgIGNhbnZhc1BhdGg6IG51bGwsXG4gICAgICAgICAgICAgICAgdWlUcmFuc2Zvcm1QYXRoOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVmZmVjdGl2ZUNhbnZhc1JlcXVpcmVkID0gY2FudmFzUmVxdWlyZWQgfHwgcGF0aFBsYW4uY2FudmFzUmVxdWlyZWQ7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLl9nZXRDYW52YXNDb250ZXh0KHBhdGhQbGFuLnBhcmVudCk7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVzUHJlZmFiQ2FudmFzSGFuZGxpbmcgPSBlZmZlY3RpdmVDYW52YXNSZXF1aXJlZFxuICAgICAgICAgICAgJiYgU2VydmljZS5FZGl0b3IuZ2V0Q3VycmVudEVkaXRvclR5cGUoKSA9PT0gJ3ByZWZhYidcbiAgICAgICAgICAgICYmICFjb250ZXh0Lmhhc0NhbnZhc0NvbnRleHRcbiAgICAgICAgICAgICYmICFjb250ZXh0LnVpVHJhbnNmb3JtTm9kZTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWN0aW9uOiByZXF1aXJlc1ByZWZhYkNhbnZhc0hhbmRsaW5nID8gJ2Nob29zZS1wcmVmYWItY2FudmFzLWhhbmRsaW5nJyA6ICdjcmVhdGUnLFxuICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IGVmZmVjdGl2ZUNhbnZhc1JlcXVpcmVkLFxuICAgICAgICAgICAgY2FudmFzUGF0aDogY29udGV4dC5jYW52YXNOb2RlID8gTm9kZU1nci5nZXROb2RlUGF0aChjb250ZXh0LmNhbnZhc05vZGUpID8/IG51bGwgOiBudWxsLFxuICAgICAgICAgICAgdWlUcmFuc2Zvcm1QYXRoOiBjb250ZXh0LnVpVHJhbnNmb3JtTm9kZSA/IE5vZGVNZ3IuZ2V0Tm9kZVBhdGgoY29udGV4dC51aVRyYW5zZm9ybU5vZGUpID8/IG51bGwgOiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZVByZWZsaWdodFRva2VuKFxuICAgICAgICBwYXJhbXM6IElDcmVhdGVCeU5vZGVUeXBlUGFyYW1zIHwgSUNyZWF0ZUJ5QXNzZXRQYXJhbXMsXG4gICAgICAgIHJlc3VsdDogT21pdDxJQ3JlYXRlTm9kZVByZWZsaWdodFJlc3VsdCwgJ3ByZWZsaWdodFRva2VuJz4sXG4gICAgKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgdG9rZW4gPSBgbm9kZS1jcmVhdGUtJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHsoKyt0aGlzLl9wcmVmbGlnaHRUb2tlblNlcXVlbmNlKS50b1N0cmluZygzNil9YDtcbiAgICAgICAgaWYgKHRoaXMuX3ByZWZsaWdodFRva2Vucy5zaXplID49IDEyOCkge1xuICAgICAgICAgICAgY29uc3Qgb2xkZXN0VG9rZW4gPSB0aGlzLl9wcmVmbGlnaHRUb2tlbnMua2V5cygpLm5leHQoKS52YWx1ZTtcbiAgICAgICAgICAgIGlmIChvbGRlc3RUb2tlbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByZWZsaWdodFRva2Vucy5kZWxldGUob2xkZXN0VG9rZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3ByZWZsaWdodFRva2Vucy5zZXQodG9rZW4sIHtcbiAgICAgICAgICAgIHJlcXVlc3RLZXk6IHRoaXMuX2dldFByZWZsaWdodFJlcXVlc3RLZXkocGFyYW1zKSxcbiAgICAgICAgICAgIGFjdGlvbjogcmVzdWx0LmFjdGlvbixcbiAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiByZXN1bHQuY2FudmFzUmVxdWlyZWQsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfdmFsaWRhdGVQcmVmbGlnaHRUb2tlbihwYXJhbXM6IElDcmVhdGVCeU5vZGVUeXBlUGFyYW1zIHwgSUNyZWF0ZUJ5QXNzZXRQYXJhbXMpOiB2b2lkIHtcbiAgICAgICAgaWYgKCFwYXJhbXMucHJlZmxpZ2h0VG9rZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlY29yZCA9IHRoaXMuX3ByZWZsaWdodFRva2Vucy5nZXQocGFyYW1zLnByZWZsaWdodFRva2VuKTtcbiAgICAgICAgdGhpcy5fcHJlZmxpZ2h0VG9rZW5zLmRlbGV0ZShwYXJhbXMucHJlZmxpZ2h0VG9rZW4pO1xuICAgICAgICBpZiAoIXJlY29yZCB8fCByZWNvcmQucmVxdWVzdEtleSAhPT0gdGhpcy5fZ2V0UHJlZmxpZ2h0UmVxdWVzdEtleShwYXJhbXMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBub2RlIGNyZWF0aW9uIHByZWZsaWdodCB0b2tlbiBpcyBpbnZhbGlkIG9yIGRvZXMgbm90IG1hdGNoIHRoZSByZXF1ZXN0LiBSdW4gcHJlZmxpZ2h0Q3JlYXRlIGFnYWluLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlY29yZC5hY3Rpb24gIT09ICdjcmVhdGUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50U2NlbmUgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpO1xuICAgICAgICBpZiAoIWN1cnJlbnRTY2VuZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIG5vZGU6IHRoZSBzY2VuZSBpcyBub3Qgb3BlbmVkLicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnJlbnRSZXN1bHQgPSB0aGlzLl9yZXNvbHZlQ3JlYXRlUHJlZmxpZ2h0KHBhcmFtcywgcmVjb3JkLmNhbnZhc1JlcXVpcmVkLCBjdXJyZW50U2NlbmUpO1xuICAgICAgICBpZiAoY3VycmVudFJlc3VsdC5hY3Rpb24gIT09ICdjcmVhdGUnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbnZhcyBjb250ZXh0IGNoYW5nZWQgYWZ0ZXIgcHJlZmxpZ2h0LiBSdW4gcHJlZmxpZ2h0Q3JlYXRlIGFnYWluIGJlZm9yZSBjcmVhdGluZyB0aGUgbm9kZS4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFByZWZsaWdodFJlcXVlc3RLZXkocGFyYW1zOiBJQ3JlYXRlQnlOb2RlVHlwZVBhcmFtcyB8IElDcmVhdGVCeUFzc2V0UGFyYW1zKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KCdub2RlVHlwZScgaW4gcGFyYW1zID8ge1xuICAgICAgICAgICAga2luZDogJ3R5cGUnLFxuICAgICAgICAgICAgcGF0aDogcGFyYW1zLnBhdGgsXG4gICAgICAgICAgICBub2RlVHlwZTogcGFyYW1zLm5vZGVUeXBlLFxuICAgICAgICAgICAgd29ya01vZGU6IHBhcmFtcy53b3JrTW9kZSA/PyAnMmQnLFxuICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IEJvb2xlYW4ocGFyYW1zLmNhbnZhc1JlcXVpcmVkKSxcbiAgICAgICAgfSA6IHtcbiAgICAgICAgICAgIGtpbmQ6ICdhc3NldCcsXG4gICAgICAgICAgICBwYXRoOiBwYXJhbXMucGF0aCxcbiAgICAgICAgICAgIGRiVVJMOiBwYXJhbXMuZGJVUkwsXG4gICAgICAgICAgICB3b3JrTW9kZTogcGFyYW1zLndvcmtNb2RlID8/ICcyZCcsXG4gICAgICAgICAgICBjYW52YXNSZXF1aXJlZDogQm9vbGVhbihwYXJhbXMuY2FudmFzUmVxdWlyZWQpLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBfY3JlYXRlTm9kZShhc3NldFV1aWQ6IHN0cmluZyB8IG51bGwsIGNhbnZhc05lZWRlZDogYm9vbGVhbiwgY2hlY2tVSVRyYW5zZm9ybTogYm9vbGVhbiwgcGFyYW1zOiBJQ3JlYXRlQnlOb2RlVHlwZVBhcmFtcyB8IElDcmVhdGVCeUFzc2V0UGFyYW1zLCBhc3NldFR5cGU/OiBzdHJpbmcpOiBQcm9taXNlPElOb2RlIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBjdXJyZW50U2NlbmUgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpO1xuICAgICAgICBpZiAoIWN1cnJlbnRTY2VuZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIG5vZGU6IHRoZSBzY2VuZSBpcyBub3Qgb3BlbmVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgd29ya01vZGUgPSBwYXJhbXMud29ya01vZGUgfHwgJzJkJztcbiAgICAgICAgLy8g5L2/55So5aKe5by655qE6Lev5b6E5aSE55CG5pa55rOVXG4gICAgICAgIGxldCBwYXJlbnQgPSBhd2FpdCB0aGlzLl9nZXRPckNyZWF0ZU5vZGVCeVBhdGgocGFyYW1zLnBhdGgsIGN1cnJlbnRTY2VuZSwgcGFyYW1zLnByZWZhYkNhbnZhc0hhbmRsaW5nKTtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHBhcmVudCA9IGN1cnJlbnRTY2VuZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHROb2RlO1xuICAgICAgICBsZXQgY2FudmFzUmVxdWlyZWQgPSBjYW52YXNOZWVkZWQ7XG4gICAgICAgIGlmIChhc3NldFV1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZVJlc3VsdCA9IGF3YWl0IGNyZWF0ZU5vZGVCeUFzc2V0KHtcbiAgICAgICAgICAgICAgICB1dWlkOiBhc3NldFV1aWQsXG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IGNhbnZhc05lZWRlZCxcbiAgICAgICAgICAgICAgICB0eXBlOiBhc3NldFR5cGUsXG4gICAgICAgICAgICAgICAgd29ya01vZGU6IHdvcmtNb2RlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXN1bHROb2RlID0gY3JlYXRlUmVzdWx0Lm5vZGU7XG4gICAgICAgICAgICBjYW52YXNSZXF1aXJlZCA9IEJvb2xlYW4oY2FudmFzTmVlZGVkIHx8IGNyZWF0ZVJlc3VsdC5jYW52YXNSZXF1aXJlZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFyZXN1bHROb2RlKSB7XG4gICAgICAgICAgICByZXN1bHROb2RlID0gbmV3IGNjLk5vZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVzdWx0Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tVSVRyYW5zZm9ybSkge1xuICAgICAgICAgICAgbm9kZU1nci5lbnN1cmVVSVRyYW5zZm9ybUNvbXBvbmVudChyZXN1bHROb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudCA9IGF3YWl0IHRoaXMuY2hlY2tDYW52YXNSZXF1aXJlZCh3b3JrTW9kZS50b0xvd2VyQ2FzZSgpLCBCb29sZWFuKGNhbnZhc1JlcXVpcmVkKSwgcGFyZW50LCBwYXJhbXMucG9zaXRpb24gYXMgVmVjMywgcGFyYW1zLnByZWZhYkNhbnZhc0hhbmRsaW5nKSBhcyBOb2RlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDpu5jorqTliJvlu7roioLngrnmmK/ku44gcHJlZmFiIOaooeadv++8jOaJgOS7peWIneWni+aYryBwcmVmYWIg6IqC54K5XG4gICAgICAgICAqIOaYr+WQpuimgSB1bmxpbmsg5Li65pmu6YCa6IqC54K5XG4gICAgICAgICAqIOaciSBub2RlVHlwZSDor7TmmI7mmK/lhoXnva7otYTmupDliJvlu7rnmoTvvIzpnIDopoHnp7vpmaQgcHJlZmFiIGluZm9cbiAgICAgICAgICogY3JlYXRlQnlBc3NldCDml7bvvIzlpoLmnpwgYXNzZXRUeXBlIOS4jeaYryBjYy5QcmVmYWIg5oiW6ICFIHVubGlua1ByZWZhYiDkuLogdHJ1Ze+8jOS5n+mcgOimgeenu+mZpFxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3Qgc2hvdWxkVW5saW5rUHJlZmFiID0gJ25vZGVUeXBlJyBpbiBwYXJhbXMgfHwgYXNzZXRUeXBlICE9PSAnY2MuUHJlZmFiJyB8fCBwYXJhbXMudW5saW5rUHJlZmFiO1xuICAgICAgICBpZiAoc2hvdWxkVW5saW5rUHJlZmFiKSB7XG4gICAgICAgICAgICBTZXJ2aWNlLlByZWZhYi5yZW1vdmVQcmVmYWJJbmZvRnJvbU5vZGUocmVzdWx0Tm9kZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFyYW1zLm5hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdE5vZGUubmFtZSA9IHBhcmFtcy5uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1hZGQnLCByZXN1bHROb2RlKTtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBwYXJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaWsOiKgueCueeahCBsYXllciDot5/pmo/niLbnuqfoioLngrnvvIzkvYbniLbnuqfoioLngrnkuLrlnLrmma/moLnoioLngrnpmaTlpJZcbiAgICAgICAgICogcGFyZW50LmxheWVyIOWPr+iDveS4uiAwIO+8iOeVjOmdouS4i+aLieahhuS4uiBOb25l77yJ77yM5q2k5oOF5Ya15LiL5paw6IqC54K55LiN6Lef6ZqPXG4gICAgICAgICAqL1xuICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudC5sYXllciAmJiBwYXJlbnQgIT09IGN1cnJlbnRTY2VuZSkge1xuICAgICAgICAgICAgc2V0TGF5ZXIocmVzdWx0Tm9kZSwgcGFyZW50LmxheWVyLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbXBhcmVkIHRvIHRoZSBlZGl0b3IsIHRoZSBwb3NpdGlvbiBpcyBzZXQgdmlhIEFQSSwgc28gbG9jYWwgY29vcmRpbmF0ZXMgYXJlIHVzZWQgaGVyZS5cbiAgICAgICAgaWYgKHBhcmFtcy5wb3NpdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0Tm9kZS5zZXRQb3NpdGlvbihwYXJhbXMucG9zaXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0Tm9kZS5zZXRQYXJlbnQocGFyZW50LCBwYXJhbXMua2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgLy8g5oyC5YiwIHByZWZhYiBpbnN0YW5jZSDkuIvml7bvvIxzZXRQYXJlbnQg55u45YWz5rWB56iL5Y+v6IO96YeN5paw6KGl5Zue5qih5p2/IHByZWZhYiDkv6Hmga/jgIJcbiAgICAgICAgLy8g5L2G5ZyoIHByZWZhYiBhc3NldCDnvJbovpHlmajkuK3vvIzmlrDoioLngrnpnIDopoHkv53nlZkgc2V0UGFyZW50IOihpem9kOeahCBwcmVmYWIg5YWD5pWw5o2u44CCXG4gICAgICAgIGlmIChzaG91bGRVbmxpbmtQcmVmYWIgJiYgU2VydmljZS5FZGl0b3IuZ2V0Q3VycmVudEVkaXRvclR5cGUoKSAhPT0gJ3ByZWZhYicpIHtcbiAgICAgICAgICAgIFNlcnZpY2UuUHJlZmFiLnJlbW92ZVByZWZhYkluZm9Gcm9tTm9kZShyZXN1bHROb2RlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDlj5HpgIHmt7vliqDoioLngrnkuovku7bvvIzmt7vliqDoioLngrnkuK3nmoTmoLnoioLngrlcbiAgICAgICAgdGhpcy5lbWl0KCdub2RlOmFkZCcsIHJlc3VsdE5vZGUpO1xuXG4gICAgICAgIHJldHVybiBzY2VuZVV0aWxzLmdlbmVyYXRlTm9kZUR1bXAocmVzdWx0Tm9kZSkgYXMgSU5vZGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5oiW5Yib5bu66Lev5b6E6IqC54K5XG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBfZ2V0T3JDcmVhdGVOb2RlQnlQYXRoKHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCwgY3VycmVudFNjZW5lOiBOb2RlLCBwcmVmYWJDYW52YXNIYW5kbGluZz86IFByZWZhYkNhbnZhc0hhbmRsaW5nKTogUHJvbWlzZTxOb2RlIHwgbnVsbD4ge1xuICAgICAgICAvLyAnLycg5oyH5b2T5YmN57yW6L6R5Zmo55qE5qC577yacHJlZmFiIOaooeW8j+S4i+aYryBwcmVmYWIg5qC56IqC54K577yM6ICM5LiN5piv5om/6L295a6D55qE6Jma5ouf5Zy65pmv44CCXG4gICAgICAgIC8vIOS6pOWbniBudWxsIOiuqeS4iuWxgiBmYWxsYmFjayDliLAgY3VycmVudFNjZW5l77yIPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgp77yJ44CCXG4gICAgICAgIGlmICghcGF0aCB8fCBpc1Jvb3ROb2RlUGF0aChwYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlhYjlsJ3or5Xojrflj5bnjrDmnInoioLngrlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwYXRoKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIOWmguaenOS4jeWtmOWcqO+8jOWImeWIm+W7uui3r+W+hFxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fZW5zdXJlUGF0aEV4aXN0cyhwYXRoLCBjdXJyZW50U2NlbmUsIHByZWZhYkNhbnZhc0hhbmRsaW5nKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF92YWxpZGF0ZUNyZWF0ZVBhcmFtcyhwYXJhbXM6IElDcmVhdGVCeU5vZGVUeXBlUGFyYW1zIHwgSUNyZWF0ZUJ5QXNzZXRQYXJhbXMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVSZXF1ZXN0ZWROb2RlTmFtZShwYXJhbXMubmFtZSk7XG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlUmVxdWVzdGVkTm9kZVBhdGgocGFyYW1zLnBhdGgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3ZhbGlkYXRlUmVxdWVzdGVkTm9kZU5hbWUobmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlcnJvciA9IHZhbGlkYXRlTm9kZU5hbWUobmFtZSk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3ZhbGlkYXRlUmVxdWVzdGVkTm9kZVBhdGgocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBwYXRoLnNwbGl0KCcvJykuZmlsdGVyKChwYXJ0KSA9PiBwYXJ0LnRyaW0oKSAhPT0gJycpKSB7XG4gICAgICAgICAgICB0aGlzLl92YWxpZGF0ZVJlcXVlc3RlZE5vZGVOYW1lKHNlZ21lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog56Gu5L+d6Lev5b6E5a2Y5Zyo77yM5aaC5p6c5LiN5a2Y5Zyo5YiZ5Yib5bu656m66IqC54K5XG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBfZW5zdXJlUGF0aEV4aXN0cyhwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQsIGN1cnJlbnRTY2VuZTogTm9kZSwgcHJlZmFiQ2FudmFzSGFuZGxpbmc/OiBQcmVmYWJDYW52YXNIYW5kbGluZyk6IFByb21pc2U8Tm9kZSB8IG51bGw+IHtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY3VycmVudFNjZW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWIhuWJsui3r+W+hFxuICAgICAgICBjb25zdCBwYXRoUGFydHMgPSBwYXRoLnNwbGl0KCcvJykuZmlsdGVyKHBhcnQgPT4gcGFydC50cmltKCkgIT09ICcnKTtcbiAgICAgICAgaWYgKHBhdGhQYXJ0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGN1cnJlbnRQYXJlbnQ6IE5vZGUgPSBjdXJyZW50U2NlbmU7XG5cbiAgICAgICAgLy8g6YCQ57qn5qOA5p+l5bm25Yib5bu66Lev5b6EXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aFBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwYXRoUGFydCA9IHBhdGhQYXJ0c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudFByZWZpeCA9IHN0cmlwTGVhZGluZ1NsYXNoZXMoTm9kZU1nci5nZXROb2RlUGF0aChjdXJyZW50UGFyZW50KSk7XG4gICAgICAgICAgICBjb25zdCBjYW5kaWRhdGVQYXRoID0gcGFyZW50UHJlZml4ID8gYCR7cGFyZW50UHJlZml4fS8ke3BhdGhQYXJ0fWAgOiBwYXRoUGFydDtcbiAgICAgICAgICAgIGxldCBuZXh0Tm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChjYW5kaWRhdGVQYXRoKSBhcyBOb2RlIHwgbnVsbDtcblxuICAgICAgICAgICAgaWYgKCFuZXh0Tm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXRoUGFydCA9PT0gJ0NhbnZhcycpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dE5vZGUgPSBhd2FpdCB0aGlzLmNoZWNrQ2FudmFzUmVxdWlyZWQoJzJkJywgdHJ1ZSwgY3VycmVudFBhcmVudCwgdW5kZWZpbmVkLCBwcmVmYWJDYW52YXNIYW5kbGluZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5Yib5bu656m66IqC54K5XG4gICAgICAgICAgICAgICAgICAgIG5leHROb2RlID0gbmV3IE5vZGUocGF0aFBhcnQpO1xuICAgICAgICAgICAgICAgICAgICAvLyDorr7nva7niLbnuqdcbiAgICAgICAgICAgICAgICAgICAgbmV4dE5vZGUuc2V0UGFyZW50KGN1cnJlbnRQYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICAvLyDnoa7kv53mlrDliJvlu7rnmoToioLngrnmnInlv4XopoHnmoTnu4Tku7ZcbiAgICAgICAgICAgICAgICAgICAgbm9kZU1nci5lbnN1cmVVSVRyYW5zZm9ybUNvbXBvbmVudChuZXh0Tm9kZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5Y+R6YCB6IqC54K55Yib5bu65LqL5Lu2XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbm9kZTphZGQnLCBuZXh0Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFuZXh0Tm9kZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNyZWF0ZSBub2RlOiB0aGUgcGF0aCAke3BhdGh9IGlzIG5vdCB2YWxpZC5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBuZXh0Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJyZW50UGFyZW50O1xuICAgIH1cblxuICAgIGFzeW5jIGRlbGV0ZShwYXJhbXM6IElEZWxldGVOb2RlUGFyYW1zKTogUHJvbWlzZTxJRGVsZXRlTm9kZVJlc3VsdCB8IG51bGw+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmxvY2soKTtcbiAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpO1xuICAgICAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZGVsZXRlIG5vZGU6IHRoZSBzY2VuZSBpcyBub3Qgb3BlbmVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gcGFyYW1zLnBhdGg7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHV1aWRzID0gU2VydmljZS5QcmVmYWIuZmlsdGVyQ2hpbGRPZlByZWZhYkFzc2V0V2hlblJlbW92ZU5vZGUobm9kZS51dWlkKTtcbiAgICAgICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBjb21tYW5kOiBSZW1vdmVOb2RlQ29tbWFuZCB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3VuZG8uc2hvdWxkUmVjb3JkU3RydWN0dXJlQ29tbWFuZCgpKSB7XG4gICAgICAgICAgICAgICAgY29tbWFuZCA9IFJlbW92ZU5vZGVDb21tYW5kLmNhcHR1cmUobm9kZSwgcGFyYW1zLmtlZXBXb3JsZFRyYW5zZm9ybSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGVNZ3IuYmFzZVJlbW92ZU5vZGUobm9kZSwgcGFyYW1zLmtlZXBXb3JsZFRyYW5zZm9ybSk7XG4gICAgICAgICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChjb21tYW5kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBTZXJ2aWNlLkVkaXRvci51bmxvY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KHBhcmFtcz86IElRdWVyeU5vZGVQYXJhbXMpOiBQcm9taXNlPElOb2RlIHwgSVNjZW5lIHwgbnVsbD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgU2VydmljZS5FZGl0b3IubG9jaygpO1xuICAgICAgICAgICAgY29uc3Qgcm9vdCA9IFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCk7XG4gICAgICAgICAgICBpZiAoIXJvb3QpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBxdWVyeSBub2RlOiB0aGUgc2NlbmUgaXMgbm90IG9wZW5lZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBwYXJhbXM/LnBhdGg7XG4gICAgICAgICAgICBsZXQgbm9kZTogTm9kZSB8IG51bGwgPSByb290O1xuICAgICAgICAgICAgLy8gJy8nIOaMh+W9k+WJjee8lui+keWZqOeahOague+8muWcuuaZr+aooeW8j+S4i+aYr+WcuuaZr++8jHByZWZhYiDmqKHlvI/kuIvmmK8gcHJlZmFiIOague+8jOiAjOmdnuaJv+i9veWug+eahOiZmuaLn+WcuuaZr1xuICAgICAgICAgICAgaWYgKHBhdGggJiYgIWlzUm9vdE5vZGVQYXRoKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gc2NlbmVVdGlscy5nZW5lcmF0ZU5vZGVEdW1wKG5vZGUsIHBhcmFtcyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgU2VydmljZS5FZGl0b3IudW5sb2NrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeU5vZGVUcmVlKHBhcmFtczogSVF1ZXJ5Tm9kZVRyZWVQYXJhbXMpOiBQcm9taXNlPElOb2RlVHJlZUl0ZW0gfCBudWxsPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBTZXJ2aWNlLkVkaXRvci5sb2NrKCk7XG4gICAgICAgICAgICBjb25zdCByb290ID0gU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKTtcbiAgICAgICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHF1ZXJ5IG5vZGUgdHJlZTogdGhlIHNjZW5lIGlzIG5vdCBvcGVuZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHN0ZXAgPSAobm9kZTogTm9kZSk6IElOb2RlVHJlZUl0ZW0gfCBudWxsID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5vYmpGbGFncyAmIENDT2JqZWN0LkZsYWdzLkhpZGVJbkhpZXJhcmNoeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4ubWFwKHN0ZXApLmZpbHRlcihCb29sZWFuKSBhcyBJTm9kZVRyZWVJdGVtW107XG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiU3RhdGVJbmZvID0gcHJlZmFiVXRpbHMuZ2V0UHJlZmFiU3RhdGVJbmZvKG5vZGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU2NlbmUgPSBub2RlLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTY2VuZSc7XG5cbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IG5vZGUubmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoIW5hbWUgJiYgaXNTY2VuZSkge1xuICAgICAgICAgICAgICAgICAgICBuYW1lID0gJ1NjZW5lJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBOb2RlTWdyLmdldE5vZGVQYXRoKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChpc1NjZW5lKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSAnLyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgbG9ja2VkOiBCb29sZWFuKG5vZGUub2JqRmxhZ3MgJiBDQ09iamVjdC5GbGFncy5Mb2NrZWRJbkVkaXRvciksXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYy4nICsgbm9kZS5jb25zdHJ1Y3Rvci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICBwcmVmYWI6IHByZWZhYlN0YXRlSW5mbyxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiAobm9kZS5wYXJlbnQgJiYgbm9kZS5wYXJlbnQudXVpZCkgfHwgJycsXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGlzU2NlbmUsXG4gICAgICAgICAgICAgICAgICAgIHJlYWRvbmx5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czogbm9kZS5jb21wb25lbnRzLm1hcCgoY29tcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gY2MuanMuZ2V0Q2xhc3NOYW1lKGNvbXAuY29uc3RydWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0N1c3RvbTogU2VydmljZS5TY3JpcHQuaXNDdXN0b21Db21wb25lbnQoY29tcC5jb25zdHJ1Y3RvciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY2xhc3NOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjb21wLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kczogQ0NDbGFzcy5nZXRJbmhlcml0YW5jZUNoYWluKGNvbXAuY29uc3RydWN0b3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKGl0ZW1DdG9yOiBhbnkpID0+IGNjLmpzLmdldENsYXNzTmFtZShpdGVtQ3RvcikpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbiksXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGV0IG5vZGU6IE5vZGUgfCBudWxsID0gcm9vdDtcbiAgICAgICAgICAgIGlmIChwYXJhbXMucGF0aCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBOb2RlTWdyLmdldE5vZGVCeVBhdGgocGFyYW1zLnBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RlcChub2RlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBTZXJ2aWNlLkVkaXRvci51bmxvY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHF1ZXJ5Tm9kZXNCeUFzc2V0VXVpZCh1dWlkOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgICAgIHJldHVybiBub2RlTWdyLnF1ZXJ5Tm9kZXNCeUFzc2V0VXVpZCh1dWlkKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeU5vZGVzTWlzc0Fzc2V0KCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IG5vZGVNZ3IucXVlcnlOb2Rlc01pc3NBc3NldCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeW5tuagueaNrumcgOimgeWIm+W7uiBjYW52YXPoioLngrnmiJbkuLrniLbnuqfmt7vliqBVSVRyYW5zZm9ybee7hOS7tu+8jOi/lOWbnueItue6p+iKgueCue+8jOWmguaenOmcgOimgWNhbnZhc+iKgueCue+8jOWImeeItue6p+iKgueCueS8muaYr2NhbnZhc+iKgueCuVxuICAgICAqIEBwYXJhbSB3b3JrTW9kZVxuICAgICAqIEBwYXJhbSBjYW52YXNSZXF1aXJlZFBhcmFtXG4gICAgICogQHBhcmFtIHBhcmVudFxuICAgICAqIEBwYXJhbSBwb3NpdGlvblxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgYXN5bmMgY2hlY2tDYW52YXNSZXF1aXJlZChcbiAgICAgICAgd29ya01vZGU6IHN0cmluZyxcbiAgICAgICAgY2FudmFzUmVxdWlyZWRQYXJhbTogYm9vbGVhbiB8IHVuZGVmaW5lZCxcbiAgICAgICAgcGFyZW50OiBOb2RlIHwgbnVsbCxcbiAgICAgICAgcG9zaXRpb246IFZlYzMgfCB1bmRlZmluZWQsXG4gICAgICAgIHByZWZhYkNhbnZhc0hhbmRsaW5nPzogUHJlZmFiQ2FudmFzSGFuZGxpbmcsXG4gICAgKTogUHJvbWlzZTxOb2RlIHwgbnVsbD4ge1xuXG4gICAgICAgIGlmIChjYW52YXNSZXF1aXJlZFBhcmFtICYmIHBhcmVudD8uaXNWYWxpZCkge1xuICAgICAgICAgICAgbGV0IGNhbnZhc05vZGU6IE5vZGUgfCBudWxsO1xuICAgICAgICAgICAgY29uc3QgaXNQcmVmYWJNb2RlID0gU2VydmljZS5FZGl0b3IuZ2V0Q3VycmVudEVkaXRvclR5cGUoKSA9PT0gJ3ByZWZhYic7XG5cbiAgICAgICAgICAgIGlmIChpc1ByZWZhYk1vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb290Tm9kZSA9IFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudCA9PT0gZGlyZWN0b3IuZ2V0U2NlbmUoKSAmJiByb290Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSByb290Tm9kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FudmFzTm9kZSA9IGdldFVJQ2FudmFzTm9kZShwYXJlbnQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1aVRyYW5zZm9ybVBhcmVudE5vZGUgPSBnZXRVSVRyYW5zZm9ybVBhcmVudE5vZGUocGFyZW50KTtcblxuICAgICAgICAgICAgICAgIGlmICghY2FudmFzTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodWlUcmFuc2Zvcm1QYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXNOb2RlID0gdWlUcmFuc2Zvcm1QYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZWZhYkNhbnZhc0hhbmRsaW5nID09PSAnYWRkLXJvb3QtdWktdHJhbnNmb3JtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzTm9kZSA9IGF3YWl0IHRoaXMuZW5zdXJlUHJlZmFiUm9vdFVJVHJhbnNmb3JtKHdvcmtNb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghcHJlZmFiQ2FudmFzSGFuZGxpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhc05vZGUgPSBuZXcgTm9kZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjYW52YXNOb2RlLnBhcmVudCAhPT0gZGlyZWN0b3IuZ2V0U2NlbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBjYW52YXNOb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FudmFzTm9kZSA9IGdldFVJQ2FudmFzTm9kZShwYXJlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChjYW52YXNOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IGNhbnZhc05vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDoh6rliqjliJvlu7rkuIDkuKogY2FudmFzIOiKgueCuVxuICAgICAgICAgICAgaWYgKCFjYW52YXNOb2RlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNhbnZhc0Fzc2V0VXVpZCA9ICdmNzczZGIyMS02MmI4LTQ1NDAtOTU2YS0yOWJhY2Y1ZGRiZjUnO1xuXG4gICAgICAgICAgICAgICAgaWYgKHdvcmtNb2RlID09PSAnMmQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc0Fzc2V0VXVpZCA9ICc0YzMzNjAwZS05Y2E5LTQ4M2ItYjczNC05NDYwMDgyNjE2OTcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhc0Fzc2V0ID0gYXdhaXQgbG9hZEFueTxQcmVmYWI+KGNhbnZhc0Fzc2V0VXVpZCk7XG4gICAgICAgICAgICAgICAgY2FudmFzTm9kZSA9IGNjLmluc3RhbnRpYXRlKGNhbnZhc0Fzc2V0KSBhcyBOb2RlO1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuUHJlZmFiLnJlbW92ZVByZWZhYkluZm9Gcm9tTm9kZShjYW52YXNOb2RlKTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkKGNhbnZhc05vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBjYW52YXNOb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnm67liY0gY2FudmFzIOm7mOiupCB6IOS4uiAx77yM6ICM5ouW5pS+5YiwIENhbnZhcyDnmoTmjqfku7blm6DkuLrmo4DmtYvnmoTmmK8geiDkuLogMCDnmoTlubPpnaLvvIzmiYDku6Xov5novrnlhYjlvLrliLbmioogeiDorr7nva7kuLrlkowgY2FudmFzIOeahOS4gOagt1xuICAgICAgICAgICAgaWYgKHBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24ueiA9IGNhbnZhc05vZGUucG9zaXRpb24uejtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZW5zdXJlUHJlZmFiUm9vdFVJVHJhbnNmb3JtKHdvcmtNb2RlOiBzdHJpbmcpOiBQcm9taXNlPE5vZGUgfCBudWxsPiB7XG4gICAgICAgIGNvbnN0IHJvb3ROb2RlID0gU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKTtcbiAgICAgICAgaWYgKCFyb290Tm9kZT8uaXNWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1bmRvUmVjb3JkID0gdGhpcy5fY3JlYXRlUHJlZmFiQ2FudmFzVW5kb1JlY29yZChyb290Tm9kZSwgd29ya01vZGUpO1xuICAgICAgICBpZiAoIWhhc09uZUtpbmRPZkNvbXBvbmVudChyb290Tm9kZSwgVUlUcmFuc2Zvcm0pKSB7XG4gICAgICAgICAgICB1bmRvUmVjb3JkLmFkZGVkVUlUcmFuc2Zvcm0gPSByb290Tm9kZS5hZGRDb21wb25lbnQoJ2NjLlVJVHJhbnNmb3JtJykgYXMgQ29tcG9uZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJvb3ROb2RlLnBhcmVudCAmJiAhaGFzT25lS2luZE9mQ29tcG9uZW50KHJvb3ROb2RlLnBhcmVudCwgQ2FudmFzKSkge1xuICAgICAgICAgICAgY29uc3QgY2FudmFzTm9kZSA9IGF3YWl0IGNyZWF0ZVNob3VsZEhpZGVJbkhpZXJhcmNoeUNhbnZhc05vZGUoZGlyZWN0b3IuZ2V0U2NlbmUoKSEsIHdvcmtNb2RlKTtcbiAgICAgICAgICAgIHVuZG9SZWNvcmQucHJldmlld0NhbnZhc05vZGUgPSBjYW52YXNOb2RlO1xuICAgICAgICAgICAgdW5kb1JlY29yZC5wcmV2aWV3Q2FudmFzQ3JlYXRlZCA9ICF0aGlzLl9wcmVmYWJDYW52YXNVbmRvQmVmb3JlTm9kZVV1aWRzPy5oYXMoY2FudmFzTm9kZS51dWlkKTtcbiAgICAgICAgICAgIHJvb3ROb2RlLnBhcmVudCA9IGNhbnZhc05vZGU7XG4gICAgICAgICAgICB0aGlzLl9wdXNoUHJlZmFiQ2FudmFzVW5kb1JlY29yZCh1bmRvUmVjb3JkKTtcbiAgICAgICAgICAgIHJldHVybiBjYW52YXNOb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHVzaFByZWZhYkNhbnZhc1VuZG9SZWNvcmQodW5kb1JlY29yZCk7XG4gICAgICAgIHJldHVybiByb290Tm9kZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVQcmVmYWJDYW52YXNVbmRvUmVjb3JkKHJvb3ROb2RlOiBOb2RlLCB3b3JrTW9kZTogc3RyaW5nKTogSVByZWZhYkNhbnZhc1VuZG9SZWNvcmQge1xuICAgICAgICBjb25zdCByb290UGFyZW50ID0gcm9vdE5vZGUucGFyZW50IGFzIE5vZGUgfCBudWxsO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcm9vdE5vZGUsXG4gICAgICAgICAgICByb290UGFyZW50VXVpZDogcm9vdFBhcmVudD8udXVpZCA/PyBudWxsLFxuICAgICAgICAgICAgcm9vdFBhcmVudFBhdGg6IHJvb3RQYXJlbnQgPyAoTm9kZU1nci5nZXROb2RlUGF0aChyb290UGFyZW50KSA/PyAnLycpIDogJy8nLFxuICAgICAgICAgICAgcm9vdFNpYmxpbmdJbmRleDogcm9vdE5vZGUuZ2V0U2libGluZ0luZGV4KCksXG4gICAgICAgICAgICBhZGRlZFVJVHJhbnNmb3JtOiBudWxsLFxuICAgICAgICAgICAgcHJldmlld0NhbnZhc05vZGU6IG51bGwsXG4gICAgICAgICAgICBwcmV2aWV3Q2FudmFzQ3JlYXRlZDogZmFsc2UsXG4gICAgICAgICAgICB3b3JrTW9kZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9wdXNoUHJlZmFiQ2FudmFzVW5kb1JlY29yZChyZWNvcmQ6IElQcmVmYWJDYW52YXNVbmRvUmVjb3JkKTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5fcHJlZmFiQ2FudmFzVW5kb1JlY29yZHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJlY29yZC5hZGRlZFVJVHJhbnNmb3JtICYmICFyZWNvcmQucHJldmlld0NhbnZhc05vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wcmVmYWJDYW52YXNVbmRvUmVjb3Jkcy5wdXNoKHJlY29yZCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRWRpdG9yT3BlbmVkKCkge1xuICAgICAgICBub2RlTWdyLm9uRWRpdG9yT3BlbmVkKCk7XG4gICAgICAgIC8vIOiKgueCuee8k+WtmOWIt+aWsOWujOaIkOWQju+8jOWGjeazqOWGjOe7hOS7tuS6i+S7tui9rOWPkeOAglxuICAgICAgICBTZXJ2aWNlLkNvbXBvbmVudC5pbml0KCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRWRpdG9yQ2xvc2VkKCkge1xuICAgICAgICAvLyBub2RlTWdyIOa4heeQhiBFZGl0b3JFeHRlbmRzLkNvbXBvbmVudCDnvJPlrZjliY3vvIzlhYjlgZzmraLnu4Tku7bkuovku7bovazlj5HjgIJcbiAgICAgICAgU2VydmljZS5Db21wb25lbnQudW5yZWdpc3RlckNvbXBNZ3JFdmVudHMoKTtcbiAgICAgICAgbm9kZU1nci5vbkVkaXRvckNsb3NlZCgpO1xuICAgICAgICB0aGlzLl9jdXRVdWlkcyA9IFtdO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBwcmV2aWV3U2V0UHJvcGVydHkob3B0aW9uczogSVNldFByb3BlcnR5T3B0aW9ucyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKG9wdGlvbnMubm9kZVBhdGgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgbm9kZU1nci5wcmV2aWV3U2V0Tm9kZVByb3BlcnR5KG5vZGUudXVpZCwgb3B0aW9ucy5wYXRoLCBvcHRpb25zLmR1bXApO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBjYW5jZWxQcmV2aWV3U2V0UHJvcGVydHkob3B0aW9uczogSVNldFByb3BlcnR5T3B0aW9ucyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKG9wdGlvbnMubm9kZVBhdGgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgbm9kZU1nci5jYW5jZWxQcmV2aWV3U2V0Tm9kZVByb3BlcnR5KG5vZGUudXVpZCwgb3B0aW9ucy5wYXRoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2V0UHJvcGVydHkob3B0aW9uczogSVNldFByb3BlcnR5T3B0aW9ucyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKG9wdGlvbnMubm9kZVBhdGgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLl91bmRvLnJlY29yZE5vZGVTbmFwc2hvdChub2RlLCB7XG4gICAgICAgICAgICBsYWJlbDogYFNldCAke29wdGlvbnMucGF0aH1gLFxuICAgICAgICAgICAgdHlwZTogJ25vZGU6c2V0LXByb3BlcnR5JyxcbiAgICAgICAgICAgIHJlY29yZDogb3B0aW9ucy5yZWNvcmQsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGVkaXRvclR5cGU6ICdzY2VuZScsXG4gICAgICAgICAgICAgICAgbm9kZVBhdGg6IG9wdGlvbnMubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgcHJvcFBhdGg6IG9wdGlvbnMucGF0aCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBhdGggPT09ICduYW1lJyAmJiBvcHRpb25zLmR1bXAudmFsdWUgIT09IG5vZGUubmFtZSkge1xuICAgICAgICAgICAgICAgIC8vIFJlamVjdCBuZXcgaWxsZWdhbCBpbnB1dCBhdCB0aGUgQVBJIGJvdW5kYXJ5OyB0aGUgbG93ZXItbGV2ZWwgbWFuYWdlciBhY2NlcHRzIGl0IG9ubHkgZm9yIGxlZ2FjeSB1bmRvL3JlZG8gcmVzdG9yYXRpb24uXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZUVycm9yID0gdmFsaWRhdGVOb2RlTmFtZShvcHRpb25zLmR1bXAudmFsdWUgYXMgc3RyaW5nKTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihuYW1lRXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIG5vZGUpO1xuICAgICAgICAgICAgICAgIE5vZGVNZ3IudXBkYXRlTm9kZU5hbWUobm9kZS51dWlkLCBvcHRpb25zLmR1bXAudmFsdWUgYXMgc3RyaW5nKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ25vZGU6Y2hhbmdlJywgbm9kZSwgeyB0eXBlOiBOb2RlRXZlbnRUeXBlLlNFVF9QUk9QRVJUWSwgcHJvcFBhdGg6ICduYW1lJyB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBub2RlTWdyLnNldFByb3BlcnR5KG5vZGUudXVpZCwgb3B0aW9ucy5wYXRoLCBvcHRpb25zLmR1bXAsIG9wdGlvbnMucmVjb3JkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChyZXN1bHQgJiYgb3B0aW9ucy5yZWNvcmQgIT09IGZhbHNlICYmICFpc1VuZG9BcHBseWluZygpKSB7XG4gICAgICAgICAgICBicm9hZGNhc3RBbmltYXRpb25Qcm9wZXJ0eUNvbW1pdHRlZCh7XG4gICAgICAgICAgICAgICAgbm9kZVBhdGg6IG9wdGlvbnMubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgcHJvcFBhdGg6IG9wdGlvbnMucGF0aCxcbiAgICAgICAgICAgICAgICBzb3VyY2U6ICdlZGl0b3InLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcmVzZXQocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBOb2RlTWdyLmdldE5vZGVCeVBhdGgocGF0aCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvLnJlY29yZE5vZGVTbmFwc2hvdChub2RlLCB7XG4gICAgICAgICAgICBsYWJlbDogJ1Jlc2V0IE5vZGUnLFxuICAgICAgICAgICAgdHlwZTogJ25vZGU6cmVzZXQnLFxuICAgICAgICB9LCBhc3luYyAoKSA9PiBhd2FpdCBub2RlTWdyLnJlc2V0Tm9kZShub2RlLnV1aWQpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcmVzZXRQcm9wZXJ0eShvcHRpb25zOiBJU2V0UHJvcGVydHlPcHRpb25zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBOb2RlTWdyLmdldE5vZGVCeVBhdGgob3B0aW9ucy5ub2RlUGF0aCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvLnJlY29yZE5vZGVTbmFwc2hvdChub2RlLCB7XG4gICAgICAgICAgICBsYWJlbDogYFJlc2V0ICR7b3B0aW9ucy5wYXRofWAsXG4gICAgICAgICAgICB0eXBlOiAnbm9kZTpyZXNldC1wcm9wZXJ0eScsXG4gICAgICAgICAgICByZWNvcmQ6IG9wdGlvbnMucmVjb3JkLFxuICAgICAgICB9LCBhc3luYyAoKSA9PiBhd2FpdCBub2RlTWdyLnJlc2V0UHJvcGVydHkobm9kZS51dWlkLCBvcHRpb25zLnBhdGgpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jb2xsZWN0U2NlbmVOb2RlVXVpZHNGb3JVbmRvKCk6IFNldDxzdHJpbmc+IHwgbnVsbCB7XG4gICAgICAgIGlmICghdGhpcy5fdW5kby5zaG91bGRSZWNvcmRTdHJ1Y3R1cmVDb21tYW5kKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvLmNvbGxlY3RTY2VuZU5vZGVVdWlkcygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldENyZWF0ZVJvb3RQYXRoRm9yVW5kbyhiZWZvcmVOb2RlVXVpZHM6IFNldDxzdHJpbmc+IHwgbnVsbCwgcGF0aD86IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBpZiAoIWJlZm9yZU5vZGVVdWlkcykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3VuZG8uZ2V0Q3JlYXRlUm9vdFBhdGgocGF0aCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfYmVnaW5QcmVmYWJDYW52YXNVbmRvQ2FwdHVyZShiZWZvcmVOb2RlVXVpZHM6IFNldDxzdHJpbmc+IHwgbnVsbCk6IElQcmVmYWJDYW52YXNVbmRvUmVjb3JkW10gfCBudWxsIHtcbiAgICAgICAgaWYgKCFiZWZvcmVOb2RlVXVpZHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlY29yZHM6IElQcmVmYWJDYW52YXNVbmRvUmVjb3JkW10gPSBbXTtcbiAgICAgICAgdGhpcy5fcHJlZmFiQ2FudmFzVW5kb1JlY29yZHMgPSByZWNvcmRzO1xuICAgICAgICB0aGlzLl9wcmVmYWJDYW52YXNVbmRvQmVmb3JlTm9kZVV1aWRzID0gYmVmb3JlTm9kZVV1aWRzO1xuICAgICAgICByZXR1cm4gcmVjb3JkcztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9lbmRQcmVmYWJDYW52YXNVbmRvQ2FwdHVyZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcHJlZmFiQ2FudmFzVW5kb1JlY29yZHMgPSBudWxsO1xuICAgICAgICB0aGlzLl9wcmVmYWJDYW52YXNVbmRvQmVmb3JlTm9kZVV1aWRzID0gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWNvcmRDcmVhdGVOb2RlQ29tbWFuZChcbiAgICAgICAgYmVmb3JlTm9kZVV1aWRzOiBTZXQ8c3RyaW5nPiB8IG51bGwsXG4gICAgICAgIHByZWZlcnJlZFJvb3RQYXRoczogc3RyaW5nW10sXG4gICAgICAgIHByZWZhYkNhbnZhc1VuZG9SZWNvcmRzOiBJUHJlZmFiQ2FudmFzVW5kb1JlY29yZFtdIHwgbnVsbCxcbiAgICApOiB2b2lkIHtcbiAgICAgICAgaWYgKCFwcmVmYWJDYW52YXNVbmRvUmVjb3Jkcz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLl91bmRvLnJlY29yZENyZWF0ZU5vZGVDb21tYW5kKGJlZm9yZU5vZGVVdWlkcywgcHJlZmVycmVkUm9vdFBhdGhzKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG93bnNHcm91cCA9ICFTZXJ2aWNlLlVuZG8/LmlzR3JvdXBBY3RpdmU/LigpO1xuICAgICAgICBjb25zdCBncm91cElkID0gb3duc0dyb3VwID8gU2VydmljZS5VbmRvPy5iZWdpbkdyb3VwPy4oeyBsYWJlbDogJ0NyZWF0ZSBOb2RlJyB9KSA6IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLl9yZWNvcmRQcmVmYWJDYW52YXNVbmRvQ29tbWFuZHMocHJlZmFiQ2FudmFzVW5kb1JlY29yZHMpO1xuICAgICAgICAgICAgdGhpcy5fdW5kby5yZWNvcmRDcmVhdGVOb2RlQ29tbWFuZChiZWZvcmVOb2RlVXVpZHMsIHByZWZlcnJlZFJvb3RQYXRocyk7XG4gICAgICAgICAgICBpZiAoZ3JvdXBJZCkge1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8uZW5kR3JvdXA/Lihncm91cElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChncm91cElkKSB7XG4gICAgICAgICAgICAgICAgU2VydmljZS5VbmRvPy5jYW5jZWxHcm91cD8uKGdyb3VwSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWNvcmRQcmVmYWJDYW52YXNVbmRvQ29tbWFuZHMocmVjb3JkczogSVByZWZhYkNhbnZhc1VuZG9SZWNvcmRbXSk6IHZvaWQge1xuICAgICAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiByZWNvcmRzKSB7XG4gICAgICAgICAgICBpZiAocmVjb3JkLmFkZGVkVUlUcmFuc2Zvcm0/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5fY2FwdHVyZUFkZENvbXBvbmVudENvbW1hbmQocmVjb3JkLmFkZGVkVUlUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChjb21tYW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZWNvcmQucHJldmlld0NhbnZhc05vZGU/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlLlVuZG8/LnB1c2gobmV3IFByZWZhYlByZXZpZXdDYW52YXNDb21tYW5kKHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdFV1aWQ6IHJlY29yZC5yb290Tm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICByb290UGF0aDogTm9kZU1nci5nZXROb2RlUGF0aChyZWNvcmQucm9vdE5vZGUpID8/ICcnLFxuICAgICAgICAgICAgICAgICAgICByb290UGFyZW50VXVpZDogcmVjb3JkLnJvb3RQYXJlbnRVdWlkLFxuICAgICAgICAgICAgICAgICAgICByb290UGFyZW50UGF0aDogcmVjb3JkLnJvb3RQYXJlbnRQYXRoLFxuICAgICAgICAgICAgICAgICAgICByb290U2libGluZ0luZGV4OiByZWNvcmQucm9vdFNpYmxpbmdJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgcHJldmlld0NhbnZhc1V1aWQ6IHJlY29yZC5wcmV2aWV3Q2FudmFzTm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBwcmV2aWV3Q2FudmFzUGF0aDogTm9kZU1nci5nZXROb2RlUGF0aChyZWNvcmQucHJldmlld0NhbnZhc05vZGUpID8/ICcnLFxuICAgICAgICAgICAgICAgICAgICByZW1vdmVQcmV2aWV3Q2FudmFzT25VbmRvOiByZWNvcmQucHJldmlld0NhbnZhc0NyZWF0ZWQsXG4gICAgICAgICAgICAgICAgICAgIHdvcmtNb2RlOiByZWNvcmQud29ya01vZGUsXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FwdHVyZUFkZENvbXBvbmVudENvbW1hbmQoY29tcG9uZW50OiBDb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgeyBBZGRDb21wb25lbnRDb21tYW5kIH0gPSByZXF1aXJlKCcuL3VuZG8vY29tbWFuZHMvYWRkLWNvbXBvbmVudC1jb21tYW5kJykgYXMgdHlwZW9mIGltcG9ydCgnLi91bmRvL2NvbW1hbmRzL2FkZC1jb21wb25lbnQtY29tbWFuZCcpO1xuICAgICAgICByZXR1cm4gQWRkQ29tcG9uZW50Q29tbWFuZC5jYXB0dXJlKGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FwdHVyZVJlcGFyZW50U25hcHNob3RzRm9yVW5kbyhub2RlczogTm9kZVtdKSB7XG4gICAgICAgIGlmIChTZXJ2aWNlLlVuZG8/LmlzQXBwbHlpbmc/LigpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fdW5kby5oYXNBY3RpdmVSZWNvcmRpbmdGb3JOb2Rlcyhub2RlcykpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvLmNhcHR1cmVSZXBhcmVudFNuYXBzaG90cyhub2Rlcyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FwdHVyZU5vZGVTbmFwc2hvdHNGb3JVbmRvKG5vZGVzOiBOb2RlW10pIHtcbiAgICAgICAgaWYgKFNlcnZpY2UuVW5kbz8uaXNBcHBseWluZz8uKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl91bmRvLmhhc0FjdGl2ZVJlY29yZGluZ0Zvck5vZGVzKG5vZGVzKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3VuZG8uY2FwdHVyZU5vZGVTbmFwc2hvdHMobm9kZXMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldE5vZGVQYXRoQnlVdWlkKHV1aWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2RlTWdyLnF1ZXJ5KHV1aWQpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTm9kZU1nci5nZXROb2RlUGF0aChub2RlKSB8fCAnJztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlUHJvcGVydHlGcm9tTnVsbChvcHRpb25zOiBJU2V0UHJvcGVydHlPcHRpb25zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBOb2RlTWdyLmdldE5vZGVCeVBhdGgob3B0aW9ucy5ub2RlUGF0aCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvLnJlY29yZE5vZGVTbmFwc2hvdChub2RlLCB7XG4gICAgICAgICAgICBsYWJlbDogYFVwZGF0ZSAke29wdGlvbnMucGF0aH1gLFxuICAgICAgICAgICAgdHlwZTogJ25vZGU6dXBkYXRlLXByb3BlcnR5LWZyb20tbnVsbCcsXG4gICAgICAgICAgICByZWNvcmQ6IG9wdGlvbnMucmVjb3JkLFxuICAgICAgICB9LCBhc3luYyAoKSA9PiBhd2FpdCBub2RlTWdyLnVwZGF0ZVByb3BlcnR5RnJvbU51bGwobm9kZS51dWlkLCBvcHRpb25zLnBhdGgpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2V0Tm9kZUFuZENoaWxkcmVuTGF5ZXIob3B0aW9uczogSVNldFByb3BlcnR5T3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKG9wdGlvbnMubm9kZVBhdGgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub2RlcyA9IHRoaXMuX3VuZG8uY29sbGVjdE5vZGVUcmVlKG5vZGUpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBvcHRpb25zLnJlY29yZCA9PT0gZmFsc2UgfHxcbiAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8uaXNBcHBseWluZz8uKCkgfHxcbiAgICAgICAgICAgIHRoaXMuX3VuZG8uaGFzQWN0aXZlUmVjb3JkaW5nRm9yTm9kZXMobm9kZXMpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IG5vZGVNZ3Iuc2V0Tm9kZUFuZENoaWxkcmVuTGF5ZXIobm9kZS51dWlkLCBvcHRpb25zLmR1bXApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5fdW5kby5jYXB0dXJlTm9kZVNuYXBzaG90cyhub2Rlcyk7XG4gICAgICAgIGF3YWl0IG5vZGVNZ3Iuc2V0Tm9kZUFuZENoaWxkcmVuTGF5ZXIobm9kZS51dWlkLCBvcHRpb25zLmR1bXApO1xuICAgICAgICBjb25zdCBhZnRlck5vZGVzID0gdGhpcy5fdW5kby5maW5kU25hcHNob3ROb2RlcyhiZWZvcmUpO1xuICAgICAgICBjb25zdCBhZnRlciA9IHRoaXMuX3VuZG8uY2FwdHVyZU5vZGVTbmFwc2hvdHMoYWZ0ZXJOb2Rlcyk7XG4gICAgICAgIHRoaXMuX3VuZG8ucHVzaE5vZGVTbmFwc2hvdENvbW1hbmQoXG4gICAgICAgICAgICAnbm9kZTpzZXQtbm9kZS1hbmQtY2hpbGRyZW4tbGF5ZXInLFxuICAgICAgICAgICAgJ1NldCBOb2RlIEFuZCBDaGlsZHJlbiBMYXllcicsXG4gICAgICAgICAgICBiZWZvcmUsXG4gICAgICAgICAgICBhZnRlcixcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UGF0aEJ5VXVpZCh1dWlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gbm9kZU1nci5nZXRQYXRoQnlVdWlkKHV1aWQpO1xuICAgIH1cblxuICAgIGFzeW5jIHNldFBhcmVudChwYXJhbXM6IElTZXRQYXJlbnRQYXJhbXMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBTZXJ2aWNlLkVkaXRvci5sb2NrKCk7XG4gICAgICAgICAgICBjb25zdCByb290ID0gU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKTtcbiAgICAgICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHNldCBwYXJlbnQ6IHRoZSBzY2VuZSBpcyBub3Qgb3BlbmVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB1dWlkcyA9IHBhcmFtcy5wYXRocy5tYXAocCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHRocm93IG5ldyBFcnJvcihgTm9kZSBub3QgZm91bmQgYXQgcGF0aDogJHtwfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnV1aWQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwYXJhbXMucGFyZW50UGF0aCk7XG4gICAgICAgICAgICBpZiAoIXBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcmVudCBub2RlIG5vdCBmb3VuZCBhdCBwYXRoOiAke3BhcmFtcy5wYXJlbnRQYXRofWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlcyA9IHV1aWRzXG4gICAgICAgICAgICAgICAgLm1hcCh1dWlkID0+IE5vZGVNZ3IuZ2V0Tm9kZSh1dWlkKSBhcyBOb2RlIHwgbnVsbClcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChub2RlKTogbm9kZSBpcyBOb2RlID0+ICEhbm9kZT8uaXNWYWxpZCk7XG4gICAgICAgICAgICBjb25zdCBiZWZvcmUgPSB0aGlzLl9jYXB0dXJlUmVwYXJlbnRTbmFwc2hvdHNGb3JVbmRvKG5vZGVzKTtcblxuICAgICAgICAgICAgY29uc3QgbW92ZWRVdWlkcyA9IG5vZGVNZ3Iuc2V0UGFyZW50KHBhcmVudE5vZGUudXVpZCwgdXVpZHMsIHBhcmFtcy5rZWVwV29ybGRUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgdGhpcy5fdW5kby5yZWNvcmRSZXBhcmVudFNuYXBzaG90cygnbm9kZTpzZXQtcGFyZW50JywgJ1NldCBQYXJlbnQnLCBiZWZvcmUsIG1vdmVkVXVpZHMpO1xuXG4gICAgICAgICAgICByZXR1cm4gbW92ZWRVdWlkcy5tYXAodXVpZCA9PiB0aGlzLl9nZXROb2RlUGF0aEJ5VXVpZCh1dWlkKSkuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRWRpdG9yLnVubG9jaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcmVvcmRlcihwYXJhbXM6IElSZW9yZGVyUGFyYW1zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBTZXJ2aWNlLkVkaXRvci5sb2NrKCk7XG4gICAgICAgICAgICBjb25zdCByb290ID0gU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKTtcbiAgICAgICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHJlb3JkZXI6IHRoZSBzY2VuZSBpcyBub3Qgb3BlbmVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKHBhcmFtcy5wYXRoKTtcbiAgICAgICAgICAgIGlmICghcGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUGFyZW50IG5vZGUgbm90IGZvdW5kIGF0IHBhdGg6ICR7cGFyYW1zLnBhdGh9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl91bmRvLm1vdmVDaGlsZEFycmF5RWxlbWVudEJ5VXVpZChwYXJlbnROb2RlLnV1aWQsICdjaGlsZHJlbicsIHBhcmFtcy50YXJnZXQsIHBhcmFtcy5vZmZzZXQpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRWRpdG9yLnVubG9jaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY3V0VXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICBhc3luYyBjb3B5KHBhcmFtczogSUNvcHlQYXJhbXMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBTZXJ2aWNlLkVkaXRvci5sb2NrKCk7XG4gICAgICAgICAgICBjb25zdCByb290ID0gU2VydmljZS5FZGl0b3IuZ2V0Um9vdE5vZGUoKTtcbiAgICAgICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNvcHkgbm9kZTogdGhlIHNjZW5lIGlzIG5vdCBvcGVuZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHV1aWRzID0gcGFyYW1zLnBhdGhzLm1hcChwID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKHApO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZSkgdGhyb3cgbmV3IEVycm9yKGBOb2RlIG5vdCBmb3VuZCBhdCBwYXRoOiAke3B9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUudXVpZDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBjb3B5IOimhuebluS5i+WJjeeahCBjdXQg5qCH6K6wXG4gICAgICAgICAgICB0aGlzLl9jdXRVdWlkcyA9IFtdO1xuICAgICAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSBub2RlTWdyLmNvcHkodXVpZHMpO1xuICAgICAgICAgICAgcmV0dXJuIGNvcGllZFV1aWRzLm1hcCh1dWlkID0+IHRoaXMuX2dldE5vZGVQYXRoQnlVdWlkKHV1aWQpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgU2VydmljZS5FZGl0b3IudW5sb2NrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBwYXN0ZShwYXJhbXM6IElQYXN0ZVBhcmFtcyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmxvY2soKTtcbiAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpO1xuICAgICAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gcGFzdGUgbm9kZTogdGhlIHNjZW5lIGlzIG5vdCBvcGVuZWQuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBwYXJlbnRVdWlkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChwYXJhbXMucGFyZW50UGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBOb2RlTWdyLmdldE5vZGVCeVBhdGgocGFyYW1zLnBhcmVudFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghcGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcmVudCBub2RlIG5vdCBmb3VuZCBhdCBwYXRoOiAke3BhcmFtcy5wYXJlbnRQYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gcGFyZW50Tm9kZS51dWlkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDliarliIfnspjotLTvvJrnp7vliqjoioLngrnogIzpnZ7liJvlu7rlia/mnKxcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXRVdWlkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3V0VXVpZHMgPSB0aGlzLl9jdXRVdWlkcztcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXRVdWlkcyA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gY3V0VXVpZHNcbiAgICAgICAgICAgICAgICAgICAgLm1hcCh1dWlkID0+IE5vZGVNZ3IuZ2V0Tm9kZSh1dWlkKSBhcyBOb2RlIHwgbnVsbClcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigobm9kZSk6IG5vZGUgaXMgTm9kZSA9PiAhIW5vZGU/LmlzVmFsaWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX2NhcHR1cmVSZXBhcmVudFNuYXBzaG90c0ZvclVuZG8obm9kZXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVkVXVpZHMgPSBub2RlTWdyLnNldFBhcmVudChwYXJlbnRVdWlkIHx8IHJvb3QudXVpZCwgY3V0VXVpZHMsICEhcGFyYW1zLmtlZXBXb3JsZFRyYW5zZm9ybSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kby5yZWNvcmRSZXBhcmVudFNuYXBzaG90cygnbm9kZTpwYXN0ZS1jdXQnLCAnUGFzdGUgQ3V0IE5vZGVzJywgYmVmb3JlLCBtb3ZlZFV1aWRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW92ZWRVdWlkcy5tYXAodXVpZCA9PiB0aGlzLl9nZXROb2RlUGF0aEJ5VXVpZCh1dWlkKSkuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDmma7pgJrnspjotLTvvJrliJvlu7rlia/mnKxcbiAgICAgICAgICAgIGNvbnN0IGNvcGllZFV1aWRzID0gbm9kZU1nci5nZXRDb3BpZWRVdWlkcygpO1xuICAgICAgICAgICAgaWYgKGNvcGllZFV1aWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gbm9kZXMgaGF2ZSBiZWVuIGNvcGllZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYmVmb3JlTm9kZVV1aWRzID0gdGhpcy5fY29sbGVjdFNjZW5lTm9kZVV1aWRzRm9yVW5kbygpO1xuICAgICAgICAgICAgY29uc3QgbmV3VXVpZHMgPSBub2RlTWdyLnBhc3RlKHBhcmVudFV1aWQgfHwgcm9vdC51dWlkLCBjb3BpZWRVdWlkcywgcGFyYW1zLmtlZXBXb3JsZFRyYW5zZm9ybSk7XG4gICAgICAgICAgICBjb25zdCBuZXdQYXRocyA9IG5ld1V1aWRzLm1hcCh1dWlkID0+IHRoaXMuX2dldE5vZGVQYXRoQnlVdWlkKHV1aWQpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgICAgICB0aGlzLl91bmRvLnJlY29yZENyZWF0ZU5vZGVDb21tYW5kKGJlZm9yZU5vZGVVdWlkcywgbmV3UGF0aHMpO1xuICAgICAgICAgICAgcmV0dXJuIG5ld1BhdGhzO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRWRpdG9yLnVubG9jaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZHVwbGljYXRlKHBhcmFtczogSUR1cGxpY2F0ZVBhcmFtcyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmxvY2soKTtcbiAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpO1xuICAgICAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZHVwbGljYXRlIG5vZGU6IHRoZSBzY2VuZSBpcyBub3Qgb3BlbmVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB1dWlkcyA9IHBhcmFtcy5wYXRocy5tYXAocCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHRocm93IG5ldyBFcnJvcihgTm9kZSBub3QgZm91bmQgYXQgcGF0aDogJHtwfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnV1aWQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgYmVmb3JlTm9kZVV1aWRzID0gdGhpcy5fY29sbGVjdFNjZW5lTm9kZVV1aWRzRm9yVW5kbygpO1xuICAgICAgICAgICAgY29uc3QgbmV3VXVpZHMgPSBub2RlTWdyLmR1cGxpY2F0ZSh1dWlkcyk7XG4gICAgICAgICAgICBjb25zdCBuZXdQYXRocyA9IG5ld1V1aWRzLm1hcCh1dWlkID0+IHRoaXMuX2dldE5vZGVQYXRoQnlVdWlkKHV1aWQpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgICAgICB0aGlzLl91bmRvLnJlY29yZENyZWF0ZU5vZGVDb21tYW5kKGJlZm9yZU5vZGVVdWlkcywgbmV3UGF0aHMpO1xuICAgICAgICAgICAgcmV0dXJuIG5ld1BhdGhzO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuRWRpdG9yLnVubG9jaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgY3V0KHBhcmFtczogSUN1dFBhcmFtcyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IFNlcnZpY2UuRWRpdG9yLmxvY2soKTtcbiAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpO1xuICAgICAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3V0IG5vZGU6IHRoZSBzY2VuZSBpcyBub3Qgb3BlbmVkLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB1dWlkcyA9IHBhcmFtcy5wYXRocy5tYXAocCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHRocm93IG5ldyBFcnJvcihgTm9kZSBub3QgZm91bmQgYXQgcGF0aDogJHtwfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnV1aWQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8g5Y+q5qCH6K6w5Li65Ymq5YiH77yM5LiN56uL5Y2z5Yig6Zmk77ybcGFzdGUg5pe26YCa6L+HIHNldFBhcmVudCDnp7vliqjoioLngrlcbiAgICAgICAgICAgIHRoaXMuX2N1dFV1aWRzID0gdXVpZHM7XG5cbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMucGF0aHM7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgU2VydmljZS5FZGl0b3IudW5sb2NrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeUNsaXBib2FyZFN0YXRlKCk6IFByb21pc2U8SUNsaXBib2FyZFN0YXRlPiB7XG4gICAgICAgIGlmICh0aGlzLl9jdXRVdWlkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBwYXRocyA9IHRoaXMuX2N1dFV1aWRzLm1hcCh1dWlkID0+IHRoaXMuX2dldE5vZGVQYXRoQnlVdWlkKHV1aWQpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiAnY3V0JywgcGF0aHMgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb3BpZWRVdWlkcyA9IG5vZGVNZ3IuZ2V0Q29waWVkVXVpZHMoKTtcbiAgICAgICAgaWYgKGNvcGllZFV1aWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gY29waWVkVXVpZHMubWFwKHV1aWQgPT4gdGhpcy5fZ2V0Tm9kZVBhdGhCeVV1aWQodXVpZCkpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6ICdjb3B5JywgcGF0aHMgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiAnbm9uZScsIHBhdGhzOiBbXSB9O1xuICAgIH1cblxuICAgIGFzeW5jIG1vdmVBcnJheUVsZW1lbnQocGFyYW1zOiBJTW92ZUFycmF5RWxlbWVudFBhcmFtcyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgU2VydmljZS5FZGl0b3IubG9jaygpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwYXJhbXMubm9kZVBhdGgpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb2RlIG5vdCBmb3VuZCBhdCBwYXRoOiAke3BhcmFtcy5ub2RlUGF0aH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl91bmRvLm1vdmVBcnJheUVsZW1lbnRCeVV1aWQobm9kZS51dWlkLCBwYXJhbXMucGF0aCwgcGFyYW1zLnRhcmdldCwgcGFyYW1zLm9mZnNldCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgU2VydmljZS5FZGl0b3IudW5sb2NrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyByZW1vdmVBcnJheUVsZW1lbnQocGFyYW1zOiBJUmVtb3ZlQXJyYXlFbGVtZW50UGFyYW1zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBTZXJ2aWNlLkVkaXRvci5sb2NrKCk7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKHBhcmFtcy5ub2RlUGF0aCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGUgbm90IGZvdW5kIGF0IHBhdGg6ICR7cGFyYW1zLm5vZGVQYXRofWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFBhdGggPSBwYXJhbXMucGF0aC5yZXBsYWNlKCdfX2NvbXBzX18nLCAnX2NvbXBvbmVudHMnKTtcbiAgICAgICAgICAgIGxldCBjb21wb25lbnQ6IENvbXBvbmVudCB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChub3JtYWxpemVkUGF0aCA9PT0gJ19jb21wb25lbnRzJykge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudCA9IG5vZGUuY29tcG9uZW50c1twYXJhbXMuaW5kZXhdIGFzIENvbXBvbmVudCB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHNob3VsZFJlY29yZCA9ICFTZXJ2aWNlLlVuZG8/LmlzQXBwbHlpbmc/LigpICYmICFTZXJ2aWNlLlVuZG8/Lmhhc0FjdGl2ZVJlY29yZGluZz8uKG5vZGUudXVpZCk7XG4gICAgICAgICAgICBsZXQgY29tbWFuZDogUmVtb3ZlQ29tcG9uZW50Q29tbWFuZCB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHNob3VsZFJlY29yZCAmJiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gUmVtb3ZlQ29tcG9uZW50Q29tbWFuZC5jYXB0dXJlKGNvbXBvbmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYmVmb3JlOiBSZXR1cm5UeXBlPE5vZGVVbmRvSGVscGVyWydjYXB0dXJlTm9kZVNuYXBzaG90cyddPiB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHNob3VsZFJlY29yZCAmJiAhY29tbWFuZCkge1xuICAgICAgICAgICAgICAgIGJlZm9yZSA9IHRoaXMuX3VuZG8uY2FwdHVyZU5vZGVTbmFwc2hvdHMoW25vZGVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG5vZGVNZ3IucmVtb3ZlQXJyYXlFbGVtZW50KG5vZGUudXVpZCwgcGFyYW1zLnBhdGgsIHBhcmFtcy5pbmRleCk7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChjb21tYW5kKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYmVmb3JlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF0ZXN0Tm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZShub2RlLnV1aWQpIGFzIE5vZGUgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChsYXRlc3ROb2RlPy5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFmdGVyID0gdGhpcy5fdW5kby5jYXB0dXJlTm9kZVNuYXBzaG90cyhbbGF0ZXN0Tm9kZV0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91bmRvLnB1c2hOb2RlU25hcHNob3RDb21tYW5kKCdub2RlOnJlbW92ZS1hcnJheS1lbGVtZW50JywgJ1JlbW92ZSBBcnJheSBFbGVtZW50JywgYmVmb3JlLCBhZnRlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBTZXJ2aWNlLkVkaXRvci51bmxvY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGNoYW5nZU5vZGVMb2NrKHBhcmFtczogSUNoYW5nZU5vZGVMb2NrUGFyYW1zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBTZXJ2aWNlLkVkaXRvci5sb2NrKCk7XG4gICAgICAgICAgICBjb25zdCB1dWlkcyA9IHBhcmFtcy5wYXRocy5tYXAocCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHRocm93IG5ldyBFcnJvcihgTm9kZSBub3QgZm91bmQgYXQgcGF0aDogJHtwfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnV1aWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlcyA9IHV1aWRzXG4gICAgICAgICAgICAgICAgLm1hcCh1dWlkID0+IE5vZGVNZ3IuZ2V0Tm9kZSh1dWlkKSBhcyBOb2RlIHwgbnVsbClcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChub2RlKTogbm9kZSBpcyBOb2RlID0+ICEhbm9kZT8uaXNWYWxpZCk7XG4gICAgICAgICAgICBsZXQgbm9kZXMgPSByb290Tm9kZXM7XG4gICAgICAgICAgICBpZiAocGFyYW1zLmxvb3ApIHtcbiAgICAgICAgICAgICAgICBub2RlcyA9IHJvb3ROb2Rlcy5mbGF0TWFwKG5vZGUgPT4gdGhpcy5fdW5kby5jb2xsZWN0Tm9kZVRyZWUobm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZXMgPSB0aGlzLl91bmRvLmRlZHVwZU5vZGVzKG5vZGVzKTtcbiAgICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX2NhcHR1cmVOb2RlU25hcHNob3RzRm9yVW5kbyhub2Rlcyk7XG4gICAgICAgICAgICBub2RlTWdyLmNoYW5nZU5vZGVMb2NrKHV1aWRzLCBwYXJhbXMubG9ja2VkLCBwYXJhbXMubG9vcCA/PyBmYWxzZSk7XG4gICAgICAgICAgICBpZiAoYmVmb3JlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWZ0ZXJOb2RlcyA9IHRoaXMuX3VuZG8uZmluZFNuYXBzaG90Tm9kZXMoYmVmb3JlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhZnRlciA9IHRoaXMuX3VuZG8uY2FwdHVyZU5vZGVTbmFwc2hvdHMoYWZ0ZXJOb2Rlcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kby5wdXNoTm9kZVNuYXBzaG90Q29tbWFuZCgnbm9kZTpjaGFuZ2UtbG9jaycsICdDaGFuZ2UgTm9kZSBMb2NrJywgYmVmb3JlLCBhZnRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgU2VydmljZS5FZGl0b3IudW5sb2NrKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=