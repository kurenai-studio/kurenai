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
