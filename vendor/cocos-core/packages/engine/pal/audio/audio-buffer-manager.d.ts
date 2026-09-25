/**
 * This is a manager to manage the cache of audio buffer for web audio.
 * @mangle
 */
declare class AudioBufferManager {
    private _audioBufferDataMap;
    addCache(url: string, audioBuffer: AudioBuffer): void;
    retainCache(url: string): void;
    getCache(url: string): AudioBuffer | null | undefined;
    tryReleasingCache(url: string): void;
}
export declare const audioBufferManager: AudioBufferManager;
export {};
