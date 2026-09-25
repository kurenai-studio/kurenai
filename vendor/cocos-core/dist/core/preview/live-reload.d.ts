/**
 * 主动触发一次浏览器热重载（去抖）。
 * 供扩展宿主映射 Creator 的预览刷新信号（preview/reload-terminal、scene/soft-reload）使用。
 */
export declare function triggerPreviewReload(): void;
/**
 * settings.js 请求发现预览未就绪（返回 503）时，由 game-preview 中间件调用。
 *
 * 这是首次就绪自愈的**主触发点**：以「确实发生过 503（确有预览页 boot 失败）」为依据，同步标记
 * pendingHeal 并起兜底轮询，settings 首次真正可用时广播 browser:reload 把该页刷新救回。
 *
 * 为什么不依赖 socket 连接时序来判定「有页面待自愈」：连接处理器里的异步就绪探测可能恰好跨越
 * 初始化完成边界——探测发起时未就绪、返回时已就绪，于是标记 healed 却因 pendingHeal 尚未置位而
 * 漏掉广播，页面 loading 结束却不刷新（正是该 bug 的现象）。改由 503 同步置位，彻底规避该竞态。
 */
export declare function notePreviewNotReady(): void;
/**
 * 注册热重载监听。仅生效一次。
 */
export declare function registerLiveReload(): Promise<void>;
/**
 * 注销热重载监听并清理去抖定时器。预览关闭时调用，避免同进程内重启预览时监听/定时器泄漏。
 */
export declare function unregisterLiveReload(): void;
