System.register("q-bundled:///fs/cocos/game/index.js", ["./deprecated.js", "./splash-screen.js", "./director.js", "./game.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_deprecatedJs) {}, function (_splashScreenJs) {}, function (_directorJs) {
      var _exportObj = {};
      for (var _key in _directorJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _directorJs[_key];
      }
      _export(_exportObj);
    }, function (_gameJs) {
      var _exportObj2 = {};
      for (var _key2 in _gameJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _gameJs[_key2];
      }
      _export(_exportObj2);
    }],
    execute: function () {}
  };
});