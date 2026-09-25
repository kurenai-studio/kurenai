import { LODGroup } from 'cc';
import GizmoBase from '../../base/gizmo-base';
declare class LODGroupGizmo extends GizmoBase<LODGroup> {
    private _controller;
    init(): void;
    onEditorCameraMoved(): void;
    onShow(): void;
    onHide(): void;
    destroy(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
    private updateController;
}
export declare const name: string;
export declare const SelectGizmo: typeof LODGroupGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
