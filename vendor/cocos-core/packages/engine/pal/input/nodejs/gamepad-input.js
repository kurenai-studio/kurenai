import { systemInfo } from 'pal/system-info';
import '../../system-info/enum-type/browser-type.js';
import '../../system-info/enum-type/language.js';
import '../../system-info/enum-type/network-type.js';
import '../../system-info/enum-type/operating-system.js';
import '../../system-info/enum-type/platform.js';
import { Feature } from '../../system-info/enum-type/feature.js';
import { EventTarget } from '@cocos/engine/cocos/core/event/event-target';

class GamepadInputDevice{static all=[];static xr=null;get buttonNorth(){return this._ccprivate$_buttonNorth}get buttonEast(){return this._ccprivate$_buttonEast}get buttonWest(){return this._ccprivate$_buttonWest}get buttonSouth(){return this._ccprivate$_buttonSouth}get buttonL1(){return this._ccprivate$_buttonL1}get buttonL2(){return this._ccprivate$_buttonL2}get buttonL3(){return this._ccprivate$_buttonL3}get buttonR1(){return this._ccprivate$_buttonR1}get buttonR2(){return this._ccprivate$_buttonR2}get buttonR3(){return this._ccprivate$_buttonR3}get buttonShare(){return this._ccprivate$_buttonShare}get buttonOptions(){return this._ccprivate$_buttonOptions}get dpad(){return this._ccprivate$_dpad}get leftStick(){return this._ccprivate$_leftStick}get rightStick(){return this._ccprivate$_rightStick}get buttonStart(){return this._ccprivate$_buttonStart}get gripLeft(){return this._ccprivate$_gripLeft}get gripRight(){return this._ccprivate$_gripRight}get handLeftPosition(){return this._ccprivate$_handLeftPosition}get handLeftOrientation(){return this._ccprivate$_handLeftOrientation}get handRightPosition(){return this._ccprivate$_handRightPosition}get handRightOrientation(){return this._ccprivate$_handRightOrientation}get aimLeftPosition(){return this._ccprivate$_aimLeftPosition}get aimLeftOrientation(){return this._ccprivate$_aimLeftOrientation}get aimRightPosition(){return this._ccprivate$_aimRightPosition}get aimRightOrientation(){return this._ccprivate$_aimRightOrientation}get deviceId(){return 0}get connected(){return false}static _ccprivate$_eventTarget=new EventTarget;constructor(deviceId){}static _init(){if(!systemInfo.hasFeature(Feature.EVENT_GAMEPAD)){return}}static _on(eventType,cb,target){GamepadInputDevice._ccprivate$_eventTarget.on(eventType,cb,target);}}

export { GamepadInputDevice };
