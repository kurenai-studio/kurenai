import { BaseService } from './core';
import type { IRedoService, IUndoOperationOptions, IUndoRedoResult } from '../../common';
export declare class RedoService extends BaseService<Record<string, never[]>> implements IRedoService {
    redo(options?: IUndoOperationOptions): Promise<IUndoRedoResult>;
    canRedo(options?: IUndoOperationOptions): boolean;
}
