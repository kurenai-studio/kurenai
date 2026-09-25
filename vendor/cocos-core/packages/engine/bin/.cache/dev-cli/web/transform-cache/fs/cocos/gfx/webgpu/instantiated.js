System.register("q-bundled:///fs/cocos/gfx/webgpu/instantiated.js", ["pal/wasm", "../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "../../misc/webassembly-support.js", "./define.js"], function (_export, _context) {
  "use strict";

  var fetchBuffer, ensureWasmModuleReady, instantiateWasm, NATIVE_CODE_BUNDLE_MODE, error, sys, NativeCodeBundleMode, overrideWebGPUDefine, PAGESIZE, PAGECOUNT, MEMORYSIZE, wasmInstance, registerList, WEBGPU_WASM;
  function initWasm(wasmFactory, wasmUrl) {
    return new Promise((resolve, reject) => {
      const errorMessage = err => `[WebGPU]: WebGPU wasm load failed: ${err}`;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      wasmFactory({
        instantiateWasm(importObject, receiveInstance) {
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
  async function waitForWebGPUWasmInstantiation() {
    const errorReport = msg => {
      error('Error during WebGPU Wasm instantiation:', msg);
    };
    try {
      await ensureWasmModuleReady();
      if (shouldUseWasmModule()) {
        const [glslModule, glslWasmModule, twgslModule, twgslWasmModule] = await Promise.all([_context.import('external:emscripten/webgpu/glslang.js'), _context.import("../../../../virtual/external%253Aemscripten%252Fwebgpu%252Fglslang.wasm.js"), _context.import('external:emscripten/webgpu/twgsl.js'), _context.import("../../../../virtual/external%253Aemscripten%252Fwebgpu%252Ftwgsl.wasm.js")]);
        const glslFactory = glslModule.default;
        const glslWasmUrl = glslWasmModule.default;
        const twgslFactory = twgslModule.default;
        const twgslWasmUrl = twgslWasmModule.default;
        await Promise.all([initWasm(glslFactory, glslWasmUrl), initWasm(twgslFactory, twgslWasmUrl)]);
      } else {
        throw new Error('Wasm module is not supported in this environment.');
      }
    } catch (error) {
      errorReport(error);
    }
  }
  _export("waitForWebGPUWasmInstantiation", waitForWebGPUWasmInstantiation);
  return {
    setters: [function (_palWasm) {
      fetchBuffer = _palWasm.fetchBuffer;
      ensureWasmModuleReady = _palWasm.ensureWasmModuleReady;
      instantiateWasm = _palWasm.instantiateWasm;
    }, function (_virtualInternal253AconstantsJs) {
      NATIVE_CODE_BUNDLE_MODE = _virtualInternal253AconstantsJs.NATIVE_CODE_BUNDLE_MODE;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
      sys = _coreIndexJs.sys;
    }, function (_miscWebassemblySupportJs) {
      NativeCodeBundleMode = _miscWebassemblySupportJs.NativeCodeBundleMode;
    }, function (_defineJs) {
      overrideWebGPUDefine = _defineJs.overrideWebGPUDefine;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      PAGESIZE = 65536; // 64KiB
      // How many pages of the wasm memory
      // TODO: let this can be canfiguable by user.
      PAGECOUNT = 32 * 16; // How mush memory size of the wasm memory
      MEMORYSIZE = PAGESIZE * PAGECOUNT; // 32 MiB
      wasmInstance = null;
      registerList = [];
      registerList.push(overrideWebGPUDefine);
      _export("WEBGPU_WASM", WEBGPU_WASM = 1);
    }
  };
});