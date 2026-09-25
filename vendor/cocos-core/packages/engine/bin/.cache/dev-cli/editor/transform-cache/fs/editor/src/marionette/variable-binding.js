System.register("q-bundled:///fs/editor/src/marionette/variable-binding.js", ["../../../cocos/animation/marionette/asset-creation.js", "../../../cocos/animation/marionette/pose-graph/pose-nodes/state-machine.js", "../../../cocos/animation/marionette/state-machine/condition/binding/variable-binding.js", "../../../cocos/animation/marionette/pose-graph/pure-value-nodes/get-variable.js", "../../../cocos/animation/marionette/pose-graph/foundation/type-system.js", "../../../exports/base.js"], function (_export, _context) {
  "use strict";

  var AnimationBlend1D, AnimationBlend2D, AnimationBlendDirect, UnaryCondition, BinaryCondition, TriggerCondition, MotionState, SubStateMachine, VariableType, ProceduralPoseState, PoseNodeStateMachine, TCVariableBinding, PVNodeGetVariableBase, PoseGraphType, assertIsTrue;
  function* viewVariableBindings(animationGraph) {
    for (const layer of animationGraph.layers) {
      yield* visitStateMachine(layer.stateMachine);
    }
    function createVariableBindingView(object, key, acceptableTypes) {
      return {
        get name() {
          return object[key];
        },
        get acceptableTypes() {
          return Array.isArray(acceptableTypes) ? acceptableTypes : [acceptableTypes];
        },
        rebind(newName) {
          object[key] = newName;
        },
        unbind() {
          object[key] = '';
        }
      };
    }
    function createTCVariableBindingView(binding, acceptableTypes) {
      return {
        get name() {
          return binding.variableName;
        },
        get acceptableTypes() {
          return acceptableTypes;
        },
        rebind(newVariableName) {
          binding.variableName = newVariableName;
        },
        unbind() {
          binding.variableName = '';
        }
      };
    }
    function* visitStateMachine(stateMachine) {
      for (const transition of stateMachine.transitions()) {
        for (const condition of transition.conditions) {
          if (condition instanceof UnaryCondition) {
            yield createVariableBindingView(condition.operand, 'variable', VariableType.BOOLEAN);
          } else if (condition instanceof BinaryCondition) {
            if (condition.lhsBinding instanceof TCVariableBinding) {
              yield createTCVariableBindingView(condition.lhsBinding, [VariableType.FLOAT, VariableType.INTEGER]);
            }
          } else if (condition instanceof TriggerCondition) {
            yield createVariableBindingView(condition, 'trigger', VariableType.TRIGGER);
          }
        }
      }
      for (const state of stateMachine.states()) {
        if (state instanceof MotionState) {
          const motion = state.motion;
          if (motion instanceof AnimationBlend1D) {
            yield createVariableBindingView(motion.param, 'variable', [VariableType.FLOAT]);
          } else if (motion instanceof AnimationBlend2D) {
            yield createVariableBindingView(motion.paramX, 'variable', [VariableType.FLOAT]);
            yield createVariableBindingView(motion.paramY, 'variable', [VariableType.FLOAT]);
          } else if (motion instanceof AnimationBlendDirect) {
            // TODO?
          }
        } else if (state instanceof SubStateMachine) {
          yield* visitStateMachine(state.stateMachine);
        } else if (state instanceof ProceduralPoseState) {
          for (const node of state.graph.nodes()) {
            if (node instanceof PoseNodeStateMachine) {
              yield* visitStateMachine(node.stateMachine);
            } else if (node instanceof PVNodeGetVariableBase) {
              const outputType = node.getOutputType(0);
              assertIsTrue(outputType !== PoseGraphType.POSE);
              yield createVariableBindingView(node, 'variableName', poseGraphTypeToAcceptableVariableType(outputType));
            }
          }
        }
      }
    }
  }
  function poseGraphTypeToAcceptableVariableType(poseGraphType) {
    switch (poseGraphType) {
      default:
        throw new Error(`Unhandled pose graph type ${PoseGraphType[poseGraphType]}`);
      case PoseGraphType.FLOAT:
        return VariableType.FLOAT;
      case PoseGraphType.INTEGER:
        return VariableType.INTEGER;
      case PoseGraphType.BOOLEAN:
        return VariableType.BOOLEAN;
      case PoseGraphType.VEC3:
        return VariableType.VEC3_experimental;
      case PoseGraphType.QUAT:
        return VariableType.QUAT_experimental;
    }
  }
  _export("viewVariableBindings", viewVariableBindings);
  return {
    setters: [function (_cocosAnimationMarionetteAssetCreationJs) {
      AnimationBlend1D = _cocosAnimationMarionetteAssetCreationJs.AnimationBlend1D;
      AnimationBlend2D = _cocosAnimationMarionetteAssetCreationJs.AnimationBlend2D;
      AnimationBlendDirect = _cocosAnimationMarionetteAssetCreationJs.AnimationBlendDirect;
      UnaryCondition = _cocosAnimationMarionetteAssetCreationJs.UnaryCondition;
      BinaryCondition = _cocosAnimationMarionetteAssetCreationJs.BinaryCondition;
      TriggerCondition = _cocosAnimationMarionetteAssetCreationJs.TriggerCondition;
      MotionState = _cocosAnimationMarionetteAssetCreationJs.MotionState;
      SubStateMachine = _cocosAnimationMarionetteAssetCreationJs.SubStateMachine;
      VariableType = _cocosAnimationMarionetteAssetCreationJs.VariableType;
      ProceduralPoseState = _cocosAnimationMarionetteAssetCreationJs.ProceduralPoseState;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesStateMachineJs) {
      PoseNodeStateMachine = _cocosAnimationMarionettePoseGraphPoseNodesStateMachineJs.PoseNodeStateMachine;
    }, function (_cocosAnimationMarionetteStateMachineConditionBindingVariableBindingJs) {
      TCVariableBinding = _cocosAnimationMarionetteStateMachineConditionBindingVariableBindingJs.TCVariableBinding;
    }, function (_cocosAnimationMarionettePoseGraphPureValueNodesGetVariableJs) {
      PVNodeGetVariableBase = _cocosAnimationMarionettePoseGraphPureValueNodesGetVariableJs.PVNodeGetVariableBase;
    }, function (_cocosAnimationMarionettePoseGraphFoundationTypeSystemJs) {
      PoseGraphType = _cocosAnimationMarionettePoseGraphFoundationTypeSystemJs.PoseGraphType;
    }, function (_exportsBaseJs) {
      assertIsTrue = _exportsBaseJs.assertIsTrue;
    }],
    execute: function () {}
  };
});