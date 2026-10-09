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
