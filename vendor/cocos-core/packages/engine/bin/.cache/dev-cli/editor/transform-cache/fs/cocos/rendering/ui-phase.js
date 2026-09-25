System.register("q-bundled:///fs/cocos/rendering/ui-phase.js", ["./pipeline-state-manager.js", "./define.js", "./pass-phase.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var PipelineStateManager, isEnableEffect, SetIndex, getPhaseID, cclegacy, UIPhase;
  _export("UIPhase", void 0);
  return {
    setters: [function (_pipelineStateManagerJs) {
      PipelineStateManager = _pipelineStateManagerJs.PipelineStateManager;
    }, function (_defineJs) {
      isEnableEffect = _defineJs.isEnableEffect;
      SetIndex = _defineJs.SetIndex;
    }, function (_passPhaseJs) {
      getPhaseID = _passPhaseJs.getPhaseID;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }],
    execute: function () {
      /*
       Copyright (c) 2018-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      _export("UIPhase", UIPhase = class UIPhase {
        constructor() {
          this._phaseID = getPhaseID('default');
          const r = cclegacy.rendering;
          if (isEnableEffect()) this._phaseID = r.getPhaseID(r.getPassID('default'), 'default');
        }
        activate(pipeline) {
          this._pipeline = pipeline;
        }
        render(camera, renderPass) {
          const pipeline = this._pipeline;
          const device = pipeline.device;
          const cmdBuff = pipeline.commandBuffers[0];
          const scene = camera.scene;
          const batches = scene.batches;
          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            let visible = false;
            if (camera.visibility & batch.visFlags) {
              visible = true;
            }
            if (!visible) continue;
            // shaders.length always equals actual used passes.length
            const count = batch.shaders.length;
            for (let j = 0; j < count; j++) {
              const pass = batch.passes[j];
              if (pass.phase !== this._phaseID) continue;
              if (pass.passID !== 0xFFFFFFFF) continue;
              const shader = batch.shaders[j];
              const inputAssembler = batch.inputAssembler;
              const pso = PipelineStateManager.getOrCreatePipelineState(device, pass, shader, renderPass, inputAssembler);
              cmdBuff.bindPipelineState(pso);
              cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
              const ds = batch.descriptorSet;
              cmdBuff.bindDescriptorSet(SetIndex.LOCAL, ds);
              cmdBuff.bindInputAssembler(inputAssembler);
              cmdBuff.draw(inputAssembler);
            }
          }
        }
      });
    }
  };
});