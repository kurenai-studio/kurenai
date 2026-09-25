import type { ChildProcess } from 'child_process';
import type { IPublicServiceManager } from '../scene-process';
import { ProcessRPC } from '../process-rpc';
import { ISceneCommandProvider, SceneCommandRequestOptions, SceneCommandProviderRegistration } from './scene-command-provider';
type AnySceneMethod = (...args: any[]) => any;
type SceneServiceMethod<K extends keyof IPublicServiceManager, M extends keyof IPublicServiceManager[K]> = Extract<IPublicServiceManager[K][M], AnySceneMethod>;
export { ProcessRPC };
export type { ISceneCommandProvider, SceneCommandProviderRegistration, SceneCommandRequestOptions, } from './scene-command-provider';
export { WorkerSceneCommandProvider } from './scene-command-provider';
export { SceneHostLocalExecutor } from './scene-host-local-executor';
export type { SceneHostModules } from './scene-host-local-executor';
/** Minimal interface exposed to callers by `Rpc.getInstance()`. */
export interface SceneRpcClient {
    request<K extends keyof IPublicServiceManager, M extends keyof IPublicServiceManager[K]>(module: K, method: M, ...rest: Parameters<SceneServiceMethod<K, M>> extends [] ? [args?: [], options?: SceneCommandRequestOptions] : [args: Parameters<SceneServiceMethod<K, M>>, options?: SceneCommandRequestOptions]): Promise<Awaited<ReturnType<SceneServiceMethod<K, M>>>>;
    notify<K extends keyof IPublicServiceManager, M extends keyof IPublicServiceManager[K]>(module: K, method: M, args?: Parameters<SceneServiceMethod<K, M>>): void;
    executeLocal(module: string, method: string, args?: any[]): Promise<any>;
    isConnect(): boolean | undefined;
}
export declare class RpcProxy implements SceneRpcClient {
    private commandProvider;
    private commandProviderRegistration;
    private hostLocalExecutor;
    getInstance(): SceneRpcClient;
    isConnect(): boolean | undefined;
    /**
     * Preserves the existing startup behavior:
     * - When a process is provided, `WorkerSceneCommandProvider` connects to the Scene Worker.
     * - Otherwise, only `SceneHostLocalExecutor` is initialized for the Scene Webview runtime.
     */
    startup(prc: ChildProcess | NodeJS.Process): SceneCommandProviderRegistration;
    startup(prc?: undefined): undefined;
    /**
     * Installs the host-provided `ISceneCommandProvider`.
     * Switches to the new provider before disposing the previous one. Errors from the new provider
     * propagate directly without falling back to another provider or retrying the request.
     */
    setCommandProvider(provider: ISceneCommandProvider): SceneCommandProviderRegistration;
    /** Clears and disposes the active Scene command provider. */
    resetCommandProvider(): void;
    request<K extends keyof IPublicServiceManager, M extends keyof IPublicServiceManager[K]>(module: K, method: M, ...rest: Parameters<SceneServiceMethod<K, M>> extends [] ? [args?: [], options?: SceneCommandRequestOptions] : [args: Parameters<SceneServiceMethod<K, M>>, options?: SceneCommandRequestOptions]): Promise<Awaited<ReturnType<SceneServiceMethod<K, M>>>>;
    notify<K extends keyof IPublicServiceManager, M extends keyof IPublicServiceManager[K]>(module: K, method: M, args?: Parameters<SceneServiceMethod<K, M>>): void;
    executeLocal(module: string, method: string, args?: any[]): Promise<any>;
    /**
     * 清理 RPC 实例
     */
    dispose(): void;
    private ensureHostLocalExecutor;
    private disposeCommandProvider;
}
export declare const Rpc: RpcProxy;
