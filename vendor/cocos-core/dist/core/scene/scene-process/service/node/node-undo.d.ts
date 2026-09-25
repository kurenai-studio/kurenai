import { Node } from 'cc';
import { type IUndoScope } from '../../../common';
export interface INodeSnapshot {
    uuid: string;
    path: string;
    dump: any;
}
export interface INodeChildOrderSnapshot {
    parentUuid: string;
    parentPath: string;
    childUuids: string[];
}
export interface IComponentOrderSnapshot {
    nodeUuid: string;
    nodePath: string;
    componentUuids: string[];
}
export interface INodeReparentSnapshot extends INodeSnapshot {
    parentUuid: string | null;
    parentPath: string;
    siblingIndex: number;
}
type EmitNodeEvent = (event: string, ...args: any[]) => void;
export declare class NodeUndoHelper {
    private readonly _emit;
    constructor(_emit: EmitNodeEvent);
    shouldRecordStructureCommand(): boolean;
    collectSceneNodeUuids(): Set<string>;
    getCreateRootPath(path: string | undefined): string | null;
    recordCreateNodeCommand(beforeNodeUuids: Set<string> | null, preferredRootPaths?: string[]): void;
    recordNodeSnapshot(node: Node, options: {
        label: string;
        type: string;
        record?: boolean;
        scope?: IUndoScope;
    }, mutate: () => Promise<boolean>): Promise<boolean>;
    captureNodeSnapshots(nodes: Node[]): Map<string, INodeSnapshot>;
    collectNodeTree(node: Node): Node[];
    hasActiveRecordingForNodes(nodes: Node[]): boolean;
    findSnapshotNodes(snapshots: Map<string, INodeSnapshot>): Node[];
    captureReparentSnapshots(nodes: Node[]): Map<string, INodeReparentSnapshot>;
    recordReparentSnapshots(type: string, label: string, before: Map<string, INodeReparentSnapshot> | null, changedUuids: string[]): void;
    pushNodeSnapshotCommand(type: string, label: string, before: Map<string, INodeSnapshot>, after: Map<string, INodeSnapshot>, scope?: IUndoScope): void;
    moveArrayElementByUuid(uuid: string, path: string, target: number, offset: number): Promise<boolean>;
    moveChildArrayElementByUuid(uuid: string, path: string, target: number, offset: number): Promise<boolean>;
    private _moveComponentArrayElementByUuid;
    dedupeNodes(nodes: Node[]): Node[];
    snapshotMapsEqual(before: Map<string, any>, after: Map<string, any>): boolean;
    private _getPreferredNewRootNodes;
    private _getNewRootNodes;
    private _getRootStructureTargets;
    private _containsExistingNode;
    private _captureChildOrderSnapshot;
    private _createChildOrderSnapshotAdapter;
    private _applyChildOrderSnapshots;
    private _applyChildOrderSnapshot;
    private _findChildOrderParent;
    private _captureComponentOrderSnapshot;
    private _createComponentOrderSnapshotAdapter;
    private _applyComponentOrderSnapshots;
    private _applyComponentOrderSnapshot;
    private _findComponentOrderNode;
    private _createReparentSnapshotAdapter;
    private _applyReparentSnapshots;
    private _applyReparentSnapshot;
    private _findReparentParent;
    private _createNodeSnapshotAdapter;
    private _applyNodeSnapshots;
    private _applyNodeSnapshot;
    private _restoreNodeSnapshotDump;
    private _findSnapshotNode;
    private _cloneSnapshotDump;
    private _createUndoSnapshotId;
}
export {};
