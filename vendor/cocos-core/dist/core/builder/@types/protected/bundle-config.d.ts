import { BundleCompressionType } from '../public';
export type BundlePlatformType = 'native' | 'miniGame' | 'web';
export type BundleConfigProperty = 'compressionType' | 'isRemote';
export declare const enum BundleCompressionTypes {
    NONE = "none",
    MERGE_DEP = "merge_dep",
    MERGE_ALL_JSON = "merge_all_json",
    SUBPACKAGE = "subpackage",
    ZIP = "zip"
}
export declare const enum BuiltinBundleName {
    RESOURCES = "resources",
    MAIN = "main",
    START_SCENE = "start-scene",
    INTERNAL = "internal"
}
export interface PlatformBundleConfig {
    platformName: string;
    platformType: BundlePlatformType;
    supportOptions: Record<string, any[]>;
}
export interface BundleRenderConfig {
    platformTypeInfo: PlatformTypeInfo;
    platformConfigs: Record<string, PlatformBundleConfig>;
    maxOptionList: Record<string, any[]>;
    minOptionList?: Record<string, any[]>;
}
export interface BundleQueryConfig {
    displayName: string;
    platformConfigs: Record<string, PlatformBundleConfig>;
}
export interface PlatformTypeInfo {
    icon: string;
    displayName: string;
}
export interface BundleConfigItemMap {
    [platform: string]: BundleConfigItem;
}
export interface CustomBundleConfigItem {
    preferredOptions?: {
        isRemote: boolean;
        compressionType: BundleCompressionType;
    };
    fallbackOptions?: {
        compressionType: BundleCompressionType;
        isRemote?: boolean;
    };
    overwriteSettings?: BundleConfigItemMap;
    configMode?: 'auto' | 'fallback' | 'overwrite';
}
export interface CustomBundleConfig {
    displayName: string;
    configs: Record<BundlePlatformType, CustomBundleConfigItem>;
}
export interface BundleConfigItem {
    isRemote?: boolean;
    compressionType: BundleCompressionType;
}
