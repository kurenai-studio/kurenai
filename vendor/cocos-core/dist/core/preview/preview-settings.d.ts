import type { IPreviewSettingsResult } from '../builder/@types/private';
/**
 * 预览尚未就绪时抛出。路由据此返回可重试的 503，而不是生成缺 builtinAssets 的坏 settings 或裸 500。
 *
 * 「就绪」不能只看 assetDBManager.ready：该标志在 asset-db.start() 里被置位（asset-db.ts:139）
 * 后才 step() 继续导入，内置资源库 / 内置 bundle（builtinAssets 的来源，见 builder
 * setting-task/asset.ts:52 的 bundleMap[INTERNAL]._rootAssets）可能尚未完全就绪。此时
 * getPreviewSettings 要么抛错（bundleMap[INTERNAL] 缺失）→ 裸 500，要么产出 builtinAssets 为空
 * 的坏 settings → 运行时 "PhysicsSystem initDefaultMaterial Failed to load builtinMaterial" /
 * "Graphics recompileShaders of null"。因此这里以**内容校验**为准：生成失败或 builtinAssets 为空
 * 都视为未就绪，抛本错误（映射 503）且**不缓存**。
 *
 * 自愈机制（不依赖客户端手动刷新）：预览页在加载 settings/引擎之前就注册了 socket
 * `browser:reload` 监听（见 static/web/game.ejs）。未就绪时本次请求快速失败 503、boot 失败；
 * live-reload 侧监听资源事件，待 settings 首次真正可用（校验通过）时广播 browser:reload，页面
 * 整页刷新完成自愈。
 */
export declare class PreviewNotReadyError extends Error {
    constructor(message?: string);
}
/**
 * 获取（带缓存的）预览 settings。
 * @param startScene 启动场景的 uuid 或 db:// url，留空表示使用项目默认启动场景
 */
export declare function getCachedPreviewSettings(startScene?: string): Promise<IPreviewSettingsResult>;
export declare function getCachedSceneEditorSettings(): Promise<IPreviewSettingsResult>;
/**
 * 探测预览 settings 是否已可用（校验通过并已写入缓存）。供 live-reload 在资源事件后判定「首次就绪」。
 * 返回 true 表示可用（缓存已预热）；未就绪返回 false；其它非就绪类异常向上抛出。
 */
export declare function isPreviewSettingsReady(startScene?: string): Promise<boolean>;
/**
 * 清空预览 settings 缓存。脚本重编译或资源变化后调用。
 */
export declare function invalidatePreviewSettings(): void;
