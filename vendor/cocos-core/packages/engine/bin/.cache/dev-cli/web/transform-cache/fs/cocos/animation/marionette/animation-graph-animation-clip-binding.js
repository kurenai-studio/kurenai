System.register("q-bundled:///fs/cocos/animation/marionette/animation-graph-animation-clip-binding.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../core/data/utils/asserts.js", "../../scene-graph/node.js", "../animation-clip.js", "../core/pose.js", "../define.js", "../tracks/track.js", "../tracks/untyped-track.js"], function (_export, _context) {
  "use strict";

  var DEBUG, Quat, Vec3, warnID, assertIsTrue, Node, additiveSettingsTag, exoticAnimationTag, calculateDeltaPose, createEvalSymbol, isTrsPropertyName, normalizedFollowTag, trackBindingTag, UntypedTrack, PoseBindingBase, PosePositionBinding, PoseRotationBinding, PoseEulerAnglesBinding, PoseScaleBinding, AuxiliaryCurveBinding, NonTransformPoseBinding, AGTrackEvaluation, AuxiliaryCurveEvaluation, AnimationClipAGEvaluationRegular, AnimationClipAGEvaluationAdditive, CACHE_VEC3_GET_VALUE, CACHE_QUAT_GET_VALUE;
  /**
   * Creates a corresponding pose binding.
   * @param transformHandle Handle to the transform.
   * @param propertyKey Indicates the binding type.
   * @returns The pose binding.
   */
  // eslint-disable-next-line consistent-return
  function bindPoseTransform(transformHandle, propertyKey) {
    switch (propertyKey) {
      case 'position':
        return new PosePositionBinding(transformHandle);
      case 'rotation':
        return new PoseRotationBinding(transformHandle);
      case 'eulerAngles':
        return new PoseEulerAnglesBinding(transformHandle);
      case 'scale':
        return new PoseScaleBinding(transformHandle);
      default:
        assertIsTrue(false);
    }
  }
  function bindTrackAG(animationClip, track, bindContext) {
    const trackBinding = track[trackBindingTag];
    const trackTarget = createRuntimeBindingAG(trackBinding, bindContext);
    if (DEBUG && !trackTarget) {
      // If we got a null track target here, we should already have warn logged,
      // To elaborate on error details, we warn here as well.
      // Note: if in the future this log appears alone,
      // it must be a BUG which break promise by above statement.
      warnID(3937, animationClip.name, bindContext.origin.name);
    }
    return trackTarget != null ? trackTarget : undefined;
  }
  function createRuntimeBindingAG(track, bindContext) {
    const {
      origin
    } = bindContext;
    const {
      path,
      proxy
    } = track;
    const nPaths = path.length;
    const iLastPath = nPaths - 1;
    if (nPaths !== 0 && (path.isPropertyAt(iLastPath) || path.isElementAt(iLastPath)) && !proxy) {
      const lastPropertyKey = path.isPropertyAt(iLastPath) ? path.parsePropertyAt(iLastPath) : path.parseElementAt(iLastPath);
      const resultTarget = path[normalizedFollowTag](origin, 0, nPaths - 1);
      if (resultTarget === null) {
        return null;
      }
      if (resultTarget instanceof Node && isTrsPropertyName(lastPropertyKey)) {
        const transformPath = (() => {
          const segments = [];
          let node = resultTarget;
          for (; node && node !== origin; node = node.parent) {
            segments.unshift(node.name);
          }
          if (node === origin) {
            return segments.join('/');
          } else {
            return undefined;
          }
        })();
        if (typeof transformPath === 'string') {
          const transformHandle = bindContext.bindTransform(transformPath);
          if (!transformHandle) {
            return undefined;
          }
          return bindPoseTransform(transformHandle, lastPropertyKey);
        }
      }
    }

    // If this path does not aim a transform target,
    // we create `NonTransformPoseBinding` using default binding.
    {
      const nonTransformBinding = track.createRuntimeBinding(bindContext.origin, undefined, false);
      if (!nonTransformBinding) {
        return null;
      }
      return new NonTransformPoseBinding(nonTransformBinding);
    }
  }
  function createAnimationAGEvaluation(clip, context) {
    if (clip.isAdditive_experimental) {
      return new AnimationClipAGEvaluationAdditive(clip, context);
    } else {
      return new AnimationClipAGEvaluationRegular(clip, context);
    }
  }
  _export("createAnimationAGEvaluation", createAnimationAGEvaluation);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreIndexJs) {
      Quat = _coreIndexJs.Quat;
      Vec3 = _coreIndexJs.Vec3;
      warnID = _coreIndexJs.warnID;
    }, function (_coreDataUtilsAssertsJs) {
      assertIsTrue = _coreDataUtilsAssertsJs.assertIsTrue;
    }, function (_sceneGraphNodeJs) {
      Node = _sceneGraphNodeJs.Node;
    }, function (_animationClipJs) {
      additiveSettingsTag = _animationClipJs.additiveSettingsTag;
      exoticAnimationTag = _animationClipJs.exoticAnimationTag;
    }, function (_corePoseJs) {
      calculateDeltaPose = _corePoseJs.calculateDeltaPose;
    }, function (_defineJs) {
      createEvalSymbol = _defineJs.createEvalSymbol;
    }, function (_tracksTrackJs) {
      isTrsPropertyName = _tracksTrackJs.isTrsPropertyName;
      normalizedFollowTag = _tracksTrackJs.normalizedFollowTag;
      trackBindingTag = _tracksTrackJs.trackBindingTag;
    }, function (_tracksUntypedTrackJs) {
      UntypedTrack = _tracksUntypedTrackJs.UntypedTrack;
    }],
    execute: function () {
      /**
       * This module contains utilities to marry animation clip with animation graph.
       *
       * A typical workflow is:
       *
       * At initial, an animation clip is bound to animation graph in `AnimationClipGraphBindingContext`,
       * an `AnimationClipAGEvaluation` is created after this phase to track the evaluation.
       *
       * Then at each frame, `AnimationClipAGEvaluation.evaluate()` is called,
       * passed with the current `AnimationClipGraphEvaluationContext`.
       * The evaluation context gives the pose that need to be filled,
       * then animation clip emplaces sampled animation data into the pose.
       */
      /**
       * The context in which animation clips can be bound in an animation graph.
       */
      /**
       * The context in which animation clips can evaluate during animation graph evaluation.
       * Currently, the context is just the output pose.
       */
      /**
       * A pose binding describes how to get/set part of a bound transform in animation graph.
       * The `T` can be `Vec3`, `Quat` for now.
       */
      CACHE_VEC3_GET_VALUE = new Vec3();
      CACHE_QUAT_GET_VALUE = new Quat();
      /**
       * The pose binding base is base class of all pose binding classes.
       * It holds a transform handle.
       */
      PoseBindingBase = class PoseBindingBase {
        constructor(transformHandle) {
          this._transformHandle = transformHandle;
        }

        /**
         * Releases the held transform handle.
         */
        destroy() {
          this._transformHandle.destroy();
        }

        /**
         * The held transform handle.
         */
      };
      /**
       * The pose position binding describes how to get/set the position of a bound transform in animation graph.
       */
      PosePositionBinding = class PosePositionBinding extends PoseBindingBase {
        setValue(value, pose) {
          pose.transforms.setPosition(this._transformHandle.index, value);
        }
        getValue(pose) {
          return pose.transforms.getPosition(this._transformHandle.index, CACHE_VEC3_GET_VALUE);
        }
      };
      /**
       * The pose rotation binding describes how to get/set the rotation(in quaternion) of a bound transform in animation graph.
       */
      PoseRotationBinding = class PoseRotationBinding extends PoseBindingBase {
        setValue(value, pose) {
          pose.transforms.setRotation(this._transformHandle.index, value);
        }
        getValue(pose) {
          return pose.transforms.getRotation(this._transformHandle.index, CACHE_QUAT_GET_VALUE);
        }
      };
      /**
       * The pose euler angles binding describes how to get/set the rotation(in euler angles) of a bound transform in animation graph.
       */
      PoseEulerAnglesBinding = class PoseEulerAnglesBinding extends PoseBindingBase {
        setValue(value, pose) {
          const quat = Quat.fromEuler(PoseEulerAnglesBinding._EULER_TO_QUAT_CACHE, value.x, value.y, value.z);
          pose.transforms.setRotation(this._transformHandle.index, quat);
        }
        getValue(pose) {
          const q = pose.transforms.getRotation(this._transformHandle.index, CACHE_QUAT_GET_VALUE);
          return Quat.toEuler(CACHE_VEC3_GET_VALUE, q);
        }
      };
      /**
       * The pose euler scale binding describes how to get/set the scale of a bound transform in animation graph.
       */
      PoseEulerAnglesBinding._EULER_TO_QUAT_CACHE = new Quat();
      PoseScaleBinding = class PoseScaleBinding extends PoseBindingBase {
        setValue(value, pose) {
          pose.transforms.setScale(this._transformHandle.index, value);
        }
        getValue(pose) {
          return pose.transforms.getScale(this._transformHandle.index, CACHE_VEC3_GET_VALUE);
        }
      };
      AuxiliaryCurveBinding = class AuxiliaryCurveBinding {
        constructor(_handle) {
          this._handle = _handle;
        }
        destroy() {
          this._handle.destroy();
        }
        setValue(value, pose) {
          pose.auxiliaryCurves[this._handle.index] = value;
        }
        getValue(pose) {
          return pose.auxiliaryCurves[this._handle.index];
        }
      };
      NonTransformPoseBinding = class NonTransformPoseBinding {
        constructor(binding) {
          this.binding = binding;
        }
        destroy() {
          // Needs no destroy.
        }
        setValue(value, _pose) {
          this.binding.setValue(value);
        }
        getValue(pose) {
          var _this$binding$getValu, _this$binding$getValu2, _this$binding;
          return (_this$binding$getValu = (_this$binding$getValu2 = (_this$binding = this.binding).getValue) == null ? void 0 : _this$binding$getValu2.call(_this$binding)) != null ? _this$binding$getValu : undefined;
        }
      };
      /**
       * Describes the evaluation of a animation clip track in sense of animation graph.
       */
      AGTrackEvaluation = class AGTrackEvaluation {
        constructor(binding, trackEvaluation) {
          this._binding = void 0;
          this._trackSampler = void 0;
          this._binding = binding;
          this._trackSampler = trackEvaluation;
        }
        destroy() {
          this._binding.destroy();
        }
        evaluate(time, pose) {
          const {
            _trackSampler: trackSampler,
            _binding: binding
          } = this;
          const defaultValue = /* binding.getValue && */trackSampler.requiresDefault ? binding.getValue(pose) : undefined;
          const value = trackSampler.evaluate(time, defaultValue);
          binding.setValue(value, pose);
        }
      };
      AuxiliaryCurveEvaluation = class AuxiliaryCurveEvaluation {
        constructor(_binding, _curve) {
          this._binding = _binding;
          this._curve = _curve;
        }

        /**
         * Evaluates.
         * @param time The time.
         * @param context The evaluation context.
         */
        evaluate(time, context) {
          const {
            _curve: curve,
            _binding: binding
          } = this;
          const pose = context;
          const value = curve.evaluate(time);
          binding.setValue(value, pose);
        }
      };
      /**
       * Describes the evaluation of a animation clip in sense of animation graph.
       */
      AnimationClipAGEvaluationRegular = class AnimationClipAGEvaluationRegular {
        constructor(clip, context) {
          this._trackEvaluations = [];
          this._exoticAnimationEvaluation = void 0;
          this._auxiliaryCurveEvaluations = [];
          clip._trySyncLegacyData();
          const trackEvaluations = [];
          let exoticAnimationEvaluation;
          const auxiliaryCurveEvaluations = [];
          const {
            tracks
            // NOTE: on OH platform, there is a bug on Destructuring Assignment syntax.
            // [exoticAnimationTag]: exoticAnimation,
          } = clip;
          const exoticAnimation = clip[exoticAnimationTag];
          for (const track of tracks) {
            if (track instanceof UntypedTrack) {
              // Untyped track is not supported in AG.
              continue;
            }
            if (Array.from(track.channels()).every(({
              curve
            }) => curve.keyFramesCount === 0)) {
              continue;
            }
            const trackRuntimeBinding = bindTrackAG(clip, track, context);
            if (!trackRuntimeBinding) {
              continue;
            }
            const trackSampler = track[createEvalSymbol]();
            const trackEvaluation = new AGTrackEvaluation(trackRuntimeBinding, trackSampler);
            trackEvaluations.push(trackEvaluation);
          }
          if (exoticAnimation) {
            exoticAnimationEvaluation = exoticAnimation.createEvaluatorForAnimationGraph(context);
          }
          const auxiliaryCurveNames = clip.getAuxiliaryCurveNames_experimental();
          const nAuxiliaryCurves = auxiliaryCurveNames.length;
          for (let iAuxiliaryCurve = 0; iAuxiliaryCurve < nAuxiliaryCurves; ++iAuxiliaryCurve) {
            const curveName = auxiliaryCurveNames[iAuxiliaryCurve];
            const curve = clip.getAuxiliaryCurve_experimental(curveName);
            const handle = context.bindAuxiliaryCurve(curveName);
            const binding = new AuxiliaryCurveBinding(handle);
            auxiliaryCurveEvaluations.push(new AuxiliaryCurveEvaluation(binding, curve));
          }
          this._trackEvaluations = trackEvaluations;
          this._exoticAnimationEvaluation = exoticAnimationEvaluation;
          this._auxiliaryCurveEvaluations = auxiliaryCurveEvaluations;
        }
        destroy() {
          var _this$_exoticAnimatio;
          (_this$_exoticAnimatio = this._exoticAnimationEvaluation) == null || _this$_exoticAnimatio.destroy();
          const {
            _trackEvaluations: trackEvaluations
          } = this;
          const nTrackEvaluations = trackEvaluations.length;
          for (let iNodeEvaluation = 0; iNodeEvaluation < nTrackEvaluations; ++iNodeEvaluation) {
            trackEvaluations[iNodeEvaluation].destroy();
          }
        }
        evaluate(time, context) {
          const {
            _trackEvaluations: trackEvaluations,
            _exoticAnimationEvaluation: exoticAnimationEvaluation,
            _auxiliaryCurveEvaluations: auxiliaryCurveEvaluations
          } = this;
          const pose = context.pushDefaultedPose();
          const nTrackEvaluations = trackEvaluations.length;
          for (let iNodeEvaluation = 0; iNodeEvaluation < nTrackEvaluations; ++iNodeEvaluation) {
            trackEvaluations[iNodeEvaluation].evaluate(time, pose);
          }
          if (exoticAnimationEvaluation) {
            exoticAnimationEvaluation.evaluate(time, pose);
          }
          const nAuxiliaryCurveEvaluations = auxiliaryCurveEvaluations.length;
          for (let iAuxiliaryCurveEvaluation = 0; iAuxiliaryCurveEvaluation < nAuxiliaryCurveEvaluations; ++iAuxiliaryCurveEvaluation) {
            auxiliaryCurveEvaluations[iAuxiliaryCurveEvaluation].evaluate(time, pose);
          }
          return pose;
        }
      };
      AnimationClipAGEvaluationAdditive = class AnimationClipAGEvaluationAdditive {
        constructor(clip, context) {
          this._clipEval = void 0;
          this._refClipEval = void 0;
          this._clipEval = new AnimationClipAGEvaluationRegular(clip, context);
          const refClip = clip[additiveSettingsTag].refClip;
          if (refClip && refClip !== clip) {
            this._refClipEval = new AnimationClipAGEvaluationRegular(refClip, context);
          }
        }
        destroy() {
          var _this$_refClipEval;
          this._clipEval.destroy();
          (_this$_refClipEval = this._refClipEval) == null || _this$_refClipEval.destroy();
        }

        /**
         * Evaluates.
         * @param time The time.
         * @param context The evaluation context.
         */
        evaluate(time, context) {
          // Evaluate this clip.
          const pose = this._clipEval.evaluate(time, context);
          let refPose;
          if (this._refClipEval) {
            const refClipTime = 0.0; // TODO: ref clip may specify a time?
            refPose = this._refClipEval.evaluate(refClipTime, context);
          } else {
            // If the ref clip is not specified,
            // The effect is as if the ref pose is the 0 time of original clip.
            refPose = this._clipEval.evaluate(0.0, context);
          }
          calculateDeltaPose(pose, refPose);
          context.popPose();
          return pose;
        }
      };
    }
  };
});