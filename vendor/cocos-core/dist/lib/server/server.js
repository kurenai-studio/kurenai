"use strict";
/**
 * Server Facade Module
 *
 * Provides a simplified interface for managing the Express HTTP server.
 * Wraps the core server service with startup guards and status tracking.
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
exports.start = start;
exports.stop = stop;
exports.getUrl = getUrl;
exports.register = register;
exports.getStatus = getStatus;
let serverUrl;
let isRunning = false;
/**
 * Initialize and start the Express HTTP server.
 *
 * @param port  Preferred port number. Auto-selected if omitted (retried on conflict).
 * @param host  Bind address / base-URL host. Defaults to localhost.
 * @returns The server base URL (e.g. http://localhost:9527), reflecting the
 *          actual bound port and the configured host.
 */
async function start(port, host) {
    if (isRunning && serverUrl) {
        return serverUrl;
    }
    const { serverService } = await Promise.resolve().then(() => __importStar(require('../../server/server')));
    await serverService.start(port, host);
    serverUrl = serverService.url;
    isRunning = true;
    return serverUrl;
}
/**
 * Stop the Express HTTP server.
 */
async function stop() {
    if (!isRunning) {
        return;
    }
    const { serverService } = await Promise.resolve().then(() => __importStar(require('../../server/server')));
    await serverService.stop();
    isRunning = false;
    serverUrl = undefined;
}
/**
 * Get the current server base URL.
 * Returns undefined if the server is not running.
 */
function getUrl() {
    return serverUrl;
}
/**
 * Register a middleware contribution (routes, static files, sockets)
 * on the running server.
 *
 * @param name   Middleware identifier
 * @param module Middleware contribution config
 */
async function register(name, module) {
    const { serverService } = await Promise.resolve().then(() => __importStar(require('../../server/server')));
    serverService.register(name, module);
}
/**
 * Get the server running status.
 */
function getStatus() {
    return { running: isRunning, url: serverUrl };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9zZXJ2ZXIvc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7R0FLRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhSCxzQkFXQztBQUtELG9CQVVDO0FBTUQsd0JBRUM7QUFTRCw0QkFNQztBQUtELDhCQUVDO0FBbkVELElBQUksU0FBNkIsQ0FBQztBQUNsQyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFFdEI7Ozs7Ozs7R0FPRztBQUNJLEtBQUssVUFBVSxLQUFLLENBQUMsSUFBYSxFQUFFLElBQWE7SUFDcEQsSUFBSSxTQUFTLElBQUksU0FBUyxFQUFFLENBQUM7UUFDekIsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVELE1BQU0sRUFBRSxhQUFhLEVBQUUsR0FBRyx3REFBYSxxQkFBcUIsR0FBQyxDQUFDO0lBQzlELE1BQU0sYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFdEMsU0FBUyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUM7SUFDOUIsU0FBUyxHQUFHLElBQUksQ0FBQztJQUNqQixPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBRUQ7O0dBRUc7QUFDSSxLQUFLLFVBQVUsSUFBSTtJQUN0QixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDYixPQUFPO0lBQ1gsQ0FBQztJQUVELE1BQU0sRUFBRSxhQUFhLEVBQUUsR0FBRyx3REFBYSxxQkFBcUIsR0FBQyxDQUFDO0lBQzlELE1BQU0sYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRTNCLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDbEIsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUMxQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsTUFBTTtJQUNsQixPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0ksS0FBSyxVQUFVLFFBQVEsQ0FDMUIsSUFBWSxFQUNaLE1BQWlFO0lBRWpFLE1BQU0sRUFBRSxhQUFhLEVBQUUsR0FBRyx3REFBYSxxQkFBcUIsR0FBQyxDQUFDO0lBQzlELGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLFNBQVM7SUFDckIsT0FBTyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxDQUFDO0FBQ2xELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNlcnZlciBGYWNhZGUgTW9kdWxlXG4gKlxuICogUHJvdmlkZXMgYSBzaW1wbGlmaWVkIGludGVyZmFjZSBmb3IgbWFuYWdpbmcgdGhlIEV4cHJlc3MgSFRUUCBzZXJ2ZXIuXG4gKiBXcmFwcyB0aGUgY29yZSBzZXJ2ZXIgc2VydmljZSB3aXRoIHN0YXJ0dXAgZ3VhcmRzIGFuZCBzdGF0dXMgdHJhY2tpbmcuXG4gKi9cblxubGV0IHNlcnZlclVybDogc3RyaW5nIHwgdW5kZWZpbmVkO1xubGV0IGlzUnVubmluZyA9IGZhbHNlO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYW5kIHN0YXJ0IHRoZSBFeHByZXNzIEhUVFAgc2VydmVyLlxuICpcbiAqIEBwYXJhbSBwb3J0ICBQcmVmZXJyZWQgcG9ydCBudW1iZXIuIEF1dG8tc2VsZWN0ZWQgaWYgb21pdHRlZCAocmV0cmllZCBvbiBjb25mbGljdCkuXG4gKiBAcGFyYW0gaG9zdCAgQmluZCBhZGRyZXNzIC8gYmFzZS1VUkwgaG9zdC4gRGVmYXVsdHMgdG8gbG9jYWxob3N0LlxuICogQHJldHVybnMgVGhlIHNlcnZlciBiYXNlIFVSTCAoZS5nLiBodHRwOi8vbG9jYWxob3N0Ojk1MjcpLCByZWZsZWN0aW5nIHRoZVxuICogICAgICAgICAgYWN0dWFsIGJvdW5kIHBvcnQgYW5kIHRoZSBjb25maWd1cmVkIGhvc3QuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydChwb3J0PzogbnVtYmVyLCBob3N0Pzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoaXNSdW5uaW5nICYmIHNlcnZlclVybCkge1xuICAgICAgICByZXR1cm4gc2VydmVyVXJsO1xuICAgIH1cblxuICAgIGNvbnN0IHsgc2VydmVyU2VydmljZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9zZXJ2ZXIvc2VydmVyJyk7XG4gICAgYXdhaXQgc2VydmVyU2VydmljZS5zdGFydChwb3J0LCBob3N0KTtcblxuICAgIHNlcnZlclVybCA9IHNlcnZlclNlcnZpY2UudXJsO1xuICAgIGlzUnVubmluZyA9IHRydWU7XG4gICAgcmV0dXJuIHNlcnZlclVybDtcbn1cblxuLyoqXG4gKiBTdG9wIHRoZSBFeHByZXNzIEhUVFAgc2VydmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIWlzUnVubmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgeyBzZXJ2ZXJTZXJ2aWNlIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL3NlcnZlci9zZXJ2ZXInKTtcbiAgICBhd2FpdCBzZXJ2ZXJTZXJ2aWNlLnN0b3AoKTtcblxuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICAgIHNlcnZlclVybCA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGN1cnJlbnQgc2VydmVyIGJhc2UgVVJMLlxuICogUmV0dXJucyB1bmRlZmluZWQgaWYgdGhlIHNlcnZlciBpcyBub3QgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFVybCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBzZXJ2ZXJVcmw7XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBtaWRkbGV3YXJlIGNvbnRyaWJ1dGlvbiAocm91dGVzLCBzdGF0aWMgZmlsZXMsIHNvY2tldHMpXG4gKiBvbiB0aGUgcnVubmluZyBzZXJ2ZXIuXG4gKlxuICogQHBhcmFtIG5hbWUgICBNaWRkbGV3YXJlIGlkZW50aWZpZXJcbiAqIEBwYXJhbSBtb2R1bGUgTWlkZGxld2FyZSBjb250cmlidXRpb24gY29uZmlnXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWdpc3RlcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgbW9kdWxlOiBpbXBvcnQoJy4uLy4uL3NlcnZlci9pbnRlcmZhY2VzJykuSU1pZGRsZXdhcmVDb250cmlidXRpb24sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IHNlcnZlclNlcnZpY2UgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vc2VydmVyL3NlcnZlcicpO1xuICAgIHNlcnZlclNlcnZpY2UucmVnaXN0ZXIobmFtZSwgbW9kdWxlKTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHNlcnZlciBydW5uaW5nIHN0YXR1cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0YXR1cygpOiB7IHJ1bm5pbmc6IGJvb2xlYW47IHVybD86IHN0cmluZyB9IHtcbiAgICByZXR1cm4geyBydW5uaW5nOiBpc1J1bm5pbmcsIHVybDogc2VydmVyVXJsIH07XG59XG4iXX0=