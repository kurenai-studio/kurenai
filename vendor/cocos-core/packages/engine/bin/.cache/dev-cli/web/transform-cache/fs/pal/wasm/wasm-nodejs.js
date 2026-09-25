System.register("q-bundled:///fs/pal/wasm/wasm-nodejs.js", [], function (_export, _context) {
  "use strict";

  function instantiateWasm(wasmUrl, importObject) {
    return fetchBuffer(wasmUrl).then(arrayBuffer => WebAssembly.instantiate(arrayBuffer, importObject));
  }
  function fetchBuffer(binaryUrl) {
    return new Promise((resolve, reject) => {
      try {
        const externalRoot = `${globalThis.nodeEnv.enginePath}/native/external/`;
        binaryUrl = binaryUrl.replace("external:", externalRoot);
        const fs = globalThis.nodeEnv.require("fs-extra");
        const arrayBuffer = fs.readFileSync(binaryUrl);
        resolve(arrayBuffer);
      } catch (e) {
        reject(e);
      }
    });
  }
  function fetchUrl(binaryUrl) {
    return new Promise((resolve, reject) => {
      try {
        const externalRoot = `${globalThis.nodeEnv.enginePath}/native/external/`;
        binaryUrl = binaryUrl.replace("external:", externalRoot);
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
    setters: [],
    execute: function () {}
  };
});