import GizmoBase from '../base/gizmo-base';
import type { TransformToolDataToolNameType } from '../transform-tool';
import { Node, Component } from 'cc';
declare class TransformGizmo extends GizmoBase<Component> {
    private _gizmo;
    protected updateControllerTransform?(): void;
    private _eventMap;
    constructor(target: Component | null);
    get nodes(): Node[];
    set target(value: Component | null);
    get target(): Component | null;
    changeTool(name: TransformToolDataToolNameType): void;
    init(): void;
    show(): void;
    hide(): void;
    onShow(): void;
    onHide(): void;
    onUpdate(deltaTime: number): void;
    onDestroy(): void;
    onNodeChanged(event: any): void;
    onKeyDown(event: any): boolean | undefined;
    onKeyUp(event: any): boolean;
    onVertexSnapMove(event: any): any;
    onCameraControlModeChanged(mode: number): void;
}
export default TransformGizmo;
