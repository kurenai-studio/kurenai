import { Mesh, MeshCollider } from 'cc';
import GizmoBase from '../../base/gizmo-base';
declare class MeshColliderGizmo extends GizmoBase<MeshCollider> {
    private _controller;
    init(): void;
    onShow(): void;
    onHide(): void;
    updateControllerData(): void;
    calcMeshData(mesh: Mesh): {
        points: number[];
        indices: number[];
    };
    private _generateWireFrameData;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof MeshColliderGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
