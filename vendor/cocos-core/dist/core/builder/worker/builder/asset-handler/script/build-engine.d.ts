/**
 * 执行环境为标准 node 环境，请不要使用 Editor 或者 Electron 接口
 */
import { buildEngine } from '@cocos/ccbuild';
export interface buildEngineOptions extends buildEngine.Options {
    metaFile: string;
    mangleConfigJsonMtime?: number;
}
/**
 * 编译引擎代码，执行环境为标准 node 环境，请不要使用 Editor 或者 Electron 接口，所以需要使用的字段都需要在外部整理好传入
 * @param options 编译引擎参数
 */
export declare function buildEngineCommand(options: buildEngineOptions): Promise<void>;
export { buildSeparateEngine } from './separate-engine';
