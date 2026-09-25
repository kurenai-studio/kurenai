System.register("q-bundled:///fs/exports/custom-pipeline-post-process.js", ["../cocos/rendering/post-process/index.js"], function (_export, _context) {
  "use strict";

  var postProcess;
  return {
    setters: [function (_cocosRenderingPostProcessIndexJs) {
      postProcess = _cocosRenderingPostProcessIndexJs;
    }],
    execute: function () {
      _export("postProcess", postProcess);
    }
  };
});