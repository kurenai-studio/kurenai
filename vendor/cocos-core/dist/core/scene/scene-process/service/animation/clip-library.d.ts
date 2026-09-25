import { Animation, AnimationClip, Node, animation } from 'cc';
import type { IAnimationClipMenuItem, IAnimationClipsInfo } from '../../../common';
import type { IAnimationData } from './types';
export declare function queryNodeAnimationData(node: Node, preferredClipUuid?: string, options?: {
    allowEmpty?: boolean;
    recoverClipBinding?: boolean;
}): Promise<IAnimationData>;
export declare function queryAnimationClipsInfo(rootNode: Node): Promise<IAnimationClipsInfo>;
export declare function resolveAnimationClip(animData: IAnimationData, uuid?: string): AnimationClip;
export declare function decodeClipsMenu(clips: AnimationClip[]): IAnimationClipMenuItem[];
export declare function uniqAnimationClips(clips: AnimationClip[]): AnimationClip[];
export declare function visitAnimationClipsInController(controller: animation.AnimationController): Promise<AnimationClip[]>;
export declare function rebindAnimationComponentClip(animComp: Animation, clip: AnimationClip): void;
export declare function loadAnimationClip(uuid: string): Promise<AnimationClip | null>;
