System.register("q-bundled:///fs/cocos/core/geometry/spec.js", [], function (_export, _context) {
  "use strict";

  var ERaycastMode;
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
       * @en
       * The raycast mode.
       * @zh
       * 射线检测模式。
       */
      _export("ERaycastMode", ERaycastMode = /*#__PURE__*/function (ERaycastMode) {
        /**
         * @en
         * Detects and records all data.
         * @zh
         * 检测并记录所有的数据。
         */
        ERaycastMode[ERaycastMode["ALL"] = 0] = "ALL";
        /**
         * @en
         * Detects all data, but records only the most recent data.
         * @zh
         * 检测所有，但只记录最近的数据。
         */
        ERaycastMode[ERaycastMode["CLOSEST"] = 1] = "CLOSEST";
        /**
         * @en
         * Once the test is successful, the test is stopped and the data is recorded only once.
         * @zh
         * 一旦检测成功就停止检测，只会记录一次数据。
         */
        ERaycastMode[ERaycastMode["ANY"] = 2] = "ANY";
        return ERaycastMode;
      }({}));
      /**
       * @en
       * The storage structure of the raycast results.
       * @zh
       * 射线检测结果的存储结构。
       */
      /**
       * @en
       * The optional param structure of the `raySubMesh`.
       * @zh
       * `raySubMesh`的可选参数结构。
       */
      /**
       * @en
       * The optional param structure of the `rayMesh`.
       * @zh
       * `rayMesh`的可选参数结构。
       */
      /**
       * @en
       * The optional parameter structure of the `rayModel`.
       * @zh
       * `rayModel`的可选参数结构。
       */
    }
  };
});