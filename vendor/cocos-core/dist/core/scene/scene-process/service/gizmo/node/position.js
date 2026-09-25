'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const transform_base_1 = __importDefault(require("./transform-base"));
const position_controller_1 = __importDefault(require("./position-controller"));
const origin_axis_1 = __importDefault(require("../controller/origin-axis"));
const engine_utils_1 = require("../utils/engine-utils");
const utils_1 = require("../../camera/utils");
function getService() {
    try {
        const { Service } = require('../../core/decorator');
        return Service;
    }
    catch (e) {
        return null;
    }
}
function getEditorCamera() {
    return getService()?.Camera?.getCamera?.() ?? null;
}
function repaintEngine() {
    try {
        const { Service } = require('../../core/decorator');
        Service.Engine?.repaintInEditMode?.();
    }
    catch (e) {
        // not ready
    }
}
function makeVec3InPrecision(v, p) {
    const f = Math.pow(10, p);
    v.x = Math.round(v.x * f) / f;
    v.y = Math.round(v.y * f) / f;
    v.z = Math.round(v.z * f) / f;
    return v;
}
function getCenterWorldPos3D(nodes) {
    const center = new cc_1.Vec3();
    if (nodes.length === 0)
        return center;
    for (const node of nodes) {
        const wp = node.getWorldPosition();
        center.add(wp);
    }
    center.multiplyScalar(1 / nodes.length);
    return center;
}
function matchShortcut(event, message) {
    const key = (event.key || '').toLowerCase();
    switch (message) {
        case 'vertex-snap': return key === 'v' && !event.ctrlKey && !event.shiftKey && !event.metaKey && !event.altKey;
        case 'surface-snap': return event.shiftKey && event.ctrlKey && /^(control|shift)$/i.test(key);
        default: return false;
    }
}
var SnapMode;
(function (SnapMode) {
    SnapMode[SnapMode["Undefined"] = 0] = "Undefined";
    SnapMode[SnapMode["Grid"] = 1] = "Grid";
    SnapMode[SnapMode["Surface"] = 2] = "Surface";
    SnapMode[SnapMode["Vertex"] = 3] = "Vertex";
})(SnapMode || (SnapMode = {}));
// 表面吸附过滤层级
const SURFACE_SNAP_LAYER_MAKE_EXCLUDE = cc_1.Layers.makeMaskExclude([
    cc_1.Layers.Enum.GIZMOS,
    cc_1.Layers.Enum.SCENE_GIZMO,
    cc_1.Layers.Enum.EDITOR,
    cc_1.Layers.Enum.UI_2D,
    cc_1.Layers.Enum.IGNORE_RAYCAST,
]);
// 顶点吸附过滤层
const VERTEX_SNAP_LAYER_MAKE_EXCLUDE = cc_1.Layers.makeMaskExclude([
    cc_1.Layers.Enum.GIZMOS,
    cc_1.Layers.Enum.SCENE_GIZMO,
    cc_1.Layers.Enum.EDITOR,
    cc_1.Layers.Enum.UI_2D,
    cc_1.Layers.Enum.IGNORE_RAYCAST,
]);
const TempVec3A = new cc_1.Vec3();
const TempVec3B = new cc_1.Vec3();
const TempQuatA = new cc_1.Quat();
const ArrowKeys = ['arrowleft', 'arrowright', 'arrowdown', 'arrowup'];
let _controller = null;
class PositionGizmo extends transform_base_1.default {
    disableUndo = false;
    disableSnap = false;
    _nodesWorldPosList = [];
    _snapMode = SnapMode.Undefined;
    _snapMouseDown = false;
    _mouseDown = false;
    _handler = null;
    _event = null;
    /** 顶点吸附时选中的顶点，相对于节点的位置 */
    _nodeToSnapVertex = new cc_1.Vec3(0, 0, 0);
    _gizmoMouseEventListeners = {};
    _axisController = null;
    getFirstLockNode() {
        return this.nodes.find(node => this.isNodeLocked(node));
    }
    isNodeLocked(node) {
        if (!node) {
            return false;
        }
        return node.components.some((component) => component._objFlags & cc_1.CCObject.Flags.IsPositionLocked);
    }
    init() {
        this.createController();
    }
    layer() {
        return 'foreground';
    }
    onTargetUpdate() {
        if (_controller) {
            this._controller = _controller;
            _controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
            _controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
            _controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
        }
        super.onTargetUpdate();
    }
    createAxisLine() {
        if (this._axisController)
            return;
        const camera = getEditorCamera()?.camera;
        if (!camera)
            return;
        this._axisController = new origin_axis_1.default(this.getGizmoRoot(), camera);
        this._axisController.setColor([cc_1.Color.WHITE, cc_1.Color.WHITE, cc_1.Color.WHITE]);
        this._axisController.setVisible(false, false, false);
    }
    createController() {
        if (_controller) {
            this._controller = _controller;
        }
        else {
            const posCtrl = new position_controller_1.default(this.getGizmoRoot());
            this._controller = _controller = posCtrl;
        }
        this.createAxisLine();
        this._controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
        this._controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
        this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    }
    get controller() {
        return _controller;
    }
    set controller(val) {
        _controller = val;
    }
    addMouseEventListener(listener) {
        const id = (performance.now() * 1000000).toString();
        this._gizmoMouseEventListeners[id] = listener;
        return id;
    }
    removeMouseEventListener(id) {
        if (id in this._gizmoMouseEventListeners) {
            delete this._gizmoMouseEventListeners[id];
        }
    }
    checkLock(event) {
        if (_controller) {
            const snapConfigs = _controller.transformToolData?.snapConfigs;
            const isCenter = _controller.transformToolData?.pivot === 'center';
            const isSomeNodeLocked = this.nodes.some(node => this.isNodeLocked(node));
            const isSnapping = this.isControlKeyPressed(event) || (snapConfigs?.isPositionSnapEnabled ?? false);
            _controller.isLock = isCenter || isSomeNodeLocked || isSnapping;
        }
    }
    onControllerMouseDown(event) {
        this.checkLock(event);
        this._mouseDown = true;
        if (!this.disableSnap) {
            utils_1.CameraUtils.showSnapTip();
            if (this._snapMode === SnapMode.Surface || this._snapMode === SnapMode.Vertex) {
                this._snapMouseDown = true;
            }
        }
        this._nodesWorldPosList.length = 0;
        const nodes = this.nodes;
        for (let i = 0; i < nodes.length; ++i) {
            this._nodesWorldPosList.push(nodes[i].getWorldPosition());
        }
        this.axisControllerHandlerMouseDown(event);
        Object.values(this._gizmoMouseEventListeners).forEach(listener => listener.onControllerMouseDown?.(event));
    }
    onControllerMouseMove(event) {
        this.checkLock(event);
        // 顶点吸附鼠标没点击时要修改顶点位置
        this.updateDataFromController(event);
        this.onVertexSnapMove(event);
        this.axisControllerHandlerMouseMove();
        Object.values(this._gizmoMouseEventListeners).forEach(listener => listener.onControllerMouseMove?.(event));
    }
    onControllerMouseUp(_event) {
        if (!this.disableSnap) {
            utils_1.CameraUtils.hideSnapTip();
            this._snapMouseDown = false;
        }
        this._mouseDown = false;
        if (_controller && _controller.updated && !this.disableUndo) {
            this.onControlEnd('position');
        }
        // 任何一个节点都没被锁才恢复位置
        if (this.nodes.every(node => !this.isNodeLocked(node))) {
            this.updateControllerTransform();
        }
        if (this._handler) {
            clearTimeout(this._handler);
            this._handler = null;
        }
        this.axisControllerHandlerMouseUp();
        Object.values(this._gizmoMouseEventListeners).forEach(listener => listener.onControllerMouseUp?.(_event));
    }
    onKeyDown(event) {
        // 没有选中节点
        if (!this.nodes.length) {
            return;
        }
        // 处理上下左右事件
        if (!this.onArrowDown(event)
            || !this.onSurfaceSnapDown(event)
            || !this.onVertexSnapDown(event)) {
            return false;
        }
        return super.onKeyDown(event);
    }
    onKeyUp(event) {
        if (!this.nodes.length) {
            return true;
        }
        if (!this.onArrowUp(event)) {
            return false;
        }
        if (!this.onSurfaceSnapUp(event)) {
            return false;
        }
        if (!this.onVertexSnapUp(event)) {
            return false;
        }
        return super.onKeyUp(event);
    }
    applySnapIncrement(out, snapStep, controllerName) {
        out ??= new cc_1.Vec3();
        if (!_controller)
            return out;
        if (position_controller_1.default.isPlane(controllerName) || position_controller_1.default.isXYZ(controllerName)) {
            const result = new cc_1.Vec3();
            for (const key of controllerName) {
                if (position_controller_1.default.isXYZ(key)) {
                    /** 某一轴向上的偏移值 */
                    const localDelta = _controller.getDeltaPositionOfAxis(new cc_1.Vec3(), key);
                    result.add(this.applySnapIncrementForAxis(localDelta, localDelta, snapStep, key));
                }
            }
            out.set(result);
        }
        return out;
    }
    /** 获取某一轴向应用了单位捕捉增量的值 */
    applySnapIncrementForAxis(out, deltaPosOfAxis, snapStep, axis) {
        out ??= new cc_1.Vec3();
        const length = deltaPosOfAxis.length();
        cc_1.Vec3.normalize(out, deltaPosOfAxis).multiplyScalar(this.getSnappedValue(length, snapStep[axis]));
        return out;
    }
    updateDataFromController(event) {
        if (!_controller || !_controller.updated)
            return;
        if (!this.disableUndo) {
            this.onControlUpdate('position');
        }
        this._event = event;
        let forceUpdateControllerTransform = this._mouseDown && _controller.transformToolData?.pivot === 'center';
        if (!this._handler) {
            // 减少触发次数，避免多三角型的吸附非常卡顿
            this._handler = setTimeout(() => {
                if (!_controller)
                    return;
                const deltaPos = _controller.getDeltaPosition();
                const nodes = this.nodes;
                const curNodePos = TempVec3A;
                // grid snap / surface snap / vertex snap
                this.updateSnapPosition(deltaPos, this._event);
                const isZero = deltaPos.equals(cc_1.Vec3.ZERO);
                const isVertexOrSurfaceSnapping = this._snapMode === SnapMode.Surface || this._snapMode === SnapMode.Vertex;
                if (!(isVertexOrSurfaceSnapping && isZero)) {
                    for (let i = 0; i < this._nodesWorldPosList.length; ++i) {
                        const node = nodes[i];
                        curNodePos.set(this._nodesWorldPosList[i]);
                        curNodePos.add(deltaPos);
                        node.setWorldPosition(curNodePos);
                        TempVec3B.set(node.position);
                        makeVec3InPrecision(TempVec3B, 3);
                        node.position = TempVec3B;
                    }
                    forceUpdateControllerTransform = true;
                }
                if (forceUpdateControllerTransform) {
                    this.updateControllerTransform(true);
                }
                this._handler = null;
            }, 16);
        }
        if (forceUpdateControllerTransform) {
            this.updateControllerTransform(true);
        }
    }
    updateControllerTransform(force) {
        if (!_controller)
            return;
        const node = this.getFirstLockNode() ?? this.nodes[0];
        if (!node || !force && (this._mouseDown && !this._snapMouseDown)) {
            return;
        }
        let worldPos;
        const worldRot = TempQuatA;
        cc_1.Quat.identity(worldRot);
        if (_controller.transformToolData?.pivot === 'center') {
            worldPos = getCenterWorldPos3D(this.nodes);
        }
        else {
            worldPos = node.getWorldPosition();
        }
        // 避免顶点吸附移动时，gizmo的位置被还原
        if (this._snapMouseDown) {
            worldPos.add(this._nodeToSnapVertex);
        }
        if (_controller.transformToolData?.coordinate !== 'global') {
            node.getWorldRotation(worldRot);
        }
        _controller.setPosition(worldPos);
        _controller.setRotation(worldRot);
    }
    // ── Arrow key handling ─────────────────────────────────────────────────────
    /**
     * 处理上下左右按键移动
     */
    onArrowDown(event) {
        const keyCode = (event.key || '').toLowerCase();
        if (!ArrowKeys.includes(keyCode)) {
            return true;
        }
        const offset = event.shiftKey ? 10 : 1;
        const dif = new cc_1.Vec3();
        if (keyCode === 'arrowleft') {
            dif.x = -offset;
        }
        else if (keyCode === 'arrowright') {
            dif.x = offset;
        }
        else if (keyCode === 'arrowup') {
            dif.y = offset;
        }
        else if (keyCode === 'arrowdown') {
            dif.y = -offset;
        }
        !this.disableUndo && this.onControlUpdate('position');
        const curPos = new cc_1.Vec3();
        this.nodes.forEach((node) => {
            node.getPosition(curPos);
            curPos.add(dif);
            node.setPosition(curPos.x, curPos.y, curPos.z);
        });
        repaintEngine();
        return false;
    }
    onArrowUp(event) {
        const keyCode = (event.key || '').toLowerCase();
        if (!ArrowKeys.includes(keyCode)) {
            return true;
        }
        !this.disableUndo && this.onControlEnd('position');
        return false;
    }
    // ── Surface snap ───────────────────────────────────────────────────────────
    // 进入 surface snap 模式
    onSurfaceSnapDown(event) {
        if (this.disableSnap) {
            return true;
        }
        if (matchShortcut(event, 'surface-snap')) {
            this._snapMode = SnapMode.Surface;
            this.updateSnapUI(true);
            return false;
        }
        return true;
    }
    onSurfaceSnapUp(event) {
        if (this.disableSnap) {
            return true;
        }
        if (matchShortcut(event, 'surface-snap') || this._snapMode === SnapMode.Surface) {
            this._snapMode = SnapMode.Undefined;
            this.updateSnapUI(false);
            return false;
        }
        return true;
    }
    // ── Vertex snap ────────────────────────────────────────────────────────────
    // 进入vertex snap模式
    onVertexSnapDown(event) {
        if (this.disableSnap) {
            return true;
        }
        if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) {
            if (this._snapMode === SnapMode.Vertex) {
                this._snapMode = SnapMode.Undefined;
                this.updateSnapUI(false);
            }
            return true;
        }
        if (matchShortcut(event, 'vertex-snap')) {
            this._snapMode = SnapMode.Vertex;
            this.updateSnapUI(true);
            return false;
        }
        return true;
    }
    onVertexSnapUp(event) {
        if (this.disableSnap) {
            return true;
        }
        if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey)
            return true;
        if (matchShortcut(event, 'vertex-snap')) {
            this._snapMode = SnapMode.Undefined;
            this.updateSnapUI(false);
            return false;
        }
        return true;
    }
    updateSnapUI(isSnapping) {
        if (!isSnapping) {
            this._nodeToSnapVertex.set(0, 0, 0);
            // 还原gizmo位置
            if (!(this._mouseDown && !this._snapMouseDown)) {
                this.updateControllerTransform();
            }
        }
        _controller?.updateSnapUI?.(isSnapping);
        repaintEngine();
    }
    // 顶点吸附的特殊情况，没点击时要接收到移动事件
    onVertexSnapMove(event) {
        if (this.disableSnap) {
            return true;
        }
        if (!this._snapMouseDown) {
            if (this._snapMode === SnapMode.Vertex || this._snapMode === SnapMode.Surface) {
                this.updateVertexPos(event);
                return false;
            }
        }
        return;
    }
    /**
     * 顶点吸附模式下，左键没按下时，鼠标移动可以修改想要拖动的顶点
     */
    updateVertexPos(event) {
        const node = this.nodes[0];
        if (!node)
            return;
        const camera = getEditorCamera();
        const vertexs = (0, engine_utils_1.getMeshVertexAroundMouse)(node, camera, event.x, event.y, 30);
        if (vertexs.length > 0) {
            const t = vertexs[0];
            const scaleAndRotationMatrix = node.getWorldRS();
            this._nodeToSnapVertex = new cc_1.Vec3(t.x, t.y, t.z).transformMat4(scaleAndRotationMatrix);
            const worldMatrix = node.getWorldMatrix();
            const newPos = new cc_1.Vec3();
            cc_1.Vec3.transformMat4(newPos, new cc_1.Vec3(t.x, t.y, t.z), worldMatrix);
            this.setGizmoPosition(newPos);
        }
    }
    /**
     * 修改gizmo的位置
     */
    setGizmoPosition(pos) {
        _controller?.shape?.setPosition(pos);
        repaintEngine();
    }
    /**
     * 计算吸附到目标点需要的delta
     */
    calculateDeltaPos(out, snapWorldPos) {
        if (!this._nodesWorldPosList[0])
            return;
        const worldPos = snapWorldPos.clone();
        const selectedPos = this._nodesWorldPosList[0];
        out.set(worldPos.subtract(this._nodeToSnapVertex).subtract(selectedPos));
    }
    /**
     * 获取非target中的节点(吸附时需要排除自身)
     */
    getNodeExcludeTarget(resultNodes) {
        if (!resultNodes) {
            return null;
        }
        let result = null;
        for (let index = 0; index < resultNodes.length; index++) {
            result = resultNodes[index];
            let node = null;
            if (cc_1.Node.isNode(result)) {
                node = result;
            }
            else if (result.node) {
                node = result.node;
            }
            else if (result.collider) {
                node = result.collider.node;
            }
            if (node && !this.nodes.includes(node)) {
                break;
            }
            else {
                result = null;
            }
        }
        return result;
    }
    /**
     * 计算吸附模式下的实际偏移值
     */
    updateSnapPosition(pos, event) {
        if (this.disableSnap || !_controller) {
            return;
        }
        if (this._snapMode === SnapMode.Surface) {
            pos.set(0, 0, 0);
            if (!this._snapMouseDown) {
                return;
            }
            const camera = getEditorCamera();
            // 优先吸附到collider
            const colliderResults = (0, engine_utils_1.raycastAllColliders)(camera, event.x, event.y);
            const colliderHit = this.getNodeExcludeTarget(colliderResults);
            if (colliderHit && colliderHit.hitPoint) {
                this.calculateDeltaPos(pos, colliderHit.hitPoint);
            }
            else {
                // 当没有collider时，吸附到mesh
                const meshResults = (0, engine_utils_1.getRaycastResultsForSnap)(camera, event.x, event.y, SURFACE_SNAP_LAYER_MAKE_EXCLUDE);
                const meshHit = this.getNodeExcludeTarget(meshResults);
                if (meshHit) {
                    const hitPoint = meshHit.hitPoint;
                    this.calculateDeltaPos(pos, hitPoint);
                }
            }
        }
        else if (this._snapMode === SnapMode.Vertex) {
            pos.set(0, 0, 0);
            if (!this._snapMouseDown) {
                return;
            }
            const camera = getEditorCamera();
            const meshResults = (0, engine_utils_1.getRaycastResultsForSnap)(camera, event.x, event.y, VERTEX_SNAP_LAYER_MAKE_EXCLUDE);
            const meshHit = this.getNodeExcludeTarget(meshResults);
            if (meshHit) {
                // 遍历鼠标选中模型的所有顶点，找到最近的顶点吸附过去
                const hitNode = meshHit.node;
                const vertexs = (0, engine_utils_1.getMeshVertexAroundMouse)(hitNode, camera, event.x, event.y, 100);
                if (vertexs.length > 0) {
                    const t = vertexs[0];
                    const worldMatrix = hitNode.getWorldMatrix();
                    const snapTargetWorldPos = new cc_1.Vec3();
                    cc_1.Vec3.transformMat4(snapTargetWorldPos, new cc_1.Vec3(t.x, t.y, t.z), worldMatrix);
                    this.calculateDeltaPos(pos, snapTargetWorldPos);
                }
            }
        }
        else {
            // grid mode
            const snapConfigs = _controller.transformToolData?.snapConfigs;
            if (!snapConfigs)
                return;
            if (this.isControlKeyPressed(event) || snapConfigs.isPositionSnapEnabled) {
                this.applySnapIncrement(pos, snapConfigs.position, event.handleName);
                this.updateControllerTransform(true);
            }
        }
    }
    // ── Axis guidelines ────────────────────────────────────────────────────────
    /**
     * 在 3D 视图中显示根据你拖动的 x y z 显示对应的轴线
     */
    axisControllerHandlerMouseDown(event) {
        const svc = getService();
        const is2D = svc?.Gizmo?.transformToolData?.is2D;
        const toolsVisible = svc?.Gizmo?.queryToolsVisibility3d?.() ?? true;
        if (is2D || !toolsVisible || !this._axisController)
            return;
        const node = this.nodes[0];
        if (!node)
            return;
        const visible = [false, false, false];
        switch (event.handleName) {
            case 'xy':
                visible[0] = true;
                visible[1] = true;
                break;
            case 'yz':
                visible[1] = true;
                visible[2] = true;
                break;
            case 'xz':
                visible[0] = true;
                visible[2] = true;
                break;
            default: {
                const idx = ['x', 'y', 'z'].indexOf(event.handleName);
                if (idx !== -1) {
                    visible[idx] = true;
                }
                break;
            }
        }
        this._axisController.setVisible(visible[0], visible[1], visible[2]);
        this._axisController.updateTransform(node);
    }
    /**
     * 更新轴线的坐标
     */
    axisControllerHandlerMouseMove() {
        const svc = getService();
        const is2D = svc?.Gizmo?.transformToolData?.is2D;
        const toolsVisible = svc?.Gizmo?.queryToolsVisibility3d?.() ?? true;
        if (is2D || !toolsVisible || !this._axisController)
            return;
        const node = this.nodes[0];
        if (!node)
            return;
        this._axisController.updateTransform(node);
    }
    /**
     * 隐藏轴线
     */
    axisControllerHandlerMouseUp() {
        const svc = getService();
        const is2D = svc?.Gizmo?.transformToolData?.is2D;
        const toolsVisible = svc?.Gizmo?.queryToolsVisibility3d?.() ?? true;
        if (is2D || !toolsVisible || !this._axisController)
            return;
        this._axisController.setVisible(false, false, false);
    }
}
exports.default = PositionGizmo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vbm9kZS9wb3NpdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7O0FBRWIsMkJBQWdGO0FBRWhGLHNFQUFrRDtBQUNsRCxnRkFBdUQ7QUFDdkQsNEVBQTZEO0FBQzdELHdEQUkrQjtBQUMvQiw4Q0FBaUQ7QUFFakQsU0FBUyxVQUFVO0lBQ2YsSUFBSSxDQUFDO1FBQ0QsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLGVBQWU7SUFDcEIsT0FBTyxVQUFVLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsSUFBSSxJQUFJLENBQUM7QUFDdkQsQ0FBQztBQUVELFNBQVMsYUFBYTtJQUNsQixJQUFJLENBQUM7UUFDRCxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDcEQsT0FBTyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxZQUFZO0lBQ2hCLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxDQUFPLEVBQUUsQ0FBUztJQUMzQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxQixDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxD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QyxlQUFlO1lBQUUsT0FBTztRQUUzRCxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FDSjtBQUVELGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQ0NPYmplY3QsIENvbG9yLCBJVmVjM0xpa2UsIExheWVycywgTm9kZSwgUXVhdCwgVmVjMywgVmVjNCB9IGZyb20gJ2NjJztcbmltcG9ydCB0eXBlIHsgR2l6bW9Nb3VzZUV2ZW50IH0gZnJvbSAnLi4vdXRpbHMvZGVmaW5lcyc7XG5pbXBvcnQgVHJhbnNmb3JtQmFzZUdpem1vIGZyb20gJy4vdHJhbnNmb3JtLWJhc2UnO1xuaW1wb3J0IFBvc2l0aW9uQ29udHJvbGxlciBmcm9tICcuL3Bvc2l0aW9uLWNvbnRyb2xsZXInO1xuaW1wb3J0IE9yaWdpbkF4aXNDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXIvb3JpZ2luLWF4aXMnO1xuaW1wb3J0IHtcbiAgICBnZXRSYXljYXN0UmVzdWx0c0ZvclNuYXAsXG4gICAgcmF5Y2FzdEFsbENvbGxpZGVycyxcbiAgICBnZXRNZXNoVmVydGV4QXJvdW5kTW91c2UsXG59IGZyb20gJy4uL3V0aWxzL2VuZ2luZS11dGlscyc7XG5pbXBvcnQgeyBDYW1lcmFVdGlscyB9IGZyb20gJy4uLy4uL2NhbWVyYS91dGlscyc7XG5cbmZ1bmN0aW9uIGdldFNlcnZpY2UoKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgIHJldHVybiBTZXJ2aWNlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRFZGl0b3JDYW1lcmEoKTogYW55IHtcbiAgICByZXR1cm4gZ2V0U2VydmljZSgpPy5DYW1lcmE/LmdldENhbWVyYT8uKCkgPz8gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVwYWludEVuZ2luZSgpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBub3QgcmVhZHlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VWZWMzSW5QcmVjaXNpb24odjogVmVjMywgcDogbnVtYmVyKTogVmVjMyB7XG4gICAgY29uc3QgZiA9IE1hdGgucG93KDEwLCBwKTtcbiAgICB2LnggPSBNYXRoLnJvdW5kKHYueCAqIGYpIC8gZjtcbiAgICB2LnkgPSBNYXRoLnJvdW5kKHYueSAqIGYpIC8gZjtcbiAgICB2LnogPSBNYXRoLnJvdW5kKHYueiAqIGYpIC8gZjtcbiAgICByZXR1cm4gdjtcbn1cblxuZnVuY3Rpb24gZ2V0Q2VudGVyV29ybGRQb3MzRChub2RlczogTm9kZVtdKTogVmVjMyB7XG4gICAgY29uc3QgY2VudGVyID0gbmV3IFZlYzMoKTtcbiAgICBpZiAobm9kZXMubGVuZ3RoID09PSAwKSByZXR1cm4gY2VudGVyO1xuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgICBjb25zdCB3cCA9IG5vZGUuZ2V0V29ybGRQb3NpdGlvbigpO1xuICAgICAgICBjZW50ZXIuYWRkKHdwKTtcbiAgICB9XG4gICAgY2VudGVyLm11bHRpcGx5U2NhbGFyKDEgLyBub2Rlcy5sZW5ndGgpO1xuICAgIHJldHVybiBjZW50ZXI7XG59XG5cbmZ1bmN0aW9uIG1hdGNoU2hvcnRjdXQoZXZlbnQ6IGFueSwgbWVzc2FnZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3Qga2V5ID0gKGV2ZW50LmtleSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICBzd2l0Y2ggKG1lc3NhZ2UpIHtcbiAgICAgICAgY2FzZSAndmVydGV4LXNuYXAnOiByZXR1cm4ga2V5ID09PSAndicgJiYgIWV2ZW50LmN0cmxLZXkgJiYgIWV2ZW50LnNoaWZ0S2V5ICYmICFldmVudC5tZXRhS2V5ICYmICFldmVudC5hbHRLZXk7XG4gICAgICAgIGNhc2UgJ3N1cmZhY2Utc25hcCc6IHJldHVybiBldmVudC5zaGlmdEtleSAmJiBldmVudC5jdHJsS2V5ICYmIC9eKGNvbnRyb2x8c2hpZnQpJC9pLnRlc3Qoa2V5KTtcbiAgICAgICAgZGVmYXVsdDogcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZW51bSBTbmFwTW9kZSB7XG4gICAgVW5kZWZpbmVkID0gMCxcbiAgICBHcmlkID0gMSxcbiAgICBTdXJmYWNlID0gMixcbiAgICBWZXJ0ZXggPSAzLFxufVxuXG4vLyDooajpnaLlkLjpmYTov4fmu6TlsYLnuqdcbmNvbnN0IFNVUkZBQ0VfU05BUF9MQVlFUl9NQUtFX0VYQ0xVREUgPSBMYXllcnMubWFrZU1hc2tFeGNsdWRlKFtcbiAgICBMYXllcnMuRW51bS5HSVpNT1MsXG4gICAgTGF5ZXJzLkVudW0uU0NFTkVfR0laTU8sXG4gICAgTGF5ZXJzLkVudW0uRURJVE9SLFxuICAgIExheWVycy5FbnVtLlVJXzJELFxuICAgIExheWVycy5FbnVtLklHTk9SRV9SQVlDQVNULFxuXSk7XG5cbi8vIOmhtueCueWQuOmZhOi/h+a7pOWxglxuY29uc3QgVkVSVEVYX1NOQVBfTEFZRVJfTUFLRV9FWENMVURFID0gTGF5ZXJzLm1ha2VNYXNrRXhjbHVkZShbXG4gICAgTGF5ZXJzLkVudW0uR0laTU9TLFxuICAgIExheWVycy5FbnVtLlNDRU5FX0dJWk1PLFxuICAgIExheWVycy5FbnVtLkVESVRPUixcbiAgICBMYXllcnMuRW51bS5VSV8yRCxcbiAgICBMYXllcnMuRW51bS5JR05PUkVfUkFZQ0FTVCxcbl0pO1xuXG5jb25zdCBUZW1wVmVjM0EgPSBuZXcgVmVjMygpO1xuY29uc3QgVGVtcFZlYzNCID0gbmV3IFZlYzMoKTtcbmNvbnN0IFRlbXBRdWF0QSA9IG5ldyBRdWF0KCk7XG5cbmNvbnN0IEFycm93S2V5cyA9IFsnYXJyb3dsZWZ0JywgJ2Fycm93cmlnaHQnLCAnYXJyb3dkb3duJywgJ2Fycm93dXAnXTtcblxubGV0IF9jb250cm9sbGVyOiBQb3NpdGlvbkNvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuY2xhc3MgUG9zaXRpb25HaXptbyBleHRlbmRzIFRyYW5zZm9ybUJhc2VHaXptbyB7XG4gICAgcHVibGljIGRpc2FibGVVbmRvID0gZmFsc2U7XG4gICAgcHVibGljIGRpc2FibGVTbmFwID0gZmFsc2U7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfbm9kZXNXb3JsZFBvc0xpc3Q6IFZlYzNbXSA9IFtdO1xuICAgIHByaXZhdGUgX3NuYXBNb2RlOiBTbmFwTW9kZSA9IFNuYXBNb2RlLlVuZGVmaW5lZDtcbiAgICBwcml2YXRlIF9zbmFwTW91c2VEb3duID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfbW91c2VEb3duID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfaGFuZGxlcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9ldmVudDogR2l6bW9Nb3VzZUV2ZW50IHwgbnVsbCA9IG51bGw7XG4gICAgLyoqIOmhtueCueWQuOmZhOaXtumAieS4reeahOmhtueCue+8jOebuOWvueS6juiKgueCueeahOS9jee9riAqL1xuICAgIHByaXZhdGUgX25vZGVUb1NuYXBWZXJ0ZXg6IFZlYzMgPSBuZXcgVmVjMygwLCAwLCAwKTtcbiAgICBwcml2YXRlIF9naXptb01vdXNlRXZlbnRMaXN0ZW5lcnM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fTtcbiAgICBwcml2YXRlIF9heGlzQ29udHJvbGxlcjogT3JpZ2luQXhpc0NvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuICAgIGdldEZpcnN0TG9ja05vZGUoKTogTm9kZSB8IHVuZGVmaW5lZCB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVzLmZpbmQobm9kZSA9PiB0aGlzLmlzTm9kZUxvY2tlZChub2RlKSk7XG4gICAgfVxuXG4gICAgaXNOb2RlTG9ja2VkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGUuY29tcG9uZW50cy5zb21lKChjb21wb25lbnQ6IGFueSkgPT4gY29tcG9uZW50Ll9vYmpGbGFncyAmIENDT2JqZWN0LkZsYWdzLklzUG9zaXRpb25Mb2NrZWQpO1xuICAgIH1cblxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIGxheWVyKCkge1xuICAgICAgICByZXR1cm4gJ2ZvcmVncm91bmQnO1xuICAgIH1cblxuICAgIG9uVGFyZ2V0VXBkYXRlKCkge1xuICAgICAgICBpZiAoX2NvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIgPSBfY29udHJvbGxlcjtcbiAgICAgICAgICAgIF9jb250cm9sbGVyLm9uQ29udHJvbGxlck1vdXNlRG93biA9IHRoaXMub25Db250cm9sbGVyTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgICAgICAgICBfY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZU1vdmUgPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgX2NvbnRyb2xsZXIub25Db250cm9sbGVyTW91c2VVcCA9IHRoaXMub25Db250cm9sbGVyTW91c2VVcC5iaW5kKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLm9uVGFyZ2V0VXBkYXRlKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlQXhpc0xpbmUoKSB7XG4gICAgICAgIGlmICh0aGlzLl9heGlzQ29udHJvbGxlcikgcmV0dXJuO1xuICAgICAgICBjb25zdCBjYW1lcmEgPSBnZXRFZGl0b3JDYW1lcmEoKT8uY2FtZXJhO1xuICAgICAgICBpZiAoIWNhbWVyYSkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9heGlzQ29udHJvbGxlciA9IG5ldyBPcmlnaW5BeGlzQ29udHJvbGxlcih0aGlzLmdldEdpem1vUm9vdCgpLCBjYW1lcmEpO1xuICAgICAgICB0aGlzLl9heGlzQ29udHJvbGxlci5zZXRDb2xvcihbQ29sb3IuV0hJVEUsIENvbG9yLldISVRFLCBDb2xvci5XSElURV0pO1xuICAgICAgICB0aGlzLl9heGlzQ29udHJvbGxlci5zZXRWaXNpYmxlKGZhbHNlLCBmYWxzZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGNyZWF0ZUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIGlmIChfY29udHJvbGxlcikge1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IF9jb250cm9sbGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcG9zQ3RybCA9IG5ldyBQb3NpdGlvbkNvbnRyb2xsZXIodGhpcy5nZXRHaXptb1Jvb3QoKSk7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyID0gX2NvbnRyb2xsZXIgPSBwb3NDdHJsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3JlYXRlQXhpc0xpbmUoKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZURvd24gPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlRG93bi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLm9uQ29udHJvbGxlck1vdXNlTW92ZSA9IHRoaXMub25Db250cm9sbGVyTW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIub25Db250cm9sbGVyTW91c2VVcCA9IHRoaXMub25Db250cm9sbGVyTW91c2VVcC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGdldCBjb250cm9sbGVyKCkge1xuICAgICAgICByZXR1cm4gX2NvbnRyb2xsZXI7XG4gICAgfVxuXG4gICAgc2V0IGNvbnRyb2xsZXIodmFsOiBQb3NpdGlvbkNvbnRyb2xsZXIgfCBudWxsKSB7XG4gICAgICAgIF9jb250cm9sbGVyID0gdmFsO1xuICAgIH1cblxuICAgIGFkZE1vdXNlRXZlbnRMaXN0ZW5lcihsaXN0ZW5lcjogYW55KTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgaWQgPSAocGVyZm9ybWFuY2Uubm93KCkgKiAxMDAwMDAwKS50b1N0cmluZygpO1xuICAgICAgICB0aGlzLl9naXptb01vdXNlRXZlbnRMaXN0ZW5lcnNbaWRdID0gbGlzdGVuZXI7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICByZW1vdmVNb3VzZUV2ZW50TGlzdGVuZXIoaWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoaWQgaW4gdGhpcy5fZ2l6bW9Nb3VzZUV2ZW50TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZ2l6bW9Nb3VzZUV2ZW50TGlzdGVuZXJzW2lkXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoZWNrTG9jayhldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmIChfY29udHJvbGxlcikge1xuICAgICAgICAgICAgY29uc3Qgc25hcENvbmZpZ3MgPSBfY29udHJvbGxlci50cmFuc2Zvcm1Ub29sRGF0YT8uc25hcENvbmZpZ3M7XG4gICAgICAgICAgICBjb25zdCBpc0NlbnRlciA9IF9jb250cm9sbGVyLnRyYW5zZm9ybVRvb2xEYXRhPy5waXZvdCA9PT0gJ2NlbnRlcic7XG4gICAgICAgICAgICBjb25zdCBpc1NvbWVOb2RlTG9ja2VkID0gdGhpcy5ub2Rlcy5zb21lKG5vZGUgPT4gdGhpcy5pc05vZGVMb2NrZWQobm9kZSkpO1xuICAgICAgICAgICAgY29uc3QgaXNTbmFwcGluZyA9IHRoaXMuaXNDb250cm9sS2V5UHJlc3NlZChldmVudCkgfHwgKHNuYXBDb25maWdzPy5pc1Bvc2l0aW9uU25hcEVuYWJsZWQgPz8gZmFsc2UpO1xuICAgICAgICAgICAgX2NvbnRyb2xsZXIuaXNMb2NrID0gaXNDZW50ZXIgfHwgaXNTb21lTm9kZUxvY2tlZCB8fCBpc1NuYXBwaW5nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Db250cm9sbGVyTW91c2VEb3duKGV2ZW50OiBHaXptb01vdXNlRXZlbnQpIHtcbiAgICAgICAgdGhpcy5jaGVja0xvY2soZXZlbnQpO1xuICAgICAgICB0aGlzLl9tb3VzZURvd24gPSB0cnVlO1xuXG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlU25hcCkge1xuICAgICAgICAgICAgQ2FtZXJhVXRpbHMuc2hvd1NuYXBUaXAoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zbmFwTW9kZSA9PT0gU25hcE1vZGUuU3VyZmFjZSB8fCB0aGlzLl9zbmFwTW9kZSA9PT0gU25hcE1vZGUuVmVydGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc25hcE1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9ub2Rlc1dvcmxkUG9zTGlzdC5sZW5ndGggPSAwO1xuICAgICAgICBjb25zdCBub2RlcyA9IHRoaXMubm9kZXM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzV29ybGRQb3NMaXN0LnB1c2gobm9kZXNbaV0uZ2V0V29ybGRQb3NpdGlvbigpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYXhpc0NvbnRyb2xsZXJIYW5kbGVyTW91c2VEb3duKGV2ZW50KTtcbiAgICAgICAgT2JqZWN0LnZhbHVlcyh0aGlzLl9naXptb01vdXNlRXZlbnRMaXN0ZW5lcnMpLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIub25Db250cm9sbGVyTW91c2VEb3duPy4oZXZlbnQpKTtcbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZU1vdmUoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICB0aGlzLmNoZWNrTG9jayhldmVudCk7XG4gICAgICAgIC8vIOmhtueCueWQuOmZhOm8oOagh+ayoeeCueWHu+aXtuimgeS/ruaUuemhtueCueS9jee9rlxuICAgICAgICB0aGlzLnVwZGF0ZURhdGFGcm9tQ29udHJvbGxlcihldmVudCk7XG4gICAgICAgIHRoaXMub25WZXJ0ZXhTbmFwTW92ZShldmVudCk7XG4gICAgICAgIHRoaXMuYXhpc0NvbnRyb2xsZXJIYW5kbGVyTW91c2VNb3ZlKCk7XG5cbiAgICAgICAgT2JqZWN0LnZhbHVlcyh0aGlzLl9naXptb01vdXNlRXZlbnRMaXN0ZW5lcnMpLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIub25Db250cm9sbGVyTW91c2VNb3ZlPy4oZXZlbnQpKTtcbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZVVwKF9ldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlU25hcCkge1xuICAgICAgICAgICAgQ2FtZXJhVXRpbHMuaGlkZVNuYXBUaXAoKTtcbiAgICAgICAgICAgIHRoaXMuX3NuYXBNb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgaWYgKF9jb250cm9sbGVyICYmIF9jb250cm9sbGVyLnVwZGF0ZWQgJiYgIXRoaXMuZGlzYWJsZVVuZG8pIHtcbiAgICAgICAgICAgIHRoaXMub25Db250cm9sRW5kKCdwb3NpdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIOS7u+S9leS4gOS4quiKgueCuemDveayoeiiq+mUgeaJjeaBouWkjeS9jee9rlxuICAgICAgICBpZiAodGhpcy5ub2Rlcy5ldmVyeShub2RlID0+ICF0aGlzLmlzTm9kZUxvY2tlZChub2RlKSkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9oYW5kbGVyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5faGFuZGxlcik7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYXhpc0NvbnRyb2xsZXJIYW5kbGVyTW91c2VVcCgpO1xuICAgICAgICBPYmplY3QudmFsdWVzKHRoaXMuX2dpem1vTW91c2VFdmVudExpc3RlbmVycykuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lci5vbkNvbnRyb2xsZXJNb3VzZVVwPy4oX2V2ZW50KSk7XG4gICAgfVxuXG4gICAgb25LZXlEb3duKGV2ZW50OiBhbnkpOiB1bmRlZmluZWQgfCBmYWxzZSB8IHRydWUge1xuICAgICAgICAvLyDmsqHmnInpgInkuK3oioLngrlcbiAgICAgICAgaWYgKCF0aGlzLm5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOWkhOeQhuS4iuS4i+W3puWPs+S6i+S7tlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpcy5vbkFycm93RG93bihldmVudClcbiAgICAgICAgICAgIHx8ICF0aGlzLm9uU3VyZmFjZVNuYXBEb3duKGV2ZW50KVxuICAgICAgICAgICAgfHwgIXRoaXMub25WZXJ0ZXhTbmFwRG93bihldmVudClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cGVyLm9uS2V5RG93bihldmVudCkgYXMgdW5kZWZpbmVkIHwgZmFsc2UgfCB0cnVlO1xuICAgIH1cblxuICAgIG9uS2V5VXAoZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoIXRoaXMubm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMub25BcnJvd1VwKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5vblN1cmZhY2VTbmFwVXAoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm9uVmVydGV4U25hcFVwKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXBlci5vbktleVVwKGV2ZW50KSBhcyBib29sZWFuO1xuICAgIH1cblxuICAgIGFwcGx5U25hcEluY3JlbWVudChvdXQ6IFZlYzMgfCB1bmRlZmluZWQsIHNuYXBTdGVwOiBJVmVjM0xpa2UsIGNvbnRyb2xsZXJOYW1lOiBzdHJpbmcpOiBWZWMzIHtcbiAgICAgICAgb3V0ID8/PSBuZXcgVmVjMygpO1xuICAgICAgICBpZiAoIV9jb250cm9sbGVyKSByZXR1cm4gb3V0O1xuICAgICAgICBpZiAoUG9zaXRpb25Db250cm9sbGVyLmlzUGxhbmUoY29udHJvbGxlck5hbWUpIHx8IFBvc2l0aW9uQ29udHJvbGxlci5pc1hZWihjb250cm9sbGVyTmFtZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBjb250cm9sbGVyTmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChQb3NpdGlvbkNvbnRyb2xsZXIuaXNYWVooa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAvKiog5p+Q5LiA6L205ZCR5LiK55qE5YGP56e75YC8ICovXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvY2FsRGVsdGEgPSBfY29udHJvbGxlci5nZXREZWx0YVBvc2l0aW9uT2ZBeGlzKG5ldyBWZWMzKCksIGtleSBhcyAneCcgfCAneScgfCAneicpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuYWRkKHRoaXMuYXBwbHlTbmFwSW5jcmVtZW50Rm9yQXhpcyhsb2NhbERlbHRhLCBsb2NhbERlbHRhLCBzbmFwU3RlcCwga2V5IGFzICd4JyB8ICd5JyB8ICd6JykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dC5zZXQocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cblxuICAgIC8qKiDojrflj5bmn5DkuIDovbTlkJHlupTnlKjkuobljZXkvY3mjZXmjYnlop7ph4/nmoTlgLwgKi9cbiAgICBhcHBseVNuYXBJbmNyZW1lbnRGb3JBeGlzKG91dDogVmVjMyB8IHVuZGVmaW5lZCwgZGVsdGFQb3NPZkF4aXM6IFJlYWRvbmx5PFZlYzM+LCBzbmFwU3RlcDogSVZlYzNMaWtlLCBheGlzOiAneCcgfCAneScgfCAneicpOiBWZWMzIHtcbiAgICAgICAgb3V0ID8/PSBuZXcgVmVjMygpO1xuICAgICAgICBjb25zdCBsZW5ndGggPSBkZWx0YVBvc09mQXhpcy5sZW5ndGgoKTtcbiAgICAgICAgVmVjMy5ub3JtYWxpemUob3V0LCBkZWx0YVBvc09mQXhpcykubXVsdGlwbHlTY2FsYXIodGhpcy5nZXRTbmFwcGVkVmFsdWUobGVuZ3RoLCBzbmFwU3RlcFtheGlzXSkpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cblxuICAgIHVwZGF0ZURhdGFGcm9tQ29udHJvbGxlcihldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICghX2NvbnRyb2xsZXIgfHwgIV9jb250cm9sbGVyLnVwZGF0ZWQpIHJldHVybjtcblxuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVVuZG8pIHtcbiAgICAgICAgICAgIHRoaXMub25Db250cm9sVXBkYXRlKCdwb3NpdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2V2ZW50ID0gZXZlbnQ7XG4gICAgICAgIGxldCBmb3JjZVVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0gPSB0aGlzLl9tb3VzZURvd24gJiYgX2NvbnRyb2xsZXIudHJhbnNmb3JtVG9vbERhdGE/LnBpdm90ID09PSAnY2VudGVyJztcbiAgICAgICAgaWYgKCF0aGlzLl9oYW5kbGVyKSB7XG4gICAgICAgICAgICAvLyDlh4/lsJHop6blj5HmrKHmlbDvvIzpgb/lhY3lpJrkuInop5LlnovnmoTlkLjpmYTpnZ7luLjljaHpob9cbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIV9jb250cm9sbGVyKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZGVsdGFQb3MgPSBfY29udHJvbGxlci5nZXREZWx0YVBvc2l0aW9uKCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSB0aGlzLm5vZGVzO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1ck5vZGVQb3MgPSBUZW1wVmVjM0E7XG5cbiAgICAgICAgICAgICAgICAvLyBncmlkIHNuYXAgLyBzdXJmYWNlIHNuYXAgLyB2ZXJ0ZXggc25hcFxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU25hcFBvc2l0aW9uKGRlbHRhUG9zLCB0aGlzLl9ldmVudCBhcyBHaXptb01vdXNlRXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaXNaZXJvID0gZGVsdGFQb3MuZXF1YWxzKFZlYzMuWkVSTyk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNWZXJ0ZXhPclN1cmZhY2VTbmFwcGluZyA9IHRoaXMuX3NuYXBNb2RlID09PSBTbmFwTW9kZS5TdXJmYWNlIHx8IHRoaXMuX3NuYXBNb2RlID09PSBTbmFwTW9kZS5WZXJ0ZXg7XG5cbiAgICAgICAgICAgICAgICBpZiAoIShpc1ZlcnRleE9yU3VyZmFjZVNuYXBwaW5nICYmIGlzWmVybykpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9ub2Rlc1dvcmxkUG9zTGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyTm9kZVBvcy5zZXQodGhpcy5fbm9kZXNXb3JsZFBvc0xpc3RbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyTm9kZVBvcy5hZGQoZGVsdGFQb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRXb3JsZFBvc2l0aW9uKGN1ck5vZGVQb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgVGVtcFZlYzNCLnNldChub2RlLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ha2VWZWMzSW5QcmVjaXNpb24oVGVtcFZlYzNCLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucG9zaXRpb24gPSBUZW1wVmVjM0I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yY2VVcGRhdGVDb250cm9sbGVyVHJhbnNmb3JtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0odHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXIgPSBudWxsO1xuICAgICAgICAgICAgfSwgMTYpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JjZVVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSh0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUNvbnRyb2xsZXJUcmFuc2Zvcm0oZm9yY2U/OiBib29sZWFuKSB7XG4gICAgICAgIGlmICghX2NvbnRyb2xsZXIpIHJldHVybjtcbiAgICAgICAgY29uc3Qgbm9kZTogTm9kZSB8IG51bGwgfCB1bmRlZmluZWQgPSB0aGlzLmdldEZpcnN0TG9ja05vZGUoKSA/PyB0aGlzLm5vZGVzWzBdO1xuICAgICAgICBpZiAoIW5vZGUgfHwgIWZvcmNlICYmICh0aGlzLl9tb3VzZURvd24gJiYgIXRoaXMuX3NuYXBNb3VzZURvd24pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgd29ybGRQb3M6IFZlYzM7XG4gICAgICAgIGNvbnN0IHdvcmxkUm90ID0gVGVtcFF1YXRBO1xuICAgICAgICBRdWF0LmlkZW50aXR5KHdvcmxkUm90KTtcbiAgICAgICAgaWYgKF9jb250cm9sbGVyLnRyYW5zZm9ybVRvb2xEYXRhPy5waXZvdCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgIHdvcmxkUG9zID0gZ2V0Q2VudGVyV29ybGRQb3MzRCh0aGlzLm5vZGVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdvcmxkUG9zID0gbm9kZS5nZXRXb3JsZFBvc2l0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDpgb/lhY3pobbngrnlkLjpmYTnp7vliqjml7bvvIxnaXptb+eahOS9jee9ruiiq+i/mOWOn1xuICAgICAgICBpZiAodGhpcy5fc25hcE1vdXNlRG93bikge1xuICAgICAgICAgICAgd29ybGRQb3MuYWRkKHRoaXMuX25vZGVUb1NuYXBWZXJ0ZXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF9jb250cm9sbGVyLnRyYW5zZm9ybVRvb2xEYXRhPy5jb29yZGluYXRlICE9PSAnZ2xvYmFsJykge1xuICAgICAgICAgICAgbm9kZS5nZXRXb3JsZFJvdGF0aW9uKHdvcmxkUm90KTtcbiAgICAgICAgfVxuICAgICAgICBfY29udHJvbGxlci5zZXRQb3NpdGlvbih3b3JsZFBvcyk7XG4gICAgICAgIF9jb250cm9sbGVyLnNldFJvdGF0aW9uKHdvcmxkUm90KTtcbiAgICB9XG5cbiAgICAvLyDilIDilIAgQXJyb3cga2V5IGhhbmRsaW5nIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgLyoqXG4gICAgICog5aSE55CG5LiK5LiL5bem5Y+z5oyJ6ZSu56e75YqoXG4gICAgICovXG4gICAgb25BcnJvd0Rvd24oZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBrZXlDb2RlID0gKGV2ZW50LmtleSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCFBcnJvd0tleXMuaW5jbHVkZXMoa2V5Q29kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gZXZlbnQuc2hpZnRLZXkgPyAxMCA6IDE7XG5cbiAgICAgICAgY29uc3QgZGlmID0gbmV3IFZlYzMoKTtcbiAgICAgICAgaWYgKGtleUNvZGUgPT09ICdhcnJvd2xlZnQnKSB7XG4gICAgICAgICAgICBkaWYueCA9IC1vZmZzZXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gJ2Fycm93cmlnaHQnKSB7XG4gICAgICAgICAgICBkaWYueCA9IG9mZnNldDtcbiAgICAgICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSAnYXJyb3d1cCcpIHtcbiAgICAgICAgICAgIGRpZi55ID0gb2Zmc2V0O1xuICAgICAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09ICdhcnJvd2Rvd24nKSB7XG4gICAgICAgICAgICBkaWYueSA9IC1vZmZzZXQ7XG4gICAgICAgIH1cblxuICAgICAgICAhdGhpcy5kaXNhYmxlVW5kbyAmJiB0aGlzLm9uQ29udHJvbFVwZGF0ZSgncG9zaXRpb24nKTtcblxuICAgICAgICBjb25zdCBjdXJQb3MgPSBuZXcgVmVjMygpO1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goKG5vZGU6IE5vZGUpID0+IHtcbiAgICAgICAgICAgIG5vZGUuZ2V0UG9zaXRpb24oY3VyUG9zKTtcbiAgICAgICAgICAgIGN1clBvcy5hZGQoZGlmKTtcbiAgICAgICAgICAgIG5vZGUuc2V0UG9zaXRpb24oY3VyUG9zLngsIGN1clBvcy55LCBjdXJQb3Mueik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlcGFpbnRFbmdpbmUoKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIG9uQXJyb3dVcChldmVudDogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGtleUNvZGUgPSAoZXZlbnQua2V5IHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoIUFycm93S2V5cy5pbmNsdWRlcyhrZXlDb2RlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgIXRoaXMuZGlzYWJsZVVuZG8gJiYgdGhpcy5vbkNvbnRyb2xFbmQoJ3Bvc2l0aW9uJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyDilIDilIAgU3VyZmFjZSBzbmFwIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgLy8g6L+b5YWlIHN1cmZhY2Ugc25hcCDmqKHlvI9cbiAgICBvblN1cmZhY2VTbmFwRG93bihldmVudDogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVTbmFwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF0Y2hTaG9ydGN1dChldmVudCwgJ3N1cmZhY2Utc25hcCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9zbmFwTW9kZSA9IFNuYXBNb2RlLlN1cmZhY2U7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNuYXBVSSh0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBvblN1cmZhY2VTbmFwVXAoZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlU25hcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoU2hvcnRjdXQoZXZlbnQsICdzdXJmYWNlLXNuYXAnKSB8fCB0aGlzLl9zbmFwTW9kZSA9PT0gU25hcE1vZGUuU3VyZmFjZSkge1xuICAgICAgICAgICAgdGhpcy5fc25hcE1vZGUgPSBTbmFwTW9kZS5VbmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNuYXBVSShmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8g4pSA4pSAIFZlcnRleCBzbmFwIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgLy8g6L+b5YWldmVydGV4IHNuYXDmqKHlvI9cbiAgICBvblZlcnRleFNuYXBEb3duKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZVNuYXApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQubWV0YUtleSB8fCBldmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zbmFwTW9kZSA9PT0gU25hcE1vZGUuVmVydGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc25hcE1vZGUgPSBTbmFwTW9kZS5VbmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTbmFwVUkoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoU2hvcnRjdXQoZXZlbnQsICd2ZXJ0ZXgtc25hcCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9zbmFwTW9kZSA9IFNuYXBNb2RlLlZlcnRleDtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU25hcFVJKHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIG9uVmVydGV4U25hcFVwKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZVNuYXApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQubWV0YUtleSB8fCBldmVudC5hbHRLZXkpIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGlmIChtYXRjaFNob3J0Y3V0KGV2ZW50LCAndmVydGV4LXNuYXAnKSkge1xuICAgICAgICAgICAgdGhpcy5fc25hcE1vZGUgPSBTbmFwTW9kZS5VbmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNuYXBVSShmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlU25hcFVJKGlzU25hcHBpbmc6IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKCFpc1NuYXBwaW5nKSB7XG4gICAgICAgICAgICB0aGlzLl9ub2RlVG9TbmFwVmVydGV4LnNldCgwLCAwLCAwKTtcbiAgICAgICAgICAgIC8vIOi/mOWOn2dpem1v5L2N572uXG4gICAgICAgICAgICBpZiAoISh0aGlzLl9tb3VzZURvd24gJiYgIXRoaXMuX3NuYXBNb3VzZURvd24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyVHJhbnNmb3JtKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgKF9jb250cm9sbGVyIGFzIGFueSk/LnVwZGF0ZVNuYXBVST8uKGlzU25hcHBpbmcpO1xuICAgICAgICByZXBhaW50RW5naW5lKCk7XG4gICAgfVxuXG4gICAgLy8g6aG254K55ZC46ZmE55qE54m55q6K5oOF5Ya177yM5rKh54K55Ye75pe26KaB5o6l5pS25Yiw56e75Yqo5LqL5Lu2XG4gICAgb25WZXJ0ZXhTbmFwTW92ZShldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVTbmFwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fc25hcE1vdXNlRG93bikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NuYXBNb2RlID09PSBTbmFwTW9kZS5WZXJ0ZXggfHwgdGhpcy5fc25hcE1vZGUgPT09IFNuYXBNb2RlLlN1cmZhY2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVZlcnRleFBvcyhldmVudCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpobbngrnlkLjpmYTmqKHlvI/kuIvvvIzlt6bplK7msqHmjInkuIvml7bvvIzpvKDmoIfnp7vliqjlj6/ku6Xkv67mlLnmg7PopoHmi5bliqjnmoTpobbngrlcbiAgICAgKi9cbiAgICB1cGRhdGVWZXJ0ZXhQb3MoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICBjb25zdCBub2RlOiBOb2RlID0gdGhpcy5ub2Rlc1swXTtcbiAgICAgICAgaWYgKCFub2RlKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGNhbWVyYSA9IGdldEVkaXRvckNhbWVyYSgpO1xuICAgICAgICBjb25zdCB2ZXJ0ZXhzOiBWZWM0W10gPSBnZXRNZXNoVmVydGV4QXJvdW5kTW91c2Uobm9kZSwgY2FtZXJhLCBldmVudC54LCBldmVudC55LCAzMCk7XG4gICAgICAgIGlmICh2ZXJ0ZXhzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHQgPSB2ZXJ0ZXhzWzBdO1xuXG4gICAgICAgICAgICBjb25zdCBzY2FsZUFuZFJvdGF0aW9uTWF0cml4ID0gbm9kZS5nZXRXb3JsZFJTKCk7XG4gICAgICAgICAgICB0aGlzLl9ub2RlVG9TbmFwVmVydGV4ID0gbmV3IFZlYzModC54LCB0LnksIHQueikudHJhbnNmb3JtTWF0NChzY2FsZUFuZFJvdGF0aW9uTWF0cml4KTtcblxuICAgICAgICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSBub2RlLmdldFdvcmxkTWF0cml4KCk7XG4gICAgICAgICAgICBjb25zdCBuZXdQb3MgPSBuZXcgVmVjMygpO1xuICAgICAgICAgICAgVmVjMy50cmFuc2Zvcm1NYXQ0KG5ld1BvcywgbmV3IFZlYzModC54LCB0LnksIHQueiksIHdvcmxkTWF0cml4KTtcbiAgICAgICAgICAgIHRoaXMuc2V0R2l6bW9Qb3NpdGlvbihuZXdQb3MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5L+u5pS5Z2l6bW/nmoTkvY3nva5cbiAgICAgKi9cbiAgICBzZXRHaXptb1Bvc2l0aW9uKHBvczogVmVjMykge1xuICAgICAgICBfY29udHJvbGxlcj8uc2hhcGU/LnNldFBvc2l0aW9uKHBvcyk7XG4gICAgICAgIHJlcGFpbnRFbmdpbmUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDorqHnrpflkLjpmYTliLDnm67moIfngrnpnIDopoHnmoRkZWx0YVxuICAgICAqL1xuICAgIGNhbGN1bGF0ZURlbHRhUG9zKG91dDogVmVjMywgc25hcFdvcmxkUG9zOiBWZWMzKSB7XG4gICAgICAgIGlmICghdGhpcy5fbm9kZXNXb3JsZFBvc0xpc3RbMF0pIHJldHVybjtcblxuICAgICAgICBjb25zdCB3b3JsZFBvcyA9IHNuYXBXb3JsZFBvcy5jbG9uZSgpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZFBvcyA9IHRoaXMuX25vZGVzV29ybGRQb3NMaXN0WzBdO1xuICAgICAgICBvdXQuc2V0KHdvcmxkUG9zLnN1YnRyYWN0KHRoaXMuX25vZGVUb1NuYXBWZXJ0ZXgpLnN1YnRyYWN0KHNlbGVjdGVkUG9zKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W6Z2edGFyZ2V05Lit55qE6IqC54K5KOWQuOmZhOaXtumcgOimgeaOkumZpOiHqui6qylcbiAgICAgKi9cbiAgICBnZXROb2RlRXhjbHVkZVRhcmdldChyZXN1bHROb2RlczogYW55W10pOiBhbnkgfCBudWxsIHtcbiAgICAgICAgaWYgKCFyZXN1bHROb2RlcykgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgICBsZXQgcmVzdWx0ID0gbnVsbDtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJlc3VsdE5vZGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0Tm9kZXNbaW5kZXhdO1xuICAgICAgICAgICAgbGV0IG5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChOb2RlLmlzTm9kZShyZXN1bHQpKSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHJlc3VsdDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0Lm5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlID0gcmVzdWx0Lm5vZGU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5jb2xsaWRlcikge1xuICAgICAgICAgICAgICAgIG5vZGUgPSByZXN1bHQuY29sbGlkZXIubm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlICYmICF0aGlzLm5vZGVzLmluY2x1ZGVzKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDorqHnrpflkLjpmYTmqKHlvI/kuIvnmoTlrp7pmYXlgY/np7vlgLxcbiAgICAgKi9cbiAgICB1cGRhdGVTbmFwUG9zaXRpb24ocG9zOiBWZWMzLCBldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVTbmFwIHx8ICFfY29udHJvbGxlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3NuYXBNb2RlID09PSBTbmFwTW9kZS5TdXJmYWNlKSB7XG4gICAgICAgICAgICBwb3Muc2V0KDAsIDAsIDApO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zbmFwTW91c2VEb3duKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICBjb25zdCBjYW1lcmEgPSBnZXRFZGl0b3JDYW1lcmEoKTtcbiAgICAgICAgICAgIC8vIOS8mOWFiOWQuOmZhOWIsGNvbGxpZGVyXG4gICAgICAgICAgICBjb25zdCBjb2xsaWRlclJlc3VsdHMgPSByYXljYXN0QWxsQ29sbGlkZXJzKGNhbWVyYSwgZXZlbnQueCwgZXZlbnQueSk7XG4gICAgICAgICAgICBjb25zdCBjb2xsaWRlckhpdCA9IHRoaXMuZ2V0Tm9kZUV4Y2x1ZGVUYXJnZXQoY29sbGlkZXJSZXN1bHRzKTtcbiAgICAgICAgICAgIGlmIChjb2xsaWRlckhpdCAmJiBjb2xsaWRlckhpdC5oaXRQb2ludCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlRGVsdGFQb3MocG9zLCBjb2xsaWRlckhpdC5oaXRQb2ludCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOW9k+ayoeaciWNvbGxpZGVy5pe277yM5ZC46ZmE5YiwbWVzaFxuICAgICAgICAgICAgICAgIGNvbnN0IG1lc2hSZXN1bHRzID0gZ2V0UmF5Y2FzdFJlc3VsdHNGb3JTbmFwKFxuICAgICAgICAgICAgICAgICAgICBjYW1lcmEsIGV2ZW50LngsIGV2ZW50LnksXG4gICAgICAgICAgICAgICAgICAgIFNVUkZBQ0VfU05BUF9MQVlFUl9NQUtFX0VYQ0xVREUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXNoSGl0ID0gdGhpcy5nZXROb2RlRXhjbHVkZVRhcmdldChtZXNoUmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgaWYgKG1lc2hIaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGl0UG9pbnQgPSBtZXNoSGl0LmhpdFBvaW50O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZURlbHRhUG9zKHBvcywgaGl0UG9pbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9zbmFwTW9kZSA9PT0gU25hcE1vZGUuVmVydGV4KSB7XG4gICAgICAgICAgICBwb3Muc2V0KDAsIDAsIDApO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zbmFwTW91c2VEb3duKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICBjb25zdCBjYW1lcmEgPSBnZXRFZGl0b3JDYW1lcmEoKTtcbiAgICAgICAgICAgIGNvbnN0IG1lc2hSZXN1bHRzID0gZ2V0UmF5Y2FzdFJlc3VsdHNGb3JTbmFwKFxuICAgICAgICAgICAgICAgIGNhbWVyYSwgZXZlbnQueCwgZXZlbnQueSxcbiAgICAgICAgICAgICAgICBWRVJURVhfU05BUF9MQVlFUl9NQUtFX0VYQ0xVREUsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgbWVzaEhpdCA9IHRoaXMuZ2V0Tm9kZUV4Y2x1ZGVUYXJnZXQobWVzaFJlc3VsdHMpO1xuICAgICAgICAgICAgaWYgKG1lc2hIaXQpIHtcbiAgICAgICAgICAgICAgICAvLyDpgY3ljobpvKDmoIfpgInkuK3mqKHlnovnmoTmiYDmnInpobbngrnvvIzmib7liLDmnIDov5HnmoTpobbngrnlkLjpmYTov4fljrtcbiAgICAgICAgICAgICAgICBjb25zdCBoaXROb2RlID0gbWVzaEhpdC5ub2RlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleHM6IFZlYzRbXSA9IGdldE1lc2hWZXJ0ZXhBcm91bmRNb3VzZShoaXROb2RlLCBjYW1lcmEsIGV2ZW50LngsIGV2ZW50LnksIDEwMCk7XG4gICAgICAgICAgICAgICAgaWYgKHZlcnRleHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gdmVydGV4c1swXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSBoaXROb2RlLmdldFdvcmxkTWF0cml4KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNuYXBUYXJnZXRXb3JsZFBvcyA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NChzbmFwVGFyZ2V0V29ybGRQb3MsIG5ldyBWZWMzKHQueCwgdC55LCB0LnopLCB3b3JsZE1hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlRGVsdGFQb3MocG9zLCBzbmFwVGFyZ2V0V29ybGRQb3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGdyaWQgbW9kZVxuICAgICAgICAgICAgY29uc3Qgc25hcENvbmZpZ3MgPSBfY29udHJvbGxlci50cmFuc2Zvcm1Ub29sRGF0YT8uc25hcENvbmZpZ3M7XG4gICAgICAgICAgICBpZiAoIXNuYXBDb25maWdzKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ29udHJvbEtleVByZXNzZWQoZXZlbnQpIHx8IHNuYXBDb25maWdzLmlzUG9zaXRpb25TbmFwRW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlTbmFwSW5jcmVtZW50KHBvcywgc25hcENvbmZpZ3MucG9zaXRpb24sIGV2ZW50LmhhbmRsZU5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOKUgOKUgCBBeGlzIGd1aWRlbGluZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgICAvKipcbiAgICAgKiDlnKggM0Qg6KeG5Zu+5Lit5pi+56S65qC55o2u5L2g5ouW5Yqo55qEIHggeSB6IOaYvuekuuWvueW6lOeahOi9tOe6v1xuICAgICAqL1xuICAgIGF4aXNDb250cm9sbGVySGFuZGxlck1vdXNlRG93bihldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHN2YyA9IGdldFNlcnZpY2UoKTtcbiAgICAgICAgY29uc3QgaXMyRCA9IHN2Yz8uR2l6bW8/LnRyYW5zZm9ybVRvb2xEYXRhPy5pczJEO1xuICAgICAgICBjb25zdCB0b29sc1Zpc2libGUgPSBzdmM/Lkdpem1vPy5xdWVyeVRvb2xzVmlzaWJpbGl0eTNkPy4oKSA/PyB0cnVlO1xuICAgICAgICBpZiAoaXMyRCB8fCAhdG9vbHNWaXNpYmxlIHx8ICF0aGlzLl9heGlzQ29udHJvbGxlcikgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVzWzBdO1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybjtcblxuICAgICAgICBjb25zdCB2aXNpYmxlID0gW2ZhbHNlLCBmYWxzZSwgZmFsc2VdO1xuICAgICAgICBzd2l0Y2ggKGV2ZW50LmhhbmRsZU5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3h5JzpcbiAgICAgICAgICAgICAgICB2aXNpYmxlWzBdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2aXNpYmxlWzFdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3l6JzpcbiAgICAgICAgICAgICAgICB2aXNpYmxlWzFdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2aXNpYmxlWzJdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3h6JzpcbiAgICAgICAgICAgICAgICB2aXNpYmxlWzBdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2aXNpYmxlWzJdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpZHggPSBbJ3gnLCAneScsICd6J10uaW5kZXhPZihldmVudC5oYW5kbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoaWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlW2lkeF0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2F4aXNDb250cm9sbGVyLnNldFZpc2libGUodmlzaWJsZVswXSwgdmlzaWJsZVsxXSwgdmlzaWJsZVsyXSk7XG4gICAgICAgIHRoaXMuX2F4aXNDb250cm9sbGVyLnVwZGF0ZVRyYW5zZm9ybShub2RlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmm7TmlrDovbTnur/nmoTlnZDmoIdcbiAgICAgKi9cbiAgICBheGlzQ29udHJvbGxlckhhbmRsZXJNb3VzZU1vdmUoKSB7XG4gICAgICAgIGNvbnN0IHN2YyA9IGdldFNlcnZpY2UoKTtcbiAgICAgICAgY29uc3QgaXMyRCA9IHN2Yz8uR2l6bW8/LnRyYW5zZm9ybVRvb2xEYXRhPy5pczJEO1xuICAgICAgICBjb25zdCB0b29sc1Zpc2libGUgPSBzdmM/Lkdpem1vPy5xdWVyeVRvb2xzVmlzaWJpbGl0eTNkPy4oKSA/PyB0cnVlO1xuICAgICAgICBpZiAoaXMyRCB8fCAhdG9vbHNWaXNpYmxlIHx8ICF0aGlzLl9heGlzQ29udHJvbGxlcikgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVzWzBdO1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9heGlzQ29udHJvbGxlci51cGRhdGVUcmFuc2Zvcm0obm9kZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6ZqQ6JeP6L2057q/XG4gICAgICovXG4gICAgYXhpc0NvbnRyb2xsZXJIYW5kbGVyTW91c2VVcCgpIHtcbiAgICAgICAgY29uc3Qgc3ZjID0gZ2V0U2VydmljZSgpO1xuICAgICAgICBjb25zdCBpczJEID0gc3ZjPy5HaXptbz8udHJhbnNmb3JtVG9vbERhdGE/LmlzMkQ7XG4gICAgICAgIGNvbnN0IHRvb2xzVmlzaWJsZSA9IHN2Yz8uR2l6bW8/LnF1ZXJ5VG9vbHNWaXNpYmlsaXR5M2Q/LigpID8/IHRydWU7XG4gICAgICAgIGlmIChpczJEIHx8ICF0b29sc1Zpc2libGUgfHwgIXRoaXMuX2F4aXNDb250cm9sbGVyKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fYXhpc0NvbnRyb2xsZXIuc2V0VmlzaWJsZShmYWxzZSwgZmFsc2UsIGZhbHNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBvc2l0aW9uR2l6bW87XG4iXX0=