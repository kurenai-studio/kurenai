"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuilderCoreMetadataNodes = createBuilderCoreMetadataNodes;
exports.createBuilderPlatformMetadataNodes = createBuilderPlatformMetadataNodes;
exports.createBuilderMetadataNodes = createBuilderMetadataNodes;
exports.createBuilderRenderSchema = createBuilderRenderSchema;
const bundle_utils_1 = require("./bundle-utils");
const metadata_1 = require("../../configuration/script/metadata");
const DEFAULT_BUNDLE_CONFIG = {
    custom: {},
};
const DEFAULT_TEXTURE_COMPRESS_CONFIG = {
    userPreset: {},
    defaultConfig: {},
    customConfigs: {},
    genMipmaps: false,
};
const PLATFORM_HIDDEN_SCHEMA_OPTIONS = {
    'web-mobile': [
        'binGroupConfig',
        'skipCompressTexture',
        'packAutoAtlas',
    ],
    android: [
    // Example: 'inputSDK',
    ],
};
function shouldHidePlatformSchemaOption(platform, key) {
    return PLATFORM_HIDDEN_SCHEMA_OPTIONS[platform]?.includes(key) ?? false;
}
function convertBuilderConfigItem(item, key, platform) {
    const schema = (0, metadata_1.convertConfigItem)(item, key);
    if (platform && shouldHidePlatformSchemaOption(platform, key)) {
        schema.hidden = true;
    }
    return schema;
}
function createBuilderCoreMetadataNodes(commonOptionConfigs, useCacheDefaults, bundleConfigDefault, textureCompressConfigDefault) {
    return [
        createBuilderCommonNode(commonOptionConfigs, 11),
        createBuilderUseCacheNode(useCacheDefaults, 12),
        createBuilderTextureCompressNode(textureCompressConfigDefault, 13),
        createBuilderBundleConfigNode(bundleConfigDefault, 14),
    ];
}
function createBuilderPlatformMetadataNodes(platform, source, order = 20) {
    const node = createBuilderPlatformNode(platform, source, order);
    return node ? [node] : [];
}
function createBuilderMetadataNodes(source) {
    const nodes = createBuilderCoreMetadataNodes(source.commonOptionConfigs, source.useCacheDefaults, source.bundleConfigDefault ?? DEFAULT_BUNDLE_CONFIG, source.textureCompressConfigDefault ?? DEFAULT_TEXTURE_COMPRESS_CONFIG);
    const registeredPlatforms = Object.keys(source.configMap);
    registeredPlatforms.forEach((platform, index) => {
        nodes.push(...createBuilderPlatformMetadataNodes(platform, source, 20 + index));
    });
    return nodes;
}
function createBuilderRenderSchema(config, platform) {
    const properties = {};
    const required = [];
    for (const [key, item] of Object.entries(config)) {
        if (!(0, metadata_1.hasConfigItemShape)(item)) {
            continue;
        }
        const schema = convertBuilderConfigItem(item, key, platform);
        properties[key] = schema;
        if (!schema.hidden && item.verifyRules?.includes('required')) {
            required.push(key);
        }
    }
    const result = { type: 'object', properties };
    if (required.length) {
        result.required = required;
    }
    return result;
}
function createBuilderCommonNode(commonOptionConfigs, order) {
    const properties = {};
    for (const [key, item] of Object.entries(commonOptionConfigs)) {
        if ((0, metadata_1.hasConfigItemShape)(item)) {
            properties[`builder.common.${key}`] = convertBuilderConfigItem(item, key);
        }
    }
    return (0, metadata_1.createNode)('builder.common', 'i18n:configuration.builder.common.title', 'builder', properties, order);
}
function createBuilderUseCacheNode(defaults, order) {
    return (0, metadata_1.createNode)('builder.useCacheConfig', 'i18n:configuration.builder.useCache.title', 'builder', {
        'builder.useCacheConfig.serializeData': {
            type: 'boolean',
            default: defaults.serializeData,
            title: 'i18n:configuration.builder.useCache.serializeData.title',
        },
        'builder.useCacheConfig.engine': {
            type: 'boolean',
            default: defaults.engine,
            title: 'i18n:configuration.builder.useCache.engine.title',
        },
        'builder.useCacheConfig.textureCompress': {
            type: 'boolean',
            default: defaults.textureCompress,
            title: 'i18n:configuration.builder.useCache.textureCompress.title',
        },
        'builder.useCacheConfig.autoAtlas': {
            type: 'boolean',
            default: defaults.autoAtlas,
            title: 'i18n:configuration.builder.useCache.autoAtlas.title',
        },
    }, order);
}
function createBuilderTextureCompressNode(defaults, order) {
    return (0, metadata_1.createNode)('builder.textureCompressConfig', 'i18n:configuration.builder.textureCompressConfig.title', 'builder', {
        'builder.textureCompressConfig': (0, metadata_1.objectSchema)(undefined, {
            default: defaults,
            title: 'i18n:configuration.builder.textureCompressConfig.title',
            description: 'i18n:configuration.builder.textureCompressConfig.description',
        }),
    }, order);
}
function createBuilderBundleConfigNode(defaults, order) {
    const customDefaults = {
        default: bundle_utils_1.DefaultBundleConfig,
        ...defaults.custom,
    };
    return (0, metadata_1.createNode)('builder.bundleConfig', 'i18n:configuration.builder.bundleConfig.title', 'builder', {
        'builder.bundleConfig.custom': (0, metadata_1.objectSchema)(undefined, {
            default: customDefaults,
            title: 'i18n:configuration.builder.bundleConfig.title',
            description: 'i18n:configuration.builder.bundleConfig.description',
        }),
    }, order);
}
function createBuilderPlatformNode(platform, source, order) {
    const configs = source.configMap[platform];
    if (!configs || !Object.keys(configs).length) {
        return undefined;
    }
    const properties = {
        [`builder.platforms.${platform}.outputName`]: {
            type: 'string',
            default: platform,
            title: 'i18n:configuration.builder.platform.outputName.title',
        },
    };
    for (const [pkgName, config] of Object.entries(configs)) {
        const packageProperties = {};
        for (const [key, item] of Object.entries(config.options ?? {})) {
            if ((0, metadata_1.hasConfigItemShape)(item)) {
                packageProperties[key] = convertBuilderConfigItem(item, key, platform);
            }
        }
        if (packageProperties.platform) {
            packageProperties.platform.default = platform;
        }
        if (packageProperties.outputName) {
            packageProperties.outputName.default = platform;
        }
        properties[`builder.platforms.${platform}.packages.${pkgName}`] = (0, metadata_1.objectSchema)(packageProperties, {
            title: 'i18n:configuration.builder.platform.packageOptions.title',
        });
    }
    const platformTitle = (0, metadata_1.translateMetadataText)(source.platformTitles[platform], platform) ?? platform;
    const configSuffix = (0, metadata_1.translateMetadataText)('i18n:configuration.builder.platform.configSuffix')
        ?? 'Platform Config';
    return (0, metadata_1.createNode)(`builder.platforms.${platform}`, `${platformTitle} ${configSuffix}`, 'builder', properties, order);
}
