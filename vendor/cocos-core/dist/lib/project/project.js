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
exports.init = init;
exports.open = open;
exports.close = close;
exports.getInfo = getInfo;
exports.get = get;
/**
 * 提前注册浏览器游戏预览的 `/` 路由 + live-reload（幂等）。
 *
 * IDE（PinK）直接编排 lib/* 各步骤，且 `Assets.start()`（"init asset" 冷导入，可达约 1 分钟）
 * 早于 `Scripting.init`。`/` 路由原本只在 `Scene.init()`（core/scene）里注册，而 IDE 把它排在
 * asset 初始化之后——这段窗口里 server 已 listen 但 `/` 未注册，浏览器打开预览命中 server.ts 的
 * 兜底 404（纯文本 "404 - Not Found"）：拿到一张没有 socket.io、没有 browser:reload 监听的裸页，
 * 之后 CLI 就绪也无从通知它刷新，永远停在 404。
 *
 * 因此在 `Project.init`（IDE 启动最早的一步、早于 asset 冷导入、且已知 projectPath）就提前注册：
 * 使初始化期打开的预览页拿到带 socket 自愈能力的 game.ejs（settings 未就绪时 settings.js 返回
 * 可重试 503，就绪后 live-reload 定向推送 browser:reload 整页刷新自愈，无需手动刷新）。
 * projectPath 已确定，扩展预览后端(extension-host)能拿到正确工程路径并先于 GamePreview 注册。
 * 幂等（内部 registered 守卫）：Scene.init 里的原有调用会安全 no-op。
 * 失败隔离：预览是附加能力，注册异常不得阻断工程打开。
 */
async function init(projectPath) {
    // 初始化项目信息
    const { default: Project } = await Promise.resolve().then(() => __importStar(require('../../core/project')));
    await Project.open(projectPath);
    try {
        const { registerBrowserPreview } = await Promise.resolve().then(() => __importStar(require('../../core/preview/register')));
        await registerBrowserPreview(projectPath);
    }
    catch (err) {
        console.warn('[Preview] early register in Project.init failed:', err);
    }
}
async function open(projectPath) {
    const { projectManager } = await Promise.resolve().then(() => __importStar(require('../../core/project-manager')));
    return await projectManager.open(projectPath);
}
async function close() {
    const { projectManager } = await Promise.resolve().then(() => __importStar(require('../../core/project-manager')));
    return await projectManager.close();
}
async function getInfo() {
    const { default: Project } = await Promise.resolve().then(() => __importStar(require('../../core/project')));
    return await Project.getInfo();
}
async function get() {
    const { default: Project } = await Promise.resolve().then(() => __importStar(require('../../core/project')));
    return Project;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvcHJvamVjdC9wcm9qZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLG9CQVdDO0FBRUQsb0JBR0M7QUFFRCxzQkFHQztBQUVELDBCQUdDO0FBRUQsa0JBR0M7QUEvQ0Q7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0ksS0FBSyxVQUFVLElBQUksQ0FBQyxXQUFtQjtJQUMxQyxVQUFVO0lBQ1YsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyx3REFBYSxvQkFBb0IsR0FBQyxDQUFDO0lBQ2hFLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUVoQyxJQUFJLENBQUM7UUFDRCxNQUFNLEVBQUUsc0JBQXNCLEVBQUUsR0FBRyx3REFBYSw2QkFBNkIsR0FBQyxDQUFDO1FBQy9FLE1BQU0sc0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDWCxPQUFPLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzFFLENBQUM7QUFDTCxDQUFDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxXQUFtQjtJQUMxQyxNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsd0RBQWEsNEJBQTRCLEdBQUMsQ0FBQztJQUN0RSxPQUFPLE1BQU0sY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRU0sS0FBSyxVQUFVLEtBQUs7SUFDdkIsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLHdEQUFhLDRCQUE0QixHQUFDLENBQUM7SUFDdEUsT0FBTyxNQUFNLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN4QyxDQUFDO0FBRU0sS0FBSyxVQUFVLE9BQU87SUFDekIsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyx3REFBYSxvQkFBb0IsR0FBQyxDQUFDO0lBQ2hFLE9BQU8sTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbkMsQ0FBQztBQUVNLEtBQUssVUFBVSxHQUFHO0lBQ3JCLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsd0RBQWEsb0JBQW9CLEdBQUMsQ0FBQztJQUNoRSxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKipcbiAqIOaPkOWJjeazqOWGjOa1j+iniOWZqOa4uOaIj+mihOiniOeahCBgL2Ag6Lev55SxICsgbGl2ZS1yZWxvYWTvvIjluYLnrYnvvInjgIJcbiAqXG4gKiBJREXvvIhQaW5L77yJ55u05o6l57yW5o6SIGxpYi8qIOWQhOatpemqpO+8jOS4lCBgQXNzZXRzLnN0YXJ0KClg77yIXCJpbml0IGFzc2V0XCIg5Ya35a+85YWl77yM5Y+v6L6+57qmIDEg5YiG6ZKf77yJXG4gKiDml6nkuo4gYFNjcmlwdGluZy5pbml0YOOAgmAvYCDot6/nlLHljp/mnKzlj6rlnKggYFNjZW5lLmluaXQoKWDvvIhjb3JlL3NjZW5l77yJ6YeM5rOo5YaM77yM6ICMIElERSDmiorlroPmjpLlnKhcbiAqIGFzc2V0IOWIneWni+WMluS5i+WQjuKAlOKAlOi/meauteeql+WPo+mHjCBzZXJ2ZXIg5beyIGxpc3RlbiDkvYYgYC9gIOacquazqOWGjO+8jOa1j+iniOWZqOaJk+W8gOmihOiniOWRveS4rSBzZXJ2ZXIudHMg55qEXG4gKiDlhZzlupUgNDA077yI57qv5paH5pysIFwiNDA0IC0gTm90IEZvdW5kXCLvvInvvJrmi7/liLDkuIDlvKDmsqHmnIkgc29ja2V0Lmlv44CB5rKh5pyJIGJyb3dzZXI6cmVsb2FkIOebkeWQrOeahOijuOmhte+8jFxuICog5LmL5ZCOIENMSSDlsLHnu6rkuZ/ml6Dku47pgJrnn6XlroPliLfmlrDvvIzmsLjov5zlgZzlnKggNDA044CCXG4gKlxuICog5Zug5q2k5ZyoIGBQcm9qZWN0LmluaXRg77yISURFIOWQr+WKqOacgOaXqeeahOS4gOatpeOAgeaXqeS6jiBhc3NldCDlhrflr7zlhaXjgIHkuJTlt7Lnn6UgcHJvamVjdFBhdGjvvInlsLHmj5DliY3ms6jlhozvvJpcbiAqIOS9v+WIneWni+WMluacn+aJk+W8gOeahOmihOiniOmhteaLv+WIsOW4piBzb2NrZXQg6Ieq5oSI6IO95Yqb55qEIGdhbWUuZWpz77yIc2V0dGluZ3Mg5pyq5bCx57uq5pe2IHNldHRpbmdzLmpzIOi/lOWbnlxuICog5Y+v6YeN6K+VIDUwM++8jOWwsee7quWQjiBsaXZlLXJlbG9hZCDlrprlkJHmjqjpgIEgYnJvd3NlcjpyZWxvYWQg5pW06aG15Yi35paw6Ieq5oSI77yM5peg6ZyA5omL5Yqo5Yi35paw77yJ44CCXG4gKiBwcm9qZWN0UGF0aCDlt7Lnoa7lrprvvIzmianlsZXpooTop4jlkI7nq68oZXh0ZW5zaW9uLWhvc3Qp6IO95ou/5Yiw5q2j56Gu5bel56iL6Lev5b6E5bm25YWI5LqOIEdhbWVQcmV2aWV3IOazqOWGjOOAglxuICog5bmC562J77yI5YaF6YOoIHJlZ2lzdGVyZWQg5a6I5Y2r77yJ77yaU2NlbmUuaW5pdCDph4znmoTljp/mnInosIPnlKjkvJrlronlhaggbm8tb3DjgIJcbiAqIOWksei0pemalOemu++8mumihOiniOaYr+mZhOWKoOiDveWKm++8jOazqOWGjOW8guW4uOS4jeW+l+mYu+aWreW3peeoi+aJk+W8gOOAglxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdChwcm9qZWN0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8g5Yid5aeL5YyW6aG555uu5L+h5oGvXG4gICAgY29uc3QgeyBkZWZhdWx0OiBQcm9qZWN0IH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvcHJvamVjdCcpO1xuICAgIGF3YWl0IFByb2plY3Qub3Blbihwcm9qZWN0UGF0aCk7XG5cbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IHJlZ2lzdGVyQnJvd3NlclByZXZpZXcgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9wcmV2aWV3L3JlZ2lzdGVyJyk7XG4gICAgICAgIGF3YWl0IHJlZ2lzdGVyQnJvd3NlclByZXZpZXcocHJvamVjdFBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tQcmV2aWV3XSBlYXJseSByZWdpc3RlciBpbiBQcm9qZWN0LmluaXQgZmFpbGVkOicsIGVycik7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3Blbihwcm9qZWN0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBwcm9qZWN0TWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb3JlL3Byb2plY3QtbWFuYWdlcicpO1xuICAgIHJldHVybiBhd2FpdCBwcm9qZWN0TWFuYWdlci5vcGVuKHByb2plY3RQYXRoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgcHJvamVjdE1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9wcm9qZWN0LW1hbmFnZXInKTtcbiAgICByZXR1cm4gYXdhaXQgcHJvamVjdE1hbmFnZXIuY2xvc2UoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEluZm8oKSB7XG4gICAgY29uc3QgeyBkZWZhdWx0OiBQcm9qZWN0IH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvcmUvcHJvamVjdCcpO1xuICAgIHJldHVybiBhd2FpdCBQcm9qZWN0LmdldEluZm8oKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldCgpIHtcbiAgICBjb25zdCB7IGRlZmF1bHQ6IFByb2plY3QgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vY29yZS9wcm9qZWN0Jyk7XG4gICAgcmV0dXJuIFByb2plY3Q7XG59Il19