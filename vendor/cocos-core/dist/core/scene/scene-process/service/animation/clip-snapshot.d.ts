import type { AnimationClip } from 'cc';
import type { IAnimationAuxiliaryCurveDump, IAnimationCurveDump, IAnimationEmbeddedPlayerDump, IAnimationEmbeddedPlayerGroup, IAnimationEventDump } from '../../../common';
import type { IPropertyCurveMetadataContext } from './property-curve';
export interface IAnimationClipSnapshot {
    duration: number;
    sample: number;
    speed: number;
    wrapMode: number;
    curves: IAnimationCurveDump[];
    events: IAnimationEventDump[];
    embeddedPlayers: IAnimationEmbeddedPlayerDump[];
    embeddedPlayerGroups: IAnimationEmbeddedPlayerGroup[];
    auxiliaryCurves: Record<string, IAnimationAuxiliaryCurveDump>;
}
export declare function captureAnimationClipSnapshot(clip: AnimationClip, options?: IPropertyCurveMetadataContext): IAnimationClipSnapshot;
export declare function restoreAnimationClipSnapshot(clip: AnimationClip, snapshot: IAnimationClipSnapshot): Promise<void>;
export declare function animationClipSnapshotsEqual(left: IAnimationClipSnapshot, right: IAnimationClipSnapshot): boolean;
