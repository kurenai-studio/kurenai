import { Component } from 'cc';
import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
import { type IComponentStructureSnapshot } from './component-command-utils';
export declare class RemoveComponentCommand implements IUndoCommand {
    private readonly snapshot;
    meta: IUndoCommandMeta;
    constructor(snapshot: IComponentStructureSnapshot);
    static capture(component: Component): RemoveComponentCommand | null;
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
