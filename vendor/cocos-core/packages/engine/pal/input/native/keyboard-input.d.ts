import { EventKeyboard } from '@cocos/engine/cocos/input/types';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export type KeyboardCallback = (res: EventKeyboard) => void;
export declare class KeyboardInputSource {
    private _eventTarget;
    private _keyStateMap;
    private _handleKeyboardDown;
    private _handleKeyboardUp;
    constructor();
    dispatchKeyboardDownEvent(nativeKeyboardEvent: jsb.KeyboardEvent): void;
    dispatchKeyboardUpEvent(nativeKeyboardEvent: jsb.KeyboardEvent): void;
    private _registerEvent;
    private _getInputEvent;
    on(eventType: InputEventType, callback: KeyboardCallback, target?: any): void;
}
