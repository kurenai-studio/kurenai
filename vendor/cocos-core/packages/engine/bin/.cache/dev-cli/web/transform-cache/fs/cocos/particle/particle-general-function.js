System.register("q-bundled:///fs/cocos/particle/particle-general-function.js", ["../core/math/index.js", "./animator/curve-range.js", "./animator/gradient-range.js", "./enum.js"], function (_export, _context) {
  "use strict";

  var Mat4, Quat, random, randomRange, randomRangeInt, Vec2, Vec3, bits, CurveRange, GradientRange, ParticleSpace, particleEmitZAxis;
  function calculateTransform(systemSpace, moduleSpace, worldTransform, outQuat) {
    if (moduleSpace !== systemSpace) {
      if (systemSpace === ParticleSpace.World) {
        Mat4.getRotation(outQuat, worldTransform);
      } else {
        Mat4.invert(worldTransform, worldTransform);
        Mat4.getRotation(outQuat, worldTransform);
      }
      return true;
    } else {
      Quat.set(outQuat, 0, 0, 0, 1);
      return false;
    }
  }
  function fixedAngleUnitVector2(out, theta) {
    Vec2.set(out, Math.cos(theta), Math.sin(theta));
  }
  function randomUnitVector2(out) {
    const a = randomRange(0, 2 * Math.PI);
    const x = Math.cos(a);
    const y = Math.sin(a);
    Vec2.set(out, x, y);
  }
  function randomUnitVector(out) {
    const z = randomRange(-1, 1);
    const a = randomRange(0, 2 * Math.PI);
    const r = Math.sqrt(1 - z * z);
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    Vec3.set(out, x, y, z);
  }
  function randomPointInUnitSphere(out) {
    randomUnitVector(out);
    Vec3.multiplyScalar(out, out, random());
  }
  function randomPointBetweenSphere(out, minRadius, maxRadius) {
    randomUnitVector(out);
    Vec3.multiplyScalar(out, out, minRadius + (maxRadius - minRadius) * random());
  }
  function randomPointInUnitCircle(out) {
    randomUnitVector2(out);
    out.z = 0;
    Vec3.multiplyScalar(out, out, random());
  }
  function randomPointBetweenCircle(out, minRadius, maxRadius) {
    randomUnitVector2(out);
    out.z = 0;
    Vec3.multiplyScalar(out, out, minRadius + (maxRadius - minRadius) * random());
  }
  function randomPointBetweenCircleAtFixedAngle(out, minRadius, maxRadius, theta) {
    fixedAngleUnitVector2(out, theta);
    out.z = 0;
    Vec3.multiplyScalar(out, out, minRadius + (maxRadius - minRadius) * random());
  }
  function randomPointInCube(out, extents) {
    Vec3.set(out, randomRange(-extents.x, extents.x), randomRange(-extents.y, extents.y), randomRange(-extents.z, extents.z));
  }
  function randomPointBetweenCube(out, minBox, maxBox) {
    const subscript = ['x', 'y', 'z'];
    const edge = randomRangeInt(0, 3);
    for (let i = 0; i < 3; i++) {
      if (i === edge) {
        out[subscript[i]] = randomRange(-maxBox[subscript[i]], maxBox[subscript[i]]);
        continue;
      }
      const x = random() * 2 - 1;
      if (x < 0) {
        out[subscript[i]] = -minBox[subscript[i]] + x * (maxBox[subscript[i]] - minBox[subscript[i]]);
      } else {
        out[subscript[i]] = minBox[subscript[i]] + x * (maxBox[subscript[i]] - minBox[subscript[i]]);
      }
    }
  }

  // Fisher–Yates shuffle
  function randomSortArray(arr) {
    for (let i = 0; i < arr.length; i++) {
      const transpose = i + randomRangeInt(0, arr.length - i);
      const val = arr[transpose];
      arr[transpose] = arr[i];
      arr[i] = val;
    }
  }
  function randomSign() {
    let sgn = randomRange(-1, 1);
    if (sgn === 0) {
      sgn++;
    }
    return bits.sign(sgn);
  }

  /**
   * @en judge if the CurveRange use TwoCurves or TwoConstants
   * @zh 判断粒子的CurveRange是否使用了 TwoCurves 或者 TwoConstants
   */
  function isCurveTwoValues(curve) {
    const Mode = CurveRange.Mode;
    switch (curve.mode) {
      case Mode.TwoCurves:
      case Mode.TwoConstants:
        return true;
      default:
        return false;
    }
  }
  /**
   * @en judge if the GradientRange TwoValues use TwoGradients or TwoColors
   * @zh 判断粒子的 GradientRange 是否使用了 TwoGradients 或者 TwoColors
   */
  function isGradientTwoValues(color) {
    const Mode = GradientRange.Mode;
    switch (color.mode) {
      case Mode.TwoGradients:
      case Mode.TwoColors:
        return true;
      default:
        return false;
    }
  }
  _export({
    calculateTransform: calculateTransform,
    fixedAngleUnitVector2: fixedAngleUnitVector2,
    randomUnitVector2: randomUnitVector2,
    randomUnitVector: randomUnitVector,
    randomPointInUnitSphere: randomPointInUnitSphere,
    randomPointBetweenSphere: randomPointBetweenSphere,
    randomPointInUnitCircle: randomPointInUnitCircle,
    randomPointBetweenCircle: randomPointBetweenCircle,
    randomPointBetweenCircleAtFixedAngle: randomPointBetweenCircleAtFixedAngle,
    randomPointInCube: randomPointInCube,
    randomPointBetweenCube: randomPointBetweenCube,
    randomSortArray: randomSortArray,
    randomSign: randomSign,
    isCurveTwoValues: isCurveTwoValues,
    isGradientTwoValues: isGradientTwoValues
  });
  return {
    setters: [function (_coreMathIndexJs) {
      Mat4 = _coreMathIndexJs.Mat4;
      Quat = _coreMathIndexJs.Quat;
      random = _coreMathIndexJs.random;
      randomRange = _coreMathIndexJs.randomRange;
      randomRangeInt = _coreMathIndexJs.randomRangeInt;
      Vec2 = _coreMathIndexJs.Vec2;
      Vec3 = _coreMathIndexJs.Vec3;
      bits = _coreMathIndexJs.bits;
    }, function (_animatorCurveRangeJs) {
      CurveRange = _animatorCurveRangeJs.default;
    }, function (_animatorGradientRangeJs) {
      GradientRange = _animatorGradientRangeJs.default;
    }, function (_enumJs) {
      ParticleSpace = _enumJs.ParticleSpace;
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
      _export("particleEmitZAxis", particleEmitZAxis = new Vec3(0, 0, -1));
    }
  };
});