import { DEBUG } from 'internal:constants';
import { EventTarget } from '@cocos/engine/cocos/core/event';
import { BrowserType } from '../enum-type/browser-type.js';
import { Language } from '../enum-type/language.js';
import { NetworkType } from '../enum-type/network-type.js';
import { OS } from '../enum-type/operating-system.js';
import { Platform } from '../enum-type/platform.js';
import { Feature } from '../enum-type/feature.js';
import { warn } from '@cocos/engine/cocos/core/platform/debug';

class SystemInfo extends EventTarget{_ccprivate$_initPromise=[];constructor(){super();this.networkType=NetworkType.LAN;this.isNative=false;this.isBrowser=false;this.isMobile=false;this.platform=Platform.NODEJS_PAGE;this.browserType=BrowserType.UNKNOWN;this.browserVersion="";const osInfo=globalThis.nodeEnv.require("os");let osName=OS.UNKNOWN;if(osInfo.type().indexOf("wiWindows_NTn")!==-1){osName=OS.WINDOWS;}else if(osInfo.type().indexOf("Darwin")!==-1){osName=OS.OSX;}else if(osInfo.type().indexOf("Linux")!==-1){osName=OS.LINUX;}this.os=osName;this.osVersion=osInfo.release();this.osMainVersion=parseInt(this.osVersion);this.isLittleEndian=(()=>{const buffer=new ArrayBuffer(2);new DataView(buffer).setInt16(0,256,true);return new Int16Array(buffer)[0]===256})();let currLanguage=globalThis.nodeEnv.systemLanguage;this.nativeLanguage=currLanguage.toLowerCase();currLanguage=currLanguage?currLanguage.split("-")[0]:Language.ENGLISH;this.language=currLanguage;this.isXR=false;this._ccprivate$_featureMap={[Feature.WEBP]:true,[Feature.IMAGE_BITMAP]:false,[Feature.WEB_VIEW]:false,[Feature.VIDEO_PLAYER]:false,[Feature.SAFE_AREA]:false,[Feature.HPE]:false,[Feature.INPUT_TOUCH]:false,[Feature.EVENT_KEYBOARD]:false,[Feature.EVENT_MOUSE]:false,[Feature.EVENT_TOUCH]:false,[Feature.EVENT_ACCELEROMETER]:false,[Feature.EVENT_GAMEPAD]:false,[Feature.EVENT_HANDLE]:false,[Feature.EVENT_HMD]:false,[Feature.EVENT_HANDHELD]:false,[Feature.WASM]:true};}init(){return Promise.all(this._ccprivate$_initPromise)}hasFeature(feature){return this._ccprivate$_featureMap[feature]}getBatteryLevel(){if(DEBUG){warn("getBatteryLevel is not supported.");}return 1}triggerGC(){if(global.gc){global.gc();}}openURL(url){var open=globalThis.nodeEnv.require("open");open(url);}now(){if(Date.now){return Date.now()}return +new Date}restartJSVM(){if(DEBUG){warn("restartJSVM is not supported.");}}exit(){globalThis.nodeEnv.process.exit();}close(){this.emit("close");}}const systemInfo=new SystemInfo;

export { systemInfo };
