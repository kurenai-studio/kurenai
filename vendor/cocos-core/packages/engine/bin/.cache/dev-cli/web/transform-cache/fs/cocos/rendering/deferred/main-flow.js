System.register("q-bundled:///fs/cocos/rendering/deferred/main-flow.js", ["../../core/data/decorators/index.js", "../define.js", "../render-flow.js", "../enum.js", "./gbuffer-stage.js", "./lighting-stage.js", "./postprocess-stage.js", "./bloom-stage.js"], function (_export, _context) {
  "use strict";

  var ccclass, PIPELINE_FLOW_MAIN, RenderFlow, DeferredFlowPriority, GbufferStage, LightingStage, PostProcessStage, BloomStage, _dec, _class, _MainFlow, MainFlow;
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
    }, function (_defineJs) {
      PIPELINE_FLOW_MAIN = _defineJs.PIPELINE_FLOW_MAIN;
    }, function (_renderFlowJs) {
      RenderFlow = _renderFlowJs.RenderFlow;
    }, function (_enumJs) {
      DeferredFlowPriority = _enumJs.DeferredFlowPriority;
    }, function (_gbufferStageJs) {
      GbufferStage = _gbufferStageJs.GbufferStage;
    }, function (_lightingStageJs) {
      LightingStage = _lightingStageJs.LightingStage;
    }, function (_postprocessStageJs) {
      PostProcessStage = _postprocessStageJs.PostProcessStage;
    }, function (_bloomStageJs) {
      BloomStage = _bloomStageJs.BloomStage;
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
       * @category pipeline.deferred
       */
      /**
       * @en The main flow in deferred render pipeline
       * @zh 延迟渲染流程。
       */
      _export("MainFlow", MainFlow = (_dec = ccclass('MainFlow'), _dec(_class = (_MainFlow = class MainFlow extends RenderFlow {
        initialize(info) {
          super.initialize(info);
          if (this._stages.length === 0) {
            const gbufferStage = new GbufferStage();
            gbufferStage.initialize(GbufferStage.initInfo);
            this._stages.push(gbufferStage);
            const lightingStage = new LightingStage();
            lightingStage.initialize(LightingStage.initInfo);
            this._stages.push(lightingStage);
            const bloomStage = new BloomStage();
            bloomStage.initialize(BloomStage.initInfo);
            this._stages.push(bloomStage);
            const postProcessStage = new PostProcessStage();
            postProcessStage.initialize(PostProcessStage.initInfo);
            this._stages.push(postProcessStage);
          }
          return true;
        }
        activate(pipeline) {
          super.activate(pipeline);
        }
        render(camera) {
          super.render(camera);
        }
        destroy() {
          super.destroy();
        }
      }, _MainFlow.initInfo = {
        name: PIPELINE_FLOW_MAIN,
        priority: DeferredFlowPriority.MAIN,
        stages: []
      }, _MainFlow)) || _class));
    }
  };
});