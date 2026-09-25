System.register("q-bundled:///fs/cocos/animation/exotic-animation/exotic-animation.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../core/data/utils/asserts.js", "../define.js", "../tracks/track.js"], function (_export, _context) {
  "use strict";

  var EDITOR, NODEJS, TEST, binarySearchEpsilon, lerp, Quat, Vec3, _decorator, assertIsTrue, CLASS_NAME_PREFIX_ANIM, TrackBinding, TrackPath, SplitInfo, ExoticTrsAnimationEvaluator, ExoticNodeAnimationEvaluator, ExoticTrackEvaluator, ExoticTrsAGEvaluation, ExoticNodeAnimationAGEvaluation, _dec, _class, _class2, _descriptor, _dec2, _class3, _class4, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _dec3, _class5, _class6, _descriptor6, _descriptor7, _dec4, _class7, _dec5, _class8, _dec6, _class9, _class0, _descriptor8, _descriptor9, _dec7, _class1, _class10, _descriptor0, _descriptor1, _descriptor10, _descriptor11, SPLIT_METHOD_ENABLED, ccclass, serializable, ExoticAnimation, ExoticNodeAnimation, ExoticVectorLikeTrackValues, ExoticVec3TrackValues, ExoticQuatTrackValues, ExoticTrack, QUANTIZATION_TYPE_TO_ARRAY_VIEW_CONSTRUCTOR_MAP, FloatPrecision, QuantizedFloatArray;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function throwIfSplitMethodIsNotValid() {
    // TODO: better handling
    throw new Error(`split() only valid in Editor.`);
  }

  /**
   * Animation that:
   * - does not exposed by users;
   * - does not compatible with regular animation;
   * - non-editable;
   * - currently only generated imported from model file.
   */

  function floatToHashString(value) {
    // Note: referenced to `Skeleton.prototype.hash`
    return value.toPrecision(2);
  }
  function floatArrayToHashString(values) {
    return values.map(v => Number.parseFloat(floatToHashString(v))).join(' ');
  }
  function splitVec3Track(track, from, to, splitInfoCache) {
    const {
      times,
      values
    } = split(track.times, track.values, from, to, 3, Vec3, splitInfoCache);
    const vec3Values = ExoticVec3TrackValues.imitate(values, track.values);
    return new ExoticTrack(times, vec3Values);
  }
  function splitQuatTrack(track, from, to, splitInfoCache) {
    const {
      times,
      values
    } = split(track.times, track.values, from, to, 4, Quat, splitInfoCache);
    const quatValues = ExoticQuatTrackValues.imitate(values, track.values);
    return new ExoticTrack(times, quatValues);
  }
  function split(times, values, from, to, components, ValueConstructor, splitInfoCache) {
    const TimeArrayConstructor = getFloatArrayConstructorWithPrecision(getFloatArrayPrecision(times));
    const ValueArrayConstructor = getFloatArrayConstructorWithPrecision(values.precision);
    const splitInfo = splitInfoCache;
    splitInfo.calculate(times, from, to);
    const {
      preLerpIndex,
      preLerpRatio,
      directKeyframesBegin,
      directKeyframesEnd,
      postLerpIndex,
      postLerpRatio
    } = splitInfo;
    const nNewKeyframes = splitInfo.keyframesCount;
    if (nNewKeyframes === 0) {
      return {
        times: new TimeArrayConstructor(0),
        values: new ValueArrayConstructor(0)
      };
    }
    const prevValue = new ValueConstructor();
    const nextValue = new ValueConstructor();
    const resultValue = new ValueConstructor();
    const newTimes = new TimeArrayConstructor(nNewKeyframes);
    const newValues = new ValueArrayConstructor(components * nNewKeyframes);
    const doLerp = (index, ratio, outputIndex) => {
      assertIsTrue(index < times.length - 1);
      const iPrevious = index;
      const iNext = index + 1;
      values.lerp(iPrevious, iNext, ratio, prevValue, nextValue, resultValue);
      newTimes[outputIndex] = lerp(times[iPrevious], times[iNext], ratio) - from;
      ValueConstructor.toArray(newValues, resultValue, components * outputIndex);
    };
    let iKeyframe = 0;
    if (preLerpIndex >= 0) {
      doLerp(preLerpIndex, preLerpRatio, iKeyframe);
      ++iKeyframe;
    }
    for (let index = directKeyframesBegin; index < directKeyframesEnd; ++index, ++iKeyframe) {
      values.get(index, resultValue);
      newTimes[iKeyframe] = times[index] - from;
      ValueConstructor.toArray(newValues, resultValue, components * iKeyframe);
    }
    if (postLerpIndex >= 0) {
      doLerp(postLerpIndex, postLerpRatio, iKeyframe);
      ++iKeyframe;
    }
    assertIsTrue(iKeyframe === nNewKeyframes);
    return {
      times: newTimes,
      values: newValues
    };
  }
  function binarySearchRatio(values, value) {
    const nValues = values.length;
    assertIsTrue(values.length !== 0);
    let resultIndex = 0;
    let resultRatio = 0.0;
    const index0 = binarySearchEpsilon(values, value);
    if (index0 >= 0) {
      resultIndex = index0;
    } else {
      const iNext = ~index0;
      assertIsTrue(iNext !== 0 && iNext !== nValues && nValues > 1);
      const iPrev = iNext - 1;
      resultIndex = iPrev;
      const next = values[iNext];
      const prev = values[iPrev];
      resultRatio = (value - prev) / (next - prev);
    }
    return {
      index: resultIndex,
      ratio: resultRatio
    };
  }
  function sampleInput(values, time, result) {
    const nFrames = values.length;
    assertIsTrue(nFrames !== 0);
    const firstTime = values[0];
    const lastTime = values[nFrames - 1];
    if (time < firstTime) {
      result.just = true;
      result.index = 0;
    } else if (time > lastTime) {
      result.just = true;
      result.index = nFrames - 1;
    } else {
      const index = binarySearchEpsilon(values, time);
      if (index >= 0) {
        result.just = true;
        result.index = index;
      } else {
        const nextIndex = ~index;
        assertIsTrue(nextIndex !== 0 && nextIndex !== nFrames && nFrames > 1);
        const prevIndex = nextIndex - 1;
        const prevTime = values[prevIndex];
        const nextTime = values[nextIndex];
        const ratio = (time - values[prevIndex]) / (nextTime - prevTime);
        result.just = false;
        result.index = prevIndex;
        result.nextIndex = nextIndex;
        result.ratio = ratio;
      }
    }
    return result;
  }
  function getFloatArrayPrecision(array) {
    switch (array.BYTES_PER_ELEMENT) {
      default:
        assertIsTrue(false);
      // fallthrough
      case 4:
        return FloatPrecision.FLOAT_32;
      case 8:
        return FloatPrecision.FLOAT_64;
    }
  }
  function getFloatArrayConstructorWithPrecision(precision) {
    switch (precision) {
      default:
        assertIsTrue(false);
      // fallthrough
      case FloatPrecision.FLOAT_32:
        return Float32Array;
      case FloatPrecision.FLOAT_64:
        return Float64Array;
    }
  }
  function quantize(values, type) {
    const TypedArrayViewConstructor = QUANTIZATION_TYPE_TO_ARRAY_VIEW_CONSTRUCTOR_MAP[type];
    const MAX = 1 << TypedArrayViewConstructor.BYTES_PER_ELEMENT;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    values.forEach(value => {
      min = Math.min(value, min);
      max = Math.max(value, max);
    });
    const extent = max - min;
    // Should consider `extent === 0.0`.
    const normalized = TypedArrayViewConstructor.from(values, value => (value - min) / extent * MAX);
    return new QuantizedFloatArray(getFloatArrayPrecision(values), normalized, extent, min);
  }
  function indexQuantized(quantized, index) {
    const quantizedValue = quantized.values[index];
    const MAX_VALUE = 1 << quantized.values.BYTES_PER_ELEMENT;
    return quantizedValue / MAX_VALUE * quantized.extent + quantized.min;
  }
  function createExoticTrackEvaluationRecord(times, values, ValueConstructor, path, property, binder) {
    const trackBinding = new TrackBinding();
    trackBinding.path = new TrackPath().toHierarchy(path).toProperty(property);
    const runtimeBinding = binder(trackBinding);
    if (!runtimeBinding) {
      return null;
    }
    const evaluator = new ExoticTrackEvaluator(times, values, ValueConstructor);
    return {
      runtimeBinding,
      evaluator
    };
  }
  function loadVec3FromQuantized(values, index, out) {
    Vec3.set(out, indexQuantized(values, 3 * index + 0), indexQuantized(values, 3 * index + 1), indexQuantized(values, 3 * index + 2));
  }
  function loadQuatFromQuantized(values, index, out) {
    Quat.set(out, indexQuantized(values, 4 * index + 0), indexQuantized(values, 4 * index + 1), indexQuantized(values, 4 * index + 2), indexQuantized(values, 4 * index + 3));
  }
  _export("ExoticTrsAGEvaluation", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
      NODEJS = _virtualInternal253AconstantsJs.NODEJS;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreIndexJs) {
      binarySearchEpsilon = _coreIndexJs.binarySearchEpsilon;
      lerp = _coreIndexJs.lerp;
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      _decorator = _coreIndexJs._decorator;
    }, function (_coreDataUtilsAssertsJs) {
      assertIsTrue = _coreDataUtilsAssertsJs.assertIsTrue;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_tracksTrackJs) {
      TrackBinding = _tracksTrackJs.TrackBinding;
      TrackPath = _tracksTrackJs.TrackPath;
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
      SPLIT_METHOD_ENABLED = TEST || EDITOR || NODEJS;
      ({
        ccclass,
        serializable
      } = _decorator);
      _export("ExoticAnimation", ExoticAnimation = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}ExoticAnimation`), _dec(_class = (_class2 = class ExoticAnimation {
        constructor() {
          _initializerDefineProperty(this, "_nodeAnimations", _descriptor, this);
        }
        createEvaluator(binder) {
          return new ExoticTrsAnimationEvaluator(this._nodeAnimations, binder);
        }
        createEvaluatorForAnimationGraph(context) {
          return new ExoticTrsAGEvaluation(this._nodeAnimations, context);
        }
        addNodeAnimation(path) {
          const nodeAnimation = new ExoticNodeAnimation(path);
          this._nodeAnimations.push(nodeAnimation);
          return nodeAnimation;
        }
        collectAnimatedJoints() {
          return Array.from(new Set(this._nodeAnimations.map(({
            path
          }) => path)));
        }
        split(from, to) {
          if (!SPLIT_METHOD_ENABLED) {
            return throwIfSplitMethodIsNotValid();
          }
          const splitInfoCache = new SplitInfo();
          const newAnimation = new ExoticAnimation();
          newAnimation._nodeAnimations = this._nodeAnimations.map(nodeAnimation => nodeAnimation.split(from, to, splitInfoCache));
          return newAnimation;
        }

        /**
         * @internal
         */
        toHashString() {
          return this._nodeAnimations.map(nodeAnimation => nodeAnimation.toHashString()).join('\n');
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_nodeAnimations", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class));
      ExoticNodeAnimation = (_dec2 = ccclass(`${CLASS_NAME_PREFIX_ANIM}ExoticNodeAnimation`), _dec2(_class3 = (_class4 = class ExoticNodeAnimation {
        constructor(path) {
          _initializerDefineProperty(this, "_path", _descriptor2, this);
          _initializerDefineProperty(this, "_position", _descriptor3, this);
          _initializerDefineProperty(this, "_rotation", _descriptor4, this);
          _initializerDefineProperty(this, "_scale", _descriptor5, this);
          this._path = path;
        }
        createPosition(times, values) {
          this._position = new ExoticTrack(times, new ExoticVec3TrackValues(values));
        }
        createRotation(times, values) {
          this._rotation = new ExoticTrack(times, new ExoticQuatTrackValues(values));
        }
        createScale(times, values) {
          this._scale = new ExoticTrack(times, new ExoticVec3TrackValues(values));
        }
        createEvaluator(binder) {
          return new ExoticNodeAnimationEvaluator(this._path, this._position, this._rotation, this._scale, binder);
        }
        createEvaluatorForAnimationGraph(context) {
          const transformHandle = context.bindTransform(this._path);
          if (!transformHandle) {
            return null;
          }
          return new ExoticNodeAnimationAGEvaluation(transformHandle, this._position, this._rotation, this._scale);
        }
        split(from, to, splitInfoCache) {
          if (!SPLIT_METHOD_ENABLED) {
            return throwIfSplitMethodIsNotValid();
          }
          const newAnimation = new ExoticNodeAnimation(this._path);
          const {
            _position: position,
            _rotation: rotation,
            _scale: scale
          } = this;
          if (position) {
            newAnimation._position = splitVec3Track(position, from, to, splitInfoCache);
          }
          if (rotation) {
            newAnimation._rotation = splitQuatTrack(rotation, from, to, splitInfoCache);
          }
          if (scale) {
            newAnimation._scale = splitVec3Track(scale, from, to, splitInfoCache);
          }
          return newAnimation;
        }
        get path() {
          return this._path;
        }

        /**
         * @internal
         */
        toHashString() {
          var _this$_position$toHas, _this$_position, _this$_scale$toHashSt, _this$_scale, _this$_rotation$toHas, _this$_rotation;
          return `${this._path}\n${(_this$_position$toHas = (_this$_position = this._position) == null ? void 0 : _this$_position.toHashString()) != null ? _this$_position$toHas : ''}${(_this$_scale$toHashSt = (_this$_scale = this._scale) == null ? void 0 : _this$_scale.toHashString()) != null ? _this$_scale$toHashSt : ''}${(_this$_rotation$toHas = (_this$_rotation = this._rotation) == null ? void 0 : _this$_rotation.toHashString()) != null ? _this$_rotation$toHas : ''}`;
        }
      }, _descriptor2 = _applyDecoratedDescriptor(_class4.prototype, "_path", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return '';
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class4.prototype, "_position", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class4.prototype, "_rotation", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class4.prototype, "_scale", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class4)) || _class3);
      ExoticVectorLikeTrackValues = (_dec3 = ccclass(`${CLASS_NAME_PREFIX_ANIM}ExoticVectorLikeTrackValues`), _dec3(_class5 = (_class6 = class ExoticVectorLikeTrackValues {
        constructor(values) {
          _initializerDefineProperty(this, "_values", _descriptor6, this);
          _initializerDefineProperty(this, "_isQuantized", _descriptor7, this);
          this._values = values;
        }
        get precision() {
          return this._isQuantized ? this._values.originalPrecision : getFloatArrayPrecision(this._values);
        }
        quantize(type) {
          assertIsTrue(!this._isQuantized);
          this._values = quantize(this._values, type);
          this._isQuantized = true;
        }

        /**
         * @internal
         */
        toHashString() {
          const {
            _isQuantized: isQuantized,
            _values: values
          } = this;
          return `${isQuantized} ${isQuantized ? values.toHashString() : floatArrayToHashString(values)}`;
        }
      }, _descriptor6 = _applyDecoratedDescriptor(_class6.prototype, "_values", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor7 = _applyDecoratedDescriptor(_class6.prototype, "_isQuantized", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return false;
        }
      }), _class6)) || _class5);
      ExoticVec3TrackValues = (_dec4 = ccclass(`${CLASS_NAME_PREFIX_ANIM}ExoticVec3TrackValues`), _dec4(_class7 = class ExoticVec3TrackValues extends ExoticVectorLikeTrackValues {
        static imitate(values, model) {
          const trackValues = new ExoticVec3TrackValues(values);
          if (model._isQuantized) {
            trackValues.quantize(model._values.quantizationType);
          }
          return trackValues;
        }
        get(index, resultValue) {
          const {
            _values: values,
            _isQuantized: isQuantized
          } = this;
          if (isQuantized) {
            loadVec3FromQuantized(values, index, resultValue);
          } else {
            Vec3.fromArray(resultValue, values, index * 3);
          }
        }
        lerp(prevIndex, nextIndex, ratio, prevValue, nextValue, resultValue) {
          const {
            _values: values,
            _isQuantized: isQuantized
          } = this;
          if (isQuantized) {
            loadVec3FromQuantized(values, prevIndex, prevValue);
            loadVec3FromQuantized(values, nextIndex, nextValue);
          } else {
            Vec3.fromArray(prevValue, values, prevIndex * 3);
            Vec3.fromArray(nextValue, values, nextIndex * 3);
          }
          Vec3.lerp(resultValue, prevValue, nextValue, ratio);
        }
      }) || _class7);
      ExoticQuatTrackValues = (_dec5 = ccclass(`${CLASS_NAME_PREFIX_ANIM}ExoticQuatTrackValues`), _dec5(_class8 = class ExoticQuatTrackValues extends ExoticVectorLikeTrackValues {
        static imitate(values, model) {
          const trackValues = new ExoticQuatTrackValues(values);
          if (model._isQuantized) {
            trackValues.quantize(model._values.quantizationType);
          }
          return trackValues;
        }
        get(index, resultValue) {
          const {
            _values: values,
            _isQuantized: isQuantized
          } = this;
          if (isQuantized) {
            loadQuatFromQuantized(values, index, resultValue);
          } else {
            Quat.fromArray(resultValue, values, index * 4);
          }
        }
        lerp(prevIndex, nextIndex, ratio, prevValue, nextValue, resultValue) {
          const {
            _values: values,
            _isQuantized: isQuantized
          } = this;
          if (isQuantized) {
            loadQuatFromQuantized(values, prevIndex, prevValue);
            loadQuatFromQuantized(values, nextIndex, nextValue);
          } else {
            Quat.fromArray(prevValue, values, prevIndex * 4);
            Quat.fromArray(nextValue, values, nextIndex * 4);
          }
          Quat.slerp(resultValue, prevValue, nextValue, ratio);
        }
      }) || _class8);
      ExoticTrack = (_dec6 = ccclass(`${CLASS_NAME_PREFIX_ANIM}ExoticTrack`), _dec6(_class9 = (_class0 = class ExoticTrack {
        constructor(times, values) {
          _initializerDefineProperty(this, "times", _descriptor8, this);
          _initializerDefineProperty(this, "values", _descriptor9, this);
          this.times = times;
          this.values = values;
        }
        /**
         * @internal
         */
        toHashString() {
          const {
            times,
            values
          } = this;
          return `times: ${floatArrayToHashString(times)}; values: ${values.toHashString()}`;
        }
      }, _descriptor8 = _applyDecoratedDescriptor(_class0.prototype, "times", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor9 = _applyDecoratedDescriptor(_class0.prototype, "values", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class0)) || _class9);
      SplitInfo = class SplitInfo {
        constructor() {
          this._reset();
        }
        get keyframesCount() {
          const {
            preLerpIndex,
            directKeyframesBegin,
            directKeyframesEnd,
            postLerpIndex
          } = this;
          return 0 + (preLerpIndex < 0 ? 0 : 1) + (directKeyframesEnd - directKeyframesBegin) + (postLerpIndex < 0 ? 0 : 1);
        }
        calculate(times, from, to) {
          this._reset();
          if (from > to) {
            return;
          }
          const nKeyframes = times.length;
          if (!nKeyframes) {
            return;
          }
          const firstTime = times[0];
          const lastTime = times[nKeyframes - 1];
          let fromIndex = 0;
          let fromRatio = 0.0;
          if (from < firstTime) {
            // Leave as-is.
          } else if (from >= lastTime) {
            fromIndex = nKeyframes - 1;
            fromRatio = 0.0;
          } else {
            ({
              index: fromIndex,
              ratio: fromRatio
            } = binarySearchRatio(times, from));
          }
          let toIndex = 0;
          let toRatio = 0.0;
          if (to < firstTime) {
            // Leave as-is.
          } else if (to >= lastTime) {
            toIndex = nKeyframes - 1;
            toRatio = 0.0;
          } else {
            ({
              index: toIndex,
              ratio: toRatio
            } = binarySearchRatio(times, to));
          }
          assertIsTrue(toIndex >= fromIndex);
          const fromJust = !fromRatio;
          const toJust = !toRatio;

          // Handles that from and to are same
          if (fromIndex === toIndex && fromRatio === toRatio) {
            if (!fromJust) {
              this.preLerpIndex = fromIndex;
              this.preLerpRatio = fromRatio;
            } else {
              this.directKeyframesBegin = fromIndex;
              this.directKeyframesEnd = fromIndex + 1;
            }
            return;
          }
          if (!fromJust) {
            this.preLerpIndex = fromIndex;
            this.preLerpRatio = fromRatio;
          }
          this.directKeyframesBegin = fromJust ? fromIndex : fromIndex + 1;
          this.directKeyframesEnd = toIndex + 1;
          if (!toJust) {
            this.postLerpIndex = toIndex;
            this.postLerpRatio = toRatio;
          }
        }
        _reset() {
          this.preLerpIndex = -1;
          this.preLerpRatio = 0.0;
          this.directKeyframesBegin = 0;
          this.directKeyframesEnd = 0;
          this.postLerpIndex = -1;
          this.postLerpRatio = 0.0;
        }
      };
      ExoticTrsAnimationEvaluator = class ExoticTrsAnimationEvaluator {
        constructor(nodeAnimations, binder) {
          this._nodeEvaluations = void 0;
          this._nodeEvaluations = nodeAnimations.map(nodeAnimation => nodeAnimation.createEvaluator(binder));
        }
        evaluate(time) {
          this._nodeEvaluations.forEach(nodeEvaluator => {
            nodeEvaluator.evaluate(time);
          });
        }
      };
      ExoticNodeAnimationEvaluator = class ExoticNodeAnimationEvaluator {
        constructor(path, position, rotation, scale, binder) {
          this._position = null;
          this._rotation = null;
          this._scale = null;
          if (position) {
            this._position = createExoticTrackEvaluationRecord(position.times, position.values, Vec3, path, 'position', binder);
          }
          if (rotation) {
            this._rotation = createExoticTrackEvaluationRecord(rotation.times, rotation.values, Quat, path, 'rotation', binder);
          }
          if (scale) {
            this._scale = createExoticTrackEvaluationRecord(scale.times, scale.values, Vec3, path, 'scale', binder);
          }
        }
        evaluate(time) {
          if (this._position) {
            const value = this._position.evaluator.evaluate(time);
            this._position.runtimeBinding.setValue(value);
          }
          if (this._rotation) {
            const value = this._rotation.evaluator.evaluate(time);
            this._rotation.runtimeBinding.setValue(value);
          }
          if (this._scale) {
            const value = this._scale.evaluator.evaluate(time);
            this._scale.runtimeBinding.setValue(value);
          }
        }
      };
      ExoticTrackEvaluator = class ExoticTrackEvaluator {
        constructor(times, values, ValueConstructor) {
          this._times = void 0;
          this._inputSampleResultCache = {
            just: false,
            index: -1,
            nextIndex: -1,
            ratio: 0.0
          };
          this._values = void 0;
          this._prevValue = void 0;
          this._nextValue = void 0;
          this._resultValue = void 0;
          this._times = times;
          this._values = values;
          this._prevValue = new ValueConstructor();
          this._nextValue = new ValueConstructor();
          this._resultValue = new ValueConstructor();
        }
        evaluate(time) {
          const {
            _times: times,
            _values: values,
            _resultValue: resultValue
          } = this;
          const nFrames = times.length;
          if (nFrames === 0) {
            return resultValue;
          }
          const inputSampleResult = sampleInput(times, time, this._inputSampleResultCache);
          if (inputSampleResult.just) {
            values.get(inputSampleResult.index, resultValue);
          } else {
            values.lerp(inputSampleResult.index, inputSampleResult.nextIndex, inputSampleResult.ratio, this._prevValue, this._nextValue, resultValue);
          }
          return resultValue;
        }
      };
      /**
       * Exotic TRS animation graph evaluator.
       */
      _export("ExoticTrsAGEvaluation", ExoticTrsAGEvaluation = class ExoticTrsAGEvaluation {
        constructor(nodeAnimations, context) {
          this._nodeEvaluations = void 0;
          this._nodeEvaluations = nodeAnimations.map(nodeAnimation => nodeAnimation.createEvaluatorForAnimationGraph(context)).filter(x => !!x);
        }
        destroy() {
          const {
            _nodeEvaluations: nodeEvaluations
          } = this;
          const nNodeEvaluations = nodeEvaluations.length;
          for (let iNodeEvaluation = 0; iNodeEvaluation < nNodeEvaluations; ++iNodeEvaluation) {
            nodeEvaluations[iNodeEvaluation].destroy();
          }
        }
        evaluate(time, pose) {
          const {
            _nodeEvaluations: nodeEvaluations
          } = this;
          const nNodeEvaluations = nodeEvaluations.length;
          for (let iNodeEvaluation = 0; iNodeEvaluation < nNodeEvaluations; ++iNodeEvaluation) {
            nodeEvaluations[iNodeEvaluation].evaluate(time, pose);
          }
        }
      });
      ExoticNodeAnimationAGEvaluation = class ExoticNodeAnimationAGEvaluation {
        constructor(transformHandle, position, rotation, scale) {
          this._position = null;
          this._rotation = null;
          this._scale = null;
          this._transformHandle = void 0;
          this._transformHandle = transformHandle;
          if (position) {
            this._position = new ExoticTrackEvaluator(position.times, position.values, Vec3);
          }
          if (rotation) {
            this._rotation = new ExoticTrackEvaluator(rotation.times, rotation.values, Quat);
          }
          if (scale) {
            this._scale = new ExoticTrackEvaluator(scale.times, scale.values, Vec3);
          }
        }
        destroy() {
          this._transformHandle.destroy();
        }
        evaluate(time, pose) {
          const {
            _transformHandle: {
              index: transformIndex
            },
            _position: position,
            _rotation: rotation,
            _scale: scale
          } = this;
          const {
            transforms: poseTransforms
          } = pose;
          if (position) {
            const value = position.evaluate(time);
            poseTransforms.setPosition(transformIndex, value);
          }
          if (rotation) {
            const rotationAbs = rotation.evaluate(time);
            poseTransforms.setRotation(transformIndex, rotationAbs);
          }
          if (scale) {
            const value = scale.evaluate(time);
            poseTransforms.setScale(transformIndex, value);
          }
        }
      };
      QUANTIZATION_TYPE_TO_ARRAY_VIEW_CONSTRUCTOR_MAP = {
        uint8: Uint8Array,
        uint16: Uint16Array
      };
      FloatPrecision = /*#__PURE__*/function (FloatPrecision) {
        FloatPrecision[FloatPrecision["FLOAT_32"] = 0] = "FLOAT_32";
        FloatPrecision[FloatPrecision["FLOAT_64"] = 1] = "FLOAT_64";
        return FloatPrecision;
      }(FloatPrecision || {});
      QuantizedFloatArray = (_dec7 = ccclass(`${CLASS_NAME_PREFIX_ANIM}QuantizedFloatArray`), _dec7(_class1 = (_class10 = class QuantizedFloatArray {
        get quantizationType() {
          switch (this.values.BYTES_PER_ELEMENT) {
            default:
            // fallthrough
            case 1:
              return 'uint8';
            case 2:
              return 'uint16';
          }
        }
        constructor(originalPrecision, values, extent, min = 0.0) {
          _initializerDefineProperty(this, "originalPrecision", _descriptor0, this);
          _initializerDefineProperty(this, "min", _descriptor1, this);
          _initializerDefineProperty(this, "extent", _descriptor10, this);
          _initializerDefineProperty(this, "values", _descriptor11, this);
          this.originalPrecision = originalPrecision;
          this.values = values;
          this.extent = extent;
          this.min = min;
        }

        /**
         * @internal
         */
        toHashString() {
          const {
            originalPrecision,
            min,
            extent,
            values
          } = this;
          return `${originalPrecision} ${floatToHashString(min)} ${floatToHashString(extent)} ${values.join(' ')}`;
        }
      }, _descriptor0 = _applyDecoratedDescriptor(_class10.prototype, "originalPrecision", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor1 = _applyDecoratedDescriptor(_class10.prototype, "min", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor10 = _applyDecoratedDescriptor(_class10.prototype, "extent", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor11 = _applyDecoratedDescriptor(_class10.prototype, "values", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _class10)) || _class1);
    }
  };
});