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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuc2NyaXB0aW5nLm1pZGRsZXdhcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS5zY3JpcHRpbmcubWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLCtCQUE0RDtBQUM1RCwyQkFBZ0M7QUFDaEMsOENBQXNCO0FBQ3RCLHlDQUEyQztBQUMzQyxrRUFBOEQ7QUFDOUQsdUNBQXNDO0FBRXRDLGtCQUFlO0lBQ1gsR0FBRyxFQUFFO1FBQ0Q7WUFDSSx5REFBeUQ7WUFDekQsR0FBRyxFQUFFLHFCQUFxQjtZQUMxQixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQVksRUFBRSxHQUFhLEVBQUUsSUFBa0I7Z0JBQ3pELElBQUksQ0FBQztvQkFDRCw0QkFBNEI7b0JBQzVCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUMxQixPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQy9DLENBQUM7b0JBQ0QsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyx3REFBYSxzQkFBc0IsR0FBQyxDQUFDO29CQUNwRSxNQUFNLGFBQWEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxRQUFRLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUM3RCxNQUFNLFVBQVUsR0FBRzt3QkFDZixLQUFLLEVBQUUsMkJBQTJCLElBQUEsZUFBUSxFQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRTt3QkFDbkUsU0FBUyxFQUFFLGFBQWE7cUJBQzNCLENBQUM7b0JBQ0YsTUFBTSxZQUFZLEdBQUcsSUFBQSxXQUFJLEVBQUMsb0JBQVcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLEtB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O1lBQ25CLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSU1pZGRsZXdhcmVDb250cmlidXRpb24gfSBmcm9tICcuLi8uLi9zZXJ2ZXIvaW50ZXJmYWNlcyc7XG5pbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSwgTmV4dEZ1bmN0aW9uIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgaXNBYnNvbHV0ZSwgam9pbiwgcmVsYXRpdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgZWpzIGZyb20gJ2Vqcyc7XG5pbXBvcnQgeyBHbG9iYWxQYXRocyB9IGZyb20gJy4uLy4uL2dsb2JhbCc7XG5pbXBvcnQgeyBzY3JpcHRpbmdSb3V0ZXMgfSBmcm9tICcuLi9wcmV2aWV3L3NjcmlwdGluZy1yb3V0ZXMnO1xuaW1wb3J0IHsgcGF0aEV4aXN0cyB9IGZyb20gJ2ZzLWV4dHJhJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGdldDogW1xuICAgICAgICB7XG4gICAgICAgICAgICAvLyDlnLrmma/nvJbovpHlmajpooTop4jlhaXlj6PvvIjnvJbovpHlmaggcmVhbG3vvInjgILmjILlnKggL3NjZW5lLWVkaXRvci/vvIzkuI7mtY/op4jlmajmuLjmiI/pooTop4jnmoQgLyDljLrliIbjgIJcbiAgICAgICAgICAgIHVybDogL15cXC9zY2VuZS1lZGl0b3JcXC8/JC8sXG4gICAgICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5peg5bC+5pac5p2g5pe26YeN5a6a5ZCR5Yiw5bim5pac5p2g77yM5L+d6K+B6aG16Z2i55u45a+56Lev5b6E6Kej5p6Q5LiA6Ie0XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVxLnBhdGguZW5kc1dpdGgoJy8nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5yZWRpcmVjdCgzMDIsICcvc2NlbmUtZWRpdG9yLycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogc2NyaXB0aW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvc2NyaXB0aW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZlckJhc2VVcmwgPSBgJHtyZXEucHJvdG9jb2x9Oi8vJHtyZXEuZ2V0KCdob3N0Jyl9YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVuZGVyRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBgQ29jb3MgQ3JlYXRvciBQcmV2aWV3IC0gJHtiYXNlbmFtZShzY3JpcHRpbmcucHJvamVjdFBhdGgpfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJVUkw6IHNlcnZlckJhc2VVcmxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVQYXRoID0gam9pbihHbG9iYWxQYXRocy53b3Jrc3BhY2UsICdzdGF0aWMnLCAnd2ViJywgJ3NjZW5lLWVkaXRvci5lanMnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaHRtbCA9IGF3YWl0IGVqcy5yZW5kZXJGaWxlKHRlbXBsYXRlUGF0aCwgcmVuZGVyRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKGh0bWwpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdXJsOiAnL3NjZW5lLWVkaXRvci9zZXR0aW5ncy5qc29uJyxcbiAgICAgICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGdldENhY2hlZFNjZW5lRWRpdG9yU2V0dGluZ3MgfSA9IGF3YWl0IGltcG9ydCgnLi4vcHJldmlldy9wcmV2aWV3LXNldHRpbmdzJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdldENhY2hlZFNjZW5lRWRpdG9yU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldCgnQ2FjaGUtQ29udHJvbCcsICduby1zdG9yZScpO1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nczogcmVzdWx0LnNldHRpbmdzLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnVuZGxlQ29uZmlnczogcmVzdWx0LmJ1bmRsZUNvbmZpZ3MsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IFByZXZpZXdOb3RSZWFkeUVycm9yIH0gPSBhd2FpdCBpbXBvcnQoJy4uL3ByZXZpZXcvcHJldmlldy1zZXR0aW5ncycpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgUHJldmlld05vdFJlYWR5RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zZXQoJ1JldHJ5LUFmdGVyJywgJzEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMykuanNvbih7IGVycm9yOiAnUHJldmlldyBzZXR0aW5ncyBhcmUgbm90IHJlYWR5LicgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHVybDogL15cXC9zY2VuZS1lZGl0b3JcXC9hc3NldHNcXC8oW14vXSspXFwvKD86Y29uZmlnfGNjXFwuY29uZmlnKVxcLmpzb24kLyxcbiAgICAgICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJlcS5wYXRoLm1hdGNoKC9eXFwvc2NlbmUtZWRpdG9yXFwvYXNzZXRzXFwvKFteL10rKVxcLyg/OmNvbmZpZ3xjY1xcLmNvbmZpZylcXC5qc29uJC8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZ2V0Q2FjaGVkU2NlbmVFZGl0b3JTZXR0aW5ncyB9ID0gYXdhaXQgaW1wb3J0KCcuLi9wcmV2aWV3L3ByZXZpZXctc2V0dGluZ3MnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBnZXRDYWNoZWRTY2VuZUVkaXRvclNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHNldHRpbmdzLmJ1bmRsZUNvbmZpZ3MuZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLm5hbWUgPT09IG1hdGNoWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldCgnQ2FjaGUtQ29udHJvbCcsICduby1zdG9yZScpO1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbihjb25maWcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdXJsOiAvXlxcL3NjZW5lLWVkaXRvclxcL2Fzc2V0c1xcLyhbXi9dKylcXC9pbmRleFxcLmpzJC8sXG4gICAgICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByZXEucGF0aC5tYXRjaCgvXlxcL3NjZW5lLWVkaXRvclxcL2Fzc2V0c1xcLyhbXi9dKylcXC9pbmRleFxcLmpzJC8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZ2V0Q2FjaGVkU2NlbmVFZGl0b3JTZXR0aW5ncyB9ID0gYXdhaXQgaW1wb3J0KCcuLi9wcmV2aWV3L3ByZXZpZXctc2V0dGluZ3MnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBnZXRDYWNoZWRTY2VuZUVkaXRvclNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2V0dGluZ3MuYnVuZGxlQ29uZmlncy5maW5kKChpdGVtOiBhbnkpID0+IGl0ZW0ubmFtZSA9PT0gbWF0Y2hbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlcy50eXBlKCdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0Jykuc2VuZChcbiAgICAgICAgICAgICAgICAgICAgICAgIGBTeXN0ZW0ucmVnaXN0ZXIoXCJ2aXJ0dWFsOi8vL3ByZXJlcXVpc2l0ZS1pbXBvcnRzLyR7bWF0Y2hbMV19XCIsIFtdLCBmdW5jdGlvbiAoKSB7YCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgIFwidXNlIHN0cmljdFwiOyByZXR1cm4geyBzZXR0ZXJzOiBbXSwgZXhlY3V0ZTogZnVuY3Rpb24gKCkge30gfTsgfSk7YCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB1cmw6IC9eXFwvc2NlbmUtZWRpdG9yXFwvYXNzZXRzXFwvW14vXStcXC8oPzppbXBvcnR8bmF0aXZlKVxcLyguKikvLFxuICAgICAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmVxLnBhdGgubWF0Y2goL15cXC9zY2VuZS1lZGl0b3JcXC9hc3NldHNcXC9bXi9dK1xcLyg/OmltcG9ydHxuYXRpdmUpXFwvKC4qKS8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gYXdhaXQgcmVzb2x2ZVNjZW5lRWRpdG9yTGlicmFyeUZpbGUobWF0Y2hbMV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zZW5kRmlsZShmaWxlUGF0aCwgeyBkb3RmaWxlczogJ2FsbG93JyB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHVybDogJy9wcmV2aWV3JyxcbiAgICAgICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHNjcmlwdGluZyB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL3NjcmlwdGluZycpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXJ2ZXJCYXNlVXJsID0gYCR7cmVxLnByb3RvY29sfTovLyR7cmVxLmdldCgnaG9zdCcpfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbmRlckRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogYFJlc291cmNlIFByZXZpZXcgLSAke2Jhc2VuYW1lKHNjcmlwdGluZy5wcm9qZWN0UGF0aCl9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlclVSTDogc2VydmVyQmFzZVVybFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSBqb2luKEdsb2JhbFBhdGhzLndvcmtzcGFjZSwgJ3N0YXRpYycsICd3ZWInLCAncHJldmlldy5lanMnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaHRtbCA9IGF3YWl0IGVqcy5yZW5kZXJGaWxlKHRlbXBsYXRlUGF0aCwgcmVuZGVyRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKGh0bWwpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdXJsOiAnL3NjcmlwdGluZy9lZmZlY3Qtc2V0dGluZ3MnLFxuICAgICAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogc2NyaXB0aW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvc2NyaXB0aW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVmZmVjdEJpblBhdGggPSBqb2luKHNjcmlwdGluZy5wcm9qZWN0UGF0aCwgJ3RlbXAnLCAnY2xpJywgJ2Fzc2V0LWRiJywgJ2VmZmVjdCcsICdlZmZlY3QuYmluJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKGVmZmVjdEJpblBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuc2VuZEZpbGUoZWZmZWN0QmluUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnZWZmZWN0LmJpbiBub3QgZm91bmQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5YWx5Lqr55qE5byV5pOOIC8g6ISa5pysIC8gU3lzdGVtSlMgLyBpbXBvcnQtbWFwIOetieWKqOaAgei1hOa6kOi3r+eUsVxuICAgICAgICAuLi5zY3JpcHRpbmdSb3V0ZXMsXG4gICAgXSxcbiAgICBwb3N0OiBbXSxcbiAgICBzdGF0aWNGaWxlczogW10sXG4gICAgc29ja2V0OiB7XG4gICAgICAgIGNvbm5lY3Rpb246IChfc29ja2V0OiBhbnkpID0+IHsgfSxcbiAgICAgICAgZGlzY29ubmVjdDogKF9zb2NrZXQ6IGFueSkgPT4geyB9XG4gICAgfSxcbn0gYXMgSU1pZGRsZXdhcmVDb250cmlidXRpb247XG5cbmxldCBzY2VuZUVkaXRvckxpYnJhcnlEaXJzQ2FjaGU6IHN0cmluZ1tdIHwgbnVsbCA9IG51bGw7XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFNjZW5lRWRpdG9yTGlicmFyeURpcnMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmIChzY2VuZUVkaXRvckxpYnJhcnlEaXJzQ2FjaGUpIHtcbiAgICAgICAgcmV0dXJuIHNjZW5lRWRpdG9yTGlicmFyeURpcnNDYWNoZTtcbiAgICB9XG4gICAgY29uc3QgeyBhc3NldERCTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hc3NldHMnKTtcbiAgICBjb25zdCBkaXJzID0gT2JqZWN0LnZhbHVlcyhhc3NldERCTWFuYWdlci5hc3NldERCSW5mbylcbiAgICAgICAgLm1hcCgoaW5mbzogYW55KSA9PiBpbmZvLmxpYnJhcnkpXG4gICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIHN0cmluZyA9PiAhIWl0ZW0pO1xuICAgIHNjZW5lRWRpdG9yTGlicmFyeURpcnNDYWNoZSA9IEFycmF5LmZyb20obmV3IFNldChkaXJzKSk7XG4gICAgcmV0dXJuIHNjZW5lRWRpdG9yTGlicmFyeURpcnNDYWNoZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVNjZW5lRWRpdG9yTGlicmFyeUZpbGUodGFpbDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBlbmNvZGVkVGFpbCA9IHRhaWwucmVwbGFjZSgvW15cXFxcL0BdKy9nLCBlbmNvZGVVUklDb21wb25lbnQpO1xuICAgIGNvbnN0IGRpcnMgPSBhd2FpdCBnZXRTY2VuZUVkaXRvckxpYnJhcnlEaXJzKCk7XG4gICAgZm9yIChjb25zdCBkaXIgb2YgZGlycykge1xuICAgICAgICBjb25zdCBmdWxsID0gam9pbihkaXIsIGVuY29kZWRUYWlsKTtcbiAgICAgICAgY29uc3QgcmVsID0gcmVsYXRpdmUoZGlyLCBmdWxsKTtcbiAgICAgICAgaWYgKHJlbC5zdGFydHNXaXRoKCcuLicpIHx8IGlzQWJzb2x1dGUocmVsKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMoZnVsbCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmdWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG4iXX0=