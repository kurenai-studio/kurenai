/**
 * 一个项目扩展的预览相关贡献信息。
 */
export interface PreviewExtension {
    /** 扩展名（package.json name），即消息 IPC 的 domain，例如 'localization-editor' */
    name: string;
    /** 扩展根目录绝对路径 */
    dir: string;
    /** 扩展主进程入口绝对路径（package.json main），承载消息处理函数 */
    mainPath?: string;
    /** 扩展 server 贡献入口绝对路径（contributions.server），导出 get/post 路由 */
    serverPath?: string;
    /** contributions.messages：消息名 -> { methods: 主进程导出方法名[] } */
    messages: Record<string, {
        methods?: string[];
    }>;
    /** 原始 package.json，供后续按需读取其它贡献 */
    manifest: any;
}
/**
 * 扫描 `<project>/extensions/*` 下声明了 server / messages 贡献的扩展。
 * 与 asset-config.ts 中扫描 asset-db mount 的做法一致，只读 package.json，不加载代码。
 */
export declare function scanPreviewExtensions(projectPath: string): PreviewExtension[];
