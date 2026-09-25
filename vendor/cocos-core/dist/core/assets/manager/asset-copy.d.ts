import type { AssetOperationOption } from '../@types/public';
export interface AssetCopyTransaction {
    finalize(): Promise<void>;
    rollback(): Promise<void>;
}
/**
 * Copy an asset source into a hidden staging path, install it as one transaction,
 * and rebuild UUIDs in both metadata and supported serialized asset files.
 */
export declare function copyAssetSource(source: string, target: string, options?: AssetOperationOption): Promise<AssetCopyTransaction>;
