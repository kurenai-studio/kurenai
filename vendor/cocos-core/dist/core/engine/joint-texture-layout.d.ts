import type { ICustomJointTextureLayout, IJointTextureLayoutDeviceTip, IJointTextureLayoutPreviewResult, IResolvedCustomJointTextureLayout } from './@types/config';
type JointTextureLayoutAssetId = string | number | null | undefined;
interface IJointTextureLayoutContentInput {
    skeleton?: JointTextureLayoutAssetId;
    clips?: JointTextureLayoutAssetId[];
}
export interface IJointTextureLayoutAssetState {
    hash?: number;
    sample?: number;
    duration?: number;
    jointsLength?: number;
}
export interface IJointTextureLayoutResolver {
    readAssetState?: (uuid: string) => Promise<IJointTextureLayoutAssetState | null>;
    warn?: (message: string) => void;
    onMissingAsset?: (uuid: string) => void;
}
export declare function getJointTextureLayoutDeviceTip(textureLength: number): IJointTextureLayoutDeviceTip;
export declare function resolveCustomJointTextureLayouts(layouts: readonly ICustomJointTextureLayout[] | null | undefined, resolver?: IJointTextureLayoutResolver): Promise<IResolvedCustomJointTextureLayout[]>;
export declare function queryJointTextureLayoutPreview(layouts: readonly ICustomJointTextureLayout[] | null | undefined, resolver?: IJointTextureLayoutResolver): Promise<IJointTextureLayoutPreviewResult>;
export declare function calculateJointTextureLength(contents: readonly IJointTextureLayoutContentInput[], readAssetState?: (uuid: string) => Promise<IJointTextureLayoutAssetState | null>, resolver?: IJointTextureLayoutResolver): Promise<number>;
export declare function readJointTextureLayoutAssetState(uuid: string): Promise<IJointTextureLayoutAssetState | null>;
export {};
