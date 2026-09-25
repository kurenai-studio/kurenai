import { CocosParams, NativePackTool } from "../base/default";
export interface IOrientation {
    landscapeLeft: boolean;
    landscapeRight: boolean;
    portrait: boolean;
    upsideDown: boolean;
}
export interface deviceTypes {
    phone: boolean;
    tablet: boolean;
    pc_2in1: boolean;
    tv: boolean;
    wearable: boolean;
    car: boolean;
    default: boolean;
}
export interface OHOSParam {
    sdkPath: string;
    ndkPath: string;
    orientation: IOrientation;
    deviceTypes: deviceTypes;
    packageName: string;
    appABIs: string[];
    apiLevel: number;
}
export declare class HarmonyOSNextPackTool extends NativePackTool {
    params: CocosParams<OHOSParam>;
    initEnv(): void;
    get projectDistPath(): string;
    create(): Promise<boolean>;
    make(): Promise<boolean>;
    static openWithIDE(projPath: string, DevEcoDir: string): Promise<boolean>;
    run(): Promise<boolean>;
    findHDCTool(sdkPath: string): string;
    private readJSON5Sync;
    private selectHapFile;
    get hdcPath(): string | null;
    randString(n: number): string;
}
