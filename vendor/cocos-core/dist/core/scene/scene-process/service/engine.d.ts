import { Component, GeometryRenderer as CCGeometryRenderer, Node } from 'cc';
import { GeometryRenderer } from './engine/geometry_renderer';
import { BaseService } from './core';
import type { ICustomLayerConfig, IEngineEvents, IEngineService } from '../../common';
declare enum NeedAnimState {
    CAMERA_ORBIT = 0,
    CAMERA_PAN = 1,
    CAMERA_WANDER = 2,
    ANIMATION_MODE = 3,
    PARTICLE_SYSTEM_MODE = 4,
    TERRAIN_SYSTEM_MODE = 5,
    GAME_VIEW_MODE = 6
}
/**
 * 引擎管理器，用于引擎相关操作
 */
export declare class EngineService extends BaseService<IEngineEvents> implements IEngineService {
    private _setTimeoutId;
    private _rafId;
    private _maxDeltaTimeInEM;
    private _stateRecord;
    private _shouldRepaintInEM;
    private _tickInEM;
    private _tickedFrameInEM;
    private _paused;
    private _capture;
    private _bindTick;
    private geometryRenderer;
    private _sceneTick;
    private _nodeChangeTimer;
    private _particleSelectedUUIDs;
    private _stoppedParticleSet;
    init(): Promise<void>;
    setTimeout(callback: any, time: number): void;
    clearTimeout(): void;
    repaintInEditMode(): Promise<void>;
    forceRepaintInEditMode(): void;
    /**
     * 渲染调试视图（DebugView）：单一通道调试 / 组合光照项开关 / 纯光照带固有色 / 级联阴影染色。
     * 与 cocos-editor scene-facade-manager.changeDebugOption 对齐。
     * 注意：不对外暴露为公共 API（未加入 IEngineService / EngineProxy，不生成到 cocos-cli-types）；
     * 目前仅由场景编辑器页面（scene-editor.ejs）在浏览器内通过 window.cli.Scene.Engine 直接调用。
     * @param key 'single' | 'composite' | 'LIGHTING_WITH_BASE_COLOR' | 'CSM_LAYER_COLORATION'
     * @param value single: DebugViewSingleType 数值；composite: { key: DebugViewCompositeType | 10000(=ALL), value: boolean }；其余: boolean
     */
    changeDebugOption(key: string, value: any): Promise<void>;
    syncDesignResolution(): Promise<void>;
    initCustomLayer(layers?: ICustomLayerConfig[]): Promise<void>;
    /**
     * 运行时重建物理碰撞分组枚举（cc.internal.PhysicsGroup / PhysicsGroup2D）。
     *
     * 分组只在 cc.game.init 时从 physics.collisionGroups 读一次并生成枚举，改配置后不重建就要重启 IDE
     * （属性面板 Group 下拉的 enumList 直接来自该枚举）。这里对齐 cocos-editor 的 updatePhysicsGroup：
     * 用 cc.Enum.update 就地更新枚举，再对当前选中节点广播 node:change，让属性面板重新 dump 拿到新分组。
     *
     * 与 cocos-editor 不同点：这里按「内置 DEFAULT + 当前分组」完整重建，先清掉所有旧的用户分组条目，
     * 以支持分组的删除 / 重命名（editor 只做覆盖，删除后残留旧项）。
     */
    updatePhysicsGroup(groups?: {
        index: number;
        name: string;
    }[]): void;
    setFrameRate(fps: number): void;
    startTick(): void;
    stopTick(): void;
    tickInEditMode(deltaTime: number): void;
    getGeometryRenderer(): GeometryRenderer & Pick<CCGeometryRenderer, "addDashedLine" | "addTriangle" | "addQuad" | "addBoundingBox" | "addCross" | "addFrustum" | "addCapsule" | "addCylinder" | "addCone" | "addCircle" | "addArc" | "addPolygon" | "addDisc" | "addSector" | "addSphere" | "addTorus" | "addOctahedron" | "addBezier" | "addMesh" | "addIndexedMesh">;
    enterState(state: NeedAnimState): void;
    exitState(state: NeedAnimState): void;
    enterAnimationMode(): void;
    exitAnimationMode(): void;
    resume(): void;
    pause(): void;
    checkToSetAnimState(nodes: Node[]): void;
    private _tick;
    private _updateTickState;
    private _isTickAllowed;
    get capture(): boolean;
    set capture(b: boolean);
    private _getNodeByPath;
    private _getNodeByUuid;
    onEditorOpened(): void;
    onEditorClosed(): void;
    onEditorReload(): void;
    onNodeChanged(node: Node, opts?: any): void;
    private _doNodeChanged;
    onComponentAdded(comp: Component): void;
    onComponentRemoved(comp: Component): void;
    onSetPropertyComponent(): void;
    onSelectionSelect(path: string, paths: string[]): void;
    onSelectionUnselect(path: string, paths: string[]): void;
    onSelectionClear(): void;
    private _playParticlesOnSelect;
    private _pauseParticlesOnUnselect;
    private _stopAllParticles;
    private _getSelectedParticleSystems;
    private _isParticleSystem3D;
}
export { NeedAnimState };
