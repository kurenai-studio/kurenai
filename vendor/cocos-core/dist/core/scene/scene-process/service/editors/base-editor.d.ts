import type { IBaseIdentifier, ICreateOptions, IEditorTarget, TEditorEntity, TEditorInstance, INodeDumpOptions } from '../../../common';
import type { IAssetInfo } from '../../../../assets/@types/public';
/**
 * 编辑器基类
 * 提供通用的编辑器功能和状态管理
 * @template TEditorAsset 编辑器处理的资产类型，如 IScene、INode 等
 * @template TEvents 事件类型
 */
export declare abstract class BaseEditor {
    /**
     * 当前打开的资源
     */
    protected entity: IEditorTarget | null;
    /**
     * 最近一次 open() 传入的选项，供 _doReload() 复用以保持 encode 结果形状一致
     */
    protected _lastOpenOptions: INodeDumpOptions | undefined;
    /**
     * reload 操作的 Promise，用于防止并发调用导致序列化失败
     * 所有调用者都等待这个 Promise，最终会得到基于最新数据的结果
     */
    protected _reloadPromise: Promise<TEditorEntity> | null;
    /**
     * 标记是否有待处理的 reload 请求
     * 如果在一个 reload 执行期间有新的调用，设置此标志，确保最终基于最新数据执行
     */
    private _pendingReload;
    getRootNode(): TEditorInstance | null;
    setCurrentOpen(entity: IEditorTarget | null): void;
    protected getIdentifier(assetInfo: IAssetInfo): {
        assetType: import("../../../../assets/@types/asset-types").IAssetType;
        assetName: string;
        assetUuid: string;
        assetUrl: string;
    };
    /**
     * 重载编辑器内容，提供并发保护
     * 如果已有 reload 正在执行，标记待处理标志，确保最终基于最新数据执行
     */
    reload(): Promise<TEditorEntity>;
    /**
     * 执行 reload 操作，支持自动重新执行以确保基于最新数据
     */
    private _executeReload;
    abstract encode(entity?: IEditorTarget | null, options?: INodeDumpOptions): Promise<TEditorEntity>;
    open(asset: IAssetInfo, options?: INodeDumpOptions): Promise<TEditorEntity>;
    protected abstract _doOpen(asset: IAssetInfo, options?: INodeDumpOptions): Promise<TEditorEntity>;
    abstract close(options?: {
        save?: boolean;
    }): Promise<boolean>;
    abstract save(): Promise<IAssetInfo>;
    abstract saveAs(asset: IAssetInfo): Promise<IAssetInfo>;
    /**
     * 执行实际的重载操作，子类需要实现具体的重载逻辑
     */
    protected abstract _doReload(): Promise<TEditorEntity>;
    abstract create(params: ICreateOptions): Promise<IBaseIdentifier>;
}
