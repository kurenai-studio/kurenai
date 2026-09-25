import type { ChildProcess } from 'child_process';

/**
 * Initialize the scene module.
 * Registers the scene middleware and initializes scene config.
 */
export declare function init(): Promise<void>;

/**
 * `ISceneCommandProvider` defines how Scene commands are dispatched.
 * Each call uses only the selected provider. Errors must propagate without retrying through
 * another provider.
 */
export declare interface ISceneCommandProvider {
    request(module: string, method: string, args?: any[], options?: SceneCommandRequestOptions): Promise<any>;
    notify?(module: string, method: string, args?: any[]): void;
    isConnect?(): boolean | undefined;
    dispose?(): void;
}

/** Clears and disposes the active Scene command provider. */
export declare function resetCommandProvider(): void;

/** Ownership-bound registration returned when a provider is installed. */
export declare interface SceneCommandProviderRegistration {
    dispose(): void;
}

export declare interface SceneCommandRequestOptions {
    timeout?: number;
}

/** Installs a Scene command provider and returns an ownership-bound registration. */
export declare function setCommandProvider(provider: ISceneCommandProvider): SceneCommandProviderRegistration;

/**
 * Start the scene worker process.
 *
 * @param projectPath Path to the project directory
 */
export declare function startupWorker(projectPath: string): Promise<void>;

/** Default provider used by standalone cocos-cli to connect to the Scene Worker. */
export declare class WorkerSceneCommandProvider implements ISceneCommandProvider {
    private readonly rpc;
    constructor(process: ChildProcess | NodeJS.Process);
    request(module: string, method: string, args?: any[], options?: SceneCommandRequestOptions): Promise<any>;
    notify(module: string, method: string, args?: any[]): void;
    isConnect(): boolean | undefined;
    dispose(): void;
}

export { }
