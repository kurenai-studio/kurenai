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
exports.loadExtensionPreviewHost = loadExtensionPreviewHost;
const scanner_1 = require("./scanner");
const message_bus_1 = require("./message-bus");
const profile_store_1 = require("./profile-store");
const editor_shim_1 = require("./editor-shim");
const extension_loader_1 = require("./extension-loader");
const server_registrar_1 = require("./server-registrar");
/**
 * 通用扩展预览宿主：在 CLI 预览服务器里加载并运行项目扩展自带的 backend 代码
 * （contributions.server 路由 + contributions.messages 处理函数），背后用 Node 侧
 * Editor.* 垫片支撑，对齐 Cocos Creator 编辑器托管扩展的行为。
 *
 * 必须在 register('GamePreview', ...) 之前调用，使扩展的具体路由先于
 * scriptingRoutes 里的宽泛正则注册、从而优先命中。
 */
async function loadExtensionPreviewHost(projectPath) {
    const exts = (0, scanner_1.scanPreviewExtensions)(projectPath);
    if (!exts.length) {
        return { extensions: [], dispose() { } };
    }
    const bus = new message_bus_1.MessageBus();
    const profileStore = new profile_store_1.ProfileStore(projectPath);
    // 先装垫片：扩展 bundle 在模块求值期就会访问 Editor.Project.path
    (0, editor_shim_1.installEditorShim)({ projectPath, bus, profileStore });
    // 1) 先加载所有扩展主进程（注册消息处理 + 各自 load 初始化）
    for (const ext of exts) {
        await (0, extension_loader_1.loadExtensionMain)(ext, bus);
    }
    // 2) 再加载 server 贡献（其路由处理器会经 Editor.Message 回调主进程）
    const routeSets = [];
    const loaded = [];
    for (const ext of exts) {
        const routes = (0, extension_loader_1.loadExtensionServer)(ext);
        if (routes && ((routes.get && routes.get.length) || (routes.post && routes.post.length))) {
            routeSets.push(routes);
            loaded.push(ext.name);
        }
    }
    if (routeSets.length) {
        try {
            const contribution = (0, server_registrar_1.buildMiddlewareContribution)(routeSets);
            const { middlewareService } = await Promise.resolve().then(() => __importStar(require('../../../server/middleware')));
            middlewareService.register('ExtensionPreview', contribution);
            console.log(`[ExtensionHost] registered preview routes from: ${loaded.join(', ')}`);
        }
        catch (err) {
            console.warn('[ExtensionHost] failed to register extension preview routes:', err);
        }
    }
    return {
        extensions: loaded,
        dispose() {
            // 对齐 Creator 的扩展生命周期：销毁时调用各扩展自身的 unload()
            for (const { name, mainModule } of bus.getRegisteredMains()) {
                try {
                    if (typeof mainModule?.unload === 'function') {
                        void mainModule.unload();
                    }
                }
                catch (err) {
                    console.warn(`[ExtensionHost] unload '${name}' failed:`, err);
                }
            }
        },
    };
}
