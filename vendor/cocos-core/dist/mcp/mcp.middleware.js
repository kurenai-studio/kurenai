"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpMiddleware = void 0;
exports.isToolErrorCode = isToolErrorCode;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const decorator_1 = require("../api/decorator/decorator");
const zod_1 = require("zod");
const pkgJson = __importStar(require("../../package.json"));
const path_1 = require("path");
const resources_1 = require("./resources");
const schema_base_1 = require("../api/base/schema-base");
const builder_hook_1 = require("./hooks/builder.hook");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const zod_to_json_schema_1 = require("zod-to-json-schema");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const assets_1 = require("../core/assets");
const tool_call_context_1 = require("./tool-call-context");
function isToolErrorCode(code) {
    return typeof code === 'number' && code >= 500 && code < 600;
}
function withMcpToolCallContext(callback) {
    return async (args, extra) => (0, tool_call_context_1.runWithMcpToolCallContext)(extra.requestInfo?.headers, async () => {
        try {
            return await callback(args);
        }
        finally {
            try {
                await (0, tool_call_context_1.completeMcpToolCallContext)();
            }
            catch {
                // Do not log finalization error details or request metadata, which may contain
                // sensitive information. A finalization failure must not replace the tool result.
                console.error('[MCP] Tool-call finalization failed.');
            }
        }
    });
}
class McpMiddleware {
    server;
    resourceManager;
    builderHook;
    constructor() {
        this.builderHook = new builder_hook_1.BuilderHook();
        // 创建 MCP server
        this.server = new mcp_js_1.McpServer({
            name: 'cocos-cli',
            version: pkgJson.version || '0.0.0',
        }, {
            capabilities: {
                resources: {
                    subscribe: true,
                    listChanged: true,
                    templates: true
                },
                tools: {},
                // 日志能力（调试用）
                logging: {},
            }
        });
        // 初始化资源管理器
        const docsPath = (0, path_1.join)(__dirname, '../../docs');
        this.resourceManager = new resources_1.ResourceManager(docsPath);
        // 注册资源和工具
        this.registerDecoratorTools();
        this.registerResourcesList();
        this.registerAssetResourcesTemplate();
    }
    registerResourcesList() {
        // 使用资源管理器加载所有资源
        const resources = this.resourceManager.loadAllResources();
        // 批量注册资源
        resources.forEach((resource) => {
            this.server.resource(resource.name, resource.uri, {
                title: resource.title,
                mimeType: resource.mimeType
            }, async (_uri, extra) => {
                // 根据客户端地区选择语言
                const preferredLanguage = this.resourceManager.detectClientLanguage(extra);
                // 动态读取文件内容
                const textContent = this.resourceManager.readFileContent(resource, preferredLanguage);
                return {
                    contents: [{
                            uri: resource.uri,
                            text: textContent,
                            mimeType: resource.mimeType
                        }]
                };
            });
        });
    }
    /**
     * 注册项目资源 Resource Template，支持按 ccType 查询工程资源列表
     */
    registerAssetResourcesTemplate() {
        const template = new mcp_js_1.ResourceTemplate('cocos://assets/{ccType}', {
            list: undefined,
        });
        this.server.resource('project-assets-by-type', template, {
            title: 'Project Assets by Type',
            description: 'Query project assets filtered by ccType, e.g. cc.ImageAsset, cc.SceneAsset, cc.Prefab, cc.Material, cc.AnimationClip, cc.Script',
            mimeType: 'application/json',
        }, async (uri, variables) => {
            const ccType = variables.ccType;
            console.error('registerAssetResources', ccType);
            const assetInfos = assets_1.assetManager.queryAssetInfos({ ccType });
            const simplified = assetInfos
                .filter((info) => !info.url?.startsWith('db://internal'))
                .map((info) => ({
                name: info.name,
                url: info.url,
                uuid: info.uuid,
                type: info.type,
                importer: info.importer,
                file: info.file,
            }));
            return {
                contents: [{
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify(simplified, null, 2),
                    }],
            };
        });
    }
    /**
     * 注册 mcp tools
     */
    registerDecoratorTools() {
        Array.from(decorator_1.toolRegistry.entries()).forEach(([toolName, { target, meta }]) => {
            try {
                // --- 步骤 A: 构建 Zod Shape ---
                const inputSchemaFields = {};
                meta.paramSchemas
                    .sort((a, b) => a.index - b.index)
                    .forEach(param => {
                    if (param.name) {
                        this.builderHook.onRegisterParam(toolName, param, inputSchemaFields);
                        if (!inputSchemaFields[param.name]) {
                            inputSchemaFields[param.name] = param.schema;
                        }
                    }
                });
                // --- 步骤 B: 注册工具 ---
                // 使用 this.server.tool 注册，传入 Zod Shape 以便 SDK 进行验证
                this.server.tool(toolName, meta.description || `Tool: ${toolName}`, inputSchemaFields, withMcpToolCallContext(async (args) => {
                    // args 已经是验证过的参数对象 (对于 builder-build.options 是 any)
                    try {
                        this.builderHook.onBeforeExecute(toolName, args);
                        // 这里的 prepareMethodArguments 主要是为了按顺序排列参数给 apply 使用
                        // 注意：args 是对象，prepareMethodArguments 需要处理对象
                        const methodArgs = this.prepareMethodArguments(meta, args, toolName);
                        const result = await this.callToolMethod(target, meta, methodArgs);
                        const formattedResult = this.formatToolResult(meta, result);
                        let structuredContent;
                        if (meta.returnSchema) {
                            try {
                                const validatedResult = meta.returnSchema.parse(result);
                                structuredContent = { result: validatedResult };
                            }
                            catch {
                                structuredContent = { result: result };
                            }
                        }
                        else {
                            structuredContent = { result: result };
                        }
                        console.debug(`call ${toolName} with args:${methodArgs.toString()} result: ${formattedResult}`);
                        return {
                            content: [{ type: 'text', text: formattedResult }],
                            structuredContent: structuredContent,
                            isError: isToolErrorCode(result?.code)
                        };
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        const errorStack = error instanceof Error ? error.stack : undefined;
                        let detailedReason = `Tool execution failed (${toolName}): ${errorMessage}`;
                        if (errorStack && process.env.NODE_ENV === 'development') {
                            detailedReason += `\n\nStack trace:\n${errorStack}`;
                        }
                        detailedReason += `\n\nParameters passed:\n${JSON.stringify(args, null, 2)}`;
                        console.error(`[MCP] ${detailedReason}`);
                        const errorResult = {
                            code: schema_base_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                            data: undefined,
                            reason: detailedReason,
                        };
                        const formattedResult = JSON.stringify({ result: errorResult }, null, 2);
                        return {
                            content: [{ type: 'text', text: formattedResult }],
                            structuredContent: { result: errorResult },
                            isError: true
                        };
                    }
                }));
            }
            catch (error) {
                console.error(`Failed to register tool ${toolName}:`, error);
            }
        });
        // --- 步骤 C: 覆盖 tools/list 处理程序 ---
        // 为了支持 Gemini (不支持 $ref)，我们需要手动生成并返回 Gemini 兼容的 JSON Schema
        this.server.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            const tools = Array.from(decorator_1.toolRegistry.entries()).map(([toolName, { meta }]) => {
                const inputSchemaFields = {};
                meta.paramSchemas
                    .sort((a, b) => a.index - b.index)
                    .forEach(param => {
                    if (param.name) {
                        inputSchemaFields[param.name] = param.schema;
                    }
                });
                const fullInputZodSchema = zod_1.z.object(inputSchemaFields);
                const geminiInputSchema = this.zodToJSONSchema7(fullInputZodSchema);
                // 构建输出 schema
                const outputSchemaFields = meta.returnSchema ? { result: meta.returnSchema } : { result: zod_1.z.any() };
                const fullOutputZodSchema = zod_1.z.object(outputSchemaFields);
                const geminiOutputSchema = this.zodToJSONSchema7(fullOutputZodSchema);
                return {
                    name: toolName,
                    title: meta.title || toolName,
                    description: meta.description || `Tool: ${toolName}`,
                    inputSchema: geminiInputSchema,
                    outputSchema: geminiOutputSchema
                };
            });
            return { tools };
        });
    }
    /**
     * 准备方法参数
     */
    prepareMethodArguments(meta, args, toolName) {
        if (!meta.paramSchemas || meta.paramSchemas.length === 0) {
            return [];
        }
        const methodArgs = [];
        const sortedParams = meta.paramSchemas.sort((a, b) => a.index - b.index);
        for (const param of sortedParams) {
            const paramName = param.name || `param${param.index}`;
            const value = args[paramName];
            try {
                // 使用 Zod schema 验证和转换参数
                const validatedValue = param.schema.parse(value);
                methodArgs[param.index] = validatedValue;
            }
            catch (error) {
                // 尝试处理 Gemini 传回的 string 类型数字 (针对 numeric enum)
                if (typeof value === 'string' && !isNaN(Number(value))) {
                    try {
                        const numValue = Number(value);
                        const validatedValue = param.schema.parse(numValue);
                        methodArgs[param.index] = validatedValue;
                        continue;
                    }
                    catch (innerError) {
                        // 忽略内部错误，继续抛出原始错误
                    }
                }
                console.error(`Parameter validation failed for ${paramName}:`, error);
                this.builderHook.onValidationFailed(toolName, paramName, error);
                // 使用原始值
                methodArgs[param.index] = value;
            }
        }
        return methodArgs;
    }
    /**
     * 调用工具方法
     */
    async callToolMethod(target, meta, args) {
        // 获取或创建实例
        const instance = await this.getToolInstance(target);
        // 获取方法
        const method = instance[meta.methodName];
        if (typeof method !== 'function') {
            throw new Error(`Method ${String(meta.methodName)} not found on instance`);
        }
        // 调用方法
        return await method.apply(instance, args);
    }
    /**
     * 获取工具实例
     */
    async getToolInstance(target) {
        // 如果 target 已经是实例，直接返回
        if (typeof target === 'object' && target !== null) {
            return target;
        }
        throw new Error('Unable to create tool instance');
    }
    /**
     * 格式化工具结果
     */
    formatToolResult(meta, result) {
        // 构建符合 schema 的结果结构，用 result 字段包装
        if (meta.returnSchema) {
            // 验证结果是否符合预期的 schema
            try {
                if (result.reason) {
                    result.reason = (0, strip_ansi_1.default)(result.reason);
                }
                const validatedResult = meta.returnSchema.parse(result);
                return JSON.stringify({ result: validatedResult }, null, 2);
            }
            catch (error) {
                throw new Error(`Tool result validation failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return JSON.stringify({ result: result }, null, 2);
    }
    async handleMcpRequest(req, res) {
        try {
            // 为每个请求创建新的传输层以防止请求 ID 冲突
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true
            });
            res.on('close', () => {
                transport.close();
            });
            await this.server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        }
        catch (error) {
            console.error('MCP request handling error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async handleSseRequest(req, res) {
        // SSE is not supported. Return 405 Method Not Allowed to indicate that POST should be used instead.
        res.status(405).set('Allow', 'POST').send('Method Not Allowed');
    }
    getMiddlewareContribution() {
        return {
            get: [
                {
                    url: '/mcp',
                    handler: this.handleSseRequest.bind(this)
                }
            ],
            post: [
                {
                    url: '/mcp',
                    handler: this.handleMcpRequest.bind(this)
                }
            ]
        };
    }
    /**
     * 将 Zod Schema 转换为兼容性高的 jsonSchema7 格式
     */
    zodToJSONSchema7(zodObj) {
        return (0, zod_to_json_schema_1.zodToJsonSchema)(zodObj, {
            target: 'jsonSchema7',
            $refStrategy: 'none',
        });
    }
}
exports.McpMiddleware = McpMiddleware;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLm1pZGRsZXdhcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWNwL21jcC5taWRkbGV3YXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCQSwwQ0FFQztBQXRCRCxvRUFBc0Y7QUFDdEYsMEZBQW1HO0FBQ25HLDBEQUEwRDtBQUMxRCw2QkFBd0I7QUFDeEIsNERBQThDO0FBQzlDLCtCQUE0QjtBQUM1QiwyQ0FBOEM7QUFDOUMseURBQXNEO0FBQ3RELHVEQUFtRDtBQUVuRCw0REFBbUM7QUFDbkMsMkRBQXFEO0FBQ3JELGlFQUE0RTtBQUM1RSwyQ0FBOEM7QUFDOUMsMkRBRzZCO0FBRzdCLFNBQWdCLGVBQWUsQ0FBQyxJQUFhO0lBQ3pDLE9BQU8sT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUNqRSxDQUFDO0FBUUQsU0FBUyxzQkFBc0IsQ0FDM0IsUUFBbUM7SUFFbkMsT0FBTyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBQSw2Q0FBeUIsRUFBQyxLQUFLLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxLQUFLLElBQUksRUFBRTtRQUMzRixJQUFJLENBQUM7WUFDRCxPQUFPLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7Z0JBQVMsQ0FBQztZQUNQLElBQUksQ0FBQztnQkFDRCxNQUFNLElBQUEsOENBQTBCLEdBQUUsQ0FBQztZQUN2QyxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNMLCtFQUErRTtnQkFDL0Usa0ZBQWtGO2dCQUNsRixPQUFPLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFDMUQsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRCxNQUFhLGFBQWE7SUFDZCxNQUFNLENBQVk7SUFDbEIsZUFBZSxDQUFrQjtJQUNqQyxXQUFXLENBQWM7SUFFakM7UUFDSSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksMEJBQVcsRUFBRSxDQUFDO1FBQ3JDLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksa0JBQVMsQ0FBQztZQUN4QixJQUFJLEVBQUUsV0FBVztZQUNqQixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPO1NBQ3RDLEVBQUU7WUFDQyxZQUFZLEVBQUU7Z0JBQ1YsU0FBUyxFQUFFO29CQUNQLFNBQVMsRUFBRSxJQUFJO29CQUNmLFdBQVcsRUFBRSxJQUFJO29CQUNqQixTQUFTLEVBQUUsSUFBSTtpQkFDbEI7Z0JBQ0QsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsWUFBWTtnQkFDWixPQUFPLEVBQUUsRUFBRTthQUNkO1NBQ0osQ0FBQyxDQUFDO1FBRUgsV0FBVztRQUNYLE1BQU0sUUFBUSxHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksMkJBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVyRCxVQUFVO1FBQ1YsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUVPLHFCQUFxQjtRQUN6QixnQkFBZ0I7UUFDaEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBRTFELFNBQVM7UUFDVCxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFO2dCQUM5QyxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7Z0JBQ3JCLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTthQUM5QixFQUFFLEtBQUssRUFBRSxJQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQzFCLGNBQWM7Z0JBQ2QsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUUzRSxXQUFXO2dCQUNYLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUV0RixPQUFPO29CQUNILFFBQVEsRUFBRSxDQUFDOzRCQUNQLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRzs0QkFDakIsSUFBSSxFQUFFLFdBQVc7NEJBQ2pCLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTt5QkFDOUIsQ0FBQztpQkFDTCxDQUFDO1lBQ04sQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNLLDhCQUE4QjtRQUNsQyxNQUFNLFFBQVEsR0FBRyxJQUFJLHlCQUFnQixDQUFDLHlCQUF5QixFQUFFO1lBQzdELElBQUksRUFBRSxTQUFTO1NBQ2xCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUNoQix3QkFBd0IsRUFDeEIsUUFBUSxFQUNSO1lBQ0ksS0FBSyxFQUFFLHdCQUF3QjtZQUMvQixXQUFXLEVBQUUsaUlBQWlJO1lBQzlJLFFBQVEsRUFBRSxrQkFBa0I7U0FDL0IsRUFDRCxLQUFLLEVBQUUsR0FBUSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQzFCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFnQixDQUFDO1lBQzFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0MsTUFBTSxVQUFVLEdBQUcscUJBQVksQ0FBQyxlQUFlLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzVELE1BQU0sVUFBVSxHQUFHLFVBQVU7aUJBQ3hCLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztpQkFDeEQsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ2YsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO2dCQUNiLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7YUFDZCxDQUFDLENBQUMsQ0FBQztZQUNSLE9BQU87Z0JBQ0gsUUFBUSxFQUFFLENBQUM7d0JBQ1gsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJO3dCQUNULFFBQVEsRUFBRSxrQkFBa0I7d0JBQzVCLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3FCQUM1QyxDQUFDO2FBQ0wsQ0FBQztRQUNOLENBQUMsQ0FDSixDQUFDO0lBQ04sQ0FBQztJQUVEOztPQUVHO0lBQ0ssc0JBQXNCO1FBQzFCLEtBQUssQ0FBQyxJQUFJLENBQUMsd0JBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4RSxJQUFJLENBQUM7Z0JBQ0QsNkJBQTZCO2dCQUM3QixNQUFNLGlCQUFpQixHQUFpQyxFQUFFLENBQUM7Z0JBQzNELElBQUksQ0FBQyxZQUFZO3FCQUNaLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztxQkFDakMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNiLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNiLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzt3QkFDckUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDOzRCQUNqQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQzt3QkFDakQsQ0FBQztvQkFDTCxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVQLHFCQUFxQjtnQkFDckIsa0RBQWtEO2dCQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDWixRQUFRLEVBQ1IsSUFBSSxDQUFDLFdBQVcsSUFBSSxTQUFTLFFBQVEsRUFBRSxFQUN2QyxpQkFBaUIsRUFDakIsc0JBQXNCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO29CQUNsQyxvREFBb0Q7b0JBQ3BELElBQUksQ0FBQzt3QkFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQ2pELG9EQUFvRDt3QkFDcEQsNENBQTRDO3dCQUM1QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFDckUsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7d0JBRW5FLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBRTVELElBQUksaUJBQXNCLENBQUM7d0JBQzNCLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDOzRCQUNwQixJQUFJLENBQUM7Z0NBQ0QsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQ3hELGlCQUFpQixHQUFHLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxDQUFDOzRCQUNwRCxDQUFDOzRCQUFDLE1BQU0sQ0FBQztnQ0FDTCxpQkFBaUIsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQzs0QkFDM0MsQ0FBQzt3QkFDTCxDQUFDOzZCQUFNLENBQUM7NEJBQ0osaUJBQWlCLEdBQUcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7d0JBQzNDLENBQUM7d0JBQ0EsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLFFBQVEsY0FBYyxVQUFVLENBQUMsUUFBUSxFQUFFLFlBQVksZUFBZSxFQUFFLENBQUMsQ0FBQzt3QkFDaEcsT0FBTzs0QkFDSixPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFlLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxDQUFDOzRCQUMzRCxpQkFBaUIsRUFBRSxpQkFBaUI7NEJBQ3BDLE9BQU8sRUFBRSxlQUFlLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQzt5QkFDeEMsQ0FBQztvQkFFUCxDQUFDO29CQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7d0JBQ1osTUFBTSxZQUFZLEdBQUcsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM1RSxNQUFNLFVBQVUsR0FBRyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7d0JBRXBFLElBQUksY0FBYyxHQUFHLDBCQUEwQixRQUFRLE1BQU0sWUFBWSxFQUFFLENBQUM7d0JBQzVFLElBQUksVUFBVSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLGFBQWEsRUFBRSxDQUFDOzRCQUN2RCxjQUFjLElBQUkscUJBQXFCLFVBQVUsRUFBRSxDQUFDO3dCQUN4RCxDQUFDO3dCQUNELGNBQWMsSUFBSSwyQkFBMkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBRTdFLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxjQUFjLEVBQUUsQ0FBQyxDQUFDO3dCQUV6QyxNQUFNLFdBQVcsR0FBMEQ7NEJBQ3ZFLElBQUksRUFBRSx5QkFBVyxDQUFDLHFCQUFxQjs0QkFDdkMsSUFBSSxFQUFFLFNBQVM7NEJBQ2YsTUFBTSxFQUFFLGNBQWM7eUJBQ3pCLENBQUM7d0JBRUYsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3pFLE9BQU87NEJBQ0gsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBZSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsQ0FBQzs0QkFDM0QsaUJBQWlCLEVBQUUsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFOzRCQUMxQyxPQUFPLEVBQUUsSUFBSTt5QkFDaEIsQ0FBQztvQkFDUCxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUNMLENBQUM7WUFDTixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixRQUFRLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRSxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxtQ0FBbUM7UUFDbkMsNERBQTREO1FBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLGlDQUFzQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BFLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsd0JBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMxRSxNQUFNLGlCQUFpQixHQUFpQyxFQUFFLENBQUM7Z0JBQzNELElBQUksQ0FBQyxZQUFZO3FCQUNaLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztxQkFDakMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNiLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNiLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO29CQUNqRCxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVQLE1BQU0sa0JBQWtCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUVwRSxjQUFjO2dCQUNkLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztnQkFDbkcsTUFBTSxtQkFBbUIsR0FBRyxPQUFDLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3pELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBRXRFLE9BQU87b0JBQ0gsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksUUFBUTtvQkFDN0IsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLElBQUksU0FBUyxRQUFRLEVBQUU7b0JBQ3BELFdBQVcsRUFBRSxpQkFBaUI7b0JBQzlCLFlBQVksRUFBRSxrQkFBa0I7aUJBQ25DLENBQUM7WUFDTixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNLLHNCQUFzQixDQUFDLElBQVMsRUFBRSxJQUFTLEVBQUUsUUFBZ0I7UUFDakUsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDdkQsT0FBTyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQVUsRUFBRSxDQUFDO1FBQzdCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBTSxFQUFFLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkYsS0FBSyxNQUFNLEtBQUssSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUMvQixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLFFBQVEsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU5QixJQUFJLENBQUM7Z0JBQ0Qsd0JBQXdCO2dCQUN4QixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakQsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxjQUFjLENBQUM7WUFDN0MsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsZ0RBQWdEO2dCQUNoRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNyRCxJQUFJLENBQUM7d0JBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMvQixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDcEQsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxjQUFjLENBQUM7d0JBQ3pDLFNBQVM7b0JBQ2IsQ0FBQztvQkFBQyxPQUFPLFVBQVUsRUFBRSxDQUFDO3dCQUNsQixrQkFBa0I7b0JBQ3RCLENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxTQUFTLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFdEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUVoRSxRQUFRO2dCQUNSLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3BDLENBQUM7UUFDTCxDQUFDO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDdEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFXLEVBQUUsSUFBUyxFQUFFLElBQVc7UUFDNUQsVUFBVTtRQUNWLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVwRCxPQUFPO1FBQ1AsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6QyxJQUFJLE9BQU8sTUFBTSxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsVUFBVSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFRCxPQUFPO1FBQ1AsT0FBTyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBVztRQUNyQyx1QkFBdUI7UUFDdkIsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLElBQUksTUFBTSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ2hELE9BQU8sTUFBTSxDQUFDO1FBQ2xCLENBQUM7UUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVEOztPQUVHO0lBQ0ssZ0JBQWdCLENBQUMsSUFBUyxFQUFFLE1BQVc7UUFDM0Msa0NBQWtDO1FBQ2xDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BCLHFCQUFxQjtZQUNyQixJQUFJLENBQUM7Z0JBQ0QsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2hCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBQSxvQkFBUyxFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0MsQ0FBQztnQkFDRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRSxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hILENBQUM7UUFDTCxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLEdBQVksRUFBRSxHQUFhO1FBQ3RELElBQUksQ0FBQztZQUNELDBCQUEwQjtZQUMxQixNQUFNLFNBQVMsR0FBRyxJQUFJLGlEQUE2QixDQUFDO2dCQUNoRCxrQkFBa0IsRUFBRSxTQUFTO2dCQUM3QixrQkFBa0IsRUFBRSxJQUFJO2FBQzNCLENBQUMsQ0FBQztZQUVILEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDakIsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RCLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyQyxNQUFNLFNBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO0lBQ0wsQ0FBQztJQUVPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFZLEVBQUUsR0FBYTtRQUN0RCxvR0FBb0c7UUFDcEcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFTSx5QkFBeUI7UUFDNUIsT0FBTztZQUNILEdBQUcsRUFBRTtnQkFDRDtvQkFDSSxHQUFHLEVBQUUsTUFBTTtvQkFDWCxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7aUJBQzVDO2FBQ0o7WUFDRCxJQUFJLEVBQUU7Z0JBQ0Y7b0JBQ0ksR0FBRyxFQUFFLE1BQU07b0JBQ1gsT0FBTyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2lCQUM1QzthQUNKO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFDRDs7T0FFRztJQUNLLGdCQUFnQixDQUFDLE1BQW9CO1FBQ3pDLE9BQU8sSUFBQSxvQ0FBZSxFQUFDLE1BQU0sRUFBRTtZQUMzQixNQUFNLEVBQUUsYUFBYTtZQUNyQixZQUFZLEVBQUUsTUFBTTtTQUN2QixDQUFRLENBQUM7SUFDZCxDQUFDO0NBQ0o7QUE5V0Qsc0NBOFdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJTWlkZGxld2FyZUNvbnRyaWJ1dGlvbiB9IGZyb20gJy4uL3NlcnZlci9pbnRlcmZhY2VzJztcbmltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBNY3BTZXJ2ZXIsIFJlc291cmNlVGVtcGxhdGUgfSBmcm9tICdAbW9kZWxjb250ZXh0cHJvdG9jb2wvc2RrL3NlcnZlci9tY3AuanMnO1xuaW1wb3J0IHsgU3RyZWFtYWJsZUhUVFBTZXJ2ZXJUcmFuc3BvcnQgfSBmcm9tICdAbW9kZWxjb250ZXh0cHJvdG9jb2wvc2RrL3NlcnZlci9zdHJlYW1hYmxlSHR0cC5qcyc7XG5pbXBvcnQgeyB0b29sUmVnaXN0cnkgfSBmcm9tICcuLi9hcGkvZGVjb3JhdG9yL2RlY29yYXRvcic7XG5pbXBvcnQgeyB6IH0gZnJvbSAnem9kJztcbmltcG9ydCAqIGFzIHBrZ0pzb24gZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFJlc291cmNlTWFuYWdlciB9IGZyb20gJy4vcmVzb3VyY2VzJztcbmltcG9ydCB7IEhUVFBfU1RBVFVTIH0gZnJvbSAnLi4vYXBpL2Jhc2Uvc2NoZW1hLWJhc2UnO1xuaW1wb3J0IHsgQnVpbGRlckhvb2sgfSBmcm9tICcuL2hvb2tzL2J1aWxkZXIuaG9vayc7XG5pbXBvcnQgdHlwZSB7IEh0dHBTdGF0dXNDb2RlIH0gZnJvbSAnLi4vYXBpL2Jhc2Uvc2NoZW1hLWJhc2UnO1xuaW1wb3J0IHN0cmlwQW5zaSBmcm9tICdzdHJpcC1hbnNpJztcbmltcG9ydCB7IHpvZFRvSnNvblNjaGVtYSB9IGZyb20gJ3pvZC10by1qc29uLXNjaGVtYSc7XG5pbXBvcnQgeyBMaXN0VG9vbHNSZXF1ZXN0U2NoZW1hIH0gZnJvbSAnQG1vZGVsY29udGV4dHByb3RvY29sL3Nkay90eXBlcy5qcyc7XG5pbXBvcnQgeyBhc3NldE1hbmFnZXIgfSBmcm9tICcuLi9jb3JlL2Fzc2V0cyc7XG5pbXBvcnQge1xuICAgIGNvbXBsZXRlTWNwVG9vbENhbGxDb250ZXh0LFxuICAgIHJ1bldpdGhNY3BUb29sQ2FsbENvbnRleHQsXG59IGZyb20gJy4vdG9vbC1jYWxsLWNvbnRleHQnO1xuaW1wb3J0IHR5cGUgeyBNY3BSZXF1ZXN0SGVhZGVycyB9IGZyb20gJy4vdG9vbC1jYWxsLWNvbnRleHQnO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNUb29sRXJyb3JDb2RlKGNvZGU6IHVua25vd24pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGNvZGUgPT09ICdudW1iZXInICYmIGNvZGUgPj0gNTAwICYmIGNvZGUgPCA2MDA7XG59XG5cbmludGVyZmFjZSBNY3BUb29sSGFuZGxlckV4dHJhIHtcbiAgICByZXF1ZXN0SW5mbz86IHtcbiAgICAgICAgaGVhZGVycz86IE1jcFJlcXVlc3RIZWFkZXJzO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHdpdGhNY3BUb29sQ2FsbENvbnRleHQ8VD4oXG4gICAgY2FsbGJhY2s6IChhcmdzOiBhbnkpID0+IFByb21pc2U8VD4sXG4pOiAoYXJnczogYW55LCBleHRyYTogTWNwVG9vbEhhbmRsZXJFeHRyYSkgPT4gUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIGFzeW5jIChhcmdzLCBleHRyYSkgPT4gcnVuV2l0aE1jcFRvb2xDYWxsQ29udGV4dChleHRyYS5yZXF1ZXN0SW5mbz8uaGVhZGVycywgYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGNhbGxiYWNrKGFyZ3MpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb21wbGV0ZU1jcFRvb2xDYWxsQ29udGV4dCgpO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgLy8gRG8gbm90IGxvZyBmaW5hbGl6YXRpb24gZXJyb3IgZGV0YWlscyBvciByZXF1ZXN0IG1ldGFkYXRhLCB3aGljaCBtYXkgY29udGFpblxuICAgICAgICAgICAgICAgIC8vIHNlbnNpdGl2ZSBpbmZvcm1hdGlvbi4gQSBmaW5hbGl6YXRpb24gZmFpbHVyZSBtdXN0IG5vdCByZXBsYWNlIHRoZSB0b29sIHJlc3VsdC5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQXSBUb29sLWNhbGwgZmluYWxpemF0aW9uIGZhaWxlZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgTWNwTWlkZGxld2FyZSB7XG4gICAgcHJpdmF0ZSBzZXJ2ZXI6IE1jcFNlcnZlcjtcbiAgICBwcml2YXRlIHJlc291cmNlTWFuYWdlcjogUmVzb3VyY2VNYW5hZ2VyO1xuICAgIHByaXZhdGUgYnVpbGRlckhvb2s6IEJ1aWxkZXJIb29rO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYnVpbGRlckhvb2sgPSBuZXcgQnVpbGRlckhvb2soKTtcbiAgICAgICAgLy8g5Yib5bu6IE1DUCBzZXJ2ZXJcbiAgICAgICAgdGhpcy5zZXJ2ZXIgPSBuZXcgTWNwU2VydmVyKHtcbiAgICAgICAgICAgIG5hbWU6ICdjb2Nvcy1jbGknLFxuICAgICAgICAgICAgdmVyc2lvbjogcGtnSnNvbi52ZXJzaW9uIHx8ICcwLjAuMCcsXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGNhcGFiaWxpdGllczoge1xuICAgICAgICAgICAgICAgIHJlc291cmNlczoge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGxpc3RDaGFuZ2VkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZXM6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRvb2xzOiB7fSxcbiAgICAgICAgICAgICAgICAvLyDml6Xlv5fog73lipvvvIjosIPor5XnlKjvvIlcbiAgICAgICAgICAgICAgICBsb2dnaW5nOiB7fSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5Yid5aeL5YyW6LWE5rqQ566h55CG5ZmoXG4gICAgICAgIGNvbnN0IGRvY3NQYXRoID0gam9pbihfX2Rpcm5hbWUsICcuLi8uLi9kb2NzJyk7XG4gICAgICAgIHRoaXMucmVzb3VyY2VNYW5hZ2VyID0gbmV3IFJlc291cmNlTWFuYWdlcihkb2NzUGF0aCk7XG5cbiAgICAgICAgLy8g5rOo5YaM6LWE5rqQ5ZKM5bel5YW3XG4gICAgICAgIHRoaXMucmVnaXN0ZXJEZWNvcmF0b3JUb29scygpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyUmVzb3VyY2VzTGlzdCgpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyQXNzZXRSZXNvdXJjZXNUZW1wbGF0ZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVnaXN0ZXJSZXNvdXJjZXNMaXN0KCkge1xuICAgICAgICAvLyDkvb/nlKjotYTmupDnrqHnkIblmajliqDovb3miYDmnInotYTmupBcbiAgICAgICAgY29uc3QgcmVzb3VyY2VzID0gdGhpcy5yZXNvdXJjZU1hbmFnZXIubG9hZEFsbFJlc291cmNlcygpO1xuXG4gICAgICAgIC8vIOaJuemHj+azqOWGjOi1hOa6kFxuICAgICAgICByZXNvdXJjZXMuZm9yRWFjaCgocmVzb3VyY2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLnJlc291cmNlKHJlc291cmNlLm5hbWUsIHJlc291cmNlLnVyaSwge1xuICAgICAgICAgICAgICAgIHRpdGxlOiByZXNvdXJjZS50aXRsZSxcbiAgICAgICAgICAgICAgICBtaW1lVHlwZTogcmVzb3VyY2UubWltZVR5cGVcbiAgICAgICAgICAgIH0sIGFzeW5jIChfdXJpOiBVUkwsIGV4dHJhKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5qC55o2u5a6i5oi356uv5Zyw5Yy66YCJ5oup6K+t6KiAXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmVycmVkTGFuZ3VhZ2UgPSB0aGlzLnJlc291cmNlTWFuYWdlci5kZXRlY3RDbGllbnRMYW5ndWFnZShleHRyYSk7XG5cbiAgICAgICAgICAgICAgICAvLyDliqjmgIHor7vlj5bmlofku7blhoXlrrlcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0Q29udGVudCA9IHRoaXMucmVzb3VyY2VNYW5hZ2VyLnJlYWRGaWxlQ29udGVudChyZXNvdXJjZSwgcHJlZmVycmVkTGFuZ3VhZ2UpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudHM6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmk6IHJlc291cmNlLnVyaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHRleHRDb250ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWltZVR5cGU6IHJlc291cmNlLm1pbWVUeXBlXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhozpobnnm67otYTmupAgUmVzb3VyY2UgVGVtcGxhdGXvvIzmlK/mjIHmjIkgY2NUeXBlIOafpeivouW3peeoi+i1hOa6kOWIl+ihqFxuICAgICAqL1xuICAgIHByaXZhdGUgcmVnaXN0ZXJBc3NldFJlc291cmNlc1RlbXBsYXRlKCkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IG5ldyBSZXNvdXJjZVRlbXBsYXRlKCdjb2NvczovL2Fzc2V0cy97Y2NUeXBlfScsIHtcbiAgICAgICAgICAgIGxpc3Q6IHVuZGVmaW5lZCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5zZXJ2ZXIucmVzb3VyY2UoXG4gICAgICAgICAgICAncHJvamVjdC1hc3NldHMtYnktdHlwZScsXG4gICAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ1Byb2plY3QgQXNzZXRzIGJ5IFR5cGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUXVlcnkgcHJvamVjdCBhc3NldHMgZmlsdGVyZWQgYnkgY2NUeXBlLCBlLmcuIGNjLkltYWdlQXNzZXQsIGNjLlNjZW5lQXNzZXQsIGNjLlByZWZhYiwgY2MuTWF0ZXJpYWwsIGNjLkFuaW1hdGlvbkNsaXAsIGNjLlNjcmlwdCcsXG4gICAgICAgICAgICAgICAgbWltZVR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhc3luYyAodXJpOiBVUkwsIHZhcmlhYmxlcykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNjVHlwZSA9IHZhcmlhYmxlcy5jY1R5cGUgYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3JlZ2lzdGVyQXNzZXRSZXNvdXJjZXMnLGNjVHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvcyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mb3MoeyBjY1R5cGUgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2ltcGxpZmllZCA9IGFzc2V0SW5mb3NcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoaW5mbykgPT4gIWluZm8udXJsPy5zdGFydHNXaXRoKCdkYjovL2ludGVybmFsJykpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGluZm8pID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBpbmZvLnVybCxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogaW5mby51dWlkLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBpbmZvLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydGVyOiBpbmZvLmltcG9ydGVyLFxuICAgICAgICAgICAgICAgICAgICBmaWxlOiBpbmZvLmZpbGUsXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50czogW3tcbiAgICAgICAgICAgICAgICAgICAgdXJpOiB1cmkuaHJlZixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbWVUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBKU09OLnN0cmluZ2lmeShzaW1wbGlmaWVkLCBudWxsLCAyKSxcbiAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhowgbWNwIHRvb2xzXG4gICAgICovXG4gICAgcHJpdmF0ZSByZWdpc3RlckRlY29yYXRvclRvb2xzKCkge1xuICAgICAgICBBcnJheS5mcm9tKHRvb2xSZWdpc3RyeS5lbnRyaWVzKCkpLmZvckVhY2goKFt0b29sTmFtZSwgeyB0YXJnZXQsIG1ldGEgfV0pID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gLS0tIOatpemqpCBBOiDmnoTlu7ogWm9kIFNoYXBlIC0tLVxuICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0U2NoZW1hRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCB6LlpvZFR5cGVBbnk+ID0ge307XG4gICAgICAgICAgICAgICAgbWV0YS5wYXJhbVNjaGVtYXNcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuaW5kZXggLSBiLmluZGV4KVxuICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaChwYXJhbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW0ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRlckhvb2sub25SZWdpc3RlclBhcmFtKHRvb2xOYW1lLCBwYXJhbSwgaW5wdXRTY2hlbWFGaWVsZHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5wdXRTY2hlbWFGaWVsZHNbcGFyYW0ubmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRTY2hlbWFGaWVsZHNbcGFyYW0ubmFtZV0gPSBwYXJhbS5zY2hlbWE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyAtLS0g5q2l6aqkIEI6IOazqOWGjOW3peWFtyAtLS1cbiAgICAgICAgICAgICAgICAvLyDkvb/nlKggdGhpcy5zZXJ2ZXIudG9vbCDms6jlhozvvIzkvKDlhaUgWm9kIFNoYXBlIOS7peS+vyBTREsg6L+b6KGM6aqM6K+BXG4gICAgICAgICAgICAgICAgdGhpcy5zZXJ2ZXIudG9vbChcbiAgICAgICAgICAgICAgICAgICAgdG9vbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIG1ldGEuZGVzY3JpcHRpb24gfHwgYFRvb2w6ICR7dG9vbE5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRTY2hlbWFGaWVsZHMsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhNY3BUb29sQ2FsbENvbnRleHQoYXN5bmMgKGFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFyZ3Mg5bey57uP5piv6aqM6K+B6L+H55qE5Y+C5pWw5a+56LGhICjlr7nkuo4gYnVpbGRlci1idWlsZC5vcHRpb25zIOaYryBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRlckhvb2sub25CZWZvcmVFeGVjdXRlKHRvb2xOYW1lLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDov5nph4znmoQgcHJlcGFyZU1ldGhvZEFyZ3VtZW50cyDkuLvopoHmmK/kuLrkuobmjInpobrluo/mjpLliJflj4LmlbDnu5kgYXBwbHkg5L2/55SoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5rOo5oSP77yaYXJncyDmmK/lr7nosaHvvIxwcmVwYXJlTWV0aG9kQXJndW1lbnRzIOmcgOimgeWkhOeQhuWvueixoVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1ldGhvZEFyZ3MgPSB0aGlzLnByZXBhcmVNZXRob2RBcmd1bWVudHMobWV0YSwgYXJncywgdG9vbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2FsbFRvb2xNZXRob2QodGFyZ2V0LCBtZXRhLCBtZXRob2RBcmdzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZFJlc3VsdCA9IHRoaXMuZm9ybWF0VG9vbFJlc3VsdChtZXRhLCByZXN1bHQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN0cnVjdHVyZWRDb250ZW50OiBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldGEucmV0dXJuU2NoZW1hKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0ZWRSZXN1bHQgPSBtZXRhLnJldHVyblNjaGVtYS5wYXJzZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJlZENvbnRlbnQgPSB7IHJlc3VsdDogdmFsaWRhdGVkUmVzdWx0IH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJlZENvbnRlbnQgPSB7IHJlc3VsdDogcmVzdWx0IH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJ1Y3R1cmVkQ29udGVudCA9IHsgcmVzdWx0OiByZXN1bHQgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYGNhbGwgJHt0b29sTmFtZX0gd2l0aCBhcmdzOiR7bWV0aG9kQXJncy50b1N0cmluZygpfSByZXN1bHQ6ICR7Zm9ybWF0dGVkUmVzdWx0fWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBbeyB0eXBlOiAndGV4dCcgYXMgY29uc3QsIHRleHQ6IGZvcm1hdHRlZFJlc3VsdCB9XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJlZENvbnRlbnQ6IHN0cnVjdHVyZWRDb250ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0Vycm9yOiBpc1Rvb2xFcnJvckNvZGUocmVzdWx0Py5jb2RlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yU3RhY2sgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRldGFpbGVkUmVhc29uID0gYFRvb2wgZXhlY3V0aW9uIGZhaWxlZCAoJHt0b29sTmFtZX0pOiAke2Vycm9yTWVzc2FnZX1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JTdGFjayAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsZWRSZWFzb24gKz0gYFxcblxcblN0YWNrIHRyYWNlOlxcbiR7ZXJyb3JTdGFja31gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbGVkUmVhc29uICs9IGBcXG5cXG5QYXJhbWV0ZXJzIHBhc3NlZDpcXG4ke0pTT04uc3RyaW5naWZ5KGFyZ3MsIG51bGwsIDIpfWA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW01DUF0gJHtkZXRhaWxlZFJlYXNvbn1gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvclJlc3VsdDogeyBjb2RlOiBIdHRwU3RhdHVzQ29kZTsgZGF0YT86IGFueTsgcmVhc29uPzogc3RyaW5nIH0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBIVFRQX1NUQVRVUy5JTlRFUk5BTF9TRVJWRVJfRVJST1IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFzb246IGRldGFpbGVkUmVhc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZFJlc3VsdCA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdWx0OiBlcnJvclJlc3VsdCB9LCBudWxsLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFt7IHR5cGU6ICd0ZXh0JyBhcyBjb25zdCwgdGV4dDogZm9ybWF0dGVkUmVzdWx0IH1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJlZENvbnRlbnQ6IHsgcmVzdWx0OiBlcnJvclJlc3VsdCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNFcnJvcjogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZWdpc3RlciB0b29sICR7dG9vbE5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gLS0tIOatpemqpCBDOiDopobnm5YgdG9vbHMvbGlzdCDlpITnkIbnqIvluo8gLS0tXG4gICAgICAgIC8vIOS4uuS6huaUr+aMgSBHZW1pbmkgKOS4jeaUr+aMgSAkcmVmKe+8jOaIkeS7rOmcgOimgeaJi+WKqOeUn+aIkOW5tui/lOWbniBHZW1pbmkg5YW85a6555qEIEpTT04gU2NoZW1hXG4gICAgICAgIHRoaXMuc2VydmVyLnNlcnZlci5zZXRSZXF1ZXN0SGFuZGxlcihMaXN0VG9vbHNSZXF1ZXN0U2NoZW1hLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0b29scyA9IEFycmF5LmZyb20odG9vbFJlZ2lzdHJ5LmVudHJpZXMoKSkubWFwKChbdG9vbE5hbWUsIHsgbWV0YSB9XSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0U2NoZW1hRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCB6LlpvZFR5cGVBbnk+ID0ge307XG4gICAgICAgICAgICAgICAgbWV0YS5wYXJhbVNjaGVtYXNcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuaW5kZXggLSBiLmluZGV4KVxuICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaChwYXJhbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW0ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hRmllbGRzW3BhcmFtLm5hbWVdID0gcGFyYW0uc2NoZW1hO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsSW5wdXRab2RTY2hlbWEgPSB6Lm9iamVjdChpbnB1dFNjaGVtYUZpZWxkcyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZ2VtaW5pSW5wdXRTY2hlbWEgPSB0aGlzLnpvZFRvSlNPTlNjaGVtYTcoZnVsbElucHV0Wm9kU2NoZW1hKTtcblxuICAgICAgICAgICAgICAgIC8vIOaehOW7uui+k+WHuiBzY2hlbWFcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRwdXRTY2hlbWFGaWVsZHMgPSBtZXRhLnJldHVyblNjaGVtYSA/IHsgcmVzdWx0OiBtZXRhLnJldHVyblNjaGVtYSB9IDogeyByZXN1bHQ6IHouYW55KCkgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsT3V0cHV0Wm9kU2NoZW1hID0gei5vYmplY3Qob3V0cHV0U2NoZW1hRmllbGRzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBnZW1pbmlPdXRwdXRTY2hlbWEgPSB0aGlzLnpvZFRvSlNPTlNjaGVtYTcoZnVsbE91dHB1dFpvZFNjaGVtYSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiB0b29sTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IG1ldGEudGl0bGUgfHwgdG9vbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBtZXRhLmRlc2NyaXB0aW9uIHx8IGBUb29sOiAke3Rvb2xOYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBnZW1pbmlJbnB1dFNjaGVtYSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0U2NoZW1hOiBnZW1pbmlPdXRwdXRTY2hlbWFcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7IHRvb2xzIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWHhuWkh+aWueazleWPguaVsFxuICAgICAqL1xuICAgIHByaXZhdGUgcHJlcGFyZU1ldGhvZEFyZ3VtZW50cyhtZXRhOiBhbnksIGFyZ3M6IGFueSwgdG9vbE5hbWU6IHN0cmluZyk6IGFueVtdIHtcbiAgICAgICAgaWYgKCFtZXRhLnBhcmFtU2NoZW1hcyB8fCBtZXRhLnBhcmFtU2NoZW1hcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGhvZEFyZ3M6IGFueVtdID0gW107XG4gICAgICAgIGNvbnN0IHNvcnRlZFBhcmFtcyA9IG1ldGEucGFyYW1TY2hlbWFzLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiBhLmluZGV4IC0gYi5pbmRleCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXJhbSBvZiBzb3J0ZWRQYXJhbXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtLm5hbWUgfHwgYHBhcmFtJHtwYXJhbS5pbmRleH1gO1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBhcmdzW3BhcmFtTmFtZV07XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g5L2/55SoIFpvZCBzY2hlbWEg6aqM6K+B5ZKM6L2s5o2i5Y+C5pWwXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdGVkVmFsdWUgPSBwYXJhbS5zY2hlbWEucGFyc2UodmFsdWUpO1xuICAgICAgICAgICAgICAgIG1ldGhvZEFyZ3NbcGFyYW0uaW5kZXhdID0gdmFsaWRhdGVkVmFsdWU7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIOWwneivleWkhOeQhiBHZW1pbmkg5Lyg5Zue55qEIHN0cmluZyDnsbvlnovmlbDlrZcgKOmSiOWvuSBudW1lcmljIGVudW0pXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgIWlzTmFOKE51bWJlcih2YWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBudW1WYWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0ZWRWYWx1ZSA9IHBhcmFtLnNjaGVtYS5wYXJzZShudW1WYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2RBcmdzW3BhcmFtLmluZGV4XSA9IHZhbGlkYXRlZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGlubmVyRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW/veeVpeWGhemDqOmUmeivr++8jOe7p+e7reaKm+WHuuWOn+Wni+mUmeivr1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFBhcmFtZXRlciB2YWxpZGF0aW9uIGZhaWxlZCBmb3IgJHtwYXJhbU5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkZXJIb29rLm9uVmFsaWRhdGlvbkZhaWxlZCh0b29sTmFtZSwgcGFyYW1OYW1lLCBlcnJvcik7XG5cbiAgICAgICAgICAgICAgICAvLyDkvb/nlKjljp/lp4vlgLxcbiAgICAgICAgICAgICAgICBtZXRob2RBcmdzW3BhcmFtLmluZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1ldGhvZEFyZ3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6LCD55So5bel5YW35pa55rOVXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBjYWxsVG9vbE1ldGhvZCh0YXJnZXQ6IGFueSwgbWV0YTogYW55LCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIC8vIOiOt+WPluaIluWIm+W7uuWunuS+i1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGF3YWl0IHRoaXMuZ2V0VG9vbEluc3RhbmNlKHRhcmdldCk7XG5cbiAgICAgICAgLy8g6I635Y+W5pa55rOVXG4gICAgICAgIGNvbnN0IG1ldGhvZCA9IGluc3RhbmNlW21ldGEubWV0aG9kTmFtZV07XG4gICAgICAgIGlmICh0eXBlb2YgbWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1ldGhvZCAke1N0cmluZyhtZXRhLm1ldGhvZE5hbWUpfSBub3QgZm91bmQgb24gaW5zdGFuY2VgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiwg+eUqOaWueazlVxuICAgICAgICByZXR1cm4gYXdhaXQgbWV0aG9kLmFwcGx5KGluc3RhbmNlLCBhcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5blt6Xlhbflrp7kvotcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdldFRvb2xJbnN0YW5jZSh0YXJnZXQ6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIC8vIOWmguaenCB0YXJnZXQg5bey57uP5piv5a6e5L6L77yM55u05o6l6L+U5ZueXG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnb2JqZWN0JyAmJiB0YXJnZXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjcmVhdGUgdG9vbCBpbnN0YW5jZScpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagvOW8j+WMluW3peWFt+e7k+aenFxuICAgICAqL1xuICAgIHByaXZhdGUgZm9ybWF0VG9vbFJlc3VsdChtZXRhOiBhbnksIHJlc3VsdDogYW55KTogc3RyaW5nIHtcbiAgICAgICAgLy8g5p6E5bu656ym5ZCIIHNjaGVtYSDnmoTnu5Pmnpznu5PmnoTvvIznlKggcmVzdWx0IOWtl+auteWMheijhVxuICAgICAgICBpZiAobWV0YS5yZXR1cm5TY2hlbWEpIHtcbiAgICAgICAgICAgIC8vIOmqjOivgee7k+aenOaYr+WQpuespuWQiOmihOacn+eahCBzY2hlbWFcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJlYXNvbiA9IHN0cmlwQW5zaShyZXN1bHQucmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdGVkUmVzdWx0ID0gbWV0YS5yZXR1cm5TY2hlbWEucGFyc2UocmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyByZXN1bHQ6IHZhbGlkYXRlZFJlc3VsdCB9LCBudWxsLCAyKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUb29sIHJlc3VsdCB2YWxpZGF0aW9uIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyByZXN1bHQ6IHJlc3VsdCB9LCBudWxsLCAyKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZU1jcFJlcXVlc3QocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDkuLrmr4/kuKror7fmsYLliJvlu7rmlrDnmoTkvKDovpPlsYLku6XpmLLmraLor7fmsYIgSUQg5Yay56qBXG4gICAgICAgICAgICBjb25zdCB0cmFuc3BvcnQgPSBuZXcgU3RyZWFtYWJsZUhUVFBTZXJ2ZXJUcmFuc3BvcnQoe1xuICAgICAgICAgICAgICAgIHNlc3Npb25JZEdlbmVyYXRvcjogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIGVuYWJsZUpzb25SZXNwb25zZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlcy5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXJ2ZXIuY29ubmVjdCh0cmFuc3BvcnQpO1xuICAgICAgICAgICAgYXdhaXQgdHJhbnNwb3J0LmhhbmRsZVJlcXVlc3QocmVxLCByZXMsIHJlcS5ib2R5KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01DUCByZXF1ZXN0IGhhbmRsaW5nIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVTc2VSZXF1ZXN0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyBTU0UgaXMgbm90IHN1cHBvcnRlZC4gUmV0dXJuIDQwNSBNZXRob2QgTm90IEFsbG93ZWQgdG8gaW5kaWNhdGUgdGhhdCBQT1NUIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG4gICAgICAgIHJlcy5zdGF0dXMoNDA1KS5zZXQoJ0FsbG93JywgJ1BPU1QnKS5zZW5kKCdNZXRob2QgTm90IEFsbG93ZWQnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0TWlkZGxld2FyZUNvbnRyaWJ1dGlvbigpOiBJTWlkZGxld2FyZUNvbnRyaWJ1dGlvbiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXQ6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9tY3AnLFxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyOiB0aGlzLmhhbmRsZVNzZVJlcXVlc3QuYmluZCh0aGlzKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBwb3N0OiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvbWNwJyxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcjogdGhpcy5oYW5kbGVNY3BSZXF1ZXN0LmJpbmQodGhpcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIOWwhiBab2QgU2NoZW1hIOi9rOaNouS4uuWFvOWuueaAp+mrmOeahCBqc29uU2NoZW1hNyDmoLzlvI9cbiAgICAgKi9cbiAgICBwcml2YXRlIHpvZFRvSlNPTlNjaGVtYTcoem9kT2JqOiB6LlpvZFR5cGVBbnkpOiBhbnkge1xuICAgICAgICByZXR1cm4gem9kVG9Kc29uU2NoZW1hKHpvZE9iaiwge1xuICAgICAgICAgICAgdGFyZ2V0OiAnanNvblNjaGVtYTcnLFxuICAgICAgICAgICAgJHJlZlN0cmF0ZWd5OiAnbm9uZScsXG4gICAgICAgIH0pIGFzIGFueTtcbiAgICB9XG59XG4iXX0=