'use strict';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assetdb = __importStar(require("@cocos/asset-db"));
const events_1 = __importDefault(require("events"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const console_1 = require("../../base/console");
const utils_1 = require("../utils");
const plugin_1 = __importDefault(require("./plugin"));
const asset_handler_1 = __importDefault(require("./asset-handler"));
const filesystem_1 = require("./filesystem");
const i18n_1 = __importDefault(require("../../base/i18n"));
const utils_2 = __importDefault(require("../../base/utils"));
const asset_config_1 = __importDefault(require("../asset-config"));
const scripting_1 = __importDefault(require("../../scripting"));
const asset_db_interop_1 = require("../../scripting/packer-driver/asset-db-interop");
const asset_db_1 = require("@cocos/asset-db");
const AssetDBPriority = {
    internal: 99,
    assets: 98,
};
/**
 * 总管理器，管理整个资源进程的启动流程、以及一些子管理器的启动流程
 */
class AssetDBManager extends events_1.default {
    assetDBMap = {};
    globalInternalLibrary = false;
    setFileSystemProvider(provider) {
        (0, filesystem_1.setFileSystemProvider)(provider);
        assetdb.setFileSystemProvider(provider);
    }
    hasPause = false;
    startPause = false;
    get isPause() {
        // return this.hasPause || this.startPause;
        return false;
    }
    ready = false;
    waitPauseHandle;
    waitPausePromiseTask;
    state = 'free';
    assetDBInfo = {};
    waitingTaskQueue = [];
    waitingRefreshAsset = [];
    pendingAutoRefreshResolves = [];
    autoRefreshTimer;
    get assetBusy() {
        return this.assetBusyTask.size > 0;
    }
    reimportCheck = false;
    assetBusyTask = new Set();
    pluginManager = plugin_1.default;
    assetHandlerManager = asset_handler_1.default;
    static useCache = false;
    static libraryRoot;
    static tempRoot;
    get free() {
        return this.ready && !this.isPause && this.state !== 'free' && !this.assetBusy;
    }
    /**
     * 初始化，需要优先调用
     * @param 资源配置信息
     */
    async init() {
        const { assetDBList, flagReimportCheck, libraryRoot, tempRoot, restoreAssetDBFromCache } = asset_config_1.default.data;
        if (!assetDBList.length) {
            throw new Error(i18n_1.default.t('assets.init.no_asset_db_list'));
        }
        AssetDBManager.libraryRoot = libraryRoot;
        AssetDBManager.tempRoot = tempRoot;
        AssetDBManager.useCache = restoreAssetDBFromCache;
        assetDBList.forEach((info) => {
            this.assetDBInfo[info.name] = patchAssetDBInfo(info);
        });
        // TODO 版本升级资源应该只认自身记录的版本号
        // if (AssetDBManager.useCache && Project.info.version !== Project.info.lastVersion) {
        //     AssetDBManager.useCache = false;
        //     console.log(i18n.t('assets.restoreAssetDBFromCacheInValid.upgrade'));
        // }
        if (AssetDBManager.useCache && !(0, fs_extra_1.existsSync)(AssetDBManager.libraryRoot)) {
            AssetDBManager.useCache = false;
            console.log(i18n_1.default.t('assets.restore_asset_d_b_from_cache_in_valid.no_library_path'));
        }
        await this.pluginManager.init();
        await this.assetHandlerManager.init();
        this.reimportCheck = flagReimportCheck;
    }
    /**
     * 启动数据库入口
     */
    async start() {
        console_1.newConsole.trackTimeStart('assets:start-database');
        if (AssetDBManager.useCache) {
            await this._startFromCache();
        }
        else {
            // await this._start();
            await this._startDirectly();
        }
        await afterStartDB(this.assetDBInfo);
        this.ready = true;
        console_1.newConsole.trackTimeEnd('asset-db:start-database', { output: true });
        // 性能测试: 资源冷导入
        console_1.newConsole.trackTimeEnd('asset-db:ready', { output: true });
        this.emit('assets:ready');
        // TODO 不是常驻模式，则无需开启，启动成功后，开始加载尚未注册的资源处理器
        // this.assetHandlerManager.activateRegisterAll();
        this.step();
        // TODO 启动成功后开始再去做一些日志缓存清理
    }
    /**
     * 首次启动数据库
     */
    async _start() {
        console_1.newConsole.trackMemoryStart('assets:worker-init: preStart');
        const assetDBNames = Object.keys(this.assetDBInfo).sort((a, b) => (AssetDBPriority[b] || 0) - (AssetDBPriority[a] || 0));
        const startupDatabaseQueue = [];
        for (const assetDBName of assetDBNames) {
            const db = await this._createDB(this.assetDBInfo[assetDBName]);
            const waitingStartupDBInfo = await this._preStartDB(db);
            startupDatabaseQueue.push(waitingStartupDBInfo);
        }
        console_1.newConsole.trackMemoryEnd('asset-db:worker-init: preStart');
        console_1.newConsole.trackMemoryStart('assets:worker-init: startup');
        for (let i = 0; i < startupDatabaseQueue.length; i++) {
            const startupDatabase = startupDatabaseQueue[i];
            await this._startupDB(startupDatabase);
        }
        console_1.newConsole.trackMemoryEnd('asset-db:worker-init: startup');
    }
    /**
     * 直接启动数据库
     */
    async _startDirectly() {
        const assetDBNames = Object.keys(this.assetDBInfo).sort((a, b) => (AssetDBPriority[b] || 0) - (AssetDBPriority[a] || 0));
        for (const assetDBName of assetDBNames) {
            await this.startDB(this.assetDBInfo[assetDBName]);
        }
    }
    /**
     * 从缓存启动数据库，如果恢复失败会回退到原始的启动流程
     */
    async _startFromCache() {
        console.debug('try start all assetDB from cache...');
        const assetDBNames = Object.keys(this.assetDBInfo).sort((a, b) => (AssetDBPriority[b] || 0) - (AssetDBPriority[a] || 0));
        for (const assetDBName of assetDBNames) {
            const db = await this._createDB(this.assetDBInfo[assetDBName]);
            if ((0, fs_extra_1.existsSync)(db.cachePath)) {
                try {
                    await db.startWithCache();
                    this.assetDBInfo[assetDBName].state = 'startup';
                    this.emit('db-started', db);
                    console.debug(`start db ${assetDBName} with cache success`);
                    this.emit('assets:db-ready', this.assetDBInfo[assetDBName]);
                    continue;
                }
                catch (error) {
                    console.error(error);
                    console.warn(`start db ${assetDBName} with cache failed, try to start db ${assetDBName} without cache`);
                }
            }
            // 没有正常走完缓存恢复，走普通的启动流程
            const waitingStartupDBInfo = await this._preStartDB(db);
            await this._startupDB(waitingStartupDBInfo);
        }
    }
    isBusy() {
        for (const name in this.assetDBMap) {
            if (!this.assetDBMap[name]) {
                continue;
            }
            const db = this.assetDBMap[name];
            if (db.assetProgressInfo.wait > 0) {
                return true;
            }
        }
        return false;
    }
    hasDB(name) {
        return !!this.assetDBMap[name];
    }
    async startDB(info) {
        if (this.hasDB(info.name)) {
            return;
        }
        await this._createDB(info);
        await this._startDB(info.name);
        this.emit('assets:db-ready', info);
    }
    /**
     * 将一个绝对路径，转成 url 地址
     * @param path
     * @param dbName 可选
     */
    path2url(path, dbName) {
        // 否则会出现返回 'db://internal/../../../../../db:/internal' 的情况
        if (path === `db://${dbName}`) {
            return path;
        }
        let database;
        if (!dbName) {
            database = Object.values(assetDBManager.assetDBMap).find((db) => utils_2.default.Path.contains(db.options.target, path));
        }
        else {
            database = assetDBManager.assetDBMap[dbName];
        }
        if (!database) {
            console.error(`Can not find asset db with asset path: ${path}`);
            return path;
        }
        // 将 windows 上的 \ 转成 /，统一成 url 格式
        let _path = (0, path_1.relative)(database.options.target, path);
        _path = _path.replace(/\\/g, '/');
        return `db://${database.options.name}/${_path}`;
    }
    async _createDB(info) {
        (0, fs_extra_1.ensureDirSync)(info.library);
        (0, fs_extra_1.ensureDirSync)(info.temp);
        // TODO 目标数据库地址为空的时候，其实无需走后续完整的启动流程，可以考虑优化
        (0, fs_extra_1.ensureDirSync)(info.target);
        info.flags = {
            reimportCheck: this.reimportCheck,
        };
        const db = assetdb.create(info);
        this.assetDBMap[info.name] = db;
        db.importerManager.find = async (asset) => {
            const importer = await this.assetHandlerManager.findImporter(asset, true);
            if (importer) {
                return importer;
            }
            const newImporter = await this.assetHandlerManager.getDefaultImporter(asset);
            return newImporter || importer;
        };
        this.emit('db-created', db);
        console.debug(`create db ${info.name} success in ${info.library}`);
        // 初始化一些脚本需要的数据库信息
        await scripting_1.default.updateDatabases({ dbID: info.name, target: info.target }, asset_db_interop_1.DBChangeType.add);
        return db;
    }
    /**
     * 预启动 db, 需要与 _startupDB 搭配使用，请勿单独调用
     * @param db
     * @returns
     */
    async _preStartDB(db) {
        const hooks = {
            afterScan,
        };
        // HACK 目前因为一些特殊的导入需求，将 db 启动流程强制分成了两次
        return await new Promise(async (resolve, reject) => {
            const handleInfo = {
                name: db.options.name,
                afterPreImportResolve: () => {
                    console.error(`Start database ${db.options.name} failed!`);
                    // 防止意外情况下，资源进程卡死无任何信息
                    handleInfo.finish && handleInfo.finish();
                },
            };
            // HACK 1/3 启动数据库时，不导入全部资源，先把预导入资源导入完成后进入等待状态
            hooks.afterPreImport = async () => {
                await afterPreImport(db);
                console.debug(`PreImport db ${db.options.name} success`);
                resolve(handleInfo);
                return new Promise((resolve) => {
                    handleInfo.afterPreImportResolve = resolve;
                });
            };
            hooks.afterStart = () => {
                handleInfo.finish && handleInfo.finish();
            };
            db.start({
                hooks,
            }).catch((error) => {
                reject(error);
            });
            this.assetDBInfo[db.options.name].state = 'start';
        });
    }
    /**
     * 完全启动之前预启动的 db ，请勿单独调用
     * @param startupDatabase
     */
    async _startupDB(startupDatabase) {
        console.debug(`Start up the '${startupDatabase.name}' database...`);
        console_1.newConsole.trackTimeStart(`asset-db: startup '${startupDatabase.name}' database...`);
        // 2/3 结束 afterPreImport 预留的等待状态，正常进入资源的导入流程,标记 finish 作为结束判断
        await new Promise(async (resolve) => {
            startupDatabase.finish = resolve;
            startupDatabase.afterPreImportResolve();
        });
        console_1.newConsole.trackTimeEnd(`asset-db:worker-startup-database[${startupDatabase.name}]`, { output: true });
        console_1.newConsole.trackMemoryEnd(`asset-db:worker-startup-database[${startupDatabase.name}]`);
        this.assetDBInfo[startupDatabase.name].state = 'startup';
        const db = this.assetDBMap[startupDatabase.name];
        this.emit('db-started', db);
        console_1.newConsole.trackTimeEnd(`asset-db: startup '${startupDatabase.name}' database...`);
    }
    /**
     * 启动某个指定数据库
     * @param name
     */
    async _startDB(name) {
        const db = this.assetDBMap[name];
        console_1.newConsole.trackTimeStart(`asset-db:worker-startup-database[${db.options.name}]`);
        console_1.newConsole.trackMemoryStart(`asset-db:worker-startup-database[${db.options.name}]`);
        this.assetDBInfo[name].state = 'start';
        const preImporterHandler = getPreImporterHandler(this.assetDBInfo[name].preImportExtList);
        if (preImporterHandler) {
            db.preImporterHandler = preImporterHandler;
        }
        const hooks = {
            afterScan,
        };
        hooks.afterPreImport = async () => {
            await afterPreImport(db);
        };
        console.debug(`start asset-db(${name})...`);
        await db.start({
            hooks,
        });
        this.assetDBInfo[name].state = 'startup';
        this.emit('db-started', db);
        console_1.newConsole.trackTimeEnd(`asset-db:worker-startup-database[${db.options.name}]`, { output: true });
        console_1.newConsole.trackMemoryEnd(`asset-db:worker-startup-database[${db.options.name}]`);
        return;
    }
    /**
     * 添加某个 asset db
     */
    async addDB(info) {
        this.assetDBInfo[info.name] = patchAssetDBInfo(info);
        await this.startDB(this.assetDBInfo[info.name]);
    }
    /**
     * 移除某个 asset-db
     * @param name
     * @returns
     */
    async removeDB(name) {
        if (this.isPause) {
            console.log(i18n_1.default.t('assets.asset_d_b_pause_tips', { operate: 'removeDB' }));
            return new Promise((resolve, reject) => {
                this._addTaskToQueue({
                    func: this._removeDB.bind(this),
                    args: [name],
                    resolve,
                    reject
                });
            });
        }
        return await this._removeDB(name);
    }
    async _operate(name, ...args) {
        const taskId = name + Date.now();
        if (name.endsWith('Asset')) {
            this.assetBusyTask.add(taskId);
        }
        try {
            // @ts-ignore
            const res = await this[name](...args);
            this.assetBusyTask.delete(taskId);
            return res;
        }
        catch (error) {
            console.error(`${name} failed with args: ${args.toString()}`);
            console.error(error);
            this.assetBusyTask.delete(taskId);
        }
    }
    async _removeDB(name) {
        const db = this.assetDBMap[name];
        if (!db) {
            return;
        }
        await db.stop();
        this.emit('db-removed', db);
        delete this.assetDBMap[name];
        delete this.assetDBInfo[name];
        this.emit('assets:db-close', name);
    }
    /**
     * 刷新所有数据库
     * @returns
     */
    async refresh() {
        if (!this.ready) {
            return;
        }
        if (this.state !== 'free' || this.isPause || this.assetBusy) {
            if (this.isPause) {
                console.log(i18n_1.default.t('assets.asset_d_b_pause_tips', { operate: 'refresh' }));
            }
            return new Promise((resolve, reject) => {
                this._addTaskToQueue({
                    func: this._refresh.bind(this),
                    args: [],
                    resolve,
                    reject
                });
            });
        }
        return await this._refresh();
    }
    async _refresh() {
        this.state = 'busy';
        console_1.newConsole.trackTimeStart('assets:refresh-all-database');
        for (const name in this.assetDBMap) {
            if (!this.assetDBMap[name]) {
                console.debug(`Get assetDB ${name} form manager failed!`);
                continue;
            }
            const db = this.assetDBMap[name];
            await db.refresh(db.options.target, {
                ignoreSelf: true,
                // 只有 assets 资源库做 effect 编译处理
                hooks: name === 'assets' ? {
                    afterPreImport: async () => {
                        await afterPreImport(db);
                    },
                } : {},
            });
            console.debug(`refresh db ${name} success`);
        }
        console_1.newConsole.trackTimeEnd('asset-db:refresh-all-database', { output: true });
        this.emit('assets:refresh-finish');
        this.state = 'free';
        this.step();
    }
    /**
     * 懒刷新资源，请勿使用，目前的逻辑是针对重刷文件夹定制的
     * @param file
     */
    async autoRefreshAssetLazy(pathOrUrlOrUUID) {
        if (!this.waitingRefreshAsset.includes(pathOrUrlOrUUID)) {
            this.waitingRefreshAsset.push(pathOrUrlOrUUID);
        }
        this.autoRefreshTimer && clearTimeout(this.autoRefreshTimer);
        return new Promise((resolve) => {
            this.pendingAutoRefreshResolves.push(resolve);
            this.autoRefreshTimer = setTimeout(async () => {
                const taskId = 'autoRefreshAssetLazy' + Date.now();
                this.assetBusyTask.add(taskId);
                const files = JSON.parse(JSON.stringify(this.waitingRefreshAsset));
                this.waitingRefreshAsset.length = 0;
                await Promise.all(files.map((file) => assetdb.refresh(file)));
                this.assetBusyTask.delete(taskId);
                this.step();
                this.pendingAutoRefreshResolves.forEach((resolve) => resolve(true));
                this.pendingAutoRefreshResolves.length = 0;
            }, 100);
        });
    }
    /**
     * 恢复被暂停的数据库
     * @returns
     */
    async resume() {
        if (!this.hasPause && !this.startPause) {
            return true;
        }
        this.hasPause = false;
        this.startPause = false;
        this.emit('assets:resume');
        await this.step();
        return true;
    }
    async addTask(func, args) {
        if (this.isPause || this.state === 'busy') {
            console.log(i18n_1.default.t('assets.asset_d_b_pause_tips', { operate: func.name }));
            return new Promise((resolve, reject) => {
                this._addTaskToQueue({
                    func,
                    args: args,
                    resolve,
                    reject,
                });
            });
        }
        return await func(...args);
    }
    _addTaskToQueue(task) {
        const last = this.waitingTaskQueue[this.waitingTaskQueue.length - 1];
        const curTask = {
            func: task.func,
            args: task.args,
        };
        if (task.resolve && task.reject) {
            curTask.resolves = [task.resolve];
            curTask.rejects = [task.reject];
        }
        if (!last) {
            this.waitingTaskQueue.push(curTask);
            this.step();
            return;
        }
        // 不一样的任务添加进队列
        if (last.func.name !== curTask.func.name || curTask.args.toString() !== last.args.toString()) {
            this.waitingTaskQueue.push(curTask);
            this.step();
            return;
        }
        // 将一样的任务合并
        if (!task.resolve || !task.reject) {
            return;
        }
        if (last.resolves && last.rejects) {
            last.resolves.push(task.resolve);
            last.rejects.push(task.reject);
        }
        else {
            last.resolves = curTask.resolves;
            last.rejects = curTask.rejects;
        }
        this.step();
    }
    async step() {
        // 存在等待的 handle 先处理回调
        if (this.startPause && this.waitPauseHandle) {
            this.waitPauseHandle(true);
            this.waitPauseHandle = undefined;
        }
        // db 暂停时，不处理等待任务
        if (this.isPause || !this.waitingTaskQueue.length || this.state === 'busy') {
            return;
        }
        // 深拷贝以避免在处理的过程中持续收到任务
        let waitingTaskQueue = Array.from(this.waitingTaskQueue);
        const lastWaitingQueue = [];
        // 当同时有资源操作与整体的检查刷新任务时，优先执行资源操作任务
        waitingTaskQueue = waitingTaskQueue.filter((task) => {
            if (!this.assetBusy || (this.assetBusy && task.func.name !== '_refresh')) {
                return true;
            }
            lastWaitingQueue.push(task);
            return false;
        });
        this.waitingTaskQueue = lastWaitingQueue;
        for (let index = 0; index < waitingTaskQueue.length; index++) {
            const task = waitingTaskQueue[index];
            try {
                if (task.func.name === '_refresh' && this.assetBusy) {
                    // 没有执行的任务塞回队列
                    this.waitingTaskQueue.push(task);
                    continue;
                }
                const res = await task.func(...task.args);
                if (!task.resolves) {
                    return;
                }
                task.resolves.forEach((resolve) => resolve(res));
            }
            catch (error) {
                console.warn(error);
                if (task.rejects) {
                    task.rejects.forEach((reject) => reject(error));
                }
            }
        }
        // 当前 step 的处理任务完成即可结束，剩余任务会在下一次 step 中处理
    }
    /**
     * 暂停数据库
     * @param source 来源标识
     * @returns
     */
    async pause(source = 'unkown') {
        this.startPause = true;
        // 只要当前底层没有正在处理的资源都视为资源进入可暂停状态
        if (!this.isBusy()) {
            this.hasPause = true;
            this.emit('assets:pause', source);
            console.log(`Asset DB is paused with ${source}!`);
            return true;
        }
        if (!this.hasPause) {
            return this.waitPausePromiseTask;
        }
        this.waitPausePromiseTask = new Promise((resolve) => {
            this.waitPauseHandle = () => {
                this.waitPausePromiseTask = undefined;
                this.emit('assets:pause', source);
                console.log(`Asset DB is paused with ${source}!`);
                this.hasPause = true;
                resolve(true);
            };
        });
        // 2 分钟的超时时间，超过自动返回回调
        setTimeout(() => {
            this.waitPausePromiseTask && (0, utils_1.decidePromiseState)(this.waitPausePromiseTask).then(state => {
                if (state === utils_1.PROMISE_STATE.PENDING) {
                    this.hasPause = true;
                    this.emit('assets:pause', source);
                    this.waitPauseHandle();
                    console.debug('Pause asset db time out');
                }
            });
        }, 2000 * 60);
        return this.waitPausePromiseTask;
    }
}
const assetDBManager = new AssetDBManager();
exports.default = assetDBManager;
globalThis.assetDBManager = assetDBManager;
function patchAssetDBInfo(config) {
    return {
        name: config.name,
        target: utils_2.default.Path.normalize(config.target),
        readonly: !!config.readonly,
        temp: config.temp || utils_2.default.Path.normalize((0, path_1.join)(AssetDBManager.tempRoot, config.name)),
        library: config.library || AssetDBManager.libraryRoot,
        level: 4,
        globList: asset_config_1.default.data.globList,
        ignoreFiles: [],
        visible: config.visible,
        state: 'none',
        preImportExtList: config.preImportExtList || [],
    };
}
// TODO 排队队列做合并
// class AutoMergeQueue extends Array {
//     add(item: IWaitingTask) {
//         const lastTask = this[this.length - 1];
//         // 自动合并和上一个任务一样的
//         if (!lastTask || !lodash.isEqual({name: item.name, args: item.args}, {name: lastTask.name, args: lastTask.args})) {
//             return this.push(item);
//         }
//         if (!item.resolve) {
//             return this.length - 1;
//         }
//         lastTask.resolves = lastTask.resolves ? [] : lastTask.resolves;
//         lastTask.resolve && lastTask.resolves.push(lastTask.resolve);
//         lastTask.resolves.push(item.resolve);
//     }
// }
const layerMask = [];
for (let i = 0; i <= 19; i++) {
    layerMask[i] = 1 << i;
}
const defaultPreImportExtList = ['.ts', '.chunk', '.effect'];
function getPreImporterHandler(preImportExtList) {
    if (!preImportExtList || !preImportExtList.length) {
        preImportExtList = defaultPreImportExtList;
    }
    else {
        preImportExtList = Array.from(new Set(preImportExtList.concat(defaultPreImportExtList)));
    }
    return function (file) {
        // HACK 用于指定部分资源优先导入
        const ext = (0, path_1.extname)(file);
        if (!ext) {
            return true;
        }
        else {
            return preImportExtList.includes(ext);
        }
    };
}
const afterScan = async function (files) {
    let dirIndex = 0;
    let chunkIndex = 0;
    let effectIndex = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = (0, path_1.extname)(file);
        if (!ext) {
            files.splice(i, 1);
            files.splice(dirIndex, 0, file);
            dirIndex += 1;
        }
        else if (ext === '.chunk') {
            files.splice(i, 1);
            files.splice(dirIndex + chunkIndex, 0, file);
            chunkIndex += 1;
        }
        else if (ext === '.effect') {
            files.splice(i, 1);
            files.splice(dirIndex + chunkIndex + effectIndex, 0, file);
            effectIndex += 1;
        }
    }
};
async function afterPreImport(db) {
    // 先把已收集的任务队列（preImporterHandler 过滤出来的那部分资源类型）内容优先导入执行完毕
    db.taskManager.start();
    await db.taskManager.waitQueue();
    db.taskManager.stop();
}
async function afterStartDB(dbInfoMap) {
    await asset_handler_1.default.compileEffect(true);
    // 启动数据库后，打开 effect 导入后的自动重新生成 effect.bin 开关
    await asset_handler_1.default.startAutoGenEffectBin();
    // Sync all script assets to packer-driver after databases are started.
    //
    // In the Editor, packer-driver receives script notifications via Editor.Message broadcasts
    // (asset-db:asset-add/change/delete) which fire regardless of cache state.
    // In CLI preview, there is no broadcast mechanism — packer-driver relies on compileScripts()
    // calls from importers. When useCache is true (or import order varies), some scripts may not
    // trigger compileScripts(), leaving packer-driver unaware of them.
    //
    // This batch sync mirrors the Editor's fetchAll() behavior: query all cc.Script assets
    // and notify packer-driver. _prerequisiteAssetMods is a Set, so duplicates are harmless.
    {
        const options = {
            ccType: 'cc.Script',
        };
        const assetInfos = globalThis.assetQuery.queryAssetInfos(options, ['meta', 'url', 'file', 'importer', 'type']);
        const changes = assetInfos.map(assetInfo => ({
            type: asset_db_1.AssetActionEnum.add,
            uuid: assetInfo.uuid,
            filePath: assetInfo.file,
            importer: assetInfo.importer,
            userData: assetInfo.meta?.userData || {},
        }));
        if (changes.length > 0) {
            try {
                await scripting_1.default.compileScripts(changes);
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    // 目前结构里，没有关闭数据库的逻辑
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9hc3NldHMvbWFuYWdlci9hc3NldC1kYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR2IseURBQTJDO0FBRTNDLG9EQUFrQztBQUNsQyx1Q0FBcUQ7QUFDckQsK0JBQStDO0FBQy9DLGdEQUFnRDtBQUNoRCxvQ0FBNkQ7QUFDN0Qsc0RBQXFDO0FBQ3JDLG9FQUFrRDtBQUNsRCw2Q0FBaUY7QUFDakYsMkRBQW1DO0FBQ25DLDZEQUFxQztBQUNyQyxtRUFBMEM7QUFDMUMsZ0VBQXdDO0FBQ3hDLHFGQUErRjtBQUMvRiw4Q0FBa0Q7QUFFbEQsTUFBTSxlQUFlLEdBQTJCO0lBQzVDLFFBQVEsRUFBRSxFQUFFO0lBQ1osTUFBTSxFQUFFLEVBQUU7Q0FDYixDQUFDO0FBd0JGOztHQUVHO0FBQ0gsTUFBTSxjQUFlLFNBQVEsZ0JBQVk7SUFDOUIsVUFBVSxHQUFvQyxFQUFFLENBQUM7SUFDakQscUJBQXFCLEdBQUcsS0FBSyxDQUFDO0lBRTlCLHFCQUFxQixDQUFDLFFBQWtDO1FBQzNELElBQUEsa0NBQXdCLEVBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFTyxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ2pCLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDM0IsSUFBVyxPQUFPO1FBQ2QsMkNBQTJDO1FBQzNDLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDTSxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2IsZUFBZSxDQUFZO0lBQzNCLG9CQUFvQixDQUFvQjtJQUN4QyxLQUFLLEdBQWlCLE1BQU0sQ0FBQztJQUM5QixXQUFXLEdBQWlDLEVBQUUsQ0FBQztJQUM5QyxnQkFBZ0Is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RUFBRSxXQUFXO1NBQ3RCLENBQUM7UUFDRixNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQWlCLENBQUM7UUFDL0gsTUFBTSxPQUFPLEdBQXNCLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVELElBQUksRUFBRSwwQkFBZSxDQUFDLEdBQUc7WUFDekIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFFBQVEsRUFBRSxTQUFTLENBQUMsSUFBSTtZQUN4QixRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7WUFDNUIsUUFBUSxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxJQUFJLEVBQUU7U0FDM0MsQ0FBQyxDQUFDLENBQUM7UUFDSixJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDO2dCQUNELE1BQU0sbUJBQVMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFDRCxtQkFBbUI7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXREQlJlZ2lzdGVySW5mbywgSUFzc2V0LCBJQXNzZXREQkluZm8sIElBc3NldEluZm8sIFF1ZXJ5QXNzZXRzT3B0aW9uIH0gZnJvbSAnLi4vQHR5cGVzL3ByaXZhdGUnO1xuaW1wb3J0ICogYXMgYXNzZXRkYiBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IHR5cGUgeyBJQXNzZXRGaWxlU3lzdGVtUHJvdmlkZXIgfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IHsgZW5zdXJlRGlyU3luYywgZXhpc3RzU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGV4dG5hbWUsIGpvaW4sIHJlbGF0aXZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBuZXdDb25zb2xlIH0gZnJvbSAnLi4vLi4vYmFzZS9jb25zb2xlJztcbmltcG9ydCB7IGRlY2lkZVByb21pc2VTdGF0ZSwgUFJPTUlTRV9TVEFURSB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBwbHVnaW5NYW5hZ2VyIGZyb20gJy4vcGx1Z2luJztcbmltcG9ydCBhc3NldEhhbmRsZXJNYW5hZ2VyIGZyb20gJy4vYXNzZXQtaGFuZGxlcic7XG5pbXBvcnQgeyBzZXRGaWxlU3lzdGVtUHJvdmlkZXIgYXMgc2V0Q0xJRmlsZVN5c3RlbVByb3ZpZGVyIH0gZnJvbSAnLi9maWxlc3lzdGVtJztcbmltcG9ydCBpMThuIGZyb20gJy4uLy4uL2Jhc2UvaTE4bic7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vYmFzZS91dGlscyc7XG5pbXBvcnQgYXNzZXRDb25maWcgZnJvbSAnLi4vYXNzZXQtY29uZmlnJztcbmltcG9ydCBzY3JpcHRpbmcgZnJvbSAnLi4vLi4vc2NyaXB0aW5nJztcbmltcG9ydCB7IEFzc2V0Q2hhbmdlSW5mbywgREJDaGFuZ2VUeXBlIH0gZnJvbSAnLi4vLi4vc2NyaXB0aW5nL3BhY2tlci1kcml2ZXIvYXNzZXQtZGItaW50ZXJvcCc7XG5pbXBvcnQgeyBBc3NldEFjdGlvbkVudW0gfSBmcm9tICdAY29jb3MvYXNzZXQtZGInO1xuXG5jb25zdCBBc3NldERCUHJpb3JpdHk6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7XG4gICAgaW50ZXJuYWw6IDk5LFxuICAgIGFzc2V0czogOTgsXG59O1xuXG5pbnRlcmZhY2UgSVN0YXJ0dXBEYXRhYmFzZUhhbmRsZUluZm8ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBhZnRlclByZUltcG9ydFJlc29sdmU6IEZ1bmN0aW9uO1xuICAgIGZpbmlzaD86IEZ1bmN0aW9uO1xufVxuXG50eXBlIFJlZnJlc2hTdGF0ZSA9ICdmcmVlJyB8ICdidXN5JyB8ICd3YWl0JztcblxuaW50ZXJmYWNlIElXYWl0aW5nVGFzayB7XG4gICAgZnVuYzogRnVuY3Rpb247XG4gICAgYXJnczogYW55W107XG4gICAgcmVzb2x2ZT86IEZ1bmN0aW9uO1xuICAgIHJlamVjdD86IEZ1bmN0aW9uO1xufVxuXG5pbnRlcmZhY2UgSVdhaXRpbmdUYXNrSW5mbyB7XG4gICAgZnVuYzogRnVuY3Rpb247XG4gICAgYXJnczogYW55W107XG4gICAgcmVzb2x2ZXM/OiBGdW5jdGlvbltdO1xuICAgIHJlamVjdHM/OiBGdW5jdGlvbltdO1xufVxuXG4vKipcbiAqIOaAu+euoeeQhuWZqO+8jOeuoeeQhuaVtOS4qui1hOa6kOi/m+eoi+eahOWQr+WKqOa1geeoi+OAgeS7peWPiuS4gOS6m+WtkOeuoeeQhuWZqOeahOWQr+WKqOa1geeoi1xuICovXG5jbGFzcyBBc3NldERCTWFuYWdlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgcHVibGljIGFzc2V0REJNYXA6IFJlY29yZDxzdHJpbmcsIGFzc2V0ZGIuQXNzZXREQj4gPSB7fTtcbiAgICBwdWJsaWMgZ2xvYmFsSW50ZXJuYWxMaWJyYXJ5ID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgc2V0RmlsZVN5c3RlbVByb3ZpZGVyKHByb3ZpZGVyOiBJQXNzZXRGaWxlU3lzdGVtUHJvdmlkZXIpIHtcbiAgICAgICAgc2V0Q0xJRmlsZVN5c3RlbVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgICAgYXNzZXRkYi5zZXRGaWxlU3lzdGVtUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaGFzUGF1c2UgPSBmYWxzZTtcbiAgICBwcml2YXRlIHN0YXJ0UGF1c2UgPSBmYWxzZTtcbiAgICBwdWJsaWMgZ2V0IGlzUGF1c2UoKSB7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLmhhc1BhdXNlIHx8IHRoaXMuc3RhcnRQYXVzZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBwdWJsaWMgcmVhZHkgPSBmYWxzZTtcbiAgICBwcml2YXRlIHdhaXRQYXVzZUhhbmRsZT86IEZ1bmN0aW9uO1xuICAgIHByaXZhdGUgd2FpdFBhdXNlUHJvbWlzZVRhc2s/OiBQcm9taXNlPGJvb2xlYW4+O1xuICAgIHByaXZhdGUgc3RhdGU6IFJlZnJlc2hTdGF0ZSA9ICdmcmVlJztcbiAgICBwdWJsaWMgYXNzZXREQkluZm86IFJlY29yZDxzdHJpbmcsIElBc3NldERCSW5mbz4gPSB7fTtcbiAgICBwcml2YXRlIHdhaXRpbmdUYXNrUXVldWU6IElXYWl0aW5nVGFza0luZm9bXSA9IFtdO1xuICAgIHByaXZhdGUgd2FpdGluZ1JlZnJlc2hBc3NldDogc3RyaW5nW10gPSBbXTtcbiAgICBwcml2YXRlIHBlbmRpbmdBdXRvUmVmcmVzaFJlc29sdmVzOiBGdW5jdGlvbltdID0gW107XG4gICAgcHJpdmF0ZSBhdXRvUmVmcmVzaFRpbWVyPzogTm9kZUpTLlRpbWVvdXQ7XG4gICAgcHJpdmF0ZSBnZXQgYXNzZXRCdXN5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hc3NldEJ1c3lUYXNrLnNpemUgPiAwO1xuICAgIH1cbiAgICBwcml2YXRlIHJlaW1wb3J0Q2hlY2sgPSBmYWxzZTtcbiAgICBwcml2YXRlIGFzc2V0QnVzeVRhc2sgPSBuZXcgU2V0KCk7XG4gICAgcHJpdmF0ZSBwbHVnaW5NYW5hZ2VyID0gcGx1Z2luTWFuYWdlcjtcbiAgICBwcml2YXRlIGFzc2V0SGFuZGxlck1hbmFnZXIgPSBhc3NldEhhbmRsZXJNYW5hZ2VyO1xuXG4gICAgc3RhdGljIHVzZUNhY2hlID0gZmFsc2U7XG4gICAgc3RhdGljIGxpYnJhcnlSb290OiBzdHJpbmc7XG4gICAgc3RhdGljIHRlbXBSb290OiBzdHJpbmc7XG5cbiAgICBnZXQgZnJlZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZHkgJiYgIXRoaXMuaXNQYXVzZSAmJiB0aGlzLnN0YXRlICE9PSAnZnJlZScgJiYgIXRoaXMuYXNzZXRCdXN5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIneWni+WMlu+8jOmcgOimgeS8mOWFiOiwg+eUqFxuICAgICAqIEBwYXJhbSDotYTmupDphY3nva7kv6Hmga8gXG4gICAgICovXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgeyBhc3NldERCTGlzdCwgZmxhZ1JlaW1wb3J0Q2hlY2ssIGxpYnJhcnlSb290LCB0ZW1wUm9vdCwgcmVzdG9yZUFzc2V0REJGcm9tQ2FjaGUgfSA9IGFzc2V0Q29uZmlnLmRhdGE7XG4gICAgICAgIGlmICghYXNzZXREQkxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoaTE4bi50KCdhc3NldHMuaW5pdC5ub19hc3NldF9kYl9saXN0JykpO1xuICAgICAgICB9XG4gICAgICAgIEFzc2V0REJNYW5hZ2VyLmxpYnJhcnlSb290ID0gbGlicmFyeVJvb3Q7XG4gICAgICAgIEFzc2V0REJNYW5hZ2VyLnRlbXBSb290ID0gdGVtcFJvb3Q7XG4gICAgICAgIEFzc2V0REJNYW5hZ2VyLnVzZUNhY2hlID0gcmVzdG9yZUFzc2V0REJGcm9tQ2FjaGU7XG4gICAgICAgIGFzc2V0REJMaXN0LmZvckVhY2goKGluZm8pID0+IHtcbiAgICAgICAgICAgIHRoaXMuYXNzZXREQkluZm9baW5mby5uYW1lXSA9IHBhdGNoQXNzZXREQkluZm8oaW5mbyk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBUT0RPIOeJiOacrOWNh+e6p+i1hOa6kOW6lOivpeWPquiupOiHqui6q+iusOW9leeahOeJiOacrOWPt1xuICAgICAgICAvLyBpZiAoQXNzZXREQk1hbmFnZXIudXNlQ2FjaGUgJiYgUHJvamVjdC5pbmZvLnZlcnNpb24gIT09IFByb2plY3QuaW5mby5sYXN0VmVyc2lvbikge1xuICAgICAgICAvLyAgICAgQXNzZXREQk1hbmFnZXIudXNlQ2FjaGUgPSBmYWxzZTtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGkxOG4udCgnYXNzZXRzLnJlc3RvcmVBc3NldERCRnJvbUNhY2hlSW5WYWxpZC51cGdyYWRlJykpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgaWYgKEFzc2V0REJNYW5hZ2VyLnVzZUNhY2hlICYmICFleGlzdHNTeW5jKEFzc2V0REJNYW5hZ2VyLmxpYnJhcnlSb290KSkge1xuICAgICAgICAgICAgQXNzZXREQk1hbmFnZXIudXNlQ2FjaGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGkxOG4udCgnYXNzZXRzLnJlc3RvcmVfYXNzZXRfZF9iX2Zyb21fY2FjaGVfaW5fdmFsaWQubm9fbGlicmFyeV9wYXRoJykpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luTWFuYWdlci5pbml0KCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYXNzZXRIYW5kbGVyTWFuYWdlci5pbml0KCk7XG5cbiAgICAgICAgdGhpcy5yZWltcG9ydENoZWNrID0gZmxhZ1JlaW1wb3J0Q2hlY2s7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5pWw5o2u5bqT5YWl5Y+jXG4gICAgICovXG4gICAgYXN5bmMgc3RhcnQoKSB7XG4gICAgICAgIG5ld0NvbnNvbGUudHJhY2tUaW1lU3RhcnQoJ2Fzc2V0czpzdGFydC1kYXRhYmFzZScpO1xuXG4gICAgICAgIGlmIChBc3NldERCTWFuYWdlci51c2VDYWNoZSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc3RhcnRGcm9tQ2FjaGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGF3YWl0IHRoaXMuX3N0YXJ0KCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9zdGFydERpcmVjdGx5KCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgYWZ0ZXJTdGFydERCKHRoaXMuYXNzZXREQkluZm8pO1xuICAgICAgICB0aGlzLnJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgbmV3Q29uc29sZS50cmFja1RpbWVFbmQoJ2Fzc2V0LWRiOnN0YXJ0LWRhdGFiYXNlJywgeyBvdXRwdXQ6IHRydWUgfSk7XG4gICAgICAgIC8vIOaAp+iDvea1i+ivlTog6LWE5rqQ5Ya35a+85YWlXG4gICAgICAgIG5ld0NvbnNvbGUudHJhY2tUaW1lRW5kKCdhc3NldC1kYjpyZWFkeScsIHsgb3V0cHV0OiB0cnVlIH0pO1xuICAgICAgICB0aGlzLmVtaXQoJ2Fzc2V0czpyZWFkeScpO1xuICAgICAgICAvLyBUT0RPIOS4jeaYr+W4uOmpu+aooeW8j++8jOWImeaXoOmcgOW8gOWQr++8jOWQr+WKqOaIkOWKn+WQju+8jOW8gOWni+WKoOi9veWwmuacquazqOWGjOeahOi1hOa6kOWkhOeQhuWZqFxuICAgICAgICAvLyB0aGlzLmFzc2V0SGFuZGxlck1hbmFnZXIuYWN0aXZhdGVSZWdpc3RlckFsbCgpO1xuXG4gICAgICAgIHRoaXMuc3RlcCgpO1xuICAgICAgICAvLyBUT0RPIOWQr+WKqOaIkOWKn+WQjuW8gOWni+WGjeWOu+WBmuS4gOS6m+aXpeW/l+e8k+WtmOa4heeQhlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmmluasoeWQr+WKqOaVsOaNruW6k1xuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgX3N0YXJ0KCkge1xuICAgICAgICBuZXdDb25zb2xlLnRyYWNrTWVtb3J5U3RhcnQoJ2Fzc2V0czp3b3JrZXItaW5pdDogcHJlU3RhcnQnKTtcbiAgICAgICAgY29uc3QgYXNzZXREQk5hbWVzID0gT2JqZWN0LmtleXModGhpcy5hc3NldERCSW5mbykuc29ydCgoYSwgYikgPT4gKEFzc2V0REJQcmlvcml0eVtiXSB8fCAwKSAtIChBc3NldERCUHJpb3JpdHlbYV0gfHwgMCkpO1xuICAgICAgICBjb25zdCBzdGFydHVwRGF0YWJhc2VRdWV1ZTogSVN0YXJ0dXBEYXRhYmFzZUhhbmRsZUluZm9bXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGFzc2V0REJOYW1lIG9mIGFzc2V0REJOYW1lcykge1xuICAgICAgICAgICAgY29uc3QgZGIgPSBhd2FpdCB0aGlzLl9jcmVhdGVEQih0aGlzLmFzc2V0REJJbmZvW2Fzc2V0REJOYW1lXSk7XG4gICAgICAgICAgICBjb25zdCB3YWl0aW5nU3RhcnR1cERCSW5mbyA9IGF3YWl0IHRoaXMuX3ByZVN0YXJ0REIoZGIpO1xuICAgICAgICAgICAgc3RhcnR1cERhdGFiYXNlUXVldWUucHVzaCh3YWl0aW5nU3RhcnR1cERCSW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3Q29uc29sZS50cmFja01lbW9yeUVuZCgnYXNzZXQtZGI6d29ya2VyLWluaXQ6IHByZVN0YXJ0Jyk7XG5cbiAgICAgICAgbmV3Q29uc29sZS50cmFja01lbW9yeVN0YXJ0KCdhc3NldHM6d29ya2VyLWluaXQ6IHN0YXJ0dXAnKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGFydHVwRGF0YWJhc2VRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnR1cERhdGFiYXNlID0gc3RhcnR1cERhdGFiYXNlUXVldWVbaV07XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9zdGFydHVwREIoc3RhcnR1cERhdGFiYXNlKTtcbiAgICAgICAgfVxuICAgICAgICBuZXdDb25zb2xlLnRyYWNrTWVtb3J5RW5kKCdhc3NldC1kYjp3b3JrZXItaW5pdDogc3RhcnR1cCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOebtOaOpeWQr+WKqOaVsOaNruW6k1xuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgX3N0YXJ0RGlyZWN0bHkoKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0REJOYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuYXNzZXREQkluZm8pLnNvcnQoKGEsIGIpID0+IChBc3NldERCUHJpb3JpdHlbYl0gfHwgMCkgLSAoQXNzZXREQlByaW9yaXR5W2FdIHx8IDApKTtcbiAgICAgICAgZm9yIChjb25zdCBhc3NldERCTmFtZSBvZiBhc3NldERCTmFtZXMpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhcnREQih0aGlzLmFzc2V0REJJbmZvW2Fzc2V0REJOYW1lXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDku47nvJPlrZjlkK/liqjmlbDmja7lupPvvIzlpoLmnpzmgaLlpI3lpLHotKXkvJrlm57pgIDliLDljp/lp4vnmoTlkK/liqjmtYHnqItcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIF9zdGFydEZyb21DYWNoZSgpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygndHJ5IHN0YXJ0IGFsbCBhc3NldERCIGZyb20gY2FjaGUuLi4nKTtcbiAgICAgICAgY29uc3QgYXNzZXREQk5hbWVzID0gT2JqZWN0LmtleXModGhpcy5hc3NldERCSW5mbykuc29ydCgoYSwgYikgPT4gKEFzc2V0REJQcmlvcml0eVtiXSB8fCAwKSAtIChBc3NldERCUHJpb3JpdHlbYV0gfHwgMCkpO1xuICAgICAgICBmb3IgKGNvbnN0IGFzc2V0REJOYW1lIG9mIGFzc2V0REJOYW1lcykge1xuICAgICAgICAgICAgY29uc3QgZGIgPSBhd2FpdCB0aGlzLl9jcmVhdGVEQih0aGlzLmFzc2V0REJJbmZvW2Fzc2V0REJOYW1lXSk7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkYi5jYWNoZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZGIuc3RhcnRXaXRoQ2FjaGUoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hc3NldERCSW5mb1thc3NldERCTmFtZV0uc3RhdGUgPSAnc3RhcnR1cCc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZGItc3RhcnRlZCcsIGRiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1Zyhgc3RhcnQgZGIgJHthc3NldERCTmFtZX0gd2l0aCBjYWNoZSBzdWNjZXNzYCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnYXNzZXRzOmRiLXJlYWR5JywgdGhpcy5hc3NldERCSW5mb1thc3NldERCTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBzdGFydCBkYiAke2Fzc2V0REJOYW1lfSB3aXRoIGNhY2hlIGZhaWxlZCwgdHJ5IHRvIHN0YXJ0IGRiICR7YXNzZXREQk5hbWV9IHdpdGhvdXQgY2FjaGVgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOayoeacieato+W4uOi1sOWujOe8k+WtmOaBouWkje+8jOi1sOaZrumAmueahOWQr+WKqOa1geeoi1xuICAgICAgICAgICAgY29uc3Qgd2FpdGluZ1N0YXJ0dXBEQkluZm8gPSBhd2FpdCB0aGlzLl9wcmVTdGFydERCKGRiKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3N0YXJ0dXBEQih3YWl0aW5nU3RhcnR1cERCSW5mbyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgaXNCdXN5KCkge1xuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gdGhpcy5hc3NldERCTWFwKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuYXNzZXREQk1hcFtuYW1lXSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGIgPSB0aGlzLmFzc2V0REJNYXBbbmFtZV07XG4gICAgICAgICAgICBpZiAoZGIuYXNzZXRQcm9ncmVzc0luZm8ud2FpdCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGhhc0RCKG5hbWU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gISF0aGlzLmFzc2V0REJNYXBbbmFtZV07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzdGFydERCKGluZm86IElBc3NldERCSW5mbykge1xuICAgICAgICBpZiAodGhpcy5oYXNEQihpbmZvLm5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5fY3JlYXRlREIoaW5mbyk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3N0YXJ0REIoaW5mby5uYW1lKTtcbiAgICAgICAgdGhpcy5lbWl0KCdhc3NldHM6ZGItcmVhZHknLCBpbmZvKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsIbkuIDkuKrnu53lr7not6/lvoTvvIzovazmiJAgdXJsIOWcsOWdgFxuICAgICAqIEBwYXJhbSBwYXRoXG4gICAgICogQHBhcmFtIGRiTmFtZSDlj6/pgIlcbiAgICAgKi9cbiAgICBwdWJsaWMgcGF0aDJ1cmwocGF0aDogc3RyaW5nLCBkYk5hbWU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICAvLyDlkKbliJnkvJrlh7rnjrDov5Tlm54gJ2RiOi8vaW50ZXJuYWwvLi4vLi4vLi4vLi4vLi4vZGI6L2ludGVybmFsJyDnmoTmg4XlhrVcbiAgICAgICAgaWYgKHBhdGggPT09IGBkYjovLyR7ZGJOYW1lfWApIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkYXRhYmFzZTtcbiAgICAgICAgaWYgKCFkYk5hbWUpIHtcbiAgICAgICAgICAgIGRhdGFiYXNlID0gT2JqZWN0LnZhbHVlcyhhc3NldERCTWFuYWdlci5hc3NldERCTWFwKS5maW5kKChkYikgPT4gVXRpbHMuUGF0aC5jb250YWlucyhkYi5vcHRpb25zLnRhcmdldCwgcGF0aCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YWJhc2UgPSBhc3NldERCTWFuYWdlci5hc3NldERCTWFwW2RiTmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkYXRhYmFzZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2FuIG5vdCBmaW5kIGFzc2V0IGRiIHdpdGggYXNzZXQgcGF0aDogJHtwYXRofWApO1xuICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlsIYgd2luZG93cyDkuIrnmoQgXFwg6L2s5oiQIC/vvIznu5/kuIDmiJAgdXJsIOagvOW8j1xuICAgICAgICBsZXQgX3BhdGggPSByZWxhdGl2ZShkYXRhYmFzZS5vcHRpb25zLnRhcmdldCwgcGF0aCk7XG4gICAgICAgIF9wYXRoID0gX3BhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXG4gICAgICAgIHJldHVybiBgZGI6Ly8ke2RhdGFiYXNlLm9wdGlvbnMubmFtZX0vJHtfcGF0aH1gO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2NyZWF0ZURCKGluZm86IElBc3NldERCSW5mbykge1xuICAgICAgICBlbnN1cmVEaXJTeW5jKGluZm8ubGlicmFyeSk7XG4gICAgICAgIGVuc3VyZURpclN5bmMoaW5mby50ZW1wKTtcbiAgICAgICAgLy8gVE9ETyDnm67moIfmlbDmja7lupPlnLDlnYDkuLrnqbrnmoTml7blgJnvvIzlhbblrp7ml6DpnIDotbDlkI7nu63lrozmlbTnmoTlkK/liqjmtYHnqIvvvIzlj6/ku6XogIPomZHkvJjljJZcbiAgICAgICAgZW5zdXJlRGlyU3luYyhpbmZvLnRhcmdldCk7XG4gICAgICAgIGluZm8uZmxhZ3MgPSB7XG4gICAgICAgICAgICByZWltcG9ydENoZWNrOiB0aGlzLnJlaW1wb3J0Q2hlY2ssXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGRiID0gYXNzZXRkYi5jcmVhdGUoaW5mbyk7XG4gICAgICAgIHRoaXMuYXNzZXREQk1hcFtpbmZvLm5hbWVdID0gZGI7XG4gICAgICAgIGRiLmltcG9ydGVyTWFuYWdlci5maW5kID0gYXN5bmMgKGFzc2V0OiBJQXNzZXQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydGVyID0gYXdhaXQgdGhpcy5hc3NldEhhbmRsZXJNYW5hZ2VyLmZpbmRJbXBvcnRlcihhc3NldCwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoaW1wb3J0ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW1wb3J0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXdJbXBvcnRlciA9IGF3YWl0IHRoaXMuYXNzZXRIYW5kbGVyTWFuYWdlci5nZXREZWZhdWx0SW1wb3J0ZXIoYXNzZXQpO1xuICAgICAgICAgICAgcmV0dXJuIG5ld0ltcG9ydGVyIHx8IGltcG9ydGVyO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmVtaXQoJ2RiLWNyZWF0ZWQnLCBkYik7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoYGNyZWF0ZSBkYiAke2luZm8ubmFtZX0gc3VjY2VzcyBpbiAke2luZm8ubGlicmFyeX1gKTtcblxuICAgICAgICAgLy8g5Yid5aeL5YyW5LiA5Lqb6ISa5pys6ZyA6KaB55qE5pWw5o2u5bqT5L+h5oGvXG4gICAgICAgICBhd2FpdCBzY3JpcHRpbmcudXBkYXRlRGF0YWJhc2VzKHtkYklEOiBpbmZvLm5hbWUsIHRhcmdldDogaW5mby50YXJnZXR9LCBEQkNoYW5nZVR5cGUuYWRkKTtcbiAgICAgICAgcmV0dXJuIGRiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmihOWQr+WKqCBkYiwg6ZyA6KaB5LiOIF9zdGFydHVwREIg5pCt6YWN5L2/55So77yM6K+35Yu/5Y2V54us6LCD55SoXG4gICAgICogQHBhcmFtIGRiIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgX3ByZVN0YXJ0REIoZGI6IGFzc2V0ZGIuQXNzZXREQikge1xuICAgICAgICBjb25zdCBob29rczogUmVjb3JkPHN0cmluZywgRnVuY3Rpb24+ID0ge1xuICAgICAgICAgICAgYWZ0ZXJTY2FuLFxuICAgICAgICB9O1xuICAgICAgICAvLyBIQUNLIOebruWJjeWboOS4uuS4gOS6m+eJueauiueahOWvvOWFpemcgOaxgu+8jOWwhiBkYiDlkK/liqjmtYHnqIvlvLrliLbliIbmiJDkuobkuKTmrKFcbiAgICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlPElTdGFydHVwRGF0YWJhc2VIYW5kbGVJbmZvPihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVJbmZvOiBJU3RhcnR1cERhdGFiYXNlSGFuZGxlSW5mbyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBkYi5vcHRpb25zLm5hbWUsXG4gICAgICAgICAgICAgICAgYWZ0ZXJQcmVJbXBvcnRSZXNvbHZlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFN0YXJ0IGRhdGFiYXNlICR7ZGIub3B0aW9ucy5uYW1lfSBmYWlsZWQhYCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOmYsuatouaEj+WkluaDheWGteS4i++8jOi1hOa6kOi/m+eoi+WNoeatu+aXoOS7u+S9leS/oeaBr1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVJbmZvLmZpbmlzaCAmJiBoYW5kbGVJbmZvLmZpbmlzaCgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gSEFDSyAxLzMg5ZCv5Yqo5pWw5o2u5bqT5pe277yM5LiN5a+85YWl5YWo6YOo6LWE5rqQ77yM5YWI5oqK6aKE5a+85YWl6LWE5rqQ5a+85YWl5a6M5oiQ5ZCO6L+b5YWl562J5b6F54q25oCBXG4gICAgICAgICAgICBob29rcy5hZnRlclByZUltcG9ydCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBhZnRlclByZUltcG9ydChkYik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgUHJlSW1wb3J0IGRiICR7ZGIub3B0aW9ucy5uYW1lfSBzdWNjZXNzYCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShoYW5kbGVJbmZvKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlSW5mby5hZnRlclByZUltcG9ydFJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhvb2tzLmFmdGVyU3RhcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaGFuZGxlSW5mby5maW5pc2ggJiYgaGFuZGxlSW5mby5maW5pc2goKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkYi5zdGFydCh7XG4gICAgICAgICAgICAgICAgaG9va3MsXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmFzc2V0REJJbmZvW2RiLm9wdGlvbnMubmFtZV0uc3RhdGUgPSAnc3RhcnQnO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlrozlhajlkK/liqjkuYvliY3pooTlkK/liqjnmoQgZGIg77yM6K+35Yu/5Y2V54us6LCD55SoXG4gICAgICogQHBhcmFtIHN0YXJ0dXBEYXRhYmFzZSBcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIF9zdGFydHVwREIoc3RhcnR1cERhdGFiYXNlOiBJU3RhcnR1cERhdGFiYXNlSGFuZGxlSW5mbykge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGBTdGFydCB1cCB0aGUgJyR7c3RhcnR1cERhdGFiYXNlLm5hbWV9JyBkYXRhYmFzZS4uLmApO1xuICAgICAgICBuZXdDb25zb2xlLnRyYWNrVGltZVN0YXJ0KGBhc3NldC1kYjogc3RhcnR1cCAnJHtzdGFydHVwRGF0YWJhc2UubmFtZX0nIGRhdGFiYXNlLi4uYCk7XG4gICAgICAgIC8vIDIvMyDnu5PmnZ8gYWZ0ZXJQcmVJbXBvcnQg6aKE55WZ55qE562J5b6F54q25oCB77yM5q2j5bi46L+b5YWl6LWE5rqQ55qE5a+85YWl5rWB56iLLOagh+iusCBmaW5pc2gg5L2c5Li657uT5p2f5Yik5patXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBzdGFydHVwRGF0YWJhc2UuZmluaXNoID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHN0YXJ0dXBEYXRhYmFzZS5hZnRlclByZUltcG9ydFJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld0NvbnNvbGUudHJhY2tUaW1lRW5kKGBhc3NldC1kYjp3b3JrZXItc3RhcnR1cC1kYXRhYmFzZVske3N0YXJ0dXBEYXRhYmFzZS5uYW1lfV1gLCB7IG91dHB1dDogdHJ1ZSB9KTtcbiAgICAgICAgbmV3Q29uc29sZS50cmFja01lbW9yeUVuZChgYXNzZXQtZGI6d29ya2VyLXN0YXJ0dXAtZGF0YWJhc2VbJHtzdGFydHVwRGF0YWJhc2UubmFtZX1dYCk7XG5cbiAgICAgICAgdGhpcy5hc3NldERCSW5mb1tzdGFydHVwRGF0YWJhc2UubmFtZV0uc3RhdGUgPSAnc3RhcnR1cCc7XG4gICAgICAgIGNvbnN0IGRiID0gdGhpcy5hc3NldERCTWFwW3N0YXJ0dXBEYXRhYmFzZS5uYW1lXTtcbiAgICAgICAgdGhpcy5lbWl0KCdkYi1zdGFydGVkJywgZGIpO1xuICAgICAgICBuZXdDb25zb2xlLnRyYWNrVGltZUVuZChgYXNzZXQtZGI6IHN0YXJ0dXAgJyR7c3RhcnR1cERhdGFiYXNlLm5hbWV9JyBkYXRhYmFzZS4uLmApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWQr+WKqOafkOS4quaMh+WumuaVsOaNruW6k1xuICAgICAqIEBwYXJhbSBuYW1lIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBfc3RhcnREQihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgZGIgPSB0aGlzLmFzc2V0REJNYXBbbmFtZV07XG4gICAgICAgIG5ld0NvbnNvbGUudHJhY2tUaW1lU3RhcnQoYGFzc2V0LWRiOndvcmtlci1zdGFydHVwLWRhdGFiYXNlWyR7ZGIub3B0aW9ucy5uYW1lfV1gKTtcbiAgICAgICAgbmV3Q29uc29sZS50cmFja01lbW9yeVN0YXJ0KGBhc3NldC1kYjp3b3JrZXItc3RhcnR1cC1kYXRhYmFzZVske2RiLm9wdGlvbnMubmFtZX1dYCk7XG4gICAgICAgIHRoaXMuYXNzZXREQkluZm9bbmFtZV0uc3RhdGUgPSAnc3RhcnQnO1xuXG4gICAgICAgIGNvbnN0IHByZUltcG9ydGVySGFuZGxlciA9IGdldFByZUltcG9ydGVySGFuZGxlcih0aGlzLmFzc2V0REJJbmZvW25hbWVdLnByZUltcG9ydEV4dExpc3QpO1xuICAgICAgICBpZiAocHJlSW1wb3J0ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgICBkYi5wcmVJbXBvcnRlckhhbmRsZXIgPSBwcmVJbXBvcnRlckhhbmRsZXI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaG9va3M6IFJlY29yZDxzdHJpbmcsIEZ1bmN0aW9uPiA9IHtcbiAgICAgICAgICAgIGFmdGVyU2NhbixcbiAgICAgICAgfTtcblxuICAgICAgICBob29rcy5hZnRlclByZUltcG9ydCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IGFmdGVyUHJlSW1wb3J0KGRiKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc29sZS5kZWJ1Zyhgc3RhcnQgYXNzZXQtZGIoJHtuYW1lfSkuLi5gKTtcbiAgICAgICAgYXdhaXQgZGIuc3RhcnQoe1xuICAgICAgICAgICAgaG9va3MsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFzc2V0REJJbmZvW25hbWVdLnN0YXRlID0gJ3N0YXJ0dXAnO1xuICAgICAgICB0aGlzLmVtaXQoJ2RiLXN0YXJ0ZWQnLCBkYik7XG4gICAgICAgIG5ld0NvbnNvbGUudHJhY2tUaW1lRW5kKGBhc3NldC1kYjp3b3JrZXItc3RhcnR1cC1kYXRhYmFzZVske2RiLm9wdGlvbnMubmFtZX1dYCwgeyBvdXRwdXQ6IHRydWUgfSk7XG4gICAgICAgIG5ld0NvbnNvbGUudHJhY2tNZW1vcnlFbmQoYGFzc2V0LWRiOndvcmtlci1zdGFydHVwLWRhdGFiYXNlWyR7ZGIub3B0aW9ucy5uYW1lfV1gKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOa3u+WKoOafkOS4qiBhc3NldCBkYlxuICAgICAqL1xuICAgIGFzeW5jIGFkZERCKGluZm86IEFzc2V0REJSZWdpc3RlckluZm8pIHtcbiAgICAgICAgdGhpcy5hc3NldERCSW5mb1tpbmZvLm5hbWVdID0gcGF0Y2hBc3NldERCSW5mbyhpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zdGFydERCKHRoaXMuYXNzZXREQkluZm9baW5mby5uYW1lXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog56e76Zmk5p+Q5LiqIGFzc2V0LWRiXG4gICAgICogQHBhcmFtIG5hbWUgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcmVtb3ZlREIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmlzUGF1c2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGkxOG4udCgnYXNzZXRzLmFzc2V0X2RfYl9wYXVzZV90aXBzJyxcbiAgICAgICAgICAgICAgICB7IG9wZXJhdGU6ICdyZW1vdmVEQicgfVxuICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZFRhc2tUb1F1ZXVlKHtcbiAgICAgICAgICAgICAgICAgICAgZnVuYzogdGhpcy5fcmVtb3ZlREIuYmluZCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW25hbWVdLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICAgICAgICByZWplY3RcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9yZW1vdmVEQihuYW1lKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9vcGVyYXRlKG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgY29uc3QgdGFza0lkID0gbmFtZSArIERhdGUubm93KCk7XG4gICAgICAgIGlmIChuYW1lLmVuZHNXaXRoKCdBc3NldCcpKSB7XG4gICAgICAgICAgICB0aGlzLmFzc2V0QnVzeVRhc2suYWRkKHRhc2tJZCk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXNbbmFtZV0oLi4uYXJncyk7XG4gICAgICAgICAgICB0aGlzLmFzc2V0QnVzeVRhc2suZGVsZXRlKHRhc2tJZCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtuYW1lfSBmYWlsZWQgd2l0aCBhcmdzOiAke2FyZ3MudG9TdHJpbmcoKX1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5hc3NldEJ1c3lUYXNrLmRlbGV0ZSh0YXNrSWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVtb3ZlREIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGRiID0gdGhpcy5hc3NldERCTWFwW25hbWVdO1xuICAgICAgICBpZiAoIWRiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgZGIuc3RvcCgpO1xuICAgICAgICB0aGlzLmVtaXQoJ2RiLXJlbW92ZWQnLCBkYik7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmFzc2V0REJNYXBbbmFtZV07XG4gICAgICAgIGRlbGV0ZSB0aGlzLmFzc2V0REJJbmZvW25hbWVdO1xuICAgICAgICB0aGlzLmVtaXQoJ2Fzc2V0czpkYi1jbG9zZScsIG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIt+aWsOaJgOacieaVsOaNruW6k1xuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHJlZnJlc2goKSB7XG4gICAgICAgIGlmICghdGhpcy5yZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9PSAnZnJlZScgfHwgdGhpcy5pc1BhdXNlIHx8IHRoaXMuYXNzZXRCdXN5KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc1BhdXNlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coaTE4bi50KCdhc3NldHMuYXNzZXRfZF9iX3BhdXNlX3RpcHMnLFxuICAgICAgICAgICAgICAgICAgICB7IG9wZXJhdGU6ICdyZWZyZXNoJyB9XG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZFRhc2tUb1F1ZXVlKHtcbiAgICAgICAgICAgICAgICAgICAgZnVuYzogdGhpcy5fcmVmcmVzaC5iaW5kKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fcmVmcmVzaCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3JlZnJlc2goKSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSAnYnVzeSc7XG4gICAgICAgIG5ld0NvbnNvbGUudHJhY2tUaW1lU3RhcnQoJ2Fzc2V0czpyZWZyZXNoLWFsbC1kYXRhYmFzZScpO1xuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gdGhpcy5hc3NldERCTWFwKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuYXNzZXREQk1hcFtuYW1lXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYEdldCBhc3NldERCICR7bmFtZX0gZm9ybSBtYW5hZ2VyIGZhaWxlZCFgKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRiID0gdGhpcy5hc3NldERCTWFwW25hbWVdO1xuICAgICAgICAgICAgYXdhaXQgZGIucmVmcmVzaChkYi5vcHRpb25zLnRhcmdldCwge1xuICAgICAgICAgICAgICAgIGlnbm9yZVNlbGY6IHRydWUsXG4gICAgICAgICAgICAgICAgLy8g5Y+q5pyJIGFzc2V0cyDotYTmupDlupPlgZogZWZmZWN0IOe8luivkeWkhOeQhlxuICAgICAgICAgICAgICAgIGhvb2tzOiBuYW1lID09PSAnYXNzZXRzJyA/IHtcbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJQcmVJbXBvcnQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGFmdGVyUHJlSW1wb3J0KGRiKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9IDoge30sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYHJlZnJlc2ggZGIgJHtuYW1lfSBzdWNjZXNzYCk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3Q29uc29sZS50cmFja1RpbWVFbmQoJ2Fzc2V0LWRiOnJlZnJlc2gtYWxsLWRhdGFiYXNlJywgeyBvdXRwdXQ6IHRydWUgfSk7XG4gICAgICAgIHRoaXMuZW1pdCgnYXNzZXRzOnJlZnJlc2gtZmluaXNoJyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSAnZnJlZSc7XG4gICAgICAgIHRoaXMuc3RlcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaHkuWIt+aWsOi1hOa6kO+8jOivt+WLv+S9v+eUqO+8jOebruWJjeeahOmAu+i+keaYr+mSiOWvuemHjeWIt+aWh+S7tuWkueWumuWItueahFxuICAgICAqIEBwYXJhbSBmaWxlIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBhdXRvUmVmcmVzaEFzc2V0TGF6eShwYXRoT3JVcmxPclVVSUQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXRoaXMud2FpdGluZ1JlZnJlc2hBc3NldC5pbmNsdWRlcyhwYXRoT3JVcmxPclVVSUQpKSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmdSZWZyZXNoQXNzZXQucHVzaChwYXRoT3JVcmxPclVVSUQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hdXRvUmVmcmVzaFRpbWVyICYmIGNsZWFyVGltZW91dCh0aGlzLmF1dG9SZWZyZXNoVGltZXIpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0F1dG9SZWZyZXNoUmVzb2x2ZXMucHVzaChyZXNvbHZlKTtcbiAgICAgICAgICAgIHRoaXMuYXV0b1JlZnJlc2hUaW1lciA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhc2tJZCA9ICdhdXRvUmVmcmVzaEFzc2V0TGF6eScgKyBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXNzZXRCdXN5VGFzay5hZGQodGFza0lkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlcyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy53YWl0aW5nUmVmcmVzaEFzc2V0KSk7XG4gICAgICAgICAgICAgICAgdGhpcy53YWl0aW5nUmVmcmVzaEFzc2V0Lmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZmlsZXMubWFwKChmaWxlOiBzdHJpbmcpID0+IGFzc2V0ZGIucmVmcmVzaChmaWxlKSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXNzZXRCdXN5VGFzay5kZWxldGUodGFza0lkKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0ZXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBlbmRpbmdBdXRvUmVmcmVzaFJlc29sdmVzLmZvckVhY2goKHJlc29sdmUpID0+IHJlc29sdmUodHJ1ZSkpO1xuICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZ0F1dG9SZWZyZXNoUmVzb2x2ZXMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaBouWkjeiiq+aaguWBnOeahOaVsOaNruW6k1xuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHJlc3VtZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgaWYgKCF0aGlzLmhhc1BhdXNlICYmICF0aGlzLnN0YXJ0UGF1c2UpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFzUGF1c2UgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zdGFydFBhdXNlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZW1pdCgnYXNzZXRzOnJlc3VtZScpO1xuICAgICAgICBhd2FpdCB0aGlzLnN0ZXAoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYXN5bmMgYWRkVGFzayhmdW5jOiBGdW5jdGlvbiwgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAodGhpcy5pc1BhdXNlIHx8IHRoaXMuc3RhdGUgPT09ICdidXN5Jykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coaTE4bi50KCdhc3NldHMuYXNzZXRfZF9iX3BhdXNlX3RpcHMnLFxuICAgICAgICAgICAgICAgIHsgb3BlcmF0ZTogZnVuYy5uYW1lIH1cbiAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGRUYXNrVG9RdWV1ZSh7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUsXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCBmdW5jKC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2FkZFRhc2tUb1F1ZXVlKHRhc2s6IElXYWl0aW5nVGFzaykge1xuICAgICAgICBjb25zdCBsYXN0ID0gdGhpcy53YWl0aW5nVGFza1F1ZXVlW3RoaXMud2FpdGluZ1Rhc2tRdWV1ZS5sZW5ndGggLSAxXTtcbiAgICAgICAgY29uc3QgY3VyVGFzazogSVdhaXRpbmdUYXNrSW5mbyA9IHtcbiAgICAgICAgICAgIGZ1bmM6IHRhc2suZnVuYyxcbiAgICAgICAgICAgIGFyZ3M6IHRhc2suYXJncyxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRhc2sucmVzb2x2ZSAmJiB0YXNrLnJlamVjdCkge1xuICAgICAgICAgICAgY3VyVGFzay5yZXNvbHZlcyA9IFt0YXNrLnJlc29sdmVdO1xuICAgICAgICAgICAgY3VyVGFzay5yZWplY3RzID0gW3Rhc2sucmVqZWN0XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWxhc3QpIHtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZ1Rhc2tRdWV1ZS5wdXNoKGN1clRhc2spO1xuICAgICAgICAgICAgdGhpcy5zdGVwKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkuI3kuIDmoLfnmoTku7vliqHmt7vliqDov5vpmJ/liJdcbiAgICAgICAgaWYgKGxhc3QuZnVuYy5uYW1lICE9PSBjdXJUYXNrLmZ1bmMubmFtZSB8fCBjdXJUYXNrLmFyZ3MudG9TdHJpbmcoKSAhPT0gbGFzdC5hcmdzLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZ1Rhc2tRdWV1ZS5wdXNoKGN1clRhc2spO1xuICAgICAgICAgICAgdGhpcy5zdGVwKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5bCG5LiA5qC355qE5Lu75Yqh5ZCI5bm2XG4gICAgICAgIGlmICghdGFzay5yZXNvbHZlIHx8ICF0YXNrLnJlamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxhc3QucmVzb2x2ZXMgJiYgbGFzdC5yZWplY3RzKSB7XG4gICAgICAgICAgICBsYXN0LnJlc29sdmVzLnB1c2godGFzay5yZXNvbHZlKTtcbiAgICAgICAgICAgIGxhc3QucmVqZWN0cy5wdXNoKHRhc2sucmVqZWN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxhc3QucmVzb2x2ZXMgPSBjdXJUYXNrLnJlc29sdmVzO1xuICAgICAgICAgICAgbGFzdC5yZWplY3RzID0gY3VyVGFzay5yZWplY3RzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RlcCgpO1xuICAgIH1cblxuICAgIGFzeW5jIHN0ZXAoKSB7XG4gICAgICAgIC8vIOWtmOWcqOetieW+heeahCBoYW5kbGUg5YWI5aSE55CG5Zue6LCDXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0UGF1c2UgJiYgdGhpcy53YWl0UGF1c2VIYW5kbGUpIHtcbiAgICAgICAgICAgIHRoaXMud2FpdFBhdXNlSGFuZGxlKHRydWUpO1xuICAgICAgICAgICAgdGhpcy53YWl0UGF1c2VIYW5kbGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZGIg5pqC5YGc5pe277yM5LiN5aSE55CG562J5b6F5Lu75YqhXG4gICAgICAgIGlmICh0aGlzLmlzUGF1c2UgfHwgIXRoaXMud2FpdGluZ1Rhc2tRdWV1ZS5sZW5ndGggfHwgdGhpcy5zdGF0ZSA9PT0gJ2J1c3knKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5rex5ou36LSd5Lul6YG/5YWN5Zyo5aSE55CG55qE6L+H56iL5Lit5oyB57ut5pS25Yiw5Lu75YqhXG4gICAgICAgIGxldCB3YWl0aW5nVGFza1F1ZXVlID0gQXJyYXkuZnJvbSh0aGlzLndhaXRpbmdUYXNrUXVldWUpO1xuICAgICAgICBjb25zdCBsYXN0V2FpdGluZ1F1ZXVlOiBJV2FpdGluZ1Rhc2tJbmZvW10gPSBbXTtcbiAgICAgICAgLy8g5b2T5ZCM5pe25pyJ6LWE5rqQ5pON5L2c5LiO5pW05L2T55qE5qOA5p+l5Yi35paw5Lu75Yqh5pe277yM5LyY5YWI5omn6KGM6LWE5rqQ5pON5L2c5Lu75YqhXG4gICAgICAgIHdhaXRpbmdUYXNrUXVldWUgPSB3YWl0aW5nVGFza1F1ZXVlLmZpbHRlcigodGFzaykgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmFzc2V0QnVzeSB8fCAodGhpcy5hc3NldEJ1c3kgJiYgdGFzay5mdW5jLm5hbWUgIT09ICdfcmVmcmVzaCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0V2FpdGluZ1F1ZXVlLnB1c2godGFzayk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLndhaXRpbmdUYXNrUXVldWUgPSBsYXN0V2FpdGluZ1F1ZXVlO1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgd2FpdGluZ1Rhc2tRdWV1ZS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhc2sgPSB3YWl0aW5nVGFza1F1ZXVlW2luZGV4XTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2suZnVuYy5uYW1lID09PSAnX3JlZnJlc2gnICYmIHRoaXMuYXNzZXRCdXN5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeacieaJp+ihjOeahOS7u+WKoeWhnuWbnumYn+WIl1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRpbmdUYXNrUXVldWUucHVzaCh0YXNrKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRhc2suZnVuYyguLi50YXNrLmFyZ3MpO1xuICAgICAgICAgICAgICAgIGlmICghdGFzay5yZXNvbHZlcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRhc2sucmVzb2x2ZXMuZm9yRWFjaCgocmVzb2x2ZSkgPT4gcmVzb2x2ZShyZXMpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICAgICAgICBpZiAodGFzay5yZWplY3RzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2sucmVqZWN0cy5mb3JFYWNoKChyZWplY3QpID0+IHJlamVjdChlcnJvcikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOW9k+WJjSBzdGVwIOeahOWkhOeQhuS7u+WKoeWujOaIkOWNs+WPr+e7k+adn++8jOWJqeS9meS7u+WKoeS8muWcqOS4i+S4gOasoSBzdGVwIOS4reWkhOeQhlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaaguWBnOaVsOaNruW6k1xuICAgICAqIEBwYXJhbSBzb3VyY2Ug5p2l5rqQ5qCH6K+GXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcGF1c2Uoc291cmNlID0gJ3Vua293bicpIHtcbiAgICAgICAgdGhpcy5zdGFydFBhdXNlID0gdHJ1ZTtcbiAgICAgICAgLy8g5Y+q6KaB5b2T5YmN5bqV5bGC5rKh5pyJ5q2j5Zyo5aSE55CG55qE6LWE5rqQ6YO96KeG5Li66LWE5rqQ6L+b5YWl5Y+v5pqC5YGc54q25oCBXG4gICAgICAgIGlmICghdGhpcy5pc0J1c3koKSkge1xuICAgICAgICAgICAgdGhpcy5oYXNQYXVzZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Fzc2V0czpwYXVzZScsIHNvdXJjZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQXNzZXQgREIgaXMgcGF1c2VkIHdpdGggJHtzb3VyY2V9IWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmhhc1BhdXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53YWl0UGF1c2VQcm9taXNlVGFzaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndhaXRQYXVzZVByb21pc2VUYXNrID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMud2FpdFBhdXNlSGFuZGxlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMud2FpdFBhdXNlUHJvbWlzZVRhc2sgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhc3NldHM6cGF1c2UnLCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBc3NldCBEQiBpcyBwYXVzZWQgd2l0aCAke3NvdXJjZX0hYCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNQYXVzZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICAvLyAyIOWIhumSn+eahOi2heaXtuaXtumXtO+8jOi2hei/h+iHquWKqOi/lOWbnuWbnuiwg1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMud2FpdFBhdXNlUHJvbWlzZVRhc2sgJiYgZGVjaWRlUHJvbWlzZVN0YXRlKHRoaXMud2FpdFBhdXNlUHJvbWlzZVRhc2spLnRoZW4oc3RhdGUgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gUFJPTUlTRV9TVEFURS5QRU5ESU5HKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzUGF1c2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Fzc2V0czpwYXVzZScsIHNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdFBhdXNlSGFuZGxlISgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdQYXVzZSBhc3NldCBkYiB0aW1lIG91dCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCAyMDAwICogNjApO1xuICAgICAgICByZXR1cm4gdGhpcy53YWl0UGF1c2VQcm9taXNlVGFzaztcbiAgICB9XG59XG5cbmNvbnN0IGFzc2V0REJNYW5hZ2VyID0gbmV3IEFzc2V0REJNYW5hZ2VyKCk7XG5leHBvcnQgZGVmYXVsdCBhc3NldERCTWFuYWdlcjtcbihnbG9iYWxUaGlzIGFzIGFueSkuYXNzZXREQk1hbmFnZXIgPSBhc3NldERCTWFuYWdlcjtcblxuZnVuY3Rpb24gcGF0Y2hBc3NldERCSW5mbyhjb25maWc6IEFzc2V0REJSZWdpc3RlckluZm8pOiBJQXNzZXREQkluZm8ge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IGNvbmZpZy5uYW1lLFxuICAgICAgICB0YXJnZXQ6IFV0aWxzLlBhdGgubm9ybWFsaXplKGNvbmZpZy50YXJnZXQpLFxuICAgICAgICByZWFkb25seTogISFjb25maWcucmVhZG9ubHksXG5cbiAgICAgICAgdGVtcDogY29uZmlnLnRlbXAgfHwgVXRpbHMuUGF0aC5ub3JtYWxpemUoam9pbihBc3NldERCTWFuYWdlci50ZW1wUm9vdCwgY29uZmlnLm5hbWUpKSxcbiAgICAgICAgbGlicmFyeTogY29uZmlnLmxpYnJhcnkgfHwgQXNzZXREQk1hbmFnZXIubGlicmFyeVJvb3QsXG5cbiAgICAgICAgbGV2ZWw6IDQsXG4gICAgICAgIGdsb2JMaXN0OiBhc3NldENvbmZpZy5kYXRhLmdsb2JMaXN0LFxuICAgICAgICBpZ25vcmVGaWxlczogW10sXG4gICAgICAgIHZpc2libGU6IGNvbmZpZy52aXNpYmxlLFxuICAgICAgICBzdGF0ZTogJ25vbmUnLFxuICAgICAgICBwcmVJbXBvcnRFeHRMaXN0OiBjb25maWcucHJlSW1wb3J0RXh0TGlzdCB8fCBbXSxcbiAgICB9O1xufVxuXG4vLyBUT0RPIOaOkumYn+mYn+WIl+WBmuWQiOW5tlxuLy8gY2xhc3MgQXV0b01lcmdlUXVldWUgZXh0ZW5kcyBBcnJheSB7XG4vLyAgICAgYWRkKGl0ZW06IElXYWl0aW5nVGFzaykge1xuLy8gICAgICAgICBjb25zdCBsYXN0VGFzayA9IHRoaXNbdGhpcy5sZW5ndGggLSAxXTtcbi8vICAgICAgICAgLy8g6Ieq5Yqo5ZCI5bm25ZKM5LiK5LiA5Liq5Lu75Yqh5LiA5qC355qEXG4vLyAgICAgICAgIGlmICghbGFzdFRhc2sgfHwgIWxvZGFzaC5pc0VxdWFsKHtuYW1lOiBpdGVtLm5hbWUsIGFyZ3M6IGl0ZW0uYXJnc30sIHtuYW1lOiBsYXN0VGFzay5uYW1lLCBhcmdzOiBsYXN0VGFzay5hcmdzfSkpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2goaXRlbSk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgaWYgKCFpdGVtLnJlc29sdmUpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCAtIDE7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgbGFzdFRhc2sucmVzb2x2ZXMgPSBsYXN0VGFzay5yZXNvbHZlcyA/IFtdIDogbGFzdFRhc2sucmVzb2x2ZXM7XG4vLyAgICAgICAgIGxhc3RUYXNrLnJlc29sdmUgJiYgbGFzdFRhc2sucmVzb2x2ZXMucHVzaChsYXN0VGFzay5yZXNvbHZlKTtcbi8vICAgICAgICAgbGFzdFRhc2sucmVzb2x2ZXMucHVzaChpdGVtLnJlc29sdmUpO1xuLy8gICAgIH1cbi8vIH1cblxuY29uc3QgbGF5ZXJNYXNrOiBudW1iZXJbXSA9IFtdO1xuZm9yIChsZXQgaSA9IDA7IGkgPD0gMTk7IGkrKykge1xuICAgIGxheWVyTWFza1tpXSA9IDEgPDwgaTtcbn1cblxuY29uc3QgZGVmYXVsdFByZUltcG9ydEV4dExpc3QgPSBbJy50cycsICcuY2h1bmsnLCAnLmVmZmVjdCddO1xuXG5mdW5jdGlvbiBnZXRQcmVJbXBvcnRlckhhbmRsZXIocHJlSW1wb3J0RXh0TGlzdD86IHN0cmluZ1tdKSB7XG4gICAgaWYgKCFwcmVJbXBvcnRFeHRMaXN0IHx8ICFwcmVJbXBvcnRFeHRMaXN0Lmxlbmd0aCkge1xuICAgICAgICBwcmVJbXBvcnRFeHRMaXN0ID0gZGVmYXVsdFByZUltcG9ydEV4dExpc3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcHJlSW1wb3J0RXh0TGlzdCA9IEFycmF5LmZyb20obmV3IFNldChwcmVJbXBvcnRFeHRMaXN0LmNvbmNhdChkZWZhdWx0UHJlSW1wb3J0RXh0TGlzdCkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKGZpbGU6IHN0cmluZykge1xuICAgICAgICAvLyBIQUNLIOeUqOS6juaMh+WumumDqOWIhui1hOa6kOS8mOWFiOWvvOWFpVxuICAgICAgICBjb25zdCBleHQgPSBleHRuYW1lKGZpbGUpO1xuICAgICAgICBpZiAoIWV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlSW1wb3J0RXh0TGlzdC5pbmNsdWRlcyhleHQpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuY29uc3QgYWZ0ZXJTY2FuID0gYXN5bmMgZnVuY3Rpb24gKGZpbGVzOiBzdHJpbmdbXSkge1xuICAgIGxldCBkaXJJbmRleCA9IDA7XG4gICAgbGV0IGNodW5rSW5kZXggPSAwO1xuICAgIGxldCBlZmZlY3RJbmRleCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmaWxlID0gZmlsZXNbaV07XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUoZmlsZSk7XG4gICAgICAgIGlmICghZXh0KSB7XG4gICAgICAgICAgICBmaWxlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBmaWxlcy5zcGxpY2UoZGlySW5kZXgsIDAsIGZpbGUpO1xuICAgICAgICAgICAgZGlySW5kZXggKz0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChleHQgPT09ICcuY2h1bmsnKSB7XG4gICAgICAgICAgICBmaWxlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBmaWxlcy5zcGxpY2UoZGlySW5kZXggKyBjaHVua0luZGV4LCAwLCBmaWxlKTtcbiAgICAgICAgICAgIGNodW5rSW5kZXggKz0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChleHQgPT09ICcuZWZmZWN0Jykge1xuICAgICAgICAgICAgZmlsZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgZmlsZXMuc3BsaWNlKGRpckluZGV4ICsgY2h1bmtJbmRleCArIGVmZmVjdEluZGV4LCAwLCBmaWxlKTtcbiAgICAgICAgICAgIGVmZmVjdEluZGV4ICs9IDE7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBhZnRlclByZUltcG9ydChkYjogYXNzZXRkYi5Bc3NldERCKSB7XG4gICAgLy8g5YWI5oqK5bey5pS26ZuG55qE5Lu75Yqh6Zif5YiX77yIcHJlSW1wb3J0ZXJIYW5kbGVyIOi/h+a7pOWHuuadpeeahOmCo+mDqOWIhui1hOa6kOexu+Wei++8ieWGheWuueS8mOWFiOWvvOWFpeaJp+ihjOWujOavlVxuICAgIGRiLnRhc2tNYW5hZ2VyLnN0YXJ0KCk7XG4gICAgYXdhaXQgZGIudGFza01hbmFnZXIud2FpdFF1ZXVlKCk7XG4gICAgZGIudGFza01hbmFnZXIuc3RvcCgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhZnRlclN0YXJ0REIoZGJJbmZvTWFwOiBSZWNvcmQ8c3RyaW5nLCBJQXNzZXREQkluZm8+KSB7XG4gICAgYXdhaXQgYXNzZXRIYW5kbGVyTWFuYWdlci5jb21waWxlRWZmZWN0KHRydWUpO1xuICAgIC8vIOWQr+WKqOaVsOaNruW6k+WQju+8jOaJk+W8gCBlZmZlY3Qg5a+85YWl5ZCO55qE6Ieq5Yqo6YeN5paw55Sf5oiQIGVmZmVjdC5iaW4g5byA5YWzXG4gICAgYXdhaXQgYXNzZXRIYW5kbGVyTWFuYWdlci5zdGFydEF1dG9HZW5FZmZlY3RCaW4oKTtcblxuICAgIC8vIFN5bmMgYWxsIHNjcmlwdCBhc3NldHMgdG8gcGFja2VyLWRyaXZlciBhZnRlciBkYXRhYmFzZXMgYXJlIHN0YXJ0ZWQuXG4gICAgLy9cbiAgICAvLyBJbiB0aGUgRWRpdG9yLCBwYWNrZXItZHJpdmVyIHJlY2VpdmVzIHNjcmlwdCBub3RpZmljYXRpb25zIHZpYSBFZGl0b3IuTWVzc2FnZSBicm9hZGNhc3RzXG4gICAgLy8gKGFzc2V0LWRiOmFzc2V0LWFkZC9jaGFuZ2UvZGVsZXRlKSB3aGljaCBmaXJlIHJlZ2FyZGxlc3Mgb2YgY2FjaGUgc3RhdGUuXG4gICAgLy8gSW4gQ0xJIHByZXZpZXcsIHRoZXJlIGlzIG5vIGJyb2FkY2FzdCBtZWNoYW5pc20g4oCUIHBhY2tlci1kcml2ZXIgcmVsaWVzIG9uIGNvbXBpbGVTY3JpcHRzKClcbiAgICAvLyBjYWxscyBmcm9tIGltcG9ydGVycy4gV2hlbiB1c2VDYWNoZSBpcyB0cnVlIChvciBpbXBvcnQgb3JkZXIgdmFyaWVzKSwgc29tZSBzY3JpcHRzIG1heSBub3RcbiAgICAvLyB0cmlnZ2VyIGNvbXBpbGVTY3JpcHRzKCksIGxlYXZpbmcgcGFja2VyLWRyaXZlciB1bmF3YXJlIG9mIHRoZW0uXG4gICAgLy9cbiAgICAvLyBUaGlzIGJhdGNoIHN5bmMgbWlycm9ycyB0aGUgRWRpdG9yJ3MgZmV0Y2hBbGwoKSBiZWhhdmlvcjogcXVlcnkgYWxsIGNjLlNjcmlwdCBhc3NldHNcbiAgICAvLyBhbmQgbm90aWZ5IHBhY2tlci1kcml2ZXIuIF9wcmVyZXF1aXNpdGVBc3NldE1vZHMgaXMgYSBTZXQsIHNvIGR1cGxpY2F0ZXMgYXJlIGhhcm1sZXNzLlxuICAgIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uczogUXVlcnlBc3NldHNPcHRpb24gPSB7XG4gICAgICAgICAgICBjY1R5cGU6ICdjYy5TY3JpcHQnLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBhc3NldEluZm9zID0gZ2xvYmFsVGhpcy5hc3NldFF1ZXJ5LnF1ZXJ5QXNzZXRJbmZvcyhvcHRpb25zLCBbJ21ldGEnLCAndXJsJywgJ2ZpbGUnLCAnaW1wb3J0ZXInLCAndHlwZSddKSBhcyBJQXNzZXRJbmZvW107XG4gICAgICAgIGNvbnN0IGNoYW5nZXM6IEFzc2V0Q2hhbmdlSW5mb1tdID0gYXNzZXRJbmZvcy5tYXAoYXNzZXRJbmZvID0+ICh7XG4gICAgICAgICAgICB0eXBlOiBBc3NldEFjdGlvbkVudW0uYWRkLFxuICAgICAgICAgICAgdXVpZDogYXNzZXRJbmZvLnV1aWQsXG4gICAgICAgICAgICBmaWxlUGF0aDogYXNzZXRJbmZvLmZpbGUsXG4gICAgICAgICAgICBpbXBvcnRlcjogYXNzZXRJbmZvLmltcG9ydGVyLFxuICAgICAgICAgICAgdXNlckRhdGE6IGFzc2V0SW5mby5tZXRhPy51c2VyRGF0YSB8fCB7fSxcbiAgICAgICAgfSkpO1xuICAgICAgICBpZiAoY2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNjcmlwdGluZy5jb21waWxlU2NyaXB0cyhjaGFuZ2VzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8g55uu5YmN57uT5p6E6YeM77yM5rKh5pyJ5YWz6Zet5pWw5o2u5bqT55qE6YC76L6RXG59XG4iXX0=