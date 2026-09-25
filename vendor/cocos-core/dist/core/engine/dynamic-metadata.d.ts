import type { ICocosConfigurationPropertySchema } from '../configuration/script/metadata';
import type { IEngineConfig } from './@types/config';
import type { ModuleRenderConfig } from './@types/modules';
type Primitive = string | number | boolean;
type FlagValue = boolean | number;
export interface IEngineDynamicMetadataSchemas {
    includeModules: ICocosConfigurationPropertySchema;
    flagProperties: Record<string, ICocosConfigurationPropertySchema>;
    flagsObject: ICocosConfigurationPropertySchema;
    macroProperties: Record<string, ICocosConfigurationPropertySchema>;
}
export interface IEngineDynamicConfigDefaults {
    includeModules: string[];
    flags: Record<string, FlagValue>;
    macroConfig: Record<string, Primitive>;
}
export interface IEngineDynamicConfigContribution {
    defaults: IEngineDynamicConfigDefaults;
    metadata: IEngineDynamicMetadataSchemas;
}
export interface IEngineDynamicConfigOptions {
    engineRoot: string;
    fallbackConfig: Pick<IEngineConfig, 'includeModules' | 'flags' | 'macroConfig'>;
}
export declare function getEngineRenderConfig(engineRoot: string): ModuleRenderConfig;
export declare function getLocalizedEngineRenderConfig(engineRoot: string): ModuleRenderConfig;
export declare function getEngineDynamicConfigContribution(options: IEngineDynamicConfigOptions): IEngineDynamicConfigContribution;
export {};
