System.register("q-bundled:///fs/pal/input/minigame/touch-input.js", ["pal/minigame", "pal/screen-adapter", "pal/system-info", "../../../cocos/core/math/index.js", "../../../cocos/core/event/index.js", "../../../cocos/input/types/index.js", "../touch-manager.js", "../../system-info/enum-type/browser-type.js", "../../system-info/enum-type/language.js", "../../system-info/enum-type/network-type.js", "../../system-info/enum-type/operating-system.js", "../../system-info/enum-type/platform.js", "../../system-info/enum-type/feature.js"], function (_export, _context) {
  "use strict";

  var minigame, screenAdapter, systemInfo, Vec2, EventTarget, EventTouch, touchManager, Feature, TouchInputSource;
  return {
    setters: [function (_palMinigame) {
      minigame = _palMinigame.minigame;
    }, function (_palScreenAdapter) {
      screenAdapter = _palScreenAdapter.screenAdapter;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_cocosCoreMathIndexJs) {
      Vec2 = _cocosCoreMathIndexJs.Vec2;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_cocosInputTypesIndexJs) {
      EventTouch = _cocosInputTypesIndexJs.EventTouch;
    }, function (_touchManagerJs) {
      touchManager = _touchManagerJs.touchManager;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {}, function (_systemInfoEnumTypeLanguageJs) {}, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {}, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {
      Feature = _systemInfoEnumTypeFeatureJs.Feature;
    }],
    execute: function () {
      _export("TouchInputSource", TouchInputSource = class TouchInputSource {
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
          if (systemInfo.hasFeature(Feature.INPUT_TOUCH)) {
            this._ccprivate$_registerEvent();
          }
        }
        _ccprivate$_registerEvent() {
          minigame.onTouchStart(this._ccprivate$_createCallback("touch-start"));
          minigame.onTouchMove(this._ccprivate$_createCallback("touch-move"));
          minigame.onTouchEnd(this._ccprivate$_createCallback("touch-end"));
          minigame.onTouchCancel(this._ccprivate$_createCallback("touch-cancel"));
        }
        _ccprivate$_createCallback(eventType) {
          return event => {
            const handleTouches = [];
            const windowSize = screenAdapter.windowSize;
            const dpr = screenAdapter.devicePixelRatio;
            const length = event.changedTouches.length;
            for (let i = 0; i < length; ++i) {
              const changedTouch = event.changedTouches[i];
              const touchID = changedTouch.identifier;
              if (touchID === null) {
                continue;
              }
              const location = this._ccprivate$_getLocation(changedTouch, windowSize, dpr);
              const touch = touchManager.getOrCreateTouch(touchID, location.x, location.y);
              if (!touch) {
                continue;
              }
              if (eventType === "touch-end" || eventType === "touch-cancel") {
                touchManager.releaseTouch(touchID);
              }
              handleTouches.push(touch);
            }
            if (handleTouches.length > 0) {
              const eventTouch = new EventTouch(handleTouches, false, eventType, touchManager.getAllTouches());
              this._ccprivate$_eventTarget.emit(eventType, eventTouch);
            }
          };
        }
        _ccprivate$_getLocation(touch, windowSize, dpr) {
          const x = touch.clientX * dpr;
          const y = windowSize.height - touch.clientY * dpr;
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