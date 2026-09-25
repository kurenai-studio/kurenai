System.register("q-bundled:///fs/cocos/rendering/deferred/lighting-stage.js", ["../../core/data/decorators/index.js", "../../render-scene/scene/light.js", "../define.js", "../pass-phase.js", "../../gfx/index.js", "../render-stage.js", "../enum.js", "../planar-shadow-queue.js", "../../asset/assets/material.js", "../pipeline-state-manager.js", "../../core/geometry/index.js", "../../core/math/index.js", "../render-queue.js", "../pipeline-serialization.js", "../ui-phase.js", "../../core/geometry/aabb.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, type, serializable, LightType, UBODeferredLight, SetIndex, UBOForwardLight, UBOLocalEnum, getPhaseID, Color, Rect, BufferUsageBit, MemoryUsageBit, BufferInfo, BufferViewInfo, DescriptorSetInfo, ClearFlagBit, RenderStage, DeferredStagePriority, PlanarShadowQueue, Material, PipelineStateManager, intersect, Sphere, Vec3, Vec4, renderQueueClearFunc, convertRenderQueue, renderQueueSortFunc, RenderQueueDesc, UIPhase, AABB, geometry, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _LightingStage, _v3, _rangedDirLightBoundingBox, _tmpBoundingBox, colors, LightingStage;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_renderSceneSceneLightJs) {
      LightType = _renderSceneSceneLightJs.LightType;
    }, function (_defineJs) {
      UBODeferredLight = _defineJs.UBODeferredLight;
      SetIndex = _defineJs.SetIndex;
      UBOForwardLight = _defineJs.UBOForwardLight;
      UBOLocalEnum = _defineJs.UBOLocalEnum;
    }, function (_passPhaseJs) {
      getPhaseID = _passPhaseJs.getPhaseID;
    }, function (_gfxIndexJs) {
      Color = _gfxIndexJs.Color;
      Rect = _gfxIndexJs.Rect;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferViewInfo = _gfxIndexJs.BufferViewInfo;
      DescriptorSetInfo = _gfxIndexJs.DescriptorSetInfo;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
    }, function (_renderStageJs) {
      RenderStage = _renderStageJs.RenderStage;
    }, function (_enumJs) {
      DeferredStagePriority = _enumJs.DeferredStagePriority;
    }, function (_planarShadowQueueJs) {
      PlanarShadowQueue = _planarShadowQueueJs.PlanarShadowQueue;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_pipelineStateManagerJs) {
      PipelineStateManager = _pipelineStateManagerJs.PipelineStateManager;
    }, function (_coreGeometryIndexJs) {
      intersect = _coreGeometryIndexJs.intersect;
      Sphere = _coreGeometryIndexJs.Sphere;
    }, function (_coreMathIndexJs) {
      Vec3 = _coreMathIndexJs.Vec3;
      Vec4 = _coreMathIndexJs.Vec4;
    }, function (_renderQueueJs) {
      renderQueueClearFunc = _renderQueueJs.renderQueueClearFunc;
      convertRenderQueue = _renderQueueJs.convertRenderQueue;
      renderQueueSortFunc = _renderQueueJs.renderQueueSortFunc;
    }, function (_pipelineSerializationJs) {
      RenderQueueDesc = _pipelineSerializationJs.RenderQueueDesc;
    }, function (_uiPhaseJs) {
      UIPhase = _uiPhaseJs.UIPhase;
    }, function (_coreGeometryAabbJs) {
      AABB = _coreGeometryAabbJs.AABB;
    }, function (_coreIndexJs) {
      geometry = _coreIndexJs.geometry;
    }],
    execute: function () {
      /*
       Copyright (c) Huawei Technologies Co., Ltd. 2020-2021.
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      /**
       * @category pipeline
       */
      _v3 = new Vec3();
      _rangedDirLightBoundingBox = new AABB(0.0, 0.0, 0.0, 0.5, 0.5, 0.5);
      _tmpBoundingBox = new AABB();
      colors = [new Color(0, 0, 0, 1)];
      /**
       * @en The lighting render stage
       * @zh 前向渲染阶段。
       */
      _export("LightingStage", LightingStage = (_dec = ccclass('LightingStage'), _dec2 = type(Material), _dec3 = displayOrder(3), _dec4 = type([RenderQueueDesc]), _dec5 = displayOrder(2), _dec(_class = (_class2 = (_LightingStage = class LightingStage extends RenderStage {
        constructor() {
          super();
          this._deferredLitsBufs = null;
          this._maxDeferredLights = UBODeferredLight.LIGHTS_PER_PASS;
          this._lightBufferData = null;
          this._lightMeterScale = 10000.0;
          this._descriptorSet = null;
          this._renderArea = new Rect();
          this._planarQueue = null;
          this._uiPhase = new UIPhase();
          _initializerDefineProperty(this, "_deferredMaterial", _descriptor, this);
          _initializerDefineProperty(this, "renderQueues", _descriptor2, this);
          this._phaseID = getPhaseID('default');
          this._renderQueues = [];
        }
        initialize(info) {
          super.initialize(info);
          return true;
        }
        gatherLights(camera) {
          const pipeline = this._pipeline;
          const isHDR = pipeline.pipelineSceneData.isHDR;
          const cmdBuff = pipeline.commandBuffers[0];
          const sphereLights = camera.scene.sphereLights;
          const spotLights = camera.scene.spotLights;
          const pointLights = camera.scene.pointLights;
          const rangedDirLights = camera.scene.rangedDirLights;
          const _sphere = Sphere.create(0, 0, 0, 1);
          const _vec4Array = new Float32Array(4);
          const exposure = camera.exposure;
          let idx = 0;
          const elementLen = Vec4.length; // sizeof(vec4) / sizeof(float32)
          const fieldLen = elementLen * this._maxDeferredLights;
          for (let i = 0; i < sphereLights.length && idx < this._maxDeferredLights; i++, ++idx) {
            const light = sphereLights[i];
            Sphere.set(_sphere, light.position.x, light.position.y, light.position.z, light.range);
            if (intersect.sphereFrustum(_sphere, camera.frustum)) {
              // cc_lightPos
              Vec3.toArray(_vec4Array, light.position);
              _vec4Array[3] = LightType.SPHERE;
              this._lightBufferData.set(_vec4Array, idx * elementLen);

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
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 1);

              // cc_lightSizeRangeAngle
              _vec4Array[0] = light.size;
              _vec4Array[1] = light.range;
              _vec4Array[2] = 0.0;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 2);
            }
          }
          for (let i = 0; i < spotLights.length && idx < this._maxDeferredLights; i++, ++idx) {
            const light = spotLights[i];
            Sphere.set(_sphere, light.position.x, light.position.y, light.position.z, light.range);
            if (intersect.sphereFrustum(_sphere, camera.frustum)) {
              // cc_lightPos
              Vec3.toArray(_vec4Array, light.position);
              _vec4Array[3] = LightType.SPOT;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 0);

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
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 1);

              // cc_lightSizeRangeAngle
              _vec4Array[0] = light.size;
              _vec4Array[1] = light.range;
              _vec4Array[2] = light.spotAngle;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 2);

              // cc_lightDir
              Vec3.toArray(_vec4Array, light.direction);
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 3);
            }
          }
          for (let i = 0; i < pointLights.length && idx < this._maxDeferredLights; i++, ++idx) {
            const light = pointLights[i];
            Sphere.set(_sphere, light.position.x, light.position.y, light.position.z, light.range);
            if (intersect.sphereFrustum(_sphere, camera.frustum)) {
              // cc_lightPos
              Vec3.toArray(_vec4Array, light.position);
              _vec4Array[3] = LightType.POINT;
              this._lightBufferData.set(_vec4Array, idx * elementLen);

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
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 1);

              // cc_lightSizeRangeAngle
              _vec4Array[0] = 0.0;
              _vec4Array[1] = light.range;
              _vec4Array[2] = 0.0;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 2);
            }
          }
          for (let i = 0; i < rangedDirLights.length && idx < this._maxDeferredLights; i++, ++idx) {
            const light = rangedDirLights[i];
            AABB.transform(_tmpBoundingBox, _rangedDirLightBoundingBox, light.node.getWorldMatrix());
            if (geometry.intersect.aabbFrustum(_tmpBoundingBox, camera.frustum)) {
              // UBOForwardLight
              Vec3.toArray(_vec4Array, light.position);
              _vec4Array[3] = LightType.RANGED_DIRECTIONAL;
              this._lightBufferData.set(_vec4Array, idx * elementLen);

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
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 1);
              Vec3.toArray(_vec4Array, light.right);
              _vec4Array[3] = 0;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 2);
              Vec3.toArray(_vec4Array, light.direction);
              _vec4Array[3] = 0;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 3);

              // eslint-disable-next-line no-case-declarations
              const scale = light.scale;
              _v3.set(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5);
              Vec3.toArray(_vec4Array, _v3);
              _vec4Array[3] = 0;
              this._lightBufferData.set(_vec4Array, idx * elementLen + fieldLen * 4);
            }
          }

          // the count of lights is set to cc_lightDir[0].w
          const offset = fieldLen * 3 + 3;
          this._lightBufferData.set([idx], offset);
          cmdBuff.updateBuffer(this._deferredLitsBufs, this._lightBufferData);
        }
        _createStageDescriptor(pass) {
          const device = this._pipeline.device;
          let totalSize = Float32Array.BYTES_PER_ELEMENT * 4 * 4 * this._maxDeferredLights;
          totalSize = Math.ceil(totalSize / device.capabilities.uboOffsetAlignment) * device.capabilities.uboOffsetAlignment;
          this._deferredLitsBufs = device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, totalSize, device.capabilities.uboOffsetAlignment));
          const deferredLitsBufView = device.createBuffer(new BufferViewInfo(this._deferredLitsBufs, 0, totalSize));
          this._lightBufferData = new Float32Array(totalSize / Float32Array.BYTES_PER_ELEMENT);
          this._descriptorSet = device.createDescriptorSet(new DescriptorSetInfo(pass.localSetLayout));
          this._descriptorSet.bindBuffer(UBOForwardLight.BINDING, deferredLitsBufView);
          const _localUBO = device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, UBOLocalEnum.SIZE, UBOLocalEnum.SIZE));
          this._descriptorSet.bindBuffer(UBOLocalEnum.BINDING, _localUBO);
        }
        activate(pipeline, flow) {
          super.activate(pipeline, flow);
          this._uiPhase.activate(pipeline);

          // activate queue
          for (let i = 0; i < this.renderQueues.length; i++) {
            this._renderQueues[i] = convertRenderQueue(this.renderQueues[i]);
          }
          this._planarQueue = new PlanarShadowQueue(this._pipeline);
          if (this._deferredMaterial) {
            pipeline.pipelineSceneData.deferredLightingMaterial = this._deferredMaterial;
          }
        }
        destroy() {
          var _this$_deferredLitsBu;
          (_this$_deferredLitsBu = this._deferredLitsBufs) == null || _this$_deferredLitsBu.destroy();
          this._deferredLitsBufs = null;
          this._descriptorSet = null;
        }
        render(camera) {
          var _camera$geometryRende;
          const pipeline = this._pipeline;
          const device = pipeline.device;
          const cmdBuff = pipeline.commandBuffers[0];
          const sceneData = pipeline.pipelineSceneData;
          const renderObjects = sceneData.renderObjects;
          this._planarQueue.gatherShadowPasses(camera, cmdBuff);
          pipeline.generateRenderArea(camera, this._renderArea);
          // Lighting
          const deferredData = pipeline.getPipelineRenderData();
          const lightingMat = sceneData.deferredLightingMaterial;
          const pass = lightingMat.passes[0];
          const shader = pass.getShaderVariant();
          for (let i = 0; i < 3; ++i) {
            pass.descriptorSet.bindTexture(i, deferredData.gbufferRenderTargets[i]);
            pass.descriptorSet.bindSampler(i, deferredData.sampler);
          }
          pass.descriptorSet.bindTexture(3, deferredData.outputDepth);
          pass.descriptorSet.bindSampler(3, deferredData.sampler);
          pass.descriptorSet.update();
          if (!this._descriptorSet) {
            this._createStageDescriptor(pass);
          }
          // light信息
          this.gatherLights(camera);
          if (camera.clearFlag & ClearFlagBit.COLOR) {
            colors[0].x = camera.clearColor.x;
            colors[0].y = camera.clearColor.y;
            colors[0].z = camera.clearColor.z;
          }
          colors[0].w = 0;
          const framebuffer = deferredData.outputFrameBuffer;
          const renderPass = framebuffer.renderPass;
          pipeline.pipelineUBO.updateShadowUBO(camera);
          cmdBuff.beginRenderPass(renderPass, framebuffer, this._renderArea, colors, camera.clearDepth, camera.clearStencil);
          cmdBuff.setScissor(pipeline.generateScissor(camera));
          cmdBuff.setViewport(pipeline.generateViewport(camera));
          cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, pipeline.descriptorSet);
          const inputAssembler = pipeline.quadIAOffscreen;
          let pso = null;
          if (pass != null && shader != null && inputAssembler != null) {
            pso = PipelineStateManager.getOrCreatePipelineState(device, pass, shader, renderPass, inputAssembler);
          }
          if (pso != null) {
            this._descriptorSet.update();
            cmdBuff.bindPipelineState(pso);
            cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
            cmdBuff.bindDescriptorSet(SetIndex.LOCAL, this._descriptorSet);
            cmdBuff.bindInputAssembler(inputAssembler);
            cmdBuff.draw(inputAssembler);
          }

          // Transparent
          this._renderQueues.forEach(renderQueueClearFunc);
          let m = 0;
          let p = 0;
          let k = 0;
          for (let i = 0; i < renderObjects.length; ++i) {
            const ro = renderObjects[i];
            const subModels = ro.model.subModels;
            for (m = 0; m < subModels.length; ++m) {
              const subModel = subModels[m];
              const passes = subModel.passes;
              for (p = 0; p < passes.length; ++p) {
                const pass = passes[p];
                if (pass.phase !== this._phaseID) continue;
                for (k = 0; k < this._renderQueues.length; k++) {
                  this._renderQueues[k].insertRenderPass(ro, m, p);
                }
              }
            }
          }
          if (renderObjects.length > 0) {
            this._renderQueues.forEach(renderQueueSortFunc);
            for (let i = 0; i < this._renderQueues.length; i++) {
              this._renderQueues[i].recordCommandBuffer(device, renderPass, cmdBuff);
            }

            // planarQueue
            this._planarQueue.recordCommandBuffer(device, renderPass, cmdBuff);
          }
          (_camera$geometryRende = camera.geometryRenderer) == null || _camera$geometryRende.render(renderPass, cmdBuff, pipeline.pipelineSceneData);
          this._uiPhase.render(camera, renderPass);
          cmdBuff.endRenderPass();
        }
      }, _LightingStage.initInfo = {
        name: 'LightingStage',
        priority: DeferredStagePriority.LIGHTING,
        tag: 0
      }, _LightingStage), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_deferredMaterial", [_dec2, serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "renderQueues", [_dec4, serializable, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
    }
  };
});