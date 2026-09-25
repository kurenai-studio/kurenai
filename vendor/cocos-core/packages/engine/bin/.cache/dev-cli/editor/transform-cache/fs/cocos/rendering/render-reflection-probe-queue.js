System.register("q-bundled:///fs/cocos/rendering/render-reflection-probe-queue.js", ["./define.js", "./pass-phase.js", "./pipeline-state-manager.js", "../render-scene/core/pass.js", "../render-scene/scene/reflection-probe.js", "../render-scene/scene/camera.js", "./render-instanced-queue.js", "../core/index.js"], function (_export, _context) {
  "use strict";

  var isEnableEffect, SetIndex, getPhaseID, PipelineStateManager, BatchingSchemes, ProbeType, SkyBoxFlagValue, RenderInstancedQueue, cclegacy, geometry, RenderReflectionProbeQueue, CC_USE_RGBE_OUTPUT, _phaseID, _phaseReflectMapID;
  function getPassIndex(subModel) {
    const passes = subModel.passes;
    const r = cclegacy.rendering;
    if (isEnableEffect()) _phaseID = r.getPhaseID(r.getPassID('default'), 'default');
    for (let k = 0; k < passes.length; k++) {
      if ((!r || !r.enableEffectImport) && passes[k].phase === _phaseID || isEnableEffect() && passes[k].phaseID === _phaseID) {
        return k;
      }
    }
    return -1;
  }
  function getReflectMapPassIndex(subModel) {
    const passes = subModel.passes;
    const r = cclegacy.rendering;
    if (isEnableEffect()) _phaseReflectMapID = r.getPhaseID(r.getPassID('default'), 'reflect-map');
    for (let k = 0; k < passes.length; k++) {
      if ((!r || !r.enableEffectImport) && passes[k].phase === _phaseReflectMapID || isEnableEffect() && passes[k].phaseID === _phaseReflectMapID) {
        return k;
      }
    }
    return -1;
  }

  /**
   * @zh
   * 反射探针渲染队列
   */
  _export("RenderReflectionProbeQueue", void 0);
  return {
    setters: [function (_defineJs) {
      isEnableEffect = _defineJs.isEnableEffect;
      SetIndex = _defineJs.SetIndex;
    }, function (_passPhaseJs) {
      getPhaseID = _passPhaseJs.getPhaseID;
    }, function (_pipelineStateManagerJs) {
      PipelineStateManager = _pipelineStateManagerJs.PipelineStateManager;
    }, function (_renderSceneCorePassJs) {
      BatchingSchemes = _renderSceneCorePassJs.BatchingSchemes;
    }, function (_renderSceneSceneReflectionProbeJs) {
      ProbeType = _renderSceneSceneReflectionProbeJs.ProbeType;
    }, function (_renderSceneSceneCameraJs) {
      SkyBoxFlagValue = _renderSceneSceneCameraJs.SkyBoxFlagValue;
    }, function (_renderInstancedQueueJs) {
      RenderInstancedQueue = _renderInstancedQueueJs.RenderInstancedQueue;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      geometry = _coreIndexJs.geometry;
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
      CC_USE_RGBE_OUTPUT = 'CC_USE_RGBE_OUTPUT';
      _phaseID = getPhaseID('default');
      _phaseReflectMapID = getPhaseID('reflect-map');
      _export("RenderReflectionProbeQueue", RenderReflectionProbeQueue = class RenderReflectionProbeQueue {
        constructor(pipeline) {
          this._subModelsArray = [];
          this._passArray = [];
          this._shaderArray = [];
          this._rgbeSubModelsArray = [];
          this._instancedQueue = new RenderInstancedQueue();
          this._patches = [];
          this._pipeline = pipeline;
        }
        gatherRenderObjects(probe, camera, cmdBuff, reflectionCamera) {
          this.clear();
          const scene = camera.scene;
          const sceneData = this._pipeline.pipelineSceneData;
          const skybox = sceneData.skybox;
          const probeCamera = reflectionCamera != null ? reflectionCamera : probe.camera;
          if (skybox.enabled && skybox.model && probeCamera.clearFlag & SkyBoxFlagValue.VALUE) {
            this.add(skybox.model);
          }
          const models = scene.models;
          const visibility = probe.visibility;
          for (let i = 0; i < models.length; i++) {
            const model = models[i];
            if (!model.node || scene.isCulledByLod(camera, model)) {
              continue;
            }
            if ((visibility & model.node.layer) !== model.node.layer && !(visibility & model.visFlags)) {
              continue;
            }
            if (model.enabled && model.worldBounds && model.bakeToReflectionProbe) {
              if (probe.probeType === ProbeType.CUBE) {
                if (geometry.intersect.aabbWithAABB(model.worldBounds, probe.boundingBox)) {
                  this.add(model);
                }
              } else if (geometry.intersect.aabbFrustum(model.worldBounds, probeCamera.frustum)) {
                this.add(model);
              }
            }
          }
          this._instancedQueue.uploadBuffers(cmdBuff);
        }
        clear() {
          this._subModelsArray.length = 0;
          this._shaderArray.length = 0;
          this._passArray.length = 0;
          this._instancedQueue.clear();
          this._rgbeSubModelsArray.length = 0;
        }
        add(model) {
          const subModels = model.subModels;
          for (let j = 0; j < subModels.length; j++) {
            const subModel = subModels[j];

            //Filter transparent objects
            const isTransparent = subModel.passes[0].blendState.targets[0].blend;
            if (isTransparent) {
              continue;
            }
            let passIdx = getReflectMapPassIndex(subModel);
            let bUseReflectPass = true;
            if (passIdx < 0) {
              passIdx = getPassIndex(subModel);
              bUseReflectPass = false;
            }
            if (passIdx < 0) {
              continue;
            }
            const pass = subModel.passes[passIdx];
            const batchingScheme = pass.batchingScheme;
            if (!bUseReflectPass) {
              this._patches = [];
              this._patches = this._patches.concat(subModel.patches);
              const useRGBEPatchs = [{
                name: CC_USE_RGBE_OUTPUT,
                value: true
              }];
              this._patches = this._patches.concat(useRGBEPatchs);
              subModel.onMacroPatchesStateChanged(this._patches);
              this._rgbeSubModelsArray.push(subModel);
            }
            if (batchingScheme === BatchingSchemes.INSTANCING) {
              // instancing
              const buffer = pass.getInstancedBuffer();
              buffer.merge(subModel, passIdx);
              this._instancedQueue.queue.add(buffer);
            } else {
              const shader = subModel.shaders[passIdx];
              this._subModelsArray.push(subModel);
              if (shader) this._shaderArray.push(shader);
              this._passArray.push(pass);
            }
          }
        }

        /**
         * @zh
         * record CommandBuffer
         */
        recordCommandBuffer(device, renderPass, cmdBuff) {
          this._instancedQueue.recordCommandBuffer(device, renderPass, cmdBuff);
          for (let i = 0; i < this._subModelsArray.length; ++i) {
            const subModel = this._subModelsArray[i];
            const shader = this._shaderArray[i];
            const pass = this._passArray[i];
            const ia = subModel.inputAssembler;
            const pso = PipelineStateManager.getOrCreatePipelineState(device, pass, shader, renderPass, ia);
            const descriptorSet = pass.descriptorSet;
            cmdBuff.bindPipelineState(pso);
            cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, descriptorSet);
            cmdBuff.bindDescriptorSet(SetIndex.LOCAL, subModel.descriptorSet);
            cmdBuff.bindInputAssembler(ia);
            cmdBuff.draw(ia);
          }
          this.resetRGBEMacro();
          this._instancedQueue.clear();
        }
        resetRGBEMacro() {
          for (let i = 0; i < this._rgbeSubModelsArray.length; i++) {
            this._patches = [];
            const subModel = this._rgbeSubModelsArray[i];
            // eslint-disable-next-line prefer-const
            this._patches = this._patches.concat(subModel.patches);
            if (!this._patches) continue;
            for (let j = 0; j < this._patches.length; j++) {
              const patch = this._patches[j];
              if (patch.name === CC_USE_RGBE_OUTPUT) {
                this._patches.splice(j, 1);
                break;
              }
            }
            subModel.onMacroPatchesStateChanged(this._patches);
          }
        }
      });
    }
  };
});