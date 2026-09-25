import { Terrain, Texture2D, Vec3 } from 'cc';
import { TerrainBrush, TerrainBrushType, TerrainEdModifierKeyState } from './terrain-brush';
import { TerrainEditorMode } from './terrain-editor-mode';
import { TerrainHeightUndoRedo } from './terrain-operation';
export declare class TerrainEditorSculpt extends TerrainEditorMode {
    _brushes: TerrainBrush[];
    _undo: TerrainHeightUndoRedo | null;
    _currentBrush: TerrainBrush;
    private _currentTool;
    constructor(gizmo: any);
    setCurrentBrush(type: TerrainBrushType): void;
    getCurrentBrush(): TerrainBrush;
    getBrush(type: TerrainBrushType): TerrainBrush;
    setBrushImage(texture: Texture2D | null): void;
    setSculptBrushRotation(rotation: number): void;
    onUpdate(terrain: Terrain, deltaTime: number, isShiftDown: boolean): void;
    forceUpdate(): void;
    onUpdateBrushPosition(terrain: Terrain, position: Vec3): void;
    onMouseDown(terrain: Terrain): void;
    onMouseUp(): void;
    _updateHeight(terrain: Terrain, deltaTime: number, modifiers: TerrainEdModifierKeyState): void;
}
