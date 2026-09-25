System.register("q-bundled:///fs/cocos/2d/assembler/index.js", ["./utils.js", "./label/index.js", "./sprite/index.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_utilsJs) {}, function (_labelIndexJs) {
      var _exportObj = {};
      for (var _key in _labelIndexJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _labelIndexJs[_key];
      }
      _export(_exportObj);
    }, function (_spriteIndexJs) {
      var _exportObj2 = {};
      for (var _key2 in _spriteIndexJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _spriteIndexJs[_key2];
      }
      _export(_exportObj2);
    }],
    execute: function () {}
  };
});