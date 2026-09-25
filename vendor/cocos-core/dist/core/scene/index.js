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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sceneConfigInstance = void 0;
exports.loadSceneI18n = loadSceneI18n;
exports.init = init;
exports.startupScene = startupScene;
const i18n_1 = __importDefault(require("../base/i18n"));
const scene_configs_1 = require("./scene-configs");
Object.defineProperty(exports, "sceneConfigInstance", { enumerable: true, get: function () { return scene_configs_1.sceneConfigInstance; } });
// 接口类型
__exportStar(require("./common"), exports);
// 主进程
__exportStar(require("./main-process"), exports);
const middleware_1 = require("../../server/middleware");
const scene_middleware_1 = __importDefault(require("./scene.middleware"));
const scene_scripting_middleware_1 = __importDefault(require("./scene.scripting.middleware"));
const i18nModules = {
    zh: () => Promise.resolve().then(() => __importStar(require('./i18n/zh'))),
    en: () => Promise.resolve().then(() => __importStar(require('./i18n/en'))),
};
async function loadSceneI18n() {
    for (const [lang, loader] of Object.entries(i18nModules)) {
        try {
            const data = await loader();
            i18n_1.default.registerLanguagePatch(lang, 'scene', data.default || data);
        }
        catch (error) {
            console.warn(`[Scene] Failed to load scene i18n for ${lang}:`, error);
        }
    }
}
// 场景配置初始化
async function init() {
    await loadSceneI18n();
    // 统一注册浏览器游戏预览路由（扩展预览后端 + GamePreview + 热重载），必须在 SceneScripting /
    // Scene 之前，使 / 及资源路由优先于场景中间件的宽泛路由。放在 scene init 里，保证所有走
    // startup / startupScene 的调用方（含其它 IDE 集成）都得到一致的“场景编辑器 + 浏览器预览”行为。
    const { default: scripting } = await Promise.resolve().then(() => __importStar(require('../scripting')));
    const { registerBrowserPreview } = await Promise.resolve().then(() => __importStar(require('../preview/register')));
    await registerBrowserPreview(scripting.projectPath);
    middleware_1.middlewareService.register('SceneScripting', scene_scripting_middleware_1.default);
    middleware_1.middlewareService.register('Scene', scene_middleware_1.default);
    await scene_configs_1.sceneConfigInstance.init();
    await watchDesignResolutionChange();
    await watchCollisionGroupsChange();
}
let _designResolutionWatched = false;
/**
 * 监听工程设计分辨率变更，推送到浏览器场景刷新 cc.view。
 *
 * web 预览下场景跑在浏览器，主进程无法通过 RPC 反向调用浏览器 service（浏览器是 setWebTransport 客户端、
 * 未 register(Service)）。因此改用 socket.io（live-reload 同款的 server→browser 通道）通知浏览器调用
 * 它自己的 Engine.syncDesignResolution —— 等价于 Rpc.request('Engine','syncDesignResolution',[])。
 * 对齐 cocos-editor 的 project:change-design-resolution 推送。
 */
async function watchDesignResolutionChange() {
    if (_designResolutionWatched) {
        return;
    }
    _designResolutionWatched = true;
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../configuration')));
    const { MessageType } = await Promise.resolve().then(() => __importStar(require('../configuration/script/interface')));
    const { socketService } = await Promise.resolve().then(() => __importStar(require('../../server/socket')));
    const push = () => {
        socketService.io?.emit('scene:invoke', { module: 'Engine', method: 'syncDesignResolution', args: [] });
    };
    // 进程内变更（PinK/调用方走 cli 配置系统 set/reload 时触发）
    configurationManager.on(MessageType.Update, (key) => {
        if (typeof key === 'string' && key.startsWith('engine.designResolution')) {
            push();
        }
    });
    configurationManager.on(MessageType.Reload, () => push());
}
let _collisionGroupsWatched = false;
/**
 * 监听工程物理碰撞分组变更，运行时重建引擎 PhysicsGroup 枚举并刷新属性面板。
 *
 * 分组只在引擎初始化时读取一次生成枚举，改配置后不重建就要重启 IDE（属性面板 Group 下拉的 enumList
 * 来自该枚举）。这里对齐 cocos-editor 的 project:update-physics-group：把最新分组通过 socket.io
 * scene:invoke 通道推给场景 webview 的 Engine.updatePhysicsGroup（属性面板的 node:change 来自该 webview，
 * 与设计分辨率同款通道），无需经主进程 / 子进程 RPC，也不对外暴露到 MCP。
 */
async function watchCollisionGroupsChange() {
    if (_collisionGroupsWatched) {
        return;
    }
    _collisionGroupsWatched = true;
    const { configurationManager } = await Promise.resolve().then(() => __importStar(require('../configuration')));
    const { MessageType } = await Promise.resolve().then(() => __importStar(require('../configuration/script/interface')));
    const { socketService } = await Promise.resolve().then(() => __importStar(require('../../server/socket')));
    const fse = await Promise.resolve().then(() => __importStar(require('fs-extra')));
    // 读磁盘 cocos.config.json（配置真相源）取最新分组。返回 null 表示磁盘上没有该配置/读失败，
    // 以便与「真的空数组（分组被全部删除）」区分。
    // 不用 configurationManager.get：reload() 的 load() 不会把新值同步回已注册的配置实例，get() 会拿到旧值。
    const readGroupsFromDisk = async () => {
        try {
            const configPath = await configurationManager.getConfigPath();
            if (await fse.pathExists(configPath)) {
                const json = await fse.readJSON(configPath);
                const disk = json?.engine?.physicsConfig?.collisionGroups;
                if (Array.isArray(disk)) {
                    return disk;
                }
            }
        }
        catch (error) {
            console.debug('[Scene] read collisionGroups from disk failed:', error);
        }
        return null;
    };
    const push = (groups, source) => {
        console.log(`[Scene] physics collisionGroups changed, updating engine enum (${groups.length} groups, source=${source})`);
        // 通过 socket.io 通知浏览器场景页（scene webview）重建 PhysicsGroup 枚举并刷新属性面板。
        // 属性面板的 node:change 来自场景 webview，故只需推给 webview，无需经主进程/子进程 RPC。
        socketService.io?.emit('scene:invoke', { module: 'Engine', method: 'updatePhysicsGroup', args: [groups] });
    };
    // 从事件 payload 中提取分组数组，兼容多种保存粒度：
    //   - 精确子键：value 直接是数组
    //   - 整体保存 physicsConfig：value.collisionGroups
    //   - 整体保存 engine / Reload 的 projectConfig：value.(engine.)physicsConfig.collisionGroups
    const extractGroups = (raw) => {
        if (Array.isArray(raw)) {
            return raw;
        }
        if (raw && typeof raw === 'object') {
            if (Array.isArray(raw.collisionGroups)) {
                return raw.collisionGroups;
            }
            if (Array.isArray(raw.physicsConfig?.collisionGroups)) {
                return raw.physicsConfig.collisionGroups;
            }
            if (Array.isArray(raw.engine?.physicsConfig?.collisionGroups)) {
                return raw.engine.physicsConfig.collisionGroups;
            }
        }
        return undefined;
    };
    // 防抖合并：连续增删多个分组时，只在操作停止 400ms 后统一处理一次，读取「最终」分组状态并刷新一次，
    // 从根上消除逐次事件因数据/刷新时序错位造成的“差一步”（连加只更新一个 / 删除残留一个）。
    let debounceTimer = null;
    let latestPayload;
    const flush = async () => {
        debounceTimer = null;
        const payload = latestPayload;
        latestPayload = undefined;
        // 优先用已落定的磁盘真相（能表达“全部删除=空数组”）；磁盘无此配置时退回最近一次事件 payload
        const disk = await readGroupsFromDisk();
        const groups = disk ?? payload ?? [];
        push(groups, disk ? 'disk' : (payload ? 'payload' : 'empty'));
    };
    const schedule = (payloadGroups) => {
        if (payloadGroups) {
            latestPayload = payloadGroups;
        }
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => void flush(), 400);
    };
    configurationManager.on(MessageType.Update, (key, value) => {
        // 兼容精确子键（engine.physicsConfig.collisionGroups）与整体保存（engine.physicsConfig / engine）
        if (typeof key === 'string' && (key.startsWith('engine.physicsConfig') || key === 'engine')) {
            schedule(extractGroups(value));
        }
    });
    configurationManager.on(MessageType.Reload, (projectConfig) => schedule(extractGroups(projectConfig)));
}
/**
 * 启动场景
 * @param enginePath 引擎目录
 * @param projectPath 项目目录
 */
async function startupScene(enginePath, projectPath) {
    await init();
    // 启动场景进程
    const { sceneWorker } = await Promise.resolve().then(() => __importStar(require('./main-process/scene-worker')));
    await sceneWorker.start(enginePath, projectPath);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsc0NBU0M7QUFHRCxvQkFlQztBQXFJRCxvQ0FLQztBQXRMRCx3REFBZ0M7QUFDaEMsbURBQXNEO0FBSzdDLG9HQUxBLG1DQUFtQixPQUtBO0FBSjVCLE9BQU87QUFDUCwyQ0FBeUI7QUFDekIsTUFBTTtBQUNOLGlEQUErQjtBQUcvQix3REFBNEQ7QUFDNUQsMEVBQWlEO0FBQ2pELDhGQUFvRTtBQUVwRSxNQUFNLFdBQVcsR0FBdUM7SUFDcEQsRUFBRSxFQUFFLEdBQUcsRUFBRSxtREFBUSxXQUFXLEdBQUM7SUFDN0IsRUFBRSxFQUFFLEdBQUcsRUFBRSxtREFBUSxXQUFXLEdBQUM7Q0FDaEMsQ0FBQztBQUVLLEtBQUssVUFBVSxhQUFhO0lBQy9CLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7UUFDdkQsSUFBSSxDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLEVBQUUsQ0FBQztZQUM1QixjQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLElBQUksQ0FBQyx5Q0FBeUMsSUFBSSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUUsQ0FBQztJQUNMLENBQUM7QUFDTCxDQUFDO0FBRUQsVUFBVTtBQUNILEtBQUssVUFBVSxJQUFJO0lBQ3RCLE1BQU0sYUFBYSxFQUFFLENBQUM7SUFFdEIsaUVBQWlFO0lBQ2pFLHdEQUF3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LEVBQUUsQ0FBQztZQUNoQixZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUNELGFBQWEsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxLQUFLLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN4RCxDQUFDLENBQUM7SUFFRixvQkFBb0IsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQVcsRUFBRSxLQUFVLEVBQUUsRUFBRTtRQUNwRSxtRkFBbUY7UUFDbkYsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLElBQUksR0FBRyxLQUFLLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDMUYsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUNILG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsYUFBa0IsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEgsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSSxLQUFLLFVBQVUsWUFBWSxDQUFDLFVBQWtCLEVBQUUsV0FBbUI7SUFDdEUsTUFBTSxJQUFJLEVBQUUsQ0FBQztJQUNiLFNBQVM7SUFDVCxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsd0RBQWEsNkJBQTZCLEdBQUMsQ0FBQztJQUNwRSxNQUFNLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3JELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaTE4biBmcm9tICcuLi9iYXNlL2kxOG4nO1xuaW1wb3J0IHsgc2NlbmVDb25maWdJbnN0YW5jZSB9IGZyb20gJy4vc2NlbmUtY29uZmlncyc7XG4vLyDmjqXlj6PnsbvlnotcbmV4cG9ydCAqIGZyb20gJy4vY29tbW9uJztcbi8vIOS4u+i/m+eoi1xuZXhwb3J0ICogZnJvbSAnLi9tYWluLXByb2Nlc3MnO1xuZXhwb3J0IHsgc2NlbmVDb25maWdJbnN0YW5jZSB9O1xuXG5pbXBvcnQgeyBtaWRkbGV3YXJlU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZlci9taWRkbGV3YXJlJztcbmltcG9ydCBTY2VuZU1pZGRsZXdhcmUgZnJvbSAnLi9zY2VuZS5taWRkbGV3YXJlJztcbmltcG9ydCBTY2VuZVNjcmlwdGluZ01pZGRsZXdhcmUgZnJvbSAnLi9zY2VuZS5zY3JpcHRpbmcubWlkZGxld2FyZSc7XG5cbmNvbnN0IGkxOG5Nb2R1bGVzOiBSZWNvcmQ8c3RyaW5nLCAoKSA9PiBQcm9taXNlPGFueT4+ID0ge1xuICAgIHpoOiAoKSA9PiBpbXBvcnQoJy4vaTE4bi96aCcpLFxuICAgIGVuOiAoKSA9PiBpbXBvcnQoJy4vaTE4bi9lbicpLFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRTY2VuZUkxOG4oKSB7XG4gICAgZm9yIChjb25zdCBbbGFuZywgbG9hZGVyXSBvZiBPYmplY3QuZW50cmllcyhpMThuTW9kdWxlcykpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBsb2FkZXIoKTtcbiAgICAgICAgICAgIGkxOG4ucmVnaXN0ZXJMYW5ndWFnZVBhdGNoKGxhbmcsICdzY2VuZScsIGRhdGEuZGVmYXVsdCB8fCBkYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1NjZW5lXSBGYWlsZWQgdG8gbG9hZCBzY2VuZSBpMThuIGZvciAke2xhbmd9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8g5Zy65pmv6YWN572u5Yid5aeL5YyWXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBhd2FpdCBsb2FkU2NlbmVJMThuKCk7XG5cbiAgICAvLyDnu5/kuIDms6jlhozmtY/op4jlmajmuLjmiI/pooTop4jot6/nlLHvvIjmianlsZXpooTop4jlkI7nq68gKyBHYW1lUHJldmlldyArIOeDremHjei9ve+8ie+8jOW/hemhu+WcqCBTY2VuZVNjcmlwdGluZyAvXG4gICAgLy8gU2NlbmUg5LmL5YmN77yM5L2/IC8g5Y+K6LWE5rqQ6Lev55Sx5LyY5YWI5LqO5Zy65pmv5Lit6Ze05Lu255qE5a695rOb6Lev55Sx44CC5pS+5ZyoIHNjZW5lIGluaXQg6YeM77yM5L+d6K+B5omA5pyJ6LWwXG4gICAgLy8gc3RhcnR1cCAvIHN0YXJ0dXBTY2VuZSDnmoTosIPnlKjmlrnvvIjlkKvlhbblroMgSURFIOmbhuaIkO+8iemDveW+l+WIsOS4gOiHtOeahOKAnOWcuuaZr+e8lui+keWZqCArIOa1j+iniOWZqOmihOiniOKAneihjOS4uuOAglxuICAgIGNvbnN0IHsgZGVmYXVsdDogc2NyaXB0aW5nIH0gPSBhd2FpdCBpbXBvcnQoJy4uL3NjcmlwdGluZycpO1xuICAgIGNvbnN0IHsgcmVnaXN0ZXJCcm93c2VyUHJldmlldyB9ID0gYXdhaXQgaW1wb3J0KCcuLi9wcmV2aWV3L3JlZ2lzdGVyJyk7XG4gICAgYXdhaXQgcmVnaXN0ZXJCcm93c2VyUHJldmlldyhzY3JpcHRpbmcucHJvamVjdFBhdGgpO1xuXG4gICAgbWlkZGxld2FyZVNlcnZpY2UucmVnaXN0ZXIoJ1NjZW5lU2NyaXB0aW5nJywgU2NlbmVTY3JpcHRpbmdNaWRkbGV3YXJlKTtcbiAgICBtaWRkbGV3YXJlU2VydmljZS5yZWdpc3RlcignU2NlbmUnLCBTY2VuZU1pZGRsZXdhcmUpO1xuICAgIGF3YWl0IHNjZW5lQ29uZmlnSW5zdGFuY2UuaW5pdCgpO1xuICAgIGF3YWl0IHdhdGNoRGVzaWduUmVzb2x1dGlvbkNoYW5nZSgpO1xuICAgIGF3YWl0IHdhdGNoQ29sbGlzaW9uR3JvdXBzQ2hhbmdlKCk7XG59XG5cbmxldCBfZGVzaWduUmVzb2x1dGlvbldhdGNoZWQgPSBmYWxzZTtcbi8qKlxuICog55uR5ZCs5bel56iL6K6+6K6h5YiG6L6o546H5Y+Y5pu077yM5o6o6YCB5Yiw5rWP6KeI5Zmo5Zy65pmv5Yi35pawIGNjLnZpZXfjgIJcbiAqXG4gKiB3ZWIg6aKE6KeI5LiL5Zy65pmv6LeR5Zyo5rWP6KeI5Zmo77yM5Li76L+b56iL5peg5rOV6YCa6L+HIFJQQyDlj43lkJHosIPnlKjmtY/op4jlmaggc2VydmljZe+8iOa1j+iniOWZqOaYryBzZXRXZWJUcmFuc3BvcnQg5a6i5oi356uv44CBXG4gKiDmnKogcmVnaXN0ZXIoU2VydmljZSnvvInjgILlm6DmraTmlLnnlKggc29ja2V0Lmlv77yIbGl2ZS1yZWxvYWQg5ZCM5qy+55qEIHNlcnZlcuKGkmJyb3dzZXIg6YCa6YGT77yJ6YCa55+l5rWP6KeI5Zmo6LCD55SoXG4gKiDlroPoh6rlt7HnmoQgRW5naW5lLnN5bmNEZXNpZ25SZXNvbHV0aW9uIOKAlOKAlCDnrYnku7fkuo4gUnBjLnJlcXVlc3QoJ0VuZ2luZScsJ3N5bmNEZXNpZ25SZXNvbHV0aW9uJyxbXSnjgIJcbiAqIOWvuem9kCBjb2Nvcy1lZGl0b3Ig55qEIHByb2plY3Q6Y2hhbmdlLWRlc2lnbi1yZXNvbHV0aW9uIOaOqOmAgeOAglxuICovXG5hc3luYyBmdW5jdGlvbiB3YXRjaERlc2lnblJlc29sdXRpb25DaGFuZ2UoKSB7XG4gICAgaWYgKF9kZXNpZ25SZXNvbHV0aW9uV2F0Y2hlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIF9kZXNpZ25SZXNvbHV0aW9uV2F0Y2hlZCA9IHRydWU7XG4gICAgY29uc3QgeyBjb25maWd1cmF0aW9uTWFuYWdlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi9jb25maWd1cmF0aW9uJyk7XG4gICAgY29uc3QgeyBNZXNzYWdlVHlwZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi9jb25maWd1cmF0aW9uL3NjcmlwdC9pbnRlcmZhY2UnKTtcbiAgICBjb25zdCB7IHNvY2tldFNlcnZpY2UgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vc2VydmVyL3NvY2tldCcpO1xuICAgIGNvbnN0IHB1c2ggPSAoKSA9PiB7XG4gICAgICAgIHNvY2tldFNlcnZpY2UuaW8/LmVtaXQoJ3NjZW5lOmludm9rZScsIHsgbW9kdWxlOiAnRW5naW5lJywgbWV0aG9kOiAnc3luY0Rlc2lnblJlc29sdXRpb24nLCBhcmdzOiBbXSB9KTtcbiAgICB9O1xuICAgIC8vIOi/m+eoi+WGheWPmOabtO+8iFBpbksv6LCD55So5pa56LWwIGNsaSDphY3nva7ns7vnu58gc2V0L3JlbG9hZCDml7bop6blj5HvvIlcbiAgICBjb25maWd1cmF0aW9uTWFuYWdlci5vbihNZXNzYWdlVHlwZS5VcGRhdGUsIChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYga2V5LnN0YXJ0c1dpdGgoJ2VuZ2luZS5kZXNpZ25SZXNvbHV0aW9uJykpIHtcbiAgICAgICAgICAgIHB1c2goKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGNvbmZpZ3VyYXRpb25NYW5hZ2VyLm9uKE1lc3NhZ2VUeXBlLlJlbG9hZCwgKCkgPT4gcHVzaCgpKTtcbn1cblxubGV0IF9jb2xsaXNpb25Hcm91cHNXYXRjaGVkID0gZmFsc2U7XG4vKipcbiAqIOebkeWQrOW3peeoi+eJqeeQhueisOaSnuWIhue7hOWPmOabtO+8jOi/kOihjOaXtumHjeW7uuW8leaTjiBQaHlzaWNzR3JvdXAg5p6a5Li+5bm25Yi35paw5bGe5oCn6Z2i5p2/44CCXG4gKlxuICog5YiG57uE5Y+q5Zyo5byV5pOO5Yid5aeL5YyW5pe26K+75Y+W5LiA5qyh55Sf5oiQ5p6a5Li+77yM5pS56YWN572u5ZCO5LiN6YeN5bu65bCx6KaB6YeN5ZCvIElERe+8iOWxnuaAp+mdouadvyBHcm91cCDkuIvmi4nnmoQgZW51bUxpc3RcbiAqIOadpeiHquivpeaemuS4vu+8ieOAgui/memHjOWvuem9kCBjb2Nvcy1lZGl0b3Ig55qEIHByb2plY3Q6dXBkYXRlLXBoeXNpY3MtZ3JvdXDvvJrmiormnIDmlrDliIbnu4TpgJrov4cgc29ja2V0LmlvXG4gKiBzY2VuZTppbnZva2Ug6YCa6YGT5o6o57uZ5Zy65pmvIHdlYnZpZXcg55qEIEVuZ2luZS51cGRhdGVQaHlzaWNzR3JvdXDvvIjlsZ7mgKfpnaLmnb/nmoQgbm9kZTpjaGFuZ2Ug5p2l6Ieq6K+lIHdlYnZpZXfvvIxcbiAqIOS4juiuvuiuoeWIhui+qOeOh+WQjOasvumAmumBk++8ie+8jOaXoOmcgOe7j+S4u+i/m+eoiyAvIOWtkOi/m+eoiyBSUEPvvIzkuZ/kuI3lr7nlpJbmmrTpnLLliLAgTUNQ44CCXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHdhdGNoQ29sbGlzaW9uR3JvdXBzQ2hhbmdlKCkge1xuICAgIGlmIChfY29sbGlzaW9uR3JvdXBzV2F0Y2hlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIF9jb2xsaXNpb25Hcm91cHNXYXRjaGVkID0gdHJ1ZTtcbiAgICBjb25zdCB7IGNvbmZpZ3VyYXRpb25NYW5hZ2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2NvbmZpZ3VyYXRpb24nKTtcbiAgICBjb25zdCB7IE1lc3NhZ2VUeXBlIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2NvbmZpZ3VyYXRpb24vc2NyaXB0L2ludGVyZmFjZScpO1xuICAgIGNvbnN0IHsgc29ja2V0U2VydmljZSB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9zZXJ2ZXIvc29ja2V0Jyk7XG4gICAgY29uc3QgZnNlID0gYXdhaXQgaW1wb3J0KCdmcy1leHRyYScpO1xuICAgIC8vIOivu+ejgeebmCBjb2Nvcy5jb25maWcuanNvbu+8iOmFjee9ruecn+ebuOa6kO+8ieWPluacgOaWsOWIhue7hOOAgui/lOWbniBudWxsIOihqOekuuejgeebmOS4iuayoeacieivpemFjee9ri/or7vlpLHotKXvvIxcbiAgICAvLyDku6Xkvr/kuI7jgIznnJ/nmoTnqbrmlbDnu4TvvIjliIbnu4Tooqvlhajpg6jliKDpmaTvvInjgI3ljLrliIbjgIJcbiAgICAvLyDkuI3nlKggY29uZmlndXJhdGlvbk1hbmFnZXIuZ2V077yacmVsb2FkKCkg55qEIGxvYWQoKSDkuI3kvJrmiormlrDlgLzlkIzmraXlm57lt7Lms6jlhoznmoTphY3nva7lrp7kvovvvIxnZXQoKSDkvJrmi7/liLDml6flgLzjgIJcbiAgICBjb25zdCByZWFkR3JvdXBzRnJvbURpc2sgPSBhc3luYyAoKTogUHJvbWlzZTx7IGluZGV4OiBudW1iZXI7IG5hbWU6IHN0cmluZyB9W10gfCBudWxsPiA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWdQYXRoID0gYXdhaXQgY29uZmlndXJhdGlvbk1hbmFnZXIuZ2V0Q29uZmlnUGF0aCgpO1xuICAgICAgICAgICAgaWYgKGF3YWl0IGZzZS5wYXRoRXhpc3RzKGNvbmZpZ1BhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IGZzZS5yZWFkSlNPTihjb25maWdQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNrID0ganNvbj8uZW5naW5lPy5waHlzaWNzQ29uZmlnPy5jb2xsaXNpb25Hcm91cHM7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGlzaykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpc2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnW1NjZW5lXSByZWFkIGNvbGxpc2lvbkdyb3VwcyBmcm9tIGRpc2sgZmFpbGVkOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIGNvbnN0IHB1c2ggPSAoZ3JvdXBzOiB7IGluZGV4OiBudW1iZXI7IG5hbWU6IHN0cmluZyB9W10sIHNvdXJjZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbU2NlbmVdIHBoeXNpY3MgY29sbGlzaW9uR3JvdXBzIGNoYW5nZWQsIHVwZGF0aW5nIGVuZ2luZSBlbnVtICgke2dyb3Vwcy5sZW5ndGh9IGdyb3Vwcywgc291cmNlPSR7c291cmNlfSlgKTtcbiAgICAgICAgLy8g6YCa6L+HIHNvY2tldC5pbyDpgJrnn6XmtY/op4jlmajlnLrmma/pobXvvIhzY2VuZSB3ZWJ2aWV377yJ6YeN5bu6IFBoeXNpY3NHcm91cCDmnprkuL7lubbliLfmlrDlsZ7mgKfpnaLmnb/jgIJcbiAgICAgICAgLy8g5bGe5oCn6Z2i5p2/55qEIG5vZGU6Y2hhbmdlIOadpeiHquWcuuaZryB3ZWJ2aWV377yM5pWF5Y+q6ZyA5o6o57uZIHdlYnZpZXfvvIzml6DpnIDnu4/kuLvov5vnqIsv5a2Q6L+b56iLIFJQQ+OAglxuICAgICAgICBzb2NrZXRTZXJ2aWNlLmlvPy5lbWl0KCdzY2VuZTppbnZva2UnLCB7IG1vZHVsZTogJ0VuZ2luZScsIG1ldGhvZDogJ3VwZGF0ZVBoeXNpY3NHcm91cCcsIGFyZ3M6IFtncm91cHNdIH0pO1xuICAgIH07XG5cbiAgICAvLyDku47kuovku7YgcGF5bG9hZCDkuK3mj5Dlj5bliIbnu4TmlbDnu4TvvIzlhbzlrrnlpJrnp43kv53lrZjnspLluqbvvJpcbiAgICAvLyAgIC0g57K+56Gu5a2Q6ZSu77yadmFsdWUg55u05o6l5piv5pWw57uEXG4gICAgLy8gICAtIOaVtOS9k+S/neWtmCBwaHlzaWNzQ29uZmln77yadmFsdWUuY29sbGlzaW9uR3JvdXBzXG4gICAgLy8gICAtIOaVtOS9k+S/neWtmCBlbmdpbmUgLyBSZWxvYWQg55qEIHByb2plY3RDb25maWfvvJp2YWx1ZS4oZW5naW5lLilwaHlzaWNzQ29uZmlnLmNvbGxpc2lvbkdyb3Vwc1xuICAgIGNvbnN0IGV4dHJhY3RHcm91cHMgPSAocmF3OiBhbnkpOiB7IGluZGV4OiBudW1iZXI7IG5hbWU6IHN0cmluZyB9W10gfCB1bmRlZmluZWQgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyYXcpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmF3O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyYXcgJiYgdHlwZW9mIHJhdyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJhdy5jb2xsaXNpb25Hcm91cHMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhdy5jb2xsaXNpb25Hcm91cHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyYXcucGh5c2ljc0NvbmZpZz8uY29sbGlzaW9uR3JvdXBzKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByYXcucGh5c2ljc0NvbmZpZy5jb2xsaXNpb25Hcm91cHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyYXcuZW5naW5lPy5waHlzaWNzQ29uZmlnPy5jb2xsaXNpb25Hcm91cHMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhdy5lbmdpbmUucGh5c2ljc0NvbmZpZy5jb2xsaXNpb25Hcm91cHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9O1xuXG4gICAgLy8g6Ziy5oqW5ZCI5bm277ya6L+e57ut5aKe5Yig5aSa5Liq5YiG57uE5pe277yM5Y+q5Zyo5pON5L2c5YGc5q2iIDQwMG1zIOWQjue7n+S4gOWkhOeQhuS4gOasoe+8jOivu+WPluOAjOacgOe7iOOAjeWIhue7hOeKtuaAgeW5tuWIt+aWsOS4gOasoe+8jFxuICAgIC8vIOS7juagueS4iua2iOmZpOmAkOasoeS6i+S7tuWboOaVsOaNri/liLfmlrDml7bluo/plJnkvY3pgKDmiJDnmoTigJzlt67kuIDmraXigJ3vvIjov57liqDlj6rmm7TmlrDkuIDkuKogLyDliKDpmaTmrovnlZnkuIDkuKrvvInjgIJcbiAgICBsZXQgZGVib3VuY2VUaW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbGF0ZXN0UGF5bG9hZDogeyBpbmRleDogbnVtYmVyOyBuYW1lOiBzdHJpbmcgfVtdIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IGZsdXNoID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBkZWJvdW5jZVRpbWVyID0gbnVsbDtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGxhdGVzdFBheWxvYWQ7XG4gICAgICAgIGxhdGVzdFBheWxvYWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIC8vIOS8mOWFiOeUqOW3suiQveWumueahOejgeebmOecn+ebuO+8iOiDveihqOi+vuKAnOWFqOmDqOWIoOmZpD3nqbrmlbDnu4TigJ3vvInvvJvno4Hnm5jml6DmraTphY3nva7ml7bpgIDlm57mnIDov5HkuIDmrKHkuovku7YgcGF5bG9hZFxuICAgICAgICBjb25zdCBkaXNrID0gYXdhaXQgcmVhZEdyb3Vwc0Zyb21EaXNrKCk7XG4gICAgICAgIGNvbnN0IGdyb3VwcyA9IGRpc2sgPz8gcGF5bG9hZCA/PyBbXTtcbiAgICAgICAgcHVzaChncm91cHMsIGRpc2sgPyAnZGlzaycgOiAocGF5bG9hZCA/ICdwYXlsb2FkJyA6ICdlbXB0eScpKTtcbiAgICB9O1xuICAgIGNvbnN0IHNjaGVkdWxlID0gKHBheWxvYWRHcm91cHM/OiB7IGluZGV4OiBudW1iZXI7IG5hbWU6IHN0cmluZyB9W10pID0+IHtcbiAgICAgICAgaWYgKHBheWxvYWRHcm91cHMpIHtcbiAgICAgICAgICAgIGxhdGVzdFBheWxvYWQgPSBwYXlsb2FkR3JvdXBzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWJvdW5jZVRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VUaW1lcik7XG4gICAgICAgIH1cbiAgICAgICAgZGVib3VuY2VUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdm9pZCBmbHVzaCgpLCA0MDApO1xuICAgIH07XG5cbiAgICBjb25maWd1cmF0aW9uTWFuYWdlci5vbihNZXNzYWdlVHlwZS5VcGRhdGUsIChrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4ge1xuICAgICAgICAvLyDlhbzlrrnnsr7noa7lrZDplK7vvIhlbmdpbmUucGh5c2ljc0NvbmZpZy5jb2xsaXNpb25Hcm91cHPvvInkuI7mlbTkvZPkv53lrZjvvIhlbmdpbmUucGh5c2ljc0NvbmZpZyAvIGVuZ2luZe+8iVxuICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgKGtleS5zdGFydHNXaXRoKCdlbmdpbmUucGh5c2ljc0NvbmZpZycpIHx8IGtleSA9PT0gJ2VuZ2luZScpKSB7XG4gICAgICAgICAgICBzY2hlZHVsZShleHRyYWN0R3JvdXBzKHZhbHVlKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBjb25maWd1cmF0aW9uTWFuYWdlci5vbihNZXNzYWdlVHlwZS5SZWxvYWQsIChwcm9qZWN0Q29uZmlnOiBhbnkpID0+IHNjaGVkdWxlKGV4dHJhY3RHcm91cHMocHJvamVjdENvbmZpZykpKTtcbn1cblxuLyoqXG4gKiDlkK/liqjlnLrmma9cbiAqIEBwYXJhbSBlbmdpbmVQYXRoIOW8leaTjuebruW9lVxuICogQHBhcmFtIHByb2plY3RQYXRoIOmhueebruebruW9lVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnR1cFNjZW5lKGVuZ2luZVBhdGg6IHN0cmluZywgcHJvamVjdFBhdGg6IHN0cmluZykge1xuICAgIGF3YWl0IGluaXQoKTtcbiAgICAvLyDlkK/liqjlnLrmma/ov5vnqItcbiAgICBjb25zdCB7IHNjZW5lV29ya2VyIH0gPSBhd2FpdCBpbXBvcnQoJy4vbWFpbi1wcm9jZXNzL3NjZW5lLXdvcmtlcicpO1xuICAgIGF3YWl0IHNjZW5lV29ya2VyLnN0YXJ0KGVuZ2luZVBhdGgsIHByb2plY3RQYXRoKTtcbn1cbiJdfQ==