import { SphereCollider, Vec3 } from 'cc';
import GizmoBase from '../../base/gizmo-base';
declare class SphereColliderComponentGizmo extends GizmoBase<SphereCollider> {
    private _controller;
    private _radius;
    private _maxScale;
    private _propPath;
    init(): void;
    onShow(): void;
    onHide(): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(): void;
    onControllerMouseUp(): void;
    getMaxScale(inScale: Vec3): number;
    updateDataFromController(): void;
    updateControllerData(): void;
    updateControllerTransform(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof SphereColliderComponentGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
