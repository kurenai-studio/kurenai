import { EventAcceleration } from '@cocos/engine/cocos/input/types';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export type AccelerometerCallback = (res: EventAcceleration) => void;
export declare class AccelerometerInputSource {
    constructor();
    start(): void;
    stop(): void;
    setInterval(intervalInMileseconds: number): void;
    on(eventType: InputEventType, callback: AccelerometerCallback, target?: any): void;
}
