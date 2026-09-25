import { TEST, EDITOR, USE_XR } from 'internal:constants';
import { systemInfo } from 'pal/system-info';
import { screenAdapter } from 'pal/screen-adapter';
import { Rect, Vec2 } from '@cocos/engine/cocos/core/math';
import { EventTarget } from '@cocos/engine/cocos/core/event';
import { EventTouch } from '@cocos/engine/cocos/input/types';
import { touchManager } from '../touch-manager.js';
import '../../system-info/enum-type/browser-type.js';
import '../../system-info/enum-type/language.js';
import '../../system-info/enum-type/network-type.js';
import '../../system-info/enum-type/operating-system.js';
import '../../system-info/enum-type/platform.js';
import { Feature } from '../../system-info/enum-type/feature.js';
import { warn } from '@cocos/engine/cocos/core/platform/debug';

class TouchInputSource{_ccprivate$_canvas;_ccprivate$_eventTarget=new EventTarget;constructor(){if(systemInfo.hasFeature(Feature.INPUT_TOUCH)){this._ccprivate$_canvas=document.getElementById("GameCanvas");if(!this._ccprivate$_canvas&&!TEST&&!EDITOR){warn("failed to access canvas");}if(!EDITOR){this._ccprivate$_registerEvent();}}}_ccprivate$_registerEvent(){this._ccprivate$_canvas?.addEventListener("touchstart",this._ccprivate$_createCallback("touch-start"));this._ccprivate$_canvas?.addEventListener("touchmove",this._ccprivate$_createCallback("touch-move"));this._ccprivate$_canvas?.addEventListener("touchend",this._ccprivate$_createCallback("touch-end"));this._ccprivate$_canvas?.addEventListener("touchcancel",this._ccprivate$_createCallback("touch-cancel"));}_ccprivate$_createCallback(eventType){return event=>{const canvasRect=this._ccprivate$_getCanvasRect();const handleTouches=[];const length=event.changedTouches.length;for(let i=0;i<length;++i){const changedTouch=event.changedTouches[i];const touchID=changedTouch.identifier;if(touchID===null){continue}const location=this._ccprivate$_getLocation(changedTouch,canvasRect);const touch=touchManager.getOrCreateTouch(touchID,location.x,location.y);if(!touch){continue}if(eventType==="touch-end"||eventType==="touch-cancel"){touchManager.releaseTouch(touchID);}handleTouches.push(touch);}event.stopPropagation();if(event.target===this._ccprivate$_canvas){event.preventDefault();}if(eventType==="touch-start"){this._ccprivate$_canvas?.focus();}if(handleTouches.length>0){const eventTouch=new EventTouch(handleTouches,false,eventType,touchManager.getAllTouches());this._ccprivate$_eventTarget.emit(eventType,eventTouch);}}}_ccprivate$_getCanvasRect(){const canvas=this._ccprivate$_canvas;const box=canvas?.getBoundingClientRect();if(box){return new Rect(box.x,box.y,box.width,box.height)}return new Rect(0,0,0,0)}_ccprivate$_getLocation(touch,canvasRect){if(USE_XR&&globalThis.__globalXR&&globalThis.__globalXR.ar&&globalThis.__globalXR.ar.isWebXR()){return new Vec2(touch.clientX,touch.clientY)}let x=touch.clientX-canvasRect.x;let y=canvasRect.y+canvasRect.height-touch.clientY;if(screenAdapter.isFrameRotated){const tmp=x;x=canvasRect.height-y;y=tmp;}const dpr=screenAdapter.devicePixelRatio;x*=dpr;y*=dpr;return new Vec2(x,y)}on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}dispatchEventsInCache(){}}

export { TouchInputSource };
