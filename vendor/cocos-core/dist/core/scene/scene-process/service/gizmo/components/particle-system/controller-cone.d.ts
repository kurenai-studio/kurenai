import { Node, Vec3, Color } from 'cc';
import type { GizmoMouseEvent } from '../../utils/defines';
import EditableController from '../../controller/editable';
/**
 * 粒子系统专用的圆锥体发射器控制器：
 * 与通用 ConeController（用于 ConeCollider/SpotLight）不同，粒子系统的圆锥发射器
 * 需要同时编辑顶部半径（radius）、高度（height）与底部半径（bottomRadius），
 * 因此在此单独实现，避免影响现有的碰撞体/灯光圆锥控制器。
 * 与 cocos-editor 中 components/particle-system/controller-cone.ts 保持一致。
 */
declare class ParticleSystemConeController extends EditableController {
    private _oriDir;
    private _center;
    private _radius;
    private _height;
    private _bottomRadius;
    private _deltaRadius;
    private _deltaHeight;
    private _deltaBottomRadius;
    private _coneLineNode;
    private _circleNode;
    private _bottomCircleNode;
    private _circleFromDir;
    private _coneLineMR;
    private _circleMR;
    private _bottomCircleMR;
    private _mouseDeltaPos;
    private _curDistScalar;
    private _axisDir;
    constructor(rootNode: Node);
    get radius(): number;
    set radius(value: number);
    get height(): number;
    set height(value: number);
    setColor(color: Color): void;
    _updateEditHandle(axisName: string): void;
    initShape(): void;
    getConeLineData(): import("../../utils/defines").IMeshPrimitive;
    updateSize(center: Vec3, radius: number, height: number, bottomRadius: number): void;
    onMouseDown(event: GizmoMouseEvent): void;
    onMouseMove(event: GizmoMouseEvent): void;
    onMouseUp(event: GizmoMouseEvent): void;
    onMouseLeave(event: GizmoMouseEvent): void;
    getDeltaRadius(): number;
    getDeltaHeight(): number;
    getDeltaBottomRadius(): number;
}
export default ParticleSystemConeController;
