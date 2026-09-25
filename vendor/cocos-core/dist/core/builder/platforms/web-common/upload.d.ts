import { IBuildStageTask, IInternalBuildOptions } from '../../@types/protected';
export type UploadEnv = 'dev' | 'fat' | 'prod';
export interface IWebUploadOptions {
    appid?: string;
    app_id?: string;
    versionName?: string;
    accessToken?: string;
    uploadEnv?: UploadEnv;
    codeVersion?: string | number | null;
    encryptKey?: string;
    bridgeBuildToken?: string;
    entryPath?: string;
}
export type IWebUploadTaskOption = IInternalBuildOptions;
export declare function onBeforeUpload(platform: string, root: string, options: IWebUploadTaskOption): Promise<void>;
export declare function upload(task: IBuildStageTask, platform: string, root: string, options: IWebUploadTaskOption): Promise<void>;
export declare function onAfterUpload(task: IBuildStageTask): Promise<void>;
