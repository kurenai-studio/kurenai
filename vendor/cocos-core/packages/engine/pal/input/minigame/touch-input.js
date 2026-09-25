import { minigame } from 'pal/minigame';
import { screenAdapter } from 'pal/screen-adapter';
import { systemInfo } from 'pal/system-info';
import { Vec2 } from '@cocos/engine/cocos/core/math';
import { EventTarget } from '@cocos/engine/cocos/core/event';
import { EventTouch } from '@cocos/engine/cocos/input/types';
import { touchManager } from '../touch-manager.js';
import '../../system-info/enum-type/browser-type.js';
import '../../system-info/enum-type/language.js';
import '../../system-info/enum-type/network-type.js';
import '../../system-info/enum-type/operating-system.js';
import '../../system-info/enum-type/platform.js';
import { Feature } from '../../system-info/enum-type/feature.js';

class TouchInputSource{_ccprivate$_eventTarget=new EventTarget;constructor(){if(systemInfo.hasFeature(Feature.INPUT_TOUCH)){this._ccprivate$_registerEvent();}}_ccprivate$_registerEvent(){minigame.onTouchStart(this._ccprivate$_createCallback("touch-start"));minigame.onTouchMove(this._ccprivate$_createCallback("touch-move"));minigame.onTouchEnd(this._ccprivate$_createCallback("touch-end"));minigame.onTouchCancel(this._ccprivate$_createCallback("touch-cancel"));}_ccprivate$_createCallback(eventType){return event=>{const handleTouches=[];const windowSize=screenAdapter.windowSize;const dpr=screenAdapter.devicePixelRatio;const length=event.changedTouches.length;for(let i=0;i<length;++i){const changedTouch=event.changedTouches[i];const touchID=changedTouch.identifier;if(touchID===null){continue}const location=this._ccprivate$_getLocation(changedTouch,windowSize,dpr);const touch=touchManager.getOrCreateTouch(touchID,location.x,location.y);if(!touch){continue}if(eventType==="touch-end"||eventType==="touch-cancel"){touchManager.releaseTouch(touchID);}handleTouches.push(touch);}if(handleTouches.length>0){const eventTouch=new EventTouch(handleTouches,false,eventType,touchManager.getAllTouches());this._ccprivate$_eventTarget.emit(eventType,eventTouch);}}}_ccprivate$_getLocation(touch,windowSize,dpr){const x=touch.clientX*dpr;const y=windowSize.height-touch.clientY*dpr;return new Vec2(x,y)}on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}dispatchEventsInCache(){}}

export { TouchInputSource };
