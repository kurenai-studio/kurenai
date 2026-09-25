System.register("q-bundled:///fs/cocos/core/data/class-stash.js", [], function (_export, _context) {
  "use strict";

  var PropertyStashInternalFlag;
  return {
    setters: [],
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
      /**
       * Class slash stores information collected from decorators.
       * Once the class decorator entered, the class definition begins. It processes the stash and removes it.
       */
      _export("PropertyStashInternalFlag", PropertyStashInternalFlag = /*#__PURE__*/function (PropertyStashInternalFlag) {
        /**
         * Indicates this property is reflected using "standalone property decorators" such as
         * `@editable`, `@visible`, `serializable`.
         * All standalone property decorators would set this flag;
         * non-standalone property decorators won't set this flag.
         */
        PropertyStashInternalFlag[PropertyStashInternalFlag["STANDALONE"] = 1] = "STANDALONE";
        /**
         * Indicates this property is visible, if no other explicit visibility decorators(`@visible`s) are attached.
         */
        PropertyStashInternalFlag[PropertyStashInternalFlag["IMPLICIT_VISIBLE"] = 2] = "IMPLICIT_VISIBLE";
        /**
         * Indicates this property is serializable, if no other explicit visibility decorators(`@serializable`s) are attached.
         */
        PropertyStashInternalFlag[PropertyStashInternalFlag["IMPLICIT_SERIALIZABLE"] = 4] = "IMPLICIT_SERIALIZABLE";
        return PropertyStashInternalFlag;
      }({}));
    }
  };
});