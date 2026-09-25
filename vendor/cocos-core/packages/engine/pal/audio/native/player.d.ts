import { AudioType, AudioState, AudioPCMDataView, AudioLoadOptions } from '../type';
import { EventTarget } from '@cocos/engine/cocos/core/event';
import { OperationInfo, OperationQueueable } from '../operation-queue';
export declare class OneShotAudio {
    private _id;
    private _url;
    private _volume;
    private _onPlayCb?;
    get onPlay(): (() => void) | undefined;
    set onPlay(cb: (() => void) | undefined);
    private _onEndCb?;
    get onEnd(): (() => void) | undefined;
    set onEnd(cb: (() => void) | undefined);
    private constructor();
    play(): void;
    stop(): void;
}
export declare class AudioPlayer implements OperationQueueable {
    private _url;
    private _id;
    private _state;
    private _pcmHeader;
    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    _eventTarget: EventTarget;
    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    _operationQueue: OperationInfo[];
    private _cachedState;
    constructor(url: string);
    destroy(): void;
    private _onInterruptedBegin;
    private _onInterruptedEnd;
    static load(url: string, opts?: AudioLoadOptions): Promise<AudioPlayer>;
    static loadNative(url: string, opts?: AudioLoadOptions): Promise<unknown>;
    static loadOneShotAudio(url: string, volume: number, opts?: AudioLoadOptions): Promise<OneShotAudio>;
    static readonly maxAudioChannel: number;
    private get _isValid();
    get src(): string;
    get type(): AudioType;
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
