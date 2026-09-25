import { IBuilder, IInternalBuildOptions } from '../../../../@types/protected';
import { BuilderAssetCache } from '../../manager/asset';
import { InternalBuildResult } from '../../manager/build-result';
export declare const title = "i18n:builder.tasks.sort_asset_bundle";
export declare const name = "data-task/asset_bundle";
export declare function handle(this: IBuilder, options: IInternalBuildOptions, result: InternalBuildResult, cache: BuilderAssetCache): Promise<void>;
