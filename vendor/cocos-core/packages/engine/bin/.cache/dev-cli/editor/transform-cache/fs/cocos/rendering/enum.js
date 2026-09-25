System.register("q-bundled:///fs/cocos/rendering/enum.js", [], function (_export, _context) {
  "use strict";

  var CommonStagePriority, ForwardStagePriority, ForwardFlowPriority, DeferredStagePriority, DeferredFlowPriority;
  return {
    setters: [],
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
      _export("CommonStagePriority", CommonStagePriority = /*#__PURE__*/function (CommonStagePriority) {
        CommonStagePriority[CommonStagePriority["BLOOM"] = 18] = "BLOOM";
        CommonStagePriority[CommonStagePriority["POST_PROCESS"] = 19] = "POST_PROCESS";
        CommonStagePriority[CommonStagePriority["UI"] = 20] = "UI";
        return CommonStagePriority;
      }({}));
      /**
       * @zh 前向阶段优先级。
       * @en The priority of stage in forward rendering
       */
      _export("ForwardStagePriority", ForwardStagePriority = /*#__PURE__*/function (ForwardStagePriority) {
        ForwardStagePriority[ForwardStagePriority["AR"] = 5] = "AR";
        ForwardStagePriority[ForwardStagePriority["FORWARD"] = 10] = "FORWARD";
        return ForwardStagePriority;
      }({}));
      /**
       * @zh 前向渲染流程优先级。
       * @en The priority of flows in forward rendering
       */
      _export("ForwardFlowPriority", ForwardFlowPriority = /*#__PURE__*/function (ForwardFlowPriority) {
        ForwardFlowPriority[ForwardFlowPriority["SHADOW"] = 0] = "SHADOW";
        ForwardFlowPriority[ForwardFlowPriority["FORWARD"] = 1] = "FORWARD";
        ForwardFlowPriority[ForwardFlowPriority["UI"] = 10] = "UI";
        return ForwardFlowPriority;
      }({}));
      /**
       * @zh 延迟阶段优先级。
       * @en The priority of stage in forward rendering
       */
      _export("DeferredStagePriority", DeferredStagePriority = /*#__PURE__*/function (DeferredStagePriority) {
        DeferredStagePriority[DeferredStagePriority["GBUFFER"] = 10] = "GBUFFER";
        DeferredStagePriority[DeferredStagePriority["LIGHTING"] = 15] = "LIGHTING";
        DeferredStagePriority[DeferredStagePriority["TRANSPARENT"] = 18] = "TRANSPARENT";
        return DeferredStagePriority;
      }({}));
      /**
       * @zh 延迟渲染流程优先级。
       * @en The priority of flows in forward rendering
       */
      _export("DeferredFlowPriority", DeferredFlowPriority = /*#__PURE__*/function (DeferredFlowPriority) {
        DeferredFlowPriority[DeferredFlowPriority["SHADOW"] = 0] = "SHADOW";
        DeferredFlowPriority[DeferredFlowPriority["MAIN"] = 1] = "MAIN";
        DeferredFlowPriority[DeferredFlowPriority["UI"] = 10] = "UI";
        return DeferredFlowPriority;
      }({}));
    }
  };
});