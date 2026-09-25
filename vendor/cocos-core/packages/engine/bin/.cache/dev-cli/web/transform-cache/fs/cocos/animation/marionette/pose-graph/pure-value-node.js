System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pure-value-node.js", ["./foundation/pose-graph-node.js"], function (_export, _context) {
  "use strict";

  var PoseGraphNode, PureValueNode, SingleOutputPVNode;
  _export({
    PureValueNode: void 0,
    SingleOutputPVNode: void 0
  });
  return {
    setters: [function (_foundationPoseGraphNodeJs) {
      PoseGraphNode = _foundationPoseGraphNodeJs.PoseGraphNode;
    }],
    execute: function () {
      /**
       * Base class of all pure value nodes in pose graph.
       *
       * Pure value nodes are nodes in pose graph that yields non-pose-object value(s).
       *
       * Sometimes, pure values nodes are also abbreviated as pv nodes.
       */
      _export("PureValueNode", PureValueNode = class PureValueNode extends PoseGraphNode {
        constructor(outputTypes) {
          super();
          this._outputTypes = [];
          this._outputTypes = outputTypes;
        }
        get outputCount() {
          return this._outputTypes.length;
        }
        getOutputType(outputIndex) {
          return this._outputTypes[outputIndex];
        }
        link(context) {}
      });
      _export("SingleOutputPVNode", SingleOutputPVNode = class SingleOutputPVNode extends PureValueNode {
        constructor(outputType) {
          super([outputType]);
        }
        selfEvaluate(outputs) {
          outputs[0] = this.selfEvaluateDefaultOutput();
        }
      });
    }
  };
});