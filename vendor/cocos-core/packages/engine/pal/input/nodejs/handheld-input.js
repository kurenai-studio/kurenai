import { EventTarget } from '@cocos/engine/cocos/core/event/event-target';

class HandheldInputDevice{get handheldPosition(){return this._ccprivate$_handheldPosition}get handheldOrientation(){return this._ccprivate$_handheldOrientation}_ccprivate$_eventTarget=new EventTarget;constructor(){}_on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}}

export { HandheldInputDevice };
