import { CocosParams, NativePackTool } from "../base/default";
export interface IOrientation {
    landscapeLeft: boolean;
    landscapeRight: boolean;
    portrait: boolean;
    upsideDown: boolean;
}
export interface OHOSParam {
    sdkPath: string;
    ndkPath: string;
    orientation: IOrientation;
    packageName: string;
}
export declare class OHOSPackTool extends NativePackTool {
    params: CocosParams<OHOSParam>;
    get projectDistPath(): string;
    create(): Promise<boolean>;
    make(): Promise<boolean>;
    run(): Promise<boolean>;
    private selectHap;
    private selectHapFile;
    get hdcPath(): string | null;
    randString(n: number): string;
}
