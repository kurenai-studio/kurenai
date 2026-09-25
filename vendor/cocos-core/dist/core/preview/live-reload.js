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
exports.triggerPreviewReload = triggerPreviewReload;
exports.notePreviewNotReady = notePreviewNotReady;
exports.registerLiveReload = registerLiveReload;
exports.unregisterLiveReload = unregisterLiveReload;
const socket_1 = require("../../server/socket");
const preview_settings_1 = require("./preview-settings");
/**
 * 浏览器热重载。
 *
 * 对齐编辑器：脚本重编译完成或资源刷新结束后，通过 socket.io 广播 `browser:reload`，
 * 浏览器端收到后整页刷新。先清空预览 settings 缓存，保证刷新后取到最新数据。
 *
 * 注意：cocos-cli 没有逐资源级别的变更事件，`assets:refresh-finish` 是整批刷新结束的
 * 粗粒度信号，对整页刷新已足够。
 */
let timer = null;
let registered = false;
// 保存已注册的监听源与回调，供 unregisterLiveReload 精确解绑，避免预览重启后监听泄漏。
let scriptingRef = null;
let assetDBRef = null;
let assetMgrRef = null;
let configRef = null;
let onCompiled = null;
let onRefreshFinish = null;
let onAssetChanged = null;
let onConfigChanged = null;
let onAssetEvent = null;
let onSocketConnection = null;
// ---- 「首次就绪自愈」状态 -------------------------------------------------
// healed：settings 首次校验通过后置 true，此后不再做就绪探测（转为常规热重载）。
let healed = false;
// healing：tryHeal 重入保护（generatePreviewSettings 有一定耗时）。
let healing = false;
// pendingHeal：是否有预览页曾在 settings 未就绪期连上（其 settings.js 拿到 503/500、boot 失败）。
// 一旦置位便保持到注销：即使该页 socket 因初始化期事件循环繁忙而掉线重连、当前连接数一时为 0，
// 也要在就绪后通知它 reload 把它救回来。就绪后才首次连上的页面 boot 正常，不置位、不通知。
let pendingHeal = false;
// awaitingSockets：已上报「本页 boot 失败、等待自愈」（preview:awaiting-reload）的预览页 socket。
// settings 首次就绪时逐个 emit browser:reload 定向刷新；socket 掉线即移除。
// 用「定向 + 客户端每次(重)连都重报」取代「一次性 io 广播」：广播只在那一瞬对当时已连上的 socket 生效，
// 初始化期 socket 频繁 ping 超时重连、或多个预览页（Chrome + IDE webview）连接时机不同，都会漏掉广播；
// 定向 + 重报则与连接时机解耦——谁在就绪时连着就当场刷，没连上的重连回来再报、服务端立即补发。
let awaitingSockets = new Set();
// healPollTimer / healAttempts：兜底轮询（详见 startHealPoll）。
let healPollTimer = null;
let healAttempts = 0;
const HEAL_POLL_INTERVAL_MS = 1500;
// 兜底轮询最多尝试次数（约 15 分钟）。正常初始化 1 分钟内即就绪；此上限仅用于工程异常时收敛，避免空转。
const HEAL_MAX_ATTEMPTS = 600;
function removeListener(emitter, event, fn) {
    if (!emitter || !fn) {
        return;
    }
    const off = emitter.off || emitter.removeListener;
    off?.call(emitter, event, fn);
}
/**
 * 通知所有「已上报等待自愈」的预览页整页刷新，并清空登记。
 * 逐 socket 定向 emit，而非 io 广播——只刷 boot 失败的页，不打扰就绪后正常加载的新页。
 */
function healAwaitingSockets() {
    if (awaitingSockets.size === 0) {
        return;
    }
    (0, preview_settings_1.invalidatePreviewSettings)();
    for (const socket of awaitingSockets) {
        try {
            socket.emit('browser:reload');
        }
        catch {
            /* socket 可能已失效，忽略 */
        }
    }
    awaitingSockets.clear();
}
function scheduleReload() {
    (0, preview_settings_1.invalidatePreviewSettings)();
    if (timer) {
        clearTimeout(timer);
    }
    // 去抖：编译/刷新可能短时间内多次触发，合并成一次刷新
    timer = setTimeout(() => {
        timer = null;
        socket_1.socketService.io?.emit('browser:reload');
    }, 200);
}
/**
 * 「首次就绪自愈」核心：探测预览 settings 是否已真正可用（校验通过：能生成且 builtinAssets 非空），
 * 首次可用（invalid→valid 跃迁）时，若有「未就绪期就连上」的预览页，则广播一次 browser:reload。
 *
 * 为什么以「能否成功生成并通过校验」为准、而不用 assetDBManager.ready / assets:ready：ready 标志在
 * asset-db.start() 里早于内置资源库/内置 bundle 完全导入就被置位，此刻生成 settings 会 500 或产出空
 * builtinAssets 的坏 settings（运行时报 builtinMaterial 加载失败 / graphics recompileShaders null）。
 *
 * 为什么向「所有」连接广播、而非只挑早连页：服务端无法区分「刚加载成功的新页」与「早前 503、boot
 * 失败后 socket 重连的旧页」。但只在 pendingHeal（确有早连失败页）且首次跃迁时广播一次（healed 加锁），
 * 就绪后才连上的新页 boot 正常、healed 已锁，不会再广播，因而不会误刷新、也不会形成刷新循环。
 */
async function tryHeal() {
    if (healed || healing) {
        return;
    }
    healing = true;
    try {
        const ready = await (0, preview_settings_1.isPreviewSettingsReady)();
        if (!ready) {
            return; // 尚未就绪，等下一个资源事件 / 轮询再试
        }
        healed = true;
        stopHealPoll();
        // 首次就绪（invalid→valid 跃迁）：把此前 503/boot 失败的预览页刷新救回。
        // 只在 pendingHeal（注册时确在初始化窗口 / 确有页 503）时动作；就绪后才连上的新页 boot 正常，
        // 此刻尚不存在，故不会被误刷。
        if (pendingHeal) {
            const socketCount = socket_1.socketService.io?.sockets?.sockets?.size ?? 0;
            console.log(`[LiveReload] 预览 settings 首次就绪：刷新自愈（登记等待页 ${awaitingSockets.size} 个，当前连接 ${socketCount} 个）`);
            // 1) 定向刷新已登记的等待页。
            healAwaitingSockets();
            // 2) 兜底广播给「当前所有连接」：登记可能因时序/socket 实例不一致而遗漏，但此刻凡连着的
            //    预览页必是未就绪期打开、settings.js 已 503 的 stuck 页，广播刷新它们是安全且更可靠的
            //    （不依赖 awaitingSockets 是否被正确填充）。scene-editor 等不监听 browser:reload 的页忽略之。
            (0, preview_settings_1.invalidatePreviewSettings)();
            socket_1.socketService.io?.emit('browser:reload');
        }
    }
    finally {
        healing = false;
    }
}
/**
 * 兜底轮询：只要存在待自愈的早连页（pendingHeal）且尚未自愈，就周期性 tryHeal，直到 settings 可用后
 * 广播刷新并停止。
 *
 * 关键：轮询存活只看 pendingHeal / healed，不看「当前连接数」。初始化期事件循环繁忙，早连页 socket
 * 可能 ping 超时短暂掉线（连接数一时为 0）再自动重连；若因连接数为 0 就停轮询，等就绪后便再没有触发点，
 * 页面就永远停在 503。因此掉线期间轮询继续，就绪后 emit 广播（重连回来的页面即收到）。
 * 事件监听（assets:refresh-finish 等）与本轮询互为补充：谁先探到就绪都能自愈。
 */
function startHealPoll() {
    if (healed || healPollTimer) {
        return;
    }
    const tick = () => {
        healPollTimer = null;
        if (healed || !pendingHeal || healAttempts >= HEAL_MAX_ATTEMPTS) {
            return;
        }
        healAttempts++;
        tryHeal().finally(() => {
            if (!healed && pendingHeal && healAttempts < HEAL_MAX_ATTEMPTS) {
                healPollTimer = setTimeout(tick, HEAL_POLL_INTERVAL_MS);
            }
        });
    };
    healPollTimer = setTimeout(tick, HEAL_POLL_INTERVAL_MS);
}
function stopHealPoll() {
    if (healPollTimer) {
        clearTimeout(healPollTimer);
        healPollTimer = null;
    }
}
/**
 * 主动触发一次浏览器热重载（去抖）。
 * 供扩展宿主映射 Creator 的预览刷新信号（preview/reload-terminal、scene/soft-reload）使用。
 */
function triggerPreviewReload() {
    scheduleReload();
}
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
function notePreviewNotReady() {
    if (!registered || healed) {
        return;
    }
    if (!pendingHeal) {
        console.log('[LiveReload] settings.js 返回 503（预览页未就绪），就绪后将广播 browser:reload 自愈');
    }
    pendingHeal = true;
    startHealPoll();
}
/**
 * 注册热重载监听。仅生效一次。
 */
async function registerLiveReload() {
    if (registered) {
        return;
    }
    registered = true;
    healed = false;
    pendingHeal = false;
    healAttempts = 0;
    awaitingSockets.clear();
    const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../scripting')));
    const { assetDBManager, assetManager } = await Promise.resolve().then(() => __importStar(require('../assets')));
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../configuration')));
    const { MessageType } = await Promise.resolve().then(() => __importStar(require('../configuration/script/interface')));
    onCompiled = () => scheduleReload();
    onRefreshFinish = () => scheduleReload();
    // 单个资源变更（如保存场景 = .scene asset-change、编辑材质/预制体等）。
    // assets:refresh-finish 只在整批刷新时触发，保存单个场景走的是逐资源 asset-change，
    // 不监听就会出现“改完/存完场景，浏览器预览不重载”。有 200ms 去抖，批量导入会合并成一次。
    onAssetChanged = () => scheduleReload();
    // 资源批量刷新结束：自愈前用作就绪探测触发；自愈后作为常规热重载信号。
    onRefreshFinish = () => {
        if (!healed) {
            void tryHeal();
        }
        else {
            scheduleReload();
        }
    };
    // 工程配置变更（如切换物理后端 = 改 engine.includeModules）会影响预览 settings，
    // 需清缓存并重载，否则预览仍用旧模块集（漏掉新后端的内置资源，报 builtinMaterial 加载失败）。
    onConfigChanged = () => scheduleReload();
    // 启动期资源事件：仅在尚未自愈时用于就绪探测。
    onAssetEvent = () => {
        if (!healed) {
            void tryHeal();
        }
    };
    scriptingRef = scripting;
    assetDBRef = assetDBManager;
    assetMgrRef = assetManager;
    configRef = configurationManager;
    // 脚本重编译成功
    scripting.on('compiled', onCompiled);
    // 资源批量刷新结束
    assetDBManager.on('assets:refresh-finish', onRefreshFinish);
    // 单个资源增删改（含保存场景）
    assetManager.on('asset-change', onAssetChanged);
    assetManager.on('asset-add', onAssetChanged);
    assetManager.on('asset-delete', onAssetChanged);
    // 启动期就绪相关事件（初次建库 / 各库就绪），驱动首次就绪探测
    assetDBManager.on('assets:ready', onAssetEvent);
    assetDBManager.on('assets:db-ready', onAssetEvent);
    // 工程配置变更（set / reload）
    configurationManager.on(MessageType.Update, onConfigChanged);
    configurationManager.on(MessageType.Reload, onConfigChanged);
    // 首次就绪自愈（事件驱动，无需手动刷新）：
    // IDE 常驻 server 模式下，用户可能在 CLI 初始化（asset-db 建库 + 内置资源导入，约 1 分钟）
    // 完成前就打开预览页，settings.js 返回 503/500、首屏 boot 失败。预览页在加载前已注册 socket
    // browser:reload 监听（见 static/web/game.ejs），并在 settings.js 加载失败时于每次(重)连接上报
    // preview:awaiting-reload。这里为每个连上的 socket 挂上该上报的处理：
    //   已就绪 → 直接令这只 stuck 页刷新（它一刷新即取到 200、boot 正常）；
    //   未就绪 → 登记待自愈并起兜底轮询，settings 首次真正可用时定向 emit browser:reload。
    // 客户端在每次(重)连都重报，故与连接时机彻底解耦：初始化期掉线重连、或多个预览页
    // （Chrome + IDE webview）连接时机不同，都能各自被可靠救回，不再依赖某一瞬的广播。
    onSocketConnection = (socket) => {
        if (!socket || typeof socket.on !== 'function' || socket.__lrBound) {
            return;
        }
        socket.__lrBound = true; // 防重复挂载（connection 事件与「注册时补挂已连 socket」可能都命中）
        // 已确认处于初始化窗口（pendingHeal 已置位）且尚未自愈时，新连上的预览页此刻请求 settings.js
        // 同样会 503、boot 失败——直接预判为待自愈页登记，就绪时一并定向刷新，不必等它自己上报到达。
        const presumed = !healed && pendingHeal;
        if (presumed) {
            awaitingSockets.add(socket);
        }
        console.log(`[LiveReload] 预览 socket 挂载（healed=${healed} pendingHeal=${pendingHeal} 预判stuck=${presumed}）`);
        socket.on('preview:awaiting-reload', () => {
            if (healed) {
                try {
                    socket.emit('browser:reload');
                }
                catch {
                    /* ignore */
                }
                return;
            }
            if (!pendingHeal) {
                console.log('[LiveReload] 预览页上报 boot 失败（settings 未就绪），就绪后将定向刷新自愈');
            }
            pendingHeal = true;
            awaitingSockets.add(socket);
            startHealPoll();
            void tryHeal(); // 也许此刻恰好就绪
        });
        socket.on('disconnect', () => {
            awaitingSockets.delete(socket);
        });
    };
    socket_1.socketService.io?.on('connection', onSocketConnection);
    // 补挂「注册前就已连上」的 socket：启动顺序为 server 起来 →（页面被服务、浏览器 socket 连上）
    // → 才轮到 registerLiveReload 挂上 connection 监听。浏览器早于本监听挂上前打开/重连时，会错过
    // connection 事件，其首次 preview:awaiting-reload 上报因无处理器而丢失。这里为已在册的 socket
    // 补挂处理器；配合客户端「失败态周期性重报」（见 game.ejs），补挂后的重报即可被登记自愈。
    const adopt = onSocketConnection;
    const existingSockets = socket_1.socketService.io?.sockets?.sockets;
    existingSockets?.forEach?.((socket) => adopt(socket));
    // 关键：注册时机在启动尾部。未就绪期（CLI 初始化，约 1 分钟）打开的预览页，其 settings.js 早已
    // 503、boot 失败，但此时：
    //   1) 那次 503 发生在 registered=false 时，notePreviewNotReady 直接 return，pendingHeal 未置位；
    //   2) 驱动就绪探测的批量资源事件（assets:refresh-finish / assets:ready）大多在注册前就触发完毕，
    //      注册后往往再无事件来触发 tryHeal；
    //   3) 那些页发出的 preview:awaiting-reload 多在本监听挂上前丢失，客户端重报是否及时到达并不可靠。
    // 因此这里在注册时**主动探测一次就绪**：若此刻仍未就绪（确在初始化窗口内），就把「注册前已连上的
    // 所有预览页」直接预判为等待自愈页并起兜底轮询——settings 首次真正可用时定向刷新它们，完全由服务端
    // 驱动，不依赖客户端上报的时机。（已就绪则说明初始化早已完成，此后新开页都会 boot 正常，无需自愈。）
    // 探测本身包裹 try/catch：任何异常都不得中断预览注册（否则整个 scene init 会抛错）。
    let readyAtRegister = false;
    try {
        readyAtRegister = await (0, preview_settings_1.isPreviewSettingsReady)();
    }
    catch (err) {
        console.warn('[LiveReload] 注册时就绪探测异常，按未就绪处理：', err);
        readyAtRegister = false;
    }
    const socketCountAtRegister = socket_1.socketService.io?.sockets?.sockets?.size ?? 0;
    console.log(`[LiveReload] 注册完成：settings ${readyAtRegister ? '已就绪' : '未就绪'}，当前已连接 socket ${socketCountAtRegister} 个`);
    if (readyAtRegister) {
        healed = true;
    }
    else {
        // 确在初始化窗口内：起兜底轮询，并把此刻已连上的预览页预判为待自愈页。
        pendingHeal = true;
        const stuckSockets = socket_1.socketService.io?.sockets?.sockets;
        if (stuckSockets && stuckSockets.size > 0) {
            console.log(`[LiveReload] 注册时预览尚未就绪，预判 ${stuckSockets.size} 个已连接预览页为待自愈，就绪后将刷新`);
            stuckSockets.forEach((socket) => awaitingSockets.add(socket));
        }
        startHealPoll();
    }
}
/**
 * 注销热重载监听并清理去抖定时器。预览关闭时调用，避免同进程内重启预览时监听/定时器泄漏。
 */
function unregisterLiveReload() {
    if (!registered) {
        return;
    }
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    stopHealPoll();
    removeListener(scriptingRef, 'compiled', onCompiled);
    removeListener(assetDBRef, 'assets:refresh-finish', onRefreshFinish);
    removeListener(assetMgrRef, 'asset-change', onAssetChanged);
    removeListener(assetMgrRef, 'asset-add', onAssetChanged);
    removeListener(assetMgrRef, 'asset-delete', onAssetChanged);
    removeListener(assetDBRef, 'assets:ready', onAssetEvent);
    removeListener(assetDBRef, 'assets:db-ready', onAssetEvent);
    // MessageType.Update / MessageType.Reload
    removeListener(configRef, 'configuration:update', onConfigChanged);
    removeListener(configRef, 'configuration:reload', onConfigChanged);
    // 解绑 socket 连接钩子
    if (onSocketConnection) {
        socket_1.socketService.io?.off('connection', onSocketConnection);
    }
    awaitingSockets.clear();
    scriptingRef = null;
    assetDBRef = null;
    assetMgrRef = null;
    configRef = null;
    onCompiled = null;
    onRefreshFinish = null;
    onAssetChanged = null;
    onConfigChanged = null;
    onAssetEvent = null;
    onSocketConnection = null;
    healing = false;
    healed = false;
    pendingHeal = false;
    healAttempts = 0;
    registered = false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl2ZS1yZWxvYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9wcmV2aWV3L2xpdmUtcmVsb2FkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUtBLG9EQUVDO0FBWUQsa0RBU0M7QUFLRCxnREErSUM7QUFLRCxvREF5Q0M7QUFsWUQsZ0RBQW9EO0FBQ3BELHlEQUF1RjtBQUV2Rjs7Ozs7Ozs7R0FRRztBQUNILElBQUksS0FBSyxHQUEwQixJQUFJLENBQUM7QUFDeEMsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3ZCLHdEQUF3RDtBQUN4RCxJQUFJLFlBQVksR0FBeUQsSUFBSSxDQUFDO0FBQzlFLElBQUksVUFBVSxHQUF5RCxJQUFJLENBQUM7QUFDNUUsSUFBSSxXQUFXLEdBQXlELElBQUksQ0FBQztBQUM3RSxJQUFJLFNBQVMsR0FBeUQsSUFBSSxDQUFDO0FBQzNFLElBQUksVUFBVSxHQUF3QixJQUFJLENBQUM7QUFDM0MsSUFBSSxlQUFlLEdBQXdCLElBQUksQ0FBQztBQUNoRCxJQUFJLGNBQWMsR0FBd0IsSUFBSSxDQUFDO0FBQy9DLElBQUksZUFBZSxHQUF3QixJQUFJLENBQUM7QUFDaEQsSUFBSSxZQUFZLEdBQXdCLElBQUksQ0FBQztBQUM3QyxJQUFJLGtCQUFrQixHQUFtQyxJQUFJLENBQUM7QUFFOUQsb0VBQW9FO0FBQ3BFLG9EQUFvRDtBQUNwRCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDbkIsdURBQXVEO0FBQ3ZELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNwQiwwRUFBMEU7QUFDMUUsc0RBQXNEO0FBQ3RELHNEQUFzRDtBQUN0RCxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFDeEIsNEVBQTRFO0FBQzVFLDBEQUEwRDtBQUMxRCw4REFBOEQ7QUFDOUQsc0VBQXNFO0FBQ3RFLG1EQUFtRDtBQUNuRCxJQUFJ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LGNBQWMsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFNUQsMENBQTBDO0lBQzFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDbkUsY0FBYyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUNuRSxpQkFBaUI7SUFDakIsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO1FBQ3JCLHNCQUFhLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBQ0QsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3hCLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDcEIsVUFBVSxHQUFHLElBQUksQ0FBQztJQUNsQixXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQ25CLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDakIsVUFBVSxHQUFHLElBQUksQ0FBQztJQUNsQixlQUFlLEdBQUcsSUFBSSxDQUFDO0lBQ3ZCLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDdEIsZUFBZSxHQUFHLElBQUksQ0FBQztJQUN2QixZQUFZLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLGtCQUFrQixHQUFHLElBQUksQ0FBQztJQUMxQixPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ2hCLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDZixXQUFXLEdBQUcsS0FBSyxDQUFDO0lBQ3BCLFlBQVksR0FBRyxDQUFDLENBQUM7SUFDakIsVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc29ja2V0U2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZlci9zb2NrZXQnO1xuaW1wb3J0IHsgaW52YWxpZGF0ZVByZXZpZXdTZXR0aW5ncywgaXNQcmV2aWV3U2V0dGluZ3NSZWFkeSB9IGZyb20gJy4vcHJldmlldy1zZXR0aW5ncyc7XG5cbi8qKlxuICog5rWP6KeI5Zmo54Ot6YeN6L2944CCXG4gKlxuICog5a+56b2Q57yW6L6R5Zmo77ya6ISa5pys6YeN57yW6K+R5a6M5oiQ5oiW6LWE5rqQ5Yi35paw57uT5p2f5ZCO77yM6YCa6L+HIHNvY2tldC5pbyDlub/mkq0gYGJyb3dzZXI6cmVsb2FkYO+8jFxuICog5rWP6KeI5Zmo56uv5pS25Yiw5ZCO5pW06aG15Yi35paw44CC5YWI5riF56m66aKE6KeIIHNldHRpbmdzIOe8k+WtmO+8jOS/neivgeWIt+aWsOWQjuWPluWIsOacgOaWsOaVsOaNruOAglxuICpcbiAqIOazqOaEj++8mmNvY29zLWNsaSDmsqHmnInpgJDotYTmupDnuqfliKvnmoTlj5jmm7Tkuovku7bvvIxgYXNzZXRzOnJlZnJlc2gtZmluaXNoYCDmmK/mlbTmibnliLfmlrDnu5PmnZ/nmoRcbiAqIOeyl+eykuW6puS/oeWPt++8jOWvueaVtOmhteWIt+aWsOW3sui2s+Wkn+OAglxuICovXG5sZXQgdGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5sZXQgcmVnaXN0ZXJlZCA9IGZhbHNlO1xuLy8g5L+d5a2Y5bey5rOo5YaM55qE55uR5ZCs5rqQ5LiO5Zue6LCD77yM5L6bIHVucmVnaXN0ZXJMaXZlUmVsb2FkIOeyvuehruino+e7ke+8jOmBv+WFjemihOiniOmHjeWQr+WQjuebkeWQrOazhOa8j+OAglxubGV0IHNjcmlwdGluZ1JlZjogeyBvZmY/OiBGdW5jdGlvbjsgcmVtb3ZlTGlzdGVuZXI/OiBGdW5jdGlvbiB9IHwgbnVsbCA9IG51bGw7XG5sZXQgYXNzZXREQlJlZjogeyBvZmY/OiBGdW5jdGlvbjsgcmVtb3ZlTGlzdGVuZXI/OiBGdW5jdGlvbiB9IHwgbnVsbCA9IG51bGw7XG5sZXQgYXNzZXRNZ3JSZWY6IHsgb2ZmPzogRnVuY3Rpb247IHJlbW92ZUxpc3RlbmVyPzogRnVuY3Rpb24gfSB8IG51bGwgPSBudWxsO1xubGV0IGNvbmZpZ1JlZjogeyBvZmY/OiBGdW5jdGlvbjsgcmVtb3ZlTGlzdGVuZXI/OiBGdW5jdGlvbiB9IHwgbnVsbCA9IG51bGw7XG5sZXQgb25Db21waWxlZDogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5sZXQgb25SZWZyZXNoRmluaXNoOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcbmxldCBvbkFzc2V0Q2hhbmdlZDogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5sZXQgb25Db25maWdDaGFuZ2VkOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcbmxldCBvbkFzc2V0RXZlbnQ6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xubGV0IG9uU29ja2V0Q29ubmVjdGlvbjogKChzb2NrZXQ6IGFueSkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuLy8gLS0tLSDjgIzpppbmrKHlsLHnu6roh6rmhIjjgI3nirbmgIEgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gaGVhbGVk77yac2V0dGluZ3Mg6aaW5qyh5qCh6aqM6YCa6L+H5ZCO572uIHRydWXvvIzmraTlkI7kuI3lho3lgZrlsLHnu6rmjqLmtYvvvIjovazkuLrluLjop4Tng63ph43ovb3vvInjgIJcbmxldCBoZWFsZWQgPSBmYWxzZTtcbi8vIGhlYWxpbmfvvJp0cnlIZWFsIOmHjeWFpeS/neaKpO+8iGdlbmVyYXRlUHJldmlld1NldHRpbmdzIOacieS4gOWumuiAl+aXtu+8ieOAglxubGV0IGhlYWxpbmcgPSBmYWxzZTtcbi8vIHBlbmRpbmdIZWFs77ya5piv5ZCm5pyJ6aKE6KeI6aG15pu+5ZyoIHNldHRpbmdzIOacquWwsee7quacn+i/nuS4iu+8iOWFtiBzZXR0aW5ncy5qcyDmi7/liLAgNTAzLzUwMOOAgWJvb3Qg5aSx6LSl77yJ44CCXG4vLyDkuIDml6bnva7kvY3kvr/kv53mjIHliLDms6jplIDvvJrljbPkvb/or6XpobUgc29ja2V0IOWboOWIneWni+WMluacn+S6i+S7tuW+queOr+e5geW/meiAjOaOiee6v+mHjei/nuOAgeW9k+WJjei/nuaOpeaVsOS4gOaXtuS4uiAw77yMXG4vLyDkuZ/opoHlnKjlsLHnu6rlkI7pgJrnn6XlroMgcmVsb2FkIOaKiuWug+aVkeWbnuadpeOAguWwsee7quWQjuaJjemmluasoei/nuS4iueahOmhtemdoiBib290IOato+W4uO+8jOS4jee9ruS9jeOAgeS4jemAmuefpeOAglxubGV0IHBlbmRpbmdIZWFsID0gZmFsc2U7XG4vLyBhd2FpdGluZ1NvY2tldHPvvJrlt7LkuIrmiqXjgIzmnKzpobUgYm9vdCDlpLHotKXjgIHnrYnlvoXoh6rmhIjjgI3vvIhwcmV2aWV3OmF3YWl0aW5nLXJlbG9hZO+8ieeahOmihOiniOmhtSBzb2NrZXTjgIJcbi8vIHNldHRpbmdzIOmmluasoeWwsee7quaXtumAkOS4qiBlbWl0IGJyb3dzZXI6cmVsb2FkIOWumuWQkeWIt+aWsO+8m3NvY2tldCDmjonnur/ljbPnp7vpmaTjgIJcbi8vIOeUqOOAjOWumuWQkSArIOWuouaIt+err+avj+asoSjph40p6L+e6YO96YeN5oql44CN5Y+W5Luj44CM5LiA5qyh5oCnIGlvIOW5v+aSreOAje+8muW5v+aSreWPquWcqOmCo+S4gOeerOWvueW9k+aXtuW3sui/nuS4iueahCBzb2NrZXQg55Sf5pWI77yMXG4vLyDliJ3lp4vljJbmnJ8gc29ja2V0IOmikee5gSBwaW5nIOi2heaXtumHjei/nuOAgeaIluWkmuS4qumihOiniOmhte+8iENocm9tZSArIElERSB3ZWJ2aWV377yJ6L+e5o6l5pe25py65LiN5ZCM77yM6YO95Lya5ryP5o6J5bm/5pKt77ybXG4vLyDlrprlkJEgKyDph43miqXliJnkuI7ov57mjqXml7bmnLrop6PogKbigJTigJTosIHlnKjlsLHnu6rml7bov57nnYDlsLHlvZPlnLrliLfvvIzmsqHov57kuIrnmoTph43ov57lm57mnaXlho3miqXjgIHmnI3liqHnq6/nq4vljbPooaXlj5HjgIJcbmxldCBhd2FpdGluZ1NvY2tldHMgPSBuZXcgU2V0PGFueT4oKTtcbi8vIGhlYWxQb2xsVGltZXIgLyBoZWFsQXR0ZW1wdHPvvJrlhZzlupXova7or6LvvIjor6bop4Egc3RhcnRIZWFsUG9sbO+8ieOAglxubGV0IGhlYWxQb2xsVGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5sZXQgaGVhbEF0dGVtcHRzID0gMDtcbmNvbnN0IEhFQUxfUE9MTF9JTlRFUlZBTF9NUyA9IDE1MDA7XG4vLyDlhZzlupXova7or6LmnIDlpJrlsJ3or5XmrKHmlbDvvIjnuqYgMTUg5YiG6ZKf77yJ44CC5q2j5bi45Yid5aeL5YyWIDEg5YiG6ZKf5YaF5Y2z5bCx57uq77yb5q2k5LiK6ZmQ5LuF55So5LqO5bel56iL5byC5bi45pe25pS25pWb77yM6YG/5YWN56m66L2s44CCXG5jb25zdCBIRUFMX01BWF9BVFRFTVBUUyA9IDYwMDtcblxuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZW1pdHRlcjogeyBvZmY/OiBGdW5jdGlvbjsgcmVtb3ZlTGlzdGVuZXI/OiBGdW5jdGlvbiB9IHwgbnVsbCwgZXZlbnQ6IHN0cmluZywgZm46IEZ1bmN0aW9uIHwgbnVsbCk6IHZvaWQge1xuICAgIGlmICghZW1pdHRlciB8fCAhZm4pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBvZmYgPSBlbWl0dGVyLm9mZiB8fCBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyO1xuICAgIG9mZj8uY2FsbChlbWl0dGVyLCBldmVudCwgZm4pO1xufVxuXG4vKipcbiAqIOmAmuefpeaJgOacieOAjOW3suS4iuaKpeetieW+heiHquaEiOOAjeeahOmihOiniOmhteaVtOmhteWIt+aWsO+8jOW5tua4heepuueZu+iusOOAglxuICog6YCQIHNvY2tldCDlrprlkJEgZW1pdO+8jOiAjOmdniBpbyDlub/mkq3igJTigJTlj6rliLcgYm9vdCDlpLHotKXnmoTpobXvvIzkuI3miZPmibDlsLHnu6rlkI7mraPluLjliqDovb3nmoTmlrDpobXjgIJcbiAqL1xuZnVuY3Rpb24gaGVhbEF3YWl0aW5nU29ja2V0cygpOiB2b2lkIHtcbiAgICBpZiAoYXdhaXRpbmdTb2NrZXRzLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpbnZhbGlkYXRlUHJldmlld1NldHRpbmdzKCk7XG4gICAgZm9yIChjb25zdCBzb2NrZXQgb2YgYXdhaXRpbmdTb2NrZXRzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzb2NrZXQuZW1pdCgnYnJvd3NlcjpyZWxvYWQnKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvKiBzb2NrZXQg5Y+v6IO95bey5aSx5pWI77yM5b+955WlICovXG4gICAgICAgIH1cbiAgICB9XG4gICAgYXdhaXRpbmdTb2NrZXRzLmNsZWFyKCk7XG59XG5cbmZ1bmN0aW9uIHNjaGVkdWxlUmVsb2FkKCk6IHZvaWQge1xuICAgIGludmFsaWRhdGVQcmV2aWV3U2V0dGluZ3MoKTtcbiAgICBpZiAodGltZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB9XG4gICAgLy8g5Y675oqW77ya57yW6K+RL+WIt+aWsOWPr+iDveefreaXtumXtOWGheWkmuasoeinpuWPke+8jOWQiOW5tuaIkOS4gOasoeWIt+aWsFxuICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgc29ja2V0U2VydmljZS5pbz8uZW1pdCgnYnJvd3NlcjpyZWxvYWQnKTtcbiAgICB9LCAyMDApO1xufVxuXG4vKipcbiAqIOOAjOmmluasoeWwsee7quiHquaEiOOAjeaguOW/g++8muaOoua1i+mihOiniCBzZXR0aW5ncyDmmK/lkKblt7LnnJ/mraPlj6/nlKjvvIjmoKHpqozpgJrov4fvvJrog73nlJ/miJDkuJQgYnVpbHRpbkFzc2V0cyDpnZ7nqbrvvInvvIxcbiAqIOmmluasoeWPr+eUqO+8iGludmFsaWTihpJ2YWxpZCDot4Pov4HvvInml7bvvIzoi6XmnInjgIzmnKrlsLHnu6rmnJ/lsLHov57kuIrjgI3nmoTpooTop4jpobXvvIzliJnlub/mkq3kuIDmrKEgYnJvd3NlcjpyZWxvYWTjgIJcbiAqXG4gKiDkuLrku4DkuYjku6XjgIzog73lkKbmiJDlip/nlJ/miJDlubbpgJrov4fmoKHpqozjgI3kuLrlh4bjgIHogIzkuI3nlKggYXNzZXREQk1hbmFnZXIucmVhZHkgLyBhc3NldHM6cmVhZHnvvJpyZWFkeSDmoIflv5flnKhcbiAqIGFzc2V0LWRiLnN0YXJ0KCkg6YeM5pep5LqO5YaF572u6LWE5rqQ5bqTL+WGhee9riBidW5kbGUg5a6M5YWo5a+85YWl5bCx6KKr572u5L2N77yM5q2k5Yi755Sf5oiQIHNldHRpbmdzIOS8miA1MDAg5oiW5Lqn5Ye656m6XG4gKiBidWlsdGluQXNzZXRzIOeahOWdjyBzZXR0aW5nc++8iOi/kOihjOaXtuaKpSBidWlsdGluTWF0ZXJpYWwg5Yqg6L295aSx6LSlIC8gZ3JhcGhpY3MgcmVjb21waWxlU2hhZGVycyBudWxs77yJ44CCXG4gKlxuICog5Li65LuA5LmI5ZCR44CM5omA5pyJ44CN6L+e5o6l5bm/5pKt44CB6ICM6Z2e5Y+q5oyR5pep6L+e6aG177ya5pyN5Yqh56uv5peg5rOV5Yy65YiG44CM5Yia5Yqg6L295oiQ5Yqf55qE5paw6aG144CN5LiO44CM5pep5YmNIDUwM+OAgWJvb3RcbiAqIOWksei0peWQjiBzb2NrZXQg6YeN6L+e55qE5pen6aG144CN44CC5L2G5Y+q5ZyoIHBlbmRpbmdIZWFs77yI56Gu5pyJ5pep6L+e5aSx6LSl6aG177yJ5LiU6aaW5qyh6LeD6L+B5pe25bm/5pKt5LiA5qyh77yIaGVhbGVkIOWKoOmUge+8ie+8jFxuICog5bCx57uq5ZCO5omN6L+e5LiK55qE5paw6aG1IGJvb3Qg5q2j5bi444CBaGVhbGVkIOW3sumUge+8jOS4jeS8muWGjeW5v+aSre+8jOWboOiAjOS4jeS8muivr+WIt+aWsOOAgeS5n+S4jeS8muW9ouaIkOWIt+aWsOW+queOr+OAglxuICovXG5hc3luYyBmdW5jdGlvbiB0cnlIZWFsKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChoZWFsZWQgfHwgaGVhbGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGhlYWxpbmcgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlYWR5ID0gYXdhaXQgaXNQcmV2aWV3U2V0dGluZ3NSZWFkeSgpO1xuICAgICAgICBpZiAoIXJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47IC8vIOWwmuacquWwsee7qu+8jOetieS4i+S4gOS4qui1hOa6kOS6i+S7tiAvIOi9ruivouWGjeivlVxuICAgICAgICB9XG4gICAgICAgIGhlYWxlZCA9IHRydWU7XG4gICAgICAgIHN0b3BIZWFsUG9sbCgpO1xuICAgICAgICAvLyDpppbmrKHlsLHnu6rvvIhpbnZhbGlk4oaSdmFsaWQg6LeD6L+B77yJ77ya5oqK5q2k5YmNIDUwMy9ib290IOWksei0peeahOmihOiniOmhteWIt+aWsOaVkeWbnuOAglxuICAgICAgICAvLyDlj6rlnKggcGVuZGluZ0hlYWzvvIjms6jlhozml7bnoa7lnKjliJ3lp4vljJbnqpflj6MgLyDnoa7mnInpobUgNTAz77yJ5pe25Yqo5L2c77yb5bCx57uq5ZCO5omN6L+e5LiK55qE5paw6aG1IGJvb3Qg5q2j5bi477yMXG4gICAgICAgIC8vIOatpOWIu+WwmuS4jeWtmOWcqO+8jOaVheS4jeS8muiiq+ivr+WIt+OAglxuICAgICAgICBpZiAocGVuZGluZ0hlYWwpIHtcbiAgICAgICAgICAgIGNvbnN0IHNvY2tldENvdW50ID0gKHNvY2tldFNlcnZpY2UuaW8gYXMgYW55KT8uc29ja2V0cz8uc29ja2V0cz8uc2l6ZSA/PyAwO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtMaXZlUmVsb2FkXSDpooTop4ggc2V0dGluZ3Mg6aaW5qyh5bCx57uq77ya5Yi35paw6Ieq5oSI77yI55m76K6w562J5b6F6aG1ICR7YXdhaXRpbmdTb2NrZXRzLnNpemV9IOS4qu+8jOW9k+WJjei/nuaOpSAke3NvY2tldENvdW50fSDkuKrvvIlgKTtcbiAgICAgICAgICAgIC8vIDEpIOWumuWQkeWIt+aWsOW3sueZu+iusOeahOetieW+hemhteOAglxuICAgICAgICAgICAgaGVhbEF3YWl0aW5nU29ja2V0cygpO1xuICAgICAgICAgICAgLy8gMikg5YWc5bqV5bm/5pKt57uZ44CM5b2T5YmN5omA5pyJ6L+e5o6l44CN77ya55m76K6w5Y+v6IO95Zug5pe25bqPL3NvY2tldCDlrp7kvovkuI3kuIDoh7TogIzpgZfmvI/vvIzkvYbmraTliLvlh6Hov57nnYDnmoRcbiAgICAgICAgICAgIC8vICAgIOmihOiniOmhteW/heaYr+acquWwsee7quacn+aJk+W8gOOAgXNldHRpbmdzLmpzIOW3siA1MDMg55qEIHN0dWNrIOmhte+8jOW5v+aSreWIt+aWsOWug+S7rOaYr+WuieWFqOS4lOabtOWPr+mdoOeahFxuICAgICAgICAgICAgLy8gICAg77yI5LiN5L6d6LWWIGF3YWl0aW5nU29ja2V0cyDmmK/lkKbooqvmraPnoa7loavlhYXvvInjgIJzY2VuZS1lZGl0b3Ig562J5LiN55uR5ZCsIGJyb3dzZXI6cmVsb2FkIOeahOmhteW/veeVpeS5i+OAglxuICAgICAgICAgICAgaW52YWxpZGF0ZVByZXZpZXdTZXR0aW5ncygpO1xuICAgICAgICAgICAgc29ja2V0U2VydmljZS5pbz8uZW1pdCgnYnJvd3NlcjpyZWxvYWQnKTtcbiAgICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAgIGhlYWxpbmcgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICog5YWc5bqV6L2u6K+i77ya5Y+q6KaB5a2Y5Zyo5b6F6Ieq5oSI55qE5pep6L+e6aG177yIcGVuZGluZ0hlYWzvvInkuJTlsJrmnKroh6rmhIjvvIzlsLHlkajmnJ/mgKcgdHJ5SGVhbO+8jOebtOWIsCBzZXR0aW5ncyDlj6/nlKjlkI5cbiAqIOW5v+aSreWIt+aWsOW5tuWBnOatouOAglxuICpcbiAqIOWFs+mUru+8mui9ruivouWtmOa0u+WPqueciyBwZW5kaW5nSGVhbCAvIGhlYWxlZO+8jOS4jeeci+OAjOW9k+WJjei/nuaOpeaVsOOAjeOAguWIneWni+WMluacn+S6i+S7tuW+queOr+e5geW/me+8jOaXqei/numhtSBzb2NrZXRcbiAqIOWPr+iDvSBwaW5nIOi2heaXtuefreaaguaOiee6v++8iOi/nuaOpeaVsOS4gOaXtuS4uiAw77yJ5YaN6Ieq5Yqo6YeN6L+e77yb6Iul5Zug6L+e5o6l5pWw5Li6IDAg5bCx5YGc6L2u6K+i77yM562J5bCx57uq5ZCO5L6/5YaN5rKh5pyJ6Kem5Y+R54K577yMXG4gKiDpobXpnaLlsLHmsLjov5zlgZzlnKggNTAz44CC5Zug5q2k5o6J57q/5pyf6Ze06L2u6K+i57un57ut77yM5bCx57uq5ZCOIGVtaXQg5bm/5pKt77yI6YeN6L+e5Zue5p2l55qE6aG16Z2i5Y2z5pS25Yiw77yJ44CCXG4gKiDkuovku7bnm5HlkKzvvIhhc3NldHM6cmVmcmVzaC1maW5pc2gg562J77yJ5LiO5pys6L2u6K+i5LqS5Li66KGl5YWF77ya6LCB5YWI5o6i5Yiw5bCx57uq6YO96IO96Ieq5oSI44CCXG4gKi9cbmZ1bmN0aW9uIHN0YXJ0SGVhbFBvbGwoKTogdm9pZCB7XG4gICAgaWYgKGhlYWxlZCB8fCBoZWFsUG9sbFRpbWVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGljayA9ICgpID0+IHtcbiAgICAgICAgaGVhbFBvbGxUaW1lciA9IG51bGw7XG4gICAgICAgIGlmIChoZWFsZWQgfHwgIXBlbmRpbmdIZWFsIHx8IGhlYWxBdHRlbXB0cyA+PSBIRUFMX01BWF9BVFRFTVBUUykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGhlYWxBdHRlbXB0cysrO1xuICAgICAgICB0cnlIZWFsKCkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWhlYWxlZCAmJiBwZW5kaW5nSGVhbCAmJiBoZWFsQXR0ZW1wdHMgPCBIRUFMX01BWF9BVFRFTVBUUykge1xuICAgICAgICAgICAgICAgIGhlYWxQb2xsVGltZXIgPSBzZXRUaW1lb3V0KHRpY2ssIEhFQUxfUE9MTF9JTlRFUlZBTF9NUyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgaGVhbFBvbGxUaW1lciA9IHNldFRpbWVvdXQodGljaywgSEVBTF9QT0xMX0lOVEVSVkFMX01TKTtcbn1cblxuZnVuY3Rpb24gc3RvcEhlYWxQb2xsKCk6IHZvaWQge1xuICAgIGlmIChoZWFsUG9sbFRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChoZWFsUG9sbFRpbWVyKTtcbiAgICAgICAgaGVhbFBvbGxUaW1lciA9IG51bGw7XG4gICAgfVxufVxuXG4vKipcbiAqIOS4u+WKqOinpuWPkeS4gOasoea1j+iniOWZqOeDremHjei9ve+8iOWOu+aKlu+8ieOAglxuICog5L6b5omp5bGV5a6/5Li75pig5bCEIENyZWF0b3Ig55qE6aKE6KeI5Yi35paw5L+h5Y+377yIcHJldmlldy9yZWxvYWQtdGVybWluYWzjgIFzY2VuZS9zb2Z0LXJlbG9hZO+8ieS9v+eUqOOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclByZXZpZXdSZWxvYWQoKTogdm9pZCB7XG4gICAgc2NoZWR1bGVSZWxvYWQoKTtcbn1cblxuLyoqXG4gKiBzZXR0aW5ncy5qcyDor7fmsYLlj5HnjrDpooTop4jmnKrlsLHnu6rvvIjov5Tlm54gNTAz77yJ5pe277yM55SxIGdhbWUtcHJldmlldyDkuK3pl7Tku7bosIPnlKjjgIJcbiAqXG4gKiDov5nmmK/pppbmrKHlsLHnu6roh6rmhIjnmoQqKuS4u+inpuWPkeeCuSoq77ya5Lul44CM56Gu5a6e5Y+R55Sf6L+HIDUwM++8iOehruaciemihOiniOmhtSBib290IOWksei0pe+8ieOAjeS4uuS+neaNru+8jOWQjOatpeagh+iusFxuICogcGVuZGluZ0hlYWwg5bm26LW35YWc5bqV6L2u6K+i77yMc2V0dGluZ3Mg6aaW5qyh55yf5q2j5Y+v55So5pe25bm/5pKtIGJyb3dzZXI6cmVsb2FkIOaKiuivpemhteWIt+aWsOaVkeWbnuOAglxuICpcbiAqIOS4uuS7gOS5iOS4jeS+nei1liBzb2NrZXQg6L+e5o6l5pe25bqP5p2l5Yik5a6a44CM5pyJ6aG16Z2i5b6F6Ieq5oSI44CN77ya6L+e5o6l5aSE55CG5Zmo6YeM55qE5byC5q2l5bCx57uq5o6i5rWL5Y+v6IO95oGw5aW96Leo6LaKXG4gKiDliJ3lp4vljJblrozmiJDovrnnlYzigJTigJTmjqLmtYvlj5Hotbfml7bmnKrlsLHnu6rjgIHov5Tlm57ml7blt7LlsLHnu6rvvIzkuo7mmK/moIforrAgaGVhbGVkIOWNtOWboCBwZW5kaW5nSGVhbCDlsJrmnKrnva7kvY3ogIxcbiAqIOa8j+aOieW5v+aSre+8jOmhtemdoiBsb2FkaW5nIOe7k+adn+WNtOS4jeWIt+aWsO+8iOato+aYr+ivpSBidWcg55qE546w6LGh77yJ44CC5pS555SxIDUwMyDlkIzmraXnva7kvY3vvIzlvbvlupXop4Tpgb/or6Xnq57mgIHjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vdGVQcmV2aWV3Tm90UmVhZHkoKTogdm9pZCB7XG4gICAgaWYgKCFyZWdpc3RlcmVkIHx8IGhlYWxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghcGVuZGluZ0hlYWwpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tMaXZlUmVsb2FkXSBzZXR0aW5ncy5qcyDov5Tlm54gNTAz77yI6aKE6KeI6aG15pyq5bCx57uq77yJ77yM5bCx57uq5ZCO5bCG5bm/5pKtIGJyb3dzZXI6cmVsb2FkIOiHquaEiCcpO1xuICAgIH1cbiAgICBwZW5kaW5nSGVhbCA9IHRydWU7XG4gICAgc3RhcnRIZWFsUG9sbCgpO1xufVxuXG4vKipcbiAqIOazqOWGjOeDremHjei9veebkeWQrOOAguS7heeUn+aViOS4gOasoeOAglxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXJMaXZlUmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChyZWdpc3RlcmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVnaXN0ZXJlZCA9IHRydWU7XG4gICAgaGVhbGVkID0gZmFsc2U7XG4gICAgcGVuZGluZ0hlYWwgPSBmYWxzZTtcbiAgICBoZWFsQXR0ZW1wdHMgPSAwO1xuICAgIGF3YWl0aW5nU29ja2V0cy5jbGVhcigpO1xuXG4gICAgY29uc3QgeyBkZWZhdWx0OiBzY3JpcHRpbmcgfSA9IGF3YWl0IGltcG9ydCgnLi4vc2NyaXB0aW5nJyk7XG4gICAgY29uc3QgeyBhc3NldERCTWFuYWdlciwgYXNzZXRNYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2Fzc2V0cycpO1xuICAgIGNvbnN0IHsgY29uZmlndXJhdGlvbk1hbmFnZXIgfSA9IGF3YWl0IGltcG9ydCgnLi4vY29uZmlndXJhdGlvbicpO1xuICAgIGNvbnN0IHsgTWVzc2FnZVR5cGUgfSA9IGF3YWl0IGltcG9ydCgnLi4vY29uZmlndXJhdGlvbi9zY3JpcHQvaW50ZXJmYWNlJyk7XG5cbiAgICBvbkNvbXBpbGVkID0gKCkgPT4gc2NoZWR1bGVSZWxvYWQoKTtcbiAgICBvblJlZnJlc2hGaW5pc2ggPSAoKSA9PiBzY2hlZHVsZVJlbG9hZCgpO1xuICAgIC8vIOWNleS4qui1hOa6kOWPmOabtO+8iOWmguS/neWtmOWcuuaZryA9IC5zY2VuZSBhc3NldC1jaGFuZ2XjgIHnvJbovpHmnZDotKgv6aKE5Yi25L2T562J77yJ44CCXG4gICAgLy8gYXNzZXRzOnJlZnJlc2gtZmluaXNoIOWPquWcqOaVtOaJueWIt+aWsOaXtuinpuWPke+8jOS/neWtmOWNleS4quWcuuaZr+i1sOeahOaYr+mAkOi1hOa6kCBhc3NldC1jaGFuZ2XvvIxcbiAgICAvLyDkuI3nm5HlkKzlsLHkvJrlh7rnjrDigJzmlLnlrowv5a2Y5a6M5Zy65pmv77yM5rWP6KeI5Zmo6aKE6KeI5LiN6YeN6L294oCd44CC5pyJIDIwMG1zIOWOu+aKlu+8jOaJuemHj+WvvOWFpeS8muWQiOW5tuaIkOS4gOasoeOAglxuICAgIG9uQXNzZXRDaGFuZ2VkID0gKCkgPT4gc2NoZWR1bGVSZWxvYWQoKTtcbiAgICAvLyDotYTmupDmibnph4/liLfmlrDnu5PmnZ/vvJroh6rmhIjliY3nlKjkvZzlsLHnu6rmjqLmtYvop6blj5HvvJvoh6rmhIjlkI7kvZzkuLrluLjop4Tng63ph43ovb3kv6Hlj7fjgIJcbiAgICBvblJlZnJlc2hGaW5pc2ggPSAoKSA9PiB7XG4gICAgICAgIGlmICghaGVhbGVkKSB7XG4gICAgICAgICAgICB2b2lkIHRyeUhlYWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjaGVkdWxlUmVsb2FkKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8g5bel56iL6YWN572u5Y+Y5pu077yI5aaC5YiH5o2i54mp55CG5ZCO56uvID0g5pS5IGVuZ2luZS5pbmNsdWRlTW9kdWxlc++8ieS8muW9seWTjemihOiniCBzZXR0aW5nc++8jFxuICAgIC8vIOmcgOa4hee8k+WtmOW5tumHjei9ve+8jOWQpuWImemihOiniOS7jeeUqOaXp+aooeWdl+mbhu+8iOa8j+aOieaWsOWQjuerr+eahOWGhee9rui1hOa6kO+8jOaKpSBidWlsdGluTWF0ZXJpYWwg5Yqg6L295aSx6LSl77yJ44CCXG4gICAgb25Db25maWdDaGFuZ2VkID0gKCkgPT4gc2NoZWR1bGVSZWxvYWQoKTtcbiAgICAvLyDlkK/liqjmnJ/otYTmupDkuovku7bvvJrku4XlnKjlsJrmnKroh6rmhIjml7bnlKjkuo7lsLHnu6rmjqLmtYvjgIJcbiAgICBvbkFzc2V0RXZlbnQgPSAoKSA9PiB7XG4gICAgICAgIGlmICghaGVhbGVkKSB7XG4gICAgICAgICAgICB2b2lkIHRyeUhlYWwoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2NyaXB0aW5nUmVmID0gc2NyaXB0aW5nIGFzIGFueTtcbiAgICBhc3NldERCUmVmID0gYXNzZXREQk1hbmFnZXIgYXMgYW55O1xuICAgIGFzc2V0TWdyUmVmID0gYXNzZXRNYW5hZ2VyIGFzIGFueTtcbiAgICBjb25maWdSZWYgPSBjb25maWd1cmF0aW9uTWFuYWdlciBhcyBhbnk7XG5cbiAgICAvLyDohJrmnKzph43nvJbor5HmiJDlip9cbiAgICBzY3JpcHRpbmcub24oJ2NvbXBpbGVkJywgb25Db21waWxlZCk7XG4gICAgLy8g6LWE5rqQ5om56YeP5Yi35paw57uT5p2fXG4gICAgYXNzZXREQk1hbmFnZXIub24oJ2Fzc2V0czpyZWZyZXNoLWZpbmlzaCcsIG9uUmVmcmVzaEZpbmlzaCk7XG4gICAgLy8g5Y2V5Liq6LWE5rqQ5aKe5Yig5pS577yI5ZCr5L+d5a2Y5Zy65pmv77yJXG4gICAgYXNzZXRNYW5hZ2VyLm9uKCdhc3NldC1jaGFuZ2UnLCBvbkFzc2V0Q2hhbmdlZCk7XG4gICAgYXNzZXRNYW5hZ2VyLm9uKCdhc3NldC1hZGQnLCBvbkFzc2V0Q2hhbmdlZCk7XG4gICAgYXNzZXRNYW5hZ2VyLm9uKCdhc3NldC1kZWxldGUnLCBvbkFzc2V0Q2hhbmdlZCk7XG5cbiAgICAvLyDlkK/liqjmnJ/lsLHnu6rnm7jlhbPkuovku7bvvIjliJ3mrKHlu7rlupMgLyDlkITlupPlsLHnu6rvvInvvIzpqbHliqjpppbmrKHlsLHnu6rmjqLmtYtcbiAgICBhc3NldERCTWFuYWdlci5vbignYXNzZXRzOnJlYWR5Jywgb25Bc3NldEV2ZW50KTtcbiAgICBhc3NldERCTWFuYWdlci5vbignYXNzZXRzOmRiLXJlYWR5Jywgb25Bc3NldEV2ZW50KTtcblxuICAgIC8vIOW3peeoi+mFjee9ruWPmOabtO+8iHNldCAvIHJlbG9hZO+8iVxuICAgIGNvbmZpZ3VyYXRpb25NYW5hZ2VyLm9uKE1lc3NhZ2VUeXBlLlVwZGF0ZSwgb25Db25maWdDaGFuZ2VkKTtcbiAgICBjb25maWd1cmF0aW9uTWFuYWdlci5vbihNZXNzYWdlVHlwZS5SZWxvYWQsIG9uQ29uZmlnQ2hhbmdlZCk7XG5cbiAgICAvLyDpppbmrKHlsLHnu6roh6rmhIjvvIjkuovku7bpqbHliqjvvIzml6DpnIDmiYvliqjliLfmlrDvvInvvJpcbiAgICAvLyBJREUg5bi46am7IHNlcnZlciDmqKHlvI/kuIvvvIznlKjmiLflj6/og73lnKggQ0xJIOWIneWni+WMlu+8iGFzc2V0LWRiIOW7uuW6kyArIOWGhee9rui1hOa6kOWvvOWFpe+8jOe6piAxIOWIhumSn++8iVxuICAgIC8vIOWujOaIkOWJjeWwseaJk+W8gOmihOiniOmhte+8jHNldHRpbmdzLmpzIOi/lOWbniA1MDMvNTAw44CB6aaW5bGPIGJvb3Qg5aSx6LSl44CC6aKE6KeI6aG15Zyo5Yqg6L295YmN5bey5rOo5YaMIHNvY2tldFxuICAgIC8vIGJyb3dzZXI6cmVsb2FkIOebkeWQrO+8iOingSBzdGF0aWMvd2ViL2dhbWUuZWpz77yJ77yM5bm25ZyoIHNldHRpbmdzLmpzIOWKoOi9veWksei0peaXtuS6juavj+asoSjph40p6L+e5o6l5LiK5oqlXG4gICAgLy8gcHJldmlldzphd2FpdGluZy1yZWxvYWTjgILov5nph4zkuLrmr4/kuKrov57kuIrnmoQgc29ja2V0IOaMguS4iuivpeS4iuaKpeeahOWkhOeQhu+8mlxuICAgIC8vICAg5bey5bCx57uqIOKGkiDnm7TmjqXku6Tov5nlj6ogc3R1Y2sg6aG15Yi35paw77yI5a6D5LiA5Yi35paw5Y2z5Y+W5YiwIDIwMOOAgWJvb3Qg5q2j5bi477yJ77ybXG4gICAgLy8gICDmnKrlsLHnu6og4oaSIOeZu+iusOW+heiHquaEiOW5tui1t+WFnOW6lei9ruivou+8jHNldHRpbmdzIOmmluasoeecn+ato+WPr+eUqOaXtuWumuWQkSBlbWl0IGJyb3dzZXI6cmVsb2Fk44CCXG4gICAgLy8g5a6i5oi356uv5Zyo5q+P5qyhKOmHjSnov57pg73ph43miqXvvIzmlYXkuI7ov57mjqXml7bmnLrlvbvlupXop6PogKbvvJrliJ3lp4vljJbmnJ/mjonnur/ph43ov57jgIHmiJblpJrkuKrpooTop4jpobVcbiAgICAvLyDvvIhDaHJvbWUgKyBJREUgd2Vidmlld++8iei/nuaOpeaXtuacuuS4jeWQjO+8jOmDveiDveWQhOiHquiiq+WPr+mdoOaVkeWbnu+8jOS4jeWGjeS+nei1luafkOS4gOeerOeahOW5v+aSreOAglxuICAgIG9uU29ja2V0Q29ubmVjdGlvbiA9IChzb2NrZXQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoIXNvY2tldCB8fCB0eXBlb2Ygc29ja2V0Lm9uICE9PSAnZnVuY3Rpb24nIHx8IHNvY2tldC5fX2xyQm91bmQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzb2NrZXQuX19sckJvdW5kID0gdHJ1ZTsgLy8g6Ziy6YeN5aSN5oyC6L2977yIY29ubmVjdGlvbiDkuovku7bkuI7jgIzms6jlhozml7booaXmjILlt7Lov54gc29ja2V044CN5Y+v6IO96YO95ZG95Lit77yJXG4gICAgICAgIC8vIOW3suehruiupOWkhOS6juWIneWni+WMlueql+WPo++8iHBlbmRpbmdIZWFsIOW3sue9ruS9je+8ieS4lOWwmuacquiHquaEiOaXtu+8jOaWsOi/nuS4iueahOmihOiniOmhteatpOWIu+ivt+axgiBzZXR0aW5ncy5qc1xuICAgICAgICAvLyDlkIzmoLfkvJogNTAz44CBYm9vdCDlpLHotKXigJTigJTnm7TmjqXpooTliKTkuLrlvoXoh6rmhIjpobXnmbvorrDvvIzlsLHnu6rml7bkuIDlubblrprlkJHliLfmlrDvvIzkuI3lv4XnrYnlroPoh6rlt7HkuIrmiqXliLDovr7jgIJcbiAgICAgICAgY29uc3QgcHJlc3VtZWQgPSAhaGVhbGVkICYmIHBlbmRpbmdIZWFsO1xuICAgICAgICBpZiAocHJlc3VtZWQpIHtcbiAgICAgICAgICAgIGF3YWl0aW5nU29ja2V0cy5hZGQoc29ja2V0KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgW0xpdmVSZWxvYWRdIOmihOiniCBzb2NrZXQg5oyC6L2977yIaGVhbGVkPSR7aGVhbGVkfSBwZW5kaW5nSGVhbD0ke3BlbmRpbmdIZWFsfSDpooTliKRzdHVjaz0ke3ByZXN1bWVkfe+8iWApO1xuICAgICAgICBzb2NrZXQub24oJ3ByZXZpZXc6YXdhaXRpbmctcmVsb2FkJywgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGhlYWxlZCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KCdicm93c2VyOnJlbG9hZCcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwZW5kaW5nSGVhbCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTGl2ZVJlbG9hZF0g6aKE6KeI6aG15LiK5oqlIGJvb3Qg5aSx6LSl77yIc2V0dGluZ3Mg5pyq5bCx57uq77yJ77yM5bCx57uq5ZCO5bCG5a6a5ZCR5Yi35paw6Ieq5oSIJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZW5kaW5nSGVhbCA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdGluZ1NvY2tldHMuYWRkKHNvY2tldCk7XG4gICAgICAgICAgICBzdGFydEhlYWxQb2xsKCk7XG4gICAgICAgICAgICB2b2lkIHRyeUhlYWwoKTsgLy8g5Lmf6K645q2k5Yi75oGw5aW95bCx57uqXG4gICAgICAgIH0pO1xuICAgICAgICBzb2NrZXQub24oJ2Rpc2Nvbm5lY3QnLCAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdGluZ1NvY2tldHMuZGVsZXRlKHNvY2tldCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgc29ja2V0U2VydmljZS5pbz8ub24oJ2Nvbm5lY3Rpb24nLCBvblNvY2tldENvbm5lY3Rpb24pO1xuICAgIC8vIOihpeaMguOAjOazqOWGjOWJjeWwseW3sui/nuS4iuOAjeeahCBzb2NrZXTvvJrlkK/liqjpobrluo/kuLogc2VydmVyIOi1t+adpSDihpLvvIjpobXpnaLooqvmnI3liqHjgIHmtY/op4jlmaggc29ja2V0IOi/nuS4iu+8iVxuICAgIC8vIOKGkiDmiY3ova7liLAgcmVnaXN0ZXJMaXZlUmVsb2FkIOaMguS4iiBjb25uZWN0aW9uIOebkeWQrOOAgua1j+iniOWZqOaXqeS6juacrOebkeWQrOaMguS4iuWJjeaJk+W8gC/ph43ov57ml7bvvIzkvJrplJnov4dcbiAgICAvLyBjb25uZWN0aW9uIOS6i+S7tu+8jOWFtummluasoSBwcmV2aWV3OmF3YWl0aW5nLXJlbG9hZCDkuIrmiqXlm6Dml6DlpITnkIblmajogIzkuKLlpLHjgILov5nph4zkuLrlt7LlnKjlhoznmoQgc29ja2V0XG4gICAgLy8g6KGl5oyC5aSE55CG5Zmo77yb6YWN5ZCI5a6i5oi356uv44CM5aSx6LSl5oCB5ZGo5pyf5oCn6YeN5oql44CN77yI6KeBIGdhbWUuZWpz77yJ77yM6KGl5oyC5ZCO55qE6YeN5oql5Y2z5Y+v6KKr55m76K6w6Ieq5oSI44CCXG4gICAgY29uc3QgYWRvcHQgPSBvblNvY2tldENvbm5lY3Rpb247XG4gICAgY29uc3QgZXhpc3RpbmdTb2NrZXRzID0gKHNvY2tldFNlcnZpY2UuaW8gYXMgYW55KT8uc29ja2V0cz8uc29ja2V0cztcbiAgICBleGlzdGluZ1NvY2tldHM/LmZvckVhY2g/Ligoc29ja2V0OiBhbnkpID0+IGFkb3B0KHNvY2tldCkpO1xuXG4gICAgLy8g5YWz6ZSu77ya5rOo5YaM5pe25py65Zyo5ZCv5Yqo5bC+6YOo44CC5pyq5bCx57uq5pyf77yIQ0xJIOWIneWni+WMlu+8jOe6piAxIOWIhumSn++8ieaJk+W8gOeahOmihOiniOmhte+8jOWFtiBzZXR0aW5ncy5qcyDml6nlt7JcbiAgICAvLyA1MDPjgIFib290IOWksei0pe+8jOS9huatpOaXtu+8mlxuICAgIC8vICAgMSkg6YKj5qyhIDUwMyDlj5HnlJ/lnKggcmVnaXN0ZXJlZD1mYWxzZSDml7bvvIxub3RlUHJldmlld05vdFJlYWR5IOebtOaOpSByZXR1cm7vvIxwZW5kaW5nSGVhbCDmnKrnva7kvY3vvJtcbiAgICAvLyAgIDIpIOmpseWKqOWwsee7quaOoua1i+eahOaJuemHj+i1hOa6kOS6i+S7tu+8iGFzc2V0czpyZWZyZXNoLWZpbmlzaCAvIGFzc2V0czpyZWFkee+8ieWkp+WkmuWcqOazqOWGjOWJjeWwseinpuWPkeWujOavle+8jFxuICAgIC8vICAgICAg5rOo5YaM5ZCO5b6A5b6A5YaN5peg5LqL5Lu25p2l6Kem5Y+RIHRyeUhlYWzvvJtcbiAgICAvLyAgIDMpIOmCo+S6m+mhteWPkeWHuueahCBwcmV2aWV3OmF3YWl0aW5nLXJlbG9hZCDlpJrlnKjmnKznm5HlkKzmjILkuIrliY3kuKLlpLHvvIzlrqLmiLfnq6/ph43miqXmmK/lkKblj4rml7bliLDovr7lubbkuI3lj6/pnaDjgIJcbiAgICAvLyDlm6DmraTov5nph4zlnKjms6jlhozml7YqKuS4u+WKqOaOoua1i+S4gOasoeWwsee7qioq77ya6Iul5q2k5Yi75LuN5pyq5bCx57uq77yI56Gu5Zyo5Yid5aeL5YyW56qX5Y+j5YaF77yJ77yM5bCx5oqK44CM5rOo5YaM5YmN5bey6L+e5LiK55qEXG4gICAgLy8g5omA5pyJ6aKE6KeI6aG144CN55u05o6l6aKE5Yik5Li6562J5b6F6Ieq5oSI6aG15bm26LW35YWc5bqV6L2u6K+i4oCU4oCUc2V0dGluZ3Mg6aaW5qyh55yf5q2j5Y+v55So5pe25a6a5ZCR5Yi35paw5a6D5Lus77yM5a6M5YWo55Sx5pyN5Yqh56uvXG4gICAgLy8g6amx5Yqo77yM5LiN5L6d6LWW5a6i5oi356uv5LiK5oql55qE5pe25py644CC77yI5bey5bCx57uq5YiZ6K+05piO5Yid5aeL5YyW5pep5bey5a6M5oiQ77yM5q2k5ZCO5paw5byA6aG16YO95LyaIGJvb3Qg5q2j5bi477yM5peg6ZyA6Ieq5oSI44CC77yJXG4gICAgLy8g5o6i5rWL5pys6Lqr5YyF6KO5IHRyeS9jYXRjaO+8muS7u+S9leW8guW4uOmDveS4jeW+l+S4reaWremihOiniOazqOWGjO+8iOWQpuWImeaVtOS4qiBzY2VuZSBpbml0IOS8muaKm+mUme+8ieOAglxuICAgIGxldCByZWFkeUF0UmVnaXN0ZXIgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICByZWFkeUF0UmVnaXN0ZXIgPSBhd2FpdCBpc1ByZXZpZXdTZXR0aW5nc1JlYWR5KCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW0xpdmVSZWxvYWRdIOazqOWGjOaXtuWwsee7quaOoua1i+W8guW4uO+8jOaMieacquWwsee7quWkhOeQhu+8micsIGVycik7XG4gICAgICAgIHJlYWR5QXRSZWdpc3RlciA9IGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBzb2NrZXRDb3VudEF0UmVnaXN0ZXIgPSAoc29ja2V0U2VydmljZS5pbyBhcyBhbnkpPy5zb2NrZXRzPy5zb2NrZXRzPy5zaXplID8/IDA7XG4gICAgY29uc29sZS5sb2coYFtMaXZlUmVsb2FkXSDms6jlhozlrozmiJDvvJpzZXR0aW5ncyAke3JlYWR5QXRSZWdpc3RlciA/ICflt7LlsLHnu6onIDogJ+acquWwsee7qid977yM5b2T5YmN5bey6L+e5o6lIHNvY2tldCAke3NvY2tldENvdW50QXRSZWdpc3Rlcn0g5LiqYCk7XG4gICAgaWYgKHJlYWR5QXRSZWdpc3Rlcikge1xuICAgICAgICBoZWFsZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIOehruWcqOWIneWni+WMlueql+WPo+WGhe+8mui1t+WFnOW6lei9ruivou+8jOW5tuaKiuatpOWIu+W3sui/nuS4iueahOmihOiniOmhtemihOWIpOS4uuW+heiHquaEiOmhteOAglxuICAgICAgICBwZW5kaW5nSGVhbCA9IHRydWU7XG4gICAgICAgIGNvbnN0IHN0dWNrU29ja2V0cyA9IChzb2NrZXRTZXJ2aWNlLmlvIGFzIGFueSk/LnNvY2tldHM/LnNvY2tldHM7XG4gICAgICAgIGlmIChzdHVja1NvY2tldHMgJiYgc3R1Y2tTb2NrZXRzLnNpemUgPiAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0xpdmVSZWxvYWRdIOazqOWGjOaXtumihOiniOWwmuacquWwsee7qu+8jOmihOWIpCAke3N0dWNrU29ja2V0cy5zaXplfSDkuKrlt7Lov57mjqXpooTop4jpobXkuLrlvoXoh6rmhIjvvIzlsLHnu6rlkI7lsIbliLfmlrBgKTtcbiAgICAgICAgICAgIHN0dWNrU29ja2V0cy5mb3JFYWNoKChzb2NrZXQ6IGFueSkgPT4gYXdhaXRpbmdTb2NrZXRzLmFkZChzb2NrZXQpKTtcbiAgICAgICAgfVxuICAgICAgICBzdGFydEhlYWxQb2xsKCk7XG4gICAgfVxufVxuXG4vKipcbiAqIOazqOmUgOeDremHjei9veebkeWQrOW5tua4heeQhuWOu+aKluWumuaXtuWZqOOAgumihOiniOWFs+mXreaXtuiwg+eUqO+8jOmBv+WFjeWQjOi/m+eoi+WGhemHjeWQr+mihOiniOaXtuebkeWQrC/lrprml7blmajms4TmvI/jgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVucmVnaXN0ZXJMaXZlUmVsb2FkKCk6IHZvaWQge1xuICAgIGlmICghcmVnaXN0ZXJlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aW1lcikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICB0aW1lciA9IG51bGw7XG4gICAgfVxuICAgIHN0b3BIZWFsUG9sbCgpO1xuICAgIHJlbW92ZUxpc3RlbmVyKHNjcmlwdGluZ1JlZiwgJ2NvbXBpbGVkJywgb25Db21waWxlZCk7XG4gICAgcmVtb3ZlTGlzdGVuZXIoYXNzZXREQlJlZiwgJ2Fzc2V0czpyZWZyZXNoLWZpbmlzaCcsIG9uUmVmcmVzaEZpbmlzaCk7XG4gICAgcmVtb3ZlTGlzdGVuZXIoYXNzZXRNZ3JSZWYsICdhc3NldC1jaGFuZ2UnLCBvbkFzc2V0Q2hhbmdlZCk7XG4gICAgcmVtb3ZlTGlzdGVuZXIoYXNzZXRNZ3JSZWYsICdhc3NldC1hZGQnLCBvbkFzc2V0Q2hhbmdlZCk7XG4gICAgcmVtb3ZlTGlzdGVuZXIoYXNzZXRNZ3JSZWYsICdhc3NldC1kZWxldGUnLCBvbkFzc2V0Q2hhbmdlZCk7XG5cbiAgICByZW1vdmVMaXN0ZW5lcihhc3NldERCUmVmLCAnYXNzZXRzOnJlYWR5Jywgb25Bc3NldEV2ZW50KTtcbiAgICByZW1vdmVMaXN0ZW5lcihhc3NldERCUmVmLCAnYXNzZXRzOmRiLXJlYWR5Jywgb25Bc3NldEV2ZW50KTtcblxuICAgIC8vIE1lc3NhZ2VUeXBlLlVwZGF0ZSAvIE1lc3NhZ2VUeXBlLlJlbG9hZFxuICAgIHJlbW92ZUxpc3RlbmVyKGNvbmZpZ1JlZiwgJ2NvbmZpZ3VyYXRpb246dXBkYXRlJywgb25Db25maWdDaGFuZ2VkKTtcbiAgICByZW1vdmVMaXN0ZW5lcihjb25maWdSZWYsICdjb25maWd1cmF0aW9uOnJlbG9hZCcsIG9uQ29uZmlnQ2hhbmdlZCk7XG4gICAgLy8g6Kej57uRIHNvY2tldCDov57mjqXpkqnlrZBcbiAgICBpZiAob25Tb2NrZXRDb25uZWN0aW9uKSB7XG4gICAgICAgIHNvY2tldFNlcnZpY2UuaW8/Lm9mZignY29ubmVjdGlvbicsIG9uU29ja2V0Q29ubmVjdGlvbik7XG4gICAgfVxuICAgIGF3YWl0aW5nU29ja2V0cy5jbGVhcigpO1xuICAgIHNjcmlwdGluZ1JlZiA9IG51bGw7XG4gICAgYXNzZXREQlJlZiA9IG51bGw7XG4gICAgYXNzZXRNZ3JSZWYgPSBudWxsO1xuICAgIGNvbmZpZ1JlZiA9IG51bGw7XG4gICAgb25Db21waWxlZCA9IG51bGw7XG4gICAgb25SZWZyZXNoRmluaXNoID0gbnVsbDtcbiAgICBvbkFzc2V0Q2hhbmdlZCA9IG51bGw7XG4gICAgb25Db25maWdDaGFuZ2VkID0gbnVsbDtcbiAgICBvbkFzc2V0RXZlbnQgPSBudWxsO1xuICAgIG9uU29ja2V0Q29ubmVjdGlvbiA9IG51bGw7XG4gICAgaGVhbGluZyA9IGZhbHNlO1xuICAgIGhlYWxlZCA9IGZhbHNlO1xuICAgIHBlbmRpbmdIZWFsID0gZmFsc2U7XG4gICAgaGVhbEF0dGVtcHRzID0gMDtcbiAgICByZWdpc3RlcmVkID0gZmFsc2U7XG59XG4iXX0=