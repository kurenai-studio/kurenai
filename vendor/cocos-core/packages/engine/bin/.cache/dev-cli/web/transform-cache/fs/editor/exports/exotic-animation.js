System.register("q-bundled:///fs/editor/exports/exotic-animation.js", ["../../cocos/animation/animation-clip.js", "../../cocos/animation/exotic-animation/exotic-animation.js", "../../cocos/animation/tracks/array-track.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_cocosAnimationAnimationClipJs) {
      _export({
        exoticAnimationTag: _cocosAnimationAnimationClipJs.exoticAnimationTag,
        additiveSettingsTag: _cocosAnimationAnimationClipJs.additiveSettingsTag,
        AnimationClipAdditiveSettings: _cocosAnimationAnimationClipJs.AnimationClipAdditiveSettings
      });
    }, function (_cocosAnimationExoticAnimationExoticAnimationJs) {
      _export("ExoticAnimation", _cocosAnimationExoticAnimationExoticAnimationJs.ExoticAnimation);
    }, function (_cocosAnimationTracksArrayTrackJs) {
      _export("RealArrayTrack", _cocosAnimationTracksArrayTrackJs.RealArrayTrack);
    }],
    execute: function () {}
  };
});