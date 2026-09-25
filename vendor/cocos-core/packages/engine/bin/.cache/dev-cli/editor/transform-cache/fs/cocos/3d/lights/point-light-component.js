System.register("q-bundled:///fs/cocos/3d/lights/point-light-component.js", ["../../core/data/decorators/index.js", "../../render-scene/index.js", "../../render-scene/scene/index.js", "./light-component.js", "../../core/index.js", "../../rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, help, executeInEditMode, menu, tooltip, type, displayOrder, serializable, formerlySerializedAs, editable, rangeMin, range, scene, Camera, LightType, Light, PhotometricTerm, CCFloat, CCInteger, getPipelineSceneData, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, PointLight;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      help = _coreDataDecoratorsIndexJs.help;
      executeInEditMode = _coreDataDecoratorsIndexJs.executeInEditMode;
      menu = _coreDataDecoratorsIndexJs.menu;
      tooltip = _coreDataDecoratorsIndexJs.tooltip;
      type = _coreDataDecoratorsIndexJs.type;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      formerlySerializedAs = _coreDataDecoratorsIndexJs.formerlySerializedAs;
      editable = _coreDataDecoratorsIndexJs.editable;
      rangeMin = _coreDataDecoratorsIndexJs.rangeMin;
      range = _coreDataDecoratorsIndexJs.range;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_renderSceneSceneIndexJs) {
      Camera = _renderSceneSceneIndexJs.Camera;
      LightType = _renderSceneSceneIndexJs.LightType;
    }, function (_lightComponentJs) {
      Light = _lightComponentJs.Light;
      PhotometricTerm = _lightComponentJs.PhotometricTerm;
    }, function (_coreIndexJs) {
      CCFloat = _coreIndexJs.CCFloat;
      CCInteger = _coreIndexJs.CCInteger;
    }, function (_renderingPipelineSceneDataUtilsJs) {
      getPipelineSceneData = _renderingPipelineSceneDataUtilsJs.getPipelineSceneData;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en The point light component, multiple point lights can be added to one scene.
       * @zh 点光源组件，场景中可以添加多个点光源。
       */
      _export("PointLight", PointLight = (_dec = ccclass('cc.PointLight'), _dec2 = help('i18n:cc.PointLight'), _dec3 = menu('Light/PointLight'), _dec4 = formerlySerializedAs('_luminance'), _dec5 = displayOrder(-1), _dec6 = tooltip('i18n:lights.luminous_flux'), _dec7 = range([0, Number.POSITIVE_INFINITY, 100]), _dec8 = type(CCInteger), _dec9 = displayOrder(-1), _dec0 = tooltip('i18n:lights.luminance'), _dec1 = range([0, Number.POSITIVE_INFINITY, 10]), _dec10 = type(CCInteger), _dec11 = type(PhotometricTerm), _dec12 = displayOrder(-2), _dec13 = tooltip('i18n:lights.term'), _dec14 = tooltip('i18n:lights.range'), _dec15 = rangeMin(0), _dec16 = type(CCFloat), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class PointLight extends Light {
        /**
         * @en Luminous flux of the light.
         * @zh 光通量。
         */
        get luminousFlux() {
          const isHDR = getPipelineSceneData().isHDR;
          if (isHDR) {
            return this._luminanceHDR * scene.nt2lm(1.0);
          } else {
            return this._luminanceLDR;
          }
        }
        set luminousFlux(val) {
          const isHDR = getPipelineSceneData().isHDR;
          let result = 0;
          if (isHDR) {
            this._luminanceHDR = val / scene.nt2lm(1.0);
            result = this._luminanceHDR;
          } else {
            this._luminanceLDR = val;
            result = this._luminanceLDR;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            this._light && (this._light.luminanceHDR = this._luminanceHDR);
          } else {
            this._luminanceLDR = val;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
         * @en Range of the light.
         * @zh 光源范围。
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
        constructor() {
          super();
          _initializerDefineProperty(this, "_luminanceHDR", _descriptor, this);
          _initializerDefineProperty(this, "_luminanceLDR", _descriptor2, this);
          _initializerDefineProperty(this, "_term", _descriptor3, this);
          _initializerDefineProperty(this, "_range", _descriptor4, this);
          this._lightType = scene.PointLight;
        }
        _createLight() {
          super._createLight();
          this._type = LightType.POINT;
          this.range = this._range;
          if (this._light) {
            this._light.luminanceHDR = this._luminanceHDR;
            this._light.luminanceLDR = this._luminanceLDR;
          }
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_luminanceHDR", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1700 / scene.nt2lm(0.15);
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_luminanceLDR", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1700 / scene.nt2lm(0.15) * Camera.standardExposureValue * Camera.standardLightMeterScale;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_term", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return PhotometricTerm.LUMINOUS_FLUX;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "_range", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "luminousFlux", [_dec5, _dec6, editable, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "luminousFlux"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "luminance", [_dec9, _dec0, editable, _dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "luminance"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "term", [_dec11, _dec12, _dec13, editable], Object.getOwnPropertyDescriptor(_class2.prototype, "term"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "range", [_dec14, editable, _dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "range"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});