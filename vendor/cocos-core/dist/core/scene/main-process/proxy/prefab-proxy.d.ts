import type { ICreatePrefabFromNodeParams, IGetPrefabInfoParams, IPublicPrefabService, IUnpackPrefabInstanceParams, IPrefabInfo } from '../../common';
import { INodeInfo } from '../../common/cli/node';
export interface IPrefabProxy extends Omit<IPublicPrefabService, 'createPrefabFromNode' | 'unpackPrefabInstance' | 'getPrefabInfo' | 'unlinkPrefab'> {
    createPrefabFromNode(params: ICreatePrefabFromNodeParams): Promise<INodeInfo>;
    unpackPrefabInstance(params: IUnpackPrefabInstanceParams): Promise<INodeInfo>;
    getPrefabInfo(params: IGetPrefabInfoParams): Promise<IPrefabInfo | null>;
}
export declare const PrefabProxy: IPrefabProxy;
