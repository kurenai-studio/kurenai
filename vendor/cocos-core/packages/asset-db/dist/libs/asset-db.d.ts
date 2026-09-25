/// <reference types="node" />
import { EventEmitter } from 'events';
import { Asset, VirtualAsset } from './asset';
import { MetaManager } from './meta';
import { InfoManager } from './info';
import { DependencyManager } from './dependency';
import { DataManager } from './data';
import { ParallelQueue } from 'workflow-extra';
import { CustomConsole, LogLevel } from './console';
export { map } from './manager';
export interface AssetDBStartOptions {
    ignoreSelf?: boolean;
    globList?: string[];
    hooks?: {
        afterGenerateMeta?(): void;
        afterScan?(files: string[]): void;
        afterPreImport?(): void;
        afterStart?(): void;
    };
}
export interface AssetDBRefreshOptions {
    ignoreSelf?: boolean;
    globList?: string[];
    useCache?: boolean;
    hooks?: {
        afterGenerateMeta?(): void;
        afterScan?(files: string[]): void;
        afterPreImport?(): void;
        afterRefresh?(): void;
    };
}
/**
 * 资源数据库启动参数
 */
export interface AssetDBOptions {
    name: string;
    target: string;
    library: string;
    temp: string;
    /**
     * 0: 忽略错误
     * 1: 仅仅打印错误
     * 2: 打印错误、警告
     * 3: 打印错误、警告、日志
     * 4: 打印错误、警告、日志、调试信息
     */
    level: LogLevel;
    ignoreFiles: string[];
    globList?: string[];
    readonly: boolean;
    flags?: {
        reimportCheck?: boolean;
    };
    importConcurrency?: number;
}
export declare const version = "2.0.0";
export declare class AssetDB extends EventEmitter {
    static readonly version = "1.0.1";
    options: AssetDBOptions;
    flag: {
        starting: boolean;
        started: boolean;
    };
    path2asset: Map<string, Asset>;
    uuid2asset: Map<string, Asset>;
    importerManager: any;
    metaManager: MetaManager;
    console: CustomConsole;
    infoManager: InfoManager;
    dependencyManager: DependencyManager;
    taskManager: ParallelQueue<VirtualAsset, boolean>;
    dataManager: DataManager;
    _lock: boolean;
    _waitLockHandler: Function[];
    cachePath: string;
    get assetProgressInfo(): {
        current: number;
        total: number;
        wait: any;
    };
    /**
     * 锁定资源
     */
    private lock;
    /**
     * 解锁资源
     */
    private unlock;
    /**
     * 实例化过程
     * @param options
     */
    constructor(options: AssetDBOptions);
    preImporterHandler?(file: string): boolean;
    private prepareStart;
    /**
     * 启动资源数据库
     */
    start(options?: AssetDBStartOptions): Promise<unknown>;
    /**
     * 直接从缓存中恢复数据库，可能会失败抛异常
     * @returns
     */
    startWithCache(): Promise<void>;
    updateInfoManager(): Promise<void>;
    private _generateRecordInfo;
    save(): Promise<void>;
    private restoreFromCache;
    /**
     * 停止资源数据库
     */
    stop(): Promise<void>;
    /**
     * 传入 path，返回 asset-db 内对应的 uuid
     * 不存在则返回 null
     * @param path
     */
    pathToUuid(path: string): string | null;
    /**
     * 传入 uuid，返回对应的资源的 path
     * @param uuid
     */
    uuidToPath(uuid: string): string | null;
    /**
     * 查询资源实例
     * @param uuid
     */
    getAsset(uuid: string): VirtualAsset | null;
    /**
     * 重新导入某个指定资源
     * @param fileOrUUID
     */
    reimport(fileOrUUID: string): Promise<VirtualAsset | null>;
    /**
     * 刷新资源
     * 传入某一个文件或者文件夹，进行数据库刷新操作
     * 会优先同步扫描所有资源，然后等待其他 refresh 队列
     * 默认 refresh 是有队列的，多个 refresh 同时执行需要进入队列等待
     * @param path
     * @returns {number} 刷新的资源个数
     */
    refresh(path: string, options?: AssetDBRefreshOptions): Promise<number>;
    private _replaceUUID;
    private _updateAssetPathCase;
    /**
     * 检查资源状态
     * 识别是新增、修改还是删除了资源
     * @param addFiles
     * @param deleteFiles
     */
    private _checkAssetsStatSync;
    private _checkAssetStat;
}
