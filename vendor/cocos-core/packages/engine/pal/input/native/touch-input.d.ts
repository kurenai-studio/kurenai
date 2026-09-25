import { EventTouch } from '@cocos/engine/cocos/input/types';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export type TouchCallback = (res: EventTouch) => void;
export declare class TouchInputSource {
    private _eventTarget;
    private _windowManager;
    private _cache;
    constructor();
    private _registerEvent;
    private _createEventCacheCallback;
    dispatchEventsInCache(): void;
    private _dispatchEvent;
    private _getLocation;
    on(eventType: InputEventType, callback: TouchCallback, target?: any): void;
}
