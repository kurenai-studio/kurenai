System.register("q-bundled:///fs/pal/wasm/wasm-web.js", ["../../../virtual/internal%253Aconstants.js"], function (_export, _context) {
  "use strict";

  var EDITOR, PREVIEW;
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
            const fs = require("fs");
            const arrayBuffer = fs.readFileSync(binaryUrl);
            resolve(arrayBuffer);
          });
          return;
        } else if (PREVIEW) {
          fetch(`/engine_external/?url=${binaryUrl}`).then(response => response.arrayBuffer().then(resolve)).catch(e => {});
          return;
        }
        binaryUrl = new URL(binaryUrl, _context.meta.url).href;
        fetch(binaryUrl).then(response => response.arrayBuffer().then(resolve)).catch(e => {});
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
        } else if (PREVIEW) {
          resolve(`/engine_external/?url=${binaryUrl}`);
          return;
        }
        binaryUrl = new URL(binaryUrl, _context.meta.url).href;
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
      PREVIEW = _virtualInternal253AconstantsJs.PREVIEW;
    }],
    execute: function () {}
  };
});