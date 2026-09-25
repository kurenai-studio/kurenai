System.register("q-bundled:///fs/cocos/core/geometry/index.js", ["./distance.js", "./deprecated.js", "./geometry-native-ext.js", "./enums.js", "./intersect.js", "./line.js", "./plane.js", "./ray.js", "./triangle.js", "./sphere.js", "./aabb.js", "./obb.js", "./capsule.js", "./frustum.js", "./curve.js", "./spline.js", "./spec.js", "./deprecated-3.0.0.js"], function (_export, _context) {
  "use strict";

  var distance;
  return {
    setters: [function (_distanceJs) {
      distance = _distanceJs;
    }, function (_deprecatedJs) {}, function (_geometryNativeExtJs) {}, function (_enumsJs) {
      _export("enums", _enumsJs.default);
    }, function (_intersectJs) {
      _export("intersect", _intersectJs.default);
    }, function (_lineJs) {
      _export("Line", _lineJs.Line);
    }, function (_planeJs) {
      _export("Plane", _planeJs.Plane);
    }, function (_rayJs) {
      _export("Ray", _rayJs.Ray);
    }, function (_triangleJs) {
      _export("Triangle", _triangleJs.Triangle);
    }, function (_sphereJs) {
      _export("Sphere", _sphereJs.Sphere);
    }, function (_aabbJs) {
      _export("AABB", _aabbJs.AABB);
    }, function (_obbJs) {
      _export("OBB", _obbJs.OBB);
    }, function (_capsuleJs) {
      _export("Capsule", _capsuleJs.Capsule);
    }, function (_frustumJs) {
      _export("Frustum", _frustumJs.Frustum);
    }, function (_curveJs) {
      _export({
        Keyframe: _curveJs.Keyframe,
        AnimationCurve: _curveJs.AnimationCurve,
        WrapModeMask: _curveJs.WrapModeMask,
        constructLegacyCurveAndConvert: _curveJs.constructLegacyCurveAndConvert,
        OptimizedKey: _curveJs.OptimizedKey,
        evalOptCurve: _curveJs.evalOptCurve
      });
    }, function (_splineJs) {
      _export({
        SplineMode: _splineJs.SplineMode,
        Spline: _splineJs.Spline
      });
    }, function (_specJs) {
      var _exportObj = {};
      for (var _key in _specJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _specJs[_key];
      }
      _export(_exportObj);
    }, function (_deprecated300Js) {
      var _exportObj2 = {};
      for (var _key2 in _deprecated300Js) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _deprecated300Js[_key2];
      }
      _export(_exportObj2);
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
      _export("distance", distance); // engine internal exports
    }
  };
});