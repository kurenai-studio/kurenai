import { IBuildCommonOptions, WebMobileBuildOptions, IBuildCacheUseConfig, OverwriteProjectSettings, UserCompressConfig, WebDesktopBuildOptions } from './public';
import { CustomBundleConfig } from './protected/bundle-config';
export interface CustomBundleConfigMap {
    [bundleName: string]: CustomBundleConfig;
}
export interface BuildBundleConfiguration {
    custom: CustomBundleConfigMap;
}
export interface BuildConfiguration {
    common: IBuildCommonOptions;
    platforms: {
        'web-desktop'?: WebDesktopBuildOptions & OverwriteProjectSettings;
        'web-mobile'?: WebMobileBuildOptions & OverwriteProjectSettings;
    };
    useCacheConfig?: IBuildCacheUseConfig;
    bundleConfig: BuildBundleConfiguration;
    textureCompressConfig: UserCompressConfig;
}
