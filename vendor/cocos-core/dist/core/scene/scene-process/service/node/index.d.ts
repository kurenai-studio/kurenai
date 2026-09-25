import { IProperty } from '../../../@types/public';
import { Node, Component } from 'cc';
import { type INodeEvents, type INode } from '../../../common';
import { type IScene } from '../../../common/editor/scene';
/**
 * 节点管理器
 *
 * Events:
 *   node.on('before-change', (node) => {});
 *   node.on('before-add', (node) => {});
 *   node.on('before-remove', (node) => {});
 *   node.on('change', (node) => {});
 *   node.on('add', (node) => {});
 *   node.on('remove', (node) => {});
 */
export declare class NodeManager {
    emit<K extends keyof INodeEvents>(event: K, ...args: INodeEvents[K]): void;
    emit(event: string, ...args: any[]): void;
    private _previewPropertysCache;
    get creatableAssetTypes(): string[];
    init(): void;
    /**
     * 传入一个场景，将内部的节点全部缓存
     * @param {*} scene
     */
    initWithScene(scene: any): void;
    private registerEventListenersForCurrentSceneNodes;
    onEditorOpened(): void;
    onEditorClosed(): void;
    private readonly NodeMgrEventHandlers;
    private nodeMgrEventHandlers;
    /**
     * 注册引擎 Node 管理相关事件的监听
     */
    registerNodeMgrEvents(): void;
    unregisterNodeMgrEvents(): void;
    private readonly NodeHandlers;
    private nodeHandlers;
    /**
     * 监听引擎发出的 node 事件
     * @param {*} node
     */
    registerEventListeners(node: Node): void;
    /**
     * 取消监听引擎发出的node事件
     * @param {*} node
     */
    unregisterEventListeners(node: Node): void;
    onNodeTransformChanged(node: Node, transformBit: any): void;
    onNodeSizeChanged(node: Node): void;
    onNodeAnchorChanged(node: Node): void;
    /**
     * 监听引擎中节点 node.setParent(parent) 所发出来的事件
     * @param {*} parent
     * @param {*} child
     */
    onNodeParentChanged(parent: Node, child: Node): void;
    /**
     * 监听light-probe changed事件
     */
    onLightProbeChanged(node: Node): void;
    onLightProbeBakingChanged(node: Node): void;
    /**
     * 清空当前管理的节点
     */
    clear(): void;
    /**
     * 添加一个节点到管理器内
     * @param {*} node
     */
    add(uuid: string, node: Node): void;
    /**
     * 一个节点被修改,由EditorExtends.Node.emit('change')触发
     * @param uuid
     * @param node
     */
    change(uuid: string, node: Node): void;
    /**
     * 从管理器内移除一个指定的节点
     * @param {*} node
     */
    remove(uuid: string, node: Node): void;
    /**
     * 查询一个节点的实例
     * @param {*} uuid
     * @return {cc.Node}
     */
    query(uuid: string | undefined): Node | null;
    getPathByUuid(uuid: string): string;
    /**
     * 查询受管理的所有节点的 uuid 数组
     */
    queryUuids(): string[];
    /**
     * 查询一个节点，并返回该节点的 dump 数据
     * 如果节点已被删除 parent = null，则返回 null
     * @param {String} uuid
     */
    queryDump(uuid: string): Promise<INode | IScene | null>;
    /**
     * 查询一个节点，并返回该节点的 dump 数据
     * 不论节点是否被删除
     * @param {String} uuid
     */
    queryDumpAtAll(uuid: string): Promise<INode | IScene | null>;
    /**
     * 查询当前场景的节点树信息
     * @param uuid asset uuid
     */
    queryNodesByAssetUuid(uuid: string): string[];
    /**
     * 获取丢失资源的节点
     * @returns uuids[] 节点数组
     */
    queryNodesMissAsset(): Promise<string[]>;
    /**
     * 预览设置属性后的效果，不进入undo堆栈
     * @param uuid
     * @param path
     * @param dump
     * @returns
     */
    previewSetNodeProperty(uuid: string, path: string, dump: IProperty): Promise<boolean>;
    cancelPreviewSetNodeProperty(uuid: string, path: string): Promise<boolean>;
    /**
     * 设置一个节点的属性
     * @param {*} uuid
     * @param {*} path
     * @param {*} key
     * @param {*} record 是否记录到undo堆栈上
     * @param {*} dump
     */
    setProperty(uuid: string, path: string, dump: IProperty, record?: boolean): Promise<boolean>;
    /**
     * 设置属性的默认值
     * @param {*} uuid
     * @param {*} path
     * @param {*} type
     */
    resetProperty(uuid: string, path: string): Promise<boolean>;
    /**
     * 将一个属性其现存值与定义类型值不匹配，或者为 null 默认值，改为一个可编辑的值
     * @param {*} uuid
     * @param {*} path
     */
    updatePropertyFromNull(uuid: string, path: string): Promise<boolean>;
    /**
     * 重置节点属性 position rotation scale
     * @param {*} uuid
     */
    resetNode(uuid: string): Promise<boolean>;
    /**
     * 设置某个节点连同它的子集的 layer 属性值
     * @param {*} uuid
     * @param {*} dump
     */
    setNodeAndChildrenLayer(uuid: string, dump: any): Promise<void>;
    /**
     * 调整一个数组类型的数据内某个 item 的位置
     * @param uuid 要被移动的节点或组件
     * @param path 数组的搜索路径
     * @param target 现在的索引位置
     * @param offset 偏移量
     */
    moveArrayElement(uuid: string, path: string, target: number, offset: number): boolean;
    /**
     * 删除一个数组元素
     * @param uuid 节点的 uuid
     * @param path 元素所在数组的搜索路径
     * @param index 目标 item 原来的索引
     */
    removeArrayElement(uuid: string, path: string, index: number): boolean;
    /**
     * 复制节点的动作，给下一步粘贴（创建）节点准备数据
     * @param {*} uuids 单个 string 或 array
     */
    copy(uuids: string | string[]): string[];
    getCopiedUuids(): string[];
    duplicate(uuids: string | string[]): string[];
    paste(target: string | null | undefined, uuids: string | string[], keepWorldTransform?: boolean): string[];
    /**
     * 挂载节点，如拖入和剪切
     * @param parent
     * @param uuids
     * @param keepWorldTransform
     */
    setParent(parent: string, uuids: string | string[], keepWorldTransform?: boolean): string[];
    /**
     * 实时获取新节点在一个父节点下的有效名称
     * 规则是 Node 同名时为 Node-001
     * @param name 名称
     * @param parentUuid 父节点 uuid
     */
    generateAvailableName(name: string, parentUuid?: string): string;
    createNodeFromStash(parentUuid: string | null | undefined, name: any, stashUuid: string | null, keepWorldTransform?: boolean, keepLayer?: boolean): undefined | string;
    /**
     * 确保节点有 UITransform 组件
     * 目前只需保障在创建空节点的时候检查任意上级是否为 canvas
     */
    ensureUITransformComponent(node: Node): void;
    restorePrefab(uuid: string, assetUuid: string): Promise<boolean>;
    private _walkNode;
    baseRemoveNode(node: Node, keepWorldTransform?: boolean): void;
    /**
     * 删除节点
     * @param {*} uuids
     * @param {*} keepWorldTransform
     */
    removeNode(uuids: string | string[], keepWorldTransform?: boolean): void;
    /**
     * 锁定一个节点不让其在场景中被选中
     * @param uuids 节点uuid
     * @param locked true | false
     * @param loop true | false 是否循环子孙级节点设置
     */
    changeNodeLock(uuids: string | string[], locked: boolean, loop: boolean): void;
    /**
     * 过滤根节点
     * 过滤子父包含的关系，只留下彼此独立的父节点 uuid
     * @param uuids
     */
    canRemoveOrCopy(uuids: string[]): string[];
    addComponentAt(node: Node, comp: Component, index: number): boolean;
}
declare const nodeManager: NodeManager;
export default nodeManager;
