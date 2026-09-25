System.register("q-bundled:///fs/cocos/gfx/empty/empty-command-buffer.js", ["../base/command-buffer.js"], function (_export, _context) {
  "use strict";

  var CommandBuffer, EmptyCommandBuffer;
  _export("EmptyCommandBuffer", void 0);
  return {
    setters: [function (_baseCommandBufferJs) {
      CommandBuffer = _baseCommandBufferJs.CommandBuffer;
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
      _export("EmptyCommandBuffer", EmptyCommandBuffer = class EmptyCommandBuffer extends CommandBuffer {
        initialize(info) {
          this._type = info.type;
          this._queue = info.queue;
        }
        destroy() {}
        begin(renderPass, subpass, frameBuffer) {}
        end() {}
        beginRenderPass(renderPass, framebuffer, renderArea, clearColors, clearDepth, clearStencil) {}
        endRenderPass() {}
        bindPipelineState(pipelineState) {}
        bindDescriptorSet(set, descriptorSet, dynamicOffsets) {}
        bindInputAssembler(inputAssembler) {}
        setViewport(viewport) {}
        setScissor(scissor) {}
        setLineWidth(lineWidth) {}
        setDepthBias(depthBiasConstantFactor, depthBiasClamp, depthBiasSlopeFactor) {}
        setBlendConstants(blendConstants) {}
        setDepthBound(minDepthBounds, maxDepthBounds) {}
        setStencilWriteMask(face, writeMask) {}
        setStencilCompareMask(face, reference, compareMask) {}
        draw(infoOrAssembler) {}
        updateBuffer(buffer, data, size) {}
        copyBuffersToTexture(buffers, texture, regions) {}
        execute(cmdBuffs, count) {}
        pipelineBarrier(GeneralBarrier, bufferBarriers, buffers, textureBarriers, textures) {}
        blitTexture(srcTexture, dstTexture, regions, filter) {}
      });
    }
  };
});