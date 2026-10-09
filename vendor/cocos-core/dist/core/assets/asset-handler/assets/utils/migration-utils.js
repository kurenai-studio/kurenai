"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationHook = exports.Archive = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const filesystem_1 = require("../../../manager/filesystem");
const archiveProxyWatchedTag = Symbol('ArchiveProxyWatched');
class Archive {
    constructor(data = null) {
        deIndex(data, data);
        this._originalData = data;
        this._root = Array.isArray(data) ? data[0] : data;
        const proxyHandler = {
            get(target, property, receiver) {
                if (property === archiveProxyWatchedTag) {
                    return target;
                }
                const value = Reflect.get(target, property, receiver);
                if (value === null || value === undefined || typeof value !== 'object') {
                    return value;
                }
                const v = value[refTag] !== undefined ? value[refTag] : value;
                return new Proxy(v, proxyHandler);
            },
            set(target, property, value, receiver) {
                const realValue = typeof value === 'object' && value ? value[archiveProxyWatchedTag] ?? value : value;
                const v = !Array.isArray(value) && typeof value === 'object' && value ? { [refTag]: realValue } : realValue;
                return Reflect.set(target, property, v, receiver);
            },
        };
        this._proxyHandler = proxyHandler;
    }
    get root() {
        return new Proxy(this._root, this._proxyHandler);
    }
    get(value) {
        const object = typeof value === 'object' && value ? value[archiveProxyWatchedTag] ?? value : this._root;
        const objects = [object];
        reIndex(object, objects);
        return objects.length === 1 ? objects[0] : objects;
    }
    addObject() {
        return new Proxy({}, this._proxyHandler);
    }
    addTypedObject(typeName) {
        return new Proxy({ __type__: typeName }, this._proxyHandler);
    }
    visitTypedObject(className, visitor) {
        const visited = new Set();
        this._visitTypedObject(className, visitor, this._root, visited);
    }
    clearObject(object) {
        const keys = Object.keys(object);
        for (const key of keys) {
            switch (key) {
                case '__type__':
                    break;
                default:
                    delete object[key];
                    break;
            }
        }
    }
    _root;
    _originalData;
    _proxyHandler;
    _visitTypedObject(className, visitor, object, visited) {
        if (Array.isArray(object)) {
            object.forEach((child) => {
                this._visitTypedObject(className, visitor, child, visited);
            });
        }
        else if (object && typeof object === 'object') {
            if (object[refTag]) {
                this._visitTypedObject(className, visitor, object[refTag], visited);
            }
            else if (!visited.has(object)) {
                visited.add(object);
                const type = object.__type__;
                if (type === className) {
                    visitor(new Proxy(object, this._proxyHandler));
                }
                for (const value of Object.values(object)) {
                    this._visitTypedObject(className, visitor, value, visited);
                }
            }
        }
    }
}
exports.Archive = Archive;
const refTag = Symbol('Ref');
function deIndex(value, file) {
    if (Array.isArray(value)) {
        value.forEach((element) => {
            deIndex(element, file);
        });
    }
    else if (value && typeof value === 'object') {
        const ref = value;
        if (typeof ref.__id__ === 'number') {
            const id = ref.__id__;
            ref[refTag] = file[id];
        }
        else {
            Object.values(value).forEach((propertyValue) => deIndex(propertyValue, file));
        }
    }
}
function reIndex(value, objects) {
    if (Array.isArray(value)) {
        value.forEach((element) => {
            reIndex(element, objects);
        });
    }
    else if (value && typeof value === 'object') {
        const ref = value;
        const object = ref[refTag];
        if (object) {
            const id = objects.indexOf(object);
            if (id >= 0) {
                ref.__id__ = id;
            }
            else {
                ref.__id__ = objects.length;
                objects.push(object);
                reIndex(object, objects);
            }
        }
        else {
            Object.values(value).forEach((propertyValue) => reIndex(propertyValue, objects));
        }
    }
}
/**
 * version: 这个版本之前的 scene Handler 都会进行迁移
 * migrate: 在导入前执行的迁移的动作
 */
exports.migrationHook = {
    async pre(asset) {
        const swap = asset.getSwapSpace();
        swap.json = await fs_extra_1.default.readJSON(asset.source);
    },
    async post(asset, num) {
        const swap = asset.getSwapSpace();
        if (num > 0) {
            // 请勿使用 writeJson，因为这个接口会在末尾增加空行
            const json = JSON.stringify(swap.json, null, 2);
            await (0, filesystem_1.writePath)(asset.source, json);
        }
        delete swap.json;
    },
};
