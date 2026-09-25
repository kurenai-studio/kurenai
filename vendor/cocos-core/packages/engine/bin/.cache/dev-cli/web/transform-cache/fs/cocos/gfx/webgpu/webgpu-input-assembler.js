System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-input-assembler.js", ["../base/input-assembler.js", "./webgpu-commands.js", "./define.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var InputAssembler, WebGPUCmdFuncCreateInputAssember, WebGPUCmdFuncDestroyInputAssembler, WebGPUDeviceManager, errorID, WebGPUInputAssembler;
  _export("WebGPUInputAssembler", void 0);
  return {
    setters: [function (_baseInputAssemblerJs) {
      InputAssembler = _baseInputAssemblerJs.InputAssembler;
    }, function (_webgpuCommandsJs) {
      WebGPUCmdFuncCreateInputAssember = _webgpuCommandsJs.WebGPUCmdFuncCreateInputAssember;
      WebGPUCmdFuncDestroyInputAssembler = _webgpuCommandsJs.WebGPUCmdFuncDestroyInputAssembler;
    }, function (_defineJs) {
      WebGPUDeviceManager = _defineJs.WebGPUDeviceManager;
    }, function (_coreIndexJs) {
      errorID = _coreIndexJs.errorID;
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
      _export("WebGPUInputAssembler", WebGPUInputAssembler = class WebGPUInputAssembler extends InputAssembler {
        constructor(...args) {
          super(...args);
          this._gpuInputAssembler = null;
        }
        get gpuInputAssembler() {
          return this._gpuInputAssembler;
        }
        initialize(info) {
          if (info.vertexBuffers.length === 0) {
            errorID(16331);
            return;
          }
          this._attributes = info.attributes;
          this._attributesHash = this.computeAttributesHash();
          this._vertexBuffers = info.vertexBuffers;
          if (info.indexBuffer) {
            this._indexBuffer = info.indexBuffer;
            this.drawInfo.indexCount = this._indexBuffer.size / this._indexBuffer.stride;
            this.drawInfo.firstIndex = 0;
          } else {
            const vertBuff = this._vertexBuffers[0];
            this.drawInfo.vertexCount = vertBuff.size / vertBuff.stride;
            this.drawInfo.firstVertex = 0;
            this.drawInfo.vertexOffset = 0;
          }
          this._drawInfo.instanceCount = 0;
          this._drawInfo.firstInstance = 0;
          this._indirectBuffer = info.indirectBuffer || null;
          const vertBuffSize = info.vertexBuffers.length;
          const gpuVertexBuffers = new Array(vertBuffSize);
          for (let i = 0; i < vertBuffSize; ++i) {
            const vb = info.vertexBuffers[i];
            if (vb.gpuBuffer) {
              gpuVertexBuffers[i] = vb.gpuBuffer;
            }
          }
          let gpuIndexBuffer = null;
          let gpuIndexType = 'uint16';
          if (info.indexBuffer) {
            gpuIndexBuffer = info.indexBuffer.gpuBuffer;
            if (gpuIndexBuffer) {
              switch (gpuIndexBuffer.stride) {
                // case 1: gpuIndexType = 0x1401; break; // => WebGLRenderingContext.UNSIGNED_BYTE
                case 2:
                  gpuIndexType = 'uint16';
                  break;
                // => WebGLRenderingContext.UNSIGNED_SHORT
                case 4:
                  gpuIndexType = 'uint32';
                  break;
                // => WebGLRenderingContext.UNSIGNED_INT
                default:
                  {
                    errorID(16332);
                  }
              }
            }
          }
          let gpuIndirectBuffer = null;
          if (info.indirectBuffer) {
            gpuIndirectBuffer = info.indirectBuffer.gpuBuffer;
          }
          this._gpuInputAssembler = {
            attributes: info.attributes,
            gpuVertexBuffers,
            gpuIndexBuffer,
            gpuIndirectBuffer,
            samples: 1,
            gpuAttribs: [],
            gpuIndexType
          };
          WebGPUCmdFuncCreateInputAssember(WebGPUDeviceManager.instance, this._gpuInputAssembler);
        }
        destroy() {
          const WebGPUDev = WebGPUDeviceManager.instance;
          if (this._gpuInputAssembler) {
            WebGPUCmdFuncDestroyInputAssembler(WebGPUDev, this._gpuInputAssembler);
          }
          this._gpuInputAssembler = null;
        }
      });
    }
  };
});