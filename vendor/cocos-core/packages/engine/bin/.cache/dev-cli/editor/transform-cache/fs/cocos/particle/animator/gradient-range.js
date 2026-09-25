System.register("q-bundled:///fs/cocos/particle/animator/gradient-range.js", ["../../core/data/decorators/index.js", "../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../asset/assets/index.js", "../../asset/assets/asset-enum.js"], function (_export, _context) {
  "use strict";

  var ccclass, type, serializable, editable, EDITOR, EDITOR_NOT_IN_PREVIEW, Color, Enum, Gradient, AlphaKey, ColorKey, Texture2D, PixelFormat, TextureFilter, WrapMode, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _GradientRange, SerializableTable, Mode, tempColor, tempColor2, GradientRange;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function evaluateGradient(gr, time, index) {
    switch (gr.mode) {
      case Mode.Color:
        return gr.color;
      case Mode.TwoColors:
        return index === 0 ? gr.colorMin : gr.colorMax;
      case Mode.RandomColor:
        return gr.gradient.getRandomColor(tempColor);
      case Mode.Gradient:
        return gr.gradient.evaluateFast(tempColor, time);
      case Mode.TwoGradients:
        return index === 0 ? gr.gradientMin.evaluateFast(tempColor, time) : gr.gradientMax.evaluateFast(tempColor, time);
      default:
        return gr.color;
    }
  }
  function evaluateHeight(gr) {
    switch (gr.mode) {
      case Mode.TwoColors:
        return 2;
      case Mode.TwoGradients:
        return 2;
      default:
        return 1;
    }
  }
  function packGradientRange(tex, data, samples, gr) {
    const height = evaluateHeight(gr);
    const len = samples * height * 4;
    if (data === null || data.length !== len) {
      data = new Uint8Array(samples * height * 4);
    }
    const interval = 1.0 / (samples - 1);
    let offset = 0;
    for (let h = 0; h < height; h++) {
      for (let j = 0; j < samples; j++) {
        const color = evaluateGradient(gr, interval * j, h);
        data[offset] = color.r;
        data[offset + 1] = color.g;
        data[offset + 2] = color.b;
        data[offset + 3] = color.a;
        offset += 4;
      }
    }
    if (tex === null || samples !== tex.width || height !== tex.height) {
      if (tex) {
        tex.destroy();
      }
      tex = new Texture2D();
      tex.create(samples, height, PixelFormat.RGBA8888);
      tex.setFilters(TextureFilter.LINEAR, TextureFilter.LINEAR);
      tex.setWrapMode(WrapMode.CLAMP_TO_EDGE, WrapMode.CLAMP_TO_EDGE);
    }
    tex.uploadData(data);
    return {
      texture: tex,
      texdata: data
    };
  }
  _export("packGradientRange", packGradientRange);
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      editable = _coreDataDecoratorsIndexJs.editable;
    }, function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Enum = _coreIndexJs.Enum;
      Gradient = _coreIndexJs.Gradient;
      AlphaKey = _coreIndexJs.AlphaKey;
      ColorKey = _coreIndexJs.ColorKey;
    }, function (_assetAssetsIndexJs) {
      Texture2D = _assetAssetsIndexJs.Texture2D;
    }, function (_assetAssetsAssetEnumJs) {
      PixelFormat = _assetAssetsAssetEnumJs.PixelFormat;
      TextureFilter = _assetAssetsAssetEnumJs.TextureFilter;
      WrapMode = _assetAssetsAssetEnumJs.WrapMode;
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
      SerializableTable = EDITOR && [['_mode', 'color'], ['_mode', 'gradient'], ['_mode', 'colorMin', 'colorMax'], ['_mode', 'gradientMin', 'gradientMax'], ['_mode', 'gradient']];
      /**
       * @en
       * Gradinet is a component to calculate color value. It contains 5 modes:
       * Color is just the color value all the time.
       * Two Colors has 2 color values to interpolate the color value.
       * Gradient value is generated by many color keys interpolation.
       * Two Gradients has 2 gradients. The value is calculated by interpolation of the 2 gradients value.
       * Random Color has one gradient. The value is get from color keys of the gradient randomly.
       * @zh
       * 渐变曲线是用来计算颜色值的控件，它包含五种模式：
       * 单色从头到尾只返回一种颜色值。
       * 双色包含两个颜色值，返回两种颜色之间的插值。
       * 渐变曲线包含许多颜色帧，返回颜色帧之间的插值。
       * 双渐变曲线包含两个渐变曲线，对两个渐变曲线返回的颜色值再进行插值。
       * 随机颜色包含一个颜色曲线，从曲线中随机获取颜色值。
       */
      Mode = Enum({
        Color: 0,
        Gradient: 1,
        TwoColors: 2,
        TwoGradients: 3,
        RandomColor: 4
      });
      tempColor = new Color();
      tempColor2 = new Color();
      /**
       * @en
       * GradientRange is a data structure which contains some constant colors or gradients.
       * Calculate the color by its mode and particle system will use it to change particle attribute associated with it.
       * Refer [[GradientRange.Mode]] to see the detail of calculation mode.
       * @zh
       * GradientRange 是一类数据结构，其包含了多个常数颜色或渐变色，计算时其将根据计算模式计算最终颜色，粒子系统使用此数据结构对所有的粒子的属性进行修改。
       * 详细的计算模式请参考 [[GradientRange.Mode]] 的解释。
       */
      _export("default", GradientRange = (_dec = ccclass('cc.GradientRange'), _dec2 = type(Mode), _dec3 = type(Gradient), _dec4 = type(Gradient), _dec5 = type(Gradient), _dec6 = type(Mode), _dec(_class = (_class2 = (_GradientRange = class GradientRange {
        constructor() {
          /**
           * @en Color value when use color mode.
           * @zh 当 mode 为 Color 时的颜色。
           */
          _initializerDefineProperty(this, "color", _descriptor, this);
          /**
           * @en Min color value when use TwoColors mode.
           * @zh 当 mode 为 TwoColors 时的颜色下限。
           */
          _initializerDefineProperty(this, "colorMin", _descriptor2, this);
          /**
           * @en Max color value when use TwoColors mode.
           * @zh 当 mode 为 TwoColors 时的颜色上限。
           */
          _initializerDefineProperty(this, "colorMax", _descriptor3, this);
          /**
           * @en Gradient value when use gradient mode.
           * @zh 当 mode 为 Gradient 时的颜色渐变。
           */
          _initializerDefineProperty(this, "gradient", _descriptor4, this);
          /**
           * @en Gradient min value when use TwoGradients.
           * @zh 当mode为TwoGradients时的颜色渐变下限。
           */
          _initializerDefineProperty(this, "gradientMin", _descriptor5, this);
          /**
           * @en Gradient max value when use TwoGradients.
           * @zh 当 mode 为 TwoGradients 时的颜色渐变上限。
           */
          _initializerDefineProperty(this, "gradientMax", _descriptor6, this);
          _initializerDefineProperty(this, "_mode", _descriptor7, this);
          this._color = Color.WHITE.clone();
        }
        /**
         * @en Gets/Sets color gradient mode to use. See [[Mode]].
         * @zh 使用的渐变色类型 参考 [[Mode]]。
         */
        get mode() {
          return this._mode;
        }
        set mode(m) {
          if (EDITOR_NOT_IN_PREVIEW) {
            if (m === Mode.RandomColor) {
              if (this.gradient.colorKeys.length === 0) {
                this.gradient.colorKeys.push(new ColorKey());
              }
              if (this.gradient.alphaKeys.length === 0) {
                this.gradient.alphaKeys.push(new AlphaKey());
              }
            }
          }
          this._mode = m;
        }

        /**
         * @en The gradient mode. See [[Mode]].
         * @zh 渐变色类型 参考 [[Mode]]。
         */

        /**
         * @en Calculate gradient value.
         * @zh 计算颜色渐变曲线数值。
         * @param time @en Normalized time to interpolate. @zh 用于插值的归一化时间。
         * @param rndRatio @en Interpolation ratio when mode is TwoColors or TwoGradients.
         *                     Particle attribute will pass in a random number to get a random result.
         *                 @zh 当模式为双色或双渐变色时，使用的插值比例，通常粒子系统会传入一个随机数以获得一个随机结果。
         * @returns @en Gradient value. @zh 颜色渐变曲线的值。
         */
        evaluate(time, rndRatio) {
          switch (this._mode) {
            case Mode.Color:
              return this.color;
            case Mode.TwoColors:
              Color.lerp(this._color, this.colorMin, this.colorMax, rndRatio);
              return this._color;
            case Mode.RandomColor:
              return this.gradient.getRandomColor(this._color);
            case Mode.Gradient:
              return this.gradient.evaluateFast(this._color, time);
            case Mode.TwoGradients:
              Color.lerp(this._color, this.gradientMin.evaluateFast(tempColor, time), this.gradientMax.evaluateFast(tempColor2, time), rndRatio);
              return this._color;
            default:
              return this.color;
          }
        }

        /**
         * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
         */
        _onBeforeSerialize(props) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return SerializableTable[this._mode];
        }
      }, _GradientRange.Mode = Mode, _GradientRange), _applyDecoratedDescriptor(_class2.prototype, "mode", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "mode"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "color", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "colorMin", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "colorMax", [serializable, editable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Color.WHITE.clone();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "gradient", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Gradient();
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "gradientMin", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Gradient();
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "gradientMax", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Gradient();
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "_mode", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Mode.Color;
        }
      }), _class2)) || _class));
    }
  };
});