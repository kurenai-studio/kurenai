/**
 * 浏览器预览工具栏的会话状态。
 *
 * Creator 通过预览页 socket 的 `changeOption` 事件保存这些选项，并在刷新后的
 * HTML 中再次注入。这里保持同样的「CLI 进程内预览会话」范围：不写入工程配置，
 * 不影响没有启用 previewToolbar 的普通预览。
 */
export type PreviewToolbarOptionName = 'device' | 'rotate' | 'debugMode' | 'showFps';
export interface PreviewToolbarOptions {
    device: string;
    rotate: boolean;
    debugMode: string;
    showFps: boolean;
}
export declare function getPreviewToolbarOptions(): PreviewToolbarOptions;
export declare function setPreviewToolbarOption(name: unknown, value: unknown): boolean;
/** @internal Test-only reset for this process-scoped preview session state. */
export declare function resetPreviewToolbarOptions(): void;
