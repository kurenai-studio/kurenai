import { AudioLoadOptions, AudioType, AudioState, AudioPCMDataView } from '../type';
import { AudioPlayerMinigame } from './player-minigame';
import { AudioPlayerWeb } from './player-web';
type AbstractAudioPlayer = AudioPlayerMinigame | AudioPlayerWeb;
export declare class OneShotAudio {
    private _audio;
    get onPlay(): (() => void) | undefined;
    set onPlay(v: (() => void) | undefined);
    get onEnd(): (() => void) | undefined;
    set onEnd(v: (() => void) | undefined);
    private constructor();
    play(): void;
    stop(): void;
}
export declare class AudioPlayer {
    private _player;
    constructor(player: AbstractAudioPlayer);
    static load(url: string, opts?: AudioLoadOptions): Promise<AudioPlayer>;
    destroy(): void;
    static loadNative(url: string, opts?: AudioLoadOptions): Promise<unknown>;
    static loadOneShotAudio(url: string, volume: number, opts?: AudioLoadOptions): Promise<OneShotAudio>;
    static readonly maxAudioChannel = 10;
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
export {};
