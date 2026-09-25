export declare function enrichMissingDependencyError(errInfo: string, ownerAsset: string, queryAssetInfo?: (uuid: string) => Promise<{
    url?: string;
} | null>, querySubAssetName?: (mainUuid: string, subId: string) => Promise<string | null>): Promise<string>;
