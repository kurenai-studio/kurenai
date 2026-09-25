System.register("q-bundled:///fs/cocos/rendering/deferred/postprocess-stage.js", ["../../core/data/decorators/index.js", "../define.js", "../../gfx/index.js", "../render-stage.js", "../enum.js", "../../asset/assets/material.js", "../pipeline-state-manager.js", "../pipeline-serialization.js", "../pipeline-funcs.js", "../ui-phase.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, type, serializable, SetIndex, UBOLocalEnum, Color, Rect, ClearFlagBit, DescriptorSetInfo, BufferInfo, BufferUsageBit, MemoryUsageBit, RenderStage, CommonStagePriority, Material, PipelineStateManager, RenderQueueDesc, renderProfiler, UIPhase, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _PostProcessStage, colors, PostProcessStage;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      displayOrder = _coreDataDecoratorsIndexJs.displayOrder;
      type = _coreDataDecoratorsIndexJs.type;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_defineJs) {
      SetIndex = _defineJs.SetIndex;
      UBOLocalEnum = _defineJs.UBOLocalEnum;
    }, function (_gfxIndexJs) {
      Color = _gfxIndexJs.Color;
      Rect = _gfxIndexJs.Rect;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      DescriptorSetInfo = _gfxIndexJs.DescriptorSetInfo;
      BufferInfo = _gfxIndexJs.BufferInfo;
      BufferUsageBit = _gfxIndexJs.BufferUsageBit;
      MemoryUsageBit = _gfxIndexJs.MemoryUsageBit;
    }, function (_renderStageJs) {
      RenderStage = _renderStageJs.RenderStage;
    }, function (_enumJs) {
      CommonStagePriority = _enumJs.CommonStagePriority;
    }, function (_assetAssetsMaterialJs) {
      Material = _assetAssetsMaterialJs.Material;
    }, function (_pipelineStateManagerJs) {
      PipelineStateManager = _pipelineStateManagerJs.PipelineStateManager;
    }, function (_pipelineSerializationJs) {
      RenderQueueDesc = _pipelineSerializationJs.RenderQueueDesc;
    }, function (_pipelineFuncsJs) {
      renderProfiler = _pipelineFuncsJs.renderProfiler;
    }, function (_uiPhaseJs) {
      UIPhase = _uiPhaseJs.UIPhase;
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
        * @en The postprocess render stage
        * @zh 后处理渲染阶段。
        */
      _export("PostProcessStage", PostProcessStage = (_dec = ccclass('PostProcessStage'), _dec2 = type(Material), _dec3 = displayOrder(3), _dec4 = type([RenderQueueDesc]), _dec5 = displayOrder(2), _dec(_class = (_class2 = (_PostProcessStage = class PostProcessStage extends RenderStage {
        constructor() {
          super();
          _initializerDefineProperty(this, "_postProcessMaterial", _descriptor, this);
          _initializerDefineProperty(this, "renderQueues", _descriptor2, this);
          this._renderArea = new Rect();
          this._stageDesc = null;
          this._localUBO = null;
          this._uiPhase = new UIPhase();
        }
        initialize(info) {
          super.initialize(info);
          return true;
        }
        activate(pipeline, flow) {
          super.activate(pipeline, flow);
          if (this._postProcessMaterial) {
            pipeline.pipelineSceneData.postprocessMaterial = this._postProcessMaterial;
          }
          this._uiPhase.activate(pipeline);
        }
        destroy() {}
        render(camera) {
          const pipeline = this._pipeline;
          const device = pipeline.device;
          const sceneData = pipeline.pipelineSceneData;
          const cmdBuff = pipeline.commandBuffers[0];
          pipeline.pipelineUBO.updateCameraUBO(camera);
          const vp = camera.viewport;
          this._renderArea.x = vp.x * camera.window.width;
          this._renderArea.y = vp.y * camera.window.height;
          this._renderArea.width = vp.width * camera.window.width;
          this._renderArea.height = vp.height * camera.window.height;
          const renderData = pipeline.getPipelineRenderData();
          const framebuffer = camera.window.framebuffer;
          const renderPass = pipeline.getRenderPass(camera.clearFlag, framebuffer);
          if (camera.clearFlag & ClearFlagBit.COLOR) {
            colors[0].x = camera.clearColor.x;
            colors[0].y = camera.clearColor.y;
            colors[0].z = camera.clearColor.z;
          }
          colors[0].w = camera.clearColor.w;
          cmdBuff.beginRenderPass(renderPass, framebuffer, this._renderArea, colors, camera.clearDepth, camera.clearStencil);
          cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, pipeline.descriptorSet);
          // Postprocess
          const builtinPostProcess = sceneData.postprocessMaterial;
          const pass = builtinPostProcess.passes[0];
          const shader = pass.getShaderVariant();
          if (pipeline.bloomEnabled) {
            pass.descriptorSet.bindTexture(0, renderData.bloom.combineTex);
          } else {
            pass.descriptorSet.bindTexture(0, renderData.outputRenderTargets[0]);
          }
          pass.descriptorSet.bindSampler(0, renderData.sampler);
          pass.descriptorSet.update();
          const inputAssembler = camera.window.swapchain ? pipeline.quadIAOnscreen : pipeline.quadIAOffscreen;
          let pso = null;
          if (pass != null && shader != null && inputAssembler != null) {
            pso = PipelineStateManager.getOrCreatePipelineState(device, pass, shader, renderPass, inputAssembler);
          }
          const renderObjects = pipeline.pipelineSceneData.renderObjects;
          if (pso != null && renderObjects.length > 0) {
            if (!this._stageDesc) {
              this._stageDesc = device.createDescriptorSet(new DescriptorSetInfo(pass.localSetLayout));
              this._localUBO = device.createBuffer(new BufferInfo(BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST, MemoryUsageBit.DEVICE, UBOLocalEnum.SIZE, UBOLocalEnum.SIZE));
              this._stageDesc.bindBuffer(UBOLocalEnum.BINDING, this._localUBO);
            }
            this._stageDesc.update();
            cmdBuff.bindPipelineState(pso);
            cmdBuff.bindDescriptorSet(SetIndex.MATERIAL, pass.descriptorSet);
            cmdBuff.bindDescriptorSet(SetIndex.LOCAL, this._stageDesc);
            cmdBuff.bindInputAssembler(inputAssembler);
            cmdBuff.draw(inputAssembler);
          }
          this._uiPhase.render(camera, renderPass);
          renderProfiler(device, renderPass, cmdBuff, pipeline.profiler, camera);
          cmdBuff.endRenderPass();
        }
      }, _PostProcessStage.initInfo = {
        name: 'PostProcessStage',
        priority: CommonStagePriority.POST_PROCESS,
        tag: 0
      }, _PostProcessStage), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_postProcessMaterial", [_dec2, serializable, _dec3], {
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