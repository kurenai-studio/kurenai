export interface ISceneEditorSettings {
    settings?: Record<string, any>;
    bundleConfigs?: Array<{
        name: string;
        deps?: string[];
    }>;
}
export declare function fetchSceneEditorSettings(serverURL: string): Promise<ISceneEditorSettings | null>;
export declare function syncSceneEditorBundles(serverURL?: string, bundleConfigs?: Array<{
    name: string;
    deps?: string[];
}>): Promise<ISceneEditorSettings | null>;
