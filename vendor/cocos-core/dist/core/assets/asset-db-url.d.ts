export interface AssetDBPathInfo {
    name: string;
    target: string;
}
export declare function pathToDbUrlIfAssetDBPath(pathOrUrlOrUUID: string, assetDBInfo: Record<string, AssetDBPathInfo>): string;
