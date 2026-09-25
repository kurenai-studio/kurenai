System.register("q-bundled:///fs/cocos/3d/lights/index.js", ["./directional-light-component.js", "./light-component.js", "./sphere-light-component.js", "./spot-light-component.js", "./point-light-component.js", "./ranged-directional-light-component.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_directionalLightComponentJs) {
      _export("DirectionalLight", _directionalLightComponentJs.DirectionalLight);
    }, function (_lightComponentJs) {
      _export("Light", _lightComponentJs.Light);
    }, function (_sphereLightComponentJs) {
      _export("SphereLight", _sphereLightComponentJs.SphereLight);
    }, function (_spotLightComponentJs) {
      _export("SpotLight", _spotLightComponentJs.SpotLight);
    }, function (_pointLightComponentJs) {
      _export("PointLight", _pointLightComponentJs.PointLight);
    }, function (_rangedDirectionalLightComponentJs) {
      _export("RangedDirectionalLight", _rangedDirectionalLightComponentJs.RangedDirectionalLight);
    }, function (_deprecatedJs) {
      var _exportObj = {};
      for (var _key in _deprecatedJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _deprecatedJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {}
  };
});