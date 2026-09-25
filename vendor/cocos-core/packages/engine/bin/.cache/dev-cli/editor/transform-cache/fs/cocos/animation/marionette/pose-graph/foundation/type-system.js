System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/foundation/type-system.js", [], function (_export, _context) {
  "use strict";

  var PoseGraphType;
  return {
    setters: [],
    execute: function () {
      _export("PoseGraphType", PoseGraphType = /*#__PURE__*/function (PoseGraphType) {
        PoseGraphType[PoseGraphType["FLOAT"] = 0] = "FLOAT";
        PoseGraphType[PoseGraphType["INTEGER"] = 1] = "INTEGER";
        PoseGraphType[PoseGraphType["BOOLEAN"] = 2] = "BOOLEAN";
        PoseGraphType[PoseGraphType["VEC3"] = 3] = "VEC3";
        PoseGraphType[PoseGraphType["QUAT"] = 4] = "QUAT";
        PoseGraphType[PoseGraphType["POSE"] = 5] = "POSE";
        return PoseGraphType;
      }({}));
    }
  };
});