import { MessageBus } from './message-bus';
import { ProfileStore } from './profile-store';
export interface EditorShimContext {
    projectPath: string;
    bus: MessageBus;
    profileStore: ProfileStore;
}
/**
 * 安装 Node 侧的 `global.Editor` 垫片，供项目扩展的主进程/server 代码在 CLI 里运行。
 * 仅覆盖扩展实际用到的子集（以 localization-editor 为基准），随需增长。
 * 同一会话单例：重复安装只刷新 Project.path。
 *
 * 必须在 require 任何扩展模块之前安装：扩展 bundle 在模块求值期就会访问 Editor.Project.path。
 */
export declare function installEditorShim(ctx: EditorShimContext): void;
