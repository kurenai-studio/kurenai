System.register("q-bundled:///fs/cocos/animation/marionette/runtime-exports.js", ["./animation-graph.js", "./motion/index.js", "./animation-mask.js", "./animation-graph-variant.js", "./pose-graph/runtime-exports.js", "./animation-controller.js", "./parametric.js", "./state-machine/state-machine-component.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_animationGraphJs) {}, function (_motionIndexJs) {}, function (_animationMaskJs) {}, function (_animationGraphVariantJs) {}, function (_poseGraphRuntimeExportsJs) {
      var _exportObj = {};
      for (var _key in _poseGraphRuntimeExportsJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _poseGraphRuntimeExportsJs[_key];
      }
      _export(_exportObj);
    }, function (_animationControllerJs) {
      _export("AnimationController", _animationControllerJs.AnimationController);
    }, function (_parametricJs) {
      _export("VariableType", _parametricJs.VariableType);
    }, function (_stateMachineStateMachineComponentJs) {
      _export("StateMachineComponent", _stateMachineStateMachineComponentJs.StateMachineComponent);
    }],
    execute: function () {}
  };
});