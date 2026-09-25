import { EventAcceleration } from '@cocos/engine/cocos/input/types';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export type AccelerometerCallback = (res: EventAcceleration) => void;
export declare class AccelerometerInputSource {
    private _intervalInSeconds;
    private _intervalId?;
    private _isEnabled;
    private _eventTarget;
    private _didAccelerateFunc;
    constructor();
    private _didAccelerate;
    start(): void;
    stop(): void;
    setInterval(intervalInMileseconds: number): void;
    on(eventType: InputEventType, callback: AccelerometerCallback, target?: any): void;
}
