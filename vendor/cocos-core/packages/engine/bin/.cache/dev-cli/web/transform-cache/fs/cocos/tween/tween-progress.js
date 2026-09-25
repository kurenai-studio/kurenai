System.register("q-bundled:///fs/cocos/tween/tween-progress.js", ["../core/geometry/index.js", "../core/math/index.js"], function (_export, _context) {
  "use strict";

  var Spline, SplineMode, Vec3, _v3_tmp_1, _v3_tmp_2;
  function createSplineProperty(mode, knots) {
    let spline = null;
    return {
      value: knots.length > 0 ? knots[knots.length - 1] : Vec3.ZERO,
      progress(start, end, current, ratio) {
        return spline.getPoint(ratio);
      },
      clone(v) {
        return Vec3.clone(v);
      },
      add(a, b) {
        return a.clone().add(b);
      },
      sub(a, b) {
        return a.clone().subtract(b);
      },
      onStart(param) {
        const {
          start,
          end,
          relative,
          reversed
        } = param;
        spline = Spline.create(mode);
        spline.addKnot(start);
        let reversedLast = null;
        if (relative && reversed) {
          reversedLast = _v3_tmp_2;
          Vec3.subtract(reversedLast, start, knots[knots.length - 1]);
        }
        for (let i = 0, len = knots.length; i < len; ++i) {
          const v = reversed ? knots[len - 1 - i] : knots[i];
          if (relative) {
            if (reversed) {
              // Skip the start point ( i = 0 )
              if (i > 0) {
                // addKnot will copy the knot, so use a temporary Vec3 object here to avoid GC object being generated. 
                spline.addKnot(Vec3.copy(_v3_tmp_1, reversedLast).add(v));
              }
            } else {
              spline.addKnot(Vec3.copy(_v3_tmp_1, start).add(v));
            }
          } else {
            spline.addKnot(v);
          }
        }
        if (relative && reversed) {
          spline.addKnot(end);
        }
      },
      onComplete() {
        spline = null;
      },
      onStop() {
        spline = null;
      },
      legacyProgress: false
    };
  }
  function bezier(...knots) {
    return createSplineProperty(SplineMode.BEZIER, knots);
  }
  function catmullRom(...knots) {
    return createSplineProperty(SplineMode.CATMULL_ROM, knots);
  }
  _export({
    bezier: bezier,
    catmullRom: catmullRom
  });
  return {
    setters: [function (_coreGeometryIndexJs) {
      Spline = _coreGeometryIndexJs.Spline;
      SplineMode = _coreGeometryIndexJs.SplineMode;
    }, function (_coreMathIndexJs) {
      Vec3 = _coreMathIndexJs.Vec3;
    }],
    execute: function () {
      /*
       Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
      
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
      _v3_tmp_1 = new Vec3();
      _v3_tmp_2 = new Vec3();
    }
  };
});