import { Component } from 'cc';
import { BaseService } from './core';
import type { ISceneViewEvents, ISceneViewService } from '../../common';
export declare class SceneViewService extends BaseService<ISceneViewEvents> implements ISceneViewService {
    private _sceneViewLight;
    private _lightNode;
    private _isVisible;
    init(): void;
    private _makeSureDirectionLightActive;
    initFromConfig(): Promise<void>;
    saveConfig(): Promise<void>;
    setSceneLightOn(enable: boolean): void;
    querySceneLightOn(): boolean;
    onEditorOpened(): void;
    onEditorClosed(): void;
    onComponentAdded(comp: Component): void;
    onComponentRemoved(comp: Component): void;
    get isVisible(): boolean;
    set isVisible(value: boolean);
    private _onIsSceneLightOn;
}
