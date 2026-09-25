'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataManager = void 0;
const fs_extra_1 = require("fs-extra");
/**
 * 资源关联以及依赖关系列表
 * 部分数据需要固化到硬盘上
 */
class DataManager {
    constructor(customConsole) {
        // 依赖列表，一个对象依赖的所有对象的名字数组
        this.dataMap = {};
        // 保存使用的 timer
        this._saveTimer = null;
        this.console = customConsole || console;
    }
    /**
     * 设置用于记录的 json 文件
     * @param json
     */
    async setRecordJSON(json) {
        this.file = json;
        if ((0, fs_extra_1.existsSync)(json)) {
            try {
                this.dataMap = (0, fs_extra_1.readJSONSync)(this.file);
            }
            catch (error) {
                this.console.error(error);
                this.dataMap = {};
            }
        }
        else {
            this.dataMap = {};
        }
    }
    /*
     * 延迟保存依赖文件
     */
    save() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            this.saveImmediate();
        }, 400);
    }
    /*
     * 立即保存依赖文件
     */
    saveImmediate() {
        clearTimeout(this._saveTimer);
        this.file && (0, fs_extra_1.outputJSONSync)(this.file, this.dataMap, { spaces: 2 });
    }
    /**
     * 检查资源是否有初始化过 data 数据
     * @param asset
     * @returns
     */
    has(asset) {
        return !!this.dataMap[asset.uuid];
    }
    /**
     *
     * @param asset
     */
    empty(asset) {
        this.dataMap[asset.uuid] = {
            url: asset.url,
            value: {},
            versionCode: asset.versionCode,
        };
        this.save();
    }
    /**
     * 根据 asset 信息更新数据
     * @param asset
     */
    update(asset) {
        if (!this.dataMap[asset.uuid]) {
            this.dataMap[asset.uuid] = {
                url: asset.url,
                value: {},
                versionCode: asset.versionCode,
            };
        }
        this.dataMap[asset.uuid].url = asset.url;
        this.dataMap[asset.uuid].versionCode = asset.versionCode;
    }
    /**
     * 设置 value 内存储数据
     * @param asset
     */
    setValue(asset, key, value) {
        this.update(asset);
        this.dataMap[asset.uuid].value[key] = value;
        this.save();
    }
    /**
     * 获取 value 内存储的某个数据
     * @param asset
     */
    getValue(asset, key) {
        return this.dataMap[asset.uuid].value[key];
    }
    /**
     * 获取一个 data 信息
     * @param uuid
     * @param source
     * @returns
     */
    get(asset, key = 'value') {
        if (!this.dataMap[asset.uuid]) {
            return null;
        }
        return this.dataMap[asset.uuid][key];
    }
}
exports.DataManager = DataManager;
