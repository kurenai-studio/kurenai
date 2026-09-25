System.register("q-bundled:///fs/cocos/gfx/webgpu/override.js", ["../../../../virtual/internal%253Aconstants.js", "../../webgpu/instantiated.js"], function (_export, _context) {
  "use strict";

  var WEBGPU, gfx, promiseForWebGPUInstantiation, Device, WebGPUDevice, Queue, Swapchain, Buffer, Texture, Shader, Sampler, InputAssembler, RenderPass, Framebuffer, DescriptorSet, DescriptorSetLayout, PipelineLayout, PipelineState, CommandBuffer, GeneralBarrier, TextureBarrier, BufferBarrier;
  _export({
    Device: void 0,
    WebGPUDevice: void 0,
    Queue: void 0,
    Swapchain: void 0,
    Buffer: void 0,
    Texture: void 0,
    Shader: void 0,
    Sampler: void 0,
    InputAssembler: void 0,
    RenderPass: void 0,
    Framebuffer: void 0,
    DescriptorSet: void 0,
    DescriptorSetLayout: void 0,
    PipelineLayout: void 0,
    PipelineState: void 0,
    CommandBuffer: void 0,
    GeneralBarrier: void 0,
    TextureBarrier: void 0,
    BufferBarrier: void 0
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      WEBGPU = _virtualInternal253AconstantsJs.WEBGPU;
    }, function (_webgpuInstantiatedJs) {
      gfx = _webgpuInstantiatedJs.gfx;
      promiseForWebGPUInstantiation = _webgpuInstantiatedJs.promiseForWebGPUInstantiation;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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

      /* eslint-disable @typescript-eslint/no-unused-expressions */
      /* eslint-disable import/no-mutable-exports */

      WEBGPU && promiseForWebGPUInstantiation.then(() => {
        _export("Device", Device = gfx.CCWGPUDevice);
        _export("WebGPUDevice", WebGPUDevice = gfx.CCWGPUDevice);
        _export("Queue", Queue = gfx.CCWGPUQueue);
        _export("Swapchain", Swapchain = gfx.CCWGPUSwapchain);
        _export("Buffer", Buffer = gfx.CCWGPUBuffer);
        _export("Texture", Texture = gfx.CCWGPUTexture);
        _export("Shader", Shader = gfx.CCWGPUShader);
        _export("Sampler", Sampler = gfx.CCWGPUSampler);
        _export("InputAssembler", InputAssembler = gfx.CCWGPUInputAssembler);
        _export("RenderPass", RenderPass = gfx.CCWGPURenderPass);
        _export("Framebuffer", Framebuffer = gfx.CCWGPUFramebuffer);
        _export("DescriptorSet", DescriptorSet = gfx.CCWGPUDescriptorSet);
        _export("DescriptorSetLayout", DescriptorSetLayout = gfx.CCWGPUDescriptorSetLayout);
        _export("PipelineLayout", PipelineLayout = gfx.CCWGPUPipelineLayout);
        _export("PipelineState", PipelineState = gfx.CCWGPUPipelineState);
        _export("CommandBuffer", CommandBuffer = gfx.CCWGPUCommandBuffer);
        _export("GeneralBarrier", GeneralBarrier = gfx.WGPUGeneralBarrier);
        _export("TextureBarrier", TextureBarrier = gfx.WGPUTextureBarrier);
        _export("BufferBarrier", BufferBarrier = gfx.WGPUBufferBarrier);

        // immutable excluded
        [Device, Queue, Swapchain, Buffer, Texture, Shader, InputAssembler, RenderPass, Framebuffer, DescriptorSet, DescriptorSetLayout, PipelineState, CommandBuffer].forEach(ele => {
          const oldDestroy = ele.prototype.destroy;
          ele.prototype.destroy = function () {
            oldDestroy.call(this);
            this.delete();
          };
        });
      });
    }
  };
});