import type { ISceneMouseEvent, OperationEvent } from './types';
export declare class OperationManager {
    private _events;
    addListener(type: OperationEvent, listener: Function, priority?: number): this;
    removeListener(type: OperationEvent, listener: Function): void;
    emit(type: string, ...args: any[]): void;
    emitMouseEvent(type: string, event: ISceneMouseEvent, dpr?: number): void;
}
