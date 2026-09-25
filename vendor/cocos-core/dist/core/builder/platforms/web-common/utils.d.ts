export interface IWebBridgeScriptOptions {
    bridgeLink?: unknown;
    bridgeBuildToken?: string;
}
export declare function getBuidPath(platform: string, name: string): Promise<string>;
export declare function getPreviewUrl(dest: string, platform?: string): Promise<string>;
/**
 * 异步打开 URL，在浏览器打开完成时 resolve
 * @param url 要打开的 URL
 * @returns Promise，在浏览器打开完成时 resolve
 */
export declare function openUrlAsync(url: string): Promise<void>;
export declare function run(platform: string, dest: string): Promise<string>;
export declare function injectBridgeScripts(html: string, options: IWebBridgeScriptOptions): string;
