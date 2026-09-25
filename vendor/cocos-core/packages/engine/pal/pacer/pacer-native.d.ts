export declare class Pacer {
    private _rafHandle;
    private _onTick;
    private _targetFrameRate;
    private _isPlaying;
    private _updateCallback;
    constructor();
    get targetFrameRate(): number;
    set targetFrameRate(val: number);
    set onTick(val: (() => void) | null);
    get onTick(): (() => void) | null;
    start(): void;
    stop(): void;
}
