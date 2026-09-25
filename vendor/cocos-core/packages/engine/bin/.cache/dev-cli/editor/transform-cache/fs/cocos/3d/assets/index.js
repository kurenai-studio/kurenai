System.register("q-bundled:///fs/cocos/3d/assets/index.js", ["./deprecated.js", "./mesh.js", "./skeleton.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_deprecatedJs) {}, function (_meshJs) {
      _export("Mesh", _meshJs.Mesh);
    }, function (_skeletonJs) {
      _export("Skeleton", _skeletonJs.Skeleton);
    }],
    execute: function () {}
  };
});