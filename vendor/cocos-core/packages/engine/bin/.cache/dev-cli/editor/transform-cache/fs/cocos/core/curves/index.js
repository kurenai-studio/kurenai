System.register("q-bundled:///fs/cocos/core/curves/index.js", ["./curve.js", "./quat-curve.js", "./object-curve.js", "./gradient.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_curveJs) {
      _export({
        RealCurve: _curveJs.RealCurve,
        RealInterpolationMode: _curveJs.RealInterpolationMode,
        ExtrapolationMode: _curveJs.ExtrapolationMode,
        TangentWeightMode: _curveJs.TangentWeightMode
      });
    }, function (_quatCurveJs) {
      _export({
        QuatCurve: _quatCurveJs.QuatCurve,
        QuatInterpolationMode: _quatCurveJs.QuatInterpolationMode
      });
    }, function (_objectCurveJs) {
      _export("ObjectCurve", _objectCurveJs.ObjectCurve);
    }, function (_gradientJs) {
      var _exportObj = {};
      for (var _key in _gradientJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _gradientJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {}
  };
});