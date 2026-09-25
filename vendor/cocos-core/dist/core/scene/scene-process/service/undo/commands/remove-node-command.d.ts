import { Node } from 'cc';
import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
import { type INodeStructureSnapshot } from './node-structure-command-utils';
export declare class RemoveNodeCommand implements IUndoCommand {
    private readonly snapshot;
    private readonly keepWorldTransform?;
    meta: IUndoCommandMeta;
    constructor(snapshot: INodeStructureSnapshot, keepWorldTransform?: boolean | undefined);
    static capture(node: Node, keepWorldTransform?: boolean): RemoveNodeCommand | null;
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
