System.register("q-bundled:///fs/pal/screen-adapter/nodejs/screen-adapter.js", ["../../../cocos/core/event/event-target.js", "../../../cocos/core/math/index.js", "../enum-type/orientation.js", "../../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var EventTarget, Size, Orientation, warn, warnID, ScreenAdapter, screenAdapter;
  return {
    setters: [function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }, function (_cocosCoreMathIndexJs) {
      Size = _cocosCoreMathIndexJs.Size;
    }, function (_enumTypeOrientationJs) {
      Orientation = _enumTypeOrientationJs.Orientation;
    }, function (_cocosCorePlatformDebugJs) {
      warn = _cocosCorePlatformDebugJs.warn;
      warnID = _cocosCorePlatformDebugJs.warnID;
    }],
    execute: function () {
      ScreenAdapter = class ScreenAdapter extends EventTarget {
        get supportFullScreen() {
          return false;
        }
        get isFullScreen() {
          return false;
        }
        get devicePixelRatio() {
          return 1;
        }
        get windowSize() {
          return new Size(960, 640);
        }
        set windowSize(size) {
          warn("Setting window size is not supported yet.");
        }
        get resolution() {
          const windowSize = this.windowSize;
          const resolutionScale = this.resolutionScale;
          return new Size(windowSize.width * resolutionScale, windowSize.height * resolutionScale);
        }
        get resolutionScale() {
          return this._ccprivate$_resolutionScale;
        }
        set resolutionScale(v) {
          if (v === this._ccprivate$_resolutionScale) {
            return;
          }
          this._ccprivate$_resolutionScale = v;
        }
        get orientation() {
          return Orientation.PORTRAIT;
        }
        set orientation(value) {
          warnID(1221);
        }
        get safeAreaEdge() {
          return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          };
        }
        get isProportionalToFrame() {
          return this._ccprivate$_isProportionalToFrame;
        }
        set isProportionalToFrame(v) {}
        constructor() {
          super();
          this.isFrameRotated = false;
          this.handleResizeEvent = false;
          this._ccprivate$_resolutionScale = 1;
          this._ccprivate$_isProportionalToFrame = false;
        }
        init(options, cbToRebuildFrameBuffer) {}
        requestFullScreen() {
          return Promise.reject(new Error("request fullscreen has not been supported yet on this platform."));
        }
        exitFullScreen() {
          return Promise.reject(new Error("exit fullscreen has not been supported yet on this platform."));
        }
      };
      _export("screenAdapter", screenAdapter = new ScreenAdapter());
    }
  };
});