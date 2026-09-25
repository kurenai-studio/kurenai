System.register("q-bundled:///fs/pal/input/minigame/mouse-input.js", ["pal/minigame", "pal/screen-adapter", "pal/system-info", "../../../cocos/core/math/index.js", "../../../cocos/core/event/index.js", "../../../cocos/input/types/index.js", "../../system-info/enum-type/browser-type.js", "../../system-info/enum-type/language.js", "../../system-info/enum-type/network-type.js", "../../system-info/enum-type/operating-system.js", "../../system-info/enum-type/platform.js", "../../system-info/enum-type/feature.js"], function (_export, _context) {
  "use strict";

  var minigame, screenAdapter, systemInfo, Vec2, EventTarget, EventMouse, Feature, MouseInputSource;
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
      EventMouse = _cocosInputTypesIndexJs.EventMouse;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {}, function (_systemInfoEnumTypeLanguageJs) {}, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {}, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {
      Feature = _systemInfoEnumTypeFeatureJs.Feature;
    }],
    execute: function () {
      _export("MouseInputSource", MouseInputSource = class MouseInputSource {
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_isPressed = false;
          this._ccprivate$_preMousePos = new Vec2();
          if (systemInfo.hasFeature(Feature.EVENT_MOUSE)) {
            this._ccprivate$_registerEvent();
          }
        }
        _ccprivate$_getLocation(event) {
          const windowSize = screenAdapter.windowSize;
          const dpr = screenAdapter.devicePixelRatio;
          const x = event.x * dpr;
          const y = windowSize.height - event.y * dpr;
          return new Vec2(x, y);
        }
        _ccprivate$_registerEvent() {
          var _minigame$wx, _minigame$wx2, _minigame$wx3, _minigame$wx4;
          (_minigame$wx = minigame.wx) == null || _minigame$wx.onMouseDown == null || _minigame$wx.onMouseDown(this._ccprivate$_createCallback("mouse-down"));
          (_minigame$wx2 = minigame.wx) == null || _minigame$wx2.onMouseMove == null || _minigame$wx2.onMouseMove(this._ccprivate$_createCallback("mouse-move"));
          (_minigame$wx3 = minigame.wx) == null || _minigame$wx3.onMouseUp == null || _minigame$wx3.onMouseUp(this._ccprivate$_createCallback("mouse-up"));
          (_minigame$wx4 = minigame.wx) == null || _minigame$wx4.onWheel == null || _minigame$wx4.onWheel(this._ccprivate$_handleMouseWheel.bind(this));
        }
        _ccprivate$_createCallback(eventType) {
          return event => {
            const location = this._ccprivate$_getLocation(event);
            let button = event.button;
            switch (eventType) {
              case "mouse-down":
                this._ccprivate$_isPressed = true;
                break;
              case "mouse-up":
                this._ccprivate$_isPressed = false;
                break;
              case "mouse-move":
                if (!this._ccprivate$_isPressed) {
                  button = EventMouse.BUTTON_MISSING;
                }
                break;
            }
            const eventMouse = new EventMouse(eventType, false, this._ccprivate$_preMousePos);
            eventMouse.setLocation(location.x, location.y);
            eventMouse.setButton(button);
            eventMouse.movementX = location.x - this._ccprivate$_preMousePos.x;
            eventMouse.movementY = this._ccprivate$_preMousePos.y - location.y;
            this._ccprivate$_preMousePos.set(location.x, location.y);
            this._ccprivate$_eventTarget.emit(eventType, eventMouse);
          };
        }
        _ccprivate$_handleMouseWheel(event) {
          const eventType = "mouse-wheel";
          const location = this._ccprivate$_getLocation(event);
          const button = event.button;
          const eventMouse = new EventMouse(eventType, false, this._ccprivate$_preMousePos);
          eventMouse.setLocation(location.x, location.y);
          eventMouse.setButton(button);
          eventMouse.movementX = location.x - this._ccprivate$_preMousePos.x;
          eventMouse.movementY = this._ccprivate$_preMousePos.y - location.y;
          eventMouse.setScrollData(event.deltaX, -event.deltaY);
          this._ccprivate$_preMousePos.set(location.x, location.y);
          this._ccprivate$_eventTarget.emit("mouse-wheel", eventMouse);
        }
        on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
        dispatchEventsInCache() {}
      });
    }
  };
});