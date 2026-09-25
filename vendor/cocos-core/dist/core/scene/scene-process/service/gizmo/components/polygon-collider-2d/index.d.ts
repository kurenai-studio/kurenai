import { PolygonCollider2D, Vec3 } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import type { GizmoMouseEvent } from '../../utils/defines';
interface IPolygonHandleData {
    type: string;
    deltaPos: Vec3;
    index: number;
    hitPos?: Vec3;
}
declare class PolygonCollider2DGizmo extends GizmoBase<PolygonCollider2D> {
    private _controller;
    private _leftDeleteLine;
    private _rightDeleteLine;
    private _offset;
    private _ctrlKey;
    private _metaKey;
    private _propPath;
    private _3dPoints;
    private _points;
    private _curHoverInHandleType;
    private _curHoverInElemIndex;
    private _isDeletePointKeyDown;
    init(): void;
    onShow(): void;
    onHide(): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(event: GizmoMouseEvent): void;
    onControllerMouseUp(): void;
    onControllerHoverIn(event: GizmoMouseEvent<{
        index: number;
    }>): void;
    onControllerHoverOut(event: GizmoMouseEvent): void;
    onKeyDown(event: any): void;
    onKeyUp(event: any): void;
    worldToLocalPos(out: Vec3, inPos: Vec3): void;
    handleAreaMove(delta: Vec3): void;
    handlePoints(handleMoveData: IPolygonHandleData): void;
    updateControllerData(): void;
    updateController(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof PolygonCollider2DGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
