System.register("q-bundled:///fs/cocos/3d/skeletal-animation/index.js", ["./data-pool-manager.js", "./skeletal-animation-data-hub.js", "./skeletal-animation-state.js", "./skeletal-animation.js", "./deprecated.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_dataPoolManagerJs) {}, function (_skeletalAnimationDataHubJs) {
      var _exportObj = {};
      for (var _key in _skeletalAnimationDataHubJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _skeletalAnimationDataHubJs[_key];
      }
      _export(_exportObj);
    }, function (_skeletalAnimationStateJs) {
      var _exportObj2 = {};
      for (var _key2 in _skeletalAnimationStateJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _skeletalAnimationStateJs[_key2];
      }
      _export(_exportObj2);
    }, function (_skeletalAnimationJs) {
      var _exportObj3 = {};
      for (var _key3 in _skeletalAnimationJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _skeletalAnimationJs[_key3];
      }
      _export(_exportObj3);
    }, function (_deprecatedJs) {
      var _exportObj4 = {};
      for (var _key4 in _deprecatedJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _deprecatedJs[_key4];
      }
      _export(_exportObj4);
    }],
    execute: function () {}
  };
});