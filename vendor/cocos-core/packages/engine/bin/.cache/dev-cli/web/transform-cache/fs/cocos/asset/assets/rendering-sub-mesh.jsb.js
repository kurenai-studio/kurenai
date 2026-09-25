System.register("q-bundled:///fs/cocos/asset/assets/rendering-sub-mesh.jsb.js", [], function (_export, _context) {
  "use strict";

  var RenderingSubMesh, renderingSubMeshProto;
  return {
    setters: [],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
       * @en Array views for index buffer
       * @zh 允许存储索引的数组视图。
       */
      /**
       * @en The interface of geometric information
       * @zh 几何信息。
       */
      /**
       * @en Flat vertex buffer
       * @zh 扁平化顶点缓冲区
       */
      _export("RenderingSubMesh", RenderingSubMesh = jsb.RenderingSubMesh); // TODO: we mark renderingSubMeshProto as type of any, because here we have many dynamic injected property @dumganhar
      renderingSubMeshProto = RenderingSubMesh.prototype;
      renderingSubMeshProto._ctor = function (vertexBuffers, attributes, primitiveMode, indexBuffer = null, indirectBuffer = null) {
        jsb.Asset.prototype._ctor.apply(this, arguments);
        this._attributes = attributes;
        this._vertexBuffers = vertexBuffers;
        this._indexBuffer = indexBuffer;
        this._indirectBuffer = indirectBuffer;
      };
      Object.defineProperty(renderingSubMeshProto, 'geometricInfo', {
        configurable: true,
        enumerable: true,
        get() {
          let r = this.getGeometricInfo();
          if (!r.positions && !r.indices) {
            r.positions = new Float32Array();
            r.indices = new Uint8Array();
          }
          return r;
        }
      });
      Object.defineProperty(renderingSubMeshProto, 'attributes', {
        configurable: true,
        enumerable: true,
        get() {
          // TODO: should remove it when using shared_ptr.
          if (!this._attributes) {
            this._attributes = this.getAttributes();
          }
          return this._attributes;
        }
      });
      Object.defineProperty(renderingSubMeshProto, 'vertexBuffers', {
        configurable: true,
        enumerable: true,
        get() {
          // TODO: should remove it when using shared_ptr.
          if (!this._vertexBuffers) {
            this._vertexBuffers = this.getVertexBuffers();
          }
          return this._vertexBuffers;
        }
      });
      Object.defineProperty(renderingSubMeshProto, 'indexBuffer', {
        configurable: true,
        enumerable: true,
        get() {
          // TODO: should remove it when using shared_ptr.
          if (!this._indexBuffer) {
            this._indexBuffer = this.getIndexBuffer();
          }
          return this._indexBuffer;
        }
      });
      Object.defineProperty(renderingSubMeshProto, 'indirectBuffer', {
        configurable: true,
        enumerable: true,
        get() {
          // TODO: should remove it when using shared_ptr.
          if (!this._indirectBuffer) {
            this._indirectBuffer = this.getIndexBuffer();
          }
          return this._indirectBuffer;
        }
      });
    }
  };
});