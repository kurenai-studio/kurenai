System.register("q-bundled:///fs/cocos/animation/value-proxy-factories/index.js", ["./uniform.js", "./morph-weights.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_uniformJs) {
      var _exportObj = {};
      for (var _key in _uniformJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _uniformJs[_key];
      }
      _export(_exportObj);
    }, function (_morphWeightsJs) {
      _export({
        MorphWeightValueProxy: _morphWeightsJs.MorphWeightValueProxy,
        MorphWeightsValueProxy: _morphWeightsJs.MorphWeightsValueProxy,
        MorphWeightsAllValueProxy: _morphWeightsJs.MorphWeightsAllValueProxy
      });
    }],
    execute: function () {}
  };
});