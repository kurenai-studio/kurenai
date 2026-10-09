"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocosMigration = void 0;
const cocos_config_loader_1 = require("./cocos-config-loader");
/**
 * CocosCreator 配置迁移器实现
 */
class CocosMigration {
    static loader = new cocos_config_loader_1.CocosConfigLoader();
    /**
     * 执行迁移
     * @param projectPath 项目路径
     * @param target 迁移目标配置
     * @returns 迁移后的新配置
     */
    static async migrate(projectPath, target) {
        CocosMigration.loader.initialize(projectPath);
        const oldPluginConfig = await CocosMigration.loader.loadConfig(target.sourceScope, target.pluginName);
        if (!oldPluginConfig)
            return {};
        let migratedConfig = await target.migrate(oldPluginConfig);
        // 应用目标路径
        if (target.targetPath) {
            migratedConfig = CocosMigration.applyTargetPath(migratedConfig, target.targetPath);
        }
        return migratedConfig;
    }
    /**
     * 应用目标路径
     * @param config 配置对象
     * @param targetPath 目标路径
     * @returns 应用路径后的配置
     */
    static applyTargetPath(config, targetPath) {
        if (!targetPath)
            return config;
        const pathParts = targetPath.split('.');
        let result = config;
        // 从后往前构建嵌套对象
        for (let i = pathParts.length - 1; i >= 0; i--) {
            result = { [pathParts[i]]: result };
        }
        return result;
    }
}
exports.CocosMigration = CocosMigration;
