"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultBundleConfig = exports.BundlePlatformTypes = exports.BundlecompressionTypeMap = exports.BuiltinBundleName = exports.BundleCompressionTypes = void 0;
exports.getBundleDefaultName = getBundleDefaultName;
exports.transformPlatformSettings = transformPlatformSettings;
exports.checkRemoteDisabled = checkRemoteDisabled;
exports.getInvalidRemote = getInvalidRemote;
const path_1 = require("path");
var BundleCompressionTypes;
(function (BundleCompressionTypes) {
    BundleCompressionTypes["NONE"] = "none";
    BundleCompressionTypes["MERGE_DEP"] = "merge_dep";
    BundleCompressionTypes["MERGE_ALL_JSON"] = "merge_all_json";
    BundleCompressionTypes["SUBPACKAGE"] = "subpackage";
    BundleCompressionTypes["ZIP"] = "zip";
})(BundleCompressionTypes || (exports.BundleCompressionTypes = BundleCompressionTypes = {}));
var BuiltinBundleName;
(function (BuiltinBundleName) {
    BuiltinBundleName["RESOURCES"] = "resources";
    BuiltinBundleName["MAIN"] = "main";
    BuiltinBundleName["START_SCENE"] = "start-scene";
    BuiltinBundleName["INTERNAL"] = "internal";
})(BuiltinBundleName || (exports.BuiltinBundleName = BuiltinBundleName = {}));
function getBundleDefaultName(assetInfo) {
    return (0, path_1.basename)(assetInfo.source).replace(/[^a-zA-Z0-9_-]/g, '_');
}
exports.BundlecompressionTypeMap = {
    [BundleCompressionTypes.NONE]: 'i18n:builder.asset_bundle.none',
    [BundleCompressionTypes.SUBPACKAGE]: 'i18n:builder.asset_bundle.subpackage',
    [BundleCompressionTypes.MERGE_DEP]: 'i18n:builder.asset_bundle.merge_dep',
    [BundleCompressionTypes.MERGE_ALL_JSON]: 'i18n:builder.asset_bundle.merge_all_json',
    [BundleCompressionTypes.ZIP]: 'i18n:builder.asset_bundle.zip',
};
exports.BundlePlatformTypes = {
    native: {
        icon: 'mobile',
        displayName: 'i18n:builder.asset_bundle.native',
    },
    web: {
        icon: 'html5',
        displayName: 'i18n:builder.asset_bundle.web',
    },
    miniGame: {
        icon: 'mini-game',
        displayName: 'i18n:builder.asset_bundle.minigame',
    },
};
exports.DefaultBundleConfig = {
    displayName: 'i18n:builder.asset_bundle.defaultConfig',
    configs: {
        native: {
            preferredOptions: {
                isRemote: false,
                compressionType: 'merge_dep',
            },
        },
        web: {
            preferredOptions: {
                isRemote: false,
                compressionType: 'merge_dep',
            },
            fallbackOptions: {
                compressionType: 'merge_dep',
            },
        },
        miniGame: {
            fallbackOptions: {
                isRemote: false,
                compressionType: 'merge_dep',
            },
            configMode: 'fallback',
        },
    },
};
function transformPlatformSettings(config, platformConfigs) {
    const res = {};
    Object.keys(platformConfigs).forEach((platform) => {
        const option = getValidOption(platform, config, platformConfigs);
        option.isRemote = getInvalidRemote(option.compressionType || 'merge_dep', option.isRemote);
        option.compressionType = option.compressionType || BundleCompressionTypes.MERGE_DEP;
        res[platform] = option;
    });
    return res;
}
function getValidOption(platform, config, platformConfigs) {
    const mode = config.configMode || (platformConfigs[platform].platformType === 'miniGame' ? 'fallback' : 'auto');
    // mode 为 fallback 时， 优先使用回退选项
    if (mode === 'fallback' && config.fallbackOptions) {
        return {
            ...config.preferredOptions,
            compressionType: config.fallbackOptions.compressionType,
            isRemote: config.fallbackOptions.isRemote ?? false,
        };
    }
    // 有针对平台的设置，优先使用平台设置
    if (config.overwriteSettings && config.overwriteSettings[platform]) {
        return config.overwriteSettings[platform];
    }
    const support = platformConfigs[platform].supportOptions.compressionType;
    if (mode === 'overwrite' && (!config.overwriteSettings || !config.overwriteSettings[platform])) {
        return {
            compressionType: BundleCompressionTypes.MERGE_DEP,
            isRemote: false,
        };
    }
    // 偏好设置的选项，平台都支持，直接使用
    if (config.preferredOptions && support.includes(config.preferredOptions.compressionType)) {
        return config.preferredOptions;
    }
    // 有回退选项时，优先使用回退选项
    if (config.fallbackOptions) {
        return {
            ...config.preferredOptions,
            compressionType: config.fallbackOptions.compressionType,
        };
    }
    // 无回退选项时，使用替换偏好设置内平台不支持的选项
    return {
        ...config.preferredOptions,
    };
}
function checkRemoteDisabled(compressionType) {
    return compressionType === BundleCompressionTypes.SUBPACKAGE || compressionType === BundleCompressionTypes.ZIP;
}
function getInvalidRemote(compressionType, isRemote) {
    if (compressionType === BundleCompressionTypes.SUBPACKAGE) {
        return false;
    }
    else if (compressionType === BundleCompressionTypes.ZIP) {
        return true;
    }
    return isRemote ?? false;
}
