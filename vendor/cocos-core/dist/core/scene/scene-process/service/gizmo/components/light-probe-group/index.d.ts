import { LightProbeGroup } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import IconGizmoBase from '../../base/gizmo-icon';
/**
 * 光照探针组（LightProbeGroup）选中 Gizmo — 对齐 Cocos Creator：
 * - 全部探针小球（#F1A348，世界固定尺寸）；
 * - 整组内部四面体线框（#FCE7C4，取自 scene.globals.lightProbeInfo.data）；
 * - 绿色生成包围盒，支持逐面非对称拖拽（改 minPos/maxPos），松手重生成探针。
 */
declare class LightProbeGroupComponentGizmo extends GizmoBase<LightProbeGroup> {
    private _controller;
    private _dotsRoot;
    private _wireframeNode;
    private _probesRef;
    private _dotsVolume;
    private _reuseMesh;
    private _lastInfoSig;
    private _minPos;
    private _maxPos;
    private _scale;
    private _minPropPath;
    private _maxPropPath;
    init(): void;
    onShow(): void;
    onHide(): void;
    createController(): void;
    onControllerMouseDown(): void;
    onControllerMouseMove(event: any): void;
    onControllerMouseUp(): void;
    updateDataFromController(event: any): void;
    updateControllerTransform(): void;
    updateControllerData(): void;
    private _getLightProbeInfo;
    /** 探针球：按 target.probes（节点本地坐标）画，仅引用变化时重建 */
    private _rebuildDots;
    /** 整组内部四面体线框：取自 lightProbeInfo.data（世界坐标） */
    private _rebuildWireframe;
    onTargetUpdate(): void;
    onNodeChanged(): void;
    onLightProbeChanged(): void;
    onUpdate(): void;
    private _computeInfoSig;
    onDestroy(): void;
}
declare class LightProbeGroupIconGizmo extends IconGizmoBase<LightProbeGroup> {
    disableOnSelected: boolean;
    createController(): void;
}
export declare const name: string;
export declare const SelectGizmo: typeof LightProbeGroupComponentGizmo;
export declare const IconGizmo: typeof LightProbeGroupIconGizmo;
export declare const PersistentGizmo: null;
export {};
