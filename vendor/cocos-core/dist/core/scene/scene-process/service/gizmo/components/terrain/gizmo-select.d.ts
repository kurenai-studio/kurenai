import { Terrain } from 'cc';
import type { Texture2D } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import { TerrainEditor } from './terrain-editor';
import { eTerrainEditorMode } from './terrain-editor-mode';
import type { ITerrainBlockData, ITerrainEditorState, ITerrainPaintSessionPatch, ITerrainSculptSessionPatch, TerrainEditorMode } from '../../../../../common';
import type { GizmoMouseEvent } from '../../utils/defines';
interface IBrush {
    radius: number;
    strength: number;
    _setHeight: number;
}
interface ITerrainInfo {
    tileSize: number;
    weightMapSize: number;
    lightMapSize: number;
    blockCount: number[];
}
/** Component gizmo containing all Terrain editing operations. */
export default class TerrainGizmo extends GizmoBase<Terrain> {
    private _editor;
    private _isEditorInit;
    private _isShiftDown;
    private _isConcave;
    private _isSmooth;
    private _isFlatten;
    private _isSetHeight;
    get editor(): TerrainEditor;
    get isConcave(): boolean;
    get isSmooth(): boolean;
    get isFlatten(): boolean;
    get isSetHeight(): boolean;
    applySmooth(value: boolean): void;
    get isTerrainChange(): boolean;
    set isTerrainChange(value: boolean);
    protected init(): void;
    protected onShow(): void;
    protected onHide(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
    onEditorCameraMoved(): void;
    private initEditor;
    /**
     * Internal adapter for TerrainService. It intentionally returns plain data
     * instead of exposing this gizmo or its editor internals to Scene callers.
     */
    readTerrainState(): ITerrainEditorState;
    setTerrainMode(mode: TerrainEditorMode): void;
    setTerrainCurrentLayer(currentLayer: number): void;
    updateTerrainSculptSession(patch: ITerrainSculptSessionPatch): void;
    updateTerrainPaintSession(patch: ITerrainPaintSessionPatch): void;
    readTerrainBlock(): ITerrainBlockData | null;
    private getTerrainMode;
    private getTerrainSculptTool;
    private setTerrainSculptTool;
    private getTerrainBrushState;
    private updateTerrainBrush;
    private getTerrainBrushEditor;
    addLayerByUuid(uuid: string): Promise<number>;
    /** Applies a service-validated Sculpt brush texture without changing Terrain asset state. */
    setSculptBrushTexture(texture: Texture2D | null): void;
    /** Applies a service-validated Paint brush texture without changing Terrain asset state. */
    setPaintBrushTexture(texture: Texture2D | null): void;
    setSculptBrushRotation(rotation: number): Promise<void>;
    setLayerValue(index: number, uuid: string, extVal: any): Promise<number | null>;
    removeLayerByIndex(index: number): void;
    setCurrentEditLayer(index: number): void;
    getLayers(): ({
        detailMap: string | null;
        metallic: number;
        normalMap: string | null;
        roughness: number;
        tileSize: number;
    } | null)[];
    getCurrentEditLayer(): number;
    setCurrentEditMode(mode: eTerrainEditorMode, option?: any): void;
    queryTerrainInfo(): ITerrainInfo | null;
    changeTerrainInfo(info: any): void;
    queryBrushOfMode(mode: eTerrainEditorMode): IBrush | null;
    setBrushOfMode(mode: eTerrainEditorMode, setting: any): void;
    getBlockInfo(): {
        index: {
            x: number;
            y: number;
        };
        weight: {
            data: number[];
            width: number;
            height: number;
        } | null;
        layers: any[];
    };
    emitNodeChange(): void;
    onKeyDown(event: any): void;
    onKeyUp(event: any): void;
    onUpdate(deltaTime: number): void;
    onCameraControlModeChanged(mode: number): void;
    updateTerrainAsset(): void;
    onControllerMouseDown(event: GizmoMouseEvent): void;
    onControllerMouseMove(event: GizmoMouseEvent): void;
    onControllerMouseUp(event: GizmoMouseEvent): void;
    onControllerHoverOut(): void;
}
export {};
