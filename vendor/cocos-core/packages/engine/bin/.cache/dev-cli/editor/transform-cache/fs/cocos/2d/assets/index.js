System.register("q-bundled:///fs/cocos/2d/assets/index.js", ["./sprite-frame.js", "./sprite-atlas.js", "./ttf-font.js", "./label-atlas.js", "./bitmap-font.js", "./font.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_spriteFrameJs) {
      var _exportObj = {};
      for (var _key in _spriteFrameJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _spriteFrameJs[_key];
      }
      _export(_exportObj);
    }, function (_spriteAtlasJs) {
      _export("SpriteAtlas", _spriteAtlasJs.SpriteAtlas);
    }, function (_ttfFontJs) {
      _export("TTFFont", _ttfFontJs.TTFFont);
    }, function (_labelAtlasJs) {
      _export("LabelAtlas", _labelAtlasJs.LabelAtlas);
    }, function (_bitmapFontJs) {
      _export("BitmapFont", _bitmapFontJs.BitmapFont);
    }, function (_fontJs) {
      _export("Font", _fontJs.Font);
    }],
    execute: function () {}
  };
});