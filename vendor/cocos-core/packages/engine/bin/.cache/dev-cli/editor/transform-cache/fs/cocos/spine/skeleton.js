System.register("q-bundled:///fs/cocos/spine/skeleton.js", ["../../../virtual/internal%253Aconstants.js", "../core/data/decorators/index.js", "../asset/assets/index.js", "../core/platform/debug.js", "../core/value-types/enum.js", "../scene-graph/index.js", "../core/index.js", "./skeleton-data.js", "../2d/framework/ui-renderer.js", "../gfx/index.js", "../render-scene/index.js", "../asset/asset-manager/index.js", "../core/global-exports.js", "./skeleton-system.js", "../2d/renderer/render-entity.js", "./attach-util.js", "./lib/spine-core.js", "./skeleton-cache.js", "./track-entry-listeners.js", "../core/internal-index.js", "./lib/spine-version.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, JSB, ccclass, executeInEditMode, help, menu, serializable, type, override, displayOrder, editable, visible, Material, error, errorID, logID, warnID, Enum, ccenum, Node, NodeEventType, CCObjectFlags, Color, RecyclePool, js, math, SkeletonData, UIRenderer, BlendOp, MaterialInstance, assetManager, builtinResMgr, legacyCC, SkeletonSystem, RenderEntity, RenderEntityType, AttachUtil, spine, SkeletonCache, TrackEntryListeners, setPropertyEnumType, SPINE_VERSION, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _class3, _class4, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _Skeleton, CachedFrameTime, timeScale, SpineAnimationCacheMode, AnimationCacheMode, DefaultSkinsEnum, SpineDefaultAnimsEnum, DefaultAnimsEnum, SpineMaterialType, SpineSocket, Skeleton;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
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

  function isSkeletonDataValid(skeletonData) {
    return !!skeletonData && !skeletonData.isEmpty();
  }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      help = _coreDataDecoratorsIndexJs.help;
      menu = _coreDataDecoratorsIndexJs.menu;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
      override = _coreDataDecoratorsIndexJs.override;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      editable = _coreDataDecoratorsIndexJs.editable;
      visible = _coreDataDecoratorsIndexJs.visible;
    }, function (_assetAssetsIndexJs) {
      Material = _assetAssetsIndexJs.Material;
    }, function (_corePlatformDebugJs) {
      error = _corePlatformDebugJs.error;
      errorID = _corePlatformDebugJs.errorID;
      logID = _corePlatformDebugJs.logID;
      warnID = _corePlatformDebugJs.warnID;
    }, function (_coreValueTypesEnumJs) {
      Enum = _coreValueTypesEnumJs.Enum;
      ccenum = _coreValueTypesEnumJs.ccenum;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
      NodeEventType = _sceneGraphIndexJs.NodeEventType;
    }, function (_coreIndexJs) {
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      Color = _coreIndexJs.Color;
      RecyclePool = _coreIndexJs.RecyclePool;
      js = _coreIndexJs.js;
      math = _coreIndexJs.math;
    }, function (_skeletonDataJs) {
      SkeletonData = _skeletonDataJs.SkeletonData;
    }, function (_dFrameworkUiRendererJs) {
      UIRenderer = _dFrameworkUiRendererJs.UIRenderer;
    }, function (_gfxIndexJs) {
      BlendOp = _gfxIndexJs.BlendOp;
    }, function (_renderSceneIndexJs) {
      MaterialInstance = _renderSceneIndexJs.MaterialInstance;
    }, function (_assetAssetManagerIndexJs) {
      assetManager = _assetAssetManagerIndexJs.assetManager;
      builtinResMgr = _assetAssetManagerIndexJs.builtinResMgr;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_skeletonSystemJs) {
      SkeletonSystem = _skeletonSystemJs.SkeletonSystem;
    }, function (_dRendererRenderEntityJs) {
      RenderEntity = _dRendererRenderEntityJs.RenderEntity;
      RenderEntityType = _dRendererRenderEntityJs.RenderEntityType;
    }, function (_attachUtilJs) {
      AttachUtil = _attachUtilJs.AttachUtil;
    }, function (_libSpineCoreJs) {
      spine = _libSpineCoreJs.default;
    }, function (_skeletonCacheJs) {
      SkeletonCache = _skeletonCacheJs.default;
    }, function (_trackEntryListenersJs) {
      TrackEntryListeners = _trackEntryListenersJs.TrackEntryListeners;
    }, function (_coreInternalIndexJs) {
      setPropertyEnumType = _coreInternalIndexJs.setPropertyEnumType;
    }, function (_libSpineVersionJs) {
      SPINE_VERSION = _libSpineVersionJs.SPINE_VERSION;
    }],
    execute: function () {
      CachedFrameTime = 1 / 60;
      /**
       * @en
       * Animation playback rate.
       * @zh
       * 动画播放速率。
       */
      _export("timeScale", timeScale = 1.0);
      /**
       * @en Enum for animation cache mode type.
       * @zh Spine 动画缓存类型。
       */
      _export("SpineAnimationCacheMode", SpineAnimationCacheMode = /*#__PURE__*/function (SpineAnimationCacheMode) {
        /**
         * @en Unset mode.
         * @zh 未设置模式。
         */
        SpineAnimationCacheMode[SpineAnimationCacheMode["UNSET"] = -1] = "UNSET";
        /**
         * @en The realtime mode.
         * @zh 实时计算模式。
         */
        SpineAnimationCacheMode[SpineAnimationCacheMode["REALTIME"] = 0] = "REALTIME";
        /**
         * @en The shared cache mode.
         * @zh 共享缓存模式。
         */
        SpineAnimationCacheMode[SpineAnimationCacheMode["SHARED_CACHE"] = 1] = "SHARED_CACHE";
        /**
         * @en The private cache mode.
         * @zh 私有缓存模式。
         */
        SpineAnimationCacheMode[SpineAnimationCacheMode["PRIVATE_CACHE"] = 2] = "PRIVATE_CACHE";
        return SpineAnimationCacheMode;
      }({}));
      ccenum(SpineAnimationCacheMode);

      // To keep the compatibility, don't use it internally, otherwise, enum value may be inlined to wrong value.
      // Use AnimationCacheMode instead.
      _export("AnimationCacheMode", AnimationCacheMode = SpineAnimationCacheMode);
      /**
       * @engineInternal
       */
      _export("DefaultSkinsEnum", DefaultSkinsEnum = /*#__PURE__*/function (DefaultSkinsEnum) {
        DefaultSkinsEnum[DefaultSkinsEnum["default"] = 0] = "default";
        return DefaultSkinsEnum;
      }({}));
      ccenum(DefaultSkinsEnum);

      /**
       * @engineInternal
       */
      _export("SpineDefaultAnimsEnum", SpineDefaultAnimsEnum = /*#__PURE__*/function (SpineDefaultAnimsEnum) {
        SpineDefaultAnimsEnum[SpineDefaultAnimsEnum["<None>"] = 0] = "<None>";
        return SpineDefaultAnimsEnum;
      }({}));
      ccenum(SpineDefaultAnimsEnum);
      // To keep the compatibility, don't use it internally, otherwise, enum value may be inlined to wrong value.
      // Use SpineDefaultAnimsEnum instead.
      _export("DefaultAnimsEnum", DefaultAnimsEnum = SpineDefaultAnimsEnum);
      /**
       * @engineInternal
       */
      _export("SpineMaterialType", SpineMaterialType = /*#__PURE__*/function (SpineMaterialType) {
        SpineMaterialType[SpineMaterialType["COLORED_TEXTURED"] = 0] = "COLORED_TEXTURED";
        SpineMaterialType[SpineMaterialType["TWO_COLORED"] = 1] = "TWO_COLORED";
        return SpineMaterialType;
      }({}));
      /**
       * @engineInternal
       */
      /**
       * @en
       * The Sockets attached to bones, synchronous transform with spine animation.
       * @zh
       * Spine 挂点，可附着在目标骨骼上随 spine 动画一起运动。
       * @class SpineSocket
       */
      _export("SpineSocket", SpineSocket = (_dec = ccclass('sp.Skeleton.SpineSocket'), _dec2 = type(Node), _dec(_class = (_class2 = class SpineSocket {
        constructor(path = '', target = null) {
          /**
           * @en Path of the target joint.
           * @zh 此挂点的目标骨骼路径。
           */
          _initializerDefineProperty(this, "path", _descriptor, this);
          /**
           * @en Transform output node.
           * @zh 此挂点的变换信息输出节点。
           */
          _initializerDefineProperty(this, "target", _descriptor2, this);
          this.path = path;
          this.target = target;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "path", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "target", [_dec2, editable, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
      js.setClassAlias(SpineSocket, 'sp.Skeleton.SpineSocket');

      /**
       * @en
       * The skeleton of Spine <br/>
       * <br/>
       * (Skeleton has a reference to a SkeletonData and stores the state for skeleton instance,
       * which consists of the current pose's bone SRT, slot colors, and which slot attachments are visible. <br/>
       * Multiple skeletons can use the same SkeletonData which includes all animations, skins, and attachments.) <br/>
       * Cocos Creator supports spine versions lower than 3.8.99.
       * @zh
       * Spine 骨骼动画 <br/>
       * <br/>
       * (Skeleton 具有对骨骼数据的引用并且存储了骨骼实例的状态，
       * 它由当前的骨骼动作，slot 颜色，和可见的 slot attachments 组成。<br/>
       * 多个 Skeleton 可以使用相同的骨骼数据，其中包括所有的动画，皮肤和 attachments。
       * Cocos Creator 支持 spine 版本最高到3.8.99。
       * @class Skeleton
       * @extends UIRenderer
       */
      _export("Skeleton", Skeleton = (_dec3 = ccclass('sp.Skeleton'), _dec4 = help('i18n:cc.Spine'), _dec5 = menu('Spine/Skeleton'), _dec6 = type(SkeletonData), _dec7 = visible(true), _dec8 = type(DefaultSkinsEnum), _dec9 = visible(true), _dec0 = type(SpineDefaultAnimsEnum), _dec1 = type(SpineAnimationCacheMode), _dec10 = visible(true), _dec11 = type([SpineSocket]), _dec12 = type(Material), _dec13 = displayOrder(0), _dec3(_class3 = _dec4(_class3 = _dec5(_class3 = executeInEditMode(_class3 = (_class4 = (_Skeleton = class Skeleton extends UIRenderer {
        constructor() {
          super();
          _initializerDefineProperty(this, "_skeletonData", _descriptor3, this);
          _initializerDefineProperty(this, "defaultSkin", _descriptor4, this);
          _initializerDefineProperty(this, "defaultAnimation", _descriptor5, this);
          /**
           * @en Indicates whether to enable premultiplied alpha.
           * You should disable this option when image's transparent area appears to have opaque pixels,
           * or enable this option when image's half transparent area appears to be darken.
           * @zh 是否启用贴图预乘。
           * 当图片的透明区域出现色块时需要关闭该选项，当图片的半透明区域颜色变黑时需要启用该选项。
           */
          _initializerDefineProperty(this, "_premultipliedAlpha", _descriptor6, this);
          _initializerDefineProperty(this, "_timeScale", _descriptor7, this);
          _initializerDefineProperty(this, "_preCacheMode", _descriptor8, this);
          _initializerDefineProperty(this, "_cacheMode", _descriptor9, this);
          _initializerDefineProperty(this, "_sockets", _descriptor0, this);
          _initializerDefineProperty(this, "_useTint", _descriptor1, this);
          _initializerDefineProperty(this, "_debugMesh", _descriptor10, this);
          _initializerDefineProperty(this, "_debugBones", _descriptor11, this);
          _initializerDefineProperty(this, "_debugSlots", _descriptor12, this);
          _initializerDefineProperty(this, "_enableBatch", _descriptor13, this);
          this._runtimeData = null;
          this._skeleton = null;
          this._instance = null;
          this._state = null;
          this._textures = [];
          this._skeletonInfo = null;
          // Animation name
          this._animationName = '';
          this._skinName = '';
          this._drawList = new RecyclePool(() => ({
            material: null,
            texture: null,
            indexOffset: 0,
            indexCount: 0
          }), 1);
          this._materialCache = {};
          this.paused = false;
          this._enumSkins = Enum({});
          this._enumAnimations = Enum({});
          this.attachUtil = void 0;
          this._socketNodes = new Map();
          this._cachedSockets = new Map();
          /**
           * @engineInternal
           */
          this._startEntry = void 0;
          /**
           * @engineInternal
           */
          this._endEntry = void 0;
          // Paused or playing state
          this._paused = false;
          // Below properties will effect when cache mode is SHARED_CACHE or PRIVATE_CACHE.
          // accumulate time
          this._accTime = 0;
          // Play times counter
          this._playCount = 0;
          // Skeleton cache
          this._skeletonCache = null;
          this._animCache = null;
          this._animationQueue = [];
          // Head animation info of
          this._headAniInfo = null;
          // Is animation complete.
          this._isAniComplete = true;
          // Play times
          this._playTimes = 0;
          /**
           * @engineInternal
           */
          this._curFrame = null;
          this._listener = null;
          /**
           * @engineInternal
           * @mangle
           */
          this._debugRenderer = null;
          /**
           * @engineInternal
           * @mangle
           */
          this._startSlotIndex = void 0;
          /**
           * @engineInternal
           * @mangle
           */
          this._endSlotIndex = void 0;
          this._customMaterialInstance = null;
          this._vLength = 0;
          this._vBuffer = null;
          this._iLength = 0;
          this._iBuffer = null;
          this._model = void 0;
          this._tempColor = {
            r: 0,
            g: 0,
            b: 0,
            a: 0
          };
          this._eventListenerID = -1;
          this._slotTextures = null;
          this._isRenderable = false;
          /**
           * @en Whether play animations in loop mode.
           * @zh 是否循环播放当前骨骼动画。
           */
          _initializerDefineProperty(this, "loop", _descriptor14, this);
          this._useVertexOpacity = true;
          this._startEntry = {
            animation: {
              name: ''
            },
            trackIndex: 0
          };
          this._endEntry = {
            animation: {
              name: ''
            },
            trackIndex: 0
          };
          this._startSlotIndex = -1;
          this._endSlotIndex = -1;
          if (!JSB) {
            this._instance = new spine.SkeletonInstance();
            this._instance.dtRate = this._timeScale * timeScale;
            this._instance.isCache = this.isAnimationCached();
          }
          this.attachUtil = new AttachUtil();
        }

        /**
         * @engineInternal
         */
        get drawList() {
          return this._drawList;
        }

        /**
         * @en
         * The skeleton data contains the skeleton information (bind pose bones, slots, draw order,
         * attachments, skins, etc) and animations but does not hold any state.<br/>
         * Multiple skeletons can share the same skeleton data.
         * @zh
         * 骨骼数据包含了骨骼信息（绑定骨骼动作，slots，渲染顺序，
         * attachments，皮肤等等）和动画但不持有任何状态。<br/>
         * 多个 Skeleton 可以共用相同的骨骼数据。
         * @property {sp.SkeletonData} skeletonData
         */
        get skeletonData() {
          return this._skeletonData;
        }
        set skeletonData(value) {
          if (value) value.resetEnums();
          if (this._skeletonData !== value) {
            this.destroyRenderData();
            this._skeletonData = value;
            this.defaultSkin = '';
            this.defaultAnimation = '';
            this._animationName = '';
            this._skinName = '';
            this._animCache = null;
            this._destroySkeletonInfo(this._skeletonCache);
            this._updateSkeletonData();
            this._updateUITransform();
          }
        }

        /**
         * @engineInternal
         */
        get _defaultSkinIndex() {
          if (isSkeletonDataValid(this.skeletonData)) {
            const skinsEnum = this.skeletonData.getSkinsEnum();
            if (skinsEnum) {
              if (this.defaultSkin === '') {
                // eslint-disable-next-line no-prototype-builtins
                if (skinsEnum.hasOwnProperty(0)) {
                  this._defaultSkinIndex = 0;
                  return 0;
                }
              } else {
                const skinIndex = skinsEnum[this.defaultSkin];
                if (skinIndex !== undefined) {
                  return skinIndex;
                }
              }
            }
          }
          return 0;
        }
        /**
         * @engineInternal
         */
        set _defaultSkinIndex(value) {
          let skinsEnum;
          if (isSkeletonDataValid(this.skeletonData)) {
            skinsEnum = this.skeletonData.getSkinsEnum();
          }
          if (!skinsEnum) {
            error(`${this.name} skin enums are invalid`);
            return;
          }
          const skinName = skinsEnum[value];
          if (skinName !== undefined) {
            this.defaultSkin = String(skinName);
            this.setSkin(this.defaultSkin);
            this._refreshInspector();
            this._markForUpdateRenderData();
          } else {
            error(`${this.name} skin enums are invalid`);
          }
        }

        // value of 0 represents no animation
        /**
         * @engineInternal
         */
        get _animationIndex() {
          const animationName = EDITOR_NOT_IN_PREVIEW ? this.defaultAnimation : this.animation;
          if (isSkeletonDataValid(this.skeletonData)) {
            if (animationName) {
              const animsEnum = this.skeletonData.getAnimsEnum();
              if (animsEnum) {
                const animIndex = animsEnum[animationName];
                if (animIndex !== undefined) {
                  return animIndex;
                }
              }
            } else {
              this._refreshInspector();
            }
          }
          return 0;
        }
        /**
         * @engineInternal
         */
        set _animationIndex(value) {
          let animsEnum;
          if (isSkeletonDataValid(this.skeletonData)) {
            animsEnum = this.skeletonData.getAnimsEnum();
          }
          if (!animsEnum) {
            error(`${this.name} animation enums are invalid`);
            return;
          }
          const animName = String(animsEnum[value]);
          if (animName !== undefined) {
            this.animation = animName;
            if (EDITOR_NOT_IN_PREVIEW) {
              this.defaultAnimation = animName;
              this._refreshInspector();
            } else {
              this.animation = animName;
            }
          } else {
            error(`${this.name} animation enums are invalid`);
          }
        }

        /**
         * @en Animation mode, with options for real-time mode, private cached, or public cached mode.
         * @zh 动画模式，可选实时模式，私有 cached 或公共 cached 模式。
         */
        get defaultCacheMode() {
          return this._cacheMode;
        }
        set defaultCacheMode(mode) {
          this._cacheMode = mode;
          this.setAnimationCacheMode(this._cacheMode);
        }

        /**
         * @en Whether premultipliedAlpha enabled.
         * @zh 是否启用 alpha 预乘。
         */
        get premultipliedAlpha() {
          return this._premultipliedAlpha;
        }
        set premultipliedAlpha(v) {
          if (v !== this._premultipliedAlpha) {
            this._premultipliedAlpha = v;
            this._instance.setPremultipliedAlpha(v);
            this._markForUpdateRenderData();
          }
        }
        /**
         * @en The time scale of this skeleton.
         * @zh 当前骨骼中所有动画的时间缩放率。
         */
        get timeScale() {
          return this._timeScale;
        }
        set timeScale(value) {
          if (value !== this._timeScale) {
            this._timeScale = value;
            if (this._instance) {
              this._instance.dtRate = this._timeScale * timeScale;
            }
          }
        }
        /**
         * @en Enabled two color tint.
         * @zh 是否启用染色效果。
         */
        get useTint() {
          return this._useTint;
        }
        set useTint(value) {
          if (value !== this._useTint) {
            this._useTint = value;
            this._updateUseTint();
          }
        }

        /**
         * @en If rendering a large number of identical textures and simple skeletal animations,
         * enabling batching can reduce the number of draw calls and improve rendering performance.
         * @zh 如果渲染大量相同纹理，且结构简单的骨骼动画，开启合批可以降低 draw call 数量提升渲染性能。
         */
        get enableBatch() {
          return this._enableBatch;
        }
        set enableBatch(value) {
          if (value !== this._enableBatch) {
            this._enableBatch = value;
            this._updateBatch();
          }
        }
        /**
         * @en
         * The bone sockets this animation component maintains.<br>
         * A SpineSocket object contains a path reference to bone, and a target node.
         * @zh
         * 当前动画组件维护的挂点数组。一个挂点组件包括动画节点路径和目标节点。
         */
        get sockets() {
          return this._sockets;
        }
        set sockets(val) {
          if (EDITOR_NOT_IN_PREVIEW) {
            this._verifySockets(val);
          }
          this._sockets = val;
          this._updateSocketBindings();
          this.attachUtil.init(this);
        }

        /**
         * @en Indicates whether open debug slots.
         * @zh 是否显示 slot 的 debug 信息。
         */
        get debugSlots() {
          return this._debugSlots;
        }
        set debugSlots(v) {
          if (v !== this._debugSlots) {
            this._debugSlots = v;
            this._updateDebugDraw();
            this._markForUpdateRenderData();
          }
        }

        /**
         * @en Indicates whether open debug bones.
         * @zh 是否显示 bone 的 debug 信息。
         */
        get debugBones() {
          return this._debugBones;
        }
        set debugBones(v) {
          if (v !== this._debugBones) {
            this._debugBones = v;
            this._updateDebugDraw();
            this._markForUpdateRenderData();
          }
        }

        /**
         * @en Indicates whether open debug mesh.
         * @zh 是否显示 mesh 的 debug 信息。
         */
        get debugMesh() {
          return this._debugMesh;
        }
        set debugMesh(value) {
          if (value !== this._debugMesh) {
            this._debugMesh = value;
            this._updateDebugDraw();
            this._markForUpdateRenderData();
          }
        }
        get socketNodes() {
          return this._socketNodes;
        }

        /**
         * @en The name of current playing animation.
         * @zh 当前播放的动画名称。
         * @property {String} animation
         */
        get animation() {
          return this._animationName;
        }
        set animation(value) {
          if (value) {
            this.setAnimation(0, value, this.loop);
          } else {
            this.clearAnimation(0);
          }
        }

        /**
         * @en The customMaterial。
         * @zh 用户自定材质。
         */
        get customMaterial() {
          return this._customMaterial;
        }
        set customMaterial(val) {
          this._customMaterial = val;
          this.updateMaterial();
          this._markForUpdateRenderData();
        }

        /**
         * @deprecated Since v3.8.7, it will be removed in the future.
         * We are deprecating the `customMaterialInstance` field because it leads to shared material state across all slots,
         * causing unexpected behavior (like the last blendMode change affecting all slots).
         * Workaround:
         *    Switch to customMaterial. Whenever its value is modified, immediately call updateMaterial at the exact point of change.
         */
        get customMaterialInstance() {
          if (!this._customMaterial) {
            return null;
          }
          if (!this._customMaterialInstance) {
            const matInfo = {
              parent: this._customMaterial,
              subModelIdx: 0,
              owner: this
            };
            this._customMaterialInstance = new MaterialInstance(matInfo);
          }
          return this._customMaterialInstance;
        }
        __preload() {
          super.__preload();
          if (EDITOR_NOT_IN_PREVIEW) {
            this.paused = true;
          }
          this._updateSkeletonData();
          this._updateDebugDraw();
        }

        /**
         * @engineInternal
         */
        onRestore() {
          this.updateMaterial();
          this._markForUpdateRenderData();
        }

        /**
         * @en Gets the animation state object.
         * @zh 获取动画状态。
         * @method getState
         * @return {sp.spine.AnimationState} state
         */
        getState() {
          return this._state;
        }

        /**
         * @en Be called when component state becomes available.
         * @zh 组件状态变为可用时调用。
         */
        onEnable() {
          super.onEnable();
          this._flushAssembler();
          SkeletonSystem.getInstance().add(this);
          this._isRenderable = true;
        }
        /**
         * @en Be called when component state becomes disabled.
         * @zh 组件状态变为禁用状态时调用。
         */
        onDisable() {
          super.onDisable();
          SkeletonSystem.getInstance().remove(this);
          this._isRenderable = false;
        }
        onDestroy() {
          var _this$_slotTextures;
          if (this._eventListenerID > 0) {
            TrackEntryListeners.removeListener(this._eventListenerID);
            this._eventListenerID = -1;
          }
          this._drawList.destroy();
          this.destroyRenderData();
          this._cleanMaterialCache();
          this._vBuffer = null;
          this._iBuffer = null;
          this.attachUtil.reset();
          (_this$_slotTextures = this._slotTextures) == null || _this$_slotTextures.clear();
          this._slotTextures = null;
          this._cachedSockets.clear();
          this._socketNodes.clear();
          //if (this._cacheMode == SpineAnimationCacheMode.PRIVATE_CACHE) this._animCache?.destroy();
          this._animCache = null;
          SkeletonSystem.getInstance().remove(this);
          if (!JSB && this._instance) {
            this._instance.destroy();
            this._instance = null;
          }
          this._destroySkeletonInfo(this._skeletonCache);
          this._skeletonCache = null;
          super.onDestroy();
        }

        /**
         * @en Clear animation and set to setup pose, default value of track index is 0.
         * @zh 清除指定动画并还原到初始姿势, 默认清除 track索引 为0的动画。
         * @param {Number} [trackIndex] @en track index. @zh track 的索引。
         */
        clearAnimation(trackIndex) {
          if (!this.isAnimationCached()) {
            this.clearTrack(trackIndex || 0);
            this.setToSetupPose();
          }
        }

        /**
         * @en Clear all animations and set to setup pose.
         * @zh 清除所有动画并还原到初始姿势。
         */
        clearAnimations() {
          if (!this.isAnimationCached()) {
            this.clearTracks();
            this.setToSetupPose();
          }
        }
        _updateSkeletonData() {
          const skeletonData = this._skeletonData;
          if (!isSkeletonDataValid(this._skeletonData)) {
            this._runtimeData = null;
            this._state = null;
            this._skeleton = null;
            this._textures = [];
            this._refreshInspector();
            if (this._isRenderable) {
              SkeletonSystem.getInstance().remove(this);
            }
            return;
          }
          if (this._instance) {
            this._instance.dtRate = this._timeScale * timeScale;
          }
          //const data = this.skeletonData?.getRuntimeData();
          //if (!data) return;
          //this.setSkeletonData(data);
          this._runtimeData = skeletonData.getRuntimeData();
          if (!this._runtimeData) return;
          this.setSkeletonData(this._runtimeData);
          this._textures = skeletonData.textures;
          this._refreshInspector();
          /* The animation must be configured after the skin because the animation depends on the skin.
             If the animation is set before the skin,
             it will cause rendering issues when a prefab with Spine assets is added to the scene node tree.
          */
          if (this.defaultSkin && this.defaultSkin !== '') {
            this.setSkin(this.defaultSkin);
          } else if (this._skinName && this._skinName !== '') {
            this.setSkin(this._skinName);
          }
          if (this.defaultAnimation) {
            this.animation = this.defaultAnimation.toString();
          } else if (this._animationName) {
            this.animation = this._animationName;
          } else {
            this.animation = '';
          }
          this._updateUseTint();
          this._indexBoneSockets();
          this._updateSocketBindings();
          this.attachUtil.init(this);
          this._preCacheMode = this._cacheMode;
        }

        /**
         * @en
         * Sets runtime skeleton data to sp.Skeleton.<br>
         * This method is different from the `skeletonData` property. This method is passed in the raw data provided by the
         *  Spine runtime, and the skeletonData type is the asset type provided by Creator.
         * @zh
         * 设置底层运行时用到的 SkeletonData。<br>
         * 这个接口有别于 `skeletonData` 属性，这个接口传入的是 Spine runtime 提供的原始数据，而 skeletonData 的类型是 Creator 提供的资源类型。
         * @param skeletonData @en The skeleton data contains the skeleton information (bind pose bones, slots, draw order, attachments,
         * skins, etc) and animations but does not hold any state. @zh 骨架数据(SkeletonData)包含骨架信息(绑定pose的骨骼、槽位、绘制顺序、附件、
         * 皮肤等)和动画, 但不保存任何状态。
         */
        setSkeletonData(skeletonData) {
          if (!EDITOR_NOT_IN_PREVIEW) {
            const preSkeletonCache = this._skeletonCache;
            if (this._cacheMode === SpineAnimationCacheMode.SHARED_CACHE) {
              this._skeletonCache = SkeletonCache.sharedCache;
            } else if (this._cacheMode === SpineAnimationCacheMode.PRIVATE_CACHE) {
              this._skeletonCache = new SkeletonCache();
              this._skeletonCache.enablePrivateMode();
            } else {
              this._skeletonCache = null;
            }
            //cache mode may be changed
            if (preSkeletonCache !== this._skeletonCache) {
              this._destroySkeletonInfo(preSkeletonCache);
            }
          }
          if (this.isAnimationCached()) {
            if (this.debugBones || this.debugSlots) {
              warnID(16410);
            }
            const skeletonInfo = this._skeletonCache.getSkeletonInfo(this._skeletonData);
            if (this._skeletonInfo !== skeletonInfo || !this._skeletonInfo && !skeletonInfo) {
              this._destroySkeletonInfo(this._skeletonCache);
              if (!skeletonInfo && this._cacheMode === SpineAnimationCacheMode.PRIVATE_CACHE) {
                this._animCache = this._skeletonCache.initAnimationCache(this.skeletonData.uuid, this._skeletonData, this._animationName);
              }
              this._skeletonInfo = this._skeletonCache.createSkeletonInfo(this._skeletonData);
              this._skeleton = this._skeletonInfo.skeleton;
            }
          } else {
            this._skeleton = this._instance.initSkeleton(skeletonData);
            this._state = this._instance.getAnimationState();
            this._instance.setPremultipliedAlpha(this._premultipliedAlpha);
          }
          if (this._isRenderable) {
            SkeletonSystem.getInstance().add(this);
          }
          // Recreate render data and mark dirty
          this._flushAssembler();
        }

        /**
         * @en Sets slots visible range.
         * @zh 设置骨骼插槽可视范围。
         * @param {Number} startSlotIndex @en start slot index. @zh 开始插槽的索引。
         * @param {Number} endSlotIndex @en end slot index. @zh 结束插槽的索引。
         */
        setSlotsRange(startSlotIndex, endSlotIndex) {
          if (this.isAnimationCached()) {
            warnID(16411);
          } else {
            this._startSlotIndex = startSlotIndex;
            this._endSlotIndex = endSlotIndex;
          }
        }

        /**
         * @en
         * Returns the attachment for the slot and attachment name.
         * The skeleton looks first in its skin, then in the skeleton data’s default skin.<br>
         * Returns a {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.Attachment object.
         * @zh
         * 通过 slot 和 attachment 的名称获取 attachment。Skeleton 优先查找它的皮肤，然后才是 Skeleton Data 中默认的皮肤。<br>
         * 返回一个 {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.Attachment 对象。
         *
         * @method getAttachment
         * @param {String} slotName @en slot name. @zh 插槽的名字。
         * @param {String} attachmentName @en attachment name. @en 附件的名称。
         * @return {sp.spine.Attachment}
         */
        getAttachment(slotName, attachmentName) {
          if (this._skeleton) {
            return this._skeleton.getAttachmentByName(slotName, attachmentName);
          }
          return null;
        }

        /**
         * @en
         * Sets the attachment for the slot and attachment name.
         * The skeleton looks first in its skin, then in the skeleton data’s default skin.
         * @zh
         * 通过 slot 和 attachment 的名字来设置 attachment。
         * Skeleton 优先查找它的皮肤，然后才是 Skeleton Data 中默认的皮肤。
         * @method setAttachment
         * @param {String} slotName @en slot name. @zh 插槽的名字。
         * @param {String} attachmentName @en attachment name. @en 附件的名称。
         */
        setAttachment(slotName, attachmentName) {
          if (this._skeleton) {
            this._skeleton.setAttachment(slotName, attachmentName);
          }
          this.invalidAnimationCache();
        }

        /**
         * @en
         * Get Texture Atlas used in attachments.
         * @zh
         * 获取附件图集。
         * @param regionAttachment @en An attachment type of RegionAttachment or BoundingBoxAttachment. @zh RegionAttachment 或 BoundingBoxAttachment 的附件。
         * @return @en TextureRegion contains texture and atlas text information. @zh TextureRegion包含纹理和图集文本信息。
         */
        getTextureAtlas(regionAttachment) {
          return regionAttachment.region;
        }
        /**
         * @en Set the current animation. Any queued animations are cleared.<br>
         * @zh 设置当前动画。队列中的任何的动画将被清除。<br>
         * @param trackIndex @en Index of track. @zh 动画通道索引。
         * @param name @en The name of animation. @zh 动画名称。
         * @param loop @en Use loop mode or not. @zh 是否使用循环播放模式。
         */
        setAnimation(trackIndex, name, loop) {
          if (!(typeof name === 'string')) {
            logID(7511);
            return null;
          }
          const skeleton = this._skeleton;
          const animation = skeleton ? skeleton.data.findAnimation(name) : null;
          if (!animation) {
            logID(7509, name);
            return null;
          }
          let trackEntry = null;
          if (loop === undefined) loop = true;
          this._playTimes = loop ? 0 : 1;
          if (this.isAnimationCached()) {
            if (trackIndex !== 0) {
              warnID(16412);
            }
            if (!this._skeletonCache) return null;
            let cache = this._skeletonCache.getAnimationCache(this._skeletonData.uuid, name);
            if (!cache) {
              cache = this._skeletonCache.initAnimationCache(this.skeletonData.uuid, this._skeletonData, name);
              if (cache && this._skinName) cache.setSkin(this._skinName);
            }
            if (cache) {
              this._animationName = name;
              this._isAniComplete = false;
              this._accTime = 0;
              this._playCount = 0;
              this._animCache = cache;
              if (this._socketNodes.size > 0) {
                this._animCache.enableCacheAttachedInfo();
              }
              this._animCache.updateToFrame(0);
              this._curFrame = this._animCache.frames[0];
            }
          } else {
            this._animationName = name;
            trackEntry = this._instance.setAnimation(trackIndex, name, loop);
          }
          this._markForUpdateRenderData();
          return trackEntry;
        }
        /**
         * @en Adds an animation to be played delay seconds after the current or last queued animation.<br>
         * Returns a {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.TrackEntry object.
         * @zh 添加一个动画到动画队列尾部，还可以延迟指定的秒数。<br>
         * 返回一个 {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.TrackEntry 对象。
         * @param trackIndex @en Index of trackEntry. @zh TrackEntry 索引。
         * @param name @en The name of animation. @zh 动画名称。
         * @param loop @en Set play animation in a loop. @zh 是否循环播放。
         * @param delay @en Delay time of animation start. @zh 动画开始的延迟时间。
         * @return {sp.spine.TrackEntry}
         */
        addAnimation(trackIndex, name, loop, delay) {
          delay = delay || 0;
          if (this.isAnimationCached()) {
            if (trackIndex !== 0) {
              warnID(16413);
            }
            this._animationQueue.push({
              animationName: name,
              loop,
              delay
            });
            return null;
          } else if (this._skeleton) {
            var _this$_state;
            const animation = this._skeleton.data.findAnimation(name);
            if (!animation) {
              logID(7510, name);
              return null;
            }
            return (_this$_state = this._state) == null ? void 0 : _this$_state.addAnimationWith(trackIndex, animation, loop, delay);
          }
          return null;
        }
        /**
         * @en Find animation with specified name.
         * @zh 查找指定名称的动画
         * @param name @en The name of animation. @zh 动画名称。
         * @returns {sp.spine.Animation}
         */
        findAnimation(name) {
          if (this._skeleton) {
            return this._skeleton.data.findAnimation(name);
          }
          return null;
        }
        /**
         * @en Returns track entry by trackIndex.<br>
         * Returns a {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.TrackEntry object.
         * @zh 通过 track 索引获取 TrackEntry。<br>
         * 返回一个 {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.TrackEntry 对象。
         * @param trackIndex @en The index of trackEntry. @zh TrackEntry 索引。
         * @return {sp.spine.TrackEntry}
         */
        getCurrent(trackIndex) {
          if (this.isAnimationCached()) {
            warnID(16414);
          } else if (this._state) {
            return this._state.getCurrent(trackIndex);
          }
          return null;
        }

        /**
         * @en
         * Finds a skin by name and makes it the active skin.
         * This does a string comparison for every skin.<br>
         * Note that setting the skin does not change which attachments are visible.<br>
         * Returns a {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.Skin object.
         * @zh
         * 按名称查找皮肤，激活该皮肤。这里对每个皮肤的名称进行了比较。<br>
         * 注意：设置皮肤不会改变 attachment 的可见性。<br>
         * 返回一个 {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.Skin 对象。
         *
         * @param skinName @en The name of skin. @zh 皮肤名称。
         */
        setSkin(name) {
          if (!name) return;
          if (this._skeleton) this._skeleton.setSkinByName(name);
          this._instance.setSkin(name);
          if (this.isAnimationCached()) {
            if (this._animCache) {
              this._animCache.setSkin(name);
            }
          }
          this._skinName = name;
          this.invalidAnimationCache();
        }

        /**
         * @en Update skeleton animation.
         * @zh 更新骨骼动画。
         * @param dt @en delta time. @zh 时间差。
         */
        updateAnimation(dt) {
          this._markForUpdateRenderData();
          if (this.paused) return;
          if (this.isAnimationCached()) {
            // On realTime mode, dt is multiplied at native side.
            dt *= this._timeScale * timeScale;
            if (this._isAniComplete) {
              var _this$_headAniInfo;
              if (this._animationQueue.length === 0 && !this._headAniInfo) {
                const frameCache = this._animCache;
                if (frameCache && frameCache.isInvalid()) {
                  frameCache.updateToFrame(0);
                  const frames = frameCache.frames;
                  this._curFrame = frames[frames.length - 1];
                }
                return;
              }
              if (!this._headAniInfo) {
                this._headAniInfo = this._animationQueue.shift();
              }
              this._accTime += dt;
              if (this._accTime > ((_this$_headAniInfo = this._headAniInfo) == null ? void 0 : _this$_headAniInfo.delay)) {
                const aniInfo = this._headAniInfo;
                this._headAniInfo = null;
                this.setAnimation(0, aniInfo == null ? void 0 : aniInfo.animationName, aniInfo == null ? void 0 : aniInfo.loop);
              }
              return;
            }
            this._updateCache(dt);
          } else {
            this._instance.updateAnimation(dt);
          }
        }
        _updateCache(dt) {
          const frameCache = this._animCache;
          if (!frameCache.isInited()) {
            return;
          }
          const frames = frameCache.frames;
          const frameTime = SkeletonCache.FrameTime;
          // Animation Start, the event different from _customMaterial inner event,
          // It has no event object.
          if (this._accTime === 0 && this._playCount === 0) {
            this._startEntry.animation.name = this._animationName;
            if (this._listener && this._listener.start) {
              this._listener.start(this._startEntry);
            }
          }
          this._accTime += dt;
          let frameIdx = Math.floor(this._accTime / frameTime);
          if (!frameCache.isCompleted) {
            frameCache.updateToFrame(frameIdx);
          }
          this._curFrame = frames[frameIdx];
          if (this._curFrame !== undefined) {
            this.attachUtil.updateSkeletonBones(this._curFrame.boneInfos);
          }
          if (frameCache.isCompleted && frameIdx >= frames.length) {
            this._playCount++;
            if (this._playTimes > 0 && this._playCount >= this._playTimes) {
              // set frame to end frame.
              this._curFrame = frames[frames.length - 1];
              this._accTime = 0;
              this._playCount = 0;
              this._isAniComplete = true;
              this._emitCacheCompleteEvent();
              return;
            }
            this._accTime = 0;
            frameIdx = 0;
            this._curFrame = frames[frameIdx];
            this._emitCacheCompleteEvent();
          }
        }
        _emitCacheCompleteEvent() {
          if (!this._listener) return;
          this._endEntry.animation.name = this._animationName;
          if (this._listener.complete) this._listener.complete(this._endEntry);
          if (this._listener.end) this._listener.end(this._endEntry);
        }

        /**
         * @engineInternal
         */
        updateRenderData() {
          if (this.isAnimationCached()) {
            if (!this._curFrame) return null;
            const model = this._curFrame.model;
            return model;
          } else {
            const model = this._instance.updateRenderData();
            return model;
          }
        }
        _flushAssembler() {
          const assembler = Skeleton.Assembler.getAssembler(this);
          if (this._assembler !== assembler) {
            this._assembler = assembler;
          }
          if (this._skeleton && this._assembler && this._assembler.createData) {
            this._renderData = this._assembler.createData(this);
            this._markForUpdateRenderData();
            this._updateColor();
          }
        }
        _render(batcher) {
          let indicesCount = 0;
          if (this.renderData && this._drawList.length > 0) {
            const rd = this.renderData;
            const chunk = rd.chunk;
            const accessor = chunk.vertexAccessor;
            const meshBuffer = rd.getMeshBuffer();
            const origin = meshBuffer.indexOffset;
            // Fill index buffer
            for (let i = 0; i < this._drawList.length; i++) {
              const dc = this._drawList.data[i];
              if (dc.texture) {
                batcher.commitMiddleware(this, meshBuffer, origin + dc.indexOffset, dc.indexCount, dc.texture, dc.material, this._enableBatch);
              }
              indicesCount += dc.indexCount;
            }
            const subIndices = rd.indices.subarray(0, indicesCount);
            accessor.appendIndices(chunk.bufferId, subIndices);
            accessor.getMeshBuffer(chunk.bufferId).setDirty();
          }
        }

        /**
         * @engineInternal
         */
        requestDrawData(material, textureUUID, indexOffset, indexCount) {
          const draw = this._drawList.add();
          draw.material = material;
          let tex = assetManager.assets.get(textureUUID);
          if (!tex) {
            var _this$skeletonData;
            // read from skeleton's texture map
            tex = (_this$skeletonData = this.skeletonData) == null ? void 0 : _this$skeletonData.textures.find(t => t.uuid === textureUUID || t.getId() === textureUUID);
            if (!tex) {
              var _this$_slotTextures2;
              // read from setSlotTexture's cache
              tex = (_this$_slotTextures2 = this._slotTextures) == null ? void 0 : _this$_slotTextures2.get(textureUUID);
            }
          }
          draw.texture = tex;
          draw.indexOffset = indexOffset;
          draw.indexCount = indexCount;
          return draw;
        }
        _updateBuiltinMaterial() {
          const material = builtinResMgr.get('default-spine-material');
          return material;
        }
        /**
         * @engineInternal
         */
        updateMaterial() {
          let mat;
          if (this._customMaterial) mat = this._customMaterial;else mat = this._updateBuiltinMaterial();
          this.setSharedMaterial(mat, 0);
          this._cleanMaterialCache();
        }
        getMaterialTemplate() {
          if (this.customMaterial !== null) return this.customMaterial;
          if (this.material) return this.material;
          this.updateMaterial();
          return this.material;
        }
        _cleanMaterialCache() {
          for (const val in this._materialCache) {
            this._materialCache[val].destroy();
          }
          this._materialCache = {};
        }

        /**
         * @engineInternal
         */
        getMaterialForBlendAndTint(src, dst, type) {
          const key = `${type}/${src}/${dst}`;
          let inst = this._materialCache[key];
          if (inst) {
            return inst;
          }
          if (this._customMaterialInstance) {
            inst = this._customMaterialInstance;
          } else {
            const material = this.getMaterialTemplate();
            const matInfo = {
              parent: material,
              subModelIdx: 0,
              owner: this
            };
            inst = new MaterialInstance(matInfo);
          }
          this._materialCache[key] = inst;
          inst.overridePipelineStates({
            blendState: {
              blendColor: Color.WHITE,
              targets: [{
                blendEq: BlendOp.ADD,
                blendAlphaEq: BlendOp.ADD,
                blendSrc: src,
                blendDst: dst,
                blendSrcAlpha: src,
                blendDstAlpha: dst
              }]
            }
          });
          let useTwoColor = false;
          if (type === SpineMaterialType.TWO_COLORED) {
            useTwoColor = true;
          }
          const useLocal = !this._enableBatch;
          inst.recompileShaders({
            TWO_COLORED: useTwoColor,
            USE_LOCAL: useLocal
          });
          return inst;
        }

        // update animation list for editor
        _updateAnimEnum() {
          let animEnum;
          if (isSkeletonDataValid(this.skeletonData)) {
            animEnum = this.skeletonData.getAnimsEnum();
          } else {
            animEnum = SpineDefaultAnimsEnum;
          }

          // reset enum type
          this._enumAnimations = Enum({});
          Object.assign(this._enumAnimations, animEnum);
          Enum.update(this._enumAnimations);
          setPropertyEnumType(this, '_animationIndex', this._enumAnimations);
        }
        // update skin list for editor
        _updateSkinEnum() {
          let skinEnum;
          if (isSkeletonDataValid(this.skeletonData)) {
            skinEnum = this.skeletonData.getSkinsEnum();
          } else {
            skinEnum = DefaultSkinsEnum;
          }
          this._enumSkins = Enum({});
          Object.assign(this._enumSkins, skinEnum);
          Enum.update(this._enumSkins);
          setPropertyEnumType(this, '_defaultSkinIndex', this._enumSkins);
        }
        _refreshInspector() {
          if (EDITOR_NOT_IN_PREVIEW) {
            // update inspector
            this._updateAnimEnum();
            this._updateSkinEnum();
            // TODO: refresh inspector
            // Editor.Utils.refreshSelectedInspector('node', this.node.uuid);
          }
        }

        /**
         * @en Call this method to destroy the rendering data.
         * @zh 调用该方法销毁渲染数据。
         */
        destroyRenderData() {
          this._drawList.reset();
          super.destroyRenderData();
        }
        createRenderEntity() {
          const renderEntity = new RenderEntity(RenderEntityType.DYNAMIC);
          renderEntity.setUseLocal(true);
          return renderEntity;
        }
        /**
         * @en Mark to re-update the rendering data, usually used to force refresh the display.
         * @zh 标记重新更新渲染数据，一般用于强制刷新显示。
         */
        markForUpdateRenderData(enable = true) {
          super._markForUpdateRenderData(enable);
          if (this._debugRenderer) {
            this._debugRenderer._markForUpdateRenderData(enable);
          }
        }

        /**
         * @engineInternal
         */
        syncAttachedNode() {
          // sync attached node matrix
          this.attachUtil._syncAttachedNode();
        }

        /**
         * @en Whether in cached mode.
         * @zh 当前是否处于缓存模式。
         */
        isAnimationCached() {
          if (EDITOR_NOT_IN_PREVIEW) return false;
          return this._cacheMode !== SpineAnimationCacheMode.REALTIME;
        }
        /**
         * @en
         * It's best to set cache mode before set property 'dragonAsset', or will waste some cpu time.
         * If set the mode in editor, then no need to worry about order problem.
         * @zh
         * 若想切换渲染模式，最好在设置'dragonAsset'之前，先设置好渲染模式，否则有运行时开销。
         * 若在编辑中设置渲染模式，则无需担心设置次序的问题。
         *
         * @example
         * skeleton.setAnimationCacheMode(sp.Skeleton.AnimationCacheMode.SHARED_CACHE);
         */
        setAnimationCacheMode(cacheMode) {
          if (this._preCacheMode !== cacheMode) {
            this._cacheMode = cacheMode;
            this._preCacheMode = cacheMode;
            if (this._instance) {
              this._instance.isCache = this.isAnimationCached();
            }
            this._updateSkeletonData();
            this._markForUpdateRenderData();
          }
        }

        /**
         * @en Sets the bones and slots to the setup pose.
         * @zh 还原到起始动作。
         */
        setToSetupPose() {
          if (this._skeleton) {
            this._skeleton.setToSetupPose();
          }
        }

        /**
         * @en
         * Sets the bones to the setup pose,
         * using the values from the `BoneData` list in the `SkeletonData`.
         * @zh
         * 设置 bone 到起始动作。
         * 使用 SkeletonData 中的 BoneData 列表中的值。
         */
        setBonesToSetupPose() {
          if (this._skeleton) {
            this._skeleton.setBonesToSetupPose();
          }
        }

        /**
         * @en
         * Sets the slots to the setup pose,
         * using the values from the `SlotData` list in the `SkeletonData`.
         * @zh
         * 设置 slot 到起始动作。
         * 使用 SkeletonData 中的 SlotData 列表中的值。
         */
        setSlotsToSetupPose() {
          if (this._skeleton) {
            this._skeleton.setSlotsToSetupPose();
          }
        }

        /**
         * @en
         * Invalidates the animation cache, which is then recomputed on each frame.
         * @zh
         * 使动画缓存失效，之后会在每帧重新计算。
         * @method invalidAnimationCache
         */
        invalidAnimationCache() {
          if (!this.isAnimationCached()) return;
          if (this._skeletonCache) {
            this._skeletonCache.invalidAnimationCache(this._skeletonData.uuid);
          }
        }

        /**
         * @en
         * Finds a bone by name.
         * This does a string comparison for every bone.<br>
         * Returns a {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.Bone object.
         * @zh
         * 通过名称查找 bone。
         * 这里对每个 bone 的名称进行了对比。<br>
         * 返回一个 {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.Bone 对象。
         *
         * @param boneName @en The name of bone. @zh 骨骼名称。
         */
        findBone(boneName) {
          if (this._skeleton) {
            return this._skeleton.findBone(boneName);
          }
          return null;
        }

        /**
         * @en
         * Finds a slot by name. This does a string comparison for every slot.<br>
         * Returns a {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.Slot object.
         * @zh
         * 通过名称查找 slot。这里对每个 slot 的名称进行了比较。<br>
         * 返回一个 {{#crossLinkModule "sp.spine"}}sp.spine{{/crossLinkModule}}.Slot 对象。
         *
         * @param slotName @en The name of slot. @zh 插槽名称。
         */
        findSlot(slotName) {
          if (this._skeleton) {
            return this._skeleton.findSlot(slotName);
          }
          return null;
        }

        // ANIMATION
        /**
         * @en
         * Mix applies all keyframe values,
         * interpolated for the specified time and mixed with the current values.
         * @zh 为所有关键帧设定混合及混合时间（从当前值开始差值）。
         * @param fromAnimation @en Mix start animation. @zh 过渡起始动画。
         * @param toAnimation @en Mix end animation. @zh 过渡结束动画。
         * @param duration @ Time of animation mix. @zh 动画过渡时间。
         */
        setMix(fromAnimation, toAnimation, duration) {
          if (this.isAnimationCached()) {
            warnID(16415);
            return;
          }
          if (this._state) {
            this._instance.setMix(fromAnimation, toAnimation, duration);
            //this._state.data.setMix(fromAnimation, toAnimation, duration);
          }
        }

        /**
         * @en Clears all tracks of animation state.
         * @zh 清除所有 track 的动画状态。
         */
        clearTracks() {
          if (this.isAnimationCached()) {
            warnID(16416);
          } else if (this._state) {
            this._state.clearTracks();
            this.setToSetupPose();
          }
        }

        /**
         * @en Clears track of animation state by trackIndex.
         * @zh 清除出指定 track 的动画状态。
         * @param trackIndex @en Index of track. @zh 动画通道索引。
         */
        clearTrack(trackIndex) {
          if (this.isAnimationCached()) {
            warnID(16417);
          } else if (this._state) {
            this._state.clearTrack(trackIndex);
            if (EDITOR_NOT_IN_PREVIEW) {
              this._state.update(0);
            }
          }
        }

        /**
         * @en Computes the world SRT from the local SRT for each bone.
         * @zh 重新更新所有骨骼的世界 Transform，
         * 当获取 bone 的数值未更新时，即可使用该函数进行更新数值。
         * @example
         * var bone = spine.findBone('head');
         * cc.log(bone.worldX); // return 0;
         * spine.updateWorldTransform();
         * bone = spine.findBone('head');
         * cc.log(bone.worldX); // return -23.12;
         */
        updateWorldTransform() {
          if (!this.isAnimationCached()) return;
          if (this._skeleton) {
            this._skeleton.updateWorldTransform();
          }
        }
        _verifySockets(sockets) {
          for (let i = 0, l = sockets.length; i < l; i++) {
            const target = sockets[i].target;
            if (target) {
              if (!target.parent || target.parent !== this.node) {
                error(`Target node ${target.name} is expected to be a direct child of ${this.node.name}`);
                continue;
              }
            }
          }
          const uniqueSocketNode = new Map();
          sockets.forEach(x => {
            if (x.target) {
              if (uniqueSocketNode.get(x.target)) {
                error(`Target node ${x.target.name} has existed.`);
              } else {
                uniqueSocketNode.set(x.target, true);
              }
            }
          });
        }
        _updateSocketBindings() {
          if (!this._skeleton) return;
          this._socketNodes.clear();
          for (let i = 0, l = this._sockets.length; i < l; i++) {
            const socket = this._sockets[i];
            if (socket.path && socket.target) {
              const boneIdx = this._cachedSockets.get(socket.path);
              if (boneIdx == null || boneIdx < 0) {
                error(`Skeleton data does not contain path ${socket.path}`);
                continue;
              }
              this._socketNodes.set(boneIdx, socket.target);
            }
          }
        }
        _indexBoneSockets() {
          if (!this._skeleton) {
            return;
          }
          this._cachedSockets.clear();
          const bones = this._skeleton.bones;
          const getBoneName = bone => {
            if (bone.parent == null) return bone.data.name || '<Unamed>';
            return `${getBoneName(bones[bone.parent.data.index])}/${bone.data.name}`;
          };
          for (let i = 0, l = bones.length; i < l; i++) {
            const bd = bones[i].data;
            const boneName = getBoneName(bones[i]);
            this._cachedSockets.set(boneName, bd.index);
          }
        }

        /**
         * @en Query all bones that can attach sockets.
         * @zh 查询所有可以添加挂点的所有骨骼。
         * @return String typed array of bones's path.
         */
        querySockets() {
          if (!this._skeleton) {
            return [];
          }
          if (this._cachedSockets.size === 0) {
            this._indexBoneSockets();
          }
          if (this._cachedSockets.size > 0) {
            return Array.from(this._cachedSockets.keys()).sort();
          }
          return [];
        }

        // if change use tint mode, just clear material cache
        _updateUseTint() {
          this._cleanMaterialCache();
          this.destroyRenderData();
          if (!JSB) {
            if (!this.isAnimationCached()) {
              this._instance.setUseTint(this._useTint);
            }
          }
          const assembler = this._assembler;
          if (assembler && assembler.createData && this._skeleton) {
            this._renderData = assembler.createData(this);
            this._markForUpdateRenderData();
          }
        }

        // if change use batch mode, just clear material cache
        _updateBatch() {
          this._cleanMaterialCache();
          this._markForUpdateRenderData();
        }
        _updateDebugDraw() {
          if (this.debugBones || this.debugSlots || this.debugMesh) {
            if (!this._debugRenderer) {
              let debugDrawNode = new Node('DEBUG_DRAW_NODE');
              debugDrawNode.layer = this.node.layer;
              debugDrawNode.hideFlags |= CCObjectFlags.DontSave | CCObjectFlags.HideInHierarchy;
              let debugDraw = null;
              try {
                debugDraw = debugDrawNode.addComponent('cc.Graphics');
                debugDraw.lineWidth = 5;
                debugDraw.strokeColor = new Color(255, 0, 0, 255);
                this._debugRenderer = debugDraw;
                debugDrawNode.parent = this.node;
                this.node.on(NodeEventType.LAYER_CHANGED, this._applyLayer, this);
              } catch (e) {
                errorID(4501, e.message);
                debugDrawNode.destroy();
                debugDrawNode = null;
              }
            }
            if (this.isAnimationCached()) {
              warnID(16418);
            } else if (!JSB) {
              this._instance.setDebugMode(true);
            }
          } else if (this._debugRenderer) {
            this.node.off(NodeEventType.LAYER_CHANGED, this._applyLayer, this);
            this._debugRenderer.node.destroy();
            this._debugRenderer = null;
            if (!this.isAnimationCached()) {
              if (this._instance) {
                this._instance.setDebugMode(false);
              }
            }
          }
        }
        _updateUITransform() {
          const uiTrans = this.node._getUITransformComp();
          const skeletonData = this._runtimeData;
          if (!skeletonData) {
            uiTrans.setContentSize(100, 100);
            uiTrans.anchorX = 0.5;
            uiTrans.anchorX = 0.5;
            return;
          }
          const width = skeletonData.width;
          const height = skeletonData.height;
          if (width && height) {
            uiTrans.setContentSize(width, height);
            if (width !== 0) uiTrans.anchorX = Math.abs(skeletonData.x) / width;
            if (height !== 0) uiTrans.anchorY = Math.abs(skeletonData.y) / height;
          }
        }

        /**
         * @engineInternal
         */
        _updateColor() {
          const self = this;
          const uiProps = self.node._uiProps;
          const tempColor = self._tempColor;
          const color = self._color;
          const parentOpacity = self.node.parent ? self.node.parent._uiProps.opacity : 1.0;
          //Calculate the final opacity here, because the first frame affected by parent's opacity
          const a = uiProps.localOpacity * parentOpacity * color.a / 255;
          if (tempColor.r === color.r && tempColor.g === color.g && tempColor.b === color.b && tempColor.a === a) {
            return;
          }
          uiProps.colorDirty = true;
          tempColor.r = color.r;
          tempColor.g = color.g;
          tempColor.b = color.b;
          tempColor.a = a;
          const r = color.r / 255.0;
          const g = color.g / 255.0;
          const b = color.b / 255.0;
          this._instance.setColor(r, g, b, a);
        }

        /**
         * @version 3.8, deprecated since spine 4.2
         * @en Sets vertex effect delegate.
         * @zh 设置顶点特效动画代理。
         * @param effectDelegate @en Vertex effect delegate. @zh 顶点特效代理。
         */
        setVertexEffectDelegate(effectDelegate) {
          if (SPINE_VERSION !== '3.8') {
            warnID(16409);
            return;
          }
          if (!this._instance) {
            return;
          }
          if (!effectDelegate) {
            this._instance.clearEffect();
            return;
          }
          const effectType = effectDelegate == null ? void 0 : effectDelegate.getEffectType();
          if (effectType === 'jitter') {
            const jitterEffect = effectDelegate == null ? void 0 : effectDelegate.getJitterVertexEffect();
            this._instance.setJitterEffect(jitterEffect);
          } else if (effectType === 'swirl') {
            const swirlEffect = effectDelegate == null ? void 0 : effectDelegate.getJitterVertexEffect();
            this._instance.setSwirlEffect(swirlEffect);
          }
        }
        _ensureListener() {
          if (!this._listener) {
            this._listener = new TrackEntryListeners();
            this._eventListenerID = TrackEntryListeners.addListener(this._listener);
            this._instance.setListener(this._eventListenerID);
          }
        }

        /**
         * @en Sets the start event listener.
         * @zh 用来设置开始播放动画的事件监听。
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setStartListener(listener) {
          this._ensureListener();
          this._listener.start = listener;
        }

        /**
         * @en Sets the interrupt event listener.
         * @zh 用来设置动画被打断的事件监听。
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setInterruptListener(listener) {
          this._ensureListener();
          this._listener.interrupt = listener;
        }

        /**
         * @en Sets the end event listener.
         * @zh 用来设置动画播放完后的事件监听。
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setEndListener(listener) {
          this._ensureListener();
          this._listener.end = listener;
        }

        /**
         * @en Sets the dispose event listener.
         * @zh 用来设置动画将被销毁的事件监听。
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setDisposeListener(listener) {
          this._ensureListener();
          this._listener.dispose = listener;
        }

        /**
         * @en Sets the complete event listener.
         * @zh 用来设置动画播放一次循环结束后的事件监听。
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setCompleteListener(listener) {
          this._ensureListener();
          this._listener.complete = listener;
        }

        /**
         * @en Sets the animation event listener.
         * @zh 用来设置动画播放过程中帧事件的监听。
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setEventListener(listener) {
          this._ensureListener();
          this._listener.event = listener;
        }

        /**
         * @en Sets the start event listener for specified TrackEntry.
         * @zh 用来为指定的 TrackEntry 设置动画开始播放的事件监听。
         * @param entry @en Animation track entry. @zh Track entry。
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setTrackStartListener(entry, listener) {
          TrackEntryListeners.getListeners(entry, this._instance).start = listener;
        }

        /**
         * @en Sets the interrupt event listener for specified TrackEntry.
         * @zh 用来为指定的 TrackEntry 设置动画被打断的事件监听。
         * @param entry
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setTrackInterruptListener(entry, listener) {
          TrackEntryListeners.getListeners(entry, this._instance).interrupt = listener;
        }

        /**
         * @en Sets the end event listener for specified TrackEntry.
         * @zh 用来为指定的 TrackEntry 设置动画播放结束的事件监听。
         * @param entry
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setTrackEndListener(entry, listener) {
          TrackEntryListeners.getListeners(entry, this._instance).end = listener;
        }

        /**
         * @en Sets the dispose event listener for specified TrackEntry.
         * @zh 用来为指定的 TrackEntry 设置动画即将被销毁的事件监听。
         * @param entry
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setTrackDisposeListener(entry, listener) {
          TrackEntryListeners.getListeners(entry, this._instance).dispose = listener;
        }

        /**
         * @en Sets the complete event listener for specified TrackEntry.
         * @zh 用来为指定的 TrackEntry 设置动画一次循环播放结束的事件监听。
         * @param entry @en AnimationState track. @zn 动画轨道属性。
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setTrackCompleteListener(entry, listener) {
          const onComplete = trackEntry => {
            const animEnd = math.equals(trackEntry.animationEnd, -1.0) ? trackEntry.animation.duration : trackEntry.animationEnd;
            const duration = animEnd - trackEntry.animationStart;
            if (duration > 0) {
              const loopCount = trackEntry.loop ? Math.floor(trackEntry.trackTime / duration) : 1;
              listener(trackEntry, loopCount);
              // this._instance.setListener(listenerID, spine.EventType.event);
              // this._listener!.event = listener;
            } else {
              warnID(16420);
            }
          };
          TrackEntryListeners.getListeners(entry, this._instance).complete = onComplete;
        }

        /**
         * @en Sets the event listener for specified TrackEntry.
         * @zh 用来为指定的 TrackEntry 设置动画帧事件的监听。
         * @param entry
         * @param listener @en Listener for registering callback functions. @zh 监听器对象，可注册回调方法。
         */
        setTrackEventListener(entry, listener) {
          TrackEntryListeners.getListeners(entry, this._instance).event = listener;
        }

        /**
         * @engineInternal
        */
        getDebugShapes() {
          return this._instance.getDebugShapes();
        }

        /**
         * @en Set texture for slot, this function can be use to changing local skin.
         * @zh 为 slot 设置贴图纹理，可使用该该方法实现局部换装功能。
         * @param slotName @en The name of slot. @zh Slot 名字。
         * @param tex2d @en The texture will show on the slot. @zh 在该 Slot 上显示的 2D 纹理。
         * @param createNew @en Whether to create new Attachment. If value is false, all sp.Skeleton share the
         * same attachment will be changed. @zh 是否需要创建新的 attachment，如果值为 false, 所有共享相同 attachment
         * 的组件都将受影响。
         */
        setSlotTexture(slotName, tex2d, createNew) {
          if (this.isAnimationCached()) {
            error(`Cached mode can't change texture of slot`);
            return;
          }
          const slot = this.findSlot(slotName);
          if (!slot) {
            error(`No slot named:${slotName}`);
            return;
          }
          const width = tex2d.width;
          const height = tex2d.height;
          const createNewAttachment = createNew || false;
          this._instance.resizeSlotRegion(slotName, width, height, createNewAttachment);
          let uuid = tex2d.uuid;
          if (!uuid) {
            uuid = tex2d.getId();
          }
          this._instance.setSlotTexture(slotName, uuid);
          if (!this._slotTextures) this._slotTextures = new Map();
          this._slotTextures.set(uuid, tex2d);
        }
        _destroySkeletonInfo(skeletonCache) {
          if (skeletonCache && this._skeletonInfo) {
            skeletonCache.destroySkeleton(this._skeletonInfo.assetUUID);
            this._skeletonInfo = null;
          }
        }
        _applyLayer() {
          if (this._debugRenderer) {
            this._debugRenderer.node.layer = this.node.layer;
          }
        }
      }, _Skeleton.SpineSocket = SpineSocket, _Skeleton.AnimationCacheMode = SpineAnimationCacheMode, _Skeleton), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "_skeletonData", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "defaultSkin", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "defaultAnimation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class4.prototype, "_premultipliedAlpha", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class4.prototype, "_timeScale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class4.prototype, "_preCacheMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return SpineAnimationCacheMode.UNSET;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class4.prototype, "_cacheMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return SpineAnimationCacheMode.REALTIME;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class4.prototype, "_sockets", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class4.prototype, "_useTint", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class4.prototype, "_debugMesh", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class4.prototype, "_debugBones", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class4.prototype, "_debugSlots", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class4.prototype, "_enableBatch", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "skeletonData", [editable, _dec6], Object.getOwnPropertyDescriptor(_class4.prototype, "skeletonData"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "_defaultSkinIndex", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class4.prototype, "_defaultSkinIndex"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "_animationIndex", [_dec9, _dec0], Object.getOwnPropertyDescriptor(_class4.prototype, "_animationIndex"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "defaultCacheMode", [editable, _dec1], Object.getOwnPropertyDescriptor(_class4.prototype, "defaultCacheMode"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "premultipliedAlpha", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "premultipliedAlpha"), _class4.prototype), _descriptor14 = _applyDecoratedDescriptor(_class4.prototype, "loop", [_dec10, serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "timeScale", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "timeScale"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "useTint", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "useTint"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "enableBatch", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "enableBatch"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "sockets", [_dec11], Object.getOwnPropertyDescriptor(_class4.prototype, "sockets"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "debugSlots", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "debugSlots"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "debugBones", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "debugBones"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "debugMesh", [editable], Object.getOwnPropertyDescriptor(_class4.prototype, "debugMesh"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "customMaterial", [override, _dec12, _dec13], Object.getOwnPropertyDescriptor(_class4.prototype, "customMaterial"), _class4.prototype), _class4)) || _class3) || _class3) || _class3) || _class3));
      legacyCC.internal.SpineSkeleton = Skeleton;
    }
  };
});