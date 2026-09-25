import { minigame } from 'pal/minigame';
import { screenAdapter } from 'pal/screen-adapter';
import { systemInfo } from 'pal/system-info';
import { Vec2 } from '@cocos/engine/cocos/core/math';
import { EventTarget } from '@cocos/engine/cocos/core/event';
import { EventMouse } from '@cocos/engine/cocos/input/types';
import '../../system-info/enum-type/browser-type.js';
import '../../system-info/enum-type/language.js';
import '../../system-info/enum-type/network-type.js';
import '../../system-info/enum-type/operating-system.js';
import '../../system-info/enum-type/platform.js';
import { Feature } from '../../system-info/enum-type/feature.js';

class MouseInputSource{_ccprivate$_eventTarget=new EventTarget;_ccprivate$_isPressed=false;_ccprivate$_preMousePos=new Vec2;constructor(){if(systemInfo.hasFeature(Feature.EVENT_MOUSE)){this._ccprivate$_registerEvent();}}_ccprivate$_getLocation(event){const windowSize=screenAdapter.windowSize;const dpr=screenAdapter.devicePixelRatio;const x=event.x*dpr;const y=windowSize.height-event.y*dpr;return new Vec2(x,y)}_ccprivate$_registerEvent(){minigame.wx?.onMouseDown?.(this._ccprivate$_createCallback("mouse-down"));minigame.wx?.onMouseMove?.(this._ccprivate$_createCallback("mouse-move"));minigame.wx?.onMouseUp?.(this._ccprivate$_createCallback("mouse-up"));minigame.wx?.onWheel?.(this._ccprivate$_handleMouseWheel.bind(this));}_ccprivate$_createCallback(eventType){return event=>{const location=this._ccprivate$_getLocation(event);let button=event.button;switch(eventType){case "mouse-down":this._ccprivate$_isPressed=true;break;case "mouse-up":this._ccprivate$_isPressed=false;break;case "mouse-move":if(!this._ccprivate$_isPressed){button=EventMouse.BUTTON_MISSING;}break;}const eventMouse=new EventMouse(eventType,false,this._ccprivate$_preMousePos);eventMouse.setLocation(location.x,location.y);eventMouse.setButton(button);eventMouse.movementX=location.x-this._ccprivate$_preMousePos.x;eventMouse.movementY=this._ccprivate$_preMousePos.y-location.y;this._ccprivate$_preMousePos.set(location.x,location.y);this._ccprivate$_eventTarget.emit(eventType,eventMouse);}}_ccprivate$_handleMouseWheel(event){const eventType="mouse-wheel";const location=this._ccprivate$_getLocation(event);const button=event.button;const eventMouse=new EventMouse(eventType,false,this._ccprivate$_preMousePos);eventMouse.setLocation(location.x,location.y);eventMouse.setButton(button);eventMouse.movementX=location.x-this._ccprivate$_preMousePos.x;eventMouse.movementY=this._ccprivate$_preMousePos.y-location.y;eventMouse.setScrollData(event.deltaX,-event.deltaY);this._ccprivate$_preMousePos.set(location.x,location.y);this._ccprivate$_eventTarget.emit("mouse-wheel",eventMouse);}on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}dispatchEventsInCache(){}}

export { MouseInputSource };
