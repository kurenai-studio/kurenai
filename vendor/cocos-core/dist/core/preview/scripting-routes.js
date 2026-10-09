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
