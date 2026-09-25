import { SphereLight } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import { IconGizmoBase } from '../../base';
declare class SphereLightComponentGizmo extends GizmoBase<SphereLight> {
    private _lightGizmoColor;
    private _lightCtrlHoverColor;
    private _range;
    private _glowSize;
    private _controller;
    private _sizeSphereCtrl;
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
    updateController(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
declare class SphereLightIconGizmo extends IconGizmoBase<SphereLight> {
    disableOnSelected: boolean;
    createController(): void;
    updateController(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof SphereLightComponentGizmo;
export declare const IconGizmo: typeof SphereLightIconGizmo;
export declare const PersistentGizmo: null;
export {};
