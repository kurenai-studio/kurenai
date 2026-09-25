declare module 'cc' {
    interface Node {
        modelComp?: MeshRenderer;
        modelColor?: Color;
    }
    interface RenderingSubMesh {
        iBuffer?: ArrayBuffer;
        vBuffer?: ArrayBuffer;
    }
}
import { Color, geometry, gfx, IVec3Like, math, MeshRenderer, Node, primitives, renderer, Material, Mesh, Vec4 } from 'cc';
import type { IAddMeshToNodeOption, ICreateMeshOption, IMeshPrimitive, DynamicMeshPrimitive } from './defines';
import type { IRaycastResult } from './raycast';
export declare const ray: geometry.Ray;
export declare class RaycastResults extends Array<IRaycastResult> {
    ray: geometry.Ray;
    constructor(r: geometry.Ray);
}
export declare const ProjectionType: typeof renderer.scene.CameraProjection;
export declare const CullMode: typeof gfx.CullMode;
export declare const PrimitiveMode: typeof gfx.PrimitiveMode;
export declare const FOVAxis: typeof renderer.scene.CameraFOVAxis;
export declare const AttributeName: typeof gfx.AttributeName;
export declare enum HighlightFace {
    NONE = 0,
    UP = 1,
    DOWN = 2,
    LEFT = 3,
    RIGHT = 4,
    FRONT = 5,
    BACK = 6
}
export declare function create3DNode(name?: string): Node;
export declare function createMesh(primitive: IMeshPrimitive, opts?: ICreateMeshOption): Mesh;
export declare function createDynamicMesh(primitive: DynamicMeshPrimitive, opts: (primitives.ICreateDynamicMeshOptions & ICreateMeshOption)): Mesh;
export declare function updateDynamicMesh(meshRenderer: MeshRenderer, subIndex: number, primitive: DynamicMeshPrimitive): void;
export declare function addMeshToNode(node: Node, mesh: any, opts?: IAddMeshToNodeOption, reuseMaterial?: Material): void;
export declare function setMeshColor(node: Node, c: Color): void;
export declare function getMeshColor(node: Node): Color | undefined;
export declare function setNodeOpacity(node: Node, opacity: number): void;
export declare function getNodeOpacity(node: Node): number;
export declare function setMaterialProperty(node: Node, propName: string, value: any): void;
/**
 * 设置光照探针可视化材质的 SH 系数（对应 internal/editor/light-probe-visualization 的 Constant uniform）。
 * 移植自 Cocos Creator EngineUtils.setMeshSHCoefficients。
 */
export declare function setMeshSHCoefficients(node: Node, coefficients: Float32Array): void;
export declare function getModel(node: Node): MeshRenderer | null;
export declare function updatePositions(comp: MeshRenderer, data: IVec3Like[]): void;
export declare function updateVBAttr(comp: MeshRenderer, attr: string, data: number[]): void;
export declare function updateIB(comp: MeshRenderer, data: number[]): void;
export declare function updateBoundingBox(meshComp: MeshRenderer, minPos?: math.Vec3, maxPos?: math.Vec3): void;
export declare function getRaycastResultsByNodes(nodes: Node[], x: number, y: number, distance?: number, forSnap?: boolean, excludeMask?: number): RaycastResults;
export declare function getRaycastResults(rootNode: Node, x: number, y: number, distance?: number, excludeMask?: number): RaycastResults;
export declare function raycast(scene: any, camera: any, layer: any, x: number, y: number, distance?: number, excludeMask?: number): RaycastResults | null;
export declare function raycastAllColliders(camera: any, x: number, y: number): any[] & {
    ray?: geometry.Ray;
};
export declare function getRaycastResultsForSnap(camera: any, x: number, y: number, mask?: number): RaycastResults;
export declare function getMeshVertexAroundMouse(node: Node, camera: any, x: number, y: number, radius?: number): Vec4[];
