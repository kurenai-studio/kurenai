import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
import { type INodeStructureCaptureTarget, type INodeStructureSnapshot } from './node-structure-command-utils';
export declare class CreateNodeCommand implements IUndoCommand {
    private readonly snapshots;
    meta: IUndoCommandMeta;
    constructor(snapshots: INodeStructureSnapshot[]);
    static capture(targets: INodeStructureCaptureTarget[]): CreateNodeCommand | null;
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
