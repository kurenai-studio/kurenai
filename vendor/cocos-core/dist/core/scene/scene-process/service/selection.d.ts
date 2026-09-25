import { BaseService } from './core';
import type { ISelectionService, ISelectionEvents } from '../../common';
export declare class SelectionService extends BaseService<ISelectionEvents> implements ISelectionService {
    private _selections;
    private _onNodeChangedHandler?;
    init(): void;
    destroy(): void;
    private _onNodePathChanged;
    select(path: string): void;
    unselect(path: string): void;
    clear(): void;
    query(): string[];
    isSelect(path: string): boolean;
    reset(): void;
    private _getPaths;
    private _callFocusInEditor;
    private _callLostFocusInEditor;
}
