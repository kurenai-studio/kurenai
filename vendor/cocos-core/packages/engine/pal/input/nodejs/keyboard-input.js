import { EventTarget } from '@cocos/engine/cocos/core/event';

class KeyboardInputSource{_ccprivate$_eventTarget=new EventTarget;constructor(){}dispatchKeyboardDownEvent(nativeKeyboardEvent){}dispatchKeyboardUpEvent(nativeKeyboardEvent){}on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}}

export { KeyboardInputSource };
