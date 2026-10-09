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
exports.MessageBus = void 0;
/**
 * Editor.Message 的 CLI 实现：把 `Editor.Message.request(domain, message, ...args)` 路由到：
 * - domain 为已注册扩展名（含扩展自身 self-IPC）：按 contributions.messages 把 message 映射到
 *   主进程导出的方法名，调用扩展自己的处理函数；
 * - domain === 'asset-db'：映射到 CLI 的 assetManager；
 * - domain === 'scene'：最小桩实现；
 * - 其它：告警并返回 undefined（绝不抛出，避免拖垮预览）。
 */
class MessageBus {
    _registry = new Map();
    register(ext, mainModule) {
        this._registry.set(ext.name, { ext, mainModule });
    }
    /** 已注册的扩展主进程模块（供 dispose 时调用各自 unload）。 */
    getRegisteredMains() {
        return Array.from(this._registry.entries()).map(([name, reg]) => ({ name, mainModule: reg.mainModule }));
    }
    async dispatch(domain, message, ...args) {
        try {
            const reg = this._registry.get(domain);
            if (reg) {
                return await this._dispatchExtension(reg, message, args);
            }
            if (domain === 'asset-db') {
                return await this._dispatchAssetDb(message, args);
            }
            if (domain === 'scene') {
                return await this._dispatchScene(message);
            }
            if (domain === 'preview') {
                return this._dispatchPreview(message);
            }
            console.warn(`[ExtensionHost] unhandled Editor.Message.request: ${domain}/${message}`);
            return undefined;
        }
        catch (err) {
            console.warn(`[ExtensionHost] Editor.Message.request ${domain}/${message} failed:`, err);
            return undefined;
        }
    }
    async _dispatchExtension(reg, message, args) {
        const decl = reg.ext.messages[message];
        if (!decl || !decl.methods || !decl.methods.length) {
            return undefined;
        }
        let result;
        for (const fn of decl.methods) {
            // 跳过面板/渲染进程处理函数（如 'default.executePanelMethod'）—— CLI 无渲染进程
            if (fn.includes('.')) {
                continue;
            }
            const target = reg.mainModule?.methods ?? reg.mainModule;
            const handler = target?.[fn];
            if (typeof handler === 'function') {
                const r = await handler.apply(target, args);
                if (result === undefined && r !== undefined) {
                    result = r;
                }
            }
        }
        return result;
    }
    async _dispatchAssetDb(message, args) {
        const { assetManager } = await Promise.resolve().then(() => __importStar(require('../../assets')));
        switch (message) {
            case 'query-asset-info':
                return assetManager.queryAssetInfo(args[0]);
            case 'query-asset-info-by-uuid':
                return assetManager.queryAssetInfoByUUID(args[0]);
            case 'query-uuid': {
                const info = assetManager.queryAssetInfo(args[0]);
                return info?.uuid;
            }
            case 'query-path': {
                const info = assetManager.queryAssetInfo(args[0]);
                return info?.file;
            }
            case 'query-url': {
                const info = assetManager.queryAssetInfo(args[0]);
                return info?.url;
            }
            case 'query-assets':
                return assetManager.queryAssetInfos(args[0] || {});
            // 预览态下的写操作（reimport/delete/refresh）忽略
            default:
                return undefined;
        }
    }
    async _dispatchScene(message) {
        switch (message) {
            case 'query-is-ready':
                return true;
            case 'query-dirty':
                return false;
            case 'soft-reload':
                // Creator 用 scene/soft-reload 刷新预览；CLI 映射到现有 live-reload 整页刷新
                await this._triggerReload();
                return undefined;
            default:
                return undefined;
        }
    }
    async _dispatchPreview(message) {
        // Creator 用 preview/reload-terminal 刷新预览；CLI 映射到现有 live-reload
        if (message === 'reload-terminal' || message === 'reload') {
            await this._triggerReload();
        }
        return undefined;
    }
    async _triggerReload() {
        const { triggerPreviewReload } = await Promise.resolve().then(() => __importStar(require('../live-reload')));
        triggerPreviewReload();
    }
}
exports.MessageBus = MessageBus;
