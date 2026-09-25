import { AnimationClip } from 'cc';
import type { IAnimationCurveDump, IAnimationPropertyType, IAnimationValue } from '../../../common';
import type { AnyCurve, AnyTrack, IPropertyTrackDescriptor, PropertyKind } from './property-curve-types';
export declare function findPropertyTrack(clip: AnimationClip, nodePath: string, propKey: string): AnyTrack | null;
export declare function createPropertyTrack(clip: AnimationClip, nodePath: string, descriptor: IPropertyTrackDescriptor): AnyTrack;
export declare function parsePropertyTrack(track: unknown): {
    nodePath: string;
    descriptor: IPropertyTrackDescriptor;
} | null;
export interface IAnimationTrackTarget {
    nodePath: string;
    propKey: string;
}
export declare function parseAnimationTrackTarget(path: any): IAnimationTrackTarget | null;
export declare function createPropertyDescriptor(propKey: string, value?: IAnimationValue, trackKind?: PropertyKind, track?: AnyTrack, propertyType?: IAnimationPropertyType, valueCtor?: new () => unknown): IPropertyTrackDescriptor | null;
export declare function createPropertyDescriptorFromDump(curve: IAnimationCurveDump): IPropertyTrackDescriptor | null;
export declare function removeSupportedPropertyTracks(clip: AnimationClip): void;
export declare function removeTrackIfEmpty(clip: AnimationClip, track: AnyTrack): void;
export declare function applyTrackExtrapolation(track: AnyTrack, preExtrap?: number, postExtrap?: number): void;
export declare function queryFirstRealCurve(track: AnyTrack): any | null;
export declare function queryTrackChannels(track: AnyTrack): Array<{
    curve: AnyCurve;
}>;
export declare function getClipTracks(clip: AnimationClip): AnyTrack[];
export declare function normalizePath(path: string): string;
