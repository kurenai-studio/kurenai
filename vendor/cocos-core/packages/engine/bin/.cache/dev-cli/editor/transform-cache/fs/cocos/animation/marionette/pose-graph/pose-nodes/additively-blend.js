System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/additively-blend.js", ["../../../../core/data/decorators/index.js", "../../../core/pose.js", "../../../define.js", "../decorator/node.js", "./menu-common.js", "../pose-node.js", "../decorator/input.js", "../foundation/type-system.js"], function (_export, _context) {
  "use strict";

  var ccclass, range, serializable, applyDeltaPose, CLASS_NAME_PREFIX_ANIM, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND, PoseNode, PoseTransformSpaceRequirement, input, PoseGraphType, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, PoseNodeAdditivelyBlend;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      range = _coreDataDecoratorsIndexJs.range;
      serializable = _coreDataDecoratorsIndexJs.serializable;
    }, function (_corePoseJs) {
      applyDeltaPose = _corePoseJs.applyDeltaPose;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_decoratorNodeJs) {
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuCommonJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND = _menuCommonJs.POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND;
    }, function (_poseNodeJs) {
      PoseNode = _poseNodeJs.PoseNode;
      PoseTransformSpaceRequirement = _poseNodeJs.PoseTransformSpaceRequirement;
    }, function (_decoratorInputJs) {
      input = _decoratorInputJs.input;
    }, function (_foundationTypeSystemJs) {
      PoseGraphType = _foundationTypeSystemJs.PoseGraphType;
    }],
    execute: function () {
      /**
       * Add an additional pose onto a base pose.
       *
       * @note When evaluating addition pose, the context is switched to "additive" mode.
       */
      _export("PoseNodeAdditivelyBlend", PoseNodeAdditivelyBlend = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeAdditivelyBlend`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND), _dec3 = poseGraphNodeAppearance({
        themeColor: '#72A869'
      }), _dec4 = input({
        type: PoseGraphType.POSE
      }), _dec5 = input({
        type: PoseGraphType.POSE
      }), _dec6 = input({
        type: PoseGraphType.FLOAT
      }), _dec7 = range([0.0, 1.0, 0.01]), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class PoseNodeAdditivelyBlend extends PoseNode {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "basePose", _descriptor, this);
          _initializerDefineProperty(this, "additivePose", _descriptor2, this);
          _initializerDefineProperty(this, "ratio", _descriptor3, this);
        }
        bind(context) {
          var _this$basePose, _this$additivePose;
          (_this$basePose = this.basePose) == null || _this$basePose.bind(context);
          context._pushAdditiveFlag(true);
          (_this$additivePose = this.additivePose) == null || _this$additivePose.bind(context);
          context._popAdditiveFlag();
        }
        settle(context) {
          var _this$basePose2, _this$additivePose2;
          (_this$basePose2 = this.basePose) == null || _this$basePose2.settle(context);
          (_this$additivePose2 = this.additivePose) == null || _this$additivePose2.settle(context);
        }
        reenter() {
          var _this$basePose3, _this$additivePose3;
          (_this$basePose3 = this.basePose) == null || _this$basePose3.reenter();
          (_this$additivePose3 = this.additivePose) == null || _this$additivePose3.reenter();
        }
        doUpdate(context) {
          var _this$basePose4, _this$additivePose4;
          (_this$basePose4 = this.basePose) == null || _this$basePose4.update(context);
          (_this$additivePose4 = this.additivePose) == null || _this$additivePose4.update(context);
        }
        doEvaluate(context) {
          var _this$basePose$evalua, _this$basePose5;
          const basePose = (_this$basePose$evalua = (_this$basePose5 = this.basePose) == null ? void 0 : _this$basePose5.evaluate(context, PoseTransformSpaceRequirement.LOCAL)) != null ? _this$basePose$evalua : context.pushDefaultedPose();
          if (!this.additivePose) {
            return basePose;
          }
          const additionalPose = this.additivePose.evaluate(context, PoseTransformSpaceRequirement.LOCAL);
          applyDeltaPose(basePose, additionalPose, this.ratio);
          context.popPose();
          return basePose;
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "basePose", [serializable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "additivePose", [serializable, _dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "ratio", [serializable, _dec6, _dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1.0;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});