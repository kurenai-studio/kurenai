import { NativePackTool } from "./default";
export type ISupportPlatform = 'mac-os' | 'mac' | 'ios' | 'android' | 'google-play' | 'ohos';
export declare class NativePackToolManager {
    private PackToolMap;
    static platformToPackTool: Record<string, typeof NativePackTool>;
    static register(platform: string, tool: typeof NativePackTool): void;
    private getTool;
    static getPackTool(platform: string): typeof NativePackTool;
    openWithIDE(platform: string, projectPath: string, IDEDir?: string): Promise<boolean>;
    init(params: any): NativePackTool;
    create(platform: string): Promise<NativePackTool | null>;
    generate(platform: string): Promise<boolean>;
    make(platform: string): Promise<boolean>;
    run(platform: string): Promise<boolean>;
}
export declare const nativePackToolMg: NativePackToolManager;
