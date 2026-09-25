System.register("q-bundled:///fs/cocos/render-scene/scene/camera.js", ["../../../../virtual/internal%253Aconstants.js", "../../gfx/index.js", "../../core/index.js", "../../rendering/define.js"], function (_export, _context) {
  "use strict";

  var EDITOR, USE_XR, SurfaceTransform, ClearFlagBit, Color, lerp, Mat4, Rect, toRadian, Vec3, preTransforms, warnID, geometry, cclegacy, Vec4, rect, mat4, v3, CAMERA_DEFAULT_MASK, Camera, CameraFOVAxis, CameraProjection, CameraAperture, CameraISO, CameraShutter, CameraType, TrackingType, CameraUsage, FSTOPS, SHUTTERS, ISOS, v_a, v_b, _tempMat1, SkyBoxFlagValue, SKYBOX_FLAG, correctionMatrices, _cameraCount;
  _export("Camera", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      USE_XR = _virtualInternal253AconstantsJs.USE_XR;
    }, function (_gfxIndexJs) {
      SurfaceTransform = _gfxIndexJs.SurfaceTransform;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Color = _gfxIndexJs.Color;
    }, function (_coreIndexJs) {
      lerp = _coreIndexJs.lerp;
      Mat4 = _coreIndexJs.Mat4;
      Rect = _coreIndexJs.Rect;
      toRadian = _coreIndexJs.toRadian;
      Vec3 = _coreIndexJs.Vec3;
      preTransforms = _coreIndexJs.preTransforms;
      warnID = _coreIndexJs.warnID;
      geometry = _coreIndexJs.geometry;
      cclegacy = _coreIndexJs.cclegacy;
      Vec4 = _coreIndexJs.Vec4;
      rect = _coreIndexJs.rect;
      mat4 = _coreIndexJs.mat4;
      v3 = _coreIndexJs.v3;
    }, function (_renderingDefineJs) {
      CAMERA_DEFAULT_MASK = _renderingDefineJs.CAMERA_DEFAULT_MASK;
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /**
       * @en The enumeration type for the fixed axis of the camera.
       * The field of view along the corresponding axis would be fixed regardless of screen aspect changes.
       * @zh 相机视角的锁定轴向枚举，在对应轴上不会跟随屏幕长宽比例变化。
       */
      _export("CameraFOVAxis", CameraFOVAxis = /*#__PURE__*/function (CameraFOVAxis) {
        /**
         * @en Vertically fixed camera
         * @zh 在垂直轴向上锁定的相机
         */
        CameraFOVAxis[CameraFOVAxis["VERTICAL"] = 0] = "VERTICAL";
        /**
         * @en Horizontally fixed camera
         * @zh 在水平轴向上锁定的相机
         */
        CameraFOVAxis[CameraFOVAxis["HORIZONTAL"] = 1] = "HORIZONTAL";
        return CameraFOVAxis;
      }({}));
      /**
       * @en The projection type enumeration of the camera.
       * @zh 相机的投影类型枚举。
       */
      _export("CameraProjection", CameraProjection = /*#__PURE__*/function (CameraProjection) {
        /**
         * @en Orthogonal projection type
         * @zh 正交投影类型
         */
        CameraProjection[CameraProjection["ORTHO"] = 0] = "ORTHO";
        /**
         * @en Perspective projection type
         * @zh 透视投影类型
         */
        CameraProjection[CameraProjection["PERSPECTIVE"] = 1] = "PERSPECTIVE";
        return CameraProjection;
      }({}));
      /**
       * @en The aperture enumeration of the camera, represent in f-number.
       * The smaller the value is, the bigger the aperture is, and more light it can capture, but less depth it supports.
       * @zh 相机的快门枚举，使用 f 值来表示。f 值越小，光圈就越大，进光量也越大，景深越浅。
       */
      _export("CameraAperture", CameraAperture = /*#__PURE__*/function (CameraAperture) {
        /**
         * f/1.8
         */
        CameraAperture[CameraAperture["F1_8"] = 0] = "F1_8";
        /**
         * f/2.0
         */
        CameraAperture[CameraAperture["F2_0"] = 1] = "F2_0";
        /**
         * f/2.2
         */
        CameraAperture[CameraAperture["F2_2"] = 2] = "F2_2";
        /**
         * f/2.5
         */
        CameraAperture[CameraAperture["F2_5"] = 3] = "F2_5";
        /**
         * f/2.8
         */
        CameraAperture[CameraAperture["F2_8"] = 4] = "F2_8";
        /**
         * f/3.2
         */
        CameraAperture[CameraAperture["F3_2"] = 5] = "F3_2";
        /**
         * f/3.5
         */
        CameraAperture[CameraAperture["F3_5"] = 6] = "F3_5";
        /**
         * f/4.0
         */
        CameraAperture[CameraAperture["F4_0"] = 7] = "F4_0";
        /**
         * f/4.5
         */
        CameraAperture[CameraAperture["F4_5"] = 8] = "F4_5";
        /**
         * f/5.0
         */
        CameraAperture[CameraAperture["F5_0"] = 9] = "F5_0";
        /**
         * f/5.6
         */
        CameraAperture[CameraAperture["F5_6"] = 10] = "F5_6";
        /**
         * f/6.3
         */
        CameraAperture[CameraAperture["F6_3"] = 11] = "F6_3";
        /**
         * f/7.1
         */
        CameraAperture[CameraAperture["F7_1"] = 12] = "F7_1";
        /**
         * f/8
         */
        CameraAperture[CameraAperture["F8_0"] = 13] = "F8_0";
        /**
         * f/9
         */
        CameraAperture[CameraAperture["F9_0"] = 14] = "F9_0";
        /**
         * f/10
         */
        CameraAperture[CameraAperture["F10_0"] = 15] = "F10_0";
        /**
         * f/11
         */
        CameraAperture[CameraAperture["F11_0"] = 16] = "F11_0";
        /**
         * f/13
         */
        CameraAperture[CameraAperture["F13_0"] = 17] = "F13_0";
        /**
         * f/14
         */
        CameraAperture[CameraAperture["F14_0"] = 18] = "F14_0";
        /**
         * f/16
         */
        CameraAperture[CameraAperture["F16_0"] = 19] = "F16_0";
        /**
         * f/18
         */
        CameraAperture[CameraAperture["F18_0"] = 20] = "F18_0";
        /**
         * f/20
         */
        CameraAperture[CameraAperture["F20_0"] = 21] = "F20_0";
        /**
         * f/22
         */
        CameraAperture[CameraAperture["F22_0"] = 22] = "F22_0";
        return CameraAperture;
      }({}));
      /**
       * @en The ISO enumeration of the camera, lower ISO means the camera is less sensitive to light.
       * @zh 相机感光度枚举，越低的 ISO 数值表示相机对光更加不敏感。
       */
      _export("CameraISO", CameraISO = /*#__PURE__*/function (CameraISO) {
        CameraISO[CameraISO["ISO100"] = 0] = "ISO100";
        CameraISO[CameraISO["ISO200"] = 1] = "ISO200";
        CameraISO[CameraISO["ISO400"] = 2] = "ISO400";
        CameraISO[CameraISO["ISO800"] = 3] = "ISO800";
        return CameraISO;
      }({}));
      /**
       * @en Camera shutter enumeration, the value represents the speed of the shutter.
       * @zh 相机快门枚举，枚举值表示快门速度。
       */
      _export("CameraShutter", CameraShutter = /*#__PURE__*/function (CameraShutter) {
        /**
         * 1 second
         */
        CameraShutter[CameraShutter["D1"] = 0] = "D1";
        /**
         * 1/2 second
         */
        CameraShutter[CameraShutter["D2"] = 1] = "D2";
        /**
         * 1/4 second
         */
        CameraShutter[CameraShutter["D4"] = 2] = "D4";
        /**
         * 1/8 second
         */
        CameraShutter[CameraShutter["D8"] = 3] = "D8";
        /**
         * 1/15 second
         */
        CameraShutter[CameraShutter["D15"] = 4] = "D15";
        /**
         * 1/30 second
         */
        CameraShutter[CameraShutter["D30"] = 5] = "D30";
        /**
         * 1/60 second
         */
        CameraShutter[CameraShutter["D60"] = 6] = "D60";
        /**
         * 1/125 second
         */
        CameraShutter[CameraShutter["D125"] = 7] = "D125";
        /**
         * 1/250 second
         */
        CameraShutter[CameraShutter["D250"] = 8] = "D250";
        /**
         * 1/500 second
         */
        CameraShutter[CameraShutter["D500"] = 9] = "D500";
        /**
         * 1/1000 second
         */
        CameraShutter[CameraShutter["D1000"] = 10] = "D1000";
        /**
         * 1/2000 second
         */
        CameraShutter[CameraShutter["D2000"] = 11] = "D2000";
        /**
         * 1/4000 second
         */
        CameraShutter[CameraShutter["D4000"] = 12] = "D4000";
        return CameraShutter;
      }({}));
      /**
       * @en The type of the camera, mainly for marking different camera usage in XR, it determines the camera's viewport and parameters.
       * @zh 相机类型，主要服务于标记 XR 中的不同相机用途，影响渲染的视口和对应的参数。
       */
      _export("CameraType", CameraType = /*#__PURE__*/function (CameraType) {
        /**
         * @en Default camera type
         * @zh 默认相机类型
         */
        CameraType[CameraType["DEFAULT"] = -1] = "DEFAULT";
        /**
         * @en If a camera is set to be left eye, it will be used to render the left eye screen,
         * otherwise, the left eye screen will be rendered using adjusted parameters based on XR main camera.
         * @zh 如果设置了左眼相机，则在绘制左眼屏幕时使用，否则，就根据 XR 主相机的参数来计算左眼参数。
         */
        CameraType[CameraType["LEFT_EYE"] = 0] = "LEFT_EYE";
        /**
         * @en If a camera is set to be right eye, it will be used to render the right eye screen,
         * otherwise, the right eye screen will be rendered using adjusted parameters based on XR main camera.
         * @zh 如果设置了右眼相机，则在绘制右眼屏幕时使用，否则，就根据 XR 主相机的参数来计算左眼参数。
         */
        CameraType[CameraType["RIGHT_EYE"] = 1] = "RIGHT_EYE";
        /**
         * @en The main camera, it could be used to calculate the parameters for both left eye and the right eye cameras.
         * It could be converted from the default 3d camera.
         * @zh XR 主相机，可以通过默认相机转换，也可以手动创建新的 XR 相机，可以计算出左右两个相机的相对参数。
         */
        CameraType[CameraType["MAIN"] = 2] = "MAIN";
        return CameraType;
      }({}));
      /**
       * @en The spatial tracking signal type used by the camera in XR.
       * @zh 相机使用的 XR 空间定位追踪信号类型。
       */
      _export("TrackingType", TrackingType = /*#__PURE__*/function (TrackingType) {
        /**
         * @en Camera without signal tracking in XR device.
         * @zh 无追踪相机，不对 XR 设备的信号进行追踪。
         */
        TrackingType[TrackingType["NO_TRACKING"] = 0] = "NO_TRACKING";
        /**
         * @en Camera tracking position and rotation signals from XR device.
         * @zh 相机追踪 XR 设备移动位置和旋转角度信号。
         */
        TrackingType[TrackingType["POSITION_AND_ROTATION"] = 1] = "POSITION_AND_ROTATION";
        /**
         * @en Camera only tracking position signals from XR device.
         * @zh 相机只追踪 XR 设备位置信号。
         */
        TrackingType[TrackingType["POSITION"] = 2] = "POSITION";
        /**
         * @en Camera only tracking rotation signals from XR device.
         * @zh 相机只追踪 XR 设备旋转角度信号。
         */
        TrackingType[TrackingType["ROTATION"] = 3] = "ROTATION";
        return TrackingType;
      }({}));
      /**
       * @en The usage of the camera, it's an engine internal marker enumeration.
       * @zh 相机的用途枚举，这是引擎内部使用的标记枚举。
       */
      _export("CameraUsage", CameraUsage = /*#__PURE__*/function (CameraUsage) {
        /**
         * @en Camera used in editor
         * @zh 编辑器下使用的相机
         */
        CameraUsage[CameraUsage["EDITOR"] = 0] = "EDITOR";
        /**
         * @en Camera used in editor's game view.
         * @zh 编辑器 GameView 视图下使用的相机。
         */
        CameraUsage[CameraUsage["GAME_VIEW"] = 1] = "GAME_VIEW";
        /**
         * @en Camera used in editor's scene view.
         * @zh 编辑器场景编辑器视图下使用的相机。
         */
        CameraUsage[CameraUsage["SCENE_VIEW"] = 2] = "SCENE_VIEW";
        /**
         * @en Camera used in editor's camera preview window.
         * @zh 编辑器预览小窗视图下使用的相机。
         */
        CameraUsage[CameraUsage["PREVIEW"] = 3] = "PREVIEW";
        /**
         * @en Camera used in game, normally user created cameras are all GAME type.
         * @zh 游戏视图下使用的相机，一般情况下用户创建的相机都是 GAME 类型。
         */
        CameraUsage[CameraUsage["GAME"] = 100] = "GAME";
        return CameraUsage;
      }({}));
      FSTOPS = [1.8, 2.0, 2.2, 2.5, 2.8, 3.2, 3.5, 4.0, 4.5, 5.0, 5.6, 6.3, 7.1, 8.0, 9.0, 10.0, 11.0, 13.0, 14.0, 16.0, 18.0, 20.0, 22.0];
      SHUTTERS = [1.0, 1.0 / 2.0, 1.0 / 4.0, 1.0 / 8.0, 1.0 / 15.0, 1.0 / 30.0, 1.0 / 60.0, 1.0 / 125.0, 1.0 / 250.0, 1.0 / 500.0, 1.0 / 1000.0, 1.0 / 2000.0, 1.0 / 4000.0];
      ISOS = [100.0, 200.0, 400.0, 800.0];
      /**
       * @en The camera creation information struct
       * @zh 用来创建相机的结构体
       */
      v_a = v3();
      v_b = v3();
      _tempMat1 = mat4();
      _export("SkyBoxFlagValue", SkyBoxFlagValue = function (SkyBoxFlagValue) {
        SkyBoxFlagValue[SkyBoxFlagValue["VALUE"] = ClearFlagBit.STENCIL << 1] = "VALUE";
        return SkyBoxFlagValue;
      }({}));
      _export("SKYBOX_FLAG", SKYBOX_FLAG = SkyBoxFlagValue.VALUE);
      correctionMatrices = [];
      _cameraCount = 0;
      /**
       * @en The render camera representation in the render scene, it's managed by [[Camera]]
       * @zh 渲染场景中的相机对象，由项目层的 [[Camera]] 管理。
       */
      _export("Camera", Camera = class Camera {
        /**
         * @en This exposure value corresponding to default standard camera exposure parameters.
         * @zh 默认相机的曝光值。
         */
        static get standardExposureValue() {
          return 1.0 / 38400.0;
        }

        /**
         * @en The luminance unit scale used by area lights.
         * @zh 默认局部光源使用的亮度单位缩放。
         */
        static get standardLightMeterScale() {
          return 10000.0;
        }

        /**
         * @en The name of the camera
         * @zh 相机的名称
         */
        get name() {
          return this._name;
        }

        /**
         * @en The render scene to which the camera is attached
         * @zh 相机所挂载的场景
         */
        get scene() {
          return this._scene;
        }

        /**
         * @en The node of the camera which determines its transform in world space.
         * @zh 相机绑定的节点，决定了它在世界空间的变换矩阵
         */
        set node(val) {
          this._node = val;
        }
        get node() {
          return this._node;
        }

        /**
         * @en The unique ID of system window which the camera will render to.
         * @zh 相机关联的渲染窗口ID
         */
        get systemWindowId() {
          return this._windowId;
        }

        /**
         * @en The render window of the camera
         * @zh 相机关联的渲染窗口
         */
        set window(val) {
          this._window = val;
        }
        get window() {
          return this._window;
        }

        /**
         * @en Whether the camera is enabled, a disabled camera won't be processed in the render pipeline.
         * @zh 相机是否启用，未启用的相机不会被渲染
         */
        set enabled(val) {
          this._enabled = val;
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @en Visibility mask of the camera, declaring a set of node layers that will be visible to this camera.
         * @zh 相机的可见性掩码，声明在当前相机中可见的节点层级集合。
         */
        set visibility(vis) {
          this._visibility = vis;
        }
        get visibility() {
          return this._visibility;
        }

        /**
         * @en Render priority of the camera. Cameras with higher depth are rendered after cameras with lower depth.
         * @zh 相机的渲染优先级，值越小越优先渲染。
         */
        get priority() {
          return this._priority;
        }
        set priority(val) {
          this._priority = val;
        }

        /**
         * @en The width of the camera's view size
         * @zh 相机的视图宽度
         */
        get width() {
          return this._width;
        }

        /**
         * @en The height of the camera's view size
         * @zh 相机的视图高度
         */
        get height() {
          return this._height;
        }

        /**
         * @en The world position of the camera
         * @zh 相机的世界坐标
         */
        set position(val) {
          this._position = val;
        }
        get position() {
          return this._position;
        }

        /**
         * @en The forward vector of the camera's look direction
         * @zh 指向相机观察方向的向量
         */
        set forward(val) {
          this._forward = val;
        }
        get forward() {
          return this._forward;
        }

        /**
         * @en Camera aperture, controls the exposure parameter.
         * @zh 相机光圈，影响相机的曝光参数。
         */
        set aperture(val) {
          this._aperture = val;
          this._apertureValue = FSTOPS[this._aperture];
          this.updateExposure();
        }
        get aperture() {
          return this._aperture;
        }

        /**
         * @en Camera aperture value.
         * @zh 相机光圈值。
         */
        get apertureValue() {
          return this._apertureValue;
        }

        /**
         * @en Camera shutter, controls the exposure parameter.
         * @zh 相机快门，影响相机的曝光参数。
         */
        set shutter(val) {
          this._shutter = val;
          this._shutterValue = SHUTTERS[this._shutter];
          this.updateExposure();
        }
        get shutter() {
          return this._shutter;
        }

        /**
         * @en Camera shutter value.
         * @zh 相机快门值。
         */
        get shutterValue() {
          return this._shutterValue;
        }

        /**
         * @en Camera ISO, controls the exposure parameter.
         * @zh 相机感光度，影响相机的曝光参数。
         */
        set iso(val) {
          this._iso = val;
          this._isoValue = ISOS[this._iso];
          this.updateExposure();
        }
        get iso() {
          return this._iso;
        }

        /**
         * @en Camera ISO value.
         * @zh 相机感光度值。
         */
        get isoValue() {
          return this._isoValue;
        }

        /**
         * @en The calculated exposure of the camera
         * @zh 相机的曝光参数
         */
        get exposure() {
          return this._exposure;
        }

        /**
         * @en Clearing flags of the camera, specifies which part of the framebuffer will be actually cleared every frame.
         * @zh 相机的缓冲清除标志位，指定帧缓冲的哪部分要每帧清除。
         */
        get clearFlag() {
          return this._clearFlag;
        }
        set clearFlag(flag) {
          this._clearFlag = flag;
        }

        /**
         * @en Clearing color of the camera.
         * @zh 相机的颜色缓冲默认值。
         */
        set clearColor(val) {
          this._clearColor.x = val.x;
          this._clearColor.y = val.y;
          this._clearColor.z = val.z;
          this._clearColor.w = val.w;
        }
        get clearColor() {
          return this._clearColor;
        }

        /**
         * @en Clearing depth of the camera.
         * @zh 相机的深度缓冲默认值。
         */
        get clearDepth() {
          return this._clearDepth;
        }
        set clearDepth(depth) {
          this._clearDepth = depth;
        }

        /**
         * @en Clearing stencil of the camera.
         * @zh 相机的模板缓冲默认值。
         */
        get clearStencil() {
          return this._clearStencil;
        }
        set clearStencil(stencil) {
          this._clearStencil = stencil;
        }

        /**
         * @en The projection type of the camera.
         * @zh 相机的投影类型。
         */
        set projectionType(val) {
          this._proj = val;
          this._isProjDirty = true;
        }
        get projectionType() {
          return this._proj;
        }

        /**
         * @en The aspect ratio of the camera
         * @zh 相机视图的长宽比
         */
        get aspect() {
          return this._aspect;
        }

        /**
         * @en The viewport height of the orthogonal type camera.
         * @zh 正交相机的视角高度。
         */
        set orthoHeight(val) {
          this._orthoHeight = val;
          this._isProjDirty = true;
        }
        get orthoHeight() {
          return this._orthoHeight;
        }

        /**
         * @en The axis on which the FOV would be fixed regardless of screen aspect changes.
         * @zh 指定视角的固定轴向，在此轴上不会跟随屏幕长宽比例变化。
         */
        set fovAxis(axis) {
          this._fovAxis = axis;
          this._isProjDirty = true;
        }
        get fovAxis() {
          return this._fovAxis;
        }

        /**
         * @en Field of view of the camera.
         * @zh 相机的视角大小。
         */
        set fov(fov) {
          this._fov = fov;
          this._isProjDirty = true;
        }
        get fov() {
          return this._fov;
        }

        /**
         * @en Near clipping distance of the camera, should be as large as possible within acceptable range.
         * @zh 相机的近裁剪距离，应在可接受范围内尽量取最大。
         */
        set nearClip(nearClip) {
          this._nearClip = nearClip;
          this._isProjDirty = true;
        }
        get nearClip() {
          return this._nearClip;
        }

        /**
         * @en Far clipping distance of the camera, should be as small as possible within acceptable range.
         * @zh 相机的远裁剪距离，应在可接受范围内尽量取最小。
         */
        set farClip(farClip) {
          this._farClip = farClip;
          this._isProjDirty = true;
        }
        get farClip() {
          return this._farClip;
        }

        /**
         * @en The viewport rect of the camera, pre-rotated (i.e. always in identity/portrait mode) if possible.
         * @zh 相机的视口矩形，如果设备允许的话，这个视口会永远保持竖屏状态，由渲染流程保障旋转的正确。
         */
        get viewport() {
          return this._viewport;
        }
        set viewport(val) {
          warnID(8302);
          this.setViewportInOrientedSpace(val);
        }

        /**
         * @en The view frustum of the camera
         * @zh 相机的视锥体
         */
        set frustum(val) {
          this._frustum = val;
        }
        get frustum() {
          return this._frustum;
        }

        /**
         * @en The view matrix of the camera
         * @zh 相机的视图矩阵
         */
        get matView() {
          return this._matView;
        }

        /**
         * @en The projection matrix of the camera
         * @zh 相机的投影矩阵
         */
        get matProj() {
          return this._matProj;
        }

        /**
         * @en The inverse of the projection matrix of the camera
         * @zh 相机的逆投影矩阵
         */
        get matProjInv() {
          return this._matProjInv;
        }

        /**
         * @en The view projection matrix of the camera
         * @zh 相机的视图投影矩阵
         */
        get matViewProj() {
          return this._matViewProj;
        }

        /**
         * @en The inverse of the view projection matrix of the camera
         * @zh 相机的逆视图投影矩阵
         */
        get matViewProjInv() {
          return this._matViewProjInv;
        }

        /** @engineInternal */
        get cameraId() {
          return this._cameraId;
        }

        /**
         * @en Whether the camera is fixed size or matching the window size.
         * @zh 相机是固定尺寸还是跟随屏幕尺寸
         */

        constructor(device) {
          this.isWindowSize = true;
          /**
           * @en Scale of the internal buffer size,
           * set to 1 to keep the same with the canvas size.
           * @zh 相机内部缓冲尺寸的缩放值, 1 为与 canvas 尺寸相同。
           */
          this.screenScale = 1;
          this.postProcess = null;
          this.usePostProcess = false;
          this.pipeline = '';
          this.pipelineSettings = null;
          this._scene = null;
          this._node = null;
          this._name = null;
          this._enabled = false;
          this._proj = -1;
          this._aspect = 1;
          this._orthoHeight = 10.0;
          this._fovAxis = CameraFOVAxis.VERTICAL;
          this._fov = toRadian(45);
          this._nearClip = 1.0;
          this._farClip = 1000.0;
          this._clearColor = new Color(0.2, 0.2, 0.2, 1);
          this._viewport = rect(0, 0, 1, 1);
          this._orientedViewport = rect(0, 0, 1, 1);
          this._curTransform = SurfaceTransform.IDENTITY;
          this._isProjDirty = true;
          this._matView = mat4();
          this._matProj = mat4();
          this._matProjInv = mat4();
          this._matViewProj = mat4();
          this._matViewProjInv = mat4();
          this._frustum = new geometry.Frustum();
          this._forward = v3();
          this._position = v3();
          this._priority = 0;
          this._aperture = CameraAperture.F16_0;
          this._shutter = CameraShutter.D125;
          this._shutterValue = 0.0;
          this._iso = CameraISO.ISO100;
          this._isoValue = 0.0;
          this._window = null;
          this._width = 1;
          this._height = 1;
          this._clearFlag = ClearFlagBit.NONE;
          this._clearDepth = 1.0;
          this._visibility = CAMERA_DEFAULT_MASK;
          this._exposure = 0;
          this._clearStencil = 0;
          this._geometryRenderer = null;
          this._windowId = 0;
          this._cameraType = CameraType.DEFAULT;
          this._trackingType = TrackingType.NO_TRACKING;
          this._usage = CameraUsage.GAME;
          this._cameraId = _cameraCount++;
          this._device = device;
          this._apertureValue = FSTOPS[this._aperture];
          this._shutterValue = SHUTTERS[this._shutter];
          this._isoValue = ISOS[this._iso];
          this._frustum.accurate = true;
          if (!correctionMatrices.length) {
            const ySign = device.capabilities.clipSpaceSignY;
            correctionMatrices[SurfaceTransform.IDENTITY] = new Mat4(1, 0, 0, 0, 0, ySign);
            correctionMatrices[SurfaceTransform.ROTATE_90] = new Mat4(0, 1, 0, 0, -ySign, 0);
            correctionMatrices[SurfaceTransform.ROTATE_180] = new Mat4(-1, 0, 0, 0, 0, -ySign);
            correctionMatrices[SurfaceTransform.ROTATE_270] = new Mat4(0, -1, 0, 0, ySign, 0);
          }
        }
        _updateAspect(oriented = true) {
          this._aspect = this.window.width * this._viewport.width / (this.window.height * this._viewport.height);
          // window size/viewport is pre-rotated, but aspect should be oriented to acquire the correct projection
          if (oriented) {
            const swapchain = this.window.swapchain;
            const orientation = swapchain && swapchain.surfaceTransform || SurfaceTransform.IDENTITY;
            if (orientation % 2) this._aspect = 1 / this._aspect;
          }
          this._isProjDirty = true;
        }

        /**
         * @en Initialize the camera, normally you shouldn't invoke this function, it's managed automatically.
         * @zh 初始化相机，开发者通常不应该使用这个方法，初始化流程是自动管理的。
         */
        initialize(info) {
          if (info.usage !== undefined) {
            this._usage = info.usage;
          } else {
            this.setDefaultUsage();
          }
          if (info.trackingType !== undefined) {
            this._trackingType = info.trackingType;
          }
          if (info.cameraType !== undefined) {
            this._cameraType = info.cameraType;
          }
          this.node = info.node;
          this._width = 1;
          this._height = 1;
          this.clearFlag = ClearFlagBit.NONE;
          this.clearDepth = 1.0;
          this.visibility = CAMERA_DEFAULT_MASK;
          this._name = info.name;
          this._proj = info.projection;
          this._priority = info.priority || 0;
          this._aspect = this.screenScale = 1;
          this.updateExposure();
          this.changeTargetWindow(info.window);
        }

        /**
         * @en Destroy the camera, you shouldn't invoke this function, it's managed by the render scene.
         * @zh 销毁相机，开发者不应该使用这个方法，销毁流程是由 RenderScene 管理的。
         */
        destroy() {
          var _this$_geometryRender;
          this._node = null;
          this.detachFromScene();
          if (this._window) {
            this._window.detachCamera(this);
            this.window = null;
          }
          this._name = null;
          (_this$_geometryRender = this._geometryRenderer) == null || _this$_geometryRender.destroy();
        }

        /**
         * @en Attach the camera to the given render scene so that it will be rendered in it.
         * @zh 将相机添加到相关的渲染场景中，以便可以被渲染器渲染。
         * @param scene @en The render scene @zh 渲染场景
         */
        attachToScene(scene) {
          this._enabled = true;
          this._scene = scene;
        }

        /**
         * @en Detach the camera from previously attached render scene. It will no longer be rendered.
         * @zh 将相机从之前设置的渲染场景移除，之后将不会再被渲染。
         */
        detachFromScene() {
          this._enabled = false;
          this._scene = null;
        }

        /**
         * @en Resize the view size of the camera.
         * @zh 重置相机视图尺寸
         * @param width The width of the view size
         * @param height The height of the view size
         */
        resize(width, height) {
          if (!this._window) return;
          this._width = width;
          this._height = height;
          this._aspect = width * this._viewport.width / (height * this._viewport.height);
          this._isProjDirty = true;
        }

        /**
         * @en Set a fixed size for the camera view.
         * @zh 设置固定相机视图尺寸
         * @param width The width of the view size
         * @param height The height of the view size
         */
        setFixedSize(width, height) {
          this._width = width;
          this._height = height;
          this._updateAspect();
          this.isWindowSize = false;
        }

        /**
         * Editor specific gizmo camera logic
         * @internal
         */
        syncCameraEditor(camera) {
          if (EDITOR) {
            this.position = camera.position;
            this.forward = camera.forward;
            this._matView = camera.matView;
            this._matProj = camera.matProj;
            this._matProjInv = camera.matProjInv;
            this._matViewProj = camera.matViewProj;
          }
        }

        /**
         * @en Update the camera's builtin matrixes
         * @zh 更新相机的视图、投影等矩阵
         * @param forceUpdate If force update, then dirty flag will be ignored
         */
        update(forceUpdate = false) {
          var _this$window;
          // for lazy eval situations like the in-editor preview
          if (!this._node) return;
          let viewProjDirty = false;
          const xr = globalThis.__globalXR;
          if (USE_XR) {
            if (xr && xr.isWebXR && xr.webXRWindowMap && xr.updateViewport) {
              const x = xr.webXRMatProjs ? 1 / xr.webXRMatProjs.length : 1;
              const wndXREye = xr.webXRWindowMap.get(this._window);
              this.setViewportInOrientedSpace(new Rect(x * wndXREye, 0, x, 1));
            }
          }
          const forward = this._forward;
          const matView = this._matView;
          const matProj = this._matProj;
          // view matrix
          if (this._node.hasChangedFlags || forceUpdate) {
            Mat4.invert(matView, this._node.worldMatrix);
            forward.x = -matView.m02;
            forward.y = -matView.m06;
            forward.z = -matView.m10;
            // Remove scale
            Mat4.multiply(matView, new Mat4().scale(this._node.worldScale), matView);
            this._node.getWorldPosition(this._position);
            viewProjDirty = true;
          }

          // projection matrix
          const swapchain = (_this$window = this.window) == null ? void 0 : _this$window.swapchain;
          const orientation = swapchain && swapchain.surfaceTransform || SurfaceTransform.IDENTITY;
          if (this._isProjDirty || this._curTransform !== orientation) {
            this._curTransform = orientation;
            const projectionSignY = this._device.capabilities.clipSpaceSignY;
            // Only for rendertexture processing
            if (this._proj === CameraProjection.PERSPECTIVE) {
              if (USE_XR && xr && xr.isWebXR && xr.webXRWindowMap && xr.webXRMatProjs) {
                const wndXREye = xr.webXRWindowMap.get(this._window);
                matProj.set(xr.webXRMatProjs[wndXREye]);
              } else {
                Mat4.perspective(matProj, this._fov, this._aspect, this._nearClip, this._farClip, this._fovAxis === CameraFOVAxis.VERTICAL, this._device.capabilities.clipSpaceMinZ, projectionSignY, orientation);
              }
            } else {
              const x = this._orthoHeight * this._aspect;
              const y = this._orthoHeight;
              Mat4.ortho(matProj, -x, x, -y, y, this._nearClip, this._farClip, this._device.capabilities.clipSpaceMinZ, projectionSignY, orientation);
            }
            Mat4.invert(this._matProjInv, matProj);
            viewProjDirty = true;
            this._isProjDirty = false;
          }

          // view-projection
          if (viewProjDirty) {
            Mat4.multiply(this._matViewProj, matProj, matView);
            Mat4.invert(this._matViewProjInv, this._matViewProj);
            this._frustum.update(this._matViewProj, this._matViewProjInv);
          }
        }
        get surfaceTransform() {
          return this._curTransform;
        }

        /**
         * @en Set the viewport in oriented space (equal to the actual screen rotation)
         * @zh 在目标朝向空间（实际屏幕朝向）内设置相机视口
         */
        setViewportInOrientedSpace(val) {
          var _this$window2;
          const {
            x,
            width,
            height
          } = val;
          const y = this._device.capabilities.screenSpaceSignY < 0 ? 1 - val.y - height : val.y;
          const swapchain = (_this$window2 = this.window) == null ? void 0 : _this$window2.swapchain;
          const orientation = swapchain && swapchain.surfaceTransform || SurfaceTransform.IDENTITY;
          switch (orientation) {
            case SurfaceTransform.ROTATE_90:
              this._viewport.x = 1 - y - height;
              this._viewport.y = x;
              this._viewport.width = height;
              this._viewport.height = width;
              break;
            case SurfaceTransform.ROTATE_180:
              this._viewport.x = 1 - x - width;
              this._viewport.y = 1 - y - height;
              this._viewport.width = width;
              this._viewport.height = height;
              break;
            case SurfaceTransform.ROTATE_270:
              this._viewport.x = y;
              this._viewport.y = 1 - x - width;
              this._viewport.width = height;
              this._viewport.height = width;
              break;
            case SurfaceTransform.IDENTITY:
              this._viewport.x = x;
              this._viewport.y = y;
              this._viewport.width = width;
              this._viewport.height = height;
              break;
            default:
          }
          this._orientedViewport.x = x;
          this._orientedViewport.y = y;
          this._orientedViewport.width = width;
          this._orientedViewport.height = height;
          this.resize(this.width, this.height);
        }

        /**
         * @en create geometry renderer for this camera
         * @zh 创建这个摄像机的几何体渲染器
         */
        initGeometryRenderer() {
          if (!this._geometryRenderer) {
            var _this$_geometryRender2;
            const GeometryRenderer = cclegacy.internal.GeometryRenderer;
            this._geometryRenderer = GeometryRenderer ? new GeometryRenderer() : null;
            (_this$_geometryRender2 = this._geometryRenderer) == null || _this$_geometryRender2.activate(this._device);
          }
        }

        /**
         * @en get geometry renderer of this camera
         * @zh 获取这个摄像机的几何体渲染器
         * @returns @en return the geometry renderer @zh 返回几何体渲染器
         */
        get geometryRenderer() {
          return this._geometryRenderer;
        }
        get cameraType() {
          return this._cameraType;
        }
        set cameraType(type) {
          this._cameraType = type;
        }
        get trackingType() {
          return this._trackingType;
        }
        set trackingType(type) {
          this._trackingType = type;
        }
        get cameraUsage() {
          return this._usage;
        }
        set cameraUsage(usage) {
          this._usage = usage;
        }

        /**
         * @en Change the target render window to another one
         * @zh 修改相机的目标渲染窗口
         * @param window The target render window, could be null
         */
        changeTargetWindow(window = null) {
          if (this._window) {
            this._window.detachCamera(this);
          }
          const win = window || cclegacy.director.root.mainWindow;
          if (win) {
            win.attachCamera(this);
            this.window = win;

            // window size is pre-rotated
            const swapchain = win.swapchain;
            const orientation = swapchain && swapchain.surfaceTransform || SurfaceTransform.IDENTITY;
            if (orientation % 2) this.resize(win.height, win.width);else this.resize(win.width, win.height);
          }
        }

        /**
         * @en Detach camera from the render window
         * @zh 将 camera 从渲染窗口移除
         */
        detachCamera() {
          if (this._window) {
            this._window.detachCamera(this);
          }
        }

        /**
         * @en Transform a screen position (in oriented space) to a world space ray
         * @zh 将一个屏幕空间（在实际朝向下）点转换到世界空间的射线
         * @param out the resulting ray
         * @param x the screen x of the position
         * @param y the screen y of the position
         * @returns the resulting ray
         */
        screenPointToRay(out, x, y) {
          if (!this._node) return null;
          const width = this.width;
          const height = this.height;
          const cx = this._orientedViewport.x * width;
          const cy = this._orientedViewport.y * height;
          const cw = this._orientedViewport.width * width;
          const ch = this._orientedViewport.height * height;
          const isProj = this._proj === CameraProjection.PERSPECTIVE;
          const ySign = this._device.capabilities.clipSpaceSignY;
          const preTransform = preTransforms[this._curTransform];
          Vec3.set(v_a, (x - cx) / cw * 2 - 1, (y - cy) / ch * 2 - 1, isProj ? 1 : -1);
          const {
            x: ox,
            y: oy
          } = v_a;
          v_a.x = ox * preTransform[0] + oy * preTransform[2] * ySign;
          v_a.y = ox * preTransform[1] + oy * preTransform[3] * ySign;
          Vec3.transformMat4(isProj ? v_a : out.o, v_a, this._matViewProjInv);
          if (isProj) {
            // camera origin
            this._node.getWorldPosition(v_b);
            geometry.Ray.fromPoints(out, v_b, v_a);
          } else {
            Vec3.transformQuat(out.d, Vec3.FORWARD, this._node.worldRotation);
          }
          return out;
        }

        /**
         * @en Transform a screen position (in oriented space) to world space
         * @zh 将一个屏幕空间（在实际朝向下）位置转换到世界空间
         * @param out the resulting vector
         * @param screenPos the screen position to be transformed
         * @returns the resulting vector
         */
        screenToWorld(out, screenPos) {
          const width = this.width;
          const height = this.height;
          const cx = this._orientedViewport.x * width;
          const cy = this._orientedViewport.y * height;
          const cw = this._orientedViewport.width * width;
          const ch = this._orientedViewport.height * height;
          const ySign = this._device.capabilities.clipSpaceSignY;
          const preTransform = preTransforms[this._curTransform];
          if (this._proj === CameraProjection.PERSPECTIVE) {
            // calculate screen pos in far clip plane
            Vec3.set(out, (screenPos.x - cx) / cw * 2 - 1, (screenPos.y - cy) / ch * 2 - 1, 1.0);

            // transform to world
            const {
              x,
              y
            } = out;
            out.x = x * preTransform[0] + y * preTransform[2] * ySign;
            out.y = x * preTransform[1] + y * preTransform[3] * ySign;
            Vec3.transformMat4(out, out, this._matViewProjInv);

            // lerp to depth z
            if (this._node) {
              this._node.getWorldPosition(v_a);
            }
            Vec3.lerp(out, v_a, out, lerp(this._nearClip / this._farClip, 1, screenPos.z));
          } else {
            Vec3.set(out, (screenPos.x - cx) / cw * 2 - 1, (screenPos.y - cy) / ch * 2 - 1, screenPos.z * 2 - 1);

            // transform to world
            const {
              x,
              y
            } = out;
            out.x = x * preTransform[0] + y * preTransform[2] * ySign;
            out.y = x * preTransform[1] + y * preTransform[3] * ySign;
            Vec3.transformMat4(out, out, this._matViewProjInv);
          }
          return out;
        }

        /**
         * @en Transform a world space position to screen space rendered by the camera
         * @zh 将一个世界空间位置转换到相机渲染后的屏幕空间
         * @param out the resulting vector
         * @param worldPos the world position to be transformed
         * @returns the resulting vector
         */
        worldToScreen(out, worldPos) {
          const ySign = this._device.capabilities.clipSpaceSignY;
          const preTransform = preTransforms[this._curTransform];
          Vec3.transformMat4(out, worldPos, this._matViewProj);
          const {
            x,
            y
          } = out;
          out.x = x * preTransform[0] + y * preTransform[2] * ySign;
          out.y = x * preTransform[1] + y * preTransform[3] * ySign;
          const width = this.width;
          const height = this.height;
          const cx = this._orientedViewport.x * width;
          const cy = this._orientedViewport.y * height;
          const cw = this._orientedViewport.width * width;
          const ch = this._orientedViewport.height * height;
          out.x = cx + (out.x + 1) * 0.5 * cw;
          out.y = cy + (out.y + 1) * 0.5 * ch;
          out.z = out.z * 0.5 + 0.5;
          return out;
        }

        /**
         * @en Transform a world space matrix to screen space rendered by the camera
         * @zh 将一个世界空间矩阵转换到相机渲染后的屏幕空间
         * @param out the resulting matrix
         * @param worldMatrix the world space matrix to be transformed
         * @param width framebuffer width
         * @param height framebuffer height
         * @returns the resulting matrix
         */
        worldMatrixToScreen(out, worldMatrix, width, height) {
          Mat4.multiply(out, this._matViewProj, worldMatrix);
          Mat4.multiply(out, correctionMatrices[this._curTransform], out);
          const halfWidth = width / 2;
          const halfHeight = height / 2;
          Mat4.identity(_tempMat1);
          Mat4.transform(_tempMat1, _tempMat1, Vec3.set(v_a, halfWidth, halfHeight, 0));
          Mat4.scale(_tempMat1, _tempMat1, Vec3.set(v_a, halfWidth, halfHeight, 1));
          Mat4.multiply(out, _tempMat1, out);
          return out;
        }

        /**
         * @en Calculate and set oblique view frustum projection matrix.
         * @zh 计算并设置斜视锥体投影矩阵
         * @param clipPlane clip plane in camera space
         */
        calculateObliqueMat(viewSpacePlane) {
          const clipFar = new Vec4(Math.sign(viewSpacePlane.x), Math.sign(viewSpacePlane.y), 1.0, 1.0);
          const viewFar = clipFar.transformMat4(this._matProjInv);
          const m4 = new Vec4(this._matProj.m03, this._matProj.m07, this._matProj.m11, this._matProj.m15);
          const scale = 2.0 / Vec4.dot(viewSpacePlane, viewFar);
          const newViewSpaceNearPlane = viewSpacePlane.multiplyScalar(scale);
          const m3 = newViewSpaceNearPlane.subtract(m4);
          this._matProj.m02 = m3.x;
          this._matProj.m06 = m3.y;
          this._matProj.m10 = m3.z;
          this._matProj.m14 = m3.w;
        }
        getClipSpaceMinz() {
          return this._device.capabilities.clipSpaceMinZ;
        }

        /**
         * @en Set exposure with actual value.
         * @zh 设置相机的曝光值
         * @param ev100
         */
        setExposure(ev100) {
          this._exposure = 0.833333 / 2.0 ** ev100;
        }
        updateExposure() {
          const ev100 = Math.log2(this._apertureValue * this._apertureValue / this._shutterValue * 100.0 / this._isoValue);
          this.setExposure(ev100);
        }
        setDefaultUsage() {
          if (EDITOR) {
            if (cclegacy.GAME_VIEW) {
              this._usage = CameraUsage.GAME_VIEW;
            } else {
              this._usage = CameraUsage.EDITOR;
            }
          } else {
            this._usage = CameraUsage.GAME;
          }
        }
      });
    }
  };
});