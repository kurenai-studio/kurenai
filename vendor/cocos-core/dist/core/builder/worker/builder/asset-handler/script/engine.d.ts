import { StatsQuery } from '@cocos/ccbuild';
import { IBuildEngineParam, IBuildSeparateEngineOptions, IBuildSeparateEngineResult } from '../../../../@types/protected';
/**
 * 引擎构建
 * @param options
 * @param settings
 */
export declare function buildEngineX(options: IBuildEngineParam, ccEnvConstants: StatsQuery.ConstantManager.CCEnvConstants, logDest?: string): Promise<{
    metaFile: string;
}>;
export declare function buildSplitEngine(options: IBuildSeparateEngineOptions, logDest?: string): Promise<IBuildSeparateEngineResult>;
export declare function queryEngineImportMap(metaPath: string, enginePath: string, importMapDir: string, baseUrl?: string): Promise<Record<string, string>>;
