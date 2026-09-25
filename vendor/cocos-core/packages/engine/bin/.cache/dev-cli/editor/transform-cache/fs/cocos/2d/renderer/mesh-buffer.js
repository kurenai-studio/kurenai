System.register("q-bundled:///fs/cocos/2d/renderer/mesh-buffer.js", ["../../../../virtual/internal%253Aconstants.js", "../../gfx/index.js", "./vertex-format.js", "../../core/index.js", "./native-2d.js"], function (_export, _context) {
  "use strict";

  var JSB, BufferUsageBit, MemoryUsageBit, BufferInfo, InputAssemblerInfo, Feature, getAttributeStride, sys, getError, warnID, assertIsTrue, NativeUIMeshBuffer, MeshBuffer, MeshBufferSharedBufferView, IA_POOL_USED_SCALE;
  _export("MeshBuffer", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_gfxIndexJs) {
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      BufferInfo = _gfxIndexJs.BufferInfo;
      InputAssemblerInfo = _gfxIndexJs.InputAssemblerInfo;
      Feature = _gfxIndexJs.Feature;
    }, function (_vertexFormatJs) {
      getAttributeStride = _vertexFormatJs.getAttributeStride;
    }, function (_coreIndexJs) {
      sys = _coreIndexJs.sys;
      getError = _coreIndexJs.getError;
      warnID = _coreIndexJs.warnID;
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }, function (_native2dJs) {
      NativeUIMeshBuffer = _native2dJs.NativeUIMeshBuffer;
    }],
    execute: function () {
      /*
       Copyright (c) 2019-2023 Xiamen Yaji Software Co., Ltd.
      
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
      MeshBufferSharedBufferView = /*#__PURE__*/function (MeshBufferSharedBufferView) {
        MeshBufferSharedBufferView[MeshBufferSharedBufferView["byteOffset"] = 0] = "byteOffset";
        MeshBufferSharedBufferView[MeshBufferSharedBufferView["vertexOffset"] = 1] = "vertexOffset";
        MeshBufferSharedBufferView[MeshBufferSharedBufferView["indexOffset"] = 2] = "indexOffset";
        MeshBufferSharedBufferView[MeshBufferSharedBufferView["dirty"] = 3] = "dirty";
        MeshBufferSharedBufferView[MeshBufferSharedBufferView["count"] = 4] = "count";
        return MeshBufferSharedBufferView;
      }(MeshBufferSharedBufferView || {});
      IA_POOL_USED_SCALE = 1 / 2;
      /**
       * @en Mesh buffer used for 2d rendering, used internally and not of concern to the user.
       * @zh 2d 渲染使用的网格缓冲数据，内部使用，用户不须关心。
       * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
       */
      _export("MeshBuffer", MeshBuffer = class MeshBuffer {
        /**
         * @en The vertex attributes of the buffer.
         * @zh buffer 的顶点属性。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get attributes() {
          return this._attributes;
        }
        /**
         * @en Number of bytes in vertex format.
         * @zh 顶点格式的字节数。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get vertexFormatBytes() {
          return this._vertexFormatBytes;
        }
        /**
         * @en byte offset.
         * @zh 字节偏移量。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get byteOffset() {
          return this._byteOffset;
        }
        set byteOffset(val) {
          this._byteOffset = val;
          if (JSB) {
            this._sharedBuffer[MeshBufferSharedBufferView.byteOffset] = val;
          }
        }
        /**
         * @en Vertexes offset.
         * @zh 顶点数偏移。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get vertexOffset() {
          return this._vertexOffset;
        }
        set vertexOffset(val) {
          this._vertexOffset = val;
          if (JSB) {
            this._sharedBuffer[MeshBufferSharedBufferView.vertexOffset] = val;
          }
        }
        /**
         * @en Indices offset.
         * @zh 索引偏移。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get indexOffset() {
          return this._indexOffset;
        }
        set indexOffset(val) {
          this._indexOffset = val;
          if (JSB) {
            this._sharedBuffer[MeshBufferSharedBufferView.indexOffset] = val;
          }
        }
        /**
         * @en Dirty flag.
         * @zh 脏标记。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get dirty() {
          return this._dirty;
        }
        set dirty(val) {
          this._dirty = val;
          if (JSB) {
            this._sharedBuffer[MeshBufferSharedBufferView.dirty] = val ? 1 : 0;
          }
        }
        /**
         * @en Float numbers per vertex.
         * @zh 每顶点的浮点数长度。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get floatsPerVertex() {
          return this._floatsPerVertex;
        }
        set floatsPerVertex(val) {
          this._floatsPerVertex = val;
        }
        /**
         * @en Vertexes data.
         * @zh 顶点数据。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get vData() {
          return this._vData;
        }
        set vData(val) {
          this._vData = val;
          //还得看是否需要共享.buffer
          if (JSB) {
            this._nativeObj.vData = val;
          }
        }
        /**
         * @en Indices data.
         * @zh 索引数据。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get iData() {
          return this._iData;
        }
        set iData(val) {
          this._iData = val;
          if (JSB) {
            this._nativeObj.iData = val;
          }
        }
        //nativeObj

        /**
         * @en Native object.
         * @zh 原生对象。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get nativeObj() {
          return this._nativeObj;
        }

        //sharedBuffer

        /**
         * @en Native shared buffer.
         * @zh 原生共享缓冲。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        get sharedBuffer() {
          return this._sharedBuffer;
        }

        /**
         * @en Initial native shared buffer.
         * @zh 初始化原生共享缓冲。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        initSharedBuffer() {
          if (JSB) {
            this._sharedBuffer = new Uint32Array(MeshBufferSharedBufferView.count);
          }
        }

        /**
         * @en Synchronized native shared buffer.
         * @zh 同步原生共享缓冲。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        syncSharedBufferToNative() {
          if (JSB) {
            this._nativeObj.syncSharedBufferToNative(this._sharedBuffer);
          }
        }
        constructor() {
          this._byteOffset = 0;
          this._vertexOffset = 0;
          this._indexOffset = 0;
          this._dirty = false;
          this._floatsPerVertex = 0;
          this._vData = null;
          this._iData = null;
          this._vertexFormatBytes = 0;
          this._initVDataCount = 0;
          this._initIDataCount = 0;
          this._attributes = null;
          // InputAssembler pools for each mesh buffer, array offset correspondent
          this._iaPool = [];
          this._iaInfo = null;
          this._nextFreeIAHandle = 0;
          if (JSB) {
            this._nativeObj = new NativeUIMeshBuffer();
            this.initSharedBuffer();
            this.syncSharedBufferToNative();
          }
        }

        /**
         * @en Initialize mesh buffer.
         * @zh 初始化对象。
         * @param device @en The GFX device. @zh GFX设备。
         * @param attrs @en The vertex attributes of the buffer. @zh 缓冲区的顶点属性。
         * @param vFloatCount @en The vertexes float count. @zh 每顶点所需的 float 数量。
         * @param iCount @en The indices count. @zh 索引数量。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        initialize(device, attrs, vFloatCount, iCount) {
          this._initVDataCount = vFloatCount;
          this._initIDataCount = iCount;
          this._attributes = attrs;
          this.floatsPerVertex = getAttributeStride(attrs) >> 2;

          // Use the GPU's actual reported capability to determine max addressable vertex count.
          // Feature.ELEMENT_INDEX_UINT is set to true in: WebGL2, WebGPU, Vulkan, Metal, GLES3, GLES2+ext.
          // vDataCountLimit is a vertex COUNT limit (max index value + 1), not the max index value itself.
          const vDataCountLimit = device.hasFeature(Feature.ELEMENT_INDEX_UINT) ? 4294967296 : 65536; // Uint32 or Uint16 can address 2^32 or 2^16 vertices (indices 0–2^32-1 or 0–2^16-1)
          assertIsTrue(this._initVDataCount / this._floatsPerVertex < vDataCountLimit, getError(9005));
          if (!this.vData || !this.iData) {
            this.vData = new Float32Array(this._initVDataCount);
            this.iData = new Uint16Array(this._initIDataCount);
          }
          // Initialize the first ia
          this._iaPool.push(this.createNewIA(device));
          if (JSB) {
            this._nativeObj.initialize(attrs);
          }
        }

        /**
         * @en Reset state.
         * @zh 重置状态。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        reset() {
          this._nextFreeIAHandle = 0;
          this.dirty = false;
        }
        destroy() {
          this.reset();
          this._attributes = null;
          this._iaInfo = null;
          this.vData = null;
          this.iData = null;

          // Destroy InputAssemblers
          for (let i = 0; i < this._iaPool.length; ++i) {
            const iaRef = this._iaPool[i];
            const vertexBuffer0 = iaRef.vertexBuffers[0];
            if (vertexBuffer0) {
              vertexBuffer0.destroy();
            }
            const indexBuffer = iaRef.indexBuffer;
            if (indexBuffer) {
              indexBuffer.destroy();
            }
            iaRef.ia.destroy();
          }
          this._iaPool.length = 0;
        }

        /**
         * @en Set dirty flag.
         * @zh 设置脏标签。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        setDirty() {
          this.dirty = true;
        }

        /**
         * @deprecated since v3.4.0, please use BufferAccessor's request
         * @see [[BufferAccessor.request]]
         */
        request(vertexCount, indexCount) {
          warnID(9002);
          return false;
        }

        /**
         * @en require Free input assembler.
         * @zh 请求可用的输入汇集器。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        requireFreeIA(device) {
          if (this._iaPool.length <= this._nextFreeIAHandle) {
            this._iaPool.push(this.createNewIA(device));
          }
          const ia = this._iaPool[this._nextFreeIAHandle++].ia;
          return ia;
        }

        /**
         * @en recycle input assembler.
         * @zh 回收输入汇集器。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        recycleIA(ia) {
          const pool = this._iaPool;
          for (let i = 0; i < this._nextFreeIAHandle; ++i) {
            if (ia === pool[i].ia) {
              // Swap to recycle the ia
              const iaRef = pool[i];
              pool[i] = pool[--this._nextFreeIAHandle];
              pool[this._nextFreeIAHandle] = iaRef;
              return;
            }
          }
        }

        /**
         * @en check capacity.
         * @zh 检查可分配余量。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        checkCapacity(vertexCount, indexCount) {
          const maxVertex = (this.vertexOffset + vertexCount) * this._floatsPerVertex;
          const maxIndex = this.indexOffset + indexCount;
          if (maxVertex > this._initVDataCount || maxIndex > this._initIDataCount) {
            return false;
          }
          return true;
        }

        /**
         * @en Upload and update buffers data.
         * @zh 上传更新缓冲内容。
         * @deprecated since v3.7.0, this is an engine private interface that will be removed in the future.
         */
        uploadBuffers() {
          if (this.byteOffset === 0 || !this._dirty) {
            return;
          }

          // On iOS14, different IAs can not share same GPU buffer, so must submit the same date to different buffers
          const iOS14 = sys.__isWebIOS14OrIPadOS14Env;
          const submitCount = iOS14 ? this._nextFreeIAHandle : 1;
          if (iOS14 && submitCount / this._iaPool.length < IA_POOL_USED_SCALE) {
            const count = submitCount / IA_POOL_USED_SCALE;
            const length = this._iaPool.length;
            // Destroy InputAssemblers
            for (let i = length - 1; i >= count; i--) {
              const iaRef = this._iaPool[i];
              if (iaRef.vertexBuffers[0]) {
                iaRef.vertexBuffers[0].destroy();
              }
              if (iaRef.indexBuffer) {
                iaRef.indexBuffer.destroy();
              }
              iaRef.ia.destroy();
            }
            this._iaPool.length = count;
          }
          const byteCount = this.byteOffset;
          const indexCount = this.indexOffset;
          for (let i = 0; i < submitCount; ++i) {
            const iaRef = this._iaPool[i];
            const verticesData = new Float32Array(this.vData.buffer, 0, byteCount >> 2);
            const indicesData = new Uint16Array(this.iData.buffer, 0, indexCount);
            const vertexBuffer = iaRef.vertexBuffers[0];
            if (byteCount > vertexBuffer.size) {
              vertexBuffer.resize(byteCount);
            }
            vertexBuffer.update(verticesData);
            if (indexCount * 2 > iaRef.indexBuffer.size) {
              iaRef.indexBuffer.resize(indexCount * 2);
            }
            iaRef.indexBuffer.update(indicesData);
          }
          this.dirty = false;
        }
        createNewIA(device) {
          let ia;
          let vertexBuffers;
          let indexBuffer;
          // HACK: After sharing buffer between drawcalls, the performance degradation a lots on iOS 14 or iPad OS 14 device
          // TODO: Maybe it can be removed after Apple fixes it?
          if (sys.__isWebIOS14OrIPadOS14Env || !this._iaPool[0]) {
            const vbStride = this._vertexFormatBytes = this._floatsPerVertex * Float32Array.BYTES_PER_ELEMENT;
            const ibStride = Uint16Array.BYTES_PER_ELEMENT;
            const vertexBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, vbStride, vbStride));
            indexBuffer = device.createBuffer(new BufferInfo(BufferUsageBit.INDEX | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, ibStride, ibStride));
            vertexBuffers = [vertexBuffer];
            // Reuse purpose for new IAs
            this._iaInfo = new InputAssemblerInfo(this._attributes, vertexBuffers, indexBuffer);
            ia = device.createInputAssembler(this._iaInfo);
          } else {
            ia = device.createInputAssembler(this._iaInfo);
            vertexBuffers = this._iaInfo.vertexBuffers;
            indexBuffer = this._iaInfo.indexBuffer;
          }
          return {
            ia,
            vertexBuffers,
            indexBuffer
          };
        }
      });
    }
  };
});