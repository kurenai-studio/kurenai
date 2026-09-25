import { AccelerometerCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export declare class AccelerometerInputSource {
    private _isStarted;
    private _accelMode;
    private _eventTarget;
    private _didAccelerateFunc;
    constructor();
    private _registerEvent;
    private _unregisterEvent;
    private _didAccelerate;
    start(): void;
    stop(): void;
    setInterval(intervalInMileseconds: number): void;
    on(eventType: InputEventType, callback: AccelerometerCallback, target?: any): void;
}
