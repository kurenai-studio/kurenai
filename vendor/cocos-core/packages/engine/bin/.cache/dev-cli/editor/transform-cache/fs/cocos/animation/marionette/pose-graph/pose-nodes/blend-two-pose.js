System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/pose-nodes/blend-two-pose.js", ["../../../../core/data/decorators/index.js", "../../../core/pose.js", "../../../define.js", "../decorator/node.js", "./menu-common.js", "./blend-two-pose-base.js"], function (_export, _context) {
  "use strict";

  var ccclass, blendPoseInto, CLASS_NAME_PREFIX_ANIM, poseGraphNodeAppearance, poseGraphNodeCategory, POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND, PoseNodeBlendTwoPoseBase, _dec, _dec2, _dec3, _class, PoseNodeBlendTwoPose;
  return {
    setters: [function (_coreDataDecoratorsIndexJs) {
      ccclass = _coreDataDecoratorsIndexJs.ccclass;
    }, function (_corePoseJs) {
      blendPoseInto = _corePoseJs.blendPoseInto;
    }, function (_defineJs) {
      CLASS_NAME_PREFIX_ANIM = _defineJs.CLASS_NAME_PREFIX_ANIM;
    }, function (_decoratorNodeJs) {
      poseGraphNodeAppearance = _decoratorNodeJs.poseGraphNodeAppearance;
      poseGraphNodeCategory = _decoratorNodeJs.poseGraphNodeCategory;
    }, function (_menuCommonJs) {
      POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND = _menuCommonJs.POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND;
    }, function (_blendTwoPoseBaseJs) {
      PoseNodeBlendTwoPoseBase = _blendTwoPoseBaseJs.PoseNodeBlendTwoPoseBase;
    }],
    execute: function () {
      _export("PoseNodeBlendTwoPose", PoseNodeBlendTwoPose = (_dec = ccclass(`${CLASS_NAME_PREFIX_ANIM}PoseNodeBlendTwoPose`), _dec2 = poseGraphNodeCategory(POSE_GRAPH_NODE_MENU_PREFIX_POSE_BLEND), _dec3 = poseGraphNodeAppearance({
        themeColor: '#72A869'
      }), _dec(_class = _dec2(_class = _dec3(_class = class PoseNodeBlendTwoPose extends PoseNodeBlendTwoPoseBase {
        doBlend(pose0, pose1, ratio) {
          return blendPoseInto(pose0, pose1, ratio);
        }
      }) || _class) || _class) || _class));
    }
  };
});