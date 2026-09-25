import cc from 'cc';
import { BaseService } from './core';
import { IBaseIdentifier, ICloseOptions, ICreateOptions, IEditorEvents, IEditorService, IOpenOptions, IReloadOptions, ISaveOptions, ReloadResult, TEditorEntity } from '../../common';
import { IAssetInfo } from '../../../assets/@types/public';
import type { IEditorSessionService, IEditorSessionSnapshot } from './core/editor-session';
/**
 * EditorAsset - 统一的编辑器管理入口
 * 作为调度器，根据资源类型动态创建和管理编辑器实例
 */
export declare class EditorService extends BaseService<IEditorEvents> implements IEditorService, IEditorSessionService {
    private needReloadAgain;
    private lastSceneOrNode;
    private reloadPromise;
    private currentEditorUuid;
    private editorMap;
    private lockCount;
    private lockPromise;
    private lockResolve;
    private _isReloading;
    private lifecyclePromise;
    private editorSessionGeneration;
    lock(): Promise<void>;
    unlock(): void;
    waitLocks(): Promise<void>;
    /**
     * 当前编辑的类型
     */
    getCurrentEditorType(): 'scene' | 'prefab' | 'unknown';
    getCurrentEditorUuid(): string | null;
    getEditorSession(): IEditorSessionSnapshot;
    isCurrentEditorSession(session: IEditorSessionSnapshot): boolean;
    private invalidateEditorSession;
    /**
     * 是否打开场景
     */
    hasOpen(): Promise<boolean>;
    /**
     * 根据资源类型创建对应的编辑器
     */
    private createEditor;
    queryCurrent(): Promise<TEditorEntity | null>;
    /**
     * 序列化当前正在编辑的场景（含未保存改动），返回可被 loadWithJson 加载的 JSON 字符串。
     * 用于「Preview in Editor」：把编辑器里的实时场景交给游戏运行时预览。
     * 该方法经 Service proxy 自动暴露到浏览器侧 window.cli.Scene.Editor.querySceneSerializedData。
     */
    querySceneSerializedData(): Promise<string>;
    getRootNode(): cc.Scene | cc.Node | null;
    open(params: IOpenOptions): Promise<TEditorEntity>;
    private openUnlocked;
    close(params: ICloseOptions): Promise<boolean>;
    private closeUnlocked;
    save(params: ISaveOptions): Promise<IAssetInfo>;
    saveAs(params: ISaveOptions): Promise<IAssetInfo>;
    private saveUnlocked;
    /** Terrain data lives in .terrain assets, not in the scene JSON. */
    private saveTerrainAssets;
    private recoverDeletedSourceTo;
    private saveAsUnlocked;
    private resolveSaveTarget;
    private assertSavedTarget;
    private isSaveTargetCompatible;
    reload(params: IReloadOptions): Promise<ReloadResult>;
    reloadForSession(params: IReloadOptions, session: IEditorSessionSnapshot): Promise<ReloadResult>;
    private reloadUnlocked;
    private runLifecycle;
    create(params: ICreateOptions): Promise<IBaseIdentifier>;
    onScriptExecutionFinished(): void;
    private _clearUndoHistory;
    private _markUndoSaved;
}
