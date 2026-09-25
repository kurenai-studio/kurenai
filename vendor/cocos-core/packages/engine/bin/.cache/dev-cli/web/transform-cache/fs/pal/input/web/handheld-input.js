System.register("q-bundled:///fs/pal/input/web/handheld-input.js", ["../../../cocos/core/event/event-target.js", "../input-source.js", "../../../cocos/core/math/index.js"], function (_export, _context) {
  "use strict";

  var EventTarget, InputSourcePosition, InputSourceOrientation, Vec3, Quat, HandheldInputDevice;
  return {
    setters: [function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }, function (_inputSourceJs) {
      InputSourcePosition = _inputSourceJs.InputSourcePosition;
      InputSourceOrientation = _inputSourceJs.InputSourceOrientation;
    }, function (_cocosCoreMathIndexJs) {
      Vec3 = _cocosCoreMathIndexJs.Vec3;
      Quat = _cocosCoreMathIndexJs.Quat;
    }],
    execute: function () {
      _export("HandheldInputDevice", HandheldInputDevice = class HandheldInputDevice {
        get handheldPosition() {
          return this._ccprivate$_handheldPosition;
        }
        get handheldOrientation() {
          return this._ccprivate$_handheldOrientation;
        }
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_initInputSource();
        }
        _on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
        _ccprivate$_initInputSource() {
          this._ccprivate$_handheldPosition = new InputSourcePosition();
          this._ccprivate$_handheldPosition.getValue = () => Vec3.ZERO;
          this._ccprivate$_handheldOrientation = new InputSourceOrientation();
          this._ccprivate$_handheldOrientation.getValue = () => Quat.IDENTITY;
        }
      });
    }
  };
});