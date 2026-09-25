System.register("q-bundled:///fs/pal/input/web/gamepad-input.js", ["pal/system-info", "../../../../virtual/internal%253Aconstants.js", "../../../cocos/core/event/event-target.js", "../../../predefine.js", "../../system-info/enum-type/browser-type.js", "../../system-info/enum-type/language.js", "../../system-info/enum-type/network-type.js", "../../system-info/enum-type/operating-system.js", "../../system-info/enum-type/platform.js", "../../system-info/enum-type/feature.js", "../input-source.js", "../../../cocos/core/index.js", "../../../cocos/input/types/index.js"], function (_export, _context) {
  "use strict";

  var systemInfo, USE_XR, EventTarget, legacyCC, Feature, InputSourceButton, InputSourceDpad, InputSourceStick, InputSourcePosition, InputSourceOrientation, Quat, Vec3, js, EventGamepad, GamepadInputDevice, BUTTON_SOUTH, BUTTON_EAST, BUTTON_WEST, BUTTON_NORTH, BUTTON_L1, BUTTON_R1, BUTTON_L2, BUTTON_R2, BUTTON_SHARE, BUTTON_OPTIONS, BUTTON_L3, BUTTON_R3, BUTTON_DPAD_UP, BUTTON_DPAD_DOWN, BUTTON_DPAD_LEFT, BUTTON_DPAD_RIGHT, AXIS_LEFT_STICK_X, AXIS_LEFT_STICK_Y, AXIS_RIGHT_STICK_X, AXIS_RIGHT_STICK_Y, XR_TRIGGER, XR_GRIP, XR_TOUCHPAD, XR_STICK, XR_BUTTON_1, XR_BUTTON_2, XR_AXIS_TOUCHPAD_X, XR_AXIS_TOUCHPAD_Y, XR_AXIS_STICK_X, XR_AXIS_STICK_Y, EPSILON, XRLeftHandedness, XRRightHandedness, devicesTmp, Pose;
  return {
    setters: [function (_palSystemInfo) {
      systemInfo = _palSystemInfo.systemInfo;
    }, function (_virtualInternal253AconstantsJs) {
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }, function (_predefineJs) {
      legacyCC = _predefineJs.default;
    }, function (_systemInfoEnumTypeBrowserTypeJs) {}, function (_systemInfoEnumTypeLanguageJs) {}, function (_systemInfoEnumTypeNetworkTypeJs) {}, function (_systemInfoEnumTypeOperatingSystemJs) {}, function (_systemInfoEnumTypePlatformJs) {}, function (_systemInfoEnumTypeFeatureJs) {
      Feature = _systemInfoEnumTypeFeatureJs.Feature;
    }, function (_inputSourceJs) {
      InputSourceButton = _inputSourceJs.InputSourceButton;
      InputSourceDpad = _inputSourceJs.InputSourceDpad;
      InputSourceStick = _inputSourceJs.InputSourceStick;
      InputSourcePosition = _inputSourceJs.InputSourcePosition;
      InputSourceOrientation = _inputSourceJs.InputSourceOrientation;
    }, function (_cocosCoreIndexJs) {
      Quat = _cocosCoreIndexJs.Quat;
      Vec3 = _cocosCoreIndexJs.Vec3;
      js = _cocosCoreIndexJs.js;
    }, function (_cocosInputTypesIndexJs) {
      EventGamepad = _cocosInputTypesIndexJs.EventGamepad;
    }],
    execute: function () {
      BUTTON_SOUTH = 0;
      BUTTON_EAST = 1;
      BUTTON_WEST = 2;
      BUTTON_NORTH = 3;
      BUTTON_L1 = 4;
      BUTTON_R1 = 5;
      BUTTON_L2 = 6;
      BUTTON_R2 = 7;
      BUTTON_SHARE = 8;
      BUTTON_OPTIONS = 9;
      BUTTON_L3 = 10;
      BUTTON_R3 = 11;
      BUTTON_DPAD_UP = 12;
      BUTTON_DPAD_DOWN = 13;
      BUTTON_DPAD_LEFT = 14;
      BUTTON_DPAD_RIGHT = 15;
      AXIS_LEFT_STICK_X = 0;
      AXIS_LEFT_STICK_Y = 1;
      AXIS_RIGHT_STICK_X = 2;
      AXIS_RIGHT_STICK_Y = 3;
      XR_TRIGGER = 0;
      XR_GRIP = 1;
      XR_TOUCHPAD = 2;
      XR_STICK = 3;
      XR_BUTTON_1 = 4;
      XR_BUTTON_2 = 5;
      XR_AXIS_TOUCHPAD_X = 0;
      XR_AXIS_TOUCHPAD_Y = 1;
      XR_AXIS_STICK_X = 2;
      XR_AXIS_STICK_Y = 3;
      EPSILON = 0.01;
      XRLeftHandedness = "left";
      XRRightHandedness = "right";
      devicesTmp = [];
      (function (Pose) {
        Pose[Pose["HAND_LEFT"] = 1] = "HAND_LEFT";
        Pose[Pose["HAND_RIGHT"] = 4] = "HAND_RIGHT";
        Pose[Pose["AIM_LEFT"] = 2] = "AIM_LEFT";
        Pose[Pose["AIM_RIGHT"] = 5] = "AIM_RIGHT";
      })(Pose || (Pose = {}));
      _export("GamepadInputDevice", GamepadInputDevice = class GamepadInputDevice {
        get buttonNorth() {
          return this._ccprivate$_buttonNorth;
        }
        get buttonEast() {
          return this._ccprivate$_buttonEast;
        }
        get buttonWest() {
          return this._ccprivate$_buttonWest;
        }
        get buttonSouth() {
          return this._ccprivate$_buttonSouth;
        }
        get buttonL1() {
          return this._ccprivate$_buttonL1;
        }
        get buttonL2() {
          return this._ccprivate$_buttonL2;
        }
        get buttonL3() {
          return this._ccprivate$_buttonL3;
        }
        get buttonR1() {
          return this._ccprivate$_buttonR1;
        }
        get buttonR2() {
          return this._ccprivate$_buttonR2;
        }
        get buttonR3() {
          return this._ccprivate$_buttonR3;
        }
        get buttonShare() {
          return this._ccprivate$_buttonShare;
        }
        get buttonOptions() {
          return this._ccprivate$_buttonOptions;
        }
        get dpad() {
          return this._ccprivate$_dpad;
        }
        get leftStick() {
          return this._ccprivate$_leftStick;
        }
        get rightStick() {
          return this._ccprivate$_rightStick;
        }
        get buttonStart() {
          return this._ccprivate$_buttonStart;
        }
        get gripLeft() {
          return this._ccprivate$_gripLeft;
        }
        get gripRight() {
          return this._ccprivate$_gripRight;
        }
        get handLeftPosition() {
          return this._ccprivate$_handLeftPosition;
        }
        get handLeftOrientation() {
          return this._ccprivate$_handLeftOrientation;
        }
        get handRightPosition() {
          return this._ccprivate$_handRightPosition;
        }
        get handRightOrientation() {
          return this._ccprivate$_handRightOrientation;
        }
        get aimLeftPosition() {
          return this._ccprivate$_aimLeftPosition;
        }
        get aimLeftOrientation() {
          return this._ccprivate$_aimLeftOrientation;
        }
        get aimRightPosition() {
          return this._ccprivate$_aimRightPosition;
        }
        get aimRightOrientation() {
          return this._ccprivate$_aimRightOrientation;
        }
        get deviceId() {
          return this._ccprivate$_deviceId;
        }
        get connected() {
          return this._ccprivate$_connected;
        }
        constructor(deviceId) {
          this._ccprivate$_deviceId = -1;
          this._ccprivate$_connected = false;
          this._ccprivate$_webPoseState = {
            [Pose.HAND_LEFT]: {
              position: Vec3.ZERO,
              orientation: Quat.IDENTITY
            },
            [Pose.HAND_RIGHT]: {
              position: Vec3.ZERO,
              orientation: Quat.IDENTITY
            },
            [Pose.AIM_LEFT]: {
              position: Vec3.ZERO,
              orientation: Quat.IDENTITY
            },
            [Pose.AIM_RIGHT]: {
              position: Vec3.ZERO,
              orientation: Quat.IDENTITY
            }
          };
          this._ccprivate$_deviceId = deviceId;
          this._ccprivate$_initInputSource();
        }
        static _init() {
          if (!systemInfo.hasFeature(Feature.EVENT_GAMEPAD)) {
            return;
          }
          GamepadInputDevice._ccprivate$_registerEvent();
        }
        static _on(eventType, cb, target) {
          GamepadInputDevice._ccprivate$_eventTarget.on(eventType, cb, target);
        }
        static _ccprivate$_removeInputDevice(id) {
          const removeIndex = GamepadInputDevice.all.findIndex(device => device.deviceId === id);
          if (removeIndex === -1) {
            return;
          }
          js.array.fastRemoveAt(GamepadInputDevice.all, removeIndex);
        }
        static _ccprivate$_getOrCreateInputDevice(id, connected) {
          let device = GamepadInputDevice.all.find(device => device.deviceId === id);
          if (!device) {
            device = new GamepadInputDevice(id);
            GamepadInputDevice.all.push(device);
          }
          device._ccprivate$_connected = connected;
          return device;
        }
        static _ccprivate$_ensureDirectorDefined(callback) {
          GamepadInputDevice._ccprivate$_intervalId = setInterval(() => {
            if (legacyCC.director && legacyCC.Director) {
              clearInterval(GamepadInputDevice._ccprivate$_intervalId);
              GamepadInputDevice._ccprivate$_intervalId = -1;
              callback();
            }
          }, 50);
        }
        static _ccprivate$_updateGamepadCnt() {
          let cnt = 0;
          for (let i = 0, l = GamepadInputDevice._ccprivate$_cachedWebGamepads.length; i < l; i++) {
            if (GamepadInputDevice._ccprivate$_cachedWebGamepads[i]) cnt++;
          }
          GamepadInputDevice._ccprivate$_totalGamepadCnt = cnt;
        }
        static _ccprivate$_registerEvent() {
          GamepadInputDevice._ccprivate$_ensureDirectorDefined(() => {
            GamepadInputDevice._ccprivate$_cachedWebGamepads = GamepadInputDevice._ccprivate$_getWebGamePads();
            GamepadInputDevice._ccprivate$_updateGamepadCnt();
            legacyCC.director.on(legacyCC.Director.EVENT_BEGIN_FRAME, GamepadInputDevice._ccprivate$_scanGamepads);
          });
          window.addEventListener("gamepadconnected", e => {
            GamepadInputDevice._ccprivate$_cachedWebGamepads[e.gamepad.index] = e.gamepad;
            GamepadInputDevice._ccprivate$_updateGamepadCnt();
            const device = GamepadInputDevice._ccprivate$_getOrCreateInputDevice(e.gamepad.index, true);
            GamepadInputDevice._ccprivate$_eventTarget.emit("gamepad-change", new EventGamepad("gamepad-change", device));
          });
          window.addEventListener("gamepaddisconnected", e => {
            GamepadInputDevice._ccprivate$_cachedWebGamepads[e.gamepad.index] = null;
            GamepadInputDevice._ccprivate$_updateGamepadCnt();
            const device = GamepadInputDevice._ccprivate$_getOrCreateInputDevice(e.gamepad.index, false);
            GamepadInputDevice._ccprivate$_removeInputDevice(e.gamepad.index);
            GamepadInputDevice._ccprivate$_eventTarget.emit("gamepad-change", new EventGamepad("gamepad-change", device));
          });
        }
        static _ccprivate$_scanWebGamepads(devices) {
          const allDisconnected = GamepadInputDevice._ccprivate$_totalGamepadCnt === 0;
          if (allDisconnected) return;
          const webGamepads = GamepadInputDevice._ccprivate$_getWebGamePads();
          if (!webGamepads) {
            return;
          }
          for (let i = 0; i < webGamepads.length; ++i) {
            const webGamepad = webGamepads[i];
            if (!webGamepad) {
              continue;
            }
            const cachedWebGamepad = GamepadInputDevice._ccprivate$_cachedWebGamepads[webGamepad.index];
            if (cachedWebGamepad) {
              let device;
              const cachedButtons = cachedWebGamepad.buttons;
              for (let j = 0; j < cachedButtons.length; ++j) {
                const cachedButton = cachedButtons[j];
                const button = webGamepad.buttons[j];
                if (Math.abs(cachedButton.value - button.value) > EPSILON) {
                  device = GamepadInputDevice._ccprivate$_getOrCreateInputDevice(webGamepad.index, true);
                  break;
                }
              }
              if (device) {
                devices.push(device);
                continue;
              }
              const cachedAxes = cachedWebGamepad.axes;
              for (let j = 0; j < cachedAxes.length; ++j) {
                const cachedAxisValue = cachedAxes[j];
                const axisValue = webGamepad.axes[j];
                if (Math.abs(cachedAxisValue - axisValue) > EPSILON) {
                  device = GamepadInputDevice._ccprivate$_getOrCreateInputDevice(webGamepad.index, true);
                  break;
                }
              }
              if (device) {
                devices.push(device);
                continue;
              }
            }
          }
          GamepadInputDevice._ccprivate$_cachedWebGamepads = webGamepads;
        }
        static _ccprivate$_scanGamepads() {
          devicesTmp.length = 0;
          GamepadInputDevice._ccprivate$_scanWebGamepads(devicesTmp);
          GamepadInputDevice._ccprivate$_scanWebXRGamepads(devicesTmp);
          for (let i = 0; i < devicesTmp.length; ++i) {
            const device = devicesTmp[i];
            GamepadInputDevice._ccprivate$_eventTarget.emit("gamepad-input", new EventGamepad("gamepad-input", device));
          }
          GamepadInputDevice._ccprivate$_scanWebXRGamepadsPose();
        }
        static _ccprivate$_scanWebXRGamepads(devices) {
          var _GamepadInputDevice$_, _GamepadInputDevice$_2;
          if (!USE_XR) return;
          const webxrGamepadMap = GamepadInputDevice._ccprivate$_getWebXRGamepadMap();
          if (!webxrGamepadMap) {
            GamepadInputDevice._ccprivate$_cachedWebXRGamepadMap = null;
            if (GamepadInputDevice.xr && GamepadInputDevice.xr._ccprivate$_connected) {
              GamepadInputDevice.xr._ccprivate$_connected = false;
              GamepadInputDevice._ccprivate$_eventTarget.emit("gamepad-change", new EventGamepad("gamepad-change", GamepadInputDevice.xr));
              devices.push(GamepadInputDevice.xr);
            }
            return;
          }
          if (!GamepadInputDevice.xr) {
            GamepadInputDevice.xr = new GamepadInputDevice(-1);
          }
          const left = webxrGamepadMap.get(XRLeftHandedness);
          const right = webxrGamepadMap.get(XRRightHandedness);
          if (!left && !right) {
            if (GamepadInputDevice.xr._ccprivate$_connected) {
              GamepadInputDevice.xr._ccprivate$_connected = false;
              GamepadInputDevice._ccprivate$_eventTarget.emit("gamepad-change", new EventGamepad("gamepad-change", GamepadInputDevice.xr));
            }
          } else if (!GamepadInputDevice.xr._ccprivate$_connected) {
            GamepadInputDevice.xr._ccprivate$_connected = true;
            GamepadInputDevice._ccprivate$_eventTarget.emit("gamepad-change", new EventGamepad("gamepad-change", GamepadInputDevice.xr));
          }
          if (GamepadInputDevice._ccprivate$checkGamepadChanged(left, (_GamepadInputDevice$_ = GamepadInputDevice._ccprivate$_cachedWebXRGamepadMap) == null ? void 0 : _GamepadInputDevice$_.get(XRLeftHandedness))) {
            devices.push(GamepadInputDevice.xr);
          } else if (GamepadInputDevice._ccprivate$checkGamepadChanged(right, (_GamepadInputDevice$_2 = GamepadInputDevice._ccprivate$_cachedWebXRGamepadMap) == null ? void 0 : _GamepadInputDevice$_2.get(XRRightHandedness))) {
            devices.push(GamepadInputDevice.xr);
          }
          if (!GamepadInputDevice._ccprivate$_cachedWebXRGamepadMap) {
            GamepadInputDevice._ccprivate$_cachedWebXRGamepadMap = new Map();
          }
          GamepadInputDevice._ccprivate$_cachedWebXRGamepadMap.set(XRLeftHandedness, GamepadInputDevice._ccprivate$_copyCacheGamepadValue(left));
          GamepadInputDevice._ccprivate$_cachedWebXRGamepadMap.set(XRRightHandedness, GamepadInputDevice._ccprivate$_copyCacheGamepadValue(right));
        }
        static _ccprivate$checkGamepadChanged(currGamepad, cachedGamepad) {
          if (!currGamepad && !cachedGamepad) {
            return false;
          } else if (!currGamepad || !cachedGamepad) {
            return true;
          }
          const cachedButtons = cachedGamepad.buttons;
          for (let j = 0; j < cachedButtons.length; ++j) {
            const cachedButton = cachedButtons[j];
            const button = currGamepad.buttons[j];
            if (button.value !== 0 || cachedButton !== 0) {
              return true;
            }
          }
          const cachedAxes = cachedGamepad.axes;
          for (let j = 0; j < cachedAxes.length; ++j) {
            const cachedAxisValue = cachedAxes[j];
            const axisValue = currGamepad.axes[j];
            if (axisValue !== 0 || cachedAxisValue !== 0) {
              return true;
            }
          }
          return false;
        }
        static _ccprivate$_copyCacheGamepadValue(gamepad) {
          if (!gamepad) {
            return undefined;
          }
          const cacheGamepad = {
            buttons: new Array(gamepad.buttons.length),
            axes: new Array(gamepad.axes.length)
          };
          for (let j = 0; j < gamepad.buttons.length; ++j) {
            cacheGamepad.buttons[j] = gamepad.buttons[j].value;
          }
          for (let j = 0; j < gamepad.axes.length; ++j) {
            cacheGamepad.axes[j] = gamepad.axes[j];
          }
          return cacheGamepad;
        }
        static _ccprivate$_scanWebXRGamepadsPose() {
          var _globalThis$__globalX;
          if (!USE_XR) return;
          const infoList = (_globalThis$__globalX = globalThis.__globalXR) == null ? void 0 : _globalThis$__globalX.webxrHandlePoseInfos;
          if (!infoList || !GamepadInputDevice.xr) {
            return;
          }
          for (let i = 0; i < infoList.length; ++i) {
            const info = infoList[i];
            GamepadInputDevice.xr._ccprivate$_updateWebPoseState(info);
          }
          GamepadInputDevice._ccprivate$_eventTarget.emit("handle-pose-input", new EventGamepad("handle-pose-input", GamepadInputDevice.xr));
        }
        static _ccprivate$_getWebXRGamepadMap() {
          var _globalThis$__globalX2;
          return (_globalThis$__globalX2 = globalThis.__globalXR) == null ? void 0 : _globalThis$__globalX2.webxrGamepadMap;
        }
        static _ccprivate$_getWebGamePads() {
          if (typeof navigator.getGamepads === "function") {
            return navigator.getGamepads();
          } else if (typeof navigator.webkitGetGamepads === "function") {
            return navigator.webkitGetGamepads();
          }
          return [];
        }
        static _ccprivate$_getWebGamepad(deviceId) {
          const webGamepads = GamepadInputDevice._ccprivate$_getWebGamePads();
          for (let i = 0; i < webGamepads.length; ++i) {
            const webGamepad = webGamepads[i];
            if (webGamepad && webGamepad.index === deviceId) {
              return webGamepad;
            }
          }
          return undefined;
        }
        _ccprivate$_axisToButtons(axisValue) {
          const value = Math.abs(axisValue);
          if (axisValue > 0) {
            return {
              negative: 0,
              positive: value
            };
          } else if (axisValue < 0) {
            return {
              negative: value,
              positive: 0
            };
          } else {
            return {
              negative: 0,
              positive: 0
            };
          }
        }
        _ccprivate$_updateWebPoseState(info) {
          if (info.code !== Pose.HAND_LEFT && info.code !== Pose.AIM_LEFT && info.code !== Pose.HAND_RIGHT && info.code !== Pose.AIM_RIGHT) {
            return;
          }
          this._ccprivate$_webPoseState[info.code] = {
            position: new Vec3(info.position.x, info.position.y, info.position.z),
            orientation: new Quat(info.orientation.x, info.orientation.y, info.orientation.z, info.orientation.w)
          };
        }
        _ccprivate$_initInputSource() {
          this._ccprivate$_buttonNorth = new InputSourceButton();
          this._ccprivate$_buttonNorth.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_3;
              const webxrGamepad = (_GamepadInputDevice$_3 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_3.get(XRLeftHandedness);
              if (webxrGamepad && webxrGamepad.buttons.length > XR_BUTTON_2) {
                return webxrGamepad.buttons[XR_BUTTON_2].value;
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_NORTH].value;
            }
            return 0;
          };
          this._ccprivate$_buttonEast = new InputSourceButton();
          this._ccprivate$_buttonEast.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_4;
              const webxrGamepad = (_GamepadInputDevice$_4 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_4.get(XRRightHandedness);
              if (webxrGamepad && webxrGamepad.buttons.length > XR_BUTTON_2) {
                return webxrGamepad.buttons[XR_BUTTON_2].value;
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_EAST].value;
            }
            return 0;
          };
          this._ccprivate$_buttonWest = new InputSourceButton();
          this._ccprivate$_buttonWest.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_5;
              const webxrGamepad = (_GamepadInputDevice$_5 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_5.get(XRLeftHandedness);
              if (webxrGamepad && webxrGamepad.buttons.length > XR_BUTTON_1) {
                return webxrGamepad.buttons[XR_BUTTON_1].value;
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_WEST].value;
            }
            return 0;
          };
          this._ccprivate$_buttonSouth = new InputSourceButton();
          this._ccprivate$_buttonSouth.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_6;
              const webxrGamepad = (_GamepadInputDevice$_6 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_6.get(XRRightHandedness);
              if (webxrGamepad && webxrGamepad.buttons.length > XR_BUTTON_1) {
                return webxrGamepad.buttons[XR_BUTTON_1].value;
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_SOUTH].value;
            }
            return 0;
          };
          this._ccprivate$_buttonL1 = new InputSourceButton();
          this._ccprivate$_buttonL1.getValue = () => {
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_L1].value;
            }
            return 0;
          };
          this._ccprivate$_buttonL2 = new InputSourceButton();
          this._ccprivate$_buttonL2.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_7;
              const webxrGamepad = (_GamepadInputDevice$_7 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_7.get(XRLeftHandedness);
              if (webxrGamepad && webxrGamepad.buttons.length > XR_TRIGGER) {
                return webxrGamepad.buttons[XR_TRIGGER].value;
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_L2].value;
            }
            return 0;
          };
          this._ccprivate$_buttonL3 = new InputSourceButton();
          this._ccprivate$_buttonL3.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_8;
              const webxrGamepad = (_GamepadInputDevice$_8 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_8.get(XRLeftHandedness);
              if (webxrGamepad) {
                if (webxrGamepad.buttons.length > XR_STICK && webxrGamepad.buttons[XR_STICK].value !== 0) {
                  return webxrGamepad.buttons[XR_STICK].value;
                } else if (webxrGamepad.buttons.length > XR_TOUCHPAD && webxrGamepad.buttons[XR_TOUCHPAD].value !== 0) {
                  return webxrGamepad.buttons[XR_TOUCHPAD].value;
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_L3].value;
            }
            return 0;
          };
          this._ccprivate$_buttonR1 = new InputSourceButton();
          this._ccprivate$_buttonR1.getValue = () => {
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_R1].value;
            }
            return 0;
          };
          this._ccprivate$_buttonR2 = new InputSourceButton();
          this._ccprivate$_buttonR2.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_9;
              const webxrGamepad = (_GamepadInputDevice$_9 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_9.get(XRRightHandedness);
              if (webxrGamepad && webxrGamepad.buttons.length > XR_TRIGGER) {
                return webxrGamepad.buttons[XR_TRIGGER].value;
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_R2].value;
            }
            return 0;
          };
          this._ccprivate$_buttonR3 = new InputSourceButton();
          this._ccprivate$_buttonR3.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_0;
              const webxrGamepad = (_GamepadInputDevice$_0 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_0.get(XRRightHandedness);
              if (webxrGamepad) {
                if (webxrGamepad.buttons.length > XR_STICK && webxrGamepad.buttons[XR_STICK].value !== 0) {
                  return webxrGamepad.buttons[XR_STICK].value;
                } else if (webxrGamepad.buttons.length > XR_TOUCHPAD && webxrGamepad.buttons[XR_TOUCHPAD].value !== 0) {
                  return webxrGamepad.buttons[XR_TOUCHPAD].value;
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_R3].value;
            }
            return 0;
          };
          this._ccprivate$_buttonShare = new InputSourceButton();
          this._ccprivate$_buttonShare.getValue = () => {
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_SHARE].value;
            }
            return 0;
          };
          this._ccprivate$_buttonOptions = new InputSourceButton();
          this._ccprivate$_buttonOptions.getValue = () => {
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_OPTIONS].value;
            }
            return 0;
          };
          const dpadUp = new InputSourceButton();
          dpadUp.getValue = () => {
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_DPAD_UP].value;
            }
            return 0;
          };
          const dpadDown = new InputSourceButton();
          dpadDown.getValue = () => {
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_DPAD_DOWN].value;
            }
            return 0;
          };
          const dpadLeft = new InputSourceButton();
          dpadLeft.getValue = () => {
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_DPAD_LEFT].value;
            }
            return 0;
          };
          const dpadRight = new InputSourceButton();
          dpadRight.getValue = () => {
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return webGamepad.buttons[BUTTON_DPAD_RIGHT].value;
            }
            return 0;
          };
          this._ccprivate$_dpad = new InputSourceDpad({
            up: dpadUp,
            down: dpadDown,
            left: dpadLeft,
            right: dpadRight
          });
          const leftStickUp = new InputSourceButton();
          leftStickUp.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_1;
                const webxrGamepad = (_GamepadInputDevice$_1 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_1.get(XRLeftHandedness);
                if (webxrGamepad) {
                  if (webxrGamepad.axes.length > XR_AXIS_STICK_Y && webxrGamepad.axes[XR_AXIS_STICK_Y] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_STICK_Y]).negative;
                  } else if (webxrGamepad.axes.length > XR_AXIS_TOUCHPAD_Y && webxrGamepad.axes[XR_AXIS_TOUCHPAD_Y] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_TOUCHPAD_Y]).negative;
                  }
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return this._ccprivate$_axisToButtons(webGamepad.axes[AXIS_LEFT_STICK_Y]).negative;
            }
            return 0;
          };
          const leftStickDown = new InputSourceButton();
          leftStickDown.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_10;
                const webxrGamepad = (_GamepadInputDevice$_10 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_10.get(XRLeftHandedness);
                if (webxrGamepad) {
                  if (webxrGamepad.axes.length > XR_AXIS_STICK_Y && webxrGamepad.axes[XR_AXIS_STICK_Y] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_STICK_Y]).positive;
                  } else if (webxrGamepad.axes.length > XR_AXIS_TOUCHPAD_Y && webxrGamepad.axes[XR_AXIS_TOUCHPAD_Y] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_TOUCHPAD_Y]).positive;
                  }
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return this._ccprivate$_axisToButtons(webGamepad.axes[AXIS_LEFT_STICK_Y]).positive;
            }
            return 0;
          };
          const leftStickLeft = new InputSourceButton();
          leftStickLeft.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_11;
                const webxrGamepad = (_GamepadInputDevice$_11 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_11.get(XRLeftHandedness);
                if (webxrGamepad) {
                  if (webxrGamepad.axes.length > XR_AXIS_STICK_X && webxrGamepad.axes[XR_AXIS_STICK_X] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_STICK_X]).negative;
                  } else if (webxrGamepad.axes.length > XR_AXIS_TOUCHPAD_X && webxrGamepad.axes[XR_AXIS_TOUCHPAD_X] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_TOUCHPAD_X]).negative;
                  }
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return this._ccprivate$_axisToButtons(webGamepad.axes[AXIS_LEFT_STICK_X]).negative;
            }
            return 0;
          };
          const leftStickRight = new InputSourceButton();
          leftStickRight.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_12;
                const webxrGamepad = (_GamepadInputDevice$_12 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_12.get(XRLeftHandedness);
                if (webxrGamepad) {
                  if (webxrGamepad.axes.length > XR_AXIS_STICK_X && webxrGamepad.axes[XR_AXIS_STICK_X] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_STICK_X]).positive;
                  } else if (webxrGamepad.axes.length > XR_AXIS_TOUCHPAD_X && webxrGamepad.axes[XR_AXIS_TOUCHPAD_X] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_TOUCHPAD_X]).positive;
                  }
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return this._ccprivate$_axisToButtons(webGamepad.axes[AXIS_LEFT_STICK_X]).positive;
            }
            return 0;
          };
          this._ccprivate$_leftStick = new InputSourceStick({
            up: leftStickUp,
            down: leftStickDown,
            left: leftStickLeft,
            right: leftStickRight
          });
          const rightStickUp = new InputSourceButton();
          rightStickUp.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_13;
                const webxrGamepad = (_GamepadInputDevice$_13 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_13.get(XRRightHandedness);
                if (webxrGamepad) {
                  if (webxrGamepad.axes.length > XR_AXIS_STICK_Y && webxrGamepad.axes[XR_AXIS_STICK_Y] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_STICK_Y]).negative;
                  } else if (webxrGamepad.axes.length > XR_AXIS_TOUCHPAD_Y && webxrGamepad.axes[XR_AXIS_TOUCHPAD_Y] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_TOUCHPAD_Y]).negative;
                  }
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return this._ccprivate$_axisToButtons(webGamepad.axes[AXIS_RIGHT_STICK_Y]).negative;
            }
            return 0;
          };
          const rightStickDown = new InputSourceButton();
          rightStickDown.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_14;
                const webxrGamepad = (_GamepadInputDevice$_14 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_14.get(XRRightHandedness);
                if (webxrGamepad) {
                  if (webxrGamepad.axes.length > XR_AXIS_STICK_Y && webxrGamepad.axes[XR_AXIS_STICK_Y] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_STICK_Y]).positive;
                  } else if (webxrGamepad.axes.length > XR_AXIS_TOUCHPAD_Y && webxrGamepad.axes[XR_AXIS_TOUCHPAD_Y] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_TOUCHPAD_Y]).positive;
                  }
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return this._ccprivate$_axisToButtons(webGamepad.axes[AXIS_RIGHT_STICK_Y]).positive;
            }
            return 0;
          };
          const rightStickLeft = new InputSourceButton();
          rightStickLeft.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_15;
                const webxrGamepad = (_GamepadInputDevice$_15 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_15.get(XRRightHandedness);
                if (webxrGamepad) {
                  if (webxrGamepad.axes.length > XR_AXIS_STICK_X && webxrGamepad.axes[XR_AXIS_STICK_X] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_STICK_X]).negative;
                  } else if (webxrGamepad.axes.length > XR_AXIS_TOUCHPAD_X && webxrGamepad.axes[XR_AXIS_TOUCHPAD_X] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_TOUCHPAD_X]).negative;
                  }
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return this._ccprivate$_axisToButtons(webGamepad.axes[AXIS_RIGHT_STICK_X]).negative;
            }
            return 0;
          };
          const rightStickRight = new InputSourceButton();
          rightStickRight.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_16;
                const webxrGamepad = (_GamepadInputDevice$_16 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_16.get(XRRightHandedness);
                if (webxrGamepad) {
                  if (webxrGamepad.axes.length > XR_AXIS_STICK_X && webxrGamepad.axes[XR_AXIS_STICK_X] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_STICK_X]).positive;
                  } else if (webxrGamepad.axes.length > XR_AXIS_TOUCHPAD_X && webxrGamepad.axes[XR_AXIS_TOUCHPAD_X] !== 0) {
                    return this._ccprivate$_axisToButtons(webxrGamepad.axes[XR_AXIS_TOUCHPAD_X]).positive;
                  }
                }
              }
              return 0;
            }
            const webGamepad = GamepadInputDevice._ccprivate$_getWebGamepad(this.deviceId);
            if (webGamepad) {
              return this._ccprivate$_axisToButtons(webGamepad.axes[AXIS_RIGHT_STICK_X]).positive;
            }
            return 0;
          };
          this._ccprivate$_rightStick = new InputSourceStick({
            up: rightStickUp,
            down: rightStickDown,
            left: rightStickLeft,
            right: rightStickRight
          });
          this._ccprivate$_buttonStart = new InputSourceButton();
          this._ccprivate$_buttonStart.getValue = () => 0;
          this._ccprivate$_gripLeft = new InputSourceButton();
          this._ccprivate$_gripLeft.getValue = () => {
            if (this.deviceId === -1) {
              if (USE_XR) {
                var _GamepadInputDevice$_17;
                const webxrGamepad = (_GamepadInputDevice$_17 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_17.get(XRLeftHandedness);
                if (webxrGamepad && webxrGamepad.buttons.length > XR_GRIP) {
                  return webxrGamepad.buttons[XR_GRIP].value;
                }
              }
            }
            return 0;
          };
          this._ccprivate$_gripRight = new InputSourceButton();
          this._ccprivate$_gripRight.getValue = () => {
            if (this.deviceId === -1) {
              var _GamepadInputDevice$_18;
              const webxrGamepad = (_GamepadInputDevice$_18 = GamepadInputDevice._ccprivate$_getWebXRGamepadMap()) == null ? void 0 : _GamepadInputDevice$_18.get(XRRightHandedness);
              if (webxrGamepad && webxrGamepad.buttons.length > XR_GRIP) {
                return webxrGamepad.buttons[XR_GRIP].value;
              }
            }
            return 0;
          };
          this._ccprivate$_handLeftPosition = new InputSourcePosition();
          this._ccprivate$_handLeftPosition.getValue = () => this._ccprivate$_webPoseState[Pose.HAND_LEFT].position;
          this._ccprivate$_handLeftOrientation = new InputSourceOrientation();
          this._ccprivate$_handLeftOrientation.getValue = () => this._ccprivate$_webPoseState[Pose.HAND_LEFT].orientation;
          this._ccprivate$_handRightPosition = new InputSourcePosition();
          this._ccprivate$_handRightPosition.getValue = () => this._ccprivate$_webPoseState[Pose.HAND_RIGHT].position;
          this._ccprivate$_handRightOrientation = new InputSourceOrientation();
          this._ccprivate$_handRightOrientation.getValue = () => this._ccprivate$_webPoseState[Pose.HAND_RIGHT].orientation;
          this._ccprivate$_aimLeftPosition = new InputSourcePosition();
          this._ccprivate$_aimLeftPosition.getValue = () => this._ccprivate$_webPoseState[Pose.AIM_LEFT].position;
          this._ccprivate$_aimLeftOrientation = new InputSourceOrientation();
          this._ccprivate$_aimLeftOrientation.getValue = () => this._ccprivate$_webPoseState[Pose.AIM_LEFT].orientation;
          this._ccprivate$_aimRightPosition = new InputSourcePosition();
          this._ccprivate$_aimRightPosition.getValue = () => this._ccprivate$_webPoseState[Pose.AIM_RIGHT].position;
          this._ccprivate$_aimRightOrientation = new InputSourceOrientation();
          this._ccprivate$_aimRightOrientation.getValue = () => this._ccprivate$_webPoseState[Pose.AIM_RIGHT].orientation;
        }
      });
      GamepadInputDevice.all = [];
      GamepadInputDevice.xr = null;
      GamepadInputDevice._ccprivate$_eventTarget = new EventTarget();
      GamepadInputDevice._ccprivate$_cachedWebGamepads = [];
      GamepadInputDevice._ccprivate$_cachedWebXRGamepadMap = null;
      GamepadInputDevice._ccprivate$_intervalId = -1;
      GamepadInputDevice._ccprivate$_totalGamepadCnt = 0;
    }
  };
});