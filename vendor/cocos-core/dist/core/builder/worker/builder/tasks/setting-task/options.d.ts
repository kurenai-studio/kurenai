import { IInternalBuildOptions } from '../../../../@types/protected';
import { BuilderAssetCache } from '../../manager/asset';
import { InternalBuildResult } from '../../manager/build-result';
export declare const title = "i18n:builder.tasks.settings.options";
/**
 * 根据选项填充 settings
 * @param options
 * @param settings
 */
export declare function handle(options: IInternalBuildOptions, result: InternalBuildResult, cache: BuilderAssetCache): Promise<void>;
