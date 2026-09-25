"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const controller_utils_1 = __importDefault(require("../utils/controller-utils"));
const controller_shape_collider_1 = require("../utils/controller-shape-collider");
const engine_utils_1 = require("../utils/engine-utils");
const tempVec3_a = new cc_1.Vec3();
const tempVec2_a = new cc_1.Vec2();
/**
 * 获取 transformToolData（惰性访问避免循环依赖）
 */
function getTransformToolData() {
    try {
        const { Service } = require('../../core/decorator');
        return Service.Gizmo?.transformToolData;
    }
    catch (e) {
        return null;
    }
}
/**
 * 获取编辑器摄像机组件（惰性访问避免循环依赖）
 */
function getEditorCamera() {
    try {
        const { Service } = require('../../core/decorator');
        return Service.Camera?.getCamera?.();
    }
    catch (e) {
        return null;
    }
}
/**
 * 重绘引擎
 */
function repaintEngine() {
    try {
        const { Service } = require('../../core/decorator');
        Service.Engine?.repaintInEditMode?.();
    }
    catch (e) {
        // not ready
    }
}
class ControllerBase {
    get transformToolData() {
        return getTransformToolData();
    }
    get updated() {
        return this._updated;
    }
    get visible() {
        return this.shape?.active;
    }
    shape;
    /** 如果 controller 锁死将不再响应拖拽 */
    isLock = false;
    get isMouseDown() {
        return this._isMouseDown;
    }
    _updated = false;
    _scale = new cc_1.Vec3(1, 1, 1);
    _localRot = new cc_1.Quat();
    _localPos = new cc_1.Vec3();
    _rootNode = null;
    _baseDist = 600;
    _handleDataMap = {};
    _twoPI = Math.PI * 2;
    _halfPI = Math.PI / 2;
    _degreeToRadianFactor = Math.PI / 180;
    _eventsRegistered = false;
    _isMouseDown = false;
    _color = cc_1.Color.WHITE;
    _lockSize = false; // 保持视觉上的大小固定
    _onDimensionChanged = null;
    _onScale2DChanged = null;
    _onCameraFovChanged = null;
    _onCameraOrthoHeightChanged = null;
    _mouseDownFuncs = new Map();
    _mouseMoveFuncs = new Map();
    _mouseUpFuncs = new Map();
    _mouseLeaveFuncs = new Map();
    _hoverInFuncs = new Map();
    _hoverOutFuncs = new Map();
    constructor(rootNode) {
        this._rootNode = rootNode;
    }
    set lockSize(value) {
        this._lockSize = value;
    }
    /**
     * 更改控制器所依附的根节点
     */
    setRoot(rootNode) {
        this._rootNode = rootNode;
        if (this.shape) {
            this.shape.parent = this._rootNode;
        }
    }
    getRoot() {
        return this._rootNode;
    }
    createShapeNode(name) {
        this.shape = (0, engine_utils_1.create3DNode)(name);
        this.shape.parent = this._rootNode;
    }
    registerEvents() {
        if (!this._eventsRegistered) {
            this.registerCameraMovedEvent();
            this.registerOrthoHeightChangedEvent();
            this.registerCameraFovChangedEvent();
            this._onDimensionChanged = this.onDimensionChanged.bind(this);
            this._onScale2DChanged = this.onScale2DChanged.bind(this);
            const ttd = getTransformToolData();
            if (ttd) {
                ttd.addListener('dimension-changed', this._onDimensionChanged);
                ttd.addListener('scale-2d-changed', this._onScale2DChanged);
            }
            this._eventsRegistered = true;
        }
    }
    unregisterEvents() {
        if (this._eventsRegistered) {
            this.unregisterCameraMoveEvent();
            this.unregisterOrthoHeightChangedEvent();
            this.unregisterCameraFovChangedEvent();
            const ttd = getTransformToolData();
            if (ttd) {
                if (this._onDimensionChanged) {
                    ttd.removeListener('dimension-changed', this._onDimensionChanged);
                }
                if (this._onScale2DChanged) {
                    ttd.removeListener('scale-2d-changed', this._onScale2DChanged);
                }
            }
            this._eventsRegistered = false;
        }
    }
    registerCameraMovedEvent() {
        const editorCamera = getEditorCamera();
        if (editorCamera?.node) {
            editorCamera.node.on('transform-changed', this.onEditorCameraMoved, this);
        }
    }
    unregisterCameraMoveEvent() {
        const editorCamera = getEditorCamera();
        if (editorCamera?.node) {
            editorCamera.node.off('transform-changed', this.onEditorCameraMoved, this);
        }
    }
    registerCameraFovChangedEvent() {
        if (this.onCameraFovChanged) {
            this._onCameraFovChanged ??= this.onCameraFovChanged.bind(this);
            try {
                const { Service } = require('../../core/decorator');
                Service.Camera?.on?.('camera:fov-changed', this._onCameraFovChanged);
            }
            catch (e) {
                // not ready
            }
        }
    }
    registerOrthoHeightChangedEvent() {
        this._onCameraOrthoHeightChanged = this.onCameraOrthoHeightChanged.bind(this);
        const ttd = getTransformToolData();
        if (ttd) {
            ttd.addListener('camera-ortho-height-changed', this._onCameraOrthoHeightChanged);
        }
    }
    unregisterCameraFovChangedEvent() {
        if (this._onCameraFovChanged) {
            try {
                const { Service } = require('../../core/decorator');
                Service.Camera?.off?.('camera:fov-changed', this._onCameraFovChanged);
            }
            catch (e) {
                // not ready
            }
        }
    }
    unregisterOrthoHeightChangedEvent() {
        if (this._onCameraOrthoHeightChanged) {
            const ttd = getTransformToolData();
            if (ttd) {
                ttd.removeListener('camera-ortho-height-changed', this._onCameraOrthoHeightChanged);
            }
        }
    }
    onEditorCameraMoved() {
        this.adjustControllerSize();
    }
    initHandle(node, handleName) {
        const rendererNodes = this.getRendererNodes(node);
        const colors = [];
        const opacities = [];
        rendererNodes.forEach((rNode) => {
            const color = (0, engine_utils_1.getMeshColor)(rNode);
            if (color) {
                colors.push(new cc_1.Color(color.r, color.g, color.b));
                opacities.push((0, engine_utils_1.getNodeOpacity)(rNode));
            }
        });
        const handleData = {
            name: handleName,
            topNode: node,
            rendererNodes,
            oriColors: colors,
            oriOpacities: opacities,
            normalTorusNode: null,
            indicatorCircle: null,
            arrowNode: null,
            normalTorusMR: null,
            panPlane: null,
            customData: null,
        };
        const rayDetectNodes = this.getRayDetectNodes(node);
        rayDetectNodes.forEach((rNode) => {
            this.registerMouseEvents(rNode, handleName);
        });
        this._handleDataMap[handleName] = handleData;
        return handleData;
    }
    removeHandle(handleName) {
        if (this._handleDataMap[handleName]) {
            const node = this._handleDataMap[handleName].topNode;
            const rayDetectNodes = this.getRayDetectNodes(node);
            rayDetectNodes.forEach((rNode) => {
                this.unregisterMouseEvent(rNode, handleName);
            });
            delete this._handleDataMap[handleName];
        }
    }
    setHandleColor(handleName, color, opacity) {
        const handleData = this._handleDataMap[handleName];
        const rendererNodes = handleData.rendererNodes;
        if (rendererNodes) {
            rendererNodes.forEach((rNode) => {
                if (opacity === undefined || opacity === null) {
                    opacity = (0, engine_utils_1.getNodeOpacity)(rNode);
                }
                (0, engine_utils_1.setMeshColor)(rNode, color);
                (0, engine_utils_1.setNodeOpacity)(rNode, opacity);
            });
        }
    }
    resetHandleColor(event) {
        if (event) {
            this.resetHandleColorByKey(event.handleName, event.customData?.hoverInNodeMap);
        }
        else {
            for (const key in this._handleDataMap) {
                this.resetHandleColorByKey(key);
            }
        }
    }
    /**
     * 重置指定 handle 的颜色与透明度
     */
    resetHandleColorByKey(key, hoverInNodeMap) {
        const handleData = this._handleDataMap[key];
        if (!handleData) {
            return;
        }
        const rendererNodes = handleData.rendererNodes;
        const oriColors = handleData.oriColors;
        const oriOpacities = handleData.oriOpacities;
        let nodesInHover = 0;
        for (const node of rendererNodes) {
            if (hoverInNodeMap?.has(node)) {
                nodesInHover++;
                if (nodesInHover > 1) {
                    return;
                }
            }
        }
        // reset color and opacity
        for (let i = 0; i < rendererNodes.length; i++) {
            const node = rendererNodes[i];
            (0, engine_utils_1.setMeshColor)(node, oriColors[i]);
            (0, engine_utils_1.setNodeOpacity)(node, oriOpacities[i]);
        }
    }
    registerMouseEvents(node, controlName) {
        const mouseDown = (event) => {
            event.handleName = controlName;
            event.node = node;
            this._updated = false;
            this._isMouseDown = true;
            if (this.onMouseDown) {
                this.onMouseDown(event);
            }
        };
        this._mouseDownFuncs.set(controlName, mouseDown.bind(this));
        node.on('mouseDown', this._mouseDownFuncs.get(controlName));
        const mouseMove = (event) => {
            this._updated = true;
            event.handleName = controlName;
            event.node = node;
            if (this.onMouseMove && (!this.shape || this.shape.active)) {
                this.onMouseMove(event);
            }
            repaintEngine();
        };
        this._mouseMoveFuncs.set(controlName, mouseMove.bind(this));
        node.on('mouseMove', this._mouseMoveFuncs.get(controlName));
        const mouseUp = ((event) => {
            event.handleName = controlName;
            event.node = node;
            if (this.onMouseUp && (!this.shape || this.shape.active)) {
                this.onMouseUp(event);
            }
            this._updated = false;
            this._isMouseDown = false;
        }).bind(this);
        this._mouseUpFuncs.set(controlName, mouseUp);
        node.on('mouseUp', mouseUp);
        // 鼠标移出场景窗口，暂时处理为和mouseup等同
        const mouseLeave = ((event) => {
            event.handleName = controlName;
            event.node = node;
            if (this.onMouseLeave) {
                this.onMouseLeave(event);
            }
            this._updated = false;
            this._isMouseDown = false;
        }).bind(this);
        this._mouseLeaveFuncs.set(controlName, mouseLeave);
        node.on('mouseLeave', mouseLeave);
        const hoverIn = ((event) => {
            event.handleName = controlName;
            event.node = node;
            if (this.onHoverIn) {
                this.onHoverIn(event);
            }
            repaintEngine();
        }).bind(this);
        this._hoverInFuncs.set(controlName, hoverIn);
        node.on('hoverIn', hoverIn);
        const hoverOut = ((event) => {
            event.handleName = controlName;
            event.node = node;
            if (this.onHoverOut) {
                this.onHoverOut(event);
            }
            repaintEngine();
        }).bind(this);
        this._hoverOutFuncs.set(controlName, hoverOut.bind(this));
        node.on('hoverOut', hoverOut);
    }
    unregisterMouseEvent(node, controlName) {
        node.off('mouseDown', this._mouseDownFuncs.get(controlName));
        node.off('mouseMove', this._mouseMoveFuncs.get(controlName));
        node.off('mouseUp', this._mouseUpFuncs.get(controlName));
        node.off('mouseLeave', this._mouseLeaveFuncs.get(controlName));
        node.off('hoverIn', this._hoverInFuncs.get(controlName));
        node.off('hoverOut', this._hoverOutFuncs.get(controlName));
    }
    setPosition(value) {
        this.shape?.setPosition(value);
        this.adjustControllerSize();
    }
    // 返回相对于Root的局部坐标
    getPosition(out) {
        if (!out) {
            out = new cc_1.Vec3();
        }
        this.shape?.getPosition(out);
        return out;
    }
    // 返回世界坐标
    getWorldPosition(out) {
        return this.getWorldPositionForNode(this.shape, out);
    }
    getWorldPositionForNode(source, out) {
        if (!out) {
            out = new cc_1.Vec3();
        }
        (source ?? this.shape)?.getWorldPosition(out);
        return out;
    }
    /**
     * 该函数是为了支持 UISkew 效果而加入
     */
    setWorldMatrix(value) {
        // @ts-ignore
        this.shape._mat.set(value);
        // @ts-ignore 禁止自身更新节点的世界变换信息
        this.shape._transformFlags = cc_1.TransformBit.NONE;
        this.shape.children.forEach((child) => {
            child.invalidateChildren(cc_1.TransformBit.TRS);
        });
        this.shape.emit(cc_1.NodeEventType.TRANSFORM_CHANGED, cc_1.TransformBit.TRS);
    }
    setRotation(value) {
        this.shape?.setRotation(value);
        this.adjustControllerSize();
    }
    getRotation(out) {
        if (!out) {
            out = new cc_1.Quat();
        }
        this.shape?.getRotation(out);
        return out;
    }
    getScale() {
        return this._scale;
    }
    setScale(value) {
        this._scale = value;
        this.adjustControllerSize();
    }
    updateController() {
        this.adjustControllerSize();
    }
    getCameraDistScalar(pos) {
        const editorCamera = getEditorCamera();
        if (!editorCamera?.node)
            return 1;
        const dist = controller_utils_1.default.getCameraDistanceFactor(pos, editorCamera.node);
        const scalar = dist / this._baseDist;
        return scalar;
    }
    getDistScalarInOrtho() {
        const editorCamera = getEditorCamera();
        if (!editorCamera?.node)
            return 1;
        const dist = controller_utils_1.default.getCameraDistanceFactor(this.getWorldPosition(tempVec3_a), editorCamera.node);
        const fov = editorCamera.fov;
        const depth_size = Math.tan(((fov / 2) * Math.PI) / 180);
        const baseOrthoHeight = depth_size * dist;
        const scalar = (dist / this._baseDist) * (editorCamera.orthoHeight / baseOrthoHeight);
        return scalar;
    }
    isCameraInOrtho() {
        const editorCamera = getEditorCamera();
        return editorCamera?.projection === engine_utils_1.ProjectionType.ORTHO;
    }
    getDistScalar(node) {
        let scalar = 1;
        const ttd = this.transformToolData;
        if (ttd?.is2D) {
            // 这里的 1.5 是根据 transform tool 实际显示的效果来调整的
            scalar = 1.5 / ttd.scale2D;
        }
        else if (this.isCameraInOrtho()) {
            scalar = this.getDistScalarInOrtho();
        }
        else {
            scalar = this.getCameraDistScalar(this.getWorldPositionForNode(node, tempVec3_a));
        }
        return scalar;
    }
    adjustControllerSize() {
        let scalar = 1;
        if (this._lockSize) {
            // 根据和相机的距离，对坐标系进行整体放缩，使得大小相对屏幕固定
            scalar = this.getDistScalar();
        }
        const out = new cc_1.Vec3(this._scale);
        out.multiplyScalar(scalar);
        this.shape?.setScale(out);
    }
    needRender(node) {
        const csc = node.getComponent(controller_shape_collider_1.ControllerShapeCollider);
        if (csc && csc.isRender === false) {
            return false;
        }
        return true;
    }
    getRendererNodes(node) {
        let renderNodes = [];
        if ((0, engine_utils_1.getModel)(node) && this.needRender(node)) {
            renderNodes.push(node);
        }
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            renderNodes = renderNodes.concat(this.getRendererNodes(child));
        }
        return renderNodes;
    }
    getRayDetectNodes(node) {
        let rayDetectNodes = [];
        if ((0, engine_utils_1.getModel)(node)) {
            rayDetectNodes.push(node);
        }
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            rayDetectNodes = rayDetectNodes.concat(this.getRayDetectNodes(child));
        }
        return rayDetectNodes;
    }
    localToWorldPosition(localPos) {
        const worldMatrix = new cc_1.Mat4();
        const worldPos = new cc_1.Vec3();
        this.shape?.getWorldMatrix(worldMatrix);
        cc_1.Vec3.transformMat4(worldPos, localPos, worldMatrix);
        return worldPos;
    }
    localToWorldDir(localDir) {
        const worldMatrix = new cc_1.Mat4();
        const worldDir = new cc_1.Vec3();
        this.shape?.getWorldMatrix(worldMatrix);
        cc_1.Vec3.transformMat4Normal(worldDir, localDir, worldMatrix);
        cc_1.Vec3.normalize(worldDir, worldDir);
        return worldDir;
    }
    worldPosToScreenPos(worldPos) {
        const editorCamera = getEditorCamera();
        const screenPos = new cc_1.Vec3();
        editorCamera?.camera?.worldToScreen(screenPos, worldPos);
        return screenPos;
    }
    getScreenPos(localPos) {
        return this.worldPosToScreenPos(this.localToWorldPosition(localPos));
    }
    getAlignAxisMoveDistance(axisWorldDir, deltaPos) {
        const endPos = cc_1.Vec3.add(tempVec3_a, this.getPosition(), axisWorldDir);
        const dirInScreen = this.worldPosToScreenPos(endPos);
        const oriPosInScreen = this.worldPosToScreenPos(this.getPosition());
        cc_1.Vec2.subtract(dirInScreen, dirInScreen, oriPosInScreen);
        cc_1.Vec2.normalize(dirInScreen, dirInScreen);
        const alignAxisMoveDist = cc_1.Vec2.dot(deltaPos, tempVec2_a.set(dirInScreen.x, dirInScreen.y));
        return alignAxisMoveDist;
    }
    getPositionOnPanPlane(hitPos, x, y, panPlane) {
        const results = (0, engine_utils_1.getRaycastResultsByNodes)([panPlane], x, y, Infinity, false);
        if (results.length > 0) {
            const firstResult = results[0];
            hitPos.set(firstResult.hitPoint);
            return true;
        }
        return false;
    }
    show() {
        if (this.shape) {
            this.shape.active = true;
        }
        if (this.onShow) {
            this.onShow();
        }
    }
    hide() {
        if (this.shape) {
            this.shape.active = false;
        }
        this._isMouseDown = false;
        this.isLock = false;
        this.resetHandleColor();
        if (this.onHide) {
            this.onHide();
        }
    }
    onCameraFovChanged;
    onDimensionChanged() {
        if (this.visible) {
            if (this.onShow) {
                this.onShow();
            }
        }
    }
    onScale2DChanged() {
        if (this.visible) {
            this.adjustControllerSize();
        }
    }
    onCameraOrthoHeightChanged() {
        if (this.visible) {
            this.adjustControllerSize();
        }
    }
}
exports.default = ControllerBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9naXptby9jb250cm9sbGVyL2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwyQkFBc0Y7QUFHdEYsaUZBQXdEO0FBQ3hELGtGQUE2RTtBQUM3RSx3REFTK0I7QUFFL0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUM5QixNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBRTlCOztHQUVHO0FBQ0gsU0FBUyxvQkFBb0I7SUFDekIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BELE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQztJQUM1QyxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7QUFDTCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGVBQWU7SUFDcEIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BELE9BQU8sT0FBTyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztBQUNMLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsYUFBYTtJQUNsQixJQUFJLENBQUM7UUFDRCxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDcEQsT0FBTyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUM7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LEVBQUUsQ0FBQztZQUNmLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNsQixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFTSxnQkFBZ0I7UUFDbkIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUNoQyxDQUFDO0lBQ0wsQ0FBQztJQUVNLDBCQUEwQjtRQUM3QixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQ2hDLENBQUM7SUFDTCxDQUFDO0NBVUo7QUFFRCxrQkFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb2xvciwgTm9kZSwgUXVhdCwgVmVjMiwgVmVjMywgVHJhbnNmb3JtQml0LCBOb2RlRXZlbnRUeXBlLCBNYXQ0IH0gZnJvbSAnY2MnO1xuXG5pbXBvcnQgdHlwZSB7IEdpem1vTW91c2VFdmVudCwgSUhhbmRsZURhdGEgfSBmcm9tICcuLi91dGlscy9kZWZpbmVzJztcbmltcG9ydCBDb250cm9sbGVyVXRpbHMgZnJvbSAnLi4vdXRpbHMvY29udHJvbGxlci11dGlscyc7XG5pbXBvcnQgeyBDb250cm9sbGVyU2hhcGVDb2xsaWRlciB9IGZyb20gJy4uL3V0aWxzL2NvbnRyb2xsZXItc2hhcGUtY29sbGlkZXInO1xuaW1wb3J0IHtcbiAgICBzZXROb2RlT3BhY2l0eSxcbiAgICBjcmVhdGUzRE5vZGUsXG4gICAgc2V0TWVzaENvbG9yLFxuICAgIGdldE1vZGVsLFxuICAgIGdldE1lc2hDb2xvcixcbiAgICBnZXROb2RlT3BhY2l0eSxcbiAgICBQcm9qZWN0aW9uVHlwZSxcbiAgICBnZXRSYXljYXN0UmVzdWx0c0J5Tm9kZXMsXG59IGZyb20gJy4uL3V0aWxzL2VuZ2luZS11dGlscyc7XG5cbmNvbnN0IHRlbXBWZWMzX2EgPSBuZXcgVmVjMygpO1xuY29uc3QgdGVtcFZlYzJfYSA9IG5ldyBWZWMyKCk7XG5cbi8qKlxuICog6I635Y+WIHRyYW5zZm9ybVRvb2xEYXRh77yI5oOw5oCn6K6/6Zeu6YG/5YWN5b6q546v5L6d6LWW77yJXG4gKi9cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybVRvb2xEYXRhKCk6IGFueSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBTZXJ2aWNlIH0gPSByZXF1aXJlKCcuLi8uLi9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICByZXR1cm4gU2VydmljZS5HaXptbz8udHJhbnNmb3JtVG9vbERhdGE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbi8qKlxuICog6I635Y+W57yW6L6R5Zmo5pGE5YOP5py657uE5Lu277yI5oOw5oCn6K6/6Zeu6YG/5YWN5b6q546v5L6d6LWW77yJXG4gKi9cbmZ1bmN0aW9uIGdldEVkaXRvckNhbWVyYSgpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgU2VydmljZSB9ID0gcmVxdWlyZSgnLi4vLi4vY29yZS9kZWNvcmF0b3InKTtcbiAgICAgICAgcmV0dXJuIFNlcnZpY2UuQ2FtZXJhPy5nZXRDYW1lcmE/LigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG4vKipcbiAqIOmHjee7mOW8leaTjlxuICovXG5mdW5jdGlvbiByZXBhaW50RW5naW5lKCk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgU2VydmljZSB9ID0gcmVxdWlyZSgnLi4vLi4vY29yZS9kZWNvcmF0b3InKTtcbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIG5vdCByZWFkeVxuICAgIH1cbn1cblxuY2xhc3MgQ29udHJvbGxlckJhc2Uge1xuICAgIGdldCB0cmFuc2Zvcm1Ub29sRGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIGdldFRyYW5zZm9ybVRvb2xEYXRhKCk7XG4gICAgfVxuXG4gICAgZ2V0IHVwZGF0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl91cGRhdGVkO1xuICAgIH1cblxuICAgIGdldCB2aXNpYmxlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaGFwZT8uYWN0aXZlO1xuICAgIH1cbiAgICBwdWJsaWMgc2hhcGUhOiBOb2RlO1xuICAgIC8qKiDlpoLmnpwgY29udHJvbGxlciDplIHmrbvlsIbkuI3lho3lk43lupTmi5bmi70gKi9cbiAgICBwdWJsaWMgaXNMb2NrID0gZmFsc2U7XG4gICAgLy8gZGVsZWdhdGUgZnVuY3Rpb25cbiAgICBwdWJsaWMgb25Db250cm9sbGVyTW91c2VEb3duPyhldmVudDogR2l6bW9Nb3VzZUV2ZW50KTogdm9pZDtcbiAgICBwdWJsaWMgb25Db250cm9sbGVyTW91c2VNb3ZlPyhldmVudDogR2l6bW9Nb3VzZUV2ZW50KTogdm9pZDtcbiAgICBwdWJsaWMgb25Db250cm9sbGVyTW91c2VVcD8oZXZlbnQ6IEdpem1vTW91c2VFdmVudCk6IHZvaWQ7XG4gICAgcHVibGljIG9uQ29udHJvbGxlckhvdmVySW4/KGV2ZW50OiBHaXptb01vdXNlRXZlbnQpOiB2b2lkO1xuICAgIHB1YmxpYyBvbkNvbnRyb2xsZXJIb3Zlck91dD8oZXZlbnQ6IEdpem1vTW91c2VFdmVudCk6IHZvaWQ7XG4gICAgcHVibGljIGdldCBpc01vdXNlRG93bigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzTW91c2VEb3duO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgX3VwZGF0ZWQgPSBmYWxzZTtcbiAgICBwcm90ZWN0ZWQgX3NjYWxlOiBWZWMzID0gbmV3IFZlYzMoMSwgMSwgMSk7XG4gICAgcHJvdGVjdGVkIF9sb2NhbFJvdDogUXVhdCA9IG5ldyBRdWF0KCk7XG4gICAgcHJvdGVjdGVkIF9sb2NhbFBvczogVmVjMyA9IG5ldyBWZWMzKCk7XG4gICAgcHJvdGVjdGVkIF9yb290Tm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIHByb3RlY3RlZCBfYmFzZURpc3QgPSA2MDA7XG4gICAgcHJvdGVjdGVkIF9oYW5kbGVEYXRhTWFwOiB7IFtrZXk6IHN0cmluZ106IElIYW5kbGVEYXRhIH0gPSB7fTtcbiAgICBwcm90ZWN0ZWQgX3R3b1BJID0gTWF0aC5QSSAqIDI7XG4gICAgcHJvdGVjdGVkIF9oYWxmUEkgPSBNYXRoLlBJIC8gMjtcbiAgICBwcm90ZWN0ZWQgX2RlZ3JlZVRvUmFkaWFuRmFjdG9yID0gTWF0aC5QSSAvIDE4MDtcbiAgICBwcm90ZWN0ZWQgX2V2ZW50c1JlZ2lzdGVyZWQgPSBmYWxzZTtcbiAgICBwcm90ZWN0ZWQgX2lzTW91c2VEb3duID0gZmFsc2U7XG4gICAgcHJvdGVjdGVkIF9jb2xvcjogQ29sb3IgPSBDb2xvci5XSElURTtcbiAgICBwcm90ZWN0ZWQgX2xvY2tTaXplID0gZmFsc2U7IC8vIOS/neaMgeinhuinieS4iueahOWkp+Wwj+WbuuWumlxuXG4gICAgcHJpdmF0ZSBfb25EaW1lbnNpb25DaGFuZ2VkOiAoKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX29uU2NhbGUyRENoYW5nZWQ6ICgoLi4uYXJnczogYW55W10pID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfb25DYW1lcmFGb3ZDaGFuZ2VkOiAoKGZvdjogbnVtYmVyKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX29uQ2FtZXJhT3J0aG9IZWlnaHRDaGFuZ2VkOiAoKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJpdmF0ZSBfbW91c2VEb3duRnVuY3M6IE1hcDxzdHJpbmcsIEZ1bmN0aW9uPiA9IG5ldyBNYXA8c3RyaW5nLCBGdW5jdGlvbj4oKTtcbiAgICBwcml2YXRlIF9tb3VzZU1vdmVGdW5jczogTWFwPHN0cmluZywgRnVuY3Rpb24+ID0gbmV3IE1hcDxzdHJpbmcsIEZ1bmN0aW9uPigpO1xuICAgIHByaXZhdGUgX21vdXNlVXBGdW5jczogTWFwPHN0cmluZywgRnVuY3Rpb24+ID0gbmV3IE1hcDxzdHJpbmcsIEZ1bmN0aW9uPigpO1xuICAgIHByaXZhdGUgX21vdXNlTGVhdmVGdW5jczogTWFwPHN0cmluZywgRnVuY3Rpb24+ID0gbmV3IE1hcDxzdHJpbmcsIEZ1bmN0aW9uPigpO1xuICAgIHByaXZhdGUgX2hvdmVySW5GdW5jczogTWFwPHN0cmluZywgRnVuY3Rpb24+ID0gbmV3IE1hcDxzdHJpbmcsIEZ1bmN0aW9uPigpO1xuICAgIHByaXZhdGUgX2hvdmVyT3V0RnVuY3M6IE1hcDxzdHJpbmcsIEZ1bmN0aW9uPiA9IG5ldyBNYXA8c3RyaW5nLCBGdW5jdGlvbj4oKTtcblxuICAgIGNvbnN0cnVjdG9yKHJvb3ROb2RlOiBOb2RlKSB7XG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlID0gcm9vdE5vZGU7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBsb2NrU2l6ZSh2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICB0aGlzLl9sb2NrU2l6ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaUueaOp+WItuWZqOaJgOS+nemZhOeahOagueiKgueCuVxuICAgICAqL1xuICAgIHB1YmxpYyBzZXRSb290KHJvb3ROb2RlOiBOb2RlKSB7XG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlID0gcm9vdE5vZGU7XG4gICAgICAgIGlmICh0aGlzLnNoYXBlKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlLnBhcmVudCA9IHRoaXMuX3Jvb3ROb2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGdldFJvb3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yb290Tm9kZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlU2hhcGVOb2RlKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLnNoYXBlID0gY3JlYXRlM0ROb2RlKG5hbWUpO1xuICAgICAgICB0aGlzLnNoYXBlLnBhcmVudCA9IHRoaXMuX3Jvb3ROb2RlO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWdpc3RlckV2ZW50cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudHNSZWdpc3RlcmVkKSB7XG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FtZXJhTW92ZWRFdmVudCgpO1xuICAgICAgICAgICAgdGhpcy5yZWdpc3Rlck9ydGhvSGVpZ2h0Q2hhbmdlZEV2ZW50KCk7XG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FtZXJhRm92Q2hhbmdlZEV2ZW50KCk7XG4gICAgICAgICAgICB0aGlzLl9vbkRpbWVuc2lvbkNoYW5nZWQgPSB0aGlzLm9uRGltZW5zaW9uQ2hhbmdlZC5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fb25TY2FsZTJEQ2hhbmdlZCA9IHRoaXMub25TY2FsZTJEQ2hhbmdlZC5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICBjb25zdCB0dGQgPSBnZXRUcmFuc2Zvcm1Ub29sRGF0YSgpO1xuICAgICAgICAgICAgaWYgKHR0ZCkge1xuICAgICAgICAgICAgICAgIHR0ZC5hZGRMaXN0ZW5lcignZGltZW5zaW9uLWNoYW5nZWQnLCB0aGlzLl9vbkRpbWVuc2lvbkNoYW5nZWQpO1xuICAgICAgICAgICAgICAgIHR0ZC5hZGRMaXN0ZW5lcignc2NhbGUtMmQtY2hhbmdlZCcsIHRoaXMuX29uU2NhbGUyRENoYW5nZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9ldmVudHNSZWdpc3RlcmVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB1bnJlZ2lzdGVyRXZlbnRzKCkge1xuICAgICAgICBpZiAodGhpcy5fZXZlbnRzUmVnaXN0ZXJlZCkge1xuICAgICAgICAgICAgdGhpcy51bnJlZ2lzdGVyQ2FtZXJhTW92ZUV2ZW50KCk7XG4gICAgICAgICAgICB0aGlzLnVucmVnaXN0ZXJPcnRob0hlaWdodENoYW5nZWRFdmVudCgpO1xuICAgICAgICAgICAgdGhpcy51bnJlZ2lzdGVyQ2FtZXJhRm92Q2hhbmdlZEV2ZW50KCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHR0ZCA9IGdldFRyYW5zZm9ybVRvb2xEYXRhKCk7XG4gICAgICAgICAgICBpZiAodHRkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX29uRGltZW5zaW9uQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICB0dGQucmVtb3ZlTGlzdGVuZXIoJ2RpbWVuc2lvbi1jaGFuZ2VkJywgdGhpcy5fb25EaW1lbnNpb25DaGFuZ2VkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX29uU2NhbGUyRENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHRkLnJlbW92ZUxpc3RlbmVyKCdzY2FsZS0yZC1jaGFuZ2VkJywgdGhpcy5fb25TY2FsZTJEQ2hhbmdlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9ldmVudHNSZWdpc3RlcmVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVnaXN0ZXJDYW1lcmFNb3ZlZEV2ZW50KCkge1xuICAgICAgICBjb25zdCBlZGl0b3JDYW1lcmEgPSBnZXRFZGl0b3JDYW1lcmEoKTtcbiAgICAgICAgaWYgKGVkaXRvckNhbWVyYT8ubm9kZSkge1xuICAgICAgICAgICAgZWRpdG9yQ2FtZXJhLm5vZGUub24oJ3RyYW5zZm9ybS1jaGFuZ2VkJywgdGhpcy5vbkVkaXRvckNhbWVyYU1vdmVkLCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB1bnJlZ2lzdGVyQ2FtZXJhTW92ZUV2ZW50KCkge1xuICAgICAgICBjb25zdCBlZGl0b3JDYW1lcmEgPSBnZXRFZGl0b3JDYW1lcmEoKTtcbiAgICAgICAgaWYgKGVkaXRvckNhbWVyYT8ubm9kZSkge1xuICAgICAgICAgICAgZWRpdG9yQ2FtZXJhLm5vZGUub2ZmKCd0cmFuc2Zvcm0tY2hhbmdlZCcsIHRoaXMub25FZGl0b3JDYW1lcmFNb3ZlZCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVnaXN0ZXJDYW1lcmFGb3ZDaGFuZ2VkRXZlbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLm9uQ2FtZXJhRm92Q2hhbmdlZCkge1xuICAgICAgICAgICAgdGhpcy5fb25DYW1lcmFGb3ZDaGFuZ2VkID8/PSB0aGlzLm9uQ2FtZXJhRm92Q2hhbmdlZC5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgICAgICAgICAgU2VydmljZS5DYW1lcmE/Lm9uPy4oJ2NhbWVyYTpmb3YtY2hhbmdlZCcsIHRoaXMuX29uQ2FtZXJhRm92Q2hhbmdlZCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gbm90IHJlYWR5XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVnaXN0ZXJPcnRob0hlaWdodENoYW5nZWRFdmVudCgpIHtcbiAgICAgICAgdGhpcy5fb25DYW1lcmFPcnRob0hlaWdodENoYW5nZWQgPSB0aGlzLm9uQ2FtZXJhT3J0aG9IZWlnaHRDaGFuZ2VkLmJpbmQodGhpcyk7XG4gICAgICAgIGNvbnN0IHR0ZCA9IGdldFRyYW5zZm9ybVRvb2xEYXRhKCk7XG4gICAgICAgIGlmICh0dGQpIHtcbiAgICAgICAgICAgIHR0ZC5hZGRMaXN0ZW5lcignY2FtZXJhLW9ydGhvLWhlaWdodC1jaGFuZ2VkJywgdGhpcy5fb25DYW1lcmFPcnRob0hlaWdodENoYW5nZWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHVucmVnaXN0ZXJDYW1lcmFGb3ZDaGFuZ2VkRXZlbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9vbkNhbWVyYUZvdkNoYW5nZWQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBTZXJ2aWNlIH0gPSByZXF1aXJlKCcuLi8uLi9jb3JlL2RlY29yYXRvcicpO1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuQ2FtZXJhPy5vZmY/LignY2FtZXJhOmZvdi1jaGFuZ2VkJywgdGhpcy5fb25DYW1lcmFGb3ZDaGFuZ2VkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBub3QgcmVhZHlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB1bnJlZ2lzdGVyT3J0aG9IZWlnaHRDaGFuZ2VkRXZlbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9vbkNhbWVyYU9ydGhvSGVpZ2h0Q2hhbmdlZCkge1xuICAgICAgICAgICAgY29uc3QgdHRkID0gZ2V0VHJhbnNmb3JtVG9vbERhdGEoKTtcbiAgICAgICAgICAgIGlmICh0dGQpIHtcbiAgICAgICAgICAgICAgICB0dGQucmVtb3ZlTGlzdGVuZXIoJ2NhbWVyYS1vcnRoby1oZWlnaHQtY2hhbmdlZCcsIHRoaXMuX29uQ2FtZXJhT3J0aG9IZWlnaHRDaGFuZ2VkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkVkaXRvckNhbWVyYU1vdmVkKCkge1xuICAgICAgICB0aGlzLmFkanVzdENvbnRyb2xsZXJTaXplKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGluaXRIYW5kbGUobm9kZTogTm9kZSwgaGFuZGxlTmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHJlbmRlcmVyTm9kZXMgPSB0aGlzLmdldFJlbmRlcmVyTm9kZXMobm9kZSk7XG4gICAgICAgIGNvbnN0IGNvbG9yczogQ29sb3JbXSA9IFtdO1xuICAgICAgICBjb25zdCBvcGFjaXRpZXM6IG51bWJlcltdID0gW107XG4gICAgICAgIHJlbmRlcmVyTm9kZXMuZm9yRWFjaCgock5vZGU6IE5vZGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gZ2V0TWVzaENvbG9yKHJOb2RlKTtcbiAgICAgICAgICAgIGlmIChjb2xvcikge1xuICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKG5ldyBDb2xvcihjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKSk7XG4gICAgICAgICAgICAgICAgb3BhY2l0aWVzLnB1c2goZ2V0Tm9kZU9wYWNpdHkock5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGhhbmRsZURhdGE6IElIYW5kbGVEYXRhID0ge1xuICAgICAgICAgICAgbmFtZTogaGFuZGxlTmFtZSxcbiAgICAgICAgICAgIHRvcE5vZGU6IG5vZGUsXG4gICAgICAgICAgICByZW5kZXJlck5vZGVzLFxuICAgICAgICAgICAgb3JpQ29sb3JzOiBjb2xvcnMsXG4gICAgICAgICAgICBvcmlPcGFjaXRpZXM6IG9wYWNpdGllcyxcbiAgICAgICAgICAgIG5vcm1hbFRvcnVzTm9kZTogbnVsbCxcbiAgICAgICAgICAgIGluZGljYXRvckNpcmNsZTogbnVsbCxcbiAgICAgICAgICAgIGFycm93Tm9kZTogbnVsbCxcbiAgICAgICAgICAgIG5vcm1hbFRvcnVzTVI6IG51bGwsXG4gICAgICAgICAgICBwYW5QbGFuZTogbnVsbCxcbiAgICAgICAgICAgIGN1c3RvbURhdGE6IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmF5RGV0ZWN0Tm9kZXMgPSB0aGlzLmdldFJheURldGVjdE5vZGVzKG5vZGUpO1xuICAgICAgICByYXlEZXRlY3ROb2Rlcy5mb3JFYWNoKChyTm9kZTogTm9kZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZWdpc3Rlck1vdXNlRXZlbnRzKHJOb2RlLCBoYW5kbGVOYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcFtoYW5kbGVOYW1lXSA9IGhhbmRsZURhdGE7XG5cbiAgICAgICAgcmV0dXJuIGhhbmRsZURhdGE7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZUhhbmRsZShoYW5kbGVOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuX2hhbmRsZURhdGFNYXBbaGFuZGxlTmFtZV0pIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9oYW5kbGVEYXRhTWFwW2hhbmRsZU5hbWVdLnRvcE5vZGU7XG4gICAgICAgICAgICBjb25zdCByYXlEZXRlY3ROb2RlcyA9IHRoaXMuZ2V0UmF5RGV0ZWN0Tm9kZXMobm9kZSk7XG4gICAgICAgICAgICByYXlEZXRlY3ROb2Rlcy5mb3JFYWNoKChyTm9kZTogTm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudW5yZWdpc3Rlck1vdXNlRXZlbnQock5vZGUsIGhhbmRsZU5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5faGFuZGxlRGF0YU1hcFtoYW5kbGVOYW1lXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRIYW5kbGVDb2xvcihoYW5kbGVOYW1lOiBzdHJpbmcsIGNvbG9yOiBDb2xvciwgb3BhY2l0eT86IG51bWJlcikge1xuICAgICAgICBjb25zdCBoYW5kbGVEYXRhID0gdGhpcy5faGFuZGxlRGF0YU1hcFtoYW5kbGVOYW1lXTtcbiAgICAgICAgY29uc3QgcmVuZGVyZXJOb2RlcyA9IGhhbmRsZURhdGEucmVuZGVyZXJOb2RlcztcbiAgICAgICAgaWYgKHJlbmRlcmVyTm9kZXMpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyTm9kZXMuZm9yRWFjaCgock5vZGU6IE5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAob3BhY2l0eSA9PT0gdW5kZWZpbmVkIHx8IG9wYWNpdHkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eSA9IGdldE5vZGVPcGFjaXR5KHJOb2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0TWVzaENvbG9yKHJOb2RlLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgc2V0Tm9kZU9wYWNpdHkock5vZGUsIG9wYWNpdHkhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlc2V0SGFuZGxlQ29sb3IoZXZlbnQ/OiBHaXptb01vdXNlRXZlbnQ8eyBob3ZlckluTm9kZU1hcDogTWFwPE5vZGUsIGJvb2xlYW4+IH0+KSB7XG4gICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy5yZXNldEhhbmRsZUNvbG9yQnlLZXkoZXZlbnQuaGFuZGxlTmFtZSwgZXZlbnQuY3VzdG9tRGF0YT8uaG92ZXJJbk5vZGVNYXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5faGFuZGxlRGF0YU1hcCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRIYW5kbGVDb2xvckJ5S2V5KGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDph43nva7mjIflrpogaGFuZGxlIOeahOminOiJsuS4jumAj+aYjuW6plxuICAgICAqL1xuICAgIHByaXZhdGUgcmVzZXRIYW5kbGVDb2xvckJ5S2V5KGtleTogc3RyaW5nLCBob3ZlckluTm9kZU1hcD86IE1hcDxOb2RlLCBib29sZWFuPikge1xuICAgICAgICBjb25zdCBoYW5kbGVEYXRhID0gdGhpcy5faGFuZGxlRGF0YU1hcFtrZXldO1xuICAgICAgICBpZiAoIWhhbmRsZURhdGEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZW5kZXJlck5vZGVzID0gaGFuZGxlRGF0YS5yZW5kZXJlck5vZGVzO1xuICAgICAgICBjb25zdCBvcmlDb2xvcnMgPSBoYW5kbGVEYXRhLm9yaUNvbG9ycztcbiAgICAgICAgY29uc3Qgb3JpT3BhY2l0aWVzID0gaGFuZGxlRGF0YS5vcmlPcGFjaXRpZXM7XG5cbiAgICAgICAgbGV0IG5vZGVzSW5Ib3ZlciA9IDA7XG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiByZW5kZXJlck5vZGVzKSB7XG4gICAgICAgICAgICBpZiAoaG92ZXJJbk5vZGVNYXA/Lmhhcyhub2RlKSkge1xuICAgICAgICAgICAgICAgIG5vZGVzSW5Ib3ZlcisrO1xuICAgICAgICAgICAgICAgIGlmIChub2Rlc0luSG92ZXIgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVzZXQgY29sb3IgYW5kIG9wYWNpdHlcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJlck5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gcmVuZGVyZXJOb2Rlc1tpXTtcbiAgICAgICAgICAgIHNldE1lc2hDb2xvcihub2RlLCBvcmlDb2xvcnNbaV0pO1xuICAgICAgICAgICAgc2V0Tm9kZU9wYWNpdHkobm9kZSwgb3JpT3BhY2l0aWVzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZWdpc3Rlck1vdXNlRXZlbnRzKG5vZGU6IE5vZGUsIGNvbnRyb2xOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbW91c2VEb3duID0gKGV2ZW50OiBHaXptb01vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LmhhbmRsZU5hbWUgPSBjb250cm9sTmFtZTtcbiAgICAgICAgICAgIGV2ZW50Lm5vZGUgPSBub2RlO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5faXNNb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMub25Nb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uTW91c2VEb3duKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fbW91c2VEb3duRnVuY3Muc2V0KGNvbnRyb2xOYW1lLCBtb3VzZURvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIG5vZGUub24oJ21vdXNlRG93bicsIHRoaXMuX21vdXNlRG93bkZ1bmNzLmdldChjb250cm9sTmFtZSkgYXMgRnVuY3Rpb24pO1xuXG4gICAgICAgIGNvbnN0IG1vdXNlTW92ZSA9IChldmVudDogR2l6bW9Nb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGV2ZW50LmhhbmRsZU5hbWUgPSBjb250cm9sTmFtZTtcbiAgICAgICAgICAgIGV2ZW50Lm5vZGUgPSBub2RlO1xuICAgICAgICAgICAgaWYgKHRoaXMub25Nb3VzZU1vdmUgJiYgKCF0aGlzLnNoYXBlIHx8IHRoaXMuc2hhcGUuYWN0aXZlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25Nb3VzZU1vdmUoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVwYWludEVuZ2luZSgpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9tb3VzZU1vdmVGdW5jcy5zZXQoY29udHJvbE5hbWUsIG1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgbm9kZS5vbignbW91c2VNb3ZlJywgdGhpcy5fbW91c2VNb3ZlRnVuY3MuZ2V0KGNvbnRyb2xOYW1lKSBhcyBGdW5jdGlvbik7XG5cbiAgICAgICAgY29uc3QgbW91c2VVcCA9ICgoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQuaGFuZGxlTmFtZSA9IGNvbnRyb2xOYW1lO1xuICAgICAgICAgICAgZXZlbnQubm9kZSA9IG5vZGU7XG4gICAgICAgICAgICBpZiAodGhpcy5vbk1vdXNlVXAgJiYgKCF0aGlzLnNoYXBlIHx8IHRoaXMuc2hhcGUuYWN0aXZlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25Nb3VzZVVwKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2lzTW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgIH0pLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX21vdXNlVXBGdW5jcy5zZXQoY29udHJvbE5hbWUsIG1vdXNlVXApO1xuICAgICAgICBub2RlLm9uKCdtb3VzZVVwJywgbW91c2VVcCk7XG5cbiAgICAgICAgLy8g6byg5qCH56e75Ye65Zy65pmv56qX5Y+j77yM5pqC5pe25aSE55CG5Li65ZKMbW91c2V1cOetieWQjFxuICAgICAgICBjb25zdCBtb3VzZUxlYXZlID0gKChldmVudDogR2l6bW9Nb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBldmVudC5oYW5kbGVOYW1lID0gY29udHJvbE5hbWU7XG4gICAgICAgICAgICBldmVudC5ub2RlID0gbm9kZTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uTW91c2VMZWF2ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25Nb3VzZUxlYXZlKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2lzTW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgIH0pLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX21vdXNlTGVhdmVGdW5jcy5zZXQoY29udHJvbE5hbWUsIG1vdXNlTGVhdmUpO1xuICAgICAgICBub2RlLm9uKCdtb3VzZUxlYXZlJywgbW91c2VMZWF2ZSk7XG5cbiAgICAgICAgY29uc3QgaG92ZXJJbiA9ICgoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQuaGFuZGxlTmFtZSA9IGNvbnRyb2xOYW1lO1xuICAgICAgICAgICAgZXZlbnQubm9kZSA9IG5vZGU7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkhvdmVySW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uSG92ZXJJbihldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXBhaW50RW5naW5lKCk7XG4gICAgICAgIH0pLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2hvdmVySW5GdW5jcy5zZXQoY29udHJvbE5hbWUsIGhvdmVySW4pO1xuICAgICAgICBub2RlLm9uKCdob3ZlckluJywgaG92ZXJJbik7XG5cbiAgICAgICAgY29uc3QgaG92ZXJPdXQgPSAoKGV2ZW50OiBHaXptb01vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LmhhbmRsZU5hbWUgPSBjb250cm9sTmFtZTtcbiAgICAgICAgICAgIGV2ZW50Lm5vZGUgPSBub2RlO1xuICAgICAgICAgICAgaWYgKHRoaXMub25Ib3Zlck91dCkge1xuICAgICAgICAgICAgICAgIHRoaXMub25Ib3Zlck91dChldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXBhaW50RW5naW5lKCk7XG4gICAgICAgIH0pLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2hvdmVyT3V0RnVuY3Muc2V0KGNvbnRyb2xOYW1lLCBob3Zlck91dC5iaW5kKHRoaXMpKTtcbiAgICAgICAgbm9kZS5vbignaG92ZXJPdXQnLCBob3Zlck91dCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVucmVnaXN0ZXJNb3VzZUV2ZW50KG5vZGU6IE5vZGUsIGNvbnRyb2xOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgbm9kZS5vZmYoJ21vdXNlRG93bicsIHRoaXMuX21vdXNlRG93bkZ1bmNzLmdldChjb250cm9sTmFtZSkpO1xuICAgICAgICBub2RlLm9mZignbW91c2VNb3ZlJywgdGhpcy5fbW91c2VNb3ZlRnVuY3MuZ2V0KGNvbnRyb2xOYW1lKSk7XG4gICAgICAgIG5vZGUub2ZmKCdtb3VzZVVwJywgdGhpcy5fbW91c2VVcEZ1bmNzLmdldChjb250cm9sTmFtZSkpO1xuICAgICAgICBub2RlLm9mZignbW91c2VMZWF2ZScsIHRoaXMuX21vdXNlTGVhdmVGdW5jcy5nZXQoY29udHJvbE5hbWUpKTtcbiAgICAgICAgbm9kZS5vZmYoJ2hvdmVySW4nLCB0aGlzLl9ob3ZlckluRnVuY3MuZ2V0KGNvbnRyb2xOYW1lKSk7XG4gICAgICAgIG5vZGUub2ZmKCdob3Zlck91dCcsIHRoaXMuX2hvdmVyT3V0RnVuY3MuZ2V0KGNvbnRyb2xOYW1lKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldFBvc2l0aW9uKHZhbHVlOiBSZWFkb25seTxWZWMzPikge1xuICAgICAgICB0aGlzLnNoYXBlPy5zZXRQb3NpdGlvbih2YWx1ZSk7XG4gICAgICAgIHRoaXMuYWRqdXN0Q29udHJvbGxlclNpemUoKTtcbiAgICB9XG5cbiAgICAvLyDov5Tlm57nm7jlr7nkuo5Sb29055qE5bGA6YOo5Z2Q5qCHXG4gICAgcHVibGljIGdldFBvc2l0aW9uKG91dD86IFZlYzMpIHtcbiAgICAgICAgaWYgKCFvdXQpIHtcbiAgICAgICAgICAgIG91dCA9IG5ldyBWZWMzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaGFwZT8uZ2V0UG9zaXRpb24ob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG5cbiAgICAvLyDov5Tlm57kuJbnlYzlnZDmoIdcbiAgICBwdWJsaWMgZ2V0V29ybGRQb3NpdGlvbihvdXQ/OiBWZWMzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFdvcmxkUG9zaXRpb25Gb3JOb2RlKHRoaXMuc2hhcGUsIG91dCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFdvcmxkUG9zaXRpb25Gb3JOb2RlKHNvdXJjZT86IE5vZGUgfCBudWxsLCBvdXQ/OiBWZWMzKSB7XG4gICAgICAgIGlmICghb3V0KSB7XG4gICAgICAgICAgICBvdXQgPSBuZXcgVmVjMygpO1xuICAgICAgICB9XG4gICAgICAgIChzb3VyY2UgPz8gdGhpcy5zaGFwZSk/LmdldFdvcmxkUG9zaXRpb24ob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDor6Xlh73mlbDmmK/kuLrkuobmlK/mjIEgVUlTa2V3IOaViOaenOiAjOWKoOWFpVxuICAgICAqL1xuICAgIHB1YmxpYyBzZXRXb3JsZE1hdHJpeCh2YWx1ZTogUmVhZG9ubHk8TWF0ND4pIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLnNoYXBlLl9tYXQuc2V0KHZhbHVlKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSDnpoHmraLoh6rouqvmm7TmlrDoioLngrnnmoTkuJbnlYzlj5jmjaLkv6Hmga9cbiAgICAgICAgdGhpcy5zaGFwZS5fdHJhbnNmb3JtRmxhZ3MgPSBUcmFuc2Zvcm1CaXQuTk9ORTtcbiAgICAgICAgdGhpcy5zaGFwZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogTm9kZSkgPT4ge1xuICAgICAgICAgICAgY2hpbGQuaW52YWxpZGF0ZUNoaWxkcmVuKFRyYW5zZm9ybUJpdC5UUlMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zaGFwZS5lbWl0KE5vZGVFdmVudFR5cGUuVFJBTlNGT1JNX0NIQU5HRUQsIFRyYW5zZm9ybUJpdC5UUlMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRSb3RhdGlvbih2YWx1ZTogUmVhZG9ubHk8UXVhdD4pIHtcbiAgICAgICAgdGhpcy5zaGFwZT8uc2V0Um90YXRpb24odmFsdWUpO1xuICAgICAgICB0aGlzLmFkanVzdENvbnRyb2xsZXJTaXplKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFJvdGF0aW9uKG91dD86IFF1YXQpIHtcbiAgICAgICAgaWYgKCFvdXQpIHtcbiAgICAgICAgICAgIG91dCA9IG5ldyBRdWF0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaGFwZT8uZ2V0Um90YXRpb24ob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0U2NhbGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY2FsZTtcbiAgICB9XG4gICAgcHVibGljIHNldFNjYWxlKHZhbHVlOiBWZWMzKSB7XG4gICAgICAgIHRoaXMuX3NjYWxlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuYWRqdXN0Q29udHJvbGxlclNpemUoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlQ29udHJvbGxlcigpIHtcbiAgICAgICAgdGhpcy5hZGp1c3RDb250cm9sbGVyU2l6ZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDYW1lcmFEaXN0U2NhbGFyKHBvczogVmVjMykge1xuICAgICAgICBjb25zdCBlZGl0b3JDYW1lcmEgPSBnZXRFZGl0b3JDYW1lcmEoKTtcbiAgICAgICAgaWYgKCFlZGl0b3JDYW1lcmE/Lm5vZGUpIHJldHVybiAxO1xuICAgICAgICBjb25zdCBkaXN0ID0gQ29udHJvbGxlclV0aWxzLmdldENhbWVyYURpc3RhbmNlRmFjdG9yKHBvcywgZWRpdG9yQ2FtZXJhLm5vZGUpO1xuICAgICAgICBjb25zdCBzY2FsYXIgPSBkaXN0IC8gdGhpcy5fYmFzZURpc3Q7XG5cbiAgICAgICAgcmV0dXJuIHNjYWxhcjtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0RGlzdFNjYWxhckluT3J0aG8oKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvckNhbWVyYSA9IGdldEVkaXRvckNhbWVyYSgpO1xuICAgICAgICBpZiAoIWVkaXRvckNhbWVyYT8ubm9kZSkgcmV0dXJuIDE7XG4gICAgICAgIGNvbnN0IGRpc3QgPSBDb250cm9sbGVyVXRpbHMuZ2V0Q2FtZXJhRGlzdGFuY2VGYWN0b3IodGhpcy5nZXRXb3JsZFBvc2l0aW9uKHRlbXBWZWMzX2EpLCBlZGl0b3JDYW1lcmEubm9kZSk7XG4gICAgICAgIGNvbnN0IGZvdiA9IGVkaXRvckNhbWVyYS5mb3Y7XG4gICAgICAgIGNvbnN0IGRlcHRoX3NpemUgPSBNYXRoLnRhbigoKGZvdiAvIDIpICogTWF0aC5QSSkgLyAxODApO1xuICAgICAgICBjb25zdCBiYXNlT3J0aG9IZWlnaHQgPSBkZXB0aF9zaXplICogZGlzdDtcblxuICAgICAgICBjb25zdCBzY2FsYXIgPSAoZGlzdCAvIHRoaXMuX2Jhc2VEaXN0KSAqIChlZGl0b3JDYW1lcmEub3J0aG9IZWlnaHQgLyBiYXNlT3J0aG9IZWlnaHQpO1xuICAgICAgICByZXR1cm4gc2NhbGFyO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBpc0NhbWVyYUluT3J0aG8oKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvckNhbWVyYSA9IGdldEVkaXRvckNhbWVyYSgpO1xuICAgICAgICByZXR1cm4gZWRpdG9yQ2FtZXJhPy5wcm9qZWN0aW9uID09PSBQcm9qZWN0aW9uVHlwZS5PUlRITztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGlzdFNjYWxhcihub2RlPzogTm9kZSkge1xuICAgICAgICBsZXQgc2NhbGFyID0gMTtcbiAgICAgICAgY29uc3QgdHRkID0gdGhpcy50cmFuc2Zvcm1Ub29sRGF0YTtcblxuICAgICAgICBpZiAodHRkPy5pczJEKSB7XG4gICAgICAgICAgICAvLyDov5nph4znmoQgMS41IOaYr+agueaNriB0cmFuc2Zvcm0gdG9vbCDlrp7pmYXmmL7npLrnmoTmlYjmnpzmnaXosIPmlbTnmoRcbiAgICAgICAgICAgIHNjYWxhciA9IDEuNSAvIHR0ZC5zY2FsZTJEO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNDYW1lcmFJbk9ydGhvKCkpIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuZ2V0RGlzdFNjYWxhckluT3J0aG8oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuZ2V0Q2FtZXJhRGlzdFNjYWxhcih0aGlzLmdldFdvcmxkUG9zaXRpb25Gb3JOb2RlKG5vZGUsIHRlbXBWZWMzX2EpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzY2FsYXI7XG4gICAgfVxuXG4gICAgcHVibGljIGFkanVzdENvbnRyb2xsZXJTaXplKCkge1xuICAgICAgICBsZXQgc2NhbGFyID0gMTtcbiAgICAgICAgaWYgKHRoaXMuX2xvY2tTaXplKSB7XG4gICAgICAgICAgICAvLyDmoLnmja7lkoznm7jmnLrnmoTot53nprvvvIzlr7nlnZDmoIfns7vov5vooYzmlbTkvZPmlL7nvKnvvIzkvb/lvpflpKflsI/nm7jlr7nlsY/luZXlm7rlrppcbiAgICAgICAgICAgIHNjYWxhciA9IHRoaXMuZ2V0RGlzdFNjYWxhcigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG91dCA9IG5ldyBWZWMzKHRoaXMuX3NjYWxlKTtcbiAgICAgICAgb3V0Lm11bHRpcGx5U2NhbGFyKHNjYWxhcik7XG4gICAgICAgIHRoaXMuc2hhcGU/LnNldFNjYWxlKG91dCk7XG4gICAgfVxuXG4gICAgcHVibGljIG5lZWRSZW5kZXIobm9kZTogTm9kZSkge1xuICAgICAgICBjb25zdCBjc2M6IGFueSA9IG5vZGUuZ2V0Q29tcG9uZW50KENvbnRyb2xsZXJTaGFwZUNvbGxpZGVyKTtcbiAgICAgICAgaWYgKGNzYyAmJiBjc2MuaXNSZW5kZXIgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UmVuZGVyZXJOb2Rlcyhub2RlOiBOb2RlKTogTm9kZVtdIHtcbiAgICAgICAgbGV0IHJlbmRlck5vZGVzOiBOb2RlW10gPSBbXTtcblxuICAgICAgICBpZiAoZ2V0TW9kZWwobm9kZSkgJiYgdGhpcy5uZWVkUmVuZGVyKG5vZGUpKSB7XG4gICAgICAgICAgICByZW5kZXJOb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICByZW5kZXJOb2RlcyA9IHJlbmRlck5vZGVzLmNvbmNhdCh0aGlzLmdldFJlbmRlcmVyTm9kZXMoY2hpbGQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZW5kZXJOb2RlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UmF5RGV0ZWN0Tm9kZXMobm9kZTogTm9kZSk6IE5vZGVbXSB7XG4gICAgICAgIGxldCByYXlEZXRlY3ROb2RlczogTm9kZVtdID0gW107XG4gICAgICAgIGlmIChnZXRNb2RlbChub2RlKSkge1xuICAgICAgICAgICAgcmF5RGV0ZWN0Tm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgcmF5RGV0ZWN0Tm9kZXMgPSByYXlEZXRlY3ROb2Rlcy5jb25jYXQodGhpcy5nZXRSYXlEZXRlY3ROb2RlcyhjaGlsZCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJheURldGVjdE5vZGVzO1xuICAgIH1cblxuICAgIHB1YmxpYyBsb2NhbFRvV29ybGRQb3NpdGlvbihsb2NhbFBvczogVmVjMykge1xuICAgICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IG5ldyBNYXQ0KCk7XG4gICAgICAgIGNvbnN0IHdvcmxkUG9zID0gbmV3IFZlYzMoKTtcbiAgICAgICAgdGhpcy5zaGFwZT8uZ2V0V29ybGRNYXRyaXgod29ybGRNYXRyaXgpO1xuXG4gICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NCh3b3JsZFBvcywgbG9jYWxQb3MsIHdvcmxkTWF0cml4KTtcblxuICAgICAgICByZXR1cm4gd29ybGRQb3M7XG4gICAgfVxuXG4gICAgcHVibGljIGxvY2FsVG9Xb3JsZERpcihsb2NhbERpcjogVmVjMyk6IFZlYzMge1xuICAgICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IG5ldyBNYXQ0KCk7XG4gICAgICAgIGNvbnN0IHdvcmxkRGlyID0gbmV3IFZlYzMoKTtcbiAgICAgICAgdGhpcy5zaGFwZT8uZ2V0V29ybGRNYXRyaXgod29ybGRNYXRyaXgpO1xuXG4gICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NE5vcm1hbCh3b3JsZERpciwgbG9jYWxEaXIsIHdvcmxkTWF0cml4KTtcbiAgICAgICAgVmVjMy5ub3JtYWxpemUod29ybGREaXIsIHdvcmxkRGlyKTtcbiAgICAgICAgcmV0dXJuIHdvcmxkRGlyO1xuICAgIH1cblxuICAgIHB1YmxpYyB3b3JsZFBvc1RvU2NyZWVuUG9zKHdvcmxkUG9zOiBWZWMzKTogVmVjMyB7XG4gICAgICAgIGNvbnN0IGVkaXRvckNhbWVyYSA9IGdldEVkaXRvckNhbWVyYSgpO1xuICAgICAgICBjb25zdCBzY3JlZW5Qb3MgPSBuZXcgVmVjMygpO1xuICAgICAgICBlZGl0b3JDYW1lcmE/LmNhbWVyYT8ud29ybGRUb1NjcmVlbihzY3JlZW5Qb3MsIHdvcmxkUG9zKTtcblxuICAgICAgICByZXR1cm4gc2NyZWVuUG9zO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRTY3JlZW5Qb3MobG9jYWxQb3M6IFZlYzMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRQb3NUb1NjcmVlblBvcyh0aGlzLmxvY2FsVG9Xb3JsZFBvc2l0aW9uKGxvY2FsUG9zKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEFsaWduQXhpc01vdmVEaXN0YW5jZShheGlzV29ybGREaXI6IFZlYzMsIGRlbHRhUG9zOiBWZWMyKSB7XG4gICAgICAgIGNvbnN0IGVuZFBvcyA9IFZlYzMuYWRkKHRlbXBWZWMzX2EsIHRoaXMuZ2V0UG9zaXRpb24oKSwgYXhpc1dvcmxkRGlyKTtcbiAgICAgICAgY29uc3QgZGlySW5TY3JlZW4gPSB0aGlzLndvcmxkUG9zVG9TY3JlZW5Qb3MoZW5kUG9zKTtcbiAgICAgICAgY29uc3Qgb3JpUG9zSW5TY3JlZW4gPSB0aGlzLndvcmxkUG9zVG9TY3JlZW5Qb3ModGhpcy5nZXRQb3NpdGlvbigpKTtcbiAgICAgICAgVmVjMi5zdWJ0cmFjdChkaXJJblNjcmVlbiwgZGlySW5TY3JlZW4sIG9yaVBvc0luU2NyZWVuKTtcbiAgICAgICAgVmVjMi5ub3JtYWxpemUoZGlySW5TY3JlZW4sIGRpckluU2NyZWVuKTtcbiAgICAgICAgY29uc3QgYWxpZ25BeGlzTW92ZURpc3QgPSBWZWMyLmRvdChkZWx0YVBvcywgdGVtcFZlYzJfYS5zZXQoZGlySW5TY3JlZW4ueCwgZGlySW5TY3JlZW4ueSkpO1xuICAgICAgICByZXR1cm4gYWxpZ25BeGlzTW92ZURpc3Q7XG4gICAgfVxuXG4gICAgZ2V0UG9zaXRpb25PblBhblBsYW5lKGhpdFBvczogVmVjMywgeDogbnVtYmVyLCB5OiBudW1iZXIsIHBhblBsYW5lOiBOb2RlKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBnZXRSYXljYXN0UmVzdWx0c0J5Tm9kZXMoW3BhblBsYW5lXSwgeCwgeSwgSW5maW5pdHksIGZhbHNlKTtcblxuICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBmaXJzdFJlc3VsdCA9IHJlc3VsdHNbMF07XG4gICAgICAgICAgICBoaXRQb3Muc2V0KGZpcnN0UmVzdWx0LmhpdFBvaW50KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBzaG93KCkge1xuICAgICAgICBpZiAodGhpcy5zaGFwZSkge1xuICAgICAgICAgICAgdGhpcy5zaGFwZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub25TaG93KSB7XG4gICAgICAgICAgICB0aGlzLm9uU2hvdygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGhpZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLnNoYXBlKSB7XG4gICAgICAgICAgICB0aGlzLnNoYXBlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lzTW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNMb2NrID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVzZXRIYW5kbGVDb2xvcigpO1xuICAgICAgICBpZiAodGhpcy5vbkhpZGUpIHtcbiAgICAgICAgICAgIHRoaXMub25IaWRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb25DYW1lcmFGb3ZDaGFuZ2VkPzogKGZvdjogbnVtYmVyKSA9PiB2b2lkO1xuXG4gICAgcHVibGljIG9uRGltZW5zaW9uQ2hhbmdlZCgpIHtcbiAgICAgICAgaWYgKHRoaXMudmlzaWJsZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMub25TaG93KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vblNob3coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvblNjYWxlMkRDaGFuZ2VkKCkge1xuICAgICAgICBpZiAodGhpcy52aXNpYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmFkanVzdENvbnRyb2xsZXJTaXplKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb25DYW1lcmFPcnRob0hlaWdodENoYW5nZWQoKSB7XG4gICAgICAgIGlmICh0aGlzLnZpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0Q29udHJvbGxlclNpemUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBvbk1vdXNlRG93bj8oZXZlbnQ6IEdpem1vTW91c2VFdmVudCk6IGJvb2xlYW4gfCB2b2lkO1xuICAgIHByb3RlY3RlZCBvbk1vdXNlTW92ZT8oZXZlbnQ6IEdpem1vTW91c2VFdmVudCk6IGJvb2xlYW4gfCB2b2lkO1xuICAgIHByb3RlY3RlZCBvbk1vdXNlVXA/KGV2ZW50OiBHaXptb01vdXNlRXZlbnQpOiBib29sZWFuIHwgdm9pZDtcbiAgICBwcm90ZWN0ZWQgb25Nb3VzZUxlYXZlPyhldmVudDogR2l6bW9Nb3VzZUV2ZW50KTogdm9pZDtcbiAgICBwcm90ZWN0ZWQgb25Ib3ZlckluPyhldmVudDogR2l6bW9Nb3VzZUV2ZW50KTogdm9pZDtcbiAgICBwcm90ZWN0ZWQgb25Ib3Zlck91dD8oZXZlbnQ6IEdpem1vTW91c2VFdmVudCk6IHZvaWQ7XG4gICAgcHJvdGVjdGVkIG9uU2hvdz8oKTogdm9pZDtcbiAgICBwcm90ZWN0ZWQgb25IaWRlPygpOiB2b2lkO1xufVxuXG5leHBvcnQgZGVmYXVsdCBDb250cm9sbGVyQmFzZTtcbiJdfQ==