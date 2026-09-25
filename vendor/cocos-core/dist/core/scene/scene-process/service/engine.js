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
exports.NeedAnimState = exports.EngineService = void 0;
const time_1 = __importDefault(require("./engine/time"));
const cc_1 = require("cc");
const geometry_renderer_1 = require("./engine/geometry_renderer");
const core_1 = require("./core");
const global_events_1 = require("./core/global-events");
const decorator_1 = require("./core/decorator");
const common_1 = require("../../common");
const rpc_1 = require("../rpc");
const service_manager_1 = require("./service-manager");
const timer_util_1 = require("./utils/timer-util");
const tickTime = 1000 / 60;
// Engine Layers reserves bits 20-31 for built-ins; user custom layers live in bit positions 0-19.
const USER_LAYER_MIN_BIT = 0;
const USER_LAYER_MAX_BIT = 19;
const layerMask = [];
for (let i = USER_LAYER_MIN_BIT; i <= USER_LAYER_MAX_BIT; i++) {
    layerMask[i] = 1 << i;
}
// 与 cocos-editor 一致：控制连续 tick 的状态枚举
var NeedAnimState;
(function (NeedAnimState) {
    NeedAnimState[NeedAnimState["CAMERA_ORBIT"] = 0] = "CAMERA_ORBIT";
    NeedAnimState[NeedAnimState["CAMERA_PAN"] = 1] = "CAMERA_PAN";
    NeedAnimState[NeedAnimState["CAMERA_WANDER"] = 2] = "CAMERA_WANDER";
    NeedAnimState[NeedAnimState["ANIMATION_MODE"] = 3] = "ANIMATION_MODE";
    NeedAnimState[NeedAnimState["PARTICLE_SYSTEM_MODE"] = 4] = "PARTICLE_SYSTEM_MODE";
    NeedAnimState[NeedAnimState["TERRAIN_SYSTEM_MODE"] = 5] = "TERRAIN_SYSTEM_MODE";
    NeedAnimState[NeedAnimState["GAME_VIEW_MODE"] = 6] = "GAME_VIEW_MODE";
})(NeedAnimState || (exports.NeedAnimState = NeedAnimState = {}));
/**
 * 引擎管理器，用于引擎相关操作
 */
let EngineService = class EngineService extends core_1.BaseService {
    _setTimeoutId = null;
    _rafId = null;
    _maxDeltaTimeInEM = 1 / 30;
    _stateRecord = 0; // 记录当前状态
    _shouldRepaintInEM = false; // 强制引擎渲染一帧
    _tickInEM = false;
    _tickedFrameInEM = -1;
    _paused = false;
    _capture = false; // 抓帧时定时器需要切换
    _bindTick = this._tick.bind(this);
    geometryRenderer;
    _sceneTick = false; // tick 是否暂停
    _nodeChangeTimer = new timer_util_1.TimerUtil();
    // 与 cocos-editor ParticleManager 一致：跟踪选中的粒子和手动停止状态
    _particleSelectedUUIDs = [];
    _stoppedParticleSet = new WeakSet();
    async init() {
        cc.game.pause(); // 暂停引擎的 mainLoop
        this.geometryRenderer = new geometry_renderer_1.GeometryRenderer();
        this.startTick();
        this._sceneTick = await rpc_1.Rpc.getInstance().request('sceneConfigInstance', 'get', ['tick']);
        console.log('sceneTick: ' + this._sceneTick);
    }
    setTimeout(callback, time) {
        if (this._capture) {
            this._rafId = requestAnimationFrame(callback);
        }
        else {
            this._setTimeoutId = setTimeout(callback, time);
        }
    }
    clearTimeout() {
        if (this._setTimeoutId) {
            clearTimeout(this._setTimeoutId);
            this._setTimeoutId = null;
        }
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }
    async repaintInEditMode() {
        // 避免 tickInEditMode() 在同一帧执行时又调到这里，导致下一帧又执行 tickInEditMode，陷入循环
        if (this._tickedFrameInEM !== cc_1.director.getTotalFrames()) {
            this._shouldRepaintInEM = true;
        }
    }
    forceRepaintInEditMode() {
        this._shouldRepaintInEM = true;
        if (this._paused) {
            this._shouldRepaintInEM = false;
            this.tickInEditMode(0);
            this.broadcast('engine:update');
            try {
                decorator_1.Service.Camera?.onUpdate?.(0);
            }
            catch { /* not registered yet */ }
            try {
                decorator_1.Service.Gizmo?.onUpdate?.(0);
            }
            catch { /* not registered yet */ }
            this.broadcast('engine:ticked');
        }
    }
    /**
     * 渲染调试视图（DebugView）：单一通道调试 / 组合光照项开关 / 纯光照带固有色 / 级联阴影染色。
     * 与 cocos-editor scene-facade-manager.changeDebugOption 对齐。
     * 注意：不对外暴露为公共 API（未加入 IEngineService / EngineProxy，不生成到 cocos-cli-types）；
     * 目前仅由场景编辑器页面（scene-editor.ejs）在浏览器内通过 window.cli.Scene.Engine 直接调用。
     * @param key 'single' | 'composite' | 'LIGHTING_WITH_BASE_COLOR' | 'CSM_LAYER_COLORATION'
     * @param value single: DebugViewSingleType 数值；composite: { key: DebugViewCompositeType | 10000(=ALL), value: boolean }；其余: boolean
     */
    async changeDebugOption(key, value) {
        // debugView 未在 Root 类型里声明；2D 或引擎未就绪时可能为空
        const debugView = cc_1.director.root?.debugView;
        if (!debugView) {
            return;
        }
        switch (key) {
            case 'single':
                // 渲染单项调试模式
                debugView.singleMode = value;
                break;
            case 'composite':
                // 渲染组合调试模式（key === 10000 表示全部）
                if (value?.key === 10000) {
                    debugView.enableAllCompositeMode(value.value);
                }
                else {
                    debugView.enableCompositeMode(value?.key, value?.value);
                }
                break;
            case 'LIGHTING_WITH_BASE_COLOR':
                // 光照信息带固有色（纯光照切换）
                debugView.lightingWithAlbedo = value;
                break;
            case 'CSM_LAYER_COLORATION':
                // 级联阴影染色
                debugView.csmLayerColoration = value;
                break;
            default:
                // 未知 key：不做任何变更，直接返回，避免空转重绘
                return;
        }
        void this.repaintInEditMode();
    }
    /* 从服务端拉取当前工程的设计分辨率，同步到 cc.view 并重排已打开场景里的 Canvas。
    *
    * 为什么必须手动重排：编辑器模式（EDITOR_NOT_IN_PREVIEW）下 cc.Canvas 不会注册
    * 'design-resolution-changed' 监听（只有预览/运行模式才注册），只在场景实例化的 __preload 里
    * 调 fitDesignResolution_EDITOR 对齐一次。因此改分辨率后：新实例化的场景会自动对齐，但
    * 已打开、未重新实例化的场景不会更新——需要在这里手动调 fitDesignResolution_EDITOR
    * （与 cocos-editor startup.initDesignResolution 的重排逻辑一致）。
    *
    * 在打开场景、重开同一场景、以及选中节点时都会调用：由于浏览器场景收不到主进程的配置变更推送，
    * 只能在这些交互时机主动拉取比对。cc.view 未变化时直接返回（每次仅一次极小的读取），
    * 变化时才更新并重排——因为 cc.view 每次变化都会连同重排当前场景，故不会出现“已更新但场景未重排”的情况。
    */
    async syncDesignResolution() {
        try {
            const view = cc.view;
            if (!view || typeof fetch !== 'function') {
                return;
            }
            const serverURL = service_manager_1.serviceManager.getServerUrl();
            const res = await fetch(`${serverURL}/scripting/engine/design-resolution`);
            const dr = await res.json();
            const width = Number(dr?.width);
            const height = Number(dr?.height);
            if (Number.isNaN(width) || Number.isNaN(height)) {
                return;
            }
            const size = view.getDesignResolutionSize();
            if (size && size.width === width && size.height === height) {
                return; // 未变化，无需处理
            }
            // 保持与场景进程启动时一致的 ResolutionPolicy
            view.setDesignResolutionSize(width, height, view.getResolutionPolicy());
            // 手动对齐已打开场景里的 Canvas（编辑器模式不会自动响应 design-resolution-changed）
            const scene = cc_1.director.getScene();
            if (scene) {
                const canvases = scene.getComponentsInChildren('cc.Canvas');
                canvases.forEach((canvas) => {
                    if (!canvas || !canvas.node) {
                        return;
                    }
                    // 带 Widget 的 Canvas 由 Widget 对齐；未激活/未启用的跳过
                    if (canvas.node.getComponent('cc.Widget') || !canvas.node.active || !canvas.enabled) {
                        return;
                    }
                    canvas.fitDesignResolution_EDITOR?.();
                });
            }
            void this.repaintInEditMode();
        }
        catch (error) {
            console.debug('[Engine] syncDesignResolution failed:', error);
        }
    }
    async initCustomLayer(layers) {
        if (!Array.isArray(layers)) {
            return;
        }
        for (let i = USER_LAYER_MIN_BIT; i <= USER_LAYER_MAX_BIT; i++) {
            cc.Layers.deleteLayer(i);
        }
        layers.forEach((layer) => {
            const index = layerMask.findIndex((num) => layer.value === num);
            if (index !== -1) {
                cc.Layers.addLayer(layer.name, index);
            }
        });
    }
    /**
     * 运行时重建物理碰撞分组枚举（cc.internal.PhysicsGroup / PhysicsGroup2D）。
     *
     * 分组只在 cc.game.init 时从 physics.collisionGroups 读一次并生成枚举，改配置后不重建就要重启 IDE
     * （属性面板 Group 下拉的 enumList 直接来自该枚举）。这里对齐 cocos-editor 的 updatePhysicsGroup：
     * 用 cc.Enum.update 就地更新枚举，再对当前选中节点广播 node:change，让属性面板重新 dump 拿到新分组。
     *
     * 与 cocos-editor 不同点：这里按「内置 DEFAULT + 当前分组」完整重建，先清掉所有旧的用户分组条目，
     * 以支持分组的删除 / 重命名（editor 只做覆盖，删除后残留旧项）。
     */
    updatePhysicsGroup(groups = []) {
        const internal = cc.internal;
        const enums = [internal?.PhysicsGroup, internal?.PhysicsGroup2D].filter(Boolean);
        if (!enums.length) {
            return;
        }
        // 引擎内置 DEFAULT 分组（PhysicsGroup / PhysicsGroup2D 均为 1<<0），恒定保留
        const DEFAULT_VALUE = 1 << 0;
        // 目标用户分组（name→value）
        const desired = {};
        (groups || []).forEach((group) => {
            if (!group || typeof group.index !== 'number' || !group.name) {
                return;
            }
            desired[group.name] = 1 << group.index;
        });
        enums.forEach((e) => {
            // 先移除所有非内置（DEFAULT）的旧用户分组条目，含 name→value 与 value→name 反向映射，
            // 这样删除 / 重命名的分组不会残留。__enums__ 必须保留，否则 Enum.isEnum 失败、Enum.update 抛错。
            for (const key of Object.keys(e)) {
                if (key === '__enums__') {
                    continue;
                }
                const v = e[key];
                if (typeof v === 'number') {
                    // name → value 条目
                    if (v !== DEFAULT_VALUE) {
                        delete e[key];
                    }
                }
                else if (typeof v === 'string') {
                    // value → name 反向映射
                    if (Number(key) !== DEFAULT_VALUE) {
                        delete e[key];
                    }
                }
            }
            Object.assign(e, desired);
            cc.Enum.update(e);
        });
        // 通知属性面板重新 dump，刷新 Group 下拉。
        // 关键：仅「路径级」node:change 只刷新属性“值”，不会重取 enumList（元数据）；必须像 setProperty
        // 那样带上具体属性的 propPath（node.components 里碰撞体的 group），面板才会重 dump 该属性、更新下拉
        // 选项。这与用户“切换 group 后才出现新分组”走的是同一条通道。
        const NodeMgr = (cc.EditorExtends || globalThis.EditorExtends)?.Node;
        const selection = (0, decorator_1.queryRegisteredService)('Selection');
        const paths = selection?.query?.() ?? [];
        for (const path of paths) {
            if (!path) {
                continue;
            }
            const node = NodeMgr?.getNodeByPath?.(path);
            if (!node) {
                // 定位不到节点时，退回路径级 node:change
                global_events_1.ServiceEvents.broadcast('node:change', path);
                continue;
            }
            const comps = node.components || [];
            let matched = false;
            comps.forEach((comp, index) => {
                // 碰撞体（Collider / Collider2D）用 group 属性引用 PhysicsGroup 枚举
                if (comp && typeof comp.group === 'number') {
                    matched = true;
                    global_events_1.ServiceEvents.emit('node:change', node, { type: common_1.NodeEventType.SET_PROPERTY, propPath: `_components.${index}.group` });
                }
            });
            if (!matched) {
                // 选中节点上没有碰撞体：仍发一次路径级 node:change 兜底
                global_events_1.ServiceEvents.broadcast('node:change', path);
            }
        }
    }
    setFrameRate(fps) {
        this._maxDeltaTimeInEM = 1 / fps;
    }
    startTick() {
        if (this._setTimeoutId === null) {
            this._tick();
        }
    }
    stopTick() {
        this.clearTimeout();
    }
    tickInEditMode(deltaTime) {
        this._tickedFrameInEM = cc_1.director.getTotalFrames();
        if (this.geometryRenderer) {
            this.geometryRenderer.flush();
        }
        cc_1.director.tick(deltaTime);
    }
    getGeometryRenderer() {
        return this.geometryRenderer;
    }
    enterState(state) {
        this._stateRecord |= 1 << state;
        this._updateTickState();
    }
    exitState(state) {
        this._stateRecord &= ~(1 << state);
        this._updateTickState();
    }
    enterAnimationMode() {
        this.enterState(NeedAnimState.ANIMATION_MODE);
    }
    exitAnimationMode() {
        this.exitState(NeedAnimState.ANIMATION_MODE);
    }
    resume() {
        this._paused = false;
        this.startTick();
    }
    pause() {
        this.stopTick();
        this._paused = true;
    }
    // 与 cocos-editor 一致：检查节点是否含有粒子/地形组件，控制连续 tick
    checkToSetAnimState(nodes) {
        let hasParticleComp = false;
        let hasTerrain = false;
        nodes.forEach((node) => {
            if (node && node.components) {
                node.components.forEach((component) => {
                    const className = cc.js.getClassName(component);
                    if (className === 'cc.ParticleSystem' || className === 'cc.ParticleSystem2D') {
                        hasParticleComp = true;
                    }
                    else if (className === 'cc.Terrain') {
                        hasTerrain = true;
                    }
                });
            }
        });
        if (hasParticleComp) {
            this.enterState(NeedAnimState.PARTICLE_SYSTEM_MODE);
        }
        else {
            this.exitState(NeedAnimState.PARTICLE_SYSTEM_MODE);
        }
        if (hasTerrain) {
            this.enterState(NeedAnimState.TERRAIN_SYSTEM_MODE);
        }
        else {
            this.exitState(NeedAnimState.TERRAIN_SYSTEM_MODE);
        }
    }
    _tick() {
        try {
            if (this._paused)
                return;
            this.setTimeout(this._bindTick, tickTime);
            const now = performance.now() / 1000;
            time_1.default.update(now, false, this._maxDeltaTimeInEM);
            if (this._isTickAllowed()) {
                this._shouldRepaintInEM = false;
                this.tickInEditMode(time_1.default.deltaTime);
                this.broadcast('engine:update');
                // Dispatch per-frame updates to Camera and Gizmo services
                try {
                    decorator_1.Service.Camera?.onUpdate?.(time_1.default.deltaTime);
                }
                catch { /* not registered yet */ }
                try {
                    decorator_1.Service.Gizmo?.onUpdate?.(time_1.default.deltaTime);
                }
                catch { /* not registered yet */ }
            }
            this.broadcast('engine:ticked');
        }
        catch (e) {
            console.error(e);
        }
    }
    _updateTickState() {
        this._tickInEM = this._stateRecord > 0;
    }
    _isTickAllowed() {
        return this._sceneTick || this._shouldRepaintInEM || this._tickInEM;
    }
    get capture() {
        return this._capture;
    }
    set capture(b) {
        this._capture = b;
    }
    _getNodeByPath(path) {
        const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
        return EditorExtends?.Node?.getNodeByPath?.(path) ?? null;
    }
    _getNodeByUuid(uuid) {
        const EditorExtends = cc.EditorExtends || globalThis.EditorExtends;
        return EditorExtends?.Node?.getNode?.(uuid) ?? null;
    }
    //
    onEditorOpened() {
        void this.repaintInEditMode();
    }
    onEditorClosed() {
        this._nodeChangeTimer.clear();
        void this.repaintInEditMode();
    }
    onEditorReload() {
        void this.repaintInEditMode();
    }
    onNodeChanged(node, opts) {
        this._nodeChangeTimer.callFunctionLimit(node.uuid, this._doNodeChanged.bind(this), node, opts);
    }
    _doNodeChanged(node, opts) {
        const type = opts?.type;
        if (type === common_1.NodeEventType.TRANSFORM_CHANGED ||
            type === common_1.NodeEventType.SIZE_CHANGED ||
            type === common_1.NodeEventType.ANCHOR_CHANGED ||
            type === common_1.NodeEventType.COMPONENT_CHANGED ||
            type === common_1.NodeEventType.PARENT_CHANGED ||
            type === common_1.NodeEventType.CHILD_CHANGED) {
            // 与 cocos-editor 一致：这些类型不需要重新检查状态
        }
        else {
            this.checkToSetAnimState([node]);
        }
        void this.repaintInEditMode();
    }
    onComponentAdded(comp) {
        const nodeUuids = decorator_1.Service.Selection?.query?.() ?? [];
        if (comp.node && nodeUuids.includes(comp.node.uuid)) {
            this.checkToSetAnimState([comp.node]);
            if (this._isParticleSystem3D(comp) && !comp.isPlaying) {
                comp.play();
            }
        }
        void this.repaintInEditMode();
    }
    onComponentRemoved(comp) {
        const nodeUuids = decorator_1.Service.Selection?.query?.() ?? [];
        if (comp.node && nodeUuids.includes(comp.node.uuid)) {
            this.checkToSetAnimState([comp.node]);
        }
        void this.repaintInEditMode();
    }
    onSetPropertyComponent() {
        void this.repaintInEditMode();
    }
    // 与 cocos-editor SceneSelection 一致：选中/反选时检查粒子/地形组件
    onSelectionSelect(path, paths) {
        const nodes = [];
        for (const p of paths) {
            const node = this._getNodeByPath(p);
            if (node)
                nodes.push(node);
        }
        this.checkToSetAnimState(nodes);
        const uuids = nodes.map(n => n.uuid);
        this._playParticlesOnSelect(uuids);
        void this.repaintInEditMode();
    }
    onSelectionUnselect(path, paths) {
        const unselectedNode = this._getNodeByPath(path);
        const nodes = [];
        for (const p of paths) {
            const node = this._getNodeByPath(p);
            if (node)
                nodes.push(node);
        }
        const remaining = nodes.filter(n => n !== unselectedNode);
        this.checkToSetAnimState(remaining);
        const uuids = nodes.map(n => n.uuid);
        this._pauseParticlesOnUnselect(uuids);
        void this.repaintInEditMode();
    }
    onSelectionClear() {
        this.checkToSetAnimState([]);
        this._stopAllParticles();
        void this.repaintInEditMode();
    }
    // 与 cocos-editor ParticleManager 一致：选中时播放粒子系统
    _playParticlesOnSelect(uuids) {
        this._particleSelectedUUIDs = uuids.slice();
        const components = this._getSelectedParticleSystems();
        const willPlay = components.some(item => !this._stoppedParticleSet.has(item));
        if (willPlay) {
            components.forEach(item => this._stoppedParticleSet.delete(item));
        }
        components.forEach((ps) => {
            if (!ps.isPlaying && !this._stoppedParticleSet.has(ps)) {
                ps.play();
            }
        });
    }
    // 与 cocos-editor ParticleManager 一致：取消选中时暂停粒子系统
    _pauseParticlesOnUnselect(uuids) {
        this._getSelectedParticleSystems().forEach((ps) => {
            if (!uuids.includes(ps.node.uuid) && ps.isPlaying) {
                ps.pause();
            }
        });
        this._particleSelectedUUIDs = uuids.slice();
    }
    _stopAllParticles() {
        this._getSelectedParticleSystems().forEach((ps) => {
            if (ps.isPlaying) {
                ps.stop();
            }
        });
        this._particleSelectedUUIDs = [];
    }
    // 与 cocos-editor ParticleManager.getSelectedParticleSystemComponents 一致
    _getSelectedParticleSystems() {
        const result = [];
        const addUnique = (comps) => {
            for (const comp of comps) {
                if (!result.includes(comp)) {
                    result.push(comp);
                }
            }
        };
        const collectInChildren = (node) => {
            const found = [];
            if (node.components) {
                for (const comp of node.components) {
                    if (this._isParticleSystem3D(comp)) {
                        found.push(comp);
                    }
                }
            }
            if (node.children) {
                for (const child of node.children) {
                    found.push(...collectInChildren(child));
                }
            }
            return found;
        };
        const recursivelyAdd = (node) => {
            const hasParticle = node.components?.some((c) => this._isParticleSystem3D(c));
            if (hasParticle) {
                const parent = node.parent;
                if (parent && parent.components?.some((c) => this._isParticleSystem3D(c))) {
                    recursivelyAdd(parent);
                }
                else {
                    addUnique(collectInChildren(node));
                }
            }
        };
        for (const uuid of this._particleSelectedUUIDs) {
            const node = this._getNodeByUuid(uuid);
            if (node) {
                recursivelyAdd(node);
            }
        }
        return result.filter((comp) => comp.enabled);
    }
    // 与 cocos-editor ParticleManager 一致：只处理 3D ParticleSystem
    // ParticleSystem2D 通过 onFocusInEditor → _startPreview 自行处理
    _isParticleSystem3D(comp) {
        return cc.js.getClassName(comp) === 'cc.ParticleSystem';
    }
};
exports.EngineService = EngineService;
exports.EngineService = EngineService = __decorate([
    (0, core_1.register)('Engine')
], EngineService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvc2NlbmUvc2NlbmUtcHJvY2Vzcy9zZXJ2aWNlL2VuZ2luZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7OztBQUViLHlEQUFpQztBQUNqQywyQkFBdUY7QUFDdkYsa0VBQTBGO0FBQzFGLGlDQUErQztBQUMvQyx3REFBcUQ7QUFDckQsZ0RBQW1FO0FBRW5FLHlDQUE2QztBQUM3QyxnQ0FBNkI7QUFDN0IsdURBQW1EO0FBQ25ELG1EQUErQztBQUUvQyxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQzNCLGtHQUFrRztBQUNsRyxNQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztBQUM5QixNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7QUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxrQkFBa0IsRUFBRSxDQUFDLElBQUksa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUM1RCxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBRUQsb0NBQW9DO0FBQ3BDLElBQUssYUFRSjtBQVJELFdBQUssYUFBYTtJQUNkLGlFQUFZLENBQUE7SUFDWiw2REFBVSxDQUFBO0lBQ1YsbUVBQWEsQ0FBQTtJQUNiLHFFQUFjLENBQUE7SUFDZCxpRkFBb0IsQ0FBQTtJQUNwQiwrRUFBbUIsQ0FBQTtJQUNuQixxRUFBYyxDQUFBO0FBQ2xCLENBQUMsRUFSSSxhQUFhLDZCQUFiLGFBQWEsUUFRakI7QUFFRDs7R0FFRztBQUVJLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxrQkFBMEI7SUFDakQsYUFBYSxHQUEwQixJQUFJLENBQUM7SUFDNUMsTUFBTSxHQUFrQixJQUFJLENBQUM7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QnpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgVGltZSBmcm9tICcuL2VuZ2luZS90aW1lJztcbmltcG9ydCB7IENvbXBvbmVudCwgZGlyZWN0b3IsIEdlb21ldHJ5UmVuZGVyZXIgYXMgQ0NHZW9tZXRyeVJlbmRlcmVyLCBOb2RlIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgR2VvbWV0cnlSZW5kZXJlciwgbWV0aG9kcyBhcyBHZW9tZXRyeU1ldGhvZHMgfSBmcm9tICcuL2VuZ2luZS9nZW9tZXRyeV9yZW5kZXJlcic7XG5pbXBvcnQgeyBCYXNlU2VydmljZSwgcmVnaXN0ZXIgfSBmcm9tICcuL2NvcmUnO1xuaW1wb3J0IHsgU2VydmljZUV2ZW50cyB9IGZyb20gJy4vY29yZS9nbG9iYWwtZXZlbnRzJztcbmltcG9ydCB7IFNlcnZpY2UsIHF1ZXJ5UmVnaXN0ZXJlZFNlcnZpY2UgfSBmcm9tICcuL2NvcmUvZGVjb3JhdG9yJztcbmltcG9ydCB0eXBlIHsgSUN1c3RvbUxheWVyQ29uZmlnLCBJRW5naW5lRXZlbnRzLCBJRW5naW5lU2VydmljZSB9IGZyb20gJy4uLy4uL2NvbW1vbic7XG5pbXBvcnQgeyBOb2RlRXZlbnRUeXBlIH0gZnJvbSAnLi4vLi4vY29tbW9uJztcbmltcG9ydCB7IFJwYyB9IGZyb20gJy4uL3JwYyc7XG5pbXBvcnQgeyBzZXJ2aWNlTWFuYWdlciB9IGZyb20gJy4vc2VydmljZS1tYW5hZ2VyJztcbmltcG9ydCB7IFRpbWVyVXRpbCB9IGZyb20gJy4vdXRpbHMvdGltZXItdXRpbCc7XG5cbmNvbnN0IHRpY2tUaW1lID0gMTAwMCAvIDYwO1xuLy8gRW5naW5lIExheWVycyByZXNlcnZlcyBiaXRzIDIwLTMxIGZvciBidWlsdC1pbnM7IHVzZXIgY3VzdG9tIGxheWVycyBsaXZlIGluIGJpdCBwb3NpdGlvbnMgMC0xOS5cbmNvbnN0IFVTRVJfTEFZRVJfTUlOX0JJVCA9IDA7XG5jb25zdCBVU0VSX0xBWUVSX01BWF9CSVQgPSAxOTtcbmNvbnN0IGxheWVyTWFzazogbnVtYmVyW10gPSBbXTtcbmZvciAobGV0IGkgPSBVU0VSX0xBWUVSX01JTl9CSVQ7IGkgPD0gVVNFUl9MQVlFUl9NQVhfQklUOyBpKyspIHtcbiAgICBsYXllck1hc2tbaV0gPSAxIDw8IGk7XG59XG5cbi8vIOS4jiBjb2Nvcy1lZGl0b3Ig5LiA6Ie077ya5o6n5Yi26L+e57utIHRpY2sg55qE54q25oCB5p6a5Li+XG5lbnVtIE5lZWRBbmltU3RhdGUge1xuICAgIENBTUVSQV9PUkJJVCxcbiAgICBDQU1FUkFfUEFOLFxuICAgIENBTUVSQV9XQU5ERVIsXG4gICAgQU5JTUFUSU9OX01PREUsXG4gICAgUEFSVElDTEVfU1lTVEVNX01PREUsXG4gICAgVEVSUkFJTl9TWVNURU1fTU9ERSxcbiAgICBHQU1FX1ZJRVdfTU9ERSxcbn1cblxuLyoqXG4gKiDlvJXmk47nrqHnkIblmajvvIznlKjkuo7lvJXmk47nm7jlhbPmk43kvZxcbiAqL1xuQHJlZ2lzdGVyKCdFbmdpbmUnKVxuZXhwb3J0IGNsYXNzIEVuZ2luZVNlcnZpY2UgZXh0ZW5kcyBCYXNlU2VydmljZTxJRW5naW5lRXZlbnRzPiBpbXBsZW1lbnRzIElFbmdpbmVTZXJ2aWNlIHtcbiAgICBwcml2YXRlIF9zZXRUaW1lb3V0SWQ6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfcmFmSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX21heERlbHRhVGltZUluRU0gPSAxIC8gMzA7XG4gICAgcHJpdmF0ZSBfc3RhdGVSZWNvcmQgPSAwOyAvLyDorrDlvZXlvZPliY3nirbmgIFcbiAgICBwcml2YXRlIF9zaG91bGRSZXBhaW50SW5FTSA9IGZhbHNlOyAvLyDlvLrliLblvJXmk47muLLmn5PkuIDluKdcbiAgICBwcml2YXRlIF90aWNrSW5FTSA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3RpY2tlZEZyYW1lSW5FTSA9IC0xO1xuICAgIHByaXZhdGUgX3BhdXNlZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2NhcHR1cmUgPSBmYWxzZTsvLyDmipPluKfml7blrprml7blmajpnIDopoHliIfmjaJcblxuICAgIHByaXZhdGUgX2JpbmRUaWNrID0gdGhpcy5fdGljay5iaW5kKHRoaXMpO1xuICAgIHByaXZhdGUgZ2VvbWV0cnlSZW5kZXJlciE6IEdlb21ldHJ5UmVuZGVyZXIgJiBQaWNrPENDR2VvbWV0cnlSZW5kZXJlciwgdHlwZW9mIEdlb21ldHJ5TWV0aG9kc1tudW1iZXJdPjtcbiAgICBwcml2YXRlIF9zY2VuZVRpY2sgPSBmYWxzZTsvLyB0aWNrIOaYr+WQpuaaguWBnFxuICAgIHByaXZhdGUgX25vZGVDaGFuZ2VUaW1lciA9IG5ldyBUaW1lclV0aWwoKTtcblxuICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgUGFydGljbGVNYW5hZ2VyIOS4gOiHtO+8mui3n+i4qumAieS4reeahOeykuWtkOWSjOaJi+WKqOWBnOatoueKtuaAgVxuICAgIHByaXZhdGUgX3BhcnRpY2xlU2VsZWN0ZWRVVUlEczogc3RyaW5nW10gPSBbXTtcbiAgICBwcml2YXRlIF9zdG9wcGVkUGFydGljbGVTZXQgPSBuZXcgV2Vha1NldDxDb21wb25lbnQ+KCk7XG4gICAgcHVibGljIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGNjLmdhbWUucGF1c2UoKTsgLy8g5pqC5YGc5byV5pOO55qEIG1haW5Mb29wXG4gICAgICAgIHRoaXMuZ2VvbWV0cnlSZW5kZXJlciA9IG5ldyBHZW9tZXRyeVJlbmRlcmVyKCkgYXMgR2VvbWV0cnlSZW5kZXJlciAmIFBpY2s8Q0NHZW9tZXRyeVJlbmRlcmVyLCB0eXBlb2YgR2VvbWV0cnlNZXRob2RzW251bWJlcl0+O1xuICAgICAgICB0aGlzLnN0YXJ0VGljaygpO1xuICAgICAgICB0aGlzLl9zY2VuZVRpY2sgPSBhd2FpdCBScGMuZ2V0SW5zdGFuY2UoKS5yZXF1ZXN0KCdzY2VuZUNvbmZpZ0luc3RhbmNlJywgJ2dldCcsIFsndGljayddKSBhcyBib29sZWFuO1xuICAgICAgICBjb25zb2xlLmxvZygnc2NlbmVUaWNrOiAnICsgdGhpcy5fc2NlbmVUaWNrKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0VGltZW91dChjYWxsYmFjazogYW55LCB0aW1lOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NhcHR1cmUpIHtcbiAgICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuX3JhZklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoY2FsbGJhY2ssIHRpbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFyVGltZW91dCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NldFRpbWVvdXRJZCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3NldFRpbWVvdXRJZCk7XG4gICAgICAgICAgICB0aGlzLl9zZXRUaW1lb3V0SWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9yYWZJZCkge1xuICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5fcmFmSWQpO1xuICAgICAgICAgICAgdGhpcy5fcmFmSWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHJlcGFpbnRJbkVkaXRNb2RlKCkge1xuICAgICAgICAvLyDpgb/lhY0gdGlja0luRWRpdE1vZGUoKSDlnKjlkIzkuIDluKfmiafooYzml7blj4josIPliLDov5nph4zvvIzlr7zoh7TkuIvkuIDluKflj4jmiafooYwgdGlja0luRWRpdE1vZGXvvIzpmbflhaXlvqrnjq9cbiAgICAgICAgaWYgKHRoaXMuX3RpY2tlZEZyYW1lSW5FTSAhPT0gZGlyZWN0b3IuZ2V0VG90YWxGcmFtZXMoKSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvdWxkUmVwYWludEluRU0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGZvcmNlUmVwYWludEluRWRpdE1vZGUoKSB7XG4gICAgICAgIHRoaXMuX3Nob3VsZFJlcGFpbnRJbkVNID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuX3BhdXNlZCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvdWxkUmVwYWludEluRU0gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMudGlja0luRWRpdE1vZGUoMCk7XG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdCgnZW5naW5lOnVwZGF0ZScpO1xuICAgICAgICAgICAgdHJ5IHsgU2VydmljZS5DYW1lcmE/Lm9uVXBkYXRlPy4oMCk7IH0gY2F0Y2ggeyAvKiBub3QgcmVnaXN0ZXJlZCB5ZXQgKi8gfVxuICAgICAgICAgICAgdHJ5IHsgU2VydmljZS5HaXptbz8ub25VcGRhdGU/LigwKTsgfSBjYXRjaCB7IC8qIG5vdCByZWdpc3RlcmVkIHlldCAqLyB9XG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdCgnZW5naW5lOnRpY2tlZCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5riy5p+T6LCD6K+V6KeG5Zu+77yIRGVidWdWaWV377yJ77ya5Y2V5LiA6YCa6YGT6LCD6K+VIC8g57uE5ZCI5YWJ54Wn6aG55byA5YWzIC8g57qv5YWJ54Wn5bim5Zu65pyJ6ImyIC8g57qn6IGU6Zi05b2x5p+T6Imy44CCXG4gICAgICog5LiOIGNvY29zLWVkaXRvciBzY2VuZS1mYWNhZGUtbWFuYWdlci5jaGFuZ2VEZWJ1Z09wdGlvbiDlr7npvZDjgIJcbiAgICAgKiDms6jmhI/vvJrkuI3lr7nlpJbmmrTpnLLkuLrlhazlhbEgQVBJ77yI5pyq5Yqg5YWlIElFbmdpbmVTZXJ2aWNlIC8gRW5naW5lUHJveHnvvIzkuI3nlJ/miJDliLAgY29jb3MtY2xpLXR5cGVz77yJ77ybXG4gICAgICog55uu5YmN5LuF55Sx5Zy65pmv57yW6L6R5Zmo6aG16Z2i77yIc2NlbmUtZWRpdG9yLmVqc++8ieWcqOa1j+iniOWZqOWGhemAmui/hyB3aW5kb3cuY2xpLlNjZW5lLkVuZ2luZSDnm7TmjqXosIPnlKjjgIJcbiAgICAgKiBAcGFyYW0ga2V5ICdzaW5nbGUnIHwgJ2NvbXBvc2l0ZScgfCAnTElHSFRJTkdfV0lUSF9CQVNFX0NPTE9SJyB8ICdDU01fTEFZRVJfQ09MT1JBVElPTidcbiAgICAgKiBAcGFyYW0gdmFsdWUgc2luZ2xlOiBEZWJ1Z1ZpZXdTaW5nbGVUeXBlIOaVsOWAvO+8m2NvbXBvc2l0ZTogeyBrZXk6IERlYnVnVmlld0NvbXBvc2l0ZVR5cGUgfCAxMDAwMCg9QUxMKSwgdmFsdWU6IGJvb2xlYW4gfe+8m+WFtuS9mTogYm9vbGVhblxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBjaGFuZ2VEZWJ1Z09wdGlvbihrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgICAgICAvLyBkZWJ1Z1ZpZXcg5pyq5ZyoIFJvb3Qg57G75Z6L6YeM5aOw5piO77ybMkQg5oiW5byV5pOO5pyq5bCx57uq5pe25Y+v6IO95Li656m6XG4gICAgICAgIGNvbnN0IGRlYnVnVmlldyA9IChkaXJlY3Rvci5yb290IGFzIGFueSk/LmRlYnVnVmlldztcbiAgICAgICAgaWYgKCFkZWJ1Z1ZpZXcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgY2FzZSAnc2luZ2xlJzpcbiAgICAgICAgICAgICAgICAvLyDmuLLmn5PljZXpobnosIPor5XmqKHlvI9cbiAgICAgICAgICAgICAgICBkZWJ1Z1ZpZXcuc2luZ2xlTW9kZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY29tcG9zaXRlJzpcbiAgICAgICAgICAgICAgICAvLyDmuLLmn5Pnu4TlkIjosIPor5XmqKHlvI/vvIhrZXkgPT09IDEwMDAwIOihqOekuuWFqOmDqO+8iVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZT8ua2V5ID09PSAxMDAwMCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z1ZpZXcuZW5hYmxlQWxsQ29tcG9zaXRlTW9kZSh2YWx1ZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWdWaWV3LmVuYWJsZUNvbXBvc2l0ZU1vZGUodmFsdWU/LmtleSwgdmFsdWU/LnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdMSUdIVElOR19XSVRIX0JBU0VfQ09MT1InOlxuICAgICAgICAgICAgICAgIC8vIOWFieeFp+S/oeaBr+W4puWbuuacieiJsu+8iOe6r+WFieeFp+WIh+aNou+8iVxuICAgICAgICAgICAgICAgIGRlYnVnVmlldy5saWdodGluZ1dpdGhBbGJlZG8gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ0NTTV9MQVlFUl9DT0xPUkFUSU9OJzpcbiAgICAgICAgICAgICAgICAvLyDnuqfogZTpmLTlvbHmn5PoibJcbiAgICAgICAgICAgICAgICBkZWJ1Z1ZpZXcuY3NtTGF5ZXJDb2xvcmF0aW9uID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIOacquefpSBrZXnvvJrkuI3lgZrku7vkvZXlj5jmm7TvvIznm7TmjqXov5Tlm57vvIzpgb/lhY3nqbrovazph43nu5hcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdm9pZCB0aGlzLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgIC8qIOS7juacjeWKoeerr+aLieWPluW9k+WJjeW3peeoi+eahOiuvuiuoeWIhui+qOeOh++8jOWQjOatpeWIsCBjYy52aWV3IOW5tumHjeaOkuW3suaJk+W8gOWcuuaZr+mHjOeahCBDYW52YXPjgIJcbiAgICAgKlxuICAgICAqIOS4uuS7gOS5iOW/hemhu+aJi+WKqOmHjeaOku+8mue8lui+keWZqOaooeW8j++8iEVESVRPUl9OT1RfSU5fUFJFVklFV++8ieS4iyBjYy5DYW52YXMg5LiN5Lya5rOo5YaMXG4gICAgICogJ2Rlc2lnbi1yZXNvbHV0aW9uLWNoYW5nZWQnIOebkeWQrO+8iOWPquaciemihOiniC/ov5DooYzmqKHlvI/miY3ms6jlhozvvInvvIzlj6rlnKjlnLrmma/lrp7kvovljJbnmoQgX19wcmVsb2FkIOmHjFxuICAgICAqIOiwgyBmaXREZXNpZ25SZXNvbHV0aW9uX0VESVRPUiDlr7npvZDkuIDmrKHjgILlm6DmraTmlLnliIbovqjnjoflkI7vvJrmlrDlrp7kvovljJbnmoTlnLrmma/kvJroh6rliqjlr7npvZDvvIzkvYZcbiAgICAgKiDlt7LmiZPlvIDjgIHmnKrph43mlrDlrp7kvovljJbnmoTlnLrmma/kuI3kvJrmm7TmlrDigJTigJTpnIDopoHlnKjov5nph4zmiYvliqjosIMgZml0RGVzaWduUmVzb2x1dGlvbl9FRElUT1JcbiAgICAgKiDvvIjkuI4gY29jb3MtZWRpdG9yIHN0YXJ0dXAuaW5pdERlc2lnblJlc29sdXRpb24g55qE6YeN5o6S6YC76L6R5LiA6Ie077yJ44CCXG4gICAgICpcbiAgICAgKiDlnKjmiZPlvIDlnLrmma/jgIHph43lvIDlkIzkuIDlnLrmma/jgIHku6Xlj4rpgInkuK3oioLngrnml7bpg73kvJrosIPnlKjvvJrnlLHkuo7mtY/op4jlmajlnLrmma/mlLbkuI3liLDkuLvov5vnqIvnmoTphY3nva7lj5jmm7TmjqjpgIHvvIxcbiAgICAgKiDlj6rog73lnKjov5nkupvkuqTkupLml7bmnLrkuLvliqjmi4nlj5bmr5Tlr7njgIJjYy52aWV3IOacquWPmOWMluaXtuebtOaOpei/lOWbnu+8iOavj+asoeS7heS4gOasoeaegeWwj+eahOivu+WPlu+8ie+8jFxuICAgICAqIOWPmOWMluaXtuaJjeabtOaWsOW5tumHjeaOkuKAlOKAlOWboOS4uiBjYy52aWV3IOavj+asoeWPmOWMlumDveS8mui/nuWQjOmHjeaOkuW9k+WJjeWcuuaZr++8jOaVheS4jeS8muWHuueOsOKAnOW3suabtOaWsOS9huWcuuaZr+acqumHjeaOkuKAneeahOaDheWGteOAglxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBzeW5jRGVzaWduUmVzb2x1dGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHZpZXcgPSAoY2MgYXMgYW55KS52aWV3O1xuICAgICAgICAgICAgaWYgKCF2aWV3IHx8IHR5cGVvZiBmZXRjaCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHNlcnZlclVSTCA9IHNlcnZpY2VNYW5hZ2VyLmdldFNlcnZlclVybCgpO1xuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7c2VydmVyVVJMfS9zY3JpcHRpbmcvZW5naW5lL2Rlc2lnbi1yZXNvbHV0aW9uYCk7XG4gICAgICAgICAgICBjb25zdCBkciA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IE51bWJlcihkcj8ud2lkdGgpO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gTnVtYmVyKGRyPy5oZWlnaHQpO1xuICAgICAgICAgICAgaWYgKE51bWJlci5pc05hTih3aWR0aCkgfHwgTnVtYmVyLmlzTmFOKGhlaWdodCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzaXplID0gdmlldy5nZXREZXNpZ25SZXNvbHV0aW9uU2l6ZSgpO1xuICAgICAgICAgICAgaWYgKHNpemUgJiYgc2l6ZS53aWR0aCA9PT0gd2lkdGggJiYgc2l6ZS5oZWlnaHQgPT09IGhlaWdodCkge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8g5pyq5Y+Y5YyW77yM5peg6ZyA5aSE55CGXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDkv53mjIHkuI7lnLrmma/ov5vnqIvlkK/liqjml7bkuIDoh7TnmoQgUmVzb2x1dGlvblBvbGljeVxuICAgICAgICAgICAgdmlldy5zZXREZXNpZ25SZXNvbHV0aW9uU2l6ZSh3aWR0aCwgaGVpZ2h0LCB2aWV3LmdldFJlc29sdXRpb25Qb2xpY3koKSk7XG4gICAgICAgICAgICAvLyDmiYvliqjlr7npvZDlt7LmiZPlvIDlnLrmma/ph4znmoQgQ2FudmFz77yI57yW6L6R5Zmo5qih5byP5LiN5Lya6Ieq5Yqo5ZON5bqUIGRlc2lnbi1yZXNvbHV0aW9uLWNoYW5nZWTvvIlcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmIChzY2VuZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhc2VzID0gKHNjZW5lIGFzIGFueSkuZ2V0Q29tcG9uZW50c0luQ2hpbGRyZW4oJ2NjLkNhbnZhcycpIGFzIGFueVtdO1xuICAgICAgICAgICAgICAgIGNhbnZhc2VzLmZvckVhY2goKGNhbnZhcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNhbnZhcyB8fCAhY2FudmFzLm5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyDluKYgV2lkZ2V0IOeahCBDYW52YXMg55SxIFdpZGdldCDlr7npvZDvvJvmnKrmv4DmtLsv5pyq5ZCv55So55qE6Lez6L+HXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYW52YXMubm9kZS5nZXRDb21wb25lbnQoJ2NjLldpZGdldCcpIHx8ICFjYW52YXMubm9kZS5hY3RpdmUgfHwgIWNhbnZhcy5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmZpdERlc2lnblJlc29sdXRpb25fRURJVE9SPy4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZvaWQgdGhpcy5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW0VuZ2luZV0gc3luY0Rlc2lnblJlc29sdXRpb24gZmFpbGVkOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBpbml0Q3VzdG9tTGF5ZXIobGF5ZXJzPzogSUN1c3RvbUxheWVyQ29uZmlnW10pIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGxheWVycykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSBVU0VSX0xBWUVSX01JTl9CSVQ7IGkgPD0gVVNFUl9MQVlFUl9NQVhfQklUOyBpKyspIHtcbiAgICAgICAgICAgIGNjLkxheWVycy5kZWxldGVMYXllcihpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxheWVycy5mb3JFYWNoKChsYXllcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBsYXllck1hc2suZmluZEluZGV4KChudW0pID0+IGxheWVyLnZhbHVlID09PSBudW0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGNjLkxheWVycy5hZGRMYXllcihsYXllci5uYW1lLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi/kOihjOaXtumHjeW7uueJqeeQhueisOaSnuWIhue7hOaemuS4vu+8iGNjLmludGVybmFsLlBoeXNpY3NHcm91cCAvIFBoeXNpY3NHcm91cDJE77yJ44CCXG4gICAgICpcbiAgICAgKiDliIbnu4Tlj6rlnKggY2MuZ2FtZS5pbml0IOaXtuS7jiBwaHlzaWNzLmNvbGxpc2lvbkdyb3VwcyDor7vkuIDmrKHlubbnlJ/miJDmnprkuL7vvIzmlLnphY3nva7lkI7kuI3ph43lu7rlsLHopoHph43lkK8gSURFXG4gICAgICog77yI5bGe5oCn6Z2i5p2/IEdyb3VwIOS4i+aLieeahCBlbnVtTGlzdCDnm7TmjqXmnaXoh6ror6XmnprkuL7vvInjgILov5nph4zlr7npvZAgY29jb3MtZWRpdG9yIOeahCB1cGRhdGVQaHlzaWNzR3JvdXDvvJpcbiAgICAgKiDnlKggY2MuRW51bS51cGRhdGUg5bCx5Zyw5pu05paw5p6a5Li+77yM5YaN5a+55b2T5YmN6YCJ5Lit6IqC54K55bm/5pKtIG5vZGU6Y2hhbmdl77yM6K6p5bGe5oCn6Z2i5p2/6YeN5pawIGR1bXAg5ou/5Yiw5paw5YiG57uE44CCXG4gICAgICpcbiAgICAgKiDkuI4gY29jb3MtZWRpdG9yIOS4jeWQjOeCue+8mui/memHjOaMieOAjOWGhee9riBERUZBVUxUICsg5b2T5YmN5YiG57uE44CN5a6M5pW06YeN5bu677yM5YWI5riF5o6J5omA5pyJ5pen55qE55So5oi35YiG57uE5p2h55uu77yMXG4gICAgICog5Lul5pSv5oyB5YiG57uE55qE5Yig6ZmkIC8g6YeN5ZG95ZCN77yIZWRpdG9yIOWPquWBmuimhueblu+8jOWIoOmZpOWQjuaui+eVmeaXp+mhue+8ieOAglxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGVQaHlzaWNzR3JvdXAoZ3JvdXBzOiB7IGluZGV4OiBudW1iZXI7IG5hbWU6IHN0cmluZyB9W10gPSBbXSkge1xuICAgICAgICBjb25zdCBpbnRlcm5hbCA9IChjYyBhcyBhbnkpLmludGVybmFsO1xuICAgICAgICBjb25zdCBlbnVtcyA9IFtpbnRlcm5hbD8uUGh5c2ljc0dyb3VwLCBpbnRlcm5hbD8uUGh5c2ljc0dyb3VwMkRdLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgaWYgKCFlbnVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOW8leaTjuWGhee9riBERUZBVUxUIOWIhue7hO+8iFBoeXNpY3NHcm91cCAvIFBoeXNpY3NHcm91cDJEIOWdh+S4uiAxPDww77yJ77yM5oGS5a6a5L+d55WZXG4gICAgICAgIGNvbnN0IERFRkFVTFRfVkFMVUUgPSAxIDw8IDA7XG5cbiAgICAgICAgLy8g55uu5qCH55So5oi35YiG57uE77yIbmFtZeKGknZhbHVl77yJXG4gICAgICAgIGNvbnN0IGRlc2lyZWQ6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbiAgICAgICAgKGdyb3VwcyB8fCBbXSkuZm9yRWFjaCgoZ3JvdXApID0+IHtcbiAgICAgICAgICAgIGlmICghZ3JvdXAgfHwgdHlwZW9mIGdyb3VwLmluZGV4ICE9PSAnbnVtYmVyJyB8fCAhZ3JvdXAubmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlc2lyZWRbZ3JvdXAubmFtZV0gPSAxIDw8IGdyb3VwLmluZGV4O1xuICAgICAgICB9KTtcblxuICAgICAgICBlbnVtcy5mb3JFYWNoKChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIC8vIOWFiOenu+mZpOaJgOaciemdnuWGhee9ru+8iERFRkFVTFTvvInnmoTml6fnlKjmiLfliIbnu4TmnaHnm67vvIzlkKsgbmFtZeKGknZhbHVlIOS4jiB2YWx1ZeKGkm5hbWUg5Y+N5ZCR5pig5bCE77yMXG4gICAgICAgICAgICAvLyDov5nmoLfliKDpmaQgLyDph43lkb3lkI3nmoTliIbnu4TkuI3kvJrmrovnlZnjgIJfX2VudW1zX18g5b+F6aG75L+d55WZ77yM5ZCm5YiZIEVudW0uaXNFbnVtIOWksei0peOAgUVudW0udXBkYXRlIOaKm+mUmeOAglxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnX19lbnVtc19fJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IGVba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHYgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG5hbWUg4oaSIHZhbHVlIOadoeebrlxuICAgICAgICAgICAgICAgICAgICBpZiAodiAhPT0gREVGQVVMVF9WQUxVRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHYgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHZhbHVlIOKGkiBuYW1lIOWPjeWQkeaYoOWwhFxuICAgICAgICAgICAgICAgICAgICBpZiAoTnVtYmVyKGtleSkgIT09IERFRkFVTFRfVkFMVUUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlW2tleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGUsIGRlc2lyZWQpO1xuICAgICAgICAgICAgY2MuRW51bS51cGRhdGUoZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOmAmuefpeWxnuaAp+mdouadv+mHjeaWsCBkdW1w77yM5Yi35pawIEdyb3VwIOS4i+aLieOAglxuICAgICAgICAvLyDlhbPplK7vvJrku4XjgIzot6/lvoTnuqfjgI1ub2RlOmNoYW5nZSDlj6rliLfmlrDlsZ7mgKfigJzlgLzigJ3vvIzkuI3kvJrph43lj5YgZW51bUxpc3TvvIjlhYPmlbDmja7vvInvvJvlv4Xpobvlg48gc2V0UHJvcGVydHlcbiAgICAgICAgLy8g6YKj5qC35bim5LiK5YW35L2T5bGe5oCn55qEIHByb3BQYXRo77yIbm9kZS5jb21wb25lbnRzIOmHjOeisOaSnuS9k+eahCBncm91cO+8ie+8jOmdouadv+aJjeS8mumHjSBkdW1wIOivpeWxnuaAp+OAgeabtOaWsOS4i+aLiVxuICAgICAgICAvLyDpgInpobnjgILov5nkuI7nlKjmiLfigJzliIfmjaIgZ3JvdXAg5ZCO5omN5Ye6546w5paw5YiG57uE4oCd6LWw55qE5piv5ZCM5LiA5p2h6YCa6YGT44CCXG4gICAgICAgIGNvbnN0IE5vZGVNZ3IgPSAoKGNjIGFzIGFueSkuRWRpdG9yRXh0ZW5kcyB8fCAoZ2xvYmFsVGhpcyBhcyBhbnkpLkVkaXRvckV4dGVuZHMpPy5Ob2RlO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBxdWVyeVJlZ2lzdGVyZWRTZXJ2aWNlPHsgcXVlcnk/OiAoKSA9PiBzdHJpbmdbXSB9PignU2VsZWN0aW9uJyk7XG4gICAgICAgIGNvbnN0IHBhdGhzOiBzdHJpbmdbXSA9IHNlbGVjdGlvbj8ucXVlcnk/LigpID8/IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHBhdGggb2YgcGF0aHMpIHtcbiAgICAgICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgbm9kZTogYW55ID0gTm9kZU1ncj8uZ2V0Tm9kZUJ5UGF0aD8uKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgLy8g5a6a5L2N5LiN5Yiw6IqC54K55pe277yM6YCA5Zue6Lev5b6E57qnIG5vZGU6Y2hhbmdlXG4gICAgICAgICAgICAgICAgU2VydmljZUV2ZW50cy5icm9hZGNhc3QoJ25vZGU6Y2hhbmdlJywgcGF0aCk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb21wczogYW55W10gPSBub2RlLmNvbXBvbmVudHMgfHwgW107XG4gICAgICAgICAgICBsZXQgbWF0Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgY29tcHMuZm9yRWFjaCgoY29tcCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDnorDmkp7kvZPvvIhDb2xsaWRlciAvIENvbGxpZGVyMkTvvInnlKggZ3JvdXAg5bGe5oCn5byV55SoIFBoeXNpY3NHcm91cCDmnprkuL5cbiAgICAgICAgICAgICAgICBpZiAoY29tcCAmJiB0eXBlb2YgY29tcC5ncm91cCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2VFdmVudHMuZW1pdCgnbm9kZTpjaGFuZ2UnLCBub2RlLCB7IHR5cGU6IE5vZGVFdmVudFR5cGUuU0VUX1BST1BFUlRZLCBwcm9wUGF0aDogYF9jb21wb25lbnRzLiR7aW5kZXh9Lmdyb3VwYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghbWF0Y2hlZCkge1xuICAgICAgICAgICAgICAgIC8vIOmAieS4reiKgueCueS4iuayoeacieeisOaSnuS9k++8muS7jeWPkeS4gOasoei3r+W+hOe6pyBub2RlOmNoYW5nZSDlhZzlupVcbiAgICAgICAgICAgICAgICBTZXJ2aWNlRXZlbnRzLmJyb2FkY2FzdCgnbm9kZTpjaGFuZ2UnLCBwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRGcmFtZVJhdGUoZnBzOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fbWF4RGVsdGFUaW1lSW5FTSA9IDEgLyBmcHM7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0VGljaygpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NldFRpbWVvdXRJZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fdGljaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0b3BUaWNrKCkge1xuICAgICAgICB0aGlzLmNsZWFyVGltZW91dCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyB0aWNrSW5FZGl0TW9kZShkZWx0YVRpbWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLl90aWNrZWRGcmFtZUluRU0gPSBkaXJlY3Rvci5nZXRUb3RhbEZyYW1lcygpO1xuXG4gICAgICAgIGlmICh0aGlzLmdlb21ldHJ5UmVuZGVyZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VvbWV0cnlSZW5kZXJlci5mbHVzaCgpO1xuICAgICAgICB9XG4gICAgICAgIGRpcmVjdG9yLnRpY2soZGVsdGFUaW1lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0R2VvbWV0cnlSZW5kZXJlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VvbWV0cnlSZW5kZXJlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZW50ZXJTdGF0ZShzdGF0ZTogTmVlZEFuaW1TdGF0ZSkge1xuICAgICAgICB0aGlzLl9zdGF0ZVJlY29yZCB8PSAxIDw8IHN0YXRlO1xuICAgICAgICB0aGlzLl91cGRhdGVUaWNrU3RhdGUoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZXhpdFN0YXRlKHN0YXRlOiBOZWVkQW5pbVN0YXRlKSB7XG4gICAgICAgIHRoaXMuX3N0YXRlUmVjb3JkICY9IH4oMSA8PCBzdGF0ZSk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVRpY2tTdGF0ZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBlbnRlckFuaW1hdGlvbk1vZGUoKSB7XG4gICAgICAgIHRoaXMuZW50ZXJTdGF0ZShOZWVkQW5pbVN0YXRlLkFOSU1BVElPTl9NT0RFKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZXhpdEFuaW1hdGlvbk1vZGUoKSB7XG4gICAgICAgIHRoaXMuZXhpdFN0YXRlKE5lZWRBbmltU3RhdGUuQU5JTUFUSU9OX01PREUpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXN1bWUoKSB7XG4gICAgICAgIHRoaXMuX3BhdXNlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnN0YXJ0VGljaygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBwYXVzZSgpIHtcbiAgICAgICAgdGhpcy5zdG9wVGljaygpO1xuICAgICAgICB0aGlzLl9wYXVzZWQgPSB0cnVlO1xuICAgIH1cblxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciDkuIDoh7TvvJrmo4Dmn6XoioLngrnmmK/lkKblkKvmnInnspLlrZAv5Zyw5b2i57uE5Lu277yM5o6n5Yi26L+e57utIHRpY2tcbiAgICBwdWJsaWMgY2hlY2tUb1NldEFuaW1TdGF0ZShub2RlczogTm9kZVtdKSB7XG4gICAgICAgIGxldCBoYXNQYXJ0aWNsZUNvbXAgPSBmYWxzZTtcbiAgICAgICAgbGV0IGhhc1RlcnJhaW4gPSBmYWxzZTtcbiAgICAgICAgbm9kZXMuZm9yRWFjaCgobm9kZTogTm9kZSkgPT4ge1xuICAgICAgICAgICAgaWYgKG5vZGUgJiYgbm9kZS5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jb21wb25lbnRzLmZvckVhY2goKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNjLmpzLmdldENsYXNzTmFtZShjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09PSAnY2MuUGFydGljbGVTeXN0ZW0nIHx8IGNsYXNzTmFtZSA9PT0gJ2NjLlBhcnRpY2xlU3lzdGVtMkQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNQYXJ0aWNsZUNvbXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PT0gJ2NjLlRlcnJhaW4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNUZXJyYWluID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoaGFzUGFydGljbGVDb21wKSB7XG4gICAgICAgICAgICB0aGlzLmVudGVyU3RhdGUoTmVlZEFuaW1TdGF0ZS5QQVJUSUNMRV9TWVNURU1fTU9ERSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmV4aXRTdGF0ZShOZWVkQW5pbVN0YXRlLlBBUlRJQ0xFX1NZU1RFTV9NT0RFKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNUZXJyYWluKSB7XG4gICAgICAgICAgICB0aGlzLmVudGVyU3RhdGUoTmVlZEFuaW1TdGF0ZS5URVJSQUlOX1NZU1RFTV9NT0RFKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZXhpdFN0YXRlKE5lZWRBbmltU3RhdGUuVEVSUkFJTl9TWVNURU1fTU9ERSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF90aWNrKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BhdXNlZCkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0KHRoaXMuX2JpbmRUaWNrLCB0aWNrVGltZSk7XG4gICAgICAgICAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKSAvIDEwMDA7XG4gICAgICAgICAgICBUaW1lLnVwZGF0ZShub3csIGZhbHNlLCB0aGlzLl9tYXhEZWx0YVRpbWVJbkVNKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2lzVGlja0FsbG93ZWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3VsZFJlcGFpbnRJbkVNID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy50aWNrSW5FZGl0TW9kZShUaW1lLmRlbHRhVGltZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3QoJ2VuZ2luZTp1cGRhdGUnKTtcblxuICAgICAgICAgICAgICAgIC8vIERpc3BhdGNoIHBlci1mcmFtZSB1cGRhdGVzIHRvIENhbWVyYSBhbmQgR2l6bW8gc2VydmljZXNcbiAgICAgICAgICAgICAgICB0cnkgeyBTZXJ2aWNlLkNhbWVyYT8ub25VcGRhdGU/LihUaW1lLmRlbHRhVGltZSk7IH0gY2F0Y2ggeyAvKiBub3QgcmVnaXN0ZXJlZCB5ZXQgKi8gfVxuICAgICAgICAgICAgICAgIHRyeSB7IFNlcnZpY2UuR2l6bW8/Lm9uVXBkYXRlPy4oVGltZS5kZWx0YVRpbWUpOyB9IGNhdGNoIHsgLyogbm90IHJlZ2lzdGVyZWQgeWV0ICovIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0KCdlbmdpbmU6dGlja2VkJyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF91cGRhdGVUaWNrU3RhdGUoKSB7XG4gICAgICAgIHRoaXMuX3RpY2tJbkVNID0gdGhpcy5fc3RhdGVSZWNvcmQgPiAwO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2lzVGlja0FsbG93ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY2VuZVRpY2sgfHwgdGhpcy5fc2hvdWxkUmVwYWludEluRU0gfHwgdGhpcy5fdGlja0luRU07XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBjYXB0dXJlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FwdHVyZTtcbiAgICB9XG4gICAgcHVibGljIHNldCBjYXB0dXJlKGI6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5fY2FwdHVyZSA9IGI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0Tm9kZUJ5UGF0aChwYXRoOiBzdHJpbmcpOiBOb2RlIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IEVkaXRvckV4dGVuZHMgPSAoY2MgYXMgYW55KS5FZGl0b3JFeHRlbmRzIHx8IChnbG9iYWxUaGlzIGFzIGFueSkuRWRpdG9yRXh0ZW5kcztcbiAgICAgICAgcmV0dXJuIEVkaXRvckV4dGVuZHM/Lk5vZGU/LmdldE5vZGVCeVBhdGg/LihwYXRoKSA/PyBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldE5vZGVCeVV1aWQodXVpZDogc3RyaW5nKTogTm9kZSB8IG51bGwge1xuICAgICAgICBjb25zdCBFZGl0b3JFeHRlbmRzID0gKGNjIGFzIGFueSkuRWRpdG9yRXh0ZW5kcyB8fCAoZ2xvYmFsVGhpcyBhcyBhbnkpLkVkaXRvckV4dGVuZHM7XG4gICAgICAgIHJldHVybiBFZGl0b3JFeHRlbmRzPy5Ob2RlPy5nZXROb2RlPy4odXVpZCkgPz8gbnVsbDtcbiAgICB9XG5cbiAgICAvL1xuXG4gICAgb25FZGl0b3JPcGVuZWQoKSB7XG4gICAgICAgIHZvaWQgdGhpcy5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIG9uRWRpdG9yQ2xvc2VkKCkge1xuICAgICAgICB0aGlzLl9ub2RlQ2hhbmdlVGltZXIuY2xlYXIoKTtcbiAgICAgICAgdm9pZCB0aGlzLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgb25FZGl0b3JSZWxvYWQoKSB7XG4gICAgICAgIHZvaWQgdGhpcy5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIG9uTm9kZUNoYW5nZWQobm9kZTogTm9kZSwgb3B0cz86IGFueSkge1xuICAgICAgICB0aGlzLl9ub2RlQ2hhbmdlVGltZXIuY2FsbEZ1bmN0aW9uTGltaXQobm9kZS51dWlkLCB0aGlzLl9kb05vZGVDaGFuZ2VkLmJpbmQodGhpcyksIG5vZGUsIG9wdHMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2RvTm9kZUNoYW5nZWQobm9kZTogTm9kZSwgb3B0cz86IGFueSkge1xuICAgICAgICBjb25zdCB0eXBlID0gb3B0cz8udHlwZTtcbiAgICAgICAgaWYgKHR5cGUgPT09IE5vZGVFdmVudFR5cGUuVFJBTlNGT1JNX0NIQU5HRUQgfHxcbiAgICAgICAgICAgIHR5cGUgPT09IE5vZGVFdmVudFR5cGUuU0laRV9DSEFOR0VEIHx8XG4gICAgICAgICAgICB0eXBlID09PSBOb2RlRXZlbnRUeXBlLkFOQ0hPUl9DSEFOR0VEIHx8XG4gICAgICAgICAgICB0eXBlID09PSBOb2RlRXZlbnRUeXBlLkNPTVBPTkVOVF9DSEFOR0VEIHx8XG4gICAgICAgICAgICB0eXBlID09PSBOb2RlRXZlbnRUeXBlLlBBUkVOVF9DSEFOR0VEIHx8XG4gICAgICAgICAgICB0eXBlID09PSBOb2RlRXZlbnRUeXBlLkNISUxEX0NIQU5HRUQpIHtcbiAgICAgICAgICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3Ig5LiA6Ie077ya6L+Z5Lqb57G75Z6L5LiN6ZyA6KaB6YeN5paw5qOA5p+l54q25oCBXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrVG9TZXRBbmltU3RhdGUoW25vZGVdKTtcbiAgICAgICAgfVxuICAgICAgICB2b2lkIHRoaXMucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG5cbiAgICBvbkNvbXBvbmVudEFkZGVkKGNvbXA6IENvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBub2RlVXVpZHMgPSBTZXJ2aWNlLlNlbGVjdGlvbj8ucXVlcnk/LigpID8/IFtdO1xuICAgICAgICBpZiAoY29tcC5ub2RlICYmIG5vZGVVdWlkcy5pbmNsdWRlcyhjb21wLm5vZGUudXVpZCkpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tUb1NldEFuaW1TdGF0ZShbY29tcC5ub2RlXSk7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNQYXJ0aWNsZVN5c3RlbTNEKGNvbXApICYmICEoY29tcCBhcyBhbnkpLmlzUGxheWluZykge1xuICAgICAgICAgICAgICAgIChjb21wIGFzIGFueSkucGxheSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZvaWQgdGhpcy5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIG9uQ29tcG9uZW50UmVtb3ZlZChjb21wOiBDb21wb25lbnQpIHtcbiAgICAgICAgY29uc3Qgbm9kZVV1aWRzID0gU2VydmljZS5TZWxlY3Rpb24/LnF1ZXJ5Py4oKSA/PyBbXTtcbiAgICAgICAgaWYgKGNvbXAubm9kZSAmJiBub2RlVXVpZHMuaW5jbHVkZXMoY29tcC5ub2RlLnV1aWQpKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrVG9TZXRBbmltU3RhdGUoW2NvbXAubm9kZV0pO1xuICAgICAgICB9XG4gICAgICAgIHZvaWQgdGhpcy5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIG9uU2V0UHJvcGVydHlDb21wb25lbnQoKSB7XG4gICAgICAgIHZvaWQgdGhpcy5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgU2NlbmVTZWxlY3Rpb24g5LiA6Ie077ya6YCJ5LitL+WPjemAieaXtuajgOafpeeykuWtkC/lnLDlvaLnu4Tku7ZcbiAgICBvblNlbGVjdGlvblNlbGVjdChwYXRoOiBzdHJpbmcsIHBhdGhzOiBzdHJpbmdbXSkge1xuICAgICAgICBjb25zdCBub2RlczogTm9kZVtdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcCBvZiBwYXRocykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX2dldE5vZGVCeVBhdGgocCk7XG4gICAgICAgICAgICBpZiAobm9kZSkgbm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrVG9TZXRBbmltU3RhdGUobm9kZXMpO1xuICAgICAgICBjb25zdCB1dWlkcyA9IG5vZGVzLm1hcChuID0+IG4udXVpZCk7XG4gICAgICAgIHRoaXMuX3BsYXlQYXJ0aWNsZXNPblNlbGVjdCh1dWlkcyk7XG4gICAgICAgIHZvaWQgdGhpcy5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIG9uU2VsZWN0aW9uVW5zZWxlY3QocGF0aDogc3RyaW5nLCBwYXRoczogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3QgdW5zZWxlY3RlZE5vZGUgPSB0aGlzLl9nZXROb2RlQnlQYXRoKHBhdGgpO1xuICAgICAgICBjb25zdCBub2RlczogTm9kZVtdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcCBvZiBwYXRocykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX2dldE5vZGVCeVBhdGgocCk7XG4gICAgICAgICAgICBpZiAobm9kZSkgbm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZW1haW5pbmcgPSBub2Rlcy5maWx0ZXIobiA9PiBuICE9PSB1bnNlbGVjdGVkTm9kZSk7XG4gICAgICAgIHRoaXMuY2hlY2tUb1NldEFuaW1TdGF0ZShyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCB1dWlkcyA9IG5vZGVzLm1hcChuID0+IG4udXVpZCk7XG4gICAgICAgIHRoaXMuX3BhdXNlUGFydGljbGVzT25VbnNlbGVjdCh1dWlkcyk7XG4gICAgICAgIHZvaWQgdGhpcy5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIG9uU2VsZWN0aW9uQ2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY2hlY2tUb1NldEFuaW1TdGF0ZShbXSk7XG4gICAgICAgIHRoaXMuX3N0b3BBbGxQYXJ0aWNsZXMoKTtcbiAgICAgICAgdm9pZCB0aGlzLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciBQYXJ0aWNsZU1hbmFnZXIg5LiA6Ie077ya6YCJ5Lit5pe25pKt5pS+57KS5a2Q57O757ufXG4gICAgcHJpdmF0ZSBfcGxheVBhcnRpY2xlc09uU2VsZWN0KHV1aWRzOiBzdHJpbmdbXSkge1xuICAgICAgICB0aGlzLl9wYXJ0aWNsZVNlbGVjdGVkVVVJRHMgPSB1dWlkcy5zbGljZSgpO1xuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gdGhpcy5fZ2V0U2VsZWN0ZWRQYXJ0aWNsZVN5c3RlbXMoKTtcbiAgICAgICAgY29uc3Qgd2lsbFBsYXkgPSBjb21wb25lbnRzLnNvbWUoaXRlbSA9PiAhdGhpcy5fc3RvcHBlZFBhcnRpY2xlU2V0LmhhcyhpdGVtKSk7XG4gICAgICAgIGlmICh3aWxsUGxheSkge1xuICAgICAgICAgICAgY29tcG9uZW50cy5mb3JFYWNoKGl0ZW0gPT4gdGhpcy5fc3RvcHBlZFBhcnRpY2xlU2V0LmRlbGV0ZShpdGVtKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50cy5mb3JFYWNoKChwczogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBzLmlzUGxheWluZyAmJiAhdGhpcy5fc3RvcHBlZFBhcnRpY2xlU2V0LmhhcyhwcykpIHtcbiAgICAgICAgICAgICAgICBwcy5wbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgUGFydGljbGVNYW5hZ2VyIOS4gOiHtO+8muWPlua2iOmAieS4reaXtuaaguWBnOeykuWtkOezu+e7n1xuICAgIHByaXZhdGUgX3BhdXNlUGFydGljbGVzT25VbnNlbGVjdCh1dWlkczogc3RyaW5nW10pIHtcbiAgICAgICAgdGhpcy5fZ2V0U2VsZWN0ZWRQYXJ0aWNsZVN5c3RlbXMoKS5mb3JFYWNoKChwczogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXV1aWRzLmluY2x1ZGVzKHBzLm5vZGUudXVpZCkgJiYgcHMuaXNQbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgcHMucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3BhcnRpY2xlU2VsZWN0ZWRVVUlEcyA9IHV1aWRzLnNsaWNlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc3RvcEFsbFBhcnRpY2xlcygpIHtcbiAgICAgICAgdGhpcy5fZ2V0U2VsZWN0ZWRQYXJ0aWNsZVN5c3RlbXMoKS5mb3JFYWNoKChwczogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAocHMuaXNQbGF5aW5nKSB7XG4gICAgICAgICAgICAgICAgcHMuc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fcGFydGljbGVTZWxlY3RlZFVVSURzID0gW107XG4gICAgfVxuXG4gICAgLy8g5LiOIGNvY29zLWVkaXRvciBQYXJ0aWNsZU1hbmFnZXIuZ2V0U2VsZWN0ZWRQYXJ0aWNsZVN5c3RlbUNvbXBvbmVudHMg5LiA6Ie0XG4gICAgcHJpdmF0ZSBfZ2V0U2VsZWN0ZWRQYXJ0aWNsZVN5c3RlbXMoKTogQ29tcG9uZW50W10ge1xuICAgICAgICBjb25zdCByZXN1bHQ6IENvbXBvbmVudFtdID0gW107XG5cbiAgICAgICAgY29uc3QgYWRkVW5pcXVlID0gKGNvbXBzOiBDb21wb25lbnRbXSkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjb21wIG9mIGNvbXBzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQuaW5jbHVkZXMoY29tcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY29tcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3RJbkNoaWxkcmVuID0gKG5vZGU6IE5vZGUpOiBDb21wb25lbnRbXSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmb3VuZDogQ29tcG9uZW50W10gPSBbXTtcbiAgICAgICAgICAgIGlmIChub2RlLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXAgb2Ygbm9kZS5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pc1BhcnRpY2xlU3lzdGVtM0QoY29tcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kLnB1c2goY29tcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZC5wdXNoKC4uLmNvbGxlY3RJbkNoaWxkcmVuKGNoaWxkKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlY3Vyc2l2ZWx5QWRkID0gKG5vZGU6IE5vZGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhc1BhcnRpY2xlID0gbm9kZS5jb21wb25lbnRzPy5zb21lKChjOiBDb21wb25lbnQpID0+IHRoaXMuX2lzUGFydGljbGVTeXN0ZW0zRChjKSk7XG4gICAgICAgICAgICBpZiAoaGFzUGFydGljbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudDtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudC5jb21wb25lbnRzPy5zb21lKChjOiBDb21wb25lbnQpID0+IHRoaXMuX2lzUGFydGljbGVTeXN0ZW0zRChjKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlbHlBZGQocGFyZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhZGRVbmlxdWUoY29sbGVjdEluQ2hpbGRyZW4obm9kZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgdGhpcy5fcGFydGljbGVTZWxlY3RlZFVVSURzKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5fZ2V0Tm9kZUJ5VXVpZCh1dWlkKTtcbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlbHlBZGQobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0LmZpbHRlcigoY29tcDogYW55KSA9PiBjb21wLmVuYWJsZWQpO1xuICAgIH1cblxuICAgIC8vIOS4jiBjb2Nvcy1lZGl0b3IgUGFydGljbGVNYW5hZ2VyIOS4gOiHtO+8muWPquWkhOeQhiAzRCBQYXJ0aWNsZVN5c3RlbVxuICAgIC8vIFBhcnRpY2xlU3lzdGVtMkQg6YCa6L+HIG9uRm9jdXNJbkVkaXRvciDihpIgX3N0YXJ0UHJldmlldyDoh6rooYzlpITnkIZcbiAgICBwcml2YXRlIF9pc1BhcnRpY2xlU3lzdGVtM0QoY29tcDogQ29tcG9uZW50KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBjYy5qcy5nZXRDbGFzc05hbWUoY29tcCkgPT09ICdjYy5QYXJ0aWNsZVN5c3RlbSc7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7IE5lZWRBbmltU3RhdGUgfTtcbiJdfQ==