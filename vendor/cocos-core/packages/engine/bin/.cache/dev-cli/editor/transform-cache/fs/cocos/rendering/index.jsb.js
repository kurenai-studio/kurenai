System.register("q-bundled:///fs/cocos/rendering/index.jsb.js", ["./define.js", "./pass-phase.js", "./render-types.js", "./pipeline-event.js"], function (_export, _context) {
  "use strict";

  var pipeline, InstancedBuffer, PipelineStateManager, getOrCreatePipelineState;
  return {
    setters: [function (_defineJs) {
      pipeline = _defineJs;
    }, function (_passPhaseJs) {
      var _exportObj = {};
      for (var _key in _passPhaseJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _passPhaseJs[_key];
      }
      _export(_exportObj);
    }, function (_renderTypesJs) {
      var _exportObj2 = {};
      for (var _key2 in _renderTypesJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _renderTypesJs[_key2];
      }
      _export(_exportObj2);
    }, function (_pipelineEventJs) {
      _export("PipelineEventType", _pipelineEventJs.PipelineEventType);
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
      _export("pipeline", pipeline);
      _export("InstancedBuffer", InstancedBuffer = nr.InstancedBuffer);
      _export("PipelineStateManager", PipelineStateManager = nr.PipelineStateManager);
      getOrCreatePipelineState = nr.PipelineStateManager.getOrCreatePipelineState;
      nr.PipelineStateManager.getOrCreatePipelineState = function (device, pass, shader, renderPass, ia) {
        return getOrCreatePipelineState(pass, shader, renderPass, ia); //cjh TODO: remove hacking. c++ API doesn't access device argument.
      };
    }
  };
});