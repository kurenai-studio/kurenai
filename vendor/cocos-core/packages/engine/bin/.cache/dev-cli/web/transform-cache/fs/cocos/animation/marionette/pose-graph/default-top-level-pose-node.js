System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/default-top-level-pose-node.js", ["../../../core/index.js", "../../core/pose.js", "../state-machine/state-machine-eval.js", "./pose-node.js", "./motion-sync/runtime-motion-sync.js", "./stash/runtime-stash.js"], function (_export, _context2) {
  "use strict";

  var assertIsTrue, applyDeltaPose, blendPoseInto, TopLevelStateMachineEvaluation, PoseNode, RuntimeMotionSyncManager, RuntimeStashManager, DefaultTopLevelPoseNode, LayerEvaluationRecord;
  _export("DefaultTopLevelPoseNode", void 0);
  return {
    setters: [function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }, function (_corePoseJs) {
      applyDeltaPose = _corePoseJs.applyDeltaPose;
      blendPoseInto = _corePoseJs.blendPoseInto;
    }, function (_stateMachineStateMachineEvalJs) {
      TopLevelStateMachineEvaluation = _stateMachineStateMachineEvalJs.TopLevelStateMachineEvaluation;
    }, function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
    }, function (_motionSyncRuntimeMotionSyncJs) {
      RuntimeMotionSyncManager = _motionSyncRuntimeMotionSyncJs.RuntimeMotionSyncManager;
    }, function (_stashRuntimeStashJs) {
      RuntimeStashManager = _stashRuntimeStashJs.RuntimeStashManager;
    }],
    execute: function () {
      _export("DefaultTopLevelPoseNode", DefaultTopLevelPoseNode = class DefaultTopLevelPoseNode extends PoseNode {
        constructor(graph, bindingContext, poseStashAllocator) {
          super();
          this._layerRecords = void 0;
          const layerEvaluationRecords = graph.layers.map(layer => {
            const record = new LayerEvaluationRecord(layer, bindingContext, poseStashAllocator);
            return record;
          });
          this._layerRecords = layerEvaluationRecords;
        }
        get layerCount() {
          return this._layerRecords.length;
        }
        reenter() {
          // Default top level pose is meant to be non-reenter-able.
          // Do nothing here.
        }
        bind(_context) {
          // `LayerEvaluationRecord` should have already been bound.
          // Do nothing here.
        }
        settle(context) {
          const {
            _layerRecords: layerRecords
          } = this;
          const nLayers = layerRecords.length;
          for (let iLayer = 0; iLayer < nLayers; ++iLayer) {
            layerRecords[iLayer].settle(context);
          }
        }
        getLayerWeight(layerIndex) {
          assertIsTrue(layerIndex >= 0 && layerIndex < this._layerRecords.length, `Invalid layer index`);
          return this._layerRecords[layerIndex].weight;
        }
        setLayerWeight(layerIndex, weight) {
          assertIsTrue(layerIndex >= 0 && layerIndex < this._layerRecords.length, `Invalid layer index`);
          this._layerRecords[layerIndex].weight = weight;
        }
        getLayerTopLevelStateMachineEvaluation(layerIndex) {
          return this._layerRecords[layerIndex].stateMachineEvaluation;
        }
        overrideClips(context) {
          const {
            _layerRecords: layerRecords
          } = this;
          const nLayers = layerRecords.length;
          for (let iLayer = 0; iLayer < nLayers; ++iLayer) {
            const layerRecord = layerRecords[iLayer];
            context._pushAdditiveFlag(layerRecord.additive);
            layerRecord.stateMachineEvaluation.overrideClips(context);
            context._popAdditiveFlag();
          }
        }
        doUpdate(context) {
          const {
            _layerRecords: layerRecords
          } = this;
          const nLayers = layerRecords.length;
          for (let iLayer = 0; iLayer < nLayers; ++iLayer) {
            layerRecords[iLayer].update(context);
          }
        }
        doEvaluate(context) {
          const finalPose = context.pushDefaultedPose();
          const {
            _layerRecords: layerRecords
          } = this;
          const nLayers = layerRecords.length;
          for (let iLayer = 0; iLayer < nLayers; ++iLayer) {
            const layer = layerRecords[iLayer];
            const layerPose = layer.stateMachineEvaluation.evaluate(context);
            const layerActualWeight = layer.weight * layer.stateMachineEvaluation.passthroughWeight;
            const {
              transformFilter
            } = layer;
            if (layer.additive) {
              applyDeltaPose(finalPose, layerPose, layerActualWeight, transformFilter);
            } else {
              blendPoseInto(finalPose, layerPose, layerActualWeight, transformFilter);
            }
            context.popPose();
            layer.postEvaluate();
          }
          return finalPose;
        }
      });
      LayerEvaluationRecord = class LayerEvaluationRecord {
        constructor(layer, bindingContext, poseStashAllocator) {
          var _layer$mask;
          this.additive = false;
          this.weight = 0.0;
          this._topLevelStateMachineEval = void 0;
          this._stashManager = void 0;
          this._motionSyncManager = void 0;
          this._mask = undefined;
          this.transformFilter = undefined;
          const stashManager = new RuntimeStashManager(poseStashAllocator);
          for (const [stashId, _] of layer.stashes()) {
            stashManager.addStash(stashId);
          }
          this._stashManager = stashManager;
          const motionSyncManager = new RuntimeMotionSyncManager();
          this._motionSyncManager = motionSyncManager;
          bindingContext._setLayerWideContextProperties(stashManager, motionSyncManager);
          for (const [stashId, stash] of layer.stashes()) {
            stashManager.setStash(stashId, stash, bindingContext);
          }
          this.weight = layer.weight;
          const additive = this.additive = layer.additive;
          this._mask = (_layer$mask = layer.mask) != null ? _layer$mask : undefined;
          bindingContext._pushAdditiveFlag(additive);
          this._topLevelStateMachineEval = new TopLevelStateMachineEvaluation(layer.stateMachine, layer.name, bindingContext);
          bindingContext._popAdditiveFlag();
          bindingContext._unsetLayerWideContextProperties();
        }
        get stateMachineEvaluation() {
          return this._topLevelStateMachineEval;
        }
        settle(context) {
          if (this._mask) {
            this.transformFilter = context.createTransformFilter(this._mask);
          }

          // Settle layer stashes.
          this._stashManager.settle(context);

          // Settle the top level state machine.
          this._topLevelStateMachineEval.settle(context);
        }
        update(context) {
          this.stateMachineEvaluation.update(context);
          this._motionSyncManager.sync();
        }
        postEvaluate() {
          // Reset stash resources.
          this._stashManager.reset();
        }
      };
    }
  };
});