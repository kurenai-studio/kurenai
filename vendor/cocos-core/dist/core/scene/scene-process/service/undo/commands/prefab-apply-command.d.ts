import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
import { type INodeStructureSnapshot } from './node-structure-command-utils';
export declare class PrefabApplyCommand implements IUndoCommand {
    private readonly before;
    private readonly after;
    private readonly assetUuid;
    private readonly assetSource;
    private readonly beforeAssetContent;
    private readonly afterAssetContent;
    meta: IUndoCommandMeta;
    constructor(type: string, label: string, before: INodeStructureSnapshot, after: INodeStructureSnapshot, assetUuid: string, assetSource: string, beforeAssetContent: string, afterAssetContent: string);
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
    private _apply;
}
