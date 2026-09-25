import { Component } from 'cc';
import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
import { type IComponentStructureSnapshot } from './component-command-utils';
export declare class AddComponentCommand implements IUndoCommand {
    private readonly snapshots;
    meta: IUndoCommandMeta;
    constructor(snapshots: IComponentStructureSnapshot[]);
    static capture(component: Component): AddComponentCommand | null;
    static captureMany(components: Component[]): AddComponentCommand | null;
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
