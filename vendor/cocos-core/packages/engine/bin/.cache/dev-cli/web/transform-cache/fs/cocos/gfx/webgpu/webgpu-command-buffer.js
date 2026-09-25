System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-command-buffer.js", ["../base/command-buffer.js", "../base/define.js", "./webgpu-commands.js", "../../core/math/bits.js", "./define.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var CommandBuffer, BufferUsageBit, CommandBufferType, DrawInfo, Viewport, DescriptorSetInfo, Format, clearRect, WebGPUCmd, WebGPUCmdCopyBufferToTexture, WebGPUCmdPackage, WebGPUCmdUpdateBuffer, INT_MAX, WebGPUDeviceManager, error, errorID, WebGPUCommandBuffer, currPipelineState, descriptorSets, groupSets, renderAreas, samples;
  _export("WebGPUCommandBuffer", void 0);
  return {
    setters: [function (_baseCommandBufferJs) {
      CommandBuffer = _baseCommandBufferJs.CommandBuffer;
    }, function (_baseDefineJs) {
      BufferUsageBit = _baseDefineJs.BufferUsageBit;
      CommandBufferType = _baseDefineJs.CommandBufferType;
      DrawInfo = _baseDefineJs.DrawInfo;
      Viewport = _baseDefineJs.Viewport;
      DescriptorSetInfo = _baseDefineJs.DescriptorSetInfo;
      Format = _baseDefineJs.Format;
    }, function (_webgpuCommandsJs) {
      clearRect = _webgpuCommandsJs.clearRect;
      WebGPUCmd = _webgpuCommandsJs.WebGPUCmd;
      WebGPUCmdCopyBufferToTexture = _webgpuCommandsJs.WebGPUCmdCopyBufferToTexture;
      WebGPUCmdPackage = _webgpuCommandsJs.WebGPUCmdPackage;
      WebGPUCmdUpdateBuffer = _webgpuCommandsJs.WebGPUCmdUpdateBuffer;
    }, function (_coreMathBitsJs) {
      INT_MAX = _coreMathBitsJs.INT_MAX;
    }, function (_defineJs) {
      WebGPUDeviceManager = _defineJs.WebGPUDeviceManager;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
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
      currPipelineState = null;
      descriptorSets = [];
      groupSets = [0, 1, 2];
      renderAreas = [];
      samples = 1;
      _export("WebGPUCommandBuffer", WebGPUCommandBuffer = class WebGPUCommandBuffer extends CommandBuffer {
        constructor(...args) {
          super(...args);
          this.cmdPackage = new WebGPUCmdPackage();
          this._webGPUAllocator = null;
          this._isInRenderPass = false;
          this._curGPUPipelineState = null;
          this._curWebGPUPipelineState = null;
          this._curGPUDescriptorSets = [];
          this._curGPUInputAssembler = null;
          this._curDynamicOffsets = [];
          this._curViewport = null;
          this._curScissor = null;
          this._curLineWidth = null;
          this._curDepthBias = null;
          this._curBlendConstants = [];
          this._curDepthBounds = null;
          this._curStencilWriteMask = null;
          this._curStencilCompareMask = null;
          this._isStateValid = false;
          this._globalDescriptors = [];
          this._nativeCommandBuffer = null;
          this._encoder = undefined;
          this._descSetDirtyIndex = INT_MAX;
          this._nativePassDesc = null;
          this._wgpuRenderPass = void 0;
          this._renderPassFuncQueue = [];
          this._computeFuncQueue = [];
        }
        pipelineBarrier(barrier, bufferBarriers, buffers, textureBarriers, textures) {
          throw new Error('Method not implemented.');
        }
        blitTexture(srcTexture, dstTexture, regions, filter) {
          // The blit operation for MSAA is moved to the rendering phase of the render pass to perform the resolve operation.
          if (srcTexture.samples > 1) {
            return;
          }
          const device = WebGPUDeviceManager.instance;
          const gpuDevice = device.nativeDevice;
          const encoder = gpuDevice.createCommandEncoder();
          const actualSrcTexture = srcTexture.getTextureHandle();
          for (const region of regions) {
            encoder.copyTextureToTexture({
              texture: actualSrcTexture,
              origin: {
                x: region.srcOffset.x,
                y: region.srcOffset.y,
                z: region.srcSubres.baseArrayLayer
              }
            }, {
              texture: dstTexture.getTextureHandle(),
              origin: {
                x: region.dstOffset.x,
                y: region.dstOffset.y,
                z: region.dstSubres.baseArrayLayer
              }
            }, {
              width: region.dstExtent.width,
              height: region.dstExtent.height,
              depthOrArrayLayers: region.dstExtent.depth
            });
          }
          const commandBuffer = encoder.finish();
          gpuDevice.queue.submit([commandBuffer]);
        }
        initialize(info) {
          this._type = info.type;
          this._queue = info.queue;
          const device = WebGPUDeviceManager.instance;
          this._webGPUAllocator = device.cmdAllocator;
          this._encoder = {};
          const setCount = device.bindingMappings.blockOffsets.length;
          for (let i = 0; i < setCount; i++) {
            this._curGPUDescriptorSets.push(null);
            this._curDynamicOffsets.push([]);
          }
          return true;
        }
        destroy() {
          if (this._webGPUAllocator) {
            this._webGPUAllocator.clearCmds(this.cmdPackage);
            this._webGPUAllocator = null;
          }
        }
        begin(renderPass, subpass, frameBuffer) {
          this._webGPUAllocator.clearCmds(this.cmdPackage);
          renderAreas.length = 0;
          this._curGPUPipelineState = null;
          this._curGPUInputAssembler = null;
          this._curGPUDescriptorSets.length = 0;
          const dynamicOffsetSize = this._curDynamicOffsets.length;
          for (let i = 0; i < dynamicOffsetSize; i++) {
            this._curDynamicOffsets[i].length = 0;
          }
          this._curViewport = null;
          this._curScissor = null;
          this._curLineWidth = null;
          this._curDepthBias = null;
          this._curBlendConstants.length = 0;
          this._curDepthBounds = null;
          this._curStencilWriteMask = null;
          this._curStencilCompareMask = null;
          this._numDrawCalls = 0;
          this._numDispatches = 0;
          this._numInstances = 0;
          this._numTris = 0;
          this._computeFuncQueue.length = 0;
        }
        end() {
          this._isStateValid = false;
          this._isInRenderPass = false;
          this._computeFuncQueue.length = 0;
        }
        beginRenderPass(renderPass, framebuffer, renderArea, clearColors, clearDepth, clearStencil) {
          var _this$_wgpuRenderPass;
          const device = WebGPUDeviceManager.instance;
          const gpuDevice = device;
          this._wgpuRenderPass = renderPass;
          const nativePassDesc = this._nativePassDesc = this._wgpuRenderPass.gpuRenderPass.nativeRenderPass;
          const originalRP = this._wgpuRenderPass.gpuRenderPass.originalRP;
          const gpuFramebuffer = framebuffer.gpuFramebuffer;
          renderAreas.push(renderArea);
          let needPartialClear = false;
          samples = 1;
          const renderingFullScreen = gpuFramebuffer.gpuColorTextures.every(val => {
            if (renderArea.x !== 0 || renderArea.y !== 0 || renderArea.width !== val.width || renderArea.height !== val.height) {
              return false;
            }
            return true;
          });
          const swapchain = gpuDevice.getSwapchains()[0];
          const clearColorSize = clearColors.length;
          for (let i = 0; i < clearColorSize; i++) {
            let colorTex = swapchain.colorGPUTextureView;
            let currGPUTex;
            if (gpuFramebuffer.isOffscreen) {
              currGPUTex = gpuFramebuffer.gpuColorTextures[i];
              colorTex = currGPUTex.getTextureView();
            }
            colorTex.label = gpuFramebuffer.isOffscreen ? 'offscreen' : 'swapchain';
            if (!renderingFullScreen) {
              needPartialClear = originalRP.colorAttachments[i].loadOp === 'clear';
              if (renderAreas.length > 1) {
                nativePassDesc.colorAttachments[i].loadOp = 'load';
              }
            }
            nativePassDesc.colorAttachments[i].view = colorTex;
            if (currGPUTex && currGPUTex.resolveTex) {
              samples = currGPUTex.samples;
              nativePassDesc.colorAttachments[i].resolveTarget = currGPUTex.resolveTex.gpuTexture.createView();
            }
            nativePassDesc.colorAttachments[i].clearValue = [clearColors[i].x, clearColors[i].y, clearColors[i].z, clearColors[i].w];
          }
          if (((_this$_wgpuRenderPass = this._wgpuRenderPass.depthStencilAttachment) == null ? void 0 : _this$_wgpuRenderPass.format) !== Format.UNKNOWN) {
            var _gpuFramebuffer$gpuDe;
            const tex = (_gpuFramebuffer$gpuDe = gpuFramebuffer.gpuDepthStencilTexture) == null ? void 0 : _gpuFramebuffer$gpuDe.gpuTexture;
            const depthTex = tex ? tex.createView() : swapchain.gpuDepthStencilTextureView;
            const depthStencilAttachment = nativePassDesc.depthStencilAttachment;
            depthStencilAttachment.view = depthTex;
            depthStencilAttachment.depthClearValue = clearDepth;
            depthStencilAttachment.stencilClearValue = clearStencil;
          }
          renderArea.x = Math.floor(renderArea.x);
          renderArea.y = Math.floor(renderArea.y);
          renderArea.width = Math.floor(renderArea.width);
          renderArea.height = Math.floor(renderArea.height);
          const vpfunc = passEncoder => {
            passEncoder.setViewport(renderArea.x, renderArea.y, renderArea.width, renderArea.height, 0.0, 1.0);
          };
          const srfunc = passEncoder => {
            passEncoder.setScissorRect(renderArea.x, renderArea.y, renderArea.width, renderArea.height);
          };
          this._renderPassFuncQueue.push(vpfunc);
          this._renderPassFuncQueue.push(srfunc);
          if (!renderingFullScreen && needPartialClear) {
            let idx = 0;
            gpuFramebuffer.gpuColorTextures.forEach(tex => {
              clearRect(device, tex, renderArea, clearColors[idx]);
              idx++;
            });
          }
          this._isInRenderPass = true;
        }
        endRenderPass() {
          const device = WebGPUDeviceManager.instance;
          const nativeDevice = device.nativeDevice;
          const cmdEncoder = nativeDevice.createCommandEncoder();
          const passEncoder = cmdEncoder.beginRenderPass(this._nativePassDesc);
          this._renderPassFuncQueue.forEach(cb => {
            cb(passEncoder);
          });
          passEncoder.end();
          nativeDevice == null || nativeDevice.queue.submit([cmdEncoder.finish()]);
          let idx = 0;
          for (const attachment of this._nativePassDesc.colorAttachments) {
            attachment.loadOp = this._wgpuRenderPass.gpuRenderPass.originalRP.colorAttachments[idx].loadOp;
            idx++;
          }
          this._isInRenderPass = false;
          this._isStateValid = false;
          this._renderPassFuncQueue.length = 0;
        }
        bindPipelineState(pipelineState) {
          const webgpuPipelineState = pipelineState;
          const gpuPipelineState = webgpuPipelineState.gpuPipelineState;
          if (gpuPipelineState !== this._curGPUPipelineState) {
            this._curWebGPUPipelineState = webgpuPipelineState;
            this._curGPUPipelineState = gpuPipelineState;
            currPipelineState = webgpuPipelineState;
            this._isStateValid = true;
          }
        }
        bindDescriptorSet(set, descriptorSet, dynamicOffsets) {
          const gpuDescriptorSets = descriptorSet.gpuDescriptorSet;
          if (gpuDescriptorSets !== this._curGPUDescriptorSets[set]) {
            this._curGPUDescriptorSets[set] = gpuDescriptorSets;
            descriptorSets[set] = descriptorSet;
            this._isStateValid = true;
          }
          if (dynamicOffsets && dynamicOffsets.length) {
            const offsets = this._curDynamicOffsets[set];
            const dynamicOffsetSize = dynamicOffsets.length;
            for (let i = 0; i < dynamicOffsetSize; i++) offsets[i] = dynamicOffsets[i];
            offsets.length = dynamicOffsetSize;
            this._isStateValid = true;
          }
        }
        bindInputAssembler(inputAssembler) {
          const gpuInputAssembler = inputAssembler.gpuInputAssembler;
          this._curGPUInputAssembler = gpuInputAssembler;
          this._isStateValid = true;
        }
        setViewport(viewport) {
          viewport.left = Math.floor(viewport.left);
          viewport.top = Math.floor(viewport.top);
          viewport.width = Math.floor(viewport.width);
          viewport.height = Math.floor(viewport.height);
          viewport.minDepth = Math.floor(viewport.minDepth);
          viewport.maxDepth = Math.floor(viewport.maxDepth);
          this._curViewport = new Viewport(viewport.left, viewport.top, viewport.width, viewport.height, viewport.minDepth, viewport.maxDepth);
          const vpfunc = passEncoder => {
            passEncoder.setViewport(viewport.left, viewport.top, viewport.width, viewport.height, viewport.minDepth, viewport.maxDepth);
          };
          this._renderPassFuncQueue.push(vpfunc);
          this._isStateValid = true;
        }
        setScissor(scissor) {
          scissor.x = Math.floor(scissor.x);
          scissor.y = Math.floor(scissor.y);
          scissor.width = Math.floor(scissor.width);
          scissor.height = Math.floor(scissor.height);
          const srfunc = passEncoder => {
            passEncoder.setScissorRect(scissor.x, scissor.y, scissor.width, scissor.height);
          };
          this._renderPassFuncQueue.push(srfunc);
          this._isStateValid = true;
        }
        setLineWidth(lineWidth) {
          error('line width not supproted by webGPU');
        }
        setDepthBias(depthBiasConstantFactor, depthBiasClamp, depthBiasSlopeFactor) {
          if (!this._curDepthBias) {
            this._curDepthBias = {
              constantFactor: depthBiasConstantFactor,
              clamp: depthBiasClamp,
              slopeFactor: depthBiasSlopeFactor
            };
            this._isStateValid = true;
          } else if (this._curDepthBias.constantFactor !== depthBiasConstantFactor || this._curDepthBias.clamp !== depthBiasClamp || this._curDepthBias.slopeFactor !== depthBiasSlopeFactor) {
            this._curDepthBias.constantFactor = depthBiasConstantFactor;
            this._curDepthBias.clamp = depthBiasClamp;
            this._curDepthBias.slopeFactor = depthBiasSlopeFactor;
            this._isStateValid = true;
          }
        }
        setBlendConstants(blendConstants) {
          if (this._curBlendConstants[0] !== blendConstants.x || this._curBlendConstants[1] !== blendConstants.y || this._curBlendConstants[2] !== blendConstants.z || this._curBlendConstants[3] !== blendConstants.w) {
            this._curBlendConstants.length = 0;
            Array.prototype.push.apply(this._curBlendConstants, [blendConstants.x, blendConstants.y, blendConstants.z, blendConstants.w]);
            this._isStateValid = true;
          }
        }
        setDepthBound(minDepthBounds, maxDepthBounds) {
          if (!this._curDepthBounds) {
            this._curDepthBounds = {
              minBounds: minDepthBounds,
              maxBounds: maxDepthBounds
            };
            this._isStateValid = true;
          } else if (this._curDepthBounds.minBounds !== minDepthBounds || this._curDepthBounds.maxBounds !== maxDepthBounds) {
            this._curDepthBounds = {
              minBounds: minDepthBounds,
              maxBounds: maxDepthBounds
            };
            this._isStateValid = true;
          }
        }
        setStencilWriteMask(face, writeMask) {
          if (!this._curStencilWriteMask) {
            this._curStencilWriteMask = {
              face,
              writeMask
            };
            this._isStateValid = true;
          } else if (this._curStencilWriteMask.face !== face || this._curStencilWriteMask.writeMask !== writeMask) {
            this._curStencilWriteMask.face = face;
            this._curStencilWriteMask.writeMask = writeMask;
            this._isStateValid = true;
          }
        }
        setStencilCompareMask(face, reference, compareMask) {
          if (!this._curStencilCompareMask) {
            this._curStencilCompareMask = {
              face,
              reference,
              compareMask
            };
            this._isStateValid = true;
          } else if (this._curStencilCompareMask.face !== face || this._curStencilCompareMask.reference !== reference || this._curStencilCompareMask.compareMask !== compareMask) {
            this._curStencilCompareMask.face = face;
            this._curStencilCompareMask.reference = reference;
            this._curStencilCompareMask.compareMask = compareMask;
            this._isStateValid = true;
          }
        }
        draw(inputAssembler) {
          const device = WebGPUDeviceManager.instance;
          if (this._type === CommandBufferType.PRIMARY && !this._isInRenderPass) {
            errorID(16328);
            return;
          }
          if (this._isStateValid) {
            this.bindStates();
          }
          const ia = inputAssembler;
          const iaData = ia.gpuInputAssembler;
          const nativeDevice = device;
          if (ia.indirectBuffer) {
            const indirectBuffer = iaData.gpuIndirectBuffer;
            if (nativeDevice.multiDrawIndirectSupport) {
              // not support yet
            } else {
              var _iaData$gpuIndirectBu;
              const drawInfoCount = (_iaData$gpuIndirectBu = iaData.gpuIndirectBuffer) == null ? void 0 : _iaData$gpuIndirectBu.indirects.length;
              if (indirectBuffer.drawIndirectByIndex) {
                const drawFunc = passEncoder => {
                  const drawInfoSize = Object.keys(DrawInfo).length;
                  for (let i = 0; i < drawInfoCount; i++) {
                    passEncoder == null || passEncoder.drawIndexedIndirect(indirectBuffer.gpuBuffer, indirectBuffer.gpuOffset + i * drawInfoSize);
                  }
                };
                this._renderPassFuncQueue.push(drawFunc);
              } else {
                // FIXME: draw IndexedIndirect and Indirect by different buffer
                const drawFunc = passEncoder => {
                  const drawInfoSize = Object.keys(DrawInfo).length;
                  for (let i = 0; i < drawInfoCount; i++) {
                    passEncoder == null || passEncoder.drawIndirect(indirectBuffer.gpuBuffer, indirectBuffer.gpuOffset + i * drawInfoSize);
                  }
                };
                this._renderPassFuncQueue.push(drawFunc);
              }
            }
          } else {
            const instanceCount = inputAssembler.instanceCount > 0 ? inputAssembler.instanceCount : 1;
            const drawByIndex = inputAssembler.indexBuffer && ia.indexCount > 0;
            if (drawByIndex) {
              const drawFunc = passEncoder => {
                const instanceCount = Math.max(ia.instanceCount, 1);
                passEncoder == null || passEncoder.drawIndexed(ia.indexCount, instanceCount, ia.firstIndex, ia.firstVertex, ia.firstInstance);
              };
              this._renderPassFuncQueue.push(drawFunc);
            } else {
              const drawFunc = passEncoder => {
                const instanceCount = Math.max(ia.instanceCount, 1);
                passEncoder == null || passEncoder.draw(ia.vertexCount, instanceCount, ia.firstVertex, ia.firstInstance);
              };
              this._renderPassFuncQueue.push(drawFunc);
            }
          }
          ++this._numDrawCalls;
          this._numInstances += inputAssembler.instanceCount;
          const indexCount = inputAssembler.indexCount || inputAssembler.vertexCount;
          if (this._curGPUPipelineState) {
            const gpuPrimitive = this._curGPUPipelineState.gpuPrimitive;
            switch (gpuPrimitive) {
              case 'triangle-strip':
                this._numTris += (indexCount - 2) * Math.max(inputAssembler.instanceCount, 1);
                break;
              case 'triangle-list':
                {
                  this._numTris += indexCount / 3 * Math.max(inputAssembler.instanceCount, 1);
                  break;
                }
              default:
                break;
            }
          }
        }
        updateBuffer(buffer, data, offset, size) {
          if (this._type === CommandBufferType.PRIMARY && this._isInRenderPass) {
            errorID(16329);
            return;
          }
          const gpuBuffer = buffer.gpuBuffer;
          if (!gpuBuffer) {
            return;
          }
          const cmd = this._webGPUAllocator.updateBufferCmdPool.alloc(WebGPUCmdUpdateBuffer);
          let buffSize = 0;
          let buff = null;

          // TODO: Have to copy to staging buffer first to make this work for the execution is deferred.
          // But since we are using specialized primary command buffers in WebGL backends, we leave it as is for now
          if (buffer.usage & BufferUsageBit.INDIRECT) {
            buff = data;
          } else {
            if (size !== undefined) {
              buffSize = size;
            } else {
              buffSize = data.byteLength;
            }
            buff = data;
          }
          const device = WebGPUDeviceManager.instance;
          const nativeDevice = device.nativeDevice;
          nativeDevice == null || nativeDevice.queue.writeBuffer(gpuBuffer.gpuBuffer, gpuBuffer.gpuOffset, buff);
        }
        copyBuffersToTexture(buffers, texture, regions) {
          if (this._type === CommandBufferType.PRIMARY && this._isInRenderPass) {
            errorID(16330);
            return;
          }
          const gpuTexture = texture.gpuTexture;
          if (!gpuTexture) {
            return;
          }
          const cmd = this._webGPUAllocator.copyBufferToTextureCmdPool.alloc(WebGPUCmdCopyBufferToTexture);
          cmd.gpuTexture = gpuTexture;
          cmd.regions = regions;
          cmd.buffers = buffers;
          this.cmdPackage.copyBufferToTextureCmds.push(cmd);
          this.cmdPackage.cmds.push(WebGPUCmd.COPY_BUFFER_TO_TEXTURE);
        }
        execute(cmdBuffs, count) {
          for (let i = 0; i < count; ++i) {
            const WebGPUCmdBuff = cmdBuffs[i];
            const cmdPackage = WebGPUCmdBuff.cmdPackage;
            const rpLength = cmdPackage.beginRenderPassCmds.length;
            for (let c = 0; c < rpLength; ++c) {
              const cmd = cmdPackage.beginRenderPassCmds.array[c];
              ++cmd.refCount;
              this.cmdPackage.beginRenderPassCmds.push(cmd);
            }
            const bindStatesCmds = cmdPackage.bindStatesCmds;
            const stateCmdCount = bindStatesCmds.length;
            for (let c = 0; c < stateCmdCount; ++c) {
              const cmd = bindStatesCmds.array[c];
              ++cmd.refCount;
              this.cmdPackage.bindStatesCmds.push(cmd);
            }
            const drawCmds = cmdPackage.drawCmds;
            const drawCmdCount = drawCmds.length;
            for (let c = 0; c < drawCmdCount; ++c) {
              const cmd = drawCmds.array[c];
              ++cmd.refCount;
              this.cmdPackage.drawCmds.push(cmd);
            }
            const updateBufferCmdCount = cmdPackage.updateBufferCmds.length;
            for (let c = 0; c < updateBufferCmdCount; ++c) {
              const cmd = cmdPackage.updateBufferCmds.array[c];
              ++cmd.refCount;
              this.cmdPackage.updateBufferCmds.push(cmd);
            }
            const copyBufferTexCmdCount = cmdPackage.copyBufferToTextureCmds.length;
            for (let c = 0; c < copyBufferTexCmdCount; ++c) {
              const cmd = cmdPackage.copyBufferToTextureCmds.array[c];
              ++cmd.refCount;
              this.cmdPackage.copyBufferToTextureCmds.push(cmd);
            }
            this.cmdPackage.cmds.concat(cmdPackage.cmds.array);
            this._numDrawCalls += WebGPUCmdBuff._numDrawCalls;
            this._numDispatches += WebGPUCmdBuff._numDispatches;
            this._numInstances += WebGPUCmdBuff._numInstances;
            this._numTris += WebGPUCmdBuff._numTris;
          }
        }
        _prepareDescriptorSets() {
          var _currPipelineState;
          const wgpuPipLayout = (_currPipelineState = currPipelineState) == null ? void 0 : _currPipelineState.pipelineLayout;
          const device = WebGPUDeviceManager.instance;
          for (let i = 0; i < groupSets.length; i++) {
            const currSetIdx = groupSets[i];
            const currDesc = descriptorSets[currSetIdx];
            if (currDesc && currDesc.gpuDescriptorSet) {
              // prepare() builds the bind group if it was never created, or rebuilds it on resource change.
              currDesc.prepare();
            } else {
              const currLayout = wgpuPipLayout.setLayouts[currSetIdx];
              const currLayoutInfo = new DescriptorSetInfo(currLayout);
              const newDescSet = device.createDescriptorSet(currLayoutInfo);
              descriptorSets[currSetIdx] = newDescSet;
              newDescSet.prepare(true);
            }
          }
        }

        /**
         * Collect the bind groups and dynamic offsets for the currently bound descriptor sets.
         * Shared by the draw (bindStates) and compute (dispatch) paths.
         */
        _collectBindGroups() {
          const currGPUDescSize = groupSets.length;
          const wgpuBindGroups = new Array(currGPUDescSize);
          const wgpuDynOffsets = new Array(currGPUDescSize);
          for (let i = 0; i < currGPUDescSize; i++) {
            const currSetIdx = groupSets[i];
            const descObj = descriptorSets[currSetIdx];
            const curGpuDesc = descObj.gpuDescriptorSet;
            wgpuBindGroups[currSetIdx] = curGpuDesc.bindGroup;
            wgpuDynOffsets[currSetIdx] = [...this._curDynamicOffsets[currSetIdx]];
            if (!descObj.dynamicOffsetCount) {
              wgpuDynOffsets[currSetIdx] = [];
            } else if (descObj.dynamicOffsetCount !== wgpuDynOffsets[currSetIdx].length) {
              wgpuDynOffsets[currSetIdx].length = descObj.dynamicOffsetCount;
              for (let j = 0; j < descObj.dynamicOffsetCount; j++) {
                const currOffset = wgpuDynOffsets[currSetIdx][j];
                if (!currOffset) {
                  wgpuDynOffsets[currSetIdx][j] = 0;
                } else {
                  const currBind = descObj.dynamicOffsets[j];
                  const bindObj = descObj.gpuDescriptorSet.gpuDescriptors[currBind];
                  if (bindObj && bindObj.gpuBuffer && currOffset > bindObj.gpuBuffer.gpuBuffer.size) {
                    wgpuDynOffsets[currSetIdx][j] = 0;
                  }
                }
              }
            }
          }
          return {
            wgpuBindGroups,
            wgpuDynOffsets
          };
        }
        dispatch(info) {
          if (!this._curGPUPipelineState) {
            return;
          }
          // Prepare descriptor sets (same logic as bindStates)
          this._prepareDescriptorSets();

          // Create compute pipeline
          this._curWebGPUPipelineState.prepare(null);
          const computePipeline = this._curGPUPipelineState.nativePipeline;

          // Build bind groups for compute pass
          const {
            wgpuBindGroups,
            wgpuDynOffsets
          } = this._collectBindGroups();
          const func = passEncoder => {
            passEncoder.setPipeline(computePipeline);
            const gpuBindGroupSize = wgpuBindGroups.length;
            for (let i = 0; i < gpuBindGroupSize; i++) {
              passEncoder.setBindGroup(i, wgpuBindGroups[i], wgpuDynOffsets[i]);
            }
            passEncoder.dispatchWorkgroups(info.groupCountX, info.groupCountY, info.groupCountZ);
          };
          this._computeFuncQueue.push(func);
          ++this._numDispatches;
          this._isStateValid = false;
        }
        submitComputePass() {
          if (this._computeFuncQueue.length === 0) {
            return;
          }
          const device = WebGPUDeviceManager.instance;
          const nativeDevice = device.nativeDevice;
          const cmdEncoder = nativeDevice.createCommandEncoder();
          const computePassEncoder = cmdEncoder.beginComputePass();
          this._computeFuncQueue.forEach(cb => {
            cb(computePassEncoder);
          });
          computePassEncoder.end();
          nativeDevice.queue.submit([cmdEncoder.finish()]);
          this._computeFuncQueue.length = 0;
        }
        bindStates() {
          if (!this._curGPUPipelineState) {
            return;
          }
          const gpuPipelineLayout = this._curGPUPipelineState.gpuPipelineLayout;
          this._prepareDescriptorSets();
          const gpuIA = this._curGPUInputAssembler;
          // only 4x MSAA is supported
          gpuIA.samples = samples > 1 ? 4 : 1;
          this._curWebGPUPipelineState.prepare(gpuIA);
          // ----------------------------wgpu pipline state-----------------------------
          const wgpuPipeline = this._curGPUPipelineState.nativePipeline;
          const pplFunc = passEncoder => {
            passEncoder.setPipeline(wgpuPipeline);
          };
          this._renderPassFuncQueue.push(pplFunc);
          const pipelineDesc = this._curGPUPipelineState.pipelineState;
          if (pipelineDesc && 'depthStencil' in pipelineDesc && pipelineDesc.depthStencil) {
            const stencilRef = this._curGPUPipelineState.stencilRef;
            const stencilRefFunc = passEncoder => {
              passEncoder.setStencilReference(stencilRef);
            };
            this._renderPassFuncQueue.push(stencilRefFunc);
          }
          const {
            wgpuBindGroups,
            wgpuDynOffsets
          } = this._collectBindGroups();
          const bgfunc = passEncoder => {
            const gpuBindGroupSize = wgpuBindGroups.length;
            for (let i = 0; i < gpuBindGroupSize; i++) {
              // FIXME: this is a special sentence that 2 in 3 parameters I'm not certain.
              passEncoder.setBindGroup(i, wgpuBindGroups[i], wgpuDynOffsets[i]);
            }
          };
          this._renderPassFuncQueue.push(bgfunc);

          // ---------------------------- wgpu input assembly  -----------------------------
          const ia = gpuIA;
          const wgpuVertexBuffers = new Array(ia.gpuVertexBuffers.length);
          const gpuVertBuffSize = ia.gpuVertexBuffers.length;
          for (let i = 0; i < gpuVertBuffSize; i++) {
            wgpuVertexBuffers[i] = {
              slot: i,
              buffer: ia.gpuVertexBuffers[i].gpuBuffer,
              offset: ia.gpuVertexBuffers[i].gpuOffset
            };
          }
          const vbFunc = passEncoder => {
            const vertBuffSize = wgpuVertexBuffers.length;
            for (let i = 0; i < vertBuffSize; i++) {
              passEncoder.setVertexBuffer(wgpuVertexBuffers[i].slot, wgpuVertexBuffers[i].buffer, wgpuVertexBuffers[i].offset);
            }
          };
          this._renderPassFuncQueue.push(vbFunc);
          if (ia.gpuIndexBuffer) {
            const wgpuIndexBuffer = {
              indexType: ia.gpuIndexType,
              buffer: ia.gpuIndexBuffer.gpuBuffer,
              offset: ia.gpuIndexBuffer.gpuOffset,
              size: ia.gpuIndexBuffer.size
            };
            const ibFunc = passEncoder => {
              passEncoder.setIndexBuffer(wgpuIndexBuffer.buffer, wgpuIndexBuffer.indexType, wgpuIndexBuffer.offset, wgpuIndexBuffer.size);
            };
            this._renderPassFuncQueue.push(ibFunc);
          }
          const bcFunc = passEncoder => {
            passEncoder.setBlendConstant([this._curBlendConstants[0], this._curBlendConstants[1], this._curBlendConstants[2], this._curBlendConstants[3]]);
          };
          if (this._curBlendConstants.length) this._renderPassFuncQueue.push(bcFunc);
          this._isStateValid = false;
        }
      });
    }
  };
});