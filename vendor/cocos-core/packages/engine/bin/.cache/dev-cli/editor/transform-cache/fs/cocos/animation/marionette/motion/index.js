System.register("q-bundled:///fs/cocos/animation/marionette/motion/index.js", ["./motion.js", "./clip-motion.js", "./animation-blend.js", "./animation-blend-1d.js", "./animation-blend-2d.js", "./animation-blend-direct.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_motionJs) {
      _export("Motion", _motionJs.Motion);
    }, function (_clipMotionJs) {
      _export("ClipMotion", _clipMotionJs.ClipMotion);
    }, function (_animationBlendJs) {
      _export("AnimationBlend", _animationBlendJs.AnimationBlend);
    }, function (_animationBlend1dJs) {
      _export("AnimationBlend1D", _animationBlend1dJs.AnimationBlend1D);
    }, function (_animationBlend2dJs) {
      _export("AnimationBlend2D", _animationBlend2dJs.AnimationBlend2D);
    }, function (_animationBlendDirectJs) {
      _export("AnimationBlendDirect", _animationBlendDirectJs.AnimationBlendDirect);
    }],
    execute: function () {}
  };
});