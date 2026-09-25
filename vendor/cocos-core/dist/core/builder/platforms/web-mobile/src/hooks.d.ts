import { InternalBuildResult, BuilderCache, IBuilder, IInterBuildTaskOption, IBuildStageTask } from '../../../@types/protected';
import { IBuildResult } from './type';
export declare const throwError = true;
export declare function onAfterInit(options: IInterBuildTaskOption<'web-mobile'>, result: InternalBuildResult, cache: BuilderCache): Promise<void>;
export declare function onAfterBundleInit(options: IInterBuildTaskOption<'web-mobile'>): void;
/**
 * 剔除不需要参与构建的资源
 * @param options
 * @param settings
 */
export declare function onBeforeCompressSettings(options: IInterBuildTaskOption<'web-mobile'>, result: InternalBuildResult, cache: BuilderCache): Promise<void>;
export declare function onBeforeCopyBuildTemplate(this: IBuilder, options: IInterBuildTaskOption<'web-mobile'>, result: IBuildResult): Promise<void>;
export declare function onAfterBuild(this: IBuilder, options: IInterBuildTaskOption<'web-mobile'>, result: InternalBuildResult): Promise<void>;
export declare function run(this: IBuildStageTask, root: string): Promise<void>;
