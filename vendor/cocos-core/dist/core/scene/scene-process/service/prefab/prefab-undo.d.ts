import { Node } from 'cc';
import { type INodeStructureSnapshot } from '../undo/commands/node-structure-command-utils';
import type { IEditorSessionSnapshot } from '../core/editor-session';
export interface IPrefabReloadPreserveState {
    preserveUndoHistory: boolean;
    editorSession: IEditorSessionSnapshot | null;
}
export declare class PrefabUndoHelper {
    private _prefabReloadsPreservingUndoHistory;
    captureSnapshot(node: Node | null | undefined): INodeStructureSnapshot | null;
    pushNodeStructureCommand(type: string, label: string, before: INodeStructureSnapshot | null, after: INodeStructureSnapshot | null): void;
    pushUnwrapCommand(type: string, label: string, before: INodeStructureSnapshot | null, after: INodeStructureSnapshot | null, removeNested: boolean): void;
    pushApplyCommand(type: string, label: string, before: INodeStructureSnapshot | null, after: INodeStructureSnapshot | null, assetUuid: string, assetSource: string, beforeAssetContent: string, afterAssetContent: string): void;
    findNode(path: string, uuid?: string): Node | null;
    preserveUndoHistoryForPrefabReload(assetUuid: string, editorSession?: IEditorSessionSnapshot | null): void;
    cancelPreserveUndoHistoryForPrefabReload(assetUuid: string): void;
    consumePreserveUndoHistoryForPrefabReload(assetUuid: string): IPrefabReloadPreserveState;
    private _getPushablePair;
}
