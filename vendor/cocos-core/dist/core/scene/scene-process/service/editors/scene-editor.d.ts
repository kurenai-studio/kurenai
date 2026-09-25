import { type IBaseIdentifier, ICreateOptions, IEditorTarget, IScene, INodeDumpOptions } from '../../../common';
import { BaseEditor } from './base-editor';
import type { IAssetInfo } from '../../../../assets/@types/public';
/**
 * SceneEditor - 场景编辑器
 * 继承 BaseEditor，实现场景相关的具体操作
 */
export declare class SceneEditor extends BaseEditor {
    encode(entity?: IEditorTarget | null, options?: INodeDumpOptions): Promise<IScene>;
    protected _doOpen(asset: IAssetInfo, options?: INodeDumpOptions): Promise<IScene>;
    close(options?: {
        save?: boolean;
    }): Promise<boolean>;
    save(): Promise<IAssetInfo>;
    /**
     * 序列化「当前正在编辑」的实时场景（含未保存改动），返回 JSON 字符串。
     * 复用 save/reload 完全一致的 sceneUtils.serialize 路径，因此其输出可被
     * cc.assetManager.loadWithJson 加载（等价于 querySceneSerializedData）。
     * 默认 stringify:true，返回的是 JSON 字符串（非对象）。
     */
    serializeCurrent(): string;
    saveAs(asset: IAssetInfo): Promise<IAssetInfo>;
    private saveSerializedDataToAsset;
    protected _doReload(): Promise<IScene>;
    create(params: ICreateOptions): Promise<IBaseIdentifier>;
}
