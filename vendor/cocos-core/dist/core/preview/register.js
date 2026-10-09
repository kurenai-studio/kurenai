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
exports.registerBrowserPreview = registerBrowserPreview;
exports.disposeBrowserPreview = disposeBrowserPreview;
const middleware_1 = require("../../server/middleware");
/**
 * 浏览器游戏预览的统一注册入口。
 *
 * 各 IDE / 集成方都通过 cli 的 `startup`（→ `startupScene` → scene `init`）或独立的游戏预览
 * 入口走到这里，集中一处保证浏览器预览行为一致，避免各调用方各自拼装注册流程。
 *
 * 注册顺序敏感：GamePreview 的 `/` 及资源路由（settings / assets / bundle / scene json）必须
 * 在场景中间件的宽泛路由（`/:dir/:uuid.:ext` 等）之前注册，否则 `/preview/settings.js`、
 * `/assets/<bundle>/config.json` 等会被场景路由吞成 404。因此在 scene `init()` 里需要先调用
 * 本函数，再注册 SceneScripting / Scene；纯浏览器游戏预览（无场景编辑器）则直接调用本函数。
 * 这些 handler 在非游戏预览资源时会 `next()` 放行，不影响场景编辑器自身请求。
 *
 * 前置条件：调用前需已完成 `startServer`（本函数只注册路由/监听，不生成 settings）。
 * **不要求** builder 已初始化：`/` 只渲染 game.ejs（仅需 scripting.projectPath），settings 等在请求时
 * 惰性计算，未就绪返回可重试 503。正因如此，本函数应尽早（startServer 之后、耗时的 builder/scene
 * 初始化之前）调用，使初始化期打开的预览页拿到带 socket 自愈能力的 game.ejs，而非裸 404 页。
 */
let extensionHost;
let registered = false;
async function registerBrowserPreview(projectPath) {
    if (registered) {
        return;
    }
    registered = true;
    // 先加载并注册项目扩展的预览后端（contributions.server + messages，跑扩展原码），
    // 必须在 GamePreview 之前注册，使扩展具体路由优先于 scriptingRoutes 的宽泛正则。
    // 失败隔离：扩展宿主任何异常都不应阻断预览启动。
    try {
        const { loadExtensionPreviewHost } = await Promise.resolve().then(() => __importStar(require('./extension-host')));
        extensionHost = await loadExtensionPreviewHost(projectPath);
    }
    catch (err) {
        console.warn('[ExtensionHost] init failed:', err);
    }
    // 注册游戏预览路由
    const { default: GamePreviewMiddleware } = await Promise.resolve().then(() => __importStar(require('./game-preview.middleware')));
    middleware_1.middlewareService.register('GamePreview', GamePreviewMiddleware);
    // 注册热重载（浏览器预览监听 browser:reload，脚本/资源变化后自动刷新）
    const { registerLiveReload } = await Promise.resolve().then(() => __importStar(require('./live-reload')));
    await registerLiveReload();
}
/**
 * 释放浏览器预览相关资源（扩展预览后端 + 热重载监听）。预览关闭时调用。
 *
 * 注意：`middlewareService` 目前只支持追加路由、不支持注销，因此已注册的 GamePreview 路由
 * 无法在此移除；同进程内重启预览会重复注册路由（已知限制，见 review 遗留项）。这里负责清理
 * 有状态的部分（扩展宿主 + 热重载监听 / 定时器），并复位注册标志。
 */
async function disposeBrowserPreview() {
    try {
        const { unregisterLiveReload } = await Promise.resolve().then(() => __importStar(require('./live-reload')));
        unregisterLiveReload();
    }
    catch (err) {
        console.warn('[LiveReload] unregister failed:', err);
    }
    try {
        extensionHost?.dispose();
    }
    catch (err) {
        console.warn('[ExtensionHost] dispose failed:', err);
    }
    extensionHost = undefined;
    registered = false;
}
