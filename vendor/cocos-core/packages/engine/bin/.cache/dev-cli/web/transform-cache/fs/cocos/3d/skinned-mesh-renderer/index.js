System.register("q-bundled:///fs/cocos/3d/skinned-mesh-renderer/index.js", ["./skinned-mesh-renderer.js", "./skinned-mesh-batch-renderer.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_skinnedMeshRendererJs) {
      _export("SkinnedMeshRenderer", _skinnedMeshRendererJs.SkinnedMeshRenderer);
    }, function (_skinnedMeshBatchRendererJs) {
      _export({
        SkinnedMeshBatchRenderer: _skinnedMeshBatchRendererJs.SkinnedMeshBatchRenderer,
        SkinnedMeshUnit: _skinnedMeshBatchRendererJs.SkinnedMeshUnit
      });
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