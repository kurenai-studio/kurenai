export type * from '../../core/engine/@types/public';
export declare function init(projectPath: string): Promise<void>;
export declare function getInfo(): Promise<import("../../core/engine/@types/public").EngineInfo>;
export declare function getConfig(useDefault?: boolean): Promise<import("../../core/engine/@types/config").IEngineConfig>;
export declare function getRenderConfig(): Promise<import("../../core/engine/@types/modules").ModuleRenderConfig>;
export declare function queryJointTextureLayoutPreview(): Promise<import("../../core/engine/@types/config").IJointTextureLayoutPreviewResult>;
export declare function initEngine(enginePath: string, projectPath: string, serverURL?: string): Promise<void>;
export declare function startEngineCompilation(force?: boolean): Promise<void>;
export declare function queryLayerBuiltin(): Promise<{
    name: string;
    value: number;
}[]>;
export declare function querySortingLayerBuiltin(): Promise<readonly import("cc").__private._cocos_sorting_sorting_layers__SortingItem[]>;
