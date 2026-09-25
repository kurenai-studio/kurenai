import { BoxCollider } from 'cc';
import GizmoBase from '../../base/gizmo-base';
declare class BoxColliderComponentGizmo extends GizmoBase<BoxCollider> {
    private _controller;
    private _size;
    private _scale;
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
}
export declare const name: string;
export declare const SelectGizmo: typeof BoxColliderComponentGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
