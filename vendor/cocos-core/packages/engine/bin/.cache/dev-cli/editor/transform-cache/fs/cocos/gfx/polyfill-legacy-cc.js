System.register("q-bundled:///fs/cocos/gfx/polyfill-legacy-cc.js", ["./base/buffer.js", "./base/command-buffer.js", "./base/device.js", "./base/swapchain.js", "./base/framebuffer.js", "./base/input-assembler.js", "./base/descriptor-set.js", "./base/descriptor-set-layout.js", "./base/pipeline-layout.js", "./base/pipeline-state.js", "./base/queue.js", "./base/render-pass.js", "./base/states/sampler.js", "./base/shader.js", "./base/texture.js", "./base/states/general-barrier.js", "./base/states/texture-barrier.js", "./base/states/buffer-barrier.js", "./base/define.js", "../core/global-exports.js"], function (_export, _context) {
  "use strict";

  var Buffer, CommandBuffer, Device, Swapchain, Framebuffer, InputAssembler, DescriptorSet, DescriptorSetLayout, PipelineLayout, PipelineState, PipelineStateInfo, RasterizerState, BlendState, BlendTarget, DepthStencilState, Queue, RenderPass, Sampler, Shader, Texture, GeneralBarrier, TextureBarrier, BufferBarrier, defines, cclegacy, polyfills;
  return {
    setters: [function (_baseBufferJs) {
      Buffer = _baseBufferJs.Buffer;
    }, function (_baseCommandBufferJs) {
      CommandBuffer = _baseCommandBufferJs.CommandBuffer;
    }, function (_baseDeviceJs) {
      Device = _baseDeviceJs.Device;
    }, function (_baseSwapchainJs) {
      Swapchain = _baseSwapchainJs.Swapchain;
    }, function (_baseFramebufferJs) {
      Framebuffer = _baseFramebufferJs.Framebuffer;
    }, function (_baseInputAssemblerJs) {
      InputAssembler = _baseInputAssemblerJs.InputAssembler;
    }, function (_baseDescriptorSetJs) {
      DescriptorSet = _baseDescriptorSetJs.DescriptorSet;
    }, function (_baseDescriptorSetLayoutJs) {
      DescriptorSetLayout = _baseDescriptorSetLayoutJs.DescriptorSetLayout;
    }, function (_basePipelineLayoutJs) {
      PipelineLayout = _basePipelineLayoutJs.PipelineLayout;
    }, function (_basePipelineStateJs) {
      PipelineState = _basePipelineStateJs.PipelineState;
      PipelineStateInfo = _basePipelineStateJs.PipelineStateInfo;
      RasterizerState = _basePipelineStateJs.RasterizerState;
      BlendState = _basePipelineStateJs.BlendState;
      BlendTarget = _basePipelineStateJs.BlendTarget;
      DepthStencilState = _basePipelineStateJs.DepthStencilState;
    }, function (_baseQueueJs) {
      Queue = _baseQueueJs.Queue;
    }, function (_baseRenderPassJs) {
      RenderPass = _baseRenderPassJs.RenderPass;
    }, function (_baseStatesSamplerJs) {
      Sampler = _baseStatesSamplerJs.Sampler;
    }, function (_baseShaderJs) {
      Shader = _baseShaderJs.Shader;
    }, function (_baseTextureJs) {
      Texture = _baseTextureJs.Texture;
    }, function (_baseStatesGeneralBarrierJs) {
      GeneralBarrier = _baseStatesGeneralBarrierJs.GeneralBarrier;
    }, function (_baseStatesTextureBarrierJs) {
      TextureBarrier = _baseStatesTextureBarrierJs.TextureBarrier;
    }, function (_baseStatesBufferBarrierJs) {
      BufferBarrier = _baseStatesBufferBarrierJs.BufferBarrier;
    }, function (_baseDefineJs) {
      defines = _baseDefineJs;
    }, function (_coreGlobalExportsJs) {
      cclegacy = _coreGlobalExportsJs.cclegacy;
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
      polyfills = {
        Device,
        Swapchain,
        Buffer,
        Texture,
        Sampler,
        Shader,
        InputAssembler,
        RenderPass,
        Framebuffer,
        DescriptorSet,
        DescriptorSetLayout,
        PipelineLayout,
        PipelineState,
        CommandBuffer,
        Queue,
        GeneralBarrier,
        TextureBarrier,
        BufferBarrier,
        RasterizerState,
        BlendState,
        BlendTarget,
        DepthStencilState,
        PipelineStateInfo
      };
      Object.assign(polyfills, defines);
      cclegacy.gfx = polyfills;
    }
  };
});