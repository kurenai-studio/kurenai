import { BaseService } from './core';
import { Component, Node, Scene } from 'cc';
import type { IApplyPrefabChangesParams, IChangeNodeOptions, ICreatePrefabFromNodeParams, IGetPrefabInfoParams, IIsPrefabInstanceParams, INode, IPrefab, IPrefabEvents, IPrefabService, IRevertToPrefabParams, IUnlinkPrefabParams, IUnpackPrefabInstanceParams } from '../../common';
export declare class PrefabService extends BaseService<IPrefabEvents> implements IPrefabService {
    private _softReload;
    private _undo;
    private _utils;
    init(): void;
    /**
     * 将节点转换为预制体资源
     */
    createPrefabFromNode(params: ICreatePrefabFromNodeParams): Promise<INode>;
    /**
     * 将节点的修改应用回预制体资源
     */
    applyPrefabChanges(params: IApplyPrefabChangesParams): Promise<boolean>;
    /**
     * 重置节点到预制体原始状态
     */
    revertToPrefab(params: IRevertToPrefabParams): Promise<boolean>;
    /**
     * 解耦预制体实例，使其成为普通节点
     */
    unpackPrefabInstance(params: IUnpackPrefabInstanceParams): Promise<INode>;
    /**
     * 检查节点是否为预制体实例
     */
    isPrefabInstance(params: IIsPrefabInstanceParams): Promise<boolean>;
    /**
     * 解绑预制体实例，使其成为普通节点
     */
    unlinkPrefab(params: IUnlinkPrefabParams): Promise<boolean>;
    /**
     * 获取节点的预制体信息
     */
    getPrefabInfo(params: IGetPrefabInfoParams): Promise<IPrefab | null>;
    onEditorOpened(): void;
    onEditorDisposed(): void;
    onNodeRemoved(node: Node): void;
    onNodeChangedInGeneralMode(node: Node, opts: IChangeNodeOptions, root: Node | Scene | null): void;
    onAddNode(node: Node): void;
    onNodeAdded(node: Node): void;
    onNodeChanged(node: Node, opts?: IChangeNodeOptions): void;
    onSetPropertyComponent(comp: Component, opts?: IChangeNodeOptions): void;
    removePrefabInfoFromNode(node: Node, removeNested?: boolean): void;
    checkToRemoveTargetOverride(source: Node | Component, root: Node | Scene | null): void;
    /**
     * 从一个节点生成一个PrefabAsset
     * @param nodeUUID
     * @param url
     * @param options
     */
    createPrefabAssetFromNode(nodeUUID: string, url: string, options?: {
        overwrite: boolean;
    }): Promise<Node | null>;
    /**
     * 将一个 node 与一个 prefab 关联到一起
     * @param nodeUUID
     * @param {*} assetUuid 关联的资源
     */
    linkNodeWithPrefabAsset(nodeUUID: string | Node, assetUuid: string | any): Promise<void>;
    /**
     * 从一个节点生成 prefab数据
     * 返回序列化数据
     * @param {*} nodeUUID
     */
    generatePrefabDataFromNode(nodeUUID: string | Node): {
        prefabData: string;
        clearedReference: any;
    } | null;
    /**
     * 还原一个PrefabInstance的数据为它所关联的PrefabAsset
     * @param nodeUUID node
     */
    revertPrefab(nodeUUID: Node | string): Promise<boolean>;
    getUnlinkNodeUuids(uuid: string, removeNested?: boolean): string[];
    /**
     * 解除PrefabInstance对PrefabAsset的关联
     * @param nodeUUID 节点或节点的UUID
     * @param removeNested 是否递归的解除子节点PrefabInstance
     */
    unWrapPrefabInstance(nodeUUID: string, removeNested?: boolean): boolean;
    unWrapPrefabInstanceInPrefabMode(nodeUUID: string | Node, removeNested?: boolean): boolean;
    /**
     * 将一个PrefabInstance的数据应用到对应的Asset资源上
     * @param nodeUUID uuid
     */
    applyPrefab(nodeUUID: string): Promise<boolean>;
    preserveUndoHistoryForPrefabReload(assetUuid: string, editorUuid?: string | null): void;
    cancelPreserveUndoHistoryForPrefabReload(assetUuid: string): void;
    onAddComponent(comp: Component): void;
    onComponentAdded(comp: Component): void;
    onRemoveComponentInGeneralMode(comp: Component, rootNode: Node | Scene | null): void;
    onComponentRemovedInGeneralMode(comp: Component, rootNode: Node | Scene | null): void;
    revertRemovedComponent(nodeUUID: string, fileID: string): Promise<void>;
    applyRemovedComponent(nodeUUID: string, fileID: string): Promise<void>;
    onAssetChanged(uuid: string): Promise<void>;
    onAssetDeleted(uuid: string): Promise<void>;
    /**
     * 将一个节点恢复到关联的 prefab 的状态
     * @param {*} nodeUuid
     */
    revert(nodeUuid: string): void;
    /**
     * 将一个节点的修改，应用到关联的 prefab 上
     * @param {*} nodeUuid
     */
    sync(nodeUuid: string): void;
    createNodeFromPrefabAsset(asset: any): Node | null;
    filterChildOfAssetOfPrefabInstance(uuids: string | string[], operationTips: string): string[];
    filterPartOfPrefabAsset(uuids: string | string[], operationTips: string): string[];
    filterChildOfPrefabAssetWhenRemoveNode(uuids: string | string[]): string[];
    filterChildOfPrefabAssetWhenSetParent(uuids: string | string[]): string[];
    canModifySibling(uuid: string, target: number, offset: number): boolean;
    filterPartOfPrefabAssetWhenCreateComponent(uuids: string | string[]): string[];
    filterPartOfPrefabAssetWhenRemoveComponent(uuids: string | string[]): string[];
    /**
     * 暴力遍历root所有属性，找到rule返回true的路径
     * 比如找Scene节点的路径，rule = (obj)=> return obj.globals
     * @param root 根节点
     * @param rule 判断函数
     * @returns
     */
    findPathWithRule(root: Node, rule: Function): string[];
}
declare const _default: PrefabService;
export default _default;
