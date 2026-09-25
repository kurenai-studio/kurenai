import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
import { EventHMD } from '@cocos/engine/cocos/input/types';
import { InputSourcePosition, InputSourceOrientation } from '../input-source';
export type HMDCallback = (res: EventHMD) => void;
export declare class HMDInputDevice {
    get viewLeftPosition(): InputSourcePosition;
    get viewLeftOrientation(): InputSourceOrientation;
    get viewRightPosition(): InputSourcePosition;
    get viewRightOrientation(): InputSourceOrientation;
    get headMiddlePosition(): InputSourcePosition;
    get headMiddleOrientation(): InputSourceOrientation;
    private _eventTarget;
    private _viewLeftPosition;
    private _viewLeftOrientation;
    private _viewRightPosition;
    private _viewRightOrientation;
    private _headMiddlePosition;
    private _headMiddleOrientation;
    private _nativePoseState;
    constructor();
    private _registerEvent;
    /**
     * @engineInternal
     */
    _on(eventType: InputEventType, callback: HMDCallback, target?: any): void;
    private _updateNativePoseState;
    private _initInputSource;
}
