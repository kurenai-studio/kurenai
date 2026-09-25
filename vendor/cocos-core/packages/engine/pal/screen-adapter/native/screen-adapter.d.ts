import { EventTarget } from '@cocos/engine/cocos/core/event/event-target';
import { Size } from '@cocos/engine/cocos/core/math';
import { Orientation } from '../enum-type';
export interface SafeAreaEdge {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export type ConfigOrientation = 'auto' | 'landscape' | 'portrait';
export interface IScreenOptions {
    /**
     * Orientation options from editor builder.
     */
    configOrientation: ConfigOrientation;
    /**
     * Determine whether the game frame exact fits the screen.
     * Now it only works on Web platform.
     */
    exactFitScreen: boolean;
    /**
     * Determine whether use headless renderer, which means do not support some screen operations.
     */
    isHeadlessMode: boolean;
}
declare class ScreenAdapter extends EventTarget {
    isFrameRotated: boolean;
    handleResizeEvent: boolean;
    get supportFullScreen(): boolean;
    get isFullScreen(): boolean;
    get devicePixelRatio(): number;
    get windowSize(): Size;
    set windowSize(size: Size);
    get resolution(): Size;
    get resolutionScale(): number;
    set resolutionScale(v: number);
    get orientation(): Orientation;
    set orientation(value: Orientation);
    get safeAreaEdge(): SafeAreaEdge;
    get isProportionalToFrame(): boolean;
    set isProportionalToFrame(v: boolean);
    private _cbToUpdateFrameBuffer?;
    private _resolutionScale;
    private _isProportionalToFrame;
    constructor();
    init(options: IScreenOptions, cbToRebuildFrameBuffer: () => void): void;
    requestFullScreen(): Promise<void>;
    exitFullScreen(): Promise<void>;
    private _registerEvent;
}
export declare const screenAdapter: ScreenAdapter;
export {};
