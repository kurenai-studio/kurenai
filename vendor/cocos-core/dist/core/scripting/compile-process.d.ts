import { AssetChangeInfo } from './packer-driver/asset-db-interop';
export interface ICompileWorkerData {
    projectPath: string;
    enginePath: string;
    features: string[];
    assetChanges?: AssetChangeInfo[];
}
/**
 * 在独立的子进程中运行项目脚本编译
 * 避免 QuickPacker 的 Rollup 等繁重任务阻塞主进程事件循环
 */
export declare function startCompileScriptProcess(data: ICompileWorkerData, completeCallback: () => void): Promise<void>;
