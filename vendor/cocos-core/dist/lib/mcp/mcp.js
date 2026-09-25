"use strict";
/**
 * MCP Facade Module
 *
 * Called by the cocos-code utility process to register MCP middleware
 * in an already-initialized environment.
 * Prerequisite: the Server module must be started before calling this module.
 * This module only handles MCP-specific work: populating the toolRegistry
 * and registering MCP routes on the running server.
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerToolCallFinalizer = exports.getCurrentToolCallContext = void 0;
exports.register = register;
exports.unregister = unregister;
exports.getStatus = getStatus;
var tool_call_context_1 = require("../../mcp/tool-call-context");
Object.defineProperty(exports, "getCurrentToolCallContext", { enumerable: true, get: function () { return tool_call_context_1.getCurrentToolCallContext; } });
Object.defineProperty(exports, "registerToolCallFinalizer", { enumerable: true, get: function () { return tool_call_context_1.registerToolCallFinalizer; } });
let mcpUrl;
let registeringPromise;
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
async function register() {
    if (mcpUrl) {
        return mcpUrl;
    }
    // Reuse in-flight registration if called concurrently
    registeringPromise ??= doRegisterMcp();
    try {
        return await registeringPromise;
    }
    finally {
        registeringPromise = undefined;
    }
}
async function doRegisterMcp() {
    // 1. Import API modules to trigger @tool decorators and populate toolRegistry
    const { CocosAPI } = await Promise.resolve().then(() => __importStar(require('../../api/index')));
    await CocosAPI.create();
    // 2. Create MCP middleware and register routes on the running server
    const { McpMiddleware } = await Promise.resolve().then(() => __importStar(require('../../mcp/mcp.middleware')));
    const { register, getUrl } = await Promise.resolve().then(() => __importStar(require('../server/server')));
    const middleware = new McpMiddleware();
    await register('mcp', middleware.getMiddlewareContribution());
    const serverUrl = getUrl();
    mcpUrl = `${serverUrl}/mcp`;
    console.log(`[MCP] Middleware registered at: ${mcpUrl}`);
    return mcpUrl;
}
/**
 * Clean up MCP state.
 * Note: does NOT stop the Express server — use the Server module for that.
 */
async function unregister() {
    if (!mcpUrl) {
        return;
    }
    mcpUrl = undefined;
    console.log('[MCP] Middleware unregistered');
}
/**
 * Get the MCP registration status.
 */
function getStatus() {
    return { registered: !!mcpUrl, url: mcpUrl };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tY3AvbWNwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JILDRCQVlDO0FBd0JELGdDQU9DO0FBS0QsOEJBRUM7QUFwRUQsaUVBR3FDO0FBRnBDLDhIQUFBLHlCQUF5QixPQUFBO0FBQ3pCLDhIQUFBLHlCQUF5QixPQUFBO0FBRzFCLElBQUksTUFBMEIsQ0FBQztBQUMvQixJQUFJLGtCQUErQyxDQUFDO0FBRXBEOzs7Ozs7Ozs7R0FTRztBQUNJLEtBQUssVUFBVSxRQUFRO0lBQzdCLElBQUksTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxzREFBc0Q7SUFDdEQsa0JBQWtCLEtBQUssYUFBYSxFQUFFLENBQUM7SUFDdkMsSUFBSSxDQUFDO1FBQ0osT0FBTyxNQUFNLGtCQUFrQixDQUFDO0lBQ2pDLENBQUM7WUFBUyxDQUFDO1FBQ1Ysa0JBQWtCLEdBQUcsU0FBUyxDQUFDO0lBQ2hDLENBQUM7QUFDRixDQUFDO0FBRUQsS0FBSyxVQUFVLGFBQWE7SUFDM0IsOEVBQThFO0lBQzlFLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyx3REFBYSxpQkFBaUIsR0FBQyxDQUFDO0lBQ3JELE1BQU0sUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBRXhCLHFFQUFxRTtJQUNyRSxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsd0RBQWEsMEJBQTBCLEdBQUMsQ0FBQztJQUNuRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLHdEQUFhLGtCQUFrQixHQUFDLENBQUM7SUFDOUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQztJQUN2QyxNQUFNLFFBQVEsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQztJQUU5RCxNQUFNLFNBQVMsR0FBRyxNQUFNLEVBQUUsQ0FBQztJQUMzQixNQUFNLEdBQUcsR0FBRyxTQUFTLE1BQU0sQ0FBQztJQUU1QixPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELE9BQU8sTUFBTSxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7R0FHRztBQUNJLEtBQUssVUFBVSxVQUFVO0lBQy9CLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNiLE9BQU87SUFDUixDQUFDO0lBRUQsTUFBTSxHQUFHLFNBQVMsQ0FBQztJQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsU0FBUztJQUN4QixPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE1DUCBGYWNhZGUgTW9kdWxlXG4gKlxuICogQ2FsbGVkIGJ5IHRoZSBjb2Nvcy1jb2RlIHV0aWxpdHkgcHJvY2VzcyB0byByZWdpc3RlciBNQ1AgbWlkZGxld2FyZVxuICogaW4gYW4gYWxyZWFkeS1pbml0aWFsaXplZCBlbnZpcm9ubWVudC5cbiAqIFByZXJlcXVpc2l0ZTogdGhlIFNlcnZlciBtb2R1bGUgbXVzdCBiZSBzdGFydGVkIGJlZm9yZSBjYWxsaW5nIHRoaXMgbW9kdWxlLlxuICogVGhpcyBtb2R1bGUgb25seSBoYW5kbGVzIE1DUC1zcGVjaWZpYyB3b3JrOiBwb3B1bGF0aW5nIHRoZSB0b29sUmVnaXN0cnlcbiAqIGFuZCByZWdpc3RlcmluZyBNQ1Agcm91dGVzIG9uIHRoZSBydW5uaW5nIHNlcnZlci5cbiAqL1xuXG5leHBvcnQgdHlwZSB7XG5cdE1jcFRvb2xDYWxsQ29udGV4dCxcblx0TWNwVG9vbENhbGxMaWZlY3ljbGVTdGF0ZSxcbn0gZnJvbSAnLi4vLi4vbWNwL3Rvb2wtY2FsbC1jb250ZXh0JztcbmV4cG9ydCB7XG5cdGdldEN1cnJlbnRUb29sQ2FsbENvbnRleHQsXG5cdHJlZ2lzdGVyVG9vbENhbGxGaW5hbGl6ZXIsXG59IGZyb20gJy4uLy4uL21jcC90b29sLWNhbGwtY29udGV4dCc7XG5cbmxldCBtY3BVcmw6IHN0cmluZyB8IHVuZGVmaW5lZDtcbmxldCByZWdpc3RlcmluZ1Byb21pc2U6IFByb21pc2U8c3RyaW5nPiB8IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZWdpc3RlciBNQ1AgbWlkZGxld2FyZSBvbiB0aGUgcnVubmluZyBzZXJ2ZXIuXG4gKlxuICogTm90ZTogdGhlIEV4cHJlc3Mgc2VydmVyIG11c3QgYWxyZWFkeSBiZSBzdGFydGVkIHZpYSB0aGUgU2VydmVyIG1vZHVsZS5cbiAqIFRoaXMgZnVuY3Rpb24gb25seTpcbiAqIDEuIEltcG9ydHMgQVBJIG1vZHVsZXMgdG8gcG9wdWxhdGUgdGhlIHRvb2xSZWdpc3RyeSAoQHRvb2wgZGVjb3JhdG9yIHNpZGUtZWZmZWN0cylcbiAqIDIuIENyZWF0ZXMgTWNwTWlkZGxld2FyZSBhbmQgcmVnaXN0ZXJzIHJvdXRlcyBvbiB0aGUgc2VydmVyXG4gKlxuICogQHJldHVybnMgTUNQIGVuZHBvaW50IFVSTCAoZS5nLiBodHRwOi8vbG9jYWxob3N0Ojk1MjcvbWNwKVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0aWYgKG1jcFVybCkge1xuXHRcdHJldHVybiBtY3BVcmw7XG5cdH1cblxuXHQvLyBSZXVzZSBpbi1mbGlnaHQgcmVnaXN0cmF0aW9uIGlmIGNhbGxlZCBjb25jdXJyZW50bHlcblx0cmVnaXN0ZXJpbmdQcm9taXNlID8/PSBkb1JlZ2lzdGVyTWNwKCk7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGF3YWl0IHJlZ2lzdGVyaW5nUHJvbWlzZTtcblx0fSBmaW5hbGx5IHtcblx0XHRyZWdpc3RlcmluZ1Byb21pc2UgPSB1bmRlZmluZWQ7XG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZG9SZWdpc3Rlck1jcCgpOiBQcm9taXNlPHN0cmluZz4ge1xuXHQvLyAxLiBJbXBvcnQgQVBJIG1vZHVsZXMgdG8gdHJpZ2dlciBAdG9vbCBkZWNvcmF0b3JzIGFuZCBwb3B1bGF0ZSB0b29sUmVnaXN0cnlcblx0Y29uc3QgeyBDb2Nvc0FQSSB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9hcGkvaW5kZXgnKTtcblx0YXdhaXQgQ29jb3NBUEkuY3JlYXRlKCk7XG5cblx0Ly8gMi4gQ3JlYXRlIE1DUCBtaWRkbGV3YXJlIGFuZCByZWdpc3RlciByb3V0ZXMgb24gdGhlIHJ1bm5pbmcgc2VydmVyXG5cdGNvbnN0IHsgTWNwTWlkZGxld2FyZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9tY3AvbWNwLm1pZGRsZXdhcmUnKTtcblx0Y29uc3QgeyByZWdpc3RlciwgZ2V0VXJsIH0gPSBhd2FpdCBpbXBvcnQoJy4uL3NlcnZlci9zZXJ2ZXInKTtcblx0Y29uc3QgbWlkZGxld2FyZSA9IG5ldyBNY3BNaWRkbGV3YXJlKCk7XG5cdGF3YWl0IHJlZ2lzdGVyKCdtY3AnLCBtaWRkbGV3YXJlLmdldE1pZGRsZXdhcmVDb250cmlidXRpb24oKSk7XG5cblx0Y29uc3Qgc2VydmVyVXJsID0gZ2V0VXJsKCk7XG5cdG1jcFVybCA9IGAke3NlcnZlclVybH0vbWNwYDtcblxuXHRjb25zb2xlLmxvZyhgW01DUF0gTWlkZGxld2FyZSByZWdpc3RlcmVkIGF0OiAke21jcFVybH1gKTtcblx0cmV0dXJuIG1jcFVybDtcbn1cblxuLyoqXG4gKiBDbGVhbiB1cCBNQ1Agc3RhdGUuXG4gKiBOb3RlOiBkb2VzIE5PVCBzdG9wIHRoZSBFeHByZXNzIHNlcnZlciDigJQgdXNlIHRoZSBTZXJ2ZXIgbW9kdWxlIGZvciB0aGF0LlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdW5yZWdpc3RlcigpOiBQcm9taXNlPHZvaWQ+IHtcblx0aWYgKCFtY3BVcmwpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRtY3BVcmwgPSB1bmRlZmluZWQ7XG5cdGNvbnNvbGUubG9nKCdbTUNQXSBNaWRkbGV3YXJlIHVucmVnaXN0ZXJlZCcpO1xufVxuXG4vKipcbiAqIEdldCB0aGUgTUNQIHJlZ2lzdHJhdGlvbiBzdGF0dXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdGF0dXMoKTogeyByZWdpc3RlcmVkOiBib29sZWFuOyB1cmw/OiBzdHJpbmcgfSB7XG5cdHJldHVybiB7IHJlZ2lzdGVyZWQ6ICEhbWNwVXJsLCB1cmw6IG1jcFVybCB9O1xufVxuIl19