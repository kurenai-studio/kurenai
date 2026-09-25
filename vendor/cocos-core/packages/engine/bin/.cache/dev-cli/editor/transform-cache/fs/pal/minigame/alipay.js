System.register("q-bundled:///fs/pal/minigame/alipay.js", ["../screen-adapter/enum-type/orientation.js", "../utils.js"], function (_export, _context) {
  "use strict";

  var Orientation, cloneObject, createInnerAudioContextPolyfill, minigame, systemInfo, landscapeOrientation, polyfilledCreateInnerAudio, _accelerometerCb;
  return {
    setters: [function (_screenAdapterEnumTypeOrientationJs) {
      Orientation = _screenAdapterEnumTypeOrientationJs.Orientation;
    }, function (_utilsJs) {
      cloneObject = _utilsJs.cloneObject;
      createInnerAudioContextPolyfill = _utilsJs.createInnerAudioContextPolyfill;
    }],
    execute: function () {
      _export("minigame", minigame = {});
      cloneObject(minigame, my);
      systemInfo = minigame.getSystemInfoSync();
      minigame.isDevTool = window.navigator && /AlipayIDE/.test(window.navigator.userAgent);
      minigame.isLandscape = systemInfo.screenWidth > systemInfo.screenHeight;
      landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
      Object.defineProperty(minigame, "orientation", {
        get() {
          return minigame.isLandscape ? landscapeOrientation : Orientation.PORTRAIT;
        }
      });
      minigame.onTouchStart = function (cb) {
        window.canvas.addEventListener("touchstart", res => {
          cb && cb(res);
        });
      };
      minigame.onTouchMove = function (cb) {
        window.canvas.addEventListener("touchmove", res => {
          cb && cb(res);
        });
      };
      minigame.onTouchEnd = function (cb) {
        window.canvas.addEventListener("touchend", res => {
          cb && cb(res);
        });
      };
      minigame.onTouchCancel = function (cb) {
        window.canvas.addEventListener("touchcancel", res => {
          cb && cb(res);
        });
      };
      polyfilledCreateInnerAudio = createInnerAudioContextPolyfill(my, {
        onPlay: true,
        onPause: true,
        onStop: false,
        onSeek: false
      }, true);
      minigame.createInnerAudioContext = function () {
        const audio = polyfilledCreateInnerAudio();
        if (audio.onCanPlay) {
          audio.onCanplay = audio.onCanPlay.bind(audio);
          delete audio.onCanPlay;
        }
        if (audio.offCanPlay) {
          audio.offCanplay = audio.offCanPlay.bind(audio);
          delete audio.offCanPlay;
        }
        return audio;
      };
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
          my.offAccelerometerChange(_accelerometerCb);
          _accelerometerCb = undefined;
        }
      };
      minigame.startAccelerometer = function (res) {
        if (_accelerometerCb) {
          my.onAccelerometerChange(_accelerometerCb);
        } else {
          console.error("minigame.onAccelerometerChange() should be invoked before minigame.startAccelerometer() on alipay platform");
        }
      };
      minigame.stopAccelerometer = function (res) {
        minigame.offAccelerometerChange();
      };
      minigame.getSafeArea = function () {
        if (typeof minigame.getWindowInfo === "function") {
          const windowInfo = minigame.getWindowInfo();
          return windowInfo.safeArea;
        }
        console.warn("getSafeArea is not supported on this platform");
        const systemInfo = minigame.getSystemInfoSync();
        return {
          top: 0,
          left: 0,
          bottom: systemInfo.windowHeight,
          right: systemInfo.windowWidth,
          width: systemInfo.windowWidth,
          height: systemInfo.windowHeight
        };
      };
    }
  };
});