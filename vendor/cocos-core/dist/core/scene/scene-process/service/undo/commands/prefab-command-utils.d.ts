import { Node } from 'cc';
import type { IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
import { type INodeStructureSnapshot } from './node-structure-command-utils';
export declare function replacePrefabNodeSnapshot(removeSnapshot: INodeStructureSnapshot, restoreSnapshot: INodeStructureSnapshot, meta: IUndoCommandMeta): Promise<IUndoRedoResult>;
export declare function findPrefabCommandNode(snapshot: INodeStructureSnapshot): Node | null;
export declare function nodeNotFound(meta: IUndoCommandMeta, snapshot: INodeStructureSnapshot): IUndoRedoResult;
