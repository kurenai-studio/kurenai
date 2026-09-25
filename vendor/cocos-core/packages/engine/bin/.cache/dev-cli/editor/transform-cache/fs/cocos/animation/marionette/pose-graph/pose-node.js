System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-node.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/index.js", "../../../core/data/decorators/index.js", "../../core/pose.js", "../../define.js", "./foundation/pose-graph-node.js"], function (_export, _context) {
  "use strict";

  var TEST, assertIsTrue, ccenum, ccclass, PoseTransformSpace, CLASS_NAME_PREFIX_ANIM, PoseGraphNode, _dec, _class, PoseTransformSpaceRequirement, POSE_NODE_EVALUATION_STACK_ORDER_DEBUG_ENABLED, PoseNode;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreIndexJs) {
      assertIsTrue = _coreIndexJs.assertIsTrue;
      ccenum = _coreIndexJs.ccenum;
    }, function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
    }, function (_corePoseJs) {
      PoseTransformSpace = _corePoseJs.PoseTransformSpace;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_foundationPoseGraphNodeJs) {
      PoseGraphNode = _foundationPoseGraphNodeJs.PoseGraphNode;
    }],
    execute: function () {
      _export("PoseTransformSpaceRequirement", PoseTransformSpaceRequirement = /*#__PURE__*/function (PoseTransformSpaceRequirement) {
        PoseTransformSpaceRequirement[PoseTransformSpaceRequirement["NO"] = 0] = "NO";
        PoseTransformSpaceRequirement[PoseTransformSpaceRequirement["LOCAL"] = 1] = "LOCAL";
        PoseTransformSpaceRequirement[PoseTransformSpaceRequirement["COMPONENT"] = 2] = "COMPONENT";
        return PoseTransformSpaceRequirement;
      }({}));
      ccenum(PoseTransformSpaceRequirement);
      POSE_NODE_EVALUATION_STACK_ORDER_DEBUG_ENABLED = !!TEST;
      /**
       * Base class of all pose nodes.
       *
       * Pose nodes are nodes in pose graph that yields pose objects.
       */
      _export("PoseNode", PoseNode = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNode`), _dec(_class = class PoseNode extends PoseGraphNode {
        constructor(...args) {
          super(...args);
          this._dependencyEvaluation = undefined;
        }
        /**
         * Starts the bind stage on this pose node.
         *
         * @param context The bind context.
         *
         * @note Subclasses shall implement this method to perform some preparing works
         * and invoke this method on dependant pose nodes.
         */
        /**
         * Starts the settle stage on this pose node.
         *
         * @param context The settle context.
         *
         * @note Subclasses shall implement this method to perform some post-binding works
         * and invoke this method on dependant pose nodes.
         *
         */
        /**
         * Reenter this pose nodes.
         *
         * @note Subclasses shall implement this method to perform some state resetting works.
         * and invoke this method on dependant pose nodes.
         *
         * This method would be fired if other pose nodes that depends on this pose node requests a "reset".
         * For example, if this pose node is as a node of a pose state.
         * When this state is activated, this method is invoked.
         */
        /**
         * Perform the update stage on this pose node.
         * This method will directly forward to call `this.doUpdate`.
         *
         * @param context The update context.
         *
         * @note Subclasses shall not override this method and should override `doUpdate` instead.
         */
        update(context) {
          var _this$_dependencyEval;
          (_this$_dependencyEval = this._dependencyEvaluation) == null || _this$_dependencyEval.evaluate();
          this.doUpdate(context);
        }

        /**
         * Evaluates this pose node.
         * This method will directly forward to call `this.doEvaluate`.
         *
         * @param context The evaluation context.
         *
         * @note Subclasses shall not override this method and should override `doEvaluate` instead.
         */
        evaluate(context, poseTransformSpaceRequirement) {
          let stackSizeBefore;
          if (POSE_NODE_EVALUATION_STACK_ORDER_DEBUG_ENABLED) {
            stackSizeBefore = context._stackSize_debugging;
          }
          const pose = this.doEvaluate(context);
          if (POSE_NODE_EVALUATION_STACK_ORDER_DEBUG_ENABLED) {
            // The stack should certainly increase 1.
            assertIsTrue(context._stackSize_debugging === stackSizeBefore + 1, `PoseNode.doEvaluate() should certainly push a pose node onto the stack and return it.`);
            // The returned pose should be the increased pose, that's,
            // can not return a already-popped pose.
            assertIsTrue(context._isStackTopPose_debugging(pose), `PoseNode.doEvaluate() should certainly push a pose node onto the stack and return it.`);
          }
          const currentSpace = pose._poseTransformSpace;
          switch (poseTransformSpaceRequirement) {
            default:
              assertIsTrue(false);
            // fallthrough
            case PoseTransformSpaceRequirement.NO:
              break;
            case PoseTransformSpaceRequirement.LOCAL:
              {
                if (currentSpace === PoseTransformSpace.COMPONENT) {
                  context._poseTransformsSpaceComponentToLocal(pose);
                }
                assertIsTrue(pose._poseTransformSpace === PoseTransformSpace.LOCAL);
                break;
              }
            case PoseTransformSpaceRequirement.COMPONENT:
              {
                if (currentSpace === PoseTransformSpace.LOCAL) {
                  context._poseTransformsSpaceLocalToComponent(pose);
                }
                assertIsTrue(pose._poseTransformSpace === PoseTransformSpace.COMPONENT);
                break;
              }
          }
          return pose;
        }
        static evaluateDefaultPose(context, poseTransformSpaceRequirement) {
          switch (poseTransformSpaceRequirement) {
            default:
              assertIsTrue(false);
            // fallthrough
            case PoseTransformSpaceRequirement.NO:
            case PoseTransformSpaceRequirement.LOCAL:
              return context.pushDefaultedPose();
            case PoseTransformSpaceRequirement.COMPONENT:
              return context.pushDefaultedPoseInComponentSpace();
          }
        }

        /** @internal */
        _setDependencyEvaluation(dependency) {
          this._dependencyEvaluation = dependency;
        }

        /**
         * Implement this method to performs the update stage on this pose node.
         *
         * @param context The update context.
         *
         * @note Subclasses shall implement this method to perform some updating works.
         * and invoke `this.update` on dependant pose nodes.
         */

        /**
         * Implement this method to evaluate this pose node.
         *
         * @param context The evaluation context.
         *
         * @returns The result pose.
         */

        /**
         * TODO: some nodes access dependencies in reenter(). See: cocos/cocos-engine#15305
         */
        _forceEvaluateEvaluation() {
          var _this$_dependencyEval2;
          (_this$_dependencyEval2 = this._dependencyEvaluation) == null || _this$_dependencyEval2.evaluate();
        }
      }) || _class));
    }
  };
});