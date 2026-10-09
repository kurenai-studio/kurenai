"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadExtensionMain = loadExtensionMain;
exports.loadExtensionServer = loadExtensionServer;
/**
 * 在 Node 环境里 require 扩展 bundle 时，临时屏蔽"浏览器环境"标记。
 * 引擎的 Node 运行时会注入 window/document/XMLHttpRequest 等全局，导致扩展打进去的库
 * （如 axios）在模块求值期误判为浏览器、选用 XHR 适配器并访问 window.location.href 而崩溃。
 * require 是同步的，这里在 require 期间把 XMLHttpRequest 置为 undefined（typeof 即为 'undefined'，
 * axios 转而选用 Node http 适配器），并给 window.location 兜底，require 结束后立即还原。
 */
function withNodeRequireEnv(fn) {
    const g = globalThis;
    const hadXHR = 'XMLHttpRequest' in g;
    const savedXHR = g.XMLHttpRequest;
    const savedSetInterval = g.setInterval;
    let patchedLocation = false;
    try {
        try {
            g.XMLHttpRequest = undefined;
        }
        catch { /* non-writable, ignore */ }
        if (g.window && !g.window.location) {
            g.window.location = { href: 'http://localhost/', protocol: 'http:', host: 'localhost', origin: 'http://localhost' };
            patchedLocation = true;
        }
        // 屏蔽扩展 dev 构建里 webpack HMR 的 1s 轮询定时器（命名函数 checkForUpdate）。
        // 生产构建无 HMR —— Creator 加载的就是生产包，所以这是与之对齐、而非偏离。
        try {
            g.setInterval = function patchedSetInterval(handler, ...rest) {
                if (typeof handler === 'function' && handler.name === 'checkForUpdate') {
                    return 0;
                }
                return savedSetInterval.call(g, handler, ...rest);
            };
        }
        catch { /* ignore */ }
        return fn();
    }
    finally {
        try {
            if (hadXHR) {
                g.XMLHttpRequest = savedXHR;
            }
            else {
                delete g.XMLHttpRequest;
            }
        }
        catch { /* ignore */ }
        try {
            g.setInterval = savedSetInterval;
        }
        catch { /* ignore */ }
        if (patchedLocation) {
            try {
                delete g.window.location;
            }
            catch { /* ignore */ }
        }
    }
}
/**
 * 加载扩展主进程入口（UMD/CommonJS），执行其 load() 初始化，并把它登记到消息总线。
 * 必须在 installEditorShim 之后调用（扩展模块求值期会访问 global.Editor）。
 */
async function loadExtensionMain(ext, bus) {
    if (!ext.mainPath) {
        return undefined;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = withNodeRequireEnv(() => require(ext.mainPath));
        const entry = mod?.default && (mod.default.methods || mod.default.load) ? mod.default : mod;
        if (typeof entry.load === 'function') {
            await entry.load();
        }
        bus.register(ext, entry);
        return entry;
    }
    catch (err) {
        console.warn(`[ExtensionHost] failed to load main for '${ext.name}':`, err);
        return undefined;
    }
}
/**
 * 加载扩展的 server 贡献入口，返回其导出的 get/post 路由数组。
 * 需在所有扩展主进程加载完成后调用（server 路由处理器会经由 Editor.Message 回调主进程）。
 */
function loadExtensionServer(ext) {
    if (!ext.serverPath) {
        return undefined;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = withNodeRequireEnv(() => require(ext.serverPath));
        const entry = mod?.default && (mod.default.get || mod.default.post) ? mod.default : mod;
        return { get: entry.get, post: entry.post };
    }
    catch (err) {
        console.warn(`[ExtensionHost] failed to load server for '${ext.name}':`, err);
        return undefined;
    }
}
