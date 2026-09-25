import { Component, Node } from 'cc';
import { BaseService } from './core';
import { IComponentEvents, IAddComponentOptions, IComponentService, IQueryComponentOptions, IRemoveComponentOptions, IExecuteComponentMethodOptions, IComponent, IQueryClassesOptions, ISetPropertyOptions, IRecalculateLODGroupBoundsOptions, ILODGroupBoundsResult, IInsertLODOptions, IEraseLODOptions, IQueryLODGroupRelativeHeightOptions, ILODGroupLevelsResult, IRegeneratePolygon2DPointsOptions, IRegeneratePolygon2DPointsResult } from '../../common';
declare enum SceneModeType {
    General = "general",
    Prefab = "prefab",
    Animation = "animation",
    Preview = "preview",
    Unset = ""
}
export interface IOptionBase {
    modeName?: string;
}
interface ISceneEvents {
    onAddComponent?(comp: Component): void;
    onRemoveComponent?(comp: Component): void;
    onComponentAdded?(comp: Component, opts?: IOptionBase): void;
    onComponentRemoved?(comp: Component, opts?: IOptionBase): void;
}
export { ISceneEvents };
/**
 * 子进程节点处理器
 * 在子进程中处理所有节点相关操作
 */
export declare class ComponentService extends BaseService<IComponentEvents> implements IComponentService {
    modeName: SceneModeType;
    protected _sceneEventListener: ISceneEvents[];
    /**
     * 查询当前正在编辑的模式名字
     */
    queryMode(): SceneModeType;
    onAddComponent(comp: Component, opts?: IOptionBase): void;
    onRemoveComponent(comp: Component, opts?: IOptionBase): void;
    onComponentAdded(comp: Component, opts?: IOptionBase): void;
    onComponentRemoved(comp: Component, opts?: IOptionBase): void;
    dispatchEvents(eventName: keyof ISceneEvents, ...args: any[any]): void;
    private requireComponentList;
    private resolveComponentCtor;
    add(params: IAddComponentOptions): Promise<IComponent>;
    checkComponentsCollision(node: Node): Promise<void>;
    checkDynamicBodyShape(ndoe: Node): void;
    /**
     * 通过 path 查找组件实例，支持路径、UUID 或 URL
     */
    private findComponent;
    remove(params: IRemoveComponentOptions): Promise<boolean>;
    queryImpl(params: IQueryComponentOptions): Promise<IComponent | null>;
    query(params: IQueryComponentOptions | string): Promise<IComponent | null>;
    regeneratePolygon2DPoints(options: IRegeneratePolygon2DPointsOptions): Promise<IRegeneratePolygon2DPointsResult>;
    setProperty(options: ISetPropertyOptions): Promise<boolean>;
    private _shouldRecordComponentCommand;
    private _recordComponentSnapshot;
    private _recordComponentPropertySnapshot;
    private _captureComponentSnapshot;
    private _captureComponentPropertySnapshot;
    private _createComponentPropertySnapshotAdapter;
    private _applyComponentPropertySnapshots;
    private _resolveComponentPropertyTarget;
    private _createComponentAnimationPropPath;
    private _findSnapshotComponent;
    private _findSnapshotNode;
    private _snapshotMapsEqual;
    private _cloneSnapshotDump;
    private _restoreComponentSnapshotDump;
    private _getComponentType;
    private _createUndoSnapshotId;
    /**
     * 查询一个节点的实例
     * @param {*} uuid
     * @return {cc.Node}
     */
    queryNode(uuid: string | undefined): Node | null;
    queryAll(): Promise<string[]>;
    hasScript(name: string): Promise<boolean>;
    queryClasses(options?: IQueryClassesOptions): Promise<{
        name: string;
    }[]>;
    queryFunctionOfNode(path: string): Promise<any>;
    queryComponents(): Promise<Array<{
        name: string;
        cid: string;
        path: string;
    }>>;
    init(): void;
    private readonly CompMgrEventHandlers;
    private compMgrEventHandlers;
    /**
     * 注册引擎 Node 管理相关事件的监听
     */
    registerCompMgrEvents(): void;
    unregisterCompMgrEvents(): void;
    /**
     * 添加到组件缓存
     * @param {String} uuid
     * @param {cc.Component} component
     */
    onCompAdd(uuid: string, component: Component): void;
    /**
     * 移除组件缓存
     * @param {String} uuid
     * @param {cc.Component} component
     */
    onCompRemove(uuid: string, component: Component): void;
    /**
     * 重置组件
     * @param uuid component 的 uuid
     */
    reset(params: IQueryComponentOptions): Promise<boolean>;
    recalculateLODGroupBounds(options: IRecalculateLODGroupBoundsOptions): Promise<ILODGroupBoundsResult>;
    insertLOD(options: IInsertLODOptions): Promise<ILODGroupLevelsResult>;
    eraseLOD(options: IEraseLODOptions): Promise<ILODGroupLevelsResult>;
    queryLODGroupRelativeHeight(options: IQueryLODGroupRelativeHeightOptions): Promise<number>;
    executeMethod(options: IExecuteComponentMethodOptions): Promise<any>;
    getPathByUuid(uuid: string): string;
}
