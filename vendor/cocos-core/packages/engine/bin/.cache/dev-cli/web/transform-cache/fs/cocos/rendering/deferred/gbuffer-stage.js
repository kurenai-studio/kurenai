System.register("q-bundled:///fs/cocos/rendering/deferred/gbuffer-stage.js", ["../../core/data/decorators/index.js", "../define.js", "../pass-phase.js", "../render-queue.js", "../../gfx/index.js", "../pipeline-funcs.js", "../render-instanced-queue.js", "../render-stage.js", "../enum.js", "../../render-scene/core/pass.js", "../pipeline-serialization.js"], function (_export, _context) {
  "use strict";

  var ccclass, displayOrder, type, serializable, SetIndex, getPhaseID, renderQueueClearFunc, convertRenderQueue, renderQueueSortFunc, ClearFlagBit, Color, Rect, SRGBToLinear, RenderInstancedQueue, RenderStage, DeferredStagePriority, BatchingSchemes, RenderQueueDesc, RenderQueueSortMode, _dec, _dec2, _dec3, _class, _class2, _descriptor, _GbufferStage, colors, GbufferStage;
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
    }, function (_passPhaseJs) {
      getPhaseID = _passPhaseJs.getPhaseID;
    }, function (_renderQueueJs) {
      renderQueueClearFunc = _renderQueueJs.renderQueueClearFunc;
      convertRenderQueue = _renderQueueJs.convertRenderQueue;
      renderQueueSortFunc = _renderQueueJs.renderQueueSortFunc;
    }, function (_gfxIndexJs) {
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
      Color = _gfxIndexJs.Color;
      Rect = _gfxIndexJs.Rect;
    }, function (_pipelineFuncsJs) {
      SRGBToLinear = _pipelineFuncsJs.SRGBToLinear;
    }, function (_renderInstancedQueueJs) {
      RenderInstancedQueue = _renderInstancedQueueJs.RenderInstancedQueue;
    }, function (_renderStageJs) {
      RenderStage = _renderStageJs.RenderStage;
    }, function (_enumJs) {
      DeferredStagePriority = _enumJs.DeferredStagePriority;
    }, function (_renderSceneCorePassJs) {
      BatchingSchemes = _renderSceneCorePassJs.BatchingSchemes;
    }, function (_pipelineSerializationJs) {
      RenderQueueDesc = _pipelineSerializationJs.RenderQueueDesc;
      RenderQueueSortMode = _pipelineSerializationJs.RenderQueueSortMode;
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
      colors = [new Color(0, 0, 0, 0), new Color(0, 0, 0, 0), new Color(0, 0, 0, 0)];
      /**
       * @en The gbuffer render stage
       * @zh 前向渲染阶段。
       */
      _export("GbufferStage", GbufferStage = (_dec = ccclass('GbufferStage'), _dec2 = type([RenderQueueDesc]), _dec3 = displayOrder(2), _dec(_class = (_class2 = (_GbufferStage = class GbufferStage extends RenderStage {
        constructor() {
          super();
          _initializerDefineProperty(this, "renderQueues", _descriptor, this);
          this._renderQueues = [];
          this._renderArea = new Rect();
          this._instancedQueue = new RenderInstancedQueue();
          this._phaseID = getPhaseID('default');
        }
        initialize(info) {
          super.initialize(info);
          if (info.renderQueues) {
            this.renderQueues = info.renderQueues;
          }
          return true;
        }
        activate(pipeline, flow) {
          super.activate(pipeline, flow);
          for (let i = 0; i < this.renderQueues.length; i++) {
            this._renderQueues[i] = convertRenderQueue(this.renderQueues[i]);
          }
        }
        destroy() {}
        render(camera) {
          this._instancedQueue.clear();
          const pipeline = this._pipeline;
          const device = pipeline.device;
          this._renderQueues.forEach(renderQueueClearFunc);
          pipeline.generateRenderArea(camera, this._renderArea);
          pipeline.updateQuadVertexData(this._renderArea, camera.window);
          const renderObjects = pipeline.pipelineSceneData.renderObjects;
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
                const batchingScheme = pass.batchingScheme;
                if (batchingScheme === BatchingSchemes.INSTANCING) {
                  const instancedBuffer = pass.getInstancedBuffer();
                  instancedBuffer.merge(subModel, p);
                  this._instancedQueue.queue.add(instancedBuffer);
                } else {
                  for (k = 0; k < this._renderQueues.length; k++) {
                    this._renderQueues[k].insertRenderPass(ro, m, p);
                  }
                }
              }
            }
          }
          this._renderQueues.forEach(renderQueueSortFunc);
          const cmdBuff = pipeline.commandBuffers[0];
          this._instancedQueue.uploadBuffers(cmdBuff);
          if (camera.clearFlag & ClearFlagBit.COLOR) {
            if (pipeline.pipelineSceneData.isHDR) {
              SRGBToLinear(colors[0], camera.clearColor);
            } else {
              colors[0].x = camera.clearColor.x;
              colors[0].y = camera.clearColor.y;
              colors[0].z = camera.clearColor.z;
            }
          }
          colors[0].w = camera.clearColor.w;
          const deferredData = pipeline.getPipelineRenderData();
          const framebuffer = deferredData.gbufferFrameBuffer;
          const renderPass = framebuffer.renderPass;
          cmdBuff.beginRenderPass(renderPass, framebuffer, this._renderArea, colors, camera.clearDepth, camera.clearStencil);
          cmdBuff.setScissor(pipeline.generateScissor(camera));
          cmdBuff.setViewport(pipeline.generateViewport(camera));
          cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, pipeline.descriptorSet);
          for (let i = 0; i < this.renderQueues.length; i++) {
            this._renderQueues[i].recordCommandBuffer(device, renderPass, cmdBuff);
          }
          this._instancedQueue.recordCommandBuffer(device, renderPass, cmdBuff);
          cmdBuff.endRenderPass();
        }
      }, _GbufferStage.initInfo = {
        name: 'GbufferStage',
        priority: DeferredStagePriority.GBUFFER,
        tag: 0,
        renderQueues: [{
          isTransparent: false,
          sortMode: RenderQueueSortMode.FRONT_TO_BACK,
          stages: ['default']
        }, {
          isTransparent: true,
          sortMode: RenderQueueSortMode.BACK_TO_FRONT,
          stages: ['default']
        }]
      }, _GbufferStage), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "renderQueues", [_dec2, serializable, _dec3], {
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