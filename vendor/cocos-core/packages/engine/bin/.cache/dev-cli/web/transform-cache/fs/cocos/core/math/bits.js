System.register("q-bundled:///fs/cocos/core/math/bits.js", [], function (_export, _context) {
  "use strict";

  var INT_BITS, INT_MAX, INT_MIN, REVERSE_TABLE;
  /**
   * @en Returns -1, 0, +1 depending on sign of x.
   * @zh 根据x的符号返回 -1，0，+1。
   */
  function sign(v) {
    return (v > 0) - (v < 0);
  }

  /**
   * @en Computes absolute value of integer.
   * @zh 计算整数的绝对值。
   */
  function abs(v) {
    const mask = v >> INT_BITS - 1;
    return (v ^ mask) - mask;
  }

  /**
   * @en Computes minimum of integers x and y.
   * @zh 计算整数x和y中的最小值。
   */
  function min(x, y) {
    return y ^ (x ^ y) & -(x < y);
  }

  /**
   * @en Computes maximum of integers x and y.
   * @zh 计算整数x和y中的最大值。
   */
  function max(x, y) {
    return x ^ (x ^ y) & -(x < y);
  }

  /**
   * @en Checks if a number is a power of two.
   * @zh 检查一个数字是否是2的幂。
   */
  function isPow2(v) {
    return !(v & v - 1) && !!v;
  }

  /**
   * @en Computes log base 2 of v.
   * @zh 计算以 2 为底的 v 的对数。
   */
  function log2(v) {
    let r;
    let shift;
    r = (v > 0xFFFF) << 4;
    v >>>= r;
    shift = (v > 0xFF) << 3;
    v >>>= shift;
    r |= shift;
    shift = (v > 0xF) << 2;
    v >>>= shift;
    r |= shift;
    shift = (v > 0x3) << 1;
    v >>>= shift;
    r |= shift;
    return r | v >> 1;
  }

  /**
   * @en Computes log base 10 of v.
   * @zh 计算以 10 为底的 v 的对数。
   */
  function log10(v) {
    return v >= 1000000000 ? 9 : v >= 100000000 ? 8 : v >= 10000000 ? 7 : v >= 1000000 ? 6 : v >= 100000 ? 5 : v >= 10000 ? 4 : v >= 1000 ? 3 : v >= 100 ? 2 : v >= 10 ? 1 : 0;
  }

  /**
   * @en Counts number of bits.
   * @zh 计算传入数字二进制表示中 1 的数量。
   */
  function popCount(v) {
    v -= v >>> 1 & 0x55555555;
    v = (v & 0x33333333) + (v >>> 2 & 0x33333333);
    return (v + (v >>> 4) & 0xF0F0F0F) * 0x1010101 >>> 24;
  }

  /**
   * @en Counts number of trailing zeros.
   * @zh 计算传入数字二进制表示尾随零的数量。
   */
  function countTrailingZeros(v) {
    let c = 32;
    v &= -v;
    if (v) {
      c--;
    }
    if (v & 0x0000FFFF) {
      c -= 16;
    }
    if (v & 0x00FF00FF) {
      c -= 8;
    }
    if (v & 0x0F0F0F0F) {
      c -= 4;
    }
    if (v & 0x33333333) {
      c -= 2;
    }
    if (v & 0x55555555) {
      c -= 1;
    }
    return c;
  }

  /**
   * @en Rounds to next power of 2.
   * @zh 计算大于等于v的最小的二的整数次幂的数字。
   */
  function nextPow2(v) {
    --v;
    v |= v >>> 1;
    v |= v >>> 2;
    v |= v >>> 4;
    v |= v >>> 8;
    v |= v >>> 16;
    return v + 1;
  }

  /**
   * @en Rounds down to previous power of 2.
   * @zh 计算小于等于v的最小的二的整数次幂的数字。
   */
  function prevPow2(v) {
    v |= v >>> 1;
    v |= v >>> 2;
    v |= v >>> 4;
    v |= v >>> 8;
    v |= v >>> 16;
    return v - (v >>> 1);
  }

  /**
   * @en Computes parity of word.
   * @zh 奇偶校验。
   */
  function parity(v) {
    v ^= v >>> 16;
    v ^= v >>> 8;
    v ^= v >>> 4;
    v &= 0xf;
    return 0x6996 >>> v & 1;
  }
  /**
   * @en Reverse bits in a 32 bit word.
   * @zh 翻转 32 位二进制数字。
   */
  function reverse(v) {
    return REVERSE_TABLE[v & 0xff] << 24 | REVERSE_TABLE[v >>> 8 & 0xff] << 16 | REVERSE_TABLE[v >>> 16 & 0xff] << 8 | REVERSE_TABLE[v >>> 24 & 0xff];
  }

  /**
   * @en Interleave bits of 2 coordinates with 16 bits. Useful for fast quadtree codes.
   * @zh 将两个 16 位数字按位交错编码。有利于在快速四叉树中使用。
   */
  function interleave2(x, y) {
    x &= 0xFFFF;
    x = (x | x << 8) & 0x00FF00FF;
    x = (x | x << 4) & 0x0F0F0F0F;
    x = (x | x << 2) & 0x33333333;
    x = (x | x << 1) & 0x55555555;
    y &= 0xFFFF;
    y = (y | y << 8) & 0x00FF00FF;
    y = (y | y << 4) & 0x0F0F0F0F;
    y = (y | y << 2) & 0x33333333;
    y = (y | y << 1) & 0x55555555;
    return x | y << 1;
  }

  /**
   * @en Extracts the nth interleaved component.
   * @zh 提取第 n 个交错分量。
   */
  function deinterleave2(v, n) {
    v = v >>> n & 0x55555555;
    v = (v | v >>> 1) & 0x33333333;
    v = (v | v >>> 2) & 0x0F0F0F0F;
    v = (v | v >>> 4) & 0x00FF00FF;
    v = (v | v >>> 16) & 0x000FFFF;
    return v << 16 >> 16;
  }

  /**
   * @en Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes.
   * @zh 将三个数字按位交错编码，每个数字占十位。有利于在八叉树中使用。
   */
  function interleave3(x, y, z) {
    x &= 0x3FF;
    x = (x | x << 16) & 4278190335;
    x = (x | x << 8) & 251719695;
    x = (x | x << 4) & 3272356035;
    x = (x | x << 2) & 1227133513;
    y &= 0x3FF;
    y = (y | y << 16) & 4278190335;
    y = (y | y << 8) & 251719695;
    y = (y | y << 4) & 3272356035;
    y = (y | y << 2) & 1227133513;
    x |= y << 1;
    z &= 0x3FF;
    z = (z | z << 16) & 4278190335;
    z = (z | z << 8) & 251719695;
    z = (z | z << 4) & 3272356035;
    z = (z | z << 2) & 1227133513;
    return x | z << 2;
  }

  /**
   * @en Extracts nth interleaved component of a 3-tuple.
   * @zh 提取三个数字中的第n个交错分量。
   */
  function deinterleave3(v, n) {
    v = v >>> n & 1227133513;
    v = (v | v >>> 2) & 3272356035;
    v = (v | v >>> 4) & 251719695;
    v = (v | v >>> 8) & 4278190335;
    v = (v | v >>> 16) & 0x3FF;
    return v << 22 >> 22;
  }

  /**
   * @en Compute the lexicographically next bit permutation
   * @zh 计算下一组字典序的比特排列
   */
  function nextCombination(v) {
    const t = v | v - 1;
    return t + 1 | (~t & -~t) - 1 >>> countTrailingZeros(v) + 1;
  }
  _export({
    sign: sign,
    abs: abs,
    min: min,
    max: max,
    isPow2: isPow2,
    log2: log2,
    log10: log10,
    popCount: popCount,
    countTrailingZeros: countTrailingZeros,
    nextPow2: nextPow2,
    prevPow2: prevPow2,
    parity: parity,
    reverse: reverse,
    interleave2: interleave2,
    deinterleave2: deinterleave2,
    interleave3: interleave3,
    deinterleave3: deinterleave3,
    nextCombination: nextCombination
  });
  return {
    setters: [],
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
      /**
       * Bit twiddling hacks for JavaScript.
       *
       * Author: Mikola Lysenko
       *
       * Ported from Stanford bit twiddling hack library:
       *    http://graphics.stanford.edu/~seander/bithacks.html
       */
      /**
       * @en
       * Number of bits in an integer
       * @zh
       * 整型类型的 bit 数
       */
      _export("INT_BITS", INT_BITS = 32);
      /**
       * @en
       * The maximal signed integer number
       * @zh
       * 最大有符号整型数
       */
      _export("INT_MAX", INT_MAX = 0x7fffffff);
      /**
       * @en
       * The minimal signed integer number
       * @zh
       * 最小有符号整型数
       */
      _export("INT_MIN", INT_MIN = -1 << INT_BITS - 1);
      REVERSE_TABLE = new Array(256);
      (tab => {
        for (let i = 0; i < 256; ++i) {
          let v = i;
          let r = i;
          let s = 7;
          for (v >>>= 1; v; v >>>= 1) {
            r <<= 1;
            r |= v & 1;
            --s;
          }
          tab[i] = r << s & 0xff;
        }
      })(REVERSE_TABLE);
    }
  };
});