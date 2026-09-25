'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentGizmo = exports.IconGizmo = exports.SelectGizmo = exports.name = void 0;
const cc_1 = require("cc");
const gizmo_base_1 = __importDefault(require("../../base/gizmo-base"));
const editable_1 = __importDefault(require("../../controller/editable"));
const line_1 = __importDefault(require("../../controller/line"));
const controller_utils_1 = __importDefault(require("../../utils/controller-utils"));
const controller_shape_1 = __importDefault(require("../../utils/controller-shape"));
const engine_utils_1 = require("../../utils/engine-utils");
const gizmo_defines_1 = require("../../gizmo-defines");
function toPrecision(val, n) {
    return Math.round(val * Math.pow(10, n)) / Math.pow(10, n);
}
function makeVec3InPrecision(v, p) {
    const pow = Math.pow(10, p);
    v.x = Math.round(v.x * pow) / pow;
    v.y = Math.round(v.y * pow) / pow;
    v.z = Math.round(v.z * pow) / pow;
    return v;
}
const panPlaneLayer = cc_1.Layers.Enum.EDITOR;
var PolygonHandleType;
(function (PolygonHandleType) {
    PolygonHandleType["None"] = "none";
    PolygonHandleType["Point"] = "point";
    PolygonHandleType["Line"] = "line";
    PolygonHandleType["Area"] = "area";
})(PolygonHandleType || (PolygonHandleType = {}));
const flat = (arr, fn) => {
    return arr.map(fn).reduce((acc, val) => acc.concat(val), []);
};
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
class PolygonController extends editable_1.default {
    gizmo;
    static PolygonHandleType = PolygonHandleType;
    _panPlane = null;
    _panPlaneMeshRenderer = null;
    _points = [];
    _mouseDownOnPlanePos = new cc_1.Vec3();
    _curHandleData = { type: PolygonHandleType.None, deltaPos: new cc_1.Vec3(), index: -1 };
    _lineGroup = null;
    _pointsHandleData = [];
    _linesHandleData = [];
    _hitPoint = null;
    _areaNode = null;
    _areaMR = null;
    _areaOpacity = 80;
    _panSize = 100000;
    get points() {
        return this._points;
    }
    constructor(rootNode, gizmo) {
        super(rootNode);
        this.gizmo = gizmo;
        this._hoverColor = cc_1.Color.YELLOW;
        this.initShape();
    }
    initShape() {
        this.createShapeNode('PolygonController');
        this._lineGroup = (0, engine_utils_1.create3DNode)('LineGroup');
        this._lineGroup.parent = this.shape;
    }
    onInitEditHandles() {
        const panPlane = controller_utils_1.default.quad(new cc_1.Vec3(), this._panSize, this._panSize);
        panPlane.parent = this._rootNode;
        panPlane.name = 'RectPanPlane';
        panPlane.active = false;
        panPlane.layer = panPlaneLayer;
        (0, engine_utils_1.setNodeOpacity)(panPlane, 0);
        this._panPlane = panPlane;
        this._panPlaneMeshRenderer = (0, engine_utils_1.getModel)(panPlane);
        this.createPolygonAreaHandle();
    }
    showEditHandles() {
        super.showEditHandles();
        if (this._areaNode) {
            this._areaNode.active = true;
        }
    }
    hideEditHandles() {
        super.hideEditHandles();
        if (this._areaNode) {
            this._areaNode.active = false;
        }
    }
    createPolygonAreaHandle() {
        const polygonData = controller_shape_1.default.calcPolygonData(this._points);
        const areaNode = controller_utils_1.default.createShapeByData(polygonData, this._color, { unlit: true });
        areaNode.name = 'RectArea';
        areaNode.parent = this.shape;
        areaNode.setPosition(new cc_1.Vec3(0, 0, -0.1));
        (0, engine_utils_1.setNodeOpacity)(areaNode, this._areaOpacity);
        this._areaNode = areaNode;
        this._areaMR = (0, engine_utils_1.getModel)(areaNode);
        this.initHandle(areaNode, PolygonHandleType.Area);
    }
    setColor(color) {
        if (this._lineGroup) {
            this._color = color;
            this._lineGroup.children.forEach((child) => {
                (0, engine_utils_1.setMeshColor)(child, color);
            });
        }
    }
    updateData(points) {
        this.updatePanRectByPoints(points);
        this.resetEditHandlesFromPoints(points);
    }
    updatePanRectByPoints(points) {
        if (!this._panPlane || !this._panPlaneMeshRenderer || !this.gizmo || !this.gizmo.target)
            return;
        let maxX = 0, maxY = 0;
        points.forEach((point) => {
            maxX = Math.max(maxX, Math.abs(point.x));
            maxY = Math.max(maxY, Math.abs(point.y));
        });
        const center = this.gizmo.target.node.position;
        const size = (maxX > maxY ? maxX : maxY) * 2 + 1000;
        if (size < this._panSize)
            return;
        this._panSize = size;
        const quadData = controller_shape_1.default.calcPositionData(center, size, size, new cc_1.Vec3(0, 0, 1), true);
        (0, engine_utils_1.updatePositions)(this._panPlaneMeshRenderer, quadData.positions);
        (0, engine_utils_1.updateBoundingBox)(this._panPlaneMeshRenderer, quadData.minPos, quadData.maxPos);
    }
    resetEditHandlesFromPoints(points) {
        this._points = points;
        if (this._editHandlesShape) {
            this._editHandleKeys = [];
            this._points.forEach((_point, index) => {
                this._editHandleKeys.push('p' + index);
            });
            if (this._points.length > this._pointsHandleData.length) {
                const curLen = this._pointsHandleData.length;
                for (let i = curLen; i < this._points.length; i++) {
                    const handleData = this.createEditHandle(this._editHandleKeys[i], this._editHandleColor);
                    handleData.customData = {};
                    handleData.customData.index = i;
                    this._pointsHandleData.push(handleData);
                }
            }
            else if (this._points.length < this._pointsHandleData.length) {
                for (let i = this._pointsHandleData.length - 1; i >= this._points.length; i--) {
                    this._editHandlesShape.removeChild(this._pointsHandleData[i].topNode);
                    this.removeHandle('p' + i);
                }
                this._pointsHandleData.length = this._points.length;
            }
            this._editHandleKeys.forEach((key) => {
                this._updateEditHandle(key);
            });
            this.adjustEditHandlesSize();
        }
        if (this._lineGroup) {
            if (this._points.length < 2) {
                this._lineGroup.removeAllChildren();
                this._linesHandleData.forEach((data) => {
                    this.removeHandle(data.name);
                });
                this._linesHandleData = [];
            }
            if (this._points.length > this._linesHandleData.length) {
                const curLen = this._linesHandleData.length;
                for (let i = curLen; i < this._points.length; i++) {
                    const next_i = i === this._points.length - 1 ? 0 : i + 1;
                    const startPos = this._points[i];
                    const endPos = this._points[next_i];
                    const handleData = this.createLineHandle(startPos, endPos, i);
                    handleData.customData = {};
                    handleData.customData.index = i;
                    handleData.customData.lineMR = (0, engine_utils_1.getModel)(handleData.topNode);
                    this._linesHandleData.push(handleData);
                }
            }
            else if (this._points.length < this._linesHandleData.length) {
                for (let i = this._linesHandleData.length - 1; i >= this._points.length; i--) {
                    this._lineGroup.removeChild(this._linesHandleData[i].topNode);
                    this.removeHandle('l' + i);
                }
                this._linesHandleData.length = this._points.length;
            }
            this._updateLinesHandle();
        }
        if (this._areaNode && this._areaMR) {
            const polygonData = controller_shape_1.default.calcPolygonData(this._points);
            (0, engine_utils_1.updatePositions)(this._areaMR, polygonData.positions);
            try {
                const { earcut } = require('cc/editor/2d-misc');
                const flatPositions = flat(polygonData.positions, (v) => [v.x, v.y, v.z]);
                const indices = earcut(flatPositions, [], 3);
                (0, engine_utils_1.updateIB)(this._areaMR, indices);
            }
            catch {
                // earcut not available in CLI context
            }
            (0, engine_utils_1.updateBoundingBox)(this._areaMR, polygonData.minPos, polygonData.maxPos);
        }
    }
    createLineHandle(startPos, endPos, index) {
        const lineNode = controller_utils_1.default.lineTo(startPos, endPos, this._color, { unlit: true });
        lineNode.parent = this._lineGroup;
        return this.initHandle(lineNode, 'l' + index);
    }
    _updateLinesHandle() {
        this._linesHandleData.forEach((handleData, i) => {
            const next_i = i === this._points.length - 1 ? 0 : i + 1;
            const startPos = this._points[i];
            const endPos = this._points[next_i];
            const lineData = controller_shape_1.default.calcLineData(startPos, endPos);
            (0, engine_utils_1.updatePositions)(handleData.customData.lineMR, lineData.positions);
            (0, engine_utils_1.updateBoundingBox)(handleData.customData.lineMR, lineData.minPos, lineData.maxPos);
        });
    }
    _updateEditHandle(handleName) {
        if (handleName) {
            const handleData = this._handleDataMap[handleName];
            const handleNode = handleData.topNode;
            const index = handleData.customData.index;
            const pos = this._points[index];
            tempVec3_a.set(pos);
            const curScale = this.getScale();
            const baseScale = this._editHandleScales[handleName];
            handleNode.setScale(baseScale / curScale.x, baseScale / curScale.y, baseScale / curScale.z);
            cc_1.Vec3.multiply(tempVec3_a, tempVec3_a, curScale);
            handleNode.setPosition(tempVec3_a);
        }
    }
    onMouseDown(event) {
        event.propagationStopped = true;
        if (!this.edit || !this._panPlane) {
            return;
        }
        if (event.handleName.charAt(0) === 'l') {
            this._curHandleData.type = PolygonHandleType.Line;
            this._curHandleData.hitPos = event.hitPoint;
            const lineData = this._handleDataMap[event.handleName];
            this._curHandleData.index = lineData.customData.index;
        }
        else if (event.handleName.charAt(0) === 'p') {
            this._curHandleData.type = PolygonHandleType.Point;
            this._curHandleData.hitPos = event.hitPoint;
            const lineData = this._handleDataMap[event.handleName];
            this._curHandleData.index = lineData.customData.index;
        }
        else if (event.handleName === PolygonHandleType.Area) {
            this._curHandleData.type = PolygonHandleType.Area;
            this._curHandleData.deltaPos = new cc_1.Vec3();
        }
        this._panPlane.active = true;
        this._mouseDownOnPlanePos = new cc_1.Vec3();
        this.getPositionOnPanPlane(this._mouseDownOnPlanePos, event.x, event.y, this._panPlane);
        if (this.onControllerMouseDown) {
            this.onControllerMouseDown(event);
        }
    }
    onMouseMove(event) {
        event.propagationStopped = true;
        if (!this.edit || !this._panPlane) {
            return;
        }
        if (this._isMouseDown) {
            if (event.handleName.charAt(0) !== 'l') {
                const hitPos = new cc_1.Vec3();
                if (this.getPositionOnPanPlane(hitPos, event.x, event.y, this._panPlane)) {
                    if (event.handleName.charAt(0) === 'p') {
                        const deltaPos = new cc_1.Vec3(hitPos);
                        deltaPos.subtract(this._mouseDownOnPlanePos);
                        this._curHandleData.type = PolygonHandleType.Point;
                        this._curHandleData.deltaPos = deltaPos;
                        this._curHandleData.index = this._handleDataMap[event.handleName].customData.index;
                    }
                    else if (event.handleName === PolygonHandleType.Area) {
                        const deltaPos = new cc_1.Vec3(hitPos);
                        deltaPos.subtract(this._mouseDownOnPlanePos);
                        this._curHandleData.type = PolygonHandleType.Area;
                        this._curHandleData.deltaPos = deltaPos;
                    }
                }
            }
        }
        if (this.onControllerMouseMove) {
            this.onControllerMouseMove(event);
        }
    }
    onMouseUp(event) {
        event.propagationStopped = true;
        if (!this.edit || !this._panPlane) {
            return;
        }
        this._hitPoint = null;
        this._panPlane.active = false;
        this._curHandleData.type = PolygonHandleType.None;
        this._curHandleData.deltaPos = new cc_1.Vec3();
        if (this.onControllerMouseUp) {
            this.onControllerMouseUp(event);
        }
    }
    onHoverIn(event) {
        if (!this.edit) {
            return;
        }
        if (event.handleName.charAt(0) === 'p' ||
            event.handleName.charAt(0) === 'l') {
            const handleData = this._handleDataMap[event.handleName];
            event.customData = { index: handleData.customData.index };
            this.setHandleColor(event.handleName, this._hoverColor);
        }
        else if (event.handleName === PolygonHandleType.Area) {
            if (this._areaNode) {
                const opacity = (0, engine_utils_1.getNodeOpacity)(this._areaNode);
                if (opacity > 0) {
                    this.setHandleColor(event.handleName, this._hoverColor, opacity);
                }
            }
        }
        if (this.onControllerHoverIn) {
            this.onControllerHoverIn(event);
        }
    }
    onHoverOut(event) {
        super.onHoverOut(event);
        if (this.onControllerHoverOut) {
            this.onControllerHoverOut(event);
        }
    }
    getHitPoint() {
        return this._hitPoint;
    }
    getHandleData() {
        return this._curHandleData;
    }
}
const HandleType = PolygonController.PolygonHandleType;
const tempVec3_gizmo = new cc_1.Vec3();
const tempQuat_gizmo = new cc_1.Quat();
const tempMat4 = new cc_1.Mat4();
const tempVec2 = new cc_1.Vec2();
class PolygonCollider2DGizmo extends gizmo_base_1.default {
    _controller;
    _leftDeleteLine;
    _rightDeleteLine;
    _offset = new cc_1.Vec2();
    _ctrlKey = false;
    _metaKey = false;
    _propPath = null;
    _3dPoints = [];
    _points = [];
    _curHoverInHandleType = HandleType.None;
    _curHoverInElemIndex = -1;
    _isDeletePointKeyDown = false;
    init() {
        this.createController();
        this._isInitialized = true;
    }
    onShow() {
        this._controller.show();
        this.updateController();
    }
    onHide() {
        this._controller.hide();
    }
    createController() {
        const gizmoRoot = this.getGizmoRoot();
        this._controller = new PolygonController(gizmoRoot, this);
        this._controller.editable = true;
        this._controller.setColor(new cc_1.Color(107, 194, 53));
        this._controller.setEditHandlesColor(new cc_1.Color(107, 194, 53));
        this._controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
        this._controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
        this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
        this._controller.onControllerHoverIn = this.onControllerHoverIn.bind(this);
        this._controller.onControllerHoverOut = this.onControllerHoverOut.bind(this);
        this._leftDeleteLine = new line_1.default(gizmoRoot);
        this._leftDeleteLine.setColor(cc_1.Color.RED);
        this._leftDeleteLine.hide();
        this._rightDeleteLine = new line_1.default(gizmoRoot);
        this._rightDeleteLine.setColor(cc_1.Color.RED);
        this._rightDeleteLine.hide();
    }
    onControllerMouseDown() {
        const handleData = this._controller.getHandleData();
        if (!handleData || !this.target) {
            return;
        }
        if (handleData.type === HandleType.Line) {
            const hitPoint = handleData.hitPos;
            if (hitPoint) {
                this._propPath = this.getCompPropPath('points');
                this.onControlUpdate(this._propPath);
                const points = this.target.points;
                this.worldToLocalPos(tempVec3_gizmo, hitPoint);
                const offset = this.target.offset;
                const posX = toPrecision(tempVec3_gizmo.x - offset.x, 1);
                const posY = toPrecision(tempVec3_gizmo.y - offset.y, 1);
                points.splice(handleData.index + 1, 0, new cc_1.Vec2(posX, posY));
                this.target.points = points;
                this.onComponentChanged(this.target.node);
            }
        }
        else if (handleData.type === HandleType.Point) {
            this.onControlUpdate(this._propPath);
            this._propPath = this.getCompPropPath('points');
            if (this._isDeletePointKeyDown) {
                const points = this.target.points;
                points.splice(handleData.index, 1);
                this.target.points = points;
                this.onComponentChanged(this.target.node);
                this._curHoverInHandleType = HandleType.None;
                this._curHoverInElemIndex = -1;
            }
            this._points = [];
            this.target.points.forEach((point) => {
                this._points.push(point.clone());
            });
        }
        else if (handleData.type === HandleType.Area) {
            this._offset = this.target.offset.clone();
            this._propPath = this.getCompPropPath('offset');
        }
    }
    onControllerMouseMove(event) {
        this._ctrlKey = event.ctrlKey;
        this._metaKey = event.metaKey;
        this._isDeletePointKeyDown = this._ctrlKey || this._metaKey;
        if (this._controller.updated) {
            const handleData = this._controller.getHandleData();
            if (handleData.type === HandleType.Point) {
                this.onControlUpdate(this._propPath);
                this.handlePoints(handleData);
            }
            else if (handleData.type === HandleType.Area) {
                this.onControlUpdate(this._propPath);
                this.handleAreaMove(handleData.deltaPos);
            }
        }
    }
    onControllerMouseUp() {
        this.onControlEnd(this._propPath);
    }
    onControllerHoverIn(event) {
        if (event.handleName.charAt(0) === 'l') {
            this._curHoverInHandleType = HandleType.Line;
            this._curHoverInElemIndex = event.customData?.index;
        }
        else if (event.handleName.charAt(0) === 'p') {
            this._curHoverInHandleType = HandleType.Point;
            this._curHoverInElemIndex = event.customData?.index;
        }
        else if (event.handleName === HandleType.Area) {
            this._curHoverInHandleType = HandleType.Area;
        }
    }
    onControllerHoverOut(event) {
        if (event.handleName.charAt(0) === 'l') {
            if (this._curHoverInHandleType === HandleType.Line) {
                this._curHoverInHandleType = HandleType.None;
                this._curHoverInElemIndex = -1;
            }
        }
        else if (event.handleName.charAt(0) === 'p') {
            if (this._curHoverInHandleType === HandleType.Point) {
                this._curHoverInHandleType = HandleType.None;
                this._curHoverInElemIndex = -1;
            }
        }
        else if (event.handleName === HandleType.Area) {
            if (this._curHoverInHandleType === HandleType.Area) {
                this._curHoverInHandleType = HandleType.None;
            }
        }
    }
    onKeyDown(event) {
        this._ctrlKey = event.ctrlKey;
        this._metaKey = event.metaKey;
        this._isDeletePointKeyDown = this._ctrlKey || this._metaKey;
    }
    onKeyUp(event) {
        this._ctrlKey = event.ctrlKey;
        this._metaKey = event.metaKey;
        this._isDeletePointKeyDown = this._ctrlKey || this._metaKey;
    }
    worldToLocalPos(out, inPos) {
        if (this.target) {
            const node = this.target.node;
            node.getWorldMatrix(tempMat4);
            cc_1.Mat4.invert(tempMat4, tempMat4);
            cc_1.Vec3.transformMat4(out, inPos, tempMat4);
        }
    }
    handleAreaMove(delta) {
        if (!this.target) {
            return;
        }
        const node = this.target.node;
        const posDelta = delta.clone();
        node.getWorldMatrix(tempMat4);
        cc_1.Mat4.invert(tempMat4, tempMat4);
        tempMat4.m12 = tempMat4.m13 = 0;
        cc_1.Vec3.transformMat4(posDelta, posDelta, tempMat4);
        makeVec3InPrecision(posDelta, 1);
        posDelta.z = 0;
        tempVec2.set(this._offset);
        tempVec2.add2f(posDelta.x, posDelta.y);
        this.target.offset.set(tempVec2);
        this.onComponentChanged(node);
    }
    handlePoints(handleMoveData) {
        const index = handleMoveData.index;
        if (index < 0 || !this.target) {
            return;
        }
        const posDelta = handleMoveData.deltaPos.clone();
        const node = this.target.node;
        node.getWorldMatrix(tempMat4);
        cc_1.Mat4.invert(tempMat4, tempMat4);
        tempMat4.m12 = tempMat4.m13 = 0;
        cc_1.Vec3.transformMat4(posDelta, posDelta, tempMat4);
        const targetPoints = this.target.points;
        const point = this._points[index];
        let posX = point.x + posDelta.x;
        let posY = point.y + posDelta.y;
        posX = toPrecision(posX, 1);
        posY = toPrecision(posY, 1);
        targetPoints[index].set(posX, posY);
        this.target.points = targetPoints;
        this.onComponentChanged(node);
    }
    updateControllerData() {
        if (!this._isInitialized || this.target === null) {
            return;
        }
        const polygonCollider2D = this.target;
        if (polygonCollider2D) {
            const offset = polygonCollider2D.offset;
            const center = tempVec3_gizmo;
            center.x = offset.x;
            center.y = offset.y;
            center.z = 0;
            const node = this.target.node;
            if (node) {
                node.getWorldMatrix(tempMat4);
            }
            if (this._3dPoints.length < polygonCollider2D.points.length) {
                const len = polygonCollider2D.points.length - this._3dPoints.length;
                for (let i = 0; i < len; i++) {
                    this._3dPoints.push(new cc_1.Vec3(0, 0, 0));
                }
            }
            else {
                this._3dPoints.length = polygonCollider2D.points.length;
            }
            polygonCollider2D.points.forEach((point, index) => {
                this._3dPoints[index].set(point.x + center.x, point.y + center.y, 0);
                cc_1.Vec3.transformMat4(this._3dPoints[index], this._3dPoints[index], tempMat4);
            });
            this._controller.updateData(this._3dPoints);
            this._controller.edit = polygonCollider2D.editing;
        }
        else {
            this._controller.hide();
        }
    }
    updateController() {
        this.updateControllerData();
    }
    onTargetUpdate() {
        this.updateController();
    }
    onNodeChanged() {
        this.updateController();
    }
}
exports.name = cc_1.js.getClassName(cc_1.PolygonCollider2D);
exports.SelectGizmo = PolygonCollider2DGizmo;
exports.IconGizmo = null;
exports.PersistentGizmo = null;
(0, gizmo_defines_1.registerGizmo)(exports.name, { SelectGizmo: exports.SelectGizmo });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8vY29tcG9uZW50cy9wb2x5Z29uLWNvbGxpZGVyLTJkL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsMkJBQXNHO0FBQ3RHLHVFQUE4QztBQUM5Qyx5RUFBMkQ7QUFDM0QsaUVBQW1EO0FBQ25ELG9GQUEyRDtBQUMzRCxvRkFBMkQ7QUFFM0QsMkRBU2tDO0FBQ2xDLHVEQUFvRDtBQUVwRCxTQUFTLFdBQVcsQ0FBQyxHQUFXLEVBQUUsQ0FBUztJQUN2QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0QsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQUMsQ0FBTyxFQUFFLENBQVM7SUFDM0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQ2xDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDbEMsT0FBTyxDQUFDLENBQUM7QUFDYixD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S0FBSyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckUsU0FBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDL0UsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDO1FBQ3RELENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixDQUFDO0lBQ0wsQ0FBQztJQUVELGdCQUFnQjtRQUNaLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxjQUFjO1FBQ1YsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELGFBQWE7UUFDVCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0NBQ0o7QUFFWSxRQUFBLElBQUksR0FBRyxPQUFFLENBQUMsWUFBWSxDQUFDLHNCQUFpQixDQUFDLENBQUM7QUFDMUMsUUFBQSxXQUFXLEdBQUcsc0JBQXNCLENBQUM7QUFDckMsUUFBQSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFFBQUEsZUFBZSxHQUFHLElBQUksQ0FBQztBQUVwQyxJQUFBLDZCQUFhLEVBQUMsWUFBSSxFQUFFLEVBQUUsV0FBVyxFQUFYLG1CQUFXLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBDb2xvciwganMsIExheWVycywgTWF0NCwgTWVzaFJlbmRlcmVyLCBOb2RlLCBQb2x5Z29uQ29sbGlkZXIyRCwgUXVhdCwgVmVjMiwgVmVjMyB9IGZyb20gJ2NjJztcbmltcG9ydCBHaXptb0Jhc2UgZnJvbSAnLi4vLi4vYmFzZS9naXptby1iYXNlJztcbmltcG9ydCBFZGl0YWJsZUNvbnRyb2xsZXIgZnJvbSAnLi4vLi4vY29udHJvbGxlci9lZGl0YWJsZSc7XG5pbXBvcnQgTGluZUNvbnRyb2xsZXIgZnJvbSAnLi4vLi4vY29udHJvbGxlci9saW5lJztcbmltcG9ydCBDb250cm9sbGVyVXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMvY29udHJvbGxlci11dGlscyc7XG5pbXBvcnQgQ29udHJvbGxlclNoYXBlIGZyb20gJy4uLy4uL3V0aWxzL2NvbnRyb2xsZXItc2hhcGUnO1xuaW1wb3J0IHR5cGUgeyBHaXptb01vdXNlRXZlbnQsIElIYW5kbGVEYXRhIH0gZnJvbSAnLi4vLi4vdXRpbHMvZGVmaW5lcyc7XG5pbXBvcnQge1xuICAgIGdldE1vZGVsLFxuICAgIHVwZGF0ZVBvc2l0aW9ucyxcbiAgICB1cGRhdGVJQixcbiAgICBzZXRNZXNoQ29sb3IsXG4gICAgc2V0Tm9kZU9wYWNpdHksXG4gICAgZ2V0Tm9kZU9wYWNpdHksXG4gICAgdXBkYXRlQm91bmRpbmdCb3gsXG4gICAgY3JlYXRlM0ROb2RlLFxufSBmcm9tICcuLi8uLi91dGlscy9lbmdpbmUtdXRpbHMnO1xuaW1wb3J0IHsgcmVnaXN0ZXJHaXptbyB9IGZyb20gJy4uLy4uL2dpem1vLWRlZmluZXMnO1xuXG5mdW5jdGlvbiB0b1ByZWNpc2lvbih2YWw6IG51bWJlciwgbjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWwgKiBNYXRoLnBvdygxMCwgbikpIC8gTWF0aC5wb3coMTAsIG4pO1xufVxuXG5mdW5jdGlvbiBtYWtlVmVjM0luUHJlY2lzaW9uKHY6IFZlYzMsIHA6IG51bWJlcik6IFZlYzMge1xuICAgIGNvbnN0IHBvdyA9IE1hdGgucG93KDEwLCBwKTtcbiAgICB2LnggPSBNYXRoLnJvdW5kKHYueCAqIHBvdykgLyBwb3c7XG4gICAgdi55ID0gTWF0aC5yb3VuZCh2LnkgKiBwb3cpIC8gcG93O1xuICAgIHYueiA9IE1hdGgucm91bmQodi56ICogcG93KSAvIHBvdztcbiAgICByZXR1cm4gdjtcbn1cblxuY29uc3QgcGFuUGxhbmVMYXllciA9IExheWVycy5FbnVtLkVESVRPUjtcblxuZW51bSBQb2x5Z29uSGFuZGxlVHlwZSB7XG4gICAgTm9uZSA9ICdub25lJyxcbiAgICBQb2ludCA9ICdwb2ludCcsXG4gICAgTGluZSA9ICdsaW5lJyxcbiAgICBBcmVhID0gJ2FyZWEnLFxufVxuXG5pbnRlcmZhY2UgSVBvbHlnb25IYW5kbGVEYXRhIHtcbiAgICB0eXBlOiBzdHJpbmc7XG4gICAgZGVsdGFQb3M6IFZlYzM7XG4gICAgaW5kZXg6IG51bWJlcjtcbiAgICBoaXRQb3M/OiBWZWMzO1xufVxuXG5jb25zdCBmbGF0ID0gKGFycjogYW55LCBmbjogYW55KSA9PiB7XG4gICAgcmV0dXJuIGFyci5tYXAoZm4pLnJlZHVjZSgoYWNjOiBhbnksIHZhbDogYW55KSA9PiBhY2MuY29uY2F0KHZhbCksIFtdKTtcbn07XG5cbmNvbnN0IHRlbXBWZWMzX2EgPSBuZXcgVmVjMygpO1xuY29uc3QgdGVtcFZlYzNfYiA9IG5ldyBWZWMzKCk7XG5cbmNsYXNzIFBvbHlnb25Db250cm9sbGVyIGV4dGVuZHMgRWRpdGFibGVDb250cm9sbGVyIHtcbiAgICBwdWJsaWMgc3RhdGljIFBvbHlnb25IYW5kbGVUeXBlID0gUG9seWdvbkhhbmRsZVR5cGU7XG4gICAgcHJpdmF0ZSBfcGFuUGxhbmU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9wYW5QbGFuZU1lc2hSZW5kZXJlcjogTWVzaFJlbmRlcmVyIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfcG9pbnRzOiBWZWMzW10gPSBbXTtcbiAgICBwcml2YXRlIF9tb3VzZURvd25PblBsYW5lUG9zOiBWZWMzID0gbmV3IFZlYzMoKTtcbiAgICBwcml2YXRlIF9jdXJIYW5kbGVEYXRhOiBJUG9seWdvbkhhbmRsZURhdGEgPSB7IHR5cGU6IFBvbHlnb25IYW5kbGVUeXBlLk5vbmUsIGRlbHRhUG9zOiBuZXcgVmVjMygpLCBpbmRleDogLTEgfTtcbiAgICBwcml2YXRlIF9saW5lR3JvdXA6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9wb2ludHNIYW5kbGVEYXRhOiBJSGFuZGxlRGF0YVtdID0gW107XG4gICAgcHJpdmF0ZSBfbGluZXNIYW5kbGVEYXRhOiBJSGFuZGxlRGF0YVtdID0gW107XG4gICAgcHJpdmF0ZSBfaGl0UG9pbnQ6IFZlYzMgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9hcmVhTm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX2FyZWFNUjogTWVzaFJlbmRlcmVyIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfYXJlYU9wYWNpdHkgPSA4MDtcbiAgICBwcml2YXRlIF9wYW5TaXplID0gMTAwMDAwO1xuXG4gICAgcHVibGljIGdldCBwb2ludHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wb2ludHM7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHJvb3ROb2RlOiBOb2RlLFxuICAgICAgICBwdWJsaWMgZ2l6bW86IFBvbHlnb25Db2xsaWRlcjJER2l6bW8sXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKHJvb3ROb2RlKTtcbiAgICAgICAgdGhpcy5faG92ZXJDb2xvciA9IENvbG9yLllFTExPVztcbiAgICAgICAgdGhpcy5pbml0U2hhcGUoKTtcbiAgICB9XG5cbiAgICBpbml0U2hhcGUoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlU2hhcGVOb2RlKCdQb2x5Z29uQ29udHJvbGxlcicpO1xuICAgICAgICB0aGlzLl9saW5lR3JvdXAgPSBjcmVhdGUzRE5vZGUoJ0xpbmVHcm91cCcpO1xuICAgICAgICB0aGlzLl9saW5lR3JvdXAucGFyZW50ID0gdGhpcy5zaGFwZTtcbiAgICB9XG5cbiAgICBvbkluaXRFZGl0SGFuZGxlcygpIHtcbiAgICAgICAgY29uc3QgcGFuUGxhbmUgPSBDb250cm9sbGVyVXRpbHMucXVhZChuZXcgVmVjMygpLCB0aGlzLl9wYW5TaXplLCB0aGlzLl9wYW5TaXplKTtcbiAgICAgICAgcGFuUGxhbmUucGFyZW50ID0gdGhpcy5fcm9vdE5vZGU7XG4gICAgICAgIHBhblBsYW5lLm5hbWUgPSAnUmVjdFBhblBsYW5lJztcbiAgICAgICAgcGFuUGxhbmUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHBhblBsYW5lLmxheWVyID0gcGFuUGxhbmVMYXllcjtcbiAgICAgICAgc2V0Tm9kZU9wYWNpdHkocGFuUGxhbmUsIDApO1xuICAgICAgICB0aGlzLl9wYW5QbGFuZSA9IHBhblBsYW5lO1xuICAgICAgICB0aGlzLl9wYW5QbGFuZU1lc2hSZW5kZXJlciA9IGdldE1vZGVsKHBhblBsYW5lKTtcblxuICAgICAgICB0aGlzLmNyZWF0ZVBvbHlnb25BcmVhSGFuZGxlKCk7XG4gICAgfVxuXG4gICAgc2hvd0VkaXRIYW5kbGVzKCkge1xuICAgICAgICBzdXBlci5zaG93RWRpdEhhbmRsZXMoKTtcbiAgICAgICAgaWYgKHRoaXMuX2FyZWFOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9hcmVhTm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaGlkZUVkaXRIYW5kbGVzKCkge1xuICAgICAgICBzdXBlci5oaWRlRWRpdEhhbmRsZXMoKTtcbiAgICAgICAgaWYgKHRoaXMuX2FyZWFOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9hcmVhTm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNyZWF0ZVBvbHlnb25BcmVhSGFuZGxlKCkge1xuICAgICAgICBjb25zdCBwb2x5Z29uRGF0YSA9IENvbnRyb2xsZXJTaGFwZS5jYWxjUG9seWdvbkRhdGEodGhpcy5fcG9pbnRzKTtcbiAgICAgICAgY29uc3QgYXJlYU5vZGUgPSBDb250cm9sbGVyVXRpbHMuY3JlYXRlU2hhcGVCeURhdGEocG9seWdvbkRhdGEsIHRoaXMuX2NvbG9yLCB7IHVubGl0OiB0cnVlIH0pO1xuICAgICAgICBhcmVhTm9kZS5uYW1lID0gJ1JlY3RBcmVhJztcbiAgICAgICAgYXJlYU5vZGUucGFyZW50ID0gdGhpcy5zaGFwZTtcbiAgICAgICAgYXJlYU5vZGUuc2V0UG9zaXRpb24obmV3IFZlYzMoMCwgMCwgLTAuMSkpO1xuICAgICAgICBzZXROb2RlT3BhY2l0eShhcmVhTm9kZSwgdGhpcy5fYXJlYU9wYWNpdHkpO1xuICAgICAgICB0aGlzLl9hcmVhTm9kZSA9IGFyZWFOb2RlO1xuICAgICAgICB0aGlzLl9hcmVhTVIgPSBnZXRNb2RlbChhcmVhTm9kZSk7XG4gICAgICAgIHRoaXMuaW5pdEhhbmRsZShhcmVhTm9kZSwgUG9seWdvbkhhbmRsZVR5cGUuQXJlYSk7XG4gICAgfVxuXG4gICAgc2V0Q29sb3IoY29sb3I6IENvbG9yKSB7XG4gICAgICAgIGlmICh0aGlzLl9saW5lR3JvdXApIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB0aGlzLl9saW5lR3JvdXAuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IE5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRNZXNoQ29sb3IoY2hpbGQsIGNvbG9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlRGF0YShwb2ludHM6IFZlYzNbXSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVBhblJlY3RCeVBvaW50cyhwb2ludHMpO1xuICAgICAgICB0aGlzLnJlc2V0RWRpdEhhbmRsZXNGcm9tUG9pbnRzKHBvaW50cyk7XG4gICAgfVxuXG4gICAgdXBkYXRlUGFuUmVjdEJ5UG9pbnRzKHBvaW50czogVmVjM1tdKSB7XG4gICAgICAgIGlmICghdGhpcy5fcGFuUGxhbmUgfHwgIXRoaXMuX3BhblBsYW5lTWVzaFJlbmRlcmVyIHx8ICF0aGlzLmdpem1vIHx8ICF0aGlzLmdpem1vLnRhcmdldCkgcmV0dXJuO1xuXG4gICAgICAgIGxldCBtYXhYID0gMCwgbWF4WSA9IDA7XG4gICAgICAgIHBvaW50cy5mb3JFYWNoKChwb2ludCkgPT4ge1xuICAgICAgICAgICAgbWF4WCA9IE1hdGgubWF4KG1heFgsIE1hdGguYWJzKHBvaW50LngpKTtcbiAgICAgICAgICAgIG1heFkgPSBNYXRoLm1heChtYXhZLCBNYXRoLmFicyhwb2ludC55KSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNlbnRlciA9IHRoaXMuZ2l6bW8udGFyZ2V0Lm5vZGUucG9zaXRpb247XG4gICAgICAgIGNvbnN0IHNpemUgPSAobWF4WCA+IG1heFkgPyBtYXhYIDogbWF4WSkgKiAyICsgMTAwMDtcbiAgICAgICAgaWYgKHNpemUgPCB0aGlzLl9wYW5TaXplKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fcGFuU2l6ZSA9IHNpemU7XG4gICAgICAgIGNvbnN0IHF1YWREYXRhID0gQ29udHJvbGxlclNoYXBlLmNhbGNQb3NpdGlvbkRhdGEoY2VudGVyLCBzaXplLCBzaXplLCBuZXcgVmVjMygwLCAwLCAxKSwgdHJ1ZSk7XG4gICAgICAgIHVwZGF0ZVBvc2l0aW9ucyh0aGlzLl9wYW5QbGFuZU1lc2hSZW5kZXJlciwgcXVhZERhdGEucG9zaXRpb25zKTtcbiAgICAgICAgdXBkYXRlQm91bmRpbmdCb3godGhpcy5fcGFuUGxhbmVNZXNoUmVuZGVyZXIsIHF1YWREYXRhLm1pblBvcywgcXVhZERhdGEubWF4UG9zKTtcbiAgICB9XG5cbiAgICByZXNldEVkaXRIYW5kbGVzRnJvbVBvaW50cyhwb2ludHM6IFZlYzNbXSkge1xuICAgICAgICB0aGlzLl9wb2ludHMgPSBwb2ludHM7XG5cbiAgICAgICAgaWYgKHRoaXMuX2VkaXRIYW5kbGVzU2hhcGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRIYW5kbGVLZXlzID0gW107XG4gICAgICAgICAgICB0aGlzLl9wb2ludHMuZm9yRWFjaCgoX3BvaW50OiBWZWMzLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZWRpdEhhbmRsZUtleXMucHVzaCgncCcgKyBpbmRleCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3BvaW50cy5sZW5ndGggPiB0aGlzLl9wb2ludHNIYW5kbGVEYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1ckxlbiA9IHRoaXMuX3BvaW50c0hhbmRsZURhdGEubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjdXJMZW47IGkgPCB0aGlzLl9wb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlRGF0YSA9IHRoaXMuY3JlYXRlRWRpdEhhbmRsZSh0aGlzLl9lZGl0SGFuZGxlS2V5c1tpXSwgdGhpcy5fZWRpdEhhbmRsZUNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlRGF0YS5jdXN0b21EYXRhID0ge307XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZURhdGEuY3VzdG9tRGF0YS5pbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BvaW50c0hhbmRsZURhdGEucHVzaChoYW5kbGVEYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3BvaW50cy5sZW5ndGggPCB0aGlzLl9wb2ludHNIYW5kbGVEYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSB0aGlzLl9wb2ludHNIYW5kbGVEYXRhLmxlbmd0aCAtIDE7IGkgPj0gdGhpcy5fcG9pbnRzLmxlbmd0aDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VkaXRIYW5kbGVzU2hhcGUucmVtb3ZlQ2hpbGQodGhpcy5fcG9pbnRzSGFuZGxlRGF0YVtpXS50b3BOb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVIYW5kbGUoJ3AnICsgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3BvaW50c0hhbmRsZURhdGEubGVuZ3RoID0gdGhpcy5fcG9pbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZWRpdEhhbmRsZUtleXMuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVFZGl0SGFuZGxlKGtleSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5hZGp1c3RFZGl0SGFuZGxlc1NpemUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9saW5lR3JvdXApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9wb2ludHMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xpbmVHcm91cC5yZW1vdmVBbGxDaGlsZHJlbigpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xpbmVzSGFuZGxlRGF0YS5mb3JFYWNoKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlSGFuZGxlKGRhdGEubmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGluZXNIYW5kbGVEYXRhID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9wb2ludHMubGVuZ3RoID4gdGhpcy5fbGluZXNIYW5kbGVEYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1ckxlbiA9IHRoaXMuX2xpbmVzSGFuZGxlRGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGN1ckxlbjsgaSA8IHRoaXMuX3BvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0X2kgPSBpID09PSB0aGlzLl9wb2ludHMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRQb3MgPSB0aGlzLl9wb2ludHNbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVuZFBvcyA9IHRoaXMuX3BvaW50c1tuZXh0X2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZURhdGEgPSB0aGlzLmNyZWF0ZUxpbmVIYW5kbGUoc3RhcnRQb3MsIGVuZFBvcywgaSk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZURhdGEuY3VzdG9tRGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVEYXRhLmN1c3RvbURhdGEuaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVEYXRhLmN1c3RvbURhdGEubGluZU1SID0gZ2V0TW9kZWwoaGFuZGxlRGF0YS50b3BOb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGluZXNIYW5kbGVEYXRhLnB1c2goaGFuZGxlRGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9wb2ludHMubGVuZ3RoIDwgdGhpcy5fbGluZXNIYW5kbGVEYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSB0aGlzLl9saW5lc0hhbmRsZURhdGEubGVuZ3RoIC0gMTsgaSA+PSB0aGlzLl9wb2ludHMubGVuZ3RoOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGluZUdyb3VwLnJlbW92ZUNoaWxkKHRoaXMuX2xpbmVzSGFuZGxlRGF0YVtpXS50b3BOb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVIYW5kbGUoJ2wnICsgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2xpbmVzSGFuZGxlRGF0YS5sZW5ndGggPSB0aGlzLl9wb2ludHMubGVuZ3RoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl91cGRhdGVMaW5lc0hhbmRsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2FyZWFOb2RlICYmIHRoaXMuX2FyZWFNUikge1xuICAgICAgICAgICAgY29uc3QgcG9seWdvbkRhdGEgPSBDb250cm9sbGVyU2hhcGUuY2FsY1BvbHlnb25EYXRhKHRoaXMuX3BvaW50cyk7XG4gICAgICAgICAgICB1cGRhdGVQb3NpdGlvbnModGhpcy5fYXJlYU1SLCBwb2x5Z29uRGF0YS5wb3NpdGlvbnMpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGVhcmN1dCB9ID0gcmVxdWlyZSgnY2MvZWRpdG9yLzJkLW1pc2MnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmbGF0UG9zaXRpb25zID0gZmxhdChwb2x5Z29uRGF0YS5wb3NpdGlvbnMsICh2OiBWZWMzKSA9PiBbdi54LCB2LnksIHYuel0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGljZXMgPSBlYXJjdXQoZmxhdFBvc2l0aW9ucywgW10sIDMpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZUlCKHRoaXMuX2FyZWFNUiwgaW5kaWNlcyk7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAvLyBlYXJjdXQgbm90IGF2YWlsYWJsZSBpbiBDTEkgY29udGV4dFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXBkYXRlQm91bmRpbmdCb3godGhpcy5fYXJlYU1SLCBwb2x5Z29uRGF0YS5taW5Qb3MsIHBvbHlnb25EYXRhLm1heFBvcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGVMaW5lSGFuZGxlKHN0YXJ0UG9zOiBWZWMzLCBlbmRQb3M6IFZlYzMsIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgbGluZU5vZGU6IE5vZGUgPSBDb250cm9sbGVyVXRpbHMubGluZVRvKHN0YXJ0UG9zLCBlbmRQb3MsIHRoaXMuX2NvbG9yLCB7IHVubGl0OiB0cnVlIH0pO1xuICAgICAgICBsaW5lTm9kZS5wYXJlbnQgPSB0aGlzLl9saW5lR3JvdXA7XG4gICAgICAgIHJldHVybiB0aGlzLmluaXRIYW5kbGUobGluZU5vZGUsICdsJyArIGluZGV4KTtcbiAgICB9XG5cbiAgICBfdXBkYXRlTGluZXNIYW5kbGUoKSB7XG4gICAgICAgIHRoaXMuX2xpbmVzSGFuZGxlRGF0YS5mb3JFYWNoKChoYW5kbGVEYXRhOiBJSGFuZGxlRGF0YSwgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXh0X2kgPSBpID09PSB0aGlzLl9wb2ludHMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0UG9zID0gdGhpcy5fcG9pbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgZW5kUG9zID0gdGhpcy5fcG9pbnRzW25leHRfaV07XG4gICAgICAgICAgICBjb25zdCBsaW5lRGF0YSA9IENvbnRyb2xsZXJTaGFwZS5jYWxjTGluZURhdGEoc3RhcnRQb3MsIGVuZFBvcyk7XG4gICAgICAgICAgICB1cGRhdGVQb3NpdGlvbnMoaGFuZGxlRGF0YS5jdXN0b21EYXRhLmxpbmVNUiwgbGluZURhdGEucG9zaXRpb25zKTtcbiAgICAgICAgICAgIHVwZGF0ZUJvdW5kaW5nQm94KGhhbmRsZURhdGEuY3VzdG9tRGF0YS5saW5lTVIsIGxpbmVEYXRhLm1pblBvcywgbGluZURhdGEubWF4UG9zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX3VwZGF0ZUVkaXRIYW5kbGUoaGFuZGxlTmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChoYW5kbGVOYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVEYXRhID0gdGhpcy5faGFuZGxlRGF0YU1hcFtoYW5kbGVOYW1lXTtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZU5vZGUgPSBoYW5kbGVEYXRhLnRvcE5vZGU7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGhhbmRsZURhdGEuY3VzdG9tRGF0YS5pbmRleDtcbiAgICAgICAgICAgIGNvbnN0IHBvcyA9IHRoaXMuX3BvaW50c1tpbmRleF07XG4gICAgICAgICAgICB0ZW1wVmVjM19hLnNldChwb3MpO1xuICAgICAgICAgICAgY29uc3QgY3VyU2NhbGUgPSB0aGlzLmdldFNjYWxlKCk7XG4gICAgICAgICAgICBjb25zdCBiYXNlU2NhbGUgPSB0aGlzLl9lZGl0SGFuZGxlU2NhbGVzW2hhbmRsZU5hbWVdO1xuICAgICAgICAgICAgaGFuZGxlTm9kZS5zZXRTY2FsZShiYXNlU2NhbGUgLyBjdXJTY2FsZS54LCBiYXNlU2NhbGUgLyBjdXJTY2FsZS55LCBiYXNlU2NhbGUgLyBjdXJTY2FsZS56KTtcbiAgICAgICAgICAgIFZlYzMubXVsdGlwbHkodGVtcFZlYzNfYSwgdGVtcFZlYzNfYSwgY3VyU2NhbGUpO1xuICAgICAgICAgICAgaGFuZGxlTm9kZS5zZXRQb3NpdGlvbih0ZW1wVmVjM19hKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uTW91c2VEb3duKGV2ZW50OiBHaXptb01vdXNlRXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXQgfHwgIXRoaXMuX3BhblBsYW5lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnQuaGFuZGxlTmFtZS5jaGFyQXQoMCkgPT09ICdsJykge1xuICAgICAgICAgICAgdGhpcy5fY3VySGFuZGxlRGF0YS50eXBlID0gUG9seWdvbkhhbmRsZVR5cGUuTGluZTtcbiAgICAgICAgICAgIHRoaXMuX2N1ckhhbmRsZURhdGEuaGl0UG9zID0gZXZlbnQuaGl0UG9pbnQ7XG4gICAgICAgICAgICBjb25zdCBsaW5lRGF0YSA9IHRoaXMuX2hhbmRsZURhdGFNYXBbZXZlbnQuaGFuZGxlTmFtZV07XG4gICAgICAgICAgICB0aGlzLl9jdXJIYW5kbGVEYXRhLmluZGV4ID0gbGluZURhdGEuY3VzdG9tRGF0YS5pbmRleDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5oYW5kbGVOYW1lLmNoYXJBdCgwKSA9PT0gJ3AnKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJIYW5kbGVEYXRhLnR5cGUgPSBQb2x5Z29uSGFuZGxlVHlwZS5Qb2ludDtcbiAgICAgICAgICAgIHRoaXMuX2N1ckhhbmRsZURhdGEuaGl0UG9zID0gZXZlbnQuaGl0UG9pbnQ7XG4gICAgICAgICAgICBjb25zdCBsaW5lRGF0YSA9IHRoaXMuX2hhbmRsZURhdGFNYXBbZXZlbnQuaGFuZGxlTmFtZV07XG4gICAgICAgICAgICB0aGlzLl9jdXJIYW5kbGVEYXRhLmluZGV4ID0gbGluZURhdGEuY3VzdG9tRGF0YS5pbmRleDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5oYW5kbGVOYW1lID09PSBQb2x5Z29uSGFuZGxlVHlwZS5BcmVhKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJIYW5kbGVEYXRhLnR5cGUgPSBQb2x5Z29uSGFuZGxlVHlwZS5BcmVhO1xuICAgICAgICAgICAgdGhpcy5fY3VySGFuZGxlRGF0YS5kZWx0YVBvcyA9IG5ldyBWZWMzKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wYW5QbGFuZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB0aGlzLl9tb3VzZURvd25PblBsYW5lUG9zID0gbmV3IFZlYzMoKTtcblxuICAgICAgICB0aGlzLmdldFBvc2l0aW9uT25QYW5QbGFuZSh0aGlzLl9tb3VzZURvd25PblBsYW5lUG9zLCBldmVudC54LCBldmVudC55LCB0aGlzLl9wYW5QbGFuZSk7XG4gICAgICAgIGlmICh0aGlzLm9uQ29udHJvbGxlck1vdXNlRG93bikge1xuICAgICAgICAgICAgdGhpcy5vbkNvbnRyb2xsZXJNb3VzZURvd24oZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Nb3VzZU1vdmUoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICBldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMuZWRpdCB8fCAhdGhpcy5fcGFuUGxhbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9pc01vdXNlRG93bikge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmhhbmRsZU5hbWUuY2hhckF0KDApICE9PSAnbCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoaXRQb3MgPSBuZXcgVmVjMygpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldFBvc2l0aW9uT25QYW5QbGFuZShoaXRQb3MsIGV2ZW50LngsIGV2ZW50LnksIHRoaXMuX3BhblBsYW5lKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuaGFuZGxlTmFtZS5jaGFyQXQoMCkgPT09ICdwJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVsdGFQb3MgPSBuZXcgVmVjMyhoaXRQb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFQb3Muc3VidHJhY3QodGhpcy5fbW91c2VEb3duT25QbGFuZVBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJIYW5kbGVEYXRhLnR5cGUgPSBQb2x5Z29uSGFuZGxlVHlwZS5Qb2ludDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1ckhhbmRsZURhdGEuZGVsdGFQb3MgPSBkZWx0YVBvcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1ckhhbmRsZURhdGEuaW5kZXggPSB0aGlzLl9oYW5kbGVEYXRhTWFwW2V2ZW50LmhhbmRsZU5hbWVdLmN1c3RvbURhdGEuaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuaGFuZGxlTmFtZSA9PT0gUG9seWdvbkhhbmRsZVR5cGUuQXJlYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVsdGFQb3MgPSBuZXcgVmVjMyhoaXRQb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFQb3Muc3VidHJhY3QodGhpcy5fbW91c2VEb3duT25QbGFuZVBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJIYW5kbGVEYXRhLnR5cGUgPSBQb2x5Z29uSGFuZGxlVHlwZS5BcmVhO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VySGFuZGxlRGF0YS5kZWx0YVBvcyA9IGRlbHRhUG9zO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub25Db250cm9sbGVyTW91c2VNb3ZlKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ29udHJvbGxlck1vdXNlTW92ZShldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbk1vdXNlVXAoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICBldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMuZWRpdCB8fCAhdGhpcy5fcGFuUGxhbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9oaXRQb2ludCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3BhblBsYW5lLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jdXJIYW5kbGVEYXRhLnR5cGUgPSBQb2x5Z29uSGFuZGxlVHlwZS5Ob25lO1xuICAgICAgICB0aGlzLl9jdXJIYW5kbGVEYXRhLmRlbHRhUG9zID0gbmV3IFZlYzMoKTtcblxuICAgICAgICBpZiAodGhpcy5vbkNvbnRyb2xsZXJNb3VzZVVwKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ29udHJvbGxlck1vdXNlVXAoZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Ib3ZlckluKGV2ZW50OiBHaXptb01vdXNlRXZlbnQ8eyBpbmRleDogbnVtYmVyIH0+KSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnQuaGFuZGxlTmFtZS5jaGFyQXQoMCkgPT09ICdwJyB8fFxuICAgICAgICAgICAgZXZlbnQuaGFuZGxlTmFtZS5jaGFyQXQoMCkgPT09ICdsJykge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlRGF0YSA9IHRoaXMuX2hhbmRsZURhdGFNYXBbZXZlbnQuaGFuZGxlTmFtZV07XG4gICAgICAgICAgICBldmVudC5jdXN0b21EYXRhID0geyBpbmRleDogaGFuZGxlRGF0YS5jdXN0b21EYXRhLmluZGV4IH07XG4gICAgICAgICAgICB0aGlzLnNldEhhbmRsZUNvbG9yKGV2ZW50LmhhbmRsZU5hbWUsIHRoaXMuX2hvdmVyQ29sb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmhhbmRsZU5hbWUgPT09IFBvbHlnb25IYW5kbGVUeXBlLkFyZWEpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hcmVhTm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wYWNpdHkgPSBnZXROb2RlT3BhY2l0eSh0aGlzLl9hcmVhTm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKG9wYWNpdHkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SGFuZGxlQ29sb3IoZXZlbnQuaGFuZGxlTmFtZSwgdGhpcy5faG92ZXJDb2xvciwgb3BhY2l0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub25Db250cm9sbGVySG92ZXJJbikge1xuICAgICAgICAgICAgdGhpcy5vbkNvbnRyb2xsZXJIb3ZlckluKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uSG92ZXJPdXQoZXZlbnQ6IEdpem1vTW91c2VFdmVudDx7IGhvdmVySW5Ob2RlTWFwOiBNYXA8Tm9kZSwgYm9vbGVhbj4gfT4pIHtcbiAgICAgICAgc3VwZXIub25Ib3Zlck91dChldmVudCk7XG4gICAgICAgIGlmICh0aGlzLm9uQ29udHJvbGxlckhvdmVyT3V0KSB7XG4gICAgICAgICAgICB0aGlzLm9uQ29udHJvbGxlckhvdmVyT3V0KGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEhpdFBvaW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGl0UG9pbnQ7XG4gICAgfVxuXG4gICAgZ2V0SGFuZGxlRGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1ckhhbmRsZURhdGE7XG4gICAgfVxufVxuXG5jb25zdCBIYW5kbGVUeXBlID0gUG9seWdvbkNvbnRyb2xsZXIuUG9seWdvbkhhbmRsZVR5cGU7XG5cbmNvbnN0IHRlbXBWZWMzX2dpem1vID0gbmV3IFZlYzMoKTtcbmNvbnN0IHRlbXBRdWF0X2dpem1vID0gbmV3IFF1YXQoKTtcbmNvbnN0IHRlbXBNYXQ0ID0gbmV3IE1hdDQoKTtcbmNvbnN0IHRlbXBWZWMyID0gbmV3IFZlYzIoKTtcblxuY2xhc3MgUG9seWdvbkNvbGxpZGVyMkRHaXptbyBleHRlbmRzIEdpem1vQmFzZTxQb2x5Z29uQ29sbGlkZXIyRD4ge1xuICAgIHByaXZhdGUgX2NvbnRyb2xsZXIhOiBQb2x5Z29uQ29udHJvbGxlcjtcblxuICAgIHByaXZhdGUgX2xlZnREZWxldGVMaW5lITogTGluZUNvbnRyb2xsZXI7XG4gICAgcHJpdmF0ZSBfcmlnaHREZWxldGVMaW5lITogTGluZUNvbnRyb2xsZXI7XG4gICAgcHJpdmF0ZSBfb2Zmc2V0OiBWZWMyID0gbmV3IFZlYzIoKTtcbiAgICBwcml2YXRlIF9jdHJsS2V5ID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfbWV0YUtleSA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3Byb3BQYXRoOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF8zZFBvaW50czogVmVjM1tdID0gW107XG4gICAgcHJpdmF0ZSBfcG9pbnRzOiBWZWMyW10gPSBbXTtcblxuICAgIHByaXZhdGUgX2N1ckhvdmVySW5IYW5kbGVUeXBlOiBzdHJpbmcgPSBIYW5kbGVUeXBlLk5vbmU7XG4gICAgcHJpdmF0ZSBfY3VySG92ZXJJbkVsZW1JbmRleCA9IC0xO1xuICAgIHByaXZhdGUgX2lzRGVsZXRlUG9pbnRLZXlEb3duID0gZmFsc2U7XG5cbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLmNyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgb25TaG93KCkge1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNob3coKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgfVxuXG4gICAgb25IaWRlKCkge1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLmhpZGUoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVDb250cm9sbGVyKCkge1xuICAgICAgICBjb25zdCBnaXptb1Jvb3QgPSB0aGlzLmdldEdpem1vUm9vdCgpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyID0gbmV3IFBvbHlnb25Db250cm9sbGVyKGdpem1vUm9vdCwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuZWRpdGFibGUgPSB0cnVlO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLnNldENvbG9yKG5ldyBDb2xvcigxMDcsIDE5NCwgNTMpKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5zZXRFZGl0SGFuZGxlc0NvbG9yKG5ldyBDb2xvcigxMDcsIDE5NCwgNTMpKTtcblxuICAgICAgICB0aGlzLl9jb250cm9sbGVyLm9uQ29udHJvbGxlck1vdXNlRG93biA9IHRoaXMub25Db250cm9sbGVyTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIub25Db250cm9sbGVyTW91c2VNb3ZlID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZU1vdmUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZVVwID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZVVwLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIub25Db250cm9sbGVySG92ZXJJbiA9IHRoaXMub25Db250cm9sbGVySG92ZXJJbi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyLm9uQ29udHJvbGxlckhvdmVyT3V0ID0gdGhpcy5vbkNvbnRyb2xsZXJIb3Zlck91dC5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuX2xlZnREZWxldGVMaW5lID0gbmV3IExpbmVDb250cm9sbGVyKGdpem1vUm9vdCk7XG4gICAgICAgIHRoaXMuX2xlZnREZWxldGVMaW5lLnNldENvbG9yKENvbG9yLlJFRCk7XG4gICAgICAgIHRoaXMuX2xlZnREZWxldGVMaW5lLmhpZGUoKTtcbiAgICAgICAgdGhpcy5fcmlnaHREZWxldGVMaW5lID0gbmV3IExpbmVDb250cm9sbGVyKGdpem1vUm9vdCk7XG4gICAgICAgIHRoaXMuX3JpZ2h0RGVsZXRlTGluZS5zZXRDb2xvcihDb2xvci5SRUQpO1xuICAgICAgICB0aGlzLl9yaWdodERlbGV0ZUxpbmUuaGlkZSgpO1xuICAgIH1cblxuICAgIG9uQ29udHJvbGxlck1vdXNlRG93bigpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlRGF0YSA9IHRoaXMuX2NvbnRyb2xsZXIuZ2V0SGFuZGxlRGF0YSgpO1xuICAgICAgICBpZiAoIWhhbmRsZURhdGEgfHwgIXRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFuZGxlRGF0YS50eXBlID09PSBIYW5kbGVUeXBlLkxpbmUpIHtcbiAgICAgICAgICAgIGNvbnN0IGhpdFBvaW50ID0gaGFuZGxlRGF0YS5oaXRQb3M7XG4gICAgICAgICAgICBpZiAoaGl0UG9pbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9wUGF0aCA9IHRoaXMuZ2V0Q29tcFByb3BQYXRoKCdwb2ludHMnKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ29udHJvbFVwZGF0ZSh0aGlzLl9wcm9wUGF0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnRzID0gdGhpcy50YXJnZXQucG9pbnRzO1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGRUb0xvY2FsUG9zKHRlbXBWZWMzX2dpem1vLCBoaXRQb2ludCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy50YXJnZXQub2Zmc2V0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvc1ggPSB0b1ByZWNpc2lvbih0ZW1wVmVjM19naXptby54IC0gb2Zmc2V0LngsIDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvc1kgPSB0b1ByZWNpc2lvbih0ZW1wVmVjM19naXptby55IC0gb2Zmc2V0LnksIDEpO1xuXG4gICAgICAgICAgICAgICAgcG9pbnRzLnNwbGljZShoYW5kbGVEYXRhLmluZGV4ICsgMSwgMCwgbmV3IFZlYzIocG9zWCwgcG9zWSkpO1xuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0LnBvaW50cyA9IHBvaW50cztcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ29tcG9uZW50Q2hhbmdlZCh0aGlzLnRhcmdldC5ub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChoYW5kbGVEYXRhLnR5cGUgPT09IEhhbmRsZVR5cGUuUG9pbnQpIHtcbiAgICAgICAgICAgIHRoaXMub25Db250cm9sVXBkYXRlKHRoaXMuX3Byb3BQYXRoKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BQYXRoID0gdGhpcy5nZXRDb21wUHJvcFBhdGgoJ3BvaW50cycpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzRGVsZXRlUG9pbnRLZXlEb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnRzID0gdGhpcy50YXJnZXQucG9pbnRzO1xuICAgICAgICAgICAgICAgIHBvaW50cy5zcGxpY2UoaGFuZGxlRGF0YS5pbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQucG9pbnRzID0gcG9pbnRzO1xuICAgICAgICAgICAgICAgIHRoaXMub25Db21wb25lbnRDaGFuZ2VkKHRoaXMudGFyZ2V0Lm5vZGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1ckhvdmVySW5IYW5kbGVUeXBlID0gSGFuZGxlVHlwZS5Ob25lO1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1ckhvdmVySW5FbGVtSW5kZXggPSAtMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fcG9pbnRzID0gW107XG4gICAgICAgICAgICB0aGlzLnRhcmdldC5wb2ludHMuZm9yRWFjaCgocG9pbnQ6IFZlYzIpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wb2ludHMucHVzaChwb2ludC5jbG9uZSgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKGhhbmRsZURhdGEudHlwZSA9PT0gSGFuZGxlVHlwZS5BcmVhKSB7XG4gICAgICAgICAgICB0aGlzLl9vZmZzZXQgPSB0aGlzLnRhcmdldC5vZmZzZXQuY2xvbmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BQYXRoID0gdGhpcy5nZXRDb21wUHJvcFBhdGgoJ29mZnNldCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Db250cm9sbGVyTW91c2VNb3ZlKGV2ZW50OiBHaXptb01vdXNlRXZlbnQpIHtcbiAgICAgICAgdGhpcy5fY3RybEtleSA9IGV2ZW50LmN0cmxLZXk7XG4gICAgICAgIHRoaXMuX21ldGFLZXkgPSBldmVudC5tZXRhS2V5O1xuICAgICAgICB0aGlzLl9pc0RlbGV0ZVBvaW50S2V5RG93biA9IHRoaXMuX2N0cmxLZXkgfHwgdGhpcy5fbWV0YUtleTtcbiAgICAgICAgaWYgKHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlZCkge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlRGF0YSA9IHRoaXMuX2NvbnRyb2xsZXIuZ2V0SGFuZGxlRGF0YSgpO1xuICAgICAgICAgICAgaWYgKGhhbmRsZURhdGEudHlwZSA9PT0gSGFuZGxlVHlwZS5Qb2ludCkge1xuICAgICAgICAgICAgICAgIHRoaXMub25Db250cm9sVXBkYXRlKHRoaXMuX3Byb3BQYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVBvaW50cyhoYW5kbGVEYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFuZGxlRGF0YS50eXBlID09PSBIYW5kbGVUeXBlLkFyZWEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ29udHJvbFVwZGF0ZSh0aGlzLl9wcm9wUGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVBcmVhTW92ZShoYW5kbGVEYXRhLmRlbHRhUG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uQ29udHJvbGxlck1vdXNlVXAoKSB7XG4gICAgICAgIHRoaXMub25Db250cm9sRW5kKHRoaXMuX3Byb3BQYXRoKTtcbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJIb3ZlckluKGV2ZW50OiBHaXptb01vdXNlRXZlbnQ8eyBpbmRleDogbnVtYmVyIH0+KSB7XG4gICAgICAgIGlmIChldmVudC5oYW5kbGVOYW1lLmNoYXJBdCgwKSA9PT0gJ2wnKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJIb3ZlckluSGFuZGxlVHlwZSA9IEhhbmRsZVR5cGUuTGluZTtcbiAgICAgICAgICAgIHRoaXMuX2N1ckhvdmVySW5FbGVtSW5kZXggPSBldmVudC5jdXN0b21EYXRhPy5pbmRleCE7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuaGFuZGxlTmFtZS5jaGFyQXQoMCkgPT09ICdwJykge1xuICAgICAgICAgICAgdGhpcy5fY3VySG92ZXJJbkhhbmRsZVR5cGUgPSBIYW5kbGVUeXBlLlBvaW50O1xuICAgICAgICAgICAgdGhpcy5fY3VySG92ZXJJbkVsZW1JbmRleCA9IGV2ZW50LmN1c3RvbURhdGE/LmluZGV4ITtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5oYW5kbGVOYW1lID09PSBIYW5kbGVUeXBlLkFyZWEpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1ckhvdmVySW5IYW5kbGVUeXBlID0gSGFuZGxlVHlwZS5BcmVhO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Db250cm9sbGVySG92ZXJPdXQoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuaGFuZGxlTmFtZS5jaGFyQXQoMCkgPT09ICdsJykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1ckhvdmVySW5IYW5kbGVUeXBlID09PSBIYW5kbGVUeXBlLkxpbmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJIb3ZlckluSGFuZGxlVHlwZSA9IEhhbmRsZVR5cGUuTm9uZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJIb3ZlckluRWxlbUluZGV4ID0gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuaGFuZGxlTmFtZS5jaGFyQXQoMCkgPT09ICdwJykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1ckhvdmVySW5IYW5kbGVUeXBlID09PSBIYW5kbGVUeXBlLlBvaW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VySG92ZXJJbkhhbmRsZVR5cGUgPSBIYW5kbGVUeXBlLk5vbmU7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VySG92ZXJJbkVsZW1JbmRleCA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmhhbmRsZU5hbWUgPT09IEhhbmRsZVR5cGUuQXJlYSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1ckhvdmVySW5IYW5kbGVUeXBlID09PSBIYW5kbGVUeXBlLkFyZWEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJIb3ZlckluSGFuZGxlVHlwZSA9IEhhbmRsZVR5cGUuTm9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uS2V5RG93bihldmVudDogYW55KSB7XG4gICAgICAgIHRoaXMuX2N0cmxLZXkgPSBldmVudC5jdHJsS2V5O1xuICAgICAgICB0aGlzLl9tZXRhS2V5ID0gZXZlbnQubWV0YUtleTtcbiAgICAgICAgdGhpcy5faXNEZWxldGVQb2ludEtleURvd24gPSB0aGlzLl9jdHJsS2V5IHx8IHRoaXMuX21ldGFLZXk7XG4gICAgfVxuXG4gICAgb25LZXlVcChldmVudDogYW55KSB7XG4gICAgICAgIHRoaXMuX2N0cmxLZXkgPSBldmVudC5jdHJsS2V5O1xuICAgICAgICB0aGlzLl9tZXRhS2V5ID0gZXZlbnQubWV0YUtleTtcbiAgICAgICAgdGhpcy5faXNEZWxldGVQb2ludEtleURvd24gPSB0aGlzLl9jdHJsS2V5IHx8IHRoaXMuX21ldGFLZXk7XG4gICAgfVxuXG4gICAgd29ybGRUb0xvY2FsUG9zKG91dDogVmVjMywgaW5Qb3M6IFZlYzMpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy50YXJnZXQubm9kZTtcbiAgICAgICAgICAgIG5vZGUuZ2V0V29ybGRNYXRyaXgodGVtcE1hdDQpO1xuICAgICAgICAgICAgTWF0NC5pbnZlcnQodGVtcE1hdDQsIHRlbXBNYXQ0KTtcbiAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NChvdXQsIGluUG9zLCB0ZW1wTWF0NCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBoYW5kbGVBcmVhTW92ZShkZWx0YTogVmVjMykge1xuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMudGFyZ2V0Lm5vZGU7XG5cbiAgICAgICAgY29uc3QgcG9zRGVsdGE6IFZlYzMgPSBkZWx0YS5jbG9uZSgpO1xuICAgICAgICBub2RlLmdldFdvcmxkTWF0cml4KHRlbXBNYXQ0KTtcbiAgICAgICAgTWF0NC5pbnZlcnQodGVtcE1hdDQsIHRlbXBNYXQ0KTtcbiAgICAgICAgdGVtcE1hdDQubTEyID0gdGVtcE1hdDQubTEzID0gMDtcbiAgICAgICAgVmVjMy50cmFuc2Zvcm1NYXQ0KHBvc0RlbHRhLCBwb3NEZWx0YSwgdGVtcE1hdDQpO1xuICAgICAgICBtYWtlVmVjM0luUHJlY2lzaW9uKHBvc0RlbHRhLCAxKTtcbiAgICAgICAgcG9zRGVsdGEueiA9IDA7XG4gICAgICAgIHRlbXBWZWMyLnNldCh0aGlzLl9vZmZzZXQpO1xuICAgICAgICB0ZW1wVmVjMi5hZGQyZihwb3NEZWx0YS54LCBwb3NEZWx0YS55KTtcblxuICAgICAgICB0aGlzLnRhcmdldC5vZmZzZXQuc2V0KHRlbXBWZWMyKTtcbiAgICAgICAgdGhpcy5vbkNvbXBvbmVudENoYW5nZWQobm9kZSk7XG4gICAgfVxuXG4gICAgaGFuZGxlUG9pbnRzKGhhbmRsZU1vdmVEYXRhOiBJUG9seWdvbkhhbmRsZURhdGEpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBoYW5kbGVNb3ZlRGF0YS5pbmRleDtcbiAgICAgICAgaWYgKGluZGV4IDwgMCB8fCAhdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBvc0RlbHRhID0gaGFuZGxlTW92ZURhdGEuZGVsdGFQb3MuY2xvbmUoKTtcblxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy50YXJnZXQubm9kZTtcbiAgICAgICAgbm9kZS5nZXRXb3JsZE1hdHJpeCh0ZW1wTWF0NCk7XG4gICAgICAgIE1hdDQuaW52ZXJ0KHRlbXBNYXQ0LCB0ZW1wTWF0NCk7XG4gICAgICAgIHRlbXBNYXQ0Lm0xMiA9IHRlbXBNYXQ0Lm0xMyA9IDA7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NChwb3NEZWx0YSwgcG9zRGVsdGEsIHRlbXBNYXQ0KTtcblxuICAgICAgICBjb25zdCB0YXJnZXRQb2ludHMgPSB0aGlzLnRhcmdldC5wb2ludHM7XG4gICAgICAgIGNvbnN0IHBvaW50ID0gdGhpcy5fcG9pbnRzW2luZGV4XTtcblxuICAgICAgICBsZXQgcG9zWCA9IHBvaW50LnggKyBwb3NEZWx0YS54O1xuICAgICAgICBsZXQgcG9zWSA9IHBvaW50LnkgKyBwb3NEZWx0YS55O1xuICAgICAgICBwb3NYID0gdG9QcmVjaXNpb24ocG9zWCwgMSk7XG4gICAgICAgIHBvc1kgPSB0b1ByZWNpc2lvbihwb3NZLCAxKTtcbiAgICAgICAgdGFyZ2V0UG9pbnRzW2luZGV4XS5zZXQocG9zWCwgcG9zWSk7XG4gICAgICAgIHRoaXMudGFyZ2V0LnBvaW50cyA9IHRhcmdldFBvaW50cztcblxuICAgICAgICB0aGlzLm9uQ29tcG9uZW50Q2hhbmdlZChub2RlKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyRGF0YSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0luaXRpYWxpemVkIHx8IHRoaXMudGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwb2x5Z29uQ29sbGlkZXIyRCA9IHRoaXMudGFyZ2V0IGFzIFBvbHlnb25Db2xsaWRlcjJEO1xuICAgICAgICBpZiAocG9seWdvbkNvbGxpZGVyMkQpIHtcbiAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHBvbHlnb25Db2xsaWRlcjJELm9mZnNldDtcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IHRlbXBWZWMzX2dpem1vO1xuICAgICAgICAgICAgY2VudGVyLnggPSBvZmZzZXQueDtcbiAgICAgICAgICAgIGNlbnRlci55ID0gb2Zmc2V0Lnk7XG4gICAgICAgICAgICBjZW50ZXIueiA9IDA7XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnRhcmdldC5ub2RlO1xuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlLmdldFdvcmxkTWF0cml4KHRlbXBNYXQ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuXzNkUG9pbnRzLmxlbmd0aCA8IHBvbHlnb25Db2xsaWRlcjJELnBvaW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBwb2x5Z29uQ29sbGlkZXIyRC5wb2ludHMubGVuZ3RoIC0gdGhpcy5fM2RQb2ludHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fM2RQb2ludHMucHVzaChuZXcgVmVjMygwLCAwLCAwKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl8zZFBvaW50cy5sZW5ndGggPSBwb2x5Z29uQ29sbGlkZXIyRC5wb2ludHMubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9seWdvbkNvbGxpZGVyMkQucG9pbnRzLmZvckVhY2goKHBvaW50OiBWZWMyLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fM2RQb2ludHNbaW5kZXhdLnNldChwb2ludC54ICsgY2VudGVyLngsIHBvaW50LnkgKyBjZW50ZXIueSwgMCk7XG4gICAgICAgICAgICAgICAgVmVjMy50cmFuc2Zvcm1NYXQ0KHRoaXMuXzNkUG9pbnRzW2luZGV4XSwgdGhpcy5fM2RQb2ludHNbaW5kZXhdLCB0ZW1wTWF0NCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlRGF0YSh0aGlzLl8zZFBvaW50cyk7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLmVkaXQgPSBwb2x5Z29uQ29sbGlkZXIyRC5lZGl0aW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXJEYXRhKCk7XG4gICAgfVxuXG4gICAgb25UYXJnZXRVcGRhdGUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIG9uTm9kZUNoYW5nZWQoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlcigpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IG5hbWUgPSBqcy5nZXRDbGFzc05hbWUoUG9seWdvbkNvbGxpZGVyMkQpO1xuZXhwb3J0IGNvbnN0IFNlbGVjdEdpem1vID0gUG9seWdvbkNvbGxpZGVyMkRHaXptbztcbmV4cG9ydCBjb25zdCBJY29uR2l6bW8gPSBudWxsO1xuZXhwb3J0IGNvbnN0IFBlcnNpc3RlbnRHaXptbyA9IG51bGw7XG5cbnJlZ2lzdGVyR2l6bW8obmFtZSwgeyBTZWxlY3RHaXptbyB9KTtcbiJdfQ==