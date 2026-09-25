System.register("q-bundled:///fs/editor/exports/color-utils.js", ["../../cocos/core/math/color.js"], function (_export, _context) {
  "use strict";

  var linearToSrgb8Bit, srgbToLinear;
  return {
    setters: [function (_cocosCoreMathColorJs) {
      linearToSrgb8Bit = _cocosCoreMathColorJs.linearToSrgb8Bit;
      srgbToLinear = _cocosCoreMathColorJs.srgbToLinear;
    }],
    execute: function () {
      _export("linearToSrgb8Bit", linearToSrgb8Bit);
      _export("srgbToLinear", srgbToLinear);
    }
  };
});