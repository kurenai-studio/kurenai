System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/foundation/pose-graph-node.js", ["../../../../core/index.js"], function (_export, _context) {
  "use strict";

  var EditorExtendable, PoseGraphNode;
  _export("PoseGraphNode", void 0);
  return {
    setters: [function (_coreIndexJs) {
      EditorExtendable = _coreIndexJs.EditorExtendable;
    }],
    execute: function () {
      /**
       * @zh
       * 姿势图中的结点类。
       * @en
       * Class of node in pose graph.
       */
      _export("PoseGraphNode", PoseGraphNode = class PoseGraphNode extends EditorExtendable {});
    }
  };
});