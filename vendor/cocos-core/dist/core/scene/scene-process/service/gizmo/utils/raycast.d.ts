import { geometry, Node, renderer, Vec2, Vec3 } from 'cc';
type ray = geometry.Ray;
declare const ray: typeof geometry.Ray;
export interface IRaycastResult {
    node: Node;
    distance: number;
    hitPoint: Vec3;
}
export declare class Raycast {
    get rayResultModels(): IRaycastResult[];
    get rayResultSingleModel(): IRaycastResult[];
    get rayResultCanvas(): IRaycastResult[];
    get rayResultAll(): IRaycastResult[];
    private narrowPhaseStep;
    raycastSingleModel(worldRay: ray, model: renderer.scene.Model, mask: number | undefined, distance: number | undefined, forSnap: boolean, excludeMask?: number): boolean;
    raycastAllModels(renderScene: renderer.RenderScene, worldRay: ray, mask: number | undefined, distance: number | undefined, forSnap: boolean, excludeMask?: number): boolean;
    raycastAll(renderScene: renderer.RenderScene, worldRay: ray, mask?: number, distance?: number, forSnap?: boolean, excludeMask?: number, screenPos?: Vec2): boolean;
    raycastAllCanvas(worldRay: ray, mask?: number, distance?: number, excludeMask?: number, screenPos?: Vec2): boolean;
    private _raycastUI2DNode;
    private _raycastUI2DNodeRecursiveChildren;
}
declare const _default: Raycast;
export default _default;
