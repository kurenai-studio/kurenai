System.register("q-bundled:///fs/cocos/animation/marionette/graph-eval.js", ["../../../../virtual/internal%253Aconstants.js", "./variable/index.js", "../../core/index.js", "../../3d/skeletal-animation/limits.js", "./animation-graph-context.js", "./pose-graph/pose-node.js", "./pose-graph/default-top-level-pose-node.js"], function (_export, _context) {
  "use strict";

  var DEBUG, TriggerResetMode, createInstanceTag, VarInstanceTrigger, assertIsTrue, MAX_ANIMATION_LAYER, AnimationGraphBindingContext, AnimationGraphPoseLayoutMaintainer, defaultTransformsTag, LayoutChangeFlag, AuxiliaryCurveRegistry, AnimationGraphUpdateContextGenerator, AnimationGraphSettleContext, DeferredPoseStashAllocator, PoseTransformSpaceRequirement, DefaultTopLevelPoseNode, AnimationGraphEval;
  _export("AnimationGraphEval", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_variableIndexJs) {
      TriggerResetMode = _variableIndexJs.TriggerResetMode;
      createInstanceTag = _variableIndexJs.createInstanceTag;
      VarInstanceTrigger = _variableIndexJs.VarInstanceTrigger;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }, function (_dSkeletalAnimationLimitsJs) {
      MAX_ANIMATION_LAYER = _dSkeletalAnimationLimitsJs.MAX_ANIMATION_LAYER;
    }, function (_animationGraphContextJs) {
      AnimationGraphBindingContext = _animationGraphContextJs.AnimationGraphBindingContext;
      AnimationGraphPoseLayoutMaintainer = _animationGraphContextJs.AnimationGraphPoseLayoutMaintainer;
      defaultTransformsTag = _animationGraphContextJs.defaultTransformsTag;
      LayoutChangeFlag = _animationGraphContextJs.LayoutChangeFlag;
      AuxiliaryCurveRegistry = _animationGraphContextJs.AuxiliaryCurveRegistry;
      AnimationGraphUpdateContextGenerator = _animationGraphContextJs.AnimationGraphUpdateContextGenerator;
      AnimationGraphSettleContext = _animationGraphContextJs.AnimationGraphSettleContext;
      DeferredPoseStashAllocator = _animationGraphContextJs.DeferredPoseStashAllocator;
    }, function (_poseGraphPoseNodeJs) {
      PoseTransformSpaceRequirement = _poseGraphPoseNodeJs.PoseTransformSpaceRequirement;
    }, function (_poseGraphDefaultTopLevelPoseNodeJs) {
      DefaultTopLevelPoseNode = _poseGraphDefaultTopLevelPoseNodeJs.DefaultTopLevelPoseNode;
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
      _export("AnimationGraphEval", AnimationGraphEval = class AnimationGraphEval {
        constructor(graph, root, controller, clipOverrides) {
          this._currentTransitionCache = {
            duration: 0.0,
            time: 0.0
          };
          this._rootPoseNode = void 0;
          this._varInstances = {};
          this._hasAutoTrigger = false;
          this._auxiliaryCurveRegistry = new AuxiliaryCurveRegistry();
          this._poseLayoutMaintainer = void 0;
          this._bindingContext = void 0;
          this._settleContext = void 0;
          this._rootUpdateContextGenerator = new AnimationGraphUpdateContextGenerator();
          if (DEBUG) {
            if (graph.layers.length >= MAX_ANIMATION_LAYER) {
              throw new Error(`Max layer count exceeds. ` + `Allowed: ${MAX_ANIMATION_LAYER}, actual: ${graph.layers.length}`);
            }
          }
          for (const [name, variable] of graph.variables) {
            const varInstance = variable[createInstanceTag]();
            this._varInstances[name] = varInstance;
            if (varInstance instanceof VarInstanceTrigger) {
              if (varInstance.resetMode === TriggerResetMode.NEXT_FRAME_OR_AFTER_CONSUMED) {
                this._hasAutoTrigger = true;
              }
            }
          }
          const poseLayoutMaintainer = new AnimationGraphPoseLayoutMaintainer(root, this._auxiliaryCurveRegistry);
          this._poseLayoutMaintainer = poseLayoutMaintainer;
          const bindingContext = new AnimationGraphBindingContext(root, poseLayoutMaintainer, this._varInstances, controller);
          bindingContext._setClipOverrides(clipOverrides != null ? clipOverrides : undefined);
          this._bindingContext = bindingContext;
          const settleContext = new AnimationGraphSettleContext(poseLayoutMaintainer);
          this._settleContext = settleContext;
          poseLayoutMaintainer.startBind();
          const poseStashAllocator = new DeferredPoseStashAllocator();
          this._poseStashAllocator = poseStashAllocator;
          this._rootPoseNode = new DefaultTopLevelPoseNode(graph, bindingContext, poseStashAllocator);
          this._root = root;
          this._initializeContexts();
        }
        destroy() {
          this._evaluationContext.destroy();
        }
        _destroyAfterException_debugging() {
          const stackSize = this._evaluationContext._stackSize_debugging;
          if (stackSize !== 0) {
            // Should only caused by exception.
            for (let i = 0; i < stackSize; ++i) {
              this._evaluationContext.popPose();
            }
          }
          this._evaluationContext.destroy();
        }
        get layerCount() {
          return this._rootPoseNode.layerCount;
        }
        update(deltaTime) {
          const {
            _evaluationContext: evaluationContext,
            _poseLayoutMaintainer: poseLayoutMaintainer,
            _rootUpdateContextGenerator: rootUpdateContextGenerator,
            _rootPoseNode: rootPoseNode
          } = this;
          const updateContext = rootUpdateContextGenerator.generate(deltaTime, 1.0);
          rootPoseNode.update(updateContext);
          const finalPose = rootPoseNode.evaluate(evaluationContext, PoseTransformSpaceRequirement.LOCAL);
          if (this._hasAutoTrigger) {
            const {
              _varInstances: varInstances
            } = this;
            for (const varName in varInstances) {
              const varInstance = varInstances[varName];
              if (varInstance instanceof VarInstanceTrigger && varInstance.resetMode === TriggerResetMode.NEXT_FRAME_OR_AFTER_CONSUMED) {
                varInstance.value = false;
              }
            }
          }
          poseLayoutMaintainer.apply(finalPose);
          evaluationContext.popPose();
          if (DEBUG) {
            assertIsTrue(evaluationContext.allocatedPoseCount === 0, `Pose leaked.`);
            assertIsTrue(this._poseStashAllocator.allocatedPoseCount === 0, `Pose leaked.`);
          }
        }
        getVariables() {
          return Object.entries(this._varInstances);
        }
        getCurrentStateStatus(layer) {
          return this._rootPoseNode.getLayerTopLevelStateMachineEvaluation(layer).getCurrentStateStatus();
        }
        getCurrentClipStatuses(layer) {
          return this._rootPoseNode.getLayerTopLevelStateMachineEvaluation(layer).getCurrentClipStatuses();
        }
        getCurrentTransition(layer) {
          const {
            _currentTransitionCache: currentTransition
          } = this;
          const isInTransition = this._rootPoseNode.getLayerTopLevelStateMachineEvaluation(layer).getCurrentTransition(currentTransition);
          return isInTransition ? currentTransition : null;
        }
        getNextStateStatus(layer) {
          return this._rootPoseNode.getLayerTopLevelStateMachineEvaluation(layer).getNextStateStatus();
        }
        getNextClipStatuses(layer) {
          return this._rootPoseNode.getLayerTopLevelStateMachineEvaluation(layer).getNextClipStatuses();
        }
        getValue(name) {
          const varInstance = this._varInstances[name];
          if (!varInstance) {
            return undefined;
          } else {
            return varInstance.value;
          }
        }
        setValue(name, value) {
          const varInstance = this._varInstances[name];
          if (!varInstance) {
            return;
          }
          varInstance.value = value;
        }
        getLayerWeight(layerIndex) {
          return this._rootPoseNode.getLayerWeight(layerIndex);
        }
        setLayerWeight(layerIndex, weight) {
          this._rootPoseNode.setLayerWeight(layerIndex, weight);
        }
        overrideClips(overrides) {
          const {
            _poseLayoutMaintainer: poseLayoutMaintainer
          } = this;
          poseLayoutMaintainer.startBind();
          this._bindingContext._setClipOverrides(overrides);
          this._rootPoseNode.overrideClips(this._bindingContext);
          this._updateAfterPossiblePoseLayoutChange();
        }
        getAuxiliaryCurveValue(curveName) {
          return this._auxiliaryCurveRegistry.get(curveName);
        }
        _initializeContexts() {
          const {
            _poseLayoutMaintainer: poseLayoutMaintainer
          } = this;

          // Ignore in initialization.
          // eslint-disable-next-line no-void
          void poseLayoutMaintainer.endBind();
          this._createOrUpdateTransformFilters();
          const evaluationContext = poseLayoutMaintainer.createEvaluationContext();
          this._evaluationContext = evaluationContext;

          // Capture the default transforms.
          poseLayoutMaintainer.fetchDefaultTransforms(evaluationContext[defaultTransformsTag]);
          poseLayoutMaintainer.resetPoseStashAllocator(this._poseStashAllocator);
        }
        _updateAfterPossiblePoseLayoutChange() {
          const {
            _poseLayoutMaintainer: poseLayoutMaintainer
          } = this;
          const layoutChangeFlags = poseLayoutMaintainer.endBind();

          // Nothing changed, this should be the commonest case in real world.
          if (layoutChangeFlags === 0) {
            return;
          }

          // No matter count or order changed, we should update the transform filters.
          if (layoutChangeFlags & LayoutChangeFlag.TRANSFORM_COUNT || layoutChangeFlags & LayoutChangeFlag.TRANSFORM_ORDER) {
            this._createOrUpdateTransformFilters();
          }

          // Either transform count or auxiliary curve count changed, we should recreate the eval context.
          let evaluationContextRecreated = false;
          if (layoutChangeFlags & LayoutChangeFlag.TRANSFORM_COUNT || layoutChangeFlags & LayoutChangeFlag.AUXILIARY_CURVE_COUNT) {
            const evaluationContext = poseLayoutMaintainer.createEvaluationContext();
            this._evaluationContext.destroy();
            this._evaluationContext = evaluationContext;
            evaluationContextRecreated = true;
            poseLayoutMaintainer.resetPoseStashAllocator(this._poseStashAllocator);
          }

          // If the eval context was recreated or the layout has changed, we should update the default transforms.
          if (evaluationContextRecreated || layoutChangeFlags & LayoutChangeFlag.TRANSFORM_COUNT || layoutChangeFlags & LayoutChangeFlag.TRANSFORM_ORDER) {
            poseLayoutMaintainer.fetchDefaultTransforms(this._evaluationContext[defaultTransformsTag]);
          }
        }
        _createOrUpdateTransformFilters() {
          this._rootPoseNode.settle(this._settleContext);
        }
      });
    }
  };
});