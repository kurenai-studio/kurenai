System.register("q-bundled:///fs/cocos/asset/asset-manager/index.js", ["./asset-manager.js", "./editor-path-replace.js", "./bundle.js", "./deprecated.js", "./builtin-res-mgr.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_assetManagerJs) {
      _export({
        assetManager: _assetManagerJs.default,
        AssetManager: _assetManagerJs.AssetManager
      });
    }, function (_editorPathReplaceJs) {}, function (_bundleJs) {
      _export("resources", _bundleJs.resources);
    }, function (_deprecatedJs) {
      var _exportObj = {};
      for (var _key in _deprecatedJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _deprecatedJs[_key];
      }
      _export(_exportObj);
    }, function (_builtinResMgrJs) {
      var _exportObj2 = {};
      for (var _key2 in _builtinResMgrJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _builtinResMgrJs[_key2];
      }
      _export(_exportObj2);
    }],
    execute: function () {}
  };
});