System.register("q-bundled:///fs/exports/custom-pipeline.js", ["../cocos/core/global-exports.js", "../cocos/rendering/custom/index.js"], function (_export, _context) {
  "use strict";

  var legacyCC, rendering;
  return {
    setters: [function (_cocosCoreGlobalExportsJs) {
      legacyCC = _cocosCoreGlobalExportsJs.legacyCC;
    }, function (_cocosRenderingCustomIndexJs) {
      rendering = _cocosRenderingCustomIndexJs;
    }],
    execute: function () {
      _export("rendering", rendering);
      legacyCC.rendering = rendering;
    }
  };
});