System.register("q-bundled:///fs/cocos/animation/animation.js", ["./embedded-player/embedded-player.js", "./embedded-player/embedded-animation-clip-player.js", "./embedded-player/embedded-particle-system-player.js", "./tracks/array-track.js", "./target-path.js", "./value-proxy.js", "./value-proxy-factories/uniform.js", "./value-proxy-factories/morph-weights.js", "./cubic-spline-value.js", "./tracks/track.js", "./tracks/real-track.js", "./tracks/vector-track.js", "./tracks/quat-track.js", "./tracks/color-track.js", "./tracks/size-track.js", "./tracks/object-track.js", "./marionette/runtime-exports.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_embeddedPlayerEmbeddedPlayerJs) {}, function (_embeddedPlayerEmbeddedAnimationClipPlayerJs) {}, function (_embeddedPlayerEmbeddedParticleSystemPlayerJs) {}, function (_tracksArrayTrackJs) {}, function (_targetPathJs) {
      var _exportObj = {};
      for (var _key in _targetPathJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _targetPathJs[_key];
      }
      _export(_exportObj);
    }, function (_valueProxyJs) {
      var _exportObj2 = {};
      for (var _key2 in _valueProxyJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _valueProxyJs[_key2];
      }
      _export(_exportObj2);
    }, function (_valueProxyFactoriesUniformJs) {
      _export("UniformProxyFactory", _valueProxyFactoriesUniformJs.UniformProxyFactory);
    }, function (_valueProxyFactoriesMorphWeightsJs) {
      _export({
        MorphWeightValueProxy: _valueProxyFactoriesMorphWeightsJs.MorphWeightValueProxy,
        MorphWeightsValueProxy: _valueProxyFactoriesMorphWeightsJs.MorphWeightsValueProxy,
        MorphWeightsAllValueProxy: _valueProxyFactoriesMorphWeightsJs.MorphWeightsAllValueProxy
      });
    }, function (_cubicSplineValueJs) {
      var _exportObj3 = {};
      for (var _key3 in _cubicSplineValueJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _cubicSplineValueJs[_key3];
      }
      _export(_exportObj3);
    }, function (_tracksTrackJs) {
      _export({
        Track: _tracksTrackJs.Track,
        TrackPath: _tracksTrackJs.TrackPath
      });
    }, function (_tracksRealTrackJs) {
      _export("RealTrack", _tracksRealTrackJs.RealTrack);
    }, function (_tracksVectorTrackJs) {
      _export("VectorTrack", _tracksVectorTrackJs.VectorTrack);
    }, function (_tracksQuatTrackJs) {
      _export("QuatTrack", _tracksQuatTrackJs.QuatTrack);
    }, function (_tracksColorTrackJs) {
      _export("ColorTrack", _tracksColorTrackJs.ColorTrack);
    }, function (_tracksSizeTrackJs) {
      _export("SizeTrack", _tracksSizeTrackJs.SizeTrack);
    }, function (_tracksObjectTrackJs) {
      _export("ObjectTrack", _tracksObjectTrackJs.ObjectTrack);
    }, function (_marionetteRuntimeExportsJs) {
      var _exportObj4 = {};
      for (var _key4 in _marionetteRuntimeExportsJs) {
        if (_key4 !== "default" && _key4 !== "__esModule") _exportObj4[_key4] = _marionetteRuntimeExportsJs[_key4];
      }
      _export(_exportObj4);
    }],
    execute: function () {}
  };
});