import { Camera, Color, ISizeLike, Rect } from 'cc';
import CameraControllerBase, { EditorCameraInfo } from './camera-controller-base';
import Grid from './grid';
import type { ISceneMouseEvent, ISceneKeyboardEvent } from '../operation/types';
export declare class CameraController2D extends CameraControllerBase {
    private _size;
    private _modeFSM;
    private _idleMode;
    private _panMode;
    private _lineColor;
    private _grid;
    private _ruler;
    private _contentRect;
    private _scale2D;
    protected _wheelSpeed: number;
    protected _near: number;
    protected _far: number;
    private _spaceKeyHeld;
    private _posAnim;
    isMoving(): boolean;
    get lineColor(): Color;
    set lineColor(value: Color);
    get grid(): Grid;
    get contentRect(): Rect;
    get scale2D(): number;
    /**
     * 同步 scale2D 到 Gizmo（如果可用）
     */
    private setScale2D;
    showGrid(visible: boolean): void;
    init(camera: Camera): void;
    private _initMode;
    private _initGrid;
    set active(value: boolean);
    private _adjustToCenter;
    private _fitSizeCalc;
    private _getSizeScale;
    adjustCamera(immediate?: boolean): void;
    private _updateOrthoHeight;
    private _updateGridData;
    updateGrid(): void;
    /**
     * 相机更新后立即用最新矩阵刷新刻度。
     * 各交互流程（缩放/拖拽/复位/resize）都以 adjustCamera 收尾，
     * 在此处重画可保证刻度不再滞后一帧。
     */
    private _refreshRuler;
    /**
     * 刻度尺用的屏幕映射：用渲染相机的 worldToScreen 矩阵换算，
     * 自动包含父节点变换 / zoom / 视口等所有因素，与最终画面逐像素一致；
     * 正交投影下映射是仿射的，取 3 个世界点拟合出线性系数即可。
     */
    private _rulerView;
    private initOriginAxis;
    private initOriginAxisFromConfig;
    updateOriginAxisByConfig(config: {
        x?: boolean;
        y?: boolean;
    }, update?: boolean): void;
    updateOriginAxis(): void;
    focus(nodeUuids: string[], editorCameraInfo?: EditorCameraInfo, immediate?: boolean): void;
    smoothScale(delta: number, curScale: number): number;
    scale(delta: number, offsetX?: number, offsetY?: number): void;
    fitSize(rect: Rect): void;
    onMouseDown(event: ISceneMouseEvent): boolean;
    onMouseMove(event: ISceneMouseEvent): void;
    onMouseUp(event: ISceneMouseEvent): boolean;
    onMouseWheel(event: ISceneMouseEvent): void;
    onMouseDBlDown(event: ISceneMouseEvent): void;
    onKeyDown(event: ISceneKeyboardEvent): void;
    onKeyUp(event: ISceneKeyboardEvent): void;
    onUpdate(deltaTime: number): void;
    onResize(size?: ISizeLike): void;
    refresh(): void;
    zoomTo(scaleValue: number): void;
    zoomUp(): void;
    zoomDown(): void;
    zoomReset(): void;
    onDesignResolutionChange(): void;
}
export default CameraController2D;
