System.register("q-bundled:///fs/pal/wasm/wasm-native.js", ["../../../virtual/internal%253Aconstants.js", "../../cocos/native-binding/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR, native;
  function instantiateWasm(wasmUrl, importObject) {
    return fetchBuffer(wasmUrl).then(arrayBuffer => WebAssembly.instantiate(arrayBuffer, importObject));
  }
  function fetchBuffer(binaryUrl) {
    return new Promise((resolve, reject) => {
      try {
        if (EDITOR) {
          Editor.Message.request("engine", "query-engine-info").then(info => {
            const externalRoot = `${info.native.path}/external/`;
            binaryUrl = binaryUrl.replace("external:", externalRoot);
            const arrayBuffer = native.fileUtils.getDataFromFile(binaryUrl);
            resolve(arrayBuffer);
          });
          return;
        }
        binaryUrl = `src/cocos-js/${binaryUrl}`;
        const arrayBuffer = native.fileUtils.getDataFromFile(binaryUrl);
        resolve(arrayBuffer);
      } catch (e) {
        reject(e);
      }
    });
  }
  function fetchUrl(binaryUrl) {
    return new Promise((resolve, reject) => {
      try {
        if (EDITOR) {
          Editor.Message.request("engine", "query-engine-info").then(info => {
            const externalRoot = `${info.native.path}/external/`;
            binaryUrl = binaryUrl.replace("external:", externalRoot);
            resolve(binaryUrl);
          });
          return;
        }
        binaryUrl = `src/cocos-js/${binaryUrl}`;
        resolve(binaryUrl);
      } catch (e) {
        reject(e);
      }
    });
  }
  function ensureWasmModuleReady() {
    return Promise.resolve();
  }
  _export({
    ensureWasmModuleReady: ensureWasmModuleReady,
    fetchBuffer: fetchBuffer,
    fetchUrl: fetchUrl,
    instantiateWasm: instantiateWasm
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR = _virtualInternal253AconstantsJs.EDITOR;
    }, function (_cocosNativeBindingIndexJs) {
      native = _cocosNativeBindingIndexJs.native;
    }],
    execute: function () {}
  };
});