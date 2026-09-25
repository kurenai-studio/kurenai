System.register("q-bundled:///fs/cocos/particle/index.js", ["./billboard.js", "./line.js", "./particle-system.js", "./particle-utils.js", "./animator/curve-range.js", "../core/index.js", "./animator/gradient-range.js", "./burst.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  var Billboard, Line, ParticleSystem, ParticleUtils, CurveRange, cclegacy, GradientRange, Burst;
  return {
    setters: [function (_billboardJs) {
      Billboard = _billboardJs.Billboard;
    }, function (_lineJs) {
      Line = _lineJs.Line;
    }, function (_particleSystemJs) {
      ParticleSystem = _particleSystemJs.ParticleSystem;
    }, function (_particleUtilsJs) {
      ParticleUtils = _particleUtilsJs.ParticleUtils;
    }, function (_animatorCurveRangeJs) {
      CurveRange = _animatorCurveRangeJs.default;
    }, function (_coreIndexJs) {
      cclegacy = _coreIndexJs.cclegacy;
    }, function (_animatorGradientRangeJs) {
      GradientRange = _animatorGradientRangeJs.default;
    }, function (_burstJs) {
      Burst = _burstJs.default;
    }, function (_deprecatedJs) {
      var _exportObj = {};
      for (var _key in _deprecatedJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _deprecatedJs[_key];
      }
      _export(_exportObj);
    }],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      _export("Billboard", Billboard);
      _export("Line", Line);
      _export("ParticleSystem", ParticleSystem);
      _export("ParticleUtils", ParticleUtils);
      _export("CurveRange", CurveRange);
      _export("GradientRange", GradientRange);
      _export("Burst", Burst);
      cclegacy.ParticleUtils = ParticleUtils;
    }
  };
});