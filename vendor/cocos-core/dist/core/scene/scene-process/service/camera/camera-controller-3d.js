"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraController3D = void 0;
exports.smoothMouseWheelScale = smoothMouseWheelScale;
const cc_1 = require("cc");
const camera_controller_base_1 = __importDefault(require("./camera-controller-base"));
const utils_1 = require("./utils");
const finite_state_machine_1 = __importDefault(require("../utils/state-machine/finite-state-machine"));
const linear_ticks_1 = __importDefault(require("./grid/linear-ticks"));
const tween_1 = require("./tween");
const idle_mode_1 = __importDefault(require("./modes/idle-mode"));
const orbit_mode_1 = __importDefault(require("./modes/orbit-mode"));
const pan_mode_1 = __importDefault(require("./modes/pan-mode"));
const wander_mode_1 = __importDefault(require("./modes/wander-mode"));
const decorator_1 = require("../core/decorator");
const engine_utils_1 = require("../gizmo/utils/engine-utils");
const rpc_1 = require("../../rpc");
// ---------- node utility helpers ----------
const tempMatrix = new cc_1.Mat4();
function limitRange(distance) {
    return Math.min(Math.max(distance, -1e10), 1e10);
}
function getMainWindowSize() {
    const canvas = cc.game?.canvas;
    return {
        width: canvas?.width ?? 1280,
        height: canvas?.height ?? 720,
    };
}
function getObbFromRect(mat, rect, outBL, outTL, outTR, outBR) {
    const x = rect.x;
    const y = rect.y;
    const width = rect.width;
    const height = rect.height;
    const tx = mat.m00 * x + mat.m04 * y + mat.m12;
    const ty = mat.m01 * x + mat.m05 * y + mat.m13;
    const xa = mat.m00 * width;
    const xb = mat.m01 * width;
    const yc = mat.m04 * height;
    const yd = mat.m05 * height;
    outBL = outBL || new cc_1.Vec2();
    outTL = outTL || new cc_1.Vec2();
    outTR = outTR || new cc_1.Vec2();
    outBR = outBR || new cc_1.Vec2();
    outTL.x = tx;
    outTL.y = ty;
    outTR.x = xa + tx;
    outTR.y = xb + ty;
    outBL.x = yc + tx;
    outBL.y = yd + ty;
    outBR.x = xa + yc + tx;
    outBR.y = xb + yd + ty;
    return [outBL, outTL, outTR, outBR];
}
function getObbFromBound(aabb) {
    const minPos = new cc_1.Vec3();
    const maxPos = new cc_1.Vec3();
    aabb.getBoundary(minPos, maxPos);
    return [
        minPos,
        new cc_1.Vec3(maxPos.x, minPos.y, minPos.z),
        new cc_1.Vec3(maxPos.x, maxPos.y, minPos.z),
        new cc_1.Vec3(minPos.x, maxPos.y, minPos.z),
        maxPos,
        new cc_1.Vec3(minPos.x, maxPos.y, maxPos.z),
        new cc_1.Vec3(minPos.x, minPos.y, maxPos.z),
        new cc_1.Vec3(maxPos.x, minPos.y, maxPos.z),
    ];
}
function getObbFromMeshRenderer(modelComp, mat) {
    modelComp.model?.updateWorldBound?.();
    let worldBound = modelComp.model?.worldBounds;
    if (!worldBound) {
        worldBound = cc_1.geometry.AABB.create();
        const modelBound = modelComp.model?.modelBounds;
        if (modelBound) {
            cc_1.geometry.AABB.transform(worldBound, modelBound, mat);
        }
        else {
            cc_1.geometry.AABB.transform(worldBound, worldBound, cc_1.Mat4.IDENTITY);
        }
    }
    return getObbFromBound(worldBound);
}
function getObbFromUITransform(modelComp, mat) {
    let size = cc.size(0, 0);
    let width = size.width;
    let height = size.height;
    const rect = new cc.Rect(0, 0, width, height);
    const outBL = new cc_1.Vec2();
    const outTL = new cc_1.Vec2();
    const outTR = new cc_1.Vec2();
    const outBR = new cc_1.Vec2();
    if (modelComp) {
        size = modelComp.contentSize;
        width = size.width;
        height = size.height;
        const anchor = modelComp.anchorPoint;
        rect.x = -anchor.x * width;
        rect.y = -anchor.y * height;
        rect.width = width;
        rect.height = height;
    }
    const bounds = getObbFromRect(mat, rect, outBL, outTL, outTR, outBR);
    const pos = getWorldPosition3D(modelComp.node);
    return bounds.map(item => new cc_1.Vec3(item.x, item.y, pos.z));
}
function getWorldOrientedBounds(node) {
    node.getWorldMatrix(tempMatrix);
    const modelComp = node.getComponent(cc_1.MeshRenderer);
    if (modelComp) {
        return getObbFromMeshRenderer(modelComp, tempMatrix);
    }
    const UITransform = cc.UITransform;
    const uiComp = UITransform ? node.getComponent(UITransform) : null;
    if (uiComp) {
        return getObbFromUITransform(uiComp, tempMatrix);
    }
    const rect = new cc.Rect(0, 0, 0, 0);
    const bounds = getObbFromRect(tempMatrix, rect);
    const pos = getWorldPosition3D(node);
    return bounds.map(item => new cc_1.Vec3(item.x, item.y, pos.z));
}
function getCenterWorldPos3D(nodes) {
    let minX = null;
    let minY = null;
    let minZ = null;
    let maxX = null;
    let maxY = null;
    let maxZ = null;
    for (let i = 0; i < nodes.length; ++i) {
        const bounds = getWorldOrientedBounds(nodes[i]);
        for (let j = 0; j < bounds.length; ++j) {
            const v = bounds[j];
            if (minX === null || v.x < minX)
                minX = v.x;
            if (maxX === null || v.x > maxX)
                maxX = v.x;
            if (minY === null || v.y < minY)
                minY = v.y;
            if (maxY === null || v.y > maxY)
                maxY = v.y;
            if (minZ === null || v.z < minZ)
                minZ = v.z;
            if (maxZ === null || v.z > maxZ)
                maxZ = v.z;
        }
    }
    minX = limitRange(minX);
    maxX = limitRange(maxX);
    minY = limitRange(minY);
    maxY = limitRange(maxY);
    minZ = limitRange(minZ);
    maxZ = limitRange(maxZ);
    return new cc_1.Vec3((minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5);
}
function getWorldPosition3D(node) {
    return node.getWorldPosition();
}
function getBoundaryOfMeshNode(node) {
    if (!node)
        return null;
    const modelComp = node.getComponent(cc_1.MeshRenderer);
    if (!modelComp)
        return null;
    const SkinnedMeshRenderer = cc.SkinnedMeshRenderer;
    if (SkinnedMeshRenderer && modelComp instanceof SkinnedMeshRenderer) {
        modelComp.model?.updateTransform?.(-1);
        return modelComp.model?.worldBounds ?? null;
    }
    if (modelComp.mesh && modelComp.model) {
        let transformAABB = modelComp.model.modelBounds?.clone() ?? null;
        if (!transformAABB) {
            const mesh = modelComp.mesh;
            if (mesh && mesh.minPosition && mesh.maxPosition) {
                transformAABB = cc_1.geometry.AABB.fromPoints(cc_1.geometry.AABB.create(), mesh.minPosition, mesh.maxPosition);
            }
        }
        if (transformAABB) {
            cc_1.geometry.AABB.transform(transformAABB, transformAABB, node.worldMatrix);
        }
        return transformAABB;
    }
    return null;
}
// 引擎的粒子发射器形状枚举未从 cc 公开导出，这里与 Creator（utils/node.ts）一致，
// 按其稳定的序列化值定义一个本地 ShapeType 枚举，避免使用魔法数字。
var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["Box"] = 0] = "Box";
    ShapeType[ShapeType["Circle"] = 1] = "Circle";
    ShapeType[ShapeType["Cone"] = 2] = "Cone";
    ShapeType[ShapeType["Sphere"] = 3] = "Sphere";
    ShapeType[ShapeType["Hemisphere"] = 4] = "Hemisphere";
})(ShapeType || (ShapeType = {}));
function getRangeFromParticleComp(component) {
    let range = 0;
    if (component.shapeModule?.enable) {
        const shapeModule = component.shapeModule;
        switch (shapeModule.shapeType) {
            case ShapeType.Box:
                range = Math.max(shapeModule.scale.x, shapeModule.scale.y, shapeModule.scale.z);
                break;
            case ShapeType.Circle:
            case ShapeType.Sphere:
            case ShapeType.Hemisphere:
                range = shapeModule.radius;
                break;
            case ShapeType.Cone:
                range = Math.max(shapeModule.radius, shapeModule.length);
                break;
        }
    }
    return range;
}
function isEditorNode(node) {
    if (node.layer & cc_1.Layers.Enum.GIZMOS) {
        return true;
    }
    let iterNode = node;
    while (iterNode) {
        if (iterNode.objFlags & cc_1.CCObject.Flags.HideInHierarchy) {
            return true;
        }
        iterNode = iterNode.parent;
    }
    return false;
}
function getMaxRangeOfNode(node) {
    let maxRange = 0.001;
    if (!node || isEditorNode(node))
        return maxRange;
    let compRange = 0;
    const components = node.components;
    if (components.length === 0) {
        maxRange = 1;
    }
    for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const className = cc_1.js.getClassName(component);
        switch (className) {
            case 'cc.SphereLight':
            case 'cc.SpotLight':
            case 'cc.PointLight':
                compRange = component.range ?? 3;
                break;
            case 'cc.LightProbeGroup': {
                const comp = component;
                const probesSize = new cc_1.Vec3(comp.maxPos).subtract(comp.minPos);
                compRange = Math.max(Math.abs(probesSize.x / 2), Math.abs(probesSize.y / 2), Math.abs(probesSize.z / 2));
                break;
            }
            case 'cc.RangedDirectionalLight':
            case 'cc.DirectionalLight':
            case 'cc.Camera':
                compRange = 3;
                break;
            case 'cc.MeshRenderer':
            case 'cc.SkinnedMeshRenderer':
            case 'cc.AvatarModelComponent':
            case 'cc.SkinnedMeshBatchRenderer': {
                const mr = component;
                if (mr.mesh && mr.model) {
                    let worldBound = mr.model.worldBounds;
                    if (!worldBound) {
                        const modelBound = mr.model.modelBounds;
                        if (modelBound) {
                            worldBound = cc_1.geometry.AABB.create();
                            cc_1.geometry.AABB.transform(worldBound, modelBound, node.worldMatrix);
                        }
                    }
                    if (worldBound && (Number.isNaN(worldBound.halfExtents.x)
                        || Number.isNaN(worldBound.halfExtents.y)
                        || Number.isNaN(worldBound.halfExtents.z))) {
                        worldBound = getBoundaryOfMeshNode(node);
                    }
                    if (worldBound) {
                        compRange = Math.max(worldBound.halfExtents.x, worldBound.halfExtents.y, worldBound.halfExtents.z);
                    }
                }
                break;
            }
            case 'cc.UITransform': {
                const ui = component;
                if (ui.getBoundingBox) {
                    const bbox = ui.getBoundingBox();
                    if (ui.node.parent) {
                        const wm = ui.node.parent.worldMatrix;
                        if (wm && bbox.transformMat4) {
                            bbox.transformMat4(wm);
                        }
                    }
                    compRange = Math.max(bbox.width / 2, bbox.height / 2);
                }
                break;
            }
            case 'cc.BoxCollider': {
                const size = component.size;
                if (size)
                    compRange = Math.max(size.x / 2, size.y / 2, size.z / 2);
                break;
            }
            case 'cc.SphereCollider':
                compRange = component.radius ?? 1;
                break;
            case 'cc.CapsuleCollider': {
                const cap = component;
                compRange = Math.max((cap.height ?? 2) / 2, cap.radius ?? 0.5);
                break;
            }
            case 'cc.ReflectionProbe': {
                const size = component.size;
                if (size)
                    compRange = Math.max(size.x, size.y, size.z) / 2;
                break;
            }
            case 'cc.ParticleSystem': {
                compRange = getRangeFromParticleComp(component);
                break;
            }
            default: {
                const Terrain = cc.Terrain;
                if (Terrain && className === cc_1.js.getClassName(Terrain)) {
                    const info = component.info;
                    if (info?.size) {
                        compRange = Math.max(info.size.width / 2, info.size.height / 2);
                    }
                }
                break;
            }
        }
        if (compRange > maxRange) {
            maxRange = compRange;
        }
        else if (compRange === 0) {
            maxRange = Math.max(maxRange, 1);
        }
    }
    return limitRange(maxRange);
}
function getMaxRangeOfNodes(nodes) {
    let maxRange = Number.MIN_VALUE;
    if (nodes) {
        for (const node of nodes) {
            let range = getMaxRangeOfNode(node);
            if (range > maxRange)
                maxRange = range;
            range = getMaxRangeOfNodes(node.children);
            if (range > maxRange)
                maxRange = range;
        }
    }
    return maxRange;
}
function makeVec3InRange(v, min, max) {
    v.x = Math.min(max, Math.max(min, v.x));
    v.y = Math.min(max, Math.max(min, v.y));
    v.z = Math.min(max, Math.max(min, v.z));
}
// ---------- smooth mouse wheel helper ----------
function smoothMouseWheelScale(delta) {
    return (delta > 0 ? 1 : -1) * (Math.pow(2, Math.abs(delta) * 0.02) - 1) * 10;
}
// ---------- constants ----------
const _maxTicks = 100;
const ORTHO = cc_1.Camera.ProjectionType.ORTHO;
const PERSPECTIVE = cc_1.Camera.ProjectionType.PERSPECTIVE;
var ModeCommand;
(function (ModeCommand) {
    ModeCommand["ToIdle"] = "toIdle";
    ModeCommand["ToPan"] = "toPan";
    ModeCommand["ToOrbit"] = "toOrbit";
    ModeCommand["ToWander"] = "toWander";
})(ModeCommand || (ModeCommand = {}));
class CameraController3D extends camera_controller_base_1.default {
    v3a = new cc_1.Vec3();
    v3b = new cc_1.Vec3();
    v3c = new cc_1.Vec3();
    v3d = new cc_1.Vec3();
    _wheelSpeed = 0.01;
    _near = 0.1;
    _far = 10000;
    _orthoScale = 0.1;
    _minScalar = 0.1;
    homePos = new cc_1.Vec3(50, 50, 50);
    homeRot = cc_1.Quat.fromViewUp(new cc_1.Quat(), cc_1.Vec3.normalize(this.v3a, this.homePos));
    _sceneViewCenter = new cc_1.Vec3();
    viewDist = 20;
    forward = new cc_1.Vec3(cc_1.Vec3.UNIT_Z);
    _curRot = new cc_1.Quat();
    _curEye = new cc_1.Vec3();
    _lineColor = new cc_1.Color(85, 85, 85, 255);
    lastMouseWheelDeltaY = 0;
    maxMouseWheelDeltaY = 1000;
    _modeFSM;
    _idleMode;
    _orbitMode;
    _panMode;
    _wanderMode;
    view;
    hTicks;
    vTicks;
    shiftKey;
    altKey;
    mousePressing = false;
    lastFocusNodeUUID = [];
    get lineColor() {
        return this._lineColor;
    }
    set lineColor(value) {
        this._lineColor = value;
    }
    get sceneViewCenter() {
        return this._sceneViewCenter;
    }
    set sceneViewCenter(value) {
        this._sceneViewCenter.set(value);
    }
    get wanderSpeed() {
        return this._wanderMode.wanderSpeed;
    }
    set wanderSpeed(value) {
        this._wanderMode.wanderSpeed = value;
    }
    get enableAcceleration() {
        return this._wanderMode.enableAcceleration;
    }
    set enableAcceleration(value) {
        this._wanderMode.enableAcceleration = value;
    }
    init(camera) {
        super.init(camera);
        const parentNode = this.node.parent || this.node;
        this._gridMeshComp = utils_1.CameraUtils.createGrid('internal/editor/grid', parentNode);
        this._gridMeshComp.node.active = false;
        this._gridMeshComp.node.setWorldRotationFromEuler(90, 0, 0);
        this.initOriginAxis();
        this._initMode();
        this.reset();
        this._initLinearTick();
    }
    showGrid(visible) {
        super.showGrid(visible);
        if (this._originAxisHorizontalMeshComp?.node) {
            this._originAxisHorizontalMeshComp.node.active = visible && (this.originAxisX_Visible || this.originAxisZ_Visible);
        }
        if (this._originAxisVerticalMeshComp?.node) {
            this._originAxisVerticalMeshComp.node.active = visible && this.originAxisY_Visible;
        }
    }
    // ---------- 原点轴 ----------
    initOriginAxis() {
        const parentNode = this.node.parent || this.node;
        this._originAxisHorizontalMeshComp = utils_1.CameraUtils.createGrid('internal/editor/grid', parentNode);
        this._originAxisHorizontalMeshComp.node.setWorldRotationFromEuler(90, 0, 0);
        this._originAxisVerticalMeshComp = utils_1.CameraUtils.createGrid('internal/editor/grid', parentNode);
        this._originAxisVerticalMeshComp.node.setWorldRotationFromEuler(0, 90, 0);
        this.originAxisX_Visible = true;
        this.originAxisZ_Visible = true;
        this._originAxisHorizontalMeshComp.node.active = (this.originAxisX_Visible || this.originAxisZ_Visible);
        this._originAxisVerticalMeshComp.node.active = this.originAxisY_Visible;
        void this.initOriginAxisFromConfig();
    }
    async initOriginAxisFromConfig() {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            const gizmos = await rpc.request('sceneConfigInstance', 'get', ['gizmo']);
            if (gizmos?.originAxis3D) {
                this.updateOriginAxisByConfig(gizmos.originAxis3D, false);
            }
        }
        catch {
            // Use the default 3D origin axes when config is unavailable.
        }
    }
    updateOriginAxisByConfig(config, update = true) {
        if (config.x !== undefined)
            this.originAxisX_Visible = config.x;
        if (config.y !== undefined)
            this.originAxisY_Visible = config.y;
        if (config.z !== undefined)
            this.originAxisZ_Visible = config.z;
        if (this._originAxisHorizontalMeshComp?.node) {
            this._originAxisHorizontalMeshComp.node.active = !!this._gridMeshComp?.node?.active && (this.originAxisX_Visible || this.originAxisZ_Visible);
        }
        if (this._originAxisVerticalMeshComp?.node) {
            this._originAxisVerticalMeshComp.node.active = !!this._gridMeshComp?.node?.active && this.originAxisY_Visible;
        }
        if (update) {
            this.updateOriginAxis();
        }
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    getOriginAxisData() {
        const cameraPos = new cc_1.Vec3();
        this.node.getPosition(cameraPos);
        const distance = cameraPos.y;
        const scale = distance / 500;
        const range = 5000;
        const scaleRange = (range * scale) | 0;
        const curStartX = -scaleRange + cameraPos.x;
        const curEndX = scaleRange + cameraPos.x;
        const curStartY = -scaleRange + cameraPos.z;
        const curEndY = scaleRange + cameraPos.z;
        this.hTicks?.range(curStartX, curEndX, range);
        this.vTicks?.range(curStartY, curEndY, range);
        return {
            startX: curStartX,
            endX: curEndX,
            startY: curStartY,
            endY: curEndY,
            cameraPos,
        };
    }
    updateOriginAxisVertical() {
        const { startY, endY, cameraPos } = this.getOriginAxisData();
        const positions = [];
        const colors = [];
        const indices = [];
        if (this.originAxisY_Visible) {
            positions.push(0, cameraPos.z);
            positions.push(0, startY);
            positions.push(0, cameraPos.z);
            positions.push(0, endY);
            const c = this.originAxisY_Color;
            for (let i = 0; i < 4; i++) {
                colors.push(c.x, c.y, c.z, c.w);
            }
            for (let i = 0; i < positions.length; i += 2) {
                indices.push(i / 2);
            }
            utils_1.CameraUtils.updateVBAttr(this._originAxisVerticalMeshComp, cc_1.gfx.AttributeName.ATTR_POSITION, positions);
            utils_1.CameraUtils.updateVBAttr(this._originAxisVerticalMeshComp, cc_1.gfx.AttributeName.ATTR_COLOR, colors);
            utils_1.CameraUtils.updateIB(this._originAxisVerticalMeshComp, indices);
        }
    }
    updateOriginAxisHorizontal() {
        const { startY, endY, startX, endX, cameraPos } = this.getOriginAxisData();
        const positions = [];
        const colors = [];
        const indices = [];
        if (this.originAxisX_Visible) {
            positions.push(0, cameraPos.z);
            positions.push(0, startY);
            positions.push(0, cameraPos.z);
            positions.push(0, endY);
            const c = this.originAxisX_Color;
            for (let i = 0; i < 4; i++) {
                colors.push(c.x, c.y, c.z, c.w);
            }
        }
        if (this.originAxisZ_Visible) {
            positions.push(cameraPos.x, 0);
            positions.push(startX, 0);
            positions.push(cameraPos.x, 0);
            positions.push(endX, 0);
            const c = this.originAxisZ_Color;
            for (let i = 0; i < 4; i++) {
                colors.push(c.x, c.y, c.z, c.w);
            }
        }
        if (positions.length > 0) {
            for (let i = 0; i < positions.length; i += 2) {
                indices.push(i / 2);
            }
            utils_1.CameraUtils.updateVBAttr(this._originAxisHorizontalMeshComp, cc_1.gfx.AttributeName.ATTR_POSITION, positions);
            utils_1.CameraUtils.updateVBAttr(this._originAxisHorizontalMeshComp, cc_1.gfx.AttributeName.ATTR_COLOR, colors);
            utils_1.CameraUtils.updateIB(this._originAxisHorizontalMeshComp, indices);
        }
    }
    updateOriginAxis() {
        this.updateOriginAxisHorizontal();
        this.updateOriginAxisVertical();
    }
    // ---------- 模式状态机 ----------
    _initMode() {
        this._idleMode = new idle_mode_1.default(this);
        this._orbitMode = new orbit_mode_1.default(this);
        this._panMode = new pan_mode_1.default(this);
        this._wanderMode = new wander_mode_1.default(this);
        this._modeFSM = new finite_state_machine_1.default([this._idleMode, this._orbitMode, this._panMode, this._wanderMode]);
        this._modeFSM.addTransition(this._idleMode, this._orbitMode, ModeCommand.ToOrbit);
        this._modeFSM.addTransition(this._idleMode, this._panMode, ModeCommand.ToPan);
        this._modeFSM.addTransition(this._idleMode, this._wanderMode, ModeCommand.ToWander);
        this._modeFSM.addTransition(this._orbitMode, this._idleMode, ModeCommand.ToIdle);
        this._modeFSM.addTransition(this._orbitMode, this._panMode, ModeCommand.ToPan);
        this._modeFSM.addTransition(this._orbitMode, this._wanderMode, ModeCommand.ToWander);
        this._modeFSM.addTransition(this._panMode, this._idleMode, ModeCommand.ToIdle);
        this._modeFSM.addTransition(this._panMode, this._orbitMode, ModeCommand.ToOrbit);
        this._modeFSM.addTransition(this._panMode, this._wanderMode, ModeCommand.ToWander);
        this._modeFSM.addTransition(this._wanderMode, this._idleMode, ModeCommand.ToIdle);
        this._modeFSM.addTransition(this._wanderMode, this._orbitMode, ModeCommand.ToOrbit);
        this._modeFSM.addTransition(this._wanderMode, this._panMode, ModeCommand.ToPan);
        this._modeFSM.Begin(this._idleMode);
    }
    _initLinearTick() {
        this.hTicks = new linear_ticks_1.default().initTicks([5, 2], 1, 10000).spacing(15, 80);
        this.vTicks = new linear_ticks_1.default().initTicks([5, 2], 1, 10000).spacing(15, 80);
    }
    // ---------- active ----------
    set active(value) {
        if (value) {
            this._camera.projection = 1;
            this.node.setWorldPosition(this._curEye);
            this.node.setWorldRotation(this._curRot);
            this._camera.far = this.far;
            this._camera.near = this.near;
        }
        else {
            this.node.getWorldPosition(this._curEye);
            this.node.getWorldRotation(this._curRot);
        }
        this.showGrid(value);
    }
    // ---------- 模式切换 ----------
    changeMode(modeCommand) {
        if (!this._modeFSM)
            return;
        this._modeFSM.issueCommand(modeCommand);
        let mode = utils_1.CameraMoveMode.IDLE;
        switch (modeCommand) {
            case ModeCommand.ToIdle:
                mode = utils_1.CameraMoveMode.IDLE;
                break;
            case ModeCommand.ToOrbit:
                mode = utils_1.CameraMoveMode.ORBIT;
                break;
            case ModeCommand.ToPan:
                mode = utils_1.CameraMoveMode.PAN;
                break;
            case ModeCommand.ToWander:
                mode = utils_1.CameraMoveMode.WANDER;
                break;
        }
        this.emit('mode', mode);
    }
    // ---------- 重置 ----------
    reset() {
        this.node.setWorldPosition(this.homePos);
        this.node.setWorldRotation(this.homeRot);
        this.node.getWorldRotation(this._curRot);
        this.node.getWorldPosition(this._curEye);
        this.node.updateWorldTransform?.();
    }
    // ---------- viewCenter ----------
    updateViewCenterByDist(viewDist) {
        this.node.getWorldPosition(this._curEye);
        this.node.getWorldRotation(this._curRot);
        cc_1.Vec3.transformQuat(this.forward, cc_1.Vec3.UNIT_Z, this._curRot);
        cc_1.Vec3.multiplyScalar(this.v3a, this.forward, viewDist);
        cc_1.Vec3.add(this._sceneViewCenter, this._curEye, this.v3a);
    }
    // ---------- 缩放 ----------
    scale(delta) {
        let scalar = this.viewDist;
        if (Math.abs(scalar) < this._minScalar) {
            scalar = 1;
        }
        if (this.isOrtho()) {
            let newOrthoHeight = this._camera.orthoHeight;
            newOrthoHeight += delta * this._wheelSpeed * scalar * this._orthoScale;
            this.setOrthoHeight(newOrthoHeight);
        }
        else {
            delta = this.smoothScale(delta);
            this.node.getWorldPosition(this._curEye);
            this.node.getWorldRotation(this._curRot);
            cc_1.Vec3.transformQuat(this.forward, cc_1.Vec3.UNIT_Z, this._curRot);
            cc_1.Vec3.multiplyScalar(this.v3a, this.forward, delta * this._wheelSpeed * scalar);
            cc_1.Vec3.add(this._curEye, this._curEye, this.v3a);
            makeVec3InRange(this._curEye, -1e12, 1e12);
            this.viewDist = cc_1.Vec3.distance(this._curEye, this._sceneViewCenter);
            this.node.setWorldPosition(this._curEye);
        }
        this.updateGrid();
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    smoothScale(delta) {
        return smoothMouseWheelScale(delta);
    }
    // ---------- 焦点 ----------
    focusByNode(nodes, notChangeDist = true, immediate = false) {
        if (nodes.length === 0)
            return;
        let worldPos = cc_1.Vec3.ZERO;
        const pivot = decorator_1.Service.Gizmo?.transformToolData?.pivot ?? 'center';
        if (pivot === 'center') {
            worldPos = getCenterWorldPos3D(nodes);
        }
        else {
            worldPos = getWorldPosition3D(nodes[nodes.length - 1]);
        }
        const maxRange = getMaxRangeOfNodes(nodes);
        let dist = this.viewDist;
        if (!notChangeDist) {
            if (this._camera.projection === PERSPECTIVE) {
                const A = new cc_1.Vec3(0, 0, 1);
                const length = Math.min(this._camera.camera.width, this._camera.camera.height) / 2;
                const B = new cc_1.Vec3(length, 0, 1);
                const worldA = new cc_1.Vec3(0, 0, 0);
                this._camera?.screenToWorld(A, worldA);
                const worldB = new cc_1.Vec3(0, 0, 0);
                this._camera?.screenToWorld(B, worldB);
                const disWorld = worldA.subtract(worldB).length();
                dist = Math.max((maxRange / length) * disWorld, this.near * 1.3);
                dist = Math.min(dist, this.far * 0.9);
            }
            else if (this._camera.projection === ORTHO) {
                const depthSize = (this._camera.fov / 180) * Math.PI * this._camera.orthoHeight;
                dist = ((maxRange * depthSize) / this._camera.orthoHeight) * 13;
                let angle = this._camera.node.eulerAngles.x % 360;
                angle = Math.abs(angle) > 90 ? 180 - Math.abs(angle) : Math.abs(angle);
                dist = dist / Math.cos((angle / 180) * Math.PI);
            }
        }
        this.sceneViewCenter = worldPos;
        this.node.getRotation(this._curRot);
        cc_1.Vec3.transformQuat(this.forward, cc_1.Vec3.UNIT_Z, this._curRot);
        cc_1.Vec3.multiplyScalar(this.v3c, this.forward, dist);
        cc_1.Vec3.add(this.v3d, worldPos, this.v3c);
        if (this.isOrtho()) {
            const depthSize = this.getDepthSize();
            const newOrthoHeight = depthSize * dist;
            if (immediate) {
                this._camera.orthoHeight = newOrthoHeight;
                if (decorator_1.Service.Gizmo?.transformToolData) {
                    decorator_1.Service.Gizmo.transformToolData.cameraOrthoHeight = newOrthoHeight;
                }
                decorator_1.Service.Engine?.repaintInEditMode?.();
            }
            else {
                (0, tween_1.tweenNumber)(this._camera.orthoHeight, newOrthoHeight, 300).step((orthoHeight) => {
                    if (this._camera) {
                        this._camera.orthoHeight = orthoHeight;
                        if (decorator_1.Service.Gizmo?.transformToolData) {
                            decorator_1.Service.Gizmo.transformToolData.cameraOrthoHeight = orthoHeight;
                        }
                        decorator_1.Service.Engine?.repaintInEditMode?.();
                    }
                });
            }
        }
        if (immediate) {
            this.node.setPosition(this.v3d);
            cc_1.Vec3.copy(this._curEye, this.v3d);
            this.viewDist = cc_1.Vec3.distance(this.v3d, this._sceneViewCenter);
            this.updateGrid();
            decorator_1.Service.Engine?.repaintInEditMode?.();
        }
        else {
            const startPosition = this.node.getPosition();
            (0, tween_1.tweenPosition)(startPosition, this.v3d, 300).step((position) => {
                this.node.setPosition(position);
                cc_1.Vec3.copy(this._curEye, position);
                this.viewDist = cc_1.Vec3.distance(position, this._sceneViewCenter);
                this.updateGrid();
                decorator_1.Service.Engine?.repaintInEditMode?.();
            });
        }
    }
    focus(nodeUuids, editorCameraInfo, immediate = false) {
        if (this.isMoving())
            return;
        if (!this._camera?.camera)
            return;
        if (editorCameraInfo) {
            const startPosition = this.node.getPosition();
            const startRotation = this.node.getRotation();
            const { position, rotation, viewCenter } = editorCameraInfo;
            if (position) {
                this._curEye.x = position.x || 0;
                this._curEye.y = position.y || 0;
                this._curEye.z = position.z || 0;
            }
            else {
                this._curEye.x = this.homePos.x || 0;
                this._curEye.y = this.homePos.y || 0;
                this._curEye.z = this.homePos.z || 0;
            }
            if (rotation) {
                this._curRot.x = rotation.x || 0;
                this._curRot.y = rotation.y || 0;
                this._curRot.z = rotation.z || 0;
                this._curRot.w = rotation.w || 0;
            }
            else {
                this._curRot.x = this.homeRot.x || 0;
                this._curRot.y = this.homeRot.y || 0;
                this._curRot.z = this.homeRot.z || 0;
                this._curRot.w = this.homeRot.w || 0;
            }
            this.sceneViewCenter = viewCenter || new cc_1.Vec3();
            this.viewDist = cc_1.Vec3.distance(this._curEye, this._sceneViewCenter);
            if (immediate) {
                this.node.setPosition(this._curEye);
                this.node.setRotation(this._curRot);
                this.updateGrid();
                decorator_1.Service.Engine?.repaintInEditMode?.();
            }
            else {
                (0, tween_1.tweenPosition)(startPosition, this._curEye, 300).step((position) => {
                    this.node.setPosition(position);
                    this.updateGrid();
                    decorator_1.Service.Engine?.repaintInEditMode?.();
                });
                (0, tween_1.tweenRotation)(startRotation, this._curRot, 300).step((rotation) => {
                    this.node.setRotation(rotation);
                    this.updateGrid();
                });
            }
        }
        else if (nodeUuids && nodeUuids.length > 0) {
            const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
            if (!EditorExtends)
                return;
            const nodes = [];
            for (const uuid of nodeUuids) {
                const node = EditorExtends.Node.getNode(uuid);
                if (node)
                    nodes.push(node);
            }
            if (nodes.length === 0)
                return;
            this.lastFocusNodeUUID = nodeUuids.slice();
            this.focusByNode(nodes, false, immediate);
        }
    }
    focusByXY(hitPoint, immediate = false) {
        if (this.isMoving())
            return;
        if (!this._camera?.camera)
            return;
        const node = new cc_1.Node();
        node.position.set(hitPoint);
        this.focusByNode([node], true, immediate);
    }
    // ---------- 对齐 ----------
    async alignNodeToSceneView(nodeUuids) {
        if (!nodeUuids || nodeUuids.length === 0)
            return;
        const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
        if (!EditorExtends)
            return;
        const nodes = [];
        for (const uuid of nodeUuids) {
            const node = EditorExtends.Node.getNode(uuid);
            if (node)
                nodes.push(node);
        }
        if (nodes.length === 0)
            return;
        const uuids = nodes.map(node => node.uuid);
        const undoId = await decorator_1.Service.Undo?.beginRecording?.(uuids);
        const baseNode = nodes[0];
        const oldBaseWorldMatrix = cc_1.Mat4.fromRT(new cc_1.Mat4(), baseNode.getWorldRotation(), baseNode.getWorldPosition());
        cc_1.Mat4.invert(oldBaseWorldMatrix, oldBaseWorldMatrix);
        const oldBaseRotInv = baseNode.getWorldRotation();
        cc_1.Quat.invert(oldBaseRotInv, oldBaseRotInv);
        const cameraPos = this.node.getWorldPosition();
        const cameraRot = this.node.getWorldRotation();
        const newBaseMatrix = cc_1.Mat4.fromRT(new cc_1.Mat4(), cameraRot, cameraPos);
        baseNode.setWorldPosition(cameraPos);
        baseNode.setWorldRotation(cameraRot);
        this.alignCameraOrthoHeightToNode(baseNode.getComponents(cc_1.Camera));
        if (nodes.length > 1) {
            for (let i = 1; i < nodes.length; i++) {
                const node = nodes[i];
                const pos = node.getWorldPosition();
                const rot = node.getWorldRotation();
                cc_1.Vec3.transformMat4(pos, pos, oldBaseWorldMatrix);
                cc_1.Quat.multiply(rot, oldBaseRotInv, rot);
                cc_1.Vec3.transformMat4(pos, pos, newBaseMatrix);
                node.setWorldPosition(pos);
                cc_1.Quat.multiply(rot, cameraRot, rot);
                node.setWorldRotation(rot);
                this.alignCameraOrthoHeightToNode(node.getComponents(cc_1.Camera));
            }
        }
        if (undoId)
            await decorator_1.Service.Undo?.endRecording?.(undoId);
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    alignCameraOrthoHeightToNode(cameraComponent) {
        if (cameraComponent.length === 1) {
            const camera = cameraComponent[0];
            if (camera && camera.projection === ORTHO) {
                camera.orthoHeight = this._camera.orthoHeight;
            }
        }
    }
    alignSceneViewToNode(nodeUuids) {
        if (!nodeUuids || nodeUuids.length === 0)
            return;
        const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
        if (!EditorExtends)
            return;
        const nodes = [];
        for (const uuid of nodeUuids) {
            const node = EditorExtends.Node.getNode(uuid);
            if (node)
                nodes.push(node);
        }
        if (nodes.length === 0)
            return;
        const baseNode = nodes[0];
        const pos = baseNode.getWorldPosition();
        const rot = baseNode.getWorldRotation();
        this.node.setWorldPosition(pos);
        this.node.setWorldRotation(rot);
        this.updateViewCenterByDist(-this.viewDist);
        this.updateGrid();
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    // ---------- 鼠标/键盘事件 ----------
    isMoving() {
        return this._modeFSM?.currentState !== this._idleMode;
    }
    onMouseDBlDown(event) {
        if (!this._modeFSM)
            return;
        const isViewMode = !!decorator_1.Service.Gizmo?.isViewMode;
        if (isViewMode) {
            const x = event.x;
            const y = getMainWindowSize().height - event.y;
            let results = (0, engine_utils_1.getRaycastResultsForSnap)(this._camera, x, y);
            results = results.filter(result => !(result.node.objFlags & cc_1.CCObject.Flags.HideInHierarchy));
            if (results.length > 0) {
                this.focusByXY(results[0].hitPoint);
            }
        }
        return this._modeFSM.currentState.onMouseDBlDown(event);
    }
    onMouseDown(event) {
        if (!this._modeFSM)
            return;
        this.altKey = event.altKey;
        this.shiftKey = event.shiftKey;
        this.mousePressing = true;
        const isViewMode = !!decorator_1.Service.Gizmo?.isViewMode;
        if (event.middleButton || (!event.rightButton && isViewMode)) {
            this.changeMode(ModeCommand.ToPan);
        }
        else if (event.rightButton && !event.leftButton) {
            this.changeMode(ModeCommand.ToWander);
        }
        else if (event.leftButton) {
            if (this._modeFSM.currentState.modeName === utils_1.CameraMoveMode.WANDER) {
                this.changeMode(ModeCommand.ToIdle);
            }
        }
        return this._modeFSM.currentState.onMouseDown(event);
    }
    onMouseMove(event) {
        if (!this._modeFSM)
            return;
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
        if (event.altKey) {
            if (this._modeFSM.currentState.modeName !== utils_1.CameraMoveMode.ORBIT) {
                this.changeMode(ModeCommand.ToOrbit);
            }
        }
        else {
            if (this._modeFSM.currentState.modeName === utils_1.CameraMoveMode.ORBIT) {
                this.changeMode(ModeCommand.ToIdle);
            }
        }
        return this._modeFSM.currentState.onMouseMove(event);
    }
    onMouseUp(event) {
        if (!this._modeFSM)
            return;
        this.mousePressing = false;
        const isViewMode = !!decorator_1.Service.Gizmo?.isViewMode;
        if (event.middleButton || (!event.rightButton && isViewMode)) {
            if (this._modeFSM.currentState.modeName === utils_1.CameraMoveMode.PAN) {
                this.changeMode(ModeCommand.ToIdle);
            }
        }
        else if (event.rightButton) {
            if (this._modeFSM.currentState.modeName === utils_1.CameraMoveMode.WANDER) {
                this.changeMode(ModeCommand.ToIdle);
            }
        }
        if (isViewMode) {
            this.changeMode(ModeCommand.ToIdle);
        }
        return this._modeFSM.currentState.onMouseUp(event);
    }
    onMouseWheel(event) {
        if (!this._modeFSM)
            return;
        if (this._modeFSM.currentState.modeName !== utils_1.CameraMoveMode.WANDER) {
            let deltaY = event.deltaY;
            if (Math.abs(deltaY - this.lastMouseWheelDeltaY) > this.maxMouseWheelDeltaY) {
                deltaY = this.lastMouseWheelDeltaY + Math.sign(deltaY) * this.maxMouseWheelDeltaY;
            }
            this.scale(deltaY * this._wheelBaseScale);
        }
        this._modeFSM.currentState.onMouseWheel(event);
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    onKeyDown(event) {
        if (!this._modeFSM)
            return;
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
        if (event.altKey) {
            if (this._modeFSM.currentState.modeName !== utils_1.CameraMoveMode.ORBIT) {
                this.changeMode(ModeCommand.ToOrbit);
            }
        }
        const key = event.key.toLowerCase();
        switch (key) {
            case ' ':
                this.changeMode(ModeCommand.ToPan);
                break;
        }
        this._modeFSM.currentState.onKeyDown(event);
    }
    onKeyUp(event) {
        if (!this._modeFSM)
            return;
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
        if (!event.altKey && !this.mousePressing) {
            if (this._modeFSM.currentState.modeName === utils_1.CameraMoveMode.ORBIT) {
                this.changeMode(ModeCommand.ToIdle);
            }
        }
        const key = event.key.toLowerCase();
        switch (key) {
            case ' ':
                if (this._modeFSM.currentState.modeName === utils_1.CameraMoveMode.PAN) {
                    this.changeMode(ModeCommand.ToIdle);
                }
                break;
            case 'h':
                this.focus();
                break;
        }
        this._modeFSM.currentState.onKeyUp(event);
    }
    onUpdate(deltaTime) {
        if (!this._modeFSM)
            return;
        this._modeFSM.currentState.onUpdate(deltaTime);
    }
    onResize(size) {
        this.updateGrid();
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    // ---------- 网格 ----------
    _updateGridData(positions, colors, lineColor) {
        const cameraPos = new cc_1.Vec3();
        this.node.getPosition(cameraPos);
        const distance = cameraPos.y;
        const scale = distance / 500;
        const range = 5000;
        const scaleRange = (range * scale) | 0;
        const curStartX = -scaleRange + cameraPos.x;
        const curEndX = scaleRange + cameraPos.x;
        const curStartY = -scaleRange + cameraPos.z;
        const curEndY = scaleRange + cameraPos.z;
        this.hTicks.range(curStartX, curEndX, range);
        this.vTicks.range(curStartY, curEndY, range);
        const r = lineColor.r / 255;
        const g = lineColor.g / 255;
        const b = lineColor.b / 255;
        const lineOpacity = 200 / 255;
        for (let i = this.hTicks.minTickLevel; i <= this.hTicks.maxTickLevel; ++i) {
            const ratio = this.hTicks.tickRatios[i];
            if (ratio > 0) {
                const ticks = this.hTicks.ticksAtLevel(i, true);
                for (let j = 0; j < ticks.length; ++j) {
                    const tick = ticks[j];
                    if (this.originAxisX_Visible && 0 === tick)
                        continue;
                    if (positions.length / 2 >= _maxTicks * _maxTicks - 4)
                        break;
                    let alpha = ratio * lineOpacity;
                    const dist = Math.abs(tick - cameraPos.x);
                    if (scaleRange > 0)
                        alpha *= 1 - dist / scaleRange;
                    positions.push(tick, cameraPos.z);
                    positions.push(tick, curStartY);
                    positions.push(tick, cameraPos.z);
                    positions.push(tick, curEndY);
                    colors.push(r, g, b, alpha);
                    colors.push(r, g, b, 0);
                    colors.push(r, g, b, alpha);
                    colors.push(r, g, b, 0);
                }
            }
        }
        for (let i = this.vTicks.minTickLevel; i <= this.vTicks.maxTickLevel; ++i) {
            const ratio = this.vTicks.tickRatios[i];
            if (ratio > 0) {
                const ticks = this.vTicks.ticksAtLevel(i, true);
                for (let j = 0; j < ticks.length; ++j) {
                    const tick = ticks[j];
                    if (this.originAxisZ_Visible && 0 === tick)
                        continue;
                    if (positions.length / 2 >= _maxTicks * _maxTicks - 4)
                        break;
                    let alpha = ratio * lineOpacity;
                    const dist = Math.abs(tick - cameraPos.z);
                    if (scaleRange > 0)
                        alpha *= 1 - dist / scaleRange;
                    positions.push(cameraPos.x, tick);
                    positions.push(curStartX, tick);
                    positions.push(cameraPos.x, tick);
                    positions.push(curEndX, tick);
                    colors.push(r, g, b, alpha);
                    colors.push(r, g, b, 0);
                    colors.push(r, g, b, alpha);
                    colors.push(r, g, b, 0);
                }
            }
        }
    }
    updateGrid() {
        if (!this._gridMeshComp)
            return;
        const positions = [];
        const colors = [];
        const indices = [];
        this._updateGridData(positions, colors, this._lineColor);
        if (positions.length > 0) {
            for (let i = 0; i < positions.length; i += 2) {
                indices.push(i / 2);
            }
            utils_1.CameraUtils.updateVBAttr(this._gridMeshComp, cc_1.gfx.AttributeName.ATTR_POSITION, positions);
            utils_1.CameraUtils.updateVBAttr(this._gridMeshComp, cc_1.gfx.AttributeName.ATTR_COLOR, colors);
            utils_1.CameraUtils.updateIB(this._gridMeshComp, indices);
        }
        this.updateOriginAxis();
    }
    refresh() {
        this.updateGrid();
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    // ---------- 旋转相机到指定方向 ----------
    rotateCameraToDir(dir, rotateByViewDist) {
        const startPosition = new cc_1.Vec3();
        const startRotation = new cc_1.Quat();
        this.node.getPosition(startPosition);
        this.node.getRotation(startRotation);
        cc_1.Quat.rotationTo(this._curRot, cc_1.Vec3.UNIT_Z, dir);
        const offset = new cc_1.Vec3();
        if (rotateByViewDist) {
            offset.z = this.viewDist;
            cc_1.Vec3.transformQuat(offset, offset, this._curRot);
            cc_1.Vec3.add(this._curEye, this._sceneViewCenter, offset);
        }
        (0, tween_1.tweenPosition)(startPosition, this._curEye, 300).step((position) => {
            this.node.setPosition(position);
            this.updateGrid();
            decorator_1.Service.Engine?.repaintInEditMode?.();
        });
        (0, tween_1.tweenRotation)(startRotation, this._curRot, 300).step((rotation) => {
            this.node.setRotation(rotation);
            this.updateGrid();
        });
    }
    // ---------- 投影相关 ----------
    getDepthSize() {
        const fov = this._camera.fov;
        return Math.tan(((fov / 2) * Math.PI) / 180);
    }
    calcCameraPosInOrtho() {
        const depthSize = this.getDepthSize();
        const minDist = this._camera.orthoHeight / depthSize;
        if (this.viewDist < minDist) {
            this.viewDist = minDist;
        }
        this.node.getWorldRotation(this._curRot);
        cc_1.Vec3.transformQuat(this.forward, cc_1.Vec3.UNIT_Z, this._curRot);
        cc_1.Vec3.normalize(this.forward, this.forward);
        cc_1.Vec3.multiplyScalar(this.v3a, this.forward, this.viewDist);
        cc_1.Vec3.add(this.v3b, this._sceneViewCenter, this.v3a);
        return this.v3b;
    }
    isOrtho() {
        return this._camera.projection === ORTHO;
    }
    setOrthoHeight(newOrthoHeight) {
        if (newOrthoHeight < 0) {
            newOrthoHeight = 0.01;
        }
        this._camera.orthoHeight = newOrthoHeight;
        if (decorator_1.Service.Gizmo?.transformToolData) {
            decorator_1.Service.Gizmo.transformToolData.cameraOrthoHeight = newOrthoHeight;
        }
    }
    changeProjection() {
        if (this.isOrtho()) {
            const cameraPos = this.calcCameraPosInOrtho();
            this.node.setWorldPosition(cameraPos);
            this._camera.projection = PERSPECTIVE;
            this.emit('projection-changed', PERSPECTIVE);
            this.updateGrid();
        }
        else {
            this._camera.projection = ORTHO;
            const depthSize = this.getDepthSize();
            const newOrthoHeight = depthSize * this.viewDist;
            this.setOrthoHeight(newOrthoHeight);
            this.emit('projection-changed', ORTHO);
        }
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    // ---------- 缩放快捷键 ----------
    zoomUp() {
        this.scale(20);
    }
    zoomDown() {
        this.scale(-20);
    }
    zoomReset() {
        this.reset();
    }
    onDesignResolutionChange() {
        this.updateGrid();
    }
}
exports.CameraController3D = CameraController3D;
exports.default = CameraController3D;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FtZXJhLWNvbnRyb2xsZXItM2QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvY2FtZXJhL2NhbWVyYS1jb250cm9sbGVyLTNkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQXdZQSxzREFFQztBQTFZRCwyQkFBK0g7QUFDL0gsc0ZBQWtGO0FBQ2xGLG1DQUFzRDtBQUN0RCx1R0FBNkU7QUFDN0UsdUVBQThDO0FBQzlDLG1DQUFvRTtBQUNwRSxrRUFBeUM7QUFDekMsb0VBQTJDO0FBQzNDLGdFQUF1QztBQUN2QyxzRUFBNkM7QUFHN0MsaURBQTRDO0FBQzVDLDhEQUF1RTtBQUN2RSxtQ0FBZ0M7QUFFaEMsNkNBQTZDO0FBRTdDLE1BQU0sVUFBVSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFFOUIsU0FBUyxVQUFVLENBQUMsUUFBZ0I7SUFDaEMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckQsQ0FBQztBQUVELFNBQVMsaUJBQWlCO0lBQ3RCLE1BQU0sTUFBTSxHQUFJLEVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO0lBQ3hDLE9BQU87UUFDSCxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssSUFBSSxJQUFJO1FBQzVCLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxJQUFJLEdBQUc7S0FDaEMsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxHQUFTLEVBQUUsSUFBUyxFQUFFLEtBQW1CLEVBQUUsS0FBbUIsRUFBRSxLQUFtQixFQUFFLEtBQW1CO0lBQzVILE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDakIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNqQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3pCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7SUFFM0IsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQztJQUMvQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO0lBQy9DLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQzNCLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQzNCLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDO0lBQzVCLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDO0lBRTVCLEtBQUssR0FBRyxLQUFLLElBQUksSUFBSSxTQUFJLEVBQUUsQ0FBQztJQUM1QixLQUFLLEdBQUcsS0FBSyxJQUFJLElBQUksU0FBSSxFQUFFLENBQUM7SUFDNUIsS0FBSyxHQUFHLEtBQUssSUFBSSxJQUFJLFNBQUksRUFBRSxDQUFDO0lBQzVCLEtBQUssR0FBRyxLQUFLLElBQUksSUFBSSxTQUFJLEVBQUUsQ0FBQztJQUU1QixLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNiLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2IsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNsQixLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDbEIsS0FBSyxDQUFDLENB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QUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMxQixTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0IsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFeEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzNCLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQixTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQixTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFeEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUs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QUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ3BDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEIsSUFBSSxJQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxLQUFLLElBQUk7d0JBQUUsU0FBUztvQkFDckQsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsU0FBUyxHQUFHLENBQUM7d0JBQUUsTUFBTTtvQkFFN0QsSUFBSSxLQUFLLEdBQUcsS0FBSyxHQUFHLFdBQVcsQ0FBQztvQkFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQyxJQUFJLFVBQVUsR0FBRyxDQUFDO3dCQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLFVBQVUsQ0FBQztvQkFFbkQsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDaEMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFB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QyxvQkFBb0IsRUFBRSxDQUFDO1lBQzlDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3RCLENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ2hDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN0QyxNQUFNLGNBQWMsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNqRCxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELG1CQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQsOEJBQThCO0lBRTlCLE1BQU07UUFDRixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxRQUFRO1FBQ0osSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxTQUFTO1FBQ0wsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRCx3QkFBd0I7UUFDcEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3RCLENBQUM7Q0FDSjtBQXQ3QkQsZ0RBczdCQztBQUVELGtCQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2FtZXJhLCBDQ09iamVjdCwgQ29sb3IsIGdlb21ldHJ5LCBnZngsIGpzLCBMYXllcnMsIE1hdDQsIE1lc2hSZW5kZXJlciwgTm9kZSwgUXVhdCwgVmVjMiwgVmVjMywgSVNpemVMaWtlIH0gZnJvbSAnY2MnO1xuaW1wb3J0IENhbWVyYUNvbnRyb2xsZXJCYXNlLCB7IEVkaXRvckNhbWVyYUluZm8gfSBmcm9tICcuL2NhbWVyYS1jb250cm9sbGVyLWJhc2UnO1xuaW1wb3J0IHsgQ2FtZXJhTW92ZU1vZGUsIENhbWVyYVV0aWxzIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgRmluaXRlU3RhdGVNYWNoaW5lIGZyb20gJy4uL3V0aWxzL3N0YXRlLW1hY2hpbmUvZmluaXRlLXN0YXRlLW1hY2hpbmUnO1xuaW1wb3J0IExpbmVhclRpY2tzIGZyb20gJy4vZ3JpZC9saW5lYXItdGlja3MnO1xuaW1wb3J0IHsgdHdlZW5OdW1iZXIsIHR3ZWVuUG9zaXRpb24sIHR3ZWVuUm90YXRpb24gfSBmcm9tICcuL3R3ZWVuJztcbmltcG9ydCBJZGxlTW9kZSBmcm9tICcuL21vZGVzL2lkbGUtbW9kZSc7XG5pbXBvcnQgT3JiaXRNb2RlIGZyb20gJy4vbW9kZXMvb3JiaXQtbW9kZSc7XG5pbXBvcnQgUGFuTW9kZSBmcm9tICcuL21vZGVzL3Bhbi1tb2RlJztcbmltcG9ydCBXYW5kZXJNb2RlIGZyb20gJy4vbW9kZXMvd2FuZGVyLW1vZGUnO1xuaW1wb3J0IHR5cGUgTW9kZUJhc2UzRCBmcm9tICcuL21vZGVzL21vZGUtYmFzZS0zZCc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZU1vdXNlRXZlbnQsIElTY2VuZUtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi9vcGVyYXRpb24vdHlwZXMnO1xuaW1wb3J0IHsgU2VydmljZSB9IGZyb20gJy4uL2NvcmUvZGVjb3JhdG9yJztcbmltcG9ydCB7IGdldFJheWNhc3RSZXN1bHRzRm9yU25hcCB9IGZyb20gJy4uL2dpem1vL3V0aWxzL2VuZ2luZS11dGlscyc7XG5pbXBvcnQgeyBScGMgfSBmcm9tICcuLi8uLi9ycGMnO1xuXG4vLyAtLS0tLS0tLS0tIG5vZGUgdXRpbGl0eSBoZWxwZXJzIC0tLS0tLS0tLS1cblxuY29uc3QgdGVtcE1hdHJpeCA9IG5ldyBNYXQ0KCk7XG5cbmZ1bmN0aW9uIGxpbWl0UmFuZ2UoZGlzdGFuY2U6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KGRpc3RhbmNlLCAtMWUxMCksIDFlMTApO1xufVxuXG5mdW5jdGlvbiBnZXRNYWluV2luZG93U2l6ZSgpOiBJU2l6ZUxpa2Uge1xuICAgIGNvbnN0IGNhbnZhcyA9IChjYyBhcyBhbnkpLmdhbWU/LmNhbnZhcztcbiAgICByZXR1cm4ge1xuICAgICAgICB3aWR0aDogY2FudmFzPy53aWR0aCA/PyAxMjgwLFxuICAgICAgICBoZWlnaHQ6IGNhbnZhcz8uaGVpZ2h0ID8/IDcyMCxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRPYmJGcm9tUmVjdChtYXQ6IE1hdDQsIHJlY3Q6IGFueSwgb3V0Qkw/OiBWZWMyIHwgbnVsbCwgb3V0VEw/OiBWZWMyIHwgbnVsbCwgb3V0VFI/OiBWZWMyIHwgbnVsbCwgb3V0QlI/OiBWZWMyIHwgbnVsbCk6IFZlYzJbXSB7XG4gICAgY29uc3QgeCA9IHJlY3QueDtcbiAgICBjb25zdCB5ID0gcmVjdC55O1xuICAgIGNvbnN0IHdpZHRoID0gcmVjdC53aWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSByZWN0LmhlaWdodDtcblxuICAgIGNvbnN0IHR4ID0gbWF0Lm0wMCAqIHggKyBtYXQubTA0ICogeSArIG1hdC5tMTI7XG4gICAgY29uc3QgdHkgPSBtYXQubTAxICogeCArIG1hdC5tMDUgKiB5ICsgbWF0Lm0xMztcbiAgICBjb25zdCB4YSA9IG1hdC5tMDAgKiB3aWR0aDtcbiAgICBjb25zdCB4YiA9IG1hdC5tMDEgKiB3aWR0aDtcbiAgICBjb25zdCB5YyA9IG1hdC5tMDQgKiBoZWlnaHQ7XG4gICAgY29uc3QgeWQgPSBtYXQubTA1ICogaGVpZ2h0O1xuXG4gICAgb3V0QkwgPSBvdXRCTCB8fCBuZXcgVmVjMigpO1xuICAgIG91dFRMID0gb3V0VEwgfHwgbmV3IFZlYzIoKTtcbiAgICBvdXRUUiA9IG91dFRSIHx8IG5ldyBWZWMyKCk7XG4gICAgb3V0QlIgPSBvdXRCUiB8fCBuZXcgVmVjMigpO1xuXG4gICAgb3V0VEwueCA9IHR4O1xuICAgIG91dFRMLnkgPSB0eTtcbiAgICBvdXRUUi54ID0geGEgKyB0eDtcbiAgICBvdXRUUi55ID0geGIgKyB0eTtcbiAgICBvdXRCTC54ID0geWMgKyB0eDtcbiAgICBvdXRCTC55ID0geWQgKyB0eTtcbiAgICBvdXRCUi54ID0geGEgKyB5YyArIHR4O1xuICAgIG91dEJSLnkgPSB4YiArIHlkICsgdHk7XG5cbiAgICByZXR1cm4gW291dEJMLCBvdXRUTCwgb3V0VFIsIG91dEJSXTtcbn1cblxuZnVuY3Rpb24gZ2V0T2JiRnJvbUJvdW5kKGFhYmI6IGdlb21ldHJ5LkFBQkIpOiBWZWMzW10ge1xuICAgIGNvbnN0IG1pblBvcyA9IG5ldyBWZWMzKCk7XG4gICAgY29uc3QgbWF4UG9zID0gbmV3IFZlYzMoKTtcbiAgICBhYWJiLmdldEJvdW5kYXJ5KG1pblBvcywgbWF4UG9zKTtcblxuICAgIHJldHVybiBbXG4gICAgICAgIG1pblBvcyxcbiAgICAgICAgbmV3IFZlYzMobWF4UG9zLngsIG1pblBvcy55LCBtaW5Qb3MueiksXG4gICAgICAgIG5ldyBWZWMzKG1heFBvcy54LCBtYXhQb3MueSwgbWluUG9zLnopLFxuICAgICAgICBuZXcgVmVjMyhtaW5Qb3MueCwgbWF4UG9zLnksIG1pblBvcy56KSxcbiAgICAgICAgbWF4UG9zLFxuICAgICAgICBuZXcgVmVjMyhtaW5Qb3MueCwgbWF4UG9zLnksIG1heFBvcy56KSxcbiAgICAgICAgbmV3IFZlYzMobWluUG9zLngsIG1pblBvcy55LCBtYXhQb3MueiksXG4gICAgICAgIG5ldyBWZWMzKG1heFBvcy54LCBtaW5Qb3MueSwgbWF4UG9zLnopLFxuICAgIF07XG59XG5cbmZ1bmN0aW9uIGdldE9iYkZyb21NZXNoUmVuZGVyZXIobW9kZWxDb21wOiBNZXNoUmVuZGVyZXIsIG1hdDogTWF0NCk6IFZlYzNbXSB7XG4gICAgbW9kZWxDb21wLm1vZGVsPy51cGRhdGVXb3JsZEJvdW5kPy4oKTtcbiAgICBsZXQgd29ybGRCb3VuZCA9IG1vZGVsQ29tcC5tb2RlbD8ud29ybGRCb3VuZHM7XG4gICAgaWYgKCF3b3JsZEJvdW5kKSB7XG4gICAgICAgIHdvcmxkQm91bmQgPSBnZW9tZXRyeS5BQUJCLmNyZWF0ZSgpO1xuICAgICAgICBjb25zdCBtb2RlbEJvdW5kID0gbW9kZWxDb21wLm1vZGVsPy5tb2RlbEJvdW5kcztcbiAgICAgICAgaWYgKG1vZGVsQm91bmQpIHtcbiAgICAgICAgICAgIGdlb21ldHJ5LkFBQkIudHJhbnNmb3JtKHdvcmxkQm91bmQsIG1vZGVsQm91bmQsIG1hdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZW9tZXRyeS5BQUJCLnRyYW5zZm9ybSh3b3JsZEJvdW5kLCB3b3JsZEJvdW5kLCBNYXQ0LklERU5USVRZKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ2V0T2JiRnJvbUJvdW5kKHdvcmxkQm91bmQpO1xufVxuXG5mdW5jdGlvbiBnZXRPYmJGcm9tVUlUcmFuc2Zvcm0obW9kZWxDb21wOiBhbnksIG1hdDogTWF0NCk6IFZlYzNbXSB7XG4gICAgbGV0IHNpemUgPSAoY2MgYXMgYW55KS5zaXplKDAsIDApO1xuICAgIGxldCB3aWR0aCA9IHNpemUud2lkdGg7XG4gICAgbGV0IGhlaWdodCA9IHNpemUuaGVpZ2h0O1xuICAgIGNvbnN0IHJlY3QgPSBuZXcgKGNjIGFzIGFueSkuUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjb25zdCBvdXRCTCA9IG5ldyBWZWMyKCk7XG4gICAgY29uc3Qgb3V0VEwgPSBuZXcgVmVjMigpO1xuICAgIGNvbnN0IG91dFRSID0gbmV3IFZlYzIoKTtcbiAgICBjb25zdCBvdXRCUiA9IG5ldyBWZWMyKCk7XG4gICAgaWYgKG1vZGVsQ29tcCkge1xuICAgICAgICBzaXplID0gbW9kZWxDb21wLmNvbnRlbnRTaXplO1xuICAgICAgICB3aWR0aCA9IHNpemUud2lkdGg7XG4gICAgICAgIGhlaWdodCA9IHNpemUuaGVpZ2h0O1xuICAgICAgICBjb25zdCBhbmNob3IgPSBtb2RlbENvbXAuYW5jaG9yUG9pbnQ7XG5cbiAgICAgICAgcmVjdC54ID0gLWFuY2hvci54ICogd2lkdGg7XG4gICAgICAgIHJlY3QueSA9IC1hbmNob3IueSAqIGhlaWdodDtcbiAgICAgICAgcmVjdC53aWR0aCA9IHdpZHRoO1xuICAgICAgICByZWN0LmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG5cbiAgICBjb25zdCBib3VuZHMgPSBnZXRPYmJGcm9tUmVjdChtYXQsIHJlY3QsIG91dEJMLCBvdXRUTCwgb3V0VFIsIG91dEJSKTtcbiAgICBjb25zdCBwb3MgPSBnZXRXb3JsZFBvc2l0aW9uM0QobW9kZWxDb21wLm5vZGUpO1xuICAgIHJldHVybiBib3VuZHMubWFwKGl0ZW0gPT4gbmV3IFZlYzMoaXRlbS54LCBpdGVtLnksIHBvcy56KSk7XG59XG5cbmZ1bmN0aW9uIGdldFdvcmxkT3JpZW50ZWRCb3VuZHMobm9kZTogTm9kZSk6IFZlYzNbXSB7XG4gICAgbm9kZS5nZXRXb3JsZE1hdHJpeCh0ZW1wTWF0cml4KTtcblxuICAgIGNvbnN0IG1vZGVsQ29tcCA9IG5vZGUuZ2V0Q29tcG9uZW50KE1lc2hSZW5kZXJlcik7XG4gICAgaWYgKG1vZGVsQ29tcCkge1xuICAgICAgICByZXR1cm4gZ2V0T2JiRnJvbU1lc2hSZW5kZXJlcihtb2RlbENvbXAsIHRlbXBNYXRyaXgpO1xuICAgIH1cblxuICAgIGNvbnN0IFVJVHJhbnNmb3JtID0gKGNjIGFzIGFueSkuVUlUcmFuc2Zvcm07XG4gICAgY29uc3QgdWlDb21wID0gVUlUcmFuc2Zvcm0gPyBub2RlLmdldENvbXBvbmVudChVSVRyYW5zZm9ybSkgOiBudWxsO1xuICAgIGlmICh1aUNvbXApIHtcbiAgICAgICAgcmV0dXJuIGdldE9iYkZyb21VSVRyYW5zZm9ybSh1aUNvbXAsIHRlbXBNYXRyaXgpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY3QgPSBuZXcgKGNjIGFzIGFueSkuUmVjdCgwLCAwLCAwLCAwKTtcbiAgICBjb25zdCBib3VuZHMgPSBnZXRPYmJGcm9tUmVjdCh0ZW1wTWF0cml4LCByZWN0KTtcbiAgICBjb25zdCBwb3MgPSBnZXRXb3JsZFBvc2l0aW9uM0Qobm9kZSk7XG4gICAgcmV0dXJuIGJvdW5kcy5tYXAoaXRlbSA9PiBuZXcgVmVjMyhpdGVtLngsIGl0ZW0ueSwgcG9zLnopKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2VudGVyV29ybGRQb3MzRChub2RlczogTm9kZVtdKTogVmVjMyB7XG4gICAgbGV0IG1pblg6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIGxldCBtaW5ZOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbWluWjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IG1heFg6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIGxldCBtYXhZOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbWF4WjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGJvdW5kcyA9IGdldFdvcmxkT3JpZW50ZWRCb3VuZHMobm9kZXNbaV0pO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGJvdW5kcy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgY29uc3QgdiA9IGJvdW5kc1tqXTtcbiAgICAgICAgICAgIGlmIChtaW5YID09PSBudWxsIHx8IHYueCA8IG1pblgpIG1pblggPSB2Lng7XG4gICAgICAgICAgICBpZiAobWF4WCA9PT0gbnVsbCB8fCB2LnggPiBtYXhYKSBtYXhYID0gdi54O1xuICAgICAgICAgICAgaWYgKG1pblkgPT09IG51bGwgfHwgdi55IDwgbWluWSkgbWluWSA9IHYueTtcbiAgICAgICAgICAgIGlmIChtYXhZID09PSBudWxsIHx8IHYueSA+IG1heFkpIG1heFkgPSB2Lnk7XG4gICAgICAgICAgICBpZiAobWluWiA9PT0gbnVsbCB8fCB2LnogPCBtaW5aKSBtaW5aID0gdi56O1xuICAgICAgICAgICAgaWYgKG1heFogPT09IG51bGwgfHwgdi56ID4gbWF4WikgbWF4WiA9IHYuejtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1pblggPSBsaW1pdFJhbmdlKG1pblghKTtcbiAgICBtYXhYID0gbGltaXRSYW5nZShtYXhYISk7XG4gICAgbWluWSA9IGxpbWl0UmFuZ2UobWluWSEpO1xuICAgIG1heFkgPSBsaW1pdFJhbmdlKG1heFkhKTtcbiAgICBtaW5aID0gbGltaXRSYW5nZShtaW5aISk7XG4gICAgbWF4WiA9IGxpbWl0UmFuZ2UobWF4WiEpO1xuXG4gICAgcmV0dXJuIG5ldyBWZWMzKChtaW5YICsgbWF4WCkgKiAwLjUsIChtaW5ZICsgbWF4WSkgKiAwLjUsIChtaW5aICsgbWF4WikgKiAwLjUpO1xufVxuXG5mdW5jdGlvbiBnZXRXb3JsZFBvc2l0aW9uM0Qobm9kZTogTm9kZSk6IFZlYzMge1xuICAgIHJldHVybiBub2RlLmdldFdvcmxkUG9zaXRpb24oKTtcbn1cblxuZnVuY3Rpb24gZ2V0Qm91bmRhcnlPZk1lc2hOb2RlKG5vZGU6IE5vZGUpOiBnZW9tZXRyeS5BQUJCIHwgbnVsbCB7XG4gICAgaWYgKCFub2RlKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBtb2RlbENvbXAgPSBub2RlLmdldENvbXBvbmVudChNZXNoUmVuZGVyZXIpO1xuICAgIGlmICghbW9kZWxDb21wKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IFNraW5uZWRNZXNoUmVuZGVyZXIgPSAoY2MgYXMgYW55KS5Ta2lubmVkTWVzaFJlbmRlcmVyO1xuICAgIGlmIChTa2lubmVkTWVzaFJlbmRlcmVyICYmIG1vZGVsQ29tcCBpbnN0YW5jZW9mIFNraW5uZWRNZXNoUmVuZGVyZXIpIHtcbiAgICAgICAgbW9kZWxDb21wLm1vZGVsPy51cGRhdGVUcmFuc2Zvcm0/LigtMSk7XG4gICAgICAgIHJldHVybiBtb2RlbENvbXAubW9kZWw/LndvcmxkQm91bmRzID8/IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKG1vZGVsQ29tcC5tZXNoICYmIG1vZGVsQ29tcC5tb2RlbCkge1xuICAgICAgICBsZXQgdHJhbnNmb3JtQUFCQiA9IG1vZGVsQ29tcC5tb2RlbC5tb2RlbEJvdW5kcz8uY2xvbmUoKSA/PyBudWxsO1xuICAgICAgICBpZiAoIXRyYW5zZm9ybUFBQkIpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc2ggPSBtb2RlbENvbXAubWVzaDtcbiAgICAgICAgICAgIGlmIChtZXNoICYmIG1lc2gubWluUG9zaXRpb24gJiYgbWVzaC5tYXhQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybUFBQkIgPSBnZW9tZXRyeS5BQUJCLmZyb21Qb2ludHMoZ2VvbWV0cnkuQUFCQi5jcmVhdGUoKSwgbWVzaC5taW5Qb3NpdGlvbiwgbWVzaC5tYXhQb3NpdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYW5zZm9ybUFBQkIpIHtcbiAgICAgICAgICAgIGdlb21ldHJ5LkFBQkIudHJhbnNmb3JtKHRyYW5zZm9ybUFBQkIsIHRyYW5zZm9ybUFBQkIsIG5vZGUud29ybGRNYXRyaXgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1BQUJCO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8g5byV5pOO55qE57KS5a2Q5Y+R5bCE5Zmo5b2i54q25p6a5Li+5pyq5LuOIGNjIOWFrOW8gOWvvOWHuu+8jOi/memHjOS4jiBDcmVhdG9y77yIdXRpbHMvbm9kZS50c++8ieS4gOiHtO+8jFxuLy8g5oyJ5YW256iz5a6a55qE5bqP5YiX5YyW5YC85a6a5LmJ5LiA5Liq5pys5ZywIFNoYXBlVHlwZSDmnprkuL7vvIzpgb/lhY3kvb/nlKjprZTms5XmlbDlrZfjgIJcbmVudW0gU2hhcGVUeXBlIHtcbiAgICBCb3ggPSAwLFxuICAgIENpcmNsZSA9IDEsXG4gICAgQ29uZSA9IDIsXG4gICAgU3BoZXJlID0gMyxcbiAgICBIZW1pc3BoZXJlID0gNCxcbn1cblxuZnVuY3Rpb24gZ2V0UmFuZ2VGcm9tUGFydGljbGVDb21wKGNvbXBvbmVudDogYW55KTogbnVtYmVyIHtcbiAgICBsZXQgcmFuZ2UgPSAwO1xuICAgIGlmIChjb21wb25lbnQuc2hhcGVNb2R1bGU/LmVuYWJsZSkge1xuICAgICAgICBjb25zdCBzaGFwZU1vZHVsZSA9IGNvbXBvbmVudC5zaGFwZU1vZHVsZTtcbiAgICAgICAgc3dpdGNoIChzaGFwZU1vZHVsZS5zaGFwZVR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU2hhcGVUeXBlLkJveDpcbiAgICAgICAgICAgICAgICByYW5nZSA9IE1hdGgubWF4KHNoYXBlTW9kdWxlLnNjYWxlLngsIHNoYXBlTW9kdWxlLnNjYWxlLnksIHNoYXBlTW9kdWxlLnNjYWxlLnopO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuQ2lyY2xlOlxuICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuU3BoZXJlOlxuICAgICAgICAgICAgY2FzZSBTaGFwZVR5cGUuSGVtaXNwaGVyZTpcbiAgICAgICAgICAgICAgICByYW5nZSA9IHNoYXBlTW9kdWxlLnJhZGl1cztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU2hhcGVUeXBlLkNvbmU6XG4gICAgICAgICAgICAgICAgcmFuZ2UgPSBNYXRoLm1heChzaGFwZU1vZHVsZS5yYWRpdXMsIHNoYXBlTW9kdWxlLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJhbmdlO1xufVxuXG5mdW5jdGlvbiBpc0VkaXRvck5vZGUobm9kZTogTm9kZSk6IGJvb2xlYW4ge1xuICAgIGlmIChub2RlLmxheWVyICYgTGF5ZXJzLkVudW0uR0laTU9TKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGxldCBpdGVyTm9kZTogTm9kZSB8IG51bGwgPSBub2RlO1xuICAgIHdoaWxlIChpdGVyTm9kZSkge1xuICAgICAgICBpZiAoaXRlck5vZGUub2JqRmxhZ3MgJiBDQ09iamVjdC5GbGFncy5IaWRlSW5IaWVyYXJjaHkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGl0ZXJOb2RlID0gaXRlck5vZGUucGFyZW50O1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0TWF4UmFuZ2VPZk5vZGUobm9kZTogTm9kZSk6IG51bWJlciB7XG4gICAgbGV0IG1heFJhbmdlID0gMC4wMDE7XG4gICAgaWYgKCFub2RlIHx8IGlzRWRpdG9yTm9kZShub2RlKSkgcmV0dXJuIG1heFJhbmdlO1xuXG4gICAgbGV0IGNvbXBSYW5nZSA9IDA7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IG5vZGUuY29tcG9uZW50cztcblxuICAgIGlmIChjb21wb25lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBtYXhSYW5nZSA9IDE7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudHNbaV07XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGpzLmdldENsYXNzTmFtZShjb21wb25lbnQpO1xuICAgICAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnY2MuU3BoZXJlTGlnaHQnOlxuICAgICAgICAgICAgY2FzZSAnY2MuU3BvdExpZ2h0JzpcbiAgICAgICAgICAgIGNhc2UgJ2NjLlBvaW50TGlnaHQnOlxuICAgICAgICAgICAgICAgIGNvbXBSYW5nZSA9IChjb21wb25lbnQgYXMgYW55KS5yYW5nZSA/PyAzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2MuTGlnaHRQcm9iZUdyb3VwJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBjb21wb25lbnQgYXMgYW55O1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2Jlc1NpemUgPSBuZXcgVmVjMyhjb21wLm1heFBvcykuc3VidHJhY3QoY29tcC5taW5Qb3MpO1xuICAgICAgICAgICAgICAgIGNvbXBSYW5nZSA9IE1hdGgubWF4KE1hdGguYWJzKHByb2Jlc1NpemUueCAvIDIpLCBNYXRoLmFicyhwcm9iZXNTaXplLnkgLyAyKSwgTWF0aC5hYnMocHJvYmVzU2l6ZS56IC8gMikpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnY2MuUmFuZ2VkRGlyZWN0aW9uYWxMaWdodCc6XG4gICAgICAgICAgICBjYXNlICdjYy5EaXJlY3Rpb25hbExpZ2h0JzpcbiAgICAgICAgICAgIGNhc2UgJ2NjLkNhbWVyYSc6XG4gICAgICAgICAgICAgICAgY29tcFJhbmdlID0gMztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NjLk1lc2hSZW5kZXJlcic6XG4gICAgICAgICAgICBjYXNlICdjYy5Ta2lubmVkTWVzaFJlbmRlcmVyJzpcbiAgICAgICAgICAgIGNhc2UgJ2NjLkF2YXRhck1vZGVsQ29tcG9uZW50JzpcbiAgICAgICAgICAgIGNhc2UgJ2NjLlNraW5uZWRNZXNoQmF0Y2hSZW5kZXJlcic6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtciA9IGNvbXBvbmVudCBhcyBNZXNoUmVuZGVyZXI7XG4gICAgICAgICAgICAgICAgaWYgKG1yLm1lc2ggJiYgbXIubW9kZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmxkQm91bmQ6IGFueSA9IG1yLm1vZGVsLndvcmxkQm91bmRzO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghd29ybGRCb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kZWxCb3VuZCA9IG1yLm1vZGVsLm1vZGVsQm91bmRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vZGVsQm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JsZEJvdW5kID0gZ2VvbWV0cnkuQUFCQi5jcmVhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZW9tZXRyeS5BQUJCLnRyYW5zZm9ybSh3b3JsZEJvdW5kLCBtb2RlbEJvdW5kLCBub2RlLndvcmxkTWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JsZEJvdW5kICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlci5pc05hTih3b3JsZEJvdW5kLmhhbGZFeHRlbnRzLngpXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCBOdW1iZXIuaXNOYU4od29ybGRCb3VuZC5oYWxmRXh0ZW50cy55KVxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgTnVtYmVyLmlzTmFOKHdvcmxkQm91bmQuaGFsZkV4dGVudHMueilcbiAgICAgICAgICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd29ybGRCb3VuZCA9IGdldEJvdW5kYXJ5T2ZNZXNoTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JsZEJvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wUmFuZ2UgPSBNYXRoLm1heCh3b3JsZEJvdW5kLmhhbGZFeHRlbnRzLngsIHdvcmxkQm91bmQuaGFsZkV4dGVudHMueSwgd29ybGRCb3VuZC5oYWxmRXh0ZW50cy56KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ2NjLlVJVHJhbnNmb3JtJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IHVpID0gY29tcG9uZW50IGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAodWkuZ2V0Qm91bmRpbmdCb3gpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHVpLmdldEJvdW5kaW5nQm94KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1aS5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd20gPSB1aS5ub2RlLnBhcmVudC53b3JsZE1hdHJpeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3bSAmJiBiYm94LnRyYW5zZm9ybU1hdDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYm94LnRyYW5zZm9ybU1hdDQod20pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbXBSYW5nZSA9IE1hdGgubWF4KGJib3gud2lkdGggLyAyLCBiYm94LmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ2NjLkJveENvbGxpZGVyJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSAoY29tcG9uZW50IGFzIGFueSkuc2l6ZTtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSkgY29tcFJhbmdlID0gTWF0aC5tYXgoc2l6ZS54IC8gMiwgc2l6ZS55IC8gMiwgc2l6ZS56IC8gMik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdjYy5TcGhlcmVDb2xsaWRlcic6XG4gICAgICAgICAgICAgICAgY29tcFJhbmdlID0gKGNvbXBvbmVudCBhcyBhbnkpLnJhZGl1cyA/PyAxO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2MuQ2Fwc3VsZUNvbGxpZGVyJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhcCA9IGNvbXBvbmVudCBhcyBhbnk7XG4gICAgICAgICAgICAgICAgY29tcFJhbmdlID0gTWF0aC5tYXgoKGNhcC5oZWlnaHQgPz8gMikgLyAyLCBjYXAucmFkaXVzID8/IDAuNSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdjYy5SZWZsZWN0aW9uUHJvYmUnOiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IChjb21wb25lbnQgYXMgYW55KS5zaXplO1xuICAgICAgICAgICAgICAgIGlmIChzaXplKSBjb21wUmFuZ2UgPSBNYXRoLm1heChzaXplLngsIHNpemUueSwgc2l6ZS56KSAvIDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdjYy5QYXJ0aWNsZVN5c3RlbSc6IHtcbiAgICAgICAgICAgICAgICBjb21wUmFuZ2UgPSBnZXRSYW5nZUZyb21QYXJ0aWNsZUNvbXAoY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBUZXJyYWluID0gKGNjIGFzIGFueSkuVGVycmFpbjtcbiAgICAgICAgICAgICAgICBpZiAoVGVycmFpbiAmJiBjbGFzc05hbWUgPT09IGpzLmdldENsYXNzTmFtZShUZXJyYWluKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gKGNvbXBvbmVudCBhcyBhbnkpLmluZm87XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvPy5zaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wUmFuZ2UgPSBNYXRoLm1heChpbmZvLnNpemUud2lkdGggLyAyLCBpbmZvLnNpemUuaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcFJhbmdlID4gbWF4UmFuZ2UpIHtcbiAgICAgICAgICAgIG1heFJhbmdlID0gY29tcFJhbmdlO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbXBSYW5nZSA9PT0gMCkge1xuICAgICAgICAgICAgbWF4UmFuZ2UgPSBNYXRoLm1heChtYXhSYW5nZSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGltaXRSYW5nZShtYXhSYW5nZSk7XG59XG5cbmZ1bmN0aW9uIGdldE1heFJhbmdlT2ZOb2Rlcyhub2RlczogTm9kZVtdKTogbnVtYmVyIHtcbiAgICBsZXQgbWF4UmFuZ2UgPSBOdW1iZXIuTUlOX1ZBTFVFO1xuXG4gICAgaWYgKG5vZGVzKSB7XG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgICAgICAgbGV0IHJhbmdlID0gZ2V0TWF4UmFuZ2VPZk5vZGUobm9kZSk7XG4gICAgICAgICAgICBpZiAocmFuZ2UgPiBtYXhSYW5nZSkgbWF4UmFuZ2UgPSByYW5nZTtcblxuICAgICAgICAgICAgcmFuZ2UgPSBnZXRNYXhSYW5nZU9mTm9kZXMobm9kZS5jaGlsZHJlbiBhcyBOb2RlW10pO1xuICAgICAgICAgICAgaWYgKHJhbmdlID4gbWF4UmFuZ2UpIG1heFJhbmdlID0gcmFuZ2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWF4UmFuZ2U7XG59XG5cbmZ1bmN0aW9uIG1ha2VWZWMzSW5SYW5nZSh2OiBWZWMzLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiB2b2lkIHtcbiAgICB2LnggPSBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdi54KSk7XG4gICAgdi55ID0gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHYueSkpO1xuICAgIHYueiA9IE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2LnopKTtcbn1cblxuLy8gLS0tLS0tLS0tLSBzbW9vdGggbW91c2Ugd2hlZWwgaGVscGVyIC0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIHNtb290aE1vdXNlV2hlZWxTY2FsZShkZWx0YTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gKGRlbHRhID4gMCA/IDEgOiAtMSkgKiAoTWF0aC5wb3coMiwgTWF0aC5hYnMoZGVsdGEpICogMC4wMikgLSAxKSAqIDEwO1xufVxuXG4vLyAtLS0tLS0tLS0tIGNvbnN0YW50cyAtLS0tLS0tLS0tXG5cbmNvbnN0IF9tYXhUaWNrcyA9IDEwMDtcblxuY29uc3QgT1JUSE8gPSBDYW1lcmEuUHJvamVjdGlvblR5cGUuT1JUSE87XG5jb25zdCBQRVJTUEVDVElWRSA9IENhbWVyYS5Qcm9qZWN0aW9uVHlwZS5QRVJTUEVDVElWRTtcblxuZW51bSBNb2RlQ29tbWFuZCB7XG4gICAgVG9JZGxlID0gJ3RvSWRsZScsXG4gICAgVG9QYW4gPSAndG9QYW4nLFxuICAgIFRvT3JiaXQgPSAndG9PcmJpdCcsXG4gICAgVG9XYW5kZXIgPSAndG9XYW5kZXInLFxufVxuXG5leHBvcnQgY2xhc3MgQ2FtZXJhQ29udHJvbGxlcjNEIGV4dGVuZHMgQ2FtZXJhQ29udHJvbGxlckJhc2Uge1xuICAgIHByaXZhdGUgdjNhID0gbmV3IFZlYzMoKTtcbiAgICBwcml2YXRlIHYzYiA9IG5ldyBWZWMzKCk7XG4gICAgcHJpdmF0ZSB2M2MgPSBuZXcgVmVjMygpO1xuICAgIHByaXZhdGUgdjNkID0gbmV3IFZlYzMoKTtcblxuICAgIHByb3RlY3RlZCBfd2hlZWxTcGVlZCA9IDAuMDE7XG4gICAgcHJvdGVjdGVkIF9uZWFyID0gMC4xO1xuICAgIHByb3RlY3RlZCBfZmFyID0gMTAwMDA7XG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9vcnRob1NjYWxlID0gMC4xO1xuICAgIHByb3RlY3RlZCByZWFkb25seSBfbWluU2NhbGFyID0gMC4xO1xuXG4gICAgcHJpdmF0ZSBob21lUG9zID0gbmV3IFZlYzMoNTAsIDUwLCA1MCk7XG4gICAgcHJpdmF0ZSBob21lUm90ID0gUXVhdC5mcm9tVmlld1VwKG5ldyBRdWF0KCksIFZlYzMubm9ybWFsaXplKHRoaXMudjNhLCB0aGlzLmhvbWVQb3MpKTtcbiAgICBwcml2YXRlIF9zY2VuZVZpZXdDZW50ZXIgPSBuZXcgVmVjMygpO1xuICAgIHB1YmxpYyB2aWV3RGlzdCA9IDIwO1xuXG4gICAgcHJpdmF0ZSBmb3J3YXJkID0gbmV3IFZlYzMoVmVjMy5VTklUX1opO1xuXG4gICAgcHJpdmF0ZSBfY3VyUm90ID0gbmV3IFF1YXQoKTtcbiAgICBwcml2YXRlIF9jdXJFeWUgPSBuZXcgVmVjMygpO1xuXG5cbiAgICBwcml2YXRlIF9saW5lQ29sb3IgPSBuZXcgQ29sb3IoODUsIDg1LCA4NSwgMjU1KTtcblxuICAgIHB1YmxpYyBsYXN0TW91c2VXaGVlbERlbHRhWSA9IDA7XG4gICAgcHVibGljIG1heE1vdXNlV2hlZWxEZWx0YVkgPSAxMDAwO1xuXG4gICAgcHJpdmF0ZSBfbW9kZUZTTSE6IEZpbml0ZVN0YXRlTWFjaGluZTxNb2RlQmFzZTNEPjtcbiAgICBwcml2YXRlIF9pZGxlTW9kZSE6IElkbGVNb2RlO1xuICAgIHByaXZhdGUgX29yYml0TW9kZSE6IE9yYml0TW9kZTtcbiAgICBwcml2YXRlIF9wYW5Nb2RlITogUGFuTW9kZTtcbiAgICBwcml2YXRlIF93YW5kZXJNb2RlITogV2FuZGVyTW9kZTtcblxuICAgIHB1YmxpYyB2aWV3PzogbnVtYmVyO1xuICAgIHByaXZhdGUgaFRpY2tzITogTGluZWFyVGlja3M7XG4gICAgcHJpdmF0ZSB2VGlja3MhOiBMaW5lYXJUaWNrcztcblxuICAgIHB1YmxpYyBzaGlmdEtleT86IGJvb2xlYW47XG4gICAgcHVibGljIGFsdEtleT86IGJvb2xlYW47XG4gICAgcHVibGljIG1vdXNlUHJlc3NpbmcgPSBmYWxzZTtcbiAgICBwdWJsaWMgbGFzdEZvY3VzTm9kZVVVSUQ6IHN0cmluZ1tdID0gW107XG5cbiAgICBwdWJsaWMgZ2V0IGxpbmVDb2xvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xpbmVDb2xvcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGxpbmVDb2xvcih2YWx1ZTogQ29sb3IpIHtcbiAgICAgICAgdGhpcy5fbGluZUNvbG9yID0gdmFsdWU7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBzY2VuZVZpZXdDZW50ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY2VuZVZpZXdDZW50ZXI7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBzY2VuZVZpZXdDZW50ZXIodmFsdWU6IFZlYzMpIHtcbiAgICAgICAgdGhpcy5fc2NlbmVWaWV3Q2VudGVyLnNldCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCB3YW5kZXJTcGVlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dhbmRlck1vZGUud2FuZGVyU3BlZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCB3YW5kZXJTcGVlZCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3dhbmRlck1vZGUud2FuZGVyU3BlZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGVuYWJsZUFjY2VsZXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dhbmRlck1vZGUuZW5hYmxlQWNjZWxlcmF0aW9uO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgZW5hYmxlQWNjZWxlcmF0aW9uKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX3dhbmRlck1vZGUuZW5hYmxlQWNjZWxlcmF0aW9uID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaW5pdChjYW1lcmE6IENhbWVyYSkge1xuICAgICAgICBzdXBlci5pbml0KGNhbWVyYSk7XG5cbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IHRoaXMubm9kZS5wYXJlbnQgfHwgdGhpcy5ub2RlO1xuICAgICAgICB0aGlzLl9ncmlkTWVzaENvbXAgPSBDYW1lcmFVdGlscy5jcmVhdGVHcmlkKCdpbnRlcm5hbC9lZGl0b3IvZ3JpZCcsIHBhcmVudE5vZGUpO1xuICAgICAgICB0aGlzLl9ncmlkTWVzaENvbXAubm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZ3JpZE1lc2hDb21wLm5vZGUuc2V0V29ybGRSb3RhdGlvbkZyb21FdWxlcig5MCwgMCwgMCk7XG5cbiAgICAgICAgdGhpcy5pbml0T3JpZ2luQXhpcygpO1xuICAgICAgICB0aGlzLl9pbml0TW9kZSgpO1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuX2luaXRMaW5lYXJUaWNrKCk7XG4gICAgfVxuXG4gICAgc2hvd0dyaWQodmlzaWJsZTogYm9vbGVhbikge1xuICAgICAgICBzdXBlci5zaG93R3JpZCh2aXNpYmxlKTtcbiAgICAgICAgaWYgKHRoaXMuX29yaWdpbkF4aXNIb3Jpem9udGFsTWVzaENvbXA/Lm5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX29yaWdpbkF4aXNIb3Jpem9udGFsTWVzaENvbXAubm9kZS5hY3RpdmUgPSB2aXNpYmxlICYmICh0aGlzLm9yaWdpbkF4aXNYX1Zpc2libGUgfHwgdGhpcy5vcmlnaW5BeGlzWl9WaXNpYmxlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fb3JpZ2luQXhpc1ZlcnRpY2FsTWVzaENvbXA/Lm5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX29yaWdpbkF4aXNWZXJ0aWNhbE1lc2hDb21wLm5vZGUuYWN0aXZlID0gdmlzaWJsZSAmJiB0aGlzLm9yaWdpbkF4aXNZX1Zpc2libGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tIOWOn+eCuei9tCAtLS0tLS0tLS0tXG5cbiAgICBwcml2YXRlIGluaXRPcmlnaW5BeGlzKCkge1xuICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gdGhpcy5ub2RlLnBhcmVudCB8fCB0aGlzLm5vZGU7XG4gICAgICAgIHRoaXMuX29yaWdpbkF4aXNIb3Jpem9udGFsTWVzaENvbXAgPSBDYW1lcmFVdGlscy5jcmVhdGVHcmlkKCdpbnRlcm5hbC9lZGl0b3IvZ3JpZCcsIHBhcmVudE5vZGUpO1xuICAgICAgICB0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wLm5vZGUuc2V0V29ybGRSb3RhdGlvbkZyb21FdWxlcig5MCwgMCwgMCk7XG4gICAgICAgIHRoaXMuX29yaWdpbkF4aXNWZXJ0aWNhbE1lc2hDb21wID0gQ2FtZXJhVXRpbHMuY3JlYXRlR3JpZCgnaW50ZXJuYWwvZWRpdG9yL2dyaWQnLCBwYXJlbnROb2RlKTtcbiAgICAgICAgdGhpcy5fb3JpZ2luQXhpc1ZlcnRpY2FsTWVzaENvbXAubm9kZS5zZXRXb3JsZFJvdGF0aW9uRnJvbUV1bGVyKDAsIDkwLCAwKTtcblxuICAgICAgICB0aGlzLm9yaWdpbkF4aXNYX1Zpc2libGUgPSB0cnVlO1xuICAgICAgICB0aGlzLm9yaWdpbkF4aXNaX1Zpc2libGUgPSB0cnVlO1xuICAgICAgICB0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wLm5vZGUuYWN0aXZlID0gKHRoaXMub3JpZ2luQXhpc1hfVmlzaWJsZSB8fCB0aGlzLm9yaWdpbkF4aXNaX1Zpc2libGUpO1xuICAgICAgICB0aGlzLl9vcmlnaW5BeGlzVmVydGljYWxNZXNoQ29tcC5ub2RlLmFjdGl2ZSA9IHRoaXMub3JpZ2luQXhpc1lfVmlzaWJsZTtcbiAgICAgICAgdm9pZCB0aGlzLmluaXRPcmlnaW5BeGlzRnJvbUNvbmZpZygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaW5pdE9yaWdpbkF4aXNGcm9tQ29uZmlnKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcnBjID0gUnBjLmdldEluc3RhbmNlKCk7XG4gICAgICAgICAgICBjb25zdCBnaXptb3MgPSBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdnZXQnLCBbJ2dpem1vJ10pIGFzIGFueTtcbiAgICAgICAgICAgIGlmIChnaXptb3M/Lm9yaWdpbkF4aXMzRCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT3JpZ2luQXhpc0J5Q29uZmlnKGdpem1vcy5vcmlnaW5BeGlzM0QsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBVc2UgdGhlIGRlZmF1bHQgM0Qgb3JpZ2luIGF4ZXMgd2hlbiBjb25maWcgaXMgdW5hdmFpbGFibGUuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVPcmlnaW5BeGlzQnlDb25maWcoY29uZmlnOiB7IHg/OiBib29sZWFuOyB5PzogYm9vbGVhbjsgej86IGJvb2xlYW4gfSwgdXBkYXRlID0gdHJ1ZSkge1xuICAgICAgICBpZiAoY29uZmlnLnggIT09IHVuZGVmaW5lZCkgdGhpcy5vcmlnaW5BeGlzWF9WaXNpYmxlID0gY29uZmlnLng7XG4gICAgICAgIGlmIChjb25maWcueSAhPT0gdW5kZWZpbmVkKSB0aGlzLm9yaWdpbkF4aXNZX1Zpc2libGUgPSBjb25maWcueTtcbiAgICAgICAgaWYgKGNvbmZpZy56ICE9PSB1bmRlZmluZWQpIHRoaXMub3JpZ2luQXhpc1pfVmlzaWJsZSA9IGNvbmZpZy56O1xuXG4gICAgICAgIGlmICh0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wPy5ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wLm5vZGUuYWN0aXZlID0gISF0aGlzLl9ncmlkTWVzaENvbXA/Lm5vZGU/LmFjdGl2ZSAmJiAodGhpcy5vcmlnaW5BeGlzWF9WaXNpYmxlIHx8IHRoaXMub3JpZ2luQXhpc1pfVmlzaWJsZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX29yaWdpbkF4aXNWZXJ0aWNhbE1lc2hDb21wPy5ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9vcmlnaW5BeGlzVmVydGljYWxNZXNoQ29tcC5ub2RlLmFjdGl2ZSA9ICEhdGhpcy5fZ3JpZE1lc2hDb21wPy5ub2RlPy5hY3RpdmUgJiYgdGhpcy5vcmlnaW5BeGlzWV9WaXNpYmxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHVwZGF0ZSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5BeGlzKCk7XG4gICAgICAgIH1cbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldE9yaWdpbkF4aXNEYXRhKCkge1xuICAgICAgICBjb25zdCBjYW1lcmFQb3MgPSBuZXcgVmVjMygpO1xuICAgICAgICB0aGlzLm5vZGUuZ2V0UG9zaXRpb24oY2FtZXJhUG9zKTtcblxuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IGNhbWVyYVBvcy55O1xuICAgICAgICBjb25zdCBzY2FsZSA9IGRpc3RhbmNlIC8gNTAwO1xuICAgICAgICBjb25zdCByYW5nZSA9IDUwMDA7XG4gICAgICAgIGNvbnN0IHNjYWxlUmFuZ2UgPSAocmFuZ2UgKiBzY2FsZSkgfCAwO1xuXG4gICAgICAgIGNvbnN0IGN1clN0YXJ0WCA9IC1zY2FsZVJhbmdlICsgY2FtZXJhUG9zLng7XG4gICAgICAgIGNvbnN0IGN1ckVuZFggPSBzY2FsZVJhbmdlICsgY2FtZXJhUG9zLng7XG4gICAgICAgIGNvbnN0IGN1clN0YXJ0WSA9IC1zY2FsZVJhbmdlICsgY2FtZXJhUG9zLno7XG4gICAgICAgIGNvbnN0IGN1ckVuZFkgPSBzY2FsZVJhbmdlICsgY2FtZXJhUG9zLno7XG4gICAgICAgIHRoaXMuaFRpY2tzPy5yYW5nZShjdXJTdGFydFgsIGN1ckVuZFgsIHJhbmdlKTtcbiAgICAgICAgdGhpcy52VGlja3M/LnJhbmdlKGN1clN0YXJ0WSwgY3VyRW5kWSwgcmFuZ2UpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydFg6IGN1clN0YXJ0WCxcbiAgICAgICAgICAgIGVuZFg6IGN1ckVuZFgsXG4gICAgICAgICAgICBzdGFydFk6IGN1clN0YXJ0WSxcbiAgICAgICAgICAgIGVuZFk6IGN1ckVuZFksXG4gICAgICAgICAgICBjYW1lcmFQb3MsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVPcmlnaW5BeGlzVmVydGljYWwoKSB7XG4gICAgICAgIGNvbnN0IHsgc3RhcnRZLCBlbmRZLCBjYW1lcmFQb3MgfSA9IHRoaXMuZ2V0T3JpZ2luQXhpc0RhdGEoKTtcbiAgICAgICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBjb25zdCBjb2xvcnM6IG51bWJlcltdID0gW107XG4gICAgICAgIGNvbnN0IGluZGljZXM6IG51bWJlcltdID0gW107XG5cbiAgICAgICAgaWYgKHRoaXMub3JpZ2luQXhpc1lfVmlzaWJsZSkge1xuICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goMCwgY2FtZXJhUG9zLnopO1xuICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goMCwgc3RhcnRZKTtcbiAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKDAsIGNhbWVyYVBvcy56KTtcbiAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKDAsIGVuZFkpO1xuXG4gICAgICAgICAgICBjb25zdCBjID0gdGhpcy5vcmlnaW5BeGlzWV9Db2xvcjtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29sb3JzLnB1c2goYy54LCBjLnksIGMueiwgYy53KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2goaSAvIDIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBDYW1lcmFVdGlscy51cGRhdGVWQkF0dHIodGhpcy5fb3JpZ2luQXhpc1ZlcnRpY2FsTWVzaENvbXAsIGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfUE9TSVRJT04sIHBvc2l0aW9ucyk7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy51cGRhdGVWQkF0dHIodGhpcy5fb3JpZ2luQXhpc1ZlcnRpY2FsTWVzaENvbXAsIGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfQ09MT1IsIGNvbG9ycyk7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy51cGRhdGVJQih0aGlzLl9vcmlnaW5BeGlzVmVydGljYWxNZXNoQ29tcCwgaW5kaWNlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZU9yaWdpbkF4aXNIb3Jpem9udGFsKCkge1xuICAgICAgICBjb25zdCB7IHN0YXJ0WSwgZW5kWSwgc3RhcnRYLCBlbmRYLCBjYW1lcmFQb3MgfSA9IHRoaXMuZ2V0T3JpZ2luQXhpc0RhdGEoKTtcbiAgICAgICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBjb25zdCBjb2xvcnM6IG51bWJlcltdID0gW107XG4gICAgICAgIGNvbnN0IGluZGljZXM6IG51bWJlcltdID0gW107XG5cbiAgICAgICAgaWYgKHRoaXMub3JpZ2luQXhpc1hfVmlzaWJsZSkge1xuICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goMCwgY2FtZXJhUG9zLnopO1xuICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goMCwgc3RhcnRZKTtcbiAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKDAsIGNhbWVyYVBvcy56KTtcbiAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKDAsIGVuZFkpO1xuXG4gICAgICAgICAgICBjb25zdCBjID0gdGhpcy5vcmlnaW5BeGlzWF9Db2xvcjtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29sb3JzLnB1c2goYy54LCBjLnksIGMueiwgYy53KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9yaWdpbkF4aXNaX1Zpc2libGUpIHtcbiAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKGNhbWVyYVBvcy54LCAwKTtcbiAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHN0YXJ0WCwgMCk7XG4gICAgICAgICAgICBwb3NpdGlvbnMucHVzaChjYW1lcmFQb3MueCwgMCk7XG4gICAgICAgICAgICBwb3NpdGlvbnMucHVzaChlbmRYLCAwKTtcblxuICAgICAgICAgICAgY29uc3QgYyA9IHRoaXMub3JpZ2luQXhpc1pfQ29sb3I7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKGMueCwgYy55LCBjLnosIGMudyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocG9zaXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkgLyAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENhbWVyYVV0aWxzLnVwZGF0ZVZCQXR0cih0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wLCBnZnguQXR0cmlidXRlTmFtZS5BVFRSX1BPU0lUSU9OLCBwb3NpdGlvbnMpO1xuICAgICAgICAgICAgQ2FtZXJhVXRpbHMudXBkYXRlVkJBdHRyKHRoaXMuX29yaWdpbkF4aXNIb3Jpem9udGFsTWVzaENvbXAsIGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfQ09MT1IsIGNvbG9ycyk7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy51cGRhdGVJQih0aGlzLl9vcmlnaW5BeGlzSG9yaXpvbnRhbE1lc2hDb21wLCBpbmRpY2VzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlT3JpZ2luQXhpcygpIHtcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5BeGlzSG9yaXpvbnRhbCgpO1xuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbkF4aXNWZXJ0aWNhbCgpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0g5qih5byP54q25oCB5py6IC0tLS0tLS0tLS1cblxuICAgIHByaXZhdGUgX2luaXRNb2RlKCkge1xuICAgICAgICB0aGlzLl9pZGxlTW9kZSA9IG5ldyBJZGxlTW9kZSh0aGlzKTtcbiAgICAgICAgdGhpcy5fb3JiaXRNb2RlID0gbmV3IE9yYml0TW9kZSh0aGlzKTtcbiAgICAgICAgdGhpcy5fcGFuTW9kZSA9IG5ldyBQYW5Nb2RlKHRoaXMpO1xuICAgICAgICB0aGlzLl93YW5kZXJNb2RlID0gbmV3IFdhbmRlck1vZGUodGhpcyk7XG5cbiAgICAgICAgdGhpcy5fbW9kZUZTTSA9IG5ldyBGaW5pdGVTdGF0ZU1hY2hpbmU8TW9kZUJhc2UzRD4oW3RoaXMuX2lkbGVNb2RlLCB0aGlzLl9vcmJpdE1vZGUsIHRoaXMuX3Bhbk1vZGUsIHRoaXMuX3dhbmRlck1vZGVdKTtcblxuICAgICAgICB0aGlzLl9tb2RlRlNNLmFkZFRyYW5zaXRpb24odGhpcy5faWRsZU1vZGUsIHRoaXMuX29yYml0TW9kZSwgTW9kZUNvbW1hbmQuVG9PcmJpdCk7XG4gICAgICAgIHRoaXMuX21vZGVGU00uYWRkVHJhbnNpdGlvbih0aGlzLl9pZGxlTW9kZSwgdGhpcy5fcGFuTW9kZSwgTW9kZUNvbW1hbmQuVG9QYW4pO1xuICAgICAgICB0aGlzLl9tb2RlRlNNLmFkZFRyYW5zaXRpb24odGhpcy5faWRsZU1vZGUsIHRoaXMuX3dhbmRlck1vZGUsIE1vZGVDb21tYW5kLlRvV2FuZGVyKTtcbiAgICAgICAgdGhpcy5fbW9kZUZTTS5hZGRUcmFuc2l0aW9uKHRoaXMuX29yYml0TW9kZSwgdGhpcy5faWRsZU1vZGUsIE1vZGVDb21tYW5kLlRvSWRsZSk7XG4gICAgICAgIHRoaXMuX21vZGVGU00uYWRkVHJhbnNpdGlvbih0aGlzLl9vcmJpdE1vZGUsIHRoaXMuX3Bhbk1vZGUsIE1vZGVDb21tYW5kLlRvUGFuKTtcbiAgICAgICAgdGhpcy5fbW9kZUZTTS5hZGRUcmFuc2l0aW9uKHRoaXMuX29yYml0TW9kZSwgdGhpcy5fd2FuZGVyTW9kZSwgTW9kZUNvbW1hbmQuVG9XYW5kZXIpO1xuICAgICAgICB0aGlzLl9tb2RlRlNNLmFkZFRyYW5zaXRpb24odGhpcy5fcGFuTW9kZSwgdGhpcy5faWRsZU1vZGUsIE1vZGVDb21tYW5kLlRvSWRsZSk7XG4gICAgICAgIHRoaXMuX21vZGVGU00uYWRkVHJhbnNpdGlvbih0aGlzLl9wYW5Nb2RlLCB0aGlzLl9vcmJpdE1vZGUsIE1vZGVDb21tYW5kLlRvT3JiaXQpO1xuICAgICAgICB0aGlzLl9tb2RlRlNNLmFkZFRyYW5zaXRpb24odGhpcy5fcGFuTW9kZSwgdGhpcy5fd2FuZGVyTW9kZSwgTW9kZUNvbW1hbmQuVG9XYW5kZXIpO1xuICAgICAgICB0aGlzLl9tb2RlRlNNLmFkZFRyYW5zaXRpb24odGhpcy5fd2FuZGVyTW9kZSwgdGhpcy5faWRsZU1vZGUsIE1vZGVDb21tYW5kLlRvSWRsZSk7XG4gICAgICAgIHRoaXMuX21vZGVGU00uYWRkVHJhbnNpdGlvbih0aGlzLl93YW5kZXJNb2RlLCB0aGlzLl9vcmJpdE1vZGUsIE1vZGVDb21tYW5kLlRvT3JiaXQpO1xuICAgICAgICB0aGlzLl9tb2RlRlNNLmFkZFRyYW5zaXRpb24odGhpcy5fd2FuZGVyTW9kZSwgdGhpcy5fcGFuTW9kZSwgTW9kZUNvbW1hbmQuVG9QYW4pO1xuXG4gICAgICAgIHRoaXMuX21vZGVGU00uQmVnaW4odGhpcy5faWRsZU1vZGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2luaXRMaW5lYXJUaWNrKCkge1xuICAgICAgICB0aGlzLmhUaWNrcyA9IG5ldyBMaW5lYXJUaWNrcygpLmluaXRUaWNrcyhbNSwgMl0sIDEsIDEwMDAwKS5zcGFjaW5nKDE1LCA4MCk7XG4gICAgICAgIHRoaXMudlRpY2tzID0gbmV3IExpbmVhclRpY2tzKCkuaW5pdFRpY2tzKFs1LCAyXSwgMSwgMTAwMDApLnNwYWNpbmcoMTUsIDgwKTtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tIGFjdGl2ZSAtLS0tLS0tLS0tXG5cbiAgICBzZXQgYWN0aXZlKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fY2FtZXJhLnByb2plY3Rpb24gPSAxO1xuICAgICAgICAgICAgdGhpcy5ub2RlLnNldFdvcmxkUG9zaXRpb24odGhpcy5fY3VyRXllKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5zZXRXb3JsZFJvdGF0aW9uKHRoaXMuX2N1clJvdCk7XG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEuZmFyID0gdGhpcy5mYXI7XG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEubmVhciA9IHRoaXMubmVhcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5nZXRXb3JsZFBvc2l0aW9uKHRoaXMuX2N1ckV5ZSk7XG4gICAgICAgICAgICB0aGlzLm5vZGUuZ2V0V29ybGRSb3RhdGlvbih0aGlzLl9jdXJSb3QpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2hvd0dyaWQodmFsdWUpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0g5qih5byP5YiH5o2iIC0tLS0tLS0tLS1cbiAgICBjaGFuZ2VNb2RlKG1vZGVDb21tYW5kOiBNb2RlQ29tbWFuZCkge1xuICAgICAgICBpZiAoIXRoaXMuX21vZGVGU00pIHJldHVybjtcbiAgICAgICAgdGhpcy5fbW9kZUZTTS5pc3N1ZUNvbW1hbmQobW9kZUNvbW1hbmQpO1xuICAgICAgICBsZXQgbW9kZSA9IENhbWVyYU1vdmVNb2RlLklETEU7XG4gICAgICAgIHN3aXRjaCAobW9kZUNvbW1hbmQpIHtcbiAgICAgICAgICAgIGNhc2UgTW9kZUNvbW1hbmQuVG9JZGxlOiBtb2RlID0gQ2FtZXJhTW92ZU1vZGUuSURMRTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1vZGVDb21tYW5kLlRvT3JiaXQ6IG1vZGUgPSBDYW1lcmFNb3ZlTW9kZS5PUkJJVDsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1vZGVDb21tYW5kLlRvUGFuOiBtb2RlID0gQ2FtZXJhTW92ZU1vZGUuUEFOOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTW9kZUNvbW1hbmQuVG9XYW5kZXI6IG1vZGUgPSBDYW1lcmFNb3ZlTW9kZS5XQU5ERVI7IGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW1pdCgnbW9kZScsIG1vZGUpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0g6YeN572uIC0tLS0tLS0tLS1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLm5vZGUuc2V0V29ybGRQb3NpdGlvbih0aGlzLmhvbWVQb3MpO1xuICAgICAgICB0aGlzLm5vZGUuc2V0V29ybGRSb3RhdGlvbih0aGlzLmhvbWVSb3QpO1xuICAgICAgICB0aGlzLm5vZGUuZ2V0V29ybGRSb3RhdGlvbih0aGlzLl9jdXJSb3QpO1xuICAgICAgICB0aGlzLm5vZGUuZ2V0V29ybGRQb3NpdGlvbih0aGlzLl9jdXJFeWUpO1xuICAgICAgICAodGhpcy5ub2RlIGFzIGFueSkudXBkYXRlV29ybGRUcmFuc2Zvcm0/LigpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0gdmlld0NlbnRlciAtLS0tLS0tLS0tXG5cbiAgICB1cGRhdGVWaWV3Q2VudGVyQnlEaXN0KHZpZXdEaXN0OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5ub2RlLmdldFdvcmxkUG9zaXRpb24odGhpcy5fY3VyRXllKTtcbiAgICAgICAgdGhpcy5ub2RlLmdldFdvcmxkUm90YXRpb24odGhpcy5fY3VyUm90KTtcbiAgICAgICAgVmVjMy50cmFuc2Zvcm1RdWF0KHRoaXMuZm9yd2FyZCwgVmVjMy5VTklUX1osIHRoaXMuX2N1clJvdCk7XG4gICAgICAgIFZlYzMubXVsdGlwbHlTY2FsYXIodGhpcy52M2EsIHRoaXMuZm9yd2FyZCwgdmlld0Rpc3QpO1xuICAgICAgICBWZWMzLmFkZCh0aGlzLl9zY2VuZVZpZXdDZW50ZXIsIHRoaXMuX2N1ckV5ZSwgdGhpcy52M2EpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0g57yp5pS+IC0tLS0tLS0tLS1cblxuICAgIHNjYWxlKGRlbHRhOiBudW1iZXIpIHtcbiAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMudmlld0Rpc3Q7XG4gICAgICAgIGlmIChNYXRoLmFicyhzY2FsYXIpIDwgdGhpcy5fbWluU2NhbGFyKSB7XG4gICAgICAgICAgICBzY2FsYXIgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzT3J0aG8oKSkge1xuICAgICAgICAgICAgbGV0IG5ld09ydGhvSGVpZ2h0ID0gdGhpcy5fY2FtZXJhLm9ydGhvSGVpZ2h0O1xuICAgICAgICAgICAgbmV3T3J0aG9IZWlnaHQgKz0gZGVsdGEgKiB0aGlzLl93aGVlbFNwZWVkICogc2NhbGFyICogdGhpcy5fb3J0aG9TY2FsZTtcbiAgICAgICAgICAgIHRoaXMuc2V0T3J0aG9IZWlnaHQobmV3T3J0aG9IZWlnaHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsdGEgPSB0aGlzLnNtb290aFNjYWxlKGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5nZXRXb3JsZFBvc2l0aW9uKHRoaXMuX2N1ckV5ZSk7XG4gICAgICAgICAgICB0aGlzLm5vZGUuZ2V0V29ybGRSb3RhdGlvbih0aGlzLl9jdXJSb3QpO1xuICAgICAgICAgICAgVmVjMy50cmFuc2Zvcm1RdWF0KHRoaXMuZm9yd2FyZCwgVmVjMy5VTklUX1osIHRoaXMuX2N1clJvdCk7XG5cbiAgICAgICAgICAgIFZlYzMubXVsdGlwbHlTY2FsYXIodGhpcy52M2EsIHRoaXMuZm9yd2FyZCwgZGVsdGEgKiB0aGlzLl93aGVlbFNwZWVkICogc2NhbGFyKTtcbiAgICAgICAgICAgIFZlYzMuYWRkKHRoaXMuX2N1ckV5ZSwgdGhpcy5fY3VyRXllLCB0aGlzLnYzYSk7XG4gICAgICAgICAgICBtYWtlVmVjM0luUmFuZ2UodGhpcy5fY3VyRXllLCAtMWUxMiwgMWUxMik7XG5cbiAgICAgICAgICAgIHRoaXMudmlld0Rpc3QgPSBWZWMzLmRpc3RhbmNlKHRoaXMuX2N1ckV5ZSwgdGhpcy5fc2NlbmVWaWV3Q2VudGVyKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5zZXRXb3JsZFBvc2l0aW9uKHRoaXMuX2N1ckV5ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICBzbW9vdGhTY2FsZShkZWx0YTogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBzbW9vdGhNb3VzZVdoZWVsU2NhbGUoZGVsdGEpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0g54Sm54K5IC0tLS0tLS0tLS1cbiAgICBwcml2YXRlIGZvY3VzQnlOb2RlKG5vZGVzOiBOb2RlW10sIG5vdENoYW5nZURpc3QgPSB0cnVlLCBpbW1lZGlhdGUgPSBmYWxzZSkge1xuICAgICAgICBpZiAobm9kZXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICAgICAgbGV0IHdvcmxkUG9zID0gVmVjMy5aRVJPO1xuICAgICAgICBjb25zdCBwaXZvdCA9IFNlcnZpY2UuR2l6bW8/LnRyYW5zZm9ybVRvb2xEYXRhPy5waXZvdCA/PyAnY2VudGVyJztcblxuICAgICAgICBpZiAocGl2b3QgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICB3b3JsZFBvcyA9IGdldENlbnRlcldvcmxkUG9zM0Qobm9kZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd29ybGRQb3MgPSBnZXRXb3JsZFBvc2l0aW9uM0Qobm9kZXNbbm9kZXMubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF4UmFuZ2UgPSBnZXRNYXhSYW5nZU9mTm9kZXMobm9kZXMpO1xuICAgICAgICBsZXQgZGlzdCA9IHRoaXMudmlld0Rpc3Q7XG5cbiAgICAgICAgaWYgKCFub3RDaGFuZ2VEaXN0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fY2FtZXJhLnByb2plY3Rpb24gPT09IFBFUlNQRUNUSVZFKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgQSA9IG5ldyBWZWMzKDAsIDAsIDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IE1hdGgubWluKHRoaXMuX2NhbWVyYS5jYW1lcmEud2lkdGgsIHRoaXMuX2NhbWVyYS5jYW1lcmEuaGVpZ2h0KSAvIDI7XG4gICAgICAgICAgICAgICAgY29uc3QgQiA9IG5ldyBWZWMzKGxlbmd0aCwgMCwgMSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgd29ybGRBID0gbmV3IFZlYzMoMCwgMCwgMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FtZXJhPy5zY3JlZW5Ub1dvcmxkKEEsIHdvcmxkQSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgd29ybGRCID0gbmV3IFZlYzMoMCwgMCwgMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FtZXJhPy5zY3JlZW5Ub1dvcmxkKEIsIHdvcmxkQik7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzV29ybGQgPSB3b3JsZEEuc3VidHJhY3Qod29ybGRCKS5sZW5ndGgoKTtcbiAgICAgICAgICAgICAgICBkaXN0ID0gTWF0aC5tYXgoKG1heFJhbmdlIC8gbGVuZ3RoKSAqIGRpc1dvcmxkLCB0aGlzLm5lYXIgKiAxLjMpO1xuICAgICAgICAgICAgICAgIGRpc3QgPSBNYXRoLm1pbihkaXN0LCB0aGlzLmZhciAqIDAuOSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2NhbWVyYS5wcm9qZWN0aW9uID09PSBPUlRITykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlcHRoU2l6ZSA9ICh0aGlzLl9jYW1lcmEuZm92IC8gMTgwKSAqIE1hdGguUEkgKiB0aGlzLl9jYW1lcmEub3J0aG9IZWlnaHQ7XG4gICAgICAgICAgICAgICAgZGlzdCA9ICgobWF4UmFuZ2UgKiBkZXB0aFNpemUpIC8gdGhpcy5fY2FtZXJhLm9ydGhvSGVpZ2h0KSAqIDEzO1xuICAgICAgICAgICAgICAgIGxldCBhbmdsZSA9IHRoaXMuX2NhbWVyYS5ub2RlLmV1bGVyQW5nbGVzLnggJSAzNjA7XG4gICAgICAgICAgICAgICAgYW5nbGUgPSBNYXRoLmFicyhhbmdsZSkgPiA5MCA/IDE4MCAtIE1hdGguYWJzKGFuZ2xlKSA6IE1hdGguYWJzKGFuZ2xlKTtcbiAgICAgICAgICAgICAgICBkaXN0ID0gZGlzdCAvIE1hdGguY29zKChhbmdsZSAvIDE4MCkgKiBNYXRoLlBJKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2NlbmVWaWV3Q2VudGVyID0gd29ybGRQb3M7XG5cbiAgICAgICAgdGhpcy5ub2RlLmdldFJvdGF0aW9uKHRoaXMuX2N1clJvdCk7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh0aGlzLmZvcndhcmQsIFZlYzMuVU5JVF9aLCB0aGlzLl9jdXJSb3QpO1xuICAgICAgICBWZWMzLm11bHRpcGx5U2NhbGFyKHRoaXMudjNjLCB0aGlzLmZvcndhcmQsIGRpc3QpO1xuICAgICAgICBWZWMzLmFkZCh0aGlzLnYzZCwgd29ybGRQb3MsIHRoaXMudjNjKTtcblxuICAgICAgICBpZiAodGhpcy5pc09ydGhvKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlcHRoU2l6ZSA9IHRoaXMuZ2V0RGVwdGhTaXplKCk7XG4gICAgICAgICAgICBjb25zdCBuZXdPcnRob0hlaWdodCA9IGRlcHRoU2l6ZSAqIGRpc3Q7XG4gICAgICAgICAgICBpZiAoaW1tZWRpYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FtZXJhLm9ydGhvSGVpZ2h0ID0gbmV3T3J0aG9IZWlnaHQ7XG4gICAgICAgICAgICAgICAgaWYgKFNlcnZpY2UuR2l6bW8/LnRyYW5zZm9ybVRvb2xEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2UuR2l6bW8udHJhbnNmb3JtVG9vbERhdGEuY2FtZXJhT3J0aG9IZWlnaHQgPSBuZXdPcnRob0hlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHdlZW5OdW1iZXIodGhpcy5fY2FtZXJhLm9ydGhvSGVpZ2h0LCBuZXdPcnRob0hlaWdodCwgMzAwKS5zdGVwKChvcnRob0hlaWdodDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jYW1lcmEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhbWVyYS5vcnRob0hlaWdodCA9IG9ydGhvSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFNlcnZpY2UuR2l6bW8/LnRyYW5zZm9ybVRvb2xEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZS5HaXptby50cmFuc2Zvcm1Ub29sRGF0YS5jYW1lcmFPcnRob0hlaWdodCA9IG9ydGhvSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGltbWVkaWF0ZSkge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnNldFBvc2l0aW9uKHRoaXMudjNkKTtcbiAgICAgICAgICAgIFZlYzMuY29weSh0aGlzLl9jdXJFeWUsIHRoaXMudjNkKTtcbiAgICAgICAgICAgIHRoaXMudmlld0Rpc3QgPSBWZWMzLmRpc3RhbmNlKHRoaXMudjNkLCB0aGlzLl9zY2VuZVZpZXdDZW50ZXIpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVHcmlkKCk7XG4gICAgICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRQb3NpdGlvbiA9IHRoaXMubm9kZS5nZXRQb3NpdGlvbigpO1xuICAgICAgICAgICAgdHdlZW5Qb3NpdGlvbihzdGFydFBvc2l0aW9uLCB0aGlzLnYzZCwgMzAwKS5zdGVwKChwb3NpdGlvbjogVmVjMykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5zZXRQb3NpdGlvbihwb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgVmVjMy5jb3B5KHRoaXMuX2N1ckV5ZSwgcG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHRoaXMudmlld0Rpc3QgPSBWZWMzLmRpc3RhbmNlKHBvc2l0aW9uLCB0aGlzLl9zY2VuZVZpZXdDZW50ZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlR3JpZCgpO1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvY3VzKG5vZGVVdWlkcz86IHN0cmluZ1tdIHwgbnVsbCwgZWRpdG9yQ2FtZXJhSW5mbz86IEVkaXRvckNhbWVyYUluZm8sIGltbWVkaWF0ZSA9IGZhbHNlKSB7XG4gICAgICAgIGlmICh0aGlzLmlzTW92aW5nKCkpIHJldHVybjtcbiAgICAgICAgaWYgKCF0aGlzLl9jYW1lcmE/LmNhbWVyYSkgcmV0dXJuO1xuXG4gICAgICAgIGlmIChlZGl0b3JDYW1lcmFJbmZvKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydFBvc2l0aW9uID0gdGhpcy5ub2RlLmdldFBvc2l0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydFJvdGF0aW9uID0gdGhpcy5ub2RlLmdldFJvdGF0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCB7IHBvc2l0aW9uLCByb3RhdGlvbiwgdmlld0NlbnRlciB9ID0gZWRpdG9yQ2FtZXJhSW5mbztcblxuICAgICAgICAgICAgaWYgKHBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VyRXllLnggPSBwb3NpdGlvbi54IHx8IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VyRXllLnkgPSBwb3NpdGlvbi55IHx8IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VyRXllLnogPSBwb3NpdGlvbi56IHx8IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1ckV5ZS54ID0gdGhpcy5ob21lUG9zLnggfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJFeWUueSA9IHRoaXMuaG9tZVBvcy55IHx8IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VyRXllLnogPSB0aGlzLmhvbWVQb3MueiB8fCAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocm90YXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJSb3QueCA9IHJvdGF0aW9uLnggfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJSb3QueSA9IHJvdGF0aW9uLnkgfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJSb3QueiA9IHJvdGF0aW9uLnogfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJSb3QudyA9IHJvdGF0aW9uLncgfHwgMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VyUm90LnggPSB0aGlzLmhvbWVSb3QueCB8fCAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1clJvdC55ID0gdGhpcy5ob21lUm90LnkgfHwgMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJSb3QueiA9IHRoaXMuaG9tZVJvdC56IHx8IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VyUm90LncgPSB0aGlzLmhvbWVSb3QudyB8fCAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNjZW5lVmlld0NlbnRlciA9ICh2aWV3Q2VudGVyIGFzIFZlYzMpIHx8IG5ldyBWZWMzKCk7XG4gICAgICAgICAgICB0aGlzLnZpZXdEaXN0ID0gVmVjMy5kaXN0YW5jZSh0aGlzLl9jdXJFeWUsIHRoaXMuX3NjZW5lVmlld0NlbnRlcik7XG5cbiAgICAgICAgICAgIGlmIChpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUuc2V0UG9zaXRpb24odGhpcy5fY3VyRXllKTtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUuc2V0Um90YXRpb24odGhpcy5fY3VyUm90KTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0d2VlblBvc2l0aW9uKHN0YXJ0UG9zaXRpb24sIHRoaXMuX2N1ckV5ZSwgMzAwKS5zdGVwKChwb3NpdGlvbjogVmVjMykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUuc2V0UG9zaXRpb24ocG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgICAgICAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0d2VlblJvdGF0aW9uKHN0YXJ0Um90YXRpb24sIHRoaXMuX2N1clJvdCwgMzAwKS5zdGVwKChyb3RhdGlvbjogUXVhdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUuc2V0Um90YXRpb24ocm90YXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChub2RlVXVpZHMgJiYgbm9kZVV1aWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IEVkaXRvckV4dGVuZHMgPSAoY2MgYXMgYW55KS5FZGl0b3JFeHRlbmRzIHx8IChnbG9iYWxUaGlzIGFzIGFueSkuRWRpdG9yRXh0ZW5kcztcbiAgICAgICAgICAgIGlmICghRWRpdG9yRXh0ZW5kcykgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBub2RlczogTm9kZVtdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2Ygbm9kZVV1aWRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IEVkaXRvckV4dGVuZHMuTm9kZS5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChub2RlKSBub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vZGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aGlzLmxhc3RGb2N1c05vZGVVVUlEID0gbm9kZVV1aWRzLnNsaWNlKCk7XG4gICAgICAgICAgICB0aGlzLmZvY3VzQnlOb2RlKG5vZGVzLCBmYWxzZSwgaW1tZWRpYXRlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvY3VzQnlYWShoaXRQb2ludDogVmVjMywgaW1tZWRpYXRlID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNNb3ZpbmcoKSkgcmV0dXJuO1xuICAgICAgICBpZiAoIXRoaXMuX2NhbWVyYT8uY2FtZXJhKSByZXR1cm47XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IG5ldyBOb2RlKCk7XG4gICAgICAgIG5vZGUucG9zaXRpb24uc2V0KGhpdFBvaW50KTtcbiAgICAgICAgdGhpcy5mb2N1c0J5Tm9kZShbbm9kZV0sIHRydWUsIGltbWVkaWF0ZSk7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDlr7npvZAgLS0tLS0tLS0tLVxuXG4gICAgYXN5bmMgYWxpZ25Ob2RlVG9TY2VuZVZpZXcobm9kZVV1aWRzOiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIW5vZGVVdWlkcyB8fCBub2RlVXVpZHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgRWRpdG9yRXh0ZW5kcyA9IChjYyBhcyBhbnkpLkVkaXRvckV4dGVuZHMgfHwgKGdsb2JhbFRoaXMgYXMgYW55KS5FZGl0b3JFeHRlbmRzO1xuICAgICAgICBpZiAoIUVkaXRvckV4dGVuZHMpIHJldHVybjtcblxuICAgICAgICBjb25zdCBub2RlczogTm9kZVtdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBub2RlVXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBFZGl0b3JFeHRlbmRzLk5vZGUuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGlmIChub2RlKSBub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2Rlcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgICAgICBjb25zdCB1dWlkcyA9IG5vZGVzLm1hcChub2RlID0+IG5vZGUudXVpZCk7XG4gICAgICAgIGNvbnN0IHVuZG9JZCA9IGF3YWl0IFNlcnZpY2UuVW5kbz8uYmVnaW5SZWNvcmRpbmc/Lih1dWlkcyk7XG5cbiAgICAgICAgY29uc3QgYmFzZU5vZGUgPSBub2Rlc1swXTtcbiAgICAgICAgY29uc3Qgb2xkQmFzZVdvcmxkTWF0cml4ID0gTWF0NC5mcm9tUlQobmV3IE1hdDQoKSwgYmFzZU5vZGUuZ2V0V29ybGRSb3RhdGlvbigpLCBiYXNlTm9kZS5nZXRXb3JsZFBvc2l0aW9uKCkpO1xuICAgICAgICBNYXQ0LmludmVydChvbGRCYXNlV29ybGRNYXRyaXgsIG9sZEJhc2VXb3JsZE1hdHJpeCk7XG4gICAgICAgIGNvbnN0IG9sZEJhc2VSb3RJbnYgPSBiYXNlTm9kZS5nZXRXb3JsZFJvdGF0aW9uKCk7XG4gICAgICAgIFF1YXQuaW52ZXJ0KG9sZEJhc2VSb3RJbnYsIG9sZEJhc2VSb3RJbnYpO1xuXG4gICAgICAgIGNvbnN0IGNhbWVyYVBvcyA9IHRoaXMubm9kZS5nZXRXb3JsZFBvc2l0aW9uKCk7XG4gICAgICAgIGNvbnN0IGNhbWVyYVJvdCA9IHRoaXMubm9kZS5nZXRXb3JsZFJvdGF0aW9uKCk7XG4gICAgICAgIGNvbnN0IG5ld0Jhc2VNYXRyaXggPSBNYXQ0LmZyb21SVChuZXcgTWF0NCgpLCBjYW1lcmFSb3QsIGNhbWVyYVBvcyk7XG5cbiAgICAgICAgYmFzZU5vZGUuc2V0V29ybGRQb3NpdGlvbihjYW1lcmFQb3MpO1xuICAgICAgICBiYXNlTm9kZS5zZXRXb3JsZFJvdGF0aW9uKGNhbWVyYVJvdCk7XG4gICAgICAgIHRoaXMuYWxpZ25DYW1lcmFPcnRob0hlaWdodFRvTm9kZShiYXNlTm9kZS5nZXRDb21wb25lbnRzKENhbWVyYSBhcyBhbnkpIGFzIENhbWVyYVtdKTtcblxuICAgICAgICBpZiAobm9kZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCBwb3MgPSBub2RlLmdldFdvcmxkUG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgICBjb25zdCByb3QgPSBub2RlLmdldFdvcmxkUm90YXRpb24oKTtcblxuICAgICAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NChwb3MsIHBvcywgb2xkQmFzZVdvcmxkTWF0cml4KTtcbiAgICAgICAgICAgICAgICBRdWF0Lm11bHRpcGx5KHJvdCwgb2xkQmFzZVJvdEludiwgcm90KTtcblxuICAgICAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtTWF0NChwb3MsIHBvcywgbmV3QmFzZU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRXb3JsZFBvc2l0aW9uKHBvcyk7XG4gICAgICAgICAgICAgICAgUXVhdC5tdWx0aXBseShyb3QsIGNhbWVyYVJvdCwgcm90KTtcbiAgICAgICAgICAgICAgICBub2RlLnNldFdvcmxkUm90YXRpb24ocm90KTtcbiAgICAgICAgICAgICAgICB0aGlzLmFsaWduQ2FtZXJhT3J0aG9IZWlnaHRUb05vZGUobm9kZS5nZXRDb21wb25lbnRzKENhbWVyYSBhcyBhbnkpIGFzIENhbWVyYVtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1bmRvSWQpIGF3YWl0IFNlcnZpY2UuVW5kbz8uZW5kUmVjb3JkaW5nPy4odW5kb0lkKTtcbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFsaWduQ2FtZXJhT3J0aG9IZWlnaHRUb05vZGUoY2FtZXJhQ29tcG9uZW50OiBDYW1lcmFbXSkge1xuICAgICAgICBpZiAoY2FtZXJhQ29tcG9uZW50Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY29uc3QgY2FtZXJhID0gY2FtZXJhQ29tcG9uZW50WzBdO1xuICAgICAgICAgICAgaWYgKGNhbWVyYSAmJiBjYW1lcmEucHJvamVjdGlvbiA9PT0gT1JUSE8pIHtcbiAgICAgICAgICAgICAgICBjYW1lcmEub3J0aG9IZWlnaHQgPSB0aGlzLl9jYW1lcmEub3J0aG9IZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbGlnblNjZW5lVmlld1RvTm9kZShub2RlVXVpZHM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICghbm9kZVV1aWRzIHx8IG5vZGVVdWlkcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgICAgICBjb25zdCBFZGl0b3JFeHRlbmRzID0gKGNjIGFzIGFueSkuRWRpdG9yRXh0ZW5kcyB8fCAoZ2xvYmFsVGhpcyBhcyBhbnkpLkVkaXRvckV4dGVuZHM7XG4gICAgICAgIGlmICghRWRpdG9yRXh0ZW5kcykgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG5vZGVzOiBOb2RlW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIG5vZGVVdWlkcykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IEVkaXRvckV4dGVuZHMuTm9kZS5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgaWYgKG5vZGUpIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGJhc2VOb2RlID0gbm9kZXNbMF07XG4gICAgICAgIGNvbnN0IHBvcyA9IGJhc2VOb2RlLmdldFdvcmxkUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3Qgcm90ID0gYmFzZU5vZGUuZ2V0V29ybGRSb3RhdGlvbigpO1xuICAgICAgICB0aGlzLm5vZGUuc2V0V29ybGRQb3NpdGlvbihwb3MpO1xuICAgICAgICB0aGlzLm5vZGUuc2V0V29ybGRSb3RhdGlvbihyb3QpO1xuICAgICAgICB0aGlzLnVwZGF0ZVZpZXdDZW50ZXJCeURpc3QoLXRoaXMudmlld0Rpc3QpO1xuICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcblxuICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0g6byg5qCHL+mUruebmOS6i+S7tiAtLS0tLS0tLS0tXG4gICAgaXNNb3ZpbmcoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tb2RlRlNNPy5jdXJyZW50U3RhdGUgIT09IHRoaXMuX2lkbGVNb2RlO1xuICAgIH1cblxuICAgIG9uTW91c2VEQmxEb3duKGV2ZW50OiBJU2NlbmVNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5fbW9kZUZTTSkgcmV0dXJuO1xuICAgICAgICBjb25zdCBpc1ZpZXdNb2RlID0gISFTZXJ2aWNlLkdpem1vPy5pc1ZpZXdNb2RlO1xuICAgICAgICBpZiAoaXNWaWV3TW9kZSkge1xuICAgICAgICAgICAgY29uc3QgeCA9IGV2ZW50Lng7XG4gICAgICAgICAgICBjb25zdCB5ID0gZ2V0TWFpbldpbmRvd1NpemUoKS5oZWlnaHQgLSBldmVudC55O1xuICAgICAgICAgICAgbGV0IHJlc3VsdHMgPSBnZXRSYXljYXN0UmVzdWx0c0ZvclNuYXAodGhpcy5fY2FtZXJhLCB4LCB5KTtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyZXN1bHQgPT4gIShyZXN1bHQubm9kZS5vYmpGbGFncyAmIENDT2JqZWN0LkZsYWdzLkhpZGVJbkhpZXJhcmNoeSkpIGFzIHR5cGVvZiByZXN1bHRzO1xuICAgICAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXNCeVhZKHJlc3VsdHNbMF0uaGl0UG9pbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAodGhpcy5fbW9kZUZTTS5jdXJyZW50U3RhdGUgYXMgTW9kZUJhc2UzRCkub25Nb3VzZURCbERvd24oZXZlbnQpO1xuICAgIH1cblxuICAgIG9uTW91c2VEb3duKGV2ZW50OiBJU2NlbmVNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5fbW9kZUZTTSkgcmV0dXJuO1xuICAgICAgICB0aGlzLmFsdEtleSA9IGV2ZW50LmFsdEtleTtcbiAgICAgICAgdGhpcy5zaGlmdEtleSA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgICAgICB0aGlzLm1vdXNlUHJlc3NpbmcgPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IGlzVmlld01vZGUgPSAhIVNlcnZpY2UuR2l6bW8/LmlzVmlld01vZGU7XG4gICAgICAgIGlmIChldmVudC5taWRkbGVCdXR0b24gfHwgKCFldmVudC5yaWdodEJ1dHRvbiAmJiBpc1ZpZXdNb2RlKSkge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VNb2RlKE1vZGVDb21tYW5kLlRvUGFuKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5yaWdodEJ1dHRvbiAmJiAhZXZlbnQubGVmdEJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VNb2RlKE1vZGVDb21tYW5kLlRvV2FuZGVyKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5sZWZ0QnV0dG9uKSB7XG4gICAgICAgICAgICBpZiAoKHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlIGFzIE1vZGVCYXNlM0QpLm1vZGVOYW1lID09PSBDYW1lcmFNb3ZlTW9kZS5XQU5ERVIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZU1vZGUoTW9kZUNvbW1hbmQuVG9JZGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAodGhpcy5fbW9kZUZTTS5jdXJyZW50U3RhdGUgYXMgTW9kZUJhc2UzRCkub25Nb3VzZURvd24oZXZlbnQpO1xuICAgIH1cblxuICAgIG9uTW91c2VNb3ZlKGV2ZW50OiBJU2NlbmVNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5fbW9kZUZTTSkgcmV0dXJuO1xuICAgICAgICB0aGlzLnNoaWZ0S2V5ID0gZXZlbnQuc2hpZnRLZXk7XG4gICAgICAgIHRoaXMuYWx0S2V5ID0gZXZlbnQuYWx0S2V5O1xuXG4gICAgICAgIGlmIChldmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgIGlmICgodGhpcy5fbW9kZUZTTS5jdXJyZW50U3RhdGUgYXMgTW9kZUJhc2UzRCkubW9kZU5hbWUgIT09IENhbWVyYU1vdmVNb2RlLk9SQklUKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VNb2RlKE1vZGVDb21tYW5kLlRvT3JiaXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCh0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTNEKS5tb2RlTmFtZSA9PT0gQ2FtZXJhTW92ZU1vZGUuT1JCSVQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZU1vZGUoTW9kZUNvbW1hbmQuVG9JZGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAodGhpcy5fbW9kZUZTTS5jdXJyZW50U3RhdGUgYXMgTW9kZUJhc2UzRCkub25Nb3VzZU1vdmUoZXZlbnQpO1xuICAgIH1cblxuICAgIG9uTW91c2VVcChldmVudDogSVNjZW5lTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoIXRoaXMuX21vZGVGU00pIHJldHVybjtcbiAgICAgICAgdGhpcy5tb3VzZVByZXNzaW5nID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3QgaXNWaWV3TW9kZSA9ICEhU2VydmljZS5HaXptbz8uaXNWaWV3TW9kZTtcbiAgICAgICAgaWYgKGV2ZW50Lm1pZGRsZUJ1dHRvbiB8fCAoIWV2ZW50LnJpZ2h0QnV0dG9uICYmIGlzVmlld01vZGUpKSB7XG4gICAgICAgICAgICBpZiAoKHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlIGFzIE1vZGVCYXNlM0QpLm1vZGVOYW1lID09PSBDYW1lcmFNb3ZlTW9kZS5QQU4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZU1vZGUoTW9kZUNvbW1hbmQuVG9JZGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5yaWdodEJ1dHRvbikge1xuICAgICAgICAgICAgaWYgKCh0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTNEKS5tb2RlTmFtZSA9PT0gQ2FtZXJhTW92ZU1vZGUuV0FOREVSKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VNb2RlKE1vZGVDb21tYW5kLlRvSWRsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNWaWV3TW9kZSkge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VNb2RlKE1vZGVDb21tYW5kLlRvSWRsZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlIGFzIE1vZGVCYXNlM0QpLm9uTW91c2VVcChldmVudCk7XG4gICAgfVxuXG4gICAgb25Nb3VzZVdoZWVsKGV2ZW50OiBJU2NlbmVNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5fbW9kZUZTTSkgcmV0dXJuO1xuICAgICAgICBpZiAoKHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlIGFzIE1vZGVCYXNlM0QpLm1vZGVOYW1lICE9PSBDYW1lcmFNb3ZlTW9kZS5XQU5ERVIpIHtcbiAgICAgICAgICAgIGxldCBkZWx0YVkgPSBldmVudC5kZWx0YVk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoZGVsdGFZIC0gdGhpcy5sYXN0TW91c2VXaGVlbERlbHRhWSkgPiB0aGlzLm1heE1vdXNlV2hlZWxEZWx0YVkpIHtcbiAgICAgICAgICAgICAgICBkZWx0YVkgPSB0aGlzLmxhc3RNb3VzZVdoZWVsRGVsdGFZICsgTWF0aC5zaWduKGRlbHRhWSkgKiB0aGlzLm1heE1vdXNlV2hlZWxEZWx0YVk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNjYWxlKGRlbHRhWSAqIHRoaXMuX3doZWVsQmFzZVNjYWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgICh0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTNEKS5vbk1vdXNlV2hlZWwoZXZlbnQpO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgIH1cblxuICAgIG9uS2V5RG93bihldmVudDogSVNjZW5lS2V5Ym9hcmRFdmVudCkge1xuICAgICAgICBpZiAoIXRoaXMuX21vZGVGU00pIHJldHVybjtcbiAgICAgICAgdGhpcy5zaGlmdEtleSA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgICAgICB0aGlzLmFsdEtleSA9IGV2ZW50LmFsdEtleTtcblxuICAgICAgICBpZiAoZXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICBpZiAoKHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlIGFzIE1vZGVCYXNlM0QpLm1vZGVOYW1lICE9PSBDYW1lcmFNb3ZlTW9kZS5PUkJJVCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTW9kZShNb2RlQ29tbWFuZC5Ub09yYml0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleSA9IGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgY2FzZSAnICc6XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VNb2RlKE1vZGVDb21tYW5kLlRvUGFuKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgICh0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTNEKS5vbktleURvd24oZXZlbnQpO1xuICAgIH1cblxuICAgIG9uS2V5VXAoZXZlbnQ6IElTY2VuZUtleWJvYXJkRXZlbnQpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tb2RlRlNNKSByZXR1cm47XG4gICAgICAgIHRoaXMuc2hpZnRLZXkgPSBldmVudC5zaGlmdEtleTtcbiAgICAgICAgdGhpcy5hbHRLZXkgPSBldmVudC5hbHRLZXk7XG5cbiAgICAgICAgaWYgKCFldmVudC5hbHRLZXkgJiYgIXRoaXMubW91c2VQcmVzc2luZykge1xuICAgICAgICAgICAgaWYgKCh0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTNEKS5tb2RlTmFtZSA9PT0gQ2FtZXJhTW92ZU1vZGUuT1JCSVQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZU1vZGUoTW9kZUNvbW1hbmQuVG9JZGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleSA9IGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgY2FzZSAnICc6XG4gICAgICAgICAgICAgICAgaWYgKCh0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTNEKS5tb2RlTmFtZSA9PT0gQ2FtZXJhTW92ZU1vZGUuUEFOKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTW9kZShNb2RlQ29tbWFuZC5Ub0lkbGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgICh0aGlzLl9tb2RlRlNNLmN1cnJlbnRTdGF0ZSBhcyBNb2RlQmFzZTNEKS5vbktleVVwKGV2ZW50KTtcbiAgICB9XG5cbiAgICBvblVwZGF0ZShkZWx0YVRpbWU6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuX21vZGVGU00pIHJldHVybjtcbiAgICAgICAgKHRoaXMuX21vZGVGU00uY3VycmVudFN0YXRlIGFzIE1vZGVCYXNlM0QpLm9uVXBkYXRlKGRlbHRhVGltZSk7XG4gICAgfVxuXG4gICAgb25SZXNpemUoc2l6ZT86IElTaXplTGlrZSkge1xuICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tIOe9keagvCAtLS0tLS0tLS0tXG5cbiAgICBwcml2YXRlIF91cGRhdGVHcmlkRGF0YShwb3NpdGlvbnM6IG51bWJlcltdLCBjb2xvcnM6IG51bWJlcltdLCBsaW5lQ29sb3I6IENvbG9yKSB7XG4gICAgICAgIGNvbnN0IGNhbWVyYVBvcyA9IG5ldyBWZWMzKCk7XG4gICAgICAgIHRoaXMubm9kZS5nZXRQb3NpdGlvbihjYW1lcmFQb3MpO1xuXG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gY2FtZXJhUG9zLnk7XG4gICAgICAgIGNvbnN0IHNjYWxlID0gZGlzdGFuY2UgLyA1MDA7XG4gICAgICAgIGNvbnN0IHJhbmdlID0gNTAwMDtcbiAgICAgICAgY29uc3Qgc2NhbGVSYW5nZSA9IChyYW5nZSAqIHNjYWxlKSB8IDA7XG5cbiAgICAgICAgY29uc3QgY3VyU3RhcnRYID0gLXNjYWxlUmFuZ2UgKyBjYW1lcmFQb3MueDtcbiAgICAgICAgY29uc3QgY3VyRW5kWCA9IHNjYWxlUmFuZ2UgKyBjYW1lcmFQb3MueDtcbiAgICAgICAgY29uc3QgY3VyU3RhcnRZID0gLXNjYWxlUmFuZ2UgKyBjYW1lcmFQb3MuejtcbiAgICAgICAgY29uc3QgY3VyRW5kWSA9IHNjYWxlUmFuZ2UgKyBjYW1lcmFQb3MuejtcbiAgICAgICAgdGhpcy5oVGlja3MucmFuZ2UoY3VyU3RhcnRYLCBjdXJFbmRYLCByYW5nZSk7XG4gICAgICAgIHRoaXMudlRpY2tzLnJhbmdlKGN1clN0YXJ0WSwgY3VyRW5kWSwgcmFuZ2UpO1xuXG4gICAgICAgIGNvbnN0IHIgPSBsaW5lQ29sb3IuciAvIDI1NTtcbiAgICAgICAgY29uc3QgZyA9IGxpbmVDb2xvci5nIC8gMjU1O1xuICAgICAgICBjb25zdCBiID0gbGluZUNvbG9yLmIgLyAyNTU7XG4gICAgICAgIGNvbnN0IGxpbmVPcGFjaXR5ID0gMjAwIC8gMjU1O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmhUaWNrcy5taW5UaWNrTGV2ZWw7IGkgPD0gdGhpcy5oVGlja3MubWF4VGlja0xldmVsOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gdGhpcy5oVGlja3MudGlja1JhdGlvc1tpXTtcbiAgICAgICAgICAgIGlmIChyYXRpbyA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aWNrcyA9IHRoaXMuaFRpY2tzLnRpY2tzQXRMZXZlbChpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRpY2tzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpY2sgPSB0aWNrc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3JpZ2luQXhpc1hfVmlzaWJsZSAmJiAwID09PSB0aWNrKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9ucy5sZW5ndGggLyAyID49IF9tYXhUaWNrcyAqIF9tYXhUaWNrcyAtIDQpIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBhbHBoYSA9IHJhdGlvICogbGluZU9wYWNpdHk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3QgPSBNYXRoLmFicyh0aWNrIC0gY2FtZXJhUG9zLngpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGVSYW5nZSA+IDApIGFscGhhICo9IDEgLSBkaXN0IC8gc2NhbGVSYW5nZTtcblxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCh0aWNrLCBjYW1lcmFQb3Mueik7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHRpY2ssIGN1clN0YXJ0WSk7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHRpY2ssIGNhbWVyYVBvcy56KTtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2godGljaywgY3VyRW5kWSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKHIsIGcsIGIsIGFscGhhKTtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JzLnB1c2gociwgZywgYiwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9ycy5wdXNoKHIsIGcsIGIsIGFscGhhKTtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JzLnB1c2gociwgZywgYiwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMudlRpY2tzLm1pblRpY2tMZXZlbDsgaSA8PSB0aGlzLnZUaWNrcy5tYXhUaWNrTGV2ZWw7ICsraSkge1xuICAgICAgICAgICAgY29uc3QgcmF0aW8gPSB0aGlzLnZUaWNrcy50aWNrUmF0aW9zW2ldO1xuICAgICAgICAgICAgaWYgKHJhdGlvID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpY2tzID0gdGhpcy52VGlja3MudGlja3NBdExldmVsKGksIHRydWUpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGlja3MubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGljayA9IHRpY2tzW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcmlnaW5BeGlzWl9WaXNpYmxlICYmIDAgPT09IHRpY2spIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb25zLmxlbmd0aCAvIDIgPj0gX21heFRpY2tzICogX21heFRpY2tzIC0gNCkgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IGFscGhhID0gcmF0aW8gKiBsaW5lT3BhY2l0eTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzdCA9IE1hdGguYWJzKHRpY2sgLSBjYW1lcmFQb3Mueik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZVJhbmdlID4gMCkgYWxwaGEgKj0gMSAtIGRpc3QgLyBzY2FsZVJhbmdlO1xuXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKGNhbWVyYVBvcy54LCB0aWNrKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goY3VyU3RhcnRYLCB0aWNrKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goY2FtZXJhUG9zLngsIHRpY2spO1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaChjdXJFbmRYLCB0aWNrKTtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JzLnB1c2gociwgZywgYiwgYWxwaGEpO1xuICAgICAgICAgICAgICAgICAgICBjb2xvcnMucHVzaChyLCBnLCBiLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JzLnB1c2gociwgZywgYiwgYWxwaGEpO1xuICAgICAgICAgICAgICAgICAgICBjb2xvcnMucHVzaChyLCBnLCBiLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVHcmlkKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2dyaWRNZXNoQ29tcCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgY29uc3QgY29sb3JzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBjb25zdCBpbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICB0aGlzLl91cGRhdGVHcmlkRGF0YShwb3NpdGlvbnMsIGNvbG9ycywgdGhpcy5fbGluZUNvbG9yKTtcblxuICAgICAgICBpZiAocG9zaXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkgLyAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENhbWVyYVV0aWxzLnVwZGF0ZVZCQXR0cih0aGlzLl9ncmlkTWVzaENvbXAsIGdmeC5BdHRyaWJ1dGVOYW1lLkFUVFJfUE9TSVRJT04sIHBvc2l0aW9ucyk7XG4gICAgICAgICAgICBDYW1lcmFVdGlscy51cGRhdGVWQkF0dHIodGhpcy5fZ3JpZE1lc2hDb21wLCBnZnguQXR0cmlidXRlTmFtZS5BVFRSX0NPTE9SLCBjb2xvcnMpO1xuICAgICAgICAgICAgQ2FtZXJhVXRpbHMudXBkYXRlSUIodGhpcy5fZ3JpZE1lc2hDb21wLCBpbmRpY2VzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbkF4aXMoKTtcbiAgICB9XG5cbiAgICByZWZyZXNoKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tIOaXi+i9rOebuOacuuWIsOaMh+WumuaWueWQkSAtLS0tLS0tLS0tXG5cbiAgICByb3RhdGVDYW1lcmFUb0RpcihkaXI6IFZlYzMsIHJvdGF0ZUJ5Vmlld0Rpc3Q6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3Qgc3RhcnRQb3NpdGlvbiA9IG5ldyBWZWMzKCk7XG4gICAgICAgIGNvbnN0IHN0YXJ0Um90YXRpb24gPSBuZXcgUXVhdCgpO1xuICAgICAgICB0aGlzLm5vZGUuZ2V0UG9zaXRpb24oc3RhcnRQb3NpdGlvbik7XG4gICAgICAgIHRoaXMubm9kZS5nZXRSb3RhdGlvbihzdGFydFJvdGF0aW9uKTtcblxuICAgICAgICBRdWF0LnJvdGF0aW9uVG8odGhpcy5fY3VyUm90LCBWZWMzLlVOSVRfWiwgZGlyKTtcblxuICAgICAgICBjb25zdCBvZmZzZXQgPSBuZXcgVmVjMygpO1xuICAgICAgICBpZiAocm90YXRlQnlWaWV3RGlzdCkge1xuICAgICAgICAgICAgb2Zmc2V0LnogPSB0aGlzLnZpZXdEaXN0O1xuICAgICAgICAgICAgVmVjMy50cmFuc2Zvcm1RdWF0KG9mZnNldCwgb2Zmc2V0LCB0aGlzLl9jdXJSb3QpO1xuICAgICAgICAgICAgVmVjMy5hZGQodGhpcy5fY3VyRXllLCB0aGlzLl9zY2VuZVZpZXdDZW50ZXIsIG9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICB0d2VlblBvc2l0aW9uKHN0YXJ0UG9zaXRpb24sIHRoaXMuX2N1ckV5ZSwgMzAwKS5zdGVwKChwb3NpdGlvbjogVmVjMykgPT4ge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlR3JpZCgpO1xuICAgICAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHR3ZWVuUm90YXRpb24oc3RhcnRSb3RhdGlvbiwgdGhpcy5fY3VyUm90LCAzMDApLnN0ZXAoKHJvdGF0aW9uOiBRdWF0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm5vZGUuc2V0Um90YXRpb24ocm90YXRpb24pO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVHcmlkKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0g5oqV5b2x55u45YWzIC0tLS0tLS0tLS1cblxuICAgIGdldERlcHRoU2l6ZSgpOiBudW1iZXIge1xuICAgICAgICBjb25zdCBmb3YgPSB0aGlzLl9jYW1lcmEuZm92O1xuICAgICAgICByZXR1cm4gTWF0aC50YW4oKChmb3YgLyAyKSAqIE1hdGguUEkpIC8gMTgwKTtcbiAgICB9XG5cbiAgICBjYWxjQ2FtZXJhUG9zSW5PcnRobygpOiBWZWMzIHtcbiAgICAgICAgY29uc3QgZGVwdGhTaXplID0gdGhpcy5nZXREZXB0aFNpemUoKTtcbiAgICAgICAgY29uc3QgbWluRGlzdCA9IHRoaXMuX2NhbWVyYS5vcnRob0hlaWdodCAvIGRlcHRoU2l6ZTtcbiAgICAgICAgaWYgKHRoaXMudmlld0Rpc3QgPCBtaW5EaXN0KSB7XG4gICAgICAgICAgICB0aGlzLnZpZXdEaXN0ID0gbWluRGlzdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubm9kZS5nZXRXb3JsZFJvdGF0aW9uKHRoaXMuX2N1clJvdCk7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh0aGlzLmZvcndhcmQsIFZlYzMuVU5JVF9aLCB0aGlzLl9jdXJSb3QpO1xuICAgICAgICBWZWMzLm5vcm1hbGl6ZSh0aGlzLmZvcndhcmQsIHRoaXMuZm9yd2FyZCk7XG4gICAgICAgIFZlYzMubXVsdGlwbHlTY2FsYXIodGhpcy52M2EsIHRoaXMuZm9yd2FyZCwgdGhpcy52aWV3RGlzdCk7XG4gICAgICAgIFZlYzMuYWRkKHRoaXMudjNiLCB0aGlzLl9zY2VuZVZpZXdDZW50ZXIsIHRoaXMudjNhKTtcblxuICAgICAgICByZXR1cm4gdGhpcy52M2I7XG4gICAgfVxuXG4gICAgaXNPcnRobygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhbWVyYS5wcm9qZWN0aW9uID09PSBPUlRITztcbiAgICB9XG5cbiAgICBzZXRPcnRob0hlaWdodChuZXdPcnRob0hlaWdodDogbnVtYmVyKSB7XG4gICAgICAgIGlmIChuZXdPcnRob0hlaWdodCA8IDApIHtcbiAgICAgICAgICAgIG5ld09ydGhvSGVpZ2h0ID0gMC4wMTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jYW1lcmEub3J0aG9IZWlnaHQgPSBuZXdPcnRob0hlaWdodDtcbiAgICAgICAgaWYgKFNlcnZpY2UuR2l6bW8/LnRyYW5zZm9ybVRvb2xEYXRhKSB7XG4gICAgICAgICAgICBTZXJ2aWNlLkdpem1vLnRyYW5zZm9ybVRvb2xEYXRhLmNhbWVyYU9ydGhvSGVpZ2h0ID0gbmV3T3J0aG9IZWlnaHQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGFuZ2VQcm9qZWN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pc09ydGhvKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbWVyYVBvcyA9IHRoaXMuY2FsY0NhbWVyYVBvc0luT3J0aG8oKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5zZXRXb3JsZFBvc2l0aW9uKGNhbWVyYVBvcyk7XG4gICAgICAgICAgICB0aGlzLl9jYW1lcmEucHJvamVjdGlvbiA9IFBFUlNQRUNUSVZFO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdwcm9qZWN0aW9uLWNoYW5nZWQnLCBQRVJTUEVDVElWRSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbWVyYS5wcm9qZWN0aW9uID0gT1JUSE87XG4gICAgICAgICAgICBjb25zdCBkZXB0aFNpemUgPSB0aGlzLmdldERlcHRoU2l6ZSgpO1xuICAgICAgICAgICAgY29uc3QgbmV3T3J0aG9IZWlnaHQgPSBkZXB0aFNpemUgKiB0aGlzLnZpZXdEaXN0O1xuICAgICAgICAgICAgdGhpcy5zZXRPcnRob0hlaWdodChuZXdPcnRob0hlaWdodCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3Byb2plY3Rpb24tY2hhbmdlZCcsIE9SVEhPKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLSDnvKnmlL7lv6vmjbfplK4gLS0tLS0tLS0tLVxuXG4gICAgem9vbVVwKCkge1xuICAgICAgICB0aGlzLnNjYWxlKDIwKTtcbiAgICB9XG5cbiAgICB6b29tRG93bigpIHtcbiAgICAgICAgdGhpcy5zY2FsZSgtMjApO1xuICAgIH1cblxuICAgIHpvb21SZXNldCgpIHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cblxuICAgIG9uRGVzaWduUmVzb2x1dGlvbkNoYW5nZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVHcmlkKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDYW1lcmFDb250cm9sbGVyM0Q7XG4iXX0=