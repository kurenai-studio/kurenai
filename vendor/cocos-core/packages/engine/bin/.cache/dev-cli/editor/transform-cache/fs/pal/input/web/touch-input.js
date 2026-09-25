System.register("q-bundled:///fs/pal/input/web/touch-input.js", ["../../../../virtual/internal%253Aconstants.js", "pal/system-info", "pal/screen-adapter", "../../../cocos/core/math/index.js", "../../../cocos/core/event/index.js", "../../../cocos/input/types/index.js", "../touch-manager.js", "../../system-info/enum-type/browser-type.js", "../../system-info/enum-type/language.js", "../../system-info/enum-type/network-type.js", "../../system-info/enum-type/operating-system.js", "../../system-info/enum-type/platform.js", "../../system-info/enum-type/feature.js", "../../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var TEST, EDITOR, USE_XR, systemInfo, screenAdapter, Rect, Vec2, EventTarget, EventTouch, touchManager, Feature, warn, TouchInputSource;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      TEST = _virtualInternal253AconstantsJs.TEST;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_palScreenAdapter) {
      screenAdapter = _palScreenAdapter.screenAdapter;
    }, function (_cocosCoreMathIndexJs) {
      Rect = _cocosCoreMathIndexJs.Rect;
      Vec2 = _cocosCoreMathIndexJs.Vec2;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_cocosInputTypesIndexJs) {
      EventTouch = _cocosInputTypesIndexJs.EventTouch;
    }, function (_touchManagerJs) {
      touchManager = _touchManagerJs.touchManager;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {}, function (_systemInfoEnumTypeLanguageJs) {}, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {}, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {
      Feature = _systemInfoEnumTypeFeatureJs.Feature;
    }, function (_cocosCorePlatformDebugJs) {
      warn = _cocosCorePlatformDebugJs.warn;
    }],
    execute: function () {
      _export("TouchInputSource", TouchInputSource = class TouchInputSource {
        constructor() {
          this._ccprivate$_canvas = void 0;
          this._ccprivate$_eventTarget = new EventTarget();
          if (systemInfo.hasFeature(Feature.INPUT_TOUCH)) {
            this._ccprivate$_canvas = document.getElementById("GameCanvas");
            if (!this._ccprivate$_canvas && !TEST && !EDITOR) {
              warn("failed to access canvas");
            }
            if (!EDITOR) {
              this._ccprivate$_registerEvent();
            }
          }
        }
        _ccprivate$_registerEvent() {
          var _this$_ccprivate$_can, _this$_ccprivate$_can2, _this$_ccprivate$_can3, _this$_ccprivate$_can4;
          (_this$_ccprivate$_can = this._ccprivate$_canvas) == null || _this$_ccprivate$_can.addEventListener("touchstart", this._ccprivate$_createCallback("touch-start"));
          (_this$_ccprivate$_can2 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can2.addEventListener("touchmove", this._ccprivate$_createCallback("touch-move"));
          (_this$_ccprivate$_can3 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can3.addEventListener("touchend", this._ccprivate$_createCallback("touch-end"));
          (_this$_ccprivate$_can4 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can4.addEventListener("touchcancel", this._ccprivate$_createCallback("touch-cancel"));
        }
        _ccprivate$_createCallback(eventType) {
          return event => {
            const canvasRect = this._ccprivate$_getCanvasRect();
            const handleTouches = [];
            const length = event.changedTouches.length;
            for (let i = 0; i < length; ++i) {
              const changedTouch = event.changedTouches[i];
              const touchID = changedTouch.identifier;
              if (touchID === null) {
                continue;
              }
              const location = this._ccprivate$_getLocation(changedTouch, canvasRect);
              const touch = touchManager.getOrCreateTouch(touchID, location.x, location.y);
              if (!touch) {
                continue;
              }
              if (eventType === "touch-end" || eventType === "touch-cancel") {
                touchManager.releaseTouch(touchID);
              }
              handleTouches.push(touch);
            }
            event.stopPropagation();
            if (event.target === this._ccprivate$_canvas) {
              event.preventDefault();
            }
            if (eventType === "touch-start") {
              var _this$_ccprivate$_can5;
              (_this$_ccprivate$_can5 = this._ccprivate$_canvas) == null || _this$_ccprivate$_can5.focus();
            }
            if (handleTouches.length > 0) {
              const eventTouch = new EventTouch(handleTouches, false, eventType, touchManager.getAllTouches());
              this._ccprivate$_eventTarget.emit(eventType, eventTouch);
            }
          };
        }
        _ccprivate$_getCanvasRect() {
          const canvas = this._ccprivate$_canvas;
          const box = canvas == null ? void 0 : canvas.getBoundingClientRect();
          if (box) {
            return new Rect(box.x, box.y, box.width, box.height);
          }
          return new Rect(0, 0, 0, 0);
        }
        _ccprivate$_getLocation(touch, canvasRect) {
          if (USE_XR && globalThis.__globalXR && globalThis.__globalXR.ar && globalThis.__globalXR.ar.isWebXR()) {
            return new Vec2(touch.clientX, touch.clientY);
          }
          let x = touch.clientX - canvasRect.x;
          let y = canvasRect.y + canvasRect.height - touch.clientY;
          if (screenAdapter.isFrameRotated) {
            const tmp = x;
            x = canvasRect.height - y;
            y = tmp;
          }
          const dpr = screenAdapter.devicePixelRatio;
          x *= dpr;
          y *= dpr;
          return new Vec2(x, y);
        }
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
        dispatchEventsInCache() {}
      });
    }
  };
});