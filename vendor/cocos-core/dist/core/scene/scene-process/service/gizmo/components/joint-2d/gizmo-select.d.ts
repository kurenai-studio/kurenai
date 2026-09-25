import { Color, Joint2D, Vec3 } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import Joint2DController from './controller-joint-2d';
/**
 * 所有 Joint2D 选择 Gizmo 的共享实现。
 *
 * 同步并显示 anchor、connectedAnchor，把两个 Handle 的世界坐标写回
 * 各自所属坐标空间，并为每次连续拖动建立对应属性的 scoped Undo。
 */
export declare class Joint2DGizmo<T extends Joint2D = Joint2D> extends GizmoBase<T> {
    protected _anchorController: Joint2DController;
    protected _connectedAnchorController: Joint2DController;
    protected readonly _anchorWorldPosition: Vec3;
    protected readonly _connectedAnchorWorldPosition: Vec3;
    protected readonly _anchorColor: Color;
    protected readonly _connectedAnchorColor: Color;
    private _dragState;
    private _trackedConnectedBody;
    private _trackedConnectedNode;
    private readonly _trackedConnectedWorldMatrix;
    private _hasTrackedConnectedWorldMatrix;
    protected init(): void;
    protected createController(): void;
    private bindController;
    protected onShow(): void;
    protected onHide(): void;
    protected updateControllerData(): void;
    protected updateAnchorControllerData(): boolean;
    protected onTargetUpdate(): void;
    onNodeChanged(): void;
    onUpdate(): void;
    private onControllerMouseDown;
    private onControllerMouseMove;
    private onControllerMouseUp;
    private finishActiveDrag;
    private cancelInvalidDrag;
    private isDragTargetValid;
    private getValidConnectedNode;
    private captureConnectedBodySignature;
    private hasConnectedBodySignatureChanged;
    private resetConnectedBodySignature;
    private writeAnchor;
    destroy(): void;
}
export default Joint2DGizmo;
