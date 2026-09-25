import { Component, LightComponent } from 'cc';
declare class LightManager {
    private _lights;
    onEditorOpened(scene: any, isSceneLightOn: boolean): void;
    onComponentAdded(comp: Component): void;
    onComponentRemoved(comp: Component): void;
    disableSceneLights(): void;
    enableSceneLights(): void;
    overrideLightCompFunc(comp: LightComponent): void;
}
export declare const lightManager: LightManager;
export {};
