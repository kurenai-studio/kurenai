import type { INodeInfo, INodeIdentifier, INode, IComponentInfo, IComponent, IComponentIdentifier, IPrefab, IPrefabInfo, ISceneInfo } from '../../common';
import type { IScene } from '../../common/editor/scene';
export interface IDumpConvertOptions {
    path?: string;
}
export declare class DumpConverter {
    static toNode(dump: INode | IScene, options?: IDumpConvertOptions): INodeInfo;
    static toScene(dump: IScene, options?: IDumpConvertOptions): ISceneInfo;
    private static sceneToNode;
    private static nodeToNode;
    static toNodeIdentifier(childProp: any): INodeIdentifier;
    static toComponent(dump: IComponent): IComponentInfo;
    static toComponentIdentifier(dump: IComponent): IComponentIdentifier;
    static convertPrefab(prefab?: IPrefab): IPrefabInfo | null;
    private static convertTargetOverrides;
    private static convertPrefabInstance;
    private static extractTargetInfo;
    private static extractLocalID;
    private static extractPropertyPath;
}
