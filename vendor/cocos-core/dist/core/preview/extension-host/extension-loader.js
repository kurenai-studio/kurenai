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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLWxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL3ByZXZpZXcvZXh0ZW5zaW9uLWhvc3QvZXh0ZW5zaW9uLWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQThDQSw4Q0FpQkM7QUFNRCxrREFhQztBQS9FRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLGtCQUFrQixDQUFJLEVBQVc7SUFDdEMsTUFBTSxDQUFDLEdBQUcsVUFBaUIsQ0FBQztJQUM1QixNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsSUFBSSxDQUFDLENBQUM7SUFDckMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQztJQUNsQyxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUM7SUFDdkMsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO0lBQzVCLElBQUksQ0FBQztRQUNELElBQUksQ0FBQztZQUFDLENBQUMsQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO1FBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNqQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFFLENBQUM7WUFDcEgsZUFBZSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBQ0QsNERBQTREO1FBQzVELCtDQUErQztRQUMvQyxJQUFJLENBQUM7WUFDRCxDQUFDLENBQUMsV0FBVyxHQUFHLFNBQVMsa0JBQWtCLENBQUMsT0FBWSxFQUFFLEdBQUcsSUFBVztnQkFDcEUsSUFBSSxPQUFPLE9BQU8sS0FBSyxV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LENBQUMsR0FBRyxDQUFDO1FBQ3hGLE9BQU8sRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2hELENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyw4Q0FBOEMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzlFLE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJldmlld0V4dGVuc2lvbiB9IGZyb20gJy4vc2Nhbm5lcic7XG5pbXBvcnQgeyBNZXNzYWdlQnVzIH0gZnJvbSAnLi9tZXNzYWdlLWJ1cyc7XG5cbi8qKlxuICog5ZyoIE5vZGUg546v5aKD6YeMIHJlcXVpcmUg5omp5bGVIGJ1bmRsZSDml7bvvIzkuLTml7blsY/olL1cIua1j+iniOWZqOeOr+Wig1wi5qCH6K6w44CCXG4gKiDlvJXmk47nmoQgTm9kZSDov5DooYzml7bkvJrms6jlhaUgd2luZG93L2RvY3VtZW50L1hNTEh0dHBSZXF1ZXN0IOetieWFqOWxgO+8jOWvvOiHtOaJqeWxleaJk+i/m+WOu+eahOW6k1xuICog77yI5aaCIGF4aW9z77yJ5Zyo5qih5Z2X5rGC5YC85pyf6K+v5Yik5Li65rWP6KeI5Zmo44CB6YCJ55SoIFhIUiDpgILphY3lmajlubborr/pl64gd2luZG93LmxvY2F0aW9uLmhyZWYg6ICM5bSp5rqD44CCXG4gKiByZXF1aXJlIOaYr+WQjOatpeeahO+8jOi/memHjOWcqCByZXF1aXJlIOacn+mXtOaKiiBYTUxIdHRwUmVxdWVzdCDnva7kuLogdW5kZWZpbmVk77yIdHlwZW9mIOWNs+S4uiAndW5kZWZpbmVkJ++8jFxuICogYXhpb3Mg6L2s6ICM6YCJ55SoIE5vZGUgaHR0cCDpgILphY3lmajvvInvvIzlubbnu5kgd2luZG93LmxvY2F0aW9uIOWFnOW6le+8jHJlcXVpcmUg57uT5p2f5ZCO56uL5Y2z6L+Y5Y6f44CCXG4gKi9cbmZ1bmN0aW9uIHdpdGhOb2RlUmVxdWlyZUVudjxUPihmbjogKCkgPT4gVCk6IFQge1xuICAgIGNvbnN0IGcgPSBnbG9iYWxUaGlzIGFzIGFueTtcbiAgICBjb25zdCBoYWRYSFIgPSAnWE1MSHR0cFJlcXVlc3QnIGluIGc7XG4gICAgY29uc3Qgc2F2ZWRYSFIgPSBnLlhNTEh0dHBSZXF1ZXN0O1xuICAgIGNvbnN0IHNhdmVkU2V0SW50ZXJ2YWwgPSBnLnNldEludGVydmFsO1xuICAgIGxldCBwYXRjaGVkTG9jYXRpb24gPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICB0cnkgeyBnLlhNTEh0dHBSZXF1ZXN0ID0gdW5kZWZpbmVkOyB9IGNhdGNoIHsgLyogbm9uLXdyaXRhYmxlLCBpZ25vcmUgKi8gfVxuICAgICAgICBpZiAoZy53aW5kb3cgJiYgIWcud2luZG93LmxvY2F0aW9uKSB7XG4gICAgICAgICAgICBnLndpbmRvdy5sb2NhdGlvbiA9IHsgaHJlZjogJ2h0dHA6Ly9sb2NhbGhvc3QvJywgcHJvdG9jb2w6ICdodHRwOicsIGhvc3Q6ICdsb2NhbGhvc3QnLCBvcmlnaW46ICdodHRwOi8vbG9jYWxob3N0JyB9O1xuICAgICAgICAgICAgcGF0Y2hlZExvY2F0aW9uID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyDlsY/olL3mianlsZUgZGV2IOaehOW7uumHjCB3ZWJwYWNrIEhNUiDnmoQgMXMg6L2u6K+i5a6a5pe25Zmo77yI5ZG95ZCN5Ye95pWwIGNoZWNrRm9yVXBkYXRl77yJ44CCXG4gICAgICAgIC8vIOeUn+S6p+aehOW7uuaXoCBITVIg4oCU4oCUIENyZWF0b3Ig5Yqg6L2955qE5bCx5piv55Sf5Lqn5YyF77yM5omA5Lul6L+Z5piv5LiO5LmL5a+56b2Q44CB6ICM6Z2e5YGP56a744CCXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBnLnNldEludGVydmFsID0gZnVuY3Rpb24gcGF0Y2hlZFNldEludGVydmFsKGhhbmRsZXI6IGFueSwgLi4ucmVzdDogYW55W10pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicgJiYgaGFuZGxlci5uYW1lID09PSAnY2hlY2tGb3JVcGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwIGFzIGFueTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNhdmVkU2V0SW50ZXJ2YWwuY2FsbChnLCBoYW5kbGVyLCAuLi5yZXN0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxuICAgICAgICByZXR1cm4gZm4oKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGhhZFhIUikgeyBnLlhNTEh0dHBSZXF1ZXN0ID0gc2F2ZWRYSFI7IH0gZWxzZSB7IGRlbGV0ZSBnLlhNTEh0dHBSZXF1ZXN0OyB9XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxuICAgICAgICB0cnkgeyBnLnNldEludGVydmFsID0gc2F2ZWRTZXRJbnRlcnZhbDsgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XG4gICAgICAgIGlmIChwYXRjaGVkTG9jYXRpb24pIHsgdHJ5IHsgZGVsZXRlIGcud2luZG93LmxvY2F0aW9uOyB9IGNhdGNoIHsgLyogaWdub3JlICovIH0gfVxuICAgIH1cbn1cblxuLyoqXG4gKiDliqDovb3mianlsZXkuLvov5vnqIvlhaXlj6PvvIhVTUQvQ29tbW9uSlPvvInvvIzmiafooYzlhbYgbG9hZCgpIOWIneWni+WMlu+8jOW5tuaKiuWug+eZu+iusOWIsOa2iOaBr+aAu+e6v+OAglxuICog5b+F6aG75ZyoIGluc3RhbGxFZGl0b3JTaGltIOS5i+WQjuiwg+eUqO+8iOaJqeWxleaooeWdl+axguWAvOacn+S8muiuv+mXriBnbG9iYWwuRWRpdG9y77yJ44CCXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkRXh0ZW5zaW9uTWFpbihleHQ6IFByZXZpZXdFeHRlbnNpb24sIGJ1czogTWVzc2FnZUJ1cyk6IFByb21pc2U8YW55IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKCFleHQubWFpblBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbiAgICAgICAgY29uc3QgbW9kID0gd2l0aE5vZGVSZXF1aXJlRW52KCgpID0+IHJlcXVpcmUoZXh0Lm1haW5QYXRoIGFzIHN0cmluZykpO1xuICAgICAgICBjb25zdCBlbnRyeSA9IG1vZD8uZGVmYXVsdCAmJiAobW9kLmRlZmF1bHQubWV0aG9kcyB8fCBtb2QuZGVmYXVsdC5sb2FkKSA/IG1vZC5kZWZhdWx0IDogbW9kO1xuICAgICAgICBpZiAodHlwZW9mIGVudHJ5LmxvYWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGF3YWl0IGVudHJ5LmxvYWQoKTtcbiAgICAgICAgfVxuICAgICAgICBidXMucmVnaXN0ZXIoZXh0LCBlbnRyeSk7XG4gICAgICAgIHJldHVybiBlbnRyeTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbRXh0ZW5zaW9uSG9zdF0gZmFpbGVkIHRvIGxvYWQgbWFpbiBmb3IgJyR7ZXh0Lm5hbWV9JzpgLCBlcnIpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuLyoqXG4gKiDliqDovb3mianlsZXnmoQgc2VydmVyIOi0oeeMruWFpeWPo++8jOi/lOWbnuWFtuWvvOWHuueahCBnZXQvcG9zdCDot6/nlLHmlbDnu4TjgIJcbiAqIOmcgOWcqOaJgOacieaJqeWxleS4u+i/m+eoi+WKoOi9veWujOaIkOWQjuiwg+eUqO+8iHNlcnZlciDot6/nlLHlpITnkIblmajkvJrnu4/nlLEgRWRpdG9yLk1lc3NhZ2Ug5Zue6LCD5Li76L+b56iL77yJ44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRXh0ZW5zaW9uU2VydmVyKGV4dDogUHJldmlld0V4dGVuc2lvbik6IHsgZ2V0PzogYW55W107IHBvc3Q/OiBhbnlbXSB9IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIWV4dC5zZXJ2ZXJQYXRoKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdmFyLXJlcXVpcmVzXG4gICAgICAgIGNvbnN0IG1vZCA9IHdpdGhOb2RlUmVxdWlyZUVudigoKSA9PiByZXF1aXJlKGV4dC5zZXJ2ZXJQYXRoIGFzIHN0cmluZykpO1xuICAgICAgICBjb25zdCBlbnRyeSA9IG1vZD8uZGVmYXVsdCAmJiAobW9kLmRlZmF1bHQuZ2V0IHx8IG1vZC5kZWZhdWx0LnBvc3QpID8gbW9kLmRlZmF1bHQgOiBtb2Q7XG4gICAgICAgIHJldHVybiB7IGdldDogZW50cnkuZ2V0LCBwb3N0OiBlbnRyeS5wb3N0IH07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW0V4dGVuc2lvbkhvc3RdIGZhaWxlZCB0byBsb2FkIHNlcnZlciBmb3IgJyR7ZXh0Lm5hbWV9JzpgLCBlcnIpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cbiJdfQ==