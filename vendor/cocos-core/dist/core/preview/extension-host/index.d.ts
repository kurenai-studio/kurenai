export interface ExtensionPreviewHost {
    /** 已成功加载（提供 server 路由）的扩展名 */
    extensions: string[];
    dispose(): void;
}
/**
 * 通用扩展预览宿主：在 CLI 预览服务器里加载并运行项目扩展自带的 backend 代码
 * （contributions.server 路由 + contributions.messages 处理函数），背后用 Node 侧
 * Editor.* 垫片支撑，对齐 Cocos Creator 编辑器托管扩展的行为。
 *
 * 必须在 register('GamePreview', ...) 之前调用，使扩展的具体路由先于
 * scriptingRoutes 里的宽泛正则注册、从而优先命中。
 */
export declare function loadExtensionPreviewHost(projectPath: string): Promise<ExtensionPreviewHost>;
