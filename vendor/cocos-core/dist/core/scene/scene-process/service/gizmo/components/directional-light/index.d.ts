import { DirectionalLight } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import IconGizmoBase from '../../base/gizmo-icon';
declare class DirectionalLightComponentGizmo extends GizmoBase<DirectionalLight> {
    private _controller;
    private _frustumCtrl;
    private _lightGizmoColor;
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
declare class DirectionalLightIconGizmo extends IconGizmoBase<DirectionalLight> {
    disableOnSelected: boolean;
    createController(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof DirectionalLightComponentGizmo;
export declare const IconGizmo: typeof DirectionalLightIconGizmo;
export declare const PersistentGizmo: null;
export {};
