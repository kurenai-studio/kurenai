'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const types_1 = require("../operation/types");
const defines_1 = require("./utils/defines");
const engine_utils_1 = require("./utils/engine-utils");
const node_utils_1 = require("./utils/node-utils");
const selection_utils_1 = require("./utils/selection-utils");
const editor_node_1 = require("./utils/editor-node");
function getService() {
    try {
        const { Service } = require('../core/decorator');
        return Service;
    }
    catch (e) {
        return null;
    }
}
function getServiceProp(name) {
    try {
        return getService()?.[name];
    }
    catch (e) {
        return null;
    }
}
function getNodeByPath(path) {
    return (0, editor_node_1.getEditorNodeByPath)(path);
}
function getNodePath(node) {
    return (0, editor_node_1.getEditorNodePath)(node);
}
/**
 * 与编辑器 adjustY 一致：将浏览器 Y（从顶部向下）翻转为屏幕坐标 Y（从底部向上）
 */
function adjustY(y) {
    const canvas = cc.game?.canvas;
    const height = canvas ? canvas.height : 720;
    return height - y;
}
/**
 * Create a GizmoMouseEvent from an ISceneMouseEvent
 */
function createGizmoMouseEvent(type, event) {
    const gme = new defines_1.GizmoMouseEvent(type, true);
    gme.x = event.x;
    gme.y = adjustY(event.y);
    gme.clientX = event.clientX;
    gme.clientY = event.clientY;
    gme.deltaX = event.deltaX;
    gme.deltaY = event.deltaY;
    gme.wheelDeltaX = event.wheelDeltaX;
    gme.wheelDeltaY = event.wheelDeltaY;
    gme.ctrlKey = event.ctrlKey;
    gme.shiftKey = event.shiftKey;
    gme.altKey = event.altKey;
    gme.metaKey = event.metaKey;
    gme.leftButton = event.leftButton;
    gme.middleButton = event.middleButton;
    gme.rightButton = event.rightButton;
    gme.moveDeltaX = event.moveDeltaX;
    gme.moveDeltaY = -(event.moveDeltaY); // invert Y
    gme.button = event.button;
    gme.buttons = event.buttons;
    gme.movementX = event.movementX;
    gme.movementY = event.movementY;
    return gme;
}
class GizmoOperation {
    _regionSelecting = false;
    _gizmoMoved = false;
    _hoverInNodeMap = new Map();
    _curMouseDownInfos = [];
    _gizmoMouseDownEvent = null;
    _noGizmoMouseDownEvent = null;
    _mouseDownRaycastGizmos = null;
    _anyKeyDown = false;
    /**
     * Raycast against gizmo nodes
     * 与编辑器一致：优先检测右上角 SceneGizmo，再检测 gizmo root
     */
    raycastGizmos(x, y) {
        const gizmoSvc = getServiceProp('Gizmo');
        const sceneGizmoCamera = gizmoSvc?.sceneGizmoCamera?.camera;
        if (sceneGizmoCamera) {
            const results = (0, engine_utils_1.raycast)(cc_1.director.getScene()?.renderScene, sceneGizmoCamera, cc_1.Layers.Enum.SCENE_GIZMO, x, y);
            if (results && results.length > 0) {
                return results;
            }
        }
        const gizmoRoot = gizmoSvc?.gizmoRootNode;
        if (!gizmoRoot)
            return new engine_utils_1.RaycastResults(null);
        return (0, engine_utils_1.getRaycastResults)(gizmoRoot, x, y, Infinity, cc_1.Layers.Enum.IGNORE_RAYCAST);
    }
    _emitEventToNode(node, event) {
        if (event.type) {
            node.emit(event.type, event);
            getServiceProp('Engine')?.repaintInEditMode?.();
        }
    }
    // --- Not-on-gizmo handlers ---
    _onNotGizmoMouseDown(_event) {
        // placeholder for region select start
    }
    _onNotGizmoMouseUp(event) {
        const isViewMode = getServiceProp('Gizmo')?.transformToolData?.viewMode === 'view';
        const cameraCtrl = getServiceProp('Camera')?.controller;
        if (event.leftButton && !isViewMode && !cameraCtrl?.isMoving?.()) {
            if (this._regionSelecting) {
                this._regionSelecting = false;
                this._hideSelectionRegion();
            }
            else {
                this._selectNode(event);
            }
        }
    }
    _onNotGizmoMouseMove(event) {
        if (this._anyKeyDown)
            return true;
        const downEvent = this._noGizmoMouseDownEvent;
        const isViewMode = getServiceProp('Gizmo')?.transformToolData?.viewMode === 'view';
        if (event.leftButton && downEvent && !isViewMode) {
            const dx = event.x - downEvent.x;
            const dy = event.y - downEvent.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 10)
                return false;
            this._regionSelecting = true;
            const revertX = downEvent.x > event.x;
            const revertY = downEvent.y < event.y;
            const left = revertX ? event.x : downEvent.x;
            const right = revertX ? downEvent.x : event.x;
            const bottom = revertY ? downEvent.y : event.y;
            const top = revertY ? event.y : downEvent.y;
            this._regionSelectNode(left, right, top, bottom, event.metaKey || event.ctrlKey);
            return false;
        }
        return undefined;
    }
    // --- Gizmo-hit handlers ---
    _onGizmoMouseDown(event, results) {
        // 与 cocos-editor 一致：相机移动中不处理 gizmo 交互
        const cameraCtrl = getServiceProp('Camera')?.controller;
        if (cameraCtrl?.isMoving?.())
            return true;
        if (event.leftButton) {
            for (const info of results) {
                const backInfo = {
                    node: info.node,
                    hitPoint: info.hitPoint ? info.hitPoint.clone() : new cc_1.Vec3(),
                };
                this._curMouseDownInfos.push(backInfo);
                event.hitPoint = backInfo.hitPoint;
                this._emitEventToNode(info.node, event);
                if (event.propagationStopped)
                    break;
            }
            return false;
        }
        return true;
    }
    _onGizmoMouseUp(event) {
        // 与 cocos-editor 一致：相机移动中不处理
        const cameraCtrl = getServiceProp('Camera')?.controller;
        if (cameraCtrl?.isMoving?.())
            return true;
        if (this._curMouseDownInfos.length > 0) {
            for (const info of this._curMouseDownInfos) {
                event.hitPoint = info.hitPoint;
                this._emitEventToNode(info.node, event);
                if (event.propagationStopped)
                    break;
            }
            this._curMouseDownInfos.length = 0;
            return false;
        }
        // 与 cocos-editor 一致：没有 mouseDown 记录时，对当前位置 raycast 并发送事件
        const { x, y } = event;
        const results = this.raycastGizmos(x, y);
        for (let i = 0; i < results.length; i++) {
            this._emitEventToNode(results[i].node, event);
            if (event.propagationStopped)
                break;
        }
        return true;
    }
    _onGizmoMouseMove(event, results) {
        if (this._curMouseDownInfos.length > 0) {
            const map = new Map();
            results.forEach((info) => map.set(info.node, info.hitPoint || new cc_1.Vec3()));
            for (const info of this._curMouseDownInfos) {
                event.hitPoint = map.get(info.node) || new cc_1.Vec3();
                this._emitEventToNode(info.node, event);
                if (event.propagationStopped)
                    break;
            }
        }
    }
    // --- Main event handlers ---
    onMouseDown(event) {
        this._gizmoMoved = false;
        this._anyKeyDown = event.altKey || event.ctrlKey || event.shiftKey || event.metaKey;
        const customEvent = createGizmoMouseEvent('mouseDown', event);
        // 与 cocos-editor 一致：不区分按键，始终做 raycast
        const results = this.raycastGizmos(customEvent.x, customEvent.y);
        this._mouseDownRaycastGizmos = results;
        if (results.length > 0) {
            this._gizmoMouseDownEvent = customEvent;
            return this._onGizmoMouseDown(customEvent, results);
        }
        this._noGizmoMouseDownEvent = customEvent;
        this._onNotGizmoMouseDown(customEvent);
    }
    onMouseUp(event) {
        this._anyKeyDown = false;
        const customEvent = createGizmoMouseEvent('mouseUp', event);
        if (this._mouseDownRaycastGizmos && this._mouseDownRaycastGizmos.length > 0) {
            if (!this._gizmoMouseDownEvent)
                return true;
            this._gizmoMouseDownEvent = null;
            return this._onGizmoMouseUp(customEvent);
        }
        else {
            if (!this._noGizmoMouseDownEvent)
                return true;
            this._noGizmoMouseDownEvent = null;
            return this._onNotGizmoMouseUp(customEvent);
        }
    }
    onMouseMove(event) {
        this._gizmoMoved = true;
        const customEvent = createGizmoMouseEvent('mouseMove', event);
        const results = this.raycastGizmos(customEvent.x, customEvent.y);
        if (this._mouseDownRaycastGizmos && this._mouseDownRaycastGizmos.length > 0) {
            if (!this._gizmoMouseDownEvent) {
                return this._changeMouseHover(customEvent, results);
            }
            return this._onGizmoMouseMove(customEvent, results);
        }
        else {
            if (!this._noGizmoMouseDownEvent) {
                return this._changeMouseHover(customEvent, results);
            }
            return this._onNotGizmoMouseMove(customEvent);
        }
    }
    onMouseWheel() { }
    _changeMouseHover(event, results) {
        if (this._anyKeyDown) {
            return true;
        }
        // 与编辑器一致：vertexSnap 检查
        const selection = getServiceProp('Selection');
        const paths = selection?.query?.() ?? [];
        if (paths[0]) {
            const node = getNodeByPath(paths[0]);
            if (node) {
                const res = getServiceProp('Gizmo')?.callAllGizmoFuncOfNode?.(node, 'onVertexSnapMove', event);
                if (res === false) {
                    return false;
                }
            }
        }
        let hoverInNode = null;
        const tempSet = new Set();
        const hitPoint = new cc_1.Vec3();
        if (results.length > 0) {
            const ray = results.ray;
            for (let i = 0; i < results.length; i++) {
                if (ray) {
                    cc_1.Vec3.multiplyScalar(hitPoint, ray.d, results[i].distance);
                    cc_1.Vec3.add(hitPoint, ray.o, hitPoint);
                    event.hitPoint = hitPoint;
                }
                else {
                    event.hitPoint = results[i].hitPoint;
                }
                results[i].node.emit(event.type, event);
            }
            for (const info of results) {
                tempSet.add(info.node);
                if (!this._hoverInNodeMap.has(info.node)) {
                    hoverInNode = info.node;
                    this._hoverInNodeMap.set(info.node, event.propagationStopped);
                }
                if (this._hoverInNodeMap.get(info.node))
                    break;
            }
        }
        // hoverOut
        this._hoverInNodeMap.forEach((_bool, node) => {
            if (!tempSet.has(node)) {
                event.type = 'hoverOut';
                event.customData = { hoverInNodeMap: this._hoverInNodeMap };
                this._emitEventToNode(node, event);
                this._hoverInNodeMap.delete(node);
            }
        });
        // hoverIn after hoverOut
        if (hoverInNode) {
            event.type = 'hoverIn';
            this._emitEventToNode(hoverInNode, event);
        }
        return true;
    }
    // --- Node selection ---
    _selectNode(event) {
        const camera = getServiceProp('Camera')?.getCamera?.()?.camera;
        if (!camera)
            return;
        const mask = cc_1.Layers.makeMaskExclude([
            cc_1.Layers.Enum.GIZMOS,
            cc_1.Layers.Enum.SCENE_GIZMO,
            cc_1.Layers.Enum.EDITOR,
            cc_1.Layers.Enum.IGNORE_RAYCAST,
        ]);
        const nodes = (0, node_utils_1.getRaycastResultNodes)(camera, event.x, event.y, mask);
        const selection = getServiceProp('Selection');
        if (nodes.length > 0) {
            let resultNode = null;
            for (const checkNode of nodes) {
                if (checkNode._objFlags & cc_1.CCObject.Flags.LockedInEditor)
                    continue;
                resultNode = checkNode;
                break;
            }
            if (!resultNode)
                return;
            const curSelections = selection?.query?.() ?? [];
            if (!event.ctrlKey && !event.shiftKey) {
                selection?.clear?.();
            }
            if (event.ctrlKey) {
                const resultPath = getNodePath(resultNode);
                if (curSelections.includes(resultPath)) {
                    selection?.unselect?.(resultPath);
                }
                else {
                    selection?.select?.(resultPath);
                }
            }
            else {
                resultNode = (0, selection_utils_1.getSelectNode)(nodes, curSelections[0]);
                selection?.select?.(getNodePath(resultNode));
            }
        }
        else {
            if (event.leftButton && !event.ctrlKey && !event.shiftKey) {
                selection?.clear?.();
            }
        }
    }
    _regionSelectNode(left, right, top, bottom, _multiple) {
        this._showSelectionRegion(left, right, top, bottom);
        const camera = getServiceProp('Camera')?.getCamera?.()?.camera;
        if (!camera)
            return;
        const mask = cc_1.Layers.makeMaskExclude([
            cc_1.Layers.Enum.GIZMOS,
            cc_1.Layers.Enum.SCENE_GIZMO,
            cc_1.Layers.Enum.EDITOR,
        ]);
        const nodes = (0, node_utils_1.getRegionNodes)(camera, left, right, top, bottom, mask);
        const selection = getServiceProp('Selection');
        const selectSet = new Set(selection?.query?.() ?? []);
        nodes.forEach((node) => {
            const nodePath = getNodePath(node);
            if (!selectSet.has(nodePath)) {
                selection?.select?.(nodePath);
            }
            selectSet.delete(nodePath);
        });
        for (const path of selectSet.keys()) {
            selection?.unselect?.(path);
        }
    }
    _showSelectionRegion(left, right, top, bottom) {
        const cameraComp = getServiceProp('Camera')?.getCamera?.();
        if (!cameraComp)
            return;
        const pos0 = new cc_1.Vec3(left, bottom, 0.1);
        const pos1 = new cc_1.Vec3(right, bottom, 0.1);
        const pos2 = new cc_1.Vec3(right, top, 0.1);
        const pos3 = new cc_1.Vec3(left, top, 0.1);
        const p0 = new cc_1.Vec3();
        const p1 = new cc_1.Vec3();
        const p2 = new cc_1.Vec3();
        const p3 = new cc_1.Vec3();
        cameraComp.screenToWorld(pos0, p0);
        cameraComp.screenToWorld(pos1, p1);
        cameraComp.screenToWorld(pos2, p2);
        cameraComp.screenToWorld(pos3, p3);
        const geometryRenderer = getServiceProp('Engine')?.getGeometryRenderer?.();
        if (geometryRenderer) {
            geometryRenderer.removeData('addQuad');
            geometryRenderer.addQuad(p0, p1, p2, p3, new cc_1.Color(255, 255, 255, 120), false, false, true);
        }
        getServiceProp('Engine')?.repaintInEditMode?.();
    }
    _hideSelectionRegion() {
        getServiceProp('Engine')?.getGeometryRenderer?.()?.removeData('addQuad');
        getServiceProp('Engine')?.repaintInEditMode?.();
    }
    // --- Keyboard ---
    onKeyDown(event) {
        if (this._regionSelecting)
            return false;
        const selection = getServiceProp('Selection');
        const paths = selection?.query?.() ?? [];
        if (paths.length > 0) {
            const node = getNodeByPath(paths[0]);
            if (node) {
                const res = getServiceProp('Gizmo')?.callAllGizmoFuncOfNode?.(node, 'onKeyDown', event);
                return res;
            }
        }
        return true;
    }
    onKeyUp(event) {
        const selection = getServiceProp('Selection');
        const paths = selection?.query?.() ?? [];
        if (paths.length > 0) {
            const node = getNodeByPath(paths[0]);
            if (node) {
                const res = getServiceProp('Gizmo')?.callAllGizmoFuncOfNode?.(node, 'onKeyUp', event);
                return res;
            }
        }
        return true;
    }
    // --- Lifecycle ---
    init() {
        const operationMgr = getServiceProp('Operation');
        if (operationMgr) {
            operationMgr.addListener('mousedown', this.onMouseDown.bind(this), types_1.OperationPriority.Gizmo);
            operationMgr.addListener('mousemove', this.onMouseMove.bind(this), types_1.OperationPriority.Gizmo);
            operationMgr.addListener('mouseup', this.onMouseUp.bind(this), types_1.OperationPriority.Gizmo);
            operationMgr.addListener('mousewheel', this.onMouseWheel.bind(this), types_1.OperationPriority.Gizmo);
            operationMgr.addListener('keydown', this.onKeyDown.bind(this), types_1.OperationPriority.Gizmo);
            operationMgr.addListener('keyup', this.onKeyUp.bind(this), types_1.OperationPriority.Gizmo);
        }
    }
    clear() {
        this._gizmoMouseDownEvent = null;
        this._noGizmoMouseDownEvent = null;
        this._hoverInNodeMap.clear();
        this._curMouseDownInfos.length = 0;
    }
}
exports.default = GizmoOperation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l6bW8tb3BlcmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2dpem1vL2dpem1vLW9wZXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7O0FBRWIsMkJBQW1FO0FBQ25FLDhDQUF1RDtBQUV2RCw2Q0FBa0Q7QUFDbEQsdURBQWtGO0FBQ2xGLG1EQUEyRTtBQUMzRSw2REFBd0Q7QUFDeEQscURBQTZFO0FBRTdFLFNBQVMsVUFBVTtJQUNmLElBQUksQ0FBQztRQUNELE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNqRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsSUFBWTtJQUNoQyxJQUFJLENBQUM7UUFDRCxPQUFPLFVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLElBQVk7SUFDL0IsT0FBTyxJQUFBLGlDQUFtQixFQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxJQUFVO0lBQzNCLE9BQU8sSUFBQSwrQkFBaUIsRUFBQyxJQUFJLENBQUMsQ0FBQztBQUNuQyxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLE9BQU8sQ0FBQyxDQUFTO0lBQ3RCLE1BQU0sTUFBTSxHQUFJLEVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLE1BQU0s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QUMsSUFBSSxDQUFDLEVBQUUseUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEYsWUFBWSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUseUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUYsWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUseUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEYsWUFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUseUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEYsQ0FBQztJQUNMLENBQUM7SUFFTSxLQUFLO1FBQ1IsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1FBQ25DLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNKO0FBRUQsa0JBQWUsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBDQ09iamVjdCwgQ29sb3IsIExheWVycywgTm9kZSwgVmVjMywgZGlyZWN0b3IgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBPcGVyYXRpb25Qcmlvcml0eSB9IGZyb20gJy4uL29wZXJhdGlvbi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZU1vdXNlRXZlbnQsIElTY2VuZUtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi9vcGVyYXRpb24vdHlwZXMnO1xuaW1wb3J0IHsgR2l6bW9Nb3VzZUV2ZW50IH0gZnJvbSAnLi91dGlscy9kZWZpbmVzJztcbmltcG9ydCB7IGdldFJheWNhc3RSZXN1bHRzLCByYXljYXN0LCBSYXljYXN0UmVzdWx0cyB9IGZyb20gJy4vdXRpbHMvZW5naW5lLXV0aWxzJztcbmltcG9ydCB7IGdldFJheWNhc3RSZXN1bHROb2RlcywgZ2V0UmVnaW9uTm9kZXMgfSBmcm9tICcuL3V0aWxzL25vZGUtdXRpbHMnO1xuaW1wb3J0IHsgZ2V0U2VsZWN0Tm9kZSB9IGZyb20gJy4vdXRpbHMvc2VsZWN0aW9uLXV0aWxzJztcbmltcG9ydCB7IGdldEVkaXRvck5vZGVCeVBhdGgsIGdldEVkaXRvck5vZGVQYXRoIH0gZnJvbSAnLi91dGlscy9lZGl0b3Itbm9kZSc7XG5cbmZ1bmN0aW9uIGdldFNlcnZpY2UoKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IFNlcnZpY2UgfSA9IHJlcXVpcmUoJy4uL2NvcmUvZGVjb3JhdG9yJyk7XG4gICAgICAgIHJldHVybiBTZXJ2aWNlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTZXJ2aWNlUHJvcChuYW1lOiBzdHJpbmcpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBnZXRTZXJ2aWNlKCk/LltuYW1lXTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZUJ5UGF0aChwYXRoOiBzdHJpbmcpOiBOb2RlIHwgbnVsbCB7XG4gICAgcmV0dXJuIGdldEVkaXRvck5vZGVCeVBhdGgocGF0aCk7XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVQYXRoKG5vZGU6IE5vZGUpOiBzdHJpbmcge1xuICAgIHJldHVybiBnZXRFZGl0b3JOb2RlUGF0aChub2RlKTtcbn1cblxuLyoqXG4gKiDkuI7nvJbovpHlmaggYWRqdXN0WSDkuIDoh7TvvJrlsIbmtY/op4jlmaggWe+8iOS7jumhtumDqOWQkeS4i++8iee/u+i9rOS4uuWxj+W5leWdkOaghyBZ77yI5LuO5bqV6YOo5ZCR5LiK77yJXG4gKi9cbmZ1bmN0aW9uIGFkanVzdFkoeTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBjYW52YXMgPSAoY2MgYXMgYW55KS5nYW1lPy5jYW52YXM7XG4gICAgY29uc3QgaGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmhlaWdodCA6IDcyMDtcbiAgICByZXR1cm4gaGVpZ2h0IC0geTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBHaXptb01vdXNlRXZlbnQgZnJvbSBhbiBJU2NlbmVNb3VzZUV2ZW50XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUdpem1vTW91c2VFdmVudCh0eXBlOiBzdHJpbmcsIGV2ZW50OiBJU2NlbmVNb3VzZUV2ZW50KTogR2l6bW9Nb3VzZUV2ZW50IHtcbiAgICBjb25zdCBnbWUgPSBuZXcgR2l6bW9Nb3VzZUV2ZW50KHR5cGUsIHRydWUpO1xuICAgIGdtZS54ID0gZXZlbnQueDtcbiAgICBnbWUueSA9IGFkanVzdFkoZXZlbnQueSk7XG4gICAgZ21lLmNsaWVudFggPSBldmVudC5jbGllbnRYO1xuICAgIGdtZS5jbGllbnRZID0gZXZlbnQuY2xpZW50WTtcbiAgICBnbWUuZGVsdGFYID0gZXZlbnQuZGVsdGFYO1xuICAgIGdtZS5kZWx0YVkgPSBldmVudC5kZWx0YVk7XG4gICAgZ21lLndoZWVsRGVsdGFYID0gZXZlbnQud2hlZWxEZWx0YVg7XG4gICAgZ21lLndoZWVsRGVsdGFZID0gZXZlbnQud2hlZWxEZWx0YVk7XG4gICAgZ21lLmN0cmxLZXkgPSBldmVudC5jdHJsS2V5O1xuICAgIGdtZS5zaGlmdEtleSA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgIGdtZS5hbHRLZXkgPSBldmVudC5hbHRLZXk7XG4gICAgZ21lLm1ldGFLZXkgPSBldmVudC5tZXRhS2V5O1xuICAgIGdtZS5sZWZ0QnV0dG9uID0gZXZlbnQubGVmdEJ1dHRvbjtcbiAgICBnbWUubWlkZGxlQnV0dG9uID0gZXZlbnQubWlkZGxlQnV0dG9uO1xuICAgIGdtZS5yaWdodEJ1dHRvbiA9IGV2ZW50LnJpZ2h0QnV0dG9uO1xuICAgIGdtZS5tb3ZlRGVsdGFYID0gZXZlbnQubW92ZURlbHRhWDtcbiAgICBnbWUubW92ZURlbHRhWSA9IC0oZXZlbnQubW92ZURlbHRhWSk7IC8vIGludmVydCBZXG4gICAgZ21lLmJ1dHRvbiA9IGV2ZW50LmJ1dHRvbjtcbiAgICBnbWUuYnV0dG9ucyA9IGV2ZW50LmJ1dHRvbnM7XG4gICAgZ21lLm1vdmVtZW50WCA9IGV2ZW50Lm1vdmVtZW50WDtcbiAgICBnbWUubW92ZW1lbnRZID0gZXZlbnQubW92ZW1lbnRZO1xuICAgIHJldHVybiBnbWU7XG59XG5cbmNsYXNzIEdpem1vT3BlcmF0aW9uIHtcbiAgICBwcml2YXRlIF9yZWdpb25TZWxlY3RpbmcgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9naXptb01vdmVkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfaG92ZXJJbk5vZGVNYXA6IE1hcDxOb2RlLCBib29sZWFuPiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIF9jdXJNb3VzZURvd25JbmZvczogeyBub2RlOiBOb2RlOyBoaXRQb2ludDogVmVjMyB9W10gPSBbXTtcbiAgICBwcml2YXRlIF9naXptb01vdXNlRG93bkV2ZW50OiBHaXptb01vdXNlRXZlbnQgfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9ub0dpem1vTW91c2VEb3duRXZlbnQ6IEdpem1vTW91c2VFdmVudCB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX21vdXNlRG93blJheWNhc3RHaXptb3M6IFJheWNhc3RSZXN1bHRzIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfYW55S2V5RG93biA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogUmF5Y2FzdCBhZ2FpbnN0IGdpem1vIG5vZGVzXG4gICAgICog5LiO57yW6L6R5Zmo5LiA6Ie077ya5LyY5YWI5qOA5rWL5Y+z5LiK6KeSIFNjZW5lR2l6bW/vvIzlho3mo4DmtYsgZ2l6bW8gcm9vdFxuICAgICAqL1xuICAgIHByaXZhdGUgcmF5Y2FzdEdpem1vcyh4OiBudW1iZXIsIHk6IG51bWJlcik6IFJheWNhc3RSZXN1bHRzIHtcbiAgICAgICAgY29uc3QgZ2l6bW9TdmMgPSBnZXRTZXJ2aWNlUHJvcCgnR2l6bW8nKTtcblxuICAgICAgICBjb25zdCBzY2VuZUdpem1vQ2FtZXJhID0gZ2l6bW9TdmM/LnNjZW5lR2l6bW9DYW1lcmE/LmNhbWVyYTtcbiAgICAgICAgaWYgKHNjZW5lR2l6bW9DYW1lcmEpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSByYXljYXN0KFxuICAgICAgICAgICAgICAgIGRpcmVjdG9yLmdldFNjZW5lKCk/LnJlbmRlclNjZW5lLFxuICAgICAgICAgICAgICAgIHNjZW5lR2l6bW9DYW1lcmEsXG4gICAgICAgICAgICAgICAgTGF5ZXJzLkVudW0uU0NFTkVfR0laTU8sXG4gICAgICAgICAgICAgICAgeCwgeSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdpem1vUm9vdCA9IGdpem1vU3ZjPy5naXptb1Jvb3ROb2RlO1xuICAgICAgICBpZiAoIWdpem1vUm9vdCkgcmV0dXJuIG5ldyBSYXljYXN0UmVzdWx0cyhudWxsIGFzIGFueSk7XG5cbiAgICAgICAgcmV0dXJuIGdldFJheWNhc3RSZXN1bHRzKGdpem1vUm9vdCwgeCwgeSwgSW5maW5pdHksIExheWVycy5FbnVtLklHTk9SRV9SQVlDQVNUKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9lbWl0RXZlbnRUb05vZGUobm9kZTogTm9kZSwgZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgbm9kZS5lbWl0KGV2ZW50LnR5cGUsIGV2ZW50KTtcbiAgICAgICAgICAgIGdldFNlcnZpY2VQcm9wKCdFbmdpbmUnKT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tIE5vdC1vbi1naXptbyBoYW5kbGVycyAtLS1cblxuICAgIHByaXZhdGUgX29uTm90R2l6bW9Nb3VzZURvd24oX2V2ZW50OiBHaXptb01vdXNlRXZlbnQpIHtcbiAgICAgICAgLy8gcGxhY2Vob2xkZXIgZm9yIHJlZ2lvbiBzZWxlY3Qgc3RhcnRcbiAgICB9XG5cbiAgICBwcml2YXRlIF9vbk5vdEdpem1vTW91c2VVcChldmVudDogR2l6bW9Nb3VzZUV2ZW50KTogYm9vbGVhbiB8IHZvaWQge1xuICAgICAgICBjb25zdCBpc1ZpZXdNb2RlID0gZ2V0U2VydmljZVByb3AoJ0dpem1vJyk/LnRyYW5zZm9ybVRvb2xEYXRhPy52aWV3TW9kZSA9PT0gJ3ZpZXcnO1xuICAgICAgICBjb25zdCBjYW1lcmFDdHJsID0gZ2V0U2VydmljZVByb3AoJ0NhbWVyYScpPy5jb250cm9sbGVyO1xuICAgICAgICBpZiAoZXZlbnQubGVmdEJ1dHRvbiAmJiAhaXNWaWV3TW9kZSAmJiAhY2FtZXJhQ3RybD8uaXNNb3Zpbmc/LigpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVnaW9uU2VsZWN0aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVnaW9uU2VsZWN0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5faGlkZVNlbGVjdGlvblJlZ2lvbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3ROb2RlKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX29uTm90R2l6bW9Nb3VzZU1vdmUoZXZlbnQ6IEdpem1vTW91c2VFdmVudCk6IGJvb2xlYW4gfCB1bmRlZmluZWQge1xuICAgICAgICBpZiAodGhpcy5fYW55S2V5RG93bikgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY29uc3QgZG93bkV2ZW50ID0gdGhpcy5fbm9HaXptb01vdXNlRG93bkV2ZW50O1xuICAgICAgICBjb25zdCBpc1ZpZXdNb2RlID0gZ2V0U2VydmljZVByb3AoJ0dpem1vJyk/LnRyYW5zZm9ybVRvb2xEYXRhPy52aWV3TW9kZSA9PT0gJ3ZpZXcnO1xuICAgICAgICBpZiAoZXZlbnQubGVmdEJ1dHRvbiAmJiBkb3duRXZlbnQgJiYgIWlzVmlld01vZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gZXZlbnQueCAtIGRvd25FdmVudC54O1xuICAgICAgICAgICAgY29uc3QgZHkgPSBldmVudC55IC0gZG93bkV2ZW50Lnk7XG4gICAgICAgICAgICBjb25zdCBkaXN0YW5jZSA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPCAxMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fcmVnaW9uU2VsZWN0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IHJldmVydFggPSBkb3duRXZlbnQueCA+IGV2ZW50Lng7XG4gICAgICAgICAgICBjb25zdCByZXZlcnRZID0gZG93bkV2ZW50LnkgPCBldmVudC55O1xuICAgICAgICAgICAgY29uc3QgbGVmdCA9IHJldmVydFggPyBldmVudC54IDogZG93bkV2ZW50Lng7XG4gICAgICAgICAgICBjb25zdCByaWdodCA9IHJldmVydFggPyBkb3duRXZlbnQueCA6IGV2ZW50Lng7XG4gICAgICAgICAgICBjb25zdCBib3R0b20gPSByZXZlcnRZID8gZG93bkV2ZW50LnkgOiBldmVudC55O1xuICAgICAgICAgICAgY29uc3QgdG9wID0gcmV2ZXJ0WSA/IGV2ZW50LnkgOiBkb3duRXZlbnQueTtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lvblNlbGVjdE5vZGUobGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tLCBldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gLS0tIEdpem1vLWhpdCBoYW5kbGVycyAtLS1cblxuICAgIHByaXZhdGUgX29uR2l6bW9Nb3VzZURvd24oZXZlbnQ6IEdpem1vTW91c2VFdmVudCwgcmVzdWx0czogUmF5Y2FzdFJlc3VsdHMpOiBib29sZWFuIHtcbiAgICAgICAgLy8g5LiOIGNvY29zLWVkaXRvciDkuIDoh7TvvJrnm7jmnLrnp7vliqjkuK3kuI3lpITnkIYgZ2l6bW8g5Lqk5LqSXG4gICAgICAgIGNvbnN0IGNhbWVyYUN0cmwgPSBnZXRTZXJ2aWNlUHJvcCgnQ2FtZXJhJyk/LmNvbnRyb2xsZXI7XG4gICAgICAgIGlmIChjYW1lcmFDdHJsPy5pc01vdmluZz8uKCkpIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGlmIChldmVudC5sZWZ0QnV0dG9uKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGluZm8gb2YgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJhY2tJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICBub2RlOiBpbmZvLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgIGhpdFBvaW50OiBpbmZvLmhpdFBvaW50ID8gaW5mby5oaXRQb2ludC5jbG9uZSgpIDogbmV3IFZlYzMoKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1ck1vdXNlRG93bkluZm9zLnB1c2goYmFja0luZm8pO1xuICAgICAgICAgICAgICAgIGV2ZW50LmhpdFBvaW50ID0gYmFja0luZm8uaGl0UG9pbnQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdEV2ZW50VG9Ob2RlKGluZm8ubm9kZSwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5wcm9wYWdhdGlvblN0b3BwZWQpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX29uR2l6bW9Nb3VzZVVwKGV2ZW50OiBHaXptb01vdXNlRXZlbnQpOiBib29sZWFuIHtcbiAgICAgICAgLy8g5LiOIGNvY29zLWVkaXRvciDkuIDoh7TvvJrnm7jmnLrnp7vliqjkuK3kuI3lpITnkIZcbiAgICAgICAgY29uc3QgY2FtZXJhQ3RybCA9IGdldFNlcnZpY2VQcm9wKCdDYW1lcmEnKT8uY29udHJvbGxlcjtcbiAgICAgICAgaWYgKGNhbWVyYUN0cmw/LmlzTW92aW5nPy4oKSkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgaWYgKHRoaXMuX2N1ck1vdXNlRG93bkluZm9zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaW5mbyBvZiB0aGlzLl9jdXJNb3VzZURvd25JbmZvcykge1xuICAgICAgICAgICAgICAgIGV2ZW50LmhpdFBvaW50ID0gaW5mby5oaXRQb2ludDtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbWl0RXZlbnRUb05vZGUoaW5mby5ub2RlLCBldmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCkgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9jdXJNb3VzZURvd25JbmZvcy5sZW5ndGggPSAwO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkuI4gY29jb3MtZWRpdG9yIOS4gOiHtO+8muayoeaciSBtb3VzZURvd24g6K6w5b2V5pe277yM5a+55b2T5YmN5L2N572uIHJheWNhc3Qg5bm25Y+R6YCB5LqL5Lu2XG4gICAgICAgIGNvbnN0IHsgeCwgeSB9ID0gZXZlbnQ7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnJheWNhc3RHaXptb3MoeCwgeSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5fZW1pdEV2ZW50VG9Ob2RlKHJlc3VsdHNbaV0ubm9kZSwgZXZlbnQpO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfb25HaXptb01vdXNlTW92ZShldmVudDogR2l6bW9Nb3VzZUV2ZW50LCByZXN1bHRzOiBSYXljYXN0UmVzdWx0cykge1xuICAgICAgICBpZiAodGhpcy5fY3VyTW91c2VEb3duSW5mb3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbWFwID0gbmV3IE1hcDxOb2RlLCBWZWMzPigpO1xuICAgICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKChpbmZvOiBhbnkpID0+IG1hcC5zZXQoaW5mby5ub2RlLCBpbmZvLmhpdFBvaW50IHx8IG5ldyBWZWMzKCkpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaW5mbyBvZiB0aGlzLl9jdXJNb3VzZURvd25JbmZvcykge1xuICAgICAgICAgICAgICAgIGV2ZW50LmhpdFBvaW50ID0gbWFwLmdldChpbmZvLm5vZGUpIHx8IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdEV2ZW50VG9Ob2RlKGluZm8ubm9kZSwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5wcm9wYWdhdGlvblN0b3BwZWQpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tIE1haW4gZXZlbnQgaGFuZGxlcnMgLS0tXG5cbiAgICBwdWJsaWMgb25Nb3VzZURvd24oZXZlbnQ6IElTY2VuZU1vdXNlRXZlbnQpOiBib29sZWFuIHwgdm9pZCB7XG4gICAgICAgIHRoaXMuX2dpem1vTW92ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fYW55S2V5RG93biA9IGV2ZW50LmFsdEtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50LnNoaWZ0S2V5IHx8IGV2ZW50Lm1ldGFLZXk7XG5cbiAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBjcmVhdGVHaXptb01vdXNlRXZlbnQoJ21vdXNlRG93bicsIGV2ZW50KTtcblxuICAgICAgICAvLyDkuI4gY29jb3MtZWRpdG9yIOS4gOiHtO+8muS4jeWMuuWIhuaMiemUru+8jOWni+e7iOWBmiByYXljYXN0XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnJheWNhc3RHaXptb3MoY3VzdG9tRXZlbnQueCwgY3VzdG9tRXZlbnQueSk7XG4gICAgICAgIHRoaXMuX21vdXNlRG93blJheWNhc3RHaXptb3MgPSByZXN1bHRzO1xuXG4gICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2dpem1vTW91c2VEb3duRXZlbnQgPSBjdXN0b21FdmVudDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vbkdpem1vTW91c2VEb3duKGN1c3RvbUV2ZW50LCByZXN1bHRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX25vR2l6bW9Nb3VzZURvd25FdmVudCA9IGN1c3RvbUV2ZW50O1xuICAgICAgICB0aGlzLl9vbk5vdEdpem1vTW91c2VEb3duKGN1c3RvbUV2ZW50KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Nb3VzZVVwKGV2ZW50OiBJU2NlbmVNb3VzZUV2ZW50KTogYm9vbGVhbiB8IHZvaWQge1xuICAgICAgICB0aGlzLl9hbnlLZXlEb3duID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gY3JlYXRlR2l6bW9Nb3VzZUV2ZW50KCdtb3VzZVVwJywgZXZlbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLl9tb3VzZURvd25SYXljYXN0R2l6bW9zICYmIHRoaXMuX21vdXNlRG93blJheWNhc3RHaXptb3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9naXptb01vdXNlRG93bkV2ZW50KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2dpem1vTW91c2VEb3duRXZlbnQgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29uR2l6bW9Nb3VzZVVwKGN1c3RvbUV2ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fbm9HaXptb01vdXNlRG93bkV2ZW50KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX25vR2l6bW9Nb3VzZURvd25FdmVudCA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb25Ob3RHaXptb01vdXNlVXAoY3VzdG9tRXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uTW91c2VNb3ZlKGV2ZW50OiBJU2NlbmVNb3VzZUV2ZW50KTogYm9vbGVhbiB8IHZvaWQge1xuICAgICAgICB0aGlzLl9naXptb01vdmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBjcmVhdGVHaXptb01vdXNlRXZlbnQoJ21vdXNlTW92ZScsIGV2ZW50KTtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucmF5Y2FzdEdpem1vcyhjdXN0b21FdmVudC54LCBjdXN0b21FdmVudC55KTtcblxuICAgICAgICBpZiAodGhpcy5fbW91c2VEb3duUmF5Y2FzdEdpem1vcyAmJiB0aGlzLl9tb3VzZURvd25SYXljYXN0R2l6bW9zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fZ2l6bW9Nb3VzZURvd25FdmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jaGFuZ2VNb3VzZUhvdmVyKGN1c3RvbUV2ZW50LCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vbkdpem1vTW91c2VNb3ZlKGN1c3RvbUV2ZW50LCByZXN1bHRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fbm9HaXptb01vdXNlRG93bkV2ZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NoYW5nZU1vdXNlSG92ZXIoY3VzdG9tRXZlbnQsIHJlc3VsdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29uTm90R2l6bW9Nb3VzZU1vdmUoY3VzdG9tRXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uTW91c2VXaGVlbCgpIHt9XG5cbiAgICBwcml2YXRlIF9jaGFuZ2VNb3VzZUhvdmVyKGV2ZW50OiBHaXptb01vdXNlRXZlbnQsIHJlc3VsdHM6IFJheWNhc3RSZXN1bHRzKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLl9hbnlLZXlEb3duKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4jue8lui+keWZqOS4gOiHtO+8mnZlcnRleFNuYXAg5qOA5p+lXG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IGdldFNlcnZpY2VQcm9wKCdTZWxlY3Rpb24nKTtcbiAgICAgICAgY29uc3QgcGF0aHM6IHN0cmluZ1tdID0gc2VsZWN0aW9uPy5xdWVyeT8uKCkgPz8gW107XG4gICAgICAgIGlmIChwYXRoc1swXSkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGdldE5vZGVCeVBhdGgocGF0aHNbMF0pO1xuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBnZXRTZXJ2aWNlUHJvcCgnR2l6bW8nKT8uY2FsbEFsbEdpem1vRnVuY09mTm9kZT8uKG5vZGUsICdvblZlcnRleFNuYXBNb3ZlJywgZXZlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChyZXMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaG92ZXJJbk5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICAgICAgY29uc3QgdGVtcFNldDogU2V0PE5vZGU+ID0gbmV3IFNldCgpO1xuICAgICAgICBjb25zdCBoaXRQb2ludCA9IG5ldyBWZWMzKCk7XG5cbiAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcmF5ID0gcmVzdWx0cy5yYXk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIFZlYzMubXVsdGlwbHlTY2FsYXIoaGl0UG9pbnQsIHJheS5kLCByZXN1bHRzW2ldLmRpc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgVmVjMy5hZGQoaGl0UG9pbnQsIHJheS5vLCBoaXRQb2ludCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmhpdFBvaW50ID0gaGl0UG9pbnQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuaGl0UG9pbnQgPSByZXN1bHRzW2ldLmhpdFBvaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzW2ldLm5vZGUuZW1pdChldmVudC50eXBlLCBldmVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgaW5mbyBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgdGVtcFNldC5hZGQoaW5mby5ub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2hvdmVySW5Ob2RlTWFwLmhhcyhpbmZvLm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvdmVySW5Ob2RlID0gaW5mby5ub2RlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ob3ZlckluTm9kZU1hcC5zZXQoaW5mby5ub2RlLCBldmVudC5wcm9wYWdhdGlvblN0b3BwZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faG92ZXJJbk5vZGVNYXAuZ2V0KGluZm8ubm9kZSkpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaG92ZXJPdXRcbiAgICAgICAgdGhpcy5faG92ZXJJbk5vZGVNYXAuZm9yRWFjaCgoX2Jvb2wsIG5vZGUpID0+IHtcbiAgICAgICAgICAgIGlmICghdGVtcFNldC5oYXMobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBldmVudC50eXBlID0gJ2hvdmVyT3V0JztcbiAgICAgICAgICAgICAgICBldmVudC5jdXN0b21EYXRhID0geyBob3ZlckluTm9kZU1hcDogdGhpcy5faG92ZXJJbk5vZGVNYXAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbWl0RXZlbnRUb05vZGUobm9kZSwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2hvdmVySW5Ob2RlTWFwLmRlbGV0ZShub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gaG92ZXJJbiBhZnRlciBob3Zlck91dFxuICAgICAgICBpZiAoaG92ZXJJbk5vZGUpIHtcbiAgICAgICAgICAgIGV2ZW50LnR5cGUgPSAnaG92ZXJJbic7XG4gICAgICAgICAgICB0aGlzLl9lbWl0RXZlbnRUb05vZGUoaG92ZXJJbk5vZGUsIGV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIC0tLSBOb2RlIHNlbGVjdGlvbiAtLS1cblxuICAgIHByaXZhdGUgX3NlbGVjdE5vZGUoZXZlbnQ6IEdpem1vTW91c2VFdmVudCkge1xuICAgICAgICBjb25zdCBjYW1lcmEgPSBnZXRTZXJ2aWNlUHJvcCgnQ2FtZXJhJyk/LmdldENhbWVyYT8uKCk/LmNhbWVyYTtcbiAgICAgICAgaWYgKCFjYW1lcmEpIHJldHVybjtcblxuICAgICAgICBjb25zdCBtYXNrID0gTGF5ZXJzLm1ha2VNYXNrRXhjbHVkZShbXG4gICAgICAgICAgICBMYXllcnMuRW51bS5HSVpNT1MsXG4gICAgICAgICAgICBMYXllcnMuRW51bS5TQ0VORV9HSVpNTyxcbiAgICAgICAgICAgIExheWVycy5FbnVtLkVESVRPUixcbiAgICAgICAgICAgIExheWVycy5FbnVtLklHTk9SRV9SQVlDQVNULFxuICAgICAgICBdKTtcbiAgICAgICAgY29uc3Qgbm9kZXMgPSBnZXRSYXljYXN0UmVzdWx0Tm9kZXMoY2FtZXJhLCBldmVudC54LCBldmVudC55LCBtYXNrKTtcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gZ2V0U2VydmljZVByb3AoJ1NlbGVjdGlvbicpO1xuXG4gICAgICAgIGlmIChub2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0Tm9kZTogTm9kZSB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGVja05vZGUgb2Ygbm9kZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tOb2RlLl9vYmpGbGFncyAmIENDT2JqZWN0LkZsYWdzLkxvY2tlZEluRWRpdG9yKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICByZXN1bHROb2RlID0gY2hlY2tOb2RlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFyZXN1bHROb2RlKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IGN1clNlbGVjdGlvbnMgPSBzZWxlY3Rpb24/LnF1ZXJ5Py4oKSA/PyBbXTtcblxuICAgICAgICAgICAgaWYgKCFldmVudC5jdHJsS2V5ICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvbj8uY2xlYXI/LigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQuY3RybEtleSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdFBhdGggPSBnZXROb2RlUGF0aChyZXN1bHROb2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoY3VyU2VsZWN0aW9ucy5pbmNsdWRlcyhyZXN1bHRQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24/LnVuc2VsZWN0Py4ocmVzdWx0UGF0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uPy5zZWxlY3Q/LihyZXN1bHRQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdE5vZGUgPSBnZXRTZWxlY3ROb2RlKG5vZGVzLCBjdXJTZWxlY3Rpb25zWzBdKTtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb24/LnNlbGVjdD8uKGdldE5vZGVQYXRoKHJlc3VsdE5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChldmVudC5sZWZ0QnV0dG9uICYmICFldmVudC5jdHJsS2V5ICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvbj8uY2xlYXI/LigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVnaW9uU2VsZWN0Tm9kZShcbiAgICAgICAgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyLCB0b3A6IG51bWJlciwgYm90dG9tOiBudW1iZXIsIF9tdWx0aXBsZTogYm9vbGVhbixcbiAgICApIHtcbiAgICAgICAgdGhpcy5fc2hvd1NlbGVjdGlvblJlZ2lvbihsZWZ0LCByaWdodCwgdG9wLCBib3R0b20pO1xuXG4gICAgICAgIGNvbnN0IGNhbWVyYSA9IGdldFNlcnZpY2VQcm9wKCdDYW1lcmEnKT8uZ2V0Q2FtZXJhPy4oKT8uY2FtZXJhO1xuICAgICAgICBpZiAoIWNhbWVyYSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG1hc2sgPSBMYXllcnMubWFrZU1hc2tFeGNsdWRlKFtcbiAgICAgICAgICAgIExheWVycy5FbnVtLkdJWk1PUyxcbiAgICAgICAgICAgIExheWVycy5FbnVtLlNDRU5FX0dJWk1PLFxuICAgICAgICAgICAgTGF5ZXJzLkVudW0uRURJVE9SLFxuICAgICAgICBdKTtcbiAgICAgICAgY29uc3Qgbm9kZXMgPSBnZXRSZWdpb25Ob2RlcyhjYW1lcmEsIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSwgbWFzayk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IGdldFNlcnZpY2VQcm9wKCdTZWxlY3Rpb24nKTtcblxuICAgICAgICBjb25zdCBzZWxlY3RTZXQgPSBuZXcgU2V0PHN0cmluZz4oc2VsZWN0aW9uPy5xdWVyeT8uKCkgPz8gW10pO1xuICAgICAgICBub2Rlcy5mb3JFYWNoKChub2RlOiBOb2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBub2RlUGF0aCA9IGdldE5vZGVQYXRoKG5vZGUpO1xuICAgICAgICAgICAgaWYgKCFzZWxlY3RTZXQuaGFzKG5vZGVQYXRoKSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvbj8uc2VsZWN0Py4obm9kZVBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZWN0U2V0LmRlbGV0ZShub2RlUGF0aCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGNvbnN0IHBhdGggb2Ygc2VsZWN0U2V0LmtleXMoKSkge1xuICAgICAgICAgICAgc2VsZWN0aW9uPy51bnNlbGVjdD8uKHBhdGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2hvd1NlbGVjdGlvblJlZ2lvbihsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXIsIHRvcDogbnVtYmVyLCBib3R0b206IG51bWJlcikge1xuICAgICAgICBjb25zdCBjYW1lcmFDb21wID0gZ2V0U2VydmljZVByb3AoJ0NhbWVyYScpPy5nZXRDYW1lcmE/LigpO1xuICAgICAgICBpZiAoIWNhbWVyYUNvbXApIHJldHVybjtcblxuICAgICAgICBjb25zdCBwb3MwID0gbmV3IFZlYzMobGVmdCwgYm90dG9tLCAwLjEpO1xuICAgICAgICBjb25zdCBwb3MxID0gbmV3IFZlYzMocmlnaHQsIGJvdHRvbSwgMC4xKTtcbiAgICAgICAgY29uc3QgcG9zMiA9IG5ldyBWZWMzKHJpZ2h0LCB0b3AsIDAuMSk7XG4gICAgICAgIGNvbnN0IHBvczMgPSBuZXcgVmVjMyhsZWZ0LCB0b3AsIDAuMSk7XG4gICAgICAgIGNvbnN0IHAwID0gbmV3IFZlYzMoKTtcbiAgICAgICAgY29uc3QgcDEgPSBuZXcgVmVjMygpO1xuICAgICAgICBjb25zdCBwMiA9IG5ldyBWZWMzKCk7XG4gICAgICAgIGNvbnN0IHAzID0gbmV3IFZlYzMoKTtcbiAgICAgICAgY2FtZXJhQ29tcC5zY3JlZW5Ub1dvcmxkKHBvczAsIHAwKTtcbiAgICAgICAgY2FtZXJhQ29tcC5zY3JlZW5Ub1dvcmxkKHBvczEsIHAxKTtcbiAgICAgICAgY2FtZXJhQ29tcC5zY3JlZW5Ub1dvcmxkKHBvczIsIHAyKTtcbiAgICAgICAgY2FtZXJhQ29tcC5zY3JlZW5Ub1dvcmxkKHBvczMsIHAzKTtcblxuICAgICAgICBjb25zdCBnZW9tZXRyeVJlbmRlcmVyID0gZ2V0U2VydmljZVByb3AoJ0VuZ2luZScpPy5nZXRHZW9tZXRyeVJlbmRlcmVyPy4oKTtcbiAgICAgICAgaWYgKGdlb21ldHJ5UmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGdlb21ldHJ5UmVuZGVyZXIucmVtb3ZlRGF0YSgnYWRkUXVhZCcpO1xuICAgICAgICAgICAgZ2VvbWV0cnlSZW5kZXJlci5hZGRRdWFkKHAwLCBwMSwgcDIsIHAzLCBuZXcgQ29sb3IoMjU1LCAyNTUsIDI1NSwgMTIwKSwgZmFsc2UsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBnZXRTZXJ2aWNlUHJvcCgnRW5naW5lJyk/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9oaWRlU2VsZWN0aW9uUmVnaW9uKCkge1xuICAgICAgICBnZXRTZXJ2aWNlUHJvcCgnRW5naW5lJyk/LmdldEdlb21ldHJ5UmVuZGVyZXI/LigpPy5yZW1vdmVEYXRhKCdhZGRRdWFkJyk7XG4gICAgICAgIGdldFNlcnZpY2VQcm9wKCdFbmdpbmUnKT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgIH1cblxuICAgIC8vIC0tLSBLZXlib2FyZCAtLS1cblxuICAgIHB1YmxpYyBvbktleURvd24oZXZlbnQ6IElTY2VuZUtleWJvYXJkRXZlbnQpOiBib29sZWFuIHwgdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9yZWdpb25TZWxlY3RpbmcpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBnZXRTZXJ2aWNlUHJvcCgnU2VsZWN0aW9uJyk7XG4gICAgICAgIGNvbnN0IHBhdGhzOiBzdHJpbmdbXSA9IHNlbGVjdGlvbj8ucXVlcnk/LigpID8/IFtdO1xuICAgICAgICBpZiAocGF0aHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGdldE5vZGVCeVBhdGgocGF0aHNbMF0pO1xuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBnZXRTZXJ2aWNlUHJvcCgnR2l6bW8nKT8uY2FsbEFsbEdpem1vRnVuY09mTm9kZT8uKG5vZGUsICdvbktleURvd24nLCBldmVudCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25LZXlVcChldmVudDogSVNjZW5lS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4gfCB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gZ2V0U2VydmljZVByb3AoJ1NlbGVjdGlvbicpO1xuICAgICAgICBjb25zdCBwYXRoczogc3RyaW5nW10gPSBzZWxlY3Rpb24/LnF1ZXJ5Py4oKSA/PyBbXTtcbiAgICAgICAgaWYgKHBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBnZXROb2RlQnlQYXRoKHBhdGhzWzBdKTtcbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzID0gZ2V0U2VydmljZVByb3AoJ0dpem1vJyk/LmNhbGxBbGxHaXptb0Z1bmNPZk5vZGU/Lihub2RlLCAnb25LZXlVcCcsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIC0tLSBMaWZlY3ljbGUgLS0tXG5cbiAgICBwdWJsaWMgaW5pdCgpIHtcbiAgICAgICAgY29uc3Qgb3BlcmF0aW9uTWdyID0gZ2V0U2VydmljZVByb3AoJ09wZXJhdGlvbicpO1xuICAgICAgICBpZiAob3BlcmF0aW9uTWdyKSB7XG4gICAgICAgICAgICBvcGVyYXRpb25NZ3IuYWRkTGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZURvd24uYmluZCh0aGlzKSwgT3BlcmF0aW9uUHJpb3JpdHkuR2l6bW8pO1xuICAgICAgICAgICAgb3BlcmF0aW9uTWdyLmFkZExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlLmJpbmQodGhpcyksIE9wZXJhdGlvblByaW9yaXR5Lkdpem1vKTtcbiAgICAgICAgICAgIG9wZXJhdGlvbk1nci5hZGRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZVVwLmJpbmQodGhpcyksIE9wZXJhdGlvblByaW9yaXR5Lkdpem1vKTtcbiAgICAgICAgICAgIG9wZXJhdGlvbk1nci5hZGRMaXN0ZW5lcignbW91c2V3aGVlbCcsIHRoaXMub25Nb3VzZVdoZWVsLmJpbmQodGhpcyksIE9wZXJhdGlvblByaW9yaXR5Lkdpem1vKTtcbiAgICAgICAgICAgIG9wZXJhdGlvbk1nci5hZGRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duLmJpbmQodGhpcyksIE9wZXJhdGlvblByaW9yaXR5Lkdpem1vKTtcbiAgICAgICAgICAgIG9wZXJhdGlvbk1nci5hZGRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSwgT3BlcmF0aW9uUHJpb3JpdHkuR2l6bW8pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFyKCkge1xuICAgICAgICB0aGlzLl9naXptb01vdXNlRG93bkV2ZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbm9HaXptb01vdXNlRG93bkV2ZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5faG92ZXJJbk5vZGVNYXAuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fY3VyTW91c2VEb3duSW5mb3MubGVuZ3RoID0gMDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEdpem1vT3BlcmF0aW9uO1xuIl19