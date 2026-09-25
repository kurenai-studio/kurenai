import type { IAssetInfo } from '../../assets/@types/public';
export interface SceneAssetBinaryCreateOptions {
    target: string;
    overwrite: boolean;
    content: Uint8Array;
}
export interface SceneAssetBinaryClientDependencies {
    getWebServerUrl(): string | undefined;
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    saveLocally(assetUuid: string, content: Uint8Array): Promise<IAssetInfo>;
    createLocally(options: SceneAssetBinaryCreateOptions): Promise<IAssetInfo>;
}
/**
 * The only scene-process interface for binary Asset writes.
 * It hides the web HTTP protocol while keeping native Scene workers on IPC.
 */
export declare class SceneAssetBinaryClient {
    private readonly dependencies;
    constructor(dependencies?: SceneAssetBinaryClientDependencies);
    save(assetUuid: string, content: Uint8Array): Promise<IAssetInfo>;
    create(options: SceneAssetBinaryCreateOptions): Promise<IAssetInfo>;
    private request;
}
export declare const sceneAssetBinaryClient: SceneAssetBinaryClient;
