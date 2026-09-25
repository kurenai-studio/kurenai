import { Component, Node } from 'cc';
import type { IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
export declare function createUndoId(prefix: string): string;
export declare function success(meta: IUndoCommandMeta): IUndoRedoResult;
export declare function failure(meta: IUndoCommandMeta, reason: string): IUndoRedoResult;
export declare function snapshotMapsEqual<T>(before: Map<string, T>, after: Map<string, T>): boolean;
export declare function isNodeInCurrentScene(node: Node | null | undefined): node is Node;
export declare function getEditorExtends(): any;
export declare function getEditorNodeManager(): any;
export declare function getNodePath(node: Node): string;
/**
 * restoreNodeSnapshotDump 选项。
 * - updateNodeName：自定义节点 name 的恢复方式，不同调用方需要不同的编辑器通知。
 * - restoreNodeLocked：自定义节点 locked 状态的恢复方式。
 */
export interface IRestoreNodeSnapshotDumpOptions {
    updateNodeName?: (uuid: string, name: string) => void;
    restoreNodeLocked?: (node: Node, locked: boolean) => void;
}
/**
 * 从快照 dump 恢复节点属性。
 * - name：通过 updateNodeName 回调恢复；未传入时使用默认 EditorNodeManager，这是 undo 专用逻辑。
 * - 可编辑属性（active/layer/mobility/position/rotation/scale）：交给 dump 层恢复。
 * - locked：通过 objFlags bit 恢复，这是 undo 专用逻辑。
 * - 结构字段（uuid/parent/children/__comps__）：跳过，由 node-structure command 管理。
 */
export declare function restoreNodeSnapshotDump(node: Node, dump: any, options?: IRestoreNodeSnapshotDumpOptions): Promise<void>;
export declare function restoreNodeLockedFlag(node: Node, locked: boolean): void;
/**
 * 从快照 dump 恢复组件属性。
 * - 用户属性：交给 dump 层恢复，跳过列表由 dump 模块维护。
 * - onRestore 生命周期：属性恢复后调用。
 */
export declare function restoreComponentSnapshotDump(component: Component, dump: any): Promise<void>;
