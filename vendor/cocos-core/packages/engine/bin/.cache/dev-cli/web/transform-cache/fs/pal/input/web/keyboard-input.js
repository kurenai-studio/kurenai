System.register("q-bundled:///fs/pal/input/web/keyboard-input.js", ["../../../cocos/input/types/index.js", "../../../cocos/core/event/index.js", "../keycodes.js"], function (_export, _context) {
  "use strict";

  var EventKeyboard, EventTarget, code2KeyCode, KeyboardInputSource;
  function getKeyCode(code) {
    return code2KeyCode[code] || 0;
  }
  return {
    setters: [function (_cocosInputTypesIndexJs) {
      EventKeyboard = _cocosInputTypesIndexJs.EventKeyboard;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_keycodesJs) {
      code2KeyCode = _keycodesJs.code2KeyCode;
    }],
    execute: function () {
      _export("KeyboardInputSource", KeyboardInputSource = class KeyboardInputSource {
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_registerEvent();
        }
        dispatchKeyboardDownEvent(nativeKeyboardEvent) {
          this._ccprivate$_handleKeyboardDown(nativeKeyboardEvent);
        }
        dispatchKeyboardUpEvent(nativeKeyboardEvent) {
          this._ccprivate$_handleKeyboardUp(nativeKeyboardEvent);
        }
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
        _ccprivate$_registerEvent() {
          const canvas = document.getElementById("GameCanvas");
          canvas == null || canvas.addEventListener("keydown", this._ccprivate$_handleKeyboardDown.bind(this));
          canvas == null || canvas.addEventListener("keyup", this._ccprivate$_handleKeyboardUp.bind(this));
        }
        _ccprivate$_getInputEvent(event, eventType) {
          const keyCode = getKeyCode(event.code);
          const eventKeyboard = new EventKeyboard(keyCode, eventType);
          return eventKeyboard;
        }
        _ccprivate$_handleKeyboardDown(event) {
          event.stopPropagation();
          event.preventDefault();
          if (!event.repeat) {
            const keyDownInputEvent = this._ccprivate$_getInputEvent(event, "keydown");
            this._ccprivate$_eventTarget.emit("keydown", keyDownInputEvent);
          } else {
            const keyPressingInputEvent = this._ccprivate$_getInputEvent(event, "key-pressing");
            this._ccprivate$_eventTarget.emit("key-pressing", keyPressingInputEvent);
          }
        }
        _ccprivate$_handleKeyboardUp(event) {
          const inputEvent = this._ccprivate$_getInputEvent(event, "keyup");
          event.stopPropagation();
          event.preventDefault();
          this._ccprivate$_eventTarget.emit("keyup", inputEvent);
        }
      });
    }
  };
});