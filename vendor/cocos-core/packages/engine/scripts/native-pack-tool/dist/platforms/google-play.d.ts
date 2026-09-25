import { CocosParams, NativePackTool } from "../base/default";
export interface IOrientation {
    landscapeLeft: boolean;
    landscapeRight: boolean;
    portrait: boolean;
    upsideDown: boolean;
}
/**
 * 默认 CustomIconList，存放在 static 下的 icon 路径
 */
export interface ICustomIconDpi {
    fileName: string;
    dirName: string;
    dpi: number;
    path: string;
}
export interface ICustomIconInfo {
    type: string;
    display: string;
    list: ICustomIconDpi[];
}
export interface IAndroidParams {
    packageName: string;
    sdkPath: string;
    ndkPath: string;
    javaHome: string;
    javaPath: string;
    androidInstant: boolean;
    maxAspectRatio: string;
    remoteUrl?: string;
    apiLevel: number;
    appABIs: string[];
    keystorePassword: string;
    keystoreAlias: string;
    keystoreAliasPassword: string;
    keystorePath: string;
    inputSDK: boolean;
    orientation: IOrientation;
    appBundle: boolean;
    resizeableActivity: boolean;
    googleBilling: boolean;
    playGames: boolean;
    customIconInfo: ICustomIconInfo;
    isSoFileCompressed: boolean;
}
export declare class GooglePlayPackTool extends NativePackTool {
    params: CocosParams<IAndroidParams>;
    protected firstTimeBuild: boolean;
    protected copyPlatformTemplate(): Promise<void>;
    /**
     * 拷贝自定义 ICON
     * @param type - 类型自定义还是默认
     * @param buildDir - 构建路径
     * @param outputName - 用于获取 CustomIcon
     */
    protected copyCustomIcons(customIconInfo: ICustomIconInfo): Promise<void>;
    protected validatePlatformDirectory(missing: string[]): void;
    create(): Promise<boolean>;
    make(): Promise<boolean>;
    /**
     * Deprecated, only be compatible with historical packaging tools
     */
    protected setOrientation(): Promise<void>;
    private mapOrientationValue;
    protected updateManifest(): Promise<void>;
    protected updateAndroidGradleValues(): Promise<void>;
    /**
     * Deprecated, only be compatible with historical packaging tools
     */
    protected configAndroidInstant(): Promise<void>;
    private generateAppNameValues;
    /**
     * 到对应目录拷贝文件到工程发布目录
     */
    copyToDist(): Promise<boolean>;
    run(): Promise<boolean>;
    getAdbPath(): string;
    getApkPath(): string;
    private outputsDir;
    install(): Promise<boolean>;
    checkConnectedDevices(adbPath: string): boolean;
    checkApkInstalled(adbPath: string): Promise<boolean>;
    startApp(): Promise<boolean>;
}
