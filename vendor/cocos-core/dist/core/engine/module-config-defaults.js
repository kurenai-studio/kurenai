"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NO_DEPRECATED_FEATURES = exports.DEFAULT_ENGINE_MODULE_CONFIG_NAME = exports.DEFAULT_ENGINE_MODULE_CONFIG_KEY = void 0;
exports.createDefaultEngineModuleSettings = createDefaultEngineModuleSettings;
exports.createDefaultEngineModuleProjectDefaults = createDefaultEngineModuleProjectDefaults;
const render_config_json_1 = __importDefault(require("./features/render-config.json"));
const dynamic_metadata_1 = require("./dynamic-metadata");
exports.DEFAULT_ENGINE_MODULE_CONFIG_KEY = 'defaultConfig';
exports.DEFAULT_ENGINE_MODULE_CONFIG_NAME = '\u9ed8\u8ba4\u914d\u7f6e';
exports.DEFAULT_NO_DEPRECATED_FEATURES = {
    value: false,
    version: '',
};
function isFeatureGroup(moduleItem) {
    return 'options' in moduleItem;
}
function normalizeFlagDefault(value) {
    return typeof value === 'number' ? value : Boolean(value);
}
function collectFlagDefaults(featureItem) {
    const flags = Object.fromEntries(Object.entries(featureItem.flags ?? {}).map(([key, flag]) => [
        key,
        normalizeFlagDefault(flag.default),
    ]));
    return Object.keys(flags).length ? flags : undefined;
}
function assignFlagDefaults(target, flagDefaults) {
    if (!flagDefaults) {
        return;
    }
    for (const [key, value] of Object.entries(flagDefaults)) {
        if (!(key in target)) {
            target[key] = value;
        }
    }
}
function buildDefaultModuleConfig(renderConfig) {
    const flags = {};
    const includeModules = [];
    for (const [featureKey, moduleItem] of Object.entries(renderConfig.features)) {
        if (isFeatureGroup(moduleItem)) {
            for (const [optionKey, optionItem] of Object.entries(moduleItem.options)) {
                const flagDefaults = collectFlagDefaults(optionItem);
                const enabled = Boolean(optionItem.default);
                if (enabled) {
                    includeModules.push(optionKey);
                }
                assignFlagDefaults(flags, flagDefaults);
            }
            continue;
        }
        const flagDefaults = collectFlagDefaults(moduleItem);
        const enabled = Boolean(moduleItem.default);
        if (enabled) {
            includeModules.push(featureKey);
        }
        assignFlagDefaults(flags, flagDefaults);
    }
    return {
        flags,
        includeModules,
    };
}
function loadRenderConfig(engineRoot) {
    try {
        return (0, dynamic_metadata_1.getEngineRenderConfig)(engineRoot);
    }
    catch (error) {
        console.warn('[Engine] Failed to load engine render-config from repository, fallback to bundled copy.', error);
        return render_config_json_1.default;
    }
}
function createDefaultEngineModuleSettings(engineRoot) {
    const moduleDefaults = buildDefaultModuleConfig(loadRenderConfig(engineRoot));
    return {
        globalConfigKey: exports.DEFAULT_ENGINE_MODULE_CONFIG_KEY,
        configs: {
            [exports.DEFAULT_ENGINE_MODULE_CONFIG_KEY]: {
                name: exports.DEFAULT_ENGINE_MODULE_CONFIG_NAME,
                flags: moduleDefaults.flags,
                includeModules: moduleDefaults.includeModules,
                noDeprecatedFeatures: {
                    ...exports.DEFAULT_NO_DEPRECATED_FEATURES,
                },
            },
        },
    };
}
function createDefaultEngineModuleProjectDefaults(engineRoot) {
    const settingsDefaults = createDefaultEngineModuleSettings(engineRoot);
    return {
        globalConfigKey: settingsDefaults.globalConfigKey,
        configs: Object.fromEntries(Object.entries(settingsDefaults.configs).map(([key, value]) => [
            key,
            {
                name: value.name,
                includeModules: [...value.includeModules],
                flags: value.flags ? { ...value.flags } : undefined,
                noDeprecatedFeatures: value.noDeprecatedFeatures ? { ...value.noDeprecatedFeatures } : undefined,
            },
        ])),
    };
}
