import { PlaneCollider } from 'cc';
import GizmoBase from '../../base/gizmo-base';
declare class PlaneColliderGizmo extends GizmoBase<PlaneCollider> {
    private _controller;
    init(): void;
    onShow(): void;
    onHide(): void;
    updateControllerData(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof PlaneColliderGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
