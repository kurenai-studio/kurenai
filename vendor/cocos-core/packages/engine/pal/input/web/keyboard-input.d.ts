import { KeyboardCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export declare class KeyboardInputSource {
    private _eventTarget;
    constructor();
    dispatchKeyboardDownEvent(nativeKeyboardEvent: KeyboardEvent): void;
    dispatchKeyboardUpEvent(nativeKeyboardEvent: KeyboardEvent): void;
    on(eventType: InputEventType, callback: KeyboardCallback, target?: any): void;
    private _registerEvent;
    private _getInputEvent;
    private _handleKeyboardDown;
    private _handleKeyboardUp;
}
