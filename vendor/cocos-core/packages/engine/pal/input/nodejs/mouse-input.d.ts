import { EventMouse } from '@cocos/engine/cocos/input/types';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export type MouseCallback = (res: EventMouse) => void;
export declare class MouseInputSource {
    private _eventTarget;
    constructor();
    dispatchMouseDownEvent(nativeMouseEvent: any): void;
    dispatchMouseMoveEvent(nativeMouseEvent: any): void;
    dispatchMouseUpEvent(nativeMouseEvent: any): void;
    dispatchScrollEvent(nativeMouseEvent: any): void;
    dispatchEventsInCache(): void;
    on(eventType: InputEventType, callback: MouseCallback, target?: any): void;
}
