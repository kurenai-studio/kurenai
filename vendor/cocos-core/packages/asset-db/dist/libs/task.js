'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_MAP = exports.DestroyTask = exports.ImportTask = exports.Task = void 0;
const fs_extra_1 = require("fs-extra");
const asset_1 = require("./asset");
const utils_1 = require("./utils");
const default_meta_1 = require("./default-meta");
const manager_1 = require("./manager");
const TIMEOUT = 1000 * 60 * 8;
/**
 * 任务基础类型
 */
class Task {
    constructor() {
        // 事件列表
        this.event = {};
    }
    /*
     * 导入流程
     */
    // async exec() { }
    /**
     * 监听事件
     * @param name
     * @param func
     */
    on(name, func) {
        this.event[name] = func;
    }
    /**
     * 触发事件
     * @param name
     * @param args
     */
    emit(name, ...args) {
        if (this.event[name]) {
            this.event[name].call(this, ...args);
        }
    }
}
exports.Task = Task;
/**
 * 导入任务
 */
class ImportTask extends Task {
    /**
     * 实际的导入流程，允许传入实体资源以及虚拟资源
     * @param database
     * @param asset
     * @param importer
     * @param dirty
     */
    async exec(database, asset, importer, dirty) {
        const subAssetMap = new Map;
        for (let name in asset.subAssets) {
            subAssetMap.set(name, asset.subAssets[name]);
        }
        if (dirty) {
            if (asset.action === asset_1.AssetActionEnum.add) {
                database.emit('add', asset);
            }
            else if (asset.action === asset_1.AssetActionEnum.change) {
                database.emit('change', asset);
            }
        }
        try {
            if (asset instanceof asset_1.Asset) {
                dirty = await this.importAsset(database, asset, importer, dirty);
            }
            else {
                dirty = await this.importVirtualAsset(database, asset, importer, dirty);
            }
        }
        catch (error) {
            console.error(error);
            asset.importError = error;
        }
        // 导入子资源
        let subDirty = dirty;
        for (let name in asset.subAssets) {
            const subAsset = asset.subAssets[name];
            try {
                const importer = await database.importerManager.find(subAsset);
                if (!importer) {
                    throw new Error(`Unable to import data, no suitable importer was found.\n asset: {asset[${subAsset.source}](${subAsset.uuid})}`);
                }
                // 已导入完成的子资源才可以发 change 消息
                if (subAssetMap.has(name) && asset.action === asset_1.AssetActionEnum.change) {
                    subAsset.action = asset_1.AssetActionEnum.change;
                }
                else {
                    subAsset.action = asset_1.AssetActionEnum.add;
                }
                if (await this.exec(database, subAsset, importer, subDirty)) {
                    dirty = true;
                }
                subAsset.action = asset_1.AssetActionEnum.none;
            }
            catch (error) {
                dirty = true;
                subAsset.importError = error;
                if (database.options.level >= 1) {
                    console.error(`Importer exec failed: {asset[${subAsset.source}](${subAsset.uuid})}`);
                    console.error(error);
                }
            }
        }
        // 导入子资源后的钩子函数
        try {
            importer.afterSubAssetsImport && (await importer.afterSubAssetsImport(asset));
        }
        catch (error) {
            console.error(`Exec afterSubAssetsImport hook failed: {asset[${asset.source}](${asset.uuid})}`);
            console.error(error);
        }
        subAssetMap.forEach((subAsset, name) => {
            if (!asset.subAssets[name]) {
                database.emit('delete', subAsset);
                database.emit('deleted', subAsset);
            }
        });
        if (dirty) {
            if (asset.action === asset_1.AssetActionEnum.add) {
                database.emit('added', asset);
            }
            else if (asset.action === asset_1.AssetActionEnum.change) {
                database.emit('changed', asset);
            }
        }
        asset.action = asset_1.AssetActionEnum.none;
        return dirty;
    }
    /**
     * 导入实体资源的流程
     */
    async importAsset(database, asset, importer, dirty) {
        // 如果资源导入过，且文件没有修改，则跳过导入流程
        if (dirty
            || (importer.versionCode !== asset.versionCode && asset.invalid !== true)
            || (importer.version !== asset.meta.ver && asset.invalid !== true)
            || (asset.meta.imported === false && asset.invalid !== true)
            || await importer.force(asset)
            // dirty 标记走过 checkDirty 方法，其实检查过
            // 但他们是异步的，可能会一种情况，检查的时候还在，这里执行的时候就不见了
            // 这种情况可以暂时忽略处理，这里还没有进行处理，后续下面几行可以注释掉
            || (await Promise.all(asset.meta.files.map((ext) => asset.existsInLibrary(ext)))).some((exists) => !exists)) {
            if (asset.meta.importer !== importer.name) {
                asset.meta.ver = '0.0.0';
            }
            const versionContrast = (0, utils_1.compareVersion)(asset.meta.ver, importer.version);
            if (versionContrast === 1) {
                // meta 版本号大于导入器版本号的时候，如果 init 已经成功，则跳过导入流程
                if (asset.init) {
                    return false;
                }
                // 允许强制重新导入，但会报警告
                // asset.invalid = true;
                console.warn(`Importer exec warning: {asset[${asset.source}](${asset.uuid})}: The importer version is lower than asset`);
                // return false;
            }
            dirty = true;
            // 资源本体即将开始导入，更新标记数据
            await asset.reset();
            // 还是使用之前的导入器，尝试迁移
            if (importer.name === asset.meta.importer
                && asset.meta.ver !== '0.0.0'
                && versionContrast === -1) {
                try {
                    await this.migrateAsset(importer, database, asset);
                }
                catch (error) {
                    if (database.options.level >= 1) {
                        console.error(error);
                    }
                    asset.imported = false;
                    asset.invalid = true;
                    return dirty;
                }
            }
            if (database.options.level >= 4) {
                console.debug(`%cImport%c: ${asset.source}`, 'background: #aaff85; color: #000;', 'color: #000;');
            }
            // 实际导入流程
            try {
                // if (versionContrast !== 1) {
                asset.meta.ver = importer.version;
                asset.versionCode = importer.versionCode;
                // }
                // 资源从未使用当前导入器导入过
                asset.meta.userData = asset.meta.userData || {};
                (0, default_meta_1.fillUserData)(importer.name, asset.meta.userData);
                asset.meta.importer = importer.name;
                const result = await new Promise((resolve, reject) => {
                    // 超时控制
                    const timer = setTimeout(() => {
                        asset._assetDB.emit('unresponsive', asset, {
                            resolve,
                            reject,
                        });
                    }, TIMEOUT);
                    importer.import(asset).then((result) => {
                        clearTimeout(timer);
                        resolve(result);
                    }).catch((error) => {
                        clearTimeout(timer);
                        reject(error);
                    });
                });
                // 导入流程需要确保里面的文件存储正常执行
                if (result === false) {
                    asset.invalid = true;
                    asset.importError = new Error(`Import asset ${asset.url} failed!`);
                }
                else {
                    asset.invalid = false;
                    // 资源本体导入完成，更新标记数据
                    asset.imported = true;
                    asset.importError = null;
                }
                database.dataManager.update(asset);
            }
            catch (error) {
                if (database.options.level >= 1) {
                    console.error(`Importer exec failed: {asset[${asset.source}](${asset.uuid})}`);
                    console.error(error);
                }
                asset.invalid = true;
                asset.importError = error;
            }
        }
        return dirty;
    }
    /**
     * 导入虚拟资源的流程
     * @param database
     * @param asset
     * @param dirty 是否被修改
     */
    async importVirtualAsset(database, asset, importer, dirty) {
        // 如果资源导入过，且文件没有修改，则跳过导入流程
        if (dirty
            || importer.version !== asset.meta.ver
            || importer.versionCode !== asset.versionCode
            || (asset.meta.imported === false && asset.invalid !== true)
            || await importer.force(asset)
            // dirty 标记走过 checkDirty 方法，其实检查过
            // 但他们是异步的，可能会一种情况，检查的时候还在，这里执行的时候就不见了
            // 这种情况可以暂时忽略处理，这里还没有进行处理，后续下面几行可以注释掉
            || (await Promise.all(asset.meta.files.map((ext) => asset.existsInLibrary(ext)))).some((exists) => !exists)) {
            const versionContrast = (0, utils_1.compareVersion)(asset.meta.ver, importer.version);
            if (versionContrast === 1) {
                // if (asset.init) {
                //     return false;
                // }
                asset.invalid = true;
                console.warn(`Importer exec warning: {asset[${asset.source}](${asset.uuid})}: The importer version is lower than asset`);
                // return false;
            }
            dirty = true;
            // 虚拟资源只能发送导入和删除
            // database.emit('add', asset.uuid, asset);
            // 虚拟资源 / 子资源不需要也无法判断是否更改
            // 资源本体即将开始导入，更新标记数据
            await asset.reset();
            // 还是使用之前的导入器，尝试迁移
            if (importer.name === asset.meta.importer
                && asset.meta.ver !== '0.0.0'
                && versionContrast === -1) {
                try {
                    await this.migrateAsset(importer, database, asset);
                }
                catch (error) {
                    if (database.options.level >= 1) {
                        console.error(error);
                    }
                    asset.imported = false;
                    asset.invalid = true;
                    // database.emit('added', asset.uuid, asset);
                    // database.eventManager.add(asset);
                    return false;
                }
            }
            if (database.options.level >= 4) {
                if (asset.action === asset_1.AssetActionEnum.add) {
                    console.debug(`%cImport%c: ${asset.source}`, 'background: #aaff85; color: #000;', 'color: #000;');
                }
                else {
                    console.debug(`%cReImport%c: ${asset.source}`, 'background: #aaff85; color: #000;', 'color: #000;');
                }
            }
            // 实际导入流程
            try {
                // if (versionContrast !== 1) {
                asset.meta.ver = importer.version;
                asset.versionCode = importer.versionCode;
                // }
                // 资源从未使用当前导入器导入过
                asset.meta.userData = asset.meta.userData || {};
                (0, default_meta_1.fillUserData)(importer.name, asset.meta.userData);
                asset.meta.importer = importer.name;
                const result = await new Promise((resolve, reject) => {
                    async function onTimer() {
                        // 如果资源在导入过程中被标记为能被唤醒，则重新计时
                        if (importer.checkAwake && (await importer.checkAwake(asset)) === true) {
                            clearTimeout(timer);
                            timer = setTimeout(onTimer, TIMEOUT);
                            return;
                        }
                        asset._assetDB.emit('unresponsive', asset, {
                            resolve,
                            reject,
                        });
                    }
                    // 超时控制
                    let timer = setTimeout(onTimer, TIMEOUT);
                    importer.import(asset).then((result) => {
                        clearTimeout(timer);
                        resolve(result);
                    }).catch((error) => {
                        clearTimeout(timer);
                        reject(error);
                    });
                });
                // 导入流程需要确保里面的文件存储正常执行
                if (result === false) {
                    asset.invalid = true;
                }
                else {
                    asset.invalid = false;
                    // 资源本体导入完成，更新标记数据
                    asset.imported = true;
                }
                database.dataManager.update(asset);
            }
            catch (error) {
                if (database.options.level >= 1) {
                    console.error(`Importer exec failed: {asset[${asset.source}](${asset.uuid})}`);
                    console.error(error);
                }
                asset.invalid = true;
            }
            // 重新导入受影响的资源
            (0, manager_1.importAssociatedAssets)(database, asset);
            // database.emit('added', asset.uuid, asset);
            // database.eventManager.add(asset);
        }
        return dirty;
    }
    /**
     * 迁移资源
     * @param importer
     * @param database
     * @param asset
     */
    async migrateAsset(importer, database, asset) {
        let catchError = null;
        if (importer.migrationHook && importer.migrationHook.pre) {
            await importer.migrationHook.pre(asset);
        }
        let num = 0;
        let i = 0;
        for (i; i < importer.migrations.length; i++) {
            const task = importer.migrations[i];
            const index = (0, utils_1.compareVersion)(asset.meta.ver, task.version);
            if (index < 0) {
                try {
                    if (database.options.level >= 4) {
                        console.debug(`%cMigrate%c: ${asset.source}(${task.version})`, 'background: #fbe5b5; color: #000;', 'color: #000;');
                    }
                    task.migrate && await task.migrate(asset);
                    num++;
                    asset.meta.ver = task.version;
                }
                catch (error) {
                    if (database.options.level >= 1) {
                        console.error(`Migrate error:  {asset[${asset.source}](${asset.uuid})} - ${task.version}`);
                    }
                    catchError = error;
                    break;
                }
            }
        }
        if (importer.migrationHook && importer.migrationHook.post) {
            await importer.migrationHook.post(asset, num);
        }
        if (catchError) {
            throw catchError;
        }
    }
}
exports.ImportTask = ImportTask;
class DestroyTask extends Task {
    /**
     * 销毁一个资源
     * @param database
     * @param asset
     */
    async exec(database, asset) {
        if (asset.action === asset_1.AssetActionEnum.delete) {
            database.emit('delete', asset);
        }
        // 销毁子资源
        for (let name in asset.subAssets) {
            const subAsset = asset.subAssets[name];
            try {
                subAsset.action = asset_1.AssetActionEnum.delete;
                await this.exec(database, subAsset);
                subAsset.action = asset_1.AssetActionEnum.none;
            }
            catch (error) {
                if (database.options.level >= 1) {
                    console.error(`Destroy exec failed: {asset[${subAsset.source}](${subAsset.uuid})}`);
                    console.error(error);
                }
            }
        }
        let result = undefined;
        try {
            result = await this.destroyAsset(database, asset);
        }
        catch (error) {
            console.error(error);
        }
        if (asset.action === asset_1.AssetActionEnum.delete) {
            database.emit('deleted', asset);
        }
        return result;
    }
    async destroyAsset(database, asset) {
        if (database.options.level >= 4) {
            console.debug(`%cDestroy%c: ${asset.source}`, 'background: #ffb8b8; color: #000;', 'color: #000;');
        }
        // if (!(asset instanceof Asset)) {
        //     // 虚拟资源只能发送导入和删除
        //     database.emit('delete', asset.uuid, asset);
        // }
        await asset.reset();
        // 文件夹为空需要另同步检查
        // 异步接口会造成检查为空后中间又被插入新的文件
        const libraryDir = asset.library;
        if ((0, fs_extra_1.existsSync)(libraryDir)) {
            let files = (0, fs_extra_1.readdirSync)(libraryDir);
            if (files.length === 0) {
                (0, fs_extra_1.removeSync)(libraryDir);
            }
        }
    }
}
exports.DestroyTask = DestroyTask;
/**
 * 任务缓存
 */
exports.TASK_MAP = {
    import: new ImportTask(),
    destroy: new DestroyTask(),
};
