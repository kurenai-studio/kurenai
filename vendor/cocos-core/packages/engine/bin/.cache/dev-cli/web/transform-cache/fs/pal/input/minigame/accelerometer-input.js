System.register("q-bundled:///fs/pal/input/minigame/accelerometer-input.js", ["pal/minigame", "../../../cocos/input/types/index.js", "../../../cocos/core/event/index.js", "../../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var minigame, Acceleration, EventAcceleration, EventTarget, errorID, AccelerometerInputSource;
  return {
    setters: [function (_palMinigame) {
      minigame = _palMinigame.minigame;
    }, function (_cocosInputTypesIndexJs) {
      Acceleration = _cocosInputTypesIndexJs.Acceleration;
      EventAcceleration = _cocosInputTypesIndexJs.EventAcceleration;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_cocosCorePlatformDebugJs) {
      errorID = _cocosCorePlatformDebugJs.errorID;
    }],
    execute: function () {
      _export("AccelerometerInputSource", AccelerometerInputSource = class AccelerometerInputSource {
        constructor() {
          this._ccprivate$_isStarted = false;
          this._ccprivate$_accelMode = "normal";
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_didAccelerateFunc = this._ccprivate$_didAccelerate.bind(this);
        }
        _ccprivate$_registerEvent() {
          minigame.onAccelerometerChange(this._ccprivate$_didAccelerateFunc);
        }
        _ccprivate$_unregisterEvent() {
          minigame.offAccelerometerChange(this._ccprivate$_didAccelerateFunc);
        }
        _ccprivate$_didAccelerate(event) {
          const timestamp = performance.now();
          const acceleration = new Acceleration(event.x, event.y, event.z, timestamp);
          const eventAcceleration = new EventAcceleration(acceleration);
          this._ccprivate$_eventTarget.emit("devicemotion", eventAcceleration);
        }
        start() {
          this._ccprivate$_registerEvent();
          minigame.startAccelerometer({
            interval: this._ccprivate$_accelMode,
            success: () => {
              this._ccprivate$_isStarted = true;
            }
          });
        }
        stop() {
          minigame.stopAccelerometer({
            success: () => {
              this._ccprivate$_isStarted = false;
            },
            fail() {
              errorID(16305);
            }
          });
          this._ccprivate$_unregisterEvent();
        }
        setInterval(intervalInMileseconds) {
          if (intervalInMileseconds >= 200) {
            this._ccprivate$_accelMode = "normal";
          } else if (intervalInMileseconds >= 60) {
            this._ccprivate$_accelMode = "ui";
          } else {
            this._ccprivate$_accelMode = "game";
          }
          if (this._ccprivate$_isStarted) {
            this.stop();
            this.start();
          }
        }
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
      });
    }
  };
});