System.register("q-bundled:///fs/cocos/gfx/webgl2/webgl2-shader.js", ["../base/shader.js", "./webgl2-commands.js", "./webgl2-define.js"], function (_export, _context) {
  "use strict";

  var Shader, WebGL2CmdFuncCreateShader, WebGL2CmdFuncDestroyShader, WebGL2DeviceManager, WebGL2Shader;
  _export("WebGL2Shader", void 0);
  return {
    setters: [function (_baseShaderJs) {
      Shader = _baseShaderJs.Shader;
    }, function (_webgl2CommandsJs) {
      WebGL2CmdFuncCreateShader = _webgl2CommandsJs.WebGL2CmdFuncCreateShader;
      WebGL2CmdFuncDestroyShader = _webgl2CommandsJs.WebGL2CmdFuncDestroyShader;
    }, function (_webgl2DefineJs) {
      WebGL2DeviceManager = _webgl2DefineJs.WebGL2DeviceManager;
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
      _export("WebGL2Shader", WebGL2Shader = class WebGL2Shader extends Shader {
        constructor() {
          super();
          this._gpuShader = null;
        }
        get gpuShader() {
          if (this._gpuShader.glProgram === null) {
            WebGL2CmdFuncCreateShader(WebGL2DeviceManager.instance, this._gpuShader);
          }
          return this._gpuShader;
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
            WebGL2CmdFuncDestroyShader(WebGL2DeviceManager.instance, this._gpuShader);
            this._gpuShader = null;
          }
        }
      });
    }
  };
});