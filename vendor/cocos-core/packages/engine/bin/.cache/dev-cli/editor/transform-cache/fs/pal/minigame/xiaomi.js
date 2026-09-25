System.register("q-bundled:///fs/pal/minigame/xiaomi.js", ["../screen-adapter/enum-type/orientation.js", "../utils.js", "../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var Orientation, cloneObject, createInnerAudioContextPolyfill, warn, minigame, systemInfo, landscapeOrientation, _customAccelerometerCb, _innerAccelerometerCb, originalCreateInnerAudioContext;
  return {
    setters: [function (_screenAdapterEnumTypeOrientationJs) {
      Orientation = _screenAdapterEnumTypeOrientationJs.Orientation;
    }, function (_utilsJs) {
      cloneObject = _utilsJs.cloneObject;
      createInnerAudioContextPolyfill = _utilsJs.createInnerAudioContextPolyfill;
    }, function (_cocosCorePlatformDebugJs) {
      warn = _cocosCorePlatformDebugJs.warn;
    }],
    execute: function () {
      _export("minigame", minigame = {});
      cloneObject(minigame, qg);
      systemInfo = minigame.getSystemInfoSync();
      minigame.isDevTool = false;
      minigame.isLandscape = systemInfo.screenWidth > systemInfo.screenHeight;
      landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
      Object.defineProperty(minigame, "orientation", {
        get() {
          return minigame.isLandscape ? landscapeOrientation : Orientation.PORTRAIT;
        }
      });
      minigame.onTouchStart = cb => {
        window.canvas.ontouchstart = cb;
      };
      minigame.onTouchMove = cb => {
        window.canvas.ontouchmove = cb;
      };
      minigame.onTouchEnd = cb => {
        window.canvas.ontouchend = cb;
      };
      minigame.onTouchCancel = cb => {
        window.canvas.ontouchcancel = cb;
      };
      minigame.onAccelerometerChange = cb => {
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
            const standardFactor = -0.1;
            x *= standardFactor;
            y *= standardFactor;
            const resClone = {
              x,
              y,
              z: res.z
            };
            _customAccelerometerCb == null || _customAccelerometerCb(resClone);
          };
          qg.onAccelerometerChange(_innerAccelerometerCb);
        }
        _customAccelerometerCb = cb;
      };
      minigame.offAccelerometerChange = cb => {
        _customAccelerometerCb = undefined;
      };
      minigame.createInnerAudioContext = createInnerAudioContextPolyfill(qg, {
        onPlay: true,
        onPause: true,
        onStop: true,
        onSeek: false
      });
      originalCreateInnerAudioContext = minigame.createInnerAudioContext;
      minigame.createInnerAudioContext = () => {
        const audioContext = originalCreateInnerAudioContext.call(minigame);
        const originalStop = audioContext.stop;
        Object.defineProperty(audioContext, "stop", {
          configurable: true,
          value() {
            audioContext.seek(0);
            originalStop.call(audioContext);
          }
        });
        return audioContext;
      };
      minigame.getSafeArea = () => {
        warn("getSafeArea is not supported on this platform");
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