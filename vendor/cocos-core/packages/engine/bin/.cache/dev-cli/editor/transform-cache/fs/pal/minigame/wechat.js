System.register("q-bundled:///fs/pal/minigame/wechat.js", ["../screen-adapter/enum-type/orientation.js", "../utils.js"], function (_export, _context) {
  "use strict";

  var Orientation, cloneObject, createInnerAudioContextPolyfill, versionCompare, _wx$onKeyDown, _wx$onKeyUp, _wx$onMouseDown, _wx$onMouseMove, _wx$onMouseUp, _wx$onWheel, minigame, devideInfo, landscapeOrientation, _accelerometerCb, appBaseInfo;
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
      if (minigame.getSystemSetting === undefined) {
        minigame.getSystemSetting = function () {
          const systemInfo = minigame.getSystemInfoSync();
          return {
            bluetoothEnabled: systemInfo.bluetoothEnabled,
            locationEnabled: systemInfo.locationEnabled,
            wifiEnabled: systemInfo.wifiEnabled,
            deviceOrientation: systemInfo.deviceOrientation
          };
        };
      }
      if (minigame.getAppAuthorizeSetting === undefined) {
        minigame.getAppAuthorizeSetting = function () {
          const systemInfo = minigame.getSystemInfoSync();
          return {
            albumAuthorized: systemInfo.albumAuthorized === undefined ? undefined : systemInfo.albumAuthorized ? "authorized" : "denied",
            bluetoothAuthorized: systemInfo.bluetoothAuthorized === undefined ? undefined : systemInfo.bluetoothAuthorized ? "authorized" : "denied",
            cameraAuthorized: systemInfo.cameraAuthorized === undefined ? undefined : systemInfo.cameraAuthorized ? "authorized" : "denied",
            locationAuthorized: systemInfo.locationAuthorized === undefined ? undefined : systemInfo.locationAuthorized ? "authorized" : "denied",
            locationReducedAccuracy: systemInfo.locationReducedAccuracy === undefined ? undefined : systemInfo.locationReducedAccuracy,
            microphoneAuthorized: systemInfo.microphoneAuthorized === undefined ? undefined : systemInfo.microphoneAuthorized ? "authorized" : "denied",
            notificationAuthorized: systemInfo.notificationAuthorized === undefined ? undefined : systemInfo.notificationAuthorized ? "authorized" : "denied",
            notificationAlertAuthorized: systemInfo.notificationAlertAuthorized === undefined ? undefined : systemInfo.notificationAlertAuthorized ? "authorized" : "denied",
            notificationBadgeAuthorized: systemInfo.notificationBadgeAuthorized === undefined ? undefined : systemInfo.notificationBadgeAuthorized ? "authorized" : "denied",
            notificationSoundAuthorized: systemInfo.notificationSoundAuthorized === undefined ? undefined : systemInfo.notificationSoundAuthorized ? "authorized" : "denied",
            phoneCalendarAuthorized: systemInfo.phoneCalendarAuthorized === undefined ? undefined : systemInfo.phoneCalendarAuthorized ? "authorized" : "denied"
          };
        };
      }
      if (minigame.getDeviceInfo === undefined) {
        minigame.getDeviceInfo = function () {
          const systemInfo = minigame.getSystemInfoSync();
          return {
            abi: systemInfo.abi,
            deviceAbi: systemInfo.deviceAbi,
            benchmarkLevel: systemInfo.benchmarkLevel,
            brand: systemInfo.brand,
            model: systemInfo.model,
            system: systemInfo.system,
            platform: systemInfo.platform,
            cpuType: systemInfo.cpuType,
            memorySize: systemInfo.memorySize
          };
        };
      }
      if (minigame.getWindowInfo === undefined) {
        minigame.getWindowInfo = function () {
          const systemInfo = minigame.getSystemInfoSync();
          return {
            pixelRatio: systemInfo.pixelRatio,
            screenWidth: systemInfo.screenWidth,
            screenHeight: systemInfo.screenHeight,
            windowWidth: systemInfo.windowWidth,
            windowHeight: systemInfo.windowHeight,
            statusBarHeight: systemInfo.statusBarHeight,
            safeArea: systemInfo.safeArea,
            screenTop: systemInfo.screenTop
          };
        };
      }
      if (minigame.getAppBaseInfo === undefined) {
        minigame.getAppBaseInfo = function () {
          const systemInfo = minigame.getSystemInfoSync();
          return {
            SDKVersion: systemInfo.SDKVersion,
            enableDebug: systemInfo.enableDebug,
            host: systemInfo.host,
            language: systemInfo.language,
            version: systemInfo.version,
            theme: systemInfo.theme,
            mode: systemInfo.mode,
            fontSizeScaleFactor: systemInfo.fontSizeScaleFactor,
            fontSizeSetting: systemInfo.fontSizeSetting
          };
        };
      }
      devideInfo = minigame.getDeviceInfo();
      minigame.isDevTool = devideInfo.platform === "devtools";
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
      if (devideInfo.platform.toLocaleLowerCase() !== "android") {
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
          wx.offAccelerometerChange(_accelerometerCb);
          _accelerometerCb = undefined;
        }
      };
      minigame.startAccelerometer = function (res) {
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
      minigame.getSafeArea = function () {
        const windowInfo = minigame.getWindowInfo();
        let safeArea = windowInfo.safeArea;
        if (!safeArea) {
          safeArea = {
            left: 0,
            top: 0,
            bottom: windowInfo.screenHeight,
            right: windowInfo.screenWidth,
            width: windowInfo.screenWidth,
            height: windowInfo.screenHeight
          };
        }
        return safeArea;
      };
      appBaseInfo = minigame.getAppBaseInfo();
      if (devideInfo.platform === "windows" && versionCompare(appBaseInfo.SDKVersion, "2.16.0") < 0) {
        const locCanvas = canvas;
        if (locCanvas) {
          const webglRC = locCanvas.getContext("webgl");
          const originalUseProgram = webglRC.useProgram.bind(webglRC);
          webglRC.useProgram = function (program) {
            if (program) {
              originalUseProgram(program);
            }
          };
        }
      }
    }
  };
});