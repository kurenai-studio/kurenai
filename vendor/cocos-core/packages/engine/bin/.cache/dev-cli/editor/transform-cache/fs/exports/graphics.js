System.register("q-bundled:///fs/exports/graphics.js", ["./base.js", "../cocos/2d/assembler/graphics/index.js", "../cocos/2d/components/graphics.js"], function (_export, _context) {
  "use strict";

  var cclegacy, graphicsAssembler;
  return {
    setters: [function (_baseJs) {
      cclegacy = _baseJs.cclegacy;
    }, function (_cocos2dAssemblerGraphicsIndexJs) {
      graphicsAssembler = _cocos2dAssemblerGraphicsIndexJs.graphicsAssembler;
    }, function (_cocos2dComponentsGraphicsJs) {
      var _exportObj = {};
      for (var _key in _cocos2dComponentsGraphicsJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _cocos2dComponentsGraphicsJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {
      _export("graphicsAssembler", graphicsAssembler);
      cclegacy.UI.graphicsAssembler = graphicsAssembler;
    }
  };
});