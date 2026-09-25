System.register("q-bundled:///fs/cocos/gfx/base/buffer.js", ["./define.js"], function (_export, _context) {
  "use strict";

  var BufferFlagBit, BufferUsageBit, MemoryUsageBit, GFXObject, ObjectType, Buffer;
  _export("Buffer", void 0);
  return {
    setters: [function (_defineJs) {
      BufferFlagBit = _defineJs.BufferFlagBit;
      BufferUsageBit = _defineJs.BufferUsageBit;
      MemoryUsageBit = _defineJs.MemoryUsageBit;
      GFXObject = _defineJs.GFXObject;
      ObjectType = _defineJs.ObjectType;
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
       * @en GFX buffer.
       * @zh GFX 缓冲。
       */
      _export("Buffer", Buffer = class Buffer extends GFXObject {
        /**
         * @en Usage type of the buffer.
         * @zh 缓冲使用方式。
         */
        get usage() {
          return this._usage;
        }

        /**
         * @en Memory usage of the buffer.
         * @zh 缓冲的内存使用方式。
         */
        get memUsage() {
          return this._memUsage;
        }

        /**
         * @en Size of the buffer.
         * @zh 缓冲大小。
         */
        get size() {
          return this._size;
        }

        /**
         * @en Stride of the buffer.
         * @zh 缓冲步长。
         */
        get stride() {
          return this._stride;
        }

        /**
         * @en Count of the buffer wrt. stride.
         * @zh 缓冲条目数量。
         */
        get count() {
          return this._count;
        }
        get flags() {
          return this._flags;
        }

        /** @mangle */

        constructor() {
          super(ObjectType.BUFFER);
          this._usage = BufferUsageBit.NONE;
          /** @mangle */
          this._memUsage = MemoryUsageBit.NONE;
          /** @mangle */
          this._size = 0;
          /** @mangle */
          this._stride = 1;
          /** @mangle */
          this._count = 0;
          /** @mangle */
          this._flags = BufferFlagBit.NONE;
          /** @mangle */
          this._isBufferView = false;
        }

        /**
         * @en Resize the buffer.
         * @zh 重置缓冲大小。
         * @param size The new buffer size.
         */

        /**
         * @en Update the buffer data.
         * @zh 更新缓冲内容。
         * @param buffer The new buffer data.
         * @param size Size in bytes to be updated.
         */
      });
    }
  };
});