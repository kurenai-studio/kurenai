System.register("q-bundled:///fs/pal/screen-adapter/web/screen-adapter.js", ["../../../../virtual/internal%253Aconstants.js", "pal/system-info", "../../../cocos/core/platform/debug.js", "../../../cocos/core/event/event-target.js", "../../../cocos/core/math/index.js", "../enum-type/orientation.js", "../../../predefine.js", "../../system-info/enum-type/browser-type.js", "../../system-info/enum-type/language.js", "../../system-info/enum-type/network-type.js", "../../system-info/enum-type/operating-system.js", "../../system-info/enum-type/platform.js", "../../system-info/enum-type/feature.js"], function (_export, _context) {
  "use strict";

  var TEST, EDITOR, systemInfo, warnID, EventTarget, Size, Orientation, legacyCC, OS, ScreenAdapter, EVENT_TIMEOUT, orientationMap, WindowType, screenAdapter;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      TEST = _virtualInternal253AconstantsJs.TEST;
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_cocosCorePlatformDebugJs) {
      warnID = _cocosCorePlatformDebugJs.warnID;
    }, function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }, function (_cocosCoreMathIndexJs) {
      Size = _cocosCoreMathIndexJs.Size;
    }, function (_enumTypeOrientationJs) {
      Orientation = _enumTypeOrientationJs.Orientation;
    }, function (_predefineJs) {
      legacyCC = _predefineJs.default;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {}, function (_systemInfoEnumTypeLanguageJs) {}, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {
      OS = _systemInfoEnumTypeOperatingSystemJs.OS;
    }, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {}],
    execute: function () {
      EVENT_TIMEOUT = EDITOR ? 5 : 200;
      orientationMap = {
        auto: Orientation.AUTO,
        landscape: Orientation.LANDSCAPE,
        portrait: Orientation.PORTRAIT
      };
      (function (WindowType) {
        WindowType[WindowType["Unknown"] = 0] = "Unknown";
        WindowType[WindowType["SubFrame"] = 1] = "SubFrame";
        WindowType[WindowType["BrowserWindow"] = 2] = "BrowserWindow";
        WindowType[WindowType["Fullscreen"] = 3] = "Fullscreen";
      })(WindowType || (WindowType = {}));
      ScreenAdapter = class ScreenAdapter extends EventTarget {
        get supportFullScreen() {
          return this._ccprivate$_supportFullScreen;
        }
        get isFullScreen() {
          if (!this._ccprivate$_supportFullScreen) {
            return false;
          }
          return !!document[this._ccprivate$_fn.fullscreenElement];
        }
        get devicePixelRatio() {
          var _window$devicePixelRa;
          return Math.min((_window$devicePixelRa = window.devicePixelRatio) != null ? _window$devicePixelRa : 1, 2);
        }
        get windowSize() {
          const result = this._windowSizeInCssPixels;
          const dpr = this.devicePixelRatio;
          result.width *= dpr;
          result.height *= dpr;
          return result;
        }
        set windowSize(size) {
          if (this._windowType !== WindowType.SubFrame) {
            warnID(9202);
            return;
          }
          this._ccprivate$_resizeFrame(this._ccprivate$_convertToSizeInCssPixels(size));
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
          var _this$_ccprivate$_cbT;
          if (v === this._ccprivate$_resolutionScale) {
            return;
          }
          this._ccprivate$_resolutionScale = v;
          (_this$_ccprivate$_cbT = this._ccprivate$_cbToUpdateFrameBuffer) == null || _this$_ccprivate$_cbT.call(this);
        }
        get orientation() {
          return this._ccprivate$_orientation;
        }
        set orientation(value) {
          if (this._ccprivate$_orientation === value) {
            return;
          }
          this._ccprivate$_orientation = value;
          this._ccprivate$_updateFrame();
        }
        _ccprivate$_updateFrame() {
          this._ccprivate$_updateFrameState();
          this._ccprivate$_resizeFrame();
        }
        get safeAreaEdge() {
          const dpr = this.devicePixelRatio;
          const _top = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-top") || "0") * dpr;
          const _bottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-bottom") || "0") * dpr;
          const _left = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-left") || "0") * dpr;
          const _right = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-right") || "0") * dpr;
          return {
            top: _top,
            bottom: _bottom,
            left: _left,
            right: _right
          };
        }
        get isProportionalToFrame() {
          return this._ccprivate$_isProportionalToFrame;
        }
        set isProportionalToFrame(v) {
          if (this._ccprivate$_isProportionalToFrame === v) {
            return;
          }
          this._ccprivate$_isProportionalToFrame = v;
          this._ccprivate$_updateContainer();
        }
        get _windowSizeInCssPixels() {
          if (TEST) {
            return new Size(window.innerWidth, window.innerHeight);
          }
          if (this.isProportionalToFrame) {
            if (!this._ccprivate$_gameContainer) {
              warnID(9201);
              return new Size(0, 0);
            }
            return new Size(this._ccprivate$_gameContainer.clientWidth, this._ccprivate$_gameContainer.clientHeight);
          }
          let fullscreenTarget;
          let width;
          let height;
          switch (this._windowType) {
            case WindowType.SubFrame:
              if (!this._ccprivate$_gameFrame) {
                warnID(9201);
                return new Size(0, 0);
              }
              return new Size(this._ccprivate$_gameFrame.clientWidth, this._ccprivate$_gameFrame.clientHeight);
            case WindowType.Fullscreen:
              fullscreenTarget = this._ccprivate$_getFullscreenTarget();
              width = this.isFrameRotated ? fullscreenTarget.clientHeight : fullscreenTarget.clientWidth;
              height = this.isFrameRotated ? fullscreenTarget.clientWidth : fullscreenTarget.clientHeight;
              return new Size(width, height);
            case WindowType.BrowserWindow:
              width = this.isFrameRotated ? window.innerHeight : window.innerWidth;
              height = this.isFrameRotated ? window.innerWidth : window.innerHeight;
              return new Size(width, height);
            case WindowType.Unknown:
            default:
              return new Size(1, 1);
          }
        }
        get _windowType() {
          if (this._ccprivate$_isHeadlessMode) {
            return WindowType.Unknown;
          }
          if (this.isFullScreen) {
            return WindowType.Fullscreen;
          }
          if (!this._ccprivate$_gameFrame) {
            warnID(9201);
            return WindowType.Unknown;
          }
          if (this._ccprivate$_exactFitScreen) {
            return WindowType.BrowserWindow;
          }
          return WindowType.SubFrame;
        }
        constructor() {
          super();
          this.isFrameRotated = false;
          this.handleResizeEvent = true;
          this._ccprivate$_gameFrame = void 0;
          this._ccprivate$_gameContainer = void 0;
          this._ccprivate$_gameCanvas = void 0;
          this._ccprivate$_isProportionalToFrame = false;
          this._ccprivate$_cachedFrameStyle = {
            width: "0px",
            height: "0px"
          };
          this._ccprivate$_cachedContainerStyle = {
            width: "0px",
            height: "0px"
          };
          this._ccprivate$_cbToUpdateFrameBuffer = void 0;
          this._ccprivate$_supportFullScreen = false;
          this._ccprivate$_touchEventName = void 0;
          this._ccprivate$_onFullscreenChange = void 0;
          this._ccprivate$_onFullscreenError = void 0;
          this._ccprivate$_orientationChangeTimeoutId = -1;
          this._ccprivate$_cachedFrameSize = new Size(0, 0);
          this._ccprivate$_exactFitScreen = false;
          this._ccprivate$_isHeadlessMode = false;
          this._ccprivate$_fn = {};
          this._ccprivate$_fnGroup = [["requestFullscreen", "exitFullscreen", "fullscreenchange", "fullscreenEnabled", "fullscreenElement", "fullscreenerror"], ["requestFullScreen", "exitFullScreen", "fullScreenchange", "fullScreenEnabled", "fullScreenElement", "fullscreenerror"], ["webkitRequestFullScreen", "webkitCancelFullScreen", "webkitfullscreenchange", "webkitIsFullScreen", "webkitCurrentFullScreenElement", "webkitfullscreenerror"], ["mozRequestFullScreen", "mozCancelFullScreen", "mozfullscreenchange", "mozFullScreen", "mozFullScreenElement", "mozfullscreenerror"], ["msRequestFullscreen", "msExitFullscreen", "MSFullscreenChange", "msFullscreenEnabled", "msFullscreenElement", "msfullscreenerror"]];
          this._ccprivate$_resolutionScale = 1;
          this._ccprivate$_orientation = Orientation.AUTO;
          this._ccprivate$_orientationDevice = Orientation.AUTO;
          this._ccprivate$_gameFrame = document.getElementById("GameDiv");
          this._ccprivate$_gameContainer = document.getElementById("Cocos3dGameContainer");
          this._ccprivate$_gameCanvas = document.getElementById("GameCanvas");
          if (!TEST && !EDITOR) {
            if (!this._ccprivate$_gameFrame) {
              var _this$_ccprivate$_gam;
              this._ccprivate$_gameFrame = document.createElement("div");
              this._ccprivate$_gameFrame.setAttribute("id", "GameDiv");
              (_this$_ccprivate$_gam = this._ccprivate$_gameCanvas) == null || (_this$_ccprivate$_gam = _this$_ccprivate$_gam.parentNode) == null || _this$_ccprivate$_gam.insertBefore(this._ccprivate$_gameFrame, this._ccprivate$_gameCanvas);
              this._ccprivate$_gameFrame.appendChild(this._ccprivate$_gameCanvas);
            }
            if (!this._ccprivate$_gameContainer) {
              var _this$_ccprivate$_gam2;
              this._ccprivate$_gameContainer = document.createElement("div");
              this._ccprivate$_gameContainer.setAttribute("id", "Cocos3dGameContainer");
              (_this$_ccprivate$_gam2 = this._ccprivate$_gameCanvas) == null || (_this$_ccprivate$_gam2 = _this$_ccprivate$_gam2.parentNode) == null || _this$_ccprivate$_gam2.insertBefore(this._ccprivate$_gameContainer, this._ccprivate$_gameCanvas);
              this._ccprivate$_gameContainer.appendChild(this._ccprivate$_gameCanvas);
            }
          }
          let fnList;
          const fnGroup = this._ccprivate$_fnGroup;
          for (let i = 0; i < fnGroup.length; i++) {
            fnList = fnGroup[i];
            if (typeof document[fnList[1]] !== "undefined") {
              for (let i = 0; i < fnList.length; i++) {
                this._ccprivate$_fn[fnGroup[0][i]] = fnList[i];
              }
              break;
            }
          }
          this._ccprivate$_supportFullScreen = this._ccprivate$_fn.requestFullscreen !== undefined;
          this._ccprivate$_touchEventName = "ontouchstart" in window ? "touchend" : "mousedown";
          this._ccprivate$_registerEvent();
        }
        init(options, cbToRebuildFrameBuffer) {
          this._ccprivate$_cbToUpdateFrameBuffer = cbToRebuildFrameBuffer;
          this.orientation = orientationMap[options.configOrientation];
          this._ccprivate$_exactFitScreen = options.exactFitScreen;
          this._ccprivate$_isHeadlessMode = options.isHeadlessMode;
          this._ccprivate$_resizeFrame();
        }
        requestFullScreen() {
          return new Promise((resolve, reject) => {
            if (this.isFullScreen) {
              resolve();
              return;
            }
            this._ccprivate$_cachedFrameSize = this.windowSize;
            this._ccprivate$_doRequestFullScreen().then(() => {
              resolve();
            }).catch(() => {
              const fullscreenTarget = this._ccprivate$_getFullscreenTarget();
              if (!fullscreenTarget) {
                reject(new Error("Cannot access fullscreen target"));
                return;
              }
              fullscreenTarget.addEventListener(this._ccprivate$_touchEventName, () => {
                this._ccprivate$_doRequestFullScreen().then(() => {
                  resolve();
                }).catch(reject);
              }, {
                once: true,
                capture: true
              });
            });
          });
        }
        exitFullScreen() {
          return new Promise((resolve, reject) => {
            const requestPromise = document[this._ccprivate$_fn.exitFullscreen]();
            if (window.Promise && requestPromise instanceof Promise) {
              requestPromise.then(() => {
                this.windowSize = this._ccprivate$_cachedFrameSize;
                resolve();
              }).catch(reject);
              return;
            }
            this.windowSize = this._ccprivate$_cachedFrameSize;
            resolve();
          });
        }
        _ccprivate$_registerEvent() {
          document.addEventListener(this._ccprivate$_fn.fullscreenerror, () => {
            var _this$_ccprivate$_onF;
            (_this$_ccprivate$_onF = this._ccprivate$_onFullscreenError) == null || _this$_ccprivate$_onF.call(this);
          });
          window.addEventListener("resize", () => {
            this._ccprivate$_updateFrame();
          });
          const notifyOrientationChange = orientation => {
            if (orientation === this._ccprivate$_orientationDevice) {
              return;
            }
            this._ccprivate$_orientationDevice = orientation;
            this._ccprivate$_updateFrame();
            this.emit("orientation-change", orientation);
          };
          const getOrientation = () => {
            let tmpOrientation = Orientation.PORTRAIT;
            switch (window.orientation) {
              case 0:
                tmpOrientation = Orientation.PORTRAIT;
                break;
              case 90:
                tmpOrientation = Orientation.LANDSCAPE_RIGHT;
                break;
              case -90:
                tmpOrientation = Orientation.LANDSCAPE_LEFT;
                break;
              case 180:
                tmpOrientation = Orientation.PORTRAIT_UPSIDE_DOWN;
                break;
              default:
                tmpOrientation = this._ccprivate$_orientationDevice;
                break;
            }
            return tmpOrientation;
          };
          let handleOrientationChange;
          const orientationChangeCallback = () => {
            if (this._ccprivate$_orientationChangeTimeoutId !== -1) {
              clearTimeout(this._ccprivate$_orientationChangeTimeoutId);
            }
            this._ccprivate$_orientationChangeTimeoutId = setTimeout(() => {
              handleOrientationChange();
            }, EVENT_TIMEOUT);
          };
          if (typeof window.matchMedia === "function") {
            const updateDPRChangeListener = () => {
              const dpr = this.devicePixelRatio;
              const mediaQueryResolution = window.matchMedia(`(resolution: ${dpr}dppx)`);
              if (mediaQueryResolution.addEventListener) {
                mediaQueryResolution.addEventListener("change", () => {
                  this.emit("window-resize", this.windowSize.width, this.windowSize.height);
                  updateDPRChangeListener();
                }, {
                  once: true
                });
              } else if (mediaQueryResolution.addListener) {
                mediaQueryResolution.addListener(() => {
                  this.emit("window-resize", this.windowSize.width, this.windowSize.height);
                });
              }
            };
            updateDPRChangeListener();
            const mediaQueryPortrait = window.matchMedia("(orientation: portrait)");
            const mediaQueryLandscape = window.matchMedia("(orientation: landscape)");
            const hasScreeOrientation = screen.orientation;
            handleOrientationChange = () => {
              let tmpOrientation = this._ccprivate$_orientationDevice;
              if (mediaQueryPortrait.matches) {
                tmpOrientation = Orientation.PORTRAIT;
                if (hasScreeOrientation) {
                  const orientationType = screen.orientation.type;
                  if (orientationType === "portrait-primary") {
                    tmpOrientation = Orientation.PORTRAIT;
                  } else {
                    tmpOrientation = Orientation.PORTRAIT_UPSIDE_DOWN;
                  }
                }
              } else if (mediaQueryLandscape.matches) {
                tmpOrientation = Orientation.LANDSCAPE;
                if (hasScreeOrientation) {
                  const orientationType = screen.orientation.type;
                  if (orientationType === "landscape-primary") {
                    tmpOrientation = Orientation.LANDSCAPE_LEFT;
                  } else {
                    tmpOrientation = Orientation.LANDSCAPE_RIGHT;
                  }
                }
              }
              notifyOrientationChange(tmpOrientation);
            };
            if (mediaQueryPortrait.addEventListener) {
              mediaQueryPortrait.addEventListener("change", orientationChangeCallback);
              mediaQueryLandscape.addEventListener("change", orientationChangeCallback);
            } else if (mediaQueryPortrait.addListener) {
              mediaQueryPortrait.addListener(orientationChangeCallback);
              mediaQueryLandscape.addListener(orientationChangeCallback);
            }
          } else {
            handleOrientationChange = () => {
              const tmpOrientation = getOrientation();
              notifyOrientationChange(tmpOrientation);
            };
            window.addEventListener("orientationchange", orientationChangeCallback);
          }
          document.addEventListener(this._ccprivate$_fn.fullscreenchange, () => {
            var _this$_ccprivate$_onF2;
            (_this$_ccprivate$_onF2 = this._ccprivate$_onFullscreenChange) == null || _this$_ccprivate$_onF2.call(this);
            this.emit("fullscreen-change", this.windowSize.width, this.windowSize.height);
          });
        }
        _ccprivate$_convertToSizeInCssPixels(size) {
          const clonedSize = size.clone();
          const dpr = this.devicePixelRatio;
          clonedSize.width /= dpr;
          clonedSize.height /= dpr;
          return clonedSize;
        }
        _ccprivate$_resizeFrame(sizeInCssPixels) {
          if (!this._ccprivate$_gameFrame) {
            return;
          }
          this._ccprivate$_gameFrame.style.display = "flex";
          this._ccprivate$_gameFrame.style["justify-content"] = "center";
          this._ccprivate$_gameFrame.style["align-items"] = "center";
          if (this._windowType === WindowType.SubFrame) {
            if (!sizeInCssPixels) {
              this._ccprivate$_updateContainer();
              return;
            }
            this._ccprivate$_gameFrame.style.width = `${sizeInCssPixels.width}px`;
            this._ccprivate$_gameFrame.style.height = `${sizeInCssPixels.height}px`;
          } else {
            const winWidth = window.innerWidth;
            let winHeight = window.innerHeight;
            const inputHeight = document.body.scrollHeight - winHeight;
            if (systemInfo.os === OS.ANDROID && winHeight < inputHeight) {
              winHeight += inputHeight;
            }
            if (this.isFrameRotated) {
              this._ccprivate$_gameFrame.style["-webkit-transform"] = "rotate(90deg)";
              this._ccprivate$_gameFrame.style.transform = "rotate(90deg)";
              this._ccprivate$_gameFrame.style["-webkit-transform-origin"] = "0px 0px 0px";
              this._ccprivate$_gameFrame.style.transformOrigin = "0px 0px 0px";
              this._ccprivate$_gameFrame.style.margin = `0 0 0 ${winWidth}px`;
              this._ccprivate$_gameFrame.style.width = `${winHeight}px`;
              this._ccprivate$_gameFrame.style.height = `${winWidth}px`;
            } else {
              this._ccprivate$_gameFrame.style["-webkit-transform"] = "rotate(0deg)";
              this._ccprivate$_gameFrame.style.transform = "rotate(0deg)";
              this._ccprivate$_gameFrame.style.margin = "0px auto";
              this._ccprivate$_gameFrame.style.width = `${winWidth}px`;
              this._ccprivate$_gameFrame.style.height = `${winHeight}px`;
            }
          }
          this._ccprivate$_updateContainer();
        }
        _ccprivate$_getFullscreenTarget() {
          const windowType = this._windowType;
          if (windowType === WindowType.Fullscreen) {
            return document[this._ccprivate$_fn.fullscreenElement];
          }
          if (windowType === WindowType.SubFrame) {
            return this._ccprivate$_gameFrame;
          }
          return document.body;
        }
        _ccprivate$_doRequestFullScreen() {
          return new Promise((resolve, reject) => {
            if (!this._ccprivate$_supportFullScreen) {
              reject(new Error("fullscreen is not supported"));
              return;
            }
            const fullscreenTarget = this._ccprivate$_getFullscreenTarget();
            if (!fullscreenTarget) {
              reject(new Error("Cannot access fullscreen target"));
              return;
            }
            this._ccprivate$_onFullscreenChange = undefined;
            this._ccprivate$_onFullscreenError = undefined;
            const requestPromise = fullscreenTarget[this._ccprivate$_fn.requestFullscreen]();
            if (window.Promise && requestPromise instanceof Promise) {
              requestPromise.then(resolve).catch(reject);
            } else {
              this._ccprivate$_onFullscreenChange = resolve;
              this._ccprivate$_onFullscreenError = reject;
            }
          });
        }
        _ccprivate$_updateFrameState() {
          const orientation = this.orientation;
          const width = window.innerWidth;
          const height = window.innerHeight;
          const isBrowserLandscape = width > height;
          this.isFrameRotated = systemInfo.isMobile && (isBrowserLandscape && orientation === Orientation.PORTRAIT || !isBrowserLandscape && orientation === Orientation.LANDSCAPE);
        }
        _ccprivate$_updateContainer() {
          if (!this._ccprivate$_gameContainer) {
            warnID(9201);
            return;
          }
          if (this.isProportionalToFrame) {
            if (!this._ccprivate$_gameFrame) {
              warnID(9201);
              return;
            }
            const designedResolution = legacyCC.view.getDesignResolutionSize();
            const frame = this._ccprivate$_gameFrame;
            const frameW = frame.clientWidth;
            const frameH = frame.clientHeight;
            const designW = designedResolution.width;
            const designH = designedResolution.height;
            const scaleX = frameW / designW;
            const scaleY = frameH / designH;
            const containerStyle = this._ccprivate$_gameContainer.style;
            let containerW;
            let containerH;
            if (scaleX < scaleY) {
              containerW = frameW;
              containerH = designH * scaleX;
            } else {
              containerW = designW * scaleY;
              containerH = frameH;
            }
            containerStyle.width = `${containerW}px`;
            containerStyle.height = `${containerH}px`;
          } else {
            const containerStyle = this._ccprivate$_gameContainer.style;
            containerStyle.width = "100%";
            containerStyle.height = "100%";
          }
          if (this._ccprivate$_gameFrame && (this._ccprivate$_cachedFrameStyle.width !== this._ccprivate$_gameFrame.style.width || this._ccprivate$_cachedFrameStyle.height !== this._ccprivate$_gameFrame.style.height || this._ccprivate$_cachedContainerStyle.width !== this._ccprivate$_gameContainer.style.width || this._ccprivate$_cachedContainerStyle.height !== this._ccprivate$_gameContainer.style.height)) {
            this.emit("window-resize", this.windowSize.width, this.windowSize.height);
            this._ccprivate$_cachedFrameStyle.width = this._ccprivate$_gameFrame.style.width;
            this._ccprivate$_cachedFrameStyle.height = this._ccprivate$_gameFrame.style.height;
            this._ccprivate$_cachedContainerStyle.width = this._ccprivate$_gameContainer.style.width;
            this._ccprivate$_cachedContainerStyle.height = this._ccprivate$_gameContainer.style.height;
          }
        }
      };
      _export("screenAdapter", screenAdapter = new ScreenAdapter());
    }
  };
});