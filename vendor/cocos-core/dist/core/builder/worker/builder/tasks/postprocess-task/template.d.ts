import { BuilderAssetCache } from '../../manager/asset';
import { InternalBuildResult } from '../../manager/build-result';
import { IBuilder, IInternalBuildOptions } from '../../../../@types/protected';
export declare const title = "i18n:builder.tasks.build_template";
export declare const name = "build-task/template";
/**
 * application.js 模板编译
 * @param options
 * @param settings
 */
export declare function handle(this: IBuilder, options: IInternalBuildOptions, result: InternalBuildResult, cache: BuilderAssetCache): Promise<void>;
