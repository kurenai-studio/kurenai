"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrationList = getMigrationList;
/**
 * 获取迁移器注册数据列表
 * @returns 迁移器配置数组
 */
function getMigrationList() {
    const platforms = ['web-desktop', 'web-mobile'];
    const migrationList = [];
    // 平台插件的偏好默认值迁移
    platforms.forEach(platform => {
        migrationList.push({
            sourceScope: 'local',
            pluginName: platform,
            targetPath: `builder.platforms.${platform}`,
            migrate: async (oldConfig) => {
                if (!oldConfig?.builder || !oldConfig?.builder.options) {
                    return;
                }
                delete oldConfig.builder.options[platform].__version__;
                return {
                    ...oldConfig.builder.common,
                    packages: {
                        [platform]: oldConfig.builder.options[platform],
                    },
                };
            }
        });
    });
    // Builder 本地配置迁移
    migrationList.push({
        sourceScope: 'local',
        pluginName: 'builder',
        targetPath: 'builder.common',
        migrate: async (oldConfig) => {
            if (!oldConfig?.common) {
                return;
            }
            delete oldConfig.common.platform;
            delete oldConfig.common.outputName;
            return oldConfig.common;
        }
    });
    // Builder 项目配置迁移
    migrationList.push({
        sourceScope: 'project',
        pluginName: 'builder',
        targetPath: 'builder',
        migrate: async (oldConfig) => {
            if (!oldConfig) {
                return;
            }
            const res = {};
            if (oldConfig.bundleConfig) {
                res.bundleConfig = oldConfig.bundleConfig;
            }
            if (oldConfig.textureCompressConfig) {
                res.textureCompressConfig = oldConfig.textureCompressConfig;
            }
            if (oldConfig['splash-setting']) {
                res.splashScreen = oldConfig['splash-setting'];
            }
            return res;
        }
    });
    // Builder 项目配置迁移（第二个）
    migrationList.push({
        sourceScope: 'project',
        pluginName: 'builder',
        targetPath: 'builder',
        migrate: async (oldConfig) => {
            if (!oldConfig) {
                return;
            }
            const res = {};
            if (oldConfig.bundleConfig) {
                res.bundleConfig = oldConfig.bundleConfig;
            }
            if (oldConfig.textureCompressConfig) {
                res.textureCompressConfig = oldConfig.textureCompressConfig;
            }
            return res;
        }
    });
    // Engine 配置迁移
    migrationList.push({
        sourceScope: 'project',
        pluginName: 'engine',
        targetPath: 'engine',
        migrate: async (oldConfig) => {
            if (!oldConfig || !oldConfig.modules) {
                return;
            }
            const moduleConfigs = oldConfig.modules.configs;
            const configKeys = Object.keys(moduleConfigs ?? {});
            if (configKeys.length > 0) {
                configKeys.forEach(key => {
                    delete moduleConfigs[key].cache;
                });
            }
            const res = {};
            if (oldConfig.macroConfig) {
                res.macroConfig = oldConfig.macroConfig;
            }
            if (moduleConfigs) {
                res.configs = moduleConfigs;
            }
            if (oldConfig.modules.globalConfigKey) {
                res.globalConfigKey = oldConfig.modules.globalConfigKey;
            }
            if (oldConfig.modules.graphics) {
                res.graphics = oldConfig.modules.graphics;
            }
            return res;
        }
    });
    // Project 配置迁移
    migrationList.push({
        sourceScope: 'project',
        pluginName: 'project',
        migrate: async (oldConfig) => {
            const res = {};
            const ensureEngineConfig = () => {
                res.engine ??= {};
                return res.engine;
            };
            if (oldConfig.general) {
                res.engine = {
                    designResolution: oldConfig.general.designResolution,
                    downloadMaxConcurrency: oldConfig.general.downloadMaxConcurrency,
                };
            }
            if (oldConfig.physics) {
                ensureEngineConfig().physicsConfig = oldConfig.physics;
            }
            if (oldConfig.macroConfig) {
                ensureEngineConfig().macroConfig = oldConfig.macroConfig;
            }
            if (oldConfig['sorting-layer']) {
                ensureEngineConfig().sortingLayers = oldConfig['sorting-layer'];
            }
            if (oldConfig.layer) {
                ensureEngineConfig().customLayers = oldConfig.layer;
            }
            if (oldConfig.graphics) {
                ensureEngineConfig().graphics = oldConfig.graphics;
            }
            if (oldConfig.highQuality) {
                ensureEngineConfig().highQuality = oldConfig.highQuality;
            }
            if (oldConfig.general?.renderPipeline) {
                ensureEngineConfig().renderPipeline = oldConfig.general.renderPipeline;
            }
            if (oldConfig.script) {
                res.script = oldConfig.script;
            }
            if (oldConfig.import) {
                res.import = {
                    fbx: oldConfig.import.fbx,
                };
            }
            return res;
        }
    });
    // Scene 配置迁移
    migrationList.push({
        sourceScope: 'global',
        pluginName: 'scene',
        targetPath: 'scene',
        migrate: async (oldConfig) => {
            return {
                tick: oldConfig?.scene?.tick ?? false,
            };
        }
    });
    return migrationList;
}
