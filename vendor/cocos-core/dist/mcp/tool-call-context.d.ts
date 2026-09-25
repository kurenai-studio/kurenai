export type McpToolCallLifecycleState = 'running' | 'completing' | 'completed';
export interface McpToolCallContext {
    readonly operationId: string;
    readonly lifecycleState: McpToolCallLifecycleState;
    getHeader(name: string): string | undefined;
}
export type McpRequestHeaders = Readonly<Record<string, string | readonly string[] | undefined>>;
/** Returns the MCP tool-call context for the current asynchronous scope. */
export declare function getCurrentToolCallContext(): Readonly<McpToolCallContext> | undefined;
/** Returns the current MCP tool-call context, or throws when called outside a tool handler. */
export declare function requireMcpToolCallContext(): Readonly<McpToolCallContext>;
/** Runs a complete MCP tool call in an isolated asynchronous context. */
export declare function runWithMcpToolCallContext<T>(headers: McpRequestHeaders | undefined, callback: () => T): T;
/**
 * Registers a finalizer for the current MCP tool call. Only the first callback for each key is
 * retained, allowing callers to register the same cleanup safely more than once per tool call.
 */
export declare function registerToolCallFinalizer(key: string | symbol, callback: () => void | Promise<void>): void;
/**
 * Runs all finalizers for the current MCP tool call in registration order. A failure does not
 * prevent later finalizers from running, and the context always transitions to `completed`.
 */
export declare function completeMcpToolCallContext(): Promise<void>;
