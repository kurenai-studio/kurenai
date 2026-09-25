import { AudioPCMDataView, AudioState, AudioType } from '../type';
import { EventTarget } from '@cocos/engine/cocos/core/event';
import { OperationInfo, OperationQueueable } from '../operation-queue';
export declare class AudioContextAgent {
    static support: boolean;
    private _eventTarget;
    private _context;
    private _isRunning;
    constructor();
    get isRunning(): boolean;
    get currentTime(): number;
    onceRunning(cb: (...args: any[]) => void, target?: any): void;
    offRunning(cb?: (...args: any[]) => void, target?: any): void;
    decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer>;
    runContext(): Promise<void>;
    createBufferSource(audioBuffer?: AudioBuffer, loop?: boolean): AudioBufferSourceNode;
    createGain(volume?: number): GainNode;
    setGainValue(gain: GainNode, volume: number): void;
    connectContext(audioNode: GainNode): void;
}
export declare class OneShotAudioWeb {
    private _duration;
    private _bufferSourceNode;
    private _onPlayCb?;
    private _currentTimer;
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
    private _currentTimer;
    private _volume;
    private _loop;
    private _state;
    private _audioTimer;
    private _runningCallback?;
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
    static load(url: string): Promise<AudioPlayerWeb>;
    static loadNative(url: string): Promise<AudioBuffer>;
    static loadOneShotAudio(url: string, volume: number): Promise<OneShotAudioWeb>;
    get sampleRate(): number;
    getPCMData(channelIndex: number): AudioPCMDataView | undefined;
    private _onInterruptedBegin;
    private _onInterruptedEnd;
    get src(): string;
    get type(): AudioType;
    get state(): AudioState;
    get loop(): boolean;
    set loop(val: boolean);
    get volume(): number;
    set volume(val: number);
    get duration(): number;
    get currentTime(): number;
    private offRunning;
    seek(time: number): Promise<void>;
    play(): Promise<void>;
    private _doPlay;
    private _startSourceNode;
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
