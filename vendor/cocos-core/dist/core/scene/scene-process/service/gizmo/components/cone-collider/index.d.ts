import { ConeCollider } from 'cc';
import GizmoBase from '../../base/gizmo-base';
declare class ConeColliderComponentGizmo extends GizmoBase<ConeCollider> {
    private _controller;
    private _maxScale;
    private _radius;
    private _height;
    private _propPath;
    init(): void;
    onShow(): void;
    onHide(): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(): void;
    onControllerMouseUp(): void;
    updateDataFromController(): void;
    updateControllerTransform(): void;
    updateControllerData(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
    private getMaxScale;
}
export declare const name: string;
export declare const SelectGizmo: typeof ConeColliderComponentGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
