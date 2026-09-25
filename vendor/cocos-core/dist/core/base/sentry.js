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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSentry = initSentry;
exports.captureException = captureException;
const Sentry = __importStar(require("@sentry/node"));
const console_1 = require("./console");
/**
 * Sentry 初始化器
 */
class SentryInitializer {
    static initialized = false;
    /**
     * 初始化 Sentry
     * @param config Sentry 配置
     */
    static init() {
        if (this.initialized) {
            return;
        }
        const sentryConfig = {
            dsn: 'https://4d4b6f03b83b47a4aad50674eedd087e@sentry.cocos.org/12',
            // dsn: 'https://d1228c9c9d49468a9f6795d0f8f66df3@sentry.cocos.org/11',
            environment: 'development',
            release: require('../../../package.json').version,
            debug: false,
            tracesSampleRate: 0.2,
            sampleRate: 0.5,
            user: {
                id: 'cli-alpha-test',
            },
        };
        // 如果没有 DSN，跳过初始化
        if (!sentryConfig.dsn) {
            return;
        }
        try {
            Sentry.init({
                ...sentryConfig,
                beforeSend(event) {
                    // 过滤敏感信息
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
            // // 设置用户信息
            // if (config.user) {
            //     Sentry.setUser(config.user);
            // }
            // // 设置标签
            // if (config.tags) {
            //     Sentry.setTags(config.tags);
            // }
            // // 设置额外上下文
            // if (config.extra) {
            //     Sentry.setContext('extra', config.extra);
            // }
            // 设置全局上下文
            Sentry.setContext('app', {
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
        }
    }
    /**
     * 捕获异常
     * @param error 错误对象
     * @param context 额外上下文
     */
    static captureException(error, context) {
        if (!this.initialized) {
            return;
        }
        try {
            if (context) {
                Sentry.withScope(scope => {
                    Object.entries(context).forEach(([key, value]) => {
                        scope.setContext(key, value);
                    });
                    Sentry.captureException(error);
                });
            }
            else {
                Sentry.captureException(error);
            }
        }
        catch (e) {
        }
    }
    /**
     * 获取是否已初始化
     */
    static get isInitialized() {
        return this.initialized;
    }
}
/**
 * 全局错误处理器
 */
function setupGlobalErrorHandlers() {
    let isHandlingError = false;
    // 捕获未处理的异常
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
    // 捕获未处理的 Promise 拒绝
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
/**
 * 便捷的初始化函数
 */
function initSentry() {
    try {
        SentryInitializer.init();
    }
    catch (error) {
    }
}
/**
 * 便捷的异常捕获函数
 * @param error 错误对象
 * @param context 额外上下文
 */
function captureException(error, context) {
    SentryInitializer.captureException(error, context);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VudHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvYmFzZS9zZW50cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnTUEsZ0NBS0M7QUFPRCw0Q0FFQztBQTlNRCxxREFBdUM7QUFDdkMsdUNBQXVDO0FBNEJ2Qzs7R0FFRztBQUNILE1BQU0saUJBQWlCO0lBQ1gsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFFbkM7OztPQUdHO0lBQ0ksTUFBTSxDQUFDLElBQUk7UUFDZCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixPQUFPO1FBQ1gsQ0FBQztRQUVELE1BQU0sWUFBWSxHQUFHO1lBQ2pCLEdBQUcsRUFBRSw4REFBOEQ7WUFDbkUsdUVBQXVFO1lBQ3ZFLFdBQVcsRUFBRSxhQUFhO1lBQzFCLE9BQU8sRUFBRSxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxPQUFPO1lBQ2pELEtBQUssRUFBRSxLQUFLO1lBQ1osZ0JBQWdCLEVBQUUsR0FBRztZQUNyQixVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRTtnQkFDRixFQUFFLEVBQUUsZ0JBQWdCO2FBQ3ZCO1NBQ0osQ0FBQztRQUVGLGlCQUFpQjtRQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3BCLE9BQU87UUFDWCxDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDUixHQUFHLFlBQVk7Z0JBQ2YsVUFBVSxDQUFDLEtBQUs7b0JBQ1osU0FBUztvQkFDVCxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7d0JBQ3pCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7b0JBQ2pDLENBQUM7b0JBQ0QsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFB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Q0gsU0FBZ0IsZ0JBQWdCLENBQUMsS0FBWSxFQUFFLE9BQTZCO0lBQ3hFLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN2RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgU2VudHJ5IGZyb20gJ0BzZW50cnkvbm9kZSc7XG5pbXBvcnQgeyBuZXdDb25zb2xlIH0gZnJvbSAnLi9jb25zb2xlJztcblxuLyoqXG4gKiBTZW50cnkg6YWN572u6YCJ6aG5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VudHJ5Q29uZmlnIHtcbiAgICAvKiogU2VudHJ5IERTTiAqL1xuICAgIGRzbj86IHN0cmluZztcbiAgICAvKiog546v5aKD5ZCN56ewICovXG4gICAgZW52aXJvbm1lbnQ/OiBzdHJpbmc7XG4gICAgLyoqIOWPkeW4g+eJiOacrCAqL1xuICAgIHJlbGVhc2U/OiBzdHJpbmc7XG4gICAgLyoqIOaYr+WQpuWQr+eUqOiwg+ivleaooeW8jyAqL1xuICAgIGRlYnVnPzogYm9vbGVhbjtcbiAgICAvKiog6YeH5qC3546HICgwLjAgLSAxLjApICovXG4gICAgdHJhY2VzU2FtcGxlUmF0ZT86IG51bWJlcjtcbiAgICAvKiog55So5oi35L+h5oGvICovXG4gICAgdXNlcj86IHtcbiAgICAgICAgaWQ/OiBzdHJpbmc7XG4gICAgICAgIHVzZXJuYW1lPzogc3RyaW5nO1xuICAgICAgICBlbWFpbD86IHN0cmluZztcbiAgICB9O1xuICAgIC8qKiDmoIfnrb4gKi9cbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICAvKiog6aKd5aSW5LiK5LiL5paHICovXG4gICAgZXh0cmE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG4vKipcbiAqIFNlbnRyeSDliJ3lp4vljJblmahcbiAqL1xuY2xhc3MgU2VudHJ5SW5pdGlhbGl6ZXIge1xuICAgIHByaXZhdGUgc3RhdGljIGluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiDliJ3lp4vljJYgU2VudHJ5XG4gICAgICogQHBhcmFtIGNvbmZpZyBTZW50cnkg6YWN572uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBpbml0KCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VudHJ5Q29uZmlnID0ge1xuICAgICAgICAgICAgZHNuOiAnaHR0cHM6Ly80ZDRiNmYwM2I4M2I0N2E0YWFkNTA2NzRlZWRkMDg3ZUBzZW50cnkuY29jb3Mub3JnLzEyJyxcbiAgICAgICAgICAgIC8vIGRzbjogJ2h0dHBzOi8vZDEyMjhjOWM5ZDQ5NDY4YTlmNjc5NWQwZjhmNjZkZjNAc2VudHJ5LmNvY29zLm9yZy8xMScsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDogJ2RldmVsb3BtZW50JyxcbiAgICAgICAgICAgIHJlbGVhc2U6IHJlcXVpcmUoJy4uLy4uLy4uL3BhY2thZ2UuanNvbicpLnZlcnNpb24sXG4gICAgICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgICAgICB0cmFjZXNTYW1wbGVSYXRlOiAwLjIsXG4gICAgICAgICAgICBzYW1wbGVSYXRlOiAwLjUsXG4gICAgICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgICAgICAgaWQ6ICdjbGktYWxwaGEtdGVzdCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOWmguaenOayoeaciSBEU07vvIzot7Pov4fliJ3lp4vljJZcbiAgICAgICAgaWYgKCFzZW50cnlDb25maWcuZHNuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgU2VudHJ5LmluaXQoe1xuICAgICAgICAgICAgICAgIC4uLnNlbnRyeUNvbmZpZyxcbiAgICAgICAgICAgICAgICBiZWZvcmVTZW5kKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOi/h+a7pOaVj+aEn+S/oeaBr1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVxdWVzdD8uY29va2llcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV2ZW50LnJlcXVlc3QuY29va2llcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVxdWVzdD8uaGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Vuc2l0aXZlSGVhZGVycyA9IFsnYXV0aG9yaXphdGlvbicsICdjb29raWUnLCAneC1hcGkta2V5J107XG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5zaXRpdmVIZWFkZXJzLmZvckVhY2goaGVhZGVyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXZlbnQucmVxdWVzdCEuaGVhZGVycyFbaGVhZGVyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIC8vIOiuvue9rueUqOaIt+S/oeaBr1xuICAgICAgICAgICAgLy8gaWYgKGNvbmZpZy51c2VyKSB7XG4gICAgICAgICAgICAvLyAgICAgU2VudHJ5LnNldFVzZXIoY29uZmlnLnVzZXIpO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvLyAvLyDorr7nva7moIfnrb5cbiAgICAgICAgICAgIC8vIGlmIChjb25maWcudGFncykge1xuICAgICAgICAgICAgLy8gICAgIFNlbnRyeS5zZXRUYWdzKGNvbmZpZy50YWdzKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLy8gLy8g6K6+572u6aKd5aSW5LiK5LiL5paHXG4gICAgICAgICAgICAvLyBpZiAoY29uZmlnLmV4dHJhKSB7XG4gICAgICAgICAgICAvLyAgICAgU2VudHJ5LnNldENvbnRleHQoJ2V4dHJhJywgY29uZmlnLmV4dHJhKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLy8g6K6+572u5YWo5bGA5LiK5LiL5paHXG4gICAgICAgICAgICBTZW50cnkuc2V0Q29udGV4dCgnYXBwJywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjb2Nvcy1jbGknLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24gfHwgJzEuMC4wJyxcbiAgICAgICAgICAgICAgICBub2RlX3ZlcnNpb246IHByb2Nlc3MudmVyc2lvbixcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybTogcHJvY2Vzcy5wbGF0Zm9ybSxcbiAgICAgICAgICAgICAgICBhcmNoOiBwcm9jZXNzLmFyY2gsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc2V0dXBHbG9iYWxFcnJvckhhbmRsZXJzKCk7XG5cbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5o2V6I635byC5bi4XG4gICAgICogQHBhcmFtIGVycm9yIOmUmeivr+WvueixoVxuICAgICAqIEBwYXJhbSBjb250ZXh0IOmineWkluS4iuS4i+aWh1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgY2FwdHVyZUV4Y2VwdGlvbihlcnJvcjogRXJyb3IsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgU2VudHJ5LndpdGhTY29wZShzY29wZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKGNvbnRleHQpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuc2V0Q29udGV4dChrZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIFNlbnRyeS5jYXB0dXJlRXhjZXB0aW9uKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgU2VudHJ5LmNhcHR1cmVFeGNlcHRpb24oZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmmK/lkKblt7LliJ3lp4vljJZcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGdldCBpc0luaXRpYWxpemVkKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pbml0aWFsaXplZDtcbiAgICB9XG59XG5cbi8qKlxuICog5YWo5bGA6ZSZ6K+v5aSE55CG5ZmoXG4gKi9cbmZ1bmN0aW9uIHNldHVwR2xvYmFsRXJyb3JIYW5kbGVycygpOiB2b2lkIHtcbiAgICBsZXQgaXNIYW5kbGluZ0Vycm9yID0gZmFsc2U7XG5cbiAgICAvLyDmjZXojrfmnKrlpITnkIbnmoTlvILluLhcbiAgICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnJvcikgPT4ge1xuICAgICAgICBpZiAoaXNIYW5kbGluZ0Vycm9yKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaXNIYW5kbGluZ0Vycm9yID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld0NvbnNvbGUuZXJyb3IoYFtHbG9iYWxdIOacquaNleiOt+eahOW8guW4uDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICAgICAgICBTZW50cnlJbml0aWFsaXplci5jYXB0dXJlRXhjZXB0aW9uKGVycm9yLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3VuY2F1Z2h0RXhjZXB0aW9uJyxcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaXNIYW5kbGluZ0Vycm9yID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIOaNleiOt+acquWkhOeQhueahCBQcm9taXNlIOaLkue7nVxuICAgIHByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChyZWFzb24sIHByb21pc2UpID0+IHtcbiAgICAgICAgaWYgKGlzSGFuZGxpbmdFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlzSGFuZGxpbmdFcnJvciA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBuZXdDb25zb2xlLmVycm9yKGBbR2xvYmFsXSDmnKrlpITnkIbnmoQgUHJvbWlzZSDmi5Lnu506ICR7cmVhc29uIGluc3RhbmNlb2YgRXJyb3IgPyByZWFzb24ubWVzc2FnZSA6IFN0cmluZyhyZWFzb24pfWApO1xuICAgICAgICAgICAgU2VudHJ5SW5pdGlhbGl6ZXIuY2FwdHVyZUV4Y2VwdGlvbihcbiAgICAgICAgICAgICAgICByZWFzb24gaW5zdGFuY2VvZiBFcnJvciA/IHJlYXNvbiA6IG5ldyBFcnJvcihTdHJpbmcocmVhc29uKSksXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAndW5oYW5kbGVkUmVqZWN0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZTogcHJvbWlzZS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaXNIYW5kbGluZ0Vycm9yID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLyoqXG4gKiDkvr/mjbfnmoTliJ3lp4vljJblh73mlbBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRTZW50cnkoKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgICAgU2VudHJ5SW5pdGlhbGl6ZXIuaW5pdCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgfVxufVxuXG4vKipcbiAqIOS+v+aNt+eahOW8guW4uOaNleiOt+WHveaVsFxuICogQHBhcmFtIGVycm9yIOmUmeivr+WvueixoVxuICogQHBhcmFtIGNvbnRleHQg6aKd5aSW5LiK5LiL5paHXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYXB0dXJlRXhjZXB0aW9uKGVycm9yOiBFcnJvciwgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkIHtcbiAgICBTZW50cnlJbml0aWFsaXplci5jYXB0dXJlRXhjZXB0aW9uKGVycm9yLCBjb250ZXh0KTtcbn1cbiJdfQ==