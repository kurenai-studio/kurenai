export declare function registerBrowserPreview(projectPath: string): Promise<void>;
/**
 * 释放浏览器预览相关资源（扩展预览后端 + 热重载监听）。预览关闭时调用。
 *
 * 注意：`middlewareService` 目前只支持追加路由、不支持注销，因此已注册的 GamePreview 路由
 * 无法在此移除；同进程内重启预览会重复注册路由（已知限制，见 review 遗留项）。这里负责清理
 * 有状态的部分（扩展宿主 + 热重载监听 / 定时器），并复位注册标志。
 */
export declare function disposeBrowserPreview(): Promise<void>;
