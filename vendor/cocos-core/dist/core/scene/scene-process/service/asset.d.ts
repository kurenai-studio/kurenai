import { BaseService } from './core';
import { IAssetEvents, IAssetService } from '../../common';
import { Component, Node } from 'cc';
export declare class AssetService extends BaseService<IAssetEvents> implements IAssetService {
    /**
     * 主进程监听 asset 事件，所触发事件
     * @param uuid
     */
    private getEditorSession;
    private isCurrentEditorSession;
    assetChanged(uuid: string): Promise<void>;
    private _preserveCurrentAnimationClipAsset;
    /**
     * 主进程监听 asset 事件，所触发事件
     * @param uuid
     */
    assetDeleted(uuid: string): Promise<void>;
    onEditorOpened(): void;
    onEditorClosed(): void;
    onEditorDisposed(): void;
    onNodeChanged(node: Node): void;
    onComponentAdded(comp: Component): void;
    onComponentRemoved(comp: Component): void;
    releaseAsset(assetUUID: string): void;
}
