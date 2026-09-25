import { Canvas } from 'cc';
import GizmoBase from '../base/gizmo-base';
declare class CanvasPersistentGizmo extends GizmoBase<Canvas> {
    private _rectNode;
    private _rectMR;
    init(): void;
    onShow(): void;
    onHide(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
    onUpdate(): void;
    private _updateRect;
}
export declare const name: string;
export declare const PersistentGizmo: typeof CanvasPersistentGizmo;
export {};
