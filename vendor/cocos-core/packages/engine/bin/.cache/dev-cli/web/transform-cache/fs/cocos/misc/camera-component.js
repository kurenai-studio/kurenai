System.register("q-bundled:///fs/cocos/misc/camera-component.js", ["../../../virtual/internal%253Aconstants.js", "../core/data/decorators/index.js", "../asset/assets/render-texture.js", "../scene-graph/index.js", "../core/index.js", "../rendering/define.js", "../render-scene/scene/camera.js", "../scene-graph/layers.js", "../scene-graph/node-enum.js", "../gfx/index.js", "../rendering/post-process/components/post-process.js", "../core/data/class-decorator.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, ccclass, help, executeInEditMode, menu, tooltip, displayOrder, type, serializable, visible, range, rangeMin, RenderTexture, Component, Color, Rect, toRadian, Vec3, cclegacy, geometry, Enum, CAMERA_DEFAULT_MASK, SkyBoxFlagValue, CameraProjection, CameraFOVAxis, CameraAperture, CameraISO, CameraShutter, CameraType, TrackingType, Layers, TransformBit, ClearFlagBit, PostProcess, property, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _Camera, _temp_vec3_1, ProjectionType, FOVAxis, Aperture, Shutter, ISO, ClearFlag, CameraEvent, Camera;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      visible = _coreDataDecoratorsIndexJs.visible;
      range = _coreDataDecoratorsIndexJs.range;
      rangeMin = _coreDataDecoratorsIndexJs.rangeMin;
    }, function (_assetAssetsRenderTextureJs) {
      RenderTexture = _assetAssetsRenderTextureJs.RenderTexture;
    }, function (_sceneGraphIndexJs) {
      Component = _sceneGraphIndexJs.Component;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Rect = _coreIndexJs.Rect;
      toRadian = _coreIndexJs.toRadian;
      Vec3 = _coreIndexJs.Vec3;
      cclegacy = _coreIndexJs.cclegacy;
      geometry = _coreIndexJs.geometry;
      Enum = _coreIndexJs.Enum;
    }, function (_renderingDefineJs) {
      CAMERA_DEFAULT_MASK = _renderingDefineJs.CAMERA_DEFAULT_MASK;
    }, function (_renderSceneSceneCameraJs) {
      SkyBoxFlagValue = _renderSceneSceneCameraJs.SkyBoxFlagValue;
      CameraProjection = _renderSceneSceneCameraJs.CameraProjection;
      CameraFOVAxis = _renderSceneSceneCameraJs.CameraFOVAxis;
      CameraAperture = _renderSceneSceneCameraJs.CameraAperture;
      CameraISO = _renderSceneSceneCameraJs.CameraISO;
      CameraShutter = _renderSceneSceneCameraJs.CameraShutter;
      CameraType = _renderSceneSceneCameraJs.CameraType;
      TrackingType = _renderSceneSceneCameraJs.TrackingType;
    }, function (_sceneGraphLayersJs) {
      Layers = _sceneGraphLayersJs.Layers;
    }, function (_sceneGraphNodeEnumJs) {
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
    }, function (_renderingPostProcessComponentsPostProcessJs) {
      PostProcess = _renderingPostProcessComponentsPostProcessJs.PostProcess;
    }, function (_coreDataClassDecoratorJs) {
      property = _coreDataClassDecoratorJs.property;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos2d-x.org
      
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
      _temp_vec3_1 = new Vec3();
      ProjectionType = Enum(CameraProjection);
      FOVAxis = Enum(CameraFOVAxis);
      Aperture = Enum(CameraAperture);
      Shutter = Enum(CameraShutter);
      ISO = Enum(CameraISO);
      /**
       * @en Clear screen flag enumeration of the camera.
       * @zh 相机的清屏标记枚举。
       */
      _export("ClearFlag", ClearFlag = Enum({
        /**
         * @en Clear the screen with [[SceneGlobals.skybox]], will clear the depth and stencil buffer at the same time.
         * @zh 使用指定天空盒 [[SceneGlobals.skybox]] 清屏，会同时清理深度和蒙版缓冲。
         */
        SKYBOX: SkyBoxFlagValue.VALUE | ClearFlagBit.DEPTH_STENCIL,
        /**
         * @en Clear the screen with the given [[Camera.clearColor]], will clear the depth and stencil buffer at the same time.
         * @zh 使用指定的相机清屏颜色 [[Camera.clearColor]] 来清屏，会同时清理将深度和蒙版缓冲。
         */
        SOLID_COLOR: ClearFlagBit.ALL,
        /**
         * @en Only clear the depth and stencil buffer while keeping the color buffer intact. Often used in UI camera.
         * @zh 只清理深度和蒙版缓冲，同时保留颜色缓冲不变。常用于 UI 相机。
         */
        DEPTH_ONLY: ClearFlagBit.DEPTH_STENCIL,
        /**
         * @en Don't clear anything and continue rendering.
         * @zh 不清理任何内容就开始渲染，适合多 Camera 叠加渲染。
         */
        DONT_CLEAR: ClearFlagBit.NONE
      }));
      /**
       * @internal
       */
      _export("CameraEvent", CameraEvent = /*#__PURE__*/function (CameraEvent) {
        CameraEvent["TARGET_TEXTURE_CHANGE"] = "tex-change";
        return CameraEvent;
      }({}));
      /**
       * @en The Camera Component.
       * @zh 相机组件。
       */
      _export("Camera", Camera = (_dec = ccclass('cc.Camera'), _dec2 = help('i18n:cc.Camera'), _dec3 = menu('Rendering/Camera'), _dec4 = displayOrder(0), _dec5 = range([0, 65535, 1]), _dec6 = tooltip('i18n:camera.priority'), _dec7 = type(Layers.BitMask), _dec8 = displayOrder(1), _dec9 = tooltip('i18n:camera.visibility'), _dec0 = type(ClearFlag), _dec1 = displayOrder(2), _dec10 = tooltip('i18n:camera.clear_flags'), _dec11 = displayOrder(3), _dec12 = tooltip('i18n:camera.color'), _dec13 = displayOrder(4), _dec14 = tooltip('i18n:camera.depth'), _dec15 = displayOrder(5), _dec16 = tooltip('i18n:camera.stencil'), _dec17 = type(ProjectionType), _dec18 = displayOrder(6), _dec19 = tooltip('i18n:camera.projection'), _dec20 = type(FOVAxis), _dec21 = displayOrder(7), _dec22 = visible(function visible() {
        return this._projection === ProjectionType.PERSPECTIVE;
      }), _dec23 = tooltip('i18n:camera.fov_axis'), _dec24 = displayOrder(8), _dec25 = visible(function () {
        return this._projection === ProjectionType.PERSPECTIVE;
      }), _dec26 = range([1, 180, 1]), _dec27 = tooltip('i18n:camera.fov'), _dec28 = displayOrder(9), _dec29 = visible(function visible() {
        return this._projection === ProjectionType.ORTHO;
      }), _dec30 = rangeMin(1e-6), _dec31 = tooltip('i18n:camera.ortho_height'), _dec32 = displayOrder(10), _dec33 = rangeMin(0), _dec34 = tooltip('i18n:camera.near'), _dec35 = displayOrder(11), _dec36 = rangeMin(function () {
        return this._near + 0.001;
      }), _dec37 = tooltip('i18n:camera.far'), _dec38 = type(Aperture), _dec39 = displayOrder(12), _dec40 = tooltip('i18n:camera.aperture'), _dec41 = type(Shutter), _dec42 = displayOrder(13), _dec43 = tooltip('i18n:camera.shutter'), _dec44 = type(ISO), _dec45 = displayOrder(14), _dec46 = tooltip('i18n:camera.ISO'), _dec47 = displayOrder(15), _dec48 = tooltip('i18n:camera.rect'), _dec49 = type(RenderTexture), _dec50 = displayOrder(16), _dec51 = tooltip('i18n:camera.target_texture'), _dec52 = tooltip('i18n:camera.use_postprocess'), _dec53 = tooltip('i18n:camera.postprocess'), _dec54 = type(PostProcess), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = (_Camera = class Camera extends Component {
        constructor() {
          super();
          _initializerDefineProperty(this, "_projection", _descriptor, this);
          _initializerDefineProperty(this, "_priority", _descriptor2, this);
          _initializerDefineProperty(this, "_fov", _descriptor3, this);
          _initializerDefineProperty(this, "_fovAxis", _descriptor4, this);
          _initializerDefineProperty(this, "_orthoHeight", _descriptor5, this);
          _initializerDefineProperty(this, "_near", _descriptor6, this);
          _initializerDefineProperty(this, "_far", _descriptor7, this);
          _initializerDefineProperty(this, "_color", _descriptor8, this);
          _initializerDefineProperty(this, "_depth", _descriptor9, this);
          _initializerDefineProperty(this, "_stencil", _descriptor0, this);
          _initializerDefineProperty(this, "_clearFlags", _descriptor1, this);
          _initializerDefineProperty(this, "_rect", _descriptor10, this);
          _initializerDefineProperty(this, "_aperture", _descriptor11, this);
          _initializerDefineProperty(this, "_shutter", _descriptor12, this);
          _initializerDefineProperty(this, "_iso", _descriptor13, this);
          _initializerDefineProperty(this, "_screenScale", _descriptor14, this);
          _initializerDefineProperty(this, "_visibility", _descriptor15, this);
          _initializerDefineProperty(this, "_targetTexture", _descriptor16, this);
          _initializerDefineProperty(this, "_postProcess", _descriptor17, this);
          _initializerDefineProperty(this, "_usePostProcess", _descriptor18, this);
          this._camera = null;
          this._inEditorMode = false;
          this._flows = undefined;
          _initializerDefineProperty(this, "_cameraType", _descriptor19, this);
          _initializerDefineProperty(this, "_trackingType", _descriptor20, this);
        }

        /**
         * @en The render camera representation.
         * @zh 渲染场景中的相机对象。
         */
        get camera() {
          return this._camera;
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
          if (this._camera) {
            this._camera.priority = val;
          }
        }

        /**
         * @en Visibility mask, declaring a set of node layers that will be visible to this camera.
         * @zh 可见性掩码，声明在当前相机中可见的节点层级集合。
         */
        get visibility() {
          return this._visibility;
        }
        set visibility(val) {
          this._visibility = val;
          if (this._camera) {
            this._camera.visibility = val;
          }
        }

        /**
         * @en Clearing flags of the camera, specifies which part of the framebuffer will be actually cleared every frame.
         * @zh 相机的缓冲清除标志位，指定帧缓冲的哪部分要每帧清除。
         */
        get clearFlags() {
          return this._clearFlags;
        }
        set clearFlags(val) {
          this._clearFlags = val;
          if (this._camera) {
            this._camera.clearFlag = val;
          }
        }

        /**
         * @en Clearing color of the camera.
         * @zh 相机的颜色缓冲默认值。
         */
        get clearColor() {
          return this._color;
        }
        set clearColor(val) {
          this._color.set(val);
          if (this._camera) {
            this._camera.clearColor = this._color;
          }
        }

        /**
         * @en Clearing depth of the camera.
         * @zh 相机的深度缓冲默认值。
         */
        get clearDepth() {
          return this._depth;
        }
        set clearDepth(val) {
          this._depth = val;
          if (this._camera) {
            this._camera.clearDepth = val;
          }
        }

        /**
         * @en Clearing stencil of the camera.
         * @zh 相机的模板缓冲默认值。
         */
        get clearStencil() {
          return this._stencil;
        }
        set clearStencil(val) {
          this._stencil = val;
          if (this._camera) {
            this._camera.clearStencil = val;
          }
        }

        /**
         * @en Projection type of the camera.
         * @zh 相机的投影类型。
         */
        get projection() {
          return this._projection;
        }
        set projection(val) {
          this._projection = val;
          if (this._camera) {
            this._camera.projectionType = val;
          }
        }

        /**
         * @en The axis on which the FOV would be fixed regardless of screen aspect changes.
         * @zh 指定视角的固定轴向，在此轴上不会跟随屏幕长宽比例变化。
         */
        get fovAxis() {
          return this._fovAxis;
        }
        set fovAxis(val) {
          if (val === this._fovAxis) {
            return;
          }
          this._fovAxis = val;
          if (this._camera) {
            this._camera.fovAxis = val;
            if (val === CameraFOVAxis.VERTICAL) {
              this.fov = this._fov * this._camera.aspect;
            } else {
              this.fov = this._fov / this._camera.aspect;
            }
          }
        }

        /**
         * @en Field of view of the camera.
         * @zh 相机的视角大小。
         */
        get fov() {
          return this._fov;
        }
        set fov(val) {
          this._fov = val;
          if (this._camera) {
            this._camera.fov = toRadian(val);
          }
        }

        /**
         * @en Viewport height in orthographic mode.
         * @zh 正交模式下的相机视角高度。
         */
        get orthoHeight() {
          return this._orthoHeight;
        }
        set orthoHeight(val) {
          this._orthoHeight = val;
          if (this._camera) {
            this._camera.orthoHeight = val;
          }
        }

        /**
         * @en Near clipping distance of the camera, should be as large as possible within acceptable range.
         * @zh 相机的近裁剪距离，应在可接受范围内尽量取最大。
         */
        get near() {
          return this._near;
        }
        set near(val) {
          this._near = val;
          if (this._camera) {
            this._camera.nearClip = val;
          }
        }

        /**
         * @en Far clipping distance of the camera, should be as small as possible within acceptable range.
         * @zh 相机的远裁剪距离，应在可接受范围内尽量取最小。
         */
        get far() {
          return this._far;
        }
        set far(val) {
          this._far = val;
          if (this._camera) {
            this._camera.farClip = val;
          }
        }

        /**
         * @en Camera aperture, controls the exposure parameter.
         * @zh 相机光圈，影响相机的曝光参数。
         */
        get aperture() {
          return this._aperture;
        }
        set aperture(val) {
          this._aperture = val;
          if (this._camera) {
            this._camera.aperture = val;
          }
        }

        /**
         * @en Camera shutter, controls the exposure parameter.
         * @zh 相机快门，影响相机的曝光参数。
         */
        get shutter() {
          return this._shutter;
        }
        set shutter(val) {
          this._shutter = val;
          if (this._camera) {
            this._camera.shutter = val;
          }
        }

        /**
         * @en Camera ISO, controls the exposure parameter.
         * @zh 相机感光度，影响相机的曝光参数。
         */
        get iso() {
          return this._iso;
        }
        set iso(val) {
          this._iso = val;
          if (this._camera) {
            this._camera.iso = val;
          }
        }

        /**
         * @en Screen viewport of the camera wrt. the sceen size.
         * @zh 此相机最终渲染到屏幕上的视口位置和大小。
         */
        get rect() {
          return this._rect;
        }
        set rect(val) {
          this._rect = val;
          if (this._camera) {
            this._camera.setViewportInOrientedSpace(val);
          }
        }

        /**
         * @en Output render texture of the camera. Default to null, which outputs directly to screen.
         * @zh 指定此相机的渲染输出目标贴图，默认为空，直接渲染到屏幕。
         */
        get targetTexture() {
          return this._targetTexture;
        }
        set targetTexture(value) {
          if (this._targetTexture === value) {
            return;
          }
          const old = this._targetTexture;
          this._targetTexture = value;
          this._checkTargetTextureEvent(old);
          this._updateTargetTexture();
          if (!value && this._camera) {
            this._camera.changeTargetWindow(EDITOR_NOT_IN_PREVIEW ? cclegacy.director.root.tempWindow : null);
            this._camera.isWindowSize = true;
          }
          this.node.emit(CameraEvent.TARGET_TEXTURE_CHANGE, this);
        }
        get usePostProcess() {
          return this._usePostProcess;
        }
        set usePostProcess(v) {
          this._usePostProcess = v;
          if (this._camera) {
            this._camera.usePostProcess = v;
          }
        }
        get postProcess() {
          return this._postProcess;
        }
        set postProcess(v) {
          this._postProcess = v;
          if (this._camera) {
            this._camera.postProcess = v;
          }
        }

        /**
         * @en Scale of the internal buffer size,
         * set to 1 to keep the same with the canvas size.
         * @zh 相机内部缓冲尺寸的缩放值, 1 为与 canvas 尺寸相同。
         */
        get screenScale() {
          return this._screenScale;
        }
        set screenScale(val) {
          this._screenScale = val;
          if (this._camera) {
            this._camera.screenScale = val;
          }
        }

        /**
         * @internal
         */
        get inEditorMode() {
          return this._inEditorMode;
        }
        set inEditorMode(value) {
          this._inEditorMode = value;
          if (this._camera) {
            const root = cclegacy.director.root;
            this._camera.changeTargetWindow(value ? root && root.mainWindow : root && root.tempWindow);
          }
        }

        /**
         * @internal
         */
        get cameraType() {
          return this._cameraType;
        }
        set cameraType(val) {
          if (this._cameraType === val) {
            return;
          }
          this._cameraType = val;
          if (this.camera) {
            this.camera.cameraType = val;
          }
        }

        /**
         * @internal
         */
        get trackingType() {
          return this._trackingType;
        }
        set trackingType(val) {
          if (this._trackingType === val) {
            return;
          }
          this._trackingType = val;
          if (this.camera) {
            this.camera.trackingType = val;
          }
        }
        onLoad() {
          this._createCamera();
        }
        onEnable() {
          this.node.hasChangedFlags |= TransformBit.POSITION; // trigger camera matrix update
          if (this._camera) {
            this._attachToScene();
          }
        }
        onDisable() {
          if (this._camera) {
            this._detachFromScene();
          }
        }
        onDestroy() {
          if (this._camera) {
            this._camera.destroy();
            this._camera = null;
          }
          if (this._targetTexture) {
            this._targetTexture.off('resize');
          }
        }

        /**
         * @en Convert a screen space (left-bottom origin) point to a ray.
         * @zh 将一个屏幕空间（左下角为原点）坐标转换为射线。
         * @param x The x axis position on screen.
         * @param y The y axis position on screen.
         * @param out The output ray object.
         * @returns Return the output ray object.
         */
        screenPointToRay(x, y, out) {
          if (!out) {
            out = geometry.Ray.create();
          }
          if (this._camera) {
            this._camera.screenPointToRay(out, x, y);
          }
          return out;
        }

        /**
         * @en Convert a world position to a screen space (left-bottom origin) position.
         * @zh 将一个世界空间坐标转换为屏幕空间（左下角为原点）坐标。
         * @param worldPos The position in world space coordinates
         * @param out The output position in screen space coordinates.
         * @returns Return the output position object.
         */
        worldToScreen(worldPos, out) {
          if (!out) {
            out = new Vec3();
          }
          if (this._camera) {
            this._camera.worldToScreen(out, worldPos);
          }
          return out;
        }

        /**
         * @en Convert a screen space (left-bottom origin) position to a world space position.
         * @zh 将一个屏幕空间（左下角为原点）转换为世界空间坐标。
         * @param screenPos The position in screen space coordinates
         * @param out The output position in world space coordinates
         * @returns Return the output position object.
         */
        screenToWorld(screenPos, out) {
          if (!out) {
            out = this.node.getWorldPosition();
          }
          if (this._camera) {
            this._camera.screenToWorld(out, screenPos);
          }
          return out;
        }

        /**
         * @en Convert a 3D world position to the local coordinates system of the given UI node.
         * The converted position will be related to the given UI node under local space.
         * @zh 将一个 3D 空间世界坐标转换到指定的 UI 本地节点坐标系下。转换后的位置是指定 UI 节点坐标系下的局部偏移。
         * @param wpos @en The world position to convert @zh 需要转换的世界坐标
         * @param uiNode @en The UI node coordinates in which the world position will be convert to @zh 用于同步位置的 UI 节点
         * @param out @en Return the corresponding position of the given world position in the UI node's local coordinates @zh 返回传入的世界坐标在 UI 节点本地坐标系下的局部坐标
         *
         * @example
         * ```ts
         * this.convertToUINode(target.worldPosition, uiNode.parent, out);
         * uiNode.position = out;
         * ```
         */
        convertToUINode(wpos, uiNode, out) {
          if (!out) {
            out = new Vec3();
          }
          if (!this._camera) {
            return out;
          }
          this.worldToScreen(wpos, _temp_vec3_1);
          const cmp = uiNode.getComponent('cc.UITransform');
          const view = cclegacy.view;
          const designSize = view.getVisibleSize();
          const xoffset = _temp_vec3_1.x - this._camera.width * 0.5;
          const yoffset = _temp_vec3_1.y - this._camera.height * 0.5;
          _temp_vec3_1.x = xoffset / view.getScaleX() + designSize.width * 0.5;
          _temp_vec3_1.y = yoffset / view.getScaleY() + designSize.height * 0.5;
          if (cmp) {
            cmp.convertToNodeSpaceAR(_temp_vec3_1, out);
          }
          return out;
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _createCamera() {
          if (!this._camera) {
            this._camera = cclegacy.director.root.createCamera();
            this._camera.initialize({
              name: this.node.name,
              node: this.node,
              projection: this._projection,
              window: this._inEditorMode ? cclegacy.director.root && cclegacy.director.root.mainWindow : cclegacy.director.root && cclegacy.director.root.tempWindow,
              priority: this._priority,
              cameraType: this.cameraType,
              trackingType: this.trackingType
            });
            this._camera.setViewportInOrientedSpace(this._rect);
            this._camera.fovAxis = this._fovAxis;
            this._camera.fov = toRadian(this._fov);
            this._camera.orthoHeight = this._orthoHeight;
            this._camera.nearClip = this._near;
            this._camera.farClip = this._far;
            this._camera.clearColor = this._color;
            this._camera.clearDepth = this._depth;
            this._camera.clearStencil = this._stencil;
            this._camera.clearFlag = this._clearFlags;
            this._camera.visibility = this._visibility;
            this._camera.aperture = this._aperture;
            this._camera.shutter = this._shutter;
            this._camera.iso = this._iso;
            this._camera.postProcess = this._postProcess;
            this._camera.usePostProcess = this._usePostProcess;
            this._camera.update();
          }
          this._updateTargetTexture();
        }
        _attachToScene() {
          if (!this.node.scene || !this._camera) {
            return;
          }
          if (this._camera && this._camera.scene) {
            this._camera.scene.removeCamera(this._camera);
          }
          const rs = this._getRenderScene();
          rs.addCamera(this._camera);
        }
        _detachFromScene() {
          if (this._camera && this._camera.scene) {
            this._camera.scene.removeCamera(this._camera);
          }
        }
        _checkTargetTextureEvent(old) {
          if (old) {
            old.off('resize');
          }
          if (this._targetTexture) {
            this._targetTexture.on('resize', window => {
              if (this._camera) {
                this._camera.setFixedSize(window.width, window.height);
              }
            }, this);
          }
        }
        _updateTargetTexture() {
          if (!this._camera) {
            return;
          }
          if (this._targetTexture) {
            const window = this._targetTexture.window;
            this._camera.changeTargetWindow(window);
            this._camera.setFixedSize(window.width, window.height);
          }
        }
      }, _Camera.ProjectionType = ProjectionType, _Camera.FOVAxis = FOVAxis, _Camera.ClearFlag = ClearFlag, _Camera.Aperture = Aperture, _Camera.Shutter = Shutter, _Camera.ISO = ISO, _Camera.TARGET_TEXTURE_CHANGE = CameraEvent.TARGET_TEXTURE_CHANGE, _Camera), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_projection", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ProjectionType.PERSPECTIVE;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_priority", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_fov", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 45;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_fovAxis", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return FOVAxis.VERTICAL;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_orthoHeight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_near", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_far", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1000;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_color", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color('#333333');
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_depth", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_stencil", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_clearFlags", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ClearFlag.SOLID_COLOR;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_rect", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Rect(0, 0, 1, 1);
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_aperture", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Aperture.F16_0;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "_shutter", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Shutter.D125;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_iso", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ISO.ISO100;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "_screenScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "_visibility", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CAMERA_DEFAULT_MASK;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "_targetTexture", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "_postProcess", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "_usePostProcess", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "_cameraType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CameraType.DEFAULT;
        }
      }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "_trackingType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return TrackingType.NO_TRACKING;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "priority", [_dec4, _dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "priority"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "visibility", [_dec7, _dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "visibility"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearFlags", [_dec0, _dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "clearFlags"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearColor", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "clearColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearDepth", [_dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "clearDepth"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearStencil", [_dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "clearStencil"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "projection", [_dec17, _dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "projection"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fovAxis", [_dec20, _dec21, _dec22, _dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "fovAxis"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fov", [_dec24, _dec25, _dec26, _dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "fov"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "orthoHeight", [_dec28, _dec29, _dec30, _dec31], Object.getOwnPropertyDescriptor(_class2.prototype, "orthoHeight"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "near", [_dec32, _dec33, _dec34], Object.getOwnPropertyDescriptor(_class2.prototype, "near"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "far", [_dec35, _dec36, _dec37], Object.getOwnPropertyDescriptor(_class2.prototype, "far"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "aperture", [_dec38, _dec39, _dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "aperture"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shutter", [_dec41, _dec42, _dec43], Object.getOwnPropertyDescriptor(_class2.prototype, "shutter"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "iso", [_dec44, _dec45, _dec46], Object.getOwnPropertyDescriptor(_class2.prototype, "iso"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "rect", [_dec47, _dec48], Object.getOwnPropertyDescriptor(_class2.prototype, "rect"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "targetTexture", [_dec49, _dec50, _dec51], Object.getOwnPropertyDescriptor(_class2.prototype, "targetTexture"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "usePostProcess", [_dec52, property], Object.getOwnPropertyDescriptor(_class2.prototype, "usePostProcess"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "postProcess", [_dec53, _dec54], Object.getOwnPropertyDescriptor(_class2.prototype, "postProcess"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
      cclegacy.Camera = Camera;
    }
  };
});