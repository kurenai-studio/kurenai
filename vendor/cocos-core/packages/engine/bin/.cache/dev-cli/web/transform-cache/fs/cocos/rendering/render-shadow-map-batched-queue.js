System.register("q-bundled:///fs/cocos/rendering/render-shadow-map-batched-queue.js", ["./define.js", "./pass-phase.js", "./pipeline-state-manager.js", "../render-scene/core/pass.js", "./render-instanced-queue.js", "../render-scene/scene/shadows.js", "../render-scene/scene/light.js", "../core/index.js", "./scene-culling.js"], function (_export, _context) {
  "use strict";

  var isEnableEffect, SetIndex, getPhaseID, PipelineStateManager, BatchingSchemes, RenderInstancedQueue, ShadowType, LightType, cclegacy, geometry, shadowCulling, RenderShadowMapBatchedQueue, _phaseID;
  function getShadowPassIndex(subModel) {
    const passes = subModel.passes;
    const r = cclegacy.rendering;
    if (isEnableEffect()) _phaseID = r.getPhaseID(r.getPassID('default'), 'shadow-caster');
    for (let k = 0; k < passes.length; k++) {
      if ((!r || !r.enableEffectImport) && passes[k].phase === _phaseID || isEnableEffect() && passes[k].phaseID === _phaseID) {
        return k;
      }
    }
    return -1;
  }

  /**
   * @zh
   * 阴影渲染队列
   */
  _export("RenderShadowMapBatchedQueue", void 0);
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
    }, function (_renderInstancedQueueJs) {
      RenderInstancedQueue = _renderInstancedQueueJs.RenderInstancedQueue;
    }, function (_renderSceneSceneShadowsJs) {
      ShadowType = _renderSceneSceneShadowsJs.ShadowType;
    }, function (_renderSceneSceneLightJs) {
      LightType = _renderSceneSceneLightJs.LightType;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
      geometry = _coreIndexJs.geometry;
    }, function (_sceneCullingJs) {
      shadowCulling = _sceneCullingJs.shadowCulling;
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
      _phaseID = getPhaseID('shadow-caster');
      _export("RenderShadowMapBatchedQueue", RenderShadowMapBatchedQueue = class RenderShadowMapBatchedQueue {
        constructor(pipeline) {
          this._subModelsArray = [];
          this._passArray = [];
          this._shaderArray = [];
          this._instancedQueue = new RenderInstancedQueue();
          this._pipeline = pipeline;
        }
        gatherLightPasses(camera, light, cmdBuff, level = 0) {
          this.clear();
          const sceneData = this._pipeline.pipelineSceneData;
          const shadowInfo = sceneData.shadows;
          if (light && shadowInfo.enabled && shadowInfo.type === ShadowType.ShadowMap) {
            switch (light.type) {
              case LightType.DIRECTIONAL:
                // eslint-disable-next-line no-case-declarations
                const dirLight = light;
                if (dirLight.shadowEnabled) {
                  const csmLayers = sceneData.csmLayers;
                  let layer;
                  if (dirLight.shadowFixedArea) {
                    layer = csmLayers.specialLayer;
                  } else {
                    layer = csmLayers.layers[level];
                  }
                  shadowCulling(camera, sceneData, layer);
                  const dirShadowObjects = layer.shadowObjects;
                  for (let i = 0; i < dirShadowObjects.length; i++) {
                    const ro = dirShadowObjects[i];
                    const model = ro.model;
                    this.add(model, level);
                  }
                }
                break;
              case LightType.SPOT:
                // eslint-disable-next-line no-case-declarations
                const spotLight = light;
                if (spotLight.shadowEnabled) {
                  const visibility = spotLight.visibility;
                  const castShadowObjects = sceneData.csmLayers.castShadowObjects;
                  for (let i = 0; i < castShadowObjects.length; i++) {
                    const ro = castShadowObjects[i];
                    const model = ro.model;
                    if (model.worldBounds) {
                      if ((visibility & model.node.layer) !== model.node.layer || !geometry.intersect.aabbFrustum(model.worldBounds, spotLight.frustum)) {
                        continue;
                      }
                    }
                    this.add(model, level);
                  }
                }
                break;
              default:
            }
            this._instancedQueue.uploadBuffers(cmdBuff);
          }
        }

        /**
         * @zh
         * clear light-Batched-Queue
         */
        clear() {
          this._subModelsArray.length = 0;
          this._shaderArray.length = 0;
          this._passArray.length = 0;
          this._instancedQueue.clear();
        }
        add(model, level) {
          const subModels = model.subModels;
          for (let j = 0; j < subModels.length; j++) {
            const subModel = subModels[j];
            const shadowPassIdx = getShadowPassIndex(subModel);
            if (shadowPassIdx < 0) {
              continue;
            }
            const pass = subModel.passes[shadowPassIdx];
            const batchingScheme = pass.batchingScheme;
            if (batchingScheme === BatchingSchemes.INSTANCING) {
              // instancing
              const buffer = pass.getInstancedBuffer(level);
              buffer.merge(subModel, shadowPassIdx);
              this._instancedQueue.queue.add(buffer);
            } else {
              const shader = subModel.shaders[shadowPassIdx];
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
        }
      });
    }
  };
});