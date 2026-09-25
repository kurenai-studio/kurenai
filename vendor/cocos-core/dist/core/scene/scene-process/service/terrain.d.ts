import { Component, Terrain } from 'cc';
import { BaseService } from './core';
import type { ITerrainEvents, ITerrainLayerPatch, ITerrainLayerState, ITerrainManageState, ITerrainPaintSessionPatch, ITerrainService, ITerrainSculptSessionPatch, ITerrainTarget, TerrainBlockReadResult, TerrainEditorMode, TerrainReadResult } from '../../common';
/**
 * Terrain asset lifecycle and target-safe editor-session access.
 *
 * The public Terrain capability never exposes gizmos. This service validates the
 * requested node/component pair, adapts the matching internal gizmo, and returns
 * canonical snapshots for direct Scene-webview access.
 */
export declare class TerrainService extends BaseService<ITerrainEvents> implements ITerrainService {
    readonly name: "cc.Terrain";
    readonly editedComponents: Terrain[];
    readonly selectedComponents: Terrain[];
    private _terrainUndoSequence;
    init(): void;
    private isTerrainComponent;
    private terrainOfNode;
    private terrainOfUuid;
    private resolveTarget;
    private invalidResult;
    /** Returns only the public UUID of the persisted Terrain asset, never the engine asset object. */
    private getTerrainAssetUuid;
    private readResolved;
    /** Returns a canonical snapshot or `valid: false`; it never falls back to another Terrain. */
    read(target: ITerrainTarget): TerrainReadResult;
    setMode(target: ITerrainTarget, mode: TerrainEditorMode): TerrainReadResult;
    setCurrentLayer(target: ITerrainTarget, currentLayer: number): TerrainReadResult;
    setSculptSession(target: ITerrainTarget, patch: ITerrainSculptSessionPatch): TerrainReadResult;
    /** Assigns a validated Texture2D asset to Sculpt, or clears it to restore the circle brush, without creating Scene Undo. */
    setSculptBrushAsset(target: ITerrainTarget, assetUuid: string | null): Promise<TerrainReadResult>;
    /** Assigns a validated Texture2D asset to Paint, or clears it to restore the circle brush, without creating Scene Undo. */
    setPaintBrushAsset(target: ITerrainTarget, assetUuid: string | null): Promise<TerrainReadResult>;
    private setBrushAsset;
    setPaintSession(target: ITerrainTarget, patch: ITerrainPaintSessionPatch): TerrainReadResult;
    /** Reads the currently inspected block only; no Terrain mutation or Undo occurs. */
    readBlock(target: ITerrainTarget): TerrainBlockReadResult;
    /** Commits a full Manage draft as one CLI-owned Terrain mutation and Undo command. */
    saveManage(target: ITerrainTarget, manage: ITerrainManageState): Promise<TerrainReadResult>;
    /** Adds one complete layer; incompatible or unavailable textures leave Terrain untouched. */
    addLayer(target: ITerrainTarget, layer: ITerrainLayerState): Promise<TerrainReadResult>;
    /** Removes a single layer slot as one CLI-owned Terrain mutation and Undo command. */
    removeLayer(target: ITerrainTarget, index: number): Promise<TerrainReadResult>;
    /** Updates one layer slot; texture references are resolved before the target can mutate. */
    updateLayer(target: ITerrainTarget, index: number, patch: ITerrainLayerPatch): Promise<TerrainReadResult>;
    private isLayerIndex;
    private isAttachedTerrain;
    private createTerrainInfo;
    private createTerrainLayer;
    private loadTerrainTexture;
    private loadLayerAssets;
    private applyTerrainManageState;
    private addTerrainLayer;
    private removeTerrainLayer;
    private updateTerrainLayer;
    private applyTerrainLayerStates;
    private reportTerrainAuthoringChange;
    private getTerrainUndoService;
    private pushTerrainUndo;
    private setManager;
    private setDirty;
    get isTerrainChange(): boolean;
    set isTerrainChange(value: boolean);
    select(nodeUuid: string): void;
    unselect(nodeUuid: string): void;
    onSelectionSelect(path: string): void;
    onSelectionUnselect(path: string): void;
    onSelectionClear(): void;
    onNodeRemoved(node: any): void;
    onComponentRemoved(component: Component): void;
    private removeComponent;
    onSculpt(node: any): void;
    serialize(component: Terrain): Uint8Array;
    saveAsset(isClose?: boolean, component?: Terrain): Promise<0 | 1 | 2>;
    saveAssetDialog(file?: string, isClose?: boolean): Promise<0 | 1 | 2>;
    close(): Promise<0 | 1 | 2>;
    addAssetToComp(assetUuid: string): Promise<void>;
    onAssetDeleted(uuid: string): void;
    onEditorClosed(): void;
    onEditorDisposed(): void;
}
