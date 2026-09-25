import { Asset } from 'cc';
import { CallbacksInvoker } from './callbacks-invoker';
declare module 'cc' {
    interface AssetManager {
        assetListener: CallbacksInvoker;
    }
}
declare class AssetUpdater {
    lockNum: number;
    timer: any;
    private flushPromise;
    private resolveFlush;
    lock(): void;
    unlock(): void;
    waitForFlush(): Promise<void>;
    private update;
    queue: Map<string, Asset | null>;
    add(uuid: string, asset: Asset | null): void;
    remove(uuid: string): void;
    clearQueue(): void;
}
declare class AssetWatcherManager {
    updater: AssetUpdater;
    private generation;
    private watchers;
    invalidate(): void;
    initHandle(obj: any): void;
    startWatch(obj: any): void;
    stopWatch(obj: any): void;
    protected isTextureCubeSubImageAsset(uuid: string): boolean;
    onAssetChanged(uuid: string): Promise<void>;
    private discardCachedAsset;
    private loadAsset;
    onAssetDeleted(uuid: string): void;
}
declare const assetWatcherManager: AssetWatcherManager;
export { assetWatcherManager };
