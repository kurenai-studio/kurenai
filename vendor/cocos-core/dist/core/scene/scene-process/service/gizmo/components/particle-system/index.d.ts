import { ParticleSystem, Vec3 } from 'cc';
type TShapeController = any;
declare const ParticleSystemComponentGizmo_base: any;
declare class ParticleSystemComponentGizmo extends ParticleSystemComponentGizmo_base {
    private _boundingBoxController;
    private _curEmitterShape;
    private _shapeControllers;
    private _PSGizmoColor;
    private _activeController;
    private _pSGizmoRoot;
    private _scale;
    private _size;
    private _radius;
    private _arc;
    private _coneHeight;
    private _coneAngle;
    private _bottomRadius;
    private _bbHalfSize;
    init(): void;
    createController(): void;
    onShow(): void;
    onHide(): void;
    createControllerByShape(shape: any): TShapeController | null;
    getControllerByShape(shape: any): TShapeController | null;
    getConeData(psComp: ParticleSystem): {
        topRadius: number;
        height: number;
        bottomRadius: number;
        coneAngle: number;
    };
    modifyConeData(psComp: ParticleSystem, deltaTopRadius: number, deltaHeight: number, deltaBottomRadius: number): void;
    setCurveRangeInitValue(curve: any, value: any): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(): void;
    onControllerMouseUp(): void;
    getScaledDeltaRadius(deltaRadius: number, controlDir: Vec3, scale: Vec3): number;
    updateDataFromController(): void;
    updateControllerTransform(): void;
    updateControllerData(): void;
    onTargetUpdate(): void;
    onNodeChanged(): void;
    updateDataFromBBController(): void;
    updateBBControllerData(): void;
    onBBControllerMouseDown(): void;
    onBBControllerMouseMove(): void;
    onBBControllerMouseUp(): void;
    showBoundingBox(isShow: boolean): void;
    isShowBoundingBox(): any;
}
declare const ParticleSystemIconGizmo_base: any;
declare class ParticleSystemIconGizmo extends ParticleSystemIconGizmo_base {
    disableOnSelected: boolean;
    createController(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof ParticleSystemComponentGizmo;
export declare const IconGizmo: typeof ParticleSystemIconGizmo;
export declare const PersistentGizmo: null;
export declare const methods: {
    showBoundingBox(uuid: string, isShow: boolean): void;
    isShowBoundingBox(uuid: string): boolean | undefined;
};
export {};
