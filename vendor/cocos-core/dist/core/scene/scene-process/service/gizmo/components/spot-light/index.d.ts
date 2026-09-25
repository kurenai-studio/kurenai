import { SpotLight } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import { IconGizmoBase } from '../../base';
declare class SpotLightComponentGizmo extends GizmoBase<SpotLight> {
    private _lightGizmoColor;
    private _lightCtrlHoverColor;
    private _range;
    private _angle;
    private _baseSize;
    private _glowSize;
    private _controller;
    private _sizeSphereCtrl;
    private _rangePropPath;
    private _anglePropPath;
    private _rangeChanged;
    private _angleChanged;
    private _coneTopPos;
    init(): void;
    onShow(): void;
    onHide(): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(): void;
    onControllerMouseUp(): void;
    getConeRadius(angle: number, height: number): number;
    updateDataFromController(): void;
    updateControllerTransform(): void;
    updateControllerData(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
declare class SpotLightIconGizmo extends IconGizmoBase<SpotLight> {
    disableOnSelected: boolean;
    createController(): void;
    updateController(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof SpotLightComponentGizmo;
export declare const IconGizmo: typeof SpotLightIconGizmo;
export declare const PersistentGizmo: null;
export {};
