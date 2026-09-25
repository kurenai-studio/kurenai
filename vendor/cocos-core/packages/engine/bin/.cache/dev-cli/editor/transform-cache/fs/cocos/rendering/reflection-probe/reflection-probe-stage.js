System.register("q-bundled:///fs/cocos/rendering/reflection-probe/reflection-probe-stage.js", ["../../core/data/decorators/index.js", "../../gfx/index.js", "../render-stage.js", "../enum.js", "../define.js", "../render-reflection-probe-queue.js", "../../core/index.js", "../../core/math/color.js"], function (_export, _context) {
  "use strict";

  var ccclass, Color, Rect, ClearFlagBit, RenderStage, ForwardStagePriority, SetIndex, RenderReflectionProbeQueue, Vec3, packRGBE, _dec, _class, _ReflectionProbeStage, colors, ReflectionProbeStage;
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
    }, function (_gfxIndexJs) {
      Color = _gfxIndexJs.Color;
      Rect = _gfxIndexJs.Rect;
      ClearFlagBit = _gfxIndexJs.ClearFlagBit;
    }, function (_renderStageJs) {
      RenderStage = _renderStageJs.RenderStage;
    }, function (_enumJs) {
      ForwardStagePriority = _enumJs.ForwardStagePriority;
    }, function (_defineJs) {
      SetIndex = _defineJs.SetIndex;
    }, function (_renderReflectionProbeQueueJs) {
      RenderReflectionProbeQueue = _renderReflectionProbeQueueJs.RenderReflectionProbeQueue;
    }, function (_coreIndexJs) {
      Vec3 = _coreIndexJs.Vec3;
    }, function (_coreMathColorJs) {
      packRGBE = _coreMathColorJs.packRGBE;
    }],
    execute: function () {
      /*
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
      colors = [new Color(1, 1, 1, 1)];
      /**
       * @en reflection probe render stage
       * @zh 反射探针渲染阶段。
       */
      _export("ReflectionProbeStage", ReflectionProbeStage = (_dec = ccclass('ReflectionProbeStage'), _dec(_class = (_ReflectionProbeStage = class ReflectionProbeStage extends RenderStage {
        constructor() {
          super();
          this._frameBuffer = null;
          this._renderArea = new Rect();
          this._probe = null;
          this._reflectionCamera = null;
          this._probeRenderQueue = void 0;
          this._rgbeColor = new Vec3();
        }

        /**
         * @en Sets the probe info
         * @zh 设置probe信息
         * @param probe
         * @param frameBuffer
         */
        setUsageInfo(probe, frameBuffer, reflectionCamera) {
          this._probe = probe;
          this._frameBuffer = frameBuffer;
          this._reflectionCamera = reflectionCamera != null ? reflectionCamera : null;
        }
        destroy() {
          var _this$_probeRenderQue;
          this._frameBuffer = null;
          (_this$_probeRenderQue = this._probeRenderQueue) == null || _this$_probeRenderQue.clear();
        }
        clearFramebuffer(camera) {
          if (!this._frameBuffer) {
            return;
          }
          colors[0].w = camera.clearColor.w;
          const pipeline = this._pipeline;
          const pipelineSceneData = pipeline.pipelineSceneData;
          const shadingScale = pipelineSceneData.shadingScale;
          const vp = camera.viewport;
          const size = this._probe.resolution;
          this._renderArea.x = vp.x * size;
          this._renderArea.y = vp.y * size;
          this._renderArea.width = vp.width * size * shadingScale;
          this._renderArea.height = vp.height * size * shadingScale;
          const cmdBuff = pipeline.commandBuffers[0];
          const renderPass = this._frameBuffer.renderPass;
          cmdBuff.beginRenderPass(renderPass, this._frameBuffer, this._renderArea, colors, camera.clearDepth, camera.clearStencil);
          cmdBuff.endRenderPass();
        }
        render(camera) {
          var _this$_reflectionCame;
          const pipeline = this._pipeline;
          const cmdBuff = pipeline.commandBuffers[0];
          const probeCamera = (_this$_reflectionCame = this._reflectionCamera) != null ? _this$_reflectionCame : this._probe.camera;
          this._probeRenderQueue.gatherRenderObjects(this._probe, camera, cmdBuff, probeCamera);
          pipeline.pipelineUBO.updateCameraUBO(probeCamera);
          this._renderArea.x = 0;
          this._renderArea.y = 0;
          this._renderArea.width = this._probe.renderArea().x;
          this._renderArea.height = this._probe.renderArea().y;
          const renderPass = this._frameBuffer.renderPass;
          if (probeCamera.clearFlag & ClearFlagBit.COLOR) {
            this._rgbeColor.x = probeCamera.clearColor.x;
            this._rgbeColor.y = probeCamera.clearColor.y;
            this._rgbeColor.z = probeCamera.clearColor.z;
            const rgbe = packRGBE(this._rgbeColor);
            colors[0].x = rgbe.x;
            colors[0].y = rgbe.y;
            colors[0].z = rgbe.z;
            colors[0].w = rgbe.w;
          }
          const device = pipeline.device;
          cmdBuff.beginRenderPass(renderPass, this._frameBuffer, this._renderArea, colors, probeCamera.clearDepth, probeCamera.clearStencil);
          cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, pipeline.descriptorSet);
          this._probeRenderQueue.recordCommandBuffer(device, renderPass, cmdBuff);
          cmdBuff.endRenderPass();
          pipeline.pipelineUBO.updateCameraUBO(camera);
        }
        activate(pipeline, flow) {
          super.activate(pipeline, flow);
          this._probeRenderQueue = new RenderReflectionProbeQueue(pipeline);
        }
      }, _ReflectionProbeStage.initInfo = {
        name: 'ReflectionProbeStage',
        priority: ForwardStagePriority.FORWARD,
        tag: 0
      }, _ReflectionProbeStage)) || _class));
    }
  };
});