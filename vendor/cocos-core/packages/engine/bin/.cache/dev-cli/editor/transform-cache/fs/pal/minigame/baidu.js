System.register("q-bundled:///fs/pal/minigame/baidu.js", ["../screen-adapter/enum-type/orientation.js", "../utils.js"], function (_export, _context) {
  "use strict";

  var Orientation, cloneObject, createInnerAudioContextPolyfill, minigame, systemInfo, landscapeOrientation, _customAccelerometerCb, _innerAccelerometerCb;
  return {
    setters: [function (_screenAdapterEnumTypeOrientationJs) {
      Orientation = _screenAdapterEnumTypeOrientationJs.Orientation;
    }, function (_utilsJs) {
      cloneObject = _utilsJs.cloneObject;
      createInnerAudioContextPolyfill = _utilsJs.createInnerAudioContextPolyfill;
    }],
    execute: function () {
      _export("minigame", minigame = {});
      cloneObject(minigame, swan);
      systemInfo = minigame.getSystemInfoSync();
      minigame.isDevTool = systemInfo.platform === "devtools";
      minigame.isLandscape = systemInfo.screenWidth > systemInfo.screenHeight;
      landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
      swan.onDeviceOrientationChange(res => {
        if (res.value === "landscape") {
          landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
        } else if (res.value === "landscapeReverse") {
          landscapeOrientation = Orientation.LANDSCAPE_LEFT;
        }
      });
      Object.defineProperty(minigame, "orientation", {
        get() {
          return minigame.isLandscape ? landscapeOrientation : Orientation.PORTRAIT;
        }
      });
      minigame.onAccelerometerChange = function (cb) {
        if (!_innerAccelerometerCb) {
          _innerAccelerometerCb = res => {
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
          swan.onAccelerometerChange(_innerAccelerometerCb);
          swan.stopAccelerometer({});
        }
        _customAccelerometerCb = cb;
      };
      minigame.offAccelerometerChange = function (cb) {
        _customAccelerometerCb = undefined;
      };
      minigame.createInnerAudioContext = createInnerAudioContextPolyfill(swan, {
        onPlay: true,
        onPause: true,
        onStop: true,
        onSeek: false
      });
      minigame.getSafeArea = function () {
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
      };
    }
  };
});