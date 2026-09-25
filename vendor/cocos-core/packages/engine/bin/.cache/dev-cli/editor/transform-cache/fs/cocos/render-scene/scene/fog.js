System.register("q-bundled:///fs/cocos/render-scene/scene/fog.js", ["../../core/index.js", "../../rendering/pipeline-funcs.js"], function (_export, _context) {
  "use strict";

  var Enum, Color, Vec4, cclegacy, SRGBToLinear, Fog, _v4, FogType, FOG_TYPE_NONE;
  _export("Fog", void 0);
  return {
    setters: [function (_coreIndexJs) {
      Enum = _coreIndexJs.Enum;
      Color = _coreIndexJs.Color;
      Vec4 = _coreIndexJs.Vec4;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_renderingPipelineFuncsJs) {
      SRGBToLinear = _renderingPipelineFuncsJs.SRGBToLinear;
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
      _v4 = new Vec4();
      /**
       * @zh
       * 全局雾类型。
       * @en
       * The global fog type
       * @static
       * @enum FogInfo.FogType
       */
      _export("FogType", FogType = Enum({
        /**
         * @zh
         * 线性雾。
         * @en
         * Linear fog
         * @readonly
         */
        LINEAR: 0,
        /**
         * @zh
         * 指数雾。
         * @en
         * Exponential fog
         * @readonly
         */
        EXP: 1,
        /**
         * @zh
         * 指数平方雾。
         * @en
         * Exponential square fog
         * @readonly
         */
        EXP_SQUARED: 2,
        /**
         * @zh
         * 层叠雾。
         * @en
         * Layered fog
         * @readonly
         */
        LAYERED: 3
      }));
      _export("FOG_TYPE_NONE", FOG_TYPE_NONE = FogType.LAYERED + 1);
      /**
       * @en The fog representation in the render scene.
       * @zh 渲染场景中的全局雾效配置
       */
      _export("Fog", Fog = class Fog {
        constructor() {
          this._fogColor = new Color('#C8C8C8');
          this._colorArray = new Vec4(0.2, 0.2, 0.2, 1.0);
          this._enabled = false;
          this._accurate = false;
          this._type = 0;
          this._fogDensity = 0.3;
          this._fogStart = 0.5;
          this._fogEnd = 300;
          this._fogAtten = 5;
          this._fogTop = 1.5;
          this._fogRange = 1.2;
          this._activated = false;
        }
        /**
         * @zh 是否启用全局雾效
         * @en Enable global fog
         */
        set enabled(val) {
          this._enabled = val;
          if (!val) {
            this._type = FOG_TYPE_NONE;
            this._updatePipeline();
          } else {
            this.activate();
          }
        }
        get enabled() {
          return this._enabled;
        }

        /**
         * @zh 是否启用精确雾效(像素雾)计算
         * @en Enable accurate fog (pixel fog)
         */
        set accurate(val) {
          this._accurate = val;
          this._updatePipeline();
        }
        get accurate() {
          return this._accurate;
        }

        /**
         * @zh 全局雾颜色
         * @en Global fog color
         */
        set fogColor(val) {
          this._fogColor.set(val);
          _v4.set(val.x, val.y, val.z, val.w);
          SRGBToLinear(this._colorArray, _v4);
        }
        get fogColor() {
          return this._fogColor;
        }

        /**
         * @zh 当前雾化类型。
         * @en The current global fog type.
         * @returns {FogType}
         * Returns the current global fog type
         * - -1:Disable global Fog
         * - 0:Linear fog
         * - 1:Exponential fog
         * - 2:Exponential square fog
         * - 3:Layered fog
         */
        get type() {
          return this._type;
        }
        set type(val) {
          this._type = this.enabled ? val : FOG_TYPE_NONE;
          if (this.enabled) this._updatePipeline();
        }

        /**
         * @zh 全局雾浓度
         * @en Global fog density
         */
        get fogDensity() {
          return this._fogDensity;
        }
        set fogDensity(val) {
          this._fogDensity = val;
        }
        /**
         * @zh 雾效起始位置，只适用于线性雾
         * @en Global fog start position, only for linear fog
         */
        get fogStart() {
          return this._fogStart;
        }
        set fogStart(val) {
          this._fogStart = val;
        }

        /**
         * @zh 雾效结束位置，只适用于线性雾
         * @en Global fog end position, only for linear fog
         */
        get fogEnd() {
          return this._fogEnd;
        }
        set fogEnd(val) {
          this._fogEnd = val;
        }

        /**
         * @zh 雾效衰减
         * @en Global fog attenuation
         */
        get fogAtten() {
          return this._fogAtten;
        }
        set fogAtten(val) {
          this._fogAtten = val;
        }

        /**
         * @zh 雾效顶部范围，只适用于层级雾
         * @en Global fog top range, only for layered fog
         */
        get fogTop() {
          return this._fogTop;
        }
        set fogTop(val) {
          this._fogTop = val;
        }

        /**
         * @zh 雾效范围，只适用于层级雾
         * @en Global fog range, only for layered fog
         */
        get fogRange() {
          return this._fogRange;
        }
        set fogRange(val) {
          this._fogRange = val;
        }
        get colorArray() {
          return this._colorArray;
        }
        initialize(fogInfo) {
          this._activated = false;
          this.fogColor = fogInfo.fogColor;
          this._enabled = fogInfo.enabled;
          this._type = this.enabled ? fogInfo.type : FOG_TYPE_NONE;
          this._accurate = fogInfo.accurate;
          this.fogDensity = fogInfo.fogDensity;
          this.fogStart = fogInfo.fogStart;
          this.fogEnd = fogInfo.fogEnd;
          this.fogAtten = fogInfo.fogAtten;
          this.fogTop = fogInfo.fogTop;
          this.fogRange = fogInfo.fogRange;
        }
        activate() {
          this._updatePipeline();
          this._activated = true;
        }
        _updatePipeline() {
          const root = cclegacy.director.root;
          const value = this.enabled ? this.type : FOG_TYPE_NONE;
          const accurateValue = this.accurate ? 1 : 0;
          const pipeline = root.pipeline;
          if (pipeline.macros.CC_USE_FOG === value && pipeline.macros.CC_USE_ACCURATE_FOG === accurateValue) {
            return;
          }
          pipeline.macros.CC_USE_FOG = value;
          pipeline.macros.CC_USE_ACCURATE_FOG = accurateValue;
          if (this._activated) {
            root.onGlobalPipelineStateChanged();
          }
        }
      });
      cclegacy.Fog = Fog;
    }
  };
});