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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29jb3MtbWlncmF0aW9uLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9jb25maWd1cmF0aW9uL21pZ3JhdGlvbi9jb2Nvcy1taWdyYXRpb24tbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1REFBbUQ7QUFDbkQsZ0RBQWdEO0FBRWhEOzs7OztHQUtHO0FBQ0gsU0FBUyxZQUFZLENBQUMsTUFBVyxFQUFFLE1BQVc7SUFDMUMsTUFBTSxNQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDO0lBRTdCLElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDeEMsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVELEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDaEQsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzlELFNBQVM7WUFDVCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekQsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPO1lBQ1AsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUN4QixDQUFDO0lBQ0wsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLE1BQXdCO0lBQ2hELElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JCLE9BQU8sTUFBTSxD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QVcsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7b0JBQ3hFLG9CQUFVLENBQUMsS0FBSyxDQUFDLHFCQUFxQixNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztnQkFDL0QsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNiLE9BQU8sR0FBRyxLQUFLLENBQUM7b0JBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3JCLG9CQUFVLENBQUMsS0FBSyxDQUFDLHFCQUFxQixNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztnQkFDL0QsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFRCxvQkFBVSxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7T0FFRztJQUNJLE1BQU0sQ0FBQyxLQUFLO1FBQ2YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QixvQkFBVSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7O09BR0c7SUFDSyxNQUFNLENBQUMsZ0JBQWdCO1FBQzNCLE9BQU87WUFDSCxPQUFPLEVBQUUsRUFBRTtZQUNYLEtBQUssRUFBRSxFQUFFO1NBQ1osQ0FBQztJQUNOLENBQUM7O0FBckdMLHNEQXNHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvY29zQ0xJQ29uZmlnU2NvcGUsIElNaWdyYXRpb25UYXJnZXQgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IENvY29zTWlncmF0aW9uIH0gZnJvbSAnLi9jb2Nvcy1taWdyYXRpb24nO1xuaW1wb3J0IHsgbmV3Q29uc29sZSB9IGZyb20gJy4uLy4uL2Jhc2UvY29uc29sZSc7XG5cbi8qKlxuICog5rex5bqm5ZCI5bm26YWN572u5a+56LGhXG4gKiBAcGFyYW0gdGFyZ2V0IOebruagh+WvueixoVxuICogQHBhcmFtIHNvdXJjZSDmupDlr7nosaFcbiAqIEByZXR1cm5zIOWQiOW5tuWQjueahOWvueixoVxuICovXG5mdW5jdGlvbiBtZXJnZUNvbmZpZ3ModGFyZ2V0OiBhbnksIHNvdXJjZTogYW55KTogYW55IHtcbiAgICBjb25zdCByZXN1bHQgPSB7IC4uLnRhcmdldCB9O1xuXG4gICAgaWYgKCFzb3VyY2UgfHwgdHlwZW9mIHNvdXJjZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzb3VyY2UpKSB7XG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgLy8g6YCS5b2S5ZCI5bm25a+56LGhXG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IG1lcmdlQ29uZmlncyhyZXN1bHRba2V5XSB8fCB7fSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g55u05o6l6LWL5YC8XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVRhcmdldFNjb3BlKHRhcmdldDogSU1pZ3JhdGlvblRhcmdldCk6IENvY29zQ0xJQ29uZmlnU2NvcGUge1xuICAgIGlmICh0YXJnZXQudGFyZ2V0U2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC50YXJnZXRTY29wZTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldC5zb3VyY2VTY29wZSA9PT0gJ2xvY2FsJyA/ICdsb2NhbCcgOiAncHJvamVjdCc7XG59XG5cbi8qKlxuICogQ29jb3NDcmVhdG9yIDMueCDphY3nva7ov4Hnp7vnrqHnkIblmahcbiAqL1xuZXhwb3J0IGNsYXNzIENvY29zTWlncmF0aW9uTWFuYWdlciB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgX3RhcmdldHM6IE1hcDxDb2Nvc0NMSUNvbmZpZ1Njb3BlLCBJTWlncmF0aW9uVGFyZ2V0W10+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgc3RhdGljIF9pbml0aWFsaXplZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICog6L+B56e75Zmo5YiX6KGoXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBnZXQgbWlncmF0aW9uVGFyZ2V0cygpOiBNYXA8Q29jb3NDTElDb25maWdTY29wZSwgSU1pZ3JhdGlvblRhcmdldFtdPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl90YXJnZXRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOazqOWGjOaJgOaciei/geenu+WZqFxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIGFzeW5jIHJlZ2lzdGVyTWlncmF0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgZ2V0TWlncmF0aW9uTGlzdCB9ID0gYXdhaXQgaW1wb3J0KCcuL3JlZ2lzdGVyLW1pZ3JhdGlvbicpO1xuICAgICAgICBjb25zdCBtaWdyYXRpb25MaXN0ID0gZ2V0TWlncmF0aW9uTGlzdCgpO1xuXG4gICAgICAgIC8vIOa4heepuueOsOaciei/geenu+WZqFxuICAgICAgICB0aGlzLmNsZWFyKCk7XG5cbiAgICAgICAgLy8g5rOo5YaM5omA5pyJ6L+B56e75ZmoXG4gICAgICAgIHRoaXMucmVnaXN0ZXIobWlncmF0aW9uTGlzdCk7XG5cbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICBuZXdDb25zb2xlLmxvZyhgW01pZ3JhdGlvbl0g5bey5rOo5YaMICR7bWlncmF0aW9uTGlzdC5sZW5ndGh9IOS4qui/geenu+WZqGApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOazqOWGjOi/geenu+WZqFxuICAgICAqIEBwYXJhbSBtaWdyYXRpb25UYXJnZXQg6L+B56e75Zmo5a6e5L6LXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyByZWdpc3RlcihtaWdyYXRpb25UYXJnZXQ6IElNaWdyYXRpb25UYXJnZXQgfCBJTWlncmF0aW9uVGFyZ2V0W10pOiB2b2lkIHtcbiAgICAgICAgbWlncmF0aW9uVGFyZ2V0ID0gIUFycmF5LmlzQXJyYXkobWlncmF0aW9uVGFyZ2V0KSA/IFttaWdyYXRpb25UYXJnZXRdIDogbWlncmF0aW9uVGFyZ2V0O1xuICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBtaWdyYXRpb25UYXJnZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjb3BlID0gcmVzb2x2ZVRhcmdldFNjb3BlKHRhcmdldCk7XG4gICAgICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuX3RhcmdldHMuZ2V0KHNjb3BlKSB8fCBbXTtcbiAgICAgICAgICAgIGl0ZW1zLnB1c2godGFyZ2V0KTtcbiAgICAgICAgICAgIHRoaXMuX3RhcmdldHMuc2V0KHNjb3BlLCBpdGVtcyk7XG4gICAgICAgICAgICBuZXdDb25zb2xlLmRlYnVnKGBbTWlncmF0aW9uXSDlt7Lms6jlhozov4Hnp7vmj5Lku7Y6ICR7dGFyZ2V0LnBsdWdpbk5hbWV9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmiafooYzov4Hnp7tcbiAgICAgKiBAcGFyYW0gcHJvamVjdFBhdGgg6aG555uu6Lev5b6EXG4gICAgICogQHJldHVybnMg6L+B56e75ZCO55qE5paw6YWN572uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBtaWdyYXRlKHByb2plY3RQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFJlY29yZDxDb2Nvc0NMSUNvbmZpZ1Njb3BlLCBSZWNvcmQ8c3RyaW5nLCBhbnk+Pj4ge1xuICAgICAgICBhd2FpdCB0aGlzLnJlZ2lzdGVyTWlncmF0aW9uKCk7XG4gICAgICAgIGlmICh0aGlzLl90YXJnZXRzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW01pZ3JhdGlvbl0g5rKh5pyJ5rOo5YaM5Lu75L2V6L+B56e75ZmoJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8Q29jb3NDTElDb25maWdTY29wZSwgUmVjb3JkPHN0cmluZywgYW55Pj4gPSBDb2Nvc01pZ3JhdGlvbk1hbmFnZXIuY3JlYXRlQ29uZmlnTGlzdCgpO1xuXG4gICAgICAgIG5ld0NvbnNvbGUubG9nKGBbTWlncmF0aW9uXSDlvIDlp4vmiafooYzov4Hnp7tgKTtcbiAgICAgICAgbGV0IHN1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAvLyDmiafooYzmiYDmnInms6jlhoznmoTov4Hnp7tcbiAgICAgICAgZm9yIChjb25zdCBpdGVtcyBvZiB0aGlzLl90YXJnZXRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBpdGVtcykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFNjb3BlID0gcmVzb2x2ZVRhcmdldFNjb3BlKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1pZ3JhdGVkQ29uZmlnID0gYXdhaXQgQ29jb3NNaWdyYXRpb24ubWlncmF0ZShwcm9qZWN0UGF0aCwgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3RhcmdldFNjb3BlXSA9IG1lcmdlQ29uZmlncyhyZXN1bHRbdGFyZ2V0U2NvcGVdLCBtaWdyYXRlZENvbmZpZyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld0NvbnNvbGUuZGVidWcoYFtNaWdyYXRpb25dIOi/geenu+WujOaIkDogJHt0YXJnZXQucGx1Z2luTmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBuZXdDb25zb2xlLmVycm9yKGBbTWlncmF0aW9uXSDov4Hnp7vlpLHotKU6ICR7dGFyZ2V0LnBsdWdpbk5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbTWlncmF0aW9uXSDov4Hnp7vlpLHotKUsIOivpuaDheivt+afpeeci+aXpeW/lycpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3Q29uc29sZS5sb2coJ1tNaWdyYXRpb25dIOaJgOaciei/geenu+aJp+ihjOaIkOWKnycpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOa4heepuuaJgOaciei/geenu+WZqFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3RhcmdldHMuY2xlYXIoKTtcbiAgICAgICAgbmV3Q29uc29sZS5kZWJ1ZygnW01pZ3JhdGlvbl0g5bey5riF56m65omA5pyJ6L+B56e75ZmoJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog55Sf5oiQ5paw55qE6YWN572uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBjcmVhdGVDb25maWdMaXN0KCk6IFJlY29yZDxDb2Nvc0NMSUNvbmZpZ1Njb3BlLCBSZWNvcmQ8c3RyaW5nLCBhbnk+PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcm9qZWN0OiB7fSxcbiAgICAgICAgICAgIGxvY2FsOiB7fSxcbiAgICAgICAgfTtcbiAgICB9XG59XG4iXX0=