import { Node } from 'cc';
/**
 * 影响当前所选物体的光照探针四面体高亮（忠实移植自 Cocos Creator
 * `controller-light-probe-tetrahedron.ts`）：
 * 选中开启“使用光照探针”的 MeshRenderer/SkinnedMeshRenderer 时，用引擎已算好的
 * `model.tetrahedronIndex` 取其所在四面体，画出该四面体的探针小球（SH 受光，effect
 * `internal/editor/light-probe-visualization`）+ 连线。
 */
export declare class LightProbeTetraHelper {
    private _root;
    private _container;
    private _spheres;
    private _lineNode;
    private _shData;
    private _lastSig;
    constructor(root: Node | null);
    hide(): void;
    /** 使缓存失效：下次 update 强制重建（用于探针数据/烘焙/设置变化，覆盖所有 SH 系数与法线等输入）。 */
    invalidate(): void;
    destroy(): void;
    /**
     * @param comp MeshRenderer 或 SkinnedMeshRenderer（含 bakeSettings / node / model）
     */
    update(comp: any): void;
    private _ensureNodes;
}
