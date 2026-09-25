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
exports.gamePreviewResourceRoutes = void 0;
exports.getLibraryDirs = getLibraryDirs;
const path_1 = require("path");
const fs_1 = require("fs");
const ejs_1 = __importDefault(require("ejs"));
const global_1 = require("../../global");
const scripting_routes_1 = require("./scripting-routes");
const preview_settings_1 = require("./preview-settings");
const live_reload_1 = require("./live-reload");
const preview_toolbar_options_1 = require("./preview-toolbar-options");
const i18n_1 = __importDefault(require("../base/i18n"));
/**
 * 各资源数据库的 library（已导入数据）目录缓存。
 * 与编辑器 `queryOtherLibraryPath` 对齐：library 是扁平的 `<uuid前两位>/<uuid>.<ext>` 结构，
 * 一个相对路径在所有 library 目录中唯一定位文件，因此 url 中的 bundle 段可忽略。
 */
let libraryDirsCache = null;
async function getLibraryDirs() {
    if (libraryDirsCache) {
        return libraryDirsCache;
    }
    const { assetDBManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
    const dirs = Object.values(assetDBManager.assetDBInfo)
        .map((info) => info.library)
        .filter((v) => !!v);
    libraryDirsCache = Array.from(new Set(dirs));
    return libraryDirsCache;
}
/**
 * 游戏运行时共享的资源路由（settings / 原始资源 / bundle config / bundle index / 启动场景 JSON）。
 * 浏览器游戏预览（/）使用；抽出为具名导出便于维护。
 */
exports.gamePreviewResourceRoutes = [
    {
        // 运行时 settings：window._CCSettings = {...}
        url: '/preview/settings.js',
        async handler(req, res, next) {
            try {
                const startScene = typeof req.query.scene === 'string' ? req.query.scene : '';
                const { settings } = await (0, preview_settings_1.getCachedPreviewSettings)(startScene);
                if (!settings) {
                    return next(new Error('Generate preview settings failed.'));
                }
                // 缩短启动屏时间，预览刷新更快
                if (settings.splashScreen) {
                    settings.splashScreen.totalTime = 50;
                }
                // settings 实时反映项目状态（启动场景 / jsList / 脚本映射），禁止缓存，
                // 否则浏览器会复用旧 settings，出现“幽灵”插件/场景等问题。
                res.set('Cache-Control', 'no-store');
                res.type('application/javascript').send(`window._CCSettings = ${JSON.stringify(settings)};`);
            }
            catch (err) {
                // 初始化未完成即请求预览：返回可重试的 503，让 IDE/浏览器稍后重试，
                // 而不是返回缺 builtinAssets 的坏 settings 或裸 500。
                if (err instanceof preview_settings_1.PreviewNotReadyError) {
                    console.info(`[preview-settings Warning] not ready, ask client to retry (scene=${req.query.scene ?? ''})`);
                    // 关键自愈触发点：确有预览页因未就绪而 boot 失败（settings.js 503）。据此标记待自愈，
                    // 待 settings 首次真正可用时由 live-reload 广播 browser:reload 把该页刷新救回，无需手动刷新。
                    // 以「确实发生过 503」为依据比依赖 socket 连接时序更可靠（规避异步就绪探测跨越初始化完成
                    // 边界、标记 healed 却漏广播的竞态）。
                    (0, live_reload_1.notePreviewNotReady)();
                    res.set('Retry-After', '1');
                    return res.status(503).type('text/plain').send('// Preview initializing, please retry.');
                }
                // 其它异常：显式打印真实堆栈，否则会被 express 错误中间件吞成裸 500，
                // 表现为 "PhysicsSystem initDefaultMaterial Failed" / Graphics recompileShaders of null。
                console.error(`[preview-settings] settings.js generation FAILED (scene=${req.query.scene ?? ''}):`, err);
                next(err);
            }
        },
    },
    {
        // bundle 的原始资源文件（import / native），从 asset-db library 目录读取
        url: /^\/(?:remote|assets)\/[^/]+\/(?:import|native)\/(.*)/,
        async handler(req, res, next) {
            try {
                const match = req.path.match(/^\/(?:remote|assets)\/[^/]+\/(?:import|native)\/(.*)/);
                if (!match) {
                    return next();
                }
                // 逐段 encode，兼容子资源 `@` 与含特殊字符的目录名（仅保留分隔符 / \ 与 @ 不编码）
                const tail = match[1].replace(/[^\\/@]+/g, encodeURIComponent);
                const dirs = await getLibraryDirs();
                // 防目录穿越：join 后必须仍位于 library 目录内，否则跳过（`..` 会逃逸出目录）
                let hit;
                for (const d of dirs) {
                    const full = (0, path_1.join)(d, tail);
                    const rel = (0, path_1.relative)(d, full);
                    if (rel.startsWith('..') || (0, path_1.isAbsolute)(rel)) {
                        continue;
                    }
                    if ((0, fs_1.existsSync)(full)) {
                        hit = full;
                        break;
                    }
                }
                if (!hit) {
                    return next();
                }
                res.sendFile(hit, { dotfiles: 'allow' });
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // bundle 配置 config.json / cc.config.json
        url: /^\/(?:remote|assets)\/([^/]+)\/(?:config|cc\.config)\.json$/,
        async handler(req, res, next) {
            try {
                const match = req.path.match(/^\/(?:remote|assets)\/([^/]+)\/(?:config|cc\.config)\.json$/);
                if (!match) {
                    return next();
                }
                const { bundleConfigs } = await (0, preview_settings_1.getCachedPreviewSettings)();
                const config = bundleConfigs.find((c) => c.name === match[1]);
                if (!config) {
                    return next();
                }
                res.status(200).json(config);
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // bundle 入口 index.js —— 预览下脚本由 QuickPack import-map 提供，这里只需一个空模块占位
        url: /^\/(?:remote|assets)\/([^/]+)\/index\.js$/,
        async handler(req, res, next) {
            try {
                const match = req.path.match(/^\/(?:remote|assets)\/([^/]+)\/index\.js$/);
                if (!match) {
                    return next();
                }
                const name = match[1];
                const { bundleConfigs } = await (0, preview_settings_1.getCachedPreviewSettings)();
                if (!bundleConfigs.find((c) => c.name === name)) {
                    return next();
                }
                res.type('application/javascript').send(`System.register("virtual:///prerequisite-imports/${name}", [], function () {` +
                    ` "use strict"; return { setters: [], execute: function () {} }; });`);
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // 启动场景 JSON
        url: /^\/scene\/(.+)\.json$/,
        async handler(req, res, next) {
            try {
                const match = req.path.match(/^\/scene\/(.+)\.json$/);
                if (!match) {
                    return next();
                }
                let uuidOrUrl = match[1];
                try {
                    uuidOrUrl = decodeURIComponent(uuidOrUrl);
                }
                catch {
                    // ignore
                }
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const info = assetManager.queryAssetInfo(uuidOrUrl);
                const file = info?.library?.['.json'];
                if (!file || !(0, fs_1.existsSync)(file)) {
                    return next();
                }
                res.set('Cache-Control', 'no-store');
                res.sendFile(file, { dotfiles: 'allow' });
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        /**
         * 预览态类型化创建节点所需的「节点类型 → 内置 Prefab uuid」映射（只读）。
         *
         * 预览 iframe 里的 inspect agent（static/web/preview-inspect.js）在 Hierarchy 右键
         * Create ▸ Cube / Button … 时需要这张表。这里**直接输出编辑态的 NODE_CONFIGS**，
         * 而不是在前端 JS 里重抄一份，保证两侧的 uuid / canvasRequired / project-type 永不漂移。
         *
         * node-type-config 是无依赖的纯数据模块（不 import cc），可安全在 CLI 主进程加载。
         * 注意必须注册在 `/scene/(.+).json` 之前也无妨——两者路径模式不重叠（本路由无 .json 后缀）。
         */
        url: '/scene/asset-meta',
        async handler(req, res, next) {
            try {
                const dbURL = typeof req.query.dbURL === 'string' ? req.query.dbURL : '';
                if (!dbURL) {
                    return next();
                }
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const info = assetManager.queryAssetInfo(dbURL);
                res.set('Cache-Control', 'no-store');
                if (!info || info.isDirectory || !info.uuid) {
                    res.status(404).json({ error: `asset not found: ${dbURL}` });
                    return;
                }
                // subAssets 一并输出(一层):预览端创建 Sprite 节点时优先挂真子资产 SpriteFrame,
                // 让 Inspector 的 spriteFrame 属性带资产 uuid、可索引回 Assets。
                const subAssets = info.subAssets
                    ? Object.values(info.subAssets).map(sub => ({ uuid: sub.uuid, type: sub.type, name: sub.name }))
                    : [];
                res.status(200).json({ uuid: info.uuid, type: info.type, name: info.name, subAssets });
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        /**
         * 预览态「按资产拖拽创建节点」所需的「db:// URL → { uuid, type, name }」只读路由。
         *
         * Hierarchy 接受资产拖拽时（node.create-by-asset）只把 db:// URL 传进预览 iframe 的
         * inspect agent（static/web/preview-inspect.js），而活场景加载/实例化需要 uuid 与类型：
         * 这里在 CLI 主进程直接查 asset-db 返回最小字段，与 node-type-config 同属预览只读数据路由。
         */
        url: '/scene/node-type-config',
        async handler(_req, res, next) {
            try {
                const { NODE_CONFIGS } = await Promise.resolve().then(() => __importStar(require('../scene/scene-process/service/node/node-type-config')));
                // 表随 CLI 版本固定，但预览生命周期短，不缓存以免升级后拿到旧表。
                res.set('Cache-Control', 'no-store');
                res.status(200).json(NODE_CONFIGS);
            }
            catch (err) {
                next(err);
            }
        },
    },
];
exports.default = {
    get: [
        {
            // 游戏预览入口页面（浏览器游戏预览，PREVIEW 模式）
            url: '/',
            async handler(req, res, next) {
                try {
                    const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
                    const scene = typeof req.query.scene === 'string' ? req.query.scene : '';
                    const sceneQuery = scene ? `?scene=${encodeURIComponent(scene)}` : '';
                    // projectPath 可能在极早期（工程刚 open、scripting 尚未 initialize）为空——
                    // `/` 提前注册以避免初始化期兜底 404，此时用兜底标题渲染即可（页面本身只需能加载
                    // socket.io + browser:reload 监听，就绪后自愈刷新）。
                    const projectName = scripting.projectPath ? (0, path_1.basename)(scripting.projectPath) : 'Preview';
                    const renderData = {
                        title: `Cocos Creator - ${projectName}`,
                        serverURL: serverBaseUrl,
                        settingsJs: `/preview/settings.js${sceneQuery}`,
                        sceneQuery,
                        previewToolbarOptions: (0, preview_toolbar_options_1.getPreviewToolbarOptions)(),
                        // Keep the preview page aligned with Creator: localize device-mode names on the
                        // server, then inject the resolved values into the browser page. The toolbar
                        // itself does not need a second client-side i18n runtime.
                        previewToolbarI18n: {
                            device: {
                                designResolution: i18n_1.default.t('common.preview.device.design_resolution'),
                                fullScreen: i18n_1.default.t('common.preview.device.full_screen'),
                                webpageFullScreen: i18n_1.default.t('common.preview.device.webpage_full_screen'),
                            },
                        },
                    };
                    const templatePath = (0, path_1.join)(global_1.GlobalPaths.workspace, 'static', 'web', 'game.ejs');
                    const html = await ejs_1.default.renderFile(templatePath, renderData);
                    // 预览入口页不缓存，避免浏览器复用旧的 boot/settings 引用
                    res.set('Cache-Control', 'no-store');
                    res.status(200).send(html);
                }
                catch (err) {
                    next(err);
                }
            },
        },
        // 游戏运行时共享资源路由
        ...exports.gamePreviewResourceRoutes,
        // 共享的引擎 / 脚本 / SystemJS / import-map 等动态资源路由（含 /static/web）
        ...scripting_routes_1.scriptingRoutes,
    ],
    post: [],
    staticFiles: [],
    socket: {
        connection: (socket) => {
            // 对齐 Creator preview-app：工具栏通过同一个 socket 上报 changeOption，
            // 服务端保存会话状态，下一次页面渲染时重新注入。
            socket.on?.('changeOption', (name, value) => {
                (0, preview_toolbar_options_1.setPreviewToolbarOption)(name, value);
            });
        },
        disconnect: (_socket) => { },
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZS1wcmV2aWV3Lm1pZGRsZXdhcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9wcmV2aWV3L2dhbWUtcHJldmlldy5taWRkbGV3YXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSx3Q0FVQztBQTFCRCwrQkFBNEQ7QUFDNUQsMkJBQWdDO0FBQ2hDLDhDQUFzQjtBQUN0Qix5Q0FBMkM7QUFDM0MseURBQXFEO0FBQ3JELHlEQUFvRjtBQUNwRiwrQ0FBb0Q7QUFDcEQsdUVBQThGO0FBQzlGLHdEQUFnQztBQUVoQzs7OztHQUlHO0FBQ0gsSUFBSSxnQkFBZ0IsR0FBb0IsSUFBSSxDQUFDO0FBQ3RDLEtBQUssVUFBVSxjQUFjO0lBQ2hDLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixPQUFPLGdCQUFnQixDQUFDO0lBQzVCLENBQUM7SUFDRCxNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsd0RBQWEsV0FBVyxHQUFDLENBQUM7SUFDckQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDO1NBQ2pELEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUMzQixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixnQkFBZ0IsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDN0MsT0FBTyxnQkFBZ0IsQ0FBQztBQUM1QixDQUFDO0FBRUQ7OztHQUdHO0FBQ1UsUUFBQSx5QkFBeUIsR0FBRztJQUNyQztRQUNJLDBDQUEwQztRQUMxQyxHQUFHLEVBQUUsc0JBQXNCO1FBQzNCLEtBQUssQ0FBQyxPQUFPLENBQUMs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QU0sWUFBWSxHQUFHLElBQUEsV0FBSSxFQUFDLG9CQUFXLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQzlFLE1BQU0sSUFBSSxHQUFHLE1BQU0sYUFBRyxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQzVELHNDQUFzQztvQkFDdEMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3JDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQixDQUFDO2dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNkLENBQUM7WUFDTCxDQUFDO1NBQ0o7UUFDRCxjQUFjO1FBQ2QsR0FBRyxpQ0FBeUI7UUFDNUIsNERBQTREO1FBQzVELEdBQUcsa0NBQWU7S0FDckI7SUFDRCxJQUFJLEVBQUUsRUFBRTtJQUNSLFdBQVcsRUFBRSxFQUFFO0lBQ2YsTUFBTSxFQUFFO1FBQ0osVUFBVSxFQUFFLENBQUMsTUFBVyxFQUFFLEVBQUU7WUFDeEIsMERBQTBEO1lBQzFELDBCQUEwQjtZQUMxQixNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBYSxFQUFFLEtBQWMsRUFBRSxFQUFFO2dCQUMxRCxJQUFBLGlEQUF1QixFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6QyxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFDRCxVQUFVLEVBQUUsQ0FBQyxPQUFZLEVBQUUsRUFBRSxHQUFHLENBQUM7S0FDcEM7Q0FDdUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSU1pZGRsZXdhcmVDb250cmlidXRpb24gfSBmcm9tICcuLi8uLi9zZXJ2ZXIvaW50ZXJmYWNlcyc7XG5pbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSwgTmV4dEZ1bmN0aW9uIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgam9pbiwgcmVsYXRpdmUsIGlzQWJzb2x1dGUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgZWpzIGZyb20gJ2Vqcyc7XG5pbXBvcnQgeyBHbG9iYWxQYXRocyB9IGZyb20gJy4uLy4uL2dsb2JhbCc7XG5pbXBvcnQgeyBzY3JpcHRpbmdSb3V0ZXMgfSBmcm9tICcuL3NjcmlwdGluZy1yb3V0ZXMnO1xuaW1wb3J0IHsgZ2V0Q2FjaGVkUHJldmlld1NldHRpbmdzLCBQcmV2aWV3Tm90UmVhZHlFcnJvciB9IGZyb20gJy4vcHJldmlldy1zZXR0aW5ncyc7XG5pbXBvcnQgeyBub3RlUHJldmlld05vdFJlYWR5IH0gZnJvbSAnLi9saXZlLXJlbG9hZCc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3VG9vbGJhck9wdGlvbnMsIHNldFByZXZpZXdUb29sYmFyT3B0aW9uIH0gZnJvbSAnLi9wcmV2aWV3LXRvb2xiYXItb3B0aW9ucyc7XG5pbXBvcnQgaTE4biBmcm9tICcuLi9iYXNlL2kxOG4nO1xuXG4vKipcbiAqIOWQhOi1hOa6kOaVsOaNruW6k+eahCBsaWJyYXJ577yI5bey5a+85YWl5pWw5o2u77yJ55uu5b2V57yT5a2Y44CCXG4gKiDkuI7nvJbovpHlmaggYHF1ZXJ5T3RoZXJMaWJyYXJ5UGF0aGAg5a+56b2Q77yabGlicmFyeSDmmK/miYHlubPnmoQgYDx1dWlk5YmN5Lik5L2NPi88dXVpZD4uPGV4dD5gIOe7k+aehO+8jFxuICog5LiA5Liq55u45a+56Lev5b6E5Zyo5omA5pyJIGxpYnJhcnkg55uu5b2V5Lit5ZSv5LiA5a6a5L2N5paH5Lu277yM5Zug5q2kIHVybCDkuK3nmoQgYnVuZGxlIOauteWPr+W/veeVpeOAglxuICovXG5sZXQgbGlicmFyeURpcnNDYWNoZTogc3RyaW5nW10gfCBudWxsID0gbnVsbDtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRMaWJyYXJ5RGlycygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKGxpYnJhcnlEaXJzQ2FjaGUpIHtcbiAgICAgICAgcmV0dXJuIGxpYnJhcnlEaXJzQ2FjaGU7XG4gICAgfVxuICAgIGNvbnN0IHsgYXNzZXREQk1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXNzZXRzJyk7XG4gICAgY29uc3QgZGlycyA9IE9iamVjdC52YWx1ZXMoYXNzZXREQk1hbmFnZXIuYXNzZXREQkluZm8pXG4gICAgICAgIC5tYXAoKGluZm8pID0+IGluZm8ubGlicmFyeSlcbiAgICAgICAgLmZpbHRlcigodikgPT4gISF2KTtcbiAgICBsaWJyYXJ5RGlyc0NhY2hlID0gQXJyYXkuZnJvbShuZXcgU2V0KGRpcnMpKTtcbiAgICByZXR1cm4gbGlicmFyeURpcnNDYWNoZTtcbn1cblxuLyoqXG4gKiDmuLjmiI/ov5DooYzml7blhbHkuqvnmoTotYTmupDot6/nlLHvvIhzZXR0aW5ncyAvIOWOn+Wni+i1hOa6kCAvIGJ1bmRsZSBjb25maWcgLyBidW5kbGUgaW5kZXggLyDlkK/liqjlnLrmma8gSlNPTu+8ieOAglxuICog5rWP6KeI5Zmo5ri45oiP6aKE6KeI77yIL++8ieS9v+eUqO+8m+aKveWHuuS4uuWFt+WQjeWvvOWHuuS+v+S6jue7tOaKpOOAglxuICovXG5leHBvcnQgY29uc3QgZ2FtZVByZXZpZXdSZXNvdXJjZVJvdXRlcyA9IFtcbiAgICB7XG4gICAgICAgIC8vIOi/kOihjOaXtiBzZXR0aW5nc++8mndpbmRvdy5fQ0NTZXR0aW5ncyA9IHsuLi59XG4gICAgICAgIHVybDogJy9wcmV2aWV3L3NldHRpbmdzLmpzJyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydFNjZW5lID0gdHlwZW9mIHJlcS5xdWVyeS5zY2VuZSA9PT0gJ3N0cmluZycgPyByZXEucXVlcnkuc2NlbmUgOiAnJztcbiAgICAgICAgICAgICAgICBjb25zdCB7IHNldHRpbmdzIH0gPSBhd2FpdCBnZXRDYWNoZWRQcmV2aWV3U2V0dGluZ3Moc3RhcnRTY2VuZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ0dlbmVyYXRlIHByZXZpZXcgc2V0dGluZ3MgZmFpbGVkLicpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g57yp55+t5ZCv5Yqo5bGP5pe26Ze077yM6aKE6KeI5Yi35paw5pu05b+rXG4gICAgICAgICAgICAgICAgaWYgKChzZXR0aW5ncyBhcyBhbnkpLnNwbGFzaFNjcmVlbikge1xuICAgICAgICAgICAgICAgICAgICAoc2V0dGluZ3MgYXMgYW55KS5zcGxhc2hTY3JlZW4udG90YWxUaW1lID0gNTA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNldHRpbmdzIOWunuaXtuWPjeaYoOmhueebrueKtuaAge+8iOWQr+WKqOWcuuaZryAvIGpzTGlzdCAvIOiEmuacrOaYoOWwhO+8ie+8jOemgeatoue8k+WtmO+8jFxuICAgICAgICAgICAgICAgIC8vIOWQpuWImea1j+iniOWZqOS8muWkjeeUqOaXpyBzZXR0aW5nc++8jOWHuueOsOKAnOW5veeBteKAneaPkuS7ti/lnLrmma/nrYnpl67popjjgIJcbiAgICAgICAgICAgICAgICByZXMuc2V0KCdDYWNoZS1Db250cm9sJywgJ25vLXN0b3JlJyk7XG4gICAgICAgICAgICAgICAgcmVzLnR5cGUoJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnKS5zZW5kKGB3aW5kb3cuX0NDU2V0dGluZ3MgPSAke0pTT04uc3RyaW5naWZ5KHNldHRpbmdzKX07YCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyDliJ3lp4vljJbmnKrlrozmiJDljbPor7fmsYLpooTop4jvvJrov5Tlm57lj6/ph43or5XnmoQgNTAz77yM6K6pIElERS/mtY/op4jlmajnqI3lkI7ph43or5XvvIxcbiAgICAgICAgICAgICAgICAvLyDogIzkuI3mmK/ov5Tlm57nvLogYnVpbHRpbkFzc2V0cyDnmoTlnY8gc2V0dGluZ3Mg5oiW6KO4IDUwMOOAglxuICAgICAgICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBQcmV2aWV3Tm90UmVhZHlFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYFtwcmV2aWV3LXNldHRpbmdzIFdhcm5pbmddIG5vdCByZWFkeSwgYXNrIGNsaWVudCB0byByZXRyeSAoc2NlbmU9JHtyZXEucXVlcnkuc2NlbmUgPz8gJyd9KWApO1xuICAgICAgICAgICAgICAgICAgICAvLyDlhbPplK7oh6rmhIjop6blj5HngrnvvJrnoa7mnInpooTop4jpobXlm6DmnKrlsLHnu6rogIwgYm9vdCDlpLHotKXvvIhzZXR0aW5ncy5qcyA1MDPvvInjgILmja7mraTmoIforrDlvoXoh6rmhIjvvIxcbiAgICAgICAgICAgICAgICAgICAgLy8g5b6FIHNldHRpbmdzIOmmluasoeecn+ato+WPr+eUqOaXtueUsSBsaXZlLXJlbG9hZCDlub/mkq0gYnJvd3NlcjpyZWxvYWQg5oqK6K+l6aG15Yi35paw5pWR5Zue77yM5peg6ZyA5omL5Yqo5Yi35paw44CCXG4gICAgICAgICAgICAgICAgICAgIC8vIOS7peOAjOehruWunuWPkeeUn+i/hyA1MDPjgI3kuLrkvp3mja7mr5Tkvp3otZYgc29ja2V0IOi/nuaOpeaXtuW6j+abtOWPr+mdoO+8iOinhOmBv+W8guatpeWwsee7quaOoua1i+i3qOi2iuWIneWni+WMluWujOaIkFxuICAgICAgICAgICAgICAgICAgICAvLyDovrnnlYzjgIHmoIforrAgaGVhbGVkIOWNtOa8j+W5v+aSreeahOernuaAge+8ieOAglxuICAgICAgICAgICAgICAgICAgICBub3RlUHJldmlld05vdFJlYWR5KCk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zZXQoJ1JldHJ5LUFmdGVyJywgJzEnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAzKS50eXBlKCd0ZXh0L3BsYWluJykuc2VuZCgnLy8gUHJldmlldyBpbml0aWFsaXppbmcsIHBsZWFzZSByZXRyeS4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5YW25a6D5byC5bi477ya5pi+5byP5omT5Y2w55yf5a6e5aCG5qCI77yM5ZCm5YiZ5Lya6KKrIGV4cHJlc3Mg6ZSZ6K+v5Lit6Ze05Lu25ZCe5oiQ6KO4IDUwMO+8jFxuICAgICAgICAgICAgICAgIC8vIOihqOeOsOS4uiBcIlBoeXNpY3NTeXN0ZW0gaW5pdERlZmF1bHRNYXRlcmlhbCBGYWlsZWRcIiAvIEdyYXBoaWNzIHJlY29tcGlsZVNoYWRlcnMgb2YgbnVsbOOAglxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtwcmV2aWV3LXNldHRpbmdzXSBzZXR0aW5ncy5qcyBnZW5lcmF0aW9uIEZBSUxFRCAoc2NlbmU9JHtyZXEucXVlcnkuc2NlbmUgPz8gJyd9KTpgLCBlcnIpO1xuICAgICAgICAgICAgICAgIG5leHQoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgLy8gYnVuZGxlIOeahOWOn+Wni+i1hOa6kOaWh+S7tu+8iGltcG9ydCAvIG5hdGl2Ze+8ie+8jOS7jiBhc3NldC1kYiBsaWJyYXJ5IOebruW9leivu+WPllxuICAgICAgICB1cmw6IC9eXFwvKD86cmVtb3RlfGFzc2V0cylcXC9bXi9dK1xcLyg/OmltcG9ydHxuYXRpdmUpXFwvKC4qKS8sXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZXEucGF0aC5tYXRjaCgvXlxcLyg/OnJlbW90ZXxhc3NldHMpXFwvW14vXStcXC8oPzppbXBvcnR8bmF0aXZlKVxcLyguKikvKTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOmAkOautSBlbmNvZGXvvIzlhbzlrrnlrZDotYTmupAgYEBgIOS4juWQq+eJueauiuWtl+espueahOebruW9leWQje+8iOS7heS/neeVmeWIhumalOespiAvIFxcIOS4jiBAIOS4jee8luegge+8iVxuICAgICAgICAgICAgICAgIGNvbnN0IHRhaWwgPSBtYXRjaFsxXS5yZXBsYWNlKC9bXlxcXFwvQF0rL2csIGVuY29kZVVSSUNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlycyA9IGF3YWl0IGdldExpYnJhcnlEaXJzKCk7XG4gICAgICAgICAgICAgICAgLy8g6Ziy55uu5b2V56m/6LaK77yaam9pbiDlkI7lv4Xpobvku43kvY3kuo4gbGlicmFyeSDnm67lvZXlhoXvvIzlkKbliJnot7Pov4fvvIhgLi5gIOS8mumAg+mAuOWHuuebruW9le+8iVxuICAgICAgICAgICAgICAgIGxldCBoaXQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGQgb2YgZGlycykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmdWxsID0gam9pbihkLCB0YWlsKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsID0gcmVsYXRpdmUoZCwgZnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWwuc3RhcnRzV2l0aCgnLi4nKSB8fCBpc0Fic29sdXRlKHJlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKGZ1bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoaXQgPSBmdWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFoaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzLnNlbmRGaWxlKGhpdCwgeyBkb3RmaWxlczogJ2FsbG93JyB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIG5leHQoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgLy8gYnVuZGxlIOmFjee9riBjb25maWcuanNvbiAvIGNjLmNvbmZpZy5qc29uXG4gICAgICAgIHVybDogL15cXC8oPzpyZW1vdGV8YXNzZXRzKVxcLyhbXi9dKylcXC8oPzpjb25maWd8Y2NcXC5jb25maWcpXFwuanNvbiQvLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmVxLnBhdGgubWF0Y2goL15cXC8oPzpyZW1vdGV8YXNzZXRzKVxcLyhbXi9dKylcXC8oPzpjb25maWd8Y2NcXC5jb25maWcpXFwuanNvbiQvKTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHsgYnVuZGxlQ29uZmlncyB9ID0gYXdhaXQgZ2V0Q2FjaGVkUHJldmlld1NldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29uZmlnID0gYnVuZGxlQ29uZmlncy5maW5kKChjKSA9PiBjLm5hbWUgPT09IG1hdGNoWzFdKTtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbihjb25maWcpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICAvLyBidW5kbGUg5YWl5Y+jIGluZGV4LmpzIOKAlOKAlCDpooTop4jkuIvohJrmnKznlLEgUXVpY2tQYWNrIGltcG9ydC1tYXAg5o+Q5L6b77yM6L+Z6YeM5Y+q6ZyA5LiA5Liq56m65qih5Z2X5Y2g5L2NXG4gICAgICAgIHVybDogL15cXC8oPzpyZW1vdGV8YXNzZXRzKVxcLyhbXi9dKylcXC9pbmRleFxcLmpzJC8sXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZXEucGF0aC5tYXRjaCgvXlxcLyg/OnJlbW90ZXxhc3NldHMpXFwvKFteL10rKVxcL2luZGV4XFwuanMkLyk7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gbWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgY29uc3QgeyBidW5kbGVDb25maWdzIH0gPSBhd2FpdCBnZXRDYWNoZWRQcmV2aWV3U2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWJ1bmRsZUNvbmZpZ3MuZmluZCgoYykgPT4gYy5uYW1lID09PSBuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMudHlwZSgnYXBwbGljYXRpb24vamF2YXNjcmlwdCcpLnNlbmQoXG4gICAgICAgICAgICAgICAgICAgIGBTeXN0ZW0ucmVnaXN0ZXIoXCJ2aXJ0dWFsOi8vL3ByZXJlcXVpc2l0ZS1pbXBvcnRzLyR7bmFtZX1cIiwgW10sIGZ1bmN0aW9uICgpIHtgICtcbiAgICAgICAgICAgICAgICAgICAgYCBcInVzZSBzdHJpY3RcIjsgcmV0dXJuIHsgc2V0dGVyczogW10sIGV4ZWN1dGU6IGZ1bmN0aW9uICgpIHt9IH07IH0pO2ApO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICAvLyDlkK/liqjlnLrmma8gSlNPTlxuICAgICAgICB1cmw6IC9eXFwvc2NlbmVcXC8oLispXFwuanNvbiQvLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmVxLnBhdGgubWF0Y2goL15cXC9zY2VuZVxcLyguKylcXC5qc29uJC8pO1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IHV1aWRPclVybCA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWRPclVybCA9IGRlY29kZVVSSUNvbXBvbmVudCh1dWlkT3JVcmwpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZ25vcmVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgeyBhc3NldE1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXNzZXRzJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1dWlkT3JVcmwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBpbmZvPy5saWJyYXJ5Py5bJy5qc29uJ107XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlIHx8ICFleGlzdHNTeW5jKGZpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcy5zZXQoJ0NhY2hlLUNvbnRyb2wnLCAnbm8tc3RvcmUnKTtcbiAgICAgICAgICAgICAgICByZXMuc2VuZEZpbGUoZmlsZSwgeyBkb3RmaWxlczogJ2FsbG93JyB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIG5leHQoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOmihOiniOaAgeexu+Wei+WMluWIm+W7uuiKgueCueaJgOmcgOeahOOAjOiKgueCueexu+WeiyDihpIg5YaF572uIFByZWZhYiB1dWlk44CN5pig5bCE77yI5Y+q6K+777yJ44CCXG4gICAgICAgICAqXG4gICAgICAgICAqIOmihOiniCBpZnJhbWUg6YeM55qEIGluc3BlY3QgYWdlbnTvvIhzdGF0aWMvd2ViL3ByZXZpZXctaW5zcGVjdC5qc++8ieWcqCBIaWVyYXJjaHkg5Y+z6ZSuXG4gICAgICAgICAqIENyZWF0ZSDilrggQ3ViZSAvIEJ1dHRvbiDigKYg5pe26ZyA6KaB6L+Z5byg6KGo44CC6L+Z6YeMKirnm7TmjqXovpPlh7rnvJbovpHmgIHnmoQgTk9ERV9DT05GSUdTKirvvIxcbiAgICAgICAgICog6ICM5LiN5piv5Zyo5YmN56uvIEpTIOmHjOmHjeaKhOS4gOS7ve+8jOS/neivgeS4pOS+p+eahCB1dWlkIC8gY2FudmFzUmVxdWlyZWQgLyBwcm9qZWN0LXR5cGUg5rC45LiN5ryC56e744CCXG4gICAgICAgICAqXG4gICAgICAgICAqIG5vZGUtdHlwZS1jb25maWcg5piv5peg5L6d6LWW55qE57qv5pWw5o2u5qih5Z2X77yI5LiNIGltcG9ydCBjY++8ie+8jOWPr+WuieWFqOWcqCBDTEkg5Li76L+b56iL5Yqg6L2944CCXG4gICAgICAgICAqIOazqOaEj+W/hemhu+azqOWGjOWcqCBgL3NjZW5lLyguKykuanNvbmAg5LmL5YmN5Lmf5peg5aao4oCU4oCU5Lik6ICF6Lev5b6E5qih5byP5LiN6YeN5Y+g77yI5pys6Lev55Sx5pegIC5qc29uIOWQjue8gO+8ieOAglxuICAgICAgICAgKi9cbiAgICAgICAgdXJsOiAnL3NjZW5lL2Fzc2V0LW1ldGEnLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRiVVJMID0gdHlwZW9mIHJlcS5xdWVyeS5kYlVSTCA9PT0gJ3N0cmluZycgPyByZXEucXVlcnkuZGJVUkwgOiAnJztcbiAgICAgICAgICAgICAgICBpZiAoIWRiVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm8oZGJVUkwpO1xuICAgICAgICAgICAgICAgIHJlcy5zZXQoJ0NhY2hlLUNvbnRyb2wnLCAnbm8tc3RvcmUnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8gfHwgaW5mby5pc0RpcmVjdG9yeSB8fCAhaW5mby51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6IGBhc3NldCBub3QgZm91bmQ6ICR7ZGJVUkx9YCB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzdWJBc3NldHMg5LiA5bm26L6T5Ye6KOS4gOWxgik66aKE6KeI56uv5Yib5bu6IFNwcml0ZSDoioLngrnml7bkvJjlhYjmjILnnJ/lrZDotYTkuqcgU3ByaXRlRnJhbWUsXG4gICAgICAgICAgICAgICAgLy8g6K6pIEluc3BlY3RvciDnmoQgc3ByaXRlRnJhbWUg5bGe5oCn5bim6LWE5LqnIHV1aWTjgIHlj6/ntKLlvJXlm54gQXNzZXRz44CCXG4gICAgICAgICAgICAgICAgY29uc3Qgc3ViQXNzZXRzID0gaW5mby5zdWJBc3NldHNcbiAgICAgICAgICAgICAgICAgICAgPyBPYmplY3QudmFsdWVzKGluZm8uc3ViQXNzZXRzKS5tYXAoc3ViID0+ICh7IHV1aWQ6IHN1Yi51dWlkLCB0eXBlOiBzdWIudHlwZSwgbmFtZTogc3ViLm5hbWUgfSkpXG4gICAgICAgICAgICAgICAgICAgIDogW107XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oeyB1dWlkOiBpbmZvLnV1aWQsIHR5cGU6IGluZm8udHlwZSwgbmFtZTogaW5mby5uYW1lLCBzdWJBc3NldHMgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDpooTop4jmgIHjgIzmjInotYTkuqfmi5bmi73liJvlu7roioLngrnjgI3miYDpnIDnmoTjgIxkYjovLyBVUkwg4oaSIHsgdXVpZCwgdHlwZSwgbmFtZSB944CN5Y+q6K+76Lev55Sx44CCXG4gICAgICAgICAqXG4gICAgICAgICAqIEhpZXJhcmNoeSDmjqXlj5fotYTkuqfmi5bmi73ml7bvvIhub2RlLmNyZWF0ZS1ieS1hc3NldO+8ieWPquaKiiBkYjovLyBVUkwg5Lyg6L+b6aKE6KeIIGlmcmFtZSDnmoRcbiAgICAgICAgICogaW5zcGVjdCBhZ2VudO+8iHN0YXRpYy93ZWIvcHJldmlldy1pbnNwZWN0Lmpz77yJ77yM6ICM5rS75Zy65pmv5Yqg6L29L+WunuS+i+WMlumcgOimgSB1dWlkIOS4juexu+Wei++8mlxuICAgICAgICAgKiDov5nph4zlnKggQ0xJIOS4u+i/m+eoi+ebtOaOpeafpSBhc3NldC1kYiDov5Tlm57mnIDlsI/lrZfmrrXvvIzkuI4gbm9kZS10eXBlLWNvbmZpZyDlkIzlsZ7pooTop4jlj6ror7vmlbDmja7ot6/nlLHjgIJcbiAgICAgICAgICovXG4gICAgICAgIHVybDogJy9zY2VuZS9ub2RlLXR5cGUtY29uZmlnJyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihfcmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBOT0RFX0NPTkZJR1MgfSA9IGF3YWl0IGltcG9ydCgnLi4vc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL25vZGUvbm9kZS10eXBlLWNvbmZpZycpO1xuICAgICAgICAgICAgICAgIC8vIOihqOmajyBDTEkg54mI5pys5Zu65a6a77yM5L2G6aKE6KeI55Sf5ZG95ZGo5pyf55+t77yM5LiN57yT5a2Y5Lul5YWN5Y2H57qn5ZCO5ou/5Yiw5pen6KGo44CCXG4gICAgICAgICAgICAgICAgcmVzLnNldCgnQ2FjaGUtQ29udHJvbCcsICduby1zdG9yZScpO1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKE5PREVfQ09ORklHUyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbl07XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXQ6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgLy8g5ri45oiP6aKE6KeI5YWl5Y+j6aG16Z2i77yI5rWP6KeI5Zmo5ri45oiP6aKE6KeI77yMUFJFVklFVyDmqKHlvI/vvIlcbiAgICAgICAgICAgIHVybDogJy8nLFxuICAgICAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogc2NyaXB0aW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvc2NyaXB0aW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZlckJhc2VVcmwgPSBgJHtyZXEucHJvdG9jb2x9Oi8vJHtyZXEuZ2V0KCdob3N0Jyl9YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSB0eXBlb2YgcmVxLnF1ZXJ5LnNjZW5lID09PSAnc3RyaW5nJyA/IHJlcS5xdWVyeS5zY2VuZSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZVF1ZXJ5ID0gc2NlbmUgPyBgP3NjZW5lPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHNjZW5lKX1gIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIC8vIHByb2plY3RQYXRoIOWPr+iDveWcqOaegeaXqeacn++8iOW3peeoi+WImiBvcGVu44CBc2NyaXB0aW5nIOWwmuacqiBpbml0aWFsaXpl77yJ5Li656m64oCU4oCUXG4gICAgICAgICAgICAgICAgICAgIC8vIGAvYCDmj5DliY3ms6jlhozku6Xpgb/lhY3liJ3lp4vljJbmnJ/lhZzlupUgNDA077yM5q2k5pe255So5YWc5bqV5qCH6aKY5riy5p+T5Y2z5Y+v77yI6aG16Z2i5pys6Lqr5Y+q6ZyA6IO95Yqg6L29XG4gICAgICAgICAgICAgICAgICAgIC8vIHNvY2tldC5pbyArIGJyb3dzZXI6cmVsb2FkIOebkeWQrO+8jOWwsee7quWQjuiHquaEiOWIt+aWsO+8ieOAglxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0TmFtZSA9IHNjcmlwdGluZy5wcm9qZWN0UGF0aCA/IGJhc2VuYW1lKHNjcmlwdGluZy5wcm9qZWN0UGF0aCkgOiAnUHJldmlldyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbmRlckRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogYENvY29zIENyZWF0b3IgLSAke3Byb2plY3ROYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJVUkw6IHNlcnZlckJhc2VVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0pzOiBgL3ByZXZpZXcvc2V0dGluZ3MuanMke3NjZW5lUXVlcnl9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lUXVlcnksXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3VG9vbGJhck9wdGlvbnM6IGdldFByZXZpZXdUb29sYmFyT3B0aW9ucygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2VlcCB0aGUgcHJldmlldyBwYWdlIGFsaWduZWQgd2l0aCBDcmVhdG9yOiBsb2NhbGl6ZSBkZXZpY2UtbW9kZSBuYW1lcyBvbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlcnZlciwgdGhlbiBpbmplY3QgdGhlIHJlc29sdmVkIHZhbHVlcyBpbnRvIHRoZSBicm93c2VyIHBhZ2UuIFRoZSB0b29sYmFyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpdHNlbGYgZG9lcyBub3QgbmVlZCBhIHNlY29uZCBjbGllbnQtc2lkZSBpMThuIHJ1bnRpbWUuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3VG9vbGJhckkxOG46IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzaWduUmVzb2x1dGlvbjogaTE4bi50KCdjb21tb24ucHJldmlldy5kZXZpY2UuZGVzaWduX3Jlc29sdXRpb24nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVsbFNjcmVlbjogaTE4bi50KCdjb21tb24ucHJldmlldy5kZXZpY2UuZnVsbF9zY3JlZW4nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2VicGFnZUZ1bGxTY3JlZW46IGkxOG4udCgnY29tbW9uLnByZXZpZXcuZGV2aWNlLndlYnBhZ2VfZnVsbF9zY3JlZW4nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVQYXRoID0gam9pbihHbG9iYWxQYXRocy53b3Jrc3BhY2UsICdzdGF0aWMnLCAnd2ViJywgJ2dhbWUuZWpzJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBlanMucmVuZGVyRmlsZSh0ZW1wbGF0ZVBhdGgsIHJlbmRlckRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAvLyDpooTop4jlhaXlj6PpobXkuI3nvJPlrZjvvIzpgb/lhY3mtY/op4jlmajlpI3nlKjml6fnmoQgYm9vdC9zZXR0aW5ncyDlvJXnlKhcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldCgnQ2FjaGUtQ29udHJvbCcsICduby1zdG9yZScpO1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZChodG1sKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOa4uOaIj+i/kOihjOaXtuWFseS6q+i1hOa6kOi3r+eUsVxuICAgICAgICAuLi5nYW1lUHJldmlld1Jlc291cmNlUm91dGVzLFxuICAgICAgICAvLyDlhbHkuqvnmoTlvJXmk44gLyDohJrmnKwgLyBTeXN0ZW1KUyAvIGltcG9ydC1tYXAg562J5Yqo5oCB6LWE5rqQ6Lev55Sx77yI5ZCrIC9zdGF0aWMvd2Vi77yJXG4gICAgICAgIC4uLnNjcmlwdGluZ1JvdXRlcyxcbiAgICBdLFxuICAgIHBvc3Q6IFtdLFxuICAgIHN0YXRpY0ZpbGVzOiBbXSxcbiAgICBzb2NrZXQ6IHtcbiAgICAgICAgY29ubmVjdGlvbjogKHNvY2tldDogYW55KSA9PiB7XG4gICAgICAgICAgICAvLyDlr7npvZAgQ3JlYXRvciBwcmV2aWV3LWFwcO+8muW3peWFt+agj+mAmui/h+WQjOS4gOS4qiBzb2NrZXQg5LiK5oqlIGNoYW5nZU9wdGlvbu+8jFxuICAgICAgICAgICAgLy8g5pyN5Yqh56uv5L+d5a2Y5Lya6K+d54q25oCB77yM5LiL5LiA5qyh6aG16Z2i5riy5p+T5pe26YeN5paw5rOo5YWl44CCXG4gICAgICAgICAgICBzb2NrZXQub24/LignY2hhbmdlT3B0aW9uJywgKG5hbWU6IHVua25vd24sIHZhbHVlOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0UHJldmlld1Rvb2xiYXJPcHRpb24obmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRpc2Nvbm5lY3Q6IChfc29ja2V0OiBhbnkpID0+IHsgfSxcbiAgICB9LFxufSBhcyBJTWlkZGxld2FyZUNvbnRyaWJ1dGlvbjtcbiJdfQ==