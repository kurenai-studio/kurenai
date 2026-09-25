System.register("q-bundled:///fs/cocos/core/utils/decode-uuid.js", ["../../../../virtual/internal%253Aconstants.js", "./misc.js", "../global-exports.js"], function (_export, _context) {
  "use strict";

  var TEST, BASE64_VALUES, legacyCC, separator, HexChars, _t, UuidTemplate, Indices;
  function decodeUuid(base64) {
    const strs = base64.split(separator);
    const uuid = strs[0];
    if (uuid.length !== 22) {
      return base64;
    }
    UuidTemplate[0] = base64[0];
    UuidTemplate[1] = base64[1];
    for (let i = 2, j = 2; i < 22; i += 2) {
      const lhs = BASE64_VALUES[base64.charCodeAt(i)];
      const rhs = BASE64_VALUES[base64.charCodeAt(i + 1)];
      UuidTemplate[Indices[j++]] = HexChars[lhs >> 2];
      UuidTemplate[Indices[j++]] = HexChars[(lhs & 3) << 2 | rhs >> 4];
      UuidTemplate[Indices[j++]] = HexChars[rhs & 0xF];
    }
    return base64.replace(uuid, UuidTemplate.join(''));
  }
  _export("default", decodeUuid);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_miscJs) {
      BASE64_VALUES = _miscJs.BASE64_VALUES;
    }, function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }],
    execute: function () {
      /*
       Copyright (c) 2013-2016 Chukong Technologies Inc.
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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
      separator = '@';
      HexChars = '0123456789abcdef'.split('');
      _t = ['', '', '', ''];
      UuidTemplate = _t.concat(_t, '-', _t, '-', _t, '-', _t, '-', _t, _t, _t);
      Indices = UuidTemplate.map((x, i) => x === '-' ? NaN : i).filter(Number.isFinite);
      /**
       * @en
       * Decode base64-compressed uuid.
       *
       * @zh
       * 解码用 base64 压缩过的 uuid。
       *
       * @param  base64 @en Base-64 compressed uuid. @zh 用 base-64 压缩过的 uuid。
       * @returns @en Original uuid. @zh 未压缩过的 uuid。
       *
       * @example
       * ```ts
       * const uuid = 'fcmR3XADNLgJ1ByKhqcC5Z';
       * const originalUuid = decodeUuid(uuid); // fc991dd7-0033-4b80-9d41-c8a86a702e59
       * ```
       */
      if (TEST) {
        legacyCC._Test.decodeUuid = decodeUuid;
      }
    }
  };
});