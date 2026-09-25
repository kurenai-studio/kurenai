import { IAsset, IExportOptions } from '../@types/private';
/**
 * 计算某个数据的 md5 值
 * @param data
 */
export declare function calcMd5(data: (Buffer | string) | Array<Buffer | string>): string;
export declare class AssetCache {
    _cacheMap: Record<string, {
        path: string;
        md5Key: string;
    }>;
    _tmpDir: string;
    constructor(tmp: string);
    _getCacheFilePath(asset: IAsset, md5Key: string): string;
    add(asset: IAsset, options: IExportOptions, path: string): Promise<boolean>;
    query(uuid: string, options: IExportOptions): string | null;
}
