import { assetManager } from '../../assets';
import scriptManager from '../../scripting';
import i18n from '../../base/i18n';
import { ProcessRPC } from '../process-rpc';
import { sceneConfigInstance } from '../scene-configs';
import { referenceImageFiles } from './reference-image-files';
import { referenceImageStore } from './reference-image-store';
export interface SceneHostModules {
    assetManager: typeof assetManager;
    programming: typeof scriptManager;
    sceneConfigInstance: typeof sceneConfigInstance;
    i18n: typeof i18n;
    referenceImageFiles: typeof referenceImageFiles;
    referenceImageStore: typeof referenceImageStore;
}
/** Registers the default host modules with the specified Scene RPC transport. */
export declare function registerDefaultSceneHostModules(rpc: ProcessRPC<any>): void;
/**
 * `SceneHostLocalExecutor` handles reverse RPC calls from the Scene runtime in the Scene host
 * process. In hosted mode, the integrating application provides this process.
 *
 * `SceneHostLocalExecutor` is transport-agnostic. The Scene Webview runtime invokes it through
 * the HTTP `/rpc/:module/:method` route. The worker provider uses the helper above to register
 * the same host modules with the Scene Worker transport.
 */
export declare class SceneHostLocalExecutor {
    private readonly modules;
    private readonly rpc;
    constructor(modules?: SceneHostModules);
    executeLocal(module: string, method: string, args?: any[]): Promise<any>;
    dispose(): void;
}
