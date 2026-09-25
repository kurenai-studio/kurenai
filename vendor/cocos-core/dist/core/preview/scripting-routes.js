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
exports.scriptingRoutes = void 0;
const path_1 = __importStar(require("path"));
const fs_extra_1 = require("fs-extra");
const global_1 = require("../../global");
const fs_1 = require("fs");
const graphics_config_1 = require("../engine/graphics-config");
function sendQuickPackChunk(res, filePath) {
    // QuickPack may emit chunks under project temp paths used by smoke workspaces.
    // The path is resolved by the loader, not by raw URL-to-file joining.
    res.sendFile(filePath, { dotfiles: 'allow' });
}
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
async function findLibraryFileByRelativePath(relPath) {
    const dirs = await getLibraryDirs();
    for (const dir of dirs) {
        const full = (0, path_1.join)(dir, relPath);
        const rel = (0, path_1.relative)(dir, full);
        if (rel.startsWith('..') || (0, path_1.isAbsolute)(rel)) {
            continue;
        }
        if (await (0, fs_extra_1.pathExists)(full) && (await (0, fs_extra_1.stat)(full)).isFile()) {
            return full;
        }
    }
    return undefined;
}
function decodePathParam(value) {
    try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    }
}
async function queryFreshEngineModules(fallbackModules) {
    try {
        let modules = fallbackModules;
        const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../configuration')));
        const fse = await Promise.resolve().then(() => __importStar(require('fs-extra')));
        const configPath = await configurationManager.getConfigPath();
        if (await fse.pathExists(configPath)) {
            const json = await fse.readJSON(configPath);
            const engineCfg = json?.engine;
            if (engineCfg) {
                // 与 Engine.syncConfig 的解析一致：优先 engine.includeModules；
                // 否则取选中的模块配置 engine.configs[globalConfigKey].includeModules。
                let diskModules = Array.isArray(engineCfg.includeModules)
                    ? engineCfg.includeModules
                    : undefined;
                if (!diskModules && engineCfg.configs) {
                    const key = engineCfg.globalConfigKey || Object.keys(engineCfg.configs)[0];
                    const selectedModules = engineCfg.configs?.[key]?.includeModules;
                    diskModules = Array.isArray(selectedModules) ? selectedModules : undefined;
                }
                const baseModules = diskModules ?? modules;
                if ((0, graphics_config_1.hasOwnConfigKey)(engineCfg, 'graphics')) {
                    const graphics = (0, graphics_config_1.mergeGraphicsConfigWithModules)(baseModules, engineCfg.graphics);
                    modules = (0, graphics_config_1.normalizeIncludeModulesWithGraphics)(baseModules, graphics);
                }
                else if ((0, graphics_config_1.hasOwnConfigKey)(engineCfg, 'customPipeline')) {
                    const graphics = (0, graphics_config_1.deriveGraphicsConfigFromCustomPipeline)(engineCfg.customPipeline, baseModules);
                    modules = (0, graphics_config_1.normalizeIncludeModulesWithGraphics)(baseModules, graphics);
                }
                else if (diskModules) {
                    modules = diskModules;
                }
            }
        }
        return modules;
    }
    catch (error) {
        console.debug('[engine/modules] read project config failed, fallback to cached:', error);
        return fallbackModules;
    }
}
function getAssetLibraryBaseUrl(serverBaseUrl) {
    return `${serverBaseUrl}/scripting/asset-library`;
}
/**
 * 动态预览的共享资源路由。
 *
 * 这些路由负责按请求动态托管「引擎 / 脚本(QuickPack) / SystemJS / import-map」等资源，
 * 游戏预览（game-preview.middleware）和场景编辑器预览（scene.scripting.middleware）共用，
 * 不包含各自专属的 `/` 入口路由。
 */
exports.scriptingRoutes = [
    {
        url: '/userland/macro',
        async handler(req, res, next) {
            try {
                const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                const macroPath = (0, path_1.join)(scripting.projectPath, 'temp', 'programming', 'custom-macro.js');
                if (!(await (0, fs_extra_1.pathExists)(macroPath))) {
                    return next();
                }
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                res.sendFile(macroPath);
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        url: '/scripting/web-env',
        async handler(req, res, next) {
            try {
                const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
                const enginePath = Engine.getInfo().typescript.path;
                const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                res.json({
                    projectPath: scripting.projectPath.replace(/\\/g, '/'),
                    enginePath: enginePath.replace(/\\/g, '/'),
                });
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // 引擎 external 依赖（如 physics cannon），SystemJS 请求 /external/%2540cocos/...（@ 被双重编码）。
        // 磁盘上目录名是单层编码的 %40cocos，所以这里需要解一层编码：%2540cocos → %40cocos。
        // 注意：Express 5 的 req.path 不会自动解码，必须用 req.originalUrl 手动 decodeURIComponent。
        url: /^\/external\//,
        async handler(req, res, next) {
            try {
                const { waitForProgrammingFacet } = await Promise.resolve().then(() => __importStar(require('../scripting/programming/FacetInstance')));
                const facet = await waitForProgrammingFacet();
                const rawPath = req.originalUrl.split('?')[0];
                const relPath = decodeURIComponent(rawPath.substring('/external'.length));
                const resourcePath = (0, path_1.join)(facet.engineDistRoot, 'external', relPath);
                if (await (0, fs_extra_1.pathExists)(resourcePath) && (await (0, fs_extra_1.stat)(resourcePath)).isFile()) {
                    res.sendFile(resourcePath, { dotfiles: 'allow' });
                }
                else {
                    next();
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // 引擎信息（含 native / typescript 路径），引擎 wasm 加载器与 editor-stub 依赖。
        // 原本只在场景编辑器预览的 SceneMiddleware 注册，这里移到共享路由，让游戏预览也可用。
        url: '/engine/query-engine-info',
        async handler(req, res, next) {
            try {
                const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
                res.status(200).send(Engine.getInfo());
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // 同步/异步读取引擎文件（wasm 等),editor-stub 的 fs mock 通过它读取二进制。
        url: '/engine/read-file-sync',
        async handler(req, res, next) {
            try {
                let filePath = req.query.path;
                if (!filePath) {
                    return res.status(400).send('Path is required');
                }
                filePath = path_1.default.normalize(filePath);
                if (!(await (0, fs_extra_1.pathExists)(filePath)) && filePath.endsWith('.wasm.wasm')) {
                    // 兼容 .wasm.wasm -> .wasm
                    const fallbackPath = filePath.slice(0, -5);
                    if (await (0, fs_extra_1.pathExists)(fallbackPath)) {
                        filePath = fallbackPath;
                    }
                }
                // 目录白名单：只允许读取引擎目录 + 当前项目目录下的文件，拒绝任意系统文件读取。
                // editor-stub 的请求来自两处：引擎 native/typescript 路径（wasm 等），以及场景编辑器
                // 预览的 ScriptService.init 通过 window.require 读取项目编译脚本（<project>/library/**）。
                const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
                const info = Engine.getInfo();
                const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                const allowedRoots = [global_1.GlobalPaths.enginePath, info?.native?.path, info?.typescript?.path, scripting.projectPath]
                    .filter((p) => !!p)
                    .map((p) => path_1.default.resolve(p));
                const resolved = path_1.default.resolve(filePath);
                const allowed = allowedRoots.some((root) => resolved === root || resolved.startsWith(root + path_1.default.sep));
                if (!allowed) {
                    return res.status(403).send('Forbidden');
                }
                if (await (0, fs_extra_1.pathExists)(resolved)) {
                    res.status(200).send(await (0, fs_extra_1.readFile)(resolved));
                }
                else {
                    res.status(404).send('File not found: ' + resolved);
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // 引擎 external 协议资源（wasm 外部依赖）。
        url: '/engine_external/',
        async handler(req, res, next) {
            try {
                const url = req.query.url;
                const externalProtocol = 'external:';
                if (typeof url === 'string' && url.startsWith(externalProtocol)) {
                    const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
                    const nativeEnginePath = Engine.getInfo().native.path;
                    const externalFilePath = url.replace(externalProtocol, (0, path_1.join)(nativeEnginePath, 'external/'));
                    res.status(200).send(await (0, fs_extra_1.readFile)(externalFilePath));
                }
                else {
                    res.status(404).send(`请求 external 资源失败，请使用 external 协议: ${req.url}`);
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // 资源信息查询（editor-stub 在 CC_EDITOR 模式下解析内置资源用，如物理默认材质）。
        url: /^\/query-asset-info\/(.+)$/,
        async handler(req, res, next) {
            try {
                const uuid = decodePathParam(req.params[0]);
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const assetInfo = assetManager.queryAssetInfo(uuid);
                if (assetInfo) {
                    res.status(200).json(assetInfo);
                }
                else {
                    res.status(404).json({ error: 'Asset not found', uuid });
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        url: '/query-asset-infos/:cctype',
        async handler(req, res, next) {
            try {
                const ccType = req.params.cctype;
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const assetInfos = assetManager.queryAssetInfos({ ccType });
                if (assetInfos) {
                    res.status(200).json(assetInfos);
                }
                else {
                    res.status(404).json({ error: 'Asset not found', ccType });
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // Imported asset files requested through the explicit asset-library base.
        // Supports both library/<uuid-prefix>/<uuid>.<ext> and
        // library/<uuid-prefix>/<uuid>/<filename>.
        url: /^\/scripting\/asset-library\/([\da-f]{2})\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}(?:@[^.\/]+)?)(?:\.([^/?]+)|\/([^/?]+))$/i,
        async handler(req, res, next) {
            try {
                const match = req.path.match(/^\/scripting\/asset-library\/([\da-f]{2})\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}(?:@[^.\/]+)?)(?:\.([^/?]+)|\/([^/?]+))$/i);
                if (!match) {
                    return next();
                }
                const [, dir, uuid, ext, filename] = match;
                const libraryKey = filename || `.${ext}`;
                const relativePath = filename ? `${dir}/${uuid}/${filename}` : `${dir}/${uuid}.${ext}`;
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const file = assetManager.queryAssetInfo(uuid)?.library?.[libraryKey]
                    ?? await findLibraryFileByRelativePath(relativePath);
                if (!file) {
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
        url: /^\/query-extname\/(.+)$/,
        async handler(req, res, next) {
            try {
                const uuid = decodePathParam(req.params[0]);
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const assetInfo = assetManager.queryAssetInfo(uuid);
                if (assetInfo?.library?.['.bin'] && Object.keys(assetInfo.library).length === 1) {
                    res.status(200).send('.cconb');
                }
                else {
                    res.status(200).send('');
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        // 插件脚本（settings.plugins.jsList）。PREVIEW 模式下引擎从 /plugins/<dbUrl> 加载
        // （见引擎 game.ts: `${PREVIEW ? 'plugins' : 'src'}/${jsListFile}`），
        // 这里按资源 url 找到编译后的 library .js 返回，对齐 build 的「拷贝插件脚本」行为。
        url: /^\/plugins\//,
        async handler(req, res, next) {
            try {
                let relPath = req.originalUrl.split('?')[0].substring('/plugins/'.length);
                try {
                    relPath = decodeURIComponent(relPath);
                }
                catch {
                    // 保留原值
                }
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const info = assetManager.queryAssetInfo(`db://${relPath}`);
                const file = info?.library?.['.js'];
                if (file && await (0, fs_extra_1.pathExists)(file) && (await (0, fs_extra_1.stat)(file)).isFile()) {
                    res.set('Cache-Control', 'no-store');
                    res.sendFile(file, { dotfiles: 'allow' });
                }
                else {
                    console.warn(`[Preview Server] Plugin script not found: ${relPath}`);
                    next();
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        url: /^\/scripting\/engine-dist/,
        async handler(req, res, next) {
            try {
                const { waitForProgrammingFacet } = await Promise.resolve().then(() => __importStar(require('../scripting/programming/FacetInstance')));
                const facet = await waitForProgrammingFacet();
                let relPath = req.path.substring('/scripting/engine-dist'.length);
                relPath = decodeURIComponent(relPath);
                const resourcePath = (0, path_1.join)(facet.engineDistRoot, relPath);
                if (await (0, fs_extra_1.pathExists)(resourcePath) && (await (0, fs_extra_1.stat)(resourcePath)).isFile()) {
                    res.sendFile(resourcePath, { dotfiles: 'allow' });
                }
                else {
                    next();
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        url: '/scripting/engine/game-config',
        async handler(req, res) {
            const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
            const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
            const assetLibraryBaseUrl = getAssetLibraryBaseUrl(serverBaseUrl);
            const config = await Engine.getGameConfig(serverBaseUrl, assetLibraryBaseUrl, assetLibraryBaseUrl);
            const cfg = config;
            cfg.overrideSettings = cfg.overrideSettings || {};
            cfg.overrideSettings.rendering = cfg.overrideSettings.rendering || {};
            // 直接读磁盘上的 cocos.config.json（配置真相源），以最新物理碰撞分组覆盖缓存值。
            // 原因同 design-resolution / modules 路由：Engine._config 只在 configuration:save 时刷新，
            // 改分组后不读盘兜底，预览重载仍会按旧枚举构建 cc.PhysicsGroup，导致新分组在预览里不生效。
            try {
                const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../configuration')));
                const fse = await Promise.resolve().then(() => __importStar(require('fs-extra')));
                const modules = await queryFreshEngineModules(Engine.getModules());
                const customPipeline = modules.includes(graphics_config_1.CUSTOM_PIPELINE_MODULE);
                cfg.overrideSettings.rendering.customPipeline = customPipeline;
                if (customPipeline) {
                    cfg.overrideSettings.rendering.effectSettingsPath = `${serverBaseUrl}/scripting/engine/effect-settings`;
                }
                const configPath = await configurationManager.getConfigPath();
                if (await fse.pathExists(configPath)) {
                    const json = await fse.readJSON(configPath);
                    const diskGroups = json?.engine?.physicsConfig?.collisionGroups;
                    if (Array.isArray(diskGroups)) {
                        cfg.overrideSettings.physics = cfg.overrideSettings.physics || {};
                        cfg.overrideSettings.physics.collisionGroups = diskGroups;
                    }
                }
            }
            catch (error) {
                console.debug('[game-config] read cocos.config.json collisionGroups failed, fallback to cached:', error);
            }
            res.json(config);
        },
    },
    {
        // 轻量接口：返回当前工程的设计分辨率，供场景进程在每次打开场景前刷新 cc.view。
        // Read the project-scope config file from disk through getConfigPath(), bypassing the main-process cache.
        // configurationManager.reload() 的 load() 不会把新值同步回已注册的配置实例，
        // Engine._config 也只在 configuration:save 时刷新，两者都可能慢一拍（改分辨率后要新建两次才生效的根因）。
        url: '/scripting/engine/design-resolution',
        async handler(req, res) {
            const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
            // 兜底：缓存/默认合并值
            let dr = Engine.getConfig().designResolution;
            try {
                const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../configuration')));
                const fse = await Promise.resolve().then(() => __importStar(require('fs-extra')));
                const configPath = await configurationManager.getConfigPath();
                if (await fse.pathExists(configPath)) {
                    const json = await fse.readJSON(configPath);
                    const disk = json?.engine?.designResolution;
                    if (disk && typeof disk.width === 'number' && typeof disk.height === 'number') {
                        // 以磁盘为准，缺失字段用缓存/默认补齐
                        dr = { ...dr, ...disk };
                    }
                }
            }
            catch (error) {
                console.debug('[design-resolution] read project config failed, fallback to cached:', error);
            }
            res.json(dr);
        },
    },
    {
        url: '/scripting/engine/modules',
        async handler(req, res) {
            const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
            const modules = await queryFreshEngineModules(Engine.getModules());
            res.json(modules);
        },
    },
    {
        url: '/scripting/engine/bin/.editor/:filename',
        async handler(req, res) {
            const { filename } = req.params;
            const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
            const enginePath = Engine.getInfo().typescript.path;
            const engineFilePath = path_1.default.join(enginePath, 'bin', '.editor', filename);
            try {
                const content = (0, fs_1.readFileSync)(engineFilePath);
                res.setHeader('Content-Type', 'application/javascript');
                res.status(200).send(content);
            }
            catch (error) {
                res.status(404).send('File not found');
            }
        },
    },
    {
        url: '/scripting/engine/effect-settings',
        async handler(req, res, next) {
            try {
                const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                const effectBinPath = (0, path_1.join)(scripting.projectPath, 'temp', 'asset-db', 'effect', 'effect.bin');
                if (await (0, fs_extra_1.pathExists)(effectBinPath) && (await (0, fs_extra_1.stat)(effectBinPath)).isFile()) {
                    res.sendFile(effectBinPath);
                }
                else {
                    next();
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        url: '/scripting/import-map-global',
        async handler(req, res) {
            const { waitForProgrammingFacet } = await Promise.resolve().then(() => __importStar(require('../scripting/programming/FacetInstance')));
            const facet = await waitForProgrammingFacet();
            const importMap = await facet.getGlobalImportMap();
            res.json(importMap);
        },
    },
    {
        url: /^\/scripting\/x/,
        async handler(req, res, next) {
            const { waitForProgrammingFacet } = await Promise.resolve().then(() => __importStar(require('../scripting/programming/FacetInstance')));
            const facet = await waitForProgrammingFacet();
            const url = req.path.substring('/scripting/x'.length).replace(/^\//, '');
            if (url === '' || url === '/') {
                return next();
            }
            // Special handling for pack import-map and resolution-detail-map
            if (url === 'pack-import-map-url') {
                try {
                    const resource = await facet.loadPackResource(facet.packImportMapURL);
                    if (resource.type === 'json') {
                        const importMap = resource.json;
                        // 移除 cce:/internal/x/cc 映射和相关 scope：
                        // pack 的 cc chunk 依赖 cce:/internal/x/cc-fu/*（engine feature units），
                        // 浏览器中 System-A 无法解析这些协议。
                        // 让 System-A 使用全局 import map 的 cc → q-bundled:///virtual/cc.js。
                        if (importMap.imports) {
                            const ccChunkUrl = importMap.imports['cce:/internal/x/cc'];
                            delete importMap.imports['cce:/internal/x/cc'];
                            // 移除 cc chunk 的 scope（包含 cc-fu/* 依赖）
                            if (ccChunkUrl && importMap.scopes) {
                                delete importMap.scopes[ccChunkUrl];
                            }
                            // 移除其他 scope 中对 cc chunk 的引用，改用全局 cc
                            if (importMap.scopes) {
                                for (const scope of Object.values(importMap.scopes)) {
                                    if (scope.cc === ccChunkUrl) {
                                        delete scope.cc;
                                    }
                                }
                            }
                        }
                        return res.json(importMap);
                    }
                    return next(new Error('Unexpected pack resource type'));
                }
                catch (err) {
                    return next(err);
                }
            }
            if (url === 'resolution-detail-map') {
                try {
                    const resource = await facet.loadPackResource(facet.packResolutionDetailMapURL);
                    if (resource.type === 'json') {
                        return res.json(resource.json);
                    }
                    return next(new Error('Unexpected pack resource type'));
                }
                catch (err) {
                    return next(err);
                }
            }
            // Forward query string
            const query = Object.keys(req.query).length === 0 ? '' : `?${new URLSearchParams(req.query).toString()}`;
            const fullUrl = url + query;
            try {
                const packResource = await facet.loadPackResource(fullUrl);
                if (packResource.type === 'json') {
                    res.json(packResource.json);
                }
                else if (packResource.type === 'chunk') {
                    sendQuickPackChunk(res, packResource.chunk.path);
                }
                else {
                    console.warn(`[Preview Server] Unknown pack resource type for ${fullUrl}:`, packResource);
                    next(new Error('Unknown pack resource type'));
                }
            }
            catch (err) {
                console.error(`[Preview Server] Failed to load pack resource ${fullUrl}:`, err);
                next(err);
            }
        },
    },
    {
        url: /^\/chunks\//,
        async handler(req, res, next) {
            const { waitForProgrammingFacet } = await Promise.resolve().then(() => __importStar(require('../scripting/programming/FacetInstance')));
            const facet = await waitForProgrammingFacet();
            const url = req.path.substring(1);
            try {
                const packResource = await facet.loadPackResource(url);
                if (packResource.type === 'chunk') {
                    sendQuickPackChunk(res, packResource.chunk.path);
                }
                else if (packResource.type === 'json') {
                    res.json(packResource.json);
                }
                else {
                    next();
                }
            }
            catch (err) {
                next(err);
            }
        },
    },
    {
        url: /^\/scripting\/engine/,
        async handler(req, res, next) {
            try {
                const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
                const enginePath = Engine.getInfo().typescript.path;
                // Use req.originalUrl because some directories have percent-encoded
                // names on disk (e.g. "external%3Aemscripten"). Express decodes
                // req.path, turning %3A into ':', which breaks lookup.
                // Decode ONE level of percent-encoding: %253A → %3A (files on disk
                // use single-encoded names, but SystemJS deps use double-encoded).
                const rawPath = req.originalUrl.split('?')[0];
                let relPath = rawPath.substring('/scripting/engine'.length);
                relPath = decodeURIComponent(relPath);
                const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../../core/scripting')));
                // Try engine root first — preserve percent-encoded dir names
                let resourcePath = (0, path_1.join)(enginePath, relPath);
                // If not found, try project temp engine target
                if (!(await (0, fs_extra_1.pathExists)(resourcePath))) {
                    const engineDistBase = '/bin/.cache/dev-cli/web';
                    let projectorRelPath = relPath;
                    if (relPath.startsWith(engineDistBase)) {
                        projectorRelPath = relPath.substring(engineDistBase.length);
                    }
                    resourcePath = (0, path_1.join)(scripting.projectPath, 'temp', 'programming', 'packer-driver', 'targets', 'preview', projectorRelPath).replace(/\\/g, '/');
                }
                // If it's a directory, try index.json or index.js
                if (await (0, fs_extra_1.pathExists)(resourcePath) && (await (0, fs_extra_1.stat)(resourcePath)).isDirectory()) {
                    const indexJson = (0, path_1.join)(resourcePath, 'index.json');
                    if (await (0, fs_extra_1.pathExists)(indexJson)) {
                        resourcePath = indexJson;
                    }
                }
                if (!(await (0, fs_extra_1.pathExists)(resourcePath)) && !relPath.endsWith('.js')) {
                    const jsPath = `${resourcePath}.js`;
                    if (await (0, fs_extra_1.pathExists)(jsPath)) {
                        resourcePath = jsPath;
                    }
                }
                if (await (0, fs_extra_1.pathExists)(resourcePath) && (await (0, fs_extra_1.stat)(resourcePath)).isFile()) {
                    res.sendFile(resourcePath, { dotfiles: 'allow' });
                }
                else {
                    console.warn(`[Preview Server] Engine resource NOT FOUND on disk: ${resourcePath}`);
                    next();
                }
            }
            catch (err) {
                console.error('[Preview Server] Engine handler error:', err);
                next(err);
            }
        },
    },
    {
        url: /^\/scripting\//,
        async handler(req, res, next) {
            const relPath = req.path.substring('/scripting/'.length);
            // Handle absolute monorepo paths resolved by Rollup
            if (relPath.includes('code/cocos-cli/') || relPath.includes('code\\cocos-cli\\')) {
                const monorepoPath = relPath.split('code/cocos-cli/')[1] || relPath.split('code\\cocos-cli\\')[1];
                let resourcePath = (0, path_1.join)(global_1.GlobalPaths.workspace, monorepoPath);
                if (!(await (0, fs_extra_1.pathExists)(resourcePath))) {
                    resourcePath = `${resourcePath}.js`;
                }
                if (!(await (0, fs_extra_1.pathExists)(resourcePath))) {
                    const jsonPath = `${resourcePath.replace(/\.js$/, '')}.json`;
                    if (await (0, fs_extra_1.pathExists)(jsonPath)) {
                        resourcePath = jsonPath;
                    }
                }
                if (!(await (0, fs_extra_1.pathExists)(resourcePath)) || !(await (0, fs_extra_1.stat)(resourcePath)).isFile()) {
                    // Try index.js if it's a directory or not a file
                    const dirPath = resourcePath.replace(/\.js$/, '');
                    const indexPath = (0, path_1.join)(dirPath, 'index.js');
                    if (await (0, fs_extra_1.pathExists)(indexPath)) {
                        resourcePath = indexPath;
                    }
                }
                if (await (0, fs_extra_1.pathExists)(resourcePath) && (await (0, fs_extra_1.stat)(resourcePath)).isFile()) {
                    return res.sendFile(resourcePath, { dotfiles: 'allow' });
                }
            }
            next();
        },
    },
    {
        url: /^\/static\/web/,
        async handler(req, res, next) {
            const relPath = req.path.substring('/static/web'.length);
            const resourcePath = (0, path_1.join)(global_1.GlobalPaths.workspace, 'static', 'web', relPath);
            if (await (0, fs_extra_1.pathExists)(resourcePath) && (await (0, fs_extra_1.stat)(resourcePath)).isFile()) {
                res.sendFile(resourcePath);
            }
            else {
                console.warn(`[Preview Server] Static resource not found: ${resourcePath}`);
                next();
            }
        },
    },
    {
        url: /^\/scripting\/systemjs/,
        async handler(req, res, next) {
            const { waitForProgrammingFacet } = await Promise.resolve().then(() => __importStar(require('../scripting/programming/FacetInstance')));
            const facet = await waitForProgrammingFacet();
            const relPath = req.path.substring('/scripting/systemjs'.length);
            if (relPath.startsWith('/extras/')) {
                const extraPath = (0, path_1.join)(global_1.GlobalPaths.workspace, 'node_modules', '@cocos', 'systemjs', 'dist', relPath);
                if (await (0, fs_extra_1.pathExists)(extraPath) && (await (0, fs_extra_1.stat)(extraPath)).isFile()) {
                    return res.sendFile(extraPath);
                }
            }
            const resourcePath = (0, path_1.join)(facet.systemJsHomeDir, relPath);
            if (await (0, fs_extra_1.pathExists)(resourcePath) && (await (0, fs_extra_1.stat)(resourcePath)).isFile()) {
                res.sendFile(resourcePath);
            }
            else {
                console.warn(`[Preview Server] SystemJS resource not found: ${resourcePath}`);
                next();
            }
        },
    },
    {
        url: /^\/scripting\/scene/,
        async handler(req, res, next) {
            let relPath = req.path.substring('/scripting/scene'.length);
            try {
                relPath = decodeURIComponent(relPath);
            }
            catch {
                // Ignore error
            }
            const resourcePath = (0, path_1.join)(global_1.GlobalPaths.workspace, 'dist', 'core', 'scene', relPath);
            let finalPath = resourcePath;
            if (!(await (0, fs_extra_1.pathExists)(finalPath))) {
                finalPath = `${finalPath}.js`;
            }
            if (await (0, fs_extra_1.pathExists)(finalPath) && (await (0, fs_extra_1.stat)(finalPath)).isFile()) {
                res.sendFile(finalPath, { dotfiles: 'allow' });
            }
            else {
                next();
            }
        },
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0aW5nLXJvdXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3ByZXZpZXcvc2NyaXB0aW5nLXJvdXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBd0Q7QUFDeEQsdUNBQXNEO0FBQ3RELHlDQUEyQztBQUMzQywyQkFBa0M7QUFDbEMsK0RBTW1DO0FBRW5DLFNBQVMsa0JBQWtCLENBQUMsR0FBYSxFQUFFLFFBQWdCO0lBQ3ZELCtFQUErRTtJQUMvRSxzRUFBc0U7SUFDdEUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQsSUFBSSxnQkFBZ0IsR0FBb0IsSUFBSSxDQUFDO0FBRTdDLEtBQUssVUFBVSxjQUFjO0lBQ3pCLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixPQUFPLGdCQUFnQixDQUFDO0lBQzVCLENBQUM7SUFDRCxNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsd0RBQWEsV0FBVyxHQUFDLENBQUM7SUFDckQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDO1NBQ2pELEdBQUcsQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUNoQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDN0MsT0FBTyxnQkFBZ0IsQ0FBQztBQUM1QixDQUFDO0FBRUQsS0FBSyxVQUFVLDZCQUE2QixDQUFDLE9BQWU7SUFDeEQsTUFBTSxJQUFJLEdB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QUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQztnQkFDRCxPQUFPLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDTCxlQUFlO1lBQ25CLENBQUM7WUFDRCxNQUFNLFlBQVksR0FBRyxJQUFBLFdBQUksRUFBQyxvQkFBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuRixJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUM7WUFDN0IsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFBLHFCQUFVLEVBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxTQUFTLEdBQUcsR0FBRyxTQUFTLEtBQUssQ0FBQztZQUNsQyxDQUFDO1lBRUQsSUFBSSxNQUFNLElBQUEscUJBQVUsRUFBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBQSxlQUFJLEVBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNsRSxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ25ELENBQUM7aUJBQU0sQ0FBQztnQkFDSixJQUFJLEVBQUUsQ0FBQztZQUNYLENBQUM7UUFDTCxDQUFDO0tBQ0o7Q0FDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UsIE5leHRGdW5jdGlvbiB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHBhdGgsIHsgaXNBYnNvbHV0ZSwgam9pbiwgcmVsYXRpdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHBhdGhFeGlzdHMsIHN0YXQsIHJlYWRGaWxlIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgR2xvYmFsUGF0aHMgfSBmcm9tICcuLi8uLi9nbG9iYWwnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHtcbiAgICBDVVNUT01fUElQRUxJTkVfTU9EVUxFLFxuICAgIGRlcml2ZUdyYXBoaWNzQ29uZmlnRnJvbUN1c3RvbVBpcGVsaW5lLFxuICAgIGhhc093bkNvbmZpZ0tleSxcbiAgICBtZXJnZUdyYXBoaWNzQ29uZmlnV2l0aE1vZHVsZXMsXG4gICAgbm9ybWFsaXplSW5jbHVkZU1vZHVsZXNXaXRoR3JhcGhpY3MsXG59IGZyb20gJy4uL2VuZ2luZS9ncmFwaGljcy1jb25maWcnO1xuXG5mdW5jdGlvbiBzZW5kUXVpY2tQYWNrQ2h1bmsocmVzOiBSZXNwb25zZSwgZmlsZVBhdGg6IHN0cmluZyk6IHZvaWQge1xuICAgIC8vIFF1aWNrUGFjayBtYXkgZW1pdCBjaHVua3MgdW5kZXIgcHJvamVjdCB0ZW1wIHBhdGhzIHVzZWQgYnkgc21va2Ugd29ya3NwYWNlcy5cbiAgICAvLyBUaGUgcGF0aCBpcyByZXNvbHZlZCBieSB0aGUgbG9hZGVyLCBub3QgYnkgcmF3IFVSTC10by1maWxlIGpvaW5pbmcuXG4gICAgcmVzLnNlbmRGaWxlKGZpbGVQYXRoLCB7IGRvdGZpbGVzOiAnYWxsb3cnIH0pO1xufVxuXG5sZXQgbGlicmFyeURpcnNDYWNoZTogc3RyaW5nW10gfCBudWxsID0gbnVsbDtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0TGlicmFyeURpcnMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmIChsaWJyYXJ5RGlyc0NhY2hlKSB7XG4gICAgICAgIHJldHVybiBsaWJyYXJ5RGlyc0NhY2hlO1xuICAgIH1cbiAgICBjb25zdCB7IGFzc2V0REJNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgIGNvbnN0IGRpcnMgPSBPYmplY3QudmFsdWVzKGFzc2V0REJNYW5hZ2VyLmFzc2V0REJJbmZvKVxuICAgICAgICAubWFwKChpbmZvOiBhbnkpID0+IGluZm8ubGlicmFyeSlcbiAgICAgICAgLmZpbHRlcigodik6IHYgaXMgc3RyaW5nID0+ICEhdik7XG4gICAgbGlicmFyeURpcnNDYWNoZSA9IEFycmF5LmZyb20obmV3IFNldChkaXJzKSk7XG4gICAgcmV0dXJuIGxpYnJhcnlEaXJzQ2FjaGU7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZpbmRMaWJyYXJ5RmlsZUJ5UmVsYXRpdmVQYXRoKHJlbFBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGlycyA9IGF3YWl0IGdldExpYnJhcnlEaXJzKCk7XG4gICAgZm9yIChjb25zdCBkaXIgb2YgZGlycykge1xuICAgICAgICBjb25zdCBmdWxsID0gam9pbihkaXIsIHJlbFBhdGgpO1xuICAgICAgICBjb25zdCByZWwgPSByZWxhdGl2ZShkaXIsIGZ1bGwpO1xuICAgICAgICBpZiAocmVsLnN0YXJ0c1dpdGgoJy4uJykgfHwgaXNBYnNvbHV0ZShyZWwpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXdhaXQgcGF0aEV4aXN0cyhmdWxsKSAmJiAoYXdhaXQgc3RhdChmdWxsKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmdWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGRlY29kZVBhdGhQYXJhbSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcXVlcnlGcmVzaEVuZ2luZU1vZHVsZXMoZmFsbGJhY2tNb2R1bGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0cnkge1xuICAgICAgICBsZXQgbW9kdWxlcyA9IGZhbGxiYWNrTW9kdWxlcztcbiAgICAgICAgY29uc3QgeyBjb25maWd1cmF0aW9uTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9jb25maWd1cmF0aW9uJyk7XG4gICAgICAgIGNvbnN0IGZzZSA9IGF3YWl0IGltcG9ydCgnZnMtZXh0cmEnKTtcbiAgICAgICAgY29uc3QgY29uZmlnUGF0aCA9IGF3YWl0IGNvbmZpZ3VyYXRpb25NYW5hZ2VyLmdldENvbmZpZ1BhdGgoKTtcbiAgICAgICAgaWYgKGF3YWl0IGZzZS5wYXRoRXhpc3RzKGNvbmZpZ1BhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBqc29uID0gYXdhaXQgZnNlLnJlYWRKU09OKGNvbmZpZ1BhdGgpO1xuICAgICAgICAgICAgY29uc3QgZW5naW5lQ2ZnID0ganNvbj8uZW5naW5lO1xuICAgICAgICAgICAgaWYgKGVuZ2luZUNmZykge1xuICAgICAgICAgICAgICAgIC8vIOS4jiBFbmdpbmUuc3luY0NvbmZpZyDnmoTop6PmnpDkuIDoh7TvvJrkvJjlhYggZW5naW5lLmluY2x1ZGVNb2R1bGVz77ybXG4gICAgICAgICAgICAgICAgLy8g5ZCm5YiZ5Y+W6YCJ5Lit55qE5qih5Z2X6YWN572uIGVuZ2luZS5jb25maWdzW2dsb2JhbENvbmZpZ0tleV0uaW5jbHVkZU1vZHVsZXPjgIJcbiAgICAgICAgICAgICAgICBsZXQgZGlza01vZHVsZXMgPSBBcnJheS5pc0FycmF5KGVuZ2luZUNmZy5pbmNsdWRlTW9kdWxlcylcbiAgICAgICAgICAgICAgICAgICAgPyBlbmdpbmVDZmcuaW5jbHVkZU1vZHVsZXNcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgaWYgKCFkaXNrTW9kdWxlcyAmJiBlbmdpbmVDZmcuY29uZmlncykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBlbmdpbmVDZmcuZ2xvYmFsQ29uZmlnS2V5IHx8IE9iamVjdC5rZXlzKGVuZ2luZUNmZy5jb25maWdzKVswXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWRNb2R1bGVzID0gZW5naW5lQ2ZnLmNvbmZpZ3M/LltrZXldPy5pbmNsdWRlTW9kdWxlcztcbiAgICAgICAgICAgICAgICAgICAgZGlza01vZHVsZXMgPSBBcnJheS5pc0FycmF5KHNlbGVjdGVkTW9kdWxlcykgPyBzZWxlY3RlZE1vZHVsZXMgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGJhc2VNb2R1bGVzID0gZGlza01vZHVsZXMgPz8gbW9kdWxlcztcbiAgICAgICAgICAgICAgICBpZiAoaGFzT3duQ29uZmlnS2V5KGVuZ2luZUNmZywgJ2dyYXBoaWNzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhcGhpY3MgPSBtZXJnZUdyYXBoaWNzQ29uZmlnV2l0aE1vZHVsZXMoYmFzZU1vZHVsZXMsIGVuZ2luZUNmZy5ncmFwaGljcyk7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZXMgPSBub3JtYWxpemVJbmNsdWRlTW9kdWxlc1dpdGhHcmFwaGljcyhiYXNlTW9kdWxlcywgZ3JhcGhpY3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFzT3duQ29uZmlnS2V5KGVuZ2luZUNmZywgJ2N1c3RvbVBpcGVsaW5lJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhcGhpY3MgPSBkZXJpdmVHcmFwaGljc0NvbmZpZ0Zyb21DdXN0b21QaXBlbGluZShlbmdpbmVDZmcuY3VzdG9tUGlwZWxpbmUsIGJhc2VNb2R1bGVzKTtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlcyA9IG5vcm1hbGl6ZUluY2x1ZGVNb2R1bGVzV2l0aEdyYXBoaWNzKGJhc2VNb2R1bGVzLCBncmFwaGljcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkaXNrTW9kdWxlcykge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVzID0gZGlza01vZHVsZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtb2R1bGVzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1tlbmdpbmUvbW9kdWxlc10gcmVhZCBwcm9qZWN0IGNvbmZpZyBmYWlsZWQsIGZhbGxiYWNrIHRvIGNhY2hlZDonLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBmYWxsYmFja01vZHVsZXM7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRBc3NldExpYnJhcnlCYXNlVXJsKHNlcnZlckJhc2VVcmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3NlcnZlckJhc2VVcmx9L3NjcmlwdGluZy9hc3NldC1saWJyYXJ5YDtcbn1cblxuLyoqXG4gKiDliqjmgIHpooTop4jnmoTlhbHkuqvotYTmupDot6/nlLHjgIJcbiAqXG4gKiDov5nkupvot6/nlLHotJ/otKPmjInor7fmsYLliqjmgIHmiZjnrqHjgIzlvJXmk44gLyDohJrmnKwoUXVpY2tQYWNrKSAvIFN5c3RlbUpTIC8gaW1wb3J0LW1hcOOAjeetiei1hOa6kO+8jFxuICog5ri45oiP6aKE6KeI77yIZ2FtZS1wcmV2aWV3Lm1pZGRsZXdhcmXvvInlkozlnLrmma/nvJbovpHlmajpooTop4jvvIhzY2VuZS5zY3JpcHRpbmcubWlkZGxld2FyZe+8ieWFseeUqO+8jFxuICog5LiN5YyF5ZCr5ZCE6Ieq5LiT5bGe55qEIGAvYCDlhaXlj6Pot6/nlLHjgIJcbiAqL1xuZXhwb3J0IGNvbnN0IHNjcmlwdGluZ1JvdXRlcyA9IFtcbiAgICB7XG4gICAgICAgIHVybDogJy91c2VybGFuZC9tYWNybycsXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBzY3JpcHRpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9zY3JpcHRpbmcnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtYWNyb1BhdGggPSBqb2luKHNjcmlwdGluZy5wcm9qZWN0UGF0aCwgJ3RlbXAnLCAncHJvZ3JhbW1pbmcnLCAnY3VzdG9tLW1hY3JvLmpzJyk7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgcGF0aEV4aXN0cyhtYWNyb1BhdGgpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vamF2YXNjcmlwdDsgY2hhcnNldD11dGYtOCcpO1xuICAgICAgICAgICAgICAgIHJlcy5zZW5kRmlsZShtYWNyb1BhdGgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICB1cmw6ICcvc2NyaXB0aW5nL3dlYi1lbnYnLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2VuZ2luZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuZ2luZVBhdGggPSBFbmdpbmUuZ2V0SW5mbygpLnR5cGVzY3JpcHQucGF0aDtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHNjcmlwdGluZyB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL3NjcmlwdGluZycpO1xuICAgICAgICAgICAgICAgIHJlcy5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdFBhdGg6IHNjcmlwdGluZy5wcm9qZWN0UGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyksXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZVBhdGg6IGVuZ2luZVBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICAvLyDlvJXmk44gZXh0ZXJuYWwg5L6d6LWW77yI5aaCIHBoeXNpY3MgY2Fubm9u77yJ77yMU3lzdGVtSlMg6K+35rGCIC9leHRlcm5hbC8lMjU0MGNvY29zLy4uLu+8iEAg6KKr5Y+M6YeN57yW56CB77yJ44CCXG4gICAgICAgIC8vIOejgeebmOS4iuebruW9leWQjeaYr+WNleWxgue8lueggeeahCAlNDBjb2Nvc++8jOaJgOS7pei/memHjOmcgOimgeino+S4gOWxgue8luegge+8miUyNTQwY29jb3Mg4oaSICU0MGNvY29z44CCXG4gICAgICAgIC8vIOazqOaEj++8mkV4cHJlc3MgNSDnmoQgcmVxLnBhdGgg5LiN5Lya6Ieq5Yqo6Kej56CB77yM5b+F6aG755SoIHJlcS5vcmlnaW5hbFVybCDmiYvliqggZGVjb2RlVVJJQ29tcG9uZW5044CCXG4gICAgICAgIHVybDogL15cXC9leHRlcm5hbFxcLy8sXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyB3YWl0Rm9yUHJvZ3JhbW1pbmdGYWNldCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zY3JpcHRpbmcvcHJvZ3JhbW1pbmcvRmFjZXRJbnN0YW5jZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhY2V0ID0gYXdhaXQgd2FpdEZvclByb2dyYW1taW5nRmFjZXQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCByYXdQYXRoID0gcmVxLm9yaWdpbmFsVXJsLnNwbGl0KCc/JylbMF07XG4gICAgICAgICAgICAgICAgY29uc3QgcmVsUGF0aCA9IGRlY29kZVVSSUNvbXBvbmVudChyYXdQYXRoLnN1YnN0cmluZygnL2V4dGVybmFsJy5sZW5ndGgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvdXJjZVBhdGggPSBqb2luKGZhY2V0LmVuZ2luZURpc3RSb290LCAnZXh0ZXJuYWwnLCByZWxQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoYXdhaXQgcGF0aEV4aXN0cyhyZXNvdXJjZVBhdGgpICYmIChhd2FpdCBzdGF0KHJlc291cmNlUGF0aCkpLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zZW5kRmlsZShyZXNvdXJjZVBhdGgsIHsgZG90ZmlsZXM6ICdhbGxvdycgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIG5leHQoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgLy8g5byV5pOO5L+h5oGv77yI5ZCrIG5hdGl2ZSAvIHR5cGVzY3JpcHQg6Lev5b6E77yJ77yM5byV5pOOIHdhc20g5Yqg6L295Zmo5LiOIGVkaXRvci1zdHViIOS+nei1luOAglxuICAgICAgICAvLyDljp/mnKzlj6rlnKjlnLrmma/nvJbovpHlmajpooTop4jnmoQgU2NlbmVNaWRkbGV3YXJlIOazqOWGjO+8jOi/memHjOenu+WIsOWFseS6q+i3r+eUse+8jOiuqea4uOaIj+mihOiniOS5n+WPr+eUqOOAglxuICAgICAgICB1cmw6ICcvZW5naW5lL3F1ZXJ5LWVuZ2luZS1pbmZvJyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IEVuZ2luZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9lbmdpbmUnKTtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZChFbmdpbmUuZ2V0SW5mbygpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIG5leHQoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgLy8g5ZCM5q2lL+W8guatpeivu+WPluW8leaTjuaWh+S7tu+8iHdhc20g562JKSxlZGl0b3Itc3R1YiDnmoQgZnMgbW9jayDpgJrov4flroPor7vlj5bkuozov5vliLbjgIJcbiAgICAgICAgdXJsOiAnL2VuZ2luZS9yZWFkLWZpbGUtc3luYycsXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVQYXRoID0gcmVxLnF1ZXJ5LnBhdGggYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKCdQYXRoIGlzIHJlcXVpcmVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUoZmlsZVBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHBhdGhFeGlzdHMoZmlsZVBhdGgpKSAmJiBmaWxlUGF0aC5lbmRzV2l0aCgnLndhc20ud2FzbScpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWFvOWuuSAud2FzbS53YXNtIC0+IC53YXNtXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrUGF0aCA9IGZpbGVQYXRoLnNsaWNlKDAsIC01KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF3YWl0IHBhdGhFeGlzdHMoZmFsbGJhY2tQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGggPSBmYWxsYmFja1BhdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g55uu5b2V55m95ZCN5Y2V77ya5Y+q5YWB6K646K+75Y+W5byV5pOO55uu5b2VICsg5b2T5YmN6aG555uu55uu5b2V5LiL55qE5paH5Lu277yM5ouS57ud5Lu75oSP57O757uf5paH5Lu26K+75Y+W44CCXG4gICAgICAgICAgICAgICAgLy8gZWRpdG9yLXN0dWIg55qE6K+35rGC5p2l6Ieq5Lik5aSE77ya5byV5pOOIG5hdGl2ZS90eXBlc2NyaXB0IOi3r+W+hO+8iHdhc20g562J77yJ77yM5Lul5Y+K5Zy65pmv57yW6L6R5ZmoXG4gICAgICAgICAgICAgICAgLy8g6aKE6KeI55qEIFNjcmlwdFNlcnZpY2UuaW5pdCDpgJrov4cgd2luZG93LnJlcXVpcmUg6K+75Y+W6aG555uu57yW6K+R6ISa5pys77yIPHByb2plY3Q+L2xpYnJhcnkvKirvvInjgIJcbiAgICAgICAgICAgICAgICBjb25zdCB7IEVuZ2luZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9lbmdpbmUnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvOiBhbnkgPSBFbmdpbmUuZ2V0SW5mbygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZGVmYXVsdDogc2NyaXB0aW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvc2NyaXB0aW5nJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsb3dlZFJvb3RzID0gW0dsb2JhbFBhdGhzLmVuZ2luZVBhdGgsIGluZm8/Lm5hdGl2ZT8ucGF0aCwgaW5mbz8udHlwZXNjcmlwdD8ucGF0aCwgc2NyaXB0aW5nLnByb2plY3RQYXRoXVxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChwKTogcCBpcyBzdHJpbmcgPT4gISFwKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChwKSA9PiBwYXRoLnJlc29sdmUocCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gcGF0aC5yZXNvbHZlKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxvd2VkID0gYWxsb3dlZFJvb3RzLnNvbWUoKHJvb3QpID0+IHJlc29sdmVkID09PSByb290IHx8IHJlc29sdmVkLnN0YXJ0c1dpdGgocm9vdCArIHBhdGguc2VwKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFhbGxvd2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuc2VuZCgnRm9yYmlkZGVuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKHJlc29sdmVkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZChhd2FpdCByZWFkRmlsZShyZXNvbHZlZCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCdGaWxlIG5vdCBmb3VuZDogJyArIHJlc29sdmVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIC8vIOW8leaTjiBleHRlcm5hbCDljY/orq7otYTmupDvvIh3YXNtIOWklumDqOS+nei1lu+8ieOAglxuICAgICAgICB1cmw6ICcvZW5naW5lX2V4dGVybmFsLycsXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gcmVxLnF1ZXJ5LnVybDtcbiAgICAgICAgICAgICAgICBjb25zdCBleHRlcm5hbFByb3RvY29sID0gJ2V4dGVybmFsOic7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnICYmIHVybC5zdGFydHNXaXRoKGV4dGVybmFsUHJvdG9jb2wpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2VuZ2luZScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYXRpdmVFbmdpbmVQYXRoID0gRW5naW5lLmdldEluZm8oKS5uYXRpdmUucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXh0ZXJuYWxGaWxlUGF0aCA9IHVybC5yZXBsYWNlKGV4dGVybmFsUHJvdG9jb2wsIGpvaW4obmF0aXZlRW5naW5lUGF0aCwgJ2V4dGVybmFsLycpKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQoYXdhaXQgcmVhZEZpbGUoZXh0ZXJuYWxGaWxlUGF0aCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKGDor7fmsYIgZXh0ZXJuYWwg6LWE5rqQ5aSx6LSl77yM6K+35L2/55SoIGV4dGVybmFsIOWNj+iurjogJHtyZXEudXJsfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIG5leHQoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgLy8g6LWE5rqQ5L+h5oGv5p+l6K+i77yIZWRpdG9yLXN0dWIg5ZyoIENDX0VESVRPUiDmqKHlvI/kuIvop6PmnpDlhoXnva7otYTmupDnlKjvvIzlpoLniannkIbpu5jorqTmnZDotKjvvInjgIJcbiAgICAgICAgdXJsOiAvXlxcL3F1ZXJ5LWFzc2V0LWluZm9cXC8oLispJC8sXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGRlY29kZVBhdGhQYXJhbShyZXEucGFyYW1zWzBdKTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGFzc2V0TWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hc3NldHMnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm8odXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbihhc3NldEluZm8pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdBc3NldCBub3QgZm91bmQnLCB1dWlkIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIG5leHQoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgdXJsOiAnL3F1ZXJ5LWFzc2V0LWluZm9zLzpjY3R5cGUnLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNjVHlwZSA9IHJlcS5wYXJhbXMuY2N0eXBlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mb3MgPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm9zKHsgY2NUeXBlIH0pO1xuICAgICAgICAgICAgICAgIGlmIChhc3NldEluZm9zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKGFzc2V0SW5mb3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdBc3NldCBub3QgZm91bmQnLCBjY1R5cGUgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICAvLyBJbXBvcnRlZCBhc3NldCBmaWxlcyByZXF1ZXN0ZWQgdGhyb3VnaCB0aGUgZXhwbGljaXQgYXNzZXQtbGlicmFyeSBiYXNlLlxuICAgICAgICAvLyBTdXBwb3J0cyBib3RoIGxpYnJhcnkvPHV1aWQtcHJlZml4Pi88dXVpZD4uPGV4dD4gYW5kXG4gICAgICAgIC8vIGxpYnJhcnkvPHV1aWQtcHJlZml4Pi88dXVpZD4vPGZpbGVuYW1lPi5cbiAgICAgICAgdXJsOiAvXlxcL3NjcmlwdGluZ1xcL2Fzc2V0LWxpYnJhcnlcXC8oW1xcZGEtZl17Mn0pXFwvKFtcXGRhLWZdezh9LVtcXGRhLWZdezR9LVtcXGRhLWZdezR9LVtcXGRhLWZdezR9LVtcXGRhLWZdezEyfSg/OkBbXi5cXC9dKyk/KSg/OlxcLihbXi8/XSspfFxcLyhbXi8/XSspKSQvaSxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJlcS5wYXRoLm1hdGNoKC9eXFwvc2NyaXB0aW5nXFwvYXNzZXQtbGlicmFyeVxcLyhbXFxkYS1mXXsyfSlcXC8oW1xcZGEtZl17OH0tW1xcZGEtZl17NH0tW1xcZGEtZl17NH0tW1xcZGEtZl17NH0tW1xcZGEtZl17MTJ9KD86QFteLlxcL10rKT8pKD86XFwuKFteLz9dKyl8XFwvKFteLz9dKykpJC9pKTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IFssIGRpciwgdXVpZCwgZXh0LCBmaWxlbmFtZV0gPSBtYXRjaDtcbiAgICAgICAgICAgICAgICBjb25zdCBsaWJyYXJ5S2V5ID0gZmlsZW5hbWUgfHwgYC4ke2V4dH1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGZpbGVuYW1lID8gYCR7ZGlyfS8ke3V1aWR9LyR7ZmlsZW5hbWV9YCA6IGAke2Rpcn0vJHt1dWlkfS4ke2V4dH1gO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgeyBhc3NldE1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXNzZXRzJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1dWlkKT8ubGlicmFyeT8uW2xpYnJhcnlLZXldXG4gICAgICAgICAgICAgICAgICAgID8/IGF3YWl0IGZpbmRMaWJyYXJ5RmlsZUJ5UmVsYXRpdmVQYXRoKHJlbGF0aXZlUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzLnNldCgnQ2FjaGUtQ29udHJvbCcsICduby1zdG9yZScpO1xuICAgICAgICAgICAgICAgIHJlcy5zZW5kRmlsZShmaWxlLCB7IGRvdGZpbGVzOiAnYWxsb3cnIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICB1cmw6IC9eXFwvcXVlcnktZXh0bmFtZVxcLyguKykkLyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gZGVjb2RlUGF0aFBhcmFtKHJlcS5wYXJhbXNbMF0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoYXNzZXRJbmZvPy5saWJyYXJ5Py5bJy5iaW4nXSAmJiBPYmplY3Qua2V5cyhhc3NldEluZm8ubGlicmFyeSkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKCcuY2NvbmInKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZCgnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICAvLyDmj5Lku7bohJrmnKzvvIhzZXR0aW5ncy5wbHVnaW5zLmpzTGlzdO+8ieOAglBSRVZJRVcg5qih5byP5LiL5byV5pOO5LuOIC9wbHVnaW5zLzxkYlVybD4g5Yqg6L29XG4gICAgICAgIC8vIO+8iOingeW8leaTjiBnYW1lLnRzOiBgJHtQUkVWSUVXID8gJ3BsdWdpbnMnIDogJ3NyYyd9LyR7anNMaXN0RmlsZX1g77yJ77yMXG4gICAgICAgIC8vIOi/memHjOaMiei1hOa6kCB1cmwg5om+5Yiw57yW6K+R5ZCO55qEIGxpYnJhcnkgLmpzIOi/lOWbnu+8jOWvuem9kCBidWlsZCDnmoTjgIzmi7fotJ3mj5Lku7bohJrmnKzjgI3ooYzkuLrjgIJcbiAgICAgICAgdXJsOiAvXlxcL3BsdWdpbnNcXC8vLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZWxQYXRoID0gcmVxLm9yaWdpbmFsVXJsLnNwbGl0KCc/JylbMF0uc3Vic3RyaW5nKCcvcGx1Z2lucy8nLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVsUGF0aCA9IGRlY29kZVVSSUNvbXBvbmVudChyZWxQYXRoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5L+d55WZ5Y6f5YC8XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm8oYGRiOi8vJHtyZWxQYXRofWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBpbmZvPy5saWJyYXJ5Py5bJy5qcyddO1xuICAgICAgICAgICAgICAgIGlmIChmaWxlICYmIGF3YWl0IHBhdGhFeGlzdHMoZmlsZSkgJiYgKGF3YWl0IHN0YXQoZmlsZSkpLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zZXQoJ0NhY2hlLUNvbnRyb2wnLCAnbm8tc3RvcmUnKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmRGaWxlKGZpbGUsIHsgZG90ZmlsZXM6ICdhbGxvdycgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbUHJldmlldyBTZXJ2ZXJdIFBsdWdpbiBzY3JpcHQgbm90IGZvdW5kOiAke3JlbFBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHVybDogL15cXC9zY3JpcHRpbmdcXC9lbmdpbmUtZGlzdC8sXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyB3YWl0Rm9yUHJvZ3JhbW1pbmdGYWNldCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zY3JpcHRpbmcvcHJvZ3JhbW1pbmcvRmFjZXRJbnN0YW5jZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhY2V0ID0gYXdhaXQgd2FpdEZvclByb2dyYW1taW5nRmFjZXQoKTtcbiAgICAgICAgICAgICAgICBsZXQgcmVsUGF0aCA9IHJlcS5wYXRoLnN1YnN0cmluZygnL3NjcmlwdGluZy9lbmdpbmUtZGlzdCcubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICByZWxQYXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KHJlbFBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc291cmNlUGF0aCA9IGpvaW4oZmFjZXQuZW5naW5lRGlzdFJvb3QsIHJlbFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKHJlc291cmNlUGF0aCkgJiYgKGF3YWl0IHN0YXQocmVzb3VyY2VQYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmRGaWxlKHJlc291cmNlUGF0aCwgeyBkb3RmaWxlczogJ2FsbG93JyB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICB1cmw6ICcvc2NyaXB0aW5nL2VuZ2luZS9nYW1lLWNvbmZpZycsXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zdCB7IEVuZ2luZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9lbmdpbmUnKTtcbiAgICAgICAgICAgIGNvbnN0IHNlcnZlckJhc2VVcmwgPSBgJHtyZXEucHJvdG9jb2x9Oi8vJHtyZXEuZ2V0KCdob3N0Jyl9YDtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0TGlicmFyeUJhc2VVcmwgPSBnZXRBc3NldExpYnJhcnlCYXNlVXJsKHNlcnZlckJhc2VVcmwpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gYXdhaXQgRW5naW5lLmdldEdhbWVDb25maWcoc2VydmVyQmFzZVVybCwgYXNzZXRMaWJyYXJ5QmFzZVVybCwgYXNzZXRMaWJyYXJ5QmFzZVVybCk7XG4gICAgICAgICAgICBjb25zdCBjZmcgPSBjb25maWcgYXMgYW55O1xuICAgICAgICAgICAgY2ZnLm92ZXJyaWRlU2V0dGluZ3MgPSBjZmcub3ZlcnJpZGVTZXR0aW5ncyB8fCB7fTtcbiAgICAgICAgICAgIGNmZy5vdmVycmlkZVNldHRpbmdzLnJlbmRlcmluZyA9IGNmZy5vdmVycmlkZVNldHRpbmdzLnJlbmRlcmluZyB8fCB7fTtcbiAgICAgICAgICAgIC8vIOebtOaOpeivu+ejgeebmOS4iueahCBjb2Nvcy5jb25maWcuanNvbu+8iOmFjee9ruecn+ebuOa6kO+8ie+8jOS7peacgOaWsOeJqeeQhueisOaSnuWIhue7hOimhueblue8k+WtmOWAvOOAglxuICAgICAgICAgICAgLy8g5Y6f5Zug5ZCMIGRlc2lnbi1yZXNvbHV0aW9uIC8gbW9kdWxlcyDot6/nlLHvvJpFbmdpbmUuX2NvbmZpZyDlj6rlnKggY29uZmlndXJhdGlvbjpzYXZlIOaXtuWIt+aWsO+8jFxuICAgICAgICAgICAgLy8g5pS55YiG57uE5ZCO5LiN6K+755uY5YWc5bqV77yM6aKE6KeI6YeN6L295LuN5Lya5oyJ5pen5p6a5Li+5p6E5bu6IGNjLlBoeXNpY3NHcm91cO+8jOWvvOiHtOaWsOWIhue7hOWcqOmihOiniOmHjOS4jeeUn+aViOOAglxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGNvbmZpZ3VyYXRpb25NYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2NvbmZpZ3VyYXRpb24nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmc2UgPSBhd2FpdCBpbXBvcnQoJ2ZzLWV4dHJhJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlcyA9IGF3YWl0IHF1ZXJ5RnJlc2hFbmdpbmVNb2R1bGVzKEVuZ2luZS5nZXRNb2R1bGVzKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbVBpcGVsaW5lID0gbW9kdWxlcy5pbmNsdWRlcyhDVVNUT01fUElQRUxJTkVfTU9EVUxFKTtcbiAgICAgICAgICAgICAgICBjZmcub3ZlcnJpZGVTZXR0aW5ncy5yZW5kZXJpbmcuY3VzdG9tUGlwZWxpbmUgPSBjdXN0b21QaXBlbGluZTtcbiAgICAgICAgICAgICAgICBpZiAoY3VzdG9tUGlwZWxpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2ZnLm92ZXJyaWRlU2V0dGluZ3MucmVuZGVyaW5nLmVmZmVjdFNldHRpbmdzUGF0aCA9IGAke3NlcnZlckJhc2VVcmx9L3NjcmlwdGluZy9lbmdpbmUvZWZmZWN0LXNldHRpbmdzYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgY29uZmlnUGF0aCA9IGF3YWl0IGNvbmZpZ3VyYXRpb25NYW5hZ2VyLmdldENvbmZpZ1BhdGgoKTtcbiAgICAgICAgICAgICAgICBpZiAoYXdhaXQgZnNlLnBhdGhFeGlzdHMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IGZzZS5yZWFkSlNPTihjb25maWdQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlza0dyb3VwcyA9IGpzb24/LmVuZ2luZT8ucGh5c2ljc0NvbmZpZz8uY29sbGlzaW9uR3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkaXNrR3JvdXBzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ZnLm92ZXJyaWRlU2V0dGluZ3MucGh5c2ljcyA9IGNmZy5vdmVycmlkZVNldHRpbmdzLnBoeXNpY3MgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcub3ZlcnJpZGVTZXR0aW5ncy5waHlzaWNzLmNvbGxpc2lvbkdyb3VwcyA9IGRpc2tHcm91cHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tnYW1lLWNvbmZpZ10gcmVhZCBjb2Nvcy5jb25maWcuanNvbiBjb2xsaXNpb25Hcm91cHMgZmFpbGVkLCBmYWxsYmFjayB0byBjYWNoZWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLmpzb24oY29uZmlnKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgLy8g6L276YeP5o6l5Y+j77ya6L+U5Zue5b2T5YmN5bel56iL55qE6K6+6K6h5YiG6L6o546H77yM5L6b5Zy65pmv6L+b56iL5Zyo5q+P5qyh5omT5byA5Zy65pmv5YmN5Yi35pawIGNjLnZpZXfjgIJcbiAgICAgICAgLy8gUmVhZCB0aGUgcHJvamVjdC1zY29wZSBjb25maWcgZmlsZSBmcm9tIGRpc2sgdGhyb3VnaCBnZXRDb25maWdQYXRoKCksIGJ5cGFzc2luZyB0aGUgbWFpbi1wcm9jZXNzIGNhY2hlLlxuICAgICAgICAvLyBjb25maWd1cmF0aW9uTWFuYWdlci5yZWxvYWQoKSDnmoQgbG9hZCgpIOS4jeS8muaKiuaWsOWAvOWQjOatpeWbnuW3suazqOWGjOeahOmFjee9ruWunuS+i++8jFxuICAgICAgICAvLyBFbmdpbmUuX2NvbmZpZyDkuZ/lj6rlnKggY29uZmlndXJhdGlvbjpzYXZlIOaXtuWIt+aWsO+8jOS4pOiAhemDveWPr+iDveaFouS4gOaLje+8iOaUueWIhui+qOeOh+WQjuimgeaWsOW7uuS4pOasoeaJjeeUn+aViOeahOagueWboO+8ieOAglxuICAgICAgICB1cmw6ICcvc2NyaXB0aW5nL2VuZ2luZS9kZXNpZ24tcmVzb2x1dGlvbicsXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zdCB7IEVuZ2luZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9lbmdpbmUnKTtcbiAgICAgICAgICAgIC8vIOWFnOW6le+8mue8k+WtmC/pu5jorqTlkIjlubblgLxcbiAgICAgICAgICAgIGxldCBkciA9IEVuZ2luZS5nZXRDb25maWcoKS5kZXNpZ25SZXNvbHV0aW9uIGFzIHsgd2lkdGg/OiBudW1iZXI7IGhlaWdodD86IG51bWJlcjsgZml0V2lkdGg/OiBib29sZWFuOyBmaXRIZWlnaHQ/OiBib29sZWFuIH07XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgY29uZmlndXJhdGlvbk1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vY29uZmlndXJhdGlvbicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZzZSA9IGF3YWl0IGltcG9ydCgnZnMtZXh0cmEnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb25maWdQYXRoID0gYXdhaXQgY29uZmlndXJhdGlvbk1hbmFnZXIuZ2V0Q29uZmlnUGF0aCgpO1xuICAgICAgICAgICAgICAgIGlmIChhd2FpdCBmc2UucGF0aEV4aXN0cyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBqc29uID0gYXdhaXQgZnNlLnJlYWRKU09OKGNvbmZpZ1BhdGgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNrID0ganNvbj8uZW5naW5lPy5kZXNpZ25SZXNvbHV0aW9uO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzayAmJiB0eXBlb2YgZGlzay53aWR0aCA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGRpc2suaGVpZ2h0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Lul56OB55uY5Li65YeG77yM57y65aSx5a2X5q6155So57yT5a2YL+m7mOiupOihpem9kFxuICAgICAgICAgICAgICAgICAgICAgICAgZHIgPSB7IC4uLmRyLCAuLi5kaXNrIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1tkZXNpZ24tcmVzb2x1dGlvbl0gcmVhZCBwcm9qZWN0IGNvbmZpZyBmYWlsZWQsIGZhbGxiYWNrIHRvIGNhY2hlZDonLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuanNvbihkcik7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHVybDogJy9zY3JpcHRpbmcvZW5naW5lL21vZHVsZXMnLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xuICAgICAgICAgICAgY29uc3QgeyBFbmdpbmUgfSA9IGF3YWl0IGltcG9ydCgnLi4vZW5naW5lJyk7XG4gICAgICAgICAgICBjb25zdCBtb2R1bGVzID0gYXdhaXQgcXVlcnlGcmVzaEVuZ2luZU1vZHVsZXMoRW5naW5lLmdldE1vZHVsZXMoKSk7XG4gICAgICAgICAgICByZXMuanNvbihtb2R1bGVzKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgdXJsOiAnL3NjcmlwdGluZy9lbmdpbmUvYmluLy5lZGl0b3IvOmZpbGVuYW1lJyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZmlsZW5hbWUgfSA9IHJlcS5wYXJhbXM7XG4gICAgICAgICAgICBjb25zdCB7IEVuZ2luZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9lbmdpbmUnKTtcbiAgICAgICAgICAgIGNvbnN0IGVuZ2luZVBhdGggPSBFbmdpbmUuZ2V0SW5mbygpLnR5cGVzY3JpcHQucGF0aDtcbiAgICAgICAgICAgIGNvbnN0IGVuZ2luZUZpbGVQYXRoID0gcGF0aC5qb2luKGVuZ2luZVBhdGgsICdiaW4nLCAnLmVkaXRvcicsIGZpbGVuYW1lKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGVuZ2luZUZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcpO1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnRmlsZSBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgdXJsOiAnL3NjcmlwdGluZy9lbmdpbmUvZWZmZWN0LXNldHRpbmdzJyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGRlZmF1bHQ6IHNjcmlwdGluZyB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL3NjcmlwdGluZycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVmZmVjdEJpblBhdGggPSBqb2luKHNjcmlwdGluZy5wcm9qZWN0UGF0aCwgJ3RlbXAnLCAnYXNzZXQtZGInLCAnZWZmZWN0JywgJ2VmZmVjdC5iaW4nKTtcbiAgICAgICAgICAgICAgICBpZiAoYXdhaXQgcGF0aEV4aXN0cyhlZmZlY3RCaW5QYXRoKSAmJiAoYXdhaXQgc3RhdChlZmZlY3RCaW5QYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmRGaWxlKGVmZmVjdEJpblBhdGgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHVybDogJy9zY3JpcHRpbmcvaW1wb3J0LW1hcC1nbG9iYWwnLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xuICAgICAgICAgICAgY29uc3QgeyB3YWl0Rm9yUHJvZ3JhbW1pbmdGYWNldCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zY3JpcHRpbmcvcHJvZ3JhbW1pbmcvRmFjZXRJbnN0YW5jZScpO1xuICAgICAgICAgICAgY29uc3QgZmFjZXQgPSBhd2FpdCB3YWl0Rm9yUHJvZ3JhbW1pbmdGYWNldCgpO1xuICAgICAgICAgICAgY29uc3QgaW1wb3J0TWFwID0gYXdhaXQgZmFjZXQuZ2V0R2xvYmFsSW1wb3J0TWFwKCk7XG4gICAgICAgICAgICByZXMuanNvbihpbXBvcnRNYXApO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICB1cmw6IC9eXFwvc2NyaXB0aW5nXFwveC8sXG4gICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IHsgd2FpdEZvclByb2dyYW1taW5nRmFjZXQgfSA9IGF3YWl0IGltcG9ydCgnLi4vc2NyaXB0aW5nL3Byb2dyYW1taW5nL0ZhY2V0SW5zdGFuY2UnKTtcbiAgICAgICAgICAgIGNvbnN0IGZhY2V0ID0gYXdhaXQgd2FpdEZvclByb2dyYW1taW5nRmFjZXQoKTtcblxuICAgICAgICAgICAgY29uc3QgdXJsID0gcmVxLnBhdGguc3Vic3RyaW5nKCcvc2NyaXB0aW5nL3gnLmxlbmd0aCkucmVwbGFjZSgvXlxcLy8sICcnKTtcbiAgICAgICAgICAgIGlmICh1cmwgPT09ICcnIHx8IHVybCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3BlY2lhbCBoYW5kbGluZyBmb3IgcGFjayBpbXBvcnQtbWFwIGFuZCByZXNvbHV0aW9uLWRldGFpbC1tYXBcbiAgICAgICAgICAgIGlmICh1cmwgPT09ICdwYWNrLWltcG9ydC1tYXAtdXJsJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gYXdhaXQgZmFjZXQubG9hZFBhY2tSZXNvdXJjZShmYWNldC5wYWNrSW1wb3J0TWFwVVJMKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc291cmNlLnR5cGUgPT09ICdqc29uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1wb3J0TWFwID0gcmVzb3VyY2UuanNvbiBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnp7vpmaQgY2NlOi9pbnRlcm5hbC94L2NjIOaYoOWwhOWSjOebuOWFsyBzY29wZe+8mlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFjayDnmoQgY2MgY2h1bmsg5L6d6LWWIGNjZTovaW50ZXJuYWwveC9jYy1mdS8q77yIZW5naW5lIGZlYXR1cmUgdW5pdHPvvInvvIxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOa1j+iniOWZqOS4rSBTeXN0ZW0tQSDml6Dms5Xop6PmnpDov5nkupvljY/orq7jgIJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiuqSBTeXN0ZW0tQSDkvb/nlKjlhajlsYAgaW1wb3J0IG1hcCDnmoQgY2Mg4oaSIHEtYnVuZGxlZDovLy92aXJ0dWFsL2NjLmpz44CCXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW1wb3J0TWFwLmltcG9ydHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjY0NodW5rVXJsID0gaW1wb3J0TWFwLmltcG9ydHNbJ2NjZTovaW50ZXJuYWwveC9jYyddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBpbXBvcnRNYXAuaW1wb3J0c1snY2NlOi9pbnRlcm5hbC94L2NjJ107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g56e76ZmkIGNjIGNodW5rIOeahCBzY29wZe+8iOWMheWQqyBjYy1mdS8qIOS+nei1lu+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjY0NodW5rVXJsICYmIGltcG9ydE1hcC5zY29wZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGltcG9ydE1hcC5zY29wZXNbY2NDaHVua1VybF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOenu+mZpOWFtuS7liBzY29wZSDkuK3lr7kgY2MgY2h1bmsg55qE5byV55So77yM5pS555So5YWo5bGAIGNjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGltcG9ydE1hcC5zY29wZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBzY29wZSBvZiBPYmplY3QudmFsdWVzKGltcG9ydE1hcC5zY29wZXMpIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz5bXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLmNjID09PSBjY0NodW5rVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNjb3BlLmNjO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5qc29uKGltcG9ydE1hcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQobmV3IEVycm9yKCdVbmV4cGVjdGVkIHBhY2sgcmVzb3VyY2UgdHlwZScpKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXJsID09PSAncmVzb2x1dGlvbi1kZXRhaWwtbWFwJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gYXdhaXQgZmFjZXQubG9hZFBhY2tSZXNvdXJjZShmYWNldC5wYWNrUmVzb2x1dGlvbkRldGFpbE1hcFVSTCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNvdXJjZS50eXBlID09PSAnanNvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuanNvbihyZXNvdXJjZS5qc29uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgcGFjayByZXNvdXJjZSB0eXBlJykpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRm9yd2FyZCBxdWVyeSBzdHJpbmdcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmtleXMocmVxLnF1ZXJ5KS5sZW5ndGggPT09IDAgPyAnJyA6IGA/JHtuZXcgVVJMU2VhcmNoUGFyYW1zKHJlcS5xdWVyeSBhcyBhbnkpLnRvU3RyaW5nKCl9YDtcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxVcmwgPSB1cmwgKyBxdWVyeTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYWNrUmVzb3VyY2UgPSBhd2FpdCBmYWNldC5sb2FkUGFja1Jlc291cmNlKGZ1bGxVcmwpO1xuICAgICAgICAgICAgICAgIGlmIChwYWNrUmVzb3VyY2UudHlwZSA9PT0gJ2pzb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5qc29uKHBhY2tSZXNvdXJjZS5qc29uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhY2tSZXNvdXJjZS50eXBlID09PSAnY2h1bmsnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbmRRdWlja1BhY2tDaHVuayhyZXMsIHBhY2tSZXNvdXJjZS5jaHVuay5wYXRoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtQcmV2aWV3IFNlcnZlcl0gVW5rbm93biBwYWNrIHJlc291cmNlIHR5cGUgZm9yICR7ZnVsbFVybH06YCwgcGFja1Jlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dChuZXcgRXJyb3IoJ1Vua25vd24gcGFjayByZXNvdXJjZSB0eXBlJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQcmV2aWV3IFNlcnZlcl0gRmFpbGVkIHRvIGxvYWQgcGFjayByZXNvdXJjZSAke2Z1bGxVcmx9OmAsIGVycik7XG4gICAgICAgICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICB1cmw6IC9eXFwvY2h1bmtzXFwvLyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgY29uc3QgeyB3YWl0Rm9yUHJvZ3JhbW1pbmdGYWNldCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zY3JpcHRpbmcvcHJvZ3JhbW1pbmcvRmFjZXRJbnN0YW5jZScpO1xuICAgICAgICAgICAgY29uc3QgZmFjZXQgPSBhd2FpdCB3YWl0Rm9yUHJvZ3JhbW1pbmdGYWNldCgpO1xuICAgICAgICAgICAgY29uc3QgdXJsID0gcmVxLnBhdGguc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYWNrUmVzb3VyY2UgPSBhd2FpdCBmYWNldC5sb2FkUGFja1Jlc291cmNlKHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tSZXNvdXJjZS50eXBlID09PSAnY2h1bmsnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbmRRdWlja1BhY2tDaHVuayhyZXMsIHBhY2tSZXNvdXJjZS5jaHVuay5wYXRoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhY2tSZXNvdXJjZS50eXBlID09PSAnanNvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLmpzb24ocGFja1Jlc291cmNlLmpzb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHVybDogL15cXC9zY3JpcHRpbmdcXC9lbmdpbmUvLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2VuZ2luZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuZ2luZVBhdGggPSBFbmdpbmUuZ2V0SW5mbygpLnR5cGVzY3JpcHQucGF0aDtcbiAgICAgICAgICAgICAgICAvLyBVc2UgcmVxLm9yaWdpbmFsVXJsIGJlY2F1c2Ugc29tZSBkaXJlY3RvcmllcyBoYXZlIHBlcmNlbnQtZW5jb2RlZFxuICAgICAgICAgICAgICAgIC8vIG5hbWVzIG9uIGRpc2sgKGUuZy4gXCJleHRlcm5hbCUzQWVtc2NyaXB0ZW5cIikuIEV4cHJlc3MgZGVjb2Rlc1xuICAgICAgICAgICAgICAgIC8vIHJlcS5wYXRoLCB0dXJuaW5nICUzQSBpbnRvICc6Jywgd2hpY2ggYnJlYWtzIGxvb2t1cC5cbiAgICAgICAgICAgICAgICAvLyBEZWNvZGUgT05FIGxldmVsIG9mIHBlcmNlbnQtZW5jb2Rpbmc6ICUyNTNBIOKGkiAlM0EgKGZpbGVzIG9uIGRpc2tcbiAgICAgICAgICAgICAgICAvLyB1c2Ugc2luZ2xlLWVuY29kZWQgbmFtZXMsIGJ1dCBTeXN0ZW1KUyBkZXBzIHVzZSBkb3VibGUtZW5jb2RlZCkuXG4gICAgICAgICAgICAgICAgY29uc3QgcmF3UGF0aCA9IHJlcS5vcmlnaW5hbFVybC5zcGxpdCgnPycpWzBdO1xuICAgICAgICAgICAgICAgIGxldCByZWxQYXRoID0gcmF3UGF0aC5zdWJzdHJpbmcoJy9zY3JpcHRpbmcvZW5naW5lJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHJlbFBhdGggPSBkZWNvZGVVUklDb21wb25lbnQocmVsUGF0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBzY3JpcHRpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9zY3JpcHRpbmcnKTtcbiAgICAgICAgICAgICAgICAvLyBUcnkgZW5naW5lIHJvb3QgZmlyc3Qg4oCUIHByZXNlcnZlIHBlcmNlbnQtZW5jb2RlZCBkaXIgbmFtZXNcbiAgICAgICAgICAgICAgICBsZXQgcmVzb3VyY2VQYXRoID0gam9pbihlbmdpbmVQYXRoLCByZWxQYXRoKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIG5vdCBmb3VuZCwgdHJ5IHByb2plY3QgdGVtcCBlbmdpbmUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgcGF0aEV4aXN0cyhyZXNvdXJjZVBhdGgpKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmdpbmVEaXN0QmFzZSA9ICcvYmluLy5jYWNoZS9kZXYtY2xpL3dlYic7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9qZWN0b3JSZWxQYXRoID0gcmVsUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbFBhdGguc3RhcnRzV2l0aChlbmdpbmVEaXN0QmFzZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RvclJlbFBhdGggPSByZWxQYXRoLnN1YnN0cmluZyhlbmdpbmVEaXN0QmFzZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aCA9IGpvaW4oc2NyaXB0aW5nLnByb2plY3RQYXRoLCAndGVtcCcsICdwcm9ncmFtbWluZycsICdwYWNrZXItZHJpdmVyJywgJ3RhcmdldHMnLCAncHJldmlldycsIHByb2plY3RvclJlbFBhdGgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJZiBpdCdzIGEgZGlyZWN0b3J5LCB0cnkgaW5kZXguanNvbiBvciBpbmRleC5qc1xuICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKHJlc291cmNlUGF0aCkgJiYgKGF3YWl0IHN0YXQocmVzb3VyY2VQYXRoKSkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmRleEpzb24gPSBqb2luKHJlc291cmNlUGF0aCwgJ2luZGV4Lmpzb24nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF3YWl0IHBhdGhFeGlzdHMoaW5kZXhKc29uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VQYXRoID0gaW5kZXhKc29uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgcGF0aEV4aXN0cyhyZXNvdXJjZVBhdGgpKSAmJiAhcmVsUGF0aC5lbmRzV2l0aCgnLmpzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QganNQYXRoID0gYCR7cmVzb3VyY2VQYXRofS5qc2A7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKGpzUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aCA9IGpzUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKHJlc291cmNlUGF0aCkgJiYgKGF3YWl0IHN0YXQocmVzb3VyY2VQYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmRGaWxlKHJlc291cmNlUGF0aCwgeyBkb3RmaWxlczogJ2FsbG93JyB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtQcmV2aWV3IFNlcnZlcl0gRW5naW5lIHJlc291cmNlIE5PVCBGT1VORCBvbiBkaXNrOiAke3Jlc291cmNlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQcmV2aWV3IFNlcnZlcl0gRW5naW5lIGhhbmRsZXIgZXJyb3I6JywgZXJyKTtcbiAgICAgICAgICAgICAgICBuZXh0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHVybDogL15cXC9zY3JpcHRpbmdcXC8vLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCByZWxQYXRoID0gcmVxLnBhdGguc3Vic3RyaW5nKCcvc2NyaXB0aW5nLycubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBhYnNvbHV0ZSBtb25vcmVwbyBwYXRocyByZXNvbHZlZCBieSBSb2xsdXBcbiAgICAgICAgICAgIGlmIChyZWxQYXRoLmluY2x1ZGVzKCdjb2RlL2NvY29zLWNsaS8nKSB8fCByZWxQYXRoLmluY2x1ZGVzKCdjb2RlXFxcXGNvY29zLWNsaVxcXFwnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vbm9yZXBvUGF0aCA9IHJlbFBhdGguc3BsaXQoJ2NvZGUvY29jb3MtY2xpLycpWzFdIHx8IHJlbFBhdGguc3BsaXQoJ2NvZGVcXFxcY29jb3MtY2xpXFxcXCcpWzFdO1xuICAgICAgICAgICAgICAgIGxldCByZXNvdXJjZVBhdGggPSBqb2luKEdsb2JhbFBhdGhzLndvcmtzcGFjZSwgbW9ub3JlcG9QYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCBwYXRoRXhpc3RzKHJlc291cmNlUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aCA9IGAke3Jlc291cmNlUGF0aH0uanNgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCBwYXRoRXhpc3RzKHJlc291cmNlUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzb25QYXRoID0gYCR7cmVzb3VyY2VQYXRoLnJlcGxhY2UoL1xcLmpzJC8sICcnKX0uanNvbmA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKGpzb25QYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VQYXRoID0ganNvblBhdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgcGF0aEV4aXN0cyhyZXNvdXJjZVBhdGgpKSB8fCAhKGF3YWl0IHN0YXQocmVzb3VyY2VQYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IGluZGV4LmpzIGlmIGl0J3MgYSBkaXJlY3Rvcnkgb3Igbm90IGEgZmlsZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXJQYXRoID0gcmVzb3VyY2VQYXRoLnJlcGxhY2UoL1xcLmpzJC8sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXhQYXRoID0gam9pbihkaXJQYXRoLCAnaW5kZXguanMnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF3YWl0IHBhdGhFeGlzdHMoaW5kZXhQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VQYXRoID0gaW5kZXhQYXRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKHJlc291cmNlUGF0aCkgJiYgKGF3YWl0IHN0YXQocmVzb3VyY2VQYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zZW5kRmlsZShyZXNvdXJjZVBhdGgsIHsgZG90ZmlsZXM6ICdhbGxvdycgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICB1cmw6IC9eXFwvc3RhdGljXFwvd2ViLyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgY29uc3QgcmVsUGF0aCA9IHJlcS5wYXRoLnN1YnN0cmluZygnL3N0YXRpYy93ZWInLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCByZXNvdXJjZVBhdGggPSBqb2luKEdsb2JhbFBhdGhzLndvcmtzcGFjZSwgJ3N0YXRpYycsICd3ZWInLCByZWxQYXRoKTtcbiAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKHJlc291cmNlUGF0aCkgJiYgKGF3YWl0IHN0YXQocmVzb3VyY2VQYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICByZXMuc2VuZEZpbGUocmVzb3VyY2VQYXRoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbUHJldmlldyBTZXJ2ZXJdIFN0YXRpYyByZXNvdXJjZSBub3QgZm91bmQ6ICR7cmVzb3VyY2VQYXRofWApO1xuICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgdXJsOiAvXlxcL3NjcmlwdGluZ1xcL3N5c3RlbWpzLyxcbiAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgICAgICAgICAgY29uc3QgeyB3YWl0Rm9yUHJvZ3JhbW1pbmdGYWNldCB9ID0gYXdhaXQgaW1wb3J0KCcuLi9zY3JpcHRpbmcvcHJvZ3JhbW1pbmcvRmFjZXRJbnN0YW5jZScpO1xuICAgICAgICAgICAgY29uc3QgZmFjZXQgPSBhd2FpdCB3YWl0Rm9yUHJvZ3JhbW1pbmdGYWNldCgpO1xuICAgICAgICAgICAgY29uc3QgcmVsUGF0aCA9IHJlcS5wYXRoLnN1YnN0cmluZygnL3NjcmlwdGluZy9zeXN0ZW1qcycubGVuZ3RoKTtcbiAgICAgICAgICAgIGlmIChyZWxQYXRoLnN0YXJ0c1dpdGgoJy9leHRyYXMvJykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBleHRyYVBhdGggPSBqb2luKEdsb2JhbFBhdGhzLndvcmtzcGFjZSwgJ25vZGVfbW9kdWxlcycsICdAY29jb3MnLCAnc3lzdGVtanMnLCAnZGlzdCcsIHJlbFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKGV4dHJhUGF0aCkgJiYgKGF3YWl0IHN0YXQoZXh0cmFQYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zZW5kRmlsZShleHRyYVBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc291cmNlUGF0aCA9IGpvaW4oZmFjZXQuc3lzdGVtSnNIb21lRGlyLCByZWxQYXRoKTtcbiAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKHJlc291cmNlUGF0aCkgJiYgKGF3YWl0IHN0YXQocmVzb3VyY2VQYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICByZXMuc2VuZEZpbGUocmVzb3VyY2VQYXRoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbUHJldmlldyBTZXJ2ZXJdIFN5c3RlbUpTIHJlc291cmNlIG5vdCBmb3VuZDogJHtyZXNvdXJjZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICB1cmw6IC9eXFwvc2NyaXB0aW5nXFwvc2NlbmUvLFxuICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBsZXQgcmVsUGF0aCA9IHJlcS5wYXRoLnN1YnN0cmluZygnL3NjcmlwdGluZy9zY2VuZScubGVuZ3RoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVsUGF0aCA9IGRlY29kZVVSSUNvbXBvbmVudChyZWxQYXRoKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgIC8vIElnbm9yZSBlcnJvclxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzb3VyY2VQYXRoID0gam9pbihHbG9iYWxQYXRocy53b3Jrc3BhY2UsICdkaXN0JywgJ2NvcmUnLCAnc2NlbmUnLCByZWxQYXRoKTtcbiAgICAgICAgICAgIGxldCBmaW5hbFBhdGggPSByZXNvdXJjZVBhdGg7XG4gICAgICAgICAgICBpZiAoIShhd2FpdCBwYXRoRXhpc3RzKGZpbmFsUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgZmluYWxQYXRoID0gYCR7ZmluYWxQYXRofS5qc2A7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhd2FpdCBwYXRoRXhpc3RzKGZpbmFsUGF0aCkgJiYgKGF3YWl0IHN0YXQoZmluYWxQYXRoKSkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICByZXMuc2VuZEZpbGUoZmluYWxQYXRoLCB7IGRvdGZpbGVzOiAnYWxsb3cnIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbl07XG4iXX0=