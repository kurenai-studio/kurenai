export declare class Pacer {
    private _stHandle;
    private _onTick;
    private _targetFrameRate;
    private _frameTime;
    private _startTime;
    private _isPlaying;
    private _frameCount;
    private _callback;
    private _rAF;
    private _cAF;
    constructor();
    get targetFrameRate(): number;
    set targetFrameRate(val: number);
    set onTick(val: (() => void) | null);
    get onTick(): (() => void) | null;
    start(): void;
    stop(): void;
    _handleRAF: (stamp: number) => void;
    private _stTime;
    private _ctTime;
}
