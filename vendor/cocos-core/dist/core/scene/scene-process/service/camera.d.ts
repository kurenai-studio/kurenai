import { Vec3 } from 'cc';
import { BaseService } from './core';
import { CameraController2D } from './camera/camera-controller-2d';
import { CameraController3D } from './camera/camera-controller-3d';
import CameraControllerBase from './camera/camera-controller-base';
import EditorCameraComponent from './camera/editor-camera-component';
import type { ICameraConfig, ICameraEvents, ICameraService, IOriginAxesConfig } from '../../common';
/**
 * 相机服务，管理编辑器相机的 2D/3D 控制器切换、输入事件绑定和相机属性
 */
export declare class CameraService extends BaseService<ICameraEvents> implements ICameraService {
    private _controller2D;
    private _controller3D;
    private _controller;
    private _camera;
    private _controllerFirstChange;
    private _currentUuid;
    private _cameraInfos;
    private _cameraUuids;
    get controller2D(): CameraController2D;
    get controller3D(): CameraController3D;
    get controller(): CameraControllerBase;
    get camera(): EditorCameraComponent;
    set is2D(value: boolean);
    get is2D(): boolean;
    init(): void;
    /**
     * 场景就绪时调用，创建编辑器相机并初始化控制器
     */
    onEditorOpened(): void;
    private _restoreCameraView;
    private _getCurrentViewUuid;
    private _refreshSelectedGizmos;
    initFromConfig(): Promise<void>;
    /**
     * 加载相机视角记忆（按 scene UUID 存储）。每次打开场景都要重新加载，
     * 因为 CameraService 会在多个场景间复用，只在首次创建相机时加载会导致后续场景取到旧数据。
     */
    loadCameraInfos(): Promise<void>;
    private _applyGizmoDisplay;
    private _applyGizmoViewMode;
    setGridColor(color: number[], persist?: boolean): void;
    setOriginAxes2D(originAxes: IOriginAxesConfig): void;
    setOriginAxes3D(originAxes: IOriginAxesConfig): void;
    private _applyConfig;
    private _saveConfig;
    private bindOperation;
    focus(nodes?: string[] | null, editorCameraInfo?: any, immediate?: boolean): void;
    defaultFocus(uuid: string): void;
    rotateCameraToDir(dir: Vec3, rotateByViewDist: boolean): void;
    changeProjection(): void;
    setGridVisible(value: boolean, persist?: boolean): void;
    isGridVisible(): boolean;
    private _syncControllerGridVisibility;
    setCameraProperty(options: any, persist?: boolean): void;
    resetCameraProperty(): void;
    queryConfig(): ICameraConfig;
    updateConfig(config: Partial<ICameraConfig>): void;
    getCameraFov(): number;
    zoomUp(): void;
    zoomDown(): void;
    zoomReset(): void;
    alignNodeToSceneView(nodes: string[]): void;
    alignSceneViewToNode(nodes: string[]): void;
    onUpdate(deltaTime: number): void;
    private onMouseDBlDown;
    private onMouseDown;
    private onMouseMove;
    private onMouseUp;
    private onMouseWheel;
    private onKeyDown;
    private onKeyUp;
    onResize(size: any): void;
    refresh(): void;
    getCamera(): EditorCameraComponent;
    getCurCameraInfo(): any;
    saveCameraInfos(uuid?: string, write?: boolean): Promise<void>;
    onEditorClosed(): void;
    onEditorSaved(): void;
    /**
     * 与原始编辑器 ScenePreview.detachSceneCameras 一致：
     * 将所有非编辑器的场景相机从渲染管线中移除，并设置 tempWindow
     * 使后续新建的相机默认渲染到离屏窗口，不干扰编辑器相机。
     */
    private _detachSceneCameras;
    /**
     * 新增的 Camera 组件也需要 detach，与原始编辑器 ScenePreview.onComponentAdded 一致
     */
    detachNewSceneCamera(comp: any): void;
    onComponentAdded(comp: any): void;
}
