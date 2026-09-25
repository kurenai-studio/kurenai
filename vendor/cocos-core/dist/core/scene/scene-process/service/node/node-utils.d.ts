import { Node, Scene } from 'cc';
/**
 * 获取有效的 ui Canvas 的节点，向上和向下找
 * @param node 节点
 * @param prefabLimitRoot
 */
export declare function getUICanvasNode(node: Node | null, prefabLimitRoot?: boolean): Node | null;
/**
 * 获取有效的有 UITransform 组件的父节点，只向上找
 * @param node 节点
 */
export declare function getUITransformParentNode(node: Node | null): Node | null;
export declare function hasOneKindOfComponent(node: Node | Scene, kind: any): boolean;
/**
 * 生成一个 node-001 格式的可用节点名称
 * @param name 被检查的名称
 * @param parent 父级节点
 * @returns {string} path 可用名称的文件路径
 */
export declare function getNodeName(name: string, parent: Node): string;
/**
 * 设置节点层级
 * @param node - 当前节点
 * @param layer - 层级
 * @param deep - 是否递归同步子节点
 */
export declare function setLayer(node: Node, layer: number, deep: boolean): void;
/**
 * 是否是编辑节点
 * @param node
 */
export declare function isEditorNode(node: Node): boolean;
/**
 * 检测一个节点是否是某个节点的一部分
 * @param testNode 测试节点
 * @param rootNode 根节点
 */
export declare function isPartOfNode(testNode: Node, rootNode: Node): boolean;
