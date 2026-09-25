export declare enum AudioEvent {
    PLAYED = "play",
    PAUSED = "pause",
    STOPPED = "stop",
    SEEKED = "seeked",
    ENDED = "ended",
    INTERRUPTION_BEGIN = "interruptionBegin",
    INTERRUPTION_END = "interruptionEnd",
    USER_GESTURE = "on_gesture"
}
export declare enum AudioType {
    DOM_AUDIO = 0,
    WEB_AUDIO = 1,
    MINIGAME_AUDIO = 2,
    NATIVE_AUDIO = 3,
    UNKNOWN_AUDIO = 4
}
export interface AudioLoadOptions {
    audioLoadMode?: AudioType;
}
export declare enum AudioState {
    INIT = 0,
    PLAYING = 1,
    PAUSED = 2,
    STOPPED = 3,
    INTERRUPTED = 4
}
export type AudioBufferView = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
export declare class AudioPCMDataView {
    private _bufferView;
    private _normalizeFactor;
    constructor(arrayBufferView: AudioBufferView, normalizeFactor: number);
    constructor(arrayBuffer: ArrayBuffer, Ctor: Constructor<AudioBufferView>, normalizeFactor: number);
    get length(): number;
    getData(offset: number): number;
}
