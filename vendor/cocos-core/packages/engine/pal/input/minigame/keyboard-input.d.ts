import { KeyboardCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
export declare class KeyboardInputSource {
    private _eventTarget;
    private _keyStateMap;
    constructor();
    private _registerEvent;
    private _getInputEvent;
    on(eventType: InputEventType, callback: KeyboardCallback, target?: any): void;
}
