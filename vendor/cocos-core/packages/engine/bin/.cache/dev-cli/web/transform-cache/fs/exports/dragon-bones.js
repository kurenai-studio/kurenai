System.register("q-bundled:///fs/exports/dragon-bones.js", ["../cocos/dragon-bones/index.js"], function (_export, _context) {
  "use strict";

  var dragonBones;
  return {
    setters: [function (_cocosDragonBonesIndexJs) {
      dragonBones = _cocosDragonBonesIndexJs;
    }],
    execute: function () {
      _export("dragonBones", dragonBones);
    }
  };
});