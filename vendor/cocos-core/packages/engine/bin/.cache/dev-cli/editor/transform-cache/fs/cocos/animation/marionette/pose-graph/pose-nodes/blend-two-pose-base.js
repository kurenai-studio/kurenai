System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/blend-two-pose-base.js", ["../../../../core/data/decorators/index.js", "../../../define.js", "../pose-node.js", "../decorator/input.js", "../../animation-graph-context.js", "../decorator/node.js", "../foundation/type-system.js"], function (_export, _context) {
  "use strict";

  var ccclass, range, serializable, CLASS_NAME_PREFIX_ANIM, PoseNode, PoseTransformSpaceRequirement, input, AnimationGraphUpdateContextGenerator, poseGraphNodeHide, PoseGraphType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, PoseNodeBlendTwoPoseBase;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
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
      poseGraphNodeHide = _decoratorNodeJs.poseGraphNodeHide;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }],
    execute: function () {
      _export("PoseNodeBlendTwoPoseBase", PoseNodeBlendTwoPoseBase = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeBlendTwoPoseBase`), _dec2 = poseGraphNodeHide(true), _dec3 = input({
        type: PoseGraphType.POSE
      }), _dec4 = input({
        type: PoseGraphType.POSE
      }), _dec5 = input({
        type: PoseGraphType.FLOAT
      }), _dec6 = range([0.0, 1.0, 0.01]), _dec(_class = _dec2(_class = (_class2 = class PoseNodeBlendTwoPoseBase extends PoseNode {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "pose0", _descriptor, this);
          _initializerDefineProperty(this, "pose1", _descriptor2, this);
          _initializerDefineProperty(this, "ratio", _descriptor3, this);
          this._updateContextGenerator = new AnimationGraphUpdateContextGenerator();
        }
        bind(context) {
          var _this$pose, _this$pose2;
          (_this$pose = this.pose0) == null || _this$pose.bind(context);
          (_this$pose2 = this.pose1) == null || _this$pose2.bind(context);
        }
        settle(context) {
          var _this$pose3, _this$pose4;
          (_this$pose3 = this.pose0) == null || _this$pose3.settle(context);
          (_this$pose4 = this.pose1) == null || _this$pose4.settle(context);
        }
        reenter() {
          var _this$pose5, _this$pose6;
          (_this$pose5 = this.pose0) == null || _this$pose5.reenter();
          (_this$pose6 = this.pose1) == null || _this$pose6.reenter();
        }
        doUpdate(context) {
          const {
            pose0,
            pose1,
            _updateContextGenerator: updateContextGenerator,
            ratio
          } = this;
          {
            const updateContext = updateContextGenerator.generate(context.deltaTime, context.indicativeWeight * (1.0 - ratio));
            pose0 == null || pose0.update(updateContext);
          }
          {
            const updateContext = updateContextGenerator.generate(context.deltaTime, context.indicativeWeight * ratio);
            pose1 == null || pose1.update(updateContext);
          }
        }
        doEvaluate(context) {
          var _this$pose0$evaluate, _this$pose7, _this$pose1$evaluate, _this$pose8;
          const spaceRequirement = PoseTransformSpaceRequirement.LOCAL;
          if (!this.pose0 || !this.pose1) {
            return PoseNodeBlendTwoPoseBase.evaluateDefaultPose(context, spaceRequirement);
          }
          const pose0 = (_this$pose0$evaluate = (_this$pose7 = this.pose0) == null ? void 0 : _this$pose7.evaluate(context, spaceRequirement)) != null ? _this$pose0$evaluate : PoseNodeBlendTwoPoseBase.evaluateDefaultPose(context, spaceRequirement);
          const pose1 = (_this$pose1$evaluate = (_this$pose8 = this.pose1) == null ? void 0 : _this$pose8.evaluate(context, spaceRequirement)) != null ? _this$pose1$evaluate : PoseNodeBlendTwoPoseBase.evaluateDefaultPose(context, spaceRequirement);
          this.doBlend(pose0, pose1, this.ratio);
          context.popPose();
          return pose0;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "pose0", [serializable, _dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "pose1", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "ratio", [serializable, _dec5, _dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _class2)) || _class) || _class));
    }
  };
});