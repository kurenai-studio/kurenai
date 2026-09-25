System.register("q-bundled:///fs/cocos/core/memop/index.js", ["./pool.js", "./recycle-pool.js", "./cached-array.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_poolJs) {
      var _exportObj = {};
      for (var _key in _poolJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _poolJs[_key];
      }
      _export(_exportObj);
    }, function (_recyclePoolJs) {
      var _exportObj2 = {};
      for (var _key2 in _recyclePoolJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _recyclePoolJs[_key2];
      }
      _export(_exportObj2);
    }, function (_cachedArrayJs) {
      var _exportObj3 = {};
      for (var _key3 in _cachedArrayJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _cachedArrayJs[_key3];
      }
      _export(_exportObj3);
    }],
    execute: function () {}
  };
});