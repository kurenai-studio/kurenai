System.register("q-bundled:///fs/cocos/primitive/index.js", ["./utils.js", "./define.js", "./box.js", "./cone.js", "./cylinder.js", "./plane.js", "./quad.js", "./sphere.js", "./torus.js", "./capsule.js", "./circle.js", "./transform.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_utilsJs) {
      var _exportObj = {};
      for (var _key in _utilsJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _utilsJs[_key];
      }
      _export(_exportObj);
    }, function (_defineJs) {
      var _exportObj2 = {};
      for (var _key2 in _defineJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _defineJs[_key2];
      }
      _export(_exportObj2);
    }, function (_boxJs) {
      _export("box", _boxJs.default);
    }, function (_coneJs) {
      _export("cone", _coneJs.default);
    }, function (_cylinderJs) {
      _export("cylinder", _cylinderJs.default);
    }, function (_planeJs) {
      _export("plane", _planeJs.default);
    }, function (_quadJs) {
      _export("quad", _quadJs.default);
    }, function (_sphereJs) {
      _export("sphere", _sphereJs.default);
    }, function (_torusJs) {
      _export("torus", _torusJs.default);
    }, function (_capsuleJs) {
      _export("capsule", _capsuleJs.default);
    }, function (_circleJs) {
      _export("circle", _circleJs.default);
    }, function (_transformJs) {
      _export({
        translate: _transformJs.translate,
        scale: _transformJs.scale,
        wireframed: _transformJs.wireframed
      });
    }],
    execute: function () {}
  };
});