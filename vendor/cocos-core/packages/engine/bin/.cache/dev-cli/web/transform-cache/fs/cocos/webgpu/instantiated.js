System.register("q-bundled:///fs/cocos/webgpu/instantiated.js", ["../../../virtual/internal%253Aconstants.js", "../../../virtual/external%253Aemscripten%252Fwebgpu%252Fwebgpu_wasm.wasm.js", "../../../virtual/external%253Aemscripten%252Fwebgpu%252Fglslang.wasm.js", "../../../virtual/external%253Aemscripten%252Fwebgpu%252Ftwgsl.wasm.js", "external:emscripten/webgpu/webgpu_wasm.js", "external:emscripten/webgpu/glslang.js", "external:emscripten/webgpu/twgsl.js", "../core/global-exports.js", "../misc/webassembly-support.js"], function (_export, _context) {
  "use strict";

  var NATIVE_CODE_BUNDLE_MODE, WEBGPU, webgpuUrl, glslangUrl, twgslUrl, wasmDevice, glslangLoader, twgslLoader, legacyCC, NativeCodeBundleMode, glslangWasmModule, twgslModule, gfx, webgpuAdapter, promiseForWebGPUInstantiation;
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      NATIVE_CODE_BUNDLE_MODE = _virtualInternal253AconstantsJs.NATIVE_CODE_BUNDLE_MODE;
      WEBGPU = _virtualInternal253AconstantsJs.WEBGPU;
    }, function (_virtualExternal253Aemscripten252Fwebgpu252Fwebgpu_wasmWasmJs) {
      webgpuUrl = _virtualExternal253Aemscripten252Fwebgpu252Fwebgpu_wasmWasmJs.default;
    }, function (_virtualExternal253Aemscripten252Fwebgpu252FglslangWasmJs) {
      glslangUrl = _virtualExternal253Aemscripten252Fwebgpu252FglslangWasmJs.default;
    }, function (_virtualExternal253Aemscripten252Fwebgpu252FtwgslWasmJs) {
      twgslUrl = _virtualExternal253Aemscripten252Fwebgpu252FtwgslWasmJs.default;
    }, function (_externalEmscriptenWebgpuWebgpu_wasmJs) {
      wasmDevice = _externalEmscriptenWebgpuWebgpu_wasmJs.default;
    }, function (_externalEmscriptenWebgpuGlslangJs) {
      glslangLoader = _externalEmscriptenWebgpuGlslangJs.default;
    }, function (_externalEmscriptenWebgpuTwgslJs) {
      twgslLoader = _externalEmscriptenWebgpuTwgslJs.default;
    }, function (_coreGlobalExportsJs) {
      legacyCC = _coreGlobalExportsJs.legacyCC;
    }, function (_miscWebassemblySupportJs) {
      NativeCodeBundleMode = _miscWebassemblySupportJs.NativeCodeBundleMode;
    }],
    execute: function () {
      /// <reference path="../../@types/consts.d.ts"/>
      /// <reference path="../../native/external/emscripten/external-wasm.d.ts"/>
      /// <reference path="../../native/external/emscripten/webgpu/webgpu.d.ts"/>
      /* eslint-disable @typescript-eslint/no-floating-promises */
      /* eslint-disable no-void */
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("glslangWasmModule", glslangWasmModule = {
        glslang: null
      });
      _export("twgslModule", twgslModule = {
        twgsl: null
      });
      _export("gfx", gfx = legacyCC.gfx = {
        wasmBinary: null,
        nativeDevice: null
      });
      _export("webgpuAdapter", webgpuAdapter = {
        adapter: null,
        device: null
      });
      _export("promiseForWebGPUInstantiation", promiseForWebGPUInstantiation = (() => {
        if (WEBGPU && NATIVE_CODE_BUNDLE_MODE !== NativeCodeBundleMode.ASMJS) {
          // TODO: we need to support AsmJS fallback option
          return Promise.all([glslangLoader(new URL(glslangUrl, _context.meta.url).href).then(res => {
            glslangWasmModule.glslang = res;
          }), twgslLoader(new URL(twgslUrl, _context.meta.url).href).then(data => {
            twgslModule.twgsl = data;
          }), new Promise(resolve => {
            fetch(new URL(webgpuUrl, _context.meta.url).href).then(response => {
              response.arrayBuffer().then(buffer => {
                gfx.wasmBinary = buffer;
                wasmDevice(gfx).then(() => {
                  legacyCC.WebGPUDevice = gfx.CCWGPUDevice;
                  resolve();
                });
              });
            });
          }), new Promise(resolve => {
            navigator.gpu.requestAdapter().then(adapter => {
              adapter.requestDevice().then(device => {
                webgpuAdapter.adapter = adapter;
                webgpuAdapter.device = device;
                console.log(gfx);
                resolve();
              });
            });
          })]).then(() => Promise.resolve());
        }
        return Promise.resolve();
      })());
      if (WEBGPU && NATIVE_CODE_BUNDLE_MODE !== NativeCodeBundleMode.ASMJS) {
        const intervalId = setInterval(() => {
          if (legacyCC.game) {
            legacyCC.game.onPreInfrastructureInitDelegate.add(() => promiseForWebGPUInstantiation);
            clearInterval(intervalId);
          }
        }, 10);
      }
    }
  };
});