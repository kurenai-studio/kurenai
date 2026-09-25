System.register("q-bundled:///fs/cocos/rendering/forward/forward-flow.js", ["../../core/data/decorators/index.js", "../define.js", "../render-flow.js", "../enum.js", "./forward-stage.js"], function (_export, _context) {
  "use strict";

  var ccclass, PIPELINE_FLOW_FORWARD, RenderFlow, ForwardFlowPriority, ForwardStage, _dec, _class, _ForwardFlow, ForwardFlow;
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
    }, function (_defineJs) {
      PIPELINE_FLOW_FORWARD = _defineJs.PIPELINE_FLOW_FORWARD;
    }, function (_renderFlowJs) {
      RenderFlow = _renderFlowJs.RenderFlow;
    }, function (_enumJs) {
      ForwardFlowPriority = _enumJs.ForwardFlowPriority;
    }, function (_forwardStageJs) {
      ForwardStage = _forwardStageJs.ForwardStage;
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
      /**
       * @en The forward flow in forward render pipeline
       * @zh 前向渲染流程。
       */
      _export("ForwardFlow", ForwardFlow = (_dec = ccclass('ForwardFlow'), _dec(_class = (_ForwardFlow = class ForwardFlow extends RenderFlow {
        initialize(info) {
          super.initialize(info);
          if (this._stages.length === 0) {
            const forwardStage = new ForwardStage();
            forwardStage.initialize(ForwardStage.initInfo);
            this._stages.push(forwardStage);
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
      }, _ForwardFlow.initInfo = {
        name: PIPELINE_FLOW_FORWARD,
        priority: ForwardFlowPriority.FORWARD,
        stages: []
      }, _ForwardFlow)) || _class));
    }
  };
});