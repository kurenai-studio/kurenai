System.register("q-bundled:///fs/cocos/rendering/custom/types-names.js", ["./types.js"], function (_export, _context) {
  "use strict";

  var UpdateFrequency;
  /*
   Copyright (c) 2021-2024 Xiamen Yaji Software Co., Ltd.
  
   https://www.cocos.com
  
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
   * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
   * The following section is auto-generated.
   * ========================= !DO NOT CHANGE THE FOLLOWING SECTION MANUALLY! =========================
   */

  function getUpdateFrequencyName(e) {
    switch (e) {
      case UpdateFrequency.PER_INSTANCE:
        return 'PER_INSTANCE';
      case UpdateFrequency.PER_BATCH:
        return 'PER_BATCH';
      case UpdateFrequency.PER_PHASE:
        return 'PER_PHASE';
      case UpdateFrequency.PER_PASS:
        return 'PER_PASS';
      case UpdateFrequency.COUNT:
        return 'COUNT';
      default:
        return '';
    }
  }
  _export("getUpdateFrequencyName", getUpdateFrequencyName);
  return {
    setters: [function (_typesJs) {
      UpdateFrequency = _typesJs.UpdateFrequency;
    }],
    execute: function () {}
  };
});