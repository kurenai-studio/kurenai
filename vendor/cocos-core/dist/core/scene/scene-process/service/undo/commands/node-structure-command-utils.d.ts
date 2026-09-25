import { Node } from 'cc';
import { type IUndoCommandMeta, type IUndoRedoResult } from '../../../../common';
export { success, failure } from './command-utils-shared';
export interface INodeUuidSnapshot {
    uuid: string;
    componentUuids: string[];
    children: INodeUuidSnapshot[];
}
export interface INodeStructureSnapshot {
    uuid: string;
    path: string;
    parentUuid: string | null;
    parentPath: string;
    siblingIndex: number;
    serializedJson: string;
    prefabAssetUuid?: string;
    /** 子树 uuid 树（前序遍历的树根），用于 deserialize 后修复整棵树的 uuid */
    uuidTree: INodeUuidSnapshot;
}
export interface INodeStructureCaptureTarget {
    node: Node;
    path?: string;
}
export type NodeStructureSerialization = 'auto' | 'node' | 'prefab';
export interface INodeStructureCaptureOptions {
    serialization?: NodeStructureSerialization;
}
export declare function createNodeCommandMeta(type: string, label: string): IUndoCommandMeta;
export declare function captureNodeStructureSnapshot(node: Node, fallbackPath?: string, options?: INodeStructureCaptureOptions): INodeStructureSnapshot | null;
export declare function restoreNodeStructureSnapshot(snapshot: INodeStructureSnapshot, meta: IUndoCommandMeta): Promise<IUndoRedoResult>;
export declare function removeNodeStructureSnapshot(snapshot: INodeStructureSnapshot, meta: IUndoCommandMeta, keepWorldTransform?: boolean): IUndoRedoResult;
