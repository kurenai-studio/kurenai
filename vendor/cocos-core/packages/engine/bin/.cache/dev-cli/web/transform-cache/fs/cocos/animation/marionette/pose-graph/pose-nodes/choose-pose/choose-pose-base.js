System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/choose-pose/choose-pose-base.js", ["../../../../../../../virtual/internal%253Aconstants.js", "../../../../../core/data/decorators/index.js", "../../../../core/pose.js", "../../../../define.js", "../../pose-node.js", "../../../animation-graph-context.js", "../../decorator/node.js", "../../../../../core/index.js", "../../utils.js"], function (_export, _context) {
  "use strict";

  var DEBUG, ccclass, serializable, blendPoseInto, CLASS_NAME_PREFIX_ANIM, PoseNode, PoseTransformSpaceRequirement, AnimationGraphUpdateContextGenerator, poseGraphNodeHide, assertIsTrue, lerp, isIgnorableWeight, EvaluationRecord, ItemEvaluationRecord, _dec, _dec2, _class, _class2, _descriptor, _descriptor2, ZERO_ALTERING_DURATION_THRESHOLD, PoseNodeChoosePoseBase;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_corePoseJs) {
      blendPoseInto = _corePoseJs.blendPoseInto;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
      PoseTransformSpaceRequirement = _poseNodeJs.PoseTransformSpaceRequirement;
    }, function (_animationGraphContextJs) {
      AnimationGraphUpdateContextGenerator = _animationGraphContextJs.AnimationGraphUpdateContextGenerator;
    }, function (_decoratorNodeJs) {
      poseGraphNodeHide = _decoratorNodeJs.poseGraphNodeHide;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      lerp = _coreIndexJs.lerp;
    }, function (_utilsJs) {
      isIgnorableWeight = _utilsJs.isIgnorableWeight;
    }],
    execute: function () {
      ZERO_ALTERING_DURATION_THRESHOLD = 1e-5;
      _export("PoseNodeChoosePoseBase", PoseNodeChoosePoseBase = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeChoosePoseBase`), _dec2 = poseGraphNodeHide(), _dec(_class = _dec2(_class = (_class2 = class PoseNodeChoosePoseBase extends PoseNode {
        constructor(initialChoiceCount = 0) {
          super();
          _initializerDefineProperty(this, "_poses", _descriptor, this);
          _initializerDefineProperty(this, "_fadeInDurations", _descriptor2, this);
          this._updateContextGenerator = new AnimationGraphUpdateContextGenerator();
          this._evaluationRecord = undefined;
          this._poses.length = initialChoiceCount;
          this._poses.fill(null);
          this._fadeInDurations.length = initialChoiceCount;
          this._fadeInDurations.fill(0.0);
        }
        bind(context) {
          for (const pose of this._poses) {
            pose == null || pose.bind(context);
          }
          const evaluationRecord = new EvaluationRecord(this._poses.length, this.getChosenIndex());
          this._evaluationRecord = evaluationRecord;
        }
        settle(context) {
          for (const pose of this._poses) {
            pose == null || pose.settle(context);
          }
        }
        reenter() {
          for (const pose of this._poses) {
            pose == null || pose.reenter();
          }
        }
        doUpdate(context) {
          const {
            _poses: poses,
            _evaluationRecord: evaluationRecord
          } = this;
          assertIsTrue(evaluationRecord);

          // Update the record for weights.
          evaluationRecord.update(context.deltaTime, this.getChosenIndex(), this._fadeInDurations);

          // Don't have to update if all weights are zero.
          if (evaluationRecord.allWeightsAreZero()) {
            return;
          }
          const nPoses = poses.length;
          const {
            items
          } = evaluationRecord;
          assertIsTrue(items.length === nPoses);

          // Dispatch update requests to non-zero weighted items.
          for (let iPose = 0; iPose < nPoses; ++iPose) {
            const weight = items[iPose].weight;
            if (isIgnorableWeight(weight)) {
              continue;
            }
            const pose = poses[iPose];
            const itemUpdateContext = this._updateContextGenerator.generate(context.deltaTime, context.indicativeWeight * weight);
            pose == null || pose.update(itemUpdateContext);
          }
        }
        doEvaluate(context) {
          const {
            _poses: poses,
            _evaluationRecord: evaluationRecord
          } = this;
          assertIsTrue(evaluationRecord);
          const spaceRequirement = PoseTransformSpaceRequirement.LOCAL;
          const nPoses = poses.length;
          const {
            items
          } = evaluationRecord;
          assertIsTrue(items.length === poses.length);
          let finalPose = null;
          if (!evaluationRecord.allWeightsAreZero()) {
            let sumWeight = 0.0;
            for (let iInputPose = 0; iInputPose < nPoses; ++iInputPose) {
              var _poses$iInputPose;
              const inputPoseWeight = evaluationRecord.items[iInputPose].weight;
              if (isIgnorableWeight(inputPoseWeight)) {
                continue;
              }
              const inputPose = (_poses$iInputPose = poses[iInputPose]) == null ? void 0 : _poses$iInputPose.evaluate(context, PoseTransformSpaceRequirement.LOCAL);
              if (!inputPose) {
                continue;
              }
              sumWeight += inputPoseWeight;
              if (!finalPose) {
                finalPose = inputPose;
              } else {
                if (sumWeight) {
                  const t = inputPoseWeight / sumWeight;
                  blendPoseInto(finalPose, inputPose, t);
                }
                context.popPose();
              }
            }
          }
          if (finalPose) {
            return finalPose;
          }
          return PoseNodeChoosePoseBase.evaluateDefaultPose(context, spaceRequirement);
        }
        getChosenIndex() {
          return 0;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_poses", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_fadeInDurations", [serializable], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class) || _class));
      EvaluationRecord = class EvaluationRecord {
        constructor(itemCount, initialChosenIndex) {
          this._items = void 0;
          this._chosenPoseIndex = -1;
          this._elapsedTransitionTime = 0.0;
          this._blendingDuration = 0.0;
          const items = Array.from({
            length: itemCount
          }, () => new ItemEvaluationRecord());
          if (initialChosenIndex >= 0 && initialChosenIndex < itemCount) {
            items[initialChosenIndex].selfSourceWeight = 1.0;
            items[initialChosenIndex].selfTargetWeight = 1.0;
            items[initialChosenIndex].weight = 1.0;
          }
          this._items = items;
        }
        get items() {
          return this._items;
        }
        allWeightsAreZero() {
          return this._chosenPoseIndex < 0;
        }
        update(deltaTime, newChoseIndex, fadeInDurations) {
          assertIsTrue(deltaTime >= 0.0);
          this._checkAlternation(newChoseIndex, fadeInDurations);
          if (this._chosenPoseIndex < 0) {
            return;
          }
          const {
            _elapsedTransitionTime: elapsedTransitionTime,
            _blendingDuration: blendingDuration,
            _items: items
          } = this;

          // There's no blending task.
          // #no-weights-update-if-done
          if (elapsedTransitionTime >= blendingDuration) {
            return;
          }
          const nPoses = items.length;
          let sumWeight = 0.0;
          let newUniformTransformRatio = 0.0;
          const remain = blendingDuration - elapsedTransitionTime;
          if (deltaTime > remain) {
            this._elapsedTransitionTime = blendingDuration;
            newUniformTransformRatio = 1.0;
          } else {
            this._elapsedTransitionTime += deltaTime;
            newUniformTransformRatio = this._elapsedTransitionTime / blendingDuration;
          }
          assertIsTrue(newUniformTransformRatio >= 0.0 && newUniformTransformRatio <= 1.0);
          for (let iPose = 0; iPose < nPoses; ++iPose) {
            const item = items[iPose];
            const selfWeight = lerp(item.selfSourceWeight, item.selfTargetWeight, newUniformTransformRatio);
            sumWeight += selfWeight;
            item.weight = selfWeight;
          }
          if (!isIgnorableWeight(sumWeight)) {
            for (let iPose = 0; iPose < nPoses; ++iPose) {
              const item = items[iPose];
              item.weight /= sumWeight;
            }
          } else if (DEBUG) {
            assertIsTrue(items.every(item => item.weight === 0.0));
          }
        }
        _checkAlternation(newChoseIndex, fadeInDurations) {
          const {
            _items: items,
            _chosenPoseIndex: oldChoseIndex
          } = this;
          const nPoses = items.length;
          if (!nPoses) {
            return;
          }

          // If no alternation happened, do nothing.
          if (newChoseIndex === oldChoseIndex) {
            return;
          }

          // If the new chose is invalid, do nothing. That means:
          // - if there's a valid chose before, that chose keeps not changed.
          // - otherwise, keep no chose state.
          if (newChoseIndex < 0 || newChoseIndex >= nPoses) {
            return;
          }

          // Otherwise, plan so that in new chosen pose's fade-in duration:
          // - new chosen pose starts transitioning to weight 1,
          // - other poses start transitioning to weight 0.

          const newFadeInDuration = Math.max(fadeInDurations[newChoseIndex], 0.0);
          // If the new altering duration is zero, directly fill the weights.
          // We do this since we treat `this._elapsedTransitionTime <= this._blendingDuration` as "done",
          // and then weights would not get not further update.
          // See line #no-weights-update-if-done .
          if (newFadeInDuration < ZERO_ALTERING_DURATION_THRESHOLD) {
            for (let iPose = 0; iPose < nPoses; ++iPose) {
              const item = items[iPose];
              if (iPose === newChoseIndex) {
                item.selfSourceWeight = 1.0;
                item.selfTargetWeight = 1.0;
                item.weight = 1.0;
              } else {
                item.selfSourceWeight = 0.0;
                item.selfTargetWeight = 0.0;
                item.weight = 0.0;
              }
            }
          } else {
            const oldUniformTransitionRatio = this._blendingDuration < ZERO_ALTERING_DURATION_THRESHOLD ? 1.0 : this._elapsedTransitionTime / this._blendingDuration;
            for (let iPose = 0; iPose < nPoses; ++iPose) {
              const item = items[iPose];
              // Reset starting weight as current weight.
              // Don't use `item.weight` since it's absolute weight.
              item.selfSourceWeight = lerp(item.selfSourceWeight, item.selfTargetWeight, oldUniformTransitionRatio);
              if (iPose === newChoseIndex) {
                item.selfTargetWeight = 1.0;
              } else {
                item.selfTargetWeight = 0.0;
              }
            }
          }
          this._chosenPoseIndex = newChoseIndex;
          this._elapsedTransitionTime = 0.0;
          this._blendingDuration = newFadeInDuration;
        }
      };
      ItemEvaluationRecord = class ItemEvaluationRecord {
        constructor() {
          this.selfSourceWeight = 0.0;
          this.selfTargetWeight = 0.0;
          /** Absolute weight in node. Used by node. */
          this.weight = 0.0;
        }
      };
    }
  };
});