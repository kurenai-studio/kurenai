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
exports.CocosMigrationManager = void 0;
const cocos_migration_1 = require("./cocos-migration");
const console_1 = require("../../base/console");
/**
 * 深度合并配置对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
function mergeConfigs(target, source) {
    const result = { ...target };
    if (!source || typeof source !== 'object') {
        return result;
    }
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            // 递归合并对象
            result[key] = mergeConfigs(result[key] || {}, value);
        }
        else {
            // 直接赋值
            result[key] = value;
        }
    }
    return result;
}
function resolveTargetScope(target) {
    if (target.targetScope) {
        return target.targetScope;
    }
    return target.sourceScope === 'local' ? 'local' : 'project';
}
/**
 * CocosCreator 3.x 配置迁移管理器
 */
class CocosMigrationManager {
    static _targets = new Map();
    static _initialized = false;
    /**
     * 迁移器列表
     */
    static get migrationTargets() {
        return this._targets;
    }
    /**
     * 注册所有迁移器
     */
    static async registerMigration() {
        if (this._initialized) {
            return;
        }
        const { getMigrationList } = await Promise.resolve().then(() => __importStar(require('./register-migration')));
        const migrationList = getMigrationList();
        // 清空现有迁移器
        this.clear();
        // 注册所有迁移器
        this.register(migrationList);
        this._initialized = true;
        console_1.newConsole.log(`[Migration] 已注册 ${migrationList.length} 个迁移器`);
    }
    /**
     * 注册迁移器
     * @param migrationTarget 迁移器实例
     */
    static register(migrationTarget) {
        migrationTarget = !Array.isArray(migrationTarget) ? [migrationTarget] : migrationTarget;
        for (const target of migrationTarget) {
            const scope = resolveTargetScope(target);
            const items = this._targets.get(scope) || [];
            items.push(target);
            this._targets.set(scope, items);
            console_1.newConsole.debug(`[Migration] 已注册迁移插件: ${target.pluginName}`);
        }
    }
    /**
     * 执行迁移
     * @param projectPath 项目路径
     * @returns 迁移后的新配置
     */
    static async migrate(projectPath) {
        await this.registerMigration();
        if (this._targets.size === 0) {
            throw new Error('[Migration] 没有注册任何迁移器');
        }
        const result = CocosMigrationManager.createConfigList();
        console_1.newConsole.log(`[Migration] 开始执行迁移`);
        let success = true;
        // 执行所有注册的迁移
        for (const items of this._targets.values()) {
            for (const target of items) {
                try {
                    const targetScope = resolveTargetScope(target);
                    const migratedConfig = await cocos_migration_1.CocosMigration.migrate(projectPath, target);
                    result[targetScope] = mergeConfigs(result[targetScope], migratedConfig);
                    console_1.newConsole.debug(`[Migration] 迁移完成: ${target.pluginName}`);
                }
                catch (error) {
                    success = false;
                    console.error(error);
                    console_1.newConsole.error(`[Migration] 迁移失败: ${target.pluginName}`);
                }
            }
        }
        if (!success) {
            throw new Error('[Migration] 迁移失败, 详情请查看日志');
        }
        console_1.newConsole.log('[Migration] 所有迁移执行成功');
        return result;
    }
    /**
     * 清空所有迁移器
     */
    static clear() {
        this._targets.clear();
        console_1.newConsole.debug('[Migration] 已清空所有迁移器');
    }
    /**
     * 生成新的配置
     * @private
     */
    static createConfigList() {
        return {
            project: {},
            local: {},
        };
    }
}
exports.CocosMigrationManager = CocosMigrationManager;
