import { BaseService } from './core';
import type { ISceneMouseEvent, OperationEvent } from './operation/types';
export interface IOperationEvents {
    'pointer-lock': [locked: boolean];
    'pointer-change': [type: string];
}
export declare class OperationService extends BaseService<IOperationEvents> {
    private _manager;
    addListener(type: OperationEvent, listener: Function, priority?: number): void;
    removeListener(type: OperationEvent, listener: Function): void;
    dispatch(type: OperationEvent, ...args: any[]): void;
    emitMouseEvent(type: string, event: ISceneMouseEvent, dpr?: number): void;
    requestPointerLock(): void;
    exitPointerLock(): void;
    changePointer(type: string): void;
}
