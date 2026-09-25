System.register("q-bundled:///fs/pal/minigame/taobao.js", ["../screen-adapter/enum-type/orientation.js", "../utils.js", "../system-info/enum-type/browser-type.js", "../system-info/enum-type/language.js", "../system-info/enum-type/network-type.js", "../system-info/enum-type/operating-system.js", "../system-info/enum-type/platform.js", "../system-info/enum-type/feature.js"], function (_export, _context) {
  "use strict";

  var Orientation, cloneObject, createInnerAudioContextPolyfill, versionCompare, Language, languageMap, minigame, systemInfo, landscapeOrientation, polyfilledCreateInnerAudio, _accelerometerCb, hasAdapter;
  function detectLandscapeSupport() {
    const locSysInfo = minigame.getSystemInfoSync();
    if (typeof locSysInfo.deviceOrientation === "string" && locSysInfo.deviceOrientation.startsWith("landscape")) {
      if (versionCompare(locSysInfo.version, "10.15.10") < 0) {
        console.warn("The current Taobao client version does not support Landscape, the minimum requirement is 10.15.10");
      }
    }
  }
  function adapterGL(gl) {
    if (hasAdapter) {
      return;
    }
    hasAdapter = true;
    if (!my.isIDE) {
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      if (my.getSystemInfoSync().platform.toLocaleLowerCase() === "ios") {
        const originalGetUniformLocation = gl.getUniformLocation.bind(gl);
        gl.getUniformLocation = function (program, name) {
          const glLoc = originalGetUniformLocation(program, name);
          if (glLoc && glLoc.ID === -1) {
            return undefined;
          }
          return originalGetUniformLocation(program, name);
        };
      }
    }
  }
  return {
    setters: [function (_screenAdapterEnumTypeOrientationJs) {
      Orientation = _screenAdapterEnumTypeOrientationJs.Orientation;
    }, function (_utilsJs) {
      cloneObject = _utilsJs.cloneObject;
      createInnerAudioContextPolyfill = _utilsJs.createInnerAudioContextPolyfill;
      versionCompare = _utilsJs.versionCompare;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {}, function (_systemInfoEnumTypeLanguageJs) {
      Language = _systemInfoEnumTypeLanguageJs.Language;
    }, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {}, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {}],
    execute: function () {
      languageMap = {
        Chinese: Language.CHINESE,
        cn: Language.CHINESE,
        zh_CN: Language.CHINESE
      };
      _export("minigame", minigame = {});
      cloneObject(minigame, my);
      systemInfo = minigame.getSystemInfoSync();
      systemInfo.language = languageMap[systemInfo.language] || systemInfo.language;
      minigame.isDevTool = my.isIDE;
      Object.defineProperty(minigame, "isLandscape", {
        get() {
          const locSystemInfo = minigame.getSystemInfoSync();
          if (typeof locSystemInfo.deviceOrientation === "string") {
            return locSystemInfo.deviceOrientation.startsWith("landscape");
          } else {
            return locSystemInfo.screenWidth > locSystemInfo.screenHeight;
          }
        }
      });
      landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
      Object.defineProperty(minigame, "orientation", {
        get() {
          return minigame.isLandscape ? landscapeOrientation : Orientation.PORTRAIT;
        }
      });
      detectLandscapeSupport();
      polyfilledCreateInnerAudio = createInnerAudioContextPolyfill(my, {
        onPlay: true,
        onPause: true,
        onStop: false,
        onSeek: false
      }, true);
      minigame.createInnerAudioContext = function () {
        const audio = polyfilledCreateInnerAudio();
        return audio;
      };
      minigame.loadFont = function (url) {
        return "Arial";
      };
      minigame.onAccelerometerChange = function (cb) {
        minigame.offAccelerometerChange();
        _accelerometerCb = res => {
          let x = res.x;
          let y = res.y;
          if (minigame.isLandscape) {
            const orientationFactor = landscapeOrientation === Orientation.LANDSCAPE_RIGHT ? 1 : -1;
            x = -res.y * orientationFactor;
            y = res.x * orientationFactor;
          }
          const resClone = {
            x,
            y,
            z: res.z
          };
          cb(resClone);
        };
      };
      minigame.offAccelerometerChange = function (cb) {
        if (_accelerometerCb) {
          my.offAccelerometerChange(_accelerometerCb);
          _accelerometerCb = undefined;
        }
      };
      minigame.startAccelerometer = function (res) {
        if (_accelerometerCb) {
          my.onAccelerometerChange(_accelerometerCb);
        } else {
          console.error("minigame.onAccelerometerChange() should be invoked before minigame.startAccelerometer() on taobao platform");
        }
      };
      minigame.stopAccelerometer = function (res) {
        minigame.offAccelerometerChange();
      };
      minigame.getSafeArea = function () {
        const systemInfo = minigame.getSystemInfoSync();
        if (typeof systemInfo.safeArea !== "undefined") {
          return systemInfo.safeArea;
        }
        console.warn("getSafeArea is not supported on this platform");
        return {
          top: 0,
          left: 0,
          bottom: systemInfo.windowHeight,
          right: systemInfo.windowWidth,
          width: systemInfo.windowWidth,
          height: systemInfo.windowHeight
        };
      };
      if (!my.isIDE) {
        const locCanvas = $global.screencanvas;
        if (locCanvas) {
          const originalGetContext = locCanvas.getContext.bind(locCanvas);
          locCanvas.getContext = function (name, param) {
            if (typeof name === "string" && typeof param === "object" && name.startsWith("webgl")) {
              Object.assign(param, {
                enable_flip_y_after_read_pixels: false
              });
              const gl = originalGetContext(name, param);
              adapterGL(gl);
              return gl;
            }
            return originalGetContext(name, param);
          };
        }
      }
      hasAdapter = false;
    }
  };
});