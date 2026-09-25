import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../common';
declare class UndoCommand implements IUndoCommand {
    toPerformUndo: boolean;
    meta: IUndoCommandMeta;
    perform(): Promise<IUndoRedoResult>;
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
}
type IDump = any;
type SceneUndoCommandID = string;
declare class SceneUndoCommand extends UndoCommand {
    tag: string;
    id: SceneUndoCommandID;
    auto: boolean;
    custom: boolean;
    uuids: string[];
    undoData: Map<string, IDump>;
    redoData: Map<string, IDump>;
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
    private applyData;
}
export { UndoCommand, SceneUndoCommand, SceneUndoCommandID };
