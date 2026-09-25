import { ProcessRPC } from '../process-rpc';
import type { IMainModule } from '../main-process';
export declare class RpcProxy {
    private rpcInstance;
    private webServerUrl;
    getInstance(): ProcessRPC<IMainModule>;
    /** Returns a URL only when this proxy owns the browser Web RPC transport. */
    getWebServerUrl(): string | undefined;
    startup(options?: {
        serverURL: string;
    }): Promise<void>;
    /**
     * 清理 RPC 实例
     */
    dispose(): void;
}
export declare const Rpc: RpcProxy;
