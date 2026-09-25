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
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const asset_binary_routes_1 = require("./asset-binary-routes");
/**
 * 各资源数据库的 library（已导入数据）目录缓存。
 * library 是扁平的 `<uuid前两位>/<uuid>[/nativeName].<ext>` 结构，一个相对路径在所有
 * library 目录中唯一定位文件（与预览 game-preview.middleware.getLibraryDirs 对齐）。
 */
let libraryDirsCache = null;
/**
 * 「Preview in Editor」当前场景快照缓存（内存中继）。
 * 浏览器场景编辑器点 Play 时把编辑器里的实时场景（含未保存改动）序列化后 POST 到
 * /scene/current；游戏预览 iframe 以 /?scene=__current__ 启动，其 game-boot 通过
 * GET /scene/current.json 读回该快照并 loadWithJson 运行。缓存的是 serialize 输出的
 * JSON 字符串（非对象）。MVP 只保留单个活动预览。
 */
let currentSceneCache = null;
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
 * asset-db 未命中时，按扁平相对路径 `<uuid前两位>/<uuid>[/nativeName].<ext>` 直接从各
 * library 磁盘目录定位文件。
 *
 * 内置资源（如 pipeline/cluster-build，uuid=45e7c0c8...，前两位 45）只存在于 library 磁盘，
 * 并不在 asset-db 索引里。引擎在 cc.game.run() 初始化渲染管线时会按 importBase 扁平路径
 * `${serverURL}/45/<uuid>.json` 拉取该 effect；此前本路由只查 asset-db，命中不到就 404，
 * 导致渲染管线建不起来，随后打开任意场景都报
 * "Cannot read properties of null (reading 'pipelineSceneData')"（每次必现）。
 * 预览通过 getLibraryDirs 同样从 library 目录服务，故预览正常而场景编辑器此前失败。
 * 这里补上路由注释早已声明、却未实现的「回退到 library 磁盘」逻辑。
 */
async function resolveFromLibrary(tail) {
    const dirs = await getLibraryDirs();
    for (const d of dirs) {
        const full = path_1.default.join(d, tail);
        // 防目录穿越：join 后必须仍位于 library 目录内
        const rel = path_1.default.relative(d, full);
        if (rel.startsWith('..') || path_1.default.isAbsolute(rel)) {
            continue;
        }
        if (await fs_extra_1.default.pathExists(full)) {
            return full;
        }
    }
    return undefined;
}
function isBrowserRequest(req) {
    if (req.query.isBrowser === 'true') {
        return true;
    }
    const userAgent = req.headers['user-agent'];
    return !!req.headers['sec-ch-ua']
        || req.headers['accept']?.includes('text/html') === true
        || (typeof userAgent === 'string' && userAgent.includes('Mozilla/') && !userAgent.includes('node.js/'));
}
function decodePathParam(value) {
    try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    }
}
exports.default = {
    get: [
        {
            url: '/engine/read-file-sync',
            async handler(req, res) {
                let filePath = req.query.path;
                if (!filePath) {
                    return res.status(400).send('Path is required');
                }
                // Normalize path to fix mixed slashes on Windows
                filePath = path_1.default.normalize(filePath);
                if (!(await fs_extra_1.default.pathExists(filePath))) {
                    // Fallback for .wasm.wasm -> .wasm if the double extension file is missing
                    if (filePath.endsWith('.wasm.wasm')) {
                        const fallbackPath = filePath.slice(0, -5);
                        if (await fs_extra_1.default.pathExists(fallbackPath)) {
                            filePath = fallbackPath;
                        }
                    }
                }
                if (await fs_extra_1.default.pathExists(filePath)) {
                    const content = await fs_extra_1.default.readFile(filePath);
                    res.status(200).send(content);
                }
                else {
                    res.status(404).send('File not found: ' + filePath);
                }
            }
        },
        {
            // TODO 这里后续需要改引擎 wasm/wasm-nodejs.ts 的写法，改成向服务器请求数据
            url: '/engine/query-engine-info',
            async handler(req, res) {
                const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
                const engineInfo = Engine.getInfo();
                res.status(200).send(engineInfo);
            },
        },
        {
            // TODO 这里后续需要改引擎 wasm/wasm-nodejs.ts 的写法，改成向服务器请求数据
            url: '/engine_external/',
            async handler(req, res) {
                const url = req.query.url;
                const externalProtocol = 'external:';
                if (typeof url === 'string' && url.startsWith(externalProtocol)) {
                    const { Engine } = await Promise.resolve().then(() => __importStar(require('../engine')));
                    const nativeEnginePath = Engine.getInfo().native.path;
                    const externalFilePath = url.replace(externalProtocol, path_1.default.join(nativeEnginePath, 'external/'));
                    const arrayBuffer = await fs_extra_1.default.readFile(externalFilePath);
                    res.status(200).send(arrayBuffer);
                }
                else {
                    res.status(404).send(`请求 external 资源失败，请使用 external 协议: ${req.url}`);
                }
            },
        },
        {
            url: /^\/query-extname\/(.+)$/,
            async handler(req, res) {
                const uuid = decodePathParam(req.params[0]);
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const assetInfo = assetManager.queryAssetInfo(uuid);
                if (assetInfo?.library?.['.bin'] && Object.keys(assetInfo.library).length === 1) {
                    res.status(200).send('.cconb');
                }
                else {
                    res.status(200).send('');
                }
            },
        },
        {
            url: /^\/query-asset-info\/(.+)$/,
            async handler(req, res) {
                const uuid = decodePathParam(req.params[0]);
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const assetInfo = assetManager.queryAssetInfo(uuid);
                if (assetInfo) {
                    res.status(200).json(assetInfo);
                }
                else {
                    res.status(404).json({ error: 'Asset not found', uuid });
                }
            },
        },
        {
            url: '/query-asset-infos/:cctype',
            async handler(req, res) {
                const ccType = req.params.cctype;
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const assetInfos = assetManager.queryAssetInfos({ ccType });
                if (assetInfos) {
                    res.status(200).json(assetInfos);
                }
                else {
                    res.status(404).json({ error: 'Asset not found', ccType });
                }
            },
        },
        {
            // Preview in Editor：读回「当前编辑场景」快照。
            // 必须注册在下面的通用资源路由 `/:dir/:uuid.:ext` 之前，否则会被其捕获
            // （dir=scene, uuid=current, ext=json），走 asset-db 查询而 404。
            url: '/scene/current.json',
            async handler(req, res) {
                if (currentSceneCache == null) {
                    return res.status(404).json({ error: 'no current scene cached' });
                }
                // iframe reload 时必须实时读回最新快照，禁止缓存。
                res.setHeader('Cache-Control', 'no-store');
                // 缓存的是 serialize 输出的 JSON 字符串，直接以 application/json 原样发出，
                // game-boot 侧 fetch 后 .json() 解析（与 /scene/{uuid}.json 一致）。
                res.type('application/json').send(currentSceneCache);
            },
        },
        {
            // Serve library assets by UUID - try asset database first,
            // then fall back to library directories on disk
            url: '/:dir/:uuid/:nativeName.:ext',
            async handler(req, res, next) {
                if (req.params.dir === 'build' || req.params.dir === 'mcp') {
                    return next();
                }
                const { dir, uuid, ext, nativeName } = req.params;
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const assetInfo = assetManager.queryAssetInfo(uuid);
                let filePath = assetInfo?.library?.[`${nativeName}.${ext}`];
                if (!filePath) {
                    // asset-db 未命中：回退到 library 磁盘目录（见 resolveFromLibrary 注释）
                    filePath = await resolveFromLibrary(`${dir}/${uuid}/${nativeName}.${ext}`);
                }
                if (!filePath) {
                    console.warn(`Asset not found: ${req.url}`);
                    return res.status(404).json({
                        error: 'Asset not found',
                        requested: req.url,
                        uuid,
                        file: `${nativeName}.${ext}`
                    });
                }
                const isBrowser = isBrowserRequest(req);
                if (isBrowser) {
                    const content = await fs_extra_1.default.readFile(filePath);
                    const extname = path_1.default.extname(filePath);
                    const mimeMap = {
                        '.json': 'application/json',
                        '.bin': 'application/octet-stream',
                        '.cconb': 'application/octet-stream',
                        '.wasm': 'application/wasm',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg'
                    };
                    res.setHeader('Content-Type', mimeMap[extname] || 'application/octet-stream');
                    return res.status(200).send(content);
                }
                res.status(200).send(filePath || req.url);
            },
        },
        {
            url: '/:dir/:uuid.:ext',
            async handler(req, res) {
                const { dir, uuid, ext } = req.params;
                const { assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
                const assetInfo = assetManager.queryAssetInfo(uuid);
                let filePath = assetInfo?.library?.[`.${ext}`];
                if (!filePath) {
                    // asset-db 未命中：回退到 library 磁盘目录（见 resolveFromLibrary 注释）。
                    // 修复内置 effect（pipeline/cluster-build 等）经 `${serverURL}/45/<uuid>.json`
                    // 拉取时的 404，进而修复渲染管线为 null 引发的 pipelineSceneData 报错。
                    filePath = await resolveFromLibrary(`${dir}/${uuid}.${ext}`);
                }
                if (!filePath) {
                    console.warn(`Asset not found: ${req.url}`);
                    return res.status(404).json({
                        error: 'Asset not found',
                        requested: req.url,
                        uuid,
                    });
                }
                const isBrowser = isBrowserRequest(req);
                if (isBrowser) {
                    const content = await fs_extra_1.default.readFile(filePath);
                    const extname = path_1.default.extname(filePath);
                    const mimeMap = {
                        '.json': 'application/json',
                        '.bin': 'application/octet-stream',
                        '.cconb': 'application/octet-stream',
                        '.wasm': 'application/wasm',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg'
                    };
                    res.setHeader('Content-Type', mimeMap[extname] || 'application/octet-stream');
                    return res.status(200).send(content);
                }
                res.status(200).send(filePath || req.url);
            },
        }
    ],
    post: [
        ...(0, asset_binary_routes_1.createAssetBinaryRoutes)(),
        {
            // Preview in Editor：写入「当前编辑场景」快照。
            // 约定 body 为 { data: <serialize 输出的 JSON 字符串> }：serialize 交付的是字符串，
            // 若客户端直接把顶层字符串作为 JSON 发送，会被 express.json 的 strict 模式（默认）
            // 以 400 拒绝，故用对象包裹。
            url: '/scene/current',
            async handler(req, res) {
                const data = req.body?.data;
                if (typeof data !== 'string') {
                    return res.status(400).json({ error: 'body.data (serialized scene string) is required' });
                }
                currentSceneCache = data;
                res.status(200).json({ ok: true });
            },
        },
        {
            url: '/rpc/:module/:method',
            async handler(req, res) {
                const { module, method } = req.params;
                const args = req.body;
                try {
                    const { Rpc } = await Promise.resolve().then(() => __importStar(require('./main-process/rpc')));
                    const result = await Rpc.getInstance().executeLocal(module, method, args);
                    console.log(`[Scene Web RPC] ${module}.${method} ->`, typeof result === 'undefined' ? 'undefined' : (result === null ? 'null' : typeof result));
                    res.status(200).json({ type: 'response', result });
                }
                catch (e) {
                    console.error(`[Scene] RPC Error (${module}.${method}):`, e);
                    res.status(200).json({ type: 'response', error: e?.message || String(e) });
                }
            }
        }
    ],
    staticFiles: [],
    socket: {
        connection: (socket) => { },
        disconnect: (socket) => { }
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUubWlkZGxld2FyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLm1pZGRsZXdhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxnREFBd0I7QUFDeEIsd0RBQTJCO0FBQzNCLCtEQUFnRTtBQUVoRTs7OztHQUlHO0FBQ0gsSUFBSSxnQkFBZ0IsR0FBb0IsSUFBSSxDQUFDO0FBRTdDOzs7Ozs7R0FNRztBQUNILElBQUksaUJBQWlCLEdBQWtCLElBQUksQ0FBQztBQUM1QyxLQUFLLFVBQVUsY0FBYztJQUN6QixJQUFJLGdCQUFnQixFQUFFLENBQUM7UUFDbkIsT0FBTyxnQkFBZ0IsQ0FBQztJQUM1QixDQUFDO0lBQ0QsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLHdEQUFhLFdBQVcsR0FBQyxDQUFDO0lBQ3JELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQztTQUNqRCxHQUFHLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDaEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzdDLE9BQU8sZ0JBQWdCLENBQUM7QUFDNUIsQ0FBQztBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsS0FBSyxVQUFVLGtCQUFrQixDQUFDLElBQVk7SUFDMUMsTUFBTSxJQUFJLEdBQUcsTUFBTSxjQUFjLEVBQUUsQ0FBQztJQUNwQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ25CLE1BQU0sSUFBSSxHQUFHLGNBQUks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QUFPLENBQU0sRUFBRSxDQUFDO29CQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLE1BQU0sSUFBSSxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDN0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQy9FLENBQUM7WUFDTCxDQUFDO1NBQ0o7S0FDSjtJQUNELFdBQVcsRUFBRSxFQUFFO0lBQ2YsTUFBTSxFQUFFO1FBQ0osVUFBVSxFQUFFLENBQUMsTUFBVyxFQUFFLEVBQUUsR0FBRyxDQUFDO1FBQ2hDLFVBQVUsRUFBRSxDQUFDLE1BQVcsRUFBRSxFQUFFLEdBQUcsQ0FBQztLQUNuQztDQUN1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBJTWlkZGxld2FyZUNvbnRyaWJ1dGlvbiB9IGZyb20gJy4uLy4uL3NlcnZlci9pbnRlcmZhY2VzJztcbmltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24gfSBmcm9tICdleHByZXNzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzZSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBjcmVhdGVBc3NldEJpbmFyeVJvdXRlcyB9IGZyb20gJy4vYXNzZXQtYmluYXJ5LXJvdXRlcyc7XG5cbi8qKlxuICog5ZCE6LWE5rqQ5pWw5o2u5bqT55qEIGxpYnJhcnnvvIjlt7Llr7zlhaXmlbDmja7vvInnm67lvZXnvJPlrZjjgIJcbiAqIGxpYnJhcnkg5piv5omB5bmz55qEIGA8dXVpZOWJjeS4pOS9jT4vPHV1aWQ+Wy9uYXRpdmVOYW1lXS48ZXh0PmAg57uT5p6E77yM5LiA5Liq55u45a+56Lev5b6E5Zyo5omA5pyJXG4gKiBsaWJyYXJ5IOebruW9leS4reWUr+S4gOWumuS9jeaWh+S7tu+8iOS4jumihOiniCBnYW1lLXByZXZpZXcubWlkZGxld2FyZS5nZXRMaWJyYXJ5RGlycyDlr7npvZDvvInjgIJcbiAqL1xubGV0IGxpYnJhcnlEaXJzQ2FjaGU6IHN0cmluZ1tdIHwgbnVsbCA9IG51bGw7XG5cbi8qKlxuICog44CMUHJldmlldyBpbiBFZGl0b3LjgI3lvZPliY3lnLrmma/lv6vnhafnvJPlrZjvvIjlhoXlrZjkuK3nu6fvvInjgIJcbiAqIOa1j+iniOWZqOWcuuaZr+e8lui+keWZqOeCuSBQbGF5IOaXtuaKiue8lui+keWZqOmHjOeahOWunuaXtuWcuuaZr++8iOWQq+acquS/neWtmOaUueWKqO+8ieW6j+WIl+WMluWQjiBQT1NUIOWIsFxuICogL3NjZW5lL2N1cnJlbnTvvJvmuLjmiI/pooTop4ggaWZyYW1lIOS7pSAvP3NjZW5lPV9fY3VycmVudF9fIOWQr+WKqO+8jOWFtiBnYW1lLWJvb3Qg6YCa6L+HXG4gKiBHRVQgL3NjZW5lL2N1cnJlbnQuanNvbiDor7vlm57or6Xlv6vnhaflubYgbG9hZFdpdGhKc29uIOi/kOihjOOAgue8k+WtmOeahOaYryBzZXJpYWxpemUg6L6T5Ye655qEXG4gKiBKU09OIOWtl+espuS4su+8iOmdnuWvueixoe+8ieOAgk1WUCDlj6rkv53nlZnljZXkuKrmtLvliqjpooTop4jjgIJcbiAqL1xubGV0IGN1cnJlbnRTY2VuZUNhY2hlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbmFzeW5jIGZ1bmN0aW9uIGdldExpYnJhcnlEaXJzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAobGlicmFyeURpcnNDYWNoZSkge1xuICAgICAgICByZXR1cm4gbGlicmFyeURpcnNDYWNoZTtcbiAgICB9XG4gICAgY29uc3QgeyBhc3NldERCTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9hc3NldHMnKTtcbiAgICBjb25zdCBkaXJzID0gT2JqZWN0LnZhbHVlcyhhc3NldERCTWFuYWdlci5hc3NldERCSW5mbylcbiAgICAgICAgLm1hcCgoaW5mbzogYW55KSA9PiBpbmZvLmxpYnJhcnkpXG4gICAgICAgIC5maWx0ZXIoKHYpOiB2IGlzIHN0cmluZyA9PiAhIXYpO1xuICAgIGxpYnJhcnlEaXJzQ2FjaGUgPSBBcnJheS5mcm9tKG5ldyBTZXQoZGlycykpO1xuICAgIHJldHVybiBsaWJyYXJ5RGlyc0NhY2hlO1xufVxuXG4vKipcbiAqIGFzc2V0LWRiIOacquWRveS4reaXtu+8jOaMieaJgeW5s+ebuOWvuei3r+W+hCBgPHV1aWTliY3kuKTkvY0+Lzx1dWlkPlsvbmF0aXZlTmFtZV0uPGV4dD5gIOebtOaOpeS7juWQhFxuICogbGlicmFyeSDno4Hnm5jnm67lvZXlrprkvY3mlofku7bjgIJcbiAqXG4gKiDlhoXnva7otYTmupDvvIjlpoIgcGlwZWxpbmUvY2x1c3Rlci1idWlsZO+8jHV1aWQ9NDVlN2MwYzguLi7vvIzliY3kuKTkvY0gNDXvvInlj6rlrZjlnKjkuo4gbGlicmFyeSDno4Hnm5jvvIxcbiAqIOW5tuS4jeWcqCBhc3NldC1kYiDntKLlvJXph4zjgILlvJXmk47lnKggY2MuZ2FtZS5ydW4oKSDliJ3lp4vljJbmuLLmn5PnrqHnur/ml7bkvJrmjIkgaW1wb3J0QmFzZSDmiYHlubPot6/lvoRcbiAqIGAke3NlcnZlclVSTH0vNDUvPHV1aWQ+Lmpzb25gIOaLieWPluivpSBlZmZlY3TvvJvmraTliY3mnKzot6/nlLHlj6rmn6UgYXNzZXQtZGLvvIzlkb3kuK3kuI3liLDlsLEgNDA077yMXG4gKiDlr7zoh7TmuLLmn5PnrqHnur/lu7rkuI3otbfmnaXvvIzpmo/lkI7miZPlvIDku7vmhI/lnLrmma/pg73miqVcbiAqIFwiQ2Fubm90IHJlYWQgcHJvcGVydGllcyBvZiBudWxsIChyZWFkaW5nICdwaXBlbGluZVNjZW5lRGF0YScpXCLvvIjmr4/mrKHlv4XnjrDvvInjgIJcbiAqIOmihOiniOmAmui/hyBnZXRMaWJyYXJ5RGlycyDlkIzmoLfku44gbGlicmFyeSDnm67lvZXmnI3liqHvvIzmlYXpooTop4jmraPluLjogIzlnLrmma/nvJbovpHlmajmraTliY3lpLHotKXjgIJcbiAqIOi/memHjOihpeS4iui3r+eUseazqOmHiuaXqeW3suWjsOaYjuOAgeWNtOacquWunueOsOeahOOAjOWbnumAgOWIsCBsaWJyYXJ5IOejgeebmOOAjemAu+i+keOAglxuICovXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlRnJvbUxpYnJhcnkodGFpbDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkaXJzID0gYXdhaXQgZ2V0TGlicmFyeURpcnMoKTtcbiAgICBmb3IgKGNvbnN0IGQgb2YgZGlycykge1xuICAgICAgICBjb25zdCBmdWxsID0gcGF0aC5qb2luKGQsIHRhaWwpO1xuICAgICAgICAvLyDpmLLnm67lvZXnqb/otorvvJpqb2luIOWQjuW/hemhu+S7jeS9jeS6jiBsaWJyYXJ5IOebruW9leWGhVxuICAgICAgICBjb25zdCByZWwgPSBwYXRoLnJlbGF0aXZlKGQsIGZ1bGwpO1xuICAgICAgICBpZiAocmVsLnN0YXJ0c1dpdGgoJy4uJykgfHwgcGF0aC5pc0Fic29sdXRlKHJlbCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhd2FpdCBmc2UucGF0aEV4aXN0cyhmdWxsKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNCcm93c2VyUmVxdWVzdChyZXE6IFJlcXVlc3QpOiBib29sZWFuIHtcbiAgICBpZiAocmVxLnF1ZXJ5LmlzQnJvd3NlciA9PT0gJ3RydWUnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXJBZ2VudCA9IHJlcS5oZWFkZXJzWyd1c2VyLWFnZW50J107XG4gICAgcmV0dXJuICEhcmVxLmhlYWRlcnNbJ3NlYy1jaC11YSddXG4gICAgICAgIHx8IHJlcS5oZWFkZXJzWydhY2NlcHQnXT8uaW5jbHVkZXMoJ3RleHQvaHRtbCcpID09PSB0cnVlXG4gICAgICAgIHx8ICh0eXBlb2YgdXNlckFnZW50ID09PSAnc3RyaW5nJyAmJiB1c2VyQWdlbnQuaW5jbHVkZXMoJ01vemlsbGEvJykgJiYgIXVzZXJBZ2VudC5pbmNsdWRlcygnbm9kZS5qcy8nKSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZVBhdGhQYXJhbSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGdldDogW1xuICAgICAgICB7XG4gICAgICAgICAgICB1cmw6ICcvZW5naW5lL3JlYWQtZmlsZS1zeW5jJyxcbiAgICAgICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVQYXRoID0gcmVxLnF1ZXJ5LnBhdGggYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKCdQYXRoIGlzIHJlcXVpcmVkJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTm9ybWFsaXplIHBhdGggdG8gZml4IG1peGVkIHNsYXNoZXMgb24gV2luZG93c1xuICAgICAgICAgICAgICAgIGZpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUoZmlsZVBhdGgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgZnNlLnBhdGhFeGlzdHMoZmlsZVBhdGgpKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBGYWxsYmFjayBmb3IgLndhc20ud2FzbSAtPiAud2FzbSBpZiB0aGUgZG91YmxlIGV4dGVuc2lvbiBmaWxlIGlzIG1pc3NpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKCcud2FzbS53YXNtJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrUGF0aCA9IGZpbGVQYXRoLnNsaWNlKDAsIC01KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhd2FpdCBmc2UucGF0aEV4aXN0cyhmYWxsYmFja1BhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGggPSBmYWxsYmFja1BhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYXdhaXQgZnNlLnBhdGhFeGlzdHMoZmlsZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmc2UucmVhZEZpbGUoZmlsZVBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZChjb250ZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnRmlsZSBub3QgZm91bmQ6ICcgKyBmaWxlUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBUT0RPIOi/memHjOWQjue7remcgOimgeaUueW8leaTjiB3YXNtL3dhc20tbm9kZWpzLnRzIOeahOWGmeazle+8jOaUueaIkOWQkeacjeWKoeWZqOivt+axguaVsOaNrlxuICAgICAgICAgICAgdXJsOiAnL2VuZ2luZS9xdWVyeS1lbmdpbmUtaW5mbycsXG4gICAgICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2VuZ2luZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuZ2luZUluZm8gPSBFbmdpbmUuZ2V0SW5mbygpO1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKGVuZ2luZUluZm8pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgLy8gVE9ETyDov5nph4zlkI7nu63pnIDopoHmlLnlvJXmk44gd2FzbS93YXNtLW5vZGVqcy50cyDnmoTlhpnms5XvvIzmlLnmiJDlkJHmnI3liqHlmajor7fmsYLmlbDmja5cbiAgICAgICAgICAgIHVybDogJy9lbmdpbmVfZXh0ZXJuYWwvJyxcbiAgICAgICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gcmVxLnF1ZXJ5LnVybDtcbiAgICAgICAgICAgICAgICBjb25zdCBleHRlcm5hbFByb3RvY29sID0gJ2V4dGVybmFsOic7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnICYmIHVybC5zdGFydHNXaXRoKGV4dGVybmFsUHJvdG9jb2wpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgRW5naW5lIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2VuZ2luZScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYXRpdmVFbmdpbmVQYXRoID0gRW5naW5lLmdldEluZm8oKS5uYXRpdmUucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXh0ZXJuYWxGaWxlUGF0aCA9IHVybC5yZXBsYWNlKGV4dGVybmFsUHJvdG9jb2wsIHBhdGguam9pbihuYXRpdmVFbmdpbmVQYXRoLCAnZXh0ZXJuYWwvJykpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcnJheUJ1ZmZlciA9IGF3YWl0IGZzZS5yZWFkRmlsZShleHRlcm5hbEZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQoYXJyYXlCdWZmZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKGDor7fmsYIgZXh0ZXJuYWwg6LWE5rqQ5aSx6LSl77yM6K+35L2/55SoIGV4dGVybmFsIOWNj+iurjogJHtyZXEudXJsfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHVybDogL15cXC9xdWVyeS1leHRuYW1lXFwvKC4rKSQvLFxuICAgICAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gZGVjb2RlUGF0aFBhcmFtKHJlcS5wYXJhbXNbMF0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoYXNzZXRJbmZvPy5saWJyYXJ5Py5bJy5iaW4nXSAmJiBPYmplY3Qua2V5cyhhc3NldEluZm8ubGlicmFyeSkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKCcuY2NvbmInKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZCgnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdXJsOiAvXlxcL3F1ZXJ5LWFzc2V0LWluZm9cXC8oLispJC8sXG4gICAgICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBkZWNvZGVQYXRoUGFyYW0ocmVxLnBhcmFtc1swXSk7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBhc3NldE1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vYXNzZXRzJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXNzZXRNYW5hZ2VyLnF1ZXJ5QXNzZXRJbmZvKHV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oYXNzZXRJbmZvKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQXNzZXQgbm90IGZvdW5kJywgdXVpZCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB1cmw6ICcvcXVlcnktYXNzZXQtaW5mb3MvOmNjdHlwZScsXG4gICAgICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNjVHlwZSA9IHJlcS5wYXJhbXMuY2N0eXBlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mb3MgPSBhc3NldE1hbmFnZXIucXVlcnlBc3NldEluZm9zKHsgY2NUeXBlIH0pO1xuICAgICAgICAgICAgICAgIGlmIChhc3NldEluZm9zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKGFzc2V0SW5mb3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdBc3NldCBub3QgZm91bmQnLCBjY1R5cGUgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgLy8gUHJldmlldyBpbiBFZGl0b3LvvJror7vlm57jgIzlvZPliY3nvJbovpHlnLrmma/jgI3lv6vnhafjgIJcbiAgICAgICAgICAgIC8vIOW/hemhu+azqOWGjOWcqOS4i+mdoueahOmAmueUqOi1hOa6kOi3r+eUsSBgLzpkaXIvOnV1aWQuOmV4dGAg5LmL5YmN77yM5ZCm5YiZ5Lya6KKr5YW25o2V6I63XG4gICAgICAgICAgICAvLyDvvIhkaXI9c2NlbmUsIHV1aWQ9Y3VycmVudCwgZXh0PWpzb27vvInvvIzotbAgYXNzZXQtZGIg5p+l6K+i6ICMIDQwNOOAglxuICAgICAgICAgICAgdXJsOiAnL3NjZW5lL2N1cnJlbnQuanNvbicsXG4gICAgICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2NlbmVDYWNoZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnbm8gY3VycmVudCBzY2VuZSBjYWNoZWQnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBpZnJhbWUgcmVsb2FkIOaXtuW/hemhu+WunuaXtuivu+WbnuacgOaWsOW/q+eFp++8jOemgeatoue8k+WtmOOAglxuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NhY2hlLUNvbnRyb2wnLCAnbm8tc3RvcmUnKTtcbiAgICAgICAgICAgICAgICAvLyDnvJPlrZjnmoTmmK8gc2VyaWFsaXplIOi+k+WHuueahCBKU09OIOWtl+espuS4su+8jOebtOaOpeS7pSBhcHBsaWNhdGlvbi9qc29uIOWOn+agt+WPkeWHuu+8jFxuICAgICAgICAgICAgICAgIC8vIGdhbWUtYm9vdCDkvqcgZmV0Y2gg5ZCOIC5qc29uKCkg6Kej5p6Q77yI5LiOIC9zY2VuZS97dXVpZH0uanNvbiDkuIDoh7TvvInjgIJcbiAgICAgICAgICAgICAgICByZXMudHlwZSgnYXBwbGljYXRpb24vanNvbicpLnNlbmQoY3VycmVudFNjZW5lQ2FjaGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgLy8gU2VydmUgbGlicmFyeSBhc3NldHMgYnkgVVVJRCAtIHRyeSBhc3NldCBkYXRhYmFzZSBmaXJzdCxcbiAgICAgICAgICAgIC8vIHRoZW4gZmFsbCBiYWNrIHRvIGxpYnJhcnkgZGlyZWN0b3JpZXMgb24gZGlza1xuICAgICAgICAgICAgdXJsOiAnLzpkaXIvOnV1aWQvOm5hdGl2ZU5hbWUuOmV4dCcsXG4gICAgICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlcS5wYXJhbXMuZGlyID09PSAnYnVpbGQnIHx8IHJlcS5wYXJhbXMuZGlyID09PSAnbWNwJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB7IGRpciwgdXVpZCwgZXh0LCBuYXRpdmVOYW1lIH0gPSByZXEucGFyYW1zO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICBsZXQgZmlsZVBhdGggPSBhc3NldEluZm8/LmxpYnJhcnk/LltgJHtuYXRpdmVOYW1lfS4ke2V4dH1gXTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFzc2V0LWRiIOacquWRveS4re+8muWbnumAgOWIsCBsaWJyYXJ5IOejgeebmOebruW9le+8iOingSByZXNvbHZlRnJvbUxpYnJhcnkg5rOo6YeK77yJXG4gICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoID0gYXdhaXQgcmVzb2x2ZUZyb21MaWJyYXJ5KGAke2Rpcn0vJHt1dWlkfS8ke25hdGl2ZU5hbWV9LiR7ZXh0fWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgQXNzZXQgbm90IGZvdW5kOiAke3JlcS51cmx9YCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ0Fzc2V0IG5vdCBmb3VuZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0ZWQ6IHJlcS51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogYCR7bmF0aXZlTmFtZX0uJHtleHR9YFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Jyb3dzZXIgPSBpc0Jyb3dzZXJSZXF1ZXN0KHJlcSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmc2UucmVhZEZpbGUoZmlsZVBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHRuYW1lID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWltZU1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgXG4gICAgICAgICAgICAgICAgICAgICAgICAnLmpzb24nOiAnYXBwbGljYXRpb24vanNvbicsIFxuICAgICAgICAgICAgICAgICAgICAgICAgJy5iaW4nOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAnLmNjb25iJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXG4gICAgICAgICAgICAgICAgICAgICAgICAnLndhc20nOiAnYXBwbGljYXRpb24vd2FzbScsXG4gICAgICAgICAgICAgICAgICAgICAgICAnLnBuZyc6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJy5qcGcnOiAnaW1hZ2UvanBlZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAnLmpwZWcnOiAnaW1hZ2UvanBlZydcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgbWltZU1hcFtleHRuYW1lXSB8fCAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuc2VuZChjb250ZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuc2VuZChmaWxlUGF0aCB8fCByZXEudXJsKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHVybDogJy86ZGlyLzp1dWlkLjpleHQnLFxuICAgICAgICAgICAgYXN5bmMgaGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGRpciwgdXVpZCwgZXh0IH0gPSByZXEucGFyYW1zO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGFzc2V0TWFuYWdlci5xdWVyeUFzc2V0SW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICBsZXQgZmlsZVBhdGggPSBhc3NldEluZm8/LmxpYnJhcnk/LltgLiR7ZXh0fWBdO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzZXQtZGIg5pyq5ZG95Lit77ya5Zue6YCA5YiwIGxpYnJhcnkg56OB55uY55uu5b2V77yI6KeBIHJlc29sdmVGcm9tTGlicmFyeSDms6jph4rvvInjgIJcbiAgICAgICAgICAgICAgICAgICAgLy8g5L+u5aSN5YaF572uIGVmZmVjdO+8iHBpcGVsaW5lL2NsdXN0ZXItYnVpbGQg562J77yJ57uPIGAke3NlcnZlclVSTH0vNDUvPHV1aWQ+Lmpzb25gXG4gICAgICAgICAgICAgICAgICAgIC8vIOaLieWPluaXtueahCA0MDTvvIzov5vogIzkv67lpI3muLLmn5PnrqHnur/kuLogbnVsbCDlvJXlj5HnmoQgcGlwZWxpbmVTY2VuZURhdGEg5oql6ZSZ44CCXG4gICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoID0gYXdhaXQgcmVzb2x2ZUZyb21MaWJyYXJ5KGAke2Rpcn0vJHt1dWlkfS4ke2V4dH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEFzc2V0IG5vdCBmb3VuZDogJHtyZXEudXJsfWApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdBc3NldCBub3QgZm91bmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdGVkOiByZXEudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgaXNCcm93c2VyID0gaXNCcm93c2VyUmVxdWVzdChyZXEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzQnJvd3Nlcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZnNlLnJlYWRGaWxlKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXh0bmFtZSA9IHBhdGguZXh0bmFtZShmaWxlUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1pbWVNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgJy5qc29uJzogJ2FwcGxpY2F0aW9uL2pzb24nLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICcuYmluJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsIFxuICAgICAgICAgICAgICAgICAgICAgICAgJy5jY29uYic6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgJy53YXNtJzogJ2FwcGxpY2F0aW9uL3dhc20nLFxuICAgICAgICAgICAgICAgICAgICAgICAgJy5wbmcnOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICcuanBnJzogJ2ltYWdlL2pwZWcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJy5qcGVnJzogJ2ltYWdlL2pwZWcnXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIG1pbWVNYXBbZXh0bmFtZV0gfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLnNlbmQoY29udGVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQoZmlsZVBhdGggfHwgcmVxLnVybCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgXSxcbiAgICBwb3N0OiBbXG4gICAgICAgIC4uLmNyZWF0ZUFzc2V0QmluYXJ5Um91dGVzKCksXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIFByZXZpZXcgaW4gRWRpdG9y77ya5YaZ5YWl44CM5b2T5YmN57yW6L6R5Zy65pmv44CN5b+r54Wn44CCXG4gICAgICAgICAgICAvLyDnuqblrpogYm9keSDkuLogeyBkYXRhOiA8c2VyaWFsaXplIOi+k+WHuueahCBKU09OIOWtl+espuS4sj4gfe+8mnNlcmlhbGl6ZSDkuqTku5jnmoTmmK/lrZfnrKbkuLLvvIxcbiAgICAgICAgICAgIC8vIOiLpeWuouaIt+err+ebtOaOpeaKiumhtuWxguWtl+espuS4suS9nOS4uiBKU09OIOWPkemAge+8jOS8muiiqyBleHByZXNzLmpzb24g55qEIHN0cmljdCDmqKHlvI/vvIjpu5jorqTvvIlcbiAgICAgICAgICAgIC8vIOS7pSA0MDAg5ouS57ud77yM5pWF55So5a+56LGh5YyF6KO544CCXG4gICAgICAgICAgICB1cmw6ICcvc2NlbmUvY3VycmVudCcsXG4gICAgICAgICAgICBhc3luYyBoYW5kbGVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSByZXEuYm9keT8uZGF0YTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnYm9keS5kYXRhIChzZXJpYWxpemVkIHNjZW5lIHN0cmluZykgaXMgcmVxdWlyZWQnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXJyZW50U2NlbmVDYWNoZSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oeyBvazogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHVybDogJy9ycGMvOm1vZHVsZS86bWV0aG9kJyxcbiAgICAgICAgICAgIGFzeW5jIGhhbmRsZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBtb2R1bGUsIG1ldGhvZCB9ID0gcmVxLnBhcmFtcztcbiAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gcmVxLmJvZHk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBScGMgfSA9IGF3YWl0IGltcG9ydCgnLi9tYWluLXByb2Nlc3MvcnBjJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFJwYy5nZXRJbnN0YW5jZSgpLmV4ZWN1dGVMb2NhbChtb2R1bGUgYXMgYW55LCBtZXRob2QgYXMgYW55LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtTY2VuZSBXZWIgUlBDXSAke21vZHVsZX0uJHttZXRob2R9IC0+YCwgdHlwZW9mIHJlc3VsdCA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IChyZXN1bHQgPT09IG51bGwgPyAnbnVsbCcgOiB0eXBlb2YgcmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgdHlwZTogJ3Jlc3BvbnNlJywgcmVzdWx0IH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbU2NlbmVdIFJQQyBFcnJvciAoJHttb2R1bGV9LiR7bWV0aG9kfSk6YCwgZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgdHlwZTogJ3Jlc3BvbnNlJywgZXJyb3I6IGU/Lm1lc3NhZ2UgfHwgU3RyaW5nKGUpIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIF0sXG4gICAgc3RhdGljRmlsZXM6IFtdLFxuICAgIHNvY2tldDoge1xuICAgICAgICBjb25uZWN0aW9uOiAoc29ja2V0OiBhbnkpID0+IHsgfSxcbiAgICAgICAgZGlzY29ubmVjdDogKHNvY2tldDogYW55KSA9PiB7IH1cbiAgICB9LFxufSBhcyBJTWlkZGxld2FyZUNvbnRyaWJ1dGlvbjtcbiJdfQ==