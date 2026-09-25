System.register("q-bundled:///fs/exports/legacy-pipeline.js", ["../cocos/core/global-exports.js", "../cocos/rendering/legacy/index.js"], function (_export, _context) {
  "use strict";

  var legacyCC, legacy_rendering;
  return {
    setters: [function (_cocosCoreGlobalExportsJs) {
      legacyCC = _cocosCoreGlobalExportsJs.legacyCC;
    }, function (_cocosRenderingLegacyIndexJs) {
      legacy_rendering = _cocosRenderingLegacyIndexJs;
      var _exportObj = {};
      for (var _key in _cocosRenderingLegacyIndexJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _cocosRenderingLegacyIndexJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
      
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

      legacyCC.legacy_rendering = legacy_rendering;
    }
  };
});