export interface IEngineLoader {
    import(id: string): Promise<unknown>;
}
export declare class EngineLoader {
    static isEngineModule(request: string): boolean;
    private static engineModules;
    static getEngineModuleById(id: string): any;
    private static loader;
    private static createEngineLoader;
    static init(engineDevPath: string, modules: string[]): Promise<void>;
    static requiredModules(modules: string[]): Promise<void>;
    static importModule(module: string): Promise<unknown>;
}
