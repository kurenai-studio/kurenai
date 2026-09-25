System.register("q-bundled:///fs/cocos/render-scene/utils.js", ["../core/index.js", "../gfx/index.js"], function (_export, _context) {
  "use strict";

  var errorID, Attribute, BufferInfo, InputAssemblerInfo, AttributeName, BufferUsageBit, Format, MemoryUsageBit;
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

  function createIA(device, data) {
    if (!data.positions) {
      errorID(16306);
      return null;
    }
    const verts = [];
    const vcount = data.positions.length / 3;
    for (let i = 0; i < vcount; ++i) {
      verts.push(data.positions[3 * i], data.positions[3 * i + 1], data.positions[3 * i + 2]);
      if (data.normals) {
        verts.push(data.normals[3 * i], data.normals[3 * i + 1], data.normals[3 * i + 2]);
      }
      if (data.uvs) {
        verts.push(data.uvs[2 * i], data.uvs[2 * i + 1]);
      }
      if (data.colors) {
        verts.push(data.colors[3 * i], data.colors[3 * i + 1], data.colors[3 * i + 2]);
      }
    }
    const vfmt = [];
    vfmt.push(new Attribute(AttributeName.ATTR_POSITION, Format.RGB32F));
    if (data.normals) {
      vfmt.push(new Attribute(AttributeName.ATTR_NORMAL, Format.RGB32F));
    }
    if (data.uvs) {
      vfmt.push(new Attribute(AttributeName.ATTR_TEX_COORD, Format.RG32F));
    }
    if (data.colors) {
      vfmt.push(new Attribute(AttributeName.ATTR_COLOR, Format.RGB32F));
    }
    const vb = device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, verts.length * 4, verts.length * 4 / vcount));
    vb.update(new Float32Array(verts));
    let ib = null;
    if (data.indices) {
      ib = device.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, data.indices.length * 2, 2));
      ib.update(new Uint16Array(data.indices));
    }
    return device.createInputAssembler(new InputAssemblerInfo(vfmt, [vb], ib));
  }
  _export("createIA", createIA);
  return {
    setters: [function (_coreIndexJs) {
      errorID = _coreIndexJs.errorID;
    }, function (_gfxIndexJs) {
      Attribute = _gfxIndexJs.Attribute;
      BufferInfo = _gfxIndexJs.BufferInfo;
      InputAssemblerInfo = _gfxIndexJs.InputAssemblerInfo;
      AttributeName = _gfxIndexJs.AttributeName;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      Format = _gfxIndexJs.Format;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
    }],
    execute: function () {}
  };
});