import type { IUndoCommand, IUndoCommandMeta, IUndoRedoResult } from '../../../common';
import type { IAnimationClipSnapshot } from './clip-snapshot';
interface IAnimationClipSnapshotCommandOptions {
    clipUuid: string;
    before: IAnimationClipSnapshot;
    after: IAnimationClipSnapshot;
    applySnapshot: (snapshot: IAnimationClipSnapshot) => Promise<void>;
}
export declare class AnimationClipSnapshotCommand implements IUndoCommand {
    private readonly options;
    readonly meta: IUndoCommandMeta;
    constructor(options: IAnimationClipSnapshotCommandOptions);
    undo(): Promise<IUndoRedoResult>;
    redo(): Promise<IUndoRedoResult>;
    private _apply;
}
export {};
