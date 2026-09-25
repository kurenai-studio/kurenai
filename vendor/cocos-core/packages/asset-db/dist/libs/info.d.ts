/// <reference types="node" />
import { CustomConsole } from './console';
import { PathCaseConflictError } from './path-identity';
export interface SimpleInfo {
    time: number;
    uuid?: string;
}
export interface MissingAssetInfo {
    path: string;
    time: number;
    removeTime: number;
}
export interface RecordInfoMap {
    version: string;
    map: {
        [path: string]: SimpleInfo;
    };
    missing: {
        [path: string]: MissingAssetInfo;
    };
}
/**
 * 缓存所有文件的 mtimeMs 时间，用于比对是否修改
 * 这部分数据需要落地到文件系统
 */
export declare class InfoManager {
    static version: string;
    private file;
    pathRoot: string;
    private recordInfo;
    private console;
    cacheConflict: PathCaseConflictError | null;
    constructor(customConsole: CustomConsole, pathRoot: string);
    _saveTimer: null | NodeJS.Timeout;
    /**
     * 设置记录数据的 json 文件
     * @param path
     */
    setRecordJSON(path: string): Promise<void>;
    private _restoreCache;
    private _readRecordInfo;
    /**
     * 销毁一个管理器实例
     * @param manager
     */
    destroy(): void;
    save(): void;
    saveImmediate(): void;
    /**
     * 更新一个缓存数据
     * @param path
     * @param mtimeMs
     * @param uuid
     */
    add(path: string, mtimeMs: number, uuid?: string): void;
    /**
     * 删除缓存的一个 mtime 数据
     * @param path
     */
    remove(path: string): void;
    /**
     * 获取缓存的 stats 对象
     * @param path
     */
    get(path: string): SimpleInfo;
    /**
     * 添加一个丢失的资源信息
     * @param path
     * @param info
     */
    private addMissing;
    /**
     * 根据 uuid 获取丢失的资源信息
     * @param uuid
     * @returns
     */
    getMissingInfo(uuid: string): MissingAssetInfo;
    updatePathCase(previousPath: string, nextPath: string): void;
    /**
     * 对比现在文件和内存里缓存的 stats 是否有修改
     * 返回是否相等
     * @param path
     * @param stats
     */
    compare(path: string, mtimeMs: number): boolean;
    forEach(handler: Function): Promise<void>;
}
