System.register("q-bundled:///fs/cocos/3d/misc/mesh-codec.js", ["../../../../virtual/internal%253Aconstants.js", "pal/wasm", "../../core/index.js", "../../game/index.js", "../../misc/webassembly-support.js"], function (_export, _context) {
  "use strict";

  var CULL_MESHOPT, NATIVE_CODE_BUNDLE_MODE, ensureWasmModuleReady, instantiateWasm, sys, error, debugID, game, NativeCodeBundleMode, MeshoptDecoder;
  function initDecoderASM(asm_factory) {
    return Promise.all([asm_factory.ready]).then(() => {
      MeshoptDecoder.supported = asm_factory.supported;
      MeshoptDecoder.ready = Promise.resolve();
      MeshoptDecoder.decodeVertexBuffer = asm_factory.decodeVertexBuffer;
      MeshoptDecoder.decodeIndexBuffer = asm_factory.decodeIndexBuffer;
      MeshoptDecoder.decodeIndexSequence = asm_factory.decodeIndexSequence;
      MeshoptDecoder.decodeGltfBuffer = asm_factory.decodeGltfBuffer;
      MeshoptDecoder.useWorkers = asm_factory.useWorkers;
      MeshoptDecoder.decodeGltfBufferAsync = asm_factory.decodeGltfBufferAsync;
      debugID(14202);
    });
  }
  function initDecoderWASM(wasm_factory, wasm_url) {
    function instantiate(importObject) {
      return instantiateWasm(wasm_url, importObject);
    }
    return Promise.all([wasm_factory.ready(instantiate)]).then(() => {
      MeshoptDecoder.supported = wasm_factory.supported;
      MeshoptDecoder.ready = Promise.resolve();
      MeshoptDecoder.decodeVertexBuffer = wasm_factory.decodeVertexBuffer;
      MeshoptDecoder.decodeIndexBuffer = wasm_factory.decodeIndexBuffer;
      MeshoptDecoder.decodeIndexSequence = wasm_factory.decodeIndexSequence;
      MeshoptDecoder.decodeGltfBuffer = wasm_factory.decodeGltfBuffer;
      MeshoptDecoder.useWorkers = wasm_factory.useWorkers;
      MeshoptDecoder.decodeGltfBufferAsync = wasm_factory.decodeGltfBufferAsync;
      debugID(14203);
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
  function InitDecoder() {
    const errorReport = msg => {
      error(msg);
    };
    return ensureWasmModuleReady().then(() => {
      if (shouldUseWasmModule()) {
        return Promise.all([_context.import('external:emscripten/meshopt/meshopt_decoder.wasm.js'), _context.import("../../../../virtual/external%253Aemscripten%252Fmeshopt%252Fmeshopt_decoder.wasm.wasm.js")]).then(([{
          default: meshopt_wasm_factory
        }, {
          default: meshopt_wasm_url
        }]) => initDecoderWASM(meshopt_wasm_factory, meshopt_wasm_url));
      } else {
        return _context.import('external:emscripten/meshopt/meshopt_decoder.asm.js').then(({
          default: meshopt_asm_factory
        }) => initDecoderASM(meshopt_asm_factory));
      }
    }).catch(errorReport);
  }
  _export("InitDecoder", InitDecoder);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      CULL_MESHOPT = _virtualInternal253AconstantsJs.CULL_MESHOPT;
      NATIVE_CODE_BUNDLE_MODE = _virtualInternal253AconstantsJs.NATIVE_CODE_BUNDLE_MODE;
    }, function (_palWasm) {
      ensureWasmModuleReady = _palWasm.ensureWasmModuleReady;
      instantiateWasm = _palWasm.instantiateWasm;
    }, function (_coreIndexJs) {
      sys = _coreIndexJs.sys;
      error = _coreIndexJs.error;
      debugID = _coreIndexJs.debugID;
    }, function (_gameIndexJs) {
      game = _gameIndexJs.game;
    }, function (_miscWebassemblySupportJs) {
      NativeCodeBundleMode = _miscWebassemblySupportJs.NativeCodeBundleMode;
    }],
    execute: function () {
      /*
       Copyright (c) 2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
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
      /** @mangle */
      _export("MeshoptDecoder", MeshoptDecoder = {});
      if (!CULL_MESHOPT) {
        game.onPostInfrastructureInitDelegate.add(InitDecoder);
      }
    }
  };
});