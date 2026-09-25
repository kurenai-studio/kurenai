export declare function removePreviewAssetCache(uuid: string): void;
interface LoadPreviewAssetOptions {
    reloadAsset?: boolean;
    timeoutMs?: number;
}
export declare function loadPreviewAsset<T>(uuid: string, label: string, options?: LoadPreviewAssetOptions): Promise<T>;
export {};
