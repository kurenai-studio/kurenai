System.register("q-bundled:///fs/cocos/3d/reflection-probe/reflection-probe-component.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../asset/assets/index.js", "../../render-scene/index.js", "../../rendering/define.js", "./reflection-probe-manager.js", "../../scene-graph/component.js", "../../scene-graph/layers.js", "../../misc/camera-component.js", "../../scene-graph/index.js", "../../render-scene/scene/reflection-probe.js", "../../physics/utils/util.js"], function (_export, _context) {
  "use strict";

  var ccclass, executeInEditMode, help, menu, playOnFocus, serializable, tooltip, type, visible, EDITOR, EDITOR_NOT_IN_PREVIEW, CCBoolean, Color, screen, Enum, Vec3, warn, CCObjectFlags, v3, TextureCube, scene, CAMERA_DEFAULT_MASK, ReflectionProbeManager, Component, Layers, Camera, Node, TransformBit, ProbeClearFlag, ProbeType, absolute, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _ReflectionProbe, tmpVec3, ProbeResolution, ReflectionProbe;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      playOnFocus = _coreDataDecoratorsIndexJs.playOnFocus;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_coreIndexJs) {
      CCBoolean = _coreIndexJs.CCBoolean;
      Color = _coreIndexJs.Color;
      screen = _coreIndexJs.screen;
      Enum = _coreIndexJs.Enum;
      Vec3 = _coreIndexJs.Vec3;
      warn = _coreIndexJs.warn;
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      v3 = _coreIndexJs.v3;
    }, function (_assetAssetsIndexJs) {
      TextureCube = _assetAssetsIndexJs.TextureCube;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_renderingDefineJs) {
      CAMERA_DEFAULT_MASK = _renderingDefineJs.CAMERA_DEFAULT_MASK;
    }, function (_reflectionProbeManagerJs) {
      ReflectionProbeManager = _reflectionProbeManagerJs.ReflectionProbeManager;
    }, function (_sceneGraphComponentJs) {
      Component = _sceneGraphComponentJs.Component;
    }, function (_sceneGraphLayersJs) {
      Layers = _sceneGraphLayersJs.Layers;
    }, function (_miscCameraComponentJs) {
      Camera = _miscCameraComponentJs.Camera;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
      TransformBit = _sceneGraphIndexJs.TransformBit;
    }, function (_renderSceneSceneReflectionProbeJs) {
      ProbeClearFlag = _renderSceneSceneReflectionProbeJs.ProbeClearFlag;
      ProbeType = _renderSceneSceneReflectionProbeJs.ProbeType;
    }, function (_physicsUtilsUtilJs) {
      absolute = _physicsUtilsUtilJs.absolute;
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
      tmpVec3 = v3();
      _export("ProbeResolution", ProbeResolution = /*#__PURE__*/function (ProbeResolution) {
        /**
         * @zh 分辨率 256 * 256。
         * @en renderTexture resolution 256 * 256.
         * @readonly
         */
        ProbeResolution[ProbeResolution["Low_256x256"] = 256] = "Low_256x256";
        /**
          * @zh 分辨率 512 * 512。
          * @en renderTexture resolution 512 * 512.
          * @readonly
          */
        ProbeResolution[ProbeResolution["Medium_512x512"] = 512] = "Medium_512x512";
        /**
          * @zh 分辨率 768 * 768
          * @en renderTexture resolution 768 * 768.
          * @readonly
          */
        ProbeResolution[ProbeResolution["High_768x768"] = 768] = "High_768x768";
        return ProbeResolution;
      }({}));
      _export("ReflectionProbe", ReflectionProbe = (_dec = ccclass('cc.ReflectionProbe'), _dec2 = menu('Rendering/ReflectionProbe'), _dec3 = help('i18n:cc.ReflectionProbe'), _dec4 = type(Vec3), _dec5 = type(Enum(ProbeType)), _dec6 = visible(function () {
        return this.probeType === ProbeType.CUBE;
      }), _dec7 = type(Enum(ProbeResolution)), _dec8 = type(Enum(ProbeClearFlag)), _dec9 = visible(function () {
        return this.probeType === ProbeType.CUBE;
      }), _dec0 = visible(function () {
        return this._clearFlag === ProbeClearFlag.SOLID_COLOR && this.probeType === ProbeType.CUBE;
      }), _dec1 = type(Color), _dec10 = type(Layers.BitMask), _dec11 = tooltip('i18n:camera.visibility'), _dec12 = visible(function () {
        return this.probeType === ProbeType.PLANAR;
      }), _dec13 = type(Camera), _dec14 = visible(function () {
        return this.probeType === ProbeType.CUBE;
      }), _dec15 = type(CCBoolean), _dec16 = tooltip('i18n:reflection_probe.fastBake'), _dec17 = type(TextureCube), _dec18 = visible(false), _dec(_class = _dec2(_class = executeInEditMode(_class = playOnFocus(_class = _dec3(_class = (_class2 = (_ReflectionProbe = class ReflectionProbe extends Component {
        constructor(...args) {
          super(...args);
          this._lastSize = v3();
          _initializerDefineProperty(this, "_resolution", _descriptor, this);
          _initializerDefineProperty(this, "_clearFlag", _descriptor2, this);
          _initializerDefineProperty(this, "_backgroundColor", _descriptor3, this);
          _initializerDefineProperty(this, "_visibility", _descriptor4, this);
          _initializerDefineProperty(this, "_probeType", _descriptor5, this);
          _initializerDefineProperty(this, "_cubemap", _descriptor6, this);
          _initializerDefineProperty(this, "_size", _descriptor7, this);
          _initializerDefineProperty(this, "_sourceCamera", _descriptor8, this);
          _initializerDefineProperty(this, "_probeId", _descriptor9, this);
          _initializerDefineProperty(this, "_fastBake", _descriptor0, this);
          this._probe = null;
          this._previewSphere = null;
          this._previewPlane = null;
          this._sourceCameraPos = v3();
          this._position = v3();
        }
        /**
         * @en
         * Gets or sets the size of the box
         * @zh
         * 获取或设置包围盒的大小。
         */
        set size(value) {
          this._size.set(value);
          absolute(this._size);
          this.probe.size = this._size;
          if (this.probe) {
            this.probe.updateBoundingBox();
            ReflectionProbeManager.probeManager.onUpdateProbes();
            ReflectionProbeManager.probeManager.updateProbeData();
            ReflectionProbeManager.probeManager.updateProbeOfModels();
          }
        }
        get size() {
          return this._size;
        }

        /**
         * @en Environment reflection or plane reflection.
         * @zh 设置探针类型，环境反射或者平面反射
         */
        set probeType(value) {
          this.probe.probeType = value;
          if (value !== this._probeType) {
            const lastSize = this._size.clone();
            const lastSizeIsNoExist = Vec3.equals(this._lastSize, Vec3.ZERO);
            this._probeType = value;
            if (this._probeType === ProbeType.CUBE) {
              if (lastSizeIsNoExist) {
                this._size.set(ReflectionProbe.DEFAULT_CUBE_SIZE);
              }
              this.probe.switchProbeType(value, null);
              if (EDITOR) {
                this._objFlags |= CCObjectFlags.IsRotationLocked;
              }
              ReflectionProbeManager.probeManager.clearPlanarReflectionMap(this.probe);
            } else {
              if (lastSizeIsNoExist) {
                this._size.set(ReflectionProbe.DEFAULT_PLANER_SIZE);
              }
              if (EDITOR && this._objFlags & CCObjectFlags.IsRotationLocked) {
                this._objFlags ^= CCObjectFlags.IsRotationLocked;
              }
              if (!this._sourceCamera) {
                warn('the reflection camera is invalid, please set the reflection camera');
              } else {
                this.probe.switchProbeType(value, this._sourceCamera.camera);
              }
            }
            if (!lastSizeIsNoExist) {
              this._size.set(this._lastSize);
            }
            this._lastSize.set(lastSize);
            this.size = this._size;
          }
        }
        get probeType() {
          return this._probeType;
        }

        /**
         * @en set render texture size
         * @zh 设置渲染纹理大小
         */
        set resolution(value) {
          this._resolution = value;
          this.probe.resolution = value;
        }
        get resolution() {
          return this._resolution;
        }

        /**
         * @en Clearing flags of the camera, specifies which part of the framebuffer will be actually cleared every frame.
         * @zh 相机的缓冲清除标志位，指定帧缓冲的哪部分要每帧清除。
         */
        set clearFlag(value) {
          this._clearFlag = value;
          this.probe.clearFlag = this._clearFlag;
        }
        get clearFlag() {
          return this._clearFlag;
        }

        /**
         * @en Clearing color of the camera.
         * @zh 相机的颜色缓冲默认值。
         */
        set backgroundColor(val) {
          this._backgroundColor = val;
          this.probe.backgroundColor = this._backgroundColor;
        }
        get backgroundColor() {
          return this._backgroundColor;
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
          this.probe.visibility = this._visibility;
        }

        /**
         * @en The camera to render planar reflections, specified by the user
         * @zh 需要渲染平面反射的相机，由用户指定
         */
        set sourceCamera(camera) {
          this._sourceCamera = camera;
          if (camera) {
            this.visibility = camera.visibility;
            this.clearFlag = camera.clearFlags;
            this.backgroundColor = camera.clearColor;
            if (this.probeType === ProbeType.PLANAR) {
              this.probe.switchProbeType(this.probeType, camera.camera);
            }
          }
        }
        get sourceCamera() {
          return this._sourceCamera;
        }

        /**
         * @en fast bake no convolution.
         * @zh 快速烘焙不会进行卷积。
         */
        get fastBake() {
          return this._fastBake;
        }
        set fastBake(val) {
          this._fastBake = val;
        }
        set cubemap(val) {
          this._cubemap = val;
          this.probe.cubemap = val;
          ReflectionProbeManager.probeManager.onUpdateProbes();
        }
        get cubemap() {
          return this._cubemap;
        }
        get probe() {
          return this._probe;
        }

        /**
         * @en Reflection probe cube mode preview sphere
         * @zh 反射探针cube模式的预览小球
         */
        set previewSphere(val) {
          this._previewSphere = val;
          if (this.probe) {
            this.probe.previewSphere = val;
            if (this._previewSphere) {
              ReflectionProbeManager.probeManager.updatePreviewSphere(this.probe);
            }
          }
        }
        get previewSphere() {
          return this._previewSphere;
        }

        /**
         * @en Reflection probe planar mode preview plane
         * @zh 反射探针Planar模式的预览平面
         */
        set previewPlane(val) {
          this._previewPlane = val;
          if (this.probe) {
            this.probe.previewPlane = val;
            if (this._previewPlane) {
              ReflectionProbeManager.probeManager.updatePreviewPlane(this.probe);
            }
          }
        }
        get previewPlane() {
          return this._previewPlane;
        }
        onLoad() {
          this._createProbe();
          if (EDITOR) {
            ReflectionProbeManager.probeManager.registerEvent();
          }
        }
        _handleResize$() {
          if (this.probe && this.sourceCamera && this.probeType === ProbeType.PLANAR) {
            this.probe.renderPlanarReflection(this.sourceCamera.camera);
          }
        }
        onEnable() {
          if (this._probe) {
            const probe = ReflectionProbeManager.probeManager.getProbeById(this._probeId);
            if (probe !== null && probe !== this._probe) {
              this._probeId = ReflectionProbeManager.probeManager.getNewReflectionProbeId();
              this._probe.updateProbeId(this._probeId);
            }
            ReflectionProbeManager.probeManager.register(this._probe);
            ReflectionProbeManager.probeManager.onUpdateProbes();
            this._probe.enable();
          }
          screen.on('window-resize', this._handleResize$, this);
          screen.on('fullscreen-change', this._handleResize$, this);
        }
        onDisable() {
          if (this._probe) {
            ReflectionProbeManager.probeManager.unregister(this._probe);
            this._probe.disable();
          }
          screen.off('window-resize', this._handleResize$, this);
          screen.off('fullscreen-change', this._handleResize$, this);
        }
        start() {
          if (this._sourceCamera && this.probeType === ProbeType.PLANAR) {
            this.probe.renderPlanarReflection(this.sourceCamera.camera);
            ReflectionProbeManager.probeManager.filterModelsForPlanarReflection();
          }
          ReflectionProbeManager.probeManager.updateProbeData();
          this.node.getWorldPosition(this._position);
        }
        onDestroy() {
          if (this.probe) {
            this.probe.destroy();
          }
        }
        update(dt) {
          if (!this.probe) return;
          if (EDITOR_NOT_IN_PREVIEW) {
            if (this.probeType === ProbeType.PLANAR) {
              var _this$node$scene$rend;
              const cameraLst = (_this$node$scene$rend = this.node.scene.renderScene) == null ? void 0 : _this$node$scene$rend.cameras;
              if (cameraLst !== undefined) {
                for (let i = 0; i < cameraLst.length; ++i) {
                  const camera = cameraLst[i];
                  if (camera.name === 'Editor Camera') {
                    this.probe.renderPlanarReflection(camera);
                    break;
                  }
                }
              }
            }
          }
          if (!EDITOR_NOT_IN_PREVIEW && this.probeType === ProbeType.PLANAR && this.sourceCamera) {
            if (this.sourceCamera.node.hasChangedFlags & TransformBit.TRS || !this._sourceCameraPos.equals(this.sourceCamera.node.getWorldPosition())) {
              this._sourceCameraPos.set(this.sourceCamera.node.getWorldPosition());
              this.probe.renderPlanarReflection(this.sourceCamera.camera);
            }
          }
          if (this.node.hasChangedFlags & TransformBit.POSITION) {
            this.probe.updateBoundingBox();
            ReflectionProbeManager.probeManager.onUpdateProbes();
            ReflectionProbeManager.probeManager.updateProbeData();
          }

          //update probe info for realtime
          if (!EDITOR) {
            this.node.getWorldPosition(tmpVec3);
            if (!this._position.equals(tmpVec3)) {
              this._position.set(tmpVec3);
              this.probe.updateBoundingBox();
              ReflectionProbeManager.probeManager.updateProbeData();
              ReflectionProbeManager.probeManager.updateProbeOfModels();
            }
          }
        }

        /**
         * @en Clear the baked cubemap.
         * @zh 清除烘焙的cubemap
         */
        clearBakedCubemap() {
          this.cubemap = null;
          ReflectionProbeManager.probeManager.updateBakedCubemap(this.probe);
          ReflectionProbeManager.probeManager.updatePreviewSphere(this.probe);
        }
        _createProbe() {
          if (this._probeId === -1 || ReflectionProbeManager.probeManager.exists(this._probeId)) {
            this._probeId = ReflectionProbeManager.probeManager.getNewReflectionProbeId();
          }
          this._probe = new scene.ReflectionProbe(this._probeId);
          if (this._probe) {
            const cameraNode = new Node('ReflectionProbeCamera');
            cameraNode.hideFlags |= CCObjectFlags.DontSave | CCObjectFlags.HideInHierarchy;
            this.node.scene.addChild(cameraNode);
            this._probe.initialize(this.node, cameraNode);
            if (this.enabled) {
              ReflectionProbeManager.probeManager.register(this._probe);
            }
            this._probe.resolution = this._resolution;
            this._probe.clearFlag = this._clearFlag;
            this._probe.backgroundColor = this._backgroundColor;
            this._probe.visibility = this._visibility;
            this._probe.probeType = this._probeType;
            this._probe.size = this._size;
            this._probe.cubemap = this._cubemap;
          }
        }
      }, _ReflectionProbe.DEFAULT_CUBE_SIZE = v3(1, 1, 1), _ReflectionProbe.DEFAULT_PLANER_SIZE = v3(5, 0.5, 5), _ReflectionProbe), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_resolution", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 256;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_clearFlag", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ProbeClearFlag.SKYBOX;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_backgroundColor", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Color(0, 0, 0, 255);
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_visibility", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CAMERA_DEFAULT_MASK;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_probeType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ProbeType.CUBE;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_cubemap", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_size", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return v3(1, 1, 1);
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_sourceCamera", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_probeId", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_fastBake", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "size", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "size"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "probeType", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "probeType"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "resolution", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "resolution"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearFlag", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "clearFlag"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "backgroundColor", [_dec0, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "backgroundColor"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "visibility", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "visibility"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "sourceCamera", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "sourceCamera"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fastBake", [_dec14, _dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "fastBake"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "cubemap", [_dec17, _dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "cubemap"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class));
    }
  };
});