import { type IBaseIdentifier, ICreateOptions, IEditorTarget, INode, INodeDumpOptions } from '../../../common';
import { BaseEditor } from './base-editor';
import type { IAssetInfo } from '../../../../assets/@types/public';
/**
 * PrefabEditor - 预制体编辑器
 * 继承 BaseEditor，实现预制体相关的具体操作
 */
export declare class PrefabEditor extends BaseEditor {
    private virtualScene;
    encode(entity?: IEditorTarget | null, options?: INodeDumpOptions): Promise<INode>;
    protected _doOpen(asset: IAssetInfo, options?: INodeDumpOptions): Promise<INode>;
    close(options?: {
        save?: boolean;
    }): Promise<boolean>;
    save(): Promise<IAssetInfo>;
    saveAs(asset: IAssetInfo): Promise<IAssetInfo>;
    private saveSerializedDataToAsset;
    protected _doReload(): Promise<INode>;
    private mountPrefabInstanceForPreview;
    private ensurePreviewCanvasForUI;
    private shouldUsePreviewCanvas;
    create(params: ICreateOptions): Promise<IBaseIdentifier>;
}
