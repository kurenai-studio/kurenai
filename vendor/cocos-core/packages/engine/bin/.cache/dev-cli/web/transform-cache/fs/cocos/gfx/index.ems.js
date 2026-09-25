System.register("q-bundled:///fs/cocos/gfx/index.ems.js", ["../core/index.js", "../webgpu/instantiated.js", "./deprecated-3.0.0.js", "./base/pipeline-state.js", "./base/define.js", "./device-manager.js", "./webgpu/override.js", "./webgpu/webgpu-define.js"], function (_export, _context) {
  "use strict";

  var cclegacy, gfx, polyfillCC, WGPU_WASM;
  return {
    setters: [function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_webgpuInstantiatedJs) {
      gfx = _webgpuInstantiatedJs.gfx;
    }, function (_deprecated300Js) {}, function (_basePipelineStateJs) {
      _export({
        BlendState: _basePipelineStateJs.BlendState,
        PipelineStateInfo: _basePipelineStateJs.PipelineStateInfo,
        RasterizerState: _basePipelineStateJs.RasterizerState,
        DepthStencilState: _basePipelineStateJs.DepthStencilState,
        BlendTarget: _basePipelineStateJs.BlendTarget
      });
    }, function (_baseDefineJs) {
      var _exportObj = {};
      for (var _key in _baseDefineJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _baseDefineJs[_key];
      }
      _export(_exportObj);
    }, function (_deviceManagerJs) {
      var _exportObj2 = {};
      for (var _key2 in _deviceManagerJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _deviceManagerJs[_key2];
      }
      _export(_exportObj2);
    }, function (_webgpuOverrideJs) {
      var _exportObj3 = {};
      for (var _key3 in _webgpuOverrideJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _webgpuOverrideJs[_key3];
      }
      _export(_exportObj3);
    }, function (_webgpuWebgpuDefineJs) {
      var _exportObj4 = {};
      for (var _key4 in _webgpuWebgpuDefineJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _webgpuWebgpuDefineJs[_key4];
      }
      _export(_exportObj4);
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
      /**
       * @packageDocumentation
       * @module gfx
       */
      polyfillCC = {
        ...gfx
      };
      polyfillCC.Device = gfx.CCWGPUDevice;
      polyfillCC.Swapchain = gfx.CCWGPUSwapchain;
      polyfillCC.Buffer = gfx.CCWGPUBuffer;
      polyfillCC.Texture = gfx.CCWGPUTexture;
      polyfillCC.Sampler = gfx.CCWGPUSampler;
      polyfillCC.Shader = gfx.CCWGPUShader;
      polyfillCC.InputAssembler = gfx.CCWGPUInputAssembler;
      polyfillCC.RenderPass = gfx.CCWGPURenderPass;
      polyfillCC.Framebuffer = gfx.CCWGPUFramebuffer;
      polyfillCC.DescriptorSet = gfx.CCWGPUDescriptorSet;
      polyfillCC.DescriptorSetLayout = gfx.CCWGPUDescriptorSetLayout;
      polyfillCC.PipelineLayout = gfx.CCWGPUPipelineLayout;
      polyfillCC.PipelineState = gfx.CCWGPUPipelineState;
      polyfillCC.CommandBuffer = gfx.CCWGPUCommandBuffer;
      polyfillCC.Queue = gfx.CCWGPUQueue;
      cclegacy.gfx = polyfillCC;
      _export("WGPU_WASM", WGPU_WASM = true);
      console.log(gfx.Device);
    }
  };
});