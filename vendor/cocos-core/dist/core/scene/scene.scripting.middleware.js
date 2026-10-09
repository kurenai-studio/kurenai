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
const path_1 = require("path");
const fs_1 = require("fs");
const ejs_1 = __importDefault(require("ejs"));
const global_1 = require("../../global");
const scripting_routes_1 = require("../preview/scripting-routes");
const fs_extra_1 = require("fs-extra");
exports.default = {
    get: [
        {
            // 场景编辑器预览入口（编辑器 realm）。挂在 /scene-editor/，与浏览器游戏预览的 / 区分。
            url: /^\/scene-editor\/?$/,
            async handler(req, res, next) {
                try {
                    // 无尾斜杠时重定向到带斜杠，保证页面相对路径解析一致
                    if (!req.path.endsWith('/')) {
                        return res.redirect(302, '/scene-editor/');
                    }
                    const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
                    const renderData = {
                        title: `Cocos Creator Preview - ${(0, path_1.basename)(scripting.projectPath)}`,
                        serverURL: serverBaseUrl
                    };
                    const templatePath = (0, path_1.join)(global_1.GlobalPaths.workspace, 'static', 'web', 'scene-editor.ejs');
                    const html = await ejs_1.default.renderFile(templatePath, renderData);
                    res.status(200).send(html);
                }
                catch (err) {
                    next(err);
                }
            },
        },
        {
            url: '/scene-editor/settings.json',
            async handler(req, res, next) {
                try {
                    const { getCachedSceneEditorSettings } = await Promise.resolve().then(() => __importStar(require('../preview/preview-settings')));
                    const result = await getCachedSceneEditorSettings();
                    res.set('Cache-Control', 'no-store');
                    res.status(200).json({
                        settings: result.settings,
                        bundleConfigs: result.bundleConfigs,
                    });
                }
                catch (err) {
                    const { PreviewNotReadyError } = await Promise.resolve().then(() => __importStar(require('../preview/preview-settings')));
                    if (err instanceof PreviewNotReadyError) {
                        res.set('Retry-After', '1');
                        return res.status(503).json({ error: 'Preview settings are not ready.' });
                    }
                    next(err);
                }
            },
        },
        {
            url: /^\/scene-editor\/assets\/([^/]+)\/(?:config|cc\.config)\.json$/,
            async handler(req, res, next) {
                try {
                    const match = req.path.match(/^\/scene-editor\/assets\/([^/]+)\/(?:config|cc\.config)\.json$/);
                    if (!match) {
                        return next();
                    }
                    const { getCachedSceneEditorSettings } = await Promise.resolve().then(() => __importStar(require('../preview/preview-settings')));
                    const settings = await getCachedSceneEditorSettings();
                    const config = settings.bundleConfigs.find((item) => item.name === match[1]);
                    if (!config) {
                        return next();
                    }
                    res.set('Cache-Control', 'no-store');
                    res.status(200).json(config);
                }
                catch (err) {
                    next(err);
                }
            },
        },
        {
            url: /^\/scene-editor\/assets\/([^/]+)\/index\.js$/,
            async handler(req, res, next) {
                try {
                    const match = req.path.match(/^\/scene-editor\/assets\/([^/]+)\/index\.js$/);
                    if (!match) {
                        return next();
                    }
                    const { getCachedSceneEditorSettings } = await Promise.resolve().then(() => __importStar(require('../preview/preview-settings')));
                    const settings = await getCachedSceneEditorSettings();
                    if (!settings.bundleConfigs.find((item) => item.name === match[1])) {
                        return next();
                    }
                    res.type('application/javascript').send(`System.register("virtual:///prerequisite-imports/${match[1]}", [], function () {` +
                        ` "use strict"; return { setters: [], execute: function () {} }; });`);
                }
                catch (err) {
                    next(err);
                }
            },
        },
        {
            url: /^\/scene-editor\/assets\/[^/]+\/(?:import|native)\/(.*)/,
            async handler(req, res, next) {
                try {
                    const match = req.path.match(/^\/scene-editor\/assets\/[^/]+\/(?:import|native)\/(.*)/);
                    if (!match) {
                        return next();
                    }
                    const filePath = await resolveSceneEditorLibraryFile(match[1]);
                    if (!filePath) {
                        return next();
                    }
                    res.sendFile(filePath, { dotfiles: 'allow' });
                }
                catch (err) {
                    next(err);
                }
            },
        },
        {
            url: '/preview',
            async handler(req, res, next) {
                try {
                    const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
                    const renderData = {
                        title: `Resource Preview - ${(0, path_1.basename)(scripting.projectPath)}`,
                        serverURL: serverBaseUrl
                    };
                    const templatePath = (0, path_1.join)(global_1.GlobalPaths.workspace, 'static', 'web', 'preview.ejs');
                    const html = await ejs_1.default.renderFile(templatePath, renderData);
                    res.status(200).send(html);
                }
                catch (err) {
                    next(err);
                }
            },
        },
        {
            url: '/scripting/effect-settings',
            async handler(req, res, next) {
                try {
                    const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                    const effectBinPath = (0, path_1.join)(scripting.projectPath, 'temp', 'cli', 'asset-db', 'effect', 'effect.bin');
                    if (await (0, fs_extra_1.pathExists)(effectBinPath)) {
                        res.setHeader('Content-Type', 'application/octet-stream');
                        res.sendFile(effectBinPath);
                    }
                    else {
                        res.status(404).send('effect.bin not found');
                    }
                }
                catch (err) {
                    next(err);
                }
            },
        },
        // 共享的引擎 / 脚本 / SystemJS / import-map 等动态资源路由
        ...scripting_routes_1.scriptingRoutes,
    ],
    post: [],
    staticFiles: [],
    socket: {
        connection: (_socket) => { },
        disconnect: (_socket) => { }
    },
};
let sceneEditorLibraryDirsCache = null;
async function getSceneEditorLibraryDirs() {
    if (sceneEditorLibraryDirsCache) {
        return sceneEditorLibraryDirsCache;
    }
    const { assetDBManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
    const dirs = Object.values(assetDBManager.assetDBInfo)
        .map((info) => info.library)
        .filter((item) => !!item);
    sceneEditorLibraryDirsCache = Array.from(new Set(dirs));
    return sceneEditorLibraryDirsCache;
}
async function resolveSceneEditorLibraryFile(tail) {
    const encodedTail = tail.replace(/[^\\/@]+/g, encodeURIComponent);
    const dirs = await getSceneEditorLibraryDirs();
    for (const dir of dirs) {
        const full = (0, path_1.join)(dir, encodedTail);
        const rel = (0, path_1.relative)(dir, full);
        if (rel.startsWith('..') || (0, path_1.isAbsolute)(rel)) {
            continue;
        }
        if ((0, fs_1.existsSync)(full)) {
            return full;
        }
    }
    return undefined;
}
