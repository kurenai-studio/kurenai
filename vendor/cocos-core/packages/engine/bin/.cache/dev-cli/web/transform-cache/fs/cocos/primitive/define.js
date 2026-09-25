System.register("q-bundled:///fs/cocos/primitive/define.js", [], function (_export, _context) {
  "use strict";

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
   * The definition of the parameter for building a primitive geometry.
   * @zh
   * 几何体参数选项。
   */

  /**
   * @en
   * Apply the options to default.
   * @zh
   * 应用默认的几何参数选项。
   */
  function applyDefaultGeometryOptions(options) {
    options = options || {};
    if (options.includeNormal === undefined) {
      options.includeNormal = true;
    }
    if (options.includeUV === undefined) {
      options.includeUV = true;
    }
    return options;
  }

  /**
   * @en
   * The definition of the geometry, this struct can build a mesh.
   * @zh
   * 几何体信息。
   */

  /**
   * @en
   * The definition of the dynamic geometry, this struct can build a dynamic mesh.
   * @zh
   * 几何体信息。
   */
  _export("applyDefaultGeometryOptions", applyDefaultGeometryOptions);
  return {
    setters: [],
    execute: function () {}
  };
});