import { BuilderAssetCache } from '../../manager/asset';
import { InternalBuildResult } from '../../manager/build-result';
import { IBuilder, IInternalBuildOptions } from '../../../../@types/protected';
export declare const title = "i18n:builder.tasks.build_script";
export declare function handle(this: IBuilder, options: IInternalBuildOptions, result: InternalBuildResult, cache: BuilderAssetCache): Promise<void>;
