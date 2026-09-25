System.register("q-bundled:///fs/pal/input/touch-manager.js", ["../../cocos/core/math/vec2.js", "../../cocos/core/platform/debug.js", "../../cocos/core/platform/macro.js", "../../cocos/input/types/index.js"], function (_export, _context) {
  "use strict";

  var Vec2, logID, macro, Touch, TouchManager, tempVec2, touchManager;
  return {
    setters: [function (_cocosCoreMathVec2Js) {
      Vec2 = _cocosCoreMathVec2Js.Vec2;
    }, function (_cocosCorePlatformDebugJs) {
      logID = _cocosCorePlatformDebugJs.logID;
    }, function (_cocosCorePlatformMacroJs) {
      macro = _cocosCorePlatformMacroJs.macro;
    }, function (_cocosInputTypesIndexJs) {
      Touch = _cocosInputTypesIndexJs.Touch;
    }],
    execute: function () {
      tempVec2 = new Vec2();
      TouchManager = class TouchManager {
        constructor() {
          this._ccprivate$_touchMap = new Map();
          this._ccprivate$_maxTouches = 8;
        }
        _ccprivate$_createTouch(touchID, x, y) {
          if (this._ccprivate$_touchMap.has(touchID)) {
            logID(2301);
            return undefined;
          }
          const checkResult = this._ccprivate$_checkTouchMapSizeMoreThanMax(touchID);
          if (checkResult) {
            logID(2300);
            return undefined;
          }
          const touch = new Touch(x, y, touchID);
          this._ccprivate$_touchMap.set(touchID, touch);
          this._ccprivate$_updateTouch(touch, x, y);
          return touch;
        }
        releaseTouch(touchID) {
          if (!this._ccprivate$_touchMap.has(touchID)) {
            return;
          }
          this._ccprivate$_touchMap.delete(touchID);
        }
        getTouch(touchID) {
          return this._ccprivate$_touchMap.get(touchID);
        }
        getOrCreateTouch(touchID, x, y) {
          let touch = this.getTouch(touchID);
          if (!touch) {
            touch = this._ccprivate$_createTouch(touchID, x, y);
          } else {
            this._ccprivate$_updateTouch(touch, x, y);
          }
          return touch;
        }
        getAllTouches() {
          const touches = [];
          this._ccprivate$_touchMap.forEach(touch => {
            if (touch) {
              touches.push(touch);
            }
          });
          return touches;
        }
        getTouchCount() {
          return this._ccprivate$_touchMap.size;
        }
        _ccprivate$_updateTouch(touch, x, y) {
          touch.getLocation(tempVec2);
          touch.setPrevPoint(tempVec2);
          touch.setPoint(x, y);
        }
        _ccprivate$_checkTouchMapSizeMoreThanMax(touchID) {
          if (this._ccprivate$_touchMap.has(touchID)) {
            return false;
          }
          const maxSize = macro.ENABLE_MULTI_TOUCH ? this._ccprivate$_maxTouches : 1;
          if (this._ccprivate$_touchMap.size < maxSize) {
            return false;
          }
          const now = performance.now();
          this._ccprivate$_touchMap.forEach(touch => {
            if (now - touch.lastModified > macro.TOUCH_TIMEOUT) {
              logID(2302, touch.getID());
              this.releaseTouch(touch.getID());
            }
          });
          return maxSize >= this._ccprivate$_touchMap.size;
        }
      };
      _export("touchManager", touchManager = new TouchManager());
    }
  };
});