import { systemInfo } from 'pal/system-info';
import { screenAdapter } from 'pal/screen-adapter';
import { EventTarget } from '@cocos/engine/cocos/core/event';
import '../../system-info/enum-type/browser-type.js';
import '../../system-info/enum-type/language.js';
import '../../system-info/enum-type/network-type.js';
import { OS } from '../../system-info/enum-type/operating-system.js';
import '../../system-info/enum-type/platform.js';
import '../../system-info/enum-type/feature.js';
import { Orientation } from '../../screen-adapter/enum-type/orientation.js';
import { Acceleration, EventAcceleration } from '@cocos/engine/cocos/input/types';

class AccelerometerInputSource{_ccprivate$_intervalInSeconds=0.2;_ccprivate$_intervalId;_ccprivate$_isEnabled=false;_ccprivate$_eventTarget=new EventTarget;constructor(){this._ccprivate$_didAccelerateFunc=this._ccprivate$_didAccelerate.bind(this);}_ccprivate$_didAccelerate(){const deviceMotionValue=jsb.device.getDeviceMotionValue();let x=deviceMotionValue[3]*0.1;let y=deviceMotionValue[4]*0.1;const z=deviceMotionValue[5]*0.1;const orientation=screenAdapter.orientation;const tmpX=x;if(orientation===Orientation.LANDSCAPE_RIGHT){x=-y;y=tmpX;}else if(orientation===Orientation.LANDSCAPE_LEFT){x=y;y=-tmpX;}else if(orientation===Orientation.PORTRAIT_UPSIDE_DOWN){x=-x;y=-y;}if(systemInfo.os===OS.ANDROID||systemInfo.os===OS.OHOS||systemInfo.os===OS.OPENHARMONY){x=-x;y=-y;}const timestamp=performance.now();const acceleration=new Acceleration(x,y,z,timestamp);const eventAcceleration=new EventAcceleration(acceleration);this._ccprivate$_eventTarget.emit("devicemotion",eventAcceleration);}start(){if(this._ccprivate$_intervalId){clearInterval(this._ccprivate$_intervalId);}this._ccprivate$_intervalId=setInterval(this._ccprivate$_didAccelerateFunc,this._ccprivate$_intervalInSeconds*1000);jsb.device.setAccelerometerInterval(this._ccprivate$_intervalInSeconds);jsb.device.setAccelerometerEnabled(true);this._ccprivate$_isEnabled=true;}stop(){if(this._ccprivate$_intervalId){clearInterval(this._ccprivate$_intervalId);this._ccprivate$_intervalId=undefined;}jsb.device.setAccelerometerEnabled(false);this._ccprivate$_isEnabled=false;}setInterval(intervalInMileseconds){this._ccprivate$_intervalInSeconds=intervalInMileseconds/1000;jsb.device.setAccelerometerInterval(this._ccprivate$_intervalInSeconds);if(this._ccprivate$_isEnabled){jsb.device.setAccelerometerEnabled(false);jsb.device.setAccelerometerEnabled(true);}}on(eventType,callback,target){this._ccprivate$_eventTarget.on(eventType,callback,target);}}

export { AccelerometerInputSource };
