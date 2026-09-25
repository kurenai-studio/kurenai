import { EventEmitter } from 'events';
export interface IResolutionData {
    width: number;
    height: number;
}
declare class SceneViewData extends EventEmitter {
    private _targetResolution;
    private _targetAspect;
    private _isSceneLightOn;
    get targetResolution(): IResolutionData;
    set targetResolution(value: IResolutionData);
    get targetAspect(): number;
    get targetWidth(): number;
    get targetHeight(): number;
    get isSceneLightOn(): boolean;
    set isSceneLightOn(value: boolean);
    initFromConfig(): Promise<void>;
    saveConfig(): Promise<void>;
}
export declare const sceneViewData: SceneViewData;
export {};
