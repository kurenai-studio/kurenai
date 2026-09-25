import { TouchCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export declare class TouchInputSource {
    private _eventTarget;
    constructor();
    private _registerEvent;
    private _createCallback;
    private _getLocation;
    on(eventType: InputEventType, callback: TouchCallback, target?: any): void;
    dispatchEventsInCache(): void;
}
