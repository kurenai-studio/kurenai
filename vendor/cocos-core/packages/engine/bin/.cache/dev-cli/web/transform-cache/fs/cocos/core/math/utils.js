System.register("q-bundled:///fs/cocos/core/math/utils.js", ["./bits.js"], function (_export, _context) {
  "use strict";

  var bits, mathAbs, mathFloor, PI, _d2r, _r2d, _random, HALF_PI, TWO_PI, EPSILON, toHalf, fromHalf;
  /**
   * @en Tests whether or not the arguments have approximately the same value, within an absolute<br/>
   * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less<br/>
   * than or equal to 1.0, and a relative tolerance is used for larger values)
   * @zh 在glMatrix的绝对或相对容差范围内，测试参数是否具有近似相同的值。<br/>
   * EPSILON(小于等于1.0的值采用绝对公差，大于1.0的值采用相对公差)
   * @param a The first number to test.
   * @param b The second number to test.
   * @return True if the numbers are approximately equal, false otherwise.
   */
  function equals(a, b) {
    return mathAbs(a - b) <= EPSILON * Math.max(1.0, mathAbs(a), mathAbs(b));
  }

  /**
   * @en Tests whether or not the arguments have approximately the same value by given maxDiff<br/>
   * @zh 通过给定的最大差异，测试参数是否具有近似相同的值。
   * @param a The first number to test.
   * @param b The second number to test.
   * @param maxDiff Maximum difference.
   * @return True if the numbers are approximately equal, false otherwise.
   */
  function approx(a, b, maxDiff) {
    maxDiff = maxDiff || EPSILON;
    return mathAbs(a - b) <= maxDiff;
  }

  /**
   * @en Tests whether or not the first argument is approximately greater than or equal to the second
   * @zh 测试第一个参数是否近似大于或等于第二个参数
   * @param a The first number to test
   * @param b The second number to test
   * @param maxDiff Maximum difference (default: EPSILON)
   * @return True if a is approximately greater than or equal to b, false otherwise
   */
  function approxGE(a, b, maxDiff) {
    maxDiff = maxDiff || EPSILON;
    return a >= b - maxDiff;
  }

  /**
   * @en Tests whether or not the first argument is approximately less than or equal to the second
   * @zh 测试第一个参数是否近似小于或等于第二个参数
   * @param a The first number to test
   * @param b The second number to test
   * @param maxDiff Maximum difference (default: EPSILON)
   * @return True if a is approximately less than or equal to b, false otherwise
   */
  function approxLE(a, b, maxDiff) {
    maxDiff = maxDiff || EPSILON;
    return a <= b + maxDiff;
  }

  /**
   * @en Tests whether or not the first argument is approximately greater than the second
   * @zh 测试第一个参数是否近似大于第二个参数
   * @param a The first number to test
   * @param b The second number to test
   * @param maxDiff Maximum difference (default: EPSILON)
   * @return True if a is approximately greater than b, false otherwise
   */
  function approxGT(a, b, maxDiff) {
    maxDiff = maxDiff || EPSILON;
    return a > b + maxDiff;
  }

  /**
   * @en Tests whether or not the first argument is approximately less than the second
   * @zh 测试第一个参数是否近似小于第二个参数
   * @param a The first number to test
   * @param b The second number to test
   * @param maxDiff Maximum difference (default: EPSILON)
   * @return True if a is approximately less than b, false otherwise
   */
  function approxLT(a, b, maxDiff) {
    maxDiff = maxDiff || EPSILON;
    return a < b - maxDiff;
  }

  /**
   * @en Clamps a value between a minimum float and maximum float value.<br/>
   * @zh 返回最小浮点数和最大浮点数之间的一个数值。可以使用 clamp 函数将不断变化的数值限制在范围内。
   * @param val
   * @param min
   * @param max
   */
  function clamp(val, min, max) {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    return val < min ? min : val > max ? max : val;
  }

  /**
   * @en Clamps a value between 0 and 1.<br/>
   * @zh 将值限制在0和1之间。
   * @param val
   */
  function clamp01(val) {
    return val < 0 ? 0 : val > 1 ? 1 : val;
  }

  /**
   * @en Linear interpolation between two numbers
   * @zh 两个数之间的线性插值。
   * @param from - The starting number.
   * @param to - The ending number.
   * @param ratio - The interpolation coefficient, t should be in the range [0, 1].
   */
  function lerp(from, to, ratio) {
    return from + (to - from) * ratio;
  }

  /**
   * @en Convert Degree To Radian<br/>
   * @zh 把角度换算成弧度。
   * @param {Number} a Angle in Degrees
   */
  function toRadian(a) {
    return a * _d2r;
  }

  /**
   * @en Convert Radian To Degree<br/>
   * @zh 把弧度换算成角度。
   * @param {Number} a Angle in Radian
   */
  function toDegree(a) {
    return a * _r2d;
  }

  /**
   * @method random
   */
  function random() {
    return _random();
  }

  /**
   * @en Set a custom random number generator, default to Math.random
   * @zh 设置自定义随机数生成器，默认为 Math.random
   * @param func custom random number generator
   */
  function setRandGenerator(func) {
    _random = func;
  }

  /**
   * @en Returns a floating-point random number between min (inclusive) and max (exclusive).<br/>
   * @zh 返回最小(包含)和最大(不包含)之间的浮点随机数。
   * @method randomRange
   * @param min
   * @param max
   * @return {Number} The random number.
   */
  function randomRange(min, max) {
    return random() * (max - min) + min;
  }

  /**
   * @en Returns a random integer between min (inclusive) and max (exclusive).<br/>
   * @zh 返回最小(包含)和最大(不包含)之间的随机整数。
   * @param min
   * @param max
   * @return The random integer.
   */
  function randomRangeInt(min, max) {
    return mathFloor(randomRange(min, max));
  }

  /**
   * @en
   * Linear congruence generator using Hull-Dobell Theorem.
   * @zh
   * 使用 Hull-Dobell 算法的线性同余生成器构造伪随机数
   *
   * @param seed The random seed.
   * @return The pseudo random.
   */
  function pseudoRandom(seed) {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280.0;
  }

  /**
   * @en
   * Returns a floating-point pseudo-random number between min (inclusive) and max (exclusive).
   * @zh
   * 返回一个在范围内的浮点伪随机数，注意，不包含边界值
   *
   * @param seed
   * @param min
   * @param max
   * @return The random number.
   */
  function pseudoRandomRange(seed, min, max) {
    return pseudoRandom(seed) * (max - min) + min;
  }

  /**
   * @en Returns a pseudo-random integer between min (inclusive) and max (exclusive).<br/>
   * @zh 返回最小(包含)和最大(不包含)之间的浮点伪随机数。
   * @param seed
   * @param min
   * @param max
   * @return The random integer.
   */
  function pseudoRandomRangeInt(seed, min, max) {
    return mathFloor(pseudoRandomRange(seed, min, max));
  }

  /**
   * @en
   * Returns the next power of two for the value.<br/>
   * @zh
   * 返回下一个最接近的 2 的幂
   *
   * @param val
   * @return The the next power of two.
   */
  function nextPow2(val) {
    return bits.nextPow2(val);
  }

  /**
   * @en Returns float remainder for t / length.<br/>
   * @zh 返回t / length的浮点余数。
   * @param t Time start at 0.
   * @param length Time of one cycle.
   * @return The Time wrapped in the first cycle.
   */
  function repeat(t, length) {
    return t - mathFloor(t / length) * length;
  }

  /**
   * @en
   * Returns time wrapped in ping-pong mode.
   * @zh
   * 返回乒乓模式下的相对时间
   *
   * @param t Time start at 0.
   * @param length Time of one cycle.
   * @return The time wrapped in the first cycle.
   */
  function pingPong(t, length) {
    t = repeat(t, length * 2);
    t = length - mathAbs(t - length);
    return t;
  }

  /**
   * @en Returns ratio of a value within a given range.<br/>
   * @zh 返回给定范围内的值的比率。
   * @param from Start value.
   * @param to End value.
   * @param value Given value.
   * @return The ratio between [from, to].
   */
  function inverseLerp(from, to, value) {
    return (value - from) / (to - from);
  }

  /**
   * @en Compare the absolute values of all components and the component with the largest absolute value will be returned.
   * @zh 对所有分量的绝对值进行比较大小，返回绝对值最大的分量。
   * @param v vec3 like value
   * @returns max absolute component
   */
  function absMaxComponent(v) {
    if (mathAbs(v.x) > mathAbs(v.y)) {
      if (mathAbs(v.x) > mathAbs(v.z)) {
        return v.x;
      } else {
        return v.z;
      }
    } else if (mathAbs(v.y) > mathAbs(v.z)) {
      return v.y;
    } else {
      return v.z;
    }
  }

  /**
   * @en Compare the absolute value of two values and return the value with the largest absolute value
   * @zh 对 a b 的绝对值进行比较大小，返回绝对值最大的值。
   * @param a number
   * @param b number
   */
  function absMax(a, b) {
    if (mathAbs(a) > mathAbs(b)) {
      return a;
    } else {
      return b;
    }
  }

  /**
   * @en
   * Make the attributes of the specified class available to be enumerated
   * @zh
   * 使指定类的特定属性可被枚举
   * @param prototype Inherit the prototype chain of the ValueType class
   * @param attrs List of attributes that need to be enumerated
   */
  function enumerableProps(prototype, attrs) {
    attrs.forEach(key => {
      Object.defineProperty(prototype, key, {
        enumerable: true
      });
    });
  }

  /**
   * convert float to half (short)
   */

  function floatToHalf(val) {
    return toHalf(val);
  }
  function halfToFloat(val) {
    return fromHalf(val);
  }
  _export({
    equals: equals,
    approx: approx,
    approxGE: approxGE,
    approxLE: approxLE,
    approxGT: approxGT,
    approxLT: approxLT,
    clamp: clamp,
    clamp01: clamp01,
    lerp: lerp,
    toRadian: toRadian,
    toDegree: toDegree,
    random: random,
    setRandGenerator: setRandGenerator,
    randomRange: randomRange,
    randomRangeInt: randomRangeInt,
    pseudoRandom: pseudoRandom,
    pseudoRandomRange: pseudoRandomRange,
    pseudoRandomRangeInt: pseudoRandomRangeInt,
    nextPow2: nextPow2,
    repeat: repeat,
    pingPong: pingPong,
    inverseLerp: inverseLerp,
    absMaxComponent: absMaxComponent,
    absMax: absMax,
    enumerableProps: enumerableProps,
    floatToHalf: floatToHalf,
    halfToFloat: halfToFloat
  });
  return {
    setters: [function (_bitsJs) {
      bits = _bitsJs;
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
      // Fix Circular dependency
      mathAbs = Math.abs;
      mathFloor = Math.floor;
      PI = Math.PI;
      _d2r = PI / 180.0;
      _r2d = 180.0 / PI;
      _random = Math.random;
      _export("HALF_PI", HALF_PI = PI * 0.5);
      _export("TWO_PI", TWO_PI = PI * 2.0);
      _export("EPSILON", EPSILON = 0.000001);
      toHalf = function toHalf() {
        // https://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
        const floatView = new Float32Array(1);
        const int32View = new Int32Array(floatView.buffer);
        return function toHalf(fval) {
          floatView[0] = fval;
          const fbits = int32View[0];
          const s = fbits >> 16 & 0x8000; // sign
          const em = fbits & 0x7fffffff; // exp and mantissa

          let h = em - (112 << 23) + (1 << 12) >> 13;
          h = em < 113 << 23 ? 0 : h; // denormals-as-zero

          h = em >= 143 << 23 ? 0x7c00 : h; // overflow

          h = em > 255 << 23 ? 0x7e00 : h; // NaN

          int32View[0] = s | h; // pack sign and half

          return int32View[0];
        };
      }();
      fromHalf = function fromHalf() {
        const floatView = new Float32Array(1);
        const int32View = new Int32Array(floatView.buffer);
        return function fromHalf(hval) {
          const s = hval >> 15 & 0x00000001; // sign
          const em = hval & 0x00007fff; // exp and mantissa

          let h = em << 13; // exponent/mantissa bits
          let fbits = 0;
          if (h !== 0x7c00) {
            // // NaN/Inf
            h += 112 << 23; // exp adjust

            if (em === 0) {
              // // Denormals-as-zero
              h = (h & 0xfffff) >> 1; // // Mantissa shift
            } else if (em === 0x7fff) {
              // // Inf/NaN?
              h = 0x7fffffff; // // NaN
            }
          } else {
            h = 0x7f800000; // // +/-Inf
          }
          fbits = s << 31 | h; // // Sign | Exponent | Mantissa
          int32View[0] = fbits;
          return floatView[0];
        };
      }();
    }
  };
});