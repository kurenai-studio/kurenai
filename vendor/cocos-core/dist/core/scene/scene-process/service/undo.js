"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndoService = void 0;
const core_1 = require("./core");
const decorator_1 = require("./core/decorator");
const scene_undo_manager_1 = require("./undo/scene-undo-manager");
const common_1 = require("../../common");
const global_events_1 = require("./core/global-events");
const command_utils_shared_1 = require("./undo/commands/command-utils-shared");
const dump_1 = __importDefault(require("./dump"));
let UndoService = class UndoService extends core_1.BaseService {
    _undoMgr;
    constructor() {
        super();
        this._undoMgr = new scene_undo_manager_1.SceneUndoManager({
            snapshotAdapter: this._createSceneSnapshotAdapter(),
        });
    }
    beginRecording(uuids, options) {
        return this._undoMgr.beginRecording(uuids, options);
    }
    async endRecording(commandId) {
        const wasDirty = this._undoMgr.isDirty();
        const pushed = await this._undoMgr.endRecording(commandId);
        this._emitDirtyIfChanged(wasDirty);
        if (pushed) {
            this.broadcast('undo:changed');
        }
    }
    cancelRecording(commandId) {
        const wasDirty = this._undoMgr.isDirty();
        this._undoMgr.cancelRecording(commandId);
        this._emitDirtyIfChanged(wasDirty);
    }
    async undo(options) {
        const wasDirty = this._undoMgr.isDirty();
        const result = await this._undoMgr.undo(options);
        if (result.success) {
            try {
                const { Service } = require('./core/decorator');
                Service.Engine?.repaintInEditMode?.();
            }
            catch (e) {
                // Engine 可能还没初始化完成。
            }
            this._emitDirtyIfChanged(wasDirty);
        }
        this.broadcast('undo:changed');
        return result;
    }
    async redo(options) {
        const wasDirty = this._undoMgr.isDirty();
        const result = await this._undoMgr.redo(options);
        if (result.success) {
            try {
                const { Service } = require('./core/decorator');
                Service.Engine?.repaintInEditMode?.();
            }
            catch (e) {
                // Engine 可能还没初始化完成。
            }
            this._emitDirtyIfChanged(wasDirty);
        }
        this.broadcast('undo:changed');
        return result;
    }
    reset() {
        this.clearHistory();
    }
    clearHistory() {
        const wasDirty = this._undoMgr.isDirty();
        const hadUndoState = this._undoMgr.canUndo() ||
            this._undoMgr.canRedo() ||
            this._undoMgr.isGroupActive() ||
            this._undoMgr.hasActiveRecording();
        this._undoMgr.reset();
        this._emitDirtyIfChanged(wasDirty);
        if (hadUndoState) {
            this.broadcast('undo:changed');
        }
    }
    isDirty() {
        return this._undoMgr.isDirty();
    }
    createCheckpoint() {
        return this._undoMgr.createCheckpoint();
    }
    hasScopedDifference(checkpoint, scope) {
        return this._undoMgr.hasScopedDifference(checkpoint, scope);
    }
    hasScopedDifferenceAfterCheckpoint(checkpoint, scope) {
        return this._undoMgr.hasScopedDifferenceAfterCheckpoint(checkpoint, scope);
    }
    async discardScopedChangesAfterCheckpoint(checkpoint, scope) {
        const wasDirty = this._undoMgr.isDirty();
        const result = await this._undoMgr.discardScopedChangesAfterCheckpoint(checkpoint, scope);
        if (result.success) {
            this._emitDirtyIfChanged(wasDirty);
        }
        this.broadcast('undo:changed');
        return result;
    }
    hasDifferenceOutsideScope(checkpoint, scope) {
        return this._undoMgr.hasDifferenceOutsideScope(checkpoint, scope);
    }
    canUndo(options) {
        return this._undoMgr.canUndo(options);
    }
    canRedo(options) {
        return this._undoMgr.canRedo(options);
    }
    beginGroup(options) {
        return this._undoMgr.beginGroup(options);
    }
    endGroup(groupId) {
        const wasDirty = this._undoMgr.isDirty();
        const result = this._undoMgr.endGroup(groupId);
        this._emitDirtyIfChanged(wasDirty);
        if (result.success) {
            this.broadcast('undo:changed');
        }
        return result;
    }
    cancelGroup(groupId) {
        return this._undoMgr.cancelGroup(groupId);
    }
    isGroupActive() {
        return this._undoMgr.isGroupActive();
    }
    push(command) {
        const wasDirty = this._undoMgr.isDirty();
        this._undoMgr.push(command);
        this._emitDirtyIfChanged(wasDirty);
        this.broadcast('undo:changed');
    }
    pushWithPrevious(command, options) {
        const wasDirty = this._undoMgr.isDirty();
        this._undoMgr.pushWithPrevious(command, options);
        this._emitDirtyIfChanged(wasDirty);
        this.broadcast('undo:changed');
    }
    markSaved() {
        const wasDirty = this._undoMgr.isDirty();
        this._undoMgr.markSaved();
        this._emitDirtyIfChanged(wasDirty);
    }
    hasActiveRecording(uuid) {
        return this._undoMgr.hasActiveRecording(uuid);
    }
    isApplying() {
        return this._undoMgr.isApplying();
    }
    /** 只在 dirty 状态真正变化时广播 dirty:changed。 */
    _emitDirtyIfChanged(wasDirty) {
        const nowDirty = this._undoMgr.isDirty();
        if (wasDirty !== nowDirty) {
            this.broadcast('dirty:changed', nowDirty);
        }
    }
    _createSceneSnapshotAdapter() {
        return {
            capture: (uuids) => this._captureSceneSnapshots(uuids),
            apply: async (data) => this._applySceneSnapshots(data),
            equals: (before, after) => this._snapshotMapsEqual(before, after),
        };
    }
    _captureSceneSnapshots(uuids) {
        const snapshots = new Map();
        for (const uuid of new Set(uuids)) {
            const node = this._getEditorNodeManager()?.getNode?.(uuid);
            if (this._isNodeInCurrentScene(node)) {
                snapshots.set(`node:${uuid}`, this._captureNodeSnapshot(node));
                continue;
            }
            const component = this._getEditorComponentManager()?.getComponent?.(uuid);
            if (this._isComponentInCurrentScene(component)) {
                const snapshot = this._captureComponentSnapshot(component);
                if (snapshot) {
                    snapshots.set(`component:${uuid}`, { kind: 'component', ...snapshot });
                }
            }
        }
        return snapshots;
    }
    _captureNodeSnapshot(node) {
        return {
            kind: 'node',
            uuid: node.uuid,
            path: this._getNodePath(node),
            dump: this._cloneDump(dump_1.default.dumpNode(node, { includeComponents: false })),
            components: node.components
                .map(component => this._captureComponentSnapshot(component))
                .filter((snapshot) => !!snapshot),
        };
    }
    _captureComponentSnapshot(component) {
        if (!this._isComponentInCurrentScene(component)) {
            return null;
        }
        return {
            uuid: component.uuid,
            path: this._getComponentPath(component),
            nodeUuid: component.node.uuid,
            nodePath: this._getNodePath(component.node),
            index: component.node.components.indexOf(component),
            type: this._getComponentType(component),
            dump: this._cloneDump(dump_1.default.dumpComponent(component)),
        };
    }
    async _applySceneSnapshots(data) {
        for (const snapshot of data.values()) {
            const result = snapshot.kind === 'node'
                ? await this._applyNodeSnapshot(snapshot)
                : await this._applyComponentSnapshot(snapshot);
            if (!result.success) {
                return result;
            }
        }
        return { success: true };
    }
    async _applyNodeSnapshot(snapshot) {
        const node = this._findNode(snapshot.uuid, snapshot.path);
        if (!node) {
            return { success: false, reason: `Node not found: ${snapshot.path || snapshot.uuid}` };
        }
        try {
            global_events_1.ServiceEvents.emit('node:before-change', node);
            await this._restoreNodeDump(node, snapshot.dump);
            for (const componentSnapshot of snapshot.components) {
                const component = this._findComponent(componentSnapshot);
                if (component) {
                    await this._restoreComponentDump(component, componentSnapshot.dump);
                }
            }
            global_events_1.ServiceEvents.emit('node:change', node, {
                source: common_1.EventSourceType.UNDO,
                type: common_1.NodeEventType.SET_PROPERTY,
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, reason: error instanceof Error ? error.message : String(error) };
        }
    }
    async _applyComponentSnapshot(snapshot) {
        const component = this._findComponent(snapshot);
        if (!component) {
            return { success: false, reason: `Component not found: ${snapshot.path || snapshot.uuid}` };
        }
        try {
            await this._restoreComponentDump(component, snapshot.dump);
            global_events_1.ServiceEvents.emit('node:change', component.node, {
                source: common_1.EventSourceType.UNDO,
                type: common_1.NodeEventType.SET_PROPERTY,
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, reason: error instanceof Error ? error.message : String(error) };
        }
    }
    async _restoreNodeDump(node, dump) {
        await (0, command_utils_shared_1.restoreNodeSnapshotDump)(node, dump, {
            updateNodeName: (uuid, name) => this._getEditorNodeManager()?.updateNodeName?.(uuid, name),
        });
    }
    async _restoreComponentDump(component, dump) {
        await (0, command_utils_shared_1.restoreComponentSnapshotDump)(component, dump);
    }
    _findNode(uuid, path) {
        const byUuid = this._getEditorNodeManager()?.getNode?.(uuid);
        if (this._isNodeInCurrentScene(byUuid)) {
            return byUuid;
        }
        if (!path) {
            return null;
        }
        try {
            const byPath = this._getEditorNodeManager()?.getNodeByPath?.(path);
            return this._isNodeInCurrentScene(byPath) ? byPath : null;
        }
        catch (_error) {
            return null;
        }
    }
    _findComponent(snapshot) {
        const editorComponent = this._getEditorComponentManager();
        const byUuid = editorComponent?.getComponent?.(snapshot.uuid);
        if (this._isComponentInCurrentScene(byUuid)) {
            return byUuid;
        }
        if (snapshot.path) {
            try {
                const byPath = editorComponent?.getComponentFromPath?.(snapshot.path);
                if (this._isComponentInCurrentScene(byPath)) {
                    return byPath;
                }
            }
            catch (_error) {
                // 按路径找不到组件时，再退回到节点和组件下标查找。
            }
        }
        const node = this._findNode(snapshot.nodeUuid, snapshot.nodePath);
        const byIndex = node?.components[snapshot.index];
        if (this._isComponentInCurrentScene(byIndex) && this._getComponentType(byIndex) === snapshot.type) {
            return byIndex;
        }
        return null;
    }
    _isNodeInCurrentScene(node) {
        if (!node?.isValid) {
            return false;
        }
        const scene = cc.director?.getScene?.();
        return !!scene && (node === scene || node.isChildOf(scene));
    }
    _isComponentInCurrentScene(component) {
        return !!component?.isValid && this._isNodeInCurrentScene(component.node);
    }
    _getNodePath(node) {
        const scene = cc.director?.getScene?.();
        if (node === scene) {
            return '/';
        }
        return this._getEditorNodeManager()?.getNodePath?.(node) ?? '';
    }
    _getComponentPath(component) {
        return this._getEditorComponentManager()?.getPathFromUuid?.(component.uuid) ?? '';
    }
    _getComponentType(component) {
        return cc.js?.getClassName?.(component.constructor) || component.constructor?.name || '';
    }
    _getEditorNodeManager() {
        return this._getEditorExtends()?.Node;
    }
    _getEditorComponentManager() {
        return this._getEditorExtends()?.Component;
    }
    _getEditorExtends() {
        return cc.EditorExtends || globalThis.EditorExtends;
    }
    _snapshotMapsEqual(before, after) {
        return (0, command_utils_shared_1.snapshotMapsEqual)(before, after);
    }
    _cloneDump(dump) {
        return JSON.parse(JSON.stringify(dump));
    }
};
exports.UndoService = UndoService;
exports.UndoService = UndoService = __decorate([
    (0, decorator_1.register)('Undo'),
    __metadata("design:paramtypes", [])
], UndoService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS91bmRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlDQUFxQztBQUNyQyxnREFBNEM7QUFDNUMsa0VBQTZEO0FBQzdELHlDQUFrUztBQUVsUyx3REFBcUQ7QUFFckQsK0VBQWdJO0FBQ2hJLGtEQUE4QjtBQTJCdkIsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLGtCQUF3QjtJQUM3QyxRQUFRLENBQW1CO0lBRW5DO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUkscUNBQWdCLENBQUM7WUFDakMsZUFBZSxFQUFFLElBQUksQ0FBQywyQkFBMkIsRUFBRTtTQUN0RCxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsY0FBYyxDQUFDLEtBQWUsRUFBRSxPQUEyQjtRQUN2RCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxTQUFpQjtRQUNoQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLElBQUksTUFBTSxFQUFFLENBQUM7WUFDVCxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7SUFDTCxDQUFDO0lBRUQsZUFBZSxDQUFDLFNBQWlCO1FBQzdCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMs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QUFpQixFQUFFLEVBQUUsU0FBUyxDQUFDO0lBQy9DLENBQUM7SUFFTyxpQkFBaUI7UUFDckIsT0FBUSxFQUFVLENBQUMsYUFBYSxJQUFLLFVBQWtCLENBQUMsYUFBYSxDQUFDO0lBQzFFLENBQUM7SUFFTyxrQkFBa0IsQ0FBQyxNQUF1QyxFQUFFLEtBQXNDO1FBQ3RHLE9BQU8sSUFBQSx3Q0FBaUIsRUFBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVPLFVBQVUsQ0FBSSxJQUFPO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFNLENBQUM7SUFDakQsQ0FBQztDQUNKLENBQUE7QUFqWVksa0NBQVc7c0JBQVgsV0FBVztJQUR2QixJQUFBLG9CQUFRLEVBQUMsTUFBTSxDQUFDOztHQUNKLFdBQVcsQ0FpWXZCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZVNlcnZpY2UgfSBmcm9tICcuL2NvcmUnO1xuaW1wb3J0IHsgcmVnaXN0ZXIgfSBmcm9tICcuL2NvcmUvZGVjb3JhdG9yJztcbmltcG9ydCB7IFNjZW5lVW5kb01hbmFnZXIgfSBmcm9tICcuL3VuZG8vc2NlbmUtdW5kby1tYW5hZ2VyJztcbmltcG9ydCB7IEV2ZW50U291cmNlVHlwZSwgTm9kZUV2ZW50VHlwZSwgdHlwZSBJVW5kb1NlcnZpY2UsIHR5cGUgSVVuZG9FdmVudHMsIHR5cGUgSVVuZG9CZWdpbk9wdGlvbnMsIHR5cGUgSVVuZG9DaGVja3BvaW50LCB0eXBlIElVbmRvQ29tbWFuZCwgdHlwZSBJVW5kb0dyb3VwT3B0aW9ucywgdHlwZSBJVW5kb09wZXJhdGlvbk9wdGlvbnMsIHR5cGUgSVVuZG9QdXNoV2l0aFByZXZpb3VzT3B0aW9ucywgdHlwZSBJVW5kb1JlZG9SZXN1bHQsIHR5cGUgSVVuZG9TY29wZSB9IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudCwgTm9kZSB9IGZyb20gJ2NjJztcbmltcG9ydCB7IFNlcnZpY2VFdmVudHMgfSBmcm9tICcuL2NvcmUvZ2xvYmFsLWV2ZW50cyc7XG5pbXBvcnQgdHlwZSB7IElTbmFwc2hvdEFkYXB0ZXIgfSBmcm9tICcuL3VuZG8vY29tbWFuZHMvc25hcHNob3QtY29tbWFuZCc7XG5pbXBvcnQgeyByZXN0b3JlQ29tcG9uZW50U25hcHNob3REdW1wLCByZXN0b3JlTm9kZVNuYXBzaG90RHVtcCwgc25hcHNob3RNYXBzRXF1YWwgfSBmcm9tICcuL3VuZG8vY29tbWFuZHMvY29tbWFuZC11dGlscy1zaGFyZWQnO1xuaW1wb3J0IGR1bXBVdGlsIGZyb20gJy4vZHVtcCc7XG5cbmludGVyZmFjZSBJUmVjb3JkaW5nQ29tcG9uZW50U25hcHNob3Qge1xuICAgIHV1aWQ6IHN0cmluZztcbiAgICBwYXRoOiBzdHJpbmc7XG4gICAgbm9kZVV1aWQ6IHN0cmluZztcbiAgICBub2RlUGF0aDogc3RyaW5nO1xuICAgIGluZGV4OiBudW1iZXI7XG4gICAgdHlwZTogc3RyaW5nO1xuICAgIGR1bXA6IGFueTtcbn1cblxuaW50ZXJmYWNlIElSZWNvcmRpbmdOb2RlU25hcHNob3Qge1xuICAgIGtpbmQ6ICdub2RlJztcbiAgICB1dWlkOiBzdHJpbmc7XG4gICAgcGF0aDogc3RyaW5nO1xuICAgIGR1bXA6IGFueTtcbiAgICBjb21wb25lbnRzOiBJUmVjb3JkaW5nQ29tcG9uZW50U25hcHNob3RbXTtcbn1cblxuaW50ZXJmYWNlIElSZWNvcmRpbmdTdGFuZGFsb25lQ29tcG9uZW50U25hcHNob3QgZXh0ZW5kcyBJUmVjb3JkaW5nQ29tcG9uZW50U25hcHNob3Qge1xuICAgIGtpbmQ6ICdjb21wb25lbnQnO1xufVxuXG50eXBlIElSZWNvcmRpbmdTbmFwc2hvdCA9IElSZWNvcmRpbmdOb2RlU25hcHNob3QgfCBJUmVjb3JkaW5nU3RhbmRhbG9uZUNvbXBvbmVudFNuYXBzaG90O1xuXG5AcmVnaXN0ZXIoJ1VuZG8nKVxuZXhwb3J0IGNsYXNzIFVuZG9TZXJ2aWNlIGV4dGVuZHMgQmFzZVNlcnZpY2U8SVVuZG9FdmVudHM+IGltcGxlbWVudHMgSVVuZG9TZXJ2aWNlIHtcbiAgICBwcml2YXRlIF91bmRvTWdyOiBTY2VuZVVuZG9NYW5hZ2VyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3VuZG9NZ3IgPSBuZXcgU2NlbmVVbmRvTWFuYWdlcih7XG4gICAgICAgICAgICBzbmFwc2hvdEFkYXB0ZXI6IHRoaXMuX2NyZWF0ZVNjZW5lU25hcHNob3RBZGFwdGVyKCksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGJlZ2luUmVjb3JkaW5nKHV1aWRzOiBzdHJpbmdbXSwgb3B0aW9ucz86IElVbmRvQmVnaW5PcHRpb25zKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VuZG9NZ3IuYmVnaW5SZWNvcmRpbmcodXVpZHMsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGFzeW5jIGVuZFJlY29yZGluZyhjb21tYW5kSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB3YXNEaXJ0eSA9IHRoaXMuX3VuZG9NZ3IuaXNEaXJ0eSgpO1xuICAgICAgICBjb25zdCBwdXNoZWQgPSBhd2FpdCB0aGlzLl91bmRvTWdyLmVuZFJlY29yZGluZyhjb21tYW5kSWQpO1xuICAgICAgICB0aGlzLl9lbWl0RGlydHlJZkNoYW5nZWQod2FzRGlydHkpO1xuICAgICAgICBpZiAocHVzaGVkKSB7XG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdCgndW5kbzpjaGFuZ2VkJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYW5jZWxSZWNvcmRpbmcoY29tbWFuZElkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgd2FzRGlydHkgPSB0aGlzLl91bmRvTWdyLmlzRGlydHkoKTtcbiAgICAgICAgdGhpcy5fdW5kb01nci5jYW5jZWxSZWNvcmRpbmcoY29tbWFuZElkKTtcbiAgICAgICAgdGhpcy5fZW1pdERpcnR5SWZDaGFuZ2VkKHdhc0RpcnR5KTtcbiAgICB9XG5cbiAgICBhc3luYyB1bmRvKG9wdGlvbnM/OiBJVW5kb09wZXJhdGlvbk9wdGlvbnMpOiBQcm9taXNlPElVbmRvUmVkb1Jlc3VsdD4ge1xuICAgICAgICBjb25zdCB3YXNEaXJ0eSA9IHRoaXMuX3VuZG9NZ3IuaXNEaXJ0eSgpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLl91bmRvTWdyLnVuZG8ob3B0aW9ucyk7XG4gICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4vY29yZS9kZWNvcmF0b3InKTtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIEVuZ2luZSDlj6/og73ov5jmsqHliJ3lp4vljJblrozmiJDjgIJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2VtaXREaXJ0eUlmQ2hhbmdlZCh3YXNEaXJ0eSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5icm9hZGNhc3QoJ3VuZG86Y2hhbmdlZCcpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGFzeW5jIHJlZG8ob3B0aW9ucz86IElVbmRvT3BlcmF0aW9uT3B0aW9ucyk6IFByb21pc2U8SVVuZG9SZWRvUmVzdWx0PiB7XG4gICAgICAgIGNvbnN0IHdhc0RpcnR5ID0gdGhpcy5fdW5kb01nci5pc0RpcnR5KCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX3VuZG9NZ3IucmVkbyhvcHRpb25zKTtcbiAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgU2VydmljZSB9ID0gcmVxdWlyZSgnLi9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gRW5naW5lIOWPr+iDvei/mOayoeWIneWni+WMluWujOaIkOOAglxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZW1pdERpcnR5SWZDaGFuZ2VkKHdhc0RpcnR5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJyb2FkY2FzdCgndW5kbzpjaGFuZ2VkJyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2xlYXJIaXN0b3J5KCk7XG4gICAgfVxuXG4gICAgY2xlYXJIaXN0b3J5KCk6IHZvaWQge1xuICAgICAgICBjb25zdCB3YXNEaXJ0eSA9IHRoaXMuX3VuZG9NZ3IuaXNEaXJ0eSgpO1xuICAgICAgICBjb25zdCBoYWRVbmRvU3RhdGUgPVxuICAgICAgICAgICAgdGhpcy5fdW5kb01nci5jYW5VbmRvKCkgfHxcbiAgICAgICAgICAgIHRoaXMuX3VuZG9NZ3IuY2FuUmVkbygpIHx8XG4gICAgICAgICAgICB0aGlzLl91bmRvTWdyLmlzR3JvdXBBY3RpdmUoKSB8fFxuICAgICAgICAgICAgdGhpcy5fdW5kb01nci5oYXNBY3RpdmVSZWNvcmRpbmcoKTtcbiAgICAgICAgdGhpcy5fdW5kb01nci5yZXNldCgpO1xuICAgICAgICB0aGlzLl9lbWl0RGlydHlJZkNoYW5nZWQod2FzRGlydHkpO1xuICAgICAgICBpZiAoaGFkVW5kb1N0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdCgndW5kbzpjaGFuZ2VkJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0RpcnR5KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fdW5kb01nci5pc0RpcnR5KCk7XG4gICAgfVxuXG4gICAgY3JlYXRlQ2hlY2twb2ludCgpOiBJVW5kb0NoZWNrcG9pbnQge1xuICAgICAgICByZXR1cm4gdGhpcy5fdW5kb01nci5jcmVhdGVDaGVja3BvaW50KCk7XG4gICAgfVxuXG4gICAgaGFzU2NvcGVkRGlmZmVyZW5jZShjaGVja3BvaW50OiBJVW5kb0NoZWNrcG9pbnQsIHNjb3BlOiBQYXJ0aWFsPElVbmRvU2NvcGU+KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvTWdyLmhhc1Njb3BlZERpZmZlcmVuY2UoY2hlY2twb2ludCwgc2NvcGUpO1xuICAgIH1cblxuICAgIGhhc1Njb3BlZERpZmZlcmVuY2VBZnRlckNoZWNrcG9pbnQoY2hlY2twb2ludDogSVVuZG9DaGVja3BvaW50LCBzY29wZTogUGFydGlhbDxJVW5kb1Njb3BlPik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fdW5kb01nci5oYXNTY29wZWREaWZmZXJlbmNlQWZ0ZXJDaGVja3BvaW50KGNoZWNrcG9pbnQsIHNjb3BlKTtcbiAgICB9XG5cbiAgICBhc3luYyBkaXNjYXJkU2NvcGVkQ2hhbmdlc0FmdGVyQ2hlY2twb2ludChjaGVja3BvaW50OiBJVW5kb0NoZWNrcG9pbnQsIHNjb3BlOiBQYXJ0aWFsPElVbmRvU2NvcGU+KTogUHJvbWlzZTxJVW5kb1JlZG9SZXN1bHQ+IHtcbiAgICAgICAgY29uc3Qgd2FzRGlydHkgPSB0aGlzLl91bmRvTWdyLmlzRGlydHkoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5fdW5kb01nci5kaXNjYXJkU2NvcGVkQ2hhbmdlc0FmdGVyQ2hlY2twb2ludChjaGVja3BvaW50LCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgdGhpcy5fZW1pdERpcnR5SWZDaGFuZ2VkKHdhc0RpcnR5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJyb2FkY2FzdCgndW5kbzpjaGFuZ2VkJyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgaGFzRGlmZmVyZW5jZU91dHNpZGVTY29wZShjaGVja3BvaW50OiBJVW5kb0NoZWNrcG9pbnQsIHNjb3BlOiBQYXJ0aWFsPElVbmRvU2NvcGU+KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvTWdyLmhhc0RpZmZlcmVuY2VPdXRzaWRlU2NvcGUoY2hlY2twb2ludCwgc2NvcGUpO1xuICAgIH1cblxuICAgIGNhblVuZG8ob3B0aW9ucz86IElVbmRvT3BlcmF0aW9uT3B0aW9ucyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fdW5kb01nci5jYW5VbmRvKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGNhblJlZG8ob3B0aW9ucz86IElVbmRvT3BlcmF0aW9uT3B0aW9ucyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fdW5kb01nci5jYW5SZWRvKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGJlZ2luR3JvdXAob3B0aW9ucz86IElVbmRvR3JvdXBPcHRpb25zKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VuZG9NZ3IuYmVnaW5Hcm91cChvcHRpb25zKTtcbiAgICB9XG5cbiAgICBlbmRHcm91cChncm91cElkOiBzdHJpbmcpOiBJVW5kb1JlZG9SZXN1bHQge1xuICAgICAgICBjb25zdCB3YXNEaXJ0eSA9IHRoaXMuX3VuZG9NZ3IuaXNEaXJ0eSgpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl91bmRvTWdyLmVuZEdyb3VwKGdyb3VwSWQpO1xuICAgICAgICB0aGlzLl9lbWl0RGlydHlJZkNoYW5nZWQod2FzRGlydHkpO1xuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0KCd1bmRvOmNoYW5nZWQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGNhbmNlbEdyb3VwKGdyb3VwSWQ6IHN0cmluZyk6IElVbmRvUmVkb1Jlc3VsdCB7XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvTWdyLmNhbmNlbEdyb3VwKGdyb3VwSWQpO1xuICAgIH1cblxuICAgIGlzR3JvdXBBY3RpdmUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvTWdyLmlzR3JvdXBBY3RpdmUoKTtcbiAgICB9XG5cbiAgICBwdXNoKGNvbW1hbmQ6IElVbmRvQ29tbWFuZCk6IHZvaWQge1xuICAgICAgICBjb25zdCB3YXNEaXJ0eSA9IHRoaXMuX3VuZG9NZ3IuaXNEaXJ0eSgpO1xuICAgICAgICB0aGlzLl91bmRvTWdyLnB1c2goY29tbWFuZCk7XG4gICAgICAgIHRoaXMuX2VtaXREaXJ0eUlmQ2hhbmdlZCh3YXNEaXJ0eSk7XG4gICAgICAgIHRoaXMuYnJvYWRjYXN0KCd1bmRvOmNoYW5nZWQnKTtcbiAgICB9XG5cbiAgICBwdXNoV2l0aFByZXZpb3VzKGNvbW1hbmQ6IElVbmRvQ29tbWFuZCwgb3B0aW9uczogSVVuZG9QdXNoV2l0aFByZXZpb3VzT3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBjb25zdCB3YXNEaXJ0eSA9IHRoaXMuX3VuZG9NZ3IuaXNEaXJ0eSgpO1xuICAgICAgICB0aGlzLl91bmRvTWdyLnB1c2hXaXRoUHJldmlvdXMoY29tbWFuZCwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX2VtaXREaXJ0eUlmQ2hhbmdlZCh3YXNEaXJ0eSk7XG4gICAgICAgIHRoaXMuYnJvYWRjYXN0KCd1bmRvOmNoYW5nZWQnKTtcbiAgICB9XG5cbiAgICBtYXJrU2F2ZWQoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHdhc0RpcnR5ID0gdGhpcy5fdW5kb01nci5pc0RpcnR5KCk7XG4gICAgICAgIHRoaXMuX3VuZG9NZ3IubWFya1NhdmVkKCk7XG4gICAgICAgIHRoaXMuX2VtaXREaXJ0eUlmQ2hhbmdlZCh3YXNEaXJ0eSk7XG4gICAgfVxuXG4gICAgaGFzQWN0aXZlUmVjb3JkaW5nKHV1aWQ/OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VuZG9NZ3IuaGFzQWN0aXZlUmVjb3JkaW5nKHV1aWQpO1xuICAgIH1cblxuICAgIGlzQXBwbHlpbmcoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl91bmRvTWdyLmlzQXBwbHlpbmcoKTtcbiAgICB9XG5cbiAgICAvKiog5Y+q5ZyoIGRpcnR5IOeKtuaAgeecn+ato+WPmOWMluaXtuW5v+aSrSBkaXJ0eTpjaGFuZ2Vk44CCICovXG4gICAgcHJpdmF0ZSBfZW1pdERpcnR5SWZDaGFuZ2VkKHdhc0RpcnR5OiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG5vd0RpcnR5ID0gdGhpcy5fdW5kb01nci5pc0RpcnR5KCk7XG4gICAgICAgIGlmICh3YXNEaXJ0eSAhPT0gbm93RGlydHkpIHtcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0KCdkaXJ0eTpjaGFuZ2VkJywgbm93RGlydHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY3JlYXRlU2NlbmVTbmFwc2hvdEFkYXB0ZXIoKTogSVNuYXBzaG90QWRhcHRlciB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjYXB0dXJlOiAodXVpZHM6IHN0cmluZ1tdKSA9PiB0aGlzLl9jYXB0dXJlU2NlbmVTbmFwc2hvdHModXVpZHMpLFxuICAgICAgICAgICAgYXBwbHk6IGFzeW5jIChkYXRhOiBNYXA8c3RyaW5nLCBJUmVjb3JkaW5nU25hcHNob3Q+KSA9PiB0aGlzLl9hcHBseVNjZW5lU25hcHNob3RzKGRhdGEpLFxuICAgICAgICAgICAgZXF1YWxzOiAoYmVmb3JlOiBNYXA8c3RyaW5nLCBJUmVjb3JkaW5nU25hcHNob3Q+LCBhZnRlcjogTWFwPHN0cmluZywgSVJlY29yZGluZ1NuYXBzaG90PikgPT4gdGhpcy5fc25hcHNob3RNYXBzRXF1YWwoYmVmb3JlLCBhZnRlciksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FwdHVyZVNjZW5lU25hcHNob3RzKHV1aWRzOiBzdHJpbmdbXSk6IE1hcDxzdHJpbmcsIElSZWNvcmRpbmdTbmFwc2hvdD4ge1xuICAgICAgICBjb25zdCBzbmFwc2hvdHMgPSBuZXcgTWFwPHN0cmluZywgSVJlY29yZGluZ1NuYXBzaG90PigpO1xuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgbmV3IFNldCh1dWlkcykpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9nZXRFZGl0b3JOb2RlTWFuYWdlcigpPy5nZXROb2RlPy4odXVpZCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNOb2RlSW5DdXJyZW50U2NlbmUobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBzbmFwc2hvdHMuc2V0KGBub2RlOiR7dXVpZH1gLCB0aGlzLl9jYXB0dXJlTm9kZVNuYXBzaG90KG5vZGUpKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy5fZ2V0RWRpdG9yQ29tcG9uZW50TWFuYWdlcigpPy5nZXRDb21wb25lbnQ/Lih1dWlkKSBhcyBDb21wb25lbnQgfCBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzQ29tcG9uZW50SW5DdXJyZW50U2NlbmUoY29tcG9uZW50KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNuYXBzaG90ID0gdGhpcy5fY2FwdHVyZUNvbXBvbmVudFNuYXBzaG90KGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKHNuYXBzaG90KSB7XG4gICAgICAgICAgICAgICAgICAgIHNuYXBzaG90cy5zZXQoYGNvbXBvbmVudDoke3V1aWR9YCwgeyBraW5kOiAnY29tcG9uZW50JywgLi4uc25hcHNob3QgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzbmFwc2hvdHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FwdHVyZU5vZGVTbmFwc2hvdChub2RlOiBOb2RlKTogSVJlY29yZGluZ05vZGVTbmFwc2hvdCB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBraW5kOiAnbm9kZScsXG4gICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICBwYXRoOiB0aGlzLl9nZXROb2RlUGF0aChub2RlKSxcbiAgICAgICAgICAgIGR1bXA6IHRoaXMuX2Nsb25lRHVtcChkdW1wVXRpbC5kdW1wTm9kZShub2RlLCB7IGluY2x1ZGVDb21wb25lbnRzOiBmYWxzZSB9KSksXG4gICAgICAgICAgICBjb21wb25lbnRzOiBub2RlLmNvbXBvbmVudHNcbiAgICAgICAgICAgICAgICAubWFwKGNvbXBvbmVudCA9PiB0aGlzLl9jYXB0dXJlQ29tcG9uZW50U25hcHNob3QoY29tcG9uZW50IGFzIENvbXBvbmVudCkpXG4gICAgICAgICAgICAgICAgLmZpbHRlcigoc25hcHNob3QpOiBzbmFwc2hvdCBpcyBJUmVjb3JkaW5nQ29tcG9uZW50U25hcHNob3QgPT4gISFzbmFwc2hvdCksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FwdHVyZUNvbXBvbmVudFNuYXBzaG90KGNvbXBvbmVudDogQ29tcG9uZW50KTogSVJlY29yZGluZ0NvbXBvbmVudFNuYXBzaG90IHwgbnVsbCB7XG4gICAgICAgIGlmICghdGhpcy5faXNDb21wb25lbnRJbkN1cnJlbnRTY2VuZShjb21wb25lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1dWlkOiBjb21wb25lbnQudXVpZCxcbiAgICAgICAgICAgIHBhdGg6IHRoaXMuX2dldENvbXBvbmVudFBhdGgoY29tcG9uZW50KSxcbiAgICAgICAgICAgIG5vZGVVdWlkOiBjb21wb25lbnQubm9kZS51dWlkLFxuICAgICAgICAgICAgbm9kZVBhdGg6IHRoaXMuX2dldE5vZGVQYXRoKGNvbXBvbmVudC5ub2RlKSxcbiAgICAgICAgICAgIGluZGV4OiBjb21wb25lbnQubm9kZS5jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KSxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMuX2dldENvbXBvbmVudFR5cGUoY29tcG9uZW50KSxcbiAgICAgICAgICAgIGR1bXA6IHRoaXMuX2Nsb25lRHVtcChkdW1wVXRpbC5kdW1wQ29tcG9uZW50KGNvbXBvbmVudCkpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2FwcGx5U2NlbmVTbmFwc2hvdHMoZGF0YTogTWFwPHN0cmluZywgSVJlY29yZGluZ1NuYXBzaG90Pik6IFByb21pc2U8SVVuZG9SZWRvUmVzdWx0PiB7XG4gICAgICAgIGZvciAoY29uc3Qgc25hcHNob3Qgb2YgZGF0YS52YWx1ZXMoKSkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gc25hcHNob3Qua2luZCA9PT0gJ25vZGUnXG4gICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLl9hcHBseU5vZGVTbmFwc2hvdChzbmFwc2hvdClcbiAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMuX2FwcGx5Q29tcG9uZW50U25hcHNob3Qoc25hcHNob3QpO1xuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2FwcGx5Tm9kZVNuYXBzaG90KHNuYXBzaG90OiBJUmVjb3JkaW5nTm9kZVNuYXBzaG90KTogUHJvbWlzZTxJVW5kb1JlZG9SZXN1bHQ+IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX2ZpbmROb2RlKHNuYXBzaG90LnV1aWQsIHNuYXBzaG90LnBhdGgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IGBOb2RlIG5vdCBmb3VuZDogJHtzbmFwc2hvdC5wYXRoIHx8IHNuYXBzaG90LnV1aWR9YCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIFNlcnZpY2VFdmVudHMuZW1pdCgnbm9kZTpiZWZvcmUtY2hhbmdlJywgbm9kZSk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9yZXN0b3JlTm9kZUR1bXAobm9kZSwgc25hcHNob3QuZHVtcCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudFNuYXBzaG90IG9mIHNuYXBzaG90LmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLl9maW5kQ29tcG9uZW50KGNvbXBvbmVudFNuYXBzaG90KTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Jlc3RvcmVDb21wb25lbnREdW1wKGNvbXBvbmVudCwgY29tcG9uZW50U25hcHNob3QuZHVtcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgU2VydmljZUV2ZW50cy5lbWl0KCdub2RlOmNoYW5nZScsIG5vZGUsIHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IEV2ZW50U291cmNlVHlwZS5VTkRPLFxuICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVFdmVudFR5cGUuU0VUX1BST1BFUlRZLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2FwcGx5Q29tcG9uZW50U25hcHNob3Qoc25hcHNob3Q6IElSZWNvcmRpbmdTdGFuZGFsb25lQ29tcG9uZW50U25hcHNob3QpOiBQcm9taXNlPElVbmRvUmVkb1Jlc3VsdD4ge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLl9maW5kQ29tcG9uZW50KHNuYXBzaG90KTtcbiAgICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IGBDb21wb25lbnQgbm90IGZvdW5kOiAke3NuYXBzaG90LnBhdGggfHwgc25hcHNob3QudXVpZH1gIH07XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVzdG9yZUNvbXBvbmVudER1bXAoY29tcG9uZW50LCBzbmFwc2hvdC5kdW1wKTtcbiAgICAgICAgICAgIFNlcnZpY2VFdmVudHMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBjb21wb25lbnQubm9kZSwge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogRXZlbnRTb3VyY2VUeXBlLlVORE8sXG4gICAgICAgICAgICAgICAgdHlwZTogTm9kZUV2ZW50VHlwZS5TRVRfUFJPUEVSVFksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVzdG9yZU5vZGVEdW1wKG5vZGU6IE5vZGUsIGR1bXA6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCByZXN0b3JlTm9kZVNuYXBzaG90RHVtcChub2RlLCBkdW1wLCB7XG4gICAgICAgICAgICB1cGRhdGVOb2RlTmFtZTogKHV1aWQsIG5hbWUpID0+IHRoaXMuX2dldEVkaXRvck5vZGVNYW5hZ2VyKCk/LnVwZGF0ZU5vZGVOYW1lPy4odXVpZCwgbmFtZSksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3Jlc3RvcmVDb21wb25lbnREdW1wKGNvbXBvbmVudDogQ29tcG9uZW50LCBkdW1wOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgcmVzdG9yZUNvbXBvbmVudFNuYXBzaG90RHVtcChjb21wb25lbnQsIGR1bXApO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbmROb2RlKHV1aWQ6IHN0cmluZywgcGF0aDogc3RyaW5nKTogTm9kZSB8IG51bGwge1xuICAgICAgICBjb25zdCBieVV1aWQgPSB0aGlzLl9nZXRFZGl0b3JOb2RlTWFuYWdlcigpPy5nZXROb2RlPy4odXVpZCkgYXMgTm9kZSB8IG51bGw7XG4gICAgICAgIGlmICh0aGlzLl9pc05vZGVJbkN1cnJlbnRTY2VuZShieVV1aWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gYnlVdWlkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGJ5UGF0aCA9IHRoaXMuX2dldEVkaXRvck5vZGVNYW5hZ2VyKCk/LmdldE5vZGVCeVBhdGg/LihwYXRoKSBhcyBOb2RlIHwgbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc05vZGVJbkN1cnJlbnRTY2VuZShieVBhdGgpID8gYnlQYXRoIDogbnVsbDtcbiAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbmRDb21wb25lbnQoc25hcHNob3Q6IElSZWNvcmRpbmdDb21wb25lbnRTbmFwc2hvdCk6IENvbXBvbmVudCB8IG51bGwge1xuICAgICAgICBjb25zdCBlZGl0b3JDb21wb25lbnQgPSB0aGlzLl9nZXRFZGl0b3JDb21wb25lbnRNYW5hZ2VyKCk7XG4gICAgICAgIGNvbnN0IGJ5VXVpZCA9IGVkaXRvckNvbXBvbmVudD8uZ2V0Q29tcG9uZW50Py4oc25hcHNob3QudXVpZCkgYXMgQ29tcG9uZW50IHwgbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuX2lzQ29tcG9uZW50SW5DdXJyZW50U2NlbmUoYnlVdWlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIGJ5VXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzbmFwc2hvdC5wYXRoKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ5UGF0aCA9IGVkaXRvckNvbXBvbmVudD8uZ2V0Q29tcG9uZW50RnJvbVBhdGg/LihzbmFwc2hvdC5wYXRoKSBhcyBDb21wb25lbnQgfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pc0NvbXBvbmVudEluQ3VycmVudFNjZW5lKGJ5UGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJ5UGF0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyDmjInot6/lvoTmib7kuI3liLDnu4Tku7bml7bvvIzlho3pgIDlm57liLDoioLngrnlkoznu4Tku7bkuIvmoIfmn6Xmib7jgIJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9maW5kTm9kZShzbmFwc2hvdC5ub2RlVXVpZCwgc25hcHNob3Qubm9kZVBhdGgpO1xuICAgICAgICBjb25zdCBieUluZGV4ID0gbm9kZT8uY29tcG9uZW50c1tzbmFwc2hvdC5pbmRleF0gYXMgQ29tcG9uZW50IHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodGhpcy5faXNDb21wb25lbnRJbkN1cnJlbnRTY2VuZShieUluZGV4KSAmJiB0aGlzLl9nZXRDb21wb25lbnRUeXBlKGJ5SW5kZXgpID09PSBzbmFwc2hvdC50eXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYnlJbmRleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9pc05vZGVJbkN1cnJlbnRTY2VuZShub2RlOiBOb2RlIHwgbnVsbCB8IHVuZGVmaW5lZCk6IG5vZGUgaXMgTm9kZSB7XG4gICAgICAgIGlmICghbm9kZT8uaXNWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNjZW5lID0gKGNjIGFzIGFueSkuZGlyZWN0b3I/LmdldFNjZW5lPy4oKTtcbiAgICAgICAgcmV0dXJuICEhc2NlbmUgJiYgKG5vZGUgPT09IHNjZW5lIHx8IG5vZGUuaXNDaGlsZE9mKHNjZW5lKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfaXNDb21wb25lbnRJbkN1cnJlbnRTY2VuZShjb21wb25lbnQ6IENvbXBvbmVudCB8IG51bGwgfCB1bmRlZmluZWQpOiBjb21wb25lbnQgaXMgQ29tcG9uZW50IHtcbiAgICAgICAgcmV0dXJuICEhY29tcG9uZW50Py5pc1ZhbGlkICYmIHRoaXMuX2lzTm9kZUluQ3VycmVudFNjZW5lKGNvbXBvbmVudC5ub2RlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXROb2RlUGF0aChub2RlOiBOb2RlKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3Qgc2NlbmUgPSAoY2MgYXMgYW55KS5kaXJlY3Rvcj8uZ2V0U2NlbmU/LigpO1xuICAgICAgICBpZiAobm9kZSA9PT0gc2NlbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnLyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEVkaXRvck5vZGVNYW5hZ2VyKCk/LmdldE5vZGVQYXRoPy4obm9kZSkgPz8gJyc7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0Q29tcG9uZW50UGF0aChjb21wb25lbnQ6IENvbXBvbmVudCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRFZGl0b3JDb21wb25lbnRNYW5hZ2VyKCk/LmdldFBhdGhGcm9tVXVpZD8uKGNvbXBvbmVudC51dWlkKSA/PyAnJztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRDb21wb25lbnRUeXBlKGNvbXBvbmVudDogQ29tcG9uZW50KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIChjYyBhcyBhbnkpLmpzPy5nZXRDbGFzc05hbWU/Lihjb21wb25lbnQuY29uc3RydWN0b3IpIHx8IGNvbXBvbmVudC5jb25zdHJ1Y3Rvcj8ubmFtZSB8fCAnJztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRFZGl0b3JOb2RlTWFuYWdlcigpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RWRpdG9yRXh0ZW5kcygpPy5Ob2RlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldEVkaXRvckNvbXBvbmVudE1hbmFnZXIoKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEVkaXRvckV4dGVuZHMoKT8uQ29tcG9uZW50O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldEVkaXRvckV4dGVuZHMoKTogYW55IHtcbiAgICAgICAgcmV0dXJuIChjYyBhcyBhbnkpLkVkaXRvckV4dGVuZHMgfHwgKGdsb2JhbFRoaXMgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3NuYXBzaG90TWFwc0VxdWFsKGJlZm9yZTogTWFwPHN0cmluZywgSVJlY29yZGluZ1NuYXBzaG90PiwgYWZ0ZXI6IE1hcDxzdHJpbmcsIElSZWNvcmRpbmdTbmFwc2hvdD4pOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHNuYXBzaG90TWFwc0VxdWFsKGJlZm9yZSwgYWZ0ZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Nsb25lRHVtcDxUPihkdW1wOiBUKTogVCB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGR1bXApKSBhcyBUO1xuICAgIH1cbn1cbiJdfQ==