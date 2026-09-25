import { EventTarget } from '@cocos/engine/cocos/core/event/event-target';
import { InputSourcePosition, InputSourceOrientation } from '../input-source.js';
import { Vec3, Quat } from '@cocos/engine/cocos/core/math';

class HandheldInputDevice{get handheldPosition(){return this._ccprivate$_handheldPosition}get handheldOrientation(){return this._ccprivate$_handheldOrientation}_ccprivate$_eventTarget=new EventTarget;constructor(){this._ccprivate$_initInputSource();}_on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}_ccprivate$_initInputSource(){this._ccprivate$_handheldPosition=new InputSourcePosition;this._ccprivate$_handheldPosition.getValue=()=>Vec3.ZERO;this._ccprivate$_handheldOrientation=new InputSourceOrientation;this._ccprivate$_handheldOrientation.getValue=()=>Quat.IDENTITY;}}

export { HandheldInputDevice };
