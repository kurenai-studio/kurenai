import { ImportMap } from '../../builder/@types/protected';
interface IEngineOptions {
    /**
     * 引擎仓库根目录。
     */
    root: string;
    /**
     * 引擎编译后的根目录。
     */
    distRoot: string;
    /**
     * 引擎基础 URL。
     */
    baseUrl: string;
    /**
     * 使用的引擎功能。
     */
    features: string[];
}
export declare class ProgrammingFacet {
    private _packerDriverUpdateCount;
    private _asyncIteration;
    static create(engine: IEngineOptions, projectPath: string): Promise<ProgrammingFacet>;
    get engineRoot(): string;
    get engineDistRoot(): string;
    get systemJsHomeDir(): string;
    get systemJsIndexFile(): string;
    get engineImportMapURL(): string;
    get packImportMapURL(): string;
    get packResolutionDetailMapURL(): string;
    loadPackResource(url: string): Promise<{
        type: "json";
        json: unknown;
    } | {
        type: "chunk";
        chunk: import("@cocos/creator-programming-quick-pack/lib/loader").ChunkInfo;
    }>;
    getGlobalImportMap(): Promise<ImportMap & {
        imports: NonNullable<ImportMap["imports"]>;
    }>;
    private reload;
    notifyPackDriverUpdated(): Promise<any>;
    private _staticImportMap;
    private _engineRoot;
    private _engineDistRoot;
    private _systemJsHomeDir;
    private _systemJsBundleFileName;
    private _engineStatsQuery;
    private _quickPackLoader;
    private constructor();
    private _getQuickPackLoader;
    private _initialize;
    private _buildSystemJs;
    private _resetQuickPackLoader;
}
export {};
