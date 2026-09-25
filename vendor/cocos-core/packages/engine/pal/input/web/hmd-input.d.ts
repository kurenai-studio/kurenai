import { HMDCallback } from 'pal/input';
import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
import { InputSourcePosition, InputSourceOrientation } from '../input-source';
export declare class HMDInputDevice {
    get viewLeftPosition(): InputSourcePosition;
    get viewLeftOrientation(): InputSourceOrientation;
    get viewRightPosition(): InputSourcePosition;
    get viewRightOrientation(): InputSourceOrientation;
    get headMiddlePosition(): InputSourcePosition;
    get headMiddleOrientation(): InputSourceOrientation;
    private _eventTarget;
    private _intervalId;
    private _viewLeftPosition;
    private _viewLeftOrientation;
    private _viewRightPosition;
    private _viewRightOrientation;
    private _headMiddlePosition;
    private _headMiddleOrientation;
    private _webPoseState;
    constructor();
    private _ensureDirectorDefined;
    private _registerEvent;
    private _scanHmd;
    /**
     * @engineInternal
     */
    _on(eventType: InputEventType, callback: HMDCallback, target?: any): void;
    private _updateWebPoseState;
    private _initInputSource;
}
