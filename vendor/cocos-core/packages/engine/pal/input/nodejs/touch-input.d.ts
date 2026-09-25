import { EventTouch } from '@cocos/engine/cocos/input/types';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export type TouchCallback = (res: EventTouch) => void;
export declare class TouchInputSource {
    private _eventTarget;
    constructor();
    dispatchEventsInCache(): void;
    on(eventType: InputEventType, callback: TouchCallback, target?: any): void;
}
