System.register("q-bundled:///fs/pal/input/nodejs/mouse-input.js", ["../../../cocos/core/event/index.js"], function (_export, _context) {
  "use strict";

  var EventTarget, MouseInputSource;
  return {
    setters: [function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }],
    execute: function () {
      _export("MouseInputSource", MouseInputSource = class MouseInputSource {
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
        }
        dispatchMouseDownEvent(nativeMouseEvent) {}
        dispatchMouseMoveEvent(nativeMouseEvent) {}
        dispatchMouseUpEvent(nativeMouseEvent) {}
        dispatchScrollEvent(nativeMouseEvent) {}
        dispatchEventsInCache() {}
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
      });
    }
  };
});