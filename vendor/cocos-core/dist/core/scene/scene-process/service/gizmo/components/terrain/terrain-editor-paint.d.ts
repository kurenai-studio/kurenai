import { Terrain, Texture2D, Vec3 } from 'cc';
import { TerrainBrush, TerrainBrushType } from './terrain-brush';
import { TerrainEditorMode } from './terrain-editor-mode';
import { TerrainWeightUndoRedo } from './terrain-operation';
export declare class TerrainEditorPaint extends TerrainEditorMode {
    _brushes: TerrainBrush[];
    _undo: TerrainWeightUndoRedo | null;
    _currentLayer: number;
    _currentBrush: TerrainBrush;
    constructor(gizmo: any);
    setCurrentBrush(type: TerrainBrushType): void;
    getCurrentBrush(): TerrainBrush;
    getBrush(type: TerrainBrushType): TerrainBrush;
    setBrushImage(texture: Texture2D | null): void;
    setCurrentLayer(layer: number): void;
    getCurrentLayer(): number;
    onUpdate(terrain: Terrain, deltaTime: number): void;
    onUpdateBrushPosition(terrain: Terrain, position: Vec3): void;
    onMouseDown(terrain: Terrain): void;
    onMouseUp(): void;
    forceUpdate(): void;
    onDeactivate(): void;
    private _updateWeight;
}
