'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetDB = exports.version = exports.map = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const events_1 = require("events");
const node_uuid_1 = require("node-uuid");
const importer_1 = require("./importer");
const asset_1 = require("./asset");
const utils_1 = require("./utils");
const meta_1 = require("./meta");
const info_1 = require("./info");
const task_1 = require("./task");
const dependency_1 = require("./dependency");
const data_1 = require("./data");
const manager_1 = require("./manager");
const workflow_extra_1 = require("workflow-extra");
const fast_glob_1 = __importDefault(require("fast-glob"));
const console_1 = require("./console");
const migrator_1 = require("./migrator");
const path_identity_1 = require("./path-identity");
var manager_2 = require("./manager");
Object.defineProperty(exports, "map", { enumerable: true, get: function () { return manager_2.map; } });
function getAsset(uuid) {
    for (let name in manager_1.map) {
        const db = manager_1.map[name];
        const asset = db.uuid2asset.get(uuid);
        if (asset) {
            return asset;
        }
    }
    return undefined;
}
let deprecatedFlag = false;
exports.version = '2.0.0';
const migrations = [{
        version: '1.0.0',
        migrate: async (json, db) => {
            return {
                version: '1.0.0',
                data: json,
            };
        },
    }, {
        version: '1.0.1',
        migrate: async (json, db) => {
            return {
                version: '1.0.1',
                data: {
                    paths: json.data.paths.map(path => (0, path_1.relative)(db.options.target, path)),
                }
            };
        },
    }];
class AssetDB extends events_1.EventEmitter {
    get assetProgressInfo() {
        return {
            // @ts-ignore TODO taskManager 是否可以提供此字段
            current: this.taskManager._execID - this.taskManager._execThread,
            total: this.taskManager.total(),
            // @ts-ignore TODO taskManager 是否可以提供此字段
            wait: this.taskManager._waitQueue.size,
        };
    }
    /**
     * 锁定资源
     */
    async lock() {
        if (!this._lock) {
            return this._lock = true;
        }
        return await new Promise((resolve, reject) => {
            this._waitLockHandler.push(() => {
                resolve(null);
            });
        });
    }
    /**
     * 解锁资源
     */
    unlock() {
        const handle = this._waitLockHandler.shift();
        // 如果有等待的任务，则执行下一个
        if (handle) {
            handle();
            return;
        }
        // 已经没有在等待的任务了，还原标记
        this._lock = false;
    }
    /**
     * 实例化过程
     * @param options
     */
    constructor(options) {
        super();
        // 标记
        this.flag = {
            // 是否正在启动
            starting: false,
            // 是否已经启动的标记
            started: false,
        };
        // path 对应 asset 的 map
        this.path2asset = new path_identity_1.PathMap;
        // uuid 对应 asset 的 map
        this.uuid2asset = new Map;
        this._lock = false;
        this._waitLockHandler = [];
        if (!options.target || !options.library) {
            console.error(`The database(${options.name}) cannot be created because there is no target or library definition`);
        }
        else {
            options.target = (0, utils_1.absolutePath)(options.target);
            options.library = (0, utils_1.absolutePath)(options.library);
            if (!options.temp) {
                options.temp = (0, path_1.join)(options.library, '.temp');
            }
            options.temp = (0, utils_1.absolutePath)(options.temp);
        }
        // 设置输出等级
        if (!('level' in options) || options.level > 4 || options.level < 0) {
            options.level = 4;
        }
        if (!options.ignoreFiles || !Array.isArray(options.ignoreFiles)) {
            options.ignoreFiles = [];
        }
        this.options = options;
        // 启动数据库内置的各个管理器管理器
        this.taskManager = new workflow_extra_1.ParallelQueue(async (asset) => {
            const importer = await this.importerManager.find(asset);
            if (!importer ||
                // 删除的时候很可能文件不存在，所以 importer 有一定概率是 *，这时候和原有的导入器肯定不匹配，所以不需要处理删除
                (asset.action !== asset_1.AssetActionEnum.delete &&
                    (importer.name !== asset.meta.importer && asset.meta.importer !== '*') &&
                    asset.imported)) {
                if (!asset.init) {
                    if (this.options.level >= 1) {
                        this.console.error(`Unable to import data, no suitable importer was found. {asset[${asset instanceof asset_1.Asset ? asset.basename : ''}](${asset.uuid})}`);
                    }
                    asset.invalid = true;
                    asset.init = true;
                }
                return false;
            }
            switch (asset.action) {
                case asset_1.AssetActionEnum.add: {
                    this.dataManager.empty(asset);
                    if (await task_1.TASK_MAP.import.exec(this, asset, importer, true)) {
                        await asset.save();
                    }
                    if (asset instanceof asset_1.Asset) {
                        const assetStats = (0, fs_extra_1.statSync)(asset.source);
                        this.infoManager.add(asset.source, assetStats.mtimeMs, asset.uuid);
                    }
                    (0, manager_1.importAssociatedAssets)(this, asset);
                    // this.emit('added', asset);
                    break;
                }
                case asset_1.AssetActionEnum.change: {
                    this.dataManager.empty(asset);
                    // await TASK_MAP.destroy.exec(this, asset);
                    if (await task_1.TASK_MAP.import.exec(this, asset, importer, true)) {
                        await asset.save();
                    }
                    if (asset instanceof asset_1.Asset) {
                        const assetStats = (0, fs_extra_1.statSync)(asset.source);
                        this.infoManager.add(asset.source, assetStats.mtimeMs, asset.uuid);
                    }
                    (0, manager_1.importAssociatedAssets)(this, asset);
                    // this.emit('changed', asset);
                    break;
                }
                case asset_1.AssetActionEnum.delete: {
                    this.dataManager.empty(asset);
                    await task_1.TASK_MAP.destroy.exec(this, asset);
                    if (asset instanceof asset_1.Asset) {
                        const metaFile = asset.source + '.meta';
                        await this.metaManager.remove(metaFile);
                        this.infoManager.remove(asset.source);
                        this.infoManager.remove(metaFile);
                    }
                    (0, manager_1.importAssociatedAssets)(this, asset);
                    // this.emit('deleted', asset);
                    break;
                }
                case asset_1.AssetActionEnum.none: {
                    if (await task_1.TASK_MAP.import.exec(this, asset, importer, false)) {
                        await asset.save();
                    }
                    break;
                }
            }
            asset.init = true;
            if (asset.action !== asset_1.AssetActionEnum.none) {
                this.dataManager.save();
            }
            asset.action = asset_1.AssetActionEnum.none;
            return true;
        }, this.options.importConcurrency || 5);
        // 全局可用的系统相关的管理器
        this.console = new console_1.CustomConsole(options.level);
        this.metaManager = new meta_1.MetaManager(this.console);
        this.infoManager = new info_1.InfoManager(this.console, this.options.target);
        this.dependencyManager = new dependency_1.DependencyManager(this.console, this.options.target);
        this.dataManager = new data_1.DataManager(this.console);
        this.importerManager = new importer_1.ImporterManager(this.console);
        // 注册默认的解析器
        this.importerManager.add(importer_1.DefaultImporter, ['*']);
        this.cachePath = (0, path_1.join)(this.options.library, `.${options.name}`);
    }
    async prepareStart() {
        if (!this.options.target || !this.options.library || !this.options.temp) {
            if (this.options.level >= 1) {
                this.console.error(`Parameter error, unable to start asset-db(${this.options.name}) with option ${this.options}.`);
            }
            return;
        }
        if (this.flag.started && this.options.level >= 2) {
            this.console.warn(`The ${this.options.name} database is already started.`);
            return;
        }
        this.flag.started = true;
        this.flag.starting = true;
        await this.infoManager.setRecordJSON((0, path_1.join)(this.options.library, `.${this.options.name}-info.json`));
        await this.dataManager.setRecordJSON((0, path_1.join)(this.options.library, `.${this.options.name}-data.json`));
        await this.dependencyManager.setRecordJSON((0, path_1.join)(this.options.library, `.${this.options.name}-dependency.json`));
        // 要在资源刷新前加入缓存
        manager_1.map[this.options.name] = this;
    }
    /**
     * 启动资源数据库
     */
    async start(options = {}) {
        await this.prepareStart();
        // 刷新资源数据库内的资源列表
        let num = await this.refresh(this.options.target, {
            ignoreSelf: true,
            hooks: options.hooks,
        });
        this.console.debug(`start asset-db(${this.options.name}) with asset: ${num}`);
        return new Promise((resolve) => {
            const step = () => {
                setTimeout(async () => {
                    if (!this.taskManager.busy()) {
                        this.flag.starting = false;
                        if (options.hooks && options.hooks.afterStart) {
                            try {
                                await options.hooks.afterStart();
                            }
                            catch (error) {
                                this.console.error(error);
                            }
                        }
                        await this.save();
                        return resolve(num);
                    }
                    this.taskManager.waitQueue().then(() => {
                        step();
                    });
                }, 10);
            };
            step();
        });
    }
    /**
     * 直接从缓存中恢复数据库，可能会失败抛异常
     * @returns
     */
    async startWithCache() {
        await this.prepareStart();
        try {
            const managerCacheConflict = this.infoManager.cacheConflict || this.dependencyManager.cacheConflict;
            if (managerCacheConflict) {
                throw managerCacheConflict;
            }
            await this.restoreFromCache();
        }
        catch (error) {
            if (!(error instanceof path_identity_1.PathCaseConflictError)) {
                throw error;
            }
            this.console.warn(error.message);
            this.console.warn(`Discard invalid cache for asset-db(${this.options.name}) and rebuild it from disk.`);
            this.uuid2asset.clear();
            this.path2asset.clear();
            // Dependency records can only be reconstructed by running importers.
            // Invalidating mtime information prevents the normal startup fast path
            // from treating every asset as unchanged.
            if (this.dependencyManager.cacheConflict) {
                this.infoManager.destroy();
            }
            await this.refresh(this.options.target, { ignoreSelf: true });
        }
    }
    async updateInfoManager() {
        let infoDirty = false;
        // 删除已经不存在的资源
        // mtime 记录的都是之前存在的文件，所以循环 mtime 管理器里的数据进行校验
        await this.infoManager.forEach(async (path, info) => {
            if (!this.path2asset.has(path) && this.infoManager.get(path).uuid) {
                try {
                    const uuid = info.uuid;
                    if (getAsset(uuid)) {
                        return;
                    }
                    const dir = `${this.options.library}${path_1.sep}${uuid.substr(0, 2)}`;
                    if ((0, fs_extra_1.existsSync)(dir)) {
                        const list = await (0, fs_extra_1.readdir)(dir);
                        for (let name of list) {
                            if (name.startsWith(uuid)) {
                                await (0, fs_extra_1.remove)((0, path_1.join)(dir, name));
                            }
                        }
                    }
                    this.infoManager.remove(path);
                    infoDirty = true;
                }
                catch (error) {
                    this.console.warn(error);
                }
            }
        });
        infoDirty && this.infoManager.save();
    }
    _generateRecordInfo() {
        return {
            version: AssetDB.version,
            data: {
                paths: Array.from(this.path2asset.keys()).map((path) => (0, path_1.relative)(this.options.target, path)),
            },
        };
    }
    async save() {
        try {
            // 保存记录的缓存信息
            await (0, fs_extra_1.writeJSON)((0, path_1.join)(this.cachePath), this._generateRecordInfo(), { spaces: 4 });
        }
        catch (error) {
            this.console.error(error);
            this.console.error(`Save cache for asset db ${this.options.name} failed.`);
        }
    }
    async restoreFromCache() {
        // 此处兼容旧版本格式，临时处理，后续需要引入记录文件的版本管理机制
        const cacheJSON = await (0, fs_extra_1.readJSON)(this.cachePath);
        const version = cacheJSON.version ? cacheJSON.version : '0.0.0';
        const migrator = new migrator_1.Migrator(migrations, AssetDB.version, {
            onError: (error, stage, data, ...args) => {
                this.console.warn(`Migrate error in asset-db ${this.options.name}`);
                this.console.warn(error);
            }
        });
        const recordInfo = await migrator.run(cacheJSON, version, [this]);
        const cachedPaths = recordInfo.data.paths.map((relativePath) => (0, path_1.join)(this.options.target, relativePath));
        (0, path_identity_1.assertNoPathIdentityConflicts)(cachedPaths);
        await Promise.all(cachedPaths.map(async (path) => {
            try {
                const metaFile = (0, path_1.join)(path + '.meta');
                const metaInfo = await this.metaManager.get(metaFile);
                const asset = new asset_1.Asset(path, metaInfo.json, this);
                this.uuid2asset.set(asset.uuid, asset);
                this.path2asset.set(asset.source, asset);
            }
            catch (error) {
                this.console.error(`Restore asset ${path} from cache failed.`);
                this.console.error(error);
            }
        }));
    }
    /**
     * 停止资源数据库
     */
    async stop() {
        this.uuid2asset.clear();
        this.path2asset.clear();
        this.flag.started = false;
        this.infoManager.saveImmediate();
        this.dependencyManager.saveImmediate();
        this.dataManager.saveImmediate();
        this.metaManager.destroy();
        this.infoManager.destroy();
        this.dependencyManager.destroy();
        if (manager_1.map[this.options.name] === this) {
            delete manager_1.map[this.options.name];
        }
    }
    /**
     * 传入 path，返回 asset-db 内对应的 uuid
     * 不存在则返回 null
     * @param path
     */
    pathToUuid(path) {
        let asset = this.path2asset.get(path);
        if (!asset) {
            return null;
        }
        return asset.uuid;
    }
    /**
     * 传入 uuid，返回对应的资源的 path
     * @param uuid
     */
    uuidToPath(uuid) {
        let asset = this.uuid2asset.get(uuid);
        if (!asset) {
            return null;
        }
        return asset.source;
    }
    /**
     * 查询资源实例
     * @param uuid
     */
    getAsset(uuid) {
        if (!uuid || typeof uuid !== 'string') {
            return null;
        }
        let search = uuid.split('@');
        let id = search.shift() || '';
        let asset = this.uuid2asset.get(id);
        if (!asset) {
            return null;
        }
        for (let i = 0; i < search.length; i++) {
            let idOrName = search[i];
            asset = asset.subAssets[idOrName];
            if (!asset) {
                return null;
            }
        }
        return asset || null;
    }
    /**
     * 重新导入某个指定资源
     * @param fileOrUUID
     */
    async reimport(fileOrUUID) {
        const asset = this.path2asset.get(fileOrUUID) || this.getAsset(fileOrUUID);
        if (!asset) {
            return null;
        }
        // 暂时使用开关控制
        if (this.options.flags && this.options.flags.reimportCheck && !asset._lock && asset.action !== asset_1.AssetActionEnum.none) {
            return asset;
        }
        // 需要先锁定，因为如果开始导入，init 还是 false，但资源已经被锁定，所以等待资源锁定状态结束，再开始导入
        await this.lock();
        // 强制重新触发查找 importer 的动作
        if (asset instanceof asset_1.Asset) {
            this.metaManager.read(asset.source + '.meta');
            const oldImporter = asset.meta.importer;
            asset.meta.importer = '*';
            const importer = await this.importerManager.find(asset);
            if (!importer) {
                throw new Error(`Unable to import data, no suitable importer was found.\n  path: ${asset.source}\n  uuid: ${asset.uuid}`);
            }
            else if (oldImporter === importer.name) {
                asset.meta.importer = importer.name;
            }
        }
        try {
            if (!asset.init) {
                this.unlock();
                return null;
            }
            asset.init = false;
            asset.action = asset_1.AssetActionEnum.change;
            asset.task = this.taskManager.addTask(asset);
        }
        catch (error) {
            if (this.flag.starting) {
                this.console.error(error);
            }
            else {
                throw new Error(error);
            }
        }
        this.unlock();
        await this.taskManager.waitQueue();
        return asset;
    }
    /**
     * 刷新资源
     * 传入某一个文件或者文件夹，进行数据库刷新操作
     * 会优先同步扫描所有资源，然后等待其他 refresh 队列
     * 默认 refresh 是有队列的，多个 refresh 同时执行需要进入队列等待
     * @param path
     * @returns {number} 刷新的资源个数
     */
    async refresh(path, options = {}) {
        // 如果不是绝对路径，不刷新
        if (!(0, utils_1.absolutePath)(path)) {
            throw new Error(`invalid path ${path}, asset-db.refresh only support absolute path`);
        }
        path = (0, path_1.normalize)(path);
        // 如果是数据库文件夹，默认就忽略自己
        if ((0, path_identity_1.isSamePath)(path, this.options.target)) {
            options.ignoreSelf = true;
            path = this.options.target;
        }
        path = (0, path_identity_1.resolveRealPathCase)(path, this.options.target);
        // 向上递归查询，查询自己的父级文件夹是否存在
        // 如果父文件夹不在 db 里，则自动加入
        let parentDir = (0, path_1.dirname)(path);
        while ((0, utils_1.isSubPath)(parentDir, this.options.target) && !this.path2asset.has(parentDir)) {
            path = parentDir;
            parentDir = (0, path_1.dirname)(parentDir);
        }
        // 检查是不是配置的 root 路径的子目录，如果不是子路径，则返回刷新 0 个资源
        if (!(0, utils_1.isSubPath)(path, this.options.target) && !(0, path_identity_1.isSamePath)(path, this.options.target)) {
            throw new Error(`asset(${path}) is not in asset-db(${this.options.name})`);
        }
        let files = [];
        // 刷新路径不存在时可能是已被删除的资源需要更新数据库信息，不报错
        if ((0, fs_extra_1.existsSync)(path)) {
            try {
                const fileStat = (0, fs_extra_1.statSync)(path);
                if (fileStat.isFile()) {
                    files = [path];
                }
                else {
                    const globPath = process.platform === 'win32' ? path.replace(/\\/g, '/') : path;
                    const scanBasePath = path;
                    // ! 要写绝对路径，否则可能在某些 win 机器上无法忽略文件
                    const search = options.globList || [
                        `**/*`,
                        `!**/*.meta`,
                    ];
                    if (this.options.globList) {
                        search.push(...this.options.globList);
                    }
                    files = fast_glob_1.default.sync(search, {
                        onlyFiles: false,
                        // 如果将 path 传入 search 数组，卢经理带有 () 就无法正确识别了，所以需要使用 cwd
                        cwd: globPath,
                        // dot: true,
                    });
                    files.forEach((file, index) => {
                        files[index] = (0, path_1.join)(scanBasePath, file);
                    });
                    // 当扫描的路径不是根目录的时候，把被扫描的路径也检查一次
                    if (!(0, path_identity_1.isSamePath)(path, this.options.target)) {
                        files.splice(0, 0, scanBasePath);
                    }
                }
            }
            catch (error) {
                this.console.error(error);
                files = [];
            }
        }
        (0, path_identity_1.assertNoPathIdentityConflicts)(files);
        // 文件分组，如果有多个组，会在上一个组导入完成后，才开始下一个组的导入流程
        if (options.hooks && options.hooks.afterScan) {
            try {
                await options.hooks.afterScan(files);
            }
            catch (error) {
                this.console.error(error);
            }
        }
        // 扫描文件到的文件记录
        const fileSet = new path_identity_1.PathSet();
        const deleteSet = new path_identity_1.PathSet();
        const addSet = new path_identity_1.PathSet();
        const caseChangedSet = new path_identity_1.PathSet();
        const caseChangedAssets = [];
        const afterError = (error) => {
            this.taskManager.clear();
            this.unlock();
            throw error;
        };
        try {
            const preAddFiles = [];
            const addFiles = [];
            const deleteFiles = [];
            if (this.preImporterHandler) {
                for (let file of files) {
                    const storedPath = (0, path_identity_1.getMapStoredPathKey)(this.path2asset, file);
                    if (storedPath !== undefined && storedPath !== file && (0, path_1.normalize)(storedPath) !== (0, path_1.normalize)(file)) {
                        const asset = this.path2asset.get(storedPath);
                        if (asset) {
                            this._updateAssetPathCase(asset, file);
                            caseChangedAssets.push(asset);
                            caseChangedSet.add(file);
                        }
                    }
                    if (!this.path2asset.has(file)) {
                        if (this.preImporterHandler(file)) {
                            preAddFiles.push(file);
                        }
                        else {
                            addFiles.push(file);
                        }
                        addSet.add(file);
                    }
                    fileSet.add(file);
                }
            }
            else {
                for (let file of files) {
                    const storedPath = (0, path_identity_1.getMapStoredPathKey)(this.path2asset, file);
                    if (storedPath !== undefined && storedPath !== file && (0, path_1.normalize)(storedPath) !== (0, path_1.normalize)(file)) {
                        const asset = this.path2asset.get(storedPath);
                        if (asset) {
                            this._updateAssetPathCase(asset, file);
                            caseChangedAssets.push(asset);
                            caseChangedSet.add(file);
                        }
                    }
                    if (!this.path2asset.has(file)) {
                        addFiles.push(file);
                        addSet.add(file);
                    }
                    fileSet.add(file);
                }
            }
            this.path2asset.forEach((asset, file) => {
                if (files.length === 0 || !fileSet.has(file)) {
                    if ((0, path_identity_1.isSamePath)(file, path) || (0, utils_1.isSubPath)(file, path)) {
                        deleteFiles.push(file);
                        deleteSet.add(file);
                    }
                }
            });
            this.taskManager.stop();
            for (const asset of caseChangedAssets) {
                asset.action = asset_1.AssetActionEnum.change;
                asset.task = this.taskManager.addTask(asset);
            }
            // 判断添加的资源和移动、删除的资源
            await this._checkAssetsStatSync(preAddFiles, deleteFiles, deleteSet);
            if (options.hooks && options.hooks.afterPreImport) {
                try {
                    await options.hooks.afterPreImport();
                }
                catch (error) {
                    this.console.error(error);
                }
            }
            await this._checkAssetsStatSync(addFiles, deleteFiles, deleteSet);
            this.emit('refresh-uuid-ready', path);
            // 锁定任务栈
            await this.lock();
            // 没有改动的数据
            const tasks = [];
            for (let file of files) {
                if (!addSet.has(file) && !deleteSet.has(file) && !caseChangedSet.has(file)) {
                    const asset = this.path2asset.get(file);
                    if (asset) {
                        tasks.push(this._checkAssetStat(asset));
                    }
                }
            }
            // 使用 Promise.all 会导致部分资源问题导致全部资源都无法刷新
            const result = await Promise.allSettled(tasks);
            result.forEach((res) => {
                // 失败的任务需要报错
                if (res.status === 'rejected') {
                    console.error(res.reason);
                }
            });
        }
        catch (error) {
            afterError(error);
        }
        if (options.hooks && options.hooks.afterGenerateMeta) {
            try {
                await options.hooks.afterGenerateMeta();
            }
            catch (error) {
                this.console.error(error);
            }
        }
        this.taskManager.start();
        try {
            await this.taskManager.waitQueue();
        }
        catch (error) {
            afterError(error);
        }
        this.unlock();
        // 返回所有文件的个数
        const num = this.taskManager.total();
        this.taskManager.clear();
        if (options.hooks && options.hooks.afterRefresh) {
            try {
                await options.hooks.afterRefresh();
            }
            catch (error) {
                this.console.error(error);
            }
        }
        await this.updateInfoManager();
        await this.save();
        return num;
    }
    _replaceUUID(asset, oAsset) {
        if (oAsset !== asset) {
            if ((0, path_identity_1.isSamePath)(asset.source, oAsset.source)) {
                console.trace(`_replaceUUID invalid in asset ${asset.source}`);
                return;
            }
            const newUUID = (0, node_uuid_1.v4)();
            // 提示两个文件 uuid 冲突
            if (this.options.level >= 2) {
                let info = JSON.stringify([
                    asset.source,
                    oAsset.source,
                ], null, 2);
                this.console.warn(`The uuid is already pointing to another asset .\n${info}\nThe file uuid has been updated: ${asset.source}\n    ${asset.uuid} -> ${newUUID}`);
            }
            asset.meta.uuid = newUUID;
        }
    }
    _updateAssetPathCase(asset, source) {
        const previousSource = asset.source;
        const previousUrl = asset.url;
        if (previousSource === source) {
            return;
        }
        this.path2asset.set(source, asset);
        asset._source = source;
        const sourceExtname = (0, path_1.extname)(source);
        asset.extname = sourceExtname.toLowerCase();
        asset.basename = (0, path_1.basename)(source, sourceExtname);
        asset.updateUrl();
        this.infoManager.updatePathCase(previousSource, source);
        this.infoManager.updatePathCase(previousSource + '.meta', source + '.meta');
        this.metaManager.updatePathCase(previousSource + '.meta', source + '.meta');
        this.dependencyManager.updatePathCase(previousSource, source);
        this.dependencyManager.updatePathCase(previousUrl, asset.url);
    }
    /**
     * 检查资源状态
     * 识别是新增、修改还是删除了资源
     * @param addFiles
     * @param deleteFiles
     */
    async _checkAssetsStatSync(addFiles, deleteFiles, deleteSet) {
        for (let file of deleteFiles) {
            // 毋庸置疑的删除文件
            const asset = this.path2asset.get(file);
            if (asset) {
                asset.action = asset_1.AssetActionEnum.delete;
                asset.task = this.taskManager.addTask(asset);
                this.uuid2asset.delete(asset.uuid);
                this.path2asset.delete(asset.source);
                const metaFile = asset.source + '.meta';
                await this.metaManager.remove(metaFile);
                this.infoManager.remove(asset.source);
                this.infoManager.remove(metaFile);
            }
        }
        for (let file of addFiles) {
            // 获取 meta，没有的话直接生成
            const metaFile = file + '.meta';
            const metaInfo = await this.metaManager.get(metaFile);
            const uuidCacheAsset = getAsset(metaInfo.json.uuid);
            // uuid 指向的文件被删除了，就是移动文件
            if (uuidCacheAsset) {
                if (deleteSet.has(uuidCacheAsset.source) ||
                    (!(0, path_identity_1.isSamePath)(uuidCacheAsset.source, file) &&
                        !(0, fs_extra_1.existsSync)(uuidCacheAsset.source))) {
                    const asset = uuidCacheAsset;
                    this.path2asset.delete(asset.source);
                    this.infoManager.remove(asset.source);
                    await this.metaManager.remove(asset.source + '.meta');
                    this.infoManager.remove(asset.source + '.meta');
                    asset._source = file;
                    asset.extname = (0, path_1.extname)(file).toLowerCase();
                    asset.basename = (0, path_1.basename)(file, asset.extname);
                    asset.updateUrl();
                    asset.meta = metaInfo.json;
                    this.path2asset.set(asset.source, asset);
                    asset.action = asset_1.AssetActionEnum.change;
                    asset.task = this.taskManager.addTask(asset);
                }
                // uuid 指向的文件没删除，识别为新建，但是 uuid 冲突了
                else {
                    const asset = new asset_1.Asset(file, metaInfo.json, this);
                    this._replaceUUID(asset, uuidCacheAsset);
                    await asset.save();
                    asset.action = asset_1.AssetActionEnum.add;
                    asset.task = this.taskManager.addTask(asset);
                    this.uuid2asset.set(asset.uuid, asset);
                    this.path2asset.set(asset.source, asset);
                }
            }
            // 启动数据库，还原以前的资源
            else if (this.flag.starting) {
                const fileStat = (0, fs_extra_1.statSync)(file);
                const asset = new asset_1.Asset(file, metaInfo.json, this);
                if (this.infoManager.compare(file, fileStat.mtimeMs)) {
                    const metaStat = (0, fs_extra_1.statSync)(metaFile);
                    if (this.infoManager.compare(metaFile, metaStat.mtimeMs)) {
                        if (this.dataManager.has(asset)) {
                            asset.action = asset_1.AssetActionEnum.none;
                            asset.task = this.taskManager.addTask(asset);
                        }
                        else {
                            asset.action = asset_1.AssetActionEnum.change;
                            asset.task = this.taskManager.addTask(asset);
                        }
                    }
                    else {
                        // meta 被修改，就识别为先删后新增
                        this.emit('delete', asset);
                        this.emit('deleted', asset);
                        asset.action = asset_1.AssetActionEnum.add;
                        const uuid = asset.uuid;
                        this.metaManager.read(metaFile);
                        if (asset.uuid !== uuid) {
                            this.uuid2asset.delete(uuid);
                            if (this.uuid2asset.has(asset.uuid)) {
                                this._replaceUUID(asset, getAsset(asset.uuid));
                            }
                            this.uuid2asset.set(asset.uuid, asset);
                        }
                        this.infoManager.add(metaFile, metaStat.mtimeMs);
                        asset.task = this.taskManager.addTask(asset);
                    }
                }
                else {
                    asset.action = asset_1.AssetActionEnum.add;
                    this.infoManager.add(file, fileStat.mtimeMs);
                    asset.task = this.taskManager.addTask(asset);
                }
                this.uuid2asset.set(asset.uuid, asset);
                this.path2asset.set(asset.source, asset);
            }
            // 普通新增
            else {
                const oAsset = getAsset(metaInfo.json.uuid);
                const asset = new asset_1.Asset(file, metaInfo.json, this);
                if (oAsset) {
                    this._replaceUUID(asset, oAsset);
                    await asset.save();
                }
                const metaStat = (0, fs_extra_1.statSync)(metaFile);
                // 如果 metaFile 的缓存不存在，则添加进缓存
                if (!this.infoManager.get(metaFile)) {
                    this.infoManager.add(metaFile, metaStat.mtimeMs);
                }
                // 如果 metaFile 的缓存不一致，则判断为被修改
                if (this.infoManager.compare(metaFile, metaStat.mtimeMs)) {
                    asset.action = asset_1.AssetActionEnum.add;
                    asset.task = this.taskManager.addTask(asset);
                    this.uuid2asset.set(asset.uuid, asset);
                    this.path2asset.set(asset.source, asset);
                }
                else {
                    // 这种情况下，meta 被修改，都识别为先删除后新增
                    this.emit('delete', asset);
                    this.emit('deleted', asset);
                    asset.action = asset_1.AssetActionEnum.add;
                    const uuid = asset.uuid;
                    this.metaManager.read(metaFile);
                    if (asset.uuid !== uuid) {
                        this.uuid2asset.delete(uuid);
                    }
                    this.infoManager.add(metaFile, metaStat.mtimeMs);
                    asset.task = this.taskManager.addTask(asset);
                    this.uuid2asset.set(asset.uuid, asset);
                    this.path2asset.set(asset.source, asset);
                }
            }
        }
    }
    async _checkAssetStat(asset) {
        const file = asset.source;
        const metaFile = file + '.meta';
        if (!(0, fs_extra_1.existsSync)(metaFile)) {
            console.error(`${metaFile} is not exist! will use cache meta.`);
            await asset.save();
        }
        const metaStat = await (0, fs_extra_1.stat)(metaFile);
        if (!await this.infoManager.compare(metaFile, metaStat.mtimeMs)) {
            this.emit('delete', asset);
            this.emit('deleted', asset);
            asset.action = asset_1.AssetActionEnum.add;
            const uuid = asset.uuid;
            this.metaManager.read(metaFile);
            if (asset.uuid !== uuid) {
                this.uuid2asset.delete(uuid);
                if (this.uuid2asset.has(asset.uuid)) {
                    this._replaceUUID(asset, getAsset(asset.uuid));
                }
                this.uuid2asset.set(asset.uuid, asset);
            }
            this.infoManager.add(metaFile, metaStat.mtimeMs);
            asset.task = this.taskManager.addTask(asset);
        }
        else {
            const fileStat = await (0, fs_extra_1.stat)(file);
            if (this.infoManager.compare(file, fileStat.mtimeMs)) {
                if (this.dataManager.has(asset)) {
                    asset.action = asset_1.AssetActionEnum.none;
                    asset.task = this.taskManager.addTask(asset);
                }
                else {
                    asset.action = asset_1.AssetActionEnum.change;
                    asset.task = this.taskManager.addTask(asset);
                }
            }
            else {
                // 更新 mtime 记录
                this.infoManager.add(file, fileStat.mtimeMs, asset.uuid);
                asset.action = asset_1.AssetActionEnum.change;
                asset.task = this.taskManager.addTask(asset);
            }
        }
    }
}
exports.AssetDB = AssetDB;
AssetDB.version = '1.0.1';
