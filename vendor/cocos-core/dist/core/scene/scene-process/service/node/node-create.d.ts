import type { Asset } from 'cc';
import { Node, Scene } from 'cc';
/**
 * 根据资源 uuid 加载资源
 * @param uuid
 */
export declare function loadAny<TAsset extends Asset>(uuid: string): Promise<TAsset>;
export declare function createNodeByAsset(info: {
    uuid: string;
    canvasRequired?: boolean;
    type?: string;
    workMode?: string;
}): Promise<{
    node: Node;
    canvasRequired: boolean;
}>;
/**
 * Resolve the Canvas requirement of an asset without attaching a node to the scene.
 */
export declare function queryCanvasRequiredByAsset(info: {
    uuid: string;
    type?: string;
    workMode?: string;
}): Promise<boolean>;
/**
 * 创建一个隐藏与层级结构的 Canvas 节点
 * @param scene
 * @param workMode
 */
export declare function createShouldHideInHierarchyCanvasNode(scene: Scene, workMode?: string): Promise<Node>;
