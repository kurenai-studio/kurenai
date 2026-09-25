System.register("q-bundled:///fs/editor/exports/new-gen-anim.js", ["../../cocos/animation/marionette/motion/blend-1d.js", "../../cocos/animation/marionette/motion/blend-2d.js", "../../cocos/animation/marionette/asset-creation.js", "../src/marionette/variable-binding.js", "../src/marionette/preview.js", "../src/marionette/state-machine-operation.js", "../src/marionette/visit.js", "../src/marionette/get-variable-value-attributes.js", "../src/marionette/pose-graph-editor-api.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_cocosAnimationMarionetteMotionBlend1dJs) {
      _export("blend1D", _cocosAnimationMarionetteMotionBlend1dJs.blend1D);
    }, function (_cocosAnimationMarionetteMotionBlend2dJs) {
      _export({
        blendSimpleDirectional: _cocosAnimationMarionetteMotionBlend2dJs.blendSimpleDirectional,
        validateSimpleDirectionalSamples: _cocosAnimationMarionetteMotionBlend2dJs.validateSimpleDirectionalSamples,
        SimpleDirectionalIssueSameDirection: _cocosAnimationMarionetteMotionBlend2dJs.SimpleDirectionalIssueSameDirection
      });
    }, function (_cocosAnimationMarionetteAssetCreationJs) {
      var _exportObj = {};
      for (var _key in _cocosAnimationMarionetteAssetCreationJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _cocosAnimationMarionetteAssetCreationJs[_key];
      }
      _export(_exportObj);
    }, function (_srcMarionetteVariableBindingJs) {
      _export("viewVariableBindings", _srcMarionetteVariableBindingJs.viewVariableBindings);
    }, function (_srcMarionettePreviewJs) {
      _export({
        MotionPreviewer: _srcMarionettePreviewJs.MotionPreviewer,
        TransitionPreviewer: _srcMarionettePreviewJs.TransitionPreviewer
      });
    }, function (_srcMarionetteStateMachineOperationJs) {
      _export({
        cloneState: _srcMarionetteStateMachineOperationJs.cloneState,
        turnMotionStateIntoSubStateMachine: _srcMarionetteStateMachineOperationJs.turnMotionStateIntoSubStateMachine
      });
    }, function (_srcMarionetteVisitJs) {
      _export({
        visitAnimationClips: _srcMarionetteVisitJs.visitAnimationClips,
        visitAnimationClipsInController: _srcMarionetteVisitJs.visitAnimationClipsInController,
        visitAnimationGraphEditorExtras: _srcMarionetteVisitJs.visitAnimationGraphEditorExtras
      });
    }, function (_srcMarionetteGetVariableValueAttributesJs) {
      _export("getVariableValueAttributes", _srcMarionetteGetVariableValueAttributesJs.getVariableValueAttributes);
    }, function (_srcMarionettePoseGraphEditorApiJs) {
      var _exportObj2 = {};
      for (var _key2 in _srcMarionettePoseGraphEditorApiJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _srcMarionettePoseGraphEditorApiJs[_key2];
      }
      _export(_exportObj2);
    }],
    execute: function () {}
  };
});