'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const events_1 = __importDefault(require("events"));
const console_1 = require("../../base/console");
const utils_1 = __importDefault(require("../../base/utils"));
/**
 * 扩展管理器
 * 更新一些场景暴露的扩展数据
 */
class PluginManager extends events_1.default {
    packageRegisterInfo = {};
    hookOrder = [];
    assetDBProfileMap = {};
    _tasks = [];
    _currentTask = null;
    // 插件注册控制锁，同一个插件同时只能执行一种任务
    pkgLock = {};
    ready = false;
    async init() {
        console_1.newConsole.trackMemoryStart('assets:worker-init: initPlugin');
        this.ready = true;
        this.emit('ready');
    }
    async destroyed() {
    }
    /**
     * 处理插件广播消息任务，由于各个处理消息异步，需要使用队列管理否则可能出现时序问题
     * @param name
     * @param handler
     * @param args
     */
    addTask(type, pkgName, handler, ...args) {
        this._tasks.push({
            type,
            pkgName,
            handler,
            args,
        });
        // 正常情况下，当前任务执行完会自动 step，当前无任务正在进行时 才手动调用 step 
        this.step();
    }
    async onPackageEnable(data) {
        const registerInfo = this.packageRegisterInfo[data.name];
        if (!registerInfo) {
            return;
        }
        registerInfo.enable = true;
        const contribution = data.contribution;
        if (contribution.script) {
            const registerScript = (0, path_1.join)(data.path, contribution.script);
            try {
                const mod = utils_1.default.File.requireFile(registerScript);
                if (typeof mod.load === 'function') {
                    await mod.load();
                }
                // 注册钩子函数索引
                if (Array.isArray(contribution['global-hook'])) {
                    registerInfo.hooks.push(...contribution['global-hook']);
                }
                if (Array.isArray(contribution['mount-hook'])) {
                    registerInfo.hooks.push(...contribution['mount-hook']);
                }
                if (registerInfo.hooks.length) {
                    this.hookOrder.push(data.name);
                }
                // 预注册自定义资源处理器
                if (contribution['asset-handler']) {
                    registerInfo.assetHandlerInfos = contribution['asset-handler'];
                }
                registerInfo.script = registerScript;
                // 注册自定义资源处理器
            }
            catch (error) {
                delete registerInfo.script;
                console.warn(`Description Failed to register the Asset-DB script from ${data.name}: ${registerInfo.script}.`);
                console.warn(error);
            }
        }
        if (contribution.mount) {
            registerInfo.mount = {
                ...contribution.mount,
                path: contribution.mount.path ? (0, path_1.join)(data.path, contribution.mount.path) : contribution.mount.path,
            };
            // 配置了 db 开关
            if (contribution.mount.enable) {
                this.assetDBProfileMap[`packages/${data.name}.json(${contribution.mount.enable})`] = data.name;
            }
        }
        this.emit('enable', data.name, registerInfo);
    }
    /**
     * 插件关闭后的一些卸载操作缓存清理，需要与 enable 里的处理互相呼应
     * @param data
     * @returns
     */
    async onPackageDisable(data) {
        const registerInfo = this.packageRegisterInfo[data.name];
        if (!registerInfo) {
            return;
        }
        registerInfo.enable = false;
        if (registerInfo.script) {
            try {
                const mod = require(registerInfo.script);
                mod.unload && mod.unload();
            }
            catch (error) {
                console.warn(error);
            }
            delete registerInfo.assetHandlerInfos;
            delete registerInfo.script;
        }
        this.hookOrder.splice(this.hookOrder.indexOf(data.name), 1);
        if (registerInfo.mount) {
            delete this.assetDBProfileMap[`packages/${data.name}.json(${registerInfo.mount.enable})`];
            delete registerInfo.mount;
        }
        this.emit('disabled', data.name, registerInfo);
    }
    async unRegisterDetach(data) {
        const registerInfo = this.packageRegisterInfo[data.name];
        if (!registerInfo) {
            return;
        }
        delete this.packageRegisterInfo[data.name];
    }
    async step() {
        if (!this._tasks.length) {
            return;
        }
        const nextTaskIndex = this._tasks.findIndex((task) => !this.pkgLock[task.pkgName]);
        if (nextTaskIndex === -1) {
            return;
        }
        const task = this._tasks[nextTaskIndex];
        this.pkgLock[task.pkgName] = true;
        this._tasks.splice(nextTaskIndex, 1);
        const logTitle = `run package(${task.pkgName}) handler(${task.type})`;
        try {
            console.debug(logTitle + ' start');
            await task.handler.call(this, ...task.args);
            console.debug(logTitle + ` success!`);
        }
        catch (error) {
            console.error(error);
            console.error(logTitle + ` failed!`);
        }
        this.pkgLock[task.pkgName] = false;
        await this.step();
    }
    getAssetDBInfos() {
        const res = [];
        for (const name of Object.keys(this.packageRegisterInfo)) {
            const dbInfo = this.getAssetDBInfo(name);
            dbInfo && (res.push(dbInfo));
        }
        return res;
    }
    getAssetDBInfo(name) {
        const info = this.packageRegisterInfo[name];
        if (!info || !info.mount) {
            return null;
        }
        return {
            name,
            readonly: !!info.mount.readonly,
            visible: info.mount.visible === false ? false : true,
            target: info.mount.path,
        };
    }
}
const pluginManager = new PluginManager();
exports.default = pluginManager;
