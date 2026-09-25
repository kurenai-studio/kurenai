System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-input-assembler.js", ["../../core/platform/debug.js", "../base/input-assembler.js", "../gl-constants.js", "./webgl2-commands.js", "./webgl2-define.js"], function (_export, _context) {
  "use strict";

  var errorID, InputAssembler, WebGLConstants, WebGL2CmdFuncCreateInputAssember, WebGL2CmdFuncDestroyInputAssembler, WebGL2DeviceManager, WebGL2InputAssembler;
  _export("WebGL2InputAssembler", void 0);
  return {
    setters: [function (_corePlatformDebugJs) {
      errorID = _corePlatformDebugJs.errorID;
    }, function (_baseInputAssemblerJs) {
      InputAssembler = _baseInputAssemblerJs.InputAssembler;
    }, function (_glConstantsJs) {
      WebGLConstants = _glConstantsJs.WebGLConstants;
    }, function (_webgl2CommandsJs) {
      WebGL2CmdFuncCreateInputAssember = _webgl2CommandsJs.WebGL2CmdFuncCreateInputAssember;
      WebGL2CmdFuncDestroyInputAssembler = _webgl2CommandsJs.WebGL2CmdFuncDestroyInputAssembler;
    }, function (_webgl2DefineJs) {
      WebGL2DeviceManager = _webgl2DefineJs.WebGL2DeviceManager;
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
      _export("WebGL2InputAssembler", WebGL2InputAssembler = class WebGL2InputAssembler extends InputAssembler {
        constructor() {
          super();
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
            this._drawInfo.indexCount = this._indexBuffer.size / this._indexBuffer.stride;
            this._drawInfo.firstIndex = 0;
          } else {
            const vertBuff = this._vertexBuffers[0];
            this._drawInfo.vertexCount = vertBuff.size / vertBuff.stride;
            this._drawInfo.firstVertex = 0;
            this._drawInfo.vertexOffset = 0;
          }
          this._drawInfo.instanceCount = 0;
          this._drawInfo.firstInstance = 0;
          this._indirectBuffer = info.indirectBuffer || null;
          const gpuVertexBuffers = new Array(info.vertexBuffers.length);
          for (let i = 0; i < info.vertexBuffers.length; ++i) {
            const vb = info.vertexBuffers[i];
            if (vb.getGpuBuffer()) {
              gpuVertexBuffers[i] = vb.getGpuBuffer();
            }
          }
          let gpuIndexBuffer = null;
          let glIndexType = 0;
          if (info.indexBuffer) {
            gpuIndexBuffer = info.indexBuffer.getGpuBuffer();
            if (gpuIndexBuffer) {
              switch (gpuIndexBuffer.stride) {
                case 1:
                  glIndexType = WebGLConstants.UNSIGNED_BYTE;
                  break;
                case 2:
                  glIndexType = WebGLConstants.UNSIGNED_SHORT;
                  break;
                case 4:
                  glIndexType = WebGLConstants.UNSIGNED_INT;
                  break;
                default:
                  {
                    errorID(16332);
                  }
              }
            }
          }
          let gpuIndirectBuffer = null;
          if (info.indirectBuffer) {
            gpuIndirectBuffer = info.indirectBuffer.getGpuBuffer();
          }
          this._gpuInputAssembler = {
            attributes: info.attributes,
            gpuVertexBuffers,
            gpuIndexBuffer,
            gpuIndirectBuffer,
            glAttribs: [],
            glIndexType,
            glVAOs: new Map()
          };
          WebGL2CmdFuncCreateInputAssember(WebGL2DeviceManager.instance, this._gpuInputAssembler);
        }
        destroy() {
          const device = WebGL2DeviceManager.instance;
          if (this._gpuInputAssembler && device.extensions.useVAO) {
            WebGL2CmdFuncDestroyInputAssembler(device, this._gpuInputAssembler);
          }
          this._gpuInputAssembler = null;
        }
      });
    }
  };
});