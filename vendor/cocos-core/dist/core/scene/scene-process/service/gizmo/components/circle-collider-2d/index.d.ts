import { CircleCollider2D, Vec3 } from 'cc';
import GizmoBase from '../../base/gizmo-base';
declare class CircleCollider2DGizmo extends GizmoBase<CircleCollider2D> {
    private _controller;
    private _radius;
    private _offset;
    private _propRadiusPath;
    private _propOffsetPath;
    private _curHandleType;
    private _maxScale;
    init(): void;
    onShow(): void;
    onHide(): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(): void;
    onControllerMouseUp(): void;
    handleAreaMove(delta: Vec3): void;
    handleRadius(deltaRadius: number): void;
    updateControllerData(): void;
    updateController(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof CircleCollider2DGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
