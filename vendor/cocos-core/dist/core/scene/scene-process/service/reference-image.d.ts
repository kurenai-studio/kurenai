import { IReferenceImageCancelOptions, IReferenceImageCommitOptions, IReferenceImageEvents, IReferenceImagePathOptions, IReferenceImagePreviewOptions, IReferenceImageService, IReferenceImageState, IReferenceImageVisibilityOptions } from '../../common';
import { BaseService } from './core';
/**
 * Editor-only reference image overlay. It owns no scene data: all runtime nodes
 * live under Gizmo.backgroundNode and are explicitly DontSave/hidden.
 */
export declare class ReferenceImageService extends BaseService<IReferenceImageEvents> implements IReferenceImageService {
    private config;
    private currentSceneUuid;
    private canvasNode;
    private imageNode;
    private sprite;
    private spriteFrame;
    private loadedPath;
    private missingPaths;
    private error;
    /** Last main-process authority revision applied to this Webview's renderer. */
    private authorityRevision;
    /** Runtime identity paired with authorityRevision to survive main-process restarts. */
    private authorityInstanceId;
    private authorityApplyQueue;
    private loadGeneration;
    private activeInteractionId;
    private interactionWatermark;
    private previewPatch;
    init(): Promise<void>;
    getState(): Promise<IReferenceImageState>;
    addAndSelect(options: IReferenceImagePathOptions): Promise<IReferenceImageState>;
    remove(options: IReferenceImagePathOptions): Promise<IReferenceImageState>;
    select(options: IReferenceImagePathOptions): Promise<IReferenceImageState>;
    clearBinding(): Promise<IReferenceImageState>;
    setVisible(options: IReferenceImageVisibilityOptions): Promise<IReferenceImageState>;
    refresh(): Promise<IReferenceImageState>;
    previewParameters(options: IReferenceImagePreviewOptions): Promise<IReferenceImageState>;
    commitParameters(options: IReferenceImageCommitOptions): Promise<IReferenceImageState>;
    cancelPreview(options: IReferenceImageCancelOptions): Promise<IReferenceImageState>;
    onEditorOpened(): void;
    onEditorClosed(): void;
    private onDimensionChanged;
    private handleDimensionChanged;
    /** Socket entrypoint; reconnects reconcile runtime even when authority revision is unchanged. */
    syncFromAuthority(publish?: boolean): Promise<void>;
    /** Pulls authority only; callers decide whether the renderer should be reconciled. */
    private pullAuthoritySnapshot;
    private reconcileCurrentEditor;
    /** Recreates or clears ephemeral editor objects without mutating authority state. */
    private reconcileRuntime;
    private createRuntimeStateKey;
    private loadBoundImage;
    private createSpriteFrameForPath;
    private readDataUrl;
    private createSpriteFrame;
    private ensureNodes;
    private replaceSpriteFrame;
    private clearRuntime;
    private applyCurrentParameters;
    private applyVisibility;
    private computeVisibility;
    private createState;
    private getCurrentPath;
    private requireCurrentScene;
    private requireCurrentImage;
    private getCurrentParameters;
    private mutateAuthority;
    private enqueueAuthoritySnapshot;
    private applyAuthoritySnapshot;
    private publishState;
    private invalidatePreview;
    private closeInteraction;
    private validatePath;
    private validateInteractionId;
    private validateParameters;
    private is2D;
    private getEditorSession;
    private isSessionCurrent;
}
