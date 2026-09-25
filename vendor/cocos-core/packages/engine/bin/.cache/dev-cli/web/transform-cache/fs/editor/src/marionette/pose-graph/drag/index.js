System.register("q-bundled:///fs/editor/src/marionette/pose-graph/drag/index.js", ["./registry.js", "./handlers/play-motion.js", "./handlers/sample-motion.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_registryJs) {
      _export({
        getPoseGraphAssetDragHandlersMap: _registryJs.getPoseGraphAssetDragHandlersMap,
        createPoseNodeOnAssetDrag: _registryJs.createPoseNodeOnAssetDrag
      });
    }, function (_handlersPlayMotionJs) {}, function (_handlersSampleMotionJs) {}],
    execute: function () {}
  };
});