System.register("q-bundled:///fs/cocos/rendering/reflection-probe/reflection-probe-flow.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/data/decorators/index.js", "../render-flow.js", "./reflection-probe-stage.js", "../pipeline-serialization.js", "../../render-scene/scene/camera.js", "../../render-scene/scene/reflection-probe.js", "../../core/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, ccclass, RenderFlow, ReflectionProbeStage, RenderFlowTag, CameraUsage, ProbeType, cclegacy, _dec, _class, _ReflectionProbeFlow, ReflectionProbeFlow;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
    }, function (_renderFlowJs) {
      RenderFlow = _renderFlowJs.RenderFlow;
    }, function (_reflectionProbeStageJs) {
      ReflectionProbeStage = _reflectionProbeStageJs.ReflectionProbeStage;
    }, function (_pipelineSerializationJs) {
      RenderFlowTag = _pipelineSerializationJs.RenderFlowTag;
    }, function (_renderSceneSceneCameraJs) {
      CameraUsage = _renderSceneSceneCameraJs.CameraUsage;
    }, function (_renderSceneSceneReflectionProbeJs) {
      ProbeType = _renderSceneSceneReflectionProbeJs.ProbeType;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
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
      /**
       * @en reflection probe render flow
       * @zh 反射探针rendertexture绘制流程
       */
      _export("ReflectionProbeFlow", ReflectionProbeFlow = (_dec = ccclass('ReflectionProbeFlow'), _dec(_class = (_ReflectionProbeFlow = class ReflectionProbeFlow extends RenderFlow {
        initialize(info) {
          super.initialize(info);
          if (this._stages.length === 0) {
            const probeStage = new ReflectionProbeStage();
            probeStage.initialize(ReflectionProbeStage.initInfo);
            this._stages.push(probeStage);
          }
          return true;
        }
        activate(pipeline) {
          super.activate(pipeline);
        }
        render(camera) {
          if (!cclegacy.internal.reflectionProbeManager) {
            return;
          }
          const probes = cclegacy.internal.reflectionProbeManager.getProbes();
          for (let i = 0; i < probes.length; i++) {
            if (probes[i].needRender) {
              if (probes[i].probeType === ProbeType.PLANAR) {
                let reflectionCamera;
                if (EDITOR && camera.cameraUsage === CameraUsage.PREVIEW) {
                  reflectionCamera = probes[i].renderPreviewPlanarReflection(camera);
                }
                this._renderStage(camera, probes[i], reflectionCamera);
              } else if (EDITOR) {
                this._renderStage(camera, probes[i]);
              }
            }
          }
        }
        destroy() {
          super.destroy();
        }
        _renderStage(camera, probe, reflectionCamera) {
          for (let i = 0; i < this._stages.length; i++) {
            const probeStage = this._stages[i];
            if (probe.probeType === ProbeType.PLANAR) {
              cclegacy.internal.reflectionProbeManager.updatePlanarMap(probe, null);
              probeStage.setUsageInfo(probe, probe.realtimePlanarTexture.window.framebuffer, reflectionCamera);
              probeStage.render(camera);
              cclegacy.internal.reflectionProbeManager.updatePlanarMap(probe, probe.realtimePlanarTexture.getGFXTexture());
            } else {
              for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
                const renderTexture = probe.bakedCubeTextures[faceIdx];
                if (!renderTexture) return;
                //update camera dirction
                probe.updateCameraDir(faceIdx);
                probeStage.setUsageInfo(probe, renderTexture.window.framebuffer);
                probeStage.render(camera);
              }
              probe.needRender = false;
            }
          }
        }
      }, _ReflectionProbeFlow.initInfo = {
        name: 'PIPELINE_FLOW_RELECTION_PROBE',
        priority: 0,
        tag: RenderFlowTag.SCENE,
        stages: []
      }, _ReflectionProbeFlow)) || _class));
    }
  };
});