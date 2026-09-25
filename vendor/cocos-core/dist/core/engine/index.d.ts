import { EngineInfo } from './@types/public';
import type { IEngineConfig, IInitEngineInfo, IJointTextureLayoutPreviewResult } from './@types/config';
import type { IModuleConfig, ModuleRenderConfig } from './@types/modules';
/**
 * 整合 engine 的一些编译、配置读取等功能
 */
export interface IEngine {
    getInfo(): EngineInfo;
    getConfig(): IEngineConfig;
    init(enginePath: string): Promise<this>;
    initEngine(info: IInitEngineInfo): Promise<this>;
    queryRenderConfig(): ModuleRenderConfig;
    queryLocalizedRenderConfig(): ModuleRenderConfig;
    queryJointTextureLayoutPreview(): Promise<IJointTextureLayoutPreviewResult>;
    queryLayerBuiltin(): Promise<{
        name: string;
        value: number;
    }[]>;
    querySortingLayerBuiltin(): Promise<ReadonlyArray<{
        id: number;
        name: string;
        value: number;
    }>>;
}
declare class EngineManager implements IEngine {
    private _init;
    private _info;
    private _defaultConfig;
    private _config;
    private _configInstance;
    private get defaultConfig();
    /**
     * 加载引擎包的 i18n 文件（.js CommonJS 模块）
     * 将 packages/engine/editor/i18n/{lang}/*.js 注册到 ENGINE.* 命名空间
     * 递归处理子目录（如 modules/physics.js → ENGINE.physics.*）
     */
    private _loadEngineI18n;
    private createFallbackDefaultConfig;
    private resolveDefaultConfig;
    private getSelectedModuleProjectConfig;
    private createModuleConfigCache;
    private initModuleConfigCache;
    private initRenderConfig2ModuleConfigCache;
    private moduleConfigCache;
    get type(): "3d" | "2d";
    getInfo(): EngineInfo;
    getConfig(useDefault?: boolean): IEngineConfig;
    /**
     * TODO 初始化配置等
     */
    init(enginePath: string): Promise<this>;
    importEditorExtensions(): Promise<void>;
    initEditorExtensions(): Promise<void>;
    /**
     * 加载以及初始化引擎环境
     * @param info 初始化引擎数据
     * @param onBeforeGameInit - 在初始化之前需要做的工作
     * @param onAfterGameInit - 在初始化之后需要做的工作
     */
    initEngine(info: IInitEngineInfo, onBeforeGameInit?: () => Promise<void>, onAfterGameInit?: () => Promise<void>): Promise<this>;
    getGameConfig(serverURL: string, importBase: string, nativeBase: string, isPreview?: boolean): Promise<{
        debugMode: any;
        overrideSettings: {
            engine: {
                builtinAssets: string[];
                macros: Record<string, string | number | boolean> | undefined;
                sortingLayers: {
                    id: number;
                    name: string;
                    value: number;
                }[];
                customLayers: {
                    name: any;
                    bit: number;
                }[];
            };
            profiling: {
                showFPS: boolean;
            };
            screen: {
                frameRate: number;
                exactFitScreen: boolean;
                designResolution: import("./@types/config").IDesignResolution;
            };
            rendering: {
                effectSettingsPath?: string | undefined;
                renderMode: number;
                renderPipeline: string | undefined;
                customPipeline: boolean | undefined;
                highQualityMode: boolean;
            };
            animation: {
                customJointTextureLayouts: import("./@types/config").IResolvedCustomJointTextureLayout[];
            };
            physics: {
                enabled: boolean;
                gravity: import("./@types/config").IVec3Like;
                allowSleep: boolean;
                sleepThreshold: number;
                autoSimulation: boolean;
                fixedTimeStep: number;
                maxSubSteps: number;
                defaultMaterial?: string;
                useNodeChains: boolean;
                collisionMatrix: import("./@types/config").ICollisionMatrix;
                physicsEngine: string;
                physX?: {
                    notPackPhysXLibs: boolean;
                    multiThread: boolean;
                    subThreadCount: number;
                    epsilon: number;
                };
            };
            assets: {
                importBase: string;
                nativeBase: string;
                remoteBundles: string[];
                server: string;
            };
        };
        exactFitScreen: boolean;
    }>;
    getModules(): string[];
    queryInternalAssetList(enginePath: string): Promise<string[]>;
    /**
     * TODO
     * @returns
     */
    queryModuleConfig(): IModuleConfig;
    queryRenderConfig(): ModuleRenderConfig;
    queryLocalizedRenderConfig(): ModuleRenderConfig;
    queryJointTextureLayoutPreview(): Promise<IJointTextureLayoutPreviewResult>;
    queryLayerBuiltin(): Promise<{
        name: string;
        value: number;
    }[]>;
    querySortingLayerBuiltin(): Promise<readonly import("cc").__private._cocos_sorting_sorting_layers__SortingItem[]>;
}
declare const Engine: EngineManager;
export { Engine };
/**
 * 初始化 engine
 * @param enginePath
 * @param projectPath
 * @param serverURL
 */
export declare function initEngine(enginePath: string, projectPath: string, serverURL?: string): Promise<void>;
