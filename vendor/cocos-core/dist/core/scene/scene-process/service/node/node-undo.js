"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeUndoHelper = void 0;
const common_1 = require("../../../common");
const core_1 = require("../core");
const dump_1 = __importDefault(require("../dump"));
const index_1 = __importDefault(require("./index"));
const create_node_command_1 = require("../undo/commands/create-node-command");
const snapshot_command_1 = require("../undo/commands/snapshot-command");
const command_utils_shared_1 = require("../undo/commands/command-utils-shared");
const path_utils_1 = require("../../../../engine/editor-extends/manager/path-utils");
const NodeMgr = EditorExtends.Node;
class NodeUndoHelper {
    _emit;
    constructor(_emit) {
        this._emit = _emit;
    }
    shouldRecordStructureCommand() {
        return !core_1.Service.Undo?.isApplying?.();
    }
    collectSceneNodeUuids() {
        return new Set(Object.keys(NodeMgr.getNodes() ?? {}));
    }
    getCreateRootPath(path) {
        if (!path) {
            return null;
        }
        try {
            return NodeMgr.getNodeByPath(path) ? null : path;
        }
        catch (_error) {
            return null;
        }
    }
    recordCreateNodeCommand(beforeNodeUuids, preferredRootPaths = []) {
        if (!beforeNodeUuids) {
            return;
        }
        const targets = this._getPreferredNewRootNodes(beforeNodeUuids, preferredRootPaths);
        for (const target of this._getNewRootNodes(beforeNodeUuids)) {
            if (!targets.some(existing => existing.node === target.node)) {
                targets.push(target);
            }
        }
        const rootTargets = this._getRootStructureTargets(targets);
        const command = create_node_command_1.CreateNodeCommand.capture(rootTargets);
        if (command) {
            core_1.Service.Undo?.push(command);
        }
    }
    async recordNodeSnapshot(node, options, mutate) {
        if (options.record === false ||
            core_1.Service.Undo?.isApplying?.() ||
            core_1.Service.Undo?.hasActiveRecording?.(node.uuid)) {
            return mutate();
        }
        const before = this.captureNodeSnapshots([node]);
        const result = await mutate();
        if (!result) {
            return result;
        }
        const latestNode = NodeMgr.getNode(node.uuid);
        if (!latestNode?.isValid) {
            return result;
        }
        const after = this.captureNodeSnapshots([latestNode]);
        this.pushNodeSnapshotCommand(options.type, options.label, before, after, options.scope);
        return result;
    }
    captureNodeSnapshots(nodes) {
        const snapshots = new Map();
        for (const node of nodes) {
            if (!node?.isValid) {
                continue;
            }
            snapshots.set(node.uuid, {
                uuid: node.uuid,
                path: NodeMgr.getNodePath(node) ?? '',
                dump: this._cloneSnapshotDump(dump_1.default.dumpNode(node)),
            });
        }
        return snapshots;
    }
    collectNodeTree(node) {
        const nodes = [];
        const visit = (current) => {
            if (!current?.isValid) {
                return;
            }
            nodes.push(current);
            for (const child of current.children ?? []) {
                visit(child);
            }
        };
        visit(node);
        return nodes;
    }
    hasActiveRecordingForNodes(nodes) {
        return nodes.some(node => core_1.Service.Undo?.hasActiveRecording?.(node.uuid));
    }
    findSnapshotNodes(snapshots) {
        const nodes = [];
        for (const snapshot of snapshots.values()) {
            const node = this._findSnapshotNode(snapshot);
            if (node) {
                nodes.push(node);
            }
        }
        return nodes;
    }
    captureReparentSnapshots(nodes) {
        const snapshots = new Map();
        for (const node of nodes) {
            if (!node?.isValid) {
                continue;
            }
            const parent = node.parent;
            snapshots.set(node.uuid, {
                uuid: node.uuid,
                path: NodeMgr.getNodePath(node) ?? '',
                dump: this._cloneSnapshotDump(dump_1.default.dumpNode(node)),
                parentUuid: parent?.uuid ?? null,
                parentPath: parent ? (NodeMgr.getNodePath(parent) ?? '/') : '/',
                siblingIndex: node.getSiblingIndex(),
            });
        }
        return snapshots;
    }
    recordReparentSnapshots(type, label, before, changedUuids) {
        if (!before || changedUuids.length === 0) {
            return;
        }
        const afterNodes = changedUuids
            .map(uuid => NodeMgr.getNode(uuid))
            .filter((node) => !!node?.isValid);
        const after = this.captureReparentSnapshots(afterNodes);
        if (this.snapshotMapsEqual(before, after)) {
            return;
        }
        core_1.Service.Undo?.push(new snapshot_command_1.SnapshotCommand({
            id: this._createUndoSnapshotId(type),
            label,
            type,
            scope: { editorType: 'scene' },
            timestamp: Date.now(),
        }, before, after, this._createReparentSnapshotAdapter()));
    }
    pushNodeSnapshotCommand(type, label, before, after, scope = { editorType: 'scene' }) {
        if (this.snapshotMapsEqual(before, after)) {
            return;
        }
        core_1.Service.Undo?.push(new snapshot_command_1.SnapshotCommand({
            id: this._createUndoSnapshotId(type),
            label,
            type,
            scope,
            timestamp: Date.now(),
        }, before, after, this._createNodeSnapshotAdapter()));
    }
    async moveArrayElementByUuid(uuid, path, target, offset) {
        const normalizedPath = path.replace('__comps__', '_components');
        if (normalizedPath === 'children') {
            return this.moveChildArrayElementByUuid(uuid, path, target, offset);
        }
        if (normalizedPath === '_components') {
            return this._moveComponentArrayElementByUuid(uuid, path, target, offset);
        }
        return index_1.default.moveArrayElement(uuid, path, target, offset);
    }
    async moveChildArrayElementByUuid(uuid, path, target, offset) {
        const node = NodeMgr.getNode(uuid);
        if (!node?.isValid) {
            return false;
        }
        if (path !== 'children') {
            throw new Error('Node.moveArrayElement currently supports undo recording only for path="children"');
        }
        if (core_1.Service.Undo?.isApplying?.() ||
            core_1.Service.Undo?.hasActiveRecording?.(node.uuid)) {
            return index_1.default.moveArrayElement(node.uuid, path, target, offset);
        }
        const before = this._captureChildOrderSnapshot(node);
        const result = index_1.default.moveArrayElement(node.uuid, path, target, offset);
        if (!result) {
            return result;
        }
        const latestNode = NodeMgr.getNode(uuid);
        if (!latestNode) {
            return result;
        }
        const after = this._captureChildOrderSnapshot(latestNode);
        if (!this.snapshotMapsEqual(before, after)) {
            core_1.Service.Undo?.push(new snapshot_command_1.SnapshotCommand({
                id: this._createUndoSnapshotId('node:move-array-element'),
                label: 'Move Array Element',
                type: 'node:move-array-element',
                scope: { editorType: 'scene' },
                timestamp: Date.now(),
            }, before, after, this._createChildOrderSnapshotAdapter()));
        }
        return result;
    }
    async _moveComponentArrayElementByUuid(uuid, path, target, offset) {
        const node = NodeMgr.getNode(uuid);
        if (!node?.isValid) {
            return false;
        }
        if (core_1.Service.Undo?.isApplying?.() ||
            core_1.Service.Undo?.hasActiveRecording?.(node.uuid)) {
            return index_1.default.moveArrayElement(node.uuid, path, target, offset);
        }
        const before = this._captureComponentOrderSnapshot(node);
        const result = index_1.default.moveArrayElement(node.uuid, path, target, offset);
        if (!result) {
            return result;
        }
        const latestNode = NodeMgr.getNode(uuid);
        if (!latestNode) {
            return result;
        }
        const after = this._captureComponentOrderSnapshot(latestNode);
        if (!this.snapshotMapsEqual(before, after)) {
            core_1.Service.Undo?.push(new snapshot_command_1.SnapshotCommand({
                id: this._createUndoSnapshotId('node:move-array-element'),
                label: 'Move Array Element',
                type: 'node:move-array-element',
                scope: { editorType: 'scene' },
                timestamp: Date.now(),
            }, before, after, this._createComponentOrderSnapshotAdapter()));
        }
        return result;
    }
    dedupeNodes(nodes) {
        const seen = new Set();
        const result = [];
        for (const node of nodes) {
            if (!node?.isValid || seen.has(node.uuid)) {
                continue;
            }
            seen.add(node.uuid);
            result.push(node);
        }
        return result;
    }
    snapshotMapsEqual(before, after) {
        return (0, command_utils_shared_1.snapshotMapsEqual)(before, after);
    }
    _getPreferredNewRootNodes(beforeNodeUuids, paths) {
        const targets = [];
        for (const path of paths) {
            const node = NodeMgr.getNodeByPath(path);
            if (node?.isValid && !beforeNodeUuids.has(node.uuid) && !targets.some(target => target.node === node)) {
                targets.push({ node, path });
            }
        }
        return targets;
    }
    _getNewRootNodes(beforeNodeUuids) {
        const nodeMap = NodeMgr.getNodes() ?? {};
        const newUuids = new Set(Object.keys(nodeMap).filter(uuid => !beforeNodeUuids.has(uuid)));
        return Array.from(newUuids)
            .map(uuid => nodeMap[uuid])
            .filter((node) => !!node?.isValid)
            .map(node => ({ node, path: NodeMgr.getNodePath(node) }))
            .filter(target => !!target.path)
            .filter(target => !this._containsExistingNode(target.node, beforeNodeUuids))
            .filter(target => !target.node.parent || !newUuids.has(target.node.parent.uuid))
            .sort((a, b) => a.node.getSiblingIndex() - b.node.getSiblingIndex());
    }
    _getRootStructureTargets(targets) {
        return targets.filter((target, index) => {
            if (targets.findIndex(item => item.node === target.node) !== index) {
                return false;
            }
            return !targets.some(other => other.node !== target.node && target.node.isChildOf(other.node));
        });
    }
    _containsExistingNode(node, beforeNodeUuids) {
        for (const child of node.children ?? []) {
            if (beforeNodeUuids.has(child.uuid) || this._containsExistingNode(child, beforeNodeUuids)) {
                return true;
            }
        }
        return false;
    }
    _captureChildOrderSnapshot(parent) {
        const snapshots = new Map();
        if (!parent?.isValid) {
            return snapshots;
        }
        snapshots.set(parent.uuid, {
            parentUuid: parent.uuid,
            parentPath: NodeMgr.getNodePath(parent) ?? '/',
            childUuids: parent.children.map(child => child.uuid),
        });
        return snapshots;
    }
    _createChildOrderSnapshotAdapter() {
        return {
            capture: async () => new Map(),
            apply: async (data) => this._applyChildOrderSnapshots(data),
            equals: (before, after) => this.snapshotMapsEqual(before, after),
        };
    }
    async _applyChildOrderSnapshots(data) {
        for (const snapshot of data.values()) {
            const result = this._applyChildOrderSnapshot(snapshot);
            if (!result.success) {
                return result;
            }
        }
        return { success: true };
    }
    _applyChildOrderSnapshot(snapshot) {
        const parent = this._findChildOrderParent(snapshot);
        if (!parent) {
            return { success: false, reason: `Parent node not found: ${snapshot.parentPath || snapshot.parentUuid}` };
        }
        try {
            this._emit('node:before-change', parent);
            for (let index = 0; index < snapshot.childUuids.length; index++) {
                const child = NodeMgr.getNode(snapshot.childUuids[index]);
                if (!child?.isValid || child.parent !== parent) {
                    return { success: false, reason: `Child node not found: ${snapshot.childUuids[index]}` };
                }
                child.setSiblingIndex(index);
            }
            this._emit('node:change', parent, {
                source: 'undo',
                type: common_1.NodeEventType.MOVE_ARRAY_ELEMENT,
                propPath: 'children',
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, reason: error instanceof Error ? error.message : String(error) };
        }
    }
    _findChildOrderParent(snapshot) {
        const byUuid = NodeMgr.getNode(snapshot.parentUuid);
        if (byUuid?.isValid) {
            return byUuid;
        }
        if (snapshot.parentPath) {
            try {
                const byPath = (0, path_utils_1.isRootNodePath)(snapshot.parentPath)
                    ? core_1.Service.Editor.getRootNode()
                    : NodeMgr.getNodeByPath(snapshot.parentPath);
                return byPath?.isValid ? byPath : null;
            }
            catch (_error) {
                return null;
            }
        }
        return null;
    }
    _captureComponentOrderSnapshot(node) {
        const snapshots = new Map();
        if (!node?.isValid) {
            return snapshots;
        }
        snapshots.set(node.uuid, {
            nodeUuid: node.uuid,
            nodePath: NodeMgr.getNodePath(node) ?? '',
            componentUuids: node.components.map(component => component.uuid),
        });
        return snapshots;
    }
    _createComponentOrderSnapshotAdapter() {
        return {
            capture: async () => new Map(),
            apply: async (data) => this._applyComponentOrderSnapshots(data),
            equals: (before, after) => this.snapshotMapsEqual(before, after),
        };
    }
    async _applyComponentOrderSnapshots(data) {
        for (const snapshot of data.values()) {
            const result = this._applyComponentOrderSnapshot(snapshot);
            if (!result.success) {
                return result;
            }
        }
        return { success: true };
    }
    _applyComponentOrderSnapshot(snapshot) {
        const node = this._findComponentOrderNode(snapshot);
        if (!node) {
            return { success: false, reason: `Node not found: ${snapshot.nodePath || snapshot.nodeUuid}` };
        }
        const components = node._components;
        if (!components) {
            return { success: false, reason: `Node components not found: ${snapshot.nodePath || snapshot.nodeUuid}` };
        }
        const componentByUuid = new Map(components.map(component => [component.uuid, component]));
        const orderedComponents = [];
        for (const uuid of snapshot.componentUuids) {
            const component = componentByUuid.get(uuid);
            if (!component?.isValid || component.node !== node) {
                return { success: false, reason: `Component not found: ${uuid}` };
            }
            orderedComponents.push(component);
        }
        const componentUuidSet = new Set(snapshot.componentUuids);
        const extraComponents = components.filter(component => !componentUuidSet.has(component.uuid));
        try {
            this._emit('node:before-change', node);
            components.splice(0, components.length, ...orderedComponents, ...extraComponents);
            this._emit('node:change', node, {
                source: 'undo',
                type: common_1.NodeEventType.MOVE_ARRAY_ELEMENT,
                propPath: '__comps__',
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, reason: error instanceof Error ? error.message : String(error) };
        }
    }
    _findComponentOrderNode(snapshot) {
        const byUuid = NodeMgr.getNode(snapshot.nodeUuid);
        if (byUuid?.isValid) {
            return byUuid;
        }
        if (snapshot.nodePath) {
            try {
                const byPath = NodeMgr.getNodeByPath(snapshot.nodePath);
                return byPath?.isValid ? byPath : null;
            }
            catch (_error) {
                return null;
            }
        }
        return null;
    }
    _createReparentSnapshotAdapter() {
        return {
            capture: async (uuids) => {
                const nodes = uuids
                    .map(uuid => NodeMgr.getNode(uuid))
                    .filter((node) => !!node);
                return this.captureReparentSnapshots(nodes);
            },
            apply: async (data) => this._applyReparentSnapshots(data),
            equals: (before, after) => this.snapshotMapsEqual(before, after),
        };
    }
    async _applyReparentSnapshots(data) {
        const snapshots = [...data.values()].sort((a, b) => a.siblingIndex - b.siblingIndex);
        for (const snapshot of snapshots) {
            const result = await this._applyReparentSnapshot(snapshot);
            if (!result.success) {
                return result;
            }
        }
        return { success: true };
    }
    async _applyReparentSnapshot(snapshot) {
        const node = this._findSnapshotNode(snapshot);
        if (!node) {
            return { success: false, reason: `Node not found: ${snapshot.path || snapshot.uuid}` };
        }
        const parent = this._findReparentParent(snapshot);
        if (!parent) {
            return { success: false, reason: `Parent node not found: ${snapshot.parentPath || snapshot.parentUuid || '/'}` };
        }
        try {
            const oldParent = node.parent;
            if (oldParent) {
                this._emit('node:before-change', oldParent);
            }
            if (parent !== oldParent) {
                this._emit('node:before-change', parent);
            }
            this._emit('node:before-change', node);
            node.setParent(parent, false);
            if (snapshot.siblingIndex >= 0) {
                node.setSiblingIndex(snapshot.siblingIndex);
            }
            await this._restoreNodeSnapshotDump(node, snapshot.dump);
            if (oldParent) {
                this._emit('node:change', oldParent, { source: 'undo', type: common_1.NodeEventType.CHILD_CHANGED });
            }
            if (parent !== oldParent) {
                this._emit('node:change', parent, { source: 'undo', type: common_1.NodeEventType.CHILD_CHANGED });
            }
            this._emit('node:change', node, { source: 'undo', type: common_1.NodeEventType.PARENT_CHANGED });
            return { success: true };
        }
        catch (error) {
            return { success: false, reason: error instanceof Error ? error.message : String(error) };
        }
    }
    _findReparentParent(snapshot) {
        if (snapshot.parentUuid) {
            const byUuid = NodeMgr.getNode(snapshot.parentUuid);
            if (byUuid?.isValid) {
                return byUuid;
            }
        }
        if (snapshot.parentPath && !(0, path_utils_1.isRootNodePath)(snapshot.parentPath)) {
            try {
                const byPath = NodeMgr.getNodeByPath(snapshot.parentPath);
                if (byPath?.isValid) {
                    return byPath;
                }
            }
            catch (_error) {
                return null;
            }
        }
        return core_1.Service.Editor.getRootNode();
    }
    _createNodeSnapshotAdapter() {
        return {
            capture: async (uuids) => {
                const nodes = uuids
                    .map(uuid => NodeMgr.getNode(uuid))
                    .filter((node) => !!node);
                return this.captureNodeSnapshots(nodes);
            },
            apply: async (data) => this._applyNodeSnapshots(data),
            equals: (before, after) => this.snapshotMapsEqual(before, after),
        };
    }
    async _applyNodeSnapshots(data) {
        for (const snapshot of data.values()) {
            const result = await this._applyNodeSnapshot(snapshot);
            if (!result.success) {
                return result;
            }
        }
        return { success: true };
    }
    async _applyNodeSnapshot(snapshot) {
        const node = this._findSnapshotNode(snapshot);
        if (!node) {
            return { success: false, reason: `Node not found: ${snapshot.path || snapshot.uuid}` };
        }
        try {
            this._emit('node:before-change', node);
            await this._restoreNodeSnapshotDump(node, snapshot.dump);
            this._emit('node:change', node, { source: 'undo', type: common_1.NodeEventType.SET_PROPERTY });
            return { success: true };
        }
        catch (error) {
            return { success: false, reason: error instanceof Error ? error.message : String(error) };
        }
    }
    async _restoreNodeSnapshotDump(node, dump) {
        await (0, command_utils_shared_1.restoreNodeSnapshotDump)(node, dump, {
            updateNodeName: (uuid, name) => NodeMgr.updateNodeName(uuid, name),
        });
    }
    _findSnapshotNode(snapshot) {
        const nodeByUuid = NodeMgr.getNode(snapshot.uuid);
        if (nodeByUuid?.isValid) {
            return nodeByUuid;
        }
        if (snapshot.path) {
            const nodeByPath = NodeMgr.getNodeByPath(snapshot.path);
            return nodeByPath?.isValid ? nodeByPath : null;
        }
        return null;
    }
    _cloneSnapshotDump(dump) {
        return JSON.parse(JSON.stringify(dump));
    }
    _createUndoSnapshotId(prefix) {
        return (0, command_utils_shared_1.createUndoId)(prefix);
    }
}
exports.NodeUndoHelper = NodeUndoHelper;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS11bmRvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL25vZGUvbm9kZS11bmRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLDRDQUF1RjtBQUN2RixrQ0FBa0M7QUFDbEMsbURBQStCO0FBQy9CLG9EQUE4QjtBQUM5Qiw4RUFBeUU7QUFDekUsd0VBQTJGO0FBRTNGLGdGQUFpSDtBQUNqSCxxRkFBc0Y7QUFFdEYsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQztBQTRCbkMsTUFBYSxjQUFjO0lBQ007SUFBN0IsWUFBNkIsS0FBb0I7UUFBcEIsVUFBSyxHQUFMLEtBQUssQ0FBZTtJQUFJLENBQUM7SUFFdEQsNEJBQTRCO1FBQ3hCLE9BQU8sQ0FBQyxjQUFPLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7SUFDekMsQ0FBQztJQUVELHFCQUFxQjtRQUNqQixPQUFPLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVELGlCQUFpQixDQUFDLElBQXdCO1FBQ3RDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNSLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxJQUFJLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3JELENBQUM7UUFBQyxPQUFPLE1BQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztJQUNMLENBQUM7SUFFRCx1QkFBdUIsQ0FBQyxlQUFtQyxFQUFFLHFCQUErQixFQUFFO1FBQzFGLElBQUksQ0FBQyxl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QUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFTyxxQkFBcUIsQ0FBQyxNQUFjO1FBQ3hDLE9BQU8sSUFBQSxtQ0FBWSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Q0FDSjtBQXRuQkQsd0NBc25CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgTm9kZSB9IGZyb20gJ2NjJztcbmltcG9ydCB7IE5vZGVFdmVudFR5cGUsIHR5cGUgSVVuZG9SZWRvUmVzdWx0LCB0eXBlIElVbmRvU2NvcGUgfSBmcm9tICcuLi8uLi8uLi9jb21tb24nO1xuaW1wb3J0IHsgU2VydmljZSB9IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0IGR1bXBVdGlsIGZyb20gJy4uL2R1bXAnO1xuaW1wb3J0IG5vZGVNZ3IgZnJvbSAnLi9pbmRleCc7XG5pbXBvcnQgeyBDcmVhdGVOb2RlQ29tbWFuZCB9IGZyb20gJy4uL3VuZG8vY29tbWFuZHMvY3JlYXRlLW5vZGUtY29tbWFuZCc7XG5pbXBvcnQgeyBTbmFwc2hvdENvbW1hbmQsIHR5cGUgSVNuYXBzaG90QWRhcHRlciB9IGZyb20gJy4uL3VuZG8vY29tbWFuZHMvc25hcHNob3QtY29tbWFuZCc7XG5pbXBvcnQgdHlwZSB7IElOb2RlU3RydWN0dXJlQ2FwdHVyZVRhcmdldCB9IGZyb20gJy4uL3VuZG8vY29tbWFuZHMvbm9kZS1zdHJ1Y3R1cmUtY29tbWFuZC11dGlscyc7XG5pbXBvcnQgeyBjcmVhdGVVbmRvSWQsIHJlc3RvcmVOb2RlU25hcHNob3REdW1wLCBzbmFwc2hvdE1hcHNFcXVhbCB9IGZyb20gJy4uL3VuZG8vY29tbWFuZHMvY29tbWFuZC11dGlscy1zaGFyZWQnO1xuaW1wb3J0IHsgaXNSb290Tm9kZVBhdGggfSBmcm9tICcuLi8uLi8uLi8uLi9lbmdpbmUvZWRpdG9yLWV4dGVuZHMvbWFuYWdlci9wYXRoLXV0aWxzJztcblxuY29uc3QgTm9kZU1nciA9IEVkaXRvckV4dGVuZHMuTm9kZTtcblxuZXhwb3J0IGludGVyZmFjZSBJTm9kZVNuYXBzaG90IHtcbiAgICB1dWlkOiBzdHJpbmc7XG4gICAgcGF0aDogc3RyaW5nO1xuICAgIGR1bXA6IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJTm9kZUNoaWxkT3JkZXJTbmFwc2hvdCB7XG4gICAgcGFyZW50VXVpZDogc3RyaW5nO1xuICAgIHBhcmVudFBhdGg6IHN0cmluZztcbiAgICBjaGlsZFV1aWRzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29tcG9uZW50T3JkZXJTbmFwc2hvdCB7XG4gICAgbm9kZVV1aWQ6IHN0cmluZztcbiAgICBub2RlUGF0aDogc3RyaW5nO1xuICAgIGNvbXBvbmVudFV1aWRzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJTm9kZVJlcGFyZW50U25hcHNob3QgZXh0ZW5kcyBJTm9kZVNuYXBzaG90IHtcbiAgICBwYXJlbnRVdWlkOiBzdHJpbmcgfCBudWxsO1xuICAgIHBhcmVudFBhdGg6IHN0cmluZztcbiAgICBzaWJsaW5nSW5kZXg6IG51bWJlcjtcbn1cblxudHlwZSBFbWl0Tm9kZUV2ZW50ID0gKGV2ZW50OiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgTm9kZVVuZG9IZWxwZXIge1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX2VtaXQ6IEVtaXROb2RlRXZlbnQpIHsgfVxuXG4gICAgc2hvdWxkUmVjb3JkU3RydWN0dXJlQ29tbWFuZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuICFTZXJ2aWNlLlVuZG8/LmlzQXBwbHlpbmc/LigpO1xuICAgIH1cblxuICAgIGNvbGxlY3RTY2VuZU5vZGVVdWlkcygpOiBTZXQ8c3RyaW5nPiB7XG4gICAgICAgIHJldHVybiBuZXcgU2V0KE9iamVjdC5rZXlzKE5vZGVNZ3IuZ2V0Tm9kZXMoKSA/PyB7fSkpO1xuICAgIH1cblxuICAgIGdldENyZWF0ZVJvb3RQYXRoKHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gTm9kZU1nci5nZXROb2RlQnlQYXRoKHBhdGgpID8gbnVsbCA6IHBhdGg7XG4gICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZWNvcmRDcmVhdGVOb2RlQ29tbWFuZChiZWZvcmVOb2RlVXVpZHM6IFNldDxzdHJpbmc+IHwgbnVsbCwgcHJlZmVycmVkUm9vdFBhdGhzOiBzdHJpbmdbXSA9IFtdKTogdm9pZCB7XG4gICAgICAgIGlmICghYmVmb3JlTm9kZVV1aWRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXJnZXRzID0gdGhpcy5fZ2V0UHJlZmVycmVkTmV3Um9vdE5vZGVzKGJlZm9yZU5vZGVVdWlkcywgcHJlZmVycmVkUm9vdFBhdGhzKTtcbiAgICAgICAgZm9yIChjb25zdCB0YXJnZXQgb2YgdGhpcy5fZ2V0TmV3Um9vdE5vZGVzKGJlZm9yZU5vZGVVdWlkcykpIHtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0cy5zb21lKGV4aXN0aW5nID0+IGV4aXN0aW5nLm5vZGUgPT09IHRhcmdldC5ub2RlKSkge1xuICAgICAgICAgICAgICAgIHRhcmdldHMucHVzaCh0YXJnZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgcm9vdFRhcmdldHMgPSB0aGlzLl9nZXRSb290U3RydWN0dXJlVGFyZ2V0cyh0YXJnZXRzKTtcbiAgICAgICAgY29uc3QgY29tbWFuZCA9IENyZWF0ZU5vZGVDb21tYW5kLmNhcHR1cmUocm9vdFRhcmdldHMpO1xuICAgICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICAgICAgU2VydmljZS5VbmRvPy5wdXNoKGNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgcmVjb3JkTm9kZVNuYXBzaG90KFxuICAgICAgICBub2RlOiBOb2RlLFxuICAgICAgICBvcHRpb25zOiB7IGxhYmVsOiBzdHJpbmc7IHR5cGU6IHN0cmluZzsgcmVjb3JkPzogYm9vbGVhbjsgc2NvcGU/OiBJVW5kb1Njb3BlIH0sXG4gICAgICAgIG11dGF0ZTogKCkgPT4gUHJvbWlzZTxib29sZWFuPixcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3B0aW9ucy5yZWNvcmQgPT09IGZhbHNlIHx8XG4gICAgICAgICAgICBTZXJ2aWNlLlVuZG8/LmlzQXBwbHlpbmc/LigpIHx8XG4gICAgICAgICAgICBTZXJ2aWNlLlVuZG8/Lmhhc0FjdGl2ZVJlY29yZGluZz8uKG5vZGUudXVpZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gbXV0YXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBiZWZvcmUgPSB0aGlzLmNhcHR1cmVOb2RlU25hcHNob3RzKFtub2RlXSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG11dGF0ZSgpO1xuICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxhdGVzdE5vZGUgPSBOb2RlTWdyLmdldE5vZGUobm9kZS51dWlkKSBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgaWYgKCFsYXRlc3ROb2RlPy5pc1ZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWZ0ZXIgPSB0aGlzLmNhcHR1cmVOb2RlU25hcHNob3RzKFtsYXRlc3ROb2RlXSk7XG4gICAgICAgIHRoaXMucHVzaE5vZGVTbmFwc2hvdENvbW1hbmQob3B0aW9ucy50eXBlLCBvcHRpb25zLmxhYmVsLCBiZWZvcmUsIGFmdGVyLCBvcHRpb25zLnNjb3BlKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBjYXB0dXJlTm9kZVNuYXBzaG90cyhub2RlczogTm9kZVtdKTogTWFwPHN0cmluZywgSU5vZGVTbmFwc2hvdD4ge1xuICAgICAgICBjb25zdCBzbmFwc2hvdHMgPSBuZXcgTWFwPHN0cmluZywgSU5vZGVTbmFwc2hvdD4oKTtcbiAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG4gICAgICAgICAgICBpZiAoIW5vZGU/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNuYXBzaG90cy5zZXQobm9kZS51dWlkLCB7XG4gICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgIHBhdGg6IE5vZGVNZ3IuZ2V0Tm9kZVBhdGgobm9kZSkgPz8gJycsXG4gICAgICAgICAgICAgICAgZHVtcDogdGhpcy5fY2xvbmVTbmFwc2hvdER1bXAoZHVtcFV0aWwuZHVtcE5vZGUobm9kZSkpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNuYXBzaG90cztcbiAgICB9XG5cbiAgICBjb2xsZWN0Tm9kZVRyZWUobm9kZTogTm9kZSk6IE5vZGVbXSB7XG4gICAgICAgIGNvbnN0IG5vZGVzOiBOb2RlW10gPSBbXTtcbiAgICAgICAgY29uc3QgdmlzaXQgPSAoY3VycmVudDogTm9kZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50Py5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZXMucHVzaChjdXJyZW50KTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY3VycmVudC5jaGlsZHJlbiA/PyBbXSkge1xuICAgICAgICAgICAgICAgIHZpc2l0KGNoaWxkIGFzIE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2aXNpdChub2RlKTtcbiAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cblxuICAgIGhhc0FjdGl2ZVJlY29yZGluZ0Zvck5vZGVzKG5vZGVzOiBOb2RlW10pOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIG5vZGVzLnNvbWUobm9kZSA9PiBTZXJ2aWNlLlVuZG8/Lmhhc0FjdGl2ZVJlY29yZGluZz8uKG5vZGUudXVpZCkpO1xuICAgIH1cblxuICAgIGZpbmRTbmFwc2hvdE5vZGVzKHNuYXBzaG90czogTWFwPHN0cmluZywgSU5vZGVTbmFwc2hvdD4pOiBOb2RlW10ge1xuICAgICAgICBjb25zdCBub2RlczogTm9kZVtdID0gW107XG4gICAgICAgIGZvciAoY29uc3Qgc25hcHNob3Qgb2Ygc25hcHNob3RzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fZmluZFNuYXBzaG90Tm9kZShzbmFwc2hvdCk7XG4gICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH1cblxuICAgIGNhcHR1cmVSZXBhcmVudFNuYXBzaG90cyhub2RlczogTm9kZVtdKTogTWFwPHN0cmluZywgSU5vZGVSZXBhcmVudFNuYXBzaG90PiB7XG4gICAgICAgIGNvbnN0IHNuYXBzaG90cyA9IG5ldyBNYXA8c3RyaW5nLCBJTm9kZVJlcGFyZW50U25hcHNob3Q+KCk7XG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgICAgICAgaWYgKCFub2RlPy5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudCBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgICAgIHNuYXBzaG90cy5zZXQobm9kZS51dWlkLCB7XG4gICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgIHBhdGg6IE5vZGVNZ3IuZ2V0Tm9kZVBhdGgobm9kZSkgPz8gJycsXG4gICAgICAgICAgICAgICAgZHVtcDogdGhpcy5fY2xvbmVTbmFwc2hvdER1bXAoZHVtcFV0aWwuZHVtcE5vZGUobm9kZSkpLFxuICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IHBhcmVudD8udXVpZCA/PyBudWxsLFxuICAgICAgICAgICAgICAgIHBhcmVudFBhdGg6IHBhcmVudCA/IChOb2RlTWdyLmdldE5vZGVQYXRoKHBhcmVudCkgPz8gJy8nKSA6ICcvJyxcbiAgICAgICAgICAgICAgICBzaWJsaW5nSW5kZXg6IG5vZGUuZ2V0U2libGluZ0luZGV4KCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc25hcHNob3RzO1xuICAgIH1cblxuICAgIHJlY29yZFJlcGFyZW50U25hcHNob3RzKFxuICAgICAgICB0eXBlOiBzdHJpbmcsXG4gICAgICAgIGxhYmVsOiBzdHJpbmcsXG4gICAgICAgIGJlZm9yZTogTWFwPHN0cmluZywgSU5vZGVSZXBhcmVudFNuYXBzaG90PiB8IG51bGwsXG4gICAgICAgIGNoYW5nZWRVdWlkczogc3RyaW5nW10sXG4gICAgKTogdm9pZCB7XG4gICAgICAgIGlmICghYmVmb3JlIHx8IGNoYW5nZWRVdWlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhZnRlck5vZGVzID0gY2hhbmdlZFV1aWRzXG4gICAgICAgICAgICAubWFwKHV1aWQgPT4gTm9kZU1nci5nZXROb2RlKHV1aWQpIGFzIE5vZGUgfCBudWxsKVxuICAgICAgICAgICAgLmZpbHRlcigobm9kZSk6IG5vZGUgaXMgTm9kZSA9PiAhIW5vZGU/LmlzVmFsaWQpO1xuICAgICAgICBjb25zdCBhZnRlciA9IHRoaXMuY2FwdHVyZVJlcGFyZW50U25hcHNob3RzKGFmdGVyTm9kZXMpO1xuICAgICAgICBpZiAodGhpcy5zbmFwc2hvdE1hcHNFcXVhbChiZWZvcmUsIGFmdGVyKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChuZXcgU25hcHNob3RDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9jcmVhdGVVbmRvU25hcHNob3RJZCh0eXBlKSxcbiAgICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIHNjb3BlOiB7IGVkaXRvclR5cGU6ICdzY2VuZScgfSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgfSwgYmVmb3JlLCBhZnRlciwgdGhpcy5fY3JlYXRlUmVwYXJlbnRTbmFwc2hvdEFkYXB0ZXIoKSkpO1xuICAgIH1cblxuICAgIHB1c2hOb2RlU25hcHNob3RDb21tYW5kKFxuICAgICAgICB0eXBlOiBzdHJpbmcsXG4gICAgICAgIGxhYmVsOiBzdHJpbmcsXG4gICAgICAgIGJlZm9yZTogTWFwPHN0cmluZywgSU5vZGVTbmFwc2hvdD4sXG4gICAgICAgIGFmdGVyOiBNYXA8c3RyaW5nLCBJTm9kZVNuYXBzaG90PixcbiAgICAgICAgc2NvcGU6IElVbmRvU2NvcGUgPSB7IGVkaXRvclR5cGU6ICdzY2VuZScgfSxcbiAgICApOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuc25hcHNob3RNYXBzRXF1YWwoYmVmb3JlLCBhZnRlcikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChuZXcgU25hcHNob3RDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9jcmVhdGVVbmRvU25hcHNob3RJZCh0eXBlKSxcbiAgICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIHNjb3BlLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICB9LCBiZWZvcmUsIGFmdGVyLCB0aGlzLl9jcmVhdGVOb2RlU25hcHNob3RBZGFwdGVyKCkpKTtcbiAgICB9XG5cbiAgICBhc3luYyBtb3ZlQXJyYXlFbGVtZW50QnlVdWlkKHV1aWQ6IHN0cmluZywgcGF0aDogc3RyaW5nLCB0YXJnZXQ6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFBhdGggPSBwYXRoLnJlcGxhY2UoJ19fY29tcHNfXycsICdfY29tcG9uZW50cycpO1xuICAgICAgICBpZiAobm9ybWFsaXplZFBhdGggPT09ICdjaGlsZHJlbicpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1vdmVDaGlsZEFycmF5RWxlbWVudEJ5VXVpZCh1dWlkLCBwYXRoLCB0YXJnZXQsIG9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWRQYXRoID09PSAnX2NvbXBvbmVudHMnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW92ZUNvbXBvbmVudEFycmF5RWxlbWVudEJ5VXVpZCh1dWlkLCBwYXRoLCB0YXJnZXQsIG9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZU1nci5tb3ZlQXJyYXlFbGVtZW50KHV1aWQsIHBhdGgsIHRhcmdldCwgb2Zmc2V0KTtcbiAgICB9XG5cbiAgICBhc3luYyBtb3ZlQ2hpbGRBcnJheUVsZW1lbnRCeVV1aWQodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHRhcmdldDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBub2RlID0gTm9kZU1nci5nZXROb2RlKHV1aWQpIGFzIE5vZGUgfCBudWxsO1xuICAgICAgICBpZiAoIW5vZGU/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF0aCAhPT0gJ2NoaWxkcmVuJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlLm1vdmVBcnJheUVsZW1lbnQgY3VycmVudGx5IHN1cHBvcnRzIHVuZG8gcmVjb3JkaW5nIG9ubHkgZm9yIHBhdGg9XCJjaGlsZHJlblwiJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBTZXJ2aWNlLlVuZG8/LmlzQXBwbHlpbmc/LigpIHx8XG4gICAgICAgICAgICBTZXJ2aWNlLlVuZG8/Lmhhc0FjdGl2ZVJlY29yZGluZz8uKG5vZGUudXVpZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZU1nci5tb3ZlQXJyYXlFbGVtZW50KG5vZGUudXVpZCwgcGF0aCwgdGFyZ2V0LCBvZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5fY2FwdHVyZUNoaWxkT3JkZXJTbmFwc2hvdChub2RlKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbm9kZU1nci5tb3ZlQXJyYXlFbGVtZW50KG5vZGUudXVpZCwgcGF0aCwgdGFyZ2V0LCBvZmZzZXQpO1xuICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXRlc3ROb2RlID0gTm9kZU1nci5nZXROb2RlKHV1aWQpIGFzIE5vZGUgfCBudWxsO1xuICAgICAgICBpZiAoIWxhdGVzdE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWZ0ZXIgPSB0aGlzLl9jYXB0dXJlQ2hpbGRPcmRlclNuYXBzaG90KGxhdGVzdE5vZGUpO1xuICAgICAgICBpZiAoIXRoaXMuc25hcHNob3RNYXBzRXF1YWwoYmVmb3JlLCBhZnRlcikpIHtcbiAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChuZXcgU25hcHNob3RDb21tYW5kKHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5fY3JlYXRlVW5kb1NuYXBzaG90SWQoJ25vZGU6bW92ZS1hcnJheS1lbGVtZW50JyksXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdNb3ZlIEFycmF5IEVsZW1lbnQnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdub2RlOm1vdmUtYXJyYXktZWxlbWVudCcsXG4gICAgICAgICAgICAgICAgc2NvcGU6IHsgZWRpdG9yVHlwZTogJ3NjZW5lJyB9LFxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIH0sIGJlZm9yZSwgYWZ0ZXIsIHRoaXMuX2NyZWF0ZUNoaWxkT3JkZXJTbmFwc2hvdEFkYXB0ZXIoKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfbW92ZUNvbXBvbmVudEFycmF5RWxlbWVudEJ5VXVpZCh1dWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgdGFyZ2V0OiBudW1iZXIsIG9mZnNldDogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBOb2RlTWdyLmdldE5vZGUodXVpZCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgIGlmICghbm9kZT8uaXNWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgU2VydmljZS5VbmRvPy5pc0FwcGx5aW5nPy4oKSB8fFxuICAgICAgICAgICAgU2VydmljZS5VbmRvPy5oYXNBY3RpdmVSZWNvcmRpbmc/Lihub2RlLnV1aWQpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVNZ3IubW92ZUFycmF5RWxlbWVudChub2RlLnV1aWQsIHBhdGgsIHRhcmdldCwgb2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuX2NhcHR1cmVDb21wb25lbnRPcmRlclNuYXBzaG90KG5vZGUpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBub2RlTWdyLm1vdmVBcnJheUVsZW1lbnQobm9kZS51dWlkLCBwYXRoLCB0YXJnZXQsIG9mZnNldCk7XG4gICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxhdGVzdE5vZGUgPSBOb2RlTWdyLmdldE5vZGUodXVpZCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgIGlmICghbGF0ZXN0Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhZnRlciA9IHRoaXMuX2NhcHR1cmVDb21wb25lbnRPcmRlclNuYXBzaG90KGxhdGVzdE5vZGUpO1xuICAgICAgICBpZiAoIXRoaXMuc25hcHNob3RNYXBzRXF1YWwoYmVmb3JlLCBhZnRlcikpIHtcbiAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8ucHVzaChuZXcgU25hcHNob3RDb21tYW5kKHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5fY3JlYXRlVW5kb1NuYXBzaG90SWQoJ25vZGU6bW92ZS1hcnJheS1lbGVtZW50JyksXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdNb3ZlIEFycmF5IEVsZW1lbnQnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdub2RlOm1vdmUtYXJyYXktZWxlbWVudCcsXG4gICAgICAgICAgICAgICAgc2NvcGU6IHsgZWRpdG9yVHlwZTogJ3NjZW5lJyB9LFxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIH0sIGJlZm9yZSwgYWZ0ZXIsIHRoaXMuX2NyZWF0ZUNvbXBvbmVudE9yZGVyU25hcHNob3RBZGFwdGVyKCkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGRlZHVwZU5vZGVzKG5vZGVzOiBOb2RlW10pOiBOb2RlW10ge1xuICAgICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogTm9kZVtdID0gW107XG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgICAgICAgaWYgKCFub2RlPy5pc1ZhbGlkIHx8IHNlZW4uaGFzKG5vZGUudXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlZW4uYWRkKG5vZGUudXVpZCk7XG4gICAgICAgICAgICByZXN1bHQucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHNuYXBzaG90TWFwc0VxdWFsKGJlZm9yZTogTWFwPHN0cmluZywgYW55PiwgYWZ0ZXI6IE1hcDxzdHJpbmcsIGFueT4pOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHNuYXBzaG90TWFwc0VxdWFsKGJlZm9yZSwgYWZ0ZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFByZWZlcnJlZE5ld1Jvb3ROb2RlcyhiZWZvcmVOb2RlVXVpZHM6IFNldDxzdHJpbmc+LCBwYXRoczogc3RyaW5nW10pOiBJTm9kZVN0cnVjdHVyZUNhcHR1cmVUYXJnZXRbXSB7XG4gICAgICAgIGNvbnN0IHRhcmdldHM6IElOb2RlU3RydWN0dXJlQ2FwdHVyZVRhcmdldFtdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcGF0aCBvZiBwYXRocykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChwYXRoKSBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgICAgIGlmIChub2RlPy5pc1ZhbGlkICYmICFiZWZvcmVOb2RlVXVpZHMuaGFzKG5vZGUudXVpZCkgJiYgIXRhcmdldHMuc29tZSh0YXJnZXQgPT4gdGFyZ2V0Lm5vZGUgPT09IG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKHsgbm9kZSwgcGF0aCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGFyZ2V0cztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXROZXdSb290Tm9kZXMoYmVmb3JlTm9kZVV1aWRzOiBTZXQ8c3RyaW5nPik6IElOb2RlU3RydWN0dXJlQ2FwdHVyZVRhcmdldFtdIHtcbiAgICAgICAgY29uc3Qgbm9kZU1hcCA9IE5vZGVNZ3IuZ2V0Tm9kZXMoKSA/PyB7fTtcbiAgICAgICAgY29uc3QgbmV3VXVpZHMgPSBuZXcgU2V0KE9iamVjdC5rZXlzKG5vZGVNYXApLmZpbHRlcih1dWlkID0+ICFiZWZvcmVOb2RlVXVpZHMuaGFzKHV1aWQpKSk7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKG5ld1V1aWRzKVxuICAgICAgICAgICAgLm1hcCh1dWlkID0+IG5vZGVNYXBbdXVpZF0gYXMgTm9kZSB8IG51bGwpXG4gICAgICAgICAgICAuZmlsdGVyKChub2RlKTogbm9kZSBpcyBOb2RlID0+ICEhbm9kZT8uaXNWYWxpZClcbiAgICAgICAgICAgIC5tYXAobm9kZSA9PiAoeyBub2RlLCBwYXRoOiBOb2RlTWdyLmdldE5vZGVQYXRoKG5vZGUpIH0pKVxuICAgICAgICAgICAgLmZpbHRlcih0YXJnZXQgPT4gISF0YXJnZXQucGF0aClcbiAgICAgICAgICAgIC5maWx0ZXIodGFyZ2V0ID0+ICF0aGlzLl9jb250YWluc0V4aXN0aW5nTm9kZSh0YXJnZXQubm9kZSwgYmVmb3JlTm9kZVV1aWRzKSlcbiAgICAgICAgICAgIC5maWx0ZXIodGFyZ2V0ID0+ICF0YXJnZXQubm9kZS5wYXJlbnQgfHwgIW5ld1V1aWRzLmhhcyh0YXJnZXQubm9kZS5wYXJlbnQudXVpZCkpXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYS5ub2RlLmdldFNpYmxpbmdJbmRleCgpIC0gYi5ub2RlLmdldFNpYmxpbmdJbmRleCgpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRSb290U3RydWN0dXJlVGFyZ2V0cyh0YXJnZXRzOiBJTm9kZVN0cnVjdHVyZUNhcHR1cmVUYXJnZXRbXSk6IElOb2RlU3RydWN0dXJlQ2FwdHVyZVRhcmdldFtdIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldHMuZmlsdGVyKCh0YXJnZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBpZiAodGFyZ2V0cy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLm5vZGUgPT09IHRhcmdldC5ub2RlKSAhPT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gIXRhcmdldHMuc29tZShvdGhlciA9PiBvdGhlci5ub2RlICE9PSB0YXJnZXQubm9kZSAmJiB0YXJnZXQubm9kZS5pc0NoaWxkT2Yob3RoZXIubm9kZSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jb250YWluc0V4aXN0aW5nTm9kZShub2RlOiBOb2RlLCBiZWZvcmVOb2RlVXVpZHM6IFNldDxzdHJpbmc+KTogYm9vbGVhbiB7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbiA/PyBbXSkge1xuICAgICAgICAgICAgaWYgKGJlZm9yZU5vZGVVdWlkcy5oYXMoY2hpbGQudXVpZCkgfHwgdGhpcy5fY29udGFpbnNFeGlzdGluZ05vZGUoY2hpbGQgYXMgTm9kZSwgYmVmb3JlTm9kZVV1aWRzKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jYXB0dXJlQ2hpbGRPcmRlclNuYXBzaG90KHBhcmVudDogTm9kZSk6IE1hcDxzdHJpbmcsIElOb2RlQ2hpbGRPcmRlclNuYXBzaG90PiB7XG4gICAgICAgIGNvbnN0IHNuYXBzaG90cyA9IG5ldyBNYXA8c3RyaW5nLCBJTm9kZUNoaWxkT3JkZXJTbmFwc2hvdD4oKTtcbiAgICAgICAgaWYgKCFwYXJlbnQ/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzbmFwc2hvdHM7XG4gICAgICAgIH1cbiAgICAgICAgc25hcHNob3RzLnNldChwYXJlbnQudXVpZCwge1xuICAgICAgICAgICAgcGFyZW50VXVpZDogcGFyZW50LnV1aWQsXG4gICAgICAgICAgICBwYXJlbnRQYXRoOiBOb2RlTWdyLmdldE5vZGVQYXRoKHBhcmVudCkgPz8gJy8nLFxuICAgICAgICAgICAgY2hpbGRVdWlkczogcGFyZW50LmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC51dWlkKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzbmFwc2hvdHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY3JlYXRlQ2hpbGRPcmRlclNuYXBzaG90QWRhcHRlcigpOiBJU25hcHNob3RBZGFwdGVyIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNhcHR1cmU6IGFzeW5jICgpID0+IG5ldyBNYXAoKSxcbiAgICAgICAgICAgIGFwcGx5OiBhc3luYyAoZGF0YTogTWFwPHN0cmluZywgSU5vZGVDaGlsZE9yZGVyU25hcHNob3Q+KSA9PiB0aGlzLl9hcHBseUNoaWxkT3JkZXJTbmFwc2hvdHMoZGF0YSksXG4gICAgICAgICAgICBlcXVhbHM6IChiZWZvcmU6IE1hcDxzdHJpbmcsIElOb2RlQ2hpbGRPcmRlclNuYXBzaG90PiwgYWZ0ZXI6IE1hcDxzdHJpbmcsIElOb2RlQ2hpbGRPcmRlclNuYXBzaG90PikgPT4gdGhpcy5zbmFwc2hvdE1hcHNFcXVhbChiZWZvcmUsIGFmdGVyKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9hcHBseUNoaWxkT3JkZXJTbmFwc2hvdHMoZGF0YTogTWFwPHN0cmluZywgSU5vZGVDaGlsZE9yZGVyU25hcHNob3Q+KTogUHJvbWlzZTxJVW5kb1JlZG9SZXN1bHQ+IHtcbiAgICAgICAgZm9yIChjb25zdCBzbmFwc2hvdCBvZiBkYXRhLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9hcHBseUNoaWxkT3JkZXJTbmFwc2hvdChzbmFwc2hvdCk7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfYXBwbHlDaGlsZE9yZGVyU25hcHNob3Qoc25hcHNob3Q6IElOb2RlQ2hpbGRPcmRlclNuYXBzaG90KTogSVVuZG9SZWRvUmVzdWx0IHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fZmluZENoaWxkT3JkZXJQYXJlbnQoc25hcHNob3QpO1xuICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogYFBhcmVudCBub2RlIG5vdCBmb3VuZDogJHtzbmFwc2hvdC5wYXJlbnRQYXRoIHx8IHNuYXBzaG90LnBhcmVudFV1aWR9YCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuX2VtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIHBhcmVudCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgc25hcHNob3QuY2hpbGRVdWlkcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IE5vZGVNZ3IuZ2V0Tm9kZShzbmFwc2hvdC5jaGlsZFV1aWRzW2luZGV4XSkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFjaGlsZD8uaXNWYWxpZCB8fCBjaGlsZC5wYXJlbnQgIT09IHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBgQ2hpbGQgbm9kZSBub3QgZm91bmQ6ICR7c25hcHNob3QuY2hpbGRVdWlkc1tpbmRleF19YCB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjaGlsZC5zZXRTaWJsaW5nSW5kZXgoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZW1pdCgnbm9kZTpjaGFuZ2UnLCBwYXJlbnQsIHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6ICd1bmRvJyxcbiAgICAgICAgICAgICAgICB0eXBlOiBOb2RlRXZlbnRUeXBlLk1PVkVfQVJSQVlfRUxFTUVOVCxcbiAgICAgICAgICAgICAgICBwcm9wUGF0aDogJ2NoaWxkcmVuJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9maW5kQ2hpbGRPcmRlclBhcmVudChzbmFwc2hvdDogSU5vZGVDaGlsZE9yZGVyU25hcHNob3QpOiBOb2RlIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGJ5VXVpZCA9IE5vZGVNZ3IuZ2V0Tm9kZShzbmFwc2hvdC5wYXJlbnRVdWlkKSBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgaWYgKGJ5VXVpZD8uaXNWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJ5VXVpZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc25hcHNob3QucGFyZW50UGF0aCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBieVBhdGggPSBpc1Jvb3ROb2RlUGF0aChzbmFwc2hvdC5wYXJlbnRQYXRoKVxuICAgICAgICAgICAgICAgICAgICA/IFNlcnZpY2UuRWRpdG9yLmdldFJvb3ROb2RlKCkgYXMgTm9kZSB8IG51bGxcbiAgICAgICAgICAgICAgICAgICAgOiBOb2RlTWdyLmdldE5vZGVCeVBhdGgoc25hcHNob3QucGFyZW50UGF0aCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ5UGF0aD8uaXNWYWxpZCA/IGJ5UGF0aCA6IG51bGw7XG4gICAgICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jYXB0dXJlQ29tcG9uZW50T3JkZXJTbmFwc2hvdChub2RlOiBOb2RlKTogTWFwPHN0cmluZywgSUNvbXBvbmVudE9yZGVyU25hcHNob3Q+IHtcbiAgICAgICAgY29uc3Qgc25hcHNob3RzID0gbmV3IE1hcDxzdHJpbmcsIElDb21wb25lbnRPcmRlclNuYXBzaG90PigpO1xuICAgICAgICBpZiAoIW5vZGU/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzbmFwc2hvdHM7XG4gICAgICAgIH1cbiAgICAgICAgc25hcHNob3RzLnNldChub2RlLnV1aWQsIHtcbiAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICBub2RlUGF0aDogTm9kZU1nci5nZXROb2RlUGF0aChub2RlKSA/PyAnJyxcbiAgICAgICAgICAgIGNvbXBvbmVudFV1aWRzOiBub2RlLmNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PiBjb21wb25lbnQudXVpZCksXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc25hcHNob3RzO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZUNvbXBvbmVudE9yZGVyU25hcHNob3RBZGFwdGVyKCk6IElTbmFwc2hvdEFkYXB0ZXIge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2FwdHVyZTogYXN5bmMgKCkgPT4gbmV3IE1hcCgpLFxuICAgICAgICAgICAgYXBwbHk6IGFzeW5jIChkYXRhOiBNYXA8c3RyaW5nLCBJQ29tcG9uZW50T3JkZXJTbmFwc2hvdD4pID0+IHRoaXMuX2FwcGx5Q29tcG9uZW50T3JkZXJTbmFwc2hvdHMoZGF0YSksXG4gICAgICAgICAgICBlcXVhbHM6IChiZWZvcmU6IE1hcDxzdHJpbmcsIElDb21wb25lbnRPcmRlclNuYXBzaG90PiwgYWZ0ZXI6IE1hcDxzdHJpbmcsIElDb21wb25lbnRPcmRlclNuYXBzaG90PikgPT4gdGhpcy5zbmFwc2hvdE1hcHNFcXVhbChiZWZvcmUsIGFmdGVyKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9hcHBseUNvbXBvbmVudE9yZGVyU25hcHNob3RzKGRhdGE6IE1hcDxzdHJpbmcsIElDb21wb25lbnRPcmRlclNuYXBzaG90Pik6IFByb21pc2U8SVVuZG9SZWRvUmVzdWx0PiB7XG4gICAgICAgIGZvciAoY29uc3Qgc25hcHNob3Qgb2YgZGF0YS52YWx1ZXMoKSkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fYXBwbHlDb21wb25lbnRPcmRlclNuYXBzaG90KHNuYXBzaG90KTtcbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9hcHBseUNvbXBvbmVudE9yZGVyU25hcHNob3Qoc25hcHNob3Q6IElDb21wb25lbnRPcmRlclNuYXBzaG90KTogSVVuZG9SZWRvUmVzdWx0IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX2ZpbmRDb21wb25lbnRPcmRlck5vZGUoc25hcHNob3QpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IGBOb2RlIG5vdCBmb3VuZDogJHtzbmFwc2hvdC5ub2RlUGF0aCB8fCBzbmFwc2hvdC5ub2RlVXVpZH1gIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gKG5vZGUgYXMgYW55KS5fY29tcG9uZW50cyBhcyBDb21wb25lbnRbXSB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKCFjb21wb25lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBgTm9kZSBjb21wb25lbnRzIG5vdCBmb3VuZDogJHtzbmFwc2hvdC5ub2RlUGF0aCB8fCBzbmFwc2hvdC5ub2RlVXVpZH1gIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wb25lbnRCeVV1aWQgPSBuZXcgTWFwKGNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PiBbY29tcG9uZW50LnV1aWQsIGNvbXBvbmVudF0pKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZENvbXBvbmVudHM6IENvbXBvbmVudFtdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBzbmFwc2hvdC5jb21wb25lbnRVdWlkcykge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50QnlVdWlkLmdldCh1dWlkKTtcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50Py5pc1ZhbGlkIHx8IGNvbXBvbmVudC5ub2RlICE9PSBub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogYENvbXBvbmVudCBub3QgZm91bmQ6ICR7dXVpZH1gIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcmRlcmVkQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wb25lbnRVdWlkU2V0ID0gbmV3IFNldChzbmFwc2hvdC5jb21wb25lbnRVdWlkcyk7XG4gICAgICAgIGNvbnN0IGV4dHJhQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuZmlsdGVyKGNvbXBvbmVudCA9PiAhY29tcG9uZW50VXVpZFNldC5oYXMoY29tcG9uZW50LnV1aWQpKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5fZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgbm9kZSk7XG4gICAgICAgICAgICBjb21wb25lbnRzLnNwbGljZSgwLCBjb21wb25lbnRzLmxlbmd0aCwgLi4ub3JkZXJlZENvbXBvbmVudHMsIC4uLmV4dHJhQ29tcG9uZW50cyk7XG4gICAgICAgICAgICB0aGlzLl9lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6ICd1bmRvJyxcbiAgICAgICAgICAgICAgICB0eXBlOiBOb2RlRXZlbnRUeXBlLk1PVkVfQVJSQVlfRUxFTUVOVCxcbiAgICAgICAgICAgICAgICBwcm9wUGF0aDogJ19fY29tcHNfXycsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZmluZENvbXBvbmVudE9yZGVyTm9kZShzbmFwc2hvdDogSUNvbXBvbmVudE9yZGVyU25hcHNob3QpOiBOb2RlIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGJ5VXVpZCA9IE5vZGVNZ3IuZ2V0Tm9kZShzbmFwc2hvdC5ub2RlVXVpZCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgIGlmIChieVV1aWQ/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBieVV1aWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNuYXBzaG90Lm5vZGVQYXRoKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ5UGF0aCA9IE5vZGVNZ3IuZ2V0Tm9kZUJ5UGF0aChzbmFwc2hvdC5ub2RlUGF0aCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ5UGF0aD8uaXNWYWxpZCA/IGJ5UGF0aCA6IG51bGw7XG4gICAgICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVSZXBhcmVudFNuYXBzaG90QWRhcHRlcigpOiBJU25hcHNob3RBZGFwdGVyIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNhcHR1cmU6IGFzeW5jICh1dWlkczogc3RyaW5nW10pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9IHV1aWRzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAodXVpZCA9PiBOb2RlTWdyLmdldE5vZGUodXVpZCkgYXMgTm9kZSB8IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKG5vZGUpOiBub2RlIGlzIE5vZGUgPT4gISFub2RlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jYXB0dXJlUmVwYXJlbnRTbmFwc2hvdHMobm9kZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFwcGx5OiBhc3luYyAoZGF0YTogTWFwPHN0cmluZywgSU5vZGVSZXBhcmVudFNuYXBzaG90PikgPT4gdGhpcy5fYXBwbHlSZXBhcmVudFNuYXBzaG90cyhkYXRhKSxcbiAgICAgICAgICAgIGVxdWFsczogKGJlZm9yZTogTWFwPHN0cmluZywgSU5vZGVSZXBhcmVudFNuYXBzaG90PiwgYWZ0ZXI6IE1hcDxzdHJpbmcsIElOb2RlUmVwYXJlbnRTbmFwc2hvdD4pID0+IHRoaXMuc25hcHNob3RNYXBzRXF1YWwoYmVmb3JlLCBhZnRlciksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfYXBwbHlSZXBhcmVudFNuYXBzaG90cyhkYXRhOiBNYXA8c3RyaW5nLCBJTm9kZVJlcGFyZW50U25hcHNob3Q+KTogUHJvbWlzZTxJVW5kb1JlZG9SZXN1bHQ+IHtcbiAgICAgICAgY29uc3Qgc25hcHNob3RzID0gWy4uLmRhdGEudmFsdWVzKCldLnNvcnQoKGEsIGIpID0+IGEuc2libGluZ0luZGV4IC0gYi5zaWJsaW5nSW5kZXgpO1xuICAgICAgICBmb3IgKGNvbnN0IHNuYXBzaG90IG9mIHNuYXBzaG90cykge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5fYXBwbHlSZXBhcmVudFNuYXBzaG90KHNuYXBzaG90KTtcbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9hcHBseVJlcGFyZW50U25hcHNob3Qoc25hcHNob3Q6IElOb2RlUmVwYXJlbnRTbmFwc2hvdCk6IFByb21pc2U8SVVuZG9SZWRvUmVzdWx0PiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9maW5kU25hcHNob3ROb2RlKHNuYXBzaG90KTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBgTm9kZSBub3QgZm91bmQ6ICR7c25hcHNob3QucGF0aCB8fCBzbmFwc2hvdC51dWlkfWAgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9maW5kUmVwYXJlbnRQYXJlbnQoc25hcHNob3QpO1xuICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogYFBhcmVudCBub2RlIG5vdCBmb3VuZDogJHtzbmFwc2hvdC5wYXJlbnRQYXRoIHx8IHNuYXBzaG90LnBhcmVudFV1aWQgfHwgJy8nfWAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBvbGRQYXJlbnQgPSBub2RlLnBhcmVudCBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgICAgIGlmIChvbGRQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBvbGRQYXJlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gb2xkUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgcGFyZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2VtaXQoJ25vZGU6YmVmb3JlLWNoYW5nZScsIG5vZGUpO1xuXG4gICAgICAgICAgICBub2RlLnNldFBhcmVudChwYXJlbnQsIGZhbHNlKTtcbiAgICAgICAgICAgIGlmIChzbmFwc2hvdC5zaWJsaW5nSW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgIG5vZGUuc2V0U2libGluZ0luZGV4KHNuYXBzaG90LnNpYmxpbmdJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9yZXN0b3JlTm9kZVNuYXBzaG90RHVtcChub2RlLCBzbmFwc2hvdC5kdW1wKTtcblxuICAgICAgICAgICAgaWYgKG9sZFBhcmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VtaXQoJ25vZGU6Y2hhbmdlJywgb2xkUGFyZW50LCB7IHNvdXJjZTogJ3VuZG8nLCB0eXBlOiBOb2RlRXZlbnRUeXBlLkNISUxEX0NIQU5HRUQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSBvbGRQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbWl0KCdub2RlOmNoYW5nZScsIHBhcmVudCwgeyBzb3VyY2U6ICd1bmRvJywgdHlwZTogTm9kZUV2ZW50VHlwZS5DSElMRF9DSEFOR0VEIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCB7IHNvdXJjZTogJ3VuZG8nLCB0eXBlOiBOb2RlRXZlbnRUeXBlLlBBUkVOVF9DSEFOR0VEIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9maW5kUmVwYXJlbnRQYXJlbnQoc25hcHNob3Q6IElOb2RlUmVwYXJlbnRTbmFwc2hvdCk6IE5vZGUgfCBudWxsIHtcbiAgICAgICAgaWYgKHNuYXBzaG90LnBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ5VXVpZCA9IE5vZGVNZ3IuZ2V0Tm9kZShzbmFwc2hvdC5wYXJlbnRVdWlkKSBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgICAgIGlmIChieVV1aWQ/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYnlVdWlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzbmFwc2hvdC5wYXJlbnRQYXRoICYmICFpc1Jvb3ROb2RlUGF0aChzbmFwc2hvdC5wYXJlbnRQYXRoKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBieVBhdGggPSBOb2RlTWdyLmdldE5vZGVCeVBhdGgoc25hcHNob3QucGFyZW50UGF0aCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGJ5UGF0aD8uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYnlQYXRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTZXJ2aWNlLkVkaXRvci5nZXRSb290Tm9kZSgpIGFzIE5vZGUgfCBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZU5vZGVTbmFwc2hvdEFkYXB0ZXIoKTogSVNuYXBzaG90QWRhcHRlciB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYXB0dXJlOiBhc3luYyAodXVpZHM6IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSB1dWlkc1xuICAgICAgICAgICAgICAgICAgICAubWFwKHV1aWQgPT4gTm9kZU1nci5nZXROb2RlKHV1aWQpIGFzIE5vZGUgfCBudWxsKVxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChub2RlKTogbm9kZSBpcyBOb2RlID0+ICEhbm9kZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FwdHVyZU5vZGVTbmFwc2hvdHMobm9kZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFwcGx5OiBhc3luYyAoZGF0YTogTWFwPHN0cmluZywgSU5vZGVTbmFwc2hvdD4pID0+IHRoaXMuX2FwcGx5Tm9kZVNuYXBzaG90cyhkYXRhKSxcbiAgICAgICAgICAgIGVxdWFsczogKGJlZm9yZTogTWFwPHN0cmluZywgSU5vZGVTbmFwc2hvdD4sIGFmdGVyOiBNYXA8c3RyaW5nLCBJTm9kZVNuYXBzaG90PikgPT4gdGhpcy5zbmFwc2hvdE1hcHNFcXVhbChiZWZvcmUsIGFmdGVyKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9hcHBseU5vZGVTbmFwc2hvdHMoZGF0YTogTWFwPHN0cmluZywgSU5vZGVTbmFwc2hvdD4pOiBQcm9taXNlPElVbmRvUmVkb1Jlc3VsdD4ge1xuICAgICAgICBmb3IgKGNvbnN0IHNuYXBzaG90IG9mIGRhdGEudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX2FwcGx5Tm9kZVNuYXBzaG90KHNuYXBzaG90KTtcbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9hcHBseU5vZGVTbmFwc2hvdChzbmFwc2hvdDogSU5vZGVTbmFwc2hvdCk6IFByb21pc2U8SVVuZG9SZWRvUmVzdWx0PiB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9maW5kU25hcHNob3ROb2RlKHNuYXBzaG90KTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBgTm9kZSBub3QgZm91bmQ6ICR7c25hcHNob3QucGF0aCB8fCBzbmFwc2hvdC51dWlkfWAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLl9lbWl0KCdub2RlOmJlZm9yZS1jaGFuZ2UnLCBub2RlKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Jlc3RvcmVOb2RlU25hcHNob3REdW1wKG5vZGUsIHNuYXBzaG90LmR1bXApO1xuICAgICAgICAgICAgdGhpcy5fZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCB7IHNvdXJjZTogJ3VuZG8nLCB0eXBlOiBOb2RlRXZlbnRUeXBlLlNFVF9QUk9QRVJUWSB9KTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVzdG9yZU5vZGVTbmFwc2hvdER1bXAobm9kZTogTm9kZSwgZHVtcDogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHJlc3RvcmVOb2RlU25hcHNob3REdW1wKG5vZGUsIGR1bXAsIHtcbiAgICAgICAgICAgIHVwZGF0ZU5vZGVOYW1lOiAodXVpZCwgbmFtZSkgPT4gTm9kZU1nci51cGRhdGVOb2RlTmFtZSh1dWlkLCBuYW1lKSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZmluZFNuYXBzaG90Tm9kZShzbmFwc2hvdDogSU5vZGVTbmFwc2hvdCk6IE5vZGUgfCBudWxsIHtcbiAgICAgICAgY29uc3Qgbm9kZUJ5VXVpZCA9IE5vZGVNZ3IuZ2V0Tm9kZShzbmFwc2hvdC51dWlkKSBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgaWYgKG5vZGVCeVV1aWQ/LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlQnlVdWlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzbmFwc2hvdC5wYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlQnlQYXRoID0gTm9kZU1nci5nZXROb2RlQnlQYXRoKHNuYXBzaG90LnBhdGgpIGFzIE5vZGUgfCBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVCeVBhdGg/LmlzVmFsaWQgPyBub2RlQnlQYXRoIDogbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jbG9uZVNuYXBzaG90RHVtcDxUPihkdW1wOiBUKTogVCB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGR1bXApKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVVbmRvU25hcHNob3RJZChwcmVmaXg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBjcmVhdGVVbmRvSWQocHJlZml4KTtcbiAgICB9XG59XG4iXX0=