System.register("q-bundled:///fs/cocos/rendering/legacy/index.js", ["../deprecated.js", "../forward/forward-pipeline.js", "../forward/forward-flow.js", "../forward/forward-stage.js", "../deferred/deferred-pipeline.js", "../deferred/main-flow.js", "../deferred/gbuffer-stage.js", "../deferred/lighting-stage.js", "../deferred/bloom-stage.js", "../deferred/postprocess-stage.js", "../shadow/shadow-flow.js", "../shadow/shadow-stage.js", "../reflection-probe/reflection-probe-flow.js", "../reflection-probe/reflection-probe-stage.js", "../render-pipeline.js", "../render-flow.js", "../render-stage.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_deprecatedJs) {}, function (_forwardForwardPipelineJs) {
      _export({
        ForwardPipeline: _forwardForwardPipelineJs.ForwardPipeline,
        createDefaultPipeline: _forwardForwardPipelineJs.createDefaultPipeline
      });
    }, function (_forwardForwardFlowJs) {
      _export("ForwardFlow", _forwardForwardFlowJs.ForwardFlow);
    }, function (_forwardForwardStageJs) {
      _export("ForwardStage", _forwardForwardStageJs.ForwardStage);
    }, function (_deferredDeferredPipelineJs) {
      _export("DeferredPipeline", _deferredDeferredPipelineJs.DeferredPipeline);
    }, function (_deferredMainFlowJs) {
      _export("MainFlow", _deferredMainFlowJs.MainFlow);
    }, function (_deferredGbufferStageJs) {
      _export("GbufferStage", _deferredGbufferStageJs.GbufferStage);
    }, function (_deferredLightingStageJs) {
      _export("LightingStage", _deferredLightingStageJs.LightingStage);
    }, function (_deferredBloomStageJs) {
      _export("BloomStage", _deferredBloomStageJs.BloomStage);
    }, function (_deferredPostprocessStageJs) {
      _export("PostProcessStage", _deferredPostprocessStageJs.PostProcessStage);
    }, function (_shadowShadowFlowJs) {
      _export("ShadowFlow", _shadowShadowFlowJs.ShadowFlow);
    }, function (_shadowShadowStageJs) {
      _export("ShadowStage", _shadowShadowStageJs.ShadowStage);
    }, function (_reflectionProbeReflectionProbeFlowJs) {
      _export("ReflectionProbeFlow", _reflectionProbeReflectionProbeFlowJs.ReflectionProbeFlow);
    }, function (_reflectionProbeReflectionProbeStageJs) {
      _export("ReflectionProbeStage", _reflectionProbeReflectionProbeStageJs.ReflectionProbeStage);
    }, function (_renderPipelineJs) {
      _export("RenderPipeline", _renderPipelineJs.RenderPipeline);
    }, function (_renderFlowJs) {
      _export("RenderFlow", _renderFlowJs.RenderFlow);
    }, function (_renderStageJs) {
      _export("RenderStage", _renderStageJs.RenderStage);
    }],
    execute: function () {}
  };
});