import { Camera } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import IconGizmoBase from '../../base/gizmo-icon';
declare class CameraComponentGizmo extends GizmoBase<Camera> {
    private _controller;
    private _fov;
    private _near;
    private _far;
    private _aspect;
    private _farHalfWidth;
    private _farHalfHeight;
    private _projection;
    private _fovAxis;
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
}
declare class CameraIconGizmo extends IconGizmoBase<Camera> {
    createController(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof CameraComponentGizmo;
export declare const IconGizmo: typeof CameraIconGizmo;
export declare const PersistentGizmo: null;
export {};
