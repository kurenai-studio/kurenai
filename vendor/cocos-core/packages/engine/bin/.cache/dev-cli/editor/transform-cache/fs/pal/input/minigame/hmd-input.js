System.register("q-bundled:///fs/pal/input/minigame/hmd-input.js", ["../../../cocos/core/event/event-target.js", "../input-source.js", "../../../cocos/core/math/index.js"], function (_export, _context) {
  "use strict";

  var EventTarget, InputSourcePosition, InputSourceOrientation, Vec3, Quat, HMDInputDevice;
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
          this._ccprivate$_initInputSource();
        }
        _on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
        _ccprivate$_initInputSource() {
          const self = this;
          self._ccprivate$_viewLeftPosition = new InputSourcePosition();
          self._ccprivate$_viewLeftPosition.getValue = () => Vec3.ZERO;
          self._ccprivate$_viewLeftOrientation = new InputSourceOrientation();
          self._ccprivate$_viewLeftOrientation.getValue = () => Quat.IDENTITY;
          self._ccprivate$_viewRightPosition = new InputSourcePosition();
          self._ccprivate$_viewRightPosition.getValue = () => Vec3.ZERO;
          self._ccprivate$_viewRightOrientation = new InputSourceOrientation();
          self._ccprivate$_viewRightOrientation.getValue = () => Quat.IDENTITY;
          self._ccprivate$_headMiddlePosition = new InputSourcePosition();
          self._ccprivate$_headMiddlePosition.getValue = () => Vec3.ZERO;
          self._ccprivate$_headMiddleOrientation = new InputSourceOrientation();
          self._ccprivate$_headMiddleOrientation.getValue = () => Quat.IDENTITY;
        }
      });
    }
  };
});