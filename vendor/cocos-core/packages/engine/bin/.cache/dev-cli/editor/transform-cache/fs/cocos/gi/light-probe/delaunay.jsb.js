System.register("q-bundled:///fs/cocos/gi/light-probe/delaunay.jsb.js", ["../../core/index.js", "../../native-binding/decorators.js"], function (_export, _context) {
  "use strict";

  var Mat3, Vec3, patch_cc_CircumSphere, patch_cc_Tetrahedron, patch_cc_Vertex, Vertex, CircumSphere, Tetrahedron;
  return {
    setters: [function (_coreIndexJs) {
      Mat3 = _coreIndexJs.Mat3;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_nativeBindingDecoratorsJs) {
      patch_cc_CircumSphere = _nativeBindingDecoratorsJs.patch_cc_CircumSphere;
      patch_cc_Tetrahedron = _nativeBindingDecoratorsJs.patch_cc_Tetrahedron;
      patch_cc_Vertex = _nativeBindingDecoratorsJs.patch_cc_Vertex;
    }],
    execute: function () {
      /*
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("Vertex", Vertex = jsb.Vertex);
      patch_cc_Vertex({
        Vertex,
        Vec3
      });
      _export("CircumSphere", CircumSphere = jsb.CircumSphere);
      patch_cc_CircumSphere({
        CircumSphere,
        Vec3
      });
      _export("Tetrahedron", Tetrahedron = jsb.Tetrahedron);
      patch_cc_Tetrahedron({
        Tetrahedron,
        Mat3,
        Vec3,
        CircumSphere
      });
    }
  };
});