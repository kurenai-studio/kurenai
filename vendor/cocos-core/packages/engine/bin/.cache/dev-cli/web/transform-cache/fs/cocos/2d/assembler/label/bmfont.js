System.register("q-bundled:///fs/cocos/2d/assembler/label/bmfont.js", ["../../../core/index.js", "../utils.js", "./bmfontUtils.js"], function (_export, _context) {
  "use strict";

  var Color, fillMeshVertices3D, BmfontUtils, Bmfont, tempColor, bmfont;
  return {
    setters: [function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
    }, function (_utilsJs) {
      fillMeshVertices3D = _utilsJs.fillMeshVertices3D;
    }, function (_bmfontUtilsJs) {
      BmfontUtils = _bmfontUtilsJs.BmfontUtils;
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
      tempColor = new Color(255, 255, 255, 255);
      /**
       * bmfont 组装器
       * 可通过 `UI.bmfont` 获取该组装器。
       */
      Bmfont = class Bmfont extends BmfontUtils {
        createData(comp) {
          const renderData = comp.requestRenderData();
          renderData.resize(0, 0);
          return renderData;
        }
        fillBuffers(comp, renderer) {
          const node = comp.node;
          tempColor.set(comp.color);
          tempColor.a = node._uiProps.opacity * 255;
          // Fill All
          fillMeshVertices3D(node, renderer, comp.renderData, tempColor);
        }
      };
      _export("bmfont", bmfont = new Bmfont());
    }
  };
});