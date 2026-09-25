import { EventTarget } from '@cocos/engine/cocos/core';
type OperationMethod = (...args: any[]) => Promise<void>;
export interface OperationInfo {
    op: string;
    id: number;
    func: OperationMethod;
    args: any[];
    invoking: boolean;
}
/** @mangle */
export interface OperationQueueable {
    _operationQueue: OperationInfo[];
    _eventTarget: EventTarget;
}
/**
 * This is a method decorator for media player class such as Audio or Video.
 * Most of the operations in media player are asynchronous.
 * When all these asynchronous operations are called concurrently, they need to be queued.
 *
 * Note: the decorated class need to implement the interface `OperationQueueable`
 * and the decorated method should be declared as `(...args: any[]): Promise<void>`.
 *
 * When you apply `enqueueOperation` on a method, remember to provide a pure operation implementation.
 * It means that, for example, you can't call stop in the implementation of play operation,
 * because that would cause the operation deadlock.
 */
export declare function enqueueOperation<T extends OperationQueueable>(target: T, propertyKey: string, descriptor: TypedPropertyDescriptor<OperationMethod>): void;
export {};
