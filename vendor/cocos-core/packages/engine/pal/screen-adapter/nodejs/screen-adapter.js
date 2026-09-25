import { EventTarget } from '@cocos/engine/cocos/core/event/event-target';
import { Size } from '@cocos/engine/cocos/core/math';
import { Orientation } from '../enum-type/orientation.js';
import { warn, warnID } from '@cocos/engine/cocos/core/platform/debug';

class ScreenAdapter extends EventTarget{isFrameRotated=false;handleResizeEvent=false;get supportFullScreen(){return false}get isFullScreen(){return false}get devicePixelRatio(){return 1}get windowSize(){return new Size(960,640)}set windowSize(size){warn("Setting window size is not supported yet.");}get resolution(){const windowSize=this.windowSize;const resolutionScale=this.resolutionScale;return new Size(windowSize.width*resolutionScale,windowSize.height*resolutionScale)}get resolutionScale(){return this._ccprivate$_resolutionScale}set resolutionScale(v){if(v===this._ccprivate$_resolutionScale){return}this._ccprivate$_resolutionScale=v;}get orientation(){return Orientation.PORTRAIT}set orientation(value){warnID(1221);}get safeAreaEdge(){return {top:0,bottom:0,left:0,right:0}}get isProportionalToFrame(){return this._ccprivate$_isProportionalToFrame}set isProportionalToFrame(v){}_ccprivate$_resolutionScale=1;_ccprivate$_isProportionalToFrame=false;constructor(){super();}init(options,cbToRebuildFrameBuffer){}requestFullScreen(){return Promise.reject(new Error("request fullscreen has not been supported yet on this platform."))}exitFullScreen(){return Promise.reject(new Error("exit fullscreen has not been supported yet on this platform."))}}const screenAdapter=new ScreenAdapter;

export { screenAdapter };
