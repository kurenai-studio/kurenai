/**
 * MCP Facade Module
 *
 * Called by the cocos-code utility process to register MCP middleware
 * in an already-initialized environment.
 * Prerequisite: the Server module must be started before calling this module.
 * This module only handles MCP-specific work: populating the toolRegistry
 * and registering MCP routes on the running server.
 */
export type { McpToolCallContext, McpToolCallLifecycleState, } from '../../mcp/tool-call-context';
export { getCurrentToolCallContext, registerToolCallFinalizer, } from '../../mcp/tool-call-context';
/**
 * Register MCP middleware on the running server.
 *
 * Note: the Express server must already be started via the Server module.
 * This function only:
 * 1. Imports API modules to populate the toolRegistry (@tool decorator side-effects)
 * 2. Creates McpMiddleware and registers routes on the server
 *
 * @returns MCP endpoint URL (e.g. http://localhost:9527/mcp)
 */
export declare function register(): Promise<string>;
/**
 * Clean up MCP state.
 * Note: does NOT stop the Express server — use the Server module for that.
 */
export declare function unregister(): Promise<void>;
/**
 * Get the MCP registration status.
 */
export declare function getStatus(): {
    registered: boolean;
    url?: string;
};
