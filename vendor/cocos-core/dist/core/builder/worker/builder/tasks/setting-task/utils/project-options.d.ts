import { ISettings, IPhysicsConfig } from '../../../../../@types';
import { IInternalBuildOptions } from '../../../../../@types/protected';
import { ISplashSetting } from '../../../../../../engine/@types/config';
/**
 * 根据构建选项补充 settings 数据
 * @param options
 * @param settings
 */
export declare function patchOptionsToSettings(options: IInternalBuildOptions, settings: ISettings): Promise<void>;
export declare function getSplashSettings(useSplashScreen: boolean, preview: boolean, defaultSplashScreen: ISplashSetting, splashScreen: ISplashSetting): Promise<ISplashSetting>;
export declare function getPhysicsConfig(includeModules: string[], physicsConfig: IPhysicsConfig): Promise<IPhysicsConfig>;
export declare function formatSplashScreen(splashScreen: ISplashSetting): ISplashSetting;
