System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-command-buffer.js", ["../base/command-buffer.js", "../base/define.js", "./webgl2-define.js", "../../core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var CommandBuffer, StencilFace, DynamicStates, WebGL2DeviceManager, errorID, WebGL2CommandBuffer;
  _export("WebGL2CommandBuffer", void 0);
  return {
    setters: [function (_baseCommandBufferJs) {
      CommandBuffer = _baseCommandBufferJs.CommandBuffer;
    }, function (_baseDefineJs) {
      StencilFace = _baseDefineJs.StencilFace;
      DynamicStates = _baseDefineJs.DynamicStates;
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
      /** @mangle */
      _export("WebGL2CommandBuffer", WebGL2CommandBuffer = class WebGL2CommandBuffer extends CommandBuffer {
        constructor() {
          super();
          this._isInRenderPass = false;
          this._curGPUPipelineState = null;
          this._curGPUDescriptorSets = [];
          this._curGPUInputAssembler = null;
          this._curDynamicOffsets = Array(8).fill(0);
          this._curDynamicStates = new DynamicStates();
          this._isStateInvalid = false;
        }
        initialize(info) {
          this._type = info.type;
          this._queue = info.queue;
          const setCount = WebGL2DeviceManager.instance.bindingMappings.blockOffsets.length;
          for (let i = 0; i < setCount; i++) {
            this._curGPUDescriptorSets.push(null);
          }
        }
        destroy() {}
        begin(renderPass, subpass, frameBuffer) {
          this._curGPUPipelineState = null;
          this._curGPUInputAssembler = null;
          this._curGPUDescriptorSets.length = 0;
          this._numDrawCalls = 0;
          this._numInstances = 0;
          this._numTris = 0;
        }
        end() {
          if (this._isStateInvalid) {
            this.bindStates();
          }
          this._isInRenderPass = false;
        }
        beginRenderPass(renderPass, framebuffer, renderArea, clearColors, clearDepth, clearStencil) {
          errorID(16401);
          this._isInRenderPass = true;
        }
        endRenderPass() {
          this._isInRenderPass = false;
        }
        bindPipelineState(pipelineState) {
          const gpuPipelineState = pipelineState.gpuPipelineState;
          if (gpuPipelineState !== this._curGPUPipelineState) {
            this._curGPUPipelineState = gpuPipelineState;
            this._isStateInvalid = true;
          }
        }
        bindDescriptorSet(set, descriptorSet, dynamicOffsets) {
          const gpuDescriptorSets = descriptorSet.gpuDescriptorSet;
          if (gpuDescriptorSets !== this._curGPUDescriptorSets[set]) {
            this._curGPUDescriptorSets[set] = gpuDescriptorSets;
            this._isStateInvalid = true;
          }
          if (dynamicOffsets) {
            var _this$_curGPUPipeline;
            const gpuPipelineLayout = (_this$_curGPUPipeline = this._curGPUPipelineState) == null ? void 0 : _this$_curGPUPipeline.gpuPipelineLayout;
            if (gpuPipelineLayout) {
              const offsets = this._curDynamicOffsets;
              const idx = gpuPipelineLayout.dynamicOffsetOffsets[set];
              for (let i = 0; i < dynamicOffsets.length; i++) offsets[idx + i] = dynamicOffsets[i];
              this._isStateInvalid = true;
            }
          }
        }
        bindInputAssembler(inputAssembler) {
          const gpuInputAssembler = inputAssembler.gpuInputAssembler;
          this._curGPUInputAssembler = gpuInputAssembler;
          this._isStateInvalid = true;
        }
        setViewport(viewport) {
          const cache = this._curDynamicStates.viewport;
          if (cache.left !== viewport.left || cache.top !== viewport.top || cache.width !== viewport.width || cache.height !== viewport.height || cache.minDepth !== viewport.minDepth || cache.maxDepth !== viewport.maxDepth) {
            cache.left = viewport.left;
            cache.top = viewport.top;
            cache.width = viewport.width;
            cache.height = viewport.height;
            cache.minDepth = viewport.minDepth;
            cache.maxDepth = viewport.maxDepth;
            this._isStateInvalid = true;
          }
        }
        setScissor(scissor) {
          const cache = this._curDynamicStates.scissor;
          if (cache.x !== scissor.x || cache.y !== scissor.y || cache.width !== scissor.width || cache.height !== scissor.height) {
            cache.x = scissor.x;
            cache.y = scissor.y;
            cache.width = scissor.width;
            cache.height = scissor.height;
            this._isStateInvalid = true;
          }
        }
        setLineWidth(lineWidth) {
          if (this._curDynamicStates.lineWidth !== lineWidth) {
            this._curDynamicStates.lineWidth = lineWidth;
            this._isStateInvalid = true;
          }
        }
        setDepthBias(depthBiasConstantFactor, depthBiasClamp, depthBiasSlopeFactor) {
          const cache = this._curDynamicStates;
          if (cache.depthBiasConstant !== depthBiasConstantFactor || cache.depthBiasClamp !== depthBiasClamp || cache.depthBiasSlope !== depthBiasSlopeFactor) {
            cache.depthBiasConstant = depthBiasConstantFactor;
            cache.depthBiasClamp = depthBiasClamp;
            cache.depthBiasSlope = depthBiasSlopeFactor;
            this._isStateInvalid = true;
          }
        }
        setBlendConstants(blendConstants) {
          const cache = this._curDynamicStates.blendConstant;
          if (cache.x !== blendConstants.x || cache.y !== blendConstants.y || cache.z !== blendConstants.z || cache.w !== blendConstants.w) {
            cache.copy(blendConstants);
            this._isStateInvalid = true;
          }
        }
        setDepthBound(minDepthBounds, maxDepthBounds) {
          const cache = this._curDynamicStates;
          if (cache.depthMinBounds !== minDepthBounds || cache.depthMaxBounds !== maxDepthBounds) {
            cache.depthMinBounds = minDepthBounds;
            cache.depthMaxBounds = maxDepthBounds;
            this._isStateInvalid = true;
          }
        }
        setStencilWriteMask(face, writeMask) {
          const front = this._curDynamicStates.stencilStatesFront;
          const back = this._curDynamicStates.stencilStatesBack;
          if (face & StencilFace.FRONT) {
            if (front.writeMask !== writeMask) {
              front.writeMask = writeMask;
              this._isStateInvalid = true;
            }
          }
          if (face & StencilFace.BACK) {
            if (back.writeMask !== writeMask) {
              back.writeMask = writeMask;
              this._isStateInvalid = true;
            }
          }
        }
        setStencilCompareMask(face, reference, compareMask) {
          const front = this._curDynamicStates.stencilStatesFront;
          const back = this._curDynamicStates.stencilStatesBack;
          if (face & StencilFace.FRONT) {
            if (front.compareMask !== compareMask || front.reference !== reference) {
              front.reference = reference;
              front.compareMask = compareMask;
              this._isStateInvalid = true;
            }
          }
          if (face & StencilFace.BACK) {
            if (back.compareMask !== compareMask || back.reference !== reference) {
              back.reference = reference;
              back.compareMask = compareMask;
              this._isStateInvalid = true;
            }
          }
        }
        draw(infoOrAssembler) {
          errorID(16328);
        }
        updateBuffer(buffer, data, size) {
          errorID(16329);
        }
        copyBuffersToTexture(buffers, texture, regions) {
          errorID(16330);
        }
        execute(cmdBuffs, count) {
          errorID(16402);
        }
        pipelineBarrier(GeneralBarrier, bufferBarriers, buffers, textureBarriers, textures) {}
        bindStates() {
          errorID(16401);
          this._isStateInvalid = false;
        }
        blitTexture(srcTexture, dstTexture, regions, filter) {
          errorID(16401);
        }
      });
    }
  };
});