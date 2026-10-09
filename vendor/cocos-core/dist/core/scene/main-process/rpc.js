"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rpc = exports.RpcProxy = exports.SceneHostLocalExecutor = exports.WorkerSceneCommandProvider = exports.ProcessRPC = void 0;
const process_rpc_1 = require("../process-rpc");
Object.defineProperty(exports, "ProcessRPC", { enumerable: true, get: function () { return process_rpc_1.ProcessRPC; } });
const scene_command_provider_1 = require("./scene-command-provider");
const scene_host_local_executor_1 = require("./scene-host-local-executor");
var scene_command_provider_2 = require("./scene-command-provider");
Object.defineProperty(exports, "WorkerSceneCommandProvider", { enumerable: true, get: function () { return scene_command_provider_2.WorkerSceneCommandProvider; } });
var scene_host_local_executor_2 = require("./scene-host-local-executor");
Object.defineProperty(exports, "SceneHostLocalExecutor", { enumerable: true, get: function () { return scene_host_local_executor_2.SceneHostLocalExecutor; } });
class RpcProxy {
    commandProvider = null;
    commandProviderRegistration = null;
    hostLocalExecutor = null;
    getInstance() {
        if (!this.hostLocalExecutor) {
            throw new Error('[Node] Rpc instance is not started!');
        }
        return this;
    }
    isConnect() {
        return this.commandProvider?.isConnect?.();
    }
    startup(prc) {
        // 在创建新实例前，先清理旧实例，防止内存泄漏
        this.dispose();
        this.ensureHostLocalExecutor();
        if (prc) {
            const registration = this.setCommandProvider(new scene_command_provider_1.WorkerSceneCommandProvider(prc));
            console.log('[Node] Scene Process RPC ready (Attached)');
            return registration;
        }
        console.log('[Node] Scene Process RPC ready (Detached - Web Mode)');
        return undefined;
    }
    /**
     * Installs the host-provided `ISceneCommandProvider`.
     * Switches to the new provider before disposing the previous one. Errors from the new provider
     * propagate directly without falling back to another provider or retrying the request.
     */
    setCommandProvider(provider) {
        if (!provider || typeof provider.request !== 'function') {
            throw new TypeError('[Node] Scene command provider must implement request()');
        }
        if (provider === this.commandProvider && this.commandProviderRegistration) {
            return this.commandProviderRegistration;
        }
        this.ensureHostLocalExecutor();
        const previousProvider = this.commandProvider;
        let disposed = false;
        const registration = {
            dispose: () => {
                if (disposed) {
                    return;
                }
                disposed = true;
                // A stale registration must not clear a newer provider, even when both use the same object.
                if (this.commandProviderRegistration !== registration) {
                    return;
                }
                this.commandProvider = null;
                this.commandProviderRegistration = null;
                this.disposeCommandProvider(provider);
            },
        };
        this.commandProvider = provider;
        this.commandProviderRegistration = registration;
        this.disposeCommandProvider(previousProvider);
        console.log('[Node] Scene command provider installed');
        return registration;
    }
    /** Clears and disposes the active Scene command provider. */
    resetCommandProvider() {
        const provider = this.commandProvider;
        this.commandProvider = null;
        this.commandProviderRegistration = null;
        this.disposeCommandProvider(provider);
    }
    request(module, method, ...rest) {
        const provider = this.commandProvider;
        if (!provider) {
            return Promise.reject(new Error('[Node] No Scene command provider is installed'));
        }
        const [args, options] = rest;
        return provider.request(String(module), String(method), (args ?? []), options);
    }
    notify(module, method, args) {
        const provider = this.commandProvider;
        if (!provider) {
            throw new Error('[Node] No Scene command provider is installed');
        }
        if (!provider.notify) {
            throw new Error('[Node] Scene command provider does not support notify()');
        }
        provider.notify(String(module), String(method), (args ?? []));
    }
    executeLocal(module, method, args = []) {
        const executor = this.hostLocalExecutor;
        if (!executor) {
            return Promise.reject(new Error('[Node] Scene host local executor is not started!'));
        }
        return executor.executeLocal(module, method, args);
    }
    /**
     * 清理 RPC 实例
     */
    dispose() {
        if (!this.commandProvider && !this.hostLocalExecutor) {
            return;
        }
        console.log('[Node] Disposing RPC instance');
        this.resetCommandProvider();
        try {
            this.hostLocalExecutor?.dispose();
        }
        catch (error) {
            console.warn('[Node] Error disposing Scene host local executor:', error);
        }
        finally {
            this.hostLocalExecutor = null;
        }
    }
    ensureHostLocalExecutor() {
        this.hostLocalExecutor ??= new scene_host_local_executor_1.SceneHostLocalExecutor();
        return this.hostLocalExecutor;
    }
    disposeCommandProvider(provider) {
        if (!provider?.dispose) {
            return;
        }
        try {
            provider.dispose();
        }
        catch (error) {
            console.warn('[Node] Error disposing Scene command provider:', error);
        }
    }
}
exports.RpcProxy = RpcProxy;
exports.Rpc = new RpcProxy();
