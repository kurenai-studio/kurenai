import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
import { EventHandheld } from '@cocos/engine/cocos/input/types';
import { InputSourcePosition, InputSourceOrientation } from '../input-source';
export type HandheldCallback = (res: EventHandheld) => void;
export declare class HandheldInputDevice {
    get handheldPosition(): InputSourcePosition;
    get handheldOrientation(): InputSourceOrientation;
    private _eventTarget;
    private _handheldPosition;
    private _handheldOrientation;
    private _nativePoseState;
    constructor();
    private _registerEvent;
    /**
     * @engineInternal
     */
    _on(eventType: InputEventType, callback: HandheldCallback, target?: any): void;
    private _updateNativePoseState;
    private _initInputSource;
}
