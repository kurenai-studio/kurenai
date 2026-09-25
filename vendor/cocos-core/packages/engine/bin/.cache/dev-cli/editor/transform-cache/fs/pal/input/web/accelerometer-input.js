System.register("q-bundled:///fs/pal/input/web/accelerometer-input.js", ["pal/system-info", "pal/screen-adapter", "../../../cocos/core/event/event-target.js", "../../system-info/enum-type/browser-type.js", "../../system-info/enum-type/language.js", "../../system-info/enum-type/network-type.js", "../../system-info/enum-type/operating-system.js", "../../system-info/enum-type/platform.js", "../../system-info/enum-type/feature.js", "../../../cocos/input/types/index.js", "../../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var systemInfo, screenAdapter, EventTarget, BrowserType, OS, Acceleration, EventAcceleration, warn, AccelerometerInputSource;
  return {
    setters: [function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_palScreenAdapter) {
      screenAdapter = _palScreenAdapter.screenAdapter;
    }, function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {
      BrowserType = _systemInfoEnumTypeBrowserTypeJs.BrowserType;
    }, function (_systemInfoEnumTypeLanguageJs) {}, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {
      OS = _systemInfoEnumTypeOperatingSystemJs.OS;
    }, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {}, function (_cocosInputTypesIndexJs) {
      Acceleration = _cocosInputTypesIndexJs.Acceleration;
      EventAcceleration = _cocosInputTypesIndexJs.EventAcceleration;
    }, function (_cocosCorePlatformDebugJs) {
      warn = _cocosCorePlatformDebugJs.warn;
    }],
    execute: function () {
      _export("AccelerometerInputSource", AccelerometerInputSource = class AccelerometerInputSource {
        constructor() {
          this._ccprivate$_intervalInMileSeconds = 200;
          this._ccprivate$_accelTimer = 0;
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_globalEventClass = window.DeviceMotionEvent || window.DeviceOrientationEvent;
          if (systemInfo.browserType === BrowserType.MOBILE_QQ) {
            this._ccprivate$_globalEventClass = window.DeviceOrientationEvent;
          }
          this._ccprivate$_deviceEventName = this._ccprivate$_globalEventClass === window.DeviceMotionEvent ? "devicemotion" : "deviceorientation";
          this._ccprivate$_didAccelerateFunc = this._ccprivate$_didAccelerate.bind(this);
        }
        _ccprivate$_registerEvent() {
          this._ccprivate$_accelTimer = performance.now();
          window.addEventListener(this._ccprivate$_deviceEventName, this._ccprivate$_didAccelerateFunc, false);
        }
        _ccprivate$_unregisterEvent() {
          this._ccprivate$_accelTimer = 0;
          window.removeEventListener(this._ccprivate$_deviceEventName, this._ccprivate$_didAccelerateFunc, false);
        }
        _ccprivate$_didAccelerate(event) {
          const now = performance.now();
          if (now - this._ccprivate$_accelTimer < this._ccprivate$_intervalInMileSeconds) {
            return;
          }
          this._ccprivate$_accelTimer = now;
          let x = 0;
          let y = 0;
          let z = 0;
          if (this._ccprivate$_globalEventClass === window.DeviceMotionEvent) {
            const deviceMotionEvent = event;
            const eventAcceleration = deviceMotionEvent.accelerationIncludingGravity;
            x = ((eventAcceleration == null ? void 0 : eventAcceleration.x) || 0) * 0.1;
            y = ((eventAcceleration == null ? void 0 : eventAcceleration.y) || 0) * 0.1;
            z = ((eventAcceleration == null ? void 0 : eventAcceleration.z) || 0) * 0.1;
          } else {
            const deviceOrientationEvent = event;
            x = (deviceOrientationEvent.gamma || 0) / 90 * 0.981;
            y = -((deviceOrientationEvent.beta || 0) / 90) * 0.981;
            z = (deviceOrientationEvent.alpha || 0) / 90 * 0.981;
          }
          if (screenAdapter.isFrameRotated) {
            const tmp = x;
            x = -y;
            y = tmp;
          }
          const LANDSCAPE_LEFT = -90;
          const PORTRAIT_UPSIDE_DOWN = 180;
          const LANDSCAPE_RIGHT = 90;
          const tmpX = x;
          if (window.orientation === LANDSCAPE_RIGHT) {
            x = -y;
            y = tmpX;
          } else if (window.orientation === LANDSCAPE_LEFT) {
            x = y;
            y = -tmpX;
          } else if (window.orientation === PORTRAIT_UPSIDE_DOWN) {
            x = -x;
            y = -y;
          }
          if (systemInfo.os === OS.ANDROID && systemInfo.browserType !== BrowserType.MOBILE_QQ) {
            x = -x;
            y = -y;
          }
          const timestamp = performance.now();
          const acceleration = new Acceleration(x, y, z, timestamp);
          const eventAcceleration = new EventAcceleration(acceleration);
          this._ccprivate$_eventTarget.emit("devicemotion", eventAcceleration);
        }
        start() {
          if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
            DeviceMotionEvent.requestPermission().then(response => {
              if (response === "granted") {
                this._ccprivate$_registerEvent();
              }
            }).catch(e => {
              warn(e);
            });
          } else {
            this._ccprivate$_registerEvent();
          }
        }
        stop() {
          this._ccprivate$_unregisterEvent();
        }
        setInterval(intervalInMileSeconds) {
          this._ccprivate$_intervalInMileSeconds = intervalInMileSeconds;
        }
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
      });
    }
  };
});