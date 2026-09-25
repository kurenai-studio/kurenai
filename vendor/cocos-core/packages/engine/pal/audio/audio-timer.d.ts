/**
 * Tool class to calculate audio current time.
 * For some platforms where audio.currentTime doesn't work well or isn't implemented.
 */
interface IDuration {
    duration: number;
}
export default class AudioTimer {
    private _nativeAudio;
    private _startTime;
    private _startOffset;
    private _isPaused;
    constructor(nativeAudio: IDuration);
    destroy(): void;
    get duration(): number;
    /**
     * Get the current time of audio timer.
     */
    get currentTime(): number;
    private _now;
    private _calculateCurrentTime;
    /**
     * Start the audio timer.
     * Call this method when audio is played.
     */
    start(): void;
    /**
     * Pause the audio timer.
     * Call this method when audio is paused or interrupted.
     */
    pause(): void;
    /**
     * Stop the audio timer.
     * Call this method when audio playing ended or audio is stopped.
     */
    stop(): void;
    /**
     * Seek the audio timer.
     * Call this method when audio is seeked.
     */
    seek(time: number): void;
}
export {};
