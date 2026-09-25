'use strict';
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
exports.GizmoService = void 0;
const cc_1 = require("cc");
const core_1 = require("./core");
const decorator_1 = require("./core/decorator");
const global_events_1 = require("./core/global-events");
const transform_tool_1 = require("./gizmo/transform-tool");
const gizmo_defines_1 = __importDefault(require("./gizmo/gizmo-defines"));
const gizmo_operation_1 = __importDefault(require("./gizmo/gizmo-operation"));
const editor_node_1 = require("./gizmo/utils/editor-node");
const engine_utils_1 = require("./gizmo/utils/engine-utils");
const rect_transform_snapping_1 = require("./gizmo/utils/rect-transform-snapping");
const world_axis_1 = __importDefault(require("./gizmo/controller/world-axis"));
const common_1 = require("../../common");
const rpc_1 = require("../rpc");
// Import component gizmo modules so they self-register via registerGizmo()
require("./gizmo/components/camera");
require("./gizmo/components/box-collider");
require("./gizmo/components/directional-light");
require("./gizmo/components/canvas");
require("./gizmo/components/ui-transform");
require("./gizmo/components/sphere-light");
require("./gizmo/components/spot-light");
require("./gizmo/components/sphere-collider");
require("./gizmo/components/capsule-collider");
require("./gizmo/components/cone-collider");
require("./gizmo/components/cylinder-collider");
require("./gizmo/components/plane-collider");
require("./gizmo/components/simplex-collider");
require("./gizmo/components/mesh-collider");
require("./gizmo/components/box-collider-2d");
require("./gizmo/components/circle-collider-2d");
require("./gizmo/components/polygon-collider-2d");
require("./gizmo/components/distance-joint-2d");
require("./gizmo/components/spring-joint-2d");
require("./gizmo/components/hinge-joint-2d");
require("./gizmo/components/fixed-joint-2d");
require("./gizmo/components/relative-joint-2d");
require("./gizmo/components/slider-joint-2d");
require("./gizmo/components/wheel-joint-2d");
require("./gizmo/components/mesh-renderer");
require("./gizmo/components/skinned-mesh-renderer");
require("./gizmo/components/video-player");
require("./gizmo/components/web-view");
require("./gizmo/components/light-probe-group");
require("./gizmo/components/reflection-probe");
require("./gizmo/components/lod-group");
require("./gizmo/components/particle-system");
// Avoid browser-runtime require('cc') while keeping lightweight cc mocks from loading Terrain dependencies.
if (cc_1.Terrain) {
    require('./gizmo/components/terrain');
}
// 与 cocos-editor GizmoConfig 一致：Gizmo 全局显示配置
class GizmoConfig {
    static toolsVisibility3d = true;
    static isIconGizmo3D = false;
    static iconGizmoSize = 2;
    static gridColor = [166, 166, 166, 255];
    static originAxis2D = { x: true, y: true, z: false };
    static originAxis3D = { x: true, y: false, z: true };
}
// WeakMaps to associate components with their gizmo instances
const _componentGizmoMap = new WeakMap();
const _iconGizmoMap = new WeakMap();
const _persistentGizmoMap = new WeakMap();
function getGizmoMap(type) {
    switch (type) {
        case 'component': return _componentGizmoMap;
        case 'icon': return _iconGizmoMap;
        case 'persistent': return _persistentGizmoMap;
    }
}
function getGizmoProperty(type, comp) {
    return getGizmoMap(type).get(comp);
}
// 与 cocos-editor data.ts setGizmoProperty 一致：替换时清除旧 gizmo 的 target
function setGizmoProperty(type, comp, gizmo) {
    const oldGizmo = getGizmoMap(type).get(comp);
    if (oldGizmo) {
        oldGizmo.target = null;
    }
    getGizmoMap(type).set(comp, gizmo);
    if (gizmo) {
        gizmo.target = comp;
    }
}
function getGizmoDefMap(type) {
    switch (type) {
        case 'component': return gizmo_defines_1.default.components;
        case 'icon': return gizmo_defines_1.default.iconGizmo;
        case 'persistent': return gizmo_defines_1.default.persistentGizmo;
    }
}
// Hack component for transform gizmo — needs a real class so
// js.getClassName returns '_EditorHackTransformComponent_' to match GizmoDefines
class HackTransformComponent {
    node;
    get enabledInHierarchy() { return true; }
    constructor(node) { this.node = node; }
}
HackTransformComponent.prototype.__classname__ = '_EditorHackTransformComponent_';
const _transformCompMap = new WeakMap();
function getTransformHackComp(node) {
    let comp = _transformCompMap.get(node);
    if (!comp) {
        comp = new HackTransformComponent(node);
        _transformCompMap.set(node, comp);
    }
    return comp;
}
function isEditorNode(node) {
    if (node.layer & cc_1.Layers.Enum.GIZMOS)
        return true;
    if (node.layer & cc_1.Layers.Enum.SCENE_GIZMO)
        return true;
    if (node.layer & cc_1.Layers.Enum.EDITOR)
        return true;
    return false;
}
function walkNodeComponent(node, callback) {
    if (!node || isEditorNode(node))
        return;
    // Transform hack component
    const hackComp = getTransformHackComp(node);
    callback(hackComp);
    // Real components
    const components = node.components;
    if (components) {
        for (let i = 0; i < components.length; i++) {
            callback(components[i]);
        }
    }
}
function getNodeByPath(path) {
    return (0, editor_node_1.getEditorNodeByPath)(path);
}
function getNodeByUuid(uuid) {
    return (0, editor_node_1.getEditorNodeByUuid)(uuid);
}
function getNodePath(node) {
    return (0, editor_node_1.getEditorNodePath)(node);
}
const SceneGizmoLayer = cc_1.Layers.Enum.SCENE_GIZMO;
let GizmoService = class GizmoService extends core_1.BaseService {
    gizmoRootNode;
    foregroundNode;
    backgroundNode;
    transformToolData = new transform_tool_1.TransformToolData();
    // 与 cocos-editor GizmoManager 一致：场景 Gizmo 相机 + WorldAxis 控制器
    sceneGizmoCamera;
    _worldAxisController = null;
    _gizmoOperation;
    _iconVisible = false;
    _selection = [];
    _hasEditorOpened = false;
    // Pool: Map<className, GizmoBase[]> — 与 cocos-editor GizmoPool 一致
    _componentPool = new Map();
    _iconPool = new Map();
    _persistentPool = new Map();
    // ── Transform tool accessors (与 cocos-editor TransformGizmoManager 一致) ──
    get transformToolName() {
        return this.transformToolData.toolName;
    }
    set transformToolName(value) {
        this.transformToolData.toolName = value;
    }
    get isViewMode() {
        return this.transformToolData.toolName === 'view' &&
            this.transformToolData.viewMode === 'view';
    }
    get viewMode() {
        return this.transformToolData.viewMode;
    }
    set viewMode(value) {
        this.transformToolData.viewMode = value;
    }
    get coordinate() {
        return this.transformToolData.coordinate;
    }
    set coordinate(value) {
        this.transformToolData.coordinate = value;
    }
    get pivot() {
        return this.transformToolData.pivot;
    }
    set pivot(value) {
        this.transformToolData.pivot = value;
    }
    get is2D() {
        return this.transformToolData.is2D;
    }
    set is2D(value) {
        this.transformToolData.is2D = !!value;
        if (value) {
            this._worldAxisController?.hide();
            this._iconVisible = false;
        }
        else {
            this._worldAxisController?.show();
            this._iconVisible = true;
        }
        this.setIconVisible(this._iconVisible);
    }
    // ── Scene Gizmo (与 cocos-editor GizmoManager.createSceneGizmo 一致) ──────
    createSceneGizmo() {
        const node = new cc_1.Node('Scene Gizmo Camera');
        node.layer = cc_1.Layers.Enum.EDITOR | cc_1.Layers.Enum.IGNORE_RAYCAST;
        node.parent = this.backgroundNode;
        const camera = node.addComponent('cc.Camera');
        camera.inEditorMode = true;
        this.sceneGizmoCamera = camera;
        camera.far = 1000;
        camera.visibility = SceneGizmoLayer;
        camera.rect = new cc_1.Rect(0.7, 0.8, 0.2, 0.2);
        camera.priority = (1 << 30) + (1 << 29);
        camera.clearFlags = cc_1.gfx.ClearFlagBit.DEPTH_STENCIL;
        if (this.gizmoRootNode) {
            this._worldAxisController = new world_axis_1.default(this.gizmoRootNode, camera);
        }
        this.setSceneGizmoCameraRect();
    }
    setSceneGizmoCameraRect() {
        const root = cc_1.director.root;
        const winWidth = root?.curWindow ? root.curWindow.width : 0;
        const winHeight = root?.curWindow ? root.curWindow.height : 0;
        if (winWidth === 0 || winHeight === 0)
            return;
        const height = winHeight / 6;
        const heightPercent = height / winHeight;
        const delta = ((winWidth - winHeight) * heightPercent) / 2 / winWidth;
        const padding = (30 * (typeof window !== 'undefined' ? window.devicePixelRatio : 1)) / winHeight;
        if (this.sceneGizmoCamera) {
            this.sceneGizmoCamera.rect = new cc_1.Rect(1 - heightPercent + delta, 1 - heightPercent - padding, heightPercent, heightPercent);
        }
    }
    onResize() {
        this.setSceneGizmoCameraRect();
    }
    // ── Lifecycle ───────────────────────────────────────────────────────────────
    init() {
        // 用于编辑器绘制的背景和前景节点
        this.foregroundNode = new cc.Node('Editor Scene Foreground');
        this.backgroundNode = new cc.Node('Editor Scene Background');
        // 编辑器使用的节点不需要存储和显示在层级管理器
        this.foregroundNode.objFlags |= cc.Object.Flags.DontSave | cc.Object.Flags.HideInHierarchy;
        this.backgroundNode.objFlags |= cc.Object.Flags.DontSave | cc.Object.Flags.HideInHierarchy;
        // 这些节点应该是常驻节点
        cc.director.addPersistRootNode(this.foregroundNode);
        cc.director.addPersistRootNode(this.backgroundNode);
        const scene = cc.director?.getScene();
        if (scene) {
            this.foregroundNode.parent = scene;
            this.backgroundNode.parent = scene;
        }
        this.foregroundNode.layer = cc_1.Layers.Enum.GIZMOS;
        this.backgroundNode.layer = cc_1.Layers.Enum.GIZMOS;
        // Create gizmo root
        this.gizmoRootNode = (0, engine_utils_1.create3DNode)('gizmoRoot');
        this.gizmoRootNode.parent = this.foregroundNode;
        // 与 cocos-editor GizmoManager.init 一致：创建场景 Gizmo 相机 + WorldAxis
        this.createSceneGizmo();
        // 与 cocos-editor scene-facade-manager 一致：监听 resize 事件更新场景 Gizmo 相机视口
        // cocos-editor 通过 operationMgr.on('resize', ...) → dispatchEvents('onResize') 实现
        try {
            decorator_1.Service.Operation.addListener('resize', () => this.onResize());
        }
        catch (e) {
            // Operation service not ready yet
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.onResize());
        }
        // Init GizmoOperation
        this._gizmoOperation = new gizmo_operation_1.default();
        this._gizmoOperation.init();
        // Listen for tool changes
        this.transformToolData.on('tool-name-changed', (name) => {
            this.emit('gizmo:tool-changed', name);
            this.saveConfig();
        });
        this.transformToolData.on('coordinate-changed', () => { this.saveConfig(); });
        this.transformToolData.on('pivot-changed', () => { this.saveConfig(); });
        this.transformToolData.on('view-mode-changed', () => { this.saveConfig(); });
        // 与 cocos-editor gizmos.ts 一致：dimension-changed → 同步相机 + 回调
        this.transformToolData.on('dimension-changed', (is2D) => {
            try {
                decorator_1.Service.Camera.is2D = is2D;
            }
            catch (e) {
                // Camera not ready yet
            }
            this.onDimensionChanged(is2D);
            global_events_1.ServiceEvents.emit('scene:dimension-changed', is2D);
            this.saveConfig();
        });
        // 与 cocos-editor gizmos.ts 一致：只在 IDLE 解锁、WANDER 锁定
        try {
            decorator_1.Service.Camera?.controller3D?.on?.('camera-move-mode', (mode) => {
                if (mode === 0) { // CameraMoveMode.IDLE
                    this.lockGizmoTool(false);
                }
                else if (mode === 4) { // CameraMoveMode.WANDER
                    this.lockGizmoTool(true);
                }
            });
        }
        catch (e) {
            // Camera not ready yet
        }
        // 与 cocos-editor 一致：直接监听 Selection 事件
        global_events_1.ServiceEvents.on('selection:select', (path) => {
            this.onSelectionSelect(path);
        });
        global_events_1.ServiceEvents.on('selection:unselect', (path) => {
            this.onSelectionUnselect(path);
        });
        global_events_1.ServiceEvents.on('selection:clear', () => {
            this.onSelectionClear();
        });
        // 与 cocos-editor TransformGizmoManager.__listenEvents 一致：snap 配置变更持久化
        this._listenSnapEvents();
        // 与 cocos-editor GizmoManager.init 一致：gizmo 配置只在服务初始化时恢复。
        // 打开/重载场景时会强制切回 position，避免异步配置读取覆盖场景打开流程。
        void this.initFromConfig();
        // 与 cocos-editor GizmoManager.init 一致：监听相机投影变化
        try {
            decorator_1.Service.Camera?.controller?.on?.('projection-changed', (projection) => {
                this._worldAxisController?.onCameraProjectionChanged(projection);
            });
        }
        catch (e) {
            // Camera not ready yet
        }
    }
    _listenSnapEvents() {
        const snapConfigs = this.transformToolData.snapConfigs;
        const save = () => { this._saveSnapConfig(); };
        snapConfigs.on('snap-position-changed', save);
        snapConfigs.on('snap-rotation-changed', save);
        snapConfigs.on('snap-scale-changed', save);
        snapConfigs.on('enable-snap-position-changed', save);
        snapConfigs.on('enable-snap-rotation-changed', save);
        snapConfigs.on('enable-snap-scale-changed', save);
    }
    async _saveSnapConfig() {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            const snapData = this.transformToolData.snapConfigs.getPureDataObject();
            await rpc.request('sceneConfigInstance', 'set', ['gizmo.snapConfigs', snapData, 'local']);
        }
        catch {
            // Config persistence not available
        }
    }
    // 与 cocos-editor GizmoManager.initFromConfig 一致
    async initFromConfig() {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            const config = await rpc.request('sceneConfigInstance', 'get', ['gizmo', 'local']);
            if (config) {
                if (config.is2D !== undefined)
                    this.is2D = config.is2D;
                if (config.is3DIcon !== undefined)
                    this.setIconGizmo3D(config.is3DIcon);
                if (config.iconSize !== undefined)
                    this.setIconGizmoSize(config.iconSize);
                if (!this._hasEditorOpened) {
                    if (config.transformToolName !== undefined)
                        this.transformToolName = config.transformToolName;
                    if (config.viewMode !== undefined)
                        this.viewMode = config.viewMode;
                }
                if (config.pivot !== undefined)
                    this.setPivot(config.pivot);
                if (config.coordinate !== undefined)
                    this.setCoordinate(config.coordinate);
                if (config.toolsVisibility3d !== undefined) {
                    this.setToolsVisibility3d(config.toolsVisibility3d);
                }
                else {
                    this.setToolsVisibility3d(true);
                }
                if (config.snapConfigs) {
                    this.transformToolData.snapConfigs.initFromData(config.snapConfigs);
                }
                if (config.rectSnapConfig) {
                    rect_transform_snapping_1.rectTransformSnapping.initFromData(config.rectSnapConfig);
                }
                if (config.gridColor !== undefined)
                    GizmoConfig.gridColor = config.gridColor;
                if (config.originAxis2D !== undefined)
                    GizmoConfig.originAxis2D = config.originAxis2D;
                if (config.originAxis3D !== undefined)
                    GizmoConfig.originAxis3D = config.originAxis3D;
            }
        }
        catch {
            // 配置不可用时使用默认值
        }
    }
    // 与 cocos-editor GizmoManager.saveConfig 一致
    async saveConfig() {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            const current = await rpc.request('sceneConfigInstance', 'get', ['gizmo', 'local']) ?? {};
            // 注意：GizmoConfig 拥有的字段（gridColor、is3DIcon、iconSize、toolsVisibility3d、
            // originAxis2D、originAxis3D）不在此写入，改由各自 setter 定向落盘（见 _saveGizmoConfigField），
            // 避免打开场景切回 position 触发的 saveConfig 用尚未载入的默认值覆盖已保存的配置。
            // 这里用 ...current 保留磁盘上已有的这些字段，只写会随场景/操作实时变化的字段。
            const gizmoConfig = {
                ...current,
                is2D: this.is2D,
                transformToolName: this.transformToolName,
                viewMode: this.viewMode,
                pivot: this.pivot,
                coordinate: this.coordinate,
                snapConfigs: this.transformToolData.snapConfigs.getPureDataObject(),
                rectSnapConfig: rect_transform_snapping_1.rectTransformSnapping.getPureDataObject(),
            };
            await rpc.request('sceneConfigInstance', 'set', ['gizmo', gizmoConfig, 'local']);
        }
        catch {
            // Config persistence not available
        }
    }
    // GizmoConfig 拥有的字段单独定向落盘，与 _saveSnapConfig 一致，不经过整块 saveConfig。
    // 原因：saveConfig 会用 GizmoConfig 静态量重新快照所有字段，若某字段尚未从磁盘载入（仍是默认值），
    // 由其它改动触发的 saveConfig 会把它写回默认值，覆盖上次保存的个性化配置。改为逐字段定向落盘后，
    // 每次只写发生变化的那个字段，其余字段由 saveConfig 的 ...current 从磁盘原样保留。
    async _saveGizmoConfigField(subKey, value) {
        try {
            const rpc = rpc_1.Rpc.getInstance();
            await rpc.request('sceneConfigInstance', 'set', [`gizmo.${subKey}`, value, 'local']);
        }
        catch {
            // Config persistence not available
        }
    }
    // ── Transform tool methods ──────────────────────────────────────────────────
    changeTool(name) {
        this.transformToolName = name;
    }
    setCoordinate(coord) {
        this.transformToolData.coordinate = coord;
    }
    setPivot(pivot) {
        this.transformToolData.pivot = pivot;
    }
    lockGizmoTool(locked) {
        this.transformToolData.isLocked = locked;
    }
    isGizmoToolLocked() {
        return this.transformToolData.isLocked;
    }
    // ── GizmoConfig methods (与 cocos-editor GizmoManager 一致) ────────────────
    queryToolsVisibility3d() {
        return GizmoConfig.toolsVisibility3d;
    }
    setToolsVisibility3d(value) {
        GizmoConfig.toolsVisibility3d = Boolean(value);
        for (const uuid of this._selection) {
            try {
                const node = getNodeByUuid(uuid);
                if (node) {
                    walkNodeComponent(node, (component) => {
                        const gizmo = getGizmoProperty('component', component);
                        if (gizmo) {
                            if (gizmo.target !== component) {
                                this._showGizmo('component', component, true);
                            }
                            const visible = gizmo.checkVisible();
                            if (visible)
                                gizmo.show();
                            else
                                gizmo.hide();
                        }
                    });
                }
            }
            catch (e) {
                // Scene not ready
            }
        }
        decorator_1.Service.Engine?.repaintInEditMode?.();
        void this._saveGizmoConfigField('toolsVisibility3d', GizmoConfig.toolsVisibility3d);
    }
    isIconGizmo3D() {
        return GizmoConfig.isIconGizmo3D;
    }
    setIconGizmo3D(value) {
        if (value === null || value === undefined)
            return;
        GizmoConfig.isIconGizmo3D = value;
        this._walkAllSceneNodes((component) => {
            const iconGizmo = getGizmoProperty('icon', component);
            if (iconGizmo && iconGizmo.setIconGizmo3D) {
                iconGizmo.setIconGizmo3D(value);
            }
        });
        decorator_1.Service.Engine?.repaintInEditMode?.();
        void this._saveGizmoConfigField('is3DIcon', GizmoConfig.isIconGizmo3D);
    }
    queryIconGizmoSize() {
        return GizmoConfig.iconGizmoSize;
    }
    setIconGizmoSize(size) {
        if (size === null || size === undefined)
            return;
        GizmoConfig.iconGizmoSize = size;
        this._walkAllSceneNodes((component) => {
            const iconGizmo = getGizmoProperty('icon', component);
            if (iconGizmo && iconGizmo.setIconGizmoSize) {
                iconGizmo.setIconGizmoSize(size);
            }
        });
        decorator_1.Service.Engine?.repaintInEditMode?.();
        void this._saveGizmoConfigField('iconSize', GizmoConfig.iconGizmoSize);
    }
    queryGridColor() {
        return GizmoConfig.gridColor;
    }
    setGridColor(color) {
        if (!color)
            return;
        GizmoConfig.gridColor = [...color];
        decorator_1.Service.Camera?.setGridColor?.(color, false);
        void this._saveGizmoConfigField('gridColor', [...color]);
    }
    queryOriginAxes2D() {
        return GizmoConfig.originAxis2D;
    }
    setOriginAxes2D(config) {
        if (!config)
            return;
        GizmoConfig.originAxis2D = { ...config };
        decorator_1.Service.Camera?.setOriginAxes2D?.(config);
        void this._saveGizmoConfigField('originAxis2D', { ...GizmoConfig.originAxis2D });
    }
    queryOriginAxes3D() {
        return GizmoConfig.originAxis3D;
    }
    setOriginAxes3D(config) {
        if (!config)
            return;
        GizmoConfig.originAxis3D = { ...config };
        decorator_1.Service.Camera?.setOriginAxes3D?.(config);
        void this._saveGizmoConfigField('originAxis3D', { ...GizmoConfig.originAxis3D });
    }
    setIconVisible(visible) {
        this._iconVisible = visible;
        // 与 cocos-editor iconVisible setter 一致：遍历场景所有节点
        this._walkAllSceneNodes((component) => {
            const iconGizmo = getGizmoProperty('icon', component);
            if (iconGizmo && iconGizmo.setIconGizmoVisible) {
                iconGizmo.setIconGizmoVisible(visible);
            }
        });
    }
    // 与 cocos-editor iconVisible setter 一致：遍历场景所有节点而非 pool
    _walkAllSceneNodes(callback) {
        const scene = cc.director?.getScene();
        if (!scene)
            return;
        this._walkNodeTree(scene, callback);
    }
    _walkNodeTree(node, callback) {
        if (!node || isEditorNode(node))
            return;
        walkNodeComponent(node, callback);
        const children = node.children;
        if (children) {
            for (let i = 0; i < children.length; i++) {
                this._walkNodeTree(children[i], callback);
            }
        }
    }
    // ── Snap config methods (与 cocos-editor TransformGizmoManager 一致) ───────
    queryTransformSnapConfigs() {
        return this.transformToolData.snapConfigs.getPureDataObject();
    }
    setTransformSnapConfigs(name, value) {
        this.transformToolData.snapConfigs[name] = value;
    }
    queryRectSnapConfig() {
        return rect_transform_snapping_1.rectTransformSnapping.getPureDataObject();
    }
    setRectSnapConfig(config) {
        rect_transform_snapping_1.rectTransformSnapping.initFromData({
            ...rect_transform_snapping_1.rectTransformSnapping.getPureDataObject(),
            ...config,
        });
        decorator_1.Service.Engine?.repaintInEditMode?.();
        void this.saveConfig();
    }
    // ── Pool management (与 cocos-editor GizmoPool 一致) ────────────────────────
    _getPool(type) {
        switch (type) {
            case 'component': return this._componentPool;
            case 'icon': return this._iconPool;
            case 'persistent': return this._persistentPool;
        }
    }
    // 与 cocos-editor GizmoPool.unmountGizmo 一致
    _unmountGizmo(gizmo) {
        if (gizmo.target) {
            const types = ['component', 'icon', 'persistent'];
            for (const type of types) {
                const existing = getGizmoProperty(type, gizmo.target);
                if (existing === gizmo) {
                    setGizmoProperty(type, gizmo.target, null);
                }
            }
        }
        gizmo.target = null;
    }
    _createGizmo(type, name) {
        const defMap = getGizmoDefMap(type);
        const GizmoCtor = defMap.get(name);
        const pool = this._getPool(type);
        let instances = pool.get(name);
        if (!instances) {
            instances = [];
            pool.set(name, instances);
        }
        // 与 cocos-editor pool.createGizmo 一致：检查构造函数是否匹配，不匹配则销毁
        if (instances.length > 0 && instances[0].constructor !== GizmoCtor) {
            instances.forEach((inst) => inst.destroy());
            instances.length = 0;
        }
        if (!GizmoCtor)
            return null;
        // Reuse hidden instance
        for (const inst of instances) {
            if (!inst.visible()) {
                return inst;
            }
        }
        // Create new
        const gizmo = new GizmoCtor(null);
        instances.push(gizmo);
        return gizmo;
    }
    // 与 cocos-editor GizmoPool.destroyGizmo 一致
    _destroyGizmo(gizmo) {
        this._unmountGizmo(gizmo);
        gizmo.destroy();
        const pools = [this._componentPool, this._iconPool, this._persistentPool];
        for (const pool of pools) {
            for (const [, instances] of pool) {
                const index = instances.indexOf(gizmo);
                if (index !== -1) {
                    instances.splice(index, 1);
                }
            }
        }
    }
    forEachInstanceList(type, name, handle) {
        const pool = this._getPool(type);
        const instances = pool.get(name);
        if (!instances)
            return;
        instances.forEach(handle);
    }
    _showGizmo(type, component, focusCreate = false) {
        if (!component)
            return;
        let gizmo = getGizmoProperty(type, component);
        // 与 cocos-editor showGizmo 一致：focusCreate 时强制重新创建
        if (!gizmo || focusCreate) {
            const name = cc_1.js.getClassName(component);
            gizmo = this._createGizmo(type, name);
            if (!gizmo)
                return;
            setGizmoProperty(type, component, gizmo);
        }
        if (type === 'icon') {
            if (gizmo.setIconGizmoVisible) {
                gizmo.setIconGizmoVisible(this._iconVisible);
            }
        }
        else {
            gizmo.show();
        }
    }
    _hideGizmo(gizmo) {
        gizmo.hide();
    }
    _removeGizmo(type, component) {
        const gizmo = getGizmoProperty(type, component);
        if (gizmo) {
            this._hideGizmo(gizmo);
            setGizmoProperty(type, component, null);
        }
    }
    // ── Node gizmo management ───────────────────────────────────────────────────
    // 与 cocos-editor GizmoPoolManager.showGizmoOfNode 一致
    showGizmoOfNode(type, node) {
        if (!node || !node.parent || !node.activeInHierarchy)
            return;
        walkNodeComponent(node, (component) => {
            if (!component.enabledInHierarchy)
                return;
            this._showGizmo(type, component);
        });
    }
    showAllGizmoOfNode(node, recursive = false) {
        if (!node || isEditorNode(node))
            return;
        if (!node.parent || !node.activeInHierarchy)
            return;
        walkNodeComponent(node, (component) => {
            if (component.enabledInHierarchy === false)
                return;
            this._showGizmo('icon', component);
            this._showGizmo('persistent', component);
            this._showGizmo('component', component);
        });
        if (recursive) {
            node.children.forEach((child) => {
                this.showAllGizmoOfNode(child, true);
            });
        }
    }
    // 与 cocos-editor GizmoPoolManager.removeGizmoOfNode 一致
    removeGizmoOfNode(type, node) {
        walkNodeComponent(node, (component) => {
            this._removeGizmo(type, component);
        });
    }
    removeAllGizmoOfNode(node, recursive = false) {
        if (!node)
            return;
        walkNodeComponent(node, (component) => {
            this._removeGizmo('component', component);
            this._removeGizmo('icon', component);
            this._removeGizmo('persistent', component);
        });
        if (recursive) {
            node.children.forEach((child) => {
                this.removeAllGizmoOfNode(child, true);
            });
        }
    }
    // 与 cocos-editor GizmoPool.clearAllGizmos 一致
    clearAllGizmos() {
        const pools = [this._componentPool, this._iconPool, this._persistentPool];
        for (const pool of pools) {
            for (const [, instances] of pool) {
                for (const gizmo of instances) {
                    this._unmountGizmo(gizmo);
                    gizmo.destroy();
                }
            }
            pool.clear();
        }
    }
    callAllGizmoFuncOfNode(node, funcName, ...params) {
        let stopped = false;
        if (!node)
            return true;
        walkNodeComponent(node, (component) => {
            const compGizmo = getGizmoProperty('component', component);
            if (component && compGizmo && compGizmo[funcName]) {
                const res = compGizmo[funcName](...params);
                if (res === false)
                    stopped = true;
            }
        });
        return !stopped;
    }
    /** Returns the component gizmo without exposing the internal WeakMap to callers. */
    getComponentGizmo(component) {
        return getGizmoProperty('component', component) ?? null;
    }
    // ── Selection integration (与 cocos-editor SelectionGizmoManager 一致) ─────
    querySelectNodes() {
        return this._selection
            .map((uuid) => getNodeByUuid(uuid))
            .filter((node) => node !== null);
    }
    hasSelected(uuid) {
        return this._selection.includes(uuid);
    }
    onSelectionSelect(path) {
        const node = getNodeByPath(path);
        if (!node)
            return;
        const uuid = node.uuid;
        if (this._selection.includes(uuid))
            return;
        try {
            this.showAllGizmoOfNode(node);
            this._onNodeSelectionChanged(node, true);
        }
        catch (e) {
            // Scene not ready
        }
        this._selection.push(uuid);
    }
    onSelectionUnselect(path) {
        const node = getNodeByPath(path);
        if (!node)
            return;
        const uuid = node.uuid;
        const idx = this._selection.indexOf(uuid);
        if (idx >= 0)
            this._selection.splice(idx, 1);
        try {
            const node = getNodeByUuid(uuid);
            if (node) {
                this._onNodeSelectionChanged(node, false);
                this.removeGizmoOfNode('component', node);
            }
        }
        catch (e) {
            // Scene not ready
        }
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    onSelectionClear() {
        const oldSelection = [...this._selection];
        this._selection.length = 0;
        for (const uuid of oldSelection) {
            try {
                const node = getNodeByUuid(uuid);
                if (node) {
                    this._onNodeSelectionChanged(node, false);
                    this.removeGizmoOfNode('component', node);
                }
            }
            catch (e) {
                // Scene not ready
            }
        }
    }
    // 与 cocos-editor GizmoManager.onNodeSelectionChanged 一致
    _onNodeSelectionChanged(node, selected) {
        if (!node || !node.parent)
            return;
        if (!node.activeInHierarchy)
            return;
        walkNodeComponent(node, (component) => {
            const iconGizmo = getGizmoProperty('icon', component);
            if (iconGizmo && iconGizmo.onNodeSelectionChanged) {
                iconGizmo.onNodeSelectionChanged(selected);
            }
        });
    }
    _reselectCurrentSelection() {
        const selectedPaths = Array.from(new Set(decorator_1.Service.Selection?.query?.() ?? []));
        this._selection.length = 0;
        decorator_1.Service.Selection?.clear?.();
        for (const path of selectedPaths) {
            if (!getNodeByPath(path)) {
                continue;
            }
            decorator_1.Service.Selection?.select?.(path);
        }
    }
    // ── 编辑器生命周期（由 BaseService 事件钩子调用）───────────────────────────
    refreshSelectedGizmos() {
        const selectedPaths = decorator_1.Service.Selection?.query?.() ?? [];
        let refreshed = false;
        for (const path of selectedPaths) {
            const node = getNodeByPath(path);
            if (node) {
                this.onNodeChanged(node);
                refreshed = true;
            }
        }
        if (refreshed) {
            decorator_1.Service.Engine?.repaintInEditMode?.();
        }
    }
    onEditorOpened() {
        this._hasEditorOpened = true;
        this.clearAllGizmos();
        // 与 Creator onSceneOpened 一致：场景加载后 active 才可靠，每次打开都回到移动工具。
        this.transformToolName = 'position';
        this._showIconGizmosForScene();
        // 编辑器打开/重载后节点和组件对象可能已重建，保留选择路径并重新挂到新组件上。
        this._reselectCurrentSelection();
        // Camera.onEditorOpened 会异步恢复视图；延后一帧再补注册并刷新世界坐标轴。
        setTimeout(() => {
            // init 阶段编辑器相机还不存在，registerCameraMovedEvent 静默失败，此处补注册
            this._worldAxisController?.registerCameraMovedEvent();
            if (!this.transformToolData.is2D) {
                this._worldAxisController?.show();
            }
            this._worldAxisController?.onEditorCameraMoved();
            decorator_1.Service.Engine?.repaintInEditMode?.();
        }, 300);
    }
    onEditorClosed() {
        this.saveConfig();
    }
    onNodeChanged(node, opts) {
        if (!node)
            return;
        // 光照探针数据变化（如探针组重新生成）时，探针组自身节点会收到该事件，
        // 但受其影响的 mesh 的四面体高亮挂在别的节点上，需主动通知选中的探针消费者刷新。
        if (opts?.type === common_1.NodeEventType.LIGHT_PROBE_CHANGED || opts?.type === common_1.NodeEventType.LIGHT_PROBE_BAKING_CHANGED) {
            this._scheduleProbeConsumersRefresh();
        }
        const has = this._selection.includes(node.uuid);
        walkNodeComponent(node, (component) => {
            const isHackComp = component instanceof HackTransformComponent ||
                component.__classname__ === '_EditorHackTransformComponent_';
            if (!isHackComp && (!component.enabled || !node.active || !node.parent)) {
                if (has)
                    this._removeGizmo('component', component);
                this._removeGizmo('icon', component);
                this._removeGizmo('persistent', component);
                return;
            }
            let gizmo;
            if (has) {
                gizmo = getGizmoProperty('component', component);
                if (gizmo) {
                    if (gizmo.onNodeChanged && gizmo.checkVisible()) {
                        gizmo.onNodeChanged(opts);
                    }
                }
                else {
                    this._showGizmo('component', component);
                }
            }
            gizmo = getGizmoProperty('persistent', component);
            if (gizmo) {
                if (gizmo.onNodeChanged && gizmo.checkVisible()) {
                    gizmo.onNodeChanged(opts);
                }
            }
            else {
                this._showGizmo('persistent', component);
            }
            gizmo = getGizmoProperty('icon', component);
            if (gizmo) {
                if (gizmo.onNodeChanged && gizmo.checkVisible()) {
                    gizmo.onNodeChanged(opts);
                }
            }
            else {
                this._showGizmo('icon', component);
            }
        });
        if (opts?.type !== common_1.NodeEventType.CHILD_CHANGED
            && opts?.type !== common_1.NodeEventType.LIGHT_PROBE_CHANGED
            && opts?.type !== common_1.NodeEventType.LIGHT_PROBE_BAKING_CHANGED) {
            node.children.forEach((child) => {
                this.onNodeChanged(child, opts);
            });
        }
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    /**
     * 光照探针数据变化时，通知当前选中节点上的组件 gizmo（如 mesh/skinned 的影响四面体）刷新。
     * tetra helper 内部按签名短路，重复调用是廉价的。
     */
    _notifyLightProbeChanged() {
        for (const uuid of this._selection) {
            const node = getNodeByUuid(uuid);
            if (!node)
                continue;
            walkNodeComponent(node, (component) => {
                const gizmo = getGizmoProperty('component', component);
                if (gizmo && gizmo.onLightProbeChanged && gizmo.checkVisible()) {
                    gizmo.onLightProbeChanged();
                }
            });
        }
    }
    _probeRefreshScheduled = false;
    /**
     * 去抖：烘焙事件（LIGHT_PROBE_BAKING_CHANGED）会在场景所有节点上同步 emit，
     * 用微任务把这一波折叠成一次刷新，避免每节点一次导致的重复重建。
     */
    _scheduleProbeConsumersRefresh() {
        if (this._probeRefreshScheduled)
            return;
        this._probeRefreshScheduled = true;
        Promise.resolve().then(() => {
            this._probeRefreshScheduled = false;
            this._notifyLightProbeChanged();
        });
    }
    onComponentAdded(comp) {
        const node = comp.node;
        if (!node)
            return;
        if (this._selection.includes(node.uuid)) {
            this.showAllGizmoOfNode(node);
        }
    }
    onComponentRemoved(comp) {
        this._removeGizmo('icon', comp);
        this._removeGizmo('persistent', comp);
        const compGizmo = getGizmoProperty('component', comp);
        if (compGizmo) {
            this._hideGizmo(compGizmo);
        }
    }
    onNodeAdded(node) {
        if (this._selection.includes(node.uuid)) {
            this.showAllGizmoOfNode(node);
        }
    }
    onNodeRemoved(node) {
        this.removeAllGizmoOfNode(node, true);
    }
    // 与 cocos-editor GizmoManager.onDimensionChanged 一致
    onDimensionChanged(_is2D) {
        this.setToolsVisibility3d(GizmoConfig.toolsVisibility3d);
    }
    _showIconGizmosForScene() {
        const scene = cc.director?.getScene();
        if (!scene)
            return;
        this._walkSceneForIcons(scene);
    }
    _walkSceneForIcons(node) {
        if (!node || isEditorNode(node))
            return;
        const components = node.components;
        if (components) {
            for (let i = 0; i < components.length; i++) {
                const comp = components[i];
                const className = cc_1.js.getClassName(comp);
                if (gizmo_defines_1.default.iconGizmo.has(className)) {
                    this._showGizmo('icon', comp);
                }
                if (gizmo_defines_1.default.persistentGizmo.has(className)) {
                    this._showGizmo('persistent', comp);
                }
            }
        }
        const children = node.children;
        if (children) {
            for (let i = 0; i < children.length; i++) {
                this._walkSceneForIcons(children[i]);
            }
        }
    }
    // ── Selection region (与 cocos-editor GizmoManager 一致) ──────────────────
    showSelectionRegion(left, right, top, bottom) {
        const cameraComp = decorator_1.Service.Camera?.getCamera?.();
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
        const geometryRenderer = decorator_1.Service.Engine?.getGeometryRenderer?.();
        if (geometryRenderer) {
            geometryRenderer.removeData('addQuad');
            geometryRenderer.addQuad(p0, p1, p2, p3, new cc_1.Color(255, 255, 255, 120), false, false, true);
        }
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    hideSelectionRegion() {
        decorator_1.Service.Engine?.getGeometryRenderer?.()?.removeData('addQuad');
        decorator_1.Service.Engine?.repaintInEditMode?.();
    }
    // 与 cocos-editor GizmoManager.execGizmoMethods 一致
    execGizmoMethods(name, funcName, params = []) {
        const methods = gizmo_defines_1.default.methods?.get?.(name);
        if (!methods || !methods[funcName]) {
            return;
        }
        return methods[funcName](...params);
    }
    _changeRegionSelectMode(mode) {
        gizmo_operation_1.default.changeRegionSelectMode?.(mode);
    }
    // ── Update ──────────────────────────────────────────────────────────────────
    onUpdate(deltaTime) {
        for (const uuid of this._selection) {
            try {
                const node = getNodeByUuid(uuid);
                if (!node)
                    continue;
                walkNodeComponent(node, (component) => {
                    const compGizmo = getGizmoProperty('component', component);
                    if (compGizmo && compGizmo.checkVisible()) {
                        compGizmo.update(deltaTime);
                    }
                });
            }
            catch (e) {
                // Scene not ready
            }
        }
    }
};
exports.GizmoService = GizmoService;
exports.GizmoService = GizmoService = __decorate([
    (0, decorator_1.register)('Gizmo')
], GizmoService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l6bW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvZ2l6bW8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7QUFFYiwyQkFBb0c7QUFDcEcsaUNBQXFDO0FBQ3JDLGdEQUFxRDtBQUNyRCx3REFBcUQ7QUFDckQsMkRBQTRFO0FBQzVFLDBFQUFpRDtBQUVqRCw4RUFBcUQ7QUFDckQsMkRBQXdHO0FBQ3hHLDZEQUEwRDtBQUMxRCxtRkFBOEU7QUFDOUUsK0VBQWdFO0FBQ2hFLHlDQUE2QztBQUM3QyxnQ0FBNkI7QUFJN0IsMkVBQTJFO0FBQzNFLHFDQUFtQztBQUNuQywyQ0FBeUM7QUFDekMsZ0RBQThDO0FBQzlDLHFDQUFtQztBQUNuQywyQ0FBeUM7QUFDekMsMkNBQXlDO0FBQ3pDLHlDQUF1QztBQUN2Qyw4Q0FBNEM7QUFDNUMsK0NBQTZDO0FBQzdDLDRDQUEwQztBQUMxQyxnREFBOEM7QUFDOUMsNkNBQTJDO0FBQzNDLCtDQUE2QztBQUM3Qyw0Q0FBMEM7QUFDMUMsOENBQTRDO0FBQzVDLGlEQUErQztBQUMvQyxrREFBZ0Q7QUFDaEQsZ0RBQThDO0FBQzlDLDhDQUE0QztBQUM1Qyw2Q0FBMkM7QUFDM0MsNkNBQTJDO0FBQzNDLGdEQUE4QztBQUM5Qyw4Q0FBNEM7QUFDNUMsNkNBQTJDO0FBQzNDLDRDQUEwQztBQUMxQyxvREFBa0Q7QUFDbEQsMkNBQXlDO0FBQ3pDLHVDQUFxQztBQUNyQyxnREFBOEM7QUFDOUMsK0NBQTZDO0FBQzdDLHdDQUFzQztBQUN0Qyw4Q0FBNEM7QUFDNUMsNEdBQTRHO0FBQzVHLElBQUksWUFBTyxFQUFFLENBQUM7SUFDVixPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBSUQsNkNBQTZDO0FBQzdDLE1BQU0sV0FBVztJQUNiLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7SUFDaEMsTUFBTSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDN0IsTUFBTSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7SUFDekIsTUFBTSxDQUFDLFNBQVMsR0FBYSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xELE1BQU0sQ0FBQyxZQUFZLEdBQXNCLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQztJQUN4RSxNQUFNLENBQUMsWUFBWSxHQUFzQixFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUM7O0FBRzVFLDhEQUE4RDtBQUM5RCxNQUFNLGtCQUFrQixHQUFHLElBQUksT0FBTyxFQUErQixDQUFDO0FBQ3RFLE1BQU0sYUFBYSxHQUFHLElBQUksT0FBTyxFQUErQixDQUFDO0FBQ2pFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxPQUFPLEVBQStCLENBQUM7QUFFdkUsU0FBUyxXQUFXLENBQUMsSUFBZ0I7SUFDakMsUUFBUSxJQUFJLEVBQUUsQ0FBQztRQUNYLEtBQUssV0FBVyxDQUFDLENBQUMsT0FBTyxrQkFBa0IsQ0FBQztRQUM1QyxLQUFLLE1BQU0sQ0FBQyxDQUFDLE9BQU8sYUFBYSxDQUFDO1FBQ2xDLEtBQUssWUFBWSxDQUFDLENBQUMsT0FBTyxtQkFBbUIsQ0FBQztJQUNsRCxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsSUFBZ0IsRUFBRSxJQUFlO0lBQ3ZELE9BQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBRUQsbUVBQW1FO0FBQ25FLFNBQVMsZ0JBQWdCLENBQUMsSUFBZ0IsRUFBRSxJQUFlLEVBQUUsS0FBdUI7SUFDaEYsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QyxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ1gsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUNELFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25DLElBQUksS0FBSyxFQUFFLENBQUM7UUFDUixLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUN4QixDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQWdCO0lBQ3BDLFFBQVEsSUFBSSxFQUFFLENBQUM7UUFDWCxLQUFLLFdBQVcsQ0FBQyxDQUFDLE9BQU8sdUJBQVksQ0FBQyxVQUFVLENBQUM7UUFDakQsS0FBSyxNQUFNLENBQUMsQ0FBQyxPQUFPLHVCQUFZLENBQUMsU0FBUyxDQUFDO1FBQzNDLEtBQUssWUFBWSxDQUFDLENBQUMsT0FBTyx1QkFBWSxDQUFDLGVBQWUsQ0FBQztJQUMzRCxDQUFDO0FBQ0wsQ0FBQztBQUVELDZEQUE2RDtBQUM3RCxpRkFBaUY7QUFDakYsTUFBTSxzQkFBc0I7SUFDeEIsSUFBSSxDQUFPO0lBQ1gsSUFBSSxrQkFBa0IsS0FBSyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekMsWUFBWSxJQUFVLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0NBQ2hEO0FBQ0Esc0JBQXNCLENBQUMsU0FBaUIsQ0FBQyxhQUFhLEdBQUcsZ0NBQWdDLENBQUM7QUFFM0YsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLE9BQU8sRUFBbUIsQ0FBQztBQUV6RCxTQUFTLG9CQUFvQixDQUFDLElBQVU7SUFDcEMsSUFBSSxJQUFJLEdBQTBCLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDUixJQUFJLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQyxJQUFJLENBQXFCLENBQUM7UUFDNUQsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLElBQVU7SUFDNUIsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLFdBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTTtRQUFFLE9BQU8sSUFBSSxDQUFDO0lBQ2pELElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxXQUFNLENBQUMsSUFBSSxDQUFDLFdBQVc7UUFBRSxPQUFPLElBQUksQ0FBQztJQUN0RCxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFDakQsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsSUFBVSxFQUFFLFFBQW1DO0lBQ3RFLElBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQztRQUFFLE9BQU87SUFDeEMsMkJBQTJCO0lBQzNCLE1BQU0sUUFBUSxHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQixrQkFBa0I7SUFDbEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUNuQyxJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN6QyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsQ0FBQztJQUNMLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsSUFBWTtJQUMvQixPQUFPLElBQUEsaUNBQW1CLEVBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLElBQVk7SUFDL0IsT0FBTyxJQUFBLGlDQUFtQixFQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxJQUFVO0lBQzNCLE9BQU8sSUFBQSwrQkFBaUIsRUFBQyxJQUFJLENBQUMsQ0FBQztBQUNuQyxDQUFDO0FBQ0QsTUFBTSxlQUFlLEdBQUcsV0FBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7QUFHekMsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBYSxTQUFRLGtCQUF5QjtJQUN2RCxhQUFhLENBQVE7SUFDckIsY0FBYyxDQUFRO0lBQ3RCLGNBQWMsQ0FBUTtJQUN0QixpQkFBaUIsR0FBRyxJQUFJLGtDQUFpQixFQUFFLENBQUM7SUFFNUMsNkRBQTZEO0lBQzdELGdCQUFnQixDQUFVO0lBQ2xCLG9CQUFvQixHQUErQixJQUFJLENBQUM7SUFFeEQsZUFBZSxDQUFrQjtJQUNqQyxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLFVBQVUsR0FBYSxFQUFFLENBQUM7SUFDMUIsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO0lBRWpDLGtFQUFrRTtJQUMxRCxjQUFjLEdBQTZCLElBQUksR0FBRyxFQUFFLENBQUM7SUFDckQsU0FBUyxHQUE2QixJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2hELGVBQWUsR0FBNkIsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUU5RCwyRUFBMkU7SUFFM0UsSUFBSSxpQkFBaUI7UUFDakIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDO0lBQzNDLENBQUM7SUFFRCxJQUFJLGlCQUFpQixDQUFDLEtBQWE7UUFDL0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsR0FBRyxLQUFZLENBQUM7SUFDbkQsQ0FBQztJQUVELElBQUksVUFBVTtRQUNWLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsS0FBSyxNQUFNO1lBQzdDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEtBQUssTUFBTSxDQUFDO0lBQ25ELENBQUM7SUFFRCxJQUFJLFFBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7SUFDM0MsQ0FBQztJQUVELElBQUksUUFBUSxDQUFDLEtBQUs7UUFDZCxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztJQUM1QyxDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1YsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDO0lBQzdDLENBQUM7SUFFRCxJQUFJLFVBQVUsQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO0lBQzlDLENBQUM7SUFFRCxJQUFJLEtBQUs7UUFDTCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7SUFDeEMsQ0FBQztJQUVELElBQUksS0FBSyxDQUFDLEtBQUs7UUFDWCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN6QyxDQUFDO0lBRUQsSUFBSSxJQUFJO1FBQ0osT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxJQUFJLElBQUksQ0FBQyxLQUFjO1FBQ25CLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUN0QyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzlCLENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsMEVBQTBFO0lBRWxFLGdCQUFnQjtRQUNwQixNQUFNLElBQUksR0FBRyxJQUFJLFNBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDN0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQ2xDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFXLENBQUM7UUFDdkQsTUFBYyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDcEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztRQUMvQixNQUFNLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztRQUNsQixNQUFNLENBQUMsVUFBVSxHQUFHLGVBQWUsQ0FBQztRQUNwQyxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksU0FBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDeEMsTUFBTSxDQUFDLFVBQVUsR0FBRyxRQUFHLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQztRQUNuRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxvQkFBbUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFDRCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRU8sdUJBQXVCO1FBQzNCLE1BQU0sSUFBSSxHQUFHLGFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDM0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RCxNQUFNLFNBQVMsR0FBRyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlELElBQUksUUFBUSxLQUFLLENBQUMsSUFBSSxTQUFTLEtBQUssQ0FBQztZQUFFLE9BQU87UUFDOUMsTUFBTSxNQUFNLEdBQUcsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUM3QixNQUFNLGFBQWEsR0FBRyxNQUFNLEdBQUcsU0FBUyxDQUFDO1FBQ3pDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUN0RSxNQUFNLE9BQU8sR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sTUFBTSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNqRyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsSUFBSSxTQUFJLENBQ2pDLENBQUMsR0FBRyxhQUFhLEdBQUcsS0FBSyxFQUN6QixDQUFDLEdBQUcsYUFBYSxHQUFHLE9BQU8sRUFDM0IsYUFBYSxFQUNiLGFBQWEsQ0FDaEIsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0lBRUQsUUFBUTtRQUNKLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFFRCwrRUFBK0U7SUFFL0UsSUFBSTtRQUVBLGtCQUFrQjtRQUNsQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFFN0QseUJBQXlCO1FBQ3pCLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUM7UUFDM0YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQztRQUUzRixjQUFjO1FBQ2QsRUFBRSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDcEQsRUFBRSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFFcEQsTUFBTSxLQUFLLEdBQUksRUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUMvQyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ25DLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUN2QyxDQUFDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEdBQUcsV0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDL0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEdBQUcsV0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFL0Msb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBQSwyQkFBWSxFQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7UUFFaEQsZ0VBQWdFO1FBQ2hFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBRXhCLHFFQUFxRTtRQUNyRSxpRkFBaUY7UUFDakYsSUFBSSxDQUFDO1lBQ0QsbUJBQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFFBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULGtDQUFrQztRQUN0QyxDQUFDO1FBQ0QsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUNoQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxzQkFBc0I7UUFDdEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLHlCQUFjLEVBQUUsQ0FBQztRQUM1QyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTVCLDBCQUEwQjtRQUMxQixJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDNUQsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdEIsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFN0UsNERBQTREO1FBQzVELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxJQUFhLEVBQUUsRUFBRTtZQUM3RCxJQUFJLENBQUM7Z0JBQ0QsbUJBQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUMvQixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDVCx1QkFBdUI7WUFDM0IsQ0FBQztZQUNELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5Qiw2QkFBYSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxtREFBbUQ7UUFDbkQsSUFBSSxDQUFDO1lBQ0EsbUJBQWUsQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7Z0JBQzdFLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsc0JBQXNCO29CQUNwQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5QixDQUFDO3FCQUFNLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsd0JBQXdCO29CQUM3QyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QixDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULHVCQUF1QjtRQUMzQixDQUFDO1FBRUQsc0NBQXNDO1FBQ3RDLDZCQUFhLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDbEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsNkJBQWEsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtZQUNwRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFDSCw2QkFBYSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7WUFDckMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxzRUFBc0U7UUFDdEUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFFekIsMERBQTBEO1FBQzFELDJDQUEyQztRQUMzQyxLQUFLLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUUzQiwrQ0FBK0M7UUFDL0MsSUFBSSxDQUFDO1lBQ0EsbUJBQWUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsVUFBa0IsRUFBRSxFQUFFO2dCQUNuRixJQUFJLENBQUMsb0JBQW9CLEVBQUUseUJBQXlCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULHVCQUF1QjtRQUMzQixDQUFDO0lBQ0wsQ0FBQztJQUVPLGlCQUFpQjtRQUNyQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDO1FBQ3ZELE1BQU0sSUFBSSxHQUFHLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxXQUFXLENBQUMsRUFBRSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlDLFdBQVcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzQyxXQUFXLENBQUMsRUFBRSxDQUFDLDhCQUE4QixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JELFdBQVcsQ0FBQyxFQUFFLENBQUMsOEJBQThCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckQsV0FBVyxDQUFDLEVBQUUsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRU8sS0FBSyxDQUFDLGVBQWU7UUFDekIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN4RSxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNMLG1DQUFtQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxLQUFLLENBQUMsY0FBYztRQUNoQixJQUFJLENBQUM7WUFDRCxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDOUIsTUFBTSxNQUFNLEdBQVEsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1QsSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLFNBQVM7b0JBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUN2RCxJQUFJLE1BQU0sQ0FBQyxRQUFRLEtBQUssU0FBUztvQkFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDeEUsSUFBSSxNQUFNLENBQUMsUUFBUSxLQUFLLFNBQVM7b0JBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUUsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUN6QixJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsS0FBSyxTQUFTO3dCQUFFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUM7b0JBQzlGLElBQUksTUFBTSxDQUFDLFFBQVEsS0FBSyxTQUFTO3dCQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztnQkFDdkUsQ0FBQztnQkFDRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssU0FBUztvQkFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUQsSUFBSSxNQUFNLENBQUMsVUFBVSxLQUFLLFNBQVM7b0JBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzNFLElBQUksTUFBTSxDQUFDLGlCQUFpQixLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUN6QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ3hELENBQUM7cUJBQU0sQ0FBQztvQkFDSixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7Z0JBQ0QsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDeEUsQ0FBQztnQkFDRCxJQUFJLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDeEIsK0NBQXFCLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDOUQsQ0FBQztnQkFDRCxJQUFJLE1BQU0sQ0FBQyxTQUFTLEtBQUssU0FBUztvQkFBRSxXQUFXLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQzdFLElBQUksTUFBTSxDQUFDLFlBQVksS0FBSyxTQUFTO29CQUFFLFdBQVcsQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztnQkFDdEYsSUFBSSxNQUFNLENBQUMsWUFBWSxLQUFLLFNBQVM7b0JBQUUsV0FBVyxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQzFGLENBQUM7UUFDTCxDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ0wsY0FBYztRQUNsQixDQUFDO0lBQ0wsQ0FBQztJQUVELDRDQUE0QztJQUM1QyxLQUFLLENBQUMsVUFBVTtRQUNaLElBQUksQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM5QixNQUFNLE9BQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUF3QixJQUFJLEVBQUUsQ0FBQztZQUNqSCxzRUFBc0U7WUFDdEUsNkVBQTZFO1lBQzdFLHNEQUFzRDtZQUN0RCxnREFBZ0Q7WUFDaEQsTUFBTSxXQUFXLEdBQUc7Z0JBQ2hCLEdBQUcsT0FBTztnQkFDVixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ2YsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtnQkFDekMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDM0IsV0FBVyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ25FLGNBQWMsRUFBRSwrQ0FBcUIsQ0FBQyxpQkFBaUIsRUFBRTthQUM1RCxDQUFDO1lBQ0YsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ0wsbUNBQW1DO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0lBRUQsaUVBQWlFO0lBQ2pFLCtEQUErRDtJQUMvRCx3REFBd0Q7SUFDeEQsdURBQXVEO0lBQy9DLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxNQUFjLEVBQUUsS0FBYztRQUM5RCxJQUFJLENBQUM7WUFDRCxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDOUIsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEtBQUssRUFBRSxDQUFDLFNBQVMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDekYsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNMLG1DQUFtQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztJQUVELCtFQUErRTtJQUUvRSxVQUFVLENBQUMsSUFBWTtRQUNuQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBQ2xDLENBQUM7SUFFRCxhQUFhLENBQUMsS0FBeUI7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDOUMsQ0FBQztJQUVELFFBQVEsQ0FBQyxLQUF5QjtRQUM5QixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN6QyxDQUFDO0lBRUQsYUFBYSxDQUFDLE1BQWU7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7SUFDN0MsQ0FBQztJQUVELGlCQUFpQjtRQUNiLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztJQUMzQyxDQUFDO0lBRUQsMkVBQTJFO0lBRTNFLHNCQUFzQjtRQUNsQixPQUFPLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztJQUN6QyxDQUFDO0lBRUQsb0JBQW9CLENBQUMsS0FBYztRQUMvQixXQUFXLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQztnQkFDRCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pDLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1AsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBb0IsRUFBRSxFQUFFO3dCQUM3QyxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3ZELElBQUksS0FBSyxFQUFFLENBQUM7NEJBQ1IsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dDQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7NEJBQ2xELENBQUM7NEJBQ0QsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDOzRCQUNyQyxJQUFJLE9BQU87Z0NBQ1AsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDOztnQ0FFYixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ3JCLENBQUM7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNULGtCQUFrQjtZQUN0QixDQUFDO1FBQ0wsQ0FBQztRQUNELG1CQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBQztRQUN0QyxLQUFLLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRSxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUN4RixDQUFDO0lBRUQsYUFBYTtRQUNULE9BQU8sV0FBVyxDQUFDLGFBQWEsQ0FBQztJQUNyQyxDQUFDO0lBRUQsY0FBYyxDQUFDLEtBQWM7UUFDekIsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTO1lBQUUsT0FBTztRQUNsRCxXQUFXLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUNsQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7WUFDN0MsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELElBQUksU0FBUyxJQUFLLFNBQWlCLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ2hELFNBQWlCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILG1CQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBQztRQUN0QyxLQUFLLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFRCxrQkFBa0I7UUFDZCxPQUFPLFdBQVcsQ0FBQyxhQUFhLENBQUM7SUFDckMsQ0FBQztJQUVELGdCQUFnQixDQUFDLElBQVk7UUFDekIsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxTQUFTO1lBQUUsT0FBTztRQUNoRCxXQUFXLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7WUFDN0MsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELElBQUksU0FBUyxJQUFLLFNBQWlCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDbEQsU0FBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxtQkFBTyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUM7UUFDdEMsS0FBSyxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRUQsY0FBYztRQUNWLE9BQU8sV0FBVyxDQUFDLFNBQVMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsWUFBWSxDQUFDLEtBQWU7UUFDeEIsSUFBSSxDQUFDLEtBQUs7WUFBRSxPQUFPO1FBQ25CLFdBQVcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO1FBQ25DLG1CQUFPLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3QyxLQUFLLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVELGlCQUFpQjtRQUNiLE9BQU8sV0FBVyxDQUFDLFlBQVksQ0FBQztJQUNwQyxDQUFDO0lBRUQsZUFBZSxDQUFDLE1BQXlCO1FBQ3JDLElBQUksQ0FBQyxNQUFNO1lBQUUsT0FBTztRQUNwQixXQUFXLENBQUMsWUFBWSxHQUFHLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUN6QyxtQkFBTyxDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQyxLQUFLLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLEVBQUUsRUFBRSxHQUFHLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ3JGLENBQUM7SUFFRCxpQkFBaUI7UUFDYixPQUFPLFdBQVcsQ0FBQyxZQUFZLENBQUM7SUFDcEMsQ0FBQztJQUVELGVBQWUsQ0FBQyxNQUF5QjtRQUNyQyxJQUFJLENBQUMsTUFBTTtZQUFFLE9BQU87UUFDcEIsV0FBVyxDQUFDLFlBQVksR0FBRyxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUM7UUFDekMsbUJBQU8sQ0FBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUMsS0FBSyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxFQUFFLEVBQUUsR0FBRyxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBRUQsY0FBYyxDQUFDLE9BQWdCO1FBQzNCLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDO1FBQzVCLGdEQUFnRDtRQUNoRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7WUFDN0MsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELElBQUksU0FBUyxJQUFLLFNBQWlCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDckQsU0FBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsdURBQXVEO0lBQy9DLGtCQUFrQixDQUFDLFFBQW1DO1FBQzFELE1BQU0sS0FBSyxHQUFJLEVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDL0MsSUFBSSxDQUFDLEtBQUs7WUFBRSxPQUFPO1FBQ25CLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTyxhQUFhLENBQUMsSUFBVSxFQUFFLFFBQW1DO1FBQ2pFLElBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQztZQUFFLE9BQU87UUFDeEMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDL0IsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVELDJFQUEyRTtJQUUzRSx5QkFBeUI7UUFDckIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLENBQUM7SUFDbEUsQ0FBQztJQUVELHVCQUF1QixDQUFDLElBQVksRUFBRSxLQUFVO1FBQzNDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUM5RCxDQUFDO0lBRUQsbUJBQW1CO1FBQ2YsT0FBTywrQ0FBcUIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0lBQ3JELENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxNQUFvQztRQUNsRCwrQ0FBcUIsQ0FBQyxZQUFZLENBQUM7WUFDL0IsR0FBRywrQ0FBcUIsQ0FBQyxpQkFBaUIsRUFBRTtZQUM1QyxHQUFHLE1BQU07U0FDWixDQUFDLENBQUM7UUFDSCxtQkFBTyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUM7UUFDdEMsS0FBSyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVELDRFQUE0RTtJQUVwRSxRQUFRLENBQUMsSUFBZ0I7UUFDN0IsUUFBUSxJQUFJLEVBQUUsQ0FBQztZQUNYLEtBQUssV0FBVyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQzdDLEtBQUssTUFBTSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ25DLEtBQUssWUFBWSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQ25ELENBQUM7SUFDTCxDQUFDO0lBRUQsMkNBQTJDO0lBQ25DLGFBQWEsQ0FBQyxLQUFnQjtRQUNsQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLE1BQU0sS0FBSyxHQUFpQixDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDaEUsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQ3JCLGdCQUFnQixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFDRCxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUN4QixDQUFDO0lBRU8sWUFBWSxDQUFDLElBQWdCLEVBQUUsSUFBWTtRQUMvQyxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2IsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCx1REFBdUQ7UUFDdkQsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ2pFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFJLENBQUMsU0FBUztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRTVCLHdCQUF3QjtRQUN4QixLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztRQUNMLENBQUM7UUFFRCxhQUFhO1FBQ2IsTUFBTSxLQUFLLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsMkNBQTJDO0lBQ25DLGFBQWEsQ0FBQyxLQUFnQjtRQUNsQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQixNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDMUUsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUN2QixLQUFLLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUMvQixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNmLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBRUQsbUJBQW1CLENBQUMsSUFBZ0IsRUFBRSxJQUFZLEVBQUUsTUFBa0M7UUFDbEYsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxTQUFTO1lBQUUsT0FBTztRQUN2QixTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFTyxVQUFVLENBQUMsSUFBZ0IsRUFBRSxTQUFvQixFQUFFLFdBQVcsR0FBRyxLQUFLO1FBQzFFLElBQUksQ0FBQyxTQUFTO1lBQUUsT0FBTztRQUN2QixJQUFJLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUMsa0RBQWtEO1FBQ2xELElBQUksQ0FBQyxLQUFLLElBQUksV0FBVyxFQUFFLENBQUM7WUFDeEIsTUFBTSxJQUFJLEdBQUcsT0FBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4QyxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLEtBQUs7Z0JBQUUsT0FBTztZQUNuQixnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDRCxJQUFJLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztZQUNsQixJQUFLLEtBQWEsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUNwQyxLQUFhLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDTCxDQUFDO2FBQU0sQ0FBQztZQUNKLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNqQixDQUFDO0lBQ0wsQ0FBQztJQUVPLFVBQVUsQ0FBQyxLQUFnQjtRQUMvQixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVPLFlBQVksQ0FBQyxJQUFnQixFQUFFLFNBQW9CO1FBQ3ZELE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNoRCxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QixnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVDLENBQUM7SUFDTCxDQUFDO0lBRUQsK0VBQStFO0lBRS9FLHFEQUFxRDtJQUNyRCxlQUFlLENBQUMsSUFBZ0IsRUFBRSxJQUFVO1FBQ3hDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQjtZQUFFLE9BQU87UUFDN0QsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBb0IsRUFBRSxFQUFFO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCO2dCQUFFLE9BQU87WUFDMUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsa0JBQWtCLENBQUMsSUFBVSxFQUFFLFNBQVMsR0FBRyxLQUFLO1FBQzVDLElBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQztZQUFFLE9BQU87UUFDeEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCO1lBQUUsT0FBTztRQUNwRCxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFvQixFQUFFLEVBQUU7WUFDN0MsSUFBSSxTQUFTLENBQUMsa0JBQWtCLEtBQUssS0FBSztnQkFBRSxPQUFPO1lBQ25ELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztJQUVELHVEQUF1RDtJQUN2RCxpQkFBaUIsQ0FBQyxJQUFnQixFQUFFLElBQVU7UUFDMUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBb0IsRUFBRSxFQUFFO1lBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELG9CQUFvQixDQUFDLElBQVUsRUFBRSxTQUFTLEdBQUcsS0FBSztRQUM5QyxJQUFJLENBQUMsSUFBSTtZQUFFLE9BQU87UUFDbEIsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBb0IsRUFBRSxFQUFFO1lBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxjQUFjO1FBQ1YsTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzFFLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7WUFDdkIsS0FBSyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDL0IsS0FBSyxNQUFNLEtBQUssSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDMUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixDQUFDO1lBQ0wsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixDQUFDO0lBQ0wsQ0FBQztJQUVELHNCQUFzQixDQUFDLElBQVUsRUFBRSxRQUFnQixFQUFFLEdBQUcsTUFBYTtRQUNqRSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDcEIsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPLElBQUksQ0FBQztRQUN2QixpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFvQixFQUFFLEVBQUU7WUFDN0MsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzNELElBQUksU0FBUyxJQUFJLFNBQVMsSUFBSyxTQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pELE1BQU0sR0FBRyxHQUFJLFNBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxHQUFHLEtBQUssS0FBSztvQkFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3RDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxPQUFPLENBQUM7SUFDcEIsQ0FBQztJQUVELG9GQUFvRjtJQUNwRixpQkFBaUIsQ0FBQyxTQUFvQjtRQUNsQyxPQUFPLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDNUQsQ0FBQztJQUVELDJFQUEyRTtJQUUzRSxnQkFBZ0I7UUFDWixPQUFPLElBQUksQ0FBQyxVQUFVO2FBQ2pCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2xDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBZ0IsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsV0FBVyxDQUFDLElBQVk7UUFDcEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsaUJBQWlCLENBQUMsSUFBWTtRQUMxQixNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPO1FBQ2xCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFBRSxPQUFPO1FBQzNDLElBQUksQ0FBQztZQUNELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1Qsa0JBQWtCO1FBQ3RCLENBQUM7UUFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsbUJBQW1CLENBQUMsSUFBWTtRQUM1QixNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPO1FBQ2xCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUM7WUFDRCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDUCxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULGtCQUFrQjtRQUN0QixDQUFDO1FBQ0QsbUJBQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFDO0lBQzFDLENBQUM7SUFFRCxnQkFBZ0I7UUFDWixNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUMzQixLQUFLLE1BQU0sSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQztnQkFDRCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pDLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1AsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDMUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNULGtCQUFrQjtZQUN0QixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFRCx3REFBd0Q7SUFDaEQsdUJBQXVCLENBQUMsSUFBVSxFQUFFLFFBQWlCO1FBQ3pELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTTtZQUFFLE9BQU87UUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUI7WUFBRSxPQUFPO1FBQ3BDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLFNBQW9CLEVBQUUsRUFBRTtZQUM3QyxNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEQsSUFBSSxTQUFTLElBQUssU0FBaUIsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUN4RCxTQUFpQixDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyx5QkFBeUI7UUFDN0IsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxtQkFBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLG1CQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7UUFDN0IsS0FBSyxNQUFNLElBQUksSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLFNBQVM7WUFDYixDQUFDO1lBQ0QsbUJBQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsQ0FBQztJQUNMLENBQUM7SUFFRCw4REFBOEQ7SUFFOUQscUJBQXFCO1FBQ2pCLE1BQU0sYUFBYSxHQUFHLG1CQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDO1FBQ3pELElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN0QixLQUFLLE1BQU0sSUFBSSxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQy9CLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNQLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pCLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDckIsQ0FBQztRQUNMLENBQUM7UUFDRCxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ1osbUJBQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFDO1FBQzFDLENBQUM7SUFDTCxDQUFDO0lBRUQsY0FBYztRQUNWLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDN0IsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3RCLDJEQUEyRDtRQUMzRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDO1FBQ3BDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQy9CLHlDQUF5QztRQUN6QyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUNqQyxrREFBa0Q7UUFDbEQsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUNaLHVEQUF1RDtZQUN2RCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQztZQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDdEMsQ0FBQztZQUNELElBQUksQ0FBQyxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxDQUFDO1lBQ2pELG1CQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBQztRQUMxQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQsY0FBYztRQUNWLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsYUFBYSxDQUFDLElBQVUsRUFBRSxJQUF5QjtRQUMvQyxJQUFJLENBQUMsSUFBSTtZQUFFLE9BQU87UUFDbEIscUNBQXFDO1FBQ3JDLDZDQUE2QztRQUM3QyxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssc0JBQWEsQ0FBQyxtQkFBbUIsSUFBSSxJQUFJLEVBQUUsSUFBSSxLQUFLLHNCQUFhLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUM5RyxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhELGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLFNBQW9CLEVBQUUsRUFBRTtZQUM3QyxNQUFNLFVBQVUsR0FBRyxTQUFTLFlBQVksc0JBQXNCO2dCQUN6RCxTQUFpQixDQUFDLGFBQWEsS0FBSyxnQ0FBZ0MsQ0FBQztZQUMxRSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN0RSxJQUFJLEdBQUc7b0JBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ25ELElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDM0MsT0FBTztZQUNYLENBQUM7WUFFRCxJQUFJLEtBQW1DLENBQUM7WUFFeEMsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDTixLQUFLLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNSLElBQUssS0FBYSxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQzt3QkFDdEQsS0FBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdkMsQ0FBQztnQkFDTCxDQUFDO3FCQUFNLENBQUM7b0JBQ0osSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDTCxDQUFDO1lBRUQsS0FBSyxHQUFHLGdCQUFnQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNsRCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNSLElBQUssS0FBYSxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztvQkFDdEQsS0FBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztZQUNMLENBQUM7aUJBQU0sQ0FBQztnQkFDSixJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsS0FBSyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1QyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNSLElBQUssS0FBYSxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztvQkFDdEQsS0FBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztZQUNMLENBQUM7aUJBQU0sQ0FBQztnQkFDSixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssc0JBQWEsQ0FBQyxhQUFhO2VBQ3ZDLElBQUksRUFBRSxJQUFJLEtBQUssc0JBQWEsQ0FBQyxtQkFBbUI7ZUFDaEQsSUFBSSxFQUFFLElBQUksS0FBSyxzQkFBYSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDN0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsbUJBQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFDO0lBQzFDLENBQUM7SUFFRDs7O09BR0c7SUFDSyx3QkFBd0I7UUFDNUIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDakMsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxJQUFJO2dCQUFFLFNBQVM7WUFDcEIsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBb0IsRUFBRSxFQUFFO2dCQUM3QyxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3ZELElBQUksS0FBSyxJQUFLLEtBQWEsQ0FBQyxtQkFBbUIsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztvQkFDckUsS0FBYSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3pDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBRU8sc0JBQXNCLEdBQUcsS0FBSyxDQUFDO0lBRXZDOzs7T0FHRztJQUNLLDhCQUE4QjtRQUNsQyxJQUFJLElBQUksQ0FBQyxzQkFBc0I7WUFBRSxPQUFPO1FBQ3hDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDbkMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDeEIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztZQUNwQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxJQUFlO1FBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPO1FBQ2xCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDTCxDQUFDO0lBRUQsa0JBQWtCLENBQUMsSUFBZTtRQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0QyxNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEQsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0IsQ0FBQztJQUNMLENBQUM7SUFFRCxXQUFXLENBQUMsSUFBVTtRQUNsQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGFBQWEsQ0FBQyxJQUFVO1FBQ3BCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxrQkFBa0IsQ0FBQyxLQUFjO1FBQzdCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRU8sdUJBQXVCO1FBQzNCLE1BQU0sS0FBSyxHQUFJLEVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDL0MsSUFBSSxDQUFDLEtBQUs7WUFBRSxPQUFPO1FBQ25CLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRU8sa0JBQWtCLENBQUMsSUFBVTtRQUNqQyxJQUFJLENBQUMsSUFBSSxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFBRSxPQUFPO1FBQ3hDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDbkMsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0IsTUFBTSxTQUFTLEdBQUcsT0FBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEMsSUFBSSx1QkFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7Z0JBQ0QsSUFBSSx1QkFBWSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDOUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDL0IsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFRCwwRUFBMEU7SUFFMUUsbUJBQW1CLENBQUMsSUFBWSxFQUFFLEtBQWEsRUFBRSxHQUFXLEVBQUUsTUFBYztRQUN4RSxNQUFNLFVBQVUsR0FBSSxtQkFBTyxDQUFDLE1BQWMsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDO1FBQzFELElBQUksQ0FBQyxVQUFVO1lBQUUsT0FBTztRQUV4QixNQUFNLElBQUksR0FBRyxJQUFJLFNBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sSUFBSSxHQUFHLElBQUksU0FBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDMUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxTQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLElBQUksR0FBRyxJQUFJLFNBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sRUFBRSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7UUFDdEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxTQUFJLEVBQUUsQ0FBQztRQUN0QixNQUFNLEVBQUUsR0FBRyxJQUFJLFNBQUksRUFBRSxDQUFDO1FBQ3RCLE1BQU0sRUFBRSxHQUFHLElBQUksU0FBSSxFQUFFLENBQUM7UUFDdEIsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFbkMsTUFBTSxnQkFBZ0IsR0FBSSxtQkFBTyxDQUFDLE1BQWMsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLENBQUM7UUFDMUUsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ25CLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksVUFBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUNELG1CQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQsbUJBQW1CO1FBQ2QsbUJBQU8sQ0FBQyxNQUFjLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4RSxtQkFBTyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUVELGtEQUFrRDtJQUNsRCxnQkFBZ0IsQ0FBQyxJQUFZLEVBQUUsUUFBZ0IsRUFBRSxTQUFnQixFQUFFO1FBQy9ELE1BQU0sT0FBTyxHQUFJLHVCQUFvQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDakMsT0FBTztRQUNYLENBQUM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCx1QkFBdUIsQ0FBQyxJQUFZO1FBQy9CLHlCQUFzQixDQUFDLHNCQUFzQixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELCtFQUErRTtJQUUvRSxRQUFRLENBQUMsU0FBaUI7UUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDO2dCQUNELE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakMsSUFBSSxDQUFDLElBQUk7b0JBQUUsU0FBUztnQkFDcEIsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBb0IsRUFBRSxFQUFFO29CQUM3QyxNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBQzNELElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO3dCQUN4QyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNoQyxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1Qsa0JBQWtCO1lBQ3RCLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUE7QUFuZ0NZLG9DQUFZO3VCQUFaLFlBQVk7SUFEeEIsSUFBQSxvQkFBUSxFQUFDLE9BQU8sQ0FBQztHQUNMLFlBQVksQ0FtZ0N4QiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQ2FtZXJhLCBDb2xvciwgQ29tcG9uZW50LCBnZngsIGpzLCBMYXllcnMsIE5vZGUsIFJlY3QsIFRlcnJhaW4sIFZlYzMsIGRpcmVjdG9yIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgQmFzZVNlcnZpY2UgfSBmcm9tICcuL2NvcmUnO1xuaW1wb3J0IHsgcmVnaXN0ZXIsIFNlcnZpY2UgfSBmcm9tICcuL2NvcmUvZGVjb3JhdG9yJztcbmltcG9ydCB7IFNlcnZpY2VFdmVudHMgfSBmcm9tICcuL2NvcmUvZ2xvYmFsLWV2ZW50cyc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Ub29sRGF0YSwgSVNuYXBDb25maWdEYXRhIH0gZnJvbSAnLi9naXptby90cmFuc2Zvcm0tdG9vbCc7XG5pbXBvcnQgR2l6bW9EZWZpbmVzIGZyb20gJy4vZ2l6bW8vZ2l6bW8tZGVmaW5lcyc7XG5pbXBvcnQgR2l6bW9CYXNlIGZyb20gJy4vZ2l6bW8vYmFzZS9naXptby1iYXNlJztcbmltcG9ydCBHaXptb09wZXJhdGlvbiBmcm9tICcuL2dpem1vL2dpem1vLW9wZXJhdGlvbic7XG5pbXBvcnQgeyBnZXRFZGl0b3JOb2RlQnlQYXRoLCBnZXRFZGl0b3JOb2RlQnlVdWlkLCBnZXRFZGl0b3JOb2RlUGF0aCB9IGZyb20gJy4vZ2l6bW8vdXRpbHMvZWRpdG9yLW5vZGUnO1xuaW1wb3J0IHsgY3JlYXRlM0ROb2RlIH0gZnJvbSAnLi9naXptby91dGlscy9lbmdpbmUtdXRpbHMnO1xuaW1wb3J0IHsgcmVjdFRyYW5zZm9ybVNuYXBwaW5nIH0gZnJvbSAnLi9naXptby91dGlscy9yZWN0LXRyYW5zZm9ybS1zbmFwcGluZyc7XG5pbXBvcnQgV29ybGRBeGlzQ29udHJvbGxlciBmcm9tICcuL2dpem1vL2NvbnRyb2xsZXIvd29ybGQtYXhpcyc7XG5pbXBvcnQgeyBOb2RlRXZlbnRUeXBlIH0gZnJvbSAnLi4vLi4vY29tbW9uJztcbmltcG9ydCB7IFJwYyB9IGZyb20gJy4uL3JwYyc7XG5pbXBvcnQgdHlwZSB7IElHaXptb0V2ZW50cywgSUdpem1vU2VydmljZSwgSUNoYW5nZU5vZGVPcHRpb25zLCBJUmVjdFNuYXBDb25maWdEYXRhIH0gZnJvbSAnLi4vLi4vY29tbW9uJztcbmltcG9ydCB0eXBlIHsgSU9yaWdpbkF4ZXNDb25maWcgfSBmcm9tICcuLi8uLi9zY2VuZS1jb25maWdzJztcblxuLy8gSW1wb3J0IGNvbXBvbmVudCBnaXptbyBtb2R1bGVzIHNvIHRoZXkgc2VsZi1yZWdpc3RlciB2aWEgcmVnaXN0ZXJHaXptbygpXG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9jYW1lcmEnO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvYm94LWNvbGxpZGVyJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL2RpcmVjdGlvbmFsLWxpZ2h0JztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL2NhbnZhcyc7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy91aS10cmFuc2Zvcm0nO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvc3BoZXJlLWxpZ2h0JztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL3Nwb3QtbGlnaHQnO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvc3BoZXJlLWNvbGxpZGVyJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL2NhcHN1bGUtY29sbGlkZXInO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvY29uZS1jb2xsaWRlcic7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9jeWxpbmRlci1jb2xsaWRlcic7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9wbGFuZS1jb2xsaWRlcic7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9zaW1wbGV4LWNvbGxpZGVyJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL21lc2gtY29sbGlkZXInO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvYm94LWNvbGxpZGVyLTJkJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL2NpcmNsZS1jb2xsaWRlci0yZCc7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9wb2x5Z29uLWNvbGxpZGVyLTJkJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL2Rpc3RhbmNlLWpvaW50LTJkJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL3NwcmluZy1qb2ludC0yZCc7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9oaW5nZS1qb2ludC0yZCc7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9maXhlZC1qb2ludC0yZCc7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9yZWxhdGl2ZS1qb2ludC0yZCc7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9zbGlkZXItam9pbnQtMmQnO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvd2hlZWwtam9pbnQtMmQnO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvbWVzaC1yZW5kZXJlcic7XG5pbXBvcnQgJy4vZ2l6bW8vY29tcG9uZW50cy9za2lubmVkLW1lc2gtcmVuZGVyZXInO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvdmlkZW8tcGxheWVyJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL3dlYi12aWV3JztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL2xpZ2h0LXByb2JlLWdyb3VwJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL3JlZmxlY3Rpb24tcHJvYmUnO1xuaW1wb3J0ICcuL2dpem1vL2NvbXBvbmVudHMvbG9kLWdyb3VwJztcbmltcG9ydCAnLi9naXptby9jb21wb25lbnRzL3BhcnRpY2xlLXN5c3RlbSc7XG4vLyBBdm9pZCBicm93c2VyLXJ1bnRpbWUgcmVxdWlyZSgnY2MnKSB3aGlsZSBrZWVwaW5nIGxpZ2h0d2VpZ2h0IGNjIG1vY2tzIGZyb20gbG9hZGluZyBUZXJyYWluIGRlcGVuZGVuY2llcy5cbmlmIChUZXJyYWluKSB7XG4gICAgcmVxdWlyZSgnLi9naXptby9jb21wb25lbnRzL3RlcnJhaW4nKTtcbn1cblxudHlwZSBUR2l6bW9UeXBlID0gJ2ljb24nIHwgJ3BlcnNpc3RlbnQnIHwgJ2NvbXBvbmVudCc7XG5cbi8vIOS4jiBjb2Nvcy1lZGl0b3IgR2l6bW9Db25maWcg5LiA6Ie077yaR2l6bW8g5YWo5bGA5pi+56S66YWN572uXG5jbGFzcyBHaXptb0NvbmZpZyB7XG4gICAgc3RhdGljIHRvb2xzVmlzaWJpbGl0eTNkID0gdHJ1ZTtcbiAgICBzdGF0aWMgaXNJY29uR2l6bW8zRCA9IGZhbHNlO1xuICAgIHN0YXRpYyBpY29uR2l6bW9TaXplID0gMjtcbiAgICBzdGF0aWMgZ3JpZENvbG9yOiBudW1iZXJbXSA9IFsxNjYsIDE2NiwgMTY2LCAyNTVdO1xuICAgIHN0YXRpYyBvcmlnaW5BeGlzMkQ6IElPcmlnaW5BeGVzQ29uZmlnID0geyB4OiB0cnVlLCB5OiB0cnVlLCB6OiBmYWxzZSB9O1xuICAgIHN0YXRpYyBvcmlnaW5BeGlzM0Q6IElPcmlnaW5BeGVzQ29uZmlnID0geyB4OiB0cnVlLCB5OiBmYWxzZSwgejogdHJ1ZSB9O1xufVxuXG4vLyBXZWFrTWFwcyB0byBhc3NvY2lhdGUgY29tcG9uZW50cyB3aXRoIHRoZWlyIGdpem1vIGluc3RhbmNlc1xuY29uc3QgX2NvbXBvbmVudEdpem1vTWFwID0gbmV3IFdlYWtNYXA8Q29tcG9uZW50LCBHaXptb0Jhc2UgfCBudWxsPigpO1xuY29uc3QgX2ljb25HaXptb01hcCA9IG5ldyBXZWFrTWFwPENvbXBvbmVudCwgR2l6bW9CYXNlIHwgbnVsbD4oKTtcbmNvbnN0IF9wZXJzaXN0ZW50R2l6bW9NYXAgPSBuZXcgV2Vha01hcDxDb21wb25lbnQsIEdpem1vQmFzZSB8IG51bGw+KCk7XG5cbmZ1bmN0aW9uIGdldEdpem1vTWFwKHR5cGU6IFRHaXptb1R5cGUpOiBXZWFrTWFwPENvbXBvbmVudCwgR2l6bW9CYXNlIHwgbnVsbD4ge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdjb21wb25lbnQnOiByZXR1cm4gX2NvbXBvbmVudEdpem1vTWFwO1xuICAgICAgICBjYXNlICdpY29uJzogcmV0dXJuIF9pY29uR2l6bW9NYXA7XG4gICAgICAgIGNhc2UgJ3BlcnNpc3RlbnQnOiByZXR1cm4gX3BlcnNpc3RlbnRHaXptb01hcDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldEdpem1vUHJvcGVydHkodHlwZTogVEdpem1vVHlwZSwgY29tcDogQ29tcG9uZW50KTogR2l6bW9CYXNlIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGdldEdpem1vTWFwKHR5cGUpLmdldChjb21wKTtcbn1cblxuLy8g5LiOIGNvY29zLWVkaXRvciBkYXRhLnRzIHNldEdpem1vUHJvcGVydHkg5LiA6Ie077ya5pu/5o2i5pe25riF6Zmk5penIGdpem1vIOeahCB0YXJnZXRcbmZ1bmN0aW9uIHNldEdpem1vUHJvcGVydHkodHlwZTogVEdpem1vVHlwZSwgY29tcDogQ29tcG9uZW50LCBnaXptbzogR2l6bW9CYXNlIHwgbnVsbCkge1xuICAgIGNvbnN0IG9sZEdpem1vID0gZ2V0R2l6bW9NYXAodHlwZSkuZ2V0KGNvbXApO1xuICAgIGlmIChvbGRHaXptbykge1xuICAgICAgICBvbGRHaXptby50YXJnZXQgPSBudWxsO1xuICAgIH1cbiAgICBnZXRHaXptb01hcCh0eXBlKS5zZXQoY29tcCwgZ2l6bW8pO1xuICAgIGlmIChnaXptbykge1xuICAgICAgICBnaXptby50YXJnZXQgPSBjb21wO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0R2l6bW9EZWZNYXAodHlwZTogVEdpem1vVHlwZSk6IE1hcDxzdHJpbmcsIGFueT4ge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdjb21wb25lbnQnOiByZXR1cm4gR2l6bW9EZWZpbmVzLmNvbXBvbmVudHM7XG4gICAgICAgIGNhc2UgJ2ljb24nOiByZXR1cm4gR2l6bW9EZWZpbmVzLmljb25HaXptbztcbiAgICAgICAgY2FzZSAncGVyc2lzdGVudCc6IHJldHVybiBHaXptb0RlZmluZXMucGVyc2lzdGVudEdpem1vO1xuICAgIH1cbn1cblxuLy8gSGFjayBjb21wb25lbnQgZm9yIHRyYW5zZm9ybSBnaXptbyDigJQgbmVlZHMgYSByZWFsIGNsYXNzIHNvXG4vLyBqcy5nZXRDbGFzc05hbWUgcmV0dXJucyAnX0VkaXRvckhhY2tUcmFuc2Zvcm1Db21wb25lbnRfJyB0byBtYXRjaCBHaXptb0RlZmluZXNcbmNsYXNzIEhhY2tUcmFuc2Zvcm1Db21wb25lbnQge1xuICAgIG5vZGU6IE5vZGU7XG4gICAgZ2V0IGVuYWJsZWRJbkhpZXJhcmNoeSgpIHsgcmV0dXJuIHRydWU7IH1cbiAgICBjb25zdHJ1Y3Rvcihub2RlOiBOb2RlKSB7IHRoaXMubm9kZSA9IG5vZGU7IH1cbn1cbihIYWNrVHJhbnNmb3JtQ29tcG9uZW50LnByb3RvdHlwZSBhcyBhbnkpLl9fY2xhc3NuYW1lX18gPSAnX0VkaXRvckhhY2tUcmFuc2Zvcm1Db21wb25lbnRfJztcblxuY29uc3QgX3RyYW5zZm9ybUNvbXBNYXAgPSBuZXcgV2Vha01hcDxOb2RlLCBDb21wb25lbnQ+KCk7XG5cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybUhhY2tDb21wKG5vZGU6IE5vZGUpOiBDb21wb25lbnQge1xuICAgIGxldCBjb21wOiBDb21wb25lbnQgfCB1bmRlZmluZWQgPSBfdHJhbnNmb3JtQ29tcE1hcC5nZXQobm9kZSk7XG4gICAgaWYgKCFjb21wKSB7XG4gICAgICAgIGNvbXAgPSBuZXcgSGFja1RyYW5zZm9ybUNvbXBvbmVudChub2RlKSBhcyBhbnkgYXMgQ29tcG9uZW50O1xuICAgICAgICBfdHJhbnNmb3JtQ29tcE1hcC5zZXQobm9kZSwgY29tcCk7XG4gICAgfVxuICAgIHJldHVybiBjb21wO1xufVxuXG5mdW5jdGlvbiBpc0VkaXRvck5vZGUobm9kZTogTm9kZSk6IGJvb2xlYW4ge1xuICAgIGlmIChub2RlLmxheWVyICYgTGF5ZXJzLkVudW0uR0laTU9TKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAobm9kZS5sYXllciAmIExheWVycy5FbnVtLlNDRU5FX0dJWk1PKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAobm9kZS5sYXllciAmIExheWVycy5FbnVtLkVESVRPUikgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiB3YWxrTm9kZUNvbXBvbmVudChub2RlOiBOb2RlLCBjYWxsYmFjazogKGNvbXA6IENvbXBvbmVudCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlmICghbm9kZSB8fCBpc0VkaXRvck5vZGUobm9kZSkpIHJldHVybjtcbiAgICAvLyBUcmFuc2Zvcm0gaGFjayBjb21wb25lbnRcbiAgICBjb25zdCBoYWNrQ29tcCA9IGdldFRyYW5zZm9ybUhhY2tDb21wKG5vZGUpO1xuICAgIGNhbGxiYWNrKGhhY2tDb21wKTtcbiAgICAvLyBSZWFsIGNvbXBvbmVudHNcbiAgICBjb25zdCBjb21wb25lbnRzID0gbm9kZS5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2FsbGJhY2soY29tcG9uZW50c1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVCeVBhdGgocGF0aDogc3RyaW5nKTogTm9kZSB8IG51bGwge1xuICAgIHJldHVybiBnZXRFZGl0b3JOb2RlQnlQYXRoKHBhdGgpO1xufVxuXG5mdW5jdGlvbiBnZXROb2RlQnlVdWlkKHV1aWQ6IHN0cmluZyk6IE5vZGUgfCBudWxsIHtcbiAgICByZXR1cm4gZ2V0RWRpdG9yTm9kZUJ5VXVpZCh1dWlkKTtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZVBhdGgobm9kZTogTm9kZSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGdldEVkaXRvck5vZGVQYXRoKG5vZGUpO1xufVxuY29uc3QgU2NlbmVHaXptb0xheWVyID0gTGF5ZXJzLkVudW0uU0NFTkVfR0laTU87XG5cbkByZWdpc3RlcignR2l6bW8nKVxuZXhwb3J0IGNsYXNzIEdpem1vU2VydmljZSBleHRlbmRzIEJhc2VTZXJ2aWNlPElHaXptb0V2ZW50cz4gaW1wbGVtZW50cyBJR2l6bW9TZXJ2aWNlIHtcbiAgICBnaXptb1Jvb3ROb2RlITogTm9kZTtcbiAgICBmb3JlZ3JvdW5kTm9kZSE6IE5vZGU7XG4gICAgYmFja2dyb3VuZE5vZGUhOiBOb2RlO1xuICAgIHRyYW5zZm9ybVRvb2xEYXRhID0gbmV3IFRyYW5zZm9ybVRvb2xEYXRhKCk7XG5cbiAgICAvLyDkuI4gY29jb3MtZWRpdG9yIEdpem1vTWFuYWdlciDkuIDoh7TvvJrlnLrmma8gR2l6bW8g55u45py6ICsgV29ybGRBeGlzIOaOp+WItuWZqFxuICAgIHNjZW5lR2l6bW9DYW1lcmEhOiBDYW1lcmE7XG4gICAgcHJpdmF0ZSBfd29ybGRBeGlzQ29udHJvbGxlcjogV29ybGRBeGlzQ29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJpdmF0ZSBfZ2l6bW9PcGVyYXRpb24hOiBHaXptb09wZXJhdGlvbjtcbiAgICBwcml2YXRlIF9pY29uVmlzaWJsZSA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3NlbGVjdGlvbjogc3RyaW5nW10gPSBbXTtcbiAgICBwcml2YXRlIF9oYXNFZGl0b3JPcGVuZWQgPSBmYWxzZTtcblxuICAgIC8vIFBvb2w6IE1hcDxjbGFzc05hbWUsIEdpem1vQmFzZVtdPiDigJQg5LiOIGNvY29zLWVkaXRvciBHaXptb1Bvb2wg5LiA6Ie0XG4gICAgcHJpdmF0ZSBfY29tcG9uZW50UG9vbDogTWFwPHN0cmluZywgR2l6bW9CYXNlW10+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgX2ljb25Qb29sOiBNYXA8c3RyaW5nLCBHaXptb0Jhc2VbXT4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSBfcGVyc2lzdGVudFBvb2w6IE1hcDxzdHJpbmcsIEdpem1vQmFzZVtdPiA9IG5ldyBNYXAoKTtcblxuICAgIC8vIOKUgOKUgCBUcmFuc2Zvcm0gdG9vbCBhY2Nlc3NvcnMgKOS4jiBjb2Nvcy1lZGl0b3IgVHJhbnNmb3JtR2l6bW9NYW5hZ2VyIOS4gOiHtCkg4pSA4pSAXG5cbiAgICBnZXQgdHJhbnNmb3JtVG9vbE5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtVG9vbERhdGEudG9vbE5hbWU7XG4gICAgfVxuXG4gICAgc2V0IHRyYW5zZm9ybVRvb2xOYW1lKHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1Ub29sRGF0YS50b29sTmFtZSA9IHZhbHVlIGFzIGFueTtcbiAgICB9XG5cbiAgICBnZXQgaXNWaWV3TW9kZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtVG9vbERhdGEudG9vbE5hbWUgPT09ICd2aWV3JyAmJlxuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1Ub29sRGF0YS52aWV3TW9kZSA9PT0gJ3ZpZXcnO1xuICAgIH1cblxuICAgIGdldCB2aWV3TW9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtVG9vbERhdGEudmlld01vZGU7XG4gICAgfVxuXG4gICAgc2V0IHZpZXdNb2RlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtVG9vbERhdGEudmlld01vZGUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgY29vcmRpbmF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtVG9vbERhdGEuY29vcmRpbmF0ZTtcbiAgICB9XG5cbiAgICBzZXQgY29vcmRpbmF0ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLmNvb3JkaW5hdGUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgcGl2b3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLnBpdm90O1xuICAgIH1cblxuICAgIHNldCBwaXZvdCh2YWx1ZSkge1xuICAgICAgICB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLnBpdm90ID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGlzMkQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLmlzMkQ7XG4gICAgfVxuXG4gICAgc2V0IGlzMkQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1Ub29sRGF0YS5pczJEID0gISF2YWx1ZTtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl93b3JsZEF4aXNDb250cm9sbGVyPy5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLl9pY29uVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fd29ybGRBeGlzQ29udHJvbGxlcj8uc2hvdygpO1xuICAgICAgICAgICAgdGhpcy5faWNvblZpc2libGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0SWNvblZpc2libGUodGhpcy5faWNvblZpc2libGUpO1xuICAgIH1cblxuICAgIC8vIOKUgOKUgCBTY2VuZSBHaXptbyAo5LiOIGNvY29zLWVkaXRvciBHaXptb01hbmFnZXIuY3JlYXRlU2NlbmVHaXptbyDkuIDoh7QpIOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgcHJpdmF0ZSBjcmVhdGVTY2VuZUdpem1vKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBub2RlID0gbmV3IE5vZGUoJ1NjZW5lIEdpem1vIENhbWVyYScpO1xuICAgICAgICBub2RlLmxheWVyID0gTGF5ZXJzLkVudW0uRURJVE9SIHwgTGF5ZXJzLkVudW0uSUdOT1JFX1JBWUNBU1Q7XG4gICAgICAgIG5vZGUucGFyZW50ID0gdGhpcy5iYWNrZ3JvdW5kTm9kZTtcbiAgICAgICAgY29uc3QgY2FtZXJhID0gbm9kZS5hZGRDb21wb25lbnQoJ2NjLkNhbWVyYScpIGFzIENhbWVyYTtcbiAgICAgICAgKGNhbWVyYSBhcyBhbnkpLmluRWRpdG9yTW9kZSA9IHRydWU7XG4gICAgICAgIHRoaXMuc2NlbmVHaXptb0NhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgY2FtZXJhLmZhciA9IDEwMDA7XG4gICAgICAgIGNhbWVyYS52aXNpYmlsaXR5ID0gU2NlbmVHaXptb0xheWVyO1xuICAgICAgICBjYW1lcmEucmVjdCA9IG5ldyBSZWN0KDAuNywgMC44LCAwLjIsIDAuMik7XG4gICAgICAgIGNhbWVyYS5wcmlvcml0eSA9ICgxIDw8IDMwKSArICgxIDw8IDI5KTtcbiAgICAgICAgY2FtZXJhLmNsZWFyRmxhZ3MgPSBnZnguQ2xlYXJGbGFnQml0LkRFUFRIX1NURU5DSUw7XG4gICAgICAgIGlmICh0aGlzLmdpem1vUm9vdE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmxkQXhpc0NvbnRyb2xsZXIgPSBuZXcgV29ybGRBeGlzQ29udHJvbGxlcih0aGlzLmdpem1vUm9vdE5vZGUsIGNhbWVyYSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTY2VuZUdpem1vQ2FtZXJhUmVjdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0U2NlbmVHaXptb0NhbWVyYVJlY3QoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHJvb3QgPSBkaXJlY3Rvci5yb290O1xuICAgICAgICBjb25zdCB3aW5XaWR0aCA9IHJvb3Q/LmN1cldpbmRvdyA/IHJvb3QuY3VyV2luZG93LndpZHRoIDogMDtcbiAgICAgICAgY29uc3Qgd2luSGVpZ2h0ID0gcm9vdD8uY3VyV2luZG93ID8gcm9vdC5jdXJXaW5kb3cuaGVpZ2h0IDogMDtcbiAgICAgICAgaWYgKHdpbldpZHRoID09PSAwIHx8IHdpbkhlaWdodCA9PT0gMCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSB3aW5IZWlnaHQgLyA2O1xuICAgICAgICBjb25zdCBoZWlnaHRQZXJjZW50ID0gaGVpZ2h0IC8gd2luSGVpZ2h0O1xuICAgICAgICBjb25zdCBkZWx0YSA9ICgod2luV2lkdGggLSB3aW5IZWlnaHQpICogaGVpZ2h0UGVyY2VudCkgLyAyIC8gd2luV2lkdGg7XG4gICAgICAgIGNvbnN0IHBhZGRpbmcgPSAoMzAgKiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA6IDEpKSAvIHdpbkhlaWdodDtcbiAgICAgICAgaWYgKHRoaXMuc2NlbmVHaXptb0NhbWVyYSkge1xuICAgICAgICAgICAgdGhpcy5zY2VuZUdpem1vQ2FtZXJhLnJlY3QgPSBuZXcgUmVjdChcbiAgICAgICAgICAgICAgICAxIC0gaGVpZ2h0UGVyY2VudCArIGRlbHRhLFxuICAgICAgICAgICAgICAgIDEgLSBoZWlnaHRQZXJjZW50IC0gcGFkZGluZyxcbiAgICAgICAgICAgICAgICBoZWlnaHRQZXJjZW50LFxuICAgICAgICAgICAgICAgIGhlaWdodFBlcmNlbnQsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25SZXNpemUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc2V0U2NlbmVHaXptb0NhbWVyYVJlY3QoKTtcbiAgICB9XG5cbiAgICAvLyDilIDilIAgTGlmZWN5Y2xlIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgaW5pdCgpOiB2b2lkIHtcblxuICAgICAgICAvLyDnlKjkuo7nvJbovpHlmajnu5jliLbnmoTog4zmma/lkozliY3mma/oioLngrlcbiAgICAgICAgdGhpcy5mb3JlZ3JvdW5kTm9kZSA9IG5ldyBjYy5Ob2RlKCdFZGl0b3IgU2NlbmUgRm9yZWdyb3VuZCcpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmROb2RlID0gbmV3IGNjLk5vZGUoJ0VkaXRvciBTY2VuZSBCYWNrZ3JvdW5kJyk7XG5cbiAgICAgICAgLy8g57yW6L6R5Zmo5L2/55So55qE6IqC54K55LiN6ZyA6KaB5a2Y5YKo5ZKM5pi+56S65Zyo5bGC57qn566h55CG5ZmoXG4gICAgICAgIHRoaXMuZm9yZWdyb3VuZE5vZGUub2JqRmxhZ3MgfD0gY2MuT2JqZWN0LkZsYWdzLkRvbnRTYXZlIHwgY2MuT2JqZWN0LkZsYWdzLkhpZGVJbkhpZXJhcmNoeTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kTm9kZS5vYmpGbGFncyB8PSBjYy5PYmplY3QuRmxhZ3MuRG9udFNhdmUgfCBjYy5PYmplY3QuRmxhZ3MuSGlkZUluSGllcmFyY2h5O1xuXG4gICAgICAgIC8vIOi/meS6m+iKgueCueW6lOivpeaYr+W4uOmpu+iKgueCuVxuICAgICAgICBjYy5kaXJlY3Rvci5hZGRQZXJzaXN0Um9vdE5vZGUodGhpcy5mb3JlZ3JvdW5kTm9kZSk7XG4gICAgICAgIGNjLmRpcmVjdG9yLmFkZFBlcnNpc3RSb290Tm9kZSh0aGlzLmJhY2tncm91bmROb2RlKTtcblxuICAgICAgICBjb25zdCBzY2VuZSA9IChjYyBhcyBhbnkpLmRpcmVjdG9yPy5nZXRTY2VuZSgpO1xuICAgICAgICBpZiAoc2NlbmUpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yZWdyb3VuZE5vZGUucGFyZW50ID0gc2NlbmU7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmROb2RlLnBhcmVudCA9IHNjZW5lO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9yZWdyb3VuZE5vZGUubGF5ZXIgPSBMYXllcnMuRW51bS5HSVpNT1M7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZE5vZGUubGF5ZXIgPSBMYXllcnMuRW51bS5HSVpNT1M7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGdpem1vIHJvb3RcbiAgICAgICAgdGhpcy5naXptb1Jvb3ROb2RlID0gY3JlYXRlM0ROb2RlKCdnaXptb1Jvb3QnKTtcbiAgICAgICAgdGhpcy5naXptb1Jvb3ROb2RlLnBhcmVudCA9IHRoaXMuZm9yZWdyb3VuZE5vZGU7XG5cbiAgICAgICAgLy8g5LiOIGNvY29zLWVkaXRvciBHaXptb01hbmFnZXIuaW5pdCDkuIDoh7TvvJrliJvlu7rlnLrmma8gR2l6bW8g55u45py6ICsgV29ybGRBeGlzXG4gICAgICAgIHRoaXMuY3JlYXRlU2NlbmVHaXptbygpO1xuXG4gICAgICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3Igc2NlbmUtZmFjYWRlLW1hbmFnZXIg5LiA6Ie077ya55uR5ZCsIHJlc2l6ZSDkuovku7bmm7TmlrDlnLrmma8gR2l6bW8g55u45py66KeG5Y+jXG4gICAgICAgIC8vIGNvY29zLWVkaXRvciDpgJrov4cgb3BlcmF0aW9uTWdyLm9uKCdyZXNpemUnLCAuLi4pIOKGkiBkaXNwYXRjaEV2ZW50cygnb25SZXNpemUnKSDlrp7njrBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIFNlcnZpY2UuT3BlcmF0aW9uLmFkZExpc3RlbmVyKCdyZXNpemUnIGFzIGFueSwgKCkgPT4gdGhpcy5vblJlc2l6ZSgpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gT3BlcmF0aW9uIHNlcnZpY2Ugbm90IHJlYWR5IHlldFxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMub25SZXNpemUoKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbml0IEdpem1vT3BlcmF0aW9uXG4gICAgICAgIHRoaXMuX2dpem1vT3BlcmF0aW9uID0gbmV3IEdpem1vT3BlcmF0aW9uKCk7XG4gICAgICAgIHRoaXMuX2dpem1vT3BlcmF0aW9uLmluaXQoKTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIHRvb2wgY2hhbmdlc1xuICAgICAgICB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLm9uKCd0b29sLW5hbWUtY2hhbmdlZCcsIChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZ2l6bW86dG9vbC1jaGFuZ2VkJywgbmFtZSk7XG4gICAgICAgICAgICB0aGlzLnNhdmVDb25maWcoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtVG9vbERhdGEub24oJ2Nvb3JkaW5hdGUtY2hhbmdlZCcsICgpID0+IHsgdGhpcy5zYXZlQ29uZmlnKCk7IH0pO1xuICAgICAgICB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLm9uKCdwaXZvdC1jaGFuZ2VkJywgKCkgPT4geyB0aGlzLnNhdmVDb25maWcoKTsgfSk7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtVG9vbERhdGEub24oJ3ZpZXctbW9kZS1jaGFuZ2VkJywgKCkgPT4geyB0aGlzLnNhdmVDb25maWcoKTsgfSk7XG5cbiAgICAgICAgLy8g5LiOIGNvY29zLWVkaXRvciBnaXptb3MudHMg5LiA6Ie077yaZGltZW5zaW9uLWNoYW5nZWQg4oaSIOWQjOatpeebuOacuiArIOWbnuiwg1xuICAgICAgICB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLm9uKCdkaW1lbnNpb24tY2hhbmdlZCcsIChpczJEOiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIFNlcnZpY2UuQ2FtZXJhLmlzMkQgPSBpczJEO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIENhbWVyYSBub3QgcmVhZHkgeWV0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9uRGltZW5zaW9uQ2hhbmdlZChpczJEKTtcbiAgICAgICAgICAgIFNlcnZpY2VFdmVudHMuZW1pdCgnc2NlbmU6ZGltZW5zaW9uLWNoYW5nZWQnLCBpczJEKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZUNvbmZpZygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDkuI4gY29jb3MtZWRpdG9yIGdpem1vcy50cyDkuIDoh7TvvJrlj6rlnKggSURMRSDop6PplIHjgIFXQU5ERVIg6ZSB5a6aXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAoU2VydmljZSBhcyBhbnkpLkNhbWVyYT8uY29udHJvbGxlcjNEPy5vbj8uKCdjYW1lcmEtbW92ZS1tb2RlJywgKG1vZGU6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtb2RlID09PSAwKSB7IC8vIENhbWVyYU1vdmVNb2RlLklETEVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2NrR2l6bW9Ub29sKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGUgPT09IDQpIHsgLy8gQ2FtZXJhTW92ZU1vZGUuV0FOREVSXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9ja0dpem1vVG9vbCh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gQ2FtZXJhIG5vdCByZWFkeSB5ZXRcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3Ig5LiA6Ie077ya55u05o6l55uR5ZCsIFNlbGVjdGlvbiDkuovku7ZcbiAgICAgICAgU2VydmljZUV2ZW50cy5vbignc2VsZWN0aW9uOnNlbGVjdCcsIChwYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25TZWxlY3Rpb25TZWxlY3QocGF0aCk7XG4gICAgICAgIH0pO1xuICAgICAgICBTZXJ2aWNlRXZlbnRzLm9uKCdzZWxlY3Rpb246dW5zZWxlY3QnLCAocGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uU2VsZWN0aW9uVW5zZWxlY3QocGF0aCk7XG4gICAgICAgIH0pO1xuICAgICAgICBTZXJ2aWNlRXZlbnRzLm9uKCdzZWxlY3Rpb246Y2xlYXInLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uU2VsZWN0aW9uQ2xlYXIoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5LiOIGNvY29zLWVkaXRvciBUcmFuc2Zvcm1HaXptb01hbmFnZXIuX19saXN0ZW5FdmVudHMg5LiA6Ie077yac25hcCDphY3nva7lj5jmm7TmjIHkuYXljJZcbiAgICAgICAgdGhpcy5fbGlzdGVuU25hcEV2ZW50cygpO1xuXG4gICAgICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgR2l6bW9NYW5hZ2VyLmluaXQg5LiA6Ie077yaZ2l6bW8g6YWN572u5Y+q5Zyo5pyN5Yqh5Yid5aeL5YyW5pe25oGi5aSN44CCXG4gICAgICAgIC8vIOaJk+W8gC/ph43ovb3lnLrmma/ml7bkvJrlvLrliLbliIflm54gcG9zaXRpb27vvIzpgb/lhY3lvILmraXphY3nva7or7vlj5bopobnm5blnLrmma/miZPlvIDmtYHnqIvjgIJcbiAgICAgICAgdm9pZCB0aGlzLmluaXRGcm9tQ29uZmlnKCk7XG5cbiAgICAgICAgLy8g5LiOIGNvY29zLWVkaXRvciBHaXptb01hbmFnZXIuaW5pdCDkuIDoh7TvvJrnm5HlkKznm7jmnLrmipXlvbHlj5jljJZcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIChTZXJ2aWNlIGFzIGFueSkuQ2FtZXJhPy5jb250cm9sbGVyPy5vbj8uKCdwcm9qZWN0aW9uLWNoYW5nZWQnLCAocHJvamVjdGlvbjogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd29ybGRBeGlzQ29udHJvbGxlcj8ub25DYW1lcmFQcm9qZWN0aW9uQ2hhbmdlZChwcm9qZWN0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBDYW1lcmEgbm90IHJlYWR5IHlldFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfbGlzdGVuU25hcEV2ZW50cygpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc25hcENvbmZpZ3MgPSB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLnNuYXBDb25maWdzO1xuICAgICAgICBjb25zdCBzYXZlID0gKCkgPT4geyB0aGlzLl9zYXZlU25hcENvbmZpZygpOyB9O1xuICAgICAgICBzbmFwQ29uZmlncy5vbignc25hcC1wb3NpdGlvbi1jaGFuZ2VkJywgc2F2ZSk7XG4gICAgICAgIHNuYXBDb25maWdzLm9uKCdzbmFwLXJvdGF0aW9uLWNoYW5nZWQnLCBzYXZlKTtcbiAgICAgICAgc25hcENvbmZpZ3Mub24oJ3NuYXAtc2NhbGUtY2hhbmdlZCcsIHNhdmUpO1xuICAgICAgICBzbmFwQ29uZmlncy5vbignZW5hYmxlLXNuYXAtcG9zaXRpb24tY2hhbmdlZCcsIHNhdmUpO1xuICAgICAgICBzbmFwQ29uZmlncy5vbignZW5hYmxlLXNuYXAtcm90YXRpb24tY2hhbmdlZCcsIHNhdmUpO1xuICAgICAgICBzbmFwQ29uZmlncy5vbignZW5hYmxlLXNuYXAtc2NhbGUtY2hhbmdlZCcsIHNhdmUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3NhdmVTbmFwQ29uZmlnKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcnBjID0gUnBjLmdldEluc3RhbmNlKCk7XG4gICAgICAgICAgICBjb25zdCBzbmFwRGF0YSA9IHRoaXMudHJhbnNmb3JtVG9vbERhdGEuc25hcENvbmZpZ3MuZ2V0UHVyZURhdGFPYmplY3QoKTtcbiAgICAgICAgICAgIGF3YWl0IHJwYy5yZXF1ZXN0KCdzY2VuZUNvbmZpZ0luc3RhbmNlJywgJ3NldCcsIFsnZ2l6bW8uc25hcENvbmZpZ3MnLCBzbmFwRGF0YSwgJ2xvY2FsJ10pO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vIENvbmZpZyBwZXJzaXN0ZW5jZSBub3QgYXZhaWxhYmxlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDkuI4gY29jb3MtZWRpdG9yIEdpem1vTWFuYWdlci5pbml0RnJvbUNvbmZpZyDkuIDoh7RcbiAgICBhc3luYyBpbml0RnJvbUNvbmZpZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJwYyA9IFJwYy5nZXRJbnN0YW5jZSgpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnOiBhbnkgPSBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdnZXQnLCBbJ2dpem1vJywgJ2xvY2FsJ10pO1xuICAgICAgICAgICAgaWYgKGNvbmZpZykge1xuICAgICAgICAgICAgICAgIGlmIChjb25maWcuaXMyRCAhPT0gdW5kZWZpbmVkKSB0aGlzLmlzMkQgPSBjb25maWcuaXMyRDtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmlzM0RJY29uICE9PSB1bmRlZmluZWQpIHRoaXMuc2V0SWNvbkdpem1vM0QoY29uZmlnLmlzM0RJY29uKTtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmljb25TaXplICE9PSB1bmRlZmluZWQpIHRoaXMuc2V0SWNvbkdpem1vU2l6ZShjb25maWcuaWNvblNpemUpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5faGFzRWRpdG9yT3BlbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maWcudHJhbnNmb3JtVG9vbE5hbWUgIT09IHVuZGVmaW5lZCkgdGhpcy50cmFuc2Zvcm1Ub29sTmFtZSA9IGNvbmZpZy50cmFuc2Zvcm1Ub29sTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZy52aWV3TW9kZSAhPT0gdW5kZWZpbmVkKSB0aGlzLnZpZXdNb2RlID0gY29uZmlnLnZpZXdNb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLnBpdm90ICE9PSB1bmRlZmluZWQpIHRoaXMuc2V0UGl2b3QoY29uZmlnLnBpdm90KTtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmNvb3JkaW5hdGUgIT09IHVuZGVmaW5lZCkgdGhpcy5zZXRDb29yZGluYXRlKGNvbmZpZy5jb29yZGluYXRlKTtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLnRvb2xzVmlzaWJpbGl0eTNkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUb29sc1Zpc2liaWxpdHkzZChjb25maWcudG9vbHNWaXNpYmlsaXR5M2QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VG9vbHNWaXNpYmlsaXR5M2QodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb25maWcuc25hcENvbmZpZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1Ub29sRGF0YS5zbmFwQ29uZmlncy5pbml0RnJvbURhdGEoY29uZmlnLnNuYXBDb25maWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5yZWN0U25hcENvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICByZWN0VHJhbnNmb3JtU25hcHBpbmcuaW5pdEZyb21EYXRhKGNvbmZpZy5yZWN0U25hcENvbmZpZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb25maWcuZ3JpZENvbG9yICE9PSB1bmRlZmluZWQpIEdpem1vQ29uZmlnLmdyaWRDb2xvciA9IGNvbmZpZy5ncmlkQ29sb3I7XG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5vcmlnaW5BeGlzMkQgIT09IHVuZGVmaW5lZCkgR2l6bW9Db25maWcub3JpZ2luQXhpczJEID0gY29uZmlnLm9yaWdpbkF4aXMyRDtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLm9yaWdpbkF4aXMzRCAhPT0gdW5kZWZpbmVkKSBHaXptb0NvbmZpZy5vcmlnaW5BeGlzM0QgPSBjb25maWcub3JpZ2luQXhpczNEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vIOmFjee9ruS4jeWPr+eUqOaXtuS9v+eUqOm7mOiupOWAvFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciBHaXptb01hbmFnZXIuc2F2ZUNvbmZpZyDkuIDoh7RcbiAgICBhc3luYyBzYXZlQ29uZmlnKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcnBjID0gUnBjLmdldEluc3RhbmNlKCk7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgcnBjLnJlcXVlc3QoJ3NjZW5lQ29uZmlnSW5zdGFuY2UnLCAnZ2V0JywgWydnaXptbycsICdsb2NhbCddKSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+ID8/IHt9O1xuICAgICAgICAgICAgLy8g5rOo5oSP77yaR2l6bW9Db25maWcg5oul5pyJ55qE5a2X5q6177yIZ3JpZENvbG9y44CBaXMzREljb27jgIFpY29uU2l6ZeOAgXRvb2xzVmlzaWJpbGl0eTNk44CBXG4gICAgICAgICAgICAvLyBvcmlnaW5BeGlzMkTjgIFvcmlnaW5BeGlzM0TvvInkuI3lnKjmraTlhpnlhaXvvIzmlLnnlLHlkIToh6ogc2V0dGVyIOWumuWQkeiQveebmO+8iOingSBfc2F2ZUdpem1vQ29uZmlnRmllbGTvvInvvIxcbiAgICAgICAgICAgIC8vIOmBv+WFjeaJk+W8gOWcuuaZr+WIh+WbniBwb3NpdGlvbiDop6blj5HnmoQgc2F2ZUNvbmZpZyDnlKjlsJrmnKrovb3lhaXnmoTpu5jorqTlgLzopobnm5blt7Lkv53lrZjnmoTphY3nva7jgIJcbiAgICAgICAgICAgIC8vIOi/memHjOeUqCAuLi5jdXJyZW50IOS/neeVmeejgeebmOS4iuW3suacieeahOi/meS6m+Wtl+aute+8jOWPquWGmeS8mumaj+WcuuaZry/mk43kvZzlrp7ml7blj5jljJbnmoTlrZfmrrXjgIJcbiAgICAgICAgICAgIGNvbnN0IGdpem1vQ29uZmlnID0ge1xuICAgICAgICAgICAgICAgIC4uLmN1cnJlbnQsXG4gICAgICAgICAgICAgICAgaXMyRDogdGhpcy5pczJELFxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybVRvb2xOYW1lOiB0aGlzLnRyYW5zZm9ybVRvb2xOYW1lLFxuICAgICAgICAgICAgICAgIHZpZXdNb2RlOiB0aGlzLnZpZXdNb2RlLFxuICAgICAgICAgICAgICAgIHBpdm90OiB0aGlzLnBpdm90LFxuICAgICAgICAgICAgICAgIGNvb3JkaW5hdGU6IHRoaXMuY29vcmRpbmF0ZSxcbiAgICAgICAgICAgICAgICBzbmFwQ29uZmlnczogdGhpcy50cmFuc2Zvcm1Ub29sRGF0YS5zbmFwQ29uZmlncy5nZXRQdXJlRGF0YU9iamVjdCgpLFxuICAgICAgICAgICAgICAgIHJlY3RTbmFwQ29uZmlnOiByZWN0VHJhbnNmb3JtU25hcHBpbmcuZ2V0UHVyZURhdGFPYmplY3QoKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdzZXQnLCBbJ2dpem1vJywgZ2l6bW9Db25maWcsICdsb2NhbCddKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBDb25maWcgcGVyc2lzdGVuY2Ugbm90IGF2YWlsYWJsZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gR2l6bW9Db25maWcg5oul5pyJ55qE5a2X5q615Y2V54us5a6a5ZCR6JC955uY77yM5LiOIF9zYXZlU25hcENvbmZpZyDkuIDoh7TvvIzkuI3nu4/ov4fmlbTlnZcgc2F2ZUNvbmZpZ+OAglxuICAgIC8vIOWOn+WboO+8mnNhdmVDb25maWcg5Lya55SoIEdpem1vQ29uZmlnIOmdmeaAgemHj+mHjeaWsOW/q+eFp+aJgOacieWtl+aute+8jOiLpeafkOWtl+auteWwmuacquS7juejgeebmOi9veWFpe+8iOS7jeaYr+m7mOiupOWAvO+8ie+8jFxuICAgIC8vIOeUseWFtuWug+aUueWKqOinpuWPkeeahCBzYXZlQ29uZmlnIOS8muaKiuWug+WGmeWbnum7mOiupOWAvO+8jOimhuebluS4iuasoeS/neWtmOeahOS4quaAp+WMlumFjee9ruOAguaUueS4uumAkOWtl+auteWumuWQkeiQveebmOWQju+8jFxuICAgIC8vIOavj+asoeWPquWGmeWPkeeUn+WPmOWMlueahOmCo+S4quWtl+aute+8jOWFtuS9meWtl+auteeUsSBzYXZlQ29uZmlnIOeahCAuLi5jdXJyZW50IOS7juejgeebmOWOn+agt+S/neeVmeOAglxuICAgIHByaXZhdGUgYXN5bmMgX3NhdmVHaXptb0NvbmZpZ0ZpZWxkKHN1YktleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcnBjID0gUnBjLmdldEluc3RhbmNlKCk7XG4gICAgICAgICAgICBhd2FpdCBycGMucmVxdWVzdCgnc2NlbmVDb25maWdJbnN0YW5jZScsICdzZXQnLCBbYGdpem1vLiR7c3ViS2V5fWAsIHZhbHVlLCAnbG9jYWwnXSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gQ29uZmlnIHBlcnNpc3RlbmNlIG5vdCBhdmFpbGFibGVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOKUgOKUgCBUcmFuc2Zvcm0gdG9vbCBtZXRob2RzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgY2hhbmdlVG9vbChuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1Ub29sTmFtZSA9IG5hbWU7XG4gICAgfVxuXG4gICAgc2V0Q29vcmRpbmF0ZShjb29yZDogJ2xvY2FsJyB8ICdnbG9iYWwnKTogdm9pZCB7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtVG9vbERhdGEuY29vcmRpbmF0ZSA9IGNvb3JkO1xuICAgIH1cblxuICAgIHNldFBpdm90KHBpdm90OiAncGl2b3QnIHwgJ2NlbnRlcicpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1Ub29sRGF0YS5waXZvdCA9IHBpdm90O1xuICAgIH1cblxuICAgIGxvY2tHaXptb1Rvb2wobG9ja2VkOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtVG9vbERhdGEuaXNMb2NrZWQgPSBsb2NrZWQ7XG4gICAgfVxuXG4gICAgaXNHaXptb1Rvb2xMb2NrZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybVRvb2xEYXRhLmlzTG9ja2VkO1xuICAgIH1cblxuICAgIC8vIOKUgOKUgCBHaXptb0NvbmZpZyBtZXRob2RzICjkuI4gY29jb3MtZWRpdG9yIEdpem1vTWFuYWdlciDkuIDoh7QpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgcXVlcnlUb29sc1Zpc2liaWxpdHkzZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIEdpem1vQ29uZmlnLnRvb2xzVmlzaWJpbGl0eTNkO1xuICAgIH1cblxuICAgIHNldFRvb2xzVmlzaWJpbGl0eTNkKHZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIEdpem1vQ29uZmlnLnRvb2xzVmlzaWJpbGl0eTNkID0gQm9vbGVhbih2YWx1ZSk7XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiB0aGlzLl9zZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGdldE5vZGVCeVV1aWQodXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgd2Fsa05vZGVDb21wb25lbnQobm9kZSwgKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBnaXptbyA9IGdldEdpem1vUHJvcGVydHkoJ2NvbXBvbmVudCcsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2l6bW8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2l6bW8udGFyZ2V0ICE9PSBjb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2hvd0dpem1vKCdjb21wb25lbnQnLCBjb21wb25lbnQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2aXNpYmxlID0gZ2l6bW8uY2hlY2tWaXNpYmxlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZpc2libGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdpem1vLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdpem1vLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIFNjZW5lIG5vdCByZWFkeVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgIHZvaWQgdGhpcy5fc2F2ZUdpem1vQ29uZmlnRmllbGQoJ3Rvb2xzVmlzaWJpbGl0eTNkJywgR2l6bW9Db25maWcudG9vbHNWaXNpYmlsaXR5M2QpO1xuICAgIH1cblxuICAgIGlzSWNvbkdpem1vM0QoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBHaXptb0NvbmZpZy5pc0ljb25HaXptbzNEO1xuICAgIH1cblxuICAgIHNldEljb25HaXptbzNEKHZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgIEdpem1vQ29uZmlnLmlzSWNvbkdpem1vM0QgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fd2Fsa0FsbFNjZW5lTm9kZXMoKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpY29uR2l6bW8gPSBnZXRHaXptb1Byb3BlcnR5KCdpY29uJywgY29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmIChpY29uR2l6bW8gJiYgKGljb25HaXptbyBhcyBhbnkpLnNldEljb25HaXptbzNEKSB7XG4gICAgICAgICAgICAgICAgKGljb25HaXptbyBhcyBhbnkpLnNldEljb25HaXptbzNEKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgIHZvaWQgdGhpcy5fc2F2ZUdpem1vQ29uZmlnRmllbGQoJ2lzM0RJY29uJywgR2l6bW9Db25maWcuaXNJY29uR2l6bW8zRCk7XG4gICAgfVxuXG4gICAgcXVlcnlJY29uR2l6bW9TaXplKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBHaXptb0NvbmZpZy5pY29uR2l6bW9TaXplO1xuICAgIH1cblxuICAgIHNldEljb25HaXptb1NpemUoc2l6ZTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGlmIChzaXplID09PSBudWxsIHx8IHNpemUgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICBHaXptb0NvbmZpZy5pY29uR2l6bW9TaXplID0gc2l6ZTtcbiAgICAgICAgdGhpcy5fd2Fsa0FsbFNjZW5lTm9kZXMoKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpY29uR2l6bW8gPSBnZXRHaXptb1Byb3BlcnR5KCdpY29uJywgY29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmIChpY29uR2l6bW8gJiYgKGljb25HaXptbyBhcyBhbnkpLnNldEljb25HaXptb1NpemUpIHtcbiAgICAgICAgICAgICAgICAoaWNvbkdpem1vIGFzIGFueSkuc2V0SWNvbkdpem1vU2l6ZShzaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgIHZvaWQgdGhpcy5fc2F2ZUdpem1vQ29uZmlnRmllbGQoJ2ljb25TaXplJywgR2l6bW9Db25maWcuaWNvbkdpem1vU2l6ZSk7XG4gICAgfVxuXG4gICAgcXVlcnlHcmlkQ29sb3IoKTogbnVtYmVyW10ge1xuICAgICAgICByZXR1cm4gR2l6bW9Db25maWcuZ3JpZENvbG9yO1xuICAgIH1cblxuICAgIHNldEdyaWRDb2xvcihjb2xvcjogbnVtYmVyW10pOiB2b2lkIHtcbiAgICAgICAgaWYgKCFjb2xvcikgcmV0dXJuO1xuICAgICAgICBHaXptb0NvbmZpZy5ncmlkQ29sb3IgPSBbLi4uY29sb3JdO1xuICAgICAgICBTZXJ2aWNlLkNhbWVyYT8uc2V0R3JpZENvbG9yPy4oY29sb3IsIGZhbHNlKTtcbiAgICAgICAgdm9pZCB0aGlzLl9zYXZlR2l6bW9Db25maWdGaWVsZCgnZ3JpZENvbG9yJywgWy4uLmNvbG9yXSk7XG4gICAgfVxuXG4gICAgcXVlcnlPcmlnaW5BeGVzMkQoKTogSU9yaWdpbkF4ZXNDb25maWcge1xuICAgICAgICByZXR1cm4gR2l6bW9Db25maWcub3JpZ2luQXhpczJEO1xuICAgIH1cblxuICAgIHNldE9yaWdpbkF4ZXMyRChjb25maWc6IElPcmlnaW5BeGVzQ29uZmlnKTogdm9pZCB7XG4gICAgICAgIGlmICghY29uZmlnKSByZXR1cm47XG4gICAgICAgIEdpem1vQ29uZmlnLm9yaWdpbkF4aXMyRCA9IHsgLi4uY29uZmlnIH07XG4gICAgICAgIFNlcnZpY2UuQ2FtZXJhPy5zZXRPcmlnaW5BeGVzMkQ/Lihjb25maWcpO1xuICAgICAgICB2b2lkIHRoaXMuX3NhdmVHaXptb0NvbmZpZ0ZpZWxkKCdvcmlnaW5BeGlzMkQnLCB7IC4uLkdpem1vQ29uZmlnLm9yaWdpbkF4aXMyRCB9KTtcbiAgICB9XG5cbiAgICBxdWVyeU9yaWdpbkF4ZXMzRCgpOiBJT3JpZ2luQXhlc0NvbmZpZyB7XG4gICAgICAgIHJldHVybiBHaXptb0NvbmZpZy5vcmlnaW5BeGlzM0Q7XG4gICAgfVxuXG4gICAgc2V0T3JpZ2luQXhlczNEKGNvbmZpZzogSU9yaWdpbkF4ZXNDb25maWcpOiB2b2lkIHtcbiAgICAgICAgaWYgKCFjb25maWcpIHJldHVybjtcbiAgICAgICAgR2l6bW9Db25maWcub3JpZ2luQXhpczNEID0geyAuLi5jb25maWcgfTtcbiAgICAgICAgU2VydmljZS5DYW1lcmE/LnNldE9yaWdpbkF4ZXMzRD8uKGNvbmZpZyk7XG4gICAgICAgIHZvaWQgdGhpcy5fc2F2ZUdpem1vQ29uZmlnRmllbGQoJ29yaWdpbkF4aXMzRCcsIHsgLi4uR2l6bW9Db25maWcub3JpZ2luQXhpczNEIH0pO1xuICAgIH1cblxuICAgIHNldEljb25WaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5faWNvblZpc2libGUgPSB2aXNpYmxlO1xuICAgICAgICAvLyDkuI4gY29jb3MtZWRpdG9yIGljb25WaXNpYmxlIHNldHRlciDkuIDoh7TvvJrpgY3ljoblnLrmma/miYDmnInoioLngrlcbiAgICAgICAgdGhpcy5fd2Fsa0FsbFNjZW5lTm9kZXMoKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpY29uR2l6bW8gPSBnZXRHaXptb1Byb3BlcnR5KCdpY29uJywgY29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmIChpY29uR2l6bW8gJiYgKGljb25HaXptbyBhcyBhbnkpLnNldEljb25HaXptb1Zpc2libGUpIHtcbiAgICAgICAgICAgICAgICAoaWNvbkdpem1vIGFzIGFueSkuc2V0SWNvbkdpem1vVmlzaWJsZSh2aXNpYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciBpY29uVmlzaWJsZSBzZXR0ZXIg5LiA6Ie077ya6YGN5Y6G5Zy65pmv5omA5pyJ6IqC54K56ICM6Z2eIHBvb2xcbiAgICBwcml2YXRlIF93YWxrQWxsU2NlbmVOb2RlcyhjYWxsYmFjazogKGNvbXA6IENvbXBvbmVudCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzY2VuZSA9IChjYyBhcyBhbnkpLmRpcmVjdG9yPy5nZXRTY2VuZSgpO1xuICAgICAgICBpZiAoIXNjZW5lKSByZXR1cm47XG4gICAgICAgIHRoaXMuX3dhbGtOb2RlVHJlZShzY2VuZSwgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3dhbGtOb2RlVHJlZShub2RlOiBOb2RlLCBjYWxsYmFjazogKGNvbXA6IENvbXBvbmVudCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBpZiAoIW5vZGUgfHwgaXNFZGl0b3JOb2RlKG5vZGUpKSByZXR1cm47XG4gICAgICAgIHdhbGtOb2RlQ29tcG9uZW50KG5vZGUsIGNhbGxiYWNrKTtcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuO1xuICAgICAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93YWxrTm9kZVRyZWUoY2hpbGRyZW5baV0sIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOKUgOKUgCBTbmFwIGNvbmZpZyBtZXRob2RzICjkuI4gY29jb3MtZWRpdG9yIFRyYW5zZm9ybUdpem1vTWFuYWdlciDkuIDoh7QpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgcXVlcnlUcmFuc2Zvcm1TbmFwQ29uZmlncygpOiBJU25hcENvbmZpZ0RhdGEge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1Ub29sRGF0YS5zbmFwQ29uZmlncy5nZXRQdXJlRGF0YU9iamVjdCgpO1xuICAgIH1cblxuICAgIHNldFRyYW5zZm9ybVNuYXBDb25maWdzKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgICAgICAodGhpcy50cmFuc2Zvcm1Ub29sRGF0YS5zbmFwQ29uZmlncyBhcyBhbnkpW25hbWVdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgcXVlcnlSZWN0U25hcENvbmZpZygpOiBJUmVjdFNuYXBDb25maWdEYXRhIHtcbiAgICAgICAgcmV0dXJuIHJlY3RUcmFuc2Zvcm1TbmFwcGluZy5nZXRQdXJlRGF0YU9iamVjdCgpO1xuICAgIH1cblxuICAgIHNldFJlY3RTbmFwQ29uZmlnKGNvbmZpZzogUGFydGlhbDxJUmVjdFNuYXBDb25maWdEYXRhPik6IHZvaWQge1xuICAgICAgICByZWN0VHJhbnNmb3JtU25hcHBpbmcuaW5pdEZyb21EYXRhKHtcbiAgICAgICAgICAgIC4uLnJlY3RUcmFuc2Zvcm1TbmFwcGluZy5nZXRQdXJlRGF0YU9iamVjdCgpLFxuICAgICAgICAgICAgLi4uY29uZmlnLFxuICAgICAgICB9KTtcbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICAgICAgdm9pZCB0aGlzLnNhdmVDb25maWcoKTtcbiAgICB9XG5cbiAgICAvLyDilIDilIAgUG9vbCBtYW5hZ2VtZW50ICjkuI4gY29jb3MtZWRpdG9yIEdpem1vUG9vbCDkuIDoh7QpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gICAgcHJpdmF0ZSBfZ2V0UG9vbCh0eXBlOiBUR2l6bW9UeXBlKTogTWFwPHN0cmluZywgR2l6bW9CYXNlW10+IHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdjb21wb25lbnQnOiByZXR1cm4gdGhpcy5fY29tcG9uZW50UG9vbDtcbiAgICAgICAgICAgIGNhc2UgJ2ljb24nOiByZXR1cm4gdGhpcy5faWNvblBvb2w7XG4gICAgICAgICAgICBjYXNlICdwZXJzaXN0ZW50JzogcmV0dXJuIHRoaXMuX3BlcnNpc3RlbnRQb29sO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciBHaXptb1Bvb2wudW5tb3VudEdpem1vIOS4gOiHtFxuICAgIHByaXZhdGUgX3VubW91bnRHaXptbyhnaXptbzogR2l6bW9CYXNlKTogdm9pZCB7XG4gICAgICAgIGlmIChnaXptby50YXJnZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVzOiBUR2l6bW9UeXBlW10gPSBbJ2NvbXBvbmVudCcsICdpY29uJywgJ3BlcnNpc3RlbnQnXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBvZiB0eXBlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gZ2V0R2l6bW9Qcm9wZXJ0eSh0eXBlLCBnaXptby50YXJnZXQpO1xuICAgICAgICAgICAgICAgIGlmIChleGlzdGluZyA9PT0gZ2l6bW8pIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0R2l6bW9Qcm9wZXJ0eSh0eXBlLCBnaXptby50YXJnZXQsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBnaXptby50YXJnZXQgPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZUdpem1vKHR5cGU6IFRHaXptb1R5cGUsIG5hbWU6IHN0cmluZyk6IEdpem1vQmFzZSB8IG51bGwge1xuICAgICAgICBjb25zdCBkZWZNYXAgPSBnZXRHaXptb0RlZk1hcCh0eXBlKTtcbiAgICAgICAgY29uc3QgR2l6bW9DdG9yID0gZGVmTWFwLmdldChuYW1lKTtcblxuICAgICAgICBjb25zdCBwb29sID0gdGhpcy5fZ2V0UG9vbCh0eXBlKTtcbiAgICAgICAgbGV0IGluc3RhbmNlcyA9IHBvb2wuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoIWluc3RhbmNlcykge1xuICAgICAgICAgICAgaW5zdGFuY2VzID0gW107XG4gICAgICAgICAgICBwb29sLnNldChuYW1lLCBpbnN0YW5jZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5LiOIGNvY29zLWVkaXRvciBwb29sLmNyZWF0ZUdpem1vIOS4gOiHtO+8muajgOafpeaehOmAoOWHveaVsOaYr+WQpuWMuemFje+8jOS4jeWMuemFjeWImemUgOavgVxuICAgICAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA+IDAgJiYgaW5zdGFuY2VzWzBdLmNvbnN0cnVjdG9yICE9PSBHaXptb0N0b3IpIHtcbiAgICAgICAgICAgIGluc3RhbmNlcy5mb3JFYWNoKChpbnN0KSA9PiBpbnN0LmRlc3Ryb3koKSk7XG4gICAgICAgICAgICBpbnN0YW5jZXMubGVuZ3RoID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghR2l6bW9DdG9yKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyBSZXVzZSBoaWRkZW4gaW5zdGFuY2VcbiAgICAgICAgZm9yIChjb25zdCBpbnN0IG9mIGluc3RhbmNlcykge1xuICAgICAgICAgICAgaWYgKCFpbnN0LnZpc2libGUoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIG5ld1xuICAgICAgICBjb25zdCBnaXptbyA9IG5ldyBHaXptb0N0b3IobnVsbCk7XG4gICAgICAgIGluc3RhbmNlcy5wdXNoKGdpem1vKTtcbiAgICAgICAgcmV0dXJuIGdpem1vO1xuICAgIH1cblxuICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgR2l6bW9Qb29sLmRlc3Ryb3lHaXptbyDkuIDoh7RcbiAgICBwcml2YXRlIF9kZXN0cm95R2l6bW8oZ2l6bW86IEdpem1vQmFzZSk6IHZvaWQge1xuICAgICAgICB0aGlzLl91bm1vdW50R2l6bW8oZ2l6bW8pO1xuICAgICAgICBnaXptby5kZXN0cm95KCk7XG4gICAgICAgIGNvbnN0IHBvb2xzID0gW3RoaXMuX2NvbXBvbmVudFBvb2wsIHRoaXMuX2ljb25Qb29sLCB0aGlzLl9wZXJzaXN0ZW50UG9vbF07XG4gICAgICAgIGZvciAoY29uc3QgcG9vbCBvZiBwb29scykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbLCBpbnN0YW5jZXNdIG9mIHBvb2wpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGluc3RhbmNlcy5pbmRleE9mKGdpem1vKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvckVhY2hJbnN0YW5jZUxpc3QodHlwZTogVEdpem1vVHlwZSwgbmFtZTogc3RyaW5nLCBoYW5kbGU6IChnaXptbzogR2l6bW9CYXNlKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBvb2wgPSB0aGlzLl9nZXRQb29sKHR5cGUpO1xuICAgICAgICBjb25zdCBpbnN0YW5jZXMgPSBwb29sLmdldChuYW1lKTtcbiAgICAgICAgaWYgKCFpbnN0YW5jZXMpIHJldHVybjtcbiAgICAgICAgaW5zdGFuY2VzLmZvckVhY2goaGFuZGxlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zaG93R2l6bW8odHlwZTogVEdpem1vVHlwZSwgY29tcG9uZW50OiBDb21wb25lbnQsIGZvY3VzQ3JlYXRlID0gZmFsc2UpOiB2b2lkIHtcbiAgICAgICAgaWYgKCFjb21wb25lbnQpIHJldHVybjtcbiAgICAgICAgbGV0IGdpem1vID0gZ2V0R2l6bW9Qcm9wZXJ0eSh0eXBlLCBjb21wb25lbnQpO1xuICAgICAgICAvLyDkuI4gY29jb3MtZWRpdG9yIHNob3dHaXptbyDkuIDoh7TvvJpmb2N1c0NyZWF0ZSDml7blvLrliLbph43mlrDliJvlu7pcbiAgICAgICAgaWYgKCFnaXptbyB8fCBmb2N1c0NyZWF0ZSkge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGpzLmdldENsYXNzTmFtZShjb21wb25lbnQpO1xuICAgICAgICAgICAgZ2l6bW8gPSB0aGlzLl9jcmVhdGVHaXptbyh0eXBlLCBuYW1lKTtcbiAgICAgICAgICAgIGlmICghZ2l6bW8pIHJldHVybjtcbiAgICAgICAgICAgIHNldEdpem1vUHJvcGVydHkodHlwZSwgY29tcG9uZW50LCBnaXptbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdpY29uJykge1xuICAgICAgICAgICAgaWYgKChnaXptbyBhcyBhbnkpLnNldEljb25HaXptb1Zpc2libGUpIHtcbiAgICAgICAgICAgICAgICAoZ2l6bW8gYXMgYW55KS5zZXRJY29uR2l6bW9WaXNpYmxlKHRoaXMuX2ljb25WaXNpYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdpem1vLnNob3coKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2hpZGVHaXptbyhnaXptbzogR2l6bW9CYXNlKTogdm9pZCB7XG4gICAgICAgIGdpem1vLmhpZGUoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZW1vdmVHaXptbyh0eXBlOiBUR2l6bW9UeXBlLCBjb21wb25lbnQ6IENvbXBvbmVudCk6IHZvaWQge1xuICAgICAgICBjb25zdCBnaXptbyA9IGdldEdpem1vUHJvcGVydHkodHlwZSwgY29tcG9uZW50KTtcbiAgICAgICAgaWYgKGdpem1vKSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlR2l6bW8oZ2l6bW8pO1xuICAgICAgICAgICAgc2V0R2l6bW9Qcm9wZXJ0eSh0eXBlLCBjb21wb25lbnQsIG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g4pSA4pSAIE5vZGUgZ2l6bW8gbWFuYWdlbWVudCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgR2l6bW9Qb29sTWFuYWdlci5zaG93R2l6bW9PZk5vZGUg5LiA6Ie0XG4gICAgc2hvd0dpem1vT2ZOb2RlKHR5cGU6IFRHaXptb1R5cGUsIG5vZGU6IE5vZGUpOiB2b2lkIHtcbiAgICAgICAgaWYgKCFub2RlIHx8ICFub2RlLnBhcmVudCB8fCAhbm9kZS5hY3RpdmVJbkhpZXJhcmNoeSkgcmV0dXJuO1xuICAgICAgICB3YWxrTm9kZUNvbXBvbmVudChub2RlLCAoY29tcG9uZW50OiBDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50LmVuYWJsZWRJbkhpZXJhcmNoeSkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5fc2hvd0dpem1vKHR5cGUsIGNvbXBvbmVudCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNob3dBbGxHaXptb09mTm9kZShub2RlOiBOb2RlLCByZWN1cnNpdmUgPSBmYWxzZSk6IHZvaWQge1xuICAgICAgICBpZiAoIW5vZGUgfHwgaXNFZGl0b3JOb2RlKG5vZGUpKSByZXR1cm47XG4gICAgICAgIGlmICghbm9kZS5wYXJlbnQgfHwgIW5vZGUuYWN0aXZlSW5IaWVyYXJjaHkpIHJldHVybjtcbiAgICAgICAgd2Fsa05vZGVDb21wb25lbnQobm9kZSwgKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50LmVuYWJsZWRJbkhpZXJhcmNoeSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dHaXptbygnaWNvbicsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICB0aGlzLl9zaG93R2l6bW8oJ3BlcnNpc3RlbnQnLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgdGhpcy5fc2hvd0dpem1vKCdjb21wb25lbnQnLCBjb21wb25lbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0FsbEdpem1vT2ZOb2RlKGNoaWxkLCB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciBHaXptb1Bvb2xNYW5hZ2VyLnJlbW92ZUdpem1vT2ZOb2RlIOS4gOiHtFxuICAgIHJlbW92ZUdpem1vT2ZOb2RlKHR5cGU6IFRHaXptb1R5cGUsIG5vZGU6IE5vZGUpOiB2b2lkIHtcbiAgICAgICAgd2Fsa05vZGVDb21wb25lbnQobm9kZSwgKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVHaXptbyh0eXBlLCBjb21wb25lbnQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZW1vdmVBbGxHaXptb09mTm9kZShub2RlOiBOb2RlLCByZWN1cnNpdmUgPSBmYWxzZSk6IHZvaWQge1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybjtcbiAgICAgICAgd2Fsa05vZGVDb21wb25lbnQobm9kZSwgKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVHaXptbygnY29tcG9uZW50JywgY29tcG9uZW50KTtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUdpem1vKCdpY29uJywgY29tcG9uZW50KTtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUdpem1vKCdwZXJzaXN0ZW50JywgY29tcG9uZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUFsbEdpem1vT2ZOb2RlKGNoaWxkLCB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciBHaXptb1Bvb2wuY2xlYXJBbGxHaXptb3Mg5LiA6Ie0XG4gICAgY2xlYXJBbGxHaXptb3MoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBvb2xzID0gW3RoaXMuX2NvbXBvbmVudFBvb2wsIHRoaXMuX2ljb25Qb29sLCB0aGlzLl9wZXJzaXN0ZW50UG9vbF07XG4gICAgICAgIGZvciAoY29uc3QgcG9vbCBvZiBwb29scykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbLCBpbnN0YW5jZXNdIG9mIHBvb2wpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGdpem1vIG9mIGluc3RhbmNlcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91bm1vdW50R2l6bW8oZ2l6bW8pO1xuICAgICAgICAgICAgICAgICAgICBnaXptby5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9vbC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FsbEFsbEdpem1vRnVuY09mTm9kZShub2RlOiBOb2RlLCBmdW5jTmFtZTogc3RyaW5nLCAuLi5wYXJhbXM6IGFueVtdKTogYm9vbGVhbiB7XG4gICAgICAgIGxldCBzdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIGlmICghbm9kZSkgcmV0dXJuIHRydWU7XG4gICAgICAgIHdhbGtOb2RlQ29tcG9uZW50KG5vZGUsIChjb21wb25lbnQ6IENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tcEdpem1vID0gZ2V0R2l6bW9Qcm9wZXJ0eSgnY29tcG9uZW50JywgY29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQgJiYgY29tcEdpem1vICYmIChjb21wR2l6bW8gYXMgYW55KVtmdW5jTmFtZV0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXMgPSAoY29tcEdpem1vIGFzIGFueSlbZnVuY05hbWVdKC4uLnBhcmFtcyk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcyA9PT0gZmFsc2UpIHN0b3BwZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICFzdG9wcGVkO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgZ2l6bW8gd2l0aG91dCBleHBvc2luZyB0aGUgaW50ZXJuYWwgV2Vha01hcCB0byBjYWxsZXJzLiAqL1xuICAgIGdldENvbXBvbmVudEdpem1vKGNvbXBvbmVudDogQ29tcG9uZW50KTogR2l6bW9CYXNlIHwgbnVsbCB7XG4gICAgICAgIHJldHVybiBnZXRHaXptb1Byb3BlcnR5KCdjb21wb25lbnQnLCBjb21wb25lbnQpID8/IG51bGw7XG4gICAgfVxuXG4gICAgLy8g4pSA4pSAIFNlbGVjdGlvbiBpbnRlZ3JhdGlvbiAo5LiOIGNvY29zLWVkaXRvciBTZWxlY3Rpb25HaXptb01hbmFnZXIg5LiA6Ie0KSDilIDilIDilIDilIDilIBcblxuICAgIHF1ZXJ5U2VsZWN0Tm9kZXMoKTogTm9kZVtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbGVjdGlvblxuICAgICAgICAgICAgLm1hcCgodXVpZCkgPT4gZ2V0Tm9kZUJ5VXVpZCh1dWlkKSlcbiAgICAgICAgICAgIC5maWx0ZXIoKG5vZGUpOiBub2RlIGlzIE5vZGUgPT4gbm9kZSAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgaGFzU2VsZWN0ZWQodXVpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZWxlY3Rpb24uaW5jbHVkZXModXVpZCk7XG4gICAgfVxuXG4gICAgb25TZWxlY3Rpb25TZWxlY3QocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBnZXROb2RlQnlQYXRoKHBhdGgpO1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybjtcbiAgICAgICAgY29uc3QgdXVpZCA9IG5vZGUudXVpZDtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGlvbi5pbmNsdWRlcyh1dWlkKSkgcmV0dXJuO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5zaG93QWxsR2l6bW9PZk5vZGUobm9kZSk7XG4gICAgICAgICAgICB0aGlzLl9vbk5vZGVTZWxlY3Rpb25DaGFuZ2VkKG5vZGUsIHRydWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBTY2VuZSBub3QgcmVhZHlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZWxlY3Rpb24ucHVzaCh1dWlkKTtcbiAgICB9XG5cbiAgICBvblNlbGVjdGlvblVuc2VsZWN0KHBhdGg6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBub2RlID0gZ2V0Tm9kZUJ5UGF0aChwYXRoKTtcbiAgICAgICAgaWYgKCFub2RlKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHV1aWQgPSBub2RlLnV1aWQ7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuX3NlbGVjdGlvbi5pbmRleE9mKHV1aWQpO1xuICAgICAgICBpZiAoaWR4ID49IDApIHRoaXMuX3NlbGVjdGlvbi5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBnZXROb2RlQnlVdWlkKHV1aWQpO1xuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vbk5vZGVTZWxlY3Rpb25DaGFuZ2VkKG5vZGUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUdpem1vT2ZOb2RlKCdjb21wb25lbnQnLCBub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gU2NlbmUgbm90IHJlYWR5XG4gICAgICAgIH1cbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICBvblNlbGVjdGlvbkNsZWFyKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbGRTZWxlY3Rpb24gPSBbLi4udGhpcy5fc2VsZWN0aW9uXTtcbiAgICAgICAgdGhpcy5fc2VsZWN0aW9uLmxlbmd0aCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBvbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGdldE5vZGVCeVV1aWQodXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25Ob2RlU2VsZWN0aW9uQ2hhbmdlZChub2RlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlR2l6bW9PZk5vZGUoJ2NvbXBvbmVudCcsIG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBTY2VuZSBub3QgcmVhZHlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgR2l6bW9NYW5hZ2VyLm9uTm9kZVNlbGVjdGlvbkNoYW5nZWQg5LiA6Ie0XG4gICAgcHJpdmF0ZSBfb25Ob2RlU2VsZWN0aW9uQ2hhbmdlZChub2RlOiBOb2RlLCBzZWxlY3RlZDogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBpZiAoIW5vZGUgfHwgIW5vZGUucGFyZW50KSByZXR1cm47XG4gICAgICAgIGlmICghbm9kZS5hY3RpdmVJbkhpZXJhcmNoeSkgcmV0dXJuO1xuICAgICAgICB3YWxrTm9kZUNvbXBvbmVudChub2RlLCAoY29tcG9uZW50OiBDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGljb25HaXptbyA9IGdldEdpem1vUHJvcGVydHkoJ2ljb24nLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgaWYgKGljb25HaXptbyAmJiAoaWNvbkdpem1vIGFzIGFueSkub25Ob2RlU2VsZWN0aW9uQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIChpY29uR2l6bW8gYXMgYW55KS5vbk5vZGVTZWxlY3Rpb25DaGFuZ2VkKHNlbGVjdGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVzZWxlY3RDdXJyZW50U2VsZWN0aW9uKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzZWxlY3RlZFBhdGhzID0gQXJyYXkuZnJvbShuZXcgU2V0KFNlcnZpY2UuU2VsZWN0aW9uPy5xdWVyeT8uKCkgPz8gW10pKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0aW9uLmxlbmd0aCA9IDA7XG4gICAgICAgIFNlcnZpY2UuU2VsZWN0aW9uPy5jbGVhcj8uKCk7XG4gICAgICAgIGZvciAoY29uc3QgcGF0aCBvZiBzZWxlY3RlZFBhdGhzKSB7XG4gICAgICAgICAgICBpZiAoIWdldE5vZGVCeVBhdGgocGF0aCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFNlcnZpY2UuU2VsZWN0aW9uPy5zZWxlY3Q/LihwYXRoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOKUgOKUgCDnvJbovpHlmajnlJ/lkb3lkajmnJ/vvIjnlLEgQmFzZVNlcnZpY2Ug5LqL5Lu26ZKp5a2Q6LCD55So77yJ4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgICByZWZyZXNoU2VsZWN0ZWRHaXptb3MoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkUGF0aHMgPSBTZXJ2aWNlLlNlbGVjdGlvbj8ucXVlcnk/LigpID8/IFtdO1xuICAgICAgICBsZXQgcmVmcmVzaGVkID0gZmFsc2U7XG4gICAgICAgIGZvciAoY29uc3QgcGF0aCBvZiBzZWxlY3RlZFBhdGhzKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gZ2V0Tm9kZUJ5UGF0aChwYXRoKTtcbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbk5vZGVDaGFuZ2VkKG5vZGUpO1xuICAgICAgICAgICAgICAgIHJlZnJlc2hlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlZnJlc2hlZCkge1xuICAgICAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRWRpdG9yT3BlbmVkKCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9oYXNFZGl0b3JPcGVuZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmNsZWFyQWxsR2l6bW9zKCk7XG4gICAgICAgIC8vIOS4jiBDcmVhdG9yIG9uU2NlbmVPcGVuZWQg5LiA6Ie077ya5Zy65pmv5Yqg6L295ZCOIGFjdGl2ZSDmiY3lj6/pnaDvvIzmr4/mrKHmiZPlvIDpg73lm57liLDnp7vliqjlt6XlhbfjgIJcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1Ub29sTmFtZSA9ICdwb3NpdGlvbic7XG4gICAgICAgIHRoaXMuX3Nob3dJY29uR2l6bW9zRm9yU2NlbmUoKTtcbiAgICAgICAgLy8g57yW6L6R5Zmo5omT5byAL+mHjei9veWQjuiKgueCueWSjOe7hOS7tuWvueixoeWPr+iDveW3sumHjeW7uu+8jOS/neeVmemAieaLqei3r+W+hOW5tumHjeaWsOaMguWIsOaWsOe7hOS7tuS4iuOAglxuICAgICAgICB0aGlzLl9yZXNlbGVjdEN1cnJlbnRTZWxlY3Rpb24oKTtcbiAgICAgICAgLy8gQ2FtZXJhLm9uRWRpdG9yT3BlbmVkIOS8muW8guatpeaBouWkjeinhuWbvu+8m+W7tuWQjuS4gOW4p+WGjeihpeazqOWGjOW5tuWIt+aWsOS4lueVjOWdkOagh+i9tOOAglxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIC8vIGluaXQg6Zi25q6157yW6L6R5Zmo55u45py66L+Y5LiN5a2Y5Zyo77yMcmVnaXN0ZXJDYW1lcmFNb3ZlZEV2ZW50IOmdmem7mOWksei0pe+8jOatpOWkhOihpeazqOWGjFxuICAgICAgICAgICAgdGhpcy5fd29ybGRBeGlzQ29udHJvbGxlcj8ucmVnaXN0ZXJDYW1lcmFNb3ZlZEV2ZW50KCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMudHJhbnNmb3JtVG9vbERhdGEuaXMyRCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dvcmxkQXhpc0NvbnRyb2xsZXI/LnNob3coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3dvcmxkQXhpc0NvbnRyb2xsZXI/Lm9uRWRpdG9yQ2FtZXJhTW92ZWQoKTtcbiAgICAgICAgICAgIFNlcnZpY2UuRW5naW5lPy5yZXBhaW50SW5FZGl0TW9kZT8uKCk7XG4gICAgICAgIH0sIDMwMCk7XG4gICAgfVxuXG4gICAgb25FZGl0b3JDbG9zZWQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc2F2ZUNvbmZpZygpO1xuICAgIH1cblxuICAgIG9uTm9kZUNoYW5nZWQobm9kZTogTm9kZSwgb3B0cz86IElDaGFuZ2VOb2RlT3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybjtcbiAgICAgICAgLy8g5YWJ54Wn5o6i6ZKI5pWw5o2u5Y+Y5YyW77yI5aaC5o6i6ZKI57uE6YeN5paw55Sf5oiQ77yJ5pe277yM5o6i6ZKI57uE6Ieq6Lqr6IqC54K55Lya5pS25Yiw6K+l5LqL5Lu277yMXG4gICAgICAgIC8vIOS9huWPl+WFtuW9seWTjeeahCBtZXNoIOeahOWbm+mdouS9k+mrmOS6ruaMguWcqOWIq+eahOiKgueCueS4iu+8jOmcgOS4u+WKqOmAmuefpemAieS4reeahOaOoumSiOa2iOi0ueiAheWIt+aWsOOAglxuICAgICAgICBpZiAob3B0cz8udHlwZSA9PT0gTm9kZUV2ZW50VHlwZS5MSUdIVF9QUk9CRV9DSEFOR0VEIHx8IG9wdHM/LnR5cGUgPT09IE5vZGVFdmVudFR5cGUuTElHSFRfUFJPQkVfQkFLSU5HX0NIQU5HRUQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlUHJvYmVDb25zdW1lcnNSZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGFzID0gdGhpcy5fc2VsZWN0aW9uLmluY2x1ZGVzKG5vZGUudXVpZCk7XG5cbiAgICAgICAgd2Fsa05vZGVDb21wb25lbnQobm9kZSwgKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpc0hhY2tDb21wID0gY29tcG9uZW50IGluc3RhbmNlb2YgSGFja1RyYW5zZm9ybUNvbXBvbmVudCB8fFxuICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KS5fX2NsYXNzbmFtZV9fID09PSAnX0VkaXRvckhhY2tUcmFuc2Zvcm1Db21wb25lbnRfJztcbiAgICAgICAgICAgIGlmICghaXNIYWNrQ29tcCAmJiAoIWNvbXBvbmVudC5lbmFibGVkIHx8ICFub2RlLmFjdGl2ZSB8fCAhbm9kZS5wYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhcykgdGhpcy5fcmVtb3ZlR2l6bW8oJ2NvbXBvbmVudCcsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlR2l6bW8oJ2ljb24nLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZUdpem1vKCdwZXJzaXN0ZW50JywgY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBnaXptbzogR2l6bW9CYXNlIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgaWYgKGhhcykge1xuICAgICAgICAgICAgICAgIGdpem1vID0gZ2V0R2l6bW9Qcm9wZXJ0eSgnY29tcG9uZW50JywgY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICBpZiAoZ2l6bW8pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChnaXptbyBhcyBhbnkpLm9uTm9kZUNoYW5nZWQgJiYgZ2l6bW8uY2hlY2tWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChnaXptbyBhcyBhbnkpLm9uTm9kZUNoYW5nZWQob3B0cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zaG93R2l6bW8oJ2NvbXBvbmVudCcsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnaXptbyA9IGdldEdpem1vUHJvcGVydHkoJ3BlcnNpc3RlbnQnLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgaWYgKGdpem1vKSB7XG4gICAgICAgICAgICAgICAgaWYgKChnaXptbyBhcyBhbnkpLm9uTm9kZUNoYW5nZWQgJiYgZ2l6bW8uY2hlY2tWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgKGdpem1vIGFzIGFueSkub25Ob2RlQ2hhbmdlZChvcHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dHaXptbygncGVyc2lzdGVudCcsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdpem1vID0gZ2V0R2l6bW9Qcm9wZXJ0eSgnaWNvbicsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoZ2l6bW8pIHtcbiAgICAgICAgICAgICAgICBpZiAoKGdpem1vIGFzIGFueSkub25Ob2RlQ2hhbmdlZCAmJiBnaXptby5jaGVja1Zpc2libGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAoZ2l6bW8gYXMgYW55KS5vbk5vZGVDaGFuZ2VkKG9wdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd0dpem1vKCdpY29uJywgY29tcG9uZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9wdHM/LnR5cGUgIT09IE5vZGVFdmVudFR5cGUuQ0hJTERfQ0hBTkdFRFxuICAgICAgICAgICAgJiYgb3B0cz8udHlwZSAhPT0gTm9kZUV2ZW50VHlwZS5MSUdIVF9QUk9CRV9DSEFOR0VEXG4gICAgICAgICAgICAmJiBvcHRzPy50eXBlICE9PSBOb2RlRXZlbnRUeXBlLkxJR0hUX1BST0JFX0JBS0lOR19DSEFOR0VEKSB7XG4gICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbk5vZGVDaGFuZ2VkKGNoaWxkLCBvcHRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgU2VydmljZS5FbmdpbmU/LnJlcGFpbnRJbkVkaXRNb2RlPy4oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhYnnhafmjqLpkojmlbDmja7lj5jljJbml7bvvIzpgJrnn6XlvZPliY3pgInkuK3oioLngrnkuIrnmoTnu4Tku7YgZ2l6bW/vvIjlpoIgbWVzaC9za2lubmVkIOeahOW9seWTjeWbm+mdouS9k++8ieWIt+aWsOOAglxuICAgICAqIHRldHJhIGhlbHBlciDlhoXpg6jmjInnrb7lkI3nn63ot6/vvIzph43lpI3osIPnlKjmmK/lu4nku7fnmoTjgIJcbiAgICAgKi9cbiAgICBwcml2YXRlIF9ub3RpZnlMaWdodFByb2JlQ2hhbmdlZCgpOiB2b2lkIHtcbiAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIHRoaXMuX3NlbGVjdGlvbikge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGdldE5vZGVCeVV1aWQodXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIGNvbnRpbnVlO1xuICAgICAgICAgICAgd2Fsa05vZGVDb21wb25lbnQobm9kZSwgKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ2l6bW8gPSBnZXRHaXptb1Byb3BlcnR5KCdjb21wb25lbnQnLCBjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgIGlmIChnaXptbyAmJiAoZ2l6bW8gYXMgYW55KS5vbkxpZ2h0UHJvYmVDaGFuZ2VkICYmIGdpem1vLmNoZWNrVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIChnaXptbyBhcyBhbnkpLm9uTGlnaHRQcm9iZUNoYW5nZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3Byb2JlUmVmcmVzaFNjaGVkdWxlZCA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICog5Y675oqW77ya54OY54SZ5LqL5Lu277yITElHSFRfUFJPQkVfQkFLSU5HX0NIQU5HRUTvvInkvJrlnKjlnLrmma/miYDmnInoioLngrnkuIrlkIzmraUgZW1pdO+8jFxuICAgICAqIOeUqOW+ruS7u+WKoeaKiui/meS4gOazouaKmOWPoOaIkOS4gOasoeWIt+aWsO+8jOmBv+WFjeavj+iKgueCueS4gOasoeWvvOiHtOeahOmHjeWkjemHjeW7uuOAglxuICAgICAqL1xuICAgIHByaXZhdGUgX3NjaGVkdWxlUHJvYmVDb25zdW1lcnNSZWZyZXNoKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fcHJvYmVSZWZyZXNoU2NoZWR1bGVkKSByZXR1cm47XG4gICAgICAgIHRoaXMuX3Byb2JlUmVmcmVzaFNjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcHJvYmVSZWZyZXNoU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9ub3RpZnlMaWdodFByb2JlQ2hhbmdlZCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkNvbXBvbmVudEFkZGVkKGNvbXA6IENvbXBvbmVudCk6IHZvaWQge1xuICAgICAgICBjb25zdCBub2RlID0gY29tcC5ub2RlO1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGlvbi5pbmNsdWRlcyhub2RlLnV1aWQpKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dBbGxHaXptb09mTm9kZShub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uQ29tcG9uZW50UmVtb3ZlZChjb21wOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlR2l6bW8oJ2ljb24nLCBjb21wKTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlR2l6bW8oJ3BlcnNpc3RlbnQnLCBjb21wKTtcbiAgICAgICAgY29uc3QgY29tcEdpem1vID0gZ2V0R2l6bW9Qcm9wZXJ0eSgnY29tcG9uZW50JywgY29tcCk7XG4gICAgICAgIGlmIChjb21wR2l6bW8pIHtcbiAgICAgICAgICAgIHRoaXMuX2hpZGVHaXptbyhjb21wR2l6bW8pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Ob2RlQWRkZWQobm9kZTogTm9kZSk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0aW9uLmluY2x1ZGVzKG5vZGUudXVpZCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0FsbEdpem1vT2ZOb2RlKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Ob2RlUmVtb3ZlZChub2RlOiBOb2RlKTogdm9pZCB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsR2l6bW9PZk5vZGUobm9kZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciBHaXptb01hbmFnZXIub25EaW1lbnNpb25DaGFuZ2VkIOS4gOiHtFxuICAgIG9uRGltZW5zaW9uQ2hhbmdlZChfaXMyRDogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLnNldFRvb2xzVmlzaWJpbGl0eTNkKEdpem1vQ29uZmlnLnRvb2xzVmlzaWJpbGl0eTNkKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zaG93SWNvbkdpem1vc0ZvclNjZW5lKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzY2VuZSA9IChjYyBhcyBhbnkpLmRpcmVjdG9yPy5nZXRTY2VuZSgpO1xuICAgICAgICBpZiAoIXNjZW5lKSByZXR1cm47XG4gICAgICAgIHRoaXMuX3dhbGtTY2VuZUZvckljb25zKHNjZW5lKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF93YWxrU2NlbmVGb3JJY29ucyhub2RlOiBOb2RlKTogdm9pZCB7XG4gICAgICAgIGlmICghbm9kZSB8fCBpc0VkaXRvck5vZGUobm9kZSkpIHJldHVybjtcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IG5vZGUuY29tcG9uZW50cztcbiAgICAgICAgaWYgKGNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBjb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGpzLmdldENsYXNzTmFtZShjb21wKTtcbiAgICAgICAgICAgICAgICBpZiAoR2l6bW9EZWZpbmVzLmljb25HaXptby5oYXMoY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zaG93R2l6bW8oJ2ljb24nLCBjb21wKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKEdpem1vRGVmaW5lcy5wZXJzaXN0ZW50R2l6bW8uaGFzKGNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2hvd0dpem1vKCdwZXJzaXN0ZW50JywgY29tcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Fsa1NjZW5lRm9ySWNvbnMoY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g4pSA4pSAIFNlbGVjdGlvbiByZWdpb24gKOS4jiBjb2Nvcy1lZGl0b3IgR2l6bW9NYW5hZ2VyIOS4gOiHtCkg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgICBzaG93U2VsZWN0aW9uUmVnaW9uKGxlZnQ6IG51bWJlciwgcmlnaHQ6IG51bWJlciwgdG9wOiBudW1iZXIsIGJvdHRvbTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGNhbWVyYUNvbXAgPSAoU2VydmljZS5DYW1lcmEgYXMgYW55KT8uZ2V0Q2FtZXJhPy4oKTtcbiAgICAgICAgaWYgKCFjYW1lcmFDb21wKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgcG9zMCA9IG5ldyBWZWMzKGxlZnQsIGJvdHRvbSwgMC4xKTtcbiAgICAgICAgY29uc3QgcG9zMSA9IG5ldyBWZWMzKHJpZ2h0LCBib3R0b20sIDAuMSk7XG4gICAgICAgIGNvbnN0IHBvczIgPSBuZXcgVmVjMyhyaWdodCwgdG9wLCAwLjEpO1xuICAgICAgICBjb25zdCBwb3MzID0gbmV3IFZlYzMobGVmdCwgdG9wLCAwLjEpO1xuICAgICAgICBjb25zdCBwMCA9IG5ldyBWZWMzKCk7XG4gICAgICAgIGNvbnN0IHAxID0gbmV3IFZlYzMoKTtcbiAgICAgICAgY29uc3QgcDIgPSBuZXcgVmVjMygpO1xuICAgICAgICBjb25zdCBwMyA9IG5ldyBWZWMzKCk7XG4gICAgICAgIGNhbWVyYUNvbXAuc2NyZWVuVG9Xb3JsZChwb3MwLCBwMCk7XG4gICAgICAgIGNhbWVyYUNvbXAuc2NyZWVuVG9Xb3JsZChwb3MxLCBwMSk7XG4gICAgICAgIGNhbWVyYUNvbXAuc2NyZWVuVG9Xb3JsZChwb3MyLCBwMik7XG4gICAgICAgIGNhbWVyYUNvbXAuc2NyZWVuVG9Xb3JsZChwb3MzLCBwMyk7XG5cbiAgICAgICAgY29uc3QgZ2VvbWV0cnlSZW5kZXJlciA9IChTZXJ2aWNlLkVuZ2luZSBhcyBhbnkpPy5nZXRHZW9tZXRyeVJlbmRlcmVyPy4oKTtcbiAgICAgICAgaWYgKGdlb21ldHJ5UmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGdlb21ldHJ5UmVuZGVyZXIucmVtb3ZlRGF0YSgnYWRkUXVhZCcpO1xuICAgICAgICAgICAgZ2VvbWV0cnlSZW5kZXJlci5hZGRRdWFkKHAwLCBwMSwgcDIsIHAzLCBuZXcgQ29sb3IoMjU1LCAyNTUsIDI1NSwgMTIwKSwgZmFsc2UsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgIH1cblxuICAgIGhpZGVTZWxlY3Rpb25SZWdpb24oKTogdm9pZCB7XG4gICAgICAgIChTZXJ2aWNlLkVuZ2luZSBhcyBhbnkpPy5nZXRHZW9tZXRyeVJlbmRlcmVyPy4oKT8ucmVtb3ZlRGF0YSgnYWRkUXVhZCcpO1xuICAgICAgICBTZXJ2aWNlLkVuZ2luZT8ucmVwYWludEluRWRpdE1vZGU/LigpO1xuICAgIH1cblxuICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgR2l6bW9NYW5hZ2VyLmV4ZWNHaXptb01ldGhvZHMg5LiA6Ie0XG4gICAgZXhlY0dpem1vTWV0aG9kcyhuYW1lOiBzdHJpbmcsIGZ1bmNOYW1lOiBzdHJpbmcsIHBhcmFtczogYW55W10gPSBbXSk6IGFueSB7XG4gICAgICAgIGNvbnN0IG1ldGhvZHMgPSAoR2l6bW9EZWZpbmVzIGFzIGFueSkubWV0aG9kcz8uZ2V0Py4obmFtZSk7XG4gICAgICAgIGlmICghbWV0aG9kcyB8fCAhbWV0aG9kc1tmdW5jTmFtZV0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWV0aG9kc1tmdW5jTmFtZV0oLi4ucGFyYW1zKTtcbiAgICB9XG5cbiAgICBfY2hhbmdlUmVnaW9uU2VsZWN0TW9kZShtb2RlOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgKEdpem1vT3BlcmF0aW9uIGFzIGFueSkuY2hhbmdlUmVnaW9uU2VsZWN0TW9kZT8uKG1vZGUpO1xuICAgIH1cblxuICAgIC8vIOKUgOKUgCBVcGRhdGUg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgICBvblVwZGF0ZShkZWx0YVRpbWU6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgdGhpcy5fc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBnZXROb2RlQnlVdWlkKHV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgd2Fsa05vZGVDb21wb25lbnQobm9kZSwgKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBHaXptbyA9IGdldEdpem1vUHJvcGVydHkoJ2NvbXBvbmVudCcsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wR2l6bW8gJiYgY29tcEdpem1vLmNoZWNrVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wR2l6bW8udXBkYXRlKGRlbHRhVGltZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBTY2VuZSBub3QgcmVhZHlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==