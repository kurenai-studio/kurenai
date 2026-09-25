System.register("q-bundled:///fs/editor/src/marionette/pose-graph/drag/handlers/play-motion.js", ["../registry.js", "../../../../../../cocos/animation/marionette/pose-graph/pose-nodes/play-motion.js", "../../../../../../cocos/animation/marionette/motion/index.js", "../../../../../../cocos/animation/animation-clip.js"], function (_export, _context) {
  "use strict";

  var registerCreatePoseNodeOnAssetDragHandler, PoseNodePlayMotion, ClipMotion, AnimationClip;
  return {
    setters: [function (_registryJs) {
      registerCreatePoseNodeOnAssetDragHandler = _registryJs.registerCreatePoseNodeOnAssetDragHandler;
    }, function (_cocosAnimationMarionettePoseGraphPoseNodesPlayMotionJs) {
      PoseNodePlayMotion = _cocosAnimationMarionettePoseGraphPoseNodesPlayMotionJs.PoseNodePlayMotion;
    }, function (_cocosAnimationMarionetteMotionIndexJs) {
      ClipMotion = _cocosAnimationMarionetteMotionIndexJs.ClipMotion;
    }, function (_cocosAnimationAnimationClipJs) {
      AnimationClip = _cocosAnimationAnimationClipJs.AnimationClip;
    }],
    execute: function () {
      registerCreatePoseNodeOnAssetDragHandler(AnimationClip, {
        displayName: 'i18n:ENGINE.classes.cc.animation.PoseNodePlayMotion.createPoseNodeOnAssetDragHandler.displayName',
        handle: asset => {
          const node = new PoseNodePlayMotion();
          const clipMotion = node.motion = new ClipMotion();
          clipMotion.clip = asset;
          return node;
        }
      });
    }
  };
});