System.register("q-bundled:///fs/cocos/rendering/post-process/post-process-builder.js", ["../../../../virtual/internal%253Aconstants.js", "../../render-scene/scene/index.js", "./utils/pass-context.js", "./passes/forward-final-pass.js", "../custom/define.js", "./passes/forward-pass.js", "./passes/taa-pass.js", "./passes/fsr-pass.js", "./passes/blit-screen-pass.js", "./passes/shadow-pass.js", "./passes/hbao-pass.js", "./components/post-process.js", "../../game/index.js", "../../misc/index.js", "./passes/index.js", "../pipeline-event.js"], function (_export, _context) {
  "use strict";

  var EDITOR, CameraProjection, CameraUsage, passContext, ForwardFinalPass, getCameraUniqueID, ForwardPass, TAAPass, FSRPass, BlitScreenPass, ShadowPass, HBAOPass, PostProcess, director, CameraComponent, BloomPass, ColorGradingPass, DofPass, FloatOutputProcessPass, ForwardTransparencyPass, ForwardTransparencySimplePass, FxaaPass, PostFinalPass, SkinPass, PipelineEventType, PostProcessBuilder;
  _export("PostProcessBuilder", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_renderSceneSceneIndexJs) {
      CameraProjection = _renderSceneSceneIndexJs.CameraProjection;
      CameraUsage = _renderSceneSceneIndexJs.CameraUsage;
    }, function (_utilsPassContextJs) {
      passContext = _utilsPassContextJs.passContext;
    }, function (_passesForwardFinalPassJs) {
      ForwardFinalPass = _passesForwardFinalPassJs.ForwardFinalPass;
    }, function (_customDefineJs) {
      getCameraUniqueID = _customDefineJs.getCameraUniqueID;
    }, function (_passesForwardPassJs) {
      ForwardPass = _passesForwardPassJs.ForwardPass;
    }, function (_passesTaaPassJs) {
      TAAPass = _passesTaaPassJs.TAAPass;
    }, function (_passesFsrPassJs) {
      FSRPass = _passesFsrPassJs.FSRPass;
    }, function (_passesBlitScreenPassJs) {
      BlitScreenPass = _passesBlitScreenPassJs.BlitScreenPass;
    }, function (_passesShadowPassJs) {
      ShadowPass = _passesShadowPassJs.ShadowPass;
    }, function (_passesHbaoPassJs) {
      HBAOPass = _passesHbaoPassJs.HBAOPass;
    }, function (_componentsPostProcessJs) {
      PostProcess = _componentsPostProcessJs.PostProcess;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
    }, function (_miscIndexJs) {
      CameraComponent = _miscIndexJs.Camera;
    }, function (_passesIndexJs) {
      BloomPass = _passesIndexJs.BloomPass;
      ColorGradingPass = _passesIndexJs.ColorGradingPass;
      DofPass = _passesIndexJs.DofPass;
      FloatOutputProcessPass = _passesIndexJs.FloatOutputProcessPass;
      ForwardTransparencyPass = _passesIndexJs.ForwardTransparencyPass;
      ForwardTransparencySimplePass = _passesIndexJs.ForwardTransparencySimplePass;
      FxaaPass = _passesIndexJs.FxaaPass;
      PostFinalPass = _passesIndexJs.PostFinalPass;
      SkinPass = _passesIndexJs.SkinPass;
    }, function (_pipelineEventJs) {
      PipelineEventType = _pipelineEventJs.PipelineEventType;
    }],
    execute: function () {
      _export("PostProcessBuilder", PostProcessBuilder = class PostProcessBuilder {
        constructor() {
          this.pipelines = new Map();
          this.init();
        }
        onGlobalPipelineStateChanged() {
          const passes = this.pipelines.get('forward');
          if (passes !== undefined) {
            for (let i = 0; i < passes.length; i++) {
              const pass = passes[i];
              if (typeof pass.onGlobalPipelineStateChanged === 'function') {
                pass.onGlobalPipelineStateChanged();
              }
            }
          }
        }
        init() {
          const forward = new ForwardPass();
          const forwardFinal = new ForwardFinalPass();
          const shadowPass = new ShadowPass();

          // default pipeline
          this.addPass(shadowPass, 'default');
          this.addPass(forward, 'default');
          this.addPass(new ForwardTransparencySimplePass(), 'default');
          this.addPass(forwardFinal, 'default');

          // rendering dependent data generation
          this.addPass(shadowPass);

          // opaque objects forward lighting
          this.addPass(forward);
          this.addPass(new SkinPass());

          // depth-based shading
          this.addPass(new HBAOPass());

          // float output related deferred processing: hdr + fog
          this.addPass(new FloatOutputProcessPass());

          // transparency should after hdr and depth-based shading
          // temporary ignore CC_USE_FLOAT_OUTPUT
          this.addPass(new ForwardTransparencyPass());

          // user post-processing
          this.addPass(new DofPass());
          this.addPass(new TAAPass());
          this.addPass(new FxaaPass());
          this.addPass(new ColorGradingPass());
          this.addPass(new BlitScreenPass());
          this.addPass(new BloomPass());

          // final output
          this.addPass(new FSRPass()); // fsr should be final
          this.addPass(new PostFinalPass());
        }
        getPass(passClass, pipelineName = 'forward') {
          const pp = this.pipelines.get(pipelineName);
          return pp && pp.find(p => p instanceof passClass);
        }
        addPass(pass, pipelineName = 'forward') {
          let pp = this.pipelines.get(pipelineName);
          if (!pp) {
            pp = [];
            this.pipelines.set(pipelineName, pp);
          }
          const oldIdx = pp.findIndex(p => p.name === pass.name);
          if (oldIdx !== -1) {
            pp.splice(oldIdx, 1);
          }
          pp.push(pass);
        }
        insertPass(pass, passClass, pipelineName = 'forward') {
          const pp = this.pipelines.get(pipelineName);
          if (pp) {
            const oldIdx = pp.findIndex(p => p.name === pass.name);
            if (oldIdx !== -1) {
              pp.splice(oldIdx, 1);
            }
            const idx = pp.findIndex(p => p instanceof passClass);
            if (idx !== -1) {
              pp.splice(idx + 1, 0, pass);
            }
          }
        }
        initEditor() {
          director.root.cameraList.forEach(cam => {
            if (cam.name === 'Editor Camera') {
              cam.usePostProcess = cam.projectionType === CameraProjection.PERSPECTIVE;
            }
          });
        }
        applyPreviewCamera(camera) {
          if (!camera.node.parent) return;
          const camComp = camera.node.parent.getComponent(CameraComponent);
          const oriCamera = camComp && camComp.camera;
          if (oriCamera) {
            camera.postProcess = oriCamera.postProcess;
            camera.usePostProcess = oriCamera.usePostProcess;
          }
        }
        resortEditorCameras(cameras) {
          const newCameras = [];
          for (let i = 0; i < cameras.length; i++) {
            const c = cameras[i];
            if (c.name === 'Editor Camera' || c.name === 'Editor UIGizmoCamera' || c.name === 'Scene Gizmo Camera') {
              newCameras.push(c);
            }
          }
          for (let i = 0; i < cameras.length; i++) {
            const c = cameras[i];
            if (newCameras.indexOf(c) === -1) {
              newCameras.push(c);
            }
          }
          return newCameras;
        }
        setup(cameras, ppl) {
          if (EDITOR) {
            this.initEditor();
            cameras = this.resortEditorCameras(cameras);
          }
          passContext.ppl = ppl;
          passContext.shadowPass = undefined;
          passContext.forwardPass = undefined;
          passContext.depthSlotName = '';
          passContext.isFinalCamera = false;
          passContext.isFinalPass = false;
          let globalPP;
          for (let i = 0; i < PostProcess.all.length; i++) {
            const pp = PostProcess.all[i];
            if (pp.global) {
              globalPP = pp;
            }
          }
          for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (!camera.scene) {
              continue;
            }
            ppl.update(camera);
            if (i === cameras.length - 1) {
              passContext.isFinalCamera = true;
            }
            if (EDITOR && camera.cameraUsage === CameraUsage.PREVIEW) {
              this.applyPreviewCamera(camera);
            }
            ppl.addBuiltinReflectionProbePass(camera);
            passContext.postProcess = camera.postProcess || globalPP;
            director.root.pipelineEvent.emit(PipelineEventType.RENDER_CAMERA_BEGIN, camera);
            this.renderCamera(camera, ppl);
          }
        }
        getCameraPipelineName(camera) {
          let pipelineName = camera.pipeline;
          if (!pipelineName && camera.usePostProcess) {
            pipelineName = 'forward';
          } else {
            pipelineName = 'default';
          }
          return pipelineName;
        }
        getCameraPasses(camera) {
          const pipelineName = this.getCameraPipelineName(camera);
          return this.pipelines.get(pipelineName) || [];
        }
        renderCamera(camera, ppl) {
          passContext.passPathName = `${getCameraUniqueID(camera)}`;
          passContext.camera = camera;
          passContext.updateViewPort();
          const passes = this.getCameraPasses(camera);
          const taaPass = passes.find(p => p instanceof TAAPass);
          if (taaPass && taaPass.checkEnable(camera)) {
            taaPass.applyCameraJitter(camera);
            taaPass.updateSample();
          }
          const floatOutputPass = passes.find(p => p instanceof FloatOutputProcessPass);
          let lastPass;
          for (let i = 0; i < passes.length; i++) {
            const pass = passes[i];
            if (!pass.checkEnable(camera)) {
              continue;
            }
            if (i === passes.length - 1) {
              passContext.isFinalPass = true;
            }
            if (pass.name === 'BloomPass') {
              // for override post-process builder
              pass.hdrInputName = floatOutputPass === undefined || floatOutputPass === null ? '' : floatOutputPass.getHDRInputName();
            }
            pass.lastPass = lastPass;
            pass.render(camera, ppl);
            lastPass = pass;
          }
        }
      });
    }
  };
});