import { EventTarget } from '@cocos/engine/cocos/core/event';

class MouseInputSource{_ccprivate$_eventTarget=new EventTarget;constructor(){}dispatchMouseDownEvent(nativeMouseEvent){}dispatchMouseMoveEvent(nativeMouseEvent){}dispatchMouseUpEvent(nativeMouseEvent){}dispatchScrollEvent(nativeMouseEvent){}dispatchEventsInCache(){}on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}}

export { MouseInputSource };
