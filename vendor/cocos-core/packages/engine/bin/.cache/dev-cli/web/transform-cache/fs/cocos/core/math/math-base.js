System.register("q-bundled:///fs/cocos/core/math/math-base.js", ["../../../../virtual/internal%253Aconstants.js", "../value-types/value-type.js"], function (_export, _context) {
  "use strict";

  var JSB, ValueType, MathBase, MATH_FLOAT_ARRAY;
  _export("MathBase", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_valueTypesValueTypeJs) {
      ValueType = _valueTypesValueTypeJs.ValueType;
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
      _export("MATH_FLOAT_ARRAY", MATH_FLOAT_ARRAY = JSB ? Float32Array : Float64Array);
      _export("MathBase", MathBase = class MathBase extends ValueType {
        static createFloatArray(size) {
          return new MATH_FLOAT_ARRAY(size);
        }

        /**
         * @en Get the internal array data.
         * @zh 获取内部 array 数据。
         */
        get array() {
          return this._array;
        }
      });
    }
  };
});