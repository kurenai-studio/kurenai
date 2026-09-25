System.register("q-bundled:///fs/cocos/3d/misc/read-mesh.js", ["../../gfx/index.js", "./buffer.js"], function (_export, _context) {
  "use strict";

  var AttributeName, Format, FormatInfos, readBuffer, _keyMap;
  function readMesh(mesh, iPrimitive = 0) {
    const out = {
      positions: []
    };
    const dataView = new DataView(mesh.data.buffer, mesh.data.byteOffset, mesh.data.byteLength);
    const struct = mesh.struct;
    const primitive = struct.primitives[iPrimitive];
    primitive.vertexBundelIndices.forEach(idx => {
      const bundle = struct.vertexBundles[idx];
      let offset = bundle.view.offset;
      const {
        length,
        stride
      } = bundle.view;
      bundle.attributes.forEach(attr => {
        const name = _keyMap[attr.name];
        if (name) {
          out[name] = (out[name] || []).concat(readBuffer(dataView, attr.format, offset, length, stride));
        }
        offset += FormatInfos[attr.format].size;
      });
    });
    const view = primitive.indexView;
    out.indices = readBuffer(dataView, Format[`R${view.stride * 8}UI`], view.offset, view.length);
    return out;
  }
  _export("readMesh", readMesh);
  return {
    setters: [function (_gfxIndexJs) {
      AttributeName = _gfxIndexJs.AttributeName;
      Format = _gfxIndexJs.Format;
      FormatInfos = _gfxIndexJs.FormatInfos;
    }, function (_bufferJs) {
      readBuffer = _bufferJs.readBuffer;
    }],
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
      _keyMap = function (_keyMap) {
        _keyMap[_keyMap["positions"] = AttributeName.ATTR_POSITION] = "positions";
        _keyMap[_keyMap["normals"] = AttributeName.ATTR_NORMAL] = "normals";
        _keyMap[_keyMap["uvs"] = AttributeName.ATTR_TEX_COORD] = "uvs";
        _keyMap[_keyMap["colors"] = AttributeName.ATTR_COLOR] = "colors";
        return _keyMap;
      }(_keyMap || {});
    }
  };
});