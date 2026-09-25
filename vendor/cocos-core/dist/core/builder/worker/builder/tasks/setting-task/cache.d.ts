import { BuilderAssetCache } from '../../manager/asset';
import { InternalBuildResult } from '../../manager/build-result';
import { IBuilder, IInternalBuildOptions } from '../../../../@types/protected';
export declare function handle(this: IBuilder, options: IInternalBuildOptions, result: InternalBuildResult, cache: BuilderAssetCache): Promise<void>;
