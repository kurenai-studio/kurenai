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
exports.loadExtensionPreviewHost = loadExtensionPreviewHost;
const scanner_1 = require("./scanner");
const message_bus_1 = require("./message-bus");
const profile_store_1 = require("./profile-store");
const editor_shim_1 = require("./editor-shim");
const extension_loader_1 = require("./extension-loader");
const server_registrar_1 = require("./server-registrar");
/**
 * 通用扩展预览宿主：在 CLI 预览服务器里加载并运行项目扩展自带的 backend 代码
 * （contributions.server 路由 + contributions.messages 处理函数），背后用 Node 侧
 * Editor.* 垫片支撑，对齐 Cocos Creator 编辑器托管扩展的行为。
 *
 * 必须在 register('GamePreview', ...) 之前调用，使扩展的具体路由先于
 * scriptingRoutes 里的宽泛正则注册、从而优先命中。
 */
async function loadExtensionPreviewHost(projectPath) {
    const exts = (0, scanner_1.scanPreviewExtensions)(projectPath);
    if (!exts.length) {
        return { extensions: [], dispose() { } };
    }
    const bus = new message_bus_1.MessageBus();
    const profileStore = new profile_store_1.ProfileStore(projectPath);
    // 先装垫片：扩展 bundle 在模块求值期就会访问 Editor.Project.path
    (0, editor_shim_1.installEditorShim)({ projectPath, bus, profileStore });
    // 1) 先加载所有扩展主进程（注册消息处理 + 各自 load 初始化）
    for (const ext of exts) {
        await (0, extension_loader_1.loadExtensionMain)(ext, bus);
    }
    // 2) 再加载 server 贡献（其路由处理器会经 Editor.Message 回调主进程）
    const routeSets = [];
    const loaded = [];
    for (const ext of exts) {
        const routes = (0, extension_loader_1.loadExtensionServer)(ext);
        if (routes && ((routes.get && routes.get.length) || (routes.post && routes.post.length))) {
            routeSets.push(routes);
            loaded.push(ext.name);
        }
    }
    if (routeSets.length) {
        try {
            const contribution = (0, server_registrar_1.buildMiddlewareContribution)(routeSets);
            const { middlewareService } = await Promise.resolve().then(() => __importStar(require('../../../server/middleware')));
            middlewareService.register('ExtensionPreview', contribution);
            console.log(`[ExtensionHost] registered preview routes from: ${loaded.join(', ')}`);
        }
        catch (err) {
            console.warn('[ExtensionHost] failed to register extension preview routes:', err);
        }
    }
    return {
        extensions: loaded,
        dispose() {
            // 对齐 Creator 的扩展生命周期：销毁时调用各扩展自身的 unload()
            for (const { name, mainModule } of bus.getRegisteredMains()) {
                try {
                    if (typeof mainModule?.unload === 'function') {
                        void mainModule.unload();
                    }
                }
                catch (err) {
                    console.warn(`[ExtensionHost] unload '${name}' failed:`, err);
                }
            }
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9wcmV2aWV3L2V4dGVuc2lvbi1ob3N0L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBLDREQXFEQztBQTFFRCx1Q0FBa0Q7QUFDbEQsK0NBQTJDO0FBQzNDLG1EQUErQztBQUMvQywrQ0FBa0Q7QUFDbEQseURBQTRFO0FBQzVFLHlEQUFpRTtBQVFqRTs7Ozs7OztHQU9HO0FBQ0ksS0FBSyxVQUFVLHdCQUF3QixDQUFDLFdBQW1CO0lBQzlELE1BQU0sSUFBSSxHQUFHLElBQUEsK0JBQXFCLEVBQUMsV0FBVyxDQUFDLENBQUM7SUFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLE9BQU8sRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLE9BQU8sS0FBaUIsQ0FBQyxFQUFFLENBQUM7SUFDekQsQ0FBQztJQUVELE1BQU0sR0FBRyxHQUFHLElBQUksd0JBQVUsRUFBRSxDQUFDO0lBQzdCLE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNuRCxnREFBZ0Q7SUFDaEQsSUFBQSwrQkFBaUIsRUFBQyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUV0RCxzQ0FBc0M7SUFDdEMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNyQixNQUFNLElBQUEsb0NBQWlCLEVBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxrREFBa0Q7SUFDbEQsTUFBTSxTQUFTLEdBQW9DLEVBQUUsQ0FBQztJQUN0RCxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7SUFDNUIsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFBLHNDQUFtQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksTUFBTSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3ZGLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsQ0FBQztJQUNMLENBQUM7SUFFRCxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUM7WUFDRCxNQUFNLFlBQVksR0FBRyxJQUFBLDhDQUEyQixFQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxHQUFHLHdEQUFhLDRCQUE0QixHQUFDLENBQUM7WUFDekUsaUJBQWlCLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsbURBQW1ELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyw4REFBOEQsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN0RixDQUFDO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDSCxVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPO1lBQ0gsMENBQTBDO1lBQzFDLEtBQUssTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxHQUFHLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDO2dCQUMxRCxJQUFJLENBQUM7b0JBQ0QsSUFBSSxPQUFPLFVBQVUsRUFBRSxNQUFNLEtBQUssVUFBVSxFQUFFLENBQUM7d0JBQzNDLEtBQUssVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUM3QixDQUFDO2dCQUNMLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDWCxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixJQUFJLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbEUsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO0tBQ0osQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzY2FuUHJldmlld0V4dGVuc2lvbnMgfSBmcm9tICcuL3NjYW5uZXInO1xuaW1wb3J0IHsgTWVzc2FnZUJ1cyB9IGZyb20gJy4vbWVzc2FnZS1idXMnO1xuaW1wb3J0IHsgUHJvZmlsZVN0b3JlIH0gZnJvbSAnLi9wcm9maWxlLXN0b3JlJztcbmltcG9ydCB7IGluc3RhbGxFZGl0b3JTaGltIH0gZnJvbSAnLi9lZGl0b3Itc2hpbSc7XG5pbXBvcnQgeyBsb2FkRXh0ZW5zaW9uTWFpbiwgbG9hZEV4dGVuc2lvblNlcnZlciB9IGZyb20gJy4vZXh0ZW5zaW9uLWxvYWRlcic7XG5pbXBvcnQgeyBidWlsZE1pZGRsZXdhcmVDb250cmlidXRpb24gfSBmcm9tICcuL3NlcnZlci1yZWdpc3RyYXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVuc2lvblByZXZpZXdIb3N0IHtcbiAgICAvKiog5bey5oiQ5Yqf5Yqg6L2977yI5o+Q5L6bIHNlcnZlciDot6/nlLHvvInnmoTmianlsZXlkI0gKi9cbiAgICBleHRlbnNpb25zOiBzdHJpbmdbXTtcbiAgICBkaXNwb3NlKCk6IHZvaWQ7XG59XG5cbi8qKlxuICog6YCa55So5omp5bGV6aKE6KeI5a6/5Li777ya5ZyoIENMSSDpooTop4jmnI3liqHlmajph4zliqDovb3lubbov5DooYzpobnnm67mianlsZXoh6rluKbnmoQgYmFja2VuZCDku6PnoIFcbiAqIO+8iGNvbnRyaWJ1dGlvbnMuc2VydmVyIOi3r+eUsSArIGNvbnRyaWJ1dGlvbnMubWVzc2FnZXMg5aSE55CG5Ye95pWw77yJ77yM6IOM5ZCO55SoIE5vZGUg5L6nXG4gKiBFZGl0b3IuKiDlnqvniYfmlK/mkpHvvIzlr7npvZAgQ29jb3MgQ3JlYXRvciDnvJbovpHlmajmiZjnrqHmianlsZXnmoTooYzkuLrjgIJcbiAqXG4gKiDlv4XpobvlnKggcmVnaXN0ZXIoJ0dhbWVQcmV2aWV3JywgLi4uKSDkuYvliY3osIPnlKjvvIzkvb/mianlsZXnmoTlhbfkvZPot6/nlLHlhYjkuo5cbiAqIHNjcmlwdGluZ1JvdXRlcyDph4znmoTlrr3ms5vmraPliJnms6jlhozjgIHku47ogIzkvJjlhYjlkb3kuK3jgIJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRFeHRlbnNpb25QcmV2aWV3SG9zdChwcm9qZWN0UGF0aDogc3RyaW5nKTogUHJvbWlzZTxFeHRlbnNpb25QcmV2aWV3SG9zdD4ge1xuICAgIGNvbnN0IGV4dHMgPSBzY2FuUHJldmlld0V4dGVuc2lvbnMocHJvamVjdFBhdGgpO1xuICAgIGlmICghZXh0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHsgZXh0ZW5zaW9uczogW10sIGRpc3Bvc2UoKSB7IC8qIG5vLW9wICovIH0gfTtcbiAgICB9XG5cbiAgICBjb25zdCBidXMgPSBuZXcgTWVzc2FnZUJ1cygpO1xuICAgIGNvbnN0IHByb2ZpbGVTdG9yZSA9IG5ldyBQcm9maWxlU3RvcmUocHJvamVjdFBhdGgpO1xuICAgIC8vIOWFiOijheWeq+eJh++8muaJqeWxlSBidW5kbGUg5Zyo5qih5Z2X5rGC5YC85pyf5bCx5Lya6K6/6ZeuIEVkaXRvci5Qcm9qZWN0LnBhdGhcbiAgICBpbnN0YWxsRWRpdG9yU2hpbSh7IHByb2plY3RQYXRoLCBidXMsIHByb2ZpbGVTdG9yZSB9KTtcblxuICAgIC8vIDEpIOWFiOWKoOi9veaJgOacieaJqeWxleS4u+i/m+eoi++8iOazqOWGjOa2iOaBr+WkhOeQhiArIOWQhOiHqiBsb2FkIOWIneWni+WMlu+8iVxuICAgIGZvciAoY29uc3QgZXh0IG9mIGV4dHMpIHtcbiAgICAgICAgYXdhaXQgbG9hZEV4dGVuc2lvbk1haW4oZXh0LCBidXMpO1xuICAgIH1cblxuICAgIC8vIDIpIOWGjeWKoOi9vSBzZXJ2ZXIg6LSh54yu77yI5YW26Lev55Sx5aSE55CG5Zmo5Lya57uPIEVkaXRvci5NZXNzYWdlIOWbnuiwg+S4u+i/m+eoi++8iVxuICAgIGNvbnN0IHJvdXRlU2V0czogeyBnZXQ/OiBhbnlbXTsgcG9zdD86IGFueVtdIH1bXSA9IFtdO1xuICAgIGNvbnN0IGxvYWRlZDogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGV4dCBvZiBleHRzKSB7XG4gICAgICAgIGNvbnN0IHJvdXRlcyA9IGxvYWRFeHRlbnNpb25TZXJ2ZXIoZXh0KTtcbiAgICAgICAgaWYgKHJvdXRlcyAmJiAoKHJvdXRlcy5nZXQgJiYgcm91dGVzLmdldC5sZW5ndGgpIHx8IChyb3V0ZXMucG9zdCAmJiByb3V0ZXMucG9zdC5sZW5ndGgpKSkge1xuICAgICAgICAgICAgcm91dGVTZXRzLnB1c2gocm91dGVzKTtcbiAgICAgICAgICAgIGxvYWRlZC5wdXNoKGV4dC5uYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyb3V0ZVNldHMubGVuZ3RoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb250cmlidXRpb24gPSBidWlsZE1pZGRsZXdhcmVDb250cmlidXRpb24ocm91dGVTZXRzKTtcbiAgICAgICAgICAgIGNvbnN0IHsgbWlkZGxld2FyZVNlcnZpY2UgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vLi4vc2VydmVyL21pZGRsZXdhcmUnKTtcbiAgICAgICAgICAgIG1pZGRsZXdhcmVTZXJ2aWNlLnJlZ2lzdGVyKCdFeHRlbnNpb25QcmV2aWV3JywgY29udHJpYnV0aW9uKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbRXh0ZW5zaW9uSG9zdF0gcmVnaXN0ZXJlZCBwcmV2aWV3IHJvdXRlcyBmcm9tOiAke2xvYWRlZC5qb2luKCcsICcpfWApO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW0V4dGVuc2lvbkhvc3RdIGZhaWxlZCB0byByZWdpc3RlciBleHRlbnNpb24gcHJldmlldyByb3V0ZXM6JywgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGV4dGVuc2lvbnM6IGxvYWRlZCxcbiAgICAgICAgZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIC8vIOWvuem9kCBDcmVhdG9yIOeahOaJqeWxleeUn+WRveWRqOacn++8mumUgOavgeaXtuiwg+eUqOWQhOaJqeWxleiHqui6q+eahCB1bmxvYWQoKVxuICAgICAgICAgICAgZm9yIChjb25zdCB7IG5hbWUsIG1haW5Nb2R1bGUgfSBvZiBidXMuZ2V0UmVnaXN0ZXJlZE1haW5zKCkpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1haW5Nb2R1bGU/LnVubG9hZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm9pZCBtYWluTW9kdWxlLnVubG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0V4dGVuc2lvbkhvc3RdIHVubG9hZCAnJHtuYW1lfScgZmFpbGVkOmAsIGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG59XG4iXX0=