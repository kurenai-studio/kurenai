import type { AnimationMaskChange, AnimationMaskDump } from './@types/public';
export declare function queryAnimationMask(uuid: string): Promise<AnimationMaskDump>;
export declare function importAnimationMaskSkeleton(uuid: string, skeletonSourceUuid: string): Promise<AnimationMaskDump>;
export declare function clearAnimationMaskNodes(uuid: string): Promise<AnimationMaskDump>;
export declare function changeAnimationMaskDump(uuid: string, changes: AnimationMaskChange[]): Promise<AnimationMaskDump>;
export declare function saveAnimationMask(uuid: string): Promise<void>;
