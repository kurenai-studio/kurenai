System.register("q-bundled:///fs/cocos/core/curves/gradient.js", ["../data/index.js", "../value-types/index.js", "../math/index.js"], function (_export, _context) {
  "use strict";

  var CCClass, Enum, Color, lerp, repeat, EPSILON, approx, random, ColorKey, AlphaKey, Gradient, GradientMode;
  _export({
    ColorKey: void 0,
    AlphaKey: void 0,
    Gradient: void 0
  });
  return {
    setters: [function (_dataIndexJs) {
      CCClass = _dataIndexJs.CCClass;
    }, function (_valueTypesIndexJs) {
      Enum = _valueTypesIndexJs.Enum;
    }, function (_mathIndexJs) {
      Color = _mathIndexJs.Color;
      lerp = _mathIndexJs.lerp;
      repeat = _mathIndexJs.repeat;
      EPSILON = _mathIndexJs.EPSILON;
      approx = _mathIndexJs.approx;
      random = _mathIndexJs.random;
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
      GradientMode = /*#__PURE__*/function (GradientMode) {
        GradientMode[GradientMode["Blend"] = 0] = "Blend";
        GradientMode[GradientMode["Fixed"] = 1] = "Fixed";
        return GradientMode;
      }(GradientMode || {});
      Enum(GradientMode);
      _export("ColorKey", ColorKey = class ColorKey {
        constructor() {
          /**
           * @en Color value.
           * @zh 颜色值。
           */
          this.color = Color.WHITE.clone();
          /**
           * @en Time value.
           * @zh 时间值。
           */
          this.time = 0;
        }
      });
      CCClass.fastDefine('cc.ColorKey', ColorKey, {
        color: Color.WHITE.clone(),
        time: 0
      });
      CCClass.Attr.setClassAttr(ColorKey, 'color', 'visible', true);
      CCClass.Attr.setClassAttr(ColorKey, 'time', 'visible', true);
      _export("AlphaKey", AlphaKey = class AlphaKey {
        constructor() {
          /**
           * @en Alpha value.
           * @zh 透明度。
           */
          this.alpha = 1;
          /**
           * @en Time.
           * @zh 时间帧。
           */
          this.time = 0;
        }
      });
      CCClass.fastDefine('cc.AlphaKey', AlphaKey, {
        alpha: 1,
        time: 0
      });
      CCClass.Attr.setClassAttr(AlphaKey, 'alpha', 'visible', true);
      CCClass.Attr.setClassAttr(AlphaKey, 'time', 'visible', true);

      /**
       * @en Gradient is a component that has a lot of color keys and alpha keys to get the interpolated color value.
       * @zh 渐变曲线控件包含了颜色关键帧和透明度关键帧，在关键帧中进行插值渐变返回最终的颜色值。
       */
      _export("Gradient", Gradient = class Gradient {
        constructor() {
          /**
           * @en Array of color key.
           * @zh 颜色关键帧列表。
           */
          this.colorKeys = [];
          /**
           * @en Array of alpha key.
           * @zh 透明度关键帧列表。
           */
          this.alphaKeys = [];
          /**
           * @en Blend mode.
           * @zh 混合模式。
           */
          this.mode = GradientMode.Blend;
        }
        /**
         * @en Set color keys array and alpha keys array.
         * @zh 设置颜色和透明度的关键帧列表。
         * @param colorKeys @en Array of color keys @zh 颜色关键帧列表
         * @param alphaKeys @en Array of alpha keys @zh 透明度关键帧列表
         */
        setKeys(colorKeys, alphaKeys) {
          this.colorKeys = colorKeys;
          this.alphaKeys = alphaKeys;
        }

        /**
         * @en Sort color keys and alpha keys.
         * @zh 对颜色和透明度的关键帧进行排序。
         */
        sortKeys() {
          if (this.colorKeys.length > 1) {
            this.colorKeys.sort((a, b) => a.time - b.time);
          }
          if (this.alphaKeys.length > 1) {
            this.alphaKeys.sort((a, b) => a.time - b.time);
          }
        }

        /**
         * @en Interpolate color and alpha from color and alpha keys.
         * @zh 根据颜色列表插值计算颜色和透明度。
         * @param time @en Normalized time to interpolate. @zh 用于插值的归一化时间。
         * @returns @en Interpolated color value. @zh 插值过后的颜色值。
         *
         * @deprecated since v3.8 please use [[evaluateFast]] instead.
         */
        evaluate(time) {
          return this.evaluateFast(new Color(), time);
        }

        /**
         * @en Interpolate color and alpha from color and alpha keys.
         * @zh 根据颜色列表插值计算颜色和透明度。
         * @param out @en Interpolated color value. @zh 插值过后的颜色值。
         * @param time @en Normalized time to interpolate. @zh 用于插值的归一化时间。
         * @returns @en Interpolated color value. @zh 插值过后的颜色值。
         */
        evaluateFast(out, time) {
          this.getRGB(out, time);
          out.a = this.getAlpha(time);
          return out;
        }

        /**
         * @en Generates a random color and alpha.
         * @zh 随机生成颜色和透明度。
         * @returns @en Randomized color. @zh 随机生成的颜色。
         * @deprecated since v3.8 please use [[getRandomColor]] instead.
         */
        randomColor() {
          return this.getRandomColor(new Color());
        }

        /**
         * @en Generates a random color and alpha.
         * @zh 随机生成颜色和透明度。
         * @param out @en Randomized color. @zh 随机生成的颜色。
         * @returns @en Randomized color. @zh 随机生成的颜色。
         */
        getRandomColor(out) {
          const c = this.colorKeys[Math.trunc(random() * this.colorKeys.length)];
          const a = this.alphaKeys[Math.trunc(random() * this.alphaKeys.length)];
          out.set(c.color);
          out.a = a.alpha;
          return out;
        }
        getRGB(out, time) {
          const colorKeys = this.colorKeys;
          const length = colorKeys.length;
          if (length > 1) {
            time = repeat(time, 1.0 + EPSILON);
            for (let i = 1; i < length; ++i) {
              const preTime = colorKeys[i - 1].time;
              const curTime = colorKeys[i].time;
              if (time >= preTime && time < curTime) {
                if (this.mode === GradientMode.Fixed) {
                  Color.copy(out, colorKeys[i].color);
                  return out;
                }
                const factor = (time - preTime) / (curTime - preTime);
                Color.lerp(out, colorKeys[i - 1].color, colorKeys[i].color, factor);
                return out;
              }
            }
            const lastIndex = length - 1;
            if (approx(time, colorKeys[lastIndex].time, EPSILON)) {
              Color.copy(out, colorKeys[lastIndex].color);
            } else if (time < colorKeys[0].time) {
              Color.lerp(out, Color.BLACK, colorKeys[0].color, time / colorKeys[0].time);
            } else if (time > colorKeys[lastIndex].time) {
              Color.lerp(out, colorKeys[lastIndex].color, Color.BLACK, (time - colorKeys[lastIndex].time) / (1 - colorKeys[lastIndex].time));
            }
            // warn('something went wrong. can not get gradient color.');
          } else if (length === 1) {
            Color.copy(out, colorKeys[0].color);
          } else {
            Color.copy(out, Color.WHITE);
          }
          return out;
        }
        getAlpha(time) {
          const basicAlpha = 0; // default alpha is 0
          const alphaKeys = this.alphaKeys;
          const length = alphaKeys.length;
          if (length > 1) {
            time = repeat(time, 1.0 + EPSILON);
            for (let i = 1; i < length; ++i) {
              const preTime = alphaKeys[i - 1].time;
              const curTime = alphaKeys[i].time;
              if (time >= preTime && time < curTime) {
                if (this.mode === GradientMode.Fixed) {
                  return alphaKeys[i].alpha;
                }
                const factor = (time - preTime) / (curTime - preTime);
                return lerp(alphaKeys[i - 1].alpha, alphaKeys[i].alpha, factor);
              }
            }
            const lastIndex = length - 1;
            if (approx(time, alphaKeys[lastIndex].time, EPSILON)) {
              return alphaKeys[lastIndex].alpha;
            } else if (time < alphaKeys[0].time) {
              return lerp(basicAlpha, alphaKeys[0].alpha, time / alphaKeys[0].time);
            } else if (time > alphaKeys[lastIndex].time) {
              return lerp(alphaKeys[lastIndex].alpha, basicAlpha, (time - alphaKeys[lastIndex].time) / (1 - alphaKeys[lastIndex].time));
            }
            return 255;
          } else if (length === 1) {
            return alphaKeys[0].alpha;
          } else {
            return 255;
          }
        }
      });
      /**
       * @en
       * There are 2 kind of mode:
       * Blend just interpolate the nearest 2 colors from keys.
       * Fixed get the nearest color from keys without interpolate.
       * @zh
       * 这个控件包含了两种取色模式：
       * 混合模式对取到的最近两个颜色帧进行插值计算。
       * 固定模式直接取最近的颜色帧返回，不进行插值。
       */
      Gradient.Mode = GradientMode;
      CCClass.fastDefine('cc.Gradient', Gradient, {
        colorKeys: [],
        alphaKeys: [],
        mode: GradientMode.Blend
      });
      CCClass.Attr.setClassAttr(Gradient, 'colorKeys', 'visible', true);
      CCClass.Attr.setClassAttr(Gradient, 'alphaKeys', 'visible', true);
      CCClass.Attr.setClassAttr(Gradient, 'mode', 'visible', true);
    }
  };
});