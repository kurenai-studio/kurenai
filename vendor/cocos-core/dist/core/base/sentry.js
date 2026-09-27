"use strict";
/**
 * Soft-load Sentry so a broken/missing @sentry install cannot take down publish/host.
 * Telemetry is optional for kurenai; preview never needs it.
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
exports.initSentry = initSentry;
exports.captureException = captureException;
const console_1 = require("./console");

let Sentry = null;
let sentryLoadAttempted = false;
let sentryLoadError;

function loadSentry() {
    if (sentryLoadAttempted) return Sentry;
    sentryLoadAttempted = true;
    try {
        Sentry = __importStar(require("@sentry/node"));
    }
    catch (error) {
        Sentry = null;
        sentryLoadError = error instanceof Error ? error.message : String(error);
        try {
            console_1.newConsole.warn(`[Sentry] unavailable (${sentryLoadError}); telemetry disabled`);
        }
        catch {
            console.warn(`[Sentry] unavailable (${sentryLoadError}); telemetry disabled`);
        }
    }
    return Sentry;
}

/**
 * Sentry 初始化器
 */
class SentryInitializer {
    static initialized = false;
    /**
     * 初始化 Sentry
     */
    static init() {
        if (this.initialized) {
            return;
        }
        const sdk = loadSentry();
        if (!sdk) {
            return;
        }
        const sentryConfig = {
            dsn: 'https://4d4b6f03b83b47a4aad50674eedd087e@sentry.cocos.org/12',
            environment: 'development',
            release: require('../../../package.json').version,
            debug: false,
            tracesSampleRate: 0.2,
            sampleRate: 0.5,
            user: {
                id: 'cli-alpha-test',
            },
        };
        if (!sentryConfig.dsn) {
            return;
        }
        try {
            sdk.init({
                ...sentryConfig,
                beforeSend(event) {
                    if (event.request?.cookies) {
                        delete event.request.cookies;
                    }
                    if (event.request?.headers) {
                        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
                        sensitiveHeaders.forEach(header => {
                            delete event.request.headers[header];
                        });
                    }
                    return event;
                },
            });
            sdk.setContext('app', {
                name: 'cocos-cli',
                version: process.env.npm_package_version || '1.0.0',
                node_version: process.version,
                platform: process.platform,
                arch: process.arch,
            });
            setupGlobalErrorHandlers();
            this.initialized = true;
        }
        catch (error) {
            try {
                console_1.newConsole.warn(`[Sentry] init failed; continuing without telemetry: ${error instanceof Error ? error.message : String(error)}`);
            }
            catch {
                /* ignore */
            }
        }
    }
    static captureException(error, context) {
        if (!this.initialized) {
            return;
        }
        const sdk = loadSentry();
        if (!sdk) return;
        try {
            if (context) {
                sdk.withScope(scope => {
                    Object.entries(context).forEach(([key, value]) => {
                        scope.setContext(key, value);
                    });
                    sdk.captureException(error);
                });
            }
            else {
                sdk.captureException(error);
            }
        }
        catch (e) {
        }
    }
    static get isInitialized() {
        return this.initialized;
    }
}

function setupGlobalErrorHandlers() {
    let isHandlingError = false;
    process.on('uncaughtException', (error) => {
        if (isHandlingError) {
            return;
        }
        isHandlingError = true;
        try {
            console_1.newConsole.error(`[Global] 未捕获的异常: ${error instanceof Error ? error.message : String(error)}`);
            SentryInitializer.captureException(error, {
                type: 'uncaughtException',
                timestamp: new Date().toISOString(),
            });
        }
        finally {
            isHandlingError = false;
        }
    });
    process.on('unhandledRejection', (reason, promise) => {
        if (isHandlingError) {
            return;
        }
        isHandlingError = true;
        try {
            console_1.newConsole.error(`[Global] 未处理的 Promise 拒绝: ${reason instanceof Error ? reason.message : String(reason)}`);
            SentryInitializer.captureException(reason instanceof Error ? reason : new Error(String(reason)), {
                type: 'unhandledRejection',
                promise: promise.toString(),
                timestamp: new Date().toISOString(),
            });
        }
        finally {
            isHandlingError = false;
        }
    });
}

function initSentry() {
    try {
        SentryInitializer.init();
    }
    catch (error) {
    }
}

function captureException(error, context) {
    SentryInitializer.captureException(error, context);
}
