import { ReflectionProbe } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import IconGizmoBase from '../../base/gizmo-icon';
/**
 * 反射探针（ReflectionProbe）选中 Gizmo：
 * 画出影响区域包围盒线框，并支持拖拽包围盒面手柄修改 size。
 * 注意 ReflectionProbe.size 是 AABB 半长，线框全尺寸 = size * 2。
 * PLANAR 类型的 size 为扁平值（默认 5,0.5,5），会显示成一块薄盒（平面）。
 */
declare class ReflectionProbeComponentGizmo extends GizmoBase<ReflectionProbe> {
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
declare class ReflectionProbeIconGizmo extends IconGizmoBase<ReflectionProbe> {
    disableOnSelected: boolean;
    createController(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof ReflectionProbeComponentGizmo;
export declare const IconGizmo: typeof ReflectionProbeIconGizmo;
export declare const PersistentGizmo: null;
export {};
