System.register("q-bundled:///fs/cocos/2d/utils/index.js", ["./font-loader.js", "./html-text-parser.js", "./text-utils.js", "./dynamic-atlas/atlas-manager.js", "./dynamic-atlas/atlas.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_fontLoaderJs) {}, function (_htmlTextParserJs) {
      var _exportObj = {};
      for (var _key in _htmlTextParserJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _htmlTextParserJs[_key];
      }
      _export(_exportObj);
    }, function (_textUtilsJs) {
      var _exportObj2 = {};
      for (var _key2 in _textUtilsJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _textUtilsJs[_key2];
      }
      _export(_exportObj2);
    }, function (_dynamicAtlasAtlasManagerJs) {
      var _exportObj3 = {};
      for (var _key3 in _dynamicAtlasAtlasManagerJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _dynamicAtlasAtlasManagerJs[_key3];
      }
      _export(_exportObj3);
    }, function (_dynamicAtlasAtlasJs) {
      _export("Atlas", _dynamicAtlasAtlasJs.Atlas);
    }],
    execute: function () {}
  };
});