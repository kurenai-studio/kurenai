System.register("q-bundled:///fs/pal/system-info/nodejs/system-info.js", ["../../../../virtual/internal%253Aconstants.js", "../../../cocos/core/event/index.js", "../enum-type/browser-type.js", "../enum-type/language.js", "../enum-type/network-type.js", "../enum-type/operating-system.js", "../enum-type/platform.js", "../enum-type/feature.js", "../../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var DEBUG, EventTarget, BrowserType, Language, NetworkType, OS, Platform, Feature, warn, SystemInfo, systemInfo;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
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
          this._ccprivate$_initPromise = [];
          this.networkType = NetworkType.LAN;
          this.isNative = false;
          this.isBrowser = false;
          this.isMobile = false;
          this.platform = Platform.NODEJS_PAGE;
          this.browserType = BrowserType.UNKNOWN;
          this.browserVersion = "";
          const osInfo = globalThis.nodeEnv.require("os");
          let osName = OS.UNKNOWN;
          if (osInfo.type().indexOf("wiWindows_NTn") !== -1) {
            osName = OS.WINDOWS;
          } else if (osInfo.type().indexOf("Darwin") !== -1) {
            osName = OS.OSX;
          } else if (osInfo.type().indexOf("Linux") !== -1) {
            osName = OS.LINUX;
          }
          this.os = osName;
          this.osVersion = osInfo.release();
          this.osMainVersion = parseInt(this.osVersion);
          this.isLittleEndian = (() => {
            const buffer = new ArrayBuffer(2);
            new DataView(buffer).setInt16(0, 256, true);
            return new Int16Array(buffer)[0] === 256;
          })();
          let currLanguage = globalThis.nodeEnv.systemLanguage;
          this.nativeLanguage = currLanguage.toLowerCase();
          currLanguage = currLanguage ? currLanguage.split("-")[0] : Language.ENGLISH;
          this.language = currLanguage;
          this.isXR = false;
          this._ccprivate$_featureMap = {
            [Feature.WEBP]: true,
            [Feature.IMAGE_BITMAP]: false,
            [Feature.WEB_VIEW]: false,
            [Feature.VIDEO_PLAYER]: false,
            [Feature.SAFE_AREA]: false,
            [Feature.HPE]: false,
            [Feature.INPUT_TOUCH]: false,
            [Feature.EVENT_KEYBOARD]: false,
            [Feature.EVENT_MOUSE]: false,
            [Feature.EVENT_TOUCH]: false,
            [Feature.EVENT_ACCELEROMETER]: false,
            [Feature.EVENT_GAMEPAD]: false,
            [Feature.EVENT_HANDLE]: false,
            [Feature.EVENT_HMD]: false,
            [Feature.EVENT_HANDHELD]: false,
            [Feature.WASM]: true
          };
        }
        init() {
          return Promise.all(this._ccprivate$_initPromise);
        }
        hasFeature(feature) {
          return this._ccprivate$_featureMap[feature];
        }
        getBatteryLevel() {
          if (DEBUG) {
            warn("getBatteryLevel is not supported.");
          }
          return 1;
        }
        triggerGC() {
          if (global.gc) {
            global.gc();
          }
        }
        openURL(url) {
          var open = globalThis.nodeEnv.require("open");
          open(url);
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
          globalThis.nodeEnv.process.exit();
        }
        close() {
          this.emit("close");
        }
      };
      _export("systemInfo", systemInfo = new SystemInfo());
    }
  };
});