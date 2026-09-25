import { HandheldCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
import { InputSourcePosition, InputSourceOrientation } from '../input-source';
export declare class HandheldInputDevice {
    get handheldPosition(): InputSourcePosition;
    get handheldOrientation(): InputSourceOrientation;
    private _eventTarget;
    private _handheldPosition;
    private _handheldOrientation;
    constructor();
    /**
     * @engineInternal
     */
    _on(eventType: InputEventType, callback: HandheldCallback, target?: any): void;
    private _initInputSource;
}
