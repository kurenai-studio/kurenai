'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaManager = exports.completionMeta = exports.copyMeta = void 0;
const fs_extra_1 = require("fs-extra");
const node_uuid_1 = require("node-uuid");
const filesystem_1 = require("./filesystem");
const path_identity_1 = require("./path-identity");
/**
 * 复制一个 json 数据
 * @param json
 */
function generateJSON(json) {
    return JSON.parse(JSON.stringify(json));
}
function serializeJSON(json, EOL) {
    let content = JSON.stringify(json, null, 2);
    if (EOL !== '\n') {
        content = content.replace(/\n/g, EOL);
    }
    return `${content}${EOL}`;
}
/**
 * 复制 meta 数据，将 origin 上的数据复制到 target 上
 * @param target
 * @param origin
 */
function copyMeta(target, origin) {
    target.ver = origin.ver || target.ver || '0.0.0';
    target.importer = origin.importer || '*';
    target.imported = origin.imported || false;
    target.uuid = origin.uuid || (0, node_uuid_1.v4)();
    target.files = origin.files || [];
    target.subMetas = target.subMetas || {};
    origin.subMetas && Object.keys(origin.subMetas).forEach((id) => {
        const child = generateJSON(origin.subMetas[id]);
        if (!target.subMetas[id]) {
            target.subMetas[id] = child;
        }
        else {
            copyMeta(target.subMetas[id], child);
        }
    });
    target.userData = generateJSON(origin.userData || {});
    target.displayName = origin.displayName || '';
    target.id = origin.id || '';
    target.name = origin.name || '';
}
exports.copyMeta = copyMeta;
/**
 * 补全 meta 数据
 * @param meta
 */
function completionMeta(meta) {
    if (typeof meta.ver !== 'string') {
        meta.ver = '0.0.0';
    }
    else {
        meta.ver = meta.ver;
    }
    if (typeof meta.importer !== 'string') {
        meta.importer = '*';
    }
    else {
        meta.importer = meta.importer;
    }
    if (typeof meta.imported !== 'boolean') {
        meta.imported = false;
    }
    else {
        meta.imported = meta.imported;
    }
    if (typeof meta.uuid !== 'string' || meta.uuid.length < 36) {
        meta.uuid = (0, node_uuid_1.v4)();
    }
    else {
        meta.uuid = meta.uuid;
    }
    if (!Array.isArray(meta.files)) {
        meta.files = [];
    }
    if (typeof meta.subMetas !== 'object') {
        meta.subMetas = Object.create(null);
    }
    else {
        Object.keys(meta.subMetas).forEach((id) => {
            completionMeta(meta.subMetas[id]);
        });
    }
    if (typeof meta.userData !== 'object') {
        meta.userData = Object.create(null);
    }
    else {
        meta.userData = meta.userData;
    }
    if (typeof meta.displayName !== 'string') {
        meta.displayName = '';
    }
    else {
        meta.displayName = meta.displayName;
    }
    if (typeof meta.id !== 'string') {
        meta.id = '';
    }
    else {
        meta.id = meta.id;
    }
    if (typeof meta.name !== 'string') {
        meta.name = '';
    }
    else {
        meta.name = meta.name;
    }
    return meta;
}
exports.completionMeta = completionMeta;
class MetaManager {
    constructor(customConsole) {
        // 资源与 meta 的映射列表
        this.path2meta = (0, path_identity_1.createPathRecord)();
        this.console = customConsole || console;
    }
    /**
     * 销毁一个管理器实例
     * @param manager
     */
    destroy() {
        this.path2meta = (0, path_identity_1.createPathRecord)();
    }
    /**
     * 从硬盘读取更新一个 meta 文件数据到内存里
     * @param path
     */
    read(path) {
        let metaInfo;
        let string;
        try {
            string = (0, fs_extra_1.readFileSync)(path, 'utf8');
        }
        catch (error) {
            this.console.debug(`read meta file failed: ${path}`);
            return false;
        }
        try {
            if (this.path2meta[path]) {
                metaInfo = this.path2meta[path];
            }
            else {
                // 这里的 json 后续会填充
                metaInfo = this.path2meta[path] = { json: {}, backup: '', EOL: '\n' };
            }
            const json = JSON.parse(string);
            // 备份原始数据，需要重新序列化，去掉部分换行
            metaInfo.backup = JSON.stringify(json);
            // 如果更新的 meta 上的 uuid 变化，则需要发送资源变化的消息
            // 不需要处理
            // if (metaInfo.json.uuid && metaInfo.json.uuid !== json.uuid) {
            // }
            copyMeta(metaInfo.json, json);
            metaInfo.EOL = string ? (/\r\n/.test(string) ? '\r\n' : '\n') : '\n';
            // 如果备份存在，读取后就需要删除了
            // if (this.path2backup[path]) {
            //     delete this.path2backup[path];
            //     this.save();
            // }
            return true;
        }
        catch (error) {
            this.console.warn(`Read meta in ${path} failed!`);
            this.console.warn(error);
        }
        if (this.path2meta[path]) {
            completionMeta(this.path2meta[path].json);
        }
    }
    async write(path, options) {
        const item = this.path2meta[path];
        if (!item) {
            return false;
        }
        // @ts-ignore
        delete item.json.displayName;
        // @ts-ignore
        delete item.json.id;
        // @ts-ignore
        delete item.json.name;
        const str = JSON.stringify(item.json);
        if (str === item.backup && await (0, filesystem_1.fsExists)(path)) {
            return;
        }
        await (0, filesystem_1.fsWriteFile)(path, serializeJSON(this.path2meta[path].json, this.path2meta[path].EOL), options);
        item.backup = str;
    }
    /**
     * 删除内存中的一个 MetaInfo 数据
     * 并放入 backup 文件夹
     * @param path
     */
    async remove(path, options) {
        delete this.path2meta[path];
        try {
            await (0, filesystem_1.fsDelete)(path, options);
        }
        catch (error) {
            console.debug(path);
        }
    }
    /**
     * 从缓存里取一个 MetaInfo
     * 如果不存在，则取备份数据
     * 如果还不存在，则生成新的空 MetaInfo 和 meta 文件
     * @param path
     */
    async get(path) {
        // 如果数据在内存， 直接返回
        if (this.path2meta[path]) {
            return this.path2meta[path];
        }
        // 如果文件存在，则更新到内存里
        if ((0, fs_extra_1.existsSync)(path)) {
            this.read(path);
            if (this.path2meta[path]) {
                return this.path2meta[path];
            }
        }
        // 如果都不存在，查询备份路径是否存在文件
        // if (this.path2backup[path]) {
        //     const backupFile = this.path2backup[path];
        //     delete this.path2backup[path];
        //     this.save();
        //     try {
        //         moveSync(backupFile, path);
        //         this.read(path);
        //         if (this.path2meta[path]) {
        //             return this.path2meta[path];
        //         }
        //     } catch (error) {
        //         console.warn(error);
        //     }
        // }
        const json = completionMeta({});
        this.path2meta[path] = {
            json,
            backup: JSON.stringify(json),
            EOL: '\n',
        };
        await this.write(path);
        return this.path2meta[path];
    }
    move(pathA, pathB) {
        if ((0, path_identity_1.isSamePath)(pathA, pathB)) {
            (0, path_identity_1.replacePathRecordKey)(this.path2meta, pathA, pathB);
            return;
        }
        if (this.path2meta[pathB]) {
            const json = this.path2meta[pathB].json;
            this.path2meta[pathB].json = this.path2meta[pathA].json;
            copyMeta(this.path2meta[pathA].json, json);
        }
        else {
            this.path2meta[pathB] = this.path2meta[pathA];
        }
        delete this.path2meta[pathA];
    }
    updatePathCase(previousPath, nextPath) {
        (0, path_identity_1.replacePathRecordKey)(this.path2meta, previousPath, nextPath);
    }
}
exports.MetaManager = MetaManager;
