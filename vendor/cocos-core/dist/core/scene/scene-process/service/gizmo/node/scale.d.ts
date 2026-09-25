import TransformBaseGizmo from './transform-base';
import { Node, Vec3 } from 'cc';
import type { GizmoMouseEvent } from '../utils/defines';
declare class ScaleGizmo extends TransformBaseGizmo {
    private _localScaleList;
    private _offsetList;
    private _center;
    isNodeLocked(node: Node): boolean;
    init(): void;
    layer(): string;
    onTargetUpdate(): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(event: GizmoMouseEvent): void;
    onControllerMouseUp(): void;
    onKeyDown(event: any): boolean | undefined;
    onKeyUp(event: any): boolean;
    setScaleWithPrecision(node: Node, newScale: Vec3, precision: number): void;
    checkSnap(scaleDelta: Vec3, snapStep: number): void;
    updateDataFromController(event: GizmoMouseEvent): void;
    updateControllerTransform(): void;
}
export default ScaleGizmo;
