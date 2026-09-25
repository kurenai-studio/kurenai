System.register("q-bundled:///fs/pal/system-info/enum-type/index.js", ["./browser-type.js", "./language.js", "./network-type.js", "./operating-system.js", "./platform.js", "./feature.js"], function (_export, _context) {
  "use strict";

  return {
    setters: [function (_browserTypeJs) {
      _export("BrowserType", _browserTypeJs.BrowserType);
    }, function (_languageJs) {
      _export("Language", _languageJs.Language);
    }, function (_networkTypeJs) {
      _export("NetworkType", _networkTypeJs.NetworkType);
    }, function (_operatingSystemJs) {
      _export("OS", _operatingSystemJs.OS);
    }, function (_platformJs) {
      _export("Platform", _platformJs.Platform);
    }, function (_featureJs) {
      _export("Feature", _featureJs.Feature);
    }],
    execute: function () {}
  };
});