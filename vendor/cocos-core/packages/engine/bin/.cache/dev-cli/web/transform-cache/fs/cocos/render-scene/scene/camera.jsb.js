System.register("q-bundled:///fs/cocos/render-scene/scene/camera.jsb.js", ["../../gfx/index.js", "../../scene-graph/utils.jsb.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var ClearFlagBit, _tempFloatArray, fillMat4WithTempFloatArray, Mat4, Vec3, CameraFOVAxis, CameraProjection, CameraAperture, CameraISO, CameraShutter, CameraType, TrackingType, CameraUsage, SkyBoxFlagValue, SKYBOX_FLAG, Camera, cameraProto, oldInitialize, oldScreenPointToRay, oldScreenToWorld, oldWorldToScreen, oldWorldMatrixToScreen;
  return {
    setters: [function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
    }, function (_sceneGraphUtilsJsbJs) {
      _tempFloatArray = _sceneGraphUtilsJsbJs._tempFloatArray;
      fillMat4WithTempFloatArray = _sceneGraphUtilsJsbJs.fillMat4WithTempFloatArray;
    }, function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
      Vec3 = _coreIndexJs.Vec3;
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      _export("CameraFOVAxis", CameraFOVAxis = /*#__PURE__*/function (CameraFOVAxis) {
        CameraFOVAxis[CameraFOVAxis["VERTICAL"] = 0] = "VERTICAL";
        CameraFOVAxis[CameraFOVAxis["HORIZONTAL"] = 1] = "HORIZONTAL";
        return CameraFOVAxis;
      }({}));
      _export("CameraProjection", CameraProjection = /*#__PURE__*/function (CameraProjection) {
        CameraProjection[CameraProjection["ORTHO"] = 0] = "ORTHO";
        CameraProjection[CameraProjection["PERSPECTIVE"] = 1] = "PERSPECTIVE";
        return CameraProjection;
      }({}));
      _export("CameraAperture", CameraAperture = /*#__PURE__*/function (CameraAperture) {
        CameraAperture[CameraAperture["F1_8"] = 0] = "F1_8";
        CameraAperture[CameraAperture["F2_0"] = 1] = "F2_0";
        CameraAperture[CameraAperture["F2_2"] = 2] = "F2_2";
        CameraAperture[CameraAperture["F2_5"] = 3] = "F2_5";
        CameraAperture[CameraAperture["F2_8"] = 4] = "F2_8";
        CameraAperture[CameraAperture["F3_2"] = 5] = "F3_2";
        CameraAperture[CameraAperture["F3_5"] = 6] = "F3_5";
        CameraAperture[CameraAperture["F4_0"] = 7] = "F4_0";
        CameraAperture[CameraAperture["F4_5"] = 8] = "F4_5";
        CameraAperture[CameraAperture["F5_0"] = 9] = "F5_0";
        CameraAperture[CameraAperture["F5_6"] = 10] = "F5_6";
        CameraAperture[CameraAperture["F6_3"] = 11] = "F6_3";
        CameraAperture[CameraAperture["F7_1"] = 12] = "F7_1";
        CameraAperture[CameraAperture["F8_0"] = 13] = "F8_0";
        CameraAperture[CameraAperture["F9_0"] = 14] = "F9_0";
        CameraAperture[CameraAperture["F10_0"] = 15] = "F10_0";
        CameraAperture[CameraAperture["F11_0"] = 16] = "F11_0";
        CameraAperture[CameraAperture["F13_0"] = 17] = "F13_0";
        CameraAperture[CameraAperture["F14_0"] = 18] = "F14_0";
        CameraAperture[CameraAperture["F16_0"] = 19] = "F16_0";
        CameraAperture[CameraAperture["F18_0"] = 20] = "F18_0";
        CameraAperture[CameraAperture["F20_0"] = 21] = "F20_0";
        CameraAperture[CameraAperture["F22_0"] = 22] = "F22_0";
        return CameraAperture;
      }({}));
      _export("CameraISO", CameraISO = /*#__PURE__*/function (CameraISO) {
        CameraISO[CameraISO["ISO100"] = 0] = "ISO100";
        CameraISO[CameraISO["ISO200"] = 1] = "ISO200";
        CameraISO[CameraISO["ISO400"] = 2] = "ISO400";
        CameraISO[CameraISO["ISO800"] = 3] = "ISO800";
        return CameraISO;
      }({}));
      _export("CameraShutter", CameraShutter = /*#__PURE__*/function (CameraShutter) {
        CameraShutter[CameraShutter["D1"] = 0] = "D1";
        CameraShutter[CameraShutter["D2"] = 1] = "D2";
        CameraShutter[CameraShutter["D4"] = 2] = "D4";
        CameraShutter[CameraShutter["D8"] = 3] = "D8";
        CameraShutter[CameraShutter["D15"] = 4] = "D15";
        CameraShutter[CameraShutter["D30"] = 5] = "D30";
        CameraShutter[CameraShutter["D60"] = 6] = "D60";
        CameraShutter[CameraShutter["D125"] = 7] = "D125";
        CameraShutter[CameraShutter["D250"] = 8] = "D250";
        CameraShutter[CameraShutter["D500"] = 9] = "D500";
        CameraShutter[CameraShutter["D1000"] = 10] = "D1000";
        CameraShutter[CameraShutter["D2000"] = 11] = "D2000";
        CameraShutter[CameraShutter["D4000"] = 12] = "D4000";
        return CameraShutter;
      }({}));
      _export("CameraType", CameraType = /*#__PURE__*/function (CameraType) {
        CameraType[CameraType["DEFAULT"] = -1] = "DEFAULT";
        CameraType[CameraType["LEFT_EYE"] = 0] = "LEFT_EYE";
        CameraType[CameraType["RIGHT_EYE"] = 1] = "RIGHT_EYE";
        CameraType[CameraType["MAIN"] = 2] = "MAIN";
        return CameraType;
      }({}));
      _export("TrackingType", TrackingType = /*#__PURE__*/function (TrackingType) {
        TrackingType[TrackingType["NO_TRACKING"] = 0] = "NO_TRACKING";
        TrackingType[TrackingType["POSITION_AND_ROTATION"] = 1] = "POSITION_AND_ROTATION";
        TrackingType[TrackingType["POSITION"] = 2] = "POSITION";
        TrackingType[TrackingType["ROTATION"] = 3] = "ROTATION";
        return TrackingType;
      }({}));
      _export("CameraUsage", CameraUsage = /*#__PURE__*/function (CameraUsage) {
        CameraUsage[CameraUsage["EDITOR"] = 0] = "EDITOR";
        CameraUsage[CameraUsage["GAME_VIEW"] = 1] = "GAME_VIEW";
        CameraUsage[CameraUsage["SCENE_VIEW"] = 2] = "SCENE_VIEW";
        CameraUsage[CameraUsage["PREVIEW"] = 3] = "PREVIEW";
        CameraUsage[CameraUsage["GAME"] = 100] = "GAME";
        return CameraUsage;
      }({}));
      _export("SkyBoxFlagValue", SkyBoxFlagValue = function (SkyBoxFlagValue) {
        SkyBoxFlagValue[SkyBoxFlagValue["VALUE"] = ClearFlagBit.STENCIL << 1] = "VALUE";
        return SkyBoxFlagValue;
      }({}));
      _export("SKYBOX_FLAG", SKYBOX_FLAG = SkyBoxFlagValue.VALUE);
      _export("Camera", Camera = jsb.Camera);
      cameraProto = jsb.Camera.prototype;
      Object.defineProperty(Camera, "standardExposureValue", {
        configurable: true,
        enumerable: true,
        get() {
          // TODO: `getStandardExposureValue` only implemented on native platforms. @dumganhar
          // issue: https://github.com/cocos/cocos-engine/issues/14644
          return Camera.getStandardExposureValue();
        }
      });
      Object.defineProperty(Camera, "standardLightMeterScale", {
        configurable: true,
        enumerable: true,
        get() {
          // TODO: `getStandardLightMeterScale` only implemented on native platforms. @dumganhar
          // issue: https://github.com/cocos/cocos-engine/issues/14644
          return Camera.getStandardLightMeterScale();
        }
      });
      Object.defineProperty(cameraProto, 'matView', {
        configurable: true,
        enumerable: true,
        get() {
          this.getMatView();
          fillMat4WithTempFloatArray(this._matView);
          return this._matView;
        }
      });
      Object.defineProperty(cameraProto, 'matProj', {
        configurable: true,
        enumerable: true,
        get() {
          this.getMatProj();
          fillMat4WithTempFloatArray(this._matProj);
          return this._matProj;
        }
      });
      Object.defineProperty(cameraProto, 'matProjInv', {
        configurable: true,
        enumerable: true,
        get() {
          this.getMatProjInv();
          fillMat4WithTempFloatArray(this._matProjInv);
          return this._matProjInv;
        }
      });
      Object.defineProperty(cameraProto, 'matViewProj', {
        configurable: true,
        enumerable: true,
        get() {
          this.getMatViewProj();
          fillMat4WithTempFloatArray(this._matViewProj);
          return this._matViewProj;
        }
      });
      Object.defineProperty(cameraProto, 'matViewProjInv', {
        configurable: true,
        enumerable: true,
        get() {
          this.getMatViewProjInv();
          fillMat4WithTempFloatArray(this._matViewProjInv);
          return this._matViewProjInv;
        }
      });
      oldInitialize = cameraProto.initialize;
      cameraProto.initialize = function initialize() {
        oldInitialize.apply(this, arguments);
        this._matView = new Mat4();
        this._matProj = new Mat4();
        this._matProjInv = new Mat4();
        this._matViewProj = new Mat4();
        this._matViewProjInv = new Mat4();
      };
      oldScreenPointToRay = cameraProto.screenPointToRay;
      oldScreenToWorld = cameraProto.screenToWorld;
      oldWorldToScreen = cameraProto.worldToScreen;
      oldWorldMatrixToScreen = cameraProto.worldMatrixToScreen;
      /**
       * transform a screen position (in oriented space) to a world space ray
       */
      cameraProto.screenPointToRay = function screenPointToRay(out, x, y) {
        _tempFloatArray[0] = x;
        _tempFloatArray[1] = y;
        oldScreenPointToRay.call(this);
        out.o.x = _tempFloatArray[0];
        out.o.y = _tempFloatArray[1];
        out.o.z = _tempFloatArray[2];
        out.d.x = _tempFloatArray[3];
        out.d.y = _tempFloatArray[4];
        out.d.z = _tempFloatArray[5];
        return out;
      };
      cameraProto.screenToWorld = function screenToWorld(out, screenPos) {
        _tempFloatArray[0] = screenPos.x;
        _tempFloatArray[1] = screenPos.y;
        _tempFloatArray[2] = screenPos.z;
        oldScreenToWorld.call(this);
        Vec3.set(out, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
        return out;
      };
      cameraProto.worldToScreen = function worldToScreen(out, worldPos) {
        _tempFloatArray[0] = worldPos.x;
        _tempFloatArray[1] = worldPos.y;
        _tempFloatArray[2] = worldPos.z;
        oldWorldToScreen.call(this);
        Vec3.set(out, _tempFloatArray[0], _tempFloatArray[1], _tempFloatArray[2]);
        return out;
      };
      cameraProto.worldMatrixToScreen = function worldMatrixToScreen(out, worldMatrix, width, height) {
        _tempFloatArray[0] = worldMatrix.m00;
        _tempFloatArray[1] = worldMatrix.m01;
        _tempFloatArray[2] = worldMatrix.m02;
        _tempFloatArray[3] = worldMatrix.m03;
        _tempFloatArray[4] = worldMatrix.m04;
        _tempFloatArray[5] = worldMatrix.m05;
        _tempFloatArray[6] = worldMatrix.m06;
        _tempFloatArray[7] = worldMatrix.m07;
        _tempFloatArray[8] = worldMatrix.m08;
        _tempFloatArray[9] = worldMatrix.m09;
        _tempFloatArray[10] = worldMatrix.m10;
        _tempFloatArray[11] = worldMatrix.m11;
        _tempFloatArray[12] = worldMatrix.m12;
        _tempFloatArray[13] = worldMatrix.m13;
        _tempFloatArray[14] = worldMatrix.m14;
        _tempFloatArray[15] = worldMatrix.m15;
        _tempFloatArray[16] = width;
        _tempFloatArray[17] = height;
        oldWorldMatrixToScreen.call(this);
        fillMat4WithTempFloatArray(out);
        return out;
      };
    }
  };
});