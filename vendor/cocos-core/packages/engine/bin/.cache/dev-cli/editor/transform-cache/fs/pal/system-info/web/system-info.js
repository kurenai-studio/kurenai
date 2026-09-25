System.register("q-bundled:///fs/pal/system-info/web/system-info.js", ["../../../../virtual/internal%253Aconstants.js", "../../../cocos/core/event/index.js", "../enum-type/browser-type.js", "../enum-type/language.js", "../enum-type/network-type.js", "../enum-type/operating-system.js", "../enum-type/platform.js", "../enum-type/feature.js", "../../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var EDITOR, TEST, PREVIEW, DEBUG, EventTarget, BrowserType, Language, NetworkType, OS, Platform, Feature, warn, SystemInfo, systemInfo;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      TEST = _virtualInternal253AconstantsJs.TEST;
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_cocosCoreEventIndexJs) {
      EventTarget = _cocosCoreEventIndexJs.EventTarget;
    }, function (_enumTypeBrowserTypeJs) {
      BrowserType = _enumTypeBrowserTypeJs.BrowserType;
    }, function (_enumTypeLanguageJs) {
      Language = _enumTypeLanguageJs.Language;
    }, function (_enumTypeNetworkTypeJs) {
      NetworkType = _enumTypeNetworkTypeJs.NetworkType;
    }, function (_enumTypeOperatingSystemJs) {
      OS = _enumTypeOperatingSystemJs.OS;
    }, function (_enumTypePlatformJs) {
      Platform = _enumTypePlatformJs.Platform;
    }, function (_enumTypeFeatureJs) {
      Feature = _enumTypeFeatureJs.Feature;
    }, function (_cocosCorePlatformDebugJs) {
      warn = _cocosCorePlatformDebugJs.warn;
    }],
    execute: function () {
      SystemInfo = class SystemInfo extends EventTarget {
        constructor() {
          super();
          this._ccprivate$_battery = null;
          this._ccprivate$_initPromise = [];
          const nav = window.navigator;
          const ua = nav.userAgent.toLowerCase();
          nav.getBattery == null || nav.getBattery().then(battery => {
            this._ccprivate$_battery = battery;
          });
          this.networkType = NetworkType.LAN;
          this.isNative = false;
          this.isBrowser = true;
          if (EDITOR) {
            this.isMobile = false;
            this.platform = Platform.EDITOR_PAGE;
          } else {
            this.isMobile = /mobile|android|iphone|ipad/.test(ua);
            this.platform = this.isMobile ? Platform.MOBILE_BROWSER : Platform.DESKTOP_BROWSER;
          }
          this.isLittleEndian = (() => {
            const buffer = new ArrayBuffer(2);
            new DataView(buffer).setInt16(0, 256, true);
            return new Int16Array(buffer)[0] === 256;
          })();
          let currLanguage = nav.language;
          this.nativeLanguage = currLanguage.toLowerCase();
          currLanguage = currLanguage || nav.browserLanguage;
          currLanguage = currLanguage ? currLanguage.split("-")[0] : Language.ENGLISH;
          this.language = currLanguage;
          let isAndroid = false;
          let iOS = false;
          let osVersion = "";
          let osMajorVersion = 0;
          let uaResult = /android\s*(\d+(?:\.\d+)*)/i.exec(ua) || /android\s*(\d+(?:\.\d+)*)/i.exec(nav.platform);
          if (uaResult) {
            isAndroid = true;
            osVersion = uaResult[1] || "";
            osMajorVersion = parseInt(osVersion) || 0;
          }
          uaResult = /(iPad|iPhone|iPod).*OS ((\d+_?){2,3})/i.exec(ua);
          if (uaResult) {
            iOS = true;
            osVersion = uaResult[2] || "";
            osMajorVersion = parseInt(osVersion) || 0;
          } else if (/(iPhone|iPad|iPod)/.exec(nav.platform) || nav.platform === "MacIntel" && nav.maxTouchPoints && nav.maxTouchPoints > 1) {
            iOS = true;
            osVersion = "";
            osMajorVersion = 0;
          }
          let osName = OS.UNKNOWN;
          if (nav.appVersion.indexOf("Win") !== -1) {
            osName = OS.WINDOWS;
          } else if (iOS) {
            osName = OS.IOS;
          } else if (nav.appVersion.indexOf("Mac") !== -1) {
            osName = OS.OSX;
          } else if (nav.appVersion.indexOf("X11") !== -1 && nav.appVersion.indexOf("Linux") === -1) {
            osName = OS.LINUX;
          } else if (isAndroid) {
            osName = OS.ANDROID;
          } else if (nav.appVersion.indexOf("Linux") !== -1 || ua.indexOf("ubuntu") !== -1) {
            osName = OS.LINUX;
          }
          this.os = osName;
          this.osVersion = osVersion;
          this.osMainVersion = osMajorVersion;
          this.browserType = BrowserType.UNKNOWN;
          const typeReg0 = /wechat|weixin|micromessenger/i;
          const typeReg1 = /mqqbrowser|micromessenger|qqbrowser|sogou|qzone|liebao|maxthon|ucbs|360 aphone|360browser|baiduboxapp|baidubrowser|maxthon|mxbrowser|miuibrowser/i;
          const typeReg2 = /qq|qqbrowser|ucbrowser|ubrowser|edge|HuaweiBrowser/i;
          const typeReg3 = /chrome|safari|firefox|trident|opera|opr\/|oupeng/i;
          const browserTypes = typeReg0.exec(ua) || typeReg1.exec(ua) || typeReg2.exec(ua) || typeReg3.exec(ua);
          let browserType = browserTypes ? browserTypes[0].toLowerCase() : OS.UNKNOWN;
          if (browserType === "safari" && isAndroid) {
            browserType = BrowserType.ANDROID;
          } else if (browserType === "qq" && /android.*applewebkit/i.test(ua)) {
            browserType = BrowserType.ANDROID;
          }
          const typeMap = {
            micromessenger: BrowserType.WECHAT,
            wechat: BrowserType.WECHAT,
            weixin: BrowserType.WECHAT,
            trident: BrowserType.IE,
            edge: BrowserType.EDGE,
            "360 aphone": BrowserType.BROWSER_360,
            mxbrowser: BrowserType.MAXTHON,
            "opr/": BrowserType.OPERA,
            ubrowser: BrowserType.UC,
            huaweibrowser: BrowserType.HUAWEI
          };
          this.browserType = typeMap[browserType] || browserType;
          this.browserVersion = "";
          const versionReg1 = /(mqqbrowser|micromessenger|qqbrowser|sogou|qzone|liebao|maxthon|uc|ucbs|360 aphone|360|baiduboxapp|baidu|maxthon|mxbrowser|miui(?:.hybrid)?)(mobile)?(browser)?\/?([\d.]+)/i;
          const versionReg2 = /(qq|chrome|safari|firefox|trident|opera|opr\/|oupeng)(mobile)?(browser)?\/?([\d.]+)/i;
          let tmp = versionReg1.exec(ua);
          if (!tmp) {
            tmp = versionReg2.exec(ua);
          }
          this.browserVersion = tmp ? tmp[4] : "";
          this.isXR = false;
          const _tmpCanvas1 = document.createElement("canvas");
          TEST ? false : !!_tmpCanvas1.getContext("2d");
          let supportWebp;
          try {
            supportWebp = TEST ? false : _tmpCanvas1.toDataURL("image/webp").startsWith("data:image/webp");
          } catch (e) {
            supportWebp = false;
          }
          if (this.os === OS.IOS) {
            var _exec;
            const result = (_exec = / applewebkit\/(\d+)/.exec(ua)) == null ? void 0 : _exec[1];
            if (typeof result === "string") {
              if (Number.parseInt(result) >= 604) {
                supportWebp = true;
              }
            }
          } else if (this.browserType === BrowserType.SAFARI) {
            var _exec2;
            const result = (_exec2 = / version\/(\d+)/.exec(ua)) == null ? void 0 : _exec2[1];
            if (typeof result === "string") {
              if (Number.parseInt(result) >= 14) {
                supportWebp = true;
              }
            }
          }
          const supportTouch = document.documentElement.ontouchstart !== undefined || document.ontouchstart !== undefined || EDITOR;
          const supportMouse = document.documentElement.onmouseup !== undefined || EDITOR;
          const supportXR = typeof navigator.xr !== "undefined";
          const supportWasm = (() => {
            const isSafari_15_4 = (this.os === OS.IOS || this.os === OS.OSX) && /(OS 15_4)|(Version\/15.4)/.test(window.navigator.userAgent);
            if (isSafari_15_4) {
              return false;
            }
            try {
              if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
                const module = new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
                if (module instanceof WebAssembly.Module) {
                  return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
                }
              }
            } catch (e) {
              return false;
            }
            return false;
          })();
          this._ccprivate$_featureMap = {
            [Feature.WEBP]: supportWebp,
            [Feature.IMAGE_BITMAP]: false,
            [Feature.WEB_VIEW]: true,
            [Feature.VIDEO_PLAYER]: true,
            [Feature.SAFE_AREA]: false,
            [Feature.HPE]: false,
            [Feature.INPUT_TOUCH]: supportTouch,
            [Feature.EVENT_KEYBOARD]: document.documentElement.onkeyup !== undefined || EDITOR,
            [Feature.EVENT_MOUSE]: supportMouse,
            [Feature.EVENT_TOUCH]: supportTouch || supportMouse,
            [Feature.EVENT_ACCELEROMETER]: window.DeviceMotionEvent !== undefined || window.DeviceOrientationEvent !== undefined,
            [Feature.EVENT_GAMEPAD]: navigator.getGamepads !== undefined || navigator.webkitGetGamepads !== undefined || supportXR,
            [Feature.EVENT_HANDLE]: EDITOR || PREVIEW,
            [Feature.EVENT_HMD]: supportXR,
            [Feature.EVENT_HANDHELD]: supportXR,
            [Feature.WASM]: supportWasm
          };
          this._ccprivate$_initPromise.push(this._ccprivate$_supportsImageBitmapPromise());
          this._ccprivate$_registerEvent();
        }
        _ccprivate$_supportsImageBitmapPromise() {
          if (!TEST && typeof createImageBitmap !== "undefined" && typeof Blob !== "undefined") {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 2;
            const promise = createImageBitmap(canvas);
            if (promise instanceof Promise) {
              return promise.then(imageBitmap => {
                if (imageBitmap && imageBitmap.close) {
                  this._ccprivate$_setFeature(Feature.IMAGE_BITMAP, true);
                  imageBitmap.close();
                }
              });
            } else if (DEBUG) {
              warn("The return value of createImageBitmap is not Promise.");
            }
          }
          return Promise.resolve();
        }
        _ccprivate$_registerEvent() {
          let hiddenPropName;
          if (typeof document.hidden !== "undefined") {
            hiddenPropName = "hidden";
          } else if (typeof document.mozHidden !== "undefined") {
            hiddenPropName = "mozHidden";
          } else if (typeof document.msHidden !== "undefined") {
            hiddenPropName = "msHidden";
          } else if (typeof document.webkitHidden !== "undefined") {
            hiddenPropName = "webkitHidden";
          } else {
            hiddenPropName = "hidden";
          }
          let hidden = false;
          const onHidden = () => {
            if (!hidden) {
              hidden = true;
              this.emit("hide");
            }
          };
          const onShown = (arg0, arg1, arg2, arg3, arg4) => {
            if (hidden) {
              hidden = false;
              this.emit("show", arg0, arg1, arg2, arg3, arg4);
            }
          };
          if (hiddenPropName) {
            const changeList = ["visibilitychange", "mozvisibilitychange", "msvisibilitychange", "webkitvisibilitychange", "qbrowserVisibilityChange"];
            for (let i = 0; i < changeList.length; i++) {
              document.addEventListener(changeList[i], event => {
                let visible = document[hiddenPropName];
                visible = visible || event.hidden;
                if (visible) {
                  onHidden();
                } else {
                  onShown();
                }
              });
            }
          } else {
            window.addEventListener("blur", onHidden);
            window.addEventListener("focus", onShown);
          }
          if (window.navigator.userAgent.indexOf("MicroMessenger") > -1) {
            window.onfocus = onShown;
          }
          if ("onpageshow" in window && "onpagehide" in window) {
            window.addEventListener("pagehide", onHidden);
            window.addEventListener("pageshow", onShown);
            document.addEventListener("pagehide", onHidden);
            document.addEventListener("pageshow", onShown);
          }
        }
        _ccprivate$_setFeature(feature, value) {
          return this._ccprivate$_featureMap[feature] = value;
        }
        init() {
          return Promise.all(this._ccprivate$_initPromise);
        }
        hasFeature(feature) {
          return this._ccprivate$_featureMap[feature];
        }
        getBatteryLevel() {
          if (this._ccprivate$_battery) {
            return this._ccprivate$_battery.level;
          } else {
            if (DEBUG) {
              warn("getBatteryLevel is not supported");
            }
            return 1;
          }
        }
        triggerGC() {
          if (DEBUG) {
            warn("triggerGC is not supported.");
          }
        }
        openURL(url) {
          window.open(url);
        }
        now() {
          if (Date.now) {
            return Date.now();
          }
          return +new Date();
        }
        restartJSVM() {
          if (DEBUG) {
            warn("restartJSVM is not supported.");
          }
        }
        exit() {
          window.close();
        }
        close() {
          this.emit("close");
        }
      };
      _export("systemInfo", systemInfo = new SystemInfo());
    }
  };
});