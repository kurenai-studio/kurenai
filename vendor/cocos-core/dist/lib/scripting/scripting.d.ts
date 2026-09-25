import type { AssetChangeInfo } from '../../core/scripting';
import type { ProgrammingFacet } from '../../core/scripting/programming/Facet';
export type * from '../../core/scripting/interface';
export declare function init(projectPath: string): Promise<void>;
export declare function initProgrammingFacet(): Promise<ProgrammingFacet>;
export declare function getProgrammingFacet(): Promise<ProgrammingFacet>;
/**
 * 在独立的子进程中运行项目脚本编译
 * 以避免阻塞主进程
 */
export declare function startCompileScript(assetChanges?: AssetChangeInfo[]): Promise<void>;
export declare function onCompileStart(listener: (e: {
    scope: string;
    taskId?: string;
}) => void): () => void;
export declare function onCompiled(listener: (e: {
    scope: string;
}) => void): () => void;
export declare function onPackBuildStart(listener: (e: {
    targetName: string;
}) => void): () => void;
export declare function onPackBuildEnd(listener: (e: {
    targetName: string;
}) => void): () => void;
