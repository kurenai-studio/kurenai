import type { IBuildCacheUseConfig } from '../@types';
import type { BuildConfiguration } from '../@types/config-export';
import type { IBuilderConfigItem } from '../@types/protected';
import type { ICocosConfigurationNode, ICocosConfigurationPropertySchema, IConfigurationItem } from '../../configuration/script/metadata';
interface IBuilderMetadataSource {
    commonOptionConfigs: Record<string, IConfigurationItem>;
    useCacheDefaults: IBuildCacheUseConfig;
    bundleConfigDefault?: BuildConfiguration['bundleConfig'];
    textureCompressConfigDefault?: BuildConfiguration['textureCompressConfig'];
    commonOptionConfig: Record<string, Record<string, IConfigurationItem>>;
    configMap: Record<string, Record<string, {
        displayName?: string;
        options?: Record<string, IConfigurationItem>;
    }>>;
    platformTitles: Record<string, string>;
}
export declare function createBuilderCoreMetadataNodes(commonOptionConfigs: Record<string, IConfigurationItem>, useCacheDefaults: IBuildCacheUseConfig, bundleConfigDefault: BuildConfiguration['bundleConfig'], textureCompressConfigDefault: BuildConfiguration['textureCompressConfig']): ICocosConfigurationNode[];
export declare function createBuilderPlatformMetadataNodes(platform: string, source: IBuilderMetadataSource, order?: number): ICocosConfigurationNode[];
export declare function createBuilderMetadataNodes(source: IBuilderMetadataSource): ICocosConfigurationNode[];
export declare function createBuilderRenderSchema(config: Record<string, IBuilderConfigItem>, platform?: string): ICocosConfigurationPropertySchema;
export {};
