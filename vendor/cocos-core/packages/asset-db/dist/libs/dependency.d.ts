import { CustomConsole } from './console';
import { PathCaseConflictError } from './path-identity';
interface DependMap {
    path: {
        [path: string]: string[];
    };
    uuid: {
        [uuid: string]: string[];
    };
    [type: string]: {
        [path: string]: string[];
    };
}
/**
 * 资源关联以及依赖关系列表，主要影响导入队列以及是否需要重新导入
 * 部分数据需要固化到硬盘上
 */
export declare class DependencyManager {
    static version: string;
    file?: string;
    pathRoot: string;
    dependMap: DependMap;
    _saveTimer: any;
    private console;
    cacheConflict: PathCaseConflictError | null;
    constructor(customConsole: CustomConsole, pathRoot: string);
    /**
     * 设置用于记录的 json 文件
     * @param json
     */
    setRecordJSON(path: string): Promise<void>;
    private _restoreCache;
    private readRecordJSON;
    save(): void;
    saveImmediate(): void;
    /**
     * 记录一个资源依赖的所有资源列表
     * 允许传入 url、uuid、path 三种依赖的格式
     * @param path
     * @param dependNames
     */
    add(type: string, key: string, depends: string | string[]): void;
    /**
     * 清空一个资源的依赖记录
     * @param name
     */
    remove(type: string, key: string): void;
    updatePathCase(previousPath: string, nextPath: string): void;
    /**
     * 销毁一个依赖管理器实例
     * @param manager
     */
    destroy(): void;
}
/**
 * 获取被影响的资源列表
 * @param urlOrPathOrUUID
 */
export declare function getAssociatedFiles(urlOrPathOrUUID: string): string[];
export {};
