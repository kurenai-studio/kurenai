import { MouseCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export declare class MouseInputSource {
    private _eventTarget;
    private _isPressed;
    private _preMousePos;
    constructor();
    private _getLocation;
    private _registerEvent;
    private _createCallback;
    private _handleMouseWheel;
    on(eventType: InputEventType, callback: MouseCallback, target?: any): void;
    dispatchEventsInCache(): void;
}
