System.register("q-bundled:///fs/cocos/animation/legacy-clip-data.js", ["./target-path.js", "../core/index.js", "./animation-curve.js", "./tracks/track.js", "./tracks/untyped-track.js", "./tracks/real-track.js", "./cubic-spline-value.js", "./tracks/color-track.js", "./tracks/vector-track.js", "./tracks/quat-track.js", "./tracks/object-track.js", "./tracks/size-track.js"], function (_export, _context) {
  "use strict";

  var ComponentPath, HierarchyPath, QuatInterpolationMode, RealInterpolationMode, TangentWeightMode, warnID, Color, Quat, Size, Vec2, Vec3, Vec4, assertIsTrue, EasingMethod, AnimCurve, RatioSampler, TrackPath, UntypedTrack, RealTrack, CubicSplineNumberValue, CubicSplineQuatValue, CubicSplineVec2Value, CubicSplineVec3Value, CubicSplineVec4Value, ColorTrack, VectorTrack, QuatTrack, ObjectTrack, SizeTrack, AnimationClipLegacyData, LegacyEasingMethodConverter, easingMethodNameMap;
  function everyInstanceOf(array, constructor) {
    return array.every(element => element instanceof constructor);
  }

  // #region Legacy data structures prior to 1.2

  /**
   * @returns Inserted keyframes count.
   */
  function applyLegacyEasingMethodName(easingMethodName, curve, keyframeIndex) {
    assertIsTrue(keyframeIndex !== curve.keyFramesCount - 1);
    assertIsTrue(easingMethodName in easingMethodNameMap);
    const keyframeValue = curve.getKeyframeValue(keyframeIndex);
    const easingMethod = easingMethodNameMap[easingMethodName];
    if (easingMethod === EasingMethod.CONSTANT) {
      keyframeValue.interpolationMode = RealInterpolationMode.CONSTANT;
    } else {
      keyframeValue.interpolationMode = RealInterpolationMode.LINEAR;
      keyframeValue.easingMethod = easingMethod;
    }
  }
  function applyLegacyEasingMethodNameIntoQuatCurve(easingMethodName, curve, keyframeIndex) {
    assertIsTrue(keyframeIndex !== curve.keyFramesCount - 1);
    assertIsTrue(easingMethodName in easingMethodNameMap);
    const keyframeValue = curve.getKeyframeValue(keyframeIndex);
    const easingMethod = easingMethodNameMap[easingMethodName];
    keyframeValue.easingMethod = easingMethod;
  }
  /**
   * Legacy curve uses time based bezier curve interpolation.
   * That's, interpolate time 'x'(time ratio between two frames, eg.[0, 1])
   * and then use the interpolated time to sample curve.
   * Now we need to compute the the end tangent of previous frame and the start tangent of the next frame.
   * @param timeBezierPoints Bezier points used for legacy time interpolation.
   * @param previousTime Time of the previous keyframe.
   * @param previousValue Value of the previous keyframe.
   * @param nextTime Time of the next keyframe.
   * @param nextValue Value of the next keyframe.
   */
  function timeBezierToTangents(timeBezierPoints, previousTime, previousKeyframe, nextTime, nextKeyframe) {
    const [p1X, p1Y, p2X, p2Y] = timeBezierPoints;
    const {
      value: previousValue
    } = previousKeyframe;
    const {
      value: nextValue
    } = nextKeyframe;
    const dValue = nextValue - previousValue;
    const dTime = nextTime - previousTime;
    const fx = 3 * dTime;
    const fy = 3 * dValue;
    const t1x = p1X * fx;
    const t1y = p1Y * fy;
    const t2x = (1.0 - p2X) * fx;
    const t2y = (1.0 - p2Y) * fy;
    const ONE_THIRD = 1.0 / 3.0;
    const previousTangent = t1y / t1x;
    const previousTangentWeight = Math.sqrt(t1x * t1x + t1y * t1y) * ONE_THIRD;
    const nextTangent = t2y / t2x;
    const nextTangentWeight = Math.sqrt(t2x * t2x + t2y * t2y) * ONE_THIRD;
    previousKeyframe.interpolationMode = RealInterpolationMode.CUBIC;
    previousKeyframe.tangentWeightMode = ensureRightTangentWeightMode(previousKeyframe.tangentWeightMode);
    previousKeyframe.rightTangent = previousTangent;
    previousKeyframe.rightTangentWeight = previousTangentWeight;
    nextKeyframe.tangentWeightMode = ensureLeftTangentWeightMode(nextKeyframe.tangentWeightMode);
    nextKeyframe.leftTangent = nextTangent;
    nextKeyframe.leftTangentWeight = nextTangentWeight;
  }
  function ensureLeftTangentWeightMode(tangentWeightMode) {
    if (tangentWeightMode === TangentWeightMode.NONE) {
      return TangentWeightMode.LEFT;
    } else if (tangentWeightMode === TangentWeightMode.RIGHT) {
      return TangentWeightMode.BOTH;
    } else {
      return tangentWeightMode;
    }
  }
  function ensureRightTangentWeightMode(tangentWeightMode) {
    if (tangentWeightMode === TangentWeightMode.NONE) {
      return TangentWeightMode.RIGHT;
    } else if (tangentWeightMode === TangentWeightMode.LEFT) {
      return TangentWeightMode.BOTH;
    } else {
      return tangentWeightMode;
    }
  }

  // #region TODO: convert power easing method

  // type Powers = [number, number, number, number];

  // const POWERS_QUAD_IN: Powers = [0.0, 0.0, 1.0, 0.0]; // k * k
  // const POWERS_QUAD_OUT: Powers = [0.0, 2.0, -1.0, 0.0]; // k * (2 - k)
  // const POWERS_CUBIC_IN: Powers = [0.0, 0.0, 0.0, 1.0]; // k * k * k
  // const POWERS_CUBIC_OUT: Powers = [0.0, 0.0, 0.0, 1.0]; // --k * k * k + 1
  // const BACK_S = 1.70158;
  // const POWERS_BACK_IN: Powers = [1.0, 0.0, -BACK_S, BACK_S + 1.0]; // k * k * ((s + 1) * k - s)
  // const POWERS_BACK_OUT: Powers = [1.0, 0.0, BACK_S, BACK_S + 1.0]; // k * k * ((s + 1) * k - s)
  // const POWERS_SMOOTH: Powers = [0.0, 0.0, 3.0, -2.0]; // k * k * (3 - 2 * k)

  // function convertPowerMethod (curve: RealCurve, keyframeIndex: number, powers: Powers) {
  //     assertIsTrue(keyframeIndex !== curve.keyFramesCount - 1);
  //     const nextKeyframeIndex = keyframeIndex + 1;
  //     powerToTangents(
  //         powers,
  //         curve.getKeyframeTime(keyframeIndex),
  //         curve.getKeyframeValue(keyframeIndex),
  //         curve.getKeyframeTime(nextKeyframeIndex),
  //         curve.getKeyframeValue(nextKeyframeIndex),
  //     );
  //     return 0;
  // };

  // function convertInOutPowersMethod (curve: RealCurve, keyframeIndex: number, inPowers: Powers, outPowers: Powers) {
  //     assertIsTrue(keyframeIndex !== curve.keyFramesCount - 1);
  //     const nextKeyframeIndex = keyframeIndex + 1;
  //     const previousTime = curve.getKeyframeTime(keyframeIndex);
  //     const nextTime = curve.getKeyframeTime(nextKeyframeIndex);
  //     const previousKeyframeValue = curve.getKeyframeValue(keyframeIndex);
  //     const nextKeyframeValue = curve.getKeyframeValue(nextKeyframeIndex);
  //     const middleTime = previousTime + (nextTime - previousTime);
  //     const middleValue = previousKeyframeValue.value + (nextKeyframeValue.value - previousKeyframeValue.value);
  //     const middleKeyframeValue = curve.getKeyframeValue(curve.addKeyFrame(middleTime, middleValue));
  //     powerToTangents(
  //         inPowers,
  //         previousTime,
  //         previousKeyframeValue,
  //         middleTime,
  //         middleKeyframeValue,
  //     );
  //     powerToTangents(
  //         outPowers,
  //         middleTime,
  //         middleKeyframeValue,
  //         nextTime,
  //         nextKeyframeValue,
  //     );
  //     return 1;
  // };

  // function powerToTangents (
  //     [a, b, c, d]: [number, number, number, number],
  //     previousTime: number,
  //     previousKeyframe: RealKeyframeValue,
  //     nextTime: number,
  //     nextKeyframe: RealKeyframeValue,
  // ) {
  //     const bernstein = powerToBernstein([a, b, c, d]);
  //     const { value: previousValue } = previousKeyframe;
  //     const { value: nextValue } = nextKeyframe;
  //     timeBezierToTangents(
  //         [???????],
  //         previousTime,
  //         previousValue,
  //         nextTime,
  //         nextValue,
  //     );
  // }

  // function powerToBernstein ([p0, p1, p2, p3]: [number, number, number, number]) {
  //     // https://stackoverflow.com/questions/33859199/convert-polynomial-curve-to-bezier-curve-control-points
  //     // https://blog.demofox.org/2016/12/08/evaluating-polynomials-with-the-gpu-texture-sampler/
  //     const m00 = p0;
  //     const m01 = p1 / 3.0;
  //     const m02 = p2 / 3.0;
  //     const m03 = p3;
  //     const m10 = m00 + m01;
  //     const m11 = m01 + m02;
  //     const m12 = m02 + m03;
  //     const m20 = m10 + m11;
  //     const m21 = m11 + m12;
  //     const m30 = m20 + m21;
  //     const bernstein = new Float64Array(4);
  //     bernstein[0] = m00;
  //     bernstein[1] = m10;
  //     bernstein[2] = m20;
  //     bernstein[3] = m30;
  //     return bernstein;
  // }

  // #endregion
  _export({
    AnimationClipLegacyData: void 0,
    timeBezierToTangents: timeBezierToTangents
  });
  return {
    setters: [function (_targetPathJs) {
      ComponentPath = _targetPathJs.ComponentPath;
      HierarchyPath = _targetPathJs.HierarchyPath;
    }, function (_coreIndexJs) {
      QuatInterpolationMode = _coreIndexJs.QuatInterpolationMode;
      RealInterpolationMode = _coreIndexJs.RealInterpolationMode;
      TangentWeightMode = _coreIndexJs.TangentWeightMode;
      warnID = _coreIndexJs.warnID;
      Color = _coreIndexJs.Color;
      Quat = _coreIndexJs.Quat;
      Size = _coreIndexJs.Size;
      Vec2 = _coreIndexJs.Vec2;
      Vec3 = _coreIndexJs.Vec3;
      Vec4 = _coreIndexJs.Vec4;
      assertIsTrue = _coreIndexJs.assertIsTrue;
      EasingMethod = _coreIndexJs.EasingMethod;
    }, function (_animationCurveJs) {
      AnimCurve = _animationCurveJs.AnimCurve;
      RatioSampler = _animationCurveJs.RatioSampler;
    }, function (_tracksTrackJs) {
      TrackPath = _tracksTrackJs.TrackPath;
    }, function (_tracksUntypedTrackJs) {
      UntypedTrack = _tracksUntypedTrackJs.UntypedTrack;
    }, function (_tracksRealTrackJs) {
      RealTrack = _tracksRealTrackJs.RealTrack;
    }, function (_cubicSplineValueJs) {
      CubicSplineNumberValue = _cubicSplineValueJs.CubicSplineNumberValue;
      CubicSplineQuatValue = _cubicSplineValueJs.CubicSplineQuatValue;
      CubicSplineVec2Value = _cubicSplineValueJs.CubicSplineVec2Value;
      CubicSplineVec3Value = _cubicSplineValueJs.CubicSplineVec3Value;
      CubicSplineVec4Value = _cubicSplineValueJs.CubicSplineVec4Value;
    }, function (_tracksColorTrackJs) {
      ColorTrack = _tracksColorTrackJs.ColorTrack;
    }, function (_tracksVectorTrackJs) {
      VectorTrack = _tracksVectorTrackJs.VectorTrack;
    }, function (_tracksQuatTrackJs) {
      QuatTrack = _tracksQuatTrackJs.QuatTrack;
    }, function (_tracksObjectTrackJs) {
      ObjectTrack = _tracksObjectTrackJs.ObjectTrack;
    }, function (_tracksSizeTrackJs) {
      SizeTrack = _tracksSizeTrackJs.SizeTrack;
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
       * 表示曲线值，曲线值可以是任意类型，但必须符合插值方式的要求。
       */
      /**
       * 表示曲线的目标对象。
       */
      /**
       * 内置帧时间渐变方式名称。
       */
      /**
       * 帧时间渐变方式。可能为内置帧时间渐变方式的名称或贝塞尔控制点。
       */
      // interface ConvertMap<TValue, TTrack> {
      //     valueConstructor: Constructor<TValue>;
      //     trackConstructor: Constructor<TTrack>;
      //     properties: [keyof TValue, number][];
      // }
      // const VECTOR_LIKE_CURVE_CONVERT_TABLE = [
      //     {
      //         valueConstructor: Size,
      //         trackConstructor: SizeTrack,
      //         properties: [['width', 0], ['height', 1]],
      //     } as ConvertMap<Size, SizeTrack>,
      //     {
      //         valueConstructor: Color,
      //         trackConstructor: ColorTrack,
      //         properties: [['r', 0], ['g', 1], ['b', 2], ['a', 3]],
      //     } as ConvertMap<Color, ColorTrack>,
      // ];
      _export("AnimationClipLegacyData", AnimationClipLegacyData = class AnimationClipLegacyData {
        constructor(duration) {
          this._keys = [];
          this._curves = [];
          this._commonTargets = [];
          this._ratioSamplers = [];
          this._runtimeCurves = void 0;
          this._data = null;
          this._duration = void 0;
          this._duration = duration;
        }
        get keys() {
          return this._keys;
        }
        set keys(value) {
          this._keys = value;
        }
        get curves() {
          return this._curves;
        }
        set curves(value) {
          this._curves = value;
          delete this._runtimeCurves;
        }
        get commonTargets() {
          return this._commonTargets;
        }
        set commonTargets(value) {
          this._commonTargets = value;
        }

        /**
         * 此动画的数据。
         */
        get data() {
          return this._data;
        }
        getPropertyCurves() {
          if (!this._runtimeCurves) {
            this._createPropertyCurves();
          }
          return this._runtimeCurves;
        }
        toTracks() {
          const newTracks = [];
          const {
            keys: legacyKeys,
            curves: legacyCurves,
            commonTargets: legacyCommonTargets
          } = this;
          const convertTrackPath = (track, modifiers, valueAdapter) => {
            const trackPath = new TrackPath();
            for (const modifier of modifiers) {
              if (typeof modifier === 'string') {
                trackPath.toProperty(modifier);
              } else if (typeof modifier === 'number') {
                trackPath.toElement(modifier);
              } else if (modifier instanceof HierarchyPath) {
                trackPath.toHierarchy(modifier.path);
              } else if (modifier instanceof ComponentPath) {
                trackPath.toComponent(modifier.component);
              } else {
                trackPath.toCustomized(modifier);
              }
            }
            track.path = trackPath;
            track.proxy = valueAdapter;
          };
          const untypedTracks = legacyCommonTargets.map(legacyCommonTarget => {
            const track = new UntypedTrack();
            convertTrackPath(track, legacyCommonTarget.modifiers, legacyCommonTarget.valueAdapter);
            newTracks.push(track);
            return track;
          });
          for (const legacyCurve of legacyCurves) {
            var _legacyCurveData$inte;
            const legacyCurveData = legacyCurve.data;
            const legacyValues = legacyCurveData.values;
            if (legacyValues.length === 0) {
              // Legacy clip did not record type info.
              continue;
            }
            const legacyKeysIndex = legacyCurveData.keys;
            // Rule: negative index means single frame.
            const times = legacyKeysIndex < 0 ? [0.0] : legacyKeys[legacyCurveData.keys];
            const firstValue = legacyValues[0];
            // Rule: default to true.
            const interpolate = (_legacyCurveData$inte = legacyCurveData.interpolate) != null ? _legacyCurveData$inte : true;
            // Rule: _arrayLength only used for morph target, internally.
            assertIsTrue(typeof legacyCurveData._arrayLength !== 'number' || typeof firstValue === 'number');
            const legacyEasingMethodConverter = new LegacyEasingMethodConverter(legacyCurveData, times.length);
            const installPathAndSetter = track => {
              convertTrackPath(track, legacyCurve.modifiers, legacyCurve.valueAdapter);
            };
            let legacyCommonTargetCurve;
            if (typeof legacyCurve.commonTarget === 'number') {
              // Rule: common targets should only target Vectors/`Size`/`Color`.
              if (!legacyValues.every(value => typeof value === 'number')) {
                warnID(3932);
                continue;
              }
              // Rule: Each curve that has common target should be numeric curve and targets string property.
              if (legacyCurve.valueAdapter || legacyCurve.modifiers.length !== 1 || typeof legacyCurve.modifiers[0] !== 'string') {
                warnID(3933);
                continue;
              }
              const propertyName = legacyCurve.modifiers[0];
              const untypedTrack = untypedTracks[legacyCurve.commonTarget];
              const {
                curve
              } = untypedTrack.addChannel(propertyName);
              legacyCommonTargetCurve = curve;
            }
            const convertCurve = () => {
              if (typeof firstValue === 'number') {
                if (!legacyValues.every(value => typeof value === 'number')) {
                  warnID(3934);
                  return;
                }
                let realCurve;
                if (legacyCommonTargetCurve) {
                  realCurve = legacyCommonTargetCurve;
                } else {
                  const track = new RealTrack();
                  installPathAndSetter(track);
                  newTracks.push(track);
                  realCurve = track.channel.curve;
                }
                const interpolationMethod = interpolate ? RealInterpolationMode.LINEAR : RealInterpolationMode.CONSTANT;
                realCurve.assignSorted(times, legacyValues.map(value => ({
                  value,
                  interpolationMode: interpolationMethod
                })));
                legacyEasingMethodConverter.convert(realCurve);
                return;
              } else if (typeof firstValue === 'object') {
                switch (true) {
                  default:
                    break;
                  case everyInstanceOf(legacyValues, Vec2):
                  case everyInstanceOf(legacyValues, Vec3):
                  case everyInstanceOf(legacyValues, Vec4):
                    {
                      const components = firstValue instanceof Vec2 ? 2 : firstValue instanceof Vec3 ? 3 : 4;
                      const track = new VectorTrack();
                      installPathAndSetter(track);
                      track.componentsCount = components;
                      const [{
                        curve: x
                      }, {
                        curve: y
                      }, {
                        curve: z
                      }, {
                        curve: w
                      }] = track.channels();
                      const interpolationMode = interpolate ? RealInterpolationMode.LINEAR : RealInterpolationMode.CONSTANT;
                      const valueToFrame = value => ({
                        value,
                        interpolationMode
                      });
                      switch (components) {
                        case 4:
                          w.assignSorted(times, legacyValues.map(value => valueToFrame(value.w)));
                          legacyEasingMethodConverter.convert(w);
                        // falls through
                        case 3:
                          z.assignSorted(times, legacyValues.map(value => valueToFrame(value.z)));
                          legacyEasingMethodConverter.convert(z);
                        // falls through
                        default:
                          x.assignSorted(times, legacyValues.map(value => valueToFrame(value.x)));
                          legacyEasingMethodConverter.convert(x);
                          y.assignSorted(times, legacyValues.map(value => valueToFrame(value.y)));
                          legacyEasingMethodConverter.convert(y);
                          break;
                      }
                      newTracks.push(track);
                      return;
                    }
                  case everyInstanceOf(legacyValues, Quat):
                    {
                      const track = new QuatTrack();
                      installPathAndSetter(track);
                      const interpolationMode = interpolate ? QuatInterpolationMode.SLERP : QuatInterpolationMode.CONSTANT;
                      track.channel.curve.assignSorted(times, legacyValues.map(value => ({
                        value: Quat.clone(value),
                        interpolationMode
                      })));
                      legacyEasingMethodConverter.convertQuatCurve(track.channel.curve);
                      newTracks.push(track);
                      return;
                    }
                  case everyInstanceOf(legacyValues, Color):
                    {
                      const track = new ColorTrack();
                      installPathAndSetter(track);
                      const [{
                        curve: r
                      }, {
                        curve: g
                      }, {
                        curve: b
                      }, {
                        curve: a
                      }] = track.channels();
                      const interpolationMode = interpolate ? RealInterpolationMode.LINEAR : RealInterpolationMode.CONSTANT;
                      const valueToFrame = value => ({
                        value,
                        interpolationMode
                      });
                      r.assignSorted(times, legacyValues.map(value => valueToFrame(value.r)));
                      legacyEasingMethodConverter.convert(r);
                      g.assignSorted(times, legacyValues.map(value => valueToFrame(value.g)));
                      legacyEasingMethodConverter.convert(g);
                      b.assignSorted(times, legacyValues.map(value => valueToFrame(value.b)));
                      legacyEasingMethodConverter.convert(b);
                      a.assignSorted(times, legacyValues.map(value => valueToFrame(value.a)));
                      legacyEasingMethodConverter.convert(a);
                      newTracks.push(track);
                      return;
                    }
                  case everyInstanceOf(legacyValues, Size):
                    {
                      const track = new SizeTrack();
                      installPathAndSetter(track);
                      const [{
                        curve: width
                      }, {
                        curve: height
                      }] = track.channels();
                      const interpolationMode = interpolate ? RealInterpolationMode.LINEAR : RealInterpolationMode.CONSTANT;
                      const valueToFrame = value => ({
                        value,
                        interpolationMode
                      });
                      width.assignSorted(times, legacyValues.map(value => valueToFrame(value.width)));
                      legacyEasingMethodConverter.convert(width);
                      height.assignSorted(times, legacyValues.map(value => valueToFrame(value.height)));
                      legacyEasingMethodConverter.convert(height);
                      newTracks.push(track);
                      return;
                    }
                  case everyInstanceOf(legacyValues, CubicSplineNumberValue):
                    {
                      assertIsTrue(legacyEasingMethodConverter.nil);
                      const track = new RealTrack();
                      installPathAndSetter(track);
                      const interpolationMode = interpolate ? RealInterpolationMode.CUBIC : RealInterpolationMode.CONSTANT;
                      track.channel.curve.assignSorted(times, legacyValues.map(value => ({
                        value: value.dataPoint,
                        leftTangent: value.inTangent,
                        rightTangent: value.outTangent,
                        interpolationMode
                      })));
                      newTracks.push(track);
                      return;
                    }
                  case everyInstanceOf(legacyValues, CubicSplineVec2Value):
                  case everyInstanceOf(legacyValues, CubicSplineVec3Value):
                  case everyInstanceOf(legacyValues, CubicSplineVec4Value):
                    {
                      assertIsTrue(legacyEasingMethodConverter.nil);
                      const components = firstValue instanceof CubicSplineVec2Value ? 2 : firstValue instanceof CubicSplineVec3Value ? 3 : 4;
                      const track = new VectorTrack();
                      installPathAndSetter(track);
                      track.componentsCount = components;
                      const [x, y, z, w] = track.channels();
                      const interpolationMode = interpolate ? RealInterpolationMode.LINEAR : RealInterpolationMode.CONSTANT;
                      const valueToFrame = (value, inTangent, outTangent) => ({
                        value,
                        leftTangent: inTangent,
                        rightTangent: outTangent,
                        interpolationMode
                      });
                      switch (components) {
                        case 4:
                          w.curve.assignSorted(times, legacyValues.map(value => valueToFrame(value.dataPoint.w, value.inTangent.w, value.outTangent.w)));
                        // falls through
                        case 3:
                          z.curve.assignSorted(times, legacyValues.map(value => valueToFrame(value.dataPoint.z, value.inTangent.z, value.outTangent.z)));
                        // falls through
                        default:
                          x.curve.assignSorted(times, legacyValues.map(value => valueToFrame(value.dataPoint.y, value.inTangent.y, value.outTangent.y)));
                          y.curve.assignSorted(times, legacyValues.map(value => valueToFrame(value.dataPoint.x, value.inTangent.x, value.outTangent.x)));
                          break;
                      }
                      newTracks.push(track);
                      return;
                    }
                  case legacyValues.every(value => value instanceof CubicSplineQuatValue):
                    {
                      warnID(3935);
                      break;
                    }
                } // End switch
              }
              const objectTrack = new ObjectTrack();
              installPathAndSetter(objectTrack);
              objectTrack.channel.curve.assignSorted(times, legacyValues);
              newTracks.push(objectTrack);
            };
            convertCurve();
          }
          return newTracks;
        }
        _createPropertyCurves() {
          this._ratioSamplers = this._keys.map(keys => new RatioSampler(keys.map(key => key / this._duration)));
          this._runtimeCurves = this._curves.map(targetCurve => ({
            curve: new AnimCurve(targetCurve.data, this._duration),
            modifiers: targetCurve.modifiers,
            valueAdapter: targetCurve.valueAdapter,
            sampler: this._ratioSamplers[targetCurve.data.keys],
            commonTarget: targetCurve.commonTarget
          }));
        }
      });
      // #endregion
      LegacyEasingMethodConverter = class LegacyEasingMethodConverter {
        constructor(legacyCurveData, keyframesCount) {
          this._easingMethods = void 0;
          const {
            easingMethods
          } = legacyCurveData;
          if (Array.isArray(easingMethods)) {
            // Different
            if (easingMethods.length === 0 && keyframesCount !== 0) {
              // This shall not happen as specified in doc on legacy easing methods
              // but it does in history project(see cocos-creator/3d-tasks/issues/#8468).
              // This may be a promise breaking BUG between engine & Editor.
              // Let's capture this case.
              this._easingMethods = new Array(keyframesCount).fill(null);
            } else {
              this._easingMethods = easingMethods;
            }
          } else if (easingMethods === undefined) {
            // Same
            this._easingMethods = new Array(keyframesCount).fill(legacyCurveData.easingMethod);
          } else {
            // Compressed as record
            this._easingMethods = Array.from({
              length: keyframesCount
            }, (_, index) => {
              var _easingMethods$index;
              return (_easingMethods$index = easingMethods[index]) != null ? _easingMethods$index : null;
            });
          }
        }
        get nil() {
          return !this._easingMethods || this._easingMethods.every(easingMethod => easingMethod === null || easingMethod === undefined);
        }
        convert(curve) {
          const {
            _easingMethods: easingMethods
          } = this;
          if (!easingMethods) {
            return;
          }
          const nKeyframes = curve.keyFramesCount;
          if (curve.keyFramesCount < 2) {
            return;
          }
          if (Array.isArray(easingMethods)) {
            assertIsTrue(nKeyframes === easingMethods.length);
          }
          const iLastKeyframe = nKeyframes - 1;
          for (let iKeyframe = 0; iKeyframe < iLastKeyframe; ++iKeyframe) {
            const easingMethod = easingMethods[iKeyframe];
            if (!easingMethod) {
              continue;
            }
            if (Array.isArray(easingMethod)) {
              // Time bezier points
              timeBezierToTangents(easingMethod, curve.getKeyframeTime(iKeyframe), curve.getKeyframeValue(iKeyframe), curve.getKeyframeTime(iKeyframe + 1), curve.getKeyframeValue(iKeyframe + 1));
            } else {
              applyLegacyEasingMethodName(easingMethod, curve, iKeyframe);
            }
          }
        }
        convertQuatCurve(curve) {
          const {
            _easingMethods: easingMethods
          } = this;
          if (!easingMethods) {
            return;
          }
          const nKeyframes = curve.keyFramesCount;
          if (curve.keyFramesCount < 2) {
            return;
          }
          if (Array.isArray(easingMethods)) {
            assertIsTrue(nKeyframes === easingMethods.length);
          }
          const iLastKeyframe = nKeyframes - 1;
          for (let iKeyframe = 0; iKeyframe < iLastKeyframe; ++iKeyframe) {
            const easingMethod = easingMethods[iKeyframe];
            if (!easingMethod) {
              continue;
            }
            if (Array.isArray(easingMethod)) {
              curve.getKeyframeValue(iKeyframe).easingMethod = easingMethod.slice();
            } else {
              applyLegacyEasingMethodNameIntoQuatCurve(easingMethod, curve, iKeyframe);
            }
          }
        }
      };
      easingMethodNameMap = {
        constant: EasingMethod.CONSTANT,
        linear: EasingMethod.LINEAR,
        quadIn: EasingMethod.QUAD_IN,
        quadOut: EasingMethod.QUAD_OUT,
        quadInOut: EasingMethod.QUAD_IN_OUT,
        quadOutIn: EasingMethod.QUAD_OUT_IN,
        cubicIn: EasingMethod.CUBIC_IN,
        cubicOut: EasingMethod.CUBIC_OUT,
        cubicInOut: EasingMethod.CUBIC_IN_OUT,
        cubicOutIn: EasingMethod.CUBIC_OUT_IN,
        quartIn: EasingMethod.QUART_IN,
        quartOut: EasingMethod.QUART_OUT,
        quartInOut: EasingMethod.QUART_IN_OUT,
        quartOutIn: EasingMethod.QUART_OUT_IN,
        quintIn: EasingMethod.QUINT_IN,
        quintOut: EasingMethod.QUINT_OUT,
        quintInOut: EasingMethod.QUINT_IN_OUT,
        quintOutIn: EasingMethod.QUINT_OUT_IN,
        sineIn: EasingMethod.SINE_IN,
        sineOut: EasingMethod.SINE_OUT,
        sineInOut: EasingMethod.SINE_IN_OUT,
        sineOutIn: EasingMethod.SINE_OUT_IN,
        expoIn: EasingMethod.EXPO_IN,
        expoOut: EasingMethod.EXPO_OUT,
        expoInOut: EasingMethod.EXPO_IN_OUT,
        expoOutIn: EasingMethod.EXPO_OUT_IN,
        circIn: EasingMethod.CIRC_IN,
        circOut: EasingMethod.CIRC_OUT,
        circInOut: EasingMethod.CIRC_IN_OUT,
        circOutIn: EasingMethod.CIRC_OUT_IN,
        elasticIn: EasingMethod.ELASTIC_IN,
        elasticOut: EasingMethod.ELASTIC_OUT,
        elasticInOut: EasingMethod.ELASTIC_IN_OUT,
        elasticOutIn: EasingMethod.ELASTIC_OUT_IN,
        backIn: EasingMethod.BACK_IN,
        backOut: EasingMethod.BACK_OUT,
        backInOut: EasingMethod.BACK_IN_OUT,
        backOutIn: EasingMethod.BACK_OUT_IN,
        bounceIn: EasingMethod.BOUNCE_IN,
        bounceOut: EasingMethod.BOUNCE_OUT,
        bounceInOut: EasingMethod.BOUNCE_IN_OUT,
        bounceOutIn: EasingMethod.BOUNCE_OUT_IN,
        smooth: EasingMethod.SMOOTH,
        fade: EasingMethod.FADE
      };
    }
  };
});