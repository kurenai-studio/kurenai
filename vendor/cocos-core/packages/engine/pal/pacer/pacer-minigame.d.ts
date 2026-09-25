export declare class Pacer {
    private _rafHandle;
    private _onTick;
    private _updateCallback;
    private _targetFrameRate;
    private _isPlaying;
    constructor();
    get targetFrameRate(): number;
    set targetFrameRate(val: number);
    set onTick(val: (() => void) | null);
    get onTick(): (() => void) | null;
    start(): void;
    stop(): void;
}
