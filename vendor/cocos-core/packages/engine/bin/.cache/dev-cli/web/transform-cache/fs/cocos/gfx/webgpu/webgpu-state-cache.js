System.register("q-bundled:///fs/cocos/gfx/webgpu/webgpu-state-cache.js", ["../base/define.js", "../base/pipeline-state.js"], function (_export, _context) {
  "use strict";

  var Rect, Viewport, BlendState, DepthStencilState, RasterizerState, WebGPUStateCache;
  _export("WebGPUStateCache", void 0);
  return {
    setters: [function (_baseDefineJs) {
      Rect = _baseDefineJs.Rect;
      Viewport = _baseDefineJs.Viewport;
    }, function (_basePipelineStateJs) {
      BlendState = _basePipelineStateJs.BlendState;
      DepthStencilState = _basePipelineStateJs.DepthStencilState;
      RasterizerState = _basePipelineStateJs.RasterizerState;
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
      _export("WebGPUStateCache", WebGPUStateCache = class WebGPUStateCache {
        constructor() {
          this.gpuArrayBuffer = null;
          this.gpuElementArrayBuffer = null;
          this.gpuUniformBuffer = null;
          this.gpuBindUBOs = [];
          this.gpuBindUBOOffsets = [];
          this.texUnit = 0;
          this.gpuTexUnits = [];
          this.gpuSamplerUnits = [];
          this.gpuFramebuffer = null;
          this.gpuReadFramebuffer = null;
          this.gpuInputAssembler = null;
          this.viewport = new Viewport();
          this.scissorRect = new Rect(0, 0, 0, 0);
          this.rs = new RasterizerState();
          this.dss = new DepthStencilState();
          this.bs = new BlendState();
          this.gpuEnabledAttribLocs = [];
          this.gpuCurrentAttribLocs = [];
          this.texUnitCacheMap = {};
        }
        initialize(texUnit, bufferBindings, vertexAttributes) {
          for (let i = 0; i < texUnit; ++i) this.gpuTexUnits.push({
            gpuTexture: null
          });
          this.gpuSamplerUnits.length = texUnit;
          this.gpuSamplerUnits.fill(null);
          this.gpuBindUBOs.length = bufferBindings;
          this.gpuBindUBOs.fill(null);
          this.gpuBindUBOOffsets.length = bufferBindings;
          this.gpuBindUBOOffsets.fill(0);
          this.gpuEnabledAttribLocs.length = vertexAttributes;
          this.gpuEnabledAttribLocs.fill(false);
          this.gpuCurrentAttribLocs.length = vertexAttributes;
          this.gpuCurrentAttribLocs.fill(false);
        }
      });
    }
  };
});