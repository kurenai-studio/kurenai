System.register("q-bundled:///fs/cocos/core/curves/quat-curve.js", ["../data/utils/asserts.js", "../math/index.js", "./keyframe-curve.js", "./curve.js", "../algorithm/binary-search.js", "../data/decorators/index.js", "../data/index.js", "./easing-method.js", "./bezier.js"], function (_export, _context) {
  "use strict";

  var assertIsTrue, pingPong, Quat, repeat, KeyframeCurve, EasingMethod, ExtrapolationMode, binarySearchEpsilon, ccclass, serializable, uniquelyReferenced, deserializeTag, serializeTag, getEasingFn, bezierByTime, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _dec2, _class3, _class4, _descriptor4, _descriptor5, QuatInterpolationMode, QuatKeyframeValue, QuatCurve, QuatCurveKeyframeValueFlagMask, FLAGS_BYTES, FRAME_COUNT_BYTES, TIME_BYTES, VALUE_BYTES, INTERPOLATION_MODE_BYTES, EASING_METHOD_BYTES, EASING_METHOD_BEZIER_TAG, EASING_METHOD_BEZIER_COMPONENT_BYTES;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function createQuatKeyframeValue(params) {
    return new QuatKeyframeValue(params);
  }

  /**
   * @en
   * Quaternion curve.
   * @zh
   * 四元数曲线
   */
  return {
    setters: [function (_dataUtilsAssertsJs) {
      assertIsTrue = _dataUtilsAssertsJs.assertIsTrue;
    }, function (_mathIndexJs) {
      pingPong = _mathIndexJs.pingPong;
      Quat = _mathIndexJs.Quat;
      repeat = _mathIndexJs.repeat;
    }, function (_keyframeCurveJs) {
      KeyframeCurve = _keyframeCurveJs.KeyframeCurve;
    }, function (_curveJs) {
      EasingMethod = _curveJs.EasingMethod;
      ExtrapolationMode = _curveJs.ExtrapolationMode;
    }, function (_algorithmBinarySearchJs) {
      binarySearchEpsilon = _algorithmBinarySearchJs.binarySearchEpsilon;
    }, function (_dataDecoratorsIndexJs) {
      ccclass = _dataDecoratorsIndexJs.ccclass;
      serializable = _dataDecoratorsIndexJs.serializable;
      uniquelyReferenced = _dataDecoratorsIndexJs.uniquelyReferenced;
    }, function (_dataIndexJs) {
      deserializeTag = _dataIndexJs.deserializeTag;
      serializeTag = _dataIndexJs.serializeTag;
    }, function (_easingMethodJs) {
      getEasingFn = _easingMethodJs.getEasingFn;
    }, function (_bezierJs) {
      bezierByTime = _bezierJs.bezierByTime;
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
      /**
       * @en
       * The method used for interpolation between values of a quaternion keyframe and its next keyframe.
       * @zh
       * 在某四元数关键帧（前一帧）和其下一帧之间插值时使用的插值方式。
       */
      _export("QuatInterpolationMode", QuatInterpolationMode = /*#__PURE__*/function (QuatInterpolationMode) {
        /**
         * @en
         * Perform spherical linear interpolation between previous keyframe value and next keyframe value.
         * @zh
         * 在前一帧和后一帧之间执行球面线性插值。
         */
        QuatInterpolationMode[QuatInterpolationMode["SLERP"] = 0] = "SLERP";
        /**
         * @en
         * Always use the value from this keyframe.
         * @zh
         * 永远使用前一帧的值。
         */
        QuatInterpolationMode[QuatInterpolationMode["CONSTANT"] = 1] = "CONSTANT"; // #region TODO: Spherical Quadrangle Interpolation
        /**
         * TODO: Spherical Quadrangle Interpolation
         * - https://theory.org/software/qfa/writeup/node12.html
         * - http://digitalrune.github.io/DigitalRune-Documentation/html/58f74cca-83a3-5e9e-6d5d-63b09a723f90.htm
         */
        // SQUAD,
        // #endregion
        return QuatInterpolationMode;
      }({}));
      /**
       * View to a quaternion frame value.
       * Note, the view may be invalidated due to keyframe change/add/remove.
       */
      QuatKeyframeValue = (_dec = ccclass('cc.QuatKeyframeValue'), _dec(_class = uniquelyReferenced(_class = (_class2 = class QuatKeyframeValue {
        constructor({
          value,
          interpolationMode,
          easingMethod
        } = {}) {
          /**
           * @en
           * When perform interpolation, the interpolation method should be taken
           * when for this keyframe is used as starting keyframe.
           * @zh
           * 在执行插值时，当以此关键帧作为起始关键帧时应当使用的插值方式。
           */
          _initializerDefineProperty(this, "interpolationMode", _descriptor, this);
          /**
           * @en
           * Value of the keyframe.
           * @zh
           * 该关键帧的值。
           */
          _initializerDefineProperty(this, "value", _descriptor2, this);
          /**
           * @internal Reserved for backward compatibility. Will be removed in future.
           */
          _initializerDefineProperty(this, "easingMethod", _descriptor3, this);
          // TODO: shall we normalize it?
          this.value = value ? Quat.clone(value) : this.value;
          this.interpolationMode = interpolationMode != null ? interpolationMode : this.interpolationMode;
          this.easingMethod = easingMethod != null ? easingMethod : this.easingMethod;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "interpolationMode", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return QuatInterpolationMode.SLERP;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "value", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return Quat.clone(Quat.IDENTITY);
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "easingMethod", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return EasingMethod.LINEAR;
        }
      }), _class2)) || _class) || _class);
      /**
       * The parameter describing a real keyframe value.
       * In the case of partial keyframe value,
       * each component of the keyframe value is taken from the parameter.
       * For unspecified components, default values are taken:
       * - Interpolation mode: slerp
       * - Value: Identity quaternion
       * @zh
       * 用于描述实数关键帧值的参数。
       * 若是部分关键帧的形式，关键帧值的每个分量都是从该参数中取得。
       * 对于未指定的分量，使用默认值：
       * - 插值模式：球面线性插值
       * - 值：单位四元数
       */
      _export("QuatCurve", QuatCurve = (_dec2 = ccclass('cc.QuatCurve'), _dec2(_class3 = (_class4 = class QuatCurve extends KeyframeCurve {
        constructor() {
          super();
          /**
           * @en
           * Gets or sets the pre-extrapolation-mode of this curve.
           * Defaults to `ExtrapolationMode.CLAMP`.
           * @zh
           * 获取或设置此曲线的前向外推模式。
           * 默认为 `ExtrapolationMode.CLAMP`。
           */
          _initializerDefineProperty(this, "preExtrapolation", _descriptor4, this);
          /**
           * @en
           * Gets or sets the post-extrapolation-mode of this curve.
           * Defaults to `ExtrapolationMode.CLAMP`.
           * @zh
           * 获取或设置此曲线的后向外推模式。
           * 默认为 `ExtrapolationMode.CLAMP`。
           */
          _initializerDefineProperty(this, "postExtrapolation", _descriptor5, this);
        }
        /**
         * @en
         * Evaluates this curve at specified time.
         * @zh
         * 计算此曲线在指定时间上的值。
         * @param time Input time.
         * @param quat If specified, this value will be filled and returned.
         * Otherwise a new quaternion object will be filled and returned.
         * @returns Result value.
         */
        evaluate(time, quat) {
          quat != null ? quat : quat = new Quat();
          const {
            _times: times,
            _values: values,
            postExtrapolation,
            preExtrapolation
          } = this;
          const nFrames = times.length;
          if (nFrames === 0) {
            return quat;
          }
          const firstTime = times[0];
          const lastTime = times[nFrames - 1];
          if (time < firstTime) {
            // Underflow
            const preValue = values[0];
            switch (preExtrapolation) {
              case ExtrapolationMode.LOOP:
                time = firstTime + repeat(time - firstTime, lastTime - firstTime);
                break;
              case ExtrapolationMode.PING_PONG:
                time = firstTime + pingPong(time - firstTime, lastTime - firstTime);
                break;
              case ExtrapolationMode.CLAMP:
              default:
                return Quat.copy(quat, preValue.value);
            }
          } else if (time > lastTime) {
            // Overflow
            const preValue = values[nFrames - 1];
            switch (postExtrapolation) {
              case ExtrapolationMode.LOOP:
                time = firstTime + repeat(time - firstTime, lastTime - firstTime);
                break;
              case ExtrapolationMode.PING_PONG:
                time = firstTime + pingPong(time - firstTime, lastTime - firstTime);
                break;
              case ExtrapolationMode.CLAMP:
              default:
                return Quat.copy(quat, preValue.value);
            }
          }
          const index = binarySearchEpsilon(times, time);
          if (index >= 0) {
            return Quat.copy(quat, values[index].value);
          }
          const iNext = ~index;
          assertIsTrue(iNext !== 0 && iNext !== nFrames && nFrames > 1);
          const iPre = iNext - 1;
          const preTime = times[iPre];
          const preValue = values[iPre];
          const nextTime = times[iNext];
          const nextValue = values[iNext];
          assertIsTrue(nextTime > time && time > preTime);
          const dt = nextTime - preTime;
          const ratio = (time - preTime) / dt;
          switch (preValue.interpolationMode) {
            default:
            case QuatInterpolationMode.CONSTANT:
              return Quat.copy(quat, preValue.value);
            case QuatInterpolationMode.SLERP:
              {
                const {
                  easingMethod
                } = preValue;
                const transformedRatio = easingMethod === EasingMethod.LINEAR ? ratio : Array.isArray(easingMethod) ? bezierByTime(easingMethod, ratio) : getEasingFn(easingMethod)(ratio);
                return Quat.slerp(quat, preValue.value, nextValue.value, transformedRatio);
              }
          }
        }

        /**
         * Adds a keyframe into this curve.
         * @param time Time of the keyframe.
         * @param value Value of the keyframe.
         * @returns The index to the new keyframe.
         */
        addKeyFrame(time, value) {
          const keyframeValue = new QuatKeyframeValue(value);
          return super.addKeyFrame(time, keyframeValue);
        }

        /**
         * Assigns all keyframes.
         * @param keyframes An iterable to keyframes. The keyframes should be sorted by their time.
         */

        /**
           * Assigns all keyframes.
           * @param times Times array. Should be sorted.
           * @param values Values array. Corresponding to each time in `times`.
           */

        assignSorted(times, values) {
          if (values !== undefined) {
            assertIsTrue(Array.isArray(times));
            this.setKeyframes(times.slice(), values.map(value => createQuatKeyframeValue(value)));
          } else {
            const keyframes = Array.from(times);
            this.setKeyframes(keyframes.map(([time]) => time), keyframes.map(([, value]) => createQuatKeyframeValue(value)));
          }
        }

        /**
         * @internal
         */
        [serializeTag](output, context) {
          if (!context.toCCON) {
            output.writeThis();
            return;
          }
          const {
            _times: times,
            _values: keyframeValues
          } = this;
          let interpolationModeRepeated = true;
          keyframeValues.forEach((keyframeValue, _index, [firstKeyframeValue]) => {
            // Values are unlikely to be unified.
            if (interpolationModeRepeated && keyframeValue.interpolationMode !== firstKeyframeValue.interpolationMode) {
              interpolationModeRepeated = false;
            }
          });
          const nKeyframes = times.length;
          const nFrames = nKeyframes;
          const interpolationModesSize = INTERPOLATION_MODE_BYTES * (interpolationModeRepeated ? 1 : nFrames);
          const easingMethodsSize = keyframeValues.reduce((result, {
            easingMethod
          }) => result += Array.isArray(easingMethod) ? EASING_METHOD_BYTES + EASING_METHOD_BEZIER_COMPONENT_BYTES * 4 : EASING_METHOD_BYTES, 0);
          let dataSize = 0;
          dataSize += FLAGS_BYTES + FRAME_COUNT_BYTES + TIME_BYTES * nFrames + VALUE_BYTES * 4 * nFrames + easingMethodsSize + interpolationModesSize + 0;
          const dataView = new DataView(new ArrayBuffer(dataSize));
          let P = 0;

          // Flags
          let flags = 0;
          if (interpolationModeRepeated) {
            flags |= QuatCurveKeyframeValueFlagMask.INTERPOLATION_MODE;
          }
          dataView.setUint32(P, flags, true);
          P += FLAGS_BYTES;

          // Frame count
          dataView.setUint32(P, nFrames, true);
          P += FRAME_COUNT_BYTES;

          // Times
          times.forEach((time, index) => dataView.setFloat32(P + TIME_BYTES * index, time, true));
          P += TIME_BYTES * nFrames;

          // Values
          keyframeValues.forEach(({
            value: {
              x,
              y,
              z,
              w
            }
          }, index) => {
            const pQuat = P + VALUE_BYTES * 4 * index;
            dataView.setFloat32(pQuat + VALUE_BYTES * 0, x, true);
            dataView.setFloat32(pQuat + VALUE_BYTES * 1, y, true);
            dataView.setFloat32(pQuat + VALUE_BYTES * 2, z, true);
            dataView.setFloat32(pQuat + VALUE_BYTES * 3, w, true);
          });
          P += VALUE_BYTES * 4 * nFrames;

          // Easing methods
          keyframeValues.forEach(({
            easingMethod
          }, index) => {
            if (!Array.isArray(easingMethod)) {
              dataView.setUint8(P, easingMethod);
              ++P;
            } else {
              dataView.setUint8(P, EASING_METHOD_BEZIER_TAG);
              ++P;
              dataView.setFloat32(P + EASING_METHOD_BEZIER_COMPONENT_BYTES * 0, easingMethod[0], true);
              dataView.setFloat32(P + EASING_METHOD_BEZIER_COMPONENT_BYTES * 1, easingMethod[1], true);
              dataView.setFloat32(P + EASING_METHOD_BEZIER_COMPONENT_BYTES * 2, easingMethod[2], true);
              dataView.setFloat32(P + EASING_METHOD_BEZIER_COMPONENT_BYTES * 3, easingMethod[3], true);
              P += EASING_METHOD_BEZIER_COMPONENT_BYTES * 4;
            }
          });

          // Frame values
          const INTERPOLATION_MODES_START = P;
          P += interpolationModesSize;
          let pInterpolationMode = INTERPOLATION_MODES_START;
          keyframeValues.forEach(({
            interpolationMode
          }) => {
            dataView.setUint8(pInterpolationMode, interpolationMode);
            if (!interpolationModeRepeated) {
              pInterpolationMode += INTERPOLATION_MODE_BYTES;
            }
          });
          const bytes = new Uint8Array(dataView.buffer);
          output.writeProperty('bytes', bytes);
        }

        /**
         * @internal
         */
        [deserializeTag](input, context) {
          if (!context.fromCCON) {
            input.readThis();
            return;
          }
          const bytes = input.readProperty('bytes');
          const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
          let P = 0;

          // Flags
          const flags = dataView.getUint32(P, true);
          P += FLAGS_BYTES;
          const interpolationModeRepeated = flags & QuatCurveKeyframeValueFlagMask.INTERPOLATION_MODE;

          // Frame count
          const nFrames = dataView.getUint32(P, true);
          P += FRAME_COUNT_BYTES;

          // Times
          const times = Array.from({
            length: nFrames
          }, (_, index) => dataView.getFloat32(P + TIME_BYTES * index, true));
          P += TIME_BYTES * nFrames;

          // Frame values
          const P_VALUES = P;
          P += VALUE_BYTES * 4 * nFrames;
          const keyframeValues = Array.from({
            length: nFrames
          }, (_, index) => {
            const pQuat = P_VALUES + VALUE_BYTES * 4 * index;
            const x = dataView.getFloat32(pQuat + VALUE_BYTES * 0, true);
            const y = dataView.getFloat32(pQuat + VALUE_BYTES * 1, true);
            const z = dataView.getFloat32(pQuat + VALUE_BYTES * 2, true);
            const w = dataView.getFloat32(pQuat + VALUE_BYTES * 3, true);
            const easingMethod = dataView.getUint8(P);
            ++P;
            const keyframeValue = createQuatKeyframeValue({
              value: {
                x,
                y,
                z,
                w
              }
            });
            if (easingMethod !== EASING_METHOD_BEZIER_TAG) {
              keyframeValue.easingMethod = easingMethod;
            } else {
              keyframeValue.easingMethod = [dataView.getFloat32(P + EASING_METHOD_BEZIER_COMPONENT_BYTES * 0, true), dataView.getFloat32(P + EASING_METHOD_BEZIER_COMPONENT_BYTES * 1, true), dataView.getFloat32(P + EASING_METHOD_BEZIER_COMPONENT_BYTES * 2, true), dataView.getFloat32(P + EASING_METHOD_BEZIER_COMPONENT_BYTES * 3, true)];
              P += EASING_METHOD_BEZIER_COMPONENT_BYTES * 4;
            }
            return keyframeValue;
          });
          if (interpolationModeRepeated) {
            const interpolationMode = dataView.getUint8(P);
            ++P;
            for (let iKeyframe = 0; iKeyframe < nFrames; ++iKeyframe) {
              keyframeValues[iKeyframe].interpolationMode = interpolationMode;
            }
          } else {
            for (let iKeyframe = 0; iKeyframe < nFrames; ++iKeyframe) {
              const interpolationMode = dataView.getUint8(P + iKeyframe);
              keyframeValues[iKeyframe].interpolationMode = interpolationMode;
            }
            P += nFrames;
          }
          this._times = times;
          this._values = keyframeValues;
        }
      }, _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "preExtrapolation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ExtrapolationMode.CLAMP;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "postExtrapolation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return ExtrapolationMode.CLAMP;
        }
      }), _class4)) || _class3));
      QuatCurveKeyframeValueFlagMask = /*#__PURE__*/function (QuatCurveKeyframeValueFlagMask) {
        QuatCurveKeyframeValueFlagMask[QuatCurveKeyframeValueFlagMask["INTERPOLATION_MODE"] = 1] = "INTERPOLATION_MODE";
        return QuatCurveKeyframeValueFlagMask;
      }(QuatCurveKeyframeValueFlagMask || {});
      FLAGS_BYTES = 1;
      FRAME_COUNT_BYTES = 4;
      TIME_BYTES = 4;
      VALUE_BYTES = 4;
      INTERPOLATION_MODE_BYTES = 1;
      EASING_METHOD_BYTES = 1;
      EASING_METHOD_BEZIER_TAG = 255;
      EASING_METHOD_BEZIER_COMPONENT_BYTES = 4;
    }
  };
});