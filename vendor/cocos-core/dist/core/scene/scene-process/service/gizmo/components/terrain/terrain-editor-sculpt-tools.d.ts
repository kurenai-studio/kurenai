import type { Terrain } from 'cc';
import { TerrainEdModifierKeyState } from './terrain-brush';
export declare enum eTerrainTerrainEditorSculptToolMode {
    SCULPT = 0,
    SMOOTH = 1,
    FLATTEN = 2,
    SET_HEIGHT = 3
}
export declare class TerrainEditorSculptTool {
    start(_terrain: Terrain, _x: number, _y: number): void;
    apply(_terrain: Terrain, _x: number, _y: number, h: number, _delta: number, _modifiers: TerrainEdModifierKeyState): number;
}
export declare class TerrainEditorSculptTool_Sculpt extends TerrainEditorSculptTool {
    _concave: boolean;
    constructor(_concave: boolean);
    apply(_terrain: Terrain, _x: number, _y: number, h: number, delta: number, modifiers: TerrainEdModifierKeyState): number;
}
export declare class TerrainEditorSculptTool_Smooth extends TerrainEditorSculptTool {
    apply(terrain: Terrain, x: number, y: number, h: number, delta: number): number;
}
export declare class TerrainEditorSculptTool_Flatten extends TerrainEditorSculptTool {
    protected _height: number;
    start(terrain: Terrain, x: number, y: number): void;
    apply(_terrain: Terrain, _x: number, _y: number, h: number, delta: number): number;
}
export declare class TerrainEditorSculptTool_SetHeight extends TerrainEditorSculptTool_Flatten {
    constructor(height: number);
    start(_terrain: Terrain, _x: number, _y: number): void;
}
