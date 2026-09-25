import { IBuildStageTask, IInternalBuildOptions } from '../../@types/protected';
export interface IWebPublishOptions {
    appid?: string;
    app_id?: string;
    versionName?: string;
    accessToken?: string;
}
export type IWebPublishTaskOption = IInternalBuildOptions;
/**
 * Publish stage (placeholder implementation).
 *
 * Mirrors the structure of the upload stage, but the real publish/release API
 * call is not wired yet. It consumes the `packageId` produced by a prior
 * successful upload stage and writes the publish result back onto
 * `task.buildExitRes.custom.publish`.
 */
export declare function publish(task: IBuildStageTask, platform: string, root: string, options: IWebPublishTaskOption): Promise<void>;
