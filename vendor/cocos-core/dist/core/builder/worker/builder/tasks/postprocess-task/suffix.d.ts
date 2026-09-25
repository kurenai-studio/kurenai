import { BuilderAssetCache } from '../../manager/asset';
import { InternalBuildResult } from '../../manager/build-result';
import { IBuilder, IInternalBuildOptions } from '../../../../@types/protected';
export declare const title = "i18n:builder.tasks.build_suffix";
export declare const name = "build-task/suffix";
/**
 * 根据分组信息内的 json 数据，合并后打包到指定位置
 * @param options
 * @param settings
 */
export declare function handle(this: IBuilder, options: IInternalBuildOptions, result: InternalBuildResult, cache: BuilderAssetCache): Promise<void>;
