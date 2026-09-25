System.register("q-bundled:///fs/editor/exports/embedded-player.js", ["../../cocos/animation/animation-clip.js", "../../cocos/animation/embedded-player/embedded-player.js", "../../cocos/animation/embedded-player/embedded-particle-system-player.js", "../../cocos/animation/embedded-player/embedded-animation-clip-player.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_cocosAnimationAnimationClipJs) {
      _export({
        embeddedPlayerCountTag: _cocosAnimationAnimationClipJs.embeddedPlayerCountTag,
        getEmbeddedPlayersTag: _cocosAnimationAnimationClipJs.getEmbeddedPlayersTag,
        addEmbeddedPlayerTag: _cocosAnimationAnimationClipJs.addEmbeddedPlayerTag,
        removeEmbeddedPlayerTag: _cocosAnimationAnimationClipJs.removeEmbeddedPlayerTag,
        clearEmbeddedPlayersTag: _cocosAnimationAnimationClipJs.clearEmbeddedPlayersTag
      });
    }, function (_cocosAnimationEmbeddedPlayerEmbeddedPlayerJs) {
      _export("EmbeddedPlayer", _cocosAnimationEmbeddedPlayerEmbeddedPlayerJs.EmbeddedPlayer);
    }, function (_cocosAnimationEmbeddedPlayerEmbeddedParticleSystemPlayerJs) {
      _export("EmbeddedParticleSystemPlayable", _cocosAnimationEmbeddedPlayerEmbeddedParticleSystemPlayerJs.EmbeddedParticleSystemPlayable);
    }, function (_cocosAnimationEmbeddedPlayerEmbeddedAnimationClipPlayerJs) {
      _export("EmbeddedAnimationClipPlayable", _cocosAnimationEmbeddedPlayerEmbeddedAnimationClipPlayerJs.EmbeddedAnimationClipPlayable);
    }],
    execute: function () {}
  };
});