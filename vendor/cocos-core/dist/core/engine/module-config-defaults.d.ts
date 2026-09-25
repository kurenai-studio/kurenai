import type { IEngineModuleProjectConfig } from './@types/config';
import type { ICroppingConfig } from './@types/modules';
export declare const DEFAULT_ENGINE_MODULE_CONFIG_KEY = "defaultConfig";
export declare const DEFAULT_ENGINE_MODULE_CONFIG_NAME = "\u9ED8\u8BA4\u914D\u7F6E";
export declare const DEFAULT_NO_DEPRECATED_FEATURES: {
    readonly value: false;
    readonly version: "";
};
export interface IEngineModuleSettingsDefaults {
    globalConfigKey: string;
    configs: Record<string, ICroppingConfig>;
}
export interface IEngineModuleProjectDefaults {
    globalConfigKey: string;
    configs: Record<string, IEngineModuleProjectConfig>;
}
export declare function createDefaultEngineModuleSettings(engineRoot: string): IEngineModuleSettingsDefaults;
export declare function createDefaultEngineModuleProjectDefaults(engineRoot: string): IEngineModuleProjectDefaults;
