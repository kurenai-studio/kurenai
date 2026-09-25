"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceImageService = exports.Service = exports.EditorExtends = exports.serviceManager = void 0;
exports.startup = startup;
const EditorExtends = __importStar(require("../../engine/editor-extends"));
exports.EditorExtends = EditorExtends;
const rpc_1 = require("./rpc");
const service_manager_1 = require("./service/service-manager");
Object.defineProperty(exports, "serviceManager", { enumerable: true, get: function () { return service_manager_1.serviceManager; } });
const decorator_1 = require("./service/core/decorator");
const reference_image_1 = require("./service/reference-image");
Object.defineProperty(exports, "ReferenceImageService", { enumerable: true, get: function () { return reference_image_1.ReferenceImageService; } });
const message_1 = require("./service/message");
const i18n_1 = require("./i18n");
const graphics_config_1 = require("../../engine/graphics-config");
const scene_editor_assets_1 = require("./scene-editor-assets");
require("./service");
// Patch UuidUtils for casing compatibility
if (EditorExtends.UuidUtils) {
    const U = EditorExtends.UuidUtils;
    U.decompressUuid = U.decompressUuid || U.decompressUUID;
    U.compressUuid = U.compressUuid || U.compressUUID;
    U.isUuid = U.isUuid || U.isUUID;
    U.uuid = U.uuid || U.generate;
}
exports.Service = decorator_1.Service;
const DEFERRED_MODULE_CACHE_KEY = '__cocosCliDeferredEngineModules';
async function startup(options) {
    const { serverURL } = options;
    const defaultConfig = await fetch(`${serverURL}/scripting/engine/game-config`);
    const config = await defaultConfig.json();
    const modules = await fetch(`${serverURL}/scripting/engine/modules`);
    const features = (await modules.json());
    config.overrideSettings = config.overrideSettings || {};
    config.overrideSettings.rendering = config.overrideSettings.rendering || {};
    const customPipeline = features.includes(graphics_config_1.CUSTOM_PIPELINE_MODULE);
    config.overrideSettings.rendering.customPipeline = customPipeline;
    if (customPipeline && !config.overrideSettings.rendering.effectSettingsPath) {
        config.overrideSettings.rendering.effectSettingsPath = `${serverURL}/scripting/engine/effect-settings`;
    }
    const sceneEditorSettings = await (0, scene_editor_assets_1.fetchSceneEditorSettings)(serverURL);
    service_manager_1.serviceManager.initialize(serverURL);
    const requiredModules = [
        'cc',
        'cc/editor/populate-internal-constants',
        'cc/editor/serialization',
        'cc/editor/new-gen-anim',
        'cc/editor/embedded-player',
        'cc/editor/reflection-probe',
        'cc/editor/lod-group-utils',
        'cc/editor/material',
        'cc/editor/2d-misc',
        'cc/editor/offline-mappings',
        'cc/editor/custom-pipeline',
        'cc/editor/animation-clip-migration',
        'cc/editor/exotic-animation',
        'cc/editor/color-utils',
    ];
    const deferredModuleCache = Object.create(null);
    globalThis[DEFERRED_MODULE_CACHE_KEY] = deferredModuleCache;
    // IMPORTANT: We must NOT use import() here because Rollup's
    // resolveId hook aliases cc/editor/* to a cc re-export stub,
    // which means the real engine side-effect modules never load.
    // We use the __moduleImport placeholder which is replaced with SystemJS's module.import().
    for (const mod of requiredModules) {
        try {
            deferredModuleCache[mod] = await System.import(mod);
        }
        catch (e) {
            console.error('Failed to load engine module:', mod, 'e:', e);
        }
    }
    // ---- hack creator 使用的一些 engine 参数
    await Promise.resolve().then(() => __importStar(require('cc/polyfill/engine')));
    // overwrite
    const overwrite = await Promise.resolve().then(() => __importStar(require('cc/overwrite')));
    const handle = overwrite.default || overwrite;
    if (typeof handle === 'function') {
        handle(cc);
    }
    globalThis.cce = globalThis.cce || {};
    globalThis.cce.Script = decorator_1.Service.Script;
    globalThis.cli = {};
    globalThis.cli.Scene = decorator_1.Service;
    globalThis.cli.SceneEvents = message_1.messageManager;
    if (EditorExtends.init) {
        await EditorExtends.init();
    }
    // Load serialize/geometry/prefab utils (depends on cc, must run after engine loads)
    try {
        const serializeUtils = await Promise.resolve().then(() => __importStar(require('../../engine/editor-extends/utils/serialize')));
        const ee = globalThis.EditorExtends;
        ee.serialize = serializeUtils.serialize;
        ee.serializeCompiled = serializeUtils.serializeCompiled;
        ee.deserializeFull = await Promise.resolve().then(() => __importStar(require('../../engine/editor-extends/utils/deserialize')));
        ee.GeometryUtils = await Promise.resolve().then(() => __importStar(require('../../engine/editor-extends/utils/geometry')));
        ee.PrefabUtils = await Promise.resolve().then(() => __importStar(require('../../engine/editor-extends/utils/prefab')));
    }
    catch (e) {
        console.warn('[engine-bootstrap] Failed to load editor-extends utils:', e);
    }
    await rpc_1.Rpc.startup({ serverURL });
    await (0, i18n_1.initLocalI18n)();
    // Spine 版本：dev-cli 引擎同时编入 spine-3.8 与 spine-4.2，按项目 includeModules 选定。
    // 必须在 game.init（spine WASM 实例化 + spine-define patch）之前写入全局，供 spine-instantiate-dynamic 读取。
    globalThis._CC_SPINE_VERSION = features.includes('spine-4.2') ? '4.2' : '3.8';
    cc.physics.selector.runInEditor = true;
    await cc.game.init(config);
    await (0, scene_editor_assets_1.syncSceneEditorBundles)(serverURL, sceneEditorSettings?.bundleConfigs);
    let backend = 'builtin';
    const Backends = {
        'physics-cannon': 'cannon.js',
        'physics-ammo': 'bullet',
        'physics-builtin': 'builtin',
        'physics-physx': 'physx',
    };
    features.forEach((m) => {
        if (m in Backends) {
            backend = Backends[m];
        }
    });
    // 切换物理引擎
    cc.physics.selector.switchTo(backend);
    if (cc.physics.PhysicsSystem?.instance) {
        cc.physics.PhysicsSystem.instance.enable = false;
    }
    const dr = config?.overrideSettings?.screen?.designResolution;
    const drWidth = dr?.width ?? 1280;
    const drHeight = dr?.height ?? 720;
    const drPolicy = cc.ResolutionPolicy.SHOW_ALL;
    // FIXED_WIDTH / FIXED_HEIGHT should only be used by preview.
    // There is no preview flow in scene process yet, so keep SHOW_ALL by default.
    // if (dr) {
    //     const fw = dr.fitWidth !== false;
    //     const fh = dr.fitHeight === true;
    //     if (fw && !fh) drPolicy = cc.ResolutionPolicy.FIXED_WIDTH;
    //     else if (!fw && fh) drPolicy = cc.ResolutionPolicy.FIXED_HEIGHT;
    // }
    cc.view.setDesignResolutionSize(drWidth, drHeight, drPolicy);
    await cc.game.run();
    // Stop the engine's built-in mainLoop immediately — it would render frames
    // without a loaded scene, causing FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT.
    // Our own edit-mode tick loop (Engine.startTick) takes over later.
    cc.game.pause();
    function stripNullComponents(node) {
        if (node._components) {
            node._components = node._components.filter((c) => c != null);
        }
        if (node._children) {
            for (const child of node._children) {
                stripNullComponents(child);
            }
        }
    }
    const origRunSceneImmediate = cc.director.runSceneImmediate.bind(cc.director);
    cc.director.runSceneImmediate = function (scene, ...args) {
        stripNullComponents(scene);
        return origRunSceneImmediate(scene, ...args);
    };
    await decorator_1.Service.Engine.init();
    // Pause the custom tick loop during service initialization — preview
    // services create cameras that would otherwise render on mainWindow
    // before any scene is loaded, causing FRAMEBUFFER_INCOMPLETE errors.
    decorator_1.Service.Engine.pause();
    await service_manager_1.serviceManager.initAllServices();
    const canvas = document.getElementById('GameCanvas');
    if (canvas && decorator_1.Service.Operation) {
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = '/static/web/input-bridge.js';
            s.onload = () => resolve();
            s.onerror = reject;
            document.head.appendChild(s);
        });
        globalThis.setupInputBridge({
            canvas,
            operation: decorator_1.Service.Operation,
            engine: decorator_1.Service.Engine,
        });
    }
    await setupBrowserInvokeChannel(serverURL);
}
/**
 * 建立主进程 → 浏览器场景的反向调用通道。
 *
 * web 预览下主进程无法通过 RPC 直接调浏览器 service（浏览器是 setWebTransport 客户端、未 register），
 * 改用 socket.io：主进程 emit('scene:invoke', {module, method, args}) → 这里派发到对应场景 service。
 * 放在场景 bundle 里（而非某个宿主页如 scene-editor.ejs），保证 cocos-cli 预览与 PinK 等所有宿主都生效；
 * socket.io 客户端从服务端托管的 /socket.io/socket.io.js 动态加载，不依赖宿主页。
 */
async function setupBrowserInvokeChannel(serverURL) {
    try {
        await new Promise((resolve) => {
            if (globalThis.io) {
                resolve();
                return;
            }
            const s = document.createElement('script');
            s.src = `${serverURL}/socket.io/socket.io.js`;
            s.onload = () => resolve();
            s.onerror = () => resolve();
            document.head.appendChild(s);
        });
        const io = globalThis.io;
        if (!io) {
            console.warn('[engine-bootstrap] socket.io client unavailable, skip browser-invoke channel');
            return;
        }
        const socket = io(serverURL);
        const invoke = (module, method, args) => {
            try {
                const svc = decorator_1.Service[module];
                if (svc && typeof svc[method] === 'function') {
                    svc[method](...(args || []));
                }
            }
            catch (e) {
                console.warn('[scene:invoke] failed:', e);
            }
        };
        socket.on('scene:invoke', (msg) => {
            if (msg && msg.module && msg.method) {
                invoke(msg.module, msg.method, msg.args);
            }
        });
        // Reconcile feature-local runtime state after first connection or reconnect.
        // Reference images need this because their Sprite objects are not persisted with configuration.
        socket.on('connect', () => {
            invoke('Engine', 'syncDesignResolution', []);
            invoke('ReferenceImage', 'syncFromAuthority', []);
        });
    }
    catch (e) {
        console.warn('[engine-bootstrap] setup browser-invoke channel failed:', e);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLWJvb3RzdHJhcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjZW5lL3NjZW5lLXByb2Nlc3MvZW5naW5lLWJvb3RzdHJhcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQ0EsMEJBNEtDO0FBNU1ELDJFQUE2RDtBQXFCcEMsc0NBQWE7QUFwQnRDLCtCQUE0QjtBQUM1QiwrREFBMkQ7QUFtQmxELCtGQW5CQSxnQ0FBYyxPQW1CQTtBQWxCdkIsd0RBQXVFO0FBQ3ZFLCtEQUFrRTtBQXNCekQsc0dBdEJBLHVDQUFxQixPQXNCQTtBQXJCOUIsK0NBQW1EO0FBQ25ELGlDQUF1QztBQUN2QyxrRUFBc0U7QUFDdEUsK0RBQXlGO0FBRXpGLHFCQUFtQjtBQUVuQiwyQ0FBMkM7QUFDM0MsSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDMUIsTUFBTSxDQUFDLEdBQUcsYUFBYSxDQUFDLFNBQWdCLENBQUM7SUFDekMsQ0FBQyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsY0FBYyxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUM7SUFDeEQsQ0FBQyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUM7SUFDbEQsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDaEMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDbEMsQ0FBQztBQUdZLFFBQUEsT0FBTyxHQUFHLG1CQUFnQixDQUFDO0FBUXhDLE1BQU0seUJBQXlCLEdBQUcsaUNBQWlDLENBQUM7QUFFN0QsS0FBSyxVQUFVLE9BQU8sQ0FBQyxPQUU3QjtJQUNHLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxP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QyxNQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCw2RUFBNkU7UUFDN0UsZ0dBQWdHO1FBQ2hHLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUN0QixNQUFNLENBQUMsUUFBUSxFQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyx5REFBeUQsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvRSxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEVkaXRvckV4dGVuZHMgZnJvbSAnLi4vLi4vZW5naW5lL2VkaXRvci1leHRlbmRzJztcbmltcG9ydCB7IFJwYyB9IGZyb20gJy4vcnBjJztcbmltcG9ydCB7IHNlcnZpY2VNYW5hZ2VyIH0gZnJvbSAnLi9zZXJ2aWNlL3NlcnZpY2UtbWFuYWdlcic7XG5pbXBvcnQgeyBTZXJ2aWNlIGFzIERlY29yYXRvclNlcnZpY2UgfSBmcm9tICcuL3NlcnZpY2UvY29yZS9kZWNvcmF0b3InO1xuaW1wb3J0IHsgUmVmZXJlbmNlSW1hZ2VTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlL3JlZmVyZW5jZS1pbWFnZSc7XG5pbXBvcnQgeyBtZXNzYWdlTWFuYWdlciB9IGZyb20gJy4vc2VydmljZS9tZXNzYWdlJztcbmltcG9ydCB7IGluaXRMb2NhbEkxOG4gfSBmcm9tICcuL2kxOG4nO1xuaW1wb3J0IHsgQ1VTVE9NX1BJUEVMSU5FX01PRFVMRSB9IGZyb20gJy4uLy4uL2VuZ2luZS9ncmFwaGljcy1jb25maWcnO1xuaW1wb3J0IHsgZmV0Y2hTY2VuZUVkaXRvclNldHRpbmdzLCBzeW5jU2NlbmVFZGl0b3JCdW5kbGVzIH0gZnJvbSAnLi9zY2VuZS1lZGl0b3ItYXNzZXRzJztcblxuaW1wb3J0ICcuL3NlcnZpY2UnO1xuXG4vLyBQYXRjaCBVdWlkVXRpbHMgZm9yIGNhc2luZyBjb21wYXRpYmlsaXR5XG5pZiAoRWRpdG9yRXh0ZW5kcy5VdWlkVXRpbHMpIHtcbiAgICBjb25zdCBVID0gRWRpdG9yRXh0ZW5kcy5VdWlkVXRpbHMgYXMgYW55O1xuICAgIFUuZGVjb21wcmVzc1V1aWQgPSBVLmRlY29tcHJlc3NVdWlkIHx8IFUuZGVjb21wcmVzc1VVSUQ7XG4gICAgVS5jb21wcmVzc1V1aWQgPSBVLmNvbXByZXNzVXVpZCB8fCBVLmNvbXByZXNzVVVJRDtcbiAgICBVLmlzVXVpZCA9IFUuaXNVdWlkIHx8IFUuaXNVVUlEO1xuICAgIFUudXVpZCA9IFUudXVpZCB8fCBVLmdlbmVyYXRlO1xufVxuXG5leHBvcnQgeyBzZXJ2aWNlTWFuYWdlciwgRWRpdG9yRXh0ZW5kcyB9O1xuZXhwb3J0IGNvbnN0IFNlcnZpY2UgPSBEZWNvcmF0b3JTZXJ2aWNlO1xuLy8gVGhpcyB2YWx1ZSBpcyBpbnRlbnRpb25hbGx5IGV4cG9ydGVkIHRocm91Z2ggdGhlIHByZXZpZXcgYnJpZGdlLiBJdHMgbW9kdWxlXG4vLyByZWdpc3RlcnMgdGhlIHNlcnZpY2Ugd2l0aCBAcmVnaXN0ZXIoKSwgYW5kIHRoaXMgbGl2ZSBleHBvcnQgcHJldmVudHMgdGhlXG4vLyB3ZWIgYnVuZGxlIGZyb20gcHJ1bmluZyB0aGF0IHJlZ2lzdHJhdGlvbiBzaWRlIGVmZmVjdC5cbmV4cG9ydCB7IFJlZmVyZW5jZUltYWdlU2VydmljZSB9O1xuXG5kZWNsYXJlIGNvbnN0IGNjOiBhbnk7XG5cbmNvbnN0IERFRkVSUkVEX01PRFVMRV9DQUNIRV9LRVkgPSAnX19jb2Nvc0NsaURlZmVycmVkRW5naW5lTW9kdWxlcyc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydHVwKG9wdGlvbnM6IHtcbiAgICBzZXJ2ZXJVUkw6IHN0cmluZztcbn0pIHtcbiAgICBjb25zdCB7IHNlcnZlclVSTCB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBkZWZhdWx0Q29uZmlnID0gYXdhaXQgZmV0Y2goYCR7c2VydmVyVVJMfS9zY3JpcHRpbmcvZW5naW5lL2dhbWUtY29uZmlnYCk7XG4gICAgY29uc3QgY29uZmlnID0gYXdhaXQgZGVmYXVsdENvbmZpZy5qc29uKCk7XG4gICAgY29uc3QgbW9kdWxlcyA9IGF3YWl0IGZldGNoKGAke3NlcnZlclVSTH0vc2NyaXB0aW5nL2VuZ2luZS9tb2R1bGVzYCk7XG4gICAgY29uc3QgZmVhdHVyZXMgPSAoYXdhaXQgbW9kdWxlcy5qc29uKCkpIGFzIHN0cmluZ1tdO1xuICAgIGNvbmZpZy5vdmVycmlkZVNldHRpbmdzID0gY29uZmlnLm92ZXJyaWRlU2V0dGluZ3MgfHwge307XG4gICAgY29uZmlnLm92ZXJyaWRlU2V0dGluZ3MucmVuZGVyaW5nID0gY29uZmlnLm92ZXJyaWRlU2V0dGluZ3MucmVuZGVyaW5nIHx8IHt9O1xuICAgIGNvbnN0IGN1c3RvbVBpcGVsaW5lID0gZmVhdHVyZXMuaW5jbHVkZXMoQ1VTVE9NX1BJUEVMSU5FX01PRFVMRSk7XG4gICAgY29uZmlnLm92ZXJyaWRlU2V0dGluZ3MucmVuZGVyaW5nLmN1c3RvbVBpcGVsaW5lID0gY3VzdG9tUGlwZWxpbmU7XG4gICAgaWYgKGN1c3RvbVBpcGVsaW5lICYmICFjb25maWcub3ZlcnJpZGVTZXR0aW5ncy5yZW5kZXJpbmcuZWZmZWN0U2V0dGluZ3NQYXRoKSB7XG4gICAgICAgIGNvbmZpZy5vdmVycmlkZVNldHRpbmdzLnJlbmRlcmluZy5lZmZlY3RTZXR0aW5nc1BhdGggPSBgJHtzZXJ2ZXJVUkx9L3NjcmlwdGluZy9lbmdpbmUvZWZmZWN0LXNldHRpbmdzYDtcbiAgICB9XG4gICAgY29uc3Qgc2NlbmVFZGl0b3JTZXR0aW5ncyA9IGF3YWl0IGZldGNoU2NlbmVFZGl0b3JTZXR0aW5ncyhzZXJ2ZXJVUkwpO1xuXG4gICAgc2VydmljZU1hbmFnZXIuaW5pdGlhbGl6ZShzZXJ2ZXJVUkwpO1xuXG4gICAgY29uc3QgcmVxdWlyZWRNb2R1bGVzID0gW1xuICAgICAgICAnY2MnLFxuICAgICAgICAnY2MvZWRpdG9yL3BvcHVsYXRlLWludGVybmFsLWNvbnN0YW50cycsXG4gICAgICAgICdjYy9lZGl0b3Ivc2VyaWFsaXphdGlvbicsXG4gICAgICAgICdjYy9lZGl0b3IvbmV3LWdlbi1hbmltJyxcbiAgICAgICAgJ2NjL2VkaXRvci9lbWJlZGRlZC1wbGF5ZXInLFxuICAgICAgICAnY2MvZWRpdG9yL3JlZmxlY3Rpb24tcHJvYmUnLFxuICAgICAgICAnY2MvZWRpdG9yL2xvZC1ncm91cC11dGlscycsXG4gICAgICAgICdjYy9lZGl0b3IvbWF0ZXJpYWwnLFxuICAgICAgICAnY2MvZWRpdG9yLzJkLW1pc2MnLFxuICAgICAgICAnY2MvZWRpdG9yL29mZmxpbmUtbWFwcGluZ3MnLFxuICAgICAgICAnY2MvZWRpdG9yL2N1c3RvbS1waXBlbGluZScsXG4gICAgICAgICdjYy9lZGl0b3IvYW5pbWF0aW9uLWNsaXAtbWlncmF0aW9uJyxcbiAgICAgICAgJ2NjL2VkaXRvci9leG90aWMtYW5pbWF0aW9uJyxcbiAgICAgICAgJ2NjL2VkaXRvci9jb2xvci11dGlscycsXG4gICAgXTtcbiAgICBjb25zdCBkZWZlcnJlZE1vZHVsZUNhY2hlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgKGdsb2JhbFRoaXMgYXMgYW55KVtERUZFUlJFRF9NT0RVTEVfQ0FDSEVfS0VZXSA9IGRlZmVycmVkTW9kdWxlQ2FjaGU7XG5cbiAgICAvLyBJTVBPUlRBTlQ6IFdlIG11c3QgTk9UIHVzZSBpbXBvcnQoKSBoZXJlIGJlY2F1c2UgUm9sbHVwJ3NcbiAgICAvLyByZXNvbHZlSWQgaG9vayBhbGlhc2VzIGNjL2VkaXRvci8qIHRvIGEgY2MgcmUtZXhwb3J0IHN0dWIsXG4gICAgLy8gd2hpY2ggbWVhbnMgdGhlIHJlYWwgZW5naW5lIHNpZGUtZWZmZWN0IG1vZHVsZXMgbmV2ZXIgbG9hZC5cbiAgICAvLyBXZSB1c2UgdGhlIF9fbW9kdWxlSW1wb3J0IHBsYWNlaG9sZGVyIHdoaWNoIGlzIHJlcGxhY2VkIHdpdGggU3lzdGVtSlMncyBtb2R1bGUuaW1wb3J0KCkuXG4gICAgZm9yIChjb25zdCBtb2Qgb2YgcmVxdWlyZWRNb2R1bGVzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkZWZlcnJlZE1vZHVsZUNhY2hlW21vZF0gPSBhd2FpdCBTeXN0ZW0uaW1wb3J0KG1vZCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGVuZ2luZSBtb2R1bGU6JywgbW9kLCAnZTonLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLS0gaGFjayBjcmVhdG9yIOS9v+eUqOeahOS4gOS6myBlbmdpbmUg5Y+C5pWwXG4gICAgYXdhaXQgaW1wb3J0KCdjYy9wb2x5ZmlsbC9lbmdpbmUnKTtcbiAgICAvLyBvdmVyd3JpdGVcbiAgICBjb25zdCBvdmVyd3JpdGUgPSBhd2FpdCBpbXBvcnQoJ2NjL292ZXJ3cml0ZScpO1xuICAgIGNvbnN0IGhhbmRsZSA9IG92ZXJ3cml0ZS5kZWZhdWx0IHx8IG92ZXJ3cml0ZTtcbiAgICBpZiAodHlwZW9mIGhhbmRsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBoYW5kbGUoY2MpO1xuICAgIH1cblxuICAgIChnbG9iYWxUaGlzIGFzIGFueSkuY2NlID0gKGdsb2JhbFRoaXMgYXMgYW55KS5jY2UgfHwge307XG4gICAgKGdsb2JhbFRoaXMgYXMgYW55KS5jY2UuU2NyaXB0ID0gRGVjb3JhdG9yU2VydmljZS5TY3JpcHQ7XG4gICAgKGdsb2JhbFRoaXMgYXMgYW55KS5jbGkgPSB7fTtcbiAgICAoZ2xvYmFsVGhpcyBhcyBhbnkpLmNsaS5TY2VuZSA9IERlY29yYXRvclNlcnZpY2U7XG4gICAgKGdsb2JhbFRoaXMgYXMgYW55KS5jbGkuU2NlbmVFdmVudHMgPSBtZXNzYWdlTWFuYWdlcjtcblxuICAgIGlmIChFZGl0b3JFeHRlbmRzLmluaXQpIHtcbiAgICAgICAgYXdhaXQgRWRpdG9yRXh0ZW5kcy5pbml0KCk7XG4gICAgfVxuXG4gICAgLy8gTG9hZCBzZXJpYWxpemUvZ2VvbWV0cnkvcHJlZmFiIHV0aWxzIChkZXBlbmRzIG9uIGNjLCBtdXN0IHJ1biBhZnRlciBlbmdpbmUgbG9hZHMpXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc2VyaWFsaXplVXRpbHMgPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2VuZ2luZS9lZGl0b3ItZXh0ZW5kcy91dGlscy9zZXJpYWxpemUnKTtcbiAgICAgICAgY29uc3QgZWUgPSAoZ2xvYmFsVGhpcyBhcyBhbnkpLkVkaXRvckV4dGVuZHM7XG4gICAgICAgIGVlLnNlcmlhbGl6ZSA9IHNlcmlhbGl6ZVV0aWxzLnNlcmlhbGl6ZTtcbiAgICAgICAgZWUuc2VyaWFsaXplQ29tcGlsZWQgPSBzZXJpYWxpemVVdGlscy5zZXJpYWxpemVDb21waWxlZDtcbiAgICAgICAgZWUuZGVzZXJpYWxpemVGdWxsID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9lbmdpbmUvZWRpdG9yLWV4dGVuZHMvdXRpbHMvZGVzZXJpYWxpemUnKTtcbiAgICAgICAgZWUuR2VvbWV0cnlVdGlscyA9IGF3YWl0IGltcG9ydCgnLi4vLi4vZW5naW5lL2VkaXRvci1leHRlbmRzL3V0aWxzL2dlb21ldHJ5Jyk7XG4gICAgICAgIGVlLlByZWZhYlV0aWxzID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9lbmdpbmUvZWRpdG9yLWV4dGVuZHMvdXRpbHMvcHJlZmFiJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tlbmdpbmUtYm9vdHN0cmFwXSBGYWlsZWQgdG8gbG9hZCBlZGl0b3ItZXh0ZW5kcyB1dGlsczonLCBlKTtcbiAgICB9XG4gICAgYXdhaXQgUnBjLnN0YXJ0dXAoeyBzZXJ2ZXJVUkwgfSk7XG4gICAgYXdhaXQgaW5pdExvY2FsSTE4bigpO1xuXG4gICAgLy8gU3BpbmUg54mI5pys77yaZGV2LWNsaSDlvJXmk47lkIzml7bnvJblhaUgc3BpbmUtMy44IOS4jiBzcGluZS00LjLvvIzmjInpobnnm64gaW5jbHVkZU1vZHVsZXMg6YCJ5a6a44CCXG4gICAgLy8g5b+F6aG75ZyoIGdhbWUuaW5pdO+8iHNwaW5lIFdBU00g5a6e5L6L5YyWICsgc3BpbmUtZGVmaW5lIHBhdGNo77yJ5LmL5YmN5YaZ5YWl5YWo5bGA77yM5L6bIHNwaW5lLWluc3RhbnRpYXRlLWR5bmFtaWMg6K+75Y+W44CCXG4gICAgKGdsb2JhbFRoaXMgYXMgYW55KS5fQ0NfU1BJTkVfVkVSU0lPTiA9IGZlYXR1cmVzLmluY2x1ZGVzKCdzcGluZS00LjInKSA/ICc0LjInIDogJzMuOCc7XG4gICAgY2MucGh5c2ljcy5zZWxlY3Rvci5ydW5JbkVkaXRvciA9IHRydWU7XG5cbiAgICBhd2FpdCBjYy5nYW1lLmluaXQoY29uZmlnKTtcbiAgICBhd2FpdCBzeW5jU2NlbmVFZGl0b3JCdW5kbGVzKHNlcnZlclVSTCwgc2NlbmVFZGl0b3JTZXR0aW5ncz8uYnVuZGxlQ29uZmlncyk7XG5cbiAgICBsZXQgYmFja2VuZCA9ICdidWlsdGluJztcbiAgICBjb25zdCBCYWNrZW5kczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgJ3BoeXNpY3MtY2Fubm9uJzogJ2Nhbm5vbi5qcycsXG4gICAgICAgICdwaHlzaWNzLWFtbW8nOiAnYnVsbGV0JyxcbiAgICAgICAgJ3BoeXNpY3MtYnVpbHRpbic6ICdidWlsdGluJyxcbiAgICAgICAgJ3BoeXNpY3MtcGh5c3gnOiAncGh5c3gnLFxuICAgIH07XG4gICAgZmVhdHVyZXMuZm9yRWFjaCgobTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmIChtIGluIEJhY2tlbmRzKSB7XG4gICAgICAgICAgICBiYWNrZW5kID0gQmFja2VuZHNbbV07XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIOWIh+aNoueJqeeQhuW8leaTjlxuICAgIGNjLnBoeXNpY3Muc2VsZWN0b3Iuc3dpdGNoVG8oYmFja2VuZCk7XG4gICAgaWYgKGNjLnBoeXNpY3MuUGh5c2ljc1N5c3RlbT8uaW5zdGFuY2UpIHtcbiAgICAgICAgY2MucGh5c2ljcy5QaHlzaWNzU3lzdGVtLmluc3RhbmNlLmVuYWJsZSA9IGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBkciA9IGNvbmZpZz8ub3ZlcnJpZGVTZXR0aW5ncz8uc2NyZWVuPy5kZXNpZ25SZXNvbHV0aW9uO1xuICAgIGNvbnN0IGRyV2lkdGggPSBkcj8ud2lkdGggPz8gMTI4MDtcbiAgICBjb25zdCBkckhlaWdodCA9IGRyPy5oZWlnaHQgPz8gNzIwO1xuICAgIGNvbnN0IGRyUG9saWN5ID0gY2MuUmVzb2x1dGlvblBvbGljeS5TSE9XX0FMTDtcbiAgICAvLyBGSVhFRF9XSURUSCAvIEZJWEVEX0hFSUdIVCBzaG91bGQgb25seSBiZSB1c2VkIGJ5IHByZXZpZXcuXG4gICAgLy8gVGhlcmUgaXMgbm8gcHJldmlldyBmbG93IGluIHNjZW5lIHByb2Nlc3MgeWV0LCBzbyBrZWVwIFNIT1dfQUxMIGJ5IGRlZmF1bHQuXG4gICAgLy8gaWYgKGRyKSB7XG4gICAgLy8gICAgIGNvbnN0IGZ3ID0gZHIuZml0V2lkdGggIT09IGZhbHNlO1xuICAgIC8vICAgICBjb25zdCBmaCA9IGRyLmZpdEhlaWdodCA9PT0gdHJ1ZTtcbiAgICAvLyAgICAgaWYgKGZ3ICYmICFmaCkgZHJQb2xpY3kgPSBjYy5SZXNvbHV0aW9uUG9saWN5LkZJWEVEX1dJRFRIO1xuICAgIC8vICAgICBlbHNlIGlmICghZncgJiYgZmgpIGRyUG9saWN5ID0gY2MuUmVzb2x1dGlvblBvbGljeS5GSVhFRF9IRUlHSFQ7XG4gICAgLy8gfVxuICAgIGNjLnZpZXcuc2V0RGVzaWduUmVzb2x1dGlvblNpemUoZHJXaWR0aCwgZHJIZWlnaHQsIGRyUG9saWN5KTtcblxuICAgIGF3YWl0IGNjLmdhbWUucnVuKCk7XG4gICAgLy8gU3RvcCB0aGUgZW5naW5lJ3MgYnVpbHQtaW4gbWFpbkxvb3AgaW1tZWRpYXRlbHkg4oCUIGl0IHdvdWxkIHJlbmRlciBmcmFtZXNcbiAgICAvLyB3aXRob3V0IGEgbG9hZGVkIHNjZW5lLCBjYXVzaW5nIEZSQU1FQlVGRkVSX0lOQ09NUExFVEVfTUlTU0lOR19BVFRBQ0hNRU5ULlxuICAgIC8vIE91ciBvd24gZWRpdC1tb2RlIHRpY2sgbG9vcCAoRW5naW5lLnN0YXJ0VGljaykgdGFrZXMgb3ZlciBsYXRlci5cbiAgICBjYy5nYW1lLnBhdXNlKCk7XG5cbiAgICBmdW5jdGlvbiBzdHJpcE51bGxDb21wb25lbnRzKG5vZGU6IGFueSkge1xuICAgICAgICBpZiAobm9kZS5fY29tcG9uZW50cykge1xuICAgICAgICAgICAgbm9kZS5fY29tcG9uZW50cyA9IG5vZGUuX2NvbXBvbmVudHMuZmlsdGVyKChjOiBhbnkpID0+IGMgIT0gbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuX2NoaWxkcmVuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuX2NoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgc3RyaXBOdWxsQ29tcG9uZW50cyhjaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBvcmlnUnVuU2NlbmVJbW1lZGlhdGUgPSBjYy5kaXJlY3Rvci5ydW5TY2VuZUltbWVkaWF0ZS5iaW5kKGNjLmRpcmVjdG9yKTtcbiAgICBjYy5kaXJlY3Rvci5ydW5TY2VuZUltbWVkaWF0ZSA9IGZ1bmN0aW9uIChzY2VuZTogYW55LCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBzdHJpcE51bGxDb21wb25lbnRzKHNjZW5lKTtcbiAgICAgICAgcmV0dXJuIG9yaWdSdW5TY2VuZUltbWVkaWF0ZShzY2VuZSwgLi4uYXJncyk7XG4gICAgfTtcblxuICAgIGF3YWl0IERlY29yYXRvclNlcnZpY2UuRW5naW5lLmluaXQoKTtcbiAgICAvLyBQYXVzZSB0aGUgY3VzdG9tIHRpY2sgbG9vcCBkdXJpbmcgc2VydmljZSBpbml0aWFsaXphdGlvbiDigJQgcHJldmlld1xuICAgIC8vIHNlcnZpY2VzIGNyZWF0ZSBjYW1lcmFzIHRoYXQgd291bGQgb3RoZXJ3aXNlIHJlbmRlciBvbiBtYWluV2luZG93XG4gICAgLy8gYmVmb3JlIGFueSBzY2VuZSBpcyBsb2FkZWQsIGNhdXNpbmcgRlJBTUVCVUZGRVJfSU5DT01QTEVURSBlcnJvcnMuXG4gICAgRGVjb3JhdG9yU2VydmljZS5FbmdpbmUucGF1c2UoKTtcblxuICAgIGF3YWl0IHNlcnZpY2VNYW5hZ2VyLmluaXRBbGxTZXJ2aWNlcygpO1xuXG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ0dhbWVDYW52YXMnKSBhcyBIVE1MQ2FudmFzRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKGNhbnZhcyAmJiBEZWNvcmF0b3JTZXJ2aWNlLk9wZXJhdGlvbikge1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAgICBzLnNyYyA9ICcvc3RhdGljL3dlYi9pbnB1dC1icmlkZ2UuanMnO1xuICAgICAgICAgICAgcy5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgICAgICBzLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHMpO1xuICAgICAgICB9KTtcbiAgICAgICAgKGdsb2JhbFRoaXMgYXMgYW55KS5zZXR1cElucHV0QnJpZGdlKHtcbiAgICAgICAgICAgIGNhbnZhcyxcbiAgICAgICAgICAgIG9wZXJhdGlvbjogRGVjb3JhdG9yU2VydmljZS5PcGVyYXRpb24sXG4gICAgICAgICAgICBlbmdpbmU6IERlY29yYXRvclNlcnZpY2UuRW5naW5lLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhd2FpdCBzZXR1cEJyb3dzZXJJbnZva2VDaGFubmVsKHNlcnZlclVSTCk7XG59XG5cbi8qKlxuICog5bu656uL5Li76L+b56iLIOKGkiDmtY/op4jlmajlnLrmma/nmoTlj43lkJHosIPnlKjpgJrpgZPjgIJcbiAqXG4gKiB3ZWIg6aKE6KeI5LiL5Li76L+b56iL5peg5rOV6YCa6L+HIFJQQyDnm7TmjqXosIPmtY/op4jlmaggc2VydmljZe+8iOa1j+iniOWZqOaYryBzZXRXZWJUcmFuc3BvcnQg5a6i5oi356uv44CB5pyqIHJlZ2lzdGVy77yJ77yMXG4gKiDmlLnnlKggc29ja2V0Lmlv77ya5Li76L+b56iLIGVtaXQoJ3NjZW5lOmludm9rZScsIHttb2R1bGUsIG1ldGhvZCwgYXJnc30pIOKGkiDov5nph4zmtL7lj5HliLDlr7nlupTlnLrmma8gc2VydmljZeOAglxuICog5pS+5Zyo5Zy65pmvIGJ1bmRsZSDph4zvvIjogIzpnZ7mn5DkuKrlrr/kuLvpobXlpoIgc2NlbmUtZWRpdG9yLmVqc++8ie+8jOS/neivgSBjb2Nvcy1jbGkg6aKE6KeI5LiOIFBpbksg562J5omA5pyJ5a6/5Li76YO955Sf5pWI77ybXG4gKiBzb2NrZXQuaW8g5a6i5oi356uv5LuO5pyN5Yqh56uv5omY566h55qEIC9zb2NrZXQuaW8vc29ja2V0LmlvLmpzIOWKqOaAgeWKoOi9ve+8jOS4jeS+nei1luWuv+S4u+mhteOAglxuICovXG5hc3luYyBmdW5jdGlvbiBzZXR1cEJyb3dzZXJJbnZva2VDaGFubmVsKHNlcnZlclVSTDogc3RyaW5nKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGlmICgoZ2xvYmFsVGhpcyBhcyBhbnkpLmlvKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICAgIHMuc3JjID0gYCR7c2VydmVyVVJMfS9zb2NrZXQuaW8vc29ja2V0LmlvLmpzYDtcbiAgICAgICAgICAgIHMub25sb2FkID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICAgICAgcy5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZSgpO1xuICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGlvID0gKGdsb2JhbFRoaXMgYXMgYW55KS5pbztcbiAgICAgICAgaWYgKCFpbykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbZW5naW5lLWJvb3RzdHJhcF0gc29ja2V0LmlvIGNsaWVudCB1bmF2YWlsYWJsZSwgc2tpcCBicm93c2VyLWludm9rZSBjaGFubmVsJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc29ja2V0ID0gaW8oc2VydmVyVVJMKTtcbiAgICAgICAgY29uc3QgaW52b2tlID0gKG1vZHVsZTogc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgYXJncz86IGFueVtdKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN2YyA9IChEZWNvcmF0b3JTZXJ2aWNlIGFzIGFueSlbbW9kdWxlXTtcbiAgICAgICAgICAgICAgICBpZiAoc3ZjICYmIHR5cGVvZiBzdmNbbWV0aG9kXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBzdmNbbWV0aG9kXSguLi4oYXJncyB8fCBbXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tzY2VuZTppbnZva2VdIGZhaWxlZDonLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc29ja2V0Lm9uKCdzY2VuZTppbnZva2UnLCAobXNnOiB7IG1vZHVsZT86IHN0cmluZzsgbWV0aG9kPzogc3RyaW5nOyBhcmdzPzogYW55W10gfSkgPT4ge1xuICAgICAgICAgICAgaWYgKG1zZyAmJiBtc2cubW9kdWxlICYmIG1zZy5tZXRob2QpIHtcbiAgICAgICAgICAgICAgICBpbnZva2UobXNnLm1vZHVsZSwgbXNnLm1ldGhvZCwgbXNnLmFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gUmVjb25jaWxlIGZlYXR1cmUtbG9jYWwgcnVudGltZSBzdGF0ZSBhZnRlciBmaXJzdCBjb25uZWN0aW9uIG9yIHJlY29ubmVjdC5cbiAgICAgICAgLy8gUmVmZXJlbmNlIGltYWdlcyBuZWVkIHRoaXMgYmVjYXVzZSB0aGVpciBTcHJpdGUgb2JqZWN0cyBhcmUgbm90IHBlcnNpc3RlZCB3aXRoIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgIHNvY2tldC5vbignY29ubmVjdCcsICgpID0+IHtcbiAgICAgICAgICAgIGludm9rZSgnRW5naW5lJywgJ3N5bmNEZXNpZ25SZXNvbHV0aW9uJywgW10pO1xuICAgICAgICAgICAgaW52b2tlKCdSZWZlcmVuY2VJbWFnZScsICdzeW5jRnJvbUF1dGhvcml0eScsIFtdKTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tlbmdpbmUtYm9vdHN0cmFwXSBzZXR1cCBicm93c2VyLWludm9rZSBjaGFubmVsIGZhaWxlZDonLCBlKTtcbiAgICB9XG59XG4iXX0=