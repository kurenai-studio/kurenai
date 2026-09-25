System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/filtering-blend.js", ["../../../../core/data/decorators/index.js", "../../../core/pose.js", "../../../define.js", "../decorator/node.js", "./menu-common.js", "../../animation-mask.js", "./blend-two-pose-base.js"], function (_export, _context) {
  "use strict";

  var ccclass, editable, serializable, type, blendPoseInto, CLASS_NAME_PREFIX_ANIM, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND, AnimationMask, PoseNodeBlendTwoPoseBase, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, PoseNodeFilteringBlend;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
      editable = _coreDataDecoratorsIndexJs.editable;
      serializable = _coreDataDecoratorsIndexJs.serializable;
      type = _coreDataDecoratorsIndexJs.type;
    }, function (_corePoseJs) {
      blendPoseInto = _corePoseJs.blendPoseInto;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_decoratorNodeJs) {
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuCommonJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND = _menuCommonJs.POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND;
    }, function (_animationMaskJs) {
      AnimationMask = _animationMaskJs.AnimationMask;
    }, function (_blendTwoPoseBaseJs) {
      PoseNodeBlendTwoPoseBase = _blendTwoPoseBaseJs.PoseNodeBlendTwoPoseBase;
    }],
    execute: function () {
      _export("PoseNodeFilteringBlend", PoseNodeFilteringBlend = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeFilteringBlend`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND), _dec3 = poseGraphNodeAppearance({
        themeColor: '#72A869'
      }), _dec4 = type(AnimationMask), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = class PoseNodeFilteringBlend extends PoseNodeBlendTwoPoseBase {
        constructor(...args) {
          super(...args);
          _initializerDefineProperty(this, "mask", _descriptor, this);
          this._transformFilter = undefined;
        }
        settle(context) {
          super.settle(context);
          if (this.mask) {
            const transformFilter = context.createTransformFilter(this.mask);
            this._transformFilter = transformFilter;
          }
        }
        doBlend(pose0, pose1, ratio) {
          blendPoseInto(pose0, pose1, ratio, this._transformFilter);
        }
      }, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "mask", [serializable, editable, _dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _class2)) || _class) || _class) || _class));
    }
  };
});