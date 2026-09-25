import type { IMiddlewareContribution } from '../server/interfaces';
export declare function isToolErrorCode(code: unknown): boolean;
export declare class McpMiddleware {
    private server;
    private resourceManager;
    private builderHook;
    constructor();
    private registerResourcesList;
    /**
     * 注册项目资源 Resource Template，支持按 ccType 查询工程资源列表
     */
    private registerAssetResourcesTemplate;
    /**
     * 注册 mcp tools
     */
    private registerDecoratorTools;
    /**
     * 准备方法参数
     */
    private prepareMethodArguments;
    /**
     * 调用工具方法
     */
    private callToolMethod;
    /**
     * 获取工具实例
     */
    private getToolInstance;
    /**
     * 格式化工具结果
     */
    private formatToolResult;
    private handleMcpRequest;
    private handleSseRequest;
    getMiddlewareContribution(): IMiddlewareContribution;
    /**
     * 将 Zod Schema 转换为兼容性高的 jsonSchema7 格式
     */
    private zodToJSONSchema7;
}
