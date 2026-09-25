import { CocosParams } from '../base/default';
import { MacOSPackTool } from "./mac-os";
export interface IMacParams {
    bundleId: string;
    skipUpdateXcodeProject: boolean;
}
export declare class MacPackTool extends MacOSPackTool {
    params: CocosParams<IMacParams>;
    create(): Promise<boolean>;
    generate(): Promise<boolean>;
    make(): Promise<boolean>;
    run(): Promise<boolean>;
    private macOpen;
    private macRun;
}
