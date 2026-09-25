System.register("q-bundled:///fs/cocos/gi/light-probe/light-probe.jsb.js", ["../../core/index.js", "../../native-binding/decorators.js", "./delaunay.js"], function (_export, _context) {
  "use strict";

  var _decorator, patch_cc_LightProbesData, Tetrahedron, Vertex, LightProbes, LightProbesData;
  return {
    setters: [function (_coreIndexJs) {
      _decorator = _coreIndexJs._decorator;
    }, function (_nativeBindingDecoratorsJs) {
      patch_cc_LightProbesData = _nativeBindingDecoratorsJs.patch_cc_LightProbesData;
    }, function (_delaunayJs) {
      Tetrahedron = _delaunayJs.Tetrahedron;
      Vertex = _delaunayJs.Vertex;
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
      _export("LightProbes", LightProbes = jsb.LightProbes);
      _decorator.ccclass('cc.LightProbes')(LightProbes);
      // patch_cc_LightProbes({LightProbes}); // not exists
      _export("LightProbesData", LightProbesData = jsb.LightProbesData);
      patch_cc_LightProbesData({
        LightProbesData,
        Vertex,
        Tetrahedron
      });
    }
  };
});