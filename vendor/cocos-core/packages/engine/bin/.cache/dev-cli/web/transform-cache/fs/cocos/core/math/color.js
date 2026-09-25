System.register("q-bundled:///fs/cocos/core/math/color.js", ["../data/class.js", "../value-types/value-type.js", "./utils.js", "../global-exports.js", "../data/utils/asserts.js", "./vec4.js", "./vec3.js"], function (_export, _context) {
  "use strict";

  var CCClass, ValueType, clamp, EPSILON, legacyCC, assertIsTrue, Vec4, Vec3, Color, toFloat, R_INDEX, G_INDEX, B_INDEX, A_INDEX, mathAbs, mathMax, SRGB_8BIT_TO_LINEAR;
  function freezeColor(r, g, b, a) {
    return Object.freeze(new Color(r, g, b, a));
  }

  /**
   * @en Representation of RGBA colors.<br/>
   * Each color component is an integer value with a range from 0 to 255.<br/>
   * @zh 通过 Red、Green、Blue 颜色通道表示颜色，并通过 Alpha 通道表示不透明度。<br/>
   * 每个通道都为取值范围 [0, 255] 的整数。<br/>
   */

  function color(r, g, b, a) {
    return new Color(r, g, b, a);
  }
  function srgbToLinear(x) {
    if (x <= 0) return 0;else if (x >= 1) return 1;else if (x < 0.04045) return x / 12.92;else return ((x + 0.055) / 1.055) ** 2.4;
  }
  function srgb8BitToLinear(x) {
    if ((x | 0) !== x || x >>> 8 !== 0) {
      throw new RangeError('Value out of 8-bit range');
    }
    return SRGB_8BIT_TO_LINEAR[x];
  }
  function linearToSrgb(x) {
    if (x <= 0) return 0;else if (x >= 1) return 1;else if (x < 0.0031308) return x * 12.92;else return x ** (1 / 2.4) * 1.055 - 0.055;
  }
  function linearToSrgb8Bit(x) {
    if (x <= 0) {
      return 0;
    }
    const TABLE = SRGB_8BIT_TO_LINEAR;
    if (x >= 1) {
      return TABLE.length - 1;
    }
    let y = 0;
    for (let i = TABLE.length >>> 1; i !== 0; i >>>= 1) {
      if (TABLE[y | i] <= x) {
        y |= i;
      }
    }
    if (x - TABLE[y] <= TABLE[y + 1] - x) {
      return y;
    } else {
      return y + 1;
    }
  }

  // use table for more consistent conversion between uint8 and float, offline processes only.

  /**
   * @en Three channel rgb color pack into four channel rbge format.
   * @zh 三通道rgb颜色pack成四通道rbge格式
   * @param rgb Vec3
   */
  function clampVec3(val, min, max) {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    return val < min ? min : val > max ? max : val;
  }
  function floorVec3(val) {
    const temp = val.clone();
    temp.x = Math.floor(val.x);
    temp.y = Math.floor(val.y);
    temp.z = Math.floor(val.z);
    return temp;
  }
  function stepVec3(a, b) {
    if (a < b) {
      return b;
    } else {
      return a;
    }
  }
  function packRGBE(rgb) {
    const maxComp = Math.max(Math.max(rgb.x, rgb.y), rgb.z);
    let e = 128.0;
    if (maxComp > 0.0001) {
      e = Math.log(maxComp) / Math.log(1.1);
      e = Math.ceil(e);
      e = clamp(e + 128.0, 0.0, 255.0);
    }
    // eslint-disable-next-line no-restricted-properties
    const sc = 1.0 / 1.1 ** (e - 128.0);
    const encode = clampVec3(rgb.multiplyScalar(sc), new Vec3(0.0, 0.0, 0.0), new Vec3(1.0, 1.0, 1.0));
    encode.multiplyScalar(255.0);
    const encode_rounded = floorVec3(encode).add(stepVec3(encode.subtract(floorVec3(encode)), new Vec3(0.5, 0.5, 0.5)));
    return new Vec4(encode_rounded.x / 255.0, encode_rounded.y / 255.0, encode_rounded.z / 255.0, e / 255.0);
  }
  _export({
    Color: void 0,
    color: color,
    srgbToLinear: srgbToLinear,
    srgb8BitToLinear: srgb8BitToLinear,
    linearToSrgb: linearToSrgb,
    linearToSrgb8Bit: linearToSrgb8Bit,
    clampVec3: clampVec3,
    floorVec3: floorVec3,
    stepVec3: stepVec3,
    packRGBE: packRGBE
  });
  return {
    setters: [function (_dataClassJs) {
      CCClass = _dataClassJs.CCClass;
    }, function (_valueTypesValueTypeJs) {
      ValueType = _valueTypesValueTypeJs.ValueType;
    }, function (_utilsJs) {
      clamp = _utilsJs.clamp;
      EPSILON = _utilsJs.EPSILON;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }, function (_dataUtilsAssertsJs) {
      assertIsTrue = _dataUtilsAssertsJs.assertIsTrue;
    }, function (_vec4Js) {
      Vec4 = _vec4Js.Vec4;
    }, function (_vec3Js) {
      Vec3 = _vec3Js.Vec3;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2024 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      toFloat = 1 / 255;
      R_INDEX = 0;
      G_INDEX = 1;
      B_INDEX = 2;
      A_INDEX = 3;
      mathAbs = Math.abs;
      mathMax = Math.max;
      _export("Color", Color = class Color extends ValueType {
        /**
         * @en Copy content of a color into another and save the results to out color.
         * @zh 获得指定颜色的拷贝
         */
        static clone(a) {
          const out = new Color();
          out.r = a.r;
          out.g = a.g;
          out.b = a.b;
          out.a = a.a;
          return out;
        }

        /**
         * @en Clone a color and save the results to out color.
         * @zh 复制目标颜色
         */
        static copy(out, a) {
          out.r = a.r;
          out.g = a.g;
          out.b = a.b;
          out.a = a.a;
          return out;
        }

        /**
         * @en Set the components of a color to the given values and save the results to out color.
         * @zh 设置颜色值
         */
        static set(out, r, g, b, a) {
          out.r = r;
          out.g = g;
          out.b = b;
          out.a = a;
          return out;
        }
        /**
         * @en Convert linear color from rgb8 0~255 to Vec4 0~1
         * @zh 将当前颜色转换为到 Vec4
         * @returns Vec4 as float color value
         * @example
         * ```
         * const color = Color.YELLOW;
         * color.toVec4();
         * ```
         */
        static toVec4(color, out) {
          const sourceData = color._data;
          out = out !== undefined ? out : new Vec4();
          out.x = sourceData[R_INDEX] * toFloat;
          out.y = sourceData[G_INDEX] * toFloat;
          out.z = sourceData[B_INDEX] * toFloat;
          out.w = sourceData[A_INDEX] * toFloat;
          return out;
        }
        /**
         * @en Convert 8bit linear color from Vec4
         * @zh 使用 Vec4 设置 8 bit 颜色
         * @returns 8 Bit srgb value
         * @example
         * ```
         * color.fromVec4(new Vec4(1,1,1,1));
         * ```
         */
        static fromVec4(value, out) {
          out = out === undefined ? new Color() : out;
          const outData = out._data;
          outData[R_INDEX] = value.x / toFloat;
          outData[G_INDEX] = value.y / toFloat;
          outData[B_INDEX] = value.z / toFloat;
          outData[A_INDEX] = value.w / toFloat;
          return out;
        }
        /**
         * @en Converts the hexadecimal formal color into rgb formal and save the results to out color.
         *   the argument `hex` could be hex-string or hex-number (8-digit or 6-digit).
         *   the hex-string should be like : '#12345678' '#123456', '123456', '12345678'.
         *   the hex-number should be like : 0x12345678, 0x123456 .
         * @zh 从十六进制颜色字符串中读入颜色到 out 中
         *   参数 hex 支持 16进制字符串 或者 16进制数值 (8位数字 或者 6位数字).
         *   16进制字符串的格式应该类似: '#12345678' '#123456', '123456', '12345678'.
         *   16进制数值的格式应该类似:  0x12345678, 0x123456 .
         */
        static fromHEX(out, hex) {
          let hexNumber;
          if (typeof hex === 'string') {
            hex = hex[0] === '#' ? hex.substring(1) : hex;
            if (hex.length === 6) {
              hex += 'FF';
            } else if (hex.length === 3) {
              hex = `${hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]}FF`;
            } else if (hex.length === 4) {
              hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
            }
            hexNumber = Number(`0x${hex}`);
          } else {
            if (hex < 0x1000000) {
              hex = (hex << 8) + 0xff;
            }
            hexNumber = hex;
          }
          out.r = hexNumber >>> 24;
          out.g = (hexNumber & 0x00ff0000) >>> 16;
          out.b = (hexNumber & 0x0000ff00) >>> 8;
          out.a = hexNumber & 0x000000ff;
          return out;
        }

        /**
         * @en Add two colors by components. And save the results to out color.
         * @zh 逐通道颜色加法
         */
        static add(out, a, b) {
          out.r = a.r + b.r;
          out.g = a.g + b.g;
          out.b = a.b + b.b;
          out.a = a.a + b.a;
          return out;
        }

        /**
         * @en Subtract each components of color b from each components of color a. And save the results to out color.
         * @zh 逐通道颜色减法
         */
        static subtract(out, a, b) {
          out.r = a.r - b.r;
          out.g = a.g - b.g;
          out.b = a.b - b.b;
          out.a = a.a - b.a;
          return out;
        }

        /**
         * @en Multiply each components of two colors. And save the results to out color.
         * @zh 逐通道颜色乘法
         */
        static multiply(out, a, b) {
          out.r = a.r * b.r;
          out.g = a.g * b.g;
          out.b = a.b * b.b;
          out.a = a.a * b.a;
          return out;
        }

        /**
         * @en Divide each components of color a by each components of color b. And save the results to out color.
         * @zh 逐通道颜色除法
         */
        static divide(out, a, b) {
          out.r = a.r / b.r;
          out.g = a.g / b.g;
          out.b = a.b / b.b;
          out.a = a.a / b.a;
          return out;
        }

        /**
         * @en Multiply all channels in a color with the given scale factor, and save the results to out color.
         * @zh 全通道统一缩放颜色
         */
        static scale(out, a, b) {
          out.r = a.r * b;
          out.g = a.g * b;
          out.b = a.b * b;
          out.a = a.a * b;
          return out;
        }

        /**
         * @en Performs a linear interpolation between two colors.
         * @zh 逐通道颜色线性插值：A + t * (B - A)
         */
        static lerp(out, from, to, ratio) {
          const fromR = from.r;
          const fromG = from.g;
          const fromB = from.b;
          const fromA = from.a;
          out.r = fromR + (to.r - fromR) * ratio;
          out.g = fromG + (to.g - fromG) * ratio;
          out.b = fromB + (to.b - fromB) * ratio;
          out.a = fromA + (to.a - fromA) * ratio;
          return out;
        }

        /**
         * @en Convert a color object to a RGBA array, and save the results to out color.
         * @zh 颜色转数组
         * @param ofs Array Start Offset
         */
        static toArray(out, a, ofs = 0) {
          const scale = a instanceof Color || a.a > 1 ? 1 / 255 : 1;
          out[ofs + 0] = a.r * scale;
          out[ofs + 1] = a.g * scale;
          out[ofs + 2] = a.b * scale;
          out[ofs + 3] = a.a * scale;
          return out;
        }

        /**
         * @en Sets the given color with RGBA values in an array, and save the results to out color.
         * @zh 数组转颜色
         * @param ofs Array Start Offset
         */
        static fromArray(arr, out, ofs = 0) {
          out.r = arr[ofs + 0] * 255;
          out.g = arr[ofs + 1] * 255;
          out.b = arr[ofs + 2] * 255;
          out.a = arr[ofs + 3] * 255;
          return out;
        }

        /**
         * @zh 从无符号 32 位整数构造颜色，高 8 位为 alpha 通道，次高 8 位为蓝色通道，次低 8 位为绿色通道，低 8 位为红色通道。
         * @en Construct color from a unsigned 32 bit integer, the highest 8 bits is for alpha channel, the second highest 8 bits is for blue channel,
         * the second lowest 8 bits is for green channel, and the lowest 8 bits if for red channel.
         *
         * @param out @en Output color object. @zh 输出的颜色对象。
         * @param uint32 @en The unsigned 32 bit integer @zh 32 位无符号整数
         * @returns @en The `out` object @zh `out` 对象
         */
        static fromUint32(out, uint32) {
          // Make sure it is an unsigned value.
          uint32 >>>= 0;
          out.r = uint32 & 0xff;
          out.g = uint32 >> 8 & 0xff;
          out.b = uint32 >> 16 & 0xff;
          out.a = uint32 >> 24 & 0xff;
          return out;
        }

        /**
         * @zh 转换当前颜色为无符号 32 位整数, 高 8 位为 alpha 通道，次高 8 位为蓝色通道，次低 8 位为绿色通道，低 8 位为红色通道。
         * @en Convert the current color to a unsigned 32 bit integer, the highest 8 bits is for alpha channel,
         * the second highest 8 bits is for blue channel, the second lowest 8 bits is for green channel, and the lowest 8 bits if for red channel.
         *
         * @param color @en The color. @zh 颜色。
         * @returns @en The converted unsigned 32 bit integer. @zh 32 位无符号整数。
         */
        static toUint32(color) {
          return (color.a << 24 | color.b << 16 | color.g << 8 | color.r) >>> 0;
        }

        /**
         * @en Check whether the two given colors are identical
         * @zh 颜色等价判断
         */
        static strictEquals(a, b) {
          return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
        }

        /**
         * @en Check whether the two given colors are approximately equivalent. Difference of each channel is smaller that the epsilon.
         * @zh 排除浮点数误差的颜色近似等价判断
         */
        static equals(a, b, epsilon = EPSILON) {
          const hasInf = mathAbs(a.r) === Infinity || mathAbs(a.g) === Infinity || mathAbs(a.b) === Infinity || mathAbs(a.a) === Infinity;
          return !hasInf && mathAbs(a.r - b.r) <= epsilon * mathMax(1.0, mathAbs(a.r), mathAbs(b.r)) && mathAbs(a.g - b.g) <= epsilon * mathMax(1.0, mathAbs(a.g), mathAbs(b.g)) && mathAbs(a.b - b.b) <= epsilon * mathMax(1.0, mathAbs(a.b), mathAbs(b.b)) && mathAbs(a.a - b.a) <= epsilon * mathMax(1.0, mathAbs(a.a), mathAbs(b.a));
        }

        /**
         * @en Convert the given color to a hex color value. And save the results to out color.
         * @zh 获取指定颜色的整型数据表示
         */
        static hex(a) {
          return (a.r * 255 << 24 | a.g * 255 << 16 | a.b * 255 << 8 | a.a * 255) >>> 0;
        }
        /**
         * @en Get or set red channel value.
         * @zh 获取或设置当前颜色的 Red 通道。
         */
        get r() {
          return this._data[R_INDEX];
        }
        set r(red) {
          this._data[R_INDEX] = red;
        }

        /**
         * @en Get or set green channel value.
         * @zh 获取或设置当前颜色的 Green 通道。
         */
        get g() {
          return this._data[G_INDEX];
        }
        set g(green) {
          this._data[G_INDEX] = green;
        }

        /**
         * @en Get or set blue channel value.
         * @zh 获取或设置当前颜色的 Blue 通道。
         */
        get b() {
          return this._data[B_INDEX];
        }
        set b(blue) {
          this._data[B_INDEX] = blue;
        }

        /** @en Get or set alpha channel value.
         * @zh 获取或设置当前颜色的透明度通道。
         */
        get a() {
          return this._data[A_INDEX];
        }
        set a(alpha) {
          this._data[A_INDEX] = alpha;
        }

        // compatibility with vector interfaces
        get x() {
          return this._data[R_INDEX] * toFloat;
        }
        set x(value) {
          this._data[R_INDEX] = value * 255;
        }
        get y() {
          return this._data[G_INDEX] * toFloat;
        }
        set y(value) {
          this._data[G_INDEX] = value * 255;
        }
        get z() {
          return this._data[B_INDEX] * toFloat;
        }
        set z(value) {
          this._data[B_INDEX] = value * 255;
        }
        get w() {
          return this._data[A_INDEX] * toFloat;
        }
        set w(value) {
          this._data[A_INDEX] = value * 255;
        }

        /**
         * @en Construct a same color from the given color
         * @zh 构造与指定颜色相等的颜色。
         * @param other Specified color
         */

        /**
         * @en Construct a color form the hex color string
         * @zh 用十六进制颜色字符串中构造颜色。
         * @param hexString Hexadecimal color string.
         */

        /**
         * @en Construct a color
         * @zh 构造具有指定通道的颜色。
         * @param r red component of the color, default value is 0.
         * @param g green component of the color, default value is 0.
         * @param b blue component of the color, default value is 0.
         * @param a alpha component of the color, default value is 255.
         */

        constructor(r, g, b, a) {
          super();
          this._data = new Uint8ClampedArray(4);
          if (typeof r === 'string') {
            this.fromHEX(r);
          } else if (g !== undefined) {
            this.set(r, g, b, a);
          } else {
            this.set(r);
          }
        }

        /**
         * @en Clone a new color from the current color.
         * @zh 克隆当前颜色。
         */
        clone() {
          const ret = new Color();
          ret._data.set(this._data);
          return ret;
        }

        /**
         * @en Check whether the current color is identical with the given color
         * @zh 判断当前颜色是否与指定颜色相等。
         * @param other Specified color
         * @returns Returns `true` when all channels of both colors are equal; otherwise returns `false`.
         */
        equals(other) {
          const otherColor = other;
          const thisData = this._data;
          // otherColor may not be Color instance if invoked by tween action, so use getter to get property values.
          return other && thisData[R_INDEX] === otherColor.r && thisData[G_INDEX] === otherColor.g && thisData[B_INDEX] === otherColor.b && thisData[A_INDEX] === otherColor.a;
        }

        /**
         * @en Calculate linear interpolation result between this color and another one with given ratio。
         * @zh 根据指定的插值比率，从当前颜色到目标颜色之间做插值。
         * @param to Target color
         * @param ratio The interpolation coefficient.The range is [0,1].
         */
        lerp(to, ratio) {
          Color.lerp(this, this, to, ratio);
          return this;
        }

        /**
         * @en Convert to string with color information.
         * @zh 返回当前颜色的字符串表示。
         * @returns A string representation of the current color.
         */
        toString() {
          return `rgba(${this.r.toFixed()}, ${this.g.toFixed()}, ${this.b.toFixed()}, ${this.a.toFixed()})`;
        }

        /**
         * @en Convert color to css format.
         * @zh 将当前颜色转换为 CSS 格式。
         * @param opt "rgba", "rgb", "#rgb" or "#rrggbb".
         * @returns CSS format for the current color.
         * @example
         * ```ts
         * let color = cc.Color.BLACK;
         * color.toCSS();          // "rgba(0,0,0,1.00)";
         * color.toCSS("rgba");    // "rgba(0,0,0,1.00)";
         * color.toCSS("rgb");     // "rgba(0,0,0)";
         * color.toCSS("#rgb");    // "#000";
         * color.toCSS("#rrggbb"); // "#000000";
         * ```
         */
        toCSS(opt = 'rgba') {
          if (opt === 'rgba') {
            return `rgba(${this.r},${this.g},${this.b},${(this.a * toFloat).toFixed(2)})`;
          } else if (opt === 'rgb') {
            return `rgb(${this.r},${this.g},${this.b})`;
          } else {
            return `#${this.toHEX(opt)}`;
          }
        }

        /**
         * @en Converts the hexadecimal formal color into rgb formal and save the results to current color object.
         *   the argument `hex` could be hex-string or hex-number (8-digit or 6-digit).
         *   the hex-string should be like : '#12345678' '#123456', '123456', '12345678'.
         *   the hex-number should be like : 0x12345678, 0x123456 .
         * @zh 从十六进制颜色字符串中读入颜色到 当前color对象中
         *   参数 hex 支持 16进制字符串 或者 16进制数值 (8位数字 或者 6位数字).
         *   16进制字符串的格式应该类似: '#12345678' '#123456', '123456', '12345678'.
         *   16进制数值的格式应该类似:  0x12345678, 0x123456 .
         * @param hex the hex-string or hex-number
         * @returns `this`
         */
        fromHEX(hex) {
          let hexNumber;
          if (typeof hex === 'string') {
            hex = hex[0] === '#' ? hex.substring(1) : hex;
            if (hex.length === 6) {
              hex += 'FF';
            } else if (hex.length === 3) {
              hex = `${hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]}FF`;
            } else if (hex.length === 4) {
              hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
            }
            hexNumber = Number(`0x${hex}`);
          } else {
            if (hex < 0x1000000) {
              hex = (hex << 8) + 0xff;
            }
            hexNumber = hex;
          }
          this.r = hexNumber >>> 24;
          this.g = (hexNumber & 0x00ff0000) >>> 16;
          this.b = (hexNumber & 0x0000ff00) >>> 8;
          this.a = hexNumber & 0x000000ff;
          return this;
        }

        /**
         * @en convert Color to HEX color string.
         * @zh 转换当前颜色为十六进制颜色字符串。
         * @param fmt "#rrggbb" or "#rrggbbaa".
         * - `'#rrggbbaa'` obtains the hexadecimal value of the Red, Green, Blue,
         *   Alpha channels (**two**, high complement 0) and connects them sequentially.
         * - `'#rrggbb'` is similar to `'#rrggbbaa'` but does not include the Alpha channel.
         * @returns the Hex color string
         * @example
         * ```
         * const color = new Color(255, 14, 0, 255);
         * color.toHEX("#rgb");      // "f00";
         * color.toHEX("#rrggbbaa"); // "ff0e00ff"
         * color.toHEX("#rrggbb");   // "ff0e00"
         * ```
         */
        toHEX(fmt = '#rrggbb') {
          const thisData = this._data;
          const prefix = '0';
          // #rrggbb
          const hex = [(thisData[R_INDEX] < 16 ? prefix : '') + thisData[R_INDEX].toString(16), (thisData[G_INDEX] < 16 ? prefix : '') + thisData[G_INDEX].toString(16), (thisData[B_INDEX] < 16 ? prefix : '') + thisData[B_INDEX].toString(16)];
          const i = -1;
          if (fmt === '#rgb') {
            hex[0] = hex[0][0];
            hex[1] = hex[1][0];
            hex[2] = hex[2][0];
          } else if (fmt === '#rrggbbaa') {
            hex.push((thisData[A_INDEX] < 16 ? prefix : '') + thisData[A_INDEX].toString(16));
          }
          return hex.join('');
        }

        /**
         * @en Convert to rgb value.
         * @zh 将当前颜色转换为 RGB 整数值。
         * @returns RGB integer value. Starting from the lowest valid bit, each 8 bits is the value of the Red, Green, and Blue channels respectively.
         * @example
         * ```
         * const color = Color.YELLOW;
         * color.toRGBValue();
         * ```
         */
        toRGBValue() {
          return this._data[B_INDEX] << 16 | this._data[G_INDEX] << 8 | this._data[R_INDEX];
        }

        /**
         * @en Read HSV model color and convert to RGB color.
         * @zh 从 HSV 颜色中读入当前颜色。
         * @param h H value。
         * @param s S value。
         * @param v V value。
         * @returns `this`
         * @example
         * ```
         * const color = Color.YELLOW;
         * color.fromHSV(0, 0, 1); // Color {r: 255, g: 255, b: 255, a: 255};
         * ```
         */
        fromHSV(h, s, v) {
          let r = 0;
          let g = 0;
          let b = 0;
          if (s === 0) {
            r = g = b = v;
          } else if (v === 0) {
            r = g = b = 0;
          } else {
            if (h === 1) {
              h = 0;
            }
            h *= 6;
            const i = Math.floor(h);
            const f = h - i;
            const p = v * (1 - s);
            const q = v * (1 - s * f);
            const t = v * (1 - s * (1 - f));
            switch (i) {
              default:
                assertIsTrue(false);
              // eslint-disable-next-line no-fallthrough
              case 0:
                r = v;
                g = t;
                b = p;
                break;
              case 1:
                r = q;
                g = v;
                b = p;
                break;
              case 2:
                r = p;
                g = v;
                b = t;
                break;
              case 3:
                r = p;
                g = q;
                b = v;
                break;
              case 4:
                r = t;
                g = p;
                b = v;
                break;
              case 5:
                r = v;
                g = p;
                b = q;
                break;
            }
          }
          const thisData = this._data;
          thisData[R_INDEX] = r * 255;
          thisData[G_INDEX] = g * 255;
          thisData[B_INDEX] = b * 255;
          return this;
        }

        /**
         * @en Transform to HSV model color.
         * @zh 转换当前颜色为 HSV 颜色。
         * @returns HSV format color
         * @example
         * ```
         * import { Color } from 'cc';
         * const color = Color.YELLOW;
         * color.toHSV(); // {h: 0.1533864541832669, s: 0.9843137254901961, v: 1}
         * ```
         */
        toHSV() {
          const r = this._data[R_INDEX] * toFloat;
          const g = this._data[G_INDEX] * toFloat;
          const b = this._data[B_INDEX] * toFloat;
          const hsv = {
            h: 0,
            s: 0,
            v: 0
          };
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let delta = 0;
          hsv.v = max;
          hsv.s = max ? (max - min) / max : 0;
          if (!hsv.s) {
            hsv.h = 0;
          } else {
            delta = max - min;
            if (r === max) {
              hsv.h = (g - b) / delta;
            } else if (g === max) {
              hsv.h = 2 + (b - r) / delta;
            } else {
              hsv.h = 4 + (r - g) / delta;
            }
            hsv.h /= 6;
            if (hsv.h < 0) {
              hsv.h += 1.0;
            }
          }
          return hsv;
        }

        /**
         * @en Set the color.
         * @zh 设置当前颜色使其与指定颜色相等。
         * @param other The specified color.
         * @overload
         * @param [r=0] red component of the color, the range is [0-255]
         * @param [g=0] green component of the color
         * @param [b=0] blue component of the color
         * @param [a=255] alpha component of the color
         * @returns Current color.
         */

        set(r, g, b, a) {
          const thisData = this._data;
          if (typeof r === 'object') {
            const other = r;
            if (other._data) {
              // Tween action uses reflection to set color, so other may be just a IColorLike object.
              // So should check _data property.
              thisData.set(other._data);
            } else {
              var _other$r, _other$g, _other$b, _other$a;
              thisData[R_INDEX] = (_other$r = other.r) != null ? _other$r : 0;
              thisData[G_INDEX] = (_other$g = other.g) != null ? _other$g : 0;
              thisData[B_INDEX] = (_other$b = other.b) != null ? _other$b : 0;
              thisData[A_INDEX] = (_other$a = other.a) != null ? _other$a : 255;
            }
          } else {
            thisData[R_INDEX] = r != null ? r : 0;
            thisData[G_INDEX] = g != null ? g : 0;
            thisData[B_INDEX] = b != null ? b : 0;
            thisData[A_INDEX] = a != null ? a : 255;
          }
          return this;
        }

        /**
         * @en Multiplies the current color by the specified color.
         * @zh 将当前颜色乘以与指定颜色
         * @param other The specified color.
         */
        multiply(other) {
          const thisData = this._data;
          // FIXME: not sure if other is really Color, so use getter.
          thisData[R_INDEX] *= other.r / 255;
          thisData[G_INDEX] *= other.g / 255;
          thisData[B_INDEX] *= other.b / 255;
          thisData[A_INDEX] *= other.a / 255;
          return this;
        }

        /**
         * @en It is used in tween action. As can not modify this._data directly.
         * @zn 被 tween action 使用。因为不能直接修改 this._data，所以返回用于修改的属性。
         * @returns @en ['r', 'g', 'b', 'a'] @zh ['r', 'g', 'b', 'a']
         */
        getModifiableProperties() {
          return ['r', 'g', 'b', 'a'];
        }
      });
      Color.WHITE = freezeColor(255, 255, 255, 255);
      Color.GRAY = freezeColor(127, 127, 127, 255);
      Color.BLACK = freezeColor(0, 0, 0, 255);
      Color.TRANSPARENT = freezeColor(0, 0, 0, 0);
      Color.RED = freezeColor(255, 0, 0, 255);
      Color.GREEN = freezeColor(0, 255, 0, 255);
      Color.BLUE = freezeColor(0, 0, 255, 255);
      Color.CYAN = freezeColor(0, 255, 255, 255);
      Color.MAGENTA = freezeColor(255, 0, 255, 255);
      Color.YELLOW = freezeColor(255, 255, 0, 255);
      CCClass.fastDefine('cc.Color', Color, {
        r: 0,
        g: 0,
        b: 0,
        a: 255
      });
      legacyCC.Color = Color;
      legacyCC.color = color;
      SRGB_8BIT_TO_LINEAR = [];
      for (let i = 0; i < 256; i++) {
        SRGB_8BIT_TO_LINEAR.push(srgbToLinear(i / 255.0));
      }
    }
  };
});