import { Node, Component } from 'cc';
import { IComponent, INode, IScene } from '../../../common';
declare class DumpUtil {
    dumpProperty(node: Node, path: string): import("../../../@types/public").IProperty | INode | IScene | null;
    /**
     * 生成一个 node 的 dump 数据
     * @param {*} node
     */
    dumpNode(node: Node, options?: {
        includeComponents?: boolean;
    }): INode | IScene | null;
    dumpComponent(comp: Component): IComponent;
    dumpComponent(comp: null | undefined): null;
    /**
     * 恢复一个 dump 数据到 property
     * @param node
     * @param path
     * @param dump
     */
    restoreProperty(node: Node | Component, path: string, dump: any): Promise<any>;
    /**
     * 恢复某个属性的默认数据
     * @param node
     * @param path
     */
    resetProperty(node: Node | Component, path: string): void;
    /**
     * 将一个属性其现存值与定义类型值不匹配，或者为 null 默认值，改为一个可编辑的值
     * @param node
     * @param path
     */
    updatePropertyFromNull(node: Node | Component, path: string): void;
    /**
     * 还原一个节点的全部属性
     * @param {*} node
     * @param {*} dump
     */
    restoreNode(node: Node, dump: any): Promise<void | Node | null>;
    /**
     * 解析节点的访问路径
     * @param path
     * @returns
     */
    parsingPath(path: string, data: any): {
        search: string;
        key: string;
    };
    /**
     * encodeObject
     */
    encodeObject(object: any, attributes: any, owner?: any, objectKey?: string, isTemplate?: boolean): import("../../../@types/public").IProperty;
    /**
     * 获取类型的默认dump数据
     * @param type
     * @returns
     */
    getDefaultValue(type: string | undefined): any;
    /**
     * 恢复 node/scene snapshot 中的可编辑属性。
     *
     * 普通 Node 继续使用白名单，避免把结构字段交给 snapshot command。
     * Scene 的 dump 结构不同：顶层可编辑字段统一编码为 IProperty，
     * `_globals` 则是按属性名索引的 IProperty map，因此已纳入 snapshot command 的
     * Scene 属性可以按 dump 形状统一恢复；是否纳入 undo 不由这里决定。
     * 结构/身份字段和由 undo 层特殊处理的字段会被跳过。
     *
     * @see NODE_SNAPSHOT_RESTORE_PROPERTY_PATHS
     * @see SCENE_SNAPSHOT_SPECIAL_PROPERTY_KEYS
     */
    restoreNodeSnapshotProperties(node: Node, dump: any): Promise<void>;
    private restoreSceneSnapshotProperties;
    /**
     * 恢复 component snapshot 中的用户属性（跳过身份/编辑器字段，黑名单由 restore-policy 定义）。
     * 不包含 onRestore 生命周期调用等 undo 层逻辑。
     * @see COMPONENT_SNAPSHOT_RESTORE_SKIP_KEYS
     */
    restoreComponentSnapshotProperties(component: Component, dump: any): Promise<void>;
}
declare const _default: DumpUtil;
export default _default;
