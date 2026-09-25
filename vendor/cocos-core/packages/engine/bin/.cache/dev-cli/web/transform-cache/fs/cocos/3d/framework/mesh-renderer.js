System.register("q-bundled:///fs/cocos/3d/framework/mesh-renderer.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/data/decorators/index.js", "../assets/mesh.js", "../../core/index.js", "../../render-scene/index.js", "../models/morph-model.js", "../../scene-graph/node-enum.js", "../../misc/model-renderer.js", "../../scene-graph/node-event.js", "../../asset/asset-manager/builtin-res-mgr.js", "../../core/settings.js", "../reflection-probe/reflection-probe-enum.js", "../../rendering/pass-phase.js", "../../rendering/define.js", "../../rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var JSB, displayOrder, group, range, Mesh, Vec4, Enum, cclegacy, CCBoolean, CCFloat, assertIsTrue, _decorator, CCInteger, EventTarget, warnID, scene, MorphModel, MobilityMode, TransformBit, ModelRenderer, NodeEventType, builtinResMgr, settings, SettingsCategory, ReflectionProbeType, getPhaseID, isEnableEffect, getPipelineSceneData, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _ModelBakeSettings, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _class3, _class4, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _MeshRenderer, ccclass, help, executeInEditMode, executionOrder, menu, visible, type, formerlySerializedAs, serializable, editable, disallowAnimation, _phaseID, ModelShadowCastingMode, ModelShadowReceivingMode, ModelBakeSettingsEvent, ModelBakeSettings, MeshRenderer;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function getSkinPassIndex(subModel) {
    const passes = subModel.passes;
    const r = cclegacy.rendering;
    if (isEnableEffect()) _phaseID = r.getPhaseID(r.getPassID('specular-pass'), 'default');
    for (let k = 0; k < passes.length; k++) {
      if ((!r || !r.enableEffectImport) && passes[k].phase === _phaseID || isEnableEffect() && passes[k].phaseID === _phaseID) {
        return k;
      }
    }
    return -1;
  }

  /**
   * @en Shadow projection mode.
   * @zh 阴影投射方式。
   */
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreDataDecoratorsIndexJs) {
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      group = _coreDataDecoratorsIndexJs.group;
      range = _coreDataDecoratorsIndexJs.range;
    }, function (_assetsMeshJs) {
      Mesh = _assetsMeshJs.Mesh;
    }, function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
      Enum = _coreIndexJs.Enum;
      cclegacy = _coreIndexJs.cclegacy;
      CCBoolean = _coreIndexJs.CCBoolean;
      CCFloat = _coreIndexJs.CCFloat;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      _decorator = _coreIndexJs._decorator;
      CCInteger = _coreIndexJs.CCInteger;
      EventTarget = _coreIndexJs.EventTarget;
      warnID = _coreIndexJs.warnID;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_modelsMorphModelJs) {
      MorphModel = _modelsMorphModelJs.MorphModel;
    }, function (_sceneGraphNodeEnumJs) {
      MobilityMode = _sceneGraphNodeEnumJs.MobilityMode;
      TransformBit = _sceneGraphNodeEnumJs.TransformBit;
    }, function (_miscModelRendererJs) {
      ModelRenderer = _miscModelRendererJs.ModelRenderer;
    }, function (_sceneGraphNodeEventJs) {
      NodeEventType = _sceneGraphNodeEventJs.NodeEventType;
    }, function (_assetAssetManagerBuiltinResMgrJs) {
      builtinResMgr = _assetAssetManagerBuiltinResMgrJs.builtinResMgr;
    }, function (_coreSettingsJs) {
      settings = _coreSettingsJs.settings;
      SettingsCategory = _coreSettingsJs.SettingsCategory;
    }, function (_reflectionProbeReflectionProbeEnumJs) {
      ReflectionProbeType = _reflectionProbeReflectionProbeEnumJs.ReflectionProbeType;
    }, function (_renderingPassPhaseJs) {
      getPhaseID = _renderingPassPhaseJs.getPhaseID;
    }, function (_renderingDefineJs) {
      isEnableEffect = _renderingDefineJs.isEnableEffect;
    }, function (_renderingPipelineSceneDataUtilsJs) {
      getPipelineSceneData = _renderingPipelineSceneDataUtilsJs.getPipelineSceneData;
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
      ({
        ccclass,
        help,
        executeInEditMode,
        executionOrder,
        menu,
        visible,
        type,
        formerlySerializedAs,
        serializable,
        editable,
        disallowAnimation
      } = _decorator);
      _phaseID = getPhaseID('specular-pass');
      ModelShadowCastingMode = Enum({
        /**
         * @en Disable shadow projection.
         * @zh 不投射阴影。
         */
        OFF: 0,
        /**
         * @en Enable shadow projection.
         * @zh 开启阴影投射。
         */
        ON: 1
      });
      /**
       * @en Shadow receive mode.
       * @zh 阴影接收方式。
       */
      ModelShadowReceivingMode = Enum({
        /**
         * @en Disable shadow receiving.
         * @zh 不接收阴影。
         */
        OFF: 0,
        /**
         * @en Enable shadow receiving.
         * @zh 开启阴影投射。
         */
        ON: 1
      });
      ModelBakeSettingsEvent = /*#__PURE__*/function (ModelBakeSettingsEvent) {
        /**
         * @en The event which will be triggered when the useLightProbe is changed.
         * @zh useLightProbe属性修改时触发的事件
         */
        ModelBakeSettingsEvent["USE_LIGHT_PROBE_CHANGED"] = "use_light_probe_changed";
        /**
         * @en The event which will be triggered when the reflectionProbe is changed.
         * @zh reflectionProbe 属性修改时触发的事件
         */
        ModelBakeSettingsEvent["REFLECTION_PROBE_CHANGED"] = "reflection_probe_changed";
        /**
         * @en The event which will be triggered when the bakeToReflectionProbe is changed.
         * @zh bakeToReflectionProbe 属性修改时触发的事件
         */
        ModelBakeSettingsEvent["BAKE_TO_REFLECTION_PROBE_CHANGED"] = "bake_to_reflection_probe_changed";
        return ModelBakeSettingsEvent;
      }(ModelBakeSettingsEvent || {});
      /**
       * @en Model's bake settings.
       * @zh 模型烘焙设置
       */
      ModelBakeSettings = (_dec = ccclass('cc.ModelBakeSettings'), _dec2 = formerlySerializedAs('_recieveShadow'), _dec3 = group({
        id: 'LightMap',
        name: 'i18n:ENGINE.classes.cc.ModelBakeSettings.groups.LightMap.displayName',
        displayOrder: 0,
        style: 'section'
      }), _dec4 = group({
        id: 'LightMap',
        name: 'i18n:ENGINE.classes.cc.ModelBakeSettings.groups.LightMap.displayName'
      }), _dec5 = group({
        id: 'LightMap',
        name: 'i18n:ENGINE.classes.cc.ModelBakeSettings.groups.LightMap.displayName'
      }), _dec6 = group({
        id: 'LightMap',
        name: 'i18n:ENGINE.classes.cc.ModelBakeSettings.groups.LightMap.displayName'
      }), _dec7 = type(CCInteger), _dec8 = range([0, 1024]), _dec9 = group({
        id: 'LightProbe',
        name: 'i18n:ENGINE.classes.cc.ModelBakeSettings.groups.LightProbe.displayName',
        displayOrder: 1,
        style: 'section'
      }), _dec0 = type(CCBoolean), _dec1 = group({
        id: 'LightProbe',
        name: 'i18n:ENGINE.classes.cc.ModelBakeSettings.groups.LightProbe.displayName'
      }), _dec10 = type(CCBoolean), _dec11 = group({
        id: 'ReflectionProbe',
        name: 'i18n:ENGINE.classes.cc.ModelBakeSettings.groups.ReflectionProbe.displayName',
        displayOrder: 2,
        style: 'section'
      }), _dec12 = type(Enum(ReflectionProbeType)), _dec13 = group({
        id: 'ReflectionProbe',
        name: 'i18n:ENGINE.classes.cc.ModelBakeSettings.groups.ReflectionProbe.displayName'
      }), _dec14 = type(CCBoolean), _dec(_class = (_class2 = (_ModelBakeSettings = class ModelBakeSettings extends EventTarget {
        constructor() {
          super();
          _initializerDefineProperty(this, "texture", _descriptor, this);
          _initializerDefineProperty(this, "uvParam", _descriptor2, this);
          _initializerDefineProperty(this, "_bakeable", _descriptor3, this);
          _initializerDefineProperty(this, "_castShadow", _descriptor4, this);
          _initializerDefineProperty(this, "_receiveShadow", _descriptor5, this);
          _initializerDefineProperty(this, "_lightmapSize", _descriptor6, this);
          _initializerDefineProperty(this, "_useLightProbe", _descriptor7, this);
          _initializerDefineProperty(this, "_bakeToLightProbe", _descriptor8, this);
          _initializerDefineProperty(this, "_reflectionProbeType", _descriptor9, this);
          _initializerDefineProperty(this, "_bakeToReflectionProbe", _descriptor0, this);
          this.probeCubemap = null;
          this.probeBlendCubemap = null;
          this.probePlanarmap = null;
        }

        /**
         * @en Whether the model is static and bake-able with light map.
         * Notice: the model's vertex data must have the second UV attribute to enable light map baking.
         * @zh 模型是否是静态的并可以烘培光照贴图。
         * 注意：模型顶点数据必须包含第二套 UV 属性来支持光照贴图烘焙。
         */
        get bakeable() {
          return this._bakeable;
        }
        set bakeable(val) {
          this._bakeable = val;
        }

        /**
         * @en Whether to cast shadow in light map baking.
         * @zh 在光照贴图烘焙中是否投射阴影。
         */
        get castShadow() {
          return this._castShadow;
        }
        set castShadow(val) {
          this._castShadow = val;
        }

        /**
         * @en Whether to receive shadow in light map baking.
         * @zh 在光照贴图烘焙中是否接受阴影。
         */
        get receiveShadow() {
          return this._receiveShadow;
        }
        set receiveShadow(val) {
          this._receiveShadow = val;
        }

        /**
         * @en The lightmap size.
         * @zh 光照图大小。
         */
        get lightmapSize() {
          return this._lightmapSize;
        }
        set lightmapSize(val) {
          this._lightmapSize = val;
        }

        /**
         * @en Whether to use light probe which provides indirect light to dynamic objects.
         * @zh 模型是否使用光照探针，光照探针为动态物体提供间接光。
         */
        get useLightProbe() {
          return this._useLightProbe;
        }
        set useLightProbe(val) {
          this._useLightProbe = val;
          this.emit(ModelBakeSettingsEvent.USE_LIGHT_PROBE_CHANGED);
        }

        /**
         * @en Whether the model is used to calculate light probe
         * @zh 模型是否用于计算光照探针
         */
        get bakeToLightProbe() {
          return this._bakeToLightProbe;
        }
        set bakeToLightProbe(val) {
          this._bakeToLightProbe = val;
        }

        /**
         * @en Used to set whether to use the reflection probe or set probe's type.
         * @zh 用于设置是否使用反射探针或者设置反射探针的类型。
         */
        get reflectionProbe() {
          return this._reflectionProbeType;
        }
        set reflectionProbe(val) {
          this._reflectionProbeType = val;
          this.emit(ModelBakeSettingsEvent.REFLECTION_PROBE_CHANGED);
        }

        /**
         * @en Whether the model can be render by the reflection probe
         * @zh 模型是否能被反射探针渲染
         */
        get bakeToReflectionProbe() {
          return this._bakeToReflectionProbe;
        }
        set bakeToReflectionProbe(val) {
          this._bakeToReflectionProbe = val;
          this.emit(ModelBakeSettingsEvent.BAKE_TO_REFLECTION_PROBE_CHANGED);
        }
      }, _ModelBakeSettings.USE_LIGHT_PROBE_CHANGED = ModelBakeSettingsEvent.USE_LIGHT_PROBE_CHANGED, _ModelBakeSettings.REFLECTION_PROBE_CHANGED = ModelBakeSettingsEvent.REFLECTION_PROBE_CHANGED, _ModelBakeSettings.BAKE_TO_REFLECTION_PROBE_CHANGED = ModelBakeSettingsEvent.BAKE_TO_REFLECTION_PROBE_CHANGED, _ModelBakeSettings), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "texture", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "uvParam", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Vec4();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_bakeable", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_castShadow", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_receiveShadow", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_lightmapSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 64;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_useLightProbe", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_bakeToLightProbe", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_reflectionProbeType", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ReflectionProbeType.NONE;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_bakeToReflectionProbe", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "bakeable", [_dec3, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "bakeable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "castShadow", [_dec4, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "castShadow"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "receiveShadow", [_dec5, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "receiveShadow"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "lightmapSize", [_dec6, editable, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "lightmapSize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "useLightProbe", [_dec9, editable, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "useLightProbe"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bakeToLightProbe", [_dec1, editable, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "bakeToLightProbe"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "reflectionProbe", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "reflectionProbe"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bakeToReflectionProbe", [_dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "bakeToReflectionProbe"), _class2.prototype), _class2)) || _class);
      /**
       * @en Mesh renderer component for general 3d model rendering, it generates and link to a Model in the render scene.
       * It supports real time lighting and shadow, baked light map, and morph rendering.
       * @zh 用于通用模型渲染的网格渲染器组件，会创建并关联一个渲染场景中的模型对象。
       * 该组件支持实时光照和阴影，预烘焙光照贴图和形变网格渲染。
       */
      _export("MeshRenderer", MeshRenderer = (_dec15 = ccclass('cc.MeshRenderer'), _dec16 = help('i18n:cc.MeshRenderer'), _dec17 = executionOrder(100), _dec18 = menu('Mesh/MeshRenderer'), _dec19 = displayOrder(3), _dec20 = type(CCFloat), _dec21 = group({
        id: 'DynamicShadow',
        name: 'i18n:ENGINE.classes.cc.MeshRenderer.groups.DynamicShadow.displayName',
        displayOrder: 2,
        style: 'section'
      }), _dec22 = type(CCFloat), _dec23 = group({
        id: 'DynamicShadow',
        name: 'i18n:ENGINE.classes.cc.MeshRenderer.groups.DynamicShadow.displayName'
      }), _dec24 = type(ModelShadowCastingMode), _dec25 = group({
        id: 'DynamicShadow',
        name: 'i18n:ENGINE.classes.cc.MeshRenderer.groups.DynamicShadow.displayName'
      }), _dec26 = visible(false), _dec27 = group({
        id: 'DynamicShadow',
        name: 'i18n:ENGINE.classes.cc.MeshRenderer.groups.DynamicShadow.displayName'
      }), _dec28 = type(ModelShadowReceivingMode), _dec29 = visible(false), _dec30 = group({
        id: 'DynamicShadow',
        name: 'i18n:ENGINE.classes.cc.MeshRenderer.groups.DynamicShadow.displayName'
      }), _dec31 = type(Mesh), _dec32 = displayOrder(1), _dec33 = visible(function () {
        return !!(this.mesh && this.mesh.struct.morph && this.mesh.struct.morph.subMeshMorphs.some(subMeshMorph => !!subMeshMorph));
      }), _dec34 = type(CCBoolean), _dec15(_class3 = _dec16(_class3 = _dec17(_class3 = _dec18(_class3 = executeInEditMode(_class3 = (_class4 = (_MeshRenderer = class MeshRenderer extends ModelRenderer {
        /**
         * @en Local shadow bias for real time lighting.
         * @zh 实时光照下模型局部的阴影偏移。
         */
        get shadowBias() {
          return this._shadowBias;
        }
        set shadowBias(val) {
          this._shadowBias = val;
          this._updateShadowBias();
          this._onUpdateLocalShadowBiasAndProbeId();
        }

        /**
        * @en local shadow normal bias for real time lighting.
        * @zh 实时光照下模型局部的阴影法线偏移。
        */
        get shadowNormalBias() {
          return this._shadowNormalBias;
        }
        set shadowNormalBias(val) {
          this._shadowNormalBias = val;
          this._updateShadowNormalBias();
          this._onUpdateLocalShadowBiasAndProbeId();
        }

        /**
         * @en Shadow projection mode.
         * @zh 实时光照下阴影投射方式。
         */
        get shadowCastingMode() {
          return this._shadowCastingMode;
        }
        set shadowCastingMode(val) {
          this._shadowCastingMode = val;
          this._updateCastShadow();
        }
        get shadowCastingModeForInspector() {
          return this.shadowCastingMode === ModelShadowCastingMode.ON;
        }
        set shadowCastingModeForInspector(val) {
          this.shadowCastingMode = val === true ? ModelShadowCastingMode.ON : ModelShadowCastingMode.OFF;
        }

        /**
         * @en Is received direction Light.
         * @zh 是否接收平行光光照。
         * @param visibility @en direction light visibility. @zh 方向光的可见性。
         */
        onUpdateReceiveDirLight(visibility, forceClose = false) {
          if (!this._model) {
            return;
          }
          if (forceClose) {
            this._model.receiveDirLight = false;
            return;
          }
          if (this.node && (visibility & this.node.layer) === this.node.layer || visibility & this._model.visFlags) {
            this._model.receiveDirLight = true;
          } else {
            this._model.receiveDirLight = false;
          }
        }

        /**
         * @en receive shadow.
         * @zh 实时光照下是否接受阴影。
         */
        get receiveShadow() {
          return this._shadowReceivingMode;
        }
        set receiveShadow(val) {
          this._shadowReceivingMode = val;
          this._updateReceiveShadow();
        }
        get receiveShadowForInspector() {
          return this._shadowReceivingMode === ModelShadowReceivingMode.ON;
        }
        set receiveShadowForInspector(val) {
          this._shadowReceivingMode = val === true ? ModelShadowReceivingMode.ON : ModelShadowReceivingMode.OFF;
          this._updateReceiveShadow();
        }

        /**
         * @en Gets or sets the mesh of the model.
         * Note, when set, all morph targets' weights would be reset to zero.
         * @zh 获取或设置模型的网格数据。
         * 注意，设置时，所有形变目标的权重都将归零。
         */
        get mesh() {
          return this._mesh;
        }
        set mesh(val) {
          const old = this._mesh;
          const mesh = this._mesh = val;
          mesh == null || mesh.initialize();
          this._initSubMeshShapesWeights();
          this._watchMorphInMesh();
          this._onMeshChanged(old);
          this._updateModels();
          if (this.enabledInHierarchy) {
            this._attachToScene();
          }
          this._updateCastShadow();
          this._updateReceiveShadow();
          this._updateUseLightProbe();
          this._updateUseReflectionProbe();
          this._updateReceiveDirLight();
        }

        /**
         * @en Gets the model in [[RenderScene]].
         * @zh 获取渲染场景 [[RenderScene]] 中对应的模型。
         */
        get model() {
          return this._model;
        }

        /**
         * @en Whether to enable morph rendering.
         * @zh 是否启用形变网格渲染。
         */
        // eslint-disable-next-line func-names
        get enableMorph() {
          return this._enableMorph;
        }
        set enableMorph(value) {
          this._enableMorph = value;
        }

        /**
         * @en Set the Separable-SSS skin standard model component.
         * @zh 设置是否是全局的4s标准模型组件
         */
        get isGlobalStandardSkinObject() {
          return this._enabledGlobalStandardSkinObject;
        }
        set isGlobalStandardSkinObject(val) {
          getPipelineSceneData().standardSkinMeshRenderer = val ? this : null;
          this._enabledGlobalStandardSkinObject = val;
        }

        /**
         * @engineInternal
         * @mangle
         */
        clearGlobalStandardSkinObjectFlag() {
          this._enabledGlobalStandardSkinObject = false;
        }
        constructor() {
          super();
          /**
           * @en The settings for GI baking, it was called lightmapSettings before
           * @zh 全局光照烘焙的配置，以前名称为lightmapSettings
           */
          _initializerDefineProperty(this, "bakeSettings", _descriptor1, this);
          _initializerDefineProperty(this, "_mesh", _descriptor10, this);
          _initializerDefineProperty(this, "_shadowCastingMode", _descriptor11, this);
          _initializerDefineProperty(this, "_shadowReceivingMode", _descriptor12, this);
          _initializerDefineProperty(this, "_shadowBias", _descriptor13, this);
          _initializerDefineProperty(this, "_shadowNormalBias", _descriptor14, this);
          _initializerDefineProperty(this, "_reflectionProbeId", _descriptor15, this);
          _initializerDefineProperty(this, "_reflectionProbeBlendId", _descriptor16, this);
          _initializerDefineProperty(this, "_reflectionProbeBlendWeight", _descriptor17, this);
          _initializerDefineProperty(this, "_enabledGlobalStandardSkinObject", _descriptor18, this);
          this._reflectionProbeDataMap = null;
          // @serializable
          this._subMeshShapesWeights = [];
          this._modelType = scene.Model;
          this._model = null;
          this._morphInstance = null;
          _initializerDefineProperty(this, "_enableMorph", _descriptor19, this);
          const highQualityMode = settings.querySettings(SettingsCategory.RENDERING, 'highQualityMode');
          if (highQualityMode) {
            this._shadowCastingMode = ModelShadowCastingMode.ON;
            this.bakeSettings.castShadow = true;
            this.bakeSettings.receiveShadow = true;
          }
        }
        onLoad() {
          if (this._mesh) {
            this._mesh.initialize();
          }
          if (!this._validateShapeWeights()) {
            this._initSubMeshShapesWeights();
          }
          this._watchMorphInMesh();
          this._updateModels();
          this._updateCastShadow();
          this._updateReceiveShadow();
          this._updateShadowBias();
          this._updateShadowNormalBias();
          this._updateUseLightProbe();
          this._updateBakeToReflectionProbe();
          this._updateUseReflectionProbe();
          this._updateReceiveDirLight();
          this._updateStandardSkin();
        }

        // Redo, Undo, Prefab restore, etc.
        onRestore() {
          this._updateModels();
          if (this.enabledInHierarchy) {
            this._attachToScene();
          }
          this._updateCastShadow();
          this._updateReceiveShadow();
          this._updateShadowBias();
          this._updateShadowNormalBias();
          this._updateUseLightProbe();
          this._updateBakeToReflectionProbe();
          this._updateUseReflectionProbe();
          this._updateReceiveDirLight();
          this._updateStandardSkin();
        }
        onEnable() {
          super.onEnable();
          this.node.on(NodeEventType.MOBILITY_CHANGED, this.onMobilityChanged, this);
          this.node.on(NodeEventType.LIGHT_PROBE_BAKING_CHANGED, this.onLightProbeBakingChanged, this);
          this.bakeSettings.on(ModelBakeSettingsEvent.USE_LIGHT_PROBE_CHANGED, this.onUseLightProbeChanged, this);
          this.bakeSettings.on(ModelBakeSettingsEvent.REFLECTION_PROBE_CHANGED, this.onReflectionProbeChanged, this);
          this.bakeSettings.on(ModelBakeSettingsEvent.BAKE_TO_REFLECTION_PROBE_CHANGED, this.onBakeToReflectionProbeChanged, this);
          if (!this._model) {
            this._updateModels();
          }
          this._model.onGlobalPipelineStateChanged();
          this._updateCastShadow();
          this._updateReceiveShadow();
          this._updateShadowBias();
          this._updateShadowNormalBias();
          this._updateBakeToReflectionProbe();
          this._updateUseReflectionProbe();
          this._onUpdateLocalShadowBiasAndProbeId();
          this._updateUseLightProbe();
          this._updateReceiveDirLight();
          this._onUpdateReflectionProbeDataMap();
          this._onUpdateLocalReflectionProbeData();
          this._updateStandardSkin();
          this._attachToScene();
        }
        onDisable() {
          if (this._model) {
            this._detachFromScene();
          }
          this.node.off(NodeEventType.MOBILITY_CHANGED, this.onMobilityChanged, this);
          this.node.off(NodeEventType.LIGHT_PROBE_BAKING_CHANGED, this.onLightProbeBakingChanged, this);
          this.bakeSettings.off(ModelBakeSettingsEvent.USE_LIGHT_PROBE_CHANGED, this.onUseLightProbeChanged, this);
          this.bakeSettings.off(ModelBakeSettingsEvent.REFLECTION_PROBE_CHANGED, this.onReflectionProbeChanged, this);
          this.bakeSettings.off(ModelBakeSettingsEvent.BAKE_TO_REFLECTION_PROBE_CHANGED, this.onBakeToReflectionProbeChanged, this);
        }
        onDestroy() {
          if (this._model) {
            cclegacy.director.root.destroyModel(this._model);
            this._model = null;
            this._models.length = 0;
          }
          if (this._morphInstance) {
            this._morphInstance.destroy();
          }
        }
        onGeometryChanged() {
          if (this._model && this._mesh) {
            const meshStruct = this._mesh.struct;
            this._model.createBoundingShape(meshStruct.minPosition, meshStruct.maxPosition);
            this._model.updateWorldBound();
            this._model.onGeometryChanged();
          }
        }

        /**
         * @zh 获取子网格指定形变目标的权重。
         * @en Gets the weight at specified morph target of the specified sub mesh.
         * @param subMeshIndex Index to the sub mesh.
         * @param shapeIndex Index to the morph target of the sub mesh.
         * @returns The weight.
         */
        getWeight(subMeshIndex, shapeIndex) {
          const {
            _subMeshShapesWeights: subMeshShapesWeights
          } = this;
          assertIsTrue(subMeshIndex < subMeshShapesWeights.length);
          const shapeWeights = this._subMeshShapesWeights[subMeshIndex];
          assertIsTrue(shapeIndex < shapeWeights.length);
          return shapeWeights[shapeIndex];
        }

        /**
         * @zh
         * 设置子网格所有形变目标的权重。
         * `subMeshIndex` 是无效索引或 `weights` 的长度不匹配子网格的形变目标数量时，此方法不会生效。
         * @en
         * Sets weights of each morph target of the specified sub mesh.
         * If takes no effect if `subMeshIndex` is out of bounds or if `weights` has a different length with morph targets count of the sub mesh.
         * @param weights The weights.
         * @param subMeshIndex Index to the sub mesh.
         */
        setWeights(weights, subMeshIndex) {
          const {
            _subMeshShapesWeights: subMeshShapesWeights
          } = this;
          if (subMeshIndex >= subMeshShapesWeights.length) {
            return;
          }
          const shapeWeights = subMeshShapesWeights[subMeshIndex];
          if (shapeWeights.length !== weights.length) {
            return;
          }
          subMeshShapesWeights[subMeshIndex] = weights.slice(0);
          this._uploadSubMeshShapesWeights(subMeshIndex);
        }

        /**
         * @zh
         * 设置子网格指定外形的权重。
         * `subMeshIndex` 或 `shapeIndex` 是无效索引时，此方法不会生效。
         * @en
         * Sets the weight at specified shape of specified sub mesh.
         * If takes no effect if
         * `subMeshIndex` or `shapeIndex` out of bounds.
         * @param weight The weight.
         * @param subMeshIndex Index to the sub mesh.
         * @param shapeIndex Index to the shape of the sub mesh.
         */
        setWeight(weight, subMeshIndex, shapeIndex) {
          const {
            _subMeshShapesWeights: subMeshShapesWeights
          } = this;
          if (subMeshIndex >= subMeshShapesWeights.length) {
            return;
          }
          const shapeWeights = subMeshShapesWeights[subMeshIndex];
          if (shapeIndex >= shapeWeights.length) {
            return;
          }
          shapeWeights[shapeIndex] = weight;
          this._uploadSubMeshShapesWeights(subMeshIndex);
        }
        setInstancedAttribute(name, value) {
          if (!this.model) {
            return;
          }
          if (JSB) {
            this.model._setInstancedAttribute(name, value);
          } else {
            const subModels = this.model.subModels;
            for (let i = 0; i < subModels.length; i++) {
              const subModel = subModels[i];
              const {
                attributes,
                views
              } = subModel.instancedAttributeBlock;
              for (let i = 0; i < attributes.length; i++) {
                if (attributes[i].name === name) {
                  views[i].set(value);
                  break;
                }
              }
            }
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _updateLightmap(lightmap, uOff, vOff, scale, lum) {
          this.bakeSettings.texture = lightmap;
          this.bakeSettings.uvParam.x = uOff;
          this.bakeSettings.uvParam.y = vOff;
          this.bakeSettings.uvParam.z = scale;
          this.bakeSettings.uvParam.w = lum;
          this._onUpdateLightingmap();
          this._updateReceiveDirLight();
        }

        /**
         * @zh
         * 更新反射探针烘焙的cubemap。
         * @en
         * Updat cubemap baked with reflection probes.
         * @param cubeMap baked cubemap.
         * @param useDefaultTexture if the reflection probe has not been baked, is the skybox used instead.
         */
        updateProbeCubemap(cubeMap) {
          if (this.bakeSettings.probeCubemap && this.bakeSettings.probeCubemap === cubeMap) {
            return;
          }
          this.bakeSettings.probeCubemap = cubeMap;
          if (this.model !== null) {
            this.model.updateReflectionProbeCubemap(this.bakeSettings.probeCubemap);
          }
        }

        /**
         * @zh
         * 更新用于混合的反射探针烘焙的cubemap。
         * @en
         * Updat cubemap baked with reflection probes for blending.
         * @param cubeMap baked cubemap.
         */
        updateProbeBlendCubemap(cubeMap) {
          if (this.bakeSettings.probeBlendCubemap && this.bakeSettings.probeBlendCubemap === cubeMap) {
            return;
          }
          this.bakeSettings.probeBlendCubemap = cubeMap;
          if (this.model !== null) {
            this.model.updateReflectionProbeBlendCubemap(this.bakeSettings.probeBlendCubemap);
          }
        }

        /**
         * @zh
         * 更新平面反射渲染纹理。
         * @en
         * Update the reflection rendering texture.
         * @param planarMap render texture.
         */
        updateProbePlanarMap(planarMap) {
          if (this.bakeSettings.probePlanarmap === planarMap) {
            return;
          }
          this.bakeSettings.probePlanarmap = planarMap;
          if (this.model !== null) {
            this.model.updateReflectionProbePlanarMap(this.bakeSettings.probePlanarmap);
          }
        }

        /**
         * @zh
         * 更新反射探针的数据贴图。
         * @en
         * Update the data mapping of the reflection probe.
         * @param dataMap data mapping with data saved all reflection probe data.
         */
        updateReflectionProbeDataMap(dataMap) {
          this._reflectionProbeDataMap = dataMap;
          if (this.model !== null) {
            this.model.updateReflectionProbeDataMap(dataMap);
          }
        }

        /**
         * @zh
         * 更新反射探针的id。
         * @en
         * Update the id of the reflection probe.
         * @param probeId probe id.
         */
        updateReflectionProbeId(probeId) {
          this._reflectionProbeId = probeId;
          if (this.model) {
            this.model.reflectionProbeId = probeId;
          }
          this._onUpdateLocalShadowBiasAndProbeId();
        }

        /**
         * @zh
         * 更新用于混合的反射探针的id。
         * @en
         * Update the id of the reflection probe used for blending.
         * @param blendProbeId probe id of blend.
         */
        updateReflectionProbeBlendId(blendProbeId) {
          this._reflectionProbeBlendId = blendProbeId;
          if (this.model) {
            this.model.reflectionProbeBlendId = blendProbeId;
          }
          this._onUpdateLocalShadowBiasAndProbeId();
        }

        /**
         * @zh
         * 更新混合权重。
         * @en
         * Update blending weight.
         * @param weight blending weight.
         */
        updateReflectionProbeBlendWeight(weight) {
          this._reflectionProbeBlendWeight = weight;
          if (this.model) {
            this.model.reflectionProbeBlendWeight = weight;
          }
          this._onUpdateLocalReflectionProbeData();
        }
        _updateReflectionProbeTexture() {
          if (!this.model) return;
          const bakeSettings = this.bakeSettings;
          const reflectionProbe = bakeSettings.reflectionProbe;
          const probeBlendCubemap = bakeSettings.probeBlendCubemap;
          const probePlanarMap = bakeSettings.probePlanarmap;
          const probeCubeMap = bakeSettings.probeCubemap;
          if (reflectionProbe === ReflectionProbeType.BAKED_CUBEMAP) {
            this.model.updateReflectionProbeCubemap(probeCubeMap);
            this.model.updateReflectionProbePlanarMap(null);
            this.model.updateReflectionProbeBlendCubemap(null);
          } else if (reflectionProbe === ReflectionProbeType.BLEND_PROBES || reflectionProbe === ReflectionProbeType.BLEND_PROBES_AND_SKYBOX) {
            this.model.updateReflectionProbeCubemap(probeCubeMap);
            this.model.updateReflectionProbeBlendCubemap(probeBlendCubemap);
            this.model.updateReflectionProbePlanarMap(null);
          } else if (reflectionProbe === ReflectionProbeType.PLANAR_REFLECTION) {
            this.model.updateReflectionProbePlanarMap(probePlanarMap);
            this.model.updateReflectionProbeCubemap(null);
            this.model.updateReflectionProbeBlendCubemap(null);
          } else {
            this.model.updateReflectionProbeCubemap(null);
            this.model.updateReflectionProbePlanarMap(null);
            this.model.updateReflectionProbeBlendCubemap(null);
          }
        }
        _updateModels() {
          if (!this.enabledInHierarchy) {
            return;
          }
          const model = this._model;
          if (model) {
            model.destroy();
            model.initialize();
            model.node = model.transform = this.node;
          } else {
            this._createModel();
          }
          if (this._model) {
            if (this._mesh) {
              const meshStruct = this._mesh.struct;
              this._model.createBoundingShape(meshStruct.minPosition, meshStruct.maxPosition);
              this._model.updateWorldBound();
            }
            // Initialize lighting map before model initializing
            // because the lighting map will influence the model's shader
            this._model.initLightingmap(this.bakeSettings.texture, this.bakeSettings.uvParam);
            this._updateUseLightProbe();
            this._updateUseReflectionProbeType();
            this._updateModelParams();
            this._onUpdateLightingmap();
            this._onUpdateLocalShadowBiasAndProbeId();
            this._updateUseReflectionProbe();
            this._updateReceiveDirLight();
            this._onUpdateReflectionProbeDataMap();
            this._onUpdateLocalReflectionProbeData();
          }
        }
        _updateReceiveDirLight() {
          if (!this._model) {
            return;
          }
          const scene = this.node.scene;
          if (!scene || !scene.renderScene) {
            return;
          }
          const mainLight = scene.renderScene.mainLight;
          if (!mainLight) {
            return;
          }
          const visibility = mainLight.visibility;
          if (!mainLight.node) {
            return;
          }
          if (mainLight.node.mobility === MobilityMode.Static) {
            const sceneGlobals = this.node.scene.globals;
            const lightProbeInfoData = sceneGlobals.lightProbeInfo.data;
            let forceClose = false;
            if (this.bakeSettings.texture && !sceneGlobals.disableLightmap) {
              forceClose = true;
            }
            if (lightProbeInfoData && lightProbeInfoData.hasCoefficients() && this._model.useLightProbe) {
              forceClose = true;
            }
            this.onUpdateReceiveDirLight(visibility, forceClose);
          } else {
            this.onUpdateReceiveDirLight(visibility);
          }
        }
        _createModel() {
          const preferMorphOverPlain = !!this._morphInstance;
          // Note we only change to use `MorphModel` if
          // we are required to render morph and the `this._modelType` is exactly the basic `Model`.
          // We do this since the `this._modelType` might be changed in classes derived from `Model`.
          // We shall not overwrite it.
          // Please notice that we do not enforce that
          // derived classes should use a morph-able model type(i.e. model type derived from `MorphModel`).
          // So we should take care of the edge case.
          const modelType = preferMorphOverPlain && this._modelType === scene.Model ? MorphModel : this._modelType;
          const model = this._model = cclegacy.director.root.createModel(modelType);
          model.visFlags = this.visibility;
          model.node = model.transform = this.node;
          this._models.length = 0;
          this._models.push(model);
          if (this._morphInstance && model instanceof MorphModel) {
            model.setMorphRendering(this._morphInstance);
          }
        }
        _attachToScene() {
          if (!this.node.scene || !this._model) {
            return;
          }
          const renderScene = this._getRenderScene();
          if (this._model.scene !== null) {
            this._detachFromScene();
          }
          renderScene.addModel(this._model);
        }

        /**
         * @engineInternal
         * @mangle
         */
        _detachFromScene() {
          if (this._model && this._model.scene) {
            this._model.scene.removeModel(this._model);
          }
        }
        _updateModelParams() {
          if (!this._mesh || !this._model) {
            return;
          }
          this.node.hasChangedFlags |= TransformBit.POSITION;
          this._model.transform.hasChangedFlags |= TransformBit.POSITION;
          this._model.isDynamicBatching = this._isBatchingEnabled();
          const meshCount = this._mesh ? this._mesh.renderingSubMeshes.length : 0;
          const renderingMesh = this._mesh.renderingSubMeshes;
          if (renderingMesh) {
            for (let i = 0; i < meshCount; ++i) {
              let material = this.getRenderMaterial(i);
              if (material && !material.isValid) {
                material = null;
              }
              const subMeshData = renderingMesh[i];
              if (subMeshData) {
                this._model.initSubModel(i, subMeshData, material || this._getBuiltinMaterial());
              }
            }
          }
          this._model.enabled = true;
        }
        _onUpdateLightingmap() {
          if (this.model !== null) {
            this.model.updateLightingmap(this.bakeSettings.texture, this.bakeSettings.uvParam);
          }
          this.setInstancedAttribute('a_lightingMapUVParam', [this.bakeSettings.uvParam.x, this.bakeSettings.uvParam.y, this.bakeSettings.uvParam.z, this.bakeSettings.uvParam.w]);
        }
        _onUpdateLocalShadowBiasAndProbeId() {
          if (this.model !== null) {
            this.model.updateLocalShadowBias();
            this.model.updateReflectionProbeId();
          }
          this.setInstancedAttribute('a_localShadowBiasAndProbeId', [this._shadowBias, this._shadowNormalBias, this._reflectionProbeId, this._reflectionProbeBlendId]);
        }
        _onUpdateLocalReflectionProbeData() {
          if (this.bakeSettings.reflectionProbe === ReflectionProbeType.BAKED_CUBEMAP || this.bakeSettings.reflectionProbe === ReflectionProbeType.BLEND_PROBES || this.bakeSettings.reflectionProbe === ReflectionProbeType.BLEND_PROBES_AND_SKYBOX) {
            if (this.model !== null) {
              this.model.updateReflectionProbeId();
            }
            this.setInstancedAttribute('a_reflectionProbeData', [this._reflectionProbeBlendWeight, 0.0, 0.0, 0.0]);
          }
        }
        _onUpdateReflectionProbeDataMap() {
          if (this.model !== null) {
            this.model.updateReflectionProbeDataMap(this._reflectionProbeDataMap);
          }
        }
        _onMaterialModified(idx, material) {
          if (!this._model || !this._model.inited) {
            return;
          }
          this._onRebuildPSO(idx, material || this._getBuiltinMaterial());
          this._updateStandardSkin();
        }

        /**
         * @engineInternal
         */
        _onRebuildPSO(idx, material) {
          if (!this._model || !this._model.inited) {
            return;
          }
          this._model.isDynamicBatching = this._isBatchingEnabled();
          this._model.setSubModelMaterial(idx, material);
          this._onUpdateLightingmap();
          this._onUpdateLocalShadowBiasAndProbeId();
          this._updateReflectionProbeTexture();
          this._onUpdateReflectionProbeDataMap();
          this._onUpdateLocalReflectionProbeData();
        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _onMeshChanged(old) {}
        _clearMaterials() {
          if (!this._model) {
            return;
          }
          const subModels = this._model.subModels;
          for (let i = 0; i < subModels.length; ++i) {
            this._onMaterialModified(i, null);
          }
        }
        _getBuiltinMaterial() {
          // classic ugly pink indicating missing material
          return builtinResMgr.get('missing-material');
        }
        _onVisibilityChange(val) {
          if (!this._model) {
            return;
          }
          this._model.visFlags = val;
        }
        _updateShadowBias() {
          if (!this._model) {
            return;
          }
          this._model.shadowBias = this._shadowBias;
        }
        _updateShadowNormalBias() {
          if (!this._model) {
            return;
          }
          this._model.shadowNormalBias = this._shadowNormalBias;
        }
        _updateCastShadow() {
          if (!this._model) {
            return;
          }
          if (this._shadowCastingMode === ModelShadowCastingMode.OFF) {
            this._model.castShadow = false;
          } else {
            assertIsTrue(this._shadowCastingMode === ModelShadowCastingMode.ON, `ShadowCastingMode ${this._shadowCastingMode} is not supported.`);
            this._model.castShadow = true;
          }
        }
        _updateReceiveShadow() {
          if (!this._model) {
            return;
          }
          if (this._shadowReceivingMode === ModelShadowReceivingMode.OFF) {
            this._model.receiveShadow = false;
          } else {
            this._model.receiveShadow = true;
          }
        }
        onMobilityChanged() {
          this._updateUseLightProbe();
          this._updateReceiveDirLight();
        }
        onLightProbeBakingChanged() {
          this._updateReceiveDirLight();
        }
        onUseLightProbeChanged() {
          this._updateUseLightProbe();
        }
        onReflectionProbeChanged() {
          this._updateUseReflectionProbe();
          this._onUpdateLocalShadowBiasAndProbeId();
          const reflectionProbeManager = cclegacy.internal.reflectionProbeManager;
          const model = this._model;
          if (this.bakeSettings.reflectionProbe === ReflectionProbeType.BAKED_CUBEMAP || this.bakeSettings.reflectionProbe === ReflectionProbeType.BLEND_PROBES || this.bakeSettings.reflectionProbe === ReflectionProbeType.BLEND_PROBES_AND_SKYBOX) {
            reflectionProbeManager.selectReflectionProbe(model);
            if (!reflectionProbeManager.getUsedReflectionProbe(model, false)) {
              warnID(16302);
            }
          } else if (this.bakeSettings.reflectionProbe === ReflectionProbeType.PLANAR_REFLECTION) {
            reflectionProbeManager.selectPlanarReflectionProbe(model);
            if (!reflectionProbeManager.getUsedReflectionProbe(model, true)) {
              warnID(16302);
            }
          }
        }
        onBakeToReflectionProbeChanged() {
          this._updateBakeToReflectionProbe();
        }
        _updateUseLightProbe() {
          if (!this._model) {
            return;
          }
          const node = this.node;
          if (this._mesh && node && node.mobility === MobilityMode.Movable && this.bakeSettings.useLightProbe) {
            this._model.useLightProbe = true;
          } else {
            this._model.useLightProbe = false;
          }
        }
        _isBatchingEnabled() {
          for (let i = 0; i < this._materials.length; ++i) {
            const mat = this._materials[i];
            if (!mat) {
              continue;
            }
            for (let p = 0; p < mat.passes.length; ++p) {
              const pass = mat.passes[p];
              if (pass.batchingScheme) {
                return true;
              }
            }
          }
          return false;
        }
        _updateUseReflectionProbe() {
          if (!this._model) return;
          this._model.reflectionProbeType = this.bakeSettings.reflectionProbe;
          this._updateReflectionProbeTexture();
        }
        _updateUseReflectionProbeType() {
          if (!this._model) return;
          this._model.reflectionProbeType = this.bakeSettings.reflectionProbe;
        }
        _updateBakeToReflectionProbe() {
          if (!this._model) {
            return;
          }
          this._model.bakeToReflectionProbe = this.bakeSettings.bakeToReflectionProbe;
        }
        _watchMorphInMesh() {
          if (this._morphInstance) {
            this._morphInstance.destroy();
            this._morphInstance = null;
          }
          if (!this._enableMorph) {
            return;
          }
          if (!this._mesh || !this._mesh.struct.morph || !this._mesh.morphRendering) {
            return;
          }
          this._morphInstance = this._mesh.morphRendering.createInstance();
          const nSubMeshes = this._mesh.struct.primitives.length;
          for (let iSubMesh = 0; iSubMesh < nSubMeshes; ++iSubMesh) {
            this._uploadSubMeshShapesWeights(iSubMesh);
          }
          if (this._model && this._model instanceof MorphModel) {
            this._model.setMorphRendering(this._morphInstance);
          }
        }
        _initSubMeshShapesWeights() {
          const {
            _mesh: mesh
          } = this;
          this._subMeshShapesWeights.length = 0;
          if (!mesh) {
            return;
          }
          const morph = mesh.struct.morph;
          if (!morph) {
            return;
          }
          const commonWeights = morph.weights;
          this._subMeshShapesWeights = morph.subMeshMorphs.map(subMeshMorph => {
            if (!subMeshMorph) {
              return [];
            } else if (subMeshMorph.weights) {
              return subMeshMorph.weights.slice(0);
            } else if (commonWeights) {
              assertIsTrue(commonWeights.length === subMeshMorph.targets.length);
              return commonWeights.slice(0);
            } else {
              return new Array(subMeshMorph.targets.length).fill(0.0);
            }
          });
        }
        _validateShapeWeights() {
          const {
            _mesh: mesh,
            _subMeshShapesWeights: subMeshShapesWeights
          } = this;
          if (!mesh || !mesh.struct.morph) {
            return subMeshShapesWeights.length === 0;
          }
          const {
            morph
          } = mesh.struct;
          if (morph.subMeshMorphs.length !== subMeshShapesWeights.length) {
            return false;
          }
          return subMeshShapesWeights.every(({
            length: shapeCount
          }, subMeshIndex) => {
            var _morph$subMeshMorphs$, _morph$subMeshMorphs$2;
            return ((_morph$subMeshMorphs$ = (_morph$subMeshMorphs$2 = morph.subMeshMorphs[subMeshIndex]) == null ? void 0 : _morph$subMeshMorphs$2.targets.length) != null ? _morph$subMeshMorphs$ : 0) === shapeCount;
          });
        }
        _uploadSubMeshShapesWeights(subMeshIndex) {
          var _this$_morphInstance;
          (_this$_morphInstance = this._morphInstance) == null || _this$_morphInstance.setWeights(subMeshIndex, this._subMeshShapesWeights[subMeshIndex]);
        }
        _updateStandardSkin() {
          const pipelineSceneData = getPipelineSceneData();
          if (this._enabledGlobalStandardSkinObject) {
            pipelineSceneData.standardSkinMeshRenderer = this;
            pipelineSceneData.standardSkinModel = this.model;
          }
          if (!pipelineSceneData.skinMaterialModel && this._model) {
            const subModels = this._model.subModels;
            for (let j = 0; j < subModels.length; j++) {
              const subModel = subModels[j];
              const skinPassIdx = getSkinPassIndex(subModel);
              if (skinPassIdx < 0) {
                continue;
              }
              pipelineSceneData.skinMaterialModel = this._model;
              return;
            }
          }
        }
      }, _MeshRenderer.ShadowCastingMode = ModelShadowCastingMode, _MeshRenderer.ShadowReceivingMode = ModelShadowReceivingMode, _MeshRenderer), _descriptor1 = _applyDecoratedDescriptor(_class4.prototype, "bakeSettings", [serializable, editable, disallowAnimation, _dec19], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new ModelBakeSettings();
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class4.prototype, "_mesh", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class4.prototype, "_shadowCastingMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ModelShadowCastingMode.OFF;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class4.prototype, "_shadowReceivingMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ModelShadowReceivingMode.ON;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class4.prototype, "_shadowBias", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class4.prototype, "_shadowNormalBias", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class4.prototype, "_reflectionProbeId", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class4.prototype, "_reflectionProbeBlendId", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return -1;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class4.prototype, "_reflectionProbeBlendWeight", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor18 = _applyDecoratedDescriptor(_class4.prototype, "_enabledGlobalStandardSkinObject", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _applyDecoratedDescriptor(_class4.prototype, "shadowBias", [_dec20, _dec21, disallowAnimation], Object.getOwnPropertyDescriptor(_class4.prototype, "shadowBias"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "shadowNormalBias", [_dec22, _dec23, disallowAnimation], Object.getOwnPropertyDescriptor(_class4.prototype, "shadowNormalBias"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "shadowCastingMode", [_dec24, _dec25, disallowAnimation, _dec26], Object.getOwnPropertyDescriptor(_class4.prototype, "shadowCastingMode"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "shadowCastingModeForInspector", [_dec27, disallowAnimation], Object.getOwnPropertyDescriptor(_class4.prototype, "shadowCastingModeForInspector"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "receiveShadow", [_dec28, _dec29], Object.getOwnPropertyDescriptor(_class4.prototype, "receiveShadow"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "receiveShadowForInspector", [_dec30, disallowAnimation], Object.getOwnPropertyDescriptor(_class4.prototype, "receiveShadowForInspector"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "mesh", [_dec31, _dec32], Object.getOwnPropertyDescriptor(_class4.prototype, "mesh"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "enableMorph", [_dec33, disallowAnimation], Object.getOwnPropertyDescriptor(_class4.prototype, "enableMorph"), _class4.prototype), _applyDecoratedDescriptor(_class4.prototype, "isGlobalStandardSkinObject", [_dec34, disallowAnimation], Object.getOwnPropertyDescriptor(_class4.prototype, "isGlobalStandardSkinObject"), _class4.prototype), _descriptor19 = _applyDecoratedDescriptor(_class4.prototype, "_enableMorph", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return true;
        }
      }), _class4)) || _class3) || _class3) || _class3) || _class3) || _class3));
    }
  };
});