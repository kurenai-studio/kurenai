import type { ISceneCommandProvider, SceneCommandProviderRegistration } from '../../core/scene/main-process/rpc';
export type { ISceneCommandProvider, SceneCommandProviderRegistration, SceneCommandRequestOptions, } from '../../core/scene/main-process/rpc';
export { WorkerSceneCommandProvider } from '../../core/scene/main-process/rpc';
/**
 * Initialize the scene module.
 * Registers the scene middleware and initializes scene config.
 */
export declare function init(): Promise<void>;
/**
 * Start the scene worker process.
 *
 * @param projectPath Path to the project directory
 */
export declare function startupWorker(projectPath: string): Promise<void>;
/** Installs a Scene command provider and returns an ownership-bound registration. */
export declare function setCommandProvider(provider: ISceneCommandProvider): SceneCommandProviderRegistration;
/** Clears and disposes the active Scene command provider. */
export declare function resetCommandProvider(): void;
