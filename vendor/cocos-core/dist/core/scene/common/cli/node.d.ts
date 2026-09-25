import type { IVec3 } from '../value-types';
import type { MobilityMode } from '../node';
import type { IComponentIdentifier } from './component';
import type { IPrefabInfo } from './prefab';
export interface INodeProperties {
    position: IVec3;
    rotation: IVec3;
    scale: IVec3;
    mobility: MobilityMode;
    layer: number;
    active: boolean;
}
export interface IUpdateNodeParams {
    path: string;
    name?: string;
    properties?: Partial<INodeProperties>;
}
export interface IUpdateNodeResult {
    path: string;
}
export interface INodeIdentifier {
    nodeId: string;
    path: string;
    name: string;
}
export interface INodeInfo extends INodeIdentifier {
    properties: INodeProperties;
    components?: IComponentIdentifier[];
    children?: INodeIdentifier[];
    prefab: IPrefabInfo | null;
}
