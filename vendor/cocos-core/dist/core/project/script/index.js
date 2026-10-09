"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.project = exports.Project = void 0;
const node_uuid_1 = require("node-uuid");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
const settings_template_1 = require("./settings-template");
const global_1 = require("../../../global");
class Project {
    /**
     * The version of the Project
     */
    static version = '4.0.0';
    _projectPath = '';
    _type = '3d';
    _pkgPath;
    _tmpDir;
    _libraryDir;
    _info = {
        name: 'unknow',
        type: '3d',
        version: 'unknow',
        uuid: 'unknow',
        creator: {
            version: 'unknow',
        }
    };
    get path() {
        return this._projectPath;
    }
    get type() {
        return this._type;
    }
    static getPackageJsonPath(projectPath) {
        return (0, path_1.join)(projectPath, 'package.json');
    }
    get pkgPath() {
        if (!this._pkgPath) {
            this._pkgPath = Project.getPackageJsonPath(this._projectPath);
        }
        return this._pkgPath;
    }
    get tmpDir() {
        if (!this._tmpDir) {
            this._tmpDir = (0, path_1.join)(this._projectPath, 'temp');
        }
        return this._tmpDir;
    }
    get libraryDir() {
        if (!this._libraryDir) {
            this._libraryDir = (0, path_1.join)(this._projectPath, 'library');
        }
        return this._libraryDir;
    }
    static async create(projectPath, type = '3d') {
        try {
            const packageJSONPath = Project.getPackageJsonPath(projectPath);
            if ((0, fs_extra_1.existsSync)(projectPath) || (0, fs_extra_1.existsSync)(packageJSONPath)) {
                throw new Error('Failed to create project, project exist');
            }
            await (0, fs_extra_1.mkdir)(projectPath, { recursive: true });
            const requiredDirs = [
                (0, path_1.join)(projectPath, 'temp'),
                (0, path_1.join)(projectPath, 'library'),
                (0, path_1.join)(projectPath, 'settings', 'v2', 'packages')
            ].map(dir => !(0, fs_extra_1.existsSync)(dir) ? (0, fs_extra_1.mkdir)(dir, { recursive: true }) : Promise.resolve());
            await Promise.all(requiredDirs);
            await (0, utils_1.safeOutputJSON)(packageJSONPath, Project.generateProjectInfo(projectPath, type));
            // 写入默认的 settings
            const settingsDir = (0, path_1.join)(projectPath, 'settings', 'v2', 'packages');
            await (0, utils_1.safeOutputJSON)((0, path_1.join)(settingsDir, 'engine.json'), (0, settings_template_1.createDefaultEngineSettings)(global_1.GlobalPaths.enginePath));
            await (0, utils_1.safeOutputJSON)((0, path_1.join)(settingsDir, 'project.json'), settings_template_1.defaultProjectSettings);
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    getInfo(key) {
        if (typeof key !== 'string') {
            return this._info;
        }
        const keys = key.split('.');
        let current = this._info;
        for (const k of keys) {
            if (current === undefined || current === null) {
                return null;
            }
            current = current[k];
        }
        return current;
    }
    async updateInfo(keyOrValue, value) {
        try {
            if (typeof keyOrValue === 'string') {
                const keys = keyOrValue.split('.');
                let current = this._info;
                for (let i = 0; i < keys.length - 1; i++) {
                    const k = keys[i];
                    if (current[k] === undefined || current[k] === null) {
                        current[k] = {};
                    }
                    else if (typeof current[k] !== 'object' || current[k] === null) {
                        throw new Error(`Cannot set property on non-object at path: ${keys.slice(0, i + 1).join('.')}`);
                    }
                    current = current[k];
                }
                const finalKey = keys[keys.length - 1];
                current[finalKey] = value;
            }
            else {
                this._info = { ...this._info, ...keyOrValue };
            }
            await (0, utils_1.safeOutputJSON)(this.pkgPath, this._info);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async open(projectPath) {
        this._projectPath = projectPath;
        if (!(0, fs_extra_1.existsSync)(projectPath) || !(0, fs_extra_1.existsSync)(this.pkgPath)) {
            throw new Error(`Failed to open project ${projectPath} : package.json not found.`);
        }
        else {
            const info = await (0, fs_extra_1.readJSON)(this.pkgPath);
            if (!this.isValid(info)) {
                throw new Error(`Failed to open project ${projectPath}: package.json data error.`);
            }
            await this.updateInfo(info);
        }
        return true;
    }
    async close() {
        return await (0, utils_1.safeOutputJSON)(this.pkgPath, this.getInfo());
    }
    /**
     * Generates project information object
     *
     * @param {string} projectPath - The project directory path
     * @param {ProjectType} type - The project type (2d or 3d)
     * @returns {ProjectInfo} Generated project information
     */
    static generateProjectInfo(projectPath, type) {
        return {
            name: (0, path_1.basename)(projectPath),
            type: type,
            version: Project.version,
            uuid: (0, node_uuid_1.v4)(),
            creator: {
                version: Project.version,
                dependencies: {}
            }
        };
    }
    /**
     * Validates if the project information is valid
     *
     * @param {ProjectInfo} info - The project information to validate
     * @returns {boolean} Returns true if the project info is valid, false otherwise
     */
    isValid(info) {
        return typeof info.type !== 'undefined' ||
            typeof info.version !== 'undefined' ||
            typeof info.creator !== 'undefined';
    }
}
exports.Project = Project;
exports.project = new Project();
