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
exports.EditorService = void 0;
const cc_1 = __importDefault(require("cc"));
const core_1 = require("./core");
const internal_events_1 = require("./core/internal-events");
const common_1 = require("../../common");
const editors_1 = require("./editors");
const rpc_1 = require("../rpc");
const error_utils_1 = require("./error-utils");
/**
 * EditorAsset - 统一的编辑器管理入口
 * 作为调度器，根据资源类型动态创建和管理编辑器实例
 */
let EditorService = class EditorService extends core_1.BaseService {
    needReloadAgain = null;
    lastSceneOrNode;
    reloadPromise = null;
    currentEditorUuid = null; // 当前打开的编辑器 UUID
    editorMap = new Map(); // uuid -> editor
    lockCount = 0;
    lockPromise = null;
    lockResolve = null;
    _isReloading = false;
    lifecyclePromise = Promise.resolve();
    editorSessionGeneration = 0;
    async lock() {
        if (this.reloadPromise) {
            await this.reloadPromise;
        }
        this.lockCount++;
        if (this.lockCount === 1) {
            this.lockPromise = new Promise((resolve) => {
                this.lockResolve = resolve;
            });
        }
    }
    unlock() {
        this.lockCount--;
        if (this.lockCount === 0) {
            this.lockResolve?.();
            this.lockPromise = null;
            this.lockResolve = null;
        }
    }
    async waitLocks() {
        if (this.lockPromise) {
            await this.lockPromise;
        }
    }
    /**
     * 当前编辑的类型
     */
    getCurrentEditorType() {
        const editor = this.currentEditorUuid && this.editorMap.get(this.currentEditorUuid);
        if (editor instanceof editors_1.SceneEditor) {
            return 'scene';
        }
        else if (editor instanceof editors_1.PrefabEditor) {
            return 'prefab';
        }
        return 'unknown';
    }
    getCurrentEditorUuid() {
        return this.currentEditorUuid;
    }
    getEditorSession() {
        return {
            uuid: this.currentEditorUuid,
            generation: this.editorSessionGeneration,
        };
    }
    isCurrentEditorSession(session) {
        return session.generation === this.editorSessionGeneration
            && session.uuid === this.currentEditorUuid
            && this.isOpen;
    }
    invalidateEditorSession() {
        this.editorSessionGeneration++;
    }
    /**
     * 是否打开场景
     */
    async hasOpen() {
        return this.isOpen;
    }
    /**
     * 根据资源类型创建对应的编辑器
     */
    createEditor(type) {
        switch (type) {
            case 'scene':
            case 'cc.SceneAsset':
                return new editors_1.SceneEditor();
            case 'prefab':
            case 'cc.Prefab':
                return new editors_1.PrefabEditor();
            default:
                throw new Error(`不支持的资源类型: ${type}`);
        }
    }
    async queryCurrent() {
        const editor = this.currentEditorUuid && this.editorMap.get(this.currentEditorUuid);
        console.log(`current editor: ${this.currentEditorUuid} `);
        return editor ? await editor.encode() : null;
    }
    /**
     * 序列化当前正在编辑的场景（含未保存改动），返回可被 loadWithJson 加载的 JSON 字符串。
     * 用于「Preview in Editor」：把编辑器里的实时场景交给游戏运行时预览。
     * 该方法经 Service proxy 自动暴露到浏览器侧 window.cli.Scene.Editor.querySceneSerializedData。
     */
    async querySceneSerializedData() {
        const editor = this.currentEditorUuid && this.editorMap.get(this.currentEditorUuid);
        if (editor instanceof editors_1.SceneEditor) {
            return editor.serializeCurrent();
        }
        throw new Error('[querySceneSerializedData] 当前没有打开场景');
    }
    getRootNode() {
        const editor = this.currentEditorUuid && this.editorMap.get(this.currentEditorUuid);
        return editor ? editor.getRootNode() : null;
    }
    async open(params) {
        return this.runLifecycle(() => this.openUnlocked(params));
    }
    async openUnlocked(params) {
        const { urlOrUUID } = params;
        const assetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [urlOrUUID]);
        if (!assetInfo) {
            throw new Error(`通过 ${urlOrUUID} 无法打开，查询不到该资源信息`);
        }
        const currentEditorUuid = this.currentEditorUuid;
        if (currentEditorUuid) {
            const currentEditor = this.editorMap.get(currentEditorUuid);
            if (currentEditor) {
                this.invalidateEditorSession();
                try {
                    const currentAssetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [currentEditorUuid]);
                    await currentEditor.close({ save: Boolean(currentAssetInfo) });
                }
                catch (error) {
                    console.error(error);
                    throw error;
                }
                this.editorMap.delete(currentEditorUuid);
                if (this.currentEditorUuid === currentEditorUuid) {
                    this.currentEditorUuid = null;
                    this.isOpen = false;
                }
                this.emitInternal(internal_events_1.InternalServiceEvents.EditorDisposed);
            }
            else {
                this.invalidateEditorSession();
                this.currentEditorUuid = null;
                this.isOpen = false;
            }
        }
        const outputDependentInfo = async (err) => {
            try {
                const rpc = rpc_1.Rpc.getInstance();
                err.message = await (0, error_utils_1.enrichMissingDependencyError)(err.message || '', urlOrUUID, (uuid) => rpc.request('assetManager', 'queryAssetInfo', [uuid]), (mainUuid, subId) => rpc.request('assetManager', 'querySubAssetName', [mainUuid, subId]));
            }
            catch (error) {
                //
            }
        };
        const uuid = assetInfo.uuid;
        try {
            // 检查是否已经有对应的编辑器实例
            let editor = this.editorMap.get(uuid);
            if (!editor) {
                editor = this.createEditor(assetInfo.type);
                this.editorMap.set(uuid, editor);
            }
            const encode = await editor.open(assetInfo, params);
            this._clearUndoHistory();
            // 设置当前打开的编辑器
            this.currentEditorUuid = assetInfo.uuid;
            this.invalidateEditorSession();
            this.emit('editor:open', cc_1.default.director.getScene());
            this.isOpen = true;
            console.log(`打开 ${assetInfo.url}`);
            return encode;
        }
        catch (err) {
            await outputDependentInfo(err);
            this.editorMap.delete(uuid);
            if (this.currentEditorUuid === uuid) {
                this.currentEditorUuid = null;
                this.isOpen = false;
            }
            console.error(err);
            throw err;
        }
    }
    async close(params) {
        return this.runLifecycle(() => this.closeUnlocked(params));
    }
    async closeUnlocked(params) {
        const urlOrUUID = params.urlOrUUID ?? this.currentEditorUuid;
        try {
            const currentEditorUuid = this.currentEditorUuid;
            if (!urlOrUUID || !currentEditorUuid)
                return true;
            const assetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [urlOrUUID]);
            const editor = assetInfo
                ? this.editorMap.get(assetInfo.uuid)
                : params.allowDeletedSourceFallback && params.expectedCurrentUuid === currentEditorUuid
                    ? this.editorMap.get(currentEditorUuid)
                    : undefined;
            if (!editor) {
                if (!assetInfo) {
                    throw new Error(`通过 ${urlOrUUID} 请求资源失败`);
                }
                return true;
            }
            this.invalidateEditorSession();
            if (params.save !== false) {
                await this.saveTerrainAssets();
            }
            const result = await editor.close({ save: params.save ?? true });
            if (editor === this.editorMap.get(currentEditorUuid)) {
                this._clearUndoHistory();
                this.currentEditorUuid = null;
            }
            for (const [uuid, candidate] of this.editorMap) {
                if (candidate === editor) {
                    this.editorMap.delete(uuid);
                }
            }
            this.emit('editor:close');
            // 真正关闭编辑器时的会话清理边界；重载只复用内容卸载/挂载边界。
            this.emitInternal(internal_events_1.InternalServiceEvents.EditorDisposed);
            this.isOpen = false;
            console.log(`关闭 ${assetInfo?.url ?? urlOrUUID}`);
            return result;
        }
        catch (error) {
            console.error(`关闭失败: [${urlOrUUID}]`, error);
            throw error;
        }
    }
    async save(params) {
        return this.runLifecycle(() => this.saveUnlocked(params));
    }
    async saveAs(params) {
        return this.runLifecycle(() => this.saveAsUnlocked(params));
    }
    async saveUnlocked(params) {
        const urlOrUUID = params.urlOrUUID ?? this.currentEditorUuid;
        try {
            const { assetInfo, currentEditorUuid, editor } = await this.resolveSaveTarget(urlOrUUID);
            await this.saveTerrainAssets();
            const result = assetInfo.uuid === currentEditorUuid
                ? await editor.save()
                : await this.recoverDeletedSourceTo(assetInfo, currentEditorUuid, editor);
            this.assertSavedTarget(result, assetInfo);
            this._markUndoSaved();
            this.emit('editor:save');
            console.log(`保存 ${assetInfo.url}`);
            return result;
        }
        catch (error) {
            console.error(`保存失败: [${urlOrUUID}]`, error);
            throw error;
        }
    }
    /** Terrain data lives in .terrain assets, not in the scene JSON. */
    async saveTerrainAssets() {
        try {
            const terrain = core_1.Service.Terrain;
            if (!terrain?.saveAsset)
                return;
            const result = await terrain.saveAsset(false);
            if (result === 2) {
                throw new Error('Terrain asset save failed or requires a Save As target.');
            }
        }
        catch (error) {
            // During early bootstrap or isolated editor tests TerrainService may
            // not be registered. Real terrain save failures use the explicit error above.
            if (error instanceof Error && error.message.includes('requires a Save As'))
                throw error;
        }
    }
    async recoverDeletedSourceTo(assetInfo, currentEditorUuid, editor) {
        const currentAssetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [currentEditorUuid]);
        if (currentAssetInfo) {
            throw new Error(`不能保存到非当前资源 ${assetInfo.url}，请使用另存为`);
        }
        const result = await editor.saveAs(assetInfo);
        this.assertSavedTarget(result, assetInfo);
        await this.openUnlocked({ urlOrUUID: result.uuid });
        return result;
    }
    async saveAsUnlocked(params) {
        const urlOrUUID = params.urlOrUUID;
        if (!urlOrUUID) {
            throw new Error('另存为需要指定目标资源');
        }
        try {
            const { assetInfo, editor } = await this.resolveSaveTarget(urlOrUUID);
            const result = await editor.saveAs(assetInfo);
            this.assertSavedTarget(result, assetInfo);
            console.log(`另存为 ${assetInfo.url}`);
            return result;
        }
        catch (error) {
            console.error(`另存为失败: [${urlOrUUID}]`, error);
            throw error;
        }
    }
    async resolveSaveTarget(urlOrUUID) {
        const currentEditorUuid = this.currentEditorUuid;
        if (!urlOrUUID || !currentEditorUuid) {
            throw new Error('当前没有打开任何编辑器');
        }
        const assetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [urlOrUUID]);
        if (!assetInfo) {
            throw new Error(`通过 ${urlOrUUID} 请求资源失败`);
        }
        const editor = this.editorMap.get(currentEditorUuid);
        if (!editor) {
            throw new Error('当前没有打开任何编辑器');
        }
        if (!this.isSaveTargetCompatible(editor, assetInfo.type)) {
            throw new Error(`不能将 ${editor instanceof editors_1.SceneEditor ? 'scene' : 'prefab'} 保存到 ${assetInfo.type} 资源`);
        }
        return { assetInfo, currentEditorUuid, editor };
    }
    assertSavedTarget(result, target) {
        if (result.uuid !== target.uuid) {
            throw new Error(`保存目标资源标识不一致: 期望 ${target.uuid}，实际 ${result.uuid}`);
        }
    }
    isSaveTargetCompatible(editor, targetType) {
        if (editor instanceof editors_1.SceneEditor) {
            return targetType === 'scene' || targetType === 'cc.SceneAsset';
        }
        return targetType === 'prefab' || targetType === 'cc.Prefab';
    }
    async reload(params) {
        return this.runLifecycle(() => this.reloadUnlocked(params));
    }
    async reloadForSession(params, session) {
        return this.runLifecycle(async () => {
            if (!this.isCurrentEditorSession(session)) {
                return common_1.ReloadResult.EDITOR_NOT_FOUND;
            }
            return this.reloadUnlocked(params);
        });
    }
    async reloadUnlocked(params) {
        if (this._isReloading) {
            this.needReloadAgain = params;
            return common_1.ReloadResult.QUEUED;
        }
        this._isReloading = true;
        try {
            const urlOrUUID = params.urlOrUUID ?? this.currentEditorUuid;
            if (!urlOrUUID) {
                console.warn('当前没有打开任何编辑器');
                this._isReloading = false;
                return common_1.ReloadResult.NO_EDITOR;
            }
            const assetInfo = await rpc_1.Rpc.getInstance().request('assetManager', 'queryAssetInfo', [urlOrUUID]);
            if (!assetInfo) {
                console.warn(`通过 ${urlOrUUID} 请求资源失败`);
                this._isReloading = false;
                return common_1.ReloadResult.ASSET_NOT_FOUND;
            }
            const editor = this.editorMap.get(assetInfo.uuid);
            if (!editor || assetInfo.uuid !== this.currentEditorUuid) {
                console.warn('当前没有打开任何编辑器');
                this._isReloading = false;
                return common_1.ReloadResult.EDITOR_NOT_FOUND;
            }
            this.reloadPromise = (async () => {
                try {
                    let currentParams = params;
                    while (currentParams) {
                        await this.waitLocks();
                        // 重载不是对外的编辑器关闭/打开；这里只复用内部内容卸载/挂载边界。
                        this.emitInternal(internal_events_1.InternalServiceEvents.EditorReloadClose);
                        try {
                            await editor.reload();
                        }
                        finally {
                            this.emitInternal(internal_events_1.InternalServiceEvents.EditorReloadOpen);
                        }
                        if (!currentParams.preserveUndoHistory) {
                            this._clearUndoHistory();
                        }
                        if (this.needReloadAgain) {
                            currentParams = this.needReloadAgain;
                            this.needReloadAgain = null;
                        }
                        else {
                            currentParams = null;
                        }
                        this.broadcast('editor:reload');
                        console.log(`重载 ${assetInfo.url}`);
                    }
                    return common_1.ReloadResult.SUCCESS;
                }
                catch (error) {
                    console.error(error);
                    return common_1.ReloadResult.FAILED;
                }
                finally {
                    this.reloadPromise = null;
                    this._isReloading = false;
                }
            })();
            return this.reloadPromise;
        }
        catch (error) {
            console.error(error);
            this._isReloading = false;
            return common_1.ReloadResult.FAILED;
        }
    }
    async runLifecycle(operation) {
        const previous = this.lifecyclePromise;
        let release;
        this.lifecyclePromise = new Promise((resolve) => {
            release = resolve;
        });
        await previous;
        try {
            return await operation();
        }
        finally {
            release();
        }
    }
    async create(params) {
        const editor = this.createEditor(params.type);
        if (!editor) {
            throw new Error('不支持该类型资源创建');
        }
        return await editor.create(params);
    }
    onScriptExecutionFinished() {
        console.log('[Scene] Script execution-finished');
        const editor = this.currentEditorUuid && this.editorMap.get(this.currentEditorUuid);
        if (!editor)
            return;
        // releaseAsset 资源，为了让 Prefab 资源能够加载到新的脚本，在脚本更新后需要遍历释放所有的 prefab 资源
        cc_1.default.assetManager.assets.forEach((asset) => {
            if (asset instanceof cc_1.default.Prefab) {
                cc_1.default.assetManager.releaseAsset(asset);
            }
        });
        console.log('[Scene] Script suspend soft reload');
        core_1.Service.Script.suspend(Promise.resolve(this.reload({})));
    }
    _clearUndoHistory() {
        try {
            core_1.Service.Undo?.clearHistory();
        }
        catch (_e) {
            // UndoService may not be registered during early editor setup.
        }
    }
    _markUndoSaved() {
        try {
            core_1.Service.Undo?.markSaved();
        }
        catch (_e) {
            // UndoService may not be registered during early editor setup.
        }
    }
};
exports.EditorService = EditorService;
exports.EditorService = EditorService = __decorate([
    (0, core_1.register)('Editor')
], EditorService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2VkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsaUNBQXdEO0FBQ3hELDREQUErRDtBQUMvRCx5Q0FXc0I7QUFDdEIsdUNBQXNEO0FBRXRELGdDQUE2QjtBQUM3QiwrQ0FBNkQ7QUFHN0Q7OztHQUdHO0FBRUksSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLGtCQUEwQjtJQUNqRCxlQUFlLEdBQTBCLElBQUksQ0FBQztJQUM5QyxlQUFlLENBQTRCO0lBQzNDLGFBQWEsR0FBa0MsSUFBSSxDQUFDO0lBQ3BELGlCQUFpQixHQUFrQixJQUFJLENBQUMsQ0FBQyxnQkFBZ0I7SUFDekQsU0FBUyxHQUE0QyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsaUJBQWlCO0lBRWpGLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDZCxXQUFXLEdBQXlCLElBQUksQ0FBQztJQUN6QyxXQUFXLEdBQXdCLElBQUksQ0FBQztJQUN4QyxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLGdCQUFnQixHQUFrQixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEQsdUJBQXVCLEdBQUcsQ0FBQyxDQUFDO0lBRTdCLEtBQUssQ0FBQyxJQUFJO1FBQ2IsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDckIsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzdCLENBQUM7UUFDRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDakIsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLFdBQVcs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LE9BQU8sRUFBRSxFQUFFLENBQUM7WUFDViwrREFBK0Q7UUFDbkUsQ0FBQztJQUNMLENBQUM7Q0FDSixDQUFBO0FBcmZZLHNDQUFhO3dCQUFiLGFBQWE7SUFEekIsSUFBQSxlQUFRLEVBQUMsUUFBUSxDQUFDO0dBQ04sYUFBYSxDQXFmekIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2MgZnJvbSAnY2MnO1xuaW1wb3J0IHsgQmFzZVNlcnZpY2UsIHJlZ2lzdGVyLCBTZXJ2aWNlIH0gZnJvbSAnLi9jb3JlJztcbmltcG9ydCB7IEludGVybmFsU2VydmljZUV2ZW50cyB9IGZyb20gJy4vY29yZS9pbnRlcm5hbC1ldmVudHMnO1xuaW1wb3J0IHtcbiAgICBJQmFzZUlkZW50aWZpZXIsXG4gICAgSUNsb3NlT3B0aW9ucyxcbiAgICBJQ3JlYXRlT3B0aW9ucyxcbiAgICBJRWRpdG9yRXZlbnRzLFxuICAgIElFZGl0b3JTZXJ2aWNlLFxuICAgIElPcGVuT3B0aW9ucyxcbiAgICBJUmVsb2FkT3B0aW9ucyxcbiAgICBJU2F2ZU9wdGlvbnMsXG4gICAgUmVsb2FkUmVzdWx0LFxuICAgIFRFZGl0b3JFbnRpdHksXG59IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBQcmVmYWJFZGl0b3IsIFNjZW5lRWRpdG9yIH0gZnJvbSAnLi9lZGl0b3JzJztcbmltcG9ydCB7IElBc3NldEluZm8gfSBmcm9tICcuLi8uLi8uLi9hc3NldHMvQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQgeyBScGMgfSBmcm9tICcuLi9ycGMnO1xuaW1wb3J0IHsgZW5yaWNoTWlzc2luZ0RlcGVuZGVuY3lFcnJvciB9IGZyb20gJy4vZXJyb3ItdXRpbHMnO1xuaW1wb3J0IHR5cGUgeyBJRWRpdG9yU2Vzc2lvblNlcnZpY2UsIElFZGl0b3JTZXNzaW9uU25hcHNob3QgfSBmcm9tICcuL2NvcmUvZWRpdG9yLXNlc3Npb24nO1xuXG4vKipcbiAqIEVkaXRvckFzc2V0IC0g57uf5LiA55qE57yW6L6R5Zmo566h55CG5YWl5Y+jXG4gKiDkvZzkuLrosIPluqblmajvvIzmoLnmja7otYTmupDnsbvlnovliqjmgIHliJvlu7rlkoznrqHnkIbnvJbovpHlmajlrp7kvotcbiAqL1xuQHJlZ2lzdGVyKCdFZGl0b3InKVxuZXhwb3J0IGNsYXNzIEVkaXRvclNlcnZpY2UgZXh0ZW5kcyBCYXNlU2VydmljZTxJRWRpdG9yRXZlbnRzPiBpbXBsZW1lbnRzIElFZGl0b3JTZXJ2aWNlLCBJRWRpdG9yU2Vzc2lvblNlcnZpY2Uge1xuICAgIHByaXZhdGUgbmVlZFJlbG9hZEFnYWluOiBJUmVsb2FkT3B0aW9ucyB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgbGFzdFNjZW5lT3JOb2RlOiBURWRpdG9yRW50aXR5IHwgdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgcmVsb2FkUHJvbWlzZTogUHJvbWlzZTxURWRpdG9yRW50aXR5PiB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgY3VycmVudEVkaXRvclV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsOyAvLyDlvZPliY3miZPlvIDnmoTnvJbovpHlmaggVVVJRFxuICAgIHByaXZhdGUgZWRpdG9yTWFwOiBNYXA8c3RyaW5nLCBTY2VuZUVkaXRvciB8IFByZWZhYkVkaXRvcj4gPSBuZXcgTWFwKCk7IC8vIHV1aWQgLT4gZWRpdG9yXG5cbiAgICBwcml2YXRlIGxvY2tDb3VudCA9IDA7XG4gICAgcHJpdmF0ZSBsb2NrUHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgbG9ja1Jlc29sdmU6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX2lzUmVsb2FkaW5nID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBsaWZlY3ljbGVQcm9taXNlOiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgcHJpdmF0ZSBlZGl0b3JTZXNzaW9uR2VuZXJhdGlvbiA9IDA7XG5cbiAgICBwdWJsaWMgYXN5bmMgbG9jaygpIHtcbiAgICAgICAgaWYgKHRoaXMucmVsb2FkUHJvbWlzZSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWxvYWRQcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9ja0NvdW50Kys7XG4gICAgICAgIGlmICh0aGlzLmxvY2tDb3VudCA9PT0gMSkge1xuICAgICAgICAgICAgdGhpcy5sb2NrUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2NrUmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB1bmxvY2soKSB7XG4gICAgICAgIHRoaXMubG9ja0NvdW50LS07XG4gICAgICAgIGlmICh0aGlzLmxvY2tDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5sb2NrUmVzb2x2ZT8uKCk7XG4gICAgICAgICAgICB0aGlzLmxvY2tQcm9taXNlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMubG9ja1Jlc29sdmUgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdExvY2tzKCkge1xuICAgICAgICBpZiAodGhpcy5sb2NrUHJvbWlzZSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2NrUHJvbWlzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOW9k+WJjee8lui+keeahOexu+Wei1xuICAgICAqL1xuICAgIHB1YmxpYyBnZXRDdXJyZW50RWRpdG9yVHlwZSgpOiAnc2NlbmUnIHwgJ3ByZWZhYicgfCAndW5rbm93bicge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmN1cnJlbnRFZGl0b3JVdWlkICYmIHRoaXMuZWRpdG9yTWFwLmdldCh0aGlzLmN1cnJlbnRFZGl0b3JVdWlkKTtcbiAgICAgICAgaWYgKGVkaXRvciBpbnN0YW5jZW9mIFNjZW5lRWRpdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3NjZW5lJztcbiAgICAgICAgfSBlbHNlIGlmIChlZGl0b3IgaW5zdGFuY2VvZiBQcmVmYWJFZGl0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiAncHJlZmFiJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3Vua25vd24nO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDdXJyZW50RWRpdG9yVXVpZCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEVkaXRvclV1aWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEVkaXRvclNlc3Npb24oKTogSUVkaXRvclNlc3Npb25TbmFwc2hvdCB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1dWlkOiB0aGlzLmN1cnJlbnRFZGl0b3JVdWlkLFxuICAgICAgICAgICAgZ2VuZXJhdGlvbjogdGhpcy5lZGl0b3JTZXNzaW9uR2VuZXJhdGlvbixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaXNDdXJyZW50RWRpdG9yU2Vzc2lvbihzZXNzaW9uOiBJRWRpdG9yU2Vzc2lvblNuYXBzaG90KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBzZXNzaW9uLmdlbmVyYXRpb24gPT09IHRoaXMuZWRpdG9yU2Vzc2lvbkdlbmVyYXRpb25cbiAgICAgICAgICAgICYmIHNlc3Npb24udXVpZCA9PT0gdGhpcy5jdXJyZW50RWRpdG9yVXVpZFxuICAgICAgICAgICAgJiYgdGhpcy5pc09wZW47XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbnZhbGlkYXRlRWRpdG9yU2Vzc2lvbigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3JTZXNzaW9uR2VuZXJhdGlvbisrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaYr+WQpuaJk+W8gOWcuuaZr1xuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBoYXNPcGVuKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pc09wZW47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC55o2u6LWE5rqQ57G75Z6L5Yib5bu65a+55bqU55qE57yW6L6R5ZmoXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVFZGl0b3IodHlwZTogc3RyaW5nKTogU2NlbmVFZGl0b3IgfCBQcmVmYWJFZGl0b3Ige1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NjZW5lJzpcbiAgICAgICAgICAgIGNhc2UgJ2NjLlNjZW5lQXNzZXQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU2NlbmVFZGl0b3IoKTtcbiAgICAgICAgICAgIGNhc2UgJ3ByZWZhYic6XG4gICAgICAgICAgICBjYXNlICdjYy5QcmVmYWInOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJlZmFiRWRpdG9yKCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5LiN5pSv5oyB55qE6LWE5rqQ57G75Z6LOiAke3R5cGV9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeUN1cnJlbnQoKTogUHJvbWlzZTxURWRpdG9yRW50aXR5IHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmN1cnJlbnRFZGl0b3JVdWlkICYmIHRoaXMuZWRpdG9yTWFwLmdldCh0aGlzLmN1cnJlbnRFZGl0b3JVdWlkKTtcbiAgICAgICAgY29uc29sZS5sb2coYGN1cnJlbnQgZWRpdG9yOiAke3RoaXMuY3VycmVudEVkaXRvclV1aWR9IGApO1xuICAgICAgICByZXR1cm4gZWRpdG9yID8gYXdhaXQgZWRpdG9yLmVuY29kZSgpIDogbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDluo/liJfljJblvZPliY3mraPlnKjnvJbovpHnmoTlnLrmma/vvIjlkKvmnKrkv53lrZjmlLnliqjvvInvvIzov5Tlm57lj6/ooqsgbG9hZFdpdGhKc29uIOWKoOi9veeahCBKU09OIOWtl+espuS4suOAglxuICAgICAqIOeUqOS6juOAjFByZXZpZXcgaW4gRWRpdG9y44CN77ya5oqK57yW6L6R5Zmo6YeM55qE5a6e5pe25Zy65pmv5Lqk57uZ5ri45oiP6L+Q6KGM5pe26aKE6KeI44CCXG4gICAgICog6K+l5pa55rOV57uPIFNlcnZpY2UgcHJveHkg6Ieq5Yqo5pq06Zyy5Yiw5rWP6KeI5Zmo5L6nIHdpbmRvdy5jbGkuU2NlbmUuRWRpdG9yLnF1ZXJ5U2NlbmVTZXJpYWxpemVkRGF0YeOAglxuICAgICAqL1xuICAgIGFzeW5jIHF1ZXJ5U2NlbmVTZXJpYWxpemVkRGF0YSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmN1cnJlbnRFZGl0b3JVdWlkICYmIHRoaXMuZWRpdG9yTWFwLmdldCh0aGlzLmN1cnJlbnRFZGl0b3JVdWlkKTtcbiAgICAgICAgaWYgKGVkaXRvciBpbnN0YW5jZW9mIFNjZW5lRWRpdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLnNlcmlhbGl6ZUN1cnJlbnQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1txdWVyeVNjZW5lU2VyaWFsaXplZERhdGFdIOW9k+WJjeayoeacieaJk+W8gOWcuuaZrycpO1xuICAgIH1cblxuICAgIGdldFJvb3ROb2RlKCk6IGNjLlNjZW5lIHwgY2MuTm9kZSB8IG51bGwge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmN1cnJlbnRFZGl0b3JVdWlkICYmIHRoaXMuZWRpdG9yTWFwLmdldCh0aGlzLmN1cnJlbnRFZGl0b3JVdWlkKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvciA/IGVkaXRvci5nZXRSb290Tm9kZSgpIDogbnVsbDtcbiAgICB9XG5cbiAgICBhc3luYyBvcGVuKHBhcmFtczogSU9wZW5PcHRpb25zKTogUHJvbWlzZTxURWRpdG9yRW50aXR5PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkxpZmVjeWNsZSgoKSA9PiB0aGlzLm9wZW5VbmxvY2tlZChwYXJhbXMpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIG9wZW5VbmxvY2tlZChwYXJhbXM6IElPcGVuT3B0aW9ucyk6IFByb21pc2U8VEVkaXRvckVudGl0eT4ge1xuICAgICAgICBjb25zdCB7IHVybE9yVVVJRCB9ID0gcGFyYW1zO1xuXG4gICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ2Fzc2V0TWFuYWdlcicsICdxdWVyeUFzc2V0SW5mbycsIFt1cmxPclVVSURdKTtcbiAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg6YCa6L+HICR7dXJsT3JVVUlEfSDml6Dms5XmiZPlvIDvvIzmn6Xor6LkuI3liLDor6XotYTmupDkv6Hmga9gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRFZGl0b3JVdWlkID0gdGhpcy5jdXJyZW50RWRpdG9yVXVpZDtcbiAgICAgICAgaWYgKGN1cnJlbnRFZGl0b3JVdWlkKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50RWRpdG9yID0gdGhpcy5lZGl0b3JNYXAuZ2V0KGN1cnJlbnRFZGl0b3JVdWlkKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50RWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlRWRpdG9yU2Vzc2lvbigpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRBc3NldEluZm8gPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAncXVlcnlBc3NldEluZm8nLCBbY3VycmVudEVkaXRvclV1aWRdKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY3VycmVudEVkaXRvci5jbG9zZSh7IHNhdmU6IEJvb2xlYW4oY3VycmVudEFzc2V0SW5mbykgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvck1hcC5kZWxldGUoY3VycmVudEVkaXRvclV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRFZGl0b3JVdWlkID09PSBjdXJyZW50RWRpdG9yVXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRFZGl0b3JVdWlkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0SW50ZXJuYWwoSW50ZXJuYWxTZXJ2aWNlRXZlbnRzLkVkaXRvckRpc3Bvc2VkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlRWRpdG9yU2Vzc2lvbigpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEVkaXRvclV1aWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvdXRwdXREZXBlbmRlbnRJbmZvID0gYXN5bmMgKGVycjogYW55KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJwYyA9IFJwYy5nZXRJbnN0YW5jZSgpO1xuICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gYXdhaXQgZW5yaWNoTWlzc2luZ0RlcGVuZGVuY3lFcnJvcihlcnIubWVzc2FnZSB8fCAnJywgdXJsT3JVVUlELFxuICAgICAgICAgICAgICAgICAgICAodXVpZCkgPT4gcnBjLnJlcXVlc3QoJ2Fzc2V0TWFuYWdlcicsICdxdWVyeUFzc2V0SW5mbycsIFt1dWlkXSksXG4gICAgICAgICAgICAgICAgICAgIChtYWluVXVpZCwgc3ViSWQpID0+IHJwYy5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAncXVlcnlTdWJBc3NldE5hbWUnLCBbbWFpblV1aWQsIHN1YklkXSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB1dWlkID0gYXNzZXRJbmZvLnV1aWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKblt7Lnu4/mnInlr7nlupTnmoTnvJbovpHlmajlrp7kvotcbiAgICAgICAgICAgIGxldCBlZGl0b3IgPSB0aGlzLmVkaXRvck1hcC5nZXQodXVpZCk7XG4gICAgICAgICAgICBpZiAoIWVkaXRvcikge1xuICAgICAgICAgICAgICAgIGVkaXRvciA9IHRoaXMuY3JlYXRlRWRpdG9yKGFzc2V0SW5mby50eXBlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvck1hcC5zZXQodXVpZCwgZWRpdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGVuY29kZSA9IGF3YWl0IGVkaXRvci5vcGVuKGFzc2V0SW5mbywgcGFyYW1zKTtcblxuICAgICAgICAgICAgdGhpcy5fY2xlYXJVbmRvSGlzdG9yeSgpO1xuXG4gICAgICAgICAgICAvLyDorr7nva7lvZPliY3miZPlvIDnmoTnvJbovpHlmahcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEVkaXRvclV1aWQgPSBhc3NldEluZm8udXVpZDtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZUVkaXRvclNlc3Npb24oKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZWRpdG9yOm9wZW4nLCBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDmiZPlvIAgJHthc3NldEluZm8udXJsfWApO1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBhd2FpdCBvdXRwdXREZXBlbmRlbnRJbmZvKGVycik7XG4gICAgICAgICAgICB0aGlzLmVkaXRvck1hcC5kZWxldGUodXVpZCk7XG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50RWRpdG9yVXVpZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEVkaXRvclV1aWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBjbG9zZShwYXJhbXM6IElDbG9zZU9wdGlvbnMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuTGlmZWN5Y2xlKCgpID0+IHRoaXMuY2xvc2VVbmxvY2tlZChwYXJhbXMpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNsb3NlVW5sb2NrZWQocGFyYW1zOiBJQ2xvc2VPcHRpb25zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHVybE9yVVVJRCA9IHBhcmFtcy51cmxPclVVSUQgPz8gdGhpcy5jdXJyZW50RWRpdG9yVXVpZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFZGl0b3JVdWlkID0gdGhpcy5jdXJyZW50RWRpdG9yVXVpZDtcbiAgICAgICAgICAgIGlmICghdXJsT3JVVUlEIHx8ICFjdXJyZW50RWRpdG9yVXVpZCkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ2Fzc2V0TWFuYWdlcicsICdxdWVyeUFzc2V0SW5mbycsIFt1cmxPclVVSURdKTtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGFzc2V0SW5mb1xuICAgICAgICAgICAgICAgID8gdGhpcy5lZGl0b3JNYXAuZ2V0KGFzc2V0SW5mby51dWlkKVxuICAgICAgICAgICAgICAgIDogcGFyYW1zLmFsbG93RGVsZXRlZFNvdXJjZUZhbGxiYWNrICYmIHBhcmFtcy5leHBlY3RlZEN1cnJlbnRVdWlkID09PSBjdXJyZW50RWRpdG9yVXVpZFxuICAgICAgICAgICAgICAgICAgICA/IHRoaXMuZWRpdG9yTWFwLmdldChjdXJyZW50RWRpdG9yVXVpZClcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoIWVkaXRvcikge1xuICAgICAgICAgICAgICAgIGlmICghYXNzZXRJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg6YCa6L+HICR7dXJsT3JVVUlEfSDor7fmsYLotYTmupDlpLHotKVgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZUVkaXRvclNlc3Npb24oKTtcbiAgICAgICAgICAgIGlmIChwYXJhbXMuc2F2ZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVUZXJyYWluQXNzZXRzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBlZGl0b3IuY2xvc2UoeyBzYXZlOiBwYXJhbXMuc2F2ZSA/PyB0cnVlIH0pO1xuXG4gICAgICAgICAgICBpZiAoZWRpdG9yID09PSB0aGlzLmVkaXRvck1hcC5nZXQoY3VycmVudEVkaXRvclV1aWQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2xlYXJVbmRvSGlzdG9yeSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEVkaXRvclV1aWQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBbdXVpZCwgY2FuZGlkYXRlXSBvZiB0aGlzLmVkaXRvck1hcCkge1xuICAgICAgICAgICAgICAgIGlmIChjYW5kaWRhdGUgPT09IGVkaXRvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvck1hcC5kZWxldGUodXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2VkaXRvcjpjbG9zZScpO1xuICAgICAgICAgICAgLy8g55yf5q2j5YWz6Zet57yW6L6R5Zmo5pe255qE5Lya6K+d5riF55CG6L6555WM77yb6YeN6L295Y+q5aSN55So5YaF5a655Y246L29L+aMgui9vei+ueeVjOOAglxuICAgICAgICAgICAgdGhpcy5lbWl0SW50ZXJuYWwoSW50ZXJuYWxTZXJ2aWNlRXZlbnRzLkVkaXRvckRpc3Bvc2VkKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5YWz6ZetICR7YXNzZXRJbmZvPy51cmwgPz8gdXJsT3JVVUlEfWApO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOWFs+mXreWksei0pTogWyR7dXJsT3JVVUlEfV1gLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHNhdmUocGFyYW1zOiBJU2F2ZU9wdGlvbnMpOiBQcm9taXNlPElBc3NldEluZm8+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuTGlmZWN5Y2xlKCgpID0+IHRoaXMuc2F2ZVVubG9ja2VkKHBhcmFtcykpO1xuICAgIH1cblxuICAgIGFzeW5jIHNhdmVBcyhwYXJhbXM6IElTYXZlT3B0aW9ucyk6IFByb21pc2U8SUFzc2V0SW5mbz4ge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5MaWZlY3ljbGUoKCkgPT4gdGhpcy5zYXZlQXNVbmxvY2tlZChwYXJhbXMpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVVbmxvY2tlZChwYXJhbXM6IElTYXZlT3B0aW9ucyk6IFByb21pc2U8SUFzc2V0SW5mbz4ge1xuICAgICAgICBjb25zdCB1cmxPclVVSUQgPSBwYXJhbXMudXJsT3JVVUlEID8/IHRoaXMuY3VycmVudEVkaXRvclV1aWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGFzc2V0SW5mbywgY3VycmVudEVkaXRvclV1aWQsIGVkaXRvciB9ID0gYXdhaXQgdGhpcy5yZXNvbHZlU2F2ZVRhcmdldCh1cmxPclVVSUQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlVGVycmFpbkFzc2V0cygpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXNzZXRJbmZvLnV1aWQgPT09IGN1cnJlbnRFZGl0b3JVdWlkXG4gICAgICAgICAgICAgICAgPyBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG4gICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnJlY292ZXJEZWxldGVkU291cmNlVG8oYXNzZXRJbmZvLCBjdXJyZW50RWRpdG9yVXVpZCwgZWRpdG9yKTtcbiAgICAgICAgICAgIHRoaXMuYXNzZXJ0U2F2ZWRUYXJnZXQocmVzdWx0LCBhc3NldEluZm8pO1xuXG4gICAgICAgICAgICB0aGlzLl9tYXJrVW5kb1NhdmVkKCk7XG5cbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZWRpdG9yOnNhdmUnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDkv53lrZggJHthc3NldEluZm8udXJsfWApO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOS/neWtmOWksei0pTogWyR7dXJsT3JVVUlEfV1gLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBUZXJyYWluIGRhdGEgbGl2ZXMgaW4gLnRlcnJhaW4gYXNzZXRzLCBub3QgaW4gdGhlIHNjZW5lIEpTT04uICovXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlVGVycmFpbkFzc2V0cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRlcnJhaW4gPSAoU2VydmljZSBhcyBhbnkpLlRlcnJhaW47XG4gICAgICAgICAgICBpZiAoIXRlcnJhaW4/LnNhdmVBc3NldCkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGVycmFpbi5zYXZlQXNzZXQoZmFsc2UpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGVycmFpbiBhc3NldCBzYXZlIGZhaWxlZCBvciByZXF1aXJlcyBhIFNhdmUgQXMgdGFyZ2V0LicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gRHVyaW5nIGVhcmx5IGJvb3RzdHJhcCBvciBpc29sYXRlZCBlZGl0b3IgdGVzdHMgVGVycmFpblNlcnZpY2UgbWF5XG4gICAgICAgICAgICAvLyBub3QgYmUgcmVnaXN0ZXJlZC4gUmVhbCB0ZXJyYWluIHNhdmUgZmFpbHVyZXMgdXNlIHRoZSBleHBsaWNpdCBlcnJvciBhYm92ZS5cbiAgICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJ3JlcXVpcmVzIGEgU2F2ZSBBcycpKSB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVjb3ZlckRlbGV0ZWRTb3VyY2VUbyhhc3NldEluZm86IElBc3NldEluZm8sIGN1cnJlbnRFZGl0b3JVdWlkOiBzdHJpbmcsIGVkaXRvcjogU2NlbmVFZGl0b3IgfCBQcmVmYWJFZGl0b3IpOiBQcm9taXNlPElBc3NldEluZm8+IHtcbiAgICAgICAgY29uc3QgY3VycmVudEFzc2V0SW5mbyA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLnJlcXVlc3QoJ2Fzc2V0TWFuYWdlcicsICdxdWVyeUFzc2V0SW5mbycsIFtjdXJyZW50RWRpdG9yVXVpZF0pO1xuICAgICAgICBpZiAoY3VycmVudEFzc2V0SW5mbykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDkuI3og73kv53lrZjliLDpnZ7lvZPliY3otYTmupAgJHthc3NldEluZm8udXJsfe+8jOivt+S9v+eUqOWPpuWtmOS4umApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZWRpdG9yLnNhdmVBcyhhc3NldEluZm8pO1xuICAgICAgICB0aGlzLmFzc2VydFNhdmVkVGFyZ2V0KHJlc3VsdCwgYXNzZXRJbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5vcGVuVW5sb2NrZWQoeyB1cmxPclVVSUQ6IHJlc3VsdC51dWlkIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZUFzVW5sb2NrZWQocGFyYW1zOiBJU2F2ZU9wdGlvbnMpOiBQcm9taXNlPElBc3NldEluZm8+IHtcbiAgICAgICAgY29uc3QgdXJsT3JVVUlEID0gcGFyYW1zLnVybE9yVVVJRDtcbiAgICAgICAgaWYgKCF1cmxPclVVSUQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Y+m5a2Y5Li66ZyA6KaB5oyH5a6a55uu5qCH6LWE5rqQJyk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRJbmZvLCBlZGl0b3IgfSA9IGF3YWl0IHRoaXMucmVzb2x2ZVNhdmVUYXJnZXQodXJsT3JVVUlEKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGVkaXRvci5zYXZlQXMoYXNzZXRJbmZvKTtcbiAgICAgICAgICAgIHRoaXMuYXNzZXJ0U2F2ZWRUYXJnZXQocmVzdWx0LCBhc3NldEluZm8pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOWPpuWtmOS4uiAke2Fzc2V0SW5mby51cmx9YCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihg5Y+m5a2Y5Li65aSx6LSlOiBbJHt1cmxPclVVSUR9XWAsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXNvbHZlU2F2ZVRhcmdldCh1cmxPclVVSUQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBQcm9taXNlPHsgYXNzZXRJbmZvOiBJQXNzZXRJbmZvOyBjdXJyZW50RWRpdG9yVXVpZDogc3RyaW5nOyBlZGl0b3I6IFNjZW5lRWRpdG9yIHwgUHJlZmFiRWRpdG9yIH0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudEVkaXRvclV1aWQgPSB0aGlzLmN1cnJlbnRFZGl0b3JVdWlkO1xuICAgICAgICBpZiAoIXVybE9yVVVJRCB8fCAhY3VycmVudEVkaXRvclV1aWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5b2T5YmN5rKh5pyJ5omT5byA5Lu75L2V57yW6L6R5ZmoJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdhc3NldE1hbmFnZXInLCAncXVlcnlBc3NldEluZm8nLCBbdXJsT3JVVUlEXSk7XG4gICAgICAgIGlmICghYXNzZXRJbmZvKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOmAmui/hyAke3VybE9yVVVJRH0g6K+35rGC6LWE5rqQ5aSx6LSlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvck1hcC5nZXQoY3VycmVudEVkaXRvclV1aWQpO1xuICAgICAgICBpZiAoIWVkaXRvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflvZPliY3msqHmnInmiZPlvIDku7vkvZXnvJbovpHlmagnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuaXNTYXZlVGFyZ2V0Q29tcGF0aWJsZShlZGl0b3IsIGFzc2V0SW5mby50eXBlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDkuI3og73lsIYgJHtlZGl0b3IgaW5zdGFuY2VvZiBTY2VuZUVkaXRvciA/ICdzY2VuZScgOiAncHJlZmFiJ30g5L+d5a2Y5YiwICR7YXNzZXRJbmZvLnR5cGV9IOi1hOa6kGApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgYXNzZXRJbmZvLCBjdXJyZW50RWRpdG9yVXVpZCwgZWRpdG9yIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3NlcnRTYXZlZFRhcmdldChyZXN1bHQ6IElBc3NldEluZm8sIHRhcmdldDogSUFzc2V0SW5mbyk6IHZvaWQge1xuICAgICAgICBpZiAocmVzdWx0LnV1aWQgIT09IHRhcmdldC51dWlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOS/neWtmOebruagh+i1hOa6kOagh+ivhuS4jeS4gOiHtDog5pyf5pybICR7dGFyZ2V0LnV1aWR977yM5a6e6ZmFICR7cmVzdWx0LnV1aWR9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGlzU2F2ZVRhcmdldENvbXBhdGlibGUoZWRpdG9yOiBTY2VuZUVkaXRvciB8IFByZWZhYkVkaXRvciwgdGFyZ2V0VHlwZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChlZGl0b3IgaW5zdGFuY2VvZiBTY2VuZUVkaXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFR5cGUgPT09ICdzY2VuZScgfHwgdGFyZ2V0VHlwZSA9PT0gJ2NjLlNjZW5lQXNzZXQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YXJnZXRUeXBlID09PSAncHJlZmFiJyB8fCB0YXJnZXRUeXBlID09PSAnY2MuUHJlZmFiJztcbiAgICB9XG5cbiAgICBhc3luYyByZWxvYWQocGFyYW1zOiBJUmVsb2FkT3B0aW9ucyk6IFByb21pc2U8UmVsb2FkUmVzdWx0PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkxpZmVjeWNsZSgoKSA9PiB0aGlzLnJlbG9hZFVubG9ja2VkKHBhcmFtcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyByZWxvYWRGb3JTZXNzaW9uKHBhcmFtczogSVJlbG9hZE9wdGlvbnMsIHNlc3Npb246IElFZGl0b3JTZXNzaW9uU25hcHNob3QpOiBQcm9taXNlPFJlbG9hZFJlc3VsdD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5MaWZlY3ljbGUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQ3VycmVudEVkaXRvclNlc3Npb24oc2Vzc2lvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVsb2FkUmVzdWx0LkVESVRPUl9OT1RfRk9VTkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWxvYWRVbmxvY2tlZChwYXJhbXMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlbG9hZFVubG9ja2VkKHBhcmFtczogSVJlbG9hZE9wdGlvbnMpOiBQcm9taXNlPFJlbG9hZFJlc3VsdD4ge1xuICAgICAgICBpZiAodGhpcy5faXNSZWxvYWRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMubmVlZFJlbG9hZEFnYWluID0gcGFyYW1zO1xuICAgICAgICAgICAgcmV0dXJuIFJlbG9hZFJlc3VsdC5RVUVVRUQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faXNSZWxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB1cmxPclVVSUQgPSBwYXJhbXMudXJsT3JVVUlEID8/IHRoaXMuY3VycmVudEVkaXRvclV1aWQ7XG4gICAgICAgICAgICBpZiAoIXVybE9yVVVJRCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybign5b2T5YmN5rKh5pyJ5omT5byA5Lu75L2V57yW6L6R5ZmoJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5faXNSZWxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVsb2FkUmVzdWx0Lk5PX0VESVRPUjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgUnBjLmdldEluc3RhbmNlKCkucmVxdWVzdCgnYXNzZXRNYW5hZ2VyJywgJ3F1ZXJ5QXNzZXRJbmZvJywgW3VybE9yVVVJRF0pO1xuICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYOmAmui/hyAke3VybE9yVVVJRH0g6K+35rGC6LWE5rqQ5aSx6LSlYCk7XG4gICAgICAgICAgICAgICAgdGhpcy5faXNSZWxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVsb2FkUmVzdWx0LkFTU0VUX05PVF9GT1VORDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5lZGl0b3JNYXAuZ2V0KGFzc2V0SW5mby51dWlkKTtcbiAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGFzc2V0SW5mby51dWlkICE9PSB0aGlzLmN1cnJlbnRFZGl0b3JVdWlkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCflvZPliY3msqHmnInmiZPlvIDku7vkvZXnvJbovpHlmagnKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1JlbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybiBSZWxvYWRSZXN1bHQuRURJVE9SX05PVF9GT1VORDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZWxvYWRQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3VycmVudFBhcmFtczogSVJlbG9hZE9wdGlvbnMgfCBudWxsID0gcGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY3VycmVudFBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy53YWl0TG9ja3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmHjei9veS4jeaYr+WvueWklueahOe8lui+keWZqOWFs+mXrS/miZPlvIDvvJvov5nph4zlj6rlpI3nlKjlhoXpg6jlhoXlrrnljbjovb0v5oyC6L296L6555WM44CCXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRJbnRlcm5hbChJbnRlcm5hbFNlcnZpY2VFdmVudHMuRWRpdG9yUmVsb2FkQ2xvc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBlZGl0b3IucmVsb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdEludGVybmFsKEludGVybmFsU2VydmljZUV2ZW50cy5FZGl0b3JSZWxvYWRPcGVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50UGFyYW1zLnByZXNlcnZlVW5kb0hpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbGVhclVuZG9IaXN0b3J5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm5lZWRSZWxvYWRBZ2Fpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJhbXMgPSB0aGlzLm5lZWRSZWxvYWRBZ2FpbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5lZWRSZWxvYWRBZ2FpbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJhbXMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdCgnZWRpdG9yOnJlbG9hZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOmHjei9vSAke2Fzc2V0SW5mby51cmx9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFJlbG9hZFJlc3VsdC5TVUNDRVNTO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmVsb2FkUmVzdWx0LkZBSUxFRDtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbG9hZFByb21pc2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pc1JlbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKCkgYXMgYW55O1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWxvYWRQcm9taXNlIGFzIHVua25vd24gYXMgUHJvbWlzZTxSZWxvYWRSZXN1bHQ+O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aGlzLl9pc1JlbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIFJlbG9hZFJlc3VsdC5GQUlMRUQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJ1bkxpZmVjeWNsZTxUPihvcGVyYXRpb246ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgY29uc3QgcHJldmlvdXMgPSB0aGlzLmxpZmVjeWNsZVByb21pc2U7XG4gICAgICAgIGxldCByZWxlYXNlITogKCkgPT4gdm9pZDtcbiAgICAgICAgdGhpcy5saWZlY3ljbGVQcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHJlbGVhc2UgPSByZXNvbHZlO1xuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgcHJldmlvdXM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgb3BlcmF0aW9uKCk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICByZWxlYXNlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBjcmVhdGUocGFyYW1zOiBJQ3JlYXRlT3B0aW9ucyk6IFByb21pc2U8SUJhc2VJZGVudGlmaWVyPiB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuY3JlYXRlRWRpdG9yKHBhcmFtcy50eXBlKTtcbiAgICAgICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LiN5pSv5oyB6K+l57G75Z6L6LWE5rqQ5Yib5bu6Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF3YWl0IGVkaXRvci5jcmVhdGUocGFyYW1zKTtcbiAgICB9XG5cbiAgICBvblNjcmlwdEV4ZWN1dGlvbkZpbmlzaGVkKCk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZygnW1NjZW5lXSBTY3JpcHQgZXhlY3V0aW9uLWZpbmlzaGVkJyk7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuY3VycmVudEVkaXRvclV1aWQgJiYgdGhpcy5lZGl0b3JNYXAuZ2V0KHRoaXMuY3VycmVudEVkaXRvclV1aWQpO1xuICAgICAgICBpZiAoIWVkaXRvcikgcmV0dXJuO1xuXG4gICAgICAgIC8vIHJlbGVhc2VBc3NldCDotYTmupDvvIzkuLrkuoborqkgUHJlZmFiIOi1hOa6kOiDveWkn+WKoOi9veWIsOaWsOeahOiEmuacrO+8jOWcqOiEmuacrOabtOaWsOWQjumcgOimgemBjeWOhumHiuaUvuaJgOacieeahCBwcmVmYWIg6LWE5rqQXG4gICAgICAgIGNjLmFzc2V0TWFuYWdlci5hc3NldHMuZm9yRWFjaCgoYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKGFzc2V0IGluc3RhbmNlb2YgY2MuUHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgY2MuYXNzZXRNYW5hZ2VyLnJlbGVhc2VBc3NldChhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zb2xlLmxvZygnW1NjZW5lXSBTY3JpcHQgc3VzcGVuZCBzb2Z0IHJlbG9hZCcpO1xuICAgICAgICBTZXJ2aWNlLlNjcmlwdC5zdXNwZW5kKFByb21pc2UucmVzb2x2ZSh0aGlzLnJlbG9hZCh7fSkpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jbGVhclVuZG9IaXN0b3J5KCk6IHZvaWQge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgU2VydmljZS5VbmRvPy5jbGVhckhpc3RvcnkoKTtcbiAgICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgIC8vIFVuZG9TZXJ2aWNlIG1heSBub3QgYmUgcmVnaXN0ZXJlZCBkdXJpbmcgZWFybHkgZWRpdG9yIHNldHVwLlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfbWFya1VuZG9TYXZlZCgpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuVW5kbz8ubWFya1NhdmVkKCk7XG4gICAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAvLyBVbmRvU2VydmljZSBtYXkgbm90IGJlIHJlZ2lzdGVyZWQgZHVyaW5nIGVhcmx5IGVkaXRvciBzZXR1cC5cbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==