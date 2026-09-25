System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-buffer.js", ["../../core/platform/debug.js", "../base/buffer.js", "../base/define.js", "./define.js", "./webgpu-commands.js"], function (_export, _context) {
  "use strict";

  var warnID, Buffer, BufferUsageBit, IndirectBuffer, WebGPUDeviceManager, WebGPUCmdFuncCreateBuffer, WebGPUCmdFuncDestroyBuffer, WebGPUCmdFuncResizeBuffer, WebGPUCmdFuncUpdateBuffer, WebGPUBuffer;
  _export("WebGPUBuffer", void 0);
  return {
    setters: [function (_corePlatformDebugJs) {
      warnID = _corePlatformDebugJs.warnID;
    }, function (_baseBufferJs) {
      Buffer = _baseBufferJs.Buffer;
    }, function (_baseDefineJs) {
      BufferUsageBit = _baseDefineJs.BufferUsageBit;
      IndirectBuffer = _baseDefineJs.IndirectBuffer;
    }, function (_defineJs) {
      WebGPUDeviceManager = _defineJs.WebGPUDeviceManager;
    }, function (_webgpuCommandsJs) {
      WebGPUCmdFuncCreateBuffer = _webgpuCommandsJs.WebGPUCmdFuncCreateBuffer;
      WebGPUCmdFuncDestroyBuffer = _webgpuCommandsJs.WebGPUCmdFuncDestroyBuffer;
      WebGPUCmdFuncResizeBuffer = _webgpuCommandsJs.WebGPUCmdFuncResizeBuffer;
      WebGPUCmdFuncUpdateBuffer = _webgpuCommandsJs.WebGPUCmdFuncUpdateBuffer;
    }],
    execute: function () {
      /*
       Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
      
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
      _export("WebGPUBuffer", WebGPUBuffer = class WebGPUBuffer extends Buffer {
        constructor(...args) {
          super(...args);
          this._gpuBuffer = null;
          this._indirectBuffer = null;
          this._hasChange = false;
        }
        get gpuBuffer() {
          return this._gpuBuffer;
        }
        get hasChange() {
          return this._hasChange;
        }
        resetChange() {
          this._hasChange = false;
        }
        initialize(info) {
          if ('buffer' in info) {
            // buffer view
            // validate: webGPU buffer offset must be 256 bytes aligned
            // which can be guaranteed by WebGPUDevice::uboOffsetAligned
            this._isBufferView = true;
            const buffer = info.buffer;
            this._usage = buffer.usage;
            this._memUsage = buffer.memUsage;
            this._size = this._stride = Math.ceil(info.range / 4.0) * 4;
            this._count = 1;
            this._flags = buffer.flags;
            this._gpuBuffer = {
              usage: this._usage,
              memUsage: this._memUsage,
              size: this._size,
              stride: this._stride,
              buffer: null,
              indirects: buffer.gpuBuffer.indirects,
              gpuTarget: buffer.gpuBuffer.gpuTarget,
              gpuBuffer: buffer.gpuBuffer.gpuBuffer,
              gpuOffset: info.offset,
              flags: this._flags,
              drawIndirectByIndex: false
            };
          } else {
            // native buffer
            this._usage = info.usage;
            this._memUsage = info.memUsage;
            this._size = Math.ceil(info.size / 4.0) * 4;
            this._stride = Math.max(info.stride || this._size, 1);
            this._count = this._size / this._stride;
            this._flags = info.flags;
            if (this._usage & BufferUsageBit.INDIRECT) {
              this._indirectBuffer = new IndirectBuffer();
            }
            this._gpuBuffer = {
              usage: this._usage,
              memUsage: this._memUsage,
              size: this._size,
              stride: this._stride,
              buffer: null,
              indirects: [],
              gpuTarget: 0,
              flags: this._flags,
              gpuBuffer: null,
              gpuOffset: 0,
              drawIndirectByIndex: false
            };
            if (info.usage & BufferUsageBit.INDIRECT) {
              this._gpuBuffer.indirects = this._indirectBuffer.drawInfos;
            }
            const device = WebGPUDeviceManager.instance;
            WebGPUCmdFuncCreateBuffer(device, this._gpuBuffer);
            device.memoryStatus.bufferSize += this._size;
          }
        }
        destroy() {
          if (this._gpuBuffer) {
            if (!this._isBufferView) {
              const device = WebGPUDeviceManager.instance;
              WebGPUCmdFuncDestroyBuffer(device, this._gpuBuffer);
              device.memoryStatus.bufferSize -= this._size;
            }
            this._hasChange = true;
            this._gpuBuffer = null;
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
          this._hasChange = true;
          if (this._gpuBuffer) {
            this._gpuBuffer.size = this._size;
            if (this._size > 0) {
              const device = WebGPUDeviceManager.instance;
              WebGPUCmdFuncResizeBuffer(device, this._gpuBuffer);
              device.memoryStatus.bufferSize -= oldSize;
              device.memoryStatus.bufferSize += this._size;
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
          // Make sure buffSize is a multiple of 4
          buffSize = Math.ceil(buffSize / 4.0) * 4;
          if (this.size < buffSize) {
            this.resize(buffSize);
          }
          this._hasChange = true;
          const device = WebGPUDeviceManager.instance;
          WebGPUCmdFuncUpdateBuffer(device, this._gpuBuffer, buffer, 0, buffSize);
        }
      });
    }
  };
});