import { Node, Prefab, Scene, SceneAsset } from 'cc';
type UUIDMap = Map<string, string | UUIDMap>;
declare class EditorPrefabUtils {
    preparePrefabRootForEditing(node: Node): void;
    rebindPrefabAsset(root: Node, prefabAsset: Prefab): void;
    serialize(node: Node): any;
    removePrefabInstanceRoots(rootNode: Node | Scene): void;
    generateSceneAsset(scene: Scene, rootNode: Node | null): SceneAsset;
    /**
     * 由于动态加载Prefab会导致节点的uuid发生变化，为了保证编辑过程中节点的uuid不变
     * 节点id也会，所以也需要更新
     * 在softReload之前会存储prefab节点的uuid,以便之后还原
     * @param scene 场景数据
     */
    storePrefabUUID(scene: Scene): Map<any, any>;
    generatePrefabUUIDMap(node: Node, uuidMap: UUIDMap): void;
    /**
     * 恢复Prefab的uuid
     * @param scene 场景数据
     * @param prefabUUIDMap
     */
    restorePrefabUUID(scene: Scene, prefabUUIDMap: UUIDMap): void;
    applyPrefabUUID(node: Node, uuidMap: UUIDMap | undefined): void;
}
export declare const editorPrefabUtils: EditorPrefabUtils;
export {};
