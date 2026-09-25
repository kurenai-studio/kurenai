import { AndroidPackTool } from "./android";
export declare class HuaweiAGCPackTool extends AndroidPackTool {
    private readonly _platform;
    /**
     * 拷贝 android 平台模板到 project/native/engine/huawei-agc 目录下
     */
    protected copyPlatformTemplate(): Promise<void>;
    /**
     * 校验 engine/template/android 和 project/native/engine/huawei-agc 下的模板文件
     */
    protected validatePlatformDirectory(missing: string[]): void;
}
