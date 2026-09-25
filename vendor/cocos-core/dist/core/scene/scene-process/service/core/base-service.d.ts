import type { Node, Component } from 'cc';
import type { InternalServiceEventName } from './internal-events';
import type { IChangeNodeOptions } from '../../../common';
export interface IServiceEvents {
    onEditorOpened?(): void;
    onEditorReload?(): void;
    onEditorClosed?(): void;
    onEditorSaved?(): void;
    onNodeBeforeChanged?(node: Node): void;
    onBeforeRemoveNode?(node: Node): void;
    onBeforeAddNode?(node: Node): void;
    onNodeChanged?(node: Node, opts: IChangeNodeOptions): void;
    onBeforeNodeAdded?(node: Node): void;
    onAddNode?(node: Node): void;
    onRemoveNode?(node: Node): void;
    onNodeAdded?(node: Node): void;
    onNodeRemoved?(node: Node): void;
    onAddComponent?(comp: Component): void;
    onRemoveComponent?(comp: Component): void;
    onSetPropertyComponent?(comp: Component): void;
    onComponentAdded?(comp: Component): void;
    onComponentRemoved?(comp: Component): void;
    onBeforeChangeComponent?(node: Node): void;
    onBeforeAddComponent?(name: string, node: Node): void;
    onBeforeRemoveComponent?(comp: Component): void;
    onAssetDeleted?(uuid: string): void;
    onAssetChanged?(uuid: string): void;
    onAssetRefreshed?(uuid: string): void;
    onScriptExecutionFinished?(): void;
    onSelectionSelect?(path: string, paths: string[]): void;
    onSelectionUnselect?(path: string, paths: string[]): void;
    onSelectionClear?(): void;
}
export declare class BaseService<TEvents extends Record<string, any>> {
    protected isOpen: boolean;
    /**
     * 触发事件
     * @param event 事件名称
     * @param args 事件参数（根据事件类型自动推断）
     */
    protected emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void;
    /**
     * 只在场景进程内部转发的服务事件，不进入公共事件声明。
     */
    protected emitInternal(event: InternalServiceEventName, ...args: any[]): void;
    /**
     * 跨进程广播事件
     */
    broadcast<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void;
    /**
     * 监听事件
     * @param event 事件名称
     * @param listener 事件监听器
     */
    protected on<K extends keyof TEvents>(event: K, listener: TEvents[K] extends void ? () => void : (payload: TEvents[K]) => void): void;
    /**
     * 一次性监听事件
     * @param event 事件名称
     * @param listener 事件监听器
     */
    protected once<K extends keyof TEvents>(event: K, listener: TEvents[K] extends void ? () => void : (payload: TEvents[K]) => void): void;
    /**
     * 移除事件监听器
     * @param event 事件名称
     * @param listener 事件监听器
     */
    protected off<K extends keyof TEvents>(event: K, listener: TEvents[K] extends void ? () => void : (payload: TEvents[K]) => void): void;
    /**
     * 清除事件监听器
     * @param event 事件名称，如果不提供则清除所有
     */
    protected clear(event?: keyof TEvents): void;
}
