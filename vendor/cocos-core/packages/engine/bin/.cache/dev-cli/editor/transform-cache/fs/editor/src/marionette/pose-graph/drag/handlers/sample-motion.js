System.register("q-bundled:///fs/editor/src/marionette/pose-graph/drag/handlers/sample-motion.js", ["../registry.js", "../../../../../../cocos/animation/marionette/pose-graph/pose-nodes/sample-motion.js", "../../../../../../cocos/animation/marionette/motion/index.js", "../../../../../../cocos/animation/animation-clip.js"], function (_export, _context) {
  "use strict";

  var registerCreatePoseNodeOnAssetDragHandler, PoseNodeSampleMotion, ClipMotion, AnimationClip;
  return {
    setters: [function (_registryJs) {
      registerCreatePoseNodeOnAssetDragHandler = _registryJs.registerCreatePoseNodeOnAssetDragHandler;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesSampleMotionJs) {
      PoseNodeSampleMotion = _cocosAnimationMarionettePoseGraphPoseNodesSampleMotionJs.PoseNodeSampleMotion;
    }, function (_cocosAnimationMarionetteMotionIndexJs) {
      ClipMotion = _cocosAnimationMarionetteMotionIndexJs.ClipMotion;
    }, function (_cocosAnimationAnimationClipJs) {
      AnimationClip = _cocosAnimationAnimationClipJs.AnimationClip;
    }],
    execute: function () {
      registerCreatePoseNodeOnAssetDragHandler(AnimationClip, {
        displayName: 'i18n:ENGINE.classes.cc.animation.PoseNodeSampleMotion.createPoseNodeOnAssetDragHandler.displayName',
        handle: asset => {
          const node = new PoseNodeSampleMotion();
          const clipMotion = node.motion = new ClipMotion();
          clipMotion.clip = asset;
          return node;
        }
      });
    }
  };
});