"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConfiguration = void 0;
const utils = __importStar(require("./utils"));
const interface_1 = require("./interface");
const events_1 = require("events");
/**
 * 抽象配置类实现
 */
class BaseConfiguration extends events_1.EventEmitter {
    moduleName;
    defaultConfigs;
    configs = {};
    localConfigs = {};
    constructor(moduleName, defaultConfigs = {}) {
        super();
        this.moduleName = moduleName;
        this.defaultConfigs = defaultConfigs;
    }
    getDefaultConfig() {
        return this.defaultConfigs;
    }
    mergeDefaultConfig(defaultConfig) {
        if (!defaultConfig) {
            return;
        }
        this.defaultConfigs = utils.deepMerge(utils.deepMerge({}, this.defaultConfigs), defaultConfig);
    }
    getAll(scope = 'project') {
        if (scope === 'default') {
            return this.getDefaultConfig();
        }
        if (scope === 'local') {
            return this.localConfigs;
        }
        return this.configs;
    }
    async get(key, scope) {
        if (key === undefined) {
            // 不带 key 的合并读：default ← project ← local（后者覆盖前者）
            if (scope === 'default') {
                return this.getDefaultConfig();
            }
            if (scope === 'project') {
                return this.configs;
            }
            if (scope === 'local') {
                return this.localConfigs;
            }
            return utils.deepMerge(utils.deepMerge(this.getDefaultConfig(), this.configs), this.localConfigs);
        }
        const projectConfig = utils.getByDotPath(this.configs, key);
        const localConfig = utils.getByDotPath(this.localConfigs, key);
        const defaultConfig = utils.getByDotPath(this.getDefaultConfig(), key);
        const hasProjectValue = projectConfig !== undefined;
        const hasLocalValue = localConfig !== undefined;
        const hasDefaultValue = defaultConfig !== undefined;
        // 根据作用域决定返回策略
        if (scope === 'project') {
            if (!hasProjectValue) {
                throw new Error(`[Configuration] 通过 ${this.moduleName}.${key} 获取配置失败`);
            }
            return projectConfig;
        }
        if (scope === 'local') {
            // 显式 local 读取只返回本地配置，缺失时返回 undefined，避免和 default 值混淆。
            return localConfig;
        }
        if (scope === 'default') {
            if (!hasDefaultValue) {
                throw new Error(`[Configuration] 通过 ${this.moduleName}.${key} 获取配置失败`);
            }
            return defaultConfig;
        }
        // 合并读：三处都不存在才抛错
        if (!hasProjectValue && !hasLocalValue && !hasDefaultValue) {
            throw new Error(`[Configuration] 通过 ${this.moduleName}.${key} 获取配置失败`);
        }
        return utils.deepMerge(utils.deepMerge(defaultConfig, projectConfig), localConfig);
    }
    async set(key, value, scope = 'project') {
        if (scope === 'default') {
            utils.setByDotPath(this.defaultConfigs, key, value);
        }
        else if (scope === 'local') {
            utils.setByDotPath(this.localConfigs, key, value);
            await this.save('local');
        }
        else {
            utils.setByDotPath(this.configs, key, value);
            await this.save();
        }
        return true;
    }
    async remove(key, scope = 'project') {
        let removed = false;
        if (scope === 'default') {
            // 从默认配置中移除
            if (this.defaultConfigs) {
                removed = utils.removeByDotPath(this.defaultConfigs, key);
            }
        }
        else if (scope === 'local') {
            removed = utils.removeByDotPath(this.localConfigs, key);
            if (removed) {
                await this.save('local');
            }
        }
        else {
            // 从项目配置中移除
            removed = utils.removeByDotPath(this.configs, key);
            if (removed) {
                await this.save();
            }
        }
        return removed;
    }
    async save(scope = 'project') {
        this.emit(interface_1.MessageType.Save, this, scope);
        return true;
    }
}
exports.BaseConfiguration = BaseConfiguration;
