import { IBuildCommandOption, Platform } from './builder/@types/protected';
interface IPreviewStartOptions {
    port?: number;
    platform?: Platform | string;
    open?: boolean;
    buildOptions?: Partial<IBuildCommandOption>;
}
/**
 * 启动器，主要用于整合各个模块的初始化和关闭流程
 * 默认支持几种启动方式：单独导入项目、单独启动项目、单独构建项目
 */
export default class Launcher {
    private projectPath;
    private _init;
    private _import;
    constructor(projectPath: string);
    private init;
    /**
     * 导入资源
     */
    import(): Promise<void>;
    /**
     * 启动项目
     */
    startup(port?: number): Promise<void>;
    startPreview(options?: number | IPreviewStartOptions): Promise<import("./builder/@types/protected").IBuildResultSuccess>;
    /**
     * 启动动态游戏预览（只托管不构建，对齐编辑器浏览器预览）。
     * 与场景编辑器预览的区别：不启动场景进程 / RPC。
     */
    startGamePreview(options?: {
        port?: number;
        scene?: string;
        open?: boolean;
    }): Promise<void>;
    /**
     * 打印当前启动场景与项目内可用场景列表，方便用 ?scene=<url|uuid> 切换。
     */
    private printPreviewScenes;
    startSceneEditorPreview(options?: number | {
        port?: number;
        open?: boolean;
    }): Promise<void>;
    /**
     * 构建，主要是作为命令行构建的入口
     * @param platform
     * @param options
     */
    build(platform: Platform, options: Partial<IBuildCommandOption>): Promise<import("./builder/@types/protected").IBuildResultData>;
    static make(platform: Platform, dest: string): Promise<import("./builder/@types/protected").IBuildResultData>;
    static run(platform: Platform, dest: string): Promise<import("./builder/@types/protected").IBuildResultData>;
    static upload(platform: Platform, dest: string, accessToken?: string): Promise<import("./builder/@types/protected").IBuildResultData>;
    static publish(platform: Platform, dest: string): Promise<import("./builder/@types/protected").IBuildResultData>;
    close(): Promise<void>;
}
export {};
