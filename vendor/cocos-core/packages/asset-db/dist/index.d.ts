import { AssetDBOptions, AssetDB } from './libs/asset-db';
import { getFileSystemProvider, resetFileSystemProvider, setFileSystemProvider } from './libs/filesystem';
import { isSubPath, nameToId } from './libs/utils';
/**
 * 创建一个新的资源数据库
 * @param options
 */
export declare function create(options: AssetDBOptions): AssetDB;
/**
 * 循环每一个数据库
 * @param handler
 */
export declare function forEach(handler: Function): void;
export { setDefaultUserData, } from './libs/default-meta';
export { Importer, } from './libs/importer';
export type { Migrate, } from './libs/importer';
export { Asset, AssetActionEnum, VirtualAsset, } from './libs/asset';
export { AssetDB, } from './libs/asset-db';
export type { AssetDBOptions, } from './libs/asset-db';
export type { IAssetDeleteOptions, IAssetFileStat, IAssetFileSystemProvider, IAssetOperationContext, IAssetOperationKind, IAssetOperationOrigin, IAssetRenameOptions, IAssetWriteFileOptions, } from './libs/filesystem';
export { isSubPath, nameToId, } from './libs/utils';
export declare const Utils: {
    nameToId: typeof nameToId;
    isSubPath: typeof isSubPath;
};
export { get, queryAsset, queryMissingInfo, queryUrl, queryPath, queryUUID, reimport, refresh, } from './libs/manager';
export { getFileSystemProvider, resetFileSystemProvider, setFileSystemProvider, };
