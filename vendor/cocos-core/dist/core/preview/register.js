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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9wcmV2aWV3L3JlZ2lzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBLHdEQXVCQztBQVNELHNEQWNDO0FBcEVELHdEQUE0RDtBQUU1RDs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRztBQUNILElBQUksYUFBOEMsQ0FBQztBQUNuRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFFaEIsS0FBSyxVQUFVLHNCQUFzQixDQUFDLFdBQW1CO0lBQzVELElBQUksVUFBVSxFQUFFLENBQUM7UUFDYixPQUFPO0lBQ1gsQ0FBQztJQUNELFVBQVUsR0FBRyxJQUFJLENBQUM7SUFFbEIsMERBQTBEO0lBQzFELHlEQUF5RDtJQUN6RCwwQkFBMEI7SUFDMUIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxFQUFFLHdCQUF3QixFQUFFLEdBQUcsd0RBQWEsa0JBQWtCLEdBQUMsQ0FBQztRQUN0RSxhQUFhLEdBQUcsTUFBTSx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELFdBQVc7SUFDWCxNQUFNLEVBQUUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLEdBQUcsd0RBQWEsMkJBQTJCLEdBQUMsQ0FBQztJQUNyRiw4QkFBaUIsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLHFCQUFxQixDQUFDLENBQUM7SUFFakUsNkNBQTZDO0lBQzdDLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxHQUFHLHdEQUFhLGVBQWUsR0FBQyxDQUFDO0lBQzdELE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztBQUMvQixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0ksS0FBSyxVQUFVLHFCQUFxQjtJQUN2QyxJQUFJLENBQUM7UUFDRCxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyx3REFBYSxlQUFlLEdBQUMsQ0FBQztRQUMvRCxvQkFBb0IsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBQ0QsSUFBSSxDQUFDO1FBQ0QsYUFBYSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBQ0QsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUMxQixVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3ZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBtaWRkbGV3YXJlU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZlci9taWRkbGV3YXJlJztcblxuLyoqXG4gKiDmtY/op4jlmajmuLjmiI/pooTop4jnmoTnu5/kuIDms6jlhozlhaXlj6PjgIJcbiAqXG4gKiDlkIQgSURFIC8g6ZuG5oiQ5pa56YO96YCa6L+HIGNsaSDnmoQgYHN0YXJ0dXBg77yI4oaSIGBzdGFydHVwU2NlbmVgIOKGkiBzY2VuZSBgaW5pdGDvvInmiJbni6znq4vnmoTmuLjmiI/pooTop4hcbiAqIOWFpeWPo+i1sOWIsOi/memHjO+8jOmbhuS4reS4gOWkhOS/neivgea1j+iniOWZqOmihOiniOihjOS4uuS4gOiHtO+8jOmBv+WFjeWQhOiwg+eUqOaWueWQhOiHquaLvOijheazqOWGjOa1geeoi+OAglxuICpcbiAqIOazqOWGjOmhuuW6j+aVj+aEn++8mkdhbWVQcmV2aWV3IOeahCBgL2Ag5Y+K6LWE5rqQ6Lev55Sx77yIc2V0dGluZ3MgLyBhc3NldHMgLyBidW5kbGUgLyBzY2VuZSBqc29u77yJ5b+F6aG7XG4gKiDlnKjlnLrmma/kuK3pl7Tku7bnmoTlrr3ms5vot6/nlLHvvIhgLzpkaXIvOnV1aWQuOmV4dGAg562J77yJ5LmL5YmN5rOo5YaM77yM5ZCm5YiZIGAvcHJldmlldy9zZXR0aW5ncy5qc2DjgIFcbiAqIGAvYXNzZXRzLzxidW5kbGU+L2NvbmZpZy5qc29uYCDnrYnkvJrooqvlnLrmma/ot6/nlLHlkJ7miJAgNDA044CC5Zug5q2k5ZyoIHNjZW5lIGBpbml0KClgIOmHjOmcgOimgeWFiOiwg+eUqFxuICog5pys5Ye95pWw77yM5YaN5rOo5YaMIFNjZW5lU2NyaXB0aW5nIC8gU2NlbmXvvJvnuq/mtY/op4jlmajmuLjmiI/pooTop4jvvIjml6DlnLrmma/nvJbovpHlmajvvInliJnnm7TmjqXosIPnlKjmnKzlh73mlbDjgIJcbiAqIOi/meS6myBoYW5kbGVyIOWcqOmdnua4uOaIj+mihOiniOi1hOa6kOaXtuS8miBgbmV4dCgpYCDmlL7ooYzvvIzkuI3lvbHlk43lnLrmma/nvJbovpHlmajoh6rouqvor7fmsYLjgIJcbiAqXG4gKiDliY3nva7mnaHku7bvvJrosIPnlKjliY3pnIDlt7LlrozmiJAgYHN0YXJ0U2VydmVyYO+8iOacrOWHveaVsOWPquazqOWGjOi3r+eUsS/nm5HlkKzvvIzkuI3nlJ/miJAgc2V0dGluZ3PvvInjgIJcbiAqICoq5LiN6KaB5rGCKiogYnVpbGRlciDlt7LliJ3lp4vljJbvvJpgL2Ag5Y+q5riy5p+TIGdhbWUuZWpz77yI5LuF6ZyAIHNjcmlwdGluZy5wcm9qZWN0UGF0aO+8ie+8jHNldHRpbmdzIOetieWcqOivt+axguaXtlxuICog5oOw5oCn6K6h566X77yM5pyq5bCx57uq6L+U5Zue5Y+v6YeN6K+VIDUwM+OAguato+WboOWmguatpO+8jOacrOWHveaVsOW6lOWwveaXqe+8iHN0YXJ0U2VydmVyIOS5i+WQjuOAgeiAl+aXtueahCBidWlsZGVyL3NjZW5lXG4gKiDliJ3lp4vljJbkuYvliY3vvInosIPnlKjvvIzkvb/liJ3lp4vljJbmnJ/miZPlvIDnmoTpooTop4jpobXmi7/liLDluKYgc29ja2V0IOiHquaEiOiDveWKm+eahCBnYW1lLmVqc++8jOiAjOmdnuijuCA0MDQg6aG144CCXG4gKi9cbmxldCBleHRlbnNpb25Ib3N0OiB7IGRpc3Bvc2UoKTogdm9pZCB9IHwgdW5kZWZpbmVkO1xubGV0IHJlZ2lzdGVyZWQgPSBmYWxzZTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZ2lzdGVyQnJvd3NlclByZXZpZXcocHJvamVjdFBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChyZWdpc3RlcmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVnaXN0ZXJlZCA9IHRydWU7XG5cbiAgICAvLyDlhYjliqDovb3lubbms6jlhozpobnnm67mianlsZXnmoTpooTop4jlkI7nq6/vvIhjb250cmlidXRpb25zLnNlcnZlciArIG1lc3NhZ2Vz77yM6LeR5omp5bGV5Y6f56CB77yJ77yMXG4gICAgLy8g5b+F6aG75ZyoIEdhbWVQcmV2aWV3IOS5i+WJjeazqOWGjO+8jOS9v+aJqeWxleWFt+S9k+i3r+eUseS8mOWFiOS6jiBzY3JpcHRpbmdSb3V0ZXMg55qE5a695rOb5q2j5YiZ44CCXG4gICAgLy8g5aSx6LSl6ZqU56a777ya5omp5bGV5a6/5Li75Lu75L2V5byC5bi46YO95LiN5bqU6Zi75pat6aKE6KeI5ZCv5Yqo44CCXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBsb2FkRXh0ZW5zaW9uUHJldmlld0hvc3QgfSA9IGF3YWl0IGltcG9ydCgnLi9leHRlbnNpb24taG9zdCcpO1xuICAgICAgICBleHRlbnNpb25Ib3N0ID0gYXdhaXQgbG9hZEV4dGVuc2lvblByZXZpZXdIb3N0KHByb2plY3RQYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbRXh0ZW5zaW9uSG9zdF0gaW5pdCBmYWlsZWQ6JywgZXJyKTtcbiAgICB9XG5cbiAgICAvLyDms6jlhozmuLjmiI/pooTop4jot6/nlLFcbiAgICBjb25zdCB7IGRlZmF1bHQ6IEdhbWVQcmV2aWV3TWlkZGxld2FyZSB9ID0gYXdhaXQgaW1wb3J0KCcuL2dhbWUtcHJldmlldy5taWRkbGV3YXJlJyk7XG4gICAgbWlkZGxld2FyZVNlcnZpY2UucmVnaXN0ZXIoJ0dhbWVQcmV2aWV3JywgR2FtZVByZXZpZXdNaWRkbGV3YXJlKTtcblxuICAgIC8vIOazqOWGjOeDremHjei9ve+8iOa1j+iniOWZqOmihOiniOebkeWQrCBicm93c2VyOnJlbG9hZO+8jOiEmuacrC/otYTmupDlj5jljJblkI7oh6rliqjliLfmlrDvvIlcbiAgICBjb25zdCB7IHJlZ2lzdGVyTGl2ZVJlbG9hZCB9ID0gYXdhaXQgaW1wb3J0KCcuL2xpdmUtcmVsb2FkJyk7XG4gICAgYXdhaXQgcmVnaXN0ZXJMaXZlUmVsb2FkKCk7XG59XG5cbi8qKlxuICog6YeK5pS+5rWP6KeI5Zmo6aKE6KeI55u45YWz6LWE5rqQ77yI5omp5bGV6aKE6KeI5ZCO56uvICsg54Ot6YeN6L2955uR5ZCs77yJ44CC6aKE6KeI5YWz6Zet5pe26LCD55So44CCXG4gKlxuICog5rOo5oSP77yaYG1pZGRsZXdhcmVTZXJ2aWNlYCDnm67liY3lj6rmlK/mjIHov73liqDot6/nlLHjgIHkuI3mlK/mjIHms6jplIDvvIzlm6DmraTlt7Lms6jlhoznmoQgR2FtZVByZXZpZXcg6Lev55SxXG4gKiDml6Dms5XlnKjmraTnp7vpmaTvvJvlkIzov5vnqIvlhoXph43lkK/pooTop4jkvJrph43lpI3ms6jlhozot6/nlLHvvIjlt7Lnn6XpmZDliLbvvIzop4EgcmV2aWV3IOmBl+eVmemhue+8ieOAgui/memHjOi0n+i0o+a4heeQhlxuICog5pyJ54q25oCB55qE6YOo5YiG77yI5omp5bGV5a6/5Li7ICsg54Ot6YeN6L2955uR5ZCsIC8g5a6a5pe25Zmo77yJ77yM5bm25aSN5L2N5rOo5YaM5qCH5b+X44CCXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkaXNwb3NlQnJvd3NlclByZXZpZXcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyB1bnJlZ2lzdGVyTGl2ZVJlbG9hZCB9ID0gYXdhaXQgaW1wb3J0KCcuL2xpdmUtcmVsb2FkJyk7XG4gICAgICAgIHVucmVnaXN0ZXJMaXZlUmVsb2FkKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW0xpdmVSZWxvYWRdIHVucmVnaXN0ZXIgZmFpbGVkOicsIGVycik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGV4dGVuc2lvbkhvc3Q/LmRpc3Bvc2UoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbRXh0ZW5zaW9uSG9zdF0gZGlzcG9zZSBmYWlsZWQ6JywgZXJyKTtcbiAgICB9XG4gICAgZXh0ZW5zaW9uSG9zdCA9IHVuZGVmaW5lZDtcbiAgICByZWdpc3RlcmVkID0gZmFsc2U7XG59XG4iXX0=