System.register("q-bundled:///fs/pal/input/nodejs/keyboard-input.js", ["../../../cocos/core/event/index.js"], function (_export, _context) {
  "use strict";

  var EventTarget, KeyboardInputSource;
  return {
    setters: [function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }],
    execute: function () {
      _export("KeyboardInputSource", KeyboardInputSource = class KeyboardInputSource {
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
        }
        dispatchKeyboardDownEvent(nativeKeyboardEvent) {}
        dispatchKeyboardUpEvent(nativeKeyboardEvent) {}
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
      });
    }
  };
});