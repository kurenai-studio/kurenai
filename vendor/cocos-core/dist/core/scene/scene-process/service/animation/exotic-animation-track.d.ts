import type { AnimationClip } from 'cc';
export type ExoticAnimationTrackKey = 'position' | 'rotation' | 'scale';
export interface IExoticAnimationTrack {
    nodePath: string;
    key: ExoticAnimationTrackKey;
    times: ArrayLike<number>;
    values?: {
        get?: (index: number, value: Record<string, number>) => void;
    };
    type: 'cc.Vec3' | 'cc.Quat';
    partKeys?: readonly string[];
}
export declare function queryExoticAnimationTracks(clip: AnimationClip): IExoticAnimationTrack[];
