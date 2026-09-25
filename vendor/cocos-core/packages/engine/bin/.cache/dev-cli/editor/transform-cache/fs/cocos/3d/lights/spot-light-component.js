System.register("q-bundled:///fs/cocos/3d/lights/spot-light-component.js", ["../../core/index.js", "../../render-scene/index.js", "./light-component.js", "../../render-scene/scene/index.js", "../../rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var toRadian, CCBoolean, CCFloat, _decorator, scene, Light, PhotometricTerm, Camera, PCFType, ShadowType, getPipelineSceneData, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor0, _descriptor1, ccclass, range, slide, type, editable, displayOrder, help, executeInEditMode, menu, tooltip, serializable, formerlySerializedAs, visible, property, SpotLight;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreIndexJs) {
      toRadian = _coreIndexJs.toRadian;
      CCBoolean = _coreIndexJs.CCBoolean;
      CCFloat = _coreIndexJs.CCFloat;
      _decorator = _coreIndexJs._decorator;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_lightComponentJs) {
      Light = _lightComponentJs.Light;
      PhotometricTerm = _lightComponentJs.PhotometricTerm;
    }, function (_renderSceneSceneIndexJs) {
      Camera = _renderSceneSceneIndexJs.Camera;
      PCFType = _renderSceneSceneIndexJs.PCFType;
      ShadowType = _renderSceneSceneIndexJs.ShadowType;
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
        range,
        slide,
        type,
        editable,
        displayOrder,
        help,
        executeInEditMode,
        menu,
        tooltip,
        serializable,
        formerlySerializedAs,
        visible,
        property
      } = _decorator);
      /**
       * @en The spot light component, multiple spot lights can be added to one scene.
       * @zh 聚光灯光源组件，场景中可以添加多个聚光灯光源。
       */
      _export("SpotLight", SpotLight = (_dec = ccclass('cc.SpotLight'), _dec2 = help('i18n:cc.SpotLight'), _dec3 = menu('Light/SpotLight'), _dec4 = formerlySerializedAs('_luminance'), _dec5 = tooltip('i18n:lights.luminous_flux'), _dec6 = displayOrder(-1), _dec7 = range([0, Number.POSITIVE_INFINITY, 100]), _dec8 = tooltip('i18n:lights.luminance'), _dec9 = displayOrder(-1), _dec0 = range([0, Number.POSITIVE_INFINITY, 10]), _dec1 = type(PhotometricTerm), _dec10 = displayOrder(-2), _dec11 = tooltip('i18n:lights.term'), _dec12 = tooltip('i18n:lights.size'), _dec13 = range([0.0, 10.0, 0.001]), _dec14 = type(CCFloat), _dec15 = tooltip('i18n:lights.range'), _dec16 = range([2, 180, 1]), _dec17 = tooltip('i18n:lights.spotAngle'), _dec18 = range([0, 1, 0.001]), _dec19 = tooltip('i18n:lights.angleAttenuationStrength'), _dec20 = tooltip('i18n:lights.shadowEnabled'), _dec21 = visible(() => getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec22 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 1
        }
      }), _dec23 = type(CCBoolean), _dec24 = tooltip('i18n:lights.shadowPcf'), _dec25 = visible(() => getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec26 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 2
        }
      }), _dec27 = type(PCFType), _dec28 = tooltip('i18n:lights.shadowBias'), _dec29 = visible(() => getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec30 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 3
        }
      }), _dec31 = type(CCFloat), _dec32 = tooltip('i18n:lights.shadowNormalBias'), _dec33 = visible(() => getPipelineSceneData().shadows.type === ShadowType.ShadowMap), _dec34 = property({
        group: {
          name: 'DynamicShadowSettings',
          displayOrder: 4
        }
      }), _dec35 = type(CCFloat), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class SpotLight extends Light {
        /**
         * @en Luminous flux of the light.
         * @zh 光通量。
         */
        get luminousFlux() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._luminanceHDR * scene.nt2lm(this._size);
          } else {
            return this._luminanceLDR;
          }
        }
        set luminousFlux(val) {
          const isHDR = getPipelineSceneData().isHDR;
          let result = 0;
          if (isHDR) {
            this._luminanceHDR = val / scene.nt2lm(this._size);
            result = this._luminanceHDR;
          } else {
            this._luminanceLDR = val;
            result = this._luminanceLDR;
          }
          this._light && (this._light.luminance = result);
        }

        /**
          * @en Luminance of the light.
          * @zh 光亮度。
          */
        get luminance() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._luminanceHDR;
          } else {
            return this._luminanceLDR;
          }
        }
        set luminance(val) {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            this._luminanceHDR = val;
            this._light && (this._light.luminanceHDR = this._luminanceHDR);
          } else {
            this._luminanceLDR = val;
            this._light && (this._light.luminanceLDR = this._luminanceLDR);
          }
        }

        /**
         * @en The photometric term currently being used.
         * @zh 当前使用的光度学计量单位。
         */
        get term() {
          return this._term;
        }
        set term(val) {
          this._term = val;
        }

        /**
         * @en
         * Size of the light.
         * @zh
         * 光源大小。
         */
        get size() {
          return this._size;
        }
        set size(val) {
          this._size = val;
          if (this._light) {
            this._light.size = val;
          }
        }

        /**
         * @en
         * Range of the light.
         * @zh
         * 光源范围。
         */
        get range() {
          return this._range;
        }
        set range(val) {
          this._range = val;
          if (this._light) {
            this._light.range = val;
          }
        }

        /**
         * @en
         * The spot light cone angle.
         * @zh
         * 聚光灯锥角。
         */
        get spotAngle() {
          return this._spotAngle;
        }
        set spotAngle(val) {
          this._spotAngle = val;
          if (this._light) {
            this._light.spotAngle = toRadian(val);
          }
        }

        /**
         * @en The angle attenuation strength of the spot light.
         * The larger the value, the softer the edge, and the smaller the value, the harder the edge.
         * @zh 聚光灯角度衰减强度。值越大，边缘越柔和，值越小，边缘越硬。
         */
        get angleAttenuationStrength() {
          return this._angleAttenuationStrength;
        }
        set angleAttenuationStrength(val) {
          this._angleAttenuationStrength = val;
          if (this._light) {
            this._light.angleAttenuationStrength = val;
          }
        }

        /**
         * @en Whether activate shadow
         * @zh 是否启用阴影？
         */
        get shadowEnabled() {
          return this._shadowEnabled;
        }
        set shadowEnabled(val) {
          this._shadowEnabled = val;
          if (this._light) {
            this._light.shadowEnabled = val;
          }
        }

        /**
         * @en The pcf level of the shadow generation.
         * @zh 获取或者设置阴影 pcf 等级。
         */
        get shadowPcf() {
          return this._shadowPcf;
        }
        set shadowPcf(val) {
          this._shadowPcf = val;
          if (this._light) {
            this._light.shadowPcf = val;
          }
        }

        /**
         * @en The depth offset of shadow to avoid moire pattern artifacts
         * @zh 阴影的深度偏移, 可以减弱跨像素导致的条纹状失真
         */
        get shadowBias() {
          return this._shadowBias;
        }
        set shadowBias(val) {
          this._shadowBias = val;
          if (this._light) {
            this._light.shadowBias = val;
          }
        }

        /**
         * @en The normal bias of the shadow map.
         * @zh 设置或者获取法线偏移。
         */
        get shadowNormalBias() {
          return this._shadowNormalBias;
        }
        set shadowNormalBias(val) {
          this._shadowNormalBias = val;
          if (this._light) {
            this._light.shadowNormalBias = val;
          }
        }
        constructor() {
          super();
          _initializerDefineProperty(this, "_size", _descriptor, this);
          _initializerDefineProperty(this, "_luminanceHDR", _descriptor2, this);
          _initializerDefineProperty(this, "_luminanceLDR", _descriptor3, this);
          _initializerDefineProperty(this, "_term", _descriptor4, this);
          _initializerDefineProperty(this, "_range", _descriptor5, this);
          _initializerDefineProperty(this, "_spotAngle", _descriptor6, this);
          _initializerDefineProperty(this, "_angleAttenuationStrength", _descriptor7, this);
          // Shadow map properties
          _initializerDefineProperty(this, "_shadowEnabled", _descriptor8, this);
          _initializerDefineProperty(this, "_shadowPcf", _descriptor9, this);
          _initializerDefineProperty(this, "_shadowBias", _descriptor0, this);
          _initializerDefineProperty(this, "_shadowNormalBias", _descriptor1, this);
          this._lightType = scene.SpotLight;
        }
        _createLight() {
          super._createLight();
          this._type = scene.LightType.SPOT;
          this.size = this._size;
          this.range = this._range;
          this.spotAngle = this._spotAngle;
          this.angleAttenuationStrength = this._angleAttenuationStrength;
          if (this._light) {
            const spotLight = this._light;
            spotLight.luminanceHDR = this._luminanceHDR;
            spotLight.luminanceLDR = this._luminanceLDR;
            // shadow info
            spotLight.shadowEnabled = this._shadowEnabled;
            spotLight.shadowPcf = this._shadowPcf;
            spotLight.shadowBias = this._shadowBias;
            spotLight.shadowNormalBias = this._shadowNormalBias;
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_size", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.15;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_luminanceHDR", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1700 / scene.nt2lm(0.15);
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_luminanceLDR", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1700 / scene.nt2lm(0.15) * Camera.standardExposureValue * Camera.standardLightMeterScale;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_term", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PhotometricTerm.LUMINOUS_FLUX;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_range", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_spotAngle", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 60;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_angleAttenuationStrength", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_shadowEnabled", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_shadowPcf", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PCFType.HARD;
        }
      }), _descriptor0 = _applyDecoratedDescriptor(_class2.prototype, "_shadowBias", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.00001;
        }
      }), _descriptor1 = _applyDecoratedDescriptor(_class2.prototype, "_shadowNormalBias", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.0;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "luminousFlux", [_dec5, _dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "luminousFlux"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "luminance", [_dec8, _dec9, _dec0], Object.getOwnPropertyDescriptor(_class2.prototype, "luminance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "term", [_dec1, _dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "term"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "size", [_dec12, editable, slide, _dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "size"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "range", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "range"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "spotAngle", [slide, _dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "spotAngle"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "angleAttenuationStrength", [slide, _dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "angleAttenuationStrength"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowEnabled", [_dec20, _dec21, _dec22, editable, _dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowEnabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowPcf", [_dec24, _dec25, _dec26, editable, _dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowPcf"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowBias", [_dec28, _dec29, _dec30, editable, _dec31], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowBias"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadowNormalBias", [_dec32, _dec33, _dec34, editable, _dec35], Object.getOwnPropertyDescriptor(_class2.prototype, "shadowNormalBias"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});