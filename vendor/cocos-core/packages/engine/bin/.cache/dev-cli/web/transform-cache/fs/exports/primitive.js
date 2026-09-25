System.register("q-bundled:///fs/exports/primitive.js", ["../cocos/primitive/index.js", "../cocos/core/global-exports.js", "../cocos/primitive/primitive.js"], function (_export, _context) {
  "use strict";

  var primitives, legacyCC;
  return {
    setters: [function (_cocosPrimitiveIndexJs) {
      primitives = _cocosPrimitiveIndexJs;
    }, function (_cocosCoreGlobalExportsJs) {
      legacyCC = _cocosCoreGlobalExportsJs.legacyCC;
    }, function (_cocosPrimitivePrimitiveJs) {
      var _exportObj = {};
      for (var _key in _cocosPrimitivePrimitiveJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _cocosPrimitivePrimitiveJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {
      _export("primitives", primitives);
      legacyCC.primitives = primitives;
    }
  };
});