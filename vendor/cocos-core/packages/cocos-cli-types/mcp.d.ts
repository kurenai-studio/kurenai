/** Returns the MCP tool-call context for the current asynchronous scope. */
export declare function getCurrentToolCallContext(): Readonly<McpToolCallContext> | undefined;

/**
 * Get the MCP registration status.
 */
export declare function getStatus(): {
    registered: boolean;
    url?: string;
};

export declare interface McpToolCallContext {
    readonly operationId: string;
    readonly lifecycleState: McpToolCallLifecycleState;
    getHeader(name: string): string | undefined;
}

export declare type McpToolCallLifecycleState = 'running' | 'completing' | 'completed';

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
 * Registers a finalizer for the current MCP tool call. Only the first callback for each key is
 * retained, allowing callers to register the same cleanup safely more than once per tool call.
 */
export declare function registerToolCallFinalizer(key: string | symbol, callback: () => void | Promise<void>): void;

/**
 * Clean up MCP state.
 * Note: does NOT stop the Express server — use the Server module for that.
 */
export declare function unregister(): Promise<void>;

export { }
