import { Color, Node, Vec3 } from 'cc';
import EditableController from '../../controller/editable';
import type { GizmoMouseEvent } from '../../utils/defines';
/**
 * Joint2D 的通用可视化控制器。
 *
 * 绘制锚点 Handle 与刚体中心到锚点的虚线，并把 Handle 的鼠标位置
 * 投影到世界 XY 平面，供 Joint2DGizmo 完成坐标换算和属性写回。
 */
export declare class Joint2DController extends EditableController {
    private _lineNode;
    private _lineRenderer;
    private _panPlane;
    private readonly _anchor;
    private readonly _center;
    private readonly _dragWorldPosition;
    private _dragging;
    constructor(rootNode: Node);
    setColor(color: Color): void;
    onInitEditHandles(): void;
    getDragWorldPosition(out: Vec3): Vec3;
    cancelDrag(): void;
    createEditHandle(handleName: string, color: Color): import("../../utils/defines").IHandleData;
    private createHeadNode;
    private initShape;
    _updateEditHandle(handleName: string): void;
    updatePosition(center: Readonly<Vec3>, anchor: Readonly<Vec3>): void;
    protected onMouseDown(event: GizmoMouseEvent): void;
    protected onMouseMove(event: GizmoMouseEvent): void;
    protected onMouseUp(event: GizmoMouseEvent): void;
    protected onMouseLeave(event: GizmoMouseEvent): void;
    onHide(): void;
    private endDrag;
    destroy(): void;
}
export default Joint2DController;
