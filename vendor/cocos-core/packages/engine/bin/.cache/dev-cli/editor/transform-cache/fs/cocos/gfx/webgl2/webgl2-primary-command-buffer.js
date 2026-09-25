System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-primary-command-buffer.js", ["../base/define.js", "./webgl2-command-buffer.js", "./webgl2-commands.js", "./webgl2-define.js", "../../core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var BufferUsageBit, TextureBlit, Filter, WebGL2CommandBuffer, WebGL2CmdFuncBeginRenderPass, WebGL2CmdFuncBindStates, WebGL2CmdFuncBlitTexture, WebGL2CmdFuncCopyBuffersToTexture, WebGL2CmdFuncDraw, WebGL2CmdFuncUpdateBuffer, WebGL2DeviceManager, errorID, WebGL2PrimaryCommandBuffer, currGPUFBO, textureBlit;
  _export("WebGL2PrimaryCommandBuffer", void 0);
  return {
    setters: [function (_baseDefineJs) {
      BufferUsageBit = _baseDefineJs.BufferUsageBit;
      TextureBlit = _baseDefineJs.TextureBlit;
      Filter = _baseDefineJs.Filter;
    }, function (_webgl2CommandBufferJs) {
      WebGL2CommandBuffer = _webgl2CommandBufferJs.WebGL2CommandBuffer;
    }, function (_webgl2CommandsJs) {
      WebGL2CmdFuncBeginRenderPass = _webgl2CommandsJs.WebGL2CmdFuncBeginRenderPass;
      WebGL2CmdFuncBindStates = _webgl2CommandsJs.WebGL2CmdFuncBindStates;
      WebGL2CmdFuncBlitTexture = _webgl2CommandsJs.WebGL2CmdFuncBlitTexture;
      WebGL2CmdFuncCopyBuffersToTexture = _webgl2CommandsJs.WebGL2CmdFuncCopyBuffersToTexture;
      WebGL2CmdFuncDraw = _webgl2CommandsJs.WebGL2CmdFuncDraw;
      WebGL2CmdFuncUpdateBuffer = _webgl2CommandsJs.WebGL2CmdFuncUpdateBuffer;
    }, function (_webgl2DefineJs) {
      WebGL2DeviceManager = _webgl2DefineJs.WebGL2DeviceManager;
    }, function (_corePlatformDebugJs) {
      errorID = _corePlatformDebugJs.errorID;
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
      textureBlit = new TextureBlit();
      /** @mangle */
      _export("WebGL2PrimaryCommandBuffer", WebGL2PrimaryCommandBuffer = class WebGL2PrimaryCommandBuffer extends WebGL2CommandBuffer {
        constructor() {
          super();
        }
        beginRenderPass(renderPass, framebuffer, renderArea, clearColors, clearDepth, clearStencil) {
          currGPUFBO = framebuffer.getGpuFramebuffer();
          WebGL2CmdFuncBeginRenderPass(WebGL2DeviceManager.instance, renderPass.getGpuRenderPass(), currGPUFBO, renderArea, clearColors, clearDepth, clearStencil);
          this._isInRenderPass = true;
        }
        endRenderPass() {
          super.endRenderPass();
          if (currGPUFBO) {
            const colorViews = currGPUFBO.gpuColorViews;
            for (const colorView of colorViews) {
              if (colorView.gpuTexture.resolveTex) {
                textureBlit.srcExtent.width = currGPUFBO.width;
                textureBlit.srcExtent.height = currGPUFBO.height;
                textureBlit.dstExtent.width = currGPUFBO.width;
                textureBlit.dstExtent.height = currGPUFBO.height;
                WebGL2CmdFuncBlitTexture(WebGL2DeviceManager.instance, colorView.gpuTexture, colorView.gpuTexture.resolveTex, [textureBlit], Filter.LINEAR);
              }
            }
          }
        }
        draw(infoOrAssembler) {
          if (this._isInRenderPass) {
            if (this._isStateInvalid) {
              this.bindStates();
            }
            const info = 'drawInfo' in infoOrAssembler ? infoOrAssembler.drawInfo : infoOrAssembler;
            WebGL2CmdFuncDraw(WebGL2DeviceManager.instance, info);
            ++this._numDrawCalls;
            this._numInstances += info.instanceCount;
            const indexCount = info.indexCount || info.vertexCount;
            if (this._curGPUPipelineState) {
              const glPrimitive = this._curGPUPipelineState.glPrimitive;
              switch (glPrimitive) {
                case 0x0004:
                  {
                    // WebGLRenderingContext.TRIANGLES
                    this._numTris += indexCount / 3 * Math.max(info.instanceCount, 1);
                    break;
                  }
                case 0x0005: // WebGLRenderingContext.TRIANGLE_STRIP
                case 0x0006:
                  {
                    // WebGLRenderingContext.TRIANGLE_FAN
                    this._numTris += (indexCount - 2) * Math.max(info.instanceCount, 1);
                    break;
                  }
                default:
              }
            }
          } else {
            errorID(16328);
          }
        }
        setViewport(viewport) {
          const {
            gl
          } = WebGL2DeviceManager.instance;
          const cache = WebGL2DeviceManager.instance.getStateCache();
          if (cache.viewport.left !== viewport.left || cache.viewport.top !== viewport.top || cache.viewport.width !== viewport.width || cache.viewport.height !== viewport.height) {
            gl.viewport(viewport.left, viewport.top, viewport.width, viewport.height);
            cache.viewport.left = viewport.left;
            cache.viewport.top = viewport.top;
            cache.viewport.width = viewport.width;
            cache.viewport.height = viewport.height;
          }
        }
        setScissor(scissor) {
          const {
            gl
          } = WebGL2DeviceManager.instance;
          const cache = WebGL2DeviceManager.instance.getStateCache();
          if (cache.scissorRect.x !== scissor.x || cache.scissorRect.y !== scissor.y || cache.scissorRect.width !== scissor.width || cache.scissorRect.height !== scissor.height) {
            gl.scissor(scissor.x, scissor.y, scissor.width, scissor.height);
            cache.scissorRect.x = scissor.x;
            cache.scissorRect.y = scissor.y;
            cache.scissorRect.width = scissor.width;
            cache.scissorRect.height = scissor.height;
          }
        }
        updateBuffer(buffer, data, size) {
          if (!this._isInRenderPass) {
            const gpuBuffer = buffer.getGpuBuffer();
            if (gpuBuffer) {
              let buffSize;
              if (size !== undefined) {
                buffSize = size;
              } else if (buffer.usage & BufferUsageBit.INDIRECT) {
                buffSize = 0;
              } else {
                buffSize = data.byteLength;
              }
              WebGL2CmdFuncUpdateBuffer(WebGL2DeviceManager.instance, gpuBuffer, data, 0, buffSize);
            }
          } else {
            errorID(16329);
          }
        }
        copyBuffersToTexture(buffers, texture, regions) {
          if (!this._isInRenderPass) {
            const gpuTexture = texture.gpuTexture;
            if (gpuTexture) {
              WebGL2CmdFuncCopyBuffersToTexture(WebGL2DeviceManager.instance, buffers, gpuTexture, regions);
            }
          } else {
            errorID(16330);
          }
        }
        execute(cmdBuffs, count) {
          errorID(16402);
        }
        bindStates() {
          WebGL2CmdFuncBindStates(WebGL2DeviceManager.instance, this._curGPUPipelineState, this._curGPUInputAssembler, this._curGPUDescriptorSets, this._curDynamicOffsets, this._curDynamicStates);
          this._isStateInvalid = false;
        }
        blitTexture(srcTexture, dstTexture, regions, filter) {
          const gpuTextureSrc = srcTexture.gpuTexture;
          const gpuTextureDst = dstTexture.gpuTexture;
          WebGL2CmdFuncBlitTexture(WebGL2DeviceManager.instance, gpuTextureSrc, gpuTextureDst, regions, filter);
        }
      });
    }
  };
});