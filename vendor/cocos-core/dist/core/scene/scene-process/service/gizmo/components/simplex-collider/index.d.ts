import { SimplexCollider } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import PointController from '../../controller/point';
import LineController from '../../controller/line';
import TriangleController from '../../controller/triangle';
import TetrahedronController from '../../controller/tetrahedron';
declare class SimplexColliderGizmo extends GizmoBase<SimplexCollider> {
    private _shapeControllers;
    private _activeController;
    init(): void;
    createControllerByShape(shape: SimplexCollider.ESimplexType): PointController | LineController | TriangleController | TetrahedronController | null;
    getControllerByShape(shape: SimplexCollider.ESimplexType): any;
    onShow(): void;
    onHide(): void;
    updateControllerData(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof SimplexColliderGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
