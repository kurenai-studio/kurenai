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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NvcmUvYnVpbGRlci9zaGFyZS9idW5kbGUtdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBb0JBLG9EQUVDO0FBcURELDhEQVNDO0FBMkNELGtEQUVDO0FBRUQsNENBUUM7QUEzSUQsK0JBQWdDO0FBS2hDLElBQVksc0JBTVg7QUFORCxXQUFZLHNCQUFzQjtJQUM5Qix1Q0FBYSxDQUFBO0lBQ2IsaURBQXVCLENBQUE7SUFDdkIsMkRBQWlDLENBQUE7SUFDakMsbURBQXlCLENBQUE7SUFDekIscUNBQVcsQ0FBQTtBQUNmLENBQUMsRUFOVyxzQkFBc0Isc0NBQXRCLHNCQUFzQixRQU1qQztBQUVELElBQVksaUJBS1g7QUFMRCxXQUFZLGlCQUFpQjtJQUN6Qiw0Q0FBdUIsQ0FBQTtJQUN2QixrQ0FBYSxDQUFBO0lBQ2IsZ0RBQTJCLENBQUE7SUFDM0IsMENBQXFCLENBQUE7QUFDekIsQ0FBQyxFQUxXLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBSzVCO0FBRUQsU0FBZ0Isb0JBQW9CLENBQUMsU0FBaUI7SUFDbEQsT0FBTyxJQUFBLGVBQVEsRUFBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFFWSxRQUFBLHdCQUF3QixHQUFHO0lBQ3BDLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsZ0NBQWdDO0lBQy9ELENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDLEVBQUUsc0NBQXNDO0lBQzNFLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLEVBQUUscUNBQXFDO0lBQ3pFLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLEVBQUUsMENBQTBDO0lBQ25GLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLEVBQUUsK0JBQStCO0NBQ2hFLENBQUM7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QUFFLENBQUM7UUFDN0YsT0FBTztZQUNILGVBQWUsRUFBRSxzQkFBc0IsQ0FBQyxTQUFTO1lBQ2pELFFBQVEsRUFBRSxLQUFLO1NBQ2xCLENBQUM7SUFDTixDQUFDO0lBRUQscUJBQXFCO0lBQ3JCLElBQUksTUFBTSxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7UUFDdkYsT0FBTyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7SUFDbkMsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixJQUFJLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN6QixPQUFPO1lBQ0gsR0FBRyxNQUFNLENBQUMsZ0JBQWdCO1lBQzFCLGVBQWUsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWU7U0FDMUQsQ0FBQztJQUNOLENBQUM7SUFFRCwyQkFBMkI7SUFDM0IsT0FBTztRQUNILEdBQUcsTUFBTSxDQUFDLGdCQUFnQjtLQUM3QixDQUFDO0FBQ04sQ0FBQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLGVBQXNDO0lBQ3RFLE9BQU8sZUFBZSxLQUFLLHNCQUFzQixDQUFDLFVBQVUsSUFBSSxlQUFlLEtBQUssc0JBQXNCLENBQUMsR0FBRyxDQUFDO0FBQ25ILENBQUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxlQUFzQyxFQUFFLFFBQWtCO0lBQ3ZGLElBQUksZUFBZSxLQUFLLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3hELE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7U0FBTSxJQUFJLGVBQWUsS0FBSyxzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN4RCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsT0FBTyxRQUFRLElBQUksS0FBSyxDQUFDO0FBQzdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBiYXNlbmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgSUFzc2V0IH0gZnJvbSAnLi4vLi4vYXNzZXRzL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgQnVuZGxlQ29tcHJlc3Npb25UeXBlLCBNYWtlUmVxdWlyZWQgfSBmcm9tICcuLi9AdHlwZXMnO1xuaW1wb3J0IHsgUGxhdGZvcm1CdW5kbGVDb25maWcsIElQbGF0Zm9ybUluZm8sIEJ1bmRsZVJlbmRlckNvbmZpZywgQ3VzdG9tQnVuZGxlQ29uZmlnLCBDdXN0b21CdW5kbGVDb25maWdJdGVtLCBCdW5kbGVDb25maWdJdGVtIH0gZnJvbSAnLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5cbmV4cG9ydCBlbnVtIEJ1bmRsZUNvbXByZXNzaW9uVHlwZXMge1xuICAgIE5PTkUgPSAnbm9uZScsXG4gICAgTUVSR0VfREVQID0gJ21lcmdlX2RlcCcsXG4gICAgTUVSR0VfQUxMX0pTT04gPSAnbWVyZ2VfYWxsX2pzb24nLFxuICAgIFNVQlBBQ0tBR0UgPSAnc3VicGFja2FnZScsXG4gICAgWklQID0gJ3ppcCcsXG59XG5cbmV4cG9ydCBlbnVtIEJ1aWx0aW5CdW5kbGVOYW1lIHtcbiAgICBSRVNPVVJDRVMgPSAncmVzb3VyY2VzJyxcbiAgICBNQUlOID0gJ21haW4nLFxuICAgIFNUQVJUX1NDRU5FID0gJ3N0YXJ0LXNjZW5lJyxcbiAgICBJTlRFUk5BTCA9ICdpbnRlcm5hbCcsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCdW5kbGVEZWZhdWx0TmFtZShhc3NldEluZm86IElBc3NldCkge1xuICAgIHJldHVybiBiYXNlbmFtZShhc3NldEluZm8uc291cmNlKS5yZXBsYWNlKC9bXmEtekEtWjAtOV8tXS9nLCAnXycpO1xufVxuXG5leHBvcnQgY29uc3QgQnVuZGxlY29tcHJlc3Npb25UeXBlTWFwID0ge1xuICAgIFtCdW5kbGVDb21wcmVzc2lvblR5cGVzLk5PTkVdOiAnaTE4bjpidWlsZGVyLmFzc2V0X2J1bmRsZS5ub25lJyxcbiAgICBbQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5TVUJQQUNLQUdFXTogJ2kxOG46YnVpbGRlci5hc3NldF9idW5kbGUuc3VicGFja2FnZScsXG4gICAgW0J1bmRsZUNvbXByZXNzaW9uVHlwZXMuTUVSR0VfREVQXTogJ2kxOG46YnVpbGRlci5hc3NldF9idW5kbGUubWVyZ2VfZGVwJyxcbiAgICBbQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5NRVJHRV9BTExfSlNPTl06ICdpMThuOmJ1aWxkZXIuYXNzZXRfYnVuZGxlLm1lcmdlX2FsbF9qc29uJyxcbiAgICBbQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5aSVBdOiAnaTE4bjpidWlsZGVyLmFzc2V0X2J1bmRsZS56aXAnLFxufTtcblxuZXhwb3J0IGNvbnN0IEJ1bmRsZVBsYXRmb3JtVHlwZXMgPSB7XG4gICAgbmF0aXZlOiB7XG4gICAgICAgIGljb246ICdtb2JpbGUnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ2kxOG46YnVpbGRlci5hc3NldF9idW5kbGUubmF0aXZlJyxcbiAgICB9LFxuICAgIHdlYjoge1xuICAgICAgICBpY29uOiAnaHRtbDUnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ2kxOG46YnVpbGRlci5hc3NldF9idW5kbGUud2ViJyxcbiAgICB9LFxuICAgIG1pbmlHYW1lOiB7XG4gICAgICAgIGljb246ICdtaW5pLWdhbWUnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ2kxOG46YnVpbGRlci5hc3NldF9idW5kbGUubWluaWdhbWUnLFxuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgRGVmYXVsdEJ1bmRsZUNvbmZpZzogQ3VzdG9tQnVuZGxlQ29uZmlnID0ge1xuICAgIGRpc3BsYXlOYW1lOiAnaTE4bjpidWlsZGVyLmFzc2V0X2J1bmRsZS5kZWZhdWx0Q29uZmlnJyxcbiAgICBjb25maWdzOiB7XG4gICAgICAgIG5hdGl2ZToge1xuICAgICAgICAgICAgcHJlZmVycmVkT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGlzUmVtb3RlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjb21wcmVzc2lvblR5cGU6ICdtZXJnZV9kZXAnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgd2ViOiB7XG4gICAgICAgICAgICBwcmVmZXJyZWRPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgaXNSZW1vdGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNvbXByZXNzaW9uVHlwZTogJ21lcmdlX2RlcCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmFsbGJhY2tPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgY29tcHJlc3Npb25UeXBlOiAnbWVyZ2VfZGVwJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1pbmlHYW1lOiB7XG4gICAgICAgICAgICBmYWxsYmFja09wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBpc1JlbW90ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29tcHJlc3Npb25UeXBlOiAnbWVyZ2VfZGVwJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb25maWdNb2RlOiAnZmFsbGJhY2snLFxuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtUGxhdGZvcm1TZXR0aW5ncyhjb25maWc6IEN1c3RvbUJ1bmRsZUNvbmZpZ0l0ZW0sIHBsYXRmb3JtQ29uZmlnczogUmVjb3JkPHN0cmluZywgUGxhdGZvcm1CdW5kbGVDb25maWc+KSB7XG4gICAgY29uc3QgcmVzOiBSZWNvcmQ8c3RyaW5nLCBSZXF1aXJlZDxCdW5kbGVDb25maWdJdGVtPj4gPSB7fTtcbiAgICBPYmplY3Qua2V5cyhwbGF0Zm9ybUNvbmZpZ3MpLmZvckVhY2goKHBsYXRmb3JtKSA9PiB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IGdldFZhbGlkT3B0aW9uKHBsYXRmb3JtLCBjb25maWcsIHBsYXRmb3JtQ29uZmlncyk7XG4gICAgICAgIG9wdGlvbi5pc1JlbW90ZSA9IGdldEludmFsaWRSZW1vdGUob3B0aW9uLmNvbXByZXNzaW9uVHlwZSB8fCAnbWVyZ2VfZGVwJywgb3B0aW9uLmlzUmVtb3RlKTtcbiAgICAgICAgb3B0aW9uLmNvbXByZXNzaW9uVHlwZSA9IG9wdGlvbi5jb21wcmVzc2lvblR5cGUgfHwgQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5NRVJHRV9ERVA7XG4gICAgICAgIHJlc1twbGF0Zm9ybV0gPSBvcHRpb24gYXMgUmVxdWlyZWQ8QnVuZGxlQ29uZmlnSXRlbT47XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gZ2V0VmFsaWRPcHRpb24ocGxhdGZvcm06IHN0cmluZywgY29uZmlnOiBDdXN0b21CdW5kbGVDb25maWdJdGVtLCBwbGF0Zm9ybUNvbmZpZ3M6IFJlY29yZDxzdHJpbmcsIFBsYXRmb3JtQnVuZGxlQ29uZmlnPik6IFBhcnRpYWw8QnVuZGxlQ29uZmlnSXRlbT4ge1xuICAgIGNvbnN0IG1vZGUgPSBjb25maWcuY29uZmlnTW9kZSB8fCAocGxhdGZvcm1Db25maWdzW3BsYXRmb3JtXS5wbGF0Zm9ybVR5cGUgPT09ICdtaW5pR2FtZScgPyAnZmFsbGJhY2snIDogJ2F1dG8nKTtcbiAgICAvLyBtb2RlIOS4uiBmYWxsYmFjayDml7bvvIwg5LyY5YWI5L2/55So5Zue6YCA6YCJ6aG5XG4gICAgaWYgKG1vZGUgPT09ICdmYWxsYmFjaycgJiYgY29uZmlnLmZhbGxiYWNrT3B0aW9ucykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uY29uZmlnLnByZWZlcnJlZE9wdGlvbnMsXG4gICAgICAgICAgICBjb21wcmVzc2lvblR5cGU6IGNvbmZpZy5mYWxsYmFja09wdGlvbnMuY29tcHJlc3Npb25UeXBlLFxuICAgICAgICAgICAgaXNSZW1vdGU6IGNvbmZpZy5mYWxsYmFja09wdGlvbnMuaXNSZW1vdGUgPz8gZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vIOaciemSiOWvueW5s+WPsOeahOiuvue9ru+8jOS8mOWFiOS9v+eUqOW5s+WPsOiuvue9rlxuICAgIGlmIChjb25maWcub3ZlcndyaXRlU2V0dGluZ3MgJiYgY29uZmlnLm92ZXJ3cml0ZVNldHRpbmdzW3BsYXRmb3JtXSkge1xuICAgICAgICByZXR1cm4gY29uZmlnLm92ZXJ3cml0ZVNldHRpbmdzW3BsYXRmb3JtXTtcbiAgICB9XG4gICAgY29uc3Qgc3VwcG9ydCA9IHBsYXRmb3JtQ29uZmlnc1twbGF0Zm9ybV0uc3VwcG9ydE9wdGlvbnMuY29tcHJlc3Npb25UeXBlO1xuICAgIGlmIChtb2RlID09PSAnb3ZlcndyaXRlJyAmJiAoIWNvbmZpZy5vdmVyd3JpdGVTZXR0aW5ncyB8fCAhY29uZmlnLm92ZXJ3cml0ZVNldHRpbmdzW3BsYXRmb3JtXSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbXByZXNzaW9uVHlwZTogQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5NRVJHRV9ERVAsXG4gICAgICAgICAgICBpc1JlbW90ZTogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5YGP5aW96K6+572u55qE6YCJ6aG577yM5bmz5Y+w6YO95pSv5oyB77yM55u05o6l5L2/55SoXG4gICAgaWYgKGNvbmZpZy5wcmVmZXJyZWRPcHRpb25zICYmIHN1cHBvcnQuaW5jbHVkZXMoY29uZmlnLnByZWZlcnJlZE9wdGlvbnMuY29tcHJlc3Npb25UeXBlKSkge1xuICAgICAgICByZXR1cm4gY29uZmlnLnByZWZlcnJlZE9wdGlvbnM7XG4gICAgfVxuXG4gICAgLy8g5pyJ5Zue6YCA6YCJ6aG55pe277yM5LyY5YWI5L2/55So5Zue6YCA6YCJ6aG5XG4gICAgaWYgKGNvbmZpZy5mYWxsYmFja09wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLmNvbmZpZy5wcmVmZXJyZWRPcHRpb25zLFxuICAgICAgICAgICAgY29tcHJlc3Npb25UeXBlOiBjb25maWcuZmFsbGJhY2tPcHRpb25zLmNvbXByZXNzaW9uVHlwZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDml6Dlm57pgIDpgInpobnml7bvvIzkvb/nlKjmm7/mjaLlgY/lpb3orr7nva7lhoXlubPlj7DkuI3mlK/mjIHnmoTpgInpoblcbiAgICByZXR1cm4ge1xuICAgICAgICAuLi5jb25maWcucHJlZmVycmVkT3B0aW9ucyxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tSZW1vdGVEaXNhYmxlZChjb21wcmVzc2lvblR5cGU6IEJ1bmRsZUNvbXByZXNzaW9uVHlwZSkge1xuICAgIHJldHVybiBjb21wcmVzc2lvblR5cGUgPT09IEJ1bmRsZUNvbXByZXNzaW9uVHlwZXMuU1VCUEFDS0FHRSB8fCBjb21wcmVzc2lvblR5cGUgPT09IEJ1bmRsZUNvbXByZXNzaW9uVHlwZXMuWklQO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW52YWxpZFJlbW90ZShjb21wcmVzc2lvblR5cGU6IEJ1bmRsZUNvbXByZXNzaW9uVHlwZSwgaXNSZW1vdGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgaWYgKGNvbXByZXNzaW9uVHlwZSA9PT0gQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5TVUJQQUNLQUdFKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGNvbXByZXNzaW9uVHlwZSA9PT0gQnVuZGxlQ29tcHJlc3Npb25UeXBlcy5aSVApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzUmVtb3RlID8/IGZhbHNlO1xufSJdfQ==