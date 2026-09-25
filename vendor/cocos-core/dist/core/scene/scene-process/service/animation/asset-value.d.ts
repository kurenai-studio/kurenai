import { Asset } from 'cc';
export interface IAnimationAssetMetadata {
    type: {
        value: string;
    };
    valueCtor?: new () => unknown;
}
export declare function isAnimationAssetValue(value: unknown): value is Asset;
export declare function serializeAnimationAssetValue(value: Asset): {
    uuid: string;
} | null;
export declare function queryAnimationAssetUuid(value: unknown): string;
export declare function queryAnimationAssetCtor(metadata: IAnimationAssetMetadata | null | undefined): (new () => Asset) | null;
export declare function createAnimationAssetPlaceholder(assetCtor: new () => Asset, uuid: string): Asset;
export declare function loadAnimationAssetValue(assetCtor: new () => Asset, uuid: string): Promise<Asset>;
