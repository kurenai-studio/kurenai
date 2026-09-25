/**
 * Editor.Profile 的 CLI 实现：按 Cocos Creator 的磁盘约定读取扩展配置。
 * - project 作用域：<project>/settings/v2/packages/<name>.json
 * - editor/local 作用域：<project>/profiles/v2/packages/<name>.json
 *
 * 为避免预览过程意外写入用户项目，写操作仅落到内存 overlay（会话内一致），不落盘。
 */
export declare class ProfileStore {
    private _projectPath;
    private _overlay;
    constructor(_projectPath: string);
    private _file;
    private _readFile;
    private _get;
    private _set;
    private _remove;
    getProject: (name: string, key?: string, _scope?: string) => Promise<any>;
    setProject: (name: string, key: string | undefined, value: any, _scope?: string) => Promise<void>;
    removeProject: (name: string, key?: string, _scope?: string) => Promise<void>;
    getConfig: (name: string, key?: string, _scope?: string) => Promise<any>;
    setConfig: (name: string, key: string | undefined, value: any, _scope?: string) => Promise<void>;
    removeConfig: (name: string, key?: string, _scope?: string) => Promise<void>;
}
