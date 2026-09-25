import type { AnimationClip, AnimationState } from 'cc';
import type { IAnimationClipDump } from '../../../common';
import { type IPropertyCurveMetadataContext } from './property-curve';
export declare function createClipDump(clip: AnimationClip, state: AnimationState | undefined, options: {
    isSkeleton: boolean;
    useBakedAnimation: boolean;
} & IPropertyCurveMetadataContext): IAnimationClipDump;
