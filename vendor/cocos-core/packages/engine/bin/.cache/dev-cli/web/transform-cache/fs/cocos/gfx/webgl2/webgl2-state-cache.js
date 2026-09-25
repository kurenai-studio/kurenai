System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-state-cache.js", ["../base/define.js", "../base/pipeline-state.js"], function (_export, _context) {
  "use strict";

  var Rect, Viewport, BlendState, DepthStencilState, RasterizerState, WebGL2StateCache;
  _export("WebGL2StateCache", void 0);
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
      /** @mangle */
      _export("WebGL2StateCache", WebGL2StateCache = class WebGL2StateCache {
        constructor() {
          this.glArrayBuffer = null;
          this.glElementArrayBuffer = null;
          this.glUniformBuffer = null;
          this.glBindUBOs = [];
          this.glBindUBOOffsets = [];
          this.glVAO = null;
          this.texUnit = 0;
          this.glTexUnits = [];
          this.glSamplerUnits = [];
          this.glRenderbuffer = null;
          this.glFramebuffer = null;
          this.glReadFramebuffer = null;
          this.viewport = new Viewport();
          this.scissorRect = new Rect(0, 0, 0, 0);
          this.rs = new RasterizerState();
          this.dss = new DepthStencilState();
          this.bs = new BlendState();
          this.glProgram = null;
          this.glEnabledAttribLocs = [];
          this.glCurrentAttribLocs = [];
          this.texUnitCacheMap = {};
        }
        initialize(texUnit, bufferBindings, vertexAttributes) {
          for (let i = 0; i < texUnit; ++i) {
            const glTexUnit = {
              glTexture: null
            };
            this.glTexUnits.push(glTexUnit);
          }
          this.glSamplerUnits.length = texUnit;
          this.glSamplerUnits.fill(null);
          this.glBindUBOs.length = bufferBindings;
          this.glBindUBOs.fill(null);
          this.glBindUBOOffsets.length = bufferBindings;
          this.glBindUBOOffsets.fill(0);
          this.glEnabledAttribLocs.length = vertexAttributes;
          this.glEnabledAttribLocs.fill(false);
          this.glCurrentAttribLocs.length = vertexAttributes;
          this.glCurrentAttribLocs.fill(false);
        }
      });
    }
  };
});