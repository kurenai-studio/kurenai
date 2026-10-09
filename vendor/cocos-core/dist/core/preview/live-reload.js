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
