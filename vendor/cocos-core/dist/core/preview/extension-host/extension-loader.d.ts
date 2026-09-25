import { PreviewExtension } from './scanner';
import { MessageBus } from './message-bus';
/**
 * 加载扩展主进程入口（UMD/CommonJS），执行其 load() 初始化，并把它登记到消息总线。
 * 必须在 installEditorShim 之后调用（扩展模块求值期会访问 global.Editor）。
 */
export declare function loadExtensionMain(ext: PreviewExtension, bus: MessageBus): Promise<any | undefined>;
/**
 * 加载扩展的 server 贡献入口，返回其导出的 get/post 路由数组。
 * 需在所有扩展主进程加载完成后调用（server 路由处理器会经由 Editor.Message 回调主进程）。
 */
export declare function loadExtensionServer(ext: PreviewExtension): {
    get?: any[];
    post?: any[];
} | undefined;
