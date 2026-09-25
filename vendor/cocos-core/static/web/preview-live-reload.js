/* global window, location, console */

/**
 * 预览热重载「接收端」：注册 socket.io 的 `browser:reload` 监听，收到即整页刷新。
 *
 * 两个消费者共用同一份实现，避免逻辑重复、行为漂移：
 *   - static/web/game.ejs   —— 浏览器游戏预览首屏，以 classic `<script src>` 引入（早于 settings.js）；
 *   - static/web/game-boot.js —— IDE（PinK）webview 宿主页直接加载的引导脚本，以 `import()` 副作用引入。
 * 本文件不含 import/export，既是合法的 classic 脚本、也是合法的 ES module（两种加载方式都执行下方 IIFE）。
 *
 * 为什么监听要尽早装好：CLI 未初始化完成时 settings.js 返回 503、首屏 boot 失败；若把监听留到 boot
 * 成功后再注册，失败的首屏就永远收不到 browser:reload、无法自愈。服务端在预览 settings 首次就绪时会向
 * 所有连接广播 browser:reload（见 core/preview/live-reload.ts），本页据此整页刷新，无需手动刷新。
 *
 * 幂等：以 window.__previewSocket 作唯一 socket 守卫。浏览器路径下 game.ejs 已用 `<script src>` 引入并置位，
 * game-boot.js 便据此跳过 import；即使两种方式都加载了本文件，也只建立一条连接。
 * serverURL：优先取宿主注入的 window.WebEnv.serverURL，缺省回退同源（window.io()）。
 *
 * 注意：本文件只负责「接收刷新」这半边（两条路径完全一致，适合共用）。game.ejs 另有「上报端」逻辑
 * （settings.js 503 时上报 preview:awaiting-reload 并周期重报），因其强依赖 game.ejs 首屏「早于 settings.js」
 * 的脚本时序、且依赖 settings.js onerror 置 __previewSettingsFailed，故保留在 game.ejs 内联、不纳入本文件。
 */
(function () {
    try {
        if (!window.io || window.__previewSocket) {
            return;
        }
        var serverURL = (window.WebEnv && window.WebEnv.serverURL) || undefined;
        var socket = serverURL ? window.io(serverURL) : window.io();
        window.__previewSocket = socket;
        socket.on('browser:reload', function () {
            location.reload();
        });
    } catch (e) {
        console.warn('[Game Preview] live-reload socket unavailable:', e);
    }
})();
