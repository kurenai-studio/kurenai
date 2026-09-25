import { CocosParams } from '../base/default';
import { MacOSPackTool } from "./mac-os";
export interface IOrientation {
    landscapeLeft: boolean;
    landscapeRight: boolean;
    portrait: boolean;
    upsideDown: boolean;
}
export interface IOSParams {
    orientation: IOrientation;
    bundleId: string;
    skipUpdateXcodeProject: boolean;
    teamid: string;
    iphoneos: boolean;
    simulator?: boolean;
}
export declare class IOSPackTool extends MacOSPackTool {
    params: CocosParams<IOSParams>;
    create(): Promise<boolean>;
    protected setOrientation(): Promise<void>;
    generate(): Promise<boolean>;
    make(): Promise<boolean>;
    run(): Promise<boolean>;
    selectSimulatorId(): string;
    selectIosDevices(): string[];
    readBundleId(): string | null;
    queryIosDevice(): string | null;
    runIosDevice(): Promise<boolean>;
    runIosSimulator(): Promise<boolean>;
}
