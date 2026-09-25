System.register("q-bundled:///fs/pal/input/web/mouse-input.js", ["../../../../virtual/internal%253Aconstants.js", "pal/system-info", "pal/screen-adapter", "../../../cocos/input/types/index.js", "../../../cocos/core/event/index.js", "../../../cocos/core/math/index.js", "../../system-info/enum-type/browser-type.js", "../../system-info/enum-type/language.js", "../../system-info/enum-type/network-type.js", "../../system-info/enum-type/operating-system.js", "../../system-info/enum-type/platform.js", "../../system-info/enum-type/feature.js", "../../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var TEST, EDITOR, systemInfo, screenAdapter, EventMouse, EventTarget, Vec2, Rect, Feature, warn, MouseInputSource;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      TEST = _virtualInternal253AconstantsJs.TEST;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_palScreenAdapter) {
      screenAdapter = _palScreenAdapter.screenAdapter;
    }, function (_cocosInputTypesIndexJs) {
      EventMouse = _cocosInputTypesIndexJs.EventMouse;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_cocosCoreMathIndexJs) {
      Vec2 = _cocosCoreMathIndexJs.Vec2;
      Rect = _cocosCoreMathIndexJs.Rect;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {}, function (_systemInfoEnumTypeLanguageJs) {}, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {}, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {
      Feature = _systemInfoEnumTypeFeatureJs.Feature;
    }, function (_cocosCorePlatformDebugJs) {
      warn = _cocosCorePlatformDebugJs.warn;
    }],
    execute: function () {
      _export("MouseInputSource", MouseInputSource = class MouseInputSource {
        constructor() {
          this._ccprivate$_canvas = void 0;
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_pointLocked = false;
          this._ccprivate$_isPressed = false;
          this._ccprivate$_preMousePos = new Vec2();
          this._ccprivate$_handleMouseDown = void 0;
          this._ccprivate$_handleMouseMove = void 0;
          this._ccprivate$_handleMouseUp = void 0;
          if (systemInfo.hasFeature(Feature.EVENT_MOUSE)) {
            this._ccprivate$_canvas = document.getElementById("GameCanvas");
            if (!this._ccprivate$_canvas && !TEST && !EDITOR) {
              warn("failed to access canvas");
            }
            this._ccprivate$_handleMouseDown = this._ccprivate$_createCallback("mouse-down");
            this._ccprivate$_handleMouseMove = this._ccprivate$_createCallback("mouse-move");
            this._ccprivate$_handleMouseUp = this._ccprivate$_createCallback("mouse-up");
            if (!EDITOR) {
              this._ccprivate$_registerEvent();
            }
          }
        }
        dispatchMouseDownEvent(nativeMouseEvent) {
          this._ccprivate$_handleMouseDown(nativeMouseEvent);
        }
        dispatchMouseMoveEvent(nativeMouseEvent) {
          this._ccprivate$_handleMouseMove(nativeMouseEvent);
        }
        dispatchMouseUpEvent(nativeMouseEvent) {
          this._ccprivate$_handleMouseUp(nativeMouseEvent);
        }
        dispatchScrollEvent(nativeMouseEvent) {
          this._ccprivate$_handleMouseWheel(nativeMouseEvent);
        }
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
        _ccprivate$_getCanvasRect() {
          const canvas = this._ccprivate$_canvas;
          const box = canvas == null ? void 0 : canvas.getBoundingClientRect();
          if (box) {
            return new Rect(box.x, box.y, box.width, box.height);
          }
          return new Rect(0, 0, 0, 0);
        }
        _ccprivate$_getLocation(mouseEvent) {
          const canvasRect = this._ccprivate$_getCanvasRect();
          const dpr = screenAdapter.devicePixelRatio;
          let x = this._ccprivate$_pointLocked ? this._ccprivate$_preMousePos.x / dpr + mouseEvent.movementX : mouseEvent.clientX - canvasRect.x;
          let y = this._ccprivate$_pointLocked ? this._ccprivate$_preMousePos.y / dpr - mouseEvent.movementY : canvasRect.y + canvasRect.height - mouseEvent.clientY;
          x *= dpr;
          y *= dpr;
          return new Vec2(x, y);
        }
        _ccprivate$_registerEvent() {
          var _this$_ccprivate$_can, _this$_ccprivate$_can2, _this$_ccprivate$_can3, _this$_ccprivate$_can4, _this$_ccprivate$_can5, _this$_ccprivate$_can6;
          window.addEventListener("mousedown", () => {
            this._ccprivate$_isPressed = true;
          });
          (_this$_ccprivate$_can = this._ccprivate$_canvas) == null || _this$_ccprivate$_can.addEventListener("mousedown", this._ccprivate$_handleMouseDown);
          (_this$_ccprivate$_can2 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can2.addEventListener("mousemove", this._ccprivate$_handleMouseMove);
          window.addEventListener("mouseup", this._ccprivate$_handleMouseUp);
          (_this$_ccprivate$_can3 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can3.addEventListener("mouseup", this._ccprivate$_handleMouseUp);
          (_this$_ccprivate$_can4 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can4.addEventListener("wheel", this._ccprivate$_handleMouseWheel.bind(this));
          this._ccprivate$_registerPointerLockEvent();
          (_this$_ccprivate$_can5 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can5.addEventListener("mouseleave", this._ccprivate$_handleMouseLeave.bind(this));
          (_this$_ccprivate$_can6 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can6.addEventListener("mouseenter", this._ccprivate$_handleMouseEnter.bind(this));
        }
        _ccprivate$_registerPointerLockEvent() {
          const lockChangeAlert = () => {
            const canvas = this._ccprivate$_canvas;
            if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
              this._ccprivate$_pointLocked = true;
            } else {
              this._ccprivate$_pointLocked = false;
            }
          };
          if ("onpointerlockchange" in document) {
            document.addEventListener("pointerlockchange", lockChangeAlert, false);
          } else if ("onmozpointerlockchange" in document) {
            document.addEventListener("mozpointerlockchange", lockChangeAlert, false);
          }
        }
        _ccprivate$_createCallback(eventType) {
          return mouseEvent => {
            var _this$_ccprivate$_can7;
            const location = this._ccprivate$_getLocation(mouseEvent);
            const {
              button,
              buttons
            } = mouseEvent;
            let targetButton = button;
            switch (eventType) {
              case "mouse-down":
                (_this$_ccprivate$_can7 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can7.focus();
                this._ccprivate$_isPressed = true;
                break;
              case "mouse-up":
                this._ccprivate$_isPressed = false;
                break;
              case "mouse-move":
                if (1 & buttons) {
                  targetButton = EventMouse.BUTTON_LEFT;
                } else if (2 & buttons) {
                  targetButton = EventMouse.BUTTON_RIGHT;
                } else if (4 & buttons) {
                  targetButton = EventMouse.BUTTON_MIDDLE;
                } else {
                  targetButton = EventMouse.BUTTON_MISSING;
                }
                break;
            }
            const eventMouse = new EventMouse(eventType, false, this._ccprivate$_preMousePos);
            eventMouse.setLocation(location.x, location.y);
            eventMouse.setButton(targetButton);
            eventMouse.movementX = mouseEvent.movementX;
            eventMouse.movementY = mouseEvent.movementY;
            this._ccprivate$_preMousePos.set(location.x, location.y);
            mouseEvent.stopPropagation();
            if (mouseEvent.target === this._ccprivate$_canvas) {
              mouseEvent.preventDefault();
            }
            this._ccprivate$_eventTarget.emit(eventType, eventMouse);
          };
        }
        _ccprivate$_handleMouseWheel(mouseEvent) {
          const eventType = "mouse-wheel";
          const location = this._ccprivate$_getLocation(mouseEvent);
          const button = mouseEvent.button;
          const eventMouse = new EventMouse(eventType, false, this._ccprivate$_preMousePos);
          eventMouse.setLocation(location.x, location.y);
          eventMouse.setButton(button);
          eventMouse.movementX = mouseEvent.movementX;
          eventMouse.movementY = mouseEvent.movementY;
          const wheelSensitivityFactor = 5;
          eventMouse.setScrollData(mouseEvent.deltaX * wheelSensitivityFactor, -mouseEvent.deltaY * wheelSensitivityFactor);
          this._ccprivate$_preMousePos.set(location.x, location.y);
          mouseEvent.stopPropagation();
          if (mouseEvent.target === this._ccprivate$_canvas) {
            mouseEvent.preventDefault();
          }
          this._ccprivate$_eventTarget.emit(eventType, eventMouse);
        }
        _ccprivate$_handleMouseLeave(mouseEvent) {
          const eventType = "mouse-leave-window";
          const eventMouse = new EventMouse(eventType, false);
          this._ccprivate$_eventTarget.emit(eventType, eventMouse);
        }
        _ccprivate$_handleMouseEnter(mouseEvent) {
          const eventType = "mouse-enter-window";
          const eventMouse = new EventMouse(eventType, false);
          this._ccprivate$_eventTarget.emit(eventType, eventMouse);
        }
        dispatchEventsInCache() {}
      });
    }
  };
});