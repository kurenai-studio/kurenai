import { SkinnedMeshRenderer } from 'cc';
import GizmoBase from '../../base/gizmo-base';
declare class SkinningModelComponentGizmo extends GizmoBase<SkinnedMeshRenderer> {
    private _controller;
    private _tetraHelper;
    init(): void;
    onShow(): void;
    onHide(): void;
    updateControllerData(): void;
    updateControllerTransform(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
    onUpdate(): void;
    onLightProbeChanged(): void;
    onDestroy(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof SkinningModelComponentGizmo;
export declare const IconGizmo: null;
export declare const PersistentGizmo: null;
export {};
