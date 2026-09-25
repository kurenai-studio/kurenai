import * as ccBuild from '@cocos/ccbuild';
export type MangleConfigPlatformType = Exclude<ccBuild.StatsQuery.ConstantManager.PlatformType, 'WEB_MOBILE' | 'WEB_DESKTOP' | 'BAIDU' | 'WEB_EDITOR' | 'COCOSPLAY' | 'QTT' | 'LINKSURE' | 'NATIVE_EDITOR' | 'TAOBAO' | 'WECHAT_MINI_PROGRAM' | 'INVALID_PLATFORM'> | 'COMMON' | 'MINIGAME';
export interface IMangleConfigValue {
    extends?: MangleConfigPlatformType;
    mangleProtected?: boolean;
    mangleList?: string[];
    dontMangleList?: string[];
}
export declare const defaultMangleConfig: Record<MangleConfigPlatformType, IMangleConfigValue> & {
    __doc_url__?: string;
};
