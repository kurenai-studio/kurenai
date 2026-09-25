import { InputEventType } from '@cocos/engine/cocos/input/types/event-enum';
import { EventGamepad } from '@cocos/engine/cocos/input/types';
import { InputSourceButton, InputSourceDpad, InputSourceOrientation, InputSourcePosition, InputSourceStick } from '../input-source';
export type GamepadCallback = (res: EventGamepad) => void;
export declare class GamepadInputDevice {
    static all: GamepadInputDevice[];
    static xr: (GamepadInputDevice | null);
    get buttonNorth(): InputSourceButton;
    get buttonEast(): InputSourceButton;
    get buttonWest(): InputSourceButton;
    get buttonSouth(): InputSourceButton;
    get buttonL1(): InputSourceButton;
    get buttonL2(): InputSourceButton;
    get buttonL3(): InputSourceButton;
    get buttonR1(): InputSourceButton;
    get buttonR2(): InputSourceButton;
    get buttonR3(): InputSourceButton;
    get buttonShare(): InputSourceButton;
    get buttonOptions(): InputSourceButton;
    get dpad(): InputSourceDpad;
    get leftStick(): InputSourceStick;
    get rightStick(): InputSourceStick;
    get buttonStart(): InputSourceButton;
    get gripLeft(): InputSourceButton;
    get gripRight(): InputSourceButton;
    get handLeftPosition(): InputSourcePosition;
    get handLeftOrientation(): InputSourceOrientation;
    get handRightPosition(): InputSourcePosition;
    get handRightOrientation(): InputSourceOrientation;
    get aimLeftPosition(): InputSourcePosition;
    get aimLeftOrientation(): InputSourceOrientation;
    get aimRightPosition(): InputSourcePosition;
    get aimRightOrientation(): InputSourceOrientation;
    get deviceId(): number;
    get connected(): boolean;
    private static _eventTarget;
    private _buttonNorth;
    private _buttonEast;
    private _buttonWest;
    private _buttonSouth;
    private _buttonL1;
    private _buttonL2;
    private _buttonL3;
    private _buttonR1;
    private _buttonR2;
    private _buttonR3;
    private _buttonShare;
    private _buttonOptions;
    private _dpad;
    private _leftStick;
    private _rightStick;
    private _buttonStart;
    private _gripLeft;
    private _gripRight;
    private _handLeftPosition;
    private _handLeftOrientation;
    private _handRightPosition;
    private _handRightOrientation;
    private _aimLeftPosition;
    private _aimLeftOrientation;
    private _aimRightPosition;
    private _aimRightOrientation;
    constructor(deviceId: number);
    /**
     * @engineInternal
     */
    static _init(): void;
    /**
     * @engineInternal
     */
    static _on(eventType: InputEventType, cb: GamepadCallback, target?: any): void;
}
