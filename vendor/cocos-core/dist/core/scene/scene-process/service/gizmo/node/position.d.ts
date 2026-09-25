import { IVec3Like, Node, Vec3 } from 'cc';
import type { GizmoMouseEvent } from '../utils/defines';
import TransformBaseGizmo from './transform-base';
import PositionController from './position-controller';
declare class PositionGizmo extends TransformBaseGizmo {
    disableUndo: boolean;
    disableSnap: boolean;
    private readonly _nodesWorldPosList;
    private _snapMode;
    private _snapMouseDown;
    private _mouseDown;
    private _handler;
    private _event;
    /** 顶点吸附时选中的顶点，相对于节点的位置 */
    private _nodeToSnapVertex;
    private _gizmoMouseEventListeners;
    private _axisController;
    getFirstLockNode(): Node | undefined;
    isNodeLocked(node: Node): boolean;
    init(): void;
    layer(): string;
    onTargetUpdate(): void;
    createAxisLine(): void;
    createController(): void;
    get controller(): PositionController | null;
    set controller(val: PositionController | null);
    addMouseEventListener(listener: any): string;
    removeMouseEventListener(id: string): void;
    checkLock(event: GizmoMouseEvent): void;
    onControllerMouseDown(event: GizmoMouseEvent): void;
    onControllerMouseMove(event: GizmoMouseEvent): void;
    onControllerMouseUp(_event: GizmoMouseEvent): void;
    onKeyDown(event: any): undefined | false | true;
    onKeyUp(event: any): boolean;
    applySnapIncrement(out: Vec3 | undefined, snapStep: IVec3Like, controllerName: string): Vec3;
    /** 获取某一轴向应用了单位捕捉增量的值 */
    applySnapIncrementForAxis(out: Vec3 | undefined, deltaPosOfAxis: Readonly<Vec3>, snapStep: IVec3Like, axis: 'x' | 'y' | 'z'): Vec3;
    updateDataFromController(event: GizmoMouseEvent): void;
    updateControllerTransform(force?: boolean): void;
    /**
     * 处理上下左右按键移动
     */
    onArrowDown(event: any): boolean;
    onArrowUp(event: any): boolean;
    onSurfaceSnapDown(event: any): boolean;
    onSurfaceSnapUp(event: any): boolean;
    onVertexSnapDown(event: any): boolean;
    onVertexSnapUp(event: any): boolean;
    updateSnapUI(isSnapping: boolean): void;
    onVertexSnapMove(event: GizmoMouseEvent): boolean | undefined;
    /**
     * 顶点吸附模式下，左键没按下时，鼠标移动可以修改想要拖动的顶点
     */
    updateVertexPos(event: GizmoMouseEvent): void;
    /**
     * 修改gizmo的位置
     */
    setGizmoPosition(pos: Vec3): void;
    /**
     * 计算吸附到目标点需要的delta
     */
    calculateDeltaPos(out: Vec3, snapWorldPos: Vec3): void;
    /**
     * 获取非target中的节点(吸附时需要排除自身)
     */
    getNodeExcludeTarget(resultNodes: any[]): any | null;
    /**
     * 计算吸附模式下的实际偏移值
     */
    updateSnapPosition(pos: Vec3, event: GizmoMouseEvent): void;
    /**
     * 在 3D 视图中显示根据你拖动的 x y z 显示对应的轴线
     */
    axisControllerHandlerMouseDown(event: GizmoMouseEvent): void;
    /**
     * 更新轴线的坐标
     */
    axisControllerHandlerMouseMove(): void;
    /**
     * 隐藏轴线
     */
    axisControllerHandlerMouseUp(): void;
}
export default PositionGizmo;
