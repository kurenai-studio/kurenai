import { IMD5Options } from '../../../../@types/protected';
export declare class md5CacheHandler {
    hashedPathMap: Record<string, string>;
    options: IMD5Options;
    _root: string;
    private _files;
    private _waitingMd5Files;
    private _waitingReplaceFiles;
    private waitUpdateFiles;
    constructor(root: string, options: IMD5Options);
    private initFiles;
    run(): Promise<void>;
    replacePath(path: string): Promise<void>;
    /**
     * 简单添加 md5 后缀，不识别文件内容
     * @param path
     * @returns
     */
    addMd5ToPath(path: string, code?: string): Promise<string>;
    /**
     * 查找在 file 内存在的完整的文件
     * @param path
     * @returns
     */
    private findFile;
    private checkPathExist;
    private _joinPath;
    /**
     * 给文件添加 md5 后缀，将会识别内容替换路径引用
     */
    private addMD5ToFiles;
    private replacePathInCode;
    private readFileDepends;
}
