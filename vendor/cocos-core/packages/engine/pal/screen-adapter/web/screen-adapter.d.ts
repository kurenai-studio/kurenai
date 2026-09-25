import { IScreenOptions, SafeAreaEdge } from 'pal/screen-adapter';
import { EventTarget } from '@cocos/engine/cocos/core/event/event-target';
import { Size } from '@cocos/engine/cocos/core/math';
import { Orientation } from '../enum-type';
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
    private _updateFrame;
    get safeAreaEdge(): SafeAreaEdge;
    get isProportionalToFrame(): boolean;
    set isProportionalToFrame(v: boolean);
    private _gameFrame?;
    private _gameContainer?;
    private _gameCanvas?;
    private _isProportionalToFrame;
    private _cachedFrameStyle;
    private _cachedContainerStyle;
    private _cbToUpdateFrameBuffer?;
    private _supportFullScreen;
    private _touchEventName;
    private _onFullscreenChange?;
    private _onFullscreenError?;
    private _orientationChangeTimeoutId;
    private _cachedFrameSize;
    private _exactFitScreen;
    private _isHeadlessMode;
    private _fn;
    private _fnGroup;
    private get _windowSizeInCssPixels();
    private get _windowType();
    private _resolutionScale;
    private _orientation;
    private _orientationDevice;
    constructor();
    init(options: IScreenOptions, cbToRebuildFrameBuffer: () => void): void;
    requestFullScreen(): Promise<void>;
    exitFullScreen(): Promise<void>;
    private _registerEvent;
    private _convertToSizeInCssPixels;
    /**
     * The frame size may be from screen size or an external editor options by setting screen.windowSize.
     * @param sizeInCssPixels you need to specify this size when the windowType is SubFrame.
     */
    private _resizeFrame;
    private _getFullscreenTarget;
    private _doRequestFullScreen;
    private _updateFrameState;
    private _updateContainer;
}
export declare const screenAdapter: ScreenAdapter;
export {};
