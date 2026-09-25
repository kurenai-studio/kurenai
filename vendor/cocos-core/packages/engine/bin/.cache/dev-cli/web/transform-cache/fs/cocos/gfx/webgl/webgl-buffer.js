System.register("q-bundled:///fs/cocos/gfx/webgl/webgl-buffer.js", ["../base/define.js", "../base/buffer.js", "./webgl-commands.js", "./webgl-gpu-objects.js", "./webgl-define.js", "../../core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var BufferUsageBit, Buffer, WebGLCmdFuncCreateBuffer, WebGLCmdFuncDestroyBuffer, WebGLCmdFuncResizeBuffer, WebGLCmdFuncUpdateBuffer, WebGLIndirectDrawInfos, WebGLDeviceManager, warnID, WebGLBuffer;
  _export("WebGLBuffer", void 0);
  return {
    setters: [function (_baseDefineJs) {
      BufferUsageBit = _baseDefineJs.BufferUsageBit;
    }, function (_baseBufferJs) {
      Buffer = _baseBufferJs.Buffer;
    }, function (_webglCommandsJs) {
      WebGLCmdFuncCreateBuffer = _webglCommandsJs.WebGLCmdFuncCreateBuffer;
      WebGLCmdFuncDestroyBuffer = _webglCommandsJs.WebGLCmdFuncDestroyBuffer;
      WebGLCmdFuncResizeBuffer = _webglCommandsJs.WebGLCmdFuncResizeBuffer;
      WebGLCmdFuncUpdateBuffer = _webglCommandsJs.WebGLCmdFuncUpdateBuffer;
    }, function (_webglGpuObjectsJs) {
      WebGLIndirectDrawInfos = _webglGpuObjectsJs.WebGLIndirectDrawInfos;
    }, function (_webglDefineJs) {
      WebGLDeviceManager = _webglDefineJs.WebGLDeviceManager;
    }, function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
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
      /** @mangle */
      _export("WebGLBuffer", WebGLBuffer = class WebGLBuffer extends Buffer {
        get gpuBuffer() {
          return this._gpuBuffer;
        }
        get gpuBufferView() {
          return this._gpuBufferView;
        }
        constructor() {
          super();
          this._gpuBuffer = null;
          this._gpuBufferView = null;
          this._uniformBuffer = null;
        }
        initialize(info) {
          if ('buffer' in info) {
            // buffer view
            this._isBufferView = true;
            const buffer = info.buffer;
            this._usage = buffer.usage;
            this._memUsage = buffer.memUsage;
            this._size = this._stride = info.range;
            this._count = 1;
            this._flags = buffer.flags;
            this._gpuBufferView = {
              gpuBuffer: buffer.gpuBuffer,
              offset: info.offset,
              range: info.range
            };
          } else {
            // native buffer
            this._usage = info.usage;
            this._memUsage = info.memUsage;
            this._size = info.size;
            this._stride = Math.max(info.stride || this._size, 1);
            this._count = this._size / this._stride;
            this._flags = info.flags;
            if (this._usage & BufferUsageBit.UNIFORM && this._size > 0) {
              this._uniformBuffer = new Uint8Array(this._size);
            }
            this._gpuBuffer = {
              usage: this._usage,
              memUsage: this._memUsage,
              size: this._size,
              stride: this._stride,
              buffer: null,
              vf32: null,
              indirects: new WebGLIndirectDrawInfos(),
              glTarget: 0,
              glBuffer: null
            };
            if (this._usage & BufferUsageBit.UNIFORM) {
              this._gpuBuffer.buffer = this._uniformBuffer;
            }
            WebGLCmdFuncCreateBuffer(WebGLDeviceManager.instance, this._gpuBuffer);
            WebGLDeviceManager.instance.memoryStatus.bufferSize += this._size;
          }
        }
        destroy() {
          if (this._gpuBuffer) {
            WebGLCmdFuncDestroyBuffer(WebGLDeviceManager.instance, this._gpuBuffer);
            WebGLDeviceManager.instance.memoryStatus.bufferSize -= this._size;
            this._gpuBuffer = null;
          }
          if (this._gpuBufferView) {
            this._gpuBufferView = null;
          }
        }
        resize(size) {
          if (this._isBufferView) {
            warnID(16379);
            return;
          }
          const oldSize = this._size;
          if (oldSize === size) {
            return;
          }
          this._size = size;
          this._count = this._size / this._stride;
          if (this._uniformBuffer) {
            this._uniformBuffer = new Uint8Array(size);
          }
          if (this._gpuBuffer) {
            if (this._uniformBuffer) {
              this._gpuBuffer.buffer = this._uniformBuffer;
            }
            this._gpuBuffer.size = size;
            if (size > 0) {
              WebGLCmdFuncResizeBuffer(WebGLDeviceManager.instance, this._gpuBuffer);
              WebGLDeviceManager.instance.memoryStatus.bufferSize -= oldSize;
              WebGLDeviceManager.instance.memoryStatus.bufferSize += size;
            }
          }
        }
        update(buffer, size) {
          if (this._isBufferView) {
            warnID(16380);
            return;
          }
          let buffSize;
          if (size !== undefined) {
            buffSize = size;
          } else if (this._usage & BufferUsageBit.INDIRECT) {
            buffSize = 0;
          } else {
            buffSize = buffer.byteLength;
          }
          WebGLCmdFuncUpdateBuffer(WebGLDeviceManager.instance, this._gpuBuffer, buffer, 0, buffSize);
        }
      });
    }
  };
});