import GizmoBase from '../../base/gizmo-base';
import ImageController from '../../controller/image';
declare class WebViewPersistentGizmo extends GizmoBase {
    protected _controller: ImageController;
    init(): void;
    onShow(): void;
    onHide(): void;
    syncImageControllerData(): void;
    updateControllerTransform(): void;
    updateController(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
}
export declare const name: string;
export declare const SelectGizmo: null;
export declare const IconGizmo: null;
export declare const PersistentGizmo: typeof WebViewPersistentGizmo;
export {};
