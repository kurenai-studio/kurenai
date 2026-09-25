System.register("q-bundled:///fs/pal/input/nodejs/handheld-input.js", ["../../../cocos/core/event/event-target.js"], function (_export, _context) {
  "use strict";

  var EventTarget, HandheldInputDevice;
  return {
    setters: [function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
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
        }
        _on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
      });
    }
  };
});