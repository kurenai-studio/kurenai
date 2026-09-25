System.register("q-bundled:///fs/exports/spine.js", ["../cocos/spine/index.js"], function (_export, _context) {
  "use strict";

  var sp;
  return {
    setters: [function (_cocosSpineIndexJs) {
      sp = _cocosSpineIndexJs;
      _export("loadWasmModuleSpine", _cocosSpineIndexJs.loadWasmModuleSpine);
    }],
    execute: function () {
      _export("sp", sp);
    }
  };
});