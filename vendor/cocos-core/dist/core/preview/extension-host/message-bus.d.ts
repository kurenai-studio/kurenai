import { PreviewExtension } from './scanner';
/**
 * Editor.Message 的 CLI 实现：把 `Editor.Message.request(domain, message, ...args)` 路由到：
 * - domain 为已注册扩展名（含扩展自身 self-IPC）：按 contributions.messages 把 message 映射到
 *   主进程导出的方法名，调用扩展自己的处理函数；
 * - domain === 'asset-db'：映射到 CLI 的 assetManager；
 * - domain === 'scene'：最小桩实现；
 * - 其它：告警并返回 undefined（绝不抛出，避免拖垮预览）。
 */
export declare class MessageBus {
    private _registry;
    register(ext: PreviewExtension, mainModule: any): void;
    /** 已注册的扩展主进程模块（供 dispose 时调用各自 unload）。 */
    getRegisteredMains(): {
        name: string;
        mainModule: any;
    }[];
    dispatch(domain: string, message: string, ...args: any[]): Promise<any>;
    private _dispatchExtension;
    private _dispatchAssetDb;
    private _dispatchScene;
    private _dispatchPreview;
    private _triggerReload;
}
