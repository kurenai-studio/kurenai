"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocosConfigLoader = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const types_1 = require("./types");
const console_1 = require("../../base/console");
/**
 * CocosCreator 旧配置加载器
 */
class CocosConfigLoader {
    initialized = false;
    projectPath = '';
    configMap = new Map();
    initialize(projectPath) {
        if (this.initialized)
            return;
        this.projectPath = projectPath;
        this.initialized = true;
    }
    /**
     * 根据 scope 获取路径
     * @param pkgName
     * @param scope
     * @private
     */
    getPathByScope(pkgName, scope) {
        let dir = '';
        if (scope === 'project') {
            dir = path_1.default.join(this.projectPath, 'settings');
        }
        else if (scope === 'local') {
            dir = path_1.default.join(this.projectPath, 'profiles');
        }
        else {
            dir = path_1.default.join(os_1.default.homedir(), '.CocosCreator', 'profiles');
        }
        return path_1.default.join(dir, types_1.COCOS_CREATOR_VERSION, 'packages', pkgName + '.json');
    }
    /**
     * 加载配置
     * @param scope 配置范围
     * @param pkgName 包名
     * @returns 配置对象
     */
    async loadConfig(scope, pkgName) {
        const configs = this.configMap.get(scope);
        if (configs && configs[pkgName]) {
            return configs[pkgName];
        }
        const pkgPath = this.getPathByScope(pkgName, scope);
        if (await fs_extra_1.default.pathExists(pkgPath)) {
            try {
                const pkg = await fs_extra_1.default.readJSON(pkgPath);
                const configs = this.configMap.get(scope) || {};
                configs[pkgName] = pkg;
                this.configMap.set(scope, configs);
                return pkg;
            }
            catch (error) {
                console_1.newConsole.warn(`[Migration] 加载 ${scope} 配置失败: ${pkgPath} - ${error}`);
            }
        }
        return null;
    }
}
exports.CocosConfigLoader = CocosConfigLoader;
