import { ReloadResult } from '../../../common';
import type { IReloadOptions } from '../../../common';
import type { IEditorSessionSnapshot } from '../core/editor-session';
export declare const PREFAB_SOFT_RELOAD_DEBOUNCE_MS = 500;
export declare const PREFAB_SOFT_RELOAD_WAIT_TIMEOUT_MS = 10000;
export interface IPrefabSoftReloadOptions {
    changedUuid?: string;
    deletedUuid?: string;
    preserveUndoHistory?: boolean;
    editorSession?: IEditorSessionSnapshot;
}
type ReloadEditor = (params: IReloadOptions, session?: IEditorSessionSnapshot) => Promise<ReloadResult>;
type EmitAssetReload = (uuid: string) => void;
type GetCurrentEditorSession = () => IEditorSessionSnapshot;
export declare class PrefabSoftReloadScheduler {
    private readonly _reloadEditor;
    private readonly _emitAssetReload;
    private readonly _getCurrentEditorSession;
    private readonly _debounceMs;
    private readonly _waitTimeoutMs;
    private _timer;
    private _assetUuids;
    private _preserveUndoHistory;
    private _editorSession;
    private _reloadWaiters;
    private _idleWaiters;
    private _flushPromise;
    constructor(_reloadEditor: ReloadEditor, _emitAssetReload: EmitAssetReload, _getCurrentEditorSession: GetCurrentEditorSession, _debounceMs?: number, _waitTimeoutMs?: number);
    schedule(options: IPrefabSoftReloadOptions): void;
    waitForAssetReload(uuid: string): {
        promise: Promise<void>;
        cancel: () => void;
    };
    invalidate(reason?: string): void;
    waitForIdle(): Promise<void>;
    private _flush;
    private _rejectAssetReloadWaiters;
    private _resolveAssetReloadWaiters;
    private _resolveAssetReloadWaiter;
    private _removeAssetReloadWaiter;
    private _resolveIdleWaitersIfIdle;
}
export {};
