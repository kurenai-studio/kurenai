System.register("q-bundled:///fs/cocos/3d/lights/ranged-directional-light-component.js", ["./light-component.js", "../../core/data/class-decorator.js", "../../render-scene/scene/index.js", "../../render-scene/index.js", "../../core/index.js", "../../core/data/decorators/index.js", "../../rendering/pipeline-scene-data-utils.js"], function (_export, _context) {
  "use strict";

  var Light, ccclass, help, property, menu, executeInEditMode, formerlySerializedAs, serializable, tooltip, editable, type, Camera, LightType, scene, CCInteger, range, getPipelineSceneData, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, RangedDirectionalLight;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_lightComponentJs) {
      Light = _lightComponentJs.Light;
    }, function (_coreDataClassDecoratorJs) {
      ccclass = _coreDataClassDecoratorJs.ccclass;
      help = _coreDataClassDecoratorJs.help;
      property = _coreDataClassDecoratorJs.property;
      menu = _coreDataClassDecoratorJs.menu;
      executeInEditMode = _coreDataClassDecoratorJs.executeInEditMode;
      formerlySerializedAs = _coreDataClassDecoratorJs.formerlySerializedAs;
      serializable = _coreDataClassDecoratorJs.serializable;
      tooltip = _coreDataClassDecoratorJs.tooltip;
      editable = _coreDataClassDecoratorJs.editable;
      type = _coreDataClassDecoratorJs.type;
    }, function (_renderSceneSceneIndexJs) {
      Camera = _renderSceneSceneIndexJs.Camera;
      LightType = _renderSceneSceneIndexJs.LightType;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
    }, function (_coreIndexJs) {
      CCInteger = _coreIndexJs.CCInteger;
    }, function (_coreDataDecoratorsIndexJs) {
      range = _coreDataDecoratorsIndexJs.range;
    }, function (_renderingPipelineSceneDataUtilsJs) {
      getPipelineSceneData = _renderingPipelineSceneDataUtilsJs.getPipelineSceneData;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
       http://www.cocos2d-x.org
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights
       to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
       copies of the Software, and to permit persons to whom the Software is
       furnished to do so, subject to the following conditions:
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
       * @en The ranged directional light component, Multiple ranged directional light sources are allowed in a scene.
       * @zh 范围平行光光源组件，一个场景允许存在多个范围平行光光源。
       */
      _export("RangedDirectionalLight", RangedDirectionalLight = (_dec = ccclass('cc.RangedDirectionalLight'), _dec2 = help('i18n:cc.RangedDirectionalLight'), _dec3 = menu('Light/RangedDirectionalLight'), _dec4 = formerlySerializedAs('_illuminance'), _dec5 = tooltip('i18n:lights.illuminance'), _dec6 = range([0, Number.POSITIVE_INFINITY, 10]), _dec7 = type(CCInteger), _dec(_class = _dec2(_class = _dec3(_class = executeInEditMode(_class = (_class2 = class RangedDirectionalLight extends Light {
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
        constructor() {
          super();
          _initializerDefineProperty(this, "_illuminanceHDR", _descriptor, this);
          _initializerDefineProperty(this, "_illuminanceLDR", _descriptor2, this);
          this._lightType = scene.RangedDirectionalLight;
        }
        _createLight() {
          super._createLight();
          this._type = LightType.RANGED_DIRECTIONAL;
          if (this._light) {
            this._light.illuminanceHDR = this._illuminanceHDR;
            this._light.illuminanceLDR = this._illuminanceLDR;
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
      }), _applyDecoratedDescriptor(_class2.prototype, "illuminance", [_dec5, editable, _dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "illuminance"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class));
    }
  };
});