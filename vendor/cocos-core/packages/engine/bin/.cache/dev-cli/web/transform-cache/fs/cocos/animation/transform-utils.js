System.register("q-bundled:///fs/cocos/animation/transform-utils.js", ["../core/index.js"], function (_export, _context) {
  "use strict";

  var Mat4, m4_1;
  /**
   * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
   */
  function getPathFromRoot(target, root) {
    let node = target;
    let path = '';
    while (node !== null && node !== root) {
      path = `${node.name}/${path}`;
      node = node.parent;
    }
    return path.slice(0, -1);
  }

  /**
   * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
   */
  function getWorldTransformUntilRoot(target, root, outMatrix) {
    Mat4.identity(outMatrix);
    while (target !== root) {
      Mat4.fromRTS(m4_1, target.rotation, target.position, target.scale);
      Mat4.multiply(outMatrix, m4_1, outMatrix);
      target = target.parent;
    }
    return outMatrix;
  }
  _export({
    getPathFromRoot: getPathFromRoot,
    getWorldTransformUntilRoot: getWorldTransformUntilRoot
  });
  return {
    setters: [function (_coreIndexJs) {
      Mat4 = _coreIndexJs.Mat4;
    }],
    execute: function () {
      /*
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
      m4_1 = new Mat4();
    }
  };
});