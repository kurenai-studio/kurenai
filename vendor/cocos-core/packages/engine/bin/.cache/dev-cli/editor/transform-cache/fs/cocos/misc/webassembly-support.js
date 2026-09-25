System.register("q-bundled:///fs/cocos/misc/webassembly-support.js", [], function (_export, _context) {
  "use strict";

  var NativeCodeBundleMode;
  return {
    setters: [],
    execute: function () {
      /**
       * An enum type for NATIVE_CODE_BUNDLE_MODE constant, making the support mode more readable.
       */
      _export("NativeCodeBundleMode", NativeCodeBundleMode = {
        ASMJS: 0,
        WASM: 1,
        BOTH: 2
      });
    }
  };
});