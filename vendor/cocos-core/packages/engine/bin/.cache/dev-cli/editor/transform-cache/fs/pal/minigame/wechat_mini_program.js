System.register("q-bundled:///fs/pal/minigame/wechat_mini_program.js", ["../screen-adapter/enum-type/orientation.js", "../utils.js"], function (_export, _context) {
  "use strict";

  var Orientation, cloneObject, createInnerAudioContextPolyfill, versionCompare, _wx$onKeyDown, _wx$onKeyUp, _wx$onMouseDown, _wx$onMouseMove, _wx$onMouseUp, _wx$onWheel, minigame, systemInfo, landscapeOrientation, _accelerometerCb, gl, oldTexSubImage2D;
  return {
    setters: [function (_screenAdapterEnumTypeOrientationJs) {
      Orientation = _screenAdapterEnumTypeOrientationJs.Orientation;
    }, function (_utilsJs) {
      cloneObject = _utilsJs.cloneObject;
      createInnerAudioContextPolyfill = _utilsJs.createInnerAudioContextPolyfill;
      versionCompare = _utilsJs.versionCompare;
    }],
    execute: function () {
      _export("minigame", minigame = {});
      cloneObject(minigame, wx);
      minigame.wx = {};
      minigame.wx.onKeyDown = (_wx$onKeyDown = wx.onKeyDown) == null ? void 0 : _wx$onKeyDown.bind(wx);
      minigame.wx.onKeyUp = (_wx$onKeyUp = wx.onKeyUp) == null ? void 0 : _wx$onKeyUp.bind(wx);
      minigame.wx.onMouseDown = (_wx$onMouseDown = wx.onMouseDown) == null ? void 0 : _wx$onMouseDown.bind(wx);
      minigame.wx.onMouseMove = (_wx$onMouseMove = wx.onMouseMove) == null ? void 0 : _wx$onMouseMove.bind(wx);
      minigame.wx.onMouseUp = (_wx$onMouseUp = wx.onMouseUp) == null ? void 0 : _wx$onMouseUp.bind(wx);
      minigame.wx.onWheel = (_wx$onWheel = wx.onWheel) == null ? void 0 : _wx$onWheel.bind(wx);
      systemInfo = minigame.getSystemInfoSync();
      minigame.isDevTool = systemInfo.platform === "devtools";
      Object.defineProperty(minigame, "isLandscape", {
        get() {
          const locSystemInfo = wx.getSystemInfoSync();
          if (typeof locSystemInfo.deviceOrientation === "string") {
            return locSystemInfo.deviceOrientation.startsWith("landscape");
          } else {
            return locSystemInfo.screenWidth > locSystemInfo.screenHeight;
          }
        }
      });
      landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
      if (systemInfo.platform.toLocaleLowerCase() !== "android") {
        wx.onDeviceOrientationChange(res => {
          if (res.value === "landscape") {
            landscapeOrientation = Orientation.LANDSCAPE_RIGHT;
          } else if (res.value === "landscapeReverse") {
            landscapeOrientation = Orientation.LANDSCAPE_LEFT;
          }
        });
      }
      Object.defineProperty(minigame, "orientation", {
        get() {
          return minigame.isLandscape ? landscapeOrientation : Orientation.PORTRAIT;
        }
      });
      minigame.onAccelerometerChange = cb => {
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
      minigame.offAccelerometerChange = cb => {
        if (_accelerometerCb) {
          wx.offAccelerometerChange(_accelerometerCb);
          _accelerometerCb = undefined;
        }
      };
      minigame.startAccelerometer = res => {
        if (_accelerometerCb) {
          wx.onAccelerometerChange(_accelerometerCb);
        }
        wx.startAccelerometer(res);
      };
      minigame.createInnerAudioContext = createInnerAudioContextPolyfill(wx, {
        onPlay: true,
        onPause: true,
        onStop: true,
        onSeek: false
      }, true);
      minigame.getSafeArea = () => {
        const locSystemInfo = wx.getSystemInfoSync();
        let safeArea = locSystemInfo.safeArea;
        if (!safeArea) {
          safeArea = {
            left: 0,
            top: 0,
            bottom: systemInfo.screenHeight,
            right: systemInfo.screenWidth,
            width: systemInfo.screenWidth,
            height: systemInfo.screenHeight
          };
        }
        return safeArea;
      };
      if (systemInfo.platform === "windows" && versionCompare(systemInfo.SDKVersion, "2.16.0") < 0) {
        const locCanvas = canvas;
        if (locCanvas) {
          const webglRC = locCanvas.getContext("webgl");
          const originalUseProgram = webglRC.useProgram.bind(webglRC);
          webglRC.useProgram = program => {
            if (program) {
              originalUseProgram(program);
            }
          };
        }
      }
      gl = getApp().GameGlobal.canvas.getContext("webgl");
      oldTexSubImage2D = gl.texSubImage2D;
      gl.texSubImage2D = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        if (args.length === 7) {
          const canvas = args[6];
          if (typeof canvas.type !== "undefined" && canvas.type === "canvas") {
            const ctx = canvas.getContext("2d");
            const texOffsetX = args[2];
            const texOffsetY = args[3];
            const imgData = ctx.getImageData(texOffsetX, texOffsetY, canvas.width, canvas.height);
            oldTexSubImage2D.call(gl, args[0], args[1], texOffsetX, texOffsetY, canvas.width, canvas.height, args[4], args[5], new Uint8Array(imgData.data));
          } else {
            oldTexSubImage2D.apply(gl, args);
          }
        } else {
          oldTexSubImage2D.apply(gl, args);
        }
      };
    }
  };
});