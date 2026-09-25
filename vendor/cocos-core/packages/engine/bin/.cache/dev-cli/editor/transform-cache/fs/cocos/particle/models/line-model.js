System.register("q-bundled:///fs/cocos/particle/models/line-model.js", ["../../../../virtual/internal%253Aconstants.js", "../../asset/assets/rendering-sub-mesh.js", "../../gfx/index.js", "../../core/index.js", "../../render-scene/index.js"], function (_export, _context) {
  "use strict";

  var JSB, RenderingSubMesh, Attribute, BufferInfo, AttributeName, BufferUsageBit, Format, FormatInfos, MemoryUsageBit, PrimitiveMode, Color, Vec3, scene, LineModel, _vertex_attrs, _temp_v1, _temp_v2;
  _export("LineModel", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_assetAssetsRenderingSubMeshJs) {
      RenderingSubMesh = _assetAssetsRenderingSubMeshJs.RenderingSubMesh;
    }, function (_gfxIndexJs) {
      Attribute = _gfxIndexJs.Attribute;
      BufferInfo = _gfxIndexJs.BufferInfo;
      AttributeName = _gfxIndexJs.AttributeName;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      Format = _gfxIndexJs.Format;
      FormatInfos = _gfxIndexJs.FormatInfos;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      PrimitiveMode = _gfxIndexJs.PrimitiveMode;
    }, function (_coreIndexJs) {
      Color = _coreIndexJs.Color;
      Vec3 = _coreIndexJs.Vec3;
    }, function (_renderSceneIndexJs) {
      scene = _renderSceneIndexJs.scene;
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
      _vertex_attrs = [new Attribute(AttributeName.ATTR_POSITION, Format.RGB32F),
      // xyz:position
      new Attribute(AttributeName.ATTR_TEX_COORD, Format.RGBA32F),
      // x:index y:size zw:texcoord
      new Attribute(AttributeName.ATTR_TEX_COORD1, Format.RGB32F),
      // xyz:velocity
      new Attribute(AttributeName.ATTR_COLOR, Format.RGBA8, true)];
      _temp_v1 = new Vec3();
      _temp_v2 = new Vec3();
      _export("LineModel", LineModel = class LineModel extends scene.Model {
        constructor() {
          super();
          this._capacity = void 0;
          this._vertSize = 0;
          this._vBuffer = null;
          this._vertAttrsFloatCount = 0;
          this._vdataF32 = null;
          this._vdataUint32 = null;
          this._subMeshData = null;
          this._vertCount = 0;
          this._indexCount = 0;
          this._material = null;
          this._iaVertCount = 0;
          this._iaIndexCount = 0;
          if (JSB) {
            this._registerListeners();
          }
          this.type = scene.ModelType.LINE;
          this._capacity = 100;
        }
        setCapacity(capacity) {
          this._capacity = capacity;
          this.createBuffer();
        }
        createBuffer() {
          this._vertSize = 0;
          for (const a of _vertex_attrs) {
            a.offset = this._vertSize;
            this._vertSize += FormatInfos[a.format].size;
          }
          this._vertAttrsFloatCount = this._vertSize / 4; // number of float
          this._vBuffer = this.createSubMeshData();
          this._vdataF32 = new Float32Array(this._vBuffer);
          this._vdataUint32 = new Uint32Array(this._vBuffer);
        }
        updateMaterial(mat) {
          this._material = mat;
          super.setSubModelMaterial(0, mat);
        }
        createSubMeshData() {
          if (this._subMeshData) {
            this.destroySubMeshData();
          }
          this._vertCount = 2;
          this._indexCount = 6;
          const vertexBuffer = this._device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, this._vertSize * this._capacity * this._vertCount, this._vertSize));
          const vBuffer = new ArrayBuffer(this._vertSize * this._capacity * this._vertCount);
          vertexBuffer.update(vBuffer);
          const indices = new Uint16Array((this._capacity - 1) * this._indexCount);
          let dst = 0;
          for (let i = 0; i < this._capacity - 1; ++i) {
            const baseIdx = 2 * i;
            indices[dst++] = baseIdx;
            indices[dst++] = baseIdx + 1;
            indices[dst++] = baseIdx + 2;
            indices[dst++] = baseIdx + 3;
            indices[dst++] = baseIdx + 2;
            indices[dst++] = baseIdx + 1;
          }
          const indexBuffer = this._device.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, (this._capacity - 1) * this._indexCount * Uint16Array.BYTES_PER_ELEMENT, Uint16Array.BYTES_PER_ELEMENT));
          indexBuffer.update(indices);
          this._iaVertCount = this._capacity * this._vertCount;
          this._iaIndexCount = (this._capacity - 1) * this._indexCount;
          this._subMeshData = new RenderingSubMesh([vertexBuffer], _vertex_attrs, PrimitiveMode.TRIANGLE_LIST, indexBuffer);
          this.initSubModel(0, this._subMeshData, this._material);
          return vBuffer;
        }
        addLineVertexData(positions, width, color) {
          if (positions.length > 1) {
            let offset = 0;
            Vec3.subtract(_temp_v1, positions[1], positions[0]);
            this._vdataF32[offset++] = positions[0].x;
            this._vdataF32[offset++] = positions[0].y;
            this._vdataF32[offset++] = positions[0].z;
            this._vdataF32[offset++] = 0;
            this._vdataF32[offset++] = width.evaluate(0, 1);
            this._vdataF32[offset++] = 0;
            this._vdataF32[offset++] = 0;
            this._vdataF32[offset++] = _temp_v1.x;
            this._vdataF32[offset++] = _temp_v1.y;
            this._vdataF32[offset++] = _temp_v1.z;
            this._vdataUint32[offset++] = Color.toUint32(color.evaluate(0, 1));
            this._vdataF32[offset++] = positions[0].x;
            this._vdataF32[offset++] = positions[0].y;
            this._vdataF32[offset++] = positions[0].z;
            this._vdataF32[offset++] = 1;
            this._vdataF32[offset++] = width.evaluate(0, 1);
            this._vdataF32[offset++] = 0;
            this._vdataF32[offset++] = 1;
            this._vdataF32[offset++] = _temp_v1.x;
            this._vdataF32[offset++] = _temp_v1.y;
            this._vdataF32[offset++] = _temp_v1.z;
            this._vdataUint32[offset++] = Color.toUint32(color.evaluate(0, 1));
            for (let i = 1; i < positions.length - 1; i++) {
              Vec3.subtract(_temp_v1, positions[i - 1], positions[i]);
              Vec3.subtract(_temp_v2, positions[i + 1], positions[i]);
              Vec3.subtract(_temp_v2, _temp_v2, _temp_v1);
              const seg = i / positions.length;
              this._vdataF32[offset++] = positions[i].x;
              this._vdataF32[offset++] = positions[i].y;
              this._vdataF32[offset++] = positions[i].z;
              this._vdataF32[offset++] = 0;
              this._vdataF32[offset++] = width.evaluate(seg, 1);
              this._vdataF32[offset++] = seg;
              this._vdataF32[offset++] = 0;
              this._vdataF32[offset++] = _temp_v2.x;
              this._vdataF32[offset++] = _temp_v2.y;
              this._vdataF32[offset++] = _temp_v2.z;
              this._vdataUint32[offset++] = Color.toUint32(color.evaluate(seg, 1));
              this._vdataF32[offset++] = positions[i].x;
              this._vdataF32[offset++] = positions[i].y;
              this._vdataF32[offset++] = positions[i].z;
              this._vdataF32[offset++] = 1;
              this._vdataF32[offset++] = width.evaluate(seg, 1);
              this._vdataF32[offset++] = seg;
              this._vdataF32[offset++] = 1;
              this._vdataF32[offset++] = _temp_v2.x;
              this._vdataF32[offset++] = _temp_v2.y;
              this._vdataF32[offset++] = _temp_v2.z;
              this._vdataUint32[offset++] = Color.toUint32(color.evaluate(seg, 1));
            }
            Vec3.subtract(_temp_v1, positions[positions.length - 1], positions[positions.length - 2]);
            this._vdataF32[offset++] = positions[positions.length - 1].x;
            this._vdataF32[offset++] = positions[positions.length - 1].y;
            this._vdataF32[offset++] = positions[positions.length - 1].z;
            this._vdataF32[offset++] = 0;
            this._vdataF32[offset++] = width.evaluate(1, 1);
            this._vdataF32[offset++] = 1;
            this._vdataF32[offset++] = 0;
            this._vdataF32[offset++] = _temp_v1.x;
            this._vdataF32[offset++] = _temp_v1.y;
            this._vdataF32[offset++] = _temp_v1.z;
            this._vdataUint32[offset++] = Color.toUint32(color.evaluate(1, 1));
            this._vdataF32[offset++] = positions[positions.length - 1].x;
            this._vdataF32[offset++] = positions[positions.length - 1].y;
            this._vdataF32[offset++] = positions[positions.length - 1].z;
            this._vdataF32[offset++] = 1;
            this._vdataF32[offset++] = width.evaluate(1, 1);
            this._vdataF32[offset++] = 1;
            this._vdataF32[offset++] = 1;
            this._vdataF32[offset++] = _temp_v1.x;
            this._vdataF32[offset++] = _temp_v1.y;
            this._vdataF32[offset++] = _temp_v1.z;
            this._vdataUint32[offset++] = Color.toUint32(color.evaluate(1, 1));
          }
          this.updateIA(Math.max(0, positions.length - 1));
        }
        updateIA(count) {
          const ia = this._subModels[0].inputAssembler;
          ia.vertexBuffers[0].update(this._vdataF32);
          ia.firstIndex = 0;
          ia.indexCount = this._indexCount * count;
          ia.vertexCount = this._iaVertCount;
        }
        destroySubMeshData() {
          if (this._subMeshData) {
            this._subMeshData.destroy();
            this._subMeshData = null;
          }
        }
      });
    }
  };
});