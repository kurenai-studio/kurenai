import { CustomConsole } from './console';
import { IAssetDeleteOptions, IAssetWriteFileOptions } from './filesystem';
export interface Meta {
    ver: string;
    importer: string;
    imported: boolean;
    uuid: string;
    files: string[];
    subMetas: {
        [index: string]: Meta;
    };
    userData: {
        [index: string]: any;
    };
    displayName: string;
    id: string;
    name: string;
}
export interface MetaInfo {
    json: Meta;
    backup: string;
    EOL: '\n' | '\r\n';
}
/**
 * 复制 meta 数据，将 origin 上的数据复制到 target 上
 * @param target
 * @param origin
 */
export declare function copyMeta(target: Meta, origin: Meta): void;
/**
 * 补全 meta 数据
 * @param meta
 */
export declare function completionMeta(meta: any): Meta;
export declare class MetaManager {
    path2meta: {
        [index: string]: MetaInfo;
    };
    private console;
    constructor(customConsole: CustomConsole);
    /**
     * 销毁一个管理器实例
     * @param manager
     */
    destroy(): void;
    /**
     * 从硬盘读取更新一个 meta 文件数据到内存里
     * @param path
     */
    read(path: string): boolean | undefined;
    write(path: string, options?: IAssetWriteFileOptions): Promise<false | undefined>;
    /**
     * 删除内存中的一个 MetaInfo 数据
     * 并放入 backup 文件夹
     * @param path
     */
    remove(path: string, options?: IAssetDeleteOptions): Promise<void>;
    /**
     * 从缓存里取一个 MetaInfo
     * 如果不存在，则取备份数据
     * 如果还不存在，则生成新的空 MetaInfo 和 meta 文件
     * @param path
     */
    get(path: string): Promise<MetaInfo>;
    move(pathA: string, pathB: string): void;
    updatePathCase(previousPath: string, nextPath: string): void;
}
