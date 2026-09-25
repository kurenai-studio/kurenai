import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
import { type INodeStructureSnapshot } from './node-structure-command-utils';
export declare class PrefabUnwrapCommand implements IUndoCommand {
    private readonly before;
    private readonly after;
    private readonly removeNested;
    meta: IUndoCommandMeta;
    constructor(type: string, label: string, before: INodeStructureSnapshot, after: INodeStructureSnapshot, removeNested: boolean);
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
