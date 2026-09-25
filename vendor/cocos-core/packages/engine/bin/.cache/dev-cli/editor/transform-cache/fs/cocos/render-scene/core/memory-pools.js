System.register("q-bundled:///fs/cocos/render-scene/core/memory-pools.js", ["../../../../virtual/internal%253Aconstants.js", "./native-pools.js", "../../core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var DEBUG, NativeBufferPool, warn, BufferPool, contains, BufferDataType, PoolType, NULL_HANDLE, Render2dView, Render2dViewDataType, Render2dViewDataMembers, Render2dPool, NodeView, NodeViewDataType, NodeViewDataMembers, NodePool, PassView, PassViewDataType, PassViewDataMembers, PassPool, AABBView, AABBViewDataType, AABBViewDataMembers, AABBPool;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_nativePoolsJs) {
      NativeBufferPool = _nativePoolsJs.NativeBufferPool;
    }, function (_corePlatformDebugJs) {
      warn = _corePlatformDebugJs.warn;
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
      contains = (a, t) => {
        for (let i = 0; i < a.length; ++i) {
          if (a[i] === t) return true;
        }
        return false;
      }; // a little hacky, but works (different specializations should not be assignable to each other)
      // eslint-disable-next-line @typescript-eslint/ban-types
      BufferDataType = /*#__PURE__*/function (BufferDataType) {
        BufferDataType[BufferDataType["UINT32"] = 0] = "UINT32";
        BufferDataType[BufferDataType["FLOAT32"] = 1] = "FLOAT32";
        BufferDataType[BufferDataType["NEVER"] = 2] = "NEVER";
        return BufferDataType;
      }(BufferDataType || {});
      BufferPool = class BufferPool {
        constructor(poolType, dataType, dataMembers, enumType, entryBits = 8) {
          // naming convension:
          // this._bufferViews[chunk][entry][element]
          this._arrayBuffers = [];
          this._freeLists = [];
          this._uint32BufferViews = [];
          this._float32BufferViews = [];
          this._hasUint32 = false;
          this._hasFloat32 = false;
          this._elementCount = enumType.COUNT;
          this._entryBits = entryBits;
          this._dataType = dataType;
          this._dataMembers = dataMembers;
          const bytesPerElement = 4;
          this._stride = bytesPerElement * this._elementCount;
          this._entriesPerChunk = 1 << entryBits;
          this._entryMask = this._entriesPerChunk - 1;
          this._poolFlag = 1 << 30;
          this._chunkMask = ~(this._entryMask | this._poolFlag);
          this._nativePool = new NativeBufferPool(poolType, entryBits, this._stride);
          let type = BufferDataType.NEVER;
          let hasFloat32 = false;
          let hasUint32 = false;
          for (const e in dataType) {
            hasFloat32 = this._hasFloat32;
            hasUint32 = this._hasUint32;
            if (hasUint32 && hasFloat32) {
              break;
            }
            type = dataType[e];
            if (!hasFloat32 && type === BufferDataType.FLOAT32) {
              this._hasFloat32 = true;
            } else if (!hasUint32 && type === BufferDataType.UINT32) {
              this._hasUint32 = true;
            }
          }
        }
        alloc() {
          let i = 0;
          for (; i < this._freeLists.length; i++) {
            const list = this._freeLists[i];
            if (list.length) {
              const j = list[list.length - 1];
              list.length--;
              return (i << this._entryBits) + j + this._poolFlag;
            }
          }
          // add a new chunk
          const buffer = this._nativePool.allocateNewChunk();
          const float32BufferViews = [];
          const uint32BufferViews = [];
          const freeList = [];
          const hasFloat32 = this._hasFloat32;
          const hasUint32 = this._hasUint32;
          for (let j = 0; j < this._entriesPerChunk; j++) {
            if (hasFloat32) {
              float32BufferViews.push(new Float32Array(buffer, this._stride * j, this._elementCount));
            }
            if (hasUint32) {
              uint32BufferViews.push(new Uint32Array(buffer, this._stride * j, this._elementCount));
            }
            if (j) {
              freeList.push(j);
            }
          }
          if (hasUint32) {
            this._uint32BufferViews.push(uint32BufferViews);
          }
          if (hasFloat32) {
            this._float32BufferViews.push(float32BufferViews);
          }
          this._freeLists.push(freeList);
          this._arrayBuffers.push(buffer);
          const handle = (i << this._entryBits) + this._poolFlag;
          return handle; // guarantees the handle is always not zero
        }
        getBuffer(handle) {
          const chunk = (this._chunkMask & handle) >> this._entryBits;
          const entry = this._entryMask & handle;
          const bufferViews = this._hasFloat32 ? this._float32BufferViews : this._uint32BufferViews;
          if (DEBUG && (!handle || chunk < 0 || chunk >= bufferViews.length || entry < 0 || entry >= this._entriesPerChunk || contains(this._freeLists[chunk], entry))) {
            warn('invalid buffer pool handle');
            return [];
          }
          return bufferViews[chunk][entry];
        }
        getTypedArray(handle, element) {
          const chunk = (this._chunkMask & handle) >> this._entryBits;
          const entry = this._entryMask & handle;
          const bufferViews = this._dataType[element] === BufferDataType.UINT32 ? this._uint32BufferViews : this._float32BufferViews;
          if (DEBUG && (!handle || chunk < 0 || chunk >= bufferViews.length || entry < 0 || entry >= this._entriesPerChunk || contains(this._freeLists[chunk], entry))) {
            warn('invalid buffer pool handle');
            return [];
          }
          const index = element;
          const view = bufferViews[chunk][entry];
          const count = this._dataMembers[element];
          return view.subarray(index, index + count);
        }
        free(handle) {
          const chunk = (this._chunkMask & handle) >> this._entryBits;
          const entry = this._entryMask & handle;
          if (DEBUG && (!handle || chunk < 0 || chunk >= this._freeLists.length || entry < 0 || entry >= this._entriesPerChunk || contains(this._freeLists[chunk], entry))) {
            warn('invalid buffer pool handle');
            return;
          }
          const bufferViews = this._hasUint32 ? this._uint32BufferViews : this._float32BufferViews;
          bufferViews[chunk][entry].fill(0);
          this._freeLists[chunk].push(entry);
        }
      };
      _export("PoolType", PoolType = /*#__PURE__*/function (PoolType) {
        // buffers
        PoolType[PoolType["NODE"] = 0] = "NODE";
        PoolType[PoolType["PASS"] = 1] = "PASS";
        PoolType[PoolType["AABB"] = 2] = "AABB";
        PoolType[PoolType["RENDER2D"] = 3] = "RENDER2D";
        return PoolType;
      }({}));
      _export("NULL_HANDLE", NULL_HANDLE = 0);
      _export("Render2dView", Render2dView = /*#__PURE__*/function (Render2dView) {
        Render2dView[Render2dView["POSITION"] = 0] = "POSITION";
        // Vec3
        Render2dView[Render2dView["UV"] = 3] = "UV";
        // Vec2
        Render2dView[Render2dView["COLOR"] = 5] = "COLOR";
        // Vec4
        Render2dView[Render2dView["COUNT"] = 9] = "COUNT";
        return Render2dView;
      }({}));
      Render2dViewDataType = {
        [Render2dView.POSITION]: BufferDataType.FLOAT32,
        [Render2dView.UV]: BufferDataType.FLOAT32,
        [Render2dView.COLOR]: BufferDataType.UINT32,
        [Render2dView.COUNT]: BufferDataType.NEVER
      };
      Render2dViewDataMembers = {
        [Render2dView.POSITION]: Render2dView.UV - Render2dView.POSITION,
        [Render2dView.UV]: Render2dView.COLOR - Render2dView.UV,
        [Render2dView.COLOR]: Render2dView.COUNT - Render2dView.COLOR,
        [Render2dView.COUNT]: 1
      };
      _export("Render2dPool", Render2dPool = new BufferPool(PoolType.RENDER2D, Render2dViewDataType, Render2dViewDataMembers, Render2dView));
      _export("NodeView", NodeView = /*#__PURE__*/function (NodeView) {
        NodeView[NodeView["DIRTY_FLAG"] = 0] = "DIRTY_FLAG";
        NodeView[NodeView["LAYER"] = 1] = "LAYER";
        NodeView[NodeView["WORLD_SCALE"] = 2] = "WORLD_SCALE";
        // Vec3
        NodeView[NodeView["WORLD_POSITION"] = 5] = "WORLD_POSITION";
        // Vec3
        NodeView[NodeView["WORLD_ROTATION"] = 8] = "WORLD_ROTATION";
        // Quat
        NodeView[NodeView["WORLD_MATRIX"] = 12] = "WORLD_MATRIX";
        // Mat4
        NodeView[NodeView["LOCAL_SCALE"] = 28] = "LOCAL_SCALE";
        // Vec3
        NodeView[NodeView["LOCAL_POSITION"] = 31] = "LOCAL_POSITION";
        // Vec3
        NodeView[NodeView["LOCAL_ROTATION"] = 34] = "LOCAL_ROTATION";
        // Quat
        NodeView[NodeView["COUNT"] = 38] = "COUNT";
        return NodeView;
      }({}));
      NodeViewDataType = {
        [NodeView.DIRTY_FLAG]: BufferDataType.UINT32,
        [NodeView.LAYER]: BufferDataType.UINT32,
        [NodeView.WORLD_SCALE]: BufferDataType.FLOAT32,
        [NodeView.WORLD_POSITION]: BufferDataType.FLOAT32,
        [NodeView.WORLD_ROTATION]: BufferDataType.FLOAT32,
        [NodeView.WORLD_MATRIX]: BufferDataType.FLOAT32,
        [NodeView.LOCAL_SCALE]: BufferDataType.FLOAT32,
        [NodeView.LOCAL_POSITION]: BufferDataType.FLOAT32,
        [NodeView.LOCAL_ROTATION]: BufferDataType.FLOAT32,
        [NodeView.COUNT]: BufferDataType.NEVER
      };
      NodeViewDataMembers = {
        [NodeView.DIRTY_FLAG]: NodeView.LAYER - NodeView.DIRTY_FLAG,
        [NodeView.LAYER]: NodeView.WORLD_SCALE - NodeView.LAYER,
        [NodeView.WORLD_SCALE]: NodeView.WORLD_POSITION - NodeView.WORLD_SCALE,
        [NodeView.WORLD_POSITION]: NodeView.WORLD_ROTATION - NodeView.WORLD_POSITION,
        [NodeView.WORLD_ROTATION]: NodeView.WORLD_MATRIX - NodeView.WORLD_ROTATION,
        [NodeView.WORLD_MATRIX]: NodeView.LOCAL_SCALE - NodeView.WORLD_MATRIX,
        [NodeView.LOCAL_SCALE]: NodeView.LOCAL_POSITION - NodeView.LOCAL_SCALE,
        [NodeView.LOCAL_POSITION]: NodeView.LOCAL_ROTATION - NodeView.LOCAL_POSITION,
        [NodeView.LOCAL_ROTATION]: NodeView.COUNT - NodeView.LOCAL_ROTATION,
        [NodeView.COUNT]: 1
      };
      _export("NodePool", NodePool = new BufferPool(PoolType.NODE, NodeViewDataType, NodeViewDataMembers, NodeView));
      _export("PassView", PassView = /*#__PURE__*/function (PassView) {
        PassView[PassView["PRIORITY"] = 0] = "PRIORITY";
        PassView[PassView["STAGE"] = 1] = "STAGE";
        PassView[PassView["PHASE"] = 2] = "PHASE";
        PassView[PassView["PRIMITIVE"] = 3] = "PRIMITIVE";
        PassView[PassView["BATCHING_SCHEME"] = 4] = "BATCHING_SCHEME";
        PassView[PassView["DYNAMIC_STATE"] = 5] = "DYNAMIC_STATE";
        PassView[PassView["HASH"] = 6] = "HASH";
        PassView[PassView["COUNT"] = 7] = "COUNT";
        return PassView;
      }({}));
      PassViewDataType = {
        [PassView.PRIORITY]: BufferDataType.UINT32,
        [PassView.STAGE]: BufferDataType.UINT32,
        [PassView.PHASE]: BufferDataType.UINT32,
        [PassView.PRIMITIVE]: BufferDataType.UINT32,
        [PassView.BATCHING_SCHEME]: BufferDataType.UINT32,
        [PassView.DYNAMIC_STATE]: BufferDataType.UINT32,
        [PassView.HASH]: BufferDataType.UINT32,
        [PassView.COUNT]: BufferDataType.NEVER
      };
      PassViewDataMembers = {
        [PassView.PRIORITY]: PassView.STAGE - PassView.PRIORITY,
        [PassView.STAGE]: PassView.PHASE - PassView.STAGE,
        [PassView.PHASE]: PassView.PRIMITIVE - PassView.PHASE,
        [PassView.PRIMITIVE]: PassView.BATCHING_SCHEME - PassView.PRIMITIVE,
        [PassView.BATCHING_SCHEME]: PassView.DYNAMIC_STATE - PassView.BATCHING_SCHEME,
        [PassView.DYNAMIC_STATE]: PassView.HASH - PassView.DYNAMIC_STATE,
        [PassView.HASH]: PassView.COUNT - PassView.HASH,
        [PassView.COUNT]: 1
      };
      _export("PassPool", PassPool = new BufferPool(PoolType.PASS, PassViewDataType, PassViewDataMembers, PassView));
      _export("AABBView", AABBView = /*#__PURE__*/function (AABBView) {
        AABBView[AABBView["CENTER"] = 0] = "CENTER";
        // Vec3
        AABBView[AABBView["HALFEXTENTS"] = 3] = "HALFEXTENTS";
        // Vec3
        AABBView[AABBView["COUNT"] = 6] = "COUNT";
        return AABBView;
      }({}));
      AABBViewDataType = {
        [AABBView.CENTER]: BufferDataType.FLOAT32,
        [AABBView.HALFEXTENTS]: BufferDataType.FLOAT32,
        [AABBView.COUNT]: BufferDataType.NEVER
      };
      AABBViewDataMembers = {
        [AABBView.CENTER]: AABBView.HALFEXTENTS - AABBView.CENTER,
        [AABBView.HALFEXTENTS]: AABBView.COUNT - AABBView.HALFEXTENTS,
        [AABBView.COUNT]: 1
      };
      _export("AABBPool", AABBPool = new BufferPool(PoolType.AABB, AABBViewDataType, AABBViewDataMembers, AABBView));
    }
  };
});