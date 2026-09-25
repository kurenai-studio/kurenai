'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const transform_base_1 = __importDefault(require("./transform-base"));
const rectangle_controller_1 = require("./rectangle-controller");
const node_utils_1 = require("../utils/node-utils");
const rect_transform_snapping_1 = require("../utils/rect-transform-snapping");
const lines_1 = __importDefault(require("../controller/lines"));
function getService() {
    try {
        const { Service } = require('../../core/decorator');
        return Service;
    }
    catch (e) {
        return null;
    }
}
function toPrecision(val, n) {
    const f = Math.pow(10, n);
    return Math.round(val * f) / f;
}
function makeVec3InPrecision(v, p) {
    const f = Math.pow(10, p);
    v.x = Math.round(v.x * f) / f;
    v.y = Math.round(v.y * f) / f;
    v.z = Math.round(v.z * f) / f;
    return v;
}
function boundsToRect(bounds) {
    return new cc_1.Rect(bounds[1].x, bounds[1].y, bounds[3].x - bounds[1].x, bounds[3].y - bounds[1].y);
}
const tempVec2 = new cc_1.Vec2();
const tempVec3 = new cc_1.Vec3();
const tempMat4 = new cc_1.Mat4();
const tempQuat_a = new cc_1.Quat();
let _controller = null;
let _nodeSnapLinesCtrl;
let _canvasSnapLinesCtrl;
let _equalSpacingLinesCtrl;
class RectGizmo extends transform_base_1.default {
    _worldPosList = [];
    _localPosList = [];
    _sizeList = [];
    _anchorList = [];
    _rectList = [];
    _validTarget = [];
    _tempRect = new cc_1.Rect();
    _editRect = new cc_1.Rect();
    _altKey = false;
    _shiftKey = false;
    // for snapping
    _snapDistVec2 = new cc_1.Vec2();
    _nodeSnapLinesCtrl;
    _canvasSnapLinesCtrl;
    _equalSpacingLinesCtrl;
    init() {
        this.createController();
    }
    layer() {
        return 'foreground';
    }
    isNodePositionLocked(node) {
        if (!node) {
            return false;
        }
        return node.components.some((component) => component._objFlags & cc_1.CCObject.Flags.IsPositionLocked);
    }
    isNodeAnchorLocked(node) {
        if (!node) {
            return false;
        }
        return node.components.some((component) => component._objFlags & cc_1.CCObject.Flags.IsAnchorLocked);
    }
    isNodeContentSizeLocked(node) {
        if (!node) {
            return false;
        }
        return node.components.some((component) => component._objFlags & cc_1.CCObject.Flags.IsSizeLocked);
    }
    onTargetUpdate() {
        if (_controller) {
            this._controller = _controller;
            _controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
            _controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
            _controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
        }
        if (_nodeSnapLinesCtrl) {
            this._nodeSnapLinesCtrl = _nodeSnapLinesCtrl;
        }
        if (_canvasSnapLinesCtrl) {
            this._canvasSnapLinesCtrl = _canvasSnapLinesCtrl;
        }
        if (_equalSpacingLinesCtrl) {
            this._equalSpacingLinesCtrl = _equalSpacingLinesCtrl;
        }
        if (this._controller) {
            this._controller.editable = !!this.target;
        }
        super.onTargetUpdate();
    }
    createController() {
        if (_controller) {
            this._controller = _controller;
        }
        else {
            const gizmoRoot = this.getGizmoRoot();
            const rectCtrl = new rectangle_controller_1.RectangleController(gizmoRoot, { needAnchor: true });
            this._controller = _controller = rectCtrl;
        }
        const gizmoRoot = this.getGizmoRoot();
        this._controller.setColor(new cc_1.Color(0, 153, 255));
        this._controller.setEditHandlesColor(new cc_1.Color(0, 153, 255));
        this._controller.onControllerMouseDown = this.onControllerMouseDown.bind(this);
        this._controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
        this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
        this._controller.editable = !!this.target;
        if (_nodeSnapLinesCtrl) {
            this._nodeSnapLinesCtrl = _nodeSnapLinesCtrl;
        }
        else {
            this._nodeSnapLinesCtrl = _nodeSnapLinesCtrl = new lines_1.default(gizmoRoot);
        }
        if (_canvasSnapLinesCtrl) {
            this._canvasSnapLinesCtrl = _canvasSnapLinesCtrl;
        }
        else {
            this._canvasSnapLinesCtrl = _canvasSnapLinesCtrl = new lines_1.default(gizmoRoot);
        }
        if (_equalSpacingLinesCtrl) {
            this._equalSpacingLinesCtrl = _equalSpacingLinesCtrl;
        }
        else {
            this._equalSpacingLinesCtrl = _equalSpacingLinesCtrl = new lines_1.default(gizmoRoot, { dashed: true });
        }
    }
    onControllerMouseDown() {
        if (this._controller && this.nodes.length) {
            this._controller.contentSizeLocked = this.nodes.some(node => this.isNodeContentSizeLocked(node));
            this._controller.anchorLocked = this.nodes.some(node => this.isNodeAnchorLocked(node));
        }
        this._worldPosList.length = 0;
        this._localPosList.length = 0;
        this._sizeList.length = 0;
        this._anchorList.length = 0;
        this._rectList.length = 0;
        // 可能有不含 ui transform component 的 node 被选中，剔除掉
        this._validTarget.length = 0;
        const nodes = this.nodes;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const uiTransComp = node.getComponent(cc_1.UITransform);
            if (uiTransComp) {
                this._validTarget.push(uiTransComp);
                this._worldPosList.push(node.getWorldPosition());
                this._localPosList.push(node.getPosition());
                this._sizeList.push(uiTransComp.contentSize.clone());
                this._anchorList.push(uiTransComp.anchorPoint.clone());
                this._rectList.push((0, node_utils_1.getNodeWorldBounds)(node));
            }
        }
        const validNodes = this._validTarget.map(t => t.node);
        const bounds = this.getBounds(false, false, validNodes);
        this._tempRect = boundsToRect(bounds);
        const scale = this._controller.transformToolData?.scale2D ?? 1;
        const snapDist = rect_transform_snapping_1.rectTransformSnapping.snapThreshold / scale;
        this._snapDistVec2.x = snapDist;
        this._snapDistVec2.y = snapDist;
        if (rect_transform_snapping_1.rectTransformSnapping.enableSnapping) {
            // 暂时只处理单选情况
            const node = this.nodes[0];
            if (node && node.parent) {
                rect_transform_snapping_1.rectTransformSnapping.calculateNodeSnapGuidelines(node.parent, node);
                rect_transform_snapping_1.rectTransformSnapping.calculateCanvasSnapGuidelines();
                rect_transform_snapping_1.rectTransformSnapping.calculateSpacingSnapGuidelines(node.parent, node);
            }
        }
    }
    onControllerMouseMove() {
        this.updateDataFromController();
    }
    onControllerMouseUp(event) {
        if (this._controller.updated) {
            this.onControlEnd('position');
        }
        else {
            const svc = getService();
            const selected = svc?.Selection?.query?.() ?? [];
            if (selected.length === 1) {
                const camera = svc?.Camera?.getCamera?.()?.camera;
                const mask = cc_1.Layers.makeMaskExclude([cc_1.Layers.Enum.GIZMOS, cc_1.Layers.Enum.SCENE_GIZMO]);
                const results = (0, node_utils_1.getRaycastResultNodes)(camera, event.x, event.y, mask);
                const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
                const firstSelection = selected[0];
                for (let i = 0; i < results.length; i++) {
                    const resultPath = EditorExtends?.Node?.getNodePath?.(results[i]) ?? '';
                    if (results[i] && firstSelection === resultPath) {
                        if (i === results.length - 1) {
                            const nextPath = EditorExtends?.Node?.getNodePath?.(results[0]) ?? '';
                            svc?.Selection?.unselect?.(firstSelection);
                            if (nextPath)
                                svc?.Selection?.select?.(nextPath);
                        }
                        else if (results[i + 1]) {
                            const nextPath = EditorExtends?.Node?.getNodePath?.(results[i + 1]) ?? '';
                            svc?.Selection?.unselect?.(firstSelection);
                            if (nextPath)
                                svc?.Selection?.select?.(nextPath);
                        }
                        break;
                    }
                }
            }
        }
        this.clearNodeSnappingGuideline();
        this.clearCanvasSnappingGuideline();
        this.clearEqualSpacingGuideline();
    }
    onKeyDown(event) {
        this._altKey = event.altKey;
        this._shiftKey = event.shiftKey;
        return super.onKeyDown(event);
    }
    onKeyUp(event) {
        const curType = this._controller.getCurHandleType();
        const curHandleIsCorner = this._controller.isCorner(curType) || this._controller.isBorder(curType);
        const isAltTurnToFalse = this._altKey && !event.altKey;
        if (isAltTurnToFalse && curHandleIsCorner) {
            this._controller.reset();
        }
        this._altKey = event.altKey;
        this._shiftKey = event.shiftKey;
        return super.onKeyUp(event);
    }
    handleAreaMove(delta) {
        for (let i = 0; i < this._validTarget.length; i++) {
            const node = this._validTarget[i].node;
            if (this.isNodePositionLocked(node)) {
                continue;
            }
            const worldPos = this._worldPosList[i];
            let rectToolPos = new cc_1.Vec3();
            cc_1.Vec3.add(rectToolPos, worldPos, delta);
            if (i === 0) {
                if (rect_transform_snapping_1.rectTransformSnapping.enableSnapping) {
                    const rect = this._rectList[i];
                    rectToolPos = rect_transform_snapping_1.rectTransformSnapping.snapPosToNodeGuidelines(rectToolPos, rect, this._snapDistVec2);
                    this.drawNodeSnappingGuideline();
                    rectToolPos = rect_transform_snapping_1.rectTransformSnapping.snapPosToCanvasSnapGuidelines(rectToolPos, rect, this._snapDistVec2);
                    this.drawCanvasSnappingGuideline();
                    rectToolPos = rect_transform_snapping_1.rectTransformSnapping.snapPosToEqualSpacing(rectToolPos, rect, this._snapDistVec2);
                    this.drawEqualSpacingGuideline();
                }
            }
            rectToolPos.x = toPrecision(rectToolPos.x, 3);
            rectToolPos.y = toPrecision(rectToolPos.y, 3);
            node.setWorldPosition(rectToolPos);
        }
    }
    handleAnchorMove(delta) {
        // 不处理多UI选择的anchor编辑
        if (this._validTarget.length > 1) {
            return;
        }
        const uiTransComp = this._validTarget[0];
        const node = uiTransComp.node;
        const size = this._sizeList[0];
        const oldAnchor = this._anchorList[0];
        const worldPos = this._worldPosList[0];
        const posDelta = delta.clone();
        makeVec3InPrecision(posDelta, 3);
        tempVec3.set(worldPos);
        tempVec3.add(posDelta);
        node.setWorldPosition(tempVec3);
        // 转换到局部坐标
        node.getWorldMatrix(tempMat4);
        cc_1.Mat4.invert(tempMat4, tempMat4);
        tempMat4.m12 = tempMat4.m13 = 0;
        cc_1.Vec3.transformMat4(posDelta, posDelta, tempMat4);
        tempVec2.x = posDelta.x / size.width;
        tempVec2.y = posDelta.y / size.height;
        tempVec2.add(oldAnchor);
        uiTransComp.anchorPoint = tempVec2;
    }
    getSizePoint(type) {
        const sizePointPos = new cc_1.Vec2();
        const rect = this._rectList[0];
        if (type === rectangle_controller_1.RectHandleType.Right ||
            type === rectangle_controller_1.RectHandleType.TopRight ||
            type === rectangle_controller_1.RectHandleType.BottomRight) {
            sizePointPos.x = rect.x + rect.width;
        }
        else {
            sizePointPos.x = rect.x;
        }
        if (type === rectangle_controller_1.RectHandleType.BottomLeft ||
            type === rectangle_controller_1.RectHandleType.Bottom ||
            type === rectangle_controller_1.RectHandleType.BottomRight) {
            sizePointPos.y = rect.y;
        }
        else {
            sizePointPos.y = rect.y + rect.height;
        }
        return sizePointPos;
    }
    modifyPosDeltaWithAnchor(type, posDelta, sizeDelta, anchor, keepCenter) {
        if (type === rectangle_controller_1.RectHandleType.Right ||
            type === rectangle_controller_1.RectHandleType.TopRight ||
            type === rectangle_controller_1.RectHandleType.BottomRight) {
            if (keepCenter) {
                sizeDelta.x /= (1 - anchor.x);
            }
            posDelta.x = sizeDelta.x * anchor.x;
        }
        else {
            if (keepCenter) {
                sizeDelta.x /= anchor.x;
            }
            posDelta.x = -sizeDelta.x * (1 - anchor.x);
        }
        if (type === rectangle_controller_1.RectHandleType.Bottom ||
            type === rectangle_controller_1.RectHandleType.BottomRight ||
            type === rectangle_controller_1.RectHandleType.BottomLeft) {
            if (keepCenter) {
                sizeDelta.y /= anchor.y;
            }
            posDelta.y = -sizeDelta.y * (1 - anchor.y);
        }
        else {
            if (keepCenter) {
                sizeDelta.y /= (1 - anchor.y);
            }
            posDelta.y = sizeDelta.y * anchor.y;
        }
    }
    // 用于size宽高大小的delta变化映射到边框坐标点的delta变化
    formatSizeDelta(type, sizeDelta) {
        if (type === rectangle_controller_1.RectHandleType.Left ||
            type === rectangle_controller_1.RectHandleType.TopLeft ||
            type === rectangle_controller_1.RectHandleType.BottomLeft) {
            sizeDelta.x = -sizeDelta.x;
        }
        if (type === rectangle_controller_1.RectHandleType.Bottom ||
            type === rectangle_controller_1.RectHandleType.BottomRight ||
            type === rectangle_controller_1.RectHandleType.BottomLeft) {
            sizeDelta.y = -sizeDelta.y;
        }
    }
    handleOneTargetSize(type, delta, keepCenter, keepScale) {
        const size = this._sizeList[0];
        const posDelta = delta.clone();
        let sizeDelta = new cc_1.Vec2(delta.x, delta.y);
        const localPos = this._localPosList[0];
        const uiTransComp = this._validTarget[0];
        const node = uiTransComp.node;
        const anchor = this._anchorList[0];
        if (rect_transform_snapping_1.rectTransformSnapping.enableSnapping) {
            this.formatSizeDelta(type, sizeDelta);
            sizeDelta = rect_transform_snapping_1.rectTransformSnapping.snapSizeToNodeGuidelines(this.getSizePoint(type), sizeDelta, this._snapDistVec2);
            this.formatSizeDelta(type, sizeDelta);
            this.drawNodeSnappingGuideline();
        }
        sizeDelta.x = toPrecision(sizeDelta.x, 3);
        sizeDelta.y = toPrecision(sizeDelta.y, 3);
        this.modifyPosDeltaWithAnchor(type, posDelta, sizeDelta, anchor, keepCenter);
        // 转换到基于父节点的局部坐标系
        if (node.parent) {
            node.parent.getWorldMatrix(tempMat4);
            cc_1.Mat4.invert(tempMat4, tempMat4);
            tempMat4.m12 = tempMat4.m13 = 0;
            cc_1.Vec3.transformMat4(posDelta, posDelta, tempMat4);
        }
        if (!keepCenter) {
            // 乘上当前节点的旋转
            const localRot = tempQuat_a;
            node.getRotation(localRot);
            cc_1.Vec3.transformQuat(posDelta, posDelta, localRot);
            posDelta.z = 0;
            tempVec3.set(localPos);
            tempVec3.add(posDelta);
            node.setPosition(tempVec3);
        }
        // contentSize 受到scale 影响
        const worldScale = new cc_1.Vec3();
        node.getWorldScale(worldScale);
        sizeDelta.x = sizeDelta.x / worldScale.x;
        sizeDelta.y = sizeDelta.y / worldScale.y;
        let height = size.height;
        let width = size.width;
        if (keepScale) {
            if (sizeDelta.x) {
                width = size.width + sizeDelta.x;
                if (size.width) {
                    const scale = width / size.width;
                    height = scale * size.height;
                }
                else {
                    height = width;
                }
            }
            else if (sizeDelta.y) {
                height = size.height + sizeDelta.y;
                if (size.height) {
                    const scale = height / size.height;
                    width = scale * size.width;
                }
                else {
                    width = height;
                }
            }
        }
        else {
            height = size.height + sizeDelta.y;
            width = size.width + sizeDelta.x;
        }
        uiTransComp.contentSize = new cc_1.Size(width, height);
    }
    handleMultiTargetSize(type, delta, keepCenter) {
        const oriRect = this._tempRect;
        const sizeDelta = new cc_1.Vec2(delta.x, delta.y);
        const posDelta = delta.clone();
        const anchor = new cc_1.Vec2(0, 0);
        sizeDelta.x = toPrecision(sizeDelta.x, 3);
        sizeDelta.y = toPrecision(sizeDelta.y, 3);
        this.modifyPosDeltaWithAnchor(type, posDelta, sizeDelta, anchor, false);
        const rect = oriRect.clone();
        rect.x = oriRect.x + posDelta.x;
        rect.y = oriRect.y + posDelta.y;
        rect.width = oriRect.width + sizeDelta.x;
        rect.height = oriRect.height + sizeDelta.y;
        this._editRect = rect;
        for (let i = 0, l = this._validTarget.length; i < l; i++) {
            const uiTransComp = this._validTarget[i];
            const node = uiTransComp.node;
            const worldPos = this._worldPosList[i];
            const xPercent = (worldPos.x - oriRect.x) / oriRect.width;
            const yPercent = (worldPos.y - oriRect.y) / oriRect.height;
            const newPos = new cc_1.Vec3(rect.x + xPercent * rect.width, rect.y + yPercent * rect.height, worldPos.z);
            node.setWorldPosition(newPos);
            const r = this._rectList[i];
            const wPercent = r.width / oriRect.width;
            const hPercent = r.height / oriRect.height;
            const size = this._sizeList[i];
            const sd = sizeDelta.clone();
            sd.x = sd.x * wPercent;
            sd.y = sd.y * hPercent;
            const worldScale = new cc_1.Vec3();
            node.getWorldScale(worldScale);
            sd.x = sd.x / worldScale.x;
            sd.y = sd.y / worldScale.y;
            uiTransComp.contentSize = new cc_1.Size(size.width + sd.x, size.height + sd.y);
        }
    }
    getBounds(flipX, flipY, nodes) {
        let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE;
        let minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
        function calcBounds(p) {
            if (p.x > maxX)
                maxX = p.x;
            if (p.x < minX)
                minX = p.x;
            if (p.y > maxY)
                maxY = p.y;
            if (p.y < minY)
                minY = p.y;
        }
        nodes.forEach((node) => {
            if (node.getComponent(cc_1.UITransform)) {
                const ob = (0, node_utils_1.getNodeWorldOrientedBounds)(node);
                calcBounds(ob[0]);
                calcBounds(ob[1]);
                calcBounds(ob[2]);
                calcBounds(ob[3]);
            }
        });
        let temp;
        if (flipX) {
            temp = minX;
            minX = maxX;
            maxX = temp;
        }
        if (flipY) {
            temp = minY;
            minY = maxY;
            maxY = temp;
        }
        return [new cc_1.Vec2(minX, maxY), new cc_1.Vec2(minX, minY), new cc_1.Vec2(maxX, minY), new cc_1.Vec2(maxX, maxY)];
    }
    updateDataFromController() {
        if (this._controller.updated) {
            this.onControlUpdate('position');
            const rectCtrl = this._controller;
            const handleType = rectCtrl.getCurHandleType();
            const deltaSize = rectCtrl.getDeltaSize();
            if (handleType === rectangle_controller_1.RectHandleType.Area) {
                this.handleAreaMove(deltaSize);
            }
            else if (handleType === rectangle_controller_1.RectHandleType.Anchor) {
                this.handleAnchorMove(deltaSize);
            }
            else {
                const keepCenter = this._altKey;
                const keepScale = this._shiftKey;
                if (this.nodes.length > 1) {
                    this.handleMultiTargetSize(handleType, deltaSize, keepCenter);
                }
                else {
                    this.handleOneTargetSize(handleType, deltaSize, keepCenter, keepScale);
                }
            }
        }
    }
    updateControllerTransform() {
        this._controller.editable = !!this.target;
        this.updateControllerData();
    }
    updateControllerData() {
        if (!this._isInitialized || !this.nodes || this.nodes.length === 0) {
            return;
        }
        const rectCtrl = this._controller;
        rectCtrl.checkEdit();
        const length = this.nodes.length;
        if (length === 1) {
            const node = this.nodes[0];
            const worldPos = node.getWorldPosition();
            const worldRot = tempQuat_a;
            node.getWorldRotation(worldRot);
            const worldScale = node.getWorldScale();
            rectCtrl.setPosition(worldPos);
            rectCtrl.setRotation(worldRot);
            rectCtrl.setScale(worldScale);
            const uiTransComp = node.getComponent(cc_1.UITransform);
            if (uiTransComp) {
                const size = uiTransComp.contentSize;
                const anchor = uiTransComp.anchorPoint;
                const center = new cc_1.Vec3();
                center.x = (0.5 - anchor.x) * size.width;
                center.y = (0.5 - anchor.y) * size.height;
                rectCtrl.updateSize(center, new cc_1.Vec2(size.width, size.height));
            }
            else {
                rectCtrl.hide();
            }
        }
        else {
            const bounds = this.getBounds(false, false, this.nodes);
            const rect = boundsToRect(bounds);
            const rectCenter = new cc_1.Vec3(rect.x + rect.width / 2, rect.y + rect.height / 2, 0);
            rectCtrl.setPosition(rectCenter);
            rectCtrl.setRotation(cc_1.Quat.IDENTITY);
            rectCtrl.setScale(new cc_1.Vec3(1, 1, 1));
            rectCtrl.updateSize(new cc_1.Vec3(), new cc_1.Vec2(rect.width, rect.height));
        }
    }
    drawNodeGuidelineGroup(guidelineGroup) {
        if (!guidelineGroup) {
            return;
        }
        const currentGuidelines = guidelineGroup.currentGuidelines;
        if (!currentGuidelines || currentGuidelines.length <= 0) {
            return;
        }
        const color = rect_transform_snapping_1.rectTransformSnapping.guidelineColor;
        const drawLineVertices = [];
        currentGuidelines.forEach((guideline) => {
            const lineVertices = guideline.lineVertices.slice();
            const checkNode = guideline.checkNode;
            if (!checkNode) {
                return;
            }
            function posCompare(axis) {
                return function (v1, v2) {
                    return v1[axis] - v2[axis];
                };
            }
            // hack，将对齐线延长到当前检测的节点上
            const rect = rect_transform_snapping_1.rectTransformSnapping.getWorldRectEx(checkNode);
            const center = rect.center;
            const halfWidth = rect.width / 2;
            const halfHeight = rect.height / 2;
            if (guideline.axis === 'x') {
                // up
                lineVertices.push(new cc_1.Vec3(guideline.value, center.y + halfHeight, center.z));
                // down
                lineVertices.push(new cc_1.Vec3(guideline.value, center.y - halfHeight, center.z));
                lineVertices.sort(posCompare('y'));
            }
            else if (guideline.axis === 'y') {
                // left
                lineVertices.push(new cc_1.Vec3(center.x + halfWidth, guideline.value, center.z));
                // right
                lineVertices.push(new cc_1.Vec3(center.x - halfWidth, guideline.value, center.z));
                lineVertices.sort(posCompare('x'));
            }
            drawLineVertices.push(lineVertices[0]);
            drawLineVertices.push(lineVertices[lineVertices.length - 1]);
        });
        this.drawGuidelines(this._nodeSnapLinesCtrl, drawLineVertices, color);
    }
    drawNodeSnappingGuideline() {
        this.clearNodeSnappingGuideline();
        const guidelineGroups = rect_transform_snapping_1.rectTransformSnapping.nodeSnapGuidelineGroups;
        this.drawNodeGuidelineGroup(guidelineGroups[0]);
        this.drawNodeGuidelineGroup(guidelineGroups[1]);
    }
    clearNodeSnappingGuideline() {
        this._nodeSnapLinesCtrl.clearData();
    }
    getDrawLineVertices(guidelineGroup) {
        if (!guidelineGroup) {
            return null;
        }
        const currentGuidelines = guidelineGroup.currentGuidelines;
        if (!currentGuidelines || currentGuidelines.length <= 0) {
            return null;
        }
        const drawLineVertices = [];
        currentGuidelines.forEach((guideline) => {
            const lineVertices = guideline.lineVertices;
            drawLineVertices.push(lineVertices[0]);
            drawLineVertices.push(lineVertices[lineVertices.length - 1]);
        });
        return drawLineVertices;
    }
    drawGuidelineGroup(guidelineGroup, linesCtrl, color = cc_1.Color.RED) {
        if (!guidelineGroup) {
            return;
        }
        const currentGuidelines = guidelineGroup.currentGuidelines;
        if (!currentGuidelines || currentGuidelines.length <= 0) {
            return;
        }
        const drawLineVertices = [];
        currentGuidelines.forEach((guideline) => {
            const lineVertices = guideline.lineVertices;
            drawLineVertices.push(lineVertices[0]);
            drawLineVertices.push(lineVertices[lineVertices.length - 1]);
        });
        linesCtrl.setColor(color);
        const lineIndices = [];
        drawLineVertices.forEach((_value, index) => {
            lineIndices.push(index);
        });
        linesCtrl.updateData(drawLineVertices, lineIndices);
    }
    drawGuidelines(linesCtrl, drawLineVertices, color = cc_1.Color.RED) {
        linesCtrl.setColor(color);
        const lineIndices = [];
        drawLineVertices.forEach((_value, index) => {
            lineIndices.push(index);
        });
        linesCtrl.updateData(drawLineVertices, lineIndices);
    }
    drawCanvasSnappingGuideline() {
        this.clearCanvasSnappingGuideline();
        const guidelineGroups = rect_transform_snapping_1.rectTransformSnapping.canvasSnapGuidelineGroups;
        const color = rect_transform_snapping_1.rectTransformSnapping.canvasSnapColor;
        const drawLineVertices = [];
        let lineVertices = this.getDrawLineVertices(guidelineGroups[0]);
        if (lineVertices) {
            drawLineVertices.push(...lineVertices);
        }
        lineVertices = this.getDrawLineVertices(guidelineGroups[1]);
        if (lineVertices) {
            drawLineVertices.push(...lineVertices);
        }
        this.drawGuidelines(this._canvasSnapLinesCtrl, drawLineVertices, color);
    }
    clearCanvasSnappingGuideline() {
        this._canvasSnapLinesCtrl.clearData();
    }
    drawEqualSpacingGuideline() {
        this.clearEqualSpacingGuideline();
        const currentMatchMinDistInfos = rect_transform_snapping_1.rectTransformSnapping.currentMatchMinDistInfos;
        const color = rect_transform_snapping_1.rectTransformSnapping.guidelineColor;
        const sideHalfLength = 10;
        const drawLineVertices = [];
        currentMatchMinDistInfos.forEach((info) => {
            const startPos = info.minDistPosA;
            const endPos = info.minDistPosB;
            drawLineVertices.push(startPos);
            drawLineVertices.push(endPos);
            // add more detail
            if (info.axis === 'x') {
                // draw like this
                // |-----|
                drawLineVertices.push(new cc_1.Vec3(startPos.x, startPos.y + sideHalfLength));
                drawLineVertices.push(new cc_1.Vec3(startPos.x, startPos.y - sideHalfLength));
                drawLineVertices.push(new cc_1.Vec3(endPos.x, endPos.y + sideHalfLength));
                drawLineVertices.push(new cc_1.Vec3(endPos.x, endPos.y - sideHalfLength));
            }
            else if (info.axis === 'y') {
                // draw like this
                // ---
                //  |
                // ---
                drawLineVertices.push(new cc_1.Vec3(startPos.x - sideHalfLength, startPos.y));
                drawLineVertices.push(new cc_1.Vec3(startPos.x + sideHalfLength, startPos.y));
                drawLineVertices.push(new cc_1.Vec3(endPos.x - sideHalfLength, endPos.y));
                drawLineVertices.push(new cc_1.Vec3(endPos.x + sideHalfLength, endPos.y));
            }
        });
        this.drawGuidelines(this._equalSpacingLinesCtrl, drawLineVertices, color);
    }
    clearEqualSpacingGuideline() {
        this._equalSpacingLinesCtrl.clearData();
    }
}
exports.default = RectGizmo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjdGFuZ2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2dpem1vL25vZGUvcmVjdGFuZ2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFFYiwyQkFBK0c7QUFFL0csc0VBQWtEO0FBQ2xELGlFQUEyRjtBQUMzRixvREFBNEc7QUFDNUcsOEVBQTZGO0FBQzdGLGdFQUFrRDtBQUVsRCxTQUFTLFVBQVU7SUFDZixJQUFJLENBQUM7UUFDRCxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDcEQsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLEdBQVcsRUFBRSxDQUFTO0lBQ3ZDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLENBQU8sRUFBRSxDQUFTO0lBQzNDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFCLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMs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QUFLLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsV0FBVyxDQUFDLFdBQVcsR0FBRyxJQUFJLFNBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELHFCQUFxQixDQUFDLElBQWdCLEVBQUUsS0FBVyxFQUFFLFVBQW1CO1FBQ3BFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0MsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQy9CLE1BQU0sTUFBTSxHQUFHLElBQUksU0FBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUU5QixTQUFTLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4RSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFFdEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2RCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUM7WUFDOUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV2QyxNQUFNLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDMUQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzNELE1BQU0sTUFBTSxHQUFHLElBQUksU0FBSSxDQUNuQixJQUFJLENBQUMsQ0FBQyxHQUFHLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUM5QixJQUFJLENBQUMsQ0FBQyxHQUFHLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUMvQixRQUFRLENBQUMsQ0FBQyxDQUNiLENBQUM7WUFDRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFOUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDekMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTNDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0IsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzdCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7WUFDdkIsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztZQUV2QixNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDL0IsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDM0IsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFM0IsV0FBVyxDQUFDLFdBQVcsR0FBRyxJQUFJLFNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUUsQ0FBQztJQUNMLENBQUM7SUFFRCxTQUFTLENBQUMsS0FBYyxFQUFFLEtBQWMsRUFBRSxLQUFhO1FBQ25ELElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUN0RCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFDdEQsU0FBUyxVQUFVLENBQUMsQ0FBTTtZQUN0QixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSTtnQkFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSTtnQkFB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RSxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDM0IsaUJBQWlCO2dCQUNqQixNQUFNO2dCQUNOLEtBQUs7Z0JBQ0wsTUFBTTtnQkFDTixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLFNBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksU0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekUsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDOUUsQ0FBQztJQUVELDBCQUEwQjtRQUN0QixJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDNUMsQ0FBQztDQUNKO0FBRUQsa0JBQWUsU0FBUyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBDQ09iamVjdCwgQ29sb3IsIElWZWMyTGlrZSwgTGF5ZXJzLCBNYXQ0LCBOb2RlLCBRdWF0LCBSZWN0LCBTaXplLCBVSVRyYW5zZm9ybSwgVmVjMiwgVmVjMyB9IGZyb20gJ2NjJztcbmltcG9ydCB0eXBlIHsgR2l6bW9Nb3VzZUV2ZW50IH0gZnJvbSAnLi4vdXRpbHMvZGVmaW5lcyc7XG5pbXBvcnQgVHJhbnNmb3JtQmFzZUdpem1vIGZyb20gJy4vdHJhbnNmb3JtLWJhc2UnO1xuaW1wb3J0IHsgUmVjdGFuZ2xlQ29udHJvbGxlciwgUmVjdEhhbmRsZVR5cGUgYXMgSGFuZGxlVHlwZSB9IGZyb20gJy4vcmVjdGFuZ2xlLWNvbnRyb2xsZXInO1xuaW1wb3J0IHsgZ2V0UmF5Y2FzdFJlc3VsdE5vZGVzLCBnZXROb2RlV29ybGRCb3VuZHMsIGdldE5vZGVXb3JsZE9yaWVudGVkQm91bmRzIH0gZnJvbSAnLi4vdXRpbHMvbm9kZS11dGlscyc7XG5pbXBvcnQgeyByZWN0VHJhbnNmb3JtU25hcHBpbmcsIFNuYXBHdWlkZWxpbmVHcm91cCB9IGZyb20gJy4uL3V0aWxzL3JlY3QtdHJhbnNmb3JtLXNuYXBwaW5nJztcbmltcG9ydCBMaW5lc0NvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlci9saW5lcyc7XG5cbmZ1bmN0aW9uIGdldFNlcnZpY2UoKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgIHJldHVybiBTZXJ2aWNlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0b1ByZWNpc2lvbih2YWw6IG51bWJlciwgbjogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBmID0gTWF0aC5wb3coMTAsIG4pO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbCAqIGYpIC8gZjtcbn1cblxuZnVuY3Rpb24gbWFrZVZlYzNJblByZWNpc2lvbih2OiBWZWMzLCBwOiBudW1iZXIpOiBWZWMzIHtcbiAgICBjb25zdCBmID0gTWF0aC5wb3coMTAsIHApO1xuICAgIHYueCA9IE1hdGgucm91bmQodi54ICogZikgLyBmO1xuICAgIHYueSA9IE1hdGgucm91bmQodi55ICogZikgLyBmO1xuICAgIHYueiA9IE1hdGgucm91bmQodi56ICogZikgLyBmO1xuICAgIHJldHVybiB2O1xufVxuXG5mdW5jdGlvbiBib3VuZHNUb1JlY3QoYm91bmRzOiBJVmVjMkxpa2VbXSkge1xuICAgIHJldHVybiBuZXcgUmVjdChcbiAgICAgICAgYm91bmRzWzFdLngsIGJvdW5kc1sxXS55LFxuICAgICAgICBib3VuZHNbM10ueCAtIGJvdW5kc1sxXS54LFxuICAgICAgICBib3VuZHNbM10ueSAtIGJvdW5kc1sxXS55LFxuICAgICk7XG59XG5cbmNvbnN0IHRlbXBWZWMyID0gbmV3IFZlYzIoKTtcbmNvbnN0IHRlbXBWZWMzID0gbmV3IFZlYzMoKTtcbmNvbnN0IHRlbXBNYXQ0ID0gbmV3IE1hdDQoKTtcbmNvbnN0IHRlbXBRdWF0X2EgPSBuZXcgUXVhdCgpO1xuXG5sZXQgX2NvbnRyb2xsZXI6IFJlY3RhbmdsZUNvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcbmxldCBfbm9kZVNuYXBMaW5lc0N0cmwhOiBMaW5lc0NvbnRyb2xsZXI7XG5sZXQgX2NhbnZhc1NuYXBMaW5lc0N0cmwhOiBMaW5lc0NvbnRyb2xsZXI7XG5sZXQgX2VxdWFsU3BhY2luZ0xpbmVzQ3RybCE6IExpbmVzQ29udHJvbGxlcjtcblxuY2xhc3MgUmVjdEdpem1vIGV4dGVuZHMgVHJhbnNmb3JtQmFzZUdpem1vIHtcbiAgICBkZWNsYXJlIHByb3RlY3RlZCBfY29udHJvbGxlcjogUmVjdGFuZ2xlQ29udHJvbGxlcjtcblxuICAgIHByaXZhdGUgX3dvcmxkUG9zTGlzdDogVmVjM1tdID0gW107XG4gICAgcHJpdmF0ZSBfbG9jYWxQb3NMaXN0OiBWZWMzW10gPSBbXTtcbiAgICBwcml2YXRlIF9zaXplTGlzdDogU2l6ZVtdID0gW107XG4gICAgcHJpdmF0ZSBfYW5jaG9yTGlzdDogVmVjMltdID0gW107XG4gICAgcHJpdmF0ZSBfcmVjdExpc3Q6IFJlY3RbXSA9IFtdO1xuICAgIHByaXZhdGUgX3ZhbGlkVGFyZ2V0OiBVSVRyYW5zZm9ybVtdID0gW107XG4gICAgcHJpdmF0ZSBfdGVtcFJlY3QgPSBuZXcgUmVjdCgpO1xuICAgIHByaXZhdGUgX2VkaXRSZWN0ID0gbmV3IFJlY3QoKTtcbiAgICBwcml2YXRlIF9hbHRLZXkgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9zaGlmdEtleSA9IGZhbHNlO1xuXG4gICAgLy8gZm9yIHNuYXBwaW5nXG4gICAgcHJpdmF0ZSBfc25hcERpc3RWZWMyID0gbmV3IFZlYzIoKTtcbiAgICBwcml2YXRlIF9ub2RlU25hcExpbmVzQ3RybCE6IExpbmVzQ29udHJvbGxlcjtcbiAgICBwcml2YXRlIF9jYW52YXNTbmFwTGluZXNDdHJsITogTGluZXNDb250cm9sbGVyO1xuICAgIHByaXZhdGUgX2VxdWFsU3BhY2luZ0xpbmVzQ3RybCE6IExpbmVzQ29udHJvbGxlcjtcblxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIGxheWVyKCkge1xuICAgICAgICByZXR1cm4gJ2ZvcmVncm91bmQnO1xuICAgIH1cblxuICAgIGlzTm9kZVBvc2l0aW9uTG9ja2VkKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGUuY29tcG9uZW50cy5zb21lKChjb21wb25lbnQ6IGFueSkgPT4gY29tcG9uZW50Ll9vYmpGbGFncyAmIENDT2JqZWN0LkZsYWdzLklzUG9zaXRpb25Mb2NrZWQpO1xuICAgIH1cblxuICAgIGlzTm9kZUFuY2hvckxvY2tlZChub2RlOiBOb2RlKSB7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlLmNvbXBvbmVudHMuc29tZSgoY29tcG9uZW50OiBhbnkpID0+IGNvbXBvbmVudC5fb2JqRmxhZ3MgJiBDQ09iamVjdC5GbGFncy5Jc0FuY2hvckxvY2tlZCk7XG4gICAgfVxuXG4gICAgaXNOb2RlQ29udGVudFNpemVMb2NrZWQobm9kZTogTm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZS5jb21wb25lbnRzLnNvbWUoKGNvbXBvbmVudDogYW55KSA9PiBjb21wb25lbnQuX29iakZsYWdzICYgQ0NPYmplY3QuRmxhZ3MuSXNTaXplTG9ja2VkKTtcbiAgICB9XG5cbiAgICBvblRhcmdldFVwZGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgaWYgKF9jb250cm9sbGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyID0gX2NvbnRyb2xsZXI7XG4gICAgICAgICAgICBfY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZURvd24gPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlRG93bi5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgX2NvbnRyb2xsZXIub25Db250cm9sbGVyTW91c2VNb3ZlID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZU1vdmUuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIF9jb250cm9sbGVyLm9uQ29udHJvbGxlck1vdXNlVXAgPSB0aGlzLm9uQ29udHJvbGxlck1vdXNlVXAuYmluZCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfbm9kZVNuYXBMaW5lc0N0cmwpIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVTbmFwTGluZXNDdHJsID0gX25vZGVTbmFwTGluZXNDdHJsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfY2FudmFzU25hcExpbmVzQ3RybCkge1xuICAgICAgICAgICAgdGhpcy5fY2FudmFzU25hcExpbmVzQ3RybCA9IF9jYW52YXNTbmFwTGluZXNDdHJsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfZXF1YWxTcGFjaW5nTGluZXNDdHJsKSB7XG4gICAgICAgICAgICB0aGlzLl9lcXVhbFNwYWNpbmdMaW5lc0N0cmwgPSBfZXF1YWxTcGFjaW5nTGluZXNDdHJsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9jb250cm9sbGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLmVkaXRhYmxlID0gISF0aGlzLnRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci5vblRhcmdldFVwZGF0ZSgpO1xuICAgIH1cblxuICAgIGNyZWF0ZUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIGlmIChfY29udHJvbGxlcikge1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IF9jb250cm9sbGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZ2l6bW9Sb290ID0gdGhpcy5nZXRHaXptb1Jvb3QoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlY3RDdHJsID0gbmV3IFJlY3RhbmdsZUNvbnRyb2xsZXIoZ2l6bW9Sb290LCB7IG5lZWRBbmNob3I6IHRydWUgfSk7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyID0gX2NvbnRyb2xsZXIgPSByZWN0Q3RybDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBnaXptb1Jvb3QgPSB0aGlzLmdldEdpem1vUm9vdCgpO1xuXG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2V0Q29sb3IobmV3IENvbG9yKDAsIDE1MywgMjU1KSk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuc2V0RWRpdEhhbmRsZXNDb2xvcihuZXcgQ29sb3IoMCwgMTUzLCAyNTUpKTtcblxuICAgICAgICB0aGlzLl9jb250cm9sbGVyLm9uQ29udHJvbGxlck1vdXNlRG93biA9IHRoaXMub25Db250cm9sbGVyTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIub25Db250cm9sbGVyTW91c2VNb3ZlID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZU1vdmUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5vbkNvbnRyb2xsZXJNb3VzZVVwID0gdGhpcy5vbkNvbnRyb2xsZXJNb3VzZVVwLmJpbmQodGhpcyk7XG5cbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5lZGl0YWJsZSA9ICEhdGhpcy50YXJnZXQ7XG5cbiAgICAgICAgaWYgKF9ub2RlU25hcExpbmVzQ3RybCkge1xuICAgICAgICAgICAgdGhpcy5fbm9kZVNuYXBMaW5lc0N0cmwgPSBfbm9kZVNuYXBMaW5lc0N0cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ub2RlU25hcExpbmVzQ3RybCA9IF9ub2RlU25hcExpbmVzQ3RybCA9IG5ldyBMaW5lc0NvbnRyb2xsZXIoZ2l6bW9Sb290KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoX2NhbnZhc1NuYXBMaW5lc0N0cmwpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbnZhc1NuYXBMaW5lc0N0cmwgPSBfY2FudmFzU25hcExpbmVzQ3RybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbnZhc1NuYXBMaW5lc0N0cmwgPSBfY2FudmFzU25hcExpbmVzQ3RybCA9IG5ldyBMaW5lc0NvbnRyb2xsZXIoZ2l6bW9Sb290KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoX2VxdWFsU3BhY2luZ0xpbmVzQ3RybCkge1xuICAgICAgICAgICAgdGhpcy5fZXF1YWxTcGFjaW5nTGluZXNDdHJsID0gX2VxdWFsU3BhY2luZ0xpbmVzQ3RybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2VxdWFsU3BhY2luZ0xpbmVzQ3RybCA9IF9lcXVhbFNwYWNpbmdMaW5lc0N0cmwgPSBuZXcgTGluZXNDb250cm9sbGVyKGdpem1vUm9vdCwgeyBkYXNoZWQ6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZURvd24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb250cm9sbGVyICYmIHRoaXMubm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLmNvbnRlbnRTaXplTG9ja2VkID0gdGhpcy5ub2Rlcy5zb21lKG5vZGUgPT4gdGhpcy5pc05vZGVDb250ZW50U2l6ZUxvY2tlZChub2RlKSk7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLmFuY2hvckxvY2tlZCA9IHRoaXMubm9kZXMuc29tZShub2RlID0+IHRoaXMuaXNOb2RlQW5jaG9yTG9ja2VkKG5vZGUpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl93b3JsZFBvc0xpc3QubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5fbG9jYWxQb3NMaXN0Lmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuX3NpemVMaXN0Lmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuX2FuY2hvckxpc3QubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5fcmVjdExpc3QubGVuZ3RoID0gMDtcbiAgICAgICAgLy8g5Y+v6IO95pyJ5LiN5ZCrIHVpIHRyYW5zZm9ybSBjb21wb25lbnQg55qEIG5vZGUg6KKr6YCJ5Lit77yM5YmU6Zmk5o6JXG4gICAgICAgIHRoaXMuX3ZhbGlkVGFyZ2V0Lmxlbmd0aCA9IDA7XG5cbiAgICAgICAgY29uc3Qgbm9kZXMgPSB0aGlzLm5vZGVzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICBjb25zdCB1aVRyYW5zQ29tcCA9IG5vZGUuZ2V0Q29tcG9uZW50KFVJVHJhbnNmb3JtKTtcbiAgICAgICAgICAgIGlmICh1aVRyYW5zQ29tcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZhbGlkVGFyZ2V0LnB1c2godWlUcmFuc0NvbXApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dvcmxkUG9zTGlzdC5wdXNoKG5vZGUuZ2V0V29ybGRQb3NpdGlvbigpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2NhbFBvc0xpc3QucHVzaChub2RlLmdldFBvc2l0aW9uKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NpemVMaXN0LnB1c2godWlUcmFuc0NvbXAuY29udGVudFNpemUuY2xvbmUoKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYW5jaG9yTGlzdC5wdXNoKHVpVHJhbnNDb21wLmFuY2hvclBvaW50LmNsb25lKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlY3RMaXN0LnB1c2goZ2V0Tm9kZVdvcmxkQm91bmRzKG5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhbGlkTm9kZXMgPSB0aGlzLl92YWxpZFRhcmdldC5tYXAodCA9PiB0Lm5vZGUpO1xuICAgICAgICBjb25zdCBib3VuZHMgPSB0aGlzLmdldEJvdW5kcyhmYWxzZSwgZmFsc2UsIHZhbGlkTm9kZXMpO1xuICAgICAgICB0aGlzLl90ZW1wUmVjdCA9IGJvdW5kc1RvUmVjdChib3VuZHMpO1xuXG4gICAgICAgIGNvbnN0IHNjYWxlID0gdGhpcy5fY29udHJvbGxlci50cmFuc2Zvcm1Ub29sRGF0YT8uc2NhbGUyRCA/PyAxO1xuICAgICAgICBjb25zdCBzbmFwRGlzdCA9IHJlY3RUcmFuc2Zvcm1TbmFwcGluZy5zbmFwVGhyZXNob2xkIC8gc2NhbGU7XG4gICAgICAgIHRoaXMuX3NuYXBEaXN0VmVjMi54ID0gc25hcERpc3Q7XG4gICAgICAgIHRoaXMuX3NuYXBEaXN0VmVjMi55ID0gc25hcERpc3Q7XG5cbiAgICAgICAgaWYgKHJlY3RUcmFuc2Zvcm1TbmFwcGluZy5lbmFibGVTbmFwcGluZykge1xuICAgICAgICAgICAgLy8g5pqC5pe25Y+q5aSE55CG5Y2V6YCJ5oOF5Ya1XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5ub2Rlc1swXTtcbiAgICAgICAgICAgIGlmIChub2RlICYmIG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmVjdFRyYW5zZm9ybVNuYXBwaW5nLmNhbGN1bGF0ZU5vZGVTbmFwR3VpZGVsaW5lcyhub2RlLnBhcmVudCwgbm9kZSk7XG4gICAgICAgICAgICAgICAgcmVjdFRyYW5zZm9ybVNuYXBwaW5nLmNhbGN1bGF0ZUNhbnZhc1NuYXBHdWlkZWxpbmVzKCk7XG4gICAgICAgICAgICAgICAgcmVjdFRyYW5zZm9ybVNuYXBwaW5nLmNhbGN1bGF0ZVNwYWNpbmdTbmFwR3VpZGVsaW5lcyhub2RlLnBhcmVudCwgbm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkNvbnRyb2xsZXJNb3VzZU1vdmUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YUZyb21Db250cm9sbGVyKCk7XG4gICAgfVxuXG4gICAgb25Db250cm9sbGVyTW91c2VVcChldmVudDogR2l6bW9Nb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLl9jb250cm9sbGVyLnVwZGF0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMub25Db250cm9sRW5kKCdwb3NpdGlvbicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc3ZjID0gZ2V0U2VydmljZSgpO1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWQ6IHN0cmluZ1tdID0gc3ZjPy5TZWxlY3Rpb24/LnF1ZXJ5Py4oKSA/PyBbXTtcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYW1lcmEgPSBzdmM/LkNhbWVyYT8uZ2V0Q2FtZXJhPy4oKT8uY2FtZXJhO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hc2sgPSBMYXllcnMubWFrZU1hc2tFeGNsdWRlKFtMYXllcnMuRW51bS5HSVpNT1MsIExheWVycy5FbnVtLlNDRU5FX0dJWk1PXSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGdldFJheWNhc3RSZXN1bHROb2RlcyhjYW1lcmEsIGV2ZW50LngsIGV2ZW50LnksIG1hc2spO1xuICAgICAgICAgICAgICAgIGNvbnN0IEVkaXRvckV4dGVuZHMgPSAoY2MgYXMgYW55KS5FZGl0b3JFeHRlbmRzIHx8IChnbG9iYWxUaGlzIGFzIGFueSkuRWRpdG9yRXh0ZW5kcztcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdFNlbGVjdGlvbiA9IHNlbGVjdGVkWzBdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRQYXRoID0gRWRpdG9yRXh0ZW5kcz8uTm9kZT8uZ2V0Tm9kZVBhdGg/LihyZXN1bHRzW2ldKSA/PyAnJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdHNbaV0gJiYgZmlyc3RTZWxlY3Rpb24gPT09IHJlc3VsdFBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID09PSByZXN1bHRzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0UGF0aCA9IEVkaXRvckV4dGVuZHM/Lk5vZGU/LmdldE5vZGVQYXRoPy4ocmVzdWx0c1swXSkgPz8gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ZjPy5TZWxlY3Rpb24/LnVuc2VsZWN0Py4oZmlyc3RTZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0UGF0aCkgc3ZjPy5TZWxlY3Rpb24/LnNlbGVjdD8uKG5leHRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0c1tpICsgMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0UGF0aCA9IEVkaXRvckV4dGVuZHM/Lk5vZGU/LmdldE5vZGVQYXRoPy4ocmVzdWx0c1tpICsgMV0pID8/ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN2Yz8uU2VsZWN0aW9uPy51bnNlbGVjdD8uKGZpcnN0U2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFBhdGgpIHN2Yz8uU2VsZWN0aW9uPy5zZWxlY3Q/LihuZXh0UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xlYXJOb2RlU25hcHBpbmdHdWlkZWxpbmUoKTtcbiAgICAgICAgdGhpcy5jbGVhckNhbnZhc1NuYXBwaW5nR3VpZGVsaW5lKCk7XG4gICAgICAgIHRoaXMuY2xlYXJFcXVhbFNwYWNpbmdHdWlkZWxpbmUoKTtcbiAgICB9XG5cbiAgICBvbktleURvd24oZXZlbnQ6IGFueSkge1xuICAgICAgICB0aGlzLl9hbHRLZXkgPSBldmVudC5hbHRLZXk7XG4gICAgICAgIHRoaXMuX3NoaWZ0S2V5ID0gZXZlbnQuc2hpZnRLZXk7XG4gICAgICAgIHJldHVybiBzdXBlci5vbktleURvd24oZXZlbnQpO1xuICAgIH1cblxuICAgIG9uS2V5VXAoZXZlbnQ6IGFueSkge1xuICAgICAgICBjb25zdCBjdXJUeXBlID0gdGhpcy5fY29udHJvbGxlci5nZXRDdXJIYW5kbGVUeXBlKCk7XG4gICAgICAgIGNvbnN0IGN1ckhhbmRsZUlzQ29ybmVyID0gdGhpcy5fY29udHJvbGxlci5pc0Nvcm5lcihjdXJUeXBlKSB8fCB0aGlzLl9jb250cm9sbGVyLmlzQm9yZGVyKGN1clR5cGUpO1xuICAgICAgICBjb25zdCBpc0FsdFR1cm5Ub0ZhbHNlID0gdGhpcy5fYWx0S2V5ICYmICFldmVudC5hbHRLZXk7XG4gICAgICAgIGlmIChpc0FsdFR1cm5Ub0ZhbHNlICYmIGN1ckhhbmRsZUlzQ29ybmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWx0S2V5ID0gZXZlbnQuYWx0S2V5O1xuICAgICAgICB0aGlzLl9zaGlmdEtleSA9IGV2ZW50LnNoaWZ0S2V5O1xuXG4gICAgICAgIHJldHVybiBzdXBlci5vbktleVVwKGV2ZW50KTtcbiAgICB9XG5cbiAgICBoYW5kbGVBcmVhTW92ZShkZWx0YTogVmVjMykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3ZhbGlkVGFyZ2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fdmFsaWRUYXJnZXRbaV0ubm9kZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNOb2RlUG9zaXRpb25Mb2NrZWQobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgd29ybGRQb3MgPSB0aGlzLl93b3JsZFBvc0xpc3RbaV07XG4gICAgICAgICAgICBsZXQgcmVjdFRvb2xQb3MgPSBuZXcgVmVjMygpO1xuICAgICAgICAgICAgVmVjMy5hZGQocmVjdFRvb2xQb3MsIHdvcmxkUG9zLCBkZWx0YSk7XG5cbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlY3RUcmFuc2Zvcm1TbmFwcGluZy5lbmFibGVTbmFwcGluZykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5fcmVjdExpc3RbaV07XG4gICAgICAgICAgICAgICAgICAgIHJlY3RUb29sUG9zID0gcmVjdFRyYW5zZm9ybVNuYXBwaW5nLnNuYXBQb3NUb05vZGVHdWlkZWxpbmVzKHJlY3RUb29sUG9zLCByZWN0LCB0aGlzLl9zbmFwRGlzdFZlYzIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdOb2RlU25hcHBpbmdHdWlkZWxpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVjdFRvb2xQb3MgPSByZWN0VHJhbnNmb3JtU25hcHBpbmcuc25hcFBvc1RvQ2FudmFzU25hcEd1aWRlbGluZXMocmVjdFRvb2xQb3MsIHJlY3QsIHRoaXMuX3NuYXBEaXN0VmVjMik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0NhbnZhc1NuYXBwaW5nR3VpZGVsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlY3RUb29sUG9zID0gcmVjdFRyYW5zZm9ybVNuYXBwaW5nLnNuYXBQb3NUb0VxdWFsU3BhY2luZyhyZWN0VG9vbFBvcywgcmVjdCwgdGhpcy5fc25hcERpc3RWZWMyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3RXF1YWxTcGFjaW5nR3VpZGVsaW5lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWN0VG9vbFBvcy54ID0gdG9QcmVjaXNpb24ocmVjdFRvb2xQb3MueCwgMyk7XG4gICAgICAgICAgICByZWN0VG9vbFBvcy55ID0gdG9QcmVjaXNpb24ocmVjdFRvb2xQb3MueSwgMyk7XG4gICAgICAgICAgICBub2RlLnNldFdvcmxkUG9zaXRpb24ocmVjdFRvb2xQb3MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaGFuZGxlQW5jaG9yTW92ZShkZWx0YTogVmVjMykge1xuICAgICAgICAvLyDkuI3lpITnkIblpJpVSemAieaLqeeahGFuY2hvcue8lui+kVxuICAgICAgICBpZiAodGhpcy5fdmFsaWRUYXJnZXQubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdWlUcmFuc0NvbXAgPSB0aGlzLl92YWxpZFRhcmdldFswXTtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHVpVHJhbnNDb21wLm5vZGU7XG4gICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLl9zaXplTGlzdFswXTtcbiAgICAgICAgY29uc3Qgb2xkQW5jaG9yID0gdGhpcy5fYW5jaG9yTGlzdFswXTtcbiAgICAgICAgY29uc3Qgd29ybGRQb3MgPSB0aGlzLl93b3JsZFBvc0xpc3RbMF07XG5cbiAgICAgICAgY29uc3QgcG9zRGVsdGEgPSBkZWx0YS5jbG9uZSgpO1xuICAgICAgICBtYWtlVmVjM0luUHJlY2lzaW9uKHBvc0RlbHRhLCAzKTtcbiAgICAgICAgdGVtcFZlYzMuc2V0KHdvcmxkUG9zKTtcbiAgICAgICAgdGVtcFZlYzMuYWRkKHBvc0RlbHRhKTtcbiAgICAgICAgbm9kZS5zZXRXb3JsZFBvc2l0aW9uKHRlbXBWZWMzKTtcblxuICAgICAgICAvLyDovazmjaLliLDlsYDpg6jlnZDmoIdcbiAgICAgICAgbm9kZS5nZXRXb3JsZE1hdHJpeCh0ZW1wTWF0NCk7XG4gICAgICAgIE1hdDQuaW52ZXJ0KHRlbXBNYXQ0LCB0ZW1wTWF0NCk7XG4gICAgICAgIHRlbXBNYXQ0Lm0xMiA9IHRlbXBNYXQ0Lm0xMyA9IDA7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NChwb3NEZWx0YSwgcG9zRGVsdGEsIHRlbXBNYXQ0KTtcblxuICAgICAgICB0ZW1wVmVjMi54ID0gcG9zRGVsdGEueCAvIHNpemUud2lkdGg7XG4gICAgICAgIHRlbXBWZWMyLnkgPSBwb3NEZWx0YS55IC8gc2l6ZS5oZWlnaHQ7XG5cbiAgICAgICAgdGVtcFZlYzIuYWRkKG9sZEFuY2hvcik7XG4gICAgICAgIHVpVHJhbnNDb21wLmFuY2hvclBvaW50ID0gdGVtcFZlYzI7XG4gICAgfVxuXG4gICAgZ2V0U2l6ZVBvaW50KHR5cGU6IEhhbmRsZVR5cGUpIHtcbiAgICAgICAgY29uc3Qgc2l6ZVBvaW50UG9zID0gbmV3IFZlYzIoKTtcblxuICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5fcmVjdExpc3RbMF07XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IEhhbmRsZVR5cGUuUmlnaHQgfHxcbiAgICAgICAgICAgIHR5cGUgPT09IEhhbmRsZVR5cGUuVG9wUmlnaHQgfHxcbiAgICAgICAgICAgIHR5cGUgPT09IEhhbmRsZVR5cGUuQm90dG9tUmlnaHQpIHtcbiAgICAgICAgICAgIHNpemVQb2ludFBvcy54ID0gcmVjdC54ICsgcmVjdC53aWR0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNpemVQb2ludFBvcy54ID0gcmVjdC54O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IEhhbmRsZVR5cGUuQm90dG9tTGVmdCB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gSGFuZGxlVHlwZS5Cb3R0b20gfHxcbiAgICAgICAgICAgIHR5cGUgPT09IEhhbmRsZVR5cGUuQm90dG9tUmlnaHQpIHtcbiAgICAgICAgICAgIHNpemVQb2ludFBvcy55ID0gcmVjdC55O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2l6ZVBvaW50UG9zLnkgPSByZWN0LnkgKyByZWN0LmhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzaXplUG9pbnRQb3M7XG4gICAgfVxuXG4gICAgbW9kaWZ5UG9zRGVsdGFXaXRoQW5jaG9yKHR5cGU6IGFueSwgcG9zRGVsdGE6IFZlYzMsIHNpemVEZWx0YTogVmVjMiwgYW5jaG9yOiBWZWMyLCBrZWVwQ2VudGVyOiBib29sZWFuKSB7XG4gICAgICAgIGlmICh0eXBlID09PSBIYW5kbGVUeXBlLlJpZ2h0IHx8XG4gICAgICAgICAgICB0eXBlID09PSBIYW5kbGVUeXBlLlRvcFJpZ2h0IHx8XG4gICAgICAgICAgICB0eXBlID09PSBIYW5kbGVUeXBlLkJvdHRvbVJpZ2h0KSB7XG4gICAgICAgICAgICBpZiAoa2VlcENlbnRlcikge1xuICAgICAgICAgICAgICAgIHNpemVEZWx0YS54IC89ICgxIC0gYW5jaG9yLngpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9zRGVsdGEueCA9IHNpemVEZWx0YS54ICogYW5jaG9yLng7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoa2VlcENlbnRlcikge1xuICAgICAgICAgICAgICAgIHNpemVEZWx0YS54IC89IGFuY2hvci54O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9zRGVsdGEueCA9IC1zaXplRGVsdGEueCAqICgxIC0gYW5jaG9yLngpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IEhhbmRsZVR5cGUuQm90dG9tIHx8XG4gICAgICAgICAgICB0eXBlID09PSBIYW5kbGVUeXBlLkJvdHRvbVJpZ2h0IHx8XG4gICAgICAgICAgICB0eXBlID09PSBIYW5kbGVUeXBlLkJvdHRvbUxlZnQpIHtcbiAgICAgICAgICAgIGlmIChrZWVwQ2VudGVyKSB7XG4gICAgICAgICAgICAgICAgc2l6ZURlbHRhLnkgLz0gYW5jaG9yLnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3NEZWx0YS55ID0gLXNpemVEZWx0YS55ICogKDEgLSBhbmNob3IueSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoa2VlcENlbnRlcikge1xuICAgICAgICAgICAgICAgIHNpemVEZWx0YS55IC89ICgxIC0gYW5jaG9yLnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9zRGVsdGEueSA9IHNpemVEZWx0YS55ICogYW5jaG9yLnk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDnlKjkuo5zaXpl5a696auY5aSn5bCP55qEZGVsdGHlj5jljJbmmKDlsITliLDovrnmoYblnZDmoIfngrnnmoRkZWx0YeWPmOWMllxuICAgIGZvcm1hdFNpemVEZWx0YSh0eXBlOiBIYW5kbGVUeXBlLCBzaXplRGVsdGE6IFZlYzIpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09IEhhbmRsZVR5cGUuTGVmdCB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gSGFuZGxlVHlwZS5Ub3BMZWZ0IHx8XG4gICAgICAgICAgICB0eXBlID09PSBIYW5kbGVUeXBlLkJvdHRvbUxlZnQpIHtcbiAgICAgICAgICAgIHNpemVEZWx0YS54ID0gLXNpemVEZWx0YS54O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IEhhbmRsZVR5cGUuQm90dG9tIHx8XG4gICAgICAgICAgICB0eXBlID09PSBIYW5kbGVUeXBlLkJvdHRvbVJpZ2h0IHx8XG4gICAgICAgICAgICB0eXBlID09PSBIYW5kbGVUeXBlLkJvdHRvbUxlZnQpIHtcbiAgICAgICAgICAgIHNpemVEZWx0YS55ID0gLXNpemVEZWx0YS55O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaGFuZGxlT25lVGFyZ2V0U2l6ZSh0eXBlOiBIYW5kbGVUeXBlLCBkZWx0YTogVmVjMywga2VlcENlbnRlcjogYm9vbGVhbiwga2VlcFNjYWxlOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLl9zaXplTGlzdFswXTtcblxuICAgICAgICBjb25zdCBwb3NEZWx0YSA9IGRlbHRhLmNsb25lKCk7XG4gICAgICAgIGxldCBzaXplRGVsdGEgPSBuZXcgVmVjMihkZWx0YS54LCBkZWx0YS55KTtcbiAgICAgICAgY29uc3QgbG9jYWxQb3MgPSB0aGlzLl9sb2NhbFBvc0xpc3RbMF07XG4gICAgICAgIGNvbnN0IHVpVHJhbnNDb21wID0gdGhpcy5fdmFsaWRUYXJnZXRbMF07XG4gICAgICAgIGNvbnN0IG5vZGUgPSB1aVRyYW5zQ29tcC5ub2RlO1xuICAgICAgICBjb25zdCBhbmNob3IgPSB0aGlzLl9hbmNob3JMaXN0WzBdO1xuXG4gICAgICAgIGlmIChyZWN0VHJhbnNmb3JtU25hcHBpbmcuZW5hYmxlU25hcHBpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0U2l6ZURlbHRhKHR5cGUsIHNpemVEZWx0YSk7XG4gICAgICAgICAgICBzaXplRGVsdGEgPSByZWN0VHJhbnNmb3JtU25hcHBpbmcuc25hcFNpemVUb05vZGVHdWlkZWxpbmVzKHRoaXMuZ2V0U2l6ZVBvaW50KHR5cGUpLCBzaXplRGVsdGEsIHRoaXMuX3NuYXBEaXN0VmVjMik7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdFNpemVEZWx0YSh0eXBlLCBzaXplRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5kcmF3Tm9kZVNuYXBwaW5nR3VpZGVsaW5lKCk7XG4gICAgICAgIH1cblxuICAgICAgICBzaXplRGVsdGEueCA9IHRvUHJlY2lzaW9uKHNpemVEZWx0YS54LCAzKTtcbiAgICAgICAgc2l6ZURlbHRhLnkgPSB0b1ByZWNpc2lvbihzaXplRGVsdGEueSwgMyk7XG4gICAgICAgIHRoaXMubW9kaWZ5UG9zRGVsdGFXaXRoQW5jaG9yKHR5cGUsIHBvc0RlbHRhLCBzaXplRGVsdGEsIGFuY2hvciwga2VlcENlbnRlcik7XG4gICAgICAgIC8vIOi9rOaNouWIsOWfuuS6jueItuiKgueCueeahOWxgOmDqOWdkOagh+ezu1xuICAgICAgICBpZiAobm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIG5vZGUucGFyZW50LmdldFdvcmxkTWF0cml4KHRlbXBNYXQ0KTtcbiAgICAgICAgICAgIE1hdDQuaW52ZXJ0KHRlbXBNYXQ0LCB0ZW1wTWF0NCk7XG4gICAgICAgICAgICB0ZW1wTWF0NC5tMTIgPSB0ZW1wTWF0NC5tMTMgPSAwO1xuICAgICAgICAgICAgVmVjMy50cmFuc2Zvcm1NYXQ0KHBvc0RlbHRhLCBwb3NEZWx0YSwgdGVtcE1hdDQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFrZWVwQ2VudGVyKSB7XG4gICAgICAgICAgICAvLyDkuZjkuIrlvZPliY3oioLngrnnmoTml4vovaxcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsUm90ID0gdGVtcFF1YXRfYTtcbiAgICAgICAgICAgIG5vZGUuZ2V0Um90YXRpb24obG9jYWxSb3QpO1xuICAgICAgICAgICAgVmVjMy50cmFuc2Zvcm1RdWF0KHBvc0RlbHRhLCBwb3NEZWx0YSwgbG9jYWxSb3QpO1xuICAgICAgICAgICAgcG9zRGVsdGEueiA9IDA7XG4gICAgICAgICAgICB0ZW1wVmVjMy5zZXQobG9jYWxQb3MpO1xuICAgICAgICAgICAgdGVtcFZlYzMuYWRkKHBvc0RlbHRhKTtcbiAgICAgICAgICAgIG5vZGUuc2V0UG9zaXRpb24odGVtcFZlYzMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29udGVudFNpemUg5Y+X5Yiwc2NhbGUg5b2x5ZONXG4gICAgICAgIGNvbnN0IHdvcmxkU2NhbGUgPSBuZXcgVmVjMygpO1xuICAgICAgICBub2RlLmdldFdvcmxkU2NhbGUod29ybGRTY2FsZSk7XG4gICAgICAgIHNpemVEZWx0YS54ID0gc2l6ZURlbHRhLnggLyB3b3JsZFNjYWxlLng7XG4gICAgICAgIHNpemVEZWx0YS55ID0gc2l6ZURlbHRhLnkgLyB3b3JsZFNjYWxlLnk7XG5cbiAgICAgICAgbGV0IGhlaWdodCA9IHNpemUuaGVpZ2h0O1xuICAgICAgICBsZXQgd2lkdGggPSBzaXplLndpZHRoO1xuICAgICAgICBpZiAoa2VlcFNjYWxlKSB7XG4gICAgICAgICAgICBpZiAoc2l6ZURlbHRhLngpIHtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHNpemUud2lkdGggKyBzaXplRGVsdGEueDtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZS53aWR0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2FsZSA9IHdpZHRoIC8gc2l6ZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gc2NhbGUgKiBzaXplLmhlaWdodDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSB3aWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNpemVEZWx0YS55KSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gc2l6ZS5oZWlnaHQgKyBzaXplRGVsdGEueTtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZS5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSBoZWlnaHQgLyBzaXplLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBzY2FsZSAqIHNpemUud2lkdGg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaGVpZ2h0ID0gc2l6ZS5oZWlnaHQgKyBzaXplRGVsdGEueTtcbiAgICAgICAgICAgIHdpZHRoID0gc2l6ZS53aWR0aCArIHNpemVEZWx0YS54O1xuICAgICAgICB9XG5cbiAgICAgICAgdWlUcmFuc0NvbXAuY29udGVudFNpemUgPSBuZXcgU2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNdWx0aVRhcmdldFNpemUodHlwZTogSGFuZGxlVHlwZSwgZGVsdGE6IFZlYzMsIGtlZXBDZW50ZXI6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3Qgb3JpUmVjdCA9IHRoaXMuX3RlbXBSZWN0O1xuICAgICAgICBjb25zdCBzaXplRGVsdGEgPSBuZXcgVmVjMihkZWx0YS54LCBkZWx0YS55KTtcbiAgICAgICAgY29uc3QgcG9zRGVsdGEgPSBkZWx0YS5jbG9uZSgpO1xuICAgICAgICBjb25zdCBhbmNob3IgPSBuZXcgVmVjMigwLCAwKTtcblxuICAgICAgICBzaXplRGVsdGEueCA9IHRvUHJlY2lzaW9uKHNpemVEZWx0YS54LCAzKTtcbiAgICAgICAgc2l6ZURlbHRhLnkgPSB0b1ByZWNpc2lvbihzaXplRGVsdGEueSwgMyk7XG4gICAgICAgIHRoaXMubW9kaWZ5UG9zRGVsdGFXaXRoQW5jaG9yKHR5cGUsIHBvc0RlbHRhLCBzaXplRGVsdGEsIGFuY2hvciwgZmFsc2UpO1xuXG4gICAgICAgIGNvbnN0IHJlY3QgPSBvcmlSZWN0LmNsb25lKCk7XG4gICAgICAgIHJlY3QueCA9IG9yaVJlY3QueCArIHBvc0RlbHRhLng7XG4gICAgICAgIHJlY3QueSA9IG9yaVJlY3QueSArIHBvc0RlbHRhLnk7XG4gICAgICAgIHJlY3Qud2lkdGggPSBvcmlSZWN0LndpZHRoICsgc2l6ZURlbHRhLng7XG4gICAgICAgIHJlY3QuaGVpZ2h0ID0gb3JpUmVjdC5oZWlnaHQgKyBzaXplRGVsdGEueTtcbiAgICAgICAgdGhpcy5fZWRpdFJlY3QgPSByZWN0O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGhpcy5fdmFsaWRUYXJnZXQubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1aVRyYW5zQ29tcCA9IHRoaXMuX3ZhbGlkVGFyZ2V0W2ldO1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHVpVHJhbnNDb21wLm5vZGU7XG4gICAgICAgICAgICBjb25zdCB3b3JsZFBvcyA9IHRoaXMuX3dvcmxkUG9zTGlzdFtpXTtcblxuICAgICAgICAgICAgY29uc3QgeFBlcmNlbnQgPSAod29ybGRQb3MueCAtIG9yaVJlY3QueCkgLyBvcmlSZWN0LndpZHRoO1xuICAgICAgICAgICAgY29uc3QgeVBlcmNlbnQgPSAod29ybGRQb3MueSAtIG9yaVJlY3QueSkgLyBvcmlSZWN0LmhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IG5ld1BvcyA9IG5ldyBWZWMzKFxuICAgICAgICAgICAgICAgIHJlY3QueCArIHhQZXJjZW50ICogcmVjdC53aWR0aCxcbiAgICAgICAgICAgICAgICByZWN0LnkgKyB5UGVyY2VudCAqIHJlY3QuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIHdvcmxkUG9zLnosXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbm9kZS5zZXRXb3JsZFBvc2l0aW9uKG5ld1Bvcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9yZWN0TGlzdFtpXTtcbiAgICAgICAgICAgIGNvbnN0IHdQZXJjZW50ID0gci53aWR0aCAvIG9yaVJlY3Qud2lkdGg7XG4gICAgICAgICAgICBjb25zdCBoUGVyY2VudCA9IHIuaGVpZ2h0IC8gb3JpUmVjdC5oZWlnaHQ7XG5cbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLl9zaXplTGlzdFtpXTtcbiAgICAgICAgICAgIGNvbnN0IHNkID0gc2l6ZURlbHRhLmNsb25lKCk7XG4gICAgICAgICAgICBzZC54ID0gc2QueCAqIHdQZXJjZW50O1xuICAgICAgICAgICAgc2QueSA9IHNkLnkgKiBoUGVyY2VudDtcblxuICAgICAgICAgICAgY29uc3Qgd29ybGRTY2FsZSA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICBub2RlLmdldFdvcmxkU2NhbGUod29ybGRTY2FsZSk7XG4gICAgICAgICAgICBzZC54ID0gc2QueCAvIHdvcmxkU2NhbGUueDtcbiAgICAgICAgICAgIHNkLnkgPSBzZC55IC8gd29ybGRTY2FsZS55O1xuXG4gICAgICAgICAgICB1aVRyYW5zQ29tcC5jb250ZW50U2l6ZSA9IG5ldyBTaXplKHNpemUud2lkdGggKyBzZC54LCBzaXplLmhlaWdodCArIHNkLnkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Qm91bmRzKGZsaXBYOiBib29sZWFuLCBmbGlwWTogYm9vbGVhbiwgbm9kZXM6IE5vZGVbXSkge1xuICAgICAgICBsZXQgbWluWCA9IE51bWJlci5NQVhfVkFMVUUsIG1heFggPSAtTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgbGV0IG1pblkgPSBOdW1iZXIuTUFYX1ZBTFVFLCBtYXhZID0gLU51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgIGZ1bmN0aW9uIGNhbGNCb3VuZHMocDogYW55KSB7XG4gICAgICAgICAgICBpZiAocC54ID4gbWF4WCkgbWF4WCA9IHAueDtcbiAgICAgICAgICAgIGlmIChwLnggPCBtaW5YKSBtaW5YID0gcC54O1xuICAgICAgICAgICAgaWYgKHAueSA+IG1heFkpIG1heFkgPSBwLnk7XG4gICAgICAgICAgICBpZiAocC55IDwgbWluWSkgbWluWSA9IHAueTtcbiAgICAgICAgfVxuICAgICAgICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgICBpZiAobm9kZS5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2IgPSBnZXROb2RlV29ybGRPcmllbnRlZEJvdW5kcyhub2RlKTtcbiAgICAgICAgICAgICAgICBjYWxjQm91bmRzKG9iWzBdKTtcbiAgICAgICAgICAgICAgICBjYWxjQm91bmRzKG9iWzFdKTtcbiAgICAgICAgICAgICAgICBjYWxjQm91bmRzKG9iWzJdKTtcbiAgICAgICAgICAgICAgICBjYWxjQm91bmRzKG9iWzNdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGxldCB0ZW1wO1xuICAgICAgICBpZiAoZmxpcFgpIHsgdGVtcCA9IG1pblg7IG1pblggPSBtYXhYOyBtYXhYID0gdGVtcDsgfVxuICAgICAgICBpZiAoZmxpcFkpIHsgdGVtcCA9IG1pblk7IG1pblkgPSBtYXhZOyBtYXhZID0gdGVtcDsgfVxuICAgICAgICByZXR1cm4gW25ldyBWZWMyKG1pblgsIG1heFkpLCBuZXcgVmVjMihtaW5YLCBtaW5ZKSwgbmV3IFZlYzIobWF4WCwgbWluWSksIG5ldyBWZWMyKG1heFgsIG1heFkpXTtcbiAgICB9XG5cbiAgICB1cGRhdGVEYXRhRnJvbUNvbnRyb2xsZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb250cm9sbGVyLnVwZGF0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMub25Db250cm9sVXBkYXRlKCdwb3NpdGlvbicpO1xuXG4gICAgICAgICAgICBjb25zdCByZWN0Q3RybCA9IHRoaXMuX2NvbnRyb2xsZXIgYXMgUmVjdGFuZ2xlQ29udHJvbGxlcjtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZVR5cGUgPSByZWN0Q3RybC5nZXRDdXJIYW5kbGVUeXBlKCk7XG4gICAgICAgICAgICBjb25zdCBkZWx0YVNpemUgPSByZWN0Q3RybC5nZXREZWx0YVNpemUoKTtcbiAgICAgICAgICAgIGlmIChoYW5kbGVUeXBlID09PSBIYW5kbGVUeXBlLkFyZWEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUFyZWFNb3ZlKGRlbHRhU2l6ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhhbmRsZVR5cGUgPT09IEhhbmRsZVR5cGUuQW5jaG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVBbmNob3JNb3ZlKGRlbHRhU2l6ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGtlZXBDZW50ZXI6IGJvb2xlYW4gPSB0aGlzLl9hbHRLZXk7XG4gICAgICAgICAgICAgICAgY29uc3Qga2VlcFNjYWxlOiBib29sZWFuID0gdGhpcy5fc2hpZnRLZXk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9kZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZU11bHRpVGFyZ2V0U2l6ZShoYW5kbGVUeXBlLCBkZWx0YVNpemUsIGtlZXBDZW50ZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlT25lVGFyZ2V0U2l6ZShoYW5kbGVUeXBlLCBkZWx0YVNpemUsIGtlZXBDZW50ZXIsIGtlZXBTY2FsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlQ29udHJvbGxlclRyYW5zZm9ybSgpIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5lZGl0YWJsZSA9ICEhdGhpcy50YXJnZXQ7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbGxlckRhdGEoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb250cm9sbGVyRGF0YSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0luaXRpYWxpemVkIHx8ICF0aGlzLm5vZGVzIHx8IHRoaXMubm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZWN0Q3RybCA9IHRoaXMuX2NvbnRyb2xsZXIgYXMgUmVjdGFuZ2xlQ29udHJvbGxlcjtcbiAgICAgICAgcmVjdEN0cmwuY2hlY2tFZGl0KCk7XG5cbiAgICAgICAgY29uc3QgbGVuZ3RoID0gdGhpcy5ub2Rlcy5sZW5ndGg7XG4gICAgICAgIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVzWzBdO1xuXG4gICAgICAgICAgICBjb25zdCB3b3JsZFBvcyA9IG5vZGUuZ2V0V29ybGRQb3NpdGlvbigpO1xuICAgICAgICAgICAgY29uc3Qgd29ybGRSb3QgPSB0ZW1wUXVhdF9hO1xuICAgICAgICAgICAgbm9kZS5nZXRXb3JsZFJvdGF0aW9uKHdvcmxkUm90KTtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkU2NhbGUgPSBub2RlLmdldFdvcmxkU2NhbGUoKTtcblxuICAgICAgICAgICAgcmVjdEN0cmwuc2V0UG9zaXRpb24od29ybGRQb3MpO1xuICAgICAgICAgICAgcmVjdEN0cmwuc2V0Um90YXRpb24od29ybGRSb3QpO1xuICAgICAgICAgICAgcmVjdEN0cmwuc2V0U2NhbGUod29ybGRTY2FsZSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHVpVHJhbnNDb21wID0gbm9kZS5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgaWYgKHVpVHJhbnNDb21wKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IHVpVHJhbnNDb21wLmNvbnRlbnRTaXplO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuY2hvciA9IHVpVHJhbnNDb21wLmFuY2hvclBvaW50O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICAgICAgY2VudGVyLnggPSAoMC41IC0gYW5jaG9yLngpICogc2l6ZS53aWR0aDtcbiAgICAgICAgICAgICAgICBjZW50ZXIueSA9ICgwLjUgLSBhbmNob3IueSkgKiBzaXplLmhlaWdodDtcbiAgICAgICAgICAgICAgICByZWN0Q3RybC51cGRhdGVTaXplKGNlbnRlciwgbmV3IFZlYzIoc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVjdEN0cmwuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYm91bmRzID0gdGhpcy5nZXRCb3VuZHMoZmFsc2UsIGZhbHNlLCB0aGlzLm5vZGVzKTtcbiAgICAgICAgICAgIGNvbnN0IHJlY3QgPSBib3VuZHNUb1JlY3QoYm91bmRzKTtcbiAgICAgICAgICAgIGNvbnN0IHJlY3RDZW50ZXIgPSBuZXcgVmVjMyhyZWN0LnggKyByZWN0LndpZHRoIC8gMiwgcmVjdC55ICsgcmVjdC5oZWlnaHQgLyAyLCAwKTtcbiAgICAgICAgICAgIHJlY3RDdHJsLnNldFBvc2l0aW9uKHJlY3RDZW50ZXIpO1xuICAgICAgICAgICAgcmVjdEN0cmwuc2V0Um90YXRpb24oUXVhdC5JREVOVElUWSk7XG4gICAgICAgICAgICByZWN0Q3RybC5zZXRTY2FsZShuZXcgVmVjMygxLCAxLCAxKSk7XG4gICAgICAgICAgICByZWN0Q3RybC51cGRhdGVTaXplKG5ldyBWZWMzKCksIG5ldyBWZWMyKHJlY3Qud2lkdGgsIHJlY3QuaGVpZ2h0KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3Tm9kZUd1aWRlbGluZUdyb3VwKGd1aWRlbGluZUdyb3VwOiBTbmFwR3VpZGVsaW5lR3JvdXApIHtcbiAgICAgICAgaWYgKCFndWlkZWxpbmVHcm91cCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3VycmVudEd1aWRlbGluZXMgPSBndWlkZWxpbmVHcm91cC5jdXJyZW50R3VpZGVsaW5lcztcbiAgICAgICAgaWYgKCFjdXJyZW50R3VpZGVsaW5lcyB8fCBjdXJyZW50R3VpZGVsaW5lcy5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29sb3IgPSByZWN0VHJhbnNmb3JtU25hcHBpbmcuZ3VpZGVsaW5lQ29sb3I7XG5cbiAgICAgICAgY29uc3QgZHJhd0xpbmVWZXJ0aWNlczogVmVjM1tdID0gW107XG4gICAgICAgIGN1cnJlbnRHdWlkZWxpbmVzLmZvckVhY2goKGd1aWRlbGluZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGluZVZlcnRpY2VzID0gZ3VpZGVsaW5lLmxpbmVWZXJ0aWNlcy5zbGljZSgpO1xuXG4gICAgICAgICAgICBjb25zdCBjaGVja05vZGUgPSBndWlkZWxpbmUuY2hlY2tOb2RlO1xuICAgICAgICAgICAgaWYgKCFjaGVja05vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHBvc0NvbXBhcmUoYXhpczoga2V5b2YoVmVjMykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odjE6IFZlYzMsIHYyOiBWZWMzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAodjFbYXhpc10gYXMgbnVtYmVyKSAtICh2MltheGlzXSBhcyBudW1iZXIpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGhhY2vvvIzlsIblr7npvZDnur/lu7bplb/liLDlvZPliY3mo4DmtYvnmoToioLngrnkuIpcbiAgICAgICAgICAgIGNvbnN0IHJlY3QgPSByZWN0VHJhbnNmb3JtU25hcHBpbmcuZ2V0V29ybGRSZWN0RXgoY2hlY2tOb2RlKTtcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IHJlY3QuY2VudGVyO1xuICAgICAgICAgICAgY29uc3QgaGFsZldpZHRoID0gcmVjdC53aWR0aCAvIDI7XG4gICAgICAgICAgICBjb25zdCBoYWxmSGVpZ2h0ID0gcmVjdC5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgaWYgKGd1aWRlbGluZS5heGlzID09PSAneCcpIHtcbiAgICAgICAgICAgICAgICAvLyB1cFxuICAgICAgICAgICAgICAgIGxpbmVWZXJ0aWNlcy5wdXNoKG5ldyBWZWMzKGd1aWRlbGluZS52YWx1ZSwgY2VudGVyLnkgKyBoYWxmSGVpZ2h0LCBjZW50ZXIueikpO1xuICAgICAgICAgICAgICAgIC8vIGRvd25cbiAgICAgICAgICAgICAgICBsaW5lVmVydGljZXMucHVzaChuZXcgVmVjMyhndWlkZWxpbmUudmFsdWUsIGNlbnRlci55IC0gaGFsZkhlaWdodCwgY2VudGVyLnopKTtcbiAgICAgICAgICAgICAgICBsaW5lVmVydGljZXMuc29ydChwb3NDb21wYXJlKCd5JykpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChndWlkZWxpbmUuYXhpcyA9PT0gJ3knKSB7XG4gICAgICAgICAgICAgICAgLy8gbGVmdFxuICAgICAgICAgICAgICAgIGxpbmVWZXJ0aWNlcy5wdXNoKG5ldyBWZWMzKGNlbnRlci54ICsgaGFsZldpZHRoLCBndWlkZWxpbmUudmFsdWUsIGNlbnRlci56KSk7XG4gICAgICAgICAgICAgICAgLy8gcmlnaHRcbiAgICAgICAgICAgICAgICBsaW5lVmVydGljZXMucHVzaChuZXcgVmVjMyhjZW50ZXIueCAtIGhhbGZXaWR0aCwgZ3VpZGVsaW5lLnZhbHVlLCBjZW50ZXIueikpO1xuICAgICAgICAgICAgICAgIGxpbmVWZXJ0aWNlcy5zb3J0KHBvc0NvbXBhcmUoJ3gnKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRyYXdMaW5lVmVydGljZXMucHVzaChsaW5lVmVydGljZXNbMF0pO1xuICAgICAgICAgICAgZHJhd0xpbmVWZXJ0aWNlcy5wdXNoKGxpbmVWZXJ0aWNlc1tsaW5lVmVydGljZXMubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmRyYXdHdWlkZWxpbmVzKHRoaXMuX25vZGVTbmFwTGluZXNDdHJsLCBkcmF3TGluZVZlcnRpY2VzLCBjb2xvcik7XG4gICAgfVxuXG4gICAgZHJhd05vZGVTbmFwcGluZ0d1aWRlbGluZSgpIHtcbiAgICAgICAgdGhpcy5jbGVhck5vZGVTbmFwcGluZ0d1aWRlbGluZSgpO1xuXG4gICAgICAgIGNvbnN0IGd1aWRlbGluZUdyb3VwcyA9IHJlY3RUcmFuc2Zvcm1TbmFwcGluZy5ub2RlU25hcEd1aWRlbGluZUdyb3VwcztcbiAgICAgICAgdGhpcy5kcmF3Tm9kZUd1aWRlbGluZUdyb3VwKGd1aWRlbGluZUdyb3Vwc1swXSk7XG4gICAgICAgIHRoaXMuZHJhd05vZGVHdWlkZWxpbmVHcm91cChndWlkZWxpbmVHcm91cHNbMV0pO1xuICAgIH1cblxuICAgIGNsZWFyTm9kZVNuYXBwaW5nR3VpZGVsaW5lKCkge1xuICAgICAgICB0aGlzLl9ub2RlU25hcExpbmVzQ3RybC5jbGVhckRhdGEoKTtcbiAgICB9XG5cbiAgICBnZXREcmF3TGluZVZlcnRpY2VzKGd1aWRlbGluZUdyb3VwOiBTbmFwR3VpZGVsaW5lR3JvdXApIHtcbiAgICAgICAgaWYgKCFndWlkZWxpbmVHcm91cCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50R3VpZGVsaW5lcyA9IGd1aWRlbGluZUdyb3VwLmN1cnJlbnRHdWlkZWxpbmVzO1xuICAgICAgICBpZiAoIWN1cnJlbnRHdWlkZWxpbmVzIHx8IGN1cnJlbnRHdWlkZWxpbmVzLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRyYXdMaW5lVmVydGljZXM6IFZlYzNbXSA9IFtdO1xuICAgICAgICBjdXJyZW50R3VpZGVsaW5lcy5mb3JFYWNoKChndWlkZWxpbmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmVWZXJ0aWNlcyA9IGd1aWRlbGluZS5saW5lVmVydGljZXM7XG4gICAgICAgICAgICBkcmF3TGluZVZlcnRpY2VzLnB1c2gobGluZVZlcnRpY2VzWzBdKTtcbiAgICAgICAgICAgIGRyYXdMaW5lVmVydGljZXMucHVzaChsaW5lVmVydGljZXNbbGluZVZlcnRpY2VzLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRyYXdMaW5lVmVydGljZXM7XG4gICAgfVxuXG4gICAgZHJhd0d1aWRlbGluZUdyb3VwKGd1aWRlbGluZUdyb3VwOiBTbmFwR3VpZGVsaW5lR3JvdXAsIGxpbmVzQ3RybDogTGluZXNDb250cm9sbGVyLCBjb2xvciA9IENvbG9yLlJFRCkge1xuICAgICAgICBpZiAoIWd1aWRlbGluZUdyb3VwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50R3VpZGVsaW5lcyA9IGd1aWRlbGluZUdyb3VwLmN1cnJlbnRHdWlkZWxpbmVzO1xuICAgICAgICBpZiAoIWN1cnJlbnRHdWlkZWxpbmVzIHx8IGN1cnJlbnRHdWlkZWxpbmVzLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkcmF3TGluZVZlcnRpY2VzOiBWZWMzW10gPSBbXTtcbiAgICAgICAgY3VycmVudEd1aWRlbGluZXMuZm9yRWFjaCgoZ3VpZGVsaW5lKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsaW5lVmVydGljZXMgPSBndWlkZWxpbmUubGluZVZlcnRpY2VzO1xuICAgICAgICAgICAgZHJhd0xpbmVWZXJ0aWNlcy5wdXNoKGxpbmVWZXJ0aWNlc1swXSk7XG4gICAgICAgICAgICBkcmF3TGluZVZlcnRpY2VzLnB1c2gobGluZVZlcnRpY2VzW2xpbmVWZXJ0aWNlcy5sZW5ndGggLSAxXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxpbmVzQ3RybC5zZXRDb2xvcihjb2xvcik7XG4gICAgICAgIGNvbnN0IGxpbmVJbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBkcmF3TGluZVZlcnRpY2VzLmZvckVhY2goKF92YWx1ZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGxpbmVJbmRpY2VzLnB1c2goaW5kZXgpO1xuICAgICAgICB9KTtcbiAgICAgICAgbGluZXNDdHJsLnVwZGF0ZURhdGEoZHJhd0xpbmVWZXJ0aWNlcywgbGluZUluZGljZXMpO1xuICAgIH1cblxuICAgIGRyYXdHdWlkZWxpbmVzKGxpbmVzQ3RybDogTGluZXNDb250cm9sbGVyLCBkcmF3TGluZVZlcnRpY2VzOiBWZWMzW10sIGNvbG9yID0gQ29sb3IuUkVEKSB7XG4gICAgICAgIGxpbmVzQ3RybC5zZXRDb2xvcihjb2xvcik7XG4gICAgICAgIGNvbnN0IGxpbmVJbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBkcmF3TGluZVZlcnRpY2VzLmZvckVhY2goKF92YWx1ZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGxpbmVJbmRpY2VzLnB1c2goaW5kZXgpO1xuICAgICAgICB9KTtcbiAgICAgICAgbGluZXNDdHJsLnVwZGF0ZURhdGEoZHJhd0xpbmVWZXJ0aWNlcywgbGluZUluZGljZXMpO1xuICAgIH1cblxuICAgIGRyYXdDYW52YXNTbmFwcGluZ0d1aWRlbGluZSgpIHtcbiAgICAgICAgdGhpcy5jbGVhckNhbnZhc1NuYXBwaW5nR3VpZGVsaW5lKCk7XG5cbiAgICAgICAgY29uc3QgZ3VpZGVsaW5lR3JvdXBzID0gcmVjdFRyYW5zZm9ybVNuYXBwaW5nLmNhbnZhc1NuYXBHdWlkZWxpbmVHcm91cHM7XG5cbiAgICAgICAgY29uc3QgY29sb3IgPSByZWN0VHJhbnNmb3JtU25hcHBpbmcuY2FudmFzU25hcENvbG9yO1xuICAgICAgICBjb25zdCBkcmF3TGluZVZlcnRpY2VzOiBWZWMzW10gPSBbXTtcbiAgICAgICAgbGV0IGxpbmVWZXJ0aWNlcyA9IHRoaXMuZ2V0RHJhd0xpbmVWZXJ0aWNlcyhndWlkZWxpbmVHcm91cHNbMF0pO1xuICAgICAgICBpZiAobGluZVZlcnRpY2VzKSB7XG4gICAgICAgICAgICBkcmF3TGluZVZlcnRpY2VzLnB1c2goLi4ubGluZVZlcnRpY2VzKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lVmVydGljZXMgPSB0aGlzLmdldERyYXdMaW5lVmVydGljZXMoZ3VpZGVsaW5lR3JvdXBzWzFdKTtcbiAgICAgICAgaWYgKGxpbmVWZXJ0aWNlcykge1xuICAgICAgICAgICAgZHJhd0xpbmVWZXJ0aWNlcy5wdXNoKC4uLmxpbmVWZXJ0aWNlcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRyYXdHdWlkZWxpbmVzKHRoaXMuX2NhbnZhc1NuYXBMaW5lc0N0cmwsIGRyYXdMaW5lVmVydGljZXMsIGNvbG9yKTtcbiAgICB9XG5cbiAgICBjbGVhckNhbnZhc1NuYXBwaW5nR3VpZGVsaW5lKCkge1xuICAgICAgICB0aGlzLl9jYW52YXNTbmFwTGluZXNDdHJsLmNsZWFyRGF0YSgpO1xuICAgIH1cblxuICAgIGRyYXdFcXVhbFNwYWNpbmdHdWlkZWxpbmUoKSB7XG4gICAgICAgIHRoaXMuY2xlYXJFcXVhbFNwYWNpbmdHdWlkZWxpbmUoKTtcblxuICAgICAgICBjb25zdCBjdXJyZW50TWF0Y2hNaW5EaXN0SW5mb3MgPSByZWN0VHJhbnNmb3JtU25hcHBpbmcuY3VycmVudE1hdGNoTWluRGlzdEluZm9zO1xuICAgICAgICBjb25zdCBjb2xvciA9IHJlY3RUcmFuc2Zvcm1TbmFwcGluZy5ndWlkZWxpbmVDb2xvcjtcbiAgICAgICAgY29uc3Qgc2lkZUhhbGZMZW5ndGggPSAxMDtcblxuICAgICAgICBjb25zdCBkcmF3TGluZVZlcnRpY2VzOiBWZWMzW10gPSBbXTtcbiAgICAgICAgY3VycmVudE1hdGNoTWluRGlzdEluZm9zLmZvckVhY2goKGluZm8pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0UG9zID0gaW5mby5taW5EaXN0UG9zQTtcbiAgICAgICAgICAgIGNvbnN0IGVuZFBvcyA9IGluZm8ubWluRGlzdFBvc0I7XG4gICAgICAgICAgICBkcmF3TGluZVZlcnRpY2VzLnB1c2goc3RhcnRQb3MpO1xuICAgICAgICAgICAgZHJhd0xpbmVWZXJ0aWNlcy5wdXNoKGVuZFBvcyk7XG5cbiAgICAgICAgICAgIC8vIGFkZCBtb3JlIGRldGFpbFxuICAgICAgICAgICAgaWYgKGluZm8uYXhpcyA9PT0gJ3gnKSB7XG4gICAgICAgICAgICAgICAgLy8gZHJhdyBsaWtlIHRoaXNcbiAgICAgICAgICAgICAgICAvLyB8LS0tLS18XG4gICAgICAgICAgICAgICAgZHJhd0xpbmVWZXJ0aWNlcy5wdXNoKG5ldyBWZWMzKHN0YXJ0UG9zLngsIHN0YXJ0UG9zLnkgKyBzaWRlSGFsZkxlbmd0aCkpO1xuICAgICAgICAgICAgICAgIGRyYXdMaW5lVmVydGljZXMucHVzaChuZXcgVmVjMyhzdGFydFBvcy54LCBzdGFydFBvcy55IC0gc2lkZUhhbGZMZW5ndGgpKTtcbiAgICAgICAgICAgICAgICBkcmF3TGluZVZlcnRpY2VzLnB1c2gobmV3IFZlYzMoZW5kUG9zLngsIGVuZFBvcy55ICsgc2lkZUhhbGZMZW5ndGgpKTtcbiAgICAgICAgICAgICAgICBkcmF3TGluZVZlcnRpY2VzLnB1c2gobmV3IFZlYzMoZW5kUG9zLngsIGVuZFBvcy55IC0gc2lkZUhhbGZMZW5ndGgpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5mby5heGlzID09PSAneScpIHtcbiAgICAgICAgICAgICAgICAvLyBkcmF3IGxpa2UgdGhpc1xuICAgICAgICAgICAgICAgIC8vIC0tLVxuICAgICAgICAgICAgICAgIC8vICB8XG4gICAgICAgICAgICAgICAgLy8gLS0tXG4gICAgICAgICAgICAgICAgZHJhd0xpbmVWZXJ0aWNlcy5wdXNoKG5ldyBWZWMzKHN0YXJ0UG9zLnggLSBzaWRlSGFsZkxlbmd0aCwgc3RhcnRQb3MueSkpO1xuICAgICAgICAgICAgICAgIGRyYXdMaW5lVmVydGljZXMucHVzaChuZXcgVmVjMyhzdGFydFBvcy54ICsgc2lkZUhhbGZMZW5ndGgsIHN0YXJ0UG9zLnkpKTtcbiAgICAgICAgICAgICAgICBkcmF3TGluZVZlcnRpY2VzLnB1c2gobmV3IFZlYzMoZW5kUG9zLnggLSBzaWRlSGFsZkxlbmd0aCwgZW5kUG9zLnkpKTtcbiAgICAgICAgICAgICAgICBkcmF3TGluZVZlcnRpY2VzLnB1c2gobmV3IFZlYzMoZW5kUG9zLnggKyBzaWRlSGFsZkxlbmd0aCwgZW5kUG9zLnkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5kcmF3R3VpZGVsaW5lcyh0aGlzLl9lcXVhbFNwYWNpbmdMaW5lc0N0cmwsIGRyYXdMaW5lVmVydGljZXMsIGNvbG9yKTtcbiAgICB9XG5cbiAgICBjbGVhckVxdWFsU3BhY2luZ0d1aWRlbGluZSgpIHtcbiAgICAgICAgdGhpcy5fZXF1YWxTcGFjaW5nTGluZXNDdHJsLmNsZWFyRGF0YSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUmVjdEdpem1vO1xuIl19