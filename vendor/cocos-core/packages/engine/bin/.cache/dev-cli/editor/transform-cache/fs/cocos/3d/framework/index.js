System.register("q-bundled:///fs/cocos/3d/framework/index.js", ["./mesh-renderer.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_meshRendererJs) {
      _export("MeshRenderer", _meshRendererJs.MeshRenderer);
    }, function (_deprecatedJs) {
      var _exportObj = {};
      for (var _key in _deprecatedJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _deprecatedJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {}
  };
});