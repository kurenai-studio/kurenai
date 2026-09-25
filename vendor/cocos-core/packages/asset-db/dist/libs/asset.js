'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Asset = exports.VirtualAsset = exports.AssetActionEnum = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const filesystem_1 = require("./filesystem");
const meta_1 = require("./meta");
const utils_1 = require("./utils");
const manager_1 = require("./manager");
// 检查是否是扩展名的正则判断
const extnameRex = /^\./;
/**
 * 检查一个输入文件名是否是扩展名
 * @param extOrFile
 */
function isExtname(extOrFile) {
    return extOrFile === '' || extnameRex.test(extOrFile);
}
function createOperationContext(kind, source, paths) {
    const timestamp = Date.now();
    return {
        opId: `asset-op-${timestamp}-${Math.random().toString(16).slice(2)}`,
        kind,
        origin: 'direct-op',
        source,
        paths,
        timestamp,
    };
}
var AssetActionEnum;
(function (AssetActionEnum) {
    AssetActionEnum[AssetActionEnum["add"] = 0] = "add";
    AssetActionEnum[AssetActionEnum["change"] = 1] = "change";
    AssetActionEnum[AssetActionEnum["delete"] = 2] = "delete";
    AssetActionEnum[AssetActionEnum["none"] = 3] = "none";
})(AssetActionEnum = exports.AssetActionEnum || (exports.AssetActionEnum = {}));
/**
 * 虚拟的 asset 实例
 * 没有对应的源文件都的都是虚拟 asset
 */
class VirtualAsset {
    get init() {
        return this._init;
    }
    set init(bool) {
        this._init = bool;
        const keys = Object.keys(this.subAssets);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            this.subAssets[key].init = bool;
        }
        if (bool) {
            while (this._waitInitHandle.length > 0) {
                const handle = this._waitInitHandle.shift();
                handle && handle();
            }
        }
    }
    async waitInit() {
        if (this._init) {
            return;
        }
        if (this.parent) {
            await this.parent.waitInit();
        }
        else {
            await new Promise((resolve, reject) => {
                this._waitInitHandle.push(() => {
                    resolve(null);
                });
            });
        }
    }
    // 源文件路径 'db://asset/test.plist@c869a.png'
    get source() {
        if (!this._parent) {
            return '';
        }
        return this._parent ? this._parent.source + '@' + this._id : '';
    }
    // db 协议格式的 url 地址
    get url() {
        if (!this._parent) {
            return '';
        }
        return this._parent ? this._parent.url + '@' + this._id : '';
    }
    // library 路径，不带扩展名的文件路径 xxx/3c/3cabcs-dfsdaf
    get library() {
        let id = this._parent ? this._id : this.meta.uuid;
        let asset = this._parent;
        while (asset) {
            if (asset.parent) {
                id = `${asset._id}@${id}`;
            }
            else {
                id = `${asset.uuid}@${id}`;
            }
            asset = asset.parent;
        }
        return `${this._assetDB.options.library}${path_1.sep}${this.meta.uuid.substr(0, 2)}${path_1.sep}${id}`;
    }
    // 资源使用的临时路径，不带扩展名的文件路径 xxx/3c/3cabcs-dfsdaf，重新导入的时候会删除这个路径下的临时文件
    get temp() {
        let id = this._parent ? this._id : this.meta.uuid;
        let asset = this._parent;
        while (asset) {
            if (asset.parent) {
                id = `${asset._id}@${id}`;
            }
            else {
                id = `${asset.uuid}@${id}`;
            }
            asset = asset.parent;
        }
        return `${this._assetDB.options.temp}${path_1.sep}${this.meta.uuid.substr(0, 2)}${path_1.sep}${id}`;
    }
    // 唯一的 id
    get uuid() {
        return this.meta.uuid;
    }
    // 显示的名字
    get displayName() {
        return this.meta.displayName || '';
    }
    /**
     * 获取一个存储在资源上的数据
     * @param key
     * @returns
     */
    getData(key) {
        return this._assetDB.dataManager.getValue(this, key);
    }
    /**
     * 设置一个存储在资源上的数据
     * @param key
     * @param value
     * @returns
     */
    setData(key, value) {
        this._assetDB.dataManager.setValue(this, key, value);
    }
    generate() {
    }
    // 当前进程内是否已经导入完成
    set imported(imported) {
        this.meta.imported = imported;
    }
    get imported() {
        if (this.init === false) {
            return false;
        }
        return this.meta.imported;
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
    // 拿出父资源
    get parent() {
        return this._parent;
    }
    // meta 内附带的 userData 数据
    get userData() {
        return this.meta.userData;
    }
    constructor(meta, name, id, assetDB) {
        // ---- 资源初始化标记 开始 ---
        // 是否初始化过（用于区分导入过，但是没有扫描到的情况）
        this._init = false;
        this.importError = null;
        /**
         * 等待导入完成
         */
        this._waitInitHandle = [];
        // ---- 资源初始化标记 结束 ---
        // 资源的动作，当资源准备导入的时候，会变成对应的操作类型，导入完成变为 none
        this.action = AssetActionEnum.none;
        // 导入任务 id
        this.task = -1;
        // 导入失败的话会将资源标记成无效资源
        this.invalid = false;
        // uuid 对应的回收站 data 数据，被删除的数据会在这里存储一段时间
        this.uuid2recycle = {};
        this._lock = false;
        this._waitLockHandler = [];
        // 如果是 sub asset，则这个值指向父级的 asset
        this._parent = null;
        // 数据交换空间
        this._swapSpace = null;
        this.meta = (0, meta_1.completionMeta)(meta);
        this.imported = meta.imported;
        this._name = meta.name = name;
        this._id = meta.id = id;
        this._assetDB = assetDB;
        this.versionCode = assetDB.dataManager.get(this, 'versionCode') || 0;
        // sub asset
        // 在 assetDB 内是查询不到的，只能通过父 asset 查询到 sub asset
        this.subAssets = Object.create(null);
        Object.keys(meta.subMetas).forEach((name) => {
            let subMeta = meta.subMetas[name];
            // 父资源尚未导入，子资源不为其生成 subAsset，并需要确认标记 imported = false
            if (!subMeta.name) {
                return;
            }
            let subAsset = new VirtualAsset(subMeta, subMeta.name, subMeta.id, assetDB);
            subAsset._parent = this;
            this.subAssets[name] = subAsset;
        });
    }
    /**
     * 复制外部的 userData 数据
     * @param json 模版对象
     * @param overwrite 如果 userData 内有数据，是否使用模版内的数据覆盖，默认 false
     */
    assignUserData(json, overwrite = false) {
        const data = this.meta.userData;
        if (overwrite) {
            Object.assign(data, json);
        }
        else {
            for (let key in json) {
                if (key in data) {
                    continue;
                }
                data[key] = json[key];
            }
        }
    }
    /**
     * 保存当前资源的 meta 信息
     */
    async save() {
        if (!this._parent) {
            return;
        }
        // 因为虚拟的 asset 没有 .meta 文件，所以调用父级的 saveMeta
        return await this._parent.save();
    }
    /**
     * 清空并还原 meta 数据
     * 并清除 subMeta 内的数据
     * @param handle 删除内部的 subAsset 的时候会执行回调
     */
    async reset() {
        this.imported = false;
        this.invalid = false;
        this.importError = null;
        // 检查并删除临时缓存
        if ((0, fs_extra_1.existsSync)(this.temp)) {
            try {
                (0, fs_extra_1.removeSync)(this.temp);
            }
            catch (error) {
                this._assetDB.console.warn(`Failed to delete temporary cache: ${this.source}`);
                this._assetDB.console.warn(error);
            }
        }
        // 删除导入的文件
        for (let i = this.meta.files.length - 1; i >= 0; i--) {
            let extname = this.meta.files[i];
            try {
                await this.deleteFromLibrary(extname);
            }
            catch (error) {
                this._assetDB.console.warn(`Failed to delete temporary cache: ${this.source}`);
                this._assetDB.console.warn(error);
            }
        }
        this.meta.files = [];
        // 清空 sub asset 内的数据
        const keys = Object.keys(this.subAssets);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const subAsset = this.subAssets[key];
            // 这是一个异步操作，subAsset 有可能在操作过程中，被删除
            if (subAsset && subAsset.reset) {
                // 放入回收站, id
                this.uuid2recycle[key] = subAsset.meta;
                await subAsset.reset();
            }
            delete this.meta.subMetas[key];
            delete this.subAssets[key];
        }
        // 还原自身的数据，userData 不需要还原
        // this.meta.ver = '0.0.0';
        // this.meta.importer = '*'; // importer 不还原
        // 清空依赖关系
        this._assetDB.dependencyManager.remove('uuid', this.uuid);
        this._assetDB.dependencyManager.remove('path', this.source);
        this._assetDB.dependencyManager.remove('url', this.url);
        return true;
    }
    /**
     * 查询一个文件的绝对地址
     * @param extOrFile
     */
    getFilePath(extOrFile) {
        if (isExtname(extOrFile)) {
            return `${this.library}${extOrFile}`;
        }
        else {
            return `${this.library}${path_1.sep}${extOrFile}`;
        }
    }
    /**
     * 存储一个 uuid 为名字的 buffer
     * 传入一个扩展名或者相对路径，如果传入扩展名，则存储到 uuid.extname
     * 如果传入的是一个相对路径或者文件名，则放到 uuid 为名字的目录内
     * @param extOrPath 一个扩展名或者相对路径
     * @param buffer
     */
    async saveToLibrary(extOrFile, buffer) {
        if (!Buffer.isBuffer(buffer) && typeof buffer !== 'string' && !ArrayBuffer.isView(buffer)) {
            throw new Error('The "data" argument must be of type string or an instance of Buffer or ArrayBuffer');
        }
        // 如果是扩展名，直接存储到 uuid.extname
        if (isExtname(extOrFile)) {
            let file = `${this.library}${extOrFile}`;
            let index = this.meta.files.indexOf(extOrFile);
            if (index === -1) {
                this.meta.files.push(extOrFile);
                this.meta.files.sort();
            }
            await (0, filesystem_1.fsWriteFile)(file, buffer, {
                context: createOperationContext('write', this.source, [file]),
            });
            return;
        }
        // 如果传入的不是扩展名，恭喜，新建一个 uuid 文件夹存放吧
        await (0, filesystem_1.fsCreateDirectory)(this.library);
        let file = (0, path_1.join)(this.library, extOrFile);
        let relativeFile = (0, path_1.relative)(this.library, file).replace(/\\/g, '/');
        let index = this.meta.files.indexOf(relativeFile);
        if (index === -1) {
            this.meta.files.push(relativeFile);
            this.meta.files.sort();
        }
        await (0, filesystem_1.fsWriteFile)(file, buffer, {
            context: createOperationContext('write', this.source, [file]),
        });
    }
    /**
     * 复制一个文件到 library 内
     * @param extOrFile
     * @param target
     */
    async copyToLibrary(extOrFile, target) {
        // 如果是扩展名，直接存储到 uuid.extname
        if (isExtname(extOrFile)) {
            let file = `${this.library}${extOrFile}`;
            let index = this.meta.files.indexOf(extOrFile);
            if (index === -1) {
                this.meta.files.push(extOrFile);
                this.meta.files.sort();
            }
            const context = createOperationContext('copy', this.source, [target, file]);
            if (await (0, filesystem_1.fsExists)(file)) {
                await (0, filesystem_1.fsDelete)(file, { context, useTrash: false });
            }
            await (0, filesystem_1.fsCopy)(target, file, { context });
            return;
        }
        // 如果传入的不是扩展名，恭喜，新建一个 uuid 文件夹存放吧
        await (0, filesystem_1.fsCreateDirectory)(this.library);
        let file = (0, path_1.join)(this.library, extOrFile);
        let relativeFile = (0, path_1.relative)(this.library, file).replace(/\\/g, '/');
        let index = this.meta.files.indexOf(relativeFile);
        const context = createOperationContext('copy', this.source, [target, file]);
        if (index === -1) {
            this.meta.files.push(relativeFile);
            this.meta.files.sort();
        }
        if (await (0, filesystem_1.fsExists)(file)) {
            await (0, filesystem_1.fsDelete)(file, { context, useTrash: false });
        }
        await (0, filesystem_1.fsCopy)(target, file, { context });
    }
    /**
     * 删除一个以 uuid 为名字的导入文件
     * @param extOrFile
     */
    async deleteFromLibrary(extOrFile) {
        if (isExtname(extOrFile)) {
            let file = `${this.library}${extOrFile}`;
            if (!await (0, filesystem_1.fsExists)(file)) {
                return false;
            }
            const context = createOperationContext('delete', this.source, [file]);
            let index = this.meta.files.indexOf(extOrFile);
            if (index !== -1) {
                this.meta.files.splice(index, 1);
            }
            await (0, filesystem_1.fsDelete)(file, { context, useTrash: false });
            return;
        }
        // 如果传入的不是扩展名，恭喜，新建一个 uuid 文件夹存放吧
        await (0, filesystem_1.fsCreateDirectory)(this.library);
        let file = (0, path_1.join)(this.library, extOrFile);
        const context = createOperationContext('delete', this.source, [file]);
        let relativeFile = (0, path_1.relative)(this.library, file).replace(/\\/g, '/');
        let index = this.meta.files.indexOf(relativeFile);
        if (index !== -1) {
            this.meta.files.splice(index, 1);
        }
        await (0, filesystem_1.fsDelete)(file, { context, useTrash: false });
    }
    /**
     * 判断一个以 uuid 为名字的文件是否存在
     * @param extOrFile
     */
    async existsInLibrary(extOrFile) {
        // 如果 meta 记录的文件内没有当前文件，则直接返回文件不存在
        if (this.meta.files.indexOf(extOrFile) === -1) {
            return false;
        }
        let file;
        if (isExtname(extOrFile)) {
            file = `${this.library}${extOrFile}`;
        }
        else {
            file = (0, path_1.join)(this.library, extOrFile);
        }
        return await (0, filesystem_1.fsExists)(file);
    }
    /**
     * 判断是否是文件夹
     */
    isDirectory() {
        return false;
    }
    /**
     * 创建一个虚拟的 asset，这个 asset 没有实体
     * 一个虚拟的 asset 也允许存储都个文件
     * @param name
     * @param importer 使用什么解析
     */
    async createSubAsset(name, importer, options = { displayName: '' }) {
        if (!name) {
            throw 'Failed to create subAsset: It must have a name';
        }
        let subAsset;
        let id = options.id || (0, utils_1.nameToId)(name);
        let i = 1;
        while (this.subAssets[id] && this.subAssets[id].meta.name !== name) {
            id = (0, utils_1.nameToId)(name, i++);
            if (i >= 26) {
                throw new Error(`Cannot create a new subAsset: ${name}\n  Please try to change your asset name`);
            }
        }
        if (this.subAssets[name]) {
            subAsset = this.subAssets[name];
        }
        else {
            importer = importer || '*';
            // 判断是否从回收池拿 meta 数据
            const subMeta = this.meta.subMetas[id];
            let meta = this.uuid2recycle[id];
            if (!meta || meta.importer !== importer) {
                meta = (0, meta_1.completionMeta)({
                    importer: importer,
                    uuid: `${this.uuid}@${id}`,
                    displayName: options.displayName || '',
                    id,
                    name,
                    userData: subMeta ? subMeta.userData || {} : {},
                });
            }
            else {
                // 如果是可用数据，要确保 uuid 是从父资源来的
                // 复制过来的 meta 有可能 uuid 和 displayName 是错的
                meta.uuid = `${this.uuid}@${id}`;
                meta.displayName = options.displayName || '';
                // 融合 meta 内给定的 userData 数据
                subMeta && subMeta.userData && Object.assign(meta.userData, subMeta.userData);
            }
            // 删除回收池内的数据
            delete this.uuid2recycle[id];
            subAsset = new VirtualAsset(meta, name, id, this._assetDB);
            subAsset._parent = this;
            this.meta.subMetas[id] = subAsset.meta;
            this.subAssets[id] = subAsset;
        }
        return this.subAssets[id];
    }
    /**
     * 注册依赖的文件
     * 记录的是依赖的文件的源路径
     * 在每次 asset 任务之后都需要检查依赖 asset 的资源并更新
     * 依赖的文件更新的时候，需要更新自身
     * @param fileOrUuid 当前资源依赖的文件的绝对路径，不能传入相对路径
     *   db://assets/test.json
     *   /Users/xx/project/assets/test.json
     *   db://assets/test.plist@c30fb
     */
    depend(fileOrUuidOrUrl) {
        if (!(0, manager_1.recursiveCheckAssociatedAssets)(fileOrUuidOrUrl, this)) {
            this._assetDB.console.warn(`There are recursive dependencies: ${fileOrUuidOrUrl} ${this.uuid}`);
            return;
        }
        if ((0, path_1.isAbsolute)(fileOrUuidOrUrl)) {
            this._assetDB.dependencyManager.add('path', this.source, fileOrUuidOrUrl);
        }
        else if (fileOrUuidOrUrl.startsWith('db://')) {
            this._assetDB.dependencyManager.add('url', this.source, fileOrUuidOrUrl);
        }
        else {
            this._assetDB.dependencyManager.add('uuid', this.source, fileOrUuidOrUrl);
        }
    }
    /**
     * 获取交换空间对象
     * 这个空间主要是提供给父子资源间数据相互依赖使用的临时数据空间
     * 并不会保证数据存在，需要使用方自己去判断数据正确性，如无数据，需要自己生成
     */
    getSwapSpace() {
        this._swapSpace = this._swapSpace || {};
        return this._swapSpace;
    }
}
exports.VirtualAsset = VirtualAsset;
/**
 * 存储到 asset db 内的 asset 实例
 * 创建的时候会读取对应的 .meta 文件
 * 如果 meta 不存在则会创建，并分配一个 uuid
 */
class Asset extends VirtualAsset {
    get source() {
        return this._source;
    }
    get url() {
        return this._url;
    }
    constructor(source, meta, assetDB) {
        let ext = (0, path_1.extname)(source);
        let base = (0, path_1.basename)(source, ext);
        super(meta, meta.name, meta.id, assetDB);
        this._source = source;
        this.extname = ext.toLowerCase();
        this.basename = base;
        this._url = '';
        this.updateUrl();
    }
    updateUrl() {
        this._url = `db://${this._assetDB.options.name}/${(0, path_1.relative)(this._assetDB.options.target, this.source).replace(/\\/g, '/')}`;
    }
    /**
     * 保存当前资源的 meta 信息
     */
    async save() {
        if (!await (0, filesystem_1.fsExists)(this.source) // 如果源文件被删除了，则不需要继续保存
        ) {
            return false;
        }
        const metaPath = this.source + '.meta';
        await this._assetDB.metaManager.write(metaPath, {
            context: createOperationContext('write', this.source, [metaPath]),
        });
        const metaStats = await (0, filesystem_1.fsStat)(metaPath);
        this._assetDB.infoManager.add(metaPath, metaStats.mtimeMs);
        return true;
    }
    /**
     * 判断是否是文件夹
     */
    isDirectory() {
        if (this._isDirectory !== undefined) {
            return this._isDirectory;
        }
        try {
            const stats = (0, fs_extra_1.statSync)(this.source);
            return this._isDirectory = stats.isDirectory();
        }
        catch (error) {
            return false;
        }
    }
}
exports.Asset = Asset;
