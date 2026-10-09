"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileStore = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
/**
 * Editor.Profile 的 CLI 实现：按 Cocos Creator 的磁盘约定读取扩展配置。
 * - project 作用域：<project>/settings/v2/packages/<name>.json
 * - editor/local 作用域：<project>/profiles/v2/packages/<name>.json
 *
 * 为避免预览过程意外写入用户项目，写操作仅落到内存 overlay（会话内一致），不落盘。
 */
class ProfileStore {
    _projectPath;
    _overlay = new Map();
    constructor(_projectPath) {
        this._projectPath = _projectPath;
    }
    _file(scope, name) {
        const sub = scope === 'project' ? 'settings' : 'profiles';
        return (0, path_1.join)(this._projectPath, sub, 'v2', 'packages', `${name}.json`);
    }
    _readFile(scope, name) {
        const file = this._file(scope, name);
        if (!(0, fs_1.existsSync)(file)) {
            return {};
        }
        try {
            return JSON.parse((0, fs_1.readFileSync)(file, 'utf8')) ?? {};
        }
        catch {
            return {};
        }
    }
    _get(scope, name, key) {
        const overlayKey = `${scope}:${name}`;
        const data = this._overlay.has(overlayKey) ? this._overlay.get(overlayKey) : this._readFile(scope, name);
        return key === undefined ? data : data?.[key];
    }
    _set(scope, name, key, value) {
        const overlayKey = `${scope}:${name}`;
        const data = this._overlay.has(overlayKey) ? this._overlay.get(overlayKey) : { ...this._readFile(scope, name) };
        if (key === undefined) {
            this._overlay.set(overlayKey, value);
        }
        else {
            data[key] = value;
            this._overlay.set(overlayKey, data);
        }
    }
    _remove(scope, name, key) {
        const overlayKey = `${scope}:${name}`;
        const data = this._overlay.has(overlayKey) ? this._overlay.get(overlayKey) : { ...this._readFile(scope, name) };
        if (key === undefined) {
            this._overlay.set(overlayKey, {});
        }
        else {
            delete data[key];
            this._overlay.set(overlayKey, data);
        }
    }
    getProject = async (name, key, _scope) => this._get('project', name, key);
    setProject = async (name, key, value, _scope) => this._set('project', name, key, value);
    removeProject = async (name, key, _scope) => this._remove('project', name, key);
    getConfig = async (name, key, _scope) => this._get('config', name, key);
    setConfig = async (name, key, value, _scope) => this._set('config', name, key, value);
    removeConfig = async (name, key, _scope) => this._remove('config', name, key);
}
exports.ProfileStore = ProfileStore;
