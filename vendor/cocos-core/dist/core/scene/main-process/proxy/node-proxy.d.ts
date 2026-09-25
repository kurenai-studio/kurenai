import { ICreateByNodeTypeParams, ICreateByAssetParams, IQueryNodeParams, IUpdateNodeParams, IUpdateNodeResult, IPublicNodeService } from '../../common';
import { INodeInfo } from '../../common/cli/node';
export interface INodeProxy extends Omit<IPublicNodeService, 'createByType' | 'createByAsset' | 'query' | 'getPathByUuid' | 'setParent' | 'reorder' | 'copy' | 'paste' | 'duplicate' | 'cut' | 'moveArrayElement' | 'removeArrayElement' | 'changeNodeLock'> {
    createByType(params: ICreateByNodeTypeParams): Promise<INodeInfo | null>;
    createByAsset(params: ICreateByAssetParams): Promise<INodeInfo | null>;
    query(params?: IQueryNodeParams): Promise<INodeInfo | null>;
    update(params: IUpdateNodeParams): Promise<IUpdateNodeResult>;
}
export declare const NodeProxy: INodeProxy;
