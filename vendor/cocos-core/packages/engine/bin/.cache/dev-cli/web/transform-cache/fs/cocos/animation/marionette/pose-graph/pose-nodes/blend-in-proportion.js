System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/blend-in-proportion.js", ["../../../../core/data/decorators/index.js", "../../../core/pose.js", "../../../define.js", "../pose-node.js", "../decorator/input.js", "../../animation-graph-context.js", "../decorator/node.js", "./menu-common.js", "../foundation/type-system.js", "../utils.js"], function (_export, _context) {
  "use strict";

  var ccclass, range, serializable, blendPoseInto, CLASS_NAME_PREFIX_ANIM, PoseNode, PoseTransformSpaceRequirement, input, AnimationGraphUpdateContextGenerator, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND, PoseGraphType, isIgnorableWeight, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, PoseNodeBlendInProportion;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_corePoseJs) {
      blendPoseInto = _corePoseJs.blendPoseInto;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
      PoseTransformSpaceRequirement = _poseNodeJs.PoseTransformSpaceRequirement;
    }, function (_decoratorInputJs) {
      input = _decoratorInputJs.input;
    }, function (_animationGraphContextJs) {
      AnimationGraphUpdateContextGenerator = _animationGraphContextJs.AnimationGraphUpdateContextGenerator;
    }, function (_decoratorNodeJs) {
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuCommonJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND = _menuCommonJs.POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }, function (_utilsJs) {
      isIgnorableWeight = _utilsJs.isIgnorableWeight;
    }],
    execute: function () {
      _export("PoseNodeBlendInProportion", PoseNodeBlendInProportion = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeBlendInProportion`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND), _dec3 = poseGraphNodeAppearance({
        themeColor: '#72A869'
      }), _dec4 = input({
        type: PoseGraphType.POSE,
        arraySyncGroup: 'blend-item'
      }), _dec5 = input({
        type: PoseGraphType.FLOAT,
        arraySyncGroup: 'blend-item',
        arraySyncGroupFollower: true
      }), _dec6 = range([0.0, Number.POSITIVE_INFINITY]), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class PoseNodeBlendInProportion extends PoseNode {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "poses", _descriptor, this);
          _initializerDefineProperty(this, "proportions", _descriptor2, this);
          this._updateContextGenerator = new AnimationGraphUpdateContextGenerator();
        }
        bind(context) {
          for (const pose of this.poses) {
            pose == null || pose.bind(context);
          }
        }
        settle(context) {
          for (const pose of this.poses) {
            pose == null || pose.settle(context);
          }
        }
        reenter() {
          for (const pose of this.poses) {
            pose == null || pose.reenter();
          }
        }
        doUpdate(context) {
          const {
            _updateContextGenerator: updateContextGenerator
          } = this;
          const nInputPoses = this.poses.length;
          for (let iInputPose = 0; iInputPose < nInputPoses; ++iInputPose) {
            var _this$poses$iInputPos;
            const inputPoseWeight = this.proportions[iInputPose];
            if (isIgnorableWeight(inputPoseWeight)) {
              continue;
            }
            const inputPoseUpdateContext = updateContextGenerator.generate(context.deltaTime, context.indicativeWeight * inputPoseWeight);
            (_this$poses$iInputPos = this.poses[iInputPose]) == null || _this$poses$iInputPos.update(inputPoseUpdateContext);
          }
        }
        doEvaluate(context) {
          const nInputPoses = this.poses.length;
          let sumWeight = 0.0;
          let finalPose = null;
          for (let iInputPose = 0; iInputPose < nInputPoses; ++iInputPose) {
            var _this$poses$iInputPos2;
            const inputPoseWeight = this.proportions[iInputPose];
            if (isIgnorableWeight(inputPoseWeight)) {
              continue;
            }
            const inputPose = (_this$poses$iInputPos2 = this.poses[iInputPose]) == null ? void 0 : _this$poses$iInputPos2.evaluate(context, PoseTransformSpaceRequirement.LOCAL);
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
          if (finalPose) {
            return finalPose;
          }

          // TODO: cause wired behavior in additive layer.
          return context.pushDefaultedPose();
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "poses", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "proportions", [serializable, _dec5, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});