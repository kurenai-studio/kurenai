System.register("q-bundled:///fs/cocos/3d/lights/directional-light-component.js", ["./light-component.js", "../../render-scene/index.js", "../../core/index.js", "../../render-scene/scene/index.js", "../framework/mesh-renderer.js", "../../rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var Light, scene, clamp, warnID, CCBoolean, CCFloat, _decorator, settings, CCInteger, SettingsCategory, Camera, PCFType, Shadows, ShadowType, CSMOptimizationMode, CSMLevel, MeshRenderer, getPipelineSceneData, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _dec56, _dec57, _dec58, _dec59, _dec60, _dec61, _dec62, _dec63, _dec64, _dec65, _dec66, _dec67, _dec68, _dec69, _dec70, _dec71, _dec72, _dec73, _dec74, _dec75, _dec76, _dec77, _dec78, _dec79, _dec80, _dec81, _dec82, _dec83, _dec84, _dec85, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, ccclass, menu, executeInEditMode, property, serializable, formerlySerializedAs, tooltip, help, visible, type, editable, slide, range, DirectionalLight;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_lightComponentJs) {
      Light = _lightComponentJs.Light;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_coreIndexJs) {
      clamp = _coreIndexJs.clamp;
      warnID = _coreIndexJs.warnID;
      CCBoolean = _coreIndexJs.CCBoolean;
      CCFloat = _coreIndexJs.CCFloat;
      _decorator = _coreIndexJs._decorator;
      settings = _coreIndexJs.settings;
      CCInteger = _coreIndexJs.CCInteger;
      SettingsCategory = _coreIndexJs.SettingsCategory;
    }, function (_renderSceneSceneIndexJs) {
      Camera = _renderSceneSceneIndexJs.Camera;
      PCFType = _renderSceneSceneIndexJs.PCFType;
      Shadows = _renderSceneSceneIndexJs.Shadows;
      ShadowType = _renderSceneSceneIndexJs.ShadowType;
      CSMOptimizationMode = _renderSceneSceneIndexJs.CSMOptimizationMode;
      CSMLevel = _renderSceneSceneIndexJs.CSMLevel;
    }, function (_frameworkMeshRendererJs) {
      MeshRenderer = _frameworkMeshRendererJs.MeshRenderer;
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
        menu,
        executeInEditMode,
        property,
        serializable,
        formerlySerializedAs,
        tooltip,
        help,
        visible,
        type,
        editable,
        slide,
        range
      } = _decorator);
      /**
       * @en The directional light component, only one real time directional light is permitted in one scene, it act as the main light of the scene.
       * @zh 平行光源组件，一个场景只允许存在一个实时的平行光源，作为场景的主光源存在。
       */
      _export("DirectionalLight", DirectionalLight = (_dec = ccclass('cc.DirectionalLight'), _dec2 = help('i18n:cc.DirectionalLight'), _dec3 = menu('Light/DirectionalLight'), _dec4 = formerlySerializedAs('_illuminance'), _dec5 = tooltip('i18n:lights.illuminance'), _dec6 = range([0, Number.POSITIVE_INFINITY, 10]), _dec7 = type(CCInteger), _dec8 = tooltip('i18n:lights.shadowEnabled'), _dec9 = visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec0 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 1
        }
      }), _dec1 = type(CCBoolean), _dec10 = tooltip('i18n:lights.shadowPcf'), _dec11 = visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec12 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 5
        }
      }), _dec13 = type(PCFType), _dec14 = tooltip('i18n:lights.shadowBias'), _dec15 = visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec16 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 6
        }
      }), _dec17 = type(CCFloat), _dec18 = tooltip('i18n:lights.shadowNormalBias'), _dec19 = visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec20 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 7
        }
      }), _dec21 = type(CCFloat), _dec22 = tooltip('i18n:lights.shadowSaturation'), _dec23 = visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec24 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 8
        }
      }), _dec25 = range([0.0, 1.0, 0.01]), _dec26 = type(CCFloat), _dec27 = tooltip('i18n:lights.shadowDistance'), _dec28 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === false;
      }), _dec29 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 9
        }
      }), _dec30 = tooltip('shadow visible distance: shadow quality is inversely proportional of the magnitude of this value'), _dec31 = range([0.0, 2000.0, 0.1]), _dec32 = type(CCFloat), _dec33 = tooltip('i18n:lights.shadowInvisibleOcclusionRange'), _dec34 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === false && this._csmAdvancedOptions;
      }), _dec35 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 22
        }
      }), _dec36 = tooltip('if shadow has been culled, increase this value to fix it'), _dec37 = range([0.0, 2000.0, 1.0]), _dec38 = type(CCFloat), _dec39 = visible(false), _dec40 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 10
        }
      }), _dec41 = tooltip('CSM Level'), _dec42 = type(CSMLevel), _dec43 = tooltip('i18n:lights.enableCSM'), _dec44 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === false;
      }), _dec45 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 11
        }
      }), _dec46 = tooltip('enable CSM'), _dec47 = type(CCBoolean), _dec48 = visible(false), _dec49 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 12
        }
      }), _dec50 = tooltip('CSM Level ratio'), _dec51 = range([0.0, 1.0, 0.01]), _dec52 = type(CCFloat), _dec53 = visible(false), _dec54 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 13
        }
      }), _dec55 = tooltip('CSM Performance Optimization Mode'), _dec56 = type(CSMOptimizationMode), _dec57 = tooltip('i18n:lights.shadowFixedArea'), _dec58 = visible(() => getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec59 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 14
        }
      }), _dec60 = type(CCBoolean), _dec61 = tooltip('i18n:lights.shadowNear'), _dec62 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === true;
      }), _dec63 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 15
        }
      }), _dec64 = type(CCFloat), _dec65 = tooltip('i18n:lights.shadowFar'), _dec66 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === true;
      }), _dec67 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 16
        }
      }), _dec68 = type(CCFloat), _dec69 = tooltip('i18n:lights.shadowOrthoSize'), _dec70 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._shadowFixedArea === true;
      }), _dec71 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 17
        }
      }), _dec72 = type(CCFloat), _dec73 = tooltip('i18n:lights.shadowAdvancedOptions'), _dec74 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._csmLevel > CSMLevel.LEVEL_1;
      }), _dec75 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 19
        }
      }), _dec76 = type(CCBoolean), _dec77 = tooltip('i18n:lights.csmLayersTransition'), _dec78 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._csmLevel > CSMLevel.LEVEL_1 && this._csmAdvancedOptions;
      }), _dec79 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 20
        }
      }), _dec80 = type(CCBoolean), _dec81 = tooltip('i18n:lights.csmTransitionRange'), _dec82 = visible(function () {
        return getPipelineSceneData().shadows.enabled && getPipelineSceneData().shadows.type === ShadowType.ShadowMap && this._csmLevel > CSMLevel.LEVEL_1 && this._csmAdvancedOptions;
      }), _dec83 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 21
        }
      }), _dec84 = range([0.0, 1.0, 0.01]), _dec85 = type(CCFloat), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class DirectionalLight extends Light {
        /**
         * @en The light source intensity.
         * @zh 光源强度。
         */
        get illuminance() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._illuminanceHDR;
          } else {
            return this._illuminanceLDR;
          }
        }
        set illuminance(val) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this._illuminanceHDR = val;
            this._light && (this._light.illuminanceHDR = this._illuminanceHDR);
          } else {
            this._illuminanceLDR = val;
            this._light && (this._light.illuminanceLDR = this._illuminanceLDR);
          }
        }

        /**
         * @en Whether activate real time shadow.
         * @zh 是否启用实时阴影？
         */
        get shadowEnabled() {
          return this._shadowEnabled;
        }
        set shadowEnabled(val) {
          this._shadowEnabled = val;
          if (this._light) {
            this._light.shadowEnabled = this._shadowEnabled;
          }
        }

        /**
         * @en The shadow pcf for real time shadow.
         * @zh 实时阴影计算中的阴影 pcf 等级。
         */
        get shadowPcf() {
          return this._shadowPcf;
        }
        set shadowPcf(val) {
          this._shadowPcf = val;
          if (this._light) {
            this._light.shadowPcf = this._shadowPcf;
          }
        }

        /**
         * @en The shadow map sampler offset for real time shadow.
         * @zh 实时阴影计算中的阴影纹理偏移值。
         */
        get shadowBias() {
          return this._shadowBias;
        }
        set shadowBias(val) {
          this._shadowBias = val;
          if (this._light) {
            this._light.shadowBias = this._shadowBias;
          }
        }

        /**
         * @en The global normal bias for real time shadow.
         * @zh 实时阴影计算中的法线偏移。
         */
        get shadowNormalBias() {
          return this._shadowNormalBias;
        }
        set shadowNormalBias(val) {
          this._shadowNormalBias = val;
          if (this._light) {
            this._light.shadowNormalBias = this._shadowNormalBias;
          }
        }

        /**
         * @en The shadow color saturation for real time shadow.
         * @zh 实时阴影计算中的阴影颜色饱和度。
         */
        get shadowSaturation() {
          return this._shadowSaturation;
        }
        set shadowSaturation(val) {
          this._shadowSaturation = clamp(val, 0.0, 1.0);
          if (this._light) {
            this._light.shadowSaturation = this._shadowSaturation;
          }
        }

        /**
         * @en The potential shadow distance from the camera for real time shadow.
         * @zh 实时阴影计算中潜在阴影产生的范围
         */
        get shadowDistance() {
          return this._shadowDistance;
        }
        set shadowDistance(val) {
          this._shadowDistance = Math.min(val, Shadows.MAX_FAR);
          if (this._shadowDistance / 0.1 < 10.0) {
            warnID(15003, this._shadowDistance);
          }
          if (this._light) {
            this._light.shadowDistance = this._shadowDistance;
            this._light.csmNeedUpdate = true;
          }
        }

        /**
         * @en The occlusion range for real time shadow.
         * @zh 实时阴影计算中剔除阴影的范围
        */
        get shadowInvisibleOcclusionRange() {
          return this._shadowInvisibleOcclusionRange;
        }
        set shadowInvisibleOcclusionRange(val) {
          this._shadowInvisibleOcclusionRange = Math.min(val, Shadows.MAX_FAR);
          if (this._light) {
            this._light.shadowInvisibleOcclusionRange = this._shadowInvisibleOcclusionRange;
          }
        }

        /**
         * @en get or set shadow CSM level
         * @zh 获取或者设置阴影层级
         */
        get csmLevel() {
          return this._csmLevel;
        }
        set csmLevel(val) {
          this._csmLevel = val;
          if (this._light) {
            this._light.csmLevel = this._csmLevel;
            this._light.csmNeedUpdate = true;
          }
        }

        /**
         * @en enable csm
         * @zh 开启或关闭 csm 模式
         */
        get enableCSM() {
          return this._csmLevel > CSMLevel.LEVEL_1;
        }
        set enableCSM(val) {
          this._csmLevel = val ? CSMLevel.LEVEL_4 : CSMLevel.LEVEL_1;
          if (this._light) {
            this._light.csmLevel = this._csmLevel;
            this._light.csmNeedUpdate = true;
          }
        }

        /**
         * @en get or set shadow CSM level ratio
         * @zh 获取或者设置阴影层级系数
         */
        get csmLayerLambda() {
          return this._csmLayerLambda;
        }
        set csmLayerLambda(val) {
          this._csmLayerLambda = val;
          if (this._light) {
            this._light.csmLayerLambda = this._csmLayerLambda;
            this._light.csmNeedUpdate = true;
          }
        }

        /**
         * @en get or set shadow CSM performance optimization mode
         * @zh 获取或者设置级联阴影性能优化模式
         * @internal
         */
        get csmOptimizationMode() {
          return this._csmOptimizationMode;
        }
        set csmOptimizationMode(val) {
          this._csmOptimizationMode = val;
          if (this._light) {
            this._light.csmOptimizationMode = this._csmOptimizationMode;
          }
        }

        /**
         * @en Whether to use fixed area shadow in real time shadow.
         * @zh 实时阴影计算中是否使用固定区域阴影。
         */
        get shadowFixedArea() {
          return this._shadowFixedArea;
        }
        set shadowFixedArea(val) {
          this._shadowFixedArea = val;
          if (this._light) {
            this._light.shadowFixedArea = this._shadowFixedArea;
          }
        }

        /**
         * @en The near clip plane of the shadow camera for fixed area shadow
         * @zh 固定区域阴影设置中阴影相机近裁剪面
         */
        get shadowNear() {
          return this._shadowNear;
        }
        set shadowNear(val) {
          this._shadowNear = val;
          if (this._light) {
            this._light.shadowNear = this._shadowNear;
          }
        }

        /**
         * @en The far clip plane of the shadow camera for fixed area shadow.
         * @zh 固定区域阴影设置中阴影相机远裁剪面。
         */
        get shadowFar() {
          return this._shadowFar;
        }
        set shadowFar(val) {
          this._shadowFar = Math.min(val, Shadows.MAX_FAR);
          if (this._light) {
            this._light.shadowFar = this._shadowFar;
          }
        }

        /**
         * @en The orthogonal size of the shadow camera for fixed area shadow.
         * @zh 固定区域阴影设置中阴影相机的正交尺寸
         */
        get shadowOrthoSize() {
          return this._shadowOrthoSize;
        }
        set shadowOrthoSize(val) {
          this._shadowOrthoSize = val;
          if (this._light) {
            this._light.shadowOrthoSize = this._shadowOrthoSize;
          }
        }

        /**
         * @en Enabled shadow advanced options
         * @zh 是否启用高级选项？
         */
        get csmAdvancedOptions() {
          return this._csmAdvancedOptions;
        }
        set csmAdvancedOptions(val) {
          this._csmAdvancedOptions = val;
        }

        /**
         * @en Enabled csm layers transition
         * @zh 是否启用级联阴影层级过渡？
         */
        get csmLayersTransition() {
          return this._csmLayersTransition;
        }
        set csmLayersTransition(val) {
          this._csmLayersTransition = val;
          if (this._light) {
            this._light.csmLayersTransition = val;
          }
        }

        /**
         * @en get or set csm layers transition range
         * @zh 获取或者设置级联阴影层级过渡范围？
         */
        get csmTransitionRange() {
          return this._csmTransitionRange;
        }
        set csmTransitionRange(val) {
          this._csmTransitionRange = val;
          if (this._light) {
            this._light.csmTransitionRange = val;
          }
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "_illuminanceHDR", _descriptor, this);
          _initializerDefineProperty(this, "_illuminanceLDR", _descriptor2, this);
          // Public properties of shadow
          _initializerDefineProperty(this, "_shadowEnabled", _descriptor3, this);
          // Shadow map properties
          _initializerDefineProperty(this, "_shadowPcf", _descriptor4, this);
          _initializerDefineProperty(this, "_shadowBias", _descriptor5, this);
          _initializerDefineProperty(this, "_shadowNormalBias", _descriptor6, this);
          _initializerDefineProperty(this, "_shadowSaturation", _descriptor7, this);
          _initializerDefineProperty(this, "_shadowDistance", _descriptor8, this);
          _initializerDefineProperty(this, "_shadowInvisibleOcclusionRange", _descriptor9, this);
          _initializerDefineProperty(this, "_csmLevel", _descriptor0, this);
          _initializerDefineProperty(this, "_csmLayerLambda", _descriptor1, this);
          _initializerDefineProperty(this, "_csmOptimizationMode", _descriptor10, this);
          _initializerDefineProperty(this, "_csmAdvancedOptions", _descriptor11, this);
          _initializerDefineProperty(this, "_csmLayersTransition", _descriptor12, this);
          _initializerDefineProperty(this, "_csmTransitionRange", _descriptor13, this);
          // fixed area properties
          _initializerDefineProperty(this, "_shadowFixedArea", _descriptor14, this);
          _initializerDefineProperty(this, "_shadowNear", _descriptor15, this);
          _initializerDefineProperty(this, "_shadowFar", _descriptor16, this);
          _initializerDefineProperty(this, "_shadowOrthoSize", _descriptor17, this);
          this._lightType = scene.DirectionalLight;
          const highQualityMode = settings.querySettings(SettingsCategory.RENDERING, 'highQualityMode');
          if (highQualityMode) {
            this._shadowPcf = PCFType.SOFT_2X;
            this._shadowDistance = 50;
            this.enableCSM = true;
            this.staticSettings.castShadow = true;
          }
        }
        _createLight() {
          super._createLight();
          this._type = scene.LightType.DIRECTIONAL;
          if (this._light) {
            const dirLight = this._light;
            dirLight.illuminanceHDR = this._illuminanceHDR;
            dirLight.illuminanceLDR = this._illuminanceLDR;
            // shadow info
            dirLight.shadowEnabled = this._shadowEnabled;
            dirLight.shadowPcf = this._shadowPcf;
            dirLight.shadowBias = this._shadowBias;
            dirLight.shadowNormalBias = this._shadowNormalBias;
            dirLight.shadowSaturation = this._shadowSaturation;
            dirLight.shadowDistance = this._shadowDistance;
            dirLight.shadowInvisibleOcclusionRange = this._shadowInvisibleOcclusionRange;
            dirLight.shadowFixedArea = this._shadowFixedArea;
            dirLight.shadowNear = this._shadowNear;
            dirLight.shadowFar = this._shadowFar;
            dirLight.shadowOrthoSize = this._shadowOrthoSize;
            dirLight.csmLevel = this._csmLevel;
            dirLight.csmLayerLambda = this._csmLayerLambda;
            dirLight.csmOptimizationMode = this._csmOptimizationMode;
            dirLight.csmLayersTransition = this._csmLayersTransition;
            dirLight.csmTransitionRange = this._csmTransitionRange;
          }
        }
        _onUpdateReceiveDirLight() {
          if (!this._light) {
            return;
          }
          super._onUpdateReceiveDirLight();
          const scene = this.node.scene;
          if (!scene || !scene.renderScene) {
            return;
          }
          if (scene.renderScene.mainLight !== this._light) {
            return;
          }
          const models = scene.renderScene.models;
          for (let i = 0; i < models.length; i++) {
            const model = models[i];
            if (!model.node) continue;
            const meshRender = model.node.getComponent(MeshRenderer);
            if (!meshRender) continue;
            meshRender.onUpdateReceiveDirLight(this._visibility);
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_illuminanceHDR", [property, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 65000;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_illuminanceLDR", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 65000 * Camera.standardExposureValue;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_shadowEnabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_shadowPcf", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PCFType.HARD;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_shadowBias", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.00001;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_shadowNormalBias", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_shadowSaturation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_shadowDistance", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 50;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_shadowInvisibleOcclusionRange", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 200;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_csmLevel", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CSMLevel.LEVEL_4;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_csmLayerLambda", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.75;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_csmOptimizationMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return CSMOptimizationMode.RemoveDuplicates;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "_csmAdvancedOptions", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "_csmLayersTransition", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_csmTransitionRange", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.05;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "_shadowFixedArea", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "_shadowNear", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.1;
        }
      }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "_shadowFar", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 10.0;
        }
      }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "_shadowOrthoSize", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "illuminance", [_dec5, editable, _dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "illuminance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowEnabled", [_dec8, _dec9, _dec0, editable, _dec1], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowEnabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowPcf", [_dec10, _dec11, _dec12, editable, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowPcf"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowBias", [_dec14, _dec15, _dec16, editable, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowBias"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowNormalBias", [_dec18, _dec19, _dec20, editable, _dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowNormalBias"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowSaturation", [_dec22, _dec23, _dec24, editable, _dec25, slide, _dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowSaturation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowDistance", [_dec27, _dec28, _dec29, editable, _dec30, _dec31, slide, _dec32], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowDistance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowInvisibleOcclusionRange", [_dec33, _dec34, _dec35, editable, _dec36, _dec37, slide, _dec38], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowInvisibleOcclusionRange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "csmLevel", [_dec39, _dec40, editable, _dec41, _dec42], Object.getOwnPropertyDescriptor(_class2.prototype, "csmLevel"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "enableCSM", [_dec43, _dec44, _dec45, editable, _dec46, _dec47], Object.getOwnPropertyDescriptor(_class2.prototype, "enableCSM"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "csmLayerLambda", [_dec48, _dec49, editable, _dec50, _dec51, slide, _dec52], Object.getOwnPropertyDescriptor(_class2.prototype, "csmLayerLambda"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "csmOptimizationMode", [_dec53, _dec54, editable, _dec55, _dec56], Object.getOwnPropertyDescriptor(_class2.prototype, "csmOptimizationMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowFixedArea", [_dec57, _dec58, _dec59, editable, _dec60], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowFixedArea"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowNear", [_dec61, _dec62, _dec63, editable, _dec64], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowNear"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowFar", [_dec65, _dec66, _dec67, editable, _dec68], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowFar"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowOrthoSize", [_dec69, _dec70, _dec71, _dec72], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowOrthoSize"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "csmAdvancedOptions", [_dec73, _dec74, _dec75, editable, _dec76], Object.getOwnPropertyDescriptor(_class2.prototype, "csmAdvancedOptions"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "csmLayersTransition", [_dec77, _dec78, _dec79, editable, _dec80], Object.getOwnPropertyDescriptor(_class2.prototype, "csmLayersTransition"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "csmTransitionRange", [_dec81, _dec82, _dec83, editable, _dec84, slide, _dec85], Object.getOwnPropertyDescriptor(_class2.prototype, "csmTransitionRange"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});