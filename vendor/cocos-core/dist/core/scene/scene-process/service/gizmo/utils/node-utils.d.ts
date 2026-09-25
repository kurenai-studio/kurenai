import { Node, Rect, Vec3 } from 'cc';
/**
 * 判断是否编辑器节点
 */
export declare function isEditorNode(node: Node): boolean;
/**
 * 对场景节点做射线检测，排除编辑器层和锁定节点
 * 与编辑器一致：使用 raycastAll 合并 3D 模型和 2D Canvas 的检测结果
 * Returns array of nodes sorted by distance
 */
export declare function getRaycastResultNodes(camera: any, x: number, y: number, mask?: number): Node[];
/**
 * 框选场景节点算法
 */
export declare function getRegionNodes(camera: any, left: number, right: number, top: number, bottom: number, mask?: number): Node[];
export declare function getNodeWorldBounds(node: Node): Rect;
export declare function getNodeWorldOrientedBounds(node: Node): Vec3[];
