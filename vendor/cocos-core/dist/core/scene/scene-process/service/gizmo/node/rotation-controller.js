'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("../controller/base"));
const controller_shape_1 = __importDefault(require("../utils/controller-shape"));
const controller_utils_1 = __importDefault(require("../utils/controller-utils"));
const engine_utils_1 = require("../utils/engine-utils");
const cc_1 = require("cc");
const panPlaneLayer = cc_1.Layers.Enum.EDITOR;
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
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
const tempVec3_c = new cc_1.Vec3();
const tempVec3_d = new cc_1.Vec3();
const tempQuat = new cc_1.Quat();
const tempMat4 = new cc_1.Mat4();
function deg2rad(deg) {
    return deg * Math.PI / 180;
}
function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}
let _controller = null;
class RotationController extends base_1.default {
    _deltaRotation = new cc_1.Quat(0, 0, 0, 1);
    _rotFactor = 3;
    _baseRadius = 100;
    _tubeRadius = 3;
    _circleBorderNode;
    _circleBorderMR = null;
    _cutoffNode = null;
    _cutoffMR = null;
    _indicator = {};
    _mouseDownRot = new cc_1.Quat();
    _mouseDeltaPos = new cc_1.Vec2(0, 0);
    _indicatorStartDir = new cc_1.Vec3();
    _rotateAlignDir = new cc_1.Vec3();
    _transformAxisDir = new cc_1.Vec3();
    _axisDir = {};
    _deltaAngle = 0;
    _handleAxisDir = new cc_1.Vec3();
    _graduationNode = null;
    _graduationMR = null;
    get transformAxisDir() {
        return this._transformAxisDir;
    }
    get indicatorStartDir() {
        return this._indicatorStartDir;
    }
    constructor(rootNode) {
        super(rootNode);
        this._axisDir.x = new cc_1.Vec3(1, 0, 0);
        this._axisDir.y = new cc_1.Vec3(0, 1, 0);
        this._axisDir.z = new cc_1.Vec3(0, 0, 1);
        this._axisDir.w = new cc_1.Vec3(0, 0, 1); // for 2d z rotation, use w for hack
        this.initShape();
    }
    static getInstance(rootNode) {
        if (!_controller) {
            _controller = new RotationController(rootNode);
        }
        return _controller;
    }
    createRotationShape(axisName, torusRot, arrowRot, arcFromDir, arcRadian, color) {
        const baseArrowHeadHeight = 25;
        const baseArrowHeadRadius = 10;
        const baseArrowBodyHeight = 140;
        const baseRadius = this._baseRadius;
        const tubeRadius = this._tubeRadius;
        const topNode = (0, engine_utils_1.create3DNode)(axisName + 'Rotation');
        topNode.parent = this.shape;
        const torusNode = controller_utils_1.default.torus(baseRadius, tubeRadius, { arc: Math.abs(arcRadian) }, color);
        torusNode.name = axisName + 'RotationTorus';
        torusNode.parent = topNode;
        (0, engine_utils_1.setNodeOpacity)(torusNode, 0);
        torusNode.setRotationFromEuler(torusRot);
        const arrowNode = controller_utils_1.default.arrow(baseArrowHeadHeight, baseArrowHeadRadius, baseArrowBodyHeight, color);
        arrowNode.name = axisName + 'Axis';
        arrowNode.parent = topNode;
        arrowNode.setRotationFromEuler(arrowRot);
        const arcNode = controller_utils_1.default.arc(new cc_1.Vec3(), this._axisDir[axisName], arcFromDir, arcRadian, baseRadius, color, {
            noDepthTestForLines: true,
        });
        arcNode.parent = topNode;
        arcNode.name = axisName + 'RotationArc';
        // indicator circle
        const indicatorNode = controller_utils_1.default.arc(new cc_1.Vec3(), this._axisDir[axisName], arcFromDir, this._twoPI, baseRadius, color, {
            noDepthTestForLines: true,
        });
        indicatorNode.parent = topNode;
        indicatorNode.active = false;
        indicatorNode.name = axisName + 'IndicatorCircle';
        const axisData = this.initHandle(topNode, axisName);
        if (axisData) {
            axisData.normalTorusNode = arcNode;
            axisData.indicatorCircle = indicatorNode;
            axisData.arrowNode = arrowNode;
            axisData.arrowNode.active = false;
            axisData.normalTorusMR = (0, engine_utils_1.getModel)(axisData.normalTorusNode);
        }
    }
    // 创建刻度
    createGraduationShape(parent, color) {
        this._graduationNode = controller_utils_1.default.lines([new cc_1.Vec3(0, 0, 0), new cc_1.Vec3(0, 0, 0)], [0, 1], color, { noDepthTestForLines: true });
        this._graduationNode.parent = parent;
        this._graduationMR = (0, engine_utils_1.getModel)(this._graduationNode);
    }
    updateGraduation(normal, fromDir, graduationInterval) {
        cc_1.Vec3.normalize(tempVec3_a, fromDir);
        cc_1.Vec3.normalize(tempVec3_b, normal);
        const count = Math.round(360 / graduationInterval);
        const deltaRot = tempQuat;
        cc_1.Quat.fromAxisAngle(deltaRot, tempVec3_b, deg2rad(graduationInterval));
        const startPos = tempVec3_c;
        const pivotPos = this.getPosition();
        cc_1.Vec3.multiplyScalar(startPos, tempVec3_a, this._baseRadius * this.getDistScalar());
        const lineLength = 15;
        const endPos = tempVec3_d;
        cc_1.Vec3.multiplyScalar(endPos, tempVec3_a, (this._baseRadius - lineLength) * this.getDistScalar());
        const lineStartPos = [];
        const lineEndPos = [];
        for (let i = 0; i < count; i++) {
            lineStartPos[i] = pivotPos.clone();
            lineEndPos[i] = pivotPos.clone();
            lineStartPos[i].add(startPos);
            lineEndPos[i].add(endPos);
            cc_1.Vec3.transformQuat(startPos, startPos, deltaRot);
            cc_1.Vec3.transformQuat(endPos, endPos, deltaRot);
        }
        const points = [];
        const indices = [];
        for (let i = 0; i < count; i++) {
            points.push(lineStartPos[i]);
            points.push(lineEndPos[i]);
            indices.push(i * 2, i * 2 + 1);
        }
        if (this._graduationMR) {
            const lineData = controller_shape_1.default.calcLinesData(points, indices);
            (0, engine_utils_1.updatePositions)(this._graduationMR, lineData.positions);
            (0, engine_utils_1.updateIB)(this._graduationMR, lineData.indices || []);
        }
    }
    setGraduation(graduationInterval) {
        this.updateGraduation(this._transformAxisDir, this._indicatorStartDir, graduationInterval);
    }
    // 显示刻度尺
    showGraduation() {
        if (this._graduationNode) {
            this._graduationNode.active = true;
        }
    }
    hideGraduation() {
        if (this._graduationNode) {
            this._graduationNode.active = false;
        }
    }
    initShape() {
        this.createShapeNode('RotationController');
        this.registerEvents();
        this._baseRadius = 100;
        this._tubeRadius = 5;
        // x rotation
        this.createRotationShape('x', new cc_1.Vec3(0, 0, 90), new cc_1.Vec3(-90, -90, 0), this._axisDir.z, -this._twoPI, cc_1.Color.RED);
        // y rotation
        this.createRotationShape('y', new cc_1.Vec3(0, 0, 0), new cc_1.Vec3(0, 0, 0), this._axisDir.z, this._twoPI, cc_1.Color.GREEN);
        // z rotation
        this.createRotationShape('z', new cc_1.Vec3(-90, 0, 0), new cc_1.Vec3(90, 0, 90), this._axisDir.x, this._twoPI, cc_1.Color.BLUE);
        // for 2d z rotation, use w for hack
        this.createRotationShape('w', new cc_1.Vec3(-90, 0, 0), new cc_1.Vec3(0, 0, -90), this._axisDir.x, this._twoPI, cc_1.Color.BLUE);
        // circle border
        const editorCamera = getEditorCamera();
        const cameraNode = editorCamera?.node;
        const cameraRot = cameraNode?.getWorldRotation(tempQuat) ?? cc_1.Quat.IDENTITY;
        const cameraNormal = new cc_1.Vec3();
        cc_1.Vec3.transformQuat(cameraNormal, new cc_1.Vec3(0, 0, 1), cameraRot);
        const circleBorderNode = controller_utils_1.default.circle(new cc_1.Vec3(), cameraNormal, this._baseRadius, cc_1.Color.GRAY);
        circleBorderNode.name = 'circleBorder';
        circleBorderNode.parent = this._rootNode;
        (0, engine_utils_1.setNodeOpacity)(circleBorderNode, 200);
        this._circleBorderNode = circleBorderNode;
        this._circleBorderMR = (0, engine_utils_1.getModel)(circleBorderNode);
        this._circleBorderNode.setWorldPosition(this.getPosition());
        // for cut off
        const cutoffNode = controller_utils_1.default.disc(new cc_1.Vec3(), cc_1.Vec3.UNIT_Z, this._baseRadius, cc_1.Color.RED);
        (0, engine_utils_1.setNodeOpacity)(cutoffNode, 0);
        cutoffNode.name = 'cutoff';
        cutoffNode.parent = this._rootNode;
        cutoffNode.layer = panPlaneLayer;
        this._cutoffNode = cutoffNode;
        this._cutoffMR = (0, engine_utils_1.getModel)(cutoffNode);
        // for rotation indicator sector
        const indicator = {};
        indicator.sectorNode = controller_utils_1.default.sector(new cc_1.Vec3(), new cc_1.Vec3(0, 1, 0), new cc_1.Vec3(1, 0, 0), Math.PI, this._baseRadius, cc_1.Color.YELLOW, { unlit: true });
        (0, engine_utils_1.setNodeOpacity)(indicator.sectorNode, 200);
        indicator.sectorNode.parent = this._rootNode;
        indicator.sectorNode.active = false;
        indicator.meshRenderer = (0, engine_utils_1.getModel)(indicator.sectorNode);
        this._indicator = indicator;
        this.createGraduationShape(this._rootNode, cc_1.Color.YELLOW);
        this.hideGraduation();
        this.shape.active = false;
    }
    isHitOnAxisArrow(hitNode, axisName) {
        const arrowTopNode = this._handleDataMap[axisName]?.arrowNode;
        if (!arrowTopNode)
            return false;
        for (let i = 0; i < arrowTopNode.children.length; i++) {
            const child = arrowTopNode.children[i];
            if (hitNode === child) {
                return true;
            }
        }
        return false;
    }
    isInCutoffBack(axisName, x, y) {
        const hitAxisNode = this._handleDataMap[axisName]?.normalTorusNode;
        if (!hitAxisNode || !this._cutoffNode)
            return false;
        let results = (0, engine_utils_1.getRaycastResultsByNodes)([this._cutoffNode], x, y);
        if (results.length > 0) {
            const cutOffDist = results[0].distance;
            results = (0, engine_utils_1.getRaycastResultsByNodes)([hitAxisNode], x, y);
            if (results.length > 0) {
                const axisDist = results[0].distance;
                if (axisDist > cutOffDist) {
                    return true;
                }
            }
        }
        return false;
    }
    onMouseDown(event) {
        event.propagationStopped = true;
        if (!(this.transformToolData?.is2D ?? false) && this.isInCutoffBack(event.handleName, event.x, event.y)) {
            this._isMouseDown = false;
            return;
        }
        this._mouseDownRot = cc_1.Quat.clone(this.getRotation());
        this._mouseDeltaPos = new cc_1.Vec2(0, 0);
        // 计算旋转量参考坐标轴
        const hitPoint = event.hitPoint;
        cc_1.Vec3.copy(this._handleAxisDir, this._axisDir[event.handleName]);
        const axisDir = cc_1.Vec3.clone(this._handleAxisDir);
        const hitDir = new cc_1.Vec3();
        const crossDir = new cc_1.Vec3();
        this._indicatorStartDir = new cc_1.Vec3();
        this._deltaAngle = 0;
        const is2D = this.transformToolData?.is2D ?? false;
        if (is2D) {
            if (event.node && this.isHitOnAxisArrow(event.node, event.handleName)) {
                cc_1.Vec3.transformQuat(hitDir, new cc_1.Vec3(1, 0, 0), this.getRotation());
            }
            else {
                hitPoint && cc_1.Vec3.subtract(hitDir, hitPoint, this.getPosition());
            }
            // 2D情况下rotation扇形指示器从自身x轴为起始方向
            cc_1.Vec3.transformQuat(this._indicatorStartDir, new cc_1.Vec3(1, 0, 0), this.getRotation());
        }
        else {
            hitPoint && cc_1.Vec3.subtract(hitDir, hitPoint, this.getPosition());
            this._indicatorStartDir = hitDir;
        }
        cc_1.Vec3.normalize(hitDir, hitDir);
        cc_1.Vec3.transformQuat(axisDir, axisDir, this.getRotation());
        cc_1.Vec3.cross(crossDir, hitDir, axisDir);
        cc_1.Vec3.cross(hitDir, axisDir, crossDir);
        this._rotateAlignDir = crossDir;
        this._transformAxisDir = axisDir;
        // show indicator
        this.updateRotationIndicator(this._transformAxisDir, this._indicatorStartDir, 0);
        this._indicator.sectorNode.active = true;
        this._handleDataMap[event.handleName].indicatorCircle.active = true;
        // hide border
        this._circleBorderNode.active = false;
        Object.keys(this._handleDataMap).forEach((key) => {
            if (key === event.handleName) {
                this._handleDataMap[key].normalTorusNode.active = false;
                this._handleDataMap[key].arrowNode.active = true;
            }
            else {
                this._handleDataMap[key].topNode.active = false;
            }
        });
        // CLI: no pointer lock
        if (this.onControllerMouseDown) {
            this.onControllerMouseDown(event);
        }
    }
    onMouseMove(event) {
        event.propagationStopped = true;
        if (this._isMouseDown) {
            const deltaX = clamp(event.moveDeltaX, -10, 10);
            const deltaY = clamp(event.moveDeltaY, -10, 10);
            this._mouseDeltaPos.x += deltaX;
            this._mouseDeltaPos.y += deltaY;
            cc_1.Quat.identity(this._deltaRotation);
            let radian = 0;
            if (event.handleName.length === 1) {
                const alignAxisMoveDist = this.getAlignAxisMoveDistance(this._rotateAlignDir, this._mouseDeltaPos);
                this._deltaAngle = -alignAxisMoveDist / this._rotFactor;
                radian = this._deltaAngle * this._degreeToRadianFactor;
                cc_1.Vec3.copy(this._handleAxisDir, this._axisDir[event.handleName]);
                cc_1.Quat.fromAxisAngle(this._deltaRotation, this._handleAxisDir, radian);
            }
            this.updateRotationIndicator(this._transformAxisDir, this._indicatorStartDir, radian);
            const rot = this.getRotation();
            cc_1.Quat.multiply(rot, this._mouseDownRot, this._deltaRotation);
            if (this.isLock) {
                if (this.onControllerMouseMove) {
                    this.onControllerMouseMove(event);
                }
                return;
            }
            this.setRotation(rot);
            if (this.onControllerMouseMove) {
                this.onControllerMouseMove(event);
            }
            this.updateController();
        }
    }
    /**
     * 重置所有 handle 的节点的可见性
     */
    resetAllHandelNodes() {
        const is2D = this.transformToolData?.is2D ?? false;
        if (is2D) {
            this._handleDataMap.w.indicatorCircle.active = false;
            this._handleDataMap.w.normalTorusNode.active = true;
            this._handleDataMap.w.topNode.active = true;
        }
        else {
            Object.keys(this._handleDataMap).forEach((key) => {
                if (key !== 'w') {
                    this._handleDataMap[key].normalTorusNode.active = true;
                    this._handleDataMap[key].topNode.active = true;
                    this._handleDataMap[key].indicatorCircle.active = false;
                    this._handleDataMap[key].arrowNode.active = false;
                }
            });
        }
    }
    onMouseUp(event) {
        event.propagationStopped = true;
        // CLI: no pointer lock to exit
        this._indicator.sectorNode.active = false;
        cc_1.Quat.identity(this._deltaRotation);
        const is2D = this.transformToolData?.is2D ?? false;
        if (!is2D) {
            // show border
            this._circleBorderNode.active = true;
        }
        this.resetAllHandelNodes();
        if (this.onControllerMouseUp) {
            this.onControllerMouseUp(event);
        }
        this._handleAxisDir.set(0, 0, 0);
    }
    onMouseLeave(event) {
        this.onMouseUp(event);
    }
    onHoverIn(event) {
        if (!(this.transformToolData?.is2D ?? false) && this.isInCutoffBack(event.handleName, event.x, event.y)) {
            return;
        }
        this.setHandleColor(event.handleName, cc_1.Color.YELLOW);
        Object.keys(this._handleDataMap).forEach((key) => {
            if (key !== event.handleName) {
                this.setNodesOpacity(this._handleDataMap[key].rendererNodes, 50);
            }
        });
    }
    onHoverOut(event) {
        this.resetHandleColor(event);
        Object.keys(this._handleDataMap).forEach((key) => {
            this.setNodesOpacity(this._handleDataMap[key].rendererNodes, 255);
        });
    }
    setNodesOpacity(nodes, opacity) {
        nodes.forEach((node) => {
            (0, engine_utils_1.setNodeOpacity)(node, opacity);
        });
    }
    getDeltaRotation() {
        return this._deltaRotation;
    }
    getDeltaAngle() {
        return this._deltaAngle;
    }
    getHandleAxisDir() {
        return this._handleAxisDir;
    }
    onShow() {
        this.registerEvents();
        const is2D = this.transformToolData?.is2D ?? false;
        if (is2D) {
            this._handleDataMap.x.topNode.active = false;
            this._handleDataMap.y.topNode.active = false;
            this._handleDataMap.z.topNode.active = false;
            this._handleDataMap.w.topNode.active = true;
            this._handleDataMap.w.arrowNode.active = true;
            this._circleBorderNode.active = false;
            this._cutoffNode.active = false;
            this.updateController();
        }
        else {
            this._handleDataMap.x.topNode.active = true;
            this._handleDataMap.y.topNode.active = true;
            this._handleDataMap.z.topNode.active = true;
            this._handleDataMap.w.topNode.active = false;
            this._handleDataMap.w.arrowNode.active = false;
            this._circleBorderNode.active = true;
            this._cutoffNode.active = true;
        }
    }
    onHide() {
        this.unregisterEvents();
        // CLI: no pointer lock to exit
        this._indicator.sectorNode.active = false;
        this._circleBorderNode.active = false;
        this._cutoffNode.active = false;
        this.resetAllHandelNodes();
    }
    updateRotationIndicator(normal, fromDir, radian) {
        const positions = controller_shape_1.default.calcSectorPoints(this.getPosition(), normal, fromDir, radian, this._baseRadius * this.getDistScalar(), 60);
        (0, engine_utils_1.updatePositions)(this._indicator.meshRenderer, positions);
    }
    adjustControllerSize() {
        const scalar = this.getDistScalar();
        const scale = this.getScale();
        const newScale = tempVec3_a;
        cc_1.Vec3.copy(newScale, scale);
        newScale.multiplyScalar(scalar);
        this.shape.setScale(newScale);
        // update circle border
        this._circleBorderNode.setScale(newScale);
        this._circleBorderNode.setWorldPosition(this.getPosition());
        const editorCamera = getEditorCamera();
        const cameraNode = editorCamera?.node;
        const cameraRot = cameraNode?.getWorldRotation(tempQuat) ?? cc_1.Quat.IDENTITY;
        const cameraNormal = tempVec3_b;
        cc_1.Vec3.transformQuat(cameraNormal, cc_1.Vec3.UNIT_Z, cameraRot);
        let positions = controller_shape_1.default.calcCirclePoints(cc_1.Vec3.ZERO, cameraNormal, this._baseRadius);
        (0, engine_utils_1.updatePositions)(this._circleBorderMR, positions);
        // update cutoff
        this._cutoffNode.setScale(newScale);
        this._cutoffNode.setWorldPosition(this.getPosition());
        this._cutoffNode.setWorldRotation(cameraRot);
        const localCamNormal = tempVec3_b;
        const worldToLocalMat = tempMat4;
        this.shape.getWorldMatrix(worldToLocalMat);
        cc_1.Mat4.invert(worldToLocalMat, worldToLocalMat);
        cc_1.Vec3.transformMat4Normal(localCamNormal, cameraNormal, worldToLocalMat);
        const is2D = this.transformToolData?.is2D ?? false;
        if (!is2D) {
            Object.keys(this._handleDataMap).forEach((key) => {
                if (key !== 'w') {
                    const from = tempVec3_c;
                    const axisDir = this._axisDir[key];
                    cc_1.Vec3.cross(from, axisDir, localCamNormal);
                    cc_1.Vec3.normalize(from, from);
                    positions = controller_shape_1.default.calcArcPoints(cc_1.Vec3.ZERO, axisDir, from, -Math.PI, this._baseRadius);
                    const axisData = this._handleDataMap[key];
                    (0, engine_utils_1.updatePositions)(axisData.normalTorusMR, positions);
                }
            });
        }
    }
}
exports.default = RotationController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm90YXRpb24tY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9naXptby9ub2RlL3JvdGF0aW9uLWNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7OztBQUViLDhEQUFnRDtBQUNoRCxpRkFBd0Q7QUFDeEQsaUZBQXdEO0FBRXhELHdEQVErQjtBQUMvQiwyQkFBK0U7QUFFL0UsTUFBTSxhQUFhLEdBQUcsV0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFFekM7O0dBRUc7QUFDSCxTQUFTLGVBQWU7SUFDcEIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BELE9BQU8sT0FBTyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBQzlCLE1BQU0sVUFBVSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFDOUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUM5QixNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO0FBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUU1QixTQUFTLE9BQU8sQ0FBQyxHQUFXO0lBQ3hCLE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQy9CLENBQUM7QUFFRCxTQUFTLEtBQUss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RUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBRWhHLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzFDLElBQUEsOEJBQWUsRUFBQyxRQUFRLENBQUMsYUFBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN4RCxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsa0JBQWUsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBDb250cm9sbGVyQmFzZSBmcm9tICcuLi9jb250cm9sbGVyL2Jhc2UnO1xuaW1wb3J0IENvbnRyb2xsZXJTaGFwZSBmcm9tICcuLi91dGlscy9jb250cm9sbGVyLXNoYXBlJztcbmltcG9ydCBDb250cm9sbGVyVXRpbHMgZnJvbSAnLi4vdXRpbHMvY29udHJvbGxlci11dGlscyc7XG5pbXBvcnQgdHlwZSB7IEdpem1vTW91c2VFdmVudCB9IGZyb20gJy4uL3V0aWxzL2RlZmluZXMnO1xuaW1wb3J0IHtcbiAgICBzZXROb2RlT3BhY2l0eSxcbiAgICBnZXRNb2RlbCxcbiAgICB1cGRhdGVJQixcbiAgICB1cGRhdGVQb3NpdGlvbnMsXG4gICAgY3JlYXRlM0ROb2RlLFxuICAgIHNldE1lc2hDb2xvcixcbiAgICBnZXRSYXljYXN0UmVzdWx0c0J5Tm9kZXMsXG59IGZyb20gJy4uL3V0aWxzL2VuZ2luZS11dGlscyc7XG5pbXBvcnQgeyBMYXllcnMsIE5vZGUsIFF1YXQsIFZlYzMsIENvbG9yLCBNZXNoUmVuZGVyZXIsIFZlYzIsIE1hdDQgfSBmcm9tICdjYyc7XG5cbmNvbnN0IHBhblBsYW5lTGF5ZXIgPSBMYXllcnMuRW51bS5FRElUT1I7XG5cbi8qKlxuICog6I635Y+W57yW6L6R5Zmo5pGE5YOP5py657uE5Lu277yI5oOw5oCn6K6/6Zeu6YG/5YWN5b6q546v5L6d6LWW77yJXG4gKi9cbmZ1bmN0aW9uIGdldEVkaXRvckNhbWVyYSgpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgU2VydmljZSB9ID0gcmVxdWlyZSgnLi4vLi4vY29yZS9kZWNvcmF0b3InKTtcbiAgICAgICAgcmV0dXJuIFNlcnZpY2UuQ2FtZXJhPy5nZXRDYW1lcmE/LigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5jb25zdCB0ZW1wVmVjM19hID0gbmV3IFZlYzMoKTtcbmNvbnN0IHRlbXBWZWMzX2IgPSBuZXcgVmVjMygpO1xuY29uc3QgdGVtcFZlYzNfYyA9IG5ldyBWZWMzKCk7XG5jb25zdCB0ZW1wVmVjM19kID0gbmV3IFZlYzMoKTtcbmNvbnN0IHRlbXBRdWF0ID0gbmV3IFF1YXQoKTtcbmNvbnN0IHRlbXBNYXQ0ID0gbmV3IE1hdDQoKTtcblxuZnVuY3Rpb24gZGVnMnJhZChkZWc6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIGRlZyAqIE1hdGguUEkgLyAxODA7XG59XG5cbmZ1bmN0aW9uIGNsYW1wKHZhbDogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWwsIG1pbiksIG1heCk7XG59XG5cbmxldCBfY29udHJvbGxlcjogUm90YXRpb25Db250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG5cbmNsYXNzIFJvdGF0aW9uQ29udHJvbGxlciBleHRlbmRzIENvbnRyb2xsZXJCYXNlIHtcbiAgICBwcml2YXRlIF9kZWx0YVJvdGF0aW9uOiBRdWF0ID0gbmV3IFF1YXQoMCwgMCwgMCwgMSk7XG4gICAgcHJpdmF0ZSBfcm90RmFjdG9yID0gMztcblxuICAgIHByaXZhdGUgX2Jhc2VSYWRpdXMgPSAxMDA7XG4gICAgcHJpdmF0ZSBfdHViZVJhZGl1cyA9IDM7XG4gICAgcHJpdmF0ZSBfY2lyY2xlQm9yZGVyTm9kZSE6IE5vZGU7XG4gICAgcHJpdmF0ZSBfY2lyY2xlQm9yZGVyTVI6IE1lc2hSZW5kZXJlciB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX2N1dG9mZk5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9jdXRvZmZNUjogTWVzaFJlbmRlcmVyIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfaW5kaWNhdG9yOiBhbnkgPSB7fTtcbiAgICBwcml2YXRlIF9tb3VzZURvd25Sb3Q6IFF1YXQgPSBuZXcgUXVhdCgpO1xuICAgIHByaXZhdGUgX21vdXNlRGVsdGFQb3M6IFZlYzIgPSBuZXcgVmVjMigwLCAwKTtcbiAgICBwcml2YXRlIF9pbmRpY2F0b3JTdGFydERpcjogVmVjMyA9IG5ldyBWZWMzKCk7XG4gICAgcHJpdmF0ZSBfcm90YXRlQWxpZ25EaXI6IFZlYzMgPSBuZXcgVmVjMygpO1xuICAgIHByaXZhdGUgX3RyYW5zZm9ybUF4aXNEaXI6IFZlYzMgPSBuZXcgVmVjMygpO1xuICAgIHByaXZhdGUgX2F4aXNEaXI6IGFueSA9IHt9O1xuICAgIHByaXZhdGUgX2RlbHRhQW5nbGUgPSAwO1xuICAgIHByaXZhdGUgX2hhbmRsZUF4aXNEaXIgPSBuZXcgVmVjMygpO1xuICAgIHByaXZhdGUgX2dyYWR1YXRpb25Ob2RlOiBOb2RlIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfZ3JhZHVhdGlvbk1SOiBNZXNoUmVuZGVyZXIgfCBudWxsID0gbnVsbDtcblxuICAgIHB1YmxpYyBnZXQgdHJhbnNmb3JtQXhpc0RpcigpOiBWZWMzIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybUF4aXNEaXI7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBpbmRpY2F0b3JTdGFydERpcigpOiBWZWMzIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luZGljYXRvclN0YXJ0RGlyO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHJvb3ROb2RlOiBOb2RlKSB7XG4gICAgICAgIHN1cGVyKHJvb3ROb2RlKTtcblxuICAgICAgICB0aGlzLl9heGlzRGlyLnggPSBuZXcgVmVjMygxLCAwLCAwKTtcbiAgICAgICAgdGhpcy5fYXhpc0Rpci55ID0gbmV3IFZlYzMoMCwgMSwgMCk7XG4gICAgICAgIHRoaXMuX2F4aXNEaXIueiA9IG5ldyBWZWMzKDAsIDAsIDEpO1xuICAgICAgICB0aGlzLl9heGlzRGlyLncgPSBuZXcgVmVjMygwLCAwLCAxKTsgLy8gZm9yIDJkIHogcm90YXRpb24sIHVzZSB3IGZvciBoYWNrXG4gICAgICAgIHRoaXMuaW5pdFNoYXBlKCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldEluc3RhbmNlKHJvb3ROb2RlOiBOb2RlKTogUm90YXRpb25Db250cm9sbGVyIHtcbiAgICAgICAgaWYgKCFfY29udHJvbGxlcikge1xuICAgICAgICAgICAgX2NvbnRyb2xsZXIgPSBuZXcgUm90YXRpb25Db250cm9sbGVyKHJvb3ROb2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX2NvbnRyb2xsZXI7XG4gICAgfVxuXG4gICAgY3JlYXRlUm90YXRpb25TaGFwZShheGlzTmFtZTogc3RyaW5nLCB0b3J1c1JvdDogVmVjMywgYXJyb3dSb3Q6IFZlYzMsIGFyY0Zyb21EaXI6IFZlYzMsIGFyY1JhZGlhbjogbnVtYmVyLCBjb2xvcjogQ29sb3IpIHtcbiAgICAgICAgY29uc3QgYmFzZUFycm93SGVhZEhlaWdodCA9IDI1O1xuICAgICAgICBjb25zdCBiYXNlQXJyb3dIZWFkUmFkaXVzID0gMTA7XG4gICAgICAgIGNvbnN0IGJhc2VBcnJvd0JvZHlIZWlnaHQgPSAxNDA7XG5cbiAgICAgICAgY29uc3QgYmFzZVJhZGl1cyA9IHRoaXMuX2Jhc2VSYWRpdXM7XG4gICAgICAgIGNvbnN0IHR1YmVSYWRpdXMgPSB0aGlzLl90dWJlUmFkaXVzO1xuXG4gICAgICAgIGNvbnN0IHRvcE5vZGUgPSBjcmVhdGUzRE5vZGUoYXhpc05hbWUgKyAnUm90YXRpb24nKTtcbiAgICAgICAgdG9wTm9kZS5wYXJlbnQgPSB0aGlzLnNoYXBlO1xuXG4gICAgICAgIGNvbnN0IHRvcnVzTm9kZSA9IENvbnRyb2xsZXJVdGlscy50b3J1cyhiYXNlUmFkaXVzLCB0dWJlUmFkaXVzLCB7IGFyYzogTWF0aC5hYnMoYXJjUmFkaWFuKSB9LCBjb2xvcik7XG4gICAgICAgIHRvcnVzTm9kZS5uYW1lID0gYXhpc05hbWUgKyAnUm90YXRpb25Ub3J1cyc7XG4gICAgICAgIHRvcnVzTm9kZS5wYXJlbnQgPSB0b3BOb2RlO1xuICAgICAgICBzZXROb2RlT3BhY2l0eSh0b3J1c05vZGUsIDApO1xuICAgICAgICB0b3J1c05vZGUuc2V0Um90YXRpb25Gcm9tRXVsZXIodG9ydXNSb3QpO1xuXG4gICAgICAgIGNvbnN0IGFycm93Tm9kZSA9IENvbnRyb2xsZXJVdGlscy5hcnJvdyhiYXNlQXJyb3dIZWFkSGVpZ2h0LCBiYXNlQXJyb3dIZWFkUmFkaXVzLCBiYXNlQXJyb3dCb2R5SGVpZ2h0LCBjb2xvcik7XG4gICAgICAgIGFycm93Tm9kZS5uYW1lID0gYXhpc05hbWUgKyAnQXhpcyc7XG4gICAgICAgIGFycm93Tm9kZS5wYXJlbnQgPSB0b3BOb2RlO1xuICAgICAgICBhcnJvd05vZGUuc2V0Um90YXRpb25Gcm9tRXVsZXIoYXJyb3dSb3QpO1xuXG4gICAgICAgIGNvbnN0IGFyY05vZGUgPSBDb250cm9sbGVyVXRpbHMuYXJjKG5ldyBWZWMzKCksIHRoaXMuX2F4aXNEaXJbYXhpc05hbWVdLCBhcmNGcm9tRGlyLCBhcmNSYWRpYW4sIGJhc2VSYWRpdXMsIGNvbG9yLCB7XG4gICAgICAgICAgICBub0RlcHRoVGVzdEZvckxpbmVzOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgYXJjTm9kZS5wYXJlbnQgPSB0b3BOb2RlO1xuICAgICAgICBhcmNOb2RlLm5hbWUgPSBheGlzTmFtZSArICdSb3RhdGlvbkFyYyc7XG5cbiAgICAgICAgLy8gaW5kaWNhdG9yIGNpcmNsZVxuICAgICAgICBjb25zdCBpbmRpY2F0b3JOb2RlID0gQ29udHJvbGxlclV0aWxzLmFyYyhuZXcgVmVjMygpLCB0aGlzLl9heGlzRGlyW2F4aXNOYW1lXSwgYXJjRnJvbURpciwgdGhpcy5fdHdvUEksIGJhc2VSYWRpdXMsIGNvbG9yLCB7XG4gICAgICAgICAgICBub0RlcHRoVGVzdEZvckxpbmVzOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgaW5kaWNhdG9yTm9kZS5wYXJlbnQgPSB0b3BOb2RlO1xuICAgICAgICBpbmRpY2F0b3JOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICBpbmRpY2F0b3JOb2RlLm5hbWUgPSBheGlzTmFtZSArICdJbmRpY2F0b3JDaXJjbGUnO1xuXG4gICAgICAgIGNvbnN0IGF4aXNEYXRhID0gdGhpcy5pbml0SGFuZGxlKHRvcE5vZGUsIGF4aXNOYW1lKTtcbiAgICAgICAgaWYgKGF4aXNEYXRhKSB7XG4gICAgICAgICAgICBheGlzRGF0YS5ub3JtYWxUb3J1c05vZGUgPSBhcmNOb2RlO1xuICAgICAgICAgICAgYXhpc0RhdGEuaW5kaWNhdG9yQ2lyY2xlID0gaW5kaWNhdG9yTm9kZTtcbiAgICAgICAgICAgIGF4aXNEYXRhLmFycm93Tm9kZSA9IGFycm93Tm9kZTtcbiAgICAgICAgICAgIGF4aXNEYXRhLmFycm93Tm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGF4aXNEYXRhLm5vcm1hbFRvcnVzTVIgPSBnZXRNb2RlbChheGlzRGF0YS5ub3JtYWxUb3J1c05vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5Yib5bu65Yi75bqmXG4gICAgY3JlYXRlR3JhZHVhdGlvblNoYXBlKHBhcmVudDogTm9kZSwgY29sb3I/OiBDb2xvcikge1xuICAgICAgICB0aGlzLl9ncmFkdWF0aW9uTm9kZSA9IENvbnRyb2xsZXJVdGlscy5saW5lcyhcbiAgICAgICAgICAgIFtuZXcgVmVjMygwLCAwLCAwKSwgbmV3IFZlYzMoMCwgMCwgMCldLFxuICAgICAgICAgICAgWzAsIDFdLFxuICAgICAgICAgICAgY29sb3IsXG4gICAgICAgICAgICB7IG5vRGVwdGhUZXN0Rm9yTGluZXM6IHRydWUgfSxcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fZ3JhZHVhdGlvbk5vZGUucGFyZW50ID0gcGFyZW50O1xuICAgICAgICB0aGlzLl9ncmFkdWF0aW9uTVIgPSBnZXRNb2RlbCh0aGlzLl9ncmFkdWF0aW9uTm9kZSk7XG4gICAgfVxuXG4gICAgdXBkYXRlR3JhZHVhdGlvbihub3JtYWw6IFZlYzMsIGZyb21EaXI6IFZlYzMsIGdyYWR1YXRpb25JbnRlcnZhbDogbnVtYmVyKSB7XG4gICAgICAgIFZlYzMubm9ybWFsaXplKHRlbXBWZWMzX2EsIGZyb21EaXIpO1xuICAgICAgICBWZWMzLm5vcm1hbGl6ZSh0ZW1wVmVjM19iLCBub3JtYWwpO1xuXG4gICAgICAgIGNvbnN0IGNvdW50ID0gTWF0aC5yb3VuZCgzNjAgLyBncmFkdWF0aW9uSW50ZXJ2YWwpO1xuICAgICAgICBjb25zdCBkZWx0YVJvdCA9IHRlbXBRdWF0O1xuICAgICAgICBRdWF0LmZyb21BeGlzQW5nbGUoZGVsdGFSb3QsIHRlbXBWZWMzX2IsIGRlZzJyYWQoZ3JhZHVhdGlvbkludGVydmFsKSk7XG4gICAgICAgIGNvbnN0IHN0YXJ0UG9zID0gdGVtcFZlYzNfYztcbiAgICAgICAgY29uc3QgcGl2b3RQb3MgPSB0aGlzLmdldFBvc2l0aW9uKCk7XG4gICAgICAgIFZlYzMubXVsdGlwbHlTY2FsYXIoc3RhcnRQb3MsIHRlbXBWZWMzX2EsIHRoaXMuX2Jhc2VSYWRpdXMgKiB0aGlzLmdldERpc3RTY2FsYXIoKSk7XG4gICAgICAgIGNvbnN0IGxpbmVMZW5ndGggPSAxNTtcbiAgICAgICAgY29uc3QgZW5kUG9zID0gdGVtcFZlYzNfZDtcbiAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcihlbmRQb3MsIHRlbXBWZWMzX2EsICh0aGlzLl9iYXNlUmFkaXVzIC0gbGluZUxlbmd0aCkgKiB0aGlzLmdldERpc3RTY2FsYXIoKSk7XG5cbiAgICAgICAgY29uc3QgbGluZVN0YXJ0UG9zID0gW107XG4gICAgICAgIGNvbnN0IGxpbmVFbmRQb3MgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBsaW5lU3RhcnRQb3NbaV0gPSBwaXZvdFBvcy5jbG9uZSgpO1xuICAgICAgICAgICAgbGluZUVuZFBvc1tpXSA9IHBpdm90UG9zLmNsb25lKCk7XG4gICAgICAgICAgICBsaW5lU3RhcnRQb3NbaV0uYWRkKHN0YXJ0UG9zKTtcbiAgICAgICAgICAgIGxpbmVFbmRQb3NbaV0uYWRkKGVuZFBvcyk7XG4gICAgICAgICAgICBWZWMzLnRyYW5zZm9ybVF1YXQoc3RhcnRQb3MsIHN0YXJ0UG9zLCBkZWx0YVJvdCk7XG4gICAgICAgICAgICBWZWMzLnRyYW5zZm9ybVF1YXQoZW5kUG9zLCBlbmRQb3MsIGRlbHRhUm90KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBvaW50cyA9IFtdO1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgcG9pbnRzLnB1c2gobGluZVN0YXJ0UG9zW2ldKTtcbiAgICAgICAgICAgIHBvaW50cy5wdXNoKGxpbmVFbmRQb3NbaV0pO1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkgKiAyLCBpICogMiArIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2dyYWR1YXRpb25NUikge1xuICAgICAgICAgICAgY29uc3QgbGluZURhdGEgPSBDb250cm9sbGVyU2hhcGUuY2FsY0xpbmVzRGF0YShwb2ludHMsIGluZGljZXMpO1xuICAgICAgICAgICAgdXBkYXRlUG9zaXRpb25zKHRoaXMuX2dyYWR1YXRpb25NUiwgbGluZURhdGEucG9zaXRpb25zIGFzIFZlYzNbXSk7XG4gICAgICAgICAgICB1cGRhdGVJQih0aGlzLl9ncmFkdWF0aW9uTVIsIGxpbmVEYXRhLmluZGljZXMgfHwgW10pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNldEdyYWR1YXRpb24oZ3JhZHVhdGlvbkludGVydmFsOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy51cGRhdGVHcmFkdWF0aW9uKHRoaXMuX3RyYW5zZm9ybUF4aXNEaXIsIHRoaXMuX2luZGljYXRvclN0YXJ0RGlyLCBncmFkdWF0aW9uSW50ZXJ2YWwpO1xuICAgIH1cblxuICAgIC8vIOaYvuekuuWIu+W6puWwulxuICAgIHB1YmxpYyBzaG93R3JhZHVhdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2dyYWR1YXRpb25Ob2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9ncmFkdWF0aW9uTm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGhpZGVHcmFkdWF0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fZ3JhZHVhdGlvbk5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2dyYWR1YXRpb25Ob2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5pdFNoYXBlKCkge1xuICAgICAgICB0aGlzLmNyZWF0ZVNoYXBlTm9kZSgnUm90YXRpb25Db250cm9sbGVyJyk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJFdmVudHMoKTtcblxuICAgICAgICB0aGlzLl9iYXNlUmFkaXVzID0gMTAwO1xuICAgICAgICB0aGlzLl90dWJlUmFkaXVzID0gNTtcblxuICAgICAgICAvLyB4IHJvdGF0aW9uXG4gICAgICAgIHRoaXMuY3JlYXRlUm90YXRpb25TaGFwZSgneCcsIG5ldyBWZWMzKDAsIDAsIDkwKSwgbmV3IFZlYzMoLTkwLCAtOTAsIDApLCB0aGlzLl9heGlzRGlyLnosIC10aGlzLl90d29QSSwgQ29sb3IuUkVEKTtcbiAgICAgICAgLy8geSByb3RhdGlvblxuICAgICAgICB0aGlzLmNyZWF0ZVJvdGF0aW9uU2hhcGUoJ3knLCBuZXcgVmVjMygwLCAwLCAwKSwgbmV3IFZlYzMoMCwgMCwgMCksIHRoaXMuX2F4aXNEaXIueiwgdGhpcy5fdHdvUEksIENvbG9yLkdSRUVOKTtcbiAgICAgICAgLy8geiByb3RhdGlvblxuICAgICAgICB0aGlzLmNyZWF0ZVJvdGF0aW9uU2hhcGUoJ3onLCBuZXcgVmVjMygtOTAsIDAsIDApLCBuZXcgVmVjMyg5MCwgMCwgOTApLCB0aGlzLl9heGlzRGlyLngsIHRoaXMuX3R3b1BJLCBDb2xvci5CTFVFKTtcbiAgICAgICAgLy8gZm9yIDJkIHogcm90YXRpb24sIHVzZSB3IGZvciBoYWNrXG4gICAgICAgIHRoaXMuY3JlYXRlUm90YXRpb25TaGFwZSgndycsIG5ldyBWZWMzKC05MCwgMCwgMCksIG5ldyBWZWMzKDAsIDAsIC05MCksIHRoaXMuX2F4aXNEaXIueCwgdGhpcy5fdHdvUEksIENvbG9yLkJMVUUpO1xuXG4gICAgICAgIC8vIGNpcmNsZSBib3JkZXJcbiAgICAgICAgY29uc3QgZWRpdG9yQ2FtZXJhID0gZ2V0RWRpdG9yQ2FtZXJhKCk7XG4gICAgICAgIGNvbnN0IGNhbWVyYU5vZGUgPSBlZGl0b3JDYW1lcmE/Lm5vZGU7XG4gICAgICAgIGNvbnN0IGNhbWVyYVJvdCA9IGNhbWVyYU5vZGU/LmdldFdvcmxkUm90YXRpb24odGVtcFF1YXQpID8/IFF1YXQuSURFTlRJVFk7XG4gICAgICAgIGNvbnN0IGNhbWVyYU5vcm1hbCA9IG5ldyBWZWMzKCk7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdChjYW1lcmFOb3JtYWwsIG5ldyBWZWMzKDAsIDAsIDEpLCBjYW1lcmFSb3QpO1xuICAgICAgICBjb25zdCBjaXJjbGVCb3JkZXJOb2RlID0gQ29udHJvbGxlclV0aWxzLmNpcmNsZShuZXcgVmVjMygpLCBjYW1lcmFOb3JtYWwsIHRoaXMuX2Jhc2VSYWRpdXMsIENvbG9yLkdSQVkpO1xuICAgICAgICBjaXJjbGVCb3JkZXJOb2RlLm5hbWUgPSAnY2lyY2xlQm9yZGVyJztcbiAgICAgICAgY2lyY2xlQm9yZGVyTm9kZS5wYXJlbnQgPSB0aGlzLl9yb290Tm9kZTtcbiAgICAgICAgc2V0Tm9kZU9wYWNpdHkoY2lyY2xlQm9yZGVyTm9kZSwgMjAwKTtcblxuICAgICAgICB0aGlzLl9jaXJjbGVCb3JkZXJOb2RlID0gY2lyY2xlQm9yZGVyTm9kZTtcbiAgICAgICAgdGhpcy5fY2lyY2xlQm9yZGVyTVIgPSBnZXRNb2RlbChjaXJjbGVCb3JkZXJOb2RlKTtcbiAgICAgICAgdGhpcy5fY2lyY2xlQm9yZGVyTm9kZS5zZXRXb3JsZFBvc2l0aW9uKHRoaXMuZ2V0UG9zaXRpb24oKSk7XG5cbiAgICAgICAgLy8gZm9yIGN1dCBvZmZcbiAgICAgICAgY29uc3QgY3V0b2ZmTm9kZSA9IENvbnRyb2xsZXJVdGlscy5kaXNjKG5ldyBWZWMzKCksIFZlYzMuVU5JVF9aLCB0aGlzLl9iYXNlUmFkaXVzLCBDb2xvci5SRUQpO1xuICAgICAgICBzZXROb2RlT3BhY2l0eShjdXRvZmZOb2RlLCAwKTtcbiAgICAgICAgY3V0b2ZmTm9kZS5uYW1lID0gJ2N1dG9mZic7XG4gICAgICAgIGN1dG9mZk5vZGUucGFyZW50ID0gdGhpcy5fcm9vdE5vZGU7XG4gICAgICAgIGN1dG9mZk5vZGUubGF5ZXIgPSBwYW5QbGFuZUxheWVyO1xuICAgICAgICB0aGlzLl9jdXRvZmZOb2RlID0gY3V0b2ZmTm9kZTtcbiAgICAgICAgdGhpcy5fY3V0b2ZmTVIgPSBnZXRNb2RlbChjdXRvZmZOb2RlKTtcblxuICAgICAgICAvLyBmb3Igcm90YXRpb24gaW5kaWNhdG9yIHNlY3RvclxuICAgICAgICBjb25zdCBpbmRpY2F0b3I6IGFueSA9IHt9O1xuICAgICAgICBpbmRpY2F0b3Iuc2VjdG9yTm9kZSA9IENvbnRyb2xsZXJVdGlscy5zZWN0b3IoXG4gICAgICAgICAgICBuZXcgVmVjMygpLFxuICAgICAgICAgICAgbmV3IFZlYzMoMCwgMSwgMCksXG4gICAgICAgICAgICBuZXcgVmVjMygxLCAwLCAwKSxcbiAgICAgICAgICAgIE1hdGguUEksXG4gICAgICAgICAgICB0aGlzLl9iYXNlUmFkaXVzLFxuICAgICAgICAgICAgQ29sb3IuWUVMTE9XLFxuICAgICAgICAgICAgeyB1bmxpdDogdHJ1ZSB9LFxuICAgICAgICApO1xuICAgICAgICBzZXROb2RlT3BhY2l0eShpbmRpY2F0b3Iuc2VjdG9yTm9kZSwgMjAwKTtcbiAgICAgICAgaW5kaWNhdG9yLnNlY3Rvck5vZGUucGFyZW50ID0gdGhpcy5fcm9vdE5vZGU7XG4gICAgICAgIGluZGljYXRvci5zZWN0b3JOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICBpbmRpY2F0b3IubWVzaFJlbmRlcmVyID0gZ2V0TW9kZWwoaW5kaWNhdG9yLnNlY3Rvck5vZGUpO1xuICAgICAgICB0aGlzLl9pbmRpY2F0b3IgPSBpbmRpY2F0b3I7XG5cbiAgICAgICAgdGhpcy5jcmVhdGVHcmFkdWF0aW9uU2hhcGUodGhpcy5fcm9vdE5vZGUhLCBDb2xvci5ZRUxMT1cpO1xuICAgICAgICB0aGlzLmhpZGVHcmFkdWF0aW9uKCk7XG5cbiAgICAgICAgdGhpcy5zaGFwZS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpc0hpdE9uQXhpc0Fycm93KGhpdE5vZGU6IE5vZGUsIGF4aXNOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgYXJyb3dUb3BOb2RlID0gdGhpcy5faGFuZGxlRGF0YU1hcFtheGlzTmFtZV0/LmFycm93Tm9kZTtcbiAgICAgICAgaWYgKCFhcnJvd1RvcE5vZGUpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycm93VG9wTm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBhcnJvd1RvcE5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICBpZiAoaGl0Tm9kZSA9PT0gY2hpbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaXNJbkN1dG9mZkJhY2soYXhpc05hbWU6IHN0cmluZywgeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgaGl0QXhpc05vZGUgPSB0aGlzLl9oYW5kbGVEYXRhTWFwW2F4aXNOYW1lXT8ubm9ybWFsVG9ydXNOb2RlO1xuICAgICAgICBpZiAoIWhpdEF4aXNOb2RlIHx8ICF0aGlzLl9jdXRvZmZOb2RlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGxldCByZXN1bHRzID0gZ2V0UmF5Y2FzdFJlc3VsdHNCeU5vZGVzKFt0aGlzLl9jdXRvZmZOb2RlXSwgeCwgeSk7XG4gICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGN1dE9mZkRpc3QgPSByZXN1bHRzWzBdLmRpc3RhbmNlO1xuICAgICAgICAgICAgcmVzdWx0cyA9IGdldFJheWNhc3RSZXN1bHRzQnlOb2RlcyhbaGl0QXhpc05vZGVdLCB4LCB5KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBheGlzRGlzdCA9IHJlc3VsdHNbMF0uZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgaWYgKGF4aXNEaXN0ID4gY3V0T2ZmRGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIG9uTW91c2VEb3duKGV2ZW50OiBHaXptb01vdXNlRXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKCEodGhpcy50cmFuc2Zvcm1Ub29sRGF0YT8uaXMyRCA/PyBmYWxzZSkgJiYgdGhpcy5pc0luQ3V0b2ZmQmFjayhldmVudC5oYW5kbGVOYW1lLCBldmVudC54LCBldmVudC55KSkge1xuICAgICAgICAgICAgdGhpcy5faXNNb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX21vdXNlRG93blJvdCA9IFF1YXQuY2xvbmUodGhpcy5nZXRSb3RhdGlvbigpKTtcbiAgICAgICAgdGhpcy5fbW91c2VEZWx0YVBvcyA9IG5ldyBWZWMyKDAsIDApO1xuXG4gICAgICAgIC8vIOiuoeeul+aXi+i9rOmHj+WPguiAg+WdkOagh+i9tFxuICAgICAgICBjb25zdCBoaXRQb2ludCA9IGV2ZW50LmhpdFBvaW50O1xuICAgICAgICBWZWMzLmNvcHkodGhpcy5faGFuZGxlQXhpc0RpciwgdGhpcy5fYXhpc0RpcltldmVudC5oYW5kbGVOYW1lXSk7XG4gICAgICAgIGNvbnN0IGF4aXNEaXIgPSBWZWMzLmNsb25lKHRoaXMuX2hhbmRsZUF4aXNEaXIpO1xuICAgICAgICBjb25zdCBoaXREaXIgPSBuZXcgVmVjMygpO1xuICAgICAgICBjb25zdCBjcm9zc0RpciA9IG5ldyBWZWMzKCk7XG4gICAgICAgIHRoaXMuX2luZGljYXRvclN0YXJ0RGlyID0gbmV3IFZlYzMoKTtcblxuICAgICAgICB0aGlzLl9kZWx0YUFuZ2xlID0gMDtcbiAgICAgICAgY29uc3QgaXMyRCA9IHRoaXMudHJhbnNmb3JtVG9vbERhdGE/LmlzMkQgPz8gZmFsc2U7XG4gICAgICAgIGlmIChpczJEKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQubm9kZSAmJiB0aGlzLmlzSGl0T25BeGlzQXJyb3coZXZlbnQubm9kZSwgZXZlbnQuaGFuZGxlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBWZWMzLnRyYW5zZm9ybVF1YXQoaGl0RGlyLCBuZXcgVmVjMygxLCAwLCAwKSwgdGhpcy5nZXRSb3RhdGlvbigpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGl0UG9pbnQgJiYgVmVjMy5zdWJ0cmFjdChoaXREaXIsIGhpdFBvaW50LCB0aGlzLmdldFBvc2l0aW9uKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gMkTmg4XlhrXkuItyb3RhdGlvbuaJh+W9ouaMh+ekuuWZqOS7juiHqui6q3jovbTkuLrotbflp4vmlrnlkJFcbiAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh0aGlzLl9pbmRpY2F0b3JTdGFydERpciwgbmV3IFZlYzMoMSwgMCwgMCksIHRoaXMuZ2V0Um90YXRpb24oKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBoaXRQb2ludCAmJiBWZWMzLnN1YnRyYWN0KGhpdERpciwgaGl0UG9pbnQsIHRoaXMuZ2V0UG9zaXRpb24oKSk7XG4gICAgICAgICAgICB0aGlzLl9pbmRpY2F0b3JTdGFydERpciA9IGhpdERpcjtcbiAgICAgICAgfVxuXG4gICAgICAgIFZlYzMubm9ybWFsaXplKGhpdERpciwgaGl0RGlyKTtcbiAgICAgICAgVmVjMy50cmFuc2Zvcm1RdWF0KGF4aXNEaXIsIGF4aXNEaXIsIHRoaXMuZ2V0Um90YXRpb24oKSk7XG4gICAgICAgIFZlYzMuY3Jvc3MoY3Jvc3NEaXIsIGhpdERpciwgYXhpc0Rpcik7XG4gICAgICAgIFZlYzMuY3Jvc3MoaGl0RGlyLCBheGlzRGlyLCBjcm9zc0Rpcik7XG5cbiAgICAgICAgdGhpcy5fcm90YXRlQWxpZ25EaXIgPSBjcm9zc0RpcjtcbiAgICAgICAgdGhpcy5fdHJhbnNmb3JtQXhpc0RpciA9IGF4aXNEaXI7XG5cbiAgICAgICAgLy8gc2hvdyBpbmRpY2F0b3JcbiAgICAgICAgdGhpcy51cGRhdGVSb3RhdGlvbkluZGljYXRvcih0aGlzLl90cmFuc2Zvcm1BeGlzRGlyLCB0aGlzLl9pbmRpY2F0b3JTdGFydERpciwgMCk7XG4gICAgICAgIHRoaXMuX2luZGljYXRvci5zZWN0b3JOb2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHRoaXMuX2hhbmRsZURhdGFNYXBbZXZlbnQuaGFuZGxlTmFtZV0uaW5kaWNhdG9yQ2lyY2xlIS5hY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgIC8vIGhpZGUgYm9yZGVyXG4gICAgICAgIHRoaXMuX2NpcmNsZUJvcmRlck5vZGUuYWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5faGFuZGxlRGF0YU1hcCkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSBldmVudC5oYW5kbGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcFtrZXldLm5vcm1hbFRvcnVzTm9kZSEuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcFtrZXldLmFycm93Tm9kZSEuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcFtrZXldLnRvcE5vZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENMSTogbm8gcG9pbnRlciBsb2NrXG5cbiAgICAgICAgaWYgKHRoaXMub25Db250cm9sbGVyTW91c2VEb3duKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ29udHJvbGxlck1vdXNlRG93bihldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbk1vdXNlTW92ZShldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLl9pc01vdXNlRG93bikge1xuICAgICAgICAgICAgY29uc3QgZGVsdGFYID0gY2xhbXAoZXZlbnQubW92ZURlbHRhWCwgLTEwLCAxMCk7XG4gICAgICAgICAgICBjb25zdCBkZWx0YVkgPSBjbGFtcChldmVudC5tb3ZlRGVsdGFZLCAtMTAsIDEwKTtcblxuICAgICAgICAgICAgdGhpcy5fbW91c2VEZWx0YVBvcy54ICs9IGRlbHRhWDtcbiAgICAgICAgICAgIHRoaXMuX21vdXNlRGVsdGFQb3MueSArPSBkZWx0YVk7XG5cbiAgICAgICAgICAgIFF1YXQuaWRlbnRpdHkodGhpcy5fZGVsdGFSb3RhdGlvbik7XG5cbiAgICAgICAgICAgIGxldCByYWRpYW4gPSAwO1xuICAgICAgICAgICAgaWYgKGV2ZW50LmhhbmRsZU5hbWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxpZ25BeGlzTW92ZURpc3QgPSB0aGlzLmdldEFsaWduQXhpc01vdmVEaXN0YW5jZSh0aGlzLl9yb3RhdGVBbGlnbkRpciwgdGhpcy5fbW91c2VEZWx0YVBvcyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9kZWx0YUFuZ2xlID0gLWFsaWduQXhpc01vdmVEaXN0IC8gdGhpcy5fcm90RmFjdG9yO1xuICAgICAgICAgICAgICAgIHJhZGlhbiA9IHRoaXMuX2RlbHRhQW5nbGUgKiB0aGlzLl9kZWdyZWVUb1JhZGlhbkZhY3RvcjtcbiAgICAgICAgICAgICAgICBWZWMzLmNvcHkodGhpcy5faGFuZGxlQXhpc0RpciwgdGhpcy5fYXhpc0RpcltldmVudC5oYW5kbGVOYW1lXSk7XG4gICAgICAgICAgICAgICAgUXVhdC5mcm9tQXhpc0FuZ2xlKHRoaXMuX2RlbHRhUm90YXRpb24sIHRoaXMuX2hhbmRsZUF4aXNEaXIsIHJhZGlhbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlUm90YXRpb25JbmRpY2F0b3IodGhpcy5fdHJhbnNmb3JtQXhpc0RpciwgdGhpcy5faW5kaWNhdG9yU3RhcnREaXIsIHJhZGlhbik7XG4gICAgICAgICAgICBjb25zdCByb3QgPSB0aGlzLmdldFJvdGF0aW9uKCk7XG4gICAgICAgICAgICBRdWF0Lm11bHRpcGx5KHJvdCwgdGhpcy5fbW91c2VEb3duUm90LCB0aGlzLl9kZWx0YVJvdGF0aW9uKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTG9jaykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uQ29udHJvbGxlck1vdXNlTW92ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ29udHJvbGxlck1vdXNlTW92ZShldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2V0Um90YXRpb24ocm90KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMub25Db250cm9sbGVyTW91c2VNb3ZlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkNvbnRyb2xsZXJNb3VzZU1vdmUoZXZlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmHjee9ruaJgOaciSBoYW5kbGUg55qE6IqC54K555qE5Y+v6KeB5oCnXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHJlc2V0QWxsSGFuZGVsTm9kZXMoKSB7XG4gICAgICAgIGNvbnN0IGlzMkQgPSB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhPy5pczJEID8/IGZhbHNlO1xuICAgICAgICBpZiAoaXMyRCkge1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcC53LmluZGljYXRvckNpcmNsZSEuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVEYXRhTWFwLncubm9ybWFsVG9ydXNOb2RlIS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcC53LnRvcE5vZGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMuX2hhbmRsZURhdGFNYXApLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgIT09ICd3Jykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVEYXRhTWFwW2tleV0ubm9ybWFsVG9ydXNOb2RlIS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVEYXRhTWFwW2tleV0udG9wTm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVEYXRhTWFwW2tleV0uaW5kaWNhdG9yQ2lyY2xlIS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcFtrZXldLmFycm93Tm9kZSEuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbk1vdXNlVXAoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICBldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuICAgICAgICAvLyBDTEk6IG5vIHBvaW50ZXIgbG9jayB0byBleGl0XG4gICAgICAgIHRoaXMuX2luZGljYXRvci5zZWN0b3JOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICBRdWF0LmlkZW50aXR5KHRoaXMuX2RlbHRhUm90YXRpb24pO1xuXG4gICAgICAgIGNvbnN0IGlzMkQgPSB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhPy5pczJEID8/IGZhbHNlO1xuICAgICAgICBpZiAoIWlzMkQpIHtcbiAgICAgICAgICAgIC8vIHNob3cgYm9yZGVyXG4gICAgICAgICAgICB0aGlzLl9jaXJjbGVCb3JkZXJOb2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlc2V0QWxsSGFuZGVsTm9kZXMoKTtcbiAgICAgICAgaWYgKHRoaXMub25Db250cm9sbGVyTW91c2VVcCkge1xuICAgICAgICAgICAgdGhpcy5vbkNvbnRyb2xsZXJNb3VzZVVwKGV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2hhbmRsZUF4aXNEaXIuc2V0KDAsIDAsIDApO1xuICAgIH1cblxuICAgIG9uTW91c2VMZWF2ZShldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIHRoaXMub25Nb3VzZVVwKGV2ZW50KTtcbiAgICB9XG5cbiAgICBvbkhvdmVySW4oZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoISh0aGlzLnRyYW5zZm9ybVRvb2xEYXRhPy5pczJEID8/IGZhbHNlKSAmJiB0aGlzLmlzSW5DdXRvZmZCYWNrKGV2ZW50LmhhbmRsZU5hbWUsIGV2ZW50LngsIGV2ZW50LnkpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRIYW5kbGVDb2xvcihldmVudC5oYW5kbGVOYW1lLCBDb2xvci5ZRUxMT1cpO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuX2hhbmRsZURhdGFNYXApLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKGtleSAhPT0gZXZlbnQuaGFuZGxlTmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Tm9kZXNPcGFjaXR5KHRoaXMuX2hhbmRsZURhdGFNYXBba2V5XS5yZW5kZXJlck5vZGVzLCA1MCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uSG92ZXJPdXQoZXZlbnQ6IEdpem1vTW91c2VFdmVudDx7IGhvdmVySW5Ob2RlTWFwOiBNYXA8Tm9kZSwgYm9vbGVhbj4gfT4pIHtcbiAgICAgICAgdGhpcy5yZXNldEhhbmRsZUNvbG9yKGV2ZW50KTtcblxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLl9oYW5kbGVEYXRhTWFwKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0Tm9kZXNPcGFjaXR5KHRoaXMuX2hhbmRsZURhdGFNYXBba2V5XS5yZW5kZXJlck5vZGVzLCAyNTUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXROb2Rlc09wYWNpdHkobm9kZXM6IE5vZGVbXSwgb3BhY2l0eTogbnVtYmVyKSB7XG4gICAgICAgIG5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgICAgIHNldE5vZGVPcGFjaXR5KG5vZGUsIG9wYWNpdHkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXREZWx0YVJvdGF0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVsdGFSb3RhdGlvbjtcbiAgICB9XG5cbiAgICBnZXREZWx0YUFuZ2xlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVsdGFBbmdsZTtcbiAgICB9XG5cbiAgICBnZXRIYW5kbGVBeGlzRGlyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlQXhpc0RpcjtcbiAgICB9XG5cbiAgICBvblNob3coKSB7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJFdmVudHMoKTtcbiAgICAgICAgY29uc3QgaXMyRCA9IHRoaXMudHJhbnNmb3JtVG9vbERhdGE/LmlzMkQgPz8gZmFsc2U7XG4gICAgICAgIGlmIChpczJEKSB7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVEYXRhTWFwLngudG9wTm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZURhdGFNYXAueS50b3BOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcC56LnRvcE5vZGUuYWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZURhdGFNYXAudy50b3BOb2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVEYXRhTWFwLncuYXJyb3dOb2RlIS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fY2lyY2xlQm9yZGVyTm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2N1dG9mZk5vZGUhLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb250cm9sbGVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVEYXRhTWFwLngudG9wTm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcC55LnRvcE5vZGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZURhdGFNYXAuei50b3BOb2RlLmFjdGl2ZSA9IHRydWU7XG5cbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZURhdGFNYXAudy50b3BOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlRGF0YU1hcC53LmFycm93Tm9kZSEuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9jaXJjbGVCb3JkZXJOb2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9jdXRvZmZOb2RlIS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25IaWRlKCkge1xuICAgICAgICB0aGlzLnVucmVnaXN0ZXJFdmVudHMoKTtcbiAgICAgICAgLy8gQ0xJOiBubyBwb2ludGVyIGxvY2sgdG8gZXhpdFxuICAgICAgICB0aGlzLl9pbmRpY2F0b3Iuc2VjdG9yTm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY2lyY2xlQm9yZGVyTm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY3V0b2ZmTm9kZSEuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVzZXRBbGxIYW5kZWxOb2RlcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVSb3RhdGlvbkluZGljYXRvcihub3JtYWw6IFZlYzMsIGZyb21EaXI6IFZlYzMsIHJhZGlhbjogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IENvbnRyb2xsZXJTaGFwZS5jYWxjU2VjdG9yUG9pbnRzKFxuICAgICAgICAgICAgdGhpcy5nZXRQb3NpdGlvbigpLFxuICAgICAgICAgICAgbm9ybWFsLFxuICAgICAgICAgICAgZnJvbURpcixcbiAgICAgICAgICAgIHJhZGlhbixcbiAgICAgICAgICAgIHRoaXMuX2Jhc2VSYWRpdXMgKiB0aGlzLmdldERpc3RTY2FsYXIoKSxcbiAgICAgICAgICAgIDYwLFxuICAgICAgICApO1xuXG4gICAgICAgIHVwZGF0ZVBvc2l0aW9ucyh0aGlzLl9pbmRpY2F0b3IubWVzaFJlbmRlcmVyLCBwb3NpdGlvbnMpO1xuICAgIH1cblxuICAgIGFkanVzdENvbnRyb2xsZXJTaXplKCkge1xuICAgICAgICBjb25zdCBzY2FsYXIgPSB0aGlzLmdldERpc3RTY2FsYXIoKTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSB0aGlzLmdldFNjYWxlKCk7XG4gICAgICAgIGNvbnN0IG5ld1NjYWxlID0gdGVtcFZlYzNfYTtcbiAgICAgICAgVmVjMy5jb3B5KG5ld1NjYWxlLCBzY2FsZSk7XG4gICAgICAgIG5ld1NjYWxlLm11bHRpcGx5U2NhbGFyKHNjYWxhcik7XG4gICAgICAgIHRoaXMuc2hhcGUuc2V0U2NhbGUobmV3U2NhbGUpO1xuXG4gICAgICAgIC8vIHVwZGF0ZSBjaXJjbGUgYm9yZGVyXG4gICAgICAgIHRoaXMuX2NpcmNsZUJvcmRlck5vZGUuc2V0U2NhbGUobmV3U2NhbGUpO1xuICAgICAgICB0aGlzLl9jaXJjbGVCb3JkZXJOb2RlLnNldFdvcmxkUG9zaXRpb24odGhpcy5nZXRQb3NpdGlvbigpKTtcbiAgICAgICAgY29uc3QgZWRpdG9yQ2FtZXJhID0gZ2V0RWRpdG9yQ2FtZXJhKCk7XG4gICAgICAgIGNvbnN0IGNhbWVyYU5vZGUgPSBlZGl0b3JDYW1lcmE/Lm5vZGU7XG4gICAgICAgIGNvbnN0IGNhbWVyYVJvdCA9IGNhbWVyYU5vZGU/LmdldFdvcmxkUm90YXRpb24odGVtcFF1YXQpID8/IFF1YXQuSURFTlRJVFk7XG4gICAgICAgIGNvbnN0IGNhbWVyYU5vcm1hbCA9IHRlbXBWZWMzX2I7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdChjYW1lcmFOb3JtYWwsIFZlYzMuVU5JVF9aLCBjYW1lcmFSb3QpO1xuICAgICAgICBsZXQgcG9zaXRpb25zID0gQ29udHJvbGxlclNoYXBlLmNhbGNDaXJjbGVQb2ludHMoVmVjMy5aRVJPLCBjYW1lcmFOb3JtYWwsIHRoaXMuX2Jhc2VSYWRpdXMpO1xuICAgICAgICB1cGRhdGVQb3NpdGlvbnModGhpcy5fY2lyY2xlQm9yZGVyTVIhLCBwb3NpdGlvbnMpO1xuXG4gICAgICAgIC8vIHVwZGF0ZSBjdXRvZmZcbiAgICAgICAgdGhpcy5fY3V0b2ZmTm9kZSEuc2V0U2NhbGUobmV3U2NhbGUpO1xuICAgICAgICB0aGlzLl9jdXRvZmZOb2RlIS5zZXRXb3JsZFBvc2l0aW9uKHRoaXMuZ2V0UG9zaXRpb24oKSk7XG4gICAgICAgIHRoaXMuX2N1dG9mZk5vZGUhLnNldFdvcmxkUm90YXRpb24oY2FtZXJhUm90KTtcblxuICAgICAgICBjb25zdCBsb2NhbENhbU5vcm1hbCA9IHRlbXBWZWMzX2I7XG4gICAgICAgIGNvbnN0IHdvcmxkVG9Mb2NhbE1hdCA9IHRlbXBNYXQ0O1xuICAgICAgICB0aGlzLnNoYXBlLmdldFdvcmxkTWF0cml4KHdvcmxkVG9Mb2NhbE1hdCk7XG4gICAgICAgIE1hdDQuaW52ZXJ0KHdvcmxkVG9Mb2NhbE1hdCwgd29ybGRUb0xvY2FsTWF0KTtcbiAgICAgICAgVmVjMy50cmFuc2Zvcm1NYXQ0Tm9ybWFsKGxvY2FsQ2FtTm9ybWFsLCBjYW1lcmFOb3JtYWwsIHdvcmxkVG9Mb2NhbE1hdCk7XG5cbiAgICAgICAgY29uc3QgaXMyRCA9IHRoaXMudHJhbnNmb3JtVG9vbERhdGE/LmlzMkQgPz8gZmFsc2U7XG4gICAgICAgIGlmICghaXMyRCkge1xuICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5faGFuZGxlRGF0YU1hcCkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gJ3cnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyb20gPSB0ZW1wVmVjM19jO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBheGlzRGlyID0gdGhpcy5fYXhpc0RpcltrZXldO1xuICAgICAgICAgICAgICAgICAgICBWZWMzLmNyb3NzKGZyb20sIGF4aXNEaXIsIGxvY2FsQ2FtTm9ybWFsKTtcbiAgICAgICAgICAgICAgICAgICAgVmVjMy5ub3JtYWxpemUoZnJvbSwgZnJvbSk7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IENvbnRyb2xsZXJTaGFwZS5jYWxjQXJjUG9pbnRzKFZlYzMuWkVSTywgYXhpc0RpciwgZnJvbSwgLU1hdGguUEksIHRoaXMuX2Jhc2VSYWRpdXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF4aXNEYXRhID0gdGhpcy5faGFuZGxlRGF0YU1hcFtrZXldO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVQb3NpdGlvbnMoYXhpc0RhdGEubm9ybWFsVG9ydXNNUiEsIHBvc2l0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJvdGF0aW9uQ29udHJvbGxlcjtcbiJdfQ==