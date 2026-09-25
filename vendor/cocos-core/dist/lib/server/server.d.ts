/**
 * Server Facade Module
 *
 * Provides a simplified interface for managing the Express HTTP server.
 * Wraps the core server service with startup guards and status tracking.
 */
/**
 * Initialize and start the Express HTTP server.
 *
 * @param port  Preferred port number. Auto-selected if omitted (retried on conflict).
 * @param host  Bind address / base-URL host. Defaults to localhost.
 * @returns The server base URL (e.g. http://localhost:9527), reflecting the
 *          actual bound port and the configured host.
 */
export declare function start(port?: number, host?: string): Promise<string>;
/**
 * Stop the Express HTTP server.
 */
export declare function stop(): Promise<void>;
/**
 * Get the current server base URL.
 * Returns undefined if the server is not running.
 */
export declare function getUrl(): string | undefined;
/**
 * Register a middleware contribution (routes, static files, sockets)
 * on the running server.
 *
 * @param name   Middleware identifier
 * @param module Middleware contribution config
 */
export declare function register(name: string, module: import('../../server/interfaces').IMiddlewareContribution): Promise<void>;
/**
 * Get the server running status.
 */
export declare function getStatus(): {
    running: boolean;
    url?: string;
};
