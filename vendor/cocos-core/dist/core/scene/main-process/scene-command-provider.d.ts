import type { ChildProcess } from 'child_process';
export interface SceneCommandRequestOptions {
    timeout?: number;
}
/**
 * `ISceneCommandProvider` defines how Scene commands are dispatched.
 * Each call uses only the selected provider. Errors must propagate without retrying through
 * another provider.
 */
export interface ISceneCommandProvider {
    request(module: string, method: string, args?: any[], options?: SceneCommandRequestOptions): Promise<any>;
    notify?(module: string, method: string, args?: any[]): void;
    isConnect?(): boolean | undefined;
    dispose?(): void;
}
/** Ownership-bound registration returned when a provider is installed. */
export interface SceneCommandProviderRegistration {
    dispose(): void;
}
/** Default provider used by standalone cocos-cli to connect to the Scene Worker. */
export declare class WorkerSceneCommandProvider implements ISceneCommandProvider {
    private readonly rpc;
    constructor(process: ChildProcess | NodeJS.Process);
    request(module: string, method: string, args?: any[], options?: SceneCommandRequestOptions): Promise<any>;
    notify(module: string, method: string, args?: any[]): void;
    isConnect(): boolean | undefined;
    dispose(): void;
}
