import { Component } from 'cc';
import { type IUndoCommandMeta, type IUndoRedoResult } from '../../../../common';
export { success, failure } from './command-utils-shared';
export interface IComponentStructureSnapshot {
    uuid: string;
    path: string;
    nodeUuid: string;
    nodePath: string;
    index: number;
    type: string;
    dump: any;
}
export declare function createComponentCommandMeta(type: string, label: string): IUndoCommandMeta;
export declare function captureComponentStructureSnapshot(component: Component): IComponentStructureSnapshot | null;
export declare function removeComponentStructureSnapshot(snapshot: IComponentStructureSnapshot, meta: IUndoCommandMeta): IUndoRedoResult;
export declare function restoreComponentStructureSnapshot(snapshot: IComponentStructureSnapshot, meta: IUndoCommandMeta): Promise<IUndoRedoResult>;
