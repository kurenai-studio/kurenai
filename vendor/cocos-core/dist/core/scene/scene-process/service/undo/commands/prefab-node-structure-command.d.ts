import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
import { type INodeStructureSnapshot } from './node-structure-command-utils';
export declare class PrefabNodeStructureCommand implements IUndoCommand {
    private readonly before;
    private readonly after;
    meta: IUndoCommandMeta;
    constructor(type: string, label: string, before: INodeStructureSnapshot, after: INodeStructureSnapshot);
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
