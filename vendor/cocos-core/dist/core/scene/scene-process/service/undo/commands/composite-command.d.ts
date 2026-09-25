import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
export declare class CompositeCommand implements IUndoCommand {
    meta: IUndoCommandMeta;
    private readonly children;
    constructor(meta: IUndoCommandMeta, children: IUndoCommand[]);
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
