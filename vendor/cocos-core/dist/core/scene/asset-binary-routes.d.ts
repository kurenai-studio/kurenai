import type { Request } from 'express';
import type { IGetPostConfig } from '../../server/interfaces';
import type { IAssetInfo } from '../assets/@types/public';
export declare const ASSET_BINARY_MAX_BYTES: number;
interface AssetBinaryManager {
    saveAsset(assetUuid: string, content: Buffer): Promise<IAssetInfo>;
    createAsset(options: {
        target: string;
        overwrite: boolean;
        content: Buffer;
    }): Promise<IAssetInfo>;
}
export interface AssetBinaryRouteDependencies {
    loadAssetManager(): Promise<AssetBinaryManager>;
}
/**
 * Aggregates a binary request body locally to the binary Asset routes.
 * The helper keeps the 50 MiB transport policy out of the global JSON parser
 * and checks chunks even when Content-Length is absent or untrusted.
 */
export declare function readBinaryBody(req: Request, limit?: number): Promise<Buffer>;
/**
 * Creates the narrow browser-facing binary Asset write routes.
 * All identifier, metadata, body-size, and error translation rules stay here;
 * callers only receive the stable save/create operations.
 */
export declare function createAssetBinaryRoutes(dependencies?: AssetBinaryRouteDependencies): IGetPostConfig[];
export {};
