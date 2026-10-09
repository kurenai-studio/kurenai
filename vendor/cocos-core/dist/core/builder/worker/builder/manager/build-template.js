"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildTemplate = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const i18n_1 = __importDefault(require("../../../../base/i18n"));
const utils_1 = __importDefault(require("../../../../base/utils"));
const builder_config_1 = __importDefault(require("../../../share/builder-config"));
class BuildTemplate {
    _buildTemplateDirs = [];
    map = {};
    _versionUser = '';
    config;
    get isEnable() {
        return !!this._buildTemplateDirs.length;
    }
    constructor(platform, taskName, config) {
        this.config = config;
        const buildTemplateDir = builder_config_1.default.buildTemplateDir;
        // 初始化不同层级的构建模板地址，按照使用优先级从大到小排布
        const commonDir = (0, path_1.join)(buildTemplateDir, 'common');
        const platformDir = (0, path_1.join)(buildTemplateDir, this.config?.dirname || platform);
        const taskDir = (0, path_1.join)(buildTemplateDir, taskName);
        if ((0, fs_extra_1.existsSync)(taskDir)) {
            this._buildTemplateDirs.push(taskDir);
        }
        if ((0, fs_extra_1.existsSync)(platformDir)) {
            this._buildTemplateDirs.push(platformDir);
        }
        if ((0, fs_extra_1.existsSync)(commonDir)) {
            this._buildTemplateDirs.push(commonDir);
        }
        const internalTemplate = {
            application: 'application.ejs',
        };
        Object.keys(internalTemplate).forEach((name) => {
            this.initUrl(internalTemplate[name], name);
        });
        // 初始化缓存版本号
        this._initVersion(platform);
    }
    query(name) {
        return this.map[name]?.path;
    }
    async _initVersion(platform) {
        if (!this.config) {
            return;
        }
        try {
            // 默认构建模板需要有版本号
            const templateVersionJson = (0, path_1.join)(builder_config_1.default.buildTemplateDir, 'templates-version.json');
            // 用户模板版本号
            if ((0, fs_extra_1.existsSync)(templateVersionJson)) {
                this._versionUser = (await (0, fs_extra_1.readJSON)(templateVersionJson))[platform];
            }
            this._versionUser = this._versionUser || '1.0.0';
            // 用户构建模板版本小于默认构建模板版本，警告建议更新
            if (utils_1.default.Parse.compareVersion(this.config.version, this._versionUser) > 0) {
                console.warn(i18n_1.default.t('builder.tips.template_version_warning', {
                    version: this._versionUser,
                    internalConfig: this.config.version,
                    platform,
                }));
            }
        }
        catch (error) {
            console.debug(error);
        }
    }
    findFile(relativeUrl) {
        for (let i = 0; i < this._buildTemplateDirs.length; i++) {
            const dir = this._buildTemplateDirs[i];
            const path = (0, path_1.join)(dir, relativeUrl);
            if ((0, fs_extra_1.existsSync)(path)) {
                return path;
            }
        }
        return '';
    }
    initUrl(relativeUrl, name) {
        const path = this.findFile(relativeUrl);
        name = name || (0, path_1.basename)(relativeUrl);
        if (path) {
            this.map[name] = {
                path,
                url: relativeUrl,
            };
            return path;
        }
    }
    async copyTo(dest) {
        // 按照优先级拷贝构建模板
        for (let index = (this._buildTemplateDirs.length - 1); index >= 0; index--) {
            const dir = this._buildTemplateDirs[index];
            await (0, fs_extra_1.copy)(dir, dest);
        }
        // 移除已经被处理的一些特殊的文件夹
        await Promise.all(Object.values(this.map).map((info) => {
            return (0, fs_extra_1.remove)((0, path_1.join)(dest, info.url));
        }));
    }
}
exports.BuildTemplate = BuildTemplate;
