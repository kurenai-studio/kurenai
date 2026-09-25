import { BaseService } from './core';
import { type ICreateByAssetParams, type ICreateByNodeTypeParams, type ICreateNodePreflightResult, type IDeleteNodeParams, type IDeleteNodeResult, type INode, type INodeService, type IQueryNodeParams, type IQueryNodeTreeParams, type INodeTreeItem, type INodeEvents, type ISetParentParams, type IReorderParams, type ICopyParams, type IPasteParams, type IDuplicateParams, type ICutParams, type IClipboardState, type IMoveArrayElementParams, type IRemoveArrayElementParams, type IChangeNodeLockParams, type PrefabCanvasHandling, ISetPropertyOptions } from '../../common';
import { type IScene } from '../../common/editor/scene';
import { Node, Vec3 } from 'cc';
/**
 * 子进程节点处理器
 * 在子进程中处理所有节点相关操作
 */
export declare class NodeService extends BaseService<INodeEvents> implements INodeService {
    private readonly _undo;
    private _prefabCanvasUndoRecords;
    private _prefabCanvasUndoBeforeNodeUuids;
    private readonly _preflightTokens;
    private _preflightTokenSequence;
    createByType(params: ICreateByNodeTypeParams): Promise<INode | null>;
    createByAsset(params: ICreateByAssetParams): Promise<INode | null>;
    preflightCreate(params: ICreateByNodeTypeParams | ICreateByAssetParams): Promise<ICreateNodePreflightResult>;
    private _resolveTypeCreateOptions;
    private _getCreatePathPreflight;
    private _getCanvasContext;
    private _resolveCreatePreflight;
    private _createPreflightToken;
    private _validatePreflightToken;
    private _getPreflightRequestKey;
    _createNode(assetUuid: string | null, canvasNeeded: boolean, checkUITransform: boolean, params: ICreateByNodeTypeParams | ICreateByAssetParams, assetType?: string): Promise<INode | null>;
    /**
     * 获取或创建路径节点
     */
    private _getOrCreateNodeByPath;
    private _validateCreateParams;
    private _validateRequestedNodeName;
    private _validateRequestedNodePath;
    /**
     * 确保路径存在，如果不存在则创建空节点
     */
    private _ensurePathExists;
    delete(params: IDeleteNodeParams): Promise<IDeleteNodeResult | null>;
    query(params?: IQueryNodeParams): Promise<INode | IScene | null>;
    queryNodeTree(params: IQueryNodeTreeParams): Promise<INodeTreeItem | null>;
    queryNodesByAssetUuid(uuid: string): string[];
    queryNodesMissAsset(): Promise<string[]>;
    /**
     * 检查并根据需要创建 canvas节点或为父级添加UITransform组件，返回父级节点，如果需要canvas节点，则父级节点会是canvas节点
     * @param workMode
     * @param canvasRequiredParam
     * @param parent
     * @param position
     * @returns
     */
    checkCanvasRequired(workMode: string, canvasRequiredParam: boolean | undefined, parent: Node | null, position: Vec3 | undefined, prefabCanvasHandling?: PrefabCanvasHandling): Promise<Node | null>;
    private ensurePrefabRootUITransform;
    private _createPrefabCanvasUndoRecord;
    private _pushPrefabCanvasUndoRecord;
    onEditorOpened(): void;
    onEditorClosed(): void;
    previewSetProperty(options: ISetPropertyOptions): Promise<boolean>;
    cancelPreviewSetProperty(options: ISetPropertyOptions): Promise<boolean>;
    setProperty(options: ISetPropertyOptions): Promise<boolean>;
    reset(path: string): Promise<boolean>;
    resetProperty(options: ISetPropertyOptions): Promise<boolean>;
    private _collectSceneNodeUuidsForUndo;
    private _getCreateRootPathForUndo;
    private _beginPrefabCanvasUndoCapture;
    private _endPrefabCanvasUndoCapture;
    private _recordCreateNodeCommand;
    private _recordPrefabCanvasUndoCommands;
    private _captureAddComponentCommand;
    private _captureReparentSnapshotsForUndo;
    private _captureNodeSnapshotsForUndo;
    private _getNodePathByUuid;
    updatePropertyFromNull(options: ISetPropertyOptions): Promise<boolean>;
    setNodeAndChildrenLayer(options: ISetPropertyOptions): Promise<void>;
    getPathByUuid(uuid: string): string;
    setParent(params: ISetParentParams): Promise<string[]>;
    reorder(params: IReorderParams): Promise<boolean>;
    private _cutUuids;
    copy(params: ICopyParams): Promise<string[]>;
    paste(params: IPasteParams): Promise<string[]>;
    duplicate(params: IDuplicateParams): Promise<string[]>;
    cut(params: ICutParams): Promise<string[]>;
    queryClipboardState(): Promise<IClipboardState>;
    moveArrayElement(params: IMoveArrayElementParams): Promise<boolean>;
    removeArrayElement(params: IRemoveArrayElementParams): Promise<boolean>;
    changeNodeLock(params: IChangeNodeLockParams): Promise<void>;
}
