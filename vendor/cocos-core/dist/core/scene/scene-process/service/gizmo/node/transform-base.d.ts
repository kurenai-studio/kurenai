import GizmoBase from '../base/gizmo-base';
import ControllerBase from '../controller/base';
import { Node, Component } from 'cc';
import type { GizmoMouseEvent } from '../utils/defines';
declare class TransformBaseGizmo extends GizmoBase<Component> {
    protected _controller: ControllerBase;
    protected updateControllerTransform?(...args: any[]): void;
    protected isNodeLocked(_node: Node): boolean;
    get nodes(): Node[];
    onShow(): void;
    onHide(): void;
    onTargetUpdate(): void;
    onNodeChanged(_event?: any): void;
    protected broadcastNodeChangeMessage(node: Node): void;
    getSnappedValue(inNumber: number, snapStep: number): number;
    isControlKeyPressed(event: GizmoMouseEvent): boolean;
    /**
     * 默认行为是 controller 被按下就打断
     */
    onKeyDown(_event: any): boolean | undefined;
    /**
     * 默认行为是 controller 被按下就打断
     */
    onKeyUp(_event: any): boolean;
}
export default TransformBaseGizmo;
