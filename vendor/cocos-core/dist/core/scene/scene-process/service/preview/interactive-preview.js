"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractivePreview = void 0;
exports.getBoundaryOfMeshNodes = getBoundaryOfMeshNodes;
const cc_1 = require("cc");
const buffer_1 = __importDefault(require("./buffer"));
const preview_base_1 = require("./preview-base");
const preview_axis_1 = require("./preview-axis");
const grid_1 = require("./grid");
const camera_controller_3d_1 = require("../camera/camera-controller-3d");
const decorator_1 = require("../core/decorator");
const tempVec3A = new cc_1.Vec3();
const tempVec3B = new cc_1.Vec3();
function getBoundaryOfMeshNodes(nodes) {
    let minPos = new cc_1.Vec3(Infinity, Infinity, Infinity);
    let maxPos = new cc_1.Vec3(-Infinity, -Infinity, -Infinity);
    let found = false;
    for (const node of nodes) {
        const renderers = node.getComponentsInChildren('cc.MeshRenderer');
        for (const mr of renderers) {
            const model = mr.model;
            if (model && model.worldBounds) {
                const bounds = model.worldBounds;
                const bMin = new cc_1.Vec3(bounds.center.x - bounds.halfExtents.x, bounds.center.y - bounds.halfExtents.y, bounds.center.z - bounds.halfExtents.z);
                const bMax = new cc_1.Vec3(bounds.center.x + bounds.halfExtents.x, bounds.center.y + bounds.halfExtents.y, bounds.center.z + bounds.halfExtents.z);
                cc_1.Vec3.min(minPos, minPos, bMin);
                cc_1.Vec3.max(maxPos, maxPos, bMax);
                found = true;
            }
        }
    }
    if (!found)
        return null;
    const center = new cc_1.Vec3();
    cc_1.Vec3.add(center, minPos, maxPos);
    cc_1.Vec3.multiplyScalar(center, center, 0.5);
    const halfExtents = new cc_1.Vec3();
    cc_1.Vec3.subtract(halfExtents, maxPos, minPos);
    cc_1.Vec3.multiplyScalar(halfExtents, halfExtents, 0.5);
    return new cc_1.geometry.AABB(center.x, center.y, center.z, halfExtents.x, halfExtents.y, halfExtents.z);
}
function makeVec3InRange(v, min, max) {
    v.x = Math.max(min, Math.min(max, v.x));
    v.y = Math.max(min, Math.min(max, v.y));
    v.z = Math.max(min, Math.min(max, v.z));
}
class InteractivePreview extends preview_base_1.PreviewBase {
    scene;
    cameraComp;
    camera;
    isMouseLeft = false;
    isMouseMiddle = false;
    enableResetCamera = true;
    enableViewToggle = true;
    enableGrid = true;
    grid = null;
    enableAxis = true;
    worldAxis = null;
    is2D = false;
    enableSkybox = true;
    skybox = null;
    async queryPreviewData(info) {
        this.ensurePreviewGlobalsActive();
        this.previewBuffer.ensureWindow(info.width, info.height);
        this.ensureCameraAttached();
        if (this.worldAxis && this.previewBuffer?.window) {
            this.worldAxis._sceneGizmoCamera.camera.changeTargetWindow(this.previewBuffer.window);
            if (this.enableAxis) {
                this.worldAxis.show();
            }
        }
        return super.queryPreviewData(info);
    }
    ensurePreviewGlobalsActive() {
        if (!this.enableSkybox)
            return;
        const psd = cc.director.root?.pipeline?.pipelineSceneData;
        if (!psd?.skybox)
            return;
        if (!psd.skybox.enabled) {
            this.scene.globals.activate(this.scene);
        }
    }
    _minScalar = 1;
    orthoScale = 0.1;
    get isOrtho() {
        return this.cameraComp.projection === cc_1.Camera.ProjectionType.ORTHO;
    }
    get wheelSpeed() {
        try {
            const cam = decorator_1.Service.Camera;
            if (this.isOrtho) {
                return cam.controller2D?.wheelSpeed ?? 6;
            }
            return cam.controller3D?.wheelSpeed ?? 0.01;
        }
        catch {
            return this.isOrtho ? 6 : 0.01;
        }
    }
    get scale2D() {
        try {
            return decorator_1.Service.Gizmo?.transformToolData?.scale2D ?? 1;
        }
        catch {
            return 1;
        }
    }
    wheelBaseScale = 1 / 12;
    lastMouseWheelDeltaY = 0;
    maxMouseWheelDeltaY = 1000;
    disableMouseWheel = false;
    disableRotate = false;
    disablePan = false;
    queryViewToolState() {
        return {
            enableResetCamera: this.enableResetCamera,
            enableViewToggle: this.enableViewToggle,
        };
    }
    is2DView() {
        return this.is2D;
    }
    viewToggle() {
        this.is2D = !this.is2D;
        this.switchViewModeState();
        this.initCamera();
        this.initGrid();
        this.updatePreviewWorldAxisVisibility();
        if (this._modelNode) {
            this.autoPerfectCameraViewOnModel(this._modelNode);
        }
        decorator_1.Service.Engine.repaintInEditMode();
    }
    initScene(registerName, queryName) {
        this.scene = new cc_1.Scene(registerName);
        if (this.enableSkybox) {
            this.skybox = this.scene.globals.skybox;
            this.scene.globals.skybox.enabled = true;
        }
        this.previewBuffer = new buffer_1.default(registerName, queryName, this.scene);
    }
    createNodes(scene) {
    }
    createCamera(registerName) {
        this.cameraComp = new cc_1.Node(registerName + 'camera').addComponent(cc_1.Camera);
        this.cameraComp.node.setParent(this.scene);
    }
    initCamera() {
        if (this.is2D) {
            this.cameraComp.node.setPosition(0, 0, 1000);
            this.cameraComp.orthoHeight = 1;
            this.cameraComp.node.setRotationFromEuler(0, 0, 0);
            this.cameraComp.projection = cc_1.Camera.ProjectionType.ORTHO;
            this.cameraComp.clearFlags = cc_1.Camera.ClearFlag.SOLID_COLOR;
        }
        else {
            this.cameraComp.node.setPosition(0, 1, 2.5);
            this.cameraComp.node.lookAt(cc_1.Vec3.ZERO);
            this.cameraComp.projection = cc_1.Camera.ProjectionType.PERSPECTIVE;
        }
        this.cameraComp.clearColor = new cc_1.Color(76, 76, 76, 255);
        this.cameraComp.near = 0.01;
        this.cameraComp.far = 10000;
        this.cameraComp.visibility = cc_1.Layers.makeMaskExclude([cc_1.Layers.BitMask.PROFILER, cc_1.Layers.Enum.GIZMOS, cc_1.Layers.Enum.SCENE_GIZMO]);
    }
    initSceneCamera() {
        this.camera = this.cameraComp.camera;
        if (!this.camera) {
            console.warn(`[InteractivePreview] initSceneCamera: cameraComp.camera is null, forcing _createCamera`);
            this.cameraComp._createCamera();
            this.camera = this.cameraComp.camera;
        }
        this.camera.isWindowSize = false;
        if (this.cameraComp.projection === cc_1.Camera.ProjectionType.PERSPECTIVE) {
            this.camera.clearFlag = (cc_1.gfx.ClearFlagBit.STENCIL << 1) | cc_1.gfx.ClearFlagBit.DEPTH_STENCIL;
        }
        this.camera.cameraUsage = cc_1.renderer.scene.CameraUsage.EDITOR;
        // Disable until a preview window is available — scene._activate() already
        // enabled the camera targeting mainWindow, which causes framebuffer errors.
        this.camera.enabled = false;
        this.ensureCameraAttached();
    }
    ensureCameraAttached() {
        if (!this.camera || !this.previewBuffer?.window)
            return;
        this.cameraComp.enabled = true;
        if (!this.camera.scene && this.scene?.renderScene) {
            this.scene.renderScene.addCamera(this.camera);
        }
        this.camera.changeTargetWindow(this.previewBuffer.window);
        this.camera.enabled = true;
    }
    loadScene() {
        // @ts-ignore
        this.scene._load();
        // @ts-ignore
        this.scene._activate();
    }
    switchViewModeState() {
        if (this.is2D) {
            this.enableGrid = false;
            this.enableAxis = false;
            this.disablePan = true;
            this.disableRotate = true;
        }
        else {
            this.enableGrid = true;
            this.enableAxis = true;
            this.disablePan = false;
            this.disableRotate = false;
        }
    }
    init(registerName, queryName) {
        this.switchViewModeState();
        this.initScene(registerName, queryName);
        this.createCamera(registerName);
        this.createNodes(this.scene);
        this.initCamera();
        // Disable camera component before scene activation so that _activate()
        // does not add the camera to mainWindow's render list.
        this.cameraComp.enabled = false;
        this.loadScene();
        this.initSceneCamera();
        this.initPreviewWorldAxis();
        this.initGrid();
    }
    initPreviewWorldAxis() {
        if (!this.worldAxis) {
            this.worldAxis = new preview_axis_1.PreviewWorldAxis(this.scene, this.cameraComp);
        }
        if (this.previewBuffer?.window) {
            this.worldAxis._sceneGizmoCamera.camera.changeTargetWindow(this.previewBuffer.window);
            this.updatePreviewWorldAxisVisibility();
        }
        else {
            this.worldAxis.hide();
        }
    }
    updatePreviewWorldAxisVisibility() {
        if (!this.worldAxis) {
            this.worldAxis = new preview_axis_1.PreviewWorldAxis(this.scene, this.cameraComp);
        }
        if (this.enableAxis) {
            this.worldAxis.show();
        }
        else {
            this.worldAxis.hide();
        }
    }
    initGrid() {
        if (!this.grid) {
            this.grid = new grid_1.Grid(this.scene, this.cameraComp);
        }
        if (this.enableGrid) {
            this.grid.show();
        }
        else {
            this.grid.hide();
        }
    }
    resetCamera(modelNode) {
        if (this.isOrtho) {
            tempVec3A.set(0, 0, 1000);
        }
        else {
            tempVec3A.set(0, 1, 2.5);
        }
        this.cameraComp.node.setPosition(tempVec3A);
        if (this.isOrtho) {
            this.cameraComp.node.setRotationFromEuler(0, 0, 0);
        }
        else {
            this.cameraComp.node.lookAt(cc_1.Vec3.ZERO);
        }
        modelNode.getWorldPosition(tempVec3B);
        cc_1.Vec3.set(this.viewCenter, 0, 0, 0);
        this.viewDist = cc_1.Vec3.distance(tempVec3A, tempVec3B);
        decorator_1.Service.Engine.repaintInEditMode();
    }
    autoPerfectCameraViewOnModel(model) {
        this.perfectCameraView(getBoundaryOfMeshNodes([model]));
    }
    panningSpeed = 4;
    orbitRotateSpeed = 0.01;
    viewDist = 10;
    viewCenter = new cc_1.Vec3();
    _isMouseDown = false;
    _right = new cc_1.Vec3();
    _up = new cc_1.Vec3();
    _v3a = cc.v3();
    _v3b = cc.v3();
    _curPos = cc.v3();
    _curRot = new cc_1.Quat();
    _forward = cc.v3(cc_1.Vec3.UNIT_Z);
    perfectCameraView(boundary) {
        let orthoHeight = 1;
        if (boundary) {
            const radius = Math.max(boundary.halfExtents.x, boundary.halfExtents.y, boundary.halfExtents.z);
            const fov = this.cameraComp.fov * Math.PI / 180;
            const requiredDist = radius / Math.tan(fov / 2);
            const dist = cc_1.Vec3.distance(this.cameraComp.node.worldPosition, boundary.center);
            this.viewDist = Math.max(dist, requiredDist);
            cc_1.Vec3.set(this.viewCenter, boundary.center.x, boundary.center.y, boundary.center.z);
            orthoHeight = Math.max(1, radius * 1.2);
        }
        else if (this._modelNode) {
            const uiTransform = this._modelNode.getComponent(cc_1.UITransform);
            if (uiTransform) {
                const bbox = uiTransform.getBoundingBoxToWorld();
                cc_1.Vec3.set(this.viewCenter, bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, 0);
                orthoHeight = Math.max(1, bbox.height / 2);
            }
            else {
                const pos = this._modelNode.worldPosition;
                cc_1.Vec3.set(this.viewCenter, pos.x, pos.y, pos.z);
                orthoHeight = Math.max(1, Math.abs(this.viewCenter.y));
            }
        }
        if (this.isOrtho) {
            const position = this.cameraComp.node.position.clone();
            position.x = this.viewCenter.x;
            position.y = this.viewCenter.y;
            position.z = 1000;
            this.cameraComp.node.position = position;
            const uiTransform = this._modelNode && this._modelNode.getComponent(cc_1.UITransform);
            if (uiTransform) {
                const bbox = uiTransform.getBoundingBoxToWorld();
                this.cameraComp.orthoHeight = Math.max(1, bbox.height / 2);
            }
            else {
                this.cameraComp.orthoHeight = orthoHeight;
            }
        }
        else {
            this.cameraComp.node.getWorldRotation(this._curRot);
            cc_1.Vec3.transformQuat(tempVec3A, cc_1.Vec3.UNIT_Z, this._curRot);
            cc_1.Vec3.multiplyScalar(tempVec3A, tempVec3A, this.viewDist);
            cc_1.Vec3.add(tempVec3B, this.viewCenter, tempVec3A);
            this.cameraComp.node.setWorldPosition(tempVec3B);
            this.cameraComp.node.lookAt(this.viewCenter);
        }
        decorator_1.Service.Engine.repaintInEditMode();
    }
    onMouseDown(event) {
        this._isMouseDown = true;
        this.cameraComp.node.getWorldRotation(this._curRot);
        this.cameraComp.node.getWorldPosition(this._curPos);
        if ((event.button === cc_1.EventMouse.BUTTON_LEFT || !event.button) && !this.disableRotate) {
            this.isMouseLeft = true;
        }
        if (event.button === cc_1.EventMouse.BUTTON_MIDDLE && !this.disablePan) {
            this.isMouseMiddle = true;
            cc_1.Vec3.transformQuat(this._right, cc_1.Vec3.UNIT_X, this._curRot);
            cc_1.Vec3.normalize(this._right, this._right);
            cc_1.Vec3.transformQuat(this._up, cc_1.Vec3.UNIT_Y, this._curRot);
            cc_1.Vec3.normalize(this._up, this._up);
        }
    }
    onMouseMove(event) {
        if (!this._isMouseDown) {
            return;
        }
        if (this.isMouseMiddle && !this.disablePan) {
            this.pan(event.movementX | 0, event.movementY | 0);
        }
        if (this.isMouseLeft) {
            this.rotate(event.movementX | 0, event.movementY | 0);
        }
    }
    onMouseUp(event) {
        this._isMouseDown = false;
        this.isMouseLeft = false;
        this.isMouseMiddle = false;
    }
    onMouseWheel(event) {
        if (this.disableMouseWheel) {
            return;
        }
        let deltaY = event.wheelDeltaY;
        if (Math.abs(deltaY - this.lastMouseWheelDeltaY) > this.maxMouseWheelDeltaY) {
            deltaY = this.lastMouseWheelDeltaY + Math.sign(deltaY) * this.maxMouseWheelDeltaY;
        }
        this.scale(deltaY * this.wheelBaseScale);
    }
    _modelNode;
    onKeyDown(event) {
    }
    smoothScale2D(curScale, delta) {
        return Math.pow(2, delta * 0.002) * curScale;
    }
    scale(delta) {
        if (this.isOrtho) {
            const newScale = this.smoothScale2D(this.scale2D, delta);
            let newOrthoHeight = this.cameraComp.orthoHeight;
            newOrthoHeight += delta * this.wheelSpeed * newScale * this.orthoScale;
            if (newOrthoHeight < 0) {
                newOrthoHeight = 0.01;
            }
            this.cameraComp.orthoHeight = newOrthoHeight;
        }
        else {
            let scalar = this.viewDist;
            if (Math.abs(scalar) < this._minScalar) {
                scalar = 1;
            }
            delta = (0, camera_controller_3d_1.smoothMouseWheelScale)(delta);
            const cameraNode = this.cameraComp.node;
            cameraNode.getWorldPosition(this._curPos);
            cameraNode.getWorldRotation(this._curRot);
            cc_1.Vec3.transformQuat(this._forward, cc_1.Vec3.UNIT_Z, this._curRot);
            cc_1.Vec3.multiplyScalar(this._v3a, this._forward, delta * this.wheelSpeed * scalar);
            cc_1.Vec3.add(this._curPos, this._curPos, this._v3a);
            makeVec3InRange(this._curPos, -1e12, 1e12);
            this.viewDist = cc_1.Vec3.distance(this._curPos, this.viewCenter);
            cameraNode.setWorldPosition(this._curPos);
        }
    }
    rotate(dx, dy) {
        if (!this._isMouseDown && !this.isMouseLeft) {
            return;
        }
        this.cameraComp.node.getWorldRotation(this._curRot);
        const rot = this._curRot;
        const euler = cc.v3();
        cc_1.Quat.rotateX(rot, rot, -dy * this.orbitRotateSpeed);
        cc_1.Quat.rotateAround(rot, rot, cc_1.Vec3.UNIT_Y, -dx * this.orbitRotateSpeed);
        cc_1.Quat.toEuler(euler, rot);
        cc_1.Quat.fromEuler(rot, euler.x, euler.y, 0);
        const offset = cc.v3(0, 0, 1);
        cc_1.Vec3.transformQuat(offset, offset, rot);
        cc_1.Vec3.normalize(offset, offset);
        cc_1.Vec3.multiplyScalar(offset, offset, this.viewDist);
        cc_1.Vec3.add(this._curPos, this.viewCenter, offset);
        this.cameraComp.node.setWorldPosition(this._curPos);
        const up = cc.v3(0, 1, 0);
        cc_1.Vec3.transformQuat(up, up, rot);
        cc_1.Vec3.normalize(up, up);
        this.cameraComp.node.lookAt(this.viewCenter, up);
    }
    pan(dx, dy) {
        if (!this._isMouseDown && !this.isMouseMiddle) {
            return;
        }
        const scalar = this.viewDist / 800;
        const node = this.cameraComp.node;
        const curPos = this._curPos;
        cc_1.Vec3.multiplyScalar(this._v3a, this._right, -dx * this.panningSpeed * scalar);
        cc_1.Vec3.multiplyScalar(this._v3b, this._up, dy * this.panningSpeed * scalar);
        node.getWorldPosition(curPos);
        cc_1.Vec3.add(curPos, curPos, this._v3a);
        cc_1.Vec3.add(curPos, curPos, this._v3b);
        node.setWorldPosition(curPos);
        cc_1.Vec3.add(this.viewCenter, this.viewCenter, this._v3a);
        cc_1.Vec3.add(this.viewCenter, this.viewCenter, this._v3b);
        this.viewDist = cc_1.Vec3.distance(curPos, this.viewCenter);
    }
    updateViewCenterByDist(viewDist) {
        const node = this.cameraComp.node;
        const curPos = this._curPos;
        node.getWorldPosition(curPos);
        node.getWorldRotation(this._curRot);
        cc_1.Vec3.transformQuat(this._forward, cc_1.Vec3.UNIT_Z, this._curRot);
        cc_1.Vec3.multiplyScalar(this._v3a, this._forward, viewDist);
        cc_1.Vec3.add(this.viewCenter, curPos, this._v3a);
    }
    hide() {
        this.cameraComp.enabled = false;
        if (this.camera) {
            this.camera.enabled = false;
        }
        if (this.worldAxis) {
            this.worldAxis.hide();
            this.worldAxis._sceneGizmoCamera.camera.enabled = false;
        }
    }
    resetCameraView() {
    }
}
exports.InteractivePreview = InteractivePreview;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmUtcHJldmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3Mvc2VydmljZS9wcmV2aWV3L2ludGVyYWN0aXZlLXByZXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBa2hCNkIsd0RBQXNCO0FBbGhCbkQsMkJBQWtJO0FBQ2xJLHNEQUFxQztBQUNyQyxpREFBNkM7QUFDN0MsaURBQWtEO0FBQ2xELGlDQUE4QjtBQUM5Qix5RUFBdUU7QUFDdkUsaURBQTRDO0FBRzVDLE1BQU0sU0FBUyxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUU3QixTQUFTLHNCQUFzQixDQUFDLEtBQWE7SUFDekMsSUFBSSxNQUFNLEdBQUcsSUFBSSxTQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwRCxJQUFJLE1BQU0sR0FBRyxJQUFJLFNBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZELElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztJQUVsQixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2xFLEtBQUssTUFBTSxFQUFFLElBQUksU0FBUyxFQUFFLENBQUM7WUFDekIsTUFBTSxLQUFLLEdBQUksRUFBVSxDQUFDLEtBQUssQ0FBQztZQUNoQyxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxXQUE0QixDQUFDO2dCQUNsRCxNQUFNLElBQUksR0FBRyxJQUFJLFNBQUks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QUFLLENBQUM7UUFDNUQsQ0FBQztJQUNMLENBQUM7SUFFTSxlQUFlO0lBQ3RCLENBQUM7Q0FDSjtBQUVRLGdEQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENhbWVyYSwgQ29sb3IsIGdlb21ldHJ5LCBnZngsIE5vZGUsIFF1YXQsIHJlbmRlcmVyLCBTY2VuZSwgTGF5ZXJzLCBWZWMzLCBFdmVudE1vdXNlLCBTa3lib3hJbmZvLCBVSVRyYW5zZm9ybSB9IGZyb20gJ2NjJztcbmltcG9ydCBQcmV2aWV3QnVmZmVyIGZyb20gJy4vYnVmZmVyJztcbmltcG9ydCB7IFByZXZpZXdCYXNlIH0gZnJvbSAnLi9wcmV2aWV3LWJhc2UnO1xuaW1wb3J0IHsgUHJldmlld1dvcmxkQXhpcyB9IGZyb20gJy4vcHJldmlldy1heGlzJztcbmltcG9ydCB7IEdyaWQgfSBmcm9tICcuL2dyaWQnO1xuaW1wb3J0IHsgc21vb3RoTW91c2VXaGVlbFNjYWxlIH0gZnJvbSAnLi4vY2FtZXJhL2NhbWVyYS1jb250cm9sbGVyLTNkJztcbmltcG9ydCB7IFNlcnZpY2UgfSBmcm9tICcuLi9jb3JlL2RlY29yYXRvcic7XG5pbXBvcnQgdHlwZSB7IElQcmV2aWV3SW5zdGFuY2UgfSBmcm9tICcuLi8uLi8uLi9jb21tb24vcHJldmlldyc7XG5cbmNvbnN0IHRlbXBWZWMzQSA9IG5ldyBWZWMzKCk7XG5jb25zdCB0ZW1wVmVjM0IgPSBuZXcgVmVjMygpO1xuXG5mdW5jdGlvbiBnZXRCb3VuZGFyeU9mTWVzaE5vZGVzKG5vZGVzOiBOb2RlW10pOiBnZW9tZXRyeS5BQUJCIHwgbnVsbCB7XG4gICAgbGV0IG1pblBvcyA9IG5ldyBWZWMzKEluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHkpO1xuICAgIGxldCBtYXhQb3MgPSBuZXcgVmVjMygtSW5maW5pdHksIC1JbmZpbml0eSwgLUluZmluaXR5KTtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgICBjb25zdCByZW5kZXJlcnMgPSBub2RlLmdldENvbXBvbmVudHNJbkNoaWxkcmVuKCdjYy5NZXNoUmVuZGVyZXInKTtcbiAgICAgICAgZm9yIChjb25zdCBtciBvZiByZW5kZXJlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG1vZGVsID0gKG1yIGFzIGFueSkubW9kZWw7XG4gICAgICAgICAgICBpZiAobW9kZWwgJiYgbW9kZWwud29ybGRCb3VuZHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3VuZHMgPSBtb2RlbC53b3JsZEJvdW5kcyBhcyBnZW9tZXRyeS5BQUJCO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJNaW4gPSBuZXcgVmVjMyhcbiAgICAgICAgICAgICAgICAgICAgYm91bmRzLmNlbnRlci54IC0gYm91bmRzLmhhbGZFeHRlbnRzLngsXG4gICAgICAgICAgICAgICAgICAgIGJvdW5kcy5jZW50ZXIueSAtIGJvdW5kcy5oYWxmRXh0ZW50cy55LFxuICAgICAgICAgICAgICAgICAgICBib3VuZHMuY2VudGVyLnogLSBib3VuZHMuaGFsZkV4dGVudHMueixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJNYXggPSBuZXcgVmVjMyhcbiAgICAgICAgICAgICAgICAgICAgYm91bmRzLmNlbnRlci54ICsgYm91bmRzLmhhbGZFeHRlbnRzLngsXG4gICAgICAgICAgICAgICAgICAgIGJvdW5kcy5jZW50ZXIueSArIGJvdW5kcy5oYWxmRXh0ZW50cy55LFxuICAgICAgICAgICAgICAgICAgICBib3VuZHMuY2VudGVyLnogKyBib3VuZHMuaGFsZkV4dGVudHMueixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFZlYzMubWluKG1pblBvcywgbWluUG9zLCBiTWluKTtcbiAgICAgICAgICAgICAgICBWZWMzLm1heChtYXhQb3MsIG1heFBvcywgYk1heCk7XG4gICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghZm91bmQpIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgY2VudGVyID0gbmV3IFZlYzMoKTtcbiAgICBWZWMzLmFkZChjZW50ZXIsIG1pblBvcywgbWF4UG9zKTtcbiAgICBWZWMzLm11bHRpcGx5U2NhbGFyKGNlbnRlciwgY2VudGVyLCAwLjUpO1xuICAgIGNvbnN0IGhhbGZFeHRlbnRzID0gbmV3IFZlYzMoKTtcbiAgICBWZWMzLnN1YnRyYWN0KGhhbGZFeHRlbnRzLCBtYXhQb3MsIG1pblBvcyk7XG4gICAgVmVjMy5tdWx0aXBseVNjYWxhcihoYWxmRXh0ZW50cywgaGFsZkV4dGVudHMsIDAuNSk7XG4gICAgcmV0dXJuIG5ldyBnZW9tZXRyeS5BQUJCKGNlbnRlci54LCBjZW50ZXIueSwgY2VudGVyLnosIGhhbGZFeHRlbnRzLngsIGhhbGZFeHRlbnRzLnksIGhhbGZFeHRlbnRzLnopO1xufVxuXG5mdW5jdGlvbiBtYWtlVmVjM0luUmFuZ2UodjogVmVjMywgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKSB7XG4gICAgdi54ID0gTWF0aC5tYXgobWluLCBNYXRoLm1pbihtYXgsIHYueCkpO1xuICAgIHYueSA9IE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2LnkpKTtcbiAgICB2LnogPSBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdi56KSk7XG59XG5cbmNsYXNzIEludGVyYWN0aXZlUHJldmlldyBleHRlbmRzIFByZXZpZXdCYXNlIGltcGxlbWVudHMgSVByZXZpZXdJbnN0YW5jZSB7XG4gICAgcHJvdGVjdGVkIHNjZW5lITogU2NlbmU7XG4gICAgcHJvdGVjdGVkIGNhbWVyYUNvbXAhOiBDYW1lcmE7XG4gICAgcHJvdGVjdGVkIGNhbWVyYTogcmVuZGVyZXIuc2NlbmUuQ2FtZXJhIHwgYW55O1xuXG4gICAgcHJvdGVjdGVkIGlzTW91c2VMZWZ0ID0gZmFsc2U7XG4gICAgcHJvdGVjdGVkIGlzTW91c2VNaWRkbGUgPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBlbmFibGVSZXNldENhbWVyYSA9IHRydWU7XG4gICAgcHJvdGVjdGVkIGVuYWJsZVZpZXdUb2dnbGUgPSB0cnVlO1xuXG4gICAgcHJvdGVjdGVkIGVuYWJsZUdyaWQgPSB0cnVlO1xuICAgIHByb3RlY3RlZCBncmlkOiBHcmlkIHwgbnVsbCA9IG51bGw7XG5cbiAgICBwcm90ZWN0ZWQgZW5hYmxlQXhpcyA9IHRydWU7XG4gICAgcHJvdGVjdGVkIHdvcmxkQXhpczogUHJldmlld1dvcmxkQXhpcyB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJvdGVjdGVkIGlzMkQgPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBlbmFibGVTa3lib3ggPSB0cnVlO1xuICAgIHByb3RlY3RlZCBza3lib3g6IFNreWJveEluZm8gfCBudWxsID0gbnVsbDtcblxuICAgIHB1YmxpYyBhc3luYyBxdWVyeVByZXZpZXdEYXRhKGluZm86IGFueSkge1xuICAgICAgICB0aGlzLmVuc3VyZVByZXZpZXdHbG9iYWxzQWN0aXZlKCk7XG4gICAgICAgIHRoaXMucHJldmlld0J1ZmZlci5lbnN1cmVXaW5kb3coaW5mby53aWR0aCwgaW5mby5oZWlnaHQpO1xuICAgICAgICB0aGlzLmVuc3VyZUNhbWVyYUF0dGFjaGVkKCk7XG4gICAgICAgIGlmICh0aGlzLndvcmxkQXhpcyAmJiB0aGlzLnByZXZpZXdCdWZmZXI/LndpbmRvdykge1xuICAgICAgICAgICAgdGhpcy53b3JsZEF4aXMuX3NjZW5lR2l6bW9DYW1lcmEuY2FtZXJhLmNoYW5nZVRhcmdldFdpbmRvdyh0aGlzLnByZXZpZXdCdWZmZXIud2luZG93KTtcbiAgICAgICAgICAgIGlmICh0aGlzLmVuYWJsZUF4aXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkQXhpcy5zaG93KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5UHJldmlld0RhdGEoaW5mbyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBlbnN1cmVQcmV2aWV3R2xvYmFsc0FjdGl2ZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZVNreWJveCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBwc2QgPSAoY2MuZGlyZWN0b3Iucm9vdCBhcyBhbnkpPy5waXBlbGluZT8ucGlwZWxpbmVTY2VuZURhdGE7XG4gICAgICAgIGlmICghcHNkPy5za3lib3gpIHJldHVybjtcbiAgICAgICAgaWYgKCFwc2Quc2t5Ym94LmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2NlbmUuZ2xvYmFscy5hY3RpdmF0ZSh0aGlzLnNjZW5lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCByZWFkb25seSBfbWluU2NhbGFyID0gMTtcbiAgICBwcm90ZWN0ZWQgb3J0aG9TY2FsZSA9IDAuMTtcblxuICAgIHByaXZhdGUgZ2V0IGlzT3J0aG8oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbWVyYUNvbXAucHJvamVjdGlvbiA9PT0gQ2FtZXJhLlByb2plY3Rpb25UeXBlLk9SVEhPO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXQgd2hlZWxTcGVlZCgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbSA9IFNlcnZpY2UuQ2FtZXJhIGFzIGFueTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzT3J0aG8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FtLmNvbnRyb2xsZXIyRD8ud2hlZWxTcGVlZCA/PyA2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNhbS5jb250cm9sbGVyM0Q/LndoZWVsU3BlZWQgPz8gMC4wMTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc09ydGhvID8gNiA6IDAuMDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0IHNjYWxlMkQoKTogbnVtYmVyIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBTZXJ2aWNlLkdpem1vPy50cmFuc2Zvcm1Ub29sRGF0YT8uc2NhbGUyRCA/PyAxO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHdoZWVsQmFzZVNjYWxlID0gMSAvIDEyO1xuICAgIHByaXZhdGUgbGFzdE1vdXNlV2hlZWxEZWx0YVkgPSAwO1xuICAgIHByaXZhdGUgbWF4TW91c2VXaGVlbERlbHRhWSA9IDEwMDA7XG5cbiAgICBwcm90ZWN0ZWQgZGlzYWJsZU1vdXNlV2hlZWwgPSBmYWxzZTtcbiAgICBwcm90ZWN0ZWQgZGlzYWJsZVJvdGF0ZSA9IGZhbHNlO1xuICAgIHByb3RlY3RlZCBkaXNhYmxlUGFuID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgcXVlcnlWaWV3VG9vbFN0YXRlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZW5hYmxlUmVzZXRDYW1lcmE6IHRoaXMuZW5hYmxlUmVzZXRDYW1lcmEsXG4gICAgICAgICAgICBlbmFibGVWaWV3VG9nZ2xlOiB0aGlzLmVuYWJsZVZpZXdUb2dnbGUsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGlzMkRWaWV3KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pczJEO1xuICAgIH1cblxuICAgIHB1YmxpYyB2aWV3VG9nZ2xlKCkge1xuICAgICAgICB0aGlzLmlzMkQgPSAhdGhpcy5pczJEO1xuICAgICAgICB0aGlzLnN3aXRjaFZpZXdNb2RlU3RhdGUoKTtcbiAgICAgICAgdGhpcy5pbml0Q2FtZXJhKCk7XG4gICAgICAgIHRoaXMuaW5pdEdyaWQoKTtcbiAgICAgICAgdGhpcy51cGRhdGVQcmV2aWV3V29ybGRBeGlzVmlzaWJpbGl0eSgpO1xuICAgICAgICBpZiAodGhpcy5fbW9kZWxOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9QZXJmZWN0Q2FtZXJhVmlld09uTW9kZWwodGhpcy5fbW9kZWxOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbml0U2NlbmUocmVnaXN0ZXJOYW1lOiBzdHJpbmcsIHF1ZXJ5TmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuc2NlbmUgPSBuZXcgU2NlbmUocmVnaXN0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlU2t5Ym94KSB7XG4gICAgICAgICAgICB0aGlzLnNreWJveCA9IHRoaXMuc2NlbmUuZ2xvYmFscy5za3lib3g7XG4gICAgICAgICAgICB0aGlzLnNjZW5lLmdsb2JhbHMuc2t5Ym94LmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJldmlld0J1ZmZlciA9IG5ldyBQcmV2aWV3QnVmZmVyKHJlZ2lzdGVyTmFtZSwgcXVlcnlOYW1lLCB0aGlzLnNjZW5lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlTm9kZXMoc2NlbmU6IFNjZW5lKSB7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZUNhbWVyYShyZWdpc3Rlck5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLmNhbWVyYUNvbXAgPSBuZXcgTm9kZShyZWdpc3Rlck5hbWUgKyAnY2FtZXJhJykuYWRkQ29tcG9uZW50KENhbWVyYSk7XG4gICAgICAgIHRoaXMuY2FtZXJhQ29tcC5ub2RlLnNldFBhcmVudCh0aGlzLnNjZW5lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5pdENhbWVyYSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXMyRCkge1xuICAgICAgICAgICAgdGhpcy5jYW1lcmFDb21wLm5vZGUuc2V0UG9zaXRpb24oMCwgMCwgMTAwMCk7XG4gICAgICAgICAgICB0aGlzLmNhbWVyYUNvbXAub3J0aG9IZWlnaHQgPSAxO1xuICAgICAgICAgICAgdGhpcy5jYW1lcmFDb21wLm5vZGUuc2V0Um90YXRpb25Gcm9tRXVsZXIoMCwgMCwgMCk7XG4gICAgICAgICAgICB0aGlzLmNhbWVyYUNvbXAucHJvamVjdGlvbiA9IENhbWVyYS5Qcm9qZWN0aW9uVHlwZS5PUlRITztcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhQ29tcC5jbGVhckZsYWdzID0gQ2FtZXJhLkNsZWFyRmxhZy5TT0xJRF9DT0xPUjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhQ29tcC5ub2RlLnNldFBvc2l0aW9uKDAsIDEsIDIuNSk7XG4gICAgICAgICAgICB0aGlzLmNhbWVyYUNvbXAubm9kZS5sb29rQXQoVmVjMy5aRVJPKTtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhQ29tcC5wcm9qZWN0aW9uID0gQ2FtZXJhLlByb2plY3Rpb25UeXBlLlBFUlNQRUNUSVZFO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FtZXJhQ29tcC5jbGVhckNvbG9yID0gbmV3IENvbG9yKDc2LCA3NiwgNzYsIDI1NSk7XG4gICAgICAgIHRoaXMuY2FtZXJhQ29tcC5uZWFyID0gMC4wMTtcbiAgICAgICAgdGhpcy5jYW1lcmFDb21wLmZhciA9IDEwMDAwO1xuICAgICAgICB0aGlzLmNhbWVyYUNvbXAudmlzaWJpbGl0eSA9IExheWVycy5tYWtlTWFza0V4Y2x1ZGUoW0xheWVycy5CaXRNYXNrLlBST0ZJTEVSLCBMYXllcnMuRW51bS5HSVpNT1MsIExheWVycy5FbnVtLlNDRU5FX0dJWk1PXSk7XG4gICAgfVxuXG4gICAgcHVibGljIGluaXRTY2VuZUNhbWVyYSgpIHtcbiAgICAgICAgdGhpcy5jYW1lcmEgPSB0aGlzLmNhbWVyYUNvbXAuY2FtZXJhO1xuICAgICAgICBpZiAoIXRoaXMuY2FtZXJhKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtJbnRlcmFjdGl2ZVByZXZpZXddIGluaXRTY2VuZUNhbWVyYTogY2FtZXJhQ29tcC5jYW1lcmEgaXMgbnVsbCwgZm9yY2luZyBfY3JlYXRlQ2FtZXJhYCk7XG4gICAgICAgICAgICAodGhpcy5jYW1lcmFDb21wIGFzIGFueSkuX2NyZWF0ZUNhbWVyYSgpO1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEgPSB0aGlzLmNhbWVyYUNvbXAuY2FtZXJhO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FtZXJhLmlzV2luZG93U2l6ZSA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5jYW1lcmFDb21wLnByb2plY3Rpb24gPT09IENhbWVyYS5Qcm9qZWN0aW9uVHlwZS5QRVJTUEVDVElWRSkge1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuY2xlYXJGbGFnID0gKGdmeC5DbGVhckZsYWdCaXQuU1RFTkNJTCA8PCAxKSB8IGdmeC5DbGVhckZsYWdCaXQuREVQVEhfU1RFTkNJTDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbWVyYS5jYW1lcmFVc2FnZSA9IHJlbmRlcmVyLnNjZW5lLkNhbWVyYVVzYWdlLkVESVRPUjtcbiAgICAgICAgLy8gRGlzYWJsZSB1bnRpbCBhIHByZXZpZXcgd2luZG93IGlzIGF2YWlsYWJsZSDigJQgc2NlbmUuX2FjdGl2YXRlKCkgYWxyZWFkeVxuICAgICAgICAvLyBlbmFibGVkIHRoZSBjYW1lcmEgdGFyZ2V0aW5nIG1haW5XaW5kb3csIHdoaWNoIGNhdXNlcyBmcmFtZWJ1ZmZlciBlcnJvcnMuXG4gICAgICAgIHRoaXMuY2FtZXJhLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lbnN1cmVDYW1lcmFBdHRhY2hlZCgpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBlbnN1cmVDYW1lcmFBdHRhY2hlZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbWVyYSB8fCAhdGhpcy5wcmV2aWV3QnVmZmVyPy53aW5kb3cpIHJldHVybjtcblxuICAgICAgICB0aGlzLmNhbWVyYUNvbXAuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmICghdGhpcy5jYW1lcmEuc2NlbmUgJiYgdGhpcy5zY2VuZT8ucmVuZGVyU2NlbmUpIHtcbiAgICAgICAgICAgIHRoaXMuc2NlbmUucmVuZGVyU2NlbmUuYWRkQ2FtZXJhKHRoaXMuY2FtZXJhKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbWVyYS5jaGFuZ2VUYXJnZXRXaW5kb3codGhpcy5wcmV2aWV3QnVmZmVyLndpbmRvdyk7XG4gICAgICAgIHRoaXMuY2FtZXJhLmVuYWJsZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBsb2FkU2NlbmUoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy5zY2VuZS5fbG9hZCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHRoaXMuc2NlbmUuX2FjdGl2YXRlKCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc3dpdGNoVmlld01vZGVTdGF0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXMyRCkge1xuICAgICAgICAgICAgdGhpcy5lbmFibGVHcmlkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVuYWJsZUF4aXMgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZVBhbiA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmRpc2FibGVSb3RhdGUgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbmFibGVHcmlkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZW5hYmxlQXhpcyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmRpc2FibGVQYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZVJvdGF0ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGluaXQocmVnaXN0ZXJOYW1lOiBzdHJpbmcsIHF1ZXJ5TmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuc3dpdGNoVmlld01vZGVTdGF0ZSgpO1xuICAgICAgICB0aGlzLmluaXRTY2VuZShyZWdpc3Rlck5hbWUsIHF1ZXJ5TmFtZSk7XG4gICAgICAgIHRoaXMuY3JlYXRlQ2FtZXJhKHJlZ2lzdGVyTmFtZSk7XG4gICAgICAgIHRoaXMuY3JlYXRlTm9kZXModGhpcy5zY2VuZSk7XG4gICAgICAgIHRoaXMuaW5pdENhbWVyYSgpO1xuICAgICAgICAvLyBEaXNhYmxlIGNhbWVyYSBjb21wb25lbnQgYmVmb3JlIHNjZW5lIGFjdGl2YXRpb24gc28gdGhhdCBfYWN0aXZhdGUoKVxuICAgICAgICAvLyBkb2VzIG5vdCBhZGQgdGhlIGNhbWVyYSB0byBtYWluV2luZG93J3MgcmVuZGVyIGxpc3QuXG4gICAgICAgIHRoaXMuY2FtZXJhQ29tcC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMubG9hZFNjZW5lKCk7XG4gICAgICAgIHRoaXMuaW5pdFNjZW5lQ2FtZXJhKCk7XG4gICAgICAgIHRoaXMuaW5pdFByZXZpZXdXb3JsZEF4aXMoKTtcbiAgICAgICAgdGhpcy5pbml0R3JpZCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbml0UHJldmlld1dvcmxkQXhpcygpIHtcbiAgICAgICAgaWYgKCF0aGlzLndvcmxkQXhpcykge1xuICAgICAgICAgICAgdGhpcy53b3JsZEF4aXMgPSBuZXcgUHJldmlld1dvcmxkQXhpcyh0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYUNvbXApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnByZXZpZXdCdWZmZXI/LndpbmRvdykge1xuICAgICAgICAgICAgdGhpcy53b3JsZEF4aXMuX3NjZW5lR2l6bW9DYW1lcmEuY2FtZXJhLmNoYW5nZVRhcmdldFdpbmRvdyh0aGlzLnByZXZpZXdCdWZmZXIud2luZG93KTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUHJldmlld1dvcmxkQXhpc1Zpc2liaWxpdHkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMud29ybGRBeGlzLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCB1cGRhdGVQcmV2aWV3V29ybGRBeGlzVmlzaWJpbGl0eSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLndvcmxkQXhpcykge1xuICAgICAgICAgICAgdGhpcy53b3JsZEF4aXMgPSBuZXcgUHJldmlld1dvcmxkQXhpcyh0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYUNvbXApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZUF4aXMpIHtcbiAgICAgICAgICAgIHRoaXMud29ybGRBeGlzLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMud29ybGRBeGlzLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBpbml0R3JpZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmdyaWQpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZCA9IG5ldyBHcmlkKHRoaXMuc2NlbmUsIHRoaXMuY2FtZXJhQ29tcCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlR3JpZCkge1xuICAgICAgICAgICAgdGhpcy5ncmlkLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZC5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldENhbWVyYShtb2RlbE5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNPcnRobykge1xuICAgICAgICAgICAgdGVtcFZlYzNBLnNldCgwLCAwLCAxMDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRlbXBWZWMzQS5zZXQoMCwgMSwgMi41KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbWVyYUNvbXAubm9kZS5zZXRQb3NpdGlvbih0ZW1wVmVjM0EpO1xuICAgICAgICBpZiAodGhpcy5pc09ydGhvKSB7XG4gICAgICAgICAgICB0aGlzLmNhbWVyYUNvbXAubm9kZS5zZXRSb3RhdGlvbkZyb21FdWxlcigwLCAwLCAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2FtZXJhQ29tcC5ub2RlLmxvb2tBdChWZWMzLlpFUk8pO1xuICAgICAgICB9XG4gICAgICAgIG1vZGVsTm9kZS5nZXRXb3JsZFBvc2l0aW9uKHRlbXBWZWMzQik7XG4gICAgICAgIFZlYzMuc2V0KHRoaXMudmlld0NlbnRlciwgMCwgMCwgMCk7XG4gICAgICAgIHRoaXMudmlld0Rpc3QgPSBWZWMzLmRpc3RhbmNlKHRlbXBWZWMzQSwgdGVtcFZlYzNCKTtcbiAgICAgICAgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXV0b1BlcmZlY3RDYW1lcmFWaWV3T25Nb2RlbChtb2RlbDogTm9kZSkge1xuICAgICAgICB0aGlzLnBlcmZlY3RDYW1lcmFWaWV3KGdldEJvdW5kYXJ5T2ZNZXNoTm9kZXMoW21vZGVsXSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBwYW5uaW5nU3BlZWQgPSA0O1xuICAgIHB1YmxpYyBvcmJpdFJvdGF0ZVNwZWVkID0gMC4wMTtcbiAgICBwdWJsaWMgdmlld0Rpc3QgPSAxMDtcbiAgICBwdWJsaWMgdmlld0NlbnRlciA9IG5ldyBWZWMzKCk7XG5cbiAgICBwcml2YXRlIF9pc01vdXNlRG93biA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3JpZ2h0OiBWZWMzID0gbmV3IFZlYzMoKTtcbiAgICBwcml2YXRlIF91cDogVmVjMyA9IG5ldyBWZWMzKCk7XG4gICAgcHJpdmF0ZSBfdjNhID0gY2MudjMoKTtcbiAgICBwcml2YXRlIF92M2IgPSBjYy52MygpO1xuICAgIHByaXZhdGUgX2N1clBvcyA9IGNjLnYzKCk7XG4gICAgcHJpdmF0ZSBfY3VyUm90ID0gbmV3IFF1YXQoKTtcbiAgICBwcml2YXRlIF9mb3J3YXJkID0gY2MudjMoVmVjMy5VTklUX1opO1xuXG4gICAgcHJvdGVjdGVkIHBlcmZlY3RDYW1lcmFWaWV3KGJvdW5kYXJ5OiBnZW9tZXRyeS5BQUJCIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgICAgICBsZXQgb3J0aG9IZWlnaHQgPSAxO1xuICAgICAgICBpZiAoYm91bmRhcnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJhZGl1cyA9IE1hdGgubWF4KGJvdW5kYXJ5LmhhbGZFeHRlbnRzLngsIGJvdW5kYXJ5LmhhbGZFeHRlbnRzLnksIGJvdW5kYXJ5LmhhbGZFeHRlbnRzLnopO1xuICAgICAgICAgICAgY29uc3QgZm92ID0gdGhpcy5jYW1lcmFDb21wLmZvdiAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgICAgICBjb25zdCByZXF1aXJlZERpc3QgPSByYWRpdXMgLyBNYXRoLnRhbihmb3YgLyAyKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3QgPSBWZWMzLmRpc3RhbmNlKHRoaXMuY2FtZXJhQ29tcC5ub2RlLndvcmxkUG9zaXRpb24sIGJvdW5kYXJ5LmNlbnRlcik7XG4gICAgICAgICAgICB0aGlzLnZpZXdEaXN0ID0gTWF0aC5tYXgoZGlzdCwgcmVxdWlyZWREaXN0KTtcbiAgICAgICAgICAgIFZlYzMuc2V0KHRoaXMudmlld0NlbnRlciwgYm91bmRhcnkuY2VudGVyLngsIGJvdW5kYXJ5LmNlbnRlci55LCBib3VuZGFyeS5jZW50ZXIueik7XG4gICAgICAgICAgICBvcnRob0hlaWdodCA9IE1hdGgubWF4KDEsIHJhZGl1cyAqIDEuMik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbW9kZWxOb2RlKSB7XG4gICAgICAgICAgICBjb25zdCB1aVRyYW5zZm9ybSA9IHRoaXMuX21vZGVsTm9kZS5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgaWYgKHVpVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHVpVHJhbnNmb3JtLmdldEJvdW5kaW5nQm94VG9Xb3JsZCgpO1xuICAgICAgICAgICAgICAgIFZlYzMuc2V0KHRoaXMudmlld0NlbnRlciwgYmJveC54ICsgYmJveC53aWR0aCAvIDIsIGJib3gueSArIGJib3guaGVpZ2h0IC8gMiwgMCk7XG4gICAgICAgICAgICAgICAgb3J0aG9IZWlnaHQgPSBNYXRoLm1heCgxLCBiYm94LmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwb3MgPSB0aGlzLl9tb2RlbE5vZGUud29ybGRQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBWZWMzLnNldCh0aGlzLnZpZXdDZW50ZXIsIHBvcy54LCBwb3MueSwgcG9zLnopO1xuICAgICAgICAgICAgICAgIG9ydGhvSGVpZ2h0ID0gTWF0aC5tYXgoMSwgTWF0aC5hYnModGhpcy52aWV3Q2VudGVyLnkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmlzT3J0aG8pIHtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5jYW1lcmFDb21wLm5vZGUucG9zaXRpb24uY2xvbmUoKTtcbiAgICAgICAgICAgIHBvc2l0aW9uLnggPSB0aGlzLnZpZXdDZW50ZXIueDtcbiAgICAgICAgICAgIHBvc2l0aW9uLnkgPSB0aGlzLnZpZXdDZW50ZXIueTtcbiAgICAgICAgICAgIHBvc2l0aW9uLnogPSAxMDAwO1xuICAgICAgICAgICAgdGhpcy5jYW1lcmFDb21wLm5vZGUucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgICAgIGNvbnN0IHVpVHJhbnNmb3JtID0gdGhpcy5fbW9kZWxOb2RlICYmIHRoaXMuX21vZGVsTm9kZS5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgaWYgKHVpVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHVpVHJhbnNmb3JtLmdldEJvdW5kaW5nQm94VG9Xb3JsZCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhQ29tcC5vcnRob0hlaWdodCA9IE1hdGgubWF4KDEsIGJib3guaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FtZXJhQ29tcC5vcnRob0hlaWdodCA9IG9ydGhvSGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jYW1lcmFDb21wLm5vZGUuZ2V0V29ybGRSb3RhdGlvbih0aGlzLl9jdXJSb3QpO1xuICAgICAgICAgICAgVmVjMy50cmFuc2Zvcm1RdWF0KHRlbXBWZWMzQSwgVmVjMy5VTklUX1osIHRoaXMuX2N1clJvdCk7XG4gICAgICAgICAgICBWZWMzLm11bHRpcGx5U2NhbGFyKHRlbXBWZWMzQSwgdGVtcFZlYzNBLCB0aGlzLnZpZXdEaXN0KTtcbiAgICAgICAgICAgIFZlYzMuYWRkKHRlbXBWZWMzQiwgdGhpcy52aWV3Q2VudGVyLCB0ZW1wVmVjM0EpO1xuICAgICAgICAgICAgdGhpcy5jYW1lcmFDb21wLm5vZGUuc2V0V29ybGRQb3NpdGlvbih0ZW1wVmVjM0IpO1xuICAgICAgICAgICAgdGhpcy5jYW1lcmFDb21wLm5vZGUubG9va0F0KHRoaXMudmlld0NlbnRlcik7XG4gICAgICAgIH1cbiAgICAgICAgU2VydmljZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Nb3VzZURvd24oZXZlbnQ6IGFueSkge1xuICAgICAgICB0aGlzLl9pc01vdXNlRG93biA9IHRydWU7XG4gICAgICAgIHRoaXMuY2FtZXJhQ29tcC5ub2RlLmdldFdvcmxkUm90YXRpb24odGhpcy5fY3VyUm90KTtcbiAgICAgICAgdGhpcy5jYW1lcmFDb21wLm5vZGUuZ2V0V29ybGRQb3NpdGlvbih0aGlzLl9jdXJQb3MpO1xuXG4gICAgICAgIGlmICgoZXZlbnQuYnV0dG9uID09PSBFdmVudE1vdXNlLkJVVFRPTl9MRUZUIHx8ICFldmVudC5idXR0b24pICYmICF0aGlzLmRpc2FibGVSb3RhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuaXNNb3VzZUxlZnQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRNb3VzZS5CVVRUT05fTUlERExFICYmICF0aGlzLmRpc2FibGVQYW4pIHtcbiAgICAgICAgICAgIHRoaXMuaXNNb3VzZU1pZGRsZSA9IHRydWU7XG4gICAgICAgICAgICBWZWMzLnRyYW5zZm9ybVF1YXQodGhpcy5fcmlnaHQsIFZlYzMuVU5JVF9YLCB0aGlzLl9jdXJSb3QpO1xuICAgICAgICAgICAgVmVjMy5ub3JtYWxpemUodGhpcy5fcmlnaHQsIHRoaXMuX3JpZ2h0KTtcbiAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh0aGlzLl91cCwgVmVjMy5VTklUX1ksIHRoaXMuX2N1clJvdCk7XG4gICAgICAgICAgICBWZWMzLm5vcm1hbGl6ZSh0aGlzLl91cCwgdGhpcy5fdXApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uTW91c2VNb3ZlKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc01vdXNlRG93bikgeyByZXR1cm47IH1cblxuICAgICAgICBpZiAodGhpcy5pc01vdXNlTWlkZGxlICYmICF0aGlzLmRpc2FibGVQYW4pIHtcbiAgICAgICAgICAgIHRoaXMucGFuKGV2ZW50Lm1vdmVtZW50WCB8IDAsIGV2ZW50Lm1vdmVtZW50WSB8IDApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzTW91c2VMZWZ0KSB7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZShldmVudC5tb3ZlbWVudFggfCAwLCBldmVudC5tb3ZlbWVudFkgfCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbk1vdXNlVXAoZXZlbnQ6IGFueSkge1xuICAgICAgICB0aGlzLl9pc01vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzTW91c2VMZWZ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNNb3VzZU1pZGRsZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbk1vdXNlV2hlZWwoZXZlbnQ6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlTW91c2VXaGVlbCkgeyByZXR1cm47IH1cblxuICAgICAgICBsZXQgZGVsdGFZID0gZXZlbnQud2hlZWxEZWx0YVk7XG4gICAgICAgIGlmIChNYXRoLmFicyhkZWx0YVkgLSB0aGlzLmxhc3RNb3VzZVdoZWVsRGVsdGFZKSA+IHRoaXMubWF4TW91c2VXaGVlbERlbHRhWSkge1xuICAgICAgICAgICAgZGVsdGFZID0gdGhpcy5sYXN0TW91c2VXaGVlbERlbHRhWSArIE1hdGguc2lnbihkZWx0YVkpICogdGhpcy5tYXhNb3VzZVdoZWVsRGVsdGFZO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2NhbGUoZGVsdGFZICogdGhpcy53aGVlbEJhc2VTY2FsZSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9tb2RlbE5vZGU6IE5vZGUgfCB1bmRlZmluZWQ7XG5cbiAgICBwdWJsaWMgb25LZXlEb3duKGV2ZW50OiBhbnkpIHtcbiAgICB9XG5cbiAgICBzbW9vdGhTY2FsZTJEKGN1clNjYWxlOiBudW1iZXIsIGRlbHRhOiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KDIsIGRlbHRhICogMC4wMDIpICogY3VyU2NhbGU7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNjYWxlKGRlbHRhOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNPcnRobykge1xuICAgICAgICAgICAgY29uc3QgbmV3U2NhbGUgPSB0aGlzLnNtb290aFNjYWxlMkQodGhpcy5zY2FsZTJELCBkZWx0YSk7XG4gICAgICAgICAgICBsZXQgbmV3T3J0aG9IZWlnaHQgPSB0aGlzLmNhbWVyYUNvbXAub3J0aG9IZWlnaHQ7XG4gICAgICAgICAgICBuZXdPcnRob0hlaWdodCArPSBkZWx0YSAqIHRoaXMud2hlZWxTcGVlZCAqIG5ld1NjYWxlICogdGhpcy5vcnRob1NjYWxlO1xuICAgICAgICAgICAgaWYgKG5ld09ydGhvSGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICAgIG5ld09ydGhvSGVpZ2h0ID0gMC4wMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY2FtZXJhQ29tcC5vcnRob0hlaWdodCA9IG5ld09ydGhvSGVpZ2h0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHNjYWxhciA9IHRoaXMudmlld0Rpc3Q7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoc2NhbGFyKSA8IHRoaXMuX21pblNjYWxhcikge1xuICAgICAgICAgICAgICAgIHNjYWxhciA9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbHRhID0gc21vb3RoTW91c2VXaGVlbFNjYWxlKGRlbHRhKTtcblxuICAgICAgICAgICAgY29uc3QgY2FtZXJhTm9kZSA9IHRoaXMuY2FtZXJhQ29tcC5ub2RlO1xuICAgICAgICAgICAgY2FtZXJhTm9kZS5nZXRXb3JsZFBvc2l0aW9uKHRoaXMuX2N1clBvcyk7XG4gICAgICAgICAgICBjYW1lcmFOb2RlLmdldFdvcmxkUm90YXRpb24odGhpcy5fY3VyUm90KTtcbiAgICAgICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh0aGlzLl9mb3J3YXJkLCBWZWMzLlVOSVRfWiwgdGhpcy5fY3VyUm90KTtcblxuICAgICAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcih0aGlzLl92M2EsIHRoaXMuX2ZvcndhcmQsIGRlbHRhICogdGhpcy53aGVlbFNwZWVkICogc2NhbGFyKTtcbiAgICAgICAgICAgIFZlYzMuYWRkKHRoaXMuX2N1clBvcywgdGhpcy5fY3VyUG9zLCB0aGlzLl92M2EpO1xuICAgICAgICAgICAgbWFrZVZlYzNJblJhbmdlKHRoaXMuX2N1clBvcywgLTFlMTIsIDFlMTIpO1xuXG4gICAgICAgICAgICB0aGlzLnZpZXdEaXN0ID0gVmVjMy5kaXN0YW5jZSh0aGlzLl9jdXJQb3MsIHRoaXMudmlld0NlbnRlcik7XG4gICAgICAgICAgICBjYW1lcmFOb2RlLnNldFdvcmxkUG9zaXRpb24odGhpcy5fY3VyUG9zKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCByb3RhdGUoZHg6IG51bWJlciwgZHk6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuX2lzTW91c2VEb3duICYmICF0aGlzLmlzTW91c2VMZWZ0KSB7IHJldHVybjsgfVxuICAgICAgICB0aGlzLmNhbWVyYUNvbXAubm9kZS5nZXRXb3JsZFJvdGF0aW9uKHRoaXMuX2N1clJvdCk7XG4gICAgICAgIGNvbnN0IHJvdCA9IHRoaXMuX2N1clJvdDtcbiAgICAgICAgY29uc3QgZXVsZXIgPSBjYy52MygpO1xuXG4gICAgICAgIFF1YXQucm90YXRlWChyb3QsIHJvdCwgLWR5ICogdGhpcy5vcmJpdFJvdGF0ZVNwZWVkKTtcbiAgICAgICAgUXVhdC5yb3RhdGVBcm91bmQocm90LCByb3QsIFZlYzMuVU5JVF9ZLCAtZHggKiB0aGlzLm9yYml0Um90YXRlU3BlZWQpO1xuICAgICAgICBRdWF0LnRvRXVsZXIoZXVsZXIsIHJvdCk7XG5cbiAgICAgICAgUXVhdC5mcm9tRXVsZXIocm90LCBldWxlci54LCBldWxlci55LCAwKTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gY2MudjMoMCwgMCwgMSk7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdChvZmZzZXQsIG9mZnNldCwgcm90KTtcbiAgICAgICAgVmVjMy5ub3JtYWxpemUob2Zmc2V0LCBvZmZzZXQpO1xuXG4gICAgICAgIFZlYzMubXVsdGlwbHlTY2FsYXIob2Zmc2V0LCBvZmZzZXQsIHRoaXMudmlld0Rpc3QpO1xuICAgICAgICBWZWMzLmFkZCh0aGlzLl9jdXJQb3MsIHRoaXMudmlld0NlbnRlciwgb2Zmc2V0KTtcbiAgICAgICAgdGhpcy5jYW1lcmFDb21wLm5vZGUuc2V0V29ybGRQb3NpdGlvbih0aGlzLl9jdXJQb3MpO1xuXG4gICAgICAgIGNvbnN0IHVwID0gY2MudjMoMCwgMSwgMCk7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh1cCwgdXAsIHJvdCk7XG4gICAgICAgIFZlYzMubm9ybWFsaXplKHVwLCB1cCk7XG4gICAgICAgIHRoaXMuY2FtZXJhQ29tcC5ub2RlLmxvb2tBdCh0aGlzLnZpZXdDZW50ZXIsIHVwKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcGFuKGR4OiBudW1iZXIsIGR5OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc01vdXNlRG93biAmJiAhdGhpcy5pc01vdXNlTWlkZGxlKSB7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBzY2FsYXIgPSB0aGlzLnZpZXdEaXN0IC8gODAwO1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5jYW1lcmFDb21wLm5vZGU7XG4gICAgICAgIGNvbnN0IGN1clBvcyA9IHRoaXMuX2N1clBvcztcblxuICAgICAgICBWZWMzLm11bHRpcGx5U2NhbGFyKHRoaXMuX3YzYSwgdGhpcy5fcmlnaHQsIC1keCAqIHRoaXMucGFubmluZ1NwZWVkICogc2NhbGFyKTtcbiAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcih0aGlzLl92M2IsIHRoaXMuX3VwLCBkeSAqIHRoaXMucGFubmluZ1NwZWVkICogc2NhbGFyKTtcblxuICAgICAgICBub2RlLmdldFdvcmxkUG9zaXRpb24oY3VyUG9zKTtcbiAgICAgICAgVmVjMy5hZGQoY3VyUG9zLCBjdXJQb3MsIHRoaXMuX3YzYSk7XG4gICAgICAgIFZlYzMuYWRkKGN1clBvcywgY3VyUG9zLCB0aGlzLl92M2IpO1xuICAgICAgICBub2RlLnNldFdvcmxkUG9zaXRpb24oY3VyUG9zKTtcblxuICAgICAgICBWZWMzLmFkZCh0aGlzLnZpZXdDZW50ZXIsIHRoaXMudmlld0NlbnRlciwgdGhpcy5fdjNhKTtcbiAgICAgICAgVmVjMy5hZGQodGhpcy52aWV3Q2VudGVyLCB0aGlzLnZpZXdDZW50ZXIsIHRoaXMuX3YzYik7XG4gICAgICAgIHRoaXMudmlld0Rpc3QgPSBWZWMzLmRpc3RhbmNlKGN1clBvcywgdGhpcy52aWV3Q2VudGVyKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlVmlld0NlbnRlckJ5RGlzdCh2aWV3RGlzdDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNhbWVyYUNvbXAubm9kZTtcbiAgICAgICAgY29uc3QgY3VyUG9zID0gdGhpcy5fY3VyUG9zO1xuICAgICAgICBub2RlLmdldFdvcmxkUG9zaXRpb24oY3VyUG9zKTtcbiAgICAgICAgbm9kZS5nZXRXb3JsZFJvdGF0aW9uKHRoaXMuX2N1clJvdCk7XG4gICAgICAgIFZlYzMudHJhbnNmb3JtUXVhdCh0aGlzLl9mb3J3YXJkLCBWZWMzLlVOSVRfWiwgdGhpcy5fY3VyUm90KTtcbiAgICAgICAgVmVjMy5tdWx0aXBseVNjYWxhcih0aGlzLl92M2EsIHRoaXMuX2ZvcndhcmQsIHZpZXdEaXN0KTtcbiAgICAgICAgVmVjMy5hZGQodGhpcy52aWV3Q2VudGVyLCBjdXJQb3MsIHRoaXMuX3YzYSk7XG4gICAgfVxuXG4gICAgcHVibGljIGhpZGUoKSB7XG4gICAgICAgIHRoaXMuY2FtZXJhQ29tcC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLmNhbWVyYSkge1xuICAgICAgICAgICAgdGhpcy5jYW1lcmEuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLndvcmxkQXhpcykge1xuICAgICAgICAgICAgdGhpcy53b3JsZEF4aXMuaGlkZSgpO1xuICAgICAgICAgICAgdGhpcy53b3JsZEF4aXMuX3NjZW5lR2l6bW9DYW1lcmEuY2FtZXJhLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZXNldENhbWVyYVZpZXcoKSB7XG4gICAgfVxufVxuXG5leHBvcnQgeyBJbnRlcmFjdGl2ZVByZXZpZXcsIGdldEJvdW5kYXJ5T2ZNZXNoTm9kZXMgfTtcbiJdfQ==