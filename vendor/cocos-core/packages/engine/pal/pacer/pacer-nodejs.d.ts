export declare class Pacer {
    private _stHandle;
    private _onTick;
    private _targetFrameRate;
    private _frameTime;
    private _startTime;
    private _isPlaying;
    constructor();
    get targetFrameRate(): number;
    set targetFrameRate(val: number);
    set onTick(val: (() => void) | null);
    get onTick(): (() => void) | null;
    start(): void;
    stop(): void;
    private _stTime;
    private _ctTime;
}
