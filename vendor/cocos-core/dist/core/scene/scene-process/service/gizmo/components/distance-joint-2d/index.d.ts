import { DistanceJoint2D } from 'cc';
import { SelectGizmo as Joint2DGizmo } from '../joint-2d';
declare class DistanceJoint2DGizmo extends Joint2DGizmo<DistanceJoint2D> {
    private _anchorLineController;
    protected createController(): void;
    protected onHide(): void;
    protected updateAnchorControllerData(): boolean;
    destroy(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof DistanceJoint2DGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
