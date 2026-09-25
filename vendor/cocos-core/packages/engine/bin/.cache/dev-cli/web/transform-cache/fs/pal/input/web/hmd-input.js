System.register("q-bundled:///fs/pal/input/web/hmd-input.js", ["../../../cocos/core/event/event-target.js", "../../../cocos/input/types/index.js", "../input-source.js", "../../../cocos/core/math/index.js", "../../../predefine.js"], function (_export, _context) {
  "use strict";

  var EventTarget, EventHMD, InputSourcePosition, InputSourceOrientation, Quat, Vec3, legacyCC, HMDInputDevice, Pose;
  return {
    setters: [function (_cocosCoreEventEventTargetJs) {
      EventTarget = _cocosCoreEventEventTargetJs.EventTarget;
    }, function (_cocosInputTypesIndexJs) {
      EventHMD = _cocosInputTypesIndexJs.EventHMD;
    }, function (_inputSourceJs) {
      InputSourcePosition = _inputSourceJs.InputSourcePosition;
      InputSourceOrientation = _inputSourceJs.InputSourceOrientation;
    }, function (_cocosCoreMathIndexJs) {
      Quat = _cocosCoreMathIndexJs.Quat;
      Vec3 = _cocosCoreMathIndexJs.Vec3;
    }, function (_predefineJs) {
      legacyCC = _predefineJs.default;
    }],
    execute: function () {
      (function (Pose) {
        Pose[Pose["VIEW_LEFT"] = 0] = "VIEW_LEFT";
        Pose[Pose["VIEW_RIGHT"] = 3] = "VIEW_RIGHT";
        Pose[Pose["HEAD_MIDDLE"] = 6] = "HEAD_MIDDLE";
      })(Pose || (Pose = {}));
      _export("HMDInputDevice", HMDInputDevice = class HMDInputDevice {
        get viewLeftPosition() {
          return this._ccprivate$_viewLeftPosition;
        }
        get viewLeftOrientation() {
          return this._ccprivate$_viewLeftOrientation;
        }
        get viewRightPosition() {
          return this._ccprivate$_viewRightPosition;
        }
        get viewRightOrientation() {
          return this._ccprivate$_viewRightOrientation;
        }
        get headMiddlePosition() {
          return this._ccprivate$_headMiddlePosition;
        }
        get headMiddleOrientation() {
          return this._ccprivate$_headMiddleOrientation;
        }
        constructor() {
          this._ccprivate$_eventTarget = new EventTarget();
          this._ccprivate$_intervalId = -1;
          this._ccprivate$_webPoseState = {
            [Pose.VIEW_LEFT]: {
              position: Vec3.ZERO,
              orientation: Quat.IDENTITY
            },
            [Pose.VIEW_RIGHT]: {
              position: Vec3.ZERO,
              orientation: Quat.IDENTITY
            },
            [Pose.HEAD_MIDDLE]: {
              position: Vec3.ZERO,
              orientation: Quat.IDENTITY
            }
          };
          this._ccprivate$_initInputSource();
          this._ccprivate$_registerEvent();
        }
        _ccprivate$_ensureDirectorDefined() {
          return new Promise(resolve => {
            this._ccprivate$_intervalId = setInterval(() => {
              if (legacyCC.director && legacyCC.Director) {
                clearInterval(this._ccprivate$_intervalId);
                this._ccprivate$_intervalId = -1;
                resolve();
              }
            }, 50);
          });
        }
        _ccprivate$_registerEvent() {
          this._ccprivate$_ensureDirectorDefined().then(() => {
            legacyCC.director.on(legacyCC.Director.EVENT_BEGIN_FRAME, this._ccprivate$_scanHmd, this);
          }).catch(e => {});
        }
        _ccprivate$_scanHmd() {
          var _globalThis$__globalX;
          const infoList = (_globalThis$__globalX = globalThis.__globalXR) == null ? void 0 : _globalThis$__globalX.webxrHmdPoseInfos;
          if (!infoList) {
            return;
          }
          for (let i = 0; i < infoList.length; ++i) {
            const info = infoList[i];
            this._ccprivate$_updateWebPoseState(info);
          }
          this._ccprivate$_eventTarget.emit("hmd-pose-input", new EventHMD("hmd-pose-input", this));
        }
        _on(eventType, callback, target) {
          this._ccprivate$_eventTarget.on(eventType, callback, target);
        }
        _ccprivate$_updateWebPoseState(info) {
          if (info.code !== Pose.VIEW_LEFT && info.code !== Pose.VIEW_RIGHT && info.code !== Pose.HEAD_MIDDLE) {
            return;
          }
          this._ccprivate$_webPoseState[info.code] = {
            position: new Vec3(info.position.x, info.position.y, info.position.z),
            orientation: new Quat(info.orientation.x, info.orientation.y, info.orientation.z, info.orientation.w)
          };
        }
        _ccprivate$_initInputSource() {
          this._ccprivate$_viewLeftPosition = new InputSourcePosition();
          this._ccprivate$_viewLeftPosition.getValue = () => this._ccprivate$_webPoseState[Pose.VIEW_LEFT].position;
          this._ccprivate$_viewLeftOrientation = new InputSourceOrientation();
          this._ccprivate$_viewLeftOrientation.getValue = () => this._ccprivate$_webPoseState[Pose.VIEW_LEFT].orientation;
          this._ccprivate$_viewRightPosition = new InputSourcePosition();
          this._ccprivate$_viewRightPosition.getValue = () => this._ccprivate$_webPoseState[Pose.VIEW_RIGHT].position;
          this._ccprivate$_viewRightOrientation = new InputSourceOrientation();
          this._ccprivate$_viewRightOrientation.getValue = () => this._ccprivate$_webPoseState[Pose.VIEW_RIGHT].orientation;
          this._ccprivate$_headMiddlePosition = new InputSourcePosition();
          this._ccprivate$_headMiddlePosition.getValue = () => this._ccprivate$_webPoseState[Pose.HEAD_MIDDLE].position;
          this._ccprivate$_headMiddleOrientation = new InputSourceOrientation();
          this._ccprivate$_headMiddleOrientation.getValue = () => this._ccprivate$_webPoseState[Pose.HEAD_MIDDLE].orientation;
        }
      });
    }
  };
});