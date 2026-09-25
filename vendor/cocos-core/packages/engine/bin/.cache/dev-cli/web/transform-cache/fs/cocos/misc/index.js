System.register("q-bundled:///fs/cocos/misc/index.js", ["./intersect.js", "./camera-component.js", "./model-renderer.js", "./renderer.js", "./missing-script.js", "./prefab-link.js", "./FeedStatusController.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_intersectJs) {}, function (_cameraComponentJs) {
      _export("Camera", _cameraComponentJs.Camera);
    }, function (_modelRendererJs) {
      _export("ModelRenderer", _modelRendererJs.ModelRenderer);
    }, function (_rendererJs) {
      _export("Renderer", _rendererJs.Renderer);
    }, function (_missingScriptJs) {
      _export("MissingScript", _missingScriptJs.MissingScript);
    }, function (_prefabLinkJs) {
      _export("PrefabLink", _prefabLinkJs.PrefabLink);
    }, function (_FeedStatusControllerJs) {
      _export("FeedStatusController", _FeedStatusControllerJs.FeedStatusController);
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