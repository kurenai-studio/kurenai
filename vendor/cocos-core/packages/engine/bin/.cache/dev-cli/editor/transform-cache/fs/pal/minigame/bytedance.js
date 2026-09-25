System.register("q-bundled:///fs/pal/minigame/bytedance.js", ["../screen-adapter/enum-type/orientation.js", "../utils.js"], function (_export, _context) {
  "use strict";

  var Orientation, cloneObject, createInnerAudioContextPolyfill, _tt$getAudioContext, minigame, systemInfo, landscapeOrientation, _accelerometerCb;
  return {
    setters: [function (_screenAdapterEnumTypeOrientationJs) {
      Orientation = _screenAdapterEnumTypeOrientationJs.Orientation;
    }, function (_utilsJs) {
      cloneObject = _utilsJs.cloneObject;
      createInnerAudioContextPolyfill = _utilsJs.createInnerAudioContextPolyfill;
    }],
    execute: function () {
      _export("minigame", minigame = {});
      cloneObject(minigame, tt);
      minigame.tt = {};
      minigame.tt.getAudioContext = (_tt$getAudioContext = tt.getAudioContext) == null ? void 0 : _tt$getAudioContext.bind(tt);
      systemInfo = minigame.getSystemInfoSync();
      minigame.isDevTool = systemInfo.platform === "devtools";
      minigame.isLandscape = systemInfo.screenWidth > systemInfo.screenHeight;
      landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
      tt.onDeviceOrientationChange(res => {
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
        minigame.offAccelerometerChange();
        _accelerometerCb = res => {
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
          cb(resClone);
        };
      };
      minigame.offAccelerometerChange = function (cb) {
        if (_accelerometerCb) {
          tt.offAccelerometerChange(_accelerometerCb);
          _accelerometerCb = undefined;
        }
      };
      minigame.startAccelerometer = function (res) {
        if (_accelerometerCb) {
          tt.onAccelerometerChange(_accelerometerCb);
        }
        tt.startAccelerometer(res);
      };
      minigame.createInnerAudioContext = createInnerAudioContextPolyfill(tt, {
        onPlay: true,
        onPause: true,
        onStop: true,
        onSeek: true
      });
      minigame.getSafeArea = function () {
        const locSystemInfo = tt.getSystemInfoSync();
        let {
          top,
          left,
          right
        } = locSystemInfo.safeArea;
        const {
          bottom,
          width,
          height
        } = locSystemInfo.safeArea;
        if (locSystemInfo.platform === "ios" && !minigame.isDevTool && minigame.isLandscape) {
          const tmpTop = top;
          const tmpLeft = left;
          const tmpRight = right;
          top = tmpLeft;
          left = tmpTop;
          right = tmpRight - tmpTop;
        }
        return {
          top,
          left,
          bottom,
          right,
          width,
          height
        };
      };
    }
  };
});