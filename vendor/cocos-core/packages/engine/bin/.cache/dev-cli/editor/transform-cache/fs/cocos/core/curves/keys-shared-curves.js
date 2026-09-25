System.register("q-bundled:///fs/cocos/core/curves/keys-shared-curves.js", ["../data/decorators/index.js", "../algorithm/binary-search.js", "../data/utils/asserts.js", "../math/index.js", "./curve.js", "./quat-curve.js", "./real-curve-param.js"], function (_export, _context) {
  "use strict";

  var ccclass, serializable, binarySearchEpsilon, assertIsTrue, approx, lerp, Quat, ExtrapolationMode, QuatInterpolationMode, RealInterpolationMode, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _dec2, _class3, _class4, _descriptor4, _dec3, _class5, _class6, _descriptor5, DEFAULT_EPSILON, DefaultFloatArray, KeysSharedCurves, globalLocation, KeySharedRealCurves, cacheQuat1, cacheQuat2, KeySharedQuatCurves;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_dataDecoratorsIndexJs) {
      ccclass = _dataDecoratorsIndexJs.ccclass;
      serializable = _dataDecoratorsIndexJs.serializable;
    }, function (_algorithmBinarySearchJs) {
      binarySearchEpsilon = _algorithmBinarySearchJs.binarySearchEpsilon;
    }, function (_dataUtilsAssertsJs) {
      assertIsTrue = _dataUtilsAssertsJs.assertIsTrue;
    }, function (_mathIndexJs) {
      approx = _mathIndexJs.approx;
      lerp = _mathIndexJs.lerp;
      Quat = _mathIndexJs.Quat;
    }, function (_curveJs) {
      ExtrapolationMode = _curveJs.ExtrapolationMode;
    }, function (_quatCurveJs) {
      QuatInterpolationMode = _quatCurveJs.QuatInterpolationMode;
    }, function (_realCurveParamJs) {
      RealInterpolationMode = _realCurveParamJs.RealInterpolationMode;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      DEFAULT_EPSILON = 1e-5;
      DefaultFloatArray = Float32Array;
      /**
       * Considering most of model animations are baked and most of its curves share same times,
       * we do not have to do time searching for many times.
       */
      KeysSharedCurves = (_dec = ccclass('cc.KeySharedCurves'), _dec(_class = (_class2 = class KeysSharedCurves {
        /**
         * Only for internal(serialization) usage.
         */

        constructor(times) {
          _initializerDefineProperty(this, "_times", _descriptor, this);
          _initializerDefineProperty(this, "_optimized", _descriptor2, this);
          _initializerDefineProperty(this, "_keyframesCount", _descriptor3, this);
          if (!times) {
            this._times = new DefaultFloatArray();
            return;
          }
          const nKeyframes = times.length;
          this._keyframesCount = nKeyframes;
          this._times = DefaultFloatArray.from(times);
          if (nKeyframes > 1) {
            const EPSILON = 1e-6;
            let lastDiff = 0.0;
            let mayBeOptimized = false;
            for (let iFrame = 1; iFrame < nKeyframes; iFrame++) {
              const curDiff = times[iFrame] - times[iFrame - 1];
              if (iFrame === 1) {
                lastDiff = curDiff;
              } else if (Math.abs(curDiff - lastDiff) > EPSILON) {
                mayBeOptimized = false;
                break;
              }
            }
            if (mayBeOptimized) {
              this._optimized = true;
              this._times = new DefaultFloatArray([this._times[0], this._times[1]]);
            }
          }
        }
        get keyframesCount() {
          return this._keyframesCount;
        }
        matchTimes(times, EPSILON = DEFAULT_EPSILON) {
          if (this._optimized) {
            const firstTime = this._times[0];
            const diff = this._times[1] - firstTime;
            return times.every((t, iKeyframe) => approx(t, firstTime + diff * iKeyframe, EPSILON));
          } else {
            return times.every((t, iKeyframe) => approx(t, this._times[iKeyframe], EPSILON));
          }
        }
        getFirstTime() {
          return this._times[0];
        }
        getLastTime() {
          if (!this._optimized) {
            return this._times[this._times.length - 1];
          } else {
            const diff = this._times[1] - this._times[0];
            return this._times[0] + diff * this._keyframesCount;
          }
        }
        calculateLocation(time, out) {
          const {
            _times: times,
            _optimized: optimized,
            keyframesCount: nKeyframes
          } = this;
          if (optimized) {
            const firstTime = times[0];
            const diff = times[1] - firstTime;
            const div = (time - firstTime) / diff;
            const previous = Math.floor(div);
            out.previous = previous;
            out.ratio = div - previous;
          } else {
            const index = binarySearchEpsilon(times, time);
            if (index >= 0) {
              // Exactly matched
              out.previous = index;
              out.ratio = 0.0;
            } else {
              const iNext = ~index;
              assertIsTrue(iNext >= 1 && iNext < nKeyframes);
              const iPrev = iNext - 1;
              const prevTime = times[iPrev];
              out.ratio = (time - prevTime) / (times[iNext] - prevTime);
              out.previous = iPrev;
            }
          }
          return out;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_times", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_optimized", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_keyframesCount", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0;
        }
      }), _class2)) || _class);
      globalLocation = {
        previous: 0,
        ratio: 0
      };
      _export("KeySharedRealCurves", KeySharedRealCurves = (_dec2 = ccclass('cc.KeySharedRealCurves'), _dec2(_class3 = (_class4 = class KeySharedRealCurves extends KeysSharedCurves {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_curves", _descriptor4, this);
        }
        static allowedForCurve(curve) {
          return curve.postExtrapolation === ExtrapolationMode.CLAMP && curve.preExtrapolation === ExtrapolationMode.CLAMP && Array.from(curve.values()).every(value => value.interpolationMode === RealInterpolationMode.LINEAR);
        }
        get curveCount() {
          return this._curves.length;
        }
        matchCurve(curve, EPSILON = DEFAULT_EPSILON) {
          if (curve.keyFramesCount !== this.keyframesCount) {
            return false;
          }
          const times = Array.from(curve.times());
          return super.matchTimes(times, EPSILON);
        }
        addCurve(curve) {
          assertIsTrue(curve.keyFramesCount === this.keyframesCount);
          this._curves.push({
            values: DefaultFloatArray.from(Array.from(curve.values()).map(({
              value
            }) => value))
          });
        }
        evaluate(time, values) {
          const {
            _curves: curves,
            keyframesCount: nKeyframes
          } = this;
          const nCurves = curves.length;
          assertIsTrue(values.length === nCurves);
          if (nKeyframes === 0) {
            return;
          }
          const firstTime = super.getFirstTime();
          if (time <= firstTime) {
            for (let iCurve = 0; iCurve < nCurves; ++iCurve) {
              values[iCurve] = this._curves[iCurve].values[0];
            }
            return;
          }
          const lastTime = super.getLastTime();
          if (time >= lastTime) {
            const iLastFrame = nKeyframes - 1;
            for (let iCurve = 0; iCurve < nCurves; ++iCurve) {
              values[iCurve] = this._curves[iCurve].values[iLastFrame];
            }
            return;
          }
          const {
            previous,
            ratio
          } = super.calculateLocation(time, globalLocation);
          if (ratio !== 0.0) {
            for (let iCurve = 0; iCurve < nCurves; ++iCurve) {
              const {
                values: curveValues
              } = this._curves[iCurve];
              values[iCurve] = lerp(curveValues[previous], curveValues[previous + 1], ratio);
            }
          } else {
            for (let iCurve = 0; iCurve < nCurves; ++iCurve) {
              const {
                values: curveValues
              } = this._curves[iCurve];
              values[iCurve] = curveValues[previous];
            }
          }
        }
      }, _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_curves", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class4)) || _class3));
      cacheQuat1 = new Quat();
      cacheQuat2 = new Quat();
      _export("KeySharedQuatCurves", KeySharedQuatCurves = (_dec3 = ccclass('cc.KeySharedQuatCurves'), _dec3(_class5 = (_class6 = class KeySharedQuatCurves extends KeysSharedCurves {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "_curves", _descriptor5, this);
        }
        static allowedForCurve(curve) {
          return curve.postExtrapolation === ExtrapolationMode.CLAMP && curve.preExtrapolation === ExtrapolationMode.CLAMP && Array.from(curve.values()).every(value => value.interpolationMode === QuatInterpolationMode.SLERP);
        }
        get curveCount() {
          return this._curves.length;
        }
        matchCurve(curve, EPSILON = 1e-5) {
          if (curve.keyFramesCount !== this.keyframesCount) {
            return false;
          }
          const times = Array.from(curve.times());
          return super.matchTimes(times, EPSILON);
        }
        addCurve(curve) {
          assertIsTrue(curve.keyFramesCount === this.keyframesCount);
          const values = new DefaultFloatArray(curve.keyFramesCount * 4);
          const nKeyframes = curve.keyFramesCount;
          for (let iKeyframe = 0; iKeyframe < nKeyframes; ++iKeyframe) {
            Quat.toArray(values, curve.getKeyframeValue(iKeyframe).value, 4 * iKeyframe);
          }
          this._curves.push({
            values
          });
        }
        evaluate(time, values) {
          const {
            _curves: curves,
            keyframesCount: nKeyframes
          } = this;
          const nCurves = curves.length;
          assertIsTrue(values.length === nCurves);
          if (nKeyframes === 0) {
            return;
          }
          const firstTime = super.getFirstTime();
          if (time <= firstTime) {
            for (let iCurve = 0; iCurve < nCurves; ++iCurve) {
              Quat.fromArray(values[iCurve], this._curves[iCurve].values, 0);
            }
            return;
          }
          const lastTime = super.getLastTime();
          if (time >= lastTime) {
            const iLastFrame = nKeyframes - 1;
            for (let iCurve = 0; iCurve < nCurves; ++iCurve) {
              Quat.fromArray(values[iCurve], this._curves[iCurve].values, iLastFrame * 4);
            }
            return;
          }
          const {
            previous,
            ratio
          } = super.calculateLocation(time, globalLocation);
          if (ratio !== 0.0) {
            for (let iCurve = 0; iCurve < nCurves; ++iCurve) {
              const {
                values: curveValues
              } = this._curves[iCurve];
              const q1 = Quat.fromArray(cacheQuat1, curveValues, previous * 4);
              const q2 = Quat.fromArray(cacheQuat2, curveValues, (previous + 1) * 4);
              Quat.slerp(values[iCurve], q1, q2, ratio);
            }
          } else {
            for (let iCurve = 0; iCurve < nCurves; ++iCurve) {
              Quat.fromArray(values[iCurve], this._curves[iCurve].values, previous * 4);
            }
          }
        }
      }, _descriptor5 = _applyDecoratedDescriptor(_class6.prototype, "_curves", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class6)) || _class5));
    }
  };
});