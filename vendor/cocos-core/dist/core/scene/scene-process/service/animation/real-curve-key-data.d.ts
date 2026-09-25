import type { IAnimationCurveKeyData } from '../../../common';
export interface IDumpRealKeyDataOptions {
    includeDefaults?: boolean;
}
export declare function createRealCurveValue(value: number, keyData?: IAnimationCurveKeyData): number | Record<string, unknown>;
export declare function createMergedRealCurveValue(value: number, existed: unknown, keyData?: IAnimationCurveKeyData): number | Record<string, unknown>;
export declare function dumpRealKeyData(value: any, options?: IDumpRealKeyDataOptions): IAnimationCurveKeyData;
export declare function copyRealKeyDataInternalMetadata(source: IAnimationCurveKeyData, target: IAnimationCurveKeyData): void;
export declare function queryRealCurveNumberValue(value: any): number;
export declare function queryRealCurveKeyframes(curve: {
    keyframes(): Iterable<[number, any]> | null | undefined;
}): Array<[number, any]>;
export declare function findRealCurveKey(curve: {
    keyframes(): Iterable<[number, any]>;
}, time: number): [number, any] | undefined;
export declare function setRealCurveKey(curve: {
    keyframes(): Iterable<[number, any]>;
    assignSorted(keyframes: Array<[number, unknown]>): void;
}, time: number, value: unknown): void;
export declare function updateRealCurveKeyData(curve: {
    keyframes(): Iterable<[number, any]>;
    assignSorted(keyframes: Array<[number, unknown]>): void;
}, time: number, keyData?: IAnimationCurveKeyData): boolean;
export declare function hasRealCurveKeyData(keyData: IAnimationCurveKeyData): boolean;
