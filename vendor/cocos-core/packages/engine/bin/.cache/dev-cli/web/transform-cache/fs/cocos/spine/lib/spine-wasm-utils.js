System.register("q-bundled:///fs/cocos/spine/lib/spine-wasm-utils.js", ["pal/wasm", "../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../misc/webassembly-support.js", "./spine-define.js"], function (_export, _context) {
  "use strict";

  var instantiateWasm, fetchBuffer, NATIVE_CODE_BUNDLE_MODE, sys, NativeCodeBundleMode, overrideSpineDefine, PAGESIZE, PAGECOUNT, MEMORYSIZE, wasmInstance, registerList;
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  function initWasm(wasmFactory, wasmUrl) {
    return new Promise((resolve, reject) => {
      const errorMessage = err => `[Spine]: Spine wasm load failed: ${err}`;
      wasmFactory({
        instantiateWasm(importObject, receiveInstance) {
          // NOTE: the Promise return by instantiateWasm hook can't be caught.
          instantiateWasm(wasmUrl, importObject).then(result => {
            receiveInstance(result.instance, result.module);
          }).catch(err => reject(errorMessage(err)));
        }
      }).then(Instance => {
        wasmInstance = Instance;
        registerList.forEach(cb => {
          cb(wasmInstance);
        });
      }).then(resolve).catch(err => reject(errorMessage(err)));
    });
  }
  function initAsmJS(asmFactory, asmJsMemUrl) {
    return new Promise((resolve, reject) => {
      fetchBuffer(asmJsMemUrl).then(arrayBuffer => {
        const wasmMemory = {};
        wasmMemory.buffer = new ArrayBuffer(MEMORYSIZE);
        const module = {
          wasmMemory,
          memoryInitializerRequest: {
            response: arrayBuffer,
            status: 200
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return asmFactory(module).then(instance => {
          wasmInstance = instance;
          registerList.forEach(cb => {
            cb(wasmInstance);
          });
        });
      }).then(resolve).catch(reject);
    });
  }
  function shouldUseWasmModule() {
    if (NATIVE_CODE_BUNDLE_MODE === NativeCodeBundleMode.BOTH) {
      return sys.hasFeature(sys.Feature.WASM);
    } else if (NATIVE_CODE_BUNDLE_MODE === NativeCodeBundleMode.WASM) {
      return true;
    } else {
      return false;
    }
  }
  _export({
    initWasm: initWasm,
    initAsmJS: initAsmJS,
    shouldUseWasmModule: shouldUseWasmModule
  });
  return {
    setters: [function (_palWasm) {
      instantiateWasm = _palWasm.instantiateWasm;
      fetchBuffer = _palWasm.fetchBuffer;
    }, function (_virtualInternal253AconstantsJs) {
      NATIVE_CODE_BUNDLE_MODE = _virtualInternal253AconstantsJs.NATIVE_CODE_BUNDLE_MODE;
    }, function (_coreIndexJs) {
      sys = _coreIndexJs.sys;
    }, function (_miscWebassemblySupportJs) {
      NativeCodeBundleMode = _miscWebassemblySupportJs.NativeCodeBundleMode;
    }, function (_spineDefineJs) {
      overrideSpineDefine = _spineDefineJs.overrideSpineDefine;
    }],
    execute: function () {
      PAGESIZE = 65536; // 64KiB
      // How many pages of the wasm memory
      // TODO: let this can be canfiguable by user.
      PAGECOUNT = 32 * 16; // How mush memory size of the wasm memory
      MEMORYSIZE = PAGESIZE * PAGECOUNT; // 32 MiB
      wasmInstance = null;
      registerList = [];
      registerList.push(overrideSpineDefine);
    }
  };
});