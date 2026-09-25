System.register("q-bundled:///fs/editor/src/marionette/visit/visit-pose-node.js", ["../../../../cocos/animation/marionette/animation-graph.js", "../../../../cocos/animation/marionette/pose-graph/pose-nodes/state-machine.js", "../../../../cocos/animation/marionette/pose-graph/pose-node.js"], function (_export, _context) {
  "use strict";

  var ProceduralPoseState, PoseNodeStateMachine, PoseNode;
  function* visitPoseNodeInLayer(layer) {
    yield* visitPoseNodesInStateMachine(layer.stateMachine, ['']);
    for (const [stashId, stash] of layer.stashes()) {
      yield* visitPoseNodeInPoseGraph(stash.graph, [stashId]);
    }
  }
  function* visitPoseNodeInPoseGraph(poseGraph, root) {
    for (const node of poseGraph.nodes()) {
      if (node instanceof PoseNode) {
        yield [node, poseGraph, ...root];
      }
      if (node instanceof PoseNodeStateMachine) {
        yield* visitPoseNodesInStateMachine(node.stateMachine, [...root]);
      }
    }
  }
  function* visitPoseNodesInStateMachine(stateMachine, root) {
    for (const state of stateMachine.states()) {
      if (state instanceof ProceduralPoseState) {
        yield* visitPoseNodeInPoseGraph(state.graph, [...root]);
      }
    }
  }
  _export({
    visitPoseNodeInLayer: visitPoseNodeInLayer,
    visitPoseNodeInPoseGraph: visitPoseNodeInPoseGraph,
    visitPoseNodesInStateMachine: visitPoseNodesInStateMachine
  });
  return {
    setters: [function (_cocosAnimationMarionetteAnimationGraphJs) {
      ProceduralPoseState = _cocosAnimationMarionetteAnimationGraphJs.ProceduralPoseState;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesStateMachineJs) {
      PoseNodeStateMachine = _cocosAnimationMarionettePoseGraphPoseNodesStateMachineJs.PoseNodeStateMachine;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodeJs) {
      PoseNode = _cocosAnimationMarionettePoseGraphPoseNodeJs.PoseNode;
    }],
    execute: function () {}
  };
});