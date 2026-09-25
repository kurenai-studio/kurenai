import { AccelerometerCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export declare class AccelerometerInputSource {
    private _intervalInMileSeconds;
    private _accelTimer;
    private _eventTarget;
    private _deviceEventName;
    private _globalEventClass;
    private _didAccelerateFunc;
    constructor();
    private _registerEvent;
    private _unregisterEvent;
    private _didAccelerate;
    start(): void;
    stop(): void;
    setInterval(intervalInMileSeconds: number): void;
    on(eventType: InputEventType, callback: AccelerometerCallback, target?: any): void;
}
