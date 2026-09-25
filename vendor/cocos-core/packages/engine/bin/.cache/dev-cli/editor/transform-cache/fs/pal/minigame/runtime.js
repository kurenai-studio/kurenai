System.register("q-bundled:///fs/pal/minigame/runtime.js", ["../../../virtual/internal%253Aconstants.js", "../screen-adapter/enum-type/orientation.js", "../utils.js"], function (_export, _context) {
  "use strict";

  var VIVO, Orientation, cloneObject, createInnerAudioContextPolyfill, minigame, systemInfo, landscapeOrientation, _customAccelerometerCb, _innerAccelerometerCb, _needHandleAccelerometerCb;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      VIVO = _virtualInternal253AconstantsJs.VIVO;
    }, function (_screenAdapterEnumTypeOrientationJs) {
      Orientation = _screenAdapterEnumTypeOrientationJs.Orientation;
    }, function (_utilsJs) {
      cloneObject = _utilsJs.cloneObject;
      createInnerAudioContextPolyfill = _utilsJs.createInnerAudioContextPolyfill;
    }],
    execute: function () {
      _export("minigame", minigame = {});
      cloneObject(minigame, ral);
      minigame.ral = ral;
      systemInfo = minigame.getSystemInfoSync();
      minigame.isDevTool = systemInfo.platform === "devtools";
      Object.defineProperty(minigame, "isLandscape", {
        get() {
          if (VIVO) {
            return systemInfo.screenWidth > systemInfo.screenHeight;
          } else {
            const locSysInfo = minigame.getSystemInfoSync();
            return locSysInfo.screenWidth > locSysInfo.screenHeight;
          }
        }
      });
      landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
      Object.defineProperty(minigame, "orientation", {
        get() {
          return minigame.isLandscape ? landscapeOrientation : Orientation.PORTRAIT;
        }
      });
      _needHandleAccelerometerCb = false;
      minigame.onAccelerometerChange = function (cb) {
        if (!_innerAccelerometerCb) {
          _innerAccelerometerCb = res => {
            if (!_needHandleAccelerometerCb) {
              return;
            }
            let x = res.x;
            let y = res.y;
            if (minigame.isLandscape) {
              const orientationFactor = landscapeOrientation === Orientation.LANDSCAPE_RIGHT ? 1 : -1;
              const tmp = x;
              x = -y * orientationFactor;
              y = tmp * orientationFactor;
            }
            const resClone = {
              x,
              y,
              z: res.z
            };
            _customAccelerometerCb == null || _customAccelerometerCb(resClone);
          };
          ral.onAccelerometerChange(_innerAccelerometerCb);
        }
        _needHandleAccelerometerCb = true;
        _customAccelerometerCb = cb;
      };
      minigame.offAccelerometerChange = function (cb) {
        _needHandleAccelerometerCb = false;
        _customAccelerometerCb = undefined;
      };
      minigame.createInnerAudioContext = createInnerAudioContextPolyfill(ral, {
        onPlay: true,
        onPause: true,
        onStop: true,
        onSeek: true
      });
      minigame.getSafeArea = function () {
        const locSystemInfo = ral.getSystemInfoSync();
        if (locSystemInfo.safeArea) {
          return locSystemInfo.safeArea;
        } else {
          console.warn("getSafeArea is not supported on this platform");
          const systemInfo = minigame.getSystemInfoSync();
          return {
            top: 0,
            left: 0,
            bottom: systemInfo.screenHeight,
            right: systemInfo.screenWidth,
            width: systemInfo.screenWidth,
            height: systemInfo.screenHeight
          };
        }
      };
    }
  };
});