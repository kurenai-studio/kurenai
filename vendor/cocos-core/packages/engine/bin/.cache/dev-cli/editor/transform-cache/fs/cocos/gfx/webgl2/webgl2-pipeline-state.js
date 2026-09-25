System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-pipeline-state.js", ["../base/pipeline-state.js", "../gl-constants.js"], function (_export, _context) {
  "use strict";

  var PipelineState, WebGLConstants, WebGL2PipelineState, WebGLPrimitives;
  _export("WebGL2PipelineState", void 0);
  return {
    setters: [function (_basePipelineStateJs) {
      PipelineState = _basePipelineStateJs.PipelineState;
    }, function (_glConstantsJs) {
      WebGLConstants = _glConstantsJs.WebGLConstants;
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
      WebGLPrimitives = [WebGLConstants.POINTS, WebGLConstants.LINES, WebGLConstants.LINE_STRIP, WebGLConstants.LINE_LOOP, WebGLConstants.NONE, WebGLConstants.NONE, WebGLConstants.NONE, WebGLConstants.TRIANGLES, WebGLConstants.TRIANGLE_STRIP, WebGLConstants.TRIANGLE_FAN, WebGLConstants.NONE, WebGLConstants.NONE, WebGLConstants.NONE, WebGLConstants.NONE];
      /** @mangle */
      _export("WebGL2PipelineState", WebGL2PipelineState = class WebGL2PipelineState extends PipelineState {
        constructor() {
          super();
          this._gpuPipelineState = null;
        }
        get gpuPipelineState() {
          return this._gpuPipelineState;
        }
        initialize(info) {
          this._primitive = info.primitive;
          this._shader = info.shader;
          this._pipelineLayout = info.pipelineLayout;
          const bs = this._bs;
          if (info.blendState) {
            const bsInfo = info.blendState;
            const {
              targets
            } = bsInfo;
            if (targets) {
              targets.forEach((t, i) => {
                bs.setTarget(i, t);
              });
            }
            if (bsInfo.isA2C !== undefined) {
              bs.isA2C = bsInfo.isA2C;
            }
            if (bsInfo.isIndepend !== undefined) {
              bs.isIndepend = bsInfo.isIndepend;
            }
            if (bsInfo.blendColor !== undefined) {
              bs.blendColor = bsInfo.blendColor;
            }
          }
          Object.assign(this._rs, info.rasterizerState);
          Object.assign(this._dss, info.depthStencilState);
          this._is = info.inputState;
          this._renderPass = info.renderPass;
          this._dynamicStates = info.dynamicStates;
          const dynamicStates = [];
          for (let i = 0; i < 31; i++) {
            if (this._dynamicStates & 1 << i) {
              dynamicStates.push(1 << i);
            }
          }
          this._gpuPipelineState = {
            glPrimitive: WebGLPrimitives[info.primitive],
            gpuShader: info.shader.gpuShader,
            gpuPipelineLayout: info.pipelineLayout.getGpuPipelineLayout(),
            rs: info.rasterizerState,
            dss: info.depthStencilState,
            bs: info.blendState,
            gpuRenderPass: info.renderPass.getGpuRenderPass(),
            dynamicStates
          };
        }
        destroy() {
          this._gpuPipelineState = null;
        }
      });
    }
  };
});