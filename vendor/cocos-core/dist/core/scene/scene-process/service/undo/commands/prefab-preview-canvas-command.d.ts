import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../../common';
export interface IPrefabPreviewCanvasCommandOptions {
    rootUuid: string;
    rootPath: string;
    rootParentUuid: string | null;
    rootParentPath: string;
    rootSiblingIndex: number;
    previewCanvasUuid: string;
    previewCanvasPath: string;
    removePreviewCanvasOnUndo: boolean;
    workMode: string;
}
export declare class PrefabPreviewCanvasCommand implements IUndoCommand {
    private readonly _options;
    meta: IUndoCommandMeta;
    private _previewCanvasUuid;
    private _previewCanvasPath;
    constructor(_options: IPrefabPreviewCanvasCommandOptions);
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
    private _findRoot;
    private _findPreviewCanvas;
    private _findOriginalParent;
    private _findNode;
    private _unregisterNodeTree;
}
