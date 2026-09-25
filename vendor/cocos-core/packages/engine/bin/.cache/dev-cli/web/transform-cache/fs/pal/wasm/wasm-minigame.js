System.register("q-bundled:///fs/pal/wasm/wasm-minigame.js", ["../../../virtual/internal%253Aconstants.js", "pal/minigame", "../../cocos/core/utils/path.js", "../../cocos/core/platform/debug.js"], function (_export, _context) {
  "use strict";

  var WASM_SUBPACKAGE, HUAWEI, XIAOMI, TAOBAO_MINIGAME, minigame, basename, log, promiseToLoadWasmModule;
  function instantiateWasm(wasmUrl, importObject) {
    return getPlatformBinaryUrl(wasmUrl).then(url => CCWebAssembly.instantiate(url, importObject));
  }
  function fetchBuffer(binaryUrl) {
    return new Promise((resolve, reject) => {
      getPlatformBinaryUrl(binaryUrl).then(url => {
        globalThis.fsUtils.readArrayBuffer(url, (err, arrayBuffer) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(arrayBuffer);
        });
      }).catch(e => {});
    });
  }
  function fetchUrl(binaryUrl) {
    return new Promise((resolve, reject) => {
      getPlatformBinaryUrl(binaryUrl).then(url => {
        resolve(url);
      }).catch(e => {
        reject(e);
      });
    });
  }
  function loadSubpackage(name) {
    return new Promise((resolve, reject) => {
      if (minigame.loadSubpackage) {
        minigame.loadSubpackage({
          name,
          success() {
            resolve();
          },
          fail(err) {
            log(`Load subpacakge '${name}' failed, maybe we don't need this subpacakge or it's an engine build issue, for detailed: `, err);
            resolve();
          }
        });
      } else {
        reject(new Error(`Subpackage is not supported on this platform`));
      }
    });
  }
  function ensureWasmModuleReady() {
    if (promiseToLoadWasmModule) {
      return promiseToLoadWasmModule;
    }
    return promiseToLoadWasmModule = new Promise((resolve, reject) => {
      if (WASM_SUBPACKAGE) {
        if (HUAWEI) {
          loadSubpackage("__ccWasmAssetSubpkg__").then(() => loadSubpackage("__ccWasmChunkSubpkg__")).then(() => {
            resolve();
          }).catch(reject);
        } else {
          Promise.all(["__ccWasmAssetSubpkg__", "__ccWasmChunkSubpkg__"].map(pkgName => loadSubpackage(pkgName))).then(() => {
            resolve();
          }).catch(reject);
        }
      } else {
        resolve();
      }
    });
  }
  function getPlatformBinaryUrl(binaryUrl) {
    return new Promise(resolve => {
      if (XIAOMI) {
        resolve(`src/cocos-js/${binaryUrl}`);
      }
      if (TAOBAO_MINIGAME && WASM_SUBPACKAGE) {
        resolve(`__ccWasmAssetSubpkg__/${basename(binaryUrl)}`);
      } else {
        resolve(`cocos-js/${binaryUrl}`);
      }
    });
  }
  _export({
    ensureWasmModuleReady: ensureWasmModuleReady,
    fetchBuffer: fetchBuffer,
    fetchUrl: fetchUrl,
    instantiateWasm: instantiateWasm
  });
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      WASM_SUBPACKAGE = _virtualInternal253AconstantsJs.WASM_SUBPACKAGE;
      HUAWEI = _virtualInternal253AconstantsJs.HUAWEI;
      XIAOMI = _virtualInternal253AconstantsJs.XIAOMI;
      TAOBAO_MINIGAME = _virtualInternal253AconstantsJs.TAOBAO_MINIGAME;
    }, function (_palMinigame) {
      minigame = _palMinigame.minigame;
    }, function (_cocosCoreUtilsPathJs) {
      basename = _cocosCoreUtilsPathJs.basename;
    }, function (_cocosCorePlatformDebugJs) {
      log = _cocosCorePlatformDebugJs.log;
    }],
    execute: function () {}
  };
});