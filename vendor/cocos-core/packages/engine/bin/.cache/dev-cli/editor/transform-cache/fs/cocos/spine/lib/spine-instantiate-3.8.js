System.register("q-bundled:///fs/cocos/spine/lib/spine-instantiate-3.8.js", ["pal/wasm", "../../core/index.js", "./spine-wasm-utils.js"], function (_export, _context) {
  "use strict";

  var ensureWasmModuleReady, error, shouldUseWasmModule, initWasm, initAsmJS;
  /*
   Copyright (c) 2025 Xiamen Yaji Software Co., Ltd.
  
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

  function waitForSpineWasmInstantiation() {
    const errorReport = msg => {
      error(msg);
    };
    return ensureWasmModuleReady().then(() => {
      //We should use static code here, import operation will cause file copy to cache folder.
      if (shouldUseWasmModule()) {
        return Promise.all([_context.import('external:emscripten/spine/3.8/spine.wasm.js'), _context.import("../../../../virtual/external%253Aemscripten%252Fspine%252F3.8%252Fspine.wasm.js")]).then(([{
          default: wasmFactory
        }, {
          default: spineWasmUrl
        }]) => initWasm(wasmFactory, spineWasmUrl));
      } else {
        return Promise.all([_context.import('external:emscripten/spine/3.8/spine.asm.js'), _context.import("../../../../virtual/external%253Aemscripten%252Fspine%252F3.8%252Fspine.js.mem.js")]).then(([{
          default: asmFactory
        }, {
          default: asmJsMemUrl
        }]) => initAsmJS(asmFactory, asmJsMemUrl));
      }
    }).catch(errorReport);
  }
  _export("waitForSpineWasmInstantiation", waitForSpineWasmInstantiation);
  return {
    setters: [function (_palWasm) {
      ensureWasmModuleReady = _palWasm.ensureWasmModuleReady;
    }, function (_coreIndexJs) {
      error = _coreIndexJs.error;
    }, function (_spineWasmUtilsJs) {
      shouldUseWasmModule = _spineWasmUtilsJs.shouldUseWasmModule;
      initWasm = _spineWasmUtilsJs.initWasm;
      initAsmJS = _spineWasmUtilsJs.initAsmJS;
    }],
    execute: function () {}
  };
});