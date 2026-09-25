import type { AnimationClip, Node } from 'cc';
import type { IAnimationCurveDump } from '../../../common';
import { type IPropertyCurveMetadataContext } from './property-curve';
export declare function upgradeUntypedAnimationTracks(rootNode: Node, clip: AnimationClip): void;
export declare function dumpUntypedAnimationCurves(clip: AnimationClip, options: IPropertyCurveMetadataContext): IAnimationCurveDump[];
