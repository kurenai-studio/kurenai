import { EventTarget } from '@cocos/engine/cocos/core/event';

class TouchInputSource{_ccprivate$_eventTarget=new EventTarget;constructor(){}dispatchEventsInCache(){}on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}}

export { TouchInputSource };
