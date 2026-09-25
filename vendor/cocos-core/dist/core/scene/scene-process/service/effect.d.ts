import { BaseService } from './core';
export declare class EffectService extends BaseService<Record<string, any[]>> {
    private _uuidSet;
    private _initialized;
    private _onAssetRefreshed;
    init(): Promise<void>;
    registerMany(uuids: string[]): void;
    register(uuid: string): Promise<void>;
    remove(uuid: string): boolean;
    removeMany(uuids: string[]): void;
    update(uuid: string): void;
    onAssetChanged(uuid: string): void;
    onAssetDeleted(uuid: string): void;
    private queryEffectUuids;
    private syncAssetChanged;
    private queryAssetInfo;
    private isEffectAsset;
}
