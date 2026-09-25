System.register("q-bundled:///fs/editor/src/marionette/visit.js", ["../../../cocos/animation/marionette/motion/index.js", "../../../cocos/animation/marionette/animation-graph.js", "../../../cocos/animation/marionette/state-machine/motion-state.js", "../../../cocos/animation/marionette/pose-graph/pose-nodes/state-machine.js", "../../../cocos/animation/marionette/pose-graph/pose-nodes/play-motion.js", "../../../cocos/animation/marionette/pose-graph/pose-nodes/sample-motion.js", "../../../cocos/animation/marionette/animation-graph-variant.js"], function (_export, _context) {
  "use strict";

  var ClipMotion, AnimationBlend1D, AnimationBlend2D, AnimationBlendDirect, SubStateMachine, AnimationGraph, ProceduralPoseState, MotionState, PoseNodeStateMachine, PoseNodePlayMotion, PoseNodeSampleMotion, AnimationGraphVariant;
  function* visitAnimationGraphEditorExtras(animationGraph) {
    for (const layer of animationGraph.layers) {
      yield* visitStateMachine(layer.stateMachine);
    }
    function* visitStateMachine(stateMachine) {
      yield stateMachine;
      for (const state of stateMachine.states()) {
        yield state;
        if (state instanceof MotionState) {
          const motion = state.motion;
          if (!motion) {
            continue;
          }
          yield* visitMotion(motion);
        } else if (state instanceof SubStateMachine) {
          yield* visitStateMachine(state.stateMachine);
        }
      }
      for (const transition of stateMachine.transitions()) {
        yield transition;
      }
    }
    function* visitMotion(motion) {
      yield motion;
      if (motion instanceof AnimationBlend1D || motion instanceof AnimationBlend2D || motion instanceof AnimationBlendDirect) {
        for (const {
          motion: childMotion
        } of motion.items) {
          if (childMotion) {
            yield* visitMotion(childMotion);
          }
        }
      }
    }
  }
  function* visitAnimationClips(animationGraph) {
    for (const layer of animationGraph.layers) {
      yield* visitStateMachine(layer.stateMachine);
      for (const [_stashId, stash] of layer.stashes()) {
        yield* visitPoseGraph(stash.graph);
      }
    }
    function* visitStateMachine(stateMachine) {
      for (const state of stateMachine.states()) {
        if (state instanceof MotionState) {
          const {
            motion
          } = state;
          if (motion) {
            yield* visitMotion(motion);
          }
        } else if (state instanceof ProceduralPoseState) {
          yield* visitPoseGraph(state.graph);
        } else if (state instanceof SubStateMachine) {
          yield* visitStateMachine(state.stateMachine);
        }
      }
    }
    function* visitMotion(motion) {
      if (motion instanceof ClipMotion) {
        if (motion.clip) {
          yield motion.clip;
        }
      } else if (motion instanceof AnimationBlend1D || motion instanceof AnimationBlend2D || motion instanceof AnimationBlendDirect) {
        for (const {
          motion: childMotion
        } of motion.items) {
          if (childMotion) {
            yield* visitMotion(childMotion);
          }
        }
      }
    }
    function* visitPoseGraph(poseGraph) {
      for (const shell of poseGraph.nodes()) {
        yield* visitPoseNode(shell);
      }
    }
    function* visitPoseNode(node) {
      if (node instanceof PoseNodePlayMotion || node instanceof PoseNodeSampleMotion) {
        if (node.motion) {
          yield* visitMotion(node.motion);
        }
      } else if (node instanceof PoseNodeStateMachine) {
        yield* visitStateMachine(node.stateMachine);
      }
    }
  }
  function* visitAnimationClipsInController(animationController) {
    const {
      graph
    } = animationController;
    if (graph instanceof AnimationGraph) {
      yield* visitAnimationClips(graph);
    } else if (graph instanceof AnimationGraphVariant) {
      const {
        original,
        clipOverrides
      } = graph;
      if (original) {
        for (const clip of visitAnimationClips(original)) {
          var _clipOverrides$get;
          yield (_clipOverrides$get = clipOverrides.get(clip)) != null ? _clipOverrides$get : clip;
        }
      }
    }
  }
  _export({
    visitAnimationGraphEditorExtras: visitAnimationGraphEditorExtras,
    visitAnimationClips: visitAnimationClips,
    visitAnimationClipsInController: visitAnimationClipsInController
  });
  return {
    setters: [function (_cocosAnimationMarionetteMotionIndexJs) {
      ClipMotion = _cocosAnimationMarionetteMotionIndexJs.ClipMotion;
      AnimationBlend1D = _cocosAnimationMarionetteMotionIndexJs.AnimationBlend1D;
      AnimationBlend2D = _cocosAnimationMarionetteMotionIndexJs.AnimationBlend2D;
      AnimationBlendDirect = _cocosAnimationMarionetteMotionIndexJs.AnimationBlendDirect;
    }, function (_cocosAnimationMarionetteAnimationGraphJs) {
      SubStateMachine = _cocosAnimationMarionetteAnimationGraphJs.SubStateMachine;
      AnimationGraph = _cocosAnimationMarionetteAnimationGraphJs.AnimationGraph;
      ProceduralPoseState = _cocosAnimationMarionetteAnimationGraphJs.ProceduralPoseState;
    }, function (_cocosAnimationMarionetteStateMachineMotionStateJs) {
      MotionState = _cocosAnimationMarionetteStateMachineMotionStateJs.MotionState;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesStateMachineJs) {
      PoseNodeStateMachine = _cocosAnimationMarionettePoseGraphPoseNodesStateMachineJs.PoseNodeStateMachine;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesPlayMotionJs) {
      PoseNodePlayMotion = _cocosAnimationMarionettePoseGraphPoseNodesPlayMotionJs.PoseNodePlayMotion;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesSampleMotionJs) {
      PoseNodeSampleMotion = _cocosAnimationMarionettePoseGraphPoseNodesSampleMotionJs.PoseNodeSampleMotion;
    }, function (_cocosAnimationMarionetteAnimationGraphVariantJs) {
      AnimationGraphVariant = _cocosAnimationMarionetteAnimationGraphVariantJs.AnimationGraphVariant;
    }],
    execute: function () {}
  };
});