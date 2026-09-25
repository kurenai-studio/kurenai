import { EventTarget } from '@cocos/engine/cocos/core/event';
import { AudioPCMDataView, AudioState, AudioType } from '../type';
import { OperationInfo, OperationQueueable } from '../operation-queue';
export declare class OneShotAudioMinigame {
    private _innerAudioContext;
    private _onPlayCb?;
    get onPlay(): (() => void) | undefined;
    set onPlay(cb: (() => void) | undefined);
    private _onEndCb?;
    get onEnd(): (() => void) | undefined;
    set onEnd(cb: (() => void) | undefined);
    private constructor();
    private _onInterruptedBegin;
    private _onInterruptedEnd;
    play(): void;
    stop(): void;
}
export declare class AudioPlayerMinigame implements OperationQueueable {
    private _innerAudioContext;
    private _state;
    private _cacheTime;
    private _needSeek;
    private _seeking;
    private _onPlay;
    private _onPause;
    private _onStop;
    private _onSeeked;
    private _onEnded;
    private _readyToHandleOnShow;
    private _resetSeekCache;
    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    _eventTarget: EventTarget;
    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    _operationQueue: OperationInfo[];
    constructor(innerAudioContext: InnerAudioContext);
    destroy(): void;
    private _onInterruptedBegin;
    private _onInterruptedEnd;
    private _offEvent;
    get src(): string;
    get type(): AudioType;
    static load(url: string): Promise<AudioPlayerMinigame>;
    static loadNative(url: string): Promise<unknown>;
    static loadOneShotAudio(url: string, volume: number): Promise<OneShotAudioMinigame>;
    get state(): AudioState;
    get loop(): boolean;
    set loop(val: boolean);
    get volume(): number;
    set volume(val: number);
    get duration(): number;
    get currentTime(): number;
    get sampleRate(): number;
    getPCMData(channelIndex: number): AudioPCMDataView | undefined;
    seek(time: number): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    stop(): Promise<void>;
    onInterruptionBegin(cb: () => void): void;
    offInterruptionBegin(cb?: () => void): void;
    onInterruptionEnd(cb: () => void): void;
    offInterruptionEnd(cb?: () => void): void;
    onEnded(cb: () => void): void;
    offEnded(cb?: () => void): void;
}
