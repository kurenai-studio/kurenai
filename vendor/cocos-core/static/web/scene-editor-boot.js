/* global System, globalThis */

import { loadEngine } from '/static/web/engine-loader.js';

/**
 * 场景编辑器预览引导。
 *
 * 引擎加载流程与浏览器游戏预览的 game-boot.js 共用 engine-loader.js；区别在于这里以默认
 * 编辑器模式加载（不覆盖 CC_EDITOR/CC_PREVIEW），并在结尾加载 scene-bundle 启动场景服务，
 * 而不是运行游戏。
 */
export default async function boot() {
    try {
        const env = await loadEngine();

        const _originalSystem = System;
        console.log('[Scene] loading scene bundle');
        // SystemJS natively awaits the attached import maps above
        const SceneBundle = await System.import('/static/web/scene-bundle.js');
        const { startup, Service } = SceneBundle;

        globalThis.System = _originalSystem;
        await startup({
            enginePath: env.enginePath,
            serverURL: env.serverURL,
        });

        Service?.Engine?.resume?.();
        console.log('Cocos Engine and Scene Services loaded successfully');
    } catch (err) {
        console.error('Failed to load Cocos Engine or Services:', err.stack || err);
    }
}
