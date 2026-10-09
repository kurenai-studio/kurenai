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
