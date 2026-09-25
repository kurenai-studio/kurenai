System.register("q-bundled:///fs/cocos/rendering/render-additive-light-queue.js", ["../render-scene/core/pass.js", "./pipeline-state-manager.js", "../core/index.js", "../gfx/index.js", "./render-instanced-queue.js", "./pass-phase.js", "../render-scene/scene/light.js", "./define.js", "../render-scene/scene/shadows.js", "./pipeline-ubo.js", "../core/geometry/index.js"], function (_export, _context) {
  "use strict";

  var BatchingSchemes, PipelineStateManager, Vec3, nextPow2, Mat4, Color, Pool, geometry, cclegacy, BufferUsageBit, MemoryUsageBit, BufferInfo, BufferViewInfo, deviceManager, RenderInstancedQueue, getPhaseID, LightType, SetIndex, UBOShadow, UNIFORM_SHADOWMAP_BINDING, UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING, supportsR32FloatTexture, isEnableEffect, UBOShadowEnum, UBOForwardLightEnum, UBOForwardLight, ShadowType, PipelineUBO, AABB, RenderAdditiveLightQueue, _lightPassPool, _v3, _vec4Array, _dynamicOffsets, _lightIndices, _matShadowView, _matShadowViewProj, _rangedDirLightBoundingBox, _tmpBoundingBox, phaseName, _phaseID, _lightPassIndices;
  function cullSphereLight(light, model) {
    return !!(model.worldBounds && !geometry.intersect.aabbWithAABB(model.worldBounds, light.aabb));
  }
  function cullSpotLight(light, model) {
    return !!(model.worldBounds && (!geometry.intersect.aabbWithAABB(model.worldBounds, light.aabb) || !geometry.intersect.aabbFrustum(model.worldBounds, light.frustum)));
  }
  function cullPointLight(light, model) {
    return !!(model.worldBounds && !geometry.intersect.aabbWithAABB(model.worldBounds, light.aabb));
  }
  function cullRangedDirLight(light, model) {
    AABB.transform(_tmpBoundingBox, _rangedDirLightBoundingBox, light.node.getWorldMatrix());
    return !!(model.worldBounds && !geometry.intersect.aabbWithAABB(model.worldBounds, _tmpBoundingBox));
  }
  function getLightPassIndices(subModels, lightPassIndices, passLayout = 'default') {
    const r = cclegacy.rendering;
    if (isEnableEffect()) {
      _phaseID = r.getPhaseID(r.getPassID(passLayout), phaseName);
    }
    lightPassIndices.length = 0;
    let hasValidLightPass = false;
    for (let j = 0; j < subModels.length; j++) {
      const {
        passes
      } = subModels[j];
      let lightPassIndex = -1;
      for (let k = 0; k < passes.length; k++) {
        if ((!r || !r.enableEffectImport) && passes[k].phase === _phaseID || isEnableEffect() && passes[k].phaseID === _phaseID) {
          lightPassIndex = k;
          hasValidLightPass = true;
          break;
        }
      }
      lightPassIndices.push(lightPassIndex);
    }
    return hasValidLightPass;
  }

  /**
   * @zh 叠加光照队列。
   */
  _export("RenderAdditiveLightQueue", void 0);
  return {
    setters: [function (_renderSceneCorePassJs) {
      BatchingSchemes = _renderSceneCorePassJs.BatchingSchemes;
    }, function (_pipelineStateManagerJs) {
      PipelineStateManager = _pipelineStateManagerJs.PipelineStateManager;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
      nextPow2 = _coreIndexJs.nextPow2;
      Mat4 = _coreIndexJs.Mat4;
      Color = _coreIndexJs.Color;
      Pool = _coreIndexJs.Pool;
      geometry = _coreIndexJs.geometry;
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_gfxIndexJs) {
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferViewInfo = _gfxIndexJs.BufferViewInfo;
      deviceManager = _gfxIndexJs.deviceManager;
    }, function (_renderInstancedQueueJs) {
      RenderInstancedQueue = _renderInstancedQueueJs.RenderInstancedQueue;
    }, function (_passPhaseJs) {
      getPhaseID = _passPhaseJs.getPhaseID;
    }, function (_renderSceneSceneLightJs) {
      LightType = _renderSceneSceneLightJs.LightType;
    }, function (_defineJs) {
      SetIndex = _defineJs.SetIndex;
      UBOShadow = _defineJs.UBOShadow;
      UNIFORM_SHADOWMAP_BINDING = _defineJs.UNIFORM_SHADOWMAP_BINDING;
      UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING = _defineJs.UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING;
      supportsR32FloatTexture = _defineJs.supportsR32FloatTexture;
      isEnableEffect = _defineJs.isEnableEffect;
      UBOShadowEnum = _defineJs.UBOShadowEnum;
      UBOForwardLightEnum = _defineJs.UBOForwardLightEnum;
      UBOForwardLight = _defineJs.UBOForwardLight;
    }, function (_renderSceneSceneShadowsJs) {
      ShadowType = _renderSceneSceneShadowsJs.ShadowType;
    }, function (_pipelineUboJs) {
      PipelineUBO = _pipelineUboJs.PipelineUBO;
    }, function (_coreGeometryIndexJs) {
      AABB = _coreGeometryIndexJs.AABB;
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
      _lightPassPool = new Pool(() => ({
        subModel: null,
        passIdx: -1,
        dynamicOffsets: [],
        lights: []
      }), 16);
      _v3 = new Vec3();
      _vec4Array = new Float32Array(4);
      _dynamicOffsets = [];
      _lightIndices = [];
      _matShadowView = new Mat4();
      _matShadowViewProj = new Mat4();
      _rangedDirLightBoundingBox = new AABB(0.0, 0.0, 0.0, 0.5, 0.5, 0.5);
      _tmpBoundingBox = new AABB();
      phaseName = 'forward-add';
      _phaseID = getPhaseID(phaseName);
      _lightPassIndices = [];
      _export("RenderAdditiveLightQueue", RenderAdditiveLightQueue = class RenderAdditiveLightQueue {
        constructor(pipeline) {
          this._lightPasses = [];
          this._instancedLightPassPool = _lightPassPool.alloc();
          this._shadowUBO = new Float32Array(UBOShadowEnum.COUNT);
          this._lightBufferCount = 16;
          this._instancedQueues = [];
          this._lightMeterScale = 10000.0;
          this._pipeline = pipeline;
          this._device = pipeline.device;
          const alignment = this._device.capabilities.uboOffsetAlignment;
          this._lightBufferStride = Math.ceil(UBOForwardLightEnum.SIZE / alignment) * alignment;
          this._lightBufferElementCount = this._lightBufferStride / Float32Array.BYTES_PER_ELEMENT;
          this._lightBuffer = this._device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, this._lightBufferStride * this._lightBufferCount, this._lightBufferStride));
          this._firstLightBufferView = this._device.createBuffer(new BufferViewInfo(this._lightBuffer, 0, UBOForwardLightEnum.SIZE));
          this._lightBufferData = new Float32Array(this._lightBufferElementCount * this._lightBufferCount);
        }
        clear() {
          this._instancedQueues.forEach(instancedQueue => {
            if (instancedQueue) {
              instancedQueue.clear();
            }
          });
          this._instancedQueues.length = 0;
          for (let i = 0; i < this._lightPasses.length; i++) {
            const lp = this._lightPasses[i];
            lp.dynamicOffsets.length = 0;
            lp.lights.length = 0;
          }
          _lightPassPool.freeArray(this._lightPasses);
          this._lightPasses.length = 0;
          this._instancedLightPassPool.dynamicOffsets.length = 0;
          this._instancedLightPassPool.lights.length = 0;
        }
        destroy() {
          const descriptorSetMap = this._pipeline.globalDSManager.descriptorSetMap;
          const keys = descriptorSetMap.keys;
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const descriptorSet = descriptorSetMap.get(key);
            if (descriptorSet) {
              descriptorSet.getBuffer(UBOShadow.BINDING).destroy();
              descriptorSet.getTexture(UNIFORM_SHADOWMAP_BINDING).destroy();
              descriptorSet.getTexture(UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING).destroy();
              descriptorSet.destroy();
            }
            descriptorSetMap.delete(key);
          }
        }
        _bindForwardAddLight(validPunctualLights, passLayout = 'default') {
          const renderObjects = this._pipeline.pipelineSceneData.renderObjects;
          for (let i = 0; i < renderObjects.length; i++) {
            const ro = renderObjects[i];
            const {
              model
            } = ro;
            const {
              subModels
            } = model;
            if (!getLightPassIndices(subModels, _lightPassIndices, passLayout)) {
              continue;
            }
            _lightIndices.length = 0;
            this._lightCulling(model, validPunctualLights);
            if (!_lightIndices.length) {
              continue;
            }
            for (let j = 0; j < subModels.length; j++) {
              const lightPassIdx = _lightPassIndices[j];
              if (lightPassIdx < 0) {
                continue;
              }
              const subModel = subModels[j];
              const pass = subModel.passes[lightPassIdx];
              // object has translucent base pass, prohibiting forward-add pass for multi light sources lighting
              const isTransparent = subModel.passes[0].blendState.targets[0].blend;
              if (isTransparent) {
                continue;
              }
              subModel.descriptorSet.bindBuffer(UBOForwardLight.BINDING, this._firstLightBufferView);
              subModel.descriptorSet.update();
              this._addRenderQueue(pass, subModel, model, lightPassIdx);
            }
          }
        }
        gatherLightPasses(camera, cmdBuff, passLayout = 'default') {
          this.clear();
          this._updateUBOs(camera, cmdBuff);
          this._updateLightDescriptorSet(camera, cmdBuff);
          const validPunctualLights = this._pipeline.pipelineSceneData.validPunctualLights;
          if (!validPunctualLights.length) {
            return;
          }
          this._bindForwardAddLight(validPunctualLights, passLayout);

          // only for instanced and batched, no light culling applied
          for (let l = 0; l < validPunctualLights.length; l++) {
            const light = validPunctualLights[l];
            this._instancedLightPassPool.lights.push(light);
            this._instancedLightPassPool.dynamicOffsets.push(this._lightBufferStride * l);
          }
          this._instancedQueues.forEach(instancedQueue => {
            if (instancedQueue) {
              instancedQueue.uploadBuffers(cmdBuff);
            }
          });
        }
        recordCommandBuffer(device, renderPass, cmdBuff) {
          const globalDSManager = this._pipeline.globalDSManager;
          for (let j = 0; j < this._instancedQueues.length; ++j) {
            const queue = this._instancedQueues[j];
            if (!queue) {
              continue;
            }
            const light = this._instancedLightPassPool.lights[j];
            _dynamicOffsets[0] = this._instancedLightPassPool.dynamicOffsets[j];
            const descriptorSet = globalDSManager.getOrCreateDescriptorSet(light);
            queue.recordCommandBuffer(device, renderPass, cmdBuff, descriptorSet, _dynamicOffsets);
          }
          for (let i = 0; i < this._lightPasses.length; i++) {
            const {
              subModel,
              passIdx,
              dynamicOffsets,
              lights
            } = this._lightPasses[i];
            const pass = subModel.passes[passIdx];
            const shader = subModel.shaders[passIdx];
            const ia = subModel.inputAssembler;
            const pso = PipelineStateManager.getOrCreatePipelineState(device, pass, shader, renderPass, ia);
            const matDS = pass.descriptorSet;
            const localDS = subModel.descriptorSet;
            cmdBuff.bindPipelineState(pso);
            cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, matDS);
            cmdBuff.bindInputAssembler(ia);
            for (let j = 0; j < dynamicOffsets.length; ++j) {
              const light = lights[j];
              const descriptorSet = globalDSManager.getOrCreateDescriptorSet(light);
              _dynamicOffsets[0] = dynamicOffsets[j];
              cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, descriptorSet);
              cmdBuff.bindDescriptorSet(SetIndex.LOCAL, localDS, _dynamicOffsets);
              cmdBuff.draw(ia);
            }
          }
        }

        // light culling
        _lightCulling(model, validPunctualLights) {
          let isCulled = false;
          for (let l = 0; l < validPunctualLights.length; l++) {
            const light = validPunctualLights[l];
            switch (light.type) {
              case LightType.SPHERE:
                isCulled = cullSphereLight(light, model);
                break;
              case LightType.SPOT:
                isCulled = cullSpotLight(light, model);
                break;
              case LightType.POINT:
                isCulled = cullPointLight(light, model);
                break;
              case LightType.RANGED_DIRECTIONAL:
                isCulled = cullRangedDirLight(light, model);
                break;
              default:
            }
            if (!isCulled) {
              _lightIndices.push(l);
            }
          }
        }

        // add renderQueue
        _addRenderQueue(pass, subModel, model, lightPassIdx) {
          const validPunctualLights = this._pipeline.pipelineSceneData.validPunctualLights;
          const {
            batchingScheme
          } = pass;
          let lp = null;
          if (batchingScheme === BatchingSchemes.NONE) {
            lp = _lightPassPool.alloc();
            lp.subModel = subModel;
            lp.passIdx = lightPassIdx;
          }
          for (let l = 0; l < _lightIndices.length; l++) {
            const lightIdx = _lightIndices[l];
            const light = validPunctualLights[lightIdx];
            const visibility = light.visibility;
            if ((visibility & model.node.layer) === model.node.layer || visibility & model.visFlags) {
              switch (batchingScheme) {
                case BatchingSchemes.INSTANCING:
                  {
                    const buffer = pass.getInstancedBuffer(lightIdx);
                    buffer.merge(subModel, lightPassIdx);
                    buffer.dynamicOffsets[0] = this._lightBufferStride * lightIdx;
                    if (this._instancedQueues.length <= lightIdx || !this._instancedQueues[lightIdx]) {
                      this._instancedQueues.length = lightIdx + 1;
                      this._instancedQueues[lightIdx] = new RenderInstancedQueue();
                    }
                    this._instancedQueues[lightIdx].queue.add(buffer);
                  }
                  break;
                default:
                  lp.lights.push(light);
                  lp.dynamicOffsets.push(this._lightBufferStride * lightIdx);
              }
            }
          }
          if (batchingScheme === BatchingSchemes.NONE) {
            this._lightPasses.push(lp);
          }
        }

        // update light DescriptorSet
        _updateLightDescriptorSet(camera, cmdBuff) {
          const device = this._pipeline.device;
          const sceneData = this._pipeline.pipelineSceneData;
          const shadowInfo = sceneData.shadows;
          const shadowFrameBufferMap = sceneData.shadowFrameBufferMap;
          const mainLight = camera.scene.mainLight;
          const packing = supportsR32FloatTexture(device) ? 0.0 : 1.0;
          const globalDSManager = this._pipeline.globalDSManager;
          const validPunctualLights = sceneData.validPunctualLights;
          const cap = this._pipeline.device.capabilities;
          for (let i = 0; i < validPunctualLights.length; i++) {
            const light = validPunctualLights[i];
            const descriptorSet = globalDSManager.getOrCreateDescriptorSet(light);
            if (!descriptorSet) {
              continue;
            }
            let matShadowProj;
            let matShadowInvProj;
            switch (light.type) {
              case LightType.SPHERE:
                {
                  // planar PROJ
                  if (mainLight) {
                    PipelineUBO.updatePlanarNormalAndDistance(shadowInfo, this._shadowUBO);
                  }
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 0] = shadowInfo.size.x;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 1] = shadowInfo.size.y;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 2] = 1.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 3] = 0.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 0] = LightType.SPHERE;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 1] = packing;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 2] = 0.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 3] = 0.0;
                  break;
                }
              case LightType.SPOT:
                {
                  const spotLight = light;

                  // planar PROJ
                  if (mainLight) {
                    PipelineUBO.updatePlanarNormalAndDistance(shadowInfo, this._shadowUBO);
                  }

                  // light view
                  Mat4.invert(_matShadowView, light.node.getWorldMatrix());

                  // light proj
                  Mat4.perspective(_matShadowViewProj, light.angle, 1.0, 0.001, light.range, true, cap.clipSpaceMinZ, cap.clipSpaceSignY, 0);
                  matShadowProj = _matShadowViewProj.clone();
                  matShadowInvProj = _matShadowViewProj.clone().invert();

                  // light viewProj
                  Mat4.multiply(_matShadowViewProj, _matShadowViewProj, _matShadowView);
                  Mat4.toArray(this._shadowUBO, _matShadowView, UBOShadowEnum.MAT_LIGHT_VIEW_OFFSET);
                  Mat4.toArray(this._shadowUBO, _matShadowViewProj, UBOShadowEnum.MAT_LIGHT_VIEW_PROJ_OFFSET);
                  this._shadowUBO[UBOShadowEnum.SHADOW_NEAR_FAR_LINEAR_SATURATION_INFO_OFFSET + 0] = 0.01;
                  this._shadowUBO[UBOShadowEnum.SHADOW_NEAR_FAR_LINEAR_SATURATION_INFO_OFFSET + 1] = light.range;
                  this._shadowUBO[UBOShadowEnum.SHADOW_NEAR_FAR_LINEAR_SATURATION_INFO_OFFSET + 2] = 0.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_NEAR_FAR_LINEAR_SATURATION_INFO_OFFSET + 3] = 0.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 0] = shadowInfo.size.x;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 1] = shadowInfo.size.y;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 2] = spotLight.shadowPcf;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 3] = spotLight.shadowBias;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 0] = LightType.SPOT;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 1] = packing;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 2] = spotLight.shadowNormalBias;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 3] = 0.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_PROJ_DEPTH_INFO_OFFSET + 0] = matShadowProj.m10;
                  this._shadowUBO[UBOShadowEnum.SHADOW_PROJ_DEPTH_INFO_OFFSET + 1] = matShadowProj.m14;
                  this._shadowUBO[UBOShadowEnum.SHADOW_PROJ_DEPTH_INFO_OFFSET + 2] = matShadowProj.m11;
                  this._shadowUBO[UBOShadowEnum.SHADOW_PROJ_DEPTH_INFO_OFFSET + 3] = matShadowProj.m15;
                  this._shadowUBO[UBOShadowEnum.SHADOW_INV_PROJ_DEPTH_INFO_OFFSET + 0] = matShadowInvProj.m10;
                  this._shadowUBO[UBOShadowEnum.SHADOW_INV_PROJ_DEPTH_INFO_OFFSET + 1] = matShadowInvProj.m14;
                  this._shadowUBO[UBOShadowEnum.SHADOW_INV_PROJ_DEPTH_INFO_OFFSET + 2] = matShadowInvProj.m11;
                  this._shadowUBO[UBOShadowEnum.SHADOW_INV_PROJ_DEPTH_INFO_OFFSET + 3] = matShadowInvProj.m15;
                  this._shadowUBO[UBOShadowEnum.SHADOW_PROJ_INFO_OFFSET + 0] = matShadowProj.m00;
                  this._shadowUBO[UBOShadowEnum.SHADOW_PROJ_INFO_OFFSET + 1] = matShadowProj.m05;
                  this._shadowUBO[UBOShadowEnum.SHADOW_PROJ_INFO_OFFSET + 2] = 1.0 / matShadowProj.m00;
                  this._shadowUBO[UBOShadowEnum.SHADOW_PROJ_INFO_OFFSET + 3] = 1.0 / matShadowProj.m05;

                  // Spot light sampler binding
                  if (shadowFrameBufferMap.has(light)) {
                    var _shadowFrameBufferMap;
                    const texture = (_shadowFrameBufferMap = shadowFrameBufferMap.get(light)) == null ? void 0 : _shadowFrameBufferMap.colorTextures[0];
                    if (texture) {
                      globalDSManager.bindTexture(UNIFORM_SPOT_SHADOW_MAP_TEXTURE_BINDING, texture);
                    }
                  }
                  break;
                }
              case LightType.POINT:
                {
                  // planar PROJ
                  if (mainLight) {
                    PipelineUBO.updatePlanarNormalAndDistance(shadowInfo, this._shadowUBO);
                  }
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 0] = shadowInfo.size.x;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 1] = shadowInfo.size.y;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 2] = 1.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_WIDTH_HEIGHT_PCF_BIAS_INFO_OFFSET + 3] = 0.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 0] = LightType.POINT;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 1] = packing;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 2] = 0.0;
                  this._shadowUBO[UBOShadowEnum.SHADOW_LIGHT_PACKING_NBIAS_NULL_INFO_OFFSET + 3] = 0.0;
                  break;
                }
              default:
            }
            Color.toArray(this._shadowUBO, shadowInfo.shadowColor, UBOShadowEnum.SHADOW_COLOR_OFFSET);
            descriptorSet.update();
            cmdBuff.updateBuffer(descriptorSet.getBuffer(UBOShadow.BINDING), this._shadowUBO.buffer, this._shadowUBO.byteLength);
          }
        }
        _updateUBOs(camera, cmdBuff) {
          const {
            exposure
          } = camera;
          const sceneData = this._pipeline.pipelineSceneData;
          const isHDR = sceneData.isHDR;
          const shadowInfo = sceneData.shadows;
          const validPunctualLights = sceneData.validPunctualLights;
          if (validPunctualLights.length > this._lightBufferCount) {
            this._firstLightBufferView.destroy();
            this._lightBufferCount = nextPow2(validPunctualLights.length);
            this._lightBuffer.resize(this._lightBufferStride * this._lightBufferCount);
            this._lightBufferData = new Float32Array(this._lightBufferElementCount * this._lightBufferCount);
            this._firstLightBufferView = deviceManager.gfxDevice.createBuffer(new BufferViewInfo(this._lightBuffer, 0, UBOForwardLightEnum.SIZE));
          }
          for (let l = 0, offset = 0; l < validPunctualLights.length; l++, offset += this._lightBufferElementCount) {
            const light = validPunctualLights[l];
            switch (light.type) {
              case LightType.SPHERE:
                // UBOForwardLight
                Vec3.toArray(_vec4Array, light.position);
                _vec4Array[3] = LightType.SPHERE;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_POS_OFFSET);
                _vec4Array[0] = light.size;
                _vec4Array[1] = light.range;
                _vec4Array[2] = 0.0;
                _vec4Array[3] = 0.0;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET);

                // cc_lightColor
                Vec3.toArray(_vec4Array, light.color);
                if (light.useColorTemperature) {
                  const finalColor = light.finalColor;
                  _vec4Array[0] = finalColor.x;
                  _vec4Array[1] = finalColor.y;
                  _vec4Array[2] = finalColor.z;
                }
                if (isHDR) {
                  _vec4Array[3] = light.luminance * exposure * this._lightMeterScale;
                } else {
                  _vec4Array[3] = light.luminance;
                }
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_COLOR_OFFSET);
                break;
              case LightType.SPOT:
                // UBOForwardLight
                Vec3.toArray(_vec4Array, light.position);
                _vec4Array[3] = LightType.SPOT;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_POS_OFFSET);
                _vec4Array[0] = light.size;
                _vec4Array[1] = light.range;
                _vec4Array[2] = light.spotAngle;
                _vec4Array[3] = shadowInfo.enabled && light.shadowEnabled && shadowInfo.type === ShadowType.ShadowMap ? 1 : 0;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET);
                Vec3.toArray(_vec4Array, light.direction);
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_DIR_OFFSET);

                // cc_lightColor
                Vec3.toArray(_vec4Array, light.color);
                if (light.useColorTemperature) {
                  const finalColor = light.finalColor;
                  _vec4Array[0] = finalColor.x;
                  _vec4Array[1] = finalColor.y;
                  _vec4Array[2] = finalColor.z;
                }
                if (isHDR) {
                  _vec4Array[3] = light.luminance * exposure * this._lightMeterScale;
                } else {
                  _vec4Array[3] = light.luminance;
                }
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_COLOR_OFFSET);

                // cc_lightBoundingSizeVS, light angle attenuation strength
                _vec4Array[0] = 0;
                _vec4Array[1] = 0;
                _vec4Array[2] = 0;
                _vec4Array[3] = light.angleAttenuationStrength;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET);
                break;
              case LightType.POINT:
                // UBOForwardLight
                Vec3.toArray(_vec4Array, light.position);
                _vec4Array[3] = LightType.POINT;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_POS_OFFSET);
                _vec4Array[0] = 0.0;
                _vec4Array[1] = light.range;
                _vec4Array[2] = 0.0;
                _vec4Array[3] = 0.0;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET);

                // cc_lightColor
                Vec3.toArray(_vec4Array, light.color);
                if (light.useColorTemperature) {
                  const finalColor = light.finalColor;
                  _vec4Array[0] = finalColor.x;
                  _vec4Array[1] = finalColor.y;
                  _vec4Array[2] = finalColor.z;
                }
                if (isHDR) {
                  _vec4Array[3] = light.luminance * exposure * this._lightMeterScale;
                } else {
                  _vec4Array[3] = light.luminance;
                }
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_COLOR_OFFSET);
                break;
              case LightType.RANGED_DIRECTIONAL:
                // UBOForwardLight
                Vec3.toArray(_vec4Array, light.position);
                _vec4Array[3] = LightType.RANGED_DIRECTIONAL;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_POS_OFFSET);
                Vec3.toArray(_vec4Array, light.right);
                _vec4Array[3] = 0;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_SIZE_RANGE_ANGLE_OFFSET);
                Vec3.toArray(_vec4Array, light.direction);
                _vec4Array[3] = 0;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_DIR_OFFSET);

                // eslint-disable-next-line no-case-declarations
                const scale = light.scale;
                _v3.set(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5);
                Vec3.toArray(_vec4Array, _v3);
                _vec4Array[3] = 0;
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_BOUNDING_SIZE_VS_OFFSET);

                // cc_lightColor
                Vec3.toArray(_vec4Array, light.color);
                if (light.useColorTemperature) {
                  const finalColor = light.finalColor;
                  _vec4Array[0] = finalColor.x;
                  _vec4Array[1] = finalColor.y;
                  _vec4Array[2] = finalColor.z;
                }
                if (isHDR) {
                  _vec4Array[3] = light.illuminance * exposure;
                } else {
                  _vec4Array[3] = light.illuminance;
                }
                this._lightBufferData.set(_vec4Array, offset + UBOForwardLightEnum.LIGHT_COLOR_OFFSET);
                break;
              default:
            }
          }
          cmdBuff.updateBuffer(this._lightBuffer, this._lightBufferData.buffer, this._lightBufferData.byteLength);
        }
      });
    }
  };
});