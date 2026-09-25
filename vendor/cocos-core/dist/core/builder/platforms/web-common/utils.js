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
exports.getBuidPath = getBuidPath;
exports.getPreviewUrl = getPreviewUrl;
exports.openUrlAsync = openUrlAsync;
exports.run = run;
exports.injectBridgeScripts = injectBridgeScripts;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const utils_1 = __importDefault(require("../../../base/utils"));
const builder_config_1 = __importDefault(require("../../share/builder-config"));
const build_middleware_1 = require("../../build.middleware");
const child_process_1 = require("child_process");
const BRIDGE_TOKEN_GLOBAL_NAME = '__SUDOP_GAME_BRIDGE_BUILD_TOKEN__';
async function getBuidPath(platform, name) {
    return (0, build_middleware_1.getBuildPath)(platform, name);
}
async function getPreviewUrl(dest, platform) {
    const rawPath = utils_1.default.Path.resolveToRaw(dest);
    if (!(0, fs_1.existsSync)(rawPath)) {
        throw new Error(`Build path not found: ${dest}`);
    }
    const serverService = (await Promise.resolve().then(() => __importStar(require('../../../../server/server')))).serverService;
    const buildKey = (0, build_middleware_1.getBuildUrlPath)(rawPath);
    console.log(`getPreviewUrl: rawPath=${rawPath}, buildKey=${buildKey}, platform=${platform}`);
    if (buildKey) {
        return `${serverService.url}/build/${buildKey}/index.html`;
    }
    if (rawPath.startsWith(builder_config_1.default.projectRoot) && platform) {
        const registerName = (0, path_1.basename)(rawPath);
        (0, build_middleware_1.registerBuildPath)(platform, registerName, rawPath);
        return `${serverService.url}/build/${platform}/${registerName}/index.html`;
    }
    const buildRoot = (0, path_1.join)(builder_config_1.default.projectRoot, 'build');
    const relativePath = (0, path_1.relative)(buildRoot, rawPath);
    return serverService.url + '/build/' + relativePath + '/index.html';
}
/**
 * 使用系统默认命令打开浏览器
 * @param url 要打开的 URL
 * @param completedCallback 浏览器打开完成后的回调函数
 */
function openBrowser(url, completedCallback) {
    const currentPlatform = process.platform;
    let command;
    let args = [];
    switch (currentPlatform) {
        case 'win32':
            command = 'rundll32.exe';
            args = ['url.dll,FileProtocolHandler', url];
            break;
        case 'darwin':
            command = 'open';
            args = [url];
            break;
        case 'linux':
            command = 'xdg-open';
            args = [url];
            break;
        default:
            console.log(`请手动打开浏览器访问: ${url}`);
            if (completedCallback) {
                completedCallback();
            }
            return;
    }
    if (command) {
        (0, child_process_1.execFile)(command, args, { windowsHide: true }, (error) => {
            if (error) {
                console.error('打开浏览器失败:', error.message);
                console.log(`请手动打开浏览器访问: ${url}`);
            }
            else {
                console.log(`正在浏览器中打开: ${url}`);
            }
            // 无论成功或失败都调用回调
            if (completedCallback) {
                completedCallback();
            }
        });
    }
    else if (completedCallback) {
        completedCallback();
    }
}
/**
 * 异步打开 URL，在浏览器打开完成时 resolve
 * @param url 要打开的 URL
 * @returns Promise，在浏览器打开完成时 resolve
 */
function openUrlAsync(url) {
    console.log(`正在打开 URL: ${url}`);
    return new Promise((resolve) => {
        openBrowser(url, resolve);
    });
}
async function run(platform, dest) {
    // if (GlobalConfig.mode === 'simple') {
    //     throw new Error('simple mode not support run in platform ' + platform);
    // }
    const url = await getPreviewUrl(dest, platform);
    // 打开浏览器
    try {
        await openUrlAsync(url);
    }
    catch (error) {
        console.error('打开浏览器时发生错误:', error);
        console.log(`请手动打开浏览器访问: ${url}`);
    }
    return url;
}
function injectBridgeScripts(html, options) {
    const normalizedBridgeLink = String(options.bridgeLink || '').trim();
    if (!normalizedBridgeLink) {
        throw new Error('Missing web bridge script link');
    }
    const token = (0, crypto_1.randomBytes)(32).toString('hex');
    options.bridgeBuildToken = token;
    const bridgeScripts = [
        `<script>globalThis.${BRIDGE_TOKEN_GLOBAL_NAME}=${JSON.stringify(token)};</script>`,
        `<script src="${escapeHtmlAttribute(normalizedBridgeLink)}" charset="utf-8"></script>`,
    ].join('\n');
    return insertBeforeFirstScriptTag(html, bridgeScripts);
}
function insertBeforeFirstScriptTag(html, bridgeScripts) {
    const firstScriptTag = /<script\b/i.exec(html);
    if (!firstScriptTag) {
        throw new Error('Cannot find script tag in index.html');
    }
    return `${html.slice(0, firstScriptTag.index)}${bridgeScripts}\n${html.slice(firstScriptTag.index)}`;
}
function escapeHtmlAttribute(value) {
    return value.replace(/[&"<>]/g, (char) => {
        switch (char) {
            case '&':
                return '&amp;';
            case '"':
                return '&quot;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            default:
                return char;
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9idWlsZGVyL3BsYXRmb3Jtcy93ZWItY29tbW9uL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsa0NBRUM7QUFFRCxzQ0FxQkM7QUF5REQsb0NBS0M7QUFDRCxrQkFhQztBQUVELGtEQWVDO0FBcklELG1DQUFxQztBQUNyQywyQkFBZ0M7QUFDaEMsK0JBQWdEO0FBQ2hELGdFQUF3QztBQUN4QyxnRkFBdUQ7QUFDdkQsNkRBQTBGO0FBQzFGLGlEQUF5QztBQUV6QyxNQUFNLHdCQUF3QixHQUFHLG1DQUFtQyxDQUFDO0FBTzlELEtBQUssVUFBVSxXQUFXLENBQUMsUUFBZ0IsRUFBRSxJQUFZO0lBQzVELE9BQU8sSUFBQSwrQkFBWSxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRU0sS0FBSyxVQUFVLGFBQWEsQ0FBQyxJQUFZLEVBQUUsUUFBaUI7SUFDL0QsTUFBTSxPQUFPLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUMsSUFBSSxDQUFDLElBQUEsZUFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBQ0QsTUFBTSxhQUFhLEdBQUcsQ0FBQyx3REFBYSwyQkFBMkIsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0lBQ2hGLE1BQU0sUUFBUSxHQUFHLElBQUEsa0NBQWUsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixPQUFPLGNBQWMsUUFBUSxjQUFjLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDN0YsSUFBSSxRQUFRLEVB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MEIsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUVELFNBQVMsMEJBQTBCLENBQUMsSUFBWSxFQUFFLGFBQXFCO0lBQ25FLE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxLQUFLLENBQUMsR0FBRyxhQUFhLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztBQUN6RyxDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxLQUFhO0lBQ3RDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNyQyxRQUFRLElBQUksRUFBRSxDQUFDO1lBQ2YsS0FBSyxHQUFHO2dCQUNKLE9BQU8sT0FBTyxDQUFDO1lBQ25CLEtBQUssR0FBRztnQkFDSixPQUFPLFFBQVEsQ0FBQztZQUNwQixLQUFLLEdBQUc7Z0JBQ0osT0FBTyxNQUFNLENBQUM7WUFDbEIsS0FBSyxHQUFHO2dCQUNKLE9BQU8sTUFBTSxDQUFDO1lBQ2xCO2dCQUNJLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByYW5kb21CeXRlcyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiwgcmVsYXRpdmUsIGJhc2VuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vLi4vLi4vYmFzZS91dGlscyc7XG5pbXBvcnQgYnVpbGRlckNvbmZpZyBmcm9tICcuLi8uLi9zaGFyZS9idWlsZGVyLWNvbmZpZyc7XG5pbXBvcnQgeyBnZXRCdWlsZFBhdGgsIGdldEJ1aWxkVXJsUGF0aCwgcmVnaXN0ZXJCdWlsZFBhdGggfSBmcm9tICcuLi8uLi9idWlsZC5taWRkbGV3YXJlJztcbmltcG9ydCB7IGV4ZWNGaWxlIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbmNvbnN0IEJSSURHRV9UT0tFTl9HTE9CQUxfTkFNRSA9ICdfX1NVRE9QX0dBTUVfQlJJREdFX0JVSUxEX1RPS0VOX18nO1xuXG5leHBvcnQgaW50ZXJmYWNlIElXZWJCcmlkZ2VTY3JpcHRPcHRpb25zIHtcbiAgICBicmlkZ2VMaW5rPzogdW5rbm93bjtcbiAgICBicmlkZ2VCdWlsZFRva2VuPzogc3RyaW5nO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QnVpZFBhdGgocGxhdGZvcm06IHN0cmluZywgbmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGdldEJ1aWxkUGF0aChwbGF0Zm9ybSwgbmFtZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQcmV2aWV3VXJsKGRlc3Q6IHN0cmluZywgcGxhdGZvcm0/OiBzdHJpbmcpIHtcbiAgICBjb25zdCByYXdQYXRoID0gdXRpbHMuUGF0aC5yZXNvbHZlVG9SYXcoZGVzdCk7XG4gICAgaWYgKCFleGlzdHNTeW5jKHJhd1BhdGgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQnVpbGQgcGF0aCBub3QgZm91bmQ6ICR7ZGVzdH1gKTtcbiAgICB9XG4gICAgY29uc3Qgc2VydmVyU2VydmljZSA9IChhd2FpdCBpbXBvcnQoJy4uLy4uLy4uLy4uL3NlcnZlci9zZXJ2ZXInKSkuc2VydmVyU2VydmljZTtcbiAgICBjb25zdCBidWlsZEtleSA9IGdldEJ1aWxkVXJsUGF0aChyYXdQYXRoKTtcbiAgICBjb25zb2xlLmxvZyhgZ2V0UHJldmlld1VybDogcmF3UGF0aD0ke3Jhd1BhdGh9LCBidWlsZEtleT0ke2J1aWxkS2V5fSwgcGxhdGZvcm09JHtwbGF0Zm9ybX1gKTtcbiAgICBpZiAoYnVpbGRLZXkpIHtcbiAgICAgICAgcmV0dXJuIGAke3NlcnZlclNlcnZpY2UudXJsfS9idWlsZC8ke2J1aWxkS2V5fS9pbmRleC5odG1sYDtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJhd1BhdGguc3RhcnRzV2l0aChidWlsZGVyQ29uZmlnLnByb2plY3RSb290KSAmJiBwbGF0Zm9ybSkge1xuICAgICAgICBjb25zdCByZWdpc3Rlck5hbWUgPSBiYXNlbmFtZShyYXdQYXRoKTtcbiAgICAgICAgcmVnaXN0ZXJCdWlsZFBhdGgocGxhdGZvcm0sIHJlZ2lzdGVyTmFtZSwgcmF3UGF0aCk7XG4gICAgICAgIHJldHVybiBgJHtzZXJ2ZXJTZXJ2aWNlLnVybH0vYnVpbGQvJHtwbGF0Zm9ybX0vJHtyZWdpc3Rlck5hbWV9L2luZGV4Lmh0bWxgO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBidWlsZFJvb3QgPSBqb2luKGJ1aWxkZXJDb25maWcucHJvamVjdFJvb3QsICdidWlsZCcpO1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGJ1aWxkUm9vdCwgcmF3UGF0aCk7XG4gICAgcmV0dXJuIHNlcnZlclNlcnZpY2UudXJsICsgJy9idWlsZC8nICsgcmVsYXRpdmVQYXRoICsgJy9pbmRleC5odG1sJztcbn1cblxuLyoqXG4gKiDkvb/nlKjns7vnu5/pu5jorqTlkb3ku6TmiZPlvIDmtY/op4jlmahcbiAqIEBwYXJhbSB1cmwg6KaB5omT5byA55qEIFVSTFxuICogQHBhcmFtIGNvbXBsZXRlZENhbGxiYWNrIOa1j+iniOWZqOaJk+W8gOWujOaIkOWQjueahOWbnuiwg+WHveaVsFxuICovXG5mdW5jdGlvbiBvcGVuQnJvd3Nlcih1cmw6IHN0cmluZywgY29tcGxldGVkQ2FsbGJhY2s/OiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgY29uc3QgY3VycmVudFBsYXRmb3JtID0gcHJvY2Vzcy5wbGF0Zm9ybTtcblxuICAgIGxldCBjb21tYW5kOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGFyZ3M6IHN0cmluZ1tdID0gW107XG4gICAgc3dpdGNoIChjdXJyZW50UGxhdGZvcm0pIHtcbiAgICAgICAgY2FzZSAnd2luMzInOlxuICAgICAgICAgICAgY29tbWFuZCA9ICdydW5kbGwzMi5leGUnO1xuICAgICAgICAgICAgYXJncyA9IFsndXJsLmRsbCxGaWxlUHJvdG9jb2xIYW5kbGVyJywgdXJsXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkYXJ3aW4nOlxuICAgICAgICAgICAgY29tbWFuZCA9ICdvcGVuJztcbiAgICAgICAgICAgIGFyZ3MgPSBbdXJsXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsaW51eCc6XG4gICAgICAgICAgICBjb21tYW5kID0gJ3hkZy1vcGVuJztcbiAgICAgICAgICAgIGFyZ3MgPSBbdXJsXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5sb2coYOivt+aJi+WKqOaJk+W8gOa1j+iniOWZqOiuv+mXrjogJHt1cmx9YCk7XG4gICAgICAgICAgICBpZiAoY29tcGxldGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChjb21tYW5kKSB7XG4gICAgICAgIGV4ZWNGaWxlKGNvbW1hbmQsIGFyZ3MsIHsgd2luZG93c0hpZGU6IHRydWUgfSwgKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+aJk+W8gOa1j+iniOWZqOWksei0pTonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg6K+35omL5Yqo5omT5byA5rWP6KeI5Zmo6K6/6ZeuOiAke3VybH1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOato+WcqOa1j+iniOWZqOS4reaJk+W8gDogJHt1cmx9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOaXoOiuuuaIkOWKn+aIluWksei0pemDveiwg+eUqOWbnuiwg1xuICAgICAgICAgICAgaWYgKGNvbXBsZXRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY29tcGxldGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChjb21wbGV0ZWRDYWxsYmFjaykge1xuICAgICAgICBjb21wbGV0ZWRDYWxsYmFjaygpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDlvILmraXmiZPlvIAgVVJM77yM5Zyo5rWP6KeI5Zmo5omT5byA5a6M5oiQ5pe2IHJlc29sdmVcbiAqIEBwYXJhbSB1cmwg6KaB5omT5byA55qEIFVSTFxuICogQHJldHVybnMgUHJvbWlzZe+8jOWcqOa1j+iniOWZqOaJk+W8gOWujOaIkOaXtiByZXNvbHZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvcGVuVXJsQXN5bmModXJsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZyhg5q2j5Zyo5omT5byAIFVSTDogJHt1cmx9YCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgIG9wZW5Ccm93c2VyKHVybCwgcmVzb2x2ZSk7XG4gICAgfSk7XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuKHBsYXRmb3JtOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xuICAgIC8vIGlmIChHbG9iYWxDb25maWcubW9kZSA9PT0gJ3NpbXBsZScpIHtcbiAgICAvLyAgICAgdGhyb3cgbmV3IEVycm9yKCdzaW1wbGUgbW9kZSBub3Qgc3VwcG9ydCBydW4gaW4gcGxhdGZvcm0gJyArIHBsYXRmb3JtKTtcbiAgICAvLyB9XG4gICAgY29uc3QgdXJsID0gYXdhaXQgZ2V0UHJldmlld1VybChkZXN0LCBwbGF0Zm9ybSk7XG4gICAgLy8g5omT5byA5rWP6KeI5ZmoXG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgb3BlblVybEFzeW5jKHVybCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign5omT5byA5rWP6KeI5Zmo5pe25Y+R55Sf6ZSZ6K+vOicsIGVycm9yKTtcbiAgICAgICAgY29uc29sZS5sb2coYOivt+aJi+WKqOaJk+W8gOa1j+iniOWZqOiuv+mXrjogJHt1cmx9YCk7XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RCcmlkZ2VTY3JpcHRzKGh0bWw6IHN0cmluZywgb3B0aW9uczogSVdlYkJyaWRnZVNjcmlwdE9wdGlvbnMpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRCcmlkZ2VMaW5rID0gU3RyaW5nKG9wdGlvbnMuYnJpZGdlTGluayB8fCAnJykudHJpbSgpO1xuICAgIGlmICghbm9ybWFsaXplZEJyaWRnZUxpbmspIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHdlYiBicmlkZ2Ugc2NyaXB0IGxpbmsnKTtcbiAgICB9XG5cbiAgICBjb25zdCB0b2tlbiA9IHJhbmRvbUJ5dGVzKDMyKS50b1N0cmluZygnaGV4Jyk7XG4gICAgb3B0aW9ucy5icmlkZ2VCdWlsZFRva2VuID0gdG9rZW47XG5cbiAgICBjb25zdCBicmlkZ2VTY3JpcHRzID0gW1xuICAgICAgICBgPHNjcmlwdD5nbG9iYWxUaGlzLiR7QlJJREdFX1RPS0VOX0dMT0JBTF9OQU1FfT0ke0pTT04uc3RyaW5naWZ5KHRva2VuKX07PC9zY3JpcHQ+YCxcbiAgICAgICAgYDxzY3JpcHQgc3JjPVwiJHtlc2NhcGVIdG1sQXR0cmlidXRlKG5vcm1hbGl6ZWRCcmlkZ2VMaW5rKX1cIiBjaGFyc2V0PVwidXRmLThcIj48L3NjcmlwdD5gLFxuICAgIF0uam9pbignXFxuJyk7XG5cbiAgICByZXR1cm4gaW5zZXJ0QmVmb3JlRmlyc3RTY3JpcHRUYWcoaHRtbCwgYnJpZGdlU2NyaXB0cyk7XG59XG5cbmZ1bmN0aW9uIGluc2VydEJlZm9yZUZpcnN0U2NyaXB0VGFnKGh0bWw6IHN0cmluZywgYnJpZGdlU2NyaXB0czogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBmaXJzdFNjcmlwdFRhZyA9IC88c2NyaXB0XFxiL2kuZXhlYyhodG1sKTtcbiAgICBpZiAoIWZpcnN0U2NyaXB0VGFnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGZpbmQgc2NyaXB0IHRhZyBpbiBpbmRleC5odG1sJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAke2h0bWwuc2xpY2UoMCwgZmlyc3RTY3JpcHRUYWcuaW5kZXgpfSR7YnJpZGdlU2NyaXB0c31cXG4ke2h0bWwuc2xpY2UoZmlyc3RTY3JpcHRUYWcuaW5kZXgpfWA7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUh0bWxBdHRyaWJ1dGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1smXCI8Pl0vZywgKGNoYXIpID0+IHtcbiAgICAgICAgc3dpdGNoIChjaGFyKSB7XG4gICAgICAgIGNhc2UgJyYnOlxuICAgICAgICAgICAgcmV0dXJuICcmYW1wOyc7XG4gICAgICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgICAgIHJldHVybiAnJnF1b3Q7JztcbiAgICAgICAgY2FzZSAnPCc6XG4gICAgICAgICAgICByZXR1cm4gJyZsdDsnO1xuICAgICAgICBjYXNlICc+JzpcbiAgICAgICAgICAgIHJldHVybiAnJmd0Oyc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gY2hhcjtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuIl19