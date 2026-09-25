import { UITransform } from 'cc';
import GizmoBase from '../base/gizmo-base';
declare class UITransformComponentGizmo extends GizmoBase<UITransform> {
    private _controller;
    init(): void;
    onShow(): void;
    onHide(): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(): void;
    onControllerMouseUp(): void;
    updateControllerTransform(): void;
    updateControllerData(): void;
    updateController(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof UITransformComponentGizmo;
export {};
