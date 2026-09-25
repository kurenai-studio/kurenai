System.register("q-bundled:///fs/cocos/gfx/base/input-assembler.js", ["../../core/algorithm/murmurhash2_gc.js", "./define.js"], function (_export, _context) {
  "use strict";

  var murmurhash2_32_gc, GFXObject, ObjectType, DrawInfo, InputAssembler;
  _export("InputAssembler", void 0);
  return {
    setters: [function (_coreAlgorithmMurmurhash2_gcJs) {
      murmurhash2_32_gc = _coreAlgorithmMurmurhash2_gcJs.murmurhash2_32_gc;
    }, function (_defineJs) {
      GFXObject = _defineJs.GFXObject;
      ObjectType = _defineJs.ObjectType;
      DrawInfo = _defineJs.DrawInfo;
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
      /**
       * @en GFX input assembler.
       * @zh GFX 输入汇集器。
       */
      _export("InputAssembler", InputAssembler = class InputAssembler extends GFXObject {
        /**
         * @en Get current attributes.
         * @zh 顶点属性数组。
         */
        get attributes() {
          return this._attributes;
        }

        /**
         * @en Get current vertex buffers.
         * @zh 顶点缓冲数组。
         */
        get vertexBuffers() {
          return this._vertexBuffers;
        }

        /**
         * @en Get current index buffer.
         * @zh 索引缓冲。
         */
        get indexBuffer() {
          return this._indexBuffer;
        }

        /**
         * @en Get the indirect buffer, if present.
         * @zh 间接绘制缓冲。
         */
        get indirectBuffer() {
          return this._indirectBuffer;
        }

        /**
         * @en Get hash of current attributes.
         * @zh 获取顶点属性数组的哈希值。
         */
        get attributesHash() {
          return this._attributesHash;
        }

        /**
         * @en Get current vertex count.
         * @zh 顶点数量。
         */
        set vertexCount(count) {
          this._drawInfo.vertexCount = count;
        }
        get vertexCount() {
          return this._drawInfo.vertexCount;
        }

        /**
         * @en Get starting vertex.
         * @zh 起始顶点。
         */
        set firstVertex(first) {
          this._drawInfo.firstVertex = first;
        }
        get firstVertex() {
          return this._drawInfo.firstVertex;
        }

        /**
         * @en Get current index count.
         * @zh 索引数量。
         */
        set indexCount(count) {
          this._drawInfo.indexCount = count;
        }
        get indexCount() {
          return this._drawInfo.indexCount;
        }

        /**
         * @en Get starting index.
         * @zh 起始索引。
         */
        set firstIndex(first) {
          this._drawInfo.firstIndex = first;
        }
        get firstIndex() {
          return this._drawInfo.firstIndex;
        }

        /**
         * @en Get current vertex offset.
         * @zh 顶点偏移量。
         */
        set vertexOffset(offset) {
          this._drawInfo.vertexOffset = offset;
        }
        get vertexOffset() {
          return this._drawInfo.vertexOffset;
        }

        /**
         * @en Get current instance count.
         * @zh 实例数量。
         */
        set instanceCount(count) {
          this._drawInfo.instanceCount = count;
        }
        get instanceCount() {
          return this._drawInfo.instanceCount;
        }

        /**
         * @en Get starting instance.
         * @zh 起始实例。
         */
        set firstInstance(first) {
          this._drawInfo.firstInstance = first;
        }
        get firstInstance() {
          return this._drawInfo.firstInstance;
        }

        /**
         * @en set the draw range
         * @zh 设置渲染范围
         */
        set drawInfo(info) {
          this._drawInfo = info;
        }

        /**
         * @en get the draw range
         * @zh 获取渲染范围
         */
        get drawInfo() {
          return this._drawInfo;
        }

        /** @mangle */

        constructor() {
          super(ObjectType.INPUT_ASSEMBLER);
          this._attributes = [];
          /** @mangle */
          this._attributesHash = 0;
          /** @mangle */
          this._vertexBuffers = [];
          /** @mangle */
          this._indexBuffer = null;
          /** @mangle */
          this._indirectBuffer = null;
          /** @mangle */
          this._drawInfo = new DrawInfo();
        }

        /**
         * @en Get the specified vertex buffer.
         * @zh 获取顶点缓冲。
         * @param stream The stream index of the vertex buffer.
         */
        getVertexBuffer(stream = 0) {
          if (stream < this._vertexBuffers.length) {
            return this._vertexBuffers[stream];
          } else {
            return null;
          }
        }
        computeAttributesHash() {
          let res = 'attrs';
          for (let i = 0; i < this.attributes.length; ++i) {
            const at = this.attributes[i];
            res += `,${at.name},${at.format},${at.isNormalized},${at.stream},${at.isInstanced},${at.location}`;
          }
          return murmurhash2_32_gc(res, 666);
        }
      });
    }
  };
});