export declare function createDefaultEngineSettings(engineRoot?: string): {
    __version__: string;
    modules: import("../../engine/module-config-defaults").IEngineModuleSettingsDefaults;
};
export declare const defaultEngineSettings: {
    __version__: string;
    modules: import("../../engine/module-config-defaults").IEngineModuleSettingsDefaults;
};
export declare const defaultProjectSettings: {
    __version__: string;
    general: {
        designResolution: {
            width: number;
            height: number;
        };
    };
    script: {
        preserveSymlinks: boolean;
    };
};
