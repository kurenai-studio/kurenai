export interface IAssetReferenceInfo {
    uuid: string;
    type: string;
    name?: string;
    url?: string;
    imported?: boolean;
    invalid?: boolean;
    extends?: string[];
    subAssets?: Record<string, IAssetReferenceInfo>;
}
export type AssetReferenceInfoQuery = (urlOrUuid: string) => IAssetReferenceInfo | null | Promise<IAssetReferenceInfo | null>;
export declare class AssetReferenceValidationError extends Error {
    readonly code = "INVALID_ASSET_REFERENCE";
    constructor(message: string);
}
export declare function getExpectedAssetType(propertyDump: any): string | null;
export declare function resolveAssetReference(value: unknown, expectedType: string, propertyName: string, queryAssetInfo: AssetReferenceInfoQuery): Promise<unknown>;
