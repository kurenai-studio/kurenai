import { Animation, Node, animation } from 'cc';
import type { IAnimationValue } from '../../../common';
export declare function getAnimationMode(editorType: 'scene' | 'prefab' | 'unknown'): "unknown" | "prefab" | "general";
export declare function getNodeByUuid(uuid: string): Node | null;
export declare function getNodeByPath(path: string): Node | null;
export declare function getNodePath(node: Node): string;
export declare function resolveAnimationRelativeNodePath(rootNode: Node, rootPath: string, target: {
    nodePath?: string;
    nodeUuid?: string;
}): string | null;
export declare function queryAnimationRootNode(node: Node, editorRoot: Node | null): Node;
export declare function queryAnimationComponent(node: Node): Animation | animation.AnimationController | null;
export declare function isUsingBakedAnimation(rootNode: Node): boolean;
export declare function isSkeletonClip(uuid: string, rootNode?: Node | null): boolean;
export declare function readPropertyValue(node: Node, propKey: string): unknown;
export declare function extractSampledOperationValue(value: IAnimationValue, channel?: string): IAnimationValue;
