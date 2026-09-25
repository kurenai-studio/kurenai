import { EventTarget } from '@cocos/engine/cocos/core/event';
import { OperationInfo, OperationQueueable } from '../operation-queue';
import { AudioPCMDataView, AudioState, AudioType } from '../type';
export declare class OneShotAudioWeb {
    private _bufferSourceNode;
    private _onPlayCb?;
    private _url;
    get onPlay(): (() => void) | undefined;
    set onPlay(cb: (() => void) | undefined);
    private _onEndCb?;
    get onEnd(): (() => void) | undefined;
    set onEnd(cb: (() => void) | undefined);
    private constructor();
    play(): void;
    stop(): void;
}
export declare class AudioPlayerWeb implements OperationQueueable {
    private _src;
    private _audioBuffer;
    private _sourceNode?;
    private _gainNode;
    private _volume;
    private _loop;
    private _state;
    private _audioTimer;
    private _readyToHandleOnShow;
    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    _eventTarget: EventTarget;
    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    _operationQueue: OperationInfo[];
    constructor(audioBuffer: AudioBuffer, url: string);
    destroy(): void;
    private _onInterruptedBegin;
    private _onInterruptedEnd;
    static load(url: string): Promise<AudioPlayerWeb>;
    static loadNative(url: string): Promise<AudioBuffer>;
    static loadOneShotAudio(url: string, volume: number): Promise<OneShotAudioWeb>;
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
    private _doPlay;
    private _stopSourceNode;
    pause(): Promise<void>;
    stop(): Promise<void>;
    onInterruptionBegin(cb: () => void): void;
    offInterruptionBegin(cb?: () => void): void;
    onInterruptionEnd(cb: () => void): void;
    offInterruptionEnd(cb?: () => void): void;
    onEnded(cb: () => void): void;
    offEnded(cb?: () => void): void;
}
