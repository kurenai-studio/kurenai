System.register("q-bundled:///fs/pal/input/nodejs/handle-input.js", ["../../../cocos/core/event/event-target.js"], function (_export, _context) {
  "use strict";

  var EventTarget, HandleInputDevice;
  return {
    setters: [function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }],
    execute: function () {
      _export("HandleInputDevice", HandleInputDevice = class HandleInputDevice {
        get buttonNorth() {
          return this._ccprivate$_buttonNorth;
        }
        get buttonEast() {
          return this._ccprivate$_buttonEast;
        }
        get buttonWest() {
          return this._ccprivate$_buttonWest;
        }
        get buttonSouth() {
          return this._ccprivate$_buttonSouth;
        }
        get buttonTriggerLeft() {
          return this._ccprivate$_buttonTriggerLeft;
        }
        get buttonTriggerRight() {
          return this._ccprivate$_buttonTriggerRight;
        }
        get triggerLeft() {
          return this._ccprivate$_triggerLeft;
        }
        get triggerRight() {
          return this._ccprivate$_triggerRight;
        }
        get gripLeft() {
          return this._ccprivate$_gripLeft;
        }
        get gripRight() {
          return this._ccprivate$_gripRight;
        }
        get leftStick() {
          return this._ccprivate$_leftStick;
        }
        get rightStick() {
          return this._ccprivate$_rightStick;
        }
        get buttonLeftStick() {
          return this._ccprivate$_buttonLeftStick;
        }
        get buttonRightStick() {
          return this._ccprivate$_buttonRightStick;
        }
        get buttonOptions() {
          return this._ccprivate$_buttonOptions;
        }
        get buttonStart() {
          return this._ccprivate$_buttonStart;
        }
        get handLeftPosition() {
          return this._ccprivate$_handLeftPosition;
        }
        get handLeftOrientation() {
          return this._ccprivate$_handLeftOrientation;
        }
        get handRightPosition() {
          return this._ccprivate$_handRightPosition;
        }
        get handRightOrientation() {
          return this._ccprivate$_handRightOrientation;
        }
        get aimLeftPosition() {
          return this._ccprivate$_aimLeftPosition;
        }
        get aimLeftOrientation() {
          return this._ccprivate$_aimLeftOrientation;
        }
        get aimRightPosition() {
          return this._ccprivate$_aimRightPosition;
        }
        get aimRightOrientation() {
          return this._ccprivate$_aimRightOrientation;
        }
        get touchButtonA() {
          return this._ccprivate$_touchButtonA;
        }
        get touchButtonB() {
          return this._ccprivate$_touchButtonB;
        }
        get touchButtonX() {
          return this._ccprivate$_touchButtonX;
        }
        get touchButtonY() {
          return this._ccprivate$_touchButtonY;
        }
        get touchButtonTriggerLeft() {
          return this._ccprivate$_touchButtonTriggerLeft;
        }
        get touchButtonTriggerRight() {
          return this._ccprivate$_touchButtonTriggerRight;
        }
        get touchButtonThumbStickLeft() {
          return this._ccprivate$_touchButtonThumbStickLeft;
        }
        get touchButtonThumbStickRight() {
          return this._ccprivate$_touchButtonThumbStickRight;
        }
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
        }
        _on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
      });
    }
  };
});