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
exports.title = void 0;
const packer_driver_1 = require("./packer-driver");
const executor_1 = require("@cocos/lib-programming/dist/executor");
const loader_1 = require("@cocos/creator-programming-quick-pack/lib/loader");
const event_emitter_1 = require("./event-emitter");
const node_uuid_1 = require("node-uuid");
exports.title = 'i18n:builder.tasks.load_script';
let executor = null;
const global_env_1 = require("../scene/common/global-env");
const globalEnv = new global_env_1.GlobalEnv();
class ScriptManager {
    on(type, listener) { return event_emitter_1.eventEmitter.on(type, listener); }
    off(type, listener) { return event_emitter_1.eventEmitter.off(type, listener); }
    once(type, listener) { return event_emitter_1.eventEmitter.once(type, listener); }
    _initialized = false;
    _pendingCompileTimer = null;
    _pendingCompileTaskId = null;
    _projectPath = '';
    /**
     * 初始化Scripting模块
     * @param projectPath 项目路径
     * @param enginePath 引擎路径
     * @param features 引擎功能特性列表
     */
    async initialize(projectPath, enginePath, features) {
        if (this._initialized) {
            return;
        }
        this._projectPath = projectPath;
        const packerDriver = await packer_driver_1.PackerDriver.create(projectPath, enginePath);
        await packerDriver.init(features);
        this._initialized = true;
    }
    get projectPath() {
        return this._projectPath;
    }
    /**
     * 查询文件的依赖者（谁使用了这个文件）
     * @param path 文件路径
     * @returns 使用该文件的其他文件路径列表
     */
    async queryScriptUsers(path) {
        return packer_driver_1.PackerDriver.getInstance().queryScriptUsers(path);
    }
    /**
     * 查询文件的依赖（这个文件使用了哪些文件）
     * @param path 文件路径
     * @returns 该文件依赖的其他文件路径列表
     */
    async queryScriptDependencies(path) {
        return packer_driver_1.PackerDriver.getInstance().queryScriptDeps(path);
    }
    /**
     * 查询共享配置
     * @returns 共享配置对象
     */
    async querySharedSettings() {
        return packer_driver_1.PackerDriver.getInstance().querySharedSettings();
    }
    /**
     * 生成类型声明文件
     */
    async generateDeclarations() {
        return packer_driver_1.PackerDriver.getInstance().generateDeclarations();
    }
    /**
     * @param type 变更类型
     * @param uuid 资源UUID
     * @param assetInfo 资源信息
     * @param meta 元数据
     */
    dispatchAssetChange(assetChange) {
        packer_driver_1.PackerDriver.getInstance().dispatchAssetChanges(assetChange);
    }
    /**
     * 调用方需要捕获异常，无异常则编译成功
     * 编译脚本文件
     * @param assetChanges 资源变更列表，如果未提供，则编译上一次缓存的资源变更列表
     */
    async compileScripts(assetChanges) {
        await packer_driver_1.PackerDriver.getInstance().build(assetChanges);
    }
    /**
     *
     * @param delay 延迟时间，单位为毫秒, 同一时间只能有一个延迟编译任务，如果存在则返回已有的任务ID
     * @returns 延迟编译任务的ID，如果存在则返回已有的任务ID
     */
    postCompileScripts(delay) {
        // 如果已经有待执行的延迟任务，取消它
        if (this._pendingCompileTimer) {
            clearTimeout(this._pendingCompileTimer);
        }
        // 如果已有任务ID，继续使用它；否则生成新的
        const taskId = this._pendingCompileTaskId || (0, node_uuid_1.v4)();
        this._pendingCompileTaskId = taskId;
        // 创建新的延迟任务
        this._pendingCompileTimer = setTimeout(async () => {
            if (this.isCompiling()) {
                this.postCompileScripts(delay);
                return taskId;
            }
            this._pendingCompileTimer = null;
            const currentTaskId = this._pendingCompileTaskId;
            this._pendingCompileTaskId = null;
            packer_driver_1.PackerDriver.getInstance().build(undefined, currentTaskId || undefined);
        }, delay);
        return taskId;
    }
    /**
     * 检查编译是否忙碌
     * @returns 是否正在编译
     */
    isCompiling() {
        return packer_driver_1.PackerDriver.getInstance().busy();
    }
    /**
     * 获取当前正在执行的编译任务ID
     * @returns 任务ID，如果没有正在执行的任务则返回null
     */
    getCurrentTaskId() {
        return packer_driver_1.PackerDriver.getInstance().getCurrentTaskId();
    }
    /**
     * 检查目标是否就绪
     * @param targetName 目标名称，如 'editor' 或 'preview'
     * @returns 是否就绪
     */
    isTargetReady(targetName) {
        return packer_driver_1.PackerDriver.getInstance().isReady(targetName) ?? false;
    }
    /**
     * 加载脚本并执行
     * @param scriptUuids 脚本UUID列表
     * @param pluginScripts 插件脚本信息列表
     */
    async loadScript(scriptUuids, pluginScripts = []) {
        if (!scriptUuids.length) {
            console.debug('No script need reload.');
            return;
        }
        console.debug('reload all scripts.');
        // TODO 需要支持按入参按需加载脚本
        await globalEnv.record(async () => {
            if (!executor) {
                console.log(`creating executor ...`);
                const packerDriver = packer_driver_1.PackerDriver.getInstance();
                const serializedPackLoaderContext = packerDriver.getQuickPackLoaderContext('editor').serialize();
                const quickPackLoaderContext = loader_1.QuickPackLoaderContext.deserialize(serializedPackLoaderContext);
                const { loadDynamic } = await Promise.resolve().then(() => __importStar(require('cc/preload')));
                const cceModuleMap = packer_driver_1.PackerDriver.queryCCEModuleMap();
                executor = await executor_1.Executor.create({
                    // @ts-ignore
                    importEngineMod: async (id) => {
                        return await loadDynamic(id);
                    },
                    quickPackLoaderContext,
                    cceModuleMap,
                });
                globalThis.self = window;
                executor.addPolyfillFile(require.resolve('@cocos/build-polyfills/prebuilt/editor/bundle'));
            }
            if (!executor) {
                console.error('Failed to init executor');
                return;
            }
            executor.setPluginScripts(pluginScripts || []);
            await executor.reload();
        });
    }
    /**
     * 查询CCE模块映射
     * @returns CCE模块映射对象
     */
    queryCCEModuleMap() {
        return packer_driver_1.PackerDriver.queryCCEModuleMap();
    }
    /**
     * 获取指定目标的Loader上下文
     * @param targetName 目标名称
     * @returns 序列化后的Loader上下文
     */
    getPackerDriverLoaderContext(targetName) {
        return packer_driver_1.PackerDriver.getInstance().getQuickPackLoaderContext(targetName)?.serialize();
    }
    /**
     * 清除缓存并重新编译
     */
    async clearCacheAndRebuild() {
        await packer_driver_1.PackerDriver.getInstance().clearCache();
    }
    /**
     * 更新数据库信息
     * @param dbInfos 数据库信息列表
     */
    async updateDatabases(dbInfo, dbChangeType) {
        await packer_driver_1.PackerDriver.getInstance().updateDbInfos(dbInfo, dbChangeType);
    }
    /**
     * 关闭脚本管理器，释放资源
     */
    async close() {
        if (!this._initialized) {
            return;
        }
        await packer_driver_1.PackerDriver.getInstance().shutDown();
        if (executor) {
            await executor.destroy?.();
            executor = null;
        }
        this._initialized = false;
    }
}
exports.default = new ScriptManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9zY3JpcHRpbmcvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsbURBQStDO0FBQy9DLG1FQUFnRTtBQUNoRSw2RUFBMEY7QUFDMUYsbURBQXVFO0FBRXZFLHlDQUF1QztBQUcxQixRQUFBLEtBQUssR0FBRyxnQ0FBZ0MsQ0FBQztBQUV0RCxJQUFJLFFBQVEsR0FBb0IsSUFBSSxDQUFDO0FBRXJDLDJEQUF1RDtBQUV2RCxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLEVBQUUsQ0FBQztBQUVsQyxNQUFNLGFBQWE7SUFFZixFQUFFLENBQUMsSUFBZSxFQUFFLFFBQTRCLElBQWlCLE9BQU8sNEJBQVksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRyxHQUFHLENBQUMsSUFBZSxFQUFFLFFBQTRCLElBQWlCLE9BQU8sNEJBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RyxJQUFJLENBQUMsSUFBZSxFQUFFLFFBQTRCLElBQWlCLE9BQU8sNEJBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0RyxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLG9CQUFvQixHQUEwQixJQUFJLENBQUM7SUFDbkQscUJBQXFCLEdBQWtCLElBQUksQ0FBQztJQUM1QyxZQUFZLEdBQVcsRUFBRSxDQUFDO0lBRWxDOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFtQixFQUFFLFVBQWtCLEVBQUUsUUFBa0I7UUFDeEUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEIsT0FBTztRQUNYLENBQUM7UUFDRCxJQUFJLENB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RUFBRSxDQUFDO1FBQzVDLElBQUksUUFBUSxFQUFFLENBQUM7WUFDWCxNQUFPLFFBQWdCLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUNwQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLENBQUM7UUFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztJQUM5QixDQUFDO0NBRUo7QUFFRCxrQkFBZSxJQUFJLGFBQWEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ0NFTW9kdWxlTWFwIH0gZnJvbSAnLi4vZW5naW5lL0B0eXBlcy9jb25maWcnO1xuaW1wb3J0IHsgSVBsdWdpblNjcmlwdEluZm8sIFNoYXJlZFNldHRpbmdzIH0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgUGFja2VyRHJpdmVyIH0gZnJvbSAnLi9wYWNrZXItZHJpdmVyJztcbmltcG9ydCB7IEV4ZWN1dG9yIH0gZnJvbSAnQGNvY29zL2xpYi1wcm9ncmFtbWluZy9kaXN0L2V4ZWN1dG9yJztcbmltcG9ydCB7IFF1aWNrUGFja0xvYWRlckNvbnRleHQgfSBmcm9tICdAY29jb3MvY3JlYXRvci1wcm9ncmFtbWluZy1xdWljay1wYWNrL2xpYi9sb2FkZXInO1xuaW1wb3J0IHsgQ3VzdG9tRXZlbnQsIEV2ZW50VHlwZSwgZXZlbnRFbWl0dGVyIH0gZnJvbSAnLi9ldmVudC1lbWl0dGVyJztcbmltcG9ydCB7IEFzc2V0Q2hhbmdlSW5mbywgREJDaGFuZ2VUeXBlIH0gZnJvbSAnLi9wYWNrZXItZHJpdmVyL2Fzc2V0LWRiLWludGVyb3AnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZCB9IGZyb20gJ25vZGUtdXVpZCc7XG5pbXBvcnQgeyBEQkluZm8gfSBmcm9tICcuL0B0eXBlcy9jb25maWctZXhwb3J0JztcblxuZXhwb3J0IGNvbnN0IHRpdGxlID0gJ2kxOG46YnVpbGRlci50YXNrcy5sb2FkX3NjcmlwdCc7XG5cbmxldCBleGVjdXRvcjogRXhlY3V0b3IgfCBudWxsID0gbnVsbDtcblxuaW1wb3J0IHsgR2xvYmFsRW52IH0gZnJvbSAnLi4vc2NlbmUvY29tbW9uL2dsb2JhbC1lbnYnO1xuXG5jb25zdCBnbG9iYWxFbnYgPSBuZXcgR2xvYmFsRW52KCk7XG5cbmNsYXNzIFNjcmlwdE1hbmFnZXIge1xuXG4gICAgb24odHlwZTogRXZlbnRUeXBlLCBsaXN0ZW5lcjogKGFyZzogYW55KSA9PiB2b2lkKTogQ3VzdG9tRXZlbnQgeyByZXR1cm4gZXZlbnRFbWl0dGVyLm9uKHR5cGUsIGxpc3RlbmVyKTsgfVxuICAgIG9mZih0eXBlOiBFdmVudFR5cGUsIGxpc3RlbmVyOiAoYXJnOiBhbnkpID0+IHZvaWQpOiBDdXN0b21FdmVudCB7IHJldHVybiBldmVudEVtaXR0ZXIub2ZmKHR5cGUsIGxpc3RlbmVyKTsgfVxuICAgIG9uY2UodHlwZTogRXZlbnRUeXBlLCBsaXN0ZW5lcjogKGFyZzogYW55KSA9PiB2b2lkKTogQ3VzdG9tRXZlbnQgeyByZXR1cm4gZXZlbnRFbWl0dGVyLm9uY2UodHlwZSwgbGlzdGVuZXIpOyB9XG5cbiAgICBwcml2YXRlIF9pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3BlbmRpbmdDb21waWxlVGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfcGVuZGluZ0NvbXBpbGVUYXNrSWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX3Byb2plY3RQYXRoOiBzdHJpbmcgPSAnJztcblxuICAgIC8qKlxuICAgICAqIOWIneWni+WMllNjcmlwdGluZ+aooeWdl1xuICAgICAqIEBwYXJhbSBwcm9qZWN0UGF0aCDpobnnm67ot6/lvoRcbiAgICAgKiBAcGFyYW0gZW5naW5lUGF0aCDlvJXmk47ot6/lvoRcbiAgICAgKiBAcGFyYW0gZmVhdHVyZXMg5byV5pOO5Yqf6IO954m55oCn5YiX6KGoXG4gICAgICovXG4gICAgYXN5bmMgaW5pdGlhbGl6ZShwcm9qZWN0UGF0aDogc3RyaW5nLCBlbmdpbmVQYXRoOiBzdHJpbmcsIGZlYXR1cmVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wcm9qZWN0UGF0aCA9IHByb2plY3RQYXRoO1xuICAgICAgICBjb25zdCBwYWNrZXJEcml2ZXIgPSBhd2FpdCBQYWNrZXJEcml2ZXIuY3JlYXRlKHByb2plY3RQYXRoLCBlbmdpbmVQYXRoKTtcbiAgICAgICAgYXdhaXQgcGFja2VyRHJpdmVyLmluaXQoZmVhdHVyZXMpO1xuICAgICAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgZ2V0IHByb2plY3RQYXRoKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcHJvamVjdFBhdGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+i5paH5Lu255qE5L6d6LWW6ICF77yI6LCB5L2/55So5LqG6L+Z5Liq5paH5Lu277yJXG4gICAgICogQHBhcmFtIHBhdGgg5paH5Lu26Lev5b6EXG4gICAgICogQHJldHVybnMg5L2/55So6K+l5paH5Lu255qE5YW25LuW5paH5Lu26Lev5b6E5YiX6KGoXG4gICAgICovXG4gICAgYXN5bmMgcXVlcnlTY3JpcHRVc2VycyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIHJldHVybiBQYWNrZXJEcml2ZXIuZ2V0SW5zdGFuY2UoKS5xdWVyeVNjcmlwdFVzZXJzKHBhdGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOafpeivouaWh+S7tueahOS+nei1lu+8iOi/meS4quaWh+S7tuS9v+eUqOS6huWTquS6m+aWh+S7tu+8iVxuICAgICAqIEBwYXJhbSBwYXRoIOaWh+S7tui3r+W+hFxuICAgICAqIEByZXR1cm5zIOivpeaWh+S7tuS+nei1lueahOWFtuS7luaWh+S7tui3r+W+hOWIl+ihqFxuICAgICAqL1xuICAgIGFzeW5jIHF1ZXJ5U2NyaXB0RGVwZW5kZW5jaWVzKHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgcmV0dXJuIFBhY2tlckRyaXZlci5nZXRJbnN0YW5jZSgpLnF1ZXJ5U2NyaXB0RGVwcyhwYXRoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmn6Xor6LlhbHkuqvphY3nva5cbiAgICAgKiBAcmV0dXJucyDlhbHkuqvphY3nva7lr7nosaFcbiAgICAgKi9cbiAgICBhc3luYyBxdWVyeVNoYXJlZFNldHRpbmdzKCk6IFByb21pc2U8U2hhcmVkU2V0dGluZ3M+IHtcbiAgICAgICAgcmV0dXJuIFBhY2tlckRyaXZlci5nZXRJbnN0YW5jZSgpLnF1ZXJ5U2hhcmVkU2V0dGluZ3MoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnlJ/miJDnsbvlnovlo7DmmI7mlofku7ZcbiAgICAgKi9cbiAgICBhc3luYyBnZW5lcmF0ZURlY2xhcmF0aW9ucygpIHtcbiAgICAgICAgcmV0dXJuIFBhY2tlckRyaXZlci5nZXRJbnN0YW5jZSgpLmdlbmVyYXRlRGVjbGFyYXRpb25zKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHR5cGUg5Y+Y5pu057G75Z6LXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQVVVJRFxuICAgICAqIEBwYXJhbSBhc3NldEluZm8g6LWE5rqQ5L+h5oGvXG4gICAgICogQHBhcmFtIG1ldGEg5YWD5pWw5o2uXG4gICAgICovXG4gICAgZGlzcGF0Y2hBc3NldENoYW5nZShhc3NldENoYW5nZTogQXNzZXRDaGFuZ2VJbmZvKTogdm9pZCB7XG4gICAgICAgIFBhY2tlckRyaXZlci5nZXRJbnN0YW5jZSgpLmRpc3BhdGNoQXNzZXRDaGFuZ2VzKGFzc2V0Q2hhbmdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDosIPnlKjmlrnpnIDopoHmjZXojrflvILluLjvvIzml6DlvILluLjliJnnvJbor5HmiJDlip9cbiAgICAgKiDnvJbor5HohJrmnKzmlofku7ZcbiAgICAgKiBAcGFyYW0gYXNzZXRDaGFuZ2VzIOi1hOa6kOWPmOabtOWIl+ihqO+8jOWmguaenOacquaPkOS+m++8jOWImee8luivkeS4iuS4gOasoee8k+WtmOeahOi1hOa6kOWPmOabtOWIl+ihqFxuICAgICAqL1xuICAgIGFzeW5jIGNvbXBpbGVTY3JpcHRzKGFzc2V0Q2hhbmdlcz86IEFzc2V0Q2hhbmdlSW5mb1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IFBhY2tlckRyaXZlci5nZXRJbnN0YW5jZSgpLmJ1aWxkKGFzc2V0Q2hhbmdlcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIGRlbGF5IOW7tui/n+aXtumXtO+8jOWNleS9jeS4uuavq+enkiwg5ZCM5LiA5pe26Ze05Y+q6IO95pyJ5LiA5Liq5bu26L+f57yW6K+R5Lu75Yqh77yM5aaC5p6c5a2Y5Zyo5YiZ6L+U5Zue5bey5pyJ55qE5Lu75YqhSURcbiAgICAgKiBAcmV0dXJucyDlu7bov5/nvJbor5Hku7vliqHnmoRJRO+8jOWmguaenOWtmOWcqOWImei/lOWbnuW3suacieeahOS7u+WKoUlEXG4gICAgICovXG4gICAgcG9zdENvbXBpbGVTY3JpcHRzKGRlbGF5OiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgICAvLyDlpoLmnpzlt7Lnu4/mnInlvoXmiafooYznmoTlu7bov5/ku7vliqHvvIzlj5bmtojlroNcbiAgICAgICAgaWYgKHRoaXMuX3BlbmRpbmdDb21waWxlVGltZXIpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9wZW5kaW5nQ29tcGlsZVRpbWVyKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5bey5pyJ5Lu75YqhSUTvvIznu6fnu63kvb/nlKjlroPvvJvlkKbliJnnlJ/miJDmlrDnmoRcbiAgICAgICAgY29uc3QgdGFza0lkID0gdGhpcy5fcGVuZGluZ0NvbXBpbGVUYXNrSWQgfHwgdXVpZCgpO1xuICAgICAgICB0aGlzLl9wZW5kaW5nQ29tcGlsZVRhc2tJZCA9IHRhc2tJZDtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuaWsOeahOW7tui/n+S7u+WKoVxuICAgICAgICB0aGlzLl9wZW5kaW5nQ29tcGlsZVRpbWVyID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0NvbXBpbGluZygpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3N0Q29tcGlsZVNjcmlwdHMoZGVsYXkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0YXNrSWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdDb21waWxlVGltZXIgPSBudWxsO1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFRhc2tJZCA9IHRoaXMuX3BlbmRpbmdDb21waWxlVGFza0lkO1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ0NvbXBpbGVUYXNrSWQgPSBudWxsO1xuICAgICAgICAgICAgUGFja2VyRHJpdmVyLmdldEluc3RhbmNlKCkuYnVpbGQodW5kZWZpbmVkLCBjdXJyZW50VGFza0lkIHx8IHVuZGVmaW5lZCk7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0YXNrSWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l57yW6K+R5piv5ZCm5b+Z56KMXG4gICAgICogQHJldHVybnMg5piv5ZCm5q2j5Zyo57yW6K+RXG4gICAgICovXG4gICAgaXNDb21waWxpbmcoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBQYWNrZXJEcml2ZXIuZ2V0SW5zdGFuY2UoKS5idXN5KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5b2T5YmN5q2j5Zyo5omn6KGM55qE57yW6K+R5Lu75YqhSURcbiAgICAgKiBAcmV0dXJucyDku7vliqFJRO+8jOWmguaenOayoeacieato+WcqOaJp+ihjOeahOS7u+WKoeWImei/lOWbnm51bGxcbiAgICAgKi9cbiAgICBnZXRDdXJyZW50VGFza0lkKCk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICByZXR1cm4gUGFja2VyRHJpdmVyLmdldEluc3RhbmNlKCkuZ2V0Q3VycmVudFRhc2tJZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeebruagh+aYr+WQpuWwsee7qlxuICAgICAqIEBwYXJhbSB0YXJnZXROYW1lIOebruagh+WQjeensO+8jOWmgiAnZWRpdG9yJyDmiJYgJ3ByZXZpZXcnXG4gICAgICogQHJldHVybnMg5piv5ZCm5bCx57uqXG4gICAgICovXG4gICAgaXNUYXJnZXRSZWFkeSh0YXJnZXROYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIFBhY2tlckRyaXZlci5nZXRJbnN0YW5jZSgpLmlzUmVhZHkodGFyZ2V0TmFtZSkgPz8gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yqg6L296ISa5pys5bm25omn6KGMXG4gICAgICogQHBhcmFtIHNjcmlwdFV1aWRzIOiEmuacrFVVSUTliJfooahcbiAgICAgKiBAcGFyYW0gcGx1Z2luU2NyaXB0cyDmj5Lku7bohJrmnKzkv6Hmga/liJfooahcbiAgICAgKi9cbiAgICBhc3luYyBsb2FkU2NyaXB0KHNjcmlwdFV1aWRzOiBzdHJpbmdbXSwgcGx1Z2luU2NyaXB0czogSVBsdWdpblNjcmlwdEluZm9bXSA9IFtdKSB7XG4gICAgICAgIGlmICghc2NyaXB0VXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdObyBzY3JpcHQgbmVlZCByZWxvYWQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5kZWJ1ZygncmVsb2FkIGFsbCBzY3JpcHRzLicpO1xuICAgICAgICAvLyBUT0RPIOmcgOimgeaUr+aMgeaMieWFpeWPguaMiemcgOWKoOi9veiEmuacrFxuICAgICAgICBhd2FpdCBnbG9iYWxFbnYucmVjb3JkKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICghZXhlY3V0b3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgY3JlYXRpbmcgZXhlY3V0b3IgLi4uYCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFja2VyRHJpdmVyID0gUGFja2VyRHJpdmVyLmdldEluc3RhbmNlKCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplZFBhY2tMb2FkZXJDb250ZXh0ID0gcGFja2VyRHJpdmVyLmdldFF1aWNrUGFja0xvYWRlckNvbnRleHQoJ2VkaXRvcicpIS5zZXJpYWxpemUoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWlja1BhY2tMb2FkZXJDb250ZXh0ID0gUXVpY2tQYWNrTG9hZGVyQ29udGV4dC5kZXNlcmlhbGl6ZShzZXJpYWxpemVkUGFja0xvYWRlckNvbnRleHQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgbG9hZER5bmFtaWMgfSA9IGF3YWl0IGltcG9ydCgnY2MvcHJlbG9hZCcpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY2NlTW9kdWxlTWFwID0gUGFja2VyRHJpdmVyLnF1ZXJ5Q0NFTW9kdWxlTWFwKCk7XG4gICAgICAgICAgICAgICAgZXhlY3V0b3IgPSBhd2FpdCBFeGVjdXRvci5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEVuZ2luZU1vZDogYXN5bmMgKGlkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgbG9hZER5bmFtaWMoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBxdWlja1BhY2tMb2FkZXJDb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICBjY2VNb2R1bGVNYXAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGdsb2JhbFRoaXMuc2VsZiA9IHdpbmRvdztcbiAgICAgICAgICAgICAgICBleGVjdXRvci5hZGRQb2x5ZmlsbEZpbGUocmVxdWlyZS5yZXNvbHZlKCdAY29jb3MvYnVpbGQtcG9seWZpbGxzL3ByZWJ1aWx0L2VkaXRvci9idW5kbGUnKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZXhlY3V0b3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gaW5pdCBleGVjdXRvcicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4ZWN1dG9yLnNldFBsdWdpblNjcmlwdHMocGx1Z2luU2NyaXB0cyB8fCBbXSk7XG4gICAgICAgICAgICBhd2FpdCBleGVjdXRvci5yZWxvYWQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5p+l6K+iQ0NF5qih5Z2X5pig5bCEXG4gICAgICogQHJldHVybnMgQ0NF5qih5Z2X5pig5bCE5a+56LGhXG4gICAgICovXG4gICAgcXVlcnlDQ0VNb2R1bGVNYXAoKTogQ0NFTW9kdWxlTWFwIHtcbiAgICAgICAgcmV0dXJuIFBhY2tlckRyaXZlci5xdWVyeUNDRU1vZHVsZU1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluaMh+Wumuebruagh+eahExvYWRlcuS4iuS4i+aWh1xuICAgICAqIEBwYXJhbSB0YXJnZXROYW1lIOebruagh+WQjeensFxuICAgICAqIEByZXR1cm5zIOW6j+WIl+WMluWQjueahExvYWRlcuS4iuS4i+aWh1xuICAgICAqL1xuICAgIGdldFBhY2tlckRyaXZlckxvYWRlckNvbnRleHQodGFyZ2V0TmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBQYWNrZXJEcml2ZXIuZ2V0SW5zdGFuY2UoKS5nZXRRdWlja1BhY2tMb2FkZXJDb250ZXh0KHRhcmdldE5hbWUpPy5zZXJpYWxpemUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmuIXpmaTnvJPlrZjlubbph43mlrDnvJbor5FcbiAgICAgKi9cbiAgICBhc3luYyBjbGVhckNhY2hlQW5kUmVidWlsZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgUGFja2VyRHJpdmVyLmdldEluc3RhbmNlKCkuY2xlYXJDYWNoZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaWsOaVsOaNruW6k+S/oeaBr1xuICAgICAqIEBwYXJhbSBkYkluZm9zIOaVsOaNruW6k+S/oeaBr+WIl+ihqFxuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZURhdGFiYXNlcyhkYkluZm86IERCSW5mbywgZGJDaGFuZ2VUeXBlOiBEQkNoYW5nZVR5cGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgUGFja2VyRHJpdmVyLmdldEluc3RhbmNlKCkudXBkYXRlRGJJbmZvcyhkYkluZm8sIGRiQ2hhbmdlVHlwZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YWz6Zet6ISa5pys566h55CG5Zmo77yM6YeK5pS+6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgY2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICghdGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBQYWNrZXJEcml2ZXIuZ2V0SW5zdGFuY2UoKS5zaHV0RG93bigpO1xuICAgICAgICBpZiAoZXhlY3V0b3IpIHtcbiAgICAgICAgICAgIGF3YWl0IChleGVjdXRvciBhcyBhbnkpLmRlc3Ryb3k/LigpO1xuICAgICAgICAgICAgZXhlY3V0b3IgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBTY3JpcHRNYW5hZ2VyKCk7XG5cbi8vIOWvvOWHuuexu+Wei+S+m+WklumDqOS9v+eUqFxuZXhwb3J0IHsgQXNzZXRDaGFuZ2VJbmZvLCBBc3NldENoYW5nZVR5cGUgfSBmcm9tICcuL3BhY2tlci1kcml2ZXIvYXNzZXQtZGItaW50ZXJvcCc7XG5leHBvcnQgdHlwZSB7IFNoYXJlZFNldHRpbmdzLCBJUGx1Z2luU2NyaXB0SW5mbyB9IGZyb20gJy4vaW50ZXJmYWNlJztcbmV4cG9ydCB0eXBlIHsgQ0NFTW9kdWxlTWFwIH0gZnJvbSAnLi4vZW5naW5lL0B0eXBlcy9jb25maWcnO1xuZXhwb3J0IHR5cGUgeyBFdmVudFR5cGUgfSBmcm9tICcuL2V2ZW50LWVtaXR0ZXInO1xuZXhwb3J0IHR5cGUgeyBUeXBlU2NyaXB0QXNzZXRJbmZvQ2FjaGUgfSBmcm9tICcuL3NoYXJlZC9jYWNoZSc7XG4iXX0=