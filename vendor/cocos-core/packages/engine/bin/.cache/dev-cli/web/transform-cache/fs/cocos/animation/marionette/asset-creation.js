System.register("q-bundled:///fs/cocos/animation/marionette/asset-creation.js", ["./errors.js", "./animation-graph.js", "./state-machine/condition/index.js", "./state-machine/condition/binding/binding.js", "./state-machine/condition/binding/editor.js", "./variable/index.js", "./state-machine/motion-state.js", "./motion/index.js", "./parametric.js", "./animation-mask.js", "./animation-graph-variant.js", "./pose-graph/op/index.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_errorsJs) {
      _export({
        InvalidTransitionError: _errorsJs.InvalidTransitionError,
        VariableNotDefinedError: _errorsJs.VariableNotDefinedError
      });
    }, function (_animationGraphJs) {
      _export({
        AnimationGraph: _animationGraphJs.AnimationGraph,
        isAnimationTransition: _animationGraphJs.isAnimationTransition,
        StateMachine: _animationGraphJs.StateMachine,
        SubStateMachine: _animationGraphJs.SubStateMachine,
        EmptyStateTransition: _animationGraphJs.EmptyStateTransition,
        EmptyState: _animationGraphJs.EmptyState,
        ProceduralPoseState: _animationGraphJs.ProceduralPoseState,
        ProceduralPoseTransition: _animationGraphJs.ProceduralPoseTransition
      });
    }, function (_stateMachineConditionIndexJs) {
      _export({
        BinaryCondition: _stateMachineConditionIndexJs.BinaryCondition,
        UnaryCondition: _stateMachineConditionIndexJs.UnaryCondition,
        TriggerCondition: _stateMachineConditionIndexJs.TriggerCondition
      });
    }, function (_stateMachineConditionBindingBindingJs) {
      _export({
        TCBinding: _stateMachineConditionBindingBindingJs.TCBinding,
        TCBindingValueType: _stateMachineConditionBindingBindingJs.TCBindingValueType
      });
    }, function (_stateMachineConditionBindingEditorJs) {
      _export({
        getTCBindingTypeInfo: _stateMachineConditionBindingEditorJs.getTCBindingTypeInfo,
        TCBindingTransitionSourceFilter: _stateMachineConditionBindingEditorJs.TCBindingTransitionSourceFilter
      });
    }, function (_variableIndexJs) {
      _export("TriggerResetMode", _variableIndexJs.TriggerResetMode);
    }, function (_stateMachineMotionStateJs) {
      _export("MotionState", _stateMachineMotionStateJs.MotionState);
    }, function (_motionIndexJs) {
      var _exportObj = {};
      for (var _key in _motionIndexJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _motionIndexJs[_key];
      }
      _export(_exportObj);
    }, function (_parametricJs) {
      _export({
        VariableType: _parametricJs.VariableType,
        BindableNumber: _parametricJs.BindableNumber,
        BindableBoolean: _parametricJs.BindableBoolean
      });
    }, function (_animationMaskJs) {
      _export("AnimationMask", _animationMaskJs.AnimationMask);
    }, function (_animationGraphVariantJs) {
      _export("AnimationGraphVariant", _animationGraphVariantJs.AnimationGraphVariant);
    }, function (_poseGraphOpIndexJs) {
      var _exportObj2 = {};
      for (var _key2 in _poseGraphOpIndexJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _poseGraphOpIndexJs[_key2];
      }
      _export(_exportObj2);
    }],
    execute: function () {}
  };
});