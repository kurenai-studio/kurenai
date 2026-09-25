import { AnimationClip } from 'cc';
import type { IAnimationAuxiliaryCurveDump, IAnimationCurveKeyData, IAnimationKeyValueDump } from '../../../common';
import { type IDumpRealKeyDataOptions } from './real-curve-key-data';
export declare function dumpAuxiliaryCurves(clip: AnimationClip, options?: IDumpRealKeyDataOptions): Record<string, IAnimationAuxiliaryCurveDump>;
export declare function addAuxiliaryCurve(clip: AnimationClip, name: string): boolean;
export declare function removeAuxiliaryCurve(clip: AnimationClip, name: string): boolean;
export declare function renameAuxiliaryCurve(clip: AnimationClip, name: string, newName: string): boolean;
export declare function createAuxKey(clip: AnimationClip, name: string, frameValue: unknown, value: unknown, keyData?: IAnimationCurveKeyData): boolean;
export declare function removeAuxKey(clip: AnimationClip, name: string, frameValue: unknown): boolean;
export declare function moveAuxKeys(clip: AnimationClip, name: string, framesValue: unknown, offsetValue: unknown): boolean;
export declare function copyAuxKey(clip: AnimationClip, name: string, frameValue: unknown, dstFrameValue: unknown): boolean;
export declare function updateAuxKeyData(clip: AnimationClip, name: string, frameValue: unknown, keyData?: IAnimationCurveKeyData): boolean;
export declare function queryAuxiliaryCurveValueAtFrame(clip: AnimationClip, name: string, frameValue: unknown): IAnimationKeyValueDump | null;
export declare function serializeAuxiliaryCurvesForMeta(clip: AnimationClip): Record<string, {
    curve: unknown;
}>;
export declare function replaceAuxiliaryCurves(clip: AnimationClip, curves: Record<string, IAnimationAuxiliaryCurveDump>): boolean;
