import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
export interface ISnapshotAdapter {
    capture(uuids: string[]): Map<string, any> | Promise<Map<string, any>>;
    apply(data: Map<string, any>, direction: 'undo' | 'redo'): IUndoRedoResult | Promise<IUndoRedoResult>;
    equals(before: Map<string, any>, after: Map<string, any>): boolean;
}
export declare class SnapshotCommand implements IUndoCommand {
    meta: IUndoCommandMeta;
    private readonly before;
    private readonly after;
    private readonly adapter;
    constructor(meta: IUndoCommandMeta, before: Map<string, any>, after: Map<string, any>, adapter: ISnapshotAdapter);
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
