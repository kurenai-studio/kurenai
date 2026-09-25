System.register("q-bundled:///fs/pal/input/nodejs/touch-input.js", ["../../../cocos/core/event/index.js"], function (_export, _context) {
  "use strict";

  var EventTarget, TouchInputSource;
  return {
    setters: [function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }],
    execute: function () {
      _export("TouchInputSource", TouchInputSource = class TouchInputSource {
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
        }
        dispatchEventsInCache() {}
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
      });
    }
  };
});