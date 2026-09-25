System.register("q-bundled:///fs/editor/src/marionette/preview.js", ["../../../cocos/scene-graph/index.js", "../../../cocos/animation/marionette/create-eval.js", "../../../cocos/animation/marionette/variable/index.js", "../../../cocos/core/data/utils/asserts.js", "../../../cocos/animation/marionette/motion/animation-blend.js", "../../../cocos/animation/marionette/animation-graph-context.js", "../../../cocos/animation/core/pose.js", "../../../cocos/animation/marionette/animation-controller.js"], function (_export, _context) {
  "use strict";

  var Node, createEval, createInstanceTag, assertIsNonNullable, AnimationBlendEval, AnimationGraphBindingContext, AnimationGraphPoseLayoutMaintainer, defaultTransformsTag, AuxiliaryCurveRegistry, blendPoseInto, AnimationController, AnimationGraphPartialPreviewer, MotionPreviewer, TransitionPreviewer, MotionEvalRecord;
  _export({
    MotionPreviewer: void 0,
    TransitionPreviewer: void 0
  });
  return {
    setters: [function (_cocosSceneGraphIndexJs) {
      Node = _cocosSceneGraphIndexJs.Node;
    }, function (_cocosAnimationMarionetteCreateEvalJs) {
      createEval = _cocosAnimationMarionetteCreateEvalJs.createEval;
    }, function (_cocosAnimationMarionetteVariableIndexJs) {
      createInstanceTag = _cocosAnimationMarionetteVariableIndexJs.createInstanceTag;
    }, function (_cocosCoreDataUtilsAssertsJs) {
      assertIsNonNullable = _cocosCoreDataUtilsAssertsJs.assertIsNonNullable;
    }, function (_cocosAnimationMarionetteMotionAnimationBlendJs) {
      AnimationBlendEval = _cocosAnimationMarionetteMotionAnimationBlendJs.AnimationBlendEval;
    }, function (_cocosAnimationMarionetteAnimationGraphContextJs) {
      AnimationGraphBindingContext = _cocosAnimationMarionetteAnimationGraphContextJs.AnimationGraphBindingContext;
      AnimationGraphPoseLayoutMaintainer = _cocosAnimationMarionetteAnimationGraphContextJs.AnimationGraphPoseLayoutMaintainer;
      defaultTransformsTag = _cocosAnimationMarionetteAnimationGraphContextJs.defaultTransformsTag;
      AuxiliaryCurveRegistry = _cocosAnimationMarionetteAnimationGraphContextJs.AuxiliaryCurveRegistry;
    }, function (_cocosAnimationCorePoseJs) {
      blendPoseInto = _cocosAnimationCorePoseJs.blendPoseInto;
    }, function (_cocosAnimationMarionetteAnimationControllerJs) {
      AnimationController = _cocosAnimationMarionetteAnimationControllerJs.AnimationController;
    }],
    execute: function () {
      AnimationGraphPartialPreviewer = class AnimationGraphPartialPreviewer {
        constructor(root) {
          // NOTE: these two properties rely on lazy initialization.
          this._poseLayoutMaintainer = void 0;
          this._evaluationContext = void 0;
          this._varInstances = {};
          this._root = void 0;
          this._motionRecords = [];
          this._dummyAnimationController = void 0;
          this._root = root;
          const dummyAnimationControllerNode = new Node();
          this._dummyAnimationController = dummyAnimationControllerNode.addComponent(AnimationController);
        }
        destroy() {
          this._dummyAnimationController.node.destroy();
        }
        clear() {
          this._varInstances = {};
          this._motionRecords = [];
        }
        evaluate() {
          const {
            _evaluationContext: evaluationContext
          } = this;
          const pose = this.doEvaluate(evaluationContext);
          this._poseLayoutMaintainer.apply(pose != null ? pose : evaluationContext.pushDefaultedPose());
          evaluationContext.popPose();
        }
        addVariable(id, description) {
          const {
            _varInstances: varInstances
          } = this;
          if (id in varInstances) {
            return;
          }
          varInstances[id] = description[createInstanceTag]();
        }
        removeVariable(id) {
          delete this._varInstances[id];
        }
        updateVariable(id, value) {
          const varInstance = this._varInstances[id];
          if (!varInstance) {
            return;
          }
          varInstance.value = value;
        }
        createMotionEval(motion) {
          const record = new MotionEvalRecord(motion);
          this._motionRecords.push(record);
          this._updateAllRecords();
          return record;
        }
        doEvaluate(_evaluationContext) {
          return null;
        }
        _updateAllRecords() {
          const poseLayoutMaintainer = new AnimationGraphPoseLayoutMaintainer(this._root, new AuxiliaryCurveRegistry());
          this._poseLayoutMaintainer = poseLayoutMaintainer;
          const bindingContext = new AnimationGraphBindingContext(this._root, this._poseLayoutMaintainer, this._varInstances, this._dummyAnimationController);
          poseLayoutMaintainer.startBind();
          for (const record of this._motionRecords) {
            record.rebind(bindingContext);
          }
          poseLayoutMaintainer.endBind();
          const evaluationContext = poseLayoutMaintainer.createEvaluationContext();
          poseLayoutMaintainer.fetchDefaultTransforms(evaluationContext[defaultTransformsTag]);
          if (this._evaluationContext) {
            this._evaluationContext.destroy();
          }
          this._evaluationContext = evaluationContext;
        }
      };
      _export("MotionPreviewer", MotionPreviewer = class MotionPreviewer extends AnimationGraphPartialPreviewer {
        constructor(...args) {
          super(...args);
          this._time = 0.0;
          this._motionEval = null;
          this._timelineStatsDirty = true;
          this._timelineStats = {
            timeLineLength: 0.0
          };
        }
        get timelineStats() {
          if (this._timelineStatsDirty) {
            this._updateTimelineStats();
            this._timelineStatsDirty = false;
          }
          return this._timelineStats;
        }

        /**
         * Gets an iterable to the weights of each motion(that has runtime ID).
         */
        queryWeights() {
          if (this._motionEval) {
            return this._motionEval.getWeightsRecursive(1.0);
          }
          return [];
        }
        setMotion(motion) {
          this._motionEval = super.createMotionEval(motion);
          this._timelineStatsDirty = true;
        }
        setTime(time) {
          this._time = time;
        }
        updateVariable(id, value) {
          super.updateVariable(id, value);
          this._timelineStatsDirty = true;
        }
        doEvaluate(context) {
          const {
            _motionEval: motionEval
          } = this;
          if (!motionEval) {
            return context.pushDefaultedPose();
          }
          return motionEval.sample(this._time / motionEval.duration, context);
        }
        _updateTimelineStats() {
          var _this$_motionEval$dur, _this$_motionEval;
          this._timelineStats.timeLineLength = (_this$_motionEval$dur = (_this$_motionEval = this._motionEval) == null ? void 0 : _this$_motionEval.duration) != null ? _this$_motionEval$dur : 0.0;
        }
      });
      _export("TransitionPreviewer", TransitionPreviewer = class TransitionPreviewer extends AnimationGraphPartialPreviewer {
        constructor(root) {
          super(root);
          this._time = 0.0;
          this._transitionDuration = 0.0;
          this._relativeDuration = false;
          this._exitConditionEnabled = false;
          this._exitCondition = 0.0;
          this._destinationStart = 0.0;
          this._relativeDestinationStart = false;
          this._source = null;
          this._target = null;
          this._timelineStatsDirty = true;
          this._timeLineStats = {
            timeLineLength: 0.0,
            sourceMotionStart: 0.0,
            sourceMotionRepeatCount: 0.0,
            sourceMotionDuration: 0.0,
            targetMotionStart: 0.0,
            targetMotionRepeatCount: 0.0,
            targetMotionDuration: 0.0,
            exitTimesStart: 0.0,
            exitTimesLength: 0.0,
            transitionDurationStart: 0.0,
            transitionDurationLength: 0.0
          };
        }
        destroy() {}
        get timelineStats() {
          if (this._timelineStatsDirty) {
            this._updateTimelineStats();
            this._timelineStatsDirty = false;
          }
          return this._timeLineStats;
        }
        setSourceMotion(motion) {
          this._source = super.createMotionEval(motion);
          this._timelineStatsDirty = true;
        }
        setTargetMotion(motion) {
          this._target = super.createMotionEval(motion);
          this._timelineStatsDirty = true;
        }
        setTransitionDuration(value) {
          this._transitionDuration = value;
          this._timelineStatsDirty = true;
        }
        setRelativeTransitionDuration(value) {
          this._relativeDuration = value;
          this._timelineStatsDirty = true;
        }
        calculateTransitionDurationFromTimelineLength(value) {
          assertIsNonNullable(this._source);
          return this._relativeDuration ? value / this._source.duration : value;
        }
        setExitTimes(value) {
          this._exitCondition = value;
          this._timelineStatsDirty = true;
        }
        setExitTimeEnabled(value) {
          this._exitConditionEnabled = value;
          this._timelineStatsDirty = true;
        }
        setDestinationStart(value) {
          this._destinationStart = value;
          this._timelineStatsDirty = true;
        }
        setRelativeDestinationStart(value) {
          this._relativeDestinationStart = value;
          this._timelineStatsDirty = true;
        }
        calculateExitTimesFromTimelineLength(value) {
          assertIsNonNullable(this._source);
          return value / this._source.duration;
        }
        updateVariable(id, value) {
          super.updateVariable(id, value);
          this._timelineStatsDirty = true;
        }

        /**
         * 
         * @param time Player time, in seconds.
         */
        setTime(time) {
          this._time = time;
        }
        doEvaluate(context) {
          const {
            _source: source,
            _target: target,
            _time: time,
            _exitCondition: exitCondition,
            _exitConditionEnabled: exitConditionEnabled,
            _transitionDuration: transitionDuration,
            _relativeDuration: relativeDuration,
            _destinationStart: destinationStart,
            _relativeDestinationStart: relativeDestinationStart
          } = this;
          if (!source || !target) {
            return context.pushDefaultedPose();
          }
          const sourceDuration = source.duration;
          const targetDuration = target.duration;
          const exitTimeAbsolute = exitConditionEnabled ? sourceDuration * exitCondition : 0.0;
          const transitionDurationAbsolute = relativeDuration ? sourceDuration * transitionDuration : transitionDuration;
          const destinationStartAbsolute = relativeDestinationStart ? destinationStart * targetDuration : destinationStart;
          if (time < exitTimeAbsolute) {
            return source.sample(time / sourceDuration, context);
          } else {
            const transitionTime = time - exitTimeAbsolute;
            if (transitionTime > transitionDurationAbsolute) {
              return target.sample((destinationStartAbsolute + transitionTime) / targetDuration, context);
            } else {
              const transitionRatio = transitionTime / transitionDurationAbsolute;
              const sourcePose = source.sample(time / sourceDuration, context);
              const targetPose = target.sample(transitionTime / targetDuration, context);
              blendPoseInto(sourcePose, targetPose, transitionRatio);
              context.popPose();
              return sourcePose;
            }
          }
        }
        _updateTimelineStats() {
          const {
            _source: source,
            _target: target,
            _exitCondition: exitCondition,
            _exitConditionEnabled: exitConditionEnabled,
            _transitionDuration: transitionDuration,
            _relativeDuration: relativeDuration,
            _destinationStart: destinationStart,
            _relativeDestinationStart: relativeDestinationStart
          } = this;
          assertIsNonNullable(source);
          assertIsNonNullable(target);
          const sourceMotionDuration = source.duration;
          const exitTimeRelative = exitConditionEnabled ? exitCondition : 0.0;
          const exitTimeAbsolute = sourceMotionDuration * exitTimeRelative;
          const transitionDurationAbsolute = relativeDuration ? sourceMotionDuration * transitionDuration : transitionDuration;
          const sourceMotionStart = 0.0;
          const sourceMotionLiveTime = exitTimeAbsolute + transitionDurationAbsolute;
          const sourceMotionRepeatCount = sourceMotionLiveTime / sourceMotionDuration;
          const targetMotionDuration = target.duration;
          const destinationStartAbsolute = relativeDestinationStart ? targetMotionDuration * destinationStart : destinationStart;
          const targetMotionStart = exitTimeAbsolute - destinationStartAbsolute;
          const targetMotionLiveTime = Math.max(transitionDurationAbsolute, targetMotionDuration);
          const targetMotionRepeatCount = targetMotionLiveTime / targetMotionDuration;
          const timeLineLength = exitTimeAbsolute + targetMotionLiveTime;
          const {
            _timeLineStats: timeLineStats
          } = this;
          timeLineStats.timeLineLength = timeLineLength;
          timeLineStats.sourceMotionStart = sourceMotionStart;
          timeLineStats.sourceMotionRepeatCount = sourceMotionRepeatCount;
          timeLineStats.sourceMotionDuration = sourceMotionDuration;
          timeLineStats.targetMotionStart = targetMotionStart;
          timeLineStats.targetMotionRepeatCount = targetMotionRepeatCount;
          timeLineStats.targetMotionDuration = targetMotionDuration;
          timeLineStats.exitTimesStart = 0.0;
          timeLineStats.exitTimesLength = exitTimeAbsolute;
          timeLineStats.transitionDurationStart = exitTimeAbsolute;
          timeLineStats.transitionDurationLength = transitionDurationAbsolute;
        }
      });
      MotionEvalRecord = class MotionEvalRecord {
        constructor(motion) {
          this._motion = void 0;
          this._eval = null;
          this._port = null;
          this._motion = motion;
        }
        get motion() {
          return this._motion;
        }
        get duration() {
          var _this$_eval$duration, _this$_eval;
          return (_this$_eval$duration = (_this$_eval = this._eval) == null ? void 0 : _this$_eval.duration) != null ? _this$_eval$duration : 0.0;
        }
        sample(progress, context) {
          var _this$_port$evaluate, _this$_port;
          return (_this$_port$evaluate = (_this$_port = this._port) == null ? void 0 : _this$_port.evaluate(progress, context)) != null ? _this$_port$evaluate : context.pushDefaultedPose();
        }
        getWeightsRecursive(weight) {
          if (!this._eval) {
            return [];
          }
          const getWeightsRecursive = function* (motionEval, weight) {
            if (typeof motionEval.runtimeId !== 'undefined') {
              yield [motionEval.runtimeId, weight];
            }
            if (motionEval instanceof AnimationBlendEval) {
              const nChild = motionEval.childCount;
              for (let iChild = 0; iChild < nChild; ++iChild) {
                const childMotionEval = motionEval.getChildMotionEval(iChild);
                const childWeight = motionEval.getChildWeight(iChild);
                if (childMotionEval) {
                  for (const child of getWeightsRecursive(childMotionEval, childWeight)) {
                    yield child;
                  }
                }
              }
            }
            return;
          };
          return getWeightsRecursive(this._eval, weight);
        }
        rebind(bindContext) {
          const motionEval = this._motion[createEval](bindContext, true);
          if (!motionEval) {
            return;
          }
          this._eval = motionEval;
          this._port = motionEval.createPort();
        }
      };
    }
  };
});