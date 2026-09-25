import { Component } from 'cc';
import GizmoBase from './gizmo-base';
import IconController from '../controller/icon';
declare class IconGizmoBase<T extends Component = Component> extends GizmoBase<T> {
    protected _controller: IconController;
    private _isIconGizmoVisible;
    disableOnSelected: boolean;
    init(): void;
    onShow(): void;
    onHide(): void;
    setIconGizmoVisible(visible: boolean): void;
    setIconGizmo3D(value: boolean): void;
    setIconGizmoSize(size: number): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(): void;
    onControllerMouseUp(): void;
    updateController(): void;
    updateControllerTransform(): void;
    onTargetUpdate(): void;
    onNodeChanged(_event: any): void;
    onNodeSelectionChanged(selection: boolean): void;
    checkVisible(): boolean;
}
export default IconGizmoBase;
