System.register("q-bundled:///fs/cocos/terrain/index.js", ["./height-field.js", "./terrain.js", "./terrain-asset.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_heightFieldJs) {
      var _exportObj = {};
      for (var _key in _heightFieldJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _heightFieldJs[_key];
      }
      _export(_exportObj);
    }, function (_terrainJs) {
      var _exportObj2 = {};
      for (var _key2 in _terrainJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _terrainJs[_key2];
      }
      _export(_exportObj2);
    }, function (_terrainAssetJs) {
      var _exportObj3 = {};
      for (var _key3 in _terrainAssetJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _terrainAssetJs[_key3];
      }
      _export(_exportObj3);
    }],
    execute: function () {}
  };
});