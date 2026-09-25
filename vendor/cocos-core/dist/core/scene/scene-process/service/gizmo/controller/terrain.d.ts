import { Node, Vec3 } from 'cc';
import ControllerBase from './base';
import type { GizmoMouseEvent } from '../utils/defines';
/** Invisible quad used because TerrainBlock geometry is not a raycast target. */
export default class TerrainController extends ControllerBase {
    private _quadNode;
    private _quadMR;
    private _size;
    constructor(rootNode: Node, opts?: any);
    initShape(opts: any): void;
    onMouseDown(event: GizmoMouseEvent): void;
    onMouseMove(event: GizmoMouseEvent): void;
    onMouseUp(event: GizmoMouseEvent): void;
    onHoverIn(_event: GizmoMouseEvent): void;
    onHoverOut(event: GizmoMouseEvent<{
        hoverInNodeMap: Map<Node, boolean>;
    }>): void;
    onShow(): void;
    onHide(): void;
    updateWorldPosition(value: Vec3): void;
    updateSize(width: number, height: number): void;
}
