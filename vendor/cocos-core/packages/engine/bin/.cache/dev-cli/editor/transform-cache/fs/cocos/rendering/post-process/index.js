System.register("q-bundled:///fs/cocos/rendering/post-process/index.js", ["../custom/index.js", "./post-process-builder.js", "./utils/pass-context.js", "./components/index.js", "./passes/index.js"], function (_export, _context) {
  "use strict";

  var setCustomPipeline, PostProcessBuilder;
  return {
    setters: [function (_customIndexJs) {
      setCustomPipeline = _customIndexJs.setCustomPipeline;
    }, function (_postProcessBuilderJs) {
      PostProcessBuilder = _postProcessBuilderJs.PostProcessBuilder;
      var _exportObj = {};
      for (var _key in _postProcessBuilderJs) {
        if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _postProcessBuilderJs[_key];
      }
      _export(_exportObj);
    }, function (_utilsPassContextJs) {}, function (_componentsIndexJs) {
      var _exportObj2 = {};
      for (var _key2 in _componentsIndexJs) {
        if (_key2 !== "default" && _key2 !== "__esModule") _exportObj2[_key2] = _componentsIndexJs[_key2];
      }
      _export(_exportObj2);
    }, function (_passesIndexJs) {
      var _exportObj3 = {};
      for (var _key3 in _passesIndexJs) {
        if (_key3 !== "default" && _key3 !== "__esModule") _exportObj3[_key3] = _passesIndexJs[_key3];
      }
      _export(_exportObj3);
    }],
    execute: function () {
      setCustomPipeline('Forward', new PostProcessBuilder());
      setCustomPipeline('Custom', new PostProcessBuilder());
    }
  };
});