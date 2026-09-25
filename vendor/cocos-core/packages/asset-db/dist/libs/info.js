'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoManager = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const migrator_1 = require("./migrator");
const path_identity_1 = require("./path-identity");
const migrations = [{
        version: '1.0.0',
        migrate: async (json, manager) => {
            const recordInfo = {
                version: InfoManager.version,
                map: {},
                missing: {},
            };
            // 旧版本数据需要做一次整理，将 missing 数据整理出来
            Object.keys(json).forEach((path) => {
                const info = json[path];
                if (info.missing) {
                    delete info.missing;
                    info.uuid && (recordInfo.missing[info.uuid] = {
                        path,
                        time: info.time,
                        removeTime: Date.now(),
                    });
                }
                else {
                    delete info.missing;
                    recordInfo.map[path] = info;
                }
            });
            return recordInfo;
        },
    }, {
        version: '1.0.1',
        migrate: async (json, manager) => {
            const recordInfo = {
                version: InfoManager.version,
                map: {},
                missing: {},
            };
            Object.keys(json).forEach((path) => {
                const info = json[path];
                const relativePath = (0, path_1.relative)(manager.pathRoot, path);
                if (relativePath.startsWith('..')) {
                    // 不在目标目录下，移除作为 Missing 文件
                    recordInfo.missing[path] = info;
                }
                else {
                    recordInfo[relativePath] = info;
                }
            });
            return recordInfo;
        },
    }];
function getDefaultRecordInfo() {
    return {
        version: InfoManager.version,
        map: (0, path_identity_1.createPathRecord)(),
        missing: {},
    };
}
/**
 * 缓存所有文件的 mtimeMs 时间，用于比对是否修改
 * 这部分数据需要落地到文件系统
 */
class InfoManager {
    constructor(customConsole, pathRoot) {
        this.cacheConflict = null;
        // 保存使用的 timer
        this._saveTimer = null;
        this.console = customConsole || console;
        this.pathRoot = pathRoot;
        this.recordInfo = getDefaultRecordInfo();
    }
    /**
     * 设置记录数据的 json 文件
     * @param path
     */
    async setRecordJSON(path) {
        this.file = path;
        this.cacheConflict = null;
        try {
            await this._restoreCache(path);
        }
        catch (error) {
            if (error instanceof path_identity_1.PathCaseConflictError) {
                this.recordInfo = getDefaultRecordInfo();
                this.cacheConflict = error;
            }
            this.console.warn(error);
        }
    }
    async _restoreCache(path) {
        const recordInfo = getDefaultRecordInfo();
        const storeRecordInfo = await this._readRecordInfo(path);
        if (!storeRecordInfo) {
            return;
        }
        const restoredPaths = Object.keys(storeRecordInfo.map).map((path) => (0, path_1.join)(this.pathRoot, path));
        (0, path_identity_1.assertNoPathIdentityConflicts)(restoredPaths);
        Object.keys(storeRecordInfo.map).forEach((path, index) => {
            recordInfo.map[restoredPaths[index]] = storeRecordInfo.map[path];
        });
        // missing 数据只记录绝对路径
        recordInfo.missing = storeRecordInfo.missing;
        this.recordInfo = recordInfo;
    }
    async _readRecordInfo(path) {
        // 兼容 1.0.0 版本的记录文件
        const oldPath = path.replace('.json', '1.0.0.json');
        const migrator = new migrator_1.Migrator(migrations, InfoManager.version, {
            onError: (error, stage, data, ...args) => {
                this.console.warn(`migrate error in infoManager: ${error}`);
                this.console.warn(error);
            }
        });
        if ((0, fs_extra_1.existsSync)(oldPath)) {
            try {
                const recordInfo = (0, fs_extra_1.readJSONSync)(oldPath);
                await (0, fs_extra_1.remove)(oldPath);
                return await migrator.run(recordInfo, '1.0.0', [this]);
            }
            catch (error) {
                this.console.warn(error);
            }
            return;
        }
        if ((0, fs_extra_1.existsSync)(path)) {
            try {
                const recordInfo = (0, fs_extra_1.readJSONSync)(path);
                return await migrator.run(recordInfo, InfoManager.version, [this]);
            }
            catch (error) {
                this.console.warn(error);
            }
        }
    }
    /**
     * 销毁一个管理器实例
     * @param manager
     */
    destroy() {
        this.recordInfo = getDefaultRecordInfo();
    }
    /*
     * 延迟保存依赖文件
     */
    save() {
        this._saveTimer && clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            this.saveImmediate();
        }, 400);
    }
    /*
     * 立即保存记录文件
     */
    saveImmediate() {
        this._saveTimer && clearTimeout(this._saveTimer);
        if (this.file) {
            // 保存记录之前需要将绝对路径转换为相对路径
            const recordInfo = getDefaultRecordInfo();
            Object.keys(this.recordInfo.map).forEach((path) => {
                recordInfo.map[(0, path_1.relative)(this.pathRoot, path)] = this.recordInfo.map[path];
            });
            (0, fs_extra_1.outputJSONSync)(this.file, recordInfo, { spaces: 2 });
        }
    }
    /**
     * 更新一个缓存数据
     * @param path
     * @param mtimeMs
     * @param uuid
     */
    add(path, mtimeMs, uuid) {
        if (this.recordInfo.map[path]
            && this.recordInfo.map[path].uuid === uuid
            && this.recordInfo.map[path].time === mtimeMs) {
            return;
        }
        if (uuid) {
            this.recordInfo.map[path] = {
                time: mtimeMs,
                uuid: uuid,
            };
        }
        else {
            this.recordInfo.map[path] = {
                time: mtimeMs,
            };
        }
        this.save();
    }
    /**
     * 删除缓存的一个 mtime 数据
     * @param path
     */
    remove(path) {
        if (!this.recordInfo.map[path]) {
            return;
        }
        const info = this.recordInfo.map[path];
        this.addMissing(path, info);
        delete this.recordInfo.map[path];
        this.save();
    }
    /**
     * 获取缓存的 stats 对象
     * @param path
     */
    get(path) {
        return this.recordInfo.map[path] || null;
    }
    /**
     * 添加一个丢失的资源信息
     * @param path
     * @param info
     */
    addMissing(path, info) {
        info.uuid && (this.recordInfo.missing[info.uuid] = {
            path,
            time: info.time,
            removeTime: Date.now(),
        });
    }
    /**
     * 根据 uuid 获取丢失的资源信息
     * @param uuid
     * @returns
     */
    getMissingInfo(uuid) {
        return this.recordInfo.missing[uuid] || null;
    }
    updatePathCase(previousPath, nextPath) {
        let changed = (0, path_identity_1.replacePathRecordKey)(this.recordInfo.map, previousPath, nextPath);
        Object.keys(this.recordInfo.missing).forEach((uuid) => {
            const info = this.recordInfo.missing[uuid];
            if ((0, path_identity_1.isSamePath)(info.path, previousPath) && info.path !== nextPath) {
                info.path = nextPath;
                changed = true;
            }
        });
        if (changed) {
            this.save();
        }
    }
    /**
     * 对比现在文件和内存里缓存的 stats 是否有修改
     * 返回是否相等
     * @param path
     * @param stats
     */
    compare(path, mtimeMs) {
        // 如果缓存不存在，则认为修改了
        const target = this.recordInfo.map[path];
        if (!target) {
            return false;
        }
        // 如果 ms 记录相等，则认为没有修改
        if (target.time === mtimeMs) {
            return true;
        }
        return false;
    }
    async forEach(handler) {
        for (const path in this.recordInfo.map) {
            await handler(path, this.recordInfo.map[path]);
        }
    }
    ;
}
exports.InfoManager = InfoManager;
InfoManager.version = '1.0.1';
