System.register("q-bundled:///fs/cocos/core/algorithm/index.js", ["../global-exports.js", "./easing.js", "./murmurhash2_gc.js"], function (_export, _context) {
  "use strict";

  var legacyCC, easing;
  return {
    setters: [function (_globalExportsJs) {
      legacyCC = _globalExportsJs.legacyCC;
    }, function (_easingJs) {
      easing = _easingJs;
    }, function (_murmurhash2_gcJs) {
      var _exportObj = {};
      for (var _key in _murmurhash2_gcJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _murmurhash2_gcJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("easing", easing);
      legacyCC.easing = easing;
    }
  };
});