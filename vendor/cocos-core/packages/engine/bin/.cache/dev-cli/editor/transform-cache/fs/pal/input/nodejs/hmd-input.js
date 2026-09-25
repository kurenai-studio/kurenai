System.register("q-bundled:///fs/pal/input/nodejs/hmd-input.js", ["../../../cocos/core/event/event-target.js"], function (_export, _context) {
  "use strict";

  var EventTarget, HMDInputDevice, Pose;
  return {
    setters: [function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }],
    execute: function () {
      (function (Pose) {
        Pose[Pose["VIEW_LEFT"] = 0] = "VIEW_LEFT";
        Pose[Pose["VIEW_RIGHT"] = 1] = "VIEW_RIGHT";
        Pose[Pose["HEAD_MIDDLE"] = 2] = "HEAD_MIDDLE";
      })(Pose || (Pose = {}));
      _export("HMDInputDevice", HMDInputDevice = class HMDInputDevice {
        get viewLeftPosition() {
          return this._ccprivate$_viewLeftPosition;
        }
        get viewLeftOrientation() {
          return this._ccprivate$_viewLeftOrientation;
        }
        get viewRightPosition() {
          return this._ccprivate$_viewRightPosition;
        }
        get viewRightOrientation() {
          return this._ccprivate$_viewRightOrientation;
        }
        get headMiddlePosition() {
          return this._ccprivate$_headMiddlePosition;
        }
        get headMiddleOrientation() {
          return this._ccprivate$_headMiddleOrientation;
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