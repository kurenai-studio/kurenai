import { Terrain, TerrainBlock, Vec4 } from 'cc';
import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../../common';
export declare class TerrainHeightData {
    x: number;
    y: number;
    value: number;
}
/** A single height delta applied during one brush update. */
export declare class TerrainHeightOperation {
    protected _terrain: Terrain;
    data: TerrainHeightData[];
    constructor(terrain: Terrain);
    set terrain(value: Terrain);
    get terrain(): Terrain;
    push(x: number, y: number, value: number): void;
    apply(): void;
}
export declare class TerrainHeightUndoRedo extends TerrainHeightOperation implements IUndoCommand {
    readonly meta: IUndoCommandMeta;
    redoOperations: TerrainHeightOperation[];
    constructor(terrain: Terrain);
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
export declare class TerrainWeightData {
    x: number;
    y: number;
    value: Vec4;
}
export declare class TerrainWeightOperation {
    protected _terrain: Terrain;
    data: TerrainWeightData[];
    constructor(terrain: Terrain);
    set terrain(value: Terrain);
    get terrain(): Terrain;
    push(x: number, y: number, value: Vec4): void;
    apply(): void;
}
export declare class TerrainBlockLayerData {
    readonly block: TerrainBlock;
    readonly layers: number[];
    constructor(block: TerrainBlock, layers: number[]);
}
export declare class TerrainWeightUndoRedo extends TerrainWeightOperation implements IUndoCommand {
    readonly meta: IUndoCommandMeta;
    readonly undoBlockLayers: TerrainBlockLayerData[];
    readonly redoBlockLayers: TerrainBlockLayerData[];
    readonly redoOperations: TerrainWeightOperation[];
    constructor(terrain: Terrain);
    private applyLayers;
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
    pushBlock(block: TerrainBlock, undoLayers: number[], redoLayers: number[]): void;
}
/** Kept for API compatibility with the 3.x layer operation implementation. */
export declare class TerrainLayerOperation {
    protected _terrain: Terrain;
    protected _layers: (any)[];
    constructor(terrain: Terrain);
    set terrain(value: Terrain);
    get terrain(): Terrain;
    setLayers(): void;
    apply(): void;
}
export declare class TerrainLayerUndoRedo extends TerrainLayerOperation {
    redoOperations: TerrainLayerOperation[];
    undo(): void;
    redo(): void;
}
