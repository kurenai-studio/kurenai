System.register("q-bundled:///fs/cocos/rendering/deferred/bloom-stage.js", ["../../core/data/decorators/index.js", "../define.js", "../../asset/assets/material.js", "../../gfx/index.js", "../pipeline-state-manager.js", "../render-stage.js", "../enum.js", "../render-pipeline.js", "./deferred-pipeline-scene-data.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, serializable, type, SetIndex, Material, BufferInfo, BufferUsageBit, ClearFlagBit, Color, MemoryUsageBit, Rect, PipelineStateManager, RenderStage, CommonStagePriority, MAX_BLOOM_FILTER_PASS_NUM, BLOOM_COMBINEPASS_INDEX, BLOOM_DOWNSAMPLEPASS_INDEX, BLOOM_PREFILTERPASS_INDEX, BLOOM_UPSAMPLEPASS_INDEX, UBOBloom, _UBOBloom, _dec, _dec2, _dec3, _class, _class2, _descriptor, _BloomStage, colors, BloomStage;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_defineJs) {
      SetIndex = _defineJs.SetIndex;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_gfxIndexJs) {
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Color = _gfxIndexJs.Color;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
      Rect = _gfxIndexJs.Rect;
    }, function (_pipelineStateManagerJs) {
      PipelineStateManager = _pipelineStateManagerJs.PipelineStateManager;
    }, function (_renderStageJs) {
      RenderStage = _renderStageJs.RenderStage;
    }, function (_enumJs) {
      CommonStagePriority = _enumJs.CommonStagePriority;
    }, function (_renderPipelineJs) {
      MAX_BLOOM_FILTER_PASS_NUM = _renderPipelineJs.MAX_BLOOM_FILTER_PASS_NUM;
    }, function (_deferredPipelineSceneDataJs) {
      BLOOM_COMBINEPASS_INDEX = _deferredPipelineSceneDataJs.BLOOM_COMBINEPASS_INDEX;
      BLOOM_DOWNSAMPLEPASS_INDEX = _deferredPipelineSceneDataJs.BLOOM_DOWNSAMPLEPASS_INDEX;
      BLOOM_PREFILTERPASS_INDEX = _deferredPipelineSceneDataJs.BLOOM_PREFILTERPASS_INDEX;
      BLOOM_UPSAMPLEPASS_INDEX = _deferredPipelineSceneDataJs.BLOOM_UPSAMPLEPASS_INDEX;
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
      colors = [new Color(0, 0, 0, 1)];
      /**
       * @en The uniform buffer object for bloom
       * @zh Bloom UBO。
       */
      UBOBloom = class UBOBloom {};
      /**
       * @en The bloom post-process stage
       * @zh Bloom 后处理阶段。
       */
      _UBOBloom = UBOBloom;
      UBOBloom.TEXTURE_SIZE_OFFSET = 0;
      UBOBloom.COUNT = _UBOBloom.TEXTURE_SIZE_OFFSET + 4;
      UBOBloom.SIZE = _UBOBloom.COUNT * 4;
      _export("BloomStage", BloomStage = (_dec = ccclass('BloomStage'), _dec2 = type(Material), _dec3 = displayOrder(3), _dec(_class = (_class2 = (_BloomStage = class BloomStage extends RenderStage {
        constructor() {
          super();
          this.threshold = 1.0;
          this.intensity = 0.8;
          this.iterations = 2;
          _initializerDefineProperty(this, "_bloomMaterial", _descriptor, this);
          this._renderArea = new Rect();
          this._bloomUBO = [];
        }
        initialize(info) {
          super.initialize(info);
          return true;
        }
        activate(pipeline, flow) {
          super.activate(pipeline, flow);
          if (this._bloomMaterial) {
            pipeline.pipelineSceneData.bloomMaterial = this._bloomMaterial;
          }
        }
        destroy() {}
        render(camera) {
          var _camera$window;
          const pipeline = this._pipeline;
          pipeline.generateBloomRenderData();
          if (!((_camera$window = camera.window) != null && _camera$window.swapchain) && !pipeline.macros.CC_PIPELINE_TYPE) {
            return;
          }
          if (!pipeline.bloomEnabled || pipeline.pipelineSceneData.renderObjects.length === 0) return;
          if (this._bloomUBO.length === 0) {
            const passNumber = MAX_BLOOM_FILTER_PASS_NUM * 2 + 2;
            for (let i = 0; i < passNumber; ++i) {
              this._bloomUBO[i] = pipeline.device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.HOST | MemoryUsageBit.DEVICE, UBOBloom.SIZE, UBOBloom.SIZE));
            }
          }
          if (camera.clearFlag & ClearFlagBit.COLOR) {
            colors[0].x = camera.clearColor.x;
            colors[0].y = camera.clearColor.y;
            colors[0].z = camera.clearColor.z;
          }
          colors[0].w = camera.clearColor.w;
          this._prefilterPass(camera, pipeline);
          this._downsamplePass(camera, pipeline);
          this._upsamplePass(camera, pipeline);
          this._combinePass(camera, pipeline);
        }
        _prefilterPass(camera, pipeline) {
          pipeline.generateRenderArea(camera, this._renderArea);
          this._renderArea.width >>= 1;
          this._renderArea.height >>= 1;
          const cmdBuff = pipeline.commandBuffers[0];
          const sceneData = pipeline.pipelineSceneData;
          const builtinBloomProcess = sceneData.bloomMaterial;
          const pass = builtinBloomProcess.passes[BLOOM_PREFILTERPASS_INDEX];
          const renderData = pipeline.getPipelineRenderData();
          const bloomData = renderData.bloom;
          const textureSize = new Float32Array(UBOBloom.COUNT);
          textureSize[UBOBloom.TEXTURE_SIZE_OFFSET + 2] = this.threshold;
          cmdBuff.updateBuffer(this._bloomUBO[0], textureSize);
          cmdBuff.beginRenderPass(bloomData.renderPass, bloomData.prefilterFramebuffer, this._renderArea, colors, 0, 0);
          cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, pipeline.descriptorSet);
          pass.descriptorSet.bindBuffer(0, this._bloomUBO[0]);
          pass.descriptorSet.bindTexture(1, renderData.outputRenderTargets[0]);
          pass.descriptorSet.bindSampler(1, bloomData.sampler);
          pass.descriptorSet.update();
          cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
          const inputAssembler = camera.window.swapchain ? pipeline.quadIAOffscreen : pipeline.quadIAOnscreen;
          let pso = null;
          const shader = pass.getShaderVariant();
          if (pass != null && shader != null && inputAssembler != null) {
            pso = PipelineStateManager.getOrCreatePipelineState(pipeline.device, pass, shader, bloomData.renderPass, inputAssembler);
          }
          if (pso != null) {
            cmdBuff.bindPipelineState(pso);
            cmdBuff.bindInputAssembler(inputAssembler);
            cmdBuff.draw(inputAssembler);
          }
          cmdBuff.endRenderPass();
        }
        _downsamplePass(camera, pipeline) {
          pipeline.generateRenderArea(camera, this._renderArea);
          this._renderArea.width >>= 1;
          this._renderArea.height >>= 1;
          const cmdBuff = pipeline.commandBuffers[0];
          const sceneData = pipeline.pipelineSceneData;
          const builtinBloomProcess = sceneData.bloomMaterial;
          const bloomData = pipeline.getPipelineRenderData().bloom;
          const textureSize = new Float32Array(UBOBloom.COUNT);
          for (let i = 0; i < this.iterations; ++i) {
            textureSize[UBOBloom.TEXTURE_SIZE_OFFSET + 0] = this._renderArea.width;
            textureSize[UBOBloom.TEXTURE_SIZE_OFFSET + 1] = this._renderArea.height;
            cmdBuff.updateBuffer(this._bloomUBO[i + 1], textureSize);
            this._renderArea.width >>= 1;
            this._renderArea.height >>= 1;
            cmdBuff.beginRenderPass(bloomData.renderPass, bloomData.downsampleFramebuffers[i], this._renderArea, colors, 0, 0);
            const pass = builtinBloomProcess.passes[BLOOM_DOWNSAMPLEPASS_INDEX + i];
            const shader = pass.getShaderVariant();
            pass.descriptorSet.bindBuffer(0, this._bloomUBO[i + 1]);
            if (i === 0) {
              pass.descriptorSet.bindTexture(1, bloomData.prefiterTex);
            } else {
              pass.descriptorSet.bindTexture(1, bloomData.downsampleTexs[i - 1]);
            }
            pass.descriptorSet.bindSampler(1, bloomData.sampler);
            pass.descriptorSet.update();
            cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
            const inputAssembler = camera.window.swapchain ? pipeline.quadIAOffscreen : pipeline.quadIAOnscreen;
            let pso = null;
            if (pass != null && shader != null && inputAssembler != null) {
              pso = PipelineStateManager.getOrCreatePipelineState(pipeline.device, pass, shader, bloomData.renderPass, inputAssembler);
            }
            if (pso != null) {
              cmdBuff.bindPipelineState(pso);
              cmdBuff.bindInputAssembler(inputAssembler);
              cmdBuff.draw(inputAssembler);
            }
            cmdBuff.endRenderPass();
          }
        }
        _upsamplePass(camera, pipeline) {
          const bloomData = pipeline.getPipelineRenderData().bloom;
          pipeline.generateRenderArea(camera, this._renderArea);
          this._renderArea.width >>= this.iterations + 1;
          this._renderArea.height >>= this.iterations + 1;
          const cmdBuff = pipeline.commandBuffers[0];
          const sceneData = pipeline.pipelineSceneData;
          const builtinBloomProcess = sceneData.bloomMaterial;
          const textureSize = new Float32Array(UBOBloom.COUNT);
          for (let i = 0; i < this.iterations; ++i) {
            const index = i + MAX_BLOOM_FILTER_PASS_NUM + 1;
            textureSize[UBOBloom.TEXTURE_SIZE_OFFSET + 0] = this._renderArea.width;
            textureSize[UBOBloom.TEXTURE_SIZE_OFFSET + 1] = this._renderArea.height;
            cmdBuff.updateBuffer(this._bloomUBO[index], textureSize);
            this._renderArea.width <<= 1;
            this._renderArea.height <<= 1;
            cmdBuff.beginRenderPass(bloomData.renderPass, bloomData.upsampleFramebuffers[this.iterations - 1 - i], this._renderArea, colors, 0, 0);
            const pass = builtinBloomProcess.passes[BLOOM_UPSAMPLEPASS_INDEX + i];
            const shader = pass.getShaderVariant();
            pass.descriptorSet.bindBuffer(0, this._bloomUBO[index]);
            if (i === 0) {
              pass.descriptorSet.bindTexture(1, bloomData.downsampleTexs[this.iterations - 1]);
            } else {
              pass.descriptorSet.bindTexture(1, bloomData.upsampleTexs[this.iterations - i]);
            }
            pass.descriptorSet.bindSampler(1, bloomData.sampler);
            pass.descriptorSet.update();
            cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
            const inputAssembler = camera.window.swapchain ? pipeline.quadIAOffscreen : pipeline.quadIAOnscreen;
            let pso = null;
            if (pass != null && shader != null && inputAssembler != null) {
              pso = PipelineStateManager.getOrCreatePipelineState(pipeline.device, pass, shader, bloomData.renderPass, inputAssembler);
            }
            if (pso != null) {
              cmdBuff.bindPipelineState(pso);
              cmdBuff.bindInputAssembler(inputAssembler);
              cmdBuff.draw(inputAssembler);
            }
            cmdBuff.endRenderPass();
          }
        }
        _combinePass(camera, pipeline) {
          pipeline.generateRenderArea(camera, this._renderArea);
          const cmdBuff = pipeline.commandBuffers[0];
          const sceneData = pipeline.pipelineSceneData;
          const builtinBloomProcess = sceneData.bloomMaterial;
          const deferredData = pipeline.getPipelineRenderData();
          const bloomData = deferredData.bloom;
          const uboIndex = MAX_BLOOM_FILTER_PASS_NUM * 2 + 1;
          const textureSize = new Float32Array(UBOBloom.COUNT);
          textureSize[UBOBloom.TEXTURE_SIZE_OFFSET + 3] = this.intensity;
          cmdBuff.updateBuffer(this._bloomUBO[uboIndex], textureSize);
          cmdBuff.beginRenderPass(bloomData.renderPass, bloomData.combineFramebuffer, this._renderArea, colors, 0, 0);
          cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, pipeline.descriptorSet);
          const pass = builtinBloomProcess.passes[BLOOM_COMBINEPASS_INDEX];
          pass.descriptorSet.bindBuffer(0, this._bloomUBO[uboIndex]);
          pass.descriptorSet.bindTexture(1, deferredData.outputRenderTargets[0]);
          pass.descriptorSet.bindTexture(2, bloomData.upsampleTexs[0]);
          pass.descriptorSet.bindSampler(1, bloomData.sampler);
          pass.descriptorSet.bindSampler(2, bloomData.sampler);
          pass.descriptorSet.update();
          cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
          const inputAssembler = camera.window.swapchain ? pipeline.quadIAOffscreen : pipeline.quadIAOnscreen;
          let pso = null;
          const shader = pass.getShaderVariant();
          if (pass != null && shader != null && inputAssembler != null) {
            pso = PipelineStateManager.getOrCreatePipelineState(pipeline.device, pass, shader, bloomData.renderPass, inputAssembler);
          }
          if (pso != null) {
            cmdBuff.bindPipelineState(pso);
            cmdBuff.bindInputAssembler(inputAssembler);
            cmdBuff.draw(inputAssembler);
          }
          cmdBuff.endRenderPass();
        }
      }, _BloomStage.initInfo = {
        name: 'BloomStage',
        priority: CommonStagePriority.BLOOM,
        tag: 0
      }, _BloomStage), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_bloomMaterial", [_dec2, serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class));
    }
  };
});