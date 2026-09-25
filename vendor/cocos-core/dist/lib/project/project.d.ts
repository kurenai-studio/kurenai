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
export declare function init(projectPath: string): Promise<void>;
export declare function open(projectPath: string): Promise<void>;
export declare function close(): Promise<void>;
export declare function getInfo(): Promise<import("../../core/project/@types/public").ProjectInfo>;
export declare function get(): Promise<import("../../core/project/script").Project>;
