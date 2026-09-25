import type { AnimationMaskChange, AnimationMaskDump } from './@types/public';
export declare const ANIMATION_MASK_TYPE = "cc.animation.AnimationMask";
export declare const JOINT_MASK_TYPE = "cc.JointMask";
export declare const PREFAB_TYPE = "cc.Prefab";
export declare const NODE_TYPE = "cc.Node";
export interface SerializedJointMask {
    __type__?: string;
    path: string;
    enabled: boolean;
}
export type SerializedNodeRef = {
    __id__: number;
};
export interface SerializedNode {
    __type__?: string;
    _name?: string;
    _children?: SerializedNodeRef[];
}
export declare function assertRecord(value: unknown, message: string): asserts value is Record<string, unknown>;
export declare function normalizeJointPath(path: string): string;
export declare function normalizeJointMasks(value: unknown): SerializedJointMask[];
export declare function jointMasksToDump(assetUuid: string, jointMasks: SerializedJointMask[]): AnimationMaskDump;
export declare function extractPrefabJointPaths(prefabJSON: unknown[]): string[];
export declare function applyJointChanges(jointMasks: SerializedJointMask[], changes: AnimationMaskChange[]): SerializedJointMask[];
