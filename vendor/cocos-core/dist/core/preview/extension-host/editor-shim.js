"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installEditorShim = installEditorShim;
const uuid_1 = require("../../base/utils/uuid");
const editor_shim_1 = require("../../base/editor-shim");
/**
 * 安装 Node 侧的 `global.Editor` 垫片，供项目扩展的主进程/server 代码在 CLI 里运行。
 * 仅覆盖扩展实际用到的子集（以 localization-editor 为基准），随需增长。
 * 同一会话单例：重复安装只刷新 Project.path。
 *
 * 必须在 require 任何扩展模块之前安装：扩展 bundle 在模块求值期就会访问 Editor.Project.path。
 */
function installEditorShim(ctx) {
    const g = globalThis;
    if (g.Editor && g.Editor.__cliExtensionHost) {
        (0, editor_shim_1.ensureEditorProjectPath)(ctx.projectPath);
        return;
    }
    g.Editor = {
        __cliExtensionHost: true,
        Project: {},
        Message: {
            request: (domain, message, ...args) => ctx.bus.dispatch(domain, message, ...args),
            send: (domain, message, ...args) => { void ctx.bus.dispatch(domain, message, ...args); },
            broadcast: () => { },
        },
        Profile: {
            getProject: ctx.profileStore.getProject,
            setProject: ctx.profileStore.setProject,
            removeProject: ctx.profileStore.removeProject,
            getConfig: ctx.profileStore.getConfig,
            setConfig: ctx.profileStore.setConfig,
            removeConfig: ctx.profileStore.removeConfig,
        },
        I18n: { t: (key) => key },
        Utils: {
            UUID: {
                compressUUID: (uuid, min) => (0, uuid_1.compressUUID)(uuid, !!min),
                decompressUUID: (uuid) => (0, uuid_1.decompressUUID)(uuid),
            },
        },
        Metrics: { trackEvent: () => { } },
        Panel: { open: () => { }, close: () => { } },
    };
    (0, editor_shim_1.ensureEditorProjectPath)(ctx.projectPath);
}
