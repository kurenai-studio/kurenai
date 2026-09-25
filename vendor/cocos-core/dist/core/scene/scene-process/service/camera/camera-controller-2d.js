"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraController2D = void 0;
const cc_1 = require("cc");
const camera_controller_base_1 = __importDefault(require("./camera-controller-base"));
const utils_1 = require("./utils");
const finite_state_machine_1 = __importDefault(require("../utils/state-machine/finite-state-machine"));
const grid_1 = __importDefault(require("./grid"));
const ruler_2d_1 = require("./ruler-2d");
const idle_mode_2d_1 = require("./modes/idle-mode-2d");
const pan_mode_2d_1 = require("./modes/pan-mode-2d");
const tween_1 = require("./tween");
const rpc_1 = require("../../rpc");
function getCanvasSize() {
    const canvas = cc.game?.canvas;
    if (canvas) {
        return { width: canvas.width, height: canvas.height };
    }
    return { width: 1280, height: 720 };
}
const _defaultMarginPercentage = 30;
const _maxTicks = 100;
function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
}
var ModeCommand;
(function (ModeCommand) {
    ModeCommand["ToIdle"] = "toIdle";
    ModeCommand["ToPan"] = "toPan";
})(ModeCommand || (ModeCommand = {}));
class CameraController2D extends camera_controller_base_1.default {
    _size = { width: 1920, height: 1080 };
    _modeFSM;
    _idleMode;
    _panMode;
    _lineColor = cc.color().fromHEX('#555555');
    _grid;
    _ruler;
    _contentRect;
    _scale2D = 1;
    _wheelSpeed = 6;
    _near = 1;
    _far = 10000;
    // 空格键跟踪，用于切换平移模式
    _spaceKeyHeld = false;
    // 动画状态
    _posAnim = null;
    isMoving() {
        return this._modeFSM.currentState !== this._idleMode;
    }
    get lineColor() { return this._lineColor; }
    set lineColor(value) { this._lineColor = value; }
    get grid() { return this._grid; }
    get contentRect() { return this._contentRect; }
    get scale2D() { return this._scale2D; }
    /**
     * 同步 scale2D 到 Gizmo（如果可用）
     */
    setScale2D(value) {
        this._scale2D = value;
        try {
            const { Service } = require('../core/decorator');
            if (Service.Gizmo?.transformToolData) {
                Service.Gizmo.transformToolData.scale2D = value;
            }
        }
        catch (e) {
            // Gizmo not ready
        }
    }
    showGrid(visible) {
        super.showGrid(visible);
        if (this._originAxisHorizontalMeshComp?.node) {
            this._originAxisHorizontalMeshComp.node.active = visible && (this.originAxisX_Visible || this.originAxisY_Visible);
        }
    }
    init(camera) {
        super.init(camera);
        this._size = getCanvasSize();
        this._contentRect = new cc_1.Rect(0, 0, this._size.width, this._size.height);
        this._gridMeshComp = utils_1.CameraUtils.createGrid('internal/editor/grid-2d', this.node.parent);
        this._gridMeshComp.node.active = false;
        this._initGrid();
        this._ruler = new ruler_2d_1.Ruler2D();
        this._ruler.onNeedRedraw = () => this._refreshRuler();
        this._ruler.init();
        this._initMode();
        this.initOriginAxis();
    }
    // ---------- 模式状态机 ----------
    _initMode() {
        this._idleMode = new idle_mode_2d_1.IdleMode2D(this);
        this._panMode = new pan_mode_2d_1.PanMode2D(this);
        const modes = [this._idleMode, this._panMode];
        this._modeFSM = new finite_state_machine_1.default(modes);
        // idle <-> pan 双向转换
        this._modeFSM.addTransition(this._idleMode, this._panMode, ModeCommand.ToPan);
        this._modeFSM.addTransition(this._panMode, this._idleMode, ModeCommand.ToIdle);
        this._modeFSM.Begin(this._idleMode);
    }
    // ---------- 网格初始化 ----------
    _initGrid() {
        const grid = new grid_1.default(this._size.width, this._size.height);
        grid.setScaleH([5, 2], 0.01, 5000);
        grid.setMappingH(0, 1, 1);
        grid.setScaleV([5, 2], 0.01, 5000);
        grid.setMappingV(1, 0, 1);
        grid.setAnchor(0.5, 0.5);
        this._grid = grid;
    }
    // ---------- active ----------
    set active(value) {
        if (value) {
            // 正交投影
            this._camera.projection = cc_1.Camera.ProjectionType.ORTHO;
            // 重置旋转为单位四元数
            this.node.setWorldRotation(cc_1.Quat.IDENTITY);
            this._camera.near = this._near;
            this._camera.far = this._far;
            this.onResize();
            this._ruler?.show(true);
            this.showGrid(true);
        }
        else {
            this._ruler?.show(false);
            this.showGrid(false);
        }
    }
    // ---------- 调整到中心 ----------
    _adjustToCenter(marginPercentage = _defaultMarginPercentage, contentBounds = null, immediate = false, forceScale) {
        let contentX = 0;
        let contentY = 0;
        let contentWidth = 0;
        let contentHeight = 0;
        if (contentBounds) {
            contentX = contentBounds.x;
            contentY = contentBounds.y;
            contentWidth = contentBounds.width;
            contentHeight = contentBounds.height;
        }
        else {
            contentWidth = this._size.width;
            contentHeight = this._size.height;
        }
        let scale = forceScale ?? 1;
        const leftMargin = (marginPercentage / 100) * this._size.width;
        const rightMargin = (marginPercentage / 100) * this._size.height;
        const fitW = this._size.width - leftMargin;
        const fitH = this._size.height - rightMargin;
        if (!forceScale) {
            if (contentWidth <= fitW && contentHeight <= fitH) {
                if (contentWidth === 0 || contentHeight === 0) {
                    scale = 1;
                }
                else {
                    const targetAspect = contentWidth / contentHeight;
                    const displayAspect = fitW / fitH;
                    if (targetAspect > displayAspect) {
                        scale = fitW / contentWidth;
                    }
                    else {
                        scale = fitH / contentHeight;
                    }
                    contentWidth = contentWidth * scale;
                    contentHeight = contentHeight * scale;
                }
            }
            else {
                const result = this._fitSizeCalc(contentWidth, contentHeight, fitW, fitH);
                scale = this._getSizeScale(result[0], result[1], contentWidth, contentHeight);
                contentWidth = result[0];
                contentHeight = result[1];
            }
        }
        this.setScale2D(scale);
        const gridX = ((this._size.width - contentWidth) / 2 - contentX * scale) * this._grid.xDirection;
        const gridY = ((this._size.height - contentHeight) / 2 - contentY * scale) * this._grid.yDirection;
        this._grid.xAxisSync(gridX, scale);
        this._grid.yAxisSync(gridY, scale);
        this.updateGrid();
        this.adjustCamera(immediate);
        if (contentBounds) {
            this._contentRect.x = contentX;
            this._contentRect.y = contentY;
            this._contentRect.width = contentWidth;
            this._contentRect.height = contentHeight;
        }
    }
    _fitSizeCalc(srcWidth, srcHeight, destWidth, destHeight) {
        let width = 0;
        let height = 0;
        if (srcWidth > destWidth && srcHeight > destHeight) {
            width = destWidth;
            height = (srcHeight * destWidth) / srcWidth;
            if (height > destHeight) {
                height = destHeight;
                width = (srcWidth * destHeight) / srcHeight;
            }
        }
        else if (srcWidth > destWidth) {
            width = destWidth;
            height = (srcHeight * destWidth) / srcWidth;
        }
        else if (srcHeight > destHeight) {
            width = (srcWidth * destHeight) / srcHeight;
            height = destHeight;
        }
        else {
            width = srcWidth;
            height = srcHeight;
        }
        return [width, height];
    }
    _getSizeScale(newWidth, newHeight, oldWidth, oldHeight) {
        const scaleWidth = oldWidth <= 0 ? 1 : newWidth / oldWidth;
        const scaleHeight = oldHeight <= 0 ? 1 : newHeight / oldHeight;
        return Math.max(scaleWidth, scaleHeight);
    }
    // ---------- adjustCamera ----------
    adjustCamera(immediate = true) {
        if (!this._camera)
            return;
        const scale = this._scale2D;
        const grid = this._grid;
        const sceneX = grid.xDirection * grid.xAxisOffset;
        const sceneY = grid.yDirection * grid.yAxisOffset;
        // 反向计算出 contentRect，与编辑器一致
        this._contentRect.x = ((this._size.width - this._contentRect.width) / 2 - grid.xAxisOffset / grid.xDirection) / scale;
        this._contentRect.y = ((this._size.height - this._contentRect.height) / 2 - grid.yAxisOffset / grid.yDirection) / scale;
        this._contentRect.width = this._size.width;
        this._contentRect.height = this._size.height;
        const targetPos = new cc_1.Vec3(this._size.width / 2 / scale - sceneX / scale, this._size.height / 2 / scale - sceneY / scale, 5000);
        if (immediate) {
            this.node.setWorldPosition(targetPos);
        }
        else {
            const startPos = this.node.getWorldPosition().clone();
            this._posAnim = (0, tween_1.tweenPosition)(startPos, targetPos, 300);
            this._posAnim.step((pos) => {
                this.node.setWorldPosition(pos);
                this._refreshRuler();
            });
        }
        this._updateOrthoHeight(scale);
        this._refreshRuler();
        try {
            const { Service } = require('../core/decorator');
            Service.Engine?.repaintInEditMode?.();
        }
        catch (e) {
            // Engine may not be ready
        }
    }
    // ---------- 更新正交高度 ----------
    _updateOrthoHeight(scale) {
        if (scale > 0) {
            this._camera.orthoHeight = this._size.height / 2 / scale;
        }
    }
    // ---------- 网格数据更新 ----------
    _updateGridData() {
        this._grid.updateRange();
        const positions = [];
        const colors = [];
        const indices = [];
        const left = this._grid.left;
        const right = this._grid.right;
        const top = this._grid.top;
        const bottom = this._grid.bottom;
        const r = this._lineColor.r / 255;
        const g = this._lineColor.g / 255;
        const b = this._lineColor.b / 255;
        const baseAlpha = this._lineColor.a / 255;
        let idx = 0;
        // 竖线 (hTicks)
        if (this._grid.hTicks) {
            for (let level = this._grid.hTicks.minTickLevel; level <= this._grid.hTicks.maxTickLevel; level++) {
                const ticks = this._grid.hTicks.ticksAtLevel(level, true);
                const ratio = this._grid.hTicks.tickRatios[level];
                const alpha = baseAlpha * ratio;
                for (const tick of ticks) {
                    if (idx + 2 > _maxTicks * _maxTicks)
                        break;
                    // 如果显示了中心轴，就跳过绘制网格的垂直中线
                    if (this.originAxisY_Visible && 0 === tick)
                        continue;
                    // 竖线：固定 x，从 bottom 到 top
                    positions.push(tick, bottom);
                    colors.push(r, g, b, alpha);
                    idx++;
                    positions.push(tick, top);
                    colors.push(r, g, b, alpha);
                    idx++;
                }
            }
        }
        // 横线 (vTicks)
        if (this._grid.vTicks) {
            for (let level = this._grid.vTicks.minTickLevel; level <= this._grid.vTicks.maxTickLevel; level++) {
                const ticks = this._grid.vTicks.ticksAtLevel(level, true);
                const ratio = this._grid.vTicks.tickRatios[level];
                const alpha = baseAlpha * ratio;
                for (const tick of ticks) {
                    if (idx + 2 > _maxTicks * _maxTicks)
                        break;
                    // 如果显示了中心轴，就跳过绘制网格的横向中线
                    if (this.originAxisX_Visible && 0 === tick)
                        continue;
                    // 横线：固定 y，从 left 到 right
                    positions.push(left, tick);
                    colors.push(r, g, b, alpha);
                    idx++;
                    positions.push(right, tick);
                    colors.push(r, g, b, alpha);
                    idx++;
                }
            }
        }
        // 填充剩余为零
        while (idx < _maxTicks * _maxTicks) {
            positions.push(0, 0);
            colors.push(0, 0, 0, 0);
            idx++;
        }
        // 构建索引
        for (let i = 0; i < _maxTicks * _maxTicks; i++) {
            indices.push(i);
        }
        return { positions, colors, indices };
    }
    updateGrid() {
        if (!this._gridMeshComp)
            return;
        const { positions, colors, indices } = this._updateGridData();
        utils_1.CameraUtils.updateVBAttr(this._gridMeshComp, 'a_position', positions);
        utils_1.CameraUtils.updateVBAttr(this._gridMeshComp, cc_1.gfx.AttributeName.ATTR_COLOR, colors);
        utils_1.CameraUtils.updateIB(this._gridMeshComp, indices);
        this.updateOriginAxis();
        this._ruler?.updateTicks(this._grid, this._rulerView());
    }
    /**
     * 相机更新后立即用最新矩阵刷新刻度。
     * 各交互流程（缩放/拖拽/复位/resize）都以 adjustCamera 收尾，
     * 在此处重画可保证刻度不再滞后一帧。
     */
    _refreshRuler() {
        if (!this._ruler || !this._grid) {
            return;
        }
        this._ruler.updateTicks(this._grid, this._rulerView());
    }
    /**
     * 刻度尺用的屏幕映射：用渲染相机的 worldToScreen 矩阵换算，
     * 自动包含父节点变换 / zoom / 视口等所有因素，与最终画面逐像素一致；
     * 正交投影下映射是仿射的，取 3 个世界点拟合出线性系数即可。
     */
    _rulerView() {
        const rc = this._camera.camera;
        const p = this._camera.node.worldPosition;
        return (0, ruler_2d_1.buildRulerView)(rc, this._size, { orthoHeight: this._camera.orthoHeight, x: p.x, y: p.y });
    }
    // ---------- 原点轴 ----------
    initOriginAxis() {
        const parentNode = this.node.parent || this.node;
        this._originAxisHorizontalMeshComp = utils_1.CameraUtils.createGrid('internal/editor/grid-2d', parentNode);
        this.originAxisX_Visible = true;
        this.originAxisY_Visible = true;
        this._originAxisHorizontalMeshComp.node.active = false;
        void this.initOriginAxisFromConfig();
    }
    async initOriginAxisFromConfig() {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            const gizmos = await rpc.request('sceneConfigInstance', 'get', ['gizmo']);
            if (gizmos?.originAxis2D) {
                this.updateOriginAxisByConfig({
                    x: gizmos.originAxis2D.x,
                    y: gizmos.originAxis2D.y,
                }, false);
            }
        }
        catch {
            // Use the default 2D origin axes when config is unavailable.
        }
    }
    updateOriginAxisByConfig(config, update = true) {
        if (config.x !== undefined)
            this.originAxisX_Visible = config.x;
        if (config.y !== undefined)
            this.originAxisY_Visible = config.y;
        const showAxis = this.originAxisX_Visible || this.originAxisY_Visible;
        if (this._originAxisHorizontalMeshComp?.node) {
            this._originAxisHorizontalMeshComp.node.active = !!this._gridMeshComp?.node?.active && showAxis;
        }
        if (update) {
            this.updateOriginAxis();
        }
        try {
            const { Service } = require('../core/decorator');
            Service.Engine?.repaintInEditMode?.();
        }
        catch (e) {
            // Engine may not be ready
        }
    }
    updateOriginAxis() {
        if (!this._originAxisHorizontalMeshComp?.node?.active)
            return;
        const left = this._grid.left;
        const right = this._grid.right;
        const top = this._grid.top;
        const bottom = this._grid.bottom;
        const positions = [];
        const colors = [];
        const indices = [];
        if (this.originAxisX_Visible) {
            const lineLeft = Math.fround(Math.min(left, right)) - 100;
            const lineRight = Math.fround(Math.max(left, right)) + 100;
            positions.push(lineLeft, 0, lineRight, 0);
            const c = this.originAxisX_Color;
            colors.push(c.x, c.y, c.z, c.w, c.x, c.y, c.z, c.w);
        }
        if (this.originAxisY_Visible) {
            const lineTop = Math.fround(Math.min(top, bottom)) - 100;
            const lineBottom = Math.fround(Math.max(top, bottom)) + 100;
            positions.push(0, lineTop, 0, lineBottom);
            const c = this.originAxisY_Color;
            colors.push(c.x, c.y, c.z, c.w, c.x, c.y, c.z, c.w);
        }
        if (positions.length > 0) {
            for (let i = 0; i < positions.length; i += 2) {
                indices.push(i / 2);
            }
            utils_1.CameraUtils.updateVBAttr(this._originAxisHorizontalMeshComp, cc_1.gfx.AttributeName.ATTR_POSITION, positions);
            utils_1.CameraUtils.updateVBAttr(this._originAxisHorizontalMeshComp, cc_1.gfx.AttributeName.ATTR_COLOR, colors);
            utils_1.CameraUtils.updateIB(this._originAxisHorizontalMeshComp, indices);
        }
        try {
            const { Service } = require('../core/decorator');
            Service.Engine?.repaintInEditMode?.();
        }
        catch (e) {
            // Engine may not be ready
        }
    }
    // ---------- 焦点 ----------
    focus(nodeUuids, editorCameraInfo, immediate = false) {
        const { contentRect, scale } = editorCameraInfo || {};
        let contentBounds = null;
        if (contentRect) {
            contentBounds = new cc_1.Rect(contentRect.x, contentRect.y, contentRect.width, contentRect.height);
        }
        else if (nodeUuids && nodeUuids.length > 0) {
            const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
            if (!EditorExtends)
                return;
            let maxX = -1e10;
            let maxY = -1e10;
            let minX = 1e10;
            let minY = 1e10;
            for (const uuid of nodeUuids) {
                const node = EditorExtends.Node.getNode(uuid);
                if (!node)
                    continue;
                const uiTransform = node.getComponent(cc_1.UITransform);
                if (uiTransform) {
                    const bounds = uiTransform.getBoundingBoxToWorld();
                    maxX = Math.max(bounds.xMax, maxX);
                    maxY = Math.max(bounds.yMax, maxY);
                    minX = Math.min(bounds.xMin, minX);
                    minY = Math.min(bounds.yMin, minY);
                }
                else {
                    const meshRenderer = node.getComponent(cc_1.MeshRenderer)
                        || node.getComponent(cc_1.SpriteRenderer);
                    if (meshRenderer && meshRenderer.model && meshRenderer.model.worldBounds) {
                        const b = meshRenderer.model.worldBounds;
                        minX = Math.min(minX, b.center.x - b.halfExtents.x);
                        minY = Math.min(minY, b.center.y - b.halfExtents.y);
                        maxX = Math.max(maxX, b.center.x + b.halfExtents.x);
                        maxY = Math.max(maxY, b.center.y + b.halfExtents.y);
                    }
                    else {
                        const worldPos = node.getWorldPosition();
                        maxX = Math.max(worldPos.x, maxX);
                        maxY = Math.max(worldPos.y, maxY);
                        minX = Math.min(worldPos.x, minX);
                        minY = Math.min(worldPos.y, minY);
                    }
                }
            }
            if (minX < maxX && minY < maxY) {
                contentBounds = new cc_1.Rect(minX, minY, maxX - minX, maxY - minY);
            }
        }
        this._adjustToCenter(_defaultMarginPercentage, contentBounds, immediate, scale);
    }
    // ---------- 缩放 ----------
    smoothScale(delta, curScale) {
        return Math.pow(2, delta * 0.002) * curScale;
    }
    scale(delta, offsetX, offsetY) {
        const width = this._size.width;
        const height = this._size.height;
        let newScale = this.smoothScale(delta * this._wheelSpeed, this._scale2D);
        if (this._grid.hTicks) {
            newScale = clamp(newScale, this._grid.hTicks.minValueScale, this._grid.hTicks.maxValueScale);
        }
        const px = offsetX !== undefined ? offsetX : width / 2;
        const py = offsetY !== undefined ? offsetY : height / 2;
        this._grid.xAxisScaleAt(px, newScale);
        this._grid.yAxisScaleAt(py, newScale);
        this.setScale2D(newScale);
        this.updateGrid();
        this.adjustCamera();
    }
    // ---------- fitSize ----------
    fitSize(rect) {
        this._adjustToCenter(_defaultMarginPercentage, rect, true);
    }
    onMouseDown(event) {
        // 中键、右键或 view 模式下 → 进入平移模式（与编辑器一致）
        let isViewMode = false;
        try {
            const { Service } = require('../core/decorator');
            isViewMode = !!Service.Gizmo?.isViewMode;
        }
        catch (e) {
            // Gizmo not ready
        }
        if (event.middleButton || event.rightButton || isViewMode) {
            void this._modeFSM.issueCommand(ModeCommand.ToPan);
            return false;
        }
        const currentMode = this._modeFSM.currentState;
        return currentMode.onMouseDown(event);
    }
    onMouseMove(event) {
        const currentMode = this._modeFSM.currentState;
        currentMode.onMouseMove(event);
        try {
            const { Service } = require('../core/decorator');
            Service.Engine?.repaintInEditMode?.();
        }
        catch (e) {
            // Engine may not be ready
        }
    }
    onMouseUp(event) {
        // 与编辑器一致：Pan 模式下松开按键直接回 Idle（除非空格保持）
        if (this._modeFSM.currentState !== this._idleMode && !this._spaceKeyHeld) {
            void this._modeFSM.issueCommand(ModeCommand.ToIdle);
            return false;
        }
        const currentMode = this._modeFSM.currentState;
        return currentMode.onMouseUp(event);
    }
    onMouseWheel(event) {
        const delta = event.wheelDeltaY * this._wheelBaseScale;
        this.scale(delta, event.x, event.y);
        try {
            const { Service } = require('../core/decorator');
            Service.Engine?.repaintInEditMode?.();
        }
        catch (e) {
            // Engine may not be ready
        }
    }
    onMouseDBlDown(event) {
        const currentMode = this._modeFSM.currentState;
        currentMode.onMouseDBlDown(event);
    }
    onKeyDown(event) {
        // 空格键切换到平移模式
        if (event.key === ' ' || event.code === 'Space') {
            this._spaceKeyHeld = true;
            void this._modeFSM.issueCommand(ModeCommand.ToPan);
        }
        const currentMode = this._modeFSM.currentState;
        currentMode.onKeyDown(event);
    }
    onKeyUp(event) {
        // 释放空格键返回空闲模式
        if (event.key === ' ' || event.code === 'Space') {
            this._spaceKeyHeld = false;
            void this._modeFSM.issueCommand(ModeCommand.ToIdle);
        }
        const currentMode = this._modeFSM.currentState;
        currentMode.onKeyUp(event);
    }
    onUpdate(deltaTime) {
        const currentMode = this._modeFSM.currentState;
        currentMode.onUpdate(deltaTime);
    }
    // ---------- onResize ----------
    onResize(size) {
        size ??= getCanvasSize();
        this._size = size;
        const width = this._size.width;
        const height = this._size.height;
        this._grid.resize(width, height);
        this._ruler?.resize();
        this.updateGrid();
        this.adjustCamera();
    }
    // ---------- refresh ----------
    refresh() {
        this.updateGrid();
        this.adjustCamera();
        try {
            const { Service } = require('../core/decorator');
            Service.Engine?.repaintInEditMode?.();
        }
        catch (e) {
            // Engine may not be ready
        }
    }
    // ---------- 缩放快捷键 ----------
    zoomTo(scaleValue) {
        const width = this._size.width;
        const height = this._size.height;
        const px = width / 2;
        const py = height / 2;
        let finalScale = scaleValue;
        if (this._grid.hTicks) {
            finalScale = clamp(finalScale, this._grid.hTicks.minValueScale, this._grid.hTicks.maxValueScale);
        }
        this._grid.xAxisScaleAt(px, finalScale);
        this._grid.yAxisScaleAt(py, finalScale);
        this.setScale2D(finalScale);
        this.updateGrid();
        this.adjustCamera();
    }
    zoomUp() {
        this.zoomTo(this._scale2D * 1.5);
    }
    zoomDown() {
        this.zoomTo(this._scale2D / 1.5);
    }
    zoomReset() {
        this.zoomTo(1);
    }
    onDesignResolutionChange() {
        this.updateGrid();
        this.adjustCamera();
    }
}
exports.CameraController2D = CameraController2D;
exports.default = CameraController2D;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FtZXJhLWNvbnRyb2xsZXItMmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvY2FtZXJhL2NhbWVyYS1jb250cm9sbGVyLTJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJCQUFzSDtBQUN0SCxzRkFBa0Y7QUFDbEYsbUNBQXNEO0FBQ3RELHVHQUE2RTtBQUM3RSxrREFBMEI7QUFDMUIseUNBQStGO0FBRS9GLHVEQUFrRDtBQUNsRCxxREFBZ0Q7QUFDaEQsbUNBQXdDO0FBRXhDLG1DQUFnQztBQUVoQyxTQUFTLGFBQWE7SUFDbEIsTUFBTSxNQUFNLEdBQUksRUFBVSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7SUFDeEMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNULE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzFELENBQUM7SUFDRCxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDeEMsQ0FBQztBQUVELE1BQU0sd0JBQXdCLEdBQUcsRUFBRSxDQUFDO0FBQ3BDLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQztBQUV0QixTQUFTLEtBQUssQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEdBQVc7SUFDaEQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUFFRCxJQUFLLFdBR0o7QUFIRCxXQUFLLFdBQVc7SUFDWixnQ0FBaUIsQ0FBQTtJQUNqQiw4QkFBZSxDQUFBO0FBQ25CLENBQUMsRUFISSxXQUFXLEtBQVgsV0FBVyxRQUdmO0FBRUQsTUFBYSxrQkFB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QUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JHLENBQUM7UUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRXhDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsUUFBUTtRQUNKLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsU0FBUztRQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUVELHdCQUF3QjtRQUNwQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3hCLENBQUM7Q0FDSjtBQWhzQkQsZ0RBZ3NCQztBQUVELGtCQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2FtZXJhLCBDb2xvciwgSVNpemVMaWtlLCBOb2RlLCBRdWF0LCBSZWN0LCBWZWMzLCBNZXNoUmVuZGVyZXIsIFNwcml0ZVJlbmRlcmVyLCBVSVRyYW5zZm9ybSwgZ2Z4IH0gZnJvbSAnY2MnO1xuaW1wb3J0IENhbWVyYUNvbnRyb2xsZXJCYXNlLCB7IEVkaXRvckNhbWVyYUluZm8gfSBmcm9tICcuL2NhbWVyYS1jb250cm9sbGVyLWJhc2UnO1xuaW1wb3J0IHsgQ2FtZXJhTW92ZU1vZGUsIENhbWVyYVV0aWxzIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgRmluaXRlU3RhdGVNYWNoaW5lIGZyb20gJy4uL3V0aWxzL3N0YXRlLW1hY2hpbmUvZmluaXRlLXN0YXRlLW1hY2hpbmUnO1xuaW1wb3J0IEdyaWQgZnJvbSAnLi9ncmlkJztcbmltcG9ydCB7IFJ1bGVyMkQsIGJ1aWxkUnVsZXJWaWV3LCB0eXBlIElSdWxlclJlbmRlckNhbWVyYSwgdHlwZSBJUnVsZXJWaWV3IH0gZnJvbSAnLi9ydWxlci0yZCc7XG5pbXBvcnQgeyBNb2RlQmFzZTJEIH0gZnJvbSAnLi9tb2Rlcy9tb2RlLWJhc2UtMmQnO1xuaW1wb3J0IHsgSWRsZU1vZGUyRCB9IGZyb20gJy4vbW9kZXMvaWRsZS1tb2RlLTJkJztcbmltcG9ydCB7IFBhbk1vZGUyRCB9IGZyb20gJy4vbW9kZXMvcGFuLW1vZGUtMmQnO1xuaW1wb3J0IHsgdHdlZW5Qb3NpdGlvbiB9IGZyb20gJy4vdHdlZW4nO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVNb3VzZUV2ZW50LCBJU2NlbmVLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vb3BlcmF0aW9uL3R5cGVzJztcbmltcG9ydCB7IFJwYyB9IGZyb20gJy4uLy4uL3JwYyc7XG5cbmZ1bmN0aW9uIGdldENhbnZhc1NpemUoKTogSVNpemVMaWtlIHtcbiAgICBjb25zdCBjYW52YXMgPSAoY2MgYXMgYW55KS5nYW1lPy5jYW52YXM7XG4gICAgaWYgKGNhbnZhcykge1xuICAgICAgICByZXR1cm4geyB3aWR0aDogY2FudmFzLndpZHRoLCBoZWlnaHQ6IGNhbnZhcy5oZWlnaHQgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgd2lkdGg6IDEyODAsIGhlaWdodDogNzIwIH07XG59XG5cbmNvbnN0IF9kZWZhdWx0TWFyZ2luUGVyY2VudGFnZSA9IDMwO1xuY29uc3QgX21heFRpY2tzID0gMTAwO1xuXG5mdW5jdGlvbiBjbGFtcCh2YWw6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHZhbCkpO1xufVxuXG5lbnVtIE1vZGVDb21tYW5kIHtcbiAgICBUb0lkbGUgPSAndG9JZGxlJyxcbiAgICBUb1BhbiA9ICd0b1BhbicsXG59XG5cbmV4cG9ydCBjbGFzcyBDYW1lcmFDb250cm9sbGVyMkQgZXh0ZW5kcyBDYW1lcmFDb250cm9sbGVyQmFzZSB7XG4gICAgcHJpdmF0ZSBfc2l6ZTogSVNpemVMaWtlID0geyB3aWR0aDogMTkyMCwgaGVpZ2h0OiAxMDgwIH07XG4gICAgcHJpdmF0ZSBfbW9kZUZTTSE6IEZpbml0ZVN0YXRlTWFjaGluZTxNb2RlQmFzZTJEPjtcbiAgICBwcml2YXRlIF9pZGxlTW9kZSE6IElkbGVNb2RlMkQ7XG4gICAgcHJpdmF0ZSBfcGFuTW9kZSE6IFBhbk1vZGUyRDtcbiAgICBwcml2YXRlIF9saW5lQ29sb3IgPSBjYy5jb2xvcigpLmZyb21IRVgoJyM1NTU1NTUnKTtcbiAgICBwcml2YXRlIF9ncmlkITogR3JpZDtcbiAgICBwcml2YXRlIF9ydWxlciE6IFJ1bGVyMkQ7XG4gICAgcHJpdmF0ZSBfY29udGVudFJlY3QhOiBSZWN0O1xuICAgIHByaXZhdGUgX3NjYWxlMkQgPSAxO1xuXG4gICAgcHJvdGVjdGVkIF93aGVlbFNwZWVkID0gNjtcbiAgICBwcm90ZWN0ZWQgX25lYXIgPSAxO1xuICAgIHByb3RlY3RlZCBfZmFyID0gMTAwMDA7XG5cbiAgICAvLyDnqbrmoLzplK7ot5/ouKrvvIznlKjkuo7liIfmjaLlubPnp7vmqKHlvI9cbiAgICBwcml2YXRlIF9zcGFjZUtleUhlbGQgPSBmYWxzZTtcblxuICAgIC8vIOWKqOeUu+eKtuaAgVxuICAgIHByaXZhdGUgX3Bvc0FuaW06IGFueSA9IG51bGw7XG5cbiAgICBpc01vdmluZygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlICE9PSB0aGlzLl9pZGxlTW9kZTtcbiAgICB9XG5cbiAgICBnZXQgbGluZUNvbG9yKCkgeyByZXR1cm4gdGhpcy5fbGluZUNvbG9yOyB9XG4gICAgc2V0IGxpbmVDb2xvcih2YWx1ZTogQ29sb3IpIHsgdGhpcy5fbGluZUNvbG9yID0gdmFsdWU7IH1cbiAgICBnZXQgZ3JpZCgpIHsgcmV0dXJuIHRoaXMuX2dyaWQ7IH1cbiAgICBnZXQgY29udGVudFJlY3QoKTogUmVjdCB7IHJldHVybiB0aGlzLl9jb250ZW50UmVjdDsgfVxuICAgIGdldCBzY2FsZTJEKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9zY2FsZTJEOyB9XG5cbiAgICAvKipcbiAgICAgKiDlkIzmraUgc2NhbGUyRCDliLAgR2l6bW/vvIjlpoLmnpzlj6/nlKjvvIlcbiAgICAgKi9cbiAgICBwcml2YXRlIHNldFNjYWxlMkQodmFsdWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLl9zY2FsZTJEID0gdmFsdWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgICAgICBpZiAoU2VydmljZS5HaXptbz8udHJhbnNmb3JtVG9vbERhdGEpIHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlLkdpem1vLnRyYW5zZm9ybVRvb2xEYXRhLnNjYWxlMkQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gR2l6bW8gbm90IHJlYWR5XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzaG93R3JpZCh2aXNpYmxlOiBib29sZWFuKSB7XG4gICAgICAgIHN1cGVyLnNob3dHcmlkKHZpc2libGUpO1xuICAgICAgICBpZiAodGhpcy5fb3JpZ2luQXhpc0hvcml6b250YWxNZXNoQ29tcD8ubm9kZSkge1xuICAgICAgICAgICAgdGhpcy5fb3JpZ2luQXhpc0hvcml6b250YWxNZXNoQ29tcC5ub2RlLmFjdGl2ZSA9IHZpc2libGUgJiYgKHRoaXMub3JpZ2luQXhpc1hfVmlzaWJsZSB8fCB0aGlzLm9yaWdpbkF4aXNZX1Zpc2libGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5pdChjYW1lcmE6IENhbWVyYSkge1xuICAgICAgICBzdXBlci5pbml0KGNhbWVyYSk7XG4gICAgICAgIHRoaXMuX3NpemUgPSBnZXRDYW52YXNTaXplKCk7XG4gICAgICAgIHRoaXMuX2NvbnRlbnRSZWN0ID0gbmV3IFJlY3QoMCwgMCwgdGhpcy5fc2l6ZS53aWR0aCwgdGhpcy5fc2l6ZS5oZWlnaHQpO1xuICAgICAgICB0aGlzLl9ncmlkTWVzaENvbXAgPSBDYW1lcmFVdGlscy5jcmVhdGVHcmlkKCdpbnRlcm5hbC9lZGl0b3IvZ3JpZC0yZCcsIHRoaXMubm9kZS5wYXJlbnQhKTtcbiAgICAgICAgdGhpcy5fZ3JpZE1lc2hDb21wLm5vZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2luaXRHcmlkKCk7XG4gICAgICAgIHRoaXMuX3J1bGVyID0gbmV3IFJ1bGVyMkQoKTtcbiAgICAgICAgdGhpcy5fcnVsZXIub25OZWVkUmVkcmF3ID0gKCkgPT4gdGhpcy5fcmVmcmVzaFJ1bGVyKCk7XG4gICAgICAgIHRoaXMuX3J1bGVyLmluaXQoKTtcbiAgICAgICAgdGhpcy5faW5pdE1vZGUoKTtcbiAgICAgICAgdGhpcy5pbml0T3JpZ2luQXhpcygpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0g5qih5byP54q25oCB5py6IC0tLS0tLS0tLS1cblxuICAgIHByaXZhdGUgX2luaXRNb2RlKCkge1xuICAgICAgICB0aGlzLl9pZGxlTW9kZSA9IG5ldyBJZGxlTW9kZTJEKHRoaXMpO1xuICAgICAgICB0aGlzLl9wYW5Nb2RlID0gbmV3IFBhbk1vZGUyRCh0aGlzKTtcblxuICAgICAgICBjb25zdCBtb2RlcyA9IFt0aGlzLl9pZGxlTW9kZSwgdGhpcy5fcGFuTW9kZV07XG4gICAgICAgIHRoaXMuX21vZGVGU00gPSBuZXcgRmluaXRlU3RhdGVNYWNoaW5lPE1vZGVCYXNlMkQ+KG1vZGVzKTtcblxuICAgICAgICAvLyBpZGxlIDwtPiBwYW4g5Y+M5ZCR6L2s5o2iXG4gICAgICAgIHRoaXMuX21vZGVGU00uYWRkVHJhbnNpdGlvbih0aGlzLl9pZGxlTW9kZSwgdGhpcy5fcGFuTW9kZSwgTW9kZUNvbW1hbmQuVG9QYW4pO1xuICAgICAgICB0aGlzLl9tb2RlRlNNLmFkZFRyYW5zaXRpb24odGhpcy5fcGFuTW9kZSwgdGhpcy5faWRsZU1vZGUsIE1vZGVDb21tYW5kLlRvSWRsZSk7XG5cbiAgICAgICAgdGhpcy5fbW9kZUZTTS5CZWdpbih0aGlzLl9pZGxlTW9kZSk7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDnvZHmoLzliJ3lp4vljJYgLS0tLS0tLS0tLVxuXG4gICAgcHJpdmF0ZSBfaW5pdEdyaWQoKSB7XG4gICAgICAgIGNvbnN0IGdyaWQgPSBuZXcgR3JpZCh0aGlzLl9zaXplLndpZHRoLCB0aGlzLl9zaXplLmhlaWdodCk7XG4gICAgICAgIGdyaWQuc2V0U2NhbGVIKFs1LCAyXSwgMC4wMSwgNTAwMCk7XG4gICAgICAgIGdyaWQuc2V0TWFwcGluZ0goMCwgMSwgMSk7XG4gICAgICAgIGdyaWQuc2V0U2NhbGVWKFs1LCAyXSwgMC4wMSwgNTAwMCk7XG4gICAgICAgIGdyaWQuc2V0TWFwcGluZ1YoMSwgMCwgMSk7XG4gICAgICAgIGdyaWQuc2V0QW5jaG9yKDAuNSwgMC41KTtcbiAgICAgICAgdGhpcy5fZ3JpZCA9IGdyaWQ7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSBhY3RpdmUgLS0tLS0tLS0tLVxuXG4gICAgc2V0IGFjdGl2ZSh2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIC8vIOato+S6pOaKleW9sVxuICAgICAgICAgICAgdGhpcy5fY2FtZXJhLnByb2plY3Rpb24gPSBDYW1lcmEuUHJvamVjdGlvblR5cGUuT1JUSE87XG4gICAgICAgICAgICAvLyDph43nva7ml4vovazkuLrljZXkvY3lm5vlhYPmlbBcbiAgICAgICAgICAgIHRoaXMubm9kZS5zZXRXb3JsZFJvdGF0aW9uKFF1YXQuSURFTlRJVFkpO1xuICAgICAgICAgICAgdGhpcy5fY2FtZXJhLm5lYXIgPSB0aGlzLl9uZWFyO1xuICAgICAgICAgICAgdGhpcy5fY2FtZXJhLmZhciA9IHRoaXMuX2ZhcjtcbiAgICAgICAgICAgIHRoaXMub25SZXNpemUoKTtcbiAgICAgICAgICAgIHRoaXMuX3J1bGVyPy5zaG93KHRydWUpO1xuICAgICAgICAgICAgdGhpcy5zaG93R3JpZCh0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3J1bGVyPy5zaG93KGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0dyaWQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDosIPmlbTliLDkuK3lv4MgLS0tLS0tLS0tLVxuXG4gICAgcHJpdmF0ZSBfYWRqdXN0VG9DZW50ZXIobWFyZ2luUGVyY2VudGFnZSA9IF9kZWZhdWx0TWFyZ2luUGVyY2VudGFnZSwgY29udGVudEJvdW5kczogUmVjdCB8IG51bGwgPSBudWxsLCBpbW1lZGlhdGUgPSBmYWxzZSwgZm9yY2VTY2FsZT86IG51bWJlcikge1xuICAgICAgICBsZXQgY29udGVudFggPSAwO1xuICAgICAgICBsZXQgY29udGVudFkgPSAwO1xuICAgICAgICBsZXQgY29udGVudFdpZHRoID0gMDtcbiAgICAgICAgbGV0IGNvbnRlbnRIZWlnaHQgPSAwO1xuXG4gICAgICAgIGlmIChjb250ZW50Qm91bmRzKSB7XG4gICAgICAgICAgICBjb250ZW50WCA9IGNvbnRlbnRCb3VuZHMueDtcbiAgICAgICAgICAgIGNvbnRlbnRZID0gY29udGVudEJvdW5kcy55O1xuICAgICAgICAgICAgY29udGVudFdpZHRoID0gY29udGVudEJvdW5kcy53aWR0aDtcbiAgICAgICAgICAgIGNvbnRlbnRIZWlnaHQgPSBjb250ZW50Qm91bmRzLmhlaWdodDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRlbnRXaWR0aCA9IHRoaXMuX3NpemUud2lkdGg7XG4gICAgICAgICAgICBjb250ZW50SGVpZ2h0ID0gdGhpcy5fc2l6ZS5oZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2NhbGUgPSBmb3JjZVNjYWxlID8/IDE7XG4gICAgICAgIGNvbnN0IGxlZnRNYXJnaW4gPSAobWFyZ2luUGVyY2VudGFnZSAvIDEwMCkgKiB0aGlzLl9zaXplLndpZHRoO1xuICAgICAgICBjb25zdCByaWdodE1hcmdpbiA9IChtYXJnaW5QZXJjZW50YWdlIC8gMTAwKSAqIHRoaXMuX3NpemUuaGVpZ2h0O1xuICAgICAgICBjb25zdCBmaXRXID0gdGhpcy5fc2l6ZS53aWR0aCAtIGxlZnRNYXJnaW47XG4gICAgICAgIGNvbnN0IGZpdEggPSB0aGlzLl9zaXplLmhlaWdodCAtIHJpZ2h0TWFyZ2luO1xuXG4gICAgICAgIGlmICghZm9yY2VTY2FsZSkge1xuICAgICAgICAgICAgaWYgKGNvbnRlbnRXaWR0aCA8PSBmaXRXICYmIGNvbnRlbnRIZWlnaHQgPD0gZml0SCkge1xuICAgICAgICAgICAgICAgIGlmIChjb250ZW50V2lkdGggPT09IDAgfHwgY29udGVudEhlaWdodCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0QXNwZWN0ID0gY29udGVudFdpZHRoIC8gY29udGVudEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheUFzcGVjdCA9IGZpdFcgLyBmaXRIO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0QXNwZWN0ID4gZGlzcGxheUFzcGVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBmaXRXIC8gY29udGVudFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBmaXRIIC8gY29udGVudEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250ZW50V2lkdGggPSBjb250ZW50V2lkdGggKiBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhlaWdodCA9IGNvbnRlbnRIZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2ZpdFNpemVDYWxjKGNvbnRlbnRXaWR0aCwgY29udGVudEhlaWdodCwgZml0VywgZml0SCk7XG4gICAgICAgICAgICAgICAgc2NhbGUgPSB0aGlzLl9nZXRTaXplU2NhbGUocmVzdWx0WzBdLCByZXN1bHRbMV0sIGNvbnRlbnRXaWR0aCwgY29udGVudEhlaWdodCk7XG4gICAgICAgICAgICAgICAgY29udGVudFdpZHRoID0gcmVzdWx0WzBdO1xuICAgICAgICAgICAgICAgIGNvbnRlbnRIZWlnaHQgPSByZXN1bHRbMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFNjYWxlMkQoc2NhbGUpO1xuXG4gICAgICAgIGNvbnN0IGdyaWRYID0gKCh0aGlzLl9zaXplLndpZHRoIC0gY29udGVudFdpZHRoKSAvIDIgLSBjb250ZW50WCAqIHNjYWxlKSAqIHRoaXMuX2dyaWQueERpcmVjdGlvbjtcbiAgICAgICAgY29uc3QgZ3JpZFkgPSAoKHRoaXMuX3NpemUuaGVpZ2h0IC0gY29udGVudEhlaWdodCkgLyAyIC0gY29udGVudFkgKiBzY2FsZSkgKiB0aGlzLl9ncmlkLnlEaXJlY3Rpb247XG4gICAgICAgIHRoaXMuX2dyaWQueEF4aXNTeW5jKGdyaWRYLCBzY2FsZSk7XG4gICAgICAgIHRoaXMuX2dyaWQueUF4aXNTeW5jKGdyaWRZLCBzY2FsZSk7XG4gICAgICAgIHRoaXMudXBkYXRlR3JpZCgpO1xuICAgICAgICB0aGlzLmFkanVzdENhbWVyYShpbW1lZGlhdGUpO1xuXG4gICAgICAgIGlmIChjb250ZW50Qm91bmRzKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250ZW50UmVjdC54ID0gY29udGVudFg7XG4gICAgICAgICAgICB0aGlzLl9jb250ZW50UmVjdC55ID0gY29udGVudFk7XG4gICAgICAgICAgICB0aGlzLl9jb250ZW50UmVjdC53aWR0aCA9IGNvbnRlbnRXaWR0aDtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRlbnRSZWN0LmhlaWdodCA9IGNvbnRlbnRIZWlnaHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9maXRTaXplQ2FsYyhzcmNXaWR0aDogbnVtYmVyLCBzcmNIZWlnaHQ6IG51bWJlciwgZGVzdFdpZHRoOiBudW1iZXIsIGRlc3RIZWlnaHQ6IG51bWJlcik6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgICAgICBsZXQgd2lkdGggPSAwO1xuICAgICAgICBsZXQgaGVpZ2h0ID0gMDtcbiAgICAgICAgaWYgKHNyY1dpZHRoID4gZGVzdFdpZHRoICYmIHNyY0hlaWdodCA+IGRlc3RIZWlnaHQpIHtcbiAgICAgICAgICAgIHdpZHRoID0gZGVzdFdpZHRoO1xuICAgICAgICAgICAgaGVpZ2h0ID0gKHNyY0hlaWdodCAqIGRlc3RXaWR0aCkgLyBzcmNXaWR0aDtcbiAgICAgICAgICAgIGlmIChoZWlnaHQgPiBkZXN0SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gZGVzdEhlaWdodDtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IChzcmNXaWR0aCAqIGRlc3RIZWlnaHQpIC8gc3JjSGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNyY1dpZHRoID4gZGVzdFdpZHRoKSB7XG4gICAgICAgICAgICB3aWR0aCA9IGRlc3RXaWR0aDtcbiAgICAgICAgICAgIGhlaWdodCA9IChzcmNIZWlnaHQgKiBkZXN0V2lkdGgpIC8gc3JjV2lkdGg7XG4gICAgICAgIH0gZWxzZSBpZiAoc3JjSGVpZ2h0ID4gZGVzdEhlaWdodCkge1xuICAgICAgICAgICAgd2lkdGggPSAoc3JjV2lkdGggKiBkZXN0SGVpZ2h0KSAvIHNyY0hlaWdodDtcbiAgICAgICAgICAgIGhlaWdodCA9IGRlc3RIZWlnaHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3aWR0aCA9IHNyY1dpZHRoO1xuICAgICAgICAgICAgaGVpZ2h0ID0gc3JjSGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbd2lkdGgsIGhlaWdodF07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0U2l6ZVNjYWxlKG5ld1dpZHRoOiBudW1iZXIsIG5ld0hlaWdodDogbnVtYmVyLCBvbGRXaWR0aDogbnVtYmVyLCBvbGRIZWlnaHQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHNjYWxlV2lkdGggPSBvbGRXaWR0aCA8PSAwID8gMSA6IG5ld1dpZHRoIC8gb2xkV2lkdGg7XG4gICAgICAgIGNvbnN0IHNjYWxlSGVpZ2h0ID0gb2xkSGVpZ2h0IDw9IDAgPyAxIDogbmV3SGVpZ2h0IC8gb2xkSGVpZ2h0O1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgoc2NhbGVXaWR0aCwgc2NhbGVIZWlnaHQpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0gYWRqdXN0Q2FtZXJhIC0tLS0tLS0tLS1cblxuICAgIGFkanVzdENhbWVyYShpbW1lZGlhdGUgPSB0cnVlKSB7XG4gICAgICAgIGlmICghdGhpcy5fY2FtZXJhKSByZXR1cm47XG5cbiAgICAgICAgY29uc3Qgc2NhbGUgPSB0aGlzLl9zY2FsZTJEO1xuICAgICAgICBjb25zdCBncmlkID0gdGhpcy5fZ3JpZDtcbiAgICAgICAgY29uc3Qgc2NlbmVYID0gZ3JpZC54RGlyZWN0aW9uICogZ3JpZC54QXhpc09mZnNldDtcbiAgICAgICAgY29uc3Qgc2NlbmVZID0gZ3JpZC55RGlyZWN0aW9uICogZ3JpZC55QXhpc09mZnNldDtcblxuICAgICAgICAvLyDlj43lkJHorqHnrpflh7ogY29udGVudFJlY3TvvIzkuI7nvJbovpHlmajkuIDoh7RcbiAgICAgICAgdGhpcy5fY29udGVudFJlY3QueCA9ICgodGhpcy5fc2l6ZS53aWR0aCAtIHRoaXMuX2NvbnRlbnRSZWN0LndpZHRoKSAvIDIgLSBncmlkLnhBeGlzT2Zmc2V0IC8gZ3JpZC54RGlyZWN0aW9uKSAvIHNjYWxlO1xuICAgICAgICB0aGlzLl9jb250ZW50UmVjdC55ID0gKCh0aGlzLl9zaXplLmhlaWdodCAtIHRoaXMuX2NvbnRlbnRSZWN0LmhlaWdodCkgLyAyIC0gZ3JpZC55QXhpc09mZnNldCAvIGdyaWQueURpcmVjdGlvbikgLyBzY2FsZTtcbiAgICAgICAgdGhpcy5fY29udGVudFJlY3Qud2lkdGggPSB0aGlzLl9zaXplLndpZHRoO1xuICAgICAgICB0aGlzLl9jb250ZW50UmVjdC5oZWlnaHQgPSB0aGlzLl9zaXplLmhlaWdodDtcblxuICAgICAgICBjb25zdCB0YXJnZXRQb3MgPSBuZXcgVmVjMyhcbiAgICAgICAgICAgIHRoaXMuX3NpemUud2lkdGggLyAyIC8gc2NhbGUgLSBzY2VuZVggLyBzY2FsZSxcbiAgICAgICAgICAgIHRoaXMuX3NpemUuaGVpZ2h0IC8gMiAvIHNjYWxlIC0gc2NlbmVZIC8gc2NhbGUsXG4gICAgICAgICAgICA1MDAwLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5zZXRXb3JsZFBvc2l0aW9uKHRhcmdldFBvcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydFBvcyA9IHRoaXMubm9kZS5nZXRXb3JsZFBvc2l0aW9uKCkuY2xvbmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3Bvc0FuaW0gPSB0d2VlblBvc2l0aW9uKHN0YXJ0UG9zLCB0YXJnZXRQb3MsIDMwMCk7XG4gICAgICAgICAgICB0aGlzLl9wb3NBbmltLnN0ZXAoKHBvczogVmVjMykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5zZXRXb3JsZFBvc2l0aW9uKHBvcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFJ1bGVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZU9ydGhvSGVpZ2h0KHNjYWxlKTtcbiAgICAgICAgdGhpcy5fcmVmcmVzaFJ1bGVyKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgU2VydmljZSB9ID0gcmVxdWlyZSgnLi4vY29yZS9kZWNvcmF0b3InKTtcbiAgICAgICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIEVuZ2luZSBtYXkgbm90IGJlIHJlYWR5XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tIOabtOaWsOato+S6pOmrmOW6piAtLS0tLS0tLS0tXG5cbiAgICBwcml2YXRlIF91cGRhdGVPcnRob0hlaWdodChzY2FsZTogbnVtYmVyKSB7XG4gICAgICAgIGlmIChzY2FsZSA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbWVyYS5vcnRob0hlaWdodCA9IHRoaXMuX3NpemUuaGVpZ2h0IC8gMiAvIHNjYWxlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDnvZHmoLzmlbDmja7mm7TmlrAgLS0tLS0tLS0tLVxuXG4gICAgcHJpdmF0ZSBfdXBkYXRlR3JpZERhdGEoKSB7XG4gICAgICAgIHRoaXMuX2dyaWQudXBkYXRlUmFuZ2UoKTtcblxuICAgICAgICBjb25zdCBwb3NpdGlvbnM6IG51bWJlcltdID0gW107XG4gICAgICAgIGNvbnN0IGNvbG9yczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgY29uc3QgaW5kaWNlczogbnVtYmVyW10gPSBbXTtcblxuICAgICAgICBjb25zdCBsZWZ0ID0gdGhpcy5fZ3JpZC5sZWZ0O1xuICAgICAgICBjb25zdCByaWdodCA9IHRoaXMuX2dyaWQucmlnaHQ7XG4gICAgICAgIGNvbnN0IHRvcCA9IHRoaXMuX2dyaWQudG9wO1xuICAgICAgICBjb25zdCBib3R0b20gPSB0aGlzLl9ncmlkLmJvdHRvbTtcblxuICAgICAgICBjb25zdCByID0gdGhpcy5fbGluZUNvbG9yLnIgLyAyNTU7XG4gICAgICAgIGNvbnN0IGcgPSB0aGlzLl9saW5lQ29sb3IuZyAvIDI1NTtcbiAgICAgICAgY29uc3QgYiA9IHRoaXMuX2xpbmVDb2xvci5iIC8gMjU1O1xuICAgICAgICBjb25zdCBiYXNlQWxwaGEgPSB0aGlzLl9saW5lQ29sb3IuYSAvIDI1NTtcblxuICAgICAgICBsZXQgaWR4ID0gMDtcblxuICAgICAgICAvLyDnq5bnur8gKGhUaWNrcylcbiAgICAgICAgaWYgKHRoaXMuX2dyaWQuaFRpY2tzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBsZXZlbCA9IHRoaXMuX2dyaWQuaFRpY2tzLm1pblRpY2tMZXZlbDsgbGV2ZWwgPD0gdGhpcy5fZ3JpZC5oVGlja3MubWF4VGlja0xldmVsOyBsZXZlbCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGlja3MgPSB0aGlzLl9ncmlkLmhUaWNrcy50aWNrc0F0TGV2ZWwobGV2ZWwsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gdGhpcy5fZ3JpZC5oVGlja3MudGlja1JhdGlvc1tsZXZlbF07XG4gICAgICAgICAgICAgICAgY29uc3QgYWxwaGEgPSBiYXNlQWxwaGEgKiByYXRpbztcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdGljayBvZiB0aWNrcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaWR4ICsgMiA+IF9tYXhUaWNrcyAqIF9tYXhUaWNrcykgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOaYvuekuuS6huS4reW/g+i9tO+8jOWwsei3s+i/h+e7mOWItue9keagvOeahOWeguebtOS4ree6v1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcmlnaW5BeGlzWV9WaXNpYmxlICYmIDAgPT09IHRpY2spIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyDnq5bnur/vvJrlm7rlrpogeO+8jOS7jiBib3R0b20g5YiwIHRvcFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCh0aWNrLCBib3R0b20pO1xuICAgICAgICAgICAgICAgICAgICBjb2xvcnMucHVzaChyLCBnLCBiLCBhbHBoYSk7XG4gICAgICAgICAgICAgICAgICAgIGlkeCsrO1xuXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHRpY2ssIHRvcCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKHIsIGcsIGIsIGFscGhhKTtcbiAgICAgICAgICAgICAgICAgICAgaWR4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qiq57q/ICh2VGlja3MpXG4gICAgICAgIGlmICh0aGlzLl9ncmlkLnZUaWNrcykge1xuICAgICAgICAgICAgZm9yIChsZXQgbGV2ZWwgPSB0aGlzLl9ncmlkLnZUaWNrcy5taW5UaWNrTGV2ZWw7IGxldmVsIDw9IHRoaXMuX2dyaWQudlRpY2tzLm1heFRpY2tMZXZlbDsgbGV2ZWwrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpY2tzID0gdGhpcy5fZ3JpZC52VGlja3MudGlja3NBdExldmVsKGxldmVsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IHRoaXMuX2dyaWQudlRpY2tzLnRpY2tSYXRpb3NbbGV2ZWxdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFscGhhID0gYmFzZUFscGhhICogcmF0aW87XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRpY2sgb2YgdGlja3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCArIDIgPiBfbWF4VGlja3MgKiBfbWF4VGlja3MpIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmmL7npLrkuobkuK3lv4PovbTvvIzlsLHot7Pov4fnu5jliLbnvZHmoLznmoTmqKrlkJHkuK3nur9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3JpZ2luQXhpc1hfVmlzaWJsZSAmJiAwID09PSB0aWNrKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5qiq57q/77ya5Zu65a6aIHnvvIzku44gbGVmdCDliLAgcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2gobGVmdCwgdGljayk7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKHIsIGcsIGIsIGFscGhhKTtcbiAgICAgICAgICAgICAgICAgICAgaWR4Kys7XG5cbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2gocmlnaHQsIHRpY2spO1xuICAgICAgICAgICAgICAgICAgICBjb2xvcnMucHVzaChyLCBnLCBiLCBhbHBoYSk7XG4gICAgICAgICAgICAgICAgICAgIGlkeCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWhq+WFheWJqeS9meS4uumbtlxuICAgICAgICB3aGlsZSAoaWR4IDwgX21heFRpY2tzICogX21heFRpY2tzKSB7XG4gICAgICAgICAgICBwb3NpdGlvbnMucHVzaCgwLCAwKTtcbiAgICAgICAgICAgIGNvbG9ycy5wdXNoKDAsIDAsIDAsIDApO1xuICAgICAgICAgICAgaWR4Kys7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmnoTlu7rntKLlvJVcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBfbWF4VGlja3MgKiBfbWF4VGlja3M7IGkrKykge1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgcG9zaXRpb25zLCBjb2xvcnMsIGluZGljZXMgfTtcbiAgICB9XG5cbiAgICB1cGRhdGVHcmlkKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2dyaWRNZXNoQ29tcCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHsgcG9zaXRpb25zLCBjb2xvcnMsIGluZGljZXMgfSA9IHRoaXMuX3VwZGF0ZUdyaWREYXRhKCk7XG5cbiAgICAgICAgQ2FtZXJhVXRpbHMudXBkYXRlVkJBdHRyKHRoaXMuX2dyaWRNZXNoQ29tcCwgJ2FfcG9zaXRpb24nLCBwb3NpdGlvbnMpO1xuICAgICAgICBDYW1lcmFVdGlscy51cGRhdGVWQkF0dHIodGhpcy5fZ3JpZE1lc2hDb21wLCBnZnguQXR0cmlidXRlTmFtZS5BVFRSX0NPTE9SLCBjb2xvcnMpO1xuICAgICAgICBDYW1lcmFVdGlscy51cGRhdGVJQih0aGlzLl9ncmlkTWVzaENvbXAsIGluZGljZXMpO1xuXG4gICAgICAgIHRoaXMudXBkYXRlT3JpZ2luQXhpcygpO1xuICAgICAgICB0aGlzLl9ydWxlcj8udXBkYXRlVGlja3ModGhpcy5fZ3JpZCwgdGhpcy5fcnVsZXJWaWV3KCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOebuOacuuabtOaWsOWQjueri+WNs+eUqOacgOaWsOefqemYteWIt+aWsOWIu+W6puOAglxuICAgICAqIOWQhOS6pOS6kua1geeoi++8iOe8qeaUvi/mi5bmi70v5aSN5L2NL3Jlc2l6Ze+8iemDveS7pSBhZGp1c3RDYW1lcmEg5pS25bC+77yMXG4gICAgICog5Zyo5q2k5aSE6YeN55S75Y+v5L+d6K+B5Yi75bqm5LiN5YaN5rue5ZCO5LiA5bin44CCXG4gICAgICovXG4gICAgcHJpdmF0ZSBfcmVmcmVzaFJ1bGVyKCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuX3J1bGVyIHx8ICF0aGlzLl9ncmlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcnVsZXIudXBkYXRlVGlja3ModGhpcy5fZ3JpZCwgdGhpcy5fcnVsZXJWaWV3KCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIu+W6puWwuueUqOeahOWxj+W5leaYoOWwhO+8mueUqOa4suafk+ebuOacuueahCB3b3JsZFRvU2NyZWVuIOefqemYteaNoueul++8jFxuICAgICAqIOiHquWKqOWMheWQq+eItuiKgueCueWPmOaNoiAvIHpvb20gLyDop4blj6PnrYnmiYDmnInlm6DntKDvvIzkuI7mnIDnu4jnlLvpnaLpgJDlg4/ntKDkuIDoh7TvvJtcbiAgICAgKiDmraPkuqTmipXlvbHkuIvmmKDlsITmmK/ku7/lsITnmoTvvIzlj5YgMyDkuKrkuJbnlYzngrnmi5/lkIjlh7rnur/mgKfns7vmlbDljbPlj6/jgIJcbiAgICAgKi9cbiAgICBwcml2YXRlIF9ydWxlclZpZXcoKTogSVJ1bGVyVmlldyB7XG4gICAgICAgIGNvbnN0IHJjID0gKHRoaXMuX2NhbWVyYSBhcyBhbnkpLmNhbWVyYSBhcyBJUnVsZXJSZW5kZXJDYW1lcmEgfCB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IHAgPSB0aGlzLl9jYW1lcmEubm9kZS53b3JsZFBvc2l0aW9uO1xuICAgICAgICByZXR1cm4gYnVpbGRSdWxlclZpZXcocmMsIHRoaXMuX3NpemUsIHsgb3J0aG9IZWlnaHQ6IHRoaXMuX2NhbWVyYS5vcnRob0hlaWdodCwgeDogcC54LCB5OiBwLnkgfSk7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDljp/ngrnovbQgLS0tLS0tLS0tLVxuXG4gICAgcHJpdmF0ZSBpbml0T3JpZ2luQXhpcygpIHtcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IHRoaXMubm9kZS5wYXJlbnQgfHwgdGhpcy5ub2RlO1xuICAgICAgICB0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wID0gQ2FtZXJhVXRpbHMuY3JlYXRlR3JpZCgnaW50ZXJuYWwvZWRpdG9yL2dyaWQtMmQnLCBwYXJlbnROb2RlKTtcbiAgICAgICAgdGhpcy5vcmlnaW5BeGlzWF9WaXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5vcmlnaW5BeGlzWV9WaXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fb3JpZ2luQXhpc0hvcml6b250YWxNZXNoQ29tcC5ub2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB2b2lkIHRoaXMuaW5pdE9yaWdpbkF4aXNGcm9tQ29uZmlnKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBpbml0T3JpZ2luQXhpc0Zyb21Db25maWcoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBycGMgPSBScGMuZ2V0SW5zdGFuY2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGdpem1vcyA9IGF3YWl0IHJwYy5yZXF1ZXN0KCdzY2VuZUNvbmZpZ0luc3RhbmNlJywgJ2dldCcsIFsnZ2l6bW8nXSkgYXMgYW55O1xuICAgICAgICAgICAgaWYgKGdpem1vcz8ub3JpZ2luQXhpczJEKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5BeGlzQnlDb25maWcoe1xuICAgICAgICAgICAgICAgICAgICB4OiBnaXptb3Mub3JpZ2luQXhpczJELngsXG4gICAgICAgICAgICAgICAgICAgIHk6IGdpem1vcy5vcmlnaW5BeGlzMkQueSxcbiAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gVXNlIHRoZSBkZWZhdWx0IDJEIG9yaWdpbiBheGVzIHdoZW4gY29uZmlnIGlzIHVuYXZhaWxhYmxlLlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlT3JpZ2luQXhpc0J5Q29uZmlnKGNvbmZpZzogeyB4PzogYm9vbGVhbjsgeT86IGJvb2xlYW4gfSwgdXBkYXRlID0gdHJ1ZSkge1xuICAgICAgICBpZiAoY29uZmlnLnggIT09IHVuZGVmaW5lZCkgdGhpcy5vcmlnaW5BeGlzWF9WaXNpYmxlID0gY29uZmlnLng7XG4gICAgICAgIGlmIChjb25maWcueSAhPT0gdW5kZWZpbmVkKSB0aGlzLm9yaWdpbkF4aXNZX1Zpc2libGUgPSBjb25maWcueTtcblxuICAgICAgICBjb25zdCBzaG93QXhpcyA9IHRoaXMub3JpZ2luQXhpc1hfVmlzaWJsZSB8fCB0aGlzLm9yaWdpbkF4aXNZX1Zpc2libGU7XG4gICAgICAgIGlmICh0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wPy5ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wLm5vZGUuYWN0aXZlID0gISF0aGlzLl9ncmlkTWVzaENvbXA/Lm5vZGU/LmFjdGl2ZSAmJiBzaG93QXhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cGRhdGUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT3JpZ2luQXhpcygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgU2VydmljZSB9ID0gcmVxdWlyZSgnLi4vY29yZS9kZWNvcmF0b3InKTtcbiAgICAgICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIEVuZ2luZSBtYXkgbm90IGJlIHJlYWR5XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVPcmlnaW5BeGlzKCkge1xuICAgICAgICBpZiAoIXRoaXMuX29yaWdpbkF4aXNIb3Jpem9udGFsTWVzaENvbXA/Lm5vZGU/LmFjdGl2ZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGxlZnQgPSB0aGlzLl9ncmlkLmxlZnQ7XG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5fZ3JpZC5yaWdodDtcbiAgICAgICAgY29uc3QgdG9wID0gdGhpcy5fZ3JpZC50b3A7XG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IHRoaXMuX2dyaWQuYm90dG9tO1xuXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgY29uc3QgY29sb3JzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBjb25zdCBpbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuXG4gICAgICAgIGlmICh0aGlzLm9yaWdpbkF4aXNYX1Zpc2libGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmVMZWZ0ID0gTWF0aC5mcm91bmQoTWF0aC5taW4obGVmdCwgcmlnaHQpKSAtIDEwMDtcbiAgICAgICAgICAgIGNvbnN0IGxpbmVSaWdodCA9IE1hdGguZnJvdW5kKE1hdGgubWF4KGxlZnQsIHJpZ2h0KSkgKyAxMDA7XG4gICAgICAgICAgICBwb3NpdGlvbnMucHVzaChsaW5lTGVmdCwgMCwgbGluZVJpZ2h0LCAwKTtcbiAgICAgICAgICAgIGNvbnN0IGMgPSB0aGlzLm9yaWdpbkF4aXNYX0NvbG9yO1xuICAgICAgICAgICAgY29sb3JzLnB1c2goYy54LCBjLnksIGMueiwgYy53LCBjLngsIGMueSwgYy56LCBjLncpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3JpZ2luQXhpc1lfVmlzaWJsZSkge1xuICAgICAgICAgICAgY29uc3QgbGluZVRvcCA9IE1hdGguZnJvdW5kKE1hdGgubWluKHRvcCwgYm90dG9tKSkgLSAxMDA7XG4gICAgICAgICAgICBjb25zdCBsaW5lQm90dG9tID0gTWF0aC5mcm91bmQoTWF0aC5tYXgodG9wLCBib3R0b20pKSArIDEwMDtcbiAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKDAsIGxpbmVUb3AsIDAsIGxpbmVCb3R0b20pO1xuICAgICAgICAgICAgY29uc3QgYyA9IHRoaXMub3JpZ2luQXhpc1lfQ29sb3I7XG4gICAgICAgICAgICBjb2xvcnMucHVzaChjLngsIGMueSwgYy56LCBjLncsIGMueCwgYy55LCBjLnosIGMudyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocG9zaXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkgLyAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENhbWVyYVV0aWxzLnVwZGF0ZVZCQXR0cih0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wLCBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1BPU0lUSU9OLCBwb3NpdGlvbnMpO1xuICAgICAgICAgICAgQ2FtZXJhVXRpbHMudXBkYXRlVkJBdHRyKHRoaXMuX29yaWdpbkF4aXNIb3Jpem9udGFsTWVzaENvbXAsIGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfQ09MT1IsIGNvbG9ycyk7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy51cGRhdGVJQih0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wLCBpbmRpY2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBFbmdpbmUgbWF5IG5vdCBiZSByZWFkeVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDnhKbngrkgLS0tLS0tLS0tLVxuXG4gICAgZm9jdXMobm9kZVV1aWRzOiBzdHJpbmdbXSwgZWRpdG9yQ2FtZXJhSW5mbz86IEVkaXRvckNhbWVyYUluZm8sIGltbWVkaWF0ZSA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IHsgY29udGVudFJlY3QsIHNjYWxlIH0gPSBlZGl0b3JDYW1lcmFJbmZvIHx8IHt9IGFzIGFueTtcbiAgICAgICAgbGV0IGNvbnRlbnRCb3VuZHM6IFJlY3QgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBpZiAoY29udGVudFJlY3QpIHtcbiAgICAgICAgICAgIGNvbnRlbnRCb3VuZHMgPSBuZXcgUmVjdChjb250ZW50UmVjdC54LCBjb250ZW50UmVjdC55LCBjb250ZW50UmVjdC53aWR0aCwgY29udGVudFJlY3QuaGVpZ2h0KTtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlVXVpZHMgJiYgbm9kZVV1aWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IEVkaXRvckV4dGVuZHMgPSAoY2MgYXMgYW55KS5FZGl0b3JFeHRlbmRzIHx8IChnbG9iYWxUaGlzIGFzIGFueSkuRWRpdG9yRXh0ZW5kcztcbiAgICAgICAgICAgIGlmICghRWRpdG9yRXh0ZW5kcykgcmV0dXJuO1xuXG4gICAgICAgICAgICBsZXQgbWF4WCA9IC0xZTEwO1xuICAgICAgICAgICAgbGV0IG1heFkgPSAtMWUxMDtcbiAgICAgICAgICAgIGxldCBtaW5YID0gMWUxMDtcbiAgICAgICAgICAgIGxldCBtaW5ZID0gMWUxMDtcblxuICAgICAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIG5vZGVVdWlkcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdWlUcmFuc2Zvcm0gPSBub2RlLmdldENvbXBvbmVudChVSVRyYW5zZm9ybSkgYXMgVUlUcmFuc2Zvcm0gfCBudWxsO1xuICAgICAgICAgICAgICAgIGlmICh1aVRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBib3VuZHMgPSB1aVRyYW5zZm9ybS5nZXRCb3VuZGluZ0JveFRvV29ybGQoKTtcbiAgICAgICAgICAgICAgICAgICAgbWF4WCA9IE1hdGgubWF4KGJvdW5kcy54TWF4LCBtYXhYKTtcbiAgICAgICAgICAgICAgICAgICAgbWF4WSA9IE1hdGgubWF4KGJvdW5kcy55TWF4LCBtYXhZKTtcbiAgICAgICAgICAgICAgICAgICAgbWluWCA9IE1hdGgubWluKGJvdW5kcy54TWluLCBtaW5YKTtcbiAgICAgICAgICAgICAgICAgICAgbWluWSA9IE1hdGgubWluKGJvdW5kcy55TWluLCBtaW5ZKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNoUmVuZGVyZXIgPSBub2RlLmdldENvbXBvbmVudChNZXNoUmVuZGVyZXIpIGFzIE1lc2hSZW5kZXJlciB8IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IG5vZGUuZ2V0Q29tcG9uZW50KFNwcml0ZVJlbmRlcmVyKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXNoUmVuZGVyZXIgJiYgbWVzaFJlbmRlcmVyLm1vZGVsICYmIG1lc2hSZW5kZXJlci5tb2RlbC53b3JsZEJvdW5kcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYiA9IG1lc2hSZW5kZXJlci5tb2RlbC53b3JsZEJvdW5kcztcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblggPSBNYXRoLm1pbihtaW5YLCBiLmNlbnRlci54IC0gYi5oYWxmRXh0ZW50cy54KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblkgPSBNYXRoLm1pbihtaW5ZLCBiLmNlbnRlci55IC0gYi5oYWxmRXh0ZW50cy55KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFggPSBNYXRoLm1heChtYXhYLCBiLmNlbnRlci54ICsgYi5oYWxmRXh0ZW50cy54KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFkgPSBNYXRoLm1heChtYXhZLCBiLmNlbnRlci55ICsgYi5oYWxmRXh0ZW50cy55KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdvcmxkUG9zID0gbm9kZS5nZXRXb3JsZFBvc2l0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhYID0gTWF0aC5tYXgod29ybGRQb3MueCwgbWF4WCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhZID0gTWF0aC5tYXgod29ybGRQb3MueSwgbWF4WSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5YID0gTWF0aC5taW4od29ybGRQb3MueCwgbWluWCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5ZID0gTWF0aC5taW4od29ybGRQb3MueSwgbWluWSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobWluWCA8IG1heFggJiYgbWluWSA8IG1heFkpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50Qm91bmRzID0gbmV3IFJlY3QobWluWCwgbWluWSwgbWF4WCAtIG1pblgsIG1heFkgLSBtaW5ZKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2FkanVzdFRvQ2VudGVyKF9kZWZhdWx0TWFyZ2luUGVyY2VudGFnZSwgY29udGVudEJvdW5kcywgaW1tZWRpYXRlLCBzY2FsZSk7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDnvKnmlL4gLS0tLS0tLS0tLVxuXG4gICAgc21vb3RoU2NhbGUoZGVsdGE6IG51bWJlciwgY3VyU2NhbGU6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdygyLCBkZWx0YSAqIDAuMDAyKSAqIGN1clNjYWxlO1xuICAgIH1cblxuICAgIHNjYWxlKGRlbHRhOiBudW1iZXIsIG9mZnNldFg/OiBudW1iZXIsIG9mZnNldFk/OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLl9zaXplLndpZHRoO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLl9zaXplLmhlaWdodDtcblxuICAgICAgICBsZXQgbmV3U2NhbGUgPSB0aGlzLnNtb290aFNjYWxlKGRlbHRhICogdGhpcy5fd2hlZWxTcGVlZCwgdGhpcy5fc2NhbGUyRCk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2dyaWQuaFRpY2tzKSB7XG4gICAgICAgICAgICBuZXdTY2FsZSA9IGNsYW1wKG5ld1NjYWxlLCB0aGlzLl9ncmlkLmhUaWNrcy5taW5WYWx1ZVNjYWxlLCB0aGlzLl9ncmlkLmhUaWNrcy5tYXhWYWx1ZVNjYWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHB4ID0gb2Zmc2V0WCAhPT0gdW5kZWZpbmVkID8gb2Zmc2V0WCA6IHdpZHRoIC8gMjtcbiAgICAgICAgY29uc3QgcHkgPSBvZmZzZXRZICE9PSB1bmRlZmluZWQgPyBvZmZzZXRZIDogaGVpZ2h0IC8gMjtcblxuICAgICAgICB0aGlzLl9ncmlkLnhBeGlzU2NhbGVBdChweCwgbmV3U2NhbGUpO1xuICAgICAgICB0aGlzLl9ncmlkLnlBeGlzU2NhbGVBdChweSwgbmV3U2NhbGUpO1xuXG4gICAgICAgIHRoaXMuc2V0U2NhbGUyRChuZXdTY2FsZSk7XG4gICAgICAgIHRoaXMudXBkYXRlR3JpZCgpO1xuICAgICAgICB0aGlzLmFkanVzdENhbWVyYSgpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0gZml0U2l6ZSAtLS0tLS0tLS0tXG5cbiAgICBmaXRTaXplKHJlY3Q6IFJlY3QpIHtcbiAgICAgICAgdGhpcy5fYWRqdXN0VG9DZW50ZXIoX2RlZmF1bHRNYXJnaW5QZXJjZW50YWdlLCByZWN0LCB0cnVlKTtcbiAgICB9XG5cbiAgICBvbk1vdXNlRG93bihldmVudDogSVNjZW5lTW91c2VFdmVudCkge1xuICAgICAgICAvLyDkuK3plK7jgIHlj7PplK7miJYgdmlldyDmqKHlvI/kuIsg4oaSIOi/m+WFpeW5s+enu+aooeW8j++8iOS4jue8lui+keWZqOS4gOiHtO+8iVxuICAgICAgICBsZXQgaXNWaWV3TW9kZSA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBTZXJ2aWNlIH0gPSByZXF1aXJlKCcuLi9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICAgICAgaXNWaWV3TW9kZSA9ICEhU2VydmljZS5HaXptbz8uaXNWaWV3TW9kZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gR2l6bW8gbm90IHJlYWR5XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50Lm1pZGRsZUJ1dHRvbiB8fCBldmVudC5yaWdodEJ1dHRvbiB8fCBpc1ZpZXdNb2RlKSB7XG4gICAgICAgICAgICB2b2lkIHRoaXMuX21vZGVGU00uaXNzdWVDb21tYW5kKE1vZGVDb21tYW5kLlRvUGFuKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRNb2RlID0gdGhpcy5fbW9kZUZTTS5jdXJyZW50U3RhdGUgYXMgTW9kZUJhc2UyRDtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRNb2RlLm9uTW91c2VEb3duKGV2ZW50KTtcbiAgICB9XG5cbiAgICBvbk1vdXNlTW92ZShldmVudDogSVNjZW5lTW91c2VFdmVudCkge1xuICAgICAgICBjb25zdCBjdXJyZW50TW9kZSA9IHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlIGFzIE1vZGVCYXNlMkQ7XG4gICAgICAgIGN1cnJlbnRNb2RlLm9uTW91c2VNb3ZlKGV2ZW50KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBTZXJ2aWNlIH0gPSByZXF1aXJlKCcuLi9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gRW5naW5lIG1heSBub3QgYmUgcmVhZHlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uTW91c2VVcChldmVudDogSVNjZW5lTW91c2VFdmVudCkge1xuICAgICAgICAvLyDkuI7nvJbovpHlmajkuIDoh7TvvJpQYW4g5qih5byP5LiL5p2+5byA5oyJ6ZSu55u05o6l5ZueIElkbGXvvIjpmaTpnZ7nqbrmoLzkv53mjIHvvIlcbiAgICAgICAgaWYgKHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlICE9PSB0aGlzLl9pZGxlTW9kZSAmJiAhdGhpcy5fc3BhY2VLZXlIZWxkKSB7XG4gICAgICAgICAgICB2b2lkIHRoaXMuX21vZGVGU00uaXNzdWVDb21tYW5kKE1vZGVDb21tYW5kLlRvSWRsZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50TW9kZSA9IHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlIGFzIE1vZGVCYXNlMkQ7XG4gICAgICAgIHJldHVybiBjdXJyZW50TW9kZS5vbk1vdXNlVXAoZXZlbnQpO1xuICAgIH1cblxuICAgIG9uTW91c2VXaGVlbChldmVudDogSVNjZW5lTW91c2VFdmVudCkge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGV2ZW50LndoZWVsRGVsdGFZICogdGhpcy5fd2hlZWxCYXNlU2NhbGU7XG4gICAgICAgIHRoaXMuc2NhbGUoZGVsdGEsIGV2ZW50LngsIGV2ZW50LnkpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBFbmdpbmUgbWF5IG5vdCBiZSByZWFkeVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Nb3VzZURCbERvd24oZXZlbnQ6IElTY2VuZU1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgY3VycmVudE1vZGUgPSB0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTJEO1xuICAgICAgICBjdXJyZW50TW9kZS5vbk1vdXNlREJsRG93bihldmVudCk7XG4gICAgfVxuXG4gICAgb25LZXlEb3duKGV2ZW50OiBJU2NlbmVLZXlib2FyZEV2ZW50KSB7XG4gICAgICAgIC8vIOepuuagvOmUruWIh+aNouWIsOW5s+enu+aooeW8j1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSAnICcgfHwgZXZlbnQuY29kZSA9PT0gJ1NwYWNlJykge1xuICAgICAgICAgICAgdGhpcy5fc3BhY2VLZXlIZWxkID0gdHJ1ZTtcbiAgICAgICAgICAgIHZvaWQgdGhpcy5fbW9kZUZTTS5pc3N1ZUNvbW1hbmQoTW9kZUNvbW1hbmQuVG9QYW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3VycmVudE1vZGUgPSB0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTJEO1xuICAgICAgICBjdXJyZW50TW9kZS5vbktleURvd24oZXZlbnQpO1xuICAgIH1cblxuICAgIG9uS2V5VXAoZXZlbnQ6IElTY2VuZUtleWJvYXJkRXZlbnQpIHtcbiAgICAgICAgLy8g6YeK5pS+56m65qC86ZSu6L+U5Zue56m66Zey5qih5byPXG4gICAgICAgIGlmIChldmVudC5rZXkgPT09ICcgJyB8fCBldmVudC5jb2RlID09PSAnU3BhY2UnKSB7XG4gICAgICAgICAgICB0aGlzLl9zcGFjZUtleUhlbGQgPSBmYWxzZTtcbiAgICAgICAgICAgIHZvaWQgdGhpcy5fbW9kZUZTTS5pc3N1ZUNvbW1hbmQoTW9kZUNvbW1hbmQuVG9JZGxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRNb2RlID0gdGhpcy5fbW9kZUZTTS5jdXJyZW50U3RhdGUgYXMgTW9kZUJhc2UyRDtcbiAgICAgICAgY3VycmVudE1vZGUub25LZXlVcChldmVudCk7XG4gICAgfVxuXG4gICAgb25VcGRhdGUoZGVsdGFUaW1lOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgY3VycmVudE1vZGUgPSB0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTJEO1xuICAgICAgICBjdXJyZW50TW9kZS5vblVwZGF0ZShkZWx0YVRpbWUpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0gb25SZXNpemUgLS0tLS0tLS0tLVxuXG4gICAgb25SZXNpemUoc2l6ZT86IElTaXplTGlrZSkge1xuICAgICAgICBzaXplID8/PSBnZXRDYW52YXNTaXplKCk7XG4gICAgICAgIHRoaXMuX3NpemUgPSBzaXplO1xuICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuX3NpemUud2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuX3NpemUuaGVpZ2h0O1xuICAgICAgICB0aGlzLl9ncmlkLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5fcnVsZXI/LnJlc2l6ZSgpO1xuICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgdGhpcy5hZGp1c3RDYW1lcmEoKTtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tIHJlZnJlc2ggLS0tLS0tLS0tLVxuXG4gICAgcmVmcmVzaCgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVHcmlkKCk7XG4gICAgICAgIHRoaXMuYWRqdXN0Q2FtZXJhKCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBFbmdpbmUgbWF5IG5vdCBiZSByZWFkeVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDnvKnmlL7lv6vmjbfplK4gLS0tLS0tLS0tLVxuXG4gICAgem9vbVRvKHNjYWxlVmFsdWU6IG51bWJlcikge1xuICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuX3NpemUud2lkdGg7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuX3NpemUuaGVpZ2h0O1xuICAgICAgICBjb25zdCBweCA9IHdpZHRoIC8gMjtcbiAgICAgICAgY29uc3QgcHkgPSBoZWlnaHQgLyAyO1xuXG4gICAgICAgIGxldCBmaW5hbFNjYWxlID0gc2NhbGVWYWx1ZTtcbiAgICAgICAgaWYgKHRoaXMuX2dyaWQuaFRpY2tzKSB7XG4gICAgICAgICAgICBmaW5hbFNjYWxlID0gY2xhbXAoZmluYWxTY2FsZSwgdGhpcy5fZ3JpZC5oVGlja3MubWluVmFsdWVTY2FsZSwgdGhpcy5fZ3JpZC5oVGlja3MubWF4VmFsdWVTY2FsZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9ncmlkLnhBeGlzU2NhbGVBdChweCwgZmluYWxTY2FsZSk7XG4gICAgICAgIHRoaXMuX2dyaWQueUF4aXNTY2FsZUF0KHB5LCBmaW5hbFNjYWxlKTtcblxuICAgICAgICB0aGlzLnNldFNjYWxlMkQoZmluYWxTY2FsZSk7XG4gICAgICAgIHRoaXMudXBkYXRlR3JpZCgpO1xuICAgICAgICB0aGlzLmFkanVzdENhbWVyYSgpO1xuICAgIH1cblxuICAgIHpvb21VcCgpIHtcbiAgICAgICAgdGhpcy56b29tVG8odGhpcy5fc2NhbGUyRCAqIDEuNSk7XG4gICAgfVxuXG4gICAgem9vbURvd24oKSB7XG4gICAgICAgIHRoaXMuem9vbVRvKHRoaXMuX3NjYWxlMkQgLyAxLjUpO1xuICAgIH1cblxuICAgIHpvb21SZXNldCgpIHtcbiAgICAgICAgdGhpcy56b29tVG8oMSk7XG4gICAgfVxuXG4gICAgb25EZXNpZ25SZXNvbHV0aW9uQ2hhbmdlKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgdGhpcy5hZGp1c3RDYW1lcmEoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENhbWVyYUNvbnRyb2xsZXIyRDtcbiJdfQ==