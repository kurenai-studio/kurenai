"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraService = void 0;
const cc_1 = require("cc");
const core_1 = require("./core");
const decorator_1 = require("./core/decorator");
const camera_controller_2d_1 = require("./camera/camera-controller-2d");
const camera_controller_3d_1 = require("./camera/camera-controller-3d");
const utils_1 = require("./camera/utils");
const editor_camera_component_1 = __importDefault(require("./camera/editor-camera-component"));
const types_1 = require("./operation/types");
const rpc_1 = require("../rpc");
/**
 * 相机服务，管理编辑器相机的 2D/3D 控制器切换、输入事件绑定和相机属性
 */
let CameraService = class CameraService extends core_1.BaseService {
    _controller2D;
    _controller3D;
    _controller;
    _camera;
    _controllerFirstChange = false;
    _currentUuid = '';
    _cameraInfos = {};
    _cameraUuids = [];
    get controller2D() { return this._controller2D; }
    get controller3D() { return this._controller3D; }
    get controller() { return this._controller; }
    get camera() { return this._camera; }
    set is2D(value) {
        if (this._controller && this.is2D === value)
            return;
        if (this._controller) {
            this._controller.active = false;
        }
        this._controller = value ? this._controller2D : this._controller3D;
        // 先同步 ttd.is2D 再激活控制器，确保 gizmo adjustControllerSize 使用正确的维度状态
        const ttd = decorator_1.Service.Gizmo?.transformToolData;
        if (ttd && ttd.is2D !== value) {
            ttd.is2D = value;
        }
        this._controller.active = true;
        if (!this._controllerFirstChange && this._currentUuid) {
            this.defaultFocus(this._currentUuid);
            this._controllerFirstChange = true;
        }
        decorator_1.Service.Engine.repaintInEditMode();
    }
    get is2D() { return this._controller === this._controller2D; }
    init() {
        this._controller2D = new camera_controller_2d_1.CameraController2D();
        this._controller3D = new camera_controller_3d_1.CameraController3D();
        this._controller = this._controller3D;
        // 实际相机初始化在 onEditorOpened 中场景就绪后进行
        // 绑定操作事件
        this.bindOperation();
    }
    /**
     * 场景就绪时调用，创建编辑器相机并初始化控制器
     */
    onEditorOpened() {
        try {
            // 一次性初始化：创建编辑器相机和控制器
            if (!this._camera) {
                const backgroundNode = decorator_1.Service.Gizmo?.backgroundNode || cc.director?.getScene();
                if (!backgroundNode)
                    return;
                const cam = utils_1.CameraUtils.createCamera(new cc_1.Color(48, 48, 48, 0), backgroundNode, editor_camera_component_1.default);
                this._camera = cam;
                this._controller2D.init(cam);
                this._controller3D.init(cam);
                this._controller.active = true;
                this._controller3D.on('mode', (mode) => {
                    this.emit('camera:mode-change', mode);
                });
                this._controller3D.on('projection-changed', (projection) => {
                    this.emit('camera:projection-changed', projection);
                });
                try {
                    const view = cc.view;
                    if (view?.on) {
                        view.on('canvas-resize', () => {
                            const canvas = cc.game?.canvas;
                            if (canvas) {
                                decorator_1.Service.Operation.dispatch('resize', { width: canvas.width, height: canvas.height });
                            }
                        });
                    }
                }
                catch (e) {
                    // view may not be ready
                }
            }
            const initConfigTask = this.initFromConfig();
            this.refresh();
            const uuid = this._getCurrentViewUuid();
            if (this._currentUuid !== uuid) {
                this._currentUuid = uuid;
                this._controllerFirstChange = false;
            }
            this._detachSceneCameras();
            void this._restoreCameraView(initConfigTask);
        }
        catch (e) {
            console.warn('[Camera] onEditorOpened failed:', e);
        }
    }
    async _restoreCameraView(initConfigTask) {
        const uuid = this._currentUuid;
        try {
            await initConfigTask;
            await this.loadCameraInfos();
            if (uuid !== this._currentUuid) {
                return;
            }
            this._controller.updateGrid();
            this.defaultFocus(uuid);
            this._refreshSelectedGizmos();
            decorator_1.Service.Engine.repaintInEditMode();
        }
        catch (e) {
            console.warn('[Camera] restore camera view failed:', e);
        }
    }
    _getCurrentViewUuid() {
        try {
            const editorUuid = decorator_1.Service.Editor
                .getCurrentEditorUuid?.();
            if (editorUuid) {
                return editorUuid;
            }
        }
        catch {
            // Editor service may not be registered in early init or isolated tests.
        }
        const scene = cc.director?.getScene?.();
        return scene?.uuid || '';
    }
    _refreshSelectedGizmos() {
        try {
            decorator_1.Service.Gizmo
                .refreshSelectedGizmos?.();
        }
        catch {
            // Selection/Gizmo may not be registered while opening isolated editor views.
        }
    }
    async initFromConfig() {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            const config = await rpc.request('sceneConfigInstance', 'get', ['camera', 'local']);
            if (config) {
                this._applyConfig(config, false);
            }
            const gizmoConfig = await rpc.request('sceneConfigInstance', 'get', ['gizmo']);
            if (gizmoConfig) {
                this._applyGizmoViewMode(gizmoConfig);
                this._applyGizmoDisplay(gizmoConfig);
            }
        }
        catch {
            // 配置不可用时使用默认值
        }
    }
    /**
     * 加载相机视角记忆（按 scene UUID 存储）。每次打开场景都要重新加载，
     * 因为 CameraService 会在多个场景间复用，只在首次创建相机时加载会导致后续场景取到旧数据。
     */
    async loadCameraInfos() {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            const cameraInfos = await rpc.request('sceneConfigInstance', 'get', ['camera-infos', 'local']);
            const cameraUuids = await rpc.request('sceneConfigInstance', 'get', ['camera-uuids', 'local']);
            this._cameraInfos = cameraInfos || {};
            this._cameraUuids = cameraUuids || [];
        }
        catch {
            // camera-infos 不存在时使用默认空值
        }
    }
    _applyGizmoDisplay(config) {
        if (config.gridVisible !== undefined)
            this.setGridVisible(config.gridVisible, false);
        if (config.gridColor !== undefined)
            this.setGridColor(config.gridColor, false);
        this._syncControllerGridVisibility();
        decorator_1.Service.Engine.repaintInEditMode();
    }
    _applyGizmoViewMode(config) {
        if (config.is2D !== undefined && this.is2D !== config.is2D) {
            this.is2D = config.is2D;
        }
    }
    setGridColor(color, persist = true) {
        if (!color || color.length < 3)
            return;
        // gridColor 的配置归 Gizmo 的 GizmoConfig 所有并由其统一持久化（与 cocos-editor GizmoManager 一致）。
        // 面板经由本方法改色时转交 Gizmo：更新运行时配置并定向落盘（gizmo.gridColor），避免只改渲染而不落盘（重开丢失）。
        // Gizmo.setGridColor 内部会回调本方法（persist=false）完成 2D/3D 控制器渲染。
        if (persist) {
            const gizmo = (0, decorator_1.queryRegisteredService)('Gizmo');
            if (gizmo) {
                gizmo.setGridColor(color); // 其内部会回调 setGridColor(color, false) 完成渲染
                return;
            }
        }
        const [r = 166, g = 166, b = 166, a = 255] = color;
        this._controller3D.lineColor = new cc_1.Color(r, g, b, a);
        this._controller3D.updateGrid();
        this._controller2D.lineColor = new cc_1.Color(r, g, b, a);
        this._controller2D.updateGrid();
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    setOriginAxes2D(originAxes) {
        this._controller2D.updateOriginAxisByConfig?.({
            x: originAxes.x,
            y: originAxes.y,
        });
        this._syncControllerGridVisibility();
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    setOriginAxes3D(originAxes) {
        this._controller3D.updateOriginAxisByConfig?.(originAxes);
        this._syncControllerGridVisibility();
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    _applyConfig(config, persist) {
        if (config.color !== undefined)
            this.setCameraProperty({ clearColor: config.color }, false);
        if (config.fov !== undefined)
            this.setCameraProperty({ fov: config.fov }, false);
        if (config.far !== undefined) {
            this._controller3D.far = config.far;
            if (this._camera && !this.is2D)
                this._camera.far = config.far;
        }
        if (config.near !== undefined) {
            this._controller3D.near = config.near;
            if (this._camera && !this.is2D)
                this._camera.near = config.near;
        }
        if (config.wheelSpeed !== undefined)
            this._controller3D.wheelSpeed = config.wheelSpeed;
        if (config.wanderSpeed !== undefined)
            this._controller3D.wanderSpeed = config.wanderSpeed;
        if (config.enableAcceleration !== undefined)
            this._controller3D.enableAcceleration = config.enableAcceleration;
        if (config.far2D !== undefined) {
            this._controller2D.far = config.far2D;
            if (this._camera && this.is2D)
                this._camera.far = config.far2D;
        }
        if (config.near2D !== undefined) {
            this._controller2D.near = config.near2D;
            if (this._camera && this.is2D)
                this._camera.near = config.near2D;
        }
        if (config.wheelSpeed2D !== undefined)
            this._controller2D.wheelSpeed = config.wheelSpeed2D;
        if (config.aperture !== undefined || config.shutter !== undefined || config.iso !== undefined) {
            this.setCameraProperty({
                aperture: config.aperture,
                shutter: config.shutter,
                iso: config.iso,
            }, false);
        }
        decorator_1.Service.Engine.repaintInEditMode();
        if (persist) {
            void this._saveConfig();
        }
    }
    async _saveConfig() {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            await rpc.request('sceneConfigInstance', 'set', ['camera', this.queryConfig(), 'local']);
        }
        catch {
            // Config persistence not available
        }
    }
    bindOperation() {
        const handlers = {
            dblclick: (event) => this.onMouseDBlDown(event),
            mousedown: (event) => this.onMouseDown(event),
            mousemove: (event) => this.onMouseMove(event),
            mouseup: (event) => this.onMouseUp(event),
            mousewheel: (event) => this.onMouseWheel(event),
            keydown: (event) => this.onKeyDown(event),
            keyup: (event) => this.onKeyUp(event),
            resize: (size) => this.onResize(size),
        };
        for (const [eventType, handler] of Object.entries(handlers)) {
            decorator_1.Service.Operation.addListener(eventType, handler, types_1.OperationPriority.Camera);
        }
    }
    // --- 代理方法 ---
    focus(nodes, editorCameraInfo, immediate = false) {
        this._controller?.focus(nodes, editorCameraInfo, immediate);
    }
    defaultFocus(uuid) {
        const cameraInfo = this._cameraInfos[uuid];
        if (this._camera?.camera) {
            this._camera.camera.update();
        }
        if (cameraInfo) {
            this.focus(null, cameraInfo, true);
        }
        else {
            const rootNode = decorator_1.Service.Editor?.getRootNode?.();
            let uuids = rootNode?.uuid ? [rootNode.uuid] : null;
            if (this.is2D && rootNode) {
                const canvas = rootNode.getComponentInChildren?.(cc_1.Canvas);
                if (canvas && canvas.node) {
                    uuids = [canvas.node.uuid];
                }
            }
            this.focus(uuids, undefined, true);
        }
    }
    rotateCameraToDir(dir, rotateByViewDist) {
        this._controller?.rotateCameraToDir(dir, rotateByViewDist);
    }
    changeProjection() {
        this._controller?.changeProjection();
    }
    setGridVisible(value, persist = true) {
        if (value === undefined || value === null)
            return;
        this._controller2D.isGridVisible = value;
        this._controller3D.isGridVisible = value;
        this._syncControllerGridVisibility();
        decorator_1.Service.Engine.repaintInEditMode();
        if (persist) {
            const rpc = rpc_1.Rpc.getInstance();
            void rpc.request('sceneConfigInstance', 'set', ['gizmo.gridVisible', value, 'local']).catch(() => { });
        }
    }
    isGridVisible() {
        return this._controller?.isGridVisible ?? true;
    }
    _syncControllerGridVisibility() {
        if (!this._controller || !this._controller2D || !this._controller3D)
            return;
        const activeCtrl = this._controller;
        const inactiveCtrl = activeCtrl === this._controller3D
            ? this._controller2D
            : this._controller3D;
        activeCtrl.showGrid(activeCtrl.isGridVisible);
        inactiveCtrl.showGrid(false);
    }
    setCameraProperty(options, persist = true) {
        if (typeof options !== 'object' || !this._camera)
            return;
        Object.keys(options).forEach((key) => {
            if (options[key] == null)
                return;
            if (key === 'clearColor') {
                this._camera[key] = cc.color(options[key][0], options[key][1], options[key][2], options[key][3]);
            }
            else if (key === 'near' || key === 'far') {
                this._controller[key] = options[key];
                this._camera[key] = options[key];
            }
            else if (key === 'fov') {
                this.emit('camera:fov-changed', options[key]);
                this._camera[key] = options[key];
            }
            else {
                this._camera[key] = options[key];
            }
        });
        decorator_1.Service.Engine.repaintInEditMode();
        if (persist) {
            void this._saveConfig();
        }
    }
    resetCameraProperty() {
        this._controller3D.wanderSpeed = 10;
        this._controller3D.enableAcceleration = true;
        this.setCameraProperty({ aperture: 19, shutter: 7, iso: 0 }, false);
        if (this.is2D) {
            this._controller2D.wheelSpeed = 6;
            this.setCameraProperty({ fov: 45, far: 10000, near: 6, clearColor: [48, 48, 48, 255] });
        }
        else {
            this._controller3D.wheelSpeed = 0.01;
            this.setCameraProperty({ fov: 45, far: 10000, near: 0.01, clearColor: [48, 48, 48, 255] });
        }
        decorator_1.Service.Engine.repaintInEditMode();
    }
    queryConfig() {
        const clearColor = this._camera?.clearColor;
        const camera = this._camera;
        return {
            color: clearColor
                ? [Math.round(clearColor.r), Math.round(clearColor.g), Math.round(clearColor.b), Math.round(clearColor.a)]
                : [48, 48, 48, 255],
            fov: this._camera?.fov ?? 45,
            // 3D 的 near/far 取自 3D 控制器，避免受当前激活相机（可能是 2D）影响
            far: this._controller3D.far,
            near: this._controller3D.near,
            wheelSpeed: this._controller3D.wheelSpeed,
            wanderSpeed: this._controller3D.wanderSpeed,
            enableAcceleration: this._controller3D.enableAcceleration,
            far2D: this._controller2D.far,
            near2D: this._controller2D.near,
            wheelSpeed2D: this._controller2D.wheelSpeed,
            aperture: typeof camera?.aperture === 'number' ? camera.aperture : 19,
            shutter: typeof camera?.shutter === 'number' ? camera.shutter : 7,
            iso: typeof camera?.iso === 'number' ? camera.iso : 0,
        };
    }
    updateConfig(config) {
        if (!config || typeof config !== 'object')
            return;
        this._applyConfig(config, true);
    }
    getCameraFov() {
        return this._camera?.fov ?? 45;
    }
    zoomUp() { this._controller?.zoomUp(); }
    zoomDown() { this._controller?.zoomDown(); }
    zoomReset() { this._controller?.zoomReset(); }
    alignNodeToSceneView(nodes) {
        this._controller?.alignNodeToSceneView(nodes);
    }
    alignSceneViewToNode(nodes) {
        this._controller?.alignSceneViewToNode(nodes);
    }
    onUpdate(deltaTime) {
        this._controller?.onUpdate(deltaTime);
    }
    // --- 输入事件代理 ---
    onMouseDBlDown(event) { return this._controller?.onMouseDBlDown(event); }
    onMouseDown(event) { return this._controller?.onMouseDown(event); }
    onMouseMove(event) { return this._controller?.onMouseMove(event); }
    onMouseUp(event) { return this._controller?.onMouseUp(event); }
    onMouseWheel(event) { return this._controller?.onMouseWheel(event); }
    onKeyDown(event) { return this._controller?.onKeyDown(event); }
    onKeyUp(event) { return this._controller?.onKeyUp(event); }
    // --- 其他方法 ---
    onResize(size) {
        this._controller?.onResize(size);
    }
    refresh() {
        this._controller?.refresh();
    }
    getCamera() {
        return this._camera;
    }
    getCurCameraInfo() {
        const curCameraNode = this._controller3D.node;
        const curCameraPos = curCameraNode.getWorldPosition();
        const curCameraRot = curCameraNode.getWorldRotation();
        const position = { x: curCameraPos.x, y: curCameraPos.y, z: curCameraPos.z };
        const rotation = { x: curCameraRot.x, y: curCameraRot.y, z: curCameraRot.z, w: curCameraRot.w };
        const sceneViewCenter = this._controller3D.sceneViewCenter;
        const viewCenter = { x: sceneViewCenter.x, y: sceneViewCenter.y, z: sceneViewCenter.z };
        // 2D 视图状态（对齐 Creator：一并记录 contentRect + scale2D，使 2D 场景视角可完整恢复）
        const rect2D = this._controller2D.contentRect;
        const contentRect = { x: rect2D.x, y: rect2D.y, width: rect2D.width, height: rect2D.height };
        const scale = this._controller2D.scale2D;
        return { position, rotation, viewCenter, contentRect, scale };
    }
    async saveCameraInfos(uuid, write = true) {
        uuid = uuid ?? this._currentUuid;
        if (!uuid)
            return;
        const cameraInfo = this.getCurCameraInfo();
        const index = this._cameraUuids.indexOf(uuid);
        if (index !== -1) {
            delete this._cameraInfos[uuid];
            this._cameraUuids.splice(index, 1);
            this._cameraUuids.push(uuid);
        }
        else {
            this._cameraUuids.push(uuid);
            if (this._cameraUuids.length > 50) {
                delete this._cameraInfos[this._cameraUuids[0]];
                this._cameraUuids.splice(0, 1);
            }
        }
        this._cameraInfos[uuid] = cameraInfo;
        if (write) {
            try {
                const rpc = rpc_1.Rpc.getInstance();
                await rpc.request('sceneConfigInstance', 'set', ['camera-infos', this._cameraInfos, 'local']);
                await rpc.request('sceneConfigInstance', 'set', ['camera-uuids', this._cameraUuids, 'local']);
            }
            catch {
                // persistence not available
            }
        }
    }
    onEditorClosed() {
        this.saveCameraInfos(undefined, false);
    }
    onEditorSaved() {
        void this.saveCameraInfos();
    }
    /**
     * 与原始编辑器 ScenePreview.detachSceneCameras 一致：
     * 将所有非编辑器的场景相机从渲染管线中移除，并设置 tempWindow
     * 使后续新建的相机默认渲染到离屏窗口，不干扰编辑器相机。
     */
    _detachSceneCameras() {
        try {
            const root = cc.director?.root;
            const scene = cc.director?.getScene();
            if (!root || !scene)
                return;
            const editorMask = cc_1.Layers.makeMaskInclude([
                cc_1.Layers.Enum.GIZMOS,
                cc_1.Layers.Enum.SCENE_GIZMO,
                cc_1.Layers.Enum.EDITOR,
            ]);
            const renderScene = scene.renderScene || scene._renderScene;
            if (renderScene) {
                const cameras = [...renderScene.cameras];
                for (const cam of cameras) {
                    if (!cam || !cam.node)
                        continue;
                    if (cam.node.layer & editorMask)
                        continue;
                    const comp = cam.node.getComponent?.('cc.Camera');
                    if (comp) {
                        cam.detachCamera();
                    }
                }
            }
            // 设置 tempWindow，与原始编辑器一致：
            // 后续新建的相机 (_inEditorMode=false) 会默认渲染到 tempWindow 而非 mainWindow
            if (root.createWindow && root.mainWindow && !root.tempWindow) {
                try {
                    const mainSwapchain = root.mainWindow.swapchain;
                    if (mainSwapchain) {
                        const renderPassInfo = new cc_1.gfx.RenderPassInfo([new cc_1.gfx.ColorAttachment(root.mainWindow.swapchain.colorTexture.format)], new cc_1.gfx.DepthStencilAttachment(root.mainWindow.swapchain.depthStencilTexture.format));
                        renderPassInfo.colorAttachments[0].barrier = root.device.getGeneralBarrier(new cc_1.gfx.GeneralBarrierInfo(0, cc_1.gfx.AccessFlagBit.FRAGMENT_SHADER_READ_TEXTURE));
                        const win = root.createWindow({
                            title: 'CLI Temp',
                            width: 1,
                            height: 1,
                            renderPassInfo,
                            swapchain: mainSwapchain,
                        });
                        if (win)
                            root.tempWindow = win;
                    }
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
        catch (e) {
            console.warn('[Camera] _detachSceneCameras failed:', e);
        }
    }
    /**
     * 新增的 Camera 组件也需要 detach，与原始编辑器 ScenePreview.onComponentAdded 一致
     */
    detachNewSceneCamera(comp) {
        if (!comp || !(comp instanceof cc_1.Camera))
            return;
        const editorMask = cc_1.Layers.makeMaskInclude([
            cc_1.Layers.Enum.GIZMOS,
            cc_1.Layers.Enum.SCENE_GIZMO,
            cc_1.Layers.Enum.EDITOR,
        ]);
        if (comp.node?.layer & editorMask)
            return;
        if (comp === this._camera)
            return;
        Promise.resolve().then(() => {
            if (comp.camera) {
                comp.camera.detachCamera();
            }
        });
    }
    onComponentAdded(comp) {
        this.detachNewSceneCamera(comp);
    }
};
exports.CameraService = CameraService;
exports.CameraService = CameraService = __decorate([
    (0, decorator_1.register)('Camera')
], CameraService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FtZXJhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2NhbWVyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQkFBOEQ7QUFDOUQsaUNBQXFDO0FBQ3JDLGdEQUE2RTtBQUM3RSx3RUFBbUU7QUFDbkUsd0VBQW1FO0FBRW5FLDBDQUE2RDtBQUM3RCwrRkFBcUU7QUFDckUsNkNBQXNEO0FBQ3RELGdDQUE2QjtBQUk3Qjs7R0FFRztBQUVJLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxrQkFBMEI7SUFDakQsYUFBYSxDQUFzQjtJQUNuQyxhQUFhLENBQXNCO0lBQ25DLFdBQVcsQ0FBd0I7SUFDbkMsT0FBTyxDQUF5QjtJQUNoQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7SUFDL0IsWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUNsQixZQUFZLEdBQXdCLEVBQUUsQ0FBQztJQUN2QyxZQUFZLEdBQWEsRUFBRSxDQUFDO0lBRXBDLElBQUksWUFBWSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDakQsSUFBSSxZQUFZLEtBQUssT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUNqRCxJQUFJLFVBQVUsS0FBSyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQzdDLElBQUksTUFBTSxLQUFLLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFckMsSUFBSSxJQUFJLENBQUMsS0FBYztRQUNuQixJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLO1lBQUUsT0FBTztRQUNwRCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDcEMsQ0FBQztRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQ25FLDhEQUE4RDtRQUM5RCxNQUFNLEdBQUcsR0FBRyxtQkFBTyxDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQztRQUM3QyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEtBQUssRUFBRSxDQUFDO1lBQzVCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUM7UUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQztRQUN2QyxDQUFDO1FBQ0QsbUJBQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRUQsSUFBSSxJQUFJLEtBQUssT0FBTyxJQUFJLENBQUMsV0FBVyxLQUFLLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBRTlELElBQUk7UUFDQSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUkseUNBQWtCLEVBQUUsQ0FBQztRQUM5QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUkseUNBQWtCLEVBQUUsQ0FBQztRQUM5QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7UUFFdEMsbUNBQW1DO1FBQ25DLFNBQVM7UUFDVCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsY0FBYztRQUNWLElBQUksQ0FBQztZQUNELHFCQUFxQjtZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQixNQUFNLGNBQWMsR0FBRyxtQkFBTyxDQUFDLEtBQUssRUFBRSxjQUFjLElBQUssRUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDekYsSUFBSSxDQUFDLGNBQWM7b0JBQUUsT0FBTztnQkFFNUIsTUFBTSxHQUFHLEdBQUcsbUJBQVcsQ0FBQyxZQUFZLENBQ2hDLElBQUksVUFBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxpQ0FBcUIsQ0FDekMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUUvQixJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFvQixFQUFFLEVBQUU7b0JBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzFDLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsVUFBa0IsRUFBRSxFQUFFO29CQUMvRCxJQUFJLENBQUMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN2RCxDQUFDLENBQUMsQ0FBQztnQkFFSCxJQUFJLENBQUM7b0JBQ0QsTUFBTSxJQUFJLEdBQUksRUFBVSxDQUFDLElBQUksQ0FBQztvQkFDOUIsSUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7d0JBQ1gsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFOzRCQUMxQixNQUFNLE1BQU0sR0FBSSxFQUFVLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQzs0QkFDeEMsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQ0FDVCxtQkFBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDOzRCQUN6RixDQUFDO3dCQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULHdCQUF3QjtnQkFDNUIsQ0FBQztZQUVMLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWYsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDeEMsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztnQkFDekIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztZQUN4QyxDQUFDO1lBRUQsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDM0IsS0FBSyxJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxPQUFPLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLGNBQThCO1FBQzNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDL0IsSUFBSSxDQUFDO1lBQ0QsTUFBTSxjQUFjLENBQUM7WUFDckIsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDN0IsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1gsQ0FBQztZQUNELElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUM5QixtQkFBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3ZDLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1RCxDQUFDO0lBQ0wsQ0FBQztJQUVPLG1CQUFtQjtRQUN2QixJQUFJLENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBSSxtQkFBTyxDQUFDLE1BQW9FO2lCQUMzRixvQkFBb0IsRUFBRSxFQUFFLENBQUM7WUFDOUIsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDYixPQUFPLFVBQVUsQ0FBQztZQUN0QixDQUFDO1FBQ0wsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNMLHdFQUF3RTtRQUM1RSxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUksRUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDO1FBQ2pELE9BQU8sS0FBSyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVPLHNCQUFzQjtRQUMxQixJQUFJLENBQUM7WUFDQSxtQkFBTyxDQUFDLEtBQTJEO2lCQUMvRCxxQkFBcUIsRUFBRSxFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNMLDZFQUE2RTtRQUNqRixDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxjQUFjO1FBQ2hCLElBQUksQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM5QixNQUFNLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUE4QixDQUFDO1lBQ2pILElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1QsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUNELE1BQU0sV0FBVyxHQUFHLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBc0MsQ0FBQztZQUNwSCxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7UUFDTCxDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ0wsY0FBYztRQUNsQixDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxlQUFlO1FBQ2pCLElBQUksQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM5QixNQUFNLFdBQVcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDL0YsTUFBTSxXQUFXLEdBQUcsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQy9GLElBQUksQ0FBQyxZQUFZLEdBQUksV0FBbUMsSUFBSSxFQUFFLENBQUM7WUFDL0QsSUFBSSxDQUFDLFlBQVksR0FBSSxXQUF3QixJQUFJLEVBQUUsQ0FBQztRQUN4RCxDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ0wsMEJBQTBCO1FBQzlCLENBQUM7SUFDTCxDQUFDO0lBRU8sa0JBQWtCLENBQUMsTUFBNkI7UUFDcEQsSUFBSSxNQUFNLENBQUMsV0FBVyxLQUFLLFNBQVM7WUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckYsSUFBSSxNQUFNLENBQUMsU0FBUyxLQUFLLFNBQVM7WUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0UsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFDckMsbUJBQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRU8sbUJBQW1CLENBQUMsTUFBNkI7UUFDckQsSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN6RCxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQztJQUNMLENBQUM7SUFFRCxZQUFZLENBQUMsS0FBZSxFQUFFLE9BQU8sR0FBRyxJQUFJO1FBQ3hDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQUUsT0FBTztRQUN2QyxpRkFBaUY7UUFDakYscUVBQXFFO1FBQ3JFLDREQUE0RDtRQUM1RCxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ1YsTUFBTSxLQUFLLEdBQUcsSUFBQSxrQ0FBc0IsRUFBZ0IsT0FBTyxDQUFDLENBQUM7WUFDN0QsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDUixLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMseUNBQXlDO2dCQUNwRSxPQUFPO1lBQ1gsQ0FBQztRQUNMLENBQUM7UUFDRCxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNuRCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxJQUFJLFVBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRCxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxHQUFHLElBQUksVUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEMsbUJBQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFDO0lBQzFDLENBQUM7SUFFRCxlQUFlLENBQUMsVUFBNkI7UUFDeEMsSUFBSSxDQUFDLGFBQXFCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNuRCxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDZixDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDbEIsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFDckMsbUJBQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFDO0lBQzFDLENBQUM7SUFFRCxlQUFlLENBQUMsVUFBNkI7UUFDeEMsSUFBSSxDQUFDLGFBQXFCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUNyQyxtQkFBTyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUVPLFlBQVksQ0FBQyxNQUE4QixFQUFFLE9BQWdCO1FBQ2pFLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxTQUFTO1lBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1RixJQUFJLE1BQU0sQ0FBQyxHQUFHLEtBQUssU0FBUztZQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakYsSUFBSSxNQUFNLENBQUMsR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDcEMsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUNsRSxDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDdEMsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNwRSxDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsVUFBVSxLQUFLLFNBQVM7WUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3ZGLElBQUksTUFBTSxDQUFDLFdBQVcsS0FBSyxTQUFTO1lBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUMxRixJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsS0FBSyxTQUFTO1lBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUM7UUFDL0csSUFBSSxNQUFNLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDdEMsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJO2dCQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDbkUsQ0FBQztRQUNELElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ3hDLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSTtnQkFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3JFLENBQUM7UUFDRCxJQUFJLE1BQU0sQ0FBQyxZQUFZLEtBQUssU0FBUztZQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7UUFDM0YsSUFBSSxNQUFNLENBQUMsUUFBUSxLQUFLLFNBQVMsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLFNBQVMsSUFBSSxNQUFNLENBQUMsR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzVGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztnQkFDbkIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO2dCQUN6QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3ZCLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRzthQUNsQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2QsQ0FBQztRQUNELG1CQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDbkMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNWLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzVCLENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLFdBQVc7UUFDckIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlCLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDN0YsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNMLG1DQUFtQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztJQUVPLGFBQWE7UUFDakIsTUFBTSxRQUFRLEdBQXdDO1lBQ2xELFFBQVEsRUFBRSxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFDcEQsU0FBUyxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUNsRCxTQUFTLEVBQUUsQ0FBQyxLQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQ2xELE9BQU8sRUFBRSxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7WUFDOUMsVUFBVSxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUNwRCxPQUFPLEVBQUUsQ0FBQyxLQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1lBQzlDLEtBQUssRUFBRSxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDMUMsTUFBTSxFQUFFLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztTQUM3QyxDQUFDO1FBRUYsS0FBSyxNQUFNLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUMxRCxtQkFBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsU0FBZ0IsRUFBRSxPQUFPLEVBQUUseUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkYsQ0FBQztJQUNMLENBQUM7SUFFRCxlQUFlO0lBQ2YsS0FBSyxDQUFDLEtBQXVCLEVBQUUsZ0JBQXNCLEVBQUUsU0FBUyxHQUFHLEtBQUs7UUFDcEUsSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsS0FBWSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxZQUFZLENBQUMsSUFBWTtRQUNyQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2QyxDQUFDO2FBQU0sQ0FBQztZQUNKLE1BQU0sUUFBUSxHQUFHLG1CQUFPLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxFQUFTLENBQUM7WUFDeEQsSUFBSSxLQUFLLEdBQW9CLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDckUsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUN4QixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxXQUFNLENBQUMsQ0FBQztnQkFDekQsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN4QixLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQixDQUFDO1lBQ0wsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztJQUVELGlCQUFpQixDQUFDLEdBQVMsRUFBRSxnQkFBeUI7UUFDbEQsSUFBSSxDQUFDLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsZ0JBQWdCO1FBQ1osSUFBSSxDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxjQUFjLENBQUMsS0FBYyxFQUFFLE9BQU8sR0FBRyxJQUFJO1FBQ3pDLElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssSUFBSTtZQUFFLE9BQU87UUFDbEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUN6QyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUNyQyxtQkFBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ25DLElBQUksT0FBTyxFQUFFLENBQUM7WUFDVixNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDOUIsS0FBSyxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLG1CQUFtQixFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUMsQ0FBQztRQUMxRyxDQUFDO0lBQ0wsQ0FBQztJQUVELGFBQWE7UUFDVCxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsYUFBYSxJQUFJLElBQUksQ0FBQztJQUNuRCxDQUFDO0lBRU8sNkJBQTZCO1FBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhO1lBQUUsT0FBTztRQUM1RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3BDLE1BQU0sWUFBWSxHQUFHLFVBQVUsS0FBSyxJQUFJLENBQUMsYUFBYTtZQUNsRCxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWE7WUFDcEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDekIsVUFBVSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDOUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsaUJBQWlCLENBQUMsT0FBWSxFQUFFLE9BQU8sR0FBRyxJQUFJO1FBQzFDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU87WUFBRSxPQUFPO1FBQ3pELE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDakMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSTtnQkFBRSxPQUFPO1lBQ2pDLElBQUksR0FBRyxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQ25DLENBQUM7WUFDTixDQUFDO2lCQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxXQUFtQixDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLE9BQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUMsQ0FBQztpQkFBTSxJQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLE9BQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNILElBQUksQ0FBQyxPQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILG1CQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDbkMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNWLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzVCLENBQUM7SUFDTCxDQUFDO0lBRUQsbUJBQW1CO1FBQ2YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxhQUFhLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQzdDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVGLENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBQ0QsbUJBQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRUQsV0FBVztRQUNQLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFRLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDakMsT0FBTztZQUNILEtBQUssRUFBRSxVQUFVO2dCQUNiLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUM7WUFDdkIsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLEVBQUU7WUFDNUIsOENBQThDO1lBQzlDLEdBQUcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUc7WUFDM0IsSUFBSSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSTtZQUM3QixVQUFVLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVO1lBQ3pDLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVc7WUFDM0Msa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0I7WUFDekQsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRztZQUM3QixNQUFNLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJO1lBQy9CLFlBQVksRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVU7WUFDM0MsUUFBUSxFQUFFLE9BQU8sTUFBTSxFQUFFLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDckUsT0FBTyxFQUFFLE9BQU8sTUFBTSxFQUFFLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakUsR0FBRyxFQUFFLE9BQU8sTUFBTSxFQUFFLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEQsQ0FBQztJQUNOLENBQUM7SUFFRCxZQUFZLENBQUMsTUFBOEI7UUFDdkMsSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRO1lBQUUsT0FBTztRQUNsRCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsWUFBWTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFFRCxNQUFNLEtBQVcsSUFBSSxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUMsUUFBUSxLQUFXLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xELFNBQVMsS0FBVyxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVwRCxvQkFBb0IsQ0FBQyxLQUFlO1FBQ2hDLElBQUksQ0FBQyxXQUFXLEVBQUUsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELG9CQUFvQixDQUFDLEtBQWU7UUFDaEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsUUFBUSxDQUFDLFNBQWlCO1FBQ3RCLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxpQkFBaUI7SUFDVCxjQUFjLENBQUMsS0FBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlFLFdBQVcsQ0FBQyxLQUFVLElBQUksT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEUsV0FBVyxDQUFDLEtBQVUsSUFBSSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxTQUFTLENBQUMsS0FBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLFlBQVksQ0FBQyxLQUFVLElBQUksT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUUsU0FBUyxDQUFDLEtBQVUsSUFBSSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRSxPQUFPLENBQUMsS0FBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhFLGVBQWU7SUFDZixRQUFRLENBQUMsSUFBUztRQUNkLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxPQUFPO1FBQ0gsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsU0FBUztRQUNMLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN4QixDQUFDO0lBRUQsZ0JBQWdCO1FBQ1osTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDOUMsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDdEQsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDdEQsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzdFLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNoRyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQztRQUMzRCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDeEYsZ0VBQWdFO1FBQ2hFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO1FBQzlDLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM3RixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztRQUN6QyxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ2xFLENBQUM7SUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLElBQWEsRUFBRSxLQUFLLEdBQUcsSUFBSTtRQUM3QyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPO1FBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzNDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTlDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDZixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7UUFDTCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUM7UUFDckMsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQztnQkFDRCxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUM5RixNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNsRyxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNMLDRCQUE0QjtZQUNoQyxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFRCxjQUFjO1FBQ1YsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELGFBQWE7UUFDVCxLQUFLLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLG1CQUFtQjtRQUN2QixJQUFJLENBQUM7WUFDRCxNQUFNLElBQUksR0FBSSxFQUFVLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQztZQUN4QyxNQUFNLEtBQUssR0FBSSxFQUFVLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQy9DLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLO2dCQUFFLE9BQU87WUFFNUIsTUFBTSxVQUFVLEdBQUcsV0FBTSxDQUFDLGVBQWUsQ0FBQztnQkFDdEMsV0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNO2dCQUNsQixXQUFNLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3ZCLFdBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTTthQUNyQixDQUFDLENBQUM7WUFFSCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUM7WUFDNUQsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDZCxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6QyxLQUFLLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUN4QixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUk7d0JBQUUsU0FBUztvQkFDaEMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxVQUFVO3dCQUFFLFNBQVM7b0JBQzFDLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ2xELElBQUksSUFBSSxFQUFFLENBQUM7d0JBQ1AsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUN2QixDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBRUQsMEJBQTBCO1lBQzFCLGdFQUFnRTtZQUNoRSxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDM0QsSUFBSSxDQUFDO29CQUNELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO29CQUNoRCxJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUNoQixNQUFNLGNBQWMsR0FBRyxJQUFJLFFBQUcsQ0FBQyxjQUFjLENBQ3pDLENBQUMsSUFBSSxRQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUN4RSxJQUFJLFFBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FDdkYsQ0FBQzt3QkFDRixjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBSSxRQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLFFBQUcsQ0FBQyxhQUFhLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO3dCQUMxSixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDOzRCQUMxQixLQUFLLEVBQUUsVUFBVTs0QkFDakIsS0FBSyxFQUFFLENBQUM7NEJBQ1IsTUFBTSxFQUFFLENBQUM7NEJBQ1QsY0FBYzs0QkFDZCxTQUFTLEVBQUUsYUFBYTt5QkFDM0IsQ0FBQyxDQUFDO3dCQUNILElBQUksR0FBRzs0QkFBRSxJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztvQkFDbkMsQ0FBQztnQkFDTCxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULE9BQU8sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUQsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNILG9CQUFvQixDQUFDLElBQVM7UUFDMUIsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxZQUFZLFdBQU0sQ0FBQztZQUFFLE9BQU87UUFDL0MsTUFBTSxVQUFVLEdBQUcsV0FBTSxDQUFDLGVBQWUsQ0FBQztZQUN0QyxXQUFNLENBQUMsSUFBSSxDQUFDLE1BQU07WUFDbEIsV0FBTSxDQUFDLElBQUksQ0FBQyxXQUFXO1lBQ3ZCLFdBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTTtTQUNyQixDQUFDLENBQUM7UUFDSCxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLFVBQVU7WUFBRSxPQUFPO1FBQzFDLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxPQUFPO1lBQUUsT0FBTztRQUNsQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUN4QixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQy9CLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxJQUFTO1FBQ3RCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxDQUFDO0NBQ0osQ0FBQTtBQTNrQlksc0NBQWE7d0JBQWIsYUFBYTtJQUR6QixJQUFBLG9CQUFRLEVBQUMsUUFBUSxDQUFDO0dBQ04sYUFBYSxDQTJrQnpCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2FtZXJhLCBDYW52YXMsIENvbG9yLCBMYXllcnMsIFZlYzMsIGdmeCB9IGZyb20gJ2NjJztcbmltcG9ydCB7IEJhc2VTZXJ2aWNlIH0gZnJvbSAnLi9jb3JlJztcbmltcG9ydCB7IHJlZ2lzdGVyLCBTZXJ2aWNlLCBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlIH0gZnJvbSAnLi9jb3JlL2RlY29yYXRvcic7XG5pbXBvcnQgeyBDYW1lcmFDb250cm9sbGVyMkQgfSBmcm9tICcuL2NhbWVyYS9jYW1lcmEtY29udHJvbGxlci0yZCc7XG5pbXBvcnQgeyBDYW1lcmFDb250cm9sbGVyM0QgfSBmcm9tICcuL2NhbWVyYS9jYW1lcmEtY29udHJvbGxlci0zZCc7XG5pbXBvcnQgQ2FtZXJhQ29udHJvbGxlckJhc2UgZnJvbSAnLi9jYW1lcmEvY2FtZXJhLWNvbnRyb2xsZXItYmFzZSc7XG5pbXBvcnQgeyBDYW1lcmFNb3ZlTW9kZSwgQ2FtZXJhVXRpbHMgfSBmcm9tICcuL2NhbWVyYS91dGlscyc7XG5pbXBvcnQgRWRpdG9yQ2FtZXJhQ29tcG9uZW50IGZyb20gJy4vY2FtZXJhL2VkaXRvci1jYW1lcmEtY29tcG9uZW50JztcbmltcG9ydCB7IE9wZXJhdGlvblByaW9yaXR5IH0gZnJvbSAnLi9vcGVyYXRpb24vdHlwZXMnO1xuaW1wb3J0IHsgUnBjIH0gZnJvbSAnLi4vcnBjJztcbmltcG9ydCB0eXBlIHsgSUNhbWVyYUNvbmZpZywgSUNhbWVyYUV2ZW50cywgSUNhbWVyYVNlcnZpY2UsIElHaXptb1NlcnZpY2UsIElPcmlnaW5BeGVzQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29tbW9uJztcbmltcG9ydCB0eXBlIHsgSUdpem1vQ29uZmlnIH0gZnJvbSAnLi4vLi4vc2NlbmUtY29uZmlncyc7XG5cbi8qKlxuICog55u45py65pyN5Yqh77yM566h55CG57yW6L6R5Zmo55u45py655qEIDJELzNEIOaOp+WItuWZqOWIh+aNouOAgei+k+WFpeS6i+S7tue7keWumuWSjOebuOacuuWxnuaAp1xuICovXG5AcmVnaXN0ZXIoJ0NhbWVyYScpXG5leHBvcnQgY2xhc3MgQ2FtZXJhU2VydmljZSBleHRlbmRzIEJhc2VTZXJ2aWNlPElDYW1lcmFFdmVudHM+IGltcGxlbWVudHMgSUNhbWVyYVNlcnZpY2Uge1xuICAgIHByaXZhdGUgX2NvbnRyb2xsZXIyRCE6IENhbWVyYUNvbnRyb2xsZXIyRDtcbiAgICBwcml2YXRlIF9jb250cm9sbGVyM0QhOiBDYW1lcmFDb250cm9sbGVyM0Q7XG4gICAgcHJpdmF0ZSBfY29udHJvbGxlciE6IENhbWVyYUNvbnRyb2xsZXJCYXNlO1xuICAgIHByaXZhdGUgX2NhbWVyYSE6IEVkaXRvckNhbWVyYUNvbXBvbmVudDtcbiAgICBwcml2YXRlIF9jb250cm9sbGVyRmlyc3RDaGFuZ2UgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9jdXJyZW50VXVpZCA9ICcnO1xuICAgIHByaXZhdGUgX2NhbWVyYUluZm9zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gICAgcHJpdmF0ZSBfY2FtZXJhVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICBnZXQgY29udHJvbGxlcjJEKCkgeyByZXR1cm4gdGhpcy5fY29udHJvbGxlcjJEOyB9XG4gICAgZ2V0IGNvbnRyb2xsZXIzRCgpIHsgcmV0dXJuIHRoaXMuX2NvbnRyb2xsZXIzRDsgfVxuICAgIGdldCBjb250cm9sbGVyKCkgeyByZXR1cm4gdGhpcy5fY29udHJvbGxlcjsgfVxuICAgIGdldCBjYW1lcmEoKSB7IHJldHVybiB0aGlzLl9jYW1lcmE7IH1cblxuICAgIHNldCBpczJEKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb250cm9sbGVyICYmIHRoaXMuaXMyRCA9PT0gdmFsdWUpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuX2NvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IHZhbHVlID8gdGhpcy5fY29udHJvbGxlcjJEIDogdGhpcy5fY29udHJvbGxlcjNEO1xuICAgICAgICAvLyDlhYjlkIzmraUgdHRkLmlzMkQg5YaN5r+A5rS75o6n5Yi25Zmo77yM56Gu5L+dIGdpem1vIGFkanVzdENvbnRyb2xsZXJTaXplIOS9v+eUqOato+ehrueahOe7tOW6pueKtuaAgVxuICAgICAgICBjb25zdCB0dGQgPSBTZXJ2aWNlLkdpem1vPy50cmFuc2Zvcm1Ub29sRGF0YTtcbiAgICAgICAgaWYgKHR0ZCAmJiB0dGQuaXMyRCAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHR0ZC5pczJEID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udHJvbGxlci5hY3RpdmUgPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMuX2NvbnRyb2xsZXJGaXJzdENoYW5nZSAmJiB0aGlzLl9jdXJyZW50VXVpZCkge1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0Rm9jdXModGhpcy5fY3VycmVudFV1aWQpO1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlckZpcnN0Q2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIGdldCBpczJEKCkgeyByZXR1cm4gdGhpcy5fY29udHJvbGxlciA9PT0gdGhpcy5fY29udHJvbGxlcjJEOyB9XG5cbiAgICBpbml0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyMkQgPSBuZXcgQ2FtZXJhQ29udHJvbGxlcjJEKCk7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXIzRCA9IG5ldyBDYW1lcmFDb250cm9sbGVyM0QoKTtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlciA9IHRoaXMuX2NvbnRyb2xsZXIzRDtcblxuICAgICAgICAvLyDlrp7pmYXnm7jmnLrliJ3lp4vljJblnKggb25FZGl0b3JPcGVuZWQg5Lit5Zy65pmv5bCx57uq5ZCO6L+b6KGMXG4gICAgICAgIC8vIOe7keWumuaTjeS9nOS6i+S7tlxuICAgICAgICB0aGlzLmJpbmRPcGVyYXRpb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlnLrmma/lsLHnu6rml7bosIPnlKjvvIzliJvlu7rnvJbovpHlmajnm7jmnLrlubbliJ3lp4vljJbmjqfliLblmahcbiAgICAgKi9cbiAgICBvbkVkaXRvck9wZW5lZCgpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOS4gOasoeaAp+WIneWni+WMlu+8muWIm+W7uue8lui+keWZqOebuOacuuWSjOaOp+WItuWZqFxuICAgICAgICAgICAgaWYgKCF0aGlzLl9jYW1lcmEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiYWNrZ3JvdW5kTm9kZSA9IFNlcnZpY2UuR2l6bW8/LmJhY2tncm91bmROb2RlIHx8IChjYyBhcyBhbnkpLmRpcmVjdG9yPy5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgICAgIGlmICghYmFja2dyb3VuZE5vZGUpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNhbSA9IENhbWVyYVV0aWxzLmNyZWF0ZUNhbWVyYShcbiAgICAgICAgICAgICAgICAgICAgbmV3IENvbG9yKDQ4LCA0OCwgNDgsIDApLCBiYWNrZ3JvdW5kTm9kZSwgRWRpdG9yQ2FtZXJhQ29tcG9uZW50LFxuICAgICAgICAgICAgICAgICkgYXMgRWRpdG9yQ2FtZXJhQ29tcG9uZW50O1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhbWVyYSA9IGNhbTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyMkQuaW5pdChjYW0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIzRC5pbml0KGNhbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlci5hY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlcjNELm9uKCdtb2RlJywgKG1vZGU6IENhbWVyYU1vdmVNb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnY2FtZXJhOm1vZGUtY2hhbmdlJywgbW9kZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlcjNELm9uKCdwcm9qZWN0aW9uLWNoYW5nZWQnLCAocHJvamVjdGlvbjogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnY2FtZXJhOnByb2plY3Rpb24tY2hhbmdlZCcsIHByb2plY3Rpb24pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IChjYyBhcyBhbnkpLnZpZXc7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2aWV3Py5vbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5vbignY2FudmFzLXJlc2l6ZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYW52YXMgPSAoY2MgYXMgYW55KS5nYW1lPy5jYW52YXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbnZhcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlLk9wZXJhdGlvbi5kaXNwYXRjaCgncmVzaXplJywgeyB3aWR0aDogY2FudmFzLndpZHRoLCBoZWlnaHQ6IGNhbnZhcy5oZWlnaHQgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHZpZXcgbWF5IG5vdCBiZSByZWFkeVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpbml0Q29uZmlnVGFzayA9IHRoaXMuaW5pdEZyb21Db25maWcoKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuXG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdGhpcy5fZ2V0Q3VycmVudFZpZXdVdWlkKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fY3VycmVudFV1aWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50VXVpZCA9IHV1aWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlckZpcnN0Q2hhbmdlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2RldGFjaFNjZW5lQ2FtZXJhcygpO1xuICAgICAgICAgICAgdm9pZCB0aGlzLl9yZXN0b3JlQ2FtZXJhVmlldyhpbml0Q29uZmlnVGFzayk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW0NhbWVyYV0gb25FZGl0b3JPcGVuZWQgZmFpbGVkOicsIGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVzdG9yZUNhbWVyYVZpZXcoaW5pdENvbmZpZ1Rhc2s/OiBQcm9taXNlPHZvaWQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHV1aWQgPSB0aGlzLl9jdXJyZW50VXVpZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGluaXRDb25maWdUYXNrO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkQ2FtZXJhSW5mb3MoKTtcbiAgICAgICAgICAgIGlmICh1dWlkICE9PSB0aGlzLl9jdXJyZW50VXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIudXBkYXRlR3JpZCgpO1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0Rm9jdXModXVpZCk7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2VsZWN0ZWRHaXptb3MoKTtcbiAgICAgICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW0NhbWVyYV0gcmVzdG9yZSBjYW1lcmEgdmlldyBmYWlsZWQ6JywgZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRDdXJyZW50Vmlld1V1aWQoKTogc3RyaW5nIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclV1aWQgPSAoU2VydmljZS5FZGl0b3IgYXMgdW5rbm93biBhcyB7IGdldEN1cnJlbnRFZGl0b3JVdWlkPzogKCkgPT4gc3RyaW5nIHwgbnVsbCB9KVxuICAgICAgICAgICAgICAgIC5nZXRDdXJyZW50RWRpdG9yVXVpZD8uKCk7XG4gICAgICAgICAgICBpZiAoZWRpdG9yVXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlZGl0b3JVdWlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vIEVkaXRvciBzZXJ2aWNlIG1heSBub3QgYmUgcmVnaXN0ZXJlZCBpbiBlYXJseSBpbml0IG9yIGlzb2xhdGVkIHRlc3RzLlxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNjZW5lID0gKGNjIGFzIGFueSkuZGlyZWN0b3I/LmdldFNjZW5lPy4oKTtcbiAgICAgICAgcmV0dXJuIHNjZW5lPy51dWlkIHx8ICcnO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlZnJlc2hTZWxlY3RlZEdpem1vcygpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIChTZXJ2aWNlLkdpem1vIGFzIHVua25vd24gYXMgeyByZWZyZXNoU2VsZWN0ZWRHaXptb3M/OiAoKSA9PiB2b2lkIH0pXG4gICAgICAgICAgICAgICAgLnJlZnJlc2hTZWxlY3RlZEdpem1vcz8uKCk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gU2VsZWN0aW9uL0dpem1vIG1heSBub3QgYmUgcmVnaXN0ZXJlZCB3aGlsZSBvcGVuaW5nIGlzb2xhdGVkIGVkaXRvciB2aWV3cy5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGluaXRGcm9tQ29uZmlnKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcnBjID0gUnBjLmdldEluc3RhbmNlKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdnZXQnLCBbJ2NhbWVyYScsICdsb2NhbCddKSBhcyBJQ2FtZXJhQ29uZmlnIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGNvbmZpZykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGx5Q29uZmlnKGNvbmZpZywgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZ2l6bW9Db25maWcgPSBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdnZXQnLCBbJ2dpem1vJ10pIGFzIFBhcnRpYWw8SUdpem1vQ29uZmlnPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChnaXptb0NvbmZpZykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGx5R2l6bW9WaWV3TW9kZShnaXptb0NvbmZpZyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwbHlHaXptb0Rpc3BsYXkoZ2l6bW9Db25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vIOmFjee9ruS4jeWPr+eUqOaXtuS9v+eUqOm7mOiupOWAvFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yqg6L2955u45py66KeG6KeS6K6w5b+G77yI5oyJIHNjZW5lIFVVSUQg5a2Y5YKo77yJ44CC5q+P5qyh5omT5byA5Zy65pmv6YO96KaB6YeN5paw5Yqg6L2977yMXG4gICAgICog5Zug5Li6IENhbWVyYVNlcnZpY2Ug5Lya5Zyo5aSa5Liq5Zy65pmv6Ze05aSN55So77yM5Y+q5Zyo6aaW5qyh5Yib5bu655u45py65pe25Yqg6L295Lya5a+86Ie05ZCO57ut5Zy65pmv5Y+W5Yiw5pen5pWw5o2u44CCXG4gICAgICovXG4gICAgYXN5bmMgbG9hZENhbWVyYUluZm9zKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcnBjID0gUnBjLmdldEluc3RhbmNlKCk7XG4gICAgICAgICAgICBjb25zdCBjYW1lcmFJbmZvcyA9IGF3YWl0IHJwYy5yZXF1ZXN0KCdzY2VuZUNvbmZpZ0luc3RhbmNlJywgJ2dldCcsIFsnY2FtZXJhLWluZm9zJywgJ2xvY2FsJ10pO1xuICAgICAgICAgICAgY29uc3QgY2FtZXJhVXVpZHMgPSBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdnZXQnLCBbJ2NhbWVyYS11dWlkcycsICdsb2NhbCddKTtcbiAgICAgICAgICAgIHRoaXMuX2NhbWVyYUluZm9zID0gKGNhbWVyYUluZm9zIGFzIFJlY29yZDxzdHJpbmcsIGFueT4pIHx8IHt9O1xuICAgICAgICAgICAgdGhpcy5fY2FtZXJhVXVpZHMgPSAoY2FtZXJhVXVpZHMgYXMgc3RyaW5nW10pIHx8IFtdO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vIGNhbWVyYS1pbmZvcyDkuI3lrZjlnKjml7bkvb/nlKjpu5jorqTnqbrlgLxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2FwcGx5R2l6bW9EaXNwbGF5KGNvbmZpZzogUGFydGlhbDxJR2l6bW9Db25maWc+KTogdm9pZCB7XG4gICAgICAgIGlmIChjb25maWcuZ3JpZFZpc2libGUgIT09IHVuZGVmaW5lZCkgdGhpcy5zZXRHcmlkVmlzaWJsZShjb25maWcuZ3JpZFZpc2libGUsIGZhbHNlKTtcbiAgICAgICAgaWYgKGNvbmZpZy5ncmlkQ29sb3IgIT09IHVuZGVmaW5lZCkgdGhpcy5zZXRHcmlkQ29sb3IoY29uZmlnLmdyaWRDb2xvciwgZmFsc2UpO1xuICAgICAgICB0aGlzLl9zeW5jQ29udHJvbGxlckdyaWRWaXNpYmlsaXR5KCk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfYXBwbHlHaXptb1ZpZXdNb2RlKGNvbmZpZzogUGFydGlhbDxJR2l6bW9Db25maWc+KTogdm9pZCB7XG4gICAgICAgIGlmIChjb25maWcuaXMyRCAhPT0gdW5kZWZpbmVkICYmIHRoaXMuaXMyRCAhPT0gY29uZmlnLmlzMkQpIHtcbiAgICAgICAgICAgIHRoaXMuaXMyRCA9IGNvbmZpZy5pczJEO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0R3JpZENvbG9yKGNvbG9yOiBudW1iZXJbXSwgcGVyc2lzdCA9IHRydWUpOiB2b2lkIHtcbiAgICAgICAgaWYgKCFjb2xvciB8fCBjb2xvci5sZW5ndGggPCAzKSByZXR1cm47XG4gICAgICAgIC8vIGdyaWRDb2xvciDnmoTphY3nva7lvZIgR2l6bW8g55qEIEdpem1vQ29uZmlnIOaJgOacieW5tueUseWFtue7n+S4gOaMgeS5heWMlu+8iOS4jiBjb2Nvcy1lZGl0b3IgR2l6bW9NYW5hZ2VyIOS4gOiHtO+8ieOAglxuICAgICAgICAvLyDpnaLmnb/nu4/nlLHmnKzmlrnms5XmlLnoibLml7bovazkuqQgR2l6bW/vvJrmm7TmlrDov5DooYzml7bphY3nva7lubblrprlkJHokL3nm5jvvIhnaXptby5ncmlkQ29sb3LvvInvvIzpgb/lhY3lj6rmlLnmuLLmn5PogIzkuI3okL3nm5jvvIjph43lvIDkuKLlpLHvvInjgIJcbiAgICAgICAgLy8gR2l6bW8uc2V0R3JpZENvbG9yIOWGhemDqOS8muWbnuiwg+acrOaWueazle+8iHBlcnNpc3Q9ZmFsc2XvvInlrozmiJAgMkQvM0Qg5o6n5Yi25Zmo5riy5p+T44CCXG4gICAgICAgIGlmIChwZXJzaXN0KSB7XG4gICAgICAgICAgICBjb25zdCBnaXptbyA9IHF1ZXJ5UmVnaXN0ZXJlZFNlcnZpY2U8SUdpem1vU2VydmljZT4oJ0dpem1vJyk7XG4gICAgICAgICAgICBpZiAoZ2l6bW8pIHtcbiAgICAgICAgICAgICAgICBnaXptby5zZXRHcmlkQ29sb3IoY29sb3IpOyAvLyDlhbblhoXpg6jkvJrlm57osIMgc2V0R3JpZENvbG9yKGNvbG9yLCBmYWxzZSkg5a6M5oiQ5riy5p+TXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IFtyID0gMTY2LCBnID0gMTY2LCBiID0gMTY2LCBhID0gMjU1XSA9IGNvbG9yO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyM0QubGluZUNvbG9yID0gbmV3IENvbG9yKHIsIGcsIGIsIGEpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyM0QudXBkYXRlR3JpZCgpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyMkQubGluZUNvbG9yID0gbmV3IENvbG9yKHIsIGcsIGIsIGEpO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyMkQudXBkYXRlR3JpZCgpO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgIH1cblxuICAgIHNldE9yaWdpbkF4ZXMyRChvcmlnaW5BeGVzOiBJT3JpZ2luQXhlc0NvbmZpZyk6IHZvaWQge1xuICAgICAgICAodGhpcy5fY29udHJvbGxlcjJEIGFzIGFueSkudXBkYXRlT3JpZ2luQXhpc0J5Q29uZmlnPy4oe1xuICAgICAgICAgICAgeDogb3JpZ2luQXhlcy54LFxuICAgICAgICAgICAgeTogb3JpZ2luQXhlcy55LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fc3luY0NvbnRyb2xsZXJHcmlkVmlzaWJpbGl0eSgpO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgIH1cblxuICAgIHNldE9yaWdpbkF4ZXMzRChvcmlnaW5BeGVzOiBJT3JpZ2luQXhlc0NvbmZpZyk6IHZvaWQge1xuICAgICAgICAodGhpcy5fY29udHJvbGxlcjNEIGFzIGFueSkudXBkYXRlT3JpZ2luQXhpc0J5Q29uZmlnPy4ob3JpZ2luQXhlcyk7XG4gICAgICAgIHRoaXMuX3N5bmNDb250cm9sbGVyR3JpZFZpc2liaWxpdHkoKTtcbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9hcHBseUNvbmZpZyhjb25maWc6IFBhcnRpYWw8SUNhbWVyYUNvbmZpZz4sIHBlcnNpc3Q6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKGNvbmZpZy5jb2xvciAhPT0gdW5kZWZpbmVkKSB0aGlzLnNldENhbWVyYVByb3BlcnR5KHsgY2xlYXJDb2xvcjogY29uZmlnLmNvbG9yIH0sIGZhbHNlKTtcbiAgICAgICAgaWYgKGNvbmZpZy5mb3YgIT09IHVuZGVmaW5lZCkgdGhpcy5zZXRDYW1lcmFQcm9wZXJ0eSh7IGZvdjogY29uZmlnLmZvdiB9LCBmYWxzZSk7XG4gICAgICAgIGlmIChjb25maWcuZmFyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIzRC5mYXIgPSBjb25maWcuZmFyO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NhbWVyYSAmJiAhdGhpcy5pczJEKSB0aGlzLl9jYW1lcmEuZmFyID0gY29uZmlnLmZhcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uZmlnLm5lYXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fY29udHJvbGxlcjNELm5lYXIgPSBjb25maWcubmVhcjtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jYW1lcmEgJiYgIXRoaXMuaXMyRCkgdGhpcy5fY2FtZXJhLm5lYXIgPSBjb25maWcubmVhcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uZmlnLndoZWVsU3BlZWQgIT09IHVuZGVmaW5lZCkgdGhpcy5fY29udHJvbGxlcjNELndoZWVsU3BlZWQgPSBjb25maWcud2hlZWxTcGVlZDtcbiAgICAgICAgaWYgKGNvbmZpZy53YW5kZXJTcGVlZCAhPT0gdW5kZWZpbmVkKSB0aGlzLl9jb250cm9sbGVyM0Qud2FuZGVyU3BlZWQgPSBjb25maWcud2FuZGVyU3BlZWQ7XG4gICAgICAgIGlmIChjb25maWcuZW5hYmxlQWNjZWxlcmF0aW9uICE9PSB1bmRlZmluZWQpIHRoaXMuX2NvbnRyb2xsZXIzRC5lbmFibGVBY2NlbGVyYXRpb24gPSBjb25maWcuZW5hYmxlQWNjZWxlcmF0aW9uO1xuICAgICAgICBpZiAoY29uZmlnLmZhcjJEICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIyRC5mYXIgPSBjb25maWcuZmFyMkQ7XG4gICAgICAgICAgICBpZiAodGhpcy5fY2FtZXJhICYmIHRoaXMuaXMyRCkgdGhpcy5fY2FtZXJhLmZhciA9IGNvbmZpZy5mYXIyRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uZmlnLm5lYXIyRCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250cm9sbGVyMkQubmVhciA9IGNvbmZpZy5uZWFyMkQ7XG4gICAgICAgICAgICBpZiAodGhpcy5fY2FtZXJhICYmIHRoaXMuaXMyRCkgdGhpcy5fY2FtZXJhLm5lYXIgPSBjb25maWcubmVhcjJEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb25maWcud2hlZWxTcGVlZDJEICE9PSB1bmRlZmluZWQpIHRoaXMuX2NvbnRyb2xsZXIyRC53aGVlbFNwZWVkID0gY29uZmlnLndoZWVsU3BlZWQyRDtcbiAgICAgICAgaWYgKGNvbmZpZy5hcGVydHVyZSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5zaHV0dGVyICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmlzbyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldENhbWVyYVByb3BlcnR5KHtcbiAgICAgICAgICAgICAgICBhcGVydHVyZTogY29uZmlnLmFwZXJ0dXJlLFxuICAgICAgICAgICAgICAgIHNodXR0ZXI6IGNvbmZpZy5zaHV0dGVyLFxuICAgICAgICAgICAgICAgIGlzbzogY29uZmlnLmlzbyxcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgICAgICBpZiAocGVyc2lzdCkge1xuICAgICAgICAgICAgdm9pZCB0aGlzLl9zYXZlQ29uZmlnKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9zYXZlQ29uZmlnKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcnBjID0gUnBjLmdldEluc3RhbmNlKCk7XG4gICAgICAgICAgICBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdzZXQnLCBbJ2NhbWVyYScsIHRoaXMucXVlcnlDb25maWcoKSwgJ2xvY2FsJ10pO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vIENvbmZpZyBwZXJzaXN0ZW5jZSBub3QgYXZhaWxhYmxlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGJpbmRPcGVyYXRpb24oKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJzOiBSZWNvcmQ8c3RyaW5nLCAoZXZlbnQ6IGFueSkgPT4gYW55PiA9IHtcbiAgICAgICAgICAgIGRibGNsaWNrOiAoZXZlbnQ6IGFueSkgPT4gdGhpcy5vbk1vdXNlREJsRG93bihldmVudCksXG4gICAgICAgICAgICBtb3VzZWRvd246IChldmVudDogYW55KSA9PiB0aGlzLm9uTW91c2VEb3duKGV2ZW50KSxcbiAgICAgICAgICAgIG1vdXNlbW92ZTogKGV2ZW50OiBhbnkpID0+IHRoaXMub25Nb3VzZU1vdmUoZXZlbnQpLFxuICAgICAgICAgICAgbW91c2V1cDogKGV2ZW50OiBhbnkpID0+IHRoaXMub25Nb3VzZVVwKGV2ZW50KSxcbiAgICAgICAgICAgIG1vdXNld2hlZWw6IChldmVudDogYW55KSA9PiB0aGlzLm9uTW91c2VXaGVlbChldmVudCksXG4gICAgICAgICAgICBrZXlkb3duOiAoZXZlbnQ6IGFueSkgPT4gdGhpcy5vbktleURvd24oZXZlbnQpLFxuICAgICAgICAgICAga2V5dXA6IChldmVudDogYW55KSA9PiB0aGlzLm9uS2V5VXAoZXZlbnQpLFxuICAgICAgICAgICAgcmVzaXplOiAoc2l6ZTogYW55KSA9PiB0aGlzLm9uUmVzaXplKHNpemUpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAoY29uc3QgW2V2ZW50VHlwZSwgaGFuZGxlcl0gb2YgT2JqZWN0LmVudHJpZXMoaGFuZGxlcnMpKSB7XG4gICAgICAgICAgICBTZXJ2aWNlLk9wZXJhdGlvbi5hZGRMaXN0ZW5lcihldmVudFR5cGUgYXMgYW55LCBoYW5kbGVyLCBPcGVyYXRpb25Qcmlvcml0eS5DYW1lcmEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tIOS7o+eQhuaWueazlSAtLS1cbiAgICBmb2N1cyhub2Rlcz86IHN0cmluZ1tdIHwgbnVsbCwgZWRpdG9yQ2FtZXJhSW5mbz86IGFueSwgaW1tZWRpYXRlID0gZmFsc2UpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlcj8uZm9jdXMobm9kZXMgYXMgYW55LCBlZGl0b3JDYW1lcmFJbmZvLCBpbW1lZGlhdGUpO1xuICAgIH1cblxuICAgIGRlZmF1bHRGb2N1cyh1dWlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY2FtZXJhSW5mbyA9IHRoaXMuX2NhbWVyYUluZm9zW3V1aWRdO1xuICAgICAgICBpZiAodGhpcy5fY2FtZXJhPy5jYW1lcmEpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbWVyYS5jYW1lcmEudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhbWVyYUluZm8pIHtcbiAgICAgICAgICAgIHRoaXMuZm9jdXMobnVsbCwgY2FtZXJhSW5mbywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCByb290Tm9kZSA9IFNlcnZpY2UuRWRpdG9yPy5nZXRSb290Tm9kZT8uKCkgYXMgYW55O1xuICAgICAgICAgICAgbGV0IHV1aWRzOiBzdHJpbmdbXSB8IG51bGwgPSByb290Tm9kZT8udXVpZCA/IFtyb290Tm9kZS51dWlkXSA6IG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5pczJEICYmIHJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FudmFzID0gcm9vdE5vZGUuZ2V0Q29tcG9uZW50SW5DaGlsZHJlbj8uKENhbnZhcyk7XG4gICAgICAgICAgICAgICAgaWYgKGNhbnZhcyAmJiBjYW52YXMubm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB1dWlkcyA9IFtjYW52YXMubm9kZS51dWlkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZvY3VzKHV1aWRzLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcm90YXRlQ2FtZXJhVG9EaXIoZGlyOiBWZWMzLCByb3RhdGVCeVZpZXdEaXN0OiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXI/LnJvdGF0ZUNhbWVyYVRvRGlyKGRpciwgcm90YXRlQnlWaWV3RGlzdCk7XG4gICAgfVxuXG4gICAgY2hhbmdlUHJvamVjdGlvbigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlcj8uY2hhbmdlUHJvamVjdGlvbigpO1xuICAgIH1cblxuICAgIHNldEdyaWRWaXNpYmxlKHZhbHVlOiBib29sZWFuLCBwZXJzaXN0ID0gdHJ1ZSk6IHZvaWQge1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyMkQuaXNHcmlkVmlzaWJsZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyM0QuaXNHcmlkVmlzaWJsZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9zeW5jQ29udHJvbGxlckdyaWRWaXNpYmlsaXR5KCk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgICAgIGlmIChwZXJzaXN0KSB7XG4gICAgICAgICAgICBjb25zdCBycGMgPSBScGMuZ2V0SW5zdGFuY2UoKTtcbiAgICAgICAgICAgIHZvaWQgcnBjLnJlcXVlc3QoJ3NjZW5lQ29uZmlnSW5zdGFuY2UnLCAnc2V0JywgWydnaXptby5ncmlkVmlzaWJsZScsIHZhbHVlLCAnbG9jYWwnXSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNHcmlkVmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRyb2xsZXI/LmlzR3JpZFZpc2libGUgPz8gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zeW5jQ29udHJvbGxlckdyaWRWaXNpYmlsaXR5KCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuX2NvbnRyb2xsZXIgfHwgIXRoaXMuX2NvbnRyb2xsZXIyRCB8fCAhdGhpcy5fY29udHJvbGxlcjNEKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGFjdGl2ZUN0cmwgPSB0aGlzLl9jb250cm9sbGVyO1xuICAgICAgICBjb25zdCBpbmFjdGl2ZUN0cmwgPSBhY3RpdmVDdHJsID09PSB0aGlzLl9jb250cm9sbGVyM0RcbiAgICAgICAgICAgID8gdGhpcy5fY29udHJvbGxlcjJEXG4gICAgICAgICAgICA6IHRoaXMuX2NvbnRyb2xsZXIzRDtcbiAgICAgICAgYWN0aXZlQ3RybC5zaG93R3JpZChhY3RpdmVDdHJsLmlzR3JpZFZpc2libGUpO1xuICAgICAgICBpbmFjdGl2ZUN0cmwuc2hvd0dyaWQoZmFsc2UpO1xuICAgIH1cblxuICAgIHNldENhbWVyYVByb3BlcnR5KG9wdGlvbnM6IGFueSwgcGVyc2lzdCA9IHRydWUpOiB2b2lkIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JyB8fCAhdGhpcy5fY2FtZXJhKSByZXR1cm47XG4gICAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNba2V5XSA9PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnY2xlYXJDb2xvcicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYW1lcmFba2V5XSA9IGNjLmNvbG9yKFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zW2tleV1bMF0sIG9wdGlvbnNba2V5XVsxXSxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uc1trZXldWzJdLCBvcHRpb25zW2tleV1bM10sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnbmVhcicgfHwga2V5ID09PSAnZmFyJykge1xuICAgICAgICAgICAgICAgICh0aGlzLl9jb250cm9sbGVyIGFzIGFueSlba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgICAgICAodGhpcy5fY2FtZXJhIGFzIGFueSlba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnZm92Jykge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnY2FtZXJhOmZvdi1jaGFuZ2VkJywgb3B0aW9uc1trZXldKTtcbiAgICAgICAgICAgICAgICAodGhpcy5fY2FtZXJhIGFzIGFueSlba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKHRoaXMuX2NhbWVyYSBhcyBhbnkpW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgICAgICBpZiAocGVyc2lzdCkge1xuICAgICAgICAgICAgdm9pZCB0aGlzLl9zYXZlQ29uZmlnKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldENhbWVyYVByb3BlcnR5KCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9jb250cm9sbGVyM0Qud2FuZGVyU3BlZWQgPSAxMDtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlcjNELmVuYWJsZUFjY2VsZXJhdGlvbiA9IHRydWU7XG4gICAgICAgIHRoaXMuc2V0Q2FtZXJhUHJvcGVydHkoeyBhcGVydHVyZTogMTksIHNodXR0ZXI6IDcsIGlzbzogMCB9LCBmYWxzZSk7XG4gICAgICAgIGlmICh0aGlzLmlzMkQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIyRC53aGVlbFNwZWVkID0gNjtcbiAgICAgICAgICAgIHRoaXMuc2V0Q2FtZXJhUHJvcGVydHkoeyBmb3Y6IDQ1LCBmYXI6IDEwMDAwLCBuZWFyOiA2LCBjbGVhckNvbG9yOiBbNDgsIDQ4LCA0OCwgMjU1XSB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRyb2xsZXIzRC53aGVlbFNwZWVkID0gMC4wMTtcbiAgICAgICAgICAgIHRoaXMuc2V0Q2FtZXJhUHJvcGVydHkoeyBmb3Y6IDQ1LCBmYXI6IDEwMDAwLCBuZWFyOiAwLjAxLCBjbGVhckNvbG9yOiBbNDgsIDQ4LCA0OCwgMjU1XSB9KTtcbiAgICAgICAgfVxuICAgICAgICBTZXJ2aWNlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIHF1ZXJ5Q29uZmlnKCk6IElDYW1lcmFDb25maWcge1xuICAgICAgICBjb25zdCBjbGVhckNvbG9yID0gdGhpcy5fY2FtZXJhPy5jbGVhckNvbG9yO1xuICAgICAgICBjb25zdCBjYW1lcmE6IGFueSA9IHRoaXMuX2NhbWVyYTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbG9yOiBjbGVhckNvbG9yXG4gICAgICAgICAgICAgICAgPyBbTWF0aC5yb3VuZChjbGVhckNvbG9yLnIpLCBNYXRoLnJvdW5kKGNsZWFyQ29sb3IuZyksIE1hdGgucm91bmQoY2xlYXJDb2xvci5iKSwgTWF0aC5yb3VuZChjbGVhckNvbG9yLmEpXVxuICAgICAgICAgICAgICAgIDogWzQ4LCA0OCwgNDgsIDI1NV0sXG4gICAgICAgICAgICBmb3Y6IHRoaXMuX2NhbWVyYT8uZm92ID8/IDQ1LFxuICAgICAgICAgICAgLy8gM0Qg55qEIG5lYXIvZmFyIOWPluiHqiAzRCDmjqfliLblmajvvIzpgb/lhY3lj5flvZPliY3mv4DmtLvnm7jmnLrvvIjlj6/og73mmK8gMkTvvInlvbHlk41cbiAgICAgICAgICAgIGZhcjogdGhpcy5fY29udHJvbGxlcjNELmZhcixcbiAgICAgICAgICAgIG5lYXI6IHRoaXMuX2NvbnRyb2xsZXIzRC5uZWFyLFxuICAgICAgICAgICAgd2hlZWxTcGVlZDogdGhpcy5fY29udHJvbGxlcjNELndoZWVsU3BlZWQsXG4gICAgICAgICAgICB3YW5kZXJTcGVlZDogdGhpcy5fY29udHJvbGxlcjNELndhbmRlclNwZWVkLFxuICAgICAgICAgICAgZW5hYmxlQWNjZWxlcmF0aW9uOiB0aGlzLl9jb250cm9sbGVyM0QuZW5hYmxlQWNjZWxlcmF0aW9uLFxuICAgICAgICAgICAgZmFyMkQ6IHRoaXMuX2NvbnRyb2xsZXIyRC5mYXIsXG4gICAgICAgICAgICBuZWFyMkQ6IHRoaXMuX2NvbnRyb2xsZXIyRC5uZWFyLFxuICAgICAgICAgICAgd2hlZWxTcGVlZDJEOiB0aGlzLl9jb250cm9sbGVyMkQud2hlZWxTcGVlZCxcbiAgICAgICAgICAgIGFwZXJ0dXJlOiB0eXBlb2YgY2FtZXJhPy5hcGVydHVyZSA9PT0gJ251bWJlcicgPyBjYW1lcmEuYXBlcnR1cmUgOiAxOSxcbiAgICAgICAgICAgIHNodXR0ZXI6IHR5cGVvZiBjYW1lcmE/LnNodXR0ZXIgPT09ICdudW1iZXInID8gY2FtZXJhLnNodXR0ZXIgOiA3LFxuICAgICAgICAgICAgaXNvOiB0eXBlb2YgY2FtZXJhPy5pc28gPT09ICdudW1iZXInID8gY2FtZXJhLmlzbyA6IDAsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdXBkYXRlQ29uZmlnKGNvbmZpZzogUGFydGlhbDxJQ2FtZXJhQ29uZmlnPik6IHZvaWQge1xuICAgICAgICBpZiAoIWNvbmZpZyB8fCB0eXBlb2YgY29uZmlnICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuICAgICAgICB0aGlzLl9hcHBseUNvbmZpZyhjb25maWcsIHRydWUpO1xuICAgIH1cblxuICAgIGdldENhbWVyYUZvdigpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FtZXJhPy5mb3YgPz8gNDU7XG4gICAgfVxuXG4gICAgem9vbVVwKCk6IHZvaWQgeyB0aGlzLl9jb250cm9sbGVyPy56b29tVXAoKTsgfVxuICAgIHpvb21Eb3duKCk6IHZvaWQgeyB0aGlzLl9jb250cm9sbGVyPy56b29tRG93bigpOyB9XG4gICAgem9vbVJlc2V0KCk6IHZvaWQgeyB0aGlzLl9jb250cm9sbGVyPy56b29tUmVzZXQoKTsgfVxuXG4gICAgYWxpZ25Ob2RlVG9TY2VuZVZpZXcobm9kZXM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXI/LmFsaWduTm9kZVRvU2NlbmVWaWV3KG5vZGVzKTtcbiAgICB9XG5cbiAgICBhbGlnblNjZW5lVmlld1RvTm9kZShub2Rlczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fY29udHJvbGxlcj8uYWxpZ25TY2VuZVZpZXdUb05vZGUobm9kZXMpO1xuICAgIH1cblxuICAgIG9uVXBkYXRlKGRlbHRhVGltZTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXI/Lm9uVXBkYXRlKGRlbHRhVGltZSk7XG4gICAgfVxuXG4gICAgLy8gLS0tIOi+k+WFpeS6i+S7tuS7o+eQhiAtLS1cbiAgICBwcml2YXRlIG9uTW91c2VEQmxEb3duKGV2ZW50OiBhbnkpIHsgcmV0dXJuIHRoaXMuX2NvbnRyb2xsZXI/Lm9uTW91c2VEQmxEb3duKGV2ZW50KTsgfVxuICAgIHByaXZhdGUgb25Nb3VzZURvd24oZXZlbnQ6IGFueSkgeyByZXR1cm4gdGhpcy5fY29udHJvbGxlcj8ub25Nb3VzZURvd24oZXZlbnQpOyB9XG4gICAgcHJpdmF0ZSBvbk1vdXNlTW92ZShldmVudDogYW55KSB7IHJldHVybiB0aGlzLl9jb250cm9sbGVyPy5vbk1vdXNlTW92ZShldmVudCk7IH1cbiAgICBwcml2YXRlIG9uTW91c2VVcChldmVudDogYW55KSB7IHJldHVybiB0aGlzLl9jb250cm9sbGVyPy5vbk1vdXNlVXAoZXZlbnQpOyB9XG4gICAgcHJpdmF0ZSBvbk1vdXNlV2hlZWwoZXZlbnQ6IGFueSkgeyByZXR1cm4gdGhpcy5fY29udHJvbGxlcj8ub25Nb3VzZVdoZWVsKGV2ZW50KTsgfVxuICAgIHByaXZhdGUgb25LZXlEb3duKGV2ZW50OiBhbnkpIHsgcmV0dXJuIHRoaXMuX2NvbnRyb2xsZXI/Lm9uS2V5RG93bihldmVudCk7IH1cbiAgICBwcml2YXRlIG9uS2V5VXAoZXZlbnQ6IGFueSkgeyByZXR1cm4gdGhpcy5fY29udHJvbGxlcj8ub25LZXlVcChldmVudCk7IH1cblxuICAgIC8vIC0tLSDlhbbku5bmlrnms5UgLS0tXG4gICAgb25SZXNpemUoc2l6ZTogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXI/Lm9uUmVzaXplKHNpemUpO1xuICAgIH1cblxuICAgIHJlZnJlc2goKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2NvbnRyb2xsZXI/LnJlZnJlc2goKTtcbiAgICB9XG5cbiAgICBnZXRDYW1lcmEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYW1lcmE7XG4gICAgfVxuXG4gICAgZ2V0Q3VyQ2FtZXJhSW5mbygpOiBhbnkge1xuICAgICAgICBjb25zdCBjdXJDYW1lcmFOb2RlID0gdGhpcy5fY29udHJvbGxlcjNELm5vZGU7XG4gICAgICAgIGNvbnN0IGN1ckNhbWVyYVBvcyA9IGN1ckNhbWVyYU5vZGUuZ2V0V29ybGRQb3NpdGlvbigpO1xuICAgICAgICBjb25zdCBjdXJDYW1lcmFSb3QgPSBjdXJDYW1lcmFOb2RlLmdldFdvcmxkUm90YXRpb24oKTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB7IHg6IGN1ckNhbWVyYVBvcy54LCB5OiBjdXJDYW1lcmFQb3MueSwgejogY3VyQ2FtZXJhUG9zLnogfTtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSB7IHg6IGN1ckNhbWVyYVJvdC54LCB5OiBjdXJDYW1lcmFSb3QueSwgejogY3VyQ2FtZXJhUm90LnosIHc6IGN1ckNhbWVyYVJvdC53IH07XG4gICAgICAgIGNvbnN0IHNjZW5lVmlld0NlbnRlciA9IHRoaXMuX2NvbnRyb2xsZXIzRC5zY2VuZVZpZXdDZW50ZXI7XG4gICAgICAgIGNvbnN0IHZpZXdDZW50ZXIgPSB7IHg6IHNjZW5lVmlld0NlbnRlci54LCB5OiBzY2VuZVZpZXdDZW50ZXIueSwgejogc2NlbmVWaWV3Q2VudGVyLnogfTtcbiAgICAgICAgLy8gMkQg6KeG5Zu+54q25oCB77yI5a+56b2QIENyZWF0b3LvvJrkuIDlubborrDlvZUgY29udGVudFJlY3QgKyBzY2FsZTJE77yM5L2/IDJEIOWcuuaZr+inhuinkuWPr+WujOaVtOaBouWkje+8iVxuICAgICAgICBjb25zdCByZWN0MkQgPSB0aGlzLl9jb250cm9sbGVyMkQuY29udGVudFJlY3Q7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRSZWN0ID0geyB4OiByZWN0MkQueCwgeTogcmVjdDJELnksIHdpZHRoOiByZWN0MkQud2lkdGgsIGhlaWdodDogcmVjdDJELmhlaWdodCB9O1xuICAgICAgICBjb25zdCBzY2FsZSA9IHRoaXMuX2NvbnRyb2xsZXIyRC5zY2FsZTJEO1xuICAgICAgICByZXR1cm4geyBwb3NpdGlvbiwgcm90YXRpb24sIHZpZXdDZW50ZXIsIGNvbnRlbnRSZWN0LCBzY2FsZSB9O1xuICAgIH1cblxuICAgIGFzeW5jIHNhdmVDYW1lcmFJbmZvcyh1dWlkPzogc3RyaW5nLCB3cml0ZSA9IHRydWUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdXVpZCA9IHV1aWQgPz8gdGhpcy5fY3VycmVudFV1aWQ7XG4gICAgICAgIGlmICghdXVpZCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBjYW1lcmFJbmZvID0gdGhpcy5nZXRDdXJDYW1lcmFJbmZvKCk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fY2FtZXJhVXVpZHMuaW5kZXhPZih1dWlkKTtcblxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fY2FtZXJhSW5mb3NbdXVpZF07XG4gICAgICAgICAgICB0aGlzLl9jYW1lcmFVdWlkcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5fY2FtZXJhVXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbWVyYVV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fY2FtZXJhVXVpZHMubGVuZ3RoID4gNTApIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fY2FtZXJhSW5mb3NbdGhpcy5fY2FtZXJhVXVpZHNbMF1dO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhbWVyYVV1aWRzLnNwbGljZSgwLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jYW1lcmFJbmZvc1t1dWlkXSA9IGNhbWVyYUluZm87XG4gICAgICAgIGlmICh3cml0ZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBycGMgPSBScGMuZ2V0SW5zdGFuY2UoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdzZXQnLCBbJ2NhbWVyYS1pbmZvcycsIHRoaXMuX2NhbWVyYUluZm9zLCAnbG9jYWwnXSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcnBjLnJlcXVlc3QoJ3NjZW5lQ29uZmlnSW5zdGFuY2UnLCAnc2V0JywgWydjYW1lcmEtdXVpZHMnLCB0aGlzLl9jYW1lcmFVdWlkcywgJ2xvY2FsJ10pO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgLy8gcGVyc2lzdGVuY2Ugbm90IGF2YWlsYWJsZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25FZGl0b3JDbG9zZWQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc2F2ZUNhbWVyYUluZm9zKHVuZGVmaW5lZCwgZmFsc2UpO1xuICAgIH1cblxuICAgIG9uRWRpdG9yU2F2ZWQoKTogdm9pZCB7XG4gICAgICAgIHZvaWQgdGhpcy5zYXZlQ2FtZXJhSW5mb3MoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkuI7ljp/lp4vnvJbovpHlmaggU2NlbmVQcmV2aWV3LmRldGFjaFNjZW5lQ2FtZXJhcyDkuIDoh7TvvJpcbiAgICAgKiDlsIbmiYDmnInpnZ7nvJbovpHlmajnmoTlnLrmma/nm7jmnLrku47muLLmn5PnrqHnur/kuK3np7vpmaTvvIzlubborr7nva4gdGVtcFdpbmRvd1xuICAgICAqIOS9v+WQjue7reaWsOW7uueahOebuOacuum7mOiupOa4suafk+WIsOemu+Wxj+eql+WPo++8jOS4jeW5suaJsOe8lui+keWZqOebuOacuuOAglxuICAgICAqL1xuICAgIHByaXZhdGUgX2RldGFjaFNjZW5lQ2FtZXJhcygpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJvb3QgPSAoY2MgYXMgYW55KS5kaXJlY3Rvcj8ucm9vdDtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gKGNjIGFzIGFueSkuZGlyZWN0b3I/LmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXJvb3QgfHwgIXNjZW5lKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IGVkaXRvck1hc2sgPSBMYXllcnMubWFrZU1hc2tJbmNsdWRlKFtcbiAgICAgICAgICAgICAgICBMYXllcnMuRW51bS5HSVpNT1MsXG4gICAgICAgICAgICAgICAgTGF5ZXJzLkVudW0uU0NFTkVfR0laTU8sXG4gICAgICAgICAgICAgICAgTGF5ZXJzLkVudW0uRURJVE9SLFxuICAgICAgICAgICAgXSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclNjZW5lID0gc2NlbmUucmVuZGVyU2NlbmUgfHwgc2NlbmUuX3JlbmRlclNjZW5lO1xuICAgICAgICAgICAgaWYgKHJlbmRlclNjZW5lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FtZXJhcyA9IFsuLi5yZW5kZXJTY2VuZS5jYW1lcmFzXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNhbSBvZiBjYW1lcmFzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY2FtIHx8ICFjYW0ubm9kZSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYW0ubm9kZS5sYXllciAmIGVkaXRvck1hc2spIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gY2FtLm5vZGUuZ2V0Q29tcG9uZW50Py4oJ2NjLkNhbWVyYScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FtLmRldGFjaENhbWVyYSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDorr7nva4gdGVtcFdpbmRvd++8jOS4juWOn+Wni+e8lui+keWZqOS4gOiHtO+8mlxuICAgICAgICAgICAgLy8g5ZCO57ut5paw5bu655qE55u45py6IChfaW5FZGl0b3JNb2RlPWZhbHNlKSDkvJrpu5jorqTmuLLmn5PliLAgdGVtcFdpbmRvdyDogIzpnZ4gbWFpbldpbmRvd1xuICAgICAgICAgICAgaWYgKHJvb3QuY3JlYXRlV2luZG93ICYmIHJvb3QubWFpbldpbmRvdyAmJiAhcm9vdC50ZW1wV2luZG93KSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFpblN3YXBjaGFpbiA9IHJvb3QubWFpbldpbmRvdy5zd2FwY2hhaW47XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYWluU3dhcGNoYWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZW5kZXJQYXNzSW5mbyA9IG5ldyBnZnguUmVuZGVyUGFzc0luZm8oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW25ldyBnZnguQ29sb3JBdHRhY2htZW50KHJvb3QubWFpbldpbmRvdy5zd2FwY2hhaW4uY29sb3JUZXh0dXJlLmZvcm1hdCldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBnZnguRGVwdGhTdGVuY2lsQXR0YWNobWVudChyb290Lm1haW5XaW5kb3cuc3dhcGNoYWluLmRlcHRoU3RlbmNpbFRleHR1cmUuZm9ybWF0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXNzSW5mby5jb2xvckF0dGFjaG1lbnRzWzBdLmJhcnJpZXIgPSByb290LmRldmljZS5nZXRHZW5lcmFsQmFycmllcihuZXcgZ2Z4LkdlbmVyYWxCYXJyaWVySW5mbygwLCBnZnguQWNjZXNzRmxhZ0JpdC5GUkFHTUVOVF9TSEFERVJfUkVBRF9URVhUVVJFKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3aW4gPSByb290LmNyZWF0ZVdpbmRvdyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdDTEkgVGVtcCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclBhc3NJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3YXBjaGFpbjogbWFpblN3YXBjaGFpbixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbikgcm9vdC50ZW1wV2luZG93ID0gd2luO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbQ2FtZXJhXSBfZGV0YWNoU2NlbmVDYW1lcmFzIGZhaWxlZDonLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaWsOWinueahCBDYW1lcmEg57uE5Lu25Lmf6ZyA6KaBIGRldGFjaO+8jOS4juWOn+Wni+e8lui+keWZqCBTY2VuZVByZXZpZXcub25Db21wb25lbnRBZGRlZCDkuIDoh7RcbiAgICAgKi9cbiAgICBkZXRhY2hOZXdTY2VuZUNhbWVyYShjb21wOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKCFjb21wIHx8ICEoY29tcCBpbnN0YW5jZW9mIENhbWVyYSkpIHJldHVybjtcbiAgICAgICAgY29uc3QgZWRpdG9yTWFzayA9IExheWVycy5tYWtlTWFza0luY2x1ZGUoW1xuICAgICAgICAgICAgTGF5ZXJzLkVudW0uR0laTU9TLFxuICAgICAgICAgICAgTGF5ZXJzLkVudW0uU0NFTkVfR0laTU8sXG4gICAgICAgICAgICBMYXllcnMuRW51bS5FRElUT1IsXG4gICAgICAgIF0pO1xuICAgICAgICBpZiAoY29tcC5ub2RlPy5sYXllciAmIGVkaXRvck1hc2spIHJldHVybjtcbiAgICAgICAgaWYgKGNvbXAgPT09IHRoaXMuX2NhbWVyYSkgcmV0dXJuO1xuICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChjb21wLmNhbWVyYSkge1xuICAgICAgICAgICAgICAgIGNvbXAuY2FtZXJhLmRldGFjaENhbWVyYSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkNvbXBvbmVudEFkZGVkKGNvbXA6IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLmRldGFjaE5ld1NjZW5lQ2FtZXJhKGNvbXApO1xuICAgIH1cbn1cbiJdfQ==