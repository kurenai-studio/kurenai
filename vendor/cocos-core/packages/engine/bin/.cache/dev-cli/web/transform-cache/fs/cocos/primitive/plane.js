System.register("q-bundled:///fs/cocos/primitive/plane.js", ["../core/index.js", "./define.js"], function (_export, _context) {
  "use strict";

  var Vec3, applyDefaultGeometryOptions, temp1, temp2, temp3, r, c00, c10, c01;
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
   * The definition of the parameter for building a plane.
   * @zh
   * 平面参数选项。
   */

  /**
   * @zh
   * 应用默认的平面参数选项。
   * @param options 平面参数选项。
   */
  function applyDefaultPlaneOptions(options) {
    options = applyDefaultGeometryOptions(options);
    options.width = options.width || 10;
    options.length = options.length || 10;
    options.widthSegments = options.widthSegments || 10;
    options.lengthSegments = options.lengthSegments || 10;
    return options;
  }
  function plane(options) {
    const normalizedOptions = applyDefaultPlaneOptions(options);
    const {
      width,
      length,
      widthSegments: uSegments,
      lengthSegments: vSegments
    } = normalizedOptions;
    const hw = width * 0.5;
    const hl = length * 0.5;
    const positions = [];
    const uvs = [];
    const indices = [];
    const minPos = new Vec3(-hw, 0, -hl);
    const maxPos = new Vec3(hw, 0, hl);
    const boundingRadius = Math.sqrt(width * width + length * length);
    Vec3.set(c00, -hw, 0, hl);
    Vec3.set(c10, hw, 0, hl);
    Vec3.set(c01, -hw, 0, -hl);
    for (let y = 0; y <= vSegments; y++) {
      for (let x = 0; x <= uSegments; x++) {
        const u = x / uSegments;
        const v = y / vSegments;
        Vec3.lerp(temp1, c00, c10, u);
        Vec3.lerp(temp2, c00, c01, v);
        Vec3.subtract(temp3, temp2, c00);
        Vec3.add(r, temp1, temp3);
        positions.push(r.x, r.y, r.z);
        if (normalizedOptions.includeUV) {
          uvs.push(u, v);
        }
        if (x < uSegments && y < vSegments) {
          const useg1 = uSegments + 1;
          const a = x + y * useg1;
          const b = x + (y + 1) * useg1;
          const c = x + 1 + (y + 1) * useg1;
          const d = x + 1 + y * useg1;
          indices.push(a, d, b);
          indices.push(d, c, b);
        }
      }
    }
    const result = {
      positions,
      indices,
      minPos,
      maxPos,
      boundingRadius
    };
    if (normalizedOptions.includeNormal) {
      const nVertex = (vSegments + 1) * (uSegments + 1);
      const normals = new Array(3 * nVertex);
      result.normals = normals;
      for (let i = 0; i < nVertex; ++i) {
        normals[i * 3 + 0] = 0;
        normals[i * 3 + 1] = 1;
        normals[i * 3 + 2] = 0;
      }
    }
    if (normalizedOptions.includeUV) {
      result.uvs = uvs;
    }
    return result;
  }
  _export("default", plane);
  return {
    setters: [function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_defineJs) {
      applyDefaultGeometryOptions = _defineJs.applyDefaultGeometryOptions;
    }],
    execute: function () {
      temp1 = new Vec3(0, 0, 0);
      temp2 = new Vec3(0, 0, 0);
      temp3 = new Vec3(0, 0, 0);
      r = new Vec3(0, 0, 0);
      c00 = new Vec3(0, 0, 0);
      c10 = new Vec3(0, 0, 0);
      c01 = new Vec3(0, 0, 0);
      /**
       * @en
       * This function generates a plane on XOZ plane with positive Y direction.
       * @zh
       * 生成一个平面，其位于XOZ平面，方向为Y轴正方向。
       * @param options @zh 平面参数选项。@en The optional creation parameters of the plane
       */
    }
  };
});