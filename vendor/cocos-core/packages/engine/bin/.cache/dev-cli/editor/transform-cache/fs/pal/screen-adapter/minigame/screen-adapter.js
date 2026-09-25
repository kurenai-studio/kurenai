System.register("q-bundled:///fs/pal/screen-adapter/minigame/screen-adapter.js", ["../../../../virtual/internal%253Aconstants.js", "pal/minigame", "pal/system-info", "../../../cocos/core/platform/debug.js", "../../../cocos/core/event/event-target.js", "../../../cocos/core/math/index.js", "../../system-info/enum-type/browser-type.js", "../../system-info/enum-type/language.js", "../../system-info/enum-type/network-type.js", "../../system-info/enum-type/operating-system.js", "../../system-info/enum-type/platform.js", "../../system-info/enum-type/feature.js"], function (_export, _context) {
  "use strict";

  var ALIPAY, WECHAT, BYTEDANCE, TAOBAO_MINIGAME, VIVO, minigame, systemInfo, warnID, getError, EventTarget, Size, OS, ScreenAdapter, rotateLandscape, screenAdapter;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      ALIPAY = _virtualInternal253AconstantsJs.ALIPAY;
      WECHAT = _virtualInternal253AconstantsJs.WECHAT;
      BYTEDANCE = _virtualInternal253AconstantsJs.BYTEDANCE;
      TAOBAO_MINIGAME = _virtualInternal253AconstantsJs.TAOBAO_MINIGAME;
      VIVO = _virtualInternal253AconstantsJs.VIVO;
    }, function (_palMinigame) {
      minigame = _palMinigame.minigame;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_cocosCorePlatformDebugJs) {
      warnID = _cocosCorePlatformDebugJs.warnID;
      getError = _cocosCorePlatformDebugJs.getError;
    }, function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }, function (_cocosCoreMathIndexJs) {
      Size = _cocosCoreMathIndexJs.Size;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {}, function (_systemInfoEnumTypeLanguageJs) {}, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {
      OS = _systemInfoEnumTypeOperatingSystemJs.OS;
    }, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {}],
    execute: function () {
      rotateLandscape = false;
      try {
        if (ALIPAY) {
          if (systemInfo.os === OS.IOS && !minigame.isDevTool) {
            const fs = my.getFileSystemManager();
            const screenOrientation = JSON.parse(fs.readFileSync({
              filePath: "game.json",
              encoding: "utf8"
            }).data).screenOrientation;
            rotateLandscape = screenOrientation === "landscape";
          }
        }
      } catch (e) {
        console.error(e);
      }
      ScreenAdapter = class ScreenAdapter extends EventTarget {
        get supportFullScreen() {
          return false;
        }
        get isFullScreen() {
          return false;
        }
        get devicePixelRatio() {
          if (WECHAT) {
            const sysInfo = minigame.getWindowInfo();
            return sysInfo.pixelRatio;
          }
          const sysInfo = minigame.getSystemInfoSync();
          return sysInfo.pixelRatio;
        }
        get windowSize() {
          let sysInfo;
          if (WECHAT) {
            sysInfo = minigame.getWindowInfo();
          } else {
            sysInfo = minigame.getSystemInfoSync();
          }
          const dpr = this.devicePixelRatio;
          let screenWidth = sysInfo.windowWidth;
          let screenHeight = sysInfo.windowHeight;
          if (BYTEDANCE) {
            screenWidth = sysInfo.screenWidth;
            screenHeight = sysInfo.screenHeight;
          } else if (ALIPAY && rotateLandscape && screenWidth < screenHeight) {
            const temp = screenWidth;
            screenWidth = screenHeight;
            screenHeight = temp;
          } else if (TAOBAO_MINIGAME) {
            const windowInfo = my.getWindowInfoSync();
            if (windowInfo) {
              screenWidth = windowInfo.windowWidth;
              screenHeight = windowInfo.windowHeight;
            }
          }
          return new Size(screenWidth * dpr, screenHeight * dpr);
        }
        set windowSize(size) {
          warnID(1221);
        }
        get resolution() {
          const windowSize = this.windowSize;
          const resolutionScale = this.resolutionScale;
          return new Size(windowSize.width * resolutionScale, windowSize.height * resolutionScale);
        }
        get resolutionScale() {
          return this._ccprivate$_resolutionScale;
        }
        set resolutionScale(value) {
          var _this$_ccprivate$_cbT;
          if (value === this._ccprivate$_resolutionScale) {
            return;
          }
          this._ccprivate$_resolutionScale = value;
          (_this$_ccprivate$_cbT = this._ccprivate$_cbToUpdateFrameBuffer) == null || _this$_ccprivate$_cbT.call(this);
        }
        get orientation() {
          return minigame.orientation;
        }
        set orientation(value) {
          warnID(1221);
        }
        get safeAreaEdge() {
          const minigameSafeArea = minigame.getSafeArea();
          const windowSize = this.windowSize;
          const dpr = VIVO ? 1 : this.devicePixelRatio;
          const topEdge = minigameSafeArea.top * dpr;
          const bottomEdge = windowSize.height - minigameSafeArea.bottom * dpr;
          const leftEdge = minigameSafeArea.left * dpr;
          const rightEdge = windowSize.width - minigameSafeArea.right * dpr;
          return {
            top: topEdge,
            bottom: bottomEdge,
            left: leftEdge,
            right: rightEdge
          };
        }
        get isProportionalToFrame() {
          return this._ccprivate$_isProportionalToFrame;
        }
        set isProportionalToFrame(v) {}
        constructor() {
          super();
          this.isFrameRotated = false;
          this.handleResizeEvent = true;
          this._ccprivate$_cbToUpdateFrameBuffer = void 0;
          this._ccprivate$_resolutionScale = 1;
          this._ccprivate$_isProportionalToFrame = false;
          minigame.onWindowResize == null || minigame.onWindowResize(() => {
            this.emit("window-resize", this.windowSize.width, this.windowSize.height);
          });
        }
        init(options, cbToRebuildFrameBuffer) {
          this._ccprivate$_cbToUpdateFrameBuffer = cbToRebuildFrameBuffer;
          this._ccprivate$_cbToUpdateFrameBuffer();
        }
        requestFullScreen() {
          return Promise.reject(new Error(getError(9008)));
        }
        exitFullScreen() {
          return Promise.reject(new Error(getError(9009)));
        }
      };
      _export("screenAdapter", screenAdapter = new ScreenAdapter());
    }
  };
});