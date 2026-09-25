import { Camera, Terrain, TerrainBlock, Texture2D } from 'cc';
import type { ITerrainBlockLayerSlot } from '../../../../../common';
import { TerrainEditorMode } from './terrain-editor-mode';
export declare class TerrainEditorWeightMapData {
    data: Uint8Array<ArrayBuffer>;
    width: number;
    height: number;
}
/** Block picker and read-only data provider for the terrain float window. */
export declare class TerrainEditorSelect extends TerrainEditorMode {
    private _selectMaterial;
    private _selectBlock;
    private _weightMap;
    private _weightData;
    private _layerList;
    constructor(gizmo: any);
    setSelectBlock(block: TerrainBlock | null): void;
    getSelectBlock(): TerrainBlock | null;
    getCurrentBlockIndex(): number[] | null;
    getCurrentWeightMap(): Texture2D | null;
    getCurrentWeightData(): TerrainEditorWeightMapData | null;
    getCurrentLayerList(): (Texture2D | null)[];
    /** Returns the Terrain-layer identity behind each RGBA slot without changing the legacy texture list. */
    getCurrentBlockLayerSlots(): Array<ITerrainBlockLayerSlot | null>;
    onDeactivate(): void;
    forceUpdate(): void;
    onMouseDown(terrain: Terrain, camera: Camera, x: number, y: number): void;
    private _updateBlockSelectMaterial;
}
