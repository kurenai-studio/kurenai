System.register("q-bundled:///fs/cocos/gfx/index.jsb.js", ["../core/index.js", "./base/define.js", "./base/pipeline-state.js", "./device-manager.js", "./deprecated-3.0.0.js"], function (_export, _context) {
  "use strict";

  var cclegacy, defines, pso, DescriptorSet, Buffer, CommandBuffer, Device, Swapchain, Framebuffer, InputAssembler, DescriptorSetLayout, PipelineLayout, PipelineState, Queue, RenderPass, Shader, Texture, Sampler, GeneralBarrier, TextureBarrier, polyfillCC;
  return {
    setters: [function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_baseDefineJs) {
      defines = _baseDefineJs;
      var _exportObj = {};
      for (var _key in _baseDefineJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _baseDefineJs[_key];
      }
      _export(_exportObj);
    }, function (_basePipelineStateJs) {
      pso = _basePipelineStateJs;
      var _exportObj2 = {};
      for (var _key2 in _basePipelineStateJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _basePipelineStateJs[_key2];
      }
      _export(_exportObj2);
    }, function (_deviceManagerJs) {
      var _exportObj3 = {};
      for (var _key3 in _deviceManagerJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _deviceManagerJs[_key3];
      }
      _export(_exportObj3);
    }, function (_deprecated300Js) {}],
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
      _export("DescriptorSet", DescriptorSet = gfx.DescriptorSet);
      _export("Buffer", Buffer = gfx.Buffer);
      _export("CommandBuffer", CommandBuffer = gfx.CommandBuffer);
      _export("Device", Device = gfx.Device);
      _export("Swapchain", Swapchain = gfx.Swapchain);
      _export("Framebuffer", Framebuffer = gfx.Framebuffer);
      _export("InputAssembler", InputAssembler = gfx.InputAssembler);
      _export("DescriptorSetLayout", DescriptorSetLayout = gfx.DescriptorSetLayout);
      _export("PipelineLayout", PipelineLayout = gfx.PipelineLayout);
      _export("PipelineState", PipelineState = gfx.PipelineState);
      _export("Queue", Queue = gfx.Queue);
      _export("RenderPass", RenderPass = gfx.RenderPass);
      _export("Shader", Shader = gfx.Shader);
      _export("Texture", Texture = gfx.Texture);
      _export("Sampler", Sampler = gfx.Sampler);
      _export("GeneralBarrier", GeneralBarrier = gfx.GeneralBarrier);
      _export("TextureBarrier", TextureBarrier = gfx.TextureBarrier);
      polyfillCC = Object.assign({}, defines);
      polyfillCC.GFXObject = gfx.GFXObject;
      polyfillCC.Device = gfx.Device;
      polyfillCC.Swapchain = gfx.Swapchain;
      polyfillCC.Buffer = gfx.Buffer;
      polyfillCC.Texture = gfx.Texture;
      polyfillCC.Sampler = gfx.Sampler;
      polyfillCC.Shader = gfx.Shader;
      polyfillCC.InputAssembler = gfx.InputAssembler;
      polyfillCC.RenderPass = gfx.RenderPass;
      polyfillCC.Framebuffer = gfx.Framebuffer;
      polyfillCC.DescriptorSet = gfx.DescriptorSet;
      polyfillCC.DescriptorSetLayout = gfx.DescriptorSetLayout;
      polyfillCC.PipelineLayout = gfx.PipelineLayout;
      polyfillCC.PipelineState = gfx.PipelineState;
      polyfillCC.CommandBuffer = gfx.CommandBuffer;
      polyfillCC.Queue = gfx.Queue;
      polyfillCC.GeneralBarrier = gfx.GeneralBarrier;
      polyfillCC.TextureBarrier = gfx.TextureBarrier;
      cclegacy.gfx = polyfillCC;
      polyfillCC.BlendTarget = pso.BlendTarget;
      polyfillCC.BlendState = pso.BlendState;
      polyfillCC.RasterizerState = pso.RasterizerState;
      polyfillCC.DepthStencilState = pso.DepthStencilState;
      polyfillCC.PipelineStateInfo = pso.PipelineStateInfo;
    }
  };
});