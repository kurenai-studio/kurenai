System.register("q-bundled:///fs/cocos/core/geometry/enums.js", [], function (_export, _context) {
  "use strict";

  var ShapeType;
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
       * 几何工具模块
       * @module geometry
       */
      /**
       * @en
       * The enum type of basic geometry.
       * @zh
       * 形状的类型值。
       */
      _export("ShapeType", ShapeType = /*#__PURE__*/function (ShapeType) {
        ShapeType[ShapeType["SHAPE_RAY"] = 1] = "SHAPE_RAY";
        ShapeType[ShapeType["SHAPE_LINE"] = 2] = "SHAPE_LINE";
        ShapeType[ShapeType["SHAPE_SPHERE"] = 4] = "SHAPE_SPHERE";
        ShapeType[ShapeType["SHAPE_AABB"] = 8] = "SHAPE_AABB";
        ShapeType[ShapeType["SHAPE_OBB"] = 16] = "SHAPE_OBB";
        ShapeType[ShapeType["SHAPE_PLANE"] = 32] = "SHAPE_PLANE";
        ShapeType[ShapeType["SHAPE_TRIANGLE"] = 64] = "SHAPE_TRIANGLE";
        ShapeType[ShapeType["SHAPE_FRUSTUM"] = 128] = "SHAPE_FRUSTUM";
        ShapeType[ShapeType["SHAPE_FRUSTUM_ACCURATE"] = 256] = "SHAPE_FRUSTUM_ACCURATE";
        ShapeType[ShapeType["SHAPE_CAPSULE"] = 512] = "SHAPE_CAPSULE";
        ShapeType[ShapeType["SHAPE_SPLINE"] = 1024] = "SHAPE_SPLINE";
        return ShapeType;
      }({}));
      _export("default", ShapeType);
    }
  };
});