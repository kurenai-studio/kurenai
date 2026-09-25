System.register("q-bundled:///fs/cocos/gfx/webgl/webgl-shader.js", ["../base/shader.js", "./webgl-commands.js", "./webgl-define.js"], function (_export, _context) {
  "use strict";

  var Shader, WebGLCmdFuncCreateShader, WebGLCmdFuncDestroyShader, WebGLDeviceManager, WebGLShader;
  _export("WebGLShader", void 0);
  return {
    setters: [function (_baseShaderJs) {
      Shader = _baseShaderJs.Shader;
    }, function (_webglCommandsJs) {
      WebGLCmdFuncCreateShader = _webglCommandsJs.WebGLCmdFuncCreateShader;
      WebGLCmdFuncDestroyShader = _webglCommandsJs.WebGLCmdFuncDestroyShader;
    }, function (_webglDefineJs) {
      WebGLDeviceManager = _webglDefineJs.WebGLDeviceManager;
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
      _export("WebGLShader", WebGLShader = class WebGLShader extends Shader {
        get gpuShader() {
          if (this._gpuShader.glProgram === null) {
            WebGLCmdFuncCreateShader(WebGLDeviceManager.instance, this._gpuShader);
          }
          return this._gpuShader;
        }
        constructor() {
          super();
          this._gpuShader = null;
        }
        initialize(info) {
          this._name = info.name;
          this._stages = info.stages;
          this._attributes = info.attributes;
          this._blocks = info.blocks;
          this._samplers = info.samplers;
          this._gpuShader = {
            name: info.name,
            blocks: info.blocks.slice(),
            samplerTextures: info.samplerTextures.slice(),
            subpassInputs: info.subpassInputs.slice(),
            gpuStages: new Array(info.stages.length),
            glProgram: null,
            glInputs: [],
            glUniforms: [],
            glBlocks: [],
            glSamplerTextures: []
          };
          for (let i = 0; i < info.stages.length; ++i) {
            const stage = info.stages[i];
            this._gpuShader.gpuStages[i] = {
              type: stage.stage,
              source: stage.source,
              glShader: null
            };
          }
        }
        destroy() {
          if (this._gpuShader) {
            WebGLCmdFuncDestroyShader(WebGLDeviceManager.instance, this._gpuShader);
            this._gpuShader = null;
          }
        }
      });
    }
  };
});